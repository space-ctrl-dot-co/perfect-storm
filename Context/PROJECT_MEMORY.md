# Perfect Storm — Project Memory
### Living Document · Last Updated: March 30, 2026

> This file is the canonical narrative memory for the Perfect Storm project. It is updated continuously as the project evolves. Future Claude sessions should read this first before working on any task.

---

## Mission Statement

Build a stock intelligence webapp that is **joyful to engage with and genuinely useful**. It scans live data feeds — financial news, macro indicators, geopolitical signals, weather events, earnings data — and maps those signals onto individual stocks as color-coded pill tags.

**Red pills = Risk. Green pills = Opportunity. Both can exist on the same stock simultaneously.**

The core differentiator is *convergent signal detection* — when multiple independent risk (or opportunity) forces stack up on the same company at the same time, that's a "Perfect Storm." The product surfaces it visually before the price moves.

---

## Origin & Inspiration

- Inspired by **fllwup.co** (another Eugene project) — clean, feed-driven, card-based UI. Financial domain analog.
- The name "Perfect Storm" is the project folder and the product name.
- Eugene's account: eugene@spacectrl.co
- Design language pulled from `fllwup-v181.jsx`: IBM Plex Mono for labels, Instrument Sans for headings, dark navy theme, sharp edges (no border-radius), red accent for primary CTA, settings dropdown with toggle segments, chevron expand/collapse on cards.

---

## Product Vision

A clean, card-based dashboard where each stock card has:
- Ticker + company name + price/change
- Pill cluster (red for risk, green for opportunity, yellow for watch)
- Dual Storm Score (Risk 0–100 / Opportunity 0–100, computed independently)
- **Animated wave canvas** as storm intensity visual — the height/frequency/color of the wave reflects the score. Calm stock = still water. Risk storm = crashing red waves. Opportunity surge = rising green tide. Concurrent storms = primary wave + secondary counter-wave in the opposing color.
- Pills that evolve: Emerging → Active → Fading → Reversed/Dead

---

## Locked Design Decisions

1. **Fully automated pill generation** — NLP from headlines + articles in aggregate. Zero manual curation.
2. **Pill lifecycle** — born, evolve, and die based on aggregate sentiment. Reversal is a first-class mechanic with hysteresis to prevent flickering.
3. **Risk + Opportunity coexist** — pills must be specific enough to be non-contradictory. NVDA can have `⚠ GPOL: Export Controls` and `✦ SECT: AI Infra Demand` simultaneously — this is intentional, not a conflict.
4. **Low-signal stocks are valid** — a calm card is not a bug. ED (ConEd) sitting at the bottom of the list with one fading signal is useful information.
5. **15-minute RSS polling** baseline. Near-real-time. Free + open API preferred.
6. **Desktop-first, web-first**. Mobile companion is Phase 3.
7. **UX is the product**. Joyful, engaging. Not a data table. Not Bloomberg.
8. **Sort by storm intensity by default** — highest convergence (most categories, most active pills) at top. Calm stocks sink to the bottom. The sort order itself communicates where the action is.

---

## Three Tabs (UI Structure)

| Tab | Rendering | Purpose |
|-----|-----------|---------|
| **Card View** | DOM flex grid, sorted by storm score | Daily scan — see all stocks ranked by storm intensity, expand any for full detail |
| **Storm View** | SVG Venn diagram, click-to-expand side panel | Spatial understanding — see which signals connect which stocks, identify convergence zones |
| **Nation View** | Two-panel: country list + detail | Geographic lens — countries as signal nodes. Switzerland is calm. Taiwan is a dual storm. Iran is an active GPOL node radiating outward to RTX, XOM, DAL, AAL. |

### Card States (Zoom Axis in Storm View)
```
ZOOM IN ←——————————————————————————→ ZOOM OUT
[Reference Card]   [Collapsed Card]   [Ticker Pill]
All detail         Ticker + Pills       Just "NVDA"
                   + Wave + Price       inside a surround
```

- **Reference Card**: Full detail — all pills (labels + lifecycle), Storm Scores, WaveBar, headlines. Opens in side panel from Storm View; inline grid in Card View.
- **Collapsed Card**: Single-click row. Top line = ticker + name + price. Second line = prevailing pills (1–2 dominant active pills). WaveBar always visible below. Expand to Reference with chevron.
- **Ticker Pill**: Just the stock name as a small rect node. Storm View max-zoom-out only.
- **Prevailing Pills** = the 1–2 highest-severity active pills. They live on their own row below the title in collapsed state (not inline with the ticker, which was obscuring it — fixed in session).

---

## The Surround System — Venn Model (KEY MECHANIC)

