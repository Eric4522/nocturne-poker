import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {WORLDS,makeCourse,railsFor,random,rampVertices,RAMP_INDICES,surfaceMesh,groundHeight,elevationHeight} from './courses.js';
import {powerFeedback} from './rules.js';
const V=THREE.Vector3;
export class GolfScene{
 constructor(canvas){
  this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.info.autoReset=false;this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,1200);this.camera.position.set(24,25,24);
  this.scene.add(new THREE.HemisphereLight('#fff8df','#647159',2));this.sun=new THREE.DirectionalLight('#fff1d3',3.4);this.sun.position.set(-15,40,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:150});this.sun.shadow.normalBias=.06;this.sun.shadow.bias=-.0002;this.scene.add(this.sun);this.scene.add(this.sun.target);
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#90b8bd')},bottom:{value:new THREE.Color('#f4e7ca')}},vertexShader:'varying vec3 vPos;void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vPos;uniform vec3 top;uniform vec3 bottom;void main(){float h=normalize(vPos).y;gl_FragColor=vec4(mix(bottom,top,smoothstep(-0.1,0.7,h)),1.0);}'});this.sky=new THREE.Mesh(new THREE.SphereGeometry(700,24,16),skyMat);this.scene.add(this.sky);
  this.waterMat=new THREE.ShaderMaterial({transparent:true,uniforms:{time:{value:0},color:{value:new THREE.Color('#6a9f9e')},fogColor:{value:new THREE.Color('#c9dfd9')},night:{value:0}},vertexShader:'uniform float time;varying vec3 vWorld;varying float wave;void main(){vec3 p=position;p.z+=sin(p.x*.25+time*.6)*.07+cos(p.y*.19+time*.5)*.06;wave=p.z;vec4 w=modelMatrix*vec4(p,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'uniform vec3 color;uniform vec3 fogColor;uniform float time;uniform float night;varying vec3 vWorld;varying float wave;void main(){float ripple=sin(vWorld.x*.65+vWorld.z*.7+time)*sin(vWorld.z*.31-time*.4);float sparkle=pow(max(0.0,ripple),12.0);vec3 c=color+wave*.14+sparkle*.065;float dist=length(vWorld.xz);c=mix(c,fogColor,smoothstep(65.0,145.0,dist));gl_FragColor=vec4(c,1.0);}'});
  this.water=new THREE.Mesh(new THREE.PlaneGeometry(800,800,40,40),this.waterMat);this.water.rotation.x=-Math.PI/2;this.water.position.y=-2.4;this.scene.add(this.water);
  this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.13,.4,1.1);this.composer.addPass(this.bloom);
  this.players=new Map();this.trails=new Map();this.target=new V();this.follow=new V();this.cameraAngle=.65;this.pitch=.72;this.distance=14;this.menu=true;this.overview=false;this.time=0;this.movers=[];this.decorAnim=[];this.quality='high';this.loadCourse(makeCourse(0,2));this.resize();window.addEventListener('resize',()=>this.resize());
  this.aimLine=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({color:'#ffb65c',transparent:true,opacity:.95,depthTest:false}));this.aimLine.renderOrder=10;this.aimLine.visible=false;this.scene.add(this.aimLine);
  this.aimHead=new THREE.Mesh(new THREE.ConeGeometry(.18,.42,3),new THREE.MeshBasicMaterial({color:'#fffadf',depthTest:false}));this.aimHead.visible=false;this.scene.add(this.aimHead);
 }
 material(color,roughness=.8,extra={}){return new THREE.MeshStandardMaterial({color,roughness,...extra});}
 mesh(geo,mat,x,y,z,parent=this.group){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(w,h,d,mat,x,y,z){return this.mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
 clear(){if(this.group){this.scene.remove(this.group);const geos=new Set(),mats=new Set(),textures=new Set();this.group.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if(m.map)textures.add(m.map);}}});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}for(const p of this.players.values()){this.scene.remove(p);p.geometry.dispose();p.material.dispose();}this.players.clear();for(const t of this.trails.values()){this.scene.remove(t.line);t.line.geometry.dispose();t.line.material.dispose();}this.trails.clear();}
 turfTexture(theme){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=theme.grass;ctx.fillRect(0,0,256,256);ctx.fillStyle=theme.grass2;for(let i=0;i<8;i+=2)ctx.fillRect(0,i*32,256,32);const rng=random(731);for(let i=0;i<2200;i++){ctx.fillStyle=rng()>.5?'rgba(255,255,210,.06)':'rgba(0,30,0,.07)';ctx.fillRect(rng()*256,rng()*256,1,1);}ctx.strokeStyle=theme.accent+'66';ctx.lineWidth=2;
 if(['city','space','ruins','haunted','machine'].includes(theme.decor)){
  ctx.fillStyle=theme.grass;ctx.fillRect(0,0,256,256);ctx.strokeStyle=theme.edge;ctx.lineWidth=3;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){ctx.strokeRect(col*64+2,row*64+2,60,60);ctx.fillStyle=theme.grass2;ctx.fillRect(col*64+7,row*64+7,49,49);if(theme.decor==='machine'){ctx.fillStyle=theme.accent;for(const dx of[8,56])for(const dy of[8,56]){ctx.beginPath();ctx.arc(col*64+dx,row*64+dy,2,0,6.28);ctx.fill();}}}
  if(theme.decor==='city'||theme.decor==='space'){ctx.strokeStyle=theme.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(19,256);ctx.moveTo(237,0);ctx.lineTo(237,256);ctx.stroke();}
 }else if(theme.decor==='candy'||theme.decor==='mushroom'){
  ctx.strokeStyle=theme.accent+'77';ctx.lineWidth=8;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(i*64,128,40+i*3,0,6.28);ctx.stroke();}
 }else if(theme.id==='ice'||theme.id==='dunes'){
  ctx.strokeStyle=theme.accent+'55';ctx.lineWidth=2;for(let i=0;i<10;i++){ctx.beginPath();ctx.moveTo(0,i*28);ctx.bezierCurveTo(64,i*28-16,192,i*28+16,256,i*28);ctx.stroke();}
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
 loadCourse(course){
  this.clear();this.aimKey='';this.course=course;this.theme=course.theme;const theme=course.theme;this.group=new THREE.Group();this.scene.add(this.group);this.movers=[];this.decorAnim=[];const rng=random(course.worldIndex*551+course.hole*73+131);const night=course.worldIndex===6||theme.night;
  this.scene.fog=new THREE.Fog(theme.fog,140,500);this.sky.material.uniforms.top.value.set(theme.sky).multiplyScalar(night?.6:.85);this.sky.material.uniforms.bottom.value.set(theme.sky);this.waterMat.uniforms.color.value.set(theme.water);this.waterMat.uniforms.fogColor.value.set(theme.fog);this.sun.intensity=night?1.2:3.4;this.renderer.toneMappingExposure=night?1.25:1.15;this.bloom.strength=night?.35:.09;
  const grass=this.material('#ffffff',.93,{map:this.turfTexture(theme)}),wood=this.material(theme.edge,theme.night?.45:.8),trim=this.material(theme.accent,.65,theme.night?{emissive:theme.accent,emissiveIntensity:.45}:{}),stone=this.material(theme.rock),dark=this.material('#273e35'),sand=this.material('#d7c28f');
  let minX=0,maxX=0,minZ=0;for(const t of course.tiles){minX=Math.min(minX,t.x);maxX=Math.max(maxX,t.x);minZ=Math.min(minZ,t.z);}this.bounds={minX:minX-3,maxX:maxX+3,minZ:minZ-3,maxZ:3};this.center=new V((minX+maxX)/2,0,minZ/2);this.length=Math.max(20,-minZ+8,maxX-minX+8);
  // Each lane rests on its own sculpted rock island; water stays visible between the arches.
  for(const [i,t]of course.tiles.entries()){
   const base=this.mesh(new THREE.CylinderGeometry(2.95,2.4,1.5,8),stone,t.x,-1.18,t.z);base.rotation.y=Math.PI/8;
   this.box(4.15,.22,4.15,wood,t.x,Math.min(elevationHeight(t,t.z-2),elevationHeight(t,t.z+2))-.15-(t.depth||0),t.z);
   if(t.profile==='bridge'){for(const dx of[-1.65,1.65])this.mesh(new THREE.CylinderGeometry(.14,.22,1.3+elevationHeight(t,t.z),8),wood,t.x+dx,(elevationHeight(t,t.z)-1.3)/2,t.z);}
   const data=surfaceMesh(t,i===course.tiles.length-1?course.cup:null),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geo.setAttribute('uv',new THREE.BufferAttribute(data.uvs,2));geo.setIndex(new THREE.BufferAttribute(data.indices,1));geo.computeVertexNormals();const mesh=this.mesh(geo,grass,0,.006,0);mesh.castShadow=false;
   if(t.profile==='bowl'){for(const side of[-1,1]){this.box(.1,t.depth,4,wood,t.x+side*2,-t.depth/2,t.z);this.box(4,t.depth,.1,wood,t.x,-t.depth/2,t.z+side*2);}}
   if(i===0){const tee=this.mesh(new THREE.RingGeometry(.42,.46,48),trim,0,.013,1.15);tee.rotation.x=-Math.PI/2;tee.castShadow=false;
    this.label('TEE',t.x-1.15,.05,t.z+1.15,theme.accent,.7);}
  }
  for(const r of railsFor(course)){this.box(r.w,.48,r.d,wood,r.x,r.y+.24,r.z).rotation.x=r.tilt;this.box(r.w+.012,.035,r.d+.012,trim,r.x,r.y+.495,r.z).rotation.x=r.tilt;}
  const cup=course.cup,lip=cup.y+(course.cupStyle==='bowl'?.055:.017);this.mesh(new THREE.CylinderGeometry(.38,.38,.55,40,1,true),dark,cup.x,lip-.26,cup.z);const ring=this.mesh(new THREE.RingGeometry(.38,.43,64),trim,cup.x,lip,cup.z);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
  this.mesh(new THREE.CylinderGeometry(.027,.035,2.1,10),this.material('#f4eee0',.45),cup.x,cup.y+1.05,cup.z);
  const flagGeo=new THREE.BufferGeometry();flagGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.85,-.12,0,0,-.5,0],3));flagGeo.computeVertexNormals();this.flag=this.mesh(flagGeo,new THREE.MeshStandardMaterial({color:theme.accent,side:THREE.DoubleSide,roughness:.65}),cup.x,cup.y+2,cup.z);this.decorAnim.push({mesh:this.flag,type:'flag'});
  this.label(String(course.hole+1).padStart(2,'0'),cup.x,cup.y+2.22,cup.z,theme.accent,.55);
  const teeSign=this.box(1.1,.6,.09,wood,-1.1,.9,2.1);this.box(.09,1,.1,wood,-1.1,.45,2.1);this.label(`PAR ${course.par}`,-1.1,.92,2.17,'#fff6dd',.8);
  if(course.distance>25){
   for(const [n,f]of [.2,.48,.75].entries()){
    const t=course.routeTiles[Math.floor(course.routeTiles.length*f)],y=groundHeight(course,t.x,t.z);
    // Gates frame the different stages of a long course; their posts sit outside the rails.
    for(const dx of[-2.3,2.3])this.mesh(new THREE.CylinderGeometry(.12,.2,2.6,10),wood,t.x+dx,y+1.25,t.z);
    this.box(5.1,.25,.32,wood,t.x,y+2.6,t.z);this.box(5.25,.06,.36,trim,t.x,y+2.78,t.z);
    this.label(['ENTRADA','TRAVESÍA','RECTA FINAL'][n],t.x,y+2.59,t.z+.18,theme.accent,1.6);
    if(theme.decor==='space'||theme.decor==='city'){const hoop=this.mesh(new THREE.TorusGeometry(2,.06,8,36,Math.PI),trim,t.x,y+.9,t.z);hoop.castShadow=false;}
   }
  }
  for(const o of course.obstacles){
   if(o.type==='post'||o.type==='bumpers')for(const [dx,dz]of o.type==='post'?[[-.45,0]]:[[-.9,-.45],[.9,.45]]){
    this.mesh(new THREE.CylinderGeometry(.34,.36,.8,20),wood,o.x+dx,.4,o.z+dz);this.mesh(new THREE.CylinderGeometry(.37,.37,.09,24),trim,o.x+dx,.68,o.z+dz);this.mesh(new THREE.CylinderGeometry(.37,.37,.09,24),trim,o.x+dx,.19,o.z+dz);
   }else if(o.type==='spinner'||o.type==='gate'){
    const mover=new THREE.Group();mover.position.set(o.x,.3,o.z);this.group.add(mover);const beam=new THREE.Mesh(new THREE.BoxGeometry(o.type==='spinner'?2.8:1.44,.5,.26),wood);beam.castShadow=true;beam.receiveShadow=true;mover.add(beam);
    const strip=new THREE.Mesh(new THREE.BoxGeometry(o.type==='spinner'?2.82:1.46,.045,.28),trim);strip.position.y=.27;mover.add(strip);
    if(o.type==='spinner')this.mesh(new THREE.CylinderGeometry(.2,.25,.6,12),stone,o.x,.3,o.z);this.movers.push({mesh:mover,o});
   }else if(o.type==='ramp'){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(rampVertices(o.x,o.z),3));geo.setIndex(new THREE.BufferAttribute(RAMP_INDICES,1));geo.computeVertexNormals();this.mesh(geo,new THREE.MeshStandardMaterial({color:theme.grass2,roughness:.8,side:THREE.DoubleSide}),0,0,0);
    for(const dx of[-1.21,1.21]){const front=this.box(.05,.06,1.67,trim,o.x+dx,.35,o.z-.75);front.rotation.x=-Math.atan(.7/1.5);const back=this.box(.05,.06,1.67,trim,o.x+dx,.35,o.z+.75);back.rotation.x=Math.atan(.7/1.5);}
   }else{this.box(3.2,.016,1.3,o.type==='sand'?sand:trim,o.x,.015,o.z);if(o.type==='boost')this.label('› › ›',o.x,.045,o.z,'#364937',2.7,true);}
  }
  // Set dressing uses the same deterministic seed as the course; nothing blocks a playable lane.
  const used=new Set(course.tiles.map(t=>`${t.x},${t.z}`));
  for(let i=0;i<42;i++){
   const x=minX-12+rng()*(maxX-minX+24),z=minZ-8+rng()*(-minZ+20);
   if(course.tiles.some(t=>Math.abs(x-t.x)<3.1&&Math.abs(z-t.z)<3.1))continue;
   const s=.7+rng()*1.1;const island=this.mesh(new THREE.CylinderGeometry(1.5*s,1.1*s,1.3,7),stone,x,-1.7,z);island.rotation.y=rng()*6;
   const top=this.mesh(new THREE.CylinderGeometry(1.48*s,1.48*s,.16,12),this.material(theme.grass),x,-.98,z);
   if(rng()>.22)this.tree(x,-.92,z,s,theme,wood);else {const rock=this.mesh(new THREE.IcosahedronGeometry(.65,1),stone,x,-.62,z);rock.scale.set(1.2*s,.6*s,s);}
  }
  // Mountains and cloud clusters make a distant horizon without downloaded imagery.
  const cloudMat=this.material(night?'#59697b':'#fff5dc',1);
  for(let i=0;i<18;i++){const angle=i/18*Math.PI*2;const distance=70+rng()*30;const x=this.center.x+Math.sin(angle)*distance,z=this.center.z+Math.cos(angle)*distance;const mountain=this.mesh(new THREE.ConeGeometry(9+rng()*10,12+rng()*20,6),stone,x,2,z);mountain.rotation.y=rng()*3;
   if(i%2===0){const g=new THREE.Group();g.position.set(x,20+rng()*14,z);this.group.add(g);for(let j=0;j<4;j++){const m=this.mesh(new THREE.SphereGeometry(2,12,8),cloudMat,j*2,Math.sin(j)*.7,0,g);m.scale.set(2.5,1,1.5);m.castShadow=false;}this.decorAnim.push({mesh:g,type:'cloud',base:x,phase:i});}}
  if(night){const stars=new THREE.BufferGeometry();const verts=[];for(let i=0;i<300;i++){const a=rng()*6.28,y=20+rng()*90,r=70+rng()*50;verts.push(Math.sin(a)*r,y,Math.cos(a)*r);}stars.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));this.group.add(new THREE.Points(stars,new THREE.PointsMaterial({color:'#fff4d3',size:.2})));}
  this.landmark(maxX+7,minZ*.56,theme,wood,stone,trim);
  const particles=[];for(let i=0;i<55;i++)particles.push(minX-9+rng()*(maxX-minX+18),1+rng()*7,minZ-5+rng()*(-minZ+12));
  const dust=new THREE.BufferGeometry();dust.setAttribute('position',new THREE.Float32BufferAttribute(particles,3));this.particles=new THREE.Points(dust,new THREE.PointsMaterial({color:theme.accent,size:course.worldIndex===2?.1:.04,transparent:true,opacity:.5,depthWrite:false}));this.group.add(this.particles);
  this.sun.target.position.copy(this.center);this.sun.position.set(this.center.x-15,40,this.center.z+12);this.target.copy(this.center);this.follow.copy(this.center);this.time=0;this.sky.position.copy(this.center);this.batchScenery();
 }
 label(text,x,y,z,color,size=.7,flat=false){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.font='bold 62px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,256,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size*.25),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false}));m.position.set(x,y,z);if(flat)m.rotation.x=-Math.PI/2;this.group.add(m);return m;}
 tree(x,y,z,s,theme,wood){
  const tree=new THREE.Group();tree.position.set(x,y,z);tree.scale.setScalar(s);this.group.add(tree);const leaves=this.material(theme.tree,.9);
  this.mesh(new THREE.CylinderGeometry(.1,.18,1.8,7),wood,0,.9,0,tree);
  if(theme.decor==='pine'){for(let i=0;i<3;i++)this.mesh(new THREE.ConeGeometry(1.08-i*.21,1.5,8),leaves,0,1.6+i*.7,0,tree);}
  else if(theme.decor==='cactus'){const mat=this.material(theme.tree);this.mesh(new THREE.CapsuleGeometry(.3,1.7,4,8),mat,0,1.2,0,tree);for(const side of[-1,1]){const arm=this.mesh(new THREE.CylinderGeometry(.18,.18,.7,8),mat,side*.45,1.1+side*.2,0,tree);arm.rotation.z=Math.PI/2;this.mesh(new THREE.CapsuleGeometry(.18,.45,4,8),mat,side*.7,1.4+side*.2,0,tree);}}
  else if(theme.decor==='palm'){for(let i=0;i<6;i++){const leaf=this.mesh(new THREE.SphereGeometry(.5,10,6),leaves,Math.sin(i)*.6,2,Math.cos(i)*.6,tree);leaf.scale.set(.5,.18,2.5);leaf.rotation.y=i;leaf.rotation.x=.25;}}
  else if(theme.decor==='rock'){const m=this.mesh(new THREE.IcosahedronGeometry(1.1,1),leaves,0,.75,0,tree);m.scale.y=1.5;}
  else if(theme.decor==='mushroom'){this.mesh(new THREE.CylinderGeometry(.22,.32,1.8,12),this.material('#f2dcbe'),0,.8,0,tree);this.mesh(new THREE.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI/2),leaves,0,1.8,0,tree);for(let i=0;i<7;i++){const a=i*2.4;this.mesh(new THREE.SphereGeometry(.13,8,6),this.material(theme.accent),Math.sin(a)*.65,2.25,Math.cos(a)*.65,tree);}}
  else if(theme.decor==='city'){const height=2+Math.abs(Math.sin(x+z))*2;this.mesh(new THREE.BoxGeometry(1.25,height,1),this.material(theme.edge),0,height/2,0,tree);for(let i=0;i<4;i++)this.mesh(new THREE.BoxGeometry(.9,.12,1.025),this.material(theme.accent,.4,{emissive:theme.accent,emissiveIntensity:1.3}),0,.6+i*.65,0,tree);}
  else if(theme.decor==='space'){const antenna=this.mesh(new THREE.TorusGeometry(.65,.08,8,20),leaves,0,2,0,tree);antenna.rotation.x=.6;this.mesh(new THREE.SphereGeometry(.22,12,8),this.material(theme.accent,.2,{emissive:theme.accent,emissiveIntensity:.8}),0,2,0,tree);}
  else if(theme.decor==='ruins'){this.mesh(new THREE.CylinderGeometry(.45,.55,2.2,8),this.material(theme.edge),0,1.1,0,tree);this.mesh(new THREE.BoxGeometry(1.25,.25,1.25),leaves,0,2.3,0,tree);}
  else if(theme.decor==='machine'){this.mesh(new THREE.CylinderGeometry(.65,.8,1.6,12),this.material(theme.edge,.4,{metalness:.4}),0,.8,0,tree);this.mesh(new THREE.TorusGeometry(.8,.14,8,20),leaves,0,1.3,.65,tree);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const tooth=this.mesh(new THREE.BoxGeometry(.25,.32,.25),leaves,Math.sin(a)*.8,1.3+Math.cos(a)*.8,.65,tree);tooth.rotation.z=-a;}}
  else if(theme.decor==='haunted'){for(const side of[-1,1]){const branch=this.mesh(new THREE.CylinderGeometry(.07,.13,1.4,7),wood,side*.4,1.7,0,tree);branch.rotation.z=-side*.65;}this.mesh(new THREE.SphereGeometry(.42,12,10),this.material(theme.accent,.7,{emissive:theme.accent,emissiveIntensity:.5}),0,2.5,0,tree);}
  else{for(let i=0;i<4;i++){const a=i*2.4;this.mesh(new THREE.IcosahedronGeometry(.8,i%2),leaves,Math.sin(a)*.45,2+Math.cos(a)*.2,Math.cos(a)*.45,tree);}if(theme.decor==='candy')this.mesh(new THREE.SphereGeometry(.8,16,12),this.material(theme.accent),0,2.4,0,tree);}
  // Tree geometry is static so it can be drawn together with the surrounding scenery.
 }
 setQuality(quality){this.quality=quality;this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.5:quality==='medium'?1.1:1));this.sun.shadow.mapSize.set(quality==='high'?1536:1024,quality==='high'?1536:1024);this.renderer.shadowMap.enabled=quality!=='low';this.bloom.enabled=quality==='high';this.resize();}
 batchScenery(){
  this.group.updateMatrixWorld(true);const moving=new Set([...this.decorAnim.filter(d=>d.type!=='cloud').map(d=>d.mesh),...this.movers.map(m=>m.mesh)]),batches=new Map(),originals=[];
  this.group.traverse(mesh=>{
   if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.material.transparent||mesh.material.type!=='MeshStandardMaterial')return;
   let parent=mesh;while(parent&&parent!==this.group){if(moving.has(parent))return;parent=parent.parent;}
   const m=mesh.material,key=[m.color.getHex(),m.roughness,m.metalness,m.emissive.getHex(),m.emissiveIntensity,m.side,m.map?.uuid||'',mesh.castShadow,mesh.receiveShadow].join(':');
   let g=mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);if(g.index)g=g.toNonIndexed();if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);
   if(!batches.has(key))batches.set(key,{material:m,geos:[],shadow:mesh.castShadow,receive:mesh.receiveShadow});batches.get(key).geos.push(g);originals.push(mesh);
  });
  for(const b of batches.values()){const geometry=mergeGeometries(b.geos);if(!geometry)continue;const mesh=new THREE.Mesh(geometry,b.material);mesh.castShadow=b.shadow;mesh.receiveShadow=b.receive;this.group.add(mesh);b.geos.forEach(g=>g.dispose());}
  originals.forEach(m=>{m.parent.remove(m);m.geometry.dispose();});this.batchCount=batches.size;
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h);this.composer.setSize(w,h);this.camera.aspect=w/h;if(this.menu&&w>850)this.camera.setViewOffset(w,h,-w*.13,0,w,h);else this.camera.clearViewOffset();this.camera.updateProjectionMatrix();}
 setMode(menu){this.menu=menu;this.overview=false;this.resize();}
 landmark(x,z,theme,wood,stone,trim){
  const g=new THREE.Group();g.position.set(x,-.5,z);this.group.add(g);this.mesh(new THREE.CylinderGeometry(3.3,2.7,1.4,12),stone,0,-.6,0,g);this.mesh(new THREE.CylinderGeometry(3.25,3.25,.13,24),this.material(theme.grass),0,.13,0,g);
  const index=this.course.worldIndex;
  if(index===0){
   this.mesh(new THREE.CylinderGeometry(1,1.35,3.8,12),this.material('#e9d4ad'),0,2,0,g);this.mesh(new THREE.ConeGeometry(1.6,1.5,12),wood,0,4.6,0,g);
   this.mesh(new THREE.BoxGeometry(.55,1.1,.12),this.material('#4c6250'),0,.68,1.29,g);
   const axle=new THREE.Group();axle.position.set(0,3.5,1.4);g.add(axle);const bladeMat=this.material('#eddfb4');
   for(let i=0;i<4;i++){const arm=new THREE.Mesh(new THREE.BoxGeometry(.16,2.6,.1),wood);arm.position.set(Math.sin(i*Math.PI/2)*1.3,Math.cos(i*Math.PI/2)*1.3,0);arm.rotation.z=-i*Math.PI/2;axle.add(arm);const sail=new THREE.Mesh(new THREE.BoxGeometry(.62,1.55,.08),bladeMat);sail.position.set(Math.sin(i*Math.PI/2)*1.65,Math.cos(i*Math.PI/2)*1.65,.07);sail.rotation.z=-i*Math.PI/2;axle.add(sail);}
   this.decorAnim.push({mesh:axle,type:'windmill'});
  }else if(index===1){
   const white=this.material('#f1e8d1'),red=this.material('#ae6755');this.mesh(new THREE.CylinderGeometry(.7,1,5,20),white,0,2.6,0,g);for(let i=0;i<3;i++)this.mesh(new THREE.CylinderGeometry(.8-i*.08,.85-i*.08,.5,20),red,0,1.3+i*1.3,0,g);this.mesh(new THREE.CylinderGeometry(1.1,1.1,.18,20),wood,0,5.1,0,g);this.mesh(new THREE.CylinderGeometry(.65,.65,.85,16),this.material('#adc7b3',.1,{emissive:'#e2dca9',emissiveIntensity:.6}),0,5.6,0,g);this.mesh(new THREE.ConeGeometry(1.05,.9,16),red,0,6.3,0,g);
  }else if(index===2){
   const red=this.material('#a55857');for(const side of[-1,1])this.mesh(new THREE.CylinderGeometry(.16,.22,3.4,12),red,side*1.4,1.8,0,g);this.mesh(new THREE.BoxGeometry(3.9,.25,.55),red,0,3.45,0,g);this.mesh(new THREE.BoxGeometry(3.3,.2,.24),red,0,2.9,0,g);const top=this.mesh(new THREE.BoxGeometry(4.5,.24,.65),this.material('#4c4d4a'),0,3.77,0,g);top.rotation.z=.025;this.mesh(new THREE.BoxGeometry(.35,.6,.1),trim,0,3.05,.2,g);
  }else if(index===3){
   const pyramid=this.mesh(new THREE.ConeGeometry(3,4,4),this.material('#d9a25d'),0,2.13,0,g);pyramid.rotation.y=Math.PI/4;for(let i=0;i<4;i++)this.mesh(new THREE.CylinderGeometry(2.8-i*.5,2.8-i*.5,.1,4),trim,0,.5+i*.7,0,g).rotation.y=Math.PI/4;
  }else if(index===4){
   const crystal=this.material('#b0dfe9',.15,{metalness:.2,transparent:true,opacity:.88});for(let i=0;i<5;i++){const a=i*2.4;const m=this.mesh(new THREE.ConeGeometry(.6,2.5+i*.35,5),crystal,Math.sin(a),1.7,Math.cos(a),g);m.rotation.z=Math.sin(a)*.25;}
  }else if(index===5){
   for(let i=0;i<3;i++){const a=i*2.4;this.mesh(new THREE.CylinderGeometry(.13,.13,3+i*.5,12),this.material('#f7e6cd'),Math.sin(a)*1.4,1.8,Math.cos(a)*1.4,g);const ring=this.mesh(new THREE.TorusGeometry(.8,.25,12,36),i%2?wood:trim,Math.sin(a)*1.4,3.5+i*.5,Math.cos(a)*1.4,g);ring.rotation.z=a;}
  }else if(index===6){
   this.mesh(new THREE.CylinderGeometry(.06,.1,4,12),wood,0,2,0,g);const moon=this.mesh(new THREE.TorusGeometry(.85,.1,16,48,Math.PI*1.7),this.material('#d6e8b4',.3,{emissive:'#c1dc9d',emissiveIntensity:2}),0,4.4,0,g);moon.rotation.z=.5;
   for(const side of[-1,1]){this.mesh(new THREE.CylinderGeometry(.08,.12,1.8,10),wood,side*1.7,1,0,g);this.mesh(new THREE.SphereGeometry(.24,16,12),this.material('#ffe7a4',.2,{emissive:'#ffd391',emissiveIntensity:2}),side*1.7,2,0,g);const light=new THREE.PointLight('#f6d997',6,9);light.position.set(side*1.7,2.2,0);g.add(light);}
  }else if(index===7){
   this.mesh(new THREE.CylinderGeometry(1,3.1,4,12,1,true),stone,0,2,0,g);const lava=this.mesh(new THREE.CircleGeometry(1,36),this.material('#f98e3e',.5,{emissive:'#e66b2d',emissiveIntensity:1.4}),0,4.02,0,g);lava.rotation.x=-Math.PI/2;
   for(let i=0;i<4;i++){const smoke=this.mesh(new THREE.IcosahedronGeometry(.8+i*.3,1),this.material('#6b625d',1,{transparent:true,opacity:.3-i*.04}),Math.sin(i)*.4,5+i*.9,Math.cos(i)*.4,g);this.decorAnim.push({mesh:smoke,type:'smoke',phase:i});}
  }else if(index===8){
   for(const side of[-1,1])for(const depth of[-1,1]){this.mesh(new THREE.CylinderGeometry(.4,.48,3.8,12),wood,side*1.5,2,depth*1.2,g);this.mesh(new THREE.BoxGeometry(1,.3,1),stone,side*1.5,3.9,depth*1.2,g);}this.mesh(new THREE.BoxGeometry(4.4,.5,3.6),wood,0,4.2,0,g);const roof=this.mesh(new THREE.ConeGeometry(3,1.5,4),trim,0,5.1,0,g);roof.rotation.y=Math.PI/4;this.mesh(new THREE.IcosahedronGeometry(.65,1),this.material(theme.accent,.25,{emissive:theme.accent,emissiveIntensity:.5}),0,2.1,0,g);
  }else if(index===9){
   for(let i=0;i<4;i++){const h=3+i*.9;this.mesh(new THREE.BoxGeometry(1,h,1.3),stone,(i-1.5)*1.2,h/2,0,g);for(let j=0;j<5;j++)this.mesh(new THREE.BoxGeometry(1.03,.07,1.33),this.material(i%2?theme.tree:theme.accent,.3,{emissive:i%2?theme.tree:theme.accent,emissiveIntensity:1.5}),(i-1.5)*1.2,.5+j*.8,0,g);}const ring=this.mesh(new THREE.TorusGeometry(2,.07,12,64),trim,0,4,1,g);ring.rotation.y=.4;
  }else if(index===10){
   this.mesh(new THREE.CylinderGeometry(.28,.45,4,10),wood,0,2,0,g);for(let i=0;i<8;i++){const a=i*2.4;this.mesh(new THREE.IcosahedronGeometry(1.15,1),this.material(i%2?'#db9d48':'#bd673c'),Math.sin(a)*1.4,3.6+Math.cos(a)*.6,Math.cos(a)*1.4,g);}for(const side of[-1,1])this.mesh(new THREE.BoxGeometry(.9,.25,2),trim,side*1.5,.45,1.5,g);
  }else if(index===11){
   this.mesh(new THREE.BoxGeometry(3.5,3.3,2.6),wood,0,1.8,0,g);this.mesh(new THREE.ConeGeometry(2.8,2,4),stone,0,4.2,0,g).rotation.y=Math.PI/4;for(const side of[-1,1]){this.mesh(new THREE.CylinderGeometry(.7,.85,4.5,8),wood,side*2,2.4,0,g);this.mesh(new THREE.ConeGeometry(1.1,2,8),stone,side*2,5.6,0,g);this.mesh(new THREE.PlaneGeometry(.45,.9),this.material(theme.accent,.2,{emissive:theme.accent,emissiveIntensity:1}),side*2,3,.72,g);}this.mesh(new THREE.SphereGeometry(.55,16,12),this.material('#def4e6',.3,{transparent:true,opacity:.8}),0,4.6,2,g);
  }else if(index===12){
   const body=this.mesh(new THREE.CapsuleGeometry(.85,3,8,16),this.material('#e4e8ed',.3,{metalness:.4}),0,2.5,0,g);this.mesh(new THREE.ConeGeometry(.85,1.5,16),trim,0,5.2,0,g);for(const side of[-1,1]){this.mesh(new THREE.BoxGeometry(2.1,.1,1.6),this.material('#416aa4',.25,{metalness:.5}),side*2,2.8,0,g);this.mesh(new THREE.BoxGeometry(.8,1.4,.2),wood,side*.9,.8,0,g);}this.mesh(new THREE.TorusGeometry(.48,.08,12,32),this.material(theme.accent,.2,{emissive:theme.accent,emissiveIntensity:1}),0,3,.82,g);
  }else if(index===13){
   const hull=this.mesh(new THREE.SphereGeometry(2.8,20,12,0,Math.PI*2,0,Math.PI/2),wood,0,1,0,g);hull.rotation.z=Math.PI;hull.scale.set(1.1,.6,.55);this.mesh(new THREE.BoxGeometry(5.4,.2,2.5),wood,0,1.02,0,g);this.mesh(new THREE.CylinderGeometry(.08,.15,4.7,12),wood,0,3.4,0,g);this.mesh(new THREE.PlaneGeometry(2.9,2.6),this.material('#efdec0',.8,{side:THREE.DoubleSide}),0,3.8,0,g);this.mesh(new THREE.PlaneGeometry(.8,.5),stone,0,5.5,0,g);this.mesh(new THREE.TorusGeometry(.8,.12,10,32),trim,2,1.8,0,g).rotation.y=Math.PI/2;
  }else if(index===14){
   for(let i=0;i<3;i++){const a=i*2.4,x=Math.sin(a)*1.6,z=Math.cos(a)*1.6,h=2.5+i*.7;this.mesh(new THREE.CylinderGeometry(.35,.5,h,16),this.material('#e4d7ba'),x,h/2,z,g);this.mesh(new THREE.SphereGeometry(1.35,24,16,0,Math.PI*2,0,Math.PI/2),this.material(i%2?theme.accent:theme.tree,.5,{emissive:theme.tree,emissiveIntensity:.15}),x,h,z,g);for(let j=0;j<5;j++){const b=j*2.4;this.mesh(new THREE.SphereGeometry(.15,10,8),trim,x+Math.sin(b)*.8,h+.7,z+Math.cos(b)*.8,g);}}
  }else{
   this.mesh(new THREE.CylinderGeometry(1.15,1.45,5,12),stone,0,2.65,0,g);this.mesh(new THREE.ConeGeometry(1.65,1,12),wood,0,5.6,0,g);const clock=this.mesh(new THREE.CylinderGeometry(1.05,1.05,.16,32),trim,0,3.7,1.1,g);clock.rotation.x=Math.PI/2;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;this.mesh(new THREE.SphereGeometry(.07,8,6),stone,Math.sin(a)*.8,3.7+Math.cos(a)*.8,1.2,g);}const hand=this.mesh(new THREE.BoxGeometry(.06,.8,.04),stone,0,4.05,1.23,g);this.mesh(new THREE.BoxGeometry(.55,.06,.04),stone,.25,3.7,1.23,g);for(const side of[-1,1])this.mesh(new THREE.TorusGeometry(1.2,.2,10,32),wood,side*2,1.5,0,g);
  }
 }
 ballMaterial(color){
  if(!this.dimpleTexture){const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#a0a0a0';ctx.fillRect(0,0,512,256);for(let row=0;row<16;row++)for(let col=0;col<32;col++){const x=col*16+(row%2)*8,y=row*16;const g=ctx.createRadialGradient(x-1,y-1,0,x,y,5.7);g.addColorStop(0,'#7f7f7f');g.addColorStop(.6,'#939393');g.addColorStop(.85,'#b3b3b3');g.addColorStop(1,'#a0a0a0');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,5.7,0,Math.PI*2);ctx.fill();}this.dimpleTexture=new THREE.CanvasTexture(c);this.dimpleTexture.wrapS=THREE.RepeatWrapping;}
  return new THREE.MeshStandardMaterial({color,roughness:.32,metalness:.03,bumpMap:this.dimpleTexture,bumpScale:.012});
 }
 updatePlayers(state,myId,dt){
  const ids=new Set(state.players.map(p=>p.id));for(const [id,m]of this.players){if(!ids.has(id)){this.scene.remove(m);m.geometry.dispose();m.material.dispose();this.players.delete(id);}}
  for(const p of state.players){let m=this.players.get(p.id);if(!m){m=new THREE.Mesh(new THREE.SphereGeometry(.22,32,24),this.ballMaterial(p.color));m.castShadow=true;m.position.copy(p.pos);this.scene.add(m);this.players.set(p.id,m);const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:p.color,transparent:true,opacity:.4}));this.scene.add(line);this.trails.set(p.id,{line,points:[]});}
   const distance=m.position.distanceTo(new V(p.pos.x,p.pos.y,p.pos.z));if(distance>4||dt>.1)m.position.copy(p.pos);else m.position.lerp(p.pos,Math.min(1,dt*22));m.quaternion.copy(p.rot);m.visible=!p.finished;
   const trail=this.trails.get(p.id);if(trail){if(p.moving&&!p.finished){trail.points.push(m.position.clone());if(trail.points.length>18)trail.points.shift();}else if(trail.points.length)trail.points.shift();trail.line.geometry.dispose();trail.line.geometry=new THREE.BufferGeometry().setFromPoints(trail.points);}
   if(p.id===myId&&!this.menu)this.follow.set(m.position.x,0,m.position.z);
  }
 }
 aim(pos,angle,power,visible){
  this.aimLine.visible=visible;this.aimHead.visible=visible;if(!visible)return;
  const feedback=powerFeedback(power);this.aimLine.material.color.set(feedback.color);this.aimHead.material.color.set(feedback.color);this.aimInfo={...feedback,power,length:1.4+power*6.6};
  const key=[pos.x.toFixed(2),pos.y.toFixed(2),pos.z.toFixed(2),angle.toFixed(3),power.toFixed(3)].join(',');if(key===this.aimKey)return;this.aimKey=key;
  const points=[];for(let i=0;i<=24;i++){const distance=.3+(this.aimInfo.length-.3)*i/24,x=pos.x+Math.sin(angle)*distance,z=pos.z-Math.cos(angle)*distance;points.push(new V(x,groundHeight(this.course,x,z)+.11,z));}
  const curve=new THREE.CatmullRomCurve3(points);this.aimLine.geometry.dispose();this.aimLine.geometry=new THREE.TubeGeometry(curve,36,.045,6,false);
  this.aimHead.position.copy(points.at(-1));this.aimHead.quaternion.setFromUnitVectors(new V(0,1,0),new V(Math.sin(angle),0,-Math.cos(angle)));
 }
 projectToGround(clientX,clientY,y=.22){const mouse=new THREE.Vector2(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(mouse,this.camera);return ray.ray.intersectPlane(new THREE.Plane(new V(0,1,0),-y),new V());}
 render(dt,state,myId){
  const at=performance.now();if(this.lastFrameAt)this.averageFps=(this.averageFps||60)*.95+(1000/Math.max(1,at-this.lastFrameAt))*.05;this.lastFrameAt=at;this.frameCount=(this.frameCount||0)+1;this.time+=dt;const t=state?.time??this.time;this.waterMat.uniforms.time.value=this.time;
  for(const {mesh,o}of this.movers){const a=t*o.speed+o.phase;if(o.type==='spinner')mesh.rotation.y=a;else mesh.position.x=o.x+Math.sin(a)*1.1;}
  for(const d of this.decorAnim){if(d.type==='tree')d.mesh.rotation.z=Math.sin(this.time*.8+d.phase)*.018;else if(d.type==='flag')d.mesh.rotation.y=Math.sin(this.time*2)*.25;else if(d.type==='cloud')d.mesh.position.x=d.base+Math.sin(this.time*.02+d.phase)*4;else if(d.type==='windmill')d.mesh.rotation.z=this.time*.32;else if(d.type==='smoke'){d.mesh.rotation.y=this.time*.1;d.mesh.position.x=Math.sin(this.time*.5+d.phase)*.5;}}
  if(this.particles){this.particles.rotation.y=Math.sin(this.time*.05)*.01;this.particles.position.y=Math.sin(this.time*.2)*.4;}
  if(state)this.updatePlayers(state,myId,dt);
  let goal;let eye;
  if(this.menu){goal=this.center.clone();const angle=.68+Math.sin(this.time*.05)*.09;const distance=this.length*.9;eye=new V(goal.x+Math.sin(angle)*distance,Math.max(22,this.length*.64),goal.z+Math.cos(angle)*distance);}
  else if(this.overview){goal=this.center.clone();eye=new V(goal.x+1,this.length*1.15,goal.z+2);}
  else{goal=this.follow.clone();this.target.lerp(goal,Math.min(1,dt*4));goal=this.target;eye=new V(goal.x+Math.sin(this.cameraAngle)*this.distance*Math.cos(this.pitch),this.distance*Math.sin(this.pitch),goal.z+Math.cos(this.cameraAngle)*this.distance*Math.cos(this.pitch));}
  this.camera.position.lerp(eye,Math.min(1,dt*(this.menu?1.2:5)));this.camera.lookAt(goal);this.renderer.info.reset();if(this.quality==='high')this.composer.render();else this.renderer.render(this.scene,this.camera);
 }
}
