// Perfect Storm — Pill article search proxy
// Returns 3-5 recent, relevant news articles for a given ticker + signal keyword query.
// Uses the RSS/feed data already parsed by the feed function, plus optional news search
// APIs when results are sparse.
//
// Endpoint: GET /api/pill-articles?ticker=NVDA&q=export+controls+semiconductor
// Returns:  JSON { articles: [{ headline, src, date, url }], cached: bool }
//
// ── Data sources (in order of preference) ────────────────────────────────────
// 1. Yahoo Finance news for the ticker (no API key required)
// 2. Brave Search API (set BRAVE_SEARCH_KEY env var) — rich, live web results
// 3. NewsAPI.org (set NEWSAPI_KEY env var) — broad coverage, free tier 100 req/day
//
// At least one source is always tried. Results are merged and deduplicated.
// ─────────────────────────────────────────────────────────────────────────────

const TIMEOUT_MS  = 6000;
const MAX_RESULTS = 5;

// ── Simple in-memory cache (per cold-start, ~60s TTL) ────────────────────────
const _cache = new Map(); // key → { ts, articles }
const CACHE_TTL = 60_000; // 60 seconds

function cachedGet(key) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.articles;
  return null;
}
function cacheSet(key, articles) {
  _cache.set(key, { ts: Date.now(), articles });
}

// ── Yahoo Finance news for a ticker (no API key needed) ─────────────────────
async function fetchYahooNews(ticker, signal) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=10&enableNavLinks=false&enableEnhancedTriviaCarousel=false`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timer);
    if (!r.ok) return [];
    const data = await r.json();
    const news = data?.news ?? [];
    // Score each article by keyword overlap with q
    const qTerms = signal.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return news
      .map(item => {
        const text = (item.title + " " + (item.publisher ?? "")).toLowerCase();
        const score = qTerms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
        const raw = item.providerPublishTime ?? Math.floor(Date.now() / 1000);
        const date = new Date(raw * 1000).toISOString().slice(0, 10);
        return {
          headline: item.title,
          src: item.publisher ?? "Yahoo Finance",
          date,
          url: item.link ?? null,
          _score: score,
        };
      })
      .filter(a => a.headline)
      .sort((a, b) => b._score - a._score)
      .slice(0, MAX_RESULTS);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// ── Brave Search API (requires BRAVE_SEARCH_KEY env var) ────────────────────
// Sign up free at https://brave.com/search/api/ — 2,000 req/month on free tier
async function fetchBraveNews(ticker, q) {
  const key = process.env.BRAVE_SEARCH_KEY;
  if (!key) return [];
  const url = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(ticker + " " + q)}&count=5&freshness=pm&country=us&search_lang=en`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": key,
      },
    });
    clearTimeout(timer);
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.results ?? []).slice(0, MAX_RESULTS).map(item => ({
      headline: item.title,
      src: item.source?.name ?? item.url?.split("/")[2] ?? "News",
      date: item.age ?? item.published_time?.slice(0, 10) ?? "",
      url: item.url ?? null,
    }));
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// ── NewsAPI.org (requires NEWSAPI_KEY env var) ────────────────────────────────
// Free tier: 100 req/day. Sign up at https://newsapi.org/
async function fetchNewsAPI(ticker, q) {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return [];
  const query = encodeURIComponent(`${ticker} ${q}`);
  const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${key}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return [];
    const data = await r.json();
    return (data?.articles ?? []).slice(0, MAX_RESULTS).map(item => ({
      headline: item.title?.replace(/\s*-\s*[^-]+$/, "") ?? item.title, // strip source suffix
      src: item.source?.name ?? "News",
      date: item.publishedAt?.slice(0, 10) ?? "",
      url: item.url ?? null,
    })).filter(a => a.headline && !a.headline.includes("[Removed]"));
  } catch {
    clearTimeout(timer);
    return [];
  }
}

// ── Merge and deduplicate results ────────────────────────────────────────────
function mergeResults(...lists) {
  const seen = new Set();
  const out  = [];
  for (const list of lists) {
    for (const item of list) {
      const key = (item.headline ?? "").toLowerCase().slice(0, 60);
      if (!seen.has(key) && item.headline) {
        seen.add(key);
        out.push(item);
      }
      if (out.length >= MAX_RESULTS) return out;
    }
  }
  return out;
}

// ── Handler ──────────────────────────────────────────────────────────────────
export const handler = async (event) => {
  const ticker = (event.queryStringParameters?.ticker ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const q      = (event.queryStringParameters?.q ?? "").slice(0, 120);

  if (!ticker) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing ticker parameter" }) };
  }

  const cacheKey = `${ticker}|${q}`;
  const cached   = cachedGet(cacheKey);
  if (cached) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      body: JSON.stringify({ articles: cached, cached: true }),
    };
  }

  // ── Fetch from all available sources concurrently ──────────────────────────
  const [yahoo, brave, newsapi] = await Promise.allSettled([
    fetchYahooNews(ticker, q),
    fetchBraveNews(ticker, q),
    fetchNewsAPI(ticker, q),
  ]);

  const yahooArts   = yahoo.status   === "fulfilled" ? yahoo.value   : [];
  const braveArts   = brave.status   === "fulfilled" ? brave.value   : [];
  const newsApiArts = newsapi.status === "fulfilled" ? newsapi.value : [];

  // Prefer: Brave (freshest, most precise) → NewsAPI → Yahoo
  const articles = mergeResults(braveArts, newsApiArts, yahooArts);

  cacheSet(cacheKey, articles);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    body: JSON.stringify({ articles, cached: false }),
  };
};
