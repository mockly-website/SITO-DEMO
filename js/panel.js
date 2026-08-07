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
  var wrap = document.getElementById('stageWrap');
  var stage = null;
  var VIEW_W = 1440; /* larghezza virtuale del viewport Desktop (CSS px) */

  function stageEl() {
    if (!stage) stage = frame.parentElement.parentElement;
    return stage;
  }

  /* Helper piccolo per iterare NodeList */
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }

  /* ---------- VISTA DESKTOP: viewport virtuale 1440px ----------
     In Desktop l'iframe ha sempre 1440px CSS di larghezza: i breakpoint
     mobile non si attivano mai. L'iframe mantiene l'altezza di una
     finestra del browser (quindi resta scorrevole al suo interno) e il
     wrapper viene scalato con transform: scale(fattore) per adattarsi
     allo spazio disponibile. */
  function applyScale() {
    var f = 1;
    if (S.view === 'desktop') {
      var st = stageEl();
      var avail = Math.max(120, st.clientWidth - 44);   /* padding dello stage */
      var stageH = Math.max(240, st.clientHeight - 44);
      f = Math.min(avail / VIEW_W, 1);
      frame.style.width = '1440px';
      frame.style.height = Math.round(stageH / f) + 'px';
      wrap.style.width = Math.round(VIEW_W * f) + 'px';
      wrap.style.height = Math.round(stageH) + 'px';
      wrap.style.transform = f >= 1 ? 'none' : 'scale(' + f + ')';
    } else {
      frame.style.width = '';
      frame.style.height = '';
      wrap.style.width = '';
      wrap.style.height = '';
      wrap.style.transform = 'none';
    }
    var info = document.getElementById('scaleInfo');
    if (S.view === 'desktop') {
      info.hidden = false;
      info.textContent = 'Anteprima ' + VIEW_W + 'px \u00b7 scala ' + Math.round(f * 100) + '%';
    } else {
      info.hidden = true;
      info.textContent = '';
    }
  }

  /* La scala segue le dimensioni REALI dello stage tramite ResizeObserver:
     nessuna ipotesi sui tempi delle transizioni CSS. Un debounce via
     requestAnimationFrame evita ricalcoli eccessivi durante il resize. */
  var rafId = null;
  function onStageSizeChange() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      applyScale();
    });
  }
  function initScaleObserver() {
    var st = stageEl();
    if (window.ResizeObserver && st) {
      new ResizeObserver(onStageSizeChange).observe(st);
    } else {
      window.addEventListener('resize', onStageSizeChange);
    }
  }

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
      var prev = p.prev || { bg: p.swatches[0], text: '#000', accent: p.swatches[1] };
      var btn = el(
        '<button class="swatch' + (S.palette === p.id ? ' is-active' : '') + '" data-pal="' + p.id + '" title="' + p.name + '"' +
        ' aria-pressed="' + (S.palette === p.id) + '">' +
        '<span class="sw-prev" style="background:' + prev.bg + '">' +
        '<b class="swp-line t" style="background:' + prev.text + '"></b>' +
        '<b class="swp-line s" style="background:' + prev.text + '"></b>' +
        '<span class="swp-btn" style="background:' + prev.accent + '"></span>' +
        '</span>' +
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
    D.CATEGORIES.forEach(function (cat, ci) {
      var feats = Object.keys(D.FEATURES).filter(function (k) { return D.FEATURES[k].cat === cat.id; });
      var hasActive = feats.some(function (k) { return S.features[k]; });
      /* Default: solo la prima categoria aperta; restano aperte quelle
         con almeno una funzione attiva. */
      var isOpen = ci === 0 || hasActive;
      var rows = feats.map(function (k) {
        var f = D.FEATURES[k];
        return '<label class="sw-row">' +
          '<input type="checkbox" data-feat="' + k + '"' + (S.features[k] ? ' checked' : '') + '>' +
          '<span class="sw-track"><span class="sw-thumb"></span></span>' +
          '<span class="sw-text"><b>' + f.icon + ' ' + f.name + '</b><small>' + f.desc + '</small></span>' +
          '</label>';
      }).join('');
      var acc = el(
        '<div class="acc' + (isOpen ? ' open' : '') + '">' +
        '<button class="acc-head" type="button" aria-expanded="' + isOpen + '" aria-controls="acc-body-' + ci + '">' +
        '<span class="acc-ico">' + cat.icon + '</span>' +
        '<span class="acc-name">' + cat.name + '</span>' +
        '<span class="acc-count"></span><span class="acc-caret">&#9660;</span></button>' +
        '<div class="acc-body" id="acc-body-' + ci + '"><div class="acc-inner">' + rows + '</div></div>' +
        '</div>'
      );
      acc.querySelector('.acc-head').addEventListener('click', function () {
        var open = acc.classList.toggle('open');
        this.setAttribute('aria-expanded', open);
      });
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

  /* ---------- CONTENUTI PERSONALIZZABILI ---------- */
  var SITE_FIELDS = [
    { key: 'name',      label: 'Nome del locale',    ph: 'Forno Nero' },
    { key: 'tagline',   label: 'Tagline',            ph: 'Pizzeria · Trattoria · Forno a legna' },
    { key: 'phone',     label: 'Telefono',           ph: '+39 06 1234 5678' },
    { key: 'email',     label: 'Email',              ph: 'ciao@fornonero.it' },
    { key: 'address',   label: 'Indirizzo',          ph: 'Via dei Fornai 12, 00100 Roma' },
    { key: 'whatsapp',  label: 'Numero WhatsApp',    ph: '+39 06 1234 5678' },
    { key: 'hours',     label: 'Orari di apertura',  ph: 'Mar–Dom 19:00–23:30' },
    { key: 'instagram', label: 'Instagram',          ph: '@fornonero' },
    { key: 'facebook',  label: 'Facebook',           ph: '/fornonero' }
  ];

  var siteTimer = null;
  function buildSite() {
    var box = document.getElementById('siteFields');
    if (!box) return;
    box.innerHTML = '';
    SITE_FIELDS.forEach(function (f) {
      var wrap = el(
        '<label class="site-field"><span>' + f.label + '</span>' +
        '<input type="text" data-site="' + f.key + '" value="' + String(S.site[f.key] || '').replace(/"/g, '&quot;') + '" placeholder="' + f.ph + '"></label>'
      );
      var inp = wrap.querySelector('input');
      inp.addEventListener('input', function () {
        S.site[f.key] = inp.value;
        if (siteTimer) clearTimeout(siteTimer);
        siteTimer = setTimeout(function () { siteTimer = null; renderPreview(); }, 220);
      });
      box.appendChild(wrap);
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
    frame.classList.toggle('is-desktop', v === 'desktop');
    wrap.classList.toggle('is-mobile', v === 'mobile');
    wrap.classList.toggle('is-desktop', v === 'desktop');
    updateMeta();
    applyScale();
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
    S.lang = 'it';
    Object.keys(S.features).forEach(function (k) { S.features[k] = false; });
    S.site = {};
    Object.keys(D.SITE_DEFAULTS).forEach(function (k) { S.site[k] = D.SITE_DEFAULTS[k]; });
    buildLayouts();
    buildPalettes();
    buildFeatures();
    buildSite();
    setView('desktop');
    updateMeta();
    renderPreview();
  }

  /* ---------- APRI / CHIUDI PANNELLO ---------- */
  var toggle = document.getElementById('panelToggle');
  function isDesktop() { return window.innerWidth >= 961; }
  function setPanel(open) {
    document.body.classList.toggle('panel-open', open);
    toggle.hidden = open ? true : !isDesktop();
    /* la scala si aggiorna da sola: il ResizeObserver su .stage osserva
       la larghezza che cambia con la transizione del pannello */
  }

  document.getElementById('panelClose').addEventListener('click', function () { setPanel(false); });
  toggle.addEventListener('click', function () { setPanel(true); });
  document.getElementById('resetBtn').addEventListener('click', reset);

  /* La lingua scelta dentro l'anteprima persiste anche dopo un rebuild */
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'fn-lang' && (e.data.lang === 'it' || e.data.lang === 'en')) {
      S.lang = e.data.lang;
    }
  });

  /* Apre la configurazione corrente in una nuova scheda, a tutto schermo */
  document.getElementById('fullscreenBtn').addEventListener('click', function () {
    try {
      var url = URL.createObjectURL(new Blob([window.Render.buildDoc()], { type: 'text/html;charset=utf-8' }));
      var w = window.open(url, '_blank');
      if (w) setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    } catch (e) { /* es. blob non supportato: nessuna azione */ }
  });

  /* ---------- INIT ---------- */
  applyHash();
  buildLayouts();
  buildPalettes();
  buildSite();
  buildFeatures();
  buildView();
  setView(S.view);
  setPanel(isDesktop());
  updateMeta();
  renderPreview();
  initScaleObserver();

  window.addEventListener('resize', function () {
    if (!document.body.classList.contains('panel-open')) toggle.hidden = !isDesktop();
    /* il ResizeObserver su .stage gestisce già il ricalcolo della scala */
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
        /* match case-insensitive sulle chiavi (es. "extrapage" o "extraPage") */
        for (var fk in D.FEATURES) {
          if (fk.toLowerCase() === t) { S.features[fk] = true; break; }
        }
      });
    } catch (e) { /* hash malformato: si ignora */ }
  }
})();
