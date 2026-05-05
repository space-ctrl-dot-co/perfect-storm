/* ─── FORCE SIMULATION WORKER ────────────────────────────────────────────────
   Runs the full 9-layer physics tick off the main thread.
   Main thread sends control messages; worker posts {type:'tick', positions}
   back every frame while the simulation is hot.

   Message protocol (main → worker):
     { type:'init',       nodes, sectorGroups, sectorAffinity, sectorHome, alpha }
     { type:'setVisible', tickers }           — array of visible ticker IDs
     { type:'setClusters', clusters }          — current cluster definitions
     { type:'setStocks',  stocks }             — current stock pill data
     { type:'setParams',  tension, clusterPad, hiddenSectors, showSectors, boundedLayout }
     { type:'reheat',     temp }               — boost alpha
     { type:'pin',        id, x, y }           — fix node during drag
     { type:'release',    id }                 — unfix node after drag
     { type:'reset',      basePositions }      — snap back to grid + full reheat

   Message protocol (worker → main):
     { type:'tick',  positions }   — {[ticker]: {x, y}} map, sent every active frame
     { type:'idle' }               — sim settled; main thread can slow its poll
   ────────────────────────────────────────────────────────────────────────── */

// ── Simulation constants (mirrors App.jsx) ────────────────────────────────
const FORCE_ALPHA_DECAY     = 0.018;
const FORCE_ALPHA_MIN       = 0.002;
const FORCE_DAMPING         = 0.70;
const FORCE_CLUSTER_K       = 0.055;
const FORCE_REPEL_K         = 2.8;
const FORCE_CENTER_K        = 0.003;
const FORCE_AFFINITY_K      = 0.008;
const FORCE_SECT_REPEL_K    = 0.030;
const FORCE_SECT_REPEL_DIST = 280;

const TICKER_HH = 11;
const TICKER_PW = 44;
const TICKER_PH = 22;
const SVG_W     = 1600;
const SVG_H     = 760;

const PILL_WEIGHT = { active: 1.0, emerging: 0.6, fading: 0.25 };

// ── Mutable simulation state ──────────────────────────────────────────────
let sim = null;          // { nodes, alpha, sectorHome }
let visibleSet = new Set();
let clusters   = [];
let stocks     = [];
let sectorGroups   = [];
let sectorAffinity = [];

// Current physics params
let params = {
  tension:        0.5,
  clusterPad:     12,
  hiddenSectors:  new Set(),
  showSectors:    true,
  boundedLayout:  true,
};

// ── Tick loop ─────────────────────────────────────────────────────────────
let rafId = null;
let idleTimer = null;

function scheduleNext(settled) {
  if (settled) {
    idleTimer = setTimeout(tick, 80);
  } else {
    rafId = requestAnimationFrame(tick);
  }
}

function cancelAll() {
  if (rafId    !== null) { cancelAnimationFrame(rafId); rafId = null; }
  if (idleTimer !== null) { clearTimeout(idleTimer);    idleTimer = null; }
}

