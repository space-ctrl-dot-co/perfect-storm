// Perfect Storm — Curated RSS feed definitions + signal matching
// Each feed entry maps a source URL to tickers it's relevant to.
// matchArticleSignals() maps fetched articles → risk/opportunity pills.
//
// Feed health last validated: 2026-03-28
// Tested via live /api/feed proxy on perfectstorm.netlify.app
// ✅ = confirmed working  ❌ = blocked/dead (replaced)
// eia-news: replaced press_room.xml (404) → todayinenergy/rss.xml ✅
// politico-eu: replaced politics.xml (451 blocked) → euractiv trade feed ✅

// ─── Feed catalogue ──────────────────────────────────────────────────────────

export const PS_FEEDS = [

  // ── Macro / Rates ───────────────────────────────────────────────────────────
  { id: "fed-press",      url: "https://www.federalreserve.gov/feeds/press_all.xml",
    tickers: ["XOM","TSLA","AAPL","TSM","ZIM","DAL","UNH","LLY","GS","NVDA","AMD","MSFT",
              "JPM","BAC","WFC","MS","C","BX","AXP","V","NEE","CEG","AES","ED",
              "GM","F","HD","WMT","TGT","COST","MCD","NKE"], cat: "RATE" },
  { id: "wsj-economy",    url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    tickers: ["XOM","TSLA","AAPL","TSM","ZIM","DAL","UNH","LLY","GS","MSFT",
              "JPM","BAC","WFC","MS","C","AXP","V","META","AMZN","GOOGL",
              "CVX","OXY","COP","SLB"], cat: "RATE" },
  { id: "cnbc-markets",   url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147",
    tickers: ["XOM","TSLA","AAPL","TSM","ZIM","DAL","UNH","LLY","GS","NVDA","AMD","MSFT",
              "META","AMZN","GOOGL","ORCL","CRM","JPM","BAC","WFC","MS","C","BX",
              "GM","F","BA","NKE","WMT","TGT","CVX","OXY","COP"], cat: "RATE" },
  { id: "marketwatch",    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    tickers: ["XOM","TSLA","AAPL","TSM","GS","NVDA","AMD","MSFT","DAL","UNH","LLY",
              "META","AMZN","GOOGL","JPM","BAC","V","AXP","CVX","SLB","F","GM",
              "WMT","COST","HD","MCD","PG","NKE"], cat: "RATE" },
  { id: "bbc-business",   url: "https://feeds.bbci.co.uk/news/business/rss.xml",
    tickers: ["XOM","TSLA","AAPL","TSM","ZIM","DAL","GS","MSFT",
              "META","AMZN","GOOGL","BA","GM","F","RIO","VALE","NEM","FCX"], cat: "RATE" },

  // ── Energy / Oil ────────────────────────────────────────────────────────────
  { id: "eia-news",       url: "https://www.eia.gov/todayinenergy/rss.xml",
    tickers: ["XOM","CVX","OXY","COP","SLB","HAL","VLO","PSX","MPC","EOG","EQT","KMI","OKE","FANG","DVN","MRO","HES","BKR","DAL","AAL","UAL","LUV",
              "CHRD","RIG","SM","NOG","CIVI","LBRT","MTDR","VTLE","PTEN","AR","CRC","ARCH"], cat: "GEO" },
  { id: "oilprice",       url: "https://oilprice.com/rss/main",
    tickers: ["XOM","DAL","CVX","OXY","COP","SLB","HAL","VLO","PSX","MPC","EOG","EQT","KMI","OKE","FANG","DVN","MRO","HES","BKR","AAL","UAL","LUV",
              "CHRD","RIG","SM","NOG","CIVI","LBRT"], cat: "GEO" },
  { id: "rigzone",        url: "https://www.rigzone.com/news/rss/rigzone_latest.aspx",
    tickers: ["XOM","CVX","OXY","COP","SLB","HAL","EOG","RIG","LBRT","NOG","CHRD"],       cat: "SECT" },

  // ── Tech / Semiconductors ───────────────────────────────────────────────────
  { id: "techcrunch",     url: "https://techcrunch.com/feed/",
    tickers: ["TSLA","AAPL","TSM","NVDA","AMD","MSFT","META","AMZN","GOOGL","ORCL","CRM","COIN","AVGO","INTC"], cat: "SECT" },
  { id: "semiwiki",       url: "https://semiwiki.com/feed/",
    tickers: ["TSM","AAPL","NVDA","AMD","AVGO","INTC"],                                     cat: "SECT" },
  { id: "anandtech",      url: "https://www.anandtech.com/rss/",
    tickers: ["TSM","AAPL","NVDA","AMD","AVGO","INTC"],                                     cat: "SECT" },
  { id: "ieee-spectrum",  url: "https://spectrum.ieee.org/feeds/feed.rss",
    tickers: ["TSM","AAPL","NVDA","AMD","MSFT","AVGO","INTC"],                              cat: "SECT" },
  { id: "semiengineering",url: "https://semiengineering.com/feed/",
    tickers: ["TSM","NVDA","AMD","AVGO","INTC"],                                            cat: "SECT" },

  // ── Geopolitics / Trade ─────────────────────────────────────────────────────
  { id: "euractiv",       url: "https://www.euractiv.com/sections/trade-society/feed/",
    tickers: ["TSLA","AAPL","TSM","XOM","RTX","LMT","META","GOOGL","AMZN","NKE","GM","F","BA"], cat: "GEO" },
  { id: "defnews",        url: "https://www.defensenews.com/arc/outboundfeeds/rss/",
    tickers: ["TSM","XOM","RTX","LMT","NOC","HII","LHX","LDOS","CACI","SAIC","GD"],        cat: "GEO"  },
  { id: "aljazeera",      url: "https://www.aljazeera.com/xml/rss/all.xml",
    tickers: ["XOM","TSM","AAPL","TSLA","ZIM","RTX","LMT","CVX","OXY","COP","NOC","GD","RIO","VALE","FCX"], cat: "GEO" },
  { id: "bbc-world",      url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    tickers: ["XOM","TSM","AAPL","TSLA","ZIM","RTX","LMT","CVX","COP","NOC","GD","RIO","VALE"], cat: "GEO" },
  { id: "foreign-policy", url: "https://foreignpolicy.com/feed/",
    tickers: ["TSM","XOM","AAPL","TSLA","RTX","LMT","NOC","HII","LHX","GD","CVX","COP"],   cat: "GEO"  },

  // ── Shipping / Logistics ────────────────────────────────────────────────────
  { id: "joc",            url: "https://www.joc.com/rss.xml",
    tickers: ["ZIM"],                                                                       cat: "SECT" },
  { id: "splash247",      url: "https://splash247.com/feed/",
    tickers: ["ZIM"],                                                                       cat: "GEO"  },
  { id: "hellenic-ship",  url: "https://www.hellenicshippingnews.com/feed/",
    tickers: ["ZIM"],                                                                       cat: "GEO"  },

  // ── Airlines / Travel ───────────────────────────────────────────────────────
  { id: "aviationwk",     url: "https://aviationweek.com/rss.xml",
    tickers: ["DAL","AAL","UAL","LUV","JBLU","ULCC","SKYW","ALK","SAVE","HA","BA"],        cat: "SECT" },
  { id: "airlinerwatch",  url: "https://airlinegeeks.com/feed/",
    tickers: ["DAL","AAL","UAL","LUV","JBLU","ULCC","SKYW","ALK","SAVE","HA"],             cat: "SECT" },

  // ── Healthcare / Pharma ─────────────────────────────────────────────────────
  { id: "fierce-pharma",  url: "https://www.fiercepharma.com/rss/xml",
    tickers: ["UNH","LLY","BMY","PFE","JNJ","ABBV","AMGN","MRK","GILD","REGN"],           cat: "SECT" },
  { id: "stat-news",      url: "https://www.statnews.com/feed/",
    tickers: ["UNH","LLY","BMY","PFE","JNJ","ABBV","AMGN","MRK","GILD","REGN"],           cat: "SECT" },
  { id: "biopharma-dive", url: "https://www.biopharmadive.com/feeds/news/",
    tickers: ["UNH","LLY","BMY","PFE","JNJ","ABBV","AMGN","MRK","GILD","REGN"],           cat: "SECT" },
  { id: "healthcare-dive",url: "https://www.healthcaredive.com/feeds/news/",
    tickers: ["UNH","LLY","BMY","PFE","JNJ","ABBV","AMGN","MRK","GILD","REGN",
              "ACCD","OMCL","SGRY","NVST","AVNS","PCVX","PGNY","OSCR","PRVA"],             cat: "SECT" },
  { id: "endpoints-news", url: "https://endpts.com/feed/",
    tickers: ["LLY","BMY","PFE","ABBV","AMGN","MRK","GILD","REGN",
              "ARWR","ARDX","CLDX","DVAX","LNTH","NARI","STAA","SUPN"],                    cat: "SECT" },

  // ── Finance / Markets ───────────────────────────────────────────────────────
  // SEC EDGAR 8-K filings → earnings releases, material events for all tickers
  { id: "sec-edgar-8k",   url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=40&search_text=&output=atom",
    tickers: ["GS","MSFT","AAPL","NVDA","AMD","UNH","LLY","XOM","DAL","RTX","LMT","TSM","ZIM","TSLA",
              "JPM","BAC","WFC","MS","C","BX","AXP","V","META","AMZN","GOOGL","CVX","PFE","JNJ",
              "NKE","WMT","GM","F","BA","AMT","COIN","AVGO","INTC"], cat: "EARN" },

  // ── Finance / Banking ───────────────────────────────────────────────────────
  { id: "bloomberg-finance", url: "https://feeds.bloomberg.com/markets/news.rss",
    tickers: ["JPM","BAC","WFC","MS","C","BX","AXP","V","GS",
              "TPG","STEP","HLNE","ARES","FAF","FNF","NMI","ESNT","NMIH"],                  cat: "RATE" },
  { id: "ft-banking",     url: "https://www.ft.com/rss/home",
    tickers: ["JPM","BAC","WFC","MS","C","BX","GS","AXP","V",
              "TPG","STEP","HLNE","ARES","FAF","FNF","NMI"],                                cat: "RATE" },

  // ── Retail / Consumer ──────────────────────────────────────────────────────
  { id: "retail-dive",    url: "https://www.retaildive.com/feeds/news/",
    tickers: ["WMT","TGT","COST","HD","MCD","NKE","PG","AMZN",
              "CHWY","BOOT","OLLI","BJ","RH","WING","SFM","PLAY","BURL","RVLV","CVNA"], cat: "SECT" },
  { id: "consumer-affairs", url: "https://www.consumeraffairs.com/news/feed",
    tickers: ["WMT","TGT","COST","NKE","PG","MCD","AMZN",
              "CHWY","BOOT","OLLI","BJ","WING","SFM","PLAY"],                               cat: "SECT" },

  // ── Industrials / Autos ────────────────────────────────────────────────────
  { id: "automotive-news",url: "https://www.autonews.com/rss.xml",
    tickers: ["GM","F","TSLA"],                                                             cat: "SECT" },
  { id: "the-drive",      url: "https://www.thedrive.com/feed",
    tickers: ["GM","F","TSLA","BA"],                                                        cat: "SECT" },

  // ── Materials / Mining ─────────────────────────────────────────────────────
  { id: "mining-weekly",  url: "https://www.miningweekly.com/rss",
    tickers: ["CLF","RIO","FCX","NEM","VALE","AA","X","MP"],                                cat: "SECT" },
  { id: "metals-daily",   url: "https://www.metalsdaily.com/rss/",
    tickers: ["CLF","RIO","FCX","NEM","VALE","LIN","AA","X","MP"],                          cat: "SECT" },

  // ── Agriculture ────────────────────────────────────────────────────────────
  { id: "agweb",          url: "https://www.agweb.com/rss/news",
    tickers: ["MOS","CF","ADM","DE"],                                                       cat: "SECT" },
  { id: "world-grain",    url: "https://www.world-grain.com/rss/feed",
    tickers: ["MOS","CF","ADM"],                                                            cat: "GEO"  },

  // ── Renewables / Utilities ─────────────────────────────────────────────────
  { id: "renewable-energy",url: "https://www.renewableenergyworld.com/feed/",
    tickers: ["ENPH","FSLR","RUN","PLUG","NEE","CEG","AES","BEP","D"],                     cat: "SECT" },
  { id: "utility-dive",   url: "https://www.utilitydive.com/feeds/news/",
    tickers: ["NEE","CEG","AES","ED","BEP","D","ENPH","FSLR"],                             cat: "SECT" },

  // ── Crypto / Fintech ───────────────────────────────────────────────────────
  { id: "coindesk",       url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    tickers: ["COIN"],                                                                      cat: "SECT" },

  // ── Weather / Climate ───────────────────────────────────────────────────────
  { id: "noaa-severe",    url: "https://www.weather.gov/rss_page.php?site_name=nws",
    tickers: ["XOM","DAL","ZIM","CVX","AAL","UAL","LUV","MOS","CF","ADM","DE"],             cat: "WTHR" },
  { id: "climate-wire",   url: "https://www.eenews.net/climatewire/rss",
    tickers: ["XOM","TSM","DAL","CVX","NEE","CEG","AES","ENPH","FSLR","RIO","VALE"],        cat: "WTHR" },

  // ── Defense (expanded) ─────────────────────────────────────────────────────
  { id: "breaking-defense", url: "https://breakingdefense.com/full-rss-feed/",
    tickers: ["RTX","LMT","NOC","GD","BA","HII","LHX","LDOS","SAIC","CACI","AVAV"],       cat: "GEO"  },
  { id: "war-zone",         url: "https://www.twz.com/feed",
    tickers: ["RTX","LMT","NOC","GD","BA","HII","XOM","CVX"],                             cat: "GEO"  },

  // ── LNG / Midstream Gas ─────────────────────────────────────────────────────
  { id: "ogj",              url: "https://www.ogj.com/rss",
    tickers: ["XOM","CVX","COP","SLB","HAL","EQT","KMI","OKE","BKR","FANG","MRO","HES"], cat: "SECT" },
  { id: "pipeline-gas-j",   url: "https://pgjonline.com/rss",
    tickers: ["KMI","OKE","BKR","EQT","FANG","MRO","SLB","HAL"],                         cat: "SECT" },
  { id: "lng-global",       url: "https://www.lngglobal.com/feed/rss2",
    tickers: ["XOM","CVX","COP","EQT","KMI","OKE","BKR"],                                 cat: "GEO"  },

  // ── Cybersecurity ───────────────────────────────────────────────────────────
  { id: "krebs-security",   url: "https://krebsonsecurity.com/feed/",
    tickers: ["MSFT","GOOGL","CRWD","PANW","ZS","FTNT","ORCL","AMZN","META"],             cat: "SECT" },
  { id: "hacker-news",      url: "https://thehackernews.com/feeds/posts/default",
    tickers: ["MSFT","GOOGL","CRWD","PANW","ZS","FTNT","ORCL","AMZN","INTC","NVDA"],     cat: "SECT" },

  // ── Supply Chain / Freight ──────────────────────────────────────────────────
  { id: "supply-chain-dive",url: "https://supplychaindive.com/feeds/news/",
    tickers: ["AMZN","WMT","TGT","COST","AAPL","TSM","GM","F","HON","CAT","DE",
              "KNX","LSTR","GXO","WERN","ESAB","GTLS","AWI","LCII"],                       cat: "GEO"  },
  { id: "freightwaves",     url: "https://freightwaves.com/feed/",
    tickers: ["ZIM","DAL","AAL","UAL","LUV","AMZN","WMT",
              "KNX","LSTR","GXO","WERN","ARCB","JBHT","XPO"],                              cat: "GEO"  },

  // ── Real Estate / REITs ─────────────────────────────────────────────────────
  { id: "nareit",           url: "https://www.reit.com/news/rss",
    tickers: ["AMT","EQIX","DLR","SPG","PLD","O","PSA","VTR","WELL","CCI","IRM",
              "AMH","AIRC","HASI","IRT","FAF","FNF","NMI","COOP","PFSI","RDN"],            cat: "SECT" },

  // ── Nuclear / Clean Energy ──────────────────────────────────────────────────
  { id: "world-nuclear-news",url: "https://world-nuclear-news.org/rss",
    tickers: ["CEG","DUK","SO","EXC","NEE","VST","AES"],                                  cat: "SECT" },

  // ── Industrials (expanded) ─────────────────────────────────────────────────
  { id: "industry-week",    url: "https://www.industryweek.com/rss/all",
    tickers: ["HON","CAT","GE","MMM","EMR","ROK","ETN","DE","IR","ITW","PH",
              "ESAB","GTLS","AWI","LCII","GXO","KNX","LSTR","WERN"],                       cat: "SECT" },

  // ── Medical Devices ─────────────────────────────────────────────────────────
  { id: "medtech-dive",     url: "https://www.medtechdive.com/feeds/news/",
    tickers: ["ISRG","MDT","SYK","BSX","EW","ABT","DHR","BAX","ZBH","HOLX",
              "NVST","AVNS","OMCL","SGRY","ARWR","NARI","LMAT","GKOS"],                    cat: "SECT" },

  // ── Insurance ──────────────────────────────────────────────────────────────
  { id: "insurance-journal",url: "https://www.insurancejournal.com/feed/",
    tickers: ["CB","AIG","ALL","MET","PRU","AFL","TRV","PGR","HIG","MMC","AON","AJG",
              "FAF","FNF","NMI","ESNT","NMIH","RDN","PFSI","TPG","STEP","ARES"],           cat: "SECT" },

  // ── Alt-Asset Managers / Private Equity ────────────────────────────────────
  { id: "alt-invest-news",  url: "https://www.privateequityinternational.com/feed/",
    tickers: ["BX","KKR","APO","CG","ARES","TPG","STEP","HLNE","MAIN","ARCC"],            cat: "RATE" },

  // ── Biotech / Gene Therapy (R1K extended) ──────────────────────────────────
  { id: "genetic-eng-news", url: "https://www.genengnews.com/feed/",
    tickers: ["ARWR","BLUE","NTLA","CRSP","EDIT","BEAM","IOVA","MRNA","GILD","REGN",
              "NARI","GKOS","ACAD","IDYA","HRMY","RVNC"],                                  cat: "SECT" },

];

