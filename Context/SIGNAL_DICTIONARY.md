# Perfect Storm — Signal Dictionary v0.1

> **Purpose:** Canonical list of known signal tags (pills) for the Perfect Storm system.
> Each signal has a `category`, `direction` (risk/opp), `label` (≤5 words, mechanism-first),
> `severity` (1–3), and `default_state` (emerging/active/fading).
>
> This dictionary is the source of truth for the NLP tagging engine.
> When the pipeline detects a matching keyword cluster in headlines/articles,
> it maps to the appropriate signal ID here and triggers the pill lifecycle.
>
> Categories: GPOL · GEO · POL · MACRO · RATE · SECT · EARN · WEATHER · SUPPLY · LABOR · LEGAL · TECH · ESG

---

## GPOL — Geopolitical
*State-level conflicts, wars, trade disputes, sanctions, export controls — political dynamics between nations and their knock-on effects on companies.*

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| GPOL-001 | risk | Iran Strait Conflict | 3 | Hormuz closure risk; energy, airlines, shipping |
| GPOL-002 | risk | US-China Trade Escalation | 3 | Tariff/export control regime — broad impact |
| GPOL-003 | risk | China Taiwan Strait Tension | 3 | Semiconductor, shipping, defense triggers |
| GPOL-004 | risk | Russia-Ukraine Conflict Drag | 2 | Energy, wheat, European supply chain |
| GPOL-005 | risk | North Korea Missile Provocation | 2 | Asia Pacific supply chain signal |
| GPOL-006 | risk | Middle East Conflict Escalation | 3 | Oil, defense, airline routing |
| GPOL-007 | risk | EU-US Trade Friction | 2 | Tariffs on autos, tech, pharma |
| GPOL-008 | risk | Sanctions Regime Tightening | 2 | Russia/Iran/Venezuela exposure |
| GPOL-009 | risk | China Export Retaliation | 2 | Rare earth, materials supply |
| GPOL-010 | risk | South China Sea Shipping Risk | 2 | Container routing, insurance costs |
| GPOL-011 | risk | India-Pakistan Border Tension | 2 | Regional supply chain, IT labor |
| GPOL-012 | risk | Africa Political Instability | 1 | Mining, commodities, energy |
| GPOL-013 | risk | Latin America Political Risk | 1 | Mining, energy, nearshore mfg |
| GPOL-014 | risk | Cyber Warfare State Actor | 2 | Tech, finance, critical infra |
| GPOL-015 | risk | OPEC+ Supply Cut | 2 | Energy price spike signal |
| GPOL-016 | opp | NATO Rearmament Wave | 3 | Defense contractors — RTX, LMT, GD, NOC |
| GPOL-017 | opp | Sovereign AI National Programs | 3 | NVDA, cloud — nation-funded AI infra |
| GPOL-018 | opp | US Defense Budget Surge | 3 | RTX, LMT, GD, NOC, LDOS |
| GPOL-019 | opp | EU Green Deal Capex Wave | 2 | Clean energy, grid, EV infra |
| GPOL-020 | opp | Gulf State Vision 2030 Capex | 2 | Infra, AI, finance (SA, UAE) |
| GPOL-021 | opp | Iran Conflict Oil Revenue Spike | 3 | XOM, COP, CVX, HAL |
| GPOL-022 | opp | Export Controls Selectively Eased | 2 | NVDA H200 approvals, country carveouts |
| GPOL-023 | opp | Friendshoring Policy Tailwind | 2 | Mexico, India, Vietnam mfg beneficiaries |
| GPOL-024 | opp | Post-Conflict Reconstruction | 1 | Construction, materials, engineering |
| GPOL-025 | opp | Bilateral Trade Deal Signed | 2 | Sector-specific beneficiaries per deal |

---

