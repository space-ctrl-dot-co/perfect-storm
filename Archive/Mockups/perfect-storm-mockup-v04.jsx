import { useState, useRef, useEffect, useMemo } from "react";

/* ─── STORM SCORE ENGINE ────────────────────────────────────────────────────── */
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
  const tensionBonus = (riskScore > 25 && oppScore > 25)
    ? Math.round(Math.min(riskScore, oppScore) * 0.2) : 0;
  return { riskScore, oppScore, stormScore: riskScore + oppScore + tensionBonus };
}

/* ─── SIGNAL RULES — keyword patterns → pill templates ─────────────────────── */
// In production these fire against live RSS/API headlines and auto-tag pills.
const SIGNAL_RULES = [
  { id:"SR-001", pattern:/iran|hormuz|irgc|persian gulf.*carrier/i,
    cat:"GPOL", dir:"risk",  label:"GPOL: Iran Strait Escalation",      tickers:["DAL","AAL","XOM","LMT","RTX"] },
  { id:"SR-002", pattern:/nato|rearm|defense.*budget|pac-3|patriot.*order/i,
    cat:"POL",  dir:"opp",   label:"POL: NATO Rearmament Surge",         tickers:["RTX","LMT"] },
  { id:"SR-003", pattern:/tariff|section 301|import.*duty|trade.*sanction/i,
    cat:"MACRO",dir:"risk",  label:"MACRO: Tariff Wave",                 tickers:["AAPL","TSLA","DAL"] },
  { id:"SR-004", pattern:/h100|h200|gpu.*order|ai.*chip.*demand|hyperscaler.*chip/i,
    cat:"SECT", dir:"opp",   label:"SECT: AI Chip Demand Surge",         tickers:["NVDA","AMD"] },
  { id:"SR-005", pattern:/antitrust|doj.*probe|doj.*investigat|ftc.*investigat/i,
    cat:"POL",  dir:"risk",  label:"POL: Antitrust Probe",               tickers:["UNH","MSFT","AAPL"] },
  { id:"SR-006", pattern:/copilot.*adopt|copilot.*stall|ai.*penetrat.*3\.|ai.*monetiz.*fail/i,
    cat:"SECT", dir:"risk",  label:"SECT: AI Monetization Miss",         tickers:["MSFT"] },
  { id:"SR-007", pattern:/tesla.*eu.*sales|ev.*europe.*sales.*down|tesla.*market.*share.*eu/i,
    cat:"GEO",  dir:"risk",  label:"GEO: EV EU Market Contraction",      tickers:["TSLA"] },
  { id:"SR-008", pattern:/fed.*pause|federal reserve.*hold|rate.*hold|no.*cut.*until/i,
    cat:"RATE", dir:"opp",   label:"RATE: Fed Pause Extension",          tickers:["GS"] },
  { id:"SR-009", pattern:/brent.*crude|crude.*rally|oil.*price.*rise|oil.*atm/i,
    cat:"SECT", dir:"opp",   label:"SECT: Oil Price Elevation",          tickers:["XOM"] },
  { id:"SR-010", pattern:/china.*iphone|iphone.*china.*share|huawei.*market|china.*apple/i,
    cat:"GEO",  dir:"risk",  label:"GEO: China iPhone Share Loss",       tickers:["AAPL"] },
  { id:"SR-011", pattern:/robotaxi|autonomous.*licens|self.driv.*approv|driverless.*permit/i,
    cat:"SECT", dir:"opp",   label:"SECT: Robotaxi Commercial License",  tickers:["TSLA"] },
  { id:"SR-012", pattern:/export.*control|entity.*list|chip.*ban|export.*restrict.*chip/i,
    cat:"GPOL", dir:"risk",  label:"GPOL: Chip Export Controls",         tickers:["NVDA","AMD"] },
  { id:"SR-013", pattern:/m&a.*pipeline|deal.*activit|advisory.*revenue|pe.*deploy/i,
    cat:"SECT", dir:"opp",   label:"SECT: M&A Activity Recovery",        tickers:["GS"] },
  { id:"SR-014", pattern:/fuel.*cost.*airline|jet fuel|airline.*hedg|aviation.*fuel/i,
    cat:"MACRO",dir:"risk",  label:"MACRO: Airline Fuel Headwind",       tickers:["DAL","AAL"] },
  { id:"SR-015", pattern:/f-35.*order|lockheed.*contract|patriot.*award/i,
    cat:"GPOL", dir:"opp",   label:"GPOL: Defense Contract Award",       tickers:["LMT","RTX"] },
  { id:"SR-016", pattern:/mi300x|amd.*azure|amd.*inference|amd.*hyperscaler/i,
    cat:"SECT", dir:"opp",   label:"SECT: AMD AI Accelerator Win",       tickers:["AMD"] },
  { id:"SR-017", pattern:/credit.*card.*cap|10.*%.*rate.*cap|payment.*rate.*legislat/i,
    cat:"POL",  dir:"risk",  label:"POL: Credit Card Rate Cap",          tickers:["DAL","GS"] },
  { id:"SR-018", pattern:/medical.*cost|medical.*loss.*ratio|health.*expense.*ratio/i,
    cat:"EARN", dir:"risk",  label:"EARN: Medical Loss Ratio Spike",     tickers:["UNH"] },
  { id:"SR-019", pattern:/sovereign.*ai|ai.*nation.*program|state.*ai.*build/i,
    cat:"GPOL", dir:"opp",   label:"GPOL: Sovereign AI Orders",          tickers:["NVDA","AMD","MSFT"] },
  { id:"SR-020", pattern:/guyana|permian.*output|exxon.*production.*record/i,
    cat:"SECT", dir:"opp",   label:"SECT: XOM Production Record",        tickers:["XOM"] },
  { id:"SR-021", pattern:/doge.*contract|pentagon.*review|defense.*procurement/i,
    cat:"POL",  dir:"risk",  label:"POL: DOGE Procurement Scrutiny",     tickers:["LMT","RTX"] },
  { id:"SR-022", pattern:/medical.*inflation|pharmacy.*cost|cms.*reimburs/i,
    cat:"SECT", dir:"risk",  label:"SECT: Medical Cost Inflation",       tickers:["UNH"] },
  { id:"SR-023", pattern:/battery.*energy.*storage|megapack|powerwall.*deploy/i,
    cat:"SECT", dir:"opp",   label:"SECT: Energy Storage Growth",        tickers:["TSLA"] },
  { id:"SR-024", pattern:/tsmc.*order|semiconductor.*backlog|fab.*capacity/i,
    cat:"SUPPLY",dir:"risk", label:"SUPPLY: Fab Capacity Constraint",    tickers:["NVDA","AMD","AAPL"] },
  { id:"SR-025", pattern:/swift.*sanction|russia.*sanction|iran.*swift/i,
    cat:"GPOL", dir:"risk",  label:"GPOL: Financial Sanctions Escalation", tickers:["GS"] },
  // ── New rules SR-026–SR-035 ──────────────────────────────────────────────────
  { id:"SR-026", pattern:/drought|el nin[oó]|la nin[aá]|crop.*yield|corn.*yield|wheat.*shortage/i,
    cat:"WEATHER",dir:"risk", label:"WEATHER: Crop Yield Threat",           tickers:["MOS","ADM","DE","CF"] },
  { id:"SR-027", pattern:/black sea.*grain|ukraine.*grain|grain.*corridor|russia.*wheat.*export/i,
    cat:"GPOL",  dir:"risk",  label:"GPOL: Black Sea Grain Corridor",        tickers:["MOS","ADM","CF"] },
  { id:"SR-028", pattern:/potash.*sanction|belarus.*potash|fertilizer.*supply.*shock|nitrogen.*shortage/i,
    cat:"GPOL",  dir:"opp",   label:"GPOL: Fertilizer Supply Shock Opp",     tickers:["MOS","CF"] },
  { id:"SR-029", pattern:/gold.*\$[23]\d{3}|gold.*record|gold.*safe.?haven|bullion.*rally/i,
    cat:"GPOL",  dir:"opp",   label:"GPOL: Gold Safe-Haven Rally",           tickers:["NEM"] },
  { id:"SR-030", pattern:/copper.*ev|copper.*data.?center|copper.*shortage|copper.*demand.*surge/i,
    cat:"SECT",  dir:"opp",   label:"SECT: Copper AI/EV Demand Surge",       tickers:["FCX","RIO","CLF"] },
  { id:"SR-031", pattern:/mine.*water|water.*scarc.*min|aquifer.*mining|tailings.*water/i,
    cat:"CLMT",  dir:"risk",  label:"CLMT: Mine Water Stress",               tickers:["FCX","NEM","MOS","RIO"] },
  { id:"SR-032", pattern:/glp-1|wegovy|ozempic|semaglutide|obesity.*drug|eli.*lilly.*weight/i,
    cat:"SECT",  dir:"opp",   label:"SECT: GLP-1 Obesity Supercycle",        tickers:["LLY"] },
  { id:"SR-033", pattern:/red sea.*houthi|houthi.*attack|suez.*divert|bab.*el.?mandeb/i,
    cat:"GPOL",  dir:"risk",  label:"GPOL: Red Sea Shipping Disruption",     tickers:["ZIM","DAL","AAL","UAL"] },
  { id:"SR-034", pattern:/taiwan.*strait|china.*taiwan|prc.*invasion|cross.?strait.*tension/i,
    cat:"GPOL",  dir:"risk",  label:"GPOL: Taiwan Strait Escalation",        tickers:["TSM","NVDA","AMD","AAPL"] },
  { id:"SR-035", pattern:/rare.?earth|critical.*mineral|neodymium|dysprosium|rare.?earth.*china/i,
    cat:"GPOL",  dir:"risk",  label:"GPOL: Rare Earth Supply Squeeze",       tickers:["MP","NOC","LMT","RTX"] },
];

function matchSignals(headline) {
  return SIGNAL_RULES.filter(r => r.pattern.test(headline));
}

/* ─── LIVE FEED — 25 pre-composed headlines, oldest→newest (index 0 = oldest) ─ */
// In production these come from RSS/API ingestion pipeline. Simulation starts
// with 20 visible and reveals the final 5 every ~12s to demonstrate live tagging.
const LIVE_FEED = [
  { id:1,  ts:"03:34", src:"AP",
    headline:"Satya Nadella reshuffles Copilot leadership — third GM in 18 months as product strategy unclear",
    tickers:["MSFT"], ruleIds:["SR-006"] },
  { id:2,  ts:"03:51", src:"CNBC",
    headline:"Trump admin approves H200 GPU exports to Saudi Arabia and UAE for sovereign AI programs",
    tickers:["NVDA"], ruleIds:["SR-019","SR-004"] },
  { id:3,  ts:"04:07", src:"WSJ",
    headline:"Private equity M&A pipeline at 3-year high — Goldman advisory revenue expected +22% YoY",
    tickers:["GS","MSFT"], ruleIds:["SR-013"] },
  { id:4,  ts:"04:19", src:"Reuters",
    headline:"Citi aviation desk: US airline Q1 fuel bills tracking $400M above guidance — hedges minimal",
    tickers:["DAL","AAL"], ruleIds:["SR-014","SR-001"] },
  { id:5,  ts:"04:32", src:"Bloomberg",
    headline:"Microsoft Azure selects AMD MI300X for new inference tier — 5,000 chip initial order",
    tickers:["AMD","MSFT"], ruleIds:["SR-016"] },
  { id:6,  ts:"04:48", src:"FT",
    headline:"Poland orders 96 F-35As in largest European defense contract since Cold War",
    tickers:["LMT"], ruleIds:["SR-015","SR-002"] },
  { id:7,  ts:"05:02", src:"AP",
    headline:"Morgan Stanley: TSLA trades at 130× trailing earnings on 1% revenue growth — valuation gap widens",
    tickers:["TSLA"], ruleIds:["SR-003"] },
  { id:8,  ts:"05:17", src:"CNBC",
    headline:"Texas approves Tesla robotaxi commercial license — Austin launch window opens June 2026",
    tickers:["TSLA"], ruleIds:["SR-011"] },
  { id:9,  ts:"05:29", src:"Reuters",
    headline:"China Huawei Mate 70 pre-orders hit 12M — iPhone market share in China falls below 15%",
    tickers:["AAPL"], ruleIds:["SR-010"] },
  { id:10, ts:"05:41", src:"Bloomberg",
    headline:"White House emergency defense order: all US Patriot batteries to be replenished in 90 days",
    tickers:["RTX"], ruleIds:["SR-002","SR-015"] },
  { id:11, ts:"05:54", src:"FT",
    headline:"UnitedHealth Q1 medical expense ratio expected 87.2% vs 84.1% consensus — estimates cut",
    tickers:["UNH"], ruleIds:["SR-018","SR-022"] },
  { id:12, ts:"06:08", src:"AP",
    headline:"Commerce Dept confirms H100 export enforcement — 8 Chinese entities added to entity list",
    tickers:["NVDA","AMD"], ruleIds:["SR-012"] },
  { id:13, ts:"06:21", src:"WSJ",
    headline:"Senate Banking Committee advances 10% credit card rate cap — Delta's $8.2B AmEx deal at risk",
    tickers:["DAL","GS"], ruleIds:["SR-017"] },
  { id:14, ts:"06:33", src:"Reuters",
    headline:"Brent crude at $83.40 — ExxonMobil Guyana output hits 920k bpd, lowest-cost barrels in portfolio",
    tickers:["XOM"], ruleIds:["SR-009","SR-020"] },
  { id:15, ts:"06:44", src:"Seeking Alpha",
    headline:"American Airlines debt/equity hits 11.2× — highest leverage among US airline majors, guidance at risk",
    tickers:["AAL"], ruleIds:["SR-014"] },
  { id:16, ts:"06:55", src:"Bloomberg",
    headline:"Microsoft Copilot enterprise adoption stalls at 3.1% — Melius downgrades to Sell, PT cut to $320",
    tickers:["MSFT"], ruleIds:["SR-006"] },
  { id:17, ts:"07:01", src:"CNBC",
    headline:"Fed minutes: unanimous hold — Jerome Powell signals no cuts until Q3 at earliest",
    tickers:["GS","ED"], ruleIds:["SR-008"] },
  { id:18, ts:"07:12", src:"AP",
    headline:"EU EV sales data: Tesla down 48% YoY in February — BYD now #1 in 6 EU markets",
    tickers:["TSLA"], ruleIds:["SR-007"] },
  { id:19, ts:"07:29", src:"FT",
    headline:"Germany fast-tracks €85B supplemental defense budget — RTX Patriot, LMT F-35 top allocation",
    tickers:["RTX","LMT"], ruleIds:["SR-002","SR-015"] },
  { id:20, ts:"07:41", src:"Reuters",
    headline:"Goldman Sachs Q1 trading desk revenue +34% YoY — geopolitical volatility ideal for FICC",
    tickers:["GS"], ruleIds:["SR-013"] },

  // ── ARRIVING IN SIMULATION ──────────────────────────────────────────────────
  { id:21, ts:"07:58", src:"CNBC",
    headline:"DOJ widens Optum antitrust investigation to include data licensing practices — UNH down 3%",
    tickers:["UNH"], ruleIds:["SR-005"] },
  { id:22, ts:"08:04", src:"WSJ",
    headline:"Meta increases H100/H200 order by 40% for Q2; Google DeepMind commits to 25k chip buy",
    tickers:["NVDA","AMD"], ruleIds:["SR-004"] },
  { id:23, ts:"08:19", src:"Bloomberg",
    headline:"Treasury confirms Section 301 tariff expansion covers consumer electronics and EVs from March 31",
    tickers:["AAPL","TSLA"], ruleIds:["SR-003"] },
  { id:24, ts:"08:31", src:"AP",
    headline:"NATO Secretary General confirms €500B rearmament framework — fastest peacetime defense build in history",
    tickers:["RTX","LMT"], ruleIds:["SR-002"] },
  { id:25, ts:"08:47", src:"Reuters",
    headline:"Iran IRGC commander threatens Hormuz closure as 3rd US carrier group enters the Persian Gulf",
    tickers:["DAL","AAL","XOM","RTX","LMT"], ruleIds:["SR-001"] },
];

