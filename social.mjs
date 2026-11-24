export const socialScript = String.raw`
(function socialInteractions(){
  // "Looking to catch up": search WIMWIans and add one with a normal form post.
  const meet=document.querySelector('[data-meet-picker]');
  if(meet){
    const box=meet.querySelector('[data-meet-search]'), list=meet.querySelector('[data-meet-results]'), add=meet.querySelector('[data-meet-add]');
    const picked=new Set((meet.dataset.picked||'').split(',').filter(Boolean));
    let revision=0, timer=0;
    box.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(async()=>{
      const request=++revision, q=box.value.trim(); list.replaceChildren(); if(q.length<2) return;
      try{
        const rows=await (await fetch('/tag-search?q='+encodeURIComponent(q))).json(); if(request!==revision) return;
        const fresh=rows.filter(row=>!picked.has(String(row.id)));
        if(!fresh.length){const p=document.createElement('p');p.className='meet-hint';p.textContent=rows.length?'Already on your list.':'No matching classmates.';list.append(p);return;}
        for(const row of fresh){const b=document.createElement('button');b.type='button';b.setAttribute('role','option');
          b.textContent=row.name+(row.nickname?' · '+row.nickname:'');
          b.addEventListener('click',()=>{add.elements.target.value=row.id;b.disabled=true;add.submit();});list.append(b);}
      }catch{const p=document.createElement('p');p.className='meet-hint';p.textContent='Search unavailable. Try again.';list.append(p);}
    },180);});
  }
  // Owner editing controls stay visible, including without JavaScript.
  const profile=document.querySelector('.alumni-profile');
  if(profile){
    const startUnlockEdit=()=>{const todo=profile.querySelector('.profile-todo>details');if(todo)todo.open=true;};
    if(new URLSearchParams(location.search).get('complete')==='whatsapp')startUnlockEdit();
    profile.querySelector('[data-unlock-edit]')?.addEventListener('click',event=>{event.preventDefault();startUnlockEdit();const target=profile.querySelector('.profile-todo')||profile.querySelector('.profile-section');target?.scrollIntoView({block:'start',behavior:'smooth'});});
  }
  const strip=document.querySelector('[data-classmate-strip]');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  if(strip && !reducedMotion.matches){
    let visible=false, stopped=false, frame=0, last=0, position=0, direction=1;
    const stop=()=>{
      stopped=true;
      cancelAnimationFrame(frame);
      strip.classList.remove('is-drifting');
      observer.disconnect();
    };
    const tick=time=>{
      if(stopped||!visible||document.hidden)return;
      const edge=strip.scrollWidth-strip.clientWidth;
      if(edge>1){
        position+=direction*Math.min(time-last,50)*.025;
        if(position>=edge||position<=0)direction=position>=edge?-1:1;
        position=Math.min(edge,Math.max(0,position));
        strip.scrollLeft=position;
      }
      last=time;
      frame=requestAnimationFrame(tick);
    };
    const sync=()=>{
      cancelAnimationFrame(frame);
      if(stopped||!visible||document.hidden||strip.matches(':hover'))return;
      strip.classList.add('is-drifting');
      position=strip.scrollLeft;
      last=performance.now();
      frame=requestAnimationFrame(tick);
    };
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});
    observer.observe(strip);
    strip.addEventListener('pointerenter',sync);
    strip.addEventListener('pointerleave',sync);
    for(const event of ['pointerdown','wheel','focusin'])strip.addEventListener(event,stop,{once:true,passive:true});
    reducedMotion.addEventListener('change',stop,{once:true});
    document.addEventListener('visibilitychange',sync);
  }
  const feed=document.querySelector('[data-feed]');
  const cards=feed?[...feed.querySelectorAll('.collage-card')]:[];
  const narrow=matchMedia('(max-width:490px)'), medium=matchMedia('(max-width:850px)');
  let columns=[];
  const columnCount=()=>narrow.matches?1:medium.matches?2:3;
  function arrange(){
    if(!feed||!cards.length)return;
    columns=Array.from({length:columnCount()},()=>{
      const column=document.createElement('div');
      column.className='memory-column';
      return column;
    });
    cards.forEach((card,index)=>columns[index%columns.length].append(card));
    feed.classList.add('memory-columns');
    feed.replaceChildren(...columns);
  }
  arrange();
  for(const query of [narrow,medium])query.addEventListener('change',()=>{
    if(columns.length!==columnCount())arrange();
  });
  const addBatch=(html,prepend=false)=>{
    const batch=document.createElement('template');
    batch.innerHTML=html;
    const incoming=[...batch.content.querySelectorAll('.collage-card')];
    if(!incoming.length)return;
    const start=cards.length;
    if(prepend){
      cards.unshift(...incoming);
      arrange();
    }else{
      cards.push(...incoming);
      if(!columns.length)arrange();
      else incoming.forEach((card,index)=>columns[(start+index)%columns.length].append(card));
    }
  };
  const next=document.querySelector('[data-feed-next]');
  if(next&&!next.closest('[inert]')&&'IntersectionObserver' in window){
    let loading=false;
    next.classList.add('auto-feed');
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)) loadMore();
    },{rootMargin:'500px'});
    async function loadMore(){
      if(loading)return;
      loading=true;
      observer.unobserve(next);
      try {
        const url=new URL(next.href);
        url.searchParams.set('fragment','1');
        const response=await fetch(url);
        if(!response.ok)throw new Error();
        const items=await response.json();
        addBatch(items.html);
        if(items.next){next.href=items.next;next.classList.add('auto-feed');observer.observe(next);}
        else next.remove();
      }catch{next.classList.remove('auto-feed');next.textContent='Retry loading memories';}
      finally{loading=false;}
    }
    next.addEventListener('click',event=>{event.preventDefault();loadMore();});
    observer.observe(next);
  }
  for(const trigger of document.querySelectorAll('[data-compose-open]')){
    trigger.addEventListener('click',event=>{
      const dialog=document.querySelector('.compose-dialog');
      if(!dialog)return;
      event.preventDefault();
      dialog.showModal();
    });
  }
  const drafts=new WeakMap();
  const redrawPhotos=form=>{
    const draft=drafts.get(form);
    const {photos}=draft;
    const album=photos.length>1;
    const title=form.querySelector('[data-album-title]');
    title.hidden=!album;form.elements.title.required=album;
    form.querySelector('[data-cover-hint]').hidden=!album;
    form.querySelector('[data-photo-queue]').replaceChildren(...photos.map((photo,index)=>{
      const item=document.createElement('li'), preview=document.createElement('img');
      preview.src=photo.url;preview.alt=photo.file.name;
      if(album){
        const cover=document.createElement('button');
        cover.type='button';cover.className='cover-thumb';
        cover.setAttribute('aria-label','Set '+photo.file.name+' as cover');
        cover.setAttribute('aria-pressed',String(draft.cover===photo.id));
        cover.append(preview);
        if(draft.cover===photo.id){
          const badge=document.createElement('span');badge.textContent='Cover';cover.append(badge);
        }
        cover.onclick=()=>{draft.cover=photo.id;redrawPhotos(form);form.querySelectorAll('.cover-thumb')[index]?.focus();};
        item.append(cover);
      }else item.append(preview);
      const remove=document.createElement('button');
      remove.type='button';remove.className='remove-thumb';remove.textContent='×';
      remove.setAttribute('aria-label','Remove '+photo.file.name);
      remove.onclick=()=>{
        photos.splice(index,1);URL.revokeObjectURL(photo.url);
        if(draft.cover===photo.id)draft.cover=photos[0]?.id;
        redrawPhotos(form);
      };
      item.append(remove);
      return item;
    }));
  };
  for(const composer of document.querySelectorAll('[data-compose]')){
    drafts.set(composer,{photos:[],cover:null,initialTags:composer.querySelector('[data-topic-chips]').innerHTML});
  }
  const viewer=document.querySelector('.album-viewer');
  if(viewer){
    const albumPhotos=[...document.querySelectorAll('[data-album-photo]')];
    let current=0, touchStart;
    const show=index=>{
      current=(index+albumPhotos.length)%albumPhotos.length;
      const photo=albumPhotos[current];
      const image=viewer.querySelector('img');
      image.src=photo.href;image.alt=photo.querySelector('img').alt;
      viewer.querySelector('[role=status]').textContent=(current+1)+' of '+albumPhotos.length;
    };
    albumPhotos.forEach((photo,index)=>photo.addEventListener('click',event=>{
      event.preventDefault();show(index);viewer.showModal();
    }));
    viewer.querySelector('[data-album-prev]').onclick=()=>show(current-1);
    viewer.querySelector('[data-album-next]').onclick=()=>show(current+1);
    viewer.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
        event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1));
      }
    });
    viewer.addEventListener('touchstart',event=>{touchStart=event.changedTouches[0].clientX;},{passive:true});
    viewer.addEventListener('touchend',event=>{
      const distance=event.changedTouches[0].clientX-touchStart;
      if(Math.abs(distance)>45)show(current+(distance<0?1:-1));
    },{passive:true});
  }
  const addSelection=(form,value,label)=>{
    const list=form.querySelector('[data-topic-chips]');
    if([...list.querySelectorAll('input')].some(input=>input.value.toLowerCase()===value.toLowerCase()))return;
    const chip=document.createElement('span'), field=document.createElement('input');
    const name=document.createElement('span'), close=document.createElement('button');
    chip.className='topic-chip';field.type='hidden';field.name='about';field.value=value;
    name.textContent=(value.startsWith('person:')?'@':'#')+label;
    close.type='button';close.dataset.removeTopic='';close.textContent='×';
    close.setAttribute('aria-label','Remove '+label);
    chip.append(field,name,close);list.append(chip);
  };
  const likeRequests=new Set();
  const updateLike=(id,liked,likes)=>{
    for(const card of document.querySelectorAll('[data-post="'+CSS.escape(id)+'"]')){
      const control=card.querySelector('[data-like]');
      control.setAttribute('aria-pressed',String(liked));
      control.setAttribute('aria-label',liked?'Unlike':'Like');
      control.dataset.tooltip=liked?'Unlike':'Like';
      card.querySelector('[data-count]').textContent=likes||'';
    }
  };
  const path = card => '/posts/'+encodeURIComponent(card.dataset.post);
  async function send(url,data){
    const response=await fetch(url,{method:'POST',body:data,headers:{Accept:'application/json'}});
    if(!response.ok) throw new Error(response.status===429?'Please wait and try again.':'Could not save. Try again.');
    return response;
  }
  function message(card,text){card.querySelector('.memory-result').textContent=text;}
  async function comments(card){
    const response=await fetch(path(card)+'?panel=comments');
    if(!response.ok) throw new Error('Could not load comments.');
    const list=card.querySelector('[data-comments]');
    const rows=await response.json();
    list.replaceChildren(...rows.map(commentElement));
  }
  function commentElement(row){
      const item=document.createElement('div'), name=document.createElement('strong');
      item.className='comment-row';
      name.textContent=row.name;
      item.append(name);
      if(row.canDelete){
        const menu=document.createElement('details'), trigger=document.createElement('summary'), actions=document.createElement('div');
        const remove=document.createElement('button');
        menu.className='comment-menu';
        trigger.textContent='⋯';
        trigger.setAttribute('aria-label','Comment options');
        remove.type='button';
        remove.dataset.deleteComment=row.id;
        remove.textContent='Delete comment';
        actions.append(remove);menu.append(trigger,actions);item.append(menu);
      }
      const body=document.createElement('p');
      body.textContent=row.body;
      item.append(body);
      return item;
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.matches('[data-upload]')){button.form.querySelector('input[type=file]').click();return;}
    if(button.matches('[data-close]')){button.closest('dialog').close();return;}
    const compose=button.closest('[data-compose]');
    if(compose){
      if(button.matches('[data-remove-topic]'))button.closest('.topic-chip').remove();
      if(button.matches('[data-target-option]')){
        addSelection(compose,button.dataset.targetOption,button.dataset.label);
        compose.querySelector('[data-target-search]').value='';
        compose.querySelector('[data-target-results]').replaceChildren();
      }

    }
    const card=button.closest('[data-post]');
    if(!card)return;
    try {
      if(button.matches('[data-enlarge]')){
        if(card.closest('dialog'))return;
        const dialog=document.querySelector('.memory-dialog'), copy=card.cloneNode(true);
        const photo=copy.querySelector('[data-full-src]');
        if(photo){
          photo.removeAttribute('loading');
          photo.removeAttribute('srcset');
          photo.removeAttribute('sizes');
          photo.src=photo.dataset.fullSrc;
        }
        dialog.querySelector('[data-dialog-content]').replaceChildren(copy);
        dialog.showModal();
      } else if(button.matches('[data-like]')){
        const id=card.dataset.post;
        if(likeRequests.has(id))return;
        const previous=button.getAttribute('aria-pressed')==='true';
        const count=Number(card.querySelector('[data-count]').textContent)||0;
        likeRequests.add(id);
        message(card,'');
        updateLike(id,!previous,Math.max(0,count+(previous?-1:1)));
        try {
          const data=new FormData();
          data.set('action','like');data.set('liked',previous?'0':'1');
          const {liked,likes}=await (await send(path(card),data)).json();
          updateLike(id,liked,likes);
        } catch(error) {
          updateLike(id,previous,count);
          throw error;
        } finally {likeRequests.delete(id);}
      } else if(button.matches('[data-panel]')){
        const panel=card.querySelector('[data-panel-content="'+button.dataset.panel+'"]');
        panel.hidden=!panel.hidden;
        button.setAttribute('aria-expanded',String(!panel.hidden));
        if(!panel.hidden){
          if(button.dataset.panel==='comments'){
            panel.querySelector('form').hidden=false;
            panel.querySelector('[data-comment-again]').hidden=true;
          }
          panel.querySelector('input,textarea')?.focus();
          if(button.dataset.panel==='comments') await comments(card);
        }
      } else if(button.matches('[data-comment-again]')){
        button.hidden=true;
        const form=button.parentElement.querySelector('form');
        form.hidden=false;
        form.querySelector('textarea').focus();
      } else if(button.matches('[data-delete-comment]')){
        button.disabled=true;
        try{
          const data=new FormData();
          data.set('action','delete-comment');data.set('comment',button.dataset.deleteComment);
          await send(path(card),data);
          await comments(card);
        } finally {button.disabled=false;}
      } else if(button.matches('[data-tag-id]')){
        const panel=card.querySelector('[data-panel-content="tags"]');
        const toggle=card.querySelector('[data-panel="tags"]');
        button.disabled=true;
        panel.hidden=true;
        toggle.setAttribute('aria-expanded','false');
        try {
          const data=new FormData();
          data.set('action','tag-add');data.set('tag',button.dataset.tagId);
          if(card.dataset.photoScope)data.set('photo',card.dataset.photoScope);
          const {tags}=await (await send(path(card),data)).json();
          for(const rendered of document.querySelectorAll('[data-post="'+CSS.escape(card.dataset.post)+'"]')){
            if(rendered.dataset.photoScope===card.dataset.photoScope) rendered.querySelector('[data-memory-tags]').innerHTML=tags;
          }
          message(card,'Tag added.');
          panel.querySelector('[data-tag-search]').value='';
          panel.querySelector('[data-tag-results]').replaceChildren();
        }catch(error){
          panel.hidden=false;
          toggle.setAttribute('aria-expanded','true');
          throw error;
        }finally{button.disabled=false;}
      }
    } catch(error){message(card,error.message);}
  });
  document.addEventListener('input',async event=>{
    const input=event.target;
    if(input.matches('[data-target-search],[data-tag-search]')){
      const inCard=input.matches('[data-tag-search]');
      const results=inCard?input.parentElement.querySelector('[data-tag-results]'):input.form.querySelector('[data-target-results]');
      const q=input.value.trim();
      clearTimeout(input.searchTimer);
      input.searchRequest?.abort();
      results.replaceChildren();
      if(!q)return;
      input.searchTimer=setTimeout(async()=>{
      const controller=new AbortController();input.searchRequest=controller;
      try{
        const response=await fetch('/memory-targets?q='+encodeURIComponent(q),{signal:controller.signal});
        if(!response.ok)throw new Error();
        const rows=await response.json();
        if(input.value.trim()!==q)return;
        const suggestion=({value,label,dorm})=>{
          const option=document.createElement('button');
          option.type='button';
          if(inCard)option.dataset.tagId=value;
          else option.dataset.targetOption=value;
          option.dataset.label=label;
          option.textContent=label+(dorm?' · Dorm '+dorm:'');
          return option;
        };
        for(const category of ['Classmates','Places','Events','Tags']){
          const matches=rows.filter(row=>row.category===category);
          if(!matches.length)continue;
          const group=document.createElement('div'), heading=document.createElement('strong');
          heading.textContent=category;group.append(heading,...matches.map(suggestion));results.append(group);
        }
        const label=q.replace(/^[@#]/,'').trim();
        if(!q.startsWith('@') && label && !rows.some(row=>!row.value.startsWith('person:') && row.label.toLowerCase()===label.toLowerCase())){
          const group=document.createElement('div');
          for(const type of ['place','event']){
            const option=suggestion({value:'new-'+type+':'+label,label});
            option.textContent='Create '+type+' tag “'+label+'”';group.append(option);
          }
          results.append(group);
        }
        if(!results.children.length)results.textContent='No matches';

      }catch(error){if(error.name!=='AbortError'&&input.value.trim()===q)results.textContent='Search unavailable.';}
      },150);
      return;
    }
  });
  document.addEventListener('change',event=>{
    if(event.target.matches('[data-compose] input[type=file]')){
      const picker=event.target, draft=drafts.get(picker.form);
      const status=picker.form.querySelector('[data-compose-status]');
      status.textContent='';
      for(const file of picker.files){
        if(draft.photos.length===50){status.textContent='An album can hold up to 50 photos.';break;}
        if(file.size>15*1024*1024){status.textContent='Each photo must be 15 MB or smaller.';continue;}
        const photo={id:crypto.randomUUID(),file,url:URL.createObjectURL(file),uploaded:false};
        draft.photos.push(photo);
        draft.cover ||= photo.id;
      }
      picker.value='';
      redrawPhotos(picker.form);
    }
    if(event.target.matches('[data-directory-filters] select'))event.target.form.requestSubmit();
    if(event.target.matches('[data-profile-edit] input[type=file]')&&event.target.files.length)event.target.form.requestSubmit();
  });
  document.addEventListener('submit',async event=>{
    const form=event.target;
    if(form.matches('form[action="/logout"]')){
      const button=form.querySelector('button[type="submit"]');
      if(button.disabled){event.preventDefault();return;}
      button.textContent='Signing out…';
      button.disabled=true;
      window.addEventListener('pageshow',()=>{
        button.textContent='Log out';
        button.disabled=false;
      },{once:true});
      return;
    }
    if(form.matches('[data-compose]')){
      event.preventDefault();
      if(form.dataset.saving)return;
      form.dataset.saving='true';
      const status=form.querySelector('[data-compose-status]');
      const button=form.querySelector('button[type=submit]');
      button.disabled=true;
      try{
        const draft=drafts.get(form), data=new FormData(form);
        data.delete('images');
        if(!draft.photos.length&&!String(data.get('body')).trim())throw new Error('Add a photo or write a memory.');
        const picker=form.elements.images;
        picker.disabled=true;
        form.querySelectorAll('[data-photo-queue] button').forEach(control=>{control.disabled=true;});
        let done=draft.photos.filter(photo=>photo.uploaded).length;
        const pending=draft.photos.filter(photo=>!photo.uploaded);
        for(let start=0;start<pending.length;start+=3){
          status.textContent='Uploaded '+done+' of '+draft.photos.length+' photos…';
          const batch=await Promise.allSettled(pending.slice(start,start+3).map(async photo=>{
            const upload=new FormData();upload.set('photo',photo.file);
            const response=await fetch('/compose/photo?id='+encodeURIComponent(photo.id),{method:'POST',body:upload});
            if(!response.ok)throw new Error(await response.text()||'Could not upload a photo.');
            photo.uploaded=true;done++;
            status.textContent='Uploaded '+done+' of '+draft.photos.length+' photos…';
          }));
          const failed=batch.find(result=>result.status==='rejected');
          if(failed)throw failed.reason;
        }
        for(const photo of draft.photos)data.append('photoId',photo.id);
        if(draft.cover)data.set('cover',draft.cover);
        status.textContent='Publishing memory…';
        const response=await fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error(await response.text());
        const result=await response.json();
        if(!feed){location.assign(result.url);return;}
        if(!feed.querySelector('[data-post]'))feed.replaceChildren();
        addBatch(result.html,true);
        draft.photos.forEach(photo=>URL.revokeObjectURL(photo.url));
        draft.photos.length=0;draft.cover=null;
        form.reset();
        form.querySelector('[data-topic-chips]').innerHTML=draft.initialTags;
        form.querySelector('[data-target-results]').replaceChildren();
        form.elements.id.value=crypto.randomUUID();
        status.textContent='';
        form.closest('dialog')?.close();

      }catch(error){status.textContent=error.message;}
      finally{delete form.dataset.saving;button.disabled=false;form.elements.images.disabled=false;redrawPhotos(form);}
      return;
    }
    if(!form.matches('[data-social],[data-profile-edit]'))return;
    event.preventDefault();
    if(form.dataset.saving)return;
    form.dataset.saving='true';
    const card=form.closest('[data-post]');
    let status=form.querySelector('[data-edit-status]');
    try {
      const data=new FormData(form);
      if(card){
        const list=card.querySelector('[data-comments]');
        const optimistic=commentElement({name:'You',body:String(data.get('body'))});
        list.append(optimistic);
        form.hidden=true;
        try{
          const {comment}=await (await send(path(card),data)).json();
          optimistic.replaceWith(commentElement(comment));
          form.reset();
          form.parentElement.querySelector('[data-comment-again]').hidden=false;
          message(card,'');
        }catch(error){optimistic.remove();form.hidden=false;throw error;}
      }else{
        const response=await fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error(await response.text());
        if(response.headers.get('Content-Type')?.includes('application/json')){
          if(form.matches('[data-profile-edit]')){location.reload();return;}
          const {value}=await response.json();
          const editor=form.closest('details');
          editor.parentElement.querySelector('.field-display').textContent=value||'—';
          editor.open=false;
          return;
        }
        if(form.matches('[data-profile-edit]')){location.reload();return;}
        const next=new DOMParser().parseFromString(await response.text(),'text/html');
        const updated=next.querySelector('.alumni-profile');
        if(!updated)throw new Error('Could not update the profile. Try again.');
        document.querySelector('.alumni-profile').replaceWith(updated);
        const avatar=next.querySelector('.account summary');
        if(avatar)document.querySelector('.account summary').replaceWith(avatar);
      }
    }catch(error){
      if(card)message(card,error.message);
      else{
        if(!status){status=document.createElement('span');status.dataset.editStatus='';status.setAttribute('role','status');form.append(status);}
        status.textContent=error.message;
      }
    }finally{delete form.dataset.saving;}
  });
})();
`;
