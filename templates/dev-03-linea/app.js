/* LINEA template: header, menu, reveals, count-up, index preview, filters, lightbox, form validation. No dependencies. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shrink */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-small', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', open);
      if (open) { var first = menu.querySelector('a'); if (first) first.focus(); } else { burger.focus(); }
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
  }

  /* Scroll reveals */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach(function (el, i) {
      var group = el.closest('[data-stagger]');
      if (group) {
        var idx = Array.prototype.indexOf.call(group.querySelectorAll('.reveal'), el);
        el.style.setProperty('--d', (idx * 90) + 'ms');
      }
      if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); } else { ro.observe(el); }
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Count-up */
  var counters = document.querySelectorAll('[data-count]');
  var fmt = function (n) { return n.toLocaleString('en-GB'); };
  if (counters.length) {
    var runCount = function (el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      if (reduce || !('IntersectionObserver' in window)) { el.textContent = fmt(end); return; }
      var dur = 1500, start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(runCount);
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* Timeline progress */
  var tl = document.querySelector('.tl__bar');
  if (tl) {
    var pct = tl.getAttribute('data-progress') || '0';
    var setP = function () { tl.style.setProperty('--progress', pct + '%'); };
    if (reduce || !('IntersectionObserver' in window)) { setP(); }
    else {
      var to = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { setP(); to.disconnect(); } }); }, { threshold: 0.3 });
      to.observe(tl);
    }
  }

  /* Index table: hover swaps the preview image (desktop) */
  var fig = document.querySelector('.index__fig');
  if (fig) {
    var img = fig.querySelector('img');
    var cap = fig.querySelector('figcaption');
    var rows = document.querySelectorAll('.ptable tr[data-img]');
    var current = img.getAttribute('src');
    var swap = function (row) {
      var src = row.getAttribute('data-img');
      if (!src || src === current) return;
      current = src;
      if (reduce) { img.src = src; img.alt = row.getAttribute('data-alt') || ''; if (cap) cap.textContent = row.getAttribute('data-cap') || ''; return; }
      fig.classList.add('is-swapping');
      setTimeout(function () {
        img.src = src; img.alt = row.getAttribute('data-alt') || '';
        if (cap) cap.textContent = row.getAttribute('data-cap') || '';
        img.onload = function () { fig.classList.remove('is-swapping'); };
        if (img.complete) fig.classList.remove('is-swapping');
      }, 180);
    };
    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () { swap(row); });
      row.addEventListener('focusin', function () { swap(row); });
    });
    rows.forEach(function (row) {
      var src = row.getAttribute('data-img');
      if (src) { var pre = new Image(); pre.src = src; }
    });
  }

  /* Filters (projects page) */
  var filters = document.querySelector('[data-filters]');
  if (filters) {
    var state = { status: 'all', area: 'all' };
    var items = document.querySelectorAll('[data-status][data-area]');
    var empty = document.querySelector('.empty');
    var count = document.querySelector('.filters__count');
    var apply = function () {
      var n = 0;
      items.forEach(function (it) {
        var ok = (state.status === 'all' || it.getAttribute('data-status') === state.status) &&
                 (state.area === 'all' || it.getAttribute('data-area') === state.area);
        it.hidden = !ok;
        if (ok && it.tagName === 'TR') n++;
      });
      if (empty) empty.hidden = n > 0;
      var tbl = document.querySelector('.ptable'); if (tbl) tbl.hidden = n === 0;
      if (count) count.textContent = n + (n === 1 ? ' project' : ' projects');
    };
    filters.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-key'), val = chip.getAttribute('data-val');
        state[key] = val;
        filters.querySelectorAll('.chip[data-key="' + key + '"]').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        apply();
      });
    });
    var reset = document.querySelector('[data-reset]');
    if (reset) reset.addEventListener('click', function () {
      state = { status: 'all', area: 'all' };
      filters.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-val') === 'all' ? 'true' : 'false'); });
      apply();
    });
    apply();
  }

  /* Lightbox */
  var gallery = document.querySelector('.gallery');
  var lb = document.getElementById('lightbox');
  if (gallery && lb) {
    var slides = Array.prototype.map.call(gallery.querySelectorAll('button'), function (b) {
      var im = b.querySelector('img');
      return { src: b.getAttribute('data-full') || im.src, alt: im.alt, cap: b.getAttribute('data-cap') || '' };
    });
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lightbox__cap'), lbN = lb.querySelector('.lightbox__n');
    var idx = 0, lastFocus = null;
    var show = function (i) {
      idx = (i + slides.length) % slides.length;
      lbImg.src = slides[idx].src; lbImg.alt = slides[idx].alt;
      if (lbCap) lbCap.textContent = slides[idx].cap;
      if (lbN) lbN.textContent = (idx + 1) + ' / ' + slides.length;
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      lb.querySelector('.lightbox__close').focus();
    };
    var close = function () {
      lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      if (lastFocus) lastFocus.focus();
    };
    gallery.querySelectorAll('button').forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('[data-prev]').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('[data-next]').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__img')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'Tab') {
        var f = lb.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* Form validation */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var fields = form.querySelectorAll('[required]');
    var msg = function (input) {
      var v = input.value.trim();
      if (!v) return 'Required.';
      if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email.';
      if (input.type === 'tel' && v.replace(/[^\d]/g, '').length < 7) return 'Enter a valid phone number.';
      return '';
    };
    var check = function (input) {
      var field = input.closest('.field');
      var err = field ? field.querySelector('.field__err') : null;
      var m = msg(input);
      if (field) field.classList.toggle('is-invalid', !!m);
      if (err) err.textContent = m;
      input.setAttribute('aria-invalid', m ? 'true' : 'false');
      return !m;
    };
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { check(f); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });
    form.addEventListener('submit', function (e) {
      var ok = true, firstBad = null;
      fields.forEach(function (f) { if (!check(f)) { ok = false; if (!firstBad) firstBad = f; } });
      var status = form.querySelector('.form__status');
      if (!ok) {
        e.preventDefault();
        if (status) status.textContent = 'Please complete the marked fields.';
        if (firstBad) firstBad.focus();
      } else if (status) { status.textContent = ''; }
    });
  });
})();
