# Perfect Storm — Autonomy Upgrade Opportunities
*Last Updated: May 4, 2026*

> Which parts of the site could be made self-updating so they don't require Claude sessions to stay fresh? Priority-ordered by impact vs. implementation cost.

---

## What "Autonomous" Means Here

A feature is "autonomous" if it updates itself from live data without Claude needing to write new code, edit pill arrays, or author signal rules. The goal is to reduce the manual-refresh surface area while keeping human judgment in the loop for things that genuinely need editorial review.

---

## Tier 1 — High Impact, Low Effort (Build These First)

### 1. Remove PILL_EPOCH — Unstamped Pills = Immediately Flag for Review
**Decision (May 2026):** PILL_EPOCH is the wrong model. The correct model is: `lastChecked` is the authoritative stamp set when a pill is actually reviewed. Pills with no `lastChecked` are unreviewed — they should surface the `needsReview` indicator immediately, not pretend they were written on some arbitrary date.

**Upgrade:** Remove PILL_EPOCH entirely. In `agePill()`, when no `lastChecked` exists, set `daysSinceReview = Infinity` and `needsReview = true` rather than falling back to an epoch:
```js
// Current (wrong):
const base = pill.lastChecked ? new Date(pill.lastChecked)
           : pill.dateAdded   ? new Date(pill.dateAdded)
           : PILL_EPOCH;  // ← arbitrary date, goes stale, requires monthly reset

// Correct:
const base = pill.lastChecked ? new Date(pill.lastChecked)
           : pill.dateAdded   ? new Date(pill.dateAdded)
           : null;  // no date = unreviewed

const daysSinceReview = base ? (now - base) / MS_PER_DAY : Infinity;
const needsReview = !base || daysSinceReview >= PILL_REVIEW_DAYS;
```
**Effect:** Pills stamped with `lastChecked` age naturally. Pills with no stamp flag immediately. No monthly maintenance. The review indicator becomes a genuine signal that a pill needs attention, not an artifact of an aging epoch.

**Effort:** ~10 lines in `agePill()` + remove the `PILL_EPOCH` const.

---

### ~~2. Earnings Calendar Auto-Pills~~ — SIDELINED (May 2026)

**Decision:** Not building. Earnings dates are a commodity feature available in every financial terminal (Yahoo Finance, Robinhood, Bloomberg, etc.). Maintaining a live earnings calendar integration adds API dependency and refresh overhead for no differentiated value — traders will check earnings dates elsewhere. Perfect Storm's edge is convergent signal detection, not calendar data.

**What we do instead:** The RSS signal engine already captures earnings beats/misses as they happen via `EARN:` category rules. Post-earnings narrative pills (SR-018, SR-045, SR-067) fire from live articles, which is more timely than pre-scheduled calendar entries anyway.

---

### 3. `/api/export` — Machine-Readable State Endpoint
**Current:** No JSON export. Reading app state requires screenshots or browser automation.

**Upgrade:** Add `/netlify/functions/export.js` that returns:
```json
{
  "generatedAt": "2026-05-04T11:32:00Z",
  "counts": { "risks": 36, "openings": 26, "storms": 111 },
  "stocks": [ { "ticker": "RTX", "riskScore": 82, "oppScore": 71, ... } ],
  "patterns": [ { "title": "Iran Conflict — Sector Divergence", "score": 94 } ],
  "feedHealth": { "live": 52, "pending": 6, "failed": 0 }
}
```

**Who uses this:**
- Claude can audit the app by reading `/api/export` instead of screenshots
- Slack bots can post daily storm briefings
- Portfolio tools can query it for "which of my stocks have active storms?"
- Future mobile app can consume it directly

**Challenge:** The computed STOCKS state lives in React, not a database. The export function would need to replicate the pill computation (agePill + calcStormScores) as a server-side module. Or: share `App.jsx`'s STOCKS data and pill logic in a separate `data.js` module that both the React app and Netlify functions import.

**Effort:** Medium-High — ~6h. Requires extracting STOCKS/SIGNAL_RULES into a shared module.

---

### 4. Dead Feed Auto-Detection
**Current:** Feed failures are silent. A feed can 404 for weeks without anyone noticing. The fix (consumerist.com → consumeraffairs.com) was only found during a manual audit.

**Upgrade:** Add feed health tracking in `/api/feed`. When a feed returns a non-200 status or empty result, log it. Build a `/api/feedhealth` endpoint that returns:
```json
{
  "feeds": [
    { "url": "oilprice.com/rss/main", "status": "ok", "articleCount": 12, "lastSuccess": "2026-05-04T10:15:00Z" },
    { "url": "anandtech.com/rss/", "status": "error", "error": "403", "failedSince": "2026-04-22" }
  ]
}
```

Show a feed health badge in the Signal Feed UI: "58/58 feeds live" (or "56/58 — 2 failing").

**Effort:** Low-Medium — ~3h. Netlify function + UI indicator.

---

## Tier 2 — High Impact, Medium Effort

### 5. LLM-Assisted Pill Generation (Claude Haiku Loop)
**Current:** ~1,900 curated pills are all manually authored. When a new macro theme emerges, Claude must write new pills for every affected stock.

