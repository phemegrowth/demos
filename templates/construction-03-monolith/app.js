/* MONOLITH template: header, menu, reveals, index filter + cursor peek, lightbox, count-up, form validation. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header shrink */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-small', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* mobile menu */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { var first = menu.querySelector('a'); if (first) first.focus(); }
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
  }

  /* scroll reveals */
  var revealEls = document.querySelectorAll('.r');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); } else { io.observe(el); } });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* smooth anchor scroll (native via CSS; here we only offset for the sticky header) */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', '#' + id);
    });
  });

  /* count-up numbers */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var runCount = function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = end + suffix; return; }
      var start = null, dur = 1400;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else { counters.forEach(runCount); }
  }

  /* project index: filter */
  var index = document.querySelector('.index');
  if (index) {
    var items = index.querySelectorAll('.index__item');
    var state = { status: 'all', programme: 'all' };
    var apply = function () {
      var shown = 0;
      items.forEach(function (li) {
        var ok = (state.status === 'all' || li.dataset.status === state.status) &&
                 (state.programme === 'all' || li.dataset.programme === state.programme);
        li.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      });
      index.classList.toggle('is-empty', shown === 0);
      var count = document.querySelector('[data-index-count]');
      if (count) count.textContent = shown + ' / ' + items.length;
    };
    document.querySelectorAll('.filters').forEach(function (group) {
      var key = group.dataset.filter;
      group.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          state[key] = b.dataset.value;
          apply();
        });
      });
    });
    apply();

    /* cursor-following preview on pointer devices */
    var peek = document.querySelector('.peek');
    var fine = window.matchMedia('(pointer: fine) and (min-width: 761px)');
    if (peek && !reduce) {
      var peekImg = peek.querySelector('img');
      var x = 0, y = 0, tx = 0, ty = 0, raf = null;
      var tick = function () {
        x += (tx - x) * 0.18; y += (ty - y) * 0.18;
        peek.style.transform = 'translate(' + (x - peek.offsetWidth / 2) + 'px,' + (y - peek.offsetHeight / 2) + 'px)';
        if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(tick); else raf = null;
      };
      peek.style.transform = 'translate(-9999px,-9999px)';
      peek.style.left = '0'; peek.style.top = '0';
      index.addEventListener('mousemove', function (e) {
        if (!fine.matches) return;
        tx = e.clientX + 24; ty = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
      });
      index.querySelectorAll('.index__row').forEach(function (row) {
        row.addEventListener('mouseenter', function () {
          if (!fine.matches) return;
          var src = row.querySelector('.row__img');
          if (src) { peekImg.src = src.getAttribute('src'); peekImg.alt = ''; }
          peek.classList.add('is-on');
        });
        row.addEventListener('mouseleave', function () { peek.classList.remove('is-on'); });
      });
    }
  }

  /* lightbox for .seq figures and any [data-lightbox] images */
  var lbFigs = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox] figure'));
  var lb = document.querySelector('.lb');
  if (lb && lbFigs.length) {
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb__cap'), lbCount = lb.querySelector('.lb__count');
    var cur = 0, lastFocus = null;
    var show = function (i) {
      cur = (i + lbFigs.length) % lbFigs.length;
      var img = lbFigs[cur].querySelector('img');
      var cap = lbFigs[cur].querySelector('figcaption');
      lbImg.src = img.getAttribute('src'); lbImg.alt = img.getAttribute('alt') || '';
      lbCap.textContent = cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '';
      lbCount.textContent = (cur + 1) + ' / ' + lbFigs.length;
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb__close').focus();
    };
    var close = function () {
      lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    lbFigs.forEach(function (f, i) {
      f.setAttribute('tabindex', '0'); f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'Open image ' + (i + 1) + ' of ' + lbFigs.length);
      f.addEventListener('click', function () { open(i); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    lb.querySelector('.lb__close').addEventListener('click', close);
    lb.querySelector('.lb__prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  /* form validation */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var fields = form.querySelectorAll('[required]');
    var check = function (input) {
      var wrap = input.closest('.field'); var err = wrap && wrap.querySelector('.err');
      var msg = '';
      var v = input.value.trim();
      if (!v) msg = 'Required.';
      else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Check the email address.';
      else if (input.type === 'tel' && v.replace(/\D/g, '').length < 7) msg = 'Check the phone number.';
      if (wrap) wrap.classList.toggle('is-invalid', !!msg);
      if (err) err.textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    };
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { check(f); });
      f.addEventListener('input', function () { if (f.closest('.field').classList.contains('is-invalid')) check(f); });
    });
    form.addEventListener('submit', function (e) {
      var ok = true, firstBad = null;
      fields.forEach(function (f) { if (!check(f)) { ok = false; if (!firstBad) firstBad = f; } });
      if (!ok) { e.preventDefault(); firstBad.focus(); }
    });
  });
})();
