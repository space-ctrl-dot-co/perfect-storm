# Perfect Storm — Stock Risk & Opportunity Analyzer
### Product Plan v0.5 · April 2026

---

## 1. Concept Overview

**Perfect Storm** is a stock intelligence dashboard that scans live RSS feeds, macro indicators, geopolitical signals, and earnings data — and maps those signals onto individual stocks as color-coded pill tags.

Each pill represents a **risk** (red) or **opportunity** (green) driven by a specific real-world force. A stock accumulates pills over time. When multiple red pills cluster on a single name, you have a *perfect storm of risk*. When green pills stack up, you have a *perfect storm of opportunity*.

Risk and opportunity can exist on the **same stock simultaneously**. When they do, the product surfaces both with enough specificity that the user understands the distinction. A stock with three green and three red pills isn't a wash — it's a stock in active tension, which is itself a signal worth watching.

Some stocks will have very few signals in either direction. A calm stock in a noisy market is information too.

**The core insight:** Most stock screeners filter by price action. Perfect Storm filters by *convergent narrative force* — the same way a seasoned analyst reads the room. The Storm View makes convergence visible as a spatial event, not just a number.

---

## 2. Current Build Status — April 2026

The product has evolved significantly from the original plan. The app is live at **https://perfect-storm.app** (Vite + React 18 SPA, Netlify CI/CD).

| Component | Planned | Built | Status |
|---|---|---|---|
| Storm View (force layout) | Phase 1 | ✅ Built | Web worker, 6 force types, 424 tickers |
| Card View | Phase 1 | ✅ Built | Sorted by storm score, full pill display |
| Nation View | Phase 1 | ✅ Built | 15 countries with live signals |
| Signal Feed View | Phase 1 | ✅ Built | Live RSS articles with pill tags |
| Index View | Phase 1 | ✅ Built | DOW 30, S&P 500, Russell 1000 |
| Live prices | Phase 1 | ✅ Live | Yahoo Finance v8, 60s poll |
| RSS pipeline | Phase 1 | ✅ Live | 58 feeds, 57 confirmed healthy |
| Signal matching | Phase 1 | ✅ Live | Keyword rules × ticker list disambiguation |
| Pill lifecycle (live) | Phase 1 | ⚠️ Partial | Emerging/Active/Fading from RSS; static base pills don't expire |
| Storm score engine | Phase 1 | ✅ Built | Diversity multiplier × 12, tension bonus |
| Signal-flip clusters | Phase 2 | ✅ Built | 13 pairs, 20 total clusters |
| Cluster-priority layout | Phase 2 | ✅ Built | CLUSTER_HOME_K overrides sector rails |
| Shelter signal | Phase 2 | 🔲 Specced | Ready to build — see Phase 2 section |
| Outline mode (500+ tickers) | Phase 2 | 🔲 Specced | Auto-triggers at S&P/R1K index |
| User auth + watchlists | Phase 2 | 🔲 Not started | Clerk |
| LLM tagging (Claude Haiku) | Phase 2 | 🔲 Not started | Ambiguous signal classification |
| Pill auto-expiry (TTL) | Phase 2 | 🔲 Not started | Static base pills never expire |
| Mobile companion | Phase 3 | ⚠️ Partial | Mobile-responsive layout built; no dedicated mobile UX |
| Historical signal replay | Phase 3 | 🔲 Not started | |
| API access / premium tier | Phase 3 | 🔲 Not started | |

---

## 3. Design Decisions Log

The following decisions have been locked in:

| # | Decision | Rationale |
|---|---|---|
| 1 | **Pills are fully automated** | No manual curation at scale. Tags come from NLP on headlines and RSS articles, reflecting prevailing sentiment. Human review is not part of the live loop. |
| 2 | **Pills have a lifecycle** | A pill is born when a signal crosses a sentiment threshold. It strengthens as reinforcing articles accumulate. It weakens and dies when counter-signals emerge. Core product mechanic. |
| 3 | **Risk and opportunity can coexist on one stock** | Pills must be specific enough that they're non-contradictory. `⚠ Rate: Fed Hawkish Pivot` and `✦ Sector: AI Infra Demand` can both sit on NVDA. The tension is the insight. |
| 4 | **Some stocks will be low-signal** | Calm stocks are first-class citizens. A low-storm-score stock in a volatile sector is itself a detectable signal (the Shelter mechanic, Phase 2). |
| 5 | **15-minute RSS polling baseline** | Near-real-time via polling. No WebSocket or streaming requirement at launch. |
| 6 | **Desktop-first, web-first** | Joyful, genuinely useful on a large display. Mobile companion is Phase 3 (responsive layout exists but is not the focus). |
| 7 | **UX is the product** | Data density without beauty is Bloomberg. We are not Bloomberg. |
| 8 | **Wave animation = Storm Score** | The storm score is rendered as animated waves. Calm = still water. Risk storm = crashing red waves. Opportunity surge = rising green tide. |
| 9 | **Cluster position is the primary spatial organizer** | *(Added April 2026)* Ticker pills trade grid positions to stay inside their risk/opportunity bands, then settle. Sector membership is a secondary force. The Storm View layout encodes signal structure, not sector taxonomy. |
| 10 | **Signal flips are first-class** | *(Added April 2026)* The same macro trigger can be a risk for some industries and an opportunity for others. These signal-flip pairs are explicitly modeled as paired clusters and are core to the product's differentiation. |

