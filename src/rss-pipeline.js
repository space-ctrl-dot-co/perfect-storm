// Perfect Storm — RSS pipeline
// Core functions ported verbatim from fllwup (parseXML, fetchOneFeed, enrichArticle, dedup).
// All credit for this battle-tested implementation to the fllwup project.

const proxy    = (url) => `/api/feed?url=${encodeURIComponent(url)}`;
const metaProxy = (url) => `/api/meta?url=${encodeURIComponent(url)}`;

// Sources whose RSS strips images/authors — scrape the article page for both
const SCRAPE_AUTHOR_SOURCES = new Set([
  "Reuters Business", "Reuters World", "Financial Times", "Bloomberg Markets",
  "Bloomberg Tech", "WSJ Markets", "CNBC Markets", "Defense News",
  "Al Jazeera", "Politico", "Foreign Policy", "Axios",
  "TechCrunch", "The Verge", "Engadget",
]);

// ── enrichArticle ─────────────────────────────────────────────────────────────
export async function enrichArticle(article) {
  if (!article.link || /news\.google\.com/.test(article.link)) return {};
  const result = { imgs: [] };
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 7000);
    let html = "";
    try {
      const r = await fetch(metaProxy(article.link), { signal: ctrl.signal });
      if (r.ok) html = await r.text();
    } finally { clearTimeout(tid); }
    if (!html) return result;

    if (!article.img) {
      const IMGS_MAX = 3;
      const seen = new Set();
      const AD_CDN = /doubleclick\.net|googlesyndication|adnxs\.com|outbrain|taboola|moatads|rubiconproject|openx\.net|pubmatic|criteo|adsafeprotected/i;
      const isBadImg = (url) => {
        if (!url || url.length < 12) return true;
        if (AD_CDN.test(url)) return true;
        if (url.endsWith(".svg")) return true;
        if (/\/(?:icons?|favicon|logo|apple-touch|android-chrome|site-icon|default-image)[^/]*(?:\.(?:png|ico|svg)|$)/i.test(url)) return true;
        if (/icon[_-]?\d{2,3}x\d{2,3}/i.test(url)) return true;
        if (/512x512|192x192|180x180|144x144|96x96|32x32|16x16/i.test(url)) return true;
        if (/avatar|badge|button|pixel|tracker|spacer|sprite|blank\.gif/i.test(url)) return true;
        return false;
      };
      const addImg = (url) => {
        if (!url) return;
        const u = url.trim();
        if (!u.startsWith("http")) return;
        if (isBadImg(u)) return;
        if (seen.has(u)) return;
        seen.add(u);
        result.imgs.push(u);
      };
      const ldRe2 = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let ldm2;
      while ((ldm2 = ldRe2.exec(html)) !== null && result.imgs.length < IMGS_MAX) {
        try {
          const d = JSON.parse(ldm2[1]);
          const nodes = Array.isArray(d) ? d.flat() : [d];
          for (const node of nodes) {
            if (result.imgs.length >= IMGS_MAX) break;
            const imgNode = node?.image || node?.thumbnailUrl || node?.associatedMedia?.contentUrl;
            if (!imgNode) continue;
            if (typeof imgNode === "string") { addImg(imgNode); }
            else if (imgNode?.url) { addImg(imgNode.url); }
            else if (Array.isArray(imgNode)) {
              for (const item of imgNode) {
                if (result.imgs.length >= IMGS_MAX) break;
                if (typeof item === "string") addImg(item);
                else if (item?.url) addImg(item.url);
                else if (item?.contentUrl) addImg(item.contentUrl);
              }
            }
          }
        } catch {}
      }
      if (result.imgs.length < IMGS_MAX) {
        const og = html.match(/<meta[^>]+property=["'](og:image|og:image:secure_url)["'][^>]+content=["'](https?:\/\/[^"'\s>]{10,})["']/i)
                || html.match(/<meta[^>]+content=["'](https?:\/\/[^"'\s>]{10,})["'][^>]+property=["'](og:image)["']/i);
        if (og) addImg((og[2] || og[1]).trim());
      }
      if (result.imgs.length < IMGS_MAX) {
        const tw = html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["'](https?:\/\/[^"'\s>]{10,})["']/i)
                 || html.match(/<meta[^>]+content=["'](https?:\/\/[^"'\s>]{10,})["'][^>]+name=["']twitter:image["']/i);
        if (tw) addImg((tw[2] || tw[1]).trim());
      }
      if (result.imgs.length > 0) result.img = result.imgs[0];
    }

    if (!article.author) {
      const ldRe = /<script[^>]+type=["'](application\/ld\+json|application\/json)["'][^>]*>([\s\S]*?)<\/script>/gi;
      let m;
      while ((m = ldRe.exec(html)) !== null) {
        try {
          const d = JSON.parse(m[2]);
          const nodes = Array.isArray(d) ? d.flat() : [d];
          for (const node of nodes) {
            const types = [].concat(node["@type"] || []);
            if (types.some(t => /article|newsarticle|blogposting/i.test(t))) {
              const a = node.author;
              const name = Array.isArray(a) ? a[0]?.name : a?.name || a;
              if (typeof name === "string" && name.length > 1 && name.length < 80) {
                result.author = name.trim(); break;
              }
            }
          }
        } catch {}
        if (result.author) break;
      }
      if (!result.author) {
        const ma = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']{2,80})["']/i)
                 || html.match(/<meta[^>]+content=["']([^"']{2,80})["'][^>]+name=["']author["']/i);
        if (ma) result.author = (ma[2] || ma[1]).trim();
      }
    }

    const descTooShort = !article.desc || article.desc.length < 60;
    const descIsTitle  = article.desc?.trim() === article.title?.trim();
    if (descTooShort || descIsTitle) {
      const ogd = html.match(/<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']{30,300})["']/i)
               || html.match(/<meta[^>]+content=["']([^"']{30,300})["'][^>]+(?:property=["']og:description["']|name=["']description["'])/i);
      if (ogd) {
        result.desc = (ogd[2] || ogd[1]).trim()
          .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
          .replace(/&quot;/g,'"').replace(/&#39;/g,"'");
      }
    }
    const stripped = html.replace(/<script[\s\S]*?<\/script>/gi,"")
                         .replace(/<style[\s\S]*?<\/style>/gi,"")
                         .replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    const words = stripped.split(" ").length;
    if (words > 200) result.readTime = Math.max(1, Math.round(words / 230));
  } catch {}
  return result;
}

// ── parseXML ──────────────────────────────────────────────────────────────────
export function parseXML(xmlStr, sourceName) {
  const sanitize = (s) => s.trimStart()
    .replace(/&nbsp;/g,"&#160;").replace(/&mdash;/g,"&#8212;").replace(/&ndash;/g,"&#8211;")
    .replace(/&hellip;/g,"&#8230;").replace(/&lsquo;/g,"&#8216;").replace(/&rsquo;/g,"&#8217;")
    .replace(/&ldquo;/g,"&#8220;").replace(/&rdquo;/g,"&#8221;").replace(/&copy;/g,"&#169;")
    .replace(/&reg;/g,"&#174;").replace(/&trade;/g,"&#8482;").replace(/&middot;/g,"&#183;")
    .replace(/&bull;/g,"&#8226;").replace(/&laquo;/g,"&#171;").replace(/&raquo;/g,"&#187;");

  let doc = null;
  const raw = sanitize(xmlStr);
  try { const d = new DOMParser().parseFromString(raw,"text/xml"); if (!d.querySelector("parsererror")) doc = d; } catch {}
  if (!doc) { try { const d = new DOMParser().parseFromString(raw,"text/html"); if (d.querySelectorAll("item, entry").length > 0) doc = d; } catch {} }
  if (!doc) { try { const stripped = raw.replace(/^<\?xml[^?]*\?>\s*/i,""); const d = new DOMParser().parseFromString(stripped,"text/xml"); if (!d.querySelector("parsererror")) doc = d; } catch {} }
  if (!doc) return [];

  return [...doc.querySelectorAll("item, entry")].map(it => {
    const qs  = (sel) => { try { return it.querySelector(sel)?.textContent?.trim() || ""; } catch { return ""; } };
    const ns  = (tag) => {
      const els = it.getElementsByTagName(tag);
      if (els.length) return els[0];
      const local = tag.includes(":") ? tag.split(":")[1] : tag;
      for (const el of it.getElementsByTagName("*")) if (el.localName === local) return el;
      return null;
    };
    const linkEl = it.querySelector("link");
    const link   = linkEl?.getAttribute("href") || linkEl?.textContent?.trim() || "";
    const dateStr = qs("pubDate") || qs("published") || qs("updated") || ns("dc:date")?.textContent?.trim() || "";
    const date    = dateStr ? new Date(dateStr) : new Date(0);
    const ceText      = ns("content:encoded")?.textContent || "";
    const atomContentEl = ns("content");
    const atomContent = atomContentEl?.textContent || atomContentEl?.innerHTML || "";
    const descTag     = qs("description") || qs("summary") || ns("atom:summary")?.textContent || "";
    const htmlPool    = ceText + " " + atomContent + " " + descTag;
    const ceStripped  = ceText.replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
    const descStripped= descTag.replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
    const rawDesc     = ceStripped.length > descStripped.length + 80 ? ceText : (descTag || ceText || atomContent);
    const desc = rawDesc.replace(/<[^>]+>/g,"")
      .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
      .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&apos;/g,"'")
      .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(n)).replace(/&[a-z]+;/g," ")
      .replace(/\s+/g," ").trim().slice(0,1200);

    const isImgUrl = u => {
      if (!u || u.length < 10) return false;
      if (!/^https?:\/\//i.test(u)) return false;
      return /\.(jpe?g|png|webp|gif)/i.test(u) ||
        /image-cdn\.|cdn\.|images?\.|img\.|media\.|photos?\.|assets\.|static\.|upload|thumb|picture|\/photo\//i.test(u) ||
        /staticassets\.aljazeera|static\.dw\.com|cdn\.spiegel\.de|ichef\.bbci|guim\.co\.uk|nytimes\.com\/images|washpost\.com/i.test(u);
    };
    let img = null;
    const mcEls = [...it.getElementsByTagName("media:content"),...it.getElementsByTagName("content")].filter(el=>el.localName==="content");
    const mcUrl = mcEls.map(el=>el.getAttribute("url")).find(isImgUrl)||null;
    const mtEls = [...it.getElementsByTagName("media:thumbnail"),...it.getElementsByTagName("thumbnail")].filter(el=>el.localName==="thumbnail");
    const mtUrl = mtEls.map(el=>el.getAttribute("url")).find(isImgUrl)||null;
    const mcDirect = ns("media:content")?.getAttribute("url");
    const mtDirect = ns("media:thumbnail")?.getAttribute("url");
    if (isImgUrl(mcUrl)) img = mcUrl;
    else if (isImgUrl(mtUrl)) img = mtUrl;
    else if (isImgUrl(mcDirect)) img = mcDirect;
    else if (isImgUrl(mtDirect)) img = mtDirect;
    if (!img && ceText) {
      const decoded = ceText.replace(/&amp;/g,"&");
      const m = decoded.match(/<img[^>]+src=["']((?:https?:)?\/\/[^"'<>\s]{10,})["']/i)
             || decoded.match(/<img[^>]+src=["'](https?:\/\/[^"'<>\s]{10,})["']/i);
      if (m?.[1]) img = m[1].startsWith("//") ? "https:"+m[1] : m[1];
    }
    if (!img) { const enc = it.querySelector("enclosure"); const encUrl = enc?.getAttribute("url"); const encHttps = encUrl?.replace(/^http:\/\//,"https://"); if (isImgUrl(encHttps||encUrl)) img = encHttps||encUrl; }
    if (!img) { const m = (htmlPool+rawDesc).match(/<img[^>]+src=["'](\S[^'"<>]*)["']/i); if (m?.[1]?.length>10) img=m[1]; }
    if (img) {
      img = img.replace(/(ichef\.bbci\.co\.uk\/ace\/(?:standard|rs))\/\d+\//i,"$1/1024/");
      img = img.replace(/(i\.guim\.co\.uk\/img\/[^?]+?\/)(\d{2,4})(\/[^/]+\.(?:jpe?g|png|webp))/i,(_,pre,_w,rest)=>`${pre}1200${rest}`);
      img = img.replace(/(nytimes\.com\/images\/[^?]+)\?.*$/,"$1");
      img = img.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp|gif))$/i,"$1");
    }
    const rawTitle = qs("title");
    const baseTitle = rawTitle.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
      .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&apos;/g,"'")
      .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/&[a-z]+;/g," ")
      .replace(/\s*[-|]\s*[^-|]{2,40}$/,"").trim() || "Untitled";
    const isGoogleNews  = sourceName === "Google News";
    const itemSourceEl  = it.querySelector("source");
    const itemSourceName= itemSourceEl?.textContent?.trim() || "";
    const resolvedSource= (isGoogleNews && itemSourceName) ? itemSourceName : sourceName;
    const sourceHint    = (isGoogleNews && itemSourceEl?.getAttribute("url")) || null;
    const cleanTitle    = isGoogleNews ? baseTitle.replace(/\s*[-\u2013\u2014]\s*[^-\u2013\u2014]{2,50}$/,"").trim()||baseTitle : baseTitle;
    const rawAuthor = ns("dc:creator")?.textContent?.trim() || it.querySelector("author > name")?.textContent?.trim() || qs("author") || "";
    const cleanedAuthor = rawAuthor.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\s*/g,"")
      .replace(/^\s*\(|\)\s*$/g,"").replace(/&amp;/g,"&").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(n)).trim().slice(0,120);
    const ORG_BYLINES = new Set(["reuters","associated press","ap","bloomberg","afp","staff","editors","editorial","admin","administrator","newsroom","news desk","wire","press release"]);
    const isSuppressed = !cleanedAuthor || ORG_BYLINES.has(cleanedAuthor.toLowerCase()) || sourceName.toLowerCase().includes(cleanedAuthor.toLowerCase());
    const author = isSuppressed ? "" : cleanedAuthor;
    const id = qs("guid") || qs("id") || link;
    return { id, title: cleanTitle, source: resolvedSource, sourceHint, date, link, img, imgs: img ? [img] : [], desc, author, enriched: false, isGNews: isGoogleNews };
  }).filter(a => a.link);
}

// ── fetchOneFeed ──────────────────────────────────────────────────────────────
export async function fetchOneFeed(feedUrl, sourceName) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), 8000);
  let r;
  try {
    r = await fetch(proxy(feedUrl), { signal: ctrl.signal });
  } finally { clearTimeout(tid); }
  if (r.status === 451 || r.status === 504) throw new Error(`skip:${sourceName}`);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${sourceName}`);
  const xml = await r.text();
  const xmlTrimmed = xml.trimStart();
  if (!xmlTrimmed.startsWith("<")) throw new Error(`non-XML response for ${sourceName}`);
  const arts = parseXML(xmlTrimmed, sourceName);
  if (!arts.length) throw new Error(`0 items parsed for ${sourceName}`);

  const IMG_SCRAPE_CAP = 8;
  const needsMeta    = arts.filter(a => a.link && (!a.author || !a.img) && SCRAPE_AUTHOR_SOURCES.has(sourceName));
  const needsImgOnly = arts.filter(a => a.link && !a.img && !SCRAPE_AUTHOR_SOURCES.has(sourceName)).slice(0, IMG_SCRAPE_CAP);

  if (needsMeta.length) {
    const scraped = await Promise.allSettled(needsMeta.map(a => enrichArticle(a)));
    needsMeta.forEach((a, i) => {
      if (scraped[i].status !== "fulfilled") return;
      const { img, imgs, author } = scraped[i].value;
      if (!a.img && img) a.img = img;
      if (imgs?.length) a.imgs = imgs;
      if (!a.author && author) a.author = author;
    });
  }
  if (needsImgOnly.length) {
    const scraped = await Promise.allSettled(needsImgOnly.map(a => enrichArticle(a)));
    needsImgOnly.forEach((a, i) => {
      if (scraped[i].status !== "fulfilled") return;
      const { img, imgs } = scraped[i].value;
      if (!a.img && img) a.img = img;
      if (imgs?.length) a.imgs = imgs;
    });
  }
  return arts;
}

// ── dedup ─────────────────────────────────────────────────────────────────────
export function dedup(articles) {
  const seen = new Set();
  return articles.filter(a => {
    const key = a.link.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
