import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import worker from '../worker.mjs';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0000_baseline.sql',import.meta.url),'utf8'));
  sqlite.exec(`
    INSERT INTO roster VALUES(1,'Test Admin','D1','Admin'),(2,'Test Classmate','D2','TC');
    INSERT INTO reminder_contacts VALUES(1,'admin@example.test'),(2,'classmate@example.test');
    INSERT INTO profile_seeds VALUES(2,'{"Life, Lately draft":"An imported bio"}','pending','portrait.jpg');
    INSERT INTO submissions VALUES('self-2',2,2,'self','{"family":"Private family note","life":"Owner yearbook answer"}','2026-11-23');
    INSERT INTO photos VALUES('self-2','legacy.jpg','then','Then');
  `);
  for (const filename of readdirSync(new URL('../migrations/',import.meta.url)).filter(name=>name.endsWith('.sql')).sort()) {
    if(filename==='0000_baseline.sql'||filename==='0002_publish_imports.sql') continue;
    sqlite.exec(readFileSync(new URL('../migrations/'+filename,import.meta.url),'utf8'));
  }
  sqlite.exec("INSERT INTO members(id,role,invited) VALUES(1,'admin',1),(2,'member',1)");
  const objects=new Map([['portrait.jpg',new Uint8Array([1])],['legacy.jpg',new Uint8Array([2])]]);
  const DB={
    prepare(query){
      return {bind(...args){
        const stmt=sqlite.prepare(query);
        return {
          first: async()=>stmt.get(...args) ?? null,
          all: async()=>({results:stmt.all(...args)}),
          run: async()=>stmt.run(...args),
        };
      }};
    },
    async batch(jobs){
      sqlite.exec('BEGIN');
      try { const results=[]; for (const job of jobs) results.push(await job.run()); sqlite.exec('COMMIT'); return results; }
      catch(error){sqlite.exec('ROLLBACK');throw error;}
    }
  };
  const env={DB,DIAGNOSTICS:'true',ACCESS_MODE:'pilot',MEDIA:{
    put:async(key,bytes)=>objects.set(key,bytes),
    delete:async key=>objects.delete(key),
    get:async key=>objects.has(key)?{body:objects.get(key),httpMetadata:{contentType:'image/jpeg'}}:null
  }};
  async function session(member, token) {
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
    sqlite.prepare('INSERT INTO sessions VALUES(?,?,?)').run(Buffer.from(digest).toString('hex'),member,Date.now()+100000);
    return '__Host-alumni='+token;
  }
  function call(path,cookie,fields,headers={}) {
    if(cookie)headers.Cookie=cookie;
    let options={headers};
    if(fields){headers.Origin='https://test.example';options={headers,method:'POST',body:fields instanceof FormData?fields:new URLSearchParams(fields)};}
    return worker.fetch(new Request('https://test.example'+path,options),env);
  }
  return {call,session,sqlite,env};
}
async function body(response) { const text=await response.text(); assert.equal(response.status,200,text); return text; }

test('current interactions and feed',async()=>{
 const {call,session,sqlite}=fixture();
 const cookie=await session(2,'bbbb');
 const script=await call('/social.js?v=2');
 assert.equal(script.status,200);
 const source=await script.text();
 assert.doesNotMatch(source,/__name/);new Function(source);
 assert.equal((await call('/profile',cookie,{field:'attendance',value:'attending'})).status,303);
 assert.equal(sqlite.prepare('SELECT status FROM attendance WHERE member=2').get().status,'attending');
 assert.equal((await call('/profile',cookie,{field:'city',value:'Bangalore'})).status,303);
 const profile=await call('/people/2',cookie);assert.equal(profile.status,200);assert.match(await profile.text(),/Bangalore/);
 const post=await call('/compose',cookie,{id:crypto.randomUUID(),body:'Campus words',about:'person:1'});
 assert.equal(post.status,303);
 const url=post.headers.get('location');
 assert.equal((await call(url,cookie,{action:'like',liked:'1'})).status,303);
 assert.equal((await call(url,cookie,{action:'comment',body:'Found through comments'})).status,303);
 assert.equal((await call(url,cookie,{action:'tag-add',tag:'1'})).status,303);
 const fragment=await call('/memories?fragment=1&q=Found',cookie);
 assert.equal(fragment.status,200);assert.match((await fragment.json()).html,/Campus words/);
 const home=await call('/',cookie);assert.equal(home.status,200);assert.match(await home.text(),/Campus words/);
});

