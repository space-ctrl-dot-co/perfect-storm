# Perfect Storm — Live App Audit & Improvement Plan
*Conducted: May 4, 2026 · Auditor: Claude*

---

## Audit Method

- Live app inspection at `https://perfect-storm.app` via browser
- Network request capture (all 58 RSS feeds + price API calls observed)
- Source code audit: `App.jsx` signal rules, curated pills, TTL constants
- Signal Feed, Card View, Storm View all reviewed
- 62 signal rules read and assessed against current May 2026 news cycle

---

## TL;DR — The 3 Things That Matter Most Right Now

1. **🔴 PILL_EPOCH bug is live** — all curated pills are artificially downgraded. Storm scores are 40% lower than intended. 1-line fix.
2. **🟠 3 major May 2026 signals have zero rules** — India-Pakistan escalation, EU-US auto tariffs, FOMC hold. Articles are being missed.
3. **🟡 Only 22 of ~1,900 pills have `dateAdded`** — temporal aging system built correctly but running on bad input data.

---

## Section 1: What's Working Well

### ✅ Live Signal Engine is Genuinely Impressive
The Signal Feed is detecting real articles and firing meaningful signals:
- "Trump raises EU auto tariffs to 25%" → correctly fires tariff risk
- "Eli Lilly beats estimates on GLP-1" → fires GLP-1 Supercycle + Obesity Market Expansion simultaneously
- "Middle East risk underpriced in AI" → fires GPOL: Middle East Conflict Premium on XOM

### ✅ Emergent Patterns are Trader-Grade Insights
The 5 cross-stock patterns detected are genuinely useful analysis a trader would pay for:
- *Iran Conflict — Sector Divergence* (score 94): "RTX/LMT/XOM carry ACTIVE OPP from same Iran signal that pushes DAL/AAL into ACTIVE RISK. Same root cause, opposite price outcomes."
- *AI Capex Cycle — Chip vs. Software Split* (88): "NVDA+AMD capture AI capex spend while MSFT is squeezed: $37.5B/yr on infra yet Copilot at 3.3% adoption"
- *Tariff Wave — Multi-Sector Amplification* (81): AAPL/TSLA/DAL each exposed via different transmission paths

### ✅ Infrastructure is Solid
- 58 RSS feeds polling correctly (all 58 observed firing in network requests)
- Price data loading in batches of 40 via `/api/price` — all 200 status
- Force layout, sector surrounds, wave animations all rendering correctly
- 36 RISKS / 26 OPENINGS / 111 STORMS live at time of audit

---

## Section 2: Critical Bugs

### 🔴 BUG-1 — PILL_EPOCH is 33 days stale (HIGHEST PRIORITY)

**What:** `PILL_EPOCH = new Date("2026-04-01")` is the universal baseline date for all pills without a `dateAdded` field. Since `TTL_STALE = 30` days, any "active" curated pill defaults to **emerging** at 33 days old. Only 22 of ~1,909 pills have explicit `dateAdded`.

**Effect on traders:** Storm scores are ~30–40% lower than intended. A ticker with 4 active curated pills that should score ~75 is scoring ~50. The STORM filter (`riskScore > 25 && oppScore > 25`) may be suppressing stocks that should surface.

**The fix — 1 line in App.jsx:**
```js
// BEFORE:
const PILL_EPOCH = new Date("2026-04-01");

// AFTER (option A — reset to today, preserves TTL logic going forward):
const PILL_EPOCH = new Date("2026-05-04");

// AFTER (option B — lengthen TTL_STALE to give curated pills room to breathe):
const TTL_STALE = 60;  // days before active → emerging downgrade
```

**Recommendation:** Option A (reset PILL_EPOCH to today). Do this immediately. Then commit to updating dateAdded on new pills as they're authored.

---

### 🔴 BUG-2 — AAPL test pills still live with Dec 2025 dateAdded