// ─── Company name disambiguation ─────────────────────────────────────────────
// Used by matchArticleSignals() to enforce scope:"company" rules.
// A company-scoped rule only fires if the article text mentions the company
// by name or one of its key drug/brand/product aliases.
// Keep aliases lowercase — matching is case-insensitive.

export const TICKER_NAMES = {
  // ── Pharma ──────────────────────────────────────────────────────────────────
  BMY:  ["bristol myers","bristol-myers","squibb","opdivo","eliquis","revlimid","breyanzi","camzyos","sotyktu"],
  PFE:  ["pfizer","paxlovid","comirnaty","vyndaqel","lorbrena","braftovi","padcev","nurtec"],
  JNJ:  ["johnson & johnson","j&j","janssen","darzalex","stelara","tremfya","carvykti","spravato","rybrevant"],
  ABBV: ["abbvie","humira","skyrizi","rinvoq","imbruvica","venclexta","epkinly","qulipta"],
  AMGN: ["amgen","enbrel","repatha","lumakras","evenity","otezla","tezspire","blincyto","imdelltra"],
  MRK:  ["merck","keytruda","winrevair","sotatercept","gardasil","januvia","lynparza","welireg","capvaxive"],
  GILD: ["gilead","biktarvy","veklury","trodelvy","yescarta","sunlenca","seladelpar","livdelzi"],
  REGN: ["regeneron","dupixent","eylea","libtayo","kevzara","odronextamab","linvoseltamab"],
  LLY:  ["eli lilly","lilly","zepbound","mounjaro","tirzepatide","donanemab","trulicity","taltz","verzenio","jaypirca"],
  UNH:  ["unitedhealth","united health","optum","unitedhealthcare","change healthcare"],

  // ── Defense ─────────────────────────────────────────────────────────────────
  NOC:  ["northrop grumman","northrop","b-21","b21 raider","groundmaster","triton"],
  HII:  ["huntington ingalls","huntington","newport news","ingalls shipbuilding"],
  LHX:  ["l3harris","l3 harris","harris technologies","l3technologies"],
  LDOS: ["leidos"],
  CACI: ["caci international","caci"],
  SAIC: ["science applications","saic"],
  GD:   ["general dynamics","gulfstream","abrams","stryker general","virginia-class","columbia-class"],
  RTX:  ["raytheon","rtx","pratt & whitney","collins aerospace","patriot missile","ltamds","pac-3"],
  LMT:  ["lockheed martin","lockheed","f-35","f35","thaad","lmxt","sikorsky"],

  // ── Airlines ────────────────────────────────────────────────────────────────
  DAL:  ["delta air","delta airlines","delta flight"],
  AAL:  ["american airlines","american air","aadvantage"],
  UAL:  ["united airlines","united air","mileageplus"],
  LUV:  ["southwest airlines","southwest air","rapid rewards"],
  JBLU: ["jetblue","jet blue","trueblue"],
  ALK:  ["alaska airlines","alaska air","mileage plan"],
  SKYW: ["skywest","sky west"],
  SAVE: ["spirit airlines","spirit air"],
  HA:   ["hawaiian airlines","hawaiian air"],
  ULCC: ["frontier airlines","frontier air"],

  // ── Tech ────────────────────────────────────────────────────────────────────
  TSLA: ["tesla","elon musk","optimus robot","megapack","powerwall","cybertruck"],
  AAPL: ["apple","iphone","ipad","mac","app store","vision pro","visionos"],
  MSFT: ["microsoft","azure","windows","xbox","copilot","github","openai"],
  NVDA: ["nvidia","h100","h200","blackwell","gb200","cuda","geforce","nvidiaT"],
  AMD:  ["amd","ryzen","epyc","radeon","instinct","mi300"],
  TSM:  ["tsmc","taiwan semiconductor","tsmc arizona","jasm"],
  META: ["meta platforms","facebook","instagram","whatsapp","meta ai","llama","reels"],
  AMZN: ["amazon","aws","amazon web services","prime","alexa","kindle"],
  GOOGL:["google","alphabet","youtube","gemini","waymo","deepmind","gcp"],
  INTC: ["intel","gaudi","core ultra","intel18a","intel foundry","mobileye"],
  AVGO: ["broadcom","avgo","vmware","symantec broadcom"],
  ORCL: ["oracle","oci","oracle cloud","oracle database"],
  CRM:  ["salesforce","agentforce","einstein gpt","slack salesforce","tableau salesforce"],

  // ── Finance ─────────────────────────────────────────────────────────────────
  GS:   ["goldman sachs","goldman","marcus gs"],
  JPM:  ["jpmorgan","jp morgan","chase bank","jpmc"],
  BAC:  ["bank of america","bofa","merrill lynch","baml"],
  WFC:  ["wells fargo","wellsfargo"],
  MS:   ["morgan stanley","e-trade morgan"],
  C:    ["citigroup","citi bank","citibank","citi group"],
  BX:   ["blackstone"],
  AXP:  ["american express","amex"],
  V:    ["visa inc","visa payment","visa network"],

  // ── Energy ──────────────────────────────────────────────────────────────────
  XOM:  ["exxon","exxonmobil","mobil oil","permian exxon"],
  CVX:  ["chevron"],
  OXY:  ["occidental petroleum","occidental","oxy petroleum"],
  COP:  ["conocophillips","conoco phillips","conocoph"],
  SLB:  ["schlumberger","slb oilfield"],
  HAL:  ["halliburton"],
  EOG:  ["eog resources"],
  VLO:  ["valero"],
  PSX:  ["phillips 66"],
  MPC:  ["marathon petroleum","marathon petro"],

  // ── Other ────────────────────────────────────────────────────────────────────
  BA:   ["boeing","737 max","787 dreamliner","737 max"],
  ZIM:  ["zim integrated","zim shipping","zim line"],
  NKE:  ["nike","jordan brand","converse nike"],
  WMT:  ["walmart","sam's club","samsclub"],
  TGT:  ["target corp","target store","target retail"],
  COST: ["costco"],
  HD:   ["home depot"],
  MCD:  ["mcdonald's","mcdonalds","mccafe"],
  PG:   ["procter & gamble","p&g","procter gamble","gillette pg","tide detergent"],
  COIN: ["coinbase"],
  NEE:  ["nextera energy","nextera"],
  CEG:  ["constellation energy","constellation brands"],
  AMT:  ["american tower","amt reit"],
};
// ─── Sector → tickers map ────────────────────────────────────────────────────
// Mirrors SECTOR_GROUPS in App.jsx. Used by sector-scoped SIGNAL_RULES to
// auto-broadcast a signal to every ticker in a sector without listing them
// individually. Add new tickers here when you add them to SECTOR_GROUPS.
export const SECTOR_TICKERS = {
  def:   ['LMT','RTX','NOC','GD','BA','HII','LDOS','CACI','LHX'],
  eng:   ['XOM','CVX','COP','SLB','MPC','OXY','PSX','VLO','EOG'],
  con:   ['TSLA','AMZN','NKE','AAPL','SBUX','MCD','YUM','GM','F','MELI','LULU','DASH','JD','PDD','BKNG','ABNB'],
  fin:   ['JPM','GS','MS','BAC','C','BX','BLK','SCHW','WFC'],
  sem:   ['NVDA','AMD','INTC','TSM','AVGO','QCOM','MRVL','MU','AMAT','TXN','LRCX','KLAC','ADI','NXPI','MCHP','ON','GFS','ARM','ASML'],
  sft:   ['MSFT','GOOGL','META','ORCL','CRM','ADBE','ADSK','NOW','SNOW','PLTR','WDAY','TEAM','CDNS','SNPS','INTU','DDOG','ZS','PANW','CRWD','FTNT','MDB','ROP','VRSK','ANSS'],
  hw:    ['AAPL','DELL','HPE','AVGO','INTC','ANET','CSCO','PSTG','WDC','IBM'],
  pharma:['LLY','PFE','MRK','ABBV','AMGN','BMY','NVO','AZN','RHHBY'],
  hcsv:  ['UNH','JNJ','HCA','CI','ELV','HUM','THC','MOH','DVA'],
  rx:    ['CVS','WBA','MCK','ABC','CAH','ESRX','RAD'],
  air:   ['DAL','AAL','UAL','LUV','JBLU','SAVE','ALK','HA','SKYW'],
  mat:   ['NEM','FCX','MP','CLF','MOS','CF','AA','GOLD','WPM'],
  fin2:  ['COIN','AXP','V','MA','PYPL','SQ','SOFI','NU','HOOD'],
  dc:    ['AMT','EQIX','DLR','CCI','CONE','IREN','CORZ','WULF','HUT'],
  bio:   ['MRNA','BNTX','REGN','BIIB','GILD','VRTX','ILMN','IONS','EDIT','DXCM','GEHC','ALGN'],
  util:  ['NEE','DUK','SO','AEP','D','PCG','EXC','XEL','ES','ENPH'],
  ind:   ['HON','CAT','GE','MMM','EMR','ROK','ETN','IR','PH','CTAS','FAST','PCAR'],
  trns:  ['UNP','CSX','FDX','UPS','XPO','JBHT','CHRW','SAIA','ODFL','ZIM','CPRT'],
  reit:  ['SPG','PLD','O','WELL','PSA','VTR','AMT','IRM','CBRE'],
  avia:  ['LMT','BA','GE','TDG','HEI','HWM','SPR','LHX','TXT','KTOS'],
  ret:   ['WMT','TGT','COST','HD','LOW','TJX','DLTR','DG','KR','ORLY','ROST','ULTA','EBAY'],
  media: ['NFLX','DIS','CMCSA','PARA','WBD','SPOT','TTD','RBLX','T','VZ','CHTR','EA','SIRI'],
  ins:   ['CB','AIG','ALL','MET','PRU','AFL','TRV','PGR','HIG'],
  chem:  ['LIN','DOW','DD','EMN','LYB','PPG','APD','CE','ALB','SHW'],
  hmb:   ['DHI','LEN','PHM','NVR','TOL'],
  cnst:  ['PWR','FLR','ACM','J','MTZ'],
  agri:  ['ADM','BG','CTVA','DE','NTR'],
  food:  ['KO','PEP','MDLZ','KHC','GIS','SBUX','MNST','KDP','CCEP'],
  hosp:  ['MAR','HLT','MGM','CCL','LVS'],
};

