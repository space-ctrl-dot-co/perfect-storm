# Perfect Storm — Refresh Procedure & Autonomy Map
*Last Updated: May 4, 2026*

> This document defines what runs automatically vs. what requires Claude to update, and how often each layer needs attention. Use this as a maintenance calendar.

---

## Autonomy Map — What Runs Without Claude

These systems operate continuously without any human or AI intervention. They self-update on every poll cycle, price tick, or user interaction.

### 🟢 Fully Autonomous (Zero Maintenance)

| System | Mechanism | Update Frequency |
|--------|-----------|-----------------|
| **RSS Feed Polling** | `/api/feed` Netlify proxy, called by client on load | Every 5 min (per-feed) |
| **Live Price Data** | `/api/price` → Yahoo Finance, batched by 40 tickers | On load + 15min refresh |
| **Signal Rule Firing** | Pattern matching (`SIGNAL_RULES` regex) against fetched articles | Real-time on fetch |
| **Storm Score Computation** | `calcStormScores()` — pure function of current pills | Computed per render |
| **Pill Temporal Aging** | `agePill()` — pure function of `dateAdded` / `PILL_EPOCH` vs `Date.now()` | Computed per render |
| **Force Layout Physics** | `force-worker.js` — Web Worker RAF loop | 60fps continuous |
| **Emergent Pattern Detection** | `detectPerfectStorms()` — cross-stock pattern scan | Computed per render |
| **Article Tier 1 Matching** | Exact `pill.label` match against `liveArticles.signals` | Real-time on fetch |
| **Article Tier 2 Matching** | Semantic keyword scoring against live articles | Real-time on fetch |
| **Article Tier 3 Fetch** | `/api/pill-articles` Netlify function (needs BRAVE_SEARCH_KEY) | On-demand per pill expand |
| **Live ticker tape** | Headline scrolling from matched articles | Real-time |
| **Nation View flag/score display** | Computed from signal rule matches + curated nation data | Real-time |

### 🟡 Autonomous But Needs Monitoring

| System | Auto Behavior | What Can Break | Check Frequency |
|--------|--------------|----------------|-----------------|
| **Feed health** | Feeds poll silently — failures drop articles | Feed URL changes, paywalls, 404s | Monthly |
| **Yahoo Finance price API** | Batches of 40 tickers auto-rotate | Yahoo rate limits, API changes | Weekly |
| **PILL_EPOCH clock** | Pills auto-age against `PILL_EPOCH` constant | PILL_EPOCH goes stale (see BUG-1 in audit) | On every session |
| **Netlify function cold starts** | Functions spin up on demand | Timeout at 10s for slow feeds | If articles disappear |

---

## What Requires Claude to Update

These layers are static authored data in `App.jsx`. They do NOT self-update. They go stale as the world changes.

### 🔴 Requires Claude — Regular Cadence

#### 1. Curated Pills (`STOCKS` array in App.jsx)
**What it is:** ~1,900 hand-authored `{ dir, cat, label, state, dateAdded? }` pill objects across 424 tickers.

**Why it needs updating:**
- Pills that were "active" signals become stale as news cycles pass
- New signals emerge (India-Pakistan escalation, new FDA approvals, rate decisions)
- Pills without `dateAdded` all share `PILL_EPOCH` as their clock start — need explicit dates

**Recommended cadence:** Every 4 weeks (aligned with earnings season calendar)

**What Claude does:**
- Reads current news cycle via web search
- Audits existing pills per ticker for relevance
- Adds `dateAdded` to newly authored pills
- Removes pills whose thesis has resolved (e.g., "Tariff Pause" pill if tariffs are settled)
- Adds new pills for emerging themes

**What Claude does NOT need to do:**
- Verify price data (auto)
- Recompute scores (auto)
- Update signal rule firing (auto — but rules themselves may need updating)

---

#### 2. Signal Rules (`SIGNAL_RULES` array in App.jsx)
**What it is:** 62 regex pattern rules that map headlines → pills → tickers.

**Why it needs updating:**
- News cycles introduce new repeating signals not yet covered
- Existing patterns may fire incorrectly on adjacent topics
- Ticker lists on each rule go stale as relevant stocks change

**Recommended cadence:** Every 6–8 weeks, or immediately after a major news event creates a new repeating signal type.

**What Claude does:**
- Writes new signal rules for emerging macro/geo themes
- Tightens or loosens regex patterns based on false positive/negative feedback
- Updates `tickers` arrays on existing rules
- Removes rules for resolved themes (e.g., once a sanctions regime is lifted)