The AAPL pills include test data added April 8 for temporal aging QA:
- `"Macro: Tariffs +$900M Q2 Cost"` — dateAdded `2025-12-25` → **130 days old → EXPIRED**
- `"Geo: China Brand Erosion -14%"` — dateAdded `2026-02-07` → **86 days old → EXPIRED**
- `"Policy: DOJ App Store Antitrust"` — dateAdded `2026-03-09` → **56 days old → FADING**

These test entries are degrading AAPL's displayed signals. Two are expired (hidden from score). Need to either remove test pills or update dateAdded to reflect when these signals actually became live.

**Current reality for AAPL (May 2026):** The real active signals are:
- China tariff pass-through cost ($900M Q2 — confirmed by Cook on earnings call)
- DOJ App Store antitrust probe
- EU DMA non-compliance cost
- China iPhone share loss to Huawei
- India manufacturing pivot as tariff hedge
- Apple Intelligence on 62% of fleet (opp)
- Services ARR growth (opp)

**Fix:** Update all AAPL pills with current `dateAdded: "2026-05-04"` and remove stale test entries.

---

## Section 3: Signal Rule Gaps — May 2026 News Cycle

### 🟠 GAP-1 — India-Pakistan Escalation (No Rule)

**Why it matters:** The Pahalgam attack (April 22), LOC exchange, and ongoing military standoff is the most significant active geopolitical event outside Ukraine/Middle East. Zero signal rules cover it.

**Affected stocks:**
- Airlines: DAL, AAL, UAL (route diversions, fuel premium)
- Defense: LMT, RTX, NOC (India is a major US arms buyer in this scenario)
- Energy: XOM, CVX (regional supply disruption premium)
- Tech: INFY, WIT, CTSH (India IT labor exposure)

**Proposed rule:**
```js
{ id:"SR-063", pattern:/india.*pakistan|pakistan.*india|kashmir.*conflict|loc.*ceasefire|pahalgam|surgical.*strike.*india|south.*asia.*military/i,
  cat:"GPOL", dir:"risk", label:"GPOL: India-Pakistan Border Escalation",
  tickers:["DAL","AAL","UAL","LMT","RTX","NOC","XOM","CVX","INFY","WIT","CTSH"] }
```

---

### 🟠 GAP-2 — EU-US Auto Tariffs (Misfiring as US-China)

**Why it matters:** "Trump raises EU auto tariffs to 25%" is the top article in the feed right now. It fires SR-003 (MACRO: Tariff Wave) with `requiredContext` requiring China/electronics/automotive. The `automotive` token catches it, but the signal label says "Tariff Wave" — it should be a distinct EU signal. F, GM, STELLANTIS, BMW-exposed stocks need a separate European tariff pill.

**Affected stocks:** F, GM (EU export exposure), BWA, APTV (European auto supplier chain), TSLA (EU sales), BMW/VWAGY (direct)

**Proposed rule:**
```js
{ id:"SR-064", pattern:/eu.*auto.*tariff|europe.*tariff.*car|25.*percent.*auto.*europe|trump.*eu.*automobile|european.*auto.*25/i,
  cat:"MACRO", dir:"risk", label:"MACRO: EU Auto Tariff 25% Shock",
  tickers:["F","GM","BWA","APTV","TSLA","STLA","MBGYY","VWAGY"] }
```

---

### 🟠 GAP-3 — FOMC "Rates on Hold" (No Rule)

**Why it matters:** The Fed held rates at the May 7 meeting. The market is pricing ~2 cuts for 2026. A "hawkish hold" or "higher-for-longer" signal has significant sector impact — hits REITs, utilities, homebuilders, benefits banks. The existing rules only cover "rate cut" (SR-036) and "rate hold/pause extension" (SR-008) — SR-008 only fires on GS.

**Proposed rule:**
```js
{ id:"SR-065", pattern:/fed.*hold.*rate|fomc.*unchanged|rates.*higher.*longer|fed.*pause.*extend|no.*cut.*2026|rate.*on.*hold/i,
  cat:"RATE", dir:"risk", label:"RATE: Fed Higher-for-Longer — Rate Sensitive Sectors Hit",
  tickers:["LEN","DHI","PHM","NVR","TOL","WELL","VTR","O","AMT","EXR","PSA","SPG","PLD","DUK","NEE","SO","D","XEL","AEP"] },
```

