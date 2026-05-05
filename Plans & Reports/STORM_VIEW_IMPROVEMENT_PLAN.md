# Storm View — Improvement Plan & Build Status
### April 2026 — Updated from v09 Draft (March 2026)

**Site:** https://perfect-storm.app
**Repo:** master @ 83aff49
**Original plan date:** March 28, 2026

---

## Executive Summary

The Storm View improvement plan drafted in March 2026 called for six phases of development. As of April 2026, **Phase 1 (force-directed layout) is fully built** — and built beyond the original spec. The layout runs in a dedicated Web Worker rather than on the main thread, handles 424 tickers across 29 sectors with stable performance, and uses a cluster-priority force hierarchy that makes the layout itself analytically meaningful.

The remaining phases — surround intelligence, perfect storm visualization, interaction depth, temporal dimension, and polish — are unbuilt. The table below tracks status.

---

## Phase Build Status

| Phase | Title | Status | Notes |
|---|---|---|---|
| **Phase 1** | Force-Directed Layout | ✅ Complete | Web Worker, 6 force types, 29 sectors, 424 tickers |
| **Phase 2** | Surround Intelligence | 🔲 Not started | Data-driven surround severity, intersection zones |
| **Phase 3** | Perfect Storm Visualization | 🔲 Not started | Concentric halos, PERFECT STORM badge, convergence zone |
| **Phase 4** | Interaction Depth | ⚠️ Partial | Click-to-focus dimming built; keyboard nav not built |
| **Phase 5** | Temporal Dimension | 🔲 Not started | Signal history, timeline scrubber, playback |
| **Phase 6** | Polish & Delight | ⚠️ Ongoing | Sector ring matching, label system, performance tuning |

---

## Phase 1 — Force-Directed Layout ✅ COMPLETE

### What Was Planned

Replace the static `BASE_NODES` grid with a D3 force simulation where ticker positions reflect live signal data.

### What Was Built

A custom force simulation running in a **dedicated Web Worker** (`force-worker.js`), communicating position updates to the main thread via `postMessage`. No D3 dependency — the physics engine is written directly, giving full control over force parameters.

**Force hierarchy (April 2026):**

```
1. Cluster home beacon    CLUSTER_HOME_K = 0.022   PRIMARY — pulls to cluster cx/cy
2. Cluster live centroid  FORCE_CLUSTER_K = 0.055  Cohesion between visible siblings
3. Sector gravity         FORCE_SECTOR_K = 0.038   Keeps sectors loosely grouped
4. Sector affinity        FORCE_AFFINITY_K = 0.008  Cross-sector pair pulling
5. Center gravity         FORCE_CENTER_K = 0.003   Prevents corner isolation
6. Home bias              FORCE_HOME_K = 0.004     Gentle pull to BASE_NODES positions
7. Repulsion              FORCE_REPEL_K = 2.8      Prevents pill overlap
8. Damping + Verlet       3-pass hard overlap projection
```

**Key design decision (April 2026):** Cluster membership is the primary spatial organizer. The home-beacon force (`CLUSTER_HOME_K = 0.022`) is 5× stronger than the home-bias force that keeps tickers near their sector positions. Ticker pills trade grid positions to stay inside their risk/opportunity bands, then settle. The Storm View layout now encodes signal structure — not just sector taxonomy.

**What this looks like in practice:**

If three defense stocks are all in the `cyber_r` (Cybersecurity Breach Risk) cluster and three tech stocks are in the `cyber_opp` (Cyber Incident Surge) cluster, those two groups will spatially separate on the canvas — defense stocks clustering near `cyber_r`'s home position, cybersecurity vendors clustering near `cyber_opp`'s home position — even if their underlying sectors would otherwise place them near each other.

**Canvas:** `SVG_W = 1600, SVG_H = 760`. Bounded hard clamp at 40px walls (Open/Bounded toggle in Settings).

### What Exceeded the Original Spec

- **20 clusters** instead of the planned dynamic generation — hybrid approach: static definitions, dynamic strength from live pills
- **13 signal-flip pairs** — the original plan didn't anticipate explicit flip modeling
- **Single-member cluster rendering** — bands render even with 1 visible cluster member (guard changed from `< 2` to `< 1`)
- **Tension slider** — scales both cluster gravity forces in real time

---

## Phase 2 — Surround Intelligence 🔲 NOT STARTED

### What Was Planned

Make surrounds data-driven and visually expressive. Surround boundary tightness, fill opacity, stroke width, and dash pattern respond to signal strength. Empty clusters dissolve. Intersection zones get special treatment.

### Current Gap

Clusters are rendered as static metaball blobs (SVG feGaussianBlur compositing on rect elements). Their visual weight responds to `strength` (sum of visible member pill weights) via opacity scaling, but:

- Stroke width does not vary with confirmed signal count
- Dash pattern does not indicate lifecycle stage (solid/dashed/dotted)
- No glow/pulse for intensifying clusters
- No intersection zone computation or rendering
- No "Developing pattern" detection for novel signal groupings

