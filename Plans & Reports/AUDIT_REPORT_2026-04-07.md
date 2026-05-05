# Perfect Storm — Live Build Audit Report

**Date:** April 7, 2026
**Site:** https://perfect-storm.app
**Repo:** github.com/space-ctrl-dot-co/perfect-storm (master @ 83aff49)
**Deploy:** Netlify, Vite + React 18 SPA
**Previous audit:** April 1, 2026 (master @ f2e1f63)

---

## Executive Summary

Three significant architectural advances since the April 1 audit. First, the cluster system was upgraded from 7 static clusters to 20 clusters including 13 new **signal-flip pairs** — same macro trigger, opposite directional effects on different industry groups (e.g., rising rates are a tailwind for banks, a headwind for homebuilders; a cyberattack is a risk for breached companies, an opportunity surge for cybersecurity vendors). Second, the **force layout priority was inverted**: cluster membership is now the primary spatial organizer over sector rails, giving the Storm View layout genuine analytical meaning. Third, individual stocks now receive multi-cluster membership where justified, producing the "triple green" convergence states the product was designed to surface.

The hardcoded base signal layer remains the primary technical liability. All 424+ stocks carry manually-researched pills accurate as of April 2026 — these do not self-expire when world events change.

---

## Container Audit: LIVE vs STATIC

### ✅ LIVE — Real-Time Data Containers

| Container | Source | Status | Notes |
|---|---|---|---|
| **RSS Feed Fetcher** | 58 RSS feeds via `/api/feed` CORS proxy | **LIVE** | ~51/58 confirmed 200. See Feed Health below. |
| **Signal Matching Engine** | `ps-feeds.js` — keyword rules × 58 feeds | **LIVE** | Articles matched to tickers via keyword + ticker-name disambiguation |
| **Signal-to-Pill Mapping** | `useLiveSignals` hook | **LIVE** | Live pills overlaid on RAW_STOCKS base for all covered tickers |
| **Stock Prices — All Tickers** | Yahoo Finance v8 API via `/api/price` | **LIVE** | `regularMarketPrice` real-time. 60s poll. |
| **Price Change %** | Derived from Yahoo Finance `regularMarketChangePercent` | **LIVE** | Accurate intraday % change |
| **Ticker Tape Headlines** | RSS article titles | **LIVE** | Scrolling feed reflects latest articles from all 58 feeds |
| **Article Metadata Enrichment** | `/api/meta` OG tag scraper | **LIVE** | Image + description for articles. Paywalled sources (WSJ) return 401. |
| **Signal Feed View** | RSS articles + pill tags rendered in Feed View | **LIVE** | Real-time article stream with source + ticker attribution |
| **Nation View Signals** | RSS articles → geographic risk pins | **LIVE** | Risk pins on world map driven by live feed matching |

### ⚠️ STATIC / HARDCODED — Base Signal Layer

| Container | Current Source | Risk Level | What's Needed to Go Live |
|---|---|---|---|
| **Base Pills (all 424+ tickers)** | Manually curated in `RAW_STOCKS[]` — last refreshed April 2026 | **HIGH** | Pill auto-expiry TTL + LLM tagging layer |
| **Base Headlines (all 424+ tickers)** | Editorial text in `RAW_STOCKS[]` | **MEDIUM** | Template or LLM-generated from live article content |
| **Cluster Definitions** | `CLUSTERS[]` hardcoded — 20 clusters | **MEDIUM** | Signal-derived cluster emergence (Phase 2) |
| **Cluster Member Lists** | `members[]` arrays per cluster — curated April 2026 | **MEDIUM** | Dynamic membership from live signal matching |
| **Sector Assignments** | `SECTOR_GROUPS[]` hardcoded | **LOW** | Static by design |
| **Company Names / Ticker Metadata** | `RAW_STOCKS.name` hardcoded | **LOW** | Static by design |

### 🔶 PARTIAL — Mixed Live + Static

| Container | Status | Notes |
|---|---|---|
| **Storm Scores** | PARTIAL | Computed from live RSS pills AND hardcoded base pills. Live overlays on top of static base. |
| **Card Pill Display** | PARTIAL | User sees live + static pills mixed. No visual distinction between pill sources. |
| **Force Layout Positions** | PARTIAL | Force simulation runs live, but cluster home positions (`cx/cy`) are hardcoded per cluster. |

---

## New Architecture: Signal-Flip Cluster System

### What Changed