## GEO — Geographic
*Physical location of operations, production, and sales. Where a company makes things, sells things, and its exposure to regional dynamics — distinct from the political forces that cause them.*

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| GEO-001 | risk | China Revenue Concentration | 2 | AAPL, NVDA — geographic revenue mix |
| GEO-002 | risk | EU Market Demand Softening | 2 | Autos, luxury, industrials, airlines |
| GEO-003 | risk | EM Currency Devaluation | 2 | Multinationals with EM revenue exposure |
| GEO-004 | risk | Single-Region Manufacturing | 2 | AAPL China supply chain concentration |
| GEO-005 | risk | Pacific Shipping Route Disruption | 2 | Retail, autos, manufacturing |
| GEO-006 | risk | Gulf Coast Energy Concentration | 2 | Refining, offshore, pipeline |
| GEO-007 | risk | Regional Brand Boycott | 2 | TSLA EU sales, AAPL China share |
| GEO-008 | risk | Cross-Border Tax Exposure | 1 | Multinationals, IP holding structures |
| GEO-009 | opp | China Market Demand Recovery | 2 | Consumer, tech, autos — if trade eases |
| GEO-010 | opp | India Market Entry Growth | 2 | AAPL, AMZN, fintech |
| GEO-011 | opp | Domestic Production Advantage | 2 | US-made premium, nearshore benefit |
| GEO-012 | opp | Energy Production Geography | 3 | XOM Permian/Guyana — low-cost geography |
| GEO-013 | opp | China Tech Spend (ByteDance) | 2 | NVDA, AMD — geographic demand |
| GEO-014 | opp | Southeast Asia Expansion | 1 | Consumer, mfg, fintech |
| GEO-015 | opp | India Infrastructure Boom | 2 | Engineering, cement, finance |

---

## POL — Policy / Regulatory

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| POL-001 | risk | Trump Tariff Escalation | 3 | Broad manufacturing, retail, tech |
| POL-002 | risk | EU AI Act Compliance Fines | 2 | MSFT, GOOG, META, AI cos |
| POL-003 | risk | DOJ Antitrust Probe | 2 | GOOG, AAPL, UNH, AMZN |
| POL-004 | risk | FTC Merger Block | 2 | Deals, M&A pipeline risk |
| POL-005 | risk | SEC Enforcement Action | 2 | Finance, crypto, fintech |
| POL-006 | risk | FDA Drug Approval Delay | 2 | Pharma, biotech pipeline |
| POL-007 | risk | CMS Medicare Rate Cut | 2 | Health insurers, hospitals |
| POL-008 | risk | AmEx/Credit Card Rate Cap | 2 | DAL, airlines, retail card partners |
| POL-009 | risk | DOGE Defense Budget Scrutiny | 2 | LMT, RTX, GD, NOC |
| POL-010 | risk | State Privacy Law Compliance | 1 | Data-heavy tech, fintech |
| POL-011 | risk | EU Digital Markets Act | 2 | AAPL App Store, GOOG, META |
| POL-012 | risk | Carbon Border Adjustment | 2 | Steel, cement, energy imports |
| POL-013 | risk | PFAS / Environmental Liability | 2 | Chemicals, 3M, water utilities |
| POL-014 | risk | Drug Price Reform Risk | 2 | Pharma, biotech, PBMs |
| POL-015 | risk | Crypto Regulation Tightening | 1 | Exchanges, DeFi, fintech |
| POL-016 | risk | TSA/FAA Staffing Cuts | 2 | Airlines, airports |
| POL-017 | risk | FERC Grid Interconnection Delays | 1 | Utilities, renewables |
| POL-018 | risk | CFPB Consumer Finance Rules | 1 | Banks, fintechs, lenders |
| POL-019 | opp | US Defense Budget Expansion | 3 | RTX, LMT, GD, NOC, LDOS |
| POL-020 | opp | IRA Clean Energy Tax Credits | 2 | Solar, wind, EVs, batteries |
| POL-021 | opp | Semiconductor CHIPS Act Funding | 2 | INTC, TSM, Micron, ON Semi |
| POL-022 | opp | AI Executive Order Rollback | 2 | OpenAI, NVDA, cloud providers |
| POL-023 | opp | Nuclear Permitting Acceleration | 2 | Utilities, NuScale, Kairos |
| POL-024 | opp | Infrastructure Bill Projects | 2 | Engineering, construction, materials |
| POL-025 | opp | Drug Fast-Track Designation | 2 | Biotech, pharma pipeline |

---