// ─── Ticker-level sector bias overrides ──────────────────────────────────────
// Controls how individual tickers diverge from their sector's default signal.
//
// Structure: { [ticker]: { [sectorKey]: { [cat]: 'neutral' | 'invert' } } }
//
//  'neutral' — skip this ticker when the sector-broadcast rule fires
//              (the company is insulated from this thematic risk/opp)
//  'invert'  — flip dir: risk→opp or opp→risk
//              (the company actually moves counter to the sector)
//
// Only applies to sector-broadcast rules. Per-ticker SIGNAL_RULES are unaffected.
// Keys must match sectorKey from SECTOR_TICKERS and cat from SIGNAL_RULES.
//
export const TICKER_SECTOR_BIAS = {

  // ── Semiconductors ──────────────────────────────────────────────────────────
  // INTC has no real AI chip product shipping at scale — don't inherit sector opp
  INTC: { sem: { SECT: 'neutral' } },
  // ASML manufactures in Netherlands; China open-source AI model risk is
  // indirect for equipment makers (chips still need EUV regardless of model size)
  ASML: { sem: { GPOL: 'neutral' } },

  // ── Finance ─────────────────────────────────────────────────────────────────
  // SCHW's core revenue is cash-sweep NIM. Fed rate cuts compress it — the sector
  // "rate cut = opp" narrative inverts for Schwab specifically.
  SCHW: { fin: { RATE: 'invert' } },

  // ── Consumer (con) ──────────────────────────────────────────────────────────
  // Services / franchise / platform models don't face goods-tariff pass-through
  // the way manufacturers and physical-goods retailers do.
  SBUX: { con: { GEO: 'neutral' } },   // café service model — tariffs on goods don't bite
  MCD:  { con: { GEO: 'neutral' } },   // franchise royalties — minimal direct goods import
  BKNG: { con: { GEO: 'neutral' } },   // pure online travel platform — no physical goods
  ABNB: { con: { GEO: 'neutral' } },   // marketplace — no goods import exposure
  MELI: { con: { GEO: 'neutral' } },   // LatAm-focused — outside US-China tariff crossfire

  // ── Pharma ──────────────────────────────────────────────────────────────────
  // GLP-1 supercycle opp (cat:SECT) belongs to LLY and NVO only.
  // Remaining pharma tickers have no meaningful GLP-1 pipeline at this time.
  PFE:  { pharma: { SECT: 'neutral' } },
  MRK:  { pharma: { SECT: 'neutral' } },
  ABBV: { pharma: { SECT: 'neutral' } },
  AMGN: { pharma: { SECT: 'neutral' } },
  BMY:  { pharma: { SECT: 'neutral' } },
  AZN:  { pharma: { SECT: 'neutral' } },

  // ── Defense ─────────────────────────────────────────────────────────────────
  // Boeing's problems are execution and legal (777X delays, DOJ prosecution,
  // Spirit AeroSystems integration). NATO rearmament tailwinds don't rescue
  // a production line that can't hit delivery schedules. DOGE scrutiny is noise
  // relative to the self-inflicted program struggles.
  BA: { def: { GEO: 'neutral', POL: 'neutral' } },

  // ── Media ───────────────────────────────────────────────────────────────────
  // T and VZ divested content assets — they are telecom infrastructure,
  // not part of linear TV decay or streaming-ad dynamics.
  // SIRI is radio/audio. EA and RBLX are gaming — no TV/streaming exposure.
  T:    { media: { SECT: 'neutral' } },
  VZ:   { media: { SECT: 'neutral' } },
  SIRI: { media: { SECT: 'neutral' } },
  EA:   { media: { SECT: 'neutral' } },
  RBLX: { media: { SECT: 'neutral' } },

};