Semi-transparent, pill-shaped, labeled ellipses in Storm View grouping stocks that share an active signal. **They overlap like a Venn diagram.** Stocks in the overlap zone are in multiple concurrent storms — that intersection IS the perfect storm.

- Overlap zone color: Red+Red = compound risk. Green+Green = compound opportunity. Red+Green = active tension.
- Surround label = shared signal name as a large pill on the top edge
- Minimum ~3 stocks to form a visible surround
- No resolution rule needed for multi-surround membership — the overlap is the answer

Current Storm View clusters (March 2026):
- `⚔ GPOL: Iran Conflict` — RTX, LMT, XOM (opportunity: defense demand + oil revenue)
- `⚠ GPOL: Iran Fuel Spike` — DAL, AAL, XOM (risk for airlines, opp for energy = the tension zone)
- `⚠ MACRO: Tariff Wave` — AAPL, TSLA, DAL (all exposed to tariff cost risk)
- `✦ SECT: AI Opportunity` — NVDA, MSFT, AMD, GS (concurrent AI demand signal)
- `⚠ GPOL: China Export` — NVDA, AAPL, AMD (export control risk)

---

## Signal Category Taxonomy (13 categories)

This is finalized. All pills in the system use these short codes:

| Code | Name | What it covers |
|------|------|----------------|
| `GPOL` | Geopolitical | State-level conflicts, wars, sanctions, export controls, NATO, trade disputes between nations |
| `GEO` | Geographic | Where a company sells/produces — regional market exposure, revenue concentration, production geography |
| `POL` | Policy/Regulatory | Domestic regulations, agency actions, court decisions, government spending |
| `MACRO` | Macroeconomic | GDP, inflation, consumer spend, credit cycles, CapEx trends, fuel costs |
| `RATE` | Rates/Credit | Fed policy, yield curve, NIM, debt refinancing, mortgage rates |
| `SECT` | Sector/Thematic | Industry-specific dynamics — AI demand, EV pricing, drug pipelines, defense buildout |
| `EARN` | Earnings/Corporate | Guidance, estimates, margins, buybacks, leadership changes |
| `WEATHER` | Weather/Climate | Hurricanes, drought, wildfires, seasonal events |
| `SUPPLY` | Supply Chain | Semiconductor shortages, port strikes, shipping routes, critical minerals |
| `LABOR` | Labor Market | Strikes, wages, visa policy, tech layoffs |
| `LEGAL` | Legal/Litigation | Class actions, patents, whistleblowers, data breaches |
| `TECH` | Tech Disruption | AI substitution, open-source commoditization, platform disruption |
| `ESG` | ESG/Governance | Carbon costs, CEO controversy, diversity policy, greenwashing |

**Critical rule:** `GPOL` and `GEO` are distinct. Iran causing a fuel spike = `GPOL`. Delta's unhedged fuel exposure from being a US airline = `GEO` or `MACRO`. China iPhone sales down = `GEO`. US export controls blocking China GPU sales = `GPOL`.

---

## Storm Score Engine (Updated March 30, 2026)

```javascript
// Pill weights
PILL_WEIGHT = { active: 1.0, emerging: 0.6, fading: 0.25 }

// Per-side scoring (risk pills and opp pills scored independently)
uniqueCats = count of distinct category codes among pills on one side
diversityMult = 1 + (uniqueCats - 1) * 0.28   // +28% per additional unique category
base = sum of pill weights
score = min(100, round(base × diversityMult × 12))  // ← 12, NOT 16

// Tension bonus: concurrent storms on both sides score higher
tensionBonus = (riskScore > 25 && oppScore > 25) ? min(riskScore, oppScore) × 0.2 : 0
stormScore = riskScore + oppScore + tensionBonus
```

**Multiplier change (×16 → ×12):** The ×16 formula let 4 active pills from 3 categories hit the 100 ceiling (e.g. AAPL riskScore=100 despite having meaningful opp signals). At ×12, 4 pills from 3 cats = 75, 100 requires genuinely extreme convergence.

**The key insight:** Category diversity is rewarded. Three active pills in three different categories scores higher than three active pills all in the same category. This is by design — the system should identify *convergent* storms across multiple independent risk vectors, not just echo chambers.

**Default sort** = `stormScore` descending. Triple convergence (3 unique categories, all active) floats to top. Calm stocks (score < ~25) sink to bottom.

---

## Current Real-World Stock Examples (March 2026)

Stocks in the mockup are grounded in real signals as of March 27, 2026:

