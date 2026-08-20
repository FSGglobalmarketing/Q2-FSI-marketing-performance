/* ============================================================
   mi-app.js — renders the Global Marketing Impact Report.
   Fixed to Q2 2026 (Q1 comparison at chart level). No global
   selectors. Chart-level filters + layout toggles only.
   ============================================================ */
(function () {
  const D = window.MIDATA, C = window.MICHARTS;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const state = {
    sov: 'search',
    sovQ: 'q2',              // competitor-ad chart: which quarter is shown (slider)
    platform: 'google',      // competitor tabs: 'google' | 'linkedin' | 'press'
    pressQ: 'q2',            // press tab: which quarter of the Signal snapshot
    pressView: 'cards',     // press tab: 'cards' (coverage, shown first) | 'chart' (share of voice)
    pressComp: 'All',        // press cards: competitor filter
    semChannel: 'search',    // NA campaign SEM: 'search' | 'display'
    semBucket: 'All',        // ad-group bucket tab (single-select)
    seoScope: null,          // SEO rankings scope (country/strategy); defaults to first
    stTheme: 'All',          // search-terms theme filter
    liQ: 'q2',              // LinkedIn quarter slider
    liAud: 'seniority',      // audience breakdown tab
    liCat: 'All',            // post category filter
    formDim: 'seniority',   // form submissions breakdown tab
    emailDim: 'campaign',    // email engagement dimension (campaign/country/company)
    liGroup: 'All',          // LinkedIn ad-group tab (campaign id, or 'All')
    prospectDim: 'fund',    // slice the served prospects by 'fund' or 'date'
    prospectBucket: 'All',
    alphixRegion: 'all',
    alphixOpen: new Set(),   // expanded company rows
    comp: new Set(D.creatives().map(c => c.competitor)),   // competitors actually running ads
    fmt: new Set(D.FORMATS),
    pagesCountry: 'all',
    sempCountry: 'All',      // SEM (paid search): market/campaign filter (country)
    sempGroup: 'All',        // SEM: ad-group filter (plain-english topic)
    sempMetric: 'impr',      // SEM timeline metric: 'impr' | 'ctr'
  };

  const HUES = [12, 210, 160, 45, 275, 320, 95, 190];
  function avatarColor(name){ let h=0; for(const ch of name) h=(h*31+ch.charCodeAt(0))>>>0; return `oklch(0.58 0.12 ${HUES[h%HUES.length]})`; }
  function initials(name){ return name.split(/\s|\+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
  const pct1 = x => (x*100).toFixed(1)+'%';

  /* ---- Sales-pipeline matching: flag targeting companies (Alphix, email, forms)
     that appear as a live RFP/RFI opportunity in the Service Request pipeline
     (window.MI_PIPELINE, pipeline-data.js). Company names are matched on their
     distinctive tokens after corporate/geographic filler is stripped. ---- */
  const PIPE_STOP = new Set('the and of for group holdings holding plc inc incorporated llc ltd limited co company corp corporation gmbh ag sa spa pty llp lp fund funds asset assets management managers investment investments investing investors capital partners advisers advisors advisory consulting consultants services bank banking trust pension pensions retirement system board authority fondo global international worldwide national uk usa us australia australian asia asian pacific europe emea apac hk singapore germany deutschland canada'.split(' '));
  const PIPE_ALIAS = [[/hong ?kong.*shanghai.*bank|hongkong.*shanghai/, 'hsbc']];
  function pipeTokens(name){
    const s = (name||'').toLowerCase();
    const extra = []; PIPE_ALIAS.forEach(a=>{ if(a[0].test(s)) extra.push(a[1]); });
    const toks = s.replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(t=>t.length>1 && !PIPE_STOP.has(t));
    return [...new Set(toks.concat(extra))];
  }
  function pipelineMatches(name){
    const P = (typeof window!=='undefined' && window.MI_PIPELINE) || null;
    if(!P || !Array.isArray(P.opportunities)) return [];
    const ft = pipeTokens(name); if(!ft.length) return [];
    // Only flag this pack's own-brand opportunities (window.MI_BRAND). Falls back
    // to the whole pipeline if a pack doesn't declare a brand.
    const brand = (typeof window!=='undefined' && window.MI_BRAND) || '';
    const opps = brand ? P.opportunities.filter(o=>o.brand===brand) : P.opportunities;
    const fset = new Set(ft), out = [], seen = {};
    opps.forEach(o=>{
      const ot = pipeTokens(o.name); if(!ot.length) return;
      const oset = new Set(ot);
      const short = ft.length <= ot.length ? ft : ot;
      const longSet = ft.length <= ot.length ? oset : fset;
      if(short.every(t=>longSet.has(t)) && !seen[o.name]){ seen[o.name]=1; out.push(o); }
    });
    return out;
  }
  const PIPE_PIN = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1C5.24 1 3 3.24 3 6c0 3.6 5 8.5 5 8.5s5-4.9 5-8.5c0-2.76-2.24-5-5-5zm0 6.6A1.6 1.6 0 118 4.4a1.6 1.6 0 010 3.2z"/></svg>';
  function pipelineBadge(name){
    // Pins only open/live opportunities (active). Lost never gets a pin.
    const m = pipelineMatches(name).filter(o=>o.active); if(!m.length) return '';
    const hasOpen = m.some(o=>o.status==='open');
    const label = hasOpen ? 'Open opportunity' : 'Live mandate';
    const cls = hasOpen ? 'open' : 'live';
    const title = m.slice(0,8).map(o=>[o.capability,o.stage].filter(Boolean).join(' · ')).filter(Boolean).join(' | ').replace(/"/g,'&quot;');
    return ` <span class="pill pipe ${cls}" title="${title}">${PIPE_PIN}${label}</span>`;
  }
  if(typeof window!=='undefined') window.MI_pipelineBadge = pipelineBadge;

  /* ---------- Consistent, labelled filter rail (right, under the slider) ----------
     Collect each chart-card's filter controls (.seg / .chips) into one right-aligned
     stack placed just under the card head (where the Q1/Q2 slider lives), each with a
     "Filter by ..." label. Controls keep their data-role/id so renderers still find
     them. Idempotent; runs at init and is exposed for the lightbox clones. */
  function filterName(ctrl){
    const role = (ctrl.getAttribute('data-role') || ctrl.id || '').toLowerCase();
    if(role.indexOf('comp') === 0 || role.indexOf('comp-chips') > -1) return 'brand';
    if(role.indexOf('fmt') === 0 || role.indexOf('fmt-chips') > -1) return 'format';
    if(role.indexOf('plat') > -1) return 'platform';
    const a = (ctrl.getAttribute('aria-label') || '').toLowerCase();
    if(a === 'group by') return 'grouping';
    if(a === 'ad platform') return 'platform';
    return a || 'view';
  }
  function arrangeFilters(root){
    const scope = root || document;
    scope.querySelectorAll('.chart-card').forEach(card => {
      try {
        if(card.dataset.railed) return;
        const ctrls = [...card.querySelectorAll('.seg, .chips')].filter(c => !c.closest('.filter-rail'));
        if(!ctrls.length) return;
        card.dataset.railed = '1';
        const head = card.querySelector('.card-head, .p-controls');
        const rail = document.createElement('div'); rail.className = 'filter-rail';
        ctrls.forEach(c => {
          const grp = document.createElement('div'); grp.className = 'filter-group';
          const lbl = document.createElement('div'); lbl.className = 'filter-lbl';
          lbl.textContent = 'Filter by ' + filterName(c);
          grp.appendChild(lbl); grp.appendChild(c);
          rail.appendChild(grp);
        });
        if(head && head.parentNode === card) card.insertBefore(rail, head.nextSibling);
        else card.insertBefore(rail, card.firstChild);
      } catch(e){}
    });
  }
  if(typeof window!=='undefined') window.MI_arrangeFilters = arrangeFilters;

  /* ================= CONTENT BLOCK (summary + key results) ================= */
  // Split into lead (summary paragraphs) and KPIs (results grid) so a highlight
  // can put the copy on one page and the metrics on another.
  function contentLead(key){
    const d = D.CB[key]; if(!d) return '';
    const paras = (Array.isArray(d.summary) ? d.summary : [d.summary]).filter(Boolean);
    return paras.map(p=>`<p class="lead-sum" data-anim>${p}</p>`).join('');
  }
  function contentKpis(key){
    const d = D.CB[key]; if(!d || !d.results) return '';
    // r.d renders verbatim ("Past Antin · behind CIP"); r.b keeps the older
    // "vs X benchmark" phrasing for blocks that still use it.
    const sub = r => r.d ? `<span class="bench ${r.up?'pos':'neg'}">${r.d}</span>`
                 : r.b ? `<span class="bench ${r.up?'pos':'neg'}">vs ${r.b} benchmark</span>` : '';
    return `<div class="kr-grid" data-anim>${d.results.map(r=>`<div class="kr"><b>${r.v}</b><i>${r.l}</i>${sub(r)}</div>`).join('')}</div>`;
  }
  function contentBlock(key){ return contentLead(key) + contentKpis(key); }
  function renderContentBlocks(){
    $$('.cb-mount').forEach(m => m.innerHTML = contentBlock(m.dataset.cb));
    $$('[data-cb-lead]').forEach(m => m.innerHTML = contentLead(m.dataset.cbLead));
    $$('[data-cb-kpi]').forEach(m => m.innerHTML = contentKpis(m.dataset.cbKpi));
  }

  /* ===== FUNNEL-STAGE CARDS on divider pages (Goals / activities / results / focus) ===== */
  function stageBlock(s){
    if(!s) return '';
    const ul = (a, cls) => (a&&a.length) ? `<ul${cls?` class="${cls}"`:''}>${a.map(x=>`<li>${x}</li>`).join('')}</ul>` : '';
    const ol = a => (a&&a.length) ? `<ol>${a.map(x=>`<li>${x}</li>`).join('')}</ol>` : '';
    // Key results stay on the content pages — dividers show only Goals /
    // Marketing activities / Focus, small, under the big centred heading.
    // Forward-looking Focus lists use modern tick bullets, not discs.
    const cards = [];
    if(s.goals&&s.goals.length)           cards.push(`<div class="glass-card"><h4>Goals</h4>${ol(s.goals)}</div>`);
    if(s.activities&&s.activities.length) cards.push(`<div class="glass-card"><h4>Marketing activities</h4>${ul(s.activities)}</div>`);
    if(s.q2&&s.q2.length)                 cards.push(`<div class="glass-card"><h4>Focus for Q2</h4>${ul(s.q2,'ticks')}</div>`);
    if(s.q3&&s.q3.length)                 cards.push(`<div class="glass-card"><h4>Focus for Q3</h4>${ul(s.q3,'plus')}</div>`);
    return `<div class="stage-grid">${cards.join('')}</div>`;
  }
  // Injected by JS so no per-repo divider markup changes are needed: the stage
  // is derived from each divider's data-label ("Service & loyalty" -> serviceloyalty).
  function renderStages(){
    if(!D.STAGES) return;
    $$('.page.divider').forEach(sec => {
      const key = (sec.dataset.label||'').toLowerCase().replace(/[^a-z]/g,'');
      const st = D.STAGES[key]; if(!st) return;
      const inner = sec.querySelector('.page-inner'); if(!inner || inner.querySelector('.stage-mount')) return;
      sec.classList.add('has-stage');  // keep .center — big heading stays centred
      const mount = document.createElement('div');
      mount.className = 'stage-mount'; mount.setAttribute('data-anim','');
      inner.appendChild(mount);
      // A stage is either one section (renders directly) or a pill-map: an object
      // whose values are sections, keyed by the chapter's pill labels. For the
      // latter, the tax-pills become tabs that swap the Goals/Activities/Focus.
      const isSection = st.goals || st.activities || st.q2 || st.q3;
      if(isSection){ mount.innerHTML = stageBlock(st); return; }
      const pills = $$('.tax-pill', sec);
      const show = label => { mount.innerHTML = stageBlock(st[label]); pills.forEach(p => p.classList.toggle('on', p.textContent.trim() === label)); };
      let first = null;
      pills.forEach(p => {
        const label = p.textContent.trim();
        if(st[label]){ if(!first) first = label; p.classList.add('tab'); p.addEventListener('click', () => show(label)); }
      });
      show(first || Object.keys(st)[0]);
    });
  }

  /* ================= HERO SLIDER ================= */
  function heroSlider(){
    const track = $('#hs-track'); if(!track) return;
    const step = () => (track.querySelector('.hs-card')?.offsetWidth || 280) + 18;
    $$('.hs-arrow').forEach(b => b.onclick = () => track.scrollBy({ left: +b.dataset.dir * step(), behavior:'smooth' }));
  }

  /* ================= OVERVIEW ================= */
  function renderKPIs(){
    const el = $('#kpi-row');
    if(!el) return;
    el.innerHTML = D.HEADLINE.map(k=>`
      <div class="kpi" data-reveal>
        <b>${k.v}</b><div class="kl">${k.l}</div>
        <span class="kd ${k.up?'up':'down'}">${k.up?'▲':'▼'} ${k.d}</span>
      </div>`).join('');
  }

  /* ================= AWARENESS ================= */
  function renderSearchVisibility(el, opts){
    el = el || $('#search-visibility'); if(!el) return;
    const data = D.searchVisibility();
    if(window.echarts){ try { return echartsLines(el, data, [
      { key:'us', name:'Our brand', color:'var(--c-us)', us:true },
      { key:'peer', name:'Peer average', color:'#b6b0a3', dash:true },
    ], Object.assign({ height:230, pct:true }, opts)); } catch(e){ console.warn('echarts search-vis', e); } }
    C.lines(el, data, [{ key:'us', color:'var(--c-us)', us:true }, { key:'peer', color:'var(--c-muted)', dash:true }], { height:230, pct:true });
  }
  function renderSearchTable(){
    // Igneo dropped this slide; other brands still carry it, so guard the mount.
    const host = $('#search-table'); if(!host) return;
    const rows = D.SEARCH_QUERIES;
    host.innerHTML = `<table class="tbl"><thead><tr>
      <th>Search term</th><th class="num">Times shown</th><th class="num">Clicks</th><th class="num">Click rate</th><th class="num">Avg. position</th>
      </tr></thead><tbody>${rows.map(r=>`<tr>
        <td class="strong">${r.q}</td>
        <td class="num">${D.fmtInt(r.imp)}</td>
        <td class="num">${D.fmtInt(r.clicks)}</td>
        <td class="num">${pct1(r.ctr)}</td>
        <td class="num"><span class="pill ${r.pos<=5?'pos':''}">${r.pos.toFixed(1)}</span></td>
      </tr>`).join('')}</tbody></table>`;
  }

  /* --- SEO rankings: non-branded keywords on pages 1–3, us vs the whole field,
     filtered by country (or strategy). One line per competitor over the tracked
     months; our brand is the accent line. Root-scoped so it survives the modal. --- */
  const SEO_PALETTE = ['#6b8cae','#c58a5a','#7fa67f','#a87f9e','#b0a06a','#5f9ea0','#9a8ca8',
                       '#c08497','#7d97b8','#b5a072','#8aa1a8','#a98f7a','#88a06e','#9e8fb0','#7bb0a2'];
  function seoData(){ return D.seoRankings ? D.seoRankings() : null; }
  function seoCards(){ return $$('[data-role="seo-chart"]').map(h=>h.closest('.chart-card')).filter(Boolean); }
  function currentSeoScope(){ const S=seoData(); if(!S) return null; return S.scopes.find(s=>s.key===state.seoScope) || S.scopes[0]; }
  function renderAllSeo(){ seoCards().forEach(card=>{ renderSeoTabs(card); renderSeoChart(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function renderSeoTabs(card){
    const S=seoData(); if(!S) return;
    if(!S.scopes.some(s=>s.key===state.seoScope)) state.seoScope = S.scopes[0].key;
    const host = card.querySelector('[data-role="seo-scope"]');
    if(host){
      host.innerHTML = S.scopes.map(s=>`<button class="${state.seoScope===s.key?'on':''}" data-scope="${s.key}">${s.label}</button>`).join('');
      host.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.seoScope=b.dataset.scope; renderAllSeo(); });
    }
    const note = card.querySelector('[data-role="seo-note"]');
    if(note){ const sc=currentSeoScope(); const us=sc&&sc.series.find(x=>x.us);
      note.innerHTML = us
        ? `<strong>${us.name}</strong> ranks <strong>${us.data[us.data.length-1]}</strong> non-branded keywords on pages 1–3 in ${sc.label}, tracked against ${sc.series.length-1} competitors.`
        : `Non-branded keywords ranking on pages 1–3, us versus the field.`;
    }
  }
  function renderSeoChart(card){
    const S=seoData(); if(!S) return;
    const el = card.querySelector('[data-role="seo-chart"]'); if(!el || !window.echarts) return;
    const sc = currentSeoScope(); if(!sc) return;
    const dark = echDark(el), t = echAxis(dark), modal = !!card.closest('.lb-scroll');
    const cUs = chartColor('--c-us','#ff5424');
    // The three paragraphs of section copy above this eat vertical room on a
    // laptop, and .page clips silently — shorter chart there, full in the modal.
    const inst = echInit(el, modal ? '62vh' : (window.innerHeight && window.innerHeight < 900 ? '132px' : '248px'));
    const series = sc.series.map((s,i)=>{
      const col = s.us ? cUs : SEO_PALETTE[i % SEO_PALETTE.length];
      return { name:s.name, type:'line', smooth:true, showSymbol:false, data:s.data, z: s.us?10:2,
        lineStyle:{ width: s.us?3.6:1.4, color:col, opacity: s.us?1:.8 },
        itemStyle:{ color:col }, emphasis:{ focus:'series' } };
    });
    inst.setOption({ animationDuration:450,
      grid:{ left:46, right:16, top:14, bottom: modal?96:82 },
      tooltip: Object.assign(echTipBase(dark), { trigger:'axis', order:'valueDesc',
        valueFormatter: v => Number(v).toLocaleString() }),
      legend:{ type:'scroll', bottom:0, itemWidth:14, itemHeight:8, pageIconColor:dark?'#cfcabb':'#6b6a63',
        pageTextStyle:{ color:dark?'#cfcabb':'#6b6a63' },
        textStyle:{ color:dark?'#cfcabb':'#3a3833', fontFamily:'IBM Plex Sans', fontSize:11.5 } },
      xAxis:{ type:'category', boundaryGap:false, data:S.months, axisTick:{show:false},
        axisLine:{lineStyle:{color:t.line}},
        axisLabel:{ color:t.label, fontFamily:'IBM Plex Mono', fontSize:10.5, interval: modal?0:2, hideOverlap:true } },
      yAxis:{ type:'value', splitLine:{lineStyle:{color:t.split}},
        axisLabel:{ color:t.label, fontFamily:'IBM Plex Mono', fontSize:11 } },
      series,
    }, true);
    inst.resize(); bindResize(el, inst); return inst;
  }
  // Combined competitor share of voice across the three channels we track:
  // Google ads (Ads Transparency), LinkedIn ads (Ad Library) and press mentions.
  // Raw counts are orders of magnitude apart (LinkedIn ads run to the thousands,
  // Google ads and press mentions to the tens), so each channel is normalised to
  // its own share of voice — a competitor's % of that channel's total. The three
  // per-channel shares are then EQUAL-WEIGHTED (each channel = 1/3), so a bar's
  // length is the competitor's share of the total peer group across the three
  // channels (all competitors sum to 100%), not the sum of channel shares.
  // The three channels label the same rival differently — Google's activity feed
  // says "Janus", LinkedIn "Janus Henderson", press "GAM" vs "GAM Investments" —
  // so fold every raw name onto its canonical COMPETITORS entry before summing,
  // else one rival splits into several stubby bars. Unknown names (a channel-only
  // advertiser like Fidelity on LinkedIn) pass through unchanged.
  function canonComp(raw){
    if(!raw) return null;
    const comps = (D.COMPETITORS||[]).map(c=>c.name).filter(Boolean);
    if(comps.includes(raw)) return raw;
    const low = raw.toLowerCase();
    let hit = comps.find(c => { const cl=c.toLowerCase(); return cl.startsWith(low) || low.startsWith(cl); });
    if(hit) return hit;
    const w = low.split(/\s+/)[0];
    hit = comps.find(c => c.toLowerCase().split(/\s+/)[0] === w);
    return hit || raw;
  }
  function combinedSoV(q){
    const acc = (arr, key) => { const m = {}; (arr||[]).forEach(r => { if(r.us) return; const n = canonComp(r.name); if(!n) return; m[n] = (m[n]||0) + (+r[key]||0); }); return m; };
    const g = acc(D.adSoV ? D.adSoV()[q] : [], 'v');
    const l = acc(D.liActivity ? D.liActivity() : [], 'v');
    const sum = o => Object.values(o).reduce((a,b)=>a+b,0);
    const gSum = sum(g), lSum = sum(l), gT = gSum||1, lT = lSum||1;
    const names = new Set([...Object.keys(g), ...Object.keys(l)]);
    // Google + LinkedIn ads only (press is excluded — it lives in its own press-
    // coverage widget). Weight equally across the channels that actually have
    // activity this quarter, so bars still sum to ~100% of the peer group when a
    // channel is silent (e.g. no competitor LinkedIn ad data this quarter).
    const NCH = ((gSum>0?1:0) + (lSum>0?1:0)) || 1;
    return [...names].map(n => {
      const gv=g[n]||0, lv=l[n]||0;
      return { name:n, g:gv, l:lv, gs:gv/gT/NCH*100, ls:lv/lT/NCH*100, total:(gv/gT+lv/lT)/NCH*100 };
    }).filter(r => r.g || r.l).sort((a,b) => b.total - a.total);
  }
  // The chart card carries a Q1/Q2 slider; Google and press shares move with it,
  // LinkedIn is a single Ad-Library snapshot so its segment is the same in both.
  function renderSoV(el, opts){
    el = el || $('#sov-chart'); if(!el) return;
    opts = opts || {};
    const q = opts.quarter || state.sovQ || 'q2';
    ensureSovSlider(el, q);
    let rows = combinedSoV(q);
    if(!rows.length){ el.innerHTML = '<p class="muted-txt" style="padding:20px 4px">No competitor activity recorded for this quarter.</p>'; return; }
    rows = rows.slice(0, opts.modal ? 20 : 12);
    if(window.echarts){ try { return echartsSoVStack(el, rows, Object.assign({ labelW: opts.modal?210:186 }, opts)); } catch(e){ console.warn('echarts sov', e); } }
    C.hbars(el, rows.map(r=>({ name:r.name, v:+r.total.toFixed(1), color:'var(--c-us)' })), { dark:true, labelW:120 });
  }
  function removeSovSlider(chartEl){
    const card = chartEl.closest('.chart-card, .card'); if(!card) return;
    const sl = card.querySelector('.chart-q-slider'); if(sl) sl.remove();
  }
  // A Q1<->Q2 slider mounted in the chart's card head. Rebuilt (not just synced)
  // whenever the live listeners are missing — e.g. the lightbox clones the card
  // DOM but not its event handlers, so the clone gets a freshly-wired slider.
  function ensureSovSlider(chartEl, q){
    const card = chartEl.closest('.chart-card, .card'); if(!card) return;
    const head = card.querySelector('.card-head'); if(!head) return;
    let sl = head.querySelector('.chart-q-slider');
    if(sl && sl._miWired){ syncQuarterSlider(sl, q); return; }
    if(sl) sl.remove();
    head.appendChild(buildQuarterSlider(q, nq => { state.sovQ = nq; renderSoV(chartEl, { quarter: nq }); }));
  }
  function buildQuarterSlider(q, onCommit){
    const sl = document.createElement('div'); sl.className = 'focus-slider chart-q-slider fs-anim';
    sl.innerHTML = `<button class="q-end ${q==='q1'?'on':''}" data-q="0">Q1</button>`
      + `<div class="fs-track"><div class="fs-fill"></div><div class="fs-handle"></div></div>`
      + `<button class="q-end ${q==='q2'?'on':''}" data-q="1">Q2</button>`;
    const track=sl.querySelector('.fs-track'), fill=sl.querySelector('.fs-fill'), handle=sl.querySelector('.fs-handle'), ends=[...sl.querySelectorAll('.q-end')];
    let cur = q==='q2'?1:0, drag=false;
    const paint = rt => { fill.style.width=(rt*100)+'%'; handle.style.left=(rt*100)+'%'; };
    const ratio = x => { const r=track.getBoundingClientRect(); return Math.max(0,Math.min(1,(x-r.left)/r.width)); };
    // Always fire onCommit, don't gate on the cached `cur`. When a widget owns
    // the quarter in `state` and re-renders itself, `cur` can drift out of sync
    // with that state — and the guard then silently swallows the click, leaving
    // the slider visually moved but the data unchanged. Re-committing the same
    // quarter is just a cheap redundant render.
    const commit = qq => { qq=qq?1:0; ends.forEach(e=>e.classList.toggle('on', +e.dataset.q===qq)); paint(qq);
      cur=qq; onCommit(qq?'q2':'q1'); };
    handle.addEventListener('pointerdown', e=>{ drag=true; sl.classList.remove('fs-anim'); handle.setPointerCapture(e.pointerId); e.preventDefault(); });
    handle.addEventListener('pointermove', e=>{ if(drag) paint(ratio(e.clientX)); });
    const endDrag = e=>{ if(!drag) return; drag=false; sl.classList.add('fs-anim'); commit(ratio(e.clientX)>0.5?1:0); };
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', ()=>{ if(drag){ drag=false; sl.classList.add('fs-anim'); paint(cur); } });
    track.addEventListener('click', e=>{ if(e.target!==handle) commit(ratio(e.clientX)>0.5?1:0); });
    ends.forEach(b=> b.onclick=()=> commit(+b.dataset.q));
    paint(cur);
    sl._miWired = true; sl._miPaint = paint; sl._miSetCur = v => { cur = v; };
    return sl;
  }
  /* --- LinkedIn channel: organic vs paid, audience, top posts ---
     Paid was dark in Q1 (NADIF relaunched in April), so Q1 shows organic only —
     that's the real shape of the channel, not a missing number. --- */
  function liData(){ return D.liChannel ? D.liChannel() : null; }
  function liQuarter(){ const L=liData(); if(!L) return null;
    return L.quarters.find(x=>x.key===state.liQ) || L.quarters[L.quarters.length-1]; }
  // generic quarter slider for any card (the SoV one is hard-wired to renderSoV)
  function ensureCardQuarterSlider(card, q, onCommit){
    // most cards head with .card-head; the competitor gallery uses .p-controls
    const head = card.querySelector('.card-head, .p-controls'); if(!head) return;
    let sl = head.querySelector('.chart-q-slider');
    if(sl && sl._miWired){ syncQuarterSlider(sl, q); return; }
    if(sl) sl.remove();
    head.appendChild(buildQuarterSlider(q, onCommit));
  }

  function liChannelCards(){ return $$('[data-role="lich-chart"]').map(h=>h.closest('.chart-card')).filter(Boolean); }
  function renderAllLiChannel(){ liChannelCards().forEach(renderLiChannel); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function renderLiChannel(card){
    const L=liData(); if(!L) return;
    const el = card.querySelector('[data-role="lich-chart"]'); if(!el) return;
    ensureCardQuarterSlider(card, state.liQ, nq => { state.liQ = nq; renderAllLiChannel(); });
    const Q = liQuarter(); if(!Q) return;
    const pct = (c,i) => i ? (c/i*100) : 0;
    const rows = [
      { name:'Organic', impr:Q.organic.i, clicks:Q.organic.c },
      { name:'Paid',    impr:Q.paid.i,    clicks:Q.paid.c },
    ];
    const note = card.querySelector('[data-role="lich-note"]');
    if(note){
      note.innerHTML = Q.paid.i
        ? `<strong>${Q.label}</strong>: organic reached ${Q.organic.i.toLocaleString()} at <strong>${pct(Q.organic.c,Q.organic.i).toFixed(2)}% CTR</strong>; paid reached ${Q.paid.i.toLocaleString()} at ${pct(Q.paid.c,Q.paid.i).toFixed(2)}%. Organic converts attention <strong>${(pct(Q.organic.c,Q.organic.i)/pct(Q.paid.c,Q.paid.i)).toFixed(1)}×</strong> harder; paid buys the reach.`
        : `<strong>${Q.label}</strong>: organic only. ${Q.organic.i.toLocaleString()} impressions at <strong>${pct(Q.organic.c,Q.organic.i).toFixed(2)}% CTR</strong>. No paid ran this quarter.`;
    }
    const tipRows = r => `Impressions ${r.impr.toLocaleString()}<br/>Clicks ${r.clicks.toLocaleString()}<br/>CTR ${pct(r.clicks,r.impr).toFixed(2)}%`;
    if(window.echarts){ try { echartsStackedHBars(el, rows, { labelW:96, rowH:44, hitName:'Clicks', tipRows }); }
      catch(e){ console.warn('li-channel', e); } }
  }

  function liAudCards(){ return $$('[data-role="liaud-chart"]').map(h=>h.closest('.chart-card')).filter(Boolean); }
  function renderAllLiAudience(){ liAudCards().forEach(card=>{ renderLiAudTabs(card); renderLiAudChart(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function liAudKeys(){ const L=liData(); return L && L.audience ? Object.keys(L.audience) : []; }
  function renderLiAudTabs(card){
    const L=liData(); if(!L||!L.audience) return;
    const keys=liAudKeys(); if(!keys.includes(state.liAud)) state.liAud=keys[0];
    const host=card.querySelector('[data-role="liaud-tabs"]');
    if(host){
      host.innerHTML = keys.map(k=>`<button class="${state.liAud===k?'on':''}" data-aud="${k}">${L.audience[k].label}</button>`).join('');
      host.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.liAud=b.dataset.aud; renderAllLiAudience(); });
    }
    const note=card.querySelector('[data-role="liaud-note"]');
    if(note) note.innerHTML = `Who follows the page: <strong>${(L.followers||0).toLocaleString()}</strong> followers, broken down by ${(L.audience[state.liAud]||{}).label.toLowerCase()}.`;
  }
  function renderLiAudChart(card){
    const L=liData(); if(!L||!L.audience) return;
    const el=card.querySelector('[data-role="liaud-chart"]'); if(!el) return;
    const seg=L.audience[state.liAud]; if(!seg) return;
    const rows=seg.rows.map(r=>({ name:r.n, v:r.v, color:'var(--c-us)' }));
    if(window.echarts){ try { echartsHBars(el, rows, { labelW:150, rowH:30, valUnit:' followers' }); }
      catch(e){ console.warn('li-aud', e); } }
  }

  /* --- Form submissions: enquiries by role, function and source. Aggregate
     only — no names or emails are published. --- */
  function formCards(){ return $$('[data-role="form-chart"]').map(h=>h.closest('.chart-card')).filter(Boolean); }
  function renderAllForms(){ formCards().forEach(card=>{ renderFormTabs(card); renderFormChart(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function renderFormTabs(card){
    const F = D.forms ? D.forms() : null; if(!F) return;
    const keys = Object.keys(F.dims);
    if(!keys.includes(state.formDim)) state.formDim = keys[0];
    const host = card.querySelector('[data-role="form-tabs"]');
    if(host){
      host.innerHTML = keys.map(k=>`<button class="${state.formDim===k?'on':''}" data-dim="${k}">${F.dims[k].label}</button>`).join('');
      host.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.formDim=b.dataset.dim; renderAllForms(); });
    }
    const note = card.querySelector('[data-role="form-note"]');
    if(note) note.innerHTML = `<strong>${F.total}</strong> enquiries came through our website and landing pages this quarter, split by ${F.dims[state.formDim].label.toLowerCase()}. Aggregate only, no personal details are published.`;
  }
  function renderFormChart(card){
    const F = D.forms ? D.forms() : null; if(!F) return;
    const el = card.querySelector('[data-role="form-chart"]'); if(!el) return;
    const seg = F.dims[state.formDim]; if(!seg) return;
    const rows = seg.rows.map(r=>({ name:r.n, v:r.v, color:'var(--c-us)' }));
    if(window.echarts){ try { echartsHBars(el, rows, { labelW:210, rowH:32, valUnit:' enquiries' }); }
      catch(e){ console.warn('forms', e); } }
  }

  function liPostCards(){ return $$('[data-role="lipost-grid"]').map(h=>h.closest('.chart-card')).filter(Boolean); }
  function renderAllLiPosts(){ liPostCards().forEach(card=>{ renderLiPostTabs(card); renderLiPosts(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function liPostList(){ const L=liData(); if(!L||!L.posts) return [];
    const list = L.posts[state.liQ] || [];
    return state.liCat==='All' ? list : list.filter(p=>p.cat===state.liCat); }
  function renderLiPostTabs(card){
    const L=liData(); if(!L||!L.posts) return;
    const list = L.posts[state.liQ] || [];
    const cats = ['All'].concat([...new Set(list.map(p=>p.cat))]);
    if(!cats.includes(state.liCat)) state.liCat='All';
    ensureCardQuarterSlider(card, state.liQ, nq => { state.liQ=nq; state.liCat='All'; renderAllLiPosts(); renderAllLiChannel(); });
    const host=card.querySelector('[data-role="lipost-tabs"]');
    if(host){
      host.innerHTML = cats.map(c=>`<button class="${state.liCat===c?'on':''}" data-cat="${c}">${c}</button>`).join('');
      host.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.liCat=b.dataset.cat; renderAllLiPosts(); });
    }
    const note=card.querySelector('[data-role="lipost-note"]');
    if(note){ const sel=liPostList(); const im=sel.reduce((t,p)=>t+p.i,0);
      note.innerHTML = `Top posts in <strong>${state.liQ.toUpperCase()} 2026</strong>${state.liCat==='All'?'':` · ${state.liCat}`}: ${sel.length} posts, ${im.toLocaleString()} impressions.`; }
  }
  function renderLiPosts(card){
    const host=card.querySelector('[data-role="lipost-grid"]'); if(!host) return;
    const esc=s=>String(s||'').replace(/"/g,'&quot;');
    const escT=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const list=liPostList();
    host.className='slide-scroll creative-grid';
    if(!list.length){ host.innerHTML='<p class="muted-txt">No posts in that category.</p>'; return; }
    // Q1 baseline is the real Q1 post set, filtered to the same category so the
    // comparison is like-for-like. Viewing Q1 itself leaves the rule off.
    const L=liData();
    const q1src = (state.liQ==='q1' ? [] : ((L&&L.posts&&L.posts.q1)||[]))
      .filter(p=> state.liCat==='All' || p.cat===state.liCat);
    const mean = k => q1src.length ? q1src.reduce((a,p)=>a+(p[k]||0),0)/q1src.length : 0;
    const q1avg = { n:q1src.length, i:mean('i'), c:mean('c'), l:mean('l') };
    // scale bars to the largest value on screen OR the Q1 rule, so the rule
    // never falls off the end of the track
    const peak = k => Math.max(...list.map(p=>p[k]||0), q1avg[k]||0);
    const max = { i:peak('i'), c:peak('c'), l:peak('l') };
    host.innerHTML=list.map(p=>{
      const ctr=p.i?(p.c/p.i*100).toFixed(2):'0.00';
      const thumb = p.img
        ? `<div class="creative-thumb has-img"><span class="fmt">${esc(p.cat)}</span><img src="li-posts/${esc(p.img)}" alt="${esc(p.cat)} post" loading="lazy" onerror="this.closest('.creative-thumb').classList.remove('has-img');this.remove()"><span class="ph">${esc(p.cat)}</span></div>`
        : `<div class="creative-thumb"><span class="fmt">${esc(p.cat)}</span><span class="ph">${esc(p.mt||'post')}</span></div>`;
      // Bar is scaled across the posts on screen; the dashed rule is the Q1
      // average for the same metric, so "beat last quarter" is readable without
      // holding two numbers in your head.
      const bar = (v, avg, max) => {
        if(!max) return '';
        const pct = Math.max(2, Math.min(100, v / max * 100));
        const ref = avg ? Math.min(100, avg / max * 100) : null;
        return `<div class="mbar"><i style="width:${pct.toFixed(1)}%"></i>${
          ref === null ? '' : `<u style="left:${ref.toFixed(1)}%" title="Q1 average ${Math.round(avg).toLocaleString()}"></u>`}</div>`;
      };
      return `<div class="creative">${thumb}
        <p class="creative-copy" title="${esc(p.t)}">${escT(p.t)}</p>
        <div class="creative-meta">
          <div class="mrow"><span>Impressions</span><span class="mono">${p.i.toLocaleString()}</span></div>
          ${bar(p.i, q1avg.i, max.i)}
          <div class="mrow"><span>Clicks</span><span class="mono">${p.c.toLocaleString()} · ${ctr}%</span></div>
          ${bar(p.c, q1avg.c, max.c)}
          <div class="mrow"><span>Reactions</span><span class="mono">${p.l.toLocaleString()}</span></div>
          ${bar(p.l, q1avg.l, max.l)}
        </div></div>`;
    }).join('');
    const legend = host.parentElement && host.parentElement.querySelector('[data-role="lipost-legend"]');
    if(legend) legend.innerHTML = q1avg.n
      ? `<span class="muted-txt" style="font-size:12px">Bars compare posts on screen; the dashed rule is the Q1 average (${Math.round(q1avg.i).toLocaleString()} impressions, ${Math.round(q1avg.c).toLocaleString()} clicks, ${Math.round(q1avg.l).toLocaleString()} reactions).</span>`
      : '';
  }

  function syncQuarterSlider(sl, q){
    const qq = q==='q2'?1:0;
    sl.querySelectorAll('.q-end').forEach(e=> e.classList.toggle('on', +e.dataset.q===qq));
    if(sl._miPaint) sl._miPaint(qq); if(sl._miSetCur) sl._miSetCur(qq);
  }
  // Creative feed for the currently-selected ad platform.
  function currentCreatives(){ return state.platform === 'linkedin' ? D.liCreatives() : D.creatives(); }
  // Distinct competitors that are actually running ads (from the creatives feed).
  function creativeComps(){
    const seen = new Map();
    currentCreatives().forEach(c => { if(!seen.has(c.competitor)) seen.set(c.competitor, c.color || 'var(--c-muted)'); });
    return [...seen].map(([name, color]) => ({ name, color }));
  }
  // The competitor-ads gallery can be mounted twice — on the page and cloned into
  // the lightbox — so every render/wire is scoped to a card root (found by
  // data-role, since the modal strips ids). renderAll keeps both in sync.
  function creativeCards(){ return $$('[data-role="creatives"]').map(h => h.closest('.chart-card')).filter(Boolean); }
  function renderAllCreatives(){ creativeCards().forEach(card => { renderCompChips(card); renderCreatives(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function renderCompChips(card){
    card = card || creativeCards()[0]; if(!card) return;
    const compHost = card.querySelector('[data-role="comp-chips"]'), fmtHost = card.querySelector('[data-role="fmt-chips"]');
    if(state.platform === 'press'){
      // Share of voice ranks every rival at once (nothing to filter); the card
      // view is a feed, so it gets a competitor filter like the ad galleries.
      if(compHost){
        const arts = D.pressArticles ? D.pressArticles() : [];
        compHost.innerHTML = state.pressView !== 'cards' ? '' :
          ['All', ...new Set(arts.map(a=>a.c))].map(n=>{
            const col = n==='All' ? 'var(--c-us)' : ((D.COMPETITORS.find(c=>c.name===n)||{}).color || 'var(--c-muted)');
            const cnt = n==='All' ? arts.length : arts.filter(a=>a.c===n).length;
            return `<button class="chip ${state.pressComp===n?'on':'off'}" data-pcomp="${n}"><span class="dot" style="background:${col}"></span>${n} ${cnt}</button>`;
          }).join('');
        compHost.querySelectorAll('.chip').forEach(b=> b.onclick=()=>{ state.pressComp=b.dataset.pcomp; renderAllCreatives(); });
      }
      if(fmtHost){
        fmtHost.innerHTML = ['chart','cards'].map(v=>
          `<button class="chip ${state.pressView===v?'on':'off'}" data-pview="${v}">${v==='chart'?'Share of voice':'Coverage'}</button>`).join('');
        fmtHost.querySelectorAll('.chip').forEach(b=> b.onclick=()=>{ state.pressView=b.dataset.pview; renderAllCreatives(); });
      }
      return;
    }
    if(compHost){
      compHost.innerHTML = creativeComps().map(c=>`<button class="chip ${state.comp.has(c.name)?'on':'off'}" data-comp="${c.name}"><span class="dot" style="background:${c.color}"></span>${c.name}</button>`).join('');
      compHost.querySelectorAll('.chip').forEach(b=> b.onclick=()=>{ const n=b.dataset.comp; state.comp.has(n)?state.comp.delete(n):state.comp.add(n); if(!state.comp.size)state.comp.add(n); renderAllCreatives(); });
    }
    // LinkedIn shows theme-screened example ads (with copy), so the format filter is Google-only.
    if(fmtHost){
      fmtHost.innerHTML = state.platform==='linkedin' ? '' : D.FORMATS.map(f=>`<button class="chip ${state.fmt.has(f)?'on':'off'}" data-fmt="${f}">${f}</button>`).join('');
      fmtHost.querySelectorAll('.chip').forEach(b=> b.onclick=()=>{ const n=b.dataset.fmt; state.fmt.has(n)?state.fmt.delete(n):state.fmt.add(n); if(!state.fmt.size)state.fmt.add(n); renderAllCreatives(); });
    }
  }
  // Press is competitor share-of-voice, not ad creatives — same tab strip, a
  // different shape of answer. Total mentions per rival with the positive slice
  // called out; the full sentiment split rides in the tooltip.
  // Coverage cards. No screenshot and no outbound link — Signal's search response
  // carries neither, and its one URL is a per-user gated reader link. So the card
  // leads on what we do have: the headline, who ran it, and how it read.
  function renderPressCards(card, host){
    // brands without a press snapshot get the honest empty state, not a crash
    const arts = D.pressArticles ? D.pressArticles() : [];
    if(!arts.length){ host.className=''; host.innerHTML = `<p class="muted-txt">No press coverage is wired into this pack yet.</p>`; return; }
    const escT = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const compColor = n => (D.COMPETITORS.find(c=>c.name===n)||{}).color || 'var(--c-muted)';
    const sentPill = m => m==='positive' ? 'pos' : m==='negative' ? 'neg' : '';
    const list = state.pressComp==='All' ? arts : arts.filter(a=>a.c===state.pressComp);
    host.className='slide-scroll creative-grid'; host.style.padding='';
    // Coverage is a curated sample of genuine editorial pieces on the same strategy
    // topics as the share-of-voice chart, so the biggest names by volume will not
    // always carry the most examples. Say so rather than leave it looking uneven.
    const covNote = state.pressComp==='All'
      ? `<p class="muted-txt" style="grid-column:1/-1;font-size:12.5px;margin:0 0 2px">These are genuine editorial pieces on the tracked peer set, scoped to the same strategy topics as the share-of-voice chart. It is a curated sample, so the largest names by volume will not always carry the most examples.</p>`
      : '';
    host.innerHTML = covNote + list.map(a=>`<div class="creative news-card">
        <div class="creative-body">
          <div class="adv"><span class="swatch" style="background:${compColor(a.c)}"></span>${escT(a.c)}</div>
          <p class="news-head">${escT(a.t)}</p>
          <div class="news-meta">
            <span class="mono">${escT(a.s)}</span><span class="muted"> · ${escT(a.y)} · ${a.d}</span>
          </div>
          <div class="news-chips">
            <span class="pill ${sentPill(a.m)}">${a.m}</span>
            ${(a.k||[]).map(k=>`<span class="pill">${escT(k)}</span>`).join('')}
          </div>
          ${a.u?`<a class="creative-link" href="${escT(a.u)}" target="_blank" rel="noopener">Read the coverage ↗</a>`:''}
        </div>
      </div>`).join('');
  }
  function renderPress(card){
    const host = card.querySelector('[data-role="creatives"]'); if(!host) return;
    // Coverage cards span the whole tracked window on purpose — Q2 alone yields
    // only 8 in-context articles, so the quarter slider belongs to the chart.
    if(state.pressView === 'cards'){
      const sl0 = card.querySelector('.chart-q-slider'); if(sl0) sl0.remove();
      return renderPressCards(card, host);
    }
    ensureCardQuarterSlider(card, state.pressQ, nq => { state.pressQ = nq; renderAllCreatives(); });
    const rows = D.press ? D.press(state.pressQ) : [];
    if(!rows.length){
      host.className=''; host.style.padding='';
      host.innerHTML = `<p class="muted-txt">No press data for that quarter.</p>`;
      return;
    }
    host.className='slide-scroll'; host.style.padding='6px 14px';
    // Share of voice is scoped to our strategy topics (not raw press volume), so
    // each peer is sized by its relevant coverage rather than its total newsflow.
    host.innerHTML = `<p class="muted-txt" style="font-size:12.5px;margin:0 0 10px">Share of voice counts only mentions on our strategy topics, not total press volume, so each peer is sized by its relevant coverage rather than its overall newsflow.</p>
      <div class="chart-wrap" data-role="press-chart"></div>`;
    const el = host.querySelector('[data-role="press-chart"]');
    if(!el || !window.echarts) return;
    const modal = !!card.closest('.lb-scroll');
    const sorted = rows.slice().sort((a,b)=>(b.total||0)-(a.total||0));
    const top = sorted.slice(0, modal?22:14);
    // our own brand must never fall off the chart — the bigger BrightEdge peer
    // sets (RQI 19 rows, FSI 25) push it below the cap, so swap it in last.
    const usRow = sorted.find(r=>r.us);
    if(usRow && !top.includes(usRow)) top[top.length-1] = usRow;
    const bars = top
      .map(r=>({ name:r.name, impr:r.total||0, clicks:r.positive||0,
                 _p:r.positive||0, _n:r.neutral||0, _g:r.negative||0 }));
    const tipRows = r => { const pct = r.impr ? (r._p/r.impr*100).toFixed(0) : '0';
      return `Mentions ${r.impr.toLocaleString()}<br/>Positive ${r._p.toLocaleString()} (${pct}%)<br/>Neutral ${r._n.toLocaleString()}<br/>Negative ${r._g.toLocaleString()}`; };
    try { echartsStackedHBars(el, bars, { labelW: modal?280:214, hitName:'Positive', tipRows, modal }); }
    catch(e){ console.warn('press', e); }
  }
  function renderCreatives(card){
    card = card || creativeCards()[0]; if(!card) return;
    const host = card.querySelector('[data-role="creatives"]'); if(!host) return;
    if(state.platform === 'press') return renderPress(card);
    // the quarter slider belongs to Press only — drop it when we leave that tab
    const sl = card.querySelector('.chart-q-slider'); if(sl) sl.remove();
    const li = state.platform === 'linkedin';
    // The Google feed is "live adverts right now", so drop creatives that stopped
    // before the report quarter (e.g. rivals who ran only in Q1) — that is what
    // made a rival with zero Q2 activity still show stale ad examples. LinkedIn is
    // theme-screened separately, so it keeps its own scoping.
    const liveThisQuarter = c => !c.lastShown || c.lastShown >= '2026-04-01';
    const list = currentCreatives().filter(c=> state.comp.has(c.competitor) && (li || (state.fmt.has(c.format) && liveThisQuarter(c))));
    if(!list.length){ host.className=''; host.innerHTML = `<p class="muted-txt">No adverts match those filters.</p>`; return; }
    const dash = '<span class="muted">–</span>';
    // Name the destination — "View ad" gave no clue these open Google's public
    // Ads Transparency Centre, which is where the provenance for this data lives.
    const linkLabel = li ? 'View on LinkedIn ↗' : 'View in Ads Transparency Centre ↗';
    const view = c => c.preview ? `<a class="creative-link" href="${c.preview}" target="_blank" rel="noopener">${linkLabel}</a>` : '';
    const esc = s => String(s||'').replace(/"/g,'&quot;');
    const escT = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    // Real ad creative as the thumbnail; if it 404s later, onerror reveals the
    // format placeholder instead. LinkedIn creatives are theme-screened examples.
    const thumb = c => { const badge = li ? 'LinkedIn' : (c.format||'Ad');
      return c.image
      ? `<div class="creative-thumb has-img"><span class="fmt">${badge}</span><img src="${esc(c.image)}" alt="${esc(c.advertiser||c.competitor)} ad" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.creative-thumb').classList.remove('has-img');this.remove()"><span class="ph">${badge} ad</span></div>`
      : `<div class="creative-thumb"><span class="fmt">${badge}</span><span class="ph">${badge} ad</span></div>`; };
    // "Variations" was the raw Ads-Transparency field and read as jargon. Days
    // running is the same intel in plain English: how long they've kept it live.
    const daysRunning = c => {
      if(!c.firstShown || !c.lastShown) return null;
      const a = Date.parse(c.firstShown), b = Date.parse(c.lastShown);
      if(isNaN(a) || isNaN(b)) return null;
      return Math.max(1, Math.round((b - a) / 86400000));
    };
    const metaRows = c => {
      const d = daysRunning(c);
      return `<div class="mrow"><span>Advertiser</span><span class="mono" title="${esc(c.advertiser||'')}">${c.advertiser||c.competitor}</span></div>
       <div class="mrow"><span>First seen</span><span class="mono">${c.firstShown||dash}</span></div>
       <div class="mrow"><span>Last seen</span><span class="mono">${c.lastShown||dash}</span></div>
       <div class="mrow"><span>Days running</span><span class="mono">${d ? d.toLocaleString() : dash}</span></div>`;
    };
    host.className='slide-scroll creative-grid'; host.style.padding='';
    host.innerHTML = list.map(c=> li
        ? `<div class="creative">
            ${thumb(c)}
            <div class="creative-body">
              <div class="adv"><span class="swatch" style="background:${c.color}"></span>${c.competitor}</div>
              <div class="li-entity mono" title="${esc(c.advertiser||'')}">${c.advertiser||c.competitor}</div>
              ${c.copy ? `<div class="creative-copy">${escT(c.copy)}</div>` : ''}
              ${view(c)}
            </div>
          </div>`
        : `<div class="creative">
            ${thumb(c)}
            <div class="creative-body">
              <div class="adv"><span class="swatch" style="background:${c.color}"></span>${c.competitor}</div>
              <div class="meta">${metaRows(c)}</div>
              ${view(c)}
            </div>
          </div>`).join('');
  }

  /* ================= HIGHLIGHTS (campaign features, own datasets) ================= */
  // Goals + Marketing-activities cards for a highlight page (reuses the divider
  // .glass-card look). Mounted via [data-hl="<key>"].
  function renderHighlightCards(){
    $$('[data-hl]').forEach(mount => {
      // Igneo supplies a dedicated HIGHLIGHTS entry; other packs keep the same
      // goals/activities on the CB block, so fall back to that.
      const h = (D.HIGHLIGHTS && D.HIGHLIGHTS[mount.dataset.hl]) || (D.CB && D.CB[mount.dataset.hl]); if(!h) return;
      const li = a => a.map(x=>`<li>${x}</li>`).join('');
      // Takeaway boxes — rendered only when the highlight supplies the copy.
      const box = (title, cls, marker, arr) =>
        `<div class="hl-box ${cls}"><h4>${title}</h4><ul class="${marker}">${li(arr)}</ul></div>`;
      const takeaways = [];
      if(h.keyResults && h.keyResults.length)           takeaways.push(box('Key results','is-results','ticks', h.keyResults));
      if(h.recommendations && h.recommendations.length) takeaways.push(box('Recommendations','is-recs','arrows', h.recommendations));
      mount.innerHTML =
        `<div class="stage-grid">
        <div class="glass-card"><h4>Goals</h4><ol>${li(h.goals)}</ol></div>
        <div class="glass-card"><h4>Marketing activities</h4><ul>${li(h.activities)}</ul></div>
      </div>` +
        // Key results + Recommendations report on those objectives, so they sit below.
        (takeaways.length ? `<div class="hl-boxes">${takeaways.join('')}</div>` : '');
    });
  }
  // ---- SEM (search + display). Root-scoped (page + lightbox clone). Channel
  // toggle, non-technical ad-group buckets, and bars that stack clicks INSIDE
  // impressions so each bar reads as reach + how much of it clicked (CTR).
  function semCards(){ return $$('[data-role="sem-chart"]').map(h => h.closest('.chart-card')).filter(Boolean); }
  function renderAllSem(){ semCards().forEach(card => { renderSemChips(card); renderSemGallery(card); renderSemChart(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function semRows(modal){
    const S = D.HIGHLIGHTS.naCampaign.sem;
    // Display is a responsive display ad: the images are shown in the gallery, so
    // the bars rank the COPY assets — which headline/description earned the clicks.
    if(state.semChannel === 'display'){
      const cap = modal ? 10 : 6;
      return (S.displayCopy||[]).slice(0, cap).map(r=>({
        name: r.x.length>42 ? r.x.slice(0,41)+'…' : r.x,
        impr: r.i, clicks: r.c, _t: r.t, _full: r.x,
      }));
    }
    const kw = state.semBucket === 'All' ? S.keywords : S.keywords.filter(r => r.b === state.semBucket);
    return kw.slice().sort((a,b)=>b.i-a.i).slice(0,12).map(r=>({ name:r.k, impr:r.i, clicks:r.c }));
  }
  // The display creatives themselves — same card treatment as the LinkedIn ads.
  function renderSemGallery(card){
    const host = card.querySelector('[data-role="sem-gallery"]'); if(!host) return;
    const disp = state.semChannel === 'display';
    host.style.display = disp ? '' : 'none';
    if(!disp){ host.innerHTML = ''; return; }
    const ads = (D.HIGHLIGHTS.naCampaign.sem.displayAds) || [];
    const esc = s => String(s||'').replace(/"/g,'&quot;');
    host.className = 'slide-scroll creative-grid';
    host.innerHTML = ads.map(a=>{
      const ctr = a.i ? (a.c/a.i*100).toFixed(2) : '0.00';
      return `<div class="creative">
        <div class="creative-thumb has-img"><span class="fmt">${esc(a.fmt)}</span>
          <img src="display-ads/${esc(a.file)}.jpg" alt="Igneo display ad, ${esc(a.fmt)}" loading="lazy"
               onerror="this.closest('.creative-thumb').classList.remove('has-img');this.remove()">
          <span class="ph">${esc(a.fmt)}</span></div>
        <div class="creative-meta">
          <div class="mrow"><span>Served at</span><span class="mono">${a.w}&times;${a.h}</span></div>
          <div class="mrow"><span>Impressions</span><span class="mono">${a.i.toLocaleString()}</span></div>
          <div class="mrow"><span>Clicks</span><span class="mono">${a.c.toLocaleString()} · ${ctr}%</span></div>
        </div>
      </div>`;
    }).join('');
  }
  function renderSemChips(card){
    card = card || semCards()[0]; if(!card) return;
    const disp = state.semChannel === 'display';
    const host = card.querySelector('[data-role="sem-buckets"]');
    if(host){
      host.style.display = disp ? 'none' : '';   // buckets are a search-only filter
      const tabs = ['All'].concat(D.HIGHLIGHTS.naCampaign.sem.buckets);
      host.innerHTML = disp ? '' : tabs.map(b=>`<button class="${state.semBucket===b?'on':''}" data-bkt="${b}">${b}</button>`).join('');
      host.querySelectorAll('button').forEach(btn => btn.onclick = () => { state.semBucket = btn.dataset.bkt; renderAllSem(); });
    }
    $$('[data-role="sem-channel"] button').forEach(b => b.classList.toggle('on', b.dataset.ch === state.semChannel));
    const note = card.querySelector('[data-role="sem-note"]'); if(note) note.style.display = disp ? '' : 'none';
    const sub = card.querySelector('[data-role="sem-sub"]');
    if(sub) sub.textContent = disp
      ? 'One responsive display ad: Google mixes these two images with six headlines and five descriptions. 271,631 impressions at 3.43% CTR for £1,081. Bars rank the copy that earned the clicks.'
      : 'Keywords by impressions, with clicks stacked inside the bar. 51,646 impressions at 6.89% CTR.';
  }
  function renderSemChart(card, opts){
    card = card || semCards()[0]; if(!card) return;
    const el = card.querySelector('[data-role="sem-chart"]'); if(!el) return;
    const modal = !!(opts && opts.modal);
    const rows = semRows(modal);
    if(!rows.length){ el.innerHTML = '<p class="muted-txt" style="padding:20px 4px">No keywords match those filters.</p>'; return; }
    const disp = state.semChannel === 'display';
    const o = Object.assign({ labelW: disp ? 300 : 230 }, opts);
    if(disp) o.tipRows = r => `${r._t}<br/>${r._full}<br/>Impressions ${Number(r.impr).toLocaleString()}<br/>Clicks ${Number(r.clicks).toLocaleString()}<br/>CTR ${(r.clicks/r.impr*100).toFixed(2)}%`;
    if(window.echarts){ try { return echartsStackedHBars(el, rows, o); } catch(e){ console.warn('sem', e); } }
  }
  function wireSem(card){
    if(!card) return;
    card.querySelectorAll('[data-role="sem-channel"] button').forEach(b => b.onclick = () => { state.semChannel = b.dataset.ch; renderAllSem(); });
  }

  /* --- What people actually typed: the real search queries that triggered our
     ads, themed and ranked. The story: data centres dominate and a big slice is
     retail intent (stocks/reits), not the institutional LPs NADIF wants. --- */
  function stData(){ const s = D.HIGHLIGHTS && D.HIGHLIGHTS.naCampaign && D.HIGHLIGHTS.naCampaign.sem; return s && s.searchTerms; }
  function stCards(){ return $$('[data-role="st-chart"]').map(h=>h.closest('.chart-card')).filter(Boolean); }
  function renderAllSearchTerms(){ stCards().forEach(card=>{ renderStTabs(card); renderStChart(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function stRows(theme){
    const S = stData(); if(!S) return [];
    const list = theme === 'All' ? S.terms : S.terms.filter(t=>t.b===theme);
    return list.slice().sort((a,b)=>b.i-a.i);
  }
  function renderStTabs(card){
    const S = stData(); if(!S) return;
    const tabs = ['All'].concat(S.themes);
    if(!tabs.includes(state.stTheme)) state.stTheme = 'All';
    const host = card.querySelector('[data-role="st-tabs"]');
    if(host){
      host.innerHTML = tabs.map(t=>`<button class="${state.stTheme===t?'on':''}" data-th="${t}">${t}</button>`).join('');
      host.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.stTheme=b.dataset.th; renderAllSearchTerms(); });
    }
    const note = card.querySelector('[data-role="st-note"]');
    if(note){
      note.innerHTML = state.stTheme === 'All'
        ? `2,400 distinct queries actually triggered our ads. <strong>Data centres are 56%</strong> of them, and 40% carry retail intent (“stocks”, “reits”, “etf”), not the institutional buyers NADIF targets. Brand terms are tiny but convert at <strong>26% CTR</strong>.`
        : `Real queries in “${state.stTheme}”, ranked by impressions with clicks stacked inside.`;
    }
  }
  function renderStChart(card, opts){
    const el = card.querySelector('[data-role="st-chart"]'); if(!el) return;
    const modal = !!(opts && opts.modal);
    const rows = stRows(state.stTheme).slice(0, modal?16:12).map(t=>({ name:t.k, impr:t.i, clicks:t.c }));
    if(!rows.length){ el.innerHTML = '<p class="muted-txt" style="padding:20px 4px">No queries in that theme.</p>'; return; }
    if(window.echarts){ try { return echartsStackedHBars(el, rows, Object.assign({ labelW: modal?330:250 }, opts)); } catch(e){ console.warn('searchterms', e); } }
  }

  /* --- Paid search (SEM) performance: account-wide Google Ads search from the
     google-search-ads feed (window.MI_SEM). A Q1-vs-Q2 weekly timeline
     (impressions or CTR), country and ad-group filters, and one horizontal bar
     per ad — impressions with clicks stacked inside, so each bar reads as reach
     and how much of it clicked (CTR). Each bar's tooltip links to that
     advertiser's live ads in Google's public Ads Transparency Center. Self-
     guarding: packs without MI_SEM or the section simply no-op, so the shared
     bundle stays byte-identical across all four brands. --- */
  function semPerfCards(){ return $$('[data-role="semp-chart"]').map(h=>h.closest('.chart-card')).filter(Boolean); }
  function sempCountries(){ const m={}; (window.MI_SEM.ads||[]).forEach(a=>{ m[a.country]=(m[a.country]||0)+a.impr; }); return Object.keys(m).sort((a,b)=>m[b]-m[a]); }
  function sempGroups(country){ const out=[], seen={}; (window.MI_SEM.ads||[]).filter(a=>country==='All'||a.country===country).slice().sort((a,b)=>b.impr-a.impr).forEach(a=>{ if(!seen[a.topic]){ seen[a.topic]=1; out.push(a.topic); } }); return out; }
  function sempSingle(){ return state.sempCountry!=='All' || sempCountries().length<=1; }
  function sempAds(){ const c=state.sempCountry, g=state.sempGroup;
    return (window.MI_SEM.ads||[]).filter(a=>(c==='All'||a.country===c)&&(g==='All'||a.topic===g)).slice().sort((x,y)=>y.impr-x.impr); }
  const SEMP_MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // The two quarters overlay on one axis by week-of-quarter; label each tick with
  // the Q2 (current-quarter) week-start date so the x-axis reads as calendar dates.
  function sempWkLabel(wk){ const d=new Date(2026,3,1); d.setDate(d.getDate()+(wk-1)*7); return d.getDate()+' '+SEMP_MON[d.getMonth()]; }
  function sempWeeks(metric){
    const T=window.MI_SEM.timeline||{}, idx=arr=>{ const m={}; (arr||[]).forEach(r=>m[r.wk]=r); return m; };
    const q1=idx(T.q1), q2=idx(T.q2);
    const val=r=>!r?undefined:(metric==='ctr'?(r.impr?+(r.clk/r.impr*100).toFixed(2):undefined):r.impr);
    const rows=[]; for(let w=1;w<=13;w++) rows.push({ label:sempWkLabel(w), q1:val(q1[w]), q2:val(q2[w]) }); return rows;
  }
  function renderSempCard(card, opts){ renderSempFilters(card); renderSempTimeline(card, opts); renderSempBars(card, opts); }
  function renderAllSemPerf(){
    if(!window.MI_SEM) return;
    semPerfCards().forEach(card=>{ renderSempCard(card, card.closest('.lb-scroll')?{modal:true}:undefined); });
    if(window.MI_fitCarousels) window.MI_fitCarousels();
  }
  function renderSempFilters(card){
    const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    const countries=sempCountries();
    const crow=card.querySelector('[data-role="semp-country"]');
    if(crow){
      if(countries.length<=1){ crow.style.display='none'; state.sempCountry='All'; }
      else { crow.style.display='';
        const tabs=['All'].concat(countries);
        if(!tabs.includes(state.sempCountry)) state.sempCountry='All';
        crow.innerHTML=tabs.map(c=>`<button class="${state.sempCountry===c?'on':''}" data-c="${esc(c)}">${c==='All'?'All markets':esc(c)}</button>`).join('');
        crow.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.sempCountry=b.dataset.c; state.sempGroup='All'; renderAllSemPerf(); });
      }
    }
    const grow=card.querySelector('[data-role="semp-group"]');
    if(grow){
      const groups=sempGroups(state.sempCountry);
      if(!groups.includes(state.sempGroup)) state.sempGroup='All';
      const tabs=['All'].concat(groups);
      grow.innerHTML=tabs.map(g=>`<button class="${state.sempGroup===g?'on':''}" data-g="${esc(g)}">${g==='All'?'All ad groups':esc(g)}</button>`).join('');
      grow.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.sempGroup=b.dataset.g; renderAllSemPerf(); });
    }
  }
  function renderSempTimeline(card, opts){
    const el=card.querySelector('[data-role="semp-timeline"]'); if(!el) return;
    const metric=state.sempMetric||'impr';
    const hasQ1=(((window.MI_SEM.timeline||{}).q1)||[]).length>0;
    const rows=sempWeeks(metric);
    const keys=[];
    if(hasQ1) keys.push({ key:'q1', name:'Q1', color:'#b6b0a3', dash:true });
    keys.push({ key:'q2', name:'Q2', color:'var(--c-us)', us:true });
    if(window.echarts){ try { echartsLines(el, rows, keys, { height:206, pct: metric==='ctr', modal: !!(opts&&opts.modal) }); } catch(e){ console.warn('semp-tl', e); } }
    card.querySelectorAll('[data-role="semp-metric"] button').forEach(b=>{ b.classList.toggle('on', b.dataset.m===metric); b.onclick=()=>{ state.sempMetric=b.dataset.m; renderAllSemPerf(); }; });
    const lg=card.querySelector('[data-role="semp-legend"]');
    if(lg){ const key=(c,d,t)=>`<span style="display:inline-flex;align-items:center;gap:6px;margin-left:16px;font:600 11px/1 'IBM Plex Mono',monospace;opacity:.85"><i style="display:inline-block;width:18px;height:0;border-top:${d?'2px dashed':'3px solid'} ${c}"></i>${t}</span>`;
      lg.innerHTML=(hasQ1?key('#b6b0a3',true,'Q1'):'')+key('var(--c-us)',false,'Q2'); }
    const note=card.querySelector('[data-role="semp-tl-note"]');
    if(note) note.textContent = hasQ1 ? '' : 'Paid search launched in Q2; there was no Q1 activity.';
  }
  function renderSempBars(card, opts){
    const el=card.querySelector('[data-role="semp-chart"]'); if(!el) return;
    const modal=!!(opts&&opts.modal), cnt=card.querySelector('[data-role="semp-count"]');
    // No per-ad URL exists in the feed, and the Transparency Center's per-country
    // filter drops campaigns once they end — so the live-ads link opens the
    // advertiser's full set of currently-live ads (region=anywhere). Bars are not
    // click-through: the card is click-to-expand, so a per-bar handler would fight
    // the lightbox.
    const dom=window.MI_SEM.domain||'';
    const tvURL=dom?'https://adstransparency.google.com/?region=anywhere&domain='+encodeURIComponent(dom):'';
    const live=card.querySelector('[data-role="semp-live"]');
    if(live) live.innerHTML = tvURL ? `<a href="${tvURL}" target="_blank" rel="noopener" style="color:var(--c-us);font-weight:600;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.28);padding-bottom:1px">See these ads running live in Google's Ads Transparency Center &#8599;</a>` : '';
    const list=sempAds();
    if(!list.length){ el.innerHTML='<p class="muted-txt" style="padding:20px 4px">No ads match those filters.</p>'; if(cnt) cnt.textContent=''; return; }
    const single=sempSingle(), cap=modal?24:14;
    const trunc=s=>s.length>40?s.slice(0,39)+'…':s;
    const rows=list.slice(0,cap).map(a=>({ name: trunc(single?a.topic:(a.country+' · '+a.topic)), impr:a.impr, clicks:a.clk, _a:a }));
    const cs=sempCountries(), scope = state.sempCountry!=='All' ? ` in ${state.sempCountry}` : (cs.length===1 ? ` in ${cs[0]}` : ' across all markets');
    if(cnt) cnt.textContent = `Showing ${Math.min(list.length,cap)} of ${list.length} ads`+scope+(state.sempGroup!=='All'?`  ·  ${state.sempGroup}`:'');
    const tipRows=r=>{ const a=r._a, ctr=a.impr?(a.clk/a.impr*100).toFixed(2):'0.00';
      return `${a.country} &middot; ${a.type} search${a.lang==='Chinese'?' &middot; Chinese ad':''}<br/>Impressions ${a.impr.toLocaleString()}<br/>Clicks ${a.clk.toLocaleString()}<br/>CTR ${ctr}%`; };
    if(window.echarts){ try {
      return echartsStackedHBars(el, rows, Object.assign({ labelW: single?(modal?236:200):(modal?312:262), rowH:30, tipRows, modal }, opts));
    } catch(e){ console.warn('semp-bars', e); } }
  }
  // LinkedIn reach against the real SF pipeline — same stacked treatment as SEM
  // (bar = impressions served, clicks stacked inside).
  /* --- prospect targeting: slice the served list by fund or decision date --- */
  // 327 served firms is far too many to read, so the chart is always a top-N of
  // whichever bucket is selected. Fund/date come from the Salesforce opportunity
  // list, matched on company name — hence the "Unmatched"/"Unknown" buckets.
  const PROSPECT_DIMS = { fund:'Fund', date:'Decision date' };
  function prospectCards(){ return $$('[data-role="prospect-buckets"]').map(h => h.closest('.chart-card')).filter(Boolean); }
  function renderAllProspects(){
    prospectCards().forEach(card => {
      renderProspectTabs(card);
      const el = card.querySelector('[data-chart="na-audience"]');
      if(el) renderNaAudience(el, card.closest('.lb-scroll') ? { modal:true } : undefined);
    });
    if(window.MI_fitCarousels) window.MI_fitCarousels();
  }
  function prospectBuckets(){
    const P = D.HIGHLIGHTS.naCampaign.liProspects;
    const key = state.prospectDim === 'date' ? 'd' : 'f';
    const seen = [...new Set(P.top.map(r => r[key]))];
    // Fund: biggest first. Date: chronological, with the catch-alls last.
    const tail = ['Unmatched','Unknown'];
    const real = seen.filter(b => !tail.includes(b));
    if(state.prospectDim === 'date') real.sort();
    else real.sort((a,b) => P.top.filter(r=>r.f===b).length - P.top.filter(r=>r.f===a).length);
    return ['All'].concat(real, seen.filter(b => tail.includes(b)));
  }
  function prospectRows(){
    const P = D.HIGHLIGHTS.naCampaign.liProspects;
    const key = state.prospectDim === 'date' ? 'd' : 'f';
    const list = state.prospectBucket === 'All' ? P.top : P.top.filter(r => r[key] === state.prospectBucket);
    return list.slice().sort((a,b) => b.i - a.i);
  }
  function renderProspectTabs(card){
    const host = card.querySelector('[data-role="prospect-buckets"]'); if(!host) return;
    const buckets = prospectBuckets();
    if(!buckets.includes(state.prospectBucket)) state.prospectBucket = 'All';
    host.innerHTML = buckets.map(b => {
      const n = b === 'All' ? D.HIGHLIGHTS.naCampaign.liProspects.top.length : prospectCount(b);
      return `<button class="${state.prospectBucket===b?'on':''}" data-bkt="${b}">${b} <span class="muted">${n}</span></button>`;
    }).join('');
    host.querySelectorAll('button').forEach(b => b.onclick = () => { state.prospectBucket = b.dataset.bkt; renderAllProspects(); });
    card.querySelectorAll('[data-role="prospect-dim"] button').forEach(b => {
      b.classList.toggle('on', b.dataset.dim === state.prospectDim);
      b.onclick = () => { state.prospectDim = b.dataset.dim; state.prospectBucket = 'All'; renderAllProspects(); };
    });
  }
  function prospectCount(b){
    const P = D.HIGHLIGHTS.naCampaign.liProspects;
    const key = state.prospectDim === 'date' ? 'd' : 'f';
    return P.top.filter(r => r[key] === b).length;
  }

  function renderNaAudience(el, opts){
    el = el || $('#na-audience'); if(!el) return;
    const P = D.HIGHLIGHTS.naCampaign.liProspects;
    const card = el.closest('.chart-card');
    const sub = card && card.querySelector('[data-role="prospect-sub"]');
    const modal = !!(opts && opts.modal);
    const cap = modal ? 20 : 12;
    const sel = prospectRows();
    const spill = Math.round(P.reach.spillImpr / P.reach.impr * 100);
    if(sub){
      const scope = state.prospectBucket === 'All'
        ? `all <strong>${P.served}</strong> firms we served`
        : `the <strong>${sel.length}</strong> in <strong>${state.prospectBucket}</strong>`;
      sub.innerHTML = `Our Salesforce pipeline, uploaded to LinkedIn as the <strong>${P.list}</strong> list: ${P.served} of ${P.prospects}`
        + ` matched prospects served, ${P.impr.toLocaleString()} impressions, ${P.engaged} of them clicking or watching.`
        + ` The spend landed where it was aimed: <strong>${100-spill}%</strong> of delivery went to this list and no competitor was served.`
        + `<br/>Showing the top ${Math.min(cap, sel.length)} of ${scope}, ${sel.reduce((t,r)=>t+r.i,0).toLocaleString()} impressions. Paid metrics only.`;
    }
    // Bar = paid impressions; the accent segment = engagements (clicks + video
    // views), so the story is "reached, and actually watched/clicked".
    const all = sel.map(r=>({ name:r.k, impr:r.i, clicks:(r.c||0)+(r.v||0), _c:r.c||0, _v:r.v||0, _f:r.f, _d:r.d }));
    // Only the top rows fit — a fixed page clips silently rather than scroll.
    const rows = all.slice(0, cap);
    const tipRows = r => {
      const rate = r.impr ? (r.clicks/r.impr*100).toFixed(1) : '0.0';
      return `Impressions ${Number(r.impr).toLocaleString()}<br/>Video views ${r._v.toLocaleString()}`
        + `<br/>Clicks ${r._c.toLocaleString()}<br/>Engagement rate ${rate}%`
        + `<br/>Fund ${r._f}<br/>Decision ${r._d}`;
    };
    if(window.echarts){ try { return echartsStackedHBars(el, rows, Object.assign({ labelW:230, hitName:'Engagements', tipRows }, opts)); } catch(e){ console.warn('na-prospects', e); } }
  }
  /* --- our own LinkedIn ads: ad-group tabs + the creatives that ran --- */
  // Root-scoped like the SEM/competitor widgets so it survives the lightbox clone.
  function liAdCards(){ return $$('[data-role="liads"]').map(h => h.closest('.chart-card')).filter(Boolean); }
  function renderAllLiAds(){ liAdCards().forEach(card => { renderLiAdTabs(card); renderLiAds(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function liAdRows(){
    const A = D.HIGHLIGHTS.naCampaign.liAds;
    const list = state.liGroup === 'All' ? A.ads : A.ads.filter(a => a.g === state.liGroup);
    return list.slice().sort((a,b)=>b.i-a.i);
  }
  function renderLiAdTabs(card){
    const host = card.querySelector('[data-role="liads-tabs"]'); if(!host) return;
    const A = D.HIGHLIGHTS.naCampaign.liAds;
    const tabs = [{ id:'All', name:'All ads' }].concat(A.groups.map(g=>({ id:g.id, name:g.name })));
    host.innerHTML = tabs.map(t=>`<button class="${state.liGroup===t.id?'on':''}" data-grp="${t.id}">${t.name}</button>`).join('');
    host.querySelectorAll('button').forEach(b => b.onclick = () => { state.liGroup = b.dataset.grp; renderAllLiAds(); });
    const sub = card.querySelector('[data-role="liads-sub"]');
    if(sub){
      const g = A.groups.find(x=>x.id===state.liGroup);
      sub.textContent = g
        ? `${g.name}: ${g.impr.toLocaleString()} impressions and ${g.clicks.toLocaleString()} clicks (${(g.clicks/g.impr*100).toFixed(2)}% CTR) for £${g.spend.toLocaleString()}.`
        : '';
    }
  }
  function renderLiAds(card){
    const host = card.querySelector('[data-role="liads"]'); if(!host) return;
    const esc = s => String(s||'').replace(/"/g,'&quot;');
    const escT = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const list = liAdRows();
    // Same bar treatment as the organic post cards — but paid was dark in Q1, so
    // there is no prior-quarter baseline. The dashed rule is the average of the
    // ads on screen instead: which creatives pull above their weight.
    const mean = k => list.length ? list.reduce((s,a)=>s+(a[k]||0),0)/list.length : 0;
    const avg = { i:mean('i'), c:mean('c') };
    const peak = k => Math.max(...list.map(a=>a[k]||0), avg[k]||0);
    const max = { i:peak('i'), c:peak('c') };
    const bar = (v, av, mx) => {
      if(!mx) return '';
      const pct = Math.max(2, Math.min(100, v / mx * 100));
      const ref = av ? Math.min(100, av / mx * 100) : null;
      return `<div class="mbar"><i style="width:${pct.toFixed(1)}%"></i>${
        ref === null ? '' : `<u style="left:${ref.toFixed(1)}%" title="Average of ads shown ${Math.round(av).toLocaleString()}"></u>`}</div>`;
    };
    host.className = 'slide-scroll creative-grid';
    host.innerHTML = list.map(a=>{
      const ctr = a.i ? (a.c/a.i*100).toFixed(2) : '0.00';
      const badge = a.t === 'video' ? 'Video' : 'Static';
      return `<div class="creative">
        <div class="creative-thumb has-img"><span class="fmt">${badge}</span>
          <img src="own-ads/${esc(a.id)}.jpg" alt="${esc(a.h)}" loading="lazy"
               onerror="this.closest('.creative-thumb').classList.remove('has-img');this.remove()">
          <span class="ph">${badge}</span></div>
        <p class="creative-copy" title="${esc(a.copy)}">${escT(a.copy)}</p>
        <div class="creative-meta">
          <div class="mrow"><span>Headline</span><span class="mono" title="${esc(a.h)}">${escT(a.h)}</span></div>
          <div class="mrow"><span>Impressions</span><span class="mono">${a.i.toLocaleString()}</span></div>
          ${bar(a.i, avg.i, max.i)}
          <div class="mrow"><span>Clicks</span><span class="mono">${a.c.toLocaleString()} · ${ctr}%</span></div>
          ${bar(a.c, avg.c, max.c)}
          ${a.wave?`<div class="mrow"><span>Wave</span><span class="mono">${a.wave}</span></div>`:''}
        </div>
      </div>`;
    }).join('');
    const legend = card.querySelector('[data-role="liads-legend"]');
    if(legend) legend.innerHTML = list.length
      ? `<span class="muted-txt" style="font-size:12px">Bars compare the ads shown; the dashed rule is their average (${Math.round(avg.i).toLocaleString()} impressions, ${Math.round(avg.c).toLocaleString()} clicks).</span>`
      : '';
  }

  function renderRiChapters(el, opts){
    el = el || $('#ri-chapters'); if(!el) return;
    const rows = D.HIGHLIGHTS.riReport.chapters.map(r=>({ label:r.name, v:r.v }));
    if(window.echarts){ try { return echartsBars(el, rows, Object.assign({ height: opts&&opts.modal?undefined:330 }, opts)); } catch(e){ console.warn('ri-chapters', e); } }
    C.bars(el, rows.map(s=>({ ...s, color:'var(--c-us)' })), { height:330 });
  }
  function renderRiCompanies(el, opts){
    el = el || $('#ri-companies'); if(!el) return;
    const rows = D.HIGHLIGHTS.riReport.companies.slice(0,10).map(r=>({ name:r.name, v:r.v, color:'var(--c-a)' }));
    if(window.echarts){ try { return echartsHBars(el, rows, Object.assign({ labelW:190, valUnit:' clicks', rowH:42 }, opts)); } catch(e){ console.warn('ri-companies', e); } }
    C.hbars(el, rows, { dark:true, labelW:180 });
  }
  // Website report requests: a bar chart by relationship to the firm + the list of
  // requesting companies (with a relationship tag). Igneo-only mount.
  function renderRiRequests(el, opts){
    el = el || $('#ri-requests'); if(!el) return;
    const R = D.HIGHLIGHTS && D.HIGHLIGHTS.riReport && D.HIGHLIGHTS.riReport.requests; if(!R) return;
    const esc0 = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const byRel = (R.byRel||[]).slice().sort((a,b)=>a.v-b.v);   // ascending -> largest bar on top
    const cos = {}; (R.companies||[]).forEach(c=>{ (cos[c.r]=cos[c.r]||[]).push(c.n); });
    const relColor = n => n==='Open Opportunity' ? '#e0a020' : n==='Competitor' ? '#c2543a' : chartColor('--c-a','#3b82f6');
    if(!window.echarts){ if(typeof C!=='undefined' && C.hbars) C.hbars(el, byRel.map(r=>({ name:r.name, v:r.v, color:'var(--c-a)' })), { dark:true, labelW:150 }); return; }
    const dark = echDark(el);
    const inst = echInit(el, opts&&opts.modal?'56vh':((byRel.length*30)+30)+'px');
    inst.setOption({ animationDuration:450,
      grid:{ left:150, right:56, top:6, bottom:6 },
      tooltip: Object.assign(echTipBase(dark), { trigger:'axis', axisPointer:{ type:'shadow' },
        formatter: p => { const r=p[0], list=cos[r.name]||[]; return `<b>${esc0(r.name)}</b> · ${r.value} request${r.value===1?'':'s'}<br/><span style="opacity:.72">${list.map(esc0).join('<br/>')}</span>`; } }),
      xAxis:{ type:'value', show:false, max:'dataMax' },
      yAxis:{ type:'category', data:byRel.map(r=>r.name), axisTick:{show:false}, axisLine:{show:false},
              axisLabel:{ color:dark?'#dcd7cc':'#1c1b18', fontFamily:'IBM Plex Sans', fontSize:12.5 } },
      series:[{ type:'bar', barWidth:15, data:byRel.map(r=>({ value:r.v, itemStyle:{ color:relColor(r.name), borderRadius:[0,7,7,0] } })),
        label:{ show:true, position:'right', color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Mono', fontSize:12 } }],
    });
    inst.resize(); bindResize(el, inst); return inst;
  }
  // RI email click-to-open by fund (2024-2026): grouped horizontal bars with two
  // dashed benchmark lines (industry + our historic average) named in the legend.
  function renderRiCto(el, opts){
    el = el || $('#ri-cto'); if(!el) return;
    const R = D.HIGHLIGHTS && D.HIGHLIGHTS.riReport && D.HIGHLIGHTS.riReport.cto; if(!R || !window.echarts) return;
    const dark = echDark(el), ax = echAxis(dark), funds = R.funds||[];
    const inst = echInit(el, opts&&opts.modal?'58vh':((funds.length*46)+66)+'px');
    const c24='#f3c9a9', c25='#ef7d4e', c26='#3a9bd8', cInd='#9a948a', cHist='#e0442a';
    const mk = (key,name,color) => ({ name, type:'bar', data:funds.map(f=>+f[key]||0), barCategoryGap:'34%', itemStyle:{ color } });
    inst.setOption({ animationDuration:450,
      legend:{ show:true, top:0, left:'center', itemWidth:16, itemHeight:10, itemGap:14,
        textStyle:{ color:dark?'#cfcabc':'#57534a', fontFamily:'IBM Plex Sans', fontSize:11 },
        data:['CTO 2024','CTO 2025','CTO 2026','Industry benchmark','Our historic average'] },
      grid:{ left:118, right:38, top:40, bottom:28 },
      tooltip: Object.assign(echTipBase(dark), { trigger:'axis', axisPointer:{ type:'shadow' }, valueFormatter:v=>v+'%' }),
      xAxis:{ type:'value', max:40, axisLabel:{ color:ax.label, formatter:'{value}%', fontFamily:'IBM Plex Mono', fontSize:11 }, splitLine:{ lineStyle:{ color:ax.split } } },
      yAxis:{ type:'category', data:funds.map(f=>f.name), axisTick:{show:false}, axisLine:{ lineStyle:{ color:ax.line } },
              axisLabel:{ color:dark?'#dcd7cc':'#1c1b18', fontFamily:'IBM Plex Sans', fontSize:11.5 } },
      series:[
        mk('y2024','CTO 2024',c24),
        mk('y2025','CTO 2025',c25),
        Object.assign(mk('y2026','CTO 2026',c26), { markLine:{ symbol:'none', silent:true, label:{show:false}, data:[
          { xAxis:R.industry, lineStyle:{ color:cInd, type:'dashed', width:2 } },
          { xAxis:R.historic, lineStyle:{ color:cHist, type:'dashed', width:2 } },
        ] } }),
        { name:'Industry benchmark', type:'line', data:[], lineStyle:{ type:'dashed', color:cInd, width:2 }, itemStyle:{ color:cInd } },
        { name:'Our historic average', type:'line', data:[], lineStyle:{ type:'dashed', color:cHist, width:2 }, itemStyle:{ color:cHist } },
      ],
    });
    inst.resize(); bindResize(el, inst); return inst;
  }

  /* ================= ENGAGEMENT ================= */
  const cssv = (n, fb) => { const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; };
  // ECharts' colour parser can't read oklch()/lab() CSS values, so its hover
  // (emphasis) state fails and the line/bar renders transparent. Rasterise any
  // CSS colour to a plain rgb() that ECharts can lighten/darken safely.
  function toRGB(color, fb){
    try { const cv=document.createElement('canvas'); cv.width=cv.height=1; const x=cv.getContext('2d');
      x.fillStyle = fb || '#888'; x.fillStyle = color; x.fillRect(0,0,1,1);
      const d = x.getImageData(0,0,1,1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})`;
    } catch(e){ return fb || color; }
  }
  const chartColor = (name, fb) => toRGB(cssv(name, fb), fb);
  function echartsVisits(el, data, opts){
    const dark = !!(el.closest('.page') && el.closest('.page').classList.contains('dark')) || !!el.closest('.lb-panel');
    const q = opts.quarter || 'q2';                      // which quarter is the emphasised (solid) line
    // three paragraphs of section copy sit above this on the website page, and
    // .page clips silently — shorter on laptop heights, full in the modal
    el.style.height = opts.modal ? '54vh' : (window.innerHeight && window.innerHeight < 900 ? '128px' : '240px');
    const inst = echarts.getInstanceByDom(el) || echarts.init(el, null, { renderer:'canvas' });
    const blue = chartColor('--c-a', '#3b82f6'), grey = '#b6b0a3';
    const dim = dark ? '#b3ada0' : '#8b877d', ink = dark ? '#f4f1ea' : '#1c1b18';
    const q2 = q === 'q2';
    inst.setOption({
      animationDuration: 450,
      grid: { left: 48, right: 18, top: 14, bottom: 26 },
      tooltip: echTip(dark, v => Number(v).toLocaleString()),
      xAxis: { type:'category', boundaryGap:false, data: (q2 ? data.map(d=>d.label) : data.map(d=>d.prevLabel||d.label)), axisTick:{ show:false },
               axisLine:{ lineStyle:{ color: dark?'rgba(255,255,255,.20)':'#d6d1c4' } },
               axisLabel:{ color: dim, fontFamily:'IBM Plex Mono', fontSize: 11 } },
      yAxis: { type:'value', splitLine:{ lineStyle:{ color: dark?'rgba(255,255,255,.10)':'#e4e0d6' } },
               axisLabel:{ color: dim, fontFamily:'IBM Plex Mono', fontSize: 11, formatter: v => v>=1000 ? (v/1000)+'k' : v } },
      series: [
        // "This quarter" = Q2; "Last quarter" = Q1. The slider chooses which is
        // the focus (solid, full opacity); the other dims to a faint reference.
        { name:'This quarter', type:'line', smooth:true, showSymbol:false, symbol:'circle', symbolSize:7, data: data.map(d=>d.sessions),
          lineStyle:{ width: q2?3.4:2, color: blue, type: q2?'solid':'dashed', opacity: q2?1:0.4 }, itemStyle:{ color: blue, opacity: q2?1:0.4 }, emphasis:{ focus:'none' }, z: q2?3:2 },
        { name:'Last quarter', type:'line', smooth:true, showSymbol:false, symbol:'circle', symbolSize:7, data: data.map(d=>d.prev),
          lineStyle:{ width: q2?2:3.4, color: grey, type: q2?'dashed':'solid', opacity: q2?0.4:1 }, itemStyle:{ color: grey, opacity: q2?0.4:1 }, emphasis:{ focus:'none' }, z: q2?2:3 },
      ],
    });
    inst.resize();
    if(!el._miResize){ el._miResize = true; window.addEventListener('resize', ()=>{ try{ inst.resize(); }catch(e){} }); }
    if(opts.modal) addVisitsSlider(el, q);
    return inst;
  }
  // Q1<->Q2 slider (reuses the objectives-page slider) — modal only
  function addVisitsSlider(chartEl, q){
    const card = chartEl.closest('.chart-card, .card'); if(!card) return;
    const head = card.querySelector('.card-head'); if(!head || head.querySelector('.chart-q-slider')) return;
    const sl = document.createElement('div'); sl.className = 'focus-slider chart-q-slider fs-anim';
    sl.innerHTML = `<button class="q-end ${q==='q1'?'on':''}" data-q="0">Q1</button>`
      + `<div class="fs-track"><div class="fs-fill"></div><div class="fs-handle"></div></div>`
      + `<button class="q-end ${q==='q2'?'on':''}" data-q="1">Q2</button>`;
    head.appendChild(sl);
    const track=sl.querySelector('.fs-track'), fill=sl.querySelector('.fs-fill'), handle=sl.querySelector('.fs-handle'), ends=[...sl.querySelectorAll('.q-end')];
    let cur = q==='q2'?1:0, drag=false;
    const paint = rt => { fill.style.width=(rt*100)+'%'; handle.style.left=(rt*100)+'%'; };
    const ratio = x => { const r=track.getBoundingClientRect(); return Math.max(0,Math.min(1,(x-r.left)/r.width)); };
    // snap to Q1/Q2, animate the handle, and only re-render when it actually changes
    const commit = qq => { qq=qq?1:0; ends.forEach(e=>e.classList.toggle('on', +e.dataset.q===qq)); paint(qq);
      if(qq!==cur){ cur=qq; renderVisitsChart(chartEl, { modal:true, quarter: qq?'q2':'q1' }); } };
    handle.addEventListener('pointerdown', e=>{ drag=true; sl.classList.remove('fs-anim'); handle.setPointerCapture(e.pointerId); e.preventDefault(); });
    handle.addEventListener('pointermove', e=>{ if(drag) paint(ratio(e.clientX)); });
    const endDrag = e=>{ if(!drag) return; drag=false; sl.classList.add('fs-anim'); commit(ratio(e.clientX)>0.5?1:0); };
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', ()=>{ if(drag){ drag=false; sl.classList.add('fs-anim'); paint(cur); } }); // never leave it stuck mid-track
    track.addEventListener('click', e=>{ if(e.target!==handle) commit(ratio(e.clientX)>0.5?1:0); });
    ends.forEach(b=> b.onclick=()=> commit(+b.dataset.q));
    paint(cur);
  }
  function renderVisitsChart(el, opts){
    opts = opts || {}; if(!el) return;
    const data = D.visitsSeries();
    // an honest empty state beats a zero flatline (e.g. RQI's new site has no
    // recorded GA4 traffic for Q2) — brands set WEB_NOTE to explain why
    if(!data || !data.length){
      el.style.height='auto';
      el.innerHTML = `<p class="muted-txt">${D.WEB_NOTE || 'No web analytics are wired into this pack yet.'}</p>`;
      return;
    }
    if(window.echarts){ try { return echartsVisits(el, data, opts); } catch(e){ console.warn('echarts visits failed, using fallback', e); } }
    C.lines(el, data, [{ key:'sessions', color:'var(--c-a)', us:true }, { key:'prev', color:'var(--c-muted)', dash:true }], { height: opts.modal?420:240 });
  }
  function renderVisits(){ renderVisitsChart($('#chart-visits'), {}); }

  /* ---------- shared ECharts helpers ---------- */
  function resolveColor(c){ if(typeof c==='string' && c.startsWith('var(')) return chartColor(c.slice(4,-1).trim(), '#b6b0a3'); return toRGB(c || '#b6b0a3', '#b6b0a3'); }
  function echDark(el){ return !!(el.closest('.page') && el.closest('.page').classList.contains('dark')) || !!el.closest('.lb-panel'); }
  function echInit(el, h){ if(h) el.style.height = h; return echarts.getInstanceByDom(el) || echarts.init(el, null, { renderer:'canvas' }); }
  function echAxis(dark){ return { line: dark?'rgba(255,255,255,.20)':'#d6d1c4', split: dark?'rgba(255,255,255,.10)':'#e4e0d6', label: dark?'#b3ada0':'#8b877d' }; }
  // Shared tooltip look — a clearly-raised panel (lighter than the near-black
  // page) with a border + shadow so it never reads as transparent on dark.
  function echTipBase(dark){ return {
    backgroundColor: dark?'rgba(46,42,37,.98)':'#fff', borderColor: dark?'#5a534a':'#e4e0d6', borderWidth:1, padding:[8,12],
    textStyle:{ color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Sans', fontSize:12.5 },
    extraCssText:'box-shadow:0 10px 30px rgba(0,0,0,.4);border-radius:10px;' }; }
  function echTip(dark, fmt){ return Object.assign(echTipBase(dark), { trigger:'axis',
    axisPointer:{ type:'line', lineStyle:{ color:dark?'rgba(255,255,255,.42)':'rgba(0,0,0,.28)', width:1, type:'dashed' } },
    valueFormatter: fmt }); }
  // Every chart registers here so a single deterministic pass (on load and just
  // after boot) can re-fit any chart whose canvas drifted from its container —
  // the belt to the ResizeObserver's braces, since timers fire even when rAF /
  // observer delivery is paused in a background or non-compositing tab.
  const MI_CHARTS = [];
  function resizeAllCharts(){ MI_CHARTS.forEach(c=>{ try{ const w=c.el.clientWidth; if(w && Math.abs(c.inst.getWidth()-w)>1) c.inst.resize(); }catch(e){} }); }
  if(typeof window!=='undefined') window.MI_resizeCharts = resizeAllCharts;
  function bindResize(el, inst){
    if(!el._miTracked){ el._miTracked=true; MI_CHARTS.push({ el, inst }); }
    if(el._miResize) return; el._miResize=true;
    const doResize=()=>{ try{ inst.resize(); }catch(e){} };
    window.addEventListener('resize', doResize);
    // A chart can initialise while its container is briefly narrow (an off-screen
    // page, a not-yet-laid-out carousel, or an embedding pane that resizes without
    // firing window.resize — e.g. review tools / iframes). window.resize alone
    // never corrects that and the chart stays clipped. A ResizeObserver tracks the
    // container's real width and re-fits on any change, including the first
    // measure once layout settles.
    if(window.ResizeObserver && !el._miRO){
      // Resize synchronously in the observer (NOT via rAF, which is paused in
      // background / non-compositing tabs — exactly when a chart gets stuck at a
      // wrong initial width). Fire whenever the canvas drifts from the container
      // width, so a chart that initialised too narrow also self-corrects; it is a
      // no-op once the two match, so it cannot loop.
      const ro=new ResizeObserver(()=>{ const w=el.clientWidth; if(w && Math.abs(inst.getWidth()-w)>1) doResize(); });
      try{ ro.observe(el); el._miRO=ro; }catch(e){}
    }
  }

  function echartsLines(el, data, keys, opts){
    opts=opts||{}; const dark=echDark(el), t=echAxis(dark); const inst=echInit(el, opts.modal?'52vh':((opts.height||230)+'px'));
    inst.setOption({ animationDuration:450,
      grid:{ left:46, right:16, top:14, bottom:26 },
      tooltip: echTip(dark, v => opts.pct ? (Math.round(v*10)/10)+'%' : Number(v).toLocaleString()),
      xAxis:{ type:'category', boundaryGap:false, data:data.map(d=>d.label), axisTick:{show:false}, axisLine:{lineStyle:{color:t.line}}, axisLabel:{color:t.label, fontFamily:'IBM Plex Mono', fontSize:11} },
      yAxis:{ type:'value', splitLine:{lineStyle:{color:t.split}}, axisLabel:{color:t.label, fontFamily:'IBM Plex Mono', fontSize:11, formatter: v => opts.pct ? v+'%' : (v>=1000?(v/1000)+'k':v) } },
      series: keys.map(k=>({ name:k.name||k.key, type:'line', smooth:true, showSymbol:false, data:data.map(d=>d[k.key]),
        lineStyle:{ width:k.us?3.4:2, color:resolveColor(k.color), type:k.dash?'dashed':'solid' }, itemStyle:{color:resolveColor(k.color)}, emphasis:{focus:'none'} })),
    });
    inst.resize(); bindResize(el, inst); return inst;
  }
  function echartsHBars(el, rows, opts){
    // Height tracks the number of bars — a fixed modal height leaves a big empty
    // gap under a short chart (e.g. 4 competitors).
    opts=opts||{}; const dark=echDark(el); const inst=echInit(el, opts.modal?(Math.max(rows.length,3)*56+70)+'px':((rows.length*(opts.rowH||40)+20)+'px'));
    const cUs=chartColor('--c-us','#ff5424');
    const cat = rows.map(r=>r.name).reverse();
    const data = rows.map(r=>({ value: opts.pct? +(r.share*100).toFixed(1) : (opts.rate? r.rate : r.v),
      itemStyle:{ color: r.us?cUs:resolveColor(r.color), borderRadius:[0,8,8,0] } })).reverse();
    inst.setOption({ animationDuration:450,
      grid:{ left:(opts.labelW||130), right:56, top:8, bottom:8 },
      tooltip: Object.assign(echTipBase(dark), { trigger:'item', valueFormatter: v => (opts.pct||opts.rate)? v+'%' : (Number(v).toLocaleString()+(opts.valUnit||'')) }),
      xAxis:{ type:'value', show:false, max:'dataMax' },
      yAxis:{ type:'category', data:cat, axisTick:{show:false}, axisLine:{show:false}, axisLabel:{ color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Sans', fontSize:13.5 } },
      series:[{ type:'bar', data, barWidth:16, label:{ show:true, position:'right', color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Mono', fontSize:12.5,
        formatter: p => (opts.pct||opts.rate)? p.value+'%' : ((p.value>=1000?(p.value/1000).toFixed(1)+'k':p.value)+(opts.valUnit||'')) } }],
    });
    inst.resize(); bindResize(el, inst); return inst;
  }
  // Horizontal bars where the bar length = impressions and the leading segment =
  // clicks (clicks are a subset of impressions, so the split reads as CTR).
  function echartsStackedHBars(el, rows, opts){
    opts=opts||{}; const dark=echDark(el);
    const inst=echInit(el, opts.modal?(Math.max(rows.length,3)*44+70)+'px':((rows.length*(opts.rowH||34)+26)+'px'));
    const cat  = rows.map(r=>r.name).reverse();
    const pipeSet = new Set(rows.filter(r=>r._pipe).map(r=>r.name));
    const clk  = rows.map(r=>r.clicks).reverse();
    const rest = rows.map(r=>Math.max(0, r.impr - r.clicks)).reverse();
    const rev  = rows.slice().reverse();
    // clicks = brand accent; impressions = a light blue so the split is legible
    const cUs = chartColor('--c-us','#ff5424'), cRest = opts.restColor || (dark?'#8fb4d6':'#c9dced');
    inst.setOption({ animationDuration:450,
      grid:{ left:(opts.labelW||230), right:72, top:8, bottom:8 },
      tooltip: Object.assign(echTipBase(dark), { trigger:'axis', axisPointer:{ type:'shadow' },
        formatter: p => { const r = rev[p[0].dataIndex];
          if(opts.tipRows) return `<b>${r.name}</b><br/>` + opts.tipRows(r);
          const ctr = r.impr ? (r.clicks/r.impr*100).toFixed(2) : '0.00';
          return `<b>${r.name}</b><br/>Impressions ${Number(r.impr).toLocaleString()}<br/>Clicks ${Number(r.clicks).toLocaleString()}<br/>CTR ${ctr}%`; } }),
      xAxis:{ type:'value', show:false, max:'dataMax' },
      yAxis:{ type:'category', data:cat, axisTick:{show:false}, axisLine:{show:false},
              axisLabel:{ color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Sans', fontSize:12.5,
                formatter: pipeSet.size ? (v => { if(!pipeSet.has(v)) return v; const nm = v.length>22 ? v.slice(0,21)+'…' : v; return nm+' {pill|◆ Open opportunity}'; }) : undefined,
                rich: pipeSet.size ? { pill:{ color:'#e6a91f', backgroundColor:'rgba(224,160,32,0.14)', borderColor:'rgba(224,160,32,0.55)', borderWidth:1, borderRadius:7, padding:[3,7,3,7], fontSize:10, fontFamily:'IBM Plex Sans' } } : undefined } },
      series:[
        { name:(opts.hitName||'Clicks'), type:'bar', stack:'t', data:clk, barWidth:14, itemStyle:{ color:cUs, borderRadius:[7,0,0,7] } },
        { name:'Impressions', type:'bar', stack:'t', data:rest, barWidth:14, itemStyle:{ color:cRest, borderRadius:[0,7,7,0] },
          label:{ show:true, position:'right', color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Mono', fontSize:11.5,
            formatter: p => { const r = rev[p.dataIndex]; return r.impr>=1000 ? (r.impr/1000).toFixed(1)+'k' : String(r.impr); } } },
      ],
    });
    inst.resize(); bindResize(el, inst); return inst;
  }
  // Combined share-of-voice: one bar per rival, split into Google / LinkedIn /
  // Press share segments (each already normalised to its channel). Legend names
  // the channels; the number at the bar end is the summed share.
  function echartsSoVStack(el, rows, opts){
    opts=opts||{}; const dark=echDark(el);
    const inst=echInit(el, opts.modal?(Math.max(rows.length,3)*44+96)+'px':((rows.length*(opts.rowH||34)+58)+'px'));
    const rev = rows.slice().reverse();
    const cat = rev.map(r=>r.name);
    const cG = chartColor('--c-us','#ff5424'), cL = dark?'#5aa0e0':'#2f6fb0';
    const lw = opts.labelW||150;
    const seg = (key,color,name,r) => ({ name, type:'bar', stack:'sov', barWidth:14,
        data: rev.map(x=>+x[key].toFixed(1)), itemStyle:{ color, borderRadius:r } });
    const totLabel = { label:{ show:true, position:'right', color:dark?'#f4f1ea':'#1c1b18',
        fontFamily:'IBM Plex Mono', fontSize:11.5, formatter:p=>{ const r=rev[p.dataIndex]; return r.total>=1?Math.round(r.total)+'%':''; } } };
    inst.setOption({ animationDuration:450,
      legend:{ show:true, top:0, right:8, itemWidth:10, itemHeight:10, textStyle:{ color:dark?'#cfcabc':'#57534a', fontFamily:'IBM Plex Sans', fontSize:11 }, data:['Google','LinkedIn'] },
      grid:{ left:lw, right:64, top:28, bottom:8 },
      tooltip: Object.assign(echTipBase(dark), { trigger:'axis', axisPointer:{ type:'shadow' },
        formatter: pr => { const r=rev[pr[0].dataIndex];
          return `<b>${r.name}</b><br/>Google ${r.gs.toFixed(1)}% <span style="opacity:.6">(${r.g.toLocaleString()} ads)</span><br/>LinkedIn ${r.ls.toFixed(1)}% <span style="opacity:.6">(${r.l.toLocaleString()} ads)</span>`; } }),
      xAxis:{ type:'value', show:false, max:'dataMax' },
      yAxis:{ type:'category', data:cat, axisTick:{show:false}, axisLine:{show:false},
              axisLabel:{ color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Sans', fontSize:12, width:lw-8, overflow:'truncate', ellipsis:'…' } },
      series:[
        seg('gs',cG,'Google',[7,0,0,7]),
        Object.assign(seg('ls',cL,'LinkedIn',[0,7,7,0]), totLabel),
      ],
    });
    inst.resize(); bindResize(el, inst); return inst;
  }
  function echartsBars(el, rows, opts){
    opts=opts||{}; const dark=echDark(el), t=echAxis(dark); const inst=echInit(el, opts.modal?'52vh':((opts.height||230)+'px'));
    const cUs=chartColor('--c-us','#ff5424');
    inst.setOption({ animationDuration:450,
      grid:{ left:44, right:14, top:24, bottom:32 },
      tooltip: Object.assign(echTipBase(dark), { trigger:'item', valueFormatter:v=>Number(v).toLocaleString() }),
      xAxis:{ type:'category', data:rows.map(r=>r.label), axisTick:{show:false}, axisLine:{lineStyle:{color:t.line}}, axisLabel:{color:t.label, fontFamily:'IBM Plex Mono', fontSize:11, interval:0, hideOverlap:true } },
      yAxis:{ type:'value', splitLine:{lineStyle:{color:t.split}}, axisLabel:{color:t.label, fontFamily:'IBM Plex Mono', fontSize:11, formatter:v=> v>=1000?(v/1000)+'k':v } },
      series:[{ type:'bar', data:rows.map(r=>r.v), barWidth:'46%', itemStyle:{ color:cUs, borderRadius:[4,4,0,0] }, label:{ show:true, position:'top', color:t.label, fontFamily:'IBM Plex Mono', fontSize:11, formatter:p=> p.value>=1000?(p.value/1000).toFixed(1)+'k':p.value } }],
    });
    inst.resize(); bindResize(el, inst); return inst;
  }
  function echartsDonut(el, pct, opts){
    opts=opts||{}; const dark=echDark(el); const sz=opts.size||118; el.style.width=sz+'px'; const inst=echInit(el, sz+'px');
    const cUs=chartColor('--c-us','#ff5424'), track=dark?'rgba(255,255,255,.12)':'#e4e0d6';
    inst.setOption({
      series:[{ type:'pie', radius:['66%','90%'], center:['50%','50%'], silent:true, label:{show:false}, labelLine:{show:false},
        data:[ {value:pct, itemStyle:{color:cUs}}, {value:1-pct, itemStyle:{color:track}} ] }],
      graphic:[{ type:'text', left:'center', top:'center', style:{ text:Math.round(pct*100)+'%', fill:dark?'#f4f1ea':'#1c1b18', font:'600 22px "IBM Plex Sans"' } }],
    });
    inst.resize(); bindResize(el, inst); return inst;
  }

  function renderEventsDonut(el, opts){
    el = el || $('#events-donut'); if(!el) return;
    if(window.echarts){ try { return echartsDonut(el, 0.60, Object.assign({ size:118 }, opts)); } catch(e){ console.warn('echarts donut', e); } }
    C.donut(el, 0.60, { size:118 });
  }

  // Registry the lightbox calls to re-render charts LIVE inside the modal
  window.MI_renderChart = function(key, el, opts){
    try {
      if(key === 'visits')     return renderVisitsChart(el, opts);
      if(key === 'search-vis') return renderSearchVisibility(el, opts);
      if(key === 'sov')        return renderSoV(el, opts);
      if(key === 'na-audience') return renderNaAudience(el, opts);
      if(key === 'ri-chapters') return renderRiChapters(el, opts);
      if(key === 'ri-companies')return renderRiCompanies(el, opts);
      if(key === 'ri-requests') return renderRiRequests(el, opts);
      if(key === 'ri-cto') return renderRiCto(el, opts);
    } catch(e){ console.warn('MI_renderChart', key, e); }
  };
  // The GA4 top-pages come as country-specific URLs (/europe/…, /usa/…, …).
  // Derive the country from the first path segment so we can group the same
  // page across regions and offer a country filter.
  // Two path conventions map here: legacy Igneo full-word segments (/europe/,
  // /asia/…) and the First Sentier estate's ISO country codes (/hk/, /sg/, /de/…)
  // that the RQI/FSSA/FSI proxies use. Nordic markets fold into one "Nordics"
  // filter; smaller European markets fold into "Europe".
  const COUNTRY_MAP = {
    europe:'Europe', usa:'US', australia:'Australia', anz:'Australia', asia:'Asia', global:'Global',
    au:'Australia', nz:'New Zealand',
    hk:'Hong Kong', sg:'Singapore', jp:'Japan',
    uk:'UK', gb:'UK', ie:'Ireland', us:'US',
    de:'Germany',
    dk:'Nordics', se:'Nordics', no:'Nordics', fi:'Nordics', is:'Nordics',
    fr:'Europe', nl:'Europe', ch:'Europe', at:'Europe', it:'Europe', es:'Europe', lu:'Europe', be:'Europe',
  };
  function pageCountry(path){ const m=/^\/([a-z]+)/i.exec(path||''); const k=m&&m[1].toLowerCase(); return COUNTRY_MAP[k]||'Global'; }
  function fmtDur(s){ s=Math.round(s||0); if(!s) return ''; return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
  function chanClass(ch){ return 'ch-'+String(ch||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  // root defaults to the document; the modal passes its cloned card so the
  // country switcher rebinds live handlers inside the lightbox. Elements are
  // found by data-attr (not id) because the lightbox strips ids on clones.
  function renderTopPages(root){
    root = root || document;
    const all = (D.TOP_PAGES||[]).map(r=>({ ...r, country: pageCountry(r.path) }));
    if(!all.length){
      const seg0 = root.querySelector('[data-seg="pages-country"]'); if(seg0) seg0.innerHTML='';
      const body0 = root.querySelector('[data-body="top-pages"]');
      if(body0) body0.innerHTML = `<p class="muted-txt" style="padding:14px 4px">${D.WEB_NOTE || 'No page analytics are wired into this pack yet.'}</p>`;
      return;
    }
    // 'Global' is the catch-all bucket for unmapped paths (campaign URLs etc.),
    // not a real market — keep those pages in "All" but don't offer it as a chip.
    const countries = ['all', ...[...new Set(all.map(r=>r.country))].filter(c=>c!=='Global')];
    const sel = countries.includes(state.pagesCountry) ? state.pagesCountry : 'all';
    // country filter control (rendered from whatever regions the data contains)
    const seg = root.querySelector('[data-seg="pages-country"]');
    if(seg){
      seg.innerHTML = countries.map(c=>`<button class="${c===sel?'on':''}" data-c="${c}">${c==='all'?'All countries':c}</button>`).join('');
      seg.querySelectorAll('button').forEach(b=> b.onclick=()=>{ state.pagesCountry=b.dataset.c; renderTopPages(root); });
    }
    // top 10 pages for the selected country (overall when 'all')
    const rows = (sel==='all' ? all : all.filter(r=>r.country===sel))
      .slice().sort((a,b)=>b.views-a.views).slice(0,10);
    const max = Math.max(1, ...rows.map(r=>Math.max(r.views, r.prevViews||0)));
    const dash = '<span class="muted">–</span>';
    const body = root.querySelector('[data-body="top-pages"]');
    if(!body) return;
    if(!rows.length){ body.innerHTML = '<p class="muted-txt" style="padding:14px 4px">No pages for this country.</p>'; return; }
    body.innerHTML = `<table class="tbl pages-tbl"><thead><tr>
        <th>Page</th><th>Channel</th><th>Views · vs last quarter</th>
        <th class="num">Users</th><th class="num">Returning</th>
        <th class="num">Avg. duration</th><th class="num">Bounce</th><th class="num">Clicks</th>
      </tr></thead><tbody>${rows.map(r=>{
        const prev = r.prevViews||0;
        const delta = prev ? Math.round((r.views-prev)/prev*100) : null;
        const region = r.country && r.country!=='Global' ? r.country+' · ' : '';
        const chan = r.channel ? `<span class="chan ${chanClass(r.channel)}"><i></i>${r.channel}</span>` : dash;
        const dur = fmtDur(r.dur);
        return `<tr>
          <td class="pg-cell"><div class="strong">${r.title}</div><div class="muted mono" style="font-size:11.5px">${region}${r.path}</div></td>
          <td>${chan}</td>
          <td class="vcol"><div class="vcell">
              <div class="vhead"><b>${D.fmtK(r.views)}</b> <span class="u">views</span>${delta!=null?` <span class="pill ${delta>=0?'pos':'neg'}">${delta>=0?'+':''}${delta}%</span>`:''}</div>
              <div class="vbars">
                <div class="vb now"><i style="width:${r.views/max*100}%"></i></div>
                <div class="vb prev"><i style="width:${prev/max*100}%"></i></div>
              </div>
              <div class="vprev">${prev?D.fmtK(prev)+' last Q':'&nbsp;'}</div>
            </div></td>
          <td class="num strong">${r.users?D.fmtK(r.users):dash}</td>
          <td class="num">${r.returning!=null?Math.round(r.returning*100)+'%':dash}</td>
          <td class="num mono">${dur||dash}</td>
          <td class="num">${r.bounce!=null?`<span class="pill ${r.bounce>0.5?'warm':''}">${Math.round(r.bounce*100)}%</span>`:dash}</td>
          <td class="num">${r.events?D.fmtK(r.events):dash}</td>
        </tr>`;
      }).join('')}</tbody></table>`;
  }
  // Interactive widgets (beyond charts) the lightbox re-renders live in the modal.
  window.MI_renderWidget = function(key, el){
    try {
      if(key === 'top-pages') return renderTopPages(el);
      if(key === 'alphix')    return renderAlphix(el);
      if(key === 'creatives'){ wireCreatives(el); renderCompChips(el); renderCreatives(el); return; }
      if(key === 'sem'){ wireSem(el); renderSemChips(el); renderSemGallery(el); renderSemChart(el, { modal:true }); return; }
      if(key === 'searchterms'){ renderStTabs(el); renderStChart(el, { modal:true }); return; }
      if(key === 'lichannel'){ renderLiChannel(el); return; }
      if(key === 'liaudience'){ renderLiAudTabs(el); renderLiAudChart(el); return; }
      if(key === 'liposts'){ renderLiPostTabs(el); renderLiPosts(el); return; }
      if(key === 'forms'){ renderFormTabs(el); renderFormChart(el); return; }
      if(key === 'seo'){ renderSeoTabs(el); renderSeoChart(el); return; }
      if(key === 'semperf'){ renderSempCard(el, { modal:true }); return; }
      if(key === 'email'){ renderEmailTabs(el); renderEmailChart(el); return; }
      if(key === 'liads'){ renderLiAdTabs(el); renderLiAds(el); return; }
      if(key === 'prospects'){ renderProspectTabs(el); renderNaAudience(el.querySelector('[data-chart="na-audience"]'), { modal:true }); return; }
    }
    catch(e){ console.warn('MI_renderWidget', key, e); }
  };
  // Alphix pages. With real data, drive the list (and thus the region filter)
  // off the pages that actually have identified firms — so a region never shows
  // up empty. Titles come from the GA4 catalogue; fall back to the path.
  function alphixPages(){
    const R = (typeof window !== 'undefined' && window.MI_REMOTE) || {};
    const titleByPath = {};
    (D.TOP_PAGES || []).forEach(p => { titleByPath[p.path] = p.title; });
    const paths = R.ALPHIX ? Object.keys(R.ALPHIX)
                           : ((D.TOP_PAGES && D.TOP_PAGES.length) ? D.TOP_PAGES : (D.KEY_PAGES || [])).map(p => p.path);
    return paths.map(path => ({ path, title: titleByPath[path] || path, region: pageCountry(path) }));
  }
  // Invert firmsByPage over the (region-filtered) pages: each company with the
  // list of pages it read + totals, ranked by total views.
  function alphixCompanies(fpages){
    const by = {};
    fpages.forEach(pg => D.firmsByPage(pg.path).forEach(f => {
      const rec = by[f.firm] || (by[f.firm] = { firm:f.firm, domain:f.domain, industry:f.industry, comp:!!f.comp, total:0, visits:0, pages:[] });
      rec.total += f.views; rec.visits += f.sessions;
      rec.pages.push({ title:pg.title, path:pg.path, region:pg.region, views:f.views });
    }));
    return Object.values(by)
      .map(r => ({ ...r, pages: r.pages.sort((a,b)=>b.views-a.views) }))
      .sort((a,b)=>b.total-a.total);
  }
  const ALX_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  // Root-scoped (document, or the modal clone) + keyed by data-attr, so the
  // whole Alphix widget re-renders live in the lightbox with fresh handlers.
  // Company-first: list companies, click one to drop down the pages it read.
  function renderAlphix(root){
    root = root || document;
    const q = sel => root.querySelector(sel);
    const sumEl = q('[data-alphix-summary]');
    if(sumEl){ const s = D.FIRMS_SUMMARY || {};
      sumEl.innerHTML = [
        { v:s.companies, l:'companies identified' },
        { v:s.identifiedPct, l:'of views identified to a company', pct:true },
        { v:s.topIndustry, l:'Sector with most number of views' },
        { v:s.newCompanies, l:'new this quarter', plus:true },
      ].filter(x => x.v !== undefined && x.v !== null && x.v !== '' && x.v !== 0)
       .map(x=>`<div><b style="font-size:24px;font-weight:600;display:block;letter-spacing:-.02em">${x.plus?'+':''}${x.v}${x.pct?'%':''}</b><span class="alx-sub">${x.l}</span></div>`).join('');
    }
    const pages = alphixPages();
    const regions = ['all', ...[...new Set(pages.map(p=>p.region))].filter(r=>r!=='Global')];
    const region = regions.includes(state.alphixRegion) ? state.alphixRegion : 'all';
    const regSeg = q('[data-alphix-region]');
    if(regSeg){
      regSeg.innerHTML = regions.map(r=>`<button class="${r===region?'on':''}" data-r="${r}">${r==='all'?'All regions':r}</button>`).join('');
      regSeg.querySelectorAll('button').forEach(b=> b.onclick=()=>{ state.alphixRegion=b.dataset.r; renderAlphix(root); });
    }
    const fpages = region==='all' ? pages : pages.filter(p=>p.region===region);
    const companies = alphixCompanies(fpages);
    if(!(state.alphixOpen instanceof Set)) state.alphixOpen = new Set();
    const tableEl = q('[data-alphix-table]');
    if(!tableEl) return;
    if(!companies.length){ tableEl.innerHTML = `<p class="muted-txt" style="padding:14px 4px">${(region==='all' && D.ALPHIX_NOTE) || 'No companies in this region.'}</p>`; return; }
    tableEl.innerHTML = `<div class="firm-list">${companies.map(c=>{
      const open = state.alphixOpen.has(c.firm);
      return `<div class="firm-row ${open?'open':''}" data-firm="${c.firm}">
        <button class="firm-head" type="button" aria-expanded="${open}">
          <span class="firm-chev">${ALX_CHEV}</span>
          <span class="firm-cell"><span class="avatar" style="background:${avatarColor(c.firm)}">${initials(c.firm)}</span>
            <span class="fmeta"><span class="strong">${c.firm}${c.comp?' <span class="pill warm" style="font-size:10px;padding:2px 7px;vertical-align:2px">Competitor</span>':pipelineBadge(c.firm)}</span><small>${c.domain}</small></span></span>
          <span class="firm-ind">${c.industry}</span>
          <span class="firm-metric"><b>${D.fmtInt(c.total)}</b> views</span>
          <span class="firm-metric"><b>${c.visits}</b> visits</span>
          <span class="firm-metric"><b>${c.pages.length}</b> ${c.pages.length===1?'page':'pages'}</span>
        </button>
        <div class="firm-pages">${c.pages.slice(0,12).map(p=>`<div class="firm-page">
            <span class="fp-title">${p.title}</span>
            <span class="fp-path mono">${p.region && p.region!=='Global' ? p.region+' · ' : ''}${p.path}</span>
            <span class="fp-views"><b>${D.fmtInt(p.views)}</b> views</span>
          </div>`).join('')}${c.pages.length>12?`<div class="firm-more">+ ${c.pages.length-12} more pages</div>`:''}</div>
      </div>`;
    }).join('')}</div>`;
    tableEl.querySelectorAll('.firm-row .firm-head').forEach(btn => btn.onclick = () => {
      const f = btn.closest('.firm-row').dataset.firm;
      if(state.alphixOpen.has(f)) state.alphixOpen.delete(f); else state.alphixOpen.add(f);
      renderAlphix(root);
    });
  }
  function renderLinkedIn(){
    const li = D.linkedin();
    const kpi = (v,l)=>`<div class="kpi"><b>${v}</b><div class="kl">${l}</div></div>`;
    // Igneo replaced these KPI/table mounts with the real organic-vs-paid,
    // audience and top-post widgets; other brands still carry them, so guard.
    const org = $('#li-organic'), paid = $('#li-paid'), posts = $('#li-posts');
    if(org)  org.innerHTML  = kpi(li.organic.impressions,'People reached') + kpi(li.organic.clicks,'Clicks') + kpi(li.organic.engRate,'Engagement rate');
    if(paid) paid.innerHTML = kpi(li.paid.impressions,'People reached') + kpi(li.paid.conversions,'Leads') + kpi(li.paid.spend,'Spend');
    if(!posts) return;
    posts.innerHTML = `<table class="tbl"><thead><tr>
      <th>Post</th><th>Type</th><th class="num">Reactions</th><th class="num">Comments</th><th class="num">Shares</th>
      </tr></thead><tbody>${li.posts.map(p=>`<tr>
        <td class="strong">${p.title}</td><td><span class="pill">${p.type}</span></td>
        <td class="num">${D.fmtInt(p.reactions)}</td><td class="num">${p.comments}</td><td class="num">${p.shares}</td>
      </tr>`).join('')}</tbody></table>`;
  }

  /* ================= CONVERSION ================= */
  function renderEmailSummary(){
    $('#email-summary').innerHTML = D.EMAIL_SUMMARY.map(k=>`<div class="kpi on-dark"><b>${k.v}</b><div class="kl">${k.l}</div></div>`).join('');
  }

  /* --- email engagement: who's opening/clicking, ranked most→least, sliced by
     campaign / country / company. Stacked HBar = opens (light) + clicks (accent).
     Root-scoped so it survives the modal; large dims (company) cap on the page. --- */
  function emailEngData(){ return D.emailEng ? D.emailEng() : null; }
  function emailCards(){ return $$('[data-role="email-chart"]').map(h=>h.closest('.chart-card')).filter(Boolean); }
  function currentEmailDim(){ const E=emailEngData(); if(!E) return null; return E.dims.find(d=>d.key===state.emailDim) || E.dims[0]; }
  function renderAllEmail(){ emailCards().forEach(card=>{ renderEmailTabs(card); renderEmailChart(card); }); if(window.MI_fitCarousels) window.MI_fitCarousels(); }
  function renderEmailTabs(card){
    const E=emailEngData(); if(!E) return;
    if(!E.dims.some(d=>d.key===state.emailDim)) state.emailDim = E.dims[0].key;
    const host = card.querySelector('[data-role="email-dim"]');
    if(host){
      host.innerHTML = E.dims.map(d=>`<button class="${state.emailDim===d.key?'on':''}" data-dim="${d.key}">${d.label}</button>`).join('');
      host.querySelectorAll('button').forEach(b=>b.onclick=()=>{ state.emailDim=b.dataset.dim; renderAllEmail(); });
    }
    const note = card.querySelector('[data-role="email-note"]');
    if(note){ const d=currentEmailDim(); const modal=!!card.closest('.lb-scroll');
      const cap = modal ? 22 : (window.innerHeight && window.innerHeight < 900 ? 4 : 12);
      const shown = d ? Math.min(cap, d.rows.length) : 0;
      const plural = { strategy:'strategies', company:'companies', contact:'contacts' };
      const noun = d ? (plural[d.key] || d.label.toLowerCase()+'s') : '';
      // The page is height-budgeted, so on-page carries the one-line version;
      // the full methodology (incl. the masking statement) rides in the modal.
      const brief = 'Q2 2026 · external contacts only · ranked by opens + clicks · ◆ marks an open opportunity.';
      const maskLine = d && d.key==='contact' ? ' Contacts show initial + surname only.' : '';
      note.innerHTML = d
        ? `Top ${shown} ${noun}${d.rows.length>shown?` of ${d.rows.length}`:''} by engagement. ${modal ? E.note : brief + maskLine}`
        : (modal ? E.note : brief);
    }
  }
  function renderEmailChart(card){
    const E=emailEngData(); if(!E) return;
    const el = card.querySelector('[data-role="email-chart"]'); if(!el || !window.echarts) return;
    const d = currentEmailDim(); if(!d) return;
    const modal = !!card.closest('.lb-scroll');
    // On-page rows are height-budgeted: below the heading + KPI row a laptop
    // leaves ~200px, and .page clips with no scrollbar. Expand shows all 22.
    const cap = modal ? 22 : (window.innerHeight && window.innerHeight < 900 ? 4 : 12);
    const rows = d.rows.slice(0, cap).map(r=>({ name:r.n, impr:(r.o||0)+(r.c||0), clicks:(r.c||0), _o:r.o||0, _c:r.c||0, _e:r.e||0, _pipe:!!r.p }));
    // contact rows carry no per-email count (e:0) — omit the line rather than say 0
    const tipRows = r => `Opens ${r._o.toLocaleString()}<br/>Clicks ${r._c.toLocaleString()}` + (r._e ? `<br/>Emails engaged ${r._e}` : '') + (r._pipe ? `<br/><span style="color:#e0a020">◆ Open opportunity</span>` : '');
    const hasPins = rows.some(r=>r._pipe);
    try { echartsStackedHBars(el, rows, { labelW: modal?(hasPins?348:280):(hasPins?300:214), hitName:'Clicks', tipRows, modal }); }
    catch(e){ console.warn('email-eng', e); }
  }

  /* ================= LOYALTY ================= */
  function renderEvents(){
    // Packs with the interactive Leaflet events section (events-map.js) use
    // id="ev-leaflet" + class="events-table", so #events-map is absent — skip the
    // legacy dot-map/table render (and don't clobber the Leaflet table).
    const em = $('#events-map');
    if(!em) return;
    renderEventsDonut($('#events-donut'));
    const pts = D.EVENTS.map(e=>`<div title="${e.name}" style="position:absolute;left:${e.x*100}%;top:${e.y*100}%;transform:translate(-50%,-50%)">
        <span style="display:block;width:14px;height:14px;border-radius:50%;background:${e.status==='Delivered'?'var(--c-us)':'var(--c-a)'};box-shadow:0 0 0 4px color-mix(in srgb, ${e.status==='Delivered'?'var(--c-us)':'var(--c-a)'} 22%, transparent)"></span>
      </div>`).join('');
    em.innerHTML = `<div style="position:relative;width:100%;aspect-ratio:2/1;background:radial-gradient(circle at 1px 1px, var(--hair-2) 1px, transparent 0) 0 0/22px 22px;border-radius:12px;overflow:hidden">${pts}</div>`;
    const et = $('#events-table'); if(et) et.innerHTML = `<table class="tbl"><thead><tr><th>Event</th><th>City</th><th>Status</th></tr></thead>
      <tbody>${D.EVENTS.map(e=>`<tr><td class="strong">${e.name}</td><td class="muted">${e.city}</td><td><span class="pill ${e.status==='Delivered'?'pos':'warm'}">${e.status}</span></td></tr>`).join('')}</tbody></table>`;
  }

  /* ================= RESULTS ================= */
  const KPI_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  // KPI framework "Marketing Menu": every funnel stage, its organic and paid
  // channels, and the KPI + benchmark we hold each to. Benchmarks per the group
  // KPI framework (KPI_Framework.xlsx) and 2025 financial-sector benchmarks.
  const _ENG   = { n:'Engagement',        kpi:'Time on Page',    b:'Avg. Session Duration ~2 min · Industry' };
  const _EMAIL = { n:'Email Performance', kpi:'Open Rate',       b:'Open Rate >42% · Industry' };
  const _SOC   = { n:'Social Engagement', kpi:'Engagement Rate', b:'Engagement Rate <0.5% · Industry' };
  const _PR    = { n:'Media Coverage',    kpi:'Media Mentions',  b:'Positive Mentions >70% · Competitor' };
  const _EVT   = { n:'Event Engagement',  kpi:'Metric 1',        b:'QoQ Growth · Internal' };
  const KPI_MENU = {
    objectives: [
      ['Business', 'Increase asset inflows in EMEA by 5% in 2025'],
      ['Distribution', 'Grow Igneo sales, protect SI, and expand FSSA GEM'],
      ['Marketing', 'Run awareness and consideration campaigns to generate interest and deliver qualified leads to sales'],
    ],
    stages: [
      { name:'Awareness', color:'#3b6fb0', groups:[
        { t:'Organic', ch:[
          { c:'Content Marketing', k:[{ n:'Website traffic', kpi:'Active users', b:'Quarter over quarter average' }] },
          { c:'Educational content', k:[_ENG] },
          { c:'In-house Emails', k:[_ENG] },
          { c:'LinkedIn', k:[_SOC] },
          { c:'PR', k:[_PR] },
          { c:'SEO', k:[{ n:'Search Visibility', kpi:'Organic Keywords', b:'Organic Keywords >1000 · Internal' }] },
          { c:'Whitepapers / Proprietary Research', k:[
            { n:'Lead Generation', kpi:'Form Submissions', b:'Conversion Rate >2.5% · Industry' },
            { n:'Ad Performance', kpi:'CTR', b:'CTR >0.5% · Industry' },
          ] },
        ] },
        { t:'Paid', ch:[
          { c:'Search Engine Marketing (SEM)', k:[{ n:'Search Performance', kpi:'CTR', b:'CTR >1.2% · Industry' }, _EMAIL] },
          { c:'Digital Advertising (MPUs)', k:[{ n:'Ad Performance', kpi:'CTR', b:'CTR >0.5% · Industry' }] },
          { c:'Events & Sponsorships', k:[{ n:'Event Reach', kpi:'Attendees', b:'Attendees >100 · Internal' }] },
          { c:'Outdoor (billboards)', k:[{ n:'Impressions', kpi:'Monthly Impressions', b:'Monthly Impressions >10K · Industry' }] },
          { c:'Print advertising', k:[{ n:'Impressions', kpi:'Monthly Impressions', b:'Monthly Impressions >10K · Industry' }] },
        ] },
      ] },
      { name:'Consideration', color:'#17a89a', groups:[
        { t:'Organic', ch:[
          { c:'Automated Drip Campaigns', k:[_EMAIL, _ENG] },
          { c:'Content Amplification & Regional Tailoring', k:[_EMAIL, _ENG] },
          { c:'LinkedIn / Social Media', k:[_SOC] },
          { c:'Podcasts', k:[_ENG] },
          { c:'PR', k:[_PR] },
          { c:'Strategy insight content (case studies)', k:[_ENG] },
          { c:'Strategy Update Events', k:[_EMAIL] },
          { c:'Strategy / Product development', k:[_ENG] },
          { c:'Videos', k:[_ENG] },
        ] },
        { t:'Paid', ch:[
          { c:'Client Events & Masterclasses', k:[_EVT] },
          { c:'Client Webinars', k:[_ENG] },
          { c:'Emails', k:[_EMAIL] },
        ] },
      ] },
      { name:'Conversion', color:'#2bb35f', groups:[
        { t:'Organic', ch:[
          { c:'Follow-Up Emails', k:[_EMAIL] },
          { c:'Personalised web content', k:[_ENG] },
          { c:'PR', k:[_PR] },
          { c:'Product level information content', k:[_ENG] },
          { c:'Sales Enablement Materials', k:[{ n:'Sales Support', kpi:'Usage Rate', b:'Usage Rate >60% · Internal' }] },
          { c:'Social Media', k:[_SOC] },
          { c:'Webinars', k:[_ENG] },
        ] },
        { t:'Paid', ch:[
          { c:'CRM-driven Engagement Optimisation', k:[{ n:'CRM Performance', kpi:'Engagement Rate', b:'Engagement Rate <3% · Internal' }] },
          { c:'Proprietary Events', k:[_EVT] },
          { c:'Social Media', k:[_SOC] },
          { c:'Webinars', k:[_ENG] },
        ] },
      ] },
      { name:'Service / Loyalty', color:'#9061d6', groups:[
        { t:'Organic', ch:[
          { c:'Client Surveys & Feedback Loop', k:[{ n:'Client Feedback', kpi:'Satisfaction Score', b:'Satisfaction Score >80% · Internal' }] },
          { c:'Client Webinars', k:[_ENG] },
          { c:'PR', k:[_PR] },
          { c:'Product Update Emails', k:[_EMAIL] },
          { c:'Social Media', k:[_SOC] },
        ] },
        { t:'Paid', ch:[
          { c:'Client Surveys & Feedback Loop', k:[{ n:'Client Feedback', kpi:'Satisfaction Score', b:'Satisfaction Score >80% · Internal' }] },
          { c:'Client Webinars', k:[_ENG] },
          { c:'Exclusive Events for Top Clients', k:[{ n:'Client Engagement', kpi:'Attendance Rate', b:'Attendance Rate >75% · Internal' }] },
        ] },
      ] },
    ],
  };
  // MEASUREMENT SPINE — the KPI framework and the quarter's results in one funnel.
  // Four tapering stage bands; beneath each, the real outcomes (from D.KPI) and the
  // framework it is measured against (activities · measures · benchmark, below).
  // Band geometry is authored so each slice's right edge meets the next slice's
  // left edge — across four columns the funnel reads as one unbroken taper.
  const SP_BANDS = [
    { poly:'0,8 100,19.5 100,120.5 0,132',      top:'M0 8 L100 19.5',    bot:'M0 132 L100 120.5' },
    { poly:'0,19.5 100,30.2 100,109.8 0,120.5', top:'M0 19.5 L100 30.2', bot:'M0 120.5 L100 109.8' },
    { poly:'0,30.2 100,40.8 100,99.2 0,109.8',  top:'M0 30.2 L100 40.8', bot:'M0 109.8 L100 99.2' },
    { poly:'0,40.8 100,49 100,91 0,99.2',       top:'M0 40.8 L100 49',   bot:'M0 99.2 L100 91' },
  ];
  // The group KPI framework, curated to the measures that carry each stage. Shared
  // across brands (the framework is the same); the numbers come from D.KPI/D.RESULTS.
  const SP_STAGES = [
    { idx:'01', name:'Awareness', hue:'oklch(0.62 0.15 45)', activities:[
      { name:'SEM',              measures:['Total impressions','Av click-through rate'], benchmark:'vs industry average' },
      { name:'Advertorials',     measures:['Total impressions','Dwell time'],           benchmark:'vs industry average' },
      { name:'Search (organic)', measures:['Total searches','Brand ranking'],           benchmark:'vs competitor average' },
    ] },
    { idx:'02', name:'Consideration', hue:'oklch(0.60 0.11 245)', activities:[
      { name:'LinkedIn (organic)', measures:['Impressions','Click-through rate','Engagement rate'], benchmark:'vs industry average' },
      { name:'Website',            measures:['Active users','Dwell time'],                          benchmark:'vs QoQ average' },
    ] },
    { idx:'03', name:'Conversion', hue:'oklch(0.62 0.10 190)', activities:[
      { name:'Events', measures:['Distribution feedback'],           benchmark:'qualitative, no benchmark' },
      { name:'Email',  measures:['Click-to-open rate','Open rates'], benchmark:'vs industry average' },
    ] },
    { idx:'04', name:'Service', hue:'oklch(0.66 0.11 130)', activities:[
      { name:'Data capture', measures:['Form completions'], benchmark:'vs 2-year internal average' },
    ] },
  ];
  // Outcome chips are the real per-stage metrics from D.KPI (value + label + tone),
  // not the seeded RESULTS pills. Live channels only; blank-value markers dropped.
  function spineOutcomes(i){
    const st = (D.KPI && D.KPI[i]) || null; if(!st) return [];
    const out = [];
    (st.channels||[]).forEach(c=>{ if(c.off) return; (c.metrics||[]).forEach(m=>{ if(!m.v) return;
      out.push({ label:m.l, value:m.v, tone: m.dir==='up'?'pos':m.dir==='down'?'neg':'' }); }); });
    return out.slice(0,5);
  }
  function renderSpine(){
    const wrap = $('.kpi-spine'); if(!wrap) return;
    const host = wrap.querySelector('#spine'); if(!host) return;
    const results = (D.RESULTS && Array.isArray(D.RESULTS)) ? D.RESULTS : [];
    const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    // header tally, derived from the goal metas ("3 of 4 KPIs met" etc.)
    let met=0, total=0, watch=0;
    SP_STAGES.forEach((s,i)=>{ const mm=/(\d+)\s+of\s+(\d+)/.exec((results[i]||{}).meta||'');
      if(mm){ met+=+mm[1]; total+=+mm[2]; if(+mm[1]<+mm[2]) watch++; }
      else { const n=Math.max(spineOutcomes(i).length,1); met+=n; total+=n; } });
    const stats = wrap.querySelector('#fw-stats');
    if(stats) stats.innerHTML = `<span><b>${met}</b>of ${total} KPIs met</span><span><b>${watch}</b>to watch</span>`;
    host.innerHTML = SP_STAGES.map((s,i)=>{
      const meta = (results[i]||{}).meta, band = SP_BANDS[i];
      const chans = ((D.KPI && D.KPI[i]) || {}).channels || [];
      const nM = chans.reduce((t,c)=>t+((c.metrics||[]).length),0);
      const count = `${chans.length} activit${chans.length===1?'y':'ies'} · ${nM} measure${nM===1?'':'s'}`;
      const actHtml = chans.map(c=>`<div class="sp-act${c.off?' off':''}">
        <div class="sp-a-nm">${esc(c.ch)}</div>
        ${(c.metrics||[]).map(m=>{ const tone = c.off?'':(m.dir==='up'?'pos':m.dir==='down'?'neg':'');
          const right = c.off ? `<em>${esc(m.cmp||'not run')}</em>` : `${m.v?esc(m.v):''}${m.cmp?` <em>${esc(m.cmp)}</em>`:''}`;
          return `<div class="sp-a-row"><span class="sp-a-k">${esc(m.l)}</span><span class="sp-a-v ${tone}">${right}</span></div>`; }).join('')}
      </div>`).join('');
      return `<div class="sp-col" style="--st:${s.hue}; --i:${i}">
        <div class="sp-band">
          <svg viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
            <polygon class="sp-fill" points="${band.poly}"/>
            <path class="sp-edge" d="${band.top}" pathLength="1" vector-effect="non-scaling-stroke"/>
            <path class="sp-edge" d="${band.bot}" pathLength="1" vector-effect="non-scaling-stroke"/>
          </svg>
          <div class="sp-lbl"><span class="sp-idx">${s.idx}</span><span class="sp-nm">${esc(s.name)}</span>${meta?`<span class="sp-meta">${esc(meta)}</span>`:''}</div>
        </div>
        <div class="sp-body">
          <div class="sp-rule"><span>Measured by</span><em>${count}</em></div>
          <div class="sp-acts">${actHtml}</div>
        </div>
      </div>`;
    }).join('');
    if(!wrap._spObs && 'IntersectionObserver' in window){
      wrap._spObs = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) wrap.classList.add('sp-in'); }), { threshold:0.15 });
      wrap._spObs.observe(wrap);
    } else { wrap.classList.add('sp-in'); }
  }
  // Vertical funnel: only the channels this brand actually used this quarter, each
  // filled with the real metric vs its benchmark. Per-brand data is D.KPI.
  // Horizontal funnel tree: a stage node branches to its framework channels.
  // Each channel shows its live metric(s) (mono value + label) and, to the
  // right, the benchmark comparison colour-coded by direction. Channels the
  // brand did not run this quarter render greyed (c.off) as framework markers.
  function renderResults(){
    const host = $('#branches'); if(!host) return;
    host.classList.remove('slide-scroll'); host.style.cssText = '';
    const stages = (D.KPI && Array.isArray(D.KPI)) ? D.KPI : [];
    if(!stages.length){ host.innerHTML = ''; return; }
    host.innerHTML = '<div class="kpi-tree">' + stages.map((s,i)=>`
      <div class="kt-stage" style="--kc:${s.color}">
        <div class="kt-node"><span class="kt-dot">${i+1}</span><span class="kt-sname">${s.stage}</span></div>
        <div class="kt-branches">${(s.channels||[]).map(c=>`
          <div class="kt-row${c.off?' off':''}">
            <div class="kt-ch">${c.ch}</div>
            <div class="kt-box">${(c.metrics||[]).map(m=>`
              <div class="kt-mrow"><span class="kt-v">${c.off?'-':m.v}</span><span class="kt-l">${m.l}</span></div>`).join('')}</div>
            <div class="kt-cmps">${(c.metrics||[]).map(m=>`
              <div class="kt-cmp ${c.off?'flat':(m.dir||'flat')}">${m.cmp||''}</div>`).join('')}</div>
          </div>`).join('')}</div>
      </div>`).join('') + '</div>';
  }

  // Switch the whole competitor-ads section between Google and LinkedIn: reset the
  // competitor/format filters to the new platform's set. Toggles + re-renders every
  // mounted gallery (page + any open lightbox clone) so they stay in sync.
  function switchPlatform(p){
    if(state.platform !== p){
      state.platform = p;
      // press has no creatives feed, so leave the ad filters as they were —
      // rebuilding them from an empty feed would blank them for Google/LinkedIn.
      if(p !== 'press'){
        state.comp = new Set(creativeComps().map(c=>c.name));
        if(p === 'google') state.fmt = new Set(D.FORMATS);
      }
    }
    $$('.plat-toggle button').forEach(b=> b.classList.toggle('on', b.dataset.plat===p));
    $$('[data-role="creatives-title"]').forEach(h=> h.textContent =
      p==='press' ? 'Who is getting written about' : 'Competitor live adverts right now');
    $$('[data-role="creatives-sub"]').forEach(h=> h.textContent =
      p==='press' ? 'Press mentions this quarter, from Signal AI. The bright slice is positive coverage.'
                  : 'Real ad examples pulled from public ad libraries.');
    renderAllCreatives();   // activity chart stays Google-only
  }
  // Bind the gallery controls (platform toggle + Gallery/List) within one card
  // root — called for the page on load, and for each lightbox clone on expand.
  function wireCreatives(card){
    if(!card) return;
    card.querySelectorAll('.plat-toggle button').forEach(b=> b.onclick=()=> switchPlatform(b.dataset.plat));
  }

  /* ================= WIRE ================= */
  function wire(){
    // Alphix view toggle is bound inside renderAlphix (root-scoped for the modal)
    // The competitor-ad chart's Q1/Q2 slider is built + wired inside renderSoV.
    creativeCards().forEach(wireCreatives);
    semCards().forEach(wireSem);
  }

  /* ================= NAV SCROLLSPY + REVEAL ================= */
  function observers(){
    const links = $$('.mi-nav a');
    const sections = links.map(a=> $(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ const id='#'+e.target.id; links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')===id)); } }); }, { rootMargin:'-45% 0px -50% 0px' });
    sections.forEach(s=>spy.observe(s));
    const rev = new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); rev.unobserve(e.target); } }); }, { rootMargin:'0px 0px -6% 0px' });
    $$('[data-reveal]:not(.in)').forEach(el=>rev.observe(el));
    links.forEach(a=> a.onclick=(e)=>{ e.preventDefault(); $(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'}); });
  }

  /* ================= GO ================= */
  renderContentBlocks();
  renderHighlightCards();
  renderAllSem(); renderAllSearchTerms(); renderAllLiChannel(); renderAllLiAudience(); renderAllLiPosts(); renderAllForms(); renderAllLiAds(); renderAllProspects(); renderRiChapters(); renderRiCompanies(); renderRiRequests(); renderRiCto();
  renderStages();
  heroSlider();
  renderKPIs();
  renderSearchVisibility(); renderSearchTable(); renderAllSeo(); renderAllSemPerf(); renderSoV(); renderAllCreatives();
  renderVisits(); renderTopPages();
  renderAlphix();
  renderLinkedIn();
  renderEmailSummary(); renderAllEmail();
  renderEvents(); renderResults(); renderSpine();
  wire(); observers();
  arrangeFilters();
  // Deterministic re-fit passes: correct any chart that initialised while its
  // container was briefly narrow (off-screen page, unsettled carousel, or an
  // embedding pane sized without a window.resize event). Timers fire even when
  // rAF/observer delivery is paused, so these catch what those miss.
  resizeAllCharts();
  window.addEventListener('load', resizeAllCharts);
  setTimeout(resizeAllCharts, 300);
  setTimeout(resizeAllCharts, 1200);
})();
