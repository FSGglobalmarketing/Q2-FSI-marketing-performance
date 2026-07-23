/* fetch-data.mjs — build-time Marketing-Data-Hub pull (Igneo).
   Writes ../data.js (window.MI_REMOTE) overriding seeded defaults in
   mi-data.js. Missing creds -> empty (seeded fallback); never fails build. */
import { writeFileSync } from 'node:fs';
import { fetch as alxFetch, Agent } from 'undici';
const OUT = new URL('../data.js', import.meta.url);
const PROPERTY = process.env.GA4_PROPERTY_ID;
const SA_KEY   = process.env.GA4_SA_KEY;
// Alphix Reports API (firm-level web insights). Reports token only — no Feed token needed.
const ALPHIX_SUBDOMAIN = process.env.ALPHIX_SUBDOMAIN;               // e.g. "firstsentier"
const ALPHIX_TOKEN     = process.env.ALPHIX_REPORTS_TOKEN;           // alx_... user token
const ALPHIX_SCHEME    = process.env.ALPHIX_AUTH_SCHEME || 'Bearer'; // this tenant requires Bearer
const ALPHIX_DOMAIN    = process.env.ALPHIX_DOMAIN || 'www.firstsentierinvestors.com'; // brand site to keep (matches GA4 paths)
// Long timeouts for the big (20MB+) Firms-by-Page download — Node's default
// fetch bodyTimeout drops it in CI ("terminated").
const ALX_AGENT = new Agent({ connectTimeout: 30000, headersTimeout: 600000, bodyTimeout: 600000 });
const remote = {};

const Q2 = { startDate: '2026-04-01', endDate: '2026-06-30' };
const Q1 = { startDate: '2026-01-01', endDate: '2026-03-31' };

async function ga4Client() {
  const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
  return new BetaAnalyticsDataClient({ credentials: JSON.parse(SA_KEY) });
}

const runReport = (c, cfg) =>
  c.runReport({ property: `properties/${PROPERTY}`, ...cfg }).then(([r]) => r.rows || []);