**Upgrade:** Daily scheduled job that:
1. Fetches all live articles that matched signal rules in the last 24 hours
2. For each firing signal rule + affected ticker, asks Claude Haiku: "Given this article and ticker, write a 5-word pill label (format: `Category: Specific mechanism`) and classify as risk or opportunity"
3. Stages the generated pills for review (they don't auto-deploy — they show in a "Pending Pills" review queue in the UI)
4. Eugene or Claude approves/rejects in bulk

**What stays manual:** Approval. The AI generates, a human confirms. This keeps editorial control while dramatically reducing the authoring burden.

**Effort:** High — ~1 week. Requires scheduled Netlify function, Haiku API integration, review UI.

---

### 6. Analyst Rating Signal Auto-Detection
**Current:** No rule for analyst upgrades/downgrades (GAP identified in audit).

**Upgrade:** Rather than pattern-matching analyst changes from general RSS feeds (which often don't include them), connect to a free analyst ratings API:
- **Benzinga Basic** (free tier) — analyst ratings feed
- **Financial Modeling Prep** — `/analyst-stock-recommendations` endpoint

Auto-inject pills:
```js
// On upgrade:
{ dir: 'opp', cat: 'EARN', label: 'EARN: Goldman → Buy, PT $280', state: 'active', dateAdded: today }
// On downgrade:
{ dir: 'risk', cat: 'EARN', label: 'EARN: JPM → Underweight, PT $180', state: 'active', dateAdded: today }
```

**Effort:** Medium — ~4h for the API integration. Auto-pill injection is easy once data is available.

---

### 7. Short Interest Auto-Signal
**Current:** No short interest data anywhere in the app.

**Upgrade:** FINRA publishes short interest bi-monthly. Financial Modeling Prep has a free short float endpoint. Auto-flag stocks with short interest > 15% of float with a neutral badge:
```js
{ dir: 'risk', cat: 'SECT', label: 'SECT: Short Float 22% — Squeeze Risk', state: 'emerging' }
```

Combined with signal detection (a positive catalyst + high short interest = potential squeeze pattern), this adds a new dimension of analysis.

**Effort:** Medium — ~4h. Bi-monthly data refresh is fine for this signal.

---

### 8. Social Sentiment Pulse (Reddit / StockTwits)
**Current:** Zero social signal. Reddit/WallStreetBets moves stocks that the traditional RSS feeds completely miss (AMC, GME, MEME category exists but fires on no actual live data).

**Upgrade:** StockTwits has a free API with sentiment scores per ticker. Reddit's Pushshift API gives post volumes. Add a "Social Buzz" dimension:
```js
{ dir: 'risk', cat: 'MEME', label: 'MEME: Reddit Retail Attention Spike', state: 'active' }
```

**Effort:** Medium — ~4h. Rate limits on free tiers are a constraint.

---

## Tier 3 — Strategic, Longer-Term

### 9. Per-Stock Signal Rules (Ticker-Specific NLP)
**Current:** Signal rules are generic — the same regex fires for all tickers in the list. NVDA and AAPL both get the "Tariff Wave" pill from the same rule.

**Upgrade:** Layer a per-stock filter on top of generic rules. For AAPL, the tariff story is about China manufacturing concentration. For GM, it's about EU auto tariffs. The label and weight should differ even if the same macro event triggers both.

**Implementation:** Add a `perTicker` map to signal rules that overrides `label` and `cat` for specific tickers:
```js
{ id:"SR-003", pattern:/tariff.../,
  cat:"MACRO", dir:"risk", label:"MACRO: Tariff Wave",
  tickers:["AAPL","TSLA","GM","F"],
  perTicker: {
    "AAPL": { label: "MACRO: China Mfg Tariff +$900M Q2 Cost", cat: "GEO" },
    "GM":   { label: "MACRO: EU Auto Tariff 25% — US Export Hit", cat: "MACRO" }
  }
}
```

**Effort:** High — requires touching both signal matching and pill rendering logic.

---

### 10. Automated Quarterly Pill Expiry + Refresh Cycle
**Current:** Expired pills stay in the array forever (just hidden from scoring). The array grows indefinitely.

**Upgrade:** A quarterly Netlify scheduled function that:
1. Reads all pills with `effectiveState === 'expired'`
2. Removes them from the STOCKS array in `App.jsx` via git commit
3. Generates a "Quarterly Cleanup Report" showing what was removed

**Effort:** High — automated git commits from Netlify functions require careful permission setup. Better done manually for now with Claude running the cleanup.

---

### 11. Price-to-Signal Correlation Detector
**Current:** Storm scores are signal-based, not price-reaction-based. A signal that historically moves the stock 5% is weighted the same as one that moves it 0.5%.

**Upgrade:** For each (ticker, signal rule) pair that has fired historically, track the 5-day price reaction. Use this to calibrate `PILL_WEIGHT` dynamically. High-conviction signals (historically correlated with price moves) get higher weight.

**Effort:** Very High — requires historical data, statistical analysis, and a weight recalibration loop. Phase 3+ territory.

---

## Summary Autonomy Roadmap

```
DONE:
  [x] RSS feed polling (always autonomous)
  [x] Price data (Yahoo Finance, 60s poll)
  [x] Dead feed auto-detection (feed health badge in Signal Feed)
  [x] Short interest auto-signal (FMP /api/short-interest, May 2026)
  [x] Social sentiment pulse (StockTwits, May 2026)

THIS WEEK:
  [ ] Remove PILL_EPOCH — unstamped pills flag immediately for review (see item #1)
  [ ] Outline mode toolbar indicator [◻ OUTLINE] with manual toggle
  [ ] /api/export JSON endpoint

SIDELINED:
  [~] Earnings calendar — commodity feature, traders check elsewhere (May 2026)

THIS MONTH:
  [ ] Analyst rating auto-signal (FMP /analyst-stock-recommendations)
  [ ] LLM-assisted pill generation (Haiku draft loop → review queue)

PHASE 3+:
  [ ] Per-stock signal rule overrides (perTicker map)
  [ ] Price-to-signal correlation calibration
  [ ] Automated quarterly pill cleanup
```

The most impactful single change: **Dynamic PILL_EPOCH** (2 lines, today). The most transformative: **LLM-assisted pill generation** — turns a quarterly manual refresh into a daily automated draft-and-approve loop.
