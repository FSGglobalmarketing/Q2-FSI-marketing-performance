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
    { v:'486.5k', l:'People reached on LinkedIn', d:'+18% vs Q1', up:true },
    { v:'48,213', l:'Website visits',             d:'+11% vs Q1', up:true },
    { v:'33.9%',  l:'Email open rate',            d:'+2.4 pts vs Q1', up:true },
    { v:'212',    l:'Companies reading our pages',d:'+34 vs Q1', up:true },
    { v:'18.6%',  l:'Our share of search',        d:'+3.1 pts vs Q1', up:true },
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
  function firmsByPage(pageIdx){
    const rnd = seed('alx'+pageIdx);
    const rot = [...FIRMS.slice(pageIdx%FIRMS.length), ...FIRMS.slice(0, pageIdx%FIRMS.length)];
    return rot.slice(0,8).map((fm,i)=>{
      const views = Math.round((320 - i*30) * (0.7+rnd()*0.7));
      const delta = Math.round((rnd()*80)-25);
      return { ...fm, views: Math.max(views,18), delta, sessions: Math.max(1, Math.round(views/22)) };
    }).sort((a,b)=>b.views-a.views);
  }
  const FIRMS_SUMMARY = { companies:212, newCompanies:34, tier1:68, topIndustry:'Asset Management' };

  // ============================================================
  // LinkedIn — organic + paid + competitor benchmark
  // ============================================================
  function linkedin(){
    const rnd = seed('li-q2');
    const spark = (base) => Array.from({length:13}, (_,i)=> Math.round(base*(0.6+Math.abs(Math.sin(i/2))*0.9+(rnd()-0.5)*0.2)) );
    return {
      organic: { followers:'38,102', followerGain:'+312', impressions:'486.5k', clicks:'9,140', engRate:'4.2%', series:spark(40) },
      paid:    { impressions:'1.2M', clicks:'8,900', spend:'$42,000', conversions:'584', series:spark(85) },
      bench: [
        { name:'Our brand', rate:4.2, us:true },
        { name:'Blackstone', rate:3.1 },
        { name:'BlackRock',  rate:2.7 },
        { name:'Schroders',  rate:2.3 },
        { name:'Peer average', rate:2.6 },
      ],
      posts: [
        { title:'Why Asian infrastructure is the quiet compounder', reactions:1204, comments:96, shares:142, type:'Thought leadership' },
        { title:'Meet the team behind our China strategy',          reactions:842,  comments:54, shares:61,  type:'People' },
        { title:'Video: 90 seconds on quality growth',              reactions:2110, comments:118,shares:230, type:'Video' },
      ],
    };
  }

  // ============================================================
  // Competitor Ads — Google Ads Transparency creatives
  // ============================================================
  const COMPETITORS = [
    { name:'Blackstone', domain:'blackstone.com', color:'var(--c-a)' },
    { name:'BlackRock',  domain:'blackrock.com',  color:'var(--c-b)' },
    { name:'Schroders',  domain:'schroders.com',  color:'var(--c-c)' },
    { name:'Nuveen',     domain:'nuveen.com',     color:'var(--c-d)' },
  ];
  const FORMATS = ['Image','Video','Text'];
  function creatives(){
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
    { name:'Global listed infra — quarterly update', opens:17712, openRate:33.9, clickRate:6.0 },
    { name:'China outlook 2026 — invitation',        opens:14204, openRate:31.2, clickRate:5.1 },
    { name:'Asian growth — thought leadership',      opens:11908, openRate:29.7, clickRate:4.4 },
    { name:'Monthly periodical — June',              opens:9860,  openRate:27.5, clickRate:3.8 },
    { name:'Event: Asia Pacific Leaders webinar',    opens:8412,  openRate:36.4, clickRate:7.2 },
  ];
  const EMAIL_SUMMARY = [
    { v:'62,096', l:'Emails opened' },
    { v:'33.9%',  l:'Average open rate' },
    { v:'5,540',  l:'Link clicks' },
    { v:'396',    l:'Replies to sales' },
    { v:'242',    l:'Meetings booked' },
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
    { name:'Asia Pacific Leaders webinar', city:'Singapore', region:'APAC', status:'Delivered', x:0.78, y:0.55 },
    { name:'Infrastructure Investor Summit', city:'London', region:'EMEA', status:'Delivered', x:0.47, y:0.34 },
    { name:'China outlook luncheon', city:'Hong Kong', region:'APAC', status:'Delivered', x:0.80, y:0.48 },
    { name:'US institutional forum', city:'New York', region:'Americas', status:'Upcoming', x:0.26, y:0.40 },
    { name:'DACH advisor roadshow', city:'Frankfurt', region:'EMEA', status:'Upcoming', x:0.50, y:0.33 },
  ];

  // ============================================================
  // Results — outcomes by funnel stage
  // ============================================================
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
    phaseII: {
      summary: 'Our flagship Asia Phase II campaign ran across paid social, out-of-home and owned channels through the quarter, repositioning the flagship strategy for institutional audiences in core Asian markets.',
      goals: ['Lift brand recall in core Asian markets','Extend distribution into Tier-2 cities','Reposition the flagship strategy'],
      activities: ['Out-of-home and paid social','Owned email nurture programme','Partner co-marketing'],
      results: [{v:'+12%',l:'Brand recall',b:'+8%',up:true},{v:'4.2M',l:'Impressions',b:'3.0M',up:true},{v:'87k',l:'Engagements',b:'60k',up:true}],
      q2: ['Phase III creative refresh','Tier-2 paid expansion'],
      q3: ['Retargeting layer','Always-on remarketing'],
    },
    search: {
      summary: 'We measured how we appear in search against a defined peer set. Organic visibility grew steadily and we now lead the peer average on our priority themes.',
      goals: ['Defend brand search terms','Grow non-brand share of voice','Build category authority'],
      activities: ['Weekly editorial programme','Technical SEO improvements','Backlink and PR outreach'],
      results: [{v:'18.6%',l:'Search share',b:'15.5%',up:true},{v:'1,120',l:'Top-10 terms',b:'900',up:true},{v:'+18',l:'Position movers',b:'+10',up:true}],
      q2: ['Twelve new topic-cluster pages','Structured-data rollout'],
      q3: ['Internal-linking refresh'],
    },
    competitors: {
      summary: 'We track our competitors\u2019 live advertising from public ad libraries. They continue to out-spend us on paid, concentrating on private markets and infrastructure \u2014 the themes we already lead on organically.',
      goals: ['Understand competitor positioning','Identify white-space themes','Benchmark creative volume'],
      activities: ['Weekly ad-library monitoring','Creative theme analysis','Share-of-voice tracking'],
      results: [{v:'16.6%',l:'Paid share of voice',b:'13.0%',up:true},{v:'4',l:'Competitors tracked',b:'3',up:true},{v:'18.6%',l:'Search share (lead)',b:'15.5%',up:true}],
      q2: ['Defend top infrastructure terms','Test a focused paid campaign'],
      q3: ['Expand competitive set to five'],
    },
    website: {
      summary: 'The website remained our always-on hub. Visits held steady quarter-on-quarter while time-on-page and conversion both improved after the spring content refresh.',
      goals: ['Reduce bounce on campaign pages','Lift enquiry conversion','Improve mobile load speed'],
      activities: ['Hero and template redesign','Call-to-action experiments','Image performance pass'],
      results: [{v:'41.2%',l:'Bounce rate',b:'47%',up:true},{v:'1:52',l:'Avg. time on page',b:'1:35',up:true},{v:'9.1%',l:'Conversion',b:'7.0%',up:true}],
      q2: ['Search navigation redesign','Enquiry form simplification'],
      q3: ['Editorial CMS migration'],
    },
    preview: {
      summary: 'A redesigned website is in internal beta. The new information architecture, visual system and component-based CMS are on track for a Q3 public launch.',
      goals: ['Ship the redesigned architecture','Modernise the visual system','Move to a component CMS'],
      activities: ['Discovery and content audits','Design sprints','Internal beta programme'],
      results: [{v:'36%',l:'Faster key journeys',b:'20%',up:true},{v:'+2.1',l:'Pilot satisfaction',b:'+1.0',up:true},{v:'94',l:'Performance score',b:'78',up:true}],
      q2: ['Public launch \u2014 Q3, week 6','Sales enablement'],
      q3: ['Ongoing A/B testing framework'],
    },
    linkedin: {
      summary: 'LinkedIn is our largest owned audience. Organic engagement outperformed every tracked competitor, and paid campaigns delivered qualified leads at a lower cost than last quarter.',
      goals: ['Build thought leadership','Support senior recruitment','Amplify flagship campaigns'],
      activities: ['Executive voice programme','Hiring spotlights','Campaign repurposing'],
      results: [{v:'4.2%',l:'Engagement rate',b:'2.6%',up:true},{v:'486.5k',l:'Organic reach',b:'412k',up:true},{v:'584',l:'Paid leads',b:'430',up:true}],
      q2: ['Launch newsletter','Video series'],
      q3: ['Employee advocacy pilot'],
    },
    engagement: {
      summary: 'Client-facing channels turned attention into conversations. Email engagement rose across the board and directly generated meetings for the sales team.',
      goals: ['Lift email engagement','Grow qualified replies','Convert interest to meetings'],
      activities: ['Segmented nurture journeys','Periodicals refresh','Sales-aligned calls to action'],
      results: [{v:'33.9%',l:'Open rate',b:'31.5%',up:true},{v:'396',l:'Replies to sales',b:'280',up:true},{v:'242',l:'Meetings booked',b:'180',up:true}],
      q2: ['Triggered journeys','Cadence clean-up'],
      q3: ['Account-based expansion'],
    },
  };

  return {
    PERIOD, HEADLINE, CHANNELS, COMPETITORS, FORMATS, FIRMS, KEY_PAGES, EVENTS, RESULTS, CB,
    TOP_PAGES, SEARCH_QUERIES, EMAILS, EMAIL_SUMMARY, DEALS, CAMPAIGNS, FIRMS_SUMMARY,
    fmtInt, fmtK,
    channelSeries, visitsSeries, firmsByPage, linkedin, creatives, shareOfVoice, searchVisibility,
  };
})();
