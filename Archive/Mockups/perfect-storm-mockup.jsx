import { useState, useRef, useEffect, useCallback } from "react";

/* ─── STORM SCORE ENGINE ─────────────────────────────────────────────────── */
// Mirrors real scoring logic: category diversity rewards signal convergence
const PILL_WEIGHT = { active: 1.0, emerging: 0.6, fading: 0.25 };

function calcStormScores(pills) {
  const scoreOneSide = (ps) => {
    if (!ps.length) return 0;
    const uniqueCats = new Set(ps.map(p => p.cat)).size;
    const diversityMult = 1 + (uniqueCats - 1) * 0.28;
    const base = ps.reduce((s, p) => s + (PILL_WEIGHT[p.state] ?? 0.5), 0);
    return Math.min(100, Math.round(base * diversityMult * 16));
  };
  const riskScore = scoreOneSide(pills.filter(p => p.dir === "risk"));
  const oppScore  = scoreOneSide(pills.filter(p => p.dir === "opp"));
  // Tension premium: concurrent storms on both sides score higher
  const tensionBonus = (riskScore > 25 && oppScore > 25)
    ? Math.round(Math.min(riskScore, oppScore) * 0.2) : 0;
  return { riskScore, oppScore, stormScore: riskScore + oppScore + tensionBonus };
}

