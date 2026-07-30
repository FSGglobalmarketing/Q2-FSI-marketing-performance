/* Executive Summary — count-up ("step counter") animation for the KPI tiles.
   Igneo-only page. Each .exec-v holds its final value (e.g. "27.7%", "US #2",
   "813", "135.7k"). We split it into prefix / number / suffix, then tick the
   number up from zero once the page is actually on screen.

   Trigger:
   - Deck mode: fire when the exec page gains the .active class (i.e. you arrive).
   - Flat/review mode (?flat): every page is active on load, so use an
     IntersectionObserver and fire when the tiles scroll into view. */
(function () {
  'use strict';

  function animate(el) {
    if (el._counted) return;
    el._counted = true;

    var raw = el.getAttribute('data-final') || el.textContent;
    var m = raw.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!m) { el.textContent = raw; return; }

    var prefix = m[1];
    var digits = m[2];
    var suffix = m[3];
    var target = parseFloat(digits.replace(/,/g, ''));
    var decimals = (digits.split('.')[1] || '').length;
    var grouped = digits.indexOf(',') > -1;
    var DUR = 1150;
    var start = null;

    function fmt(v) {
      var s = v.toFixed(decimals);
      if (grouped) {
        s = Number(s).toLocaleString('en-US', {
          minimumFractionDigits: decimals, maximumFractionDigits: decimals
        });
      }
      return prefix + s + suffix;
    }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }   // easeOutCubic
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / DUR);
      el.textContent = fmt(target * ease(t));
      if (t < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }

  function init() {
    var vals = [].slice.call(document.querySelectorAll('.exec-v'));
    if (!vals.length) return;
    // Stash the final value up front so the animation can't lose it.
    vals.forEach(function (el) {
      if (!el.hasAttribute('data-final')) el.setAttribute('data-final', el.textContent.trim());
    });

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { vals.forEach(function (el) { el.textContent = el.getAttribute('data-final'); }); return; }

    var flat = document.documentElement.classList.contains('flat-review');
    var wrap = document.querySelector('.exec-wrap');
    var page = wrap && wrap.closest('.page');

    if (flat && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      vals.forEach(function (el) { io.observe(el); });
      return;
    }

    if (!page) { vals.forEach(animate); return; }
    if (page.classList.contains('active')) { vals.forEach(animate); return; }
    var mo = new MutationObserver(function () {
      if (page.classList.contains('active')) { vals.forEach(animate); mo.disconnect(); }
    });
    mo.observe(page, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