/* ─── EMERGENT PATTERNS — cross-stock signal insights auto-detected ─────────── */
const EMERGENT_PATTERNS = [
  {
    id:"iran-split", strength:94, col:"#F59E0B",
    label:"⚡ Iran Conflict — Sector Divergence",
    insight:"Single GPOL event: Defense + Energy win while Airlines lose. RTX / LMT / XOM all carry ACTIVE OPP pills from the same Iran signal that pushes DAL / AAL into ACTIVE RISK. Same root cause, opposite price outcomes.",
    opp:["RTX","LMT","XOM"], risk:["DAL","AAL"],
  },
  {
    id:"ai-capex", strength:88, col:"#0EA5E9",
    label:"⚡ AI Capex Cycle — Chip vs. Software Split",
    insight:"NVDA + AMD capture AI capex spend while MSFT is squeezed: spending $37.5B/yr on infra yet Copilot sits at 3.3% adoption. Intra-sector divergence: silicon sellers vs. software monetizers.",
    opp:["NVDA","AMD"], risk:["MSFT"],
  },
  {
    id:"tariff-cluster", strength:81, col:"#EF4444",
    label:"⚠ Tariff Wave — Multi-Sector Amplification",
    insight:"Same macro event, three different transmission paths: AAPL (supply chain cost), TSLA (EV component imports), DAL (unhedged fuel premium via oil price tariff pass-through). One policy, three exposed tickers.",
    opp:[], risk:["AAPL","TSLA","DAL"],
  },
  {
    id:"defense-energy-corr", strength:76, col:"#22C55E",
    label:"✦ Defense × Energy Positive Correlation",
    insight:"RTX and XOM both benefit from Iran conflict via different mechanisms — munitions demand vs. oil price. Unusual positive correlation across otherwise unrelated sectors creates a correlated hedge basket.",
    opp:["RTX","XOM","LMT"], risk:[],
  },
  {
    id:"rate-bifurcation", strength:62, col:"#A78BFA",
    label:"⊞ Fed Pause — Sector Bifurcation",
    insight:"Rate hold extends NIM expansion for GS (positive), but removes the rate-cut catalyst that utility investors had priced in for ED. Same macro condition, opposite sector implications.",
    opp:["GS"], risk:["ED"],
  },
];

/* ─── DATA SOURCE MANIFEST — what feeds power which pill categories ─────────── */
const DATA_SOURCES = [
  { name:"Reuters / AP RSS",   cats:["GPOL","POL","MACRO","SECT"], status:"free",     refresh:"5min",    note:"Best breadth — geopolitical, policy, macro" },
  { name:"SEC EDGAR RSS",      cats:["EARN","LEGAL"],              status:"free",     refresh:"1min",    note:"8-K filings, earnings releases, enforcement" },
  { name:"GDACS Alert Feed",   cats:["WEATHER","GEO"],             status:"free",     refresh:"15min",   note:"Real-time global disaster + weather events" },
  { name:"FRED API",           cats:["RATE","MACRO"],              status:"free+key", refresh:"daily",   note:"Fed rates, CPI, employment — gold standard" },
  { name:"GDELT GKG",          cats:["GPOL","POL"],                status:"free",     refresh:"15min",   note:"ML-tagged geopolitical news at massive scale" },
  { name:"USGS Earthquake API",cats:["WEATHER","SUPPLY"],          status:"free",     refresh:"1min",    note:"Seismic events → supply chain disruption signal" },
  { name:"OpenSanctions",      cats:["GPOL","LEGAL"],              status:"free",     refresh:"daily",   note:"Entity sanctions, risk lists, ownership flags" },
  { name:"Alpha Vantage",      cats:["EARN","RATE"],               status:"free+key", refresh:"1hr",     note:"Earnings calendar, fundamentals, price data" },
  { name:"BLS Mass Layoffs",   cats:["LABOR"],                     status:"free",     refresh:"monthly", note:"US labor market — mass layoff events by sector" },
  { name:"USPTO Patent RSS",   cats:["TECH"],                      status:"free",     refresh:"weekly",  note:"Innovation signal — patent grants by assignee" },
];

