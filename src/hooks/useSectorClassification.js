// Perfect Storm — useSectorClassification hook
// On demand: fetches GICS sector/industry from /api/sector for all tracked tickers,
// maps Yahoo's classifications to app-sector IDs, and returns a diff showing
// tickers that are unclassified or potentially in the wrong sector.
//
// Usage:
//   const { loading, suggestions, runAudit } = useSectorClassification(tickers, sectorGroups);
//
// `suggestions` — array of { ticker, current:string[], suggested:string[], industry, type }
//   type: "mismatch" | "unclassified"
//   Mismatches appear first (alpha within each group).
//
// The audit is manual-only (runAudit) — no auto-polling.

import { useState, useCallback } from "react";

const API_PATH       = "/api/sector";
const CHUNK          = 15;    // symbols per request (quota-safe)
const INTER_CHUNK_MS = 500;   // gap between chunk requests

// ── GICS industry → app sector ID(s) ──────────────────────────────────────
// Source: Yahoo Finance assetProfile.industry strings → our custom sector IDs.
// One industry can map to multiple sectors (e.g. cable → media + tel).
const GICS_MAP = {
  // Video Games / Interactive
  "Electronic Gaming & Multimedia":             ["vg"],
  "Interactive Home Entertainment":             ["vg"],
  // Media / Streaming
  "Interactive Media & Services":               ["media", "sft"],
  "Entertainment":                              ["media"],
  "Broadcasting":                               ["media"],
  "Publishing":                                 ["media"],
  // Telecom
  "Cable & Satellite":                          ["media", "tel"],
  "Wireless Telecommunication Services":        ["tel"],
  "Telecom Services":                           ["tel"],
  "Diversified Telecommunication Services":     ["tel"],
  "Integrated Telecommunication Services":      ["tel"],
  // Consumer / Retail
  "Internet Retail":                            ["ret", "con"],
  "Broadline Retail":                           ["ret"],
  "Specialty Retail":                           ["ret"],
  "Department Stores":                          ["ret"],
  "Discount Stores":                            ["ret"],
  "Home Improvement Retail":                    ["ret"],
  "Automotive Retail":                          ["ret"],
  "Drug Retail":                                ["rx", "ret"],
  // Food & Beverage
  "Food Products":                              ["food"],
  "Beverages—Non-Alcoholic":                    ["food"],
  "Beverages—Alcoholic":                        ["food"],
  "Beverages":                                  ["food"],
  "Packaged Foods":                             ["food"],
  "Tobacco":                                    ["food"],
  "Restaurants":                                ["food", "con"],
  // Consumer (non-retail)
  "Auto Manufacturers":                         ["con"],
  "Consumer Electronics":                       ["con", "hw"],
  "Apparel Retail":                             ["con", "ret"],
  "Apparel Manufacturing":                      ["con"],
  "Footwear & Accessories":                     ["con"],
  "Leisure":                                    ["con", "hosp"],
  "Travel Services":                            ["con", "hosp"],
  // Hospitality
  "Hotels, Resorts & Cruise Lines":             ["hosp", "hotels"],
  "Lodging":                                    ["hotels"],
  "Casinos & Gaming":                           ["hosp"],
  // Airlines
  "Airlines":                                   ["air"],
  "Regional Airlines":                          ["air"],
  // Defense / Aerospace
  "Aerospace & Defense":                        ["def", "avia"],
  "Defense":                                    ["def"],
  // Energy
  "Oil & Gas Integrated":                       ["eng"],
  "Oil & Gas E&P":                              ["eng"],
  "Oil & Gas Refining & Marketing":             ["eng"],
  "Oil & Gas Equipment & Services":             ["eng"],
  "Oil, Gas & Consumable Fuels":                ["eng"],
  "Energy Equipment & Services":                ["eng"],
  // Utilities
  "Utilities—Regulated Electric":               ["util"],
  "Utilities—Diversified":                      ["util"],
  "Utilities—Renewable":                        ["util"],
  "Electric Utilities":                         ["util"],
  "Multi-Utilities":                            ["util"],
  "Independent Power Producers & Energy Traders":["util"],
  // Data Centers / REIT
  "REIT—Specialty":                             ["dc", "reit"],
  "REIT—Industrial":                            ["reit"],
  "REIT—Retail":                                ["reit"],
  "REIT—Residential":                           ["reit"],
  "REIT—Office":                                ["reit"],
  "REIT—Healthcare Facilities":                 ["reit"],
  "REIT—Diversified":                           ["reit"],
  "Real Estate Services":                       ["reit"],
  // Finance
  "Banks—Diversified":                          ["fin"],
  "Banks—Regional":                             ["fin"],
  "Financial Data & Stock Exchanges":           ["fin", "fin2"],
  "Asset Management":                           ["fin"],
  "Capital Markets":                            ["fin", "fin2"],
  "Investment Banking & Investment Services":   ["fin"],
  "Credit Services":                            ["fin2"],
  "Financial Conglomerates":                    ["fin"],
  // FinTech
  "Software—Infrastructure":                   ["sft", "fin2"],
  "Electronic Payments":                        ["fin2"],
  // Insurance
  "Insurance—Diversified":                      ["ins"],
  "Insurance—Life":                             ["ins"],
  "Insurance—Property & Casualty":              ["ins"],
  "Insurance—Reinsurance":                      ["ins"],
  // Healthcare
  "Drug Manufacturers—General":                 ["pharma"],
  "Drug Manufacturers—Specialty & Generic":     ["pharma"],
  "Pharmaceuticals":                            ["pharma"],
  "Biotechnology":                              ["bio"],
  "Medical Devices":                            ["bio"],
  "Medical Instruments & Supplies":             ["bio"],
  "Diagnostics & Research":                     ["bio"],
  "Healthcare Plans":                           ["hcsv"],
  "Health Care Providers & Services":           ["hcsv"],
  "Medical Distribution":                       ["rx"],
  "Pharmaceutical Retailers":                   ["rx"],
  // Semiconductors / Hardware
  "Semiconductors":                             ["sem"],
  "Semiconductor Equipment & Materials":        ["sem"],
  "Semiconductors & Semiconductor Equipment":   ["sem"],
  "Technology Hardware, Storage & Peripherals": ["hw"],
  "Computer Hardware":                          ["hw"],
  "Electronic Components":                      ["hw"],
  "Communications Equipment":                   ["hw"],
  "Network Hardware":                           ["hw"],
  // Software
  "Software—Application":                       ["sft"],
  "Software":                                   ["sft"],
  "Information Technology Services":            ["sft"],
  "IT Services":                                ["sft"],
  "Internet Software & Services":               ["sft"],
  "Data Storage":                               ["hw", "dc"],
  // Materials
  "Gold":                                       ["mat"],
  "Silver":                                     ["mat"],
  "Copper":                                     ["mat"],
  "Steel":                                      ["mat"],
  "Aluminum":                                   ["mat"],
  "Other Precious Metals & Mining":             ["mat"],
  "Specialty Mining & Metals":                  ["mat"],
  "Metals & Mining":                            ["mat"],
  // Chemicals
  "Chemicals":                                  ["chem", "mat"],
  "Specialty Chemicals":                        ["chem"],
  "Agricultural Inputs":                        ["agri", "chem"],
  // Agriculture
  "Farm Products":                              ["agri"],
  "Agricultural Products":                      ["agri"],
  "Agricultural & Farm Machinery":              ["agri", "ind"],
  // Industrials
  "Industrial Conglomerates":                   ["ind"],
  "Specialty Industrial Machinery":             ["ind"],
  "Electrical Equipment & Parts":               ["ind"],
  "Staffing & Employment Services":             ["sft", "ind"],
  "Rental & Leasing Services":                  ["ind"],
  "Security & Protection Services":             ["ind"],
  "Waste Management":                           ["ind"],
  // Transport
  "Air Freight & Logistics":                    ["trns"],
  "Trucking":                                   ["trns"],
  "Railroads":                                  ["trns"],
  "Shipping & Ports":                           ["trns"],
  "Marine Shipping":                            ["trns"],
  "Integrated Freight & Logistics":             ["trns"],
  // Construction / Real Estate
  "Residential Construction":                   ["hmb"],
  "Engineering & Construction":                 ["cnst"],
  "Construction & Engineering":                 ["cnst"],
  "Building Materials":                         ["cnst", "mat"],
};

