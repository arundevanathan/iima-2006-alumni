export function studioHTML(data){
 const safe=JSON.stringify(data).replace(/</g,'\\u003c');
 return '<div id="wall-studio"></div><script type="application/json" id="wall-data">'+safe+'</script><script src="/admin/memory-wall-studio.js" defer></script>';
}
export const studioJS = String.raw`
(()=>{
 const root=document.getElementById('wall-studio'), data=JSON.parse(document.getElementById('wall-data').textContent);
 const {key,roster,photos,initial,revision}=data, map=new Map(photos.map(p=>[p.id,p]));
 let walls=initial, rev=revision, selected=-1, dirty=false, saving=false, picker=-1, drag=-1;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const button=(text,fn)=>{const n=el('button',text);n.type='button';n.onclick=fn;return n;};
 const style=el('style');style.textContent='#wall-studio button{cursor:pointer} .ws-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:5px} .ws-tile{position:relative;aspect-ratio:1;background:#eee;min-width:0;border:2px solid transparent;padding:0;overflow:hidden} .ws-tile img{width:100%;height:100%;object-fit:cover;display:block} .ws-tile.active{border-color:#b55b35} .ws-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0} .ws-picker{max-height:55vh;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(95px,1fr));gap:8px} .ws-picker button{padding:4px;min-width:0;font-size:11px} .ws-picker img{width:100%;aspect-ratio:1;object-fit:cover} .ws-coverage{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px} @media(max-width:650px){.ws-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}';root.append(style);
 const status=el('p'), tools=el('div'), grid=el('div'), panel=el('div'), coverage=el('div');tools.className='ws-tools';grid.className='ws-grid';root.append(status,tools,grid,panel,coverage);
 const used=()=>new Set(Object.values(walls).flat().filter(Boolean));
 const update=()=>{dirty=true;render();};
 const swap=(a,b)=>{[walls[key][a],walls[key][b]]=[walls[key][b],walls[key][a]];selected=b;update();};
 const img=(id)=>{const n=el('img');n.src='/media/post/'+encodeURIComponent(id)+'?w=96';n.loading='lazy';n.decoding='async';n.alt=map.get(id)?.album||'Photo';return n;};
 function render(){
 status.textContent=(dirty?'Unsaved changes · ':'Saved layout · ')+walls[key].filter(Boolean).length+'/84 photos';
 tools.replaceChildren(button('Save changes',save),button('Remove selected',()=>{if(selected>=0){walls[key][selected]=null;update();}}),button('Add / replace',()=>{if(selected>=0){picker=selected;showPicker();}}),button('Cancel selection',()=>{selected=-1;render();}));
 grid.replaceChildren();
 walls[key].forEach((id,i)=>{const tile=button('',()=>{if(selected>=0&&selected!==i){swap(selected,i);return;}selected=i;render();if(!id){picker=i;showPicker();}});tile.className='ws-tile'+(selected===i?' active':'');tile.title=id?(map.get(id)?.album||'Photo'):'Empty slot '+(i+1);tile.setAttribute('aria-label','Slot '+(i+1)+' '+tile.title);if(id)tile.append(img(id));else tile.textContent='+ '+(i+1);tile.draggable=!!id;tile.ondragstart=e=>{drag=i;e.dataTransfer.setData('text/plain',String(i));};tile.ondragover=e=>e.preventDefault();tile.ondrop=e=>{e.preventDefault();if(drag>=0&&drag!==i)swap(drag,i);drag=-1;};grid.append(tile);});
 coverage.replaceChildren();const ids=new Set(Object.values(walls).flat().filter(Boolean).flatMap(id=>map.get(id)?.people||[]));coverage.append(el('h3','Coverage across thematic walls: '+ids.size+'/'+roster.length));
 const groups=el('div');groups.className='ws-coverage';for(const field of ['dorm','section']){const block=el('div');block.append(el('h4',field==='dorm'?'By dorm':'By section'));const counts=new Map();for(const r of roster){const k=r[field]||'Unknown';const a=counts.get(k)||[0,0];a[1]++;if(ids.has(r.id))a[0]++;counts.set(k,a);}for(const [k,a] of [...counts].sort((a,b)=>String(a[0]).localeCompare(String(b[0]),undefined,{numeric:true})))block.append(el('div',k+': '+a[0]+'/'+a[1]+' ('+Math.round(a[0]/a[1]*100)+'%)'));groups.append(block);}coverage.append(groups);
 }
 function showPicker(){panel.replaceChildren();const search=el('input');search.placeholder='Search album or classmate';const results=el('div');results.className='ws-picker';panel.append(el('h3','Choose photo for slot '+(picker+1)),search,button('Close',()=>{picker=-1;panel.replaceChildren();}),results);const names=new Map(roster.map(r=>[r.id,r.name]));const draw=()=>{results.replaceChildren();const taken=used(), q=search.value.toLowerCase();for(const p of photos.filter(p=>!taken.has(p.id)&&p.theme===key&&(!q||(p.album+' '+p.people.map(id=>names.get(id)||'').join(' ')).toLowerCase().includes(q))).slice(0,120)){const b=button(p.album,()=>{walls[key][picker]=p.id;picker=-1;panel.replaceChildren();update();});b.prepend(img(p.id));results.append(b);}};search.oninput=draw;draw();search.focus();}
 async function save(){if(saving||!dirty)return;saving=true;status.textContent='Saving…';try{const res=await fetch('/admin/memory-wall-layout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({walls,revision:rev})});if(!res.ok)throw Error(await res.text());const out=await res.json();rev=out.revision;dirty=false;render();}catch(e){status.textContent='Not saved: '+e.message;}finally{saving=false;}}
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});render();
})();
`;
