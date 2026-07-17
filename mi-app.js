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
    platform: 'google',      // competitor ads: 'google' (Ads Transparency) | 'linkedin' (Ad Library)
    semChannel: 'search',    // NA campaign SEM: 'search' | 'display'
    semBucket: 'All',        // ad-group bucket tab (single-select)
    seoScope: null,          // SEO rankings scope (country/strategy); defaults to first
    stTheme: 'All',          // search-terms theme filter
    emailDim: 'campaign',    // email engagement dimension (campaign/country/company)
    liGroup: 'All',          // LinkedIn ad-group tab (campaign id, or 'All')
    prospectDim: 'fund',    // slice the served prospects by 'fund' or 'date'
    prospectBucket: 'All',
    alphixRegion: 'all',
    alphixOpen: new Set(),   // expanded company rows
    creativeView: 'gallery',
    comp: new Set(D.creatives().map(c => c.competitor)),   // competitors actually running ads
    fmt: new Set(D.FORMATS),
    campTab: 'email',
    pagesCountry: 'all',
  };

  const HUES = [12, 210, 160, 45, 275, 320, 95, 190];
  function avatarColor(name){ let h=0; for(const ch of name) h=(h*31+ch.charCodeAt(0))>>>0; return `oklch(0.58 0.12 ${HUES[h%HUES.length]})`; }
  function initials(name){ return name.split(/\s|\+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
  const pct1 = x => (x*100).toFixed(1)+'%';

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
    return `<div class="kr-grid" data-anim>${d.results.map(r=>`<div class="kr"><b>${r.v}</b><i>${r.l}</i>${r.b?`<span class="bench ${r.up?'pos':'neg'}">vs ${r.b} benchmark</span>`:''}</div>`).join('')}</div>`;
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
    const ul = a => (a&&a.length) ? `<ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul>` : '';
    const ol = a => (a&&a.length) ? `<ol>${a.map(x=>`<li>${x}</li>`).join('')}</ol>` : '';
    // Key results stay on the content pages — dividers show only Goals /
    // Marketing activities / Focus, small, under the big centred heading.
    const cards = [];
    if(s.goals&&s.goals.length)           cards.push(`<div class="glass-card"><h4>Goals</h4>${ol(s.goals)}</div>`);
    if(s.activities&&s.activities.length) cards.push(`<div class="glass-card"><h4>Marketing activities</h4>${ul(s.activities)}</div>`);
    if(s.q2&&s.q2.length)                 cards.push(`<div class="glass-card"><h4>Focus for Q2</h4>${ul(s.q2)}</div>`);
    if(s.q3&&s.q3.length)                 cards.push(`<div class="glass-card"><h4>Focus for Q3</h4>${ul(s.q3)}</div>`);
    return `<div class="stage-grid">${cards.join('')}</div>`;
  }
  // Injected by JS so no per-repo divider markup changes are needed: the stage
  // is derived from each divider's data-label ("Service & loyalty" -> serviceloyalty).
  function renderStages(){
    if(!D.STAGES) return;
    $$('.page.divider').forEach(sec => {
      const key = (sec.dataset.label||'').toLowerCase().replace(/[^a-z]/g,'');
      const s = D.STAGES[key]; if(!s) return;
      const inner = sec.querySelector('.page-inner'); if(!inner || inner.querySelector('.stage-grid')) return;
      sec.classList.add('has-stage');  // keep .center — big heading stays centred
      const mount = document.createElement('div');
      mount.className = 'stage-mount'; mount.setAttribute('data-anim','');
      mount.innerHTML = stageBlock(s);
      inner.appendChild(mount);
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
    const inst = echInit(el, modal ? '62vh' : '248px');
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
  // Competitor ad activity — real live-ad counts per advertiser, Q1 vs Q2.
  // The slider (built into the card head) chooses the quarter.
  // Activity chart is Google-only: LinkedIn ad counts conflate unrelated
  // business units (the name search catches homonyms), so we don't chart them —
  // the LinkedIn value is the theme-screened example gallery instead.
  function renderSoV(el, opts){
    el = el || $('#sov-chart'); if(!el) return;
    opts = opts || {};
    const q = opts.quarter || state.sovQ || 'q2';
    ensureSovSlider(el, q);
    const rows = (D.adSoV()[q] || []).map(r=>({ name:r.name, v:r.v, color:r.color }));
    if(!rows.length){ el.innerHTML = '<p class="muted-txt" style="padding:20px 4px">No competitor ads recorded for this quarter.</p>'; return; }
    if(window.echarts){ try { return echartsHBars(el, rows, Object.assign({ labelW:130, valUnit:' ads' }, opts)); } catch(e){ console.warn('echarts sov', e); } }
    C.hbars(el, rows, { dark:true, labelW:120 });
  }
  function removeSovSlider(chartEl){
    const card = chartEl.closest('.chart-card, .card'); if(!card) return;
    const sl = card.querySelector('.card-head .chart-q-slider'); if(sl) sl.remove();
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
    const commit = qq => { qq=qq?1:0; ends.forEach(e=>e.classList.toggle('on', +e.dataset.q===qq)); paint(qq);
      if(qq!==cur){ cur=qq; onCommit(qq?'q2':'q1'); } };
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
  function renderCreatives(card){
    card = card || creativeCards()[0]; if(!card) return;
    const host = card.querySelector('[data-role="creatives"]'); if(!host) return;
    const li = state.platform === 'linkedin';
    const list = currentCreatives().filter(c=> state.comp.has(c.competitor) && (li || state.fmt.has(c.format)));
    if(!list.length){ host.className=''; host.innerHTML = `<p class="muted-txt">No adverts match those filters.</p>`; return; }
    const dash = '<span class="muted">—</span>';
    const linkLabel = li ? 'View on LinkedIn ↗' : 'View ad ↗';
    const view = c => c.preview ? `<a class="creative-link" href="${c.preview}" target="_blank" rel="noopener">${linkLabel}</a>` : '';
    const esc = s => String(s||'').replace(/"/g,'&quot;');
    const escT = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    // Real ad creative as the thumbnail; if it 404s later, onerror reveals the
    // format placeholder instead. LinkedIn creatives are theme-screened examples.
    const thumb = c => { const badge = li ? 'LinkedIn' : (c.format||'Ad');
      return c.image
      ? `<div class="creative-thumb has-img"><span class="fmt">${badge}</span><img src="${esc(c.image)}" alt="${esc(c.advertiser||c.competitor)} ad" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.creative-thumb').classList.remove('has-img');this.remove()"><span class="ph">${badge} ad</span></div>`
      : `<div class="creative-thumb"><span class="fmt">${badge}</span><span class="ph">${badge} ad</span></div>`; };
    const metaRows = c =>
      `<div class="mrow"><span>Advertiser</span><span class="mono" title="${esc(c.advertiser||'')}">${c.advertiser||c.competitor}</span></div>
       <div class="mrow"><span>Running since</span><span class="mono">${c.firstShown||dash}</span></div>
       <div class="mrow"><span>Last seen</span><span class="mono">${c.lastShown||dash}</span></div>
       <div class="mrow"><span>Variations</span><span class="mono">${c.variants||dash}</span></div>`;
    if(state.creativeView==='gallery'){
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
    } else if(li){
      host.className='slide-scroll creative-list card on-dark'; host.style.padding='6px 14px';
      host.innerHTML = list.map(c=>`<div class="clrow li-clrow">
          <div class="clthumb${c.image?' has-img':''}">${c.image?`<img src="${esc(c.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.clthumb').classList.remove('has-img');this.remove()">`:''}</div>
          <div class="li-listbody">
            <div class="strong"><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};margin-right:8px"></span>${c.competitor} <span class="mono" style="opacity:.7;font-size:11.5px">· ${esc(c.advertiser||'')}</span></div>
            <div class="li-listcopy">${escT(c.copy||'')}</div>
          </div>
          <div>${view(c)}</div>
        </div>`).join('');
    } else {
      host.className='slide-scroll creative-list card on-dark'; host.style.padding='6px 14px';
      host.innerHTML = `<div class="clrow clhead">
          <span></span><span>Competitor</span><span>Advertiser</span><span class="clhide">Format</span><span class="clhide">Since</span><span class="clhide">Variations</span></div>` +
        list.map(c=>`<div class="clrow">
          <div class="clthumb${c.image?' has-img':''}">${c.image?`<img src="${esc(c.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.clthumb').classList.remove('has-img');this.remove()">`:''}</div>
          <div class="strong"><span class="dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c.color};margin-right:8px"></span>${c.competitor}</div>
          <div class="mono" style="font-size:12.5px" title="${c.advertiser||''}">${c.advertiser||c.competitor}</div>
          <div class="clhide"><span class="pill">${c.format}</span></div>
          <div class="clhide mono" style="font-size:12.5px">${c.firstShown||dash}</div>
          <div class="clhide mono" style="font-size:12.5px">${c.variants||dash}</div>
        </div>`).join('');
    }
  }

  /* ================= HIGHLIGHTS (campaign features, own datasets) ================= */
  // Goals + Marketing-activities cards for a highlight page (reuses the divider
  // .glass-card look). Mounted via [data-hl="<key>"].
  function renderHighlightCards(){
    $$('[data-hl]').forEach(mount => {
      const h = D.HIGHLIGHTS && D.HIGHLIGHTS[mount.dataset.hl]; if(!h) return;
      const li = a => a.map(x=>`<li>${x}</li>`).join('');
      mount.innerHTML = `<div class="stage-grid">
        <div class="glass-card"><h4>Goals</h4><ol>${li(h.goals)}</ol></div>
        <div class="glass-card"><h4>Marketing activities</h4><ul>${li(h.activities)}</ul></div>
      </div>`;
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
      ? 'One responsive display ad — Google mixes these two images with six headlines and five descriptions. 271,631 impressions at 3.43% CTR for £1,081. Bars rank the copy that earned the clicks.'
      : 'Keywords by impressions, with clicks stacked inside the bar — 51,646 impressions at 6.89% CTR.';
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
        ? `2,400 distinct queries actually triggered our ads. <strong>Data centres are 56%</strong> of them — and 40% carry retail intent (“stocks”, “reits”, “etf”), not the institutional buyers NADIF targets. Brand terms are tiny but convert at <strong>26% CTR</strong>.`
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
      sub.innerHTML = `Our Salesforce pipeline, uploaded to LinkedIn as the <strong>${P.list}</strong> list — ${P.served} of ${P.prospects}`
        + ` matched prospects served, ${P.impr.toLocaleString()} impressions, ${P.engaged} of them clicking or watching.`
        + ` The spend landed where it was aimed: <strong>${100-spill}%</strong> of delivery went to this list and no competitor was served.`
        + `<br/>Showing the top ${Math.min(cap, sel.length)} of ${scope} — ${sel.reduce((t,r)=>t+r.i,0).toLocaleString()} impressions. Paid metrics only.`;
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
        ? `${g.name} — ${g.impr.toLocaleString()} impressions and ${g.clicks.toLocaleString()} clicks (${(g.clicks/g.impr*100).toFixed(2)}% CTR) for £${g.spend.toLocaleString()}.`
        : 'Every ad we ran, by impressions. Statics and Videos were a clean test — same objective, same bidding. Video bought a third of the reach for much the same money, but earned nearly three times the click rate.';
    }
  }
  function renderLiAds(card){
    const host = card.querySelector('[data-role="liads"]'); if(!host) return;
    const esc = s => String(s||'').replace(/"/g,'&quot;');
    const escT = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    host.className = 'slide-scroll creative-grid';
    host.innerHTML = liAdRows().map(a=>{
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
          <div class="mrow"><span>Clicks</span><span class="mono">${a.c.toLocaleString()} · ${ctr}%</span></div>
          ${a.wave?`<div class="mrow"><span>Wave</span><span class="mono">${a.wave}</span></div>`:''}
        </div>
      </div>`;
    }).join('');
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
    el.style.height = opts.modal ? '54vh' : '240px';
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
  function bindResize(el, inst){ if(!el._miResize){ el._miResize=true; window.addEventListener('resize', ()=>{ try{ inst.resize(); }catch(e){} }); } }

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
              axisLabel:{ color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Sans', fontSize:12.5 } },
      series:[
        { name:(opts.hitName||'Clicks'), type:'bar', stack:'t', data:clk, barWidth:14, itemStyle:{ color:cUs, borderRadius:[7,0,0,7] } },
        { name:'Impressions', type:'bar', stack:'t', data:rest, barWidth:14, itemStyle:{ color:cRest, borderRadius:[0,7,7,0] },
          label:{ show:true, position:'right', color:dark?'#f4f1ea':'#1c1b18', fontFamily:'IBM Plex Mono', fontSize:11.5,
            formatter: p => { const r = rev[p.dataIndex]; return r.impr>=1000 ? (r.impr/1000).toFixed(1)+'k' : String(r.impr); } } },
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

  function renderLinkedInBench(el, opts){
    el = el || $('#li-bench'); if(!el) return;
    const rows = D.linkedin().bench.map(b=>({ name:b.name, rate:b.rate, us:b.us }));
    if(window.echarts){ try { return echartsHBars(el, rows, Object.assign({ rate:true, labelW:120 }, opts)); } catch(e){ console.warn('echarts bench', e); } }
    C.hbars(el, rows, { rate:true, labelW:120 });
  }
  function renderDealBars(el, opts){
    el = el || $('#deal-bars'); if(!el) return;
    const rows = D.DEALS.stages.map(s=>({ label:s.stage, v:s.v }));
    if(window.echarts){ try { return echartsBars(el, rows, Object.assign({ height:230 }, opts)); } catch(e){ console.warn('echarts deals', e); } }
    C.bars(el, rows.map(s=>({ ...s, color:'var(--c-us)' })), { height:230 });
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
      if(key === 'li-bench')   return renderLinkedInBench(el, opts);
      if(key === 'deal-bars')  return renderDealBars(el, opts);
      if(key === 'na-audience') return renderNaAudience(el, opts);
      if(key === 'ri-chapters') return renderRiChapters(el, opts);
      if(key === 'ri-companies')return renderRiCompanies(el, opts);
    } catch(e){ console.warn('MI_renderChart', key, e); }
  };
  // The GA4 top-pages come as country-specific URLs (/europe/…, /usa/…, …).
  // Derive the country from the first path segment so we can group the same
  // page across regions and offer a country filter.
  const COUNTRY_MAP = { europe:'Europe', usa:'US', us:'US', australia:'Australia', anz:'Australia', asia:'Asia', uk:'UK', global:'Global' };
  function pageCountry(path){ const m=/^\/([a-z]+)/i.exec(path||''); const k=m&&m[1].toLowerCase(); return COUNTRY_MAP[k]||'Global'; }
  function fmtDur(s){ s=Math.round(s||0); if(!s) return ''; return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
  function chanClass(ch){ return 'ch-'+String(ch||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  // root defaults to the document; the modal passes its cloned card so the
  // country switcher rebinds live handlers inside the lightbox. Elements are
  // found by data-attr (not id) because the lightbox strips ids on clones.
  function renderTopPages(root){
    root = root || document;
    const all = (D.TOP_PAGES||[]).map(r=>({ ...r, country: pageCountry(r.path) }));
    const countries = ['all', ...[...new Set(all.map(r=>r.country))]];
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
    const dash = '<span class="muted">—</span>';
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
      if(key === 'seo'){ renderSeoTabs(el); renderSeoChart(el); return; }
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
      const rec = by[f.firm] || (by[f.firm] = { firm:f.firm, domain:f.domain, industry:f.industry, total:0, visits:0, pages:[] });
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
    if(sumEl){ const s = D.FIRMS_SUMMARY;
      sumEl.innerHTML = [
        { v:s.companies, l:'companies identified' },
        { v:s.identifiedPct, l:'of views identified to a company', pct:true },
        { v:s.topIndustry, l:'top industry' },
        { v:s.newCompanies, l:'new this quarter', plus:true },
      ].filter(x => x.v !== undefined && x.v !== null && x.v !== '' && x.v !== 0)
       .map(x=>`<div><b style="font-size:24px;font-weight:600;display:block;letter-spacing:-.02em">${x.plus?'+':''}${x.v}${x.pct?'%':''}</b><span class="alx-sub">${x.l}</span></div>`).join('');
    }
    const pages = alphixPages();
    const regions = ['all', ...[...new Set(pages.map(p=>p.region))]];
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
    if(!companies.length){ tableEl.innerHTML = `<p class="muted-txt" style="padding:14px 4px">No companies in this region.</p>`; return; }
    tableEl.innerHTML = `<div class="firm-list">${companies.map(c=>{
      const open = state.alphixOpen.has(c.firm);
      return `<div class="firm-row ${open?'open':''}" data-firm="${c.firm}">
        <button class="firm-head" type="button" aria-expanded="${open}">
          <span class="firm-chev">${ALX_CHEV}</span>
          <span class="firm-cell"><span class="avatar" style="background:${avatarColor(c.firm)}">${initials(c.firm)}</span>
            <span class="fmeta"><span class="strong">${c.firm}</span><small>${c.domain}</small></span></span>
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
    $('#li-organic').innerHTML = kpi(li.organic.impressions,'People reached') + kpi(li.organic.clicks,'Clicks') + kpi(li.organic.engRate,'Engagement rate');
    $('#li-paid').innerHTML    = kpi(li.paid.impressions,'People reached') + kpi(li.paid.conversions,'Leads') + kpi(li.paid.spend,'Spend');
    renderLinkedInBench($('#li-bench'));
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
    if(note){ const d=currentEmailDim(); const modal=!!card.closest('.lb-scroll'); const cap=modal?22:12;
      const shown = d ? Math.min(cap, d.rows.length) : 0;
      const plural = { campaign:'campaigns', country:'countries', company:'companies' };
      const noun = d ? (plural[d.key] || d.label.toLowerCase()+'s') : '';
      note.innerHTML = d
        ? `Top ${shown} ${noun}${d.rows.length>shown?` of ${d.rows.length}`:''} by activity. ${E.note}`
        : E.note;
    }
  }
  function renderEmailChart(card){
    const E=emailEngData(); if(!E) return;
    const el = card.querySelector('[data-role="email-chart"]'); if(!el || !window.echarts) return;
    const d = currentEmailDim(); if(!d) return;
    const modal = !!card.closest('.lb-scroll'); const cap = modal?22:12;
    const rows = d.rows.slice(0, cap).map(r=>({ name:r.n, impr:(r.o||0)+(r.c||0), clicks:(r.c||0), _o:r.o||0, _c:r.c||0, _e:r.e||0 }));
    const tipRows = r => `Opens ${r._o.toLocaleString()}<br/>Clicks ${r._c.toLocaleString()}<br/>Emails engaged ${r._e}`;
    try { echartsStackedHBars(el, rows, { labelW: modal?280:214, hitName:'Clicks', tipRows, modal }); }
    catch(e){ console.warn('email-eng', e); }
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
        </div><div class="chart-wrap" id="deal-bars" data-chart="deal-bars"></div>`;
      renderDealBars($('#deal-bars'));
    }
  }

  /* ================= LOYALTY ================= */
  function renderEvents(){
    renderEventsDonut($('#events-donut'));
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

  // Switch the whole competitor-ads section between Google and LinkedIn: reset the
  // competitor/format filters to the new platform's set. Toggles + re-renders every
  // mounted gallery (page + any open lightbox clone) so they stay in sync.
  function switchPlatform(p){
    if(state.platform !== p){
      state.platform = p;
      state.comp = new Set(creativeComps().map(c=>c.name));
      if(p === 'google') state.fmt = new Set(D.FORMATS);
    }
    $$('.plat-toggle button').forEach(b=> b.classList.toggle('on', b.dataset.plat===p));
    renderAllCreatives();   // activity chart stays Google-only
  }
  // Bind the gallery controls (platform toggle + Gallery/List) within one card
  // root — called for the page on load, and for each lightbox clone on expand.
  function wireCreatives(card){
    if(!card) return;
    card.querySelectorAll('.plat-toggle button').forEach(b=> b.onclick=()=> switchPlatform(b.dataset.plat));
    card.querySelectorAll('[data-role="view"] button').forEach(b=> b.onclick=()=>{ state.creativeView=b.dataset.view; $$('[data-role="view"] button').forEach(x=>x.classList.toggle('on', x.dataset.view===b.dataset.view)); renderAllCreatives(); });
  }

  /* ================= WIRE ================= */
  function wire(){
    // Alphix view toggle is bound inside renderAlphix (root-scoped for the modal)
    // The competitor-ad chart's Q1/Q2 slider is built + wired inside renderSoV.
    creativeCards().forEach(wireCreatives);
    semCards().forEach(wireSem);
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
  renderHighlightCards();
  renderAllSem(); renderAllSearchTerms(); renderAllLiAds(); renderAllProspects(); renderRiChapters(); renderRiCompanies();
  renderStages();
  heroSlider();
  renderKPIs();
  renderSearchVisibility(); renderSearchTable(); renderAllSeo(); renderSoV(); renderAllCreatives();
  renderVisits(); renderTopPages();
  renderAlphix();
  renderLinkedIn();
  renderEmailSummary(); renderCampPanel(); renderAllEmail();
  renderEvents(); renderResults();
  wire(); observers();
})();
