/* Granite Bros. Construction: template behaviour.
   Everything degrades: the pages read fine with this file missing. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  doc.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: shrink + colour on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) {
      if (m.matches) setMenu(false);
    });
  }

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); } else { io.observe(el); } });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Count-up numbers ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- Smooth anchor scroll (respects header height) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- FAQ: animated <details> ---------- */
  document.querySelectorAll('.faq details').forEach(function (d) {
    var summary = d.querySelector('summary');
    var body = d.querySelector('.faq-body');
    if (!summary || !body) return;
    body.style.overflow = 'hidden';
    summary.addEventListener('click', function (e) {
      if (reduceMotion) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        body.style.height = h + 'px';
        requestAnimationFrame(function () {
          body.style.transition = 'height 0.3s ease';
          body.style.height = '0px';
        });
        body.addEventListener('transitionend', function done() {
          body.removeEventListener('transitionend', done);
          d.open = false;
          body.style.height = '';
          body.style.transition = '';
        });
      } else {
        d.open = true;
        var full = body.offsetHeight;
        body.style.height = '0px';
        requestAnimationFrame(function () {
          body.style.transition = 'height 0.3s ease';
          body.style.height = full + 'px';
        });
        body.addEventListener('transitionend', function done() {
          body.removeEventListener('transitionend', done);
          body.style.height = '';
          body.style.transition = '';
        });
      }
    });
  });

  /* ---------- Services filter ---------- */
  var filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    var items = document.querySelectorAll('[data-for]');
    var empty = document.querySelector('.empty');
    var count = document.querySelector('.filter-count');
    var state = { for: 'all', type: 'all' };
    function applyFilter() {
      var shown = 0;
      items.forEach(function (it) {
        var okFor = state.for === 'all' || it.getAttribute('data-for').split(' ').indexOf(state.for) > -1;
        var okType = state.type === 'all' || it.getAttribute('data-type').split(' ').indexOf(state.type) > -1;
        var ok = okFor && okType;
        it.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle('is-visible', shown === 0);
      if (count) count.textContent = shown === 1 ? '1 service' : shown + ' services';
    }
    filterBar.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var group = chip.getAttribute('data-group');
      state[group] = chip.getAttribute('data-value');
      filterBar.querySelectorAll('.chip[data-group="' + group + '"]').forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      applyFilter();
    });
    var reset = document.querySelector('.empty button');
    if (reset) reset.addEventListener('click', function () {
      state = { for: 'all', type: 'all' };
      filterBar.querySelectorAll('.chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-value') === 'all' ? 'true' : 'false');
      });
      applyFilter();
    });
    applyFilter();
  }

  /* ---------- Before / after slider ---------- */
  document.querySelectorAll('.ba-wrap').forEach(function (wrap) {
    var range = wrap.querySelector('.ba-range');
    if (!range) return;
    function set(v) {
      v = Math.max(0, Math.min(100, v));
      wrap.style.setProperty('--split', v + '%');
      range.value = v;
      range.setAttribute('aria-valuenow', Math.round(v));
      range.setAttribute('aria-valuetext', Math.round(v) + '% after');
    }
    range.addEventListener('input', function () { set(parseFloat(range.value)); });
    var dragging = false;
    function fromEvent(e) {
      var r = wrap.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }
    wrap.addEventListener('pointerdown', function (e) {
      dragging = true; wrap.setPointerCapture(e.pointerId); fromEvent(e);
    });
    wrap.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    wrap.addEventListener('pointerup', function () { dragging = false; });
    wrap.addEventListener('pointercancel', function () { dragging = false; });
    set(50);
  });

  /* ---------- Lightbox ---------- */
  var gallery = document.querySelector('.gallery');
  var lightbox = document.querySelector('.lightbox');
  if (gallery && lightbox) {
    var links = Array.prototype.slice.call(gallery.querySelectorAll('a'));
    var img = lightbox.querySelector('img');
    var counter = lightbox.querySelector('.lb-count');
    var idx = 0, lastFocus = null;
    function show(i) {
      idx = (i + links.length) % links.length;
      img.src = links[idx].getAttribute('href');
      img.alt = links[idx].querySelector('img').alt;
      if (counter) counter.textContent = (idx + 1) + ' / ' + links.length;
    }
    function open(i) {
      lastFocus = document.activeElement;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      show(i);
      lightbox.querySelector('.lb-close').focus();
    }
    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(i); });
    });
    lightbox.querySelector('.lb-close').addEventListener('click', close);
    lightbox.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lightbox.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
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

  /* ---------- Form validation ---------- */
  document.querySelectorAll('form.enquiry').forEach(function (form) {
    form.setAttribute('novalidate', '');
    var status = form.querySelector('.form-status');
    function fieldOf(input) { return input.closest('.field'); }
    function setError(input, msg) {
      var f = fieldOf(input); if (!f) return;
      var err = f.querySelector('.error');
      f.classList.toggle('has-error', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    }
    function validate(input) {
      var v = input.value.trim();
      if (input.required && !v) return 'Please fill this in.';
      if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'That email does not look right.';
      if (input.type === 'tel' && v && !/^[+\d\s()-]{6,}$/.test(v)) return 'Please enter a phone number with digits only.';
      if (input.required && input.tagName === 'SELECT' && !v) return 'Please choose one.';
      return '';
    }
    var inputs = form.querySelectorAll('input:not([type=hidden]), select, textarea');
    inputs.forEach(function (i) {
      i.addEventListener('blur', function () { setError(i, validate(i)); });
      i.addEventListener('input', function () { if (fieldOf(i) && fieldOf(i).classList.contains('has-error')) setError(i, validate(i)); });
    });
    form.addEventListener('submit', function (e) {
      var firstBad = null;
      inputs.forEach(function (i) {
        if (i.closest('.hidden-field')) return;
        var msg = validate(i);
        setError(i, msg);
        if (msg && !firstBad) firstBad = i;
      });
      if (firstBad) {
        e.preventDefault();
        firstBad.focus();
        if (status) { status.textContent = 'Please check the fields marked above.'; status.classList.add('is-visible'); }
      } else if (status) {
        status.textContent = 'Sending.';
        status.classList.add('is-visible');
      }
    });
  });

  /* ---------- Footer year ---------- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
