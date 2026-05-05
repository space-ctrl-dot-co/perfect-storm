// Perfect Storm — Social Sentiment Proxy (StockTwits)
// Fetches bullish/bearish message counts from StockTwits public API.
// Endpoint: GET /api/sentiment?symbols=AAPL,TSLA,NVDA  (comma-separated, max 20)
// Returns:  JSON { AAPL: { bullish: 12, bearish: 4, total: 16, signal: "bullish" }, ... }
//
// signal = "bullish"  if bullish/(bullish+bearish) >= 0.65 and (bullish+bearish) >= 5
// signal = "bearish"  if bearish/(bullish+bearish) >= 0.65 and (bullish+bearish) >= 5
// signal = "neutral"  otherwise (mixed sentiment or too few tagged messages)
//
// StockTwits public API requires no auth key for public symbol streams.
// Rate limit: ~200 req/hr unauthenticated — stay well under by batching in the client.
// Cache: 10 min (sentiment data is relatively slow-moving).

const TIMEOUT_MS          = 8000;
const MAX_SYMBOLS         = 20;
const SIGNAL_THRESHOLD    = 0.65;   // 65%+ skew to call a signal
const MIN_SENTIMENT_MSGS  = 5;      // need at least 5 tagged messages to call a signal

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

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const results = await Promise.allSettled(
      symbols.map(async sym => {
        const url = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(sym)}.json`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; PerfectStorm/1.0; +https://perfect-storm.app)",
            "Accept":     "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // StockTwits response: { messages: [{ entities: { sentiment: { basic: "Bullish"|"Bearish" } } }] }
        const messages = json?.messages ?? [];
        let bullish = 0, bearish = 0;
        for (const msg of messages) {
          const s = msg?.entities?.sentiment?.basic;
          if (s === "Bullish") bullish++;
          else if (s === "Bearish") bearish++;
        }

        const total = bullish + bearish;
        let signal  = "neutral";

        if (total >= MIN_SENTIMENT_MSGS) {
          const bullRatio = bullish / total;
          const bearRatio = bearish / total;
          if      (bullRatio >= SIGNAL_THRESHOLD) signal = "bullish";
          else if (bearRatio >= SIGNAL_THRESHOLD) signal = "bearish";
        }

        return { ticker: sym, bullish, bearish, total, signal };
      })
    );

    clearTimeout(timeout);

    const sentimentMap = {};
    for (let i = 0; i < symbols.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        const { ticker, ...data } = r.value;
        sentimentMap[ticker] = data;
      }
      // Failed tickers are silently omitted — caller treats missing keys as neutral
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type":                "application/json",
        "Access-Control-Allow-Origin": "*",
        // 10 min cache — social sentiment shifts slowly
        "Cache-Control":               "public, max-age=600, stale-while-revalidate=120",
      },
      body: JSON.stringify(sentimentMap),
    };

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { statusCode: 504, body: JSON.stringify({ error: "Gateway Timeout" }) };
    }
    return { statusCode: 502, body: JSON.stringify({ error: err.message }) };
  }
};
