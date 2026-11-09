/* Arbor Homes template. Vanilla JS, no dependencies. Everything degrades without JS. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shrink on scroll */
  var header = document.querySelector('.header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.querySelector('.menu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.querySelector('.menu-txt').textContent = open ? 'Close' : 'Menu';
    }
    if (menu) menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open && menu) {
      var first = menu.querySelector('a');
      if (first) first.focus();
    } else if (menuBtn && document.activeElement && menu && menu.contains(document.activeElement)) {
      menuBtn.focus();
    }
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });
  }

  /* Scroll reveals */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el, i) {
      if (!el.style.getPropertyValue('--d')) {
        var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.setProperty('--d', Math.min(sib, 5) * 90 + 'ms');
      }
      /* Anything already on screen at load shows at once; the observer handles the rest. */
      if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); return; }
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Count-up numbers */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* Projects strip: drag to scroll, progress line, arrows */
  var strip = document.querySelector('.strip');
  if (strip) {
    var progress = document.querySelector('.strip-progress span');
    var isDown = false, startX = 0, startLeft = 0, moved = false;
    function updateProgress() {
      if (!progress) return;
      var max = strip.scrollWidth - strip.clientWidth;
      var ratio = strip.clientWidth / strip.scrollWidth;
      var w = Math.max(ratio * 100, 8);
      var left = max > 0 ? (strip.scrollLeft / max) * (100 - w) : 0;
      progress.style.width = w + '%';
      progress.style.left = left + '%';
    }
    strip.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      isDown = true; moved = false; startX = e.clientX; startLeft = strip.scrollLeft;
      strip.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      strip.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!isDown) return;
      isDown = false;
      setTimeout(function () { strip.classList.remove('is-dragging'); }, moved ? 50 : 0);
    });
    strip.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); moved = false; }
    }, true);

    var item = strip.querySelector('.strip-item');
    document.querySelectorAll('[data-strip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dir = btn.getAttribute('data-strip') === 'next' ? 1 : -1;
        var w = item ? item.getBoundingClientRect().width + 24 : 400;
        strip.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  }

  /* Projects filter */
  var filterRoot = document.querySelector('[data-filter-root]');
  if (filterRoot) {
    var state = { area: 'all', status: 'all' };
    var tiles = filterRoot.querySelectorAll('.tile');
    var empty = filterRoot.querySelector('.empty');
    var countEl = filterRoot.querySelector('.filter-count');
    function applyFilter() {
      var n = 0;
      tiles.forEach(function (t) {
        var ok = (state.area === 'all' || t.getAttribute('data-area') === state.area) &&
                 (state.status === 'all' || t.getAttribute('data-status') === state.status);
        t.classList.toggle('is-hidden', !ok);
        if (ok) n++;
      });
      if (empty) empty.classList.toggle('is-visible', n === 0);
      if (countEl) countEl.textContent = n === 1 ? '1 project' : n + ' projects';
    }
    filterRoot.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-key');
        state[key] = chip.getAttribute('data-value');
        filterRoot.querySelectorAll('.chip[data-key="' + key + '"]').forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        applyFilter();
      });
    });
    var reset = filterRoot.querySelector('[data-filter-reset]');
    if (reset) reset.addEventListener('click', function () {
      state = { area: 'all', status: 'all' };
      filterRoot.querySelectorAll('.chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-value') === 'all' ? 'true' : 'false');
      });
      applyFilter();
    });
    var params = new URLSearchParams(location.search);
    ['area', 'status'].forEach(function (k) {
      var v = params.get(k);
      if (v) {
        var chip = filterRoot.querySelector('.chip[data-key="' + k + '"][data-value="' + v + '"]');
        if (chip) chip.click();
      }
    });
    applyFilter();
  }

  /* Lightbox */
  var gallery = document.querySelector('.gallery');
  var lightbox = document.querySelector('.lightbox');
  if (gallery && lightbox) {
    var links = Array.prototype.slice.call(gallery.querySelectorAll('a'));
    var lbImg = lightbox.querySelector('img');
    var lbCap = lightbox.querySelector('figcaption');
    var idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + links.length) % links.length;
      var a = links[idx];
      lbImg.src = a.getAttribute('href');
      lbImg.alt = a.querySelector('img').alt;
      if (lbCap) lbCap.textContent = (idx + 1) + ' / ' + links.length + (a.dataset.caption ? '  ' + a.dataset.caption : '');
    }
    function openLb(i) {
      lastFocus = document.activeElement;
      show(i);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('.lb-close').focus();
    }
    function closeLb() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); openLb(i); });
    });
    lightbox.querySelector('.lb-close').addEventListener('click', closeLb);
    lightbox.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lightbox.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'Tab') {
        var f = lightbox.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* Form validation */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var fields = form.querySelectorAll('[required]');
    function check(input) {
      var field = input.closest('.field');
      var msg = field ? field.querySelector('.msg') : null;
      var v = input.value.trim();
      var err = '';
      if (!v) err = 'Please fill this in.';
      else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) err = 'That email does not look right.';
      else if (input.type === 'tel' && v.replace(/[^\d]/g, '').length < 8) err = 'Please add a full phone number.';
      if (input.type === 'checkbox' && !input.checked) err = 'Please tick this to continue.';
      if (field) field.classList.toggle('is-error', !!err);
      if (msg) msg.textContent = err;
      input.setAttribute('aria-invalid', err ? 'true' : 'false');
      return !err;
    }
    fields.forEach(function (input) {
      input.addEventListener('blur', function () { check(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') check(input);
      });
    });
    form.addEventListener('submit', function (e) {
      var ok = true, firstBad = null;
      fields.forEach(function (input) {
        if (!check(input)) { ok = false; if (!firstBad) firstBad = input; }
      });
      if (!ok) { e.preventDefault(); if (firstBad) firstBad.focus(); }
    });
  });

  /* Smooth anchor scroll with header offset */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* Footer year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