// ─── Additional company name aliases for new tickers ────────────────────────
// Appended to TICKER_NAMES for company-scoped rule matching.
Object.assign(TICKER_NAMES, {
  // DOW 30 additions
  CAT:  ["caterpillar","cat equipment","cat construction","caterpillar inc"],
  HON:  ["honeywell","honeywell building","honeywell aerospace","honeywell quantum"],
  IBM:  ["ibm","watson","watsonx","ibm consulting","red hat","mainframe z17"],
  KO:   ["coca-cola","coca cola","coke","sprite coca","fanta coca"],
  MMM:  ["3m company","3m corp","mmm pfas","scotch 3m","post-it 3m","solventum"],
  SHW:  ["sherwin-williams","sherwin williams","sherwin paint","valspar sherwin"],
  TRV:  ["travelers","travelers companies","travelers insurance","st. paul travelers"],
  VZ:   ["verizon","vz wireless","verizon fios","verizon 5g","verizon network"],
  DIS:  ["disney","walt disney","espn","hulu disney","marvel disney","pixar"],
  CSCO: ["cisco","cisco systems","cisco networking","webex","splunk cisco"],
  // NASDAQ 100 additions
  NFLX: ["netflix","netflix streaming","netflix originals","netflix ad tier"],
  ADBE: ["adobe","adobe firefly","creative cloud","photoshop adobe","figma adobe"],
  QCOM: ["qualcomm","snapdragon","qualcomm chip","qualcomm modem","qcom license"],
  PANW: ["palo alto","palo alto networks","prisma cloud","cortex palo alto"],
  CRWD: ["crowdstrike","falcon platform","crowdstrike endpoint","cs sensor"],
  DDOG: ["datadog","datadog observability","datadog apm","datadog logs"],
  WDAY: ["workday","workday hr","workday financials","workday erp"],
  ZS:   ["zscaler","zero trust zscaler","zia zscaler","zpa zscaler"],
  TEAM: ["atlassian","jira","confluence atlassian","trello atlassian"],
  SNOW: ["snowflake","snowflake data","snowpark","snowflake warehouse"],
  MDB:  ["mongodb","atlas mongodb","mongo database","document db mongodb"],
  INTU: ["intuit","turbotax","quickbooks","mint intuit","credit karma intuit"],
  CDNS: ["cadence design","cadence eda","cadence semiconductor"],
  SNPS: ["synopsys","synopsys eda","synopsys fusion"],
  NOW:  ["servicenow","service now","now platform servicenow"],
  FTNT: ["fortinet","fortigate","fortinet security","fortinet firewall"],
  BKNG: ["booking holdings","booking.com","priceline","kayak","agoda booking"],
  ABNB: ["airbnb","airbnb host","airbnb listing"],
  MELI: ["mercadolibre","mercado libre","mercadopago"],
  SBUX: ["starbucks","starbucks coffee","starbucks rewards"],
  COST: ["costco","costco wholesale","costco membership"],
  MRVL: ["marvell","marvell technology","marvell semiconductor","marvell asic"],
  MU:   ["micron","micron technology","dram micron","nand micron","hbm micron"],
  AMAT: ["applied materials","applied micro","amat semiconductor equipment"],
  LRCX: ["lam research","lam etch","lam deposition"],
  KLAC: ["kla corp","kla tencor","kla inspection","kla metrology"],
  ADI:  ["analog devices","adi semiconductor","linear technology adi"],
  NXPI: ["nxp semiconductors","nxp automotive","nxp edge"],
  MCHP: ["microchip technology","microchip mcu","atmel microchip"],
  ON:   ["on semiconductor","onsemi","on semi ev","onsemi power"],
  ARM:  ["arm holdings","arm chip","arm architecture","arm licensing","cortex arm"],
  ASML: ["asml","extreme ultraviolet","euv lithography","asml machine"],
  PYPL: ["paypal","venmo","paypal checkout","paypal payment"],
  MA:   ["mastercard","mastercard payment","mastercard network","mc debit"],
  VRSK: ["verisk","verisk analytics","verisk insurance data"],
  ROP:  ["roper technologies","roper software","roper acquisitions"],
  ANSS: ["ansys","ansys simulation","ansys engineering"],
  IDXX: ["idexx","idexx laboratories","idexx veterinary","idexx diagnostics"],
  MRNA: ["moderna","moderna vaccine","moderna mrna","covid vaccine moderna"],
  BNTX: ["biontech","pfizer biontech","mrna biontech"],
  BIIB: ["biogen","leqembi biogen","alzheimer biogen","multiple sclerosis biogen"],
  VRTX: ["vertex pharmaceuticals","vertex cystic fibrosis","trikafta vertex"],
  DXCM: ["dexcom","dexcom cgm","continuous glucose dexcom"],
  ILMN: ["illumina","gene sequencing illumina","next-gen sequencing"],
  GILD: ["gilead","biktarvy gilead","hepatitis gilead"],
  REGN: ["regeneron","dupixent","eylea regeneron"],
  CMCSA:["comcast","xfinity","nbcuniversal comcast","comcast cable"],
  CHTR: ["charter communications","spectrum charter","charter cable"],
  PARA: ["paramount","cbs paramount","paramount+ streaming"],
  WBD:  ["warner bros","hbo max","max streaming","discovery wbd"],
  SPOT: ["spotify","spotify podcast","spotify streaming","spotify premium"],
  TTD:  ["the trade desk","trade desk programmatic","trade desk advertising"],
  RBLX: ["roblox","roblox platform","roblox gaming"],
  PLTR: ["palantir","palantir gotham","palantir foundry","palantir ai"],
  ADSK: ["autodesk","autocad","autodesk revit","bim autodesk"],
  APP:  ["applovin","applovin ad","max applovin","appodeal applovin"],
  EA:   ["electronic arts","ea games","fifa ea","apex legends ea"],
  TTWO: ["take-two","gta vi","rockstar games","2k games take-two"],
  EBAY: ["ebay","ebay marketplace","ebay seller"],
  LULU: ["lululemon","lulu athleisure","lululemon mirror"],
  DASH: ["doordash","doordash delivery","dashpass"],
  ORLY: ["o'reilly auto","oreilly auto parts","o'reilly parts"],
  ROST: ["ross stores","ross dress","dd's discounts"],
  ULTA: ["ulta beauty","ulta salon","ulta cosmetics"],
  ODFL: ["old dominion","old dominion freight","odfl ltl"],
  PCAR: ["paccar","kenworth","peterbilt","paccar truck"],
  CTAS: ["cintas","cintas uniform","cintas services"],
  FAST: ["fastenal","fastenal supply","fastenal distribution"],
  MNST: ["monster beverage","monster energy","monster drink"],
  KHC:  ["kraft heinz","kraft heinz food","oscar mayer","heinz ketchup"],
  MDLZ: ["mondelez","oreo mondelez","cadbury mondelez","nabisco"],
  KDP:  ["keurig dr pepper","dr pepper","keurig coffee","snapple keurig"],
  CCEP: ["coca-cola europacific","ccep bottler","european coke bottler"],
  PAYX: ["paychex","paychex payroll","paychex hr"],
  ADP:  ["adp payroll","automatic data processing","adp workforce"],
  CTSH: ["cognizant","cognizant technology","cognizant it services"],
  SWKS: ["skyworks solutions","skyworks rf","skyworks semi"],
  ALGN: ["align technology","invisalign","itero align"],
  FANG: ["diamondback energy","diamondback permian","fang oil"],
  CSX:  ["csx rail","csx transportation","csx freight"],
  CPRT: ["copart","copart auction","used cars copart"],
  JD:   ["jd.com","jingdong","jd logistics"],
  PDD:  ["pinduoduo","temu pdd","pdd holdings"],
  GEHC: ["ge healthcare","gehc imaging","ge medical"],
  SIRI: ["sirius xm","siriusxm","pandora sirius"],
  AEP:  ["american electric power","aep utility","aep grid"],
  XEL:  ["xcel energy","xcel utility","northern states xcel"],
  EXC:  ["exelon","exelon utility","commonwealth edison","pepco exelon"],
  GFS:  ["globalfoundries","global foundries","gfs semiconductor"],
  VRSK: ["verisk analytics","verisk insurance"],
});



// ─── Keyword signal rules ─────────────────────────────────────────────────────
// Each rule: { ticker, dir, cat, label, scope?, keywords[] }
// OR:       { sector, dir, cat, label, keywords[] }  ← broadcasts to all tickers in that sector
// scope:"sector"  → fires for all tickers in group when keyword matched (default)
// scope:"company" → only fires if article text also mentions the company by name
// A match fires when ≥1 keyword appears in title+description (case-insensitive).
// Covers all 14 STOCKS: RTX, XOM, LMT, NVDA, GS, AMD, TSLA, AAPL, TSM, ZIM, DAL, UNH, LLY, MSFT

