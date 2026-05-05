# Phase 2 Spec — Tiered Rendering + Shelter Signal
*Perfect Storm · April 2026*

---

## The Problem We're Actually Solving

The original Phase 2 proposal was blunt: hide any ticker with no active pills. That solves the rendering problem but kills one of Perfect Storm's most interesting angles — **calm amid chaos is a signal**. A stock sitting quiet while its sector burns is exactly what a defensive investor is hunting. Hiding it removes the negative space that makes the signal legible.

This spec replaces "hide quiet tickers" with a smarter system that:
1. Keeps all tickers visible and in the layout
2. Makes genuine calm a first-class, detectable signal ("Shelter")
3. Cuts rendering cost through visual LOD (Level of Detail), not omission
4. At 500+ active tickers, tests an outline-only render mode as a legibility experiment

---

## Three-Tier Rendering System

Every visible ticker in Storm View belongs to exactly one tier at any given moment. Tiers are computed live from `stormScore`, `sectorMedianScore`, and the total visible ticker count.

### Tier 1 — Signal-Active
**Condition:** `stormScore > 0` OR ticker has been elevated to Shelter status (see below).

Full rendering. Everything you see today:
- Filled metaball surrounds with opacity
- Risk/opportunity band rings
- Animated wave pulse
- Pill labels
- Full physics: all 9 force layers, 3 Verlet passes, full tick rate

### Tier 2 — Shelter
**Condition:** `stormScore < SHELTER_QUIET_THRESHOLD` AND the ticker's sector has a median storm score above `SHELTER_SECTOR_THRESHOLD`.

Tickers that qualify are *elevated into Tier 1 rendering* and given a Shelter pill. They are not a separate visual tier — they look like active tickers because they are: they carry a live, meaningful signal.

→ Shelter pill spec is in the next section.

### Tier 3 — Background
**Condition:** Everything else. Low score, quiet sector. Genuinely unremarkable right now.

Reduced rendering. Two sub-modes depending on total ticker count:

**Sub-mode A: Outline-Only (auto-activates at ≥500 visible tickers)**
- Sector surround: stroke kept, fill removed (`fillOpacity: 0`)
- Cluster bands: stroke kept, fill removed
- SVG metaball filter effect: bypassed (no feGaussianBlur compositing on fills)
- Ticker node: outline circle only — no filled background, no wave animation, label retained
- Label: ticker text retained, dimmed to ~35% opacity

**Sub-mode B: Dimmed Fill (< 500 tickers)**
- Same as today but opacity dropped to ~20% on fills
- No wave animation
- Ticker circle and label retained at full size, just dimmed

**In both sub-modes:**
- Ticker remains in the force layout and occupies space
- Remains clickable — clicking opens the Reference Card
- Physics: alternate-frame updates (every other RAF tick), 1 Verlet pass, cluster band-edge repulsion skipped

---

## Shelter Signal Spec

### What It Communicates
"This company is not being affected by the forces hitting its peers right now." That is a real, actionable insight — it tells an investor this ticker may be structurally insulated, or may be lagging the sector move.

### Detection Logic

```js
// Run once per signal recalculation cycle (not per frame)
const SHELTER_QUIET_THRESHOLD = 10;   // ticker's own stormScore must be ≤ this
const SHELTER_SECTOR_THRESHOLD = 35;  // sector median stormScore must be ≥ this
const SHELTER_MIN_SECTOR_SIZE = 4;    // sector must have at least this many visible tickers
                                       // (prevents false positives in tiny sectors)

function computeShelterTickers(stocks, visibleTickers, sectorGroups) {
  // 1. Build a map: sectorId → median stormScore of visible tickers in that sector
  const sectorMedians = {};
  for (const sg of sectorGroups) {
    const scores = sg.tickers
      .filter(t => visibleTickers.includes(t))
      .map(t => stocks.find(s => s.ticker === t)?.stormScore ?? 0);
    if (scores.length < SHELTER_MIN_SECTOR_SIZE) continue;
    scores.sort((a, b) => a - b);
    sectorMedians[sg.id] = scores[Math.floor(scores.length / 2)];
  }

  // 2. Tag any quiet ticker whose sector(s) are hot
  const shelterSet = new Set();
  for (const t of visibleTickers) {
    const stock = stocks.find(s => s.ticker === t);
    if (!stock || stock.stormScore > SHELTER_QUIET_THRESHOLD) continue;
    const sectors = sectorGroups.filter(sg => sg.tickers.includes(t));
    const inHotSector = sectors.some(
      sg => (sectorMedians[sg.id] ?? 0) >= SHELTER_SECTOR_THRESHOLD
    );
    if (inHotSector) shelterSet.add(t);
  }

  return shelterSet;
}
```