## MACRO — Macroeconomic

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| MAC-001 | risk | Recession Probability Rising | 3 | Broad market signal |
| MAC-002 | risk | Stagflation Emerging | 3 | Growth slows, inflation sticky |
| MAC-003 | risk | Consumer Confidence Collapse | 2 | Retail, auto, discretionary |
| MAC-004 | risk | Corporate CapEx Freeze | 2 | Industrials, equipment, software |
| MAC-005 | risk | Credit Default Rates Rising | 2 | Banks, credit card issuers |
| MAC-006 | risk | Dollar Strengthening Drag | 2 | Multinational revenue FX headwind |
| MAC-007 | risk | Fuel Cost Surge | 3 | Airlines, logistics, shipping |
| MAC-008 | risk | Tariff Input Cost Inflation | 2 | Manufacturing, retail, food |
| MAC-009 | risk | Housing Market Freeze | 1 | Home Depot, Lowes, banks |
| MAC-010 | risk | SMB Bankruptcy Acceleration | 2 | Banks, real estate, SaaS |
| MAC-011 | risk | Private Credit Default Cycle | 2 | Alt lenders, BDCs, PE |
| MAC-012 | risk | Auto Loan Delinquency Rising | 1 | Banks, auto dealers |
| MAC-013 | risk | Commercial Real Estate Stress | 2 | Regional banks, REITs |
| MAC-014 | risk | Wage Inflation Sticky | 2 | Labor-intensive industries |
| MAC-015 | risk | Earnings Multiple Compression | 2 | High-PE growth stocks |
| MAC-016 | risk | Supply Chain Bottleneck | 2 | Autos, semis, medical devices |
| MAC-017 | risk | Freight Rate Spike | 2 | Retail, manufacturing, e-com |
| MAC-018 | opp | GDP Growth Beats | 2 | Broad market tailwind |
| MAC-019 | opp | Consumer Spending Resilient | 2 | Retail, travel, services |
| MAC-020 | opp | Bits→Atoms Rotation | 2 | Energy, industrials, defense |
| MAC-021 | opp | Labor Market Remains Tight | 2 | Staffing, HR tech, wages |
| MAC-022 | opp | Corporate CapEx Reopening | 2 | Industrials, construction |
| MAC-023 | opp | M&A Deal Recovery | 2 | Banks, advisory, PE |
| MAC-024 | opp | Value Stock Re-Rating | 1 | P/E discount closes |
| MAC-025 | opp | Aging Population Demand | 2 | Healthcare, pharma, senior living |

---

## RATE — Interest Rates / Credit

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| RATE-001 | risk | Fed Hawkish Pivot | 2 | Rate-sensitive sectors |
| RATE-002 | risk | Yield Curve Inversion | 2 | Banks, recession signal |
| RATE-003 | risk | High Debt Load Refinancing | 3 | AAL, Tesla, leveraged cos |
| RATE-004 | risk | Utility Rate Sensitivity | 1 | ED, SO, NEE |
| RATE-005 | risk | REIT Refinancing Risk | 2 | Office, retail, hotel REITs |
| RATE-006 | risk | Mortgage Rate at 7%+ | 2 | Housing, banks, builders |
| RATE-007 | risk | Corporate Bond Spread Widening | 2 | HY issuers, leveraged buyouts |
| RATE-008 | risk | Consumer Credit Cost Rising | 2 | Retail, card issuers, fintechs |
| RATE-009 | risk | Leveraged Loan Default Risk | 2 | PE-backed cos, CLOs |
| RATE-010 | opp | Fed Rate Cut Cycle | 3 | Broad market, rate-sensitive |
| RATE-011 | opp | Net Interest Margin Expansion | 2 | Banks, credit unions |
| RATE-012 | opp | Bond Market Rally | 2 | Fixed income, utilities |
| RATE-013 | opp | Refinancing Wave Unlocks | 1 | Housing, banks, PE exits |
| RATE-014 | opp | Dividend Yield Premium | 1 | Utilities, staples, REITs |
| RATE-015 | opp | Private Credit Demand Surge | 2 | GS, KKR, Ares, Apollo |

---

