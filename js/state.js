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

  /* --- Le 5 palette predefinite (swatch = accostamento colori) --- */
  var PALETTES = [
    { id: 'trattoria',   name: 'Trattoria Calda',  swatches: ['#B23A2E', '#F4E9DA', '#2E2A26'] },
    { id: 'notte',       name: 'Pizzeria Notte',   swatches: ['#121212', '#E63946', '#F5F5F5'] },
    { id: 'mediterraneo',name: 'Mediterraneo',     swatches: ['#1B3A4B', '#FFFFFF', '#D4A73D'] },
    { id: 'bio',         name: 'Naturale / Bio',   swatches: ['#5C7A5C', '#EDE6D6', '#7A5C3E'] },
    { id: 'minimal',     name: 'Minimal Elegante', swatches: ['#FAFAFA', '#1A1A1A', '#C9A227'] }
  ];

  /* --- Categorie del pannello (accordion) --- */
  var CATEGORIES = [
    { id: 'content',  name: 'Contenuti',                icon: '&#128221;' },
    { id: 'advanced', name: 'Funzioni avanzate',        icon: '&#9881;' },
    { id: 'design',   name: 'Design & Media',           icon: '&#127912;' },
    { id: 'seo',      name: 'SEO & Visibilità',         icon: '&#128269;' },
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
    qrCode:          { cat: 'advanced', icon: '&#129516;', name: 'QR code menu / vetrina',   desc: 'Codice QR generato collegato al menu digitale',                         badge: 'QR code menu' },
    socialFeed:      { cat: 'design',   icon: '&#128247;', name: 'Feed social',              desc: 'Griglia stile Instagram con 6 immagini',                                 badge: 'Feed social integrato' },
    gallery:         { cat: 'design',   icon: '&#128444;', name: 'Galleria / lightbox',      desc: 'Griglia immagini con overlay e frecce di navigazione',                  badge: 'Galleria con lightbox' },
    animations:      { cat: 'design',   icon: '&#127919;', name: 'Animazioni custom',        desc: 'Hero animato, particelle canvas e parallax',                             badge: 'Animazioni custom' },
    proPhoto:        { cat: 'design',   icon: '&#128248;', name: 'Fotografia professionale', desc: 'Confronto prima / dopo su scatto gastronomico',                         badge: 'Fotografia professionale' },
    photoEdit:       { cat: 'design',   icon: '&#9998;',   name: 'Editing foto / ritocco',   desc: 'Ritocco, color grading e rimozione watermark',                          badge: 'Editing foto / ritocco' },
    logo:            { cat: 'design',   icon: '&#9997;',   name: 'Logo / identità visiva',   desc: 'Logo placeholder in 2 varianti (chiaro / scuro)',                        badge: 'Logo & identità visiva' },
    seo:             { cat: 'seo',      icon: '&#127919;', name: 'SEO avanzata',            desc: 'Schema markup attivo con tooltip esplicativo',                          badge: 'SEO avanzata · Schema markup' },
    googleBusiness:  { cat: 'seo',      icon: '&#128205;', name: 'Google Business Profile',  desc: 'Anteprima simulata della scheda Google con recensioni',                  badge: 'Google Business Profile' },
    copywriting:     { cat: 'seo',      icon: '&#9999;',   name: 'Copywriting professionale',desc: 'Confronto testo semplice vs testo curato professionalmente',            badge: 'Copywriting professionale' },
    review:          { cat: 'review',   icon: '&#128260;', name: 'Prima / Dopo',             desc: 'Mockup confronto: sito vecchio vs versione rinnovata',                   badge: 'Prima / Dopo · rinnovamento' }
  };

  /* --- Stato dell'app (unico punto di verità) --- */
  var AppState = {
    layout: 'essential',          // essential | classic | modern
    palette: 'trattoria',         // trattoria | notte | mediterraneo | bio | minimal
    view: 'desktop',              // desktop | mobile
    features: {
      extraPage:       false,
      blog:            false,
      multilang:       false,
      booking:         false,
      digitalMenu:     false,
      advancedContact: false,
      qrCode:          false,
      socialFeed:      false,
      gallery:         false,
      animations:      false,
      proPhoto:        false,
      photoEdit:       false,
      logo:            false,
      seo:             false,
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

  window.AppData = { LAYOUTS: LAYOUTS, PALETTES: PALETTES, CATEGORIES: CATEGORIES, FEATURES: FEATURES };
  window.AppState = AppState;
  window.AppUtils = { activeFeatures: activeFeatures, activeCount: activeCount };
})();
