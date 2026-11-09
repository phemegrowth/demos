/* Meridian Developments template. Vanilla JS, no dependencies. Everything degrades without JS. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shrink on scroll */
  var header = document.querySelector('.header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-compact', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  function closeMenu() {
    if (!menu || !burger) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }
  function openMenu() {
    menu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    var first = menu.querySelector('a');
    if (first) first.focus();
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) { closeMenu(); burger.focus(); } else { openMenu(); }
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); burger.focus(); }
    });
  }

  /* Scroll reveals, staggered inside a parent */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) {
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [];
      var i = Array.prototype.indexOf.call(siblings, el);
      if (i > 0 && i < 8) el.style.setProperty('--d', (i * 0.09) + 's');
      if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); } else { io.observe(el); }
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Count-up numbers: <span data-count="48">48</span> */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* Smooth anchor scroll (CSS handles it; this just offsets for the header) */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
    });
  });

  /* Project filter: buttons with data-filter, rows with data-type and data-status */
  var filter = document.querySelector('.filter');
  if (filter) {
    var rows = document.querySelectorAll('.plist .row');
    var empty = document.querySelector('.empty');
    var count = document.querySelector('.filter__count');
    function applyFilter(key) {
      var shown = 0;
      rows.forEach(function (r) {
        var ok = key === 'all' || r.getAttribute('data-type') === key || r.getAttribute('data-status') === key;
        r.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle('is-visible', shown === 0);
      if (count) count.textContent = shown + (shown === 1 ? ' project' : ' projects');
      filter.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-filter') === key ? 'true' : 'false');
      });
    }
    filter.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); });
    });
    var initial = (location.hash || '').replace('#', '');
    applyFilter(['apartments', 'villas', 'completed'].indexOf(initial) > -1 ? initial : 'all');
  }

  /* Lightbox for .gallery__item (button with data-full) */
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  var lb = document.querySelector('.lightbox');
  if (items.length && lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lightbox__caption');
    var current = 0, lastFocus = null;
    function show(i) {
      current = (i + items.length) % items.length;
      var it = items[current];
      lbImg.src = it.getAttribute('data-full');
      lbImg.alt = it.querySelector('img').alt;
      if (lbCap) lbCap.textContent = (current + 1) + ' / ' + items.length;
    }
    function openLb(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('is-open');
      document.body.classList.add('menu-open');
      lb.querySelector('.lightbox__close').focus();
    }
    function closeLb() {
      lb.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      if (lastFocus) lastFocus.focus();
    }
    items.forEach(function (it, i) { it.addEventListener('click', function () { openLb(i); }); });
    lb.querySelector('.lightbox__close').addEventListener('click', closeLb);
    lb.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* Form validation with inline messages */
  document.querySelectorAll('form[data-netlify]').forEach(function (form) {
    var status = form.querySelector('.form__status');
    function setError(input, msg) {
      var field = input.closest('.field');
      if (!field) return;
      var err = field.querySelector('.field__error');
      field.classList.toggle('is-invalid', !!msg);
      if (err) err.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    function check(input) {
      var v = input.value.trim();
      if (input.required && !v) return 'Please fill this in.';
      if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'That email does not look right.';
      if (input.type === 'tel' && v && !/^[+\d][\d\s().-]{6,}$/.test(v)) return 'Please add a phone number with the country code.';
      return '';
    }
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      if (input.type === 'hidden') return;
      input.addEventListener('blur', function () { setError(input, check(input)); });
      input.addEventListener('input', function () { if (input.closest('.field.is-invalid')) setError(input, check(input)); });
    });
    form.addEventListener('submit', function (e) {
      var bad = null;
      form.querySelectorAll('input, select, textarea').forEach(function (input) {
        if (input.type === 'hidden') return;
        var msg = check(input);
        setError(input, msg);
        if (msg && !bad) bad = input;
      });
      if (bad) {
        e.preventDefault();
        bad.focus();
        if (status) status.textContent = 'Please check the fields marked above.';
      } else if (status) {
        status.textContent = 'Sending.';
      }
    });
  });
})();
