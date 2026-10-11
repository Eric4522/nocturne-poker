'use strict';
(() => {
  const example=document.getElementById('affinity-example');
  if(example){
    const fixed=[5,3,4],initial=[5,4,2];
    example.innerHTML=`<div class="example-controls">${fixed.map((v,i)=>`<label>Afirmación ${i+1}<select aria-label="Tu respuesta a la afirmación ${i+1}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===initial[i]?'selected':''}>${n}</option>`).join('')}</select><small>Perfil ficticio: ${v}/5</small></label>`).join('')}</div><output id="example-score" aria-live="polite"></output>`;
    const update=()=>{const vals=[...example.querySelectorAll('select')].map((s,i)=>100-25*Math.abs(Number(s.value)-fixed[i]));document.getElementById('example-score').innerHTML=`<strong>${Math.round(vals.reduce((a,b)=>a+b,0)/3*10)/10}%</strong><span>(${vals.join('% + ')}%) ÷ 3</span>`;};example.addEventListener('change',update);update();
  }
  const article=document.querySelector('.guide-article');if(!article)return;
  const progress=document.querySelector('.reading-progress span');
  const links=[...document.querySelectorAll('.guide-toc a')];
  const update=()=>{const r=article.getBoundingClientRect(),available=Math.max(1,r.height-innerHeight+120);progress.style.transform=`scaleX(${Math.max(0,Math.min(1,(120-r.top)/available))})`;};
  window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)for(const link of links){if(link.hash==='#'+e.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}},{rootMargin:'-15% 0px -65% 0px'});article.querySelectorAll('section[id]').forEach(s=>observer.observe(s));}
})();
