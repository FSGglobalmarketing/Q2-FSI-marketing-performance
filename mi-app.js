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
    alphixView: 'page',
    alphixPage: 0,
    creativeView: 'gallery',
    comp: new Set(D.COMPETITORS.map(c => c.name)),
    fmt: new Set(D.FORMATS),
    campTab: 'email',
  };

  const HUES = [12, 210, 160, 45, 275, 320, 95, 190];
  function avatarColor(name){ let h=0; for(const ch of name) h=(h*31+ch.charCodeAt(0))>>>0; return `oklch(0.58 0.12 ${HUES[h%HUES.length]})`; }
  function initials(name){ return name.split(/\s|\+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
  const pct1 = x => (x*100).toFixed(1)+'%';

  /* ================= CONTENT BLOCK (compact: summary + key results) ================= */
  function contentBlock(key){
    const d = D.CB[key]; if(!d) return '';
    const kr = d.results.map(r=>`<div class="kr"><b>${r.v}</b><i>${r.l}</i><span class="bench ${r.up?'pos':'neg'}">vs ${r.b} benchmark</span></div>`).join('');
    return `<p class="lead-sum" data-anim>${d.summary}</p>
      <div class="kr-grid" data-anim>${kr}</div>`;
  }
  function renderContentBlocks(){ $$('.cb-mount').forEach(m => m.innerHTML = contentBlock(m.dataset.cb)); }

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
  function renderSearchVisibility(){
    const data = D.searchVisibility();
    C.lines($('#search-visibility'), data, [
      { key:'us', color:'var(--c-us)', us:true },
      { key:'peer', color:'var(--c-muted)', dash:true },
    ], { height:230, pct:true });
  }
  function renderSearchTable(){
    const rows = D.SEARCH_QUERIES;
    $('#search-table').innerHTML = `<table class="tbl"><thead><tr>
      <th>Search term</th><th class="num">Times shown</th><th class="num">Clicks</th><th class="num">Click rate</th><th class="num">Avg. position</th>
      </tr></thead><tbody>${rows.map(r=>`<tr>
        <td class="strong">${r.q}</td>
        <td class="num">${D.fmtInt(r.imp)}</td>
        <td class="num">${D.fmtInt(r.clicks)}</td>
        <td class="num">${pct1(r.ctr)}</td>
        <td class="num"><span class="pill ${r.pos<=5?'pos':''}">${r.pos.toFixed(1)}</span></td>
      </tr>`).join('')}</tbody></table>`;
  }
  function renderSoV(){
    const sov = D.shareOfVoice()[state.sov];
    const rows = sov.map(r=>({ name:r.name, share:r.share, us:r.us, color:D.COMPETITORS.find(c=>c.name===r.name)?.color }));
    C.hbars($('#sov-chart'), rows, { pct:true, dark:true, labelW:120 });
  }
  function renderCompChips(){
    $('#comp-chips').innerHTML = D.COMPETITORS.map(c=>`<button class="chip ${state.comp.has(c.name)?'on':'off'}" data-comp="${c.name}"><span class="dot" style="background:${c.color}"></span>${c.name}</button>`).join('');
    $('#fmt-chips').innerHTML = D.FORMATS.map(f=>`<button class="chip ${state.fmt.has(f)?'on':'off'}" data-fmt="${f}">${f}</button>`).join('');
    $$('#comp-chips .chip').forEach(b=> b.onclick=()=>{ const n=b.dataset.comp; state.comp.has(n)?state.comp.delete(n):state.comp.add(n); if(!state.comp.size)state.comp.add(n); renderCompChips(); renderCreatives(); });
    $$('#fmt-chips .chip').forEach(b=> b.onclick=()=>{ const n=b.dataset.fmt; state.fmt.has(n)?state.fmt.delete(n):state.fmt.add(n); if(!state.fmt.size)state.fmt.add(n); renderCompChips(); renderCreatives(); });
  }
  function renderCreatives(){
    const list = D.creatives().filter(c=> state.comp.has(c.competitor) && state.fmt.has(c.format));
    const host = $('#creatives');
    if(!list.length){ host.className=''; host.innerHTML = `<p class="muted-txt">No adverts match those filters.</p>`; return; }
    if(state.creativeView==='gallery'){
      host.className='creative-grid'; host.style.padding='';
      host.innerHTML = list.map(c=>`
        <div class="creative">
          <div class="creative-thumb"><span class="fmt">${c.format}</span><span class="ph">${c.theme} advert</span></div>
          <div class="creative-body">
            <div class="adv"><span class="swatch" style="background:${c.color}"></span>${c.competitor}</div>
            <div class="meta">
              <div class="mrow"><span>Theme</span><span class="mono">${c.theme}</span></div>
              <div class="mrow"><span>Running since</span><span class="mono">${c.firstShown}</span></div>
              <div class="mrow"><span>Last seen</span><span class="mono">${c.lastShown}</span></div>
              <div class="mrow"><span>Variations</span><span class="mono">${c.variants}</span></div>
            </div>
          </div>
        </div>`).join('');
    } else {
      host.className='creative-list card on-dark'; host.style.padding='6px 14px';
      host.innerHTML = `<div class="clrow clhead">
          <span></span><span>Competitor</span><span>Theme</span><span class="clhide">Format</span><span class="clhide">Since</span><span class="clhide">Variations</span></div>` +
        list.map(c=>`<div class="clrow">
          <div class="clthumb"></div>
          <div class="strong"><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};margin-right:8px"></span>${c.competitor}</div>
          <div>${c.theme}</div>
          <div class="clhide"><span class="pill">${c.format}</span></div>
          <div class="clhide mono" style="font-size:12.5px">${c.firstShown}</div>
          <div class="clhide mono" style="font-size:12.5px">${c.variants}</div>
        </div>`).join('');
    }
  }

  /* ================= ENGAGEMENT ================= */
  function renderVisits(){
    C.lines($('#chart-visits'), D.visitsSeries(), [
      { key:'sessions', color:'var(--c-a)', us:true },
      { key:'prev', color:'var(--c-muted)', dash:true },
    ], { height:240 });
  }
  function renderTopPages(){
    const rows = D.TOP_PAGES, max = Math.max(...rows.map(r=>r.views));
    $('#top-pages').innerHTML = `<table class="tbl"><tbody>${rows.map(r=>`<tr>
      <td><div class="strong">${r.title}</div><div class="muted mono" style="font-size:12px">${r.path}</div></td>
      <td class="num" style="width:160px"><div class="cellbar"><i style="width:${r.views/max*100}%"></i></div></td>
      <td class="num strong" style="width:64px">${D.fmtK(r.views)}</td>
    </tr>`).join('')}</tbody></table>`;
  }
  function renderAlphixSummary(){
    const s = D.FIRMS_SUMMARY;
    $('#alphix-summary').innerHTML = [
      { v:s.companies, l:'companies identified' },
      { v:'+'+s.newCompanies, l:'new this quarter' },
      { v:s.tier1, l:'Tier-1 targets' },
      { v:s.topIndustry, l:'top industry' },
    ].map(x=>`<div><b style="font-size:24px;font-weight:600;display:block;letter-spacing:-.02em">${x.v}</b><span style="font-size:12.5px;color:var(--ink-2)">${x.l}</span></div>`).join('');
  }
  function renderPagePicker(){
    $('#page-picker').innerHTML = D.KEY_PAGES.map((p,i)=>`
      <button class="page-tab ${i===state.alphixPage?'on':''}" data-page="${i}">
        <span class="pt-url">${p.title}</span><span class="pt-meta mono">${p.path}</span>
      </button>`).join('');
    $$('#page-picker .page-tab').forEach(b=> b.onclick=()=>{ state.alphixPage=+b.dataset.page; renderPagePicker(); renderAlphixTable(); });
  }
  function firmRow(f, showPage){
    return `<tr>
      <td><div class="firm-cell">
        <span class="avatar" style="background:${avatarColor(f.firm)}">${initials(f.firm)}</span>
        <span class="fmeta"><span class="strong">${f.firm}</span><small>${f.domain}</small></span>
      </div></td>
      <td class="muted">${f.industry}</td>
      ${showPage?`<td class="muted mono" style="font-size:12px">${f.topPage||''}</td>`:''}
      <td class="num strong">${D.fmtInt(f.views)}</td>
      <td class="num">${f.sessions}</td>
      <td class="num"><span class="pill ${f.delta>=0?'pos':'neg'}">${f.delta>=0?'+':''}${f.delta}%</span></td>
    </tr>`;
  }
  function renderAlphixTable(){
    if(state.alphixView==='page'){
      $('#alphix-pagepicker-wrap').style.display='';
      const firms = D.firmsByPage(state.alphixPage);
      $('#alphix-table').innerHTML = `<table class="tbl"><thead><tr>
        <th>Company</th><th>Industry</th><th class="num">Page views</th><th class="num">Visits</th><th class="num">Trend</th>
        </tr></thead><tbody>${firms.map(f=>firmRow(f,false)).join('')}</tbody></table>`;
    } else {
      $('#alphix-pagepicker-wrap').style.display='none';
      const map = {};
      D.KEY_PAGES.forEach((pg,i)=> D.firmsByPage(i).forEach(f=>{
        if(!map[f.firm] || f.views>map[f.firm].views) map[f.firm]={...f, topPage:pg.path};
        else map[f.firm].views += Math.round(f.views*0.4);
      }));
      const firms = Object.values(map).sort((a,b)=>b.views-a.views).slice(0,10);
      $('#alphix-table').innerHTML = `<table class="tbl"><thead><tr>
        <th>Company</th><th>Industry</th><th>Most-read page</th><th class="num">Page views</th><th class="num">Visits</th><th class="num">Trend</th>
        </tr></thead><tbody>${firms.map(f=>firmRow(f,true)).join('')}</tbody></table>`;
    }
  }
  function renderLinkedIn(){
    const li = D.linkedin();
    const kpi = (v,l)=>`<div class="kpi"><b>${v}</b><div class="kl">${l}</div></div>`;
    $('#li-organic').innerHTML = kpi(li.organic.impressions,'People reached') + kpi(li.organic.clicks,'Clicks') + kpi(li.organic.engRate,'Engagement rate');
    $('#li-paid').innerHTML    = kpi(li.paid.impressions,'People reached') + kpi(li.paid.conversions,'Leads') + kpi(li.paid.spend,'Spend');
    C.hbars($('#li-bench'), li.bench.map(b=>({ name:b.name, v:b.rate, rate:b.rate, us:b.us })), { rate:true, labelW:120 });
    $('#li-posts').innerHTML = `<table class="tbl"><thead><tr>
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
  function renderCampPanel(){
    const panel = $('#camp-panel');
    if(state.campTab==='email'){
      $('#camp-title').textContent='Email performance'; $('#camp-source').textContent='Email platform';
      panel.innerHTML = `<table class="tbl"><thead><tr><th>Email</th><th class="num">Opened</th><th class="num">Open rate</th><th class="num">Click rate</th></tr></thead>
        <tbody>${D.EMAILS.map(r=>`<tr><td class="strong">${r.name}</td><td class="num">${D.fmtInt(r.opens)}</td><td class="num">${r.openRate}%</td><td class="num">${r.clickRate}%</td></tr>`).join('')}</tbody></table>`;
    } else if(state.campTab==='tracker'){
      $('#camp-title').textContent='Live campaign tracker'; $('#camp-source').textContent='Campaign tracker';
      const stColor = s=> s==='Live'?'pos': s==='Planned'?'':'warm';
      panel.innerHTML = `<table class="tbl"><thead><tr><th>Activity</th><th>Channel</th><th>Region</th><th>Owner</th><th>Go-live</th><th class="num">Spend</th><th>Status</th></tr></thead>
        <tbody>${D.CAMPAIGNS.map(r=>`<tr>
          <td class="strong">${r.key?'★ ':''}${r.title}</td><td class="muted">${r.channel}</td><td class="muted">${r.region}</td><td class="muted">${r.lead}</td>
          <td class="mono" style="font-size:12.5px">${r.goLive}</td><td class="num">$${(r.spend/1000)}k</td>
          <td><span class="pill ${stColor(r.status)}">${r.status}</span></td>
        </tr>`).join('')}</tbody></table>`;
    } else {
      $('#camp-title').textContent='Sales pipeline'; $('#camp-source').textContent='CRM';
      const d = D.DEALS;
      panel.innerHTML = `<div class="row-between" style="margin-bottom:20px">
          <div><b style="font-size:28px">${d.pipeline}</b><div class="kl">open pipeline</div></div>
          <div><b style="font-size:28px">${d.won}</b><div class="kl">won this quarter</div></div>
          <div><b style="font-size:28px">${d.count}</b><div class="kl">deals closed</div></div>
        </div><div class="chart-wrap" id="deal-bars"></div>`;
      C.bars($('#deal-bars'), d.stages.map(s=>({ label:s.stage, v:s.v, color:'var(--c-us)' })), { height:230 });
    }
  }

  /* ================= LOYALTY ================= */
  function renderEvents(){
    C.donut($('#events-donut'), 0.60, { size:118 });
    const pts = D.EVENTS.map(e=>`<div title="${e.name}" style="position:absolute;left:${e.x*100}%;top:${e.y*100}%;transform:translate(-50%,-50%)">
        <span style="display:block;width:14px;height:14px;border-radius:50%;background:${e.status==='Delivered'?'var(--c-us)':'var(--c-a)'};box-shadow:0 0 0 4px color-mix(in srgb, ${e.status==='Delivered'?'var(--c-us)':'var(--c-a)'} 22%, transparent)"></span>
      </div>`).join('');
    $('#events-map').innerHTML = `<div style="position:relative;width:100%;aspect-ratio:2/1;background:radial-gradient(circle at 1px 1px, var(--hair-2) 1px, transparent 0) 0 0/22px 22px;border-radius:12px;overflow:hidden">${pts}</div>`;
    $('#events-table').innerHTML = `<table class="tbl"><thead><tr><th>Event</th><th>City</th><th>Status</th></tr></thead>
      <tbody>${D.EVENTS.map(e=>`<tr><td class="strong">${e.name}</td><td class="muted">${e.city}</td><td><span class="pill ${e.status==='Delivered'?'pos':'warm'}">${e.status}</span></td></tr>`).join('')}</tbody></table>`;
  }

  /* ================= RESULTS ================= */
  function renderResults(){
    $('#branches').innerHTML = D.RESULTS.map(r=>`
      <div class="branch"><div class="bl"><span class="bdot"></span>${r.stage}</div>
        <div class="bmeta">${r.meta}</div>
        <div class="bpills">${r.pills.map(([t,k])=>`<span class="pill ${k}">${t}</span>`).join('')}</div>
      </div>`).join('');
  }

  /* ================= WIRE ================= */
  function wire(){
    $$('#alphix-view button').forEach(b=> b.onclick=()=>{ state.alphixView=b.dataset.view; $$('#alphix-view button').forEach(x=>x.classList.toggle('on',x===b)); renderAlphixTable(); });
    $$('#sov-toggle button').forEach(b=> b.onclick=()=>{ state.sov=b.dataset.sov; $$('#sov-toggle button').forEach(x=>x.classList.toggle('on',x===b)); renderSoV(); });
    $$('#creative-view button').forEach(b=> b.onclick=()=>{ state.creativeView=b.dataset.view; $$('#creative-view button').forEach(x=>x.classList.toggle('on',x===b)); renderCreatives(); });
    $$('#camp-tabs button').forEach(b=> b.onclick=()=>{ state.campTab=b.dataset.tab; $$('#camp-tabs button').forEach(x=>x.classList.toggle('on',x===b)); renderCampPanel(); });
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
  heroSlider();
  renderKPIs();
  renderSearchVisibility(); renderSearchTable(); renderSoV(); renderCompChips(); renderCreatives();
  renderVisits(); renderTopPages();
  renderAlphixSummary(); renderPagePicker(); renderAlphixTable();
  renderLinkedIn();
  renderEmailSummary(); renderCampPanel();
  renderEvents(); renderResults();
  wire(); observers();
})();
