'use strict';
const topics = ['Economía y empleo', 'Servicios públicos', 'Derechos y sociedad', 'Medioambiente', 'Organización territorial', 'Instituciones y Europa'];
// Editorial, illustrative reference profiles; every entry is displayed in the methodology.
const parties = [
 {name:'PSOE',logo:'/party-logos/psoe.svg',full:'Partido Socialista Obrero Español',color:'#e33d50',url:'https://www.psoe.es',profile:[4,4,4,4,3,4]},
 {name:'PP',logo:'/party-logos/pp.svg',full:'Partido Popular',color:'#318bc5',url:'https://www.pp.es',profile:[2,3,3,3,2,4]},
 {name:'Vox',logo:'/party-logos/vox.svg',full:'Vox',color:'#63a63c',url:'https://www.voxespana.es',profile:[1,2,1,1,1,2]},
 {name:'Sumar',logo:'/party-logos/sumar.svg',full:'Sumar',color:'#da6095',url:'https://movimientosumar.es',profile:[5,5,5,5,4,4]},
 {name:'Podemos',logo:'/party-logos/podemos.svg',full:'Podemos',color:'#7853a1',url:'https://podemos.info',profile:[5,5,5,5,4,2]},
 {name:'ERC',logo:'/party-logos/erc.svg',full:'Esquerra Republicana de Catalunya',color:'#dba82b',url:'https://www.esquerra.cat',profile:[4,5,5,4,5,4]},
 {name:'Junts',logo:'/party-logos/junts.svg',full:'Junts per Catalunya',color:'#37a8a3',url:'https://junts.cat',profile:[2,3,4,3,5,4]},
 {name:'EH Bildu',logo:'/party-logos/eh-bildu.svg',full:'Euskal Herria Bildu',color:'#80a641',url:'https://ehbildu.eus',profile:[5,5,5,5,5,3]},
 {name:'PNV',logo:'/party-logos/pnv.svg',full:'Euzko Alderdi Jeltzalea – Partido Nacionalista Vasco',color:'#3a967a',url:'https://www.eaj-pnv.eus',profile:[3,4,4,4,5,5]},
 {name:'BNG',logo:'/party-logos/bng.svg',full:'Bloque Nacionalista Galego',color:'#5489b8',url:'https://www.bng.gal',profile:[5,5,5,5,5,3]},
 {name:'CC',logo:'/party-logos/cc.svg',full:'Coalición Canaria',color:'#d0a331',url:'https://coalicioncanaria.org',profile:[3,4,3,3,4,4]},
 {name:'UPN',logo:'/party-logos/upn.svg',full:'Unión del Pueblo Navarro',color:'#b85453',url:'https://www.upn.org',profile:[2,3,2,3,2,4]}
];
// [topic, statement, reverse orientation, optional editorial overrides]
const rawQuestions = [
 [0,'Las rentas más altas deberían pagar una mayor proporción de impuestos.'],
 [0,'El Estado debería intervenir menos en la economía.',true],
 [0,'El salario mínimo debería aumentar para proteger el poder adquisitivo.'],
 [0,'Se debería facilitar el despido para fomentar la contratación.',true],
 [0,'Las grandes empresas deberían contribuir más a financiar los servicios públicos.'],
 [0,'Las empresas públicas deberían privatizarse cuando puedan gestionarse en el mercado.',true],
 [1,'La sanidad pública debería recibir más financiación aunque requiera aumentar los impuestos.'],
 [1,'Se debería dar más espacio a la gestión privada de la sanidad.',true],
 [1,'El Estado debería limitar los precios del alquiler en zonas con problemas de acceso a la vivienda.'],
 [1,'Las becas y ayudas deberían garantizar el acceso a la universidad independientemente de la renta.'],
 [1,'Las pensiones públicas deberían mantener su poder adquisitivo con la inflación.'],
 [1,'Las familias deberían poder elegir enseñanza concertada financiada con dinero público.',true],
 [2,'Las leyes deberían proteger de forma específica la igualdad y los derechos de las personas LGTBI.'],
 [2,'Las políticas de igualdad de género deberían recibir más recursos públicos.'],
 [2,'La inmigración legal debería facilitarse para quienes buscan vivir y trabajar en España.'],
 [2,'La religión debería tener menos presencia en las instituciones públicas.'],
 [2,'Las personas adultas deberían poder decidir sobre el aborto dentro del marco legal.'],
 [2,'Se deberían endurecer los requisitos de acceso a prestaciones para las personas inmigrantes.',true],
 [3,'La transición hacia las energías renovables debería acelerarse con inversión pública.'],
 [3,'Las políticas contra el cambio climático deberían ser prioritarias aunque impliquen costes a corto plazo.'],
 [3,'Se debería ampliar el transporte público para reducir el uso del coche privado.'],
 [3,'Las restricciones ambientales deberían relajarse para favorecer la actividad empresarial.',true],
 [3,'Se deberían poner límites más estrictos a las emisiones de las industrias contaminantes.'],
 [3,'La protección de los ecosistemas debería pesar más que nuevos proyectos urbanísticos.'],
 [4,'Las comunidades autónomas deberían disponer de más competencias.'],
 [4,'El Gobierno central debería recuperar competencias que hoy tienen las autonomías.',true],
 [4,'Las lenguas cooficiales deberían recibir más protección y apoyo público.'],
 [4,'Las comunidades autónomas deberían tener mayor autonomía para gestionar sus ingresos fiscales.'],
 [4,'Se debería permitir un referéndum acordado sobre la independencia de una comunidad autónoma.',false,{'PSOE':2,'PP':1,'Vox':1,'Sumar':4,'Podemos':5,'ERC':5,'Junts':5,'EH Bildu':5,'PNV':5,'BNG':5,'CC':2,'UPN':1}],
 [4,'Las decisiones públicas deberían adaptarse más a las necesidades de cada territorio.'],
 [5,'España debería profundizar en la integración política de la Unión Europea.'],
 [5,'Los problemas compartidos entre países europeos deberían resolverse con más decisiones conjuntas.'],
 [5,'España debería reducir las competencias que cede a la Unión Europea.',true],
 [5,'La cooperación europea debería tener más peso en la política exterior de España.'],
 [5,'La ciudadanía debería participar más directamente en las decisiones públicas.',false,{'PSOE':4,'PP':3,'Vox':3,'Sumar':5,'Podemos':5,'ERC':5,'Junts':4,'EH Bildu':5,'PNV':4,'BNG':5,'CC':4,'UPN':3}],
 [5,'La jefatura del Estado debería elegirse por votación en lugar de ser hereditaria.',false,{'PSOE':2,'PP':1,'Vox':1,'Sumar':5,'Podemos':5,'ERC':5,'Junts':5,'EH Bildu':5,'PNV':3,'BNG':5,'CC':2,'UPN':1}]
];
const questions=rawQuestions.map((q,i)=>({id:i,topic:q[0],text:q[1],positions:parties.map(p=>q[3]?.[p.name]??(q[2]?6-p.profile[q[0]]:p.profile[q[0]]))}));
const quickIds=[0,1,6,8,12,17,18,21,24,28,30,35];
const labels=['Totalmente en desacuerdo','En desacuerdo','Ni de acuerdo ni en desacuerdo','De acuerdo','Totalmente de acuerdo'];
let mode=null,activeQuestions=[],answers=[],index=0,currentView='home',lastRanking=[];
const el=id=>document.getElementById(id);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function show(view){if(view!=='home')el('connection-video')?.pause();currentView=view;['home','quiz','results'].forEach(v=>el(v).hidden=v!==view);window.scrollTo({top:0,behavior:'instant'});}
function startTest(testMode){if(!['quick','full'].includes(testMode))throw new Error('Modalidad inválida.');mode=testMode;activeQuestions=testMode==='quick'?quickIds.map(i=>questions[i]):questions;answers=Array(activeQuestions.length).fill(null);index=0;lastRanking=[];show('quiz');renderQuestion();}
function renderQuestion(){const q=activeQuestions[index];const completed=answers.filter(a=>a!==null).length;el('quiz').innerHTML=`<div class="quiz-top"><button class="text-button" id="exit-quiz">‹ Volver al inicio</button><span>Test ${mode==='quick'?'rápido':'completo'} · ${activeQuestions.length} preguntas</span></div><div class="quiz-progress" role="progressbar" aria-label="Preguntas respondidas" aria-valuemin="0" aria-valuemax="${activeQuestions.length}" aria-valuenow="${completed}"><div style="width:${completed/activeQuestions.length*100}%"></div></div><div class="quiz-content"><span class="question-topic">${topics[q.topic]}</span><h1 id="question-heading" tabindex="-1">${q.text}</h1><p class="quiz-instruction">¿Hasta qué punto estás de acuerdo?</p><div class="rating-options" role="radiogroup" aria-labelledby="question-heading">${labels.map((label,i)=>`<button type="button" class="rating-button" role="radio" aria-checked="${answers[index]===i+1}" data-answer="${i+1}" aria-label="${i+1}: ${label}" tabindex="${answers[index]===i+1||answers[index]===null&&i===0?0:-1}"><strong>${i+1}</strong><span>${label}</span></button>`).join('')}</div><p class="rating-detail" aria-live="polite">${answers[index]===null?'1: totalmente en desacuerdo · 5: totalmente de acuerdo':labels[answers[index]-1]}</p><div class="quiz-controls"><button class="button light-button" id="previous-question" ${index===0?'disabled':''}>Anterior</button><span class="answered-counter" aria-live="polite">Pregunta ${index+1} de ${activeQuestions.length}</span><button class="button dark-button" id="next-question" ${answers[index]===null?'disabled':''}>${index===activeQuestions.length-1?'Ver resultados':'Continuar'}</button></div></div>`;
el('exit-quiz').onclick=()=>el('exit-dialog').showModal();el('previous-question').onclick=()=>navigate(-1);el('next-question').onclick=nextQuestion;
el('quiz').querySelectorAll('[data-answer]').forEach(b=>{b.onclick=()=>selectAnswer(Number(b.dataset.answer));b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();let v=Number(b.dataset.answer);v=e.key==='Home'?1:e.key==='End'?5:Math.max(1,Math.min(5,v+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)));selectAnswer(v);el('quiz').querySelector(`[data-answer="${v}"]`).focus();}}});}
function selectAnswer(value){if(currentView!=='quiz')throw new Error('No hay un test activo.');if(!Number.isInteger(value)||value<1||value>5)throw new Error('La respuesta debe ser un número entero de 1 a 5.');answers[index]=value;el('quiz').querySelectorAll('[data-answer]').forEach(b=>{b.setAttribute('aria-checked',String(Number(b.dataset.answer)===value));b.tabIndex=Number(b.dataset.answer)===value?0:-1;});el('next-question').disabled=false;el('quiz').querySelector('.rating-detail').textContent=labels[value-1];const n=answers.filter(a=>a!==null).length;const progress=el('quiz').querySelector('.quiz-progress');progress.setAttribute('aria-valuenow',n);progress.firstElementChild.style.width=`${n/activeQuestions.length*100}%`;}
function navigate(delta){const next=index+delta;if(next<0||next>=activeQuestions.length)return;index=next;renderQuestion();el('question-heading').focus({preventScroll:true});}
function nextQuestion(){if(answers[index]===null)return;if(index===activeQuestions.length-1){if(answers.some(a=>a===null))return;renderResults();}else navigate(1);}
function affinity(partyIndex,subset=activeQuestions){const ids=new Set(subset.map(q=>q.id));const pairs=activeQuestions.map((q,i)=>({q,a:answers[i]})).filter(({q,a})=>ids.has(q.id)&&a!==null);if(!pairs.length)return null;return 100*(1-pairs.reduce((s,{q,a})=>s+Math.abs(a-q.positions[partyIndex]),0)/(4*pairs.length));}
function computeRanking(){if(!activeQuestions.length||answers.some(a=>a===null))throw new Error('Completa todas las preguntas antes de calcular.');return parties.map((p,i)=>({...p,partyIndex:i,score:affinity(i)})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'es'));}
function renderResults(){lastRanking=computeRanking();const winner=lastRanking[0];const tied=lastRanking.filter(p=>Math.abs(p.score-winner.score)<.00001);show('results');let rank=0,previous=-1;el('results').innerHTML=`<div class="result-intro"><div class="eyebrow">TUS IDEAS, EN PERSPECTIVA</div><h1>Esta es tu conexión.</h1><p>Test ${mode==='quick'?'rápido':'completo'} · ${activeQuestions.length} respuestas · España</p><div class="winner-card"><div><div class="winner-logos" aria-hidden="true">${tied.map(p=>`<img class="party-logo" src="${p.logo}" alt="" width="64" height="52" decoding="async">`).join('')}</div><div class="eyebrow">${tied.length>1?'MAYOR AFINIDAD · EMPATE':'TU MAYOR AFINIDAD ORIENTATIVA'}</div><div class="winner-name">${tied.map(p=>p.name).join(' · ')}</div><div class="winner-subtitle">${tied.length>1?'Estas formaciones comparten la primera posición.':winner.full}</div></div><div class="winner-score">${Math.round(winner.score)}<span>%</span></div></div></div><div class="result-columns"><section class="ranking-panel"><h2>Tu afinidad, partido a partido.</h2><p class="panel-intro">Los 12 partidos incluidos, de mayor a menor coincidencia.</p>${lastRanking.map((p,i)=>{if(Math.abs(p.score-previous)>.00001)rank=i+1;previous=p.score;return `<div class="party-row" style="--party-color:${p.color};animation-delay:${i*.035}s"><span class="party-rank">${String(rank).padStart(2,'0')}</span><img class="party-logo" src="${p.logo}" alt="" width="56" height="44" decoding="async"><div class="party-text"><strong>${p.name}</strong><div class="party-bar"><span style="width:${p.score}%"></span></div></div><span class="party-percent">${Math.round(p.score)}%</span></div>`;}).join('')}</section><aside class="themes-panel"><h2>La conexión por temas.</h2><p class="panel-intro">Coincidencia con ${winner.name}${tied.length>1?' (uno de los partidos empatados)':''} en cada área.</p>${topics.map((t,i)=>{const score=affinity(winner.partyIndex,activeQuestions.filter(q=>q.topic===i));return `<div class="theme-row"><div><span>${t}</span><span>${Math.round(score)}%</span></div><div class="party-bar"><span style="width:${score}%"></span></div></div>`;}).join('')}<p class="note">Tus ideas tienen matices. Una coincidencia alta no significa que compartas todas las propuestas de un partido.</p><button class="text-button" data-method>Consultar metodología y perfiles</button></aside></div><div class="result-actions"><button class="button light-button" id="review-answers">Revisar mis respuestas</button><button class="button dark-button" id="another-test">Elegir otro test</button></div><p class="result-note">Porcentajes orientativos basados en perfiles editoriales simplificados, no en respuestas oficiales de los partidos. No es una recomendación de voto. Los porcentajes se redondean; el orden usa los valores sin redondear.</p>`;const heading=el('results').querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});el('review-answers').onclick=()=>{index=0;show('quiz');renderQuestion();el('question-heading').focus({preventScroll:true});};el('another-test').onclick=resetHome;el('results').querySelectorAll('[data-method]').forEach(b=>b.onclick=openMethod);}
function resetHome(){mode=null;activeQuestions=[];answers=[];index=0;lastRanking=[];show('home');el('exit-dialog').close();}
function openMethod(){if(!el('method-dialog').open)el('method-dialog').showModal();}
el('party-sources').innerHTML=parties.map(p=>`<a href="${p.url}" target="_blank" rel="noopener noreferrer" aria-label="Web oficial de ${p.full}">${p.name}</a>`).join('');
el('profile-table').innerHTML=`<p>Valores del 1 al 5. Las webs oficiales enlazadas sirven para consultar las propuestas de cada formación; no validan estos perfiles editoriales.</p><div class="table-scroll"><table><thead><tr><th scope="col">Afirmación</th>${parties.map(p=>`<th scope="col">${p.name}</th>`).join('')}</tr></thead><tbody>${questions.map(q=>`<tr><th scope="row">${q.id+1}. ${q.text}</th>${q.positions.map(p=>`<td>${p}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{startTest(b.dataset.start);el('question-heading').focus({preventScroll:true});});document.querySelectorAll('[data-method]').forEach(b=>b.onclick=openMethod);el('close-method').onclick=()=>el('method-dialog').close();el('stay-quiz').onclick=()=>el('exit-dialog').close();el('confirm-exit').onclick=resetHome;
document.querySelector('.brand').onclick=e=>{e.preventDefault();if(currentView==='quiz')el('exit-dialog').showModal();else resetHome();};document.querySelector('.nav-tests').onclick=e=>{if(currentView!=='home'){e.preventDefault();if(currentView==='quiz')el('exit-dialog').showModal();else resetHome();}};
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.15}):null;const howStrip=document.querySelector('.how-strip');if(observer&&howStrip){howStrip.classList.add('reveal');observer.observe(howStrip);}
// Progressive enhancement for agent-assisted completion. The interface works without WebMCP.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};const state=()=>({view:currentView,mode,total:activeQuestions.length,answered:answers.filter(a=>a!==null).length,currentQuestion:currentView==='quiz'?{number:index+1,text:activeQuestions[index].text,value:answers[index]}:null,ranking:currentView==='results'?lastRanking.map(p=>({party:p.name,percent:Math.round(p.score)})):null});register({name:'read_political_test',description:'Read the current test question, progress, or completed ranking.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>state()});register({name:'start_political_test',description:'Start a new 12-question quick or 36-question full test. Replaces any active answers.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['quick','full']}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!['quick','full'].includes(input.mode))throw new Error('Invalid mode');startTest(input.mode);return state();}});register({name:'answer_current_question',description:'Select a value from 1 to 5 for the current question and continue. The final answer completes the test and displays the ranking.',inputSchema:{type:'object',properties:{value:{type:'integer',minimum:1,maximum:5}},required:['value'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||!Number.isInteger(input.value)||input.value<1||input.value>5)throw new Error('Invalid answer');selectAnswer(input.value);nextQuestion();return state();}});window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}

// Decorative motion: one responsive asset, muted and without player interaction.
(()=>{
 const video=el('connection-video');if(!video)return;
 const mobile=window.matchMedia('(max-width:767px)');
 const reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)');
 let visible=false,selectedSource='';
 const loadSelected=()=>{
  if(video.getAttribute('src')===selectedSource)return;
  video.src=selectedSource;video.load();
 };
 const playWhenVisible=()=>{
  if(!visible||el('home').hidden||document.hidden||reducedMotion.matches)return;
  loadSelected();if(video.paused)video.play().catch(()=>{});
 };
 const selectVideo=()=>{
  const layout=mobile.matches?'mobile':'desktop';
  const source=video.dataset[layout+'Src'];if(selectedSource===source)return;
  video.pause();selectedSource=source;video.dataset.layout=layout;
  video.poster=video.dataset[layout+'Poster'];video.defaultMuted=true;
  video.muted=true;video.volume=0;video.controls=false;
  // Unload the previous format before selecting its replacement.
  if(video.hasAttribute('src')){video.removeAttribute('src');video.load();}
  playWhenVisible();
 };
 selectVideo();mobile.addEventListener('change',selectVideo);
 if('IntersectionObserver' in window){
  const visibility=new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(visible)playWhenVisible();else video.pause();
  },{threshold:.15});visibility.observe(video);
 }else{visible=true;playWhenVisible();}
 reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)video.pause();else playWhenVisible();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else playWhenVisible();});
 window.addEventListener('pagehide',()=>video.pause());
})();