## SECT — Sector-Specific

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| SECT-001 | risk | RTO Headwind for Collaboration SaaS | 2 | ZM, TEAM, DOCN |
| SECT-002 | risk | AI Copilot Adoption Miss | 2 | MSFT, GOOG workspace products |
| SECT-003 | risk | Cloud CapEx Margin Squeeze | 2 | MSFT, AMZN, GOOG |
| SECT-004 | risk | EV Pricing Power Erosion | 2 | TSLA, RIVN, legacy OEMs |
| SECT-005 | risk | Legacy Auto EV Transition Cost | 2 | GM, F, VW, BMW |
| SECT-006 | risk | Streaming Content Cost Inflation | 1 | NFLX, DIS, WBD |
| SECT-007 | risk | Social Media Regulatory Pressure | 2 | META, SNAP, TikTok |
| SECT-008 | risk | Ad Market Slowdown | 2 | META, GOOG, SNAP, TTD |
| SECT-009 | risk | Semiconductor Inventory Glut | 2 | Memory, legacy chips |
| SECT-010 | risk | GPU Competition Emerging | 1 | NVDA market share watch |
| SECT-011 | risk | Drug Patent Cliff Approaching | 2 | Pharma revenue erosion |
| SECT-012 | risk | Medical Cost Inflation | 2 | UNH, HUM, CVS, CI |
| SECT-013 | risk | Airline Overcapacity Risk | 1 | DAL, UAL, AAL, LUV |
| SECT-014 | risk | Hotel/Travel Demand Softening | 1 | MAR, HLT, H |
| SECT-015 | risk | Retail Inventory Buildup | 2 | WMT, TGT, AMZN retail |
| SECT-016 | risk | Restaurant Traffic Decline | 1 | MCD, YUM, CMG |
| SECT-017 | risk | Banking M&A Freeze | 1 | Regional banks, advisory |
| SECT-018 | risk | Crypto Market Volatility | 1 | Coinbase, block, fintech |
| SECT-019 | risk | Cybersecurity Breach Exposure | 2 | Any sector — headline risk |
| SECT-020 | risk | Brand Damage / Boycott Risk | 3 | TSLA, Bud Light pattern |
| SECT-021 | risk | Musk Political Blowback | 3 | TSLA brand-specific |
| SECT-022 | risk | Telecom Spectrum Cost | 1 | T, VZ, TMUS |
| SECT-023 | risk | Oil Services Margin Pressure | 1 | HAL, SLB, BKR |
| SECT-024 | opp | AI Inference Infrastructure | 3 | NVDA, AMD, SMCI, cloud |
| SECT-025 | opp | Sovereign AI Wave | 3 | NVDA, AMD, cloud hyperscalers |
| SECT-026 | opp | Defense Munitions Replenishment | 3 | RTX, LMT, GD, NOC |
| SECT-027 | opp | Missile Defense Shield Demand | 3 | RTX, LMT, GD |
| SECT-028 | opp | Megapack / Grid Storage | 2 | TSLA Energy, FLNC, BEP |
| SECT-029 | opp | Robotaxi Revenue Emerging | 2 | TSLA, GOOGL Waymo |
| SECT-030 | opp | Apple Intelligence Adoption | 2 | AAPL services attached rate |
| SECT-031 | opp | Azure / Cloud AI Demand | 3 | MSFT, AMZN AWS, GOOG GCP |
| SECT-032 | opp | Premium Travel Demand | 2 | DAL, UAL premium cabins |
| SECT-033 | opp | Pharma AI Drug Discovery | 2 | Novo Nordisk, Roche, LLY |
| SECT-034 | opp | GLP-1 Weight Loss Drug Wave | 3 | NVO, LLY, demand surge |
| SECT-035 | opp | Nuclear Power Revival | 2 | CEG, NuScale, SMR |
| SECT-036 | opp | Permian Basin Production Growth | 2 | XOM, COP, PXD, DVN |
| SECT-037 | opp | Guyana Offshore Oil Output | 2 | XOM, HESS ramp-up |
| SECT-038 | opp | MI300X AI Accelerator Wins | 2 | AMD gaining inference share |
| SECT-039 | opp | Private Credit Demand | 2 | GS, KKR, Ares, Apollo |
| SECT-040 | opp | Homebuilder Backlog Strong | 1 | DHI, LEN, NVR |
| SECT-041 | opp | Healthcare Vertical Telehealth | 1 | ZM Health, TDOC |
| SECT-042 | opp | SaaS AI Upsell Attached Rate | 2 | Salesforce, ServiceNow, SAP |
| SECT-043 | opp | EV Battery Cost Parity | 2 | Battery cos, EV OEMs |
| SECT-044 | opp | Data Center Power Demand | 2 | NEE, AEP, utilities near AI hubs |
| SECT-045 | opp | Value Menu Traffic Driver | 1 | MCD, YUM during downturns |
| SECT-046 | opp | Generic Drug Revenue Shift | 1 | Generics cos when patents cliff |
| SECT-047 | opp | TSMC AI Chip Dominance | 3 | TSM — no peer for leading edge |
| SECT-048 | opp | Inference Cost Commoditization | 1 | Cloud, API, AI middleware |

