/* FORGE Metal Constructions: vanilla JS. Everything here is progressive; the pages read without it. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shrink */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('shrunk', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { var first = menu.querySelector('a'); if (first) first.focus(); } else { toggle.focus(); }
    };
    toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { if (menu.classList.contains('open')) setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
  }

  /* Scroll reveals, staggered */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      var group = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : i;
      el.style.setProperty('--d', (Math.min(group, 6) * 0.08) + 's');
      if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('in'); } else { io.observe(el); }
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Count-up numbers */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dur = 1400, start = null;
      var step = function (t) {
        if (!start) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-GB');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window && !reduce) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { cio.observe(c); });
    }
  }

  /* Product filter (products.html) */
  var filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    var items = document.querySelectorAll('[data-category]');
    var empty = document.querySelector('.empty');
    var count = document.querySelector('.result-count');
    var apply = function (cat) {
      var shown = 0;
      items.forEach(function (it) {
        var ok = cat === 'all' || it.getAttribute('data-category') === cat;
        it.hidden = !ok; if (ok) shown++;
      });
      if (empty) empty.classList.toggle('show', shown === 0);
      if (count) count.textContent = shown + (shown === 1 ? ' product' : ' products');
      filterBar.querySelectorAll('.filter').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === cat)); });
    };
    filterBar.addEventListener('click', function (e) {
      var b = e.target.closest('.filter'); if (!b) return;
      apply(b.getAttribute('data-filter'));
    });
    var initial = new URLSearchParams(location.search).get('cat');
    apply(initial && filterBar.querySelector('[data-filter="' + initial + '"]') ? initial : 'all');
  }

  /* Request price: prefill the product field and go to the form */
  var productField = document.querySelector('input[name="product"]');
  if (productField) {
    var fromUrl = new URLSearchParams(location.search).get('product');
    if (fromUrl) productField.value = fromUrl;
    document.querySelectorAll('[data-product]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        productField.value = btn.getAttribute('data-product');
        var form = productField.closest('form');
        if (form) form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        setTimeout(function () { var n = form && form.querySelector('input[name="name"]'); if (n) n.focus({ preventScroll: true }); }, reduce ? 0 : 500);
      });
    });
  }

  /* Lightbox (project.html) */
  var gallery = document.querySelector('.gallery');
  var lb = document.querySelector('.lightbox');
  if (gallery && lb) {
    var links = Array.prototype.slice.call(gallery.querySelectorAll('a'));
    var img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
    var idx = 0, lastFocus = null;
    var show = function (i) {
      idx = (i + links.length) % links.length;
      var a = links[idx];
      img.src = a.getAttribute('href');
      img.alt = a.querySelector('img').alt;
      if (cap) cap.textContent = (idx + 1) + ' / ' + links.length + '  ' + img.alt;
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      show(i); lb.querySelector('.lb-close').focus();
    };
    var close = function () {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); open(i); }); });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* Form validation with inline messages */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    var fields = form.querySelectorAll('[required]');
    var check = function (input) {
      var wrap = input.closest('.field'); if (!wrap) return true;
      var ok = input.checkValidity();
      if (input.type === 'tel' && ok) ok = /^[+\d][\d\s().-]{6,}$/.test(input.value.trim());
      wrap.classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { check(f); });
      f.addEventListener('input', function () { if (f.closest('.field').classList.contains('invalid')) check(f); });
    });
    form.addEventListener('submit', function (e) {
      var allOk = true, firstBad = null;
      fields.forEach(function (f) { if (!check(f)) { allOk = false; if (!firstBad) firstBad = f; } });
      if (!allOk) { e.preventDefault(); firstBad.focus(); }
    });
  });

  /* Current year in footer */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