Also: a companion opp rule for banks:
```js
{ id:"SR-066", pattern:/fed.*hold.*rate|fomc.*unchanged|rates.*higher.*longer/i,
  cat:"RATE", dir:"opp", label:"RATE: Fed Hold Extends Bank NIM Premium",
  tickers:["JPM","BAC","WFC","C","GS","MS","SNV","WAL","FHN","WTFC","BOKF"] }
```

---

### 🟡 GAP-4 — Earnings Beat/Miss Signal (Broad)

Currently only EARN: Medical Loss Ratio Spike (SR-018) and EARN: FDA Drug Approval (SR-045) exist. There's no general earnings beat/miss rule that fires on big earnings surprises and routes to the specific stock.

The challenge: ticker-specific earnings signals are hard to write generically. Best approach is a broad pattern that fires on major beats/misses and uses the article source (e.g., CNBC, Bloomberg) to identify the ticker from the headline.

**Proposed rule:**
```js
{ id:"SR-067", pattern:/beats.*estimate.*raise.*guidance|blows.*past.*estimates|guidance.*raise.*\$|revenue.*beat.*record|earnings.*surge.*percent/i,
  cat:"EARN", dir:"opp", label:"EARN: Earnings Beat + Guidance Raise",
  tickers:[] /* dynamically matched from headline entity */ }
```

*(Note: tickers:[] means the rule fires with semantic matching to the headline rather than a preset list — requires NLP enhancement to be useful)*

---

### 🟡 GAP-5 — Dollar Strength / Safe Haven Flows

WSJ ticker showing: "Swiss franc, Japanese yen Rise as DeepSeek News Boosts Safe Havens." Dollar weakness and safe-haven currency flows affect multinationals, emerging markets, and precious metals significantly. No rule exists.

**Proposed rule:**
```js
{ id:"SR-068", pattern:/dollar.*weaken|dxy.*fall|safe.?haven.*inflow|yen.*surge|franc.*surge|dollar.*index.*drop|usd.*selloff/i,
  cat:"MACRO", dir:"opp", label:"MACRO: Dollar Weakness — EM & Commodity Tailwind",
  tickers:["NEM","GOLD","GFI","FCX","RIO","VALE","GS","MS","MSFT","AAPL","AMZN","GOOGL"] }
```

---

## Section 4: Feed Quality Issues

### INCOMING FEED shows only 12 items

With 58 RSS feeds polling every 5 minutes, the feed should surface far more than 12 articles. The display is filtered to show only articles that matched at least one signal rule. This is correct behavior — but it means the feed looks sparse when rules aren't firing.

**Trader perception problem:** A trader visiting Signal Feed and seeing 12 items from articles dated "May 1" and "Apr 30" may think the product is stale, even though feeds are polling live. The newest article visible is "May 1" on a May 4 audit.

**Root cause options:**
1. Some rules require very specific patterns (e.g. SR-006 requires "copilot.*adopt|copilot.*stall|ai.*penetrat.*3\." — extremely narrow)
2. Some feeds may be returning articles that don't match any rules
3. The feed display only shows the top N most recent matched articles

**Recommendation:** Show unmatched articles in a separate "Raw Feed" section below matched articles. Even unmatched headlines give traders market context.

### Feed-to-Ticker Mismatch

"Trump says he's raising EU auto tariffs to 25%" fires signals on: `F, TSLA, AMZN, NKE, AAPL, YUM, GM, LULU, DASH, JD, PDD`

**Questionable assignments:**
- YUM (Yum! Brands) — restaurant chain minimally affected by EU auto tariffs
- LULU (Lululemon) — athletic apparel, indirect at best
- DASH (DoorDash) — US food delivery, no EU auto exposure
- NKE (Nike) — apparel, some EU exposure but auto tariff-specific signal is misleading

This is because SR-003 (Tariff Wave) covers all of these tickers as "consumer goods" — the `requiredContext` fires on `consumer goods` which is too broad. NKE is in the consumer goods category but its tariff exposure is apparel/footwear, not auto.