---

## EARN — Earnings / Corporate Fundamentals

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| EARN-001 | risk | Earnings Miss Risk High | 2 | Forward guidance cuts |
| EARN-002 | risk | Guidance Cut Below Consensus | 2 | Multiple contraction trigger |
| EARN-003 | risk | Revenue Growth Decelerating | 2 | SaaS, adtech, consumer |
| EARN-004 | risk | Margin Compression Ongoing | 2 | Input costs, wage pressure |
| EARN-005 | risk | Free Cash Flow Declining | 2 | Capital-heavy AI/cloud buildout |
| EARN-006 | risk | Analyst Estimates Cut | 2 | DAL, UNH, MSFT situations |
| EARN-007 | risk | CEO/CFO Leadership Departure | 1 | Execution uncertainty |
| EARN-008 | risk | Debt Covenant Breach Risk | 3 | AAL, RKLB, heavily leveraged cos |
| EARN-009 | risk | Share Dilution / SPAC Risk | 1 | Startup/EV/biotech phase |
| EARN-010 | risk | Accounting Restatement Risk | 2 | Audit flags, governance issues |
| EARN-011 | risk | Capex Cycle Overinvestment | 2 | MSFT AI buildout vs. returns |
| EARN-012 | opp | Services ARR Growth Strong | 2 | AAPL, MSFT recurring revenue |
| EARN-013 | opp | Earnings Beat Streak | 2 | Momentum, analyst upgrade signal |
| EARN-014 | opp | Buyback Authorization Large | 1 | Capital return signal |
| EARN-015 | opp | Dividend Initiation / Hike | 1 | Maturity signal, yield demand |
| EARN-016 | opp | Forward PE at Multi-Year Discount | 2 | Value entry signal |
| EARN-017 | opp | Guidance Raise Above Consensus | 3 | NVDA, RTX type upside surprises |
| EARN-018 | opp | Backlog at Record High | 2 | RTX, LMT — revenue visibility |
| EARN-019 | opp | Margin Expansion Trend | 2 | Cost cuts, AI productivity gains |
| EARN-020 | opp | Free Cash Flow Acceleration | 2 | Returns to shareholders signal |

---

## WEATHER — Climate / Natural Events

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| WEA-001 | risk | Hurricane Season Above Average | 2 | Airlines, energy, insurance |
| WEA-002 | risk | Gulf Coast Hurricane Landfall | 3 | Offshore energy, refiners, ins |
| WEA-003 | risk | Midwest Drought / Crop Failure | 2 | Ag commodities, food cos |
| WEA-004 | risk | California Wildfire Season | 2 | PG&E, insurers, utilities |
| WEA-005 | risk | Severe Winter Storm Disruption | 1 | Airlines, utilities, retail |
| WEA-006 | risk | Flood / Infrastructure Damage | 2 | Utilities, insurers, logistics |
| WEA-007 | risk | El Niño Agricultural Impact | 2 | Coffee, cocoa, wheat, food cos |
| WEA-008 | risk | Heat Wave Energy Demand Spike | 1 | Utilities, natural gas |
| WEA-009 | risk | Arctic Blast Disruption | 1 | Airlines, logistics, retail |
| WEA-010 | opp | Hurricane Infrastructure Rebuild | 2 | Construction, materials, insurers |
| WEA-011 | opp | Warm Winter Gas Demand Drop | 1 | Natural gas cos net negative; airlines net positive |
| WEA-012 | opp | Drought→Water Infra Investment | 1 | Water utilities, infrastructure |