### Opportunity Storms
| Ticker | Story | Storm Type |
|--------|-------|-----------|
| **RTX** | Iran conflict driving munitions demand; $268B NATO backlog; record highs | Pure opp triple storm: GPOL + POL + SECT |
| **XOM** | Brent $83 on Iran fears; all-time high $167; Permian+Guyana output ATH | Pure opp triple storm: GPOL + SECT + MACRO |
| **LMT** | F-35 NATO order acceleration; US defense +$50B; missile defense demand | Pure opp triple storm: GPOL + POL + GPOL |
| **NVDA** | $78B Q1 FY27 guidance; ByteDance $14B order; H200 China sales approved | Concurrent opp storm + GPOL export risk |
| **GS** | M&A pipeline strongest since 2021; NIM 3.5%; private credit demand | Opp triple: SECT + RATE + SECT |
| **AMD** | MI300X winning inference slots; sovereign AI alt-sourcing emerging | Mild opp + GPOL export risk mirror |

### Risk Storms
| Ticker | Story | Storm Type |
|--------|-------|-----------|
| **TSLA** | Musk DOGE blowback; EU sales -45%; 130× PE on 1% revenue growth | Risk triple: SECT + GEO + MACRO (with Megapack opp) |
| **DAL** | $400M Q1 fuel hit; AmEx rate cap threat; Iran unhedged exposure | Risk triple: MACRO + POL + GPOL |
| **UNH** | Medical cost inflation; DOJ antitrust probe; Q1 estimates cut | Risk triple: SECT + POL + EARN |
| **MSFT** | Copilot 3.3% penetration; $37.5B CapEx margin squeeze; EU AI Act | Risk triple: SECT + MACRO + POL (with Azure opp) |
| **AAL** | Iran fuel unhedged; 11.2× debt/equity; TSA staffing; guidance miss | Pure risk quad convergence — no opp signal |
| **AAPL** | Tariffs +$900M Q2; China brand erosion -14% | Risk+Opp tension: MACRO+GEO risk vs SECT+EARN opp |

### Calm / Low Signal
| Ticker | Story |
|--------|-------|
| **ED** | ConEd in line; one fading rate sensitivity signal |
| **MCD** | Value menu holding; consumer environment normalizing |
| **PG** | Defensive staple; mild tariff input cost creep, fading |

---

## Nation View (3rd Tab — Added This Session)

Each country is a signal node with its own risk/opp pills and related tickers. Sorted by total signal intensity.

Current nations (6): Taiwan (dual storm), China (risk dominant), Saudi Arabia (opp dominant), United States (concurrent), Germany (risk dominant), Switzerland (low signal / calm).

Flags: `flag-icons` library (MIT license) by lipis. Usage: `<span className="fi fi-us" />`. CDN: `cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/css/flag-icons.min.css`. Setup instructions in `Graphics/Flags/README.md`.

---

## Folder Structure

```
C:\Users\Eugene\Dropbox\Projects\Web\Perfect Storm\
├── Code/                          ← Future: project source code
├── Context/
│   ├── PROJECT_MEMORY.md          ← This file
│   ├── SIGNAL_DICTIONARY.md       ← 242 signals, 13 categories, with NLP keyword notes
│   ├── CREDIBILITY_ANALYSIS.md    ← Adversarial review: all attack vectors on signals, scores, and data
│   └── CREDIBILITY_PLAN.md        ← Response strategy: addressable / defensible / neither matrix
├── Graphics/
│   ├── Flags/
│   │   └── README.md              ← flag-icons install instructions + country code table
│   └── Icons/                     ← Future: category icons (GPOL, GEO, POL, etc.)
├── Mockups/
│   └── perfect-storm-mockup.jsx   ← High-fidelity interactive React mockup (v0.3)
└── Perfect Storm/
    ├── PERFECT_STORM_PLAN.md      ← Canonical product plan (v0.3)
    └── PERFECT_STORM_PLAN.pdf     ← PDF version
```

---

## Mockup Status (perfect-storm-mockup.jsx — v0.3)

**What's built:**
- 15 stocks with real March 2026 signals (6 opp storms, 6 risk storms, 3 calm)
- Storm score engine: computes `riskScore`, `oppScore`, `stormScore` from pills at load time
- Default sort: stormScore descending (highest convergence at top)
- WaveBar: canvas-based animated sine wave, amplitude/color scales with score, secondary wave for concurrent storms
- Pill component: compact (collapsed card) and full (expanded) modes, lifecycle state indicators
- StockCard: chevron expand/collapse, title row (ticker + name + price), pill row below (collapsed only), WaveBar always visible
- CardsView: STORM / RISK SCORE / OPP SCORE sort buttons, ALL / RISK STORMS / OPP STORMS / CALM filter buttons
- StormView: SVG Venn diagram with 5 overlapping ellipses, ticker nodes, PERFECT STORM annotation on DAL/AAL/XOM zone
- NationView: country list sidebar sorted by intensity, detail panel with flag + name + note + scores + tags + related tickers
- SettingsPanel: fllwup-style dropdown with theme/refresh/sort toggles, watchlist chips