### What to Build

**Surround severity styling:**
```js
strokeWidth  = 1 + Math.min(3, activeMembers.length * 0.4)  // 1–4px
strokeDash   = lifecycle === 'active' ? 'none'
             : lifecycle === 'emerging' ? '6,3'
             : '2,4'
fillOpacity  = 0.04 + strength * 0.14   // currently: fixed 0.12
```

**Intersection zones:**
Compute pairwise surround overlap via polygon intersection (turf.js or manual convex hull intersection). Render with `mix-blend-mode: multiply` or additive fill. Label the intersection with a "CONVERGENCE" count.

**Dynamic cluster emergence:**
Currently `CLUSTERS` is a static array. Phase 2 goal: if the live signal pipeline groups 3+ tickers under the same signal rule that isn't in a predefined cluster, surface it as a "developing pattern" with a dashed outline and `?` label.

---

## Phase 3 — Perfect Storm Visualization 🔲 NOT STARTED

### What Was Planned

When 3+ serious forces converge on a single stock, that stock enters "Perfect Storm" state. Current implementation: a number. New implementation: a spatial and visual event.

### Current Gap

Stocks with high storm scores have an animated wave ring (`ringCol` based on risk/opp score dominance), but:

- No concentric halos for multi-cluster convergence
- No "PERFECT STORM" badge above qualifying pills
- No convergence zone special fill
- No storm formation notification
- No "N ACTIVE STORMS" header counter

### What to Build

**Perfect storm detection (enhanced):**
```js
isPerfectStorm(stock) =
  activeRiskClusters(stock) >= 3  OR  activeOppClusters(stock) >= 3
  AND at least 2 distinct pill categories
  AND stormScore > 65
```

**Visual treatment:**
1. Concentric halos — 2-3 rings around the pill, each colored by the contributing cluster
2. `PERFECT STORM` badge above qualifying pills
3. Convergence zone fill — dark amber for risk storms, dark teal for opportunity storms
4. Slow halo rotation (CSS `@keyframes`, not JS-driven)
5. Storm View header counter: `2 ACTIVE STORMS` with ticker list

The halo system gives visual drama proportional to convergence depth. MasTec with 3 green clusters should look visually distinct from a stock with 1 green cluster — even before the user reads any numbers.

---

## Phase 4 — Interaction Depth ⚠️ PARTIAL

### What Was Planned

Bloomberg-grade keyboard navigation + infotainment-grade click behavior.

### What's Built

- **Click-to-focus dimming** ✅ — clicking a ticker dims all non-member cluster surrounds to 12% opacity. Click ✕ or empty canvas to restore.
- **Side panel detail view** ✅ — clicking any ticker opens a Reference Card in a slide-in panel
- **RISKS / OPENINGS / SECTORS toggles** ✅ — filter what renders on the canvas
- **Tension slider** ✅ — scales force gravity in real time

### What's Not Built

- Keyboard navigation (Tab, arrows, Enter, Escape, R/O/S shortcuts, / search)
- Click surround label → highlight all members
- Click intersection zone → show convergence detail
- Double-click fly-zoom (animated viewBox transition)
- Semantic zoom (pill detail level changes with zoom level)
- Rich tooltip (300ms hover → mini-card with sparkline)
- Context menu (right-click → "Show all clusters," "Compare with...")

### Priority Items

**Search overlay** (`/` key opens search, type ticker to fly to it) — most immediately useful for users navigating large indices.

**Surround click** — clicking a cluster label should highlight all its members, dim all others. One interaction pattern that reveals a lot.

---

## Phase 5 — Temporal Dimension 🔲 NOT STARTED

### What Was Planned

Show how the storm developed — the chess principle of seeing moves ahead.

### Current Gap

The app shows the current signal state. There is no signal history, no timeline scrubber, no ability to ask "what was RTX's storm score 5 days ago?"

### What to Build

1. **Signal history store** — persist last 7 days of pill states (IndexedDB)
2. **Timeline scrubber UI** — horizontal bar below SVG, draggable playhead
3. **Playback mode** — scrubbing replays force layout evolution
4. **Trend indicators on surrounds** — ↗ intensifying, → stable, ↘ fading
5. **Developing pattern detection** — emerging signals trending toward convergence but not yet converged
6. **Storm timeline in detail panel** — when did each pill appear, how did the storm form

This is the highest-effort item on the roadmap and the feature most differentiated from Bloomberg. The temporal dimension transforms Perfect Storm from a "current state" dashboard into a predictive tool.

---

## Phase 6 — Polish & Delight ⚠️ ONGOING

### What Was Planned

Tufte-grade information density + infotainment-grade feel.

### What's Been Done