test('verification is one-time and redirects directly',async()=>{
 const {call,sqlite}=fixture();
 const raw='fixture-token';
 const digest=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))).toString('hex');
 sqlite.prepare('INSERT INTO login_links VALUES(?,?,?,?)').run(digest,2,Date.now()+3600000,'/people/2');
 const page=await call('/verify');
 assert.match(await page.text(),/id="verify-form" hidden/);
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM login_links').get().n,1);
 const response=await call('/verify',null,{token:raw});
 assert.equal(response.status,303);
 assert.equal(response.headers.get('location'),'/people/2');
 assert.match(response.headers.get('set-cookie'),/__Host-alumni=/);
 const replay=await call('/verify',null,{token:raw});
 assert.match(await replay.text(),/Request a fresh link/);
 assert.equal(replay.headers.get('set-cookie'),null);
});
test('featured cards and comment controls',async()=>{
 const {call,session}=fixture();
 const ck=await session(1,'aaaa');
 const home=await body(await call('/',ck));
 assert.match(home,/What are they up to\?/);
 assert.equal((home.match(/class="person-tile"/g)||[]).length,1);
 const profile=await body(await call('/people/2',ck));
 assert.match(profile,/Add a memory about this classmate/);
 const created=await call('/compose',ck,{id:crypto.randomUUID(),body:'Campus',about:'person:2'});
 const path=created.headers.get('location');
 const added=await call(path,ck,{action:'comment',body:'Author only'});
 assert.match(added.headers.get('location'),/comment-posted=1/);
 const result=await (await call(path+'?panel=comments',ck)).json();
 assert.equal(result[0].canDelete,true);
 const other=await session(2,'bbbb');
 assert.equal((await (await call(path+'?panel=comments',other)).json())[0].canDelete,false);
 await call(path,other,{action:'delete-comment',comment:result[0].id});
 assert.equal((await (await call(path+'?panel=comments',ck)).json()).length,1);
 await call(path,ck,{action:'delete-comment',comment:result[0].id});
 assert.equal((await (await call(path+'?panel=comments',ck)).json()).length,0);
});
test('directory and reunion resolve and home features up to twelve submitters',async()=>{
 const {call,session,sqlite}=fixture();
 const ck=await session(1,'aaaa');
 for(let id=3;id<=15;id++){
  sqlite.prepare('INSERT INTO roster VALUES(?,?,?,?)').run(id,'Classmate '+id,'D3','');
  sqlite.prepare("INSERT INTO submissions(id,subject,contributor,kind,payload) VALUES(?,?,?,'self','{}')").run('self-'+id,id,id);
 }
 const home=await body(await call('/',ck));
 assert.match(home,/<a href="\/people">Classmates<\/a>/);
 assert.equal((home.match(/class="person-tile"/g)||[]).length,12);
 assert.match(await body(await call('/people',ck)),/Test Admin/);
 const search=await body(await call('/people?q=Test%20Admin',ck));
 assert.match(search,/Test Admin/);
 assert.doesNotMatch(search,/Test Classmate/);
 assert.match(await body(await call('/reunion',ck)),/December reunion/);
});

test('reunion gate, tracker prefill, saved details and private attendance',async()=>{
 const {call,session,sqlite}=fixture();
 const admin=await session(1,'aaaa');
 const attendee=await session(2,'bbbb');
 sqlite.exec("INSERT INTO reunion_tracker VALUES (1,'declined',NULL,NULL,NULL),(2,'attending',1,2,1)");
 let html=await body(await call('/reunion?status=declined',admin));
 assert.match(html,/Reunion agenda/);
 assert.match(html,/T-Nite Section Wars/);
 assert.match(html,/href="\/people\/2"/);
 assert.doesNotMatch(html,/Edit Your T-shirt size|You’re confirmed for the reunion/);
 assert.equal((await call('/reunion',admin,{shirt:'L'})).status,403);
 assert.equal((await call('/admin/export?kind=reunion',attendee)).status,404);
 html=await body(await call('/reunion',attendee));
 assert.match(html,/You’re confirmed for the reunion, Test Classmate/);
 assert.match(html,/Coming with your spouse or partner and 2 children/);
 assert.match(html,/How many children are joining\?<\/dt><dd class="field-display">2/);
 assert.equal((await call('/reunion',attendee,{field:'shirt',value:'M'})).status,303);
 const prefill=JSON.parse(sqlite.prepare('SELECT details FROM reunion_logistics WHERE member=2').get().details);
 assert.deepEqual([prefill.shirt,prefill.spouse,prefill.children,prefill.bothNights],['M','1','2','1']);
 assert.equal((await call('/reunion',attendee,{shirt:'L',spouse:'0',children:'0',kidName0:'IGNORE',spouseName:'IGNORE'})).status,303);
 assert.equal((await call('/reunion',attendee,{field:'shirt',value:'XL'})).status,303);
 assert.equal((await call('/reunion',attendee,{field:'spouseName',value:'Unavailable'})).status,400);
 sqlite.exec("UPDATE reunion_tracker SET spouse=1,children=1 WHERE member=2");
 html=await body(await call('/reunion?saved=1',attendee));
 assert.match(html,/Coming solo/);
 assert.match(html,/Your reunion details are saved/);
 const exported=await (await call('/admin/export?kind=reunion',admin)).json();
 assert.equal(exported[0].details.shirt,'XL');
 assert.equal(exported[0].details.spouseName,'');
 assert.deepEqual(exported[0].details.kids,[]);
 sqlite.exec('UPDATE members SET attendance_private=1 WHERE id=2');
 assert.doesNotMatch(await body(await call('/reunion',admin)),/href="\/people\/2"/);
 assert.match(await body(await call('/reunion',attendee)),/Edit Your T-shirt size/);
 sqlite.exec("UPDATE reunion_tracker SET status='declined' WHERE member=2");
 assert.equal((await call('/reunion',attendee,{shirt:'S'})).status,403);
 const home=await body(await call('/',attendee));
 assert.match(home,/href="\/people\/2">Edit profile/);
 assert.match(home,/Share a memory/);
 assert.doesNotMatch(home,/to be featured/);
});

test('share metadata, personal profile rank and child age prompt',async()=>{
 const {call,session,sqlite}=fixture();
 const guest=await body(await call('/'));
 assert.match(guest,/og:title.*Kal · Aaj · Aur Kal/);
 assert.match(guest,/og:description/);
 const ck=await session(2,'bbbb');
 sqlite.exec("INSERT INTO profile_fields VALUES(2,'life','Own bio'),(2,'city','Mumbai')");
 let html=await body(await call('/',ck));
 assert.doesNotMatch(html,/home-completion/);
 sqlite.exec("INSERT INTO profile_fields VALUES(1,'life','My bio'),(1,'city','Delhi')");
 html=await body(await call('/',ck));
 assert.doesNotMatch(html,/home-completion/);
 sqlite.exec("INSERT INTO reunion_tracker VALUES(2,'attending',0,0,1)");
 const response=await call('/reunion',ck,{field:'children',value:'2'});
 assert.equal(response.headers.get('location'),'/reunion?saved=1#reunion-children');
 html=await body(await call('/reunion?saved=1',ck));
 assert.match(html,/id="reunion-children"/);
 assert.equal((html.match(/Add age for activity planning/g)||[]).length,2);
 assert.equal((await call('/reunion',ck,{field:'kidAge0',value:'0'})).status,303);
 assert.match(await body(await call('/reunion',ck)),/Age<\/dt><dd class="field-display">0/);
});

