import {studioHTML,studioJS} from './memory-wall-studio.mjs';
import {candidateSQL,classify,selectWalls,dryRun as memoryWallDryRun} from './memory-wall-selection.mjs';
import {isMemorial, loadTribute, memorialPhotos} from './memorial.mjs';
import { render, signIn, page, form, field, escape, whatsappRequirements, whatsappUnlock, reunionCatchups, siteCSS, siteCSSVersion } from './views.mjs';
import { fonts } from './fonts.mjs';
import { whatsappRoute } from './whatsapp.mjs';
export { FaceContainer } from './faces.mjs';
import { SCAN_ALL_PEOPLE, faceAdminData, faceCron, faceRoute, faceSchema, forgetPostFaces, forgetTopicFaces, faceNudge, handleQueue, markRefs, photosOfYou, publishShadow, sweep } from './faces.mjs';
import { completedProfilesCTE } from './completion.mjs';
import { iimagesSchema, setYearbookHidden, yearbookEntry, yearbookPhotoKey } from './iimages2006.mjs';

import { editReunionDetail, missingReunionDetails, reunionDetails, reunionValues } from './reunion.mjs';

// Short-lived per-isolate cache, only reached after admin authorization.
let memoryWallCache;
async function cachedMemoryWalls(db) {
  if(memoryWallCache?.db===db && memoryWallCache.until>Date.now())return memoryWallCache.promise;
  const entry={db,until:Date.now()+120000,promise:memoryWallDryRun(db)};
  memoryWallCache=entry;
  try{return await entry.promise;}catch(error){if(memoryWallCache===entry)memoryWallCache=undefined;throw error;}
}
const photoWidths = new Set(['96','256','480','768','1200']);
// Sizes generated right after upload: memory cards and viewers, and profile portraits / Then-Now photos.
const memoryWidths = ['480','1200'];
const profileWidths = ['96','256','480'];
const campusAssets = {
  'arches.webp':'image/webp', 'steps.webp':'image/webp', 'light.webp':'image/webp', 'logo.png':'image/png',
};
const encoder = new TextEncoder();
const id = () => crypto.randomUUID();
const now = () => Date.now();
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
  typeof value === 'string' ? encoder.encode(value) : value)), byte => byte.toString(16).padStart(2, '0')).join('');
