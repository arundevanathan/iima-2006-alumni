import {navigationLinks,mobileNavigation,mobileNavCSS} from './navigation.mjs';
import { agenda, missingReunionDetails, outings, partySummary, reunionValues } from './reunion.mjs';
import { socialScript } from './social.mjs';
import { fontFaces, theme, tokens } from './theme.mjs';
export const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const e=escape;
const link=(href,label)=>`<a href="${e(href)}">${e(label)}</a>`;
const badge=text=>text?`<small>${e(text)}</small>`:'';
const checkbox=(name,label,checked=false)=>`<label class="check"><input type="checkbox" name="${e(name)}"${checked?' checked':''}> ${e(label)}</label>`;
const select=(name,label,options,selected='')=>`<label>${e(label)}<select name="${name}">${options.map(([value,text])=>`<option value="${e(value)}"${String(value)===String(selected)?' selected':''}>${e(text)}</option>`).join('')}</select></label>`;
const input=(name,label,value='',extra='')=>`<label>${e(label)}<input name="${e(name)}" value="${e(value)}" ${extra}></label>`;
const area=(name,label,value='',extra='')=>`<label>${e(label)}<textarea name="${e(name)}" ${extra}>${e(value)}</textarea></label>`;
export const field=(name,value)=>`<input type="hidden" name="${e(name)}" value="${e(value)}">`;
export const form=(action,body,label,extra='')=>`<form method="post" action="${e(action)}" ${extra}>${body}<button type="submit">${e(label)}</button></form>`;
const action=(url,name,label,values={})=>form(url,field('action',name)+Object.entries(values).map(([key,val])=>field(key,val)).join(''),label,'class="inline"');
const report=(type,target)=>`<details><summary>Report ${e(type)}</summary>${form('/report',field('type',type)+field('target',target)+area('reason','What needs checking?','','required maxlength="1000"'),'Send report')}</details>`;
const list=(items,empty)=>items.length?`<ul class="plain">${items.map(item=>`<li>${item}</li>`).join('')}</ul>`:`<p>${e(empty)}</p>`;
const labelFor=key=>({dorm:'Dorm number',nickname:'Dorm name',city:'Current city',life:'Life, Lately',professionalFocus:'Professional focus',researchHighlight:'Selected work and achievements',firstDayAdvice:'Advice to my first-day self',outsideWork:'Outside work',reunionStory:'Reunion story',anythingElse:'Anything else',printName:'Yearbook name',moment:'A memorable moment'}[key]||key[0].toUpperCase()+key.slice(1));

const profilePrompts = {
  life: ['What has life looked like since WIMWI?', 'Where has life taken you over the last twenty years? Share a few sentences about work, unexpected turns, and what matters to you these days.'],
  family: ['Tell us about your family and life outside work', 'Who shares your world these days? Tell us about your partner, children, parents, pets—or the people and pursuits that make life yours. Add a small detail your batchmates wouldn’t know.'],
  outsideWork: ['What could your batchmates happily talk to you about for hours?', 'A hobby, a passion, a side project, or your latest obsession—give someone a reason to start a conversation.'],
  moment: ['What’s a WIMWI memory that still makes you smile?', 'Take us back to a particular moment: where were you, who was there, and what happened?'],
  firstDayAdvice: ['What would you tell your first-day-at-WIMWI self?', 'With twenty years of hindsight, what advice—or unexpected news—would you share?'],
  anythingElse: ['What else would you like your batchmates to know?', 'An unexpected turn, a proud moment, or something we haven’t asked about.']
};
const profileControl = (name,key,value='') => {
  const prompt=profilePrompts[key], label=prompt?.[0]||labelFor(key);
  return `<label>${e(label)}${prompt?`<small style="display:block;font-weight:400;line-height:1.5;margin:.4rem 0;text-transform:none;letter-spacing:normal">${e(prompt[1])}</small>`:''}<textarea name="${e(name)}" maxlength="4000" rows="${prompt?4:2}" style="min-height:${prompt?'7':'3.5'}rem" placeholder="${prompt?'A few sentences will help your batchmates catch up with you.':''}">${e(value)}</textarea></label>`;
};
const moreYouIntro = '<h2>A little more you</h2><p>Pick one—or answer them all. These are often the best parts to read.</p>';

