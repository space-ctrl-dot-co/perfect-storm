// Perfect Storm — Live signal polling hook
// Fetches all configured RSS feeds via the Netlify /api/feed proxy,
// runs keyword signal matching, and returns a per-ticker pill map.
//
// Returns:
//   liveSignalsByTicker  Map<ticker, Pill[]>  — merged into STOCKS_STATIC in App.jsx
//   loading              boolean
//   error                string | null
//   lastUpdated          Date | null
//   refresh()            force a manual re-fetch

import { useState, useEffect, useRef, useCallback } from 'react';
import { PS_FEEDS, matchArticleSignals } from '../ps-feeds.js';
import { fetchOneFeed, dedup } from '../rss-pipeline.js';

const POLL_INTERVAL_MS  = 15 * 60 * 1000; // 15 minutes
const STARTUP_DELAY_MS  = 3_000;           // Let prices settle before RSS burst

// ── Signal TTL constants ──────────────────────────────────────────────────────
// Sector-broadcast rules are thematic/macro — they cover a whole sector and
// should fade faster as the headline cycle moves on.
// Per-ticker rules are company-specific — more durable, worth showing longer.
//
// State lifecycle per (ticker, label):
//   fresh  (age < ttl * FADE_RATIO)  count≥3 → "active",   else → "emerging"
//   fading (age ≥ ttl * FADE_RATIO)           → "fading"   (weight 0.25, shown dim)
//   expired (age ≥ ttl)                        → dropped entirely
//
const SECTOR_TTL_MS = 12 * 60 * 60 * 1000;  // 12h  — macro/sector broadcasts
const TICKER_TTL_MS = 48 * 60 * 60 * 1000;  // 48h  — company-specific rules
const FADE_RATIO    = 0.5;                    // start fading at 50% of TTL

// ── signal deduplication + state calculation ──────────────────────────────────
// Multiple articles can fire the same signal rule. We count matches:
//   1–2 articles → state: "emerging"  (unconfirmed)
//   3+ articles  → state: "active"    (confirmed across sources)
//   stale        → state: "fading"    (half-life passed)
//   expired      → dropped
//
// Each signal must carry `firedAt` (ms timestamp from article pubDate).

/**
 * Processes matched signals into pills and also extracts the top-3 article
 * headlines per ticker for use in expanded card narratives.
 *
 * @param {{ ticker, dir, cat, label, title?, firedAt?, sector? }[]} signals
 * @returns {{ pillMap: Map, headlineMap: Map }}
 */
function processSignals(signals) {
  const now = Date.now();

  // Group by (ticker, label) — track count and most-recent firedAt
  const groups = new Map(); // key → { count, maxFiredAt, sig }
  for (const sig of signals) {
    const key  = `${sig.ticker}|${sig.label}`;
    const prev = groups.get(key);
    if (!prev) {
      groups.set(key, { count: 1, maxFiredAt: sig.firedAt ?? now, sig });
    } else {
      prev.count++;
      prev.maxFiredAt = Math.max(prev.maxFiredAt, sig.firedAt ?? now);
    }
  }

  const pillMap     = new Map();
  const headlineMap = new Map();
  const seenTitles  = new Map();

  // Build pills from groups, respecting TTL
  for (const { count, maxFiredAt, sig } of groups.values()) {
    const ttl = sig.sector ? SECTOR_TTL_MS : TICKER_TTL_MS;
    const age = now - maxFiredAt;
    if (age > ttl) continue;                                   // expired — drop

    const state = age > ttl * FADE_RATIO
      ? 'fading'                                               // half-life passed
      : count >= 3 ? 'active' : 'emerging';                   // count-based

    const pill = { dir: sig.dir, cat: sig.cat, label: sig.label, state };
    if (!pillMap.has(sig.ticker)) pillMap.set(sig.ticker, []);
    pillMap.get(sig.ticker).push(pill);
  }

  // Headlines — collect up to 3 unique titles per ticker (only non-expired)
  for (const sig of signals) {
    const ttl = sig.sector ? SECTOR_TTL_MS : TICKER_TTL_MS;
    if (now - (sig.firedAt ?? now) > ttl) continue;           // skip expired
    const title = sig.title;
    if (title && title !== 'Untitled') {
      if (!seenTitles.has(sig.ticker)) seenTitles.set(sig.ticker, new Set());
      const titleSet = seenTitles.get(sig.ticker);
      if (titleSet.size < 3 && !titleSet.has(title)) {
        titleSet.add(title);
        if (!headlineMap.has(sig.ticker)) headlineMap.set(sig.ticker, []);
        headlineMap.get(sig.ticker).push(title);
      }
    }
  }

  return { pillMap, headlineMap };
}

