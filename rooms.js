(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let session = null, state = null, joinMode = false, stopped = false, pollTimer, busy = false, online = false, generation = 0;
  const emit = () => window.dispatchEvent(new CustomEvent('poker-room-state', { detail: { state, online, busy } }));
  const errorText = error => error instanceof TypeError ? 'No se puede conectar con el servidor. Revisa la conexión.' : error.message;
  async function request(path, data, auth = false) {
    const response = await fetch(path, { method: data === undefined ? 'GET' : 'POST',
      headers: { ...(data === undefined ? {} : {'Content-Type':'application/json'}), ...(auth ? {Authorization:`Bearer ${session.token}`} : {}) },
      ...(data === undefined ? {} : {body:JSON.stringify(data)}), signal:AbortSignal.timeout(8000), cache:'no-store' });
    const result = await response.json();
    if (!response.ok) { const error = new Error(result.error || 'No se ha podido completar la acción.'); error.status=response.status; throw error; }
    return result;
  }
  function store() { try { if(session) sessionStorage.setItem('nocturne.room.v2',JSON.stringify(session)); else sessionStorage.removeItem('nocturne.room.v2'); } catch {} }
  function paint() {
    if (!state) return;
    $('room-code').textContent=state.code; $('game-room-code').textContent=state.code;
    $('room-connection').textContent=online?'Conectado':'Reconectando…';
    $('room-members').replaceChildren();
    state.members.forEach(member => {
      const node=document.createElement('div'); node.className='room-member';
      const avatar=document.createElement('span'); avatar.className='room-member-avatar'; avatar.textContent=member.name.slice(0,2).toUpperCase();
      const name=document.createElement('strong'); name.textContent=member.name+(member.id===0?' (tú)':'');
      const label=document.createElement('small'); label.textContent=!member.connected?'Ausente · espera hasta 60 s':member.host?'Organizador':'Listo para jugar';
      node.append(avatar,name,label); $('room-members').append(node);
    });
    const waiting=!state.game;
    $('room-lobby').hidden=!waiting; $('room-game-bar').hidden=waiting;
    $('room-start').hidden=!state.isHost;
    $('room-start').disabled=busy||!online||state.members.length<2||state.members.some(m=>!m.connected);
    $('room-message').textContent=state.isHost?'Empieza cuando tus amigos estén listos.':'El organizador empezará la partida.';
    $('room-turn-clock').textContent=online?(state.game?.phase==='betting'?`${state.game.actor===0?'Tu turno':'Turno en curso'} · ${state.turnRemaining} s`:'Sala conectada'):'Reconectando…';
    $('lobby').hidden=true;
  }
  async function poll() {
    if(stopped||!session) return;
    const mine=generation, identity=session;
    if(!busy) {
      try {
        const result=await request(`/api/rooms/${identity.code}/state`,undefined,true);
        if(stopped||generation!==mine||session!==identity) return;
        if(!state||result.version>=state.version) state=result;
        online=true; paint(); emit();
      }
      catch(error) {
        if(stopped||generation!==mine||session!==identity) return;
        online=false;
        if([401,404].includes(error.status)) { const message=error.message; clear(); $('room-form-error').textContent=message; open(); return; }
        paint(); emit();
      }
    }
    if(!stopped&&generation===mine&&session===identity) pollTimer=setTimeout(poll,700);
  }
  function clear() {
    stopped=true; generation++; clearTimeout(pollTimer); session=null; state=null; online=false; busy=false; store();
    $('room-lobby').hidden=true; $('room-game-bar').hidden=true; emit();
  }
  async function command(op,data={}) {
    if(!session||busy||!online) return;
    busy=true; emit();
    try { const result=await request(`/api/rooms/${session.code}/${op}`,data,true); if(!state||result.version>=state.version) state=result; online=true; paint(); }
    catch(error) { $('room-message').textContent=errorText(error); window.dispatchEvent(new CustomEvent('poker-room-error',{detail:errorText(error)})); }
    finally { busy=false; emit(); }
  }
  function selectMode(join) {
    joinMode=join; $('room-code-field').hidden=!join; $('join-code').required=join;
    $('room-create-tab').setAttribute('aria-pressed',String(!join)); $('room-join-tab').setAttribute('aria-pressed',String(join));
    $('room-submit').textContent=join?'Entrar en la sala':'Crear sala'; $('room-form-error').textContent='';
  }
  function open() {
    if(session) return;
    selectMode(false);
    if(location.protocol==='file:') {
      $('room-server-note').textContent='Para jugar con amigos, abre INICIAR-SERVIDOR.cmd y entra en http://localhost:4173. En este archivo puedes jugar solo.';
      $('room-submit').disabled=true;
    } else $('room-submit').disabled=false;
    $('room-dialog').showModal(); $('room-name').focus();
  }
  async function copy() {
    if(!state) return;
    try { await navigator.clipboard.writeText(state.code); window.dispatchEvent(new CustomEvent('poker-room-error',{detail:'Código copiado: '+state.code})); }
    catch { window.dispatchEvent(new CustomEvent('poker-room-error',{detail:'Tu código de sala: '+state.code})); }
  }
  $('friends-button').addEventListener('click',open);
  $('room-dialog-close').addEventListener('click',()=> $('room-dialog').close());
  $('room-create-tab').addEventListener('click',()=>selectMode(false)); $('room-join-tab').addEventListener('click',()=>selectMode(true));
  $('join-code').addEventListener('input',event=>{event.target.value=event.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'');});
  $('room-form').addEventListener('submit',async event=>{
    event.preventDefault(); $('room-submit').disabled=true; $('room-form-error').textContent='';
    try {
      const result=await request(joinMode?`/api/rooms/${$('join-code').value.trim()}/join`:'/api/rooms',{name:$('room-name').value.trim()});
      generation++; session={code:result.code,token:result.token}; state=result.state; online=true; stopped=false; store();
      $('room-dialog').close(); paint(); emit(); poll();
    } catch(error) { $('room-form-error').textContent=errorText(error); }
    finally { $('room-submit').disabled=false; }
  });
  $('room-start').addEventListener('click',()=>command('start'));
  $('copy-room-code').addEventListener('click',copy); $('copy-game-code').addEventListener('click',copy);
  document.querySelectorAll('[data-room-leave]').forEach(b=>b.addEventListener('click',async()=>{
    if(busy||!session) return;
    busy=true; emit();
    try { await request(`/api/rooms/${session.code}/leave`,{},true); clear(); }
    catch(error) { busy=false; window.dispatchEvent(new CustomEvent('poker-room-error',{detail:errorText(error)})); emit(); }
  }));
  window.PokerRoom=Object.freeze({action:(type,total)=>command('action',{type,total,version:state.version}),next:()=>command('next'),reset:()=>command('reset'),isHost:()=>!!state?.isHost});
  try { const stored=JSON.parse(sessionStorage.getItem('nocturne.room.v2')); if(stored?.code&&stored?.token&&location.protocol!=='file:') {session=stored;stopped=false;poll();} } catch {}
})();
