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
 s.width,s.height,
 (SELECT json_group_array(DISTINCT CAST(t.target AS INTEGER)) FROM active_photo_tags t JOIN roster r ON r.id=CAST(t.target AS INTEGER) WHERE t.post=u.post AND t.media='post/'||u.id AND t.kind='person') AS people
 FROM active_uploads u JOIN posts p ON p.id=u.post
 LEFT JOIN memory_albums a ON a.post=p.id
 LEFT JOIN face_scans s ON s.media='post/'||u.id AND s.status='done'
 WHERE p.hidden=0 AND (p.topic IS NULL OR EXISTS(SELECT 1 FROM topics t WHERE t.id=p.topic AND t.hidden=0)) AND (a.post IS NULL OR EXISTS(SELECT 1 FROM json_each(a.photo_order) j WHERE j.value=u.id)) AND NOT EXISTS(SELECT 1 FROM roster r WHERE lower(trim(r.name))='sachin kumar suman' AND (p.subject=r.id OR EXISTS(SELECT 1 FROM memory_about m WHERE m.post=p.id AND m.kind='person' AND m.target=CAST(r.id AS TEXT))))`;
export function selectWalls(rows, roster, limit=84) {
 const keys=Object.keys(themes), walls=Object.fromEntries(keys.map(k=>[k,[]]));
 const counts=new Map(roster.map(id=>[Number(id),0])), used=new Set(), albums=new Map();
 const candidates=rows.map(r=>({...r,theme:classify(r.album),people:[...new Set(typeof r.people==='string'?JSON.parse(r.people):r.people||[])].map(Number).filter(id=>counts.has(id))})).filter(r=>r.theme&&r.digest&&(!(r.width&&r.height)||Math.min(r.width,r.height)>=400)).sort((a,b)=>a.id.localeCompare(b.id));
 const score=r=>{
 let fresh=0, depth=0;
 for(const id of r.people){const n=counts.get(id);if(!n)fresh++;depth+=n===1?40:n===2?20:n<6?5:0;}
 return [fresh,depth/(1+Math.max(0,r.people.length-12)/12),-(albums.get(r.album)||0),Math.min(r.width||0,r.height||0)];
 };
 const better=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;};
 // Global greedy maximum coverage, then diminishing returns and album diversity.
 while(true){
 let best=null,rank=null;
 for(const r of candidates){if(walls[r.theme].length>=limit||used.has(r.digest))continue;const v=score(r);if(!best||better(v,rank)){best=r;rank=v;}}
 if(!best)break;
 walls[best.theme].push(best);used.add(best.digest);albums.set(best.album,(albums.get(best.album)||0)+1);
 for(const id of best.people)counts.set(id,counts.get(id)+1);
 }
 // Improve breadth and depth with strictly improving single-slot swaps.
 const utility=n=>n===0?0: n===1?10000:n===2?10100:n===3?10140:10140+Math.min(n-3,3)*5;
 for(let pass=0;pass<3;pass++){
 let changed=false;
 for(const k of keys)for(let i=0;i<walls[k].length;i++){
 const old=walls[k][i];used.delete(old.digest);
 for(const id of old.people)counts.set(id,counts.get(id)-1);
 const gain=r=>r.people.reduce((s,id)=>s+utility(counts.get(id)+1)-utility(counts.get(id)),0);
 let best=old, value=gain(old);
 for(const r of candidates)if(r.theme===k&&!used.has(r.digest)&&gain(r)>value){best=r;value=gain(r);}
 walls[k][i]=best;used.add(best.digest);
 for(const id of best.people)counts.set(id,counts.get(id)+1);
 if(best!==old){changed=true;albums.set(old.album,albums.get(old.album)-1);albums.set(best.album,(albums.get(best.album)||0)+1);}
 }
 if(!changed)break;
 }
 return {walls,report:{selected:Object.fromEntries(keys.map(k=>[k,walls[k].length])),covered:[...counts.values()].filter(n=>n>0).length,atLeastTwo:[...counts.values()].filter(n=>n>=2).length,atLeastThree:[...counts.values()].filter(n=>n>=3).length,roster:counts.size,missing:[...counts].filter(([,n])=>!n).map(([id])=>id),albums:Object.fromEntries(albums)}};
}
export async function dryRun(db){
 const [photos,roster]=await Promise.all([db.prepare(candidateSQL).all(),db.prepare('SELECT id FROM roster').all()]);
 return selectWalls(photos.results,roster.results.map(r=>r.id));
}