/** Pause for `ms` milliseconds */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * @param {string[]} allTickers     — all ticker symbols tracked (Object.keys(BASE_NODES))
 * @param {object[]} sectorGroups   — SECTOR_GROUPS array
 */
export function useSectorClassification(allTickers, sectorGroups) {
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);
  const [classifications, setClassifications] = useState(null); // Map<ticker, {sector,industry}>
  const [suggestions,     setSuggestions]     = useState(null); // [{ticker,current,suggested,...}]
  const [auditedAt,       setAuditedAt]       = useState(null);

  const runAudit = useCallback(async () => {
    if (!allTickers?.length) return;
    setLoading(true);
    setError(null);

    const merged = {};

    try {
      for (let i = 0; i < allTickers.length; i += CHUNK) {
        const chunk = allTickers.slice(i, i + CHUNK);
        try {
          const r = await fetch(`${API_PATH}?symbols=${chunk.join(",")}`);
          if (r.ok) Object.assign(merged, await r.json());
        } catch (e) {
          console.warn("[useSectorClassification] chunk failed:", e.message);
        }
        if (i + CHUNK < allTickers.length) await sleep(INTER_CHUNK_MS);
      }

      // Build ticker → current app sector IDs map
      const tickerToAppSectors = {};
      for (const sg of sectorGroups) {
        for (const t of sg.tickers) {
          (tickerToAppSectors[t] = tickerToAppSectors[t] || []).push(sg.id);
        }
      }

      const classMap = new Map(Object.entries(merged));
      const suggs    = [];

      for (const [ticker, { sector, industry }] of classMap.entries()) {
        const suggested = GICS_MAP[industry] ?? [];
        const current   = tickerToAppSectors[ticker] ?? [];
        const hasOverlap     = suggested.some(s => current.includes(s));
        const isUnclassified = current.length === 0;
        const isMismatch     = suggested.length > 0 && !hasOverlap;

        if (isUnclassified || isMismatch) {
          suggs.push({
            ticker,
            current,
            suggested,
            yahooSector: sector,
            industry:    industry ?? "—",
            type:        isUnclassified ? "unclassified" : "mismatch",
          });
        }
      }

      // Sort: mismatches first, alpha within each type
      suggs.sort((a, b) => {
        if (a.type !== b.type) return a.type === "mismatch" ? -1 : 1;
        return a.ticker.localeCompare(b.ticker);
      });

      setClassifications(classMap);
      setSuggestions(suggs);
      setAuditedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [allTickers, sectorGroups]);

  return { loading, error, classifications, suggestions, auditedAt, runAudit };
}
