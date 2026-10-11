import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {WebSocketServer} from 'ws';
import {GolfSession,initPhysics} from './src/physics.js';
import {COLORS} from './src/courses.js';
await initPhysics();
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');const rooms=new Map();const assetCache=new Map();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.wasm':'application/wasm'};
const server=http.createServer(async(req,res)=>{
 if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,game:'fairway-club',rooms:rooms.size}));return;}
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=path.resolve(root,'.'+pathname);if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);res.end();return;}
  let file=target;try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');}catch{file=path.join(root,'index.html');}
  const cached=file.includes(path.sep+'assets'+path.sep);let asset=assetCache.get(file);if(!asset){const raw=await readFile(file);asset={raw,gzip:gzipSync(raw)};if(cached)assetCache.set(file,asset);}
  const zip=/\bgzip\b/.test(req.headers['accept-encoding']||'');res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':cached?'public, max-age=31536000, immutable':'no-cache','X-Content-Type-Options':'nosniff','Vary':'Accept-Encoding',...(zip?{'Content-Encoding':'gzip'}:{})});res.end(zip?asset.gzip:asset.raw);
 }catch{res.writeHead(404);res.end('Build the game with npm run build.');}
});
const wss=new WebSocketServer({server,path:'/socket',maxPayload:4096});
const send=(ws,m)=>{if(ws?.readyState===1)ws.send(JSON.stringify(m));};
function metadata(room){return {code:room.code,host:room.host,worldIndex:room.game.worldIndex,players:[...room.game.players.values()].map(p=>({id:p.id,name:p.name,color:p.color,connected:room.sockets.has(p.id)}))};}
function broadcast(room,type='state'){const m={type,room:metadata(room),state:room.game.snapshot()};for(const ws of room.sockets.values())send(ws,m);}
function error(ws,message){send(ws,{type:'error',message});}
function leave(ws){
 const room=rooms.get(ws.roomCode);if(!room)return;const id=ws.playerId;room.sockets.delete(id);
 if(ws.explicitLeave){room.game.removePlayer(id);room.tokens.delete(ws.resumeToken);}
 else{const timer=setTimeout(()=>{room.game.removePlayer(id);room.tokens.delete(ws.resumeToken);room.timers.delete(id);if(!room.game.players.size){room.game.dispose();rooms.delete(room.code);}else broadcast(room);},30000);timer.unref();room.timers.set(id,timer);}
 if(room.host===id&&room.sockets.size)room.host=room.sockets.keys().next().value;
 if(!room.game.players.size){room.game.dispose();rooms.delete(room.code);}else broadcast(room);
}
wss.on('connection',ws=>{
 ws.alive=true;ws.on('pong',()=>ws.alive=true);ws.rate=0;ws.rateTime=Date.now();
 ws.on('message',raw=>{
  if(Date.now()-ws.rateTime>1000){ws.rate=0;ws.rateTime=Date.now();}if(++ws.rate>30){error(ws,'Demasiadas acciones. Espera un instante.');return;}
  let m;try{m=JSON.parse(raw);}catch{return error(ws,'Mensaje inválido.');}if(!m||typeof m!=='object')return;
  if(m.type==='ping'){send(ws,{type:'pong',at:m.at});return;}
  if(m.type==='create'||m.type==='join'||m.type==='resume'){
   if(ws.roomCode)return error(ws,'Ya estás en una sala.');
   let room;
   if(m.type==='create'){
    if(rooms.size>=32)return error(ws,'Servidor lleno. Prueba más tarde.');
    let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));
    const worldIndex=Number.isInteger(m.worldIndex)&&m.worldIndex>=0&&m.worldIndex<8?m.worldIndex:0;
    room={code,game:new GolfSession(worldIndex),sockets:new Map(),timers:new Map(),tokens:new Map(),host:null,created:Date.now()};rooms.set(code,room);
   }else room=rooms.get(String(m.code||'').toUpperCase());
   if(!room)return error(ws,'No existe esa sala. Comprueba el código.');
   let id,resumeToken;
   if(m.type==='resume'){
    resumeToken=m.token;id=room.tokens.get(resumeToken);if(!id||!room.game.players.has(id)||room.sockets.has(id))return error(ws,'La sesión ya no se puede recuperar.');
    clearTimeout(room.timers.get(id));room.timers.delete(id);
   }else{id=randomBytes(8).toString('hex');if(!room.game.addPlayer(id,typeof m.name==='string'?m.name:'Golfista'))return error(ws,room.game.phase==='lobby'?'La sala está llena.':'La partida ya ha empezado.');resumeToken=randomBytes(24).toString('hex');room.tokens.set(resumeToken,id);
    if(Number.isInteger(m.color)&&m.color>=0&&m.color<COLORS.length){const used=new Set([...room.game.players.values()].filter(p=>p.id!==id).map(p=>p.color));room.game.players.get(id).color=!used.has(COLORS[m.color])?COLORS[m.color]:COLORS.find(c=>!used.has(c));}
   }
   room.host??=id;ws.roomCode=room.code;ws.playerId=id;ws.resumeToken=resumeToken;room.sockets.set(id,ws);
   send(ws,{type:'welcome',you:id,resumeToken,room:metadata(room),state:room.game.snapshot()});broadcast(room);return;
  }
  const room=rooms.get(ws.roomCode);if(!room)return error(ws,'Entra en una sala primero.');
  switch(m.type){
   case 'start':if(ws.playerId!==room.host)return error(ws,'Solo el anfitrión puede empezar.');if(!room.game.start())return error(ws,'La partida no se puede iniciar.');broadcast(room);break;
   case 'shot':if(!room.game.shoot(ws.playerId,m.angle,m.power))error(ws,'Espera a que la bola se detenga antes de golpear.');break;
   case 'reset':room.game.reset(ws.playerId);break;
   case 'next':if(ws.playerId!==room.host)return error(ws,'Solo el anfitrión puede avanzar.');if(!room.game.nextHole())return error(ws,'Espera a que todos terminen el hoyo.');broadcast(room);break;
   case 'world':if(ws.playerId!==room.host||room.game.phase!=='lobby')return error(ws,'El anfitrión elige el mundo antes de empezar.');if(Number.isInteger(m.worldIndex)&&m.worldIndex>=0&&m.worldIndex<8){room.game.worldIndex=m.worldIndex;room.game.loadCourse();broadcast(room);}break;
   case 'leave':ws.explicitLeave=true;ws.close();break;
  }
 });
 ws.on('close',()=>leave(ws));ws.on('error',()=>{});
});
let ticks=0;const interval=setInterval(()=>{
 for(const room of rooms.values()){room.game.step();if(ticks%3===0)broadcast(room);if(room.game.phase==='lobby'&&Date.now()-room.created>3600000){for(const ws of room.sockets.values())ws.close();}}
 ticks++;
},1000/60);interval.unref();
const ping=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},20000);ping.unref();
const port=process.env.PORT||3017;server.listen(port,'0.0.0.0',()=>console.log(`FAIRWAY CLUB ready at http://localhost:${port}`));
process.on('SIGTERM',()=>{for(const ws of wss.clients)ws.close();server.close(()=>process.exit(0));});
