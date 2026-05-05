# Perfect Storm — Live Build Audit Report

**Date:** March 28, 2026
**Site:** https://perfect-storm.app
**Repo:** github.com/space-ctrl-dot-co/perfect-storm (master @ ade37fa)
**Deploy:** Netlify, Vite + React 18 SPA

---

## Executive Summary

The live app renders 97 stock cards across 5 views with a working RSS signal pipeline, a CORS proxy layer, and article enrichment. The core signal engine is **live and functional** — 31 RSS feeds are polled, 553 articles are fetched, and 143 keyword-matched signals are generated and mapped to 14 core tickers in real time. However, prices for all 97 stocks and pill assignments for the remaining 83 non-core tickers are **simulated/static**, not sourced from live market data or live RSS signals. The ticker tape headlines are live.

---

## Container Audit: LIVE vs SIMULATED

### LIVE — Real-Time Data Containers

| Container | Source | Status | Notes |
|---|---|---|---|
| **RSS Feed Fetcher** | 31 RSS feeds via `/api/feed` CORS proxy | **LIVE** | 29/31 returning 200. Fetches 553 articles per cycle. |
| **Signal Matching Engine** | `ps-feeds.js` — 83 keyword rules × 14 tickers | **LIVE** | 553 articles → 143 matched signals. Keyword-in-haystack matching. |
| **Signal-to-Pill Mapping** | `useLiveSignals` hook merges matched signals onto cards | **LIVE** | Pills for 14 core tickers are derived from actual RSS article content. |
| **Ticker Tape Headlines** | RSS article titles surfaced as scrolling headlines | **LIVE** | Confirmed: "REUTERS: Iran IRGC commander threatens Hormuz closure…" |
| **Article Metadata Enrichment** | `/api/meta` proxy scrapes OG tags (image, description, author) | **LIVE** | Hundreds of meta calls observed on page load. WSJ returns 401 (paywall). |
| **Refresh Polling** | `setInterval` re-fetches feeds periodically | **LIVE** | UI shows "↻ 39s ago" counter. Multiple poll cycles confirmed in console. |
| **Pill Lifecycle Labels** | EMERGING / ACTIVE / FADING states on pills | **LIVE** | Confirmed rendering on DAL expanded card ("◌ EMERGING"). |

### SIMULATED — Static / Generated Data Containers

| Container | Current Source | Status | What's Needed to Go Live |
|---|---|---|---|
| **Stock Prices (all 97)** | `Math.random()` + simulate logic in App.jsx | **SIMULATED** | Integrate a live market data API (Polygon, Finnhub, Yahoo Finance, or Alpha Vantage). |
| **Price Change %** | Generated alongside simulated prices | **SIMULATED** | Derived automatically once live prices are connected. |
| **Pills for 83 non-core tickers** | Thematic/static category assignments hardcoded in App.jsx | **SIMULATED** | Expand `SIGNAL_RULES` in ps-feeds.js to cover all 97 tickers, or add an LLM tagging layer. |
| **Storm Scores (non-core)** | Computed from pill weights — but underlying pills are static | **SIMULATED** | Scores will become live once pills for all tickers come from RSS signals. |
| **Storm Scores (core 14)** | Computed from live pill weights — partially live | **PARTIAL** | Already functional for the 14 core tickers. Needs expansion. |
| **DAL Expanded Card Narrative** | Hardcoded editorial text ("$400M Q1 Fuel Surge", "AmEx Rate Cap Threat") | **SIMULATED** | Generate narrative summaries from matched article content (LLM or template). |
| **Wave Animations** | Score-driven but score inputs are partially simulated | **PARTIAL** | Will become fully live once all pill sources are live. |
| **RISK / OPP Counters** | Derived from scores — partially simulated input | **PARTIAL** | Same dependency chain as storm scores. |

### The 14 Core Tickers (Live Signal Coverage)

These tickers have real RSS-derived pills flowing from the signal engine:

TSLA, XOM, AAPL, TSM, ZIM, DAL, UNH, LLY, NVDA, AMD, MSFT, GS, RTX, LMT

### The 83 Extended Tickers (Static Pills Only)

These tickers appear on cards with sector and category pills, but those pills are hardcoded thematic assignments — not derived from RSS content:

AAL, JBLU, UAL, LUV, ULCC, SKYW, ALK, SAVE, HA — Airlines
NOC, HII, LHX, LDOS, CACI, SAIC, GD — Defense
CEG, AES, NEE, ED, BEP, D — Utilities
ENPH, FSLR, RUN, PLUG — Renewables
CLF, RIO, FCX, NEM, VALE, LIN, AA, X, MP — Materials/Mining
META, AMZN, GOOGL, ORCL, CRM, COIN — Tech/Software
JPM, BAC, WFC, MS, C, BX, AXP, V — Finance
BMY, PFE, JNJ, ABBV, AMGN, MRK, GILD, REGN — Pharma
NKE, TGT, WMT, COST, HD, MCD, PG — Consumer/Retail
GM, F, BA, DE — Industrials
SLB, VLO, OXY, COP, PSX, HAL, MPC, EOG, CVX — Energy
MOS, CF, ADM — Agriculture
AMT — REITs
AVGO, INTC — Semiconductors

---

## Feed Health Report