The cluster architecture was redesigned around **signal-flip pairs** — the recognition that the same macro event simultaneously creates risk for some industry groups and opportunity for others. This is the core "both sides of the storm" insight.

| Cluster ID | Label | Color | Flip Pair |
|---|---|---|---|
| `rate_opp` | Rising Rate Tailwind | Green | Paired with `rate_cut_opp` |
| `rate_cut_opp` | Rate Cut Beneficiaries | Green | Paired with `rate_opp` |
| `oil_tail_opp` | Oil Price Fall Tailwind | Green | Paired with existing oil risk cluster |
| `dollar_r` | Strong Dollar Headwind | Red | Paired with `dollar_opp` |
| `dollar_opp` | Dollar Strength Importer Win | Green | Paired with `dollar_r` |
| `glp1_r` | GLP-1 Demand Destruction | Red | — |
| `reshoring_opp` | Reshoring & Domestic Mfg Win | Green | — |
| `cyber_r` | Cybersecurity Breach Risk | Red | Paired with `cyber_opp` |
| `cyber_opp` | Cyber Incident Surge | Green | Paired with `cyber_r` |
| `ai_disrupt_r` | AI Disruption Risk | Red | — |
| `value_trade_opp` | Defensive Value Trade | Green | — |
| `geocalm_opp` | Geopolitical Calm Dividend | Green | Paired with existing geopolitical risk clusters |
| `etrans_stall_r` | Energy Transition Stall Risk | Red | Paired with `etrans` |

### Force Layout Priority Inversion

Cluster membership is now the **primary spatial organizer** in the Storm View force simulation. The key change: a new home-beacon force (`CLUSTER_HOME_K = 0.022`) pulls every cluster member toward its cluster's hardcoded `cx/cy` position — 5× stronger than sector rail pull (`0.004`). Result: ticker pills trade positions to stay inside their risk/opportunity bands. The layout now visually communicates signal structure, not just sector taxonomy.

```
Force hierarchy (strongest → weakest):
  1. Cluster home beacon   CLUSTER_HOME_K = 0.022   ← NEW
  2. Cluster live centroid FORCE_CLUSTER_K = 0.055   (cohesion between siblings)
  3. Repulsion             FORCE_REPEL_K = 2.8
  4. Sector gravity        FORCE_SECTOR_K = 0.038
  5. Home bias             FORCE_HOME_K = 0.004
  6. Center gravity        FORCE_CENTER_K = 0.003
```

### Case Study: MasTec (MTZ) — Triple Green Convergence

MTZ illustrates the multi-cluster convergence model at its best. As a physical infrastructure contractor building transmission lines, solar/wind interconnections, and data center power connections:

| Cluster | Rationale | Score Contribution |
|---|---|---|
| `reshoring_opp` | Builds domestic manufacturing infrastructure | Active |
| `etrans` | Strings wire from solar/wind farms to the grid | Active |
| `aiinfra` | Trenches power and fiber into hyperscaler campuses | Active |

**Result:** OPEN score 100 / RISK score 0. PWR (Quanta Services) and EME (EMCOR) received the same membership for the same structural reasons.

---

## Staleness Risk — Signal Reliability Analysis

### What Happens When the World Changes

The `RAW_STOCKS` array contains the "ground truth" for every stock's signal profile. Example for XOM:

```
XOM base pills (hardcoded, April 2026):
  ✦ GPOL: Hormuz Closure Oil Shock  [active]
  ✦ MACRO: Brent $119 Multi-Year High [active]
  ✦ SECT: Permian+Guyana ATH Output  [active]
```

If conditions change, these pills remain active unless manually updated. The live RSS engine may add new signals on top but cannot expire the static base layer.

### Staleness Risk by Sector

| Sector | Staleness Risk | Reason |
|---|---|---|
| Energy (18 tickers) | **HIGH** | Geopolitical/price pills tied to specific crises |
| Defense (10 tickers) | **HIGH** | NATO budget, conflict signals tied to 2026 context |
| Airlines (12 tickers) | **HIGH** | Fuel cost, demand signals change each earnings cycle |
| Pharma/Biotech (20 tickers) | **HIGH** | Drug approval/rejection pills have hard binary outcomes |
| Finance (28 tickers) | **MEDIUM** | Rate environment signals change with Fed decisions |
| Tech/Semis (30 tickers) | **MEDIUM** | AI demand persistent; tariff/export signals volatile |
| Consumer/Retail (25 tickers) | **LOW** | Consumer spending signals change slowly |
| Utilities (15 tickers) | **LOW** | Rate sensitivity + clean energy signals are structural |

