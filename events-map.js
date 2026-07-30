/* events-map.js — Leaflet map + schedule for FSI's 2026 events.
   Source: GLOBAL 2026 events and sponsorship calendar.xlsx, filtered to
   Brand containing FSI and Status in {Committed, Proprietary event,
   Distribution owned}. FSI's owned activity fell in the Q1 reporting-season
   roadshow; there were no FSI-owned events in Q2 (next wave from July), so the
   Q2 view shows an empty state. City coordinates are hard-coded; co-located
   pins fan out on a small ring. The map fits to the selected quarter's pins.
   Detected by CSS class (not id) so the lightbox clone gets its own live map. */
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

  function popup(e) {
    var dates = e.end ? (e.start + ' to ' + e.end) : e.start;
    var rows = [['Dates', dates], ['City', e.city], ['Status', e.status], ['Host', e.host],
      ['Format', e.format], ['Audience', e.audience], ['Speaking slot?', e.speaking],
      ['Speaker', e.speaker], ['Brand', e.brand || 'FSI'], ['Asset Class', e.asset]]
      .filter(function (r) { return r[1]; })
      .map(function (r) { return '<div class="evp-row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');
    return '<div class="evp"><div class="evp-title" style="border-color:' + COL[e.q] + '">' + esc(e.name) + '</div>' + rows + '</div>';
  }

  var CSS = ''
    + '.events-map{background:#0f0d0b;position:relative}'
    + '.ev-empty{position:absolute;inset:0;z-index:450;display:flex;align-items:center;justify-content:center;pointer-events:none;color:var(--dark-ink-2,#b3ada0);font:13px/1.4 "IBM Plex Sans",system-ui,sans-serif;background:rgba(15,13,11,.4);text-align:center;padding:20px}'
    + '.ev-popup .leaflet-popup-content-wrapper{background:#1c1a17;color:#f4f1ea;border:1px solid rgba(245,241,234,.16);border-radius:12px;box-shadow:0 18px 50px -20px rgba(0,0,0,.8)}'
    + '.ev-popup .leaflet-popup-content{margin:12px 14px;font:12.5px/1.4 "IBM Plex Sans",system-ui,sans-serif}'
    + '.ev-popup .leaflet-popup-tip{background:#1c1a17;border:1px solid rgba(245,241,234,.16)}'
    + '.ev-popup a.leaflet-popup-close-button{color:#b3ada0}'
    + '.evp-title{font-size:14px;font-weight:600;padding:0 0 8px;margin-bottom:8px;border-bottom:2px solid}'
    + '.evp-row{display:flex;justify-content:space-between;gap:16px;padding:2px 0}'
    + '.evp-row span{color:#b3ada0}.evp-row b{color:#f4f1ea;font-weight:500;text-align:right;max-width:62%}'
    + '.leaflet-bar a{background:#1c1a17;color:#f4f1ea;border-color:rgba(245,241,234,.16)}'
    + '.leaflet-bar a:hover{background:#2a2621}'
    + '.leaflet-control-attribution{background:rgba(20,18,15,.7);color:#8b877d}.leaflet-control-attribution a{color:#b3ada0}'
    + '.ev-tbl{width:100%;border-collapse:collapse;font-size:12.5px}'
    + '.ev-tbl th{position:sticky;top:0;background:#14120f;color:var(--dark-ink-2,#b3ada0);text-align:left;font-weight:500;padding:8px 12px;white-space:nowrap;border-bottom:1px solid rgba(245,241,234,.16)}'
    + '.ev-tbl td{padding:8px 12px;border-bottom:1px solid rgba(245,241,234,.08);vertical-align:top}'
    + '.ev-tbl tbody tr:hover{background:rgba(255,255,255,.05)}'
    + '.ev-tbl .evq{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px}'
    + '.ev-tbl .evname{color:var(--dark-ink,#f4f1ea);font-weight:500}';

  // Quarter slider (Q1 <-> Q2), same look as the deck's chart sliders.
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
    var map = L.map(el, {
      zoomControl: true, scrollWheelZoom: inModal, worldCopyJump: false,
      minZoom: 2, maxZoom: 14, maxBounds: [[-85, -180], [85, 180]], maxBoundsViscosity: 0.9,
    }).setView(HOME.center, HOME.zoom);
    el._evMap = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO', subdomains: 'abcd', maxZoom: 19, noWrap: true,
    }).addTo(map);

    var empty = document.createElement('div');
    empty.className = 'ev-empty'; empty.textContent = 'No FSI-owned events in Q2. The next wave begins in July.';
    empty.style.display = 'none'; el.appendChild(empty);

    var seen = {}, markers = [];
    EV.forEach(function (e) {
      var key = e.ll.join(','); var n = seen[key] || 0; seen[key] = n + 1;
      var lat = e.ll[0], lng = e.ll[1];
      if (n) { var a = n * (Math.PI * 2 / 5), r = 0.9; lat += Math.sin(a) * r; lng += Math.cos(a) * r; }
      var m = L.circleMarker([lat, lng], { radius: 7, color: '#fff', weight: 1.5, fillColor: COL[e.q], fillOpacity: 0.92 });
      m.bindPopup(popup(e), { className: 'ev-popup', maxWidth: 300, autoPan: true });
      m.bindTooltip(e.name, { direction: 'top', offset: [0, -6] });
      m._evq = e.q; markers.push(m);
    });

    function apply() {   // show the quarter's pins and frame them
      var shown = [];
      markers.forEach(function (m) {
        if (m._evq === state.q) { if (!map.hasLayer(m)) m.addTo(map); shown.push(m); }
        else if (map.hasLayer(m)) map.removeLayer(m);
      });
      if (shown.length) {
        empty.style.display = 'none';
        try { map.fitBounds(L.featureGroup(shown).getBounds().pad(0.35), { maxZoom: 6, animate: false }); } catch (err) {}
      } else {
        empty.style.display = 'flex';
      }
    }

    var mount = (el.closest('.card') || el.parentNode).querySelector('.ev-slider-mount');
    if (mount) { mount.innerHTML = ''; mount.appendChild(makeSlider(state.q, function (q) { state.q = q; apply(); })); }
    apply();

    function fix() { map.invalidateSize(); apply(); }
    window.addEventListener('resize', fix);
    var page = el.closest('.page');
    if (page && window.MutationObserver) new MutationObserver(function () { if (page.classList.contains('active')) setTimeout(fix, 80); }).observe(page, { attributes: true, attributeFilter: ['class'] });
    setTimeout(fix, 120); setTimeout(fix, 500);
  }

  function buildTable(el) {
    if (el._evTable) return; el._evTable = true;
    var cols = ['Dates', 'Event', 'City', 'Status', 'Host', 'Format', 'Audience', 'Speaking', 'Speaker', 'Asset Class'];
    var order = { q1: 0, q2: 1 };
    var rows = EV.slice().sort(function (a, b) { return order[a.q] - order[b.q] || new Date(a.start) - new Date(b.start); });
    var body = rows.map(function (e) {
      var dates = e.end ? (e.start + ' to ' + e.end) : e.start;
      var c = [dates, '<span class="evq" style="background:' + COL[e.q] + '"></span><span class="evname">' + esc(e.name) + '</span>',
        e.city, e.status, e.host, e.format, e.audience, e.speaking, e.speaker, e.asset];
      return '<tr>' + c.map(function (v, i) { return '<td>' + (i === 1 ? v : esc(v) || '') + '</td>'; }).join('') + '</tr>';
    }).join('');
    el.innerHTML = '<table class="ev-tbl"><thead><tr>' + cols.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table>';
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
