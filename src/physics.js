import RAPIER from '@dimforge/rapier3d-compat';
import {makeCourse,railsFor,rampVertices,RAMP_INDICES,COLORS,surfaceMesh,groundHeight} from './courses.js';
import {validateName,MAX_STROKES,HOLE_SECONDS} from './rules.js';
let ready;
export function initPhysics(){return ready??=(RAPIER.init());}
const radius=.22;
export class GolfSession{
 constructor(worldIndex=0){this.worldIndex=worldIndex;this.hole=0;this.players=new Map();this.phase='lobby';this.time=0;this.events=[];this.loadCourse();}
 loadCourse(){
  this.world?.free();this.world=new RAPIER.World({x:0,y:-9.81,z:0});this.world.timestep=1/60;this.world.integrationParameters.numSolverIterations=8;
  this.course=makeCourse(this.worldIndex,this.hole);this.movers=[];this.time=0;
  const box=(x,y,z,hx,hy,hz)=>this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setFriction(.6).setRestitution(.58));
  for(const t of this.course.tiles){
   const last=t===this.course.tiles.at(-1);
   if(last||t.profile!=='flat'){
    const data=surfaceMesh(t,last?this.course.cup:null);
    this.world.createCollider(RAPIER.ColliderDesc.trimesh(data.positions,data.indices).setFriction(.35).setRestitution(0).setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min));
    if(last){const c=this.course.cup;box(c.x,c.y-.65,c.z,.45,.1,.45);}
   }else{const floor=box(t.x,-.15,t.z,2,.15,2);floor.setFriction(.35);floor.setRestitution(0);floor.setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min);}
  }
  for(const r of railsFor(this.course))box(r.x,r.y+.24,r.z,r.w/2,.24,r.d/2).setRotation({x:Math.sin(r.tilt/2),y:0,z:0,w:Math.cos(r.tilt/2)});
  for(const o of this.course.obstacles){
   if(o.type==='post'||o.type==='bumpers'){
    const offsets=o.type==='post'?[[-.45,0]]:[[-.9,-.45],[.9,.45]];
    for(const [dx,dz]of offsets)this.world.createCollider(RAPIER.ColliderDesc.cylinder(.48,.34).setTranslation(o.x+dx,.48,o.z+dz).setRestitution(.85));
   }else if(o.type==='ramp')this.world.createCollider(RAPIER.ColliderDesc.trimesh(rampVertices(o.x,o.z),RAMP_INDICES).setFriction(.3));
   else if(o.type==='spinner'||o.type==='gate'){
    const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(o.x,.3,o.z));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(o.type==='spinner'?1.4:.72,.25,.13).setRestitution(.75),body);
    this.movers.push({body,o});
   }
  }
  for(const p of this.players.values()){p.strokes=0;p.finished=false;p.moving=false;p.rest=0;p.lastShot=-100;p.body=this.makeBall(p);}
  this.arrangeTee();
 }
 makeBall(p){const pos=this.course.spawn;const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,pos.z).setCcdEnabled(true).setLinearDamping(.1).setAngularDamping(2).setCanSleep(true));
  this.world.createCollider(RAPIER.ColliderDesc.ball(radius).setRestitution(.72).setFriction(.35).setDensity(1).setCollisionGroups(0x00020003),body);return body;
 }
 arrangeTee(){const ps=[...this.players.values()];ps.forEach((p,i)=>{const pos=ps.length===1?{...this.course.spawn}:{x:(i%4-1.5)*.78,y:.235,z:1.15-Math.floor(i/4)*.8};p.lastSafe={...pos};p.body.setTranslation(pos,true);p.body.setLinvel({x:0,y:0,z:0},true);p.body.setAngvel({x:0,y:0,z:0},true);});}
 addPlayer(id,name){const valid=validateName(name);if(!valid.ok||this.phase!=='lobby'||this.players.has(id)||this.players.size>=8)return false;const p={id,name:valid.name,color:COLORS[this.players.size],scores:[],strokes:0,finished:false,moving:false,rest:0,lastSafe:{...this.course.spawn},lastShot:-100};p.body=this.makeBall(p);this.players.set(id,p);this.arrangeTee();return true;}
 removePlayer(id){const p=this.players.get(id);if(p){this.world.removeRigidBody(p.body);this.players.delete(id);if(this.phase==='lobby')this.arrangeTee();}}
 start(){if(this.phase!=='lobby'||this.players.size===0)return false;this.phase='playing';return true;}
 shoot(id,angle,power){
  const p=this.players.get(id);if(this.phase!=='playing'||!p||p.finished||p.moving||!Number.isFinite(angle)||!Number.isFinite(power)||power<.015||power>1||this.time-p.lastShot<.4)return false;
  const v=p.body.linvel();if(Math.hypot(v.x,v.z)>.14)return false;
  p.lastSafe={...p.body.translation()};p.lastShot=this.time;p.strokes++;p.moving=true;p.rest=0;p.boosted=false;
  p.body.setLinvel({x:Math.sin(angle)*(1+power*15),y:0,z:-Math.cos(angle)*(1+power*15)},true);p.body.setAngvel({x:-Math.cos(angle)*power*30,y:0,z:-Math.sin(angle)*power*30},true);return true;
 }
 reset(id){const p=this.players.get(id);if(!p||p.finished||this.phase!=='playing')return false;p.strokes++;this.respawn(p);return true;}
 finishHole(id){const p=this.players.get(id);if(this.phase!=='playing'||!p||p.finished)return false;p.finished=true;p.moving=false;p.scores[this.hole]=MAX_STROKES;p.body.setEnabled(false);this.events.push({type:'pass',id});return true;}
 respawn(p){let pos={...p.lastSafe};if([...this.players.values()].some(q=>q!==p&&!q.finished&&Math.hypot(q.body.translation().x-pos.x,q.body.translation().z-pos.z)<.48))pos={...this.course.spawn,x:-1.17+[...this.players.keys()].indexOf(p.id)%4*.78,z:1.15-Math.floor([...this.players.keys()].indexOf(p.id)/4)*.8};p.body.setTranslation({...pos,y:groundHeight(this.course,pos.x,pos.z)+.24},true);p.body.setLinvel({x:0,y:0,z:0},true);p.body.setAngvel({x:0,y:0,z:0},true);p.moving=false;p.rest=0;}
 step(){
  if(this.phase!=='playing')return;
  this.time+=1/60;
  for(const {body,o}of this.movers){const a=this.time*o.speed+o.phase;if(o.type==='spinner')body.setNextKinematicRotation({x:0,y:Math.sin(a/2),z:0,w:Math.cos(a/2)});else body.setNextKinematicTranslation({x:o.x+Math.sin(a)*1.1,y:.3,z:o.z});}
  this.world.step();
  for(const p of this.players.values()){
   if(p.finished)continue;let pos=p.body.translation(),v=p.body.linvel();let speed=Math.hypot(v.x,v.z);
   if(pos.y<-2.8||Math.abs(pos.x)>150||Math.abs(pos.z)>150){p.strokes++;this.respawn(p);this.events.push({type:'fall',id:p.id});continue;}
   const cup=this.course.cup;
   if(Math.hypot(pos.x-cup.x,pos.z-cup.z)<.39&&pos.y<cup.y+.36&&speed<3.2){
    p.finished=true;p.moving=false;p.scores[this.hole]=Math.max(1,p.strokes);p.body.setLinvel({x:0,y:0,z:0},true);p.body.setTranslation({x:cup.x,y:cup.y-.4,z:cup.z},true);p.body.setEnabled(false);this.events.push({type:'cup',id:p.id,strokes:p.strokes});continue;
   }
   const surface=this.course.obstacles.find(o=>(o.type==='sand'||o.type==='boost')&&Math.abs(pos.x-o.x)<1.6&&Math.abs(pos.z-o.z)<.65);
   if(pos.y<groundHeight(this.course,pos.x,pos.z)+.32){
    let friction=surface?.type==='sand'?.42:this.course.theme.friction;
    const decel=friction*9.81/60;const factor=speed>0?Math.max(0,(speed-decel)/speed):0;
    p.body.setLinvel({x:v.x*factor,y:v.y,z:v.z*factor},false);
    if(surface?.type==='boost'&&!p.boosted&&speed>.3){p.body.setLinvel({x:v.x*1.45,y:.8,z:v.z*1.45},true);p.boosted=true;}
   }
   if(speed<.12&&Math.abs(v.y)<.12){p.rest++;if(p.rest>12){p.body.setLinvel({x:0,y:0,z:0},false);p.body.setAngvel({x:0,y:0,z:0},false);p.moving=false;if(p.strokes>=MAX_STROKES){p.finished=true;p.scores[this.hole]=MAX_STROKES;p.body.setEnabled(false);this.events.push({type:'limit',id:p.id});}}}else {p.rest=0;p.moving=true;}
  }
  if(this.time>HOLE_SECONDS){for(const p of this.players.values()){if(!p.finished){p.finished=true;p.moving=false;p.scores[this.hole]=MAX_STROKES;p.body.setEnabled(false);this.events.push({type:'timeout',id:p.id});}}}
 }
 nextHole(){if(this.phase!=='playing'||![...this.players.values()].every(p=>p.finished))return false;if(this.hole>=8){this.phase='results';return true;}this.hole++;this.loadCourse();return true;}
 playMap(worldIndex=this.worldIndex){if(this.phase!=='results'||!Number.isInteger(worldIndex)||worldIndex<0||worldIndex>=16)return false;this.worldIndex=worldIndex;this.hole=0;for(const p of this.players.values())p.scores=[];this.phase='playing';this.loadCourse();return true;}
 snapshot(){return {worldIndex:this.worldIndex,hole:this.hole,phase:this.phase,time:this.time,players:[...this.players.values()].map(p=>({id:p.id,name:p.name,color:p.color,strokes:p.strokes,scores:p.scores,finished:p.finished,moving:p.moving,pos:p.body.translation(),rot:p.body.rotation()})),events:this.events.splice(0)};}
 dispose(){this.world.free();}
}
