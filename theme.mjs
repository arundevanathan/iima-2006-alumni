// The old 'IIMA Title' (a DejaVu Serif Bold subset) is retired: Kal · Aaj · Aur Kal is now Source Serif 4 at display optical size.

// Self-hosted faces (see fonts.mjs). Source Serif 4 and Source Sans 3 share a skeleton and x-height (0.475 / 0.478), so
// serif and sans sit together on one line; Plex Mono stamps registry data.
// The two "Fallback" faces resize local Times New Roman / Arial to the web fonts' measured widths and line metrics,
// so text does not reflow when the real fonts arrive.
export const fontFaces = `@font-face{font-family:'Source Serif 4';src:url(/fonts/source-serif-4.woff2) format('woff2');font-weight:400 750;font-style:normal;font-display:swap}
@font-face{font-family:'Source Serif 4';src:url(/fonts/source-serif-4-italic.woff2) format('woff2');font-weight:400 700;font-style:italic;font-display:swap}
@font-face{font-family:'Source Sans 3';src:url(/fonts/source-sans-3.woff2) format('woff2');font-weight:400 700;font-style:normal;font-display:swap}
@font-face{font-family:'IBM Plex Mono';src:url(/fonts/plex-mono-500.woff2) format('woff2');font-weight:400 600;font-display:swap}
@font-face{font-family:'Source Serif 4 Fallback';src:local('Times New Roman'),local('TimesNewRomanPSMT'),local('Liberation Serif'),local('Tinos');size-adjust:109.96%;ascent-override:94.22%;descent-override:30.47%;line-gap-override:0.00%}
@font-face{font-family:'Source Sans 3 Fallback';src:local('Arial'),local('ArialMT'),local('Liberation Sans'),local('Arimo');size-adjust:93.01%;ascent-override:110.09%;descent-override:43.01%;line-gap-override:0.00%}`;

// Design tokens: the "Kahn system". Brick carries structure; lime, paper and concrete carry the rest.
export const tokens = `:root{color-scheme:light;
--brick:#8e3e30;--brick-deep:#6b2b21;--brick-fired:#b4583f;--brick-wash:#f3e4dc;--on-brick:#fff;
--lime:#f4efe6;--paper:#fffcf6;--tile:#fffcf6;--tint:#f3ebe0;--concrete:#b8b2a7;--line:#e6ded2;
--ink:#211e1b;--muted:#5f5a52;--night:#1c1816;--ochre:#c08a3e;--on-photo:#fffcf6;
--serif:'Source Serif 4','Source Serif 4 Fallback',Georgia,serif;--sans:'Source Sans 3','Source Sans 3 Fallback',system-ui,sans-serif;--mono:'IBM Plex Mono',ui-monospace,monospace;
--r:4px;--r-sm:2px}
/* LKP at night: the default. Every text pair here is at least 4.5:1 (brick on wash 5.7, muted on card 7.0). */
:root[data-theme=dark]{color-scheme:dark;
--brick:#e39079;--brick-deep:#f2b6a2;--brick-fired:#c96a50;--brick-wash:#3b2722;--on-brick:#1c1816;
--lime:#1c1816;--paper:#26211e;--tile:#26211e;--tint:#322a25;--concrete:#5a5048;--line:#3a322c;
--ink:#f3ece2;--muted:#b4aa9e;--night:#141110;--ochre:#c9993f}`;

