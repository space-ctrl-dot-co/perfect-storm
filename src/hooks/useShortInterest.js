// Perfect Storm — Short Interest auto-signal hook
// Polls /api/short-interest for all "interesting" tickers (those with existing pills)
// and converts high short-interest readings into risk pills.
//
// Pill generation thresholds (shortPercent = % of float short):
//   >= 30%  → active  risk  "Extreme Short Interest — XX% of Float, Short Squeeze Risk"
//   >= 15%  → active  risk  "High Short Interest — XX% of Float, Crowded Short Trade"
//   >= 8%   → emerging risk "Elevated Short Interest — XX% of Float"
//   daysTocover >= 10 (any level) → additional active risk "Long Days-to-Cover — X days, Squeeze Setup"
//
// Returns:
//   shortInterestByTicker  Map<ticker, Pill[]>
//   shortInterestLoading   boolean
//   shortInterestError     string | null

import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000;  // 6h — short data updates twice monthly
const CHUNK_SIZE       = 25;                    // FMP endpoint max per request
const CHUNK_DELAY_MS   = 150;                   // gentle rate-limit buffer between chunks
const STARTUP_DELAY_MS = 8_000;                 // let prices + RSS settle first

// ── Threshold constants ────────────────────────────────────────────────────────
const PCT_EXTREME  = 30;   // >= 30% → extreme / squeeze candidate
const PCT_HIGH     = 15;   // >= 15% → high / crowded trade
const PCT_ELEVATED =  8;   // >= 8%  → elevated, worth noting
const DTC_SQUEEZE  = 10;   // days-to-cover >= 10 → additional squeeze setup pill

function buildPills(shortPercent, daysTocover) {
  const pills = [];
  if (shortPercent == null) return pills;

  const pct    = Number(shortPercent);
  const dtc    = daysTocover != null ? Number(daysTocover) : null;
  const pctStr = pct.toFixed(1);

  if (pct >= PCT_EXTREME) {
    pills.push({
      dir:   'risk',
      cat:   'SECTOR',
      label: `Sector: Extreme Short Interest — ${pctStr}% of Float Short, Short Squeeze Risk`,
      state: 'active',
      autoShortInterest: true,
    });
  } else if (pct >= PCT_HIGH) {
    pills.push({
      dir:   'risk',
      cat:   'SECTOR',
      label: `Sector: High Short Interest — ${pctStr}% of Float Short, Crowded Short Trade`,
      state: 'active',
      autoShortInterest: true,
    });
  } else if (pct >= PCT_ELEVATED) {
    pills.push({
      dir:   'risk',
      cat:   'SECTOR',
      label: `Sector: Elevated Short Interest — ${pctStr}% of Float Short`,
      state: 'emerging',
      autoShortInterest: true,
    });
  }

  // Days-to-cover signal (orthogonal — a stock with moderate short % but high DTC is also risky)
  if (dtc != null && dtc >= DTC_SQUEEZE && pct >= PCT_ELEVATED) {
    pills.push({
      dir:   'risk',
      cat:   'SECTOR',
      label: `Sector: Short Squeeze Setup — ${dtc.toFixed(1)} Days to Cover, Potential Rapid Unwind`,
      state: pct >= PCT_HIGH ? 'active' : 'emerging',
      autoShortInterest: true,
    });
  }

  return pills;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * @param {string[]} tickers  — list of tickers to monitor (pass only ones with pills)
 */
export function useShortInterest(tickers) {
  const [shortInterestByTicker, setShortInterestByTicker] = useState(new Map());
  const [shortInterestLoading,  setShortInterestLoading]  = useState(false);
  const [shortInterestError,    setShortInterestError]     = useState(null);
  const abortRef   = useRef(null);
  const tickersRef = useRef(tickers);

  // Keep ref fresh without triggering re-fetch on every render
  useEffect(() => { tickersRef.current = tickers; }, [tickers]);

  const fetchAll = useCallback(async () => {
    const list = tickersRef.current;
    if (!list || list.length === 0) return;

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setShortInterestLoading(true);
    setShortInterestError(null);

    try {
      const pillMap = new Map();

      // Chunk requests to respect FMP's max-symbols limit
      for (let i = 0; i < list.length; i += CHUNK_SIZE) {
        if (ctrl.signal.aborted) break;

        const chunk   = list.slice(i, i + CHUNK_SIZE);
        const symbols = chunk.join(",");

        try {
          const res = await fetch(`/api/short-interest?symbols=${encodeURIComponent(symbols)}`, {
            signal: ctrl.signal,
          });

          if (!res.ok) {
            // 503 = no API key configured; stop polling silently
            if (res.status === 503) {
              console.warn("[useShortInterest] FMP_API_KEY not configured — short interest disabled");
              setShortInterestLoading(false);
              return;
            }
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();

          for (const [ticker, si] of Object.entries(data)) {
            const pills = buildPills(si.shortPercent, si.daysTocover);
            if (pills.length > 0) {
              pillMap.set(ticker, pills);
            }
          }
        } catch (chunkErr) {
          if (chunkErr.name === "AbortError") break;
          console.warn(`[useShortInterest] chunk ${i}–${i + CHUNK_SIZE} failed:`, chunkErr.message);
        }

        // Pace chunks — avoid hammering the function cold-starts
        if (i + CHUNK_SIZE < list.length) await sleep(CHUNK_DELAY_MS);
      }

      if (!ctrl.signal.aborted) {
        setShortInterestByTicker(pillMap);
        console.info(
          `[useShortInterest] ${pillMap.size} tickers with elevated short interest`,
          `(${new Date().toLocaleTimeString()})`
        );
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[useShortInterest] error:", err);
        setShortInterestError(err.message ?? "Unknown error");
      }
    } finally {
      if (!ctrl.signal.aborted) setShortInterestLoading(false);
    }
  }, []); // stable — reads tickers via ref

  // Initial fetch (delayed) + polling
  useEffect(() => {
    const startupTimer = setTimeout(fetchAll, STARTUP_DELAY_MS);
    const interval     = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(startupTimer);
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchAll]);

  return { shortInterestByTicker, shortInterestLoading, shortInterestError };
}