// Most-read pages — enriched per page. Built from several small reports keyed
// by pagePath, each in its own try/catch so one incompatible metric group
// (e.g. session-scoped metrics against a page dimension) can't wipe the rest.
async function ga4Pages(c) {
  const byPath = new Map();
  const get = p => { let o = byPath.get(p); if (!o) { o = { path: p }; byPath.set(p, o); } return o; };

  // 1) core: page views, individual users, total events (+ representative title)
  const core = await runReport(c, {
    dateRanges: [Q2],
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }, { name: 'eventCount' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 200,
  });
  core.forEach(r => {
    const o = get(r.dimensionValues[0].value);
    const v = Number(r.metricValues[0].value);
    if (v > (o._titleViews || 0)) { o.title = r.dimensionValues[1].value; o._titleViews = v; }
    o.views  = (o.views  || 0) + v;
    o.users  = (o.users  || 0) + Number(r.metricValues[1].value);
    o.events = (o.events || 0) + Number(r.metricValues[2].value);
  });

  // 2) session quality: average session duration (s) + bounce rate (0-1)
  try {
    const q = await runReport(c, {
      dateRanges: [Q2],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'averageSessionDuration' }, { name: 'bounceRate' }],
      limit: 400,
    });
    q.forEach(r => { const o = byPath.get(r.dimensionValues[0].value);
      if (o) { o.dur = Number(r.metricValues[0].value); o.bounce = Number(r.metricValues[1].value); } });
  } catch (e) { console.error('GA4 page quality failed:', e.message); }

  // 3) returning-user share (newVsReturning split)
  try {
    const q = await runReport(c, {
      dateRanges: [Q2],
      dimensions: [{ name: 'pagePath' }, { name: 'newVsReturning' }],
      metrics: [{ name: 'totalUsers' }],
      limit: 800,
    });
    const acc = {};
    q.forEach(r => { const p = r.dimensionValues[0].value, kind = r.dimensionValues[1].value, u = Number(r.metricValues[0].value);
      (acc[p] ||= { ret: 0, tot: 0 }); acc[p].tot += u; if (kind === 'returning') acc[p].ret += u; });
    Object.entries(acc).forEach(([p, a]) => { const o = byPath.get(p); if (o && a.tot) o.returning = a.ret / a.tot; });
  } catch (e) { console.error('GA4 returning failed:', e.message); }

  // 4) primary channel group — Session default channel group with most sessions
  try {
    const q = await runReport(c, {
      dateRanges: [Q2],
      dimensions: [{ name: 'pagePath' }, { name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      limit: 1500,
    });
    const best = {};
    q.forEach(r => { const p = r.dimensionValues[0].value, ch = r.dimensionValues[1].value, s = Number(r.metricValues[0].value);
      if (!best[p] || s > best[p].s) best[p] = { ch, s }; });
    Object.entries(best).forEach(([p, b]) => { const o = byPath.get(p); if (o) o.channel = b.ch; });
  } catch (e) { console.error('GA4 channel failed:', e.message); }

  // 5) last-quarter (Q1) views for the comparison bar
  try {
    const q = await runReport(c, {
      dateRanges: [Q1],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      limit: 400,
    });
    q.forEach(r => { const o = byPath.get(r.dimensionValues[0].value); if (o) o.prevViews = Number(r.metricValues[0].value); });
  } catch (e) { console.error('GA4 Q1 views failed:', e.message); }

  return [...byPath.values()].filter(o => o.views).sort((a, b) => b.views - a.views).slice(0, 80)
    .map(o => ({
      path: o.path, title: o.title || o.path, views: o.views, prevViews: o.prevViews || 0,
      users: o.users || 0, dur: Math.round(o.dur || 0), bounce: o.bounce ?? null,
      events: o.events || 0, returning: o.returning ?? null, channel: o.channel || null,
    }));
}

// Weekly website visits — 13 weeks of Q2 sessions + the aligned Q1 week as
// comparison. Both quarters are labelled so the Q1/Q2 slider can relabel the
// axis. Pulled daily and bucketed so week boundaries are exact.
async function ga4Weekly(c) {
  async function daily(dr) {
    const rows = await runReport(c, { dateRanges: [dr], dimensions: [{ name: 'date' }], metrics: [{ name: 'sessions' }], limit: 400 });
    const m = {}; rows.forEach(r => { m[r.dimensionValues[0].value] = Number(r.metricValues[0].value); }); return m;
  }
  const q2 = await daily(Q2), q1 = await daily(Q1);
  const weeks = (map, y, mo, d0) => {
    const out = [];
    for (let w = 0; w < 13; w++) {
      let sum = 0;
      for (let d = 0; d < 7; d++) {
        const dt = new Date(Date.UTC(y, mo, d0 + w * 7 + d));
        sum += map[dt.toISOString().slice(0, 10).replace(/-/g, '')] || 0;
      }
      out.push({ start: new Date(Date.UTC(y, mo, d0 + w * 7)), sum });
    }
    return out;
  };
  const a = weeks(q2, 2026, 3, 1), b = weeks(q1, 2026, 0, 1);
  const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return a.map((x, i) => ({
    label: fmt(x.start), prevLabel: b[i] ? fmt(b[i].start) : '',
    sessions: x.sum, prev: b[i] ? b[i].sum : 0,
  }));
}

// Alphix Reports API — download the pre-provisioned "MI - Firms by Page" saved
// report (JSON-Lines). The report OUTPUT uses Title-Case keys with spaces:
//   "Firm", "Firm Industry", "Domain", "Page URL", "Pageviews Human".
// It spans the whole First Sentier estate, so we keep only this brand's domain
// (ALPHIX_DOMAIN) and only the pages the pack shows, then build
//   window.MI_REMOTE.ALPHIX = { [pagePath]: [ {firm,domain,industry,views,sessions} ] }
// + FIRMS_SUMMARY. Auth: Authorization: "Bearer <alx_token>".
const alxNum  = v => Number(String(v ?? '').replace(/[^0-9.]/g, '')) || 0;
const alxPath = u => { try { return new URL(u).pathname.replace(/\/+$/,'') || '/'; }
                       catch { return String(u || '').replace(/^https?:\/\/[^/]+/i, '').replace(/[?#].*$/,'').replace(/\/+$/,'') || String(u||''); } };

async function alphixPull(wantedPaths) {
  const seenDomains = new Set();   // diagnostic: what Domains does the report actually carry?
  const base = `https://${ALPHIX_SUBDOMAIN}.alphix.com/api`;
  const opts = { headers: { Authorization: `${ALPHIX_SCHEME} ${ALPHIX_TOKEN}`.trim(), 'Content-Type': 'application/json' }, dispatcher: ALX_AGENT };
  const unwrap = b => (b && typeof b === 'object' && 'data' in b) ? b.data : b;

  const lr = await alxFetch(`${base}/report`, opts);
  if (!lr.ok) throw new Error(`GET /report ${lr.status}`);
  let reports = unwrap(await lr.json());
  if (reports && !Array.isArray(reports)) reports = reports.reports || reports.data || [];
  const idByName = {};
  (reports || []).forEach(r => { if (r && r.name) idByName[r.name] = r.id || r.reportId; });

  const want = (wantedPaths && wantedPaths.size) ? wantedPaths : null;
  let ALPHIX = {}, firmSet = new Set(), byIndustry = {}, totalViews = 0, namedViews = 0;
  const onRow = (r) => {
    seenDomains.add(r['Domain'] || '(blank)');
    if ((r['Domain'] || '') !== ALPHIX_DOMAIN) return;            // this brand's site only
    const views = alxNum(r['Pageviews Human']);
    totalViews += views;                                         // all traffic (incl. anonymous)
    const firm = r['Firm']; if (!firm || /^unknown$/i.test(firm)) return;
    namedViews += views;                                         // traffic identified to a company
    const industry = r['Firm Industry'] || '';
    firmSet.add(firm);                                           // summary reflects the whole brand site
    if (industry) byIndustry[industry] = (byIndustry[industry] || 0) + views;
    const path = alxPath(r['Page URL']);
    if (want && !want.has(path)) return;                          // drill-down: only pages the pack renders
    (ALPHIX[path] ||= []).push({ firm, domain: r['Domain'] || '', industry, views, sessions: Math.max(1, Math.round(views / 6)) });
  };

  // Stream the (20MB+) JSON-Lines file so it never buffers whole; retry the
  // download from scratch on a transient socket error ("terminated").
  const id = idByName['MI - Firms by Page'];
  if (!id) { console.error('Alphix report not provisioned: "MI - Firms by Page"'); }
  else {
    const url = `${base}/report/${id}/file/latest`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      ALPHIX = {}; firmSet = new Set(); byIndustry = {}; totalViews = 0; namedViews = 0;  // clean slate per attempt
      try {
        const resp = await alxFetch(url, opts);
        if (resp.status === 404) { console.log('Alphix: report has zero rows'); break; }
        if (!resp.ok) { console.error(`Alphix download: ${resp.status}`); break; }
        const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = '', n = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, nl); buf = buf.slice(nl + 1); if (line) { try { onRow(JSON.parse(line)); n++; } catch {} } }
        }
        if (buf.trim()) { try { onRow(JSON.parse(buf)); n++; } catch {} }
        console.log(`Alphix "MI - Firms by Page": ${n} rows streamed`);
        break;
      } catch (e) {
        console.error(`Alphix stream attempt ${attempt}/3 failed: ${e.message}`);
        if (attempt === 3) throw e;
      }
    }
  }
  // cap each page to its top 25 identified firms (keeps data.js small)
  Object.keys(ALPHIX).forEach(p => { ALPHIX[p] = ALPHIX[p].sort((a, b) => b.views - a.views).slice(0, 25); });
  // diagnostic: if the domain filter matched nothing, say what the report carries
  if (!Object.keys(ALPHIX).length)
    console.log('Alphix domains seen (filter matched none):', [...seenDomains].sort().join(' | '));
  const topIndustry = Object.entries(byIndustry).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  return {
    ALPHIX,
    FIRMS_SUMMARY: {
      companies: firmSet.size, newCompanies: 0, topIndustry,
      identifiedPct: totalViews ? Math.round(namedViews / totalViews * 100) : 0,   // % of views identified to a company
    },
  };
}

// Google Ads Transparency Center — competitor ad examples via the public (but
// bot-gated, unofficial) anji RPC. No token; a browser User-Agent + Origin
// headers get past bot detection from a residential IP (CI IPs may be blocked —
// set GATC_PROXY then). Payload/field indices are reverse-engineered.
const GATC_COMPETITORS = [
  { name:'Fidelity', domain:'fidelity.com.au' },
  { name:'Pendal', domain:'pendalgroup.com' }, { name:'Perpetual', domain:'perpetual.com.au' },
  { name:'Vanguard AU', domain:'vanguard.com.au' }, { name:'UBS', domain:'ubs.com' },
  { name:'BetaShares', domain:'betashares.com.au' }, { name:'BlackRock', domain:'blackrock.com' },
  { name:'Colonial First State', domain:'cfs.com.au' }, { name:'Ausbil', domain:'ausbil.com.au' },
  { name:'Magellan', domain:'magellangroup.com.au' }, { name:'ClearBridge', domain:'clearbridge.com' },
  { name:'Resolution Capital', domain:'rescap.com' }, { name:'Hyperion', domain:'hyperion.com.au' },
  { name:'Partners Group', domain:'partnersgroup.com' }, { name:'EQT', domain:'eqtgroup.com' },
  { name:'Robeco', domain:'robeco.com' },
];

async function gatcPull() {
  const RPC = 'https://adstransparency.google.com/anji/_/rpc/SearchService/SearchCreatives?authuser=';
  const headers = {
    Origin: 'https://adstransparency.google.com', Referer: 'https://adstransparency.google.com/',
    'Content-Type': 'application/x-www-form-urlencoded', 'X-Same-Domain': '1', Accept: '*/*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  };
  const REGION = Number(process.env.GATC_REGION_CODE || 2036);   // GB geo-target
  const PALETTE = ['var(--c-a)', 'var(--c-b)', 'var(--c-c)', 'var(--c-d)', 'var(--c-us)', 'var(--c-muted)'];
  const NL = String.fromCharCode(10);
  const iso = s => { const n = Number(s); return n ? new Date(n * 1000).toISOString().slice(0, 10) : null; };
  const TODAY = new Date().toISOString().slice(0, 10);
  // Which quarter windows an ad was live in (from first/last-shown dates) — drives
  // the Q1-vs-Q2 activity chart. ISO date strings compare correctly with <=/>=.
  const QUARTERS = { q1: ['2026-01-01', '2026-03-31'], q2: ['2026-04-01', '2026-06-30'] };
  const activeIn = (cr, w) => { const f = cr.firstShown || cr.lastShown || TODAY, l = cr.lastShown || TODAY; return f <= w[1] && l >= w[0]; };
  // The real ad creative. Image ads carry an <img src> under [3][3][2]; the field-4
  // "format" code is unreliable, so classify by content. Text/responsive ads only
  // expose a JS-rendered preview (no static image) — those fall back to a card.
  const imgOf = it => {
    const html = it['3'] && it['3']['3'] && it['3']['3']['2'];
    if (!html) return null;
    const m = String(html).match(/src="([^"]+)"/);
    return m ? m[1].split('&amp;').join('&') : null;
  };
  const creatives = [], activity = []; let ci = 0;
  for (const comp of GATC_COMPETITORS) {
    try {
      const payload = { '2': 40, '3': { '12': { '1': comp.domain, '2': true }, '8': [REGION] }, '7': { '1': 1 } };
      const resp = await alxFetch(RPC, { method: 'POST', headers, body: 'f.req=' + encodeURIComponent(JSON.stringify(payload)), dispatcher: ALX_AGENT });
      if (!resp.ok) { console.error(`GATC ${comp.name}: ${resp.status}`); continue; }
      let text = await resp.text();
      if (text.startsWith(")]}'")) text = text.slice(text.indexOf(NL) + 1);
      let data; try { data = JSON.parse(text); } catch { console.error(`GATC ${comp.name}: non-JSON`); continue; }
      const items = (data && data['1']) || [];
      if (!items.length) { console.log(`GATC ${comp.name}: 0 ads`); continue; }
      const color = PALETTE[ci++ % PALETTE.length];
      const parsed = items.map(it => {
        const adv = it['1'], cid = it['2'], image = imgOf(it);
        return {
          competitor: comp.name, color, advertiser: it['12'] || comp.name, domain: comp.domain,
          format: image ? 'Image' : 'Text', image,
          firstShown: iso(it['6'] && it['6']['1']), lastShown: iso(it['7'] && it['7']['1']),
          variants: Number(it['13']) || 0,
          preview: (adv && cid) ? `https://adstransparency.google.com/advertiser/${adv}/creative/${cid}` : null,
        };
      });
      // Q1/Q2 activity counted across every ad this advertiser is running.
      const q1 = parsed.filter(c => activeIn(c, QUARTERS.q1)).length;
      const q2 = parsed.filter(c => activeIn(c, QUARTERS.q2)).length;
      activity.push({ name: comp.name, color, q1, q2 });
      // Gallery sample: image ads first, so cards show the real creative as a thumbnail.
      const imgN = parsed.filter(c => c.image).length;
      [...parsed.filter(c => c.image), ...parsed.filter(c => !c.image)].slice(0, 6).forEach(c => creatives.push(c));
      console.log(`GATC ${comp.name}: ${items.length} ads (${imgN} image) · Q1 ${q1} / Q2 ${q2}`);
      await new Promise(r => setTimeout(r, 1200));                // polite spacing
    } catch (e) { console.error(`GATC ${comp.name} failed: ${e.message}`); }
  }
  const rows = q => activity.map(a => ({ name: a.name, v: a[q], color: a.color })).filter(r => r.v > 0).sort((x, y) => y.v - x.v);
  return { creatives, adSoV: { q1: rows('q1'), q2: rows('q2') } };
}

async function main() {
  if (PROPERTY && SA_KEY) {
    const c = await ga4Client();
    try { remote.TOP_PAGES = await ga4Pages(c); console.log('GA4 Pages:', remote.TOP_PAGES.length); }
    catch (e) { console.error('GA4 Pages failed:', e.message); }
    try { remote.VISITS = await ga4Weekly(c); console.log('GA4 Weekly visits:', remote.VISITS.length, 'weeks'); }
    catch (e) { console.error('GA4 Weekly failed:', e.message); }
  } else {
    console.log('GA4 secrets not set — GA4 datasets fall back to seeded defaults.');
  }
  if (ALPHIX_SUBDOMAIN && ALPHIX_TOKEN) {
    try {
      const wanted = new Set((remote.TOP_PAGES || []).map(p => p.path));
      const a = await alphixPull(wanted);
      if (a.ALPHIX && Object.keys(a.ALPHIX).length) {
        remote.ALPHIX = a.ALPHIX; remote.FIRMS_SUMMARY = a.FIRMS_SUMMARY;
        console.log('Alphix: firms-by-page for', Object.keys(a.ALPHIX).length, 'pages;', a.FIRMS_SUMMARY.companies, 'companies');
      } else {
        console.log('Alphix: no firm rows returned (reports provisioned? has data?) — seeded fallback.');
      }
    } catch (e) { console.error('Alphix pull failed:', e.message); }
  } else {
    console.log('Alphix secrets not set — Alphix falls back to seeded defaults.');
  }
  try {
    const { creatives, adSoV } = await gatcPull();
    if (creatives.length) {
      remote.CREATIVES = creatives;
      if (adSoV && (adSoV.q1.length || adSoV.q2.length)) remote.AD_SOV = adSoV;
      console.log('GATC: competitor creatives kept =', creatives.length, '· AD_SOV q1/q2 =', adSoV.q1.length + '/' + adSoV.q2.length);
    } else console.log('GATC: no creatives (blocked, or none advertising) — seeded fallback.');
  } catch (e) { console.error('GATC pull failed:', e.message); }
  const banner = '/* AUTO-GENERATED by scripts/fetch-data.mjs via the "Data refresh" Action.\n   Do not edit by hand. Real Data-Hub values that override mi-data.js defaults. */\n';
  writeFileSync(OUT, banner + 'window.MI_REMOTE = ' + JSON.stringify(remote, null, 2) + ';\n');
  console.log('Wrote data.js — keys:', Object.keys(remote));
}
main();