test('album upload, linked tags, cover and album view',async()=>{
 const {call,session}=fixture();
 const ck=await session(2,'bbbb'), other=await session(1,'aaaa');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aA1sAAAAASUVORK5CYII=','base64');
 const ids=[crypto.randomUUID(),crypto.randomUUID()];
 for(const id of ids){
   const f=new FormData();f.set('photo',new File([png],'photo.png',{type:'image/png'}));
   assert.equal((await call('/compose/photo?id='+id,ck,f)).status,200);
   assert.equal((await call('/media/post/'+id,other)).status,404);
 }
 const draft=new FormData();
 draft.set('id',crypto.randomUUID());
 draft.set('title','Campus 2005');draft.set('body','Our old photos');draft.set('cover',ids[1]);
 draft.append('about','person:1');draft.append('about','new-event:Confluence');
 for(const id of ids)draft.append('photoId',id);
 assert.equal((await call('/compose',other,draft)).status,400);
 const response=await call('/compose',ck,draft);
 assert.equal(response.status,303,await response.text());
 const url=response.headers.get('location');
 const home=await body(await call('/memories?q=Campus+2005',ck));
 assert.equal((home.match(/class="collage-card"/g)||[]).length,1);
 assert.match(home,/2 photos/);
 assert.match(home,new RegExp('/media/post/'+ids[1]));
 assert.match(home,/href="\/people\/1">@Test Admin/);
 assert.match(home,/href="\/topics\/[^"]+">#Confluence/);
 const album=await body(await call(url,ck));
 assert.equal((album.match(/data-album-photo/g)||[]).length,2);
 assert.ok(album.indexOf(ids[0])<album.indexOf(ids[1]));
 const photo='post/'+ids[0];
 assert.equal((await call(url,other,{action:'tag-add',tag:'person:2',photo:'post/'+crypto.randomUUID()})).status,404);
 for(const tag of ['person:2','topic:lkp']){
   const added=await call(url,other,{action:'tag-add',tag,photo},{Accept:'application/json'});
   assert.equal(added.status,200);
 }
 const taggedAlbum=await body(await call(url,ck));
 const photoCards=taggedAlbum.split('data-photo-scope=');
 assert.doesNotMatch(photoCards[0],/#LKP|@Test Classmate/);
 assert.match(photoCards[1],/#LKP/);
 assert.match(photoCards[1],/@Test Classmate/);
 assert.doesNotMatch(photoCards[2],/#LKP|@Test Classmate/);
 assert.match(await body(await call('/topics/lkp',ck)),/Campus 2005/);
 const inbox=await body(await call('/notifications',ck));
 assert.match(inbox,new RegExp('/media/post/'+ids[0]+'\\?w=256'));
 assert.match(inbox,/View photo/);
 assert.match(inbox,/Campus 2005/);
 const picks=await (await call('/memory-targets?q=%23confl',ck)).json();
 assert.equal(picks[0].category,'Events');
 assert.equal(picks.length,1);
 assert.match(await body(await call('/people/1',ck)),/name="about" value="person:1"/);
});

test('classmate filters combine and card tags are immediately linked',async()=>{
 const {call,session,sqlite}=fixture();
 const ck=await session(2,'bbbb');
 sqlite.exec("INSERT INTO roster_sections VALUES(1,'A'),(2,'B'); INSERT INTO reunion_tracker(member,status) VALUES(1,'attending'),(2,'declined')");
 const directory=await body(await call('/people?dorm=D1&section=A&status=attending&q=Test',ck));
 assert.match(directory,/Section A/);
 assert.doesNotMatch(directory,/Section B/);
 const memory=await call('/compose',ck,{id:crypto.randomUUID(),body:'Campus trip'});
 const url=memory.headers.get('location');
 assert.equal((await call(url,ck,{action:'tag-add',tag:'person:1'})).status,303);
 const tag=await call(url,ck,{action:'tag-add',tag:'topic:lkp'},{Accept:'application/json'});
 assert.match((await tag.json()).tags,/#LKP/);
 const html=await body(await call(url,ck));
 assert.match(html,/href="\/people\/1">@Test Admin/);
 assert.match(html,/href="\/topics\/lkp">#LKP/);
});

test('profile source precedence, retirement of old entry links, and reunion prompts',async()=>{
 const {call,session,sqlite}=fixture();
 const ck=await session(2,'bbbb');
 sqlite.exec(`INSERT INTO yearbook_public VALUES(2,'{"life":"Published life","family":"Published family"}','[]');
   INSERT INTO profile_fields VALUES(2,'life','Owner life'),(2,'family','');
   INSERT INTO reunion_tracker VALUES(2,'attending',1,0,1);`);
 const profile=await body(await call('/people/2',ck));
 assert.match(profile,/Owner life/);
 assert.doesNotMatch(profile,/Published life|Published family|Review yearbook/);
 assert.equal((await call('/yearbook',ck)).headers.get('location'),'/people/2');
 const reunion=await body(await call('/reunion',ck));
 assert.match(reunion,/Your attendance details are missing/);
 assert.match(reunion,/Choose an outing or select Skip the outing/);
 assert.equal((reunion.match(/<details><summary>|<details>/g)||[]).length>0,true);
 assert.doesNotMatch(reunion,/<div class="reunion-days"><details open/);
});

test('photo sizes are private, cached, and leave the original available',async()=>{
 const {call,session,sqlite,env}=fixture();
 const ck=await session(2,'bbbb');
 sqlite.exec("INSERT INTO profile_fields VALUES(2,'portraitObject','original.jpg')");
 const original=new Uint8Array(100);
 const variant=new Uint8Array(12);
 await env.MEDIA.put('original.jpg',original);
 const get=env.MEDIA.get;
 env.MEDIA.get=async key=>{
   const object=await get(key);
   return object && {...object,size:object.body.byteLength,httpEtag:key.includes('variants')?'"small"':'"original"'};
 };
 let transforms=0;
 env.IMAGES={input:()=>({transform(options){
   assert.deepEqual(options,{width:96,height:192,fit:'scale-down'});
   transforms++;
   return {async output(){return {response:()=>new Response(variant)};}};
 }})};
 const url='/media/portrait/2?w=96';
 assert.equal((await call(url)).status,303);
 const first=await call(url,ck);
 assert.equal(first.headers.get('content-type'),'image/webp');
 assert.equal(first.headers.get('cache-control'),'private, max-age=60, must-revalidate');
 assert.equal(first.headers.get('vary'),'Cookie');
 assert.equal((await first.arrayBuffer()).byteLength,12);
 assert.equal((await call(url,ck,undefined,{'If-None-Match':'"small"'})).status,304);
 assert.equal(transforms,1);
 assert.equal((await (await call('/media/portrait/2',ck)).arrayBuffer()).byteLength,100);
 assert.equal((await call(url)).status,303);
});

test('analytics protects named activity and excludes URL parameters and previews',async()=>{
 const {call,session,sqlite}=fixture();
 const admin=await session(1,'aaaa'), member=await session(2,'bbbb');
 await call('/?private=ignored');
 await call('/',undefined,undefined,{'User-Agent':'WhatsApp/2.26'});
 await call('/people/1?private=ignored',member);
 const rows=sqlite.prepare('SELECT event,member,path FROM site_events ORDER BY id').all();
 assert.deepEqual(rows.map(row=>[row.event,row.member,row.path]),[['page_view',null,'/'],['page_view',2,'/people/1']]);
 assert.equal((await call('/admin/analytics',member)).status,404);
 const data=await (await call('/admin/analytics?format=json',admin)).json();
 assert.equal(data.events[0].name,'Test Classmate');
 assert.equal(data.events.length,2);
});

test('notifications for mentions, owner activity and sample cleanup',async()=>{
 const {call,session,sqlite}=fixture();
 const author=await session(1,'aaaa'), actor=await session(2,'bbbb');
 const post=await call('/compose',author,{id:crypto.randomUUID(),body:'A memory'});
 const url=post.headers.get('location');
 await call(url,actor,{action:'like',liked:'1'});
 await call(url,actor,{action:'like',liked:'1'});
 await call(url,actor,{action:'comment',body:'A comment'});
 await call(url,actor,{action:'tag-add',tag:'person:1'});
 await call(url,actor,{action:'tag-add',tag:'topic:lkp'});
 const rows=sqlite.prepare('SELECT id,kind,recipient FROM notifications ORDER BY id').all();
 assert.deepEqual(rows.map(x=>[x.kind,x.recipient]),[['like',1],['comment',1],['mention',1],['tag',1],['tag',1]]);
 assert.equal((await call('/notifications?open='+rows[1].id,actor)).status,404);
 const link=await call('/notifications?open='+rows[1].id,author);
 assert.match(link.headers.get('location'),/#comment-/);
 const inbox=await body(await call('/notifications',author));
 assert.match(inbox,/4 unread/);
 assert.match(inbox,/A comment/);
 assert.match(inbox,/View comment/);
 await call('/compose',actor,{id:crypto.randomUUID(),body:'A mention',about:'person:1'});
 assert.equal(sqlite.prepare("SELECT count(*) n FROM notifications WHERE kind='mention'").get().n,2);
 sqlite.exec("INSERT INTO notifications(recipient,kind,event_key,sample) VALUES(1,'like','test',1)");
 assert.match(await body(await call('/notifications',author)),/Remove test notifications/);
 await call('/notifications',author,{action:'clear-samples'});
 assert.equal(sqlite.prepare('SELECT count(*) n FROM notifications').get().n,6);
});

test('admin landing distinguishes batch coverage and attendee logistics',async()=>{
 const {call,session,sqlite}=fixture();
 const admin=await session(1,'aaaa'), member=await session(2,'bbbb');
 sqlite.exec("INSERT INTO reunion_tracker VALUES(2,'attending',1,0,1)");
 assert.equal((await call('/admin',member)).status,404);
 const html=await body(await call('/admin',admin));
 assert.match(html,/Yearbook submissions/);
 assert.match(html,/Enriched information/);
 assert.match(html,/Attendee T-shirt size, Spouse T-shirt size, Sunday outing/);
 assert.match(html,/Admin View/);
 assert.doesNotMatch(html,/<div class="account-menu">[^\n]+>Notifications</);
 assert.match(await body(await call('/admin?view=tools',admin)),/Take action/);
});

test('logout invalidates the session and confirms sign-out even after a retry',async()=>{
 const {call,session,sqlite}=fixture();
 const ck=await session(2,'bbbb');
 for(let i=0;i<2;i++){
   const result=await call('/logout',ck,{});
   assert.equal(result.status,303);
   assert.equal(result.headers.get('location'),'/signin?signed-out=1');
   assert.match(result.headers.get('set-cookie'),/Max-Age=0/);
 }
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n,0);
 assert.equal((await call('/people/1',ck)).status,303);
 assert.match(await body(await call('/signin?signed-out=1')),/You’re signed out/);
});

test('WIMWIans send catch-up requests visible only to the recipient',async()=>{
 const {call,session,sqlite}=fixture();
 const admin=await session(1,'aaaa'), classmate=await session(2,'bbbb');
 const banner=html=>html.match(/<section class="meet-banner"[\s\S]*?<\/section>/)?.[0]||'';
 const meetSection=html=>html.match(/<section class="profile-section profile-meet"[\s\S]*?<\/section>/)?.[0]||'';
 assert.match(banner(await body(await call('/',admin))),/Which WIMWIans are you looking to catch up with\?/);
 const added=await call('/meet',classmate,{action:'add',target:'1',next:'/people/1'});
 assert.equal(added.status,303);
 assert.equal(added.headers.get('location'),'/people/1');
 assert.equal((await call('/meet',classmate,{action:'add',target:'1'})).status,303);
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM meet_wishes').get().n,1);
 const adminHome=banner(await body(await call('/',admin)));
 assert.match(adminHome,/<strong class="meet-number">1<\/strong> <span>WIMWIan is looking to catch up with you/);
 assert.doesNotMatch(adminHome,/Test Classmate/);
 const adminOwn=meetSection(await body(await call('/people/1',admin)));
 assert.match(adminOwn,/WIMWIan is looking to catch up with you/);
 assert.match(adminOwn,/Test Classmate/);
 assert.match(adminOwn,/Accept request/);
 assert.match(await body(await call('/people/1',classmate)),/Request sent/);
 assert.match(meetSection(await body(await call('/people/2',classmate))),/href="\/people\/1"[\s\S]*Test Admin/);
 assert.match(banner(await body(await call('/',classmate))),/You’ve picked 1/);
 assert.equal((await call('/meet',classmate,{action:'add',target:'2'})).status,400);
 assert.equal((await call('/meet',classmate,{action:'add',target:'999'})).status,400);
 assert.equal((await call('/meet',classmate,{action:'wave',target:'1'})).status,400);
 assert.equal((await call('/meet',classmate,{action:'add',target:'1',next:'//elsewhere.example'})).headers.get('location'),'/');
 assert.equal((await call('/meet',classmate,{action:'remove',target:'1'})).status,303);
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM meet_wishes').get().n,0);
 assert.equal((await call('/meet',null,{action:'add',target:'1'})).status,303);
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM meet_wishes').get().n,0);
});

test('home and profiles still render before the catch-up migration is applied',async()=>{
 const {call,session,sqlite}=fixture();
 sqlite.exec('DROP TABLE meet_wishes');
 const ck=await session(2,'bbbb');
 const home=await body(await call('/',ck));
 assert.doesNotMatch(home,/class="meet-banner"/);
 const own=await body(await call('/people/2',ck));
 assert.doesNotMatch(own,/id="meet"/);
 assert.doesNotMatch(await body(await call("/people/1",ck)),/class="meet-form/);
});

test('WhatsApp pages: own page at 30+ messages, quiet ones to the batch story, data only for yourself',async()=>{
 const {call,session,env,sqlite}=fixture();
 for(const member of [1,2])for(const [field,value] of Object.entries({city:'Mumbai',life:'My life',family:'My family',thenPhotoObject:'then.jpg',nowPhotoObject:'now.jpg'}))sqlite.prepare('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)').run(member,field,value);
 const admin=await session(1,'aaaa'), classmate=await session(2,'bbbb');
 assert.match(await body(await call('/wa/',classmate)),/isn’t up yet/);
 const put=(key,value)=>env.MEDIA.put('whatsapp-v1/'+key,new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value)));
 const template='<!doctype html><html lang="en" data-me-src="x"><head><link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet"></head><body><nav class="sitebar"><div>kit bar</div></nav>'+
   '<script type="application/json" id="me">__ME__</script><script type="application/json" id="group">__GROUP__</script><script>render()</script></body></html>';
 await put('site/index.html',template);
 await put('site/story.html','<!doctype html><html lang="en" data-me-href="/wa/"><head></head><body><nav class="sitebar"><div>kit bar</div></nav><h1>Batch story</h1><picture><source media="(prefers-color-scheme: dark)" srcset="assets/d.gif"></picture><script src="assets/d3.js"></script></body></html>');
 await put('site/assets/d3.js','/* d3 */');
 await put('data/group.json',{messages:100,posters:3});
 await put('data/index.json',{by_email:{'classmate@example.test':'P002','admin@example.test':'P003'},by_phone:{},people:{P002:{},P003:{},P004:{}}});
 await put('data/people/P002.json',{person_id:'P002',name:'Test Classmate',in_group:true,messages:45});
 await put('data/people/P003.json',{person_id:'P003',name:'Test Admin',in_group:true,messages:12});
 await put('data/people/P004.json',{person_id:'P004',name:'Silent One',in_group:true,quiet:true,messages:0});

 const mine=await call('/wa/',classmate);
 const html=await body(mine);
 assert.match(html,/"name":"Test Classmate"/);
 assert.doesNotMatch(html,/fonts\.googleapis|kit bar|__ME__/);
 assert.match(html,/<a id="navMe" href="\/wa\/" aria-current="page">Your page<\/a>/);
 const nonce=mine.headers.get('content-security-policy').match(/'nonce-([a-f0-9]+)'/)[1];
 assert.equal((html.match(/<script /g)||[]).length,(html.match(new RegExp('<script nonce="'+nonce+'"','g'))||[]).length);
 assert.equal(mine.headers.get('cache-control'),'private, no-store');

 const quiet=await body(await call('/wa/',admin));
 assert.match(quiet,/You’re a quiet one, Test/);
 assert.match(quiet,/few drinks at the reunion will get you talking/);
 assert.match(quiet,/12 messages in the batch group/);
 assert.match(quiet,/href="\/wa\/batch">See how the batch has been chatting/);
 assert.doesNotMatch(quiet,/__ME__|"messages":12/);
 const story=await body(await call('/wa/batch',admin));
 assert.match(story,/<h1>Batch story<\/h1>/);
 assert.doesNotMatch(story,/quiet one/);
 assert.match(story,/media="all" srcset="assets\/d\.gif"/);
 assert.match(await body(await call('/wa/?person=P004',admin)),/Admin preview: Silent One[\s\S]*Not a single message/);
 assert.match(await body(await call('/wa/?person=P002',admin)),/Admin preview: Test Classmate/);

 assert.equal((await (await call('/wa/api/me',classmate)).json()).person_id,'P002');
 assert.equal((await (await call('/wa/api/me?person=P003',classmate)).json()).person_id,'P002');
 assert.equal((await call('/wa/?person=P003',classmate)).status,200);
 assert.match(await body(await call('/wa/?person=P003',classmate)),/"name":"Test Classmate"/);
 assert.equal((await call('/wa/assets/..%2Fdata%2Findex.json',classmate)).status,404);
 assert.equal(await (await call('/wa/assets/d3.js',classmate)).text(),'/* d3 */');
 assert.equal((await call('/wa/story.html',classmate)).headers.get('location'),'/wa/batch');
 assert.doesNotMatch(await body(await call('/',classmate)),/href="\/wa\/batch"/);
 assert.equal((await call('/wa',classmate)).headers.get('location'),'/wa/');
 assert.match((await call('/wa/')).headers.get('location'),/^\/signin/);
 assert.match((await call('/wa/api/me')).headers.get('location'),/^\/signin/);
});

test('dark by default, light by choice, switch works without JavaScript',async()=>{
 const {call,session}=fixture();
 const ck=await session(2,'bbbb');
 assert.match(await body(await call('/',ck)),/<html lang="en" data-theme="dark"/);
 assert.match(await body(await call('/',ck+'; theme=light')),/<html lang="en" data-theme="light"/);
 assert.match(await body(await call('/signin')),/<html lang="en" data-theme="dark"/);
 const toLight=await call('/theme',ck,{},{Referer:'https://test.example/people/2'});
 assert.equal(toLight.status,303);
 assert.equal(toLight.headers.get('location'),'/people/2');
 assert.match(toLight.headers.get('set-cookie'),/^theme=light;/);
 assert.match((await call('/theme',ck+'; theme=light',{},{Referer:'https://elsewhere.example/x'})).headers.get('set-cookie'),/^theme=dark;/);
 assert.equal((await call('/theme',ck,{},{Referer:'https://elsewhere.example/x'})).headers.get('location'),'/');
});


test('WhatsApp Insights require all five details and both photos on pages and APIs',async()=>{
 const {call,session,sqlite}=fixture();
 const ck=await session(2,'bbbb');
 const prompt=await body(await call('/wa/',ck));
 assert.match(prompt,/Complete your profile to unlock WhatsApp Insights/);
 for(const label of ['Dorm number','Dorm name','Current city','Life, Lately','Family','Then photo (2006)','Now photo (2026)'])assert.ok(prompt.includes(label),label);
 assert.match(await body(await call('/',ck)),/Complete your profile to unlock WhatsApp Insights/);
 assert.match(await body(await call('/people/2',ck)),/data-unlock-edit/);
 for(const path of ['/wa/','/wa/batch','/wa/story.html'])assert.match(await body(await call(path,ck)),/Complete your profile to unlock WhatsApp Insights/);
 for(const path of ['/wa/api/me','/wa/api/group','/wa/api/me?person=P001']){
  const response=await call(path,ck);assert.equal(response.status,403);assert.equal((await response.json()).error,'profile_incomplete');
 }
 for(const [field,value] of Object.entries({city:'Mumbai',life:'My life',family:'My family',thenPhotoObject:'then.jpg',nowPhotoObject:'now.jpg'}))sqlite.prepare('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)').run(2,field,value);
 assert.match(await body(await call('/wa/',ck)),/isn’t up yet/);
 assert.match(await body(await call('/people/2',ck)),/Your WhatsApp Insights are unlocked/);
 // Explicit owner blanks must override imported data and relock access immediately.
 for(const field of ['dorm','nickname','city','life','family']){
  sqlite.prepare('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)').run(2,field,'   ');
  assert.equal((await call('/wa/api/me',ck)).status,403,field);
  sqlite.prepare('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)').run(2,field,'Filled');
 }
 sqlite.prepare("DELETE FROM profile_fields WHERE member=2 AND field='nowPhotoObject'").run();
 assert.equal((await call('/wa/api/group',ck)).status,403);
 assert.match((await call('/wa/')).headers.get('location'),/^\/signin/);
});


test('admin can preview locked Insights without changing profiles or access',async()=>{
 const {call,session,sqlite}=fixture();
 const admin=await session(1,'aaaa'),member=await session(2,'bbbb');
 for(const [field,value]of Object.entries({city:'Mumbai',life:'Life',family:'Family',thenPhotoObject:'then.jpg',nowPhotoObject:'now.jpg'}))sqlite.prepare('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)').run(1,field,value);
 assert.match(await body(await call('/wa/',admin)),/isn’t up yet/);
 const before=sqlite.prepare('SELECT * FROM profile_fields ORDER BY member,field').all();
 const html=await body(await call('/wa/?preview=locked',admin));
 assert.match(html,/Admin preview: locked WhatsApp Insights/);
 assert.match(html,/0 of 7 requirements complete/);
 assert.deepEqual(sqlite.prepare('SELECT * FROM profile_fields ORDER BY member,field').all(),before);
 assert.match(await body(await call('/wa/',admin)),/isn’t up yet/);
 assert.equal((await call('/wa/?preview=locked',member)).status,403);
 assert.match((await call('/wa/?preview=locked')).headers.get('location'),/^\/signin/);
});


test('owner editing is visible and the full editor uses resolved profile values',async()=>{
 const {call,session,sqlite}=fixture();const ck=await session(2,'bbbb');
 const own=await body(await call('/people/2',ck));
 assert.match(own,/<a class="edit-toggle" href="\/profile">Edit profile<\/a>/);
 assert.match(own,/aria-label="Upload profile photo"/);
 assert.match(own,/aria-label="Upload Then photo"/);
 assert.doesNotMatch(own,/data-edit-toggle|data-editable/);
 const other=await body(await call('/people/1',ck));assert.doesNotMatch(other,/class="edit-toggle"|data-profile-edit/);
 let editor=await body(await call('/profile',ck));assert.match(editor,/An imported bio/);assert.match(editor,/>D2<\/textarea>/);
 await call('/profile',ck,{field:'life',value:'Owner answer'});
 editor=await body(await call('/profile',ck));assert.match(editor,/Owner answer/);assert.doesNotMatch(editor,/An imported bio/);
 await call('/profile',ck,{field:'life',value:''});
 editor=await body(await call('/profile',ck));assert.doesNotMatch(editor,/An imported bio|Owner answer/);
});


test('catch-up notifications survive until first login, accept once and enforce recipient ownership',async()=>{
 const {call,session,sqlite,env}=fixture();env.ACCESS_MODE='batch';
 const sender=await session(1,'aaaa'),stranger=await session(2,'bbbb');
 sqlite.prepare("INSERT INTO roster VALUES(3,'Never Signed In','D3','New')").run();
 assert.equal(sqlite.prepare('SELECT count(*) n FROM members WHERE id=3').get().n,0);
 await call('/meet',sender,{action:'add',target:'3'});
 const wish=sqlite.prepare('SELECT * FROM meet_wishes WHERE member=1 AND target=3').get();
 assert.ok(wish.request_id);assert.equal(wish.accepted_at,null);
 let queued=sqlite.prepare("SELECT * FROM notifications WHERE recipient=3 AND kind='catchup_request'").get();
 assert.ok(queued);assert.equal(queued.actor,1);assert.equal(queued.is_read,0);
 // Duplicate picks do not generate repeated alerts.
 await call('/meet',sender,{action:'add',target:'3'});
 assert.equal(sqlite.prepare("SELECT count(*) n FROM notifications WHERE kind='catchup_request'").get().n,1);
 assert.equal((await call('/meet',stranger,{action:'accept',target:'1',request:wish.request_id})).status,404);
 assert.equal((await call('/notifications?open='+queued.id,stranger)).status,404);
 const raw='first-login-token';const digest=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw))).toString('hex');
 sqlite.prepare('INSERT INTO login_links VALUES(?,?,?,?)').run(digest,3,Date.now()+3600000,'/notifications');
 const login=await call('/verify',null,{token:raw});assert.equal(login.status,303);
 const recipient=login.headers.get('set-cookie').split(';')[0];
 let inbox=await body(await call('/notifications',recipient));
 assert.match(inbox,/Test Admin/);assert.match(inbox,/wants to catch up with you/);assert.match(inbox,/Accept request/);assert.match(inbox,/1 unread/);
 assert.equal((await call('/meet',recipient,{action:'accept',target:'1',request:'wrong'})).status,404);
 assert.equal((await call('/meet',recipient,{action:'accept',target:'1',request:wish.request_id,next:'/notifications'})).status,303);
 assert.ok(sqlite.prepare('SELECT accepted_at FROM meet_wishes WHERE request_id=?').get(wish.request_id).accepted_at);
 assert.equal(sqlite.prepare('SELECT is_read FROM notifications WHERE id=?').get(queued.id).is_read,1);
 let accepted=sqlite.prepare("SELECT * FROM notifications WHERE recipient=1 AND kind='catchup_accepted'").get();assert.ok(accepted);assert.equal(accepted.actor,3);
 await call('/meet',recipient,{action:'accept',target:'1',request:wish.request_id});
 assert.equal(sqlite.prepare("SELECT count(*) n FROM notifications WHERE kind='catchup_accepted'").get().n,1);
 assert.match(await body(await call('/notifications',sender)),/accepted your catch-up request/);
 assert.match(await body(await call('/people/3',sender)),/Catch-up accepted/);
 assert.match(await body(await call('/notifications',recipient)),/You accepted this request/);
 await call('/notifications',sender,{action:'read-all'});
 assert.equal(sqlite.prepare('SELECT is_read FROM notifications WHERE id=?').get(accepted.id).is_read,1);
 // Withdrawal preserves notification history; a stale acceptance cannot accept a replacement request.
 await call('/meet',sender,{action:'remove',target:'3'});
 assert.match(await body(await call('/notifications',recipient)),/no longer active/);
 await call('/meet',sender,{action:'add',target:'3'});
 const replacement=sqlite.prepare('SELECT request_id FROM meet_wishes WHERE member=1 AND target=3').get().request_id;
 assert.notEqual(replacement,wish.request_id);
 assert.equal((await call('/meet',recipient,{action:'accept',target:'1',request:wish.request_id})).status,404);
 assert.equal(sqlite.prepare('SELECT count(*) n FROM notifications').get().n,3);
});

test('notification migrations preserve existing history and backfill genuine offline activity once',()=>{
 const sqlite=new DatabaseSync(':memory:');
 for(const filename of readdirSync(new URL('../migrations/',import.meta.url)).filter(name=>name.endsWith('.sql')&&name<'0015').sort()){
  if(filename==='0002_publish_imports.sql')continue;
  sqlite.exec(readFileSync(new URL('../migrations/'+filename,import.meta.url),'utf8'));
 }
 sqlite.exec("INSERT INTO roster VALUES(1,'One','1','A'),(2,'Two','2','B'); INSERT INTO meet_wishes(member,target,created) VALUES(1,2,1700000000000); INSERT INTO notifications(id,recipient,actor,kind,event_key,is_read) VALUES(44,1,2,'like','preserve-me',1);");
 sqlite.exec(readFileSync(new URL('../migrations/0015_catchup_notifications.sql',import.meta.url),'utf8'));
 assert.equal(sqlite.prepare('SELECT is_read FROM notifications WHERE id=44').get().is_read,1);
 assert.equal(sqlite.prepare("SELECT count(*) n FROM notifications WHERE recipient=2 AND kind='catchup_request'").get().n,1);
 assert.equal(sqlite.prepare('SELECT count(*) n FROM members').get().n,0);
 // Simulate legacy memory data created before live triggers ran.
 sqlite.exec("DROP TRIGGER notify_like; DROP TRIGGER notify_comment; DROP TRIGGER notify_about; INSERT INTO posts(id,author,body,created) VALUES('old',1,'Old memory',1700000000000); INSERT INTO likes VALUES('old',2); INSERT INTO comments VALUES('old-comment','old',2,'Old comment',1700000001000,0); INSERT INTO memory_about VALUES('old','person','2');");
 const history=readFileSync(new URL('../migrations/0016_notification_history.sql',import.meta.url),'utf8');
 sqlite.exec(history);const before=sqlite.prepare('SELECT count(*) n FROM notifications').get().n;
 assert.equal(sqlite.prepare("SELECT count(*) n FROM notifications WHERE recipient=2 AND kind='mention'").get().n,1);
 sqlite.exec(history);assert.equal(sqlite.prepare('SELECT count(*) n FROM notifications').get().n,before);
 assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(),[]);
});