// ── hook ──────────────────────────────────────────────────────────────────────
export function useLiveSignals() {
  const [liveSignalsByTicker,   setLiveSignalsByTicker]   = useState(new Map());
  const [liveHeadlinesByTicker, setLiveHeadlinesByTicker] = useState(new Map());
  const [liveFeedItems,         setLiveFeedItems]         = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Feed health: { ok, total, failedIds } — updated after every poll cycle
  const [feedHealth,  setFeedHealth]  = useState({ ok: 0, total: PS_FEEDS.length, failedIds: [] });
  const abortRef = useRef(null);

  const fetchSignals = useCallback(async () => {
    // Cancel any in-flight fetch cycle
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    try {
      // Fetch all feeds in parallel; tolerate individual failures
      const results = await Promise.allSettled(
        PS_FEEDS.map(feed =>
          fetchOneFeed(feed.url, feed.id).then(articles =>
            articles.map(a => ({ ...a, feedId: feed.id, feedCat: feed.cat }))
          )
        )
      );

      if (ctrl.signal.aborted) return;

      // ── Feed health tracking ─────────────────────────────────────────────────
      const failedIds = results
        .map((r, i) => r.status === 'rejected' ? PS_FEEDS[i].id : null)
        .filter(Boolean);
      setFeedHealth({
        ok:        PS_FEEDS.length - failedIds.length,
        total:     PS_FEEDS.length,
        failedIds,
      });

      const allArticles = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

      if (allArticles.length === 0) {
        console.warn('[useLiveSignals] all feeds returned 0 articles — check /api/feed proxy');
        return;
      }

      const deduped = dedup(allArticles);
      // Attach article title + firedAt (pubDate) to each matched signal.
      // firedAt drives TTL-based state: active → emerging → fading → expired.
      const allSignals = deduped.flatMap(article => {
        const firedAt = article.date instanceof Date && article.date.getTime() > 0
          ? article.date.getTime()
          : Date.now();
        return matchArticleSignals(article).map(sig => ({ ...sig, title: article.title, firedAt }));
      });

      const { pillMap, headlineMap } = processSignals(allSignals);
      setLiveSignalsByTicker(pillMap);
      setLiveHeadlinesByTicker(headlineMap);

      // Build feed items: group signals back to their originating articles
      const articleMap = new Map(); // title -> { article, signals[] }
      for (const article of deduped) {
        const sigs = matchArticleSignals(article);
        if (sigs.length > 0) {
          // Deduplicate signals by (ticker, label) to prevent duplicate pills per article
          const seen = new Set();
          const dedupedSigs = sigs
            .map(s => ({ dir: s.dir, cat: s.cat, label: s.label, ticker: s.ticker }))
            .filter(s => {
              const key = `${s.ticker}|${s.label}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          articleMap.set(article.title, {
            article,
            signals: dedupedSigs,
          });
        }
      }
      const feedItems = [...articleMap.values()]
        .map(({ article, signals }, idx) => {
          // article.date is a Date object from parseXML (not pubDate)
          const d = article.date instanceof Date && article.date.getTime() > 0 ? article.date : null;
          const ts = d
            ? d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
            : '';
          // Derive source homepage from article link (safest approach)
          let srcUrl = '';
          try { srcUrl = new URL(article.link).origin; } catch {}
          return {
            id:       idx + 1,
            ts,
            src:      (article.source || article.feedId || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            srcUrl,
            url:      article.link || '',
            headline: article.title,
            tickers:  [...new Set(signals.map(s => s.ticker))],
            signals,
            pubDate:  d ? d.getTime() : 0,
          };
        })
        .sort((a, b) => b.pubDate - a.pubDate)
        .slice(0, 50);
      setLiveFeedItems(feedItems);
      setLastUpdated(new Date());

      console.info(
        `[useLiveSignals] ${deduped.length} articles → ${allSignals.length} signals`,
        `(${new Date().toLocaleTimeString()})`
      );
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[useLiveSignals] fetch error:', err);
      setError(err.message ?? 'Unknown error');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  // Initial fetch (delayed) + 15-minute polling interval
  useEffect(() => {
    let startupTimer;
    // Delay the first RSS burst so price chunks can begin loading first
    startupTimer = setTimeout(() => {
      fetchSignals();
    }, STARTUP_DELAY_MS);

    const interval = setInterval(fetchSignals, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(startupTimer);
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchSignals]);

  return { liveSignalsByTicker, liveHeadlinesByTicker, liveFeedItems, feedHealth, loading, error, lastUpdated, refresh: fetchSignals };
}