- **Slot-based band spacing** ✅ — canonical offset system (pill → clusterPad → [risk slot] → [opp slot if risk renders] → sector outline). Each occupied slot = 12px.
- **Storm ring color from scores** ✅ — `isRiskDom = sRisk > sOpp * 1.5`. Not cluster membership count.
- **Sector outline thickness matching** ✅ — sector ring matches risk/opp band ring width exactly.
- **Dynamic sector opacity** ✅ — `0.18 + sectorStrength × 0.30` where sectorStrength = fraction of sector tickers with active pills.
- **resolveLabels()** ✅ — 100-iteration collision resolver for cluster labels with elbow leaders.
- **elbowLeader()** ✅ — 30px horizontal exit, diagonal to band surface, returns `{pts, ax, ay}`.
- **Selection/focus unfade** ✅ — ✕ button and empty-canvas click both clear selected AND focused.
- **Card View** ✅ — always sorted by stormScore. Filters: ALL / RISKS / OPENINGS / CALM / ⚡ STORM.

### What Remains

- **Micro-animations** — surround boundary subtly breathes (±0.2px stroke-width oscillation at 0.5Hz)
- **Semantic zoom** — pill detail level changes with zoom level (ticker only at zoom < 0.5, full pill at zoom > 1.5)
- **Canvas rendering for pills at scale** — if > 500 tickers, consider canvas for pill nodes, SVG for surrounds
- **Accessibility** — ARIA labels on surrounds, pill focus indicators, screen reader storm formation announcements
- **Export** — "Export current view as PNG" button

---

## The Five Design Tests (Original Criteria — Updated Assessment)

### The Tufte Test
*Can a user extract "which stocks face converging risks?" from a 2-second glance?*

**April 2026 status: PASSING** — The cluster-priority layout makes convergence zones visible as spatial clusters. Stocks pulled into multiple surrounds sit in the intersection space. The layout is the answer.

### The Hurricane Tracker Test
*Can a user tell which storms are intensifying vs. fading without reading numbers?*

**April 2026 status: PARTIAL** — Cluster strength drives fill opacity. The tension slider shows force dynamics in real time. But there's no dash-pattern for lifecycle stage and no glow for intensifying clusters (Phase 2).

### The Bloomberg Test
*Can a power user navigate to any stock in under 5 seconds using only keyboard?*

**April 2026 status: FAILING** — No keyboard navigation. Mouse-only. (Phase 4 item.)

### The Venn Diagram Test
*When two surrounds overlap and stocks sit in the intersection, is it immediately obvious?*

**April 2026 status: PARTIAL** — The force layout pulls stocks toward cluster home positions, creating natural spatial groupings. But there's no intersection zone computation or special rendering for the overlap area (Phase 2).

### The Chess Test
*Can a user see a storm that was building 3 days ago and identify the progression?*

**April 2026 status: FAILING** — No signal history. No temporal dimension. (Phase 5 item — the highest-effort, most differentiating feature remaining.)

---

## Architecture Reference — Current Storm View

```
App.jsx (main thread)
  │
  ├── useForceLayout hook
  │     ├── Sends nodes, clusters, sectors to force-worker.js via postMessage
  │     ├── Receives position updates each RAF frame
  │     └── Updates React state → triggers SVG re-render
  │
  ├── force-worker.js (Web Worker — dedicated physics thread)
  │     ├── tick() runs RAF-based physics loop
  │     ├── Cluster home beacon (CLUSTER_HOME_K=0.022) — PRIMARY
  │     ├── Cluster live centroid pull (FORCE_CLUSTER_K=0.055)
  │     ├── Sector gravity + sector affinity + center gravity
  │     ├── Home bias toward BASE_NODES (FORCE_HOME_K=0.004)
  │     ├── Repulsion (FORCE_REPEL_K=2.8)
  │     └── Verlet hard overlap projection (3 passes)
  │
  └── SVG render layer (App.jsx)
        ├── Cluster bands — metaball blur on rect elements
        ├── Sector outlines — same metaball filter params
        ├── Ticker pills — rect + label
        ├── Storm rings — animated circles around signaled tickers
        ├── Elbow leader lines — from resolveLabels() + elbowLeader()
        └── Toolbar — RISKS / OPENINGS / SECTORS / GRID / ORGANIC
```

---

## What to Build Next

Ranked by impact-to-effort ratio:

1. **Shelter signal** (Phase 2 concept) — specced in `Context/PHASE_2_SPEC.md`. High analytical value, medium effort. The most differentiating Phase 2 feature.
2. **Pill source indicator** — live dot vs. static dot. Low effort, high trust payoff.
3. **Surround severity styling** — stroke-width and dash-pattern variation from signal strength. Medium effort.
4. **Search overlay** (Phase 4) — `/` key to fly to a ticker. Medium effort, immediately useful for large indices.
5. **Intersection zone rendering** (Phase 2) — the Venn diagram's core visual payoff. High effort.
6. **Signal history** (Phase 5) — requires new data persistence layer. Highest effort, highest differentiation.

---

*Updated April 7, 2026 — reflects Phase 1 completion and revised priorities.*
*Original plan: March 28, 2026.*