/* ─── MOCK DATA — grounded in real March 2026 signals ───────────────────── */
const RAW_STOCKS = [

  // ── OPPORTUNITY STORMS ──────────────────────────────────────────────────

  {
    ticker:"RTX", name:"RTX Corporation", price:"$212.68", change:"+4.22%", pos:true,
    sector:"Defense",
    pills:[
      {dir:"opp", cat:"GPOL", label:"GPOL: Iran Conflict Munitions Burn", state:"active"},
      {dir:"opp", cat:"POL",  label:"Policy: NATO Rearm $268B Backlog",   state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Patriot/LTAMDS EU Orders",   state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Stockpile Replenishment",    state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Supply Chain Bottleneck",     state:"emerging"},
    ],
    headlines:[
      "White House summons defense CEOs — munitions burned in 100hrs of Iran strikes exceed 6-month production",
      "Germany, Poland, Romania fast-tracking Patriot orders; RTX backlog hits record $268B",
      "RTX shares at all-time high $212.68 — geopolitical hedge thesis fully repriced by market",
    ]
  },
  {
    ticker:"XOM", name:"ExxonMobil Corp.", price:"$167.34", change:"+3.91%", pos:true,
    sector:"Energy",
    pills:[
      {dir:"opp", cat:"GPOL", label:"GPOL: Iran Strait Conflict",         state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Permian+Guyana ATH",        state:"active"},
      {dir:"opp", cat:"MACRO",label:"Macro: Bits→Atoms Rotation",        state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: Canada/Mexico Tariff Risk",  state:"emerging"},
    ],
    headlines:[
      "Brent hits $83 on Iran strait fears — XOM all-time high $167.34, up 27% YTD",
      "Guyana output tops 900k bpd — lowest-cost barrels in portfolio lifting margins sharply",
      "Investors rotate from tech to energy as geopolitical hedge — XOM leads sector inflows",
    ]
  },
  {
    ticker:"LMT", name:"Lockheed Martin", price:"$541.20", change:"+2.87%", pos:true,
    sector:"Defense",
    pills:[
      {dir:"opp", cat:"GPOL", label:"GPOL: F-35 NATO Orders Surge",       state:"active"},
      {dir:"opp", cat:"POL",  label:"Policy: US Defense Budget +$50B",   state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: Missile Defense Shield Demand",state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: DOGE Procurement Scrutiny", state:"emerging"},
    ],
    headlines:[
      "NATO allies activate F-35 orders — Lockheed booking rate highest since Cold War II era",
      "US defense supplemental $50B fast-tracked — LMT PAC-3 Patriot interceptors lead allocation",
      "DOGE reviewing Pentagon contracts; LMT lobbying intensifies on Capitol Hill",
    ]
  },
  {
    ticker:"NVDA", name:"NVIDIA Corporation", price:"$875.50", change:"+1.44%", pos:true,
    sector:"Semiconductors",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: $78B Q1 FY27 Guidance",     state:"active"},
      {dir:"opp", cat:"GEO",  label:"Geo: ByteDance $14B China Spend",   state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: H200 China Sales Approved",   state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Core Export Controls Remain", state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: RSI 37 Oversold Pressure",   state:"fading"},
    ],
    headlines:[
      "NVDA Q1 FY27 guidance $78B — massive beat; ByteDance commits $14B to H100 cluster build",
      "Trump approves H200 GPU sales to Chinese customers — near-term China revenue unlocked",
      "Core export controls persist despite sweep rule withdrawal — RSI at oversold 37.39",
    ]
  },
  {
    ticker:"GS", name:"Goldman Sachs", price:"$588.14", change:"+1.12%", pos:true,
    sector:"Finance",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: M&A Pipeline Recovering",   state:"active"},
      {dir:"opp", cat:"RATE", label:"Rate: NIM at 3.5% Expansion",       state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Private Credit Demand",     state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Consumer Credit Default Up", state:"emerging"},
      {dir:"risk",cat:"POL",  label:"Policy: Tariff Macro Drag",         state:"fading"},
    ],
    headlines:[
      "Goldman M&A advisory pipeline strongest since 2021 — PE dry powder deploying into lower rates",
      "GS net interest margin expands to 3.5% — Fed pause extending NIM runway through H2 2026",
      "Consumer default rates ticking up — Goldman raising credit loss reserves on card portfolio",
    ]
  },
  {
    ticker:"AMD", name:"Advanced Micro Devices", price:"$124.38", change:"+0.88%", pos:true,
    sector:"Semiconductors",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: MI300X AI Accelerator",     state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: Sovereign AI Alt-Sourcing",   state:"emerging"},
      {dir:"risk",cat:"GPOL", label:"GPOL: China Export Risk Mirror",    state:"active"},
      {dir:"risk",cat:"SECT", label:"Sector: NVDA 80%+ GPU Share",       state:"active"},
    ],
    headlines:[
      "AMD MI300X winning slots in Microsoft and Meta inference clusters — share gain materializing",
      "Sovereign AI programs hedging NVDA dependency — AMD gaining early pipeline positioning",
      "Export control risk mirrors NVDA exposure; AMD China revenue ~10% vs NVDA's ~18%",
    ]
  },

  // ── RISK STORMS ─────────────────────────────────────────────────────────

  {
    ticker:"TSLA", name:"Tesla Inc.", price:"$383.03", change:"-2.14%", pos:false,
    sector:"EV / Energy",
    pills:[
      {dir:"risk",cat:"SECT", label:"Brand: Musk DOGE Blowback",         state:"active"},
      {dir:"risk",cat:"GEO",  label:"Geo: EU Sales -45% YoY",            state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: 130× PE, 1% Rev Growth",     state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Megapack Revenue 2×",       state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Robotaxi TX/AZ H2 2026",    state:"emerging"},
    ],
    headlines:[
      "Tesla EU sales -45% YoY in Jan — anti-Musk protests at showrooms across Germany and France",
      "Megapack now 12% of Tesla revenue, doubled YoY — energy storage emerging as standalone thesis",
      "TSLA at 130× trailing earnings on 1% revenue growth — Ark models $8-12/share robotaxi by 2028",
    ]
  },
  {
    ticker:"DAL", name:"Delta Air Lines", price:"$42.10", change:"-0.82%", pos:false,
    sector:"Airlines",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: $400M Q1 Fuel Surge",        state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: AmEx Rate Cap Threat",      state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Iran→Unhedged Fuel Spike",    state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Premium Travel Demand",     state:"active"},
    ],
    headlines:[
      "Delta expects $400M Q1 fuel headwind — Citi cuts PT $87→$77; US airlines largely unhedged",
      "Proposed 10% credit card rate cap directly threatens Delta's $8.2B AmEx remuneration engine",
      "Premium cabin and loyalty revenue holding firm — partial offset to converging risk signals",
    ]
  },
  {
    ticker:"UNH", name:"UnitedHealth Group", price:"$287.44", change:"-1.89%", pos:false,
    sector:"Health Insurance",
    pills:[
      {dir:"risk",cat:"SECT", label:"Sector: Medical Cost Inflation",    state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: DOJ Antitrust Probe",       state:"active"},
      {dir:"risk",cat:"EARN", label:"Earnings: Q1 Estimates Cut",        state:"active"},
      {dir:"opp", cat:"MACRO",label:"Macro: Aging Population Demand",    state:"active"},
      {dir:"opp", cat:"EARN", label:"Earnings: 16× Fwd PE Discount",     state:"emerging"},
    ],
    headlines:[
      "UNH -18% YTD as medical expense gap widens — Zacks cuts Q1 estimates, stock below all MAs",
      "DOJ antitrust probe into Optum/insurance synergy creating persistent headline overhang",
      "At 16× forward PE vs 5yr avg 22×, analysts flag structural value building on demographic tailwind",
    ]
  },
  {
    ticker:"MSFT", name:"Microsoft Corp.", price:"$373.61", change:"-1.43%", pos:false,
    sector:"Cloud / AI",
    pills:[
      {dir:"risk",cat:"SECT", label:"Sector: Copilot 3.3% Penetration",  state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: CapEx $37.5B Margin Squeeze", state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: EU AI Act Fines Exposure",   state:"emerging"},
      {dir:"opp", cat:"SECT", label:"Sector: Azure +38% Cloud Growth",    state:"active"},
    ],
    headlines:[
      "MSFT down 21% YTD — worst Mag-7 performer; Copilot reorg flagged as 'red flag' by Melius",
      "Only 15M of 450M Office users on paid Copilot — 3.3% penetration after billions in spend",
      "Azure cloud tops $50B ARR — AI infrastructure demand robust despite Copilot adoption miss",
    ]
  },
  {
    ticker:"AAL", name:"American Airlines", price:"$11.42", change:"-1.55%", pos:false,
    sector:"Airlines",
    pills:[
      {dir:"risk",cat:"GPOL", label:"GPOL: Iran Fuel Spike Unhedged",    state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Debt/Equity 11.2× Worst",    state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: TSA Staffing Delays",       state:"active"},
      {dir:"risk",cat:"EARN", label:"Earnings: Guidance Miss Risk",      state:"emerging"},
    ],
    headlines:[
      "AAL debt/equity hits 11.2× — worst among US majors; fuel spike compounds leverage risk",
      "TSA data shows AAL hubs among hardest hit by ongoing staffing shortfalls",
      "Analysts flag AAL guidance miss probability above 60% given converging cost headwinds",
    ]
  },
  {
    ticker:"AAPL", name:"Apple Inc.", price:"$213.18", change:"-4.01%", pos:false,
    sector:"Consumer Tech",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: Tariffs +$900M Q2 Cost",     state:"active"},
      {dir:"risk",cat:"GEO",  label:"Geo: China Brand Erosion -14%",     state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Apple Intelligence 62%",    state:"active"},
      {dir:"opp", cat:"EARN", label:"Earnings: Services ARR Growth",     state:"active"},
    ],
    headlines:[
      "Apple -4% on tariff fears — CEO Cook: $900M+ Q2 cost hit, no clean path on pricing",
      "China iPhone shipments -14% YoY; Huawei Mate reclaims premium on nationalism tailwind",
      "Apple Intelligence on 62% of iPhone 16 fleet — services ARR partially offsets hardware drag",
    ]
  },

  // ── CALM / LOW SIGNAL ───────────────────────────────────────────────────

  {
    ticker:"ED", name:"Consolidated Edison", price:"$95.20", change:"+0.31%", pos:true,
    sector:"Utilities",
    pills:[
      {dir:"risk",cat:"RATE", label:"Rate: Utility Rate Sensitivity",    state:"fading"},
    ],
    headlines:[
      "ConEd Q4 in line — grid hardening capex on track; no material near-term storm signals",
    ]
  },
  {
    ticker:"MCD", name:"McDonald's Corp.", price:"$296.50", change:"+0.18%", pos:true,
    sector:"Consumer Staples",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: Consumer Trade-Down Slowing",state:"fading"},
      {dir:"opp", cat:"SECT", label:"Sector: Value Menu Resilience",     state:"fading"},
    ],
    headlines:[
      "McDonald's comparable sales flat — value menu holding traffic but no growth catalyst visible",
      "Consumer spending environment stabilizing; no near-term storm signal identified",
    ]
  },
  {
    ticker:"PG", name:"Procter & Gamble", price:"$163.74", change:"+0.09%", pos:true,
    sector:"Consumer Staples",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: Input Cost Tariff Creep",    state:"fading"},
    ],
    headlines:[
      "P&G pricing power intact amid mild tariff input cost pressure — no convergent risk signal",
      "Defensive positioning in current environment; dividend yield holding institutional flows",
    ]
  },
];