test('one shared mobile navigation sits outside the header on site and WhatsApp pages',async()=>{
 const {call,session}=fixture();const ck=await session(2,'bbbb');
 for(const path of ['/','/people','/people/2','/memories','/gallery','/reunion','/notifications','/profile','/wa/']){
  const html=await body(await call(path,ck));
  assert.equal((html.match(/<nav class="app-bottom-nav"/g)||[]).length,1,path);
  assert.ok(html.indexOf('<nav class="app-bottom-nav"')>html.indexOf('</header>'),path);
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/<body class="[^"]*has-mobile-nav/);
 }
 assert.doesNotMatch(await body(await call('/signin')),/<nav class="app-bottom-nav"/);
 const {skin}=await import('../whatsapp.mjs');
 const template='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="story"><nav class="sitebar"></nav><main>Story</main></body></html>';
 for(const current of ['me','batch']){
  const html=skin(template,{nonce:'test',theme:'dark',current});
  assert.match(html,/<body class="story has-mobile-nav">/);
  assert.equal((html.match(/<nav class="app-bottom-nav"/g)||[]).length,1);
  assert.match(html,/<a href="\/wa\/" aria-current="page">WhatsApp<\/a>/);
  assert.ok(html.indexOf('<nav class="app-bottom-nav"')>html.indexOf('</main>'));
 }
});


