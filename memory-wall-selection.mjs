// Read-only selection engine. No inference or database writes.
export const themes = {
 activities: /^(tnite|team confluence|confluence|strat safari|golden jubilee)|\bchaos\b/i,
 campus: /^(convo 2006|ciao red bricks|section b|sec d year book|christmas|pizza and party|tabartod|awesome ramp|d1\b|shodh yatra|campus life|the abmzzz|d14\b|putrevu|paratha time)/i,
 reunion: /^(10 year reunion 2016|2016 reunion photos)$/i
};
export function classify(title) {
 return Object.keys(themes).find(k=>themes[k].test((title||'').trim())) || null;
}
export const candidateSQL = `SELECT u.id,u.digest,u.object_key,u.post,COALESCE(a.title, NULLIF(u.caption,''), p.body) AS album,
 s.width,s.height,s.faces AS face_count,
 (SELECT max(f.size) FROM faces f WHERE f.media=s.media AND f.score>=0.6) AS largest_face,
 (SELECT avg((json_extract(f.box,'$[1]')+json_extract(f.box,'$[3]'))/2.0) FROM faces f WHERE f.media=s.media AND f.score>=0.6) AS face_y,
 (SELECT json_group_array(DISTINCT CAST(t.target AS INTEGER)) FROM active_photo_tags t JOIN roster r ON r.id=CAST(t.target AS INTEGER) WHERE t.post=u.post AND t.media='post/'||u.id AND t.kind='person') AS people
 FROM active_uploads u JOIN posts p ON p.id=u.post
 LEFT JOIN memory_albums a ON a.post=p.id
 LEFT JOIN face_scans s ON s.media='post/'||u.id AND s.status='done'
 WHERE p.hidden=0 AND (p.topic IS NULL OR EXISTS(SELECT 1 FROM topics t WHERE t.id=p.topic AND t.hidden=0)) AND (a.post IS NULL OR EXISTS(SELECT 1 FROM json_each(a.photo_order) j WHERE j.value=u.id)) AND NOT EXISTS(SELECT 1 FROM roster r WHERE lower(trim(r.name))='sachin kumar suman' AND (p.subject=r.id OR EXISTS(SELECT 1 FROM memory_about m WHERE m.post=p.id AND m.kind='person' AND m.target=CAST(r.id AS TEXT))))`;
export function selectWalls(rows, roster, limit=84) {
 const keys=Object.keys(themes), walls=Object.fromEntries(keys.map(k=>[k,[]]));
 const counts=new Map(roster.map(id=>[Number(id),0])), used=new Set(), albums=new Map();
 const candidates=rows.map(r=>({...r,theme:classify(r.album),people:[...new Set(typeof r.people==='string'?JSON.parse(r.people):r.people||[])].map(Number).filter(id=>counts.has(id))})).filter(r=>r.theme&&r.digest&&(!(r.width&&r.height)||Math.min(r.width,r.height)>=400)).sort((a,b)=>a.id.localeCompare(b.id));
 const group=r=>Math.max(r.people.length,r.face_count||0);
 const convo=r=>/^convo 2006/i.test(r.album);
 const large=r=>r.theme==='reunion'&&group(r)>10;
 const eligible=r=>!used.has(r.digest)&&(!convo(r)||walls.campus.filter(convo).length<Math.min(8,limit))&&(!large(r)||walls.reunion.filter(large).length<Math.min(8,limit));
 const quality=r=>{
 const n=group(r), ratio=r.largest_face/Math.min(r.width,r.height);
 let q=n>=2&&n<=6?24:n<=10?12: -18;
 if(r.theme==='campus'&&/pizza|party|christmas|ramp|paratha|naming ceremony/i.test(r.album))q+=24;
 if(convo(r))q-=25;
 if(r.width&&r.height&&r.face_count>0){q+=Math.min(24,ratio*120);if(ratio<0.065)q-=25;if(r.face_y/r.height<0.25)q-=24;}
 return q;
 };
 const similarity=(a,b)=>{if(a.album!==b.album||a.people.length<2||b.people.length<2)return 0;const common=a.people.filter(id=>b.people.includes(id)).length;return common/(a.people.length+b.people.length-common);};
 const score=r=>{
 let coverage=0;
 for(const id of r.people){const n=counts.get(id);coverage+=n===0?35:n===1?8:n===2?3:0;}
 const repeats=walls[r.theme].reduce((m,p)=>Math.max(m,similarity(r,p)),0);
 return coverage/Math.sqrt(Math.max(1,group(r)/4))+quality(r)-repeats*45-(albums.get(r.album)||0)*1.4;
 };
 while(true){
 let best=null,rank=-Infinity;
 for(const r of candidates){if(walls[r.theme].length>=limit||!eligible(r))continue;const v=score(r);if(v>rank){best=r;rank=v;}}
 if(!best)break;
 walls[best.theme].push(best);used.add(best.digest);albums.set(best.album,(albums.get(best.album)||0)+1);
 for(const id of best.people)counts.set(id,counts.get(id)+1);
 }
 return {walls,report:{selected:Object.fromEntries(keys.map(k=>[k,walls[k].length])),covered:[...counts.values()].filter(n=>n>0).length,atLeastTwo:[...counts.values()].filter(n=>n>=2).length,atLeastThree:[...counts.values()].filter(n=>n>=3).length,roster:counts.size,missing:[...counts].filter(([,n])=>!n).map(([id])=>id),albums:Object.fromEntries(albums)}};
}
export async function dryRun(db){
 const [photos,roster]=await Promise.all([db.prepare(candidateSQL).all(),db.prepare('SELECT id FROM roster').all()]);
 return selectWalls(photos.results,roster.results.map(r=>r.id));
}
