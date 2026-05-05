// Perfect Storm — RSS CORS proxy
// Ported from fllwup. Fetches RSS feed URLs server-side to bypass browser CORS restrictions.
// Returns raw XML. Status codes:
//   504 — upstream timed out (6s limit)
//   451 — host blocked or connection refused
//   200 — success, body = raw XML

export const handler = async (event) => {
  const url = event.queryStringParameters?.url;
  if (!url) return { statusCode: 400, body: "Missing url parameter" };

  let parsed;
  try { parsed = new URL(url); }
  catch { return { statusCode: 400, body: "Invalid URL" }; }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { statusCode: 400, body: "Only http/https URLs allowed" };
  }

  // Block localhost/internal ranges from being used as SSRF vectors
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(parsed.hostname)) {
    return { statusCode: 403, body: "Private addresses not allowed" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":      "Mozilla/5.0 (compatible; PerfectStorm/1.0; +https://perfectstorm.app)",
        "Accept":          "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const body = await res.text();
    const ct   = res.headers.get("content-type") || "application/xml; charset=utf-8";

    return {
      statusCode: res.status,
      headers: {
        "Content-Type":                ct,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control":               "public, max-age=300, stale-while-revalidate=60",
      },
      body,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { statusCode: 504, body: "Gateway Timeout" };
    }
    return { statusCode: 451, body: `Unavailable for Legal Reasons: ${err.message}` };
  }
};