**Known issues / next iteration:**
- Storm View cluster positions are hardcoded — needs auto-layout algorithm eventually
- Nation flags currently using emoji (reliable cross-platform); switch to `flag-icons` CSS classes when wiring real app
- WaveBar re-renders on every card expand/collapse — consider memoization
- No real interactivity between Storm View clicks and Card View state yet

---

## Signal Dictionary Status

`Context/SIGNAL_DICTIONARY.md` — v0.1, 242 signals across 13 categories.

Key counts: GPOL (25), GEO (15), POL (25), MACRO (25), RATE (15), SECT (49 — largest category), EARN (20), WEATHER (12), SUPPLY (13), LABOR (8), LEGAL (10), TECH (15), ESG (10).

Phase 2 goal: expand to 300+ by deepening SECT with per-industry sub-lists (healthcare, defense, energy, fintech, consumer).

Each signal has: ID, direction (risk/opp), label ≤5 words, severity (1–3), affected tickers/sectors.

Next step: map each signal ID to keyword clusters for the NLP tagger.

---

## Project TODO

### ✅ Done (April 7, 2026 — Signal flip clusters + cluster-priority force layout + MTZ triple green)

- [x] **Single-member cluster banding fix** — `members.length < 2` guard in metaball fill/stroke passes changed to `members.length < 1`. A cluster with exactly 1 visible member now renders its band. Fix applied in two locations in the cluster render loop (~line 11048 fill pass, ~line 11081 stroke pass).

- [x] **Cluster-priority force layout** — cluster membership is now the PRIMARY spatial organizer, overriding sector rail position. Two-layer gravity added to `force-worker.js`:
  - (a) **Live centroid pull** (`FORCE_CLUSTER_K=0.055`) — cohesion between visible sibling members (only when ≥2 members visible)
  - (b) **Home beacon pull** (`CLUSTER_HOME_K=0.022`) — ALWAYS active; pulls every member toward the cluster's hardcoded `cx/cy`. This is 5× stronger than sector offset (0.004), so tickers trade positions to contain cohesive risk/opp bands, then settle. The `tension` slider scales both forces.

- [x] **13 signal-flip cluster pairs added** — covering every major macro scenario where the same trigger benefits some industries and harms others:
  | Cluster ID | Label | Color |
  |------------|-------|-------|
  | `rate_opp` | Rising Rate Tailwind | Green |
  | `rate_cut_opp` | Rate Cut Beneficiaries | Green |
  | `oil_tail_opp` | Oil Price Fall Tailwind | Green |
  | `dollar_r` | Strong Dollar Headwind | Red |
  | `dollar_opp` | Dollar Strength Importer Win | Green |
  | `glp1_r` | GLP-1 Demand Destruction | Red |
  | `reshoring_opp` | Reshoring & Domestic Mfg Win | Green |
  | `cyber_r` | Cybersecurity Breach Risk | Red |
  | `cyber_opp` | Cyber Incident Surge | Green |
  | `ai_disrupt_r` | AI Disruption Risk | Red |
  | `value_trade_opp` | Defensive Value Trade | Green |
  | `geocalm_opp` | Geopolitical Calm Dividend | Green |
  | `etrans_stall_r` | Energy Transition Stall Risk | Red |

- [x] **Pills added to 115 RAW_STOCKS** covering all 13 new clusters with active/emerging/fading states reflecting real current signal strength.

- [x] **15 new full RAW_STOCKS entries** for thematic stocks not in DOW30/S&P500: CYBR, QLYS, TENB, GEN, CELH, ONON, EME, PWR, MTZ, AFRM, SOFI, CPA, NOVA, ARRY, WNS, EXLS.

- [x] **INJECT_MAP additions** — 47 tickers across 7 sectors wired for sector rail placement: sft (+10), fin (+4), ind (+7), con (+10), trns (+5), util (+6), mat (+5).

- [x] **Nation View crash fix** — thematic stocks were accidentally inserted into the `NATIONS` array (Python script used `rfind('];')` which hit NATIONS closing bracket instead of RAW_STOCKS). Fix: extract thematic block from NATIONS, search for `];` specifically between RAW_STOCKS position and NATIONS position before inserting.