function tick() {
  if (!sim) { scheduleNext(true); return; }

  const { nodes, alpha } = sim;
  const {
    tension, clusterPad: cpad, hiddenSectors: hidSectors,
    showSectors: showSect, boundedLayout
  } = params;

  if (alpha > FORCE_ALPHA_MIN) {
    const ids    = Object.keys(nodes);
    const vis    = visibleSet;
    const visIds = vis.size ? ids.filter(t => vis.has(t)) : ids;

    // Per-ticker cluster membership lookup
    const tickerClsIds = {};
    for (const c of clusters) {
      for (const t of c.members) {
        if (!tickerClsIds[t]) tickerClsIds[t] = [];
        tickerClsIds[t].push(c.id);
      }
    }

    const CO_REPEL   = TICKER_PW + cpad * 2 + 20;
    const BASE_REPEL = TICKER_PW + 28;

    // ── 1. Cluster gravity ───────────────────────────────────────────────
    // Two-layer pull:
    //   (a) Live centroid — members attract each other (2+ visible members only).
    //   (b) Cluster home  — every member (even a singleton) is pulled toward the
    //       cluster's defined cx/cy anchor on the canvas.  This makes the cluster's
    //       spatial position the primary organiser: tickers migrate to their cluster
    //       home rather than staying pinned to sector rails.
    const clusterK     = FORCE_CLUSTER_K * (0.35 + tension * 0.65);
    const CLUSTER_HOME_K = 0.022;  // home-beacon pull — stronger than sector offset (0.004)
    for (const c of clusters) {
      const cMemNodes = c.members
        .filter(t => !vis.size || vis.has(t))
        .map(t => nodes[t]).filter(Boolean);
      if (cMemNodes.length < 1) continue;  // changed from < 2; home pull works for singletons

      let totalW = 0;
      for (const t of c.members) {
        const s = stocks.find(st => st.ticker === t);
        if (s && s.pills) {
          totalW += s.pills.reduce((sum, p) => sum + (PILL_WEIGHT[p.state] ?? 0.3), 0);
        }
      }
      const strength = Math.min(1.0, totalW / 5) * clusterK * alpha;

      // (a) Live centroid pull — cohesion between visible siblings
      if (cMemNodes.length >= 2) {
        let liveCx = 0, liveCy = 0;
        for (const n of cMemNodes) { liveCx += n.x; liveCy += n.y; }
        liveCx /= cMemNodes.length;
        liveCy /= cMemNodes.length;
        for (const n of cMemNodes) {
          if (n.fx !== null) continue;
          n.vx += (liveCx - n.x) * strength;
          n.vy += (liveCy - n.y) * strength;
        }
      }

      // (b) Home pull — always active; pulls every member toward the cluster's
      //     canonical cx/cy position so the band region is spatially intentional.
      if (c.cx !== undefined && c.cy !== undefined) {
        const homeStr = CLUSTER_HOME_K * (0.35 + tension * 0.65) * alpha;
        for (const n of cMemNodes) {
          if (n.fx !== null) continue;
          n.vx += (c.cx - n.x) * homeStr;
          n.vy += (c.cy - n.y) * homeStr;
        }
      }
    }

    // ── 1.5. Sector offset ───────────────────────────────────────────────
    {
      // When no clusters are active, sector home force must overcome repulsion alone.
      // Only boost in small layouts (≤150 tickers) — large layouts (S&P 500, R1K) already
      // have enough inter-sector repulsion pushing groups apart; a big boost there causes
      // oscillation that never damps. A modest 0.010 (2.5× of 0.004) is enough to self-
      // organize without fighting the inter-sector forces.
      const hasActiveClusters = clusters.some(c =>
        c.members.some(t => !vis.size || vis.has(t))
      );
      const smallLayout = visIds.length <= 150;
      const SECT_OFFSET_K = showSect
        ? (hasActiveClusters || !smallLayout ? 0.004 : 0.010) * alpha
        : 0.002 * alpha;
      const sectorHome = sim.sectorHome;
      for (const sg of sectorGroups) {
        if (hidSectors.has(sg.id)) continue;
        const home = sectorHome[sg.id];
        if (!home) continue;
        const visTickers = vis.size ? sg.tickers.filter(t => vis.has(t)) : sg.tickers;
        for (const t of visTickers) {
          const n = nodes[t];
          if (!n || n.fx !== null) continue;
          n.vx += (home.cx - n.x) * SECT_OFFSET_K;
          n.vy += (home.cy - n.y) * SECT_OFFSET_K;
        }
      }
    }

    // ── 1.55. Inter-sector repulsion ─────────────────────────────────────
    {
      const sectRepelK = FORCE_SECT_REPEL_K * alpha;
      const liveSectCentroids = sectorGroups.map(sg => {
        if (!showSect || hidSectors.has(sg.id)) return null;
        const visTickers = vis.size ? sg.tickers.filter(t => vis.has(t)) : sg.tickers;
        const ms = visTickers.map(t => nodes[t]).filter(Boolean);
        if (!ms.length) return null;
        let cx = 0, cy = 0;
        for (const n of ms) { cx += n.x; cy += n.y; }
        return { tickers: visTickers, cx: cx / ms.length, cy: cy / ms.length };
      }).filter(Boolean);

      for (let si = 0; si < liveSectCentroids.length; si++) {
        for (let sj = si + 1; sj < liveSectCentroids.length; sj++) {
          const sA = liveSectCentroids[si], sB = liveSectCentroids[sj];
          const sdx = sA.cx - sB.cx, sdy = sA.cy - sB.cy;
          const sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
          if (sdist >= FORCE_SECT_REPEL_DIST) continue;
          const sf  = sectRepelK * (FORCE_SECT_REPEL_DIST - sdist) / sdist;
          const sux = sdx / sdist, suy = sdy / sdist;
          for (const t of sA.tickers) {
            const n = nodes[t]; if (n && n.fx === null) { n.vx += sux * sf; n.vy += suy * sf; }
          }
          for (const t of sB.tickers) {
            const n = nodes[t]; if (n && n.fx === null) { n.vx -= sux * sf; n.vy -= suy * sf; }
          }
        }
      }
    }

    // ── 1.56. Cluster band-edge repulsion ────────────────────────────────
    {
      const NOSHARE_K     = 0.012;
      const BAND_GAP_BASE = 12;
      const BAND_GAP_PER  = 12;

      const memberOuterInfo = (ticker) => {
        const nR = clusters.filter(vc => vc.col === '#EF4444' && vc.members.includes(ticker)).length;
        const nO = clusters.filter(vc => vc.col === '#22C55E' && vc.members.includes(ticker)).length;
        const rOuter = nR > 0 ? TICKER_HH + cpad + (nR - 1) * 6 : 0;
        const oOuter = nO > 0 ? TICKER_HH + cpad + (nR > 0 ? 12 : 0) + (nO - 1) * 6 : 0;
        const clsOuter = Math.max(rOuter, oOuter, TICKER_HH + cpad);
        const layers = Math.max(nR, nO, 1);
        return { depth: showSect ? clsOuter + 12 : clsOuter, layers };
      };

      for (let ci = 0; ci < clusters.length; ci++) {
        for (let cj = ci + 1; cj < clusters.length; cj++) {
          const cA = clusters[ci], cB = clusters[cj];
          const setA = new Set(cA.members);
          if (cB.members.some(m => setA.has(m))) continue;
          const visA = cA.members.filter(t => !vis.size || vis.has(t)).map(t => nodes[t]).filter(Boolean);
          const visB = cB.members.filter(t => !vis.size || vis.has(t)).map(t => nodes[t]).filter(Boolean);
          if (!visA.length || !visB.length) continue;

          let cxA = 0, cyA = 0, cxB = 0, cyB = 0;
          for (const n of visA) { cxA += n.x; cyA += n.y; }
          for (const n of visB) { cxB += n.x; cyB += n.y; }
          cxA /= visA.length; cyA /= visA.length;
          cxB /= visB.length; cyB /= visB.length;

          const membTickA = cA.members.filter(t => !vis.size || vis.has(t));
          const membTickB = cB.members.filter(t => !vis.size || vis.has(t));
          let spreadA = 0, outerDepthA = TICKER_HH + cpad, maxLayersA = 1;
          for (const t of membTickA) {
            const n = nodes[t]; if (!n) continue;
            spreadA = Math.max(spreadA, Math.hypot(n.x - cxA, n.y - cyA));
            const info = memberOuterInfo(t);
            outerDepthA = Math.max(outerDepthA, info.depth);
            maxLayersA  = Math.max(maxLayersA,  info.layers);
          }
          let spreadB = 0, outerDepthB = TICKER_HH + cpad, maxLayersB = 1;
          for (const t of membTickB) {
            const n = nodes[t]; if (!n) continue;
            spreadB = Math.max(spreadB, Math.hypot(n.x - cxB, n.y - cyB));
            const info = memberOuterInfo(t);
            outerDepthB = Math.max(outerDepthB, info.depth);
            maxLayersB  = Math.max(maxLayersB,  info.layers);
          }
          const outerA = spreadA + outerDepthA;
          const outerB = spreadB + outerDepthB;
          const maxLayers = Math.max(maxLayersA, maxLayersB);
          const dynamicGap = BAND_GAP_BASE + (maxLayers - 1) * BAND_GAP_PER;
          const minDist = outerA + outerB + dynamicGap;
          const dx = cxA - cxB, dy = cyA - cyB;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist >= minDist) continue;

          const str = NOSHARE_K * (minDist - dist) / minDist * alpha / dist;
          const fx = dx * str, fy = dy * str;
          for (const n of visA) { if (n.fx === null) { n.vx += fx; n.vy += fy; } }
          for (const n of visB) { if (n.fx === null) { n.vx -= fx; n.vy -= fy; } }
        }
      }
    }

    // ── 1.57. Inter-sector band-edge repulsion ───────────────────────────
    {
      const cpd           = cpad;
      const SECT_BAND_K   = 0.012;
      const SECT_BAND_GAP = 12;

      for (let si = 0; si < sectorGroups.length; si++) {
        for (let sj = si + 1; sj < sectorGroups.length; sj++) {
          const sgA = sectorGroups[si], sgB = sectorGroups[sj];
          if (!showSect || hidSectors.has(sgA.id) || hidSectors.has(sgB.id)) continue;
          const visA = (vis.size ? sgA.tickers.filter(t => vis.has(t)) : sgA.tickers)
            .map(t => nodes[t]).filter(Boolean);
          const visB = (vis.size ? sgB.tickers.filter(t => vis.has(t)) : sgB.tickers)
            .map(t => nodes[t]).filter(Boolean);
          if (!visA.length || !visB.length) continue;

          let cxA = 0, cyA = 0, cxB = 0, cyB = 0;
          for (const n of visA) { cxA += n.x; cyA += n.y; }
          for (const n of visB) { cxB += n.x; cyB += n.y; }
          cxA /= visA.length; cyA /= visA.length;
          cxB /= visB.length; cyB /= visB.length;

          const sectorBandInfo = (sg) => {
            let maxPad = cpd + 12;
            let maxLayers = 1;
            const visTickers = vis.size ? sg.tickers.filter(t => vis.has(t)) : sg.tickers;
            for (const t of visTickers) {
              const riskN = clusters.filter(c => c.col === '#EF4444' && c.members.includes(t)).length;
              const oppN  = clusters.filter(c => c.col === '#22C55E' && c.members.includes(t)).length;
              const basePad = (riskN > 0 || oppN > 0)
                ? Math.max(
                    riskN > 0 ? cpd + (riskN - 1) * 6 : 0,
                    oppN  > 0 ? cpd + (riskN > 0 ? 12 : 0) + (oppN - 1) * 6 : 0
                  ) + 12
                : cpd + 12;
              maxLayers = Math.max(maxLayers, riskN, oppN);
              const allSectorsForT = sectorGroups.filter(sg2 => sg2.tickers.includes(t));
              const sectorRank = Math.max(0, allSectorsForT.findIndex(sg2 => sg2.id === sg.id));
              const pad = basePad + sectorRank * 6;
              if (pad > maxPad) maxPad = pad;
            }
            return { depth: TICKER_HH + maxPad, maxLayers };
          };

          const infoA = sectorBandInfo(sgA);
          const infoB = sectorBandInfo(sgB);
          let spreadA = 0, spreadB = 0;
          for (const n of visA) spreadA = Math.max(spreadA, Math.hypot(n.x - cxA, n.y - cyA));
          for (const n of visB) spreadB = Math.max(spreadB, Math.hypot(n.x - cxB, n.y - cyB));

          const sMaxLayers = Math.max(infoA.maxLayers, infoB.maxLayers);
          const dynSectGap = SECT_BAND_GAP + (sMaxLayers - 1) * 12;
          const minDist = (spreadA + infoA.depth) + (spreadB + infoB.depth) + dynSectGap;
          const dx = cxA - cxB, dy = cyA - cyB;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist >= minDist) continue;

          const str = SECT_BAND_K * (minDist - dist) / minDist * alpha / dist;
          const fx = dx * str, fy = dy * str;
          for (const n of visA) { if (n.fx === null) { n.vx += fx; n.vy += fy; } }
          for (const n of visB) { if (n.fx === null) { n.vx -= fx; n.vy -= fy; } }
        }
      }
    }

    // ── 1.6. Sector affinity ─────────────────────────────────────────────
    {
      const afK = FORCE_AFFINITY_K * (0.35 + tension * 0.65) * alpha;
      for (const [idA, idB] of sectorAffinity) {
        const sgA = sectorGroups.find(sg => sg.id === idA);
        const sgB = sectorGroups.find(sg => sg.id === idB);
        if (!sgA || !sgB) continue;
        if (!showSect || hidSectors.has(idA) || hidSectors.has(idB)) continue;
        const msA = (vis.size ? sgA.tickers.filter(t => vis.has(t)) : sgA.tickers).map(t => nodes[t]).filter(Boolean);
        const msB = (vis.size ? sgB.tickers.filter(t => vis.has(t)) : sgB.tickers).map(t => nodes[t]).filter(Boolean);
        if (!msA.length || !msB.length) continue;
        let cxA = 0, cyA = 0, cxB = 0, cyB = 0;
        msA.forEach(n => { cxA += n.x; cyA += n.y; });
        msB.forEach(n => { cxB += n.x; cyB += n.y; });
        cxA /= msA.length; cyA /= msA.length;
        cxB /= msB.length; cyB /= msB.length;
        msA.forEach(n => { if (n.fx === null) { n.vx += (cxB - n.x) * afK; n.vy += (cyB - n.y) * afK; }});
        msB.forEach(n => { if (n.fx === null) { n.vx += (cxA - n.x) * afK; n.vy += (cyA - n.y) * afK; }});
      }
    }

    // ── 1.75. Center gravity ─────────────────────────────────────────────
    {
      const centK = FORCE_CENTER_K * alpha;
      const cX = SVG_W / 2, cY = SVG_H / 2;
      for (const id of ids) {
        const n = nodes[id];
        if (!n || n.fx !== null) continue;
        n.vx += (cX - n.x) * centK;
        n.vy += (cY - n.y) * centK;
      }
    }

    // ── 3. Repulsion ─────────────────────────────────────────────────────
    for (let i = 0; i < visIds.length; i++) {
      const cA = tickerClsIds[visIds[i]];
      for (let j = i + 1; j < visIds.length; j++) {
        const a = nodes[visIds[i]], b = nodes[visIds[j]];
        if (!a || !b) continue;
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const cB = tickerClsIds[visIds[j]];
        const coCluster = cA && cB && cA.some(id => cB.includes(id));
        const repelDist = coCluster ? CO_REPEL : BASE_REPEL;
        if (dist < repelDist) {
          const f = (repelDist - dist) / repelDist * FORCE_REPEL_K * alpha;
          const ux = dx / dist, uy = dy / dist;
          if (a.fx === null) { a.vx += ux * f; a.vy += uy * f; }
          if (b.fx === null) { b.vx -= ux * f; b.vy -= uy * f; }
        }
      }
    }

    // ── 4. Damp + integrate + boundary ───────────────────────────────────
    for (const id of ids) {
      const n = nodes[id];
      if (!n) continue;
      if (n.fx !== null) { n.x = n.fx; n.y = n.fy; continue; }
      n.vx *= FORCE_DAMPING;
      n.vy *= FORCE_DAMPING;
      if (boundedLayout) {
        n.x = Math.max(40, Math.min(SVG_W - 40, n.x + n.vx));
        n.y = Math.max(40, Math.min(SVG_H - 40, n.y + n.vy));
      } else {
        n.x = Math.max(-300, Math.min(SVG_W + 300, n.x + n.vx));
        n.y = Math.max(-300, Math.min(SVG_H + 300, n.y + n.vy));
      }
    }

    // ── 5. Hard overlap constraint (Verlet projection) ────────────────────
    const verletPasses = visIds.length > 300 ? 1 : visIds.length > 150 ? 2 : 3;
    for (let pass = 0; pass < verletPasses; pass++) {
      for (let i = 0; i < visIds.length; i++) {
        const cA = tickerClsIds[visIds[i]];
        for (let j = i + 1; j < visIds.length; j++) {
          const a = nodes[visIds[i]], b = nodes[visIds[j]];
          if (!a || !b) continue;
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const cB = tickerClsIds[visIds[j]];
          const coCluster = cA && cB && cA.some(id => cB.includes(id));
          const repelDist = coCluster ? CO_REPEL : BASE_REPEL;
          if (dist < repelDist) {
            const correction = (repelDist - dist) / 2;
            const ux = dx / dist, uy = dy / dist;
            const aPinned = a.fx !== null, bPinned = b.fx !== null;
            if (aPinned && bPinned) continue;
            const aShare = aPinned ? 0 : bPinned ? 1 : 0.5;
            const bShare = 1 - aShare;
            const [bMin, bMaxX, bMaxY] = boundedLayout
              ? [40, SVG_W - 40, SVG_H - 40] : [-300, SVG_W + 300, SVG_H + 300];
            a.x += ux * correction * aShare;
            a.y += uy * correction * aShare;
            b.x -= ux * correction * bShare;
            b.y -= uy * correction * bShare;
            a.x = Math.max(bMin, Math.min(bMaxX, a.x));
            a.y = Math.max(bMin, Math.min(bMaxY, a.y));
            b.x = Math.max(bMin, Math.min(bMaxX, b.x));
            b.y = Math.max(bMin, Math.min(bMaxY, b.y));
          }
        }
      }
    }

    // Large layouts (S&P 500, R1K) settle faster so they don't burn frames.
    // Small layouts use the standard rate for more organic movement.
    const decayRate = visIds.length > 300
      ? FORCE_ALPHA_DECAY * 1.8   // ~2× faster — settle in ~half the frames
      : FORCE_ALPHA_DECAY;
    sim.alpha = alpha * (1 - decayRate);
  }

  // Post positions to main thread
  const anyPinned = Object.values(sim.nodes).some(n => n.fx !== null);
  const settled   = sim.alpha <= FORCE_ALPHA_MIN && !anyPinned;

  // Build compact positions map — only what the renderer needs
  const positions = {};
  for (const [id, n] of Object.entries(sim.nodes)) {
    positions[id] = { x: n.x, y: n.y };
  }
  self.postMessage({ type: 'tick', positions, settled });

  scheduleNext(settled);
}

