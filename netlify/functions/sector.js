// Perfect Storm — Sector classification proxy
// Fetches GICS sector + industry for each ticker from Yahoo Finance quoteSummary.
// Endpoint: GET /api/sector?symbols=AAPL,TSLA,NVDA   (comma-separated, max 20 per call)
// Returns:  JSON { AAPL: { sector:"Technology", industry:"Consumer Electronics" }, ... }
//
// Results are cached 24 h server-side — GICS classifications rarely change.
// The hook (useSectorClassification) batches all ~190 tickers into ≤20-symbol chunks
// and calls this function sequentially so we stay well within Yahoo's rate limits.

const TIMEOUT_MS      = 15_000;
const MAX_SYMBOLS     = 20;
const INTER_TICKER_MS = 120;   // gap between individual ticker fetches (ms)

export const handler = async (event) => {
  // ── Parse + validate symbols ───────────────────────────────────────────────
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

  // ── Fetch each ticker one-at-a-time from Yahoo quoteSummary ───────────────
  // assetProfile module returns { sector, industry, longBusinessSummary, ... }.
  // No API key required — same user-agent trick as price.js.
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const results = {};

  try {
    for (const sym of symbols) {
      if (controller.signal.aborted) break;

      try {
        const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=assetProfile`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":    "Mozilla/5.0 (compatible; PerfectStorm/1.0; +https://perfectstorm.app)",
            "Accept":        "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (res.ok) {
          const json    = await res.json();
          const profile = json?.quoteSummary?.result?.[0]?.assetProfile;
          if (profile?.sector) {
            results[sym] = {
              sector:   profile.sector,
              industry: profile.industry ?? null,
            };
          }
        }
        // Non-2xx (e.g. 404 for ETFs, 429 rate-limit) → silently skip symbol
      } catch (err) {
        if (err.name === "AbortError") break;
        // Per-ticker network failure → skip, continue to next symbol
        console.warn(`[sector] ${sym} fetch failed:`, err.message);
      }

      // Small gap so we don't hammer Yahoo — skip delay after the last symbol
      if (sym !== symbols[symbols.length - 1]) {
        await new Promise(r => setTimeout(r, INTER_TICKER_MS));
      }
    }

    clearTimeout(timeout);

    return {
      statusCode: 200,
      headers: {
        "Content-Type":                "application/json",
        "Access-Control-Allow-Origin": "*",
        // 24 h cache — sector classifications are stable; stale-while-revalidate for zero-lag refreshes
        "Cache-Control":               "public, max-age=86400, stale-while-revalidate=3600",
      },
      body: JSON.stringify(results),
    };

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { statusCode: 504, body: JSON.stringify({ error: "Gateway Timeout" }) };
    }
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) };
  }
};
