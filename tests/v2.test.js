import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLDS,makeCourse,surfaceHeight,surfaceMesh,groundHeight} from '../src/courses.js';
import {validateName,powerFeedback} from '../src/rules.js';
import {GolfSession,initPhysics} from '../src/physics.js';
await initPhysics();
test('all sixteen worlds have flat and physically lowered cup surfaces',()=>{
 assert.equal(WORLDS.length,16);
 const routes=new Set();
 for(let w=0;w<16;w++){
  const styles=new Set();
  for(let h=0;h<9;h++){
   const c=makeCourse(w,h),last=c.tiles.at(-1);styles.add(c.cupStyle);
   assert.equal(c.cup.y,surfaceHeight(last,c.cup.x,c.cup.z));
   if(c.cupStyle==='bowl')assert.ok(c.cup.y<-.5);
   const mesh=surfaceMesh(last,c.cup);assert.ok(mesh.positions.length>0);assert.ok(mesh.indices.length>0);
   assert.equal(surfaceHeight(last,last.x+2,last.z),0);
   routes.add(JSON.stringify([c.tiles,c.cup,c.obstacles]));
  }
  assert.deepEqual(styles,new Set(['flat','bowl']));
 }
 assert.equal(routes.size,144);
});
test('eight tee positions never overlap, including after advancing holes',()=>{
 const s=new GolfSession(0);for(let i=0;i<8;i++)assert.ok(s.addPlayer('p'+i,'Jugador '+i));
 const check=()=>{const ps=[...s.players.values()];for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i].body.translation(),b=ps[j].body.translation();assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.46);}};
 check();s.start();for(const p of s.players.values())p.finished=true;s.nextHole();check();s.dispose();
});
test('an actual ball impact transfers motion without awarding the other player a stroke',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.addPlayer('b','Biel');s.start();
 const a=s.players.get('a'),b=s.players.get('b');a.body.setTranslation({x:-.8,y:.23,z:0},true);b.body.setTranslation({x:.3,y:.23,z:0},true);
 for(let i=0;i<30;i++)s.step();s.shoot('a',Math.PI/2,.2);
 let transferred=false;for(let i=0;i<20;i++){s.step();if(b.body.linvel().x>.7)transferred=true;}
 assert.ok(transferred);assert.equal(b.strokes,0);assert.equal(a.strokes,1);s.dispose();
});
test('deep cup accepts a ball at its real lowered height and disables its collider',()=>{
 const s=new GolfSession(0);s.hole=1;s.loadCourse();s.addPlayer('a','Ana');s.addPlayer('b','Biel');s.start();
 const p=s.players.get('a'),c=s.course.cup;assert.ok(c.y<-.5);p.strokes=3;p.body.setTranslation({x:c.x,y:c.y+.2,z:c.z},true);s.step();
 assert.ok(p.finished);assert.equal(p.scores[1],3);assert.equal(p.body.isEnabled(),false);s.dispose();
});
test('names are required and sanitized consistently on both sides of the connection',()=>{
 for(const n of ['',null,'  ','A','<script>','x'.repeat(21)])assert.equal(validateName(n).ok,false);
 assert.deepEqual(validateName('  Èric   López  '),{ok:true,name:'Èric López'});
 const s=new GolfSession(0);assert.equal(s.addPlayer('a',''),false);s.dispose();
});
test('power thresholds give accessible green orange red feedback',()=>{
 assert.equal(powerFeedback(.2).label,'FLOJO');assert.equal(powerFeedback(.5).label,'NORMAL');assert.equal(powerFeedback(.9).label,'FUERTE');
 assert.equal(new Set([.2,.5,.9].map(p=>powerFeedback(p).color)).size,3);
});
test('gravity rolls a ball down the visible bowl and into the cup',()=>{
 const s=new GolfSession(0);s.hole=1;s.loadCourse();s.addPlayer('a','Ana');s.start();const p=s.players.get('a'),c=s.course.cup;
 p.strokes=2;const x=c.x+1.1;p.body.setTranslation({x,y:groundHeight(s.course,x,c.z)+.24,z:c.z},true);
 for(let i=0;i<600&&!p.finished;i++)s.step();assert.ok(p.finished);assert.equal(p.scores[1],2);s.dispose();
});
test('all 144 courses have stable tee physics and finite terrain contacts',()=>{
 for(let w=0;w<16;w++){const s=new GolfSession(w);s.addPlayer('a','Ana');s.start();for(let h=0;h<9;h++){s.hole=h;s.loadCourse();for(let t=0;t<60;t++)s.step();const p=s.players.get('a');assert.ok(Math.abs(p.body.translation().y-.22)<.04,`tee ${w}/${h}`);assert.equal(p.strokes,0);const hill=s.course.tiles.find(t=>t.profile==='hill');if(hill){p.body.setTranslation({x:hill.x,y:groundHeight(s.course,hill.x,hill.z)+.3,z:hill.z},true);for(let t=0;t<60;t++)s.step();assert.ok(p.body.translation().y>=-.1);assert.ok(Number.isFinite(p.body.translation().x));}}s.dispose();}
});
test('finishing all nine holes can start the next map while keeping the same group',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.addPlayer('b','Biel');s.start();
 for(let h=0;h<9;h++){for(const p of s.players.values())p.finished=true;assert.ok(s.nextHole());}
 assert.equal(s.phase,'results');assert.ok(s.playMap(1));assert.equal(s.phase,'playing');assert.equal(s.worldIndex,1);assert.equal(s.hole,0);assert.equal(s.players.size,2);assert.deepEqual(s.players.get('a').scores,[]);assert.equal(s.playMap(2),false);s.dispose();
});
test('long routes provide connected plazas, raised bridges and sufficient length',()=>{
 for(let w=0;w<16;w++)for(let h=0;h<9;h++){
  const c=makeCourse(w,h);if(w===0&&h===0)continue;assert.ok(c.distance>=96);assert.ok(c.tiles.some(t=>t.profile==='bridge'));assert.ok(c.tiles.some(t=>t.plaza));
  const all=new Set(c.tiles.map(t=>`${t.x},${t.z}`)),visited=new Set(['0,0']),queue=[[0,0]];while(queue.length){const [x,z]=queue.shift();for(const [dx,dz]of [[4,0],[-4,0],[0,4],[0,-4]]){const k=`${x+dx},${z+dz}`;if(all.has(k)&&!visited.has(k)){visited.add(k);queue.push([x+dx,z+dz]);}}}assert.equal(visited.size,all.size);
 }
});
test('a real shot climbs the raised bridge and stays on its collision surface',()=>{
 const s=new GolfSession(15);s.addPlayer('a','Ana');s.start();for(let i=0;i<60;i++)s.step();assert.ok(s.shoot('a',0,.65));let climbed=false;for(let i=0;i<180;i++){s.step();const pos=s.players.get('a').body.translation();if(pos.z<-7&&pos.y>.6)climbed=true;assert.ok(Number.isFinite(pos.y));}assert.ok(climbed);assert.equal(s.players.get('a').strokes,1);s.dispose();
});