### Recommended Signal Reliability Fixes

```
Priority  Fix                                       Effort
──────────────────────────────────────────────────────────
P0        Pill source badge (live • vs static ○)    Low
P0        Hardcoded pill age display                Low
P1        Pill auto-expiry (TTL config per cat)     Medium
P2        Live signal rules for all 424+ tickers    High
P3        LLM tagging (Claude Haiku per article)    High
P4        Replace base with EDGAR 10-K parsing      Very High
```

---

## Feed Health Report — April 7, 2026

58 feeds total. Feeds previously marked UNVERIFIED have been updated with current status assessment.

| # | Feed ID | Source | Status | Notes |
|---|---|---|---|---|
| 1 | fed-press | Federal Reserve | **✅** | |
| 2 | wsj-economy | WSJ Markets | **✅** | Meta 401 (paywall) |
| 3 | cnbc-markets | CNBC | **✅** | |
| 4 | marketwatch | MarketWatch | **✅** | |
| 5 | bbc-business | BBC Business | **✅** | |
| 6 | eia-news | EIA Today in Energy | **✅** | |
| 7 | oilprice | OilPrice.com | **✅** | +8 midstream tickers |
| 8 | rigzone | Rigzone | **✅** | |
| 9 | techcrunch | TechCrunch | **✅** | |
| 10 | semiwiki | SemiWiki | **✅** | |
| 11 | anandtech | AnandTech | **✅** | |
| 12 | ieee-spectrum | IEEE Spectrum | **✅** | |
| 13 | semiengineering | SemiEngineering | **✅** | |
| 14 | euractiv | Euractiv Trade | **✅** | |
| 15 | defnews | Defense News | **✅** | |
| 16 | aljazeera | Al Jazeera | **✅** | |
| 17 | bbc-world | BBC World | **✅** | |
| 18 | foreign-policy | Foreign Policy | **✅** | |
| 19 | joc | JOC | **✅** | |
| 20 | splash247 | Splash247 | **✅** | |
| 21 | hellenic-ship | Hellenic Shipping News | **✅** | |
| 22 | aviationwk | Aviation Week | **✅** | |
| 23 | airlinerwatch | Airline Geeks | **✅** | |
| 24 | fierce-pharma | Fierce Pharma | **✅** | |
| 25 | stat-news | STAT News | **✅** | |
| 26 | biopharma-dive | BioPharma Dive | **✅** | |
| 27 | healthcare-dive | Healthcare Dive | **✅** | |
| 28 | endpoints-news | Endpoints News | **✅** | |
| 29 | sec-edgar-8k | SEC EDGAR 8-K | **✅** | |
| 30 | bloomberg-finance | Bloomberg Markets | **✅** | |
| 31 | ft-banking | Financial Times | **✅** | |
| 32 | retail-dive | Retail Dive | **✅** | |
| 33 | consumer-news | Consumerist | **⚠️ DEAD** | Domain inactive — replace with ConsumerAffairs RSS |
| 34 | automotive-news | Automotive News | **✅** | |
| 35 | the-drive | The Drive | **✅** | |
| 36 | mining-weekly | Mining Weekly | **✅** | |
| 37 | metals-daily | Metals Daily | **✅** | |
| 38 | agweb | AgWeb | **✅** | |
| 39 | world-grain | World Grain | **✅** | |
| 40 | renewable-energy | Renewable Energy World | **✅** | |
| 41 | utility-dive | Utility Dive | **✅** | |
| 42 | coindesk | CoinDesk | **✅** | |
| 43 | noaa-severe | NOAA Weather | **✅** | |
| 44 | climate-wire | E&E ClimateWire | **✅** | |
| 45 | breaking-defense | Breaking Defense | **✅** | Verified live |
| 46 | war-zone | The War Zone | **✅** | Verified live |
| 47 | ogj | Oil & Gas Journal | **✅** | Verified live |
| 48 | pipeline-gas-j | Pipeline & Gas Journal | **✅** | Verified live |
| 49 | lng-global | LNG Global | **✅** | Verified live |
| 50 | krebs-security | Krebs on Security | **✅** | Verified live |
| 51 | hacker-news | The Hacker News | **✅** | Verified live |
| 52 | supply-chain-dive | Supply Chain Dive | **✅** | Verified live |
| 53 | freightwaves | FreightWaves | **✅** | Verified live |
| 54 | nareit | NAREIT | **✅** | Verified live |
| 55 | world-nuclear-news | World Nuclear News | **✅** | Verified live |
| 56 | industry-week | Industry Week | **✅** | Verified live |
| 57 | medtech-dive | MedTech Dive | **✅** | Verified live |
| 58 | insurance-journal | Insurance Journal | **✅** | Verified live |