// ── Message handler ───────────────────────────────────────────────────────
self.onmessage = function(e) {
  const msg = e.data;

  switch (msg.type) {

    case 'init': {
      const jitter = () => (Math.random() - 0.5) * 120;
      sim = {
        nodes: Object.fromEntries(
          Object.entries(msg.nodes).map(([id, p]) => [
            id, { x: p.x + jitter(), y: p.y + jitter(), vx: 0, vy: 0, fx: null, fy: null }
          ])
        ),
        alpha:      msg.alpha ?? 1.0,
        sectorHome: msg.sectorHome,
      };
      sectorGroups   = msg.sectorGroups;
      sectorAffinity = msg.sectorAffinity;
      cancelAll();
      scheduleNext(false);
      break;
    }

    case 'setVisible': {
      visibleSet = new Set(msg.tickers);
      if (sim) sim.alpha = Math.max(sim.alpha, 0.3);
      break;
    }

    case 'setClusters': {
      const wasPopulated = clusters.length > 0;
      clusters = msg.clusters;
      if (sim) {
        // When clusters go from populated → empty (user turned off RISKS + OPENINGS),
        // give a mild reheat so the sector force has time to pull tickers home.
        const nowEmpty = clusters.length === 0;
        sim.alpha = Math.max(sim.alpha, wasPopulated && nowEmpty ? 0.55 : 0.4);
      }
      break;
    }

    case 'setStocks': {
      stocks = msg.stocks;
      break;
    }

    case 'setParams': {
      const prev = { ...params };
      params = {
        tension:       msg.tension       ?? params.tension,
        clusterPad:    msg.clusterPad    ?? params.clusterPad,
        hiddenSectors: new Set(msg.hiddenSectors ?? [...params.hiddenSectors]),
        showSectors:   msg.showSectors   ?? params.showSectors,
        boundedLayout: msg.boundedLayout ?? params.boundedLayout,
      };
      if (sim) {
        // Reheat when meaningful params change
        if (prev.clusterPad    !== params.clusterPad)   sim.alpha = Math.max(sim.alpha, 0.6);
        if (prev.boundedLayout !== params.boundedLayout) sim.alpha = Math.max(sim.alpha, 0.6);
        if (Math.abs(prev.tension - params.tension) > 0.05) sim.alpha = Math.max(sim.alpha, 0.3);
      }
      break;
    }

    case 'reheat': {
      if (sim) {
        sim.alpha = Math.max(sim.alpha, msg.temp ?? 0.5);
        // Wake from idle poll if settled
        cancelAll();
        scheduleNext(false);
      }
      break;
    }

    case 'pin': {
      if (!sim) break;
      const n = sim.nodes[msg.id];
      if (!n) break;
      n.fx = msg.x; n.fy = msg.y; n.x = msg.x; n.y = msg.y; n.vx = 0; n.vy = 0;
      // Wake from idle immediately so drag feels instant
      cancelAll();
      scheduleNext(false);
      break;
    }

    case 'release': {
      if (!sim) break;
      const n = sim.nodes[msg.id];
      if (!n) break;
      n.fx = null; n.fy = null;
      sim.alpha = Math.max(sim.alpha, 0.15);
      cancelAll();
      scheduleNext(false);
      break;
    }

    case 'reset': {
      if (!sim) break;
      const jitter = () => (Math.random() - 0.5) * 120;
      for (const [id, p] of Object.entries(msg.basePositions)) {
        const n = sim.nodes[id];
        if (!n) {
          sim.nodes[id] = { x: p.x + jitter(), y: p.y + jitter(), vx: 0, vy: 0, fx: null, fy: null };
        } else {
          n.x = p.x + jitter(); n.y = p.y + jitter(); n.vx = 0; n.vy = 0; n.fx = null; n.fy = null;
        }
      }
      sim.alpha = 1.0;
      cancelAll();
      scheduleNext(false);
      break;
    }
  }
};