// Compute scores from pills — this is how the real system would work
const STOCKS = RAW_STOCKS.map(s => ({ ...s, ...calcStormScores(s.pills) }));

/* ── NATION DATA ──────────────────────────────────────────────────────────── */
const NATIONS = [
  {
    code:"CH", name:"Switzerland", flag:"🇨🇭",
    riskScore:18, oppScore:44,
    tags:[
      {dir:"opp", label:"Finance: Crypto/DeFi Hub",      state:"active"},
      {dir:"opp", label:"Sector: Pharma Expansion",      state:"active"},
      {dir:"risk",label:"Macro: CHF Overvaluation",      state:"fading"},
      {dir:"risk",label:"Policy: EU Digital Markets Act", state:"emerging"},
    ],
    note:"Geopolitically neutral. Primary exposure via software/work transformation and pharma sector shifts. Watch: Roche, Novartis, UBS.",
    relatedTickers:["NVS","ROG","UBSG"]
  },
  {
    code:"TW", name:"Taiwan", flag:"🇹🇼",
    riskScore:82, oppScore:61,
    tags:[
      {dir:"risk",label:"Geopolitical: PRC Military Pressure",state:"active"},
      {dir:"risk",label:"Geo: Strait Shipping Disruption",   state:"active"},
      {dir:"opp", label:"Sector: AI Chip Dominance (TSMC)", state:"active"},
      {dir:"opp", label:"Sector: Sovereign AI Contracts",   state:"active"},
    ],
    note:"Highest geopolitical risk in the dataset. Concurrent opportunity via TSMC's AI dominance. Classic Perfect Storm of concurrent risk and opportunity.",
    relatedTickers:["TSM","NVDA","AAPL","AMD"]
  },
  {
    code:"DE", name:"Germany", flag:"🇩🇪",
    riskScore:54, oppScore:32,
    tags:[
      {dir:"risk",label:"Macro: Industrial Contraction",    state:"active"},
      {dir:"risk",label:"Energy: Fossil Transition Cost",   state:"active"},
      {dir:"risk",label:"Geo: Russia Energy Dependency",    state:"fading"},
      {dir:"opp", label:"Policy: Green Infra Investment",   state:"emerging"},
    ],
    note:"Manufacturing sector under sustained pressure. Auto sector exposed to EV transition and China competition. Green infrastructure investment emerging as partial offset.",
    relatedTickers:["VOW","BMW","SIE","BASF"]
  },
  {
    code:"SA", name:"Saudi Arabia", flag:"🇸🇦",
    riskScore:35, oppScore:68,
    tags:[
      {dir:"opp", label:"Policy: Vision 2030 Capex Wave",   state:"active"},
      {dir:"opp", label:"Sector: Sovereign AI Buildout",    state:"active"},
      {dir:"opp", label:"Macro: Oil Revenue Windfall",      state:"active"},
      {dir:"risk",label:"Geopolitical: Iran Proxy Risk",    state:"emerging"},
    ],
    note:"Major opportunity node — Vision 2030 and sovereign AI investments creating significant capex flows. Geopolitical risk remains latent via Iran proxy dynamics.",
    relatedTickers:["ARAMCO","NVDA","MSFT"]
  },
  {
    code:"US", name:"United States", flag:"🇺🇸",
    riskScore:48, oppScore:74,
    tags:[
      {dir:"opp", label:"Sector: AI Infrastructure",       state:"active"},
      {dir:"opp", label:"Macro: Labor Market Resilience",  state:"active"},
      {dir:"risk",label:"Policy: Tariff / Trade War Risk", state:"active"},
      {dir:"risk",label:"Rate: Fed Policy Uncertainty",    state:"fading"},
    ],
    note:"Dominant AI opportunity narrative. Tariff and fiscal policy risk increasing. Rate environment stabilizing. Net: opportunity convergence with embedded policy risk.",
    relatedTickers:["NVDA","MSFT","AAPL","SPY"]
  },
  {
    code:"CN", name:"China", flag:"🇨🇳",
    riskScore:71, oppScore:38,
    tags:[
      {dir:"risk",label:"Geopolitical: US Export Controls", state:"active"},
      {dir:"risk",label:"Macro: Property Sector Drag",      state:"active"},
      {dir:"risk",label:"Policy: Regulatory Crackdown",     state:"fading"},
      {dir:"opp", label:"Sector: Domestic AI Champions",   state:"emerging"},
    ],
    note:"Significant risk convergence from multiple vectors. Domestic AI investment (Baidu, Alibaba, DeepSeek) providing partial opportunity offset. Not a net positive environment.",
    relatedTickers:["BABA","BIDU","JD","TCEHY"]
  },
];

/* ── STORM VIEW CLUSTERS ──────────────────────────────────────────────────── */
const CLUSTERS = [
  {
    id:"geo", label:"⚔ Geopolitical: Iran / Fuel", color:"#EF4444",
    cx:280, cy:200, rx:220, ry:130,
    tickers:["DAL","AAL","LH","FDX"],
  },
  {
    id:"pol", label:"⚠ Policy: TSA Funding Cuts", color:"#F97316",
    cx:490, cy:200, rx:210, ry:130,
    tickers:["DAL","AAL","UAL","SWA"],
  },
  {
    id:"ai", label:"✦ Sector: AI Infra Opportunity", color:"#22C55E",
    cx:680, cy:340, rx:200, ry:120,
    tickers:["NVDA","MSFT","AAPL","AMD"],
  },
  {
    id:"china", label:"⚠ Geo: China Export Risk", color:"#EF4444",
    cx:850, cy:200, rx:180, ry:120,
    tickers:["NVDA","AAPL","AMD"],
  },
];