export const SIGNAL_RULES = [

  // ── TSLA ──────────────────────────────────────────────────────────────────
  { ticker:"TSLA", dir:"risk", cat:"GEO",  label:"Geo: China BYD -22% TSLA Share",
    keywords:["byd","china ev","china market","china sales","tesla china","tsla china"] },
  { ticker:"TSLA", dir:"risk", cat:"GEO",  label:"Geo: EU Tariff Retaliation",
    keywords:["eu tariff","european tariff","eu retaliation","trade war europe","eu car tax"] },
  { ticker:"TSLA", dir:"risk", cat:"RATE", label:"Rate: Fed Holds — EV Financing Stress",
    keywords:["fed hold","interest rate hold","high rates ev","ev loan","auto loan rate"] },
  { ticker:"TSLA", dir:"risk", cat:"SECT", label:"Sector: Musk Brand Risk",
    keywords:["musk brand","musk controversy","tesla boycott","tesla brand","elon controversy","musk doge","tesla sales drop"] },
  { ticker:"TSLA", dir:"opp",  cat:"SECT", label:"Sector: Optimus Pilot Production",
    keywords:["optimus","tesla robot","humanoid robot","tesla optimus"] },
  { ticker:"TSLA", dir:"opp",  cat:"SECT", label:"Sector: FSD / Robotaxi Revenue",
    keywords:["fsd","full self-driving","autopilot subscription","tesla autonomy","robotaxi","driverless permit"] },
  { ticker:"TSLA", dir:"opp",  cat:"SECT", label:"Sector: Megapack Energy Storage",
    keywords:["megapack","tesla energy storage","battery storage","powerwall","energy storage tesla"] },
  { ticker:"TSLA", dir:"opp",  cat:"GEO",  label:"Geo: USMCA EV Credit Advantage",
    keywords:["usmca","ev credit","ira ev","inflation reduction ev","domestic ev credit"] },

  // ── XOM ───────────────────────────────────────────────────────────────────
  { ticker:"XOM", dir:"risk", cat:"GEO",  label:"Geo: Russia Sanctions Lift Risk",
    keywords:["russia sanction","russia oil","russia lift","russia ceasefire","russia peace"] },
  { ticker:"XOM", dir:"risk", cat:"GEO",  label:"Geo: OPEC+ Supply Surge",
    keywords:["opec","opec+","opec supply","opec output","oil supply increase","saudi oil"] },
  { ticker:"XOM", dir:"risk", cat:"RATE", label:"Rate: Strong USD Compresses Revenue",
    keywords:["dollar strengthen","usd rally","strong dollar","dxy","dollar index"] },
  { ticker:"XOM", dir:"opp",  cat:"GEO",  label:"Geo: LNG Europe Demand Surge",
    keywords:["lng europe","eu lng","european lng","liquefied natural gas europe"] },
  { ticker:"XOM", dir:"opp",  cat:"SECT", label:"Sector: Permian Basin Record Output",
    keywords:["permian","permian basin","permian output","west texas","exxon permian","guyana output"] },
  { ticker:"XOM", dir:"opp",  cat:"GEO",  label:"Geo: Middle East Conflict Premium",
    keywords:["middle east","iran","strait of hormuz","oil risk premium","geopolitical oil","brent crude"] },
  { ticker:"XOM", dir:"risk", cat:"WTHR", label:"Weather: Gulf Hurricane Season Risk",
    keywords:["gulf hurricane","gulf storm","hurricane season","gulf of mexico storm"] },

  // ── AAPL ──────────────────────────────────────────────────────────────────
  { ticker:"AAPL", dir:"risk", cat:"GEO",  label:"Geo: China Manufacturing Disruption",
    keywords:["china manufacturing","foxconn","china factory","china supply chain","iphone china"] },
  { ticker:"AAPL", dir:"risk", cat:"GEO",  label:"Geo: US-China Tariff Escalation",
    keywords:["us china tariff","china tariff","iphone tariff","tech tariff","apple tariff"] },
  { ticker:"AAPL", dir:"risk", cat:"RATE", label:"Rate: Consumer Spend Compression",
    keywords:["consumer spending","consumer confidence","retail slowdown","consumer weakness"] },
  { ticker:"AAPL", dir:"risk", cat:"SECT", label:"Sector: DOJ App Store Antitrust",
    keywords:["doj apple","app store antitrust","apple antitrust","app store lawsuit"] },
  { ticker:"AAPL", dir:"risk", cat:"GEO",  label:"Geo: EU DMA Compliance Cost",
    keywords:["eu dma","digital markets act","apple dma","eu app store","european app store"] },
  { ticker:"AAPL", dir:"opp",  cat:"GEO",  label:"Geo: India Manufacturing Pivot",
    keywords:["india manufacturing","india iphone","apple india","tata iphone","india factory"] },
  { ticker:"AAPL", dir:"opp",  cat:"SECT", label:"Sector: Vision Pro Enterprise",
    keywords:["vision pro","apple vision","spatial computing","apple enterprise","visionos"] },

  // ── TSM ───────────────────────────────────────────────────────────────────
  { ticker:"TSM", dir:"risk", cat:"GEO",  label:"Geo: Taiwan Strait Military Tension",
    keywords:["taiwan strait","taiwan military","china taiwan","pla taiwan","taiwan tension","cross-strait"] },
  { ticker:"TSM", dir:"risk", cat:"GEO",  label:"Geo: US Export Chip Controls",
    keywords:["chip export","export control","chip ban","semiconductor export","bis chip","entity list"] },
  { ticker:"TSM", dir:"risk", cat:"WTHR", label:"Weather: Taiwan Drought / Water Shortage",
    keywords:["taiwan drought","taiwan water","semiconductor water","tsmc water","water shortage taiwan"] },
  { ticker:"TSM", dir:"opp",  cat:"GEO",  label:"Geo: Arizona Fab Ramp",
    keywords:["arizona fab","tsmc arizona","phoenix fab","us semiconductor","chips act"] },
  { ticker:"TSM", dir:"opp",  cat:"GEO",  label:"Geo: Japan Kumamoto Expansion",
    keywords:["kumamoto","japan fab","tsmc japan","jasm","japan semiconductor"] },
  { ticker:"TSM", dir:"opp",  cat:"SECT", label:"Sector: Custom Silicon Migration",
    keywords:["custom silicon","apple chip","nvidia custom","arm chip","custom asic","in-house chip"] },

  // ── ZIM ───────────────────────────────────────────────────────────────────
  { ticker:"ZIM", dir:"risk", cat:"GEO",  label:"Geo: Red Sea Houthi Disruption",
    keywords:["red sea","houthi","suez alternative","bab-el-mandeb","yemen attack","shipping attack"] },
  { ticker:"ZIM", dir:"risk", cat:"SECT", label:"Sector: Spot Rate Collapse",
    keywords:["spot rate","freight rate","container rate","shipping rate","freight collapse"] },
  { ticker:"ZIM", dir:"risk", cat:"RATE", label:"Rate: Bunker Fuel Cost Surge",
    keywords:["bunker fuel","marine fuel","shipping fuel","vlsfo","fuel surcharge"] },
  { ticker:"ZIM", dir:"opp",  cat:"GEO",  label:"Geo: East-West Rerouting Premium",
    keywords:["reroute","cape of good hope","shipping reroute","longer route","cape route"] },
  { ticker:"ZIM", dir:"opp",  cat:"SECT", label:"Sector: Asia-US Volume Rebound",
    keywords:["asia us volume","transpacific volume","container demand","import surge","us import"] },
  { ticker:"ZIM", dir:"risk", cat:"WTHR", label:"Weather: Panama Canal Drought",
    keywords:["panama canal","canal drought","canal water","canal congestion","canal delay"] },

  // ── DAL ───────────────────────────────────────────────────────────────────
  { ticker:"DAL", dir:"risk", cat:"GEO",  label:"Geo: Transatlantic Demand Softness",
    keywords:["transatlantic","europe travel","us europe flight","atlantic demand","europe booking"] },
  { ticker:"DAL", dir:"risk", cat:"SECT", label:"Sector: Boeing Delivery Delays",
    keywords:["boeing delay","737 delay","aircraft delivery","boeing grounding","faa boeing"] },
  { ticker:"DAL", dir:"risk", cat:"RATE", label:"Rate: Jet Fuel Cost Spike",
    keywords:["jet fuel","aviation fuel","kerosene price","fuel hedging","airline fuel cost"] },
  { ticker:"DAL", dir:"opp",  cat:"SECT", label:"Sector: Premium Cabin Yield Expansion",
    keywords:["premium cabin","business class","first class yield","premium travel","delta premium"] },
  { ticker:"DAL", dir:"opp",  cat:"SECT", label:"Sector: Corporate Travel Recovery",
    keywords:["corporate travel","business travel","enterprise travel","b2b travel","corporate booking"] },
  { ticker:"DAL", dir:"risk", cat:"WTHR", label:"Weather: Winter Storm Hub Disruption",
    keywords:["winter storm","blizzard","ice storm","severe weather flight","airport closure"] },

  // ── UNH ───────────────────────────────────────────────────────────────────
  { ticker:"UNH", dir:"risk", cat:"SECT", label:"Sector: Medicare Advantage Rate Cuts",
    keywords:["medicare advantage","cms rate","medicare cut","ma rate","cms payment","medicare rate"] },
  { ticker:"UNH", dir:"risk", cat:"SECT", label:"Sector: Cyber Attack Claims Spike",
    keywords:["change healthcare","optum hack","health cyber","insurance cyber","claims disruption"] },
  { ticker:"UNH", dir:"risk", cat:"RATE", label:"Rate: Medical Cost Trend Inflation",
    keywords:["medical inflation","healthcare cost","medical cost trend","insurance cost","claim cost","medical loss ratio"] },
  { ticker:"UNH", dir:"opp",  cat:"SECT", label:"Sector: Optum Health Margin Expansion",
    keywords:["optum","optum health","health services","care delivery","optum revenue"] },
  { ticker:"UNH", dir:"risk", cat:"RATE", label:"Rate: GLP-1 Utilization Cost Wave",
    keywords:["glp-1","glp1","ozempic","wegovy","zepbound","obesity drug","semaglutide","tirzepatide"] },
  { ticker:"UNH", dir:"risk", cat:"SECT", label:"Sector: DOJ Antitrust Probe",
    keywords:["unh antitrust","unitedhealth doj","optum antitrust","health insurance probe"] },

  // ── LLY ───────────────────────────────────────────────────────────────────
  { ticker:"LLY", dir:"opp",  cat:"SECT", label:"Sector: GLP-1 Obesity Market Expansion",
    keywords:["glp-1","glp1","ozempic","zepbound","mounjaro","tirzepatide","obesity market","weight loss drug"] },
  { ticker:"LLY", dir:"opp",  cat:"SECT", label:"Sector: Alzheimer Pipeline Optionality",
    keywords:["alzheimer","donanemab","lecanemab","amyloid","dementia drug","alzheimer trial"] },
  { ticker:"LLY", dir:"risk", cat:"GEO",  label:"Geo: IRA Drug Price Negotiation",
    keywords:["inflation reduction act drug","drug price negotiation","cms drug negotiation","medicare drug price","medicare price negotiation","inflation reduction drug price"] },
  { ticker:"LLY", dir:"risk", cat:"SECT", label:"Sector: Manufacturing Capacity Constraint",
    keywords:["lilly capacity","drug shortage","manufacturing shortage","injectable shortage","lilly supply"] },
  { ticker:"LLY", dir:"opp",  cat:"GEO",  label:"Geo: Global Capacity Expansion",
    keywords:["lilly expansion","new factory","lilly plant","manufacturing expansion","lilly facility","lilly invest"] },
  { ticker:"LLY", dir:"risk", cat:"SECT", label:"Sector: Biosimilar Competition Risk",
    keywords:["biosimilar","generic drug","drug competition","patent cliff","patent expiry"] },

  // ── NVDA ──────────────────────────────────────────────────────────────────
  { ticker:"NVDA", dir:"opp",  cat:"SECT", label:"Sector: AI Chip Demand Surge",
    keywords:["h100","h200","gpu order","ai chip demand","hyperscaler chip","nvidia order","blackwell","gb200"] },
  { ticker:"NVDA", dir:"opp",  cat:"GEO",  label:"Geo: Sovereign AI Pipeline",
    keywords:["sovereign ai","nation ai","state ai","ai program","h200 approved","nvidia export approved"] },
  { ticker:"NVDA", dir:"risk", cat:"GEO",  label:"Geo: China Export Controls",
    keywords:["chip export","export control","chip ban","entity list","nvidia ban","h100 ban","a100 ban"] },
  { ticker:"NVDA", dir:"risk", cat:"SECT", label:"Sector: Custom Silicon Threat",
    keywords:["custom silicon","tpu","maia chip","trainium","google chip","amazon chip","in-house ai chip"] },
  { ticker:"NVDA", dir:"risk", cat:"GPOL", label:"Geo: DeepSeek / China AI Disruption",
    keywords:["deepseek","qwen","chinese llm","china open-source ai","baidu ernie","alibaba ai model"] },
  { ticker:"NVDA", dir:"risk", cat:"GEO",  label:"Geo: Taiwan Fab Single-Point Risk",
    keywords:["taiwan strait","taiwan conflict","tsmc risk","fab risk","taiwan tension"] },

  // ── AMD ────────────────────────────────────────────────────────────────────
  { ticker:"AMD", dir:"opp",  cat:"SECT", label:"Sector: MI300X AI Accelerator Win",
    keywords:["mi300x","amd azure","amd inference","amd hyperscaler","amd ai accelerator","instinct"] },
  { ticker:"AMD", dir:"opp",  cat:"GEO",  label:"Geo: Sovereign AI Alt-Sourcing",
    keywords:["sovereign ai","alternative chip","amd sovereign","nvidia alternative","diversify chip"] },
  { ticker:"AMD", dir:"risk", cat:"GEO",  label:"Geo: Export Controls Mirror NVDA",
    keywords:["chip export","export control","chip ban","entity list","amd ban","amd export"] },
  { ticker:"AMD", dir:"risk", cat:"SECT", label:"Sector: NVDA Market Share Dominance",
    keywords:["nvidia 80%","gpu market share","nvidia dominance","cuda ecosystem","cuda lock-in"] },

  // ── MSFT ──────────────────────────────────────────────────────────────────
  { ticker:"MSFT", dir:"risk", cat:"SECT", label:"Sector: Copilot / AI Monetization Miss",
    keywords:["copilot stall","copilot adoption","ai monetization","copilot miss","msft ai revenue","copilot penetration"] },
  { ticker:"MSFT", dir:"opp",  cat:"SECT", label:"Sector: Azure AI Revenue Breakout",
    keywords:["azure ai","azure revenue","azure growth","copilot enterprise","microsoft ai revenue","azure beat"] },
  { ticker:"MSFT", dir:"risk", cat:"SECT", label:"Sector: DOJ / FTC Antitrust Risk",
    keywords:["microsoft antitrust","doj microsoft","ftc microsoft","msft probe","microsoft acquisition blocked"] },
  { ticker:"MSFT", dir:"risk", cat:"GEO",  label:"Geo: AI Copyright / Training Litigation",
    keywords:["ai copyright","training data lawsuit","generative ai ip","llm infringement","news org ai license"] },
  { ticker:"MSFT", dir:"opp",  cat:"GEO",  label:"Geo: CHIPS Act / US AI Investment",
    keywords:["chips act","semiconductor subsidy","us ai investment","microsoft datacenter","azure expansion"] },

  // ── GS ────────────────────────────────────────────────────────────────────
  { ticker:"GS", dir:"opp",  cat:"SECT", label:"Sector: M&A Pipeline Recovering",
    keywords:["m&a pipeline","deal activity","advisory revenue","pe deploy","investment banking","ipo activity","m&a advisory"] },
  { ticker:"GS", dir:"opp",  cat:"RATE", label:"Rate: NIM Expansion / Rate Hold",
    keywords:["net interest margin","nim expansion","fed hold","fed pause","rate hold","interest income","banking revenue"] },
  { ticker:"GS", dir:"opp",  cat:"SECT", label:"Sector: FICC Volatility Revenue",
    keywords:["ficc","trading revenue","volatility trading","fixed income trading","goldman trading","commodities trading"] },
  { ticker:"GS", dir:"risk", cat:"RATE", label:"Rate: Fed Rate Cut — NIM Compression",
    keywords:["fed cut","rate cut","fomc cut","pivot rate","first rate cut","rate reduction"] },
  { ticker:"GS", dir:"risk", cat:"SECT", label:"Sector: Credit Card Rate Cap Risk",
    keywords:["credit card cap","10% rate cap","payment rate","credit card legislation","rate cap bill"] },
  { ticker:"GS", dir:"risk", cat:"MACRO", label:"Macro: CRE Loan Default Exposure",
    keywords:["commercial real estate","cre loan","office vacancy","cre default","property maturity"] },

  // ── RTX ────────────────────────────────────────────────────────────────────
  { ticker:"RTX", dir:"opp",  cat:"GEO",  label:"Geo: Iran Conflict Munitions Burn",
    keywords:["iran","hormuz","persian gulf","iran strike","iran conflict","iran military"] },
  { ticker:"RTX", dir:"opp",  cat:"GEO",  label:"Geo: NATO Rearmament Surge",
    keywords:["nato rearm","defense budget","patriot order","pac-3","air defense","nato defense spending"] },
  { ticker:"RTX", dir:"opp",  cat:"SECT", label:"Sector: Patriot / LTAMDS Orders",
    keywords:["patriot missile","ltamds","air defense contract","raytheon contract","rtx order","raytheon order"] },
  { ticker:"RTX", dir:"risk", cat:"GEO",  label:"Geo: DOGE Procurement Scrutiny",
    keywords:["doge contract","pentagon review","defense procurement","doge pentagon","military spending cut","defense audit"] },
  { ticker:"RTX", dir:"risk", cat:"SECT", label:"Sector: Supply Chain Bottleneck",
    keywords:["defense supply chain","munitions shortage","production bottleneck","raytheon supply","rtx supply"] },

  // ── LMT ────────────────────────────────────────────────────────────────────
  { ticker:"LMT", dir:"opp",  cat:"GEO",  label:"Geo: F-35 NATO Orders Surge",
    keywords:["f-35","f35","lockheed order","nato f-35","f-35 contract","lmt order","lockheed contract"] },
  { ticker:"LMT", dir:"opp",  cat:"GEO",  label:"Geo: US Defense Budget Surge",
    keywords:["us defense budget","defense supplemental","pentagon budget","defense spending","military budget increase"] },
  { ticker:"LMT", dir:"opp",  cat:"GEO",  label:"Geo: Missile Defense Shield Demand",
    keywords:["missile defense","thaad","patriot","iron dome","defense shield","anti-missile","interceptor"] },
  { ticker:"LMT", dir:"risk", cat:"GEO",  label:"Geo: DOGE Procurement Scrutiny",
    keywords:["doge contract","pentagon review","defense procurement","doge pentagon","military spending cut","defense audit"] },
  { ticker:"LMT", dir:"risk", cat:"SECT", label:"Sector: Production Capacity Constraint",
    keywords:["lockheed capacity","f-35 delivery delay","production backlog","lmt production","lockheed delay"] },

  // ────────────────────────────────────────────────────────────────────────────
  // ── AIRLINES: AAL, JBLU, UAL, LUV, ULCC, SKYW, ALK, SAVE, HA ───────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["AAL","JBLU","UAL","LUV","ULCC","SKYW","ALK","SAVE","HA"].flatMap(t => [
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: Jet Fuel Cost Spike",
      keywords:["jet fuel","aviation fuel","kerosene price","fuel hedging","airline fuel cost"] },
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: Boeing Delivery Delays",
      keywords:["boeing delay","737 delay","aircraft delivery","boeing grounding","faa boeing"] },
    { ticker:t, dir:"risk", cat:"RATE", label:"Rate: Consumer Travel Pullback",
      keywords:["consumer spending","travel demand","recession travel","air travel decline","booking slowdown"] },
    { ticker:t, dir:"risk", cat:"WTHR", label:"Weather: Storm Hub Disruption",
      keywords:["winter storm","blizzard","ice storm","severe weather flight","airport closure","hurricane track"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: Summer Travel Demand Surge",
      keywords:["summer travel","pent-up travel","travel demand","record passengers","tsa throughput"] },
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: Transatlantic Demand Softness",
      keywords:["transatlantic","europe travel","us europe flight","atlantic demand","europe booking"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── DEFENSE: NOC, HII, LHX, LDOS, CACI, SAIC, GD ───────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["NOC","HII","LHX","LDOS","CACI","SAIC","GD"].flatMap(t => [
    { ticker:t, dir:"opp",  cat:"GEO",  label:"Geo: NATO Rearmament Surge",
      keywords:["nato rearm","defense budget","nato defense spending","european defense","defense supplement"] },
    { ticker:t, dir:"opp",  cat:"GEO",  label:"Geo: US Defense Budget Increase",
      keywords:["us defense budget","defense supplemental","pentagon budget","defense spending","military budget increase"] },
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: DOGE / Pentagon Procurement Cuts",
      keywords:["doge contract","pentagon review","defense procurement","doge pentagon","military spending cut","defense audit"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: Contract Award",
      scope:"company",
      keywords:["defense contract","pentagon contract","dod award","contract award","sole-source award"] },
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: Supply Chain Bottleneck",
      keywords:["defense supply chain","munitions shortage","production bottleneck","delivery delay","backlog"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── UTILITIES: CEG, AES, NEE, ED, BEP, D ────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["CEG","AES","NEE","ED","BEP","D"].flatMap(t => [
    { ticker:t, dir:"risk", cat:"RATE", label:"Rate: Fed Hold — High Cost of Capital",
      keywords:["fed hold","interest rate hold","rate hold","higher rates","rate increase","utility financing"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: AI Data Centre Power Demand",
      keywords:["data center power","ai power demand","hyperscaler power","grid demand","power purchase agreement","ppa"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: Grid Modernisation Investment",
      keywords:["grid upgrade","transmission","grid modernization","power grid investment","iija grid"] },
    { ticker:t, dir:"risk", cat:"WTHR", label:"Weather: Extreme Heat / Storm Grid Stress",
      keywords:["heat wave","extreme heat","grid stress","power outage","storm damage","hurricane power"] },
    { ticker:t, dir:"opp",  cat:"GEO",  label:"Geo: IRA Clean Energy Tax Credits",
      keywords:["ira clean energy","production tax credit","investment tax credit","clean energy credit","inflation reduction act"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── RENEWABLES: ENPH, FSLR, RUN, PLUG ───────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["ENPH","FSLR","RUN","PLUG"].flatMap(t => [
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: China Solar Panel Tariffs",
      keywords:["china solar","solar tariff","anti-dumping solar","panel import","solar panel tariff"] },
    { ticker:t, dir:"opp",  cat:"GEO",  label:"Geo: IRA Solar / Hydrogen Credits",
      keywords:["ira solar","solar credit","hydrogen credit","clean hydrogen","green hydrogen","investment tax credit"] },
    { ticker:t, dir:"risk", cat:"RATE", label:"Rate: High Rates Pressure Rooftop Installs",
      keywords:["solar installation","rooftop solar","residential solar","solar financing","loan rate solar"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: Utility-Scale Demand Surge",
      keywords:["utility solar","large-scale solar","solar farm","solar project","megawatt solar","solar array"] },
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: Net Metering Policy Rollback",
      keywords:["net metering","solar policy","california solar","nem 3","solar credit rate"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── MATERIALS / MINING: CLF, RIO, FCX, NEM, VALE, LIN, AA, X, MP ────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["CLF","RIO","FCX","NEM","VALE","LIN","AA","X","MP"].flatMap(t => [
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: China Demand Slowdown",
      keywords:["china slowdown","china demand","china steel","china copper","china growth","china pmi"] },
    { ticker:t, dir:"opp",  cat:"GEO",  label:"Geo: US Infrastructure / IRA Demand",
      keywords:["infrastructure bill","iija","us steel","domestic steel","copper demand","critical minerals","clean energy metals"] },
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: Steel / Aluminum Tariffs",
      keywords:["steel tariff","aluminum tariff","section 232","metal tariff","trade remedy steel"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: EV Critical Minerals Demand",
      keywords:["ev battery","lithium demand","copper ev","cobalt","nickel ev","critical minerals","rare earth ev"] },
    { ticker:t, dir:"risk", cat:"WTHR", label:"Weather: Mining Operation Disruption",
      keywords:["mine flooding","mine disruption","typhoon mine","weather mine","flood mine","rainfall operations"] },
  ]),

  // Additional MP-specific rare earth rules
  { ticker:"MP", dir:"opp",  cat:"GEO",  label:"Geo: Rare Earth Supply Chain Independence",
    keywords:["rare earth","rare earth us","mp materials","rare earth mining","neodymium","rare earth china alternative"] },
  { ticker:"MP", dir:"risk", cat:"GEO",  label:"Geo: China Rare Earth Export Restrictions",
    keywords:["china rare earth","rare earth ban","rare earth export","rare earth restriction","china magnet"] },

  // ────────────────────────────────────────────────────────────────────────────
  // ── TECH / SOFTWARE: META, AMZN, GOOGL, ORCL, CRM, COIN ────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  { ticker:"META", dir:"opp",  cat:"SECT", label:"Sector: Ad Revenue Breakout",
    keywords:["meta ad","facebook ad","instagram ad","ad revenue","ad market","digital ad","reels revenue"] },
  { ticker:"META", dir:"risk", cat:"SECT", label:"Sector: EU / FTC Antitrust",
    keywords:["meta antitrust","facebook antitrust","ftc meta","eu facebook","dma meta","meta breakup"] },
  { ticker:"META", dir:"opp",  cat:"SECT", label:"Sector: Llama AI Platform Monetisation",
    keywords:["llama","meta ai","meta llm","meta model","meta open source ai","meta generative"] },
  { ticker:"META", dir:"risk", cat:"SECT", label:"Sector: Teen Safety / Regulatory Risk",
    keywords:["teen social media","youth mental health","meta teen","facebook teen","social media bill","kids online safety"] },

  { ticker:"AMZN", dir:"opp",  cat:"SECT", label:"Sector: AWS Cloud Growth",
    keywords:["aws","amazon web services","cloud revenue","aws growth","amazon cloud","aws profit"] },
  { ticker:"AMZN", dir:"opp",  cat:"SECT", label:"Sector: Prime / Advertising Margin Expansion",
    keywords:["amazon prime","amazon advertising","prime revenue","amazon ad","prime growth"] },
  { ticker:"AMZN", dir:"risk", cat:"SECT", label:"Sector: FTC Antitrust / Marketplace Probe",
    keywords:["ftc amazon","amazon antitrust","amazon marketplace","amazon third-party","doj amazon"] },
  { ticker:"AMZN", dir:"risk", cat:"GEO",  label:"Geo: Tariff Impact on Third-Party Sellers",
    keywords:["amazon tariff","third party seller tariff","import tariff amazon","amazon sourcing","china seller amazon"] },

  { ticker:"GOOGL", dir:"opp",  cat:"SECT", label:"Sector: AI Search Revenue Uplift",
    keywords:["ai search","google ai","gemini search","ai overview","search monetisation","google ai revenue"] },
  { ticker:"GOOGL", dir:"risk", cat:"SECT", label:"Sector: DOJ Search Antitrust Breakup",
    keywords:["google antitrust","doj google","search monopoly","google breakup","alphabet antitrust","chrome divestiture"] },
  { ticker:"GOOGL", dir:"opp",  cat:"SECT", label:"Sector: Cloud / GCP Growth",
    keywords:["google cloud","gcp","google cloud revenue","cloud win","gcp growth","google enterprise"] },

  { ticker:"ORCL", dir:"opp",  cat:"SECT", label:"Sector: Cloud Database / AI Migration",
    keywords:["oracle cloud","oci","oracle ai","oracle database cloud","oracle migration","oci growth"] },
  { ticker:"ORCL", dir:"opp",  cat:"SECT", label:"Sector: Government AI Contract Awards",
    keywords:["oracle government","oracle dod","oracle contract","oracle federal","oracle jedi","oracle aws competitor"] },

  { ticker:"CRM", dir:"opp",  cat:"SECT", label:"Sector: Agentforce AI Revenue",
    keywords:["agentforce","salesforce ai","einstein gpt","salesforce agent","crm ai","salesforce revenue"] },
  { ticker:"CRM", dir:"risk", cat:"SECT", label:"Sector: Enterprise Spending Slowdown",
    keywords:["enterprise software","crm slowdown","saas slowdown","software spending","enterprise cut","software budget"] },

  { ticker:"COIN", dir:"opp",  cat:"SECT", label:"Sector: Crypto Bull Market Volume",
    keywords:["bitcoin rally","crypto bull","btc price","crypto volume","coinbase volume","crypto trading"] },
  { ticker:"COIN", dir:"risk", cat:"SECT", label:"Sector: SEC / Regulatory Crackdown",
    keywords:["sec crypto","crypto regulation","coinbase sec","crypto enforcement","crypto bill","stablecoin regulation"] },
  { ticker:"COIN", dir:"risk", cat:"SECT", label:"Sector: Bear Market Volume Collapse",
    keywords:["crypto bear","bitcoin drop","btc crash","crypto winter","crypto selloff","trading volume decline"] },

  // ────────────────────────────────────────────────────────────────────────────
  // ── FINANCE: JPM, BAC, WFC, MS, C, BX, AXP, V ──────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["JPM","BAC","WFC","MS","C","BX","AXP","V"].flatMap(t => [
    { ticker:t, dir:"opp",  cat:"RATE", label:"Rate: NIM Expansion / Rate Hold",
      keywords:["net interest margin","nim expansion","fed hold","fed pause","rate hold","interest income","banking revenue"] },
    { ticker:t, dir:"risk", cat:"RATE", label:"Rate: Fed Cut — NIM Compression",
      keywords:["fed cut","rate cut","fomc cut","pivot rate","first rate cut","rate reduction"] },
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: CRE Loan Default Exposure",
      keywords:["commercial real estate","cre loan","office vacancy","cre default","property maturity","cre stress"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: M&A / IPO Pipeline Recovery",
      keywords:["m&a pipeline","deal activity","advisory revenue","pe deploy","investment banking","ipo activity"] },
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: Consumer Credit Deterioration",
      keywords:["credit card delinquency","consumer credit","charge-off","credit loss","loan default","personal loan default"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── PHARMA: BMY, PFE, JNJ, ABBV, AMGN, MRK, GILD, REGN ────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["BMY","PFE","JNJ","ABBV","AMGN","MRK","GILD","REGN"].flatMap(t => [
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: IRA Drug Price Negotiation",
      keywords:["inflation reduction act drug","drug price negotiation","cms drug negotiation","medicare drug price","medicare price negotiation","inflation reduction drug price"] },
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: Biosimilar / Patent Cliff",
      keywords:["biosimilar","generic drug approval","biosimilar approval","drug patent cliff","patent cliff","patent expiry","loss of exclusivity","generic entry"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: Pipeline Approval / FDA Clearance",
      scope:"company",
      keywords:["fda approval","fda clearance","phase 3 trial","phase iii trial","phase 3 results","drug approved","new drug application","nda submission","nda filing","bla filing","fda pdufa","biologics license","therapy approved"] },
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: Clinical Trial Failure",
      scope:"company",
      keywords:["clinical trial fail","phase 3 miss","phase iii miss","trial discontinue","drug candidate fail","trial halt","study discontinued","drug trial halted","fda rejection","complete response letter"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: GLP-1 / Obesity Drug Tailwind",
      keywords:["glp-1","glp1","ozempic","wegovy","obesity drug","weight loss drug","semaglutide","tirzepatide"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── CONSUMER / RETAIL: NKE, TGT, WMT, COST, HD, MCD, PG ────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["NKE","TGT","WMT","COST","HD","MCD","PG"].flatMap(t => [
    { ticker:t, dir:"risk", cat:"RATE", label:"Rate: Consumer Spending Compression",
      keywords:["consumer spending","consumer confidence","consumer weakness","retail slowdown","discretionary spending"] },
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: China / Asia Sourcing Tariffs",
      keywords:["china tariff","import tariff","sourcing cost","supply chain cost","trade war retail","tariff impact retail"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: Resilient Low-Income Consumer",
      keywords:["value consumer","trade down","discount retail","private label","consumer trade-down","value shopping"] },
    { ticker:t, dir:"risk", cat:"SECT", label:"Sector: Inventory Glut / Markdown Risk",
      keywords:["inventory glut","inventory overhang","excess inventory","overstock","inventory build","retail clearance","inventory markdown","clearance sale","inventory surplus"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── INDUSTRIALS: GM, F, BA, DE ───────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  { ticker:"GM",  dir:"risk", cat:"SECT", label:"Sector: EV Transition Cost Drag",
    keywords:["gm ev","electric vehicle gm","ultium","ev loss","ev investment","ev margin"] },
  { ticker:"GM",  dir:"opp",  cat:"SECT", label:"Sector: Truck / SUV Margin Strength",
    keywords:["gm truck","silverado","gm suv","pickup truck margin","full-size truck","gm profit"] },
  { ticker:"GM",  dir:"risk", cat:"GEO",  label:"Geo: UAW / Labour Cost Risk",
    keywords:["uaw","auto union","gm strike","auto worker","labour contract","uaw gm"] },
  { ticker:"GM",  dir:"risk", cat:"GEO",  label:"Geo: China Auto Market Share Loss",
    keywords:["gm china","china auto","byd competition","china ev","gm china sales"] },

  { ticker:"F",   dir:"risk", cat:"SECT", label:"Sector: EV / Model e Losses",
    keywords:["ford ev","model e","ford electric","ford loss ev","ford ev margin","ford lightning"] },
  { ticker:"F",   dir:"opp",  cat:"SECT", label:"Sector: Ford Pro Commercial Strength",
    keywords:["ford pro","commercial vehicle","ford van","ford transit","ford commercial"] },
  { ticker:"F",   dir:"risk", cat:"GEO",  label:"Geo: UAW / Labour Cost Risk",
    keywords:["uaw","auto union","ford strike","auto worker","labour contract","uaw ford"] },
  { ticker:"F",   dir:"risk", cat:"GEO",  label:"Geo: Tariff on Steel / Mexico Parts",
    keywords:["auto tariff","steel tariff","mexico tariff","parts tariff","ford tariff","auto import"] },

  { ticker:"BA",  dir:"risk", cat:"SECT", label:"Sector: FAA Safety Scrutiny / Grounding",
    keywords:["faa boeing","boeing grounding","737 max","boeing safety","boeing defect","faa investigation"] },
  { ticker:"BA",  dir:"risk", cat:"SECT", label:"Sector: Production Rate Constraints",
    keywords:["boeing production","737 delivery","787 delivery","boeing output","production rate","delivery delay boeing"] },
  { ticker:"BA",  dir:"opp",  cat:"SECT", label:"Sector: Defence Contract Awards",
    keywords:["boeing defense","boeing contract","air force boeing","navy boeing","boeing award","boeing military"] },
  { ticker:"BA",  dir:"opp",  cat:"SECT", label:"Sector: Strong Order Backlog",
    keywords:["boeing order","boeing backlog","airline order","787 order","737 order","boeing new order"] },

  { ticker:"DE",  dir:"opp",  cat:"SECT", label:"Sector: Precision Ag / Tech Upgrade Cycle",
    keywords:["precision agriculture","smart farming","john deere tech","deere autonomous","ag tech","farm automation"] },
  { ticker:"DE",  dir:"risk", cat:"RATE", label:"Rate: Farm Income Pressure / Credit Tightening",
    keywords:["farm income","farm debt","ag credit","farmer income","commodity price farm","crop price pressure"] },
  { ticker:"DE",  dir:"risk", cat:"GEO",  label:"Geo: China Ag / Export Retaliation",
    keywords:["china agriculture","soybean tariff","ag retaliation","farm tariff","china farm","china soy"] },

  // ────────────────────────────────────────────────────────────────────────────
  // ── ENERGY (ex-XOM): SLB, VLO, OXY, COP, PSX, HAL, MPC, EOG, CVX ───────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["SLB","VLO","OXY","COP","PSX","HAL","MPC","EOG","CVX"].flatMap(t => [
    { ticker:t, dir:"opp",  cat:"GEO",  label:"Geo: OPEC+ Discipline / Tight Supply",
      keywords:["opec discipline","opec cut","oil supply tight","brent rally","oil price rally","crude rally"] },
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: OPEC+ Supply Surge / Russia Sanctions Lift",
      keywords:["opec supply surge","russia oil","russia sanction lift","russia ceasefire","oil supply increase"] },
    { ticker:t, dir:"risk", cat:"RATE", label:"Rate: Recession / Demand Destruction",
      keywords:["oil demand","recession oil","demand destruction","oil consumption","crude demand","oil demand fall"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: Permian / US Shale Record Output",
      keywords:["permian","shale output","us oil production","bakken","us energy production","us crude output"] },
    { ticker:t, dir:"risk", cat:"WTHR", label:"Weather: Gulf Hurricane Season",
      keywords:["gulf hurricane","gulf storm","hurricane season","gulf of mexico storm","platform shutdown"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── AGRICULTURE: MOS, CF, ADM ────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  ...["MOS","CF","ADM"].flatMap(t => [
    { ticker:t, dir:"opp",  cat:"GEO",  label:"Geo: Ukraine War — Fertiliser / Grain Premium",
      keywords:["ukraine grain","ukraine war","ukraine fertilizer","black sea grain","russia ukraine crop"] },
    { ticker:t, dir:"risk", cat:"GEO",  label:"Geo: China Demand / Ag Trade War",
      keywords:["china agriculture","soybean tariff","china grain","china crop","china import corn","china ag"] },
    { ticker:t, dir:"risk", cat:"WTHR", label:"Weather: Drought / Crop Failure",
      keywords:["drought","crop failure","el nino crop","corn drought","soybean drought","wheat drought","la nina farm"] },
    { ticker:t, dir:"opp",  cat:"SECT", label:"Sector: Fertiliser Price Recovery",
      keywords:["fertilizer price","nitrogen price","potash price","urea price","fertiliser market","crop nutrient"] },
  ]),

  // ────────────────────────────────────────────────────────────────────────────
  // ── REITS: AMT ───────────────────────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  { ticker:"AMT", dir:"risk", cat:"RATE", label:"Rate: Higher Rates Compress REIT Valuation",
    keywords:["reit rate","rate rise reit","cap rate","real estate rate","reit valuation","tower reit"] },
  { ticker:"AMT", dir:"opp",  cat:"SECT", label:"Sector: 5G / AI Data Density Demand",
    keywords:["5g tower","tower lease","cell tower","spectrum demand","5g buildout","tower demand","ai connectivity"] },
  { ticker:"AMT", dir:"opp",  cat:"GEO",  label:"Geo: Emerging Market Mobile Expansion",
    keywords:["emerging market tower","india tower","africa tower","lat am tower","amt india","amt africa"] },
  { ticker:"AMT", dir:"risk", cat:"SECT", label:"Sector: T-Mobile / Network Consolidation Risk",
    keywords:["carrier consolidation","tower lease termination","sprint network","carrier merger","tower contract"] },

  // ────────────────────────────────────────────────────────────────────────────
  // ── SEMICONDUCTORS: AVGO, INTC ───────────────────────────────────────────────
  // ────────────────────────────────────────────────────────────────────────────

  { ticker:"AVGO", dir:"opp",  cat:"SECT", label:"Sector: Custom AI ASIC Design Wins",
    keywords:["broadcom ai","avgo ai chip","google tpu broadcom","custom asic","network ai","broadcom custom"] },
  { ticker:"AVGO", dir:"opp",  cat:"SECT", label:"Sector: VMware Integration Revenue",
    keywords:["vmware","avgo vmware","broadcom vmware","cloud infrastructure","software revenue broadcom"] },
  { ticker:"AVGO", dir:"risk", cat:"GEO",  label:"Geo: China Export Controls Exposure",
    keywords:["chip export","export control","chip ban","entity list","broadcom china","avgo ban"] },

  { ticker:"INTC", dir:"risk", cat:"SECT", label:"Sector: Foundry Ramp / Yield Struggles",
    keywords:["intel foundry","intel18a","intel yield","intel process","intel manufacturing","intel fab"] },
  { ticker:"INTC", dir:"risk", cat:"SECT", label:"Sector: Market Share Loss to AMD / ARM",
    keywords:["intel market share","amd gain","arm laptop","intel loss","x86 decline","intel cpu share"] },
  { ticker:"INTC", dir:"opp",  cat:"GEO",  label:"Geo: CHIPS Act Foundry Subsidy",
    keywords:["chips act intel","intel subsidy","intel ohio","intel arizona","chips act foundry","intel grant"] },
  { ticker:"INTC", dir:"opp",  cat:"SECT", label:"Sector: Gaudi AI Accelerator Traction",
    keywords:["gaudi","intel ai","intel accelerator","intel gpu","intel gaudi","habana intel"] },

  // ════════════════════════════════════════════════════════════════════════════
  // SECTOR-BROADCAST RULES — auto-apply to all tickers in a sector.
  // New tickers added to SECTOR_GROUPS in App.jsx + SECTOR_TICKERS here get
  // covered automatically without any further rule changes.
  // ════════════════════════════════════════════════════════════════════════════

  // ── Rate / Fed — Finance + FinTech + Utilities ────────────────────────────
  { sector:"fin",  dir:"opp",  cat:"RATE", label:"Rate: Fed Rate Cut Cycle",
    keywords:["federal reserve cut","fed cut","rate cut","fomc cut","first rate cut","rate reduction","fed pivot"] },
  { sector:"fin2", dir:"opp",  cat:"RATE", label:"Rate: Fed Rate Cut Cycle",
    keywords:["federal reserve cut","fed cut","rate cut","fomc cut","first rate cut","rate reduction","fed pivot"] },
  { sector:"fin",  dir:"risk", cat:"RATE", label:"Rate: Fed Hold — Net Interest Pressure",
    keywords:["fed hold","interest rate hold","higher for longer","fomc hold","rate hold","no cut"] },
  { sector:"util", dir:"risk", cat:"RATE", label:"Rate: Fed Hold — High Cost of Capital",
    keywords:["fed hold","interest rate hold","higher for longer","fomc hold","rate hold","no cut"] },
  { sector:"hmb",  dir:"risk", cat:"RATE", label:"Rate: Mortgage Rate Pressure on Demand",
    keywords:["mortgage rate","housing rate","30-year rate","home loan rate","housing affordability"] },
  { sector:"reit", dir:"risk", cat:"RATE", label:"Rate: Yield Rise — REIT Cap Rate Pressure",
    keywords:["10-year yield","treasury yield","long bond","bond selloff","real estate cap rate"] },

  // ── Tariff / Trade — Consumer + Industrials + Materials + Semis ──────────
  { sector:"con",  dir:"risk", cat:"GEO",  label:"Geo: US-China Tariff Wave",
    keywords:["tariff","trade war","trade sanction","import duty","china tariff","section 301","tariff increase"] },
  { sector:"ind",  dir:"opp",  cat:"MACRO",label:"Macro: Industrial Reshoring Wave",
    keywords:["reshoring","nearshoring","manufacturing return","onshoring","factory us","domestic manufacturing"] },
  { sector:"ind",  dir:"risk", cat:"GEO",  label:"Geo: USMCA / Supply Chain Tariff Risk",
    keywords:["usmca","canada tariff","mexico tariff","trade war canada","trade war mexico","tariff retaliation"] },
  { sector:"mat",  dir:"risk", cat:"GEO",  label:"Geo: Steel & Aluminum Tariff Impact",
    keywords:["steel tariff","aluminum tariff","section 232","metal tariff","trade remedy"] },
  { sector:"sem",  dir:"risk", cat:"GEO",  label:"Geo: Semiconductor Export Controls",
    keywords:["chip export","export control","chip ban","entity list","semiconductor sanction","bis rule"] },
  { sector:"sem",  dir:"risk", cat:"GEO",  label:"Geo: Taiwan Strait Fab Risk",
    keywords:["taiwan strait","taiwan conflict","china taiwan","pla taiwan","taiwan invasion","cross-strait military"] },

  // ── AI Demand — Semis + Software + Hardware ───────────────────────────────
  { sector:"sem",  dir:"opp",  cat:"SECT", label:"Sector: AI Chip Demand Surge",
    keywords:["ai chip","gpu demand","ai accelerator","hyperscaler order","data center chip","ai training","ai inference chip"] },
  { sector:"sft",  dir:"opp",  cat:"SECT", label:"Sector: AI Software Monetisation",
    keywords:["ai software revenue","ai enterprise","llm saas","ai platform revenue","genai adoption","ai agent"] },
  { sector:"hw",   dir:"opp",  cat:"SECT", label:"Sector: AI Infrastructure Build-Out",
    keywords:["ai data center","ai infrastructure","ai server","ai cluster","ai networking","ethernet ai"] },
  { sector:"sem",  dir:"risk", cat:"GPOL", label:"Geo: China Open-Source AI Disrupts GPU Demand",
    keywords:["deepseek","qwen","chinese llm","china open-source ai","baidu ernie","alibaba model","cheap ai model"] },
  { sector:"dc",   dir:"opp",  cat:"SECT", label:"Sector: Data Center Power Demand Surge",
    keywords:["data center power","hyperscaler power","ai grid","power purchase agreement","data center electricity"] },

  // ── Defense / Geopolitical — Defense + Energy ─────────────────────────────
  { sector:"def",  dir:"opp",  cat:"GEO",  label:"Geo: NATO Rearmament Surge",
    keywords:["nato rearm","defense budget increase","nato spending","rearmament","defense procurement","defense contract"] },
  { sector:"def",  dir:"risk", cat:"POL",  label:"Policy: DOGE Procurement Scrutiny",
    keywords:["doge","defense spending cut","pentagon review","defense procurement cut","doge defense"] },
  { sector:"eng",  dir:"opp",  cat:"GEO",  label:"Geo: Middle East Conflict Oil Premium",
    keywords:["middle east tension","oil risk premium","iran conflict","strait of hormuz","opec cut","oil supply risk"] },
  { sector:"eng",  dir:"risk", cat:"GEO",  label:"Geo: OPEC+ Supply Surge / Russia Lift",
    keywords:["opec supply increase","opec+","russia oil lift","russia ceasefire","oil glut","supply overhang"] },

  // ── Healthcare / Pharma — Pharma + Healthcare Svcs + Pharmacies ──────────
  { sector:"pharma",dir:"risk", cat:"POL", label:"Policy: Drug Price Negotiation Risk",
    keywords:["drug price negotiation","ira medicare","cms price cap","pharma pricing","drug price cap","medicare drug"] },
  { sector:"pharma",dir:"opp",  cat:"SECT",label:"Sector: GLP-1 Obesity Supercycle",
    keywords:["glp-1","glp1","ozempic","wegovy","zepbound","mounjaro","obesity drug","weight loss drug","semaglutide","tirzepatide"] },
  { sector:"hcsv", dir:"risk",  cat:"SECT",label:"Sector: Medical Cost Inflation",
    keywords:["medical inflation","healthcare cost","medical loss ratio","claim cost","medical expense","health cost trend"] },

  // ── Climate / Weather — Agriculture + Airlines + Energy ──────────────────
  { sector:"agri", dir:"risk",  cat:"WTHR",label:"Weather: Crop Yield & Drought Threat",
    keywords:["drought","el nino","la nina","crop yield","corn yield","wheat shortage","food production","grain crop"] },
  { sector:"air",  dir:"risk",  cat:"WTHR",label:"Weather: Storm Hub Disruption",
    keywords:["winter storm","blizzard","hurricane","severe weather","airport closure","flight disruption","ice storm"] },
  { sector:"ins",  dir:"risk",  cat:"CLMT",label:"CLMT: Climate Loss — Insurer Exposure",
    keywords:["wildfire","hurricane loss","flood damage","catastrophe loss","nat cat","climate insurance","reinsurance loss"] },
  { sector:"ins",  dir:"opp",   cat:"SECT",label:"Sector: Hard Market Pricing Cycle",
    keywords:["hard market","insurance pricing","rate increase insurance","premium increase","underwriting profit","combined ratio"] },

  // ── Retail / Consumer ─────────────────────────────────────────────────────
  { sector:"ret",  dir:"opp",  cat:"MACRO",label:"Macro: Consumer Spend / Trade-Down",
    keywords:["consumer spending","consumer confidence","retail sales","consumer strong","personal consumption"] },
  { sector:"ret",  dir:"risk", cat:"GEO",  label:"Geo: Tariff Supply Chain Renegotiation",
    keywords:["tariff supply","import tariff consumer","retail tariff","goods tariff","import cost retail"] },
  { sector:"food", dir:"risk", cat:"SECT", label:"Sector: GLP-1 Demand Headwind",
    keywords:["glp-1 food","obesity drug food","weight loss food","calorie reduction drug","ozempic food"] },

  // ── Media / Streaming ─────────────────────────────────────────────────────
  { sector:"media", dir:"risk",  cat:"SECT",label:"Sector: Linear TV Cord-Cutting",
    keywords:["cord cutting","cable decline","linear tv loss","cable subscriber","pay tv decline"] },
  { sector:"media", dir:"opp",   cat:"SECT",label:"Sector: Streaming Ad Tier Growth",
    keywords:["streaming ad","ad-supported tier","avod","streaming advertising","connected tv ad","ctv ad revenue"] },

];

// ─── Signal matching ──────────────────────────────────────────────────────────

/**
 * Match a fetched article against SIGNAL_RULES.
 * Returns array of matching rule objects (may be empty).
 *
 * @param {{ title: string, description: string, ticker?: string }} article
 * @param {typeof SIGNAL_RULES} rules  — defaults to module-level SIGNAL_RULES
 * @returns {Array<typeof SIGNAL_RULES[number]>}
 */
export function matchArticleSignals(article, rules = SIGNAL_RULES) {
  const haystack = `${article.title ?? ""} ${article.description ?? ""}`.toLowerCase();
  const results  = [];

  for (const rule of rules) {
    // Keywords must appear in article text — shared check for both rule types
    if (!rule.keywords.some(kw => haystack.includes(kw))) continue;

    if (rule.sector) {
      // ── Sector-broadcast rule: expand to all tickers in the sector ──────
      const tickersInSector = SECTOR_TICKERS[rule.sector] ?? [];
      for (const t of tickersInSector) {
        if (article.ticker && t !== article.ticker) continue;
        // Optional company-scope filter per expanded ticker
        if (rule.scope === "company") {
          const names = TICKER_NAMES[t] ?? [];
          if (names.length > 0 && !names.some(n => haystack.includes(n))) continue;
        }
        // ── Ticker-level bias override ───────────────────────────────────
        const bias = TICKER_SECTOR_BIAS[t]?.[rule.sector]?.[rule.cat];
        if (bias === 'neutral') continue;                          // insulated — skip
        const dir = bias === 'invert'
          ? (rule.dir === 'risk' ? 'opp' : 'risk')               // contra-indicator
          : rule.dir;                                              // default — inherit as-is
        results.push({ ...rule, ticker: t, dir });
      }
    } else {
      // ── Per-ticker rule (existing behaviour) ────────────────────────────
      if (article.ticker && rule.ticker !== article.ticker) continue;
      if (rule.scope === "company") {
        const names = TICKER_NAMES[rule.ticker] ?? [];
        if (names.length > 0 && !names.some(n => haystack.includes(n))) continue;
      }
      results.push(rule);
    }
  }

  return results;
}

// ─── Article → feed item converter ───────────────────────────────────────────

/**
 * Convert a raw article + matched rules into a Perfect Storm FeedItem.
 */
export function articleToFeedItem(article, signals) {
  return {
    id:          article.url,
    title:       article.title,
    description: article.description,
    url:         article.url,
    image:       article.image   ?? null,
    author:      article.author  ?? null,
    published:   article.pubDate ?? null,
    signals,
    tickers:  [...new Set(signals.map(s => s.ticker))],
    dirs:     [...new Set(signals.map(s => s.dir))],
    cats:     [...new Set(signals.map(s => s.cat))],
  };
}

// ─── Feed loader ─────────────────────────────────────────────────────────────

/**
 * Fetch + process all PS_FEEDS.
 * Returns array of FeedItems sorted by published date descending.
 */
export async function loadAllFeeds(fetchOneFeed, dedup) {
  const results = await Promise.allSettled(
    PS_FEEDS.map(async feed => {
      const articles = await fetchOneFeed(feed.url, feed.id);
      return articles.map(a => ({ ...a, feedId: feed.id, feedCat: feed.cat }));
    })
  );

  const all = results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value);

  const deduped = dedup(all);

  const feedItems = deduped.flatMap(article => {
    const signals = matchArticleSignals(article);
    if (signals.length === 0) return [];
    return [articleToFeedItem(article, signals)];
  });

  feedItems.sort((a, b) => {
    const ta = a.published ? new Date(a.published).getTime() : 0;
    const tb = b.published ? new Date(b.published).getTime() : 0;
    return tb - ta;
  });

  return feedItems;
}
