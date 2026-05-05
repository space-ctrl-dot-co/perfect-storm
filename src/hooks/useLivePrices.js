// Perfect Storm — useLivePrices hook
// Polls /api/price every POLL_MS (default 60 s) for all tracked tickers.
// Returns a Map<ticker, { price, change, pos }> that overlays onto STOCKS.
//
// Batches tickers into chunks of 40 to stay well within Yahoo's limits.
// Chunks are fetched SEQUENTIALLY (200 ms gap) rather than in parallel to
// avoid a burst of simultaneous requests on startup and on each poll cycle.
// A 1.5 s startup delay lets the page render before the first fetch begins.

import { useState, useEffect, useRef, useCallback } from "react";

const POLL_MS        = 60_000;  // Re-fetch every 60 seconds
const CHUNK          = 40;      // Max symbols per request
const INTER_CHUNK_MS = 200;     // Gap between sequential chunk requests
const STARTUP_DELAY  = 1_500;   // Wait before the very first fetch (ms)
const API_PATH       = "/api/price";

/** Pause for `ms` milliseconds (abortable via signal). */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(id); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  });
}

/**
 * @param {string[]} tickers  — list of all ticker symbols to track
 * @returns {{ prices: Map<string,{price:string,change:string,pos:boolean}>, lastUpdated: Date|null, status: "idle"|"loading"|"live"|"error" }}
 */
export function useLivePrices(tickers) {
  const [prices,      setPrices]      = useState(() => new Map());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status,      setStatus]      = useState("idle");
  const abortRef = useRef(null);

  const fetchPrices = useCallback(async (isStartup = false) => {
    if (!tickers.length) return;

    // Cancel any prior in-flight cycle
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Startup grace period — let the page render first
    if (isStartup) {
      try { await sleep(STARTUP_DELAY, ctrl.signal); }
      catch { return; }
    }

    setStatus("loading");

    try {
      // Build chunks
      const allChunks = [];
      for (let i = 0; i < tickers.length; i += CHUNK) {
        allChunks.push(tickers.slice(i, i + CHUNK));
      }

      const merged = {};

      // Fetch chunks SEQUENTIALLY with a small inter-chunk pause
      for (let i = 0; i < allChunks.length; i++) {
        if (ctrl.signal.aborted) return;

        try {
          const r = await fetch(`${API_PATH}?symbols=${allChunks[i].join(",")}`, { signal: ctrl.signal });
          if (r.ok) {
            const data = await r.json();
            Object.assign(merged, data);
          }
        } catch (err) {
          if (err.name === "AbortError") return;
          // Tolerate individual chunk failures — continue to next chunk
          console.warn("[useLivePrices] chunk failed:", err.message);
        }

        // Small gap between chunks (skip after last)
        if (i < allChunks.length - 1) {
          try { await sleep(INTER_CHUNK_MS, ctrl.signal); }
          catch { return; }
        }
      }

      if (ctrl.signal.aborted) return;

      const map = new Map();
      for (const [ticker, data] of Object.entries(merged)) {
        if (data?.price) map.set(ticker, data);
      }

      if (map.size > 0) {
        setPrices(map);
        setLastUpdated(new Date());
        setStatus("live");
      } else {
        setStatus("error");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setStatus("error");
    }
  }, [tickers]);

  useEffect(() => {
    // Pass isStartup=true so the first fetch gets the 1.5 s grace delay
    fetchPrices(true);
    const interval = setInterval(() => fetchPrices(false), POLL_MS);
    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPrices]);

  return { prices, lastUpdated, status };
}