### Pill Design

| Property | Value |
|---|---|
| Label | `SHELTER` |
| Direction | `dir: 'neutral'` (neither risk nor opp) |
| Color | Steel blue — `#60A5FA` or similar cool neutral, distinct from risk red and opp green |
| Behavior | Same as any other pill — appears on collapsed card, counts in pill strip, visible in Card View |
| Category code | `'SHE'` — new category, doesn't overlap existing codes |
| Weight | `0.4` in storm score calc — shelter is a mild signal, not a storm driver |

### Where It Appears
- Storm View: ticker elevated to Tier 1, Shelter pill visible on node
- Card View: CALM filter **retains** shelter tickers — they are calm *and* interesting. A new **SHELTER** filter tab could be added between CALM and ⚡STORM
- Feed View: Shelter events logged as "Insulated from sector pressure" with sector name and delta between stock score and sector median
- Nation View: Shelter tickers highlighted in the ticker list for the relevant country

### Avoiding False Positives
- Sector must have `≥ SHELTER_MIN_SECTOR_SIZE` visible tickers (prevents a 2-ticker sector from triggering shelter on the quieter one)
- Ticker must have been in the visible set for at least 2 signal cycles before qualifying (prevents flicker when signals are just loading in)
- If a ticker is in multiple sectors and only *one* is hot, it still qualifies — the insulation is real relative to that sector

---

## Outline-Only Mode (500+ Tickers)

### Rationale
Filled SVG shapes with opacity require the GPU to alpha-composite every overlapping element on every frame. At 500 nodes, each with sector surrounds, cluster bands, and metaball-filtered fills, the compositing cost dominates. Strokes don't composite the same way — they're drawn on top of the background in a single pass.

The hypothesis is: **sector groupings are defined by shape, not fill**. The closed curves of the sector surrounds, the ring arcs of the cluster bands, and the positions of the ticker labels may be entirely legible with outlines alone. This is the same reason architectural drawings work — you don't need filled rooms to read a floor plan.

### What Changes in Outline Mode

| Element | Normal | Outline Mode |
|---|---|---|
| Sector surround path | Filled, opacity 0.06–0.18 + stroke | Stroke only, no fill |
| Cluster band ring | Filled arc, opacity 0.12–0.35 + stroke | Stroke only |
| Metaball SVG filter | Active on sector paths | Bypassed on Tier 3 nodes |
| Tier 1 ticker node | Filled circle + wave | Unchanged (stays filled) |
| Tier 3 ticker node | Filled circle, dimmed | Outlined circle, label retained |
| Background | Dark fill | Unchanged |

**Tier 1 (signal-active and shelter) tickers stay fully rendered in all modes.** The outline experiment only applies to Tier 3 background nodes and their associated sector surrounds.

### Auto-Trigger and Manual Override

```js
const OUTLINE_MODE_THRESHOLD = 500;
const outlineMode = visibleTickers.length >= OUTLINE_MODE_THRESHOLD || userForcedOutline;
```

A small indicator appears in the toolbar when auto-triggered:
```
[◻ OUTLINE]   ← pill/badge, clickable to force on/off
```
Clicking it lets the user manually override in either direction.

### What to Test
When outline mode first activates, key legibility questions:
1. Can you still tell which sector a cluster of tickers belongs to?
2. Do the cluster band arcs (risk/opp rings) read as contained shapes, or do they look orphaned without fill?
3. Does the overall composition look intentional (architecture drawing) or broken (missing assets)?
4. At what ticker count does outline mode actually start to look *better* than dimmed fills?

These are judgment calls. The spec doesn't prescribe the answer — it creates the infrastructure to test them.

---

## Physics LOD (Web Worker Integration)

Since Phase 1 moved physics into `force-worker.js`, LOD is implemented inside the worker rather than on the main thread. The worker already receives the full node list — it just needs to know which tier each node is in.

### Protocol Extension

