/* ============================================================
   state.js — Stato centrale + metadati (strutture, palette, funzioni)
   Tutta l'app gira intorno a un singolo oggetto di stato: cambiare
   una proprietà e chiamare il renderer aggiorna l'anteprima live.
   ============================================================ */
(function () {
  'use strict';

  /* --- Metadati delle 3 strutture/layout --- */
  var LAYOUTS = {
    essential: { id: 'essential', name: 'Essenziale', tag: 'One Page minimal', icon: '&#9630;' },
    classic:   { id: 'classic',   name: 'Classico',   tag: 'Multipagina tradizionale', icon: '&#9774;' },
    modern:    { id: 'modern',    name: 'Moderno',    tag: 'Asimmetrico & bold', icon: '&#9670;' }
  };

  /* --- Le 9 palette predefinite (swatch = mini-anteprima realistica) ---
       prev: sfondo pagina, colore testo, accento → mini barra "bottone" */
  var PALETTES = [
    { id: 'trattoria',    name: 'Trattoria Calda',  swatches: ['#B23A2E', '#F4E9DA', '#2E2A26'], prev: { bg: '#F4E9DA', text: '#2E2A26', accent: '#B23A2E' } },
    { id: 'notte',        name: 'Pizzeria Notte',   swatches: ['#121212', '#E63946', '#F5F5F5'], prev: { bg: '#121212', text: '#F5F5F5', accent: '#E63946' } },
    { id: 'mediterraneo', name: 'Mediterraneo',     swatches: ['#1B3A4B', '#FFFFFF', '#D4A73D'], prev: { bg: '#FFFFFF', text: '#1B3A4B', accent: '#1B3A4B' } },
    { id: 'bio',          name: 'Naturale / Bio',   swatches: ['#5C7A5C', '#EDE6D6', '#7A5C3E'], prev: { bg: '#EDE6D6', text: '#33422F', accent: '#5C7A5C' } },
    { id: 'minimal',      name: 'Minimal Elegante', swatches: ['#FAFAFA', '#1A1A1A', '#C9A227'], prev: { bg: '#FAFAFA', text: '#1A1A1A', accent: '#C9A227' } },
    { id: 'solare',       name: 'Solare',           swatches: ['#E8A020', '#FFF8E7', '#4A3B2F'], prev: { bg: '#FFF8E7', text: '#4A3B2F', accent: '#E8A020' } },
    { id: 'oceano',       name: 'Oceano',           swatches: ['#0E7C7B', '#EEF5F4', '#12343B'], prev: { bg: '#EEF5F4', text: '#12343B', accent: '#0E7C7B' } },
    { id: 'rosa',         name: 'Rosé / Blush',     swatches: ['#C2455D', '#FBF1F2', '#4A2E33'], prev: { bg: '#FBF1F2', text: '#4A2E33', accent: '#C2455D' } },
    { id: 'grafite',      name: 'Grafite',          swatches: ['#3D6DE0', '#191C22', '#EEF0F4'], prev: { bg: '#191C22', text: '#EEF0F4', accent: '#3D6DE0' } }
  ];

  /* --- Categorie del pannello (accordion) --- */
  var CATEGORIES = [
    { id: 'content',  name: 'Contenuti',                icon: '&#128221;' },
    { id: 'advanced', name: 'Funzioni avanzate',        icon: '&#9881;' },
    { id: 'design',   name: 'Design & Media',           icon: '&#127912;' },
    { id: 'review',   name: 'Revisione sito esistente', icon: '&#128260;' }
  ];

  /* --- Tutte le funzioni extra attivabili ---
       ogni voce: categoria, nome, descrizione, testo del badge in anteprima */
  var FEATURES = {
    extraPage:       { cat: 'content',  icon: '&#128196;', name: 'Pagina extra',             desc: 'Aggiunge una sezione "Eventi" alla navigazione',                       badge: 'Pagina extra · Eventi' },
    blog:            { cat: 'content',  icon: '&#128240;', name: 'Blog / news',              desc: 'Blocco "Ultime dal locale" con 3 articoli',                             badge: 'Blog / Ultime dal locale' },
    multilang:       { cat: 'content',  icon: '&#127758;', name: 'Multilingua',              desc: 'Switch IT/EN nell\'header che traduce i testi chiave',                   badge: 'Multilingua IT / EN' },
    booking:         { cat: 'advanced', icon: '&#128197;', name: 'Prenotazione online',      desc: 'Form data/ora/persone con validazione JS vanilla',                       badge: 'Prenotazione online' },
    digitalMenu:     { cat: 'advanced', icon: '&#128215;', name: 'Menu digitale interattivo',desc: 'Griglia piatti con foto, filtri per categoria e dettaglio',              badge: 'Menu digitale interattivo' },
    advancedContact: { cat: 'advanced', icon: '&#128225;', name: 'Form contatti avanzato',   desc: 'Validazione client-side in tempo reale e conferma simulata',            badge: 'Form contatti avanzato' },
    qrCode:          { cat: 'advanced', icon: '&#129516;', name: 'QR code menu digitale', desc: 'Codice QR per aprire il menu digitale da tavolo',                          badge: 'QR code menu digitale' },
    whatsapp:        { cat: 'advanced', icon: '&#128172;', name: 'Pulsante WhatsApp',        desc: 'Bottone flottante che apre una chat WhatsApp con il locale',            badge: 'Chat WhatsApp' },
    map:             { cat: 'advanced', icon: '&#128506;', name: 'Mappa interattiva',        desc: 'Sezione mappa con zoom e link alle indicazioni stradali',              badge: 'Mappa interattiva' },
    googleBusiness:  { cat: 'advanced', icon: '&#128205;', name: 'Google Business Profile',  desc: 'Anteprima simulata della scheda Google con recensioni',                  badge: 'Google Business Profile' },
    copywriting:     { cat: 'advanced', icon: '&#9999;',   name: 'Copywriting professionale',desc: 'Confronto testo semplice vs testo curato professionalmente',            badge: 'Copywriting professionale' },
    socialFeed:      { cat: 'design',   icon: '&#128247;', name: 'Feed social',              desc: 'Griglia stile Instagram con 6 immagini',                                 badge: 'Feed social integrato' },
    gallery:         { cat: 'design',   icon: '&#128444;', name: 'Galleria / lightbox',      desc: 'Griglia immagini con overlay e frecce di navigazione',                  badge: 'Galleria con lightbox' },
    animations:      { cat: 'design',   icon: '&#127919;', name: 'Animazioni custom',        desc: 'Hero animato, particelle canvas e parallax',                             badge: 'Animazioni custom' },
    review:          { cat: 'review',   icon: '&#128260;', name: 'Prima / Dopo',             desc: 'Mockup confronto: sito vecchio vs versione rinnovata',                   badge: 'Prima / Dopo · rinnovamento' },
    storia:          { cat: 'content',  icon: '&#128337;', name: 'La nostra storia',         desc: 'Timeline del locale dal 1978 a oggi',                                    badge: 'La nostra storia' },
    degustazioni:    { cat: 'content',  icon: '&#127863;', name: 'Degustazioni & corsi',     desc: 'Card esperienze: vini, corsi di cucina e masterclass',                  badge: 'Degustazioni & corsi' },
    giftCard:        { cat: 'content',  icon: '&#127873;', name: 'Buoni cena',               desc: 'Regala un aperitivo, una cena o una degustazione',                     badge: 'Buoni cena' },
    loyalty:         { cat: 'advanced', icon: '&#127942;', name: 'Programma fedeltà',        desc: 'Card punti con livelli e barra di avanzamento',                         badge: 'Programma fedeltà' }
  };

  /* --- Contenuti personalizzabili del locale (dal pannello) --- */
  var SITE_DEFAULTS = {
    name: 'Forno Nero',
    tagline: 'Pizzeria · Trattoria · Forno a legna',
    phone: '+39 06 1234 5678',
    email: 'ciao@fornonero.it',
    address: 'Via dei Fornai 12, 00100 Roma',
    whatsapp: '+39 06 1234 5678',
    hours: 'Mar–Dom 19:00–23:30',
    instagram: '@fornonero',
    facebook: '/fornonero'
  };

  /* --- Stato dell'app (unico punto di verità) --- */
  var AppState = {
    layout: 'essential',          // essential | classic | modern
    palette: 'trattoria',         // trattoria | notte | mediterraneo | bio | minimal | solare | oceano | rosa | grafite
    view: 'desktop',              // desktop | mobile
    lang: 'it',                   // it | en (persiste tra i rebuild)
    site: {
      name: SITE_DEFAULTS.name,
      tagline: SITE_DEFAULTS.tagline,
      phone: SITE_DEFAULTS.phone,
      email: SITE_DEFAULTS.email,
      address: SITE_DEFAULTS.address,
      whatsapp: SITE_DEFAULTS.whatsapp,
      hours: SITE_DEFAULTS.hours,
      instagram: SITE_DEFAULTS.instagram,
      facebook: SITE_DEFAULTS.facebook
    },
    features: {
      extraPage:       false,
      blog:            false,
      multilang:       false,
      booking:         false,
      digitalMenu:     false,
      advancedContact: false,
      qrCode:          false,
      whatsapp:        false,
      map:             false,
      socialFeed:      false,
      gallery:         false,
      animations:      false,
      storia:          false,
      degustazioni:    false,
      giftCard:        false,
      loyalty:         false,
      googleBusiness:  false,
      copywriting:     false,
      review:          false
    }
  };

  /* --- Utilità condivise --- */
  function activeFeatures(state) {
    var out = [];
    Object.keys(state.features).forEach(function (k) {
      if (state.features[k]) out.push(k);
    });
    return out;
  }

  function activeCount(state) {
    return activeFeatures(state).length;
  }

  window.AppData = { LAYOUTS: LAYOUTS, PALETTES: PALETTES, CATEGORIES: CATEGORIES, FEATURES: FEATURES, SITE_DEFAULTS: SITE_DEFAULTS };
  window.AppState = AppState;
  window.AppUtils = { activeFeatures: activeFeatures, activeCount: activeCount };
})();
