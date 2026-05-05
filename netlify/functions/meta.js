// Perfect Storm — Article metadata proxy
// Ported from fllwup. Fetches article HTML server-side for enrichment (images, author, description).
// Used by enrichArticle() in rss-pipeline.js.

export const handler = async (event) => {
  const url = event.queryStringParameters?.url;
  if (!url) return { statusCode: 400, body: "Missing url parameter" };

  let parsed;
  try { parsed = new URL(url); }
  catch { return { statusCode: 400, body: "Invalid URL" }; }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { statusCode: 400, body: "Only http/https URLs allowed" };
  }

  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(parsed.hostname)) {
    return { statusCode: 403, body: "Private addresses not allowed" };
  }

  // Google News redirect URLs return opaque tokens — skip immediately
  if (/news\.google\.com/i.test(parsed.hostname)) {
    return { statusCode: 404, body: "Google News redirect URLs not supported" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":      "Mozilla/5.0 (compatible; PerfectStorm/1.0; +https://perfectstorm.app)",
        "Accept":          "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const body = await res.text();

    return {
      statusCode: res.status,
      headers: {
        "Content-Type":                "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control":               "public, max-age=3600",
      },
      body,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") return { statusCode: 504, body: "Gateway Timeout" };
    return { statusCode: 451, body: `Unavailable: ${err.message}` };
  }
};
