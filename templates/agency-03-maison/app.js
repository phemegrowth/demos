/* Maison Elena: header, menu, reveals, filter, lightbox, form validation. No dependencies. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shrink on scroll */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu');
  var closeBtn = menu ? menu.querySelector('.menu-close') : null;
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      var first = menu.querySelector('a, button');
      if (first) first.focus();
    } else {
      toggle.focus();
    }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
    });
  }

  /* Scroll reveals */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) {
      var group = el.closest('[data-stagger]');
      if (group) {
        var kids = Array.prototype.slice.call(group.querySelectorAll('.reveal'));
        el.style.setProperty('--d', (kids.indexOf(el) * 110) + 'ms');
      }
      if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); } else { io.observe(el); }
    });
  }

  /* Count-up numbers (used only where data-count exists) */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var run = function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var dur = 1400, start = null;
      if (reduce) { el.textContent = end; return; }
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { cio.observe(c); });
    } else {
      counters.forEach(run);
    }
  }

  /* Collection filter (listings page) */
  var list = document.querySelector('[data-filter-list]');
  if (list) {
    var chips = document.querySelectorAll('.chip[data-status]');
    var areaSel = document.querySelector('#area');
    var empty = document.querySelector('[data-empty]');
    var count = document.querySelector('[data-count-out]');
    var items = Array.prototype.slice.call(list.querySelectorAll('[data-status]'));
    var status = 'all';
    function apply() {
      var area = areaSel ? areaSel.value : 'all';
      var shown = 0;
      items.forEach(function (it) {
        var ok = (status === 'all' || it.getAttribute('data-status') === status) &&
                 (area === 'all' || it.getAttribute('data-area') === area);
        it.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      if (count) count.textContent = shown + (shown === 1 ? ' home' : ' homes');
      items.filter(function (i) { return !i.hidden; }).forEach(function (it, idx) {
        it.classList.toggle('alt', idx % 2 === 1);
      });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        status = c.getAttribute('data-status');
        apply();
      });
    });
    if (areaSel) areaSel.addEventListener('change', apply);
    var reset = document.querySelector('[data-reset]');
    if (reset) reset.addEventListener('click', function () {
      status = 'all';
      chips.forEach(function (o) { o.setAttribute('aria-pressed', o.getAttribute('data-status') === 'all' ? 'true' : 'false'); });
      if (areaSel) areaSel.value = 'all';
      apply();
    });
    apply();
  }

  /* Lightbox (listing gallery) */
  var gallery = document.querySelector('[data-gallery]');
  var lb = document.getElementById('lightbox');
  if (gallery && lb) {
    var triggers = Array.prototype.slice.call(gallery.querySelectorAll('[data-full]'));
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lightbox-caption');
    var idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + triggers.length) % triggers.length;
      var t = triggers[idx];
      lbImg.src = t.getAttribute('data-full');
      lbImg.alt = t.getAttribute('data-alt') || '';
      if (lbCap) lbCap.textContent = (idx + 1) + ' / ' + triggers.length + (t.getAttribute('data-caption') ? ', ' + t.getAttribute('data-caption') : '');
    }
    function openLb(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lb-open');
      lb.querySelector('.lb-close').focus();
    }
    function closeLb() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
      if (lastFocus) lastFocus.focus();
    }
    triggers.forEach(function (t, i) {
      t.addEventListener('click', function () { openLb(i); });
    });
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
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

  /* Forms: inline validation */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    var statusEl = form.querySelector('.form-status');
    function fieldOf(input) { return input.closest('.field'); }
    function setError(input, msg) {
      var f = fieldOf(input); if (!f) return;
      var err = f.querySelector('.field-error');
      f.classList.toggle('is-invalid', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    }
    function check(input) {
      var v = input.value.trim();
      if (input.required && !v) return 'Please fill this in.';
      if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'That email does not look right.';
      if (input.type === 'tel' && v && !/^[+\d][\d\s().-]{6,}$/.test(v)) return 'Please include the country code, for example +357.';
      if (input.tagName === 'TEXTAREA' && input.required && v.length < 10) return 'A line or two helps me reply well.';
      return '';
    }
    var inputs = form.querySelectorAll('input:not([type=hidden]):not(.hp input), select, textarea');
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () { setError(input, check(input)); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') setError(input, check(input)); });
    });
    form.addEventListener('submit', function (e) {
      var firstBad = null;
      inputs.forEach(function (input) {
        var msg = check(input);
        setError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) {
        e.preventDefault();
        firstBad.focus();
        if (statusEl) statusEl.textContent = 'A few lines are missing above.';
      } else if (statusEl) {
        statusEl.textContent = '';
      }
    });
  });
})();