---

## SUPPLY — Supply Chain

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| SUP-001 | risk | Semiconductor Fab Shortage | 3 | Auto, industrial, defense |
| SUP-002 | risk | Rare Earth Supply Constraint | 2 | EV motors, defense, electronics |
| SUP-003 | risk | Port Congestion / Labor Strike | 2 | Retail, auto, manufacturing |
| SUP-004 | risk | Red Sea Shipping Diversion | 2 | Freight rates, European trade |
| SUP-005 | risk | Air Cargo Capacity Squeeze | 1 | High-value goods, pharma |
| SUP-006 | risk | Contract Manufacturer Capacity | 1 | AAPL, electronics |
| SUP-007 | risk | Critical Mineral Dependency | 2 | Cobalt, lithium, nickel, EV |
| SUP-008 | risk | Munitions Production Bottleneck | 2 | RTX, LMT — demand exceeds output |
| SUP-009 | risk | Natural Gas Pipeline Constraints | 1 | Utilities, LNG exporters |
| SUP-010 | opp | Nearshoring Capacity Build | 2 | Mexico, India, Vietnam mfg |
| SUP-011 | opp | Domestic Chip Fab Coming Online | 2 | INTC, TSM Arizona, Samsung |
| SUP-012 | opp | LNG Export Terminal Expansion | 2 | Cheniere, XOM, Venture Global |
| SUP-013 | opp | Drone/AI Logistics Efficiency | 1 | Warehouse, last-mile |

---

## LABOR — Labor Market

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| LAB-001 | risk | Strike / Union Action | 2 | Airlines, auto, healthcare |
| LAB-002 | risk | Wage Inflation Sticky | 2 | Labor-intensive industries |
| LAB-003 | risk | Tech Layoffs / Talent Flight | 1 | Execution risk signal |
| LAB-004 | risk | Visa/Immigration Policy Tighter | 1 | Tech, healthcare labor pool |
| LAB-005 | risk | TSA / Government Worker Shortage | 1 | Airlines, federal contractors |
| LAB-006 | opp | AI Workforce Automation | 2 | SaaS, robotics, productivity |
| LAB-007 | opp | Offshore Labor Cost Advantage | 1 | IT services, BPO |
| LAB-008 | opp | Healthcare Labor Market Normalizing | 1 | Hospitals, travel nurses |

---

## LEGAL — Legal / Litigation

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| LEG-001 | risk | Class Action Lawsuit Filed | 2 | Any sector — headline risk |
| LEG-002 | risk | Patent Infringement Suit | 2 | Tech, pharma, semis |
| LEG-003 | risk | Whistleblower / Fraud Allegation | 3 | Governance signal |
| LEG-004 | risk | Environmental Liability Exposure | 2 | Chemicals, energy, mining |
| LEG-005 | risk | Data Breach Penalty | 2 | Tech, finance, healthcare |
| LEG-006 | risk | Opioid / Mass Tort Liability | 3 | Pharma, distributors |
| LEG-007 | risk | OFAC Sanctions Violation | 3 | Banks, defense, energy |
| LEG-008 | opp | Litigation Settlement Resolved | 1 | Removes overhang |
| LEG-009 | opp | Patent Win / IP Protection | 1 | Pharma, tech exclusivity |
| LEG-010 | opp | Regulatory Approval Granted | 2 | Pharma, biotech, fintech |

---