/* ── COLORS ───────────────────────────────────────────────────────────────── */
const C = {
  bg:       "#0B1426",
  bgCard:   "#0F1D35",
  bgCard2:  "#132240",
  border:   "#1E3A5F",
  border2:  "#243F6A",
  navLeft:  "#0D1F38",
  navRight: "#091628",
  accent:   "#0EA5E9",
  risk:     "#EF4444",
  opp:      "#22C55E",
  warn:     "#F59E0B",
  text:     "#FFFFFF",
  textMid:  "#CBD5E1",
  textDim:  "#8899AA",
  mono:     "'IBM Plex Mono', monospace",
  sans:     "'IBM Plex Sans', sans-serif",
  inst:     "'Instrument Sans', sans-serif",
};

/* ── WAVE CANVAS ──────────────────────────────────────────────────────────── */
function WaveBar({ riskScore, oppScore }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const phaseRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const calm = riskScore < 15 && oppScore < 15;
    const rDom = riskScore >= oppScore;
    const intensity = Math.max(riskScore, oppScore) / 100;
    const amp = calm ? 1.2 : 3 + intensity * 13;
    const freq = 0.018 + intensity * 0.008;
    const speed = calm ? 0.003 : 0.012 + intensity * 0.018;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      phaseRef.current += speed;
      const phase = phaseRef.current;

      if (calm) {
        ctx.beginPath();
        for (let x = 0; x <= W; x++) {
          const y = H * 0.55 + amp * Math.sin(x * 0.04 + phase);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "#2D4A6A";
        ctx.lineWidth = 1;
        ctx.stroke();
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const primCol = rDom ? C.risk : C.opp;
      const secScore = rDom ? oppScore : riskScore;
      const secCol  = rDom ? C.opp : C.risk;

      // filled area
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x++) {
        const y = H * 0.5 + amp * Math.sin(x * freq * Math.PI * 2 + phase) - amp * 0.15;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, primCol + "55");
      gr.addColorStop(1, primCol + "08");
      ctx.fillStyle = gr;
      ctx.fill();

      // primary wave line
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const y = H * 0.5 + amp * Math.sin(x * freq * Math.PI * 2 + phase) - amp * 0.15;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = primCol + "BB";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // secondary wave if significant
      if (secScore > 22) {
        const sAmp = (secScore / 100) * 5;
        ctx.beginPath();
        for (let x = 0; x <= W; x++) {
          const y = H * 0.65 + sAmp * Math.sin(x * freq * Math.PI * 2 * 1.4 + phase * 0.8 + Math.PI * 0.6);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = secCol + "60";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [riskScore, oppScore]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={40}
      style={{ width: "100%", height: 40, display: "block" }}
    />
  );
}

/* ── PILL ──────────────────────────────────────────────────────────────────── */
function Pill({ dir, cat, label, state, compact }) {
  const isRisk = dir === "risk";
  const col = isRisk ? C.risk : C.opp;
  const bg  = isRisk ? "#3B0A0A" : "#052e16";
  const opacity = state === "fading" ? 0.55 : state === "emerging" ? 0.75 : 1;

  if (compact) {
    const short = label.split(":")[1]?.trim().slice(0, 18) || label.slice(0, 18);
    return (
      <span style={{
        display:"inline-flex", alignItems:"center", gap:3,
        padding:"2px 7px", fontSize:9, fontFamily:C.mono,
        fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase",
        background: bg, color: col, opacity,
        border: `1px solid ${col}44`,
        flexShrink: 0,
      }}>
        {isRisk ? "!" : "+"} {short}
        {state === "emerging" && <span style={{fontSize:7,opacity:.7}}>◌</span>}
        {state === "fading"   && <span style={{fontSize:7,opacity:.7}}>↓</span>}
      </span>
    );
  }

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"4px 10px", fontSize:10, fontFamily:C.mono,
      fontWeight:500, letterSpacing:"0.05em",
      background: bg, color: col, opacity,
      border: `1px solid ${col}33`,
      flexShrink: 0,
    }}>
      <span style={{fontSize:9, fontWeight:700}}>{isRisk ? "⚠" : "✦"}</span>
      <span style={{color: "#94A3B8", fontSize:9, marginRight:1}}>{cat}</span>
      <span>{label}</span>
      {state === "emerging" && <span style={{fontSize:9, marginLeft:4, opacity:.7}}>◌ EMERGING</span>}
      {state === "fading"   && <span style={{fontSize:9, marginLeft:4, opacity:.7}}>↓ FADING</span>}
    </div>
  );
}

/* ── SCORE BAR ────────────────────────────────────────────────────────────── */
function ScoreBar({ score, color, label }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:8}}>
      <span style={{fontSize:9, fontFamily:C.mono, color:"#94A3B8", width:28, textAlign:"right", letterSpacing:"0.08em"}}>{label}</span>
      <div style={{flex:1, height:3, background:"#1E3A5F", position:"relative"}}>
        <div style={{
          position:"absolute", left:0, top:0, bottom:0,
          width:`${score}%`, background:color,
          transition:"width 0.6s ease",
        }} />
      </div>
      <span style={{fontSize:10, fontFamily:C.mono, color, fontWeight:600, width:24}}>{score}</span>
    </div>
  );
}

