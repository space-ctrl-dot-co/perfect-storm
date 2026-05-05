// Perfect Storm — Live price proxy
// Fetches real-time quotes from Yahoo Finance (no API key required).
// Endpoint: GET /api/price?symbols=AAPL,TSLA,NVDA  (comma-separated, max 50)
// Returns:  JSON { AAPL: { price, change, pct, pos }, ... }
//
// Yahoo Finance crumb/cookie flow is not needed for the v7/chart endpoint.
// Status codes:
//   200 — success, body = JSON quote map
//   400 — missing or empty symbols param
//   502 — Yahoo upstream error
//   504 — upstream timed out

const TIMEOUT_MS = 8000;
const MAX_SYMBOLS = 50;

export const handler = async (event) => {
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
    return { statusCode: 400, body: JSON.stringify({ error: "No valid symbols provided" }) };
  }

  // ── Fetch each symbol from Yahoo Finance v8 chart endpoint ────────────────
  // Using the v8 chart API returns 1d range (current price + prev close for % change).
  // This avoids the /v7/finance/quote crumb requirement.
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const results = await Promise.allSettled(
      symbols.map(async sym => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":   "Mozilla/5.0 (compatible; PerfectStorm/1.0; +https://perfect-storm.app)",
            "Accept":       "application/json",
            "Cache-Control":"no-cache",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (!meta) throw new Error("No meta in response");

        const price      = meta.regularMarketPrice ?? null;
        const prevClose  = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPreviousClose ?? null;
        const change     = price != null && prevClose != null ? price - prevClose : null;
        const pct        = change != null && prevClose ? (change / prevClose) * 100 : null;

        return {
          ticker: sym,
          price:  price  != null ? `$${price.toFixed(2)}`                   : null,
          change: pct    != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : null,
          pos:    pct    != null ? pct >= 0                                   : true,
          raw: { price, prevClose, change, pct },
        };
      })
    );

    clearTimeout(timeout);

    // Build response map (only include successful fetches)
    const quoteMap = {};
    for (let i = 0; i < symbols.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        const { ticker, ...quote } = r.value;
        quoteMap[ticker] = quote;
      }
      // Failed symbols are silently omitted — client falls back to static data
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type":                "application/json",
        "Access-Control-Allow-Origin": "*",
        // Cache for 60s — price data ages quickly but we don't want to hammer Yahoo
        "Cache-Control":               "public, max-age=60, stale-while-revalidate=30",
      },
      body: JSON.stringify(quoteMap),
    };

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { statusCode: 504, body: JSON.stringify({ error: "Gateway Timeout" }) };
    }
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) };
  }
};
