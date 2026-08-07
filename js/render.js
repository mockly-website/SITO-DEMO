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
    minimal:      { a: '#C9A227', b: '#8f7220' },
    solare:       { a: '#E8A020', b: '#B97E16' },
    oceano:       { a: '#0E7C7B', b: '#07504F' },
    rosa:         { a: '#C2455D', b: '#8F2E42' },
    grafite:      { a: '#3D6DE0', b: '#1E3A8A' }
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

  /* ---------- 1b. CATALOGO FOTO REALI (Unsplash, URL fissi) ----------
     URL verificati manualmente e coerenti con il soggetto. Ogni <img>
     reale ha onerror → __ph() (helper definito nello script dell'anteprima)
     che ricrea il placeholder SVG con i colori della palette corrente. */
  var STOCK_BASE = 'https://images.unsplash.com/';
  var STOCK_PHOTOS = {
    heroPizza:    'photo-1513104890138-7c749659a591',
    pizza2:       'photo-1593560708920-61dd98c46a4e',
    pizza3:       'photo-1565299624946-b28f40a0ae38',
    pizza4:       'photo-1574071318508-1cdbab80d002',
    interiorWarm: 'photo-1555396273-367ea4eb4db5',
    interiorCafe: 'photo-1445116572660-236099ec97a0',
    restaurant:   'photo-1466978913421-dad2ebd01d17',
    hospitality:  'photo-1556910103-1c02745aae4d',
    cafeteria:    'photo-1567521464027-f127ff144326',
    pasta:        'photo-1621996346565-e3dbc646d9a9',
    tiramisu:     'photo-1571877227200-a0d98ea607e9',
    cake:         'photo-1551024506-0bccd828d307',
    chocolate:    'photo-1497034825429-c343d7c6a68f',
    gelato:       'photo-1563805042-7684c019e1cb',
    wine:         'photo-1510812431401-41d2bd2722f3',
    cocktail:     'photo-1551024709-8f23befc6f87',
    fries:        'photo-1541592106381-b31e9677c0e5',
    kitchen:      'photo-1563379926898-05f4575a45d8',
    bread:        'photo-1509440159596-0249088772ff',
    bowl:         'photo-1512621776951-a57141f2eefd',
    soup:         'photo-1547592166-23ac45744acd',
    gourmet:      'photo-1504674900247-0877df9cc836',
    dj:           'photo-1514525253161-7a46d19cd819',
    generic:      'photo-1541167760496-1628856ab772',
    ava1:         'photo-1494790108377-be9c29b29330',
    ava2:         'photo-1507003211169-0a1dd7228f2d',
    ava3:         'photo-1438761681033-6461ffad8d80',
    ava4:         'photo-1544005313-94ddf0286df2',
    ava5:         'photo-1500648767791-00dcc994a43e',
    ava6:         'photo-1583394293214-28ded15ee548'
  };

  function imgUrl(key, w, h) {
    var id = STOCK_PHOTOS[key] || STOCK_PHOTOS.generic;
    return STOCK_BASE + id + '?auto=format&fit=crop&w=' + w + '&h=' + h + '&q=80';
  }

  function imgTag(key, w, h, alt, cls, emoji) {
    var e = emoji || '&#128523;';
    return '<img class="img-pal' + (cls ? ' ' + cls : '') + '" src="' +
      imgUrl(key, w, h).replace(/&/g, '&amp;') + '" alt="' + esc(alt || '') +
      '" loading="lazy" decoding="async"' +
      ' onerror="this.onerror=null;this.src=__ph(' + w + ',' + h + ',\'' + e + '\')">';
  }

  /* ---------- 1c. CONTENUTI PERSONALIZZABILI (dal pannello) ---------- */
  function site() { return AppState.site || {}; }

  /* Monogramma del brand: iniziali delle prime due parole del nome */
  function siteMark() {
    var n = String(site().name || 'Forno Nero').trim().split(/\s+/);
    var m = (n[0] ? n[0].charAt(0) : '') + (n[1] ? n[1].charAt(0) : (n[0] ? n[0].charAt(1) : ''));
    return m.toUpperCase() || 'FN';
  }

  function waLink() {
    return 'https://wa.me/' + String(site().whatsapp || '').replace(/[^\d]/g, '');
  }

  function siteName() { return esc(site().name || 'Forno Nero'); }
  function siteTagline() { return esc(site().tagline || ''); }

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
    return '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' Funzione extra &middot; ' + (f ? f.badge : id) + '</span></div>';
  }

  /* ---------- 4. Contenuti demo ---------- */
  var DISHES = [
    { photo: 'bowl',      cat: 'Antipasti', name: 'Burrata & pomodorini',   emoji: '&#129472;', desc: 'Burrata pugliese, pomodorini confit, basilico fresco e olio EVO.', tags: ['Vegetariano'] },
    { photo: 'fries',     cat: 'Antipasti', name: 'Crocchè di patate',      emoji: '&#129364;', desc: 'Crocchè croccanti fuori, morbidi dentro, serviti con salsa verde.', tags: ['Vegano'] },
    { photo: 'kitchen',   cat: 'Antipasti', name: 'Frittatina napoletana',  emoji: '&#127859;', desc: 'La classica frittatina con pasta, piselli e besciamella.', tags: ['Popolare'] },
    { photo: 'pasta',     cat: 'Primi',     name: 'Paccheri al ragù di mare', emoji: '&#127837;', desc: 'Pasta fresca, gamberi rossi, pomodorini e bottarga di muggine.', tags: ['Pesce'] },
    { photo: 'soup',      cat: 'Primi',     name: 'Vellutata di zucca',     emoji: '&#127817;', desc: 'Zucca lunga, latte di cocco, mandorle tostate e olio al peperoncino.', tags: ['Vegetariano', 'Senza glutine'] },
    { photo: 'gourmet',   cat: 'Primi',     name: 'Gnocchi alla sorrentina', emoji: '&#129472;', desc: 'Gnocchi di patate, pomodoro San Marzano e fior di latte.', tags: ['Vegetariano'] },
    { photo: 'heroPizza', cat: 'Pizze',     name: 'Margherita DOC',         emoji: '&#127829;', desc: 'Pomodoro San Marzano, fior di latte, basilico e olio EVO.', tags: ['Vegetariano', 'Popolare'] },
    { photo: 'pizza3',    cat: 'Pizze',     name: 'Forno Nero',             emoji: '&#127829;', desc: 'Impasto al carbone vegetale, bufala, nduja e miele piccante.', tags: ['Piccante'] },
    { photo: 'pizza2',    cat: 'Pizze',     name: 'Diavola',                emoji: '&#127829;', desc: 'Salame piccante, pomodoro, fior di latte e olive nere.', tags: ['Piccante'] },
    { photo: 'tiramisu',  cat: 'Dolci',     name: 'Tiramisù della casa',    emoji: '&#127854;', desc: 'Mascarpone, savoiardi al caffè e cacao amaro.', tags: ['Popolare'] },
    { photo: 'cake',      cat: 'Dolci',     name: 'Babà al rum',            emoji: '&#127853;', desc: 'Babà artigianale bagnato al rum, servito con crema chantilly.', tags: ['Classico'] },
    { photo: 'gelato',    cat: 'Dolci',     name: 'Sorbetto al limone',     emoji: '&#127819;', desc: 'Sorbetto fresco al limone di Sorrento con menta.', tags: ['Vegano', 'Senza glutine'] }
  ];

  var BLOG_POSTS = [
    { photo: 'pizza4', avatar: 'ava4', author: 'Giulia Ferraro', emoji: '&#127829;', date: '2 giorni fa', read: '4 min', title: 'La nuova carta delle pizze di stagione', excerpt: 'Tre nuove ricette ispirate all\'orto di novembre: scoprile in anteprima.' },
    { photo: 'bread', avatar: 'ava5', author: 'Vincenzo Gallo', emoji: '&#129506;', date: '1 settimana fa', read: '6 min', title: 'Dietro le quinte: il nostro impasto a 72 ore', excerpt: 'Farine, acqua e tempo. Ti raccontiamo come nasce la nostra pizza.' },
    { photo: 'hospitality', avatar: 'ava6', author: 'Marta Conti', emoji: '&#127854;', date: '2 settimane fa', read: '3 min', title: 'Intervista al fornaio: tre segreti del forno a legna', excerpt: 'Abbiamo chiesto a Vincenzo cosa rende speciale la sua giornata in forno.' }
  ];

  var TESTIMONIALS = [
    { name: 'Sara Bianchi', role: 'Cliente affezionata', avatar: 'ava1', quote: 'La pizza più leggera che abbia mai mangiato: croccante fuori, morbidissima dentro. Il personale è davvero gentile.' },
    { name: 'Marco De Santis', role: 'Cena in famiglia', avatar: 'ava2', quote: 'L\'impasto è un altro mondo rispetto ai soliti. Il nostro posto del cuore per il sabato sera, da anni.' },
    { name: 'Elena Rossi', role: 'Recensione Google', avatar: 'ava3', quote: 'Locale semplice e accogliente, il profumo del forno a legna si sente dall\'ingresso. I paccheri al ragù di mare sono pazzeschi.' }
  ];

  var EVENTS = [
    { photo: 'wine', emoji: '&#127863;', date: 'Ven 12', name: 'Degustazione vini naturali', desc: 'Cinque etichette piccole e artigianali abbinate a tre assaggi del nostro menù.' },
    { photo: 'dj', emoji: '&#127928;', date: 'Sab 20', name: 'Serata jazz dal vivo', desc: 'Un trio acustico accompagna la cena: consigliata la prenotazione.' },
    { photo: 'pizza4', emoji: '&#127858;', date: 'Dom 28', name: 'Laboratorio pizza per bambini', desc: 'Impastare, stendere e infornare: un pomeriggio per i piccoli pizzaioli.' }
  ];

  var POSTS = [
    { photo: 'pizza3',     emoji: '&#127829;', title: 'Pizza e amici', likes: '234' },
    { photo: 'wine',       emoji: '&#127860;', title: 'Vino & pane', likes: '187' },
    { photo: 'cocktail',   emoji: '&#127861;', title: 'Aperitivo', likes: '310' },
    { photo: 'kitchen',    emoji: '&#127859;', title: 'La cucina', likes: '142' },
    { photo: 'cake',       emoji: '&#127853;', title: 'Dolci fatti in casa', likes: '268' },
    { photo: 'cafeteria',  emoji: '&#127748;', title: 'La terrazza', likes: '351' }
  ];

  /* ---------- 5. Dizionario multilingua (IT / EN) ---------- */
  var DICT = {
    nav_home: { it: 'Home', en: 'Home' },
    nav_about: { it: 'Chi Siamo', en: 'About' },
    nav_menu: { it: 'Menu', en: 'Menu' },
    nav_events: { it: 'Eventi', en: 'Events' },
    nav_blog: { it: 'Blog', en: 'Blog' },
    nav_contact: { it: 'Contatti', en: 'Contact' },
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
    footer_text: { it: 'Il gusto semplice di un vero forno a legna: pizza, cucina di stagione e tanta ospitalità.', en: 'The simple taste of a real wood-fired oven: pizza, seasonal cooking and warm hospitality.' },
    testimonials_kicker: { it: 'Dicono di noi', en: 'What they say' },
    testimonials_title: { it: 'Le recensioni dei nostri ospiti', en: 'Reviews from our guests' },
    testimonials_sub: { it: 'Tre storie, tanti motivi per tornarci.', en: 'Three stories, plenty of reasons to come back.' },
    float_book: { it: 'Prenota', en: 'Book' },
    wa_tip: { it: 'Scrivici su WhatsApp', en: 'Chat with us on WhatsApp' },
    map_kicker: { it: 'Dove siamo', en: 'Where we are' },
    map_title: { it: 'Il locale è qui', en: 'The place is here' },
    map_sub: { it: 'Mappa interattiva con zoom e link alle indicazioni stradali.', en: 'Interactive map with zoom and a link to street directions.' },
    map_open: { it: 'Apri in Google Maps', en: 'Open in Google Maps' }
  };

  /* ---------- 6. ICONE SVG inline (stroke-based, ereditano currentColor) ---------- */
  function icon(name, cls) {
    var I = {
      menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
      down: '<polyline points="6 9 12 15 18 9"/>',
      left: '<polyline points="15 18 9 12 15 6"/>',
      right: '<polyline points="9 18 15 12 9 6"/>',
      close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
      pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
      phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
      mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" fill="currentColor" stroke="none"/>',
      ig: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
      fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
      pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
      music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
      nav: '<path d="M3 11l19-9-9 19-2-8-8-2z"/>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
      minus: '<line x1="5" y1="12" x2="19" y2="12"/>'
    };
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[name] || '') + '</svg>';
  }

  /* Icona WhatsApp: percorso pieno, il logo non è tracciabile a tratti */
  function waIcon() {
    return (
      '<svg class="ico ico-wa" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z"/>' +
      '</svg>'
    );
  }

  function starsHTML(cls) {
    var s = '';
    for (var si = 0; si < 5; si++) s += icon('star');
    return '<span class="stars' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + s + '</span>';
  }

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
    var brand = '<a class="nav-brand" href="#top"><span class="mark">' + siteMark() + '</span><span>' + siteName() + '</span></a>';
    var h = '<header class="site-header"><div class="container nav">' + brand +
      navLinks() +
      '<div style="display:flex;align-items:center;gap:12px">' + langSwitch() +
      '<button class="nav-toggle" aria-label="Menu">' + icon('menu') + '</button></div>' +
      '</div></header>';
    return h;
  }

  /* ---------- 8. HERO (3 varianti) ---------- */
  function heroHTML() {
    var layout = AppState.layout;
    if (layout === 'essential') {
      return (
        '<section class="hero" id="top"><div class="hero-orb"></div>' +
        '<div class="hero-pic" aria-hidden="true">' + imgTag('heroPizza', 900, 900, '', '', '&#127829;') + '</div>' +
        '<div class="container">' +
        '<p class="hero-kicker">' + siteTagline() + '</p>' +
        '<h1 class="hero-title" data-i18n="hero_title1">' + DICT.hero_title1.it + ' <span data-i18n="hero_title2">' + DICT.hero_title2.it + '</span></h1>' +
        '<p class="hero-sub" data-i18n="hero_sub">' + DICT.hero_sub.it + '</p>' +
        '<div class="hero-cta">' +
        '<a href="#menu" class="btn" data-i18n="cta_menu">' + DICT.cta_menu.it + '</a>' +
        '<a href="#contatti" class="btn btn-ghost" data-i18n="cta_book">' + DICT.cta_book.it + '</a>' +
        '</div></div>' +
        '<a class="scroll-hint" href="#chi-siamo" aria-label="Scorri per scoprire di pi\u00f9">' + icon('down') + '</a></section>'
      );
    }
    if (layout === 'classic') {
      return (
        '<section class="hero" id="top">' +
        '<div class="hero-bg" data-parallax style="--hero-img:url(&quot;' + imgUrl('interiorWarm', 1600, 1000).replace(/&/g, '&amp;') + '&quot;)"></div>' +
        '<div class="container hero-inner">' +
        '<p class="hero-kicker">' + siteTagline() + '</p>' +
        '<h1 class="hero-title" data-i18n="hero_title1">' + DICT.hero_title1.it + ' <span data-i18n="hero_title2">' + DICT.hero_title2.it + '</span></h1>' +
        '<p class="hero-sub" data-i18n="hero_sub">' + DICT.hero_sub.it + '</p>' +
        '<div class="hero-cta">' +
        '<a href="#menu" class="btn" data-i18n="cta_menu">' + DICT.cta_menu.it + '</a>' +
        '<a href="#contatti" class="btn btn-ghost" style="border-color:#fff;color:#fff" data-i18n="cta_book">' + DICT.cta_book.it + '</a>' +
        '</div>' +
        '<div class="hero-facts">' +
        '<div class="hero-fact"><b>47</b><span data-i18n="fact_years">' + DICT.fact_years.it + '</span></div>' +
        '<div class="hero-fact"><b>60</b><span data-i18n="fact_seats">' + DICT.fact_seats.it + '</span></div>' +
        '<div class="hero-fact"><b>100%</b><span data-i18n="fact_flours">' + DICT.fact_flours.it + '</span></div>' +
        '</div></div></section>'
      );
    }
    // modern
    return (
      '<section class="hero" id="top"><div class="container hero-grid">' +
      '<div class="hero-copy">' +
      '<p class="hero-kicker">' + siteTagline() + '</p>' +
      '<h1 class="hero-title">' + DICT.hero_title1.it + ' <span data-i18n="hero_title2">' + DICT.hero_title2.it + '</span></h1>' +
      '<p class="hero-sub" data-i18n="hero_sub">' + DICT.hero_sub.it + '</p>' +
      '<div class="hero-cta">' +
      '<a href="#menu" class="btn" data-i18n="cta_menu">' + DICT.cta_menu.it + '</a>' +
      '<a href="#contatti" class="btn btn-ghost" data-i18n="cta_book">' + DICT.cta_book.it + '</a>' +
      '</div>' +
      '<div class="hero-stats">' +
      '<div><b>47</b><span data-i18n="fact_years">' + DICT.fact_years.it + '</span></div>' +
      '<div><b>60</b><span data-i18n="fact_seats">' + DICT.fact_seats.it + '</span></div>' +
      '<div><b>100%</b><span data-i18n="fact_flours">' + DICT.fact_flours.it + '</span></div>' +
      '</div></div>' +
      '<div class="hero-visual reveal">' +
      '<div class="hero-img-tilt">' + imgTag('pizza2', 600, 760, 'Pizza napoletana appena sfornata', '', '&#127829;') + '</div>' +
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
      '<div><b>60</b><span data-i18n="fact_seats">' + DICT.fact_seats.it + '</span></div>' +
      '<div><b>100%</b><span data-i18n="fact_flours">' + DICT.fact_flours.it + '</span></div></div>';

    if (layout === 'modern') {
      return (
        '<section class="section" id="chi-siamo"><div class="container">' +
        '<div class="about-grid">' +
        '<div class="about-media reveal">' + imgTag('restaurant', 700, 520, 'La nostra cucina', '', '&#128588;') + '</div>' +
        '<div class="reveal reveal-d1">' +
        '<div class="about-num">01</div>' +
        '<span class="kicker" data-i18n="about_kicker">' + DICT.about_kicker.it + '</span>' +
        '<h2 class="sec-title" data-i18n="about_title">' + DICT.about_title.it + '</h2>' +
        '<p class="sec-sub" data-i18n="about_text">' + DICT.about_text.it + '</p>' + facts +
        '</div></div></div></section>'
      );
    }
    var media = '<div class="about-media reveal">' + imgTag('wine', 700, 520, 'I nostri vini', '', '&#127867;') + '</div>';
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

  /* ---------- 9b. NUMERI / STATISTICHE (sempre visibili, conteggio animato) ---------- */
  function statsHTML() {
    return (
      '<section class="section stats" id="numeri"><div class="container">' +
      '<div class="stats-grid">' +
      '<div class="stat reveal"><span class="stat-kicker">Dal</span><b class="stat-num">1978</b><span>Anno di apertura</span></div>' +
      '<div class="stat reveal reveal-d1"><b class="stat-num" data-count="12000">12.000</b><span>Pizze all\'anno</span></div>' +
      '<div class="stat reveal reveal-d2"><b class="stat-num" data-count="60">60</b><span>Coperti in sala</span></div>' +
      '<div class="stat reveal reveal-d3"><b class="stat-num" data-count="100">100</b><span>Farine bio</span></div>' +
      '</div></div></section>'
    );
  }

  /* ---------- 10. MENU (base) ---------- */
  function baseMenuHTML() {
    var layout = AppState.layout;
    /* Menù base: solo vetrina, senza filtri né interattività (quelli
       arrivano con il Menu Digitale). Sempre presente, 6 piatti. */
    var dishes = [
      { photo: 'heroPizza', emoji: '&#127829;', name: 'Margherita DOC', desc: 'Pomodoro San Marzano, fior di latte e basilico fresco.', tag: 'Vegetariana' },
      { photo: 'pizza3', emoji: '&#127829;', name: 'Forno Nero', desc: 'Impasto al carbone vegetale, bufala, nduja e miele piccante.', tag: 'Piccante' },
      { photo: 'pizza2', emoji: '&#127829;', name: 'Diavola', desc: 'Salame piccante, fior di latte e olive nere.', tag: 'Piccante' },
      { photo: 'pasta', emoji: '&#127837;', name: 'Paccheri al ragù di mare', desc: 'Pasta fresca, gamberi rossi, pomodorini e bottarga.', tag: 'Pesce' },
      { photo: 'fries', emoji: '&#129364;', name: 'Crocchè di patate', desc: 'Croccanti fuori, morbidi dentro, con salsa verde.', tag: 'Vegano' },
      { photo: 'tiramisu', emoji: '&#127854;', name: 'Tiramisù della casa', desc: 'Mascarpone, savoiardi al caffè e cacao amaro.', tag: 'Dolce' }
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
      cards += '<article class="dish-card reveal">' + imgTag(d.photo, 500, 320, d.name, '', d.emoji) +
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
        imgTag(d.photo, 400, 400, d.name, '', d.emoji) +
        '<div class="dish-body"><h3>' + d.name + '</h3><p>' + d.desc + '</p>' +
        '<div class="dish-tags">' + d.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div></div></article>';
    });
    return (
      '<section class="section alt" id="menu"><div class="container">' +
      sectionHead('dm_kicker', 'dm_title', 'dm_sub') +
      '<div class="dm-toolbar"><div class="dm-filters">' + chips + '</div>' +
      '<span class="fx-tag" style="flex:none">' + icon('star') + ' ' + D.FEATURES.digitalMenu.badge + '</span></div>' +
      '<div class="dm-grid">' + cards + '</div>' +
      '<p class="dm-hint">Tocca un piatto per vederne i dettagli</p>' +
      '</div></section>'
    );
  }

  /* ---------- 12. EVENTI (pagina extra) ---------- */
  function eventsHTML() {
    var cards = EVENTS.map(function (e, i) {
      return '<article class="event-card reveal reveal-d' + (i + 1) + (i === 0 ? ' is-live' : '') + '">' +
        imgTag(e.photo, 600, 340, e.name, '', e.emoji) +
        '<div class="event-body"><span class="event-date">' + e.date + '</span>' +
        '<h3>' + e.name + '</h3><p>' + e.desc + '</p></div></article>';
    }).join('');
    return (
      '<section class="section" id="eventi"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.extraPage.badge + '</span></div>' +
      sectionHead('events_kicker', 'events_title', 'events_sub') +
      '<div class="events-grid">' + cards + '</div></div></section>'
    );
  }

  /* ---------- 13. BLOG (funzione) ---------- */
  function blogHTML() {
    var cards = BLOG_POSTS.map(function (p, i) {
      return '<article class="post-card reveal reveal-d' + (i + 1) + '">' +
        imgTag(p.photo, 600, 380, p.title, '', p.emoji) +
        '<div class="post-body"><div class="post-meta">' + imgTag(p.avatar, 64, 64, p.author, 'post-ava', '&#128100;') +
        '<span class="post-author">' + p.author + '</span><span>&middot; ' + p.date + '</span><span>&middot; ' + p.read + '</span></div>' +
        '<h3>' + p.title + '</h3><p>' + p.excerpt + '</p></div></article>';
    }).join('');
    return (
      '<section class="section alt" id="blog"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.blog.badge + '</span></div>' +
      sectionHead('blog_kicker', 'blog_title', 'blog_sub') +
      '<div class="blog-grid">' + cards + '</div></div></section>'
    );
  }

  /* ---------- 13b. TESTIMONIANZE (sempre visibili) ---------- */
  function testimonialsHTML() {
    var cards = TESTIMONIALS.map(function (t, i) {
      return (
        '<figure class="testimonial-card reveal reveal-d' + (i + 1) + '">' +
        starsHTML() +
        '<blockquote>' + t.quote + '</blockquote>' +
        '<figcaption>' + imgTag(t.avatar, 80, 80, 'Foto di ' + t.name, 't-ava', '&#128100;') +
        '<span><b>' + t.name + '</b><em>' + t.role + '</em></span></figcaption>' +
        '</figure>'
      );
    }).join('');
    return (
      '<section class="section alt" id="testimonianze"><div class="container">' +
      sectionHead('testimonials_kicker', 'testimonials_title', 'testimonials_sub', true) +
      '<div class="testimonials-grid">' + cards + '</div></div></section>'
    );
  }

  /* ---------- 14. PRENOTAZIONE ONLINE (funzione) ---------- */
  function bookingHTML() {
    return (
      '<section class="section" id="prenota"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.booking.badge + '</span></div>' +
      '<div class="booking-wrap">' +
      '<div class="booking-info"><span class="kicker" data-i18n="booking_kicker">' + DICT.booking_kicker.it + '</span>' +
      '<h2 data-i18n="booking_title">' + DICT.booking_title.it + '</h2>' +
      '<p class="sec-sub" data-i18n="booking_sub">' + DICT.booking_sub.it + '</p>' +
      '<ul><li><span class="b-ico">' + icon('clock') + '</span><span><b>Orario</b><br>Cena dalle 19:00 alle 23:30</span></li>' +
      '<li><span class="b-ico">' + icon('users') + '</span><span><b>Gruppi</b><br>Tavoli fino a 12 persone</span></li>' +
      '<li><span class="b-ico">' + icon('gift') + '</span><span><b>Occasioni</b><br>Compleanni e cene di lavoro</span></li></ul>' +
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
  var GALLERY = [
    { photo: 'heroPizza',    emoji: '&#127829;', cap: 'La nostra margherita DOC' },
    { photo: 'pasta',        emoji: '&#127837;', cap: 'Paccheri al ragù di mare' },
    { photo: 'wine',         emoji: '&#127860;', cap: 'Calici e piccola cantina' },
    { photo: 'cocktail',     emoji: '&#127864;', cap: 'Aperitivo della casa' },
    { photo: 'tiramisu',     emoji: '&#127854;', cap: 'Tiramisù della casa' },
    { photo: 'interiorCafe', emoji: '&#127861;', cap: 'Il bancone del caffè' },
    { photo: 'bowl',         emoji: '&#129472;', cap: 'Insalate di stagione' },
    { photo: 'restaurant',   emoji: '&#127826;', cap: 'La sala in estate' }
  ];
  function galleryHTML() {
    var items = '';
    GALLERY.forEach(function (g, i) {
      items += '<div class="gal-item" data-i="' + i + '">' + imgTag(g.photo, 500, 500, g.cap, '', g.emoji) + '</div>';
    });
    return (
      '<section class="section" id="galleria"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.gallery.badge + '</span></div>' +
      sectionHead('gallery_kicker', 'gallery_title', null, true) +
      '<div class="gal-grid">' + items + '</div>' +
      '<div class="lightbox" id="lb" role="dialog">' +
      '<button class="lb-btn lb-prev" aria-label="Precedente">' + icon('left') + '</button>' +
      '<img id="lbImg" src="" alt="">' +
      '<button class="lb-btn lb-next" aria-label="Successiva">' + icon('right') + '</button>' +
      '<button class="lb-close" aria-label="Chiudi">' + icon('close') + '</button>' +
      '<span class="lb-count" id="lbCount"></span>' +
      '<span class="lb-cap" id="lbCap"></span></div>' +
      '</div></section>'
    );
  }

  /* ---------- 16. FEED SOCIAL (funzione) ---------- */
  function socialHTML() {
    var items = POSTS.map(function (p) {
      return '<div class="social-item">' + imgTag(p.photo, 300, 300, p.title, '', p.emoji) + '</div>';
    }).join('');
    return (
      '<section class="section" id="social"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.socialFeed.badge + '</span></div>' +
      sectionHead('social_kicker', 'social_title', null, true) +
      '<div class="social-grid">' + items + '</div>' +
      '<div class="social-cta"><a class="btn" href="#social" onclick="return false">' + icon('camera') + ' <span data-i18n="social_cta">' + DICT.social_cta.it + '</span></a></div>' +
      '</div></section>'
    );
  }

  /* ---------- 17. QR CODE (funzione) ---------- */
  function qrHTML() {
    return (
      '<section class="section alt" id="qr"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.qrCode.badge + '</span></div>' +
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
    return (
      '<section class="section" id="foto-pro"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.proPhoto.badge + '</span></div>' +
      sectionHead('Fotografia professionale', 'Fotografia professionale', 'Lo stesso piatto, fotografato in modo professionale: luce, composizione e colore fanno la differenza.', true) +
      baSlider(
        imgTag('heroPizza', 900, 506, 'Foto amatoriale della pizza', 'img-wm', '&#127829;'),
        imgTag('pizza2', 900, 506, 'Foto professionale della pizza', '', '&#127829;'),
        'Prima · amatoriale', 'Dopo · professionale'
      ) +
      '<p class="ba-note"><b>Risultato:</b> piatti più appetitosi e un sito che trasmette subito la qualità del locale.</p>' +
      '</div></section>'
    );
  }

  function photoEditHTML() {
    return (
      '<section class="section alt" id="editing"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.photoEdit.badge + '</span></div>' +
      sectionHead('Editing & ritocco', 'Editing foto / ritocco', 'Correzione colore, pulizia e rimozione di elementi di disturbo come i watermark.', true) +
      baSlider(
        '<div class="ba-wm" aria-hidden="true">WATERMARK</div>' + imgTag('pasta', 900, 506, 'Prima del ritocco: foto con watermark', 'img-wm', '&#127837;'),
        imgTag('pasta', 900, 506, 'Dopo il ritocco: foto pulita', '', '&#127837;'),
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
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.logo.badge + '</span></div>' +
      sectionHead('Logo & identità', 'Identità visiva', 'Due varianti dello stesso logo: una per fondi chiari, una per fondi scuri.', true) +
      '<div class="logo-grid">' +
      '<div class="logo-card light reveal"><div><div class="logo-mark">' +
      '<div class="logo-square">' + siteMark() + '</div><div class="logo-type"><b>' + siteName() + '</b><span>Pizzeria &middot; 1978</span></div></div>' +
      '<p class="logo-cap">Variante chiara</p></div></div>' +
      '<div class="logo-card dark reveal reveal-d1"><div><div class="logo-mark">' +
      '<div class="logo-square">' + siteMark() + '</div><div class="logo-type"><b>' + siteName() + '</b><span>Pizzeria &middot; 1978</span></div></div>' +
      '<p class="logo-cap" style="color:inherit;opacity:.6">Variante scura</p></div></div>' +
      '</div></div></section>'
    );
  }

  /* ---------- 20. GOOGLE BUSINESS PROFILE (funzione) ---------- */
  function googleBusinessHTML() {
    return (
      '<section class="section alt" id="gbp"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.googleBusiness.badge + '</span></div>' +
      sectionHead('Google Business Profile', 'La tua scheda su Google', 'Anteprima simulata di come appari nelle ricerche: recensioni, orari e mappa.', true) +
      '<div class="gbp-card reveal">' +
      '<div class="gbp-head"><div class="gbp-logo">' + siteMark() + '</div>' +
      '<div style="flex:1"><b>' + siteName() + ' &middot; Pizzeria</b>' +
      starsHTML('gbp-stars') +
      '<div style="font-size:12px;color:var(--muted)">4,7 &middot; 312 recensioni</div>' +
      '<div class="gbp-actions"><span>Chiama</span><span>Indicazioni</span><span>Recensisci</span></div></div></div>' +
      '<div class="gbp-body">' +
      '<div class="gbp-row"><span class="c-ico">' + icon('pin') + '</span><span><b>' + esc(site().address || '') + '</b></span></div>' +
      '<div class="gbp-row"><span class="c-ico">' + icon('clock') + '</span><span><b>Aperto</b> &middot; chiude alle 23:30 &middot; Mar&ndash;Dom</span></div>' +
      '<div class="gbp-map"><span class="gbp-pin">' + icon('pin') + '</span></div>' +
      '<div class="gbp-reviews">' +
      '<div class="gbp-rev">' + starsHTML('gbp-stars') + '<span data-i18n="gbp_rev1">' + DICT.gbp_rev1.it + '</span></div>' +
      '<div class="gbp-rev">' + starsHTML('gbp-stars') + '<span data-i18n="gbp_rev2">' + DICT.gbp_rev2.it + '</span></div>' +
      '</div></div></div>' +
      '</div></section>'
    );
  }

  /* ---------- 22. COPYWRITING (funzione) ---------- */
  function copywritingHTML() {
    return (
      '<section class="section" id="copy"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.copywriting.badge + '</span></div>' +
      sectionHead('Copywriting', 'Testi che vendono', 'Stesse informazioni, due modi di raccontarle: la differenza si sente.', true) +
      '<div class="cw-grid">' +
      '<div class="cw-card reveal"><h3><span class="cw-plain-tag">Testo semplice</span></h3>' +
      '<p class="cw-plain">Siamo una pizzeria. Facciamo pizze buone. Siamo aperti tutti i giorni. Vi aspettiamo. Venite a trovarci presto. Il nostro numero è questo qui sotto. Ciao.</p></div>' +
      '<div class="cw-card tip reveal reveal-d1"><h3><span class="cw-pro-tag">' + icon('pen') + ' Testo professionale</span></h3>' +
      '<p class="cw-pro">Dal 1978 impastiamo ogni giorno con <b>farine macinate a pietra</b> e lievitazioni lente fino a <b>72 ore</b>. Il risultato? Una pizza <span class="hl">leggera, digeribile e dal cornicione alveolato</span>, cotta nel nostro forno a legna. Vi aspettiamo dal martedì alla domenica, dalle 19:00: prenotate il vostro tavolo in un click.' +
      '<span class="tip-box"><b>Perché funziona?</b><br>Parole concrete, benefici per il cliente e una call-to-action chiara: così i testi comunicano valore, non solo informazioni.</span></p></div>' +
      '</div></div></section>'
    );
  }

  /* ---------- 22b. PULSANTE WHATSAPP FLOTTANTE (funzione) ---------- */
  function whatsappFloat() {
    var num = waLink();
    if (!num) return '';
    return (
      '<a class="wa-float" href="' + num + '" target="_blank" rel="noopener" aria-label="' + DICT.wa_tip.it + '">' +
      waIcon() + '<span class="wa-tip" data-i18n="wa_tip">' + DICT.wa_tip.it + '</span></a>'
    );
  }

  /* ---------- 22c. MAPPA INTERATTIVA (funzione) ---------- */
  function mapHTML() {
    var addr = site().address || '';
    return (
      '<section class="section alt" id="mappa"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.map.badge + '</span></div>' +
      sectionHead('map_kicker', 'map_title', 'map_sub', true) +
      '<div class="map-card reveal">' +
      '<div class="map-canvas" id="mapCanvas">' +
      '<svg viewBox="0 0 800 420" aria-hidden="true">' +
      '<rect width="800" height="420" fill="color-mix(in srgb,var(--bg-alt) 70%,var(--surface))"/>' +
      '<g fill="color-mix(in srgb,var(--surface) 80%,var(--bg-alt))">' +
      '<rect x="40" y="40" width="150" height="110" rx="8"/><rect x="230" y="40" width="170" height="70" rx="8"/>' +
      '<rect x="440" y="40" width="150" height="130" rx="8"/><rect x="630" y="40" width="130" height="90" rx="8"/>' +
      '<rect x="40" y="190" width="120" height="150" rx="8"/><rect x="200" y="150" width="200" height="120" rx="8"/>' +
      '<rect x="440" y="210" width="180" height="130" rx="8"/><rect x="660" y="170" width="100" height="120" rx="8"/>' +
      '</g>' +
      '<g stroke="color-mix(in srgb,var(--border) 75%,transparent)" stroke-width="10" fill="none">' +
      '<path d="M0 170H400M400 170H800"/><path d="M180 0V150M180 150V420"/>' +
      '<path d="M610 0V210M610 210V420"/><path d="M0 330H300M300 330H800"/>' +
      '</g>' +
      '<g stroke="color-mix(in srgb,var(--accent) 30%,var(--surface))" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="1 14">' +
      '<path d="M60 0V420M330 0V420M730 0V420"/><path d="M0 90H800M0 260H800"/>' +
      '</g>' +
      '<ellipse cx="180" cy="380" rx="95" ry="34" fill="color-mix(in srgb,#3E9B4F 28%,transparent)"/>' +
      '<ellipse cx="700" cy="70" rx="60" ry="26" fill="color-mix(in srgb,#4A9FD8 22%,transparent)"/>' +
      '</svg>' +
      '<span class="map-pin"><span class="map-pin-label">' + siteName() + '</span>' + icon('pin') + '</span>' +
      '<div class="map-zoom">' +
      '<button type="button" data-zoom="0.35" aria-label="Ingrandisci">' + icon('plus') + '</button>' +
      '<button type="button" data-zoom="-0.35" aria-label="Riduci">' + icon('minus') + '</button>' +
      '</div>' +
      '</div>' +
      '<div class="map-actions">' +
      '<a class="btn" href="https://www.google.com/maps/search/?api=1&amp;query=' + encodeURIComponent(addr) + '" target="_blank" rel="noopener" data-i18n="map_open">' +
      icon('nav') + '<span>' + DICT.map_open.it + '</span></a>' +
      '<span class="map-addr">' + icon('pin') + esc(addr) + '</span>' +
      '</div></div></div></section>'
    );
  }

  /* ---------- 23. REVISIONE SITO (funzione) ---------- */
  function reviewHTML() {
    return (
      '<section class="section alt" id="revisione"><div class="container">' +
      '<div class="fx-tag-bar"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.review.badge + '</span></div>' +
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
        '<div class="fx-tag-bar" style="margin-bottom:18px"><span class="fx-tag">' + icon('star') + ' ' + D.FEATURES.advancedContact.badge + '</span></div>' +
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
      '<li><span class="c-ico">' + icon('pin') + '</span><div><b>Indirizzo</b><span>' + esc(site().address || '') + '</span></div></li>' +
      '<li><span class="c-ico">' + icon('phone') + '</span><div><b>Telefono</b><span>' + esc(site().phone || '') + '</span></div></li>' +
      '<li><span class="c-ico">' + icon('mail') + '</span><div><b>Email</b><span>' + esc(site().email || '') + '</span></div></li>' +
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
      '<div class="trust-item">' + starsHTML() + '<span><b>4,7</b> &middot; 312 recensioni</span></div>' +
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
      '<div class="foot-brand"><div><b><span class="mark">' + siteMark() + '</span>' + siteName() + '</b>' +
      '<p data-i18n="footer_text">' + DICT.footer_text.it + '</p>' + mapSVG() + '</div></div>' +
      '<div><h4>Esplora</h4><ul>' +
      '<li><a href="#chi-siamo" data-i18n="nav_about">' + DICT.nav_about.it + '</a></li>' +
      '<li><a href="#menu" data-i18n="nav_menu">' + DICT.nav_menu.it + '</a></li>' +
      (AppState.features.extraPage ? '<li><a href="#eventi" data-i18n="nav_events">' + DICT.nav_events.it + '</a></li>' : '') +
      '<li><a href="#contatti" data-i18n="nav_contact">' + DICT.nav_contact.it + '</a></li></ul></div>' +
      '<div><h4>Orari</h4><ul><li>Lun &middot; chiuso</li><li>Mar&ndash;Gio &middot; 19&ndash;23</li>' +
      '<li>Ven&ndash;Sab &middot; 19&ndash;23:30</li><li>Dom &middot; 19&ndash;23</li></ul></div>' +
      '<div><h4>Contatti</h4><ul><li>' + esc(site().address || '') + '</li><li>' + esc(site().phone || '') + '</li>' +
      '<li>' + esc(site().email || '') + '</li></ul>' +
      '<div class="foot-social">' +
      '<a href="#" aria-label="Instagram">' + icon('ig') + '</a>' +
      '<a href="#" aria-label="Facebook">' + icon('fb') + '</a>' +
      '<a href="#" aria-label="TikTok">' + icon('music') + '</a></div></div>' +
      '</div>' +
      '<div class="foot-bottom"><span data-i18n="footer_tag">' + DICT.footer_tag.it.replace('Forno Nero', siteName()) + '</span>' +
      '<span>Demo interattiva &middot; contenuti fittizi &middot; senza prezzi</span></div>' +
      '</div></footer>'
    );
  }

  /* ---------- 27. SCRIPT INTERNO DELL'ANTEPRIMA ---------- */
  function previewScript() {
    var DISH_IMGS = DISHES.map(function (d) { return { src: imgUrl(d.photo, 800, 450), fb: phw(800, 450, d.emoji) }; });
    return (
      '<script>(function(){' +
      'var root=document.documentElement;' +
      'var feats=(root.getAttribute("data-features")||"").split(" ").filter(Boolean);' +
      'function has(f){return feats.indexOf(f)>-1;}' +
      'var DICT=' + JSON.stringify(DICT) + ';var lang="' + (AppState.lang || 'it') + '";' +
      'window.__ph=function(w,h,e){var Q=String.fromCharCode(39),cs=getComputedStyle(root),a=cs.getPropertyValue("--accent").trim()||"#C0563F",b=cs.getPropertyValue("--accent-2").trim()||"#8C2B21";return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent("<svg xmlns="+Q+"http://www.w3.org/2000/svg"+Q+" width="+Q+w+Q+" height="+Q+h+Q+" viewBox="+Q+"0 0 "+w+" "+h+Q+"><defs><linearGradient id="+Q+"g"+Q+" x1="+Q+"0"+Q+" y1="+Q+"0"+Q+" x2="+Q+"1"+Q+" y2="+Q+"1"+Q+"><stop offset="+Q+"0"+Q+" stop-color="+Q+a+Q+"/><stop offset="+Q+"1"+Q+" stop-color="+Q+b+Q+"/></linearGradient></defs><rect width="+Q+"100%"+Q+" height="+Q+"100%"+Q+" fill="+Q+"url(#g)"+Q+"/><text x="+Q+"50%"+Q+" y="+Q+"54%"+Q+" font-size="+Q+(h*0.34)+Q+" text-anchor="+Q+"middle"+Q+" dominant-baseline="+Q+"central"+Q+">"+e+"</text></svg>");};' +
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
      'm.innerHTML="<button class=\\"modal-close\\"><svg class=\\"ico\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"1.8\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" aria-hidden=\\"true\\"><line x1=\\"18\\" y1=\\"6\\" x2=\\"6\\" y2=\\"18\\"/><line x1=\\"6\\" y1=\\"6\\" x2=\\"18\\" y2=\\"18\\"/></svg></button>"+"<img src=\\""+dishImgs[idx].src+"\\" alt=\\"\\">"+"<div class=\\"modal-body\\"><h3 class=\\"modal-title\\">"+d.name+"</h3><p class=\\"modal-desc\\">"+d.desc+"</p><div class=\\"dish-tags\\">"+tags+"</div></div>";' +
      'var mi=m.querySelector("img");if(mi){mi.onerror=function(){this.onerror=null;this.src=dishImgs[idx].fb;};}' +
      'm.className="modal open";}' +
      'var dishEls=document.querySelectorAll(".dish[data-idx]");for(var di=0;di<dishEls.length;di++){(function(el){el.addEventListener("click",function(){openDish(+el.getAttribute("data-idx"));});})(dishEls[di]);}' +
      'document.addEventListener("click",function(e){if(e.target.classList&&(e.target.classList.contains("modal-close")||e.target.classList.contains("modal"))){var mm=document.querySelector(".modal");if(mm){mm.classList.remove("open");}}});' +
      'document.addEventListener("keydown",function(e){if(e.key==="Escape"){var mm2=document.querySelector(".modal");if(mm2){mm2.classList.remove("open");}}});' +

      /* --- galleria lightbox --- */
      'var gal=' + JSON.stringify(GALLERY.map(function (g) { return { src: imgUrl(g.photo, 900, 900), fb: phw(500, 500, g.emoji), cap: g.cap }; })) + ';var gi=0;' +
      'var lb=document.getElementById("lb");if(lb){' +
      'function show(i){gi=(i+gal.length)%gal.length;var img=document.getElementById("lbImg");var g=gal[gi];img.onerror=function(){this.onerror=null;this.src=g.fb;};img.src=g.src;var cap=document.getElementById("lbCap");if(cap){cap.textContent=g.cap;}document.getElementById("lbCount").textContent=(gi+1)+" / "+gal.length;}' +
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

      /* --- mappa interattiva: zoom --- */
      'if(has("map")){var mcv=document.getElementById("mapCanvas");var mz=0;' +
      'function setZoom(d){mz=Math.max(0,Math.min(2.8,mz+d));' +
      'var svg=mcv?mcv.querySelector("svg"):null;if(svg){svg.style.transform="scale("+(1+mz)+")";}var pin=mcv?mcv.querySelector(".map-pin"):null;if(pin){pin.style.transform="translate(-50%,-100%) scale("+(1+mz)+")";}}' +
      'var mbtns=mcv?mcv.querySelectorAll(".map-zoom button"):[];for(var mbi=0;mbi<mbtns.length;mbi++){(function(b){b.addEventListener("click",function(){setZoom(+b.getAttribute("data-zoom"));});})(mbtns[mbi]);}}' +

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

      /* --- contatori statistiche: conteggio leggero al primo ingresso --- */
      'var sns=document.querySelectorAll(".stat-num[data-count]");' +
      'if("IntersectionObserver" in window&&sns.length){' +
      'var cnt=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){if(es[i].isIntersecting){countUp(es[i].target);cnt.unobserve(es[i].target);}}},{threshold:0.4});' +
      'function countUp(el){var target=parseInt(el.getAttribute("data-count"),10);var dur=1300;var t0=null;' +
      'function step(ts){if(!t0){t0=ts;}var p=Math.min((ts-t0)/dur,1);var val=Math.round(target*(1-Math.pow(1-p,3)));el.textContent=val.toLocaleString("it-IT");if(p<1){requestAnimationFrame(step);}else{el.textContent=target.toLocaleString("it-IT");}}' +
      'requestAnimationFrame(step);}' +
      'for(var i3=0;i3<sns.length;i3++){cnt.observe(sns[i3]);}}' +
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
    section += statsHTML();
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
    section += testimonialsHTML();
    section += contactHTML();
    if (AppState.features.map) section += mapHTML();

    var head = (
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + siteName() + ' &mdash; Pizzeria &amp; Cucina Napoletana</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..900&family=Outfit:wght@400..800&display=swap" rel="stylesheet">' +
      '<style>' + window.PREVIEW_CSS + '</style>'
    );

    var body = (
      '<body class="' + layoutCls + featureClass + '">' +
      headerHTML() +
      '<main>' + heroHTML() + trustBarHTML() + section + '</main>' +
      footerHTML() +
      '<a class="book-float" href="' + (AppState.features.booking ? '#prenota' : '#contatti') + '" data-i18n="float_book">' +
      icon('calendar') + '<span>' + DICT.float_book.it + '</span></a>' +
      (AppState.features.whatsapp ? whatsappFloat() : '') +
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