test('Home and Memories blur the real feed until the shared profile requirements are complete',async()=>{
 const {call,session,sqlite}=fixture();const ck=await session(2,'bbbb');
 const posted=await call('/compose',ck,{id:crypto.randomUUID(),body:'Real memory underneath the visual completion prompt'});
 const postUrl=posted.headers.get('location');
 for(const path of ['/','/memories']){
  const html=await body(await call(path,ck));
  assert.match(html,/Complete your profile to access memories/);
  assert.match(html,/class="memories-gate-content" inert aria-hidden="true"/);
  assert.match(html,/Real memory underneath/);
  assert.match(html,/of 7 complete/);
  assert.match(html,/Still needed/);
  assert.match(html,/href="\/people\/2\?complete=whatsapp#whatsapp-unlock"/);
 }
 // This is intentionally a visual completion incentive, with the actual content still available.
 assert.match(await body(await call(postUrl,ck)),/Real memory underneath/);
 assert.match((await(await call('/memories?fragment=1',ck)).json()).html,/Real memory underneath/);
 for(const [field,value]of Object.entries({city:'Mumbai',life:'Life',family:'Family',thenPhotoObject:'then.jpg',nowPhotoObject:'now.jpg'}))sqlite.prepare('INSERT OR REPLACE INTO profile_fields VALUES(?,?,?)').run(2,field,value);
 for(const path of ['/','/memories']){
  const html=await body(await call(path,ck));
  assert.doesNotMatch(html,/<section class="memories-gate"/);
  assert.match(html,/Real memory underneath/);
 }
 sqlite.prepare("UPDATE profile_fields SET value='' WHERE member=2 AND field='family'").run();
 assert.match(await body(await call('/memories',ck)),/Complete your profile to access memories/);
});
