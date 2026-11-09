/* Harbour & Co. template: vanilla JS, no dependencies.
   Everything here is progressive: the pages read fully without it. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: shrink and go dark on scroll ---------- */
  var header = $('#header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.menu-btn');
  var drawer = $('#drawer');
  if (menuBtn && drawer) {
    var setMenu = function (open) {
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (header) header.classList.toggle('is-scrolled', open || window.scrollY > 24);
      if (open) { var first = $('a', drawer); if (first) first.focus(); } else { menuBtn.focus(); }
    };
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------- Scroll reveals ---------- */
  var reveals = $$('.reveal');
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); } else { io.observe(el); } });
    }
  }

  /* ---------- Count-up numbers ---------- */
  var counters = $$('[data-countup]');
  if (counters.length) {
    var fmt = function (n) { return n.toLocaleString('en-GB'); };
    var run = function (el) {
      var target = parseInt(el.getAttribute('data-countup'), 10);
      if (reduce || isNaN(target)) { el.textContent = fmt(target); return; }
      var start = null, dur = 1400;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window && !reduce) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    } else { counters.forEach(run); }
  }

  /* ---------- Budget ranges, shared by search panel and filter bar ---------- */
  var BUDGETS = {
    buy: [
      ['', 'Any budget'], ['0-500000', 'Up to €500,000'], ['500000-1000000', '€500,000 to €1,000,000'],
      ['1000000-2000000', '€1,000,000 to €2,000,000'], ['2000000-', 'Over €2,000,000']
    ],
    rent: [
      ['', 'Any budget'], ['0-2000', 'Up to €2,000 a month'], ['2000-4000', '€2,000 to €4,000 a month'], ['4000-', 'Over €4,000 a month']
    ]
  };
  var fillBudget = function (select, mode, keep) {
    var cur = (keep !== undefined && keep !== null) ? keep : select.value;
    select.innerHTML = '';
    BUDGETS[mode].forEach(function (o) {
      var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1]; select.appendChild(opt);
    });
    select.value = cur; if (select.value !== cur) select.value = '';
  };

  /* ---------- Home search panel ---------- */
  var search = $('#search');
  if (search) {
    var modeInput = $('input[name="mode"]', search);
    var budgetSel = $('[data-budget]', search);
    var setMode = function (m) {
      modeInput.value = m;
      $$('[data-mode]', search).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
      fillBudget(budgetSel, m);
    };
    $$('[data-mode]', search).forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });
    setMode('buy');
    var goSearch = function () {
      var q = [];
      ['mode', 'area', 'type', 'budget'].forEach(function (k) {
        var f = $('[name="' + k + '"]', search); if (f && f.value) q.push(k + '=' + encodeURIComponent(f.value));
      });
      window.location.href = './listings.html' + (q.length ? '?' + q.join('&') : '');
    };
    $('[data-search-go]', search).addEventListener('click', goSearch);
    $$('select', search).forEach(function (sel) {
      sel.addEventListener('keydown', function (e) { if (e.key === 'Enter') goSearch(); });
    });
  }

  /* ---------- Listings page: filters, sort, count, empty state ---------- */
  var results = $('#results');
  var filterForm = $('#filter-form');
  if (results && filterForm) {
    var tiles = $$('.tile', results);
    var empty = $('#empty');
    var countEl = $('[data-result-count]');
    var countLabel = countEl && countEl.parentNode;
    var budget = $('[data-budget]', filterForm);
    var ctl = {};
    ['type', 'area', 'beds', 'budget', 'sort'].forEach(function (k) { ctl[k] = $('[name="' + k + '"]', filterForm); });
    var state = { mode: 'buy', type: '', area: '', beds: '', budget: '', sort: '' };
    var params = new URLSearchParams(window.location.search);
    ['mode', 'type', 'area', 'beds', 'budget', 'sort'].forEach(function (k) { if (params.get(k)) state[k] = params.get(k); });
    if (state.mode !== 'rent') state.mode = 'buy';
    // url names an area or type but no mode: if nothing is for sale there, show rentals
    if (!params.get('mode') && (state.area || state.type)) {
      var matches = function (m) {
        return tiles.some(function (t) {
          return t.getAttribute('data-mode') === m
            && (!state.type || t.getAttribute('data-type') === state.type)
            && (!state.area || t.getAttribute('data-area') === state.area);
        });
      };
      if (!matches('buy') && matches('rent')) state.mode = 'rent';
    }
    var apply = function () {
      $$('[data-mode]', filterForm).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === state.mode ? 'true' : 'false'); });
      fillBudget(budget, state.mode, state.budget);
      state.budget = budget.value;
      ['type', 'area', 'beds'].forEach(function (k) {
        var sel = ctl[k]; sel.value = state[k]; if (sel.value !== state[k]) state[k] = '';
      });
      ctl.sort.value = state.sort;

      var range = state.budget ? state.budget.split('-') : null;
      var min = range ? parseInt(range[0] || '0', 10) : 0;
      var max = range && range[1] ? parseInt(range[1], 10) : Infinity;
      var shown = [];
      tiles.forEach(function (t) {
        var ok = t.getAttribute('data-mode') === state.mode
          && (!state.type || t.getAttribute('data-type') === state.type)
          && (!state.area || t.getAttribute('data-area') === state.area)
          && (!state.beds || parseInt(t.getAttribute('data-beds'), 10) >= parseInt(state.beds, 10))
          && parseInt(t.getAttribute('data-price'), 10) >= min && parseInt(t.getAttribute('data-price'), 10) <= max;
        t.classList.toggle('is-hidden', !ok);
        if (ok) shown.push(t);
      });
      // sort: reorder DOM, keeping original order as "newest first"
      var ordered = tiles.slice();
      if (state.sort === 'asc' || state.sort === 'desc') {
        ordered.sort(function (a, b) {
          var d = parseInt(a.getAttribute('data-price'), 10) - parseInt(b.getAttribute('data-price'), 10);
          return state.sort === 'asc' ? d : -d;
        });
      }
      ordered.forEach(function (t) { results.appendChild(t); t.classList.add('is-in'); });
      if (countEl) countEl.textContent = shown.length;
      if (countLabel) countLabel.lastChild.textContent = shown.length === 1 ? ' home' : ' homes';
      if (empty) empty.classList.toggle('is-visible', shown.length === 0);
      // reflect in the url without reloading
      var q = [];
      Object.keys(state).forEach(function (k) { if (state[k] && !(k === 'mode' && state[k] === 'buy')) q.push(k + '=' + encodeURIComponent(state[k])); });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + (q.length ? '?' + q.join('&') : ''));
      }
    };
    $$('[data-mode]', filterForm).forEach(function (b) {
      b.addEventListener('click', function () { state.mode = b.getAttribute('data-mode'); state.budget = ''; apply(); });
    });
    ['type', 'area', 'beds', 'budget', 'sort'].forEach(function (k) {
      ctl[k].addEventListener('change', function () { state[k] = ctl[k].value; apply(); });
    });
    var reset = $('[data-reset]', filterForm);
    if (reset) reset.addEventListener('click', function () { state = { mode: state.mode, type: '', area: '', beds: '', budget: '', sort: '' }; apply(); });
    apply();
  }

  /* ---------- Listing page: gallery and lightbox ---------- */
  var gallery = $('#gallery');
  var lightbox = $('#lightbox');
  if (gallery && lightbox) {
    var photos = $$('#gallery-data li').map(function (li) { return { src: li.getAttribute('data-src'), alt: li.getAttribute('data-alt') }; });
    var mainImg = $('#gallery-main');
    var lbImg = $('#lightbox-img');
    var lbCur = $('[data-lightbox-current]');
    var lbTotal = $('[data-lightbox-total]');
    var idx = 0, lastFocus = null;
    if (lbTotal) lbTotal.textContent = photos.length;
    var showMain = function (i) {
      idx = (i + photos.length) % photos.length;
      mainImg.src = photos[idx].src; mainImg.alt = photos[idx].alt;
      $$('[data-thumb]', gallery).forEach(function (b) { b.setAttribute('aria-current', parseInt(b.getAttribute('data-thumb'), 10) === idx ? 'true' : 'false'); });
    };
    var showLb = function (i) {
      idx = (i + photos.length) % photos.length;
      lbImg.src = photos[idx].src; lbImg.alt = photos[idx].alt;
      if (lbCur) lbCur.textContent = idx + 1;
    };
    var openLb = function (i) {
      lastFocus = document.activeElement;
      showLb(i);
      lightbox.classList.add('is-open'); lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('has-lightbox');
      $('[data-lightbox-close]', lightbox).focus();
    };
    var closeLb = function () {
      lightbox.classList.remove('is-open'); lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('has-lightbox');
      showMain(idx);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    $$('[data-thumb]', gallery).forEach(function (b) {
      b.addEventListener('click', function () { showMain(parseInt(b.getAttribute('data-thumb'), 10)); });
    });
    mainImg.style.cursor = 'zoom-in';
    mainImg.addEventListener('click', function () { openLb(idx); });
    $('[data-lightbox-open]').addEventListener('click', function () { openLb(idx); });
    $('[data-lightbox-close]', lightbox).addEventListener('click', closeLb);
    $('[data-lightbox-prev]', lightbox).addEventListener('click', function () { showLb(idx - 1); });
    $('[data-lightbox-next]', lightbox).addEventListener('click', function () { showLb(idx + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') showLb(idx - 1);
      else if (e.key === 'ArrowRight') showLb(idx + 1);
      else if (e.key === 'Tab') {
        var f = $$('button', lightbox); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Testimonial carousel ---------- */
  var quotes = $('#quotes');
  if (quotes) {
    var slides = $$('.quote', quotes);
    var cur = 0, timer = null, paused = false;
    var curEl = $('[data-quote-current]', quotes);
    var totEl = $('[data-quote-total]', quotes);
    if (totEl) totEl.textContent = slides.length;
    var go = function (i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === cur); s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
      if (curEl) curEl.textContent = cur + 1;
    };
    var start = function () {
      if (reduce || slides.length < 2) return;
      stop(); timer = setInterval(function () { if (!paused) go(cur + 1); }, 6000);
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    $$('[data-quote]', quotes).forEach(function (b) {
      b.addEventListener('click', function () { go(b.getAttribute('data-quote') === 'next' ? cur + 1 : cur - 1); start(); });
    });
    var track = $('.quotes__track', quotes);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(cur + 1); start(); }
      if (e.key === 'ArrowLeft') { go(cur - 1); start(); }
    });
    quotes.addEventListener('mouseenter', function () { paused = true; });
    quotes.addEventListener('mouseleave', function () { paused = false; });
    quotes.addEventListener('focusin', function () { paused = true; });
    quotes.addEventListener('focusout', function () { paused = false; });
    go(0); start();
  }

  /* ---------- Forms: validation and the contact variant switch ---------- */
  var MSG = {
    name: 'Please add your name.', phone: 'Please add a phone number we can reach you on.',
    email: 'Please add a valid email address.', message: 'Please write a short message.', consent: 'Please tick the box so we can reply.'
  };
  var validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
  var validPhone = function (v) { return v.replace(/[^\d]/g, '').length >= 7; };
  $$('form.form').forEach(function (form) {
    var status = $('.form__status', form);
    var check = function (field, show) {
      var wrap = field.closest('.field') || field.closest('.form__consent');
      var msgEl = wrap && ($('.field__msg', wrap) || (field.type === 'checkbox' && wrap.nextElementSibling && wrap.nextElementSibling.hasAttribute('data-consent-msg') ? wrap.nextElementSibling : null));
      var v = field.value.trim(), ok = true, msg = '';
      if (field.type === 'checkbox') { ok = field.checked; msg = MSG.consent; }
      else if (field.required && !v) { ok = false; msg = MSG[field.name] || 'This field is needed.'; }
      else if (field.type === 'email' && v && !validEmail(v)) { ok = false; msg = MSG.email; }
      else if (field.type === 'tel' && v && !validPhone(v)) { ok = false; msg = MSG.phone; }
      if (wrap && wrap.classList.contains('field')) wrap.classList.toggle('is-invalid', !ok && show);
      if (msgEl) msgEl.textContent = (!ok && show) ? msg : '';
      field.setAttribute('aria-invalid', (!ok && show) ? 'true' : 'false');
      return ok;
    };
    var fields = function () { return $$('input[required], textarea[required], select[required], input[type="email"], input[type="tel"]', form); };
    fields().forEach(function (f) {
      f.addEventListener('blur', function () { check(f, true); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') check(f, true); });
    });
    form.addEventListener('submit', function (e) {
      var bad = fields().filter(function (f) { return !check(f, true); });
      if (bad.length) {
        e.preventDefault();
        if (status) status.textContent = 'Please check the fields marked above.';
        bad[0].focus();
      } else if (status) { status.textContent = ''; }
    });

    // Contact page: enquiry / valuation variant
    var radios = $$('input[name="topic"]', form);
    if (radios.length) {
      var submit = $('button[type="submit"]', form);
      var setVariant = function (v) {
        form.classList.toggle('is-valuation', v === 'valuation');
        radios.forEach(function (r) { r.checked = r.value === v; });
        if (submit) submit.textContent = v === 'valuation' ? submit.getAttribute('data-submit-valuation') : submit.getAttribute('data-submit-label');
        var msg = $('textarea[name="message"]', form);
        if (msg && !msg.value) msg.placeholder = v === 'valuation'
          ? 'Anything we should know: condition, views, when you would like to sell.'
          : 'Tell us about the home, the area and your timing.';
      };
      radios.forEach(function (r) { r.addEventListener('change', function () { setVariant(r.value); }); });
      var fromHash = function () { if (window.location.hash === '#valuation') setVariant('valuation'); };
      fromHash(); window.addEventListener('hashchange', fromHash);
      if (!form.classList.contains('is-valuation')) setVariant('enquiry');
    }
  });

  /* ---------- Smooth anchor scroll with header offset ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    a.addEventListener('click', function (e) {
      var t = document.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
    });
  });
})();
