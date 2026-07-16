/* ============================================================
   mi-present.js — full-screen presentation controller.
   • Wheel / arrow / space advances one page at a time.
   • Pages with a .carousel expose sub-steps in the same flow.
   • Every page's [data-anim] elements stagger in on entry.
   ============================================================ */
(function () {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const deck   = $('#deck');
  const pages  = $$('.page', deck);
  const nav    = $('#p-nav');
  const navBtns= $$('#nav-links button');
  const rail   = $('#p-progress');
  const hint   = $('#scroll-hint');

  let pi = 0;
  let moved = false;
  let LB = null;

  /* ---------- carousels ---------- */
  const pageCar = pages.map(page => {
    const car = $('.carousel', page);
    if(!car) return null;
    const track  = $('.carousel-track', car);
    const slides = $$('.cslide', car);
    const dotsEl = $('.cdots', car);
    const label  = document.createElement('div');
    const prev   = $('[data-cdir="-1"]', car);
    const next   = $('[data-cdir="1"]', car);
    // build dots
    dotsEl.innerHTML = slides.map((_,i)=>`<button class="cdot ${i===0?'on':''}" data-ci="${i}" aria-label="Slide ${i+1}"></button>`).join('');
    const obj = { car, track, slides, dotsEl, prev, next, idx:0 };
    $$('.cdot', dotsEl).forEach(d => d.onclick = () => setCarousel(obj, +d.dataset.ci));
    if(prev) prev.onclick = () => setCarousel(obj, obj.idx-1);
    if(next) next.onclick = () => setCarousel(obj, obj.idx+1);
    return obj;
  });

  function setCarousel(c, idx, instant){
    idx = Math.max(0, Math.min(c.slides.length-1, idx));
    c.idx = idx;
    if(instant){ c.track.style.transition = 'none'; }
    c.track.style.transform = `translateX(${-idx*100}%)`;
    if(instant){ requestAnimationFrame(()=>{ c.track.style.transition = ''; }); }
    $$('.cdot', c.dotsEl).forEach((d,i)=> d.classList.toggle('on', i===idx));
    if(c.prev) c.prev.disabled = idx===0;
    if(c.next) c.next.disabled = idx===c.slides.length-1;
    fitCarousel(c);
  }
  // Size the viewport to the active slide so a short slide leaves no gap.
  function fitCarousel(c){
    if(!c) return;
    const vp = $('.carousel-viewport', c.car), active = c.slides[c.idx];
    if(vp && active){ const h = active.offsetHeight; if(h) vp.style.height = h + 'px'; }
  }
  const fitAll = () => pageCar.forEach(c => fitCarousel(c));
  window.MI_fitCarousels = fitAll;   // mi-app calls this after the gallery re-renders
  window.addEventListener('resize', fitAll);

  /* ---------- progress rail ---------- */
  rail.innerHTML = pages.map((p,i)=>`<button data-p="${i}" class="${i===0?'on':''}" aria-label="${p.dataset.label||('Page '+(i+1))}"></button>`).join('');
  $$('#p-progress button').forEach(b => b.onclick = () => goPage(+b.dataset.p));
  navBtns.forEach(b => b.onclick = () => goPage(+b.dataset.goto));

  /* ---------- mega menu (Apple-style: hover a section, jump to any page) ---------- */
  (function megaMenu(){
    const navLinks = $('#nav-links');
    if(!navLinks || !navBtns.length) return;
    const gotos = navBtns.map(b => +b.dataset.goto);
    const wrap = document.createElement('div'); wrap.className = 'mega'; wrap.id = 'mega';
    navBtns.forEach((btn, i) => {
      const start = i === 0 ? 0 : gotos[i];                       // first section also lists the Cover
      const end   = i < gotos.length - 1 ? gotos[i + 1] : pages.length;
      let items = '';
      for(let p = start; p < end; p++){
        const pg = pages[p];
        const label = pg.dataset.label || ('Page ' + (p + 1));
        const sub = (pg.querySelector('.p-sub')?.textContent || '').trim();
        const kind = pg.classList.contains('divider') ? 'section' : pg.classList.contains('cover-page') ? 'cover' : 'page';
        items += `<button class="mega-item" data-goto="${p}" data-kind="${kind}">
            <span class="mi-num">${String(p + 1).padStart(2,'0')}</span>
            <span class="mi-txt"><span class="mi-label">${label}</span>${sub?`<span class="mi-sub">${sub}</span>`:''}</span>
          </button>`;
      }
      const panel = document.createElement('div'); panel.className = 'mega-panel'; panel.dataset.for = i;
      panel.innerHTML = `<div class="mega-head">${btn.textContent}</div><div class="mega-inner">${items}</div>`;
      wrap.appendChild(panel);
    });
    nav.appendChild(wrap);
    const panels = $$('.mega-panel', wrap);
    let t;
    const clear = () => clearTimeout(t);
    function open(i){
      clear();
      const wr = wrap.getBoundingClientRect(), br = navBtns[i].getBoundingClientRect();
      panels[i].style.left = Math.round(br.left - wr.left) + 'px';   // align under the hovered section
      wrap.classList.add('open');
      panels.forEach(p => p.classList.toggle('show', +p.dataset.for === i));
      navBtns.forEach((b, bi) => b.classList.toggle('mega-on', bi === i));
    }
    function shut(){ t = setTimeout(() => {
      wrap.classList.remove('open'); panels.forEach(p => p.classList.remove('show'));
      navBtns.forEach(b => b.classList.remove('mega-on'));
    }, 160); }
    navBtns.forEach((b, i) => { b.addEventListener('mouseenter', () => open(i)); b.addEventListener('focus', () => open(i)); });
    navLinks.addEventListener('mouseleave', shut);
    wrap.addEventListener('mouseenter', clear);
    wrap.addEventListener('mouseleave', shut);
    $$('.mega-item', wrap).forEach(it => it.addEventListener('click', () => {
      clear(); wrap.classList.remove('open'); panels.forEach(p => p.classList.remove('show')); navBtns.forEach(b => b.classList.remove('mega-on'));
      goPage(+it.dataset.goto);
    }));
  })();

  /* ---------- stagger entrance ---------- */
  function stagger(page){
    const items = $$('[data-anim]', page);
    items.forEach((el,i)=> el.style.setProperty('--d', (i*90)+'ms'));
  }

  /* ---------- chrome (nav theme, active states) ---------- */
  function chrome(){
    const dark = pages[pi].dataset.nav === 'dark';
    nav.classList.toggle('on-dark', dark);
    rail.classList.toggle('on-dark-rail', dark);
    $$('#p-progress button').forEach((b,i)=> b.classList.toggle('on', i===pi));
    // nav link active = greatest goto <= pi
    let active = null;
    navBtns.forEach(b => { if(+b.dataset.goto <= pi) active = b; });
    navBtns.forEach(b => b.classList.toggle('on', b===active));
    if(moved) hint.classList.add('hide');
  }

  /* ---------- page transition ---------- */
  function setPage(np, dir){
    if(np === pi) return;
    pages.forEach((p,i)=>{
      p.classList.toggle('active', i===np);
      p.classList.toggle('up', i<np);
    });
    pi = np;
    const c = pageCar[pi];
    if(c) setCarousel(c, dir < 0 ? c.slides.length-1 : 0, true);
    stagger(pages[pi]);
    chrome();
  }

  function goPage(np){
    np = Math.max(0, Math.min(pages.length-1, np));
    if(np !== pi){ moved = true; setPage(np, np>pi?1:-1); }
  }

  /* ---------- unified step (carousel sub-steps + pages) ---------- */
  function step(dir){
    moved = true;
    const c = pageCar[pi];
    if(dir > 0){
      if(c && c.idx < c.slides.length-1){ setCarousel(c, c.idx+1); chrome(); return; }
      if(pi < pages.length-1) setPage(pi+1, 1);
    } else {
      if(c && c.idx > 0){ setCarousel(c, c.idx-1); chrome(); return; }
      if(pi > 0) setPage(pi-1, -1);
    }
  }

  /* ---------- input ---------- */
  let lock = false;
  function guard(){ if(lock) return false; lock = true; setTimeout(()=>lock=false, 780); return true; }

  window.addEventListener('wheel', (e) => {
    if(LB && LB.isOpen()) return;
    // allow native scroll inside a scrollable panel that still has room
    const sc = e.target.closest && e.target.closest('.slide-scroll');
    if(sc){
      const down = e.deltaY > 0 && sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1;
      const up   = e.deltaY < 0 && sc.scrollTop > 0;
      if(down || up) return;
    }
    e.preventDefault();
    if(Math.abs(e.deltaY) < 6) return;
    if(!guard()) return;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive:false });

  window.addEventListener('keydown', (e) => {
    if(LB && LB.isOpen()) return;
    const k = e.key;
    if(['ArrowDown','PageDown','ArrowRight',' '].includes(k)){ e.preventDefault(); if(guard()) step(1); }
    else if(['ArrowUp','PageUp','ArrowLeft'].includes(k)){ e.preventDefault(); if(guard()) step(-1); }
    else if(k === 'Home'){ e.preventDefault(); goPage(0); }
    else if(k === 'End'){ e.preventDefault(); goPage(pages.length-1); }
  });

  // touch swipe (vertical)
  let ty = null;
  window.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive:true });
  window.addEventListener('touchend', e => {
    if(ty === null) return;
    const dy = ty - e.changedTouches[0].clientY;
    if(Math.abs(dy) > 44 && guard()) step(dy > 0 ? 1 : -1);
    ty = null;
  }, { passive:true });

  /* ---------- FOCUS SLIDER (Q1 ⟷ Q2) ---------- */
  const FOCUS = [
    { label: 'Q1 2026', items: [
      { t: 'GEM campaign in ANZ',   d: 'Established the GEM campaign in ANZ and set the regional narrative for the year ahead.' },
      { t: 'Search foundations',    d: 'Rebuilt technical SEO and search foundations for our priority, non-branded terms.' },
      { t: 'Always-on engine',      d: 'Stood up the always-on content engine across the website, email and LinkedIn.' },
    ]},
    { label: 'Q2 2026', items: [
      { t: 'GEM capabilities',      d: 'Continue to build messaging on GEM capabilities across always-on channels and search.' },
      { t: 'Homepage redesign',     d: 'Launched the global homepage redesign, optimised for search, mobile and the user experience.' },
      { t: 'Content globalisation', d: 'A global content review process to accelerate delivery and share regional content worldwide.' },
    ]},
  ];
  let fq = 1;
  function renderFocus(q){
    const host = $('#focus-cards'); if(!host) return;
    host.innerHTML = FOCUS[q].items.map((it,i)=>`
      <div class="card focus-card fc-anim" style="animation-delay:${i*110}ms">
        <div class="fnum">${FOCUS[q].label} · 0${i+1}</div>
        <h3>${it.t}</h3>
        <p>${it.d}</p>
      </div>`).join('');
  }
  function focusSlider(){
    const track = $('#fs-track'); if(!track) return;
    const wrap  = $('.focus-slider');
    const fill  = $('.fs-fill', track);
    const handle= $('.fs-handle', track);
    const ends  = $$('.q-end');
    const ratio = (x) => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1,(x-r.left)/r.width)); };
    function paint(rt){ fill.style.width = (rt*100)+'%'; handle.style.left = (rt*100)+'%'; }
    function markEnds(q){ ends.forEach(e => e.classList.toggle('on', +e.dataset.q===q)); }
    function setQ(q, animate){ q = q?1:0; wrap.classList.toggle('fs-anim', !!animate); paint(q); markEnds(q); if(q!==fq){ fq=q; renderFocus(q); } }

    let dragging = false;
    handle.addEventListener('pointerdown', e => { dragging = true; wrap.classList.remove('fs-anim'); handle.setPointerCapture(e.pointerId); e.preventDefault(); });
    handle.addEventListener('pointermove', e => {
      if(!dragging) return;
      const rt = ratio(e.clientX); paint(rt);
      const q = rt>0.5?1:0; if(q!==fq){ fq=q; markEnds(q); renderFocus(q); }
    });
    handle.addEventListener('pointerup', e => { if(!dragging) return; dragging=false; setQ(ratio(e.clientX)>0.5?1:0, true); });
    track.addEventListener('click', e => { if(e.target===handle) return; setQ(ratio(e.clientX)>0.5?1:0, true); });
    ends.forEach(b => b.onclick = () => setQ(+b.dataset.q, true));

    paint(fq); markEnds(fq); renderFocus(fq);
  }

  /* ---------- CHART LIGHTBOX ---------- */
  const ICON_EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7"/></svg>';
  const ICON_CLOSE  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

  function lightbox(){
    const lb = document.createElement('div');
    lb.className = 'lightbox'; lb.id = 'lightbox'; lb.setAttribute('aria-hidden','true');
    lb.innerHTML =
      '<div class="lb-backdrop"></div>' +
      '<div class="lb-panel dark" role="dialog" aria-modal="true">' +
        '<div class="lb-head"><span class="lb-title"></span>' +
        '<button class="lb-close" aria-label="Close">' + ICON_CLOSE + '</button></div>' +
        '<div class="lb-scroll"></div>' +
      '</div>';
    document.body.appendChild(lb);
    const scroll = $('.lb-scroll', lb);
    const titleEl = $('.lb-title', lb);

    function open(source, title){
      scroll.innerHTML = '';
      // a carousel expands each of its slides; a standalone card expands itself
      const slides = $$('.cslide', source);
      const sources = slides.length ? slides.map(sl => sl.firstElementChild) : [source];
      sources.forEach(src => {
        if(!src) return;
        const clone = src.cloneNode(true);
        clone.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
        clone.querySelectorAll('.expand-btn').forEach(b => b.remove());
        // cloneNode copies ECharts' _echarts_instance_ marker, which would make
        // getInstanceByDom(clone) resolve to the ORIGINAL chart's instance and
        // redraw into the page instead of the modal. Strip it so each modal
        // chart initialises fresh into its own (cloned) container.
        [clone, ...clone.querySelectorAll('[_echarts_instance_]')].forEach(e => e.removeAttribute && e.removeAttribute('_echarts_instance_'));
        clone.classList.remove('on-dark');
        scroll.appendChild(clone);
      });
      titleEl.textContent = title || 'Charts';
      lb.classList.add('open'); lb.setAttribute('aria-hidden','false');
      scroll.scrollTop = 0;
      // Force a synchronous layout so the now-visible panel reports real
      // dimensions, then render live charts + interactive widgets. Done
      // synchronously (not via rAF, which is paused in background tabs) so
      // ECharts sizes correctly and controls (country switcher, sliders)
      // rebind fresh handlers. [data-chart]/[data-widget] keys survive the
      // clone even though ids are stripped.
      void scroll.offsetHeight;
      scroll.querySelectorAll('[data-chart]').forEach(el => {
        try { window.MI_renderChart && window.MI_renderChart(el.dataset.chart, el, { modal:true }); } catch(e){}
      });
      scroll.querySelectorAll('[data-widget]').forEach(el => {
        try { window.MI_renderWidget && window.MI_renderWidget(el.dataset.widget, el); } catch(e){}
      });
    }
    function close(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); scroll.innerHTML = ''; }

    $('.lb-close', lb).onclick = close;
    $('.lb-backdrop', lb).onclick = close;
    window.addEventListener('keydown', e => { if(e.key === 'Escape' && lb.classList.contains('open')){ e.stopPropagation(); close(); } });
    return { open, close, isOpen: () => lb.classList.contains('open') };
  }

  function addExpandButtons(lbox){
    function makeExpandable(card, source, title){
      if($('.expand-btn', card)) return;
      const btn = document.createElement('button');
      btn.className = 'expand-btn'; btn.type = 'button';
      btn.setAttribute('aria-label', 'Expand');
      btn.innerHTML = ICON_EXPAND;
      btn.addEventListener('click', e => { e.stopPropagation(); lbox.open(source, title); });
      card.appendChild(btn);
      // clicking anywhere on the widget (except interactive controls) opens it too
      card.classList.add('expandable');
      card.addEventListener('click', e => {
        // never treat a click on an interactive control (incl. the Q1/Q2 slider)
        // as an "expand" — dragging the slider must not open the lightbox.
        if(e.target.closest('button, a, input, select, textarea, .seg, .chip, .page-tab, .cdot, .focus-slider, .chips')) return;
        lbox.open(source, title);
      });
    }
    $$('.carousel').forEach(car => {
      const title = (car.closest('.page')?.dataset.label) || 'Charts';
      $$('.cslide > .card, .cslide > .chart-card, .cslide > .map-wrap', car).forEach(card => makeExpandable(card, car, title));
    });
    // standalone cards (e.g. Alphix) that aren't inside a carousel
    $$('[data-expandable]').forEach(card => {
      const title = (card.closest('.page')?.dataset.label) || 'Details';
      makeExpandable(card, card, title);
    });
  }

  /* ---------- init ---------- */
  pages[0].classList.add('active');
  stagger(pages[0]);
  focusSlider();
  LB = lightbox();
  addExpandButtons(LB);
  chrome();
  fitAll();
})();
