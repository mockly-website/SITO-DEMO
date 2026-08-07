/* ============================================================
   preview-css.js — CSS completo dell'anteprima demo.
   Viene iniettato dentro l'iframe come un unico <style>.
   Le palette sono custom-property sul <html[data-palette]>,
   le 3 strutture sono classi sul <body> (layout-*).
   ============================================================ */
window.PREVIEW_CSS = `
/* ---------- 1. RESET & BASE ---------- */
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --font-sans:'Outfit',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --font-serif:'Fraunces',Georgia,"Times New Roman",serif;
  --radius:16px; --radius-s:10px;
  --ease:cubic-bezier(.22,.61,.36,1);
  --shadow:0 18px 50px rgba(0,0,0,.14);
  --shadow-sm:0 6px 20px rgba(0,0,0,.10);
}
/* Le 9 palette. Cambio palette = cambia solo data-palette sul <html>:
   le custom-property si aggiornano istantaneamente senza rebuild. */
[data-palette="trattoria"]{
  --bg:#F4E9DA; --bg-alt:#EFDFC9; --surface:#FFFFFF; --text:#2E2A26;
  --muted:#6E6359; --accent:#B23A2E; --accent-2:#8C2B21; --border:#E0CFB8;
  --on-accent:#FFFFFF;
}
[data-palette="notte"]{
  --bg:#121212; --bg-alt:#1E1E1E; --surface:#242424; --text:#F5F5F5;
  --muted:#A8A8A8; --accent:#E63946; --accent-2:#FF6B6B; --border:#333333;
  --on-accent:#FFFFFF;
}
[data-palette="mediterraneo"]{
  --bg:#FFFFFF; --bg-alt:#F2F6F8; --surface:#FFFFFF; --text:#1B3A4B;
  --muted:#5C7480; --accent:#1B3A4B; --accent-2:#D4A73D; --border:#DCE6EA;
  --on-accent:#FFFFFF;
}
[data-palette="bio"]{
  --bg:#EDE6D6; --bg-alt:#E4DAC4; --surface:#FBF9F3; --text:#33422F;
  --muted:#5C6B54; --accent:#5C7A5C; --accent-2:#7A5C3E; --border:#D8CDB4;
  --on-accent:#FFFFFF;
}
[data-palette="minimal"]{
  --bg:#FAFAFA; --bg-alt:#F0F0F0; --surface:#FFFFFF; --text:#1A1A1A;
  --muted:#6B6B6B; --accent:#C9A227; --accent-2:#1A1A1A; --border:#E6E6E6;
  --on-accent:#14161B;
}
[data-palette="solare"]{
  --bg:#FFF8E7; --bg-alt:#FCEFD3; --surface:#FFFFFF; --text:#4A3B2F;
  --muted:#8A7A68; --accent:#E8A020; --accent-2:#C47F14; --border:#F0E3C6;
  --on-accent:#241A08;
}
[data-palette="oceano"]{
  --bg:#EEF5F4; --bg-alt:#E0ECEA; --surface:#FFFFFF; --text:#12343B;
  --muted:#4E6E75; --accent:#0E7C7B; --accent-2:#2AA79B; --border:#CFE0DE;
  --on-accent:#FFFFFF;
}
[data-palette="rosa"]{
  --bg:#FBF1F2; --bg-alt:#F7E3E6; --surface:#FFFFFF; --text:#4A2E33;
  --muted:#8A6A70; --accent:#C2455D; --accent-2:#A53A4F; --border:#F0D8DC;
  --on-accent:#FFFFFF;
}
[data-palette="grafite"]{
  --bg:#191C22; --bg-alt:#21252D; --surface:#262B34; --text:#EEF0F4;
  --muted:#9AA2AF; --accent:#3D6DE0; --accent-2:#6B96F0; --border:#343A45;
  --on-accent:#FFFFFF;
}
html{scroll-behavior:smooth}
section[id]{scroll-margin-top:72px}
body{font-family:var(--font-sans);color:var(--text);background:var(--bg);line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer;border:none;background:none}
input,select,textarea{font-family:inherit}
.container{width:min(1100px,92%);margin-inline:auto}
.section{padding:clamp(56px,9vw,96px) 0;position:relative}
.section.alt{background:var(--bg-alt)}
.kicker{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:14px;display:inline-flex;align-items:center;gap:8px}
.kicker::before{content:"";width:22px;height:2px;background:var(--accent);border-radius:2px}
.sec-title{font-size:clamp(1.9rem,4.5vw,3rem);line-height:1.1;letter-spacing:-.02em;margin-bottom:14px}
.sec-sub{color:var(--muted);max-width:640px}
.center{text-align:center}
.center .sec-sub{margin-inline:auto}

/* Fotografie reali: leggera "tinta" coerente con la palette (le foto restano
   riconoscibili ma integrate col brand). .img-wm = versione "amatoriale"
   desaturata per i before/after, .ba-wm = watermark finto da rimuovere. */
.img-pal{box-shadow:inset 0 0 0 1000px color-mix(in srgb,var(--accent) 7%,transparent)}
.img-wm{filter:saturate(.22) contrast(.9) brightness(1.06)}
.ba-wm{position:absolute;inset:0;z-index:2;display:grid;place-items:center;color:rgba(255,255,255,.5);font-weight:800;letter-spacing:.22em;font-size:clamp(1rem,3vw,2rem);transform:rotate(-16deg);pointer-events:none;text-shadow:0 2px 10px rgba(0,0,0,.5)}

/* ---------- 2. BUTTONS, TAG, BADGE ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.85rem 1.7rem;border-radius:999px;background:var(--accent);color:var(--on-accent);font-weight:600;font-size:15px;transition:transform .25s var(--ease),box-shadow .25s var(--ease),background .25s var(--ease)}
.btn:hover{transform:translateY(-3px);box-shadow:0 12px 26px -10px var(--accent);background:var(--accent-2)}
.btn-ghost{background:transparent;border:1.5px solid var(--accent);color:var(--accent)}
.btn-ghost:hover{background:var(--accent);color:var(--on-accent);box-shadow:none}
.btn.sm{padding:.5rem 1.1rem;font-size:13px}

/* Badge discreto: dice al cliente QUALE funzione extra sta guardando (mai prezzi) */
.fx-tag{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:var(--accent);color:var(--on-accent);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 6px 16px -8px var(--accent);white-space:nowrap}
.fx-tag-bar{display:flex;justify-content:center;margin-bottom:34px}
.section-head{max-width:760px;margin-bottom:clamp(30px,5vw,52px)}

/* ---------- 3. HEADER & NAV ---------- */
.site-header{position:sticky;top:0;z-index:40;backdrop-filter:blur(10px)}
.layout-essential .site-header{background:color-mix(in srgb,var(--bg) 86%,transparent);border-bottom:1px solid var(--border)}
.layout-classic .site-header{background:var(--surface);border-bottom:1px solid var(--border);box-shadow:0 2px 14px rgba(0,0,0,.05)}
.layout-modern .site-header{background:var(--text);color:var(--bg);border-bottom:1px solid color-mix(in srgb,var(--bg) 18%,transparent)}
.nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 0}
.nav-brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:20px;letter-spacing:-.02em}
.nav-brand .mark{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:var(--accent);color:var(--on-accent);font-weight:800;font-size:15px;flex:none}
.layout-essential .nav{justify-content:center;gap:36px}
.layout-essential .nav-brand{display:none}
.nav-links{display:flex;align-items:center;gap:26px;list-style:none}
.nav-links a{font-size:14.5px;font-weight:500;opacity:.85;transition:opacity .2s,color .2s;position:relative}
.nav-links a:hover{opacity:1;color:var(--accent)}
.nav-links a.is-cta{background:var(--accent);color:var(--on-accent);padding:.55rem 1.25rem;border-radius:999px;font-weight:600;opacity:1}
.nav-links a.is-cta:hover{background:var(--accent-2);color:#fff}
.nav-toggle{display:none;width:42px;height:42px;border-radius:10px;border:1px solid var(--border);align-items:center;justify-content:center;font-size:18px;flex:none}
.layout-modern .nav-toggle{border-color:color-mix(in srgb,var(--bg) 30%,transparent)}

/* Switch lingua (multilingua) */
.lang-switch{display:flex;border:1px solid var(--border);border-radius:999px;overflow:hidden;flex:none}
.layout-modern .lang-switch{border-color:color-mix(in srgb,var(--bg) 30%,transparent)}
.lang-btn{padding:.4rem .85rem;font-size:12px;font-weight:700;letter-spacing:.05em;transition:.2s}
.lang-btn.is-active{background:var(--accent);color:var(--on-accent)}
.layout-modern .lang-btn:not(.is-active){color:var(--bg)}

/* ---------- 4. HERO ---------- */
.hero{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}

/* A · Essenziale: pieno schermo, centrato, tipografia protagonista */
.layout-essential .hero{min-height:92vh;text-align:center;padding:80px 0}
.layout-essential .hero::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 18%,color-mix(in srgb,var(--accent) 14%,transparent),transparent 70%);pointer-events:none}
.hero-orb{position:absolute;width:46vmax;height:46vmax;border-radius:50%;background:radial-gradient(circle at 30% 30%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 65%);filter:blur(10px);pointer-events:none;top:-18%;right:-12%;animation:drift 14s ease-in-out infinite}
.hero-pic{position:absolute;inset:0;z-index:-1;filter:blur(8px) saturate(.9);opacity:.16;transform:scale(1.06);pointer-events:none}
.hero-pic img{width:100%;height:100%;object-fit:cover}
.hero-kicker{font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:22px}
.hero-title{font-family:var(--font-serif);font-size:clamp(3rem,9vw,6rem);line-height:1.02;letter-spacing:-.02em;margin-bottom:24px}
.hero-title span{color:var(--accent)}
.hero-sub{font-size:clamp(1.05rem,2vw,1.3rem);color:var(--muted);max-width:560px;margin:0 auto 34px}
.hero-cta{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.scroll-hint{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);color:var(--muted);font-size:22px;animation:bob 2.2s ease-in-out infinite}

/* B · Classico: immagine di sfondo, contenuto a sinistra */
.layout-classic .hero{min-height:88vh;color:#fff;padding:110px 0 90px}
.layout-classic .hero-bg{position:absolute;inset:-40px 0;background-image:linear-gradient(rgba(0,0,0,.62),rgba(0,0,0,.5)),var(--hero-img);background-size:cover;background-position:center;z-index:-1;will-change:transform}
.layout-classic .hero-inner{max-width:640px}
.layout-classic .hero-kicker{color:#ffd9a0}
.layout-classic .hero-title{font-size:clamp(2.6rem,6vw,4.4rem);font-weight:800;line-height:1.05;margin-bottom:20px}
.layout-classic .hero-sub{color:rgba(255,255,255,.85);margin:0 0 32px;font-size:1.15rem}
.hero-facts{display:flex;gap:34px;margin-top:44px;flex-wrap:wrap}
.hero-fact b{font-size:1.7rem;display:block;line-height:1}
.hero-fact span{font-size:13px;opacity:.8}

/* C · Moderno: composizione asimmetrica, testo a sinistra, visuale a destra */
.layout-modern .hero{min-height:100vh;padding:110px 0 70px}
.layout-modern .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(24px,5vw,70px);align-items:center;position:relative}
.layout-modern .hero-title{font-size:clamp(3rem,9vw,6.6rem);font-weight:800;text-transform:uppercase;letter-spacing:-.035em;line-height:.95}
.layout-modern .hero-sub{margin:26px 0 34px;max-width:460px;color:var(--muted);font-size:1.1rem}
.layout-modern .hero-cta{justify-content:flex-start}
.hero-visual{position:relative}
.hero-visual::before{content:"";position:absolute;inset:-6% -8%;border:2px solid var(--accent);border-radius:50%;opacity:.35;animation:spin 40s linear infinite}
.hero-img-tilt{position:relative;z-index:2;border-radius:24px;overflow:hidden;transform:rotate(3deg);box-shadow:var(--shadow);aspect-ratio:4/5}
.hero-img-tilt img{width:100%;height:100%;object-fit:cover}
.hero-img-tilt::after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,transparent 55%,color-mix(in srgb,var(--accent) 26%,transparent))}
.hero-stamp{position:absolute;z-index:3;right:-4%;top:6%;background:var(--accent);color:var(--on-accent);padding:10px 18px;border-radius:999px;font-size:13px;font-weight:700;box-shadow:var(--shadow-sm);transform:rotate(4deg)}
.hero-stats{display:flex;gap:26px;margin-top:40px;flex-wrap:wrap}
.hero-stats div{border-left:3px solid var(--accent);padding-left:14px}
.hero-stats b{font-size:1.5rem;display:block}
.hero-stats span{font-size:12.5px;color:var(--muted)}

/* ---------- 5. ABOUT ---------- */
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,64px);align-items:center}
.about-media{border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
.about-media img{width:100%;aspect-ratio:4/3;object-fit:cover}
.about-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:26px}
.about-facts div{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-s);padding:16px;text-align:center}
.about-facts b{font-size:1.4rem;color:var(--accent);display:block}
.about-facts span{font-size:12.5px;color:var(--muted)}
.layout-essential .about-grid{grid-template-columns:1fr;max-width:780px;margin-inline:auto;text-align:center}
.layout-essential .about-facts{max-width:560px;margin-inline:auto}
.layout-modern .about-media{transform:rotate(-2deg);border-radius:24px 8px 24px 8px}
.layout-modern .about-media:first-child{transform:rotate(2deg)}
.layout-modern .about-num{font-size:clamp(4rem,10vw,7rem);font-weight:800;color:transparent;-webkit-text-stroke:2px var(--accent);line-height:1;margin-bottom:8px}

/* ---------- 6. MENU BASE (senza funzioni extra) ---------- */
.menu-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.dish-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:transform .3s var(--ease),box-shadow .3s var(--ease)}
.dish-card:hover{transform:translateY(-6px);box-shadow:var(--shadow)}
.dish-card img{width:100%;aspect-ratio:16/10;object-fit:cover}
.dish-body{padding:20px}
.dish-body h3{font-size:1.15rem;margin-bottom:6px}
.dish-body p{font-size:.92rem;color:var(--muted)}
.layout-essential .menu-grid{grid-template-columns:repeat(3,1fr)}
.layout-modern .menu-list{display:grid;gap:0}
.layout-modern .menu-row{display:grid;grid-template-columns:64px 1fr auto;gap:22px;align-items:baseline;padding:24px 0;border-bottom:1px solid var(--border)}
.layout-modern .menu-row:last-child{border-bottom:none}
.layout-modern .menu-row i{font-style:normal;font-size:1.6rem;font-weight:800;color:var(--accent);opacity:.6}
.layout-modern .menu-row h3{font-size:1.25rem;margin-bottom:4px;font-weight:700}
.layout-modern .menu-row p{color:var(--muted);font-size:.9rem;max-width:520px}
.layout-modern .menu-row span.tag{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);padding:4px 12px;border-radius:999px;white-space:nowrap}

/* ---------- 7. MENU DIGITALE INTERATTIVO (funzione) ---------- */
.dm-toolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:30px}
.dm-filters{display:flex;gap:10px;flex-wrap:wrap}
.dm-chip{padding:.55rem 1.25rem;border-radius:999px;border:1.5px solid var(--border);background:var(--surface);font-size:13.5px;font-weight:600;color:var(--muted);transition:.22s}
.dm-chip:hover{border-color:var(--accent);color:var(--accent)}
.dm-chip.is-active{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.dm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.dish{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;cursor:pointer;transition:transform .28s var(--ease),box-shadow .28s var(--ease);position:relative}
.dish:hover{transform:translateY(-6px);box-shadow:var(--shadow)}
.dish img{width:100%;aspect-ratio:1/1;object-fit:cover;transition:transform .4s var(--ease)}
.dish:hover img{transform:scale(1.06)}
.dish-body{padding:14px 16px 16px}
.dish-body h3{font-size:1rem;margin-bottom:4px}
.dish-body p{font-size:.82rem;color:var(--muted)}
.dish-tags{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.dish-tags span{font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:var(--bg-alt);color:var(--accent);border:1px solid var(--border)}
.dish .pop{position:absolute;top:10px;left:10px;background:var(--accent);color:var(--on-accent);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;z-index:2}
.dm-hint{text-align:center;margin-top:26px;font-size:13px;color:var(--muted)}

/* ---------- 8. MODAL / LIGHTBOX ---------- */
.modal{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;place-items:center;z-index:80;padding:22px}
.modal.open{display:grid;animation:fade .25s ease}
.modal-card{background:var(--surface);color:var(--text);max-width:540px;width:100%;border-radius:20px;overflow:hidden;box-shadow:var(--shadow);animation:pop .32s var(--ease)}
.modal-card img{width:100%;aspect-ratio:16/9;object-fit:cover}
.modal-body{padding:24px}
.modal-close{position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.9);color:#111;font-size:16px;z-index:5;display:grid;place-items:center}
.modal-close .ico{width:18px;height:18px}
.modal-close:hover{transform:scale(1.08)}
.modal-title{font-size:1.4rem;margin-bottom:8px}
.modal-desc{color:var(--muted);margin-bottom:14px}

/* ---------- 9. PRENOTAZIONE ONLINE (funzione) ---------- */
.booking-wrap{display:grid;grid-template-columns:1fr 1fr;gap:clamp(26px,5vw,60px);align-items:stretch}
.booking-info h2{font-size:clamp(1.8rem,3.6vw,2.6rem);margin-bottom:16px}
.booking-info ul{list-style:none;margin-top:22px;display:grid;gap:14px}
.booking-info li{display:flex;gap:12px;align-items:flex-start;color:var(--muted);font-size:.95rem}
.booking-info li b{color:var(--text)}
.form-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:clamp(22px,4vw,34px);box-shadow:var(--shadow-sm)}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.field{margin-bottom:16px;display:flex;flex-direction:column;gap:6px}
.field label{font-size:13px;font-weight:600}
.field input,.field select,.field textarea{padding:12px 14px;border:1.5px solid var(--border);border-radius:var(--radius-s);background:var(--bg);color:var(--text);font-size:15px;transition:border-color .2s,box-shadow .2s;width:100%}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}
.field .err{font-size:12px;color:#d64545;display:none}
.field.invalid input,.field.invalid select,.field.invalid textarea{border-color:#d64545}
.field.invalid .err{display:block}
.form-ok{display:none;text-align:center;padding:30px 16px}
.form-ok .ok-ico{font-size:3rem;margin-bottom:10px}
.form-ok h3{font-size:1.3rem;margin-bottom:8px}

/* ---------- 10. EVENTI (pagina extra) ---------- */
.events-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.event-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:transform .3s var(--ease),box-shadow .3s var(--ease);position:relative}
.event-card:hover{transform:translateY(-6px);box-shadow:var(--shadow)}
.event-card img{width:100%;aspect-ratio:16/9;object-fit:cover}
.event-body{padding:22px}
.event-date{display:inline-block;background:var(--accent);color:var(--on-accent);font-size:12px;font-weight:700;border-radius:999px;padding:5px 14px;margin-bottom:12px}
.event-body h3{font-size:1.15rem;margin-bottom:8px}
.event-body p{font-size:.92rem;color:var(--muted)}
.event-card.is-live::after{content:"PROSSIMO EVENTO";position:absolute;top:12px;right:12px;background:var(--text);color:var(--bg);font-size:10px;font-weight:700;letter-spacing:.06em;padding:5px 10px;border-radius:999px}

/* ---------- 11. BLOG (funzione) ---------- */
.blog-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.post-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:transform .3s var(--ease),box-shadow .3s var(--ease);cursor:pointer}
.post-card:hover{transform:translateY(-6px);box-shadow:var(--shadow)}
.post-card img{width:100%;aspect-ratio:16/10;object-fit:cover}
.post-body{padding:20px}
.post-meta{display:flex;gap:12px;font-size:12px;color:var(--muted);margin-bottom:10px}
.post-body h3{font-size:1.08rem;line-height:1.3;margin-bottom:8px}
.post-body h3:hover{color:var(--accent)}
.post-body p{font-size:.88rem;color:var(--muted)}

/* ---------- 12. GALLERIA + LIGHTBOX (funzione) ---------- */
.gal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.gal-item{position:relative;border-radius:var(--radius-s);overflow:hidden;cursor:pointer;aspect-ratio:1/1}
.gal-item img{width:100%;height:100%;object-fit:cover;transition:transform .45s var(--ease)}
.gal-item:hover img{transform:scale(1.1)}
.gal-item::after{content:"+";position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.35);color:#fff;font-size:1.6rem;opacity:0;transition:opacity .25s}
.gal-item:hover::after{opacity:1}
.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:90;display:none;place-items:center;padding:20px}
.lightbox.open{display:grid;animation:fade .25s}
.lightbox img{max-width:min(92vw,900px);max-height:80vh;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5);object-fit:contain}
.lb-btn{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:22px;transition:.2s}
.lb-btn:hover{background:rgba(255,255,255,.28)}
.lb-prev{left:16px}.lb-next{right:16px}
.lb-close{position:absolute;top:18px;right:18px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:16px}
.lb-count{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);color:#fff;font-size:14px;letter-spacing:.1em}
.lb-cap{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);color:#fff;font-size:15px;font-weight:600;letter-spacing:.02em;background:rgba(0,0,0,.45);padding:6px 16px;border-radius:999px;max-width:min(80vw,600px);text-align:center}

/* ---------- 13. FEED SOCIAL (funzione) ---------- */
.social-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
.social-item{position:relative;aspect-ratio:1/1;border-radius:10px;overflow:hidden}
.social-item img{width:100%;height:100%;object-fit:cover;transition:transform .4s var(--ease),filter .4s var(--ease)}
.social-item:hover img{transform:scale(1.12);filter:brightness(.75)}
.social-item::after{content:"\\2665";position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:1.4rem;opacity:0;transition:opacity .25s}
.social-item:hover::after{opacity:1}
.social-cta{text-align:center;margin-top:28px}

/* ---------- 14. QR CODE (funzione) ---------- */
.qr-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:34px;align-items:center;max-width:820px;margin-inline:auto}
.qr-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:26px;display:grid;place-items:center;box-shadow:var(--shadow-sm);position:relative}
.qr-card svg{width:200px;height:200px;color:var(--text)}
.qr-caption{text-align:center;margin-top:12px}
.qr-caption b{display:block;font-size:1.1rem;margin-bottom:4px}
.qr-caption span{color:var(--muted);font-size:.9rem}

/* ---------- 15. GOOGLE BUSINESS PROFILE (funzione) ---------- */
.gbp-card{max-width:460px;margin-inline:auto;background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:var(--shadow)}
.gbp-head{display:flex;align-items:center;gap:14px;padding:18px 20px;border-bottom:1px solid var(--border)}
.gbp-logo{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--on-accent);font-weight:800}
.gbp-head b{display:block}
.gbp-stars{color:#f5a623;font-size:15px}
.gbp-actions{display:flex;gap:8px;margin-top:8px}
.gbp-actions span{font-size:11px;color:var(--accent);font-weight:600;background:color-mix(in srgb,var(--accent) 10%,transparent);padding:4px 10px;border-radius:999px}
.gbp-body{padding:20px;display:grid;gap:14px}
.gbp-row{display:flex;gap:12px;align-items:flex-start;font-size:.92rem;color:var(--muted)}
.gbp-row b{color:var(--text);font-weight:600}
.gbp-map{position:relative;border-radius:14px;overflow:hidden;height:150px;background:
  repeating-linear-gradient(45deg,color-mix(in srgb,var(--accent) 10%,var(--bg)) 0 12px,transparent 12px 24px),
  color-mix(in srgb,var(--accent) 7%,var(--bg));display:grid;place-items:center}
.gbp-pin{font-size:2rem;animation:bob 2.4s ease-in-out infinite}
.gbp-reviews{display:grid;gap:12px}
.gbp-rev{display:flex;gap:10px;align-items:flex-start;font-size:.85rem;color:var(--muted);background:var(--bg-alt);padding:12px;border-radius:12px}
.gbp-rev b{color:var(--text)}

/* ---------- 16. TOOLTIP (usato dal copywriting) ---------- */
.tip{position:relative}
.tip-box{position:absolute;bottom:calc(100% + 12px);left:0;width:250px;padding:14px 16px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:12px;font-size:12.5px;line-height:1.5;opacity:0;pointer-events:none;transform:translateY(6px);transition:.25s var(--ease);box-shadow:var(--shadow);z-index:70;font-weight:400}
.tip:hover .tip-box{opacity:1;transform:none}

/* ---------- 17. COPYWRITING (funzione) ---------- */
.cw-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:920px;margin-inline:auto}
.cw-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:26px}
.cw-card h3{font-size:1rem;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.cw-plain{color:var(--muted);opacity:.75;font-style:italic;line-height:1.7}
.cw-pro{line-height:1.75;font-size:1.02rem}
.cw-pro b{color:var(--accent)}
.cw-pro .hl{background:color-mix(in srgb,var(--accent) 16%,transparent);border-radius:4px;padding:0 4px;cursor:help;position:relative}
.cw-plain-tag{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:var(--bg-alt);padding:4px 12px;border-radius:999px}
.cw-pro-tag{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--on-accent);background:var(--accent);padding:4px 12px;border-radius:999px}
.cw-pro-tag .ico{width:11px;height:11px}

/* ---------- 18. IDENTITÀ VISIVA / LOGO (funzione) ---------- */
.logo-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:860px;margin-inline:auto}
.logo-card{border-radius:var(--radius);padding:clamp(26px,5vw,44px);display:grid;place-items:center;min-height:230px;transition:transform .3s var(--ease)}
.logo-card:hover{transform:translateY(-5px)}
.logo-card.light{background:var(--surface);border:1px solid var(--border)}
.logo-card.dark{background:var(--text);color:var(--bg)}
.logo-mark{display:flex;align-items:center;gap:14px}
.logo-square{width:64px;height:64px;border-radius:16px;display:grid;place-items:center;font-weight:800;font-size:24px;background:var(--accent);color:var(--on-accent);box-shadow:0 10px 22px -8px var(--accent)}
.logo-card.dark .logo-square{background:var(--accent)}
.logo-type{line-height:1}
.logo-type b{font-size:22px;display:block;letter-spacing:-.02em}
.logo-type span{font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.7}
.logo-cap{text-align:center;margin-top:16px;font-size:12.5px;color:var(--muted)}

/* ---------- 19. BEFORE / AFTER SLIDER (foto, editing, revisione) ---------- */
.ba{position:relative;overflow:hidden;border-radius:var(--radius);user-select:none;touch-action:none;box-shadow:var(--shadow)}
.ba .ba-b, .ba .ba-t{width:100%;height:100%}
.ba .ba-b img, .ba .ba-t img{width:100%;height:100%;object-fit:cover;display:block}
.ba .ba-t{position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--p,50%)) 0 0)}
.ba > input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize;z-index:4}
.ba::after{content:"";position:absolute;top:0;bottom:0;left:var(--p,50%);width:2px;background:#fff;box-shadow:0 0 10px rgba(0,0,0,.5);transform:translateX(-50%);z-index:3}
.ba::before{content:"\\2190 \\2192";position:absolute;top:50%;left:var(--p,50%);transform:translate(-50%,-50%);background:#fff;color:#222;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:11px;z-index:5;box-shadow:0 6px 16px rgba(0,0,0,.3);pointer-events:none}
.ba .ba-tag{position:absolute;top:12px;padding:5px 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;z-index:6}
.ba .ba-tag.before{left:12px;background:rgba(0,0,0,.6);color:#fff}
.ba .ba-tag.after{right:12px;background:var(--accent);color:var(--on-accent)}
.ba-note{text-align:center;margin-top:18px;font-size:13.5px;color:var(--muted);max-width:560px;margin-inline:auto}
.ba-note b{color:var(--text)}

/* Mockup per il confronto "prima/dopo" del sito */
.mock{position:absolute;inset:0}
.mock-old{background:#e8e8ea;display:flex;flex-direction:column;gap:10px;padding:24px}
.mock-old .m-bar{height:26px;border-radius:6px;background:#bdbdc4}
.mock-old .m-hero{flex:1;border-radius:8px;background:#c9c9d1}
.mock-old .m-row{height:22px;border-radius:6px;background:#c9c9d1}
.mock-new{background:var(--bg)}
.mock-new .m-top{height:34px;background:var(--text);display:flex;align-items:center;gap:8px;padding:0 20px}
.mock-new .m-logo{width:18px;height:18px;border-radius:5px;background:var(--accent)}
.mock-new .m-line{height:6px;width:46px;border-radius:3px;background:color-mix(in srgb,var(--bg) 60%,transparent)}
.mock-new .m-hero2{height:46%;background:linear-gradient(120deg,var(--accent),color-mix(in srgb,var(--accent) 55%,var(--text)));display:grid;place-items:center}
.mock-new .m-title{color:var(--on-accent);font-size:13px;font-weight:800;letter-spacing:.1em}
.mock-new .m-cards{display:flex;gap:8px;padding:14px 20px;flex:1}
.mock-new .m-card{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:8px}

/* ---------- 20. CONTATTI ---------- */
.contact-grid{display:grid;grid-template-columns:1fr 1.15fr;gap:clamp(28px,5vw,60px);align-items:start}
.contact-info h2{font-size:clamp(1.8rem,3.6vw,2.6rem);margin-bottom:18px}
.c-list{list-style:none;display:grid;gap:16px;margin-top:24px}
.c-list li{display:flex;gap:14px;align-items:flex-start}
.c-ico{width:44px;height:44px;flex:none;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);font-size:18px}
.c-list b{display:block;font-size:15px}
.c-list span{color:var(--muted);font-size:.92rem}
.hours{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:20px;font-size:.9rem}
.hours div{padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;display:flex;justify-content:space-between}
.hours b{color:var(--accent);font-weight:600}

/* ---------- 21. TRUST BAR (sempre visibile) ---------- */
.trust-bar{position:relative;z-index:5;margin-top:-46px;padding:0 22px}
.layout-essential .trust-bar{margin-top:0;padding:0}
.trust-row{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:space-between;gap:22px;padding:15px 26px;flex-wrap:wrap}
.layout-essential .trust-row{background:transparent;border:none;box-shadow:none;justify-content:center;gap:14px;padding:10px 0}
.trust-item{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--muted)}
.trust-item b{color:var(--text);font-size:14px}
.stars{display:inline-flex;gap:2px;color:#e0a62c;font-size:13px}
.trust-div{width:1px;height:26px;background:var(--border);flex:none}
.layout-essential .trust-div{display:none}
.badge{font-size:11.5px;font-weight:700;letter-spacing:.04em;padding:6px 13px;border-radius:999px;background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 32%,transparent)}

/* ---------- 22. FOOTER ---------- */
.footer{background:var(--text);color:var(--bg);padding:clamp(48px,7vw,72px) 0 0;margin-top:40px}
.layout-classic .footer{background:var(--surface);color:var(--text);border-top:1px solid var(--border)}
.foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1.2fr;gap:34px;padding-bottom:44px}
.foot-brand b{font-size:1.25rem;display:flex;align-items:center;gap:10px;margin-bottom:14px}
.foot-brand .mark{width:34px;height:34px;border-radius:9px;background:var(--accent);color:var(--on-accent);display:grid;place-items:center;font-weight:800;font-size:13px}
.foot-brand p{font-size:.92rem;opacity:.75;max-width:280px}
.foot-grid h4{font-size:.95rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:16px}
.foot-grid ul{list-style:none;display:grid;gap:10px}
.foot-grid a{font-size:.92rem;opacity:.75;transition:.2s}
.foot-grid a:hover{opacity:1;color:var(--accent)}
.foot-brand .foot-map{width:min(220px,100%);margin-top:18px;opacity:.85}
.foot-map svg{width:100%;height:auto;display:block;border-radius:12px}
.foot-social{display:flex;gap:9px;margin-top:18px}
.foot-social a{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--bg) 12%,transparent);border:1px solid color-mix(in srgb,var(--bg) 18%,transparent);font-size:16px;opacity:.85;transition:.2s}
.foot-social a:hover{opacity:1;background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.foot-bottom{border-top:1px solid color-mix(in srgb,var(--bg) 18%,transparent);padding:18px 0;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;font-size:13px;opacity:.7}
.layout-classic .foot-bottom{border-color:var(--border)}

/* ---------- 23. ANIMAZIONI ---------- */
/* Micro-animazione di ingresso sempre attiva (anche senza pacchetto
   animazioni): fade + scivolamento breve e discreto. Le animazioni a
   pagamento (fx-anim) si sommano sopra senza conflitti. */
@keyframes baseIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.site-header{animation:baseIn .4s var(--ease) both}
.hero{animation:baseIn .42s var(--ease) .06s both}
.trust-bar{animation:baseIn .4s var(--ease) .12s both}
.footer{animation:baseIn .4s var(--ease) .18s both}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-24px) scale(1.08)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes wa-pulse{0%{transform:scale(1);opacity:.8}70%{transform:scale(1.45);opacity:0}100%{opacity:0}}
.fx-canvas{position:fixed;inset:0;z-index:0;pointer-events:none}
.fx-anim .hero,.fx-anim .section-head,.fx-anim section{position:relative;z-index:1}
.fx-anim .reveal{opacity:0;transform:translateY(28px);transition:opacity .8s var(--ease),transform .8s var(--ease)}
.fx-anim .reveal.in{opacity:1;transform:none}
.fx-anim .reveal-d1{transition-delay:.1s}.fx-anim .reveal-d2{transition-delay:.2s}.fx-anim .reveal-d3{transition-delay:.3s}

/* ---------- 24. ICONE SVG + NUOVE SEZIONI (testimonianze, numeri, prenota flottante) ---------- */
.ico{width:1em;height:1em;vertical-align:-.12em;flex:none;display:inline-block}
.fx-tag .ico{width:11px;height:11px}
.nav-toggle .ico{width:20px;height:20px}
.scroll-hint .ico{width:26px;height:26px}
.lb-btn .ico{width:24px;height:24px}
.lb-close .ico{width:18px;height:18px}
.c-ico .ico,.b-ico .ico{width:20px;height:20px}
.foot-social a .ico{width:17px;height:17px}
.gbp-pin{display:grid;place-items:center;color:var(--accent)}
.gbp-pin .ico{width:38px;height:38px}

/* Numeri / statistiche */
.stats{padding:clamp(36px,5vw,60px) 0}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;text-align:center}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px 16px;display:grid;gap:6px;justify-items:center;box-shadow:var(--shadow-sm)}
.stat-kicker{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}
.stat-num{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800;color:var(--accent);line-height:1;font-variant-numeric:tabular-nums}
.stat>span{font-size:13px;color:var(--muted)}

/* Testimonianze */
.testimonials-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;max-width:1080px;margin-inline:auto}
.testimonial-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;display:flex;flex-direction:column;gap:16px;box-shadow:var(--shadow-sm);transition:transform .3s var(--ease),box-shadow .3s var(--ease)}
.testimonial-card:hover{transform:translateY(-6px);box-shadow:var(--shadow)}
.testimonial-card .stars{font-size:15px}
.testimonial-card blockquote{font-size:.98rem;line-height:1.7;color:var(--text);font-style:italic}
.testimonial-card figcaption{display:flex;align-items:center;gap:12px;margin-top:auto}
.t-ava{width:46px;height:46px;border-radius:50%;object-fit:cover}
.testimonial-card figcaption b{display:block;font-size:14.5px}
.testimonial-card figcaption em{font-style:normal;font-size:12.5px;color:var(--muted)}

/* Pulsante Prenota flottante */
.book-float{position:fixed;right:22px;bottom:22px;z-index:50;display:inline-flex;align-items:center;gap:9px;padding:14px 22px;border-radius:999px;background:var(--accent);color:var(--on-accent);font-weight:700;font-size:15px;box-shadow:0 14px 30px -10px var(--accent);transition:transform .25s var(--ease),box-shadow .25s var(--ease)}
.book-float:hover{transform:translateY(-3px);box-shadow:0 18px 36px -12px var(--accent)}
.book-float .ico{width:17px;height:17px}

/* Pulsante WhatsApp flottante (a sinistra per non sovrapporsi al Prenota) */
.wa-float{position:fixed;left:22px;bottom:22px;z-index:50;width:58px;height:58px;border-radius:50%;background:#25D366;color:#fff;display:grid;place-items:center;box-shadow:0 14px 30px -10px rgba(37,211,102,.8);transition:transform .25s var(--ease)}
.wa-float:hover{transform:scale(1.08)}
.wa-float .ico{width:30px;height:30px}
.wa-float .wa-tip{position:absolute;left:calc(100% + 14px);top:50%;transform:translateY(-50%) translateX(-6px);background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow);font-size:12.5px;font-weight:700;white-space:nowrap;padding:9px 14px;border-radius:999px;opacity:0;pointer-events:none;transition:.25s var(--ease)}
.wa-float:hover .wa-tip{opacity:1;transform:translateY(-50%)}
.wa-float::before{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(37,211,102,.55);animation:wa-pulse 2.2s ease-out infinite}

/* Mappa interattiva */
.map-card{max-width:880px;margin-inline:auto;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
.map-canvas{position:relative;height:340px;overflow:hidden;background:var(--bg-alt)}
.map-canvas svg{width:100%;height:100%;display:block;transition:transform .35s var(--ease);transform-origin:50% 55%}
.map-pin{position:absolute;left:50%;top:52%;transform:translate(-50%,-100%);display:grid;place-items:center;color:var(--accent);transition:transform .35s var(--ease);transform-origin:50% 100%}
.map-pin .ico{width:46px;height:46px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.3))}
.map-pin-label{position:absolute;top:-42px;left:50%;transform:translateX(-50%);background:var(--text);color:var(--bg);font-size:11.5px;font-weight:700;white-space:nowrap;padding:5px 12px;border-radius:999px;box-shadow:var(--shadow-sm)}
.map-pin-label::after{content:"";position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--text)}
.map-zoom{position:absolute;right:14px;bottom:14px;z-index:3;display:flex;flex-direction:column;gap:6px}
.map-zoom button{width:38px;height:38px;border-radius:11px;background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow-sm);display:grid;place-items:center;transition:.2s}
.map-zoom button:hover{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.map-zoom .ico{width:17px;height:17px}
.map-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 20px;flex-wrap:wrap;border-top:1px solid var(--border)}
.map-addr{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font-size:.92rem}
.map-addr .ico{width:15px;height:15px;color:var(--accent)}

/* Blog: avatar autore */
.post-meta{align-items:center}
.post-ava{width:30px;height:30px;border-radius:50%;object-fit:cover;flex:none}
.post-author{font-weight:700;color:var(--text)}

/* Stato di focus visibile e blocco neutro prima del caricamento delle foto */
:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 75%,transparent);outline-offset:2px;border-radius:8px}
.img-pal{background:color-mix(in srgb,var(--bg-alt) 55%,transparent)}

/* ---------- 24. RESPONSIVE (anche dentro il frame mobile) ---------- */
@media (max-width:1000px){
  .menu-grid,.dm-grid,.events-grid,.blog-grid{grid-template-columns:repeat(2,1fr)}
  .gal-grid{grid-template-columns:repeat(3,1fr)}
  .social-grid{grid-template-columns:repeat(3,1fr)}
  .foot-grid{grid-template-columns:1fr 1fr}
  .testimonials-grid{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:820px){
  .nav-toggle{display:inline-flex}
  .nav-links{position:fixed;inset:0 0 auto;top:72px;background:var(--surface);flex-direction:column;align-items:stretch;padding:22px;gap:6px;border-radius:0 0 20px 20px;box-shadow:var(--shadow);transform:translateY(-130%);transition:transform .35s var(--ease);z-index:39}
  .nav-open .nav-links{transform:none}
  .nav-links a{padding:13px 10px;font-size:1rem;border-radius:10px}
  .nav-links a:hover{background:var(--bg-alt);color:var(--accent)}
  .nav-links a.is-cta{background:var(--accent);color:var(--on-accent);text-align:center}
  .layout-modern .nav-links{background:var(--text);color:var(--bg)}
  .layout-modern .nav-links a.is-cta{color:var(--on-accent)}
  .hero-grid,.about-grid,.booking-wrap,.contact-grid,.qr-grid{grid-template-columns:1fr}
  .dm-grid{grid-template-columns:repeat(2,1fr)}
  .gal-grid{grid-template-columns:repeat(2,1fr)}
  .social-grid{grid-template-columns:repeat(3,1fr)}
  .cw-grid,.logo-grid{grid-template-columns:1fr}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .layout-modern .hero{min-height:auto;padding:90px 0 60px}
  .hero-visual{margin-top:10px}
  .trust-bar{margin-top:-30px;padding:0 14px}
  .trust-row{justify-content:center;gap:14px}
  .trust-div{display:none}
  .foot-grid{grid-template-columns:1fr;gap:26px}
  .form-row{grid-template-columns:1fr}
  .layout-modern .menu-row{grid-template-columns:44px 1fr}
  .layout-modern .menu-row span.tag{display:none}
}
@media (max-width:480px){
  .dm-grid{grid-template-columns:1fr}
  .menu-grid{grid-template-columns:1fr}
  .events-grid,.blog-grid,.testimonials-grid{grid-template-columns:1fr}
  .about-facts{grid-template-columns:1fr}
  .hero-cta{flex-direction:column;align-items:stretch}
  .hero-cta .btn{width:100%}
}
`;