New message type added to worker protocol:
```js
// Main thread → Worker
{ type: 'setTiers', active: Set<string>, background: Set<string> }
```

Worker behavior per tier:
| Force Layer | Tier 1 | Tier 3 (Background) |
|---|---|---|
| Cluster gravity | Every tick | Every other tick |
| Sector gravity | Every tick | Every other tick |
| Sector affinity | Every tick | Skip |
| Center gravity | Every tick | Every tick (keeps them from drifting) |
| Home bias | Every tick | Every tick (stronger pull — bg nodes snap home faster) |
| Ticker repulsion | Every tick | Every other tick |
| Cluster band-edge repulsion | Every tick | Skip |
| Inter-sector band-edge repulsion | Every tick | Skip |
| Verlet projection | 3 passes | 1 pass |

Net effect: background node compute drops ~60–70% per tick. For a 500-ticker render where 400 are background, total tick cost approaches what a 150-ticker full render costs today.

---

## Implementation Sequence

### Step 1 — Shelter detection (no visual changes yet)
Add `computeShelterTickers()` to `App.jsx`. Wire it to run inside the same `useMemo` that computes `STOCKS`. Log shelter tickers to console. Validate the thresholds feel right against live data before building any UI.

**Tunable constants to expose in Settings:**
- `SHELTER_QUIET_THRESHOLD` (default 10)
- `SHELTER_SECTOR_THRESHOLD` (default 35)

### Step 2 — Shelter pill + Card View filter
Add `'SHE'` category to `SIGNAL_RULES` infrastructure. Inject synthetic shelter pills into stock objects for qualifying tickers. Add SHELTER filter tab to Card View. Validate the full pill-to-card pipeline before touching Storm View.

### Step 3 — Tier classification in Storm View
Add `tierOf(ticker)` helper. Classify each visible ticker into Tier 1 or Tier 3 during render (Tier 2/Shelter already promoted to Tier 1 via pills). Wire `setTiers` message to force worker.

### Step 4 — Outline mode
Add `outlineMode` boolean derived from `visibleTickers.length`. In the SVG render pass, conditionally set `fillOpacity={outlineMode && tier === 3 ? 0 : normalOpacity}` on sector paths and cluster band fills. Add toolbar indicator.

### Step 5 — Physics LOD in worker
Implement alternating-frame logic inside `force-worker.js` based on `active` vs `background` sets received via `setTiers`. Benchmark tick time before/after at 300, 500, and 800 tickers.

---

## Open Questions / Decisions Needed

1. **Shelter pill weight in storm score.** Currently proposed at `0.4`. Should shelter contribute to `riskScore`, `oppScore`, or a new neutral score? Suggestion: add a `shelterScore` field so it doesn't inflate risk or opp numbers, but does lift `stormScore` enough to keep the ticker in `ALL` mode above the `stormScore > 18` visibility floor.

2. **Shelter label in Feed View.** What does the feed item say? Option A: "AAPL insulated — Energy sector at storm score 47, AAPL at 3." Option B: "Shelter signal: AAPL remains calm as 8 sector peers face rate + geopolitical pressure." Option B reads better but needs the sector peer count.

3. **Does outline mode apply to sector surrounds only, or also to cluster bands?** Cluster bands are the risk/opp rings — they carry meaning. Removing their fill might make risk vs opportunity distinction harder to read at a glance. Possible compromise: keep cluster band fills but reduce opacity further (0.06 instead of 0.18) and drop the metaball blur filter in outline mode.

4. **The 500-ticker threshold.** This is a guess. The actual crossover point where outline mode starts helping should be found empirically once Steps 3–4 are built. Expose it as a tunable before hardcoding it.

5. **Shelter for R1K stub tickers.** R1K stubs currently have `stormScore: 0` and no real price data. They should be excluded from shelter detection until they have live signal data — otherwise every R1K stub in a hot sector would get a shelter pill, which would be noise not signal.

---

## ✅ Smart Article System — Already Built (April 8, 2026)

The article-sourcing infrastructure below was built in the April 8 session and is live in `App.jsx`. It is included here because it directly enhances the Phase 2 UX — every pill expansion in Card View and Storm View now shows 3–5 supporting articles.

### What Was Built

**Three-tier `articlesForPill()` matching function (module-level in App.jsx):**