/* ─── STOCK DATA ─────────────────────────────────────────────────────────────── */
const RAW_STOCKS = [
  {
    ticker:"RTX", name:"RTX Corporation", price:"$212.68", change:"+4.22%", pos:true, sector:"Defense",
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
    ticker:"XOM", name:"ExxonMobil Corp.", price:"$167.34", change:"+3.91%", pos:true, sector:"Energy",
    pills:[
      {dir:"opp", cat:"GPOL", label:"GPOL: Iran Strait Conflict",         state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Permian+Guyana ATH",         state:"active"},
      {dir:"opp", cat:"MACRO",label:"Macro: Bits→Atoms Rotation",         state:"active"},
      {dir:"opp", cat:"GEO",  label:"Geo: LNG Europe Supply Demand",      state:"active"},
      {dir:"opp", cat:"MACRO",label:"Macro: Oil Supercycle Thesis",       state:"emerging"},
      {dir:"risk",cat:"POL",  label:"Policy: Canada/Mexico Tariff Risk",  state:"emerging"},
      {dir:"risk",cat:"POL",  label:"Policy: EU Carbon Tax / ETS Risk",   state:"emerging"},
    ],
    headlines:[
      "Brent hits $83 on Iran strait fears — XOM all-time high $167.34, up 27% YTD",
      "Guyana output tops 920k bpd — lowest-cost barrels in portfolio lifting margins sharply",
      "Investors rotate from tech to energy as geopolitical hedge — XOM leads sector inflows",
    ]
  },
  {
    ticker:"LMT", name:"Lockheed Martin", price:"$541.20", change:"+2.87%", pos:true, sector:"Defense",
    pills:[
      {dir:"opp", cat:"GPOL", label:"GPOL: F-35 NATO Orders Surge",        state:"active"},
      {dir:"opp", cat:"POL",  label:"Policy: US Defense Budget +$50B",     state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: Missile Defense Shield Demand", state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: DOGE Procurement Scrutiny",   state:"emerging"},
    ],
    headlines:[
      "NATO allies activate F-35 orders — Lockheed booking rate highest since Cold War II era",
      "US defense supplemental $50B fast-tracked — LMT PAC-3 Patriot interceptors lead allocation",
      "DOGE reviewing Pentagon contracts; LMT lobbying intensifies on Capitol Hill",
    ]
  },
  {
    ticker:"NVDA", name:"NVIDIA Corporation", price:"$875.50", change:"+1.44%", pos:true, sector:"Semiconductors",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: $78B Q1 FY27 Guidance Beat",       state:"active"},
      {dir:"opp", cat:"GEO",  label:"Geo: ByteDance $14B China Cluster Build",  state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: H200 China Sales Approved",          state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: Sovereign AI — 47-Nation Pipeline",  state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Physical AI / GB200 Robotics Ramp",state:"emerging"},
      {dir:"opp", cat:"SECT", label:"Sector: InfiniBand AI Networking Monopoly",state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Core Export Controls Remain",        state:"active"},
      {dir:"risk",cat:"SECT", label:"Sector: Custom Silicon Threat (TPU/Maia)", state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: TSM Taiwan Fab Single-Point Risk",   state:"active"},
    ],
    headlines:[
      "NVDA Q1 FY27 guidance $78B — massive beat; ByteDance commits $14B to H100 cluster build",
      "Trump approves H200 GPU sales to Chinese customers — near-term China revenue unlocked",
      "Core export controls persist; Google TPU v5, Amazon Trainium 2, MSFT Maia eating edge inference — custom silicon threat materializing at hyperscalers",
    ]
  },
  {
    ticker:"GS", name:"Goldman Sachs", price:"$588.14", change:"+1.12%", pos:true, sector:"Finance",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: M&A Pipeline Recovering",    state:"active"},
      {dir:"opp", cat:"RATE", label:"Rate: NIM at 3.5% Expansion",        state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: FICC Volatility Revenue",    state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Consumer Credit Default Up",  state:"emerging"},
      {dir:"risk",cat:"POL",  label:"Policy: Credit Card Rate Cap Risk",  state:"emerging"},
    ],
    headlines:[
      "Goldman M&A advisory pipeline strongest since 2021 — PE dry powder deploying into lower rates",
      "GS net interest margin expands to 3.5% — Fed pause extending NIM runway through H2 2026",
      "FICC trading desk +34% YoY — geopolitical volatility creating outsized revenue environment",
    ]
  },
  {
    ticker:"AMD", name:"Advanced Micro Devices", price:"$124.38", change:"+0.88%", pos:true, sector:"Semiconductors",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: MI300X AI Accelerator",      state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: Sovereign AI Alt-Sourcing",    state:"emerging"},
      {dir:"risk",cat:"GPOL", label:"GPOL: China Export Risk Mirror",     state:"active"},
      {dir:"risk",cat:"SECT", label:"Sector: NVDA 80%+ GPU Share",        state:"active"},
    ],
    headlines:[
      "AMD MI300X winning slots in Microsoft and Meta inference clusters — share gain materializing",
      "Sovereign AI programs hedging NVDA dependency — AMD gaining early pipeline positioning",
      "Export control risk mirrors NVDA exposure; AMD China revenue ~10% vs NVDA's ~18%",
    ]
  },
  {
    ticker:"TSLA", name:"Tesla Inc.", price:"$383.03", change:"-2.14%", pos:false, sector:"EV / Energy",
    pills:[
      {dir:"risk",cat:"SECT", label:"Brand: Musk DOGE Blowback",          state:"active"},
      {dir:"risk",cat:"GEO",  label:"Geo: EU Sales -48% YoY",             state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: 130× PE, 1% Rev Growth",      state:"active"},
      {dir:"risk",cat:"GEO",  label:"Geo: China BYD -22% TSLA Share",     state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Megapack Revenue 2×",        state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Robotaxi TX License",        state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Optimus Pilot Production",   state:"emerging"},
      {dir:"opp", cat:"SECT", label:"Sector: FSD Subscription Revenue",   state:"active"},
    ],
    headlines:[
      "Tesla EU sales -48% YoY in Feb — anti-Musk protests at showrooms across Germany and France",
      "Megapack now 12% of Tesla revenue, doubled YoY — energy storage emerging as standalone thesis",
      "Texas approves robotaxi commercial license — Austin launch opens June 2026",
    ]
  },
  {
    ticker:"DAL", name:"Delta Air Lines", price:"$42.10", change:"-0.82%", pos:false, sector:"Airlines",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: $400M Q1 Fuel Surge",         state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: AmEx Rate Cap Threat",       state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Iran→Unhedged Fuel Spike",     state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: TSA Staffing Delays Risk",   state:"active"},
      {dir:"risk",cat:"CLMT", label:"CLMT: Carbon Offset Cost Rising",    state:"emerging"},
      {dir:"opp", cat:"SECT", label:"Sector: Premium Travel Demand",      state:"active"},
    ],
    headlines:[
      "Delta expects $400M Q1 fuel headwind — Citi cuts PT $87→$77; US airlines largely unhedged",
      "Proposed 10% credit card rate cap directly threatens Delta's $8.2B AmEx remuneration engine",
      "Premium cabin and loyalty revenue holding firm — partial offset to converging risk signals",
    ]
  },
  {
    ticker:"UNH", name:"UnitedHealth Group", price:"$287.44", change:"-1.89%", pos:false, sector:"Health Insurance",
    pills:[
      {dir:"risk",cat:"SECT", label:"Sector: Medical Cost Inflation",     state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: DOJ Antitrust Probe",        state:"active"},
      {dir:"risk",cat:"EARN", label:"Earnings: MLR 87.2% vs 84.1% Est",  state:"active"},
      {dir:"risk",cat:"SECT", label:"Sector: GLP-1 Utilization Cost Wave",state:"emerging"},
      {dir:"opp", cat:"MACRO",label:"Macro: Aging Population Demand",     state:"active"},
      {dir:"opp", cat:"EARN", label:"Earnings: 16× Fwd PE Discount",      state:"emerging"},
    ],
    headlines:[
      "UNH -18% YTD as medical expense gap widens — Zacks cuts Q1 estimates, stock below all MAs",
      "DOJ antitrust probe into Optum/insurance synergy creating persistent headline overhang",
      "At 16× forward PE vs 5yr avg 22×, analysts flag structural value building on demographic tailwind",
    ]
  },
  {
    ticker:"MSFT", name:"Microsoft Corp.", price:"$373.61", change:"-1.43%", pos:false, sector:"Cloud / AI",
    pills:[
      {dir:"risk",cat:"SECT", label:"Sector: Copilot 3.3% Penetration",   state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: CapEx $37.5B Margin Squeeze",  state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: EU AI Act Fines Exposure",    state:"emerging"},
      {dir:"opp", cat:"SECT", label:"Sector: Azure +38% Cloud Growth",     state:"active"},
    ],
    headlines:[
      "MSFT down 21% YTD — worst Mag-7 performer; Copilot reorg flagged as red flag by Melius",
      "Only 15M of 450M Office users on paid Copilot — 3.3% penetration after billions in spend",
      "Azure cloud tops $50B ARR — AI infrastructure demand robust despite Copilot adoption miss",
    ]
  },
  {
    ticker:"AAL", name:"American Airlines", price:"$11.42", change:"-1.55%", pos:false, sector:"Airlines",
    pills:[
      {dir:"risk",cat:"GPOL", label:"GPOL: Iran Fuel Spike Unhedged",     state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Debt/Equity 11.2× Worst",     state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: TSA Staffing Delays",        state:"active"},
      {dir:"risk",cat:"EARN", label:"Earnings: Guidance Miss Risk 60%",   state:"emerging"},
    ],
    headlines:[
      "AAL debt/equity hits 11.2× — worst among US majors; fuel spike compounds leverage risk",
      "TSA data shows AAL hubs among hardest hit by ongoing staffing shortfalls",
      "Analysts flag AAL guidance miss probability above 60% given converging cost headwinds",
    ]
  },
  {
    ticker:"AAPL", name:"Apple Inc.", price:"$213.18", change:"-4.01%", pos:false, sector:"Consumer Tech",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: Tariffs +$900M Q2 Cost",      state:"active"},
      {dir:"risk",cat:"GEO",  label:"Geo: China Brand Erosion -14%",      state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: DOJ App Store Antitrust",    state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: EU DMA Compliance Cost",     state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Apple Intelligence 62%",     state:"active"},
      {dir:"opp", cat:"EARN", label:"Earnings: Services ARR Growth",      state:"active"},
      {dir:"opp", cat:"GEO",  label:"Geo: India Manufacturing Pivot",     state:"active"},
    ],
    headlines:[
      "Apple -4% on tariff fears — CEO Cook: $900M+ Q2 cost hit, no clean path on pricing",
      "China iPhone shipments -14% YoY; Huawei Mate reclaims premium on nationalism tailwind",
      "Apple Intelligence on 62% of iPhone 16 fleet — services ARR partially offsets hardware drag",
    ]
  },
  {
    ticker:"ED", name:"Consolidated Edison", price:"$95.20", change:"+0.31%", pos:true, sector:"Utilities",
    pills:[
      {dir:"risk",cat:"RATE", label:"Rate: Utility Rate Sensitivity",     state:"fading"},
    ],
    headlines:[
      "ConEd Q4 in line — grid hardening capex on track; no material near-term storm signals",
    ]
  },
  {
    ticker:"MCD", name:"McDonald's Corp.", price:"$296.50", change:"+0.18%", pos:true, sector:"Consumer Staples",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: Consumer Trade-Down Slowing", state:"fading"},
      {dir:"opp", cat:"SECT", label:"Sector: Value Menu Resilience",      state:"fading"},
    ],
    headlines:[
      "McDonald's comparable sales flat — value menu holding traffic but no growth catalyst visible",
    ]
  },
  {
    ticker:"PG", name:"Procter & Gamble", price:"$163.74", change:"+0.09%", pos:true, sector:"Consumer Staples",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: Input Cost Tariff Creep",     state:"fading"},
    ],
    headlines:[
      "P&G pricing power intact amid mild tariff input cost pressure — defensive positioning holds",
    ]
  },
  // ── New 20 companies ─────────────────────────────────────────────────────────
  {
    ticker:"JPM", name:"JPMorgan Chase", price:"$240.50", change:"+0.88%", pos:true, sector:"Finance",
    pills:[
      {dir:"opp", cat:"RATE", label:"Rate: NIM Expansion at 3.8%",       state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: M&A/IPO Recovery Cycle",    state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Consumer Default Rising",     state:"emerging"},
      {dir:"risk",cat:"POL",  label:"Policy: Basel III Endgame Capital",  state:"emerging"},
    ],
    headlines:[
      "JPM net interest margin at 3.8% — Fed pause extending NIM runway well into 2026",
      "M&A advisory fees surging — JPM advises on $180B of deals so far in Q1 2026",
      "Basel III endgame comment period heating up — potential 15% RWA increase being contested",
    ]
  },
  {
    ticker:"LLY", name:"Eli Lilly", price:"$870.20", change:"+2.34%", pos:true, sector:"Pharma",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: GLP-1 Obesity Supercycle",  state:"active"},
      {dir:"opp", cat:"EARN", label:"Earnings: $45B FY26 Guidance Beat",  state:"active"},
      {dir:"opp", cat:"GEO",  label:"Geo: Global Capacity Expansion",     state:"active"},
      {dir:"risk",cat:"SECT", label:"Sector: Manufacturing Capacity Lag", state:"active"},
      {dir:"risk",cat:"SECT", label:"Sector: Biosimilar Competition Risk",state:"emerging"},
      {dir:"risk",cat:"POL",  label:"Policy: Medicare Drug Negotiation",  state:"emerging"},
    ],
    headlines:[
      "Tirzepatide weekly Rx passes 1.5M — supply constraints remain the only limit on growth",
      "LLY raises FY26 guidance to $45B revenue — incretin market outpacing all prior models",
      "IRA Medicare negotiation list expands — Mounjaro on watch list for 2027 price caps",
    ]
  },
  {
    ticker:"NOC", name:"Northrop Grumman", price:"$488.30", change:"+1.92%", pos:true, sector:"Defense",
    pills:[
      {dir:"opp", cat:"GPOL", label:"GPOL: B-21 Raider Production Ramp",  state:"active"},
      {dir:"opp", cat:"POL",  label:"Policy: Space/Cyber Budget +$28B",   state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Rare Earth Magnet Supply Risk", state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: DOGE Procurement Review",    state:"emerging"},
    ],
    headlines:[
      "B-21 Raider enters low-rate initial production — NOC locks in 100-aircraft multi-year contract",
      "US Space Force cyber budget +$28B — Northrop wins 60% of new SATCOM contract awards",
      "Rare earth magnet supply chain audit ordered — NOC systems rely on Chinese RE processing",
    ]
  },
  {
    ticker:"NEE", name:"NextEra Energy", price:"$67.40", change:"-0.45%", pos:false, sector:"Renewables",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: 36 GW Renewable Pipeline",   state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Battery Storage 42% CAGR",   state:"active"},
      {dir:"risk",cat:"RATE", label:"Rate: High Debt → Rate Sensitivity",  state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Steel/Cable Tariff Input Cost",state:"emerging"},
    ],
    headlines:[
      "NextEra 36 GW development pipeline — largest in US utility sector, battery storage leads",
      "Federal Financing Bank rate sensitivity: every 25bps = ~$400M capex cost increase for NEE",
      "Tariffs on wind tower steel adding $180M to FY26 construction costs — margin pressure emerging",
    ]
  },
  {
    ticker:"DE", name:"Deere & Company", price:"$398.50", change:"-0.62%", pos:false, sector:"Farm Equipment",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: Precision Ag AI Integration", state:"active"},
      {dir:"opp", cat:"CLMT", label:"CLMT: Climate Adaptation Demand",     state:"emerging"},
      {dir:"risk",cat:"MACRO",label:"Macro: Farmer Income Squeeze -22%",   state:"active"},
      {dir:"risk",cat:"WEATHER",label:"Weather: Drought Delays New Orders",state:"active"},
    ],
    headlines:[
      "John Deere Precision Ag platform hits 500M acres monitored — AI yield model subscriptions triple",
      "US net farm income down 22% YoY — equipment replacement cycle delayed 18+ months",
      "La Niña-driven drought from Texas to Iowa cutting spring planting confidence — equipment orders soft",
    ]
  },
  {
    ticker:"UAL", name:"United Airlines", price:"$75.20", change:"-1.18%", pos:false, sector:"Airlines",
    pills:[
      {dir:"risk",cat:"GPOL", label:"GPOL: Iran Fuel Spike Unhedged",     state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: $380M Q1 Fuel Headwind",      state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Red Sea Divert Cost $60/seg",  state:"emerging"},
      {dir:"opp", cat:"SECT", label:"Sector: Premium Trans-Atlantic Bid", state:"active"},
    ],
    headlines:[
      "United $380M fuel headwind in Q1 — CEO Kirby warns fuel exposure limits buyback program",
      "Iran Strait tensions pushing Brent above $83 — US airlines largely unhedged into Q2",
      "Polaris premium cabin load factor hits 92% — transatlantic demand absorbing cost pressure",
    ]
  },
  {
    ticker:"MP", name:"MP Materials", price:"$18.40", change:"+3.21%", pos:true, sector:"Rare Earths",
    pills:[
      {dir:"risk",cat:"GPOL", label:"GPOL: China Processes 85% of REE",   state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: US Critical Mineral Policy",   state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Defense + EV Magnet Demand", state:"active"},
      {dir:"risk",cat:"CLMT", label:"CLMT: Mountain Pass Tailings Risk",  state:"emerging"},
    ],
    headlines:[
      "China rare earth export curbs triggering emergency Pentagon review — MP Materials sole US source",
      "CHIPS and Science Act critical mineral funding bill unlocks $420M for MP Magnetics facility",
      "Mountain Pass water table flagged in California ESG review — tailings pond expansion contested",
    ]
  },
  {
    ticker:"ZIM", name:"ZIM Integrated Shipping", price:"$22.80", change:"-3.45%", pos:false, sector:"Shipping",
    pills:[
      {dir:"risk",cat:"GPOL",   label:"GPOL: Red Sea / Houthi Diversion",    state:"active"},
      {dir:"risk",cat:"GPOL",   label:"GPOL: Iran Strait → Cape Rerouting",  state:"active"},
      {dir:"opp", cat:"MACRO",  label:"Macro: Freight Rate Spike +180%",     state:"active"},
      {dir:"risk",cat:"MACRO",  label:"Macro: Container Oversupply '27",     state:"emerging"},
      {dir:"risk",cat:"WEATHER",label:"Weather: Panama Canal Drought Risk",  state:"active"},
      {dir:"risk",cat:"SUPPLY", label:"SUPPLY: Port Labor Disruption Risk",  state:"emerging"},
    ],
    headlines:[
      "ZIM routes 100% of Asia-EU vessels via Cape of Good Hope — adds 14 days, raises cost $1,800/TEU",
      "Red Sea avoidance and Iran strait risk driving spot rates +180% — ZIM capturing premium",
      "Analysts flag container new-build orderbook will reverse dynamics in 2027 — oversupply looming",
    ]
  },
  {
    ticker:"AMZN", name:"Amazon.com", price:"$218.50", change:"-0.73%", pos:false, sector:"Cloud / Retail",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: AWS AI Revenue +42% YoY",   state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Tariff Hit Retail $6B+",      state:"active"},
      {dir:"risk",cat:"POL",  label:"Policy: Labor Union Expansion",      state:"emerging"},
      {dir:"opp", cat:"SECT", label:"Sector: Ads Revenue Record $60B",    state:"active"},
    ],
    headlines:[
      "AWS AI quarterly revenue run-rate hits $115B — Bedrock and SageMaker driving enterprise uptake",
      "Amazon retail facing $6B+ tariff cost on Chinese-sourced goods — 3P seller margins under pressure",
      "Amazon labor union ratifies 5-year contracts in 12 warehouses — wage cost structure rising",
    ]
  },
  {
    ticker:"WMT", name:"Walmart Inc.", price:"$89.30", change:"+0.42%", pos:true, sector:"Retail",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: Tariff Input Cost $4.5B+",    state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Value Menu Trade-Down",      state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Ads/Fintech Revenue +55%",   state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Mexico Supply Chain Risk",    state:"emerging"},
    ],
    headlines:[
      "Walmart absorbing $4.5B tariff cost — CEO warns selective price increases coming in Q2",
      "Consumer trade-down driving Walmart grocery market share to 25% — highest since 2012",
      "Walmart Connect advertising revenue +55% YoY — monetization of 230M weekly customer base",
    ]
  },
  {
    ticker:"PFE", name:"Pfizer Inc.", price:"$27.60", change:"-0.55%", pos:false, sector:"Pharma",
    pills:[
      {dir:"risk",cat:"EARN", label:"Earnings: Post-COVID Revenue Cliff",  state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: $4.5B Cost Reduction Program", state:"active"},
      {dir:"opp", cat:"EARN", label:"Earnings: Oncology Pipeline Value",   state:"emerging"},
      {dir:"risk",cat:"POL",  label:"Policy: Medicare Negotiation Risk",   state:"emerging"},
    ],
    headlines:[
      "PFE COVID revenue cliff bottoms: Paxlovid sales -74% from peak — adjusted revenue guidance $60B",
      "Pfizer $4.5B cost program — 4,000 jobs cut, R&D consolidated; Street skeptical of execution",
      "Seagen oncology assets now generating $3B run rate — ADC platform outperforming Street models",
    ]
  },
  {
    ticker:"CLF", name:"Cleveland-Cliffs", price:"$14.80", change:"+2.15%", pos:true, sector:"Steel",
    pills:[
      {dir:"opp", cat:"MACRO",label:"Macro: US Steel Tariff Windfall",    state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: EV + Infrastructure Steel",  state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Automotive Slowdown Risk",    state:"active"},
      {dir:"risk",cat:"CLMT", label:"CLMT: Carbon Tax Exposure ETS",      state:"emerging"},
    ],
    headlines:[
      "US 25% steel tariff reinstated — Cleveland-Cliffs recaptures 18% market share from imports",
      "Infrastructure bill steel contracts accelerating — CLF Hot-briquetted iron facility at full utilization",
      "Auto production forecasts cut -8% — CLF automotive exposed sheet product demand softening",
    ]
  },
  {
    ticker:"CF", name:"CF Industries", price:"$79.40", change:"+1.85%", pos:true, sector:"Nitrogen Fertilizer",
    pills:[
      {dir:"opp", cat:"GPOL", label:"GPOL: EU Ammonia Shortage",          state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Food Security Policy Bid",   state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Nat Gas Cost Volatility",     state:"active"},
      {dir:"risk",cat:"WEATHER",label:"Weather: Drought Demand Softness", state:"emerging"},
    ],
    headlines:[
      "EU ammonia production down 40% on Russian gas cut — CF Industries capturing European export premium",
      "US food security bill mandates domestic fertilizer strategic reserve — CF prime beneficiary",
      "Henry Hub natural gas spike +35% in February — CF input cost pressure mounts for Q2 guidance",
    ]
  },
  {
    ticker:"COIN", name:"Coinbase Global", price:"$235.70", change:"+4.12%", pos:true, sector:"Crypto Exchange",
    pills:[
      {dir:"opp", cat:"POL",  label:"Policy: SEC Crypto Regulatory Clarity",state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Institutional BTC ETF Flows", state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: BTC High-Beta Correlation",    state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Sanctions Evasion Scrutiny",   state:"emerging"},
    ],
    headlines:[
      "SEC drops three crypto enforcement cases — Coinbase stock +42% YTD on regulatory clarity",
      "Bitcoin ETF net inflows $22B since Jan — Coinbase custodying 80% of institutional BTC ETF assets",
      "Treasury OFAC scrutiny of crypto mixing protocols — Coinbase compliance costs rising $180M",
    ]
  },
  {
    ticker:"LIN", name:"Linde plc", price:"$470.20", change:"+0.65%", pos:true, sector:"Industrial Gases",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: AI Data Center Cooling Gas",  state:"active"},
      {dir:"opp", cat:"CLMT", label:"CLMT: Green Hydrogen Production",     state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Semiconductor Fab Supply",    state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Energy Input Cost Exposure",   state:"emerging"},
    ],
    headlines:[
      "Linde AI data center cooling gas contracts — 47 hyperscaler agreements signed in 12 months",
      "Green hydrogen electrolyzer gas supply: Linde wins $2.1B long-term contract in Saudi Arabia",
      "Semiconductor fab gases demand surges — TSMC Arizona ramp drives 18% APAC/Americas mix shift",
    ]
  },
  {
    ticker:"TSM", name:"Taiwan Semiconductor", price:"$180.40", change:"-1.92%", pos:false, sector:"Semiconductors",
    pills:[
      {dir:"risk",cat:"GPOL", label:"GPOL: Taiwan Strait Escalation Risk", state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: AI Chip Demand Backlog 2yr+", state:"active"},
      {dir:"opp", cat:"GPOL", label:"GPOL: US CHIPS Act $6.6B Subsidy",   state:"active"},
      {dir:"opp", cat:"GEO",  label:"Geo: Japan Kumamoto Fab Expansion",  state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Arizona Ramp Labor Friction",  state:"emerging"},
      {dir:"risk",cat:"SECT", label:"Sector: Supply Concentration Risk",  state:"active"},
      {dir:"risk",cat:"SECT", label:"Sector: Custom Silicon Migration",   state:"emerging"},
    ],
    headlines:[
      "PLA military exercises near Taiwan Strait — TSMC geopolitical risk premium hitting P/E multiple",
      "AI chip demand backlog exceeds 2 years — TSMC CoWoS advanced packaging running at 100% utilization",
      "TSMC Arizona Fab 21 Phase 1 ramping: CHIPS Act $6.6B disbursement tied to workforce targets",
    ]
  },
  {
    ticker:"MS", name:"Morgan Stanley", price:"$118.30", change:"+1.05%", pos:true, sector:"Finance",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: Wealth AUM Record $7.2T",   state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: IPO Pipeline Recovering",    state:"active"},
      {dir:"risk",cat:"MACRO",label:"Macro: Fixed Income Duration Risk",  state:"emerging"},
      {dir:"risk",cat:"MACRO",label:"Macro: Consumer Margin Debt Risk",   state:"emerging"},
    ],
    headlines:[
      "Morgan Stanley E*TRADE wealth AUM hits $7.2T — recurring revenue insulates from trading vol swings",
      "IPO backlog thawing: MS lead-left on $28B of deals in pipeline — fee revenue recovery underway",
      "Duration risk on bond book rising as curve steepens — mark-to-market exposure flagged in stress test",
    ]
  },
  {
    ticker:"AMT", name:"American Tower", price:"$212.80", change:"-0.38%", pos:false, sector:"Infrastructure REIT",
    pills:[
      {dir:"opp", cat:"SECT", label:"Sector: 5G / AI Edge Infrastructure", state:"active"},
      {dir:"risk",cat:"RATE", label:"Rate: REIT Debt → Rate Sensitivity",  state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Data Center Colocation",      state:"emerging"},
      {dir:"risk",cat:"MACRO",label:"Macro: India/Brazil FX Risk",         state:"active"},
    ],
    headlines:[
      "American Tower 5G densification: 14,000 new small cell nodes contracted — AI edge demand driving",
      "Rate sensitivity: $45B debt load making AMT one of highest-beta REIT plays on Fed rate path",
      "India Airtel and Brazil Vivo FX exposure: R$ and INR depreciation shaving $280M from EBITDA",
    ]
  },
  {
    ticker:"RIO", name:"Rio Tinto", price:"$67.20", change:"-0.82%", pos:false, sector:"Diversified Mining",
    pills:[
      {dir:"risk",cat:"GEO",  label:"Geo: China Iron Ore Demand -12%",    state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Lithium / Copper EV Cycle",  state:"active"},
      {dir:"risk",cat:"CLMT", label:"CLMT: Pilbara Water + Climate Risk",  state:"active"},
      {dir:"risk",cat:"GPOL", label:"GPOL: Oyu Tolgoi Mongolia Politics", state:"emerging"},
    ],
    headlines:[
      "China steel output down 12% — Rio Tinto Pilbara iron ore price below $100/t for first time since 2020",
      "Rio Tinto Rincon lithium project on track — EV battery market demand underpinning long-term bid",
      "Pilbara heat records in 2026 summer impact crushing throughput — water licence renewal facing challenge",
    ]
  },
  {
    ticker:"ENPH", name:"Enphase Energy", price:"$68.40", change:"-2.14%", pos:false, sector:"Solar",
    pills:[
      {dir:"risk",cat:"MACRO",label:"Macro: Tariff on Solar Components",   state:"active"},
      {dir:"risk",cat:"RATE", label:"Rate: Higher Rates Slow Resi Solar",  state:"active"},
      {dir:"opp", cat:"CLMT", label:"CLMT: IRA Solar Incentive Resilience",state:"active"},
      {dir:"opp", cat:"SECT", label:"Sector: Battery Storage Add-On",      state:"emerging"},
    ],
    headlines:[
      "Tariffs on Southeast Asia solar cells add $0.08/W cost — Enphase microinverter margin squeeze",
      "30-year mortgage rate at 7.1% cooling residential solar demand — Q1 installs down 18% YoY",
      "IRA Section 48E investment tax credit preserved — Enphase battery storage business +40% YoY",
    ]
  },
  // ── Farming & Mining ─────────────────────────────────────────────────────────
  {
    ticker:"MOS", name:"The Mosaic Company", price:"$28.14", change:"-1.42%", pos:false, sector:"Fertilizer",
    pills:[
      {dir:"risk", cat:"WEATHER",label:"Weather: La Niña Demand Softness",     state:"active"},
      {dir:"risk", cat:"GPOL",   label:"GPOL: Belarus Potash Sanction",         state:"active"},
      {dir:"risk", cat:"MACRO",  label:"Macro: Nat Gas Input Cost Spike",       state:"active"},
      {dir:"opp",  cat:"GPOL",   label:"GPOL: Food Security Policy Demand",     state:"active"},
      {dir:"opp",  cat:"CLMT",   label:"CLMT: Soil Depletion Structural Bid",   state:"emerging"},
    ],
    headlines:[
      "Belarus potash sanctions tighten — Mosaic and Nutrien capture 30%+ of spot market; MOS margins at 7yr high",
      "La Niña pattern reduces corn/soy plantings in Brazil — near-term fertilizer demand overhang softens Q1",
      "EU fertilizer security bill mandates strategic reserves — long-term structural demand signal emerging",
    ]
  },
  {
    ticker:"ADM", name:"Archer-Daniels-Midland", price:"$47.62", change:"-0.89%", pos:false, sector:"Agri Processing",
    pills:[
      {dir:"risk", cat:"GPOL",   label:"GPOL: Ukraine Grain Corridor Block",    state:"active"},
      {dir:"risk", cat:"WEATHER",label:"Weather: Brazil Soy Drought -18%",      state:"active"},
      {dir:"risk", cat:"EARN",   label:"Earnings: Restatement Overhang",         state:"active"},
      {dir:"risk", cat:"MACRO",  label:"Macro: China Soy Tariff Escalation",    state:"emerging"},
      {dir:"opp",  cat:"SECT",   label:"Sector: Global Food Trade Volume",       state:"active"},
    ],
    headlines:[
      "Ukraine harvest logistics disrupted again — ADM reroutes through Romanian Black Sea corridor adding $40/t cost",
      "Brazil Mato Grosso drought cuts soy harvest estimate -18% — ADM origin procurement costs surge",
      "ADM accounting restatement review ongoing — CFO departure compounds governance overhang on stock",
    ]
  },
  {
    ticker:"NEM", name:"Newmont Corporation", price:"$54.88", change:"+2.31%", pos:true, sector:"Gold Mining",
    pills:[
      {dir:"opp",  cat:"GPOL",   label:"GPOL: Gold Safe-Haven $3,100+",         state:"active"},
      {dir:"opp",  cat:"RATE",   label:"Rate: Real Yields Declining → Gold Bid", state:"active"},
      {dir:"opp",  cat:"MACRO",  label:"Macro: Central Bank Buying Surge",       state:"active"},
      {dir:"risk", cat:"CLMT",   label:"CLMT: Water Stress Nevada/Ghana Ops",    state:"active"},
      {dir:"risk", cat:"GPOL",   label:"GPOL: Ghana/Suriname Permit Friction",   state:"emerging"},
    ],
    headlines:[
      "Gold hits $3,110/oz on Iran escalation and central bank buying — NEM earnings upgrade cycle begins",
      "Fed pause extending with real yields falling: gold's structural tailwind strengthening through 2026",
      "NEM Nevada and Ghana operations flagged in ESG review — water table depletion risk elevated by 4th consecutive dry season",
    ]
  },
  {
    ticker:"FCX", name:"Freeport-McMoRan", price:"$43.20", change:"+1.67%", pos:true, sector:"Copper Mining",
    pills:[
      {dir:"opp",  cat:"SECT",   label:"Sector: AI Data Center Copper Demand",  state:"active"},
      {dir:"opp",  cat:"SECT",   label:"Sector: EV Transition Copper Cycle",    state:"active"},
      {dir:"risk", cat:"CLMT",   label:"CLMT: Sonoran Desert Water Scarcity",   state:"active"},
      {dir:"risk", cat:"GPOL",   label:"GPOL: Indonesia Export Tax Risk",       state:"active"},
      {dir:"risk", cat:"GPOL",   label:"GPOL: Peru Mine Labor Disruption",      state:"emerging"},
    ],
    headlines:[
      "AI data center boom driving copper demand +18% YoY — FCX Grasberg mine expansion on track for 2027 peak production",
      "Indonesia signals higher copper export taxes in new mining bill — FCX Grasberg concentrate export margin at risk",
      "Climate scientists warn Sonoran Desert aquifer critically low — FCX Arizona operations face water permit renewal battle",
    ]
  },
];

const STOCKS = RAW_STOCKS.map(s => ({ ...s, ...calcStormScores(s.pills) }));

/* ─── FLAG IMAGE COMPONENT ───────────────────────────────────────────────────── */
// Tries to load real SVG from Graphics/Flags/{code}.svg (4x3 from flag-icons).
// Falls back to emoji if the file isn't found.
function FlagImg({ code, emoji, size = 22 }) {
  const [failed, setFailed] = useState(false);
  const h = Math.round(size * 0.75); // maintain 4:3 ratio
  if (failed) return <span style={{fontSize: size * 0.8, lineHeight:1}}>{emoji}</span>;
  return (
    <img
      src={`../Graphics/Flags/${code}.svg`}
      alt={code}
      onError={() => setFailed(true)}
      style={{width: size, height: h, objectFit:"cover", display:"block", flexShrink:0}}
    />
  );
}

/* ─── NATION DATA ────────────────────────────────────────────────────────────── */
const NATIONS = [
  { code:"us", name:"United States", flag:"🇺🇸", riskScore:48, oppScore:74,
    tags:[
      {dir:"opp", label:"Sector: AI Infrastructure",        state:"active"},
      {dir:"opp", label:"Macro: Labor Market Resilience",   state:"active"},
      {dir:"risk",label:"Policy: Tariff / Trade War Risk",  state:"active"},
      {dir:"risk",label:"Rate: Fed Policy Uncertainty",     state:"fading"},
    ],
    note:"Dominant AI opportunity narrative. Tariff and fiscal policy risk increasing. Net: opportunity convergence with embedded policy risk.",
    relatedTickers:["NVDA","MSFT","AAPL","GS"] },
  { code:"tw", name:"Taiwan", flag:"🇹🇼", riskScore:82, oppScore:61,
    tags:[
      {dir:"risk",label:"Geopolitical: PRC Military Pressure", state:"active"},
      {dir:"risk",label:"Geo: Strait Shipping Disruption",     state:"active"},
      {dir:"opp", label:"Sector: AI Chip Dominance (TSMC)",   state:"active"},
      {dir:"opp", label:"Sector: Sovereign AI Contracts",     state:"active"},
    ],
    note:"Highest geopolitical risk in dataset. Concurrent opportunity via TSMC AI dominance. Classic Perfect Storm of concurrent risk and opportunity.",
    relatedTickers:["TSM","NVDA","AAPL","AMD"] },
  { code:"cn", name:"China", flag:"🇨🇳", riskScore:71, oppScore:38,
    tags:[
      {dir:"risk",label:"Geopolitical: US Export Controls",   state:"active"},
      {dir:"risk",label:"Macro: Property Sector Drag",        state:"active"},
      {dir:"risk",label:"Policy: Regulatory Crackdown",       state:"fading"},
      {dir:"opp", label:"Sector: Domestic AI Champions",      state:"emerging"},
    ],
    note:"Significant risk convergence from multiple vectors. Domestic AI investment (Baidu, DeepSeek) providing partial opportunity offset.",
    relatedTickers:["BABA","BIDU","JD","TCEHY"] },
  { code:"de", name:"Germany", flag:"🇩🇪", riskScore:54, oppScore:32,
    tags:[
      {dir:"risk",label:"Macro: Industrial Contraction",      state:"active"},
      {dir:"risk",label:"Energy: Fossil Transition Cost",     state:"active"},
      {dir:"opp", label:"Policy: €85B Defense Surge",        state:"active"},
      {dir:"opp", label:"Policy: Green Infra Investment",    state:"emerging"},
    ],
    note:"Manufacturing sector under pressure. Defense spending pivot creating partial offset. Auto sector exposed to EV transition.",
    relatedTickers:["VOW","BMW","SIE","RTX","LMT"] },
  { code:"sa", name:"Saudi Arabia", flag:"🇸🇦", riskScore:35, oppScore:68,
    tags:[
      {dir:"opp", label:"Policy: Vision 2030 Capex Wave",    state:"active"},
      {dir:"opp", label:"Sector: Sovereign AI Buildout",     state:"active"},
      {dir:"opp", label:"Macro: Oil Revenue Windfall",       state:"active"},
      {dir:"risk",label:"Geopolitical: Iran Proxy Risk",     state:"emerging"},
    ],
    note:"Major opportunity node — Vision 2030 and sovereign AI investments creating significant capex flows. Geopolitical risk remains latent.",
    relatedTickers:["ARAMCO","NVDA","MSFT"] },
  { code:"ir", name:"Iran", flag:"🇮🇷", riskScore:88, oppScore:12,
    tags:[
      {dir:"risk",label:"GPOL: Strait of Hormuz Threat",     state:"active"},
      {dir:"risk",label:"GPOL: US Carrier Group Escalation", state:"active"},
      {dir:"risk",label:"Policy: SWIFT Sanctions Regime",    state:"active"},
      {dir:"risk",label:"Macro: Oil Export Disruption",      state:"active"},
    ],
    note:"Highest active geopolitical risk node. Hormuz threat rippling across energy, airlines, and defense sectors globally. Epicenter of the current risk storm.",
    relatedTickers:["XOM","RTX","LMT","DAL","AAL"] },
  { code:"ua", name:"Ukraine", flag:"🇺🇦", riskScore:76, oppScore:42,
    tags:[
      {dir:"risk",label:"GPOL: Active Conflict Zone",        state:"active"},
      {dir:"risk",label:"SUPPLY: Grain/Fertilizer Shock",    state:"fading"},
      {dir:"opp", label:"Policy: EU Reconstruction Wave",    state:"emerging"},
      {dir:"opp", label:"Sector: Defense Tech Proving Ground", state:"active"},
    ],
    note:"Active war zone. EU reconstruction pipeline emerging as multi-year investment opportunity. Defense technology validation accelerating procurement.",
    relatedTickers:["RTX","LMT","BA"] },
  { code:"ru", name:"Russia", flag:"🇷🇺", riskScore:81, oppScore:8,
    tags:[
      {dir:"risk",label:"GPOL: Global Sanction Regime",      state:"active"},
      {dir:"risk",label:"Macro: Energy Revenue Constrained", state:"active"},
      {dir:"risk",label:"GPOL: NATO Confrontation Risk",     state:"active"},
    ],
    note:"Under comprehensive sanctions regime. Energy exports rerouted through China/India. Western corporate exposure near zero. Geopolitical escalation risk persists.",
    relatedTickers:["XOM"] },
  { code:"il", name:"Israel", flag:"🇮🇱", riskScore:72, oppScore:55,
    tags:[
      {dir:"risk",label:"GPOL: Iran Direct Strike Risk",     state:"active"},
      {dir:"risk",label:"GPOL: Regional Conflict Expansion", state:"active"},
      {dir:"opp", label:"Sector: Cybersecurity Export Boom", state:"active"},
      {dir:"opp", label:"Sector: Defense Tech Innovation",   state:"active"},
    ],
    note:"Concurrent risk and opportunity. Direct Iran conflict risk balanced by defense tech and cybersecurity export surge. Key US defense partner in regional theater.",
    relatedTickers:["CHKP","CRWD","RTX","LMT"] },
  { code:"gb", name:"United Kingdom", flag:"🇬🇧", riskScore:38, oppScore:55,
    tags:[
      {dir:"opp", label:"Policy: UK Defense Spending +20%",  state:"active"},
      {dir:"opp", label:"Sector: Fintech Regulatory Clarity", state:"active"},
      {dir:"risk",label:"Macro: Stagflation Headwinds",      state:"fading"},
      {dir:"risk",label:"Policy: Post-Brexit Trade Friction", state:"fading"},
    ],
    note:"Defense spending surge aligns with NATO commitments. Fintech and AI policy environment improving. Macro stabilizing after inflation shock.",
    relatedTickers:["BAE","GSK","HSBC","LMT"] },
  { code:"jp", name:"Japan", flag:"🇯🇵", riskScore:42, oppScore:58,
    tags:[
      {dir:"opp", label:"Macro: Yen Carry Unwind Fading",    state:"fading"},
      {dir:"opp", label:"Policy: Defense Budget Doubled",    state:"active"},
      {dir:"opp", label:"Sector: Semiconductor FDI Wave",    state:"active"},
      {dir:"risk",label:"GPOL: China Taiwan Proximity",      state:"active"},
    ],
    note:"Defense spending doubling — TSMC Kumamoto fab attracting semiconductor FDI. China proximity creates persistent geopolitical overhang on supply chain.",
    relatedTickers:["TSM","SONY","TM","6501"] },
  { code:"in", name:"India", flag:"🇮🇳", riskScore:28, oppScore:77,
    tags:[
      {dir:"opp", label:"Macro: Fastest G20 GDP Growth",     state:"active"},
      {dir:"opp", label:"Sector: AI + Tech FDI Inflow",      state:"active"},
      {dir:"opp", label:"GPOL: Western Supply Chain Alt",    state:"active"},
      {dir:"risk",label:"Geo: China Border Tensions",        state:"fading"},
    ],
    note:"Highest opportunity score outside of US AI cluster. Supply chain diversification from China flowing to India. Modi manufacturing push gaining traction.",
    relatedTickers:["INFY","WIPRO","MSFT","AAPL"] },
];

/* ─── STORM VIEW CLUSTERS ─────────────────────────────────────────────────────  */
const CLUSTERS = [
  { id:"iran",      label:"⚔ GPOL: Iran Conflict",     col:"#EF4444", cx:148, cy:228, rx:168, ry:92,  members:["RTX","LMT","XOM","NOC"] },
  { id:"fuel",      label:"⚠ Iran Fuel Spike",          col:"#F97316", cx:352, cy:270, rx:138, ry:95,  members:["DAL","AAL","XOM","UAL","ZIM"] },
  { id:"tariff",    label:"⚠ MACRO: Tariff Wave",       col:"#EF4444", cx:560, cy:318, rx:182, ry:95,  members:["AAPL","TSLA","DAL","AMZN","WMT","ENPH"] },
  { id:"ai",        label:"✦ SECT: AI Opportunity",     col:"#22C55E", cx:942, cy:225, rx:198, ry:112, members:["NVDA","MSFT","AMD","GS","LIN","AMT"] },
  { id:"china",     label:"⚠ GPOL: China Export",       col:"#EF4444", cx:1070, cy:248, rx:128, ry:85, members:["NVDA","AMD","TSM","AAPL"] },
  { id:"defense2",  label:"⚔ DEFENSE Surge",            col:"#EF4444", cx:115, cy:242, rx:118, ry:80,  members:["RTX","LMT","NOC"] },
  { id:"aiinfra",   label:"✦ AI INFRA Stack",            col:"#22C55E", cx:978, cy:232, rx:195, ry:102, members:["NVDA","TSM","LIN","AMT"] },
  { id:"finance2",  label:"✦ CAPITAL MARKETS",          col:"#22C55E", cx:792, cy:260, rx:115, ry:95,  members:["GS","JPM","MS","COIN"] },
  { id:"pharma",    label:"⚕ PHARMA: Split Signal",     col:"#A78BFA", cx:1272, cy:260, rx:105, ry:80, members:["LLY","PFE","UNH"] },
  { id:"etrans",    label:"⚡ ENERGY TRANSITION",       col:"#22C55E", cx:468, cy:442, rx:128, ry:85,  members:["NEE","ENPH","TSLA","FCX"] },
  { id:"shipping",  label:"⚓ RED SEA ROUTE",           col:"#F97316", cx:425, cy:385, rx:115, ry:162, members:["ZIM","DAL","AAL","UAL"] },
  { id:"rareearth", label:"⚔ CRITICAL MINERALS",       col:"#EF4444", cx:215, cy:492, rx:190, ry:80,  members:["MP","NEM","FCX","CLF","MOS","RIO"] },
  { id:"weather",   label:"⛈ CLMT / WEATHER Risk",     col:"#60A5FA", cx:175, cy:520, rx:185, ry:80,  members:["MOS","ADM","NEM","FCX","CF","DE"] },
  { id:"commodgeo", label:"⚔ GPOL: Commodity Belt",    col:"#F59E0B", cx:168, cy:513, rx:158, ry:75,  members:["MOS","ADM","NEM","CF","XOM"] },
];

/* ─── COLORS ─────────────────────────────────────────────────────────────────── */
const C = {
  bg:"#0B1426", bgCard:"#0F1D35", bgCard2:"#132240", bgCard3:"#0C192E",
  border:"#1E3A5F", border2:"#243F6A",
  navLeft:"#0D1F38", navRight:"#091628",
  accent:"#0EA5E9", risk:"#EF4444", opp:"#22C55E", warn:"#F59E0B",
  purple:"#A78BFA",
  text:"#FFFFFF", textMid:"#CBD5E1", textDim:"#8899AA",
  mono:"'IBM Plex Mono', monospace",
  sans:"'IBM Plex Sans', sans-serif",
  inst:"'Instrument Sans', sans-serif",
};

/* ─── WAVE CANVAS ────────────────────────────────────────────────────────────── */
function WaveBar({ riskScore, oppScore }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const phaseRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const calm = riskScore < 15 && oppScore < 15;
    const rDom = riskScore >= oppScore;
    const intensity = Math.max(riskScore, oppScore) / 100;
    const amp   = calm ? 1.2 : 3 + intensity * 13;
    const freq  = 0.018 + intensity * 0.008;
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
        ctx.strokeStyle = "#2D4A6A"; ctx.lineWidth = 1; ctx.stroke();
        rafRef.current = requestAnimationFrame(draw); return;
      }
      const primCol = rDom ? C.risk : C.opp;
      const secScore = rDom ? oppScore : riskScore;
      const secCol   = rDom ? C.opp : C.risk;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x++) {
        const y = H * 0.5 + amp * Math.sin(x * freq * Math.PI * 2 + phase) - amp * 0.15;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, primCol + "55"); gr.addColorStop(1, primCol + "08");
      ctx.fillStyle = gr; ctx.fill();
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const y = H * 0.5 + amp * Math.sin(x * freq * Math.PI * 2 + phase) - amp * 0.15;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = primCol + "BB"; ctx.lineWidth = 1.5; ctx.stroke();
      if (secScore > 22) {
        const sAmp = (secScore / 100) * 5;
        ctx.beginPath();
        for (let x = 0; x <= W; x++) {
          const y = H * 0.65 + sAmp * Math.sin(x * freq * Math.PI * 2 * 1.4 + phase * 0.8 + Math.PI * 0.6);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = secCol + "60"; ctx.lineWidth = 1; ctx.stroke();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [riskScore, oppScore]);

  return <canvas ref={canvasRef} width={600} height={40} style={{width:"100%",height:40,display:"block"}} />;
}

/* ─── PILL ───────────────────────────────────────────────────────────────────── */
function Pill({ dir, cat, label, state, compact, isNew }) {
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
        background: isNew ? col + "33" : bg, color: col, opacity,
        border: `1px solid ${isNew ? col : col + "44"}`,
        flexShrink:0,
      }}>
        {isRisk ? "!" : "+"} {short}
        {state === "emerging" && <span style={{fontSize:7,opacity:.7}}>◌</span>}
        {state === "fading"   && <span style={{fontSize:7,opacity:.7}}>↓</span>}
        {isNew                && <span style={{fontSize:7,color:col}}>●</span>}
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
      flexShrink:0,
    }}>
      <span style={{fontSize:9, fontWeight:700}}>{isRisk ? "⚠" : "✦"}</span>
      <span style={{color:"#94A3B8", fontSize:9, marginRight:1}}>{cat}</span>
      <span>{label}</span>
      {state === "emerging" && <span style={{fontSize:9, marginLeft:4, opacity:.7}}>◌ EMERGING</span>}
      {state === "fading"   && <span style={{fontSize:9, marginLeft:4, opacity:.7}}>↓ FADING</span>}
    </div>
  );
}