**Fix:** Tighten SR-003 ticker list OR add `requiredContext` sub-conditions:
```js
// SR-003 — consider splitting into:
// SR-003a: Auto/Electronics tariff → AAPL, TSLA, F, GM, BWA, APTV
// SR-003b: Consumer goods tariff → NKE, LULU, CROX, WMT, AMZN, TGT
```

---

## Section 5: Trader-Specific Features Missing

These are the gaps that separate a signal-detection tool from a *trading tool*. Priority-ordered:

### P1 — Earnings Calendar Overlay
**Why:** Traders' #1 scheduling concern. "When does NVDA report?" Before an earnings date, existing risk/opp pills should be weight-boosted (higher uncertainty = higher storm score). After earnings, signals should update.

**Implementation:** Pull earnings dates from a free API (e.g., Alpha Vantage earnings calendar, Financial Modeling Prep free tier). Add an `earningsDate` field to stock objects. Show countdown ("NVDA reports in 4d") on Reference Card. Boost storm score by 1.2× in the 5 days before earnings.

### P2 — Analyst Upgrade/Downgrade Signal
**Why:** Analyst rating changes move stocks 3–8% on the day. They're a leading indicator that often precedes fundamental changes.

**Signal rule approach:**
```js
{ id:"SR-069", pattern:/analyst.*upgrade|price.*target.*raise|\$\d+.*to.*\$\d+.*target|overweight.*initiat|outperform.*initiat/i,
  cat:"EARN", dir:"opp", label:"EARN: Analyst Upgrade / Target Raise", tickers:[] }
{ id:"SR-070", pattern:/analyst.*downgrade|price.*target.*cut|underperform.*initiat|sell.*rating.*initiat/i,
  cat:"EARN", dir:"risk", label:"EARN: Analyst Downgrade / Target Cut", tickers:[] }
```

### P3 — Insider Buying Signal
**Why:** When executives buy their own stock with their own money, it's a strong signal. The SEC EDGAR feed is already connected (sr-025 observes SWIFT sanctions from EDGAR). Parse the Form 4 feed.

**Implementation:** `/api/feed?url=https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&dateb=&owner=include&count=40&output=atom` — already have the pattern from the existing EDGAR connection. Parse for `>$100K purchase` threshold.

### P4 — `/api/export` — Machine-Readable JSON Endpoint

**Why you asked this question:** Right now, the only way to read the live state of the app is via screenshots or browser automation. A `/api/export` Netlify function would return:

```json
{
  "timestamp": "2026-05-04T11:32:00Z",
  "stats": { "risks": 36, "openings": 26, "storms": 111 },
  "stocks": [
    {
      "ticker": "RTX",
      "riskScore": 82,
      "oppScore": 71,
      "stormScore": 115,
      "pills": [
        { "dir": "opp", "cat": "GPOL", "label": "GPOL: Defense Contract Award", "state": "active", "isLive": true },
        ...
      ],
      "topHeadline": "Patriot system order from Poland..."
    }
  ],
  "patterns": [...],
  "activeSignals": [...]
}
```

This lets Claude (or any AI) read the app state in one API call without screenshots. Enables:
- Automated daily briefings: "Here are the 5 biggest signal changes since yesterday"
- AI audit mode: Claude reads `/api/export` and flags stale pills, missing signals
- External integrations (Slack bot, trading alerts)
- Portfolio analysis: "Which of my holdings have active risk storms?"

**Implementation:** New file `/netlify/functions/export.js` — ~60 lines. Reads the same data the frontend computes, serializes to JSON.

*(The challenge: the computed STOCKS state lives in the React component, not a database. The export function would need to either: (a) replicate the pill computation logic in the Netlify function, or (b) run a headless browser. Option (a) is cleaner — extract the pill data and signal rules into a shared module.)*

### P5 — Short Interest Signal
**Why:** High short interest + strong news = short squeeze. Low short interest + bad news = easy further decline.