const cookie = (token, age) => `__Host-alumni=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const redirect = (url, headers = {}) => new Response(null, {status:303, headers:{Location:url,...headers}});
const missing = () => new Response('Page unavailable', {status:404});
const invalid = message => new Response(message, {status:400});
const json = data => Response.json(data);
const destination = value => /^\/(?![\/\\])[^\r\n\\]*$/.test(String(value)) ? String(value) : '/';
const str = (data, key, limit = 4000) => String(data.get(key) ?? '').trim().slice(0,limit);
const profileKeys = ['life','city','company','education','dorm','family','nickname','interests','outsideWork','moment','firstDayAdvice','reunionStory','anythingElse','extra','prompt','printName'];
const attendanceNames = {attending:'Attending',declined:'Not attending',unknown:''};
const parse = value => { try { return JSON.parse(value) ?? {}; } catch { return {}; } };
const encode = encodeURIComponent;
function photosForTags(links) {
  const photos=new Map();
  for(const link of links) {
    if(!photos.has(link.media)) photos.set(link.media,[]);
    photos.get(link.media).push(link);
  }
  return photos;
}

export default {
  queue: (batch, env) => handleQueue(batch, env),
  scheduled: (event, env) => faceCron(env),
  async fetch(request, env, ctx) {
    try {
      const path=new URL(request.url).pathname;
      let viewer=null;
      const record=(event,member,path)=>{
        const write=env.DB.prepare('INSERT INTO site_events(occurred,member,event,path) VALUES(?,?,?,?)')
          .bind(now(),member,event,path).run().catch(()=>{});
        if(ctx) ctx.waitUntil(write);
        return write;
      };
      let response = await route(request, env, record, member=>{viewer=member;}, ctx);
      if (env.PREVIEW_LABEL && response.headers.get('Content-Type')?.includes('text/html')) {
        const html=(await response.text()).replace(/<body\b[^>]*>/,tag=>tag+'<div role="note" style="padding:6px 12px;text-align:center;background:#e4c58b;color:#251b14;font:600 12px/1.4 sans-serif">'+escape(env.PREVIEW_LABEL)+'</div>');
        response=new Response(html,{status:response.status,headers:response.headers});
      }
      // Dark is the default; a visitor who picked light gets the attribute flipped before the page leaves.
      if (/(?:^|;\s*)theme=light(?:;|$)/.test(request.headers.get('Cookie')||'') && response.headers.get('Content-Type')?.includes('text/html')) {
        const html = (await response.text()).replace('<html lang="en" data-theme="dark"','<html lang="en" data-theme="light"');
        response = new Response(html,{status:response.status,headers:response.headers});
      }
      const acceptedPage=/^\/(?:$|signin$|memories$|people(?:\/\d+)?$|reunion$|gallery$|photos-of-you$|topics(?:\/[\w-]+)?$|posts\/[\w-]+$|notifications$|compose$|wa\/(?:batch)?$)/;
      const automated=/bot|crawler|spider|preview|whatsapp|facebookexternalhit/i.test(request.headers.get('User-Agent')||'');
      const intent=(request.headers.get('Sec-Purpose')||'')+' '+(request.headers.get('Purpose')||'');
      if(request.method==='GET' && response.ok && acceptedPage.test(path) &&
        response.headers.get('Content-Type')?.includes('text/html') && !automated && !/prefetch|prerender/i.test(intent))
        {
          const pending=record('page_view',viewer,path);
          if(!ctx) await pending;
        }
      if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control','private, no-store');
      response.headers.set('X-Content-Type-Options','nosniff');
      if (!response.headers.has('Referrer-Policy')) response.headers.set('Referrer-Policy','strict-origin');
      if (!response.headers.has('Content-Security-Policy')) response.headers.set('Content-Security-Policy',"default-src 'none'; img-src 'self' blob: https://archives.iima.ac.in; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
      return response;
    } catch (error) { if (env.DIAGNOSTICS === 'true') console.error(error.name, error.message);
      return new Response('The site could not complete that request. Please try again.', {status:500});
    }
  }
};

async function route(req, env, record, setViewer, ctx) {
  const u = new URL(req.url), path = u.pathname, post = req.method === 'POST';
  const db = env.DB;
  // The isolated preview is invitation-only; no production account or resources are used.
  if(env.PREVIEW_LABEL && env.MEMORIAL_PREVIEW_KEY){
    const access=req.headers.get('Cookie')?.match(/(?:^|;\s*)memorial-preview=([a-f0-9]+)/)?.[1];
    if(path==='/preview-access' && u.searchParams.get('key')===env.MEMORIAL_PREVIEW_KEY)
      return redirect('/',{'Set-Cookie':'memorial-preview='+env.MEMORIAL_PREVIEW_KEY+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400','Referrer-Policy':'no-referrer'});
    if(access!==env.MEMORIAL_PREVIEW_KEY)return new Response('Private preview. Use your invitation link.',{status:403});
  }
  const sql = (query, ...args) => db.prepare(query).bind(...args);
  const one = (query, ...args) => sql(query,...args).first();
  const all = async (query,...args) => (await sql(query,...args).all()).results;
  const run = (query,...args) => sql(query,...args).run();
  const pilot = env.ACCESS_MODE !== 'batch';
  if (post && req.headers.get('Origin') !== u.origin) return new Response('Request denied', {status:403});
  if (!post && req.method !== 'GET') return new Response(null,{status:405});
  if (!post && path.startsWith('/campus/')) {
    const asset = path.slice('/campus/'.length);
    if (!Object.hasOwn(campusAssets,asset)) return missing();
    const width=u.searchParams.get('w');
    if (photoWidths.has(width)) return servePhoto(env,{object_key:'campus-design-v1/'+asset,type:campusAssets[asset]},req,true,ctx);
    const object = await env.MEDIA.get('campus-design-v1/'+asset);
    if (!object) return missing();
    return new Response(object.body,{headers:{'Content-Type':campusAssets[asset],'Cache-Control':'public, max-age=86400'}});
  }
  if (!post && path.startsWith('/fonts/')) {
    const name = path.slice('/fonts/'.length);
    if (!Object.hasOwn(fonts,name)) return missing();
    return new Response(Uint8Array.from(atob(fonts[name]),c=>c.charCodeAt(0)),{headers:{'Content-Type':'font/woff2','Cache-Control':'public, max-age=31536000, immutable'}});
  }
  // Shared styles contain no member data. The current version is immutable for a year; an older
  // versioned URL (a page rendered just before a deploy) still gets current styles, briefly cached.
  const stylesheet = !post && path.match(/^\/styles\/site-([a-z0-9]+)\.css$/);
  if (stylesheet) return new Response(siteCSS,{headers:{'Content-Type':'text/css; charset=utf-8',
    'Cache-Control':stylesheet[1]===siteCSSVersion?'public, max-age=31536000, immutable':'public, max-age=300'}});
  if (path==='/social.js' && !post) return new Response(page.socialScript,{
    headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=300'}});
  if (path==='/theme' && post) {
    const light = !/(?:^|;\s*)theme=light(?:;|$)/.test(req.headers.get('Cookie')||'');
    let back = '/';
    try { const ref = new URL(req.headers.get('Referer')||'/', u.origin); if (ref.origin===u.origin) back = destination(ref.pathname+ref.search+ref.hash); } catch {}
    return redirect(back,{'Set-Cookie':`theme=${light?'light':'dark'}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`});
  }
  const token = req.headers.get('Cookie')?.match(/(?:^|;\s*)__Host-alumni=([a-f0-9-]+)/)?.[1];
  if (path==='/logout' && post) {
    if (token) await run('DELETE FROM sessions WHERE token=?',await hash(token));
    const headers={'Set-Cookie':cookie('',0),'Cache-Control':'private, no-store'};
    if(req.headers.get('Accept')==='application/json')return Response.json({signedOut:true},{headers});
    return redirect('/signin?signed-out=1',headers);
  }
  const member = token && await one(`SELECT m.*,r.name FROM sessions s JOIN members m ON m.id=s.member
    JOIN roster r ON r.id=m.id WHERE s.token=? AND s.expires>? AND m.suspended=0 AND (?=0 OR m.invited=1 OR m.role='admin')`,await hash(token),now(),+pilot);
  setViewer(member?.id ?? null);
  const visibleSeed = "(s.review_status='approved' OR (?=1 AND s.review_status='pending'))";
  const portrait = `coalesce(
    (SELECT 'portrait/'||r.id FROM profile_fields WHERE member=r.id AND field='portraitObject' AND trim(value)<>''),
    CASE WHEN trim(coalesce(s.portrait_key,''))<>'' THEN 'seed/'||r.id END,
    (SELECT 'profile-photo/'||r.id||'/now' FROM profile_fields WHERE member=r.id AND field='nowPhotoObject' AND trim(value)<>''),
    (SELECT 'yearbook/'||y.member||'/'||j.key FROM yearbook_public y,json_each(y.images) j
      JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission') AND ph.object_key=json_extract(j.value,'$.key')
      WHERE y.member=r.id AND ph.slot='now' ORDER BY j.key LIMIT 1),
    (SELECT 'profile-photo/'||r.id||'/then' FROM profile_fields WHERE member=r.id AND field='thenPhotoObject' AND trim(value)<>''),
    (SELECT 'yearbook/'||y.member||'/'||j.key FROM yearbook_public y,json_each(y.images) j
      JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission') AND ph.object_key=json_extract(j.value,'$.key')
      WHERE y.member=r.id AND ph.slot='then' ORDER BY j.key LIMIT 1)
  )`;
  const seedJoin = `LEFT JOIN profile_seeds s ON s.roster_id=r.id AND ${visibleSeed}`;
  const postVisible = 'p.hidden=0 AND (p.topic IS NULL OR EXISTS(SELECT 1 FROM topics t WHERE t.id=p.topic AND t.hidden=0))';
  const notificationVisible=`(n.sample=1 OR n.kind IN ('catchup_request','catchup_accepted') OR (p.id IS NOT NULL AND ${postVisible}
    AND (n.kind<>'comment' OR EXISTS(SELECT 1 FROM comments c WHERE 'comment-'||c.id=n.anchor AND c.post=p.id AND c.hidden=0))))`;
  const notificationFrom='FROM notifications n LEFT JOIN posts p ON p.id=n.post';
  // Page chrome (header avatar and unread count) is loaded only when an HTML page is rendered for a
  // signed-in GET. JSON panels, fragments and action endpoints never pay for it.
  let chrome;
  const loadChrome = () => chrome ||= Promise.all([
    one(`SELECT ${portrait} AS portrait FROM roster r ${seedJoin} WHERE r.id=?`,+pilot,member.id),
    one(`SELECT count(*) AS total ${notificationFrom} WHERE n.recipient=? AND n.is_read=0 AND ${notificationVisible}`,member.id)
  ]).then(([profile,unread])=>{member.portrait=profile?.portrait;member.unread=unread.total;});
  async function renderPage(title,body,who,options) {
    if (who && who===member && !post) await loadChrome();
    return render(title,body,who,options);
  }
  const show = (title,body) => renderPage(title,body,member);
  const data = () => req.formData();
  const mailHelp = 'mailto:s.tahseen.q@gmail.com,arun.devanathan@gmail.com?subject=IIMA%20Class%20of%202006%20roster%20email&body=Name%3A%0ADorm%20Number%3A%0ADorm%20Name%3A%0ACorrect%20Email%20ID%3A';
  const rosterEmail = key => one(`SELECT email FROM reminder_contacts c WHERE batchmate_id=? AND NOT EXISTS(SELECT 1 FROM roster r WHERE r.id=c.batchmate_id AND lower(trim(r.name))='sachin kumar suman') AND trim(email) LIKE '%_@_%._%' AND
    (SELECT count(*) FROM reminder_contacts x WHERE lower(trim(x.email))=lower(trim(c.email)))=1`,key);
  const limit = async (key, minutes, maximum) => {
    const window = Math.floor(now()/(minutes*60000));
    const row = await one(`INSERT INTO rate_limits VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET
      hits=CASE WHEN window=excluded.window THEN hits+1 ELSE 1 END,window=excluded.window RETURNING hits`,key,window);
    return row.hits<=maximum;
  };
  if (path === '/verify.js' && !post) return new Response(
    `const form=document.querySelector('#verify-form');
    function verify(){
      if(document.prerendering||document.visibilityState!=='visible')return;
      document.removeEventListener('visibilitychange',verify);
      const token=new URLSearchParams(location.hash.slice(1)).get('token');
      if(token)form.elements.token.value=token;
      history.replaceState(null,'',location.pathname);
      if(form.elements.token.value)form.requestSubmit();
      else location.replace('/signin?link=missing');
    }
    document.addEventListener('visibilitychange',verify);
    document.addEventListener('prerenderingchange',verify,{once:true});
    verify();`,
    {headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}});
  if (path === '/picker.js') return new Response(page.pickerScript,{headers:{'Content-Type':'text/javascript; charset=utf-8'}});
  if (path === '/names' && !post) {
    const query = (u.searchParams.get('q') || '').trim().slice(0,80);
    if (query.length < 2) return json([]);
    return json(await all("SELECT id,name FROM roster WHERE lower(trim(name))<>'sachin kumar suman' AND instr(lower(name),lower(?))>0 ORDER BY name LIMIT 12",query));
  }
  if (['/submit','/yearbook'].includes(path) && !post) return redirect(member?'/people/'+member.id:'/signin');
  const signInPage = async (key, next, feedback = '') => {
    const selected = Number.isSafeInteger(key) && key>0 && await one('SELECT id,name FROM roster WHERE id=?',key);
    const contact = selected && await rosterEmail(key);
    const [local, domain] = (contact?.email?.trim() || '').split('@');
    const chars = Array.from(local);
    const edge = Math.max(0,Math.min(2, Math.floor((chars.length-1)/2)));
    const maskedEmail = local && domain ? chars.slice(0,edge).join('') + '•'.repeat(chars.length-2*edge)
      + (edge?chars.slice(-edge).join(''):'') + '@' + domain : '';
    return signIn({selected, maskedEmail, next, mailHelp, feedback});
  };
  // Dedicated isolated demo environment only. Never enable this flag on production.
  if (env.PREVIEW_LABEL && env.PREVIEW_DEMO==='1' && (path==='/preview-demo' || (!member && (path==='/'||path==='/signin')))) {
    if(post){
      const chosen=Number((await data()).get('member'));
      if(![1,2].includes(chosen))return missing();
      const raw=id()+id();
      await run('INSERT INTO sessions VALUES(?,?,?)',await hash(raw),chosen,now()+86400000);
      return redirect('/',{'Set-Cookie':cookie(raw,86400)});
    }
    return show('Memorial & navigation preview', '<p>This is an isolated test site. All interactions stay here.</p>'+form('/preview-demo',field('member','1'),'Enter preview')+form('/preview-demo',field('member','2'),'Try as another classmate'));
  }
  if (!post && !member && env.PREVIEW_LABEL && (path==='/' || path==='/signin'))
    return redirect('https://iima-class-of-2006.in/preview',{'Cache-Control':'no-store'});
  if (!post && (path === '/signin' || (!member && path === '/'))) {
    if (member) return redirect(destination(u.searchParams.get('next')));
    return signInPage(Number(u.searchParams.get('id')),destination(u.searchParams.get('next')),
      u.searchParams.get('link')==='missing' ? 'This sign-in link is incomplete. Request a new link below.' :
      u.searchParams.get('signed-out')==='1' ? 'You’re signed out.' :
      u.searchParams.get('moved')==='yearbook' ? 'The yearbook has moved to our new batch site.' : '');
  }
  if (path === '/request-link' && post) {
    const f = await data(), key = Number(f.get('id'));
    if (!Number.isSafeInteger(key) || key<1) return invalid('Choose a classmate.');
    const ok = await limit('ip:'+await hash(req.headers.get('CF-Connecting-IP') || 'local'),30,12);
    const allowed = ok && await limit('mail:'+key,30,3);
    const contact = allowed && await rosterEmail(key);
    const next = destination(f.get('next'));
    if (contact && env.RESEND_API_KEY) {
      const raw = id()+id();
      await run('INSERT INTO login_links VALUES(?,?,?,?)',await hash(raw),key,now()+2*60*60*1000,destination(f.get('next')));
      const link = new URL('/verify#token='+raw,env.SITE_ORIGIN || u.origin);
      const mail = await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
        body:JSON.stringify({from:env.MAIL_FROM,to:[contact.email.trim()],subject:'Sign in to IIMA Class of 2006',text:'You requested a sign-in link for the IIMA Class of 2006 alumni site.\n\n'+link.href+'\n\nThis link works once and expires in 2 hours. If you did not request it, you can ignore this email.'})}).catch(()=>null);
      await record(mail?.ok?'email_accepted':'email_failed',null,'/request-link');
      if (!mail?.ok) {
        await run('DELETE FROM login_links WHERE token=?',await hash(raw));
        return signInPage(key,next,'Email could not be sent. Please try again later.');
      }
    }
    if (!env.RESEND_API_KEY) return signInPage(key,next,'Sign-in email is being configured.');
    return signInPage(key,next,allowed && contact ? 'Check your inbox for your sign-in link.' : 'If a link was requested recently, check your inbox or try again later.');
  }
  if (path === '/verify') {
    if (!post) {
      const response=await show('Signing in','<p role="status">Signing you in…</p><form method="post" action="/verify" id="verify-form" hidden>'
        +field('token',u.searchParams.get('token') || '')+'</form><noscript><p>Enable JavaScript to open this sign-in link.</p></noscript><script src="/verify.js?v=2" defer></script>');
      response.headers.set('Cache-Control','no-store');
      response.headers.set('Referrer-Policy','strict-origin');
      return response;
    }
    const raw = str(await data(),'token',100), digest = await hash(raw);
    const link = await one('DELETE FROM login_links WHERE token=? AND expires>? RETURNING member,destination',digest,now());
    if (!link) {
      await record('link_invalid',null,'/verify');
      if (member) return redirect('/',{'Cache-Control':'no-store'});
      const response=await signInPage(0,'/','This link has expired or has already been used. Request a fresh link below.');
      response.headers.set('Cache-Control','no-store');
      return response;
    }
    await run('INSERT OR IGNORE INTO members(id) VALUES(?)',link.member);
    const account = await one('SELECT * FROM members WHERE id=?',link.member);
    if (account.suspended || (pilot && !account.invited && account.role!=='admin')) return show('Pilot access','<p>This phase is open to invited classmates.</p>');
    const session = id()+id();
    await run('INSERT INTO sessions VALUES(?,?,?)',await hash(session),link.member,now()+30*86400000);
    await record('sign_in',link.member,'/verify');
    return redirect(destination(link.destination),{'Set-Cookie':cookie(session,30*86400),'Cache-Control':'no-store'});
  }
  if (!member) return redirect('/signin?next='+encode(path+u.search));
  const me = member.id;
  if(isMemorial(member.name)) return new Response('This is a memorial profile.',{status:403});
  if(path==='/remembering-sachin' && !post){
    const row=await one("SELECT id FROM roster WHERE lower(trim(name))='sachin kumar suman'");
    return row?redirect('/people/'+row.id):missing();
  }
  if(path.startsWith('/memorial-photo/') && !post){
    const name=path.slice('/memorial-photo/'.length);
    if(!memorialPhotos.includes(name))return missing();
    const object=await env.MEDIA.get('memorial/sachin/'+name+'.jpg');
    return object?new Response(object.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=3600'}}):missing();
  }
  // Browser navigations ask for HTML: start the chrome queries alongside the page's own queries.
  if (!post && /text\/html/.test(req.headers.get('Accept')||'') && u.searchParams.get('fragment')!=='1') loadChrome().catch(()=>{});
  if (path==='/preview' && !post) {
    if (env.PREVIEW_LABEL) return redirect('/');
    if (member.role!=='admin') return new Response('Preview access is limited to batch admins.',{status:403});
    const raw=id()+id();
    await run('INSERT INTO login_links VALUES(?,?,?,?)',await hash(raw),me,now()+60000,'/');
    return redirect('https://staging-iima-2006-alumni.arun-devanathan.workers.dev/verify#token='+raw,
      {'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
  }
  if (path==='/tag-search' && !post) {
    const q = (u.searchParams.get('q')||'').trim().slice(0,80);
    if (q.length<2) return json([]);
    return json(await all(`SELECT id,name,nickname FROM roster WHERE id<>? AND lower(trim(name))<>'sachin kumar suman' AND
      instr(lower(name||' '||nickname),lower(?))>0 ORDER BY name LIMIT 12`,me,q));
  }
  const admin = member.role === 'admin';
  const faceResponse = await faceRoute({req,env,me,path,post});
  if (faceResponse) return faceResponse;
  let completionPromise;
  function whatsappCompletion() {
    return completionPromise ||= (async()=>{
    const [roster, selected, photos] = await Promise.all([
      one('SELECT r.dorm,r.nickname,a.status AS attendance FROM roster r LEFT JOIN attendance a ON a.member=r.id WHERE r.id=?',me),
      all('SELECT field,value FROM selected_profile_fields WHERE member=? AND pilot_only<=? ORDER BY priority',me,+pilot),
      all(`SELECT ph.slot FROM yearbook_public y,json_each(y.images) j
        JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission') AND ph.object_key=json_extract(j.value,'$.key')
        WHERE y.member=? AND ph.slot IN ('then','now')
        UNION ALL SELECT CASE field WHEN 'thenPhotoObject' THEN 'then' ELSE 'now' END AS slot
        FROM profile_fields WHERE member=? AND field IN ('thenPhotoObject','nowPhotoObject') AND trim(value)<>''`,me,me)
    ]);
    const details={...roster};
    for (const item of selected) details[item.field]=item.value;
    return whatsappRequirements(details,Object.fromEntries(photos.map(photo=>[photo.slot,true])));
    })();
  }
  // Compact state the profile editor needs after a save: the seven requirements, Then/Now photo
  // previews (versioned so a replacement is never served from cache) and whether Life, Lately is
  // still the imported draft. Read after the write, in the same request.
  async function profileState() {
    const [checks,photos,life,name,currentPortrait] = await Promise.all([
      whatsappCompletion(),
      all(`SELECT ph.slot,'yearbook/'||y.member||'/'||j.key AS media,'' AS version
        FROM yearbook_public y,json_each(y.images) j
        JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission') AND ph.object_key=json_extract(j.value,'$.key')
        WHERE y.member=? AND ph.slot IN ('then','now')
        UNION ALL SELECT substr(field,1,length(field)-11),'profile-photo/'||member||'/'||substr(field,1,length(field)-11),value
        FROM profile_fields WHERE member=? AND field IN ('thenPhotoObject','nowPhotoObject') AND value<>''`,me,me),
      one(`SELECT value,source FROM selected_profile_fields WHERE member=? AND field='life' AND pilot_only<=?
        ORDER BY priority DESC LIMIT 1`,me,+pilot),
      one("SELECT value FROM profile_fields WHERE member=? AND field='displayName'",me),
      one(`SELECT ${portrait} AS media,(SELECT value FROM profile_fields WHERE member=r.id AND field='portraitObject') AS version FROM roster r ${seedJoin} WHERE r.id=?`,+pilot,me)
    ]);
    const version=value=>String(value||'').replace(/[^\w-]/g,'').slice(-12);
    const preview={};
    // Owner uploads come last in the query and replace imported yearbook photos, as on the profile.
    for (const photo of photos) preview[photo.slot]={href:'/media/'+photo.media,
      src:'/media/'+photo.media+'?w=480'+(photo.version?'&v='+version(photo.version):'')};
    const missing=checks.filter(check=>!check.complete);
    return {saved:true,profile:'/people/'+me,checks,complete:!missing.length,missing:missing.map(check=>check.key),
      portrait:currentPortrait?.media?{src:'/media/'+currentPortrait.media+'?w=256'+(currentPortrait.version?'&v='+version(currentPortrait.version):'')}:null,photos:preview,lifeGenerated:!!String(life?.value||'').trim()&&life.source==='selected_enrichment',
      name:String(name?.value||'').trim()||member.name};
  }
  if (!post && (path==='/wa' || path.startsWith('/wa/'))) {
    if (path==='/wa/' && u.searchParams.get('preview')==='locked') {
      if (!admin) return new Response('Admin access required.',{status:403});
      const checks=whatsappRequirements({},{});
      return renderPage('WhatsApp Insights',`<aside class="panel"><strong>Admin preview: locked WhatsApp Insights</strong><p>This simulates an incomplete profile. Your profile and access have not changed.</p><a href="/wa/">Exit preview</a></aside>`+whatsappUnlock(checks,me),member);
    }
    const checks=await whatsappCompletion();
    if (checks.some(check=>!check.complete)) {
      if (path.startsWith('/wa/api/')) return new Response(JSON.stringify({error:'profile_incomplete',message:'Complete your profile to unlock WhatsApp Insights.',missing:checks.filter(check=>!check.complete).map(check=>check.label),profile:'/people/'+me+'?complete=whatsapp#whatsapp-unlock'}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
      return renderPage('WhatsApp Insights',whatsappUnlock(checks,me),member);
    }

    const author=path==='/wa/'?await one(`SELECT ${portrait} AS portrait FROM roster r ${seedJoin} WHERE r.id=88`,+pilot):null;
    const response = await whatsappRoute({path,u,req,env,member,admin,all,one,render:renderPage,author});
    if (response) return response;
  }
  const aboutPerson = key => `(p.subject=${key} OR EXISTS(SELECT 1 FROM memory_about ma WHERE ma.post=p.id AND ma.kind='person' AND ma.target=CAST(CAST(${key} AS INTEGER) AS TEXT)))`;
  const aboutTopic = key => `(p.topic=${key} OR EXISTS(SELECT 1 FROM memory_about ma WHERE ma.post=p.id AND ma.kind='topic' AND ma.target=${key}) OR EXISTS(SELECT 1 FROM active_photo_tags pt WHERE pt.post=p.id AND pt.kind='topic' AND pt.target=${key}))`;
  const postQuery = `SELECT p.*,r.name AS author_name,${portrait} AS author_portrait,(SELECT title FROM memory_albums WHERE post=p.id) AS album_title,(SELECT cover FROM memory_albums WHERE post=p.id) AS album_cover,t.title AS topic_title,subject.name AS subject_name,
    EXISTS(SELECT 1 FROM photos ph WHERE ph.submission=p.origin) AS has_legacy_photo,
    (SELECT a.id FROM active_uploads a WHERE a.post=p.id ORDER BY a.id LIMIT 1) AS feed_photo,
    (SELECT json_group_array(json_object('href',href,'label',label,'kind',kind)) FROM (
      -- Start from this memory's own links instead of testing every classmate and topic per card.
      SELECT '/people/'||rr.id AS href,rr.name AS label,'person' AS kind FROM roster rr
      WHERE rr.id IN (SELECT p.subject
          UNION ALL SELECT CAST(ma.target AS INTEGER) FROM memory_about ma WHERE ma.post=p.id AND ma.kind='person'
            AND ma.target=CAST(CAST(ma.target AS INTEGER) AS TEXT)
          UNION ALL SELECT t.member FROM tags t WHERE t.post=p.id AND t.status='accepted')
        AND NOT EXISTS(SELECT 1 FROM muted_subjects ms WHERE ms.post=p.id)
      UNION SELECT '/topics/'||tt.id,tt.title,'topic' FROM topics tt
      WHERE tt.id IN (SELECT p.topic UNION ALL SELECT ma.target FROM memory_about ma WHERE ma.post=p.id AND ma.kind='topic')
        AND tt.hidden=0 AND tt.redirect IS NULL
      ORDER BY kind,label
    )) AS linked_tags,
    -- A memory with one photo: who and what is tagged on that photo, for its card (albums keep their photo tags inside).
    CASE WHEN (SELECT count(*) FROM active_uploads a WHERE a.post=p.id)+(SELECT count(*) FROM photos ph WHERE ph.submission=p.origin)=1
      THEN (SELECT json_group_array(json_object('href',href,'label',label,'kind',kind)) FROM (
        SELECT '/people/'||rr.id AS href,rr.name AS label,'person' AS kind FROM roster rr
        WHERE rr.id IN (SELECT CAST(pt.target AS INTEGER) FROM active_photo_tags pt WHERE pt.post=p.id AND pt.kind='person')
        UNION SELECT '/topics/'||tt.id,tt.title,'topic' FROM topics tt
        WHERE tt.id IN (SELECT pt.target FROM active_photo_tags pt WHERE pt.post=p.id AND pt.kind='topic') AND tt.hidden=0 AND tt.redirect IS NULL
        ORDER BY kind,label)) END AS single_photo_tags,
    (SELECT json_group_array(media) FROM (
      SELECT 'post/'||a.id AS media FROM active_uploads a WHERE a.post=p.id
      UNION ALL SELECT 'legacy/'||p.id||'/'||row_number() OVER(ORDER BY ph.object_key)
      FROM photos ph WHERE ph.submission=p.origin
    )) AS collage_photos,
    (SELECT count(*) FROM likes l WHERE l.post=p.id) AS likes,
    (SELECT count(*) FROM likes l WHERE l.post=p.id AND l.member=?) AS liked,
    EXISTS(SELECT 1 FROM memory_about ma WHERE ma.post=p.id AND ma.kind='person' AND ma.target=CAST(CAST(? AS INTEGER) AS TEXT)) AS is_about_me
    FROM posts p JOIN roster r ON r.id=p.author LEFT JOIN topics t ON t.id=p.topic LEFT JOIN roster subject ON subject.id=p.subject ${seedJoin}`;
  async function posts(where = '1', args = [], size = 25, order='p.created DESC,p.id DESC', profilePerson=null) {
    let query=postQuery;
    if(profilePerson!==null){
      const key=Number(profilePerson);
      if(!Number.isSafeInteger(key))throw new Error('Invalid profile');
      const projection=`(
        p.subject=${key} OR EXISTS(SELECT 1 FROM memory_about ma WHERE ma.post=p.id AND ma.kind='person' AND ma.target=CAST(CAST(${key} AS INTEGER) AS TEXT))
        OR EXISTS(SELECT 1 FROM tags t WHERE t.post=p.id AND t.member=${key} AND t.status='accepted')
      ) AS profile_album_tag,
      (SELECT json_group_array(json_object('media',media,'kind',kind,'href',href,'label',label)) FROM (
        SELECT pt.media,pt.kind,'/people/'||r.id AS href,r.name AS label FROM active_photo_tags pt JOIN roster r ON r.id=pt.target WHERE pt.post=p.id AND pt.kind='person'
        UNION ALL SELECT pt.media,pt.kind,'/topics/'||t.id,t.title FROM active_photo_tags pt JOIN topics t ON t.id=pt.target WHERE pt.post=p.id AND pt.kind='topic' AND t.hidden=0 AND t.redirect IS NULL
      )) AS profile_photo_links,`;
      query=query.replace('SELECT p.*,','SELECT p.*,'+projection);
    }
    return all(`${query} WHERE ${postVisible} AND (${where}) ORDER BY ${order} LIMIT ?`,me,me,+pilot,...args,size);
  }
  const profileMemories=key=>posts(`p.author=? OR EXISTS(SELECT 1 FROM (SELECT ? AS id) subject_ref WHERE ${aboutPerson('subject_ref.id')} AND NOT EXISTS(SELECT 1 FROM muted_subjects m WHERE m.post=p.id)) OR EXISTS(SELECT 1 FROM tags t WHERE t.post=p.id AND t.member=? AND t.status='accepted') OR (EXISTS(SELECT 1 FROM active_photo_tags pt WHERE pt.post=p.id AND pt.kind='person' AND CAST(pt.target AS INTEGER)=?) AND NOT EXISTS(SELECT 1 FROM muted_subjects m WHERE m.post=p.id))`,[key,key,key,key],100,'p.created DESC,p.id DESC',key);
  async function gallery(person) {
    const seed = `SELECT 'seed/'||s.roster_id AS media,r.name AS caption,'/people/'||r.id AS source,s.portrait_key AS object_key
      FROM profile_seeds s JOIN roster r ON r.id=s.roster_id WHERE ${visibleSeed} AND s.portrait_key IS NOT NULL AND (? IS NULL OR r.id=?)`;
    const yearbook = `SELECT 'yearbook/'||y.member||'/'||j.key AS media,ph.caption,'/people/'||y.member AS source,ph.object_key
      FROM yearbook_public y,json_each(y.images) j JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission')
      AND ph.object_key=json_extract(j.value,'$.key') WHERE (? IS NULL OR y.member=?)`;
    const uploads = `SELECT 'post/'||a.id AS media,a.caption,'/posts/'||p.id AS source,a.object_key
      FROM active_uploads a JOIN posts p ON p.id=a.post WHERE ${postVisible} AND (? IS NULL OR p.author=? OR
      (EXISTS(SELECT 1 FROM (SELECT ? AS id) person_ref WHERE ${aboutPerson('person_ref.id')}) AND NOT EXISTS(SELECT 1 FROM muted_subjects m WHERE m.post=p.id)) OR
      EXISTS(SELECT 1 FROM tags t WHERE t.post=p.id AND t.member=? AND t.status='accepted') OR
      EXISTS(SELECT 1 FROM active_photo_tags pt WHERE pt.post=p.id AND pt.media='post/'||a.id AND pt.kind='person' AND pt.target=CAST(CAST(? AS INTEGER) AS TEXT)))`;
    // Legacy media ids are numbered within each memory, so number first and then filter (a photo tag names that id).
    const memories = `SELECT media,caption,source,object_key FROM (SELECT 'legacy/'||p.id||'/'||ROW_NUMBER() OVER(PARTITION BY p.id ORDER BY ph.object_key) AS media,
      ph.caption,'/posts/'||p.id AS source,ph.object_key,p.id AS post,p.author,p.subject
      FROM posts p JOIN photos ph ON ph.submission=p.origin WHERE ${postVisible}) lp WHERE (? IS NULL OR lp.author=? OR
      (lp.subject=? AND NOT EXISTS(SELECT 1 FROM muted_subjects m WHERE m.post=lp.post)) OR
      EXISTS(SELECT 1 FROM active_photo_tags pt WHERE pt.post=lp.post AND pt.media=lp.media AND pt.kind='person' AND pt.target=CAST(CAST(? AS INTEGER) AS TEXT)))`;
    const rows = await all(`${seed} UNION ALL ${yearbook} UNION ALL ${uploads} UNION ALL ${memories}`,+pilot,...Array(13).fill(person));
    const seen = new Set();
    return rows.filter(row => {if (seen.has(row.object_key)) return false; seen.add(row.object_key); return true;});
  }
  if (path.startsWith('/media/') && !post) {
    const key = path.slice(7);
    const bits = key.split('/');
    let row;
    if (bits[0]==='profile-photo' && ['then','now'].includes(bits[2])) row=await one(
      'SELECT value AS object_key FROM profile_fields WHERE member=? AND field=?',Number(bits[1]),bits[2]+'PhotoObject');
    else if (bits[0]==='portrait') row = await one("SELECT value AS object_key FROM profile_fields WHERE member=? AND field='portraitObject'",Number(bits[1]));
    else if (bits[0]==='post') row = await one(`SELECT a.object_key,a.type FROM active_uploads a JOIN posts p ON p.id=a.post WHERE a.id=? AND ${postVisible}`,bits[1]);
    else if (bits[0]==='seed') row = await one(`SELECT s.portrait_key AS object_key FROM profile_seeds s WHERE s.roster_id=? AND ${visibleSeed}`,Number(bits[1]),+pilot);
    else if (bits[0]==='yearbook') row = await one(`SELECT ph.object_key FROM yearbook_public y,json_each(y.images) j
      JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission') AND ph.object_key=json_extract(j.value,'$.key')
      WHERE y.member=? AND j.key=?`,Number(bits[1]),Number(bits[2]));
    else if (bits[0]==='iimages') { const key=await yearbookPhotoKey(db,Number(bits[1]),me,admin); row=key?{object_key:key}:null; }
    else if (bits[0]==='legacy' && Number(bits[2])>0) row = await one(`SELECT ph.object_key FROM posts p JOIN photos ph ON ph.submission=p.origin
      WHERE p.id=? AND ${postVisible} ORDER BY ph.object_key LIMIT 1 OFFSET ?`,bits[1],Number(bits[2])-1);
    return servePhoto(env,row,req,false,ctx);
  }
  async function feed(size, q='') {
    const photoBonus = `CASE WHEN EXISTS(SELECT 1 FROM active_uploads up WHERE up.post=p.id)
      OR EXISTS(SELECT 1 FROM photos ph WHERE ph.submission=p.origin) THEN 604800000 ELSE 0 END`;
    const before = Number(u.searchParams.get('before')) || Number.MAX_SAFE_INTEGER;
    const cursor = u.searchParams.get('cursor') || '';
    const search = `AND (instr(lower(p.body||' '||r.name||' '||r.nickname||' '||coalesce(subject.name,'')||' '||coalesce(subject.nickname,'')||' '||coalesce(t.title,'')||' '||coalesce((SELECT title FROM memory_albums WHERE post=p.id),'')),lower(?))>0
      OR EXISTS(SELECT 1 FROM comments c WHERE c.post=p.id AND c.hidden=0 AND instr(lower(c.body),lower(?))>0)
      OR EXISTS(SELECT 1 FROM tags tg JOIN roster tr ON tr.id=tg.member WHERE tg.post=p.id AND tg.status='accepted' AND instr(lower(tr.name||' '||tr.nickname),lower(?))>0)
      OR EXISTS(SELECT 1 FROM memory_about ma LEFT JOIN roster ar ON ma.kind='person' AND ma.target=CAST(ar.id AS TEXT)
        AND NOT EXISTS(SELECT 1 FROM muted_subjects ms WHERE ms.post=p.id)
        LEFT JOIN topics at ON ma.kind='topic' AND ma.target=at.id AND at.hidden=0 AND at.redirect IS NULL
        WHERE ma.post=p.id AND instr(lower(coalesce(ar.name,'')||' '||coalesce(ar.nickname,'')||' '||coalesce(at.title,'')),lower(?))>0)
      OR EXISTS(SELECT 1 FROM active_uploads a WHERE a.post=p.id AND instr(lower(a.caption),lower(?))>0)
      OR EXISTS(SELECT 1 FROM photos ph WHERE ph.submission=p.origin AND instr(lower(ph.caption),lower(?))>0)
      OR (lower(?) IN ('photo','photos') AND ((${photoBonus})>0)))`;
    const rows = await posts(`(p.created<? OR (p.created=? AND p.id<?))
      AND NOT EXISTS(SELECT 1 FROM roster memorial WHERE lower(trim(memorial.name))='sachin kumar suman'
        AND ${aboutPerson('memorial.id')} AND NOT EXISTS(SELECT 1 FROM muted_subjects ms WHERE ms.post=p.id)) ${q?search:''}`,
      [before,before,cursor,...(q?Array(7).fill(q):[])],size+1,'p.created DESC,p.id DESC');
    const more = rows.length>size;
    if (more) rows.pop();
    const last=rows.at(-1);
    const next = more ? '/memories?before='+last.created+'&cursor='+encode(last.id)+(q?'&q='+encode(q):'') : '';
    return {rows,next};
  }
  // Newest completed profiles. Reads the per-member summary maintained by migration 0018's triggers;
  // ranks only completed members, then resolves portraits for the twelve shown.
  async function freshProfiles() {
    const mode = pilot ? 'pilot' : 'public';
    try {
      return await all(`SELECT r.id,r.name,r.dorm,r.nickname,f.city,f.life,${portrait} AS portrait,
          f.completed_at,f.completion_basis
        FROM (SELECT st.member,st.city_${mode} AS city,st.life_${mode} AS life,pc.completed_at,pc.basis AS completion_basis,
            coalesce(pc.completed_at,pc.observed_at,0) AS rank_at,coalesce(pc.observed_order,0) AS rank_order,rr.name AS rank_name
          FROM profile_completion_state st JOIN roster rr ON rr.id=st.member
          LEFT JOIN profile_completion pc ON pc.member=st.member
          WHERE st.complete_${mode}=1 AND lower(trim(rr.name))<>'sachin kumar suman' AND NOT EXISTS(SELECT 1 FROM members m WHERE m.id=st.member AND m.suspended=1)
          ORDER BY rank_at DESC,rank_order DESC,rank_name LIMIT 12) f
        JOIN roster r ON r.id=f.member ${seedJoin}
        ORDER BY f.rank_at DESC,f.rank_order DESC,f.rank_name`,+pilot);
    } catch (error) {
      // Before migration 0018 is applied, fall back to resolving completion across the roster.
      if (!/no such table: profile_completion_state/.test(error?.message||'')) throw error;
      return all(`${completedProfilesCTE}
        SELECT r.id,r.name,r.dorm,r.nickname,c.city,c.life,${portrait} AS portrait,
          pc.completed_at,pc.basis AS completion_basis
        FROM completed_profiles c JOIN roster r ON r.id=c.id ${seedJoin}
        LEFT JOIN profile_completion pc ON pc.member=r.id
        WHERE lower(trim(r.name))<>'sachin kumar suman' AND NOT EXISTS(SELECT 1 FROM members m WHERE m.id=r.id AND m.suspended=1)
        ORDER BY coalesce(pc.completed_at,pc.observed_at,0) DESC,pc.observed_order DESC,r.name LIMIT 12`,+pilot,+pilot);
    }
  }
  // "Looking forward to meeting": tolerant of a database where migration 0014 has not run yet.
  const meetLimit = 60;
  async function meetSummary(target=null) {
    try {
      const [count,picked,wanted,incoming,checks] = await Promise.all([
        one('SELECT count(*) AS n FROM meet_wishes WHERE target=?',me),
        all(`SELECT r.id,r.name,r.nickname,r.dorm,w.request_id,w.accepted_at,${portrait} AS portrait FROM meet_wishes w JOIN roster r ON r.id=w.target ${seedJoin}
          WHERE w.member=? ORDER BY w.created DESC,r.name`,+pilot,me),
        target==null ? null : one('SELECT request_id,accepted_at FROM meet_wishes WHERE member=? AND target=?',me,target),
        all(`SELECT r.id,r.name,r.nickname,w.request_id,w.accepted_at,${portrait} AS portrait FROM meet_wishes w JOIN roster r ON r.id=w.member ${seedJoin}
          WHERE w.target=? ORDER BY w.created DESC,r.name`,+pilot,me),
        whatsappCompletion()
      ]);
      return {available:true,count:count.n,picked,wanted:!!wanted,accepted:!!wanted?.accepted_at,incoming,unlocked:checks.every(check=>check.complete)};
    } catch { return {available:false,count:0,picked:[],wanted:false}; }
  }
  if (path==='/meet' && post) {
    const f = await data();
    const target = Number(str(f,'target',12));
    const action = str(f,'action',10);
    const back = destination(str(f,'next',300)||'/people/'+me);
    if (!['add','remove','accept'].includes(action) || !Number.isInteger(target) || target===me || !(await one("SELECT id FROM roster WHERE id=? AND lower(trim(name))<>'sachin kumar suman'",target)))
      return invalid('Choose a classmate.');
    if (action==='accept') {
      const request=str(f,'request',80);
      const wish=await one('SELECT request_id FROM meet_wishes WHERE member=? AND target=? AND request_id=?',target,me,request);
      if (!wish) return missing();
      if((await whatsappCompletion()).some(check=>!check.complete))return redirect('/people/'+me+'?complete=whatsapp#whatsapp-unlock');
      // Only the recipient may accept this exact request; a retry never sends a second event.
      await run('UPDATE meet_wishes SET accepted_at=? WHERE member=? AND target=? AND request_id=? AND accepted_at IS NULL',now(),target,me,request);
      return redirect(back);
    }
    if (action==='add') {
      const existing=await one('SELECT 1 AS yes FROM meet_wishes WHERE member=? AND target=?',me,target);
      if (existing) return redirect(back);
      const {n} = await one('SELECT count(*) AS n FROM meet_wishes WHERE member=?',me);
      if (n>=meetLimit) return invalid('You can pick up to '+meetLimit+' classmates.');
      await run('INSERT OR IGNORE INTO meet_wishes(member,target,created) VALUES(?,?,?)',me,target,now());
    } else await run('DELETE FROM meet_wishes WHERE member=? AND target=?',me,target);
    return redirect(back);
  }
  if (path==='/memories') {
    const q=(u.searchParams.get('q')||'').trim().slice(0,100);
    const {rows,next} = await feed(12,q);
    if (u.searchParams.get('fragment')==='1') return json({html:page.memoryCards(rows),next});
    return show('Memories',page.memories(rows,next,q,id(),await whatsappCompletion(),me));
  }
  if (path==='/memory-targets' && !post) {
    const raw=(u.searchParams.get('q')||'').trim().slice(0,100);
    const prefix=raw[0], q=raw.replace(/^[@#]/,'').trim();
    if (!q) return json([]);
    const people=prefix==='#'?[]:await all(`SELECT 'person:'||id AS value,name AS label,dorm,'Classmates' AS category FROM roster
      WHERE instr(lower(name||' '||coalesce(nickname,'')||' Dorm '||coalesce(dorm,'')),lower(?))>0 ORDER BY name LIMIT 8`,q);
    const topics=prefix==='@'?[]:await all(`SELECT 'topic:'||id AS value,title AS label,
      CASE lower(kind) WHEN 'place' THEN 'Places' WHEN 'event' THEN 'Events' ELSE 'Tags' END AS category
      FROM topics WHERE hidden=0 AND redirect IS NULL AND instr(lower(title),lower(?))>0 ORDER BY title LIMIT 12`,q);
    const known=prefix==='@'?[]:await all(`SELECT DISTINCT 'Dorm '||trim(dorm) AS label FROM roster
      WHERE trim(dorm)<>'' AND instr(lower('Dorm '||trim(dorm)),lower(?))>0 ORDER BY label LIMIT 8`,q);
    const suggestions=[...known.map(({label})=>({label,category:'Places',value:'new-place:'+label})),
      ...['Chaos','Confluence'].filter(label=>label.toLowerCase().includes(q.toLowerCase())).map(label=>({label,category:'Events',value:'new-event:'+label}))];
    return json([...people,...topics,...suggestions.filter(x=>!topics.some(t=>t.label.toLowerCase()===x.label.toLowerCase()))]);
  }
  if (path==='/') {
    const [{rows,next},meet,unlock,fresh] = await Promise.all([feed(9),meetSummary(),whatsappCompletion(),freshProfiles()]);
    return renderPage('Kal • Aaj • Aur Kal',page.home(rows,next,id(),me,meet,unlock,fresh,await faceNudge(env,me),!!await one("SELECT id FROM roster WHERE lower(trim(name))='sachin kumar suman'")),member,{home:true,active:'/'});
  }
  if (path==='/people' || path==='/reunion') {
    const reunion=path==='/reunion';
    const q = (u.searchParams.get('q')||'').trim().slice(0,100);
    const requestedStatus = u.searchParams.get('status');
    const status = reunion ? 'attending' : ['attending','declined'].includes(requestedStatus) ? requestedStatus : '';
    const dorm = (u.searchParams.get('dorm')||'').trim().slice(0,50);
    if (reunion && post) {
      const f = await data();
      const key = str(f,'field',40);
      for (let attempt=0;attempt<3;attempt++) {
        const tracker = await one(`SELECT t.*,l.details AS saved_details FROM reunion_tracker t
          LEFT JOIN reunion_logistics l ON l.member=t.member WHERE t.member=? AND t.status='attending'`,me);
        if (!tracker) return new Response('Reunion details are available to confirmed attendees.',{status:403});
        const details = key ? editReunionDetail(tracker,parse(tracker.saved_details),key,str(f,'value',120)) : reunionDetails(f);
        if (!details) return invalid('Choose an available reunion field.');
        if (details.arrivalDate && details.departureDate && details.departureDate < details.arrivalDate)
          return invalid('Choose a hotel departure date on or after your arrival date.');
        const result = await one(`INSERT INTO reunion_logistics(member,details,updated)
          SELECT member,?,? FROM reunion_tracker WHERE member=? AND status='attending'
          ON CONFLICT(member) DO UPDATE SET details=excluded.details,updated=excluded.updated
          WHERE reunion_logistics.details IS ? RETURNING member`,JSON.stringify(details),now(),me,tracker.saved_details ?? null);
        if (result) return redirect('/reunion?saved=1#'+(key==='children' && Number(details.children)>0?'reunion-children':'reunion-details'));
      }
      return new Response('Your reunion details changed. Reload the page and try again.',{status:409});
    }
    const section = (u.searchParams.get('section')||'').trim().slice(0,20);
    const catchup = reunion && ['confirmed','requested','incoming','outgoing','none'].includes(u.searchParams.get('catchup')) ? u.searchParams.get('catchup') : '';
    const fragment = u.searchParams.get('fragment')==='1';
    // Classmates are paged (reunion attendees are a short list sorted by catch-up state in full).
    const pageSize = reunion ? -1 : 30;
    const [afterRank,afterId] = (u.searchParams.get('after')||'').split('-').map(Number);
    const keyset = Number.isSafeInteger(afterRank) && Number.isSafeInteger(afterId) && afterId>0;
    const [dorms,sections,matched] = await Promise.all([
      fragment ? [] : all("SELECT DISTINCT dorm FROM roster WHERE trim(dorm)<>'' ORDER BY CAST(dorm AS INTEGER),dorm"),
      fragment ? [] : all('SELECT DISTINCT section FROM roster_sections ORDER BY section'),
      // Ranking: a published yearbook entry (2), memories by others about them (2), a portrait (1).
      // The featured set is computed once per request instead of scanning posts for every classmate.
      all(`WITH featured(target) AS MATERIALIZED (
          SELECT CAST(p.subject AS TEXT) FROM posts p WHERE p.subject IS NOT NULL AND p.author<>p.subject AND ${postVisible}
            AND NOT EXISTS(SELECT 1 FROM muted_subjects ms WHERE ms.post=p.id)
          UNION SELECT ma.target FROM memory_about ma JOIN posts p ON p.id=ma.post
            WHERE ma.kind='person' AND CAST(p.author AS TEXT)<>ma.target AND ${postVisible}
            AND NOT EXISTS(SELECT 1 FROM muted_subjects ms WHERE ms.post=p.id)
        ), profile_richness AS MATERIALIZED (
          SELECT member,count(*) AS richness,sum(source='owner' AND field NOT IN ('thenPhotoObject','nowPhotoObject')) AS owner_fields
          FROM (SELECT member,field,value,source,row_number() OVER (PARTITION BY member,field ORDER BY priority DESC) AS choice
            FROM selected_profile_fields WHERE pilot_only<=${+pilot} )
          WHERE choice=1 AND trim(value)<>'' GROUP BY member
        ), matches AS MATERIALIZED (
          SELECT r.id,r.name,r.dorm,r.nickname,rs.section,${portrait} AS portrait,
            CASE WHEN coalesce(m.attendance_private,0)=0 THEN coalesce(rt.status,a.status) END AS status,
            2*EXISTS(SELECT 1 FROM yearbook_public y WHERE y.member=r.id AND (y.fields<>'{}' OR y.images<>'[]'))
              + 2*EXISTS(SELECT 1 FROM featured f WHERE f.target=CAST(r.id AS TEXT)) AS score,
            coalesce(st.complete_${pilot?'pilot':'public'},0) AS complete,
            coalesce(pr.richness,0) AS richness,coalesce(pr.owner_fields,0) AS owner_fields,
            coalesce(pc.completed_at,0) AS completed_at
          FROM roster r LEFT JOIN profile_richness pr ON pr.member=r.id
          LEFT JOIN profile_completion_state st ON st.member=r.id LEFT JOIN profile_completion pc ON pc.member=r.id
          LEFT JOIN members m ON m.id=r.id LEFT JOIN reunion_tracker rt ON rt.member=r.id
          LEFT JOIN attendance a ON a.member=r.id LEFT JOIN roster_sections rs ON rs.member=r.id ${seedJoin}
          WHERE lower(trim(r.name))<>'sachin kumar suman' AND (?='' OR instr(lower(r.name||' '||coalesce(r.nickname,'')||' Dorm '||coalesce(r.dorm,'')),lower(?))>0)
          AND (?='' OR r.dorm=?) AND (?='' OR rs.section=?)
          AND (?='' OR (coalesce(m.attendance_private,0)=0 AND CASE WHEN ? THEN rt.status ELSE coalesce(rt.status,a.status) END=?))
        ), ranked AS (SELECT *, ${reunion?'score+(portrait IS NOT NULL)':`(count(*) OVER ()+1)-row_number() OVER (ORDER BY complete DESC,CASE WHEN complete=1 THEN completed_at ELSE 0 END DESC,(owner_fields>0) DESC,richness DESC,(portrait IS NOT NULL) DESC,name,id)`} AS rank,count(*) OVER () AS total FROM matches)
        SELECT * FROM ranked WHERE ?=0 OR rank<? OR (rank=? AND (name>(SELECT name FROM roster WHERE id=?)
          OR (name=(SELECT name FROM roster WHERE id=?) AND id>?)))
        ORDER BY rank DESC,name,id LIMIT ?`,+pilot,q,q,dorm,dorm,section,section,status,+reunion,status,
        +keyset,...(keyset?[afterRank,afterRank,afterId,afterId,afterId]:[0,0,0,0,0]),pageSize<0?-1:pageSize+1)
    ]);
    const total = matched[0]?.total ?? 0;
    const more = pageSize>0 && matched.length>pageSize;
    const rows = more ? matched.slice(0,pageSize) : matched;
    const nextFilters = new URLSearchParams();
    for (const [key,value] of Object.entries({q,status:requestedStatus&&status,dorm,section})) if (value) nextFilters.set(key,value);
    if (more) nextFilters.set('after',rows.at(-1).rank+'-'+rows.at(-1).id);
    const nextPage = more ? '/people?'+nextFilters : '';
    if (fragment && !reunion) return json({html:page.directoryCards(rows,attendanceNames,false),next:nextPage});
    let attendees=rows;
    if(reunion){
      const [wishes,checks]=await Promise.all([
        all('SELECT member,target,request_id,accepted_at FROM meet_wishes WHERE member=? OR target=?',me,me),
        whatsappCompletion()
      ]);
      attendees=reunionCatchups(rows,wishes,me,checks.every(check=>check.complete),catchup);
    }
    const returnFilters=new URLSearchParams();
    for(const [key,value] of Object.entries({q,dorm,section,catchup}))if(value)returnFilters.set(key,value);
    const reunionReturn='/reunion'+(returnFilters.size?'?'+returnFilters:'')+'#reunion-attendees';
    const directory = page.directory(attendees,attendanceNames,q,status,dorms,dorm,reunion,sections,section,catchup,reunionReturn,reunion?attendees.length:total,nextPage);
    if (!reunion) return show('Classmates',directory);
    const tracker = await one("SELECT * FROM reunion_tracker WHERE member=? AND status='attending'",me);
    const saved = tracker && await one('SELECT details FROM reunion_logistics WHERE member=?',me);
    return renderPage('December reunion',page.reunion(member,tracker,saved && parse(saved.details),directory,u.searchParams.get('saved')==='1'),member,{home:true});
  }
  const person = path.match(/^\/people\/(\d+)$/);
  if (person) {
    const key = Number(person[1]);
    const row = await one(`SELECT r.*,a.status AS own_attendance,${portrait} AS portrait,CASE WHEN coalesce(m.attendance_private,0)=0 THEN a.status END AS status
      FROM roster r LEFT JOIN members m ON m.id=r.id LEFT JOIN attendance a ON a.member=r.id ${seedJoin} WHERE r.id=?`,+pilot,key);
    if (!row) return missing();
    if(isMemorial(row.name))return renderPage(row.name,page.memorial(row,await posts(`EXISTS(SELECT 1 FROM (SELECT ? AS id) subject_ref WHERE ${aboutPerson('subject_ref.id')} AND NOT EXISTS(SELECT 1 FROM muted_subjects m WHERE m.post=p.id))`,[key],100,'p.created DESC,p.id DESC',key),id(),await loadTribute(env.MEDIA)),member,{home:true,active:'/remembering-sachin'});
    const [seed,selected,section,photos,stories,profilePhotos,meet,yearbook] = await Promise.all([
      one(`SELECT s.source_data FROM profile_seeds s WHERE s.roster_id=? AND ${visibleSeed}`,key,+pilot),
      all(`SELECT field,value,source FROM selected_profile_fields WHERE member=? AND pilot_only<=?
        AND field NOT IN ('thenPhotoObject','nowPhotoObject') ORDER BY priority`,key,+pilot),
      one('SELECT section FROM roster_sections WHERE member=?',key),
      Promise.resolve([]),
      profileMemories(key),
      all(`SELECT ph.slot,'yearbook/'||y.member||'/'||j.key AS media,ph.caption
        FROM yearbook_public y,json_each(y.images) j
        JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission') AND ph.object_key=json_extract(j.value,'$.key')
        WHERE y.member=? AND ph.slot IN ('then','now')
        UNION ALL SELECT substr(field,1,length(field)-11), 'profile-photo/'||member||'/'||substr(field,1,length(field)-11), ''
        FROM profile_fields WHERE member=? AND field IN ('thenPhotoObject','nowPhotoObject') AND value<>''`,key,key),
      meetSummary(key),
      yearbookEntry(db,key,me,admin)
    ]);
    const imported = parse(seed?.source_data);
    const details = {dorm:row.dorm,nickname:row.nickname,life:'',city:'',company:'',country:'',section:section?.section,education:'',professionalFocus:'',researchHighlight:''};
    for (const field of selected) {
      if (field.field==='section' && field.source==='selected_enrichment' && section) continue;
      details[field.field]=field.value;
    }
    return renderPage(row.name,page.person({...row,lifeGenerated:!!String(details.life||'').trim()&&selected.filter(item=>item.field==='life').at(-1)?.source==='selected_enrichment',linkedin:imported['LinkedIn URL'],profileLinks:imported['Profile links']},attendanceNames[key===me?row.own_attendance:row.status],details,photos,stories,me,pilot,id(),Object.fromEntries(profilePhotos.map(photo=>[photo.slot,photo])),meet,key===me&&await faceSchema(db),yearbook,admin),member,{home:true,active:'/people'});
  }

  if (path==='/photos-of-you' && !post) return await faceSchema(db)?show('Photos of you',page.photosOfYou(await photosOfYou(db,me),Math.max(0,Math.min(300,Number(u.searchParams.get('removed'))||0)))):missing();
  if (path==='/profile') {
    if (!post) {
      const [roster,fields,photos,checks,currentPortrait]=await Promise.all([
        one('SELECT r.dorm,r.nickname,rs.section,a.status AS attendance FROM roster r LEFT JOIN attendance a ON a.member=r.id LEFT JOIN roster_sections rs ON rs.member=r.id WHERE r.id=?',me),
        all('SELECT field,value,source FROM selected_profile_fields WHERE member=? AND pilot_only<=? ORDER BY priority',me,+pilot),
        all(`SELECT ph.slot,'yearbook/'||y.member||'/'||j.key AS media,ph.caption
          FROM yearbook_public y,json_each(y.images) j
          JOIN photos ph ON ph.submission=json_extract(j.value,'$.submission') AND ph.object_key=json_extract(j.value,'$.key')
          WHERE y.member=? AND ph.slot IN ('then','now')
          UNION ALL SELECT substr(field,1,length(field)-11),'profile-photo/'||member||'/'||substr(field,1,length(field)-11),''
          FROM profile_fields WHERE member=? AND field IN ('thenPhotoObject','nowPhotoObject') AND value<>''`,me,me),
        whatsappCompletion(),
        one(`SELECT ${portrait} AS media FROM roster r ${seedJoin} WHERE r.id=?`,+pilot,me)
      ]);
      const values={...roster,currentPortrait:currentPortrait?.media};for(const item of fields){
        if(item.field==='section'&&item.source==='selected_enrichment'&&roster.section)continue;
        values[item.field]=item.value;
      }
      values._lifeGenerated=!!String(values.life||'').trim()&&fields.filter(item=>item.field==='life').at(-1)?.source==='selected_enrichment';
      return show('Edit profile',page.editProfile(values,member,checks,Object.fromEntries(photos.map(photo=>[photo.slot,photo]))));
    }
    const f = await data();
    // The owner hides or shows their own 2006 yearbook entry; there is no target, so no one can act for someone else here.
    const ownAction = str(f,'action',40);
    if (ownAction==='iimages-hide'||ownAction==='iimages-show') {
      await setYearbookHidden(db,me,ownAction==='iimages-hide',me);
      return redirect('/people/'+me+'#iimages-2006');
    }
    const inline = f.get('field');
    // JavaScript clients ask for JSON and update the editor in place; plain form posts keep the redirect.
    const wantsJson = req.headers.get('Accept')==='application/json';
    const saved = async (extra={}) => wantsJson ? json({...await profileState(),...extra}) : redirect('/people/'+me);
    if (inline === 'attendance') {
      const status=str(f,'value',20);
      if (!Object.hasOwn(attendanceNames,status)) return invalid('Choose an attendance status.');
      await run('INSERT INTO attendance VALUES(?,?) ON CONFLICT(member) DO UPDATE SET status=excluded.status',me,status);
      return saved({attendance:attendanceNames[status]});
    }
    if (['portraitObject','thenPhotoObject','nowPhotoObject'].includes(inline)) {
      const file = f.get('photo');
      const photo = file instanceof File && file.size && file.size<=15*1024*1024
        && cleanPhoto(new Uint8Array(await file.arrayBuffer()));
      if (!photo) return invalid('Choose a JPEG or PNG up to 15 MB.');
      const original = await one("SELECT value FROM profile_fields WHERE member=? AND field=?",me,inline);
      const key = 'profile/'+id();
      await env.MEDIA.put(key,photo.bytes,{httpMetadata:{contentType:photo.type}});
      try { await run('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)',me,inline,key); }
      catch (error) { await env.MEDIA.delete(key); throw error; }
      warmVariants(env,ctx,key,photo.type,profileWidths);
      if (original?.value) await Promise.allSettled([env.MEDIA.delete(original.value)]);
      await markRefs(env,me);
      return saved();
    }
    if (inline) {
      if (![...profileKeys,'country','section','displayName','professionalFocus','researchHighlight'].includes(inline)) return invalid('Field unavailable.');
      const value=str(f,'value',inline==='displayName'?120:4000);
      await run('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)',me,inline,value);
      return saved({value});
    }
    const keys=['life','city','company','education','dorm','family','nickname'];
    if(f.get('profile_form')==='all')keys.push(...profileKeys,'country','section','displayName','professionalFocus','researchHighlight');
    const jobs = [...new Set(keys)].filter(key=>f.has(key)||f.has('hide_'+key)).map(key => {
      if (f.has('hide_'+key)) return sql('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)',me,key,'');
      const value = str(f,key,key==='displayName'?120:4000);
      return value ? sql('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)',me,key,value) : sql('DELETE FROM profile_fields WHERE member=? AND field=?',me,key);
    });
    if(f.has('section')){
      const section=str(f,'section',20).trim().toUpperCase();
      // Keep profile display and section directory filters in sync.
      jobs.push(section?sql('INSERT INTO roster_sections(member,section) VALUES(?,?) ON CONFLICT(member) DO UPDATE SET section=excluded.section',me,section):sql('DELETE FROM roster_sections WHERE member=?',me));
      jobs.push(sql('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)',me,'section',section));
    }
    const uploads=[];
    // Validate every selected photo before writing any profile data.
    for(const [name,key] of [['portraitPhoto','portraitObject'],['thenPhoto','thenPhotoObject'],['nowPhoto','nowPhotoObject']]){
      const file=f.get(name);
      if(!(file instanceof File)||!file.size)continue;
      const photo=file.size<=15*1024*1024&&cleanPhoto(new Uint8Array(await file.arrayBuffer()));
      if(!photo)return invalid('Choose JPEG or PNG photos up to 15 MB each. Your changes have not been saved.');
      uploads.push({field:key,key:'profile/'+id(),photo});
    }
    const attendance=f.has('attendance')?str(f,'attendance',20):null;
    if(attendance!==null&&!Object.hasOwn(attendanceNames,attendance))return invalid('Choose an attendance status.');
    const originals=uploads.length?await all("SELECT field,value FROM profile_fields WHERE member=? AND field IN ('portraitObject','thenPhotoObject','nowPhotoObject')",me):[];
    const uploaded=[];
    try{
      for(const upload of uploads){
        await env.MEDIA.put(upload.key,upload.photo.bytes,{httpMetadata:{contentType:upload.photo.type}});
        uploaded.push(upload.key);
        jobs.push(sql('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)',me,upload.field,upload.key));
      }
      if(attendance!==null)jobs.push(sql('INSERT INTO attendance VALUES(?,?) ON CONFLICT(member) DO UPDATE SET status=excluded.status',me,attendance));
      jobs.push(sql('UPDATE members SET attendance_private=? WHERE id=?',+f.has('attendance_private'),me));
      await db.batch(jobs);
    }catch(error){
      await Promise.allSettled(uploaded.map(key=>env.MEDIA.delete(key)));
      throw error;
    }
    for (const upload of uploads) warmVariants(env,ctx,upload.key,upload.photo.type,profileWidths);
    if (uploads.length) await markRefs(env,me);
    await Promise.allSettled(originals.filter(row=>uploads.some(upload=>upload.field===row.field)&&row.value).map(row=>env.MEDIA.delete(row.value)));
    return saved();
  }
  if (path==='/gallery') {
    const personId = u.searchParams.has('person') ? Number(u.searchParams.get('person')) : null;
    if(personId!==null&&(!Number.isSafeInteger(personId)||personId<1))return invalid('Choose a classmate.');
    const [photos,memories]=await Promise.all([gallery(personId),personId===null?posts('1',[],100):profileMemories(personId)]);
    return show('Gallery',page.gallery(photos.filter(photo=>!photo.source.startsWith('/posts/')),memories,personId));
  }
  if (path==='/topics') {
    const q = (u.searchParams.get('q')||'').slice(0,100);
    const rows = await all(`SELECT t.* FROM topics t WHERE t.hidden=0 AND t.redirect IS NULL AND instr(lower(t.title),lower(?))>0
      AND EXISTS(SELECT 1 FROM posts p WHERE ${aboutTopic('t.id')} AND ${postVisible}) ORDER BY t.title`,q);
    return show('Memory topics',page.topics(rows,q));
  }
  const topic = path.match(/^\/topics\/([\w-]+)$/);
  if (topic && !post) {
    const row = await one('SELECT * FROM topics WHERE id=?',topic[1]);
    if (row?.redirect) return redirect('/topics/'+row.redirect);
    if (!row || row.hidden) return missing();
    return show(row.title,page.topic(row,await posts(`EXISTS(SELECT 1 FROM (SELECT ? AS id) topic_ref WHERE ${aboutTopic('topic_ref.id')})`,[row.id])));
  }
  if (path==='/compose/photo' && !post) {
    const row=await one('SELECT object_key,type FROM uploads WHERE id=? AND owner=? AND post IS NULL',u.searchParams.get('id'),me);
    if(!row)return missing();
    const object=await env.MEDIA.get(row.object_key);
    return object?new Response(object.body,{headers:{'Content-Type':row.type,'Cache-Control':'private, no-store'}}):missing();
  }
  if (path==='/compose/photo' && post) {
    const photoId=u.searchParams.get('id')||'';
    if (!/^[a-f0-9-]{36}$/.test(photoId)) return invalid('Photo unavailable.');
    const previous=await one('SELECT owner,post FROM active_uploads WHERE id=?',photoId);
    if (previous) return previous.owner===me && !previous.post ? json({id:photoId}) : missing();
    if (!await limit('photo:'+me,60,360)) return new Response('Photo upload limit reached. Try again later.',{status:429});
    if (Number(req.headers.get('Content-Length'))>16*1024*1024) return invalid('Each photo must be 15 MB or smaller.');
    const file=(await data()).get('photo');
    if (!(file instanceof File) || !file.size || file.size>15*1024*1024) return invalid('Each photo must be 15 MB or smaller.');
    const clean=cleanPhoto(new Uint8Array(await file.arrayBuffer()));
    if (!clean) return invalid('Choose a JPEG or PNG photo.');
    const object='social/'+id();
    await env.MEDIA.put(object,clean.bytes,{httpMetadata:{contentType:clean.type}});
    let inserted;
    try {
      inserted=await one('INSERT OR IGNORE INTO uploads VALUES(?,?,?,?,?,?,NULL,?) RETURNING id',
        photoId,me,object,clean.type,await hash(clean.bytes),'',now());
    } finally {
      if (!inserted) await env.MEDIA.delete(object);
    }
    if (!inserted && !await one('SELECT 1 FROM active_uploads WHERE id=? AND owner=? AND post IS NULL',photoId,me)) return missing();
    if (inserted) warmVariants(env,ctx,object,clean.type,memoryWidths);
    return json({id:photoId});
  }
  if (path==='/compose') {
    const subject = Number(u.searchParams.get('person')) || null;
    if (!post) {
      const topic=u.searchParams.get('topic');
      const personRow=subject && await one('SELECT name FROM roster WHERE id=?',subject);
      const topicRow=topic && await one('SELECT title FROM topics WHERE id=? AND hidden=0 AND redirect IS NULL',topic);
      return show('Share a memory',page.compose(id(),[
        ...(personRow?[{value:'person:'+subject,label:personRow.name}]:[]),
        ...(topicRow?[{value:'topic:'+topic,label:topicRow.title}]:[])
      ]));
    }
    if (!await limit('post:'+me,10,20)) return invalid('Please wait before posting again.');
    if (Number(req.headers.get('Content-Length'))>96*1024*1024) return invalid('Photos are too large.');
    const f = await data(), key = str(f,'id',50), body = str(f,'body');
    const files = f.getAll('images').filter(image=>image instanceof File && image.size);
    const staged = f.getAll('photoId').map(String);
    const title = str(f,'title',120);
    const photoCount = files.length+staged.length;
    if (!/^[a-f0-9-]{36}$/.test(key) || (!body&&!photoCount)) return invalid('Add a photo or write a memory.');
    if (photoCount>300 || new Set(staged).size!==staged.length || staged.some(photo=>! /^[a-f0-9-]{36}$/.test(photo))) return invalid('Choose up to 300 distinct photos.');
    if (photoCount>1 && !title) return invalid('Give your album a title.');
    const wantsJson=req.headers.get('Accept')==='application/json';
    const success=async()=>wantsJson?json({html:page.memoryCards(await posts('p.id=?',[key],1)),url:'/posts/'+key}):redirect('/posts/'+key);
    const original = await one('SELECT author FROM posts WHERE id=?',key);
    if (original) return original.author===me ? success() : missing();
    const selections=[...new Set(f.getAll('about').map(String))];
    if (selections.length>30) return invalid('Choose up to 30 tags.');
    if (staged.length) {
      const owned=await all(`SELECT id FROM active_uploads WHERE owner=? AND post IS NULL AND id IN (SELECT value FROM json_each(?))`,me,JSON.stringify(staged));
      if (owned.length!==staged.length) return invalid('One or more photos are unavailable.');
    }
    const jobs = [sql('INSERT INTO posts(id,author,body,created) VALUES(?,?,?,?)',key,me,body||'Shared a photo.',now())];
    for (const selected of selections) {
      const split=selected.indexOf(':');
      const kind=selected.slice(0,split), target=selected.slice(split+1).trim();
      if (kind==='person' && /^\d+$/.test(target)) {
        jobs.push(sql("INSERT OR IGNORE INTO memory_about SELECT ?,'person',CAST(id AS TEXT) FROM roster WHERE id=?",key,Number(target)));
      } else if (kind==='topic' && target.length<=100) {
        jobs.push(sql("INSERT OR IGNORE INTO memory_about SELECT ?,'topic',id FROM topics WHERE id=? AND hidden=0 AND redirect IS NULL",key,target));
      } else if (['new','new-place','new-event'].includes(kind) && target && target.length<=100) {
        jobs.push(sql("INSERT OR IGNORE INTO topics(id,title,kind) VALUES(?,?,?)",id(),target,kind==='new-place'?'Place':kind==='new-event'?'Event':'Other'));
        jobs.push(sql("INSERT OR IGNORE INTO memory_about SELECT ?,'topic',id FROM topics WHERE title=? COLLATE NOCASE AND hidden=0 AND redirect IS NULL",key,target));
      } else return invalid('Choose a classmate or topic.');
    }
    const uploaded = [];
    const order = [...staged];
    if (staged.length) jobs.push(sql(`UPDATE uploads SET post=? WHERE owner=? AND id IN (SELECT value FROM json_each(?)) AND post IS NULL`,key,me,JSON.stringify(staged)));
    try {
      for (const [index,image] of files.entries()) {
        if (image.size>15*1024*1024) return invalid('Each photo must be 15 MB or smaller.');
        const bytes = new Uint8Array(await image.arrayBuffer());
        const clean = cleanPhoto(bytes);
        if (!clean) return invalid('Choose a JPEG or PNG photo. Re-export unsupported photos as JPEG.');
        const digest = await hash(clean.bytes);
        const imageId = id();
        order.push(imageId);
        const object = 'social/'+imageId;
        await env.MEDIA.put(object,clean.bytes,{httpMetadata:{contentType:clean.type}});
        uploaded.push(object);
        jobs.push(sql('INSERT INTO uploads VALUES(?,?,?,?,?,?,?,?)',imageId,me,object,clean.type,digest,str(f,'caption_'+index,240),key,now()));
      }
      if (order.length>1) {
        const cover=str(f,'cover',50);
        jobs.push(sql('INSERT INTO memory_albums VALUES(?,?,?,?)',key,title,order.includes(cover)?cover:order[0],JSON.stringify(order)));
      }
      await db.batch(jobs);
      // A one-photo memory tagged with a classmate can give them a face reference once the photo has been scanned.
      if (order.length===1) for (const selected of selections) if (/^person:\d+$/.test(selected)) await markRefs(env,Number(selected.slice(7)));
      for (const object of uploaded) warmVariants(env,ctx,object,'image/jpeg',memoryWidths);
      uploaded.length=0;
      return success();
    } finally {
      await Promise.allSettled(uploaded.map(key=>env.MEDIA.delete(key)));
    }
  }
  const albumEdit = path.match(/^\/posts\/([\w-]+)\/album$/);
  if (albumEdit) {
    const key=albumEdit[1];
    const item=(await posts('p.id=?',[key],1))[0];
    if (!item || item.author!==me || item.origin) return missing();
    const current=await all('SELECT id,caption FROM active_uploads WHERE post=? ORDER BY id',key);
    const album=await one('SELECT * FROM memory_albums WHERE post=?',key);
    if (!post) {
      const order=album?JSON.parse(album.photo_order):current.map(p=>p.id);
      current.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
      const version=await one('SELECT version FROM album_versions WHERE post=?',key);
      return show('Edit album',page.albumEditor(item,current,album,String(version?.version||0)));
    }
    const f=await data(), ids=f.getAll('photoId').map(String),title=str(f,'title',120),body=str(f,'body');
    if (!ids.length || ids.length>300 || new Set(ids).size!==ids.length || ids.some(x=>! /^[a-f0-9-]{36}$/.test(x))) return invalid('Choose between 1 and 300 distinct photos.');
    if (!title) return invalid('Give your album a title.');
    // One JSON parameter avoids D1's 100-bound-parameter ceiling for large albums.
    const owned=await all('SELECT id,post FROM active_uploads WHERE owner=? AND id IN (SELECT value FROM json_each(?))',me,JSON.stringify(ids));
    if (owned.length!==ids.length || owned.some(p=>p.post && p.post!==key)) return invalid('One or more photos are unavailable.');
    const expected=str(f,'revision',20000);
    const version=await one('SELECT version FROM album_versions WHERE post=?',key);
    const revision=String(version?.version||0);
    // A repeat of a confirmed save is harmless, including retry after a lost response.
    const unchanged=album && album.photo_order===JSON.stringify(ids) && album.title===title && item.body===(body||'Shared a photo.') && album.cover===str(f,'cover',50);
    if (expected!==revision && !unchanged) return new Response('This album changed in another tab. Reload before editing.',{status:409});
    if (!unchanged) {
      const removed=current.filter(p=>!ids.includes(p.id));
      const cover=str(f,'cover',50);
      try { await db.batch([
        sql('INSERT INTO album_versions VALUES(?,?) ON CONFLICT(post) DO UPDATE SET version=excluded.version',key,Number(expected)+1),
        sql('UPDATE posts SET body=? WHERE id=?',body||'Shared a photo.',key),
        sql('UPDATE uploads SET post=? WHERE owner=? AND post IS NULL AND id IN (SELECT value FROM json_each(?))',key,me,JSON.stringify(ids)),
        sql('INSERT OR IGNORE INTO removed_album_photos SELECT value,? FROM json_each(?)',now(),JSON.stringify(removed.map(p=>p.id))),
        sql('INSERT INTO memory_albums(post,title,cover,photo_order) VALUES(?,?,?,?) ON CONFLICT(post) DO UPDATE SET title=excluded.title,cover=excluded.cover,photo_order=excluded.photo_order',key,title,ids.includes(cover)?cover:ids[0],JSON.stringify(ids))
      ]); } catch(error) { if(String(error).includes('Album changed'))return new Response('This album changed in another tab. Reload before editing.',{status:409});throw error; }
    }
    return req.headers.get('Accept')==='application/json'?json({url:'/posts/'+key}):redirect('/posts/'+key);
  }
  const postMatch = path.match(/^\/posts\/([\w-]+)$/);
  if (postMatch) {
    const key = postMatch[1];
    const f = post ? await data() : null, action = f?.get('action');
    const panel = !post && u.searchParams.get('panel')==='comments';
    // Routine actions and the comments panel need only an authorized, visible post, not its full card.
    const light = panel || (!post && u.searchParams.get('panel')==='tags') || ['like','comment','edit-comment','delete-comment','tag-accept','tag-remove','unassociate','delete','edit'].includes(action);
    const item = light
      ? await one(`SELECT p.id,p.author,p.subject,p.origin,
          EXISTS(SELECT 1 FROM memory_about ma WHERE ma.post=p.id AND ma.kind='person' AND ma.target=CAST(CAST(? AS INTEGER) AS TEXT)) AS is_about_me
          FROM posts p JOIN roster r ON r.id=p.author LEFT JOIN topics t ON t.id=p.topic WHERE p.id=? AND ${postVisible}`,me,key)
      : (await posts('p.id=?',[key],1))[0];
    if (!item) return missing();
    const origin=await faceSchema(db)?'pt.origin':"'manual'";
    const photoLinks=()=>all(`SELECT pt.media,pt.kind,'/people/'||r.id AS href,r.name AS label,${origin} AS origin,r.id AS member
      FROM active_photo_tags pt JOIN roster r ON r.id=pt.target WHERE pt.post=? AND pt.kind='person'
      UNION ALL SELECT pt.media,pt.kind,'/topics/'||t.id,t.title,${origin},NULL FROM active_photo_tags pt
      JOIN topics t ON t.id=pt.target WHERE pt.post=? AND pt.kind='topic' AND t.hidden=0 AND t.redirect IS NULL
      ORDER BY kind,label`,key,key);
    if (!post) {
      if (u.searchParams.get('panel')==='tags') {
        const photo=u.searchParams.get('photo')||'';
        if(photo) return json(await all(`SELECT r.id AS member,r.name AS label,${origin} AS origin FROM active_photo_tags pt JOIN roster r ON r.id=pt.target WHERE pt.post=? AND pt.media=? AND pt.kind='person' ORDER BY r.name`,key,photo));
        return json(await all("SELECT r.id AS member,r.name AS label,'manual' AS origin FROM roster r WHERE r.id IN (SELECT member FROM tags WHERE post=? AND status='accepted' UNION SELECT CAST(target AS INTEGER) FROM memory_about WHERE post=? AND kind='person') ORDER BY r.name",key,key));
      }
      if (panel) return json((await all('SELECT c.id,c.author,c.body,r.name FROM comments c JOIN roster r ON r.id=c.author WHERE c.post=? AND c.hidden=0 ORDER BY c.created,c.id',key)).map(({id,author,name,body})=>({id,name,body,canDelete:author===me})));
      const [comments,tags,images,tagLinks,album] = await Promise.all([
        all('SELECT c.*,r.name FROM comments c JOIN roster r ON r.id=c.author WHERE c.post=? AND c.hidden=0 ORDER BY c.created,c.id',key),
        all("SELECT t.*,r.name FROM tags t JOIN roster r ON r.id=t.member WHERE t.post=? AND (t.status='accepted' OR t.member=? OR ?=?)",key,me,me,item.author),
        all("SELECT 'post/'||id AS media,caption,'/posts/'||post AS source FROM active_uploads WHERE post=? UNION ALL SELECT 'legacy/'||?||'/'||ROW_NUMBER() OVER(ORDER BY object_key),caption,'/posts/'||? FROM photos WHERE submission=?",key,key,key,item.origin),
        photoLinks(),
        one('SELECT photo_order FROM memory_albums WHERE post=?',key)
      ]);
      const links=photosForTags(tagLinks);
      for(const photo of images) photo.linked_tags=JSON.stringify(links.get(photo.media)||[]);
      const order=album?new Map(JSON.parse(album.photo_order).map((photo,index)=>['post/'+photo,index])):null;
      if (order) images.sort((a,b)=>(order.get(a.media)??Infinity)-(order.get(b.media)??Infinity));
      return show(item.album_title || (images.length>1?'Photo album':'A batch memory'),page.post(item,comments,tags,images,me,u.searchParams.has('comment-posted')));
    }
    let savedComment,photoScope;
    if (action==='like') {
      if (f.get('liked')==='1') await run('INSERT OR IGNORE INTO likes VALUES(?,?)',key,me);
      else await run('DELETE FROM likes WHERE post=? AND member=?',key,me);
    } else if (action==='comment') {
      const body = str(f,'body',1200);
      if (!body) return invalid('Write a comment first.');
      if (!await limit('comment:'+me,10,30)) return new Response('Please wait before commenting again.',{status:429});
      savedComment={id:id(),author:me,name:member.name,body,canDelete:true};
      await run('INSERT INTO comments(id,post,author,body,created) VALUES(?,?,?,?,?)',savedComment.id,key,me,body,now());
    } else if (action==='tag-add') {
      photoScope=str(f,'photo',100);
      if (photoScope && !JSON.parse(item.collage_photos||'[]').includes(photoScope)) return missing();
      const selection=str(f,'tag',112);
      const [kind,target]=selection.includes(':')?[selection.slice(0,selection.indexOf(':')),selection.slice(selection.indexOf(':')+1).trim()]:['person',selection];
      if (!target || target.length>100) return invalid('Choose a tag.');
      if (!await limit('tag:'+me,10,20)) return new Response('Please wait before tagging again.',{status:429});
      const tagJobs=[sql('INSERT INTO notification_tag_actor VALUES(?,?)',key,me)];
      if (kind==='person' && /^\d+$/.test(target) && await one('SELECT id FROM roster WHERE id=?',Number(target))) {
        if (photoScope) tagJobs.push(await faceSchema(db)
          ? sql("INSERT INTO photo_tags(post,media,kind,target) VALUES(?,?,'person',?) ON CONFLICT(post,media,kind,target) DO UPDATE SET origin='manual'",key,photoScope,target)
          : sql("INSERT OR IGNORE INTO photo_tags(post,media,kind,target) VALUES(?,?,'person',?)",key,photoScope,target));
        else tagJobs.push(sql("INSERT INTO tags VALUES(?,?,'accepted') ON CONFLICT(post,member) DO UPDATE SET status='accepted' WHERE tags.status='pending'",key,Number(target)));
      } else if (kind==='topic' && await one('SELECT 1 FROM topics WHERE id=? AND hidden=0 AND redirect IS NULL',target)) {
        if (photoScope) tagJobs.push(sql("INSERT OR IGNORE INTO photo_tags(post,media,kind,target) VALUES(?,?,'topic',?)",key,photoScope,target));
        else tagJobs.push(sql("INSERT OR IGNORE INTO memory_about VALUES(?,'topic',?)",key,target));
      } else if (['new-place','new-event'].includes(kind)) {
        tagJobs.push(
          sql('INSERT OR IGNORE INTO topics(id,title,kind) VALUES(?,?,?)',id(),target,kind==='new-place'?'Place':'Event'),
          photoScope
            ? sql("INSERT OR IGNORE INTO photo_tags(post,media,kind,target) SELECT ?,?,'topic',id FROM topics WHERE title=? COLLATE NOCASE AND hidden=0 AND redirect IS NULL",key,photoScope,target)
            : sql("INSERT OR IGNORE INTO memory_about SELECT ?,'topic',id FROM topics WHERE title=? COLLATE NOCASE AND hidden=0 AND redirect IS NULL",key,target)
        );
      } else return invalid('Choose a classmate, place or event.');
      await db.batch([...tagJobs,sql('DELETE FROM notification_tag_actor WHERE post=?',key)]);
      // A hand tag can become the person's face reference: on a one-face photo such as a Placecom portrait, or on a
      // single-photo memory as a whole.
      if (kind==='person' && /^\d+$/.test(target)) await markRefs(env,Number(target));
    } else if (action==='tag-correct') {
      photoScope=str(f,'photo',100);
      const target=str(f,'tag',112);
      if(!/^\d+$/.test(target)) return invalid('Choose a classmate.');
      if (!await limit('tag:'+me,10,20)) return new Response('Please wait before correcting tags.',{status:429});
      if(photoScope){
        if(!JSON.parse(item.collage_photos||'[]').includes(photoScope)) return missing();
        const tag=await one("SELECT target FROM active_photo_tags WHERE post=? AND media=? AND kind='person' AND target=?",key,photoScope,target);
        if(tag){
        const jobs=[sql("DELETE FROM photo_tags WHERE post=? AND media=? AND kind='person' AND target=?",key,photoScope,target)];
        if(await faceSchema(db)) jobs.push(sql("INSERT INTO face_matches(media,member,post,face,score,state,created) VALUES(?,?,?,NULL,0,'removed',?) ON CONFLICT(media,member) DO UPDATE SET state='removed'",photoScope,Number(target),key,Date.now()));
        if(await faceSchema(db)) jobs.push(sql("DELETE FROM notifications WHERE recipient=? AND event_key='found:'||? AND NOT EXISTS(SELECT 1 FROM photo_tags WHERE post=? AND kind='person' AND target=? AND origin='auto')",Number(target),key,key,target));
        await db.batch(jobs);
        // The photo may have been this person's face reference.
        await markRefs(env,Number(target));
        }
      }else{
        await db.batch([sql("DELETE FROM tags WHERE post=? AND member=? AND status='accepted'",key,Number(target)),sql("DELETE FROM memory_about WHERE post=? AND kind='person' AND target=?",key,target)]);
        await markRefs(env,Number(target));   // that memory's photo may have been their face reference
      }
    } else if (action==='edit-comment' || action==='delete-comment') {
      const comment = str(f,'comment',50), body = str(f,'body',1200);
      if (action==='edit-comment' && body) await run('UPDATE comments SET body=? WHERE id=? AND post=? AND author=?',body,comment,key,me);
      else if (action==='delete-comment') await run('UPDATE comments SET hidden=1 WHERE id=? AND post=? AND author=?',comment,key,me);
    } else if (action==='tag-accept' || action==='tag-remove') {
      await run('UPDATE tags SET status=? WHERE post=? AND member=?',action==='tag-accept'?'accepted':'declined',key,me);
      await markRefs(env,me);
    } else if (action==='unassociate' && item.subject===me) {
      await run('INSERT OR IGNORE INTO muted_subjects VALUES(?)',key);
    } else if (action==='unassociate' && item.is_about_me) {
      await run("DELETE FROM memory_about WHERE post=? AND kind='person' AND target=?",key,String(me));
      await markRefs(env,me);
    } else if (action==='delete' && item.author===me) {
      await db.batch([sql('UPDATE posts SET hidden=1 WHERE id=?',key),...await forgetPostFaces(db,key)]);
      return redirect('/');
    } else if (action==='edit' && item.author===me) {
      const body = str(f,'body');
      if (body) await run('UPDATE posts SET body=? WHERE id=?',body,key);
    } else return invalid('Action unavailable.');
    if (req.headers.get('Accept')==='application/json' && ['like','comment','tag-add','tag-correct','delete-comment'].includes(action)) {
      if (action==='like') {
        const updated = await one('SELECT (SELECT count(*) FROM likes WHERE post=?) AS likes,EXISTS(SELECT 1 FROM likes WHERE post=? AND member=?) AS liked',key,key,me);
        return json({liked:!!updated.liked,likes:updated.likes});
      }
      if (savedComment) return json({comment:savedComment});
      if (action==='tag-add'||action==='tag-correct') {
        const tagged=photoScope?{linked_tags:JSON.stringify((await photoLinks()).filter(link=>link.media===photoScope))}
          :(await posts('p.id=?',[key],1))[0];
        return json({tags:page.memoryTags(tagged),cardTags:photoScope?null:page.cardTags(tagged)});
      }
      return json({ok:true});
    }
    const back = destination(f.get('return'));
    return redirect(action==='like' && f.has('return') ? back : action==='comment' ? path+'?comment-posted=1#comments' : path);
  }
  if (path==='/report' && post) {
    const f = await data(), target = str(f,'target',100), type = str(f,'type',20), reason = str(f,'reason',1000);
    if (!['profile','post','comment','photo','tag','topic'].includes(type)||!target||!reason) return invalid('Add a reason.');
    if (await limit('report:'+me,30,12)) await run('INSERT INTO reports(id,reporter,target_type,target,reason,created) VALUES(?,?,?,?,?,?)',id(),me,type,target,reason,now());
    return show('Report received','<p>The batch admins can review it.</p>');
  }
  if (path==='/notifications') {
    if (post) {
      const f=await data();
      if(f.get('action')==='clear-samples') await run('DELETE FROM notifications WHERE recipient=? AND sample=1',me);
      else await run('UPDATE notifications SET is_read=1 WHERE recipient=? AND is_read=0',me);
      return redirect(path);
    }
    const opened=Number(u.searchParams.get('open'));
    if(Number.isSafeInteger(opened)&&opened>0){
      const item=await one(`SELECT n.id,n.post,n.anchor,n.kind,n.actor,n.event_key ${notificationFrom}
        WHERE n.id=? AND n.recipient=? AND ${notificationVisible}`,opened,me);
      if(!item)return missing();
      await run('UPDATE notifications SET is_read=1 WHERE id=? AND recipient=?',opened,me);
      if (item.kind==='catchup_request') return redirect('/people/'+me+'#meet');
      if (item.kind==='catchup_accepted') return redirect('/people/'+item.actor);
      if (item.event_key.startsWith('found-all:')) return redirect('/photos-of-you');
      return redirect(item.post?'/posts/'+encode(item.post)+(item.anchor?'#'+encode(item.anchor):''):path);
    }
    const rows=await all(`SELECT n.*,r.name AS actor_name,${portrait} AS actor_portrait,
      w.request_id AS meet_request,w.accepted_at AS meet_accepted,
      p.body AS memory_text,a.title AS album_title,c.body AS comment_text,
      ${await faceSchema(db)?`(SELECT count(*) FROM photo_tags ft WHERE ft.post=n.post AND ft.kind='person' AND ft.target=CAST(n.recipient AS TEXT) AND ft.origin='auto')`:'0'} AS found_count,
      CASE
        WHEN n.anchor LIKE 'photo-post-%' THEN 'post/'||substr(n.anchor,12)
        WHEN n.anchor LIKE 'photo-legacy-%' THEN 'legacy/'||p.id||'/'||substr(n.anchor,length(p.id)+15)
        WHEN a.cover IS NOT NULL THEN 'post/'||a.cover
        WHEN EXISTS(SELECT 1 FROM active_uploads u WHERE u.post=p.id) THEN
          (SELECT 'post/'||u.id FROM active_uploads u WHERE u.post=p.id ORDER BY u.id LIMIT 1)
        WHEN EXISTS(SELECT 1 FROM photos ph WHERE ph.submission=p.origin) THEN 'legacy/'||p.id||'/1'
      END AS preview_media
      ${notificationFrom} LEFT JOIN meet_wishes w ON w.request_id=n.anchor AND n.kind IN ('catchup_request','catchup_accepted')
      LEFT JOIN roster r ON r.id=n.actor ${seedJoin}
      LEFT JOIN memory_albums a ON a.post=p.id
      LEFT JOIN comments c ON n.kind='comment' AND c.id=substr(n.anchor,9) AND c.post=p.id AND c.hidden=0
      WHERE n.recipient=? AND ${notificationVisible}
      ORDER BY n.created DESC,n.id DESC LIMIT 100`,+pilot,me);
    return show('Notifications',page.notifications(rows,me,(await whatsappCompletion()).every(check=>check.complete)));
  }
  if(path==='/admin/memory-wall-studio.js'){
    if(!admin||post)return missing();
    return new Response(studioJS,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'private, no-store'}});
  }
  if(path==='/admin/memory-wall-layout' || (path==='/admin/memory-walls' && u.searchParams.get('wall')!=='people')){
    if(!admin)return missing();
    await run('CREATE TABLE IF NOT EXISTS memory_wall_layout (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL)');
    const saved=await one('SELECT revision,payload FROM memory_wall_layout WHERE id=1');
    const rows=await all(candidateSQL);
    const roster=await all("SELECT r.id,r.name,r.dorm,rs.section FROM roster r LEFT JOIN roster_sections rs ON rs.member=r.id ORDER BY r.name");
    const photos=rows.map(r=>({id:r.id,digest:r.digest,album:r.album,theme:classify(r.album),people:JSON.parse(r.people)})).filter(r=>r.theme&&r.digest);
    const keys=['activities','campus','reunion'], map=new Map(photos.map(p=>[p.id,p]));
    if(path==='/admin/memory-wall-layout'){
      if(!post)return missing();
      let input;try{input=await req.json();}catch{return new Response('Invalid JSON',{status:400});}
      if(!input||input.revision!==(saved?.revision||0))return new Response('Another admin changed the layout. Reload before saving.',{status:409});
      const seen=new Set();
      for(const k of keys){
        const slots=input.walls?.[k];
        if(!Array.isArray(slots)||slots.length!==84)return new Response('Invalid slots',{status:400});
        for(const id of slots){if(id===null)continue;const p=map.get(id);if(!p||p.theme!==k||seen.has(p.digest))return new Response('Invalid or duplicate photo',{status:400});seen.add(p.digest);}
      }
      const payload=JSON.stringify(Object.fromEntries(keys.map(k=>[k,input.walls[k]])));
      const result=await run('INSERT INTO memory_wall_layout(id,revision,payload) VALUES(1,1,?) ON CONFLICT(id) DO UPDATE SET revision=revision+1,payload=excluded.payload WHERE revision=?',payload,input.revision);
      if(!result.meta.changes)return new Response('Another admin changed the layout. Reload before saving.',{status:409});
      return json({revision:input.revision+1});
    }
    if(post)return missing();
    const key=keys.includes(u.searchParams.get('wall'))?u.searchParams.get('wall'):'activities';
    const auto=saved?null:selectWalls(rows,roster.map(r=>r.id));
    const selected=saved?JSON.parse(saved.payload):Object.fromEntries(keys.map(k=>[k,auto.walls[k].map(p=>p.id)]));
    const initial=Object.fromEntries(keys.map(k=>[k,Array.from({length:84},(_,i)=>map.has(selected[k]?.[i])?selected[k][i]:null)]));
    const tabs=keys.concat('people').map(k=>'<a href="/admin/memory-walls?wall='+k+'">'+({activities:'Campus activities',campus:'Campus life',reunion:'2016 reunion',people:'People wall'})[k]+'</a>').join(' · ');
    const response=await show('Memory Wall Studio','<h1>Memory Wall Studio</h1><p><a href="/admin">Back to admin</a></p><nav>'+tabs+'</nav><p>Select a photo then another slot to move or swap. Drag and drop also works on desktop.</p>'+studioHTML({key,roster,photos,initial,revision:saved?.revision||0}));
    response.headers.set('Cache-Control','private, no-store');return response;
  }
  if (path==='/admin/memory-walls') {
    if (!admin || req.method!=='GET') return missing();
    const result=await cachedMemoryWalls(db);
    const roster=await all('SELECT id,name FROM roster ORDER BY name');
    const names=new Map(roster.map(r=>[r.id,r.name]));
    const labels={activities:'Campus activities',campus:'Campus life',reunion:'2016 reunion',people:'People wall'};
    const key=Object.hasOwn(labels,u.searchParams.get('wall'))?u.searchParams.get('wall'):'activities';
    const tabs=Object.entries(labels).map(([k,label])=>'<a href="/admin/memory-walls?wall='+k+'" '+(k===key?'aria-current="page"':'')+'>'+label+'</a>').join(' · ');
    let tiles='',summary='';
    if(key==='people'){
      const portraits=await all("SELECT r.id,r.name,COALESCE((SELECT NULLIF(trim(value),'') FROM profile_fields WHERE member=r.id AND field='dorm' AND trim(value) NOT IN ('','null')),r.dorm) AS dorm,COALESCE((SELECT NULLIF(trim(value),'') FROM profile_fields WHERE member=r.id AND field='section' AND trim(value) NOT IN ('','null')),(SELECT section FROM roster_sections WHERE member=r.id)) AS section,COALESCE((SELECT NULLIF(trim(value),'') FROM profile_fields WHERE member=r.id AND field='nowPhotoObject' AND trim(value) NOT IN ('','null')),(SELECT NULLIF(trim(value),'') FROM profile_fields WHERE member=r.id AND field='portraitObject' AND trim(value) NOT IN ('','null')),(SELECT NULLIF(trim(portrait_key),'') FROM profile_seeds WHERE roster_id=r.id AND review_status='approved')) AS then_key,COALESCE((SELECT NULLIF(trim(value),'') FROM profile_fields WHERE member=r.id AND field='thenPhotoObject' AND trim(value) NOT IN ('','null')),(SELECT object_key FROM face_refs WHERE member=r.id AND source IN ('archive','yearbook','then') ORDER BY CASE source WHEN 'archive' THEN 0 WHEN 'yearbook' THEN 1 ELSE 2 END LIMIT 1)) AS fallback FROM roster r ORDER BY r.name");
      tiles=portraits.map(r=>'<figure style="margin:0;min-width:0">'+(r.then_key||r.fallback?'<img loading="lazy" decoding="async" style="width:100%;aspect-ratio:1;object-fit:cover" src="/admin/memory-wall-portrait?id='+r.id+'&w=96" alt="'+escape(r.name)+'">':'<div style="aspect-ratio:1;background:#ddd">Missing</div>')+'<figcaption style="font-size:10px;overflow-wrap:anywhere">'+escape(r.name)+'<br>'+escape([r.dorm,r.section?(String(r.section).toLowerCase().startsWith('section')?r.section:'Section '+r.section):''].filter(Boolean).join(' · '))+'</figcaption></figure>').join('');
      summary=portraits.filter(r=>r.then_key||r.fallback).length+' / '+portraits.length+' potential portraits · '+portraits.filter(r=>r.then_key).length+' contemporary sources';
    }else{
      const rows=result.walls[key];
      summary=rows.length+' / 84 photos · '+new Set(rows.flatMap(r=>r.people)).size+' classmates on this wall';
      tiles=rows.map(r=>'<a href="/media/post/'+encodeURIComponent(r.id)+'" target="_blank" rel="noopener" title="'+escape(r.album+' — '+r.people.map(id=>names.get(id)||id).join(', '))+'"><img loading="lazy" decoding="async" style="display:block;width:100%;aspect-ratio:1;object-fit:cover" src="/media/post/'+encodeURIComponent(r.id)+'?w=96" alt="'+escape(r.album)+'"></a>').join('');
    }
    const missingNames=result.report.missing.map(id=>escape(names.get(id)||String(id))).join(', ');
    const body='<h1>Memory walls — read-only preview</h1><p><a href="/admin">Back to admin</a></p><nav>'+tabs+'</nav><p>'+summary+'</p><p>Overall thematic coverage: '+result.report.covered+' / '+result.report.roster+' · Twice: '+result.report.atLeastTwo+' · Three times: '+result.report.atLeastThree+'</p><div style="overflow:auto"><div style="min-width:720px;background:#eee6d7;padding:16px;color:#803f2e"><h2 style="text-align:center">'+labels[key]+'</h2><div style="display:grid;grid-template-columns:repeat('+(key==='people'?17:12)+',minmax(0,1fr));gap:4px">'+tiles+'</div><h3 style="text-align:center">IIMA · Class of 06</h3></div></div><details><summary>Unrepresented classmates ('+result.report.missing.length+')</summary><p>'+missingNames+'</p></details><details><summary>Album distribution</summary><ul>'+Object.entries(result.report.albums).filter(([,n])=>n>0).map(([a,n])=>'<li>'+escape(a)+': '+n+'</li>').join('')+'</ul></details>';
    const response=await show('Memory walls',body);
    response.headers.set('Cache-Control','private, no-store');
    return response;
  }
  if(path==='/admin/memory-wall-portrait'){
    if(!admin || req.method!=='GET')return missing();
    const memberId=Number(u.searchParams.get('id'));
    if(!Number.isSafeInteger(memberId))return missing();
    const row=await one("SELECT COALESCE(COALESCE((SELECT NULLIF(trim(value),'') FROM profile_fields WHERE member=r.id AND field='nowPhotoObject' AND trim(value) NOT IN ('','null')),(SELECT NULLIF(trim(value),'') FROM profile_fields WHERE member=r.id AND field='portraitObject' AND trim(value) NOT IN ('','null')),(SELECT NULLIF(trim(portrait_key),'') FROM profile_seeds WHERE roster_id=r.id AND review_status='approved')),COALESCE((SELECT NULLIF(trim(value),'') FROM profile_fields WHERE member=r.id AND field='thenPhotoObject' AND trim(value) NOT IN ('','null')),(SELECT object_key FROM face_refs WHERE member=r.id AND source IN ('archive','yearbook','then') ORDER BY CASE source WHEN 'archive' THEN 0 WHEN 'yearbook' THEN 1 ELSE 2 END LIMIT 1))) AS object_key FROM roster r WHERE r.id=?",memberId);
    const response=await servePhoto(env,row,req,false,ctx);
    const headers=new Headers(response.headers);if(response.ok||response.status===304)headers.set('Cache-Control','private, max-age=300, must-revalidate');
    return new Response(response.body,{status:response.status,headers});
  }
  if (path==='/admin/analytics' && admin && !post) {
    const days=u.searchParams.get('days')==='90'?90:30;
    const since=now()-days*86400000;
    const events=await all(`SELECT e.id,e.occurred,e.member,r.name,e.event,e.path FROM site_events e
      LEFT JOIN roster r ON r.id=e.member WHERE e.occurred>=? AND e.id<? ORDER BY e.id DESC LIMIT 501`,
      since,Number(u.searchParams.get('before'))||Number.MAX_SAFE_INTEGER);
    const more=events.length>500;
    if(more) events.pop();
    const next=more?'/admin/analytics?days='+days+'&before='+events.at(-1).id:'';
    if (u.searchParams.get('format')==='json') return json({events,next:next?next+'&format=json':null});
    const totals=await all(`SELECT event,count(*) AS total,count(DISTINCT member) AS members,
      sum(member IS NULL) AS anonymous FROM site_events WHERE occurred>=? GROUP BY event`,since);
    const pages=await all(`SELECT path,count(*) AS total FROM site_events WHERE event='page_view' AND occurred>=?
      GROUP BY path ORDER BY total DESC,path LIMIT 20`,since);
    return show('Site analytics',page.analytics(totals,pages,events.slice(0,100),days,next));
  }
  if (path==='/admin/export' && admin && !post) {
    if (u.searchParams.get('kind')==='reunion') return json((await all(`SELECT r.id,r.name,t.spouse,t.children,t.both_nights,l.details,l.updated
      FROM reunion_tracker t JOIN roster r ON r.id=t.member LEFT JOIN reunion_logistics l ON l.member=r.id
      WHERE t.status='attending' ORDER BY r.name`)).map(({details,...row})=>({...row,details:details?parse(details):null})));
    if (u.searchParams.get('kind')==='pending') return json(await all(`SELECT r.id,r.name,c.email,m.mobile FROM roster r
      LEFT JOIN reminder_contacts c ON c.batchmate_id=r.id LEFT JOIN reminder_mobiles m ON m.batchmate_id=r.id
      WHERE NOT EXISTS(SELECT 1 FROM submissions s WHERE s.subject=r.id AND s.kind='self') ORDER BY r.name`));
    return json({submissions:await all('SELECT * FROM submissions ORDER BY created'),photos:await all('SELECT * FROM photos ORDER BY submission,slot')});
  }
  if(path==='/admin' && admin && !post && u.searchParams.get('view')!=='tools'){
    const [coverage,attendees]=await Promise.all([
      all(`SELECT r.id,r.name,${portrait} IS NOT NULL AS portrait,
        EXISTS(SELECT 1 FROM submissions y WHERE y.subject=r.id AND y.contributor=r.id AND y.kind='self') AS submitted,
        EXISTS(SELECT 1 FROM profile_fields f WHERE f.member=r.id) AS edited,
        EXISTS(SELECT 1 FROM selected_profile_fields f WHERE f.member=r.id
          AND f.source='selected_enrichment' AND f.pilot_only<=? AND trim(f.value)<>'') AS enriched,
        EXISTS(SELECT 1 FROM profile_fields f WHERE f.member=r.id AND f.field IN ('thenPhotoObject','nowPhotoObject') AND trim(f.value)<>'')
          OR EXISTS(SELECT 1 FROM yearbook_public y WHERE y.member=r.id AND json_array_length(y.images)>0) AS has_photos
        FROM roster r ${seedJoin} ORDER BY r.name`,+pilot,+pilot),
      all(`SELECT r.id,r.name,t.spouse,t.children,t.both_nights,l.details FROM reunion_tracker t
        JOIN roster r ON r.id=t.member LEFT JOIN reunion_logistics l ON l.member=r.id
        WHERE t.status='attending' ORDER BY r.name`)
    ]);
    return show('Admin View',page.adminSummary(coverage,attendees.map(({details,...row})=>({
      ...row,saved:!!details,missing:missingReunionDetails(reunionValues(row,parse(details)))
    }))));
  }
  if (path==='/admin/faces' && admin) {
    if (!post) return show('Face tagging',page.adminFaces(await faceAdminData(env),Number(u.searchParams.get('queued'))||0,u.searchParams.has('published')?Number(u.searchParams.get('published')):NaN));
    const action=str(await data(),'action',20);
    if (action==='scan-all') return redirect('/admin/faces?queued='+await sweep(env,5000,SCAN_ALL_PEOPLE));
    if (action==='publish') {
      const published=await publishShadow(env);
      return published===null?invalid('Switch FACE_TAGGING to on before publishing.'):redirect('/admin/faces?published='+published);
    }
    return invalid('Choose an action.');
  }
  if (path==='/admin' && admin) {
    if (!post) return show('Batch admin',page.admin(
      await all('SELECT * FROM reports WHERE resolved=0 ORDER BY created DESC LIMIT 100'),
      await all("SELECT s.roster_id,r.name,s.review_status FROM profile_seeds s JOIN roster r ON r.id=s.roster_id ORDER BY r.name"),
      await all('SELECT id,title FROM topics WHERE hidden=0 ORDER BY title'),
      await all("SELECT s.id,r.name FROM submissions s JOIN roster r ON r.id=s.subject WHERE s.kind='memory' AND NOT EXISTS(SELECT 1 FROM posts p WHERE p.origin=s.id) ORDER BY s.created DESC")));
    const f = await data(), action = str(f,'action',40), target = str(f,'target',100), reason = str(f,'reason',1000);
    if (action==='attendance-preview' || action==='attendance-apply') {
      const lines = str(f,'rsvp',40000).split(/\r?\n/).filter(Boolean);
      const roster = new Set((await all('SELECT id FROM roster')).map(r=>r.id));
      const detected = new Set(), changes = [], errors = [];
      for (const [i,line] of lines.entries()) {
        const [raw,status,...extra] = line.split(',').map(v=>v.trim());
        if (i===0 && raw==='roster_id' && status==='status') continue;
        const key = Number(raw);
        if (extra.length || !roster.has(key) || !Object.hasOwn(attendanceNames,status) || detected.has(key)) errors.push(i+1);
        else {detected.add(key); changes.push([key,status]);}
      }
      if (!changes.length || errors.length) return invalid('No valid import. Check unknown or duplicate IDs and statuses on lines '+errors.join(', '));
      if (action==='attendance-preview') return show('Review attendance import',page.attendancePreview(changes,str(f,'rsvp',40000)));
      await db.batch([...changes.flatMap(r=>[
        sql('INSERT OR REPLACE INTO attendance VALUES(?,?)',...r),
        sql('INSERT INTO reunion_tracker(member,status) VALUES(?,?) ON CONFLICT(member) DO UPDATE SET status=excluded.status',...r)
      ]),
        sql('INSERT INTO audit VALUES(?,?,?,?,?,?)',id(),me,action,String(changes.length),'Tracker import',now())]);
      return redirect(path);
    }
    let update;
    if (action==='hide-post'||action==='restore-post') update=sql('UPDATE posts SET hidden=? WHERE id=?',+(action==='hide-post'),target);
    if (action==='hide-comment'||action==='restore-comment') update=sql('UPDATE comments SET hidden=? WHERE id=?',+(action==='hide-comment'),target);
    if (action==='hide-topic') update=sql('UPDATE topics SET hidden=1 WHERE id=?',target);
    if (action==='rename-topic') update=sql('UPDATE topics SET title=? WHERE id=?',str(f,'title',100),target);
    if (action==='approve-seed'||action==='hold-seed') update=sql('UPDATE profile_seeds SET review_status=? WHERE roster_id=?',action==='approve-seed'?'approved':'identity_review',Number(target));
    if (action==='resolve-report') update=sql('UPDATE reports SET resolved=1 WHERE id=?',target);
    if (action==='invite') update=sql('INSERT INTO members(id,invited) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET invited=1',Number(target));
    if (action==='revoke') update=sql('DELETE FROM sessions WHERE member=?',Number(target));
    if ((action==='iimages-hide'||action==='iimages-show') && !await iimagesSchema(db)) return invalid('The 2006 yearbook table is not installed yet (migration 0022).');
    if (action==='iimages-hide'||action==='iimages-show') update=action==='iimages-hide'
      ? sql('UPDATE iimages_2006 SET hidden=1,hidden_by=?,hidden_at=? WHERE member=?',me,now(),Number(target))
      : sql('UPDATE iimages_2006 SET hidden=0,hidden_by=NULL,hidden_at=NULL WHERE member=?',Number(target));
    if (action==='publish-memory') {
      const legacy = await one("SELECT * FROM submissions WHERE id=? AND kind='memory'",target);
      const body = parse(legacy?.payload).story;
      if (typeof body==='string' && body.trim()) update=sql('INSERT OR IGNORE INTO posts(id,author,subject,body,created,origin) VALUES(?,?,?,?,?,?)',
        id(),legacy.contributor,legacy.subject,body,Date.parse(legacy.created)||now(),legacy.id);
    }
    if (action==='merge-topic') {
      const to = str(f,'into',80);
      if (to===target || !await one('SELECT id FROM topics WHERE id=? AND hidden=0 AND redirect IS NULL',to)) return invalid('Choose an active destination topic.');
      await db.batch([sql('UPDATE posts SET topic=? WHERE topic=?',to,target),
        sql("INSERT OR IGNORE INTO memory_about SELECT post,kind,? FROM memory_about WHERE kind='topic' AND target=?",to,target),
        sql("INSERT OR IGNORE INTO photo_tags(post,media,kind,target) SELECT post,media,kind,? FROM photo_tags WHERE kind='topic' AND target=?",to,target),
        sql("DELETE FROM photo_tags WHERE kind='topic' AND target=?",target),
        sql("DELETE FROM memory_about WHERE kind='topic' AND target=?",target),sql('UPDATE topics SET redirect=? WHERE id=?',to,target),
        sql('UPDATE topics SET redirect=? WHERE redirect=?',to,target),sql('INSERT INTO audit VALUES(?,?,?,?,?,?)',id(),me,action,target,reason,now())]);
      return redirect(path);
    }
    if (!update || !reason) return invalid('Choose an action and provide a reason.');
    await db.batch([update,...(action==='hide-post'?await forgetPostFaces(db,target):action==='hide-topic'?await forgetTopicFaces(db,target):[]),sql('INSERT INTO audit VALUES(?,?,?,?,?,?)',id(),me,action,target,reason,now())]);
    return redirect(action.startsWith('iimages-')?'/people/'+Number(target)+'#iimages-2006':path);
  }
  return missing();
}

function cleanPhoto(bytes) {
  if (bytes[0]===255 && bytes[1]===216) {
    const parts=[bytes.subarray(0,2)];
    let offset=2;
    while (offset+4<=bytes.length && bytes[offset]===255) {
      const marker=bytes[offset+1];
      if (marker===218 && bytes.at(-2)===255 && bytes.at(-1)===217) {
        parts.push(bytes.subarray(offset));
        return {bytes:joinBytes(parts),type:'image/jpeg'};
      }
      const length=bytes[offset+2]*256+bytes[offset+3];
      if (length<2||offset+2+length>bytes.length) return null;
      if (!(marker>=225&&marker<=239)&&marker!==254) parts.push(bytes.subarray(offset,offset+2+length));
      offset+=2+length;
    }
  }
  if ([137,80,78,71,13,10,26,10].every((byte,index)=>bytes[index]===byte)) {
    const parts=[bytes.subarray(0,8)], view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    for (let offset=8;offset+12<=bytes.length;) {
      const size=view.getUint32(offset), end=offset+size+12;
      if (end>bytes.length) return null;
      const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));
      if (['IHDR','PLTE','IDAT','IEND','tRNS'].includes(type)) parts.push(bytes.subarray(offset,end));
      if (type==='IEND') return {bytes:joinBytes(parts),type:'image/png'};
      offset=end;
    }
  }
  return null;
}
function joinBytes(parts) {
  const joined = new Uint8Array(parts.reduce((size,part)=>size+part.length,0));
  let offset=0;
  for (const part of parts) {joined.set(part,offset);offset+=part.length;}
  return joined;
}

// Variant generation shared by concurrent requests in this isolate, keyed by variant object key.
const variantWork = new Map();
// Work that must finish but need not delay the response: deferred with waitUntil when available.
function afterResponse(ctx,work) {
  if (ctx?.waitUntil) { ctx.waitUntil(work); return Promise.resolve(); }
  return work;
}
// Transform one original into a WebP variant and store it. A variant that would not be smaller than
// the original is remembered with an empty marker under a separate prefix (never at the variant key,
// which older Worker versions would serve as an image), so it is never attempted again.
const markerKey = variantKey => variantKey.replace(/^variants\/webp-v1\//,'variants/webp-v1-original/');
function makeVariant(env,ctx,variantKey,original,width) {
  let work = variantWork.get(variantKey);
  if (work) { original?.body?.cancel?.().catch(()=>{}); return work; }
  work = (async () => {
    let store = null, bytes = null;
    try {
      const result = await env.IMAGES.input(original.body).transform({width:Number(width),height:Number(width)*2,fit:'scale-down'})
        .output({format:'image/webp',quality:80});
      const output = await result.response().arrayBuffer();
      if (output.byteLength<original.size) {
        bytes = output;
        store = env.MEDIA.put(variantKey,output,{httpMetadata:{contentType:'image/webp'}});
      } else store = env.MEDIA.put(markerKey(variantKey),new Uint8Array(0),{customMetadata:{original:'1'}});
    } catch (error) {
      if (env.DIAGNOSTICS==='true') console.error('Image resize:',error.message);
    }
    await afterResponse(ctx,(store||Promise.resolve()).catch(()=>null).finally(()=>variantWork.delete(variantKey)));
    return bytes;
  })();
  variantWork.set(variantKey,work);
  return work;
}
// Generate the sizes a new photo is shown at, after the upload response has been sent.
function warmVariants(env,ctx,objectKey,type,widths) {
  if (!env.IMAGES || !ctx?.waitUntil || type==='image/gif') return;
  ctx.waitUntil((async () => {
    for (const width of widths) {
      const variantKey=`variants/webp-v1/${width}/${objectKey}`;
      if (variantWork.has(variantKey) || await env.MEDIA.head?.(variantKey) || await env.MEDIA.head?.(markerKey(variantKey))) continue;
      const original=await env.MEDIA.get(objectKey);
      if (!original) return;
      await makeVariant(env,ctx,variantKey,original,width);
    }
  })().catch(()=>{}));
}

async function servePhoto(env,row,req,isPublic=false,ctx=null) {
  if (!row?.object_key) return missing();
  const width=new URL(req.url).searchParams.get('w');
  const variantKey=photoWidths.has(width)?`variants/webp-v1/${width}/${row.object_key}`:null;
  const serveOriginal = async () => {
    const object=await env.MEDIA.get(row.object_key);
    if (!object) return missing();
    const type=row.type || object.httpMetadata?.contentType || ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif'})[row.object_key.split('.').pop().toLowerCase()];
    if (!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(type)) { object.body?.cancel?.().catch(()=>{}); return missing(); }
    return {object,type};
  };
  if (variantKey) {
    const cached=await env.MEDIA.get(variantKey);
    if (cached && cached.size!==0) return photoResponse(cached,'image/webp',req,isPublic);
    cached?.body?.cancel?.().catch(()=>{});
    const pending=variantWork.get(variantKey);
    // Only on a miss: has this size already proved no smaller than the original?
    const marker=!pending && env.IMAGES && (await (env.MEDIA.head ? env.MEDIA.head(markerKey(variantKey)) : env.MEDIA.get(markerKey(variantKey))));
    marker?.body?.cancel?.().catch(()=>{});
    if (pending) { const bytes=await pending; if (bytes) return photoResponse({body:bytes.slice(0)},'image/webp',req,isPublic); }
    else if (!marker && env.IMAGES) {
      const original=await serveOriginal();
      if (original instanceof Response) return original;
      if (original.type==='image/gif') return photoResponse(original.object,original.type,req,isPublic);
      const bytes=await makeVariant(env,ctx,variantKey,original.object,width);
      if (bytes) return photoResponse({body:bytes.slice(0)},'image/webp',req,isPublic);
    }
  }
  const original=await serveOriginal();
  if (original instanceof Response) return original;
  return photoResponse(original.object,original.type,req,isPublic);
}

function photoResponse(object,type,req,isPublic) {
  const isPortrait=/^\/media\/(?:portrait|profile-photo)\//.test(new URL(req.url).pathname);
  const cacheControl=isPublic?'public, max-age=86400':`private, max-age=${isPortrait?60:300}, must-revalidate`;
  const headers=new Headers({'Content-Type':type,'Cache-Control':cacheControl});
  if (!isPublic) headers.set('Vary','Cookie');
  if (object.httpEtag) headers.set('ETag',object.httpEtag);
  if (object.httpEtag && req.headers.get('If-None-Match')?.split(/,\s*/).includes(object.httpEtag)) {
    object.body.cancel?.().catch(()=>{});
    return new Response(null,{status:304,headers});
  }
  return new Response(object.body,{headers});
}