export const theme = `
body{background:var(--lime)}a{color:inherit;text-decoration:none}a:hover{color:var(--brick)}a,button{transition:background-color .16s,color .16s,box-shadow .16s}
.bar{background:var(--paper);border-bottom:1px solid var(--line)}.bar .mast,main,footer{max-width:1280px;padding-inline:clamp(16px,4vw,52px)}.mast{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 24px}.wordmark{display:flex;align-items:center;gap:10px;font:750 1rem var(--sans)}.wordmark img{width:39px;height:39px;aspect-ratio:1;object-fit:contain;background:white;padding:3px;border-radius:50%}
nav{margin:0;gap:3px;align-items:center}nav a{font-size:.86rem;padding:.48rem .68rem;border-radius:8px}nav a:hover{background:var(--tint)}h1,h2,h3{letter-spacing:-.035em}article,fieldset,.panel{box-shadow:0 6px 24px #26201608;border-radius:16px}article a{font-weight:650}.plain li a:hover,figcaption a:hover{text-decoration:underline}
.home main{padding-top:20px}.home h1{margin:0;font-size:clamp(3.3rem,7.4vw,7rem);font-weight:500;line-height:.94;letter-spacing:-.073em}
.campus-hero{min-height:clamp(390px,47vw,560px);border-radius:27px;overflow:hidden;display:flex;align-items:end;color:#fffaf2;background:#201611 linear-gradient(90deg,#150d0ce8 0%,#160d0c99 37%,#170e1010 75%);background-image:linear-gradient(90deg,#150d0cee 0%,#160d0ca0 39%,#170e1020 78%),url('/campus/arches.webp');background-size:cover;background-position:center 53%;padding:clamp(24px,6vw,72px)}
.campus-hero p{margin:.9rem 0 1.35rem;font-size:1.06rem;color:#f3e4d9}.campus-hero .class-label{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700}.hero-actions{display:flex;flex-wrap:wrap;gap:9px}
.cta{display:inline-flex;align-items:center;min-height:42px;padding:.55rem .88rem;border-radius:9px;font-size:.88rem;font-weight:720;background:var(--paper);color:var(--ink)}.cta:hover{background:var(--paper);color:var(--brick)}.cta.secondary{background:#251916a8;border:1px solid #fff6;color:white;backdrop-filter:blur(8px)}
.home-links,.home-columns,.people-grid{display:grid;gap:16px}.home-links{grid-template-columns:repeat(3,minmax(0,1fr));margin:16px 0 34px}.shortcut{display:flex;flex-direction:column;justify-content:end;min-height:161px;padding:20px;border-radius:17px;background:var(--paper);border:1px solid var(--line);box-shadow:0 8px 24px #24130809}.shortcut strong{font-size:1.18rem}.shortcut small{display:block;font-size:.84rem}.shortcut:hover{box-shadow:0 10px 26px #24130821}.shortcut.image{color:white;background-size:cover;background-position:center;border:0}.shortcut.image small{color:#f3e8e0}.shortcut.steps{background-image:linear-gradient(0deg,#201510f2,#251a1233),url('/campus/steps.webp')}.shortcut.light{background-image:linear-gradient(0deg,#201510f2,#251a1233),url('/campus/light.webp')}
.home-columns{grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);align-items:start;gap:clamp(20px,4vw,48px)}.home-columns section{min-width:0}.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}.section-head a{color:var(--brick);font-weight:700;font-size:.83rem}.section-head h2{margin:.25rem 0 .6rem;font-size:clamp(1.6rem,3vw,2.15rem)}.people-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.person-tile{display:block;background:var(--tile);border:1px solid var(--line);border-radius:14px;overflow:hidden}.person-tile img,.person-tile .initials{aspect-ratio:1.18;object-fit:cover;object-position:center 32%;border-radius:0}.person-tile .initials{display:grid;place-items:center;background:var(--tint);color:var(--muted);font-size:2rem}.person-tile strong{display:block;padding:.55rem .72rem;font-size:.91rem}.home article{margin:.5rem 0 .85rem}.home article .story{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden}.soft-link{display:inline-block;background:var(--tint);padding:.55rem .85rem;border-radius:9px;font-weight:700;font-size:.87rem}.feed-photos img{max-height:238px;object-fit:cover}
@media(max-width:760px){.mast{padding-block:10px}.mast nav{width:100%;overflow-x:auto;flex-wrap:nowrap;white-space:nowrap;padding:2px 2px 5px}.home-columns{grid-template-columns:1fr}.home-links{gap:8px;margin-bottom:25px}.shortcut{min-height:135px;padding:12px}.shortcut strong{font-size:.94rem}.shortcut small{font-size:.75rem}.campus-hero{border-radius:18px;background-position:55% center}.people-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:390px){.home-links{grid-template-columns:1fr}.shortcut{min-height:87px}.people-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}

.alumni-profile{--profile-card:#fffefa;--profile-border:var(--line);max-width:1100px;margin:0 auto 2rem}
.profile-header,.profile-section{background:var(--profile-card);border:1px solid var(--profile-border);border-radius:22px;box-shadow:0 7px 26px #2c1d1208}
.profile-header{overflow:hidden}
.profile-cover{height:clamp(125px,22vw,260px);background:#38251e linear-gradient(110deg,#301b18aa,#42231d12);background-image:linear-gradient(110deg,#301b18a8,#42231d18),url('/campus/steps.webp');background-size:cover;background-position:center 53%}
.profile-identity{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:1.4rem;align-items:center;padding:0 clamp(1rem,3vw,2rem) 1.5rem}
.profile-portrait{position:relative;margin-top:-3.6rem;width:clamp(105px,15vw,177px);aspect-ratio:1;padding:5px;background:var(--profile-card);border-radius:25px;box-shadow:0 8px 24px #23130e28}
.profile-portrait img,.profile-portrait .initials{display:grid;place-items:center;width:100%;height:100%;aspect-ratio:1;object-fit:cover;object-position:center 34%;border-radius:20px;background:var(--tint);color:var(--muted);font-size:clamp(2.5rem,6vw,4.8rem);font-weight:700}
.alumni-profile .profile-name h1{font:750 clamp(1.8rem,4.6vw,3.4rem)/1.07 var(--sans);letter-spacing:-.055em;margin:.65rem 0 .25rem;overflow-wrap:anywhere}
.profile-name p,.profile-pilot,.profile-empty{color:var(--muted);margin:.25rem 0}
.profile-status{display:inline-block;margin-top:.45rem;padding:.22rem .55rem;background:var(--tint);border-radius:99px;font-size:.78rem;font-weight:650}
.profile-actions{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:flex-end;padding-top:.7rem}
.profile-actions a{display:inline-flex;align-items:center;padding:.57rem .82rem;border-radius:9px;font-size:.86rem;font-weight:700;min-height:42px}
.profile-primary{background:var(--brick);color:var(--on-brick)}.profile-primary:hover{background:var(--brick);color:var(--on-brick)}.profile-secondary{border:1px solid var(--profile-border);background:var(--paper)}
.profile-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.8fr);gap:1rem;margin-top:1rem;align-items:start}
.profile-sidebar,.profile-main{display:grid;gap:1rem;min-width:0}.profile-layout-wide{grid-template-columns:minmax(0,1fr)}
.profile-section{padding:clamp(1rem,2.8vw,1.65rem);min-width:0}
.profile-section h2{font:750 clamp(1.15rem,2.4vw,1.45rem)/1.2 var(--sans);letter-spacing:-.035em;margin:0 0 1rem}
.profile-section-head{display:flex;justify-content:space-between;align-items:baseline;gap:.75rem}.profile-section-head a{font-size:.85rem;font-weight:700;color:var(--brick)}
.profile-facts,.profile-entry{margin:0;display:grid;gap:1rem}.profile-facts{grid-template-columns:repeat(auto-fit,minmax(min(115px,100%),1fr))}
.profile-facts dt,.profile-entry dt{font-size:.78rem;color:var(--muted);margin-bottom:.18rem}.profile-facts dd,.profile-entry dd{margin:0}
.profile-entry>div+div{border-top:1px solid var(--profile-border);padding-top:1rem}.profile-entry dd{line-height:1.65}
.profile-photos .photos{grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}.profile-photos img{aspect-ratio:1}.profile-photos figcaption{overflow-wrap:anywhere}
.alumni-profile .profile-memories article{background:var(--paper);box-shadow:none;border-color:var(--profile-border)}.alumni-profile .profile-memories .story{display:block;overflow:visible}
.profile-report{color:var(--muted);font-size:.86rem;margin-top:1rem}
@media(max-width:730px){.profile-identity{grid-template-columns:auto minmax(0,1fr);column-gap:1rem;row-gap:.55rem}.profile-portrait{margin-top:-2rem}.profile-actions{grid-column:1/-1;justify-content:start}.profile-layout{grid-template-columns:1fr}.profile-sidebar{grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))}}

[hidden]{display:none!important}
.wordmark img{width:44px;height:44px;aspect-ratio:auto;object-fit:contain;border-radius:0;padding:0;background:transparent;mix-blend-mode:multiply}
.home:has(.alumni-home) main{max-width:none;padding:0}
.alumni-home{background:#211812;color:#fff7ed}
.alumni-home .campus-hero{min-height:clamp(300px,48svh,440px);border-radius:0;background-position:center;padding:clamp(24px,4vw,60px)}
.alumni-home .hero-actions{margin-top:1.6rem}
.alumni-home .section-head a{color:#ffe1c5}
.home-classmates,.home-memories{padding:clamp(24px,5vw,70px) clamp(16px,6vw,92px);background-size:cover;background-position:center}
.home-classmates{padding-bottom:clamp(12px,2vw,26px);background-image:linear-gradient(120deg,#241813f1,#241813ac),url('/campus/steps.webp')}
.home-memories{padding-top:clamp(12px,2vw,26px);background-image:linear-gradient(120deg,#221a16ed,#221a16b5),url('/campus/light.webp')}
.home-classmates .people-grid{grid-auto-flow:column;grid-auto-columns:clamp(155px,19vw,220px);overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x proximity;padding:4px 4px 9px;scrollbar-width:none}
.home-classmates .people-grid::-webkit-scrollbar{display:none}
.home-classmates .people-grid.is-drifting{scroll-snap-type:none}
.home-classmates .person-tile{scroll-snap-align:start;position:relative;isolation:isolate;min-height:118px;background:#392921;border-color:#fff3;color:#fff}
.home-classmates .person-tile img,.home-classmates .person-tile .initials{aspect-ratio: .84}
.home-classmates .person-tile>div{position:absolute;inset:auto 0 0;padding:.95rem .65rem .55rem;background:linear-gradient(transparent,#19120ff5)}
.home-classmates .person-tile strong,.home-classmates .person-tile small{display:block;padding:0;color:#fff;overflow-wrap:anywhere}
.home-classmates .person-tile small{font-size:.72rem;color:#f8e7d6}
.memory-collage{columns:3;column-gap:clamp(.65rem,2vw,1.25rem)}
.memory-collage .collage-card,.memory-dialog .collage-card{break-inside:avoid;margin:0 0 1rem;padding:0;overflow:hidden;color:var(--ink);background:var(--paper);box-shadow:0 8px 24px #21181116}
.collage-visual{position:relative}
.memory-enlarge{display:block;width:100%;margin:0;padding:0;background:none;color:inherit;border-radius:0;text-align:left}
.memory-enlarge img{width:100%;height:auto;aspect-ratio:auto;object-fit:contain;border-radius:0}
.memory-credit{position:absolute;bottom:.45rem;left:.55rem;max-width:calc(100% - 1rem);padding:.2rem .5rem;border-radius:.4rem;background:#1f1612e8;color:#fff;font-size:.81rem}
.memory-credit:hover{color:#ffe1c5}
.memory-quote{display:block;margin:.85rem .85rem 2.5rem;padding:1.15rem;border:1px solid var(--line);background:var(--tint);font:1.12rem/1.48 var(--serif);white-space:pre-wrap;overflow-wrap:anywhere}
.memory-caption{padding:0 .75rem;white-space:pre-wrap;overflow-wrap:anywhere}
.compact-collage .memory-caption{display:none}
.compact-collage .memory-quote{max-height:9rem;overflow:hidden}
.collage-actions{display:flex;gap:.3rem;align-items:center;padding:.25rem .55rem}
.icon-action{display:inline-grid;place-items:center;width:2.4rem;height:2.4rem;padding:0;margin:0;background:transparent;color:var(--brick);border-radius:50%}
.icon-action:hover,.icon-action[aria-expanded=true]{background:var(--tint)}
.icon-action svg{width:1.25rem;height:1.25rem}
.icon-action[aria-pressed=true] svg{fill:currentColor}
.collage-actions [data-count]{font-size:.8rem}
.memory-inline,.memory-result{padding:.4rem .75rem;color:var(--muted)}
.memory-result:empty{display:none}
.memory-inline textarea{min-height:3rem}
.memory-inline [data-tag-results] button{display:block;margin:.25rem 0}
.memory-dialog{width:min(94vw,860px);max-height:94dvh;border:0;border-radius:16px;padding:.6rem;background:var(--paper)}
.memory-dialog::backdrop{background:#140e0cce}
.memory-dialog>[data-close]{display:grid;margin:0 0 .35rem auto}
.memory-dialog .collage-card{margin:0}
.memory-dialog img{max-height:65dvh;width:100%;height:auto;background:#211812}
.memory-dialog .memory-enlarge{cursor:default}
.editable-field{position:relative;padding-right:1.5rem;min-width:0}
.inline-edit summary{position:absolute;right:0;top:0;margin:0;list-style:none;color:var(--brick);padding:0 .25rem;font-size:1rem}
.inline-edit summary svg{display:block;width:1.1rem;height:1.1rem}
.inline-edit summary::-webkit-details-marker{display:none}
.inline-edit form{margin-top:.65rem}
.profile-portrait [data-upload]{position:absolute;right:8px;top:8px;background:var(--paper);color:var(--brick);box-shadow:0 2px 8px #251a1635}
.profile-portrait [data-edit-status]{position:absolute;top:100%;left:0;z-index:1;background:var(--paper);padding:.2rem;font-size:.8rem}
@media(max-width:850px){.memory-collage{columns:2}}
@media(max-width:490px){.memory-collage{columns:1}}

.bar{position:relative;z-index:10}.bar .mast nav{overflow:visible}.account{z-index:11}
.home-memories .memory-nav{margin:0;gap:.6rem}.home-memories .memory-nav a{padding:.35rem .5rem}
.feed-more{display:table;margin:1.2rem auto;padding:.5rem .85rem;border:1px solid currentColor;border-radius:.5rem}
.memory-collage .text-memory,.memory-dialog .text-memory{background:var(--tint);border-color:var(--line)}
.text-memory .collage-visual{display:flex;flex-direction:column}
.text-memory .memory-credit{position:static;order:-1;max-width:none;background:none;color:#6e3c31;margin:.85rem .85rem 0;padding:.25rem 0 .65rem;border-bottom:1px solid #d8c1aa;border-radius:0}
.memory-credit a{color:inherit}.memory-about{font-weight:500;overflow-wrap:anywhere}
.text-memory .memory-quote{margin:0;padding:1rem .85rem;background:none;border:0;white-space:pre-wrap;overflow:visible;max-height:none}
.icon-action[data-like][aria-pressed=true]{color:var(--brick)}.icon-action[data-like][aria-pressed=true] svg{fill:currentColor}
.compose-dialog{padding:clamp(.85rem,3vw,1.5rem);max-width:590px}.compose-dialog h2{margin:.25rem 0 .8rem}
.memory-targets [data-target-results]{display:flex;flex-wrap:wrap;gap:.35rem}.memory-targets [data-target-results] button{margin:0;background:var(--tint);color:var(--ink)}
[data-topic-chips]{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.45rem}.topic-chip{display:inline-flex;gap:.4rem;align-items:center;background:var(--tint);border-radius:2rem;padding:.15rem .3rem .15rem .65rem;font-size:.88rem;overflow-wrap:anywhere}
.topic-chip button{margin:0;background:transparent;color:var(--brick);padding:.15rem .45rem}
.add-topic{display:flex;gap:.45rem;align-items:center}.add-topic button{flex:none}
.directory-controls:has([name=dorm]){grid-template-columns:2fr 1fr 1fr auto}
@media(max-width:760px){
  .alumni-home .campus-hero{min-height:clamp(270px,55svh,440px);align-items:start;padding-top:clamp(24px,7svh,52px);background-position:center 46%;background-image:linear-gradient(180deg,#160d0cdb,#170e1020),url('/campus/arches.webp')}
  .alumni-home .campus-hero h1{font-size:clamp(2.8rem,11vw,4rem)}
  .bar .mast nav{white-space:normal}.mast nav .account{flex-shrink:0}
  .directory-controls:has([name=dorm]){grid-template-columns:1fr 1fr}
}

.member-site{min-height:100vh;background:var(--lime);isolation:isolate}
.member-site main>h1,.member-site .memory-toolbar,.member-site .feed-more{color:var(--ink)}
.member-site .directory-card{color:var(--ink)}
.member-site main:has(>.alumni-profile)>h1{display:none}
.member-site main:not(:has(>.alumni-home,.alumni-profile,.memory-toolbar,.classmates-directory,.reunion-page)){background:var(--paper);border:1px solid var(--line);border-top:2px solid var(--concrete);margin-block:1.5rem;border-radius:var(--r)}
.member-site main:not(:has(>.alumni-home,.alumni-profile,.memory-toolbar,.classmates-directory))>h1,.member-site .alumni-profile,.member-site .collage-card{color:var(--ink)}
.alumni-profile .profile-report{color:var(--muted)}
.editable-field:has(> .inline-edit[open])>.field-display{display:none}
.editable-field .inline-edit[open] form{margin-top:.3rem}
.profile-rsvp:empty{display:none}.profile-rsvp{margin-top:.25rem}
.profile-rsvp .inline-edit summary{position:static}.profile-rsvp .inline-edit:not([open]){display:inline-block;margin-left:.2rem}
.profile-rsvp:has(.inline-edit[open]) .inline-edit{display:block}
.auto-feed{height:1px;width:1px;overflow:hidden;padding:0;border:0;font-size:0;margin:1rem auto}
.auto-feed:focus-visible{height:auto;width:auto;font-size:1rem;padding:.5rem}
.memory-toolbar{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin-bottom:1.25rem}
.memory-toolbar form{display:flex;align-items:end;gap:.5rem;width:min(34rem,75%)}
.memory-toolbar label{flex:1;margin:0}.memory-toolbar button{margin:0;white-space:nowrap}
.share-memory{display:inline-block;padding:.65rem 1rem;border-radius:.65rem;text-align:center}
.memory-inline [data-comments] p{background:var(--tint);padding:.5rem .75rem;border-radius:.9rem;margin:.35rem 0;white-space:pre-wrap;overflow-wrap:anywhere}
@media(max-width:600px){.memory-toolbar{align-items:stretch;flex-direction:column}.memory-toolbar form{width:100%}.share-memory{align-self:flex-start}}

.classmates-directory .directory-controls{background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:.8rem;padding:.8rem 1rem}
.classmates-directory .directory-controls label{margin:0}
.classmates-directory .directory-controls button{margin:0}
.classmates-directory>p{color:var(--muted)}
[data-feed]>.memory-collage{margin:0}
.profile-memories .memory-collage{columns:2}
.profile-memories .memory-collage .collage-card{margin:0 0 .8rem}
@media(max-width:580px){.profile-memories .memory-collage{columns:1}}

.reunion-title{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .24em;font-family:var(--serif);font-weight:700;line-height:1.06}
.reunion-title [aria-hidden]{color:var(--brick-fired);font-size:.55em}
.featured-note{color:#f4dfd1;margin:0 0 1rem}.featured-note a{color:inherit;text-decoration:underline}
.memory-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(.65rem,2vw,1.25rem);align-items:start}
.memory-column{min-width:0}
.memory-columns .collage-card{margin:0 0 1rem;padding:0;overflow:hidden;color:var(--ink);background:var(--paper);box-shadow:0 8px 24px #21181116}
.memory-columns .text-memory{background:var(--tint);border-color:var(--line)}
.icon-action[data-tooltip]{position:relative}
.icon-action[data-tooltip]::after{content:attr(data-tooltip);position:absolute;bottom:calc(100% + 4px);left:0;z-index:3;pointer-events:none;opacity:0;padding:.23rem .5rem;border-radius:.35rem;background:#291d17;color:#fff9ec;font:650 .75rem/1.4 var(--sans);white-space:nowrap}
.icon-action[data-tooltip]:is(:hover,:focus-visible)::after{opacity:1}
.comment-row{position:relative;padding:.35rem 2rem .35rem .65rem;border-radius:.65rem;background:var(--tint);margin:.4rem 0}
.memory-inline [data-comments] .comment-row p{padding:0;margin:.2rem 0;background:transparent}
.comment-menu{position:absolute;right:.35rem;top:.15rem}
.comment-menu summary{list-style:none;margin:0;border-radius:.35rem;padding:0 .35rem}
.comment-menu summary::-webkit-details-marker{display:none}
.comment-menu>div{position:absolute;right:0;z-index:3;min-width:max-content;padding:.3rem;background:var(--paper);border:1px solid var(--line);border-radius:.55rem;box-shadow:0 6px 20px #2d1c1430}
.comment-menu button{margin:0;font-size:.8rem}
.profile-memories .profile-section-head{flex-wrap:wrap}
.profile-memories .profile-section-head .profile-primary{color:var(--on-brick);padding:.45rem .7rem;border-radius:.55rem}
@media(max-width:850px){.memory-columns{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:490px){.memory-columns{grid-template-columns:minmax(0,1fr)}}

.reunion-page{max-width:70rem;margin:auto;color:var(--ink)}
.reunion-cover{padding:clamp(1.5rem,5vw,3.8rem);border-radius:1rem;color:#fff7ed;
  background:linear-gradient(100deg,#24150ee8,#26160da0),url('/campus/arches.webp') center 53%/cover,#492c24}
.reunion-cover .reunion-title{margin:.3em 0 .2em}
.reunion-cover p:last-child{margin-bottom:0}
.reunion-confirmation,.reunion-section{padding:clamp(1rem,3vw,2rem);border:1px solid var(--line);border-radius:1rem;margin-top:1rem;background:var(--paper)}
.reunion-confirmation{background:var(--paper);border-color:var(--line);border-inline-start:4px solid var(--brick);color:var(--ink)}
.reunion-confirmation strong{font-size:1.25rem}
.reunion-confirmation p{margin:.25rem 0}
.reunion-confirmation a{display:inline-block;margin-top:.3rem}
.reunion-section h2{margin:0 0 .75rem}
.reunion-days details{background:var(--paper);border:1px solid var(--line);border-radius:.7rem;margin:.65rem 0;padding:.65rem 1rem}
.reunion-days summary{font:700 1.22rem var(--serif);color:var(--brick)}
.reunion-days summary time{color:inherit}
.reunion-days summary span{display:block;font:500 .9rem/1.5 var(--sans);margin:.2rem 0 0 1.05rem;color:var(--muted)}
.reunion-timeline{list-style:none;margin:.8rem 0;padding:0}
.reunion-timeline li{display:grid;grid-template-columns:minmax(6rem,9rem) 1fr;gap:.5rem 1rem;padding:.55rem 0;border-top:1px solid var(--line)}
.reunion-timeline li span{font-size:.9rem;color:var(--muted)}
.reunion-timeline small{display:block}
.reunion-group{border:1px solid var(--line);border-radius:.8rem;padding:1rem;margin-top:1rem}
.reunion-group h3{margin:0 0 .65rem}
.reunion-group .editable-field{padding:.45rem 1.55rem .45rem 0;min-width:0}
.reunion-group .inline-edit summary{top:.5rem}
.reunion-group dd{margin:0}
.reunion-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 1rem}
.reunion-page .directory-controls:has([name=dorm]){grid-template-columns:2fr 1fr auto}
@media(max-width:600px){
  .reunion-fields,.reunion-page .directory-controls:has([name=dorm]){grid-template-columns:1fr}
  .reunion-timeline li{grid-template-columns:minmax(5.5rem,30%) 1fr;gap:.65rem}
}


.member-site .bar{background:#20161364;border-bottom:1px solid #fff2;backdrop-filter:blur(12px)}
.member-site .bar .wordmark,.member-site .mast nav>a{color:#fff3e3}
.member-site .wordmark img{background:var(--paper);padding:4px;border-radius:6px;mix-blend-mode:normal}
.member-site .bar .account-menu a{color:var(--brick)}
.reunion-priority,.reunion-missing{background:var(--brick-wash);color:var(--brick-deep);border:1px dashed var(--brick-fired);border-inline-start:4px solid var(--brick);border-radius:var(--r);padding:.7rem .85rem}
.reunion-group .reunion-needs-detail{background:var(--brick-wash);border:1px dashed var(--brick-fired);border-inline-start:3px solid var(--brick);border-radius:var(--r);padding-left:.65rem}
.reunion-needs-detail .field-display{color:var(--brick-deep);font-size:.92rem;font-weight:600}

.member-site .bar{position:sticky;top:0;background:var(--paper);border-bottom:1px solid var(--line);backdrop-filter:none}
.member-site .bar .mast{min-height:52px;padding-block:4px;gap:.5rem;flex-wrap:nowrap}
.member-site .bar .wordmark,.member-site .mast nav a{color:var(--ink)}
.member-site .wordmark img{width:34px;height:34px;background:none;padding:0;border-radius:0;mix-blend-mode:multiply}
.member-site .bar .mast nav{width:auto;margin:0;flex-wrap:nowrap}
.desktop-menu{display:flex;align-items:center}
.mobile-menu{display:none;position:relative}
.mobile-menu summary{font-size:.88rem;font-weight:700;margin:0}
.bar .mobile-menu div{position:absolute;right:0;display:grid;background:var(--paper);border:1px solid var(--line);padding:.35rem;border-radius:.55rem}
.memory-author{padding:.7rem .85rem}
.memory-author a{display:inline-flex;gap:.55rem;align-items:center}
.memory-author a img,.memory-author .initials{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:var(--tint);aspect-ratio:1}
.album-cover{display:block;position:relative}
.memory-tags,.memory-tags details>div{display:flex;align-items:baseline;flex-wrap:wrap;gap:.4rem}
.collage-card .memory-tags{padding:.2rem .8rem .25rem}
.memory-tags a,.memory-tags summary{background:var(--tint);color:var(--brick);border-radius:.45rem;padding:.15rem .5rem;font-size:.83rem}
.memory-tags summary{margin:0}
.memory-detail .memory-tags{margin-top:1rem}
.album-viewer>img{object-fit:contain;max-height:72svh;width:100%;height:auto;aspect-ratio:auto;background:#201611}
.album-viewer>div{display:flex;align-items:center;justify-content:space-between}
.compose-dialog{width:min(42rem,calc(100% - 2rem));padding:1.4rem}
[data-compose] label{font-weight:650}
[data-compose] textarea{min-height:7rem}
.memory-file-picker{background:var(--tint);border:1px dashed var(--line);padding:.65rem .8rem;border-radius:.7rem}
.memory-file-picker input{margin-top:.3rem}
.memory-targets [data-target-results]>div{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;width:100%}
.memory-targets [data-target-results] strong{min-width:5rem;font-size:.82rem}
@media(max-width:650px){
  .member-site .bar .mast{min-height:48px}
  .member-site .wordmark{font-size:.85rem}
  .desktop-menu{display:none}
  .mobile-menu{display:block;margin-right:.3rem}
  .compose-dialog{width:100%;max-width:none;height:100%;max-height:none;margin:0;border-radius:0}
}
.member-site{--mast-height:47px;padding-top:var(--mast-height)}
.member-site .bar{position:fixed;inset:0 0 auto;height:var(--mast-height);background:var(--paper)}
.member-site .bar .mast{min-height:0;height:100%;padding-block:0}
.member-site .bar .wordmark img{width:29px;height:29px}
.member-site .bar .account summary img,.member-site .bar .account summary .initials{width:30px;height:30px}
.member-site .desktop-menu>a{padding-block:.35rem}
.member-site [id]{scroll-margin-top:55px}
.classmates-directory .directory-controls:has([name=section]){grid-template-columns:minmax(12rem,2fr) repeat(3,minmax(6rem,1fr)) auto}
.memory-inline [data-tag-results]>div{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem}
@media(max-width:750px){
 .classmates-directory .directory-controls:has([name=section]){grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:650px){
 .member-site{--mast-height:44px}
 .member-site .bar .wordmark img{width:27px;height:27px}
}

.collage-card:is(.memory-collage *,.memory-columns *,.memory-dialog *){
  background:var(--paper);border:1px solid var(--line);border-radius:14px;
  box-shadow:0 4px 15px #2016110d;color:var(--ink);
}
.collage-card .memory-author{padding:.65rem .85rem}
.collage-card .memory-author a{font-size:.86rem;font-weight:700;color:var(--ink)}
.collage-card .memory-author :is(img,.initials){width:30px;height:30px;flex:none;font-size:.72rem;color:var(--muted)}
.collage-card .collage-visual :is(img,.memory-enlarge){display:block;border-radius:0}
.collage-card .collage-visual img{width:100%;height:auto;aspect-ratio:auto;object-fit:contain}
.album-photo-count{
  position:absolute;right:.65rem;bottom:.65rem;background:#201815e8;color:#fff;
  padding:.22rem .52rem;border-radius:.4rem;font-size:.78rem;font-weight:650;
}
.memory-card-footer{padding:0 .85rem}
.memory-album-title{margin:.75rem 0 .35rem;font:700 1.05rem/1.25 var(--sans);letter-spacing:-.02em;overflow-wrap:anywhere}
.memory-album-title a:hover,.memory-author a:hover{text-decoration:underline}
.collage-card .memory-caption{margin:.65rem 0;padding:0;font-size:.91rem;line-height:1.55;overflow-wrap:anywhere}
.collage-card .memory-tags{padding:.2rem 0 .55rem;gap:.35rem}
.collage-card .memory-tags a,.collage-card .memory-tags summary{
  background:none;color:var(--brick);border-radius:0;padding:0;font-size:.79rem;overflow-wrap:anywhere;
}
.collage-card .memory-tags a:hover,.collage-card .memory-tags summary:hover{text-decoration:underline}
.collage-card .collage-actions{padding:.25rem 0;gap:.6rem;border-top:1px solid var(--line)}
.collage-card .collage-actions .icon-action{width:36px;height:36px;margin:0;color:var(--muted)}
.collage-card .collage-actions .icon-action:hover,.collage-card .collage-actions .icon-action[aria-expanded=true]{background:var(--tint)}
.collage-card .collage-actions [aria-pressed=true]{color:var(--brick)}
.memory-like{display:flex;align-items:center;gap:.16rem}
.memory-like [data-count]:empty{display:none}
.collage-card.text-memory .collage-visual{background:var(--tint)}
.collage-card.text-memory .memory-quote{
  padding:.9rem .85rem;font:1.14rem/1.5 var(--serif);color:var(--ink);
}
.memory-read-more{display:block;margin:0 .85rem .9rem;color:var(--brick);font-size:.83rem;font-weight:650}
.memory-enlarge:has(.memory-read-more) .memory-quote{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:5;overflow:hidden;padding-bottom:0;margin-bottom:.65rem}
.memory-dialog .memory-enlarge:has(.memory-read-more) .memory-quote{display:block;overflow:visible;padding-bottom:.9rem}
.memory-dialog .memory-read-more{display:none}
.photo-queue{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:.55rem;max-height:15rem;overflow:auto;padding:.3rem;margin:.55rem 0}
.photo-queue li{position:relative;min-width:0}
.photo-queue img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:.5rem}
.photo-queue .cover-thumb{display:block;position:relative;width:100%;margin:0;padding:0;border:0;background:none;border-radius:.5rem}
.cover-thumb[aria-pressed=true]{outline:2px solid #963f2c;outline-offset:2px}
.cover-thumb span,.photo-queue .remove-thumb{position:absolute;background:#21160de8;color:white;font-size:.73rem;line-height:1}
.cover-thumb span{bottom:.24rem;left:.24rem;padding:.23rem;border-radius:.25rem}
.photo-queue .remove-thumb{right:.18rem;top:.18rem;margin:0;width:24px;height:24px;padding:0;font-size:1.03rem}
[data-cover-hint]{font-size:.85rem;color:var(--muted)}
.album-panels{margin:1.5rem auto}
.album-photo-panel{overflow:hidden;padding:0;background:var(--paper)}
.album-photo-panel img{width:100%;height:auto;aspect-ratio:auto;object-fit:contain;border-radius:0;background:#211812}
.album-photo-footer{padding:.6rem 1rem}
.album-photo-footer>span{font-size:.83rem;color:var(--muted)}
.album-viewer{width:min(98vw,1320px)}
.album-viewer>img{max-height:79svh}
.then-now-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.then-now-slot{position:relative;min-width:0;background:var(--tint);border-radius:.75rem;padding:.75rem}
.then-now-slot h3{margin:0 0 .55rem}
.then-now-slot img{aspect-ratio:1;object-fit:contain;background:var(--tint)}
.then-now-slot form{position:absolute;top:.4rem;right:.45rem}
.then-now-slot [data-upload]{margin:0}
.notification-bell{margin-inline-end:.55rem;position:relative;display:grid;place-items:center;width:34px;height:34px;padding:5px!important}
.notification-bell svg{width:20px;height:20px}
.notification-bell span{position:absolute;top:0;right:-4px;background:var(--brick);color:var(--on-brick);padding:1px 5px;min-width:17px;border-radius:1rem;font-size:.65rem;text-align:center}
.notification-actions{display:flex;flex-wrap:wrap;gap:.65rem}
.notification-feed{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:1rem;margin-top:1rem}
.notification-card{margin:0;background:var(--paper);padding:0;overflow:hidden}
.notification-card.new{border-inline-start:4px solid var(--brick);background:var(--paper)}
.notification-byline{display:flex;align-items:center;flex-wrap:wrap;justify-content:space-between;gap:.4rem;padding:.75rem .85rem;border-bottom:1px solid var(--line)}
.notification-byline a{display:flex;align-items:center;gap:.5rem}
.notification-byline :is(img,.initials){display:grid;place-items:center;width:30px;height:30px;aspect-ratio:1;border-radius:50%;background:var(--tint);font-size:.7rem}
.notification-preview{display:flex;align-items:center;gap:.85rem;padding:.85rem;color:var(--ink)}
.notification-preview img{width:clamp(100px,14vw,170px);flex:none;aspect-ratio:4/3;object-fit:cover}
.notification-preview div{min-width:0;overflow-wrap:anywhere}
.notification-preview p{margin:.3rem 0;font-size:.88rem;font-weight:400;white-space:pre-wrap}
.notification-album,.notification-open{display:block;font-size:.85rem}
.notification-open{color:var(--brick);margin-top:.45rem;text-decoration:underline}
.notification-preview:hover{background:var(--tint)}

.admin-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:.7rem}
.admin-stats>div{display:grid;gap:.2rem;background:var(--paper);border:1px solid var(--line);border-radius:.6rem;padding:.8rem}
.admin-stats strong{font-size:1.4rem}
.admin-table-wrap{overflow:auto}
.admin-table{width:100%;border-collapse:collapse;background:var(--paper);font-size:.9rem}
.admin-table :is(th,td){text-align:left;padding:.55rem .65rem;border-bottom:1px solid var(--line);vertical-align:top}
.admin-table thead{background:var(--tint)}

/* Shared autocomplete in the composer and on memory cards. */
.member-site :is([data-tag-results],[data-target-results]):not(:empty){
  display:grid;gap:.25rem;max-height:15rem;overflow:auto;background:var(--paper);
  border:1px solid var(--line);border-radius:.65rem;padding:.35rem;margin-top:.35rem
}
.member-site :is([data-tag-results],[data-target-results])>div{display:grid;gap:0}
.member-site :is([data-tag-results],[data-target-results]) strong{
  padding:.35rem .55rem .15rem;font-size:.72rem;color:var(--muted);font-weight:650
}
.member-site :is([data-tag-results],[data-target-results]) button{
  width:100%;margin:0;padding:.4rem .55rem;min-height:38px;text-align:left;
  border-radius:.35rem;background:transparent;color:var(--ink);font-size:.88rem;font-weight:500
}
.member-site :is([data-tag-results],[data-target-results]) button:is(:hover,:focus-visible){background:var(--tint)}
.member-site :is([data-tag-results],[data-target-results]) button:focus-visible{outline-offset:-2px}
.menu-glyph{display:block;width:19px;height:2px;background:currentColor;box-shadow:0 -6px currentColor,0 6px currentColor}
@media(max-width:650px){
  .member-site{--mast-height:48px}
  .member-site .bar .mast{padding-inline:12px}
  .member-site .bar .mast nav{gap:.15rem}
  .member-site .wordmark{gap:.35rem;white-space:nowrap}
  .mobile-menu{margin:0}
  .mobile-menu summary{width:42px;height:44px;display:grid;place-items:center;list-style:none}
  .mobile-menu summary::-webkit-details-marker{display:none}
  .bar .mobile-menu div{min-width:10rem;box-shadow:0 8px 24px #21181226}
  .bar .mobile-menu a,.bar .account-menu a{min-height:44px;display:flex;align-items:center}
  .member-site .bar .notification-bell{margin-inline-end:.15rem;width:39px;height:44px}
  .member-site .bar .account summary{min-width:40px;min-height:44px;display:grid;place-items:center}
  .member-site main{padding: .65rem .8rem 1.2rem}
  .member-site main:not(:has(>.alumni-home,.alumni-profile,.memory-toolbar,.classmates-directory)){margin:.55rem 0}
  .member-site main>h1{font-size:clamp(1.85rem,7.5vw,2.6rem);margin:.2rem 0 .75rem}
  .alumni-home .campus-hero{min-height:0;padding:1.15rem .8rem 1rem;align-items:center}
  .alumni-home{background:transparent}
  .alumni-home .campus-hero h1{font-size:clamp(2.1rem,8vw,3.25rem)}
  .alumni-home .campus-hero p{margin:0 0 .45rem}
  .alumni-home .hero-actions{margin-top:.75rem;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem}
  .alumni-home .hero-actions .cta{justify-content:center;text-align:center;white-space:nowrap;padding:.55rem .45rem;font-size:.85rem;min-height:42px}
  .home-classmates,.home-memories{padding:.75rem .8rem}
  .alumni-home .section-head{align-items:center;gap:.35rem;margin-bottom:.35rem}
  .alumni-home .section-head h2{font-size:clamp(1.15rem,4.7vw,1.65rem);margin:0}
  .alumni-home .section-head a{white-space:nowrap;font-size:.78rem}
  .home-memories .memory-nav{flex-wrap:nowrap;gap:.25rem}
  .home-memories .memory-nav a{display:inline-flex;align-items:center;min-height:40px;padding-inline:.25rem}
  .home-classmates .people-grid{grid-auto-columns:clamp(110px,33vw,155px)}
  .memory-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:.4rem;margin-bottom:.8rem}
  .memory-search-label{display:none}
  .memory-toolbar form{min-width:0;width:100%;gap:.3rem}
  .memory-toolbar input,.memory-toolbar button{min-height:42px}
  .memory-toolbar button{padding-inline:.5rem;font-size:.8rem}
  .memory-toolbar label{min-width:0}
  .memory-toolbar .share-memory{display:inline-flex;align-items:center;min-height:42px;padding-inline:.55rem;font-size:.8rem;white-space:nowrap}
  .directory-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}
  .directory-card{min-width:0;overflow-wrap:anywhere}
  .classmates-directory .directory-controls{gap:.45rem;padding:.65rem;margin-bottom:.7rem}
  .classmates-directory .directory-controls label{min-width:0;font-size:.85rem}
  .profile-cover{height:94px}
  .profile-identity{padding:0 .75rem .65rem;gap:.35rem .65rem}
  .profile-portrait{width:78px;margin-top:-1.25rem;border-radius:.85rem}
  .alumni-profile .profile-name h1{font-size:1.45rem}
  .profile-actions{padding-top:0}
  .profile-layout,.profile-sidebar,.profile-main{gap:.65rem}
  .profile-section{padding:.8rem}
  .profile-section-head{gap:.35rem}
  .profile-memories .profile-section-head .profile-primary{min-height:40px}
  .reunion-cover,.reunion-section,.reunion-confirmation{padding:.8rem}
  .reunion-cover .reunion-title{font-size:clamp(2rem,8vw,3rem)}
  .reunion-days details,.reunion-group{padding:.6rem}
  .reunion-group .inline-edit summary{min-width:30px;min-height:32px;display:grid;place-items:center}
  .compose-dialog{max-width:100%;max-height:100dvh;padding:1rem .8rem;overflow:auto;overscroll-behavior:contain}
  .notification-feed{gap:.65rem}
  .notification-byline,.notification-preview{padding:.65rem}
  .admin-table-wrap{max-width:100%}
}

/* ===== Kahn system: brick, arch, circle. Final layer; overrides the legacy rules above. ===== */
body{font-family:var(--sans);color:var(--ink);background:var(--lime);-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--serif);font-weight:650;letter-spacing:-.012em;color:inherit}
a{color:var(--brick)}a:hover{color:var(--brick-deep)}
:focus-visible{outline:2px solid var(--brick-fired);outline-offset:2px}
button{border-radius:var(--r-sm);background:var(--brick);font-weight:600;letter-spacing:.01em}
button:hover{background:var(--brick-deep)}
input:not([type=checkbox]),textarea,select{border:1px solid var(--concrete);border-radius:var(--r-sm);background:var(--paper)}
input:not([type=checkbox]):focus,textarea:focus,select:focus{border-color:var(--brick);outline:2px solid var(--brick-wash);outline-offset:0}
label{font-size:.78rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
label input,label select,label textarea{text-transform:none;letter-spacing:0;font-size:1rem;color:var(--ink);font-weight:400;margin-top:.3rem}
article,fieldset,.panel{border-radius:var(--r);box-shadow:none;border-color:var(--line)}
time,small{color:var(--muted)}

/* Masthead */
.member-site{--mast-height:58px}
.member-site .bar{background:var(--paper);border-bottom:3px solid var(--brick);box-shadow:0 1px 0 var(--concrete)}
.member-site .bar .wordmark{display:flex;align-items:center;gap:.6rem;color:var(--ink)}
.member-site .bar .wordmark img{width:34px;height:34px}
.wm-iima{font:700 1.15rem/1 var(--serif);letter-spacing:.02em}
.wm-class{font:600 .72rem/1 var(--sans);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-left:.6rem;border-left:1px solid var(--concrete)}
.member-site .desktop-menu{gap:.25rem}
.member-site .desktop-menu>a{font:600 .88rem var(--sans);color:var(--ink);border-radius:0;padding:.45rem .7rem;border-bottom:2px solid transparent}
.member-site .desktop-menu>a:hover{background:none;color:var(--brick);border-bottom-color:var(--brick-wash)}
.member-site .desktop-menu>a[aria-current=page]{color:var(--brick);border-bottom-color:var(--brick)}
.notification-bell{color:var(--ink)}.notification-bell span{background:var(--brick);font-family:var(--mono)}
.account summary img,.account summary .initials{box-shadow:0 0 0 2px var(--paper),0 0 0 3px var(--brick)}
.bar .account-menu{border-radius:var(--r);box-shadow:0 10px 30px #21181226}
.bar .account-menu a{color:var(--ink)}

/* Page titles: display serif with an arch-and-tie-beam rule */
.member-site main>h1{font:650 clamp(2.2rem,5vw,3.5rem)/1.05 var(--serif);letter-spacing:-.02em;margin:clamp(1.2rem,4vw,2.6rem) 0 1.4rem}
.member-site main>h1::after,.arch-rule::after{content:'';display:block;width:76px;height:15px;margin-top:.7rem;border:1.5px solid var(--brick-fired);border-bottom:2px solid var(--concrete);border-radius:50% 50% 0 0/100% 100% 0 0}
.page-band main>h1{margin-top:clamp(.9rem,2.5vw,1.6rem);display:flex;flex-direction:column;justify-content:end;min-height:clamp(160px,22vw,240px);padding:clamp(1.1rem,3vw,2rem);border-radius:var(--r);color:var(--paper);background:var(--night) center/cover no-repeat}
.member-site.page-band main{background:transparent;border:0;margin-block:0}
.member-site.page-band main>h1{color:var(--on-photo)}
.member-site{display:flex;flex-direction:column}.member-site>main{flex:1 0 auto;width:100%}
.page-band main>h1::after{border-color:var(--on-photo);border-bottom-color:#fffcf699}
.page-people main>h1{background-image:linear-gradient(0deg,#1c1816e6,#1c181633 70%),url('/campus/steps.webp')}
.page-memories main>h1{background-image:linear-gradient(0deg,#1c1816e6,#1c181640 70%),url('/campus/light.webp');background-position:center 78%}
.page-gallery main>h1{background-image:linear-gradient(0deg,#1c1816e6,#1c181640 70%),url('/campus/arches.webp')}

/* Shared bits */
.nickname{font:italic 500 .95em/1.3 var(--serif);color:var(--brick)}
.registry{font:500 .72rem/1.4 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.attend-yes{display:inline-block;margin-top:.35rem;padding:.1rem .45rem;border:1px solid var(--brick);border-radius:999px;font:500 .66rem/1.5 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--brick)}
.seal{display:inline-grid;place-items:center;align-content:center;width:104px;height:104px;border-radius:50%;text-align:center;color:var(--on-brick);background:var(--brick);box-shadow:inset 0 0 0 4px var(--brick),inset 0 0 0 5px #fffcf6aa;font-family:var(--mono)}
.seal b{font:600 2rem/1 var(--serif)}.seal small{display:block;max-width:76px;margin-top:.2rem;color:inherit;font-size:.6rem;line-height:1.25;letter-spacing:.1em;text-transform:uppercase}
.initials{font-family:var(--serif);color:var(--brick)!important;background:var(--brick-wash)!important}

/* Home */
.alumni-home{background:var(--lime);color:var(--ink)}
.alumni-home .campus-hero{position:relative;background-image:linear-gradient(90deg,#1c1816f0 0%,#1c1816a8 42%,#1c181620 80%),url('/campus/arches.webp');background-size:cover;background-position:center 50%}
.alumni-home .campus-hero .class-label{font:500 .74rem var(--mono);letter-spacing:.08em;color:#f3e4dc}
.alumni-home .campus-hero .seal{position:absolute;right:clamp(16px,5vw,72px);bottom:clamp(20px,5vw,60px);background:var(--brick)}
.cta{border-radius:var(--r-sm);font:600 .9rem var(--sans);min-height:44px;padding:.6rem 1.05rem}
.cta.cta-primary{background:var(--brick);color:var(--on-brick);border:1px solid var(--brick)}.cta.cta-primary:hover{background:var(--brick-deep);color:var(--on-brick)}
.cta.cta-quiet{background:transparent;color:var(--on-photo);border:1px solid #fffcf6b3}.cta.cta-quiet:hover{background:#fffcf61a;color:#fff}
.home-classmates{background-image:linear-gradient(120deg,#1c1816f2,#1c1816c2),url('/campus/steps.webp');color:var(--on-photo)}
.home-classmates .section-head h2{color:var(--on-photo)}
.alumni-home .home-classmates .section-head a{color:#f3e4dc}
.home-classmates .person-tile{border-radius:var(--r);border-color:#fffcf62e;background:#2a221e}
.home-classmates .person-tile strong{font:600 .98rem/1.2 var(--serif)}
.home-classmates .person-tile .nickname{color:#f3c9b8;font-size:.85rem}
.home-classmates .person-tile .registry{color:#e6ded2;font-size:.66rem}
.home-memories{background:var(--lime);color:var(--ink);padding-top:clamp(28px,5vw,64px)}
.home-memories .section-head h2{color:var(--ink)}
.alumni-home .home-memories .section-head a,.alumni-home .home-memories .memory-nav a{color:var(--brick)}
.home-memories .feed-more{color:var(--brick)}
.feed-more{border-radius:var(--r-sm);font-weight:600}

/* Classmates */
.classmates-directory .directory-controls{background:var(--paper);border:1px solid var(--line);border-top:2px solid var(--concrete);border-radius:var(--r);color:var(--ink)}
.member-site .directory-card{border-radius:var(--r);border-color:var(--line);background:var(--paper);transition:box-shadow .16s,transform .16s}
.member-site .directory-card:hover{box-shadow:0 6px 18px #21181214;transform:translateY(-2px)}
.member-site .directory-card :is(img,.initials){aspect-ratio:4/5;font-size:2.2rem;object-fit:cover;object-position:center 30%}
.directory-card strong{display:block;font:600 1.02rem/1.25 var(--serif);color:var(--ink)}
.directory-card .nickname{display:block;margin-top:.1rem}
.directory-card .registry{display:block;margin-top:.3rem}
.member-site .directory-card .attend-yes{display:inline-block}

/* Profile */
.profile-header,.profile-section{border-radius:var(--r);border-color:var(--line);box-shadow:none;background:var(--paper)}
.profile-section{border-top:2px solid var(--concrete)}
.profile-cover{background-image:linear-gradient(110deg,#1c1816b3,#6b2b2122),url('/campus/steps.webp')}
.profile-portrait{border-radius:50%;padding:6px;background:var(--paper);box-shadow:0 0 0 1px var(--brick),0 10px 26px #21181226}
.profile-portrait img,.profile-portrait .initials{border-radius:50%}
.profile-portrait>form{position:absolute;right:4px;bottom:4px;margin:0}.profile-portrait [data-upload]{margin:0;background:var(--paper);box-shadow:0 0 0 1px var(--line),0 2px 8px #2118122e}
.alumni-profile .profile-name h1{font:650 clamp(2rem,4.6vw,3.4rem)/1.05 var(--serif);letter-spacing:-.02em;margin:.9rem 0 .2rem}
.profile-name .nickname{margin:0;font-size:1.15rem}
.profile-registry{margin:.35rem 0 .2rem!important;color:var(--muted)}
.profile-status{background:var(--brick-wash);color:var(--brick-deep);border:1px solid var(--brick);border-radius:999px;font:500 .7rem/1.6 var(--mono);letter-spacing:.1em;text-transform:uppercase;padding:.15rem .6rem}
.profile-secondary{background:transparent;border:0!important;color:var(--brick);padding-inline:0!important}
.profile-secondary:hover{text-decoration:underline}
.profile-primary,.profile-actions a.profile-primary{border-radius:var(--r-sm)}
.profile-section h2{font:650 clamp(1.25rem,2.4vw,1.55rem)/1.2 var(--serif);letter-spacing:-.01em}
.profile-facts dt,.profile-entry dt{font:600 .7rem/1.4 var(--sans);letter-spacing:.09em;text-transform:uppercase;color:var(--brick)}
.profile-facts dd{font-size:1rem}
.profile-entry dd{font:400 1.12rem/1.65 var(--serif);color:var(--ink);max-width:64ch}
.profile-entry>div+div{border-top:0;padding-top:1.4rem;position:relative}
.profile-entry>div+div::before{content:'';position:absolute;top:0;left:0;width:44px;height:9px;border:1.5px solid var(--brick-fired);border-bottom:1.5px solid var(--concrete);border-radius:50% 50% 0 0/100% 100% 0 0;opacity:.8}
.entry-moment dd{position:relative;padding-left:2.4rem;font-size:clamp(1.25rem,2.2vw,1.5rem);font-style:italic;line-height:1.5;color:var(--brick-deep)}
.entry-moment dd::before{content:'\\201C';position:absolute;left:0;top:-.35rem;font:700 3.4rem/1 var(--serif);color:var(--brick-fired)}
.field-empty{color:var(--muted);font:italic .95rem var(--sans)}
.then-now-slot{background:transparent;border-radius:0;padding:0}
.then-now-slot h3{display:flex;align-items:baseline;gap:.5rem;font:650 1.05rem var(--serif)}
.then-now-slot h3 span{font:600 1.6rem/1 var(--serif);color:var(--brick)}
.then-now-slot img{aspect-ratio:4/5;object-fit:cover;background:var(--brick-wash);border-radius:var(--r)}
.then-now-slot p{display:grid;place-items:center;aspect-ratio:4/5;margin:0;border:1px dashed var(--concrete);border-radius:var(--r);color:var(--muted);font-size:.9rem}
.inline-edit summary,.profile-portrait [data-upload],.then-now-slot [data-upload]{opacity:.55;transition:opacity .16s}
.inline-edit summary:hover,.inline-edit[open] summary,.inline-edit summary:focus-visible,[data-upload]:hover,[data-upload]:focus-visible{opacity:1}
.profile-photos img{border-radius:var(--r)}
.alumni-profile .profile-memories article{background:var(--paper)}

/* Memories */
.collage-card:is(.memory-collage *,.memory-columns *,.memory-dialog *){background:var(--paper);border:1px solid var(--line);border-radius:var(--r);box-shadow:0 1px 2px #21181210}
.collage-card .memory-author a{font:600 .86rem var(--sans);color:var(--ink)}
.collage-card .memory-author :is(img,.initials){box-shadow:0 0 0 1px var(--line)}
.collage-card.text-memory .collage-visual{background:var(--paper)}
.collage-card.text-memory .memory-quote{position:relative;padding:1.2rem 1rem .9rem 2.6rem;font:400 1.14rem/1.55 var(--serif);color:var(--ink)}
.collage-card.text-memory .memory-quote::before{content:'\\201C';position:absolute;left:.85rem;top:.6rem;font:700 2.6rem/1 var(--serif);color:var(--brick-fired)}
.collage-card .memory-caption{font:400 1rem/1.5 var(--serif)}
.memory-album-title{font:650 1.15rem/1.25 var(--serif)}
.album-photo-count{border-radius:var(--r-sm);font:500 .7rem var(--mono);letter-spacing:.1em;text-transform:uppercase;background:#1c1816e0}
.collage-card .memory-tags a,.collage-card .memory-tags summary{display:inline-block;background:var(--brick-wash);color:var(--brick-deep);border-radius:999px;padding:.08rem .55rem;font:500 .76rem var(--sans)}
.collage-card .memory-tags a:hover{text-decoration:none;background:var(--tint)}
.collage-card .collage-actions{border-top-color:var(--line)}
.collage-card .collage-actions .icon-action{color:var(--muted)}
.collage-card .collage-actions .icon-action:hover,.collage-card .collage-actions [aria-pressed=true]{color:var(--brick)}
.icon-action[data-like][aria-pressed=true]{color:var(--brick)}
.memory-read-more{color:var(--brick)}
.memory-file-picker{background:var(--brick-wash);border-color:var(--brick-fired);border-radius:var(--r)}
.topic-chip,.memory-targets [data-target-results] button{background:var(--brick-wash);color:var(--brick-deep)}
.memory-dialog{border-radius:var(--r);background:var(--paper)}
.share-memory{border-radius:var(--r-sm);background:var(--brick);color:var(--on-brick)}

/* Reunion */
.reunion-cover{position:relative;border-radius:var(--r);background:linear-gradient(100deg,#1c1816f0,#1c18168c),url('/campus/arches.webp') center 53%/cover,var(--night)}
.reunion-cover .class-label,.reunion-cover>p:not(.class-label){font:500 .8rem/1.6 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:#f3e4dc}
.reunion-cover .seal{position:absolute;right:clamp(14px,4vw,48px);top:50%;transform:translateY(-50%)}
.reunion-confirmation,.reunion-section{border-radius:var(--r);border-color:var(--line);background:var(--paper)}
.reunion-section{border-top:2px solid var(--concrete)}
.reunion-confirmation strong{font:650 1.35rem/1.3 var(--serif)}
.reunion-section h2{font-size:clamp(1.4rem,3vw,1.9rem)}
.reunion-days details{background:var(--lime);border-color:var(--line);border-radius:var(--r);border-inline-start:3px solid var(--brick)}
.reunion-days summary{color:var(--brick-deep)}
.reunion-days summary span{font:500 .72rem/1.6 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
.reunion-timeline li{border-top-color:var(--line)}.reunion-timeline li span{font:500 .8rem var(--mono);color:var(--muted)}
.reunion-group{border-radius:var(--r);background:var(--paper)}
.reunion-group h3{font-size:1.15rem}
.reunion-saved{background:var(--paper);border-inline-start:4px solid var(--brick);padding:.6rem .85rem}

/* Notifications, gallery, admin */
.notification-card{border-radius:var(--r)}
.notification-card.new{border-inline-start-color:var(--brick);background:var(--paper)}
.notification-open{color:var(--brick)}
.notification-byline small{font:500 .7rem var(--mono);letter-spacing:.04em}
.photos img{border-radius:var(--r)}
.admin-stats>div,.admin-table{border-radius:var(--r)}

/* Footer: LKP at night, brick coursing */
.site-footer{max-width:none!important;margin:3rem 0 0!important;padding:clamp(2rem,5vw,3.5rem) clamp(16px,4vw,52px)!important;color:#e6ded2;background-color:var(--night);
  background-image:linear-gradient(#fffcf60d 1px,transparent 0),conic-gradient(from 270deg at 1px 14px,#fffcf60d 0 90deg,transparent 0),conic-gradient(from 270deg at 1px 14px,#fffcf60d 0 90deg,transparent 0);
  background-size:100% 14px,48px 28px,48px 28px;background-position:0 0,0 0,24px 14px;border-top:3px solid var(--brick)}
.site-footer>div{max-width:1280px;margin:auto;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:end;gap:1.2rem 2rem}
.site-footer .reunion-title{font:700 clamp(1.8rem,4vw,2.8rem)/1.05 var(--serif);letter-spacing:-.015em;color:var(--on-photo);margin:0}
.site-footer p:not(.reunion-title){margin:.4rem 0 0;font:500 .72rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#b8b2a7}

/* Compact mobile content; bottom navigation is shared in navigation.mjs. */
@media(max-width:650px){
  .member-site{--mast-height:52px}
  .wm-class{display:none}
  .member-site .mobile-menu{display:none}
  .member-site main>h1{font-size:clamp(1.9rem,8vw,2.4rem)}
  .page-band main>h1{min-height:130px}
  .alumni-home .campus-hero{flex-direction:column;align-items:stretch}
  .alumni-home .campus-hero .seal{position:static;align-self:flex-start;width:74px;height:74px;margin-top:.9rem}
  .alumni-home .campus-hero .seal b{font-size:1.4rem}.alumni-home .campus-hero .seal small{font-size:.5rem;max-width:56px}
  .alumni-home .hero-actions .cta{font-size:.85rem}
  .reunion-cover .seal{position:static;transform:none;width:84px;height:84px;margin-top:.8rem}
  .reunion-cover .seal b{font-size:1.5rem}
  .profile-portrait{width:96px;margin-top:-2.2rem;border-radius:50%}
  .alumni-profile .profile-name h1{font-size:1.75rem}
  .profile-identity{grid-template-columns:1fr}
  .profile-facts{grid-template-columns:1fr}
  .entry-moment dd{padding-left:1.8rem}
  .site-footer{margin-top:2rem!important}
}
@media(prefers-reduced-motion:reduce){*{transition:none!important}.directory-card:hover{transform:none}}

/* ===== Pass 2: arches, ledes, progress, finer type ===== */
/* Segmental arch tops: a wide horizontal radius over a shallow vertical one */
.page-band main>h1,.reunion-cover,.profile-cover{border-radius:50% 50% var(--r) var(--r)/34px 34px var(--r) var(--r)}
.profile-header{border-radius:50% 50% var(--r) var(--r)/34px 34px var(--r) var(--r)}
.alumni-home .campus-hero{border-radius:50% 50% 0 0/46px 46px 0 0;margin-top:clamp(10px,2vw,22px)}
h1,h2,h3,.reunion-confirmation strong{text-wrap:balance}
p,dd,.memory-quote{text-wrap:pretty}
.registry,.seal,.album-photo-count,.directory-count{font-variant-numeric:tabular-nums}
::selection{background:var(--brick-wash);color:var(--brick-deep)}
.member-site main{line-height:1.6}
.hero-lede{max-width:34rem;margin:.6rem 0 1.4rem!important;font:italic 400 clamp(1.05rem,1.6vw,1.25rem)/1.5 var(--serif);color:#f3e4dc!important}
.seal-link{color:inherit}.seal-link:hover .seal{background:var(--brick-deep)}
.seal{transition:background-color .16s}

/* Profile lede and owner checklist */
.profile-lede{margin:.7rem 0 .2rem!important;max-width:40rem;font:italic 400 clamp(1.05rem,1.7vw,1.3rem)/1.5 var(--serif);color:var(--ink)!important}
.profile-todo{background:var(--lime);border-style:dashed;border-top-style:solid}
.profile-todo summary{list-style:none;display:flex;flex-direction:column;gap:.2rem;margin:0}
.profile-todo summary::-webkit-details-marker{display:none}
.profile-todo summary h2{margin:0;display:flex;align-items:center;gap:.5rem}
.profile-todo summary h2::after{content:'+';margin-left:auto;font:400 1.4rem/1 var(--sans);color:var(--brick)}
.profile-todo details[open] summary h2::after{content:'–'}
.profile-todo details[open] summary{margin-bottom:1rem}
.profile-todo .field-display{display:none}
.profile-todo .editable-field{padding:.55rem 1.8rem .55rem 0;border-bottom:1px solid var(--line)}
.profile-todo .profile-facts{grid-template-columns:1fr;gap:0}
.profile-todo .inline-edit summary{opacity:1}

/* Initials as a circular opening, not a flat fill */
.directory-card .initials,.person-tile .initials{background:radial-gradient(circle at 50% 50%,var(--paper) 0 30%,var(--brick) calc(30% + 1px) calc(30% + 2px),var(--brick-wash) calc(30% + 3px))!important}
.home-classmates .person-tile .initials{background:radial-gradient(circle at 50% 42%,#2a221e 0 28%,var(--brick-fired) calc(28% + 1px) calc(28% + 2px),#211b18 calc(28% + 3px))!important;color:#f3e4dc!important;place-items:start center;padding-top:28%}

/* Directory count */
.directory-count{margin:0 0 .8rem;color:var(--muted)}
.reunion-page .directory-count{font-size:.85rem;color:var(--brick)}

/* Reunion: progress and three-day agenda */
.reunion-progress{display:flex;align-items:center;gap:.8rem;margin:.8rem 0 .4rem}
.reunion-progress progress{-webkit-appearance:none;appearance:none;width:min(260px,55%);height:8px;border:0;border-radius:999px;background:var(--line);overflow:hidden}
.reunion-progress progress::-webkit-progress-bar{background:var(--line);border-radius:999px}
.reunion-progress progress::-webkit-progress-value{background:var(--brick);border-radius:999px}
.reunion-progress progress::-moz-progress-bar{background:var(--brick);border-radius:999px}
@media(min-width:900px){
  .reunion-days{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.9rem;align-items:start}
  .reunion-days details{margin:0}
  .reunion-days details[open]{grid-column:1/-1}
}

/* Memory cards: a little lift, photo captions breathe */
.collage-card:is(.memory-collage *,.memory-columns *){transition:box-shadow .16s,transform .16s}
.collage-card:is(.memory-collage *,.memory-columns *):hover{box-shadow:0 8px 22px #21181216;transform:translateY(-2px)}

@media(max-width:650px){
  .page-band main>h1,.reunion-cover,.profile-cover,.profile-header{border-radius:50% 50% var(--r) var(--r)/20px 20px var(--r) var(--r)}
  .alumni-home .campus-hero{border-radius:50% 50% 0 0/24px 24px 0 0;margin-top:6px}
  .hero-lede{font-size:1rem}
  .reunion-progress{flex-direction:column;align-items:flex-start}
  .reunion-progress progress{width:100%}
}
@media(prefers-reduced-motion:reduce){.collage-card:hover{transform:none!important}}
.profile-lede-field{padding-right:1.8rem}.profile-lede-field .inline-edit summary{top:.7rem}

/* Phones: stories first, facts after */
@media(max-width:730px){
  .profile-layout{display:flex;flex-direction:column}
  .profile-sidebar,.profile-main{display:contents}
  .profile-layout .profile-section{order:3}
  .profile-layout .profile-then-now{order:1}
  .profile-layout .profile-section:has(>.profile-entry){order:2}
  .profile-layout .profile-todo{order:4}
  .profile-layout .profile-photos{order:5}
  .profile-layout .profile-memories{order:6}
}
@media(max-width:650px){
  .memory-toolbar{align-items:end}
  .memory-toolbar :is(input,button,.share-memory){height:44px;min-height:44px;margin:0}
  .memory-toolbar .share-memory{display:inline-flex;align-items:center}
}

/* Owner editing controls are always visible. */
.profile-actions a.edit-toggle{margin:0;min-height:44px;padding:.55rem 1rem;border-radius:var(--r-sm);background:var(--brick);color:var(--on-brick);font:600 .95rem var(--sans)}
.alumni-profile .inline-edit summary,.alumni-profile [data-upload]{opacity:1}
.alumni-profile .inline-edit summary{min-width:30px;min-height:32px;display:grid;place-items:center}
.alumni-profile [data-upload]{min-width:40px;min-height:40px}

/* Gallery: a real grid */
.page-gallery .photos{grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:1rem}
.page-gallery .photos img{aspect-ratio:4/5;transition:transform .2s}
.page-gallery .photos a:hover img{transform:scale(1.02)}
.page-gallery .photos figcaption{margin-top:.4rem;font:500 .85rem var(--sans);color:var(--muted)}

/* Print a profile like a yearbook page */
@media print{
  .bar,.site-footer,.profile-report,.profile-todo,.edit-toggle,.inline-edit,[data-upload],.profile-memories form,.collage-actions,dialog{display:none!important}
  .member-site{padding:0!important;background:#fff}
  .profile-header,.profile-section{border:0!important;box-shadow:none!important;break-inside:avoid}
  .profile-cover{height:120px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .profile-layout{grid-template-columns:1fr 1.8fr!important}
  a{color:inherit!important}
  .alumni-profile .editable-field{background:none!important;outline:0!important}
}

/* ===== Looking forward to meeting ===== */
.meet-banner{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem 2rem;margin:0;padding:clamp(18px,3vw,28px) clamp(16px,6vw,92px);background:var(--paper);border-bottom:1px solid var(--line);color:var(--ink)}
.meet-count{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:.9rem;margin:0;font:400 clamp(1.1rem,2vw,1.4rem)/1.3 var(--serif);text-wrap:balance}
.meet-count>span:only-child{grid-column:1/-1}
.meet-number{display:inline-grid;place-items:center;min-width:2.3em;height:2.3em;padding:0 .35em;border-radius:999px;background:var(--brick);color:var(--on-brick);font:600 clamp(1.25rem,2.4vw,1.6rem)/1 var(--serif);font-variant-numeric:tabular-nums;box-shadow:inset 0 0 0 3px var(--brick),inset 0 0 0 4px #fffcf699}
.meet-mine{display:flex;align-items:center;flex-wrap:wrap;gap:.6rem 1rem}
.meet-hint{margin:.2rem 0;color:var(--muted);font-size:.92rem}
.meet-faces{display:inline-flex}
.meet-face{display:block;width:34px;height:34px;margin-left:-8px;border-radius:50%;box-shadow:0 0 0 2px var(--paper);overflow:hidden}
.meet-face:first-child{margin-left:0}
.meet-face :is(img,.initials){width:100%;height:100%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font-size:.7rem}
.meet-banner .cta{white-space:nowrap}

.profile-meet{border-top-color:var(--brick)!important}
.profile-meet .meet-count{margin:.2rem 0 .6rem;font-size:clamp(1.05rem,1.8vw,1.25rem)}
.meet-list{list-style:none;margin:1rem 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(230px,100%),1fr));gap:.6rem}
.meet-list li{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.45rem .5rem .45rem .45rem;border:1px solid var(--line);border-radius:999px;background:var(--lime)}
.meet-list a{display:flex;align-items:center;gap:.6rem;min-width:0;color:var(--ink)}
.meet-list a :is(img,.initials){flex:none;width:40px;height:40px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font-size:.8rem}
.meet-list a span{display:grid;min-width:0}.meet-list strong{font:600 .95rem/1.2 var(--serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meet-list .nickname{font-size:.8rem}
.meet-form{margin:0;display:inline-block}
.meet-remove button{margin:0;padding:.3rem .7rem;background:transparent;color:var(--muted);font-size:.78rem;border-radius:999px}
.meet-remove button:hover{background:var(--brick-wash);color:var(--brick-deep)}
.meet-search{margin-top:.6rem}
.meet-search [data-meet-results]{display:grid;gap:.2rem;margin-top:.35rem;max-height:16rem;overflow:auto}
.meet-search [data-meet-results] button{margin:0;text-align:left;background:var(--paper);color:var(--ink);border:1px solid var(--line);font-weight:500;padding:.55rem .75rem;min-height:44px}
.meet-search [data-meet-results] button:hover,.meet-search [data-meet-results] button:focus-visible{background:var(--brick-wash);color:var(--brick-deep)}
.profile-actions .meet-form button{margin:0;min-height:42px;padding:.55rem 1rem;border-radius:var(--r-sm);font:600 .88rem var(--sans)}
.profile-actions .meet-form.is-on button{background:var(--brick-wash);color:var(--brick-deep);box-shadow:inset 0 0 0 1px var(--brick)}
.profile-actions .meet-form.is-on button:hover{background:var(--tint)}
@media(max-width:650px){
  .meet-banner{padding:16px 12px}
  .meet-mine{width:100%;justify-content:space-between}
  .profile-actions{flex-wrap:wrap}
}
@media(max-width:730px){.profile-layout .profile-meet{order:0}}
@media print{.profile-meet,.meet-form{display:none!important}}

/* ===== Type system: one superfamily, real styles only ===== */
html{font-synthesis:none;font-kerning:normal;font-optical-sizing:auto;-webkit-text-size-adjust:100%}
body{font-family:var(--sans);font-size:1.0625rem;line-height:1.6;font-variant-ligatures:common-ligatures}
h1,h2,h3,.reunion-title,.nickname,.meet-count{font-family:var(--serif)}
strong,b{font-weight:600}
/* Kal · Aaj · Aur Kal: display optical size, tight but not crushed */
h1.reunion-title,.reunion-title{font-weight:700;letter-spacing:-.018em;line-height:1}
.reunion-title [aria-hidden]{font-weight:400;margin:0 .02em}
.member-site main>h1,.alumni-profile .profile-name h1{letter-spacing:-.02em;font-weight:650}
h2{letter-spacing:-.01em}
/* Small caps-style labels in the sans, lighter than before */
label,.profile-facts dt,.profile-entry dt{font-weight:600}
.field-empty{font:italic 400 1rem var(--serif)}
/* Inline icons for glyphs no web font carries (✓, ↗) */
.icon-inline{display:inline-block;width:.9em;height:.9em;vertical-align:-.08em;margin-inline:.1em .25em}
.icon-ext{margin-inline:.2em 0;width:.75em;height:.75em}

/* Theme switch: one button, the label names the other mode */
.theme-switch{display:inline-block;margin:0}
.theme-switch button{margin:0;padding:.3rem .7rem;border-radius:999px;background:transparent;color:inherit;border:1px solid currentColor;font:600 .78rem var(--sans);opacity:.85}
.theme-switch button:hover{opacity:1;background:transparent}
:root[data-theme=dark] .theme-switch .to-dark,:root:not([data-theme=dark]) .theme-switch .to-light{display:none}
.bar .account-menu .theme-switch{display:block;margin:.2rem 0 .5rem}
/* Dark-mode finishing: photographs keep their own light-on-dark overlays; everything else follows the tokens */
:root[data-theme=dark] img{background-color:var(--tint)}
:root[data-theme=dark] .wordmark img,:root[data-theme=dark] .mark{mix-blend-mode:normal;background:#fffcf6;border-radius:50%;padding:2px}
:root[data-theme=dark] input:not([type=checkbox]),:root[data-theme=dark] textarea,:root[data-theme=dark] select{background:var(--tint);color:var(--ink);border-color:var(--concrete)}
:root[data-theme=dark] .profile-header,:root[data-theme=dark] .profile-section,:root[data-theme=dark] .collage-card{box-shadow:none}
:root[data-theme=dark] .initials{background:var(--brick-wash)!important}
:root[data-theme=dark] .directory-card .initials,:root[data-theme=dark] .person-tile .initials{background:radial-gradient(circle at 50% 50%,var(--paper) 0 30%,var(--brick) calc(30% + 1px) calc(30% + 2px),var(--brick-wash) calc(30% + 3px))!important}
:root[data-theme=dark] .site-footer{background-color:var(--night)}

.whatsapp-unlock h2{font-size:clamp(1.35rem,4vw,1.8rem);margin:0 0 .6rem}
.whatsapp-unlock{scroll-margin-top:80px}
.unlock-checklist{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:.45rem 1rem}
.unlock-checklist li{display:flex;align-items:center;gap:.5rem;font-size:1rem}
.unlock-checklist small{margin-left:auto;font-size:.875rem}
.alumni-home>.whatsapp-unlock{margin:1rem clamp(12px,4vw,52px)}

.notification-accept{margin:0 .85rem .85rem;display:block}
.notification-accept button,.meet-list .meet-form button{min-height:44px;font-size:.9rem}
.meet-list li{border-radius:var(--r);flex-wrap:wrap}
.meet-list .meet-form button{white-space:nowrap}
.meet-status{color:var(--brick);font-weight:600;font-size:.95rem}
.notification-card>.meet-status,.notification-card>.meet-hint{margin:0 .85rem .85rem}

/* Profile-completion incentive: the actual feed remains beneath a visual blur. */
.memories-gate{position:relative;isolation:isolate;display:grid;align-items:center;overflow:hidden;min-height:430px;margin:.5rem 0 1rem;border:1px solid var(--line);border-radius:var(--r);background:var(--lime)}
.memories-gate-content{grid-area:1/1;min-width:0;min-height:430px;max-height:560px;overflow:hidden;filter:blur(10px);opacity:.65;pointer-events:none;user-select:none;-webkit-user-select:none}
.memories-gate-prompt{grid-area:1/1;position:relative;z-index:1;justify-self:center;width:calc(100% - 40px);max-width:560px;box-sizing:border-box;margin:24px 20px;padding:clamp(20px,4vw,30px);background:var(--paper);background:color-mix(in srgb,var(--paper) 93%,transparent);border:1px solid var(--concrete);border-top:3px solid var(--brick);border-radius:var(--r);backdrop-filter:blur(16px);box-shadow:0 10px 35px #00000026;color:var(--ink)}
.memories-gate-prompt h2{font:650 clamp(1.45rem,4.8vw,2rem)/1.12 var(--serif);margin:.5rem 0 .8rem}
.memories-gate-prompt p{font-size:1rem;line-height:1.5;margin:.6rem 0}
.memories-gate-prompt .registry{font-size:.875rem}
.memories-gate-prompt .memories-gate-progress{margin:1rem 0 .35rem}
.memories-gate-prompt progress{display:block;width:100%;height:7px;accent-color:var(--brick);border:0;border-radius:999px;overflow:hidden;background:var(--line)}
.memories-gate-prompt progress::-webkit-progress-bar{background:var(--line)}
.memories-gate-prompt progress::-webkit-progress-value{background:var(--brick)}
.memories-gate-prompt progress::-moz-progress-bar{background:var(--brick)}
.memories-gate-prompt .memories-gate-needed{font-size:.875rem;color:var(--muted);margin:1rem 0 .4rem}
.memories-gate-requirements{display:flex;flex-wrap:wrap;gap:.4rem;list-style:none;margin:0 0 1.25rem;padding:0}
.memories-gate-requirements li{font-size:.875rem;line-height:1.35;padding:.3rem .5rem;border:1px solid var(--line);border-radius:var(--r);background:var(--tint)}
.memories-gate-prompt .cta{margin-top:1rem;min-height:44px;text-decoration:none;font-size:1rem}
@media(max-width:650px){.memories-gate-prompt{width:calc(100% - 24px);margin:18px 12px}.memories-gate-prompt .cta{display:flex;justify-content:center;width:100%}}
@media print{.memories-gate-content{visibility:hidden}}

.unlock-checklist li{align-items:center;gap:.45rem;padding:.35rem 0}
.unlock-checklist .is-required a{color:var(--brick);font-weight:650;text-underline-offset:.2em}
.unlock-checklist small{white-space:nowrap}
.unlock-optional-note,.required-help{font-size:.95rem;color:var(--muted)}
.profile-required-missing{background:var(--brick-wash);border:1px solid var(--brick-fired);border-radius:var(--r);padding:.8rem!important;scroll-margin:90px 0}
.profile-required-missing .inline-edit summary{right:.35rem;top:.35rem;background:var(--paper);border-radius:var(--r)}
.required-badge{display:inline-block;margin:.25rem .4rem;font:600 .8rem/1.3 var(--sans);letter-spacing:0;text-transform:none;color:var(--brick-deep);background:var(--tint);border:1px solid var(--brick-fired);padding:.2rem .4rem;border-radius:var(--r)}
.profile-required-missing dt{padding-right:1.5rem}
.profile-todo .profile-required-missing{margin-bottom:.65rem}
.optional-profile-fields{margin-top:1rem}.optional-profile-fields>summary{font-size:.95rem;color:var(--muted)}
.required-photo-button{padding:.55rem .75rem;min-height:44px;font-size:.95rem}
.catchup-locked{padding:1rem;border:1px solid var(--line);border-radius:var(--r);background:var(--lime)}
.catchup-locked p{margin:.4rem 0;font-size:1rem}
.catchup-locked .cta{margin-top:.6rem;text-decoration:none;min-height:44px}
.catchup-mask{display:flex;gap:1rem;overflow:hidden;filter:blur(7px);opacity:.6;pointer-events:none;user-select:none}
.catchup-mask-person{display:flex;align-items:center;gap:.5rem;white-space:nowrap}
.catchup-mask-person i{width:32px;height:32px;display:block;border-radius:50%;background:var(--brick)}
.notification-locked-label{padding:.5rem .85rem 0;color:var(--muted);font-size:.9rem}
.notification-card>.catchup-locked{margin:.65rem}

/* Footer links and the theme switch have separate, predictable layouts. */
.footer-controls{display:grid;justify-items:end;gap:.8rem;min-width:0}
.footer-tagline::before{content:' · '}
.site-footer .footer-theme{margin:0}
.site-footer .footer-theme button{min-height:40px;padding:.4rem .8rem}
@media(max-width:650px){
  .site-footer{padding:1.5rem 16px!important}
  .site-footer>div{display:grid;grid-template-columns:minmax(0,1fr);align-items:start;gap:1.15rem}
  .site-footer .footer-brand,.site-footer .footer-controls{width:100%;min-width:0;text-align:left}
  .site-footer .reunion-title{font-size:clamp(1.65rem,7vw,2rem);line-height:1.12}
  .site-footer .footer-brand>p:not(.reunion-title){font-size:.75rem;line-height:1.6;letter-spacing:.045em;margin-top:.6rem}
  .footer-tagline{display:block}.footer-tagline::before{content:none}
  .site-footer .footer-controls{display:grid;justify-items:start;gap:.75rem}
  .site-footer .footer-theme{padding-top:.6rem;border-top:1px solid #ffffff20;width:100%}
  .site-footer .footer-theme button{margin:0}
}

/* One completion summary on owner profiles; navigation stays in the app bar. */
.profile-completion-summary{margin:1rem 0}
.profile-progress-heading{display:flex;align-items:center;justify-content:space-between;gap:.6rem}
.profile-progress-heading h2{margin:0;font-size:1.5rem}
.profile-progress-heading strong{font-size:.9rem;white-space:nowrap;color:var(--muted)}
.profile-completion-summary>p{font-size:1rem;margin:.75rem 0}
.profile-completion-summary progress{display:block;width:100%;height:6px;margin-top:.75rem;accent-color:var(--brick);border:0;border-radius:999px;overflow:hidden;background:var(--line)}
.profile-completion-summary progress::-webkit-progress-bar{background:var(--line)}
.profile-completion-summary progress::-webkit-progress-value{background:var(--brick)}
.profile-missing-items{display:flex;flex-wrap:wrap;gap:.45rem;list-style:none;padding:0;margin:.75rem 0 1rem}
.profile-missing-items a{display:inline-flex;align-items:center;min-height:40px;padding:.4rem .65rem;border:1px solid var(--brick-fired);border-radius:var(--r);color:var(--brick);font-size:.95rem;text-decoration:none;background:var(--brick-wash)}
.profile-all-requirements{margin-top:.9rem;font-size:.9rem;color:var(--muted)}
.profile-all-requirements>summary{margin:0;min-height:36px;display:flex;align-items:center;text-decoration:underline;text-underline-offset:.2em}
.profile-all-requirements>p{font-size:.9rem}.profile-all-requirements>summary::after{content:'+';margin-left:auto}.profile-all-requirements[open]>summary::after{content:'−'}
.catchup-inline-mask{margin:.6rem 0}
.catchup-inline-mask>p{font-size:.95rem;color:var(--muted)}
@media(max-width:730px){
  .profile-layout{align-items:stretch}
  .profile-layout .profile-section{width:100%;box-sizing:border-box}
  .is-owner .profile-layout .profile-todo.has-required{order:0}
  .is-owner .profile-layout .profile-meet{order:4}
  .is-owner .profile-layout .profile-todo:not(.has-required){order:5}
}
@media(max-width:650px){.site-footer{margin-top:1.5rem!important;padding:1.25rem 16px!important}.site-footer .footer-controls{gap:0}.site-footer .footer-theme{padding-top:.75rem}.profile-progress-heading{align-items:baseline}}

.profile-lede-label{font:600 .9rem/1.4 var(--sans)!important;letter-spacing:.03em;margin:1rem 0 .2rem;color:var(--brick)}
.profile-lede-field .profile-lede{margin-top:0!important}
[data-logout-status]{font-size:.9rem;color:var(--ink);max-width:18rem;white-space:normal}
[data-logout-status]:empty{display:none}

.reunion-details-panel>summary{display:flex;align-items:center;justify-content:space-between;gap:.75rem;list-style:none;margin:0;min-height:44px}
.reunion-details-panel>summary::-webkit-details-marker{display:none}
.reunion-details-panel>summary h2{margin:0}
.reunion-details-panel>summary>span{font-size:.875rem;color:var(--muted);margin-left:auto;text-align:right}
.reunion-details-panel>summary::after{content:'+';font-size:1.4rem;color:var(--brick)}
.reunion-details-panel[open]>summary::after{content:'−'}
.reunion-details-panel[open]>summary{margin-bottom:1rem}
#reunion-details,#reunion-attendees{scroll-margin-top:80px}
@media(max-width:650px){
  .reunion-page .directory-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}
  .reunion-page .directory-card{min-width:0;overflow:hidden}
  .member-site .reunion-page .directory-card :is(img,.initials){width:100%;aspect-ratio:1;object-fit:cover;object-position:center 30%;font-size:1.75rem}
  .reunion-page .directory-card>div{padding:.55rem}
  .reunion-page .directory-card strong{font-size:.95rem;line-height:1.25;overflow-wrap:anywhere}
  .reunion-page .directory-card .nickname{font-size:.85rem}
  .reunion-page .directory-card .registry{font-size:.65rem;letter-spacing:.03em}
  .reunion-details-panel>summary{flex-wrap:wrap;gap:.4rem}
  .reunion-details-panel>summary h2{font-size:1.2rem}
  .reunion-details-panel>summary>span{font-size:.8rem;max-width:9rem}
}
`;