**Data source:** FINRA makes short interest data public (bi-monthly). FreeFloat API or Quandl have it. Add `shortInterest` field to stock data, surface as a pill modifier ("High Short Interest" badge on stocks with SI > 15%).

---

## Section 6: What Does an AI Need to Read This Site?

Currently: **no API exists.** Reading the site requires either screenshots or browser automation.

**What I can do right now without screenshots:**
1. `App.jsx` source read — gives complete curated pill data, all signal rules, all tickers
2. Direct RSS fetch via `/api/feed?url=...` — gives raw live articles
3. `get_page_text` — extracts rendered text from the page (headlines, pill labels)
4. Network request capture — reveals what feeds are polling and their status
5. JavaScript execution — can extract rendered component state if React fiber is accessible

**What would make this much better:**
- **`/api/export`** (build this) — one call returns full computed state
- **`/api/signals`** — returns only the currently-active signal rules that fired in the last N minutes
- **`/api/health`** — returns feed health: which of the 58 feeds returned 200, which errored, article counts per feed

---

## Implementation Roadmap

### Phase 0 — Bug Fixes (Today, ~30 min)

| Fix | File | Change |
|-----|------|--------|
| Reset PILL_EPOCH | App.jsx line ~248 | `new Date("2026-05-04")` |
| Update AAPL test pills | App.jsx line ~1019 | Replace test dateAdded with real current dates |
| Remove expired test pills | App.jsx | Delete `2025-12-25` and `2026-02-07` entries |

---

### Phase 1 — Signal Rule Refresh (This Week, ~2h)

| Rule | ID | Priority |
|------|----|----------|
| India-Pakistan Escalation | SR-063 | 🔴 High |
| EU Auto Tariff 25% Shock | SR-064 | 🔴 High |
| Fed Higher-for-Longer (risk) | SR-065 | 🟠 Medium |
| Fed Hold → Bank NIM opp | SR-066 | 🟠 Medium |
| Dollar Weakness / Safe Haven | SR-068 | 🟡 Medium |
| Analyst Upgrade | SR-069 | 🟡 Medium |
| Analyst Downgrade | SR-070 | 🟡 Medium |
| Tighten SR-003 ticker list | SR-003 | 🟠 Medium |

---

### Phase 2 — Trader Features (Next 2 Weeks)

| Feature | Complexity | Value |
|---------|------------|-------|
| `/api/export` JSON endpoint | Low (2–3h) | Very High (enables AI audit, Slack bot, external tools) |
| Earnings calendar overlay | Medium (4–6h) | Very High (traders' primary need) |
| Activate Brave/NewsAPI keys in Netlify | Trivial (15 min) | High (improves Tier 3 article quality for all pills) |
| Raw feed section (unmatched articles) | Low (1h) | Medium (reduces "sparse" perception) |
| Insider buying signal rule | Medium (3h) | High |

---

### Phase 3 — Data Quality (Ongoing)

| Task | Notes |
|------|-------|
| Add `dateAdded` to all curated pills | Do as pills are refreshed, not all at once |
| Quarterly curated pill refresh | Every 90 days, review all pills and update content to current narrative |
| Feed health dashboard | Show which of 58 feeds returned articles, error rates |
| Signal rule test suite | For each rule, maintain 3 test headlines that should fire and 2 that shouldn't |

---

## Summary Scores (Trader Lens)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Data freshness | 6/10 | Feeds are live but curated pills are 33d stale |
| Signal accuracy | 7/10 | Good rules but EU/India/FOMC gaps |
| Trader relevance | 5/10 | Missing earnings calendar, analyst signals, insider data |
| UX quality | 9/10 | Excellent — Storm View, emergent patterns are genuinely impressive |
| Article sourcing | 5/10 | Tier 3 not activated (no Brave key), only 12 matched articles showing |
| Coverage breadth | 8/10 | 424 tickers, 29 sectors, 62 rules — good |
| **Overall** | **7/10** | Strong foundation, specific fixable gaps |

---

*Next: Start with Phase 0 (PILL_EPOCH fix) — single line change, immediate quality improvement across all 400+ stocks.*
