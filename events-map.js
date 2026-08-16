/* events-map.js — Leaflet map + schedule for FSI's Q1 & Q2 2026 events.
   Both quarters shown at once, colour-coded; the slider emphasises the selected
   quarter. The map repeats/fills (no letterbox) and pins stay aligned. Clicking a
   schedule row opens a modal with the pin meta (plus photos/write-up where set). */
(function () {
  var DEFAULT_Q = 'q1';
  var HOME = { center: [-15, 140], zoom: 3 };
  var EV = [
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'1 Mar 2026', end:'', city:'Sydney', status:'Committed', host:'FSI', format:'Boardroom lunch', audience:'Broker / LGT Wealth', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-33.8688,151.2093] },
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'5 Mar 2026', end:'', city:'Melbourne', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'Broker / LGT Wealth', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-37.8136,144.9631] },
    { q:'q1', name:'Post reporting season / XX20 launch / LGT Crestone', start:'4 Mar 2026', end:'5 Mar 2026', city:'Melbourne', status:'Distribution owned', host:'', format:'Conference', audience:'WS adviser', speaking:'', speaker:'Dushko / David / Chris', asset:'AEQ', brand:'FSI', ll:[-37.8136,144.9631] },
    { q:'q1', name:'Civitas Services Conference', start:'10 Mar 2026', end:'13 Mar 2026', city:'Port Douglas', status:'Distribution owned', host:'Civitas Services', format:'Conference', audience:'WS adviser', speaking:'', speaker:'David Wilson', asset:'AEQ Growth, RQI, GLIS, FSSA GEM', brand:'FSI', ll:[-16.4834,145.4650] },
    { q:'q1', name:'Adelaide Round table', start:'10 Mar 2026', end:'', city:'Adelaide', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-34.9285,138.6007] },
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'10 Mar 2026', end:'', city:'Townsville', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-19.2590,146.8169] },
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'11 Mar 2026', end:'', city:'Adelaide', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-34.9285,138.6007] },
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'11 Mar 2026', end:'', city:'Cairns', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-16.9186,145.7781] },
    { q:'q1', name:'Perth Roundtable lunch', start:'11 Mar 2026', end:'', city:'Perth', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-31.9505,115.8605] },
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'12 Mar 2026', end:'', city:'Perth', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-31.9505,115.8605] },
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'12 Mar 2026', end:'', city:'Gold Coast', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-28.0167,153.4000] },
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'16 Mar 2026', end:'', city:'Mooloolaba', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-26.6819,153.1189] },
    { q:'q1', name:'Reporting season & XX20 launch roundtable', start:'19 Mar 2026', end:'', city:'Toowoomba', status:'Committed', host:'FSI', format:'Roundtable Lunch', audience:'WS adviser', speaking:'', speaker:'Dushko / David', asset:'AEQ', brand:'FSI', ll:[-27.5598,151.9507] },
    { q:'q1', name:'Cathay / GLIS media roundtable', start:'31 Mar 2026', end:'', city:'Taipei', status:'Committed', host:'FSI', format:'Roundtable', audience:'Wholesale and institutional', speaking:'', speaker:'Edmund Leung', asset:'GLIS', brand:'FSI', ll:[25.0330,121.5654] },
  ];

  var COL = { q1: '#7aa7ff', q2: '#ff6a3d' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };

  function metaRows(e) {
    var dates = e.end ? (e.start + ' to ' + e.end) : e.start;
    return [['Dates', dates], ['City', e.city], ['Status', e.status], ['Host', e.host],
      ['Format', e.format], ['Audience', e.audience], ['Speaking slot?', e.speaking],
      ['Speaker', e.speaker], ['Brand', e.brand], ['Asset Class', e.asset]]
      .filter(function (r) { return r[1]; })
      .map(function (r) { return '<div class="evp-row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');
  }
  function popup(e) {
    var hint = (e.desc || (e.photos && e.photos.length)) ? '<div class="evp-more">Click the schedule row for photos and the write-up.</div>' : '';
    return '<div class="evp"><div class="evp-title" style="border-color:' + COL[e.q] + '">' + esc(e.name) + '</div>' + metaRows(e) + hint + '</div>';
  }

  // ---- event modal: meta + photos + write-up ----
  function eventModal() {
    var ov = document.createElement('div'); ov.className = 'ev-modal'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<div class="ev-modal-backdrop"></div><div class="ev-modal-panel dark" role="dialog" aria-modal="true">'
      + '<button class="ev-modal-close" type="button" aria-label="Close">✕</button><div class="ev-modal-body"></div></div>';
    document.body.appendChild(ov);
    var body = ov.querySelector('.ev-modal-body');
    function close() { ov.classList.remove('open'); ov.setAttribute('aria-hidden', 'true'); }
    ov.querySelector('.ev-modal-close').onclick = close;
    ov.querySelector('.ev-modal-backdrop').onclick = close;
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('open')) close(); });
    return function open(e) {
      var photos = (e.photos || []).map(function (p) { return '<figure><img src="' + p + '" loading="lazy"></figure>'; }).join('');
      body.innerHTML =
        '<div class="ev-modal-head" style="border-color:' + COL[e.q] + '"><span class="evq" style="background:' + COL[e.q] + '"></span><h3>' + esc(e.name) + '</h3></div>'
        + (e.desc ? '<p class="ev-modal-desc">' + esc(e.desc) + '</p>' : '')
        + (photos ? '<div class="rj-gallery ev-modal-gallery">' + photos + '</div>' : '<p class="ev-modal-nophoto">No photos for this event.</p>')
        + '<div class="ev-modal-meta">' + metaRows(e) + '</div>';
      ov.classList.add('open'); ov.setAttribute('aria-hidden', 'false'); body.scrollTop = 0;
    };
  }
  var openEvent = null;

  var CSS = ''
    + '.events-map{background:#0f0d0b;position:relative}'
    + '.ev-empty{position:absolute;inset:0;z-index:450;display:flex;align-items:center;justify-content:center;pointer-events:none;color:var(--dark-ink-2,#b3ada0);font:13px/1.4 "IBM Plex Sans",system-ui,sans-serif;background:rgba(15,13,11,.4);text-align:center;padding:20px}'
    + '.ev-legend{position:absolute;left:12px;bottom:12px;z-index:450;display:flex;gap:14px;background:rgba(20,18,15,.72);border:1px solid rgba(245,241,234,.16);border-radius:9px;padding:6px 10px;font:11.5px/1 "IBM Plex Sans",system-ui,sans-serif;color:#e9e5dc;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}'
    + '.ev-legend span{display:inline-flex;align-items:center;gap:6px}.ev-legend i{width:9px;height:9px;border-radius:50%;display:inline-block}'
    + '.ev-popup .leaflet-popup-content-wrapper{background:#1c1a17;color:#f4f1ea;border:1px solid rgba(245,241,234,.16);border-radius:12px;box-shadow:0 18px 50px -20px rgba(0,0,0,.8)}'
    + '.ev-popup .leaflet-popup-content{margin:12px 14px;font:12.5px/1.4 "IBM Plex Sans",system-ui,sans-serif}'
    + '.ev-popup .leaflet-popup-tip{background:#1c1a17;border:1px solid rgba(245,241,234,.16)}'
    + '.ev-popup a.leaflet-popup-close-button{color:#b3ada0}'
    + '.evp-title{font-size:14px;font-weight:600;padding:0 0 8px;margin-bottom:8px;border-bottom:2px solid}'
    + '.evp-row{display:flex;justify-content:space-between;gap:16px;padding:2px 0}'
    + '.evp-row span{color:#b3ada0}.evp-row b{color:#f4f1ea;font-weight:500;text-align:right;max-width:62%}'
    + '.evp-more{margin-top:8px;padding-top:8px;border-top:1px solid rgba(245,241,234,.12);color:#b3ada0;font-size:11.5px}'
    + '.leaflet-bar a{background:#1c1a17;color:#f4f1ea;border-color:rgba(245,241,234,.16)}'
    + '.leaflet-bar a:hover{background:#2a2621}'
    + '.leaflet-control-attribution{background:rgba(20,18,15,.7);color:#8b877d}.leaflet-control-attribution a{color:#b3ada0}'
    + '.ev-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'
    + '.ev-tbl th{position:sticky;top:0;background:#14120f;color:var(--dark-ink-2,#b3ada0);text-align:left;font-weight:500;padding:8px 12px;white-space:nowrap;border-bottom:1px solid rgba(245,241,234,.16)}'
    + '.ev-tbl td{padding:8px 12px;border-bottom:1px solid rgba(245,241,234,.08);vertical-align:top}'
    + '.ev-tbl tbody tr{cursor:pointer}.ev-tbl tbody tr:hover{background:rgba(255,255,255,.06)}'
    + '.ev-tbl tbody tr:hover .evname{text-decoration:underline}'
    + '.ev-tbl .evq{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px}'
    + '.ev-tbl .evname{color:var(--dark-ink,#f4f1ea);font-weight:500}'
    + '.ev-tbl .ev-has{color:#b3ada0;font-size:11px;margin-left:8px}'
    // modal
    + '.ev-modal{position:fixed;inset:0;z-index:9000;display:none}.ev-modal.open{display:block}'
    + '.ev-modal-backdrop{position:absolute;inset:0;background:rgba(8,7,6,.72);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}'
    + '.ev-modal-panel{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(880px,92vw);max-height:88vh;overflow:auto;background:#191613;border:1px solid rgba(245,241,234,.16);border-radius:16px;box-shadow:0 40px 120px -30px rgba(0,0,0,.85);padding:26px 28px}'
    + '.ev-modal-close{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:10px;border:1px solid rgba(245,241,234,.18);background:rgba(24,21,18,.6);color:#e9e5dc;cursor:pointer;font-size:15px;line-height:1}'
    + '.ev-modal-close:hover{background:rgba(255,255,255,.12)}'
    + '.ev-modal-head{display:flex;align-items:center;gap:10px;padding-bottom:12px;margin-bottom:14px;border-bottom:2px solid}'
    + '.ev-modal-head .evq{width:11px;height:11px;border-radius:50%;flex:none}'
    + '.ev-modal-head h3{margin:0;font-size:22px;font-weight:600;color:#f7f4ee;letter-spacing:-.01em}'
    + '.ev-modal-desc{margin:0 0 16px;font-size:14.5px;line-height:1.55;color:#d7d2c8;max-width:120ch}'
    + '.ev-modal-nophoto{color:#8b877d;font-size:13px;margin:0 0 16px}'
    + '.ev-modal-gallery{margin:0 0 18px}'
    + '.ev-modal-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 28px;padding-top:14px;border-top:1px solid rgba(245,241,234,.12)}'
    + '@media (max-width:640px){.ev-modal-meta{grid-template-columns:1fr}}';

  // Quarter slider (Q1 <-> Q2) — emphasises the selected quarter; both stay on the map.
  function makeSlider(q, onChange) {
    var sl = document.createElement('div');
    sl.className = 'focus-slider chart-q-slider fs-anim';
    sl.innerHTML = '<button class="q-end ' + (q === 'q1' ? 'on' : '') + '" data-q="0">Q1</button>'
      + '<div class="fs-track"><div class="fs-fill"></div><div class="fs-handle"></div></div>'
      + '<button class="q-end ' + (q === 'q2' ? 'on' : '') + '" data-q="1">Q2</button>';
    var track = sl.querySelector('.fs-track'), fill = sl.querySelector('.fs-fill'),
        handle = sl.querySelector('.fs-handle'), ends = [].slice.call(sl.querySelectorAll('.q-end'));
    var cur = q === 'q2' ? 1 : 0, drag = false;
    function paint(rt) { fill.style.width = (rt * 100) + '%'; handle.style.left = (rt * 100) + '%'; }
    function ratio(x) { var r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (x - r.left) / r.width)); }
    function set(v, anim) { v = v ? 1 : 0; sl.classList.toggle('fs-anim', !!anim); paint(v); ends.forEach(function (e) { e.classList.toggle('on', +e.dataset.q === v); }); if (v !== cur) { cur = v; onChange(v ? 'q2' : 'q1'); } }
    handle.addEventListener('pointerdown', function (e) { drag = true; sl.classList.remove('fs-anim'); handle.setPointerCapture(e.pointerId); e.preventDefault(); });
    handle.addEventListener('pointermove', function (e) { if (!drag) return; var rt = ratio(e.clientX); paint(rt); var v = rt > 0.5 ? 1 : 0; ends.forEach(function (x) { x.classList.toggle('on', +x.dataset.q === v); }); });
    handle.addEventListener('pointerup', function (e) { if (!drag) return; drag = false; set(ratio(e.clientX) > 0.5 ? 1 : 0, true); });
    track.addEventListener('click', function (e) { if (e.target === handle) return; set(ratio(e.clientX) > 0.5 ? 1 : 0, true); });
    ends.forEach(function (b) { b.onclick = function () { set(+b.dataset.q, true); }; });
    paint(cur);
    return sl;
  }

  function buildMap(el) {
    if (el._evMap) return;
    var inModal = !!el.closest('.lb-scroll');
    el.innerHTML = '';
    var state = { q: DEFAULT_Q };
    // Repeating tiles (noWrap:false) fill the width so there is no letterbox;
    // minZoom is floored to a fill zoom in frame(). worldCopyJump is intentionally
    // OFF — with it on the map wraps and the markers drift off their countries.
    var map = L.map(el, {
      zoomControl: true, scrollWheelZoom: inModal, worldCopyJump: false,
      minZoom: 1, maxZoom: 14,
    }).setView(HOME.center, HOME.zoom);
    el._evMap = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO', subdomains: 'abcd', maxZoom: 19, noWrap: false,
    }).addTo(map);

    var legend = document.createElement('div');
    legend.className = 'ev-legend';
    legend.innerHTML = '<span><i style="background:' + COL.q1 + '"></i>Q1</span><span><i style="background:' + COL.q2 + '"></i>Q2</span>';
    el.appendChild(legend);

    var seen = {}, markers = [];
    EV.forEach(function (e) {
      var key = e.ll.join(','); var n = seen[key] || 0; seen[key] = n + 1;
      var lat = e.ll[0], lng = e.ll[1];
      if (n) { var a = n * (Math.PI * 2 / 5), r = 0.9; lat += Math.sin(a) * r; lng += Math.cos(a) * r; }
      var m = L.circleMarker([lat, lng], { radius: 7, color: '#fff', weight: 1.5, fillColor: COL[e.q], fillOpacity: 0.92 });
      m.bindPopup(popup(e), { className: 'ev-popup', maxWidth: 300, autoPan: true });
      m.bindTooltip(e.name, { direction: 'top', offset: [0, -6] });
      m.on('click', function () { if (openEvent && (e.desc || (e.photos && e.photos.length))) { /* popup still opens; row opens modal */ } });
      m._evq = e.q; m._ev = e; m.addTo(map); markers.push(m);
    });

    // apply() only restyles the pins (both quarters stay on the map); framing the
    // view is done in frame(), and only after invalidateSize() so the tile and
    // marker panes agree on the map size (otherwise the pins drift off-country).
    function apply() {
      markers.forEach(function (m) {
        var active = m._evq === state.q;
        m.setStyle({ fillColor: COL[m._evq], fillOpacity: active ? 0.95 : 0.4, opacity: active ? 1 : 0.55, radius: active ? 8 : 6 });
        if (active) m.bringToFront();
      });
    }
    function frame() {
      var s = map.getSize(); if (!s.x || !s.y) return;
      // floor the zoom so the world always covers the container (no letterbox)
      var fz = Math.max(1, Math.ceil(Math.log(Math.max(s.x, s.y) / 256) / Math.LN2));
      map.setMinZoom(fz);
      try { map.fitBounds(L.featureGroup(markers).getBounds().pad(0.25), { maxZoom: 6, animate: false }); } catch (err) {}
      if (map.getZoom() < fz) map.setZoom(fz);
    }

    var mount = (el.closest('.card') || el.parentNode).querySelector('.ev-slider-mount');
    if (mount) { mount.innerHTML = ''; mount.appendChild(makeSlider(state.q, function (q) { state.q = q; apply(); })); }
    apply();

    function fix() { map.invalidateSize(); frame(); apply(); }
    window.addEventListener('resize', fix);
    var page = el.closest('.page');
    if (page && window.MutationObserver) new MutationObserver(function () { if (page.classList.contains('active')) setTimeout(fix, 80); }).observe(page, { attributes: true, attributeFilter: ['class'] });
    setTimeout(fix, 120); setTimeout(fix, 500);
  }

  function buildTable(el) {
    if (el._evTable) return; el._evTable = true;
    if (!openEvent) openEvent = eventModal();
    var cols = ['Dates', 'Event', 'City', 'Status', 'Host', 'Format', 'Audience', 'Speaking', 'Speaker', 'Asset Class'];
    var order = { q1: 0, q2: 1 };
    var rows = EV.slice().sort(function (a, b) { return order[a.q] - order[b.q] || new Date(a.start) - new Date(b.start); });
    var body = rows.map(function (e, i) {
      var dates = e.end ? (e.start + ' to ' + e.end) : e.start;
      var has = (e.desc || (e.photos && e.photos.length)) ? '<span class="ev-has">▸ details</span>' : '';
      var c = [dates, '<span class="evq" style="background:' + COL[e.q] + '"></span><span class="evname">' + esc(e.name) + '</span>' + has,
        e.city, e.status, e.host, e.format, e.audience, e.speaking, e.speaker, e.asset];
      return '<tr data-ev="' + i + '">' + c.map(function (v, j) { return '<td>' + (j === 1 ? v : esc(v) || '') + '</td>'; }).join('') + '</tr>';
    }).join('');
    el.innerHTML = '<table class="ev-tbl"><thead><tr>' + cols.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table>';
    el.addEventListener('click', function (ev) {
      var tr = ev.target.closest && ev.target.closest('tr[data-ev]'); if (!tr) return;
      openEvent(rows[+tr.dataset.ev]);
    });
  }

  function scan() {
    [].forEach.call(document.querySelectorAll('.events-map'), function (el) { if (typeof L !== 'undefined' && !el._evMap) buildMap(el); });
    [].forEach.call(document.querySelectorAll('.events-table'), function (el) { if (!el._evTable) buildTable(el); });
  }

  function start() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    scan();
    if (window.MutationObserver) {
      var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(scan, 120); })
        .observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