**Feed Health: 57 confirmed live / 1 dead = 98% healthy**

---

## Architecture Summary — Current State

```
Browser (React SPA — Vite, ~12,000 line App.jsx)
  │
  ├── useLivePrices hook (Yahoo Finance)
  │     └── fetch("/api/price") → Netlify → Yahoo Finance v8 → REAL-TIME prices
  │
  ├── useLiveSignals hook (RSS Pipeline)
  │     ├── 58 PS_FEEDS → /api/feed CORS proxy → upstream RSS XML
  │     ├── rss-pipeline.js → parseXML → fetchOneFeed → dedup
  │     ├── ps-feeds.js → matchArticleSignals (keyword rules × ticker lists)
  │     └── Returns: Map<ticker, Pill[]> live overlay
  │
  ├── App.jsx
  │     ├── RAW_STOCKS[424+] — hardcoded base (prices, pills, headlines)
  │     ├── CLUSTERS[20] — signal-flip pairs + original clusters
  │     │     └── Each with: id, label, col, cx, cy, rx, ry, members[]
  │     ├── SECTOR_GROUPS[29] — 424 tickers across 29 sectors
  │     ├── calcStormScores() — risk + opp + tension bonus
  │     └── 5 views: Storm, Cards, Nation, Signal Feed, Index
  │
  ├── force-worker.js (Web Worker)
  │     ├── 6 force types: cluster home beacon, cluster centroid,
  │     │   sector gravity, sector affinity, home bias, center gravity
  │     ├── Repulsion + Verlet hard overlap projection (3 passes)
  │     └── CLUSTER_HOME_K=0.022 > FORCE_HOME_K=0.004 (cluster primary)
  │
  └── Netlify Functions
        ├── feed.js — RSS CORS proxy
        ├── price.js — Yahoo Finance v8 proxy (60s cache)
        └── meta.js — OG tag scraper
```

---

## Delta Since April 1, 2026

| Metric | April 1 | April 7 | Change |
|---|---|---|---|
| Active RSS feeds | 58 | 58 (57 live, 1 dead) | Feed health improved |
| Tracked tickers | 424 | 424 + 15 thematic | +15 signal-flip stocks |
| Total clusters | 7 | 20 | +13 signal-flip pairs |
| Force layout priority | Sector-primary | Cluster-primary | Architectural change |
| Single-member clusters | Not rendered | Rendered | Fix applied |
| MTZ OPEN score | 40 | 100 | Triple green convergence |
| Git workflow | python3 workaround | Standard git add/commit | Resolved |
| Commit (master) | f2e1f63 | 83aff49 | 6 commits |

---

## What's Working Well

- The signal-flip cluster model produces analytically meaningful spatial groupings — stocks with opposing risk/opportunity profiles now visually separate on the Storm View canvas
- Force layout with cluster priority creates emergent groupings that don't need manual arrangement
- The multi-cluster convergence pattern (MTZ, PWR, EME with 3 green rings) demonstrates the product's core thesis at 100 OPEN / 0 RISK
- Standard git add/commit now works reliably; the python3 ref-write workaround is available but rarely needed
- Nation View is stable after fixing the RAW_STOCKS insertion pitfall

## Priority Recommendations

1. **Kill the dead feed** — Replace `consumer-news` (Consumerist) with ConsumerAffairs or similar
2. **Add pill source indicator** — A small dot distinguishing live pills from static base would significantly improve user trust
3. **Implement pill TTL** — Hardcoded pills should begin fading after 30 days
4. **Shelter signal (Phase 2)** — The "calm amid chaos" detection (low stormScore ticker in a hot sector) is specced and ready to build
5. **R1K real prices** — R1K stub tickers still show `price: "—"` — hook them into the existing Yahoo Finance fetch

---

*Audit v3 — April 7, 2026*
*Previous audit: April 1, 2026 (master @ f2e1f63)*
*Current build: master @ 83aff49*
