/* ============================================================
   render.js — Costruisce il documento HTML dell'anteprima
   a partire dallo stato (struttura + palette + funzioni attive).
   Nessun reload: ogni modifica allo stato ricostruisce il contenuto
   dell'iframe (srcdoc) mantenendo palette e funzioni.
   ============================================================ */
(function () {
  'use strict';

  var D = window.AppData;
  var PALETTE_GRAD = {
    trattoria:    { a: '#C0563F', b: '#8C2B21' },
    notte:        { a: '#4A1D22', b: '#121212' },
    mediterraneo: { a: '#1B3A4B', b: '#0F2530' },
    bio:          { a: '#5C7A5C', b: '#3E523E' },
    minimal:      { a: '#C9A227', b: '#8f7220' }
  };

  /* ---------- 1. UTILITY: immagini placeholder (SVG data-uri) ---------- */
  function ph(w, h, emoji, a, b) {
    var gradA = a, gradB = b;
    if (!gradA) gradA = '#3a3a3a';
    if (!gradB) gradB = '#1c1c1c';
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" + gradA + "'/><stop offset='1' stop-color='" + gradB + "'/>" +
      "</linearGradient></defs>" +
      "<rect width='100%' height='100%' fill='url(#g)'/>" +
      "<circle cx='" + (w * 0.82) + "' cy='" + (h * 0.15) + "' r='" + (w * 0.14) + "' fill='rgba(255,255,255,0.06)'/>" +
      "<text x='50%' y='54%' font-size='" + Math.round(h * 0.34) + "' text-anchor='middle' dominant-baseline='central'>" + emoji + "</text>" +
      "</svg>";
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* Palette corrente → gradienti per le immagini demo (coerenza visiva) */
  function grad() { return PALETTE_GRAD[AppState.palette] || PALETTE_GRAD.trattoria; }
  function phw(w, h, emoji) { var g = grad(); return ph(w, h, emoji, g.a, g.b); }

  /* ---------- 2. QR CODE generato (placeholder deterministico) ---------- */
  function qrSVG(size) {
    var n = 29, cell = size / n, seed = 42;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var mods = {};
    function set(x, y, on) { mods[x + ',' + y] = on ? 1 : 0; }
    function get(x, y) { return mods[x + ',' + y] === 1; }
    function finder(cx, cy) {
      for (var r = -3; r <= 3; r++) for (var c = -3; c <= 3; c++) {
        var a = Math.max(Math.abs(r), Math.abs(c));
        if (a === 3 || a <= 1) set(cx + c, cy + r, true);
      }
    }
    function inFinder(x, y) {
      return (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    }
    finder(3, 3); finder(n - 4, 3); finder(3, n - 4);
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      if (inFinder(x, y)) continue;
      if (x === 6 || y === 6) { set(x, y, x % 2 === 0); continue; }   // timing pattern
      var c = (x - n / 2) * (x - n / 2) + (y - n / 2) * (y - n / 2);
      if (c < 25) continue;                                            // area logo centrale
      set(x, y, rnd() > 0.5);
    }
    var rects = '';
    for (var k in mods) {
      if (mods[k] !== 1) continue;
      var p = k.split(',');
      rects += '<rect x="' + (+p[0] * cell) + '" y="' + (+p[1] * cell) + '" width="' + cell + '" height="' + cell + '"/>';
    }
    return (
      '<svg class="qr-svg" viewBox="0 0 ' + size + ' ' + size + '" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="' + size + '" height="' + size + '" rx="18" fill="rgba(0,0,0,0.03)"/>' + rects +
      '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + (size * 0.16) + '" fill="var(--surface)"/>' +
      '<text x="50%" y="56%" font-size="' + (size * 0.15) + '" text-anchor="middle" dominant-baseline="central">&#127829;</text>' +
      '</svg>'
    );
  }

  /* ---------- 3. BADGE funzione attiva (mai prezzi, solo etichette) ---------- */
  function fxTag(id) {
    var f = D.FEATURES[id];
    return '<div class="fx-tag-bar"><span class="fx-tag">&#9733; Funzione extra &middot; ' + (f ? f.badge : id) + '</span></div>';
  }

  /* ---------- 4. Contenuti demo ---------- */
  var DISHES = [
    { cat: 'Antipasti', name: 'Burrata & pomodorini',   emoji: '&#129472;', desc: 'Burrata pugliese, pomodorini confit, basilico fresco e olio EVO.', tags: ['Vegetariano'] },
    { cat: 'Antipasti', name: 'Crocchè di patate',      emoji: '&#129364;', desc: 'Crocchè croccanti fuori, morbidi dentro, serviti con salsa verde.', tags: ['Vegano'] },
    { cat: 'Antipasti', name: 'Frittatina napoletana',  emoji: '&#127859;', desc: 'La classica frittatina con pasta, piselli e besciamella.', tags: ['Popolare'] },
    { cat: 'Primi',     name: 'Paccheri al ragù di mare', emoji: '&#127837;', desc: 'Pasta fresca, gamberi rossi, pomodorini e bottarga di muggine.', tags: ['Pesce'] },
    { cat: 'Primi',     name: 'Vellutata di zucca',     emoji: '&#127817;', desc: 'Zucca lunga, latte di cocco, mandorle tostate e olio al peperoncino.', tags: ['Vegetariano', 'Senza glutine'] },
    { cat: 'Primi',     name: 'Gnocchi alla sorrentina', emoji: '&#129472;', desc: 'Gnocchi di patate, pomodoro San Marzano e fior di latte.', tags: ['Vegetariano'] },
    { cat: 'Pizze',     name: 'Margherita DOC',         emoji: '&#127829;', desc: 'Pomodoro San Marzano, fior di latte, basilico e olio EVO.', tags: ['Vegetariano', 'Popolare'] },
    { cat: 'Pizze',     name: 'Forno Nero',             emoji: '&#127829;', desc: 'Impasto al carbone vegetale, bufala, nduja e miele piccante.', tags: ['Piccante'] },
    { cat: 'Pizze',     name: 'Diavola',                emoji: '&#127829;', desc: 'Salame piccante, pomodoro, fior di latte e olive nere.', tags: ['Piccante'] },
    { cat: 'Dolci',     name: 'Tiramisù della casa',    emoji: '&#127854;', desc: 'Mascarpone, savoiardi al caffè e cacao amaro.', tags: ['Popolare'] },
    { cat: 'Dolci',     name: 'Babà al rum',            emoji: '&#127853;', desc: 'Babà artigianale bagnato al rum, servito con crema chantilly.', tags: ['Classico'] },
    { cat: 'Dolci',     name: 'Sorbetto al limone',     emoji: '&#127819;', desc: 'Sorbetto fresco al limone di Sorrento con menta.', tags: ['Vegano', 'Senza glutine'] }
  ];

  var BLOG_POSTS = [
    { emoji: '&#127829;', date: '2 giorni fa', read: '4 min', title: 'La nuova carta delle pizze di stagione', excerpt: 'Tre nuove ricette ispirate all\'orto di novembre: scoprile in anteprima.' },
    { emoji: '&#129506;', date: '1 settimana fa', read: '6 min', title: 'Dietro le quinte: il nostro impasto a 72 ore', excerpt: 'Farine, acqua e tempo. Ti raccontiamo come nasce la nostra pizza.' },
    { emoji: '&#127854;', date: '2 settimane fa', read: '3 min', title: 'Intervista al fornaio: tre segreti del forno a legna', excerpt: 'Abbiamo chiesto a Vincenzo cosa rende speciale la sua giornata in forno.' }
  ];

  var EVENTS = [
    { emoji: '&#127863;', date: 'Ven 12', name: 'Degustazione vini naturali', desc: 'Cinque etichette piccole e artigianali abbinate a tre assaggi del nostro menù.' },
    { emoji: '&#127928;', date: 'Sab 20', name: 'Serata jazz dal vivo', desc: 'Un trio acustico accompagna la cena: consigliata la prenotazione.' },
    { emoji: '&#127858;', date: 'Dom 28', name: 'Laboratorio pizza per bambini', desc: 'Impastare, stendere e infornare: un pomeriggio per i piccoli pizzaioli.' }
  ];

  var POSTS = [
    { emoji: '&#127829;', title: 'Pizza e amici', likes: '234' },
    { emoji: '&#127860;', title: 'Vino & pane', likes: '187' },
    { emoji: '&#127861;', title: 'Aperitivo', likes: '310' },
    { emoji: '&#127859;', title: 'La cucina', likes: '142' },
    { emoji: '&#127853;', title: 'Dolci fatti in casa', likes: '268' },
    { emoji: '&#127748;', title: 'La terrazza', likes: '351' }
  ];

  /* ---------- 5. Dizionario multilingua (IT / EN) ---------- */
  var DICT = {
    nav_home: { it: 'Home', en: 'Home' },
    nav_about: { it: 'Chi Siamo', en: 'About' },
    nav_menu: { it: 'Menu', en: 'Menu' },
    nav_events: { it: 'Eventi', en: 'Events' },
    nav_blog: { it: 'Blog', en: 'Blog' },
    nav_contact: { it: 'Contatti', en: 'Contact' },
    hero_tag: { it: 'Pizzeria &middot; Trattoria &middot; Forno a legna', en: 'Pizzeria &middot; Trattoria &middot; Wood-fired oven' },
    hero_title1: { it: 'Forno', en: 'Forno' },
    hero_title2: { it: 'Nero', en: 'Nero' },
    hero_sub: { it: 'Pizza napoletana e cucina di stagione. Impasto a lunga lievitazione e materie prime da filiera corta, ogni giorno dal 1978.', en: 'Neapolitan pizza and seasonal cooking. Long-leavened dough and short-chain ingredients, every day since 1978.' },
    cta_menu: { it: 'Scopri il menu', en: 'Explore the menu' },
    cta_book: { it: 'Prenota un tavolo', en: 'Book a table' },
    about_kicker: { it: 'La nostra storia', en: 'Our story' },
    about_title: { it: 'Un forno, tre generazioni, lo stesso impasto', en: 'One oven, three generations, the same dough' },
    about_text: { it: 'Nato nel cuore della città, Forno Nero è un locale di quartiere dove il forno a legna scoppietta ogni sera dalle 19. Tre generazioni, lo stesso impasto, la stessa passione per le cose semplici fatte bene.', en: 'Born in the heart of the city, Forno Nero is a neighbourhood spot where the wood-fired oven crackles every night from 7pm. Three generations, the same dough, the same passion for simple things done well.' },
    fact_years: { it: 'Anni di storia', en: 'Years of history' },
    fact_seats: { it: 'Coperti', en: 'Seats' },
    fact_flours: { it: 'Farine bio', en: 'Organic flours' },
    menu_kicker: { it: 'I nostri piatti', en: 'Our dishes' },
    menu_title: { it: 'Da assaggiare stasera', en: 'Worth tasting tonight' },
    menu_sub: { it: 'Una selezione breve e sempre fresca, scritta ogni giorno alla lavagna.', en: 'A short, always-fresh selection, written on the blackboard every day.' },
    dm_kicker: { it: 'Menu digitale', en: 'Digital menu' },
    dm_title: { it: 'Il menu, in tasca', en: 'The menu, in your pocket' },
    dm_sub: { it: 'Filtra per categoria e tocca un piatto per i dettagli.', en: 'Filter by category and tap a dish for details.' },
    dm_all: { it: 'Tutti', en: 'All' },
    booking_kicker: { it: 'Prenota online', en: 'Book online' },
    booking_title: { it: 'Il tuo tavolo, in pochi click', en: 'Your table, in a few clicks' },
    booking_sub: { it: 'Scegli data, ora e numero di persone: ti confermiamo noi per telefono.', en: 'Pick date, time and party size: we confirm by phone.' },
    book_name: { it: 'Nome e cognome', en: 'Full name' },
    book_phone: { it: 'Telefono', en: 'Phone' },
    book_date: { it: 'Data', en: 'Date' },
    book_time: { it: 'Ora', en: 'Time' },
    book_people: { it: 'Persone', en: 'Guests' },
    book_submit: { it: 'Conferma prenotazione', en: 'Confirm booking' },
    book_ok_title: { it: 'Prenotazione ricevuta!', en: 'Booking received!' },
    book_ok_msg: { it: 'Ti chiameremo entro un\'ora per confermare il tavolo. Grazie e a presto!', en: 'We will call you within an hour to confirm your table. Thank you!' },
    book_req: { it: 'Campo obbligatorio', en: 'Required field' },
    events_kicker: { it: 'Eventi', en: 'Events' },
    events_title: { it: 'Il locale non si ferma mai', en: 'The place never stops' },
    events_sub: { it: 'Degustazioni, musica dal vivo e laboratori: uno sguardo al calendario.', en: 'Tastings, live music and workshops: a look at the calendar.' },
    blog_kicker: { it: 'Ultime dal locale', en: 'Latest news' },
    blog_title: { it: 'Blog & news', en: 'Blog & news' },
    blog_sub: { it: 'Storie, ricette e curiosità direttamente dal nostro forno.', en: 'Stories, recipes and insights straight from our oven.' },
    gallery_kicker: { it: 'Galleria', en: 'Gallery' },
    gallery_title: { it: 'Uno sguardo dentro', en: 'A look inside' },
    social_kicker: { it: 'Seguici', en: 'Follow us' },
    social_title: { it: 'Siamo anche qui', en: 'We are also here' },
    social_cta: { it: 'Segui su Instagram', en: 'Follow on Instagram' },
    qr_kicker: { it: 'QR code', en: 'QR code' },
    qr_title: { it: 'Il menu, a portata di smartphone', en: 'The menu, at your fingertips' },
    qr_sub: { it: 'Inquadra il codice con la fotocamera per aprire il menu digitale.', en: 'Point your camera at the code to open the digital menu.' },
    gbp_title: { it: 'La tua scheda su Google', en: 'Your Google listing' },
    gbp_rev1: { it: 'La pizza più leggera che abbia mai mangiato, e il personale è davvero gentile.', en: 'The lightest pizza I have ever had, and the staff is really kind.' },
    gbp_rev2: { it: 'L\'impasto è un altro mondo rispetto ai soliti. Ci torniamo ogni settimana.', en: 'The dough is a whole other world compared to the usual ones. We come back every week.' },
    contact_kicker: { it: 'Contatti', en: 'Contact' },
    contact_title: { it: 'Vieni a trovarci', en: 'Come and visit us' },
    contact_sub: { it: 'Siamo nel centro storico, a due passi da piazza del mercato.', en: 'We are in the old town, two steps from the market square.' },
    c_name: { it: 'Nome', en: 'Name' },
    c_email: { it: 'Email', en: 'Email' },
    c_msg: { it: 'Messaggio', en: 'Message' },
    c_send: { it: 'Invia messaggio', en: 'Send message' },
    c_ok_title: { it: 'Messaggio inviato!', en: 'Message sent!' },
    c_ok_msg: { it: 'Ti risponderemo al più presto. Grazie per averci scritto.', en: 'We will get back to you as soon as possible. Thank you for writing.' },
    footer_tag: { it: 'Forno Nero &mdash; dal 1978', en: 'Forno Nero &mdash; since 1978' },
    footer_text: { it: 'Il gusto semplice di un vero forno a legna: pizza, cucina di stagione e tanta ospitalità.', en: 'The simple taste of a real wood-fired oven: pizza, seasonal cooking and warm hospitality.' }
  };

  /* ---------- 6. Funzioni di supporto HTML ---------- */
  function esc(s) { return String(s).replace(/"/g, '&quot;'); }

  function sectionHead(kicker, title, sub, center) {
    function tag(label, tagName, cls) {
      var open = '<' + tagName + ' class="' + cls + '"' + (DICT[label] ? ' data-i18n="' + label + '"' : '') + '>';
      return open + (DICT[label] ? DICT[label].it : label) + '</' + tagName + '>';
    }
    return '<div class="section-head' + (center ? ' center' : '') + '">' +
      tag(kicker, 'span', 'kicker') +
      tag(title, 'h2', 'sec-title') +
      (sub ? tag(sub, 'p', 'sec-sub') : '') +
      '</div>';
  }

  function reveal(cls) { return AppState.features.animations ? ' reveal ' + (cls || '') : ''; }

  /* ---------- 7. NAV ---------- */
  function navItems() {
    var items = [
      { id: 'top', key: 'nav_home', anchor: 'top' },
      { id: 'chi-siamo', key: 'nav_about', anchor: 'chi-siamo' },
      { id: 'menu', key: 'nav_menu', anchor: 'menu' }
    ];
    if (AppState.features.extraPage) items.push({ id: 'eventi', key: 'nav_events', anchor: 'eventi' });
    if (AppState.features.blog) items.push({ id: 'blog', key: 'nav_blog', anchor: 'blog' });
    items.push({ id: 'contatti', key: 'nav_contact', anchor: 'contatti', cta: true });
    return items;
  }

  function navLinks() {
    var h = '<ul class="nav-links">';
    navItems().forEach(function (it) {
      h += '<li><a href="#' + it.anchor + '"' + (it.cta ? ' class="is-cta"' : '') + ' data-i18n="' + it.key + '">' + DICT[it.key].it + '</a></li>';
    });
    h += '</ul>';
    return h;
  }

  function langSwitch() {
    if (!AppState.features.multilang) return '';
    return '<div class="lang-switch">' +
      '<button class="lang-btn is-active" data-lang="it">IT</button>' +
      '<button class="lang-btn" data-lang="en">EN</button></div>';
  }

  function headerHTML() {
    var layout = AppState.layout;
    var brand = '<a class="nav-brand" href="#top"><span class="mark">FN</span><span>Forno Nero</span></a>';
    var h = '<header class="site-header"><div class="container nav">' + brand +
      navLinks() +
      '<div style="display:flex;align-items:center;gap:12px">' + langSwitch() +
      '<button class="nav-toggle" aria-label="Menu">&#9776;</button></div>' +
      '</div></header>';
    return h;
  }

  /* ---------- 8. HERO (3 varianti) ---------- */
  function heroHTML() {
    var layout = AppState.layout;
    if (layout === 'essential') {
      return (
        '<section class="hero" id="top"><div class="hero-orb"></div>' +
        '<div class="hero-pic" aria-hidden="true"><img src="' + phw(900, 900, '&#127829;') + '" alt=""></div>' +
        '<div class="container">' +
        '<p class="hero-kicker" data-i18n="hero_tag">' + DICT.hero_tag.it + '</p>' +
        '<h1 class="hero-title" data-i18n="hero_title1">' + DICT.hero_title1.it + ' <span data-i18n="hero_title2">' + DICT.hero_title2.it + '</span></h1>' +
        '<p class="hero-sub" data-i18n="hero_sub">' + DICT.hero_sub.it + '</p>' +
        '<div class="hero-cta">' +
        '<a href="#menu" class="btn" data-i18n="cta_menu">' + DICT.cta_menu.it + '</a>' +
        '<a href="#contatti" class="btn btn-ghost" data-i18n="cta_book">' + DICT.cta_book.it + '</a>' +
        '</div></div>' +
        '<a class="scroll-hint" href="#chi-siamo" aria-label="Scorri per scoprire di pi\u00f9">&#9660;</a></section>'
      );
    }
    if (layout === 'classic') {
      return (
        '<section class="hero" id="top">' +
        '<div class="hero-bg" data-parallax style="--hero-img:url(&quot;' + phw(1400, 900, '&#127829;') + '&quot;)"></div>' +
        '<div class="container hero-inner">' +
        '<p class="hero-kicker" data-i18n="hero_tag">' + DICT.hero_tag.it + '</p>' +
        '<h1 class="hero-title" data-i18n="hero_title1">' + DICT.hero_title1.it + ' <span data-i18n="hero_title2">' + DICT.hero_title2.it + '</span></h1>' +
        '<p class="hero-sub" data-i18n="hero_sub">' + DICT.hero_sub.it + '</p>' +
        '<div class="hero-cta">' +
        '<a href="#menu" class="btn" data-i18n="cta_menu">' + DICT.cta_menu.it + '</a>' +
        '<a href="#contatti" class="btn btn-ghost" style="border-color:#fff;color:#fff" data-i18n="cta_book">' + DICT.cta_book.it + '</a>' +
        '</div>' +
        '<div class="hero-facts">' +
        '<div class="hero-fact"><b data-i18n="fact_years">47</b><span data-i18n="fact_years">' + DICT.fact_years.it + '</span></div>' +
        '<div class="hero-fact"><b>60</b><span>Coperti</span></div>' +
        '<div class="hero-fact"><b>100%</b><span>Farine bio</span></div>' +
        '</div></div></section>'
      );
    }
    // modern
    return (
      '<section class="hero" id="top"><div class="container hero-grid">' +
      '<div class="hero-copy">' +
      '<p class="hero-kicker" data-i18n="hero_tag">' + DICT.hero_tag.it + '</p>' +
      '<h1 class="hero-title">' + DICT.hero_title1.it + ' <span data-i18n="hero_title2">' + DICT.hero_title2.it + '</span></h1>' +
      '<p class="hero-sub" data-i18n="hero_sub">' + DICT.hero_sub.it + '</p>' +
      '<div class="hero-cta">' +
      '<a href="#menu" class="btn" data-i18n="cta_menu">' + DICT.cta_menu.it + '</a>' +
      '<a href="#contatti" class="btn btn-ghost" data-i18n="cta_book">' + DICT.cta_book.it + '</a>' +
      '</div>' +
      '<div class="hero-stats">' +
      '<div><b>47</b><span data-i18n="fact_years">' + DICT.fact_years.it + '</span></div>' +
      '<div><b>60</b><span>Coperti</span></div>' +
      '<div><b>100%</b><span>Farine bio</span></div>' +
      '</div></div>' +
      '<div class="hero-visual reveal">' +
      '<div class="hero-img-tilt"><img src="' + phw(600, 760, '&#127829;') + '" alt="Pizza"></div>' +
      '<span class="hero-stamp">Dal 1978</span>' +
      '</div></div></section>'
    );
  }

  /* ---------- 9. ABOUT ---------- */
  function aboutHTML() {
    var layout = AppState.layout;
    var facts =
      '<div class="about-facts">' +
      '<div><b>47</b><span data-i18n="fact_years">' + DICT.fact_years.it + '</span></div>' +
      '<div><b>60</b><span>Coperti</span></div>' +
      '<div><b>100%</b><span>Farine bio</span></div></div>';

    if (layout === 'modern') {
      return (
        '<section class="section" id="chi-siamo"><div class="container">' +
        '<div class="about-grid">' +
        '<div class="about-media reveal"><img src="' + phw(700, 520, '&#128588;') + '" alt="La nostra cucina"></div>' +
        '<div class="reveal reveal-d1">' +
        '<div class="about-num">01</div>' +
        '<span class="kicker" data-i18n="about_kicker">' + DICT.about_kicker.it + '</span>' +
        '<h2 class="sec-title" data-i18n="about_title">' + DICT.about_title.it + '</h2>' +
        '<p class="sec-sub" data-i18n="about_text">' + DICT.about_text.it + '</p>' + facts +
        '</div></div></div></section>'
      );
    }
    var media = '<div class="about-media reveal"><img src="' + phw(700, 520, '&#127867;') + '" alt="I nostri vini"></div>';
    return (
      '<section class="section alt" id="chi-siamo"><div class="container">' +
      '<div class="about-grid">' +
      (layout === 'classic' ? media + '<div class="reveal reveal-d1">' : '<div class="reveal reveal-d1">') +
      '<span class="kicker" data-i18n="about_kicker">' + DICT.about_kicker.it + '</span>' +
      '<h2 class="sec-title" data-i18n="about_title">' + DICT.about_title.it + '</h2>' +
      '<p class="sec-sub" data-i18n="about_text">' + DICT.about_text.it + '</p>' + facts +
      '</div>' + (layout === 'essential' ? '' : media) +
      '</div></div></section>'
    );
  }

  /* ---------- 10. MENU (base) ---------- */
  function baseMenuHTML() {
    var layout = AppState.layout;
    /* Menù base: solo vetrina, senza filtri né interattività (quelli
       arrivano con il Menu Digitale). Sempre presente, 6 piatti. */
    var dishes = [
      { emoji: '&#127829;', name: 'Margherita DOC', desc: 'Pomodoro San Marzano, fior di latte e basilico fresco.', tag: 'Vegetariana' },
      { emoji: '&#127829;', name: 'Forno Nero', desc: 'Impasto al carbone vegetale, bufala, nduja e miele piccante.', tag: 'Piccante' },
      { emoji: '&#127829;', name: 'Diavola', desc: 'Salame piccante, fior di latte e olive nere.', tag: 'Piccante' },
      { emoji: '&#127837;', name: 'Paccheri al ragù di mare', desc: 'Pasta fresca, gamberi rossi, pomodorini e bottarga.', tag: 'Pesce' },
      { emoji: '&#129364;', name: 'Crocchè di patate', desc: 'Croccanti fuori, morbidi dentro, con salsa verde.', tag: 'Vegano' },
      { emoji: '&#127854;', name: 'Tiramisù della casa', desc: 'Mascarpone, savoiardi al caffè e cacao amaro.', tag: 'Dolce' }
    ];
    if (layout === 'modern') {
      var rows = '';
      dishes.forEach(function (d, i) {
        rows += '<div class="menu-row reveal reveal-d' + (i + 1) + '"><i>0' + (i + 1) + '</i>' +
          '<div><h3>' + d.name + '</h3><p>' + d.desc + '</p></div><span class="tag">' + d.tag + '</span></div>';
      });
      return '<section class="section" id="menu"><div class="container">' + sectionHead('menu_kicker', 'menu_title', 'menu_sub') +
        '<div class="menu-list">' + rows + '</div></div></section>';
    }
    var cards = '';
    dishes.forEach(function (d) {
      cards += '<article class="dish-card reveal"><img src="' + phw(500, 320, d.emoji) + '" alt="' + esc(d.name) + '">' +
        '<div class="dish-body"><h3>' + d.name + '</h3><p>' + d.desc + '</p></div></article>';
    });
    return '<section class="section alt" id="menu"><div class="container">' + sectionHead('menu_kicker', 'menu_title', 'menu_sub', true) +
      '<div class="menu-grid">' + cards + '</div></div></section>';
  }

  /* ---------- 11. MENU DIGITALE (funzione) ---------- */
  function digitalMenuHTML() {
    var cats = ['Tutti', 'Antipasti', 'Primi', 'Pizze', 'Dolci'];
    var chips = cats.map(function (c) {
      return '<button class="dm-chip' + (c === 'Tutti' ? ' is-active' : '') + '" data-filter="' + c + '"' + (c === 'Tutti' ? ' data-i18n="dm_all"' : '') + '>' + (c === 'Tutti' ? DICT.dm_all.it : c) + '</button>';
    }).join('');
    var cards = '';
    DISHES.forEach(function (d, i) {
      cards += '<article class="dish reveal reveal-d' + ((i % 3) + 1) + '" data-cat="' + d.cat + '" data-idx="' + i + '">' +
        (d.tags.indexOf('Popolare') > -1 ? '<span class="pop">Popolare</span>' : '') +
        '<img src="' + phw(400, 400, d.emoji) + '" alt="' + esc(d.name) + '">' +
        '<div class="dish-body"><h3>' + d.name + '</h3><p>' + d.desc + '</p>' +
        '<div class="dish-tags">' + d.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div></div></article>';
    });
    return (
      '<section class="section alt" id="menu"><div class="container">' +
      sectionHead('dm_kicker', 'dm_title', 'dm_sub') +
      '<div class="dm-toolbar"><div class="dm-filters">' + chips + '</div>' +
      '<span class="fx-tag" style="flex:none">&#9733; ' + D.FEATURES.digitalMenu.badge + '</span></div>' +
      '<div class="dm-grid">' + cards + '</div>' +
      '<p class="dm-hint">Tocca un piatto per vederne i dettagli</p>' +
      '</div></section>'
    );
  }

  /* ---------- 12. EVENTI (pagina extra) ---------- */
  function eventsHTML() {
    var cards = EVENTS.map(function (e, i) {
      return '<article class="event-card reveal reveal-d' + (i + 1) + (i === 0 ? ' is-live' : '') + '">' +
        '<img src="' + phw(600, 340, e.emoji) + '" alt="' + esc(e.name) + '">' +
        '<div class="event-body"><span class="event-date">' + e.date + '</span>' +
        '<h3>' + e.name + '</h3><p>' + e.desc + '</p></div></article>';
    }).join('');
    return (
      '<section class="section" id="eventi"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.extraPage.badge + '</span></div>' +
      sectionHead('events_kicker', 'events_title', 'events_sub') +
      '<div class="events-grid">' + cards + '</div></div></section>'
    );
  }

  /* ---------- 13. BLOG (funzione) ---------- */
  function blogHTML() {
    var cards = BLOG_POSTS.map(function (p, i) {
      return '<article class="post-card reveal reveal-d' + (i + 1) + '">' +
        '<img src="' + phw(600, 380, p.emoji) + '" alt="">' +
        '<div class="post-body"><div class="post-meta"><span>' + p.date + '</span><span>&middot; ' + p.read + '</span></div>' +
        '<h3>' + p.title + '</h3><p>' + p.excerpt + '</p></div></article>';
    }).join('');
    return (
      '<section class="section alt" id="blog"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.blog.badge + '</span></div>' +
      sectionHead('blog_kicker', 'blog_title', 'blog_sub') +
      '<div class="blog-grid">' + cards + '</div></div></section>'
    );
  }

  /* ---------- 14. PRENOTAZIONE ONLINE (funzione) ---------- */
  function bookingHTML() {
    return (
      '<section class="section" id="prenota"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.booking.badge + '</span></div>' +
      '<div class="booking-wrap">' +
      '<div class="booking-info"><span class="kicker" data-i18n="booking_kicker">' + DICT.booking_kicker.it + '</span>' +
      '<h2 data-i18n="booking_title">' + DICT.booking_title.it + '</h2>' +
      '<p class="sec-sub" data-i18n="booking_sub">' + DICT.booking_sub.it + '</p>' +
      '<ul><li><span style="font-size:1.4rem">&#9201;</span><span><b>Orario</b><br>Cena dalle 19:00 alle 23:30</span></li>' +
      '<li><span style="font-size:1.4rem">&#128100;</span><span><b>Gruppi</b><br>Tavoli fino a 12 persone</span></li>' +
      '<li><span style="font-size:1.4rem">&#127881;</span><span><b>Occasioni</b><br>Compleanni e cene di lavoro</span></li></ul>' +
      '</div>' +
      '<div class="form-card"><form id="bookForm" novalidate>' +
      '<div class="form-row">' +
      '<div class="field"><label for="bk-name" data-i18n="book_name">' + DICT.book_name.it + '</label>' +
      '<input id="bk-name" type="text" required data-i18n-ph="book_name"><span class="err">' + DICT.book_req.it + '</span></div>' +
      '<div class="field"><label for="bk-phone" data-i18n="book_phone">' + DICT.book_phone.it + '</label>' +
      '<input id="bk-phone" type="tel" required pattern="[0-9+ ]{6,}" data-i18n-ph="book_phone"><span class="err">Inserisci un numero valido</span></div>' +
      '</div>' +
      '<div class="form-row">' +
      '<div class="field"><label for="bk-date" data-i18n="book_date">' + DICT.book_date.it + '</label>' +
      '<input id="bk-date" type="date" required><span class="err">Scegli una data futura</span></div>' +
      '<div class="field"><label for="bk-time" data-i18n="book_time">' + DICT.book_time.it + '</label>' +
      '<select id="bk-time" required><option value="">--:--</option>' +
      '<option>19:00</option><option>19:30</option><option>20:00</option><option>20:30</option><option>21:00</option><option>21:30</option><option>22:00</option></select><span class="err">' + DICT.book_req.it + '</span></div>' +
      '</div>' +
      '<div class="field"><label for="bk-people" data-i18n="book_people">' + DICT.book_people.it + '</label>' +
      '<select id="bk-people" required><option value="1">1 persona</option><option value="2" selected>2 persone</option>' +
      '<option value="3">3 persone</option><option value="4">4 persone</option><option value="5">5 persone</option>' +
      '<option value="6">6 persone</option><option value="8">8 persone</option><option value="12">fino a 12</option></select><span class="err">' + DICT.book_req.it + '</span></div>' +
      '<button class="btn" type="submit" style="width:100%" data-i18n="book_submit">' + DICT.book_submit.it + '</button>' +
      '<div class="form-ok" id="bookOk"><div class="ok-ico">&#127881;</div><h3 data-i18n="book_ok_title">' + DICT.book_ok_title.it + '</h3>' +
      '<p data-i18n="book_ok_msg">' + DICT.book_ok_msg.it + '</p></div>' +
      '</form></div>' +
      '</div></div></section>'
    );
  }

  /* ---------- 15. GALLERIA + LIGHTBOX (funzione) ---------- */
  var GALLERY = ['&#127829;', '&#127837;', '&#127860;', '&#127864;', '&#127854;', '&#127861;', '&#129472;', '&#127826;'];
  function galleryHTML() {
    var imgs = [];
    var items = '';
    GALLERY.forEach(function (e, i) {
      var uri = phw(500, 500, e);
      imgs.push(uri);
      items += '<div class="gal-item" data-i="' + i + '"><img src="' + uri + '" alt=""></div>';
    });
    return (
      '<section class="section" id="galleria"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.gallery.badge + '</span></div>' +
      sectionHead('gallery_kicker', 'gallery_title', null, true) +
      '<div class="gal-grid">' + items + '</div>' +
      '<div class="lightbox" id="lb" role="dialog">' +
      '<button class="lb-btn lb-prev" aria-label="Precedente">&#8249;</button>' +
      '<img id="lbImg" src="" alt="">' +
      '<button class="lb-btn lb-next" aria-label="Successiva">&#8250;</button>' +
      '<button class="lb-close" aria-label="Chiudi">&#10005;</button>' +
      '<span class="lb-count" id="lbCount"></span></div>' +
      '</div></section>'
    );
  }

  /* ---------- 16. FEED SOCIAL (funzione) ---------- */
  function socialHTML() {
    var items = POSTS.map(function (p) {
      return '<div class="social-item"><img src="' + phw(300, 300, p.emoji) + '" alt="' + esc(p.title) + '"></div>';
    }).join('');
    return (
      '<section class="section" id="social"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.socialFeed.badge + '</span></div>' +
      sectionHead('social_kicker', 'social_title', null, true) +
      '<div class="social-grid">' + items + '</div>' +
      '<div class="social-cta"><a class="btn" href="#social" onclick="return false">&#128247; <span data-i18n="social_cta">' + DICT.social_cta.it + '</span></a></div>' +
      '</div></section>'
    );
  }

  /* ---------- 17. QR CODE (funzione) ---------- */
  function qrHTML() {
    return (
      '<section class="section alt" id="qr"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.qrCode.badge + '</span></div>' +
      '<div class="qr-grid">' +
      '<div class="qr-card reveal">' + qrSVG(220) + '</div>' +
      '<div class="reveal reveal-d1"><span class="kicker" data-i18n="qr_kicker">' + DICT.qr_kicker.it + '</span>' +
      '<h2 class="sec-title" data-i18n="qr_title">' + DICT.qr_title.it + '</h2>' +
      '<p class="sec-sub" data-i18n="qr_sub">' + DICT.qr_sub.it + '</p>' +
      '<p class="sec-sub" style="margin-top:14px;font-size:.9rem">' + (AppState.features.digitalMenu ? 'Collegato al menu digitale attivo qui sopra.' : 'Attiva anche il menu digitale per collegarlo al codice.') + '</p>' +
      '</div></div></div></section>'
    );
  }

  /* ---------- 18. BEFORE/AFTER generico ---------- */
  function baSlider(beforeHTML, afterHTML, tagBefore, tagAfter) {
    return (
      '<div class="ba" style="aspect-ratio:16/9;max-width:900px;margin-inline:auto">' +
      '<div class="ba-b">' + afterHTML + '</div>' +
      '<div class="ba-t">' + beforeHTML + '</div>' +
      '<input type="range" min="0" max="100" value="50" aria-label="Confronto">' +
      '<span class="ba-tag before">' + tagBefore + '</span>' +
      '<span class="ba-tag after">' + tagAfter + '</span>' +
      '</div>'
    );
  }

  function proPhotoHTML() {
    var g = grad();
    return (
      '<section class="section" id="foto-pro"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.proPhoto.badge + '</span></div>' +
      sectionHead('Fotografia professionale', 'Fotografia professionale', 'Lo stesso piatto, fotografato in modo professionale: luce, composizione e colore fanno la differenza.', true) +
      baSlider(
        '<img src="' + ph(900, 506, '&#127829;', '#8f9296', '#6d7073') + '" alt="Foto amatoriale">',
        '<img src="' + ph(900, 506, '&#127829;', g.a, g.b) + '" alt="Foto professionale">',
        'Prima · amatoriale', 'Dopo · professionale'
      ) +
      '<p class="ba-note"><b>Risultato:</b> piatti più appetitosi e un sito che trasmette subito la qualità del locale.</p>' +
      '</div></section>'
    );
  }

  function photoEditHTML() {
    var g = grad();
    return (
      '<section class="section alt" id="editing"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.photoEdit.badge + '</span></div>' +
      sectionHead('Editing & ritocco', 'Editing foto / ritocco', 'Correzione colore, pulizia e rimozione di elementi di disturbo come i watermark.', true) +
      baSlider(
        '<img src="' + ph(900, 506, '&#127837;', '#9a9da1', '#777a7e') + '" alt="Prima del ritocco" style="filter:saturate(.2) contrast(.9)">',
        '<img src="' + ph(900, 506, '&#127837;', g.b, g.a) + '" alt="Dopo il ritocco">',
        'Prima · watermark', 'Dopo · ritocco'
      ) +
      '<p class="ba-note"><b>Risultato:</b> immagini pulite, senza watermark, coerenti con la palette del sito.</p>' +
      '</div></section>'
    );
  }

  /* ---------- 19. LOGO / IDENTITÀ VISIVA (funzione) ---------- */
  function logoHTML() {
    return (
      '<section class="section" id="identita"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.logo.badge + '</span></div>' +
      sectionHead('Logo & identità', 'Identità visiva', 'Due varianti dello stesso logo: una per fondi chiari, una per fondi scuri.', true) +
      '<div class="logo-grid">' +
      '<div class="logo-card light reveal"><div><div class="logo-mark">' +
      '<div class="logo-square">FN</div><div class="logo-type"><b>Forno Nero</b><span>Pizzeria &middot; 1978</span></div></div>' +
      '<p class="logo-cap">Variante chiara</p></div></div>' +
      '<div class="logo-card dark reveal reveal-d1"><div><div class="logo-mark">' +
      '<div class="logo-square">FN</div><div class="logo-type"><b>Forno Nero</b><span>Pizzeria &middot; 1978</span></div></div>' +
      '<p class="logo-cap" style="color:inherit;opacity:.6">Variante scura</p></div></div>' +
      '</div></div></section>'
    );
  }

  /* ---------- 20. SEO (funzione) ---------- */
  function seoJSONLD() {
    return (
      '<script type="application/ld+json">' +
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: 'Forno Nero',
        servesCuisine: 'Pizza, Cucina napoletana',
        acceptsReservations: 'True',
        address: { '@type': 'PostalAddress', addressLocality: 'Roma' },
        aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.7', reviewCount: '312' }
      }) +
      '</script>'
    );
  }

  function seoChip() {
    return (
      '<div class="seo-chip tip"><span class="dot"></span> SEO avanzata &middot; Schema markup attivo' +
      '<span class="tip-box"><b>Schema markup (dati strutturati)</b><br>Dice a Google chi sei: nome, tipo di attività, orari, recensioni. Il sito appare con stelle e dettagli nei risultati di ricerca.</span></div>'
    );
  }

  /* ---------- 21. GOOGLE BUSINESS PROFILE (funzione) ---------- */
  function googleBusinessHTML() {
    return (
      '<section class="section alt" id="gbp"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.googleBusiness.badge + '</span></div>' +
      sectionHead('Google Business Profile', 'La tua scheda su Google', 'Anteprima simulata di come appari nelle ricerche: recensioni, orari e mappa.', true) +
      '<div class="gbp-card reveal">' +
      '<div class="gbp-head"><div class="gbp-logo">FN</div>' +
      '<div style="flex:1"><b>Forno Nero &middot; Pizzeria</b>' +
      '<div class="gbp-stars" title="4,7 su 5">&#9733;&#9733;&#9733;&#9733;&#189;</div>' +
      '<div style="font-size:12px;color:var(--muted)">4,7 &middot; 312 recensioni</div>' +
      '<div class="gbp-actions"><span>Chiama</span><span>Indicazioni</span><span>Recensisci</span></div></div></div>' +
      '<div class="gbp-body">' +
      '<div class="gbp-row"><span>&#128205;</span><span><b>Via dei Fornai 12</b> &middot; centro storico</span></div>' +
      '<div class="gbp-row"><span>&#9201;</span><span><b>Aperto</b> &middot; chiude alle 23:30 &middot; Mar&ndash;Dom</span></div>' +
      '<div class="gbp-map"><span class="gbp-pin">&#128205;</span></div>' +
      '<div class="gbp-reviews">' +
      '<div class="gbp-rev"><div style="font-size:15px;color:#f5a623">&#9733;&#9733;&#9733;&#9733;&#9733;</div><span data-i18n="gbp_rev1">' + DICT.gbp_rev1.it + '</span></div>' +
      '<div class="gbp-rev"><div style="font-size:15px;color:#f5a623">&#9733;&#9733;&#9733;&#9733;&#9733;</div><span data-i18n="gbp_rev2">' + DICT.gbp_rev2.it + '</span></div>' +
      '</div></div></div>' +
      '</div></section>'
    );
  }

  /* ---------- 22. COPYWRITING (funzione) ---------- */
  function copywritingHTML() {
    return (
      '<section class="section" id="copy"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.copywriting.badge + '</span></div>' +
      sectionHead('Copywriting', 'Testi che vendono', 'Stesse informazioni, due modi di raccontarle: la differenza si sente.', true) +
      '<div class="cw-grid">' +
      '<div class="cw-card reveal"><h3><span class="cw-plain-tag">Testo semplice</span></h3>' +
      '<p class="cw-plain">Siamo una pizzeria. Facciamo pizze buone. Siamo aperti tutti i giorni. Vi aspettiamo. Venite a trovarci presto. Il nostro numero è questo qui sotto. Ciao.</p></div>' +
      '<div class="cw-card reveal reveal-d1"><h3><span class="cw-pro-tag">&#9999; Testo professionale</span></h3>' +
      '<p class="cw-pro">Dal 1978 impastiamo ogni giorno con <b>farine macinate a pietra</b> e lievitazioni lente fino a <b>72 ore</b>. Il risultato? Una pizza <span class="hl">leggera, digeribile e dal cornicione alveolato</span>, cotta nel nostro forno a legna. Vi aspettiamo dal martedì alla domenica, dalle 19:00: prenotate il vostro tavolo in un click.' +
      '<span class="tip-box"><b>Perché funziona?</b><br>Parole concrete, benefici per il cliente e una call-to-action chiara: così i testi comunicano valore, non solo informazioni.</span></p></div>' +
      '</div></div></section>'
    );
  }

  /* ---------- 23. REVISIONE SITO (funzione) ---------- */
  function reviewHTML() {
    return (
      '<section class="section alt" id="revisione"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">&#9733; ' + D.FEATURES.review.badge + '</span></div>' +
      sectionHead('Prima / Dopo', 'Il rinnovamento del tuo sito', 'Trascina il cursore per confrontare la versione attuale con quella rinnovata.', true) +
      baSlider(
        '<div class="mock mock-old"><div class="m-bar"></div><div class="m-hero"></div><div class="m-row"></div><div class="m-row"></div><div class="m-row"></div></div>',
        '<div class="mock mock-new"><div class="m-top"><span class="m-logo"></span><span class="m-line"></span><span class="m-line"></span></div>' +
        '<div class="m-hero2"><span class="m-title">FORNO NERO</span></div>' +
        '<div class="m-cards"><div class="m-card"></div><div class="m-card"></div><div class="m-card"></div></div></div>',
        'Sito attuale', 'Sito rinnovato'
      ) +
      '<p class="ba-note"><b>Risultato:</b> stessi contenuti, ma struttura moderna, immagini curate e navigazione pensata per il mobile.</p>' +
      '</div></section>'
    );
  }

  /* ---------- 24. CONTATTI (base o avanzato) ---------- */
  function contactHTML() {
    var advanced = AppState.features.advancedContact;
    var form;
    if (advanced) {
      form = (
        '<div class="form-card">' +
        '<div class="fx-tag-bar" style="margin-bottom:18px"><span class="fx-tag">&#9733; ' + D.FEATURES.advancedContact.badge + '</span></div>' +
        '<form id="contactForm" novalidate>' +
        '<div class="field"><label for="cf-name" data-i18n="c_name">' + DICT.c_name.it + '</label>' +
        '<input id="cf-name" type="text" required minlength="2" data-i18n-ph="c_name"><span class="err">Servono almeno 2 caratteri</span></div>' +
        '<div class="field"><label for="cf-email" data-i18n="c_email">' + DICT.c_email.it + '</label>' +
        '<input id="cf-email" type="email" required data-i18n-ph="c_email"><span class="err">Inserisci un\'email valida</span></div>' +
        '<div class="field"><label for="cf-msg" data-i18n="c_msg">' + DICT.c_msg.it + '</label>' +
        '<textarea id="cf-msg" rows="4" required minlength="10" data-i18n-ph="c_msg"></textarea><span class="err">Almeno 10 caratteri</span></div>' +
        '<button class="btn" type="submit" style="width:100%" data-i18n="c_send">' + DICT.c_send.it + '</button>' +
        '<div class="form-ok" id="contactOk"><div class="ok-ico">&#9989;</div><h3 data-i18n="c_ok_title">' + DICT.c_ok_title.it + '</h3>' +
        '<p data-i18n="c_ok_msg">' + DICT.c_ok_msg.it + '</p></div>' +
        '</form></div>'
      );
    } else {
      form = (
        '<div class="form-card"><h3 style="margin-bottom:16px">Scrivici</h3>' +
        '<div class="field"><label for="cf-name">Nome</label><input id="cf-name" type="text" placeholder="Il tuo nome"></div>' +
        '<div class="field"><label for="cf-email">Email</label><input id="cf-email" type="email" placeholder="nome@email.it"></div>' +
        '<div class="field"><label for="cf-msg">Messaggio</label><textarea id="cf-msg" rows="4" placeholder="Il tuo messaggio..."></textarea></div>' +
        '<button class="btn" type="button" style="width:100%">Invia messaggio</button></div>'
      );
    }
    return (
      '<section class="section" id="contatti"><div class="container">' +
      '<div class="contact-grid">' +
      '<div class="contact-info reveal"><span class="kicker" data-i18n="contact_kicker">' + DICT.contact_kicker.it + '</span>' +
      '<h2 data-i18n="contact_title">' + DICT.contact_title.it + '</h2>' +
      '<p class="sec-sub" data-i18n="contact_sub">' + DICT.contact_sub.it + '</p>' +
      '<ul class="c-list">' +
      '<li><span class="c-ico">&#128205;</span><div><b>Indirizzo</b><span>Via dei Fornai 12, 00100 Roma</span></div></li>' +
      '<li><span class="c-ico">&#128222;</span><div><b>Telefono</b><span>+39 06 1234 5678</span></div></li>' +
      '<li><span class="c-ico">&#9993;</span><div><b>Email</b><span>ciao@fornonero.it</span></div></li>' +
      '</ul>' +
      '<div class="hours"><div><span>Lun</span><b>Chiuso</b></div><div><span>Mar&ndash;Gio</span><b>19&ndash;23</b></div>' +
      '<div><span>Ven&ndash;Sab</span><b>19&ndash;23:30</b></div><div><span>Dom</span><b>19&ndash;23</b></div></div>' +
      '</div>' +
      '<div class="reveal reveal-d1">' + form + '</div>' +
      '</div></div></section>'
    );
  }

  /* ---------- 25. TRUST BAR (sempre visibile, in tutte le strutture) ---------- */
  function mapSVG() {
    return (
      '<svg viewBox="0 0 120 76" aria-hidden="true">' +
      '<rect width="120" height="76" rx="12" fill="color-mix(in srgb,var(--bg) 8%,transparent)"/>' +
      '<path d="M0 20H120M0 40H120M0 60H120M28 0V76M58 0V76M88 0V76" stroke="color-mix(in srgb,var(--bg) 24%,transparent)" stroke-width="2"/>' +
      '<path d="M60 16c-15 0-26 10-26 23 0 17 24 38 26 40 2-2 26-23 26-40 0-13-11-23-26-23z" fill="color-mix(in srgb,var(--accent) 28%,transparent)" stroke="var(--accent)" stroke-width="2.5"/>' +
      '<circle cx="60" cy="39" r="5.5" fill="var(--accent)"/>' +
      '</svg>'
    );
  }

  function trustBarHTML() {
    return (
      '<div class="trust-bar"><div class="container trust-row">' +
      '<div class="trust-item"><span class="stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>' +
      '<span><b>4,7</b> &middot; 312 recensioni</span></div>' +
      '<span class="trust-div" aria-hidden="true"></span>' +
      '<div class="trust-item"><b>Dal 1978</b><span>tre generazioni</span></div>' +
      '<span class="trust-div" aria-hidden="true"></span>' +
      '<div class="trust-item trust-badges"><span class="badge">&#129505; Farine bio</span>' +
      '<span class="badge">&#128293; Forno a legna</span></div>' +
      '</div></div>'
    );
  }

  /* ---------- 26. FOOTER ---------- */
  function footerHTML() {
    return (
      '<footer class="footer"><div class="container">' +
      '<div class="foot-grid">' +
      '<div class="foot-brand"><div><b><span class="mark">FN</span>Forno Nero</b>' +
      '<p data-i18n="footer_text">' + DICT.footer_text.it + '</p>' + mapSVG() + '</div></div>' +
      '<div><h4>Esplora</h4><ul>' +
      '<li><a href="#chi-siamo" data-i18n="nav_about">' + DICT.nav_about.it + '</a></li>' +
      '<li><a href="#menu" data-i18n="nav_menu">' + DICT.nav_menu.it + '</a></li>' +
      (AppState.features.extraPage ? '<li><a href="#eventi" data-i18n="nav_events">' + DICT.nav_events.it + '</a></li>' : '') +
      '<li><a href="#contatti" data-i18n="nav_contact">' + DICT.nav_contact.it + '</a></li></ul></div>' +
      '<div><h4>Orari</h4><ul><li>Lun &middot; chiuso</li><li>Mar&ndash;Gio &middot; 19&ndash;23</li>' +
      '<li>Ven&ndash;Sab &middot; 19&ndash;23:30</li><li>Dom &middot; 19&ndash;23</li></ul></div>' +
      '<div><h4>Contatti</h4><ul><li>Via dei Fornai 12, Roma</li><li>+39 06 1234 5678</li>' +
      '<li>ciao@fornonero.it</li></ul>' +
      '<div class="foot-social">' +
      '<a href="#" aria-label="Instagram">&#128247;</a>' +
      '<a href="#" aria-label="Facebook">&#128101;</a>' +
      '<a href="#" aria-label="TikTok">&#127916;</a></div></div>' +
      '</div>' +
      '<div class="foot-bottom"><span data-i18n="footer_tag">' + DICT.footer_tag.it + '</span>' +
      '<span>Demo interattiva &middot; contenuti fittizi &middot; senza prezzi</span></div>' +
      '</div></footer>'
    );
  }

  /* ---------- 27. SCRIPT INTERNO DELL'ANTEPRIMA ---------- */
  function previewScript() {
    var DISH_IMGS = DISHES.map(function (d) { return phw(800, 450, d.emoji); });
    return (
      '<script>(function(){' +
      'var root=document.documentElement;' +
      'var feats=(root.getAttribute("data-features")||"").split(" ").filter(Boolean);' +
      'function has(f){return feats.indexOf(f)>-1;}' +
      'var DICT=' + JSON.stringify(DICT) + ';var lang="' + (AppState.lang || 'it') + '";' +
      'function mark(field,bad){field.classList.toggle("invalid",bad);return bad;}' +

      /* --- multilingua --- */
      'function applyLang(l){lang=l;root.setAttribute("lang",l);' +
      'var els=document.querySelectorAll("[data-i18n]");for(var i=0;i<els.length;i++){var k=els[i].getAttribute("data-i18n");if(DICT[k]&&DICT[k][l]){els[i].innerHTML=DICT[k][l];}}' +
      'var phs=document.querySelectorAll("[data-i18n-ph]");for(var j=0;j<phs.length;j++){var k2=phs[j].getAttribute("data-i18n-ph");if(DICT[k2]&&DICT[k2][l]){phs[j].setAttribute("placeholder",DICT[k2][l]);}}' +
      'var btns=document.querySelectorAll(".lang-btn");for(var b=0;b<btns.length;b++){btns[b].classList.toggle("is-active",btns[b].getAttribute("data-lang")===l);}}' +
      'var lbtns=document.querySelectorAll(".lang-btn");for(var lbi=0;lbi<lbtns.length;lbi++){(function(btn){btn.addEventListener("click",function(){var nl=btn.getAttribute("data-lang");applyLang(nl);if(window.parent&&window.parent.postMessage){try{window.parent.postMessage({type:"fn-lang",lang:nl},"*");}catch(e){}}});})(lbtns[lbi]);}' +
      'applyLang(lang);' +

      /* --- menu mobile --- */
      'var nt=document.querySelector(".nav-toggle");' +
      'if(nt){nt.addEventListener("click",function(e){e.preventDefault();document.body.classList.toggle("nav-open");});}' +
      'document.addEventListener("click",function(e){if(e.target.closest&&e.target.closest(".nav-links a")){document.body.classList.remove("nav-open");}});' +

      /* --- menu digitale: filtri + dettaglio --- */
      'var dishes=' + JSON.stringify(DISHES) + ';' +
      'var dishImgs=' + JSON.stringify(DISH_IMGS) + ';' +
      'var chips=document.querySelectorAll(".dm-chip");for(var ci=0;ci<chips.length;ci++){(function(c){c.addEventListener("click",function(){' +
      'var f=c.getAttribute("data-filter");for(var x=0;x<chips.length;x++){chips[x].classList.toggle("is-active",chips[x]===c);}' +
      'var grid=document.querySelector(".dm-grid");if(!grid)return;var cards=grid.querySelectorAll(".dish");' +
      'for(var d=0;d<cards.length;d++){var show=(f==="Tutti"||cards[d].getAttribute("data-cat")===f);' +
      'cards[d].style.display=show?"":"none";' +
      'if(show){cards[d].style.animation="none";void cards[d].offsetWidth;cards[d].style.animation="pop .4s var(--ease)";}' +
      '}});})(chips[ci]);}' +
      'function openDish(idx){var d=dishes[idx];if(!d)return;var m=document.getElementById("dishModal");' +
      'var tags="";for(var t=0;t<d.tags.length;t++){tags+="<span>"+d.tags[t]+"</span>";}' +
      'm.innerHTML="<button class=\\"modal-close\\">\\u2715</button>"+"<img src=\\""+dishImgs[idx]+"\\" alt=\\"\\">"+"<div class=\\"modal-body\\"><h3 class=\\"modal-title\\">"+d.name+"</h3><p class=\\"modal-desc\\">"+d.desc+"</p><div class=\\"dish-tags\\">"+tags+"</div></div>";' +
      'm.className="modal open";}' +
      'var dishEls=document.querySelectorAll(".dish[data-idx]");for(var di=0;di<dishEls.length;di++){(function(el){el.addEventListener("click",function(){openDish(+el.getAttribute("data-idx"));});})(dishEls[di]);}' +
      'document.addEventListener("click",function(e){if(e.target.classList&&(e.target.classList.contains("modal-close")||e.target.classList.contains("modal"))){var mm=document.querySelector(".modal");if(mm){mm.classList.remove("open");}}});' +
      'document.addEventListener("keydown",function(e){if(e.key==="Escape"){var mm2=document.querySelector(".modal");if(mm2){mm2.classList.remove("open");}}});' +

      /* --- galleria lightbox --- */
      'var gal=' + JSON.stringify(GALLERY.map(function (e) { return phw(500, 500, e); })) + ';var gi=0;' +
      'var lb=document.getElementById("lb");if(lb){' +
      'function show(i){gi=(i+gal.length)%gal.length;var img=document.getElementById("lbImg");img.src=gal[gi];document.getElementById("lbCount").textContent=(gi+1)+" / "+gal.length;}' +
      'var gitems=document.querySelectorAll(".gal-item");for(var g0=0;g0<gitems.length;g0++){(function(el){el.addEventListener("click",function(){show(+el.getAttribute("data-i"));lb.classList.add("open");});})(gitems[g0]);}' +
      'document.querySelector(".lb-prev").addEventListener("click",function(e){e.stopPropagation();show(gi-1);});' +
      'document.querySelector(".lb-next").addEventListener("click",function(e){e.stopPropagation();show(gi+1);});' +
      'lb.querySelector(".lb-close").addEventListener("click",function(){lb.classList.remove("open");});' +
      'lb.addEventListener("click",function(e){if(e.target===lb){lb.classList.remove("open");}});' +
      'document.addEventListener("keydown",function(e){if(!lb.classList.contains("open"))return;if(e.key==="ArrowLeft")show(gi-1);if(e.key==="ArrowRight")show(gi+1);if(e.key==="Escape")lb.classList.remove("open");});}' +

      /* --- before/after slider --- */
      'var bas=document.querySelectorAll(".ba");for(var ba0=0;ba0<bas.length;ba0++){(function(el){' +
      'var input=el.querySelector("input[type=range]");if(!input)return;' +
      'function upd(){el.style.setProperty("--p",input.value+"%");}' +
      'input.addEventListener("input",upd);input.addEventListener("change",upd);upd();' +
      '})(bas[ba0]);}' +

      /* --- prenotazione --- */
      'var bf=document.getElementById("bookForm");if(bf&&has("booking")){' +
      'function minDate(){var d=new Date();d.setDate(d.getDate()+1);return d.toISOString().slice(0,10);}' +
      'var dateIn=document.getElementById("bk-date");if(dateIn)dateIn.min=minDate();' +
      'bf.addEventListener("submit",function(e){e.preventDefault();var ok=true;' +
      'var name=document.getElementById("bk-name");var phone=document.getElementById("bk-phone");var date=document.getElementById("bk-date");var time=document.getElementById("bk-time");var people=document.getElementById("bk-people");' +
      'if(mark(name.parentElement,name.value.trim().length<2)){ok=false;}' +
      'if(mark(phone.parentElement,!/^[0-9+ ]{6,}$/.test(phone.value.trim()))){ok=false;}' +
      'if(mark(date.parentElement,!date.value||date.value<minDate())){ok=false;}' +
      'if(mark(time.parentElement,!time.value)){ok=false;}' +
      'if(mark(people.parentElement,!people.value)){ok=false;}' +
      'if(ok){var n=name.value.trim();bf.style.display="none";var bok=document.getElementById("bookOk");bok.style.display="block";' +
      'var p=bok.querySelector("p");p.textContent=(lang==="it"?"Grazie "+n+", la tua prenotazione": "Thank you "+n+", your booking")+" "+time.value+" "+date.value+" ("+people.value+")";}' +
      '});' +
      'var binputs=bf.querySelectorAll("input,select");for(var bi=0;bi<binputs.length;bi++){(function(inp){inp.addEventListener("input",function(){inp.parentElement.classList.remove("invalid");});})(binputs[bi]);}}' +

      /* --- contatti avanzato --- */
      'var cf=document.getElementById("contactForm");if(cf&&has("advancedContact")){' +
      'function valEmail(v){return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v);}' +
      'cf.addEventListener("submit",function(e){e.preventDefault();var ok=true;' +
      'var n=document.getElementById("cf-name");var em=document.getElementById("cf-email");var ms=document.getElementById("cf-msg");' +
      'if(mark(n.parentElement,n.value.trim().length<2)){ok=false;}' +
      'if(mark(em.parentElement,!valEmail(em.value.trim()))){ok=false;}' +
      'if(mark(ms.parentElement,ms.value.trim().length<10)){ok=false;}' +
      'if(ok){cf.style.display="none";var cok=document.getElementById("contactOk");cok.style.display="block";}});' +
      'var cinputs=cf.querySelectorAll("input,textarea");for(var ci2=0;ci2<cinputs.length;ci2++){(function(inp){inp.addEventListener("input",function(){inp.parentElement.classList.remove("invalid");});})(cinputs[ci2]);}}' +

      /* --- animazioni: parallax + particelle canvas --- */
      'if(has("animations")){' +
      'var pb=document.querySelectorAll("[data-parallax]");' +
      'function onScroll(){var y=window.pageYOffset||document.documentElement.scrollTop;' +
      'for(var i=0;i<pb.length;i++){var r=pb[i].getBoundingClientRect();' +
      'var off=(window.innerHeight/2-r.top-r.height/2)*0.18;pb[i].style.transform="translateY("+Math.max(-60,Math.min(60,off))+"px)";}}' +
      'window.addEventListener("scroll",onScroll,{passive:true});onScroll();' +
      'var cv=document.createElement("canvas");cv.className="fx-canvas";document.body.insertBefore(cv,document.body.firstChild);' +
      'cv.width=innerWidth;cv.height=innerHeight;var ctx=cv.getContext("2d");' +
      'var accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#e63946";' +
      'var ps=[];for(var p0=0;p0<34;p0++){ps.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*3+1,s:Math.random()*0.6+0.15,a:Math.random()*0.5+0.1});}' +
      'function frame(){ctx.clearRect(0,0,cv.width,cv.height);' +
      'for(var i=0;i<ps.length;i++){var p=ps[i];p.y-=p.s;if(p.y<-10){p.y=cv.height+10;p.x=Math.random()*cv.width;}' +
      'ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=accent;ctx.globalAlpha=p.a;ctx.fill();}' +
      'ctx.globalAlpha=1;requestAnimationFrame(frame);}' +
      'window.addEventListener("resize",function(){cv.width=innerWidth;cv.height=innerHeight;});requestAnimationFrame(frame);' +

      /* --- reveal on scroll --- */
      'var ios=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){if(es[i].isIntersecting){es[i].target.classList.add("in");ios.unobserve(es[i].target);}}},{threshold:0.12});' +
      'var rv=document.querySelectorAll(".reveal");for(var r0=0;r0<rv.length;r0++){ios.observe(rv[r0]);}' +
      '}' +
      '})();</' + 'script>'
    );
  }

  /* ---------- 27. COSTRUZIONE DOCUMENTO COMPLETO ---------- */
  function buildDoc() {
    var feats = AppUtils.activeFeatures(AppState);
    var layoutCls = 'layout-' + AppState.layout;
    var featureClass = AppState.features.animations ? ' fx-anim' : '';
    var section = '';

    section += aboutHTML();
    section += AppState.features.digitalMenu ? digitalMenuHTML() : baseMenuHTML();
    if (AppState.features.extraPage) section += eventsHTML();
    if (AppState.features.blog) section += blogHTML();
    if (AppState.features.qrCode) section += qrHTML();
    if (AppState.features.booking) section += bookingHTML();
    if (AppState.features.gallery) section += galleryHTML();
    if (AppState.features.socialFeed) section += socialHTML();
    if (AppState.features.proPhoto) section += proPhotoHTML();
    if (AppState.features.photoEdit) section += photoEditHTML();
    if (AppState.features.logo) section += logoHTML();
    if (AppState.features.googleBusiness) section += googleBusinessHTML();
    if (AppState.features.copywriting) section += copywritingHTML();
    if (AppState.features.review) section += reviewHTML();
    section += contactHTML();

    var head = (
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Forno Nero &mdash; Pizzeria &amp; Cucina Napoletana</title>' +
      '<style>' + window.PREVIEW_CSS + '</style>' +
      (AppState.features.seo ? seoJSONLD() : '')
    );

    var body = (
      '<body class="' + layoutCls + featureClass + '">' +
      headerHTML() +
      '<main>' + heroHTML() + trustBarHTML() + section + '</main>' +
      footerHTML() +
      (AppState.features.seo ? seoChip() : '') +
      '<div class="modal" id="dishModal"></div>' +
      previewScript() +
      '</body>'
    );

    return (
      '<!doctype html><html lang="' + (AppState.lang || 'it') + '" data-palette="' + AppState.palette + '" data-features="' + feats.join(' ') + '">' +
      '<head>' + head + '</head>' + body + '</html>'
    );
  }

  window.Render = {
    buildDoc: buildDoc,
    phw: phw,
    ph: ph,
    DISHES: DISHES,
    GALLERY: GALLERY
  };
})();
