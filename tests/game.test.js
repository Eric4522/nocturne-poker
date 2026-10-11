import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WORLDS,makeCourse} from '../src/courses.js';
import {GolfSession,initPhysics} from '../src/physics.js';
await initPhysics();
test('72 unique connected courses with reachable cups',()=>{
 const seen=new Set();
 for(let w=0;w<8;w++)for(let h=0;h<9;h++){
  const c=makeCourse(w,h);assert.ok(c.tiles.length>=5);
  for(let i=1;i<c.tiles.length;i++) assert.equal(Math.abs(c.tiles[i].x-c.tiles[i-1].x)+Math.abs(c.tiles[i].z-c.tiles[i-1].z),4);
  assert.equal(new Set(c.tiles.map(t=>`${t.x},${t.z}`)).size,c.tiles.length);
  seen.add(JSON.stringify(c.tiles));assert.ok(c.par>=2);
 }
 assert.equal(seen.size,72);assert.equal(WORLDS.length,8);
});
test('legal shot moves a real ball; second shot while moving is rejected',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.start();
 assert.equal(s.shoot('a',0,0.5),true);assert.equal(s.shoot('a',0,0.5),false);
 for(let i=0;i<30;i++)s.step();
 assert.ok(s.players.get('a').body.translation().z<0);assert.equal(s.players.get('a').strokes,1);s.dispose();
});
test('invalid forces, unknown players and shots before start are rejected',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');
 assert.equal(s.shoot('a',0,1),false);s.start();
 for(const args of [['x',0,1],['a',NaN,1],['a',0,Infinity],['a',0,-1],['a',0,2]])assert.equal(s.shoot(...args),false);
 assert.equal(s.players.get('a').strokes,0);s.dispose();
});
test('cup captures only a slow ball and completes the hole once',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.start();const p=s.players.get('a');p.strokes=2;
 p.body.setTranslation({x:s.course.cup.x,y:0.2,z:s.course.cup.z},true);p.body.setLinvel({x:0,y:0,z:0},true);
 s.step();assert.equal(p.finished,true);assert.equal(p.scores[0],2);s.step();assert.equal(p.scores.length,1);s.dispose();
});
test('fall restores last safe shot origin with a penalty',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.start();const p=s.players.get('a');
 s.shoot('a',0,0.5);p.body.setTranslation({x:50,y:-8,z:50},true);s.step();
 assert.equal(p.strokes,2);assert.ok(Math.abs(p.body.translation().x)<1);assert.ok(p.body.translation().y>0);s.dispose();
});
test('wall reflection preserves finite state and stops eventually',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.start();s.shoot('a',Math.PI/2,1);
 let bounced=false;for(let i=0;i<1200;i++){s.step();const v=s.players.get('a').body.linvel();if(v.x<-.2)bounced=true;assert.ok(Number.isFinite(v.x));}
 assert.ok(bounced);assert.equal(s.players.get('a').moving,false);s.dispose();
});
test('host advances only after everyone finishes and clears strokes',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.addPlayer('b','Biel');s.start();
 assert.equal(s.nextHole(),false);s.players.get('a').finished=true;assert.equal(s.nextHole(),false);
 s.players.get('b').finished=true;assert.equal(s.nextHole(),true);assert.equal(s.hole,1);assert.equal(s.players.get('a').strokes,0);s.dispose();
});
test('late joins and duplicate players are blocked',()=>{
 const s=new GolfSession(0);assert.equal(s.addPlayer('a','Ana'),true);assert.equal(s.addPlayer('a','Other'),false);
 s.start();assert.equal(s.addPlayer('b','Biel'),false);s.dispose();
});
test('unfinished timed-out players receive 16 strokes so inactivity cannot win',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.start();s.time=180;s.step();const p=s.players.get('a');assert.equal(p.finished,true);assert.equal(p.scores[0],16);s.dispose();
});
test('a complete nine-hole round preserves all scores and reaches results',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.start();
 for(let hole=0;hole<9;hole++){const p=s.players.get('a');p.strokes=hole+1;p.body.setTranslation({x:s.course.cup.x,y:.2,z:s.course.cup.z},true);p.body.setLinvel({x:0,y:0,z:0},true);s.step();assert.equal(p.finished,true);assert.equal(p.scores[hole],hole+1);assert.equal(s.nextHole(),true);}
 assert.equal(s.phase,'results');assert.deepEqual(s.players.get('a').scores,[1,2,3,4,5,6,7,8,9]);s.dispose();
});
test('a real tee shot reaches and enters the first cup without teleporting',()=>{
 const s=new GolfSession(0);s.addPlayer('a','Ana');s.start();for(let i=0;i<90;i++)s.step();assert.equal(s.shoot('a',0,1),true);for(let i=0;i<1200&&!s.players.get('a').finished;i++)s.step();assert.equal(s.players.get('a').finished,true);assert.equal(s.players.get('a').scores[0],1);s.dispose();
});
