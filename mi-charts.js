/* ============================================================
   mi-charts.js — tiny dependency-free SVG chart helpers.
   All charts render into a container element and scale to width.
   Colors are passed as CSS values and applied via inline style
   (custom properties don't work in presentation attributes).
   ============================================================ */

window.MICHARTS = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const VW = 660; // viewBox width; height varies

  function svg(h){
    const s = document.createElementNS(NS,'svg');
    s.setAttribute('viewBox', `0 0 ${VW} ${h}`);
    s.setAttribute('preserveAspectRatio','none');
    s.style.width = '100%'; s.style.height = 'auto';
    return s;
  }
  function el(tag, attrs, style){
    const e = document.createElementNS(NS, tag);
    for(const k in attrs) e.setAttribute(k, attrs[k]);
    if(style) e.setAttribute('style', style);
    return e;
  }
  function niceMax(v){
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v/pow;
    const step = n<=1?1:n<=2?2:n<=5?5:10;
    return step*pow;
  }
  const money = n => n>=1e6?'$'+(n/1e6).toFixed(1)+'M':n>=1e3?'$'+Math.round(n/1e3)+'k':'$'+n;
  const kfmt  = n => n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?Math.round(n/1e3)+'k':Math.round(n);

  /* ---------- STACKED AREA (channels) or SIMPLE AREA ---------- */
  function area(container, data, keys, opts){
    opts = opts||{};
    container.innerHTML='';
    const H = opts.height||260, padL=44, padB=26, padT=14, padR=8;
    const s = svg(H); container.appendChild(s);
    const iw = VW-padL-padR, ih = H-padT-padB;
    const n = data.length;
    const X = i => padL + (n<=1?iw/2:iw*i/(n-1));
    // stacked totals
    const totals = data.map(d => keys.reduce((a,k)=>a+(d[k.key]||0),0));
    const max = niceMax(Math.max(...totals)*1.05);
    const Y = v => padT + ih - ih*(v/max);
    // gridlines
    for(let g=0; g<=4; g++){
      const val = max*g/4, y = Y(val);
      s.appendChild(el('line',{x1:padL,y1:y,x2:VW-padR,y2:y}, 'stroke:var(--hair);stroke-width:1'));
      const t = el('text',{x:padL-8,y:y+3,'text-anchor':'end'}); t.setAttribute('class','ax-label'); t.textContent=kfmt(val); s.appendChild(t);
    }
    // build stacked bands top-down
    let baseline = data.map(()=>0);
    keys.forEach((k)=>{
      const upper = data.map((d,i)=> baseline[i] + (d[k.key]||0));
      let path = '';
      upper.forEach((v,i)=> path += (i?'L':'M')+X(i)+' '+Y(v)+' ');
      for(let i=n-1;i>=0;i--) path += 'L'+X(i)+' '+Y(baseline[i])+' ';
      path += 'Z';
      s.appendChild(el('path',{d:path}, `fill:${k.color};opacity:${opts.simple?0.16:0.9}`));
      if(opts.simple){
        // top stroke
        let ls=''; upper.forEach((v,i)=> ls+=(i?'L':'M')+X(i)+' '+Y(v)+' ');
        s.appendChild(el('path',{d:ls}, `fill:none;stroke:${k.color};stroke-width:2.5`));
      }
      baseline = upper;
    });
    // x labels
    data.forEach((d,i)=>{
      if(n>12 && i%Math.ceil(n/12)!==0) return;
      const t = el('text',{x:X(i),y:H-8,'text-anchor':'middle'}); t.setAttribute('class','ax-label'); t.textContent=d.label; s.appendChild(t);
    });
  }

  /* ---------- MULTI-LINE (search share of voice over time etc) ---------- */
  function lines(container, data, keys, opts){
    opts=opts||{};
    container.innerHTML='';
    const H=opts.height||260, padL=40, padB=26, padT=14, padR=10;
    const s=svg(H); container.appendChild(s);
    const iw=VW-padL-padR, ih=H-padT-padB, n=data.length;
    const X=i=>padL+(n<=1?iw/2:iw*i/(n-1));
    let max=0; data.forEach(d=>keys.forEach(k=>max=Math.max(max,d[k.key]||0)));
    max=niceMax(max*1.1);
    const Y=v=>padT+ih-ih*(v/max);
    for(let g=0;g<=4;g++){ const y=Y(max*g/4);
      s.appendChild(el('line',{x1:padL,y1:y,x2:VW-padR,y2:y},'stroke:var(--hair);stroke-width:1'));
      const t=el('text',{x:padL-8,y:y+3,'text-anchor':'end'}); t.setAttribute('class','ax-label'); t.textContent=(opts.pct?Math.round(max*g/4)+'%':kfmt(max*g/4)); s.appendChild(t);
    }
    keys.forEach(k=>{
      let p=''; data.forEach((d,i)=> p+=(i?'L':'M')+X(i)+' '+Y(d[k.key]||0)+' ');
      s.appendChild(el('path',{d:p},`fill:none;stroke:${k.color};stroke-width:${k.us?3.4:2};${k.dash?'stroke-dasharray:4 4;':''}stroke-linejoin:round;stroke-linecap:round;opacity:${k.us?1:0.85}`));
      if(k.us){ const last=data.length-1; s.appendChild(el('circle',{cx:X(last),cy:Y(data[last][k.key]),r:4},`fill:${k.color}`)); }
    });
    data.forEach((d,i)=>{ if(n>12&&i%Math.ceil(n/12)!==0)return;
      const t=el('text',{x:X(i),y:H-8,'text-anchor':'middle'}); t.setAttribute('class','ax-label'); t.textContent=d.label; s.appendChild(t);
    });
  }

  /* ---------- GROUPED / SINGLE BARS ---------- */
  function bars(container, rows, opts){
    opts=opts||{};
    container.innerHTML='';
    const H=opts.height||240, padL=42, padB=42, padT=14, padR=8;
    const s=svg(H); container.appendChild(s);
    const iw=VW-padL-padR, ih=H-padT-padB, n=rows.length;
    const max=niceMax(Math.max(...rows.map(r=>r.v))*1.1);
    const Y=v=>padT+ih-ih*(v/max);
    const bw=iw/n*0.5, gap=iw/n;
    for(let g=0;g<=4;g++){ const y=Y(max*g/4);
      s.appendChild(el('line',{x1:padL,y1:y,x2:VW-padR,y2:y},'stroke:var(--hair);stroke-width:1'));
      const t=el('text',{x:padL-8,y:y+3,'text-anchor':'end'});t.setAttribute('class','ax-label');t.textContent=opts.money?money(max*g/4):kfmt(max*g/4);s.appendChild(t);
    }
    rows.forEach((r,i)=>{
      const x=padL+gap*i+(gap-bw)/2, y=Y(r.v), h=padT+ih-y;
      s.appendChild(el('rect',{x,y,width:bw,height:Math.max(h,1),rx:4},`fill:${r.color||(r.us?'var(--c-us)':'var(--c-a)')}`));
      const t=el('text',{x:x+bw/2,y:H-24,'text-anchor':'middle'});t.setAttribute('class','ax-label');t.textContent=r.label;s.appendChild(t);
      const vt=el('text',{x:x+bw/2,y:y-6,'text-anchor':'middle'});vt.setAttribute('class','ax-label');vt.textContent=opts.money?money(r.v):kfmt(r.v);s.appendChild(vt);
    });
  }

  /* ---------- HORIZONTAL BARS (share of voice, bench) ---------- */
  function hbars(container, rows, opts){
    opts=opts||{};
    container.innerHTML='';
    const rh=40, H=rows.length*rh+8;
    const s=svg(H); container.appendChild(s);
    const labelW=opts.labelW||150, valW=54;
    const trackX=labelW, trackW=VW-labelW-valW-10;
    const max=Math.max(...rows.map(r=>opts.pct?r.share:r.v));
    const inkMain = opts.dark?'var(--dark-ink)':'var(--ink)';
    const inkSub  = opts.dark?'var(--dark-ink-2)':'var(--ink-2)';
    const track   = opts.dark?'var(--dark-hair)':'var(--hair)';
    rows.forEach((r,i)=>{
      const y=i*rh+6, val=opts.pct?r.share:r.v;
      const w=trackW*(val/max);
      const lab=el('text',{x:0,y:y+rh/2-2,'text-anchor':'start'});
      lab.setAttribute('style',`font-family:var(--font-body);font-size:14px;fill:${r.us?inkMain:inkSub};font-weight:${r.us?600:500}`);
      lab.textContent=r.name; s.appendChild(lab);
      s.appendChild(el('rect',{x:trackX,y:y+4,width:trackW,height:16,rx:8},`fill:${track}`));
      s.appendChild(el('rect',{x:trackX,y:y+4,width:Math.max(w,3),height:16,rx:8},`fill:${r.us?'var(--c-us)':(r.color||'var(--c-muted)')}`));
      const vt=el('text',{x:VW,y:y+rh/2-2,'text-anchor':'end'});
      vt.setAttribute('style',`font-family:var(--font-mono);font-size:13px;fill:${inkMain};font-weight:${r.us?600:400}`);
      vt.textContent=opts.pct?(r.share*100).toFixed(1)+(opts.rate?'':'%'):(opts.rate?r.rate+'%':kfmt(r.v)); s.appendChild(vt);
    });
  }

  /* ---------- DONUT ---------- */
  function donut(container, pct, opts){
    opts=opts||{};
    container.innerHTML='';
    const H=opts.size||150; const s=svg(H); s.setAttribute('viewBox',`0 0 ${H} ${H}`); container.appendChild(s);
    const cx=H/2, cy=H/2, r=H/2-14, c=2*Math.PI*r;
    s.appendChild(el('circle',{cx,cy,r,fill:'none','stroke-width':16},'stroke:var(--hair)'));
    const arc=el('circle',{cx,cy,r,fill:'none','stroke-width':16,'stroke-dasharray':`${c*pct} ${c}`,'stroke-linecap':'round',transform:`rotate(-90 ${cx} ${cy})`},`stroke:var(--c-us)`);
    s.appendChild(arc);
    const t=el('text',{x:cx,y:cy+6,'text-anchor':'middle'});t.setAttribute('style','font-family:var(--font-body);font-size:26px;font-weight:600;fill:var(--ink)');t.textContent=Math.round(pct*100)+'%';s.appendChild(t);
  }

  /* ---------- SPARKLINE ---------- */
  function spark(container, arr, color){
    container.innerHTML='';
    const W=120,H=34; const s=document.createElementNS(NS,'svg');
    s.setAttribute('viewBox',`0 0 ${W} ${H}`); s.style.width=W+'px'; s.style.height=H+'px'; s.style.overflow='visible';
    const max=Math.max(...arr), min=Math.min(...arr), rng=max-min||1;
    const X=i=>W*i/(arr.length-1), Y=v=>H-4-(H-8)*((v-min)/rng);
    let p=''; arr.forEach((v,i)=>p+=(i?'L':'M')+X(i)+' '+Y(v)+' ');
    s.appendChild(el('path',{d:p},`fill:none;stroke:${color||'var(--c-us)'};stroke-width:2;stroke-linejoin:round`));
    let a=p+`L${W} ${H} L0 ${H} Z`;
    s.appendChild(el('path',{d:a},`fill:${color||'var(--c-us)'};opacity:.12`));
    container.appendChild(s);
  }

  return { area, lines, bars, hbars, donut, spark };
})();
