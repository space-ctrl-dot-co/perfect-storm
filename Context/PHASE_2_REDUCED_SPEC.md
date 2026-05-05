# Phase 2 Reduced Spec — Outline-Only Rendering Mode
*Perfect Storm · April 2026*

---

## Goal

At scale (500+ tickers), SVG fill compositing becomes expensive. Test whether outline-only rendering improves both performance and legibility — let the white space speak for itself without synthetic flags.

---

## What Changes

When outline mode activates, Tier 3 (background, non-signaled) tickers and their sector surrounds drop fills and render as outlines only.

### Before (Normal Mode)
- Sector surrounds: filled with low opacity + stroke
- Cluster band rings: filled with opacity + stroke
- Background ticker node: filled circle (dimmed)
- Metaball SVG filter active on all fills

### After (Outline Mode)
- Sector surrounds: stroke only, no fill
- Cluster band rings: stroke only, no fill
- Background ticker node: outlined circle, no fill
- Metaball SVG filter: disabled (no filled shapes to blur)
- **Signal-active tickers: unchanged** — stay fully filled and colored

---

## Automatic Triggers

Outline mode activates when **any** of these conditions is true:

1. **Index selection:** `activeIndex === 'sp500'` OR `activeIndex === 'russell1000'`
2. **Ticker count:** `visibleTickers.length >= 500` (from multi-sector toggles)
3. **Zoom level:** User scrolls mouse wheel outward 5+ clicks (zoom < 0.5x or similar threshold — to be calibrated)

Outline mode turns off when all three conditions are false.

Add a small indicator in the toolbar when outline mode is active: `[◻ OUTLINE]` — clickable to force toggle on/off manually.

---

## Implementation Details

### 1. Outline Mode State
```js
const [outlineMode, setOutlineMode] = useState(false);
```

Derive it from conditions above in a `useMemo`:
```js
const autoOutlineMode = useMemo(() => {
  if (INDEX_CONFIGS[activeIndex]?.isOutlineMode) return true;
  if (visibleTickers.length >= 500) return true;
  if (zoomLevel < OUTLINE_ZOOM_THRESHOLD) return true;
  return false;
}, [activeIndex, visibleTickers.length, zoomLevel]);

const outlineMode = userForcedOutline ?? autoOutlineMode;
```

### 2. Zoom Tracking
Track mouse wheel in the SVG container. Count consecutive outward scrolls (positive delta). Reset counter on inward scroll. When counter reaches 5, note the zoom threshold.

```js
const [zoomLevel, setZoomLevel] = useState(1.0);
const OUTLINE_ZOOM_THRESHOLD = 0.5; // Calibrate after first pass

function handleWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05; // Invert: down = zoom out
    setZoomLevel(z => Math.max(0.1, z + delta));
  }
}
```

### 3. Conditional Rendering
In the SVG render pass, wrap sector surround and cluster band fills:

**Sector surrounds:**
```jsx
<path d={surroundPath} fill={outlineMode ? "none" : "rgba(...)"} stroke={...} />
```

**Cluster bands (risk/opp rings):**
```jsx
<path d={riskRingPath} fill={outlineMode ? "none" : "rgba(239, 68, 68, 0.18)"} stroke="..." />
<path d={oppRingPath} fill={outlineMode ? "none" : "rgba(34, 197, 94, 0.18)"} stroke="..." />
```

**Background ticker nodes (only Tier 3):**
```jsx
{visibleTickers.map(t => {
  const isTier3 = !hasActivePills(t);
  return (
    <circle
      r={isTier3 && outlineMode ? 10 : 12}
      fill={isTier3 && outlineMode ? "none" : "#0F172A"}
      stroke={isTier3 && outlineMode ? "currentColor" : "none"}
      opacity={isTier3 ? 0.4 : 1.0}
    />
  );
})}
```

### 4. Disable Metaball Filter in Outline Mode
The metaball blur filter (feGaussianBlur) is applied to sector paths. At outline mode, skip it since there are no fills to blur:

```jsx
<defs>
  {!outlineMode && <filter id="metaball-blur">...</filter>}
</defs>

<path filter={outlineMode ? "none" : "url(#metaball-blur)"} />
```

---

## Russell 1000 Stub Data

R1K stubs currently show `price: "—"` and `change: "—"`. Phase 2 adds real data fetching.

### Current Behavior
R1K stubs are synthetic stock objects created in `CardsView`:
```js
const r1kStubs = RUSSELL1000_TICKERS.filter(t => !stockTickers.has(t)).map(t => ({
  ticker: t,
  name: t,
  sector: ...,
  price: '—',
  change: '—',
  pos: true,
  pills: [],
  stormScore: 0,
  riskScore: 0,
  oppScore: 0,
  isR1kStub: true,
}));
```

### New Behavior
Instead of hardcoded `'—'`, fetch real prices from Yahoo Finance API:

```js
async function fetchR1kPrices(tickers) {
  // Call existing price API (same as STOCKS_STATIC)
  // Return map: ticker → {price, change, currency}
}

const r1kStubs = useMemo(() => {
  if (activeIndex !== 'russell1000') return [];
  return RUSSELL1000_TICKERS.filter(t => !stockTickers.has(t)).map(t => {
    const priceData = r1kPriceMap[t] ?? {price: null, change: null};
    return {
      ticker: t,
      name: t,
      sector: SECTOR_GROUPS.find(g => g.tickers.includes(t))?.label ?? '?',
      price: priceData.price ?? '—',
      change: priceData.change ?? '—',
      pos: priceData.change !== null ? priceData.change > 0 : true,
      pills: [],
      stormScore: 0,
      riskScore: 0,
      oppScore: 0,
      isR1kStub: true,
    };
  });
}, [activeIndex, stockTickers, r1kPriceMap]);
```

**Integration:**
- Add R1K tickers to the existing `useLivePrices` hook or create a parallel fetch
- Cache the results (debounce, 5-minute TTL)
- Show a loading state if data is stale or pending
- Fall back to `'—'` if fetch fails

This makes R1K stubs indistinguishable from real stocks in Card View and Reference Card — they have real prices and can be compared.

---

## Open Questions

1. **Zoom threshold calibration:** What zoom level should trigger outline mode? Start with 0.5x (half zoom), test in practice, adjust based on feel.

2. **Cluster band fills in outline mode:** Current spec removes fills from cluster rings (risk/opp bands). Does this hurt readability? If so, keep cluster band fills but still remove sector surround fills.

3. **R1K price API cost:** If all 323 R1K tickers must be fetched fresh, does that exceed rate limits? Should we batch fetch in the background and cache, or lazy-load on demand when a user selects russell1000 index?

4. **Outline mode indicator placement:** Where in the toolbar should `[◻ OUTLINE]` go? Suggest: right-aligned, next to the existing `RISKS / OPENINGS / SECTORS` group.

---

## Implementation Sequence

1. **Zoom tracking** — Add wheel listener, track zoomLevel state
2. **Outline mode state** — Derive from conditions (index, ticker count, zoom)
3. **SVG fill conditionals** — Wrap sector/cluster fills with `{!outlineMode && ...}`
4. **Filter toggle** — Disable metaball in outline mode
5. **Toolbar indicator** — Add `[◻ OUTLINE]` button with manual override
6. **R1K price fetching** — Integrate real price data into r1kStubs
7. **Test & tune** — Load S&P 500, zoom out, verify outline mode looks intentional not broken
