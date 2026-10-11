export const WORLDS = [
 {id:'meadow',name:'Clover Valley',subtitle:'El encanto de empezar',tag:'BOSQUE',difficulty:1,grass:'#70963e',grass2:'#779e44',edge:'#ad8260',rock:'#736653',sky:'#c9dfd9',water:'#649c9c',accent:'#dae6a1',tree:'#406844',fog:'#c9dfd9',friction:.13,decor:'pine'},
 {id:'coast',name:'Coral Coast',subtitle:'Una escapada al paraíso',tag:'TROPICAL',difficulty:2,grass:'#61b2a0',grass2:'#72b8a7',edge:'#dec599',rock:'#bb9677',sky:'#bde4e6',water:'#3eabbb',accent:'#ffd095',tree:'#2d9e76',fog:'#bde4e6',friction:.12,decor:'palm'},
 {id:'sakura',name:'Sakura Gardens',subtitle:'Entre pétalos y precisión',tag:'ZEN',difficulty:2,grass:'#89a272',grass2:'#94ac7e',edge:'#6a4d48',rock:'#897978',sky:'#e4d3ce',water:'#929faa',accent:'#f4b7c3',tree:'#eaa9bc',fog:'#e4d3ce',friction:.13,decor:'sakura'},
 {id:'dunes',name:'Golden Dunes',subtitle:'Un oasis de desafíos',tag:'DESIERTO',difficulty:3,grass:'#aaa467',grass2:'#b6ac75',edge:'#ca8c51',rock:'#ab7246',sky:'#e9c99f',water:'#749c93',accent:'#ffdba2',tree:'#6e8760',fog:'#e9c99f',friction:.17,decor:'cactus'},
 {id:'ice',name:'Aurora Peaks',subtitle:'El arte de deslizarse',tag:'GLACIAR',difficulty:3,grass:'#a7c9d3',grass2:'#b8d9df',edge:'#748b9e',rock:'#667b8b',sky:'#b9ccdd',water:'#548ba6',accent:'#d9f5fa',tree:'#d3e0e5',fog:'#b9ccdd',friction:.035,decor:'pine'},
 {id:'candy',name:'Sugar Heights',subtitle:'Dulce, hasta el último rebote',tag:'FANTASÍA',difficulty:3,grass:'#b48fa6',grass2:'#bf9aae',edge:'#efd4b3',rock:'#b2819b',sky:'#ead2db',water:'#b99bca',accent:'#ffd1aa',tree:'#e9bccb',fog:'#ead2db',friction:.11,decor:'candy'},
 {id:'night',name:'Moonlight Club',subtitle:'La noche también tiene par',tag:'NOCTURNO',difficulty:4,grass:'#41646c',grass2:'#496d73',edge:'#596474',rock:'#3c4358',sky:'#273546',water:'#334c64',accent:'#c9e5c8',tree:'#527777',fog:'#273546',friction:.11,decor:'pine'},
 {id:'lava',name:'Ember Islands',subtitle:'Aquí se juega con fuego',tag:'VOLCÁN',difficulty:4,grass:'#7d8163',grass2:'#899071',edge:'#5d504b',rock:'#49413f',sky:'#c2a499',water:'#b35936',accent:'#ffb377',tree:'#80644e',fog:'#c2a499',friction:.14,decor:'rock'},
 {id:'ruins',name:'Lost Temple',subtitle:'El secreto está en el rebote',tag:'RUINAS',difficulty:3,grass:'#567d6a',grass2:'#618574',edge:'#b6ad87',rock:'#7f8c77',sky:'#b6ccbc',water:'#456e60',accent:'#ead79c',tree:'#3a6854',fog:'#b6ccbc',friction:.12,decor:'ruins'},
 {id:'neon',name:'Neon District',subtitle:'Persigue la luz',tag:'NEÓN',difficulty:4,grass:'#394b77',grass2:'#435686',edge:'#233049',rock:'#202839',sky:'#202a43',water:'#2c385f',accent:'#65f5da',tree:'#e082ef',fog:'#202a43',friction:.10,decor:'city',night:true},
 {id:'autumn',name:'Amber Woods',subtitle:'Un paseo entre hojas doradas',tag:'OTOÑO',difficulty:2,grass:'#96945b',grass2:'#a39d67',edge:'#976a43',rock:'#7c6854',sky:'#e4c5a5',water:'#889b89',accent:'#ffd186',tree:'#d58949',fog:'#e4c5a5',friction:.14,decor:'autumn'},
 {id:'haunted',name:'Ghost Hollow',subtitle:'Cuidado con las curvas de medianoche',tag:'ENCANTADO',difficulty:4,grass:'#5e617f',grass2:'#6b6a8c',edge:'#493c59',rock:'#3d3b50',sky:'#353249',water:'#49415c',accent:'#adebbb',tree:'#8e86a2',fog:'#353249',friction:.12,decor:'haunted',night:true},
 {id:'space',name:'Orbit Station',subtitle:'Una ronda entre estrellas',tag:'ESPACIO',difficulty:3,grass:'#647d93',grass2:'#728ba0',edge:'#9ca8b9',rock:'#4c576e',sky:'#182638',water:'#253e58',accent:'#9eeafc',tree:'#b8c5d9',fog:'#182638',friction:.065,decor:'space',night:true},
 {id:'pirate',name:'Buccaneer Bay',subtitle:'El tesoro espera en el green',tag:'PIRATAS',difficulty:3,grass:'#739a83',grass2:'#7fa48d',edge:'#9c704c',rock:'#88745c',sky:'#d3d4bc',water:'#438d93',accent:'#f4ce79',tree:'#42785c',fog:'#d3d4bc',friction:.12,decor:'palm'},
 {id:'mushroom',name:'Mystic Grove',subtitle:'Un bosque fuera de lo normal',tag:'MÁGICO',difficulty:2,grass:'#688e89',grass2:'#749b92',edge:'#826ba3',rock:'#596c79',sky:'#b2c4d4',water:'#7386aa',accent:'#f0b8e8',tree:'#cc82b0',fog:'#b2c4d4',friction:.11,decor:'mushroom'},
 {id:'clockwork',name:'Clockwork Port',subtitle:'Todo es cuestión de tiempo',tag:'STEAMPUNK',difficulty:4,grass:'#88907b',grass2:'#959a86',edge:'#ae8051',rock:'#645e55',sky:'#cfbdaa',water:'#688581',accent:'#ffd49b',tree:'#ba925b',fog:'#cfbdaa',friction:.13,decor:'machine'}
];
export const HOLE_NAMES=['Primer contacto','Cambio de rumbo','Entre guardianes','El atajo','Baila con el viento','Al otro lado','Rebote perfecto','Cuesta arriba','La última bandera'];
export const COLORS=['#f7f1df','#ea9378','#8ccbe3','#d7a7df','#e9c661','#9fce95','#a0a9ed','#ed9dad'];
export function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function makeCourse(worldIndex=0,hole=0){
 worldIndex=Math.max(0,Math.min(WORLDS.length-1,Math.trunc(worldIndex)));hole=Math.max(0,Math.min(8,Math.trunc(hole)));
 const rng=random(19413+worldIndex*899+hole*1031),a=4+worldIndex%4,b=4+Math.floor(worldIndex/4),mirror=worldIndex%2?-1:1;
 // Nine authored route families. Width, length, terrain and obstacles are composed for each world.
 const routes=[[[0,-1,b],[1,0,a],[0,-1,2]],[[0,-1,3],[1,0,a],[0,-1,b]],[[0,-1,2],[1,0,a],[0,-1,2],[-1,0,a*2],[0,-1,b],[1,0,a]],[[0,-1,b+2],[1,0,a],[0,1,2],[1,0,2],[0,-1,b+2]],[[0,-1,2],[1,0,a+1],[0,-1,b],[-1,0,a],[0,-1,2],[1,0,2]],[[0,-1,b+3],[1,0,a+2],[0,1,b],[-1,0,a],[0,-1,1]],[[0,-1,2],[1,0,a],[0,-1,b],[1,0,2],[0,-1,2],[-1,0,1],[0,-1,2]],[[0,-1,b],[-1,0,a],[0,-1,2],[1,0,a*2],[0,-1,2],[-1,0,1]],[[0,-1,2],[-1,0,a],[0,-1,b],[1,0,a+2],[0,-1,3],[-1,0,2]]];
 const intro=worldIndex===0&&hole===0;
 // Long courses combine an opening section with a different route family and a sculpted finish.
 const opening=worldIndex%3===0?[[0,-1,3],[1,0,3],[0,-1,3],[-1,0,3],[0,-1,2]]:worldIndex%3===1?[[0,-1,3],[-1,0,3],[0,-1,2],[1,0,3],[0,-1,3]]:[[0,-1,4],[1,0,2],[0,-1,2],[-1,0,2],[0,-1,2]];
 const route=intro?[[0,-1,5]]:[...opening,...routes[(hole+Math.floor(worldIndex/3))%9]];
 const tiles=[{x:0,z:0,profile:'flat'}];let x=0,z=0;
 for(const [dx,dz,steps]of route)for(let j=0;j<steps;j++){x+=dx*4*mirror;z+=dz*4;tiles.push({x,z,profile:'flat'});}
 const cupStyle=hole%2?'bowl':'flat',last=tiles.at(-1);last.profile=cupStyle;last.depth=cupStyle==='bowl'?.65+(worldIndex%4)*.12:0;
 const cup={x:last.x,z:last.z,y:surfaceHeight(last,last.x,last.z)};const spawn={x:0,y:.235,z:1.15};
 if(!intro){for(const f of [.22,.52,.77]){const t=tiles[Math.floor(tiles.length*f)];t.profile=f===.52?'bowl':'hill';t.height=.45+(worldIndex%3)*.16;t.depth=.35+(worldIndex%3)*.09;}}
 const obstacles=[];
 for(let i=2;i<tiles.length-2;i++){
  if(worldIndex===0&&hole===0)continue;
  if(rng()>.48||tiles[i].profile!=='flat')continue;
  const t=tiles[i],types=['post','bumpers','spinner','ramp','gate','sand','boost'];
  let type=types[(hole+i+worldIndex)%types.length];
  if(type==='spinner'&&hole<2&&worldIndex<2)type='post';
  obstacles.push({type,x:t.x,z:t.z,phase:rng()*Math.PI*2,speed:.55+(worldIndex%8)*.1,axis:rng()>.5?'x':'z'});
 }
 const routeTiles=[...tiles];
 // Passing plazas and small side loops create wider sections and alternative approaches.
 if(!intro){const seen=new Set(tiles.map(t=>`${t.x},${t.z}`));for(const f of [.32,.65]){const t=routeTiles[Math.floor(routeTiles.length*f)];for(const [dx,dz]of [[4,0],[4,-4],[0,-4]]){const key=`${t.x+dx},${t.z+dz}`;if(!seen.has(key)){seen.add(key);tiles.splice(tiles.length-1,0,{x:t.x+dx,z:t.z+dz,profile:'flat',plaza:true});}}}}
 if(!intro){for(const t of tiles){t.lift=.8+(worldIndex%4)*.25;if(t.profile==='flat'&&t.z<=-4&&t.z>=-28)t.profile='bridge';}for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i].z>=-28)obstacles.splice(i,1);}
 const par=Math.min(14,2+Math.floor(routeTiles.length/5)+Math.floor(obstacles.length/5));
 return {worldIndex,hole,tiles,routeTiles,distance:(routeTiles.length-1)*4,cup,spawn,obstacles,par,cupStyle,name:HOLE_NAMES[hole],theme:WORLDS[worldIndex]};
}
export function surfaceHeight(tile,x,z){
 const base=elevationHeight(tile,z);
 const q=Math.max(Math.abs(x-tile.x),Math.abs(z-tile.z))/2;
 if(q>=1)return base;
 if(tile.profile==='bowl')return base-tile.depth*Math.pow(1-q*q,2);
 if(tile.profile==='hill')return base+tile.height*Math.pow(Math.cos((x-tile.x)*Math.PI/4)*Math.cos((z-tile.z)*Math.PI/4),2);
 return base;
}
export function elevationHeight(tile,z){if(!tile.lift)return 0;return tile.lift*Math.max(0,Math.min(1,(-z-4)/8,(z+28)/8));}
export function groundHeight(course,x,z){const t=course.tiles.find(t=>Math.abs(x-t.x)<=2&&Math.abs(z-t.z)<=2);return t?surfaceHeight(t,x,z):0;}
export function surfaceMesh(tile,cup=null){
 const positions=[],indices=[],uvs=[];
 const add=(x,z)=>{positions.push(x,surfaceHeight(tile,x,z),z);uvs.push((x-tile.x+2)/4,(z-tile.z+2)/4);};
 if(cup){
  const segments=64,rings=12;
  for(let r=0;r<=rings;r++)for(let a=0;a<=segments;a++){
   const angle=a/segments*Math.PI*2,dx=Math.cos(angle),dz=Math.sin(angle),outer=2/Math.max(Math.abs(dx),Math.abs(dz)),distance=.38+(outer-.38)*r/rings;
   add(tile.x+dx*distance,tile.z+dz*distance);
  }
  for(let r=0;r<rings;r++)for(let a=0;a<segments;a++){const i=r*(segments+1)+a,j=i+segments+1;indices.push(i,i+1,j,i+1,j+1,j);}
 }else{
  const n=tile.profile==='flat'?1:16;for(let row=0;row<=n;row++)for(let col=0;col<=n;col++)add(tile.x-2+col*4/n,tile.z-2+row*4/n);
  for(let row=0;row<n;row++)for(let col=0;col<n;col++){const i=row*(n+1)+col,j=i+n+1;indices.push(i,j,i+1,i+1,j,j+1);}
 }
 return {positions:new Float32Array(positions),indices:new Uint32Array(indices),uvs:new Float32Array(uvs)};
}
export function railsFor(course){
 const set=new Set(course.tiles.map(t=>`${t.x},${t.z}`));const rails=[];
 for(const t of course.tiles){
  const add=(x,z,w,d)=>{const ha=surfaceHeight(t,x,z-d/2),hb=surfaceHeight(t,x,z+d/2);rails.push({x,z,w,d,y:(ha+hb)/2,tilt:d>1?-Math.atan2(hb-ha,d):0});};
  if(!set.has(`${t.x-4},${t.z}`))add(t.x-2,t.z,.16,4.15);
  if(!set.has(`${t.x+4},${t.z}`))add(t.x+2,t.z,.16,4.15);
  if(!set.has(`${t.x},${t.z-4}`))add(t.x,t.z-2,4,.16);
  if(!set.has(`${t.x},${t.z+4}`))add(t.x,t.z+2,4,.16);
 }return rails;
}
export function rampVertices(x,z){return new Float32Array([x-1.2,0,z-1.5,x+1.2,0,z-1.5,x-1.2,.7,z,x+1.2,.7,z,x-1.2,0,z+1.5,x+1.2,0,z+1.5]);}
export const RAMP_INDICES=new Uint32Array([0,2,1,1,2,3,2,4,3,3,4,5]);
