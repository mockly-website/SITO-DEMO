# PROMPT — Foto reali, fix bug vista Desktop, più contenuti, design di livello superiore

Continua a lavorare sui file esistenti del configuratore (`index.html`, `panel.css`, `panel.js`, `state.js`, `render.js`, `preview-css.js`). Non ripartire da zero: le fondamenta (stato centrale, rebuild via `srcdoc`, viewport virtuale 1440px + scala per il Desktop, drawer del pannello, accordion, palette) sono corrette e vanno mantenute. Qui sotto le 4 aree su cui intervenire.

---

## 1. FOTO REALI al posto dei placeholder SVG generati

Oggi tutte le immagini (piatti, hero, gallery, social feed, eventi, blog, prima/dopo) sono SVG generati al volo con gradiente + emoji (funzioni `ph()` / `phw()` in `render.js`). Vanno sostituite con **fotografie reali**, per rendere la demo credibile agli occhi del cliente.

**Come procedere:**
1. Usa foto reali e gratuite per uso commerciale, hot-linkabili direttamente via URL (es. Unsplash `images.unsplash.com/photo-...`, o Pexels), **non** endpoint "random" che restituiscono un'immagine diversa a ogni caricamento — servono URL fissi e curati a mano, coerenti con il soggetto (pizza, pasta, forno a legna, interni trattoria/pizzeria, ingredienti, tavolo apparecchiato, mani dello chef, ecc.), così la demo è sempre identica e presentabile.
2. Crea in `render.js` un catalogo centralizzato di URL reali (es. `var STOCK_PHOTOS = { pizzaMargherita: "https://...", ovenWood: "https://...", ... }`), organizzato per soggetto, così è facile mantenerlo e sostituire singole foto in futuro.
3. Sostituisci gli usi di `phw()`/`ph()` con questo catalogo ovunque serva una foto realistica: hero delle 3 strutture, sezione Chi Siamo, ogni piatto del menu base e del menu digitale, galleria, feed social, eventi, blog, prima/dopo fotografico, sezione logo.
4. **Non eliminare** `ph()`/`qrSVG()`: tienile come fallback. Ogni `<img>` con foto reale deve avere un gestore `onerror` che sostituisce `src` con il placeholder SVG generato, così se un link smette di funzionare la demo non si rompe mai (nessuna icona "immagine rotta" del browser, mai).
5. Aggiungi `loading="lazy"` e `decoding="async"` su tutte le immagini reali (ora pesano molto più degli SVG generati), e un `alt` descrittivo e specifico per ciascuna (non generico "foto piatto").
6. Applica un trattamento coerente con la palette attiva sopra le foto reali (overlay/duotone leggero che usa `var(--accent)` o `var(--text)` a bassa opacità), così le foto restano fotografie riconoscibili ma "vestite" con i colori del brand selezionato, invece di apparire scollegate dal resto del sito.
7. Il QR code (`qrSVG`) resta generato via codice: non è una foto, va bene così com'è.

---

## 2. BUG RESIDUI in vista Desktop — sistemare la causa radice, non i sintomi