## TECH — Technology Disruption

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| TECH-001 | risk | AI Substitution Threat | 2 | SaaS, legal, finance, content |
| TECH-002 | risk | Open Source AI Commoditization | 2 | Paid AI product margin risk |
| TECH-003 | risk | DeepSeek-Class Efficiency Shock | 2 | GPU demand assumption risk |
| TECH-004 | risk | Platform Disintermediation | 2 | App stores, marketplaces |
| TECH-005 | risk | Legacy Tech Migration Drag | 1 | Enterprise incumbents |
| TECH-006 | risk | AI Hallucination Liability | 1 | Enterprise AI deployment risk |
| TECH-007 | risk | Quantum Computing Encryption Risk | 1 | Long-range signal, finance/defense |
| TECH-008 | opp | LLM API Cost Deflation | 2 | AI app builders, B2B SaaS |
| TECH-009 | opp | On-Device AI Adoption | 2 | AAPL, Qualcomm, edge chips |
| TECH-010 | opp | Agentic AI Enterprise Deploy | 3 | SaaS, cloud, productivity tools |
| TECH-011 | opp | Inference Chip Demand Expanding | 3 | NVDA, AMD, new entrants |
| TECH-012 | opp | Robotics Commercial Deployment | 2 | TSLA Optimus, Boston Dynamics |
| TECH-013 | opp | AR/VR Platform Maturation | 1 | AAPL Vision, META Quest |
| TECH-014 | opp | Biotech AI Drug Discovery | 2 | Recursion, Absci, Insilico |
| TECH-015 | opp | Autonomous Vehicle Commercializing | 2 | TSLA, Waymo, Mobileye |

---

## ESG — Environmental / Social / Governance

| ID | Dir | Label | Severity | Notes |
|----|-----|-------|----------|-------|
| ESG-001 | risk | Carbon Tax / Emissions Cost | 2 | Airlines, energy, cement |
| ESG-002 | risk | ESG Fund Divestment Pressure | 1 | Fossil fuel, weapons cos |
| ESG-003 | risk | Supply Chain Human Rights Risk | 1 | Apparel, tech hardware |
| ESG-004 | risk | Greenwashing Regulatory Action | 1 | Cos with inflated ESG claims |
| ESG-005 | risk | CEO Political Controversy | 3 | TSLA Musk pattern |
| ESG-006 | risk | Diversity Policy Legal Challenge | 1 | Large US employers |
| ESG-007 | opp | ESG ETF / Mandate Inflows | 1 | Cos with strong ESG scores |
| ESG-008 | opp | Carbon Credit Revenue | 1 | Cos with carbon offset programs |
| ESG-009 | opp | Sustainability Premium Pricing | 1 | Consumer brands, materials |
| ESG-010 | opp | Clean Energy Tax Credit Capture | 2 | Utilities, solar, wind, EVs |

---

## SUMMARY COUNTS

| Category | Risk Signals | Opp Signals | Total |
|----------|-------------|-------------|-------|
| GPOL     | 15          | 10          | 25    |
| GEO      | 8           | 7           | 15    |
| POL      | 18          | 7           | 25    |
| MACRO    | 17          | 8           | 25    |
| RATE     | 9           | 6           | 15    |
| SECT     | 24          | 25          | 49    |
| EARN     | 11          | 9           | 20    |
| WEATHER  | 9           | 3           | 12    |
| SUPPLY   | 9           | 4           | 13    |
| LABOR    | 5           | 3           | 8     |
| LEGAL    | 7           | 3           | 10    |
| TECH     | 7           | 8           | 15    |
| ESG      | 6           | 4           | 10    |
| **TOTAL**| **145**     | **97**      | **242** |

> v0.1 — 227 signals. Phase 2 target: expand SECT (sector-specific) with per-industry deep lists to reach 300+.
> Next: map each signal ID to NLP keyword clusters for the tagging engine.

---

## PILL LIFECYCLE RULES

- **emerging**: Signal detected in ≥2 articles but sentiment score below emergence threshold (0.45)
- **active**: Sentiment score ≥0.45 sustained over ≥2 polling cycles (30 min)
- **fading**: Sentiment score dropped below active threshold but above dead threshold (0.15)
- **reversed**: Signal direction has flipped (risk→opp or opp→risk) — show as inverted pill before transitioning
- **dead**: Score below 0.15 for ≥4 consecutive polling cycles — remove from display

Hysteresis gap: emergence threshold (0.45) is intentionally lower than reversal threshold (0.55) to prevent flickering.