- [x] **MTZ triple green cluster / perfect storm** — MasTec added to `etrans` and `aiinfra` clusters (was only in `reshoring_opp`). Two new opp pills added: `MACRO: Renewable Energy Construction Boom` + `TECH: Hyperscaler Grid Connection Demand`. OPEN score: 100 / RISK: 0. Rationale: MTZ strings the wire that physically connects solar/wind farms to the grid and trenches power to hyperscaler data center campuses — it's the infrastructure layer underneath all three mega-trends. PWR and EME added to both new clusters for same reasons.

- [x] **git standard workflow now operational** — `git add` + `git commit -m` now works reliably via normal commands from the sandbox (no python3 workaround needed for staging/committing). The python3 ref-write is still the fallback if Dropbox corrupts `refs/heads/master`. `git push` still requires Eugene to run in PowerShell (sandbox proxy blocks GitHub HTTPS).

### ✅ Done (March 29–30, 2026 — Storm View visual polish sprint)
- [x] **Full NASDAQ100 cluster coverage** — all 99 tickers mapped to at least one cluster. 66 previously-orphaned tickers added across 14+ clusters with individual investment theses.
- [x] **Slot-based band spacing** — canonical offset system: pill → clusterPad gap → [risk slot] → [opp slot, only if risk renders] → sector outline. Each slot adds 12px. Empty slots collapse. Signal-free tickers use flat 12px pad.
- [x] **isDual fix** — opp band uses `visibleClusters` not raw pills to determine slot position. Prevents opp floating at slot 2 when risk cluster is below strength threshold.
- [x] **Leader line anchor fix** — two-pass direction-aware `bandViewR` in `computeEdgeLabels`; slot-based `bandR` with `nearTicker` identity tracking in `computeSectorLabels`.
- [x] **Sector outline matches risk band thickness** — same SVG filter params (`30, -12 / 30, -16`); dynamic opacity `0.18 + sectorStrength × 0.30`.
- [x] **Storm ring colour fixed** — uses `sRisk > sOpp * 1.5` (score-based), not cluster membership count. DELL now shows green ring (OPEN 42 > RISK 10).
- [x] **Score multiplier tuned** — ×16 → ×12. 4 pills/3 cats = 75 (not 100). AAPL iPhone 17 opp signal added.
- [x] **Selection unfade fixed** — ✕ button + empty canvas tap both clear `selected` AND `focused`.
- [x] **Toolbar column layout** — TITLES under RISKS/OPENINGS, LABELS under SECTORS, ORGANIC under GRID. Sub-buttons appear only when parent is ON.
- [x] **Card View simplified** — sort row removed (always by stormScore); filters: ALL / RISKS / OPENINGS / CALM / ⚡ STORM, all left-aligned.
- [x] **Hotels sector** added (MAR, HLT, H, WH, ABNB, BKNG, EXPE).
- [x] **LABELS sector sub-toggle** — appears/hides with parent SECTORS button.
- [x] **⚡ label balance** — trailing ghost tspan for visual centering.
- [x] **git python3 ref-write workaround** — replaces `git update-ref` which Dropbox locks block.

### ✅ Done (earlier)
- [x] Product concept and core mechanic defined
- [x] Data feed architecture mapped (7 categories, ~30+ feeds)
- [x] Pill lifecycle mechanic designed (Emerging/Active/Fading/Reversed/Dead)
- [x] Storm Score algorithm designed and implemented in mockup
- [x] Tech stack selected (Next.js + FastAPI + spaCy + VADER + Celery/Redis)
- [x] Wave visual metaphor decided for storm score rendering
- [x] Two views resolved → three tabs: Card View / Storm View / Nation View
- [x] Card zoom axis defined: Reference Card → Collapsed Card → Ticker Pill
- [x] Surround system designed as Venn overlap model
- [x] Prevailing Pills concept defined (1–2 dominant pills on Collapsed Card)
- [x] Signal category taxonomy finalized (13 categories, GPOL/GEO split)
- [x] Signal Dictionary v0.1 created (242 signals)
- [x] High-fidelity interactive React mockup built (v0.3) with 15 real stocks
- [x] Stock data grounded in real March 2026 signals (verified via web search)
- [x] Storm score engine computing from pills (not hardcoded)
- [x] Default sort by storm intensity (highest convergence → top)
- [x] Nation View tab built with flags, signal tags, related tickers
- [x] Card layout fixed: pills in separate row below title (not obscuring ticker)
- [x] Contrast fixed: white text on dark navy throughout
- [x] Flag icons library identified: `flag-icons` (MIT, lipis/flag-icons)
- [x] Folder structure organized (Code / Context / Graphics / Mockups / Perfect Storm)
- [x] 273 flag-icons SVGs (4×3 ratio) downloaded to `Graphics/Flags/` — batch via git sparse-checkout
- [x] **v0.4 mockup** built (`Mockups/perfect-storm-mockup-v04.jsx`) — major additions:
  - `SIGNAL_RULES` — 25 pattern-matching rules (regex → pill template + affected tickers)
  - `LIVE_FEED` — 25 pre-written real headlines (oldest→newest), streams 5 live during session (1 every 12s)
  - `matchSignals(headline)` — auto-tagging engine that fires against SIGNAL_RULES
  - `FeedView` — new 4th tab: feed stream + emergent patterns + data source manifest
  - `TickerTape` — scrolling live headline bar at very top of app
  - `FlagImg` — component using real `Graphics/Flags/{code}.svg` with emoji fallback
  - Nation View expanded to 10 nations: US, Taiwan, China, Germany, Saudi Arabia, Iran, Ukraine, Russia, Israel, UK, Japan, India
  - Cards show `NEW SIGNAL` badge + blue border highlight when live headline matches ticker
  - `EMERGENT_PATTERNS` — 5 cross-stock auto-detected patterns surfaced in Feed view
  - `DATA_SOURCES` — 10 data source manifest (GDACS, SEC EDGAR, FRED, GDELT, USGS, OpenSanctions, etc.)
  - GitHub repo created: `github.com/space-ctrl-dot-co/perfect-storm`
