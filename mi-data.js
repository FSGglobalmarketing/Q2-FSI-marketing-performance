/* ============================================================
   mi-data.js — datasets for the Global Marketing Impact Report.
   Fixed to Q2 2026. Q1 2026 kept as comparison at chart level.
   Every dataset maps to a real endpoint in the API catalogue,
   surfaced to end-users in plain English (no jargon).
   ============================================================ */

window.MIDATA = (function () {
  function seed(s){ let h=1779033703^s.length; for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;} return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return ((h^=h>>>16)>>>0)/4294967296;};}
  const fmtInt = n => Math.round(n).toLocaleString('en-US');
  const fmtK   = n => n>=1e6 ? (n/1e6).toFixed(1)+'M' : n>=1e3 ? (n/1e3).toFixed(1)+'k' : Math.round(n).toString();

  const PERIOD = { short:'Q2 2026', label:'Apr – Jun 2026', prev:'Q1 2026' };

  // ============================================================
  // HEADLINE KPIs (GA4 · Search Console · LinkedIn · Email · Alphix)
  //  delta = change vs Q1 2026
  // ============================================================
  const HEADLINE = [
    { v:'6,000+', l:'Clicks on the Buy Hold Sell post', d:'our best content of the quarter', up:true },
    { v:'~50,000',l:'Website visitors',                d:'up a quarter on Q1', up:true },
    { v:'740',    l:'Organisations in the Cash ETF launch', d:'across 8 emails', up:true },
    { v:'1,500+', l:'GLIS clicks from Asian banks',    d:'our biggest engagement engine', up:true },
    { v:'145',    l:'Australian search terms',         d:'+40% vs a year ago', up:true },
  ];

  // ============================================================
  // GA4 — Website visits by source (Traffic by Channel)  Q2 months
  // ============================================================
  const CHANNELS = [
    { key:'organic', label:'Organic search', color:'var(--c-a)' },
    { key:'direct',  label:'Direct',         color:'var(--c-b)' },
    { key:'social',  label:'Social',         color:'var(--c-c)' },
    { key:'email',   label:'Email',          color:'var(--c-d)' },
    { key:'referral',label:'Referral',       color:'var(--c-muted)' },
  ];
  function channelSeries(){
    const rnd = seed('chan-q2');
    const base = { organic:48, direct:26, social:14, email:9, referral:6 };
    return ['Apr','May','Jun'].map(m => {
      const row = { label:m };
      CHANNELS.forEach(c=>{ row[c.key] = Math.round(base[c.key]*1000*(0.85+rnd()*0.4)); });
      return row;
    });
  }

  // ============================================================
  // GA4 — Website visits over time (Q2 weekly, with Q1 comparison)
  // ============================================================
  function visitsSeries(){
    if (typeof window !== 'undefined' && window.MI_REMOTE && Array.isArray(window.MI_REMOTE.VISITS)
        && window.MI_REMOTE.VISITS.some(function(w){ return (w.sessions||0) > 0; }))
      return window.MI_REMOTE.VISITS;  // real weekly GA4 data (Q2 sessions + Q1 comparison); all-zero = no data, fall through
    const rnd = seed('vis-q2');
    const out = [];
    for(let i=0;i<13;i++){
      const wave = 1 + 0.30*Math.sin(i/2.0) + (rnd()-0.5)*0.14;
      out.push({ label:'W'+(i+1), sessions: Math.round(4200*wave), prev: Math.round(4200*wave*0.88*(0.92+rnd()*0.12)) });
    }
    return out;
  }

  // ============================================================
  // GA4 — Top pages
  // ============================================================
  const TOP_PAGES = [
    { path:'/insights/china-outlook',         title:'China outlook 2026',           views:19142 },
    { path:'/strategies/asian-growth',        title:'Asian growth strategy',        views:14880 },
    { path:'/strategies/global-listed-infra', title:'Global listed infrastructure', views:12704 },
    { path:'/insights/ai-in-investment',      title:'AI in investment',             views:9806 },
    { path:'/strategies/quality-growth',      title:'Quality growth, explained',    views:7431 },
  ];

  // ============================================================
  // ALPHIX — Which companies are reading our pages
  // ============================================================
  const FIRMS = [
    { firm:'BlackRock',   domain:'blackrock.com',           industry:'Asset Management',   tier:'Tier 1' },
    { firm:'Schroders',   domain:'schroders.com',           industry:'Asset Management',   tier:'Tier 1' },
    { firm:'Fidelity',    domain:'fidelity.com',            industry:'Asset Management',   tier:'Tier 1' },
    { firm:'Aberdeen',    domain:'aberdeeninvestments.com', industry:'Asset Management',   tier:'Tier 2' },
    { firm:'Mercer',      domain:'mercer.com',              industry:'Investment Consulting', tier:'Tier 1' },
    { firm:'Willis Towers Watson', domain:'wtwco.com',      industry:'Investment Consulting', tier:'Tier 2' },
    { firm:'UBS Wealth',  domain:'ubs.com',                 industry:'Private Bank',       tier:'Tier 1' },
    { firm:'Cambridge Associates', domain:'cambridgeassociates.com', industry:'Investment Consulting', tier:'Tier 2' },
    { firm:'Nomura',      domain:'nomura.com',              industry:'Investment Bank',    tier:'Tier 2' },
    { firm:'Temasek',     domain:'temasek.com.sg',          industry:'Sovereign / Institutional', tier:'Tier 1' },
  ];
  const KEY_PAGES = [
    { path:'/strategies/global-listed-infra', title:'Global listed infrastructure' },
    { path:'/insights/china-outlook',         title:'China outlook 2026' },
    { path:'/insights/ai-in-investment',      title:'AI in investment' },
    { path:'/strategies/asian-growth',        title:'Asian growth strategy' },
  ];
  // Which firms read a given page. Keyed by the page path so the selection
  // survives region filtering. Real Alphix data (window.MI_REMOTE.ALPHIX =
  // { [pagePath]: [ {firm,domain,industry,views,sessions} ] }) is used
  // exclusively once loaded — a page with no identified firms returns [].
  function firmsByPage(key){
    key = String(key || '');
    const R = (typeof window !== 'undefined' && window.MI_REMOTE) || {};
    if (R.ALPHIX) return Array.isArray(R.ALPHIX[key]) ? R.ALPHIX[key] : [];
    const rnd = seed('alx'+key);
    let h = 0; for(let i=0;i<key.length;i++) h = (h*31 + key.charCodeAt(i)) >>> 0;
    const off = FIRMS.length ? h % FIRMS.length : 0;
    const rot = [...FIRMS.slice(off), ...FIRMS.slice(0, off)];
    return rot.slice(0,8).map((fm,i)=>{
      const views = Math.round((320 - i*30) * (0.7+rnd()*0.7));
      const delta = Math.round((rnd()*80)-25);
      return { ...fm, views: Math.max(views,18), delta, sessions: Math.max(1, Math.round(views/22)) };
    }).sort((a,b)=>b.views-a.views);
  }
  const FIRMS_SUMMARY = { companies:212, newCompanies:34, tier1:68, topIndustry:'Asset Management' };

  // ============================================================
  // Competitor Ads — Google Ads Transparency creatives
  // ============================================================
  // Real AU-retail peer set from the BrightEdge SEO competitor register
  // (source of truth). Names match the Coverage cards in press-data.js and the
  // real ad creatives in data.js; colours cycle the four accent tokens.
  const COMPETITORS = [
    { name:'Fidelity',             domain:'fidelity.com.au',       color:'var(--c-a)' },
    { name:'Pendal',               domain:'pendalgroup.com',       color:'var(--c-b)' },
    { name:'Perpetual',            domain:'perpetual.com.au',      color:'var(--c-c)' },
    { name:'Vanguard',             domain:'vanguard.com.au',       color:'var(--c-d)' },
    { name:'UBS',                  domain:'ubs.com/au',            color:'var(--c-a)' },
    { name:'BetaShares',           domain:'betashares.com.au',     color:'var(--c-b)' },
    { name:'iShares',              domain:'blackrock.com/au',      color:'var(--c-c)' },
    { name:'Colonial First State', domain:'cfs.com.au',            color:'var(--c-d)' },
    { name:'Magellan',             domain:'magellangroup.com.au',  color:'var(--c-a)' },
    { name:'ClearBridge',          domain:'clearbridge.com.au',    color:'var(--c-b)' },
    { name:'Ausbil',               domain:'ausbil.com.au',         color:'var(--c-c)' },
    { name:'Bennelong',            domain:'bennelongfunds.com',    color:'var(--c-d)' },
    { name:'Resolution Capital',   domain:'resolutioncapital.com', color:'var(--c-a)' },
    { name:'Hyperion',             domain:'hyperion.com.au',       color:'var(--c-b)' },
  ];
  const FORMATS = ['Image','Video','Text'];
  // Drop stale creatives whose images no longer load (2025 snapshot rows).
  const AD_LIVE_FROM = '2026-01-01';
  function creatives(){
    // real competitor ads from the Google Ads Transparency Center (data.js)
    if (typeof window !== 'undefined' && window.MI_REMOTE && Array.isArray(window.MI_REMOTE.CREATIVES) && window.MI_REMOTE.CREATIVES.length)
      return window.MI_REMOTE.CREATIVES.filter(c => !c.lastShown || c.lastShown >= AD_LIVE_FROM);
    const rnd = seed('cre-q2');
    const out = [];
    const advByComp = { 'Blackstone':'Blackstone Inc.', 'BlackRock':'BlackRock, Inc.', 'Schroders':'Schroders plc', 'Nuveen':'Nuveen, LLC' };
    COMPETITORS.forEach(c=>{
      const count = 3 + Math.floor(rnd()*2);
      for(let i=0;i<count;i++){
        const fmt = FORMATS[Math.floor(rnd()*FORMATS.length)];
        const firstD = new Date(2026, 3+Math.floor(rnd()*2), 1+Math.floor(rnd()*20));
        const lastD  = new Date(2026, 6, 1+Math.floor(rnd()*2));
        out.push({
          competitor:c.name, color:c.color, domain:c.domain, advertiser:advByComp[c.name], format:fmt,
          firstShown:firstD.toISOString().slice(0,10), lastShown:lastD.toISOString().slice(0,10),
          variants:4+Math.floor(rnd()*60),
          theme:['Private markets','Infrastructure','China & Asia','Income','Sustainability'][Math.floor(rnd()*5)],
        });
      }
    });
    return out;
  }
  function shareOfVoice(){
    const rnd = seed('sov-q2');
    const mk = (usBase)=>{
      const rows = [{ name:'Our brand', v:usBase, us:true }, ...COMPETITORS.map(c=>({ name:c.name, v:Math.round(usBase*(0.6+rnd()*1.4)) }))];
      const total = rows.reduce((s,x)=>s+x.v,0);
      return rows.map(x=>({ ...x, share:x.v/total })).sort((a,b)=>b.share-a.share);
    };
    return { search: mk(1860), paid: mk(1240) };
  }

  // ============================================================
  // Google Search Console — query performance + visibility trend
  // ============================================================
  const SEARCH_QUERIES = [
    { q:'quality growth asia',         imp:124000, clicks:3400, pos:8.4 },
    { q:'global listed infrastructure',imp:98200,  clicks:5120, pos:4.1 },
    { q:'china investment outlook',    imp:76400,  clicks:2980, pos:6.7 },
    { q:'asian equity income',         imp:54100,  clicks:1870, pos:9.2 },
    { q:'infrastructure fund',         imp:42300,  clicks:2440, pos:3.8 },
    { q:'emerging markets 2026',       imp:38800,  clicks:1210, pos:11.4 },
  ].map(x=>({ ...x, ctr:x.clicks/x.imp }));
  function searchVisibility(){
    // 6 months Jan-Jun: our impressions share vs peer average (rising)
    const rnd = seed('svis');
    const months = ['Jan','Feb','Mar','Apr','May','Jun'];
    return months.map((m,i)=>({ label:m, us: 12+i*1.3+(rnd()-0.5), peer: 14-i*0.2+(rnd()-0.5) }));
  }

  // ============================================================
  // HubSpot — email / campaigns / deals
  // ============================================================
  const EMAILS = [
    { name:'Global listed infra: quarterly update', opens:17712, openRate:33.9, clickRate:6.0 },
    { name:'China outlook 2026: invitation',        opens:14204, openRate:31.2, clickRate:5.1 },
    { name:'Asian growth: thought leadership',      opens:11908, openRate:29.7, clickRate:4.4 },
    { name:'Monthly periodical: June',              opens:9860,  openRate:27.5, clickRate:3.8 },
    { name:'Event: Asia Pacific Leaders webinar',    opens:8412,  openRate:36.4, clickRate:7.2 },
  ];
  // Real Q2 totals from the cross-brand Pardot engagement workbook (By brand
  // sheet). The previous figures (62,096 opened, replies, meetings) were seeded
  // demo values - Pardot gives us no reply or meeting counts at all.
  // Full-quarter totals from the global Pardot archive; the Q1 delta uses the
  // same source, so the comparison is finally like-for-like.
  const EMAIL_SUMMARY = [
    { v:'1,730', l:'Contacts engaged' },
    { v:'1,095', l:'Organisations' },
    { v:'3,640', l:'Link clicks' },
    { v:'-10%', l:'Contacts vs Q1 (1,917)' },
  ];
  const DEALS = {
    pipeline:'$18.4M', won:'$4.2M', count:52,
    stages:[
      { stage:'New / MQL', v:1240 }, { stage:'Qualified', v:560 }, { stage:'Meeting', v:242 },
      { stage:'Proposal', v:98 }, { stage:'Won', v:52 },
    ],
  };
  const CAMPAIGNS = [
    { title:'RQI Asia Phase II', channel:'Advertising (LinkedIn)', region:'ANZ', lead:'Karyn Arthur', status:'In progress', goLive:'2026-07-14', spend:25000, key:true },
    { title:'China outlook launch', channel:'Email + web',        region:'APAC', lead:'Daniel Poon', status:'Live', goLive:'2026-05-02', spend:12000, key:true },
    { title:'Infrastructure income', channel:'Paid search',       region:'EMEA - DACH', lead:'Lena Fischer', status:'Live', goLive:'2026-04-18', spend:31000, key:false },
    { title:'Quality growth series', channel:'Content / SEO',     region:'Americas', lead:'Marco Ruiz', status:'In progress', goLive:'2026-08-01', spend:8000, key:false },
    { title:'AI in investment', channel:'Webinar',                region:'Global', lead:'Priya Nair', status:'Planned', goLive:'2026-09-10', spend:18000, key:true },
  ];

  // ============================================================
  // Events & sponsorships (Smartsheet key activities + geography)
  // ============================================================
  const EVENTS = [
    { name:'ASX: FSCF launch & bell-ringing ceremony', city:'Sydney', region:'ANZ', status:'Delivered', x:0.885, y:0.79 },
    { name:'Infocus webinar with Ben Samuel', city:'Australia (virtual)', region:'ANZ', status:'Delivered', x:0.86, y:0.83 },
    { name:'Lonsec Conference', city:'Sydney', region:'ANZ', status:'Delivered', x:0.895, y:0.805 },
    { name:'Morningstar Conference', city:'Sydney', region:'ANZ', status:'Delivered', x:0.875, y:0.815 },
    { name:'Entireti webinar with Rebecca Sherlock', city:'Australia (virtual)', region:'ANZ', status:'Delivered', x:0.85, y:0.80 },
    { name:'Lifespan PD Day with Dushko Bajic', city:'Australia', region:'ANZ', status:'Delivered', x:0.905, y:0.82 },
    { name:'Count Virtual PD Day with Tony Togher', city:'Australia (virtual)', region:'ANZ', status:'Delivered', x:0.865, y:0.775 },
    { name:'ACTA Conference with Tony Togher & Ben Samuel', city:'Australia', region:'ANZ', status:'Delivered', x:0.905, y:0.80 },
  ];

  // ============================================================
  // Results — outcomes by funnel stage
  // ============================================================
  // KPI framework — vertical funnel. Only channels FSI ran this quarter, each
  // against our KPI framework and the 2025 financial-sector benchmarks.
  const KPI = [
    { stage:'Awareness', color:'#37a6ff', channels:[
      { ch:'Organic search', metrics:[
        { v:'145', l:'Australian search terms', cmp:'flat on Q1', dir:'flat' },
        { v:'20 → 28', l:'AEQ Growth terms', cmp:'now ahead of Betashares', dir:'up' },
      ] },
      { ch:'SEM & display', off:true, metrics:[ { l:'Impressions · CTR', cmp:'not run' } ] },
      { ch:'LinkedIn (paid)', off:true, metrics:[ { l:'Impressions · CTR', cmp:'wound down' } ] },
    ] },
    { stage:'Consideration', color:'#15d9c2', channels:[
      { ch:'LinkedIn (organic)', metrics:[
        { v:'6,000+', l:'Buy Hold Sell clicks', cmp:'more than all other posts', dir:'up' },
        { v:'+181', l:'New followers in June', cmp:'June, best month', dir:'up' },
      ] },
      { ch:'Website', metrics:[
        { v:'~50,000', l:'Website visitors', cmp:'up a quarter on Q1', dir:'up' },
        { v:'6,300+', l:'Cash Fund page', cmp:'ETF launch traffic', dir:'up' },
      ] },
    ] },
    { stage:'Conversion', color:'#2ce072', channels:[
      { ch:'Email', metrics:[
        { v:'740', l:'Orgs in Cash ETF launch', cmp:'across 8 emails', dir:'up' },
        { v:'1,500+', l:'GLIS clicks, Asian banks', cmp:'biggest engagement engine', dir:'up' },
      ] },
      { ch:'Events', off:true, metrics:[ { l:'Attendees', cmp:'not measured' } ] },
    ] },
    { stage:'Service & loyalty', color:'#a870ff', channels:[
      { ch:'Data capture', metrics:[
        { v:'1,730', l:'Contacts engaged', cmp:'down 10% vs Q1', dir:'down' },
        { v:'1,095', l:'Organisations · 3,640 clicks', cmp:'', dir:'flat' },
      ] },
    ] },
  ];

  const RESULTS = [
    { stage:'Awareness',  meta:'3 of 4 goals met', pills:[['Reach +18%','pos'],['Recall +12%','pos'],['Share of voice ↑','pos'],['Search rank −2','neg']] },
    { stage:'Engagement', meta:'All goals met',    pills:[['Web visits ↑','pos'],['LinkedIn 4.2%','pos'],['Avg time 1:52','pos']] },
    { stage:'Conversion', meta:'2 of 3 goals met', pills:[['Replies 396','pos'],['Meetings 242','pos'],['Wins 52','']] },
    { stage:'Loyalty',    meta:'On track',         pills:[['Events 60%','pos'],['NPS ↑','pos'],['Renewals','']] },
  ];

  // ============================================================
  // CONTENT BLOCKS — Summary · Goals · Marketing activities ·
  //   Key results (vs benchmark) · Focus Q2 · Focus Q3
  //   (professional plain-English copy, per funnel section)
  // ============================================================
  const CB = {
    highlight1: {
      summary: [
        'We launched the Active Cash Fund on the ASX on 7 May with a bell-ringing ceremony and a full campaign across the likes of AFR, Investor Daily and Morningstar, with supported media appearances on Ausbiz and the Livewire income series.',
      ],
      goals: ['Leverage reporting season to profile the investment team','Use content to promote the LEVR and XX20 strategies','Position the AEQ Growth team'],
      activities: ['Launch post','Campaign placements in AFR, Investor Daily, Money Management, Financial Standard, Morningstar and Financial Newswire','Tony Togher on Ausbiz','Ben Samuel and Ky Van Tang in the Investor Daily podcast','Ben Samuel in Livewire’s Income series'],
      results: [{v:'7 May',l:'Listed on the ASX',d:'bell-ringing ceremony',up:true},{v:'6,300+',l:'Visitors to the Cash Fund page',up:true},{v:'740',l:'Organisations reached',d:'across 8 emails',up:true}],
      q2: ['Prepare the ASX Cash page and optimise it for search'],
      q3: ['Continue optimising the campaign pages'],
    },
    highlight2: {
      summary: [
        'Dushko Bajic joined a special World Cup episode of Livewire Markets’ Buy Hold Sell. The post drew over 6,000 clicks, more than every other post this quarter combined, and made May comfortably our strongest month. It is the clearest proof yet that recognisable media formats and personalities travel far further than standard fund content.',
      ],
      goals: [],
      activities: ['Special World Cup episode of Livewire Markets’ Buy Hold Sell','LinkedIn organic'],
      results: [{v:'6,000+',l:'Clicks on the LinkedIn post',d:'more than every other post combined',up:true},{v:'May',l:'Strongest month of the year',up:true}],
      q2: [],
      q3: [],
    },
    highlight3: {
      summary: [
        'We rolled out new creatives for the Geared Australian Share Fund (ASX: LEVR), supported by editorial placements in Investor Daily. The refreshed messaging drove advisers to the fund page, which drew over 1,000 visitors in the quarter.',
      ],
      goals: [],
      activities: ['New market-driven creative variants','Solus eDM via Investor Daily'],
      results: [{v:'1,000+',l:'Visitors to the fund page',d:'Geared Australian Share Fund',up:true}],
      q2: [],
      q3: [],
    },
    search: {
      summary: [
        'Across our Australian strategies, First Sentier ends June visible on around 145 search terms, holding flat on the quarter and up more than 40 per cent on a year ago. That steadiness came in a period when search coverage compressed across the market as Google answered more queries directly, so holding ground counted for something.',
        'Australian Equities Growth was the clear gainer, moving from 20 terms to 28 on the back of the reporting-season campaign and now ahead of Betashares in that category. Global Listed Infrastructure and Short Term Investments both eased slightly, in line with the wider contraction, while Vanguard remains the volume leader across every category we track. We continue to appear for the terms that matter to us: quant, cash, listed infrastructure and Australian equities.',
      ],
      goals: ['Analyse competitor activities and incorporate them into our website','Position our brand to be included in more AI search results as technology pivots'],
      activities: ['Paid search ads focusing on branded and ETF-related terms','Cross-promotions on LinkedIn with Duke and Xcel'],
      results: [{v:'145',l:'Search terms',d:'+40% YoY, flat on the quarter',up:true},{v:'20 → 28',l:'Australian Equities Growth terms',d:'now ahead of Betashares',up:true},{v:'Vanguard',l:'Volume leader across categories'}],
      q2: ['Hold ground as search coverage compresses'],
      q3: ['Build a data model on the ETF landscape with competitor positions','Understand how we rank for AI searches across all products'],
    },
    competitors: {
      summary: 'We track our competitors\u2019 live advertising from public ad libraries. Vanguard and the big ETF issuers out-spend us on paid across cash, ETF and index terms; our edge is the specialist strategies and named-voice content we lead on through owned channels.',
      goals: ['Understand competitor positioning','Identify white-space themes','Benchmark creative volume'],
      activities: ['Weekly ad-library monitoring','Creative theme analysis','Share-of-voice tracking'],
      results: [{v:'20',l:'Competitors advertising',d:'live in AU public ad libraries',up:true},{v:'14',l:'Peers tracked',d:'BrightEdge SEO register',up:true},{v:'Vanguard',l:'Top retail fund advertiser',d:'across ETF and index terms',up:true}],
      q2: ['Defend top equities and income search terms','Test a focused paid campaign'],
      q3: ['Broaden the tracked competitor set'],
    },
    website: {
      summary: [
        'The Australian site drew around 50,000 visitors in Q2, up a quarter on Q1, with the homepage, the RQI quant fund page and the Active Cash Fund the three most visited destinations. The Cash Fund page alone pulled over 6,300 visitors, evidence that the ETF launch campaign sent advisers straight to the right place.',
        'Performance and literature pages held attention longest, at nearly a minute each, and email became a genuine traffic source for the first time as the launch sequence drove visitors onto fund pages. Visits from AI assistants edged up, led by ChatGPT.',
      ],
      goals: ['Prepare the ASX Cash page and optimise for search engines','Refresh the homepage to funnel traffic to campaign landing pages'],
      activities: ['Cash ETF launch sequence to fund pages','Homepage and campaign landing pages','Continued search-engine optimisation'],
      results: [{v:'~50,000',l:'Visitors in Q2',d:'up a quarter on Q1',up:true},{v:'6,300+',l:'Active Cash Fund page',d:'ETF launch traffic',up:true},{v:'ChatGPT',l:'Leading AI referrer',up:true}],
      q2: ['Refresh the homepage to funnel to campaign pages'],
      q3: ['Continue optimising key campaign pages for search rankings'],
    },
    linkedin: {
      summary: [
        'May carried the quarter. The Buy Hold Sell World Cup post with Livewire drew over 6,000 clicks, more than every other post combined, and made May comfortably our strongest month. It is the clearest proof yet that recognisable media formats and personalities travel far further than standard fund content.',
        'Around it, the insight programme did its job: the Duke Energy fireside chat, the Asian energy-shock piece and the RBA rate commentary each drew steady adviser engagement. Follower growth was strongest in June, adding 181, the best month of the year.',
        'Paid follower acquisition has now wound down, and the page is growing on the strength of its content alone. The lesson from May is one to repeat: partner formats and named voices outperform product posts by a wide margin.',
      ],
      goals: ['Execute the two sponsored campaigns and analyse the data','Grow the channel and leverage it for campaign support'],
      activities: ['Buy Hold Sell World Cup post with Livewire','Duke Energy fireside chat and Asian energy-shock piece','RBA rate commentary'],
      results: [{v:'6,000+',l:'Clicks · Buy Hold Sell post',d:'more than every other post combined',up:true},{v:'+181',l:'New followers in June',d:'best month of the year',up:true},{v:'Organic',l:'Paid acquisition wound down',up:true}],
      q2: ['Grow the channel and leverage it for campaign support'],
      q3: ['Scale sponsored reach while publishing 3-4 organic posts a month','German-language coverage through IMK and FONDS Kongress'],
    },
    engagement: {
      summary: [
        'Two engines drove engagement this quarter. Global Listed Infrastructure was the biggest, generating more than 1,500 clicks from Asian wholesale banks: DBS in both Hong Kong and Singapore, Bank of China, China Construction Bank, Shanghai Commercial and OCBC all worked through the infrastructure sends. The strategy is Australian-run but its client base is firmly regional.',
        'The Cash ETF launch was the other. Just eight emails reached 740 organisations across Australia, the broadest single-campaign footprint of the quarter, with Bell Potter, Shaw and Partners and Ord Minnett among the advisers engaging. Reporting-season and Australian Equities Growth activity added a smaller adviser layer on top.',
        'On the website, the same names recur. IOOF, Ord Minnett, Pitcher Partners and Canaccord read fund and performance pages, Frontier Advisors worked through the RQI insights, and Equity Mates spent its time on the Active Cash Fund page. Adviser groups and consultants reading performance data is the follow-up list distribution can act on.',
      ],
      goals: ['Close the open-to-click gap on Asian sends','Consolidate event follow-ups into a single well-timed send'],
      activities: ['Global Listed Infrastructure sends to Asian wholesale banks','Cash ETF launch emails','Reporting-season and Australian Equities Growth activity'],
      results: [{v:'1,500+',l:'GLIS clicks from Asian banks',up:true},{v:'740',l:'Organisations · Cash ETF launch',d:'in 8 emails',up:true},{v:'8 emails',l:'Broadest footprint of the quarter',up:true}],
      q2: ['Turn performance-page readers into a distribution follow-up list'],
      q3: ['Consolidate event follow-ups into a single well-timed send'],
    },
  };

  // LinkedIn competitor creatives come from window.MI_LINKEDIN (li-data.js);
  // absent here until a brand LinkedIn snapshot lands, so these return empty.
  function liCreatives(){
    const L = (typeof window !== 'undefined' && window.MI_LINKEDIN) || {};
    return Array.isArray(L.creatives) ? L.creatives : [];
  }
  function liActivity(){
    const L = (typeof window !== 'undefined' && window.MI_LINKEDIN) || {};
    if (Array.isArray(L.activity) && L.activity.length) return L.activity;
    return liCreatives().map(c=>({ name:c.competitor, v:c.totalAds||0, color:c.color })).sort((a,b)=>b.v-a.v);
  }
  // Live competitor ad counts per quarter (Google Ads Transparency, via data.js);
  // the chart's Q1/Q2 slider picks one. Falls back to a seeded estimate.
  function adSoV(){
    const R = (typeof window !== 'undefined' && window.MI_REMOTE) || {};
    // Align the activity bars with the filtered ad-example gallery: only count
    // competitors that actually appear in creatives() (asset-class + live filter).
    const shown = new Set(creatives().map(c=>c.competitor));
    const keep = arr => (arr||[]).filter(r=>shown.has(r.name));
    if (R.AD_SOV && ((R.AD_SOV.q1 && R.AD_SOV.q1.length) || (R.AD_SOV.q2 && R.AD_SOV.q2.length)))
      return { q1: keep(R.AD_SOV.q1), q2: keep(R.AD_SOV.q2) };
    const rnd = seed('adsov-q2');
    const mk = f => COMPETITORS.map(c=>({ name:c.name, v:Math.round(3+rnd()*30*f), color:c.color }))
      .filter(r=>r.v>0).sort((a,b)=>b.v-a.v);
    return { q1: keep(mk(0.9)), q2: keep(mk(1)) };
  }

  const SEO = {
    scopeLabel: 'Strategy',
    months: ['Apr-25','May-25','Jun-25','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26','Jun-26'],
    scopes: [
      { key:'Equities Growth', label:'Equities Growth', series: [
        { name:'Perpetual', data:[32,29,32,35,35,37,38,38,57,57,58,65,68,68,68] },
        { name:'Schroders', data:[15,14,15,15,14,15,16,15,15,15,15,24,44,43,42] },
        { name:'First Sentier', us:true, data:[10,14,15,14,15,16,15,14,11,12,11,20,28,27,28] },
        { name:'BetaShares', data:[16,17,17,20,17,19,20,22,22,22,23,21,24,23,23] },
        { name:'Fidelity', data:[11,10,8,8,8,9,9,11,11,11,10,11,12,15,15] },
        { name:'Pendal', data:[9,9,8,9,8,11,12,16,17,18,17,15,11,14,14] },
        { name:'Ausbil', data:[5,7,5,5,5,7,6,8,7,6,5,10,11,12,12] },
        { name:'Yarra', data:[3,3,3,3,2,3,3,4,4,4,4,9,10,9,9] },
        { name:'Bennelong', data:[1,1,1,2,2,2,2,1,1,1,2,6,6,6,6] },
        { name:'Antares', data:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      ] },
      { key:'Small & Mid Caps', label:'Small & Mid Caps', series: [
        { name:'Vanguard', data:[33,36,38,44,48,51,51,51,49,51,52,55,51,51,51] },
        { name:'BetaShares', data:[17,18,18,22,28,32,32,38,40,37,36,38,36,35,33] },
        { name:'Perpetual', data:[18,17,19,19,24,28,28,28,26,27,28,27,28,29,29] },
        { name:'Fidelity', data:[10,11,13,13,16,19,20,21,18,18,17,20,19,19,20] },
        { name:'Ausbil', data:[2,2,0,3,8,11,9,11,12,11,12,14,13,14,14] },
        { name:'First Sentier', us:true, data:[5,6,5,10,13,17,17,18,18,17,17,17,14,13,13] },
        { name:'Schroders', data:[5,4,4,6,10,12,12,12,11,11,11,11,11,10,10] },
        { name:'Pendal', data:[1,2,1,4,2,2,2,3,4,4,5,4,4,4,4] },
        { name:'OC Funds', data:[0,0,0,1,1,2,2,2,2,2,2,2,2,2,2] },
      ] },
      { key:'Global Property', label:'Global Property', series: [
        { name:'Vanguard', data:[7,7,7,7,10,11,13,12,11,12,14,16,15,16,16] },
        { name:'First Sentier', us:true, data:[6,6,6,6,8,8,10,8,7,7,7,9,9,9,9] },
        { name:'BlackRock', data:[6,6,6,6,7,7,7,6,5,5,5,5,6,6,6] },
        { name:'Resolution Capital', data:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      ] },
      { key:'Global Infra', label:'Global Infra', series: [
        { name:'ClearBridge', data:[18,17,19,23,28,33,35,35,36,40,42,46,43,42,42] },
        { name:'First Sentier', us:true, data:[29,27,28,26,29,30,31,30,32,34,32,32,28,31,30] },
        { name:'Vanguard', data:[12,13,11,12,13,14,17,18,18,19,17,21,21,21,20] },
        { name:'Maple-Brown Abbott', data:[17,18,14,15,13,14,16,17,18,19,19,19,16,16,17] },
        { name:'Russell', data:[12,11,12,11,14,14,16,18,17,17,16,17,17,15,15] },
        { name:'BlackRock', data:[8,8,9,10,11,10,10,10,11,13,13,16,15,13,13] },
        { name:'Atlas', data:[6,8,7,8,6,6,8,10,9,8,8,6,7,10,10] },
        { name:'BetaShares', data:[1,1,2,2,2,3,4,4,4,6,6,6,8,8,9] },
        { name:'UBS', data:[4,5,3,4,2,2,3,4,4,4,4,4,4,4,5] },
        { name:'Nomura', data:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,1] },
        { name:'Magellan', data:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
      ] },
      { key:'Short Term', label:'Short Term', series: [
        { name:'Vanguard', data:[95,94,99,118,140,143,147,152,150,154,161,163,162,160,158] },
        { name:'BetaShares', data:[46,49,49,54,69,72,73,75,89,95,93,100,92,86,82] },
        { name:'BlackRock', data:[44,44,49,51,53,56,59,60,65,69,70,72,67,70,74] },
        { name:'First Sentier', us:true, data:[49,50,48,49,69,68,69,76,79,78,76,70,64,65,64] },
        { name:'UBS', data:[5,3,4,4,5,5,5,5,6,5,4,8,7,6,6] },
      ] },
    ],
  };
  function seoRankings(){ return SEO; }

  // Q2 2026 email engagement, rebuilt from the Salesforce campaign-activity
  // export (2026/Q2/Global-contact-activity-Q1_Q2_salesforce_simplified.xlsx).
  // Scoped to this brand's Q2 sends; company + open-opportunity pin joined
  // via the Prospect Data account map. o = opens, c = clicks, p = open pipeline.
  const EMAIL_ENG = {
    note: 'Q2 2026 (Apr–Jun) campaign engagement from Salesforce (Global contact activity export). Opens are Apple-MPP inflated; rows are ranked by total engagement (opens + clicks), with clicks highlighted. External contacts only; contacts show initial + surname with company. A pin marks a company that has an open service-request opportunity in the pipeline.',
    dims: [
      { key:'strategy', label:'Strategy', rows: [
        { n:"Listed infra + AFI", o:612, c:316, e:16 },
        { n:"Cash ETF", o:648, c:81, e:2 },
        { n:"Small companies", o:173, c:12, e:1 },
        { n:"SMIDs", o:125, c:15, e:1 },
      ] },
      { key:'company', label:'Company', rows: [
        { n:"DBS BANK LTD SINGAPORE", o:20, c:40, e:4 },
        { n:"DBS Bank (Hong Kong) Limited", o:3, c:31, e:3 },
        { n:"Bank of China (Hong Kong) Limited", o:12, c:21, e:3 },
        { n:"Oversea-Chinese Banking Corporation", o:26, c:6, e:4 },
        { n:"China Construction Bank (Asia) Corporation …", o:8, c:21, e:3 },
        { n:"Phillip Securities Pte Ltd", o:21, c:1, e:3 },
        { n:"Pegasus Fund Managers Ltd", o:7, c:12, e:3 },
        { n:"ENDOWUS", o:14, c:1, e:3 },
        { n:"Great Eastern Life Assurance Co Ltd", o:15, c:0, e:6 },
        { n:"AIA International Limited", o:5, c:8, e:5 },
        { n:"HSBC Private Bank (HK)", o:12, c:1, e:5, p:1 },
        { n:"Shanghai Commercial Bank Limited", o:0, c:12, e:3 },
        { n:"WING LUNG BANK LTD", o:3, c:9, e:6 },
        { n:"Amundi Singapore Limited", o:3, c:9, e:4 },
        { n:"Caisse de depot et placement du Quebec", o:10, c:1, e:3 },
        { n:"RSM Financial Services Australia Pty Ltd - …", o:9, c:0, e:2, p:1 },
        { n:"Ord Minnett Limited - Melbourne", o:5, c:3, e:1 },
        { n:"Oreana Financial Services Ltd", o:8, c:0, e:3, p:1 },
        { n:"Financial Alliance", o:8, c:0, e:3, p:1 },
        { n:"AIA Singapore Private Limited", o:1, c:6, e:5 },
        { n:"Employees Provident Fund (EPF)", o:5, c:2, e:3 },
        { n:"Arco Advisory - Notting Hill", o:6, c:1, e:5 },
        { n:"Nanyang Technological University", o:0, c:6, e:2 },
        { n:"OCBC Wing Hang Bank Limited", o:3, c:3, e:3 },
        { n:"Mercer (Singapore) Pte Ltd", o:3, c:3, e:1, p:1 },
      ] },
      { key:'contact', label:'Contact', rows: [
        { n:"J. Chung", o:8, c:4, e:0 },
        { n:"A. Hui", o:1, c:4, e:0 },
        { n:"R. Ma · HSBC Private Bank (HK)", o:5, c:0, e:0, p:1 },
        { n:"J. Ng · Great Eastern Life Assurance Co Ltd", o:5, c:0, e:0 },
        { n:"M. Liew · First State Investments (Singapor…", o:1, c:3, e:0 },
        { n:"W. Tee · Amundi Singapore Limited", o:1, c:3, e:0 },
        { n:"L. Daffara · Amundi Singapore Limited", o:1, c:3, e:0 },
        { n:"V. Bahl · DBS BANK LTD SINGAPORE", o:1, c:3, e:0 },
        { n:"J. Teo · Amundi Singapore Limited", o:1, c:3, e:0 },
        { n:"F. Tran · Amundi Asset Management - France", o:1, c:3, e:0 },
        { n:"M. Silec · FB Wealth Management Pty Ltd - S…", o:2, c:2, e:0 },
        { n:"T. Wiseman · Wiseman Financial Services Pty…", o:2, c:2, e:0, p:1 },
        { n:"K. Arthur", o:2, c:2, e:0 },
        { n:"W. Zhang · Global Fortune Management Pty Ltd", o:3, c:1, e:0 },
        { n:"A. Lysikatos · Arco Advisory - Notting Hill", o:3, c:1, e:0 },
        { n:"A. Akamo", o:4, c:0, e:0 },
        { n:"A. Palaniappan · Palani & Associates Pty Lt…", o:4, c:0, e:0 },
        { n:"A. Ikraan", o:4, c:0, e:0 },
        { n:"N. Johnston · Johnston Financial Pty Ltd - …", o:4, c:0, e:0, p:1 },
        { n:"A. Lam · DBS Bank (Hong Kong) Limited", o:0, c:3, e:0 },
        { n:"K. Kwok · China Construction Bank (Asia) Co…", o:0, c:3, e:0 },
        { n:"I. Ng · WING LUNG BANK LTD", o:0, c:3, e:0 },
        { n:"D. Cheung · Shanghai Commercial Bank Limited", o:0, c:3, e:0 },
        { n:"K. Kwok · Shanghai Commercial Bank Limited", o:0, c:3, e:0 },
        { n:"K. Liao · WING LUNG BANK LTD", o:0, c:3, e:0 },
      ] },
    ],
  };
  function emailEng(){ return EMAIL_ENG; }

  // Press share-of-voice from Signal AI (press-data.js snapshot, or MI_REMOTE.PRESS
  // if the build ever fetches it live). Still NO seeded fallback: invented press
  // coverage would be indistinguishable from the real thing on the page, so no
  // data means the tab says so rather than drawing bars.
  function press(q){
    const R = (typeof window !== 'undefined' && window.MI_REMOTE) || {};
    if (Array.isArray(R.PRESS) && R.PRESS.length) return R.PRESS;
    const P = (typeof window !== 'undefined' && window.MI_PRESS) || null;
    const rows = P && P.quarters && P.quarters[q || 'q2'];
    // normalise the compact snapshot keys to what the renderer reads
    return Array.isArray(rows)
      ? rows.map(r => ({ name:r.n, total:r.t, positive:r.p, neutral:r.u, negative:r.g, us:!!r.us }))
      : [];
  }
  function pressMeta(){ return (typeof window !== 'undefined' && window.MI_PRESS) || null; }
  // Coverage cards, already filtered to Igneo's investment universe upstream.
  function pressArticles(){
    const P = (typeof window !== 'undefined' && window.MI_PRESS) || null;
    return (P && Array.isArray(P.articles)) ? P.articles : [];
  }

  // LinkedIn channel — organic + paid from the linkedin-API pipeline
  // (li_share_statistics_by_month / li_ads_by_campaign / li_organic_posts /
  //  li_follower_statistics, synced Jul 2026). Audience labels are LinkedIn's
  // standard seniority/function/staff-size taxonomies.
  const LI_CHANNEL = {
    quarters: [
      { key:'q1', label:'Q1 2026', organic:{ i:35902, c:3437 }, paid:{ i:0, c:0 } },
      { key:'q2', label:'Q2 2026', organic:{ i:51214, c:7645 }, paid:{ i:0, c:0 } },
    ],
    months: [
      { m:'Jan', o:11976, oc:2176, p:0, pc:0 },
      { m:'Feb', o:7076, oc:446, p:0, pc:0 },
      { m:'Mar', o:16850, oc:815, p:0, pc:0 },
      { m:'Apr', o:9145, oc:413, p:0, pc:0 },
      { m:'May', o:27292, oc:6566, p:0, pc:0 },
      { m:'Jun', o:14777, oc:666, p:0, pc:0 },
    ],
    followers: 32868,
    audience: {
      seniority: { label:'Seniority', rows:[
        { n:'Senior', v:13386 },
        { n:'Entry', v:6093 },
        { n:'Director', v:5469 },
        { n:'Manager', v:2978 },
        { n:'VP', v:2099 },
        { n:'CXO', v:1043 },
        { n:'Owner', v:836 },
        { n:'Partner', v:633 },
      ] },
      func: { label:'Function', rows:[
        { n:'Finance', v:7158 },
        { n:'Business Development', v:5388 },
        { n:'Operations', v:2078 },
        { n:'Sales', v:2055 },
        { n:'Information Technology', v:1695 },
        { n:'Human Resources', v:1056 },
        { n:'Marketing', v:980 },
        { n:'Engineering', v:959 },
      ] },
      size: { label:'Company size', rows:[
        { n:'10k+', v:7181 },
        { n:'1k-5k', v:5265 },
        { n:'11-50', v:3808 },
        { n:'51-200', v:3682 },
        { n:'2-10', v:2890 },
        { n:'201-500', v:2678 },
        { n:'501-1k', v:2569 },
        { n:'5k-10k', v:2031 },
      ] },
    },
    posts: {
      q1: [
        { t:'For Adviser/Professional/Institutional audiences only. AI and data centres are reshaping electricity demand — but how can utilities deliver growth al…', cat:'Insights', img:'7444584008362909696.jpg', mt:'video', i:5011, c:241, l:39, cm:0 },
        { t:'This content is intended for institutional/professional investors or financial advisers in Australia only. We’re proud to share the First Sentier Aus…', cat:'Product & launches', img:'', mt:'', i:4907, c:1291, l:79, cm:1 },
        { t:'“Trust that you deserve to be in the room.” Sage advice from our Australian Equities Growth Portfolio Manager Alison Thai…', cat:'People', img:'7436896865264082944.jpg', mt:'article', i:4842, c:294, l:49, cm:0 },
        { t:'In our latest video, Nigel Foo, Head of Asian Fixed Income, shares how Asian fixed income performed in 2025 and what in…', cat:'Insights', img:'7422128075519258624.jpg', mt:'video', i:4435, c:298, l:54, cm:0 },
        { t:'This content is intended for Australia only. The Reserve Bank of Australia hiked the cash rate to 4.1% this week. Our Short Term Investments Senior…', cat:'Insights', img:'7440191272486670336.jpg', mt:'article', i:2991, c:61, l:20, cm:0 },
        { t:'In a market where shareholder income is increasingly sought after, Global Listed Infrastructure is proving to be a quiet achiever. Dividend yields re…', cat:'Insights', img:'7437283267680284672.jpg', mt:'video', i:2496, c:85, l:29, cm:0 },
        { t:'From a value‑driven consumer reshaping retail, to AI fears creating mispriced software opportunities, this reporting season has plenty bubbling benea…', cat:'Insights', img:'7433031546372227073.jpg', mt:'article', i:2488, c:74, l:19, cm:0 },
        { t:'When First Sentier Group launched its inaugural Climate and Nature Report, it marked an important milestone in our …', cat:'Responsible investment', img:'7417374419074859008.jpg', mt:'image', i:2011, c:73, l:41, cm:0 },
      ],
      q2: [
        { t:'This content is intended for Australian institutional and adviser audiences only. We’re excited to celebrate the launch of the First Sentier Active…', cat:'Product & launches', img:'', mt:'', i:15254, c:6090, l:236, cm:3 },
        { t:'This content is for audiences in Australia only. What does a potential World Cup-winning ASX portfolio look like? Our Head of Australian Equities…', cat:'Insights', img:'7470373751272943616.jpg', mt:'image', i:5421, c:197, l:49, cm:1 },
        { t:'This content is intended for Australia only. The Reserve Bank of Australia has raised the cash rate at their last 3 meetings, to now be at 4.35%, …', cat:'Insights', img:'7457678556156821505.jpg', mt:'article', i:5027, c:108, l:25, cm:0 },
        { t:'For Adviser/Professional/Institutional audiences only. In our latest fireside chat, Brian Savoy, Chief Financial Officer …', cat:'Insights', img:'7452547973454016512.jpg', mt:'video', i:3967, c:212, l:46, cm:0 },
        { t:'This content is intended for institutional investors or financial advisers in Australia only. With cash yields around 5%, investors are increasingl…', cat:'Insights', img:'7474708213494358016.jpg', mt:'article', i:2737, c:56, l:26, cm:0 },
        { t:'This content is intended for Australian institutional and adviser audiences only. For years, cash was the forgotten asset class, but this has now s…', cat:'Insights', img:'7472864121584123904.jpg', mt:'video', i:2599, c:127, l:53, cm:0 },
        { t:'This content is for adviser/professional/institutional audiences only. Our Global Listed Infrastructure Portfolio Manager, Rebecca Sherlock…', cat:'Insights', img:'7467389151840063490.jpg', mt:'image', i:2465, c:33, l:32, cm:0 },
        { t:'This content is intended for Australia only. The Australian Bureau of Statistics reported a rise in annual CPI to 4.6…', cat:'Insights', img:'7455429745288073216.jpg', mt:'article', i:2320, c:35, l:20, cm:0 },
      ],
    },
  };
  function liChannel(){ return LI_CHANNEL; }

  // Funnel-stage divider cards (Goals / Marketing activities / Focus for Q2 / Q3),
  // auto-injected into the .divider pages by data-label. Reuse the doc-sourced
  // goals/activities/focus already on the matching CB section: awareness = search,
  // consideration = website, conversion = engagement.
  const STAGES = {
    awareness: CB.search,
    consideration: { 'LinkedIn (organic)': CB.linkedin, 'Website': CB.website },
    conversion: CB.engagement,
  };

  return {
    PERIOD, HEADLINE, CHANNELS, COMPETITORS, FORMATS, FIRMS, KEY_PAGES, EVENTS, KPI, RESULTS, CB, STAGES,
    TOP_PAGES, SEARCH_QUERIES, EMAILS, EMAIL_SUMMARY, DEALS, CAMPAIGNS, FIRMS_SUMMARY,
    fmtInt, fmtK,
    channelSeries, visitsSeries, firmsByPage, creatives, press, pressMeta, pressArticles, liChannel, liCreatives, liActivity, shareOfVoice, adSoV, searchVisibility, seoRankings, emailEng,
  };
})();

;(function () {
  // Copy real Data-Hub datasets over the seeded defaults — but only ones that
  // actually contain something. An empty array or an all-zero VISITS series
  // (a GA4 property with no recorded data yet) must not shadow the honest
  // fallback the pack would otherwise show.
  try { var R = (typeof window !== 'undefined' && window.MI_REMOTE) || {};
    for (var k in R) if (Object.prototype.hasOwnProperty.call(R, k)) {
      var v = R[k];
      if (Array.isArray(v) && !v.length) continue;
      if (k === 'VISITS' && Array.isArray(v) && !v.some(function(w){ return (w.sessions||0) > 0; })) continue;
      window.MIDATA[k] = v;
    } } catch (e) {}
})();
