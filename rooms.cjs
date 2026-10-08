const { randomBytes, randomInt } = require('node:crypto');
const { Engine } = require('./engine.js');
class RoomError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
class Rooms {
  constructor({ now = Date.now, turnMs = 30000, transitionMs = 1000 } = {}) {
    this.rooms = new Map(); this.now = now; this.turnMs = turnMs; this.transitionMs = transitionMs;
  }
  name(value) {
    const name = String(value || '').trim().normalize('NFC');
    if (!name || name.length > 20 || /[<>\x00-\x1f]/.test(name)) throw new RoomError('Escribe un nombre de 1 a 20 caracteres, sin símbolos < o >.');
    return name;
  }
  create(value) {
    const name = this.name(value); this.cleanup();
    if (this.rooms.size >= 1000) throw new RoomError('El servidor está lleno. Inténtalo más tarde.',503);
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code;
    do { code = Array.from({length:6},() => alphabet[randomInt(alphabet.length)]).join(''); } while (this.rooms.has(code));
    const room = {code, members:[], host:0, engine:null, version:0, activity:this.now(), deadline:null, transitionAt:null, epoch:0};
    this.rooms.set(code,room); return this.add(room,name);
  }
  get(code) {
    const room = this.rooms.get(String(code || '').toUpperCase());
    if (!room || this.now()-room.activity > 7200000) { if (room) this.rooms.delete(room.code); throw new RoomError('Esta sala no existe o ha caducado. Revisa el código.',404); }
    return room;
  }
  add(room,value) {
    const name = this.name(value);
    if (room.engine) throw new RoomError('La partida ya ha comenzado. Podrás entrar cuando vuelvan a la sala.',409);
    const id = [0,1,2,3,4,5].find(i => !room.members.some(m => m.id === i));
    if (id === undefined) throw new RoomError('La sala está llena: máximo 6 jugadores.',409);
    if (room.members.some(m => m.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new RoomError('Ese nombre ya está en la sala. Elige otro.',409);
    const member = {id,name,token:randomBytes(32).toString('base64url'),seen:this.now(),left:false,buyIn:0,topups:[]};
    room.members.push(member); room.version++; room.activity=this.now();
    return {code:room.code,token:member.token,state:this.view(room,member)};
  }
  join(code,name) { return this.add(this.get(code),name); }
  auth(code,token) {
    const room=this.get(code), member=room.members.find(m => m.token===token && !m.left);
    if (!member) throw new RoomError('Tu sesión ya no está disponible. Vuelve a entrar en la sala.',401);
    member.seen=this.now(); room.activity=this.now(); this.tick(room); return {room,member};
  }
  hostOnly(room,member) { if (room.host!==member.id) throw new RoomError('Sólo quien organiza la sala puede hacer esto.',403); }
  start(room,member) {
    this.hostOnly(room,member);
    if (room.engine) throw new RoomError('La partida ya ha comenzado.',409);
    if (room.members.filter(m => !m.left).length<2) throw new RoomError('Espera a que entre al menos un amigo.',409);
    if (room.members.some(m => this.now()-m.seen>15000)) throw new RoomError('Hay un jugador desconectado. Espera a que vuelva.',409);
    room.epoch++; room.engine=new Engine({stacks:Array.from({length:6},(_,id) => {const m=room.members.find(m=>m.id===id&&!m.left);return m?1000+m.buyIn:0;})});
    room.members.forEach(m=>{m.buyIn=0;});
    room.engine.players.forEach(p => { const m=room.members.find(m => m.id===p.id); p.name=m?.name||'Asiento libre'; p.profile='human'; p.label=m?'Jugador':'Libre'; p.initials=m?m.name.slice(0,2).toUpperCase():'—'; });
    room.engine.startHand(); this.changed(room);
  }
  changed(room) {
    room.version++; room.activity=this.now();
    room.deadline=room.engine?.phase==='betting'?this.now()+this.turnMs:null;
    room.transitionAt=room.engine?.phase==='transition'?this.now()+this.transitionMs:null;
  }
  action(room,member,data) {
    const e=room.engine;
    if (!e || data.version!==room.version) throw new RoomError('La mesa ha cambiado. Revisa tu turno y vuelve a elegir.',409);
    if (e.actor!==member.id || e.phase!=='betting') throw new RoomError('Ahora no es tu turno.',409);
    if (!['fold','check','call','raise','allin'].includes(data.type)) throw new RoomError('Acción desconocida.');
    try { e.act(member.id,data.type,data.total); } catch(error) { throw new RoomError(error.message); }
    this.changed(room);
  }
  next(room,member) {
    this.hostOnly(room,member);
    if (room.engine?.phase!=='complete') throw new RoomError('La mano todavía no ha terminado.',409);
    this.reconcile(room);
    if (!room.engine) { this.changed(room); return; }
    if (room.engine.players.filter(p => p.stack>0).length<2) throw new RoomError('La partida ha terminado. Vuelve a la sala para jugar otra.',409);
    room.engine.startHand(); this.changed(room);
  }
  topup(room,member,data) {
    if(![500,1000,2000].includes(data.amount)||typeof data.receipt!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(data.receipt)) throw new RoomError('Recarga incorrecta.');
    if(member.topups.some(t=>t.receipt===data.receipt)) return;
    if(member.topups.length>=1000) throw new RoomError('Se ha alcanzado el límite de recargas de esta sala.',409);
    if(data.version!==room.version) throw new RoomError('La mesa ha cambiado. Vuelve a intentar la recarga.',409);
    if(room.engine && room.engine.phase!=='complete') throw new RoomError('Las fichas sólo se añaden entre manos.',409);
    const checkpoint=`${room.epoch}.${room.engine?.handNumber||0}`;
    const used=member.topups.filter(t=>t.checkpoint===checkpoint).reduce((n,t)=>n+t.amount,0);
    if(used+data.amount>2000) throw new RoomError('Máximo 2.000 fichas de recarga por jugador entre manos.',409);
    member.topups.push({receipt:data.receipt,amount:data.amount,checkpoint});
    if(room.engine){const p=room.engine.players[member.id];p.stack+=data.amount;p.eliminated=false;room.engine.log('rebuy',member.id,data.amount,`${member.name} recarga ${data.amount} fichas`);}
    else member.buyIn+=data.amount;
    this.changed(room);
  }
  reset(room,member) {
    this.hostOnly(room,member);
    if (room.engine && room.engine.phase!=='complete') throw new RoomError('Espera a que termine la mano para volver a la sala.',409);
    room.engine=null; room.members=room.members.filter(m => !m.left); this.changed(room);
  }
  leave(room,member) {
    member.left=true;
    if (room.engine?.actor===member.id) room.deadline=this.now();
    if (!room.engine) room.members=room.members.filter(m => !m.left);
    const present=room.members.filter(m => !m.left);
    if (!present.length) { this.rooms.delete(room.code); return; }
    if (room.host===member.id) room.host=present[0].id;
    this.reconcile(room);
    room.version++;
  }
  reconcile(room) {
    if (room.engine?.phase !== 'complete') return;
    // An explicit departure takes uncommitted virtual chips off the table at
    // the hand boundary. Committed pots are settled first, including all-ins.
    for (const member of room.members.filter(m => m.left)) {
      const player=room.engine.players[member.id];
      room.withdrawn=(room.withdrawn||0)+player.stack;
      player.stack=0; player.eliminated=true; player.cards=[];
    }
    const funded=room.members.filter(m => !m.left && room.engine.players[m.id].stack>0);
    if (funded.length<2 && room.members.some(m => m.left)) {
      room.engine=null; room.members=room.members.filter(m => !m.left);
      room.deadline=null; room.transitionAt=null;
    }
  }
  tick(room) {
    if (!room.engine) {
      const previous=room.members.length;
      room.members=room.members.filter(m => !m.left && this.now()-m.seen<=60000);
      if (room.members.length!==previous) room.version++;
      if (!room.members.length) { this.rooms.delete(room.code); return; }
    }
    const e=room.engine;
    if (e?.phase==='transition' && this.now()>=room.transitionAt) { e.advanceStreet(); this.changed(room); }
    else if (e?.phase==='betting' && (room.members.find(m => m.id===e.actor)?.left || this.now()>=room.deadline)) {
      const left=room.members.find(m => m.id===e.actor)?.left;
      e.act(e.actor,!left&&e.legalActions(e.actor).check?'check':'fold'); this.changed(room);
    }
    this.reconcile(room);
    const host=room.members.find(m => m.id===room.host && !m.left);
    if (!host || this.now()-host.seen>30000) {
      const next=room.members.find(m => !m.left && this.now()-m.seen<15000);
      if (next && next.id!==room.host) { room.host=next.id; room.version++; }
    }
  }
  view(room,member) {
    const e=room.engine, now=this.now(), id=n => n===null||n===undefined?null:(n-member.id+6)%6;
    const state={code:room.code,version:room.version,epoch:room.epoch,isHost:room.host===member.id,
      members:room.members.filter(m => !m.left).map(m => ({id:id(m.id),name:m.name,host:m.id===room.host,connected:now-m.seen<15000,buyIn:m.buyIn})),
      topupReceipts:member.topups.map(t=>({receipt:t.receipt,amount:t.amount})),
      turnRemaining:Math.max(0,Math.ceil((room.deadline-now)/1000)),game:null};
    if (!e) return state;
    const complete=e.phase==='complete';
    const players=e.players.map(p => {
      const visible=p.id===member.id||(complete&&e.result.showdown&&!p.folded);
      return {id:id(p.id),name:p.name,initials:p.initials,profile:'human',label:p.eliminated&&!p.cards.length?'Libre':'Jugador',
        stack:p.stack,bet:p.bet,total:p.total,folded:p.folded,eliminated:p.eliminated,lastAction:p.lastAction,
        cards:visible?p.cards.map(c => ({...c})):p.cards.map((_,i) => ({id:`hidden-${id(p.id)}-${i}`,hidden:true}))};
    }).sort((a,b) => a.id-b.id);
    let result=null;
    if (complete) {
      const r=e.result;
      result={pot:r.pot,showdown:r.showdown,awards:Array(6).fill(0),refunds:Array(6).fill(0),hands:{},pots:r.pots.map(p => ({...p,eligible:p.eligible.map(id),winners:p.winners.map(id)}))};
      e.players.forEach(p => {result.awards[id(p.id)]=r.awards[p.id];result.refunds[id(p.id)]=r.refunds[p.id];});
      Object.entries(r.hands).forEach(([key,hand]) => {result.hands[id(Number(key))]=hand;});
    }
    state.game={phase:e.phase,street:e.street,handNumber:e.handNumber,dealer:id(e.dealer),actor:id(e.actor),pot:e.pot,currentBet:e.currentBet,
      board:e.board.map(c => ({...c})),players,result,legal:e.legalActions(member.id),history:e.history.slice(-100).map(event => ({...event,id:id(event.id)}))};
    return state;
  }
  cleanup() { for (const [code,room] of this.rooms) if (this.now()-room.activity>7200000) this.rooms.delete(code); }
}
module.exports={Rooms,RoomError};
