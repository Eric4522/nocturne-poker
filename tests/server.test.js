import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {WebSocket} from 'ws';
let child;const clients=[];const url='ws://127.0.0.1:3127/socket';
before(async()=>{child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3127'},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server timeout')),15000);child.stdout.on('data',d=>{if(String(d).includes('ready')){clearTimeout(t);resolve();}});child.on('exit',code=>reject(Error('Server exited '+code)));});});
after(()=>{clients.forEach(c=>c.close());child?.kill();});
async function client(){const ws=new WebSocket(url);clients.push(ws);ws.queue=[];ws.on('message',raw=>{const m=JSON.parse(raw);ws.queue.push(m);ws.wake?.();});await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});return ws;}
async function receive(ws,type,condition=()=>true){const deadline=Date.now()+4000;while(Date.now()<deadline){const i=ws.queue.findIndex(m=>m.type===type&&condition(m));if(i>=0)return ws.queue.splice(i,1)[0];await new Promise(r=>{const t=setTimeout(r,50);ws.wake=()=>{clearTimeout(t);r();};});}throw Error('No message '+type);}
function send(ws,m){ws.send(JSON.stringify(m));}
test('server requires a name before allocating a room and accepts map sixteen',async()=>{
 const ws=await client();const before=await(await fetch('http://127.0.0.1:3127/health')).json();
 send(ws,{type:'create',name:' ',worldIndex:15});assert.match((await receive(ws,'error')).message,/nombre/);
 const after=await(await fetch('http://127.0.0.1:3127/health')).json();assert.equal(after.rooms,before.rooms);
 send(ws,{type:'create',name:'Último mapa',worldIndex:15});const m=await receive(ws,'welcome');assert.equal(m.state.worldIndex,15);send(ws,{type:'leave'});
});
test('a multiplayer group advances through nine holes and changes map without reconnecting',async()=>{
 const host=await client(),guest=await client();send(host,{type:'create',name:'Ronda host',worldIndex:0});const a=await receive(host,'welcome');send(guest,{type:'join',name:'Ronda guest',code:a.room.code});const b=await receive(guest,'welcome');send(host,{type:'start'});await receive(host,'state',m=>m.state.phase==='playing');
 for(let h=0;h<9;h++){send(host,{type:'finish'});send(guest,{type:'finish'});await receive(host,'state',m=>m.state.hole===h&&m.state.players.every(p=>p.finished));send(host,{type:'next'});await receive(host,'state',m=>h===8?m.state.phase==='results':m.state.hole===h+1);}
 send(guest,{type:'restart',worldIndex:1});assert.match((await receive(guest,'error')).message,/anfitrión/);
 send(host,{type:'restart',worldIndex:1});const next=await receive(guest,'state',m=>m.state.worldIndex===1&&m.state.phase==='playing');assert.equal(next.room.code,a.room.code);assert.equal(next.state.hole,0);assert.deepEqual(next.state.players.map(p=>p.id),[a.you,b.you]);assert.ok(next.state.players.every(p=>p.scores.length===0));send(host,{type:'leave'});send(guest,{type:'leave'});
});
test('HTTP health and frontend are available',async()=>{const h=await fetch('http://127.0.0.1:3127/health');assert.equal(h.status,200);assert.equal((await h.json()).game,'fairway-club');const page=await fetch('http://127.0.0.1:3127/');assert.equal(page.status,200);assert.match(await page.text(),/Fairway Club/);});
test('two real sockets join; only host starts; shots and positions synchronize',async()=>{
 const host=await client(),guest=await client();send(host,{type:'create',name:'Host',worldIndex:0});const a=await receive(host,'welcome');assert.match(a.room.code,/^[A-F0-9]{6}$/);
 send(guest,{type:'join',name:'Guest',code:a.room.code});const b=await receive(guest,'welcome');assert.equal(b.state.players.length,2);
 send(guest,{type:'start'});assert.match((await receive(guest,'error')).message,/anfitrión/);
 send(host,{type:'start'});await receive(guest,'state',m=>m.state.phase==='playing');
 await receive(host,'state',m=>m.state.phase==='playing'&&m.state.time>.4&&!m.state.players.find(p=>p.id===a.you).moving);
 send(host,{type:'shot',angle:0,power:.4});const moved=await receive(guest,'state',m=>m.state.players.find(p=>p.id===a.you).pos.z<.4);assert.equal(moved.state.players.find(p=>p.id===a.you).strokes,1);
 await receive(guest,'state',m=>m.state.time>.7&&!m.state.players.find(p=>p.id===b.you)?.moving);
 send(guest,{type:'shot',angle:0,power:.3,id:a.you});const shot=await receive(host,'state',m=>m.state.players.find(p=>p.id===b.you)?.strokes===1);assert.equal(shot.state.players.find(p=>p.id===a.you).strokes,1);
 send(guest,{type:'next'});assert.match((await receive(guest,'error')).message,/anfitrión/);
 host.close();guest.close();
});
test('missing room and late joins give a visible error',async()=>{
 const host=await client(),guest=await client();send(guest,{type:'join',name:'Guest',code:'FFFFFF'});assert.match((await receive(guest,'error')).message,/No existe/);
 send(host,{type:'create',name:'Host'});const a=await receive(host,'welcome');send(host,{type:'start'});await receive(host,'state',m=>m.state.phase==='playing');
 send(guest,{type:'join',name:'Guest',code:a.room.code});assert.match((await receive(guest,'error')).message,/empezado/);host.close();guest.close();
});
test('eight players fit in a room; a ninth is refused',async()=>{
 const group=[];const host=await client();group.push(host);send(host,{type:'create',name:'Host'});const room=await receive(host,'welcome');
 for(let i=1;i<8;i++){const c=await client();group.push(c);send(c,{type:'join',name:'P'+i,code:room.room.code});const m=await receive(c,'welcome');assert.equal(m.state.players.length,i+1);}
 const ninth=await client();send(ninth,{type:'join',name:'Extra',code:room.room.code});assert.match((await receive(ninth,'error')).message,/llena/);group.forEach(c=>c.close());ninth.close();
});
test('disconnection transfers host and token restores the same player',async()=>{
 const host=await client(),guest=await client();send(host,{type:'create',name:'Host'});const a=await receive(host,'welcome');send(guest,{type:'join',name:'Guest',code:a.room.code});const b=await receive(guest,'welcome');host.close();await receive(guest,'state',m=>m.room.host===b.you);
 const intruder=await client();send(intruder,{type:'resume',code:a.room.code,token:a.you});assert.match((await receive(intruder,'error')).message,/recuperar/);assert.ok(!JSON.stringify(b.state).includes(a.resumeToken));
 const resume=await client();send(resume,{type:'resume',code:a.room.code,token:a.resumeToken});const restored=await receive(resume,'welcome');assert.equal(restored.you,a.you);assert.equal(restored.state.players.length,2);assert.equal(restored.room.host,b.you);resume.close();guest.close();intruder.close();
});