const mediaSrc = (media,width) => `/media/${e(media)}?w=${width}`;
const mediaSet = (media,widths) => widths.map(width=>`${mediaSrc(media,width)} ${width}w`).join(', ');
const images=items=>items.length?`<div class="photos">${items.map(row=>`<figure><a href="/media/${e(row.media)}"><img src="${mediaSrc(row.media,256)}" srcset="${mediaSet(row.media,[256,480])}" sizes="(max-width: 520px) 45vw, 200px" loading="lazy" alt="${e(row.caption||'Batch photo')}"></a>${row.caption?`<figcaption>${e(row.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:'<p>No published photos yet.</p>';
const portrait=(person,lazy=true,width=96,sizes='')=>person.portrait
  ? `<img src="${mediaSrc(person.portrait,width)}" ${sizes?`srcset="${mediaSet(person.portrait,[256,480,768])}" sizes="${sizes}"`: ''}alt="" ${lazy?'loading="lazy"':''}>`
  : `<span class="initials" aria-hidden="true">${e(person.name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join(''))}</span>`;
const reunionTitle='Kal • Aaj • Aur Kal';
const titleCreative=()=>`<span>Kal</span><span aria-hidden="true">•</span><span>Aaj</span><span aria-hidden="true">•</span><span>Aur Kal</span>`;
const shareTitle = 'Kal · Aaj · Aur Kal | IIMA Class of 2006';
const shareDescription = 'Reconnect with classmates, revisit campus memories, and get ready for the IIMA Class of 2006 reunion.';
const shareMeta = `<meta name="description" content="${e(shareDescription)}">
  <meta property="og:type" content="website"><meta property="og:title" content="${e(shareTitle)}">
  <meta property="og:description" content="${e(shareDescription)}"><meta name="twitter:card" content="summary">
  <meta property="og:image" content="https://iima-class-of-2006.in/campus/logo.png">
  <meta property="og:image:alt" content="IIM Ahmedabad logo">`;
const paths={like:'M20 8c0 4-8 9-8 9S4 12 4 8a4 4 0 0 1 8-1 4 4 0 0 1 8 1Z',comment:'M5 5h14v10h-7l-4 4v-4H5z',tag:'M4 5h9l7 7-7 7-9-9z M8 8h.1',edit:'M3 21l2-6L17 3a2.8 2.8 0 0 1 4 4L9 19z M5 15l4 4 M15 5l4 4',close:'m6 6 12 12M18 6 6 18'};
const iconGraphic = kind => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[kind]}"/></svg>`;
const icon = (kind,label,attrs='') => `<button type="button" class="icon-action" aria-label="${e(label)}" data-tooltip="${e(label)}" ${attrs}>${iconGraphic(kind)}</button>`;
const dormLabel = dorm => /^\d+$/.test(dorm) ? 'Dorm '+dorm : dorm;
const classmate = (row,extra=[]) => {
  const registry = [row.dorm&&dormLabel(row.dorm),...extra].filter(Boolean).join(' · ');
  return `<strong>${e(row.name)}</strong>${row.nickname?`<small class="nickname">“${e(row.nickname)}”</small>`:''}${registry?`<small class="registry">${e(registry)}</small>`:''}`;
};
const completionLabel = timestamp => {
  const day=value=>Math.floor((value+19800000)/86400000);
  const days=Math.max(0,day(Date.now())-day(Number(timestamp)));
  return days===0?'Completed today':days===1?'Completed yesterday':`Completed ${days} days ago`;
};
// Catch-up requests reveal the sender to the recipient and can be accepted.
const checkIcon = '<svg class="icon-inline" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6"/></svg>', extIcon = '<svg class="icon-inline icon-ext" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';
export const themeSwitch = (cls='') => `<form method="post" action="/theme" class="theme-switch ${cls}"><button type="submit" aria-label="Switch between dark and light mode"><span class="to-light">☀ Light mode</span><span class="to-dark">☾ Dark mode</span></button></form>`;
const plural = (n,one,many) => n===1 ? one : many;
const meetCountLine = count => count>0
  ? `<strong class="meet-number">${count}</strong> <span>${plural(count,'WIMWIan is','WIMWIans are')} looking to catch up with you</span>`
  : '<span>Which WIMWIans are you looking to catch up with?</span>';
const meetForm = (action,target,next,label,cls='',request='') => `<form method="post" action="/meet" class="meet-form ${cls}">${field('action',action)}${field('target',target)}${field('next',next)}${request?field('request',request):''}<button type="submit">${label}</button></form>`;
const meetFaces = people => people.slice(0,6).map(person=>`<a class="meet-face" href="/people/${person.id}" title="${e(person.name)}">${portrait(person,true,96)}</a>`).join('');
// Days until the reunion opens in Jaipur (IST); a seal counts down on Home and Reunion.
const reunionStart = Date.parse('2026-12-26T00:00:00+05:30');
const countdown = () => {
  const days = Math.ceil((reunionStart - Date.now()) / 86400000);
  if (days > 0) return `<span class="seal" role="img" aria-label="${days} ${days===1?'day':'days'} to the reunion in Jaipur"><b>${days}</b><small>${days===1?'day':'days'} to Jaipur</small></span>`;
  if (days > -3) return '<span class="seal"><small>Together in Jaipur</small></span>';
  return '';
};
const memoryTags=(post)=> {
  const tags=JSON.parse(post.linked_tags||'[]');
  const item=tag=>link(tag.href,(tag.kind==='person'?'@':'#')+tag.label);
  return tags.length?`<div class="memory-tags">${tags.slice(0,3).map(item).join('')}${tags.length>3?`<details><summary>View ${tags.length-3} more</summary><div>${tags.slice(3).map(item).join('')}</div></details>`:''}</div>`:'';
};
const tagPanel=()=>`<div class="memory-inline" data-panel-content="tags" hidden>
  <input type="search" data-tag-search aria-label="Add a tag" placeholder="@classmate or #place or event" autocomplete="off">
  <div data-tag-results></div></div>`;
const tagControls=(scope)=>`${icon('tag','Tag '+scope,'data-panel="tags" aria-expanded="false"')}${tagPanel()}
  <div class="memory-result" role="status"></div>`;
const memoryAuthor=post=>`<div class="memory-author"><a href="/people/${post.author}">${portrait({name:post.author_name,portrait:post.author_portrait})}${e(post.author_name)}</a></div>`;
const memoryCards = (rows,priority=false) => rows.map((post,index)=>{
  const photos=JSON.parse(post.collage_photos||'[]');
  const album=photos.length>1, photo=post.album_cover?'post/'+post.album_cover:photos[0];
  const title=post.album_title||'Photo album';
  const image=photo?`<img src="${mediaSrc(photo,480)}" srcset="${mediaSet(photo,[480,768,1200])}" sizes="(max-width: 490px) 95vw, (max-width: 850px) 45vw, 400px" data-full-src="/media/${e(photo)}" alt="${e(album?title:'Memory shared by '+post.author_name)}" decoding="async" ${priority&&index<3?'fetchpriority="high"':'loading="lazy"'}>`:'';
  return `<article class="collage-card${photo?'':' text-memory'}" data-post="${e(post.id)}">
    ${memoryAuthor(post)}
    <div class="collage-visual">
      ${album?`<a class="album-cover" href="/posts/${e(post.id)}">${image}<span class="album-photo-count">${photos.length} photos</span></a>`:
        `<button type="button" class="memory-enlarge" data-enlarge aria-label="View memory from ${e(post.author_name)}">
        ${photo?image:`<span class="memory-quote">${e(post.body)}</span>${post.body.length>240?'<span class="memory-read-more">Read full memory</span>':''}`}</button>`}
    </div>
    <div class="memory-card-footer">
    ${album?`<h3 class="memory-album-title">${link('/posts/'+post.id,title)}</h3>`:''}
    ${photo&&post.body&&!['Shared a yearbook photo.','Shared a photo.'].includes(post.body)?`<p class="memory-caption">${e(post.body)}</p>`:''}
    <div data-memory-tags>${memoryTags(post)}</div>
    <div class="collage-actions">
      <div class="memory-like">${icon('like',post.liked?'Unlike':'Like','data-like aria-pressed="'+!!post.liked+'"')}<span data-count>${post.likes||''}</span></div>
      ${icon('comment','Comment','data-panel="comments" aria-expanded="false"')}
      ${icon('tag','Add tags','data-panel="tags" aria-expanded="false"')}
    </div>
    </div>
    <div class="memory-inline" data-panel-content="comments" hidden><div data-comments></div>
      <form data-social><textarea name="body" aria-label="Comment" placeholder="Write a comment…" maxlength="1200" required></textarea>
      ${field('action','comment')}<button>Post</button></form><button type="button" data-comment-again hidden>Add another comment</button></div>
    <div class="memory-inline" data-panel-content="tags" hidden>
      <input type="search" data-tag-search aria-label="Add a tag" placeholder="@classmate or #place or event" autocomplete="off">
      <div data-tag-results></div></div>
    <div class="memory-result" role="status"></div>
  </article>`;
}).join('');
const memoryDialog=()=>`<dialog class="memory-dialog" aria-label="Memory">${icon('close','Close','data-close')}<div data-dialog-content></div></dialog>`;
const memoryBatch=(rows,priority=false)=>`<div class="memory-collage">${memoryCards(rows,priority)||'<p>No memories here yet.</p>'}</div>`;
const collage=(rows,next,priority=false)=>`<div data-feed>${memoryBatch(rows,priority)}</div>
${next?`<a class="feed-more" data-feed-next href="${e(next)}" aria-label="Load more memories">Load more memories</a>`:''}
${memoryDialog()}`;
export function render(title,body,member,{home=false,active=null}={}) {
  const sectionOf = {Memories:'/memories',Classmates:'/people','December reunion':'/reunion',Gallery:'/gallery',Notifications:'/notifications',WhatsApp:'/wa/','WhatsApp Insights':'/wa/','Edit profile':'/people'};
  const current = active || (title===reunionTitle ? '/' : sectionOf[title]);
  const menu=navigationLinks(current);
  const slug = current==='/' ? 'home' : current ? current.slice(1).replace(/\/$/,'')||'other' : 'other';
  const banded = ['memories','people','gallery'].includes(slug);
  const footer = member ? `<footer class="site-footer"><div><div class="footer-brand"><p class="reunion-title" aria-label="${reunionTitle}">${titleCreative()}</p>
    <p><span>IIM Ahmedabad · PGP 2004–06</span><span class="footer-tagline">Twenty years on</span></p></div>
    <div class="footer-controls">${themeSwitch('footer-theme')}</div></div></footer>` : '';
  const nav=member?`<nav aria-label="Main navigation"><details class="mobile-menu"><summary aria-label="Menu"><span class="menu-glyph" aria-hidden="true"></span></summary><div>${menu}</div></details><div class="desktop-menu">${menu}</div>
    <a class="notification-bell" href="/notifications" aria-label="Notifications${member.unread?' ('+member.unread+' unread)':''}">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
      ${member.unread?`<span aria-hidden="true">${member.unread>99?'99+':member.unread}</span>`:''}</a>
    <details class="account"><summary aria-label="My profile menu">${portrait(member,false)}</summary>
      <div class="account-menu">${link('/people/'+member.id,'View profile')}
      ${member.role==='admin'?link('/admin','Admin View'):''}${themeSwitch('in-menu')}${form('/logout','','Log out')}</div></details></nav>`:'';
  return new Response(`<!doctype html><html lang="en" data-theme="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${e(title)} · IIMA ’06</title><link rel="icon" href="/campus/logo.png"><link rel="preload" href="/fonts/source-serif-4.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/source-sans-3.woff2" as="font" type="font/woff2" crossorigin>${shareMeta}<style>
  ${tokens}*{box-sizing:border-box}body{margin:0;background:var(--lime);color:var(--ink);font:1rem/1.55 var(--sans)}a{color:var(--brick);text-underline-offset:.18em}button,input,textarea,select{font:inherit}button{cursor:pointer;border:0;border-radius:2rem;background:var(--brick);color:var(--on-brick);padding:.55rem 1rem;margin-block:.4rem}input:not([type=checkbox]),textarea,select{display:block;width:100%;padding:.5rem;border:1px solid var(--line);border-radius:.5rem;background:var(--paper);color:var(--ink)}textarea{min-height:6rem}input[type=checkbox]{margin-right:.35rem}label{display:block;margin:.6rem 0}.check{display:flex;align-items:center}.bar{background:#f1e0cf;border-bottom:1px solid var(--line)}.bar div,main,footer{max-width:960px;margin:auto;padding:1rem clamp(1rem,4vw,2.3rem)}.wordmark{font:700 1.25rem var(--serif);text-decoration:none}nav{display:flex;flex-wrap:wrap;gap:.35rem 1rem;margin-top:.65rem}nav a{font-weight:600}h1,h2,h3{line-height:1.14;font-family:var(--serif)}h1{font-size:clamp(2.3rem,7vw,4.5rem);margin:.65em 0 .3em}h2{font-size:1.65rem}article,fieldset,.panel{background:var(--tile);border:1px solid var(--line);border-radius:.9rem;padding:1rem;margin:1rem 0;min-width:0}article header{display:flex;gap:.5rem 1rem;justify-content:space-between;flex-wrap:wrap}time,small{color:var(--muted)}.plain{list-style:none;padding:0}.plain li{padding:.45rem 0;border-bottom:1px solid var(--line)}.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(145px,100%),1fr));gap:1rem}figure{margin:0}img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:.6rem;display:block;background:var(--tint)}figcaption{font-size:.9rem}.inline{display:inline-block;margin-right:.4rem}.story{white-space:pre-wrap;overflow-wrap:anywhere}.new{font-weight:700}:focus-visible{outline:2px solid var(--brick-fired);outline-offset:2px}summary{cursor:pointer;margin:.5rem 0}dd{margin:0 0 .8rem;white-space:pre-wrap;overflow-wrap:anywhere}dt{font-weight:650}
  ${fontFaces}
  ${theme}
  .bar .account-menu{position:absolute;right:0;top:100%;z-index:5;min-width:10rem;padding:.8rem;background:var(--tile);border:1px solid var(--line);border-radius:.8rem;box-shadow:0 12px 28px #24161030}
  .account{position:relative;margin-left:auto}.account summary{list-style:none;margin:0}.account summary::-webkit-details-marker{display:none}.account summary img,.account summary .initials{width:2.4rem;height:2.4rem;border-radius:50%;aspect-ratio:1;display:grid;place-items:center;background:var(--tint)}
  .account-menu a{display:block;margin-bottom:.4rem}.directory-controls{display:grid;grid-template-columns:2fr 1fr auto;align-items:end;gap:.75rem;margin-bottom:1.25rem}
  .directory-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(10rem,100%),1fr));gap:1rem}.directory-card{display:block;overflow:hidden;background:var(--tile);border:1px solid var(--line);border-radius:1rem;text-decoration:none}.directory-card img,.directory-card .initials{width:100%;aspect-ratio:1;display:grid;place-items:center;background:var(--tint);border-radius:0;font-size:2rem}.directory-card div{padding:.75rem}.directory-card small{display:block}
  .memory-nav{display:flex;flex-wrap:wrap;gap:.6rem 1.3rem;align-items:center;margin-bottom:1rem}.memory-feed{max-width:44rem}
  @media(max-width:600px){.directory-controls{grid-template-columns:1fr 1fr}.directory-controls label:first-child{grid-column:1/-1}}
  ${mobileNavCSS}
  </style><body class="${home?'home ':''}${member?'member-site has-mobile-nav ':''}page-${slug}${banded?' page-band':''}"><header class="bar"><div class="mast"><a class="wordmark" href="/" aria-label="IIMA Class of 2006, home"><img src="/campus/logo.png" alt=""><span class="wm-iima">IIMA</span><span class="wm-class">Class of 2006</span></a>${nav}</div></header><main>${home?'':'<h1>'+e(title)+'</h1>'}${body}</main>${footer}${member?mobileNavigation(current):''}${member?'<script src="/social.js?v=20" defer></script>':''}</body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8'}});
}
export function whatsappRequirements(details, photos={}) {
  return [['dorm','Dorm number'],['nickname','Dorm name'],['city','Current city'],['life','Life, Lately'],['family','Family']]
    .map(([key,label])=>({key,label,complete:!!String(details[key]??'').trim()}))
    .concat(['then','now'].map(slot=>({key:slot,label:slot==='then'?'Then photo (2006)':'Now photo (2026)',complete:!!photos[slot]})));
}
export function whatsappUnlock(checks, me, own=false) {
  const missing=checks.filter(check=>!check.complete), complete=!missing.length;
  if(own)return `<section class="panel profile-completion-summary" id="whatsapp-unlock" aria-labelledby="profile-progress-title">
    <div class="profile-progress-heading"><h2 id="profile-progress-title">${complete?'Your essentials are complete':'The essentials'}</h2><strong>${checks.length-missing.length} of ${checks.length} complete</strong></div>
    ${complete?'<p>Your memories, WhatsApp Insights and catch-up requests are unlocked.</p><p><strong>Now add a little colour.</strong> A memory, an unexpected turn, or something you’re into these days will help your batchmates reconnect with the person behind the profile.</p><a href="#a-little-more-you">Add a little more you</a> · <a href="/wa/">View WhatsApp Insights</a>':`<progress max="${checks.length}" value="${checks.length-missing.length}" aria-label="Profile completion"></progress><p>Finish these items to unlock memories, WhatsApp Insights and incoming catch-up names.</p><ul class="profile-missing-items">${missing.map(check=>`<li><a href="#profile-field-${check.key}" data-required-jump="${check.key}">${e(check.label)}</a></li>`).join('')}</ul><a class="cta profile-primary" data-unlock-edit data-required-jump="${missing[0].key}" href="#profile-field-${missing[0].key}">Continue profile</a>`}
    <details class="profile-all-requirements"><summary>All 7 requirements</summary><p>These five details and two photos unlock access. A few extra stories will make your profile more personal.</p><ul class="unlock-checklist">${checks.map(check=>`<li><span aria-hidden="true">${check.complete?'✓':'○'}</span><span>${e(check.label)}</span><small>${check.complete?'Complete':'Required'}</small></li>`).join('')}</ul></details>
  </section>`;
  const target=key=>own?'#profile-field-'+key:'/people/'+me+'?complete=whatsapp#profile-field-'+key;
  return `<section class="panel whatsapp-unlock" id="whatsapp-unlock" aria-labelledby="whatsapp-unlock-title">
    <h2 id="whatsapp-unlock-title">${complete?'Your WhatsApp Insights are unlocked':own?'Complete these 7 items to unlock everything':'Complete your profile to unlock WhatsApp Insights'}</h2>
    <p>${complete?'Your memories, WhatsApp Insights and catch-up requests are unlocked.':own?'Unlock memories, WhatsApp Insights and the names of classmates who want to catch up. Only the five details and two photos below are required.':'Discover your WhatsApp story and the batch’s years together. Complete these five details and both photos.'}</p>
    ${complete?'':`<p><strong>${checks.length-missing.length} of ${checks.length} requirements complete</strong></p><ul class="unlock-checklist">${checks.map(check=>`<li class="${check.complete?'is-complete':'is-required'}"><span aria-hidden="true">${check.complete?'✓':'○'}</span> ${check.complete?`<span>${e(check.label)}</span>`:`<a href="${target(check.key)}"${own?` data-required-jump="${check.key}"`:''}>Add ${e(check.label)}</a>`} <small>${check.complete?'Complete':'Required'}</small></li>`).join('')}</ul><p class="unlock-optional-note">Your profile picture, company, education and optional questions are not required.</p>`}
    <a class="cta profile-primary" ${own&&!complete?`data-unlock-edit data-required-jump="${missing[0].key}"`:''}href="${complete?'/wa/':target(missing[0].key)}">${complete?'View WhatsApp Insights':own?'Add next required item':'Complete my profile'}</a>
  </section>`;
}
export function catchupLocked(count,me,compact=false) {
  if(compact)return `<div class="catchup-inline-mask"><div class="catchup-mask" inert aria-hidden="true"><span class="catchup-mask-person"><i></i><b>A classmate</b></span></div><p>Names unlock when your profile is complete. <a href="#whatsapp-unlock">View requirements</a></p></div>`;
  return `<div class="catchup-locked"><div class="catchup-mask" inert aria-hidden="true">${Array.from({length:Math.min(count,3)},()=>'<span class="catchup-mask-person"><i></i><b>A classmate</b></span>').join('')}</div><p><strong>${count} ${count===1?'classmate wants':'classmates want'} to catch up with you</strong></p><p>Complete your profile to see who and respond.</p><a class="cta profile-primary" href="/people/${me}?complete=whatsapp#whatsapp-unlock">Complete my profile</a></div>`;
}
export function memoriesCompletionPrompt(content,checks,me) {
  const missing=checks.filter(item=>!item.complete);
  if(!missing.length)return content;
  return `<section class="memories-gate" aria-label="Memories available after profile completion">
    <div class="memories-gate-content" inert aria-hidden="true">${content}</div>
    <div class="memories-gate-prompt" role="region" aria-labelledby="memories-gate-title">
      <span class="registry">Your batch’s stories await</span>
      <h2 id="memories-gate-title">Complete your profile to access memories</h2>
      <p>Add your details and Then / Now photos to explore the batch’s stories, photos and WhatsApp Insights.</p>
      <p class="memories-gate-progress"><strong>${checks.length-missing.length} of ${checks.length} complete</strong></p>
      <progress max="${checks.length}" value="${checks.length-missing.length}" aria-label="Profile completion"></progress>
      <a class="cta profile-primary" href="/people/${me}?complete=whatsapp#whatsapp-unlock">Complete my profile</a>
      <p class="memories-gate-needed">Still needed</p>
      <ul class="memories-gate-requirements">${missing.map(item=>`<li>${e(item.label)}</li>`).join('')}</ul>
    </div>
  </section>`;
}
export const page={
  socialScript,
  pickerScript:`const box=document.querySelector('#name-search'); const results=document.querySelector('#name-results'); let revision=0;
    box.addEventListener('input',async()=>{const request=++revision; const q=box.value.trim(); results.replaceChildren(); if(q.length<2)return;
    try { const response=await fetch('/names?q='+encodeURIComponent(q)); const names=await response.json(); if(request!==revision)return;
    for(const item of names){ const li=document.createElement('li'), a=document.createElement('a'); a.textContent=item.name; a.href='/signin?id='+item.id+'&next='+encodeURIComponent(box.dataset.next); li.append(a); results.append(li); }
    if(!names.length) results.textContent='No matching names.'; } catch { if(request===revision)results.textContent='Search unavailable. Try again.'; }});
    document.addEventListener('submit',async event=>{
      const form=event.target;
      if (form.getAttribute('action')!=='/request-link') return;
      event.preventDefault();
      const button=form.querySelector('button'), feedback=form.previousElementSibling;
      button.disabled=true;
      try {
        const response=await fetch(form.action,{method:'POST',body:new FormData(form)});
        if (!response.ok) throw new Error('Request failed');
        const result=new DOMParser().parseFromString(await response.text(),'text/html').querySelector('.selection');
        if (!result) throw new Error('Missing result');
        form.closest('.selection').replaceWith(result);
      } catch {
        feedback.textContent='Could not request a link. Please try again.';
        button.disabled=false;
      }
    });`,
  home(rows,next,key,me,meet={available:false},unlock=[],fresh=[]){
    return `<div class="alumni-home"><section class="campus-hero"><div>
      <p class="class-label">IIM Ahmedabad · Class of 2006</p><h1 class="reunion-title" aria-label="${reunionTitle}">${titleCreative()}</h1>
      <p class="hero-lede">Twenty years since LKP. Find your batchmates, trade the old stories, and see you in Jaipur.</p>
      <div class="hero-actions"><a class="cta cta-primary" href="/compose" data-compose-open>Share a memory</a><a class="cta cta-quiet" href="/people/${me}">Edit profile</a></div>
      </div>${countdown()?`<a class="seal-link" href="/reunion">${countdown()}</a>`:''}</section>
      <section class="home-classmates home-fresh" aria-labelledby="fresh-profiles-title"><div class="section-head"><h2 id="fresh-profiles-title">Freshly completed profiles</h2>${link('/people','See all')}</div>
        ${fresh.length?`<div class="fresh-browse"><span>Latest first · ${fresh.length} profiles</span><div><button type="button" data-fresh-step="-1" aria-label="Previous completed profiles" disabled>←</button><button type="button" data-fresh-step="1" aria-label="Next completed profiles">→</button></div></div><div class="people-grid" role="region" aria-label="Freshly completed profiles, newest first. Swipe or use the arrows to browse" data-fresh-strip tabindex="0">${fresh.map(row=>`<a class="person-tile" href="/people/${row.id}">${portrait(row,true,256)}<div>${classmate(row,row.city?[row.city]:[])}${row.completed_at||row.completion_basis==='observed'?`<small class="completed-label">${row.completed_at?completionLabel(row.completed_at):'Recently completed'}</small>`:''}</div></a>`).join('')}</div>`:'<p class="fresh-empty">Completed profiles will appear here. Be one of the first to share your story.</p>'}
      </section>
      ${meet.available?`<section class="meet-banner" aria-label="Looking to catch up">
        <p class="meet-count">${meetCountLine(meet.count)}</p>
        <div class="meet-mine">${meet.picked.length?`<span class="meet-faces">${meetFaces(meet.picked)}</span><span class="registry">You’ve picked ${meet.picked.length}</span>`:'<span class="meet-hint">Send a catch-up request to the WIMWIans you want to meet in Jaipur. They’ll be notified and can accept it.</span>'}
          <a class="cta cta-primary" href="/people/${me}#meet">${meet.picked.length?'Add more':'Choose who to catch up with'}</a></div>
      </section>`:''}
      <section class="home-memories"><div class="section-head"><h2>Memories</h2><div class="memory-nav"><a href="/compose" data-compose-open>Add memory</a>${link('/memories','See all')}</div></div>${memoriesCompletionPrompt(collage(rows,next),unlock,me)}</section>
      ${page.composeDialog(key)}
    </div>`;
  },
  memories(rows,next,q,key,checks=[],me){return `<div class="memory-toolbar">
    <form method="get" action="/memories"><label><span class="memory-search-label">Search memories</span><input aria-label="Search memories" type="search" name="q" value="${e(q)}" placeholder="Search memories"></label><button>Search</button></form>
    <a href="/compose" class="profile-primary share-memory" data-compose-open>Add memory</a></div>
    ${memoriesCompletionPrompt(collage(rows,next,true),checks,me)}
    ${page.composeDialog(key)}`;},
  gallery(photos){return `<div class="memory-nav">${link('/memories','Back to memories')}</div>${images(photos)}`;},
  memoryCards, memoryTags,
  reunion(member,tracker,saved,directory,showSaved){
    const values = reunionValues(tracker,saved);
    const party = partySummary(values.spouse,values.children);
    const missing = missingReunionDetails(values), missingDetails = missing.length>0;
    // Same critical fields as missingReunionDetails: four for everyone, two more with a partner, two per child.
    const critical = 4 + (values.spouse==='1'?2:0) + 2*(Number(values.children)||0), done = critical-missing.length;
    const yesNo = [['','Choose an option'],['1','Yes'],['0','No']];
    const names = [['','Choose an option'],...Array.from({length:11},(_,i)=>[String(i),String(i)])];
    const entries = rows => rows.map(([time,title,location])=>`<li><span>${e(time)}</span><div><strong>${e(title)}</strong>${location?`<small>${e(location)}</small>`:''}</div></li>`).join('');
    const row = (key,label,value,options,type='text',prompt='') => {
      const shown=options && value ? options.find(([id])=>id===value)?.[1] : value;
      const control=options?select('value',label,options,value):input('value',label,value,`type="${type}" maxlength="120"${type==='number'?' min="0" max="25"':''}`);
      return `<div class="editable-field${prompt&&!shown?' reunion-needs-detail':''}"><dt>${e(label)}</dt><dd class="field-display">${e(shown||prompt||'Not provided')}</dd>
        <details class="inline-edit"><summary aria-label="Edit ${e(label)}" title="Edit ${e(label)}">${iconGraphic('edit')}</summary>
        ${form('/reunion',field('field',key)+control,'Save')}</details></div>`;
    };
    const group = (title,rows,id='') => `<div class="reunion-group" id="${e(id||title.toLowerCase().replaceAll(' ','-'))}"><h3>${e(title)}</h3><dl class="reunion-fields">${rows}</dl></div>`;
    const kids = Array.from({length:Number(values.children)||0},(_,i)=>{
      const kid=values.kids?.[i]||{};
      return group('Child '+(i+1),
        row('kidName'+i,'Name',kid.name)+row('kidGender'+i,'Gender',kid.gender)+
        row('kidAge'+i,'Age',kid.age,null,'number','Add age for activity planning')+row('kidShirt'+i,'T-shirt size',kid.shirt,null,'text','Add size for the reunion kit'),i===0?'reunion-children':'');
    }).join('');
    return `<div class="reunion-page">
      <header class="reunion-cover"><p class="class-label">IIM Ahmedabad · Class of 2006</p>
        <h1 class="reunion-title" aria-label="${reunionTitle}">${titleCreative()}</h1>
        <p>20-year reunion · 26–28 December 2026 · Taj Amer, Jaipur</p>
        ${countdown()}
      </header>
      ${tracker?`<section class="reunion-confirmation" aria-label="Attendance confirmation">
        <strong>You’re confirmed for the reunion, ${e(member.name)}.</strong>
        ${party?`<p>${e(party)}</p>`:''}
        <div class="reunion-progress"><progress max="${critical}" value="${done}" aria-label="Reunion details complete">${done} of ${critical}</progress><span class="registry">${done} of ${critical} key details complete</span></div>
        ${missingDetails?'<p class="reunion-missing">Your attendance details are missing some important information. Please help us complete this.</p>':''}<a href="#reunion-details" data-reunion-details-open>Review your reunion details</a>
      </section>`:''}
      <section class="reunion-section" id="reunion-agenda"><h2>Reunion agenda</h2>
        <div class="reunion-days">${agenda.map(([date,theme,iso,rows,parallel])=>`<details>
          <summary><time datetime="${iso}">${e(date)}</time><span>${e(theme)}</span></summary>
          <ol class="reunion-timeline">${entries(rows)}</ol>
          ${parallel.length?`<h3>Activities for families and alumni</h3><ol class="reunion-timeline">${entries(parallel)}</ol>`:''}
        </details>`).join('')}</div>
      </section>
      ${tracker?`<section class="reunion-section" id="reunion-details">
        <details class="reunion-details-panel"${missingDetails||showSaved?' open':''}><summary><h2>Your reunion details</h2><span>${missingDetails?missing.length+' details to complete':'Complete · review or edit'}</span></summary>
        ${missingDetails?'<p class="reunion-priority"><strong>Please complete the highlighted fields.</strong> The reunion team needs this information to plan for you and your guests.</p>':''}
        <p>Use the pencil next to a field to update it. Your responses are visible to you and the reunion admins.</p>
        ${showSaved&&saved?'<p class="reunion-saved" role="status">Your reunion details are saved.</p>':''}
        ${group('Your group',
          `<div class="editable-field"><dt>Your name</dt><dd>${e(member.name)}</dd></div>`+
          row('shirt','Your T-shirt size',values.shirt,null,'text','Add size for your reunion kit')+
          row('spouse','Is your spouse or partner joining?',values.spouse,yesNo,'text','Confirm who’s joining')+
          row('children','How many children are joining?',values.children,names,'text','Confirm number of children')+
          row('help','Is a nanny or helper joining?',values.help,yesNo))}
        ${values.spouse==='1'?group('Spouse or partner',
          row('spouseName','Name',values.spouseName)+row('spouseShirt','T-shirt size',values.spouseShirt,null,'text','Add size for the reunion kit')+
          row('outing','Sunday outing',values.outing,outings,'text','Choose an outing or select Skip the outing')):''}
        ${kids}
        ${group('Hotel arrival and departure',
          row('bothNights','Staying both reunion nights?',values.bothNights,yesNo,'text','Confirm your hotel stay')+
          row('arrivalDate','Arrival date',values.arrivalDate,null,'date')+
          row('arrivalTime','Arrival time',values.arrivalTime,null,'time')+
          row('departureDate','Departure date',values.departureDate,null,'date')+
          row('departureTime','Departure time',values.departureTime,null,'time'))}
        </details>
      </section>`:''}
      <section class="reunion-section" id="reunion-attendees"><h2>Classmates attending</h2>${directory}</section>

    </div>`;
  },
  directory(rows,statuses,q,status,dorms,dorm,reunion=false,sections=[],section=''){return `<div class="classmates-directory"><form class="directory-controls" data-directory-filters method="get" action="${reunion?'/reunion#reunion-attendees':'/people'}">${input('q','Name, nickname or dorm',q)}${reunion?'':select('status','Attendance',[['','All classmates'],...Object.entries(statuses).filter(([,label])=>label)],status)}${dorms.length?select('dorm','Dorm',[['','All dorms'],...dorms.map(({dorm})=>[dorm,/^\d+$/.test(dorm)?'Dorm '+dorm:dorm])],dorm):''}${reunion?'':select('section','Section',[['','All sections'],...sections.map(({section})=>[section,section])],section)}<button>Search</button></form>
    ${rows.length?`<p class="registry directory-count">${rows.length} ${reunion?'attending':rows.length===1?'classmate':'classmates'}</p><div class="directory-grid">${rows.map(row=>`<a class="directory-card" href="/people/${row.id}">${portrait(row,true,256,'(max-width:650px) 42vw, 220px')}<div>${classmate(row,reunion||!row.section?[]:['Section '+row.section])}${!reunion&&row.status==='attending'?`<small class="attend-yes">${e(statuses[row.status]||'Attending')}</small>`:''}</div></a>`).join('')}</div>`:status==='attending'?'<p>No classmates are marked as attending for these filters.</p>':'<p>No classmates match.</p>'}</div>`;},
  person(row,status,details,photos,stories,me,pilot,composeKey,profilePhotos={},meet={available:false}){
    const own = me === row.id;
    const received = stories.filter(post=>post.author!==row.id);
    const shared = stories.filter(post=>post.author===row.id);
    const facts = ['dorm','nickname','city','country','company','education','section','family'];
    const hasValue = key => typeof details[key]==='string' && details[key].trim();
    const inHero = ['dorm','nickname','section'];
    // Visitors see only what is filled in, without repeating the hero's dorm, nickname and section.
    // Owners see their filled fields in place and every empty one gathered under "Complete your page".
    const factKeys = facts.filter(key=>hasValue(key)&&(own||!inHero.includes(key)));
    const allEntryKeys = Object.keys(details).filter(key=>!facts.includes(key)&&key!=='displayName'&&(hasValue(key)||(own&&key!=='researchHighlight')));
    const entryKeys = allEntryKeys.filter(key=>hasValue(key)&&key!=='life');
    const todoKeys = own ? [...facts,...allEntryKeys].filter(key=>!hasValue(key)) : [];
    const requirements=whatsappRequirements(details,profilePhotos),requiredKeys=new Set(['dorm','nickname','city','life','family']);
    const requiredTodo=todoKeys.filter(key=>requiredKeys.has(key)),optionalTodo=todoKeys.filter(key=>!requiredKeys.has(key));
    const requiredMark=key=>own&&requiredKeys.has(key)&&!hasValue(key)?'<span class="required-badge">Required to unlock</span>':'';
    const linkedin = /^https:\/\/(?:www\.)?linkedin\.com\/in\//i.test(row.linkedin||'')
      ? `<a class="profile-secondary" href="${e(row.linkedin)}" rel="noreferrer">LinkedIn${extIcon}</a>` : '';
    const profileLinks = (Array.isArray(row.profileLinks) ? row.profileLinks : []).flatMap(item => {
      if (typeof item?.label !== 'string' || !item.label.trim() || typeof item.url !== 'string') return [];
      try {
        const url = new URL(item.url);
        return url.protocol === 'https:' && !url.username && !url.password
          ? [`<li><a href="${e(url.href)}" rel="noreferrer">${e(item.label)}${extIcon}</a></li>`]
          : [];
      } catch { return []; }
    });
    const edit = (key,label,value,control=profileControl('value',key,value)) => own ? `<details class="inline-edit"><summary aria-label="Edit ${e(label)}" title="Edit ${e(label)}">${iconGraphic('edit')}</summary>
      ${form('/profile',field('field',key)+control,'Save','data-profile-edit')}</details>` : '';
    const entry = key => {
      const label = ({dorm:'Dorm number',nickname:'Dorm name'})[key] || labelFor(key);
      return `<div ${own?`id="profile-field-${key}" data-required-field="${key}" ${requiredKeys.has(key)&&!hasValue(key)?'data-required-missing':''}`:''} class="editable-field${key==='moment'?' entry-moment':''}${own&&requiredKeys.has(key)&&!hasValue(key)?' profile-required-missing':''}"><dt>${e(key==='city'?'Current city':label)}${requiredMark(key)}</dt><dd class="field-display">${details[key]?e(details[key]):'<span class="field-empty">Not added yet</span>'}</dd>${edit(key,label,details[key])}</div>`;
    };
    return `<div class="alumni-profile${own?' is-owner':''}">
      <header class="profile-header">
        <div class="profile-cover"></div>
        <div class="profile-identity">
          <div class="profile-portrait">${portrait(row,false,256)}
            ${own?`<form action="/profile" method="post" enctype="multipart/form-data" data-profile-edit>
              ${field('field','portraitObject')}<input type="file" name="photo" accept="image/jpeg,image/png" hidden>
              ${icon('edit','Upload profile photo','data-upload')}</form>`:''}</div>
          <div class="profile-name editable-field"><h1 class="field-display">${e(details.displayName||row.name)}</h1>
            ${hasValue('nickname')?`<p class="nickname">“${e(details.nickname)}”</p>`:''}
            ${(()=>{const reg=[hasValue('section')&&'Section '+details.section,hasValue('dorm')&&dormLabel(details.dorm.trim()),'PGP 2004–06'].filter(Boolean).join(' · ');return `<p class="registry profile-registry">${e(reg)}</p>`;})()}
            ${hasValue('life')?`<div id="profile-field-life" data-required-field="life" class="editable-field profile-lede-field"><h2 class="profile-lede-label">Life, Lately</h2><p class="profile-lede field-display">${e(details.life)}</p>${edit('life',labelFor('life'),details.life)}</div>`:''}
            ${edit('displayName','Name',details.displayName||row.name)}
            <div class="editable-field profile-rsvp">
              ${status?`<span class="profile-status field-display">${e(status)}</span>`:''}
              ${edit('attendance','Reunion attendance','',select('value','Reunion attendance',[['unknown','Choose an option'],['attending','Attending'],['declined','Not attending']],row.own_attendance||''))}
            </div>
          </div>
          <div class="profile-actions">
            ${own?'<a class="edit-toggle" href="/profile">Edit profile</a>':''}
            ${!own&&meet.available?(meet.wanted
              ? meetForm('remove',row.id,'/people/'+row.id,checkIcon+(meet.accepted?'Catch-up accepted':'Request sent'),'is-on')
              : meetForm('add',row.id,'/people/'+row.id,'Ask to catch up with '+e((details.displayName||row.name).split(/\s+/)[0]))):''}
            ${linkedin}
          </div>
        </div>
      </header>
      ${own?whatsappUnlock(requirements,me,true):''}
      ${pilot?'<p class="profile-pilot">Profiles are being checked during the pilot.</p>':''}
      <div class="profile-layout${factKeys.length||photos.length||todoKeys.length?'':' profile-layout-wide'}">
        ${factKeys.length||photos.length||todoKeys.length?`<aside class="profile-sidebar">
          ${factKeys.length?`<section class="profile-section"><h2>About</h2><dl class="profile-facts">${factKeys.map(entry).join('')}</dl></section>`:''}
          ${todoKeys.length?`<section class="profile-section profile-todo${requiredTodo.length?' has-required':''}"><details${requiredTodo.length?' open':''}><summary><h2>${requiredTodo.length?'The essentials':'More about you'}</h2><span class="registry">${requiredTodo.length?requiredTodo.length+' to add':'Only if you’d like to share more'}</span></summary>
            ${requiredTodo.length?`<dl class="profile-facts">${requiredTodo.map(entry).join('')}</dl>`:''}
            ${optionalTodo.length?`<details class="optional-profile-fields"><summary>More details to share</summary><dl class="profile-facts">${optionalTodo.filter(key=>!['outsideWork','moment','firstDayAdvice','anythingElse'].includes(key)).map(entry).join('')}</dl></details>`:''}</details></section>`:''}
          ${photos.length?`<section class="profile-section profile-photos"><div class="profile-section-head"><h2>Photos</h2>
            <a href="/gallery?person=${row.id}">View all</a></div>${images(photos.slice(0,4))}</section>`:''}
        </aside>`:''}
        <div class="profile-main">
          ${own&&meet.available?`<section class="profile-section profile-meet" id="meet"><h2>Looking to catch up</h2>
            <p class="meet-count">${meetCountLine(meet.count)}</p>
            <p class="meet-hint">Send a request to a classmate to arrange a catch-up.</p>
            ${meet.incoming?.length&&!meet.unlocked?catchupLocked(meet.count,me,true):''}
            ${meet.unlocked&&meet.incoming?.length?`<h3>Requests received</h3><ul class="meet-list">${meet.incoming.map(person=>`<li><a href="/people/${person.id}">${portrait(person,true,96)}<span><strong>${e(person.name)}</strong><small>${person.accepted_at?'Accepted':'Wants to catch up with you'}</small></span></a>${person.accepted_at?'<span class="meet-status">Accepted</span>':meetForm('accept',person.id,'/people/'+me+'#meet','Accept request','',person.request_id)}</li>`).join('')}</ul>`:''}
            ${meet.picked.length?'<h3>Requests sent</h3>':''}
            ${meet.picked.length?`<ul class="meet-list">${meet.picked.map(person=>`<li><a href="/people/${person.id}">${portrait(person,true,96)}<span><strong>${e(person.name)}</strong><small>${person.accepted_at?'Accepted':'Awaiting response'}</small></span></a>${meetForm('remove',person.id,'/people/'+me+'#meet','Remove','meet-remove')}</li>`).join('')}</ul>`:''}
            <div class="meet-search" data-meet-picker data-picked="${meet.picked.map(person=>person.id).join(',')}">
              <label>Add a WIMWIan<input type="search" data-meet-search placeholder="Type a name or nickname" autocomplete="off"></label>
              <div data-meet-results role="listbox" aria-label="Matching classmates"></div>
              <form method="post" action="/meet" data-meet-add hidden>${field('action','add')}<input type="hidden" name="target" value="">${field('next','/people/'+me+'#meet')}</form>
              <noscript><p class="meet-hint">Or open any WIMWIan’s profile and press “Ask to catch up”.</p></noscript>
            </div></section>`:''}
          ${own||Object.keys(profilePhotos).length?`<section class="profile-section profile-then-now"><h2>Then / Now</h2>
            <div class="then-now-grid">${['then','now'].map(slot=>{
              const photo=profilePhotos[slot], label=slot==='then'?'Then':'Now';
              return `<div ${own?`id="profile-field-${slot}" data-required-field="${slot}" ${!photo?'data-required-missing':''}`:''} class="then-now-slot${own&&!photo?' profile-required-missing':''}"><h3>${label} <span>${slot==='then'?'2006':'2026'}</span></h3>${own&&!photo?'<p class="required-badge">Required to unlock</p>':''}
                ${photo?`<a href="/media/${e(photo.media)}"><img src="${mediaSrc(photo.media,480)}" alt="${e(photo.caption||label+' photo of '+row.name)}" loading="lazy"></a>`:
                 `<p>${own?'Add a '+label.toLowerCase()+' photo.':'No photo shared.'}</p>`}
                ${own?`<form action="/profile" method="post" enctype="multipart/form-data" data-profile-edit>
                  ${field('field',slot+'PhotoObject')}<input type="file" name="photo" accept="image/jpeg,image/png" hidden>
                  <button type="button" data-upload class="required-photo-button" aria-label="Upload ${label} photo">${photo?'Change':'Add'} ${label} photo</button></form>`:''}</div>`;
            }).join('')}</div></section>`:''}
          ${own?`<section class="profile-section" id="a-little-more-you">${moreYouIntro}${['outsideWork','moment','firstDayAdvice','anythingElse'].map(key=>`<div class="profile-story-prompt"><form method="post" action="/profile" data-profile-edit>${field('field',key)}${profileControl('value',key,details[key])}<button type="submit">Save answer</button></form></div>`).join('')}</section>`:''}
          ${entryKeys.length?`<section class="profile-section"><dl class="profile-entry">${entryKeys.map(entry).join('')}</dl></section>`:''}
          ${profileLinks.length?`<section class="profile-section"><h2>Selected links</h2><ul>${profileLinks.join('')}</ul></section>`:''}
          <section class="profile-section profile-memories"><div class="profile-section-head"><h2>Memories from classmates</h2>${own?'':`<a class="profile-primary" href="/compose?person=${row.id}" data-compose-open>Add a memory about this classmate</a>`}</div>
            ${received.length?memoryBatch(received):'<p class="profile-empty">No memories have been shared about this classmate yet.</p>'}
          </section>
          ${shared.length?`<section class="profile-section profile-memories"><h2>Memories shared</h2>${memoryBatch(shared)}</section>`:''}
        </div>
      </div>
      ${memoryDialog()}
      ${own?'':page.composeDialog(composeKey,[{value:'person:'+row.id,label:row.name}])}
      ${own?'':`<div class="profile-report">${report('profile',row.id)}</div>`}
    </div>`;
  },
  editProfile(fields,member,checks=[]){
    const required=['dorm','nickname','city','life','family'],optional=['company','education'];
    const rows=keys=>keys.map(k=>`<div class="${required.includes(k)&&!String(fields[k]||'').trim()?'profile-required-missing':''}">${required.includes(k)?'<small>Required to unlock</small>':''}${profileControl(k,k,fields[k])}${checkbox('hide_'+k,'Hide '+labelFor(k),fields[k]==='')}</div>`).join('');
    return `<p><a href="/people/${member.id}">Back to my profile</a></p><p>Complete the essentials to unlock memories, WhatsApp Insights and incoming catch-up names. Write a few sentences for the story questions so your batchmates can catch up with you. Hiding a required detail keeps access locked.</p>`+
      form('/profile','<fieldset><legend>The essentials · 5 required details</legend>'+rows(required)+'</fieldset><section class="panel"><h2>Your work and studies</h2><p>Add these if you’d like to share more.</p>'+rows(optional)+'</section>'+checkbox('attendance_private','Hide my attendance status',!!member.attendance_private),'Save profile')+
      `<section class="panel"><h2>Then / Now · 2 required photos</h2><p>Add these on your profile page. Your profile picture does not count as either photo.</p><ul class="unlock-checklist">${['then','now'].map(key=>`<li><a href="/people/${member.id}?complete=whatsapp#profile-field-${key}">${key==='then'?'Then photo (2006)':'Now photo (2026)'}</a><small>${checks.find(item=>item.key===key)?.complete?'Complete':'Required'}</small></li>`).join('')}</ul></section>`+
      `<section class="panel" id="a-little-more-you">${moreYouIntro}${['outsideWork','moment','firstDayAdvice','anythingElse'].map(key=>form('/profile',field('field',key)+profileControl('value',key,fields[key]),'Save answer')).join('')}</section>`;
  },
  images,
  topics(rows,q){return `<form method="get">${input('q','Find a memory topic',q)}<button>Search</button></form><p>${link('/compose','Create a topic and add a memory')}</p>`+list(rows.map(r=>link('/topics/'+r.id,r.title)+' '+badge(r.kind)),'No topics yet.');},
  topic(row,rows){return `${badge(row.kind)}<p>${link('/compose?topic='+row.id,'Add your memory')}</p>${memoryBatch(rows)}${memoryDialog()}${report('topic',row.id)}`;},
  composeDialog(key,selected=[]){return `<dialog class="memory-dialog compose-dialog" aria-label="Add a memory">${icon('close','Close','data-close')}<h2>Add a memory</h2>${page.compose(key,selected)}</dialog>`;},
  compose(key,selected=[]){
    const chip = ({value,label}) => `<span class="topic-chip">${field('about',value)}<span>${value.startsWith('person:')?'@':'#'}${e(label)}</span><button type="button" data-remove-topic aria-label="Remove ${e(label)}">×</button></span>`;
    return form('/compose',field('id',key)+area('body','What do you remember?','','maxlength="4000" placeholder="Share a story or add a caption…"')+
      `<label class="memory-file-picker">Add photos<input type="file" name="images" accept="image/jpeg,image/png" multiple></label>
      <div data-album-title hidden>${input('title','Album title','','maxlength="120"')}</div>
      <p data-cover-hint hidden>Tap a thumbnail to choose the album cover.</p>
      <ol class="photo-queue" data-photo-queue></ol>
      <div class="memory-targets"><label>Add tags<input type="search" data-target-search placeholder="@classmate or #place or event" autocomplete="off"></label>
        <div data-target-results></div><div data-topic-chips>${selected.map(chip).join('')}</div>
      </div>
      <p data-compose-status role="status"></p>`,'Publish memory','enctype="multipart/form-data" data-compose');},
  post(item,comments,tags,photos,me,commentPosted=false){
    const url='/posts/'+item.id;
    const isAlbum=photos.length>1;
    const caption=['Shared a yearbook photo.','Shared a photo.'].includes(item.body)?'':item.body;
    const gallery=isAlbum?`<section aria-label="Album photos" class="album-panels memory-collage">${photos.map((photo,i)=>`<article class="album-photo-panel collage-card" data-post="${e(item.id)}" data-photo-scope="${e(photo.media)}" id="photo-${e(photo.media.replaceAll('/','-'))}">
      <a data-album-photo href="/media/${e(photo.media)}"><img src="${mediaSrc(photo.media,480)}" srcset="${mediaSet(photo.media,[480,768,1200])}" sizes="(max-width: 490px) 95vw, (max-width: 850px) 45vw, 400px" alt="${e(photo.caption||'Album photo '+(i+1))}" loading="lazy" decoding="async"></a>
      <div class="album-photo-footer"><span>Photo ${i+1} of ${photos.length}</span>${photo.caption?`<p>${e(photo.caption)}</p>`:''}
        <div data-memory-tags>${memoryTags(photo)}</div>${tagControls('this photo')}</div></article>`).join('')}</section>
      <dialog class="memory-dialog album-viewer" aria-label="Album photo">${icon('close','Close','data-close')}<img alt=""><div><button type="button" data-album-prev>Previous</button><span role="status"></span><button type="button" data-album-next>Next</button></div></dialog>`:images(photos);
    return `<article class="memory-detail" data-post="${e(item.id)}">${memoryAuthor(item)}${caption?`<p class="story">${e(caption)}</p>`:''}
      ${isAlbum?`<p>${photos.length} photos</p>`:gallery}
      <div data-memory-tags>${memoryTags(item)}</div>${tagControls(isAlbum?'the album':'this memory')}
      ${action(url,'like',item.liked?'Unlike':'Like',{liked:item.liked?0:1})} ${badge(item.likes+' likes')}</article>${isAlbum?gallery:''}`+
      (item.author===me?`<details><summary>Edit memory</summary>${form(url,field('action','edit')+area('body','Memory',caption,photos.length?'':'required'),'Save')}</details>${action(url,'delete','Delete memory')}`:'')+
      (item.subject===me||item.is_about_me?action(url,'unassociate','Remove from my profile'):'')+report('post',item.id)+
      (tags.length?'<h2>Tags</h2>'+list(tags.map(t=>link('/people/'+t.member,t.name)+' '+badge(t.status)+
       (t.member===me?(t.status==='pending'?action(url,'tag-accept','Accept tag'):'')+action(url,'tag-remove','Remove tag'):'')),''):'')+
      '<h2 id="comments">Comments</h2>'+list(comments.map(c=>`<div class="comment-row" id="comment-${e(c.id)}">${link('/people/'+c.author,c.name)}${c.author===me?
      `<details class="comment-menu"><summary aria-label="Comment options">⋯</summary><div>${action(url,'delete-comment','Delete comment',{comment:c.id})}</div></details><details><summary>Edit comment</summary>${form(url,field('action','edit-comment')+field('comment',c.id)+input('body','Comment',c.body,'required'),'Save')}</details>`:''}${report('comment',c.id)}<p class="story">${e(c.body)}</p></div>`),'No comments yet.')+
      (()=>{const composer=form(url,field('action','comment')+area('body','Add a comment','','required maxlength="1200"'),'Post comment');return commentPosted?`<details><summary>Add another comment</summary>${composer}</details>`:composer;})();
  },
  notifications(rows,me,unlocked=true){
    const labels={mention:'mentioned you',like:'liked your memory',comment:'commented on your memory',tag:'added a tag to your memory',catchup_request:'wants to catch up with you',catchup_accepted:'accepted your catch-up request'};
    const dates=new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'});
    return `<div class="notification-actions">${rows.some(n=>!n.is_read)?form('/notifications',field('action','read-all'),'Mark all read'):''}
      ${rows.some(n=>n.sample)?form('/notifications',field('action','clear-samples'),'Remove test notifications'):''}</div>
      ${rows.length?`<section aria-label="Recent activity" class="notification-feed">${rows.map(n=>{
        if(n.kind==='catchup_request'&&!unlocked)return `<article class="notification-card${n.is_read?'':' new'}"><p class="notification-locked-label">${n.is_read?'Catch-up request':'New catch-up request'}</p>${catchupLocked(1,me)}</article>`;
        const url='/notifications?open='+n.id;
        const catchup=n.kind==='catchup_request'||n.kind==='catchup_accepted';
        const requestAction=n.kind==='catchup_request'?(n.meet_request?(n.meet_accepted?'<p class="meet-status">You accepted this request.</p>':meetForm('accept',n.actor,'/notifications','Accept request','notification-accept',n.meet_request)):'<p class="meet-hint">This request is no longer active.</p>'):'';
        const body=['Shared a yearbook photo.','Shared a photo.'].includes(n.memory_text)?'':n.memory_text;
        const photo=n.anchor.startsWith('photo-');
        const summary=n.comment_text||body;
        return `<article class="notification-card${n.is_read?'':' new'}">
          <div class="notification-byline">
             ${n.actor_name?`<a href="/people/${n.actor}">${portrait({name:n.actor_name,portrait:n.actor_portrait})}${e(n.actor_name)}</a>`:`<strong>${n.sample?'Test activity':'A classmate'}</strong>`}
            <small>${n.sample?'Test · ':''}${dates.format(n.created*1000)}${n.is_read?'':' · Unread'}</small>
          </div>
          <a class="notification-preview" href="${url}">
            ${n.preview_media?`<img src="${mediaSrc(n.preview_media,256)}" srcset="${mediaSet(n.preview_media,[256,480])}" sizes="(max-width: 600px) 100px, 170px" alt="${photo?'Tagged photo':'Memory preview'}" loading="lazy">`:''}
            <div><strong>${labels[n.kind]}${photo?' on a photo':''}</strong>
              ${n.album_title?`<span class="notification-album">${e(n.album_title)}</span>`:''}
              ${summary?`<p>${e(summary.slice(0,240))}${summary.length>240?'…':''}</p>`:''}
              <span class="notification-open">${n.kind==='comment'&&!n.sample?'View comment':photo?'View photo':n.post?'Open memory':catchup?'View catch-up':'Mark as read'}</span>
            </div>
          </a>
          ${requestAction}
        </article>`;
      }).join('')}</section>`:'<p>No notifications yet.</p>'}`;
  },
  analytics(totals,pages,events,days,next){
    const labels={page_view:'Page view',sign_in:'Successful sign-in',email_accepted:'Email accepted by provider',email_failed:'Email request failed',link_invalid:'Invalid or expired link'};
    const time=new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'});
    return `<p>${link('/admin','Back to admin')} · ${link('/admin/analytics?days=30','30 days')} · ${link('/admin/analytics?days=90','90 days')} · ${link('/admin/analytics?days='+days+'&format=json','Export events')}</p>
      <h2>Last ${days} days</h2>${list(totals.map(r=>e(labels[r.event])+ ' · '+r.total+
        (r.event==='page_view'?' · '+r.members+' signed-in classmates · '+r.anonymous+' anonymous views':'')),'No activity yet.')}
      <h2>Most viewed pages</h2>${list(pages.map(r=>e(r.path)+' · '+r.total),'No page views yet.')}
      <h2>Recent activity (IST)</h2>${list(events.map(r=>e(time.format(r.occurred))+' · '+e(r.name||'Anonymous')+' · '+e(labels[r.event])+' · '+e(r.path)),'No activity yet.')}
      ${next?'<p>The export includes a link to the next batch of events.</p>':''}`;
  },
  adminSummary(coverage,attendees){
    const stats=[
      ['Yearbook submissions',coverage.filter(r=>r.submitted).length,coverage.length],
      ['Profile details saved on this site',coverage.filter(r=>r.edited).length,coverage.length],
      ['Photo available',coverage.filter(r=>r.portrait||r.has_photos).length,coverage.length],
      ['Enriched information',coverage.filter(r=>r.enriched).length,coverage.length],
      ['Attendees with all critical details',attendees.filter(r=>!r.missing.length).length,attendees.length],
      ['Attendees with all applicable T-shirt sizes',attendees.filter(r=>!r.missing.some(field=>/T-shirt|Spouse attendance|Number of children/.test(field))).length,attendees.length]
    ];
    const yes=value=>value?'Yes':'Missing';
    const table=(head,rows)=>`<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${head.map(label=>`<th scope="col">${e(label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(([person,...cells])=>`<tr><th scope="row">${link('/people/'+person.id,person.name)}</th>${cells.map(value=>`<td>${e(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<p>${link('/admin?view=tools','Admin tools')} · ${link('/admin/analytics','Site analytics')} · ${link('/admin/export?kind=reunion','Download attendee logistics')}</p>
      <div class="admin-stats">${stats.map(([label,number,total])=>`<div><strong>${number} / ${total}</strong><span>${e(label)}</span></div>`).join('')}</div>
      <h2>Confirmed attendees</h2><p>See which critical details are missing, including sizes for everyone in the party.</p>
      ${table(['Classmate','Details saved','Missing critical details'],attendees.map(row=>[row,row.saved?'Yes':'Tracker only',row.missing.join(', ')||'Complete']))}
      <h2>Classmate profiles</h2>
      ${table(['Classmate','Yearbook submitted','Profile details saved','Photo','Enriched information'],coverage.map(row=>[row,yes(row.submitted),yes(row.edited),yes(row.portrait||row.has_photos),yes(row.enriched)]))}`;
  },
  admin(reports,seeds,topics,memories){const actions=['invite','revoke','approve-seed','hold-seed','resolve-report','hide-post','restore-post','hide-comment','restore-comment','rename-topic','hide-topic','merge-topic','publish-memory'];
    return `<p>${link('/admin','Back to summary')} · ${link('/admin/analytics','Site analytics')}</p><h2>Reports</h2>${list(reports.map(r=>`<strong>${e(r.target_type)} ${e(r.target)}</strong><br>${e(r.reason)}<br>Report ID ${e(r.id)}`),'No open reports.')}
      <h2>Take action</h2>${form('/admin',select('action','Action',actions.map(a=>[a,a.replaceAll('-',' ')]))+input('target','Target ID','','required')+
      input('reason','Reason','','required')+input('into','Merge destination topic ID')+input('title','New topic title'),'Apply action')}
      <h2>Reunion tracker</h2><p>${link('/admin/export?kind=reunion','Download attendee logistics')}</p>${form('/admin',field('action','attendance-preview')+area('rsvp','CSV with roster_id,status (attending, declined, unknown)','','required'),'Preview import')}
      <p>${link('/admin/export','Submission data')} · ${link('/admin/export?kind=pending','Pending contact data')}</p>
      <details><summary>Yearbook memories awaiting publication</summary>${list(memories.map(m=>e(m.name)+' · '+e(m.id)),'No pending memories.')}</details>
      <details><summary>Profile seeds</summary>${list(seeds.map(s=>`${link('/people/'+s.roster_id,s.name)} · ${e(s.roster_id)} · ${e(s.review_status)}`),'No seeds.')}</details>
      <details><summary>Topic IDs</summary>${list(topics.map(t=>link('/topics/'+t.id,t.title)+' · '+e(t.id)),'No topics.')}</details>`;
  },
  attendancePreview(rows,csv){return `<p>${rows.length} RSVP updates.</p>${list(rows.map(r=>e(r.join(' · '))),'')}${form('/admin',field('action','attendance-apply')+field('rsvp',csv),'Apply import')}`;}
};

export function signIn({ selected, maskedEmail, next, mailHelp, feedback }) {
  const selection = selected ? `
    <div class="selection">
      <strong>${e(selected.name)}</strong>
      <p>${e(maskedEmail || 'No usable email on file')}</p>
      <div class="request-feedback" role="status">${e(feedback)}</div>
      ${maskedEmail?'<p class="instructions">If your sign-in email doesn’t arrive, check your Spam or Junk folder.</p>':''}
      ${maskedEmail && !feedback.startsWith('Check your inbox') ? form('/request-link',field('id',selected.id)+field('next',next),'Email me a sign-in link') : ''}
      <p class="help">Need to edit this email or email unavailable? Email <a href="${e(mailHelp)}">Tahseen and Arun</a>.</p>
    </div>` : '';
  return new Response(`<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(shareTitle)}</title>
  <link rel="icon" href="/campus/logo.png">
  <link rel="preload" href="/fonts/source-serif-4.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/source-sans-3.woff2" as="font" type="font/woff2" crossorigin>
  ${shareMeta}
  <style>
    ${fontFaces}
    ${tokens}
    :root { --accent:var(--brick); font:16px/1.55 var(--sans) }
    * { box-sizing:border-box }
    body { margin:0; background:var(--lime); color:var(--ink) }
    a { color:var(--accent); text-decoration:none }
    a:hover { text-decoration:underline }
    :focus-visible { outline:2px solid var(--brick-fired); outline-offset:2px }
    .shell { background:linear-gradient(90deg,#1c1816e6,#1c181670),url('/campus/arches.webp') center/cover; background-color:var(--night) }
    .masthead { min-height:47px; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:5px clamp(16px,5vw,64px); position:sticky; top:0; z-index:3; background:var(--paper); border-bottom:3px solid var(--brick) }
    .brand { display:flex; align-items:center; gap:10px; color:var(--ink); font:700 1.05rem var(--serif) }
    .brand small { font:600 .72rem var(--sans); letter-spacing:.12em; text-transform:uppercase; color:var(--muted); padding-left:.6rem; border-left:1px solid var(--concrete) }
    .mark { width:29px; height:29px; object-fit:contain; mix-blend-mode:multiply }
    .sign-in-campus { min-height:calc(100svh - 47px); display:grid; align-items:center; padding:clamp(24px,7vw,100px) clamp(16px,7vw,100px) }
    .layout { width:min(1120px,100%); margin:auto; display:grid; grid-template-columns:minmax(0,1.35fr) minmax(300px,1fr); align-items:center; gap:clamp(20px,5vw,74px) }
    .intro { color:#fff3e3 }
    h1,h2 { margin:0; line-height:1.08 }
    html { font-synthesis:none; font-optical-sizing:auto }
    .reunion-title { font:700 clamp(2.8rem,6.7vw,6rem)/1 var(--serif); letter-spacing:-.018em; display:flex; flex-wrap:wrap; align-items:baseline; gap:0 .24em }
    .reunion-title [aria-hidden] { color:var(--brick-fired); font-size:.55em }
    .theme-switch { margin:0 } .theme-switch button { padding:.3rem .7rem; border-radius:999px; background:transparent; color:var(--ink); border:1px solid var(--concrete); font:600 .78rem var(--sans) }
    :root[data-theme=dark] .theme-switch .to-dark, :root:not([data-theme=dark]) .theme-switch .to-light { display:none }
    :root[data-theme=dark] .mark { mix-blend-mode:normal; background:#fffcf6; border-radius:50%; padding:2px }
    :root[data-theme=dark] .card { box-shadow:0 18px 50px #00000080 }
    .eyebrow { margin:0 0 .6rem; font:500 .75rem var(--mono); letter-spacing:.08em; text-transform:uppercase; color:#f3e4dc }
    .card { background:var(--paper); border:1px solid var(--line); border-top:3px solid var(--brick); border-radius:50% 50% var(--r) var(--r)/28px 28px var(--r) var(--r); padding-top:clamp(28px,4vw,44px)!important; padding:clamp(18px,3vw,35px); box-shadow:0 18px 50px #1c181650 }
    h2 { font:650 clamp(1.6rem,3vw,2.1rem)/1.1 var(--serif); letter-spacing:-.015em }
    p { margin:.65rem 0 }
    .instructions,.help,.selection p { color:var(--muted); font-size:.92rem }
    label { display:block; margin-top:20px; font-weight:600; font-size:.72rem; letter-spacing:.09em; text-transform:uppercase; color:var(--brick) }
    .search { display:flex; align-items:center; gap:10px; border:1px solid var(--concrete); background:var(--paper); border-radius:var(--r-sm); padding:0 12px; margin-top:7px }
    .search svg { flex:0 0 18px; color:var(--muted) }
    .search:focus-within { outline:2px solid var(--accent); outline-offset:2px }
    input { width:100%; min-width:0; outline:none; border:0; background:transparent; padding:12px 0; color:var(--ink); font:inherit }
    input:focus-visible { outline:none }
    ul { list-style:none; margin:6px 0 0; padding:0; font-size:.92rem }
    ul:empty { display:none }
    li a { display:block; padding:7px 9px; border-radius:7px }
    li a:hover { background:var(--brick-wash) }
    .selection { margin-top:16px; border-top:1px solid var(--line); padding-top:16px; overflow-wrap:anywhere }
    .selection p { margin:.15rem 0 .7rem }
    button { padding:11px 16px; border:0; border-radius:var(--r-sm); background:var(--brick); color:white; font:600 .92rem/1.4 var(--sans); cursor:pointer }
    button:hover { background:var(--brick-deep) }
    .help { margin:20px 0 0 }
    @media(max-width:750px) {
      .masthead { min-height:44px }
      .sign-in-campus { min-height:calc(100svh - 44px); align-items:start; padding:1rem .85rem }
      .layout { grid-template-columns:1fr; margin:0 auto; gap:.85rem }
      .reunion-title { font-size:clamp(1.9rem,8vw,3.4rem) }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="masthead">
      <a href="/" class="brand"><img class="mark" src="/campus/logo.png" alt="">IIMA <small>Class of 2006</small></a>
      ${themeSwitch()}
    </header>
    <main class="sign-in-campus">
      <div class="layout">
        <div class="intro"><p class="eyebrow">IIM Ahmedabad · PGP 2004–06</p><h1 class="reunion-title" aria-label="${reunionTitle}">${titleCreative()}</h1></div>
        <section class="card" aria-labelledby="sign-in-title">
          <h2 id="sign-in-title">Sign in</h2>
          ${!selected&&feedback?`<p role="status" class="help">${e(feedback)}</p>`:''}
          <p class="instructions">Find your name and we’ll send a sign-in link to your email on the batch roster.</p>
          <label for="name-search">Find your name</label>
          <div class="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.2 4.2"/></svg>
            <input id="name-search" type="search" autocomplete="off" placeholder="Start typing your name" data-next="${e(next)}">
          </div>
          <ul id="name-results" aria-live="polite"></ul>
          ${selection}

        </section>
      </div>
    </main>
  </div>
  <script src="/picker.js" defer></script>
</body>
</html>`,{headers:{'Content-Type':'text/html; charset=utf-8'}});
}