/* ─── SCORE BAR ──────────────────────────────────────────────────────────────── */
function ScoreBar({ score, color, label }) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:8}}>
      <span style={{fontSize:9, fontFamily:C.mono, color:"#94A3B8", width:28, textAlign:"right", letterSpacing:"0.08em"}}>{label}</span>
      <div style={{flex:1, height:3, background:"#1E3A5F", position:"relative"}}>
        <div style={{position:"absolute", left:0, top:0, bottom:0, width:`${score}%`, background:color, transition:"width 0.6s ease"}} />
      </div>
      <span style={{fontSize:10, fontFamily:C.mono, color, fontWeight:600, width:24}}>{score}</span>
    </div>
  );
}

/* ─── TICKER TAPE ────────────────────────────────────────────────────────────── */
function TickerTape({ items }) {
  const text = items.slice(-10).reverse()
    .map(i => `${i.src.toUpperCase()}: ${i.headline}`).join("   ·   ");

  return (
    <div style={{
      overflow:"hidden", whiteSpace:"nowrap", height:22,
      background:"#050E1E", borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center",
    }}>
      <span style={{
        fontFamily:C.mono, fontSize:8.5, color:"#22C55E",
        padding:"0 8px", flexShrink:0, letterSpacing:"0.08em",
      }}>● LIVE</span>
      <div style={{flex:1, overflow:"hidden", position:"relative"}}>
        <div style={{
          display:"inline-block",
          animation:"tickerScroll 90s linear infinite",
          fontFamily:C.mono, fontSize:8.5, color:C.textDim, letterSpacing:"0.04em",
        }}>
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </div>
      </div>
    </div>
  );
}