| # | Feed ID | Source | Status | Issue |
|---|---|---|---|---|
| 1 | fed-press | Federal Reserve | **200 ✅** | |
| 2 | wsj-economy | WSJ Markets | **200 ✅** | Meta scraping returns 401 (paywall) |
| 3 | cnbc-markets | CNBC | **200 ✅** | |
| 4 | marketwatch | MarketWatch | **200 ✅** | |
| 5 | bbc-business | BBC Business | **200 ✅** | |
| 6 | eia-news | EIA Press Room | **404 ❌** | URL dead — needs replacement |
| 7 | oilprice | OilPrice.com | **200 ✅** | |
| 8 | rigzone | Rigzone | **200 ✅** | |
| 9 | techcrunch | TechCrunch | **200 ✅** | |
| 10 | semiwiki | SemiWiki | **200 ✅** | |
| 11 | anandtech | AnandTech | **200 ✅** | |
| 12 | ieee-spectrum | IEEE Spectrum | **200 ✅** | |
| 13 | semiengineering | SemiEngineering | **200 ✅** | |
| 14 | politico-eu | Politico EU | **451 ❌** | Blocked — "Unavailable For Legal Reasons" |
| 15 | defnews | Defense News | **200 ✅** | |
| 16 | aljazeera | Al Jazeera | **200 ✅** | |
| 17 | bbc-world | BBC World | **200 ✅** | |
| 18 | foreign-policy | Foreign Policy | **200 ✅** | |
| 19 | joc | JOC | **200 ✅** | |
| 20 | splash247 | Splash247 | **200 ✅** | |
| 21 | hellenic-ship | Hellenic Shipping News | **200 ✅** | |
| 22 | aviationwk | Aviation Week | **200 ✅** | |
| 23 | airlinerwatch | Airline Geeks | **200 ✅** | |
| 24 | fierce-pharma | Fierce Pharma | **200 ✅** | |
| 25 | stat-news | STAT News | **200 ✅** | |
| 26 | biopharma-dive | BioPharma Dive | **200 ✅** | |
| 27 | healthcare-dive | Healthcare Dive | **200 ✅** | |
| 28 | endpoints-news | Endpoints News | **200 ✅** | |
| 29 | sec-edgar-8k | SEC EDGAR 8-K | **200 ✅** | |
| 30 | noaa-severe | NOAA Weather | **200 ✅** | |
| 31 | climate-wire | E&E ClimateWire | **200 ✅** | |

**Feed Health: 29/31 live (93.5%)**

---

## Architecture Summary

```
Browser (React SPA)
  │
  ├── useLiveSignals hook
  │     ├── For each of 31 PS_FEEDS:
  │     │     fetch("/api/feed?url=<rss_url>")
  │     │       → Netlify Function (feed.js) — CORS proxy
  │     │         → upstream RSS XML
  │     │
  │     ├── rss-pipeline.js
  │     │     parseXML() → fetchOneFeed() → dedup()
  │     │
  │     ├── ps-feeds.js
  │     │     matchArticleSignals() — 83 keyword rules × 14 tickers
  │     │
  │     └── Returns: Map<ticker, Pill[]> for 14 core tickers
  │
  ├── enrichArticle()
  │     fetch("/api/meta?url=<article_url>")
  │       → Netlify Function (meta.js) — OG tag scraper
  │
  ├── App.jsx (215KB)
  │     ├── 97-stock universe with static metadata
  │     ├── Simulated prices (Math.random)
  │     ├── Thematic/static pills for 83 non-core tickers
  │     ├── Merges live signals onto core 14 tickers
  │     ├── Storm score engine (pillScores)
  │     └── All 5 views: Card, Storm, Nation, Signal Feed, Index
  │
  └── UI Layer
        ├── Ticker tape (live headlines)
        ├── RISK/OPP counters
        ├── Sort (Storm/Risk/Opp) + Filter (All/Risk/Opp/Calm)
        ├── Refresh timer ("↻ Ns ago")
        └── "● LIVE" indicator
```

---

## Development Plan — Next Steps to Full Live Data

### Phase 1: Live Prices (High Impact)
- **Task:** Integrate a market data API for real-time stock quotes
- **Options:** Polygon.io (free tier: 5 calls/min), Finnhub (free: 60/min), Yahoo Finance (unofficial), Alpha Vantage (free: 25/day)
- **Scope:** New Netlify function `/api/price` or client-side polling
- **Tickers:** All 97
- **Unlocks:** Live prices, live % change, accurate storm scores

### Phase 2: Expand Signal Rules (Core Engine)
- **Task:** Add keyword signal rules for the 83 non-core tickers
- **Scope:** Expand `SIGNAL_RULES` in ps-feeds.js from 83 → ~300+ rules
- **Add feeds:** Sector-specific RSS for airlines, defense, pharma, materials, finance, consumer, energy (many already covered by broad feeds like CNBC/BBC)
- **Unlocks:** Every stock gets live RSS-derived pills instead of static categories

### Phase 3: LLM Signal Tagging (Planned)
- **Task:** Replace/augment keyword matching with Claude Haiku for more nuanced signal extraction
- **Scope:** New backend service (FastAPI + Claude Haiku)
- **Unlocks:** Mechanism-specific pill labels (≤5 words), lifecycle detection, narrative generation

### Phase 4: Fix Broken Feeds
- **Task:** Replace EIA press room (404) and Politico EU (451)
- **Candidates:** EIA → EIA Today in Energy RSS or EIA API; Politico → Reuters Politics, The Hill, Euractiv

### Phase 5: Expanded Card Narratives
- **Task:** Generate editorial summaries from matched articles instead of hardcoded text
- **Scope:** Template or LLM-generated from article headlines + signal context
- **Currently hardcoded:** DAL's "$400M Q1 Fuel Surge", "AmEx Rate Cap Threat" etc.

---

## What's Working Well

- The RSS→signal pipeline is battle-tested and performant (553 articles processed client-side)
- CORS proxy and meta scraper Netlify functions are stable
- The UI is polished — 5 views, sort/filter, refresh timer, expanded cards
- Feed health is strong at 93.5% uptime
- The merge architecture (live signals overlay on static base) is clean and extensible
- Pill lifecycle states (Emerging/Active/Fading) are rendering correctly
