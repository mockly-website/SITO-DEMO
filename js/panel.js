/* ============================================================
   panel.js — Pannello di controllo (UI) + orchestrazione render.
   Collega i controlli allo stato centrale e aggiorna l'anteprima:
   - struttura  → rebuild completo (markup diverso)
   - palette    → solo cambio variabili CSS (istantaneo, niente rebuild)
   - funzioni   → rebuild che mantiene palette e altre funzioni attive
   - mobile/desktop → animazione del frame, senza reload
   ============================================================ */
(function () {
  'use strict';

  var D = window.AppData;
  var S = window.AppState;

  var iframe = document.getElementById('preview');
  var frame = document.getElementById('deviceFrame');

  /* Helper piccolo per iterare NodeList */
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }

  /* ---------- RENDER ---------- */
  function renderPreview() {
    iframe.srcdoc = window.Render.buildDoc();
    document.getElementById('app').classList.add('rendering');
  }

  iframe.onload = function () {
    document.getElementById('app').classList.remove('rendering');
    applyPaletteToDoc();
  };

  /* Cambio palette senza ricostruire: aggiorna solo data-palette */
  function applyPaletteToDoc() {
    try {
      var doc = iframe.contentDocument;
      if (doc && doc.documentElement) {
        doc.documentElement.setAttribute('data-palette', S.palette);
      }
    } catch (e) { /* iframe non ancora pronto */ }
  }

  /* ---------- CARD STRUTTURA ---------- */
  function buildLayouts() {
    var box = document.getElementById('layoutCards');
    box.innerHTML = '';
    Object.keys(D.LAYOUTS).forEach(function (id) {
      var L = D.LAYOUTS[id];
      var card = el(
        '<button class="layout-card' + (S.layout === id ? ' is-active' : '') + '" data-layout="' + id + '">' +
        '<span class="lc-thumb lc-' + id + '"><i></i><i></i><i></i></span>' +
        '<span class="lc-name">' + L.name + '</span>' +
        '<span class="lc-tag">' + L.tag + '</span></button>'
      );
      card.addEventListener('click', function () { setLayout(id); });
      box.appendChild(card);
    });
  }

  function setLayout(id) {
    if (S.layout === id) return;
    S.layout = id;
    buildLayouts();
    updateMeta();
    renderPreview();
  }

  /* ---------- SWATCH PALETTE ---------- */
  function buildPalettes() {
    var box = document.getElementById('swatches');
    box.innerHTML = '';
    D.PALETTES.forEach(function (p) {
      var sw = p.swatches.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('');
      var btn = el(
        '<button class="swatch' + (S.palette === p.id ? ' is-active' : '') + '" data-pal="' + p.id + '" title="' + p.name + '">' +
        '<span class="sw-dots">' + sw + '</span>' +
        '<span class="sw-name">' + p.name + '</span></button>'
      );
      btn.addEventListener('click', function () { setPalette(p.id); });
      box.appendChild(btn);
    });
  }

  function setPalette(id) {
    if (S.palette === id) return;
    S.palette = id;
    buildPalettes();
    applyPaletteToDoc();
    updateMeta();
  }

  /* ---------- ACCORDION FUNZIONI ---------- */
  function buildFeatures() {
    var box = document.getElementById('accordion');
    box.innerHTML = '';
    D.CATEGORIES.forEach(function (cat) {
      var feats = Object.keys(D.FEATURES).filter(function (k) { return D.FEATURES[k].cat === cat.id; });
      var rows = feats.map(function (k) {
        var f = D.FEATURES[k];
        return '<label class="sw-row">' +
          '<input type="checkbox" data-feat="' + k + '"' + (S.features[k] ? ' checked' : '') + '>' +
          '<span class="sw-track"><span class="sw-thumb"></span></span>' +
          '<span class="sw-text"><b>' + f.icon + ' ' + f.name + '</b><small>' + f.desc + '</small></span>' +
          '</label>';
      }).join('');
      var acc = el(
        '<div class="acc open">' +
        '<button class="acc-head" type="button"><span class="acc-ico">' + cat.icon + '</span>' +
        '<span class="acc-name">' + cat.name + '</span>' +
        '<span class="acc-count"></span><span class="acc-caret">&#9660;</span></button>' +
        '<div class="acc-body"><div class="acc-inner">' + rows + '</div></div>' +
        '</div>'
      );
      acc.querySelector('.acc-head').addEventListener('click', function () { acc.classList.toggle('open'); });
      box.appendChild(acc);
    });

    each(box.querySelectorAll('input[data-feat]'), function (inp) {
      inp.addEventListener('change', function () {
        S.features[inp.getAttribute('data-feat')] = inp.checked;
        updateCounts();
        updateMeta();
        renderPreview();
      });
    });
    updateCounts();
  }

  function updateCounts() {
    var cats = document.querySelectorAll('.acc');
    each(cats, function (acc, i) {
      var cat = D.CATEGORIES[i];
      var n = Object.keys(D.FEATURES).filter(function (k) {
        return D.FEATURES[k].cat === cat.id && S.features[k];
      }).length;
      var count = acc.querySelector('.acc-count');
      count.textContent = n ? String(n) : '';
      count.classList.toggle('has', n > 0);
    });
  }

  /* ---------- VISTA DESKTOP / MOBILE ---------- */
  function buildView() {
    each(document.querySelectorAll('#viewToggle .seg-btn'), function (b) {
      b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
    });
  }

  function setView(v) {
    S.view = v;
    each(document.querySelectorAll('#viewToggle .seg-btn'), function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-view') === v);
    });
    frame.classList.toggle('is-mobile', v === 'mobile');
    updateMeta();
  }

  /* ---------- META E RESET ---------- */
  function updateMeta() {
    var meta = document.getElementById('previewMeta');
    var palName = (D.PALETTES.filter(function (p) { return p.id === S.palette; })[0] || {}).name;
    meta.textContent = (D.LAYOUTS[S.layout] ? D.LAYOUTS[S.layout].name : '') + ' · ' + palName + ' · ' + AppUtils.activeCount(S) + ' funzioni attive';
  }

  function reset() {
    S.layout = 'essential';
    S.palette = 'trattoria';
    S.view = 'desktop';
    Object.keys(S.features).forEach(function (k) { S.features[k] = false; });
    buildLayouts();
    buildPalettes();
    buildFeatures();
    each(document.querySelectorAll('#viewToggle .seg-btn'), function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-view') === 'desktop');
    });
    frame.classList.remove('is-mobile');
    updateMeta();
    renderPreview();
  }

  /* ---------- APRI / CHIUDI PANNELLO ---------- */
  var toggle = document.getElementById('panelToggle');
  function isDesktop() { return window.innerWidth >= 961; }
  function setPanel(open) {
    document.body.classList.toggle('panel-open', open);
    toggle.hidden = open ? true : !isDesktop();
  }

  document.getElementById('panelClose').addEventListener('click', function () { setPanel(false); });
  toggle.addEventListener('click', function () { setPanel(true); });
  document.getElementById('resetBtn').addEventListener('click', reset);

  /* ---------- INIT ---------- */
  applyHash();
  buildLayouts();
  buildPalettes();
  buildFeatures();
  buildView();
  setView(S.view);
  setPanel(isDesktop());
  updateMeta();
  renderPreview();

  window.addEventListener('resize', function () {
    if (!document.body.classList.contains('panel-open')) toggle.hidden = !isDesktop();
  });

  /* Deep-link via hash per preselezionare la demo, es.:
     index.html#mobile,classic,notte,booking,gallery */
  function applyHash() {
    try {
      var h = decodeURIComponent(location.hash.replace(/^#/, ''));
      var toks = h.split(/[,;\s]+/).filter(Boolean);
      toks.forEach(function (t) {
        t = t.trim().toLowerCase();
        if (t === 'mobile' || t === 'desktop') S.view = t;
        if (D.LAYOUTS[t]) S.layout = t;
        if (D.PALETTES.filter(function (p) { return p.id === t; }).length) S.palette = t;
        if (D.FEATURES[t] !== undefined) S.features[t] = true;
      });
    } catch (e) { /* hash malformato: si ignora */ }
  }
})();