- [x] Git push command sequence documented (run locally: `git init -b main && git remote add origin ... && git push`)
- [x] **Vite/React build live on Netlify** — deployed at `https://perfectstorm.netlify.app`, CI/CD on `master` branch
- [x] **Custom domain wired:** `https://perfect-storm.app` live with HTTPS (Let's Encrypt, auto-renews Jun 25 2026)
  - DNS via Cloudflare: `CNAME @ → apex-loadbalancer.netlify.com` + `CNAME www → perfectstorm.netlify.app` (both DNS-only / grey cloud)
  - Neon database extension removed from Netlify (was causing every build to fail with `ENOTFOUND` in "Installing extensions" phase)
- [x] **RSS feed pipeline (commit `ade37fa`):** `src/ps-feeds.js` — 31 feeds, 83 signal rules, 14 stocks covered
  - Signal performance verified live: **544 articles → 140 signals** (was 19 signals before; 29/29 feeds working)

### 🔲 Next Up (Mockup Iteration)
- [ ] Icon set for pill categories — small icons for GPOL/GEO/POL/MACRO/RATE/SECT/EARN (Graphics/Icons/ folder ready)
- [ ] Zoom transition prototype: Ticker Pill → Collapsed Card → Reference Card
- [ ] Nation View cross-link: clicking Iran flag highlights XOM/RTX/DAL in Card View
- [ ] Pill reversal animation concept (pill color flips from red to green)
- [ ] Storm View — add RTX/LMT defense/energy opp annotation cluster
- [ ] Add 5+ more stocks to universe (TSM, JPM, BA, AMZN, META)
- [ ] GitHub push (run local git commands from `C:\Users\Eugene\Dropbox\Projects\Web\Perfect Storm`)

### 🔲 Phase 1 MVP (Engineering)
- [ ] RSS feed polling skeleton (Python, feedparser, Celery + Redis, 15-min intervals)
- [ ] NLP pipeline: spaCy NER entity extraction → VADER sentiment scoring
- [ ] Keyword/signal dictionary mapper: headline text → Signal ID from dictionary
- [ ] Aggregate sentiment model per (ticker, signal_id) pair
- [ ] Pill lifecycle state machine (Emerging/Active/Fading/Reversed/Dead)
- [ ] Dual Storm Score calculator with diversity bonus
- [ ] Company ↔ geography/sector mapping database (bootstrap via EDGAR 10-K parsing)
- [ ] Next.js frontend shell: card grid, tab nav, settings dropdown
- [ ] WaveBar component wired to live data
- [ ] Live price data integration (Alpha Vantage free tier)
- [ ] End-to-end test: DAL as first live stock

### 🔲 Phase 2 Backlog
- [ ] User auth + watchlists (Clerk)
- [ ] LLM classification layer (Claude Haiku) for ambiguous signals
- [ ] Tide-change detection + pill reversal animation
- [ ] Email/notification digest system
- [ ] "Perfect Storm" filter (show only stocks in 3+ category convergence)
- [ ] Company ↔ geography database at scale (EDGAR + Wikidata)
- [ ] Storm View auto-layout (D3 force simulation for surround positions)

### 🔲 Phase 3 Backlog
- [ ] Mobile companion app
- [ ] Portfolio import
- [ ] Historical signal replay ("what was NVDA's storm score on Oct 1st?")
- [ ] API access / premium tier

---

## Open Design Questions

| Question | Status | Notes |
|----------|--------|-------|
| Pill reversal hysteresis thresholds? | Open | Emergence threshold 0.45, reversal threshold 0.55 — needs calibration |
| Storm View auto-layout vs. hardcoded positions? | Open | Hardcoded for mockup; Phase 2 needs D3 force simulation |
| Pill category icons? | Open | Graphics/Icons folder ready; need icon set for 13 categories |
| How to connect Nation View clicks to Stock cards? | Open | Clicking Iran should highlight XOM/RTX/DAL in Card View |
| Zoom transition feel — smooth scale or snap? | Open | Needs animation prototype |
| WaveBar on calm stocks — dead flat or barely-there ripple? | Decided: barely-there ripple | calm = `riskScore < 15 && oppScore < 15` → slow, low-amplitude, dim blue wave |
| Surround label collision when ellipses overlap heavily? | Open | Needs layout logic |

---

## Technical Hurdles Log

| Hurdle | Approach | Outcome |
|--------|----------|---------|
| fllwup.jsx too large to read (291.9KB > 256KB limit) | Read in chunks: `offset` + `limit` params across 4 reads | ✅ Worked — read lines 1-120, 400-550, 600-750, etc. |
| Edit tool failing with "old_string not found" | File was modified between reads; fix by reading current state first | ✅ Always read → then edit |
| Flag SVG download from GitHub blocked by sandbox proxy | Tried requests lib, npm — both blocked | ✅ Resolved: Eugene ran `git clone --sparse --depth=1` from his machine; 273 SVGs landed in `Graphics/Flags/` |
| git init to mounted Windows drive fails with config.lock | Sandbox can't write `.git/config` across FUSE mount | ✅ Workaround: run git commands locally on Windows machine |
| Storm View cluster positions with 15 stocks | Hardcoded x/y for each node | Acceptable for mockup; Phase 2 needs D3 force layout |
| `git update-ref` blocked by Dropbox master.lock | Dropbox creates lock Claude's sandbox can't remove (`Operation not permitted`) | ✅ Resolved: use `python3 -c "open('.git/refs/heads/master','w').write('$COMMIT\n')"` — bypasses lock entirely |
| `git push` from sandbox blocked (HTTP 403 proxy) | Sandbox proxy blocks GitHub HTTPS | ✅ Workaround: Eugene runs `git push` in PowerShell |
| `fatal: unable to write new_index file` on git commit | Dropbox lock file issue on the index | ✅ Resolved on retry — intermittent. Standard `git add/commit` now works reliably for staging/committing (April 2026). Python3 ref-write only needed if Dropbox empties `refs/heads/master`. |
| `fatal: cannot lock ref 'HEAD': unable to resolve reference 'refs/heads/master': reference broken` | Dropbox emptied `.git/refs/heads/master` | ✅ Fix: `python3 -c "open('.git/refs/heads/master','w').write('COMMIT_HASH\n')"` — bypasses lock entirely |
| Nation View white screen after inserting thematic stocks | Python `rfind('];')` hit NATIONS closing bracket instead of RAW_STOCKS closing bracket | ✅ Fixed: search for `];` between `const RAW_STOCKS` position and `const NATIONS` position specifically |
| opp band floating at slot 2 with no risk ring visible | isDual was checking `st.pills` (raw data) instead of `visibleClusters` | ✅ Fixed: isDual now checks `visibleClusters.some(vc => vc.col === '#EF4444' && vc.members.includes(t))` |
| Storm ring showing red for opp-dominant tickers (e.g. DELL) | Ring colour was based on cluster membership count, not actual scores | ✅ Fixed: `isRiskDom = sRisk > sOpp * 1.5` using actual pill scores |
| Fade not clearing after closing sidebar ✕ | ✕ only called `setSelected(null)`, left `focused` set | ✅ Fixed: ✕ now clears both; empty-canvas tap also clears both |

---

## Key Libraries & References

| Resource | URL / Notes |
|----------|-------------|
| Plan document | `Perfect Storm/PERFECT_STORM_PLAN.md` |
| Signal dictionary | `Context/SIGNAL_DICTIONARY.md` |
| Mockup v0.3 | `Mockups/perfect-storm-mockup.jsx` |
| Mockup v0.4 (live signal engine) | `Mockups/perfect-storm-mockup-v04.jsx` |
| GitHub repo | `github.com/space-ctrl-dot-co/perfect-storm` |
| GDELT GKG (geopolitical news) | `gdeltproject.org/data.html` |
| OpenSanctions | `data.opensanctions.org` |
| flag-icons (MIT) | `github.com/lipis/flag-icons` — `npm install flag-icons` |
| flag-icons CDN | `cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/css/flag-icons.min.css` |
| FRED API | `fred.stlouisfed.org/docs/api/fred/` |
| NOAA Alerts | `alerts.weather.gov/cap/us.php?x=1` |
| GDACS Alerts | `gdacs.org/rss.aspx` |
| SEC EDGAR | `efts.sec.gov/LATEST/search-index?q=...` |
| GPR Index | `matteoiacoviello.com/gpr.htm` |
| Alpha Vantage | `alphavantage.co/documentation/` |
| spaCy | `spacy.io` |
| VADER Sentiment | `github.com/cjhutto/vaderSentiment` |

---

---

## Done Log — April 8, 2026

### Pill Source Indicator (commit `e4f4e5d`)
- `SIGNAL_RULES_LABEL_SET` — module-level `Set` built from `SIGNAL_RULES.map(r => r.label)` for O(1) lookups
- In `Pill` component: `isLive = SIGNAL_RULES_LABEL_SET.has(label)`. Renders `●` (filled, colored dot) for live RSS-backed pills, `○` (hollow, slate dot) for curated static pills. Shown far-right on pill row 1 (after state badge).

### Pill Temporal Aging System (commit `988890a`)
Full pill TTL system inserted after `SIGNAL_RULES_LABEL_SET`:
```js
const PILL_EPOCH  = new Date("2026-04-01");  // baseline for pills without dateAdded
const TTL_BADGE   = 14;  // show age badge only
const TTL_STALE   = 30;  // active → emerging
const TTL_OLD     = 60;  // emerging/active → fading
const TTL_EXPIRED = 90;  // → expired, excluded from scores
```
- `agePill(pill)` — pure function. Live pills always pass through (ageDays: 0). Curated pills use `pill.dateAdded` or `PILL_EPOCH` as base.
- `calcStormScores()` updated to use `p.effectiveState ?? p.state`.
- `pillScores()` (secondary score path, line ~7939) also updated to filter expired + use effectiveState.
- `detectPerfectStorms()` updated: riskCats + oppPills filters now exclude `effectiveState === 'expired'`.
- `STOCKS` useMemo: maps through `agePill`, filters expired before scoring, exposes `expiredPillCount`.
- `ExpiredPillsGroup` component: collapsible "⊘ N EXPIRED SIGNALS — excluded from score" section at bottom of pill list. Defined before `PillCard`. Used in Reference Card pill sections.
- Test data: `dateAdded` added to AAPL (5 pills spanning 104d/60d/30d/14d/7d), NVDA (2 pills: 70d/38d), MTZ (2 pills at creation dates).

### Smart Article System (commit `b940bcf`)
Three-tier `articlesForPill()` — see `project_article_system.md` for full detail.
- Tier 1: exact RSS signal label match (sync, zero API calls)
- Tier 2: semantic keyword scoring via `extractKeywords()` + `scoreArticle()` against live articles
- Tier 3: async `/api/pill-articles` fetch, results cached in `_pillArticleCache` (Map, keyed `"ticker|label"`)
- Module-level constants: `STOP_WORDS`, `CAT_BOOST` (11 category codes with boost term arrays)
- `PillCard` integration: `tier3Arts` state + `onFetched` callback → re-render on Tier 3 resolve
- `/netlify/functions/pill-articles.js` new file: Brave Search → NewsAPI → Yahoo Finance waterfall, 60s cache
- **Env vars to activate:** `BRAVE_SEARCH_KEY`, `NEWSAPI_KEY` in Netlify dashboard

### GLP-1 Duplicate Fix (commit `b940bcf`)
Removed `GLP-1 Demand Destruction` cluster pill (dir:risk, cat:SECT) from KO, PEP, MDLZ, GIS. Each already had a curated SECT risk pill covering the same combination. Left replacement comments. Rule: cluster pills that duplicate a curated pill's `(dir, cat)` pair inflate the score — the curated pill takes priority.

### Dead Feed Fix (commit `4094776`)
Replaced dead `consumer-news` feed (consumerist.com, 404) with `consumer-affairs` (consumeraffairs.com/news/feed). Feed health: 58/58.

---

## Pending (Eugene must push 4 commits in PowerShell)
```
git push   # in PowerShell — commits b940bcf, 988890a, e4f4e5d, 4094776
```
Then activate Tier 3 article search: add `BRAVE_SEARCH_KEY` to Netlify → Site → Environment Variables.

---

*This is a living document. Update after every meaningful session.*
