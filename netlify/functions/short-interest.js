// Perfect Storm — Short Interest proxy
// Fetches short interest (% of float) from Financial Modeling Prep (FMP).
// Requires FMP_API_KEY in Netlify environment variables.
//
// Endpoint: GET /api/short-interest?symbols=AAPL,TSLA,GME  (comma-separated, max 25)
// Returns:  JSON { AAPL: { shortPercent: 0.68, sharesShort: 104097488, daysTocover: 2.0, date: '2024-01-15' }, ... }
//
// shortPercent is expressed as a real percentage (e.g. 27.5 = 27.5% of float short).
//
// Status codes:
//   200 — success (may be partial if some tickers failed)
//   400 — missing symbols param
//   503 — FMP_API_KEY not configured
//   502 — upstream error

const TIMEOUT_MS  = 10_000;
const MAX_SYMBOLS = 25;
const CACHE_TTL   = 24 * 60 * 60 * 1000; // 24h — FINRA updates twice monthly

// Module-level in-memory cache (persists across warm lambda invocations)
const _cache = new Map(); // ticker → { data, fetchedAt }

export const handler = async (event) => {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "FMP_API_KEY not configured" }),
    };
  }

  // ── Parse symbols ──────────────────────────────────────────────────────────
  const raw = event.queryStringParameters?.symbols ?? "";
  if (!raw.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing symbols parameter" }) };
  }

  const symbols = raw
    .split(",")
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "No valid symbols" }) };
  }

  // ── Split into cached vs needs-fetch ──────────────────────────────────────
  const now       = Date.now();
  const result    = {};
  const toFetch   = [];

  for (const sym of symbols) {
    const cached = _cache.get(sym);
    if (cached && now - cached.fetchedAt < CACHE_TTL) {
      result[sym] = cached.data;
    } else {
      toFetch.push(sym);
    }
  }

  // ── Fetch uncached symbols from FMP ───────────────────────────────────────
  if (toFetch.length > 0) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const fetches = await Promise.allSettled(
        toFetch.map(async sym => {
          const url = `https://financialmodelingprep.com/api/v4/short-of-float?symbol=${encodeURIComponent(sym)}&apikey=${apiKey}`;
          const res = await fetch(url, {
            signal: controller.signal,
            headers: { "Accept": "application/json" },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          // FMP returns array sorted newest-first; take first entry
          const entry = Array.isArray(json) ? json[0] : null;
          if (!entry) return { sym, data: null };
          return {
            sym,
            data: {
              shortPercent: entry.shortPercent ?? null,   // e.g. 27.5 = 27.5% of float
              sharesShort:  entry.shortInterest ?? null,
              daysTocover:  entry.daysTocover   ?? null,
              date:         entry.date           ?? null,
            },
          };
        })
      );

      clearTimeout(timeout);

      for (const r of fetches) {
        if (r.status === "fulfilled" && r.value.data) {
          const { sym, data } = r.value;
          _cache.set(sym, { data, fetchedAt: now });
          result[sym] = data;
        }
        // Failed tickers silently omitted — client skips them
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err.name !== "AbortError") {
        console.error("[short-interest] fetch error:", err.message);
      }
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
      // Cache at CDN edge for 1h; data rarely changes intraday
      "Cache-Control":               "public, max-age=3600, stale-while-revalidate=1800",
    },
    body: JSON.stringify(result),
  };
};