**Checklist for adding a new rule:**
```
□ Pattern tested against 5 real recent headlines that SHOULD fire
□ Pattern tested against 3 headlines that SHOULD NOT fire
□ Ticker list reviewed for accuracy (not too broad, not too narrow)
□ Category (cat) and direction (dir) match the signal type
□ requiredContext added if pattern is ambiguous (see SR-003 as model)
□ Rule ID is sequential (SR-063, SR-064, etc.)
□ Added to the correct `// ── Section ──` comment block
```

---

#### 3. Cluster Definitions (`CLUSTERS` array in App.jsx)
**What it is:** Named clusters (e.g., `reshoring_opp`, `aiinfra`, `iran_conflict_risk`) each with a `members` ticker list, `cx/cy` home position, and `color`.

**Why it needs updating:**
- New macro themes create new natural clusters (e.g., India-Pakistan conflict cluster for defense)
- Cluster member lists go stale as companies' exposure changes
- Home positions (`cx/cy`) may need adjustment for new clusters to avoid spatial overlap

**Recommended cadence:** Every 8–12 weeks, or when a new major cross-sector theme emerges.

---

#### 4. CAT_BOOST Keyword Lists (in `project_article_system.md`)
**What it is:** Category-specific boost terms in `articlesForPill()` that improve Tier 2 article matching.

**Why it needs updating:**
- New jargon emerges for existing categories (e.g., "cagrisema" for GLP-1 category)
- New categories may need dedicated boost terms

**Recommended cadence:** Every 6 weeks, or when articles for a specific category show poor match quality.

---

#### 5. Curated Headlines per Stock
**What it is:** The `headlines:[]` array on each stock object — 2–4 hand-written headlines describing the current narrative.

**Why it needs updating:** These are written once and never update. They show in the Reference Card.

**Recommended cadence:** Every 4 weeks alongside pill refresh. Lower priority than pills — live RSS feed articles now show in the article panel.

---

#### 6. Nation View Data (`NATIONS` array)
**What it is:** Country-level signal summaries, GDP data, risk flags, and linked tickers.

**Why it needs updating:**
- Geopolitical situation changes (e.g., Iran → add India-Pakistan)
- New countries become relevant (e.g., a manufacturing shift to Vietnam)
- GDP / risk scores need updating

**Recommended cadence:** Every 8 weeks, or when a major country-level event occurs.

---

#### 7. Feed URL List (`src/ps-feeds.js`)
**What it is:** The 58 RSS feed URLs polled by the client.

**Why it needs updating:**
- Feeds go dead (consumerist.com → consumeraffairs.com was fixed April 2026)
- New high-quality feeds emerge for underserved sectors
- Feed quality degrades (publication quality, relevance)

**How to detect dead feeds:** The client logs fetch errors. Look for feeds with 0 matching articles over a 2-week window. Also: a monthly audit of `/api/feed?url=<each_feed>` with status check.

**Recommended cadence:** Monthly health check, replace dead feeds immediately.

---

## Refresh Calendar — Suggested Schedule

| Task | Frequency | Trigger | Estimated Time |
|------|-----------|---------|----------------|
| PILL_EPOCH reset | Monthly | Calendar | 2 min |
| Curated pill refresh (high-signal tickers: NVDA, AAPL, DAL, RTX, LLY, TSLA, MSFT) | Monthly | After earnings season | 2–3h |
| Curated pill refresh (all 424 tickers) | Quarterly | Q1/Q2/Q3/Q4 earnings cycles | Full day |
| Signal rule review | 6 weeks | Major macro event OR scheduled | 1–2h |
| Feed health audit | Monthly | Calendar | 30 min |
| Cluster review | Quarterly | Major theme shift | 1–2h |
| Nation View update | 8 weeks | Major geopolitical event | 1h |
| Full audit (like AUDIT_MAY_2026.md) | Quarterly | Calendar | 2–3h |

---

## Opportunities to Reduce Manual Refresh (Autonomy Upgrades)

See `AUTONOMY_UPGRADES.md` for the full list. Top 3 highest-impact:

1. **Dynamic PILL_EPOCH** — replace the hardcoded date constant with `new Date()` minus a configurable "pill validity window." Pills would age from the day they're authored, not from a shared epoch. Eliminates the monthly PILL_EPOCH reset entirely.

2. **LLM-assisted pill generation** — feed the live Signal Feed into Claude Haiku once per day. For each firing signal rule, generate a curated pill label and assign it to affected tickers with `dateAdded: today`. This would replace the manual "write pills per stock" process with AI-assisted generation, reviewed by Claude or Eugene.

3. **Earnings calendar integration** — pull earnings dates from Financial Modeling Prep API. Auto-inject a "Pre-Earnings Uncertainty" pill 5 days before each earnings date. Remove it automatically after the date passes. Zero manual intervention required.

---

## What "Fresh" Looks Like

A well-maintained Perfect Storm instance should have:
- All active curated pills with `dateAdded` within the last 30 days
- PILL_EPOCH set to within 7 days of today
- Signal rules covering all active macro/geo themes in the current news cycle
- 0 dead feeds (all 58 returning articles)
- INCOMING FEED showing 15+ matched articles from the last 48 hours
- No expired pills visible (if a pill expires, the thesis is resolved — remove the pill or update dateAdded)