- **Tier 1 — Exact match:** Scans `liveArticles` (RSS feed results) for items whose `signals` array contains an entry matching `pill.label` + ticker. Zero API calls. Instant.
- **Tier 2 — Semantic keyword scoring:** When Tier 1 returns < 2 results, extracts keywords from the pill label (strips category prefix, removes stop words), then scores all live articles by: ticker mention (4pts), keyword overlap (1.5pts each), category-specific boost terms (0.6pts each). Returns top 5 scored results.
- **Tier 3 — Async `/api/pill-articles` fetch:** When combined < 2 results, fires an async fetch to the Netlify function. Results cached in module-level `_pillArticleCache` (Map keyed by `ticker|pill.label`) for the session lifetime.

**Module-level constants:**
```js
const STOP_WORDS = new Set([...]);  // common prepositions/articles
const CAT_BOOST = {
  GPOL: ["export","control","sanction","military","geopolit","conflict","war","iran","taiwan","china","russia","nato"],
  MACRO: ["inflation","recession","fed","gdp","economy","interest","rate","fiscal","monetary","yield","deficit"],
  RATE:  ["federal reserve","fomc","interest rate","yield","rate cut","rate hike","monetary","treasury","bps"],
  // ... 8 more category codes
};
const _pillArticleCache = new Map();  // session cache: "TICKER|pill.label" → articles[]
```

**`/netlify/functions/pill-articles.js` (new file):**
- Endpoint: `GET /api/pill-articles?ticker=NVDA&q=export+controls+semiconductor`
- Source waterfall: Brave Search API → NewsAPI.org → Yahoo Finance (no key needed)
- 60s in-memory cache per Lambda cold start
- Merge + deduplicate, cap at 5 results
- Env vars needed: `BRAVE_SEARCH_KEY` (2K/mo free), `NEWSAPI_KEY` (100/day free)

**`PillCard` integration:** Each expanded pill tracks `tier3Arts` in local state. On expansion, if Tier 1+2 return < 2 articles, fires Tier 3 async fetch and re-renders when results arrive.

### To Do / Extend

- [ ] **Add `BRAVE_SEARCH_KEY` to Netlify env vars** — activates rich, real-time web results for all tickers. Sign up at `brave.com/search/api` (free tier: 2,000 req/month).
- [ ] **Add `NEWSAPI_KEY` to Netlify env vars** — broader coverage, 100 req/day on free tier. `newsapi.org`.
- [ ] **Expand `CAT_BOOST` terms** for newer signal categories (CLMT, SUPPLY) — currently sparse, need domain-specific terms to improve Tier 2 scoring accuracy.
- [ ] **Deduplicate across Tier 1 + Tier 2 + Tier 3** — currently Tier 3 results are merged with a simple headline comparison; consider URL normalization for better dedup.
- [ ] **Article freshness filter** — add `minDate` param to `/api/pill-articles` so stale articles (>30 days old) are deprioritized. Especially useful for RATE and MACRO pills where the situation evolves weekly.
- [ ] **Source quality filter** — optionally weight Brave/NewsAPI results by publisher domain reputation (whitelist known finance publishers: WSJ, FT, Bloomberg, Reuters, AP, Barron's).
- [ ] **Pill duplicate audit** — when adding new cluster pills, check if a curated pill already covers the same `dir + cat` combination on that ticker. If so, remove the cluster pill (it inflates the score). Pattern discovered in GLP-1: KO/PEP/MDLZ/GIS each had a cluster pill + a curated pill for the same SECT risk, fixed by removing cluster pill.

### Considerations

- **Tier 3 fires per pill expansion, per ticker** — if a user rapidly expands many pills, could generate many concurrent fetches. The `_pillArticleCache` prevents re-fetching the same `ticker|label` combination but does not debounce concurrent identical requests. Low risk at current scale; revisit if Netlify function invocations spike.
- **Yahoo Finance fallback is always on** — no API key needed, works immediately. Results are less fresh than Brave/NewsAPI but reliable as a floor.
- **Live pills (from signal rules) naturally get better Tier 1/2 matches** because their labels match the actual RSS headlines that generated them. Curated static pills rely more heavily on Tier 2/3 scoring.
- **The `dateAdded` field on curated pills is the entry point for temporal decay** — pills without `dateAdded` are treated as authored on `PILL_EPOCH` (2026-04-01). Add `dateAdded` strings to any new curated pills at the time they are authored.