Il meccanismo attuale di scala (`applyScale()` in `panel.js`) si basa su `setTimeout` con tempi fissi (100ms per il resize, 400ms per l'apertura/chiusura pannello) che **assumono** che la transizione CSS duri esattamente quel tempo. Questo è fragile: se il browser è sotto carico, se la transizione CSS cambia durata in futuro, o se più eventi si accavallano (es. resize della finestra mentre il pannello si sta aprendo), il calcolo della scala può avvenire troppo presto o troppo tardi, causando uno "scatto"/flash visibile del frame Desktop al caricamento o durante l'apertura del pannello — sintomo osservabile e fastidioso in presentazione.

**Correzione richiesta — sostituire i timer con `ResizeObserver`:**
1. Sostituisci la logica a `setTimeout` (`scheduleScale`, i due `setTimeout` in `setPanel` e nel listener di `resize`) con un singolo `ResizeObserver` collegato all'elemento `.stage`.
2. Ogni volta che le dimensioni reali di `.stage` cambiano — per resize della finestra, apertura/chiusura del pannello, cambio di zoom del browser — l'observer richiama `applyScale()` con le dimensioni **effettive e già aggiornate**, eliminando ogni ipotesi sui tempi di transizione CSS.
3. Aggiungi comunque un debounce leggero (via `requestAnimationFrame`, non `setTimeout` con tempo fisso) per evitare ricalcoli eccessivi durante transizioni continue, senza reintrodurre assunzioni sui tempi.
4. Rimuovi le chiamate ridondanti a `applyScale()` sparse nell'init (`setPanel` + chiamata diretta subito dopo): con il ResizeObserver attivo dall'inizio, la scala si calcola automaticamente al primo layout, senza bisogno di chiamate multiple che possono entrare in conflitto tra loro.
5. **Test di accettazione:** aprendo/chiudendo il pannello ripetutamente, ridimensionando la finestra con il mouse tenendo premuto (drag continuo), e cambiando lo zoom del browser (Ctrl/Cmd +/-), il frame Desktop deve restare sempre proporzionato e nitido, senza mai uno scatto, un salto di dimensione o un istante in cui il contenuto appare troppo grande/tagliato prima di assestarsi.
6. Fai anche una verifica specifica sul pulsante "Apri a schermo intero": su un monitor molto largo (es. 1920px o oltre), il sito aperto nella nuova scheda deve restare leggibile e ben proporzionato (i container hanno già un `max-width` centrato, verifica solo che non ci siano elementi che si allarghino a piena larghezza in modo scomposto, tipo immagini hero o griglie che perdono il loro rapporto proporzionale su schermi molto larghi).

---

## 3. PIÙ ELEMENTI — arricchire ulteriormente i contenuti, sempre senza prezzi

Aggiungi le seguenti sezioni/elementi, distinguendo chiaramente cosa fa parte del "sempre visibile" (livello base, per alzare la qualità percepita del pacchetto standard) e cosa resta legato a un toggle esistente (nessun prezzo in nessun caso):

**Sempre visibili (arricchimento del pacchetto base):**
- Una sezione **testimonianze/recensioni** con 3 citazioni brevi di clienti fittizi (nome, eventuale foto reale generica di persona, valutazione a stelle), posizionata dopo il menu o prima dei contatti.
- Un **pulsante "Prenota" flottante** (sticky, angolo basso) sempre visibile durante lo scroll nelle 3 strutture, che porta alla sezione contatti (o al form di prenotazione se la funzione è attiva) — elemento comune nei siti di ristorazione reali, alza il realismo.
- Una piccola sezione **numeri/statistiche** (es. "1978 anno di apertura", "12.000 pizze l'anno", "60 coperti", "100% farine bio") con un'animazione di conteggio leggera al primo ingresso in viewport.

**Legati a funzioni esistenti (nessuna nuova voce nel pannello, arricchisci quelle già presenti):**
- Nella sezione Eventi, aggiungi un piccolo badge "Prossimo evento" sul primo elemento.
- Nella Galleria, oltre alle foto reali (punto 1), aggiungi didascalie brevi per ciascuna immagine nel lightbox.
- Nel Blog, aggiungi un autore fittizio con avatar (foto reale generica) accanto a data e tempo di lettura.

---

## 4. LIVELLO DI DESIGN GENERALE — alzare la qualità percepita su tutte e 3 le strutture

Interventi trasversali da applicare a Essenziale, Classico e Moderno:

1. **Tipografia**: sostituisci il solo font di sistema con una coppia tipografica curata caricata da Google Fonts via `<link>` nell'head del documento generato (es. un serif con carattere per i titoli + uno sans-serif pulito per il corpo testo, coerenti con l'identità "trattoria/pizzeria artigianale"). Deve restare leggera da caricare (massimo 2 famiglie, pesi essenziali).
2. **Icone**: sostituisci le emoji usate come icone funzionali (nav, badge, social, stelle recensioni, freccette lightbox) con un set coerente di icone SVG inline minimali (stroke-based, un solo colore ereditato da `currentColor`), mantenendo le emoji solo dove servono come illustrazione "calda" e informale (es. nei piatti del menu, se lo stile lo giustifica) — oggi l'uso diffuso di emoji per bottoni e icone di sistema comunica un livello da prototipo, non da sito professionale.
3. **Cards e ombre**: rivedi ombre, raggi di bordo e spaziature interne di dish-card, event-card, post-card, testimonial-card per renderle più coerenti tra loro (stesso sistema di elevazione/shadow su tutte), con hover più curato (leggero lift + variazione ombra, non solo scala).
4. **Ritmo verticale**: verifica che gli spazi tra sezioni (`.section` padding) e tra elementi interni seguano una scala coerente (es. multipli di 4px/8px) su tutte e 3 le strutture, non solo valori "clamp" indipendenti sezione per sezione.
5. **Palette applicate alle foto**: vedi punto 1.7 — l'introduzione di foto reali deve integrarsi visivamente con le 5 palette esistenti, non sembrare "incollata sopra".
6. **Micro-dettagli**: cursore custom leggero sui bottoni principali (facoltativo, solo se non appesantisce), stato di focus visibile e curato su tutti gli elementi interattivi (non solo quelli già coperti), transizione di caricamento pagina più elegante (la classe `.rendering` con opacity/scale attuale va bene, valuta se aggiungere uno skeleton/shimmer leggero al posto del semplice fade per i blocchi immagine, ora che le foto reali possono impiegare più tempo a caricare).

---

## VINCOLI DA RISPETTARE (invariati)
- HTML/CSS/JS vanilla, uniche dipendenze esterne ammesse: font da Google Fonts e le foto reali da fonti hot-linkabili gratuite per uso commerciale.
- Nessun prezzo in nessun punto del sito demo o del pannello.
- Cambio palette resta istantaneo (solo variabili CSS), cambio struttura/funzioni resta un rebuild via `srcdoc`.
- Ogni immagine reale deve avere fallback funzionante (vedi punto 1.4): la demo non deve mai mostrare un'icona di immagine rotta, in nessuna condizione di rete.
- Tutte le nuove transizioni/animazioni devono restare fluide e leggere, mai invasive o che rallentano la demo durante una presentazione dal vivo.

## OUTPUT ATTESO
I file esistenti aggiornati con foto reali coerenti e curate, il fix strutturale della scala Desktop basato su `ResizeObserver`, le nuove sezioni/elementi elencati al punto 3, e le migliorie di design del punto 4 applicate in modo uniforme su tutte e 3 le strutture e tutte e 5 le palette.