/* ─── STOCK CARD ─────────────────────────────────────────────────────────────── */
function StockCard({ stock, expanded, onToggle, newTickers }) {
  const prevailing = stock.pills.filter(p => p.state === "active").slice(0, 2);
  const rDom = stock.riskScore >= stock.oppScore;
  const stormLabel = (() => {
    const diff = Math.abs(stock.riskScore - stock.oppScore);
    if (stock.riskScore < 20 && stock.oppScore < 20) return { text:"CALM", col:C.textDim };
    if (diff < 15) return { text:"TENSION", col:C.warn };
    return rDom
      ? { text:`RISK ×${stock.pills.filter(p=>p.dir==="risk").length}`, col:C.risk }
      : { text:`OPP ×${stock.pills.filter(p=>p.dir==="opp").length}`,   col:C.opp };
  })();
  const hasNewSignal = newTickers?.includes(stock.ticker);

  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${hasNewSignal ? C.accent + "88" : C.border}`,
      marginBottom:8, overflow:"hidden", flexShrink:0,
      transition:"border-color 0.5s",
    }}>
      <div onClick={onToggle} style={{
        display:"flex", flexDirection:"column", cursor:"pointer",
        background: expanded ? C.bgCard2 : C.bgCard,
        borderBottom: expanded ? `1px solid ${C.border}` : "none",
        transition:"background .18s", userSelect:"none",
      }}>
        {/* Title row */}
        <div style={{height:36, display:"flex", alignItems:"center", padding:"0 12px 0 0", gap:8}}>
          <div style={{width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline
                points={expanded ? "2,3.5 5,6.5 8,3.5" : "3.5,2 6.5,5 3.5,8"}
                stroke="#8899AA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{fontFamily:C.inst, fontSize:13, fontWeight:700, color:"#FFFFFF", letterSpacing:"-0.01em"}}>{stock.ticker}</span>
          {hasNewSignal && (
            <span style={{fontFamily:C.mono, fontSize:8, color:C.accent, letterSpacing:"0.1em",
              background:C.accent+"22", border:`1px solid ${C.accent}44`, padding:"1px 5px"}}>
              NEW SIGNAL
            </span>
          )}
          <span style={{fontFamily:C.sans, fontSize:11, color:"#CBD5E1", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{stock.name}</span>
          <div style={{textAlign:"right", flexShrink:0}}>
            <div style={{fontFamily:C.mono, fontSize:11, color:"#FFFFFF", fontWeight:500}}>{stock.price}</div>
            <div style={{fontFamily:C.mono, fontSize:9, color: stock.pos ? C.opp : C.risk, letterSpacing:"0.05em"}}>{stock.change}</div>
          </div>
        </div>
        {/* Pill row */}
        {!expanded && prevailing.length > 0 && (
          <div style={{display:"flex", gap:4, flexWrap:"wrap", padding:"0 12px 8px 36px"}}>
            {prevailing.map((p, i) => <Pill key={i} {...p} compact isNew={hasNewSignal && i === 0} />)}
          </div>
        )}
      </div>

      <WaveBar riskScore={stock.riskScore} oppScore={stock.oppScore} />

      {expanded && (
        <div style={{padding:"12px 14px 14px", borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
            <span style={{fontFamily:C.mono, fontSize:9, letterSpacing:"0.14em", fontWeight:700, color:stormLabel.col}}>{stormLabel.text}</span>
            <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.06em"}}>{stock.sector}</span>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:5, marginBottom:12}}>
            <ScoreBar score={stock.riskScore} color={C.risk} label="RISK" />
            <ScoreBar score={stock.oppScore}  color={C.opp}  label="OPP" />
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:4, marginBottom:12}}>
            {stock.pills.map((p, i) => <Pill key={i} {...p} />)}
          </div>
          <div style={{height:1, background:C.border, marginBottom:10}} />
          <div style={{display:"flex", flexDirection:"column", gap:6}}>
            {stock.headlines.map((h, i) => (
              <div key={i} style={{display:"flex", gap:8, alignItems:"flex-start"}}>
                <span style={{color:C.textDim, fontFamily:C.mono, fontSize:9, marginTop:2, flexShrink:0}}>→</span>
                <span style={{fontFamily:C.sans, fontSize:11, color:C.textMid, lineHeight:1.5}}>{h}</span>
              </div>
            ))}
          </div>
          {/* Signal source tags */}
          <div style={{marginTop:10, display:"flex", gap:4, flexWrap:"wrap"}}>
            {[...new Set(stock.pills.map(p => p.cat))].map(cat => (
              <span key={cat} style={{
                fontFamily:C.mono, fontSize:8, padding:"1px 6px",
                background:C.bgCard2, border:`1px solid ${C.border}`, color:C.textDim,
              }}>{cat}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CARDS VIEW ─────────────────────────────────────────────────────────────── */
function CardsView({ newTickers, secsSince, numCols }) {
  const [expanded, setExpanded] = useState(new Set(["DAL"]));
  const [sort, setSort]         = useState("storm");
  const [filter, setFilter]     = useState("all");

  const toggle = (t) => setExpanded(p => {
    const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n;
  });

  const sorted = [...STOCKS]
    .filter(s =>
      filter === "all"  ? true :
      filter === "risk" ? s.riskScore > 30 :
      filter === "opp"  ? s.oppScore  > 30 :
      filter === "calm" ? s.riskScore < 20 && s.oppScore < 20 : true
    )
    .sort((a, b) => {
      // When filtered by risk/opp: sort by pill count first (more signals = top),
      // then by score as tiebreaker.  Mixed signals (risk + opp) stay middle-ranked.
      if (filter === "risk" || sort === "risk") {
        const ac = a.pills.filter(p => p.dir === "risk").length;
        const bc = b.pills.filter(p => p.dir === "risk").length;
        return bc !== ac ? bc - ac : b.riskScore - a.riskScore;
      }
      if (filter === "opp" || sort === "opp") {
        const ac = a.pills.filter(p => p.dir === "opp").length;
        const bc = b.pills.filter(p => p.dir === "opp").length;
        return bc !== ac ? bc - ac : b.oppScore - a.oppScore;
      }
      return b.stormScore - a.stormScore;
    });

  const btnStyle = (active) => ({
    fontFamily:C.mono, fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
    padding:"4px 10px", border:`1px solid ${active ? C.accent : C.border2}`,
    background: active ? C.accent + "22" : "transparent",
    color: active ? C.accent : "#94A3B8", cursor:"pointer",
  });

  return (
    <div style={{flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"8px 16px",
        background:C.navLeft, borderBottom:`1px solid ${C.border}`, flexShrink:0,
      }}>
        <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>SORT</span>
        {[["storm","STORM"],["risk","RISK"],["opp","OPP"]].map(([k,v]) => (
          <button key={k} onClick={() => setSort(k)} style={btnStyle(sort===k)}>{v}</button>
        ))}
        <div style={{width:1, height:16, background:C.border, margin:"0 4px"}} />
        <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>FILTER</span>
        {[["all","ALL"],["risk","RISK"],["opp","OPP"],["calm","CALM"]].map(([k,v]) => (
          <button key={k} onClick={() => setFilter(k)} style={btnStyle(filter===k)}>{v}</button>
        ))}
        <span style={{marginLeft:"auto", fontFamily:C.mono, fontSize:9, color:C.textDim}}>
          {sorted.length} stocks
        </span>
        <span style={{fontFamily:C.mono, fontSize:9, color: secsSince < 3 ? C.opp : C.textDim, transition:"color 0.5s"}}>
          {secsSince < 3 ? "● UPDATED" : `↻ ${secsSince}s ago`}
        </span>
      </div>
      <div style={{flex:1, display:"flex", overflow:"hidden"}}>
        {Array.from({length: numCols}, (_, ci) => {
          const colStocks = sorted.filter((_, idx) => idx % numCols === ci);
          return (
            <div key={ci} style={{
              flex:1, overflowY:"auto", padding:"10px 8px",
              borderRight: ci < numCols - 1 ? `1px solid ${C.border}22` : "none",
            }}>
              {colStocks.map(s => (
                <StockCard
                  key={s.ticker}
                  stock={s}
                  expanded={expanded.has(s.ticker)}
                  onToggle={() => toggle(s.ticker)}
                  newTickers={newTickers}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── STORM VIEW HELPERS ─────────────────────────────────────────────────────── */

// Organic blob path generator.
// organicness=0 → perfect circle (radius = max(rx,ry))
// organicness=1 → fully organic blob with ticker-influenced hull.
// memberNodes:   array of {x,y} for member stocks — blob "hugs" them (doubled clearance).
// extraClearZones: array of {x,y,r} — additional obstacle zones (label boxes, etc.)
function blobPath(cx, cy, rx, ry, seed, organicness, memberNodes = [], extraClearZones = []) {
  // Circle interpolation: at organicness=0 the surround is a perfect circle
  const baseR      = Math.max(rx, ry);
  const effRx      = baseR + (rx - baseR) * organicness;
  const effRy      = baseR + (ry - baseR) * organicness;

  const N = 16; // control points
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;

    // Multi-harmonic organic perturbation (zero when organicness=0)
    const orgPerturb = organicness * (
      Math.sin(seed * 1.13 + a * 2.4)  * 0.22 +
      Math.sin(seed * 2.71 + a * 3.2)  * 0.14 +
      Math.sin(seed * 0.83 + a * 5.8)  * 0.08 +
      Math.sin(seed * 3.17 + a * 7.3)  * 0.04
    );

    // Hull pull: blob reaches toward member nodes in this angular direction
    let memberPull = 0;
    if (memberNodes.length > 0 && organicness > 0.04) {
      memberNodes.forEach(p => {
        const nodeAngle = Math.atan2(p.y - cy, p.x - cx);
        let da = Math.abs(nodeAngle - a);
        if (da > Math.PI) da = Math.PI * 2 - da;
        if (da < Math.PI * 0.45) {
          const aw   = 1 - da / (Math.PI * 0.45);
          const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
          memberPull = Math.max(memberPull, aw * (dist / Math.max(effRx, effRy)) * 0.30 * organicness);
        }
      });
    }

    const r = 1 + orgPerturb + memberPull;
    pts.push([cx + effRx * r * Math.cos(a), cy + effRy * r * Math.sin(a)]);
  }

  // Clearance: push control points away from ticker pill centers (doubled radius = 52px)
  const TICKER_CLEARANCE = 52;
  for (let i = 0; i < pts.length; i++) {
    memberNodes.forEach(node => {
      const dx = pts[i][0] - node.x;
      const dy = pts[i][1] - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0 && dist < TICKER_CLEARANCE) {
        const push = (TICKER_CLEARANCE - dist) / dist;
        pts[i] = [pts[i][0] + dx * push, pts[i][1] + dy * push];
      }
    });
    // Also respect extra clear zones (cluster label boxes, etc.)
    extraClearZones.forEach(zone => {
      const dx = pts[i][0] - zone.x;
      const dy = pts[i][1] - zone.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0 && dist < zone.r) {
        const push = (zone.r - dist) / dist;
        pts[i] = [pts[i][0] + dx * push, pts[i][1] + dy * push];
      }
    });
  }

  // Catmull-Rom → cubic bezier smooth closed curve
  const n = pts.length;
  const T = 0.38;
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const cp1x = p1[0] + (p2[0] - p0[0]) * T;
    const cp1y = p1[1] + (p2[1] - p0[1]) * T;
    const cp2x = p2[0] - (p3[0] - p1[0]) * T;
    const cp2y = p2[1] - (p3[1] - p1[1]) * T;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

// Gravity: multi-cluster stocks pulled toward centroid of their cluster centers
function applyGravity(baseNodes, gravity) {
  if (gravity < 0.01) return baseNodes;
  const result = {};
  Object.entries(baseNodes).forEach(([ticker, pos]) => {
    const mine = CLUSTERS.filter(c => c.members.includes(ticker));
    if (mine.length <= 1) { result[ticker] = pos; return; }
    const gcx  = mine.reduce((s, c) => s + c.cx, 0) / mine.length;
    const gcy  = mine.reduce((s, c) => s + c.cy, 0) / mine.length;
    const pull = gravity * 0.45;
    result[ticker] = {
      x: pos.x + (gcx - pos.x) * pull,
      y: pos.y + (gcy - pos.y) * pull,
    };
  });
  return result;
}

/* ─── STORM VIEW LABEL COLLISION RESOLVER ───────────────────────────────────── */
// Each element (ticker pill, cluster label) carries invisible ELEM_PAD padding.
// Labels are repositioned iteratively until no padded bounding boxes overlap.
const TICKER_PW = 44, TICKER_PH = 22; // ticker pill pixel dimensions
const ELEM_PAD  = 5;                   // invisible padding around every element

function resolveLabels(clusters, nodes) {
  // Build initial label rects: upper-center area inside each cluster blob
  const labels = clusters.map(c => {
    const w = c.label.length * 6.8 + 14;
    const h = 20;
    return { x: c.cx - w / 2, y: c.cy - c.ry * 0.48 - h / 2, w, h };
  });

  for (let iter = 0; iter < 8; iter++) {
    // Pass A: push labels away from every visible ticker pill (with padding)
    for (const lbl of labels) {
      for (const pos of Object.values(nodes)) {
        if (!pos) continue;
        const tx1 = pos.x - TICKER_PW / 2 - ELEM_PAD, ty1 = pos.y - TICKER_PH / 2 - ELEM_PAD;
        const tx2 = pos.x + TICKER_PW / 2 + ELEM_PAD, ty2 = pos.y + TICKER_PH / 2 + ELEM_PAD;
        const lx1 = lbl.x - ELEM_PAD,       ly1 = lbl.y - ELEM_PAD;
        const lx2 = lbl.x + lbl.w + ELEM_PAD, ly2 = lbl.y + lbl.h + ELEM_PAD;
        if (lx1 >= tx2 || lx2 <= tx1 || ly1 >= ty2 || ly2 <= ty1) continue; // no overlap
        const lcx = lbl.x + lbl.w / 2, lcy = lbl.y + lbl.h / 2;
        const dx = lcx - pos.x, dy = lcy - pos.y;
        const overlapX = Math.min(lx2 - tx1, tx2 - lx1);
        const overlapY = Math.min(ly2 - ty1, ty2 - ly1);
        if (overlapX < overlapY) { lbl.x += dx >= 0 ?  overlapX : -overlapX; }
        else                     { lbl.y += dy >= 0 ?  overlapY : -overlapY; }
      }
    }

    // Pass B: push labels away from each other (with padding)
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const a = labels[i], b = labels[j];
        const ax1 = a.x - ELEM_PAD, ay1 = a.y - ELEM_PAD;
        const ax2 = a.x + a.w + ELEM_PAD, ay2 = a.y + a.h + ELEM_PAD;
        const bx1 = b.x - ELEM_PAD, by1 = b.y - ELEM_PAD;
        const bx2 = b.x + b.w + ELEM_PAD, by2 = b.y + b.h + ELEM_PAD;
        if (ax1 >= bx2 || ax2 <= bx1 || ay1 >= by2 || ay2 <= by1) continue;
        const dx = (b.x + b.w / 2) - (a.x + a.w / 2);
        const dy = (b.y + b.h / 2) - (a.y + a.h / 2);
        const overlapX = Math.min(ax2 - bx1, bx2 - ax1) / 2;
        const overlapY = Math.min(ay2 - by1, by2 - ay1) / 2;
        if (overlapX < overlapY) {
          a.x -= dx >= 0 ? overlapX : -overlapX;
          b.x += dx >= 0 ? overlapX : -overlapX;
        } else {
          a.y -= dy >= 0 ? overlapY : -overlapY;
          b.y += dy >= 0 ? overlapY : -overlapY;
        }
      }
    }
  }

  return labels; // [{ x, y, w, h }, ...]
}

/* ─── STORM VIEW ─────────────────────────────────────────────────────────────── */
function StormView() {
  const [selected,    setSelected]    = useState(null);
  const [organicness, setOrganicness] = useState(0.55);
  const [gravity,     setGravity]     = useState(0.40);
  const [showAll,     setShowAll]     = useState(false);
  const selectedStock = STOCKS.find(s => s.ticker === selected);
  const svgRef = useRef(null);
  const svgW = 1400, svgH = 760;

  // Zoom state
  const [vb, setVb] = useState({x:0, y:0, w:svgW, h:svgH});
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx   = (e.clientX - rect.left)  / rect.width  * vb.w + vb.x;
      const my   = (e.clientY - rect.top)   / rect.height * vb.h + vb.y;
      const fac  = e.deltaY > 0 ? 1.13 : 0.88;
      const nw   = Math.max(280, Math.min(svgW * 2.5, vb.w * fac));
      const nh   = nw * (svgH / svgW);
      setVb({ x: mx - (mx - vb.x) * (nw / vb.w), y: my - (my - vb.y) * (nh / vb.h), w: nw, h: nh });
    };
    el.addEventListener('wheel', handler, {passive:false});
    return () => el.removeEventListener('wheel', handler);
  }, [vb]);

  // All 34 stock nodes across the 1400×760 canvas
  const BASE_NODES = {
    // Defense (upper-left)
    RTX:{x:85,y:215},  LMT:{x:88,y:275},  NOC:{x:172,y:242},
    // Energy
    XOM:{x:278,y:195},
    // Airlines
    DAL:{x:378,y:258}, AAL:{x:432,y:308}, UAL:{x:312,y:328},
    // Consumer / Tariff zone
    TSLA:{x:548,y:358}, AMZN:{x:642,y:328}, AAPL:{x:672,y:318}, WMT:{x:578,y:432},
    // Energy transition / bottom-center-left
    NEE:{x:418,y:448}, DE:{x:298,y:448}, ENPH:{x:488,y:492},
    // Finance (center-right)
    GS:{x:822,y:192},  JPM:{x:758,y:262}, MS:{x:798,y:328}, COIN:{x:888,y:352},
    // AI / Tech (right band)
    NVDA:{x:1052,y:182}, MSFT:{x:948,y:242}, AMD:{x:1018,y:298},
    LIN:{x:882,y:208},   AMT:{x:838,y:292}, TSM:{x:1128,y:252},
    // Pharma (far right)
    LLY:{x:1262,y:218}, PFE:{x:1322,y:272}, UNH:{x:1238,y:298},
    // Mining / Materials (bottom-left band)
    NEM:{x:222,y:448}, MOS:{x:68,y:508},  ADM:{x:162,y:542},
    FCX:{x:368,y:512}, MP:{x:132,y:458},  CLF:{x:282,y:542},
    CF:{x:62,y:588},   ZIM:{x:472,y:518}, RIO:{x:188,y:618},
  };
  const nodes = applyGravity(BASE_NODES, gravity);

  // Collision-resolved cluster label positions (recomputed when gravity changes node positions)
  const labelMeta = useMemo(() => resolveLabels(CLUSTERS, nodes), [nodes]);

  // Active filter: hide very low storm-score stocks unless showAll
  const visibleTickers = Object.keys(BASE_NODES).filter(t => {
    if (showAll) return true;
    const s = STOCKS.find(s => s.ticker === t);
    return !s || s.stormScore > 18;
  });

  const sliderRow = (label, val, setVal, presets) => (
    <div style={{display:"flex", alignItems:"center", gap:6}}>
      <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", minWidth:52}}>{label}</span>
      <input type="range" min={0} max={1} step={0.01} value={val}
        onChange={e => setVal(Number(e.target.value))}
        style={{width:76, accentColor:C.accent, cursor:"pointer"}}
      />
      <span style={{fontFamily:C.mono, fontSize:9, color:C.accent, minWidth:24, textAlign:"right"}}>
        {Math.round(val * 100)}%
      </span>
      <div style={{display:"flex", gap:2}}>
        {presets.map(([v, lbl]) => (
          <button key={v} onClick={() => setVal(v)} style={{
            fontFamily:C.mono, fontSize:8, padding:"2px 5px",
            background: Math.abs(val - v) < 0.06 ? C.accent+"22" : "transparent",
            border:`1px solid ${Math.abs(val - v) < 0.06 ? C.accent : C.border2}`,
            color: Math.abs(val - v) < 0.06 ? C.accent : C.textDim, cursor:"pointer",
          }}>{lbl}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{flex:1, display:"flex", overflow:"hidden"}}>
      <div style={{flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>

        {/* ── Controls strip ── */}
        <div style={{
          display:"flex", alignItems:"center", gap:14, padding:"6px 14px", flexShrink:0,
          background:C.bgCard2, borderBottom:`1px solid ${C.border}`, flexWrap:"wrap",
        }}>
          <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>SURROUND STYLE</span>
          <div style={{width:1, height:16, background:C.border}} />
          {sliderRow("ORGANIC", organicness, setOrganicness, [[0,"circle"],[0.5,"mid"],[1,"organic"]])}
          <div style={{width:1, height:16, background:C.border}} />
          {sliderRow("GRAVITY", gravity, setGravity, [[0,"none"],[0.4,"gentle"],[1,"strong"]])}
          <div style={{width:1, height:16, background:C.border}} />
          <button onClick={() => setShowAll(v => !v)} style={{
            fontFamily:C.mono, fontSize:8, padding:"2px 7px", cursor:"pointer",
            background: showAll ? C.accent+"22" : "transparent",
            border:`1px solid ${showAll ? C.accent : C.border2}`,
            color: showAll ? C.accent : C.textDim,
          }}>{showAll ? "ALL TICKERS" : "ACTIVE ONLY"}</button>
          <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, marginLeft:"auto"}}>
            scroll to zoom
          </span>
          <button onClick={() => setVb({x:0, y:0, w:svgW, h:svgH})} style={{
            fontFamily:C.mono, fontSize:8, padding:"2px 7px", cursor:"pointer",
            background:"transparent", border:`1px solid ${C.border2}`, color:C.textDim,
          }}>reset zoom</button>
        </div>

        {/* ── SVG map ── */}
        <div style={{flex:1, overflow:"hidden"}}>
          <svg
            ref={svgRef}
            viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`}
            style={{width:"100%", height:"100%", display:"block", cursor:"crosshair"}}
          >
            <defs>
              {CLUSTERS.map(c => (
                <radialGradient key={c.id} id={`grad-${c.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={c.col} stopOpacity="0.13" />
                  <stop offset="100%" stopColor={c.col} stopOpacity="0.02" />
                </radialGradient>
              ))}
              <filter id="blob-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* ── LEGEND — top of canvas ── */}
            <g transform="translate(16, 18)">
              <text fontFamily={C.mono} fontSize={9} fill={C.textDim} letterSpacing="0.08em">LEGEND</text>
              {[
                {col:C.risk,  label:"Risk surround"},
                {col:C.opp,   label:"Opportunity"},
                {col:"#60A5FA",label:"Weather / Climate"},
                {col:C.warn,  label:"Multi-force tension (dashed halo)"},
              ].map((l, i) => (
                <g key={i} transform={`translate(${i * 185}, 13)`}>
                  <rect width={8} height={8} fill={l.col+"44"} stroke={l.col} strokeWidth={1} rx={1}/>
                  <text x={12} y={7} fontFamily={C.mono} fontSize={9} fill={C.textMid}>{l.label}</text>
                </g>
              ))}
            </g>

            {/* ── Cluster blob fills ── */}
            {CLUSTERS.map((c, ci) => {
              const memberPos = c.members.map(t => nodes[t]).filter(Boolean);
              const meta = labelMeta[ci];
              // Label clearance zone: blob outline must not cut through the resolved label rect
              const labelZone = {
                x: meta.x + meta.w / 2,
                y: meta.y + meta.h / 2,
                r: Math.sqrt((meta.w / 2) ** 2 + (meta.h / 2) ** 2) + ELEM_PAD,
              };
              return (
                <path key={`fill-${c.id}`}
                  d={blobPath(c.cx, c.cy, c.rx, c.ry, ci * 7.31, organicness, memberPos, [labelZone])}
                  fill={`url(#grad-${c.id})`}
                  filter="url(#blob-glow)"
                  strokeWidth={0}
                />
              );
            })}

            {/* ── Cluster blob strokes + labels (collision-resolved, inside surround) ── */}
            {CLUSTERS.map((c, ci) => {
              const memberPos = c.members.map(t => nodes[t]).filter(Boolean);
              const meta = labelMeta[ci];
              const labelZone = {
                x: meta.x + meta.w / 2,
                y: meta.y + meta.h / 2,
                r: Math.sqrt((meta.w / 2) ** 2 + (meta.h / 2) ** 2) + ELEM_PAD,
              };
              const path = blobPath(c.cx, c.cy, c.rx, c.ry, ci * 7.31, organicness, memberPos, [labelZone]);
              const textX = meta.x + meta.w / 2;
              const textY = meta.y + 13;
              return (
                <g key={c.id}>
                  <path d={path} fill="none" stroke={c.col} strokeWidth={1.2} strokeOpacity={0.55} />
                  {/* Invisible padding rect — visual gap enforcer (no fill, no stroke) */}
                  <rect x={meta.x - ELEM_PAD} y={meta.y - ELEM_PAD}
                    width={meta.w + ELEM_PAD * 2} height={meta.h + ELEM_PAD * 2}
                    fill="none" stroke="none" />
                  {/* Visible label — collision-resolved position */}
                  <rect x={meta.x} y={meta.y} width={meta.w} height={meta.h}
                    fill={c.col+"22"} stroke={c.col+"66"} strokeWidth={1} rx={3} />
                  <text x={textX} y={textY}
                    textAnchor="middle" fontFamily={C.mono} fontSize={9.5}
                    fill={c.col} fontWeight="600" letterSpacing="0.04em"
                  >{c.label}</text>
                </g>
              );
            })}

            {/* ── Tension threads ── */}
            {gravity > 0.04 && CLUSTERS.map(c =>
              c.members.flatMap((a, ai) =>
                c.members.slice(ai + 1).map(b => {
                  const pa = nodes[a], pb = nodes[b];
                  if (!pa || !pb) return null;
                  if (!visibleTickers.includes(a) || !visibleTickers.includes(b)) return null;
                  return (
                    <line key={`${a}-${b}-${c.id}`}
                      x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                      stroke={c.col} strokeWidth={0.5}
                      strokeOpacity={gravity * 0.22} strokeDasharray="3,6"
                    />
                  );
                })
              )
            )}

            {/* ── Ticker nodes ── */}
            {visibleTickers.map(ticker => {
              const pos = nodes[ticker];
              if (!pos) return null;
              const s = STOCKS.find(s => s.ticker === ticker);
              const col = s ? (s.riskScore >= s.oppScore ? C.risk : C.opp) : C.textDim;
              const isSel = selected === ticker;
              const clusterCount = CLUSTERS.filter(c => c.members.includes(ticker)).length;
              const inMultiple = clusterCount > 1;
              return (
                <g key={ticker} onClick={() => setSelected(isSel ? null : ticker)} style={{cursor:"pointer"}}>
                  {inMultiple && (
                    <circle cx={pos.x} cy={pos.y} r={20}
                      fill="none" stroke={C.warn}
                      strokeWidth={0.7} strokeOpacity={0.4} strokeDasharray="2,4" />
                  )}
                  {/* Invisible padding rect — enforces ELEM_PAD gap from other elements */}
                  <rect x={pos.x - TICKER_PW/2 - ELEM_PAD} y={pos.y - TICKER_PH/2 - ELEM_PAD}
                    width={TICKER_PW + ELEM_PAD*2} height={TICKER_PH + ELEM_PAD*2}
                    fill="none" stroke="none" />
                  <rect x={pos.x - TICKER_PW/2} y={pos.y - TICKER_PH/2} width={TICKER_PW} height={TICKER_PH}
                    fill={isSel ? col+"44" : C.bgCard2}
                    stroke={col} strokeWidth={isSel ? 2 : 1} rx={2} />
                  <text x={pos.x} y={pos.y+4}
                    textAnchor="middle" fontFamily={C.inst}
                    fontSize={11} fontWeight="700" fill={col} letterSpacing="-0.02em"
                  >{ticker}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Selected stock detail panel ── */}
      {selectedStock && (
        <div style={{width:300, flexShrink:0, background:C.bgCard, borderLeft:`1px solid ${C.border}`, overflowY:"auto", padding:14}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <span style={{fontFamily:C.inst, fontSize:15, fontWeight:700, color:C.text}}>{selectedStock.ticker}</span>
            <button onClick={() => setSelected(null)} style={{background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:14, padding:4}}>✕</button>
          </div>
          <div style={{marginBottom:10}}><WaveBar riskScore={selectedStock.riskScore} oppScore={selectedStock.oppScore} /></div>
          <div style={{display:"flex", flexDirection:"column", gap:5, marginBottom:12}}>
            <ScoreBar score={selectedStock.riskScore} color={C.risk} label="RISK" />
            <ScoreBar score={selectedStock.oppScore}  color={C.opp}  label="OPP" />
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

/* ─── NATION VIEW ────────────────────────────────────────────────────────────── */
function NationView() {
  const [selected, setSelected] = useState("us");
  const nation = NATIONS.find(n => n.code === selected);

  return (
    <div style={{flex:1, display:"flex", overflow:"hidden"}}>
      <div style={{width:220, flexShrink:0, background:C.navLeft, borderRight:`1px solid ${C.border}`, overflowY:"auto"}}>
        <div style={{padding:"10px 14px 6px", fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>NATIONS · SIGNAL MAP</div>
        {NATIONS.sort((a,b) => (b.riskScore + b.oppScore) - (a.riskScore + a.oppScore)).map(n => {
          const rDom = n.riskScore > n.oppScore;
          const col = rDom ? C.risk : C.opp;
          const isSel = selected === n.code;
          return (
            <div key={n.code} onClick={() => setSelected(n.code)} style={{
              padding:"10px 14px", cursor:"pointer",
              background: isSel ? C.bgCard2 : "transparent",
              borderLeft:`2px solid ${isSel ? col : "transparent"}`,
              borderBottom:`1px solid ${C.border}44`,
            }}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                <FlagImg code={n.code} emoji={n.flag} size={22} />
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
      {nation && (
        <div style={{flex:1, overflowY:"auto", padding:16}}>
          <div style={{background:C.bgCard, border:`1px solid ${C.border}`, padding:"16px 20px", marginBottom:12}}>
            <div style={{flex:1}}>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6}}>
                <FlagImg code={nation.code} emoji={nation.flag} size={36} />
                <span style={{fontFamily:C.inst, fontSize:20, fontWeight:700, color:"#FFFFFF"}}>{nation.name}</span>
              </div>
              <div style={{fontFamily:C.sans, fontSize:12, color:C.textMid, lineHeight:1.6, marginBottom:12}}>{nation.note}</div>
              <div style={{display:"flex", flexDirection:"column", gap:5, maxWidth:340}}>
                <ScoreBar score={nation.riskScore} color={C.risk} label="RISK" />
                <ScoreBar score={nation.oppScore}  color={C.opp}  label="OPP" />
              </div>
            </div>
          </div>
          <div style={{background:C.bgCard, border:`1px solid ${C.border}`, padding:"12px 16px", marginBottom:12}}>
            <div style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", marginBottom:8}}>ACTIVE SIGNALS</div>
            <div style={{display:"flex", flexDirection:"column", gap:4}}>
              {nation.tags.map((t, i) => (
                <Pill key={i} dir={t.dir} cat="" label={t.label} state={t.state} />
              ))}
            </div>
          </div>
          <div style={{background:C.bgCard, border:`1px solid ${C.border}`, padding:"12px 16px"}}>
            <div style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", marginBottom:8}}>RELATED TICKERS</div>
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              {nation.relatedTickers.map(t => (
                <span key={t} style={{fontFamily:C.inst, fontSize:12, fontWeight:700, padding:"3px 8px", background:C.bgCard2, border:`1px solid ${C.border2}`, color:C.textMid}}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── FEED ITEM ──────────────────────────────────────────────────────────────── */
function FeedItem({ item, isNew }) {
  const matched = SIGNAL_RULES.filter(r => item.ruleIds.includes(r.id));
  const dirCol = matched.some(r => r.dir === "risk") && matched.some(r => r.dir === "opp")
    ? C.warn
    : matched.some(r => r.dir === "opp") ? C.opp : C.risk;

  return (
    <div style={{
      padding:"10px 14px",
      borderBottom:`1px solid ${C.border}44`,
      background: isNew ? C.bgCard2 : "transparent",
      transition:"background 1s",
    }}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:5}}>
        {isNew && (
          <span style={{fontFamily:C.mono, fontSize:7.5, color:C.accent, background:C.accent+"22",
            border:`1px solid ${C.accent}44`, padding:"1px 5px", letterSpacing:"0.1em", flexShrink:0}}>
            ● NEW
          </span>
        )}
        <span style={{fontFamily:C.mono, fontSize:8.5, color:C.textDim}}>{item.ts}</span>
        <span style={{fontFamily:C.mono, fontSize:8.5, color:C.accent}}>{item.src}</span>
        <span style={{flex:1}}/>
        {item.tickers.map(t => (
          <span key={t} style={{fontFamily:C.inst, fontSize:9, fontWeight:700, color:C.textMid,
            background:C.bgCard2, border:`1px solid ${C.border}`, padding:"0 5px"}}>{t}</span>
        ))}
      </div>
      <div style={{fontFamily:C.sans, fontSize:11, color:C.text, lineHeight:1.5, marginBottom:6}}>
        {item.headline}
      </div>
      {matched.length > 0 && (
        <div style={{display:"flex", gap:4, flexWrap:"wrap", paddingTop:4, borderTop:`1px solid ${C.border}33`}}>
          <span style={{fontFamily:C.mono, fontSize:8, color:C.textDim, alignSelf:"center"}}>↳ signals:</span>
          {matched.map(r => (
            <span key={r.id} style={{
              fontFamily:C.mono, fontSize:8, padding:"1px 6px",
              background: r.dir === "risk" ? "#3B0A0A" : "#052e16",
              color: r.dir === "risk" ? C.risk : C.opp,
              border: `1px solid ${r.dir === "risk" ? C.risk : C.opp}44`,
            }}>{r.dir === "risk" ? "⚠" : "✦"} {r.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── FEED VIEW ──────────────────────────────────────────────────────────────── */
function FeedView({ liveItems, newItemId }) {
  const catColors = {
    GPOL:"#EF4444", POL:"#F97316", MACRO:"#F59E0B", SECT:"#22C55E",
    RATE:"#0EA5E9", EARN:"#A78BFA", GEO:"#14B8A6", WEATHER:"#60A5FA",
    CLMT:"#34D399", SUPPLY:"#FB923C", LABOR:"#F472B6", LEGAL:"#EF4444",
    TECH:"#34D399", ESG:"#6EE7B7",
  };

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      {/* Header */}
      <div style={{
        padding:"6px 16px", background:C.navLeft, borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", gap:12, flexShrink:0,
      }}>
        <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>
          SIGNAL ENGINE · {SIGNAL_RULES.length} rules · {DATA_SOURCES.length} data sources configured
        </span>
        <span style={{fontFamily:C.mono, fontSize:8.5, color:C.opp, letterSpacing:"0.08em"}}>● LIVE SIMULATION</span>
        <span style={{marginLeft:"auto", fontFamily:C.mono, fontSize:9, color:C.textDim}}>
          {liveItems.length}/{LIVE_FEED.length} feed items visible
        </span>
      </div>

      <div style={{flex:1, display:"flex", overflow:"hidden"}}>

        {/* LEFT — live feed stream */}
        <div style={{flex:3, display:"flex", flexDirection:"column", overflow:"hidden", borderRight:`1px solid ${C.border}`}}>
          <div style={{padding:"8px 14px 6px", fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", flexShrink:0}}>
            INCOMING FEED — newest first · auto-tagged by signal engine
          </div>
          <div style={{flex:1, overflowY:"auto"}}>
            {[...liveItems].reverse().map(item => (
              <FeedItem key={item.id} item={item} isNew={item.id === newItemId} />
            ))}
          </div>
        </div>

        {/* RIGHT — emergent patterns + data sources */}
        <div style={{flex:2, display:"flex", flexDirection:"column", overflow:"hidden"}}>

          {/* Emergent patterns */}
          <div style={{flex:1, overflowY:"auto", borderBottom:`1px solid ${C.border}`}}>
            <div style={{padding:"8px 14px 6px", fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", position:"sticky", top:0, background:C.bg}}>
              EMERGENT PATTERNS — auto-detected cross-stock signals
            </div>
            {EMERGENT_PATTERNS.map(p => (
              <div key={p.id} style={{padding:"10px 14px", borderBottom:`1px solid ${C.border}44`}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:5}}>
                  <span style={{fontFamily:C.mono, fontSize:10, fontWeight:700, color:p.col}}>{p.label}</span>
                  <span style={{marginLeft:"auto", fontFamily:C.mono, fontSize:8.5, color:p.col}}>
                    {p.strength}
                  </span>
                  <div style={{width:40, height:3, background:C.border, position:"relative"}}>
                    <div style={{position:"absolute", left:0, top:0, bottom:0, width:`${p.strength}%`, background:p.col}} />
                  </div>
                </div>
                <div style={{fontFamily:C.sans, fontSize:10.5, color:C.textMid, lineHeight:1.55, marginBottom:6}}>
                  {p.insight}
                </div>
                <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
                  {p.opp.map(t => (
                    <span key={t} style={{fontFamily:C.inst, fontSize:9, fontWeight:700, color:C.opp, background:"#052e16", border:`1px solid ${C.opp}44`, padding:"0 5px"}}>↑ {t}</span>
                  ))}
                  {p.risk.map(t => (
                    <span key={t} style={{fontFamily:C.inst, fontSize:9, fontWeight:700, color:C.risk, background:"#3B0A0A", border:`1px solid ${C.risk}44`, padding:"0 5px"}}>↓ {t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Data source manifest */}
          <div style={{flex:"0 0 auto", maxHeight:280, overflowY:"auto"}}>
            <div style={{padding:"8px 14px 6px", fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em", position:"sticky", top:0, background:C.bg}}>
              DATA SOURCE MANIFEST — pill category coverage
            </div>
            {DATA_SOURCES.map(ds => (
              <div key={ds.name} style={{
                padding:"7px 14px", borderBottom:`1px solid ${C.border}33`,
                display:"flex", gap:8, alignItems:"flex-start",
              }}>
                <div style={{flex:1}}>
                  <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:3}}>
                    <span style={{fontFamily:C.mono, fontSize:9.5, fontWeight:600, color:C.text}}>{ds.name}</span>
                    <span style={{
                      fontFamily:C.mono, fontSize:7.5, padding:"0 5px",
                      background: ds.status === "free" ? "#052e16" : "#1a1a2e",
                      color: ds.status === "free" ? C.opp : C.accent,
                      border: `1px solid ${ds.status === "free" ? C.opp : C.accent}44`,
                    }}>{ds.status}</span>
                    <span style={{fontFamily:C.mono, fontSize:7.5, color:C.textDim}}>{ds.refresh}</span>
                  </div>
                  <div style={{fontFamily:C.sans, fontSize:10, color:C.textDim, marginBottom:4}}>{ds.note}</div>
                  <div style={{display:"flex", gap:3, flexWrap:"wrap"}}>
                    {ds.cats.map(cat => (
                      <span key={cat} style={{
                        fontFamily:C.mono, fontSize:7.5, padding:"0 4px",
                        background:(catColors[cat] || C.accent) + "22",
                        color:catColors[cat] || C.accent,
                        border:`1px solid ${(catColors[cat] || C.accent)}44`,
                      }}>{cat}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── RISK VIEW ──────────────────────────────────────────────────────────────── */
// A single risk-tracking column with a fllwup-style editable #query header
function RiskColumn({ col, onDelete, onUpdate }) {
  const isPending      = col.query === "";
  const [editing, setEditing]   = useState(isPending);
  const [editVal, setEditVal]   = useState(col.query);
  const inputRef = useRef(null);
  const justMounted = useRef(true);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    // guard: skip the first blur that fires immediately on mount
    justMounted.current = false;
  }, []);

  const commit = () => {
    const v = editVal.trim();
    if (v) { onUpdate(v); setEditing(false); }
    else if (isPending) { onDelete(); }
    else { setEditVal(col.query); setEditing(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")  { e.preventDefault(); commit(); }
    if (e.key === "Escape") {
      if (isPending) { onDelete(); return; }
      setEditVal(col.query);
      setEditing(false);
    }
  };

  const handleBlur = () => {
    if (justMounted.current) return;
    commit();
  };

  // Filter stocks: any pill whose label or cat contains the query (case-insensitive)
  const q = col.query.toLowerCase();
  const matches = STOCKS
    .map(s => {
      const hits = s.pills.filter(p =>
        p.label.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)
      );
      return { s, hits };
    })
    .filter(({ hits }) => hits.length > 0)
    .sort((a, b) =>
      b.hits.length !== a.hits.length
        ? b.hits.length - a.hits.length
        : b.s.stormScore - a.s.stormScore
    );

  const headerBorderColor = col.query ? C.accent : C.warn;

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column", overflow:"hidden",
      borderRight:`1px solid ${C.border}22`,
    }}>
      {/* Column header — click to edit */}
      <div style={{
        padding:"8px 10px", flexShrink:0,
        background:C.bgCard, borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", gap:6,
      }}>
        <span style={{fontFamily:C.mono, fontSize:12, color:C.textDim, fontWeight:600}}>#</span>
        {editing ? (
          <input
            ref={inputRef}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="type a risk to track…"
            style={{
              flex:1, background:"transparent", border:"none", outline:"none",
              fontFamily:C.mono, fontSize:12, fontWeight:600,
              color:C.accent, caretColor:C.accent,
            }}
          />
        ) : (
          <button
            onClick={() => { setEditVal(col.query); setEditing(true); }}
            style={{
              flex:1, background:"none", border:"none", cursor:"text", textAlign:"left",
              fontFamily:C.mono, fontSize:12, fontWeight:600, color:C.accent,
              padding:0,
            }}
          >{col.query || "…"}</button>
        )}
        <button
          onClick={onDelete}
          style={{
            background:"none", border:"none", cursor:"pointer",
            color:C.textDim, fontSize:11, lineHeight:1, padding:"0 2px",
            opacity:0.5,
          }}
          title="Remove feed"
        >✕</button>
      </div>

      {/* Under header: exposure meter */}
      {col.query && (
        <div style={{
          padding:"5px 10px", flexShrink:0, borderBottom:`1px solid ${C.border}33`,
          background:C.bgCard2, display:"flex", alignItems:"center", gap:8,
        }}>
          <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.08em"}}>
            {matches.length} EXPOSED
          </span>
          <div style={{flex:1, height:3, background:C.border, borderRadius:2, overflow:"hidden"}}>
            <div style={{
              width: `${Math.min(100, (matches.length / STOCKS.length) * 100)}%`,
              height:"100%", background:C.risk, borderRadius:2,
              transition:"width 0.4s",
            }}/>
          </div>
          <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim}}>
            {Math.round((matches.length / STOCKS.length) * 100)}%
          </span>
        </div>
      )}

      {/* Stock cards, sorted most→least exposure */}
      <div style={{flex:1, overflowY:"auto", padding:"8px 8px"}}>
        {!col.query ? (
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", height:"100%", gap:8, opacity:0.5,
          }}>
            <div style={{fontFamily:C.mono, fontSize:24, color:C.textDim}}>⌕</div>
            <div style={{fontFamily:C.mono, fontSize:10, color:C.textDim, textAlign:"center"}}>
              type a risk to<br/>start tracking
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", height:"100%", gap:6, opacity:0.5,
          }}>
            <div style={{fontFamily:C.mono, fontSize:10, color:C.textDim, textAlign:"center"}}>
              no stocks with<br/><span style={{color:C.accent}}>#{col.query}</span> exposure
            </div>
          </div>
        ) : (
          matches.map(({ s, hits }) => (
            <div key={s.ticker} style={{marginBottom:8}}>
              {/* Exposure bar above each card */}
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:3, paddingLeft:2}}>
                <span style={{fontFamily:C.mono, fontSize:9, fontWeight:600, color:C.accent}}>
                  {s.ticker}
                </span>
                <div style={{display:"flex", gap:3, flexWrap:"wrap"}}>
                  {hits.map((p, i) => (
                    <span key={i} style={{
                      fontFamily:C.mono, fontSize:8, padding:"1px 5px",
                      background: p.dir === "risk" ? C.risk+"22" : C.opp+"22",
                      color: p.dir === "risk" ? C.risk : C.opp,
                      border:`1px solid ${p.dir === "risk" ? C.risk : C.opp}44`,
                      borderRadius:2,
                    }}>{p.label}</span>
                  ))}
                </div>
                <span style={{
                  marginLeft:"auto", fontFamily:C.mono, fontSize:8, color:C.textDim,
                }}>
                  {hits.length} signal{hits.length > 1 ? "s" : ""}
                </span>
              </div>
              <StockCard stock={s} expanded={false} onToggle={() => {}} newTickers={[]} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RiskView() {
  const [cols, setCols] = useState([
    { id:1, query:"Iran" },
    { id:2, query:"AI" },
    { id:3, query:"Tariff" },
  ]);
  const nextId = useRef(4);

  const addCol = () => {
    if (cols.length >= 5) return;
    setCols(c => [...c, { id: nextId.current++, query:"" }]);
  };

  const removeCol = (id) => setCols(c => c.filter(col => col.id !== id));
  const updateCol = (id, query) => setCols(c => c.map(col => col.id === id ? {...col, query} : col));

  return (
    <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
      {/* Header bar */}
      <div style={{
        display:"flex", alignItems:"center", gap:10, padding:"8px 16px", flexShrink:0,
        background:C.navLeft, borderBottom:`1px solid ${C.border}`,
      }}>
        <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>
          RISK VIEW
        </span>
        <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim}}>—</span>
        <span style={{fontFamily:C.sans, fontSize:10, color:C.textMid}}>
          track up to 5 signals. click <span style={{color:C.accent, fontFamily:C.mono}}>#header</span> to change.
        </span>
        <span style={{marginLeft:"auto", fontFamily:C.mono, fontSize:9, color:C.textDim}}>
          {cols.length}/5 feeds
        </span>
        {cols.length < 5 && (
          <button onClick={addCol} style={{
            fontFamily:C.mono, fontSize:9, fontWeight:700, letterSpacing:"0.08em",
            padding:"4px 10px", border:`1px solid ${C.accent}66`,
            background:C.accent+"11", color:C.accent, cursor:"pointer",
          }}>+ ADD FEED</button>
        )}
      </div>

      {/* Columns */}
      <div style={{flex:1, display:"flex", overflow:"hidden"}}>
        {cols.map(col => (
          <RiskColumn
            key={col.id}
            col={col}
            onDelete={() => removeCol(col.id)}
            onUpdate={(q) => updateCol(col.id, q)}
          />
        ))}
        {/* Empty slot placeholder when < 3 cols */}
        {cols.length < 3 && Array.from({length: 3 - cols.length}).map((_, i) => (
          <div key={`empty-${i}`} style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center",
            borderRight:`1px solid ${C.border}22`,
            opacity:0.3,
          }}>
            <button onClick={addCol} style={{
              fontFamily:C.mono, fontSize:10, color:C.textDim,
              background:"none", border:`1px dashed ${C.border}`,
              padding:"8px 16px", cursor:"pointer",
            }}>+ ADD FEED</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SETTINGS PANEL ─────────────────────────────────────────────────────────── */
function SettingsPanel({ onClose, numCols, setNumCols }) {
  return (
    <div style={{
      position:"absolute", top:44, right:0, width:280,
      background:C.bgCard, border:`1px solid ${C.border}`,
      zIndex:100, padding:"12px 14px",
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
        <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.1em"}}>SIGNAL ENGINE SETTINGS</span>
        <button onClick={onClose} style={{background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:12}}>✕</button>
      </div>

      {/* Card View columns slider */}
      <div style={{padding:"6px 0 8px", borderBottom:`1px solid ${C.border}33`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
          <span style={{fontFamily:C.sans, fontSize:10, color:C.textMid}}>Card View columns</span>
          <span style={{fontFamily:C.mono, fontSize:11, fontWeight:600, color:C.accent, minWidth:12, textAlign:"right"}}>{numCols}</span>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:6}}>
          <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim}}>3</span>
          <input
            type="range" min={3} max={5} step={1} value={numCols}
            onChange={e => setNumCols(Number(e.target.value))}
            style={{flex:1, accentColor:C.accent, cursor:"pointer"}}
          />
          <span style={{fontFamily:C.mono, fontSize:9, color:C.textDim}}>5</span>
        </div>
        <div style={{display:"flex", justifyContent:"space-between", marginTop:3}}>
          {[3,4,5].map(n => (
            <button key={n} onClick={() => setNumCols(n)} style={{
              fontFamily:C.mono, fontSize:9, padding:"2px 8px",
              background: numCols === n ? C.accent+"22" : "transparent",
              border:`1px solid ${numCols === n ? C.accent : C.border2}`,
              color: numCols === n ? C.accent : C.textDim, cursor:"pointer",
            }}>{n} col</button>
          ))}
        </div>
      </div>

      {[
        ["Signal refresh interval","15 min"],["Feed sources","8 active"],
        ["Pill auto-decay","enabled"],["Min signal confidence","0.65"],
        ["Storm alert threshold","60"],
      ].map(([k,v]) => (
        <div key={k} style={{display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.border}33`}}>
          <span style={{fontFamily:C.sans, fontSize:10, color:C.textMid}}>{k}</span>
          <span style={{fontFamily:C.mono, fontSize:10, color:C.accent}}>{v}</span>
        </div>
      ))}
      <div style={{height:1, background:C.border, margin:"8px 0 4px"}}/>
      <div style={{padding:"4px 0 2px", fontFamily:C.mono, fontSize:9, color:C.textDim, letterSpacing:"0.06em"}}>
        v0.4 · signal engine demo · data: simulated
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────────── */
export default function PerfectStorm() {
  const [tab, setTab]                   = useState("cards");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [numCols, setNumCols]           = useState(3);

  // ── Live simulation state ────────────────────────────────────────────────────
  // LIVE_FEED is ordered oldest→newest (index 0 = oldest, 24 = newest).
  // We start with 20 visible and reveal the final 5 over ~60s to demo live tagging.
  const [visibleCount, setVisibleCount] = useState(20);
  const [newItemId, setNewItemId]       = useState(null);
  const [secsSince, setSecsSince]       = useState(0);

  useEffect(() => {
    if (visibleCount >= LIVE_FEED.length) return;
    const t = setTimeout(() => {
      const nextItem = LIVE_FEED[visibleCount];
      setVisibleCount(c => c + 1);
      setNewItemId(nextItem.id);
      setSecsSince(0);
      setTimeout(() => setNewItemId(null), 5000);
    }, 12000);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    const tick = setInterval(() => setSecsSince(s => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  const liveItems  = LIVE_FEED.slice(0, visibleCount);
  const newTickers = newItemId ? (LIVE_FEED.find(i => i.id === newItemId)?.tickers ?? []) : [];

  const tabs = [
    { id:"cards",  label:"CARD VIEW" },
    { id:"storm",  label:"STORM VIEW" },
    { id:"nation", label:"NATION VIEW" },
    { id:"feed",   label:"SIGNAL FEED" },
    { id:"risk",   label:"RISK VIEW" },
  ];

  return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      background:C.bg, color:C.text, fontFamily:C.sans, overflow:"hidden",
    }}>
      {/* Google Fonts + global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:2px}
        button{font-family:inherit}
        @keyframes tickerScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      `}</style>

      {/* ── TICKER TAPE ── */}
      <TickerTape items={liveItems} />

      {/* ── NAV BAR ── */}
      <nav style={{
        display:"flex", alignItems:"stretch", flexShrink:0,
        height:40, borderBottom:`1px solid ${C.border}`, position:"relative",
      }}>
        {/* LEFT — logo + tabs */}
        <div style={{flex:1, display:"flex", alignItems:"stretch", background:C.navLeft, paddingLeft:16, gap:0}}>
          <div style={{display:"flex", alignItems:"center", paddingRight:20, borderRight:`1px solid ${C.border}`}}>
            <span style={{fontFamily:C.inst, fontSize:13, fontWeight:700, letterSpacing:"0.1em", color:C.accent}}>PERFECT</span>
            <span style={{fontFamily:C.inst, fontSize:13, fontWeight:700, letterSpacing:"0.1em", color:C.text, marginLeft:4}}>STORM^</span>
          </div>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:"0 18px", fontFamily:C.mono, fontSize:10, fontWeight:700,
              letterSpacing:"0.12em", textTransform:"uppercase",
              border:"none", cursor:"pointer", background:"transparent",
              color: tab === t.id ? C.accent : C.textDim,
              borderBottom:`2px solid ${tab === t.id ? C.accent : "transparent"}`,
              transition:"color .15s, border-color .15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* RIGHT — counters + settings */}
        <div style={{
          background:C.navRight, borderLeft:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", paddingLeft:16, paddingRight:2, gap:8, flexShrink:0, position:"relative",
        }}>
          <div style={{display:"flex", gap:12}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:C.mono, fontSize:14, fontWeight:600, color:C.risk, lineHeight:1}}>{STOCKS.filter(s=>s.riskScore>50).length}</div>
              <div style={{fontFamily:C.mono, fontSize:8, color:C.textDim, letterSpacing:"0.1em"}}>RISK</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:C.mono, fontSize:14, fontWeight:600, color:C.opp, lineHeight:1}}>{STOCKS.filter(s=>s.oppScore>50).length}</div>
              <div style={{fontFamily:C.mono, fontSize:8, color:C.textDim, letterSpacing:"0.1em"}}>OPP</div>
            </div>
          </div>
          <div style={{width:1, height:20, background:C.border, margin:"0 4px"}}/>
          <button onClick={() => setSettingsOpen(v => !v)} style={{
            width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center",
            background: settingsOpen ? C.bgCard2 : "transparent",
            border:"none", cursor:"pointer", color: settingsOpen ? C.accent : C.textDim,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="8" cy="8" r="2.5"/>
              <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M12.6 3.4l-.9.9M4.3 11.7l-.9.9"/>
            </svg>
          </button>
          {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} numCols={numCols} setNumCols={setNumCols} />}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{flex:1, display:"flex", overflow:"hidden"}}>
        {tab === "cards"  && <CardsView newTickers={newTickers} secsSince={secsSince} numCols={numCols} />}
        {tab === "storm"  && <StormView />}
        {tab === "nation" && <NationView />}
        {tab === "feed"   && <FeedView liveItems={liveItems} newItemId={newItemId} />}
        {tab === "risk"   && <RiskView />}
      </div>
    </div>
  );
}