---

## 4. The Signal-Flip Architecture

A core differentiator discovered in April 2026: many macro events simultaneously harm one industry group while benefiting another. Modeling this explicitly produces the most analytically interesting Storm View configurations.

### Current Signal-Flip Pairs

| Trigger | Risk Cluster | Opportunity Cluster |
|---|---|---|
| Rising interest rates | (implicit — homebuilders, growth stocks) | `rate_opp` — banks, insurers, financials |
| Rate cuts | (implicit — banks' NIM compression) | `rate_cut_opp` — homebuilders, REITs, FinTech |
| Oil price decline | (implicit — energy producers) | `oil_tail_opp` — airlines, shipping, consumer |
| Strong dollar | `dollar_r` — multinationals, exporters | `dollar_opp` — import-heavy retailers |
| Cyberattack event | `cyber_r` — breached companies | `cyber_opp` — cybersecurity vendors |
| Geopolitical conflict | (existing `iran`, `geo_risk` clusters) | `geocalm_opp` — travel, tourism, shipping |
| Energy transition | `etrans_stall_r` — solar/wind pure-plays | `etrans` — transmission/grid infrastructure |

### Multi-Cluster Convergence — The Triple Green

When a company's business model sits at the intersection of multiple opportunity forces, it earns membership in multiple green clusters. This produces the product's most powerful signal state:

**MasTec (MTZ) — April 7, 2026:**
- `reshoring_opp` — builds domestic manufacturing infrastructure
- `etrans` — strings transmission lines from renewable energy farms to the grid
- `aiinfra` — trenches power and fiber to hyperscaler data center campuses

OPEN score: **100** / RISK score: **0** — the purest opportunity convergence state the engine can produce.

---

## 5. The Pill Lifecycle

Pills are not static tags — they evolve. This is what makes the product a living signal rather than a stale label system.

### States

```
EMERGING  →  ACTIVE  →  FADING  →  REVERSED / DEAD
```

| State | Description | Visual | Weight in Score |
|---|---|---|---|
| **Emerging** | Signal appeared in 1–2 sources. Low confidence. Watch status. | Outlined pill, muted color | 0.6 |
| **Active** | Signal confirmed across multiple sources. High aggregate sentiment weight. | Solid fill pill, full color | 1.0 |
| **Fading** | Counter-signals appearing. Articles aging. Score declining. | Faded fill | 0.25 |
| **Reversed** | Prevailing sentiment has genuinely flipped. Pill transitions color. | Color transition animation | — |
| **Dead** | Signal fully decayed. Pill removed from card. | Removed | 0 |

### Pill Specificity Rule

When risk and opportunity coexist, pills must describe the *mechanism*, not just the direction:

> ❌ `⚠ Risk` — too vague to coexist with an opportunity pill
> ✅ `⚠ GPOL: Iran Fuel Spike` + `✦ SECT: Grid Electrification Capex` — coexistable, informative

---

## 6. Storm Score Algorithm

```javascript
PILL_WEIGHT = { active: 1.0, emerging: 0.6, fading: 0.25 }

// Per-side scoring (risk and opportunity scored independently)
uniqueCats     = count of distinct category codes (SECT, MACRO, POL, GEO, etc.)
diversityMult  = 1 + (uniqueCats - 1) × 0.28   // +28% per additional unique category
base           = sum of pill weights on that side
score          = min(100, round(base × diversityMult × 12))

// Tension bonus: concurrent storms on both sides
tensionBonus   = (riskScore > 25 && oppScore > 25)
                 ? min(riskScore, oppScore) × 0.2
                 : 0

stormScore     = riskScore + oppScore + tensionBonus
```

**Why category diversity matters:** Three active pills in three different categories scores higher than three active pills in the same category. The system rewards *convergent* storms across independent risk vectors — not echo chambers. This is the "perfect storm" effect encoded in math.

**Example — MTZ (post April 7):**
- 4 active opp pills across 4 categories (SECT, POL, MACRO, TECH)
- base = 4.6, diversityMult = 1.84
- oppScore = min(100, round(4.6 × 1.84 × 12)) = 100

---

## 7. UI Structure — Five Views

| View | What It Shows | Card State |
|---|---|---|
| **Storm View** | Force-directed SVG canvas. Risk/opp cluster bands. Click to expand side panel. | Ticker Pill → side panel Reference Card |
| **Card View** | Ranked list sorted by storm score. All detail inline. | Reference Cards, sorted by stormScore |
| **Nation View** | Country-level risk/opportunity signals. 15 nations. | Country cards with related tickers |
| **Signal Feed** | Live RSS articles with pill tag attribution. | Article cards with ticker + pill |
| **Index View** | DOW 30, S&P 500, Russell 1000 selector. Same Storm View canvas. | Same as Storm View |

### Card States (Zoom Axis in Storm View)

```
ZOOM IN ←——————————————————————————→ ZOOM OUT
[Reference Card]   [Collapsed Card]   [Ticker Pill]
All detail         Ticker + Pills       Just "NVDA"
                   + Wave + Price       inside a surround
```

### The Surround System

Semi-transparent, labeled ellipses in Storm View grouping stocks that share an active signal. They overlap like a Venn diagram. Stocks in the overlap zone face multiple concurrent forces — that intersection IS the perfect storm.

- Overlap color: Red+Red = compound risk. Green+Green = compound opportunity. Red+Green = active tension.
- Surround label = shared signal name as a pill on the top edge
- A stock in multiple surrounds is pulled toward the centroid of all its active clusters

---

## 8. Signal Category Taxonomy (13 Categories)

| Code | Name | What It Covers |
|---|---|---|
| `GPOL` | Geopolitical | Conflicts, wars, sanctions, export controls, trade disputes |
| `GEO` | Geographic | Where a company sells/produces — regional exposure, revenue geography |
| `POL` | Policy/Regulatory | Domestic regulations, agency actions, government spending programs |
| `MACRO` | Macroeconomic | GDP, inflation, consumer spend, credit cycles, capex trends |
| `RATE` | Rates/Credit | Fed policy, yield curve, NIM, debt refinancing, mortgage rates |
| `SECT` | Sector/Thematic | Industry-specific dynamics — AI demand, EV pricing, drug pipelines |
| `EARN` | Earnings/Corporate | Guidance, estimates, margins, buybacks, leadership changes |
| `WEATHER` | Weather/Climate | Hurricanes, drought, wildfires, seasonal events |
| `SUPPLY` | Supply Chain | Chip shortages, port strikes, shipping routes, critical minerals |
| `LABOR` | Labor Market | Strikes, wages, visa policy, tech layoffs |
| `LEGAL` | Legal/Litigation | Class actions, patents, whistleblowers, data breaches |
| `TECH` | Tech Disruption | AI substitution, open-source commoditization, platform disruption |
| `ESG` | ESG/Governance | Carbon costs, CEO controversy, diversity policy, greenwashing |

---

## 9. Data Feed Architecture

### Current Live Feeds — 58 Active Sources (April 2026)

| Category | Feeds | Key Sources |
|---|---|---|
| Macro / Rates | 7 | Federal Reserve, WSJ, CNBC, MarketWatch, BBC Business |
| Energy / Oil | 3 | EIA, OilPrice, Rigzone |
| LNG / Midstream | 3 | OGJ, Pipeline & Gas Journal, LNG Global |
| Defense | 3 | Defense News, Breaking Defense, The War Zone |
| Geopolitics | 4 | Al Jazeera, BBC World, Foreign Policy, Euractiv |
| Cybersecurity | 2 | Krebs on Security, The Hacker News |
| Supply Chain | 2 | Supply Chain Dive, FreightWaves |
| Shipping | 3 | JOC, Splash247, Hellenic Shipping News |
| Airlines | 2 | Aviation Week, Airline Geeks |
| Healthcare / Pharma | 5 | Fierce Pharma, STAT News, BioPharma Dive, Healthcare Dive, Endpoints News |
| Finance / Banking | 3 | SEC EDGAR 8-K, Bloomberg Markets, Financial Times |
| Retail / Consumer | 1 | Retail Dive |
| Autos | 2 | Automotive News, The Drive |
| Materials | 2 | Mining Weekly, Metals Daily |
| Agriculture | 2 | AgWeb, World Grain |
| Renewables | 2 | Renewable Energy World, Utility Dive |
| Real Estate | 1 | NAREIT |
| Nuclear | 1 | World Nuclear News |
| Industrials | 1 | Industry Week |
| Medical Devices | 1 | MedTech Dive |
| Insurance | 1 | Insurance Journal |
| Tech / Semis | 4 | TechCrunch, SemiWiki, AnandTech, IEEE Spectrum |
| Weather | 2 | NOAA Weather, E&E ClimateWire |
| Crypto | 1 | CoinDesk |

---

## 10. Tech Stack — Current and Planned

| Layer | Current (Live) | Planned (Phase 2+) |
|---|---|---|
| Frontend | Vite + React 18 SPA | Next.js 14 (migration path for SSR/SEO) |
| Styling | Inline styles + CSS-in-JSX | Tailwind CSS + shadcn/ui |
| Animations | Canvas wave + CSS transitions | Framer Motion for pill transitions |
| Force layout | Custom Web Worker (force-worker.js) | Keep — well-tuned, fast |
| Backend | Netlify Functions (feed, price, meta) | Python FastAPI for NLP pipeline |
| Feed parser | Browser fetch + XML parse | feedparser (Python), Celery + Redis |
| NLP / NER | Keyword rules (ps-feeds.js) | spaCy + VADER → Claude Haiku for ambiguous cases |
| Database | None (all in-memory) | PostgreSQL (signal history) + Redis (live cache) |
| Auth | None | Clerk (watchlist persistence) |
| Price data | Yahoo Finance v8 (Netlify proxy) | Same — genuinely real-time |
| Company DB | `RAW_STOCKS[]` hardcoded | EDGAR 10-K parsing (bootstrap) |
| Hosting | Netlify (frontend) | Netlify (frontend) + Railway (backend) |
| Domain | perfect-storm.app (Cloudflare DNS) | Same |

---

## 11. Phased Roadmap

### ✅ Phase 1 — MVP (Complete)

- Live Vite + React SPA at perfect-storm.app
- 424 tracked stocks across 29 sectors
- 58 live RSS feeds with keyword signal matching
- Real-time Yahoo Finance prices (60s poll)
- 5 views: Storm, Cards, Nation, Signal Feed, Index
- Force-directed layout with cluster-priority gravity
- DOW 30, S&P 500, Russell 1000 index support
- 20 clusters including 13 signal-flip pairs

### 🔲 Phase 2 — Intelligence Layer

The highest-priority items, roughly ordered:

**Shelter Signal** — detect tickers with low storm scores in high-scoring sectors. A quiet stock while its peers burn is an actionable signal. Detection: `stormScore < 10` + sector median score `≥ 35`. Surface as a steel-blue `SHELTER` pill. Add SHELTER filter tab to Card View. See `Context/PHASE_2_SPEC.md` for full spec.

**Pill Source Indicator** — small dot distinguishing live RSS pills from static base pills. Minimal effort, high trust payoff.

**Pill TTL / Auto-Expiry** — static base pills should begin fading after 30 days. Currently they never expire. Implement per-category TTL configs.

**Outline Mode (500+ Tickers)** — when viewing S&P 500 or R1K, auto-activate outline-only rendering. Sector surrounds and cluster bands keep strokes but drop fills. Signal-active Tier 1 tickers stay fully rendered. Metaball blur bypassed. Toolbar shows `[◻ OUTLINE]` indicator. See `Context/PHASE_2_REDUCED_SPEC.md`.

**R1K Real Prices** — wire R1K stub tickers into the existing Yahoo Finance fetch. Currently show `price: "—"`.

**LLM Classification Layer** — Claude Haiku for ambiguous signals: given this headline, what is the specific risk or opportunity for this ticker? Category, mechanism label, confidence.

**User Auth + Watchlists** — Clerk authentication, watchlist persistence.

### 🔲 Phase 3 — Growth

- Mobile companion app (responsive layout exists; dedicated mobile UX TBD)
- Portfolio import (CSV or brokerage connection)
- Historical signal replay ("what was NVDA's storm score on October 1st?")
- API access / premium tier
- Email digest: "Your watchlist gained 4 new signals overnight"

---

## 12. Open Questions

| Question | Status | Notes |
|---|---|---|
| Pill reversal hysteresis thresholds | Open | Needs calibration against live data |
| Shelter signal weight in storm score | Open | Proposed: `shelterScore` as a separate field, doesn't inflate risk/opp |
| Outline mode threshold calibration | Open | 500 tickers proposed — find empirically |
| R1K price API batching strategy | Open | 323 stubs × 5-min TTL — batch or lazy-load on demand? |
| Signal-flip auto-detection | Open | Currently hand-curated. Can the system propose new flip pairs from RSS correlation? |
| Company-geography database bootstrap | Open | EDGAR 10-K parsing is the plan — significant engineering effort |

---

*Plan v0.5 — Updated April 7, 2026. Reflects live build status, signal-flip cluster architecture, and Phase 2 roadmap.*
*Previous version: v0.3 · March 2026*
