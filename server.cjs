const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { Rooms, RoomError } = require('./rooms.cjs');
const root = __dirname;
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png' };
function createServer({ rooms = new Rooms() } = {}) {
  const limits = new Map();
  const interval = setInterval(() => { rooms.cleanup(); for (const room of rooms.rooms.values()) rooms.tick(room); for (const [key,l] of limits) if (Date.now()-l.start>60000) limits.delete(key); },250);
  interval.unref();
  const server = http.createServer(async (req,res) => {
    const json = (status,data) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url,'http://localhost');
      if (url.pathname==='/health') return json(200,{ok:true});
      if (url.pathname.startsWith('/api/')) {
        const key = `${req.socket.remoteAddress}:${req.method==='GET'?'read':'write'}`;
        const l = limits.get(key)||{start:Date.now(),count:0};
        if (Date.now()-l.start>60000) {l.start=Date.now();l.count=0;} limits.set(key,l);
        if (++l.count>(req.method==='GET'?1500:180)) throw new RoomError('Demasiadas peticiones. Espera un minuto.',429);
        let data={};
        if (req.method==='POST') {
          if (req.headers.origin && new URL(req.headers.origin).host!==req.headers.host) throw new RoomError('Origen no autorizado.',403);
          if (!String(req.headers['content-type']).startsWith('application/json')) throw new RoomError('Se requiere JSON.',415);
          let body=''; for await (const chunk of req) {body+=chunk;if(body.length>4096) throw new RoomError('Petición demasiado grande.',413);}
          try {data=JSON.parse(body||'{}');} catch {throw new RoomError('JSON incorrecto.');}
          if (!data||typeof data!=='object'||Array.isArray(data)) throw new RoomError('Petición incorrecta.');
        }
        if (url.pathname==='/api/rooms'&&req.method==='POST') return json(201,rooms.create(data.name));
        const match=url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})\/(join|state|start|action|next|reset|leave)$/i);
        if (!match) throw new RoomError('Ruta no encontrada.',404);
        const [,code,op]=match;
        if(op==='join'&&req.method==='POST') return json(200,rooms.join(code,data.name));
        if((op==='state'&&req.method!=='GET')||(op!=='state'&&req.method!=='POST')) throw new RoomError('Método no permitido.',405);
        const token=String(req.headers.authorization||'').replace(/^Bearer /,'');
        const {room,member}=rooms.auth(code,token);
        if(op==='action') rooms.action(room,member,data);
        else if(op==='start') rooms.start(room,member);
        else if(op==='next') rooms.next(room,member);
        else if(op==='reset') rooms.reset(room,member);
        else if(op==='leave') {rooms.leave(room,member);return json(200,{ok:true});}
        return json(200,rooms.view(room,member));
      }
      if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405);return res.end();}
      const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
      if(!(relative==='/index.html'||/^\/(css|js|assets)\/[\w./-]+$/.test(relative))) {res.writeHead(404);return res.end('Not found');}
      const file=path.resolve(root,path.basename(relative));
      if(!file.startsWith(root+path.sep)||!mime[path.extname(file)]) {res.writeHead(403);return res.end();}
      fs.readFile(file,(error,data) => {
        if(error) {res.writeHead(404);return res.end('Not found');}
        res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"});
        res.end(req.method==='HEAD'?undefined:data);
      });
    } catch(error) {json(error.status||500,{error:error.status?error.message:'Ha ocurrido un error en el servidor.'});}
  });
  server.on('close',()=>clearInterval(interval)); return server;
}
if(require.main===module) {
  const port=Number(process.env.PORT||process.env.NOCTURNE_PORT||4173);
  createServer().listen(port,'0.0.0.0',()=>{
    console.log(`Nocturne Poker: http://localhost:${port}`);
    for(const rows of Object.values(os.networkInterfaces())) for(const ip of rows||[]) if(ip.family==='IPv4'&&!ip.internal) console.log(`Amigos en tu Wi-Fi: http://${ip.address}:${port}`);
  });
}
module.exports={createServer};
