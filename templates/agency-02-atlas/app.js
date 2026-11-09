/* Atlas Property template. Vanilla JS, no dependencies. Every feature degrades: the pages read fully without this file. */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var eur = function (n) { return '€' + Math.round(n).toLocaleString('en-GB'); };

  /* ---------- header: shrink on scroll ---------- */
  var header = $('.site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  var nav = $('#nav'), toggle = $('.nav-toggle'), navClose = $('.nav-close');
  var scrim = d.createElement('div');
  scrim.className = 'scrim';
  d.body.appendChild(scrim);
  function openNav() {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    d.body.style.overflow = 'hidden';
    navClose.focus();
  }
  function closeNav() {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    d.body.style.overflow = '';
    toggle.focus();
  }
  if (toggle) {
    toggle.addEventListener('click', function () { nav.classList.contains('is-open') ? closeNav() : openNav(); });
    navClose.addEventListener('click', closeNav);
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('aria-disabled') === 'true') { return; } closeNav(); }); });
  }
  $$('.lang a[aria-disabled="true"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

  /* ---------- scroll reveals ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); } else { io.observe(el); } });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- count-up ---------- */
  var counters = $$('[data-count]');
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-GB');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- smooth anchor scroll with header offset ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = d.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
    });
  });

  /* ---------- hero search (builds the listings URL) ---------- */
  var search = $('#search');
  if (search) {
    var go = $('#search-go');
    function runSearch() {
      var p = new URLSearchParams();
      var q = $('#s-q').value.trim(), t = $('#s-type').value, b = $('#s-budget').value;
      if (q) p.set('q', q);
      if (t) p.set('type', t);
      if (b) p.set('budget', b);
      var qs = p.toString();
      location.href = './listings.html' + (qs ? '?' + qs : '');
    }
    go.addEventListener('click', function (e) { e.preventDefault(); runSearch(); });
    search.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName !== 'A') { e.preventDefault(); runSearch(); } });
  }

  /* ---------- saved listings (localStorage) ---------- */
  var SAVE_KEY = 'atlas-saved';
  function getSaved() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; } }
  function setSaved(list) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) { /* private mode */ } }
  function paintSaved() {
    var saved = getSaved();
    $$('[data-save]').forEach(function (b) {
      var on = saved.indexOf(b.getAttribute('data-save')) > -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var lbl = $('span', b);
      if (lbl) lbl.textContent = on ? 'Saved' : 'Save';
    });
  }
  paintSaved();
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-save]');
    if (!b) return;
    e.preventDefault();
    var ref = b.getAttribute('data-save'), saved = getSaved(), i = saved.indexOf(ref);
    if (i > -1) saved.splice(i, 1); else saved.push(ref);
    setSaved(saved);
    paintSaved();
    if (typeof applyFilters === 'function') applyFilters();
  });

  /* ---------- compare (up to 3) ---------- */
  var cards = $$('.card[data-ref]');
  var compareBar = null, compareDialog = null;
  var compared = [];
  function buildCompareUI() {
    compareBar = d.createElement('div');
    compareBar.className = 'compare-bar';
    compareBar.setAttribute('role', 'region');
    compareBar.setAttribute('aria-label', 'Compare');
    compareBar.innerHTML = '<p><span id="cmp-n">0</span> selected</p><div class="actions"><button class="btn btn-ghost" type="button" id="cmp-clear">Clear</button><button class="btn btn-accent" type="button" id="cmp-open">Compare</button></div>';
    d.body.appendChild(compareBar);
    compareDialog = d.createElement('dialog');
    compareDialog.className = 'compare-dialog';
    compareDialog.setAttribute('aria-label', 'Compare listings');
    compareDialog.innerHTML = '<div class="dialog-head"><h2>Compare</h2><button class="btn-icon" type="button" id="cmp-close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div><div class="dialog-body"></div>';
    d.body.appendChild(compareDialog);
    $('#cmp-clear').addEventListener('click', function () {
      $$('input[data-compare]').forEach(function (c) { c.checked = false; });
      syncCompare();
    });
    $('#cmp-open').addEventListener('click', openCompare);
    $('#cmp-close').addEventListener('click', function () { compareDialog.close(); });
    compareDialog.addEventListener('click', function (e) { if (e.target === compareDialog) compareDialog.close(); });
  }
  function syncCompare() {
    compared = $$('input[data-compare]:checked').map(function (c) { return c.closest('.card'); });
    var full = compared.length >= 3;
    $$('input[data-compare]').forEach(function (c) {
      c.disabled = full && !c.checked;
      c.closest('.card').classList.toggle('is-compared', c.checked);
    });
    if (!compareBar) buildCompareUI();
    $('#cmp-n').textContent = compared.length + (full ? ' of 3' : '');
    $('#cmp-open').disabled = compared.length < 2;
    compareBar.classList.toggle('is-visible', compared.length > 0);
  }
  var FEAT = { 'new-build': 'New build', 'sea-view': 'Sea view', parking: 'Parking', pool: 'Pool', furnished: 'Furnished', 'title-deeds': 'Title deeds' };
  function openCompare() {
    var rows = [
      ['Photo', function (c) { return '<img src="' + c.getAttribute('data-img') + '" alt="" width="400" height="300">'; }],
      ['Listing', function (c) { return '<a href="./listing.html">' + c.getAttribute('data-title') + '</a><br><span class="meta">' + c.getAttribute('data-ref') + '</span>'; }],
      ['Price', function (c) { return '<span class="price">' + c.getAttribute('data-pricelabel') + '</span>'; }],
      ['Type', function (c) { var t = c.getAttribute('data-type'); return t.charAt(0).toUpperCase() + t.slice(1); }],
      ['Bedrooms', function (c) { return c.getAttribute('data-beds') === '0' ? 'n/a' : c.getAttribute('data-beds'); }],
      ['Bathrooms', function (c) { return c.getAttribute('data-baths'); }],
      ['Size', function (c) { return c.getAttribute('data-m2') + ' m²'; }],
      ['Price per m²', function (c) { return eur(+c.getAttribute('data-price') / +c.getAttribute('data-m2')); }],
      ['Year', function (c) { return c.getAttribute('data-year'); }],
      ['Features', function (c) { return c.getAttribute('data-feats').split(' ').map(function (f) { return FEAT[f] || f; }).join(', '); }]
    ];
    var html = '<table class="compare-table"><tbody>' + rows.map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th>' + compared.map(function (c) { return '<td>' + r[1](c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
    $('.dialog-body', compareDialog).innerHTML = html;
    compareDialog.showModal();
  }
  if (cards.length) {
    d.addEventListener('change', function (e) { if (e.target.matches('input[data-compare]')) syncCompare(); });
  }

  /* ---------- listings: filters, sort, query params, drawer ---------- */
  var filterForm = $('#filter-form');
  var applyFilters = null;
  if (filterForm) {
    var results = $('#results'), empty = $('#empty'), count = $('#results-count'), sort = $('#sort');
    var filters = $('#filters'), fOpen = $('.filters-open'), fClose = $('.filters-close'), fApply = $('.filters-apply');
    var all = $$('.card', results);
    var fld = function (n) { return $('[name="' + n + '"]', filterForm); };
    var F = { type: fld('type'), area: fld('area'), beds: fld('beds'), min: fld('min'), max: fld('max'), saved: fld('saved') };
    function resetFilters() {
      F.type.value = ''; F.area.value = ''; F.beds.value = ''; F.min.value = ''; F.max.value = ''; F.saved.checked = false;
      $$('input[name="feat"]', filterForm).forEach(function (c) { c.checked = false; });
      q = ''; if (qBox) { qBox.remove(); qBox = null; }
      applyFilters();
    }
    var params = new URLSearchParams(location.search);
    var q = (params.get('q') || '').trim().toLowerCase();
    if (params.get('type')) F.type.value = params.get('type');
    if (params.get('area')) F.area.value = params.get('area');
    if (params.get('beds')) F.beds.value = params.get('beds');
    if (params.get('budget')) {
      var b = params.get('budget').split('-');
      if (b[0]) F.min.value = b[0];
      if (b[1]) F.max.value = b[1];
    }
    if (params.get('min')) F.min.value = params.get('min');
    if (params.get('max')) F.max.value = params.get('max');
    params.getAll('feat').forEach(function (f) { var c = $('input[name="feat"][value="' + f + '"]', filterForm); if (c) c.checked = true; });
    if (q) {
      var areas = $$('option', F.area).map(function (o) { return o.value; });
      if (areas.indexOf(q) > -1 && !F.area.value) { F.area.value = q; q = ''; }
    }
    var qBox = null;
    if (q) {
      qBox = d.createElement('p');
      qBox.className = 'meta';
      qBox.innerHTML = 'Searching for "<strong>' + q.replace(/</g, '&lt;') + '</strong>". <button class="btn btn-ghost" type="button" id="q-clear" style="min-height:32px;padding-inline:12px;margin-left:8px">Clear</button>';
      $('.results-bar').insertAdjacentElement('beforebegin', qBox);
      $('#q-clear').addEventListener('click', function () { q = ''; qBox.remove(); qBox = null; applyFilters(); });
    }

    applyFilters = function () {
      var type = F.type.value, area = F.area.value, beds = +F.beds.value || 0;
      var min = +F.min.value || 0, max = +F.max.value || Infinity;
      var feats = $$('input[name="feat"]:checked', filterForm).map(function (c) { return c.value; });
      var savedOnly = F.saved.checked, saved = getSaved();
      var shown = 0;
      all.forEach(function (c) {
        var ok = true;
        if (type && c.getAttribute('data-type') !== type) ok = false;
        if (area && c.getAttribute('data-area') !== area) ok = false;
        if (beds && +c.getAttribute('data-beds') < beds) ok = false;
        var p = +c.getAttribute('data-price');
        if (p < min || p > max) ok = false;
        var cf = c.getAttribute('data-feats').split(' ');
        feats.forEach(function (x) { if (cf.indexOf(x) < 0) ok = false; });
        if (savedOnly && saved.indexOf(c.getAttribute('data-ref')) < 0) ok = false;
        if (q) {
          var hay = (c.getAttribute('data-title') + ' ' + c.getAttribute('data-ref') + ' ' + c.getAttribute('data-area')).toLowerCase();
          if (hay.indexOf(q) < 0) ok = false;
        }
        c.hidden = !ok;
        if (ok) shown++;
      });
      // sort
      var key = sort.value;
      var vis = all.filter(function (c) { return !c.hidden; });
      vis.sort(function (a, b) {
        var pa = +a.getAttribute('data-price'), pb = +b.getAttribute('data-price');
        if (key === 'price-asc') return pa - pb;
        if (key === 'price-desc') return pb - pa;
        if (key === 'size-desc') return +b.getAttribute('data-m2') - +a.getAttribute('data-m2');
        return all.indexOf(a) - all.indexOf(b);
      });
      vis.forEach(function (c) { results.appendChild(c); c.classList.add('is-in'); });
      count.textContent = shown + (shown === 1 ? ' property' : ' properties');
      empty.hidden = shown > 0;
      results.hidden = shown === 0;
      var n = (type ? 1 : 0) + (area ? 1 : 0) + (beds ? 1 : 0) + (F.min.value ? 1 : 0) + (F.max.value ? 1 : 0) + feats.length + (savedOnly ? 1 : 0);
      if (fOpen) fOpen.lastChild.textContent = n ? 'Filters (' + n + ')' : 'Filters';
    };
    filterForm.addEventListener('input', applyFilters);
    filterForm.addEventListener('change', applyFilters);
    $('#filter-reset').addEventListener('click', resetFilters);
    $('#empty-reset').addEventListener('click', resetFilters);
    sort.addEventListener('change', applyFilters);
    applyFilters();

    function openFilters() { filters.classList.add('is-open'); scrim.classList.add('is-visible'); fOpen.setAttribute('aria-expanded', 'true'); d.body.style.overflow = 'hidden'; fClose.focus(); }
    function closeFilters() { if (!filters.classList.contains('is-open')) return; filters.classList.remove('is-open'); scrim.classList.remove('is-visible'); fOpen.setAttribute('aria-expanded', 'false'); d.body.style.overflow = ''; fOpen.focus(); }
    fOpen.addEventListener('click', openFilters);
    fClose.addEventListener('click', closeFilters);
    fApply.addEventListener('click', closeFilters);
    scrim.addEventListener('click', closeFilters);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeFilters(); });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  /* ---------- gallery + lightbox ---------- */
  var gallery = $('#gallery'), lightbox = $('#lightbox');
  if (gallery && lightbox && typeof lightbox.showModal === 'function') {
    var items = JSON.parse(gallery.getAttribute('data-items'));
    var idx = 0, lbImg = $('img', lightbox), lbCap = $('#lb-cap'), lbN = $('#lb-n');
    function show(i) {
      idx = (i + items.length) % items.length;
      lbImg.src = items[idx].src;
      lbImg.alt = items[idx].alt;
      lbCap.textContent = items[idx].cap;
      lbN.textContent = (idx + 1) + ' / ' + items.length;
    }
    $$('[data-lb]', gallery).forEach(function (b) {
      b.addEventListener('click', function () { show(+b.getAttribute('data-lb')); lightbox.showModal(); $('.lb-close', lightbox).focus(); });
    });
    $('.lb-close', lightbox).addEventListener('click', function () { lightbox.close(); });
    $('.lb-prev', lightbox).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', lightbox).addEventListener('click', function () { show(idx + 1); });
    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
    var tx = 0;
    lightbox.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(dx < 0 ? idx + 1 : idx - 1); });
  }

  /* ---------- mortgage estimate ---------- */
  var mort = $('#mortgage');
  if (mort) {
    var out = $('#m-result'), note = $('#m-note');
    function calc() {
      var price = +$('#m-price').value || 0, dep = Math.min(Math.max(+$('#m-deposit').value || 0, 0), 95);
      var years = Math.max(+$('#m-years').value || 1, 1), rate = Math.max(+$('#m-rate').value || 0, 0);
      var loan = price * (1 - dep / 100), n = years * 12, r = rate / 100 / 12;
      var pay = r > 0 ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
      out.textContent = eur(pay);
      note.textContent = 'Loan of ' + eur(loan) + ' over ' + years + ' years at ' + rate + '%';
    }
    mort.addEventListener('input', calc);
    calc();
  }

  /* ---------- form validation ---------- */
  $$('form.form').forEach(function (form) {
    var msgs = { name: 'Please add your name.', phone: 'Please add a phone number.', email: 'Please add a valid email address.', message: 'Tell us a little about what you need.' };
    function check(el) {
      var field = el.closest('.field'), err = field && $('.field-error', field);
      if (!field) return true;
      var ok = el.checkValidity();
      if (el.type === 'email' && ok) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
      if (el.name === 'phone' && ok) ok = el.value.replace(/\D/g, '').length >= 7;
      field.classList.toggle('is-invalid', !ok);
      if (err) err.textContent = ok ? '' : (msgs[el.name] || 'Please check this field.');
      return ok;
    }
    $$('[required]', form).forEach(function (el) {
      el.addEventListener('blur', function () { check(el); });
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('is-invalid')) check(el); });
    });
    form.addEventListener('submit', function (e) {
      var bad = $$('[required]', form).filter(function (el) { return !check(el); });
      if (bad.length) { e.preventDefault(); bad[0].focus(); }
    });
  });
})();
