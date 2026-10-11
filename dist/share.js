'use strict';
(() => {
  let result=null,revision=0,cardBlob=null;
  const el=id=>document.getElementById(id);
  const testURL=new URL('/test-politico/',document.querySelector('link[rel=canonical]')?.href||location.href).href;
  const dialog=document.createElement('dialog');
  dialog.id='share-dialog';dialog.setAttribute('aria-labelledby','share-title');
  dialog.innerHTML=`<div class="share-heading"><div><span class="eyebrow">TU RESULTADO. TU ELECCIÓN.</span><h2 id="share-title">Comparte tu conexión.</h2></div><button class="share-close" aria-label="Cerrar">×</button></div><div class="share-layout"><div class="share-preview"><canvas id="share-canvas" aria-label="Vista previa de la tarjeta de resultados" role="img"></canvas></div><div class="share-options"><fieldset><legend>Elige el formato</legend><div class="format-options"><label><input type="radio" name="share-format" value="story" checked><span>Stories <small>9:16</small></span></label><label><input type="radio" name="share-format" value="square"><span>Cuadrado <small>1:1</small></span></label></div></fieldset><label class="share-privacy"><input id="share-private" type="checkbox"><span>Ocultar partidos y porcentajes<small>Comparte que has hecho el test, sin mostrar tu afinidad.</small></span></label><p class="share-explainer">La imagen incluye solo lo que ves aquí. El enlace invita a hacer el test y no contiene tus opiniones.</p><button class="button dark-button" id="share-image">Compartir tarjeta</button><button class="button light-button" id="download-card">Descargar imagen PNG</button><div class="share-secondary"><button class="text-button" id="copy-summary">Copiar resumen</button><a id="share-whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div><p id="card-status" role="status" aria-live="polite"></p><a class="text-link" href="/guias/compartir-resultados/">Qué incluye tu tarjeta →</a></div></div>`;
  document.body.append(dialog);
  const canvas=el('share-canvas'),ctx=canvas.getContext('2d');
  function summary(){
    if(!result)return '';
    const hidden=el('share-private').checked;
    return (hidden?'He explorado mis ideas con Conexión Política.':
      'Mi afinidad orientativa en Conexión Política:\n'+result.ranking.filter(p=>p.score!==null).slice(0,3).map(p=>`${p.name}: ${Math.round(p.score)}% · ${p.coverage}% de cobertura`).join('\n')+'\nPerfiles editoriales; no es una recomendación de voto.')+'\nHaz tu propio test: '+testURL;
  }
  function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function text(s,x,y,size=28,color='#1d2825',weight=500,max=920){ctx.font=`${weight} ${size}px "DM Sans", sans-serif`;while(ctx.measureText(s).width>max&&size>16){size--;ctx.font=`${weight} ${size}px "DM Sans", sans-serif`;}ctx.fillStyle=color;ctx.fillText(s,x,y);}
  function wrap(s,x,y,max,size,line,color='#667060'){ctx.font=`400 ${size}px "DM Sans", sans-serif`;ctx.fillStyle=color;let row='';for(const word of s.split(' ')){if(ctx.measureText(row+' '+word).width>max&&row){ctx.fillText(row,x,y);y+=line;row=word;}else row+=(row?' ':'')+word;}if(row)ctx.fillText(row,x,y);return y;}
  const images=new Map();
  function imageFor(src){if(!images.has(src))images.set(src,new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;}));return images.get(src);}
  function contain(img,x,y,w,h){if(!img)return;const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight);const iw=img.naturalWidth*ratio,ih=img.naturalHeight*ratio;ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);}
  async function renderCard(){
    if(!result)return;const token=++revision;cardBlob=null;el('share-image').disabled=true;el('download-card').disabled=true;el('share-whatsapp').href='https://wa.me/?text='+encodeURIComponent(summary());canvas.setAttribute('aria-label',el('share-private').checked?'Preparando tarjeta sin partidos ni porcentajes':'Preparando tarjeta de afinidad');ctx.clearRect(0,0,canvas.width,canvas.height);
    const story=dialog.querySelector('[name=share-format]:checked').value==='story',hidden=el('share-private').checked;
    const rows=result.ranking.filter(p=>p.score!==null).slice(0,3),logos=hidden?[]:await Promise.all(rows.map(p=>imageFor(p.logo)));
    await document.fonts.ready;if(token!==revision||!result)return;
    canvas.width=1080;canvas.height=story?1920:1080;const h=canvas.height;
    ctx.fillStyle='#f7f9f4';ctx.fillRect(0,0,1080,h);
    const glow=ctx.createRadialGradient(1080,0,0,1080,0,850);glow.addColorStop(0,'#dcfbb2');glow.addColorStop(1,'#f7f9f400');ctx.fillStyle=glow;ctx.fillRect(0,0,1080,h);
    ctx.lineWidth=7;ctx.strokeStyle='#1d2825';ctx.beginPath();ctx.arc(100,96,28,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#83b64e';ctx.beginPath();ctx.arc(135,96,28,0,Math.PI*2);ctx.stroke();
    text('conexión política',185,110,37,'#1d2825',650,700);
    text('MIS IDEAS, EN PERSPECTIVA',72,story?300:218,22,'#526346',650);
    text('Mis ideas.',65,story?425:312,story?112:88,'#1d2825',600);
    const titleY=story?552:412;roundRect(63,titleY-22,hidden?794:700,30,0,'#c9f783');
    text(hidden?'Mi punto de partida.':'Mi conexión.',65,titleY,hidden?76:story?112:88,'#1d2825',600);
    text(`TEST ${result.mode==='quick'?'RÁPIDO':'COMPLETO'} · ${result.answered} RESPUESTAS · ${result.topicCount} TEMAS`,72,story?652:470,23,'#667060',500);
    if(!hidden){
      const winner=rows[0],ties=winner?result.ranking.filter(p=>p.score!==null&&Math.abs(p.score-winner.score)<1e-9).length:0;
      const start=story?778:510,rowH=story?190:94,gap=story?24:12;
      rows.forEach((p,i)=>{const y=start+i*(rowH+gap);roundRect(65,y,950,rowH,story?28:22,i===0?'#e7f5d7':'#ffffff','#e0e7d9');
        const logoSize=story?110:72,lx=story?100:90,ly=y+(rowH-logoSize)/2;
        roundRect(lx,ly,logoSize,logoSize,18,'#ffffff');contain(logos[i],lx+12,ly+12,logoSize-24,logoSize-24);
        const tx=story?245:191;text(p.name,tx,y+(story?74:46),story?47:35,'#1d2825',600,story?530:600);
        text(`${p.count} comparadas · ${p.coverage}% cobertura`,tx,y+(story?118:80),story?25:22,'#526346',450,600);
        ctx.textAlign='right';text(`${Math.round(p.score)}%`,970,y+(story?100:66),story?72:49,'#1d2825',600,200);ctx.textAlign='left';
        if(story){roundRect(tx,y+145,650,6,3,'#dce8d0');roundRect(tx,y+145,650*(p.score/100),6,3,p.color);}
      });
      if(ties>1)text(`Empate en la mayor afinidad: ${ties} perfiles.`,72,story?1465:838,story?27:21,'#526346',500);
    }else{
      const y=story?880:548;roundRect(65,y,950,story?410:250,30,'#1d2825');
      text('Tu opinión',105,y+(story?105:75),story?75:54,'#c9f783',550);
      text('se queda contigo.',105,y+(story?195:143),story?75:54,'#ffffff',550,870);
      wrap('He hecho el test. Ahora te toca explorar tus ideas.',110,y+(story?300:201),820,28,42,'#d2ddcb');
    }
    const footerY=h-(story?335:210);
    if(!hidden){wrap('Afinidad orientativa con perfiles editoriales. Los porcentajes se calculan por separado y no son una recomendación de voto.',72,footerY,920,story?27:23,story?38:31);text(`Modelo ${result.version}`,72,footerY+(story?112:64),20,'#6d7964',450);}
    else wrap('Sin partidos, porcentajes ni respuestas en esta tarjeta.',72,footerY,920,story?28:23,38);
    roundRect(65,h-(story?155:125),950,story?86:65,43,'#1d2825');text('Haz tu test · conexión política',110,h-(story?100:82),story?32:28,'#ffffff',550,800);
    text(new URL(testURL).hostname,72,h-28,20,'#667060',450);
    const nextBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(token!==revision)return;cardBlob=nextBlob;el('share-image').disabled=false;el('download-card').disabled=false;
    canvas.setAttribute('aria-label',hidden?'Tarjeta sin partidos ni porcentajes':summary());
    el('share-whatsapp').href='https://wa.me/?text='+encodeURIComponent(summary());
  }
  function status(s){el('card-status').textContent=s;}
  function download(){if(!cardBlob){status('La tarjeta se está preparando. Prueba de nuevo en un momento.');return;}const u=URL.createObjectURL(cardBlob),a=document.createElement('a');a.href=u;a.download='conexion-politica-'+(el('share-private').checked?'mis-ideas':'mi-conexion')+'-'+dialog.querySelector('[name=share-format]:checked').value+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);status('Imagen preparada. Puedes adjuntarla a tu Story o conversación.');}
  el('download-card').onclick=download;
  el('share-image').onclick=async()=>{if(!cardBlob){status('Espera un momento a que termine la tarjeta.');return;}const file=new File([cardBlob],'conexion-politica.png',{type:'image/png'});try{if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file],title:'Mi conexión política',text:summary()});status('Tarjeta compartida.');}else{download();status('Tu navegador no comparte imágenes directamente. Descarga el PNG y adjúntalo donde quieras.');}}catch(e){if(e.name!=='AbortError')status('No se ha podido compartir. Puedes descargar la imagen.');}};
  el('copy-summary').onclick=async()=>{try{await navigator.clipboard.writeText(summary());status('Resumen copiado con las opciones que has elegido.');}catch{status('No se pudo copiar automáticamente.');const area=document.createElement('textarea');area.readOnly=true;area.value=summary();area.setAttribute('aria-label','Resumen para copiar');area.className='copy-fallback';el('card-status').after(area);area.select();}};
  dialog.querySelector('.share-close').onclick=()=>dialog.close();
  dialog.addEventListener('change',()=>{status('');dialog.querySelector('.copy-fallback')?.remove();renderCard().catch(()=>status('No se pudo preparar la imagen. Puedes copiar el resumen.'));});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.addEventListener('cp:results',e=>{result=e.detail;});
  document.addEventListener('cp:reset',()=>{result=null;revision++;cardBlob=null;ctx.clearRect(0,0,canvas.width,canvas.height);dialog.close();});
  window.CP_SHARE={open(){if(!result)return;status('');dialog.querySelector('.copy-fallback')?.remove();dialog.showModal();renderCard().catch(()=>status('No se pudo preparar la imagen. Puedes copiar el resumen.'));}};
})();