/* ── STOCK CARD ────────────────────────────────────────────────────────────── */
function StockCard({ stock, expanded, onToggle }) {
  const prevailing = stock.pills.filter(p => p.state === "active").slice(0, 2);
  const rDom = stock.riskScore >= stock.oppScore;
  const stormLabel = (() => {
    const diff = Math.abs(stock.riskScore - stock.oppScore);
    if (stock.riskScore < 20 && stock.oppScore < 20) return { text: "CALM", col: C.textDim };
    if (diff < 15) return { text: "TENSION", col: C.warn };
    return rDom
      ? { text: `RISK ×${stock.pills.filter(p=>p.dir==="risk").length}`, col: C.risk }
      : { text: `OPP ×${stock.pills.filter(p=>p.dir==="opp").length}`,   col: C.opp };
  })();

  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      marginBottom: 8,
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* TOPBAR */}
      <div
        onClick={onToggle}
        style={{
          display:"flex", flexDirection:"column",
          cursor:"pointer",
          background: expanded ? C.bgCard2 : C.bgCard,
          borderBottom: expanded ? `1px solid ${C.border}` : "none",
          transition:"background .18s",
          userSelect:"none",
        }}
      >
        {/* Title row */}
        <div style={{
          height:36, display:"flex", alignItems:"center",
          padding:"0 12px 0 0", gap:8,
        }}>
          {/* chevron */}
          <div style={{
            width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline
                points={expanded ? "2,3.5 5,6.5 8,3.5" : "3.5,2 6.5,5 3.5,8"}
                stroke="#8899AA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* ticker + name */}
          <span style={{fontFamily:C.inst, fontSize:13, fontWeight:700, color:"#FFFFFF", letterSpacing:"-0.01em"}}>
            {stock.ticker}
          </span>
          <span style={{fontFamily:C.sans, fontSize:11, color:"#CBD5E1", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
            {stock.name}
          </span>

          {/* price */}
          <div style={{textAlign:"right", flexShrink:0}}>
            <div style={{fontFamily:C.mono, fontSize:11, color:"#FFFFFF", fontWeight:500}}>{stock.price}</div>
            <div style={{fontFamily:C.mono, fontSize:9, color: stock.pos ? C.opp : C.risk, letterSpacing:"0.05em"}}>
              {stock.change}
            </div>
          </div>
        </div>

        {/* Pill row — collapsed only */}
        {!expanded && prevailing.length > 0 && (
          <div style={{
            display:"flex", gap:4, flexWrap:"wrap",
            padding:"0 12px 8px 36px",
          }}>
            {prevailing.map((p, i) => <Pill key={i} {...p} compact />)}
          </div>
        )}
      </div>

      {/* WAVE — always visible */}
      <WaveBar riskScore={stock.riskScore} oppScore={stock.oppScore} />

      {/* EXPANDED CONTENT */}
      {expanded && (
        <div style={{padding:"12px 14px 14px", borderTop:`1px solid ${C.border}`}}>

          {/* storm status */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:10,
          }}>
            <span style={{
              fontFamily:C.mono, fontSize:9, letterSpacing:"0.14em", fontWeight:700,
              color: stormLabel.col,
            }}>
              {stormLabel.text}
            </span>
            <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.06em"}}>
              {stock.sector}
            </span>
          </div>

          {/* scores */}
          <div style={{display:"flex", flexDirection:"column", gap:5, marginBottom:12}}>
            <ScoreBar score={stock.riskScore} color={C.risk}  label="RISK" />
            <ScoreBar score={stock.oppScore}  color={C.opp}   label="OPP" />
          </div>

          {/* all pills */}
          <div style={{display:"flex", flexDirection:"column", gap:4, marginBottom:12}}>
            {stock.pills.map((p, i) => <Pill key={i} {...p} />)}
          </div>

          {/* divider */}
          <div style={{height:1, background:C.border, marginBottom:10}} />

          {/* headlines */}
          <div style={{display:"flex", flexDirection:"column", gap:6}}>
            {stock.headlines.map((h, i) => (
              <div key={i} style={{display:"flex", gap:8, alignItems:"flex-start"}}>
                <span style={{color:C.textDim, fontFamily:C.mono, fontSize:9, marginTop:2, flexShrink:0}}>→</span>
                <span style={{fontFamily:C.sans, fontSize:11, color:C.textMid, lineHeight:1.5}}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── CARDS VIEW ────────────────────────────────────────────────────────────── */
function CardsView() {
  const [expanded, setExpanded] = useState(new Set(["DAL"]));
  const [sort, setSort]         = useState("storm");
  const [filter, setFilter]     = useState("all");

  const toggle = (t) => setExpanded(p => {
    const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n;
  });

  const sorted = [...STOCKS]
    .filter(s => filter === "all" || (filter === "risk" && s.riskScore > 40) || (filter === "opp" && s.oppScore > 40) || (filter === "calm" && s.riskScore < 20 && s.oppScore < 20))
    .sort((a, b) =>
      sort === "storm"    ? b.stormScore - a.stormScore :
      sort === "risk"     ? b.riskScore  - a.riskScore  :
      sort === "opp"      ? b.oppScore   - a.oppScore   :
      b.stormScore - a.stormScore
    );

  const btnStyle = (active) => ({
    fontFamily: C.mono, fontSize: 9, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "4px 10px", border: `1px solid ${active ? C.accent : C.border2}`,
    background: active ? C.accent + "22" : "transparent",
    color: active ? C.accent : "#94A3B8", cursor: "pointer",
  });

  return (
    <div style={{flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>
      {/* Controls bar */}
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"8px 16px",
        background:C.navLeft, borderBottom:`1px solid ${C.border}`,
        flexShrink:0,
      }}>
        <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>SORT</span>
        {[["storm","STORM"],["risk","RISK SCORE"],["opp","OPP SCORE"]].map(([k,v]) => (
          <button key={k} onClick={() => setSort(k)} style={btnStyle(sort===k)}>{v}</button>
        ))}
        <div style={{width:1, height:16, background:C.border, margin:"0 4px"}} />
        <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>FILTER</span>
        {[["all","ALL"],["risk","RISK STORMS"],["opp","OPP STORMS"],["calm","CALM"]].map(([k,v]) => (
          <button key={k} onClick={() => setFilter(k)} style={btnStyle(filter===k)}>{v}</button>
        ))}
        <span style={{marginLeft:"auto", fontFamily:C.mono, fontSize:9, color:C.textDim}}>
          {sorted.length} stocks · 15min refresh
        </span>
      </div>

      {/* Card grid */}
      <div style={{flex:1, overflowY:"auto", padding:"12px 16px"}}>
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))",
          gap:0, alignItems:"start",
        }}>
          {sorted.map(s => (
            <div key={s.ticker} style={{padding:"0 6px 0 0"}}>
              <StockCard
                stock={s}
                expanded={expanded.has(s.ticker)}
                onToggle={() => toggle(s.ticker)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── STORM VIEW ────────────────────────────────────────────────────────────── */
function StormView() {
  const [selected, setSelected] = useState(null);
  const selectedStock = STOCKS.find(s => s.ticker === selected);

  const svgW = 1000, svgH = 480;

  // Cluster surrounds — real March 2026 signal groups
  const clusters = [
    {id:"iran",   label:"⚔ GPOL: Iran Conflict",    col:"#EF4444", cx:155, cy:200, rx:155, ry:110,
     members:["RTX","LMT","XOM"]},
    {id:"fuel",   label:"⚠ GPOL: Iran Fuel Spike", col:"#F97316", cx:360, cy:220, rx:170, ry:110,
     members:["DAL","AAL","XOM"]},
    {id:"tariff", label:"⚠ MACRO: Tariff Wave",    col:"#EF4444", cx:580, cy:350, rx:165, ry:100,
     members:["AAPL","TSLA","DAL"]},
    {id:"ai",     label:"✦ SECT: AI Opportunity",  col:"#22C55E", cx:760, cy:190, rx:215, ry:120,
     members:["NVDA","MSFT","AMD","GS"]},
    {id:"china",  label:"⚠ GPOL: China Export",   col:"#EF4444", cx:960, cy:230, rx:145, ry:100,
     members:["NVDA","AAPL","AMD"]},
  ];

  // Ticker positions
  const nodes = {
    RTX: {x:90,  y:190},
    LMT: {x:110, y:245},
    XOM: {x:260, y:185},
    DAL: {x:340, y:250},
    AAL: {x:390, y:295},
    TSLA:{x:510, y:350},
    AAPL:{x:620, y:310},
    NVDA:{x:790, y:175},
    MSFT:{x:700, y:230},
    AMD: {x:770, y:280},
    GS:  {x:650, y:185},
  };

  return (
    <div style={{flex:1, display:"flex", overflow:"hidden"}}>
      {/* Canvas */}
      <div style={{flex:1, overflow:"auto", padding:16}}>
        <div style={{
          background:C.bgCard, border:`1px solid ${C.border}`,
          padding:16, marginBottom:8,
        }}>
          <p style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", marginBottom:4}}>
            STORM VIEW — VENN SURROUND MAP
          </p>
          <p style={{fontFamily:C.sans, fontSize:11, color:C.textMid}}>
            Stocks sitting inside overlapping surrounds are in concurrent storms.
            The intersection zone is the perfect storm. Click any ticker to see its full card.
          </p>
        </div>

        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{width:"100%", height:"auto", display:"block"}}
        >
          <defs>
            {clusters.map(c => (
              <radialGradient key={c.id} id={`grad-${c.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={c.col} stopOpacity="0.12" />
                <stop offset="100%" stopColor={c.col} stopOpacity="0.04" />
              </radialGradient>
            ))}
          </defs>

          {/* surround ellipses */}
          {clusters.map(c => (
            <g key={c.id}>
              <ellipse
                cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry}
                fill={`url(#grad-${c.id})`}
                stroke={c.col} strokeWidth={1}
                strokeOpacity={0.5}
                strokeDasharray={c.col === "#22C55E" ? "none" : "none"}
              />
              {/* surround label pill */}
              <rect
                x={c.cx - c.rx + 8} y={c.cy - c.ry - 14}
                width={c.label.length * 7 + 16} height={20}
                fill={c.col + "22"} stroke={c.col + "66"} strokeWidth={1}
                rx={2}
              />
              <text
                x={c.cx - c.rx + 16} y={c.cy - c.ry - 1}
                fontFamily={C.mono} fontSize={10} fill={c.col}
                fontWeight="600" letterSpacing="0.04em"
              >{c.label}</text>
            </g>
          ))}

          {/* Perfect storm annotation — DAL/AAL in Iran fuel + tariff triple hit */}
          <rect x={290} y={148} width={110} height={18} fill="#FF444422" stroke="#FF444466" strokeWidth={1} rx={2}/>
          <text x={299} y={160} fontFamily={C.mono} fontSize={9} fill={C.risk} fontWeight="700" letterSpacing="0.1em">
            PERFECT STORM
          </text>
          <line x1={340} y1={166} x2={360} y2={240} stroke={C.risk} strokeWidth={1} strokeOpacity={0.5}/>

          {/* Defense opp annotation — RTX/LMT Iran windfall */}
          <rect x={58} y={112} width={120} height={18} fill="#22C55E22" stroke="#22C55E66" strokeWidth={1} rx={2}/>
          <text x={66} y={124} fontFamily={C.mono} fontSize={9} fill={C.opp} fontWeight="700" letterSpacing="0.1em">
            OPP CONVERGENCE
          </text>

          {/* AI storm annotation */}
          <rect x={680} y={112} width={126} height={18} fill="#22C55E22" stroke="#22C55E66" strokeWidth={1} rx={2}/>
          <text x={688} y={124} fontFamily={C.mono} fontSize={9} fill={C.opp} fontWeight="700" letterSpacing="0.1em">
            AI OPP CLUSTER
          </text>

          {/* ticker nodes */}
          {Object.entries(nodes).map(([ticker, pos]) => {
            const s = STOCKS.find(s => s.ticker === ticker);
            const col = s ? (s.riskScore >= s.oppScore ? C.risk : C.opp) : C.textDim;
            const isSelected = selected === ticker;
            return (
              <g key={ticker} onClick={() => setSelected(isSelected ? null : ticker)} style={{cursor:"pointer"}}>
                <rect
                  x={pos.x - 22} y={pos.y - 11}
                  width={44} height={22}
                  fill={isSelected ? col + "44" : C.bgCard2}
                  stroke={col}
                  strokeWidth={isSelected ? 1.5 : 1}
                  rx={2}
                />
                <text
                  x={pos.x} y={pos.y + 4}
                  textAnchor="middle"
                  fontFamily={C.inst}
                  fontSize={11} fontWeight="700"
                  fill={col}
                  letterSpacing="-0.02em"
                >{ticker}</text>
              </g>
            );
          })}

          {/* legend */}
          <g transform="translate(20, 430)">
            <text fontFamily={C.mono} fontSize={9} fill={C.textDim} letterSpacing="0.08em">LEGEND</text>
            {[
              {col:C.risk,   label:"Risk surround"},
              {col:C.opp,    label:"Opportunity surround"},
              {col:C.warn,   label:"Mixed / tension zone"},
            ].map((l, i) => (
              <g key={i} transform={`translate(${i * 170}, 14)`}>
                <rect width={8} height={8} fill={l.col+"44"} stroke={l.col} strokeWidth={1} rx={1}/>
                <text x={12} y={7} fontFamily={C.mono} fontSize={9} fill={C.textMid}>{l.label}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Side panel */}
      {selectedStock && (
        <div style={{
          width: 320, flexShrink:0,
          background: C.bgCard,
          borderLeft: `1px solid ${C.border}`,
          overflowY:"auto",
          padding: 14,
        }}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <span style={{fontFamily:C.inst, fontSize:15, fontWeight:700, color:C.text}}>
              {selectedStock.ticker}
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:14, padding:4}}
            >✕</button>
          </div>
          <div style={{marginBottom:10}}>
            <WaveBar riskScore={selectedStock.riskScore} oppScore={selectedStock.oppScore} />
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:5, marginBottom:12}}>
            <ScoreBar score={selectedStock.riskScore} color={C.risk}  label="RISK" />
            <ScoreBar score={selectedStock.oppScore}  color={C.opp}   label="OPP" />
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:4, marginBottom:12}}>
            {selectedStock.pills.map((p, i) => <Pill key={i} {...p} />)}
          </div>
          <div style={{height:1, background:C.border, marginBottom:10}}/>
          {selectedStock.headlines.map((h, i) => (
            <div key={i} style={{display:"flex", gap:6, marginBottom:8}}>
              <span style={{color:C.textDim, fontFamily:C.mono, fontSize:9, marginTop:2}}>→</span>
              <span style={{fontFamily:C.sans, fontSize:11, color:C.textMid, lineHeight:1.5}}>{h}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── NATION VIEW ──────────────────────────────────────────────────────────── */
function NationView() {
  const [selected, setSelected] = useState("CH");
  const nation = NATIONS.find(n => n.code === selected);

  return (
    <div style={{flex:1, display:"flex", overflow:"hidden"}}>
      {/* Nation list */}
      <div style={{
        width:220, flexShrink:0,
        background:C.navLeft,
        borderRight:`1px solid ${C.border}`,
        overflowY:"auto",
      }}>
        <div style={{padding:"10px 14px 6px", fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>
          NATIONS · SIGNAL MAP
        </div>
        {NATIONS.sort((a,b) => (b.riskScore + b.oppScore) - (a.riskScore + a.oppScore)).map(n => {
          const rDom = n.riskScore > n.oppScore;
          const intensity = Math.max(n.riskScore, n.oppScore);
          const col = rDom ? C.risk : C.opp;
          const isSelected = selected === n.code;
          return (
            <div
              key={n.code}
              onClick={() => setSelected(n.code)}
              style={{
                padding:"10px 14px",
                background: isSelected ? C.bgCard2 : "transparent",
                borderLeft: `2px solid ${isSelected ? col : "transparent"}`,
                cursor:"pointer",
                borderBottom:`1px solid ${C.border}44`,
              }}
            >
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                <span style={{fontSize:18, lineHeight:1, flexShrink:0}}>{n.flag}</span>
                <span style={{fontFamily:C.inst, fontSize:12, fontWeight:700, color:"#FFFFFF"}}>{n.name}</span>
              </div>
              <div style={{display:"flex", gap:6}}>
                <span style={{fontFamily:C.mono, fontSize:9, color:C.risk}}>R:{n.riskScore}</span>
                <span style={{fontFamily:C.mono, fontSize:9, color:C.opp}}>O:{n.oppScore}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nation detail */}
      {nation && (
        <div style={{flex:1, overflowY:"auto", padding:16}}>
          {/* Header */}
          <div style={{
            display:"flex", alignItems:"flex-start", gap:16,
            background:C.bgCard, border:`1px solid ${C.border}`,
            padding:"16px 20px", marginBottom:12,
          }}>
            <div style={{flex:1}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6}}>
                <span style={{fontSize:22, lineHeight:1}}>{nation.flag}</span>
                <span style={{fontFamily:C.inst, fontSize:20, fontWeight:700, color:"#FFFFFF"}}>
                  {nation.name}
                </span>
              </div>
              <div style={{fontFamily:C.sans, fontSize:12, color:C.textMid, lineHeight:1.6, marginBottom:12}}>
                {nation.note}
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:5, maxWidth:340}}>
                <ScoreBar score={nation.riskScore} color={C.risk}  label="RISK" />
                <ScoreBar score={nation.oppScore}  color={C.opp}   label="OPP" />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div style={{background:C.bgCard, border:`1px solid ${C.border}`, padding:14, marginBottom:12}}>
            <div style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", marginBottom:8}}>
              ACTIVE SIGNALS
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:5}}>
              {nation.tags.map((t, i) => (
                <Pill key={i} dir={t.dir} cat="NAT" label={t.label} state={t.state} />
              ))}
            </div>
          </div>

          {/* Related tickers */}
          <div style={{background:C.bgCard, border:`1px solid ${C.border}`, padding:14}}>
            <div style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", marginBottom:10}}>
              RELATED TICKERS
            </div>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              {nation.relatedTickers.map(t => {
                const s = STOCKS.find(st => st.ticker === t);
                return (
                  <div key={t} style={{
                    background:C.bgCard2, border:`1px solid ${C.border2}`,
                    padding:"6px 12px", fontFamily:C.inst, fontSize:12, fontWeight:700,
                    color: s ? (s.riskScore >= s.oppScore ? C.risk : C.opp) : C.textMid,
                  }}>
                    {t}
                    {s && <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, marginLeft:6}}>
                      R:{s.riskScore}/O:{s.oppScore}
                    </span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SETTINGS PANEL ────────────────────────────────────────────────────────── */
function SettingsPanel({ onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const row = (label, content) => (
    <div style={{display:"flex", alignItems:"center", padding:"5px 14px", gap:10, minHeight:30}}>
      <span style={{fontFamily:C.mono, fontSize:10, color:C.textMid, flex:1, letterSpacing:"0.04em"}}>
        {label}
      </span>
      {content}
    </div>
  );

  const segBtn = (options, active, onChange) => (
    <div style={{
      display:"flex", border:`1px solid ${C.border2}`,
      overflow:"hidden", flexShrink:0,
    }}>
      {options.map(([k, v]) => (
        <button key={k} onClick={() => onChange(k)} style={{
          padding:"4px 10px", fontFamily:C.mono, fontSize:9, fontWeight:700,
          letterSpacing:"0.1em", textTransform:"uppercase", border:"none", cursor:"pointer",
          background: active === k ? C.accent : C.navLeft,
          color: active === k ? "#fff" : C.textDim,
          borderRight: `1px solid ${C.border2}`,
        }}>{v}</button>
      ))}
    </div>
  );

  return (
    <div ref={ref} style={{
      position:"absolute", top:"100%", right:0,
      width:280, background:C.bgCard,
      border:`1px solid ${C.border2}`,
      boxShadow:"0 8px 32px rgba(0,0,0,.5)",
      zIndex:400, paddingBottom:10,
    }}>
      <div style={{padding:"10px 14px 6px", fontFamily:C.mono, fontSize:9, fontWeight:700, letterSpacing:"0.14em", color:C.textDim}}>
        SETTINGS
      </div>
      <div style={{height:1, background:C.border, marginBottom:4}}/>
      {row("Theme",   segBtn([["dark","Dark"],["light","Light"]], "dark", ()=>{}))}
      {row("Refresh", segBtn([["15","15m"],["5","5m"],["60","1h"]], "15", ()=>{}))}
      {row("Sort",    segBtn([["risk","Risk"],["opp","Opp"],["comb","Both"]], "risk", ()=>{}))}
      <div style={{height:1, background:C.border, margin:"6px 0 4px"}}/>
      <div style={{padding:"5px 14px"}}>
        <div style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", marginBottom:6}}>WATCHLIST</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          {["DAL","NVDA","AAPL"].map(t => (
            <span key={t} style={{
              fontFamily:C.mono, fontSize:9, padding:"2px 8px",
              background:C.bgCard2, border:`1px solid ${C.border2}`,
              color:C.textMid,
            }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{height:1, background:C.border, margin:"8px 0 4px"}}/>
      <div style={{padding:"4px 14px 2px", fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.06em"}}>
        v0.1 · data: 15min delay · for demo only
      </div>
    </div>
  );
}

/* ── ROOT ─────────────────────────────────────────────────────────────────── */
export default function PerfectStorm() {
  const [tab, setTab]               = useState("cards");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const tabs = [
    { id:"cards",  label:"CARD VIEW" },
    { id:"storm",  label:"STORM VIEW" },
    { id:"nation", label:"NATION VIEW" },
  ];

  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      background:C.bg, color:C.text,
      fontFamily:C.sans,
      overflow:"hidden",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:2px}
        button{font-family:inherit}
      `}</style>

      {/* ── NAV BAR ── */}
      <nav style={{
        display:"flex", alignItems:"stretch", flexShrink:0,
        height:40,
        borderBottom:`1px solid ${C.border}`,
        position:"relative",
      }}>
        {/* LEFT — logo + tabs */}
        <div style={{
          flex:1, display:"flex", alignItems:"stretch",
          background:C.navLeft,
          paddingLeft:16, gap:0,
        }}>
          {/* Logo */}
          <div style={{
            display:"flex", alignItems:"center", paddingRight:20,
            borderRight:`1px solid ${C.border}`,
          }}>
            <span style={{
              fontFamily:C.inst, fontSize:13, fontWeight:700,
              letterSpacing:"0.1em", color:C.accent,
            }}>PERFECT</span>
            <span style={{
              fontFamily:C.inst, fontSize:13, fontWeight:700,
              letterSpacing:"0.1em", color:C.text, marginLeft:4,
            }}>STORM^</span>
          </div>

          {/* Tabs */}
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding:"0 18px",
                fontFamily:C.mono, fontSize:10, fontWeight:700,
                letterSpacing:"0.12em", textTransform:"uppercase",
                border:"none", cursor:"pointer",
                background:"transparent",
                color: tab === t.id ? C.accent : C.textDim,
                borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`,
                transition:"color .15s, border-color .15s",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* RIGHT — signal counter + settings */}
        <div style={{
          background:C.navRight,
          borderLeft:`1px solid ${C.border}`,
          display:"flex", alignItems:"center",
          paddingLeft:16, paddingRight:2,
          gap:8, flexShrink:0, position:"relative",
        }}>
          <div style={{display:"flex", gap:12}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:C.mono, fontSize:14, fontWeight:600, color:C.risk, lineHeight:1}}>
                {STOCKS.filter(s=>s.riskScore>50).length}
              </div>
              <div style={{fontFamily:C.mono, fontSize:8, color:C.textDim, letterSpacing:"0.1em"}}>RISK</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:C.mono, fontSize:14, fontWeight:600, color:C.opp, lineHeight:1}}>
                {STOCKS.filter(s=>s.oppScore>50).length}
              </div>
              <div style={{fontFamily:C.mono, fontSize:8, color:C.textDim, letterSpacing:"0.1em"}}>OPP</div>
            </div>
          </div>

          <div style={{width:1, height:20, background:C.border, margin:"0 4px"}}/>

          {/* Settings gear */}
          <button
            onClick={() => setSettingsOpen(v => !v)}
            style={{
              width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center",
              background: settingsOpen ? C.bgCard2 : "transparent",
              border:"none", cursor:"pointer",
              color: settingsOpen ? C.accent : C.textDim,
              transition:"color .15s, background .15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="8" cy="8" r="2.5"/>
              <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9"/>
            </svg>
          </button>

          {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{flex:1, display:"flex", overflow:"hidden"}}>
        {tab === "cards"  && <CardsView />}
        {tab === "storm"  && <StormView />}
        {tab === "nation" && <NationView />}
      </div>
    </div>
  );
}
