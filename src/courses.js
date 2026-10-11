export const WORLDS = [
 {id:'meadow',name:'Clover Valley',subtitle:'El encanto de empezar',tag:'BOSQUE',difficulty:1,grass:'#70963e',grass2:'#779e44',edge:'#ad8260',rock:'#736653',sky:'#c9dfd9',water:'#649c9c',accent:'#dae6a1',tree:'#406844',fog:'#c9dfd9',friction:.13,decor:'pine'},
 {id:'coast',name:'Coral Coast',subtitle:'Una escapada al paraíso',tag:'TROPICAL',difficulty:2,grass:'#61b2a0',grass2:'#72b8a7',edge:'#dec599',rock:'#bb9677',sky:'#bde4e6',water:'#3eabbb',accent:'#ffd095',tree:'#2d9e76',fog:'#bde4e6',friction:.12,decor:'palm'},
 {id:'sakura',name:'Sakura Gardens',subtitle:'Entre pétalos y precisión',tag:'ZEN',difficulty:2,grass:'#89a272',grass2:'#94ac7e',edge:'#6a4d48',rock:'#897978',sky:'#e4d3ce',water:'#929faa',accent:'#f4b7c3',tree:'#eaa9bc',fog:'#e4d3ce',friction:.13,decor:'sakura'},
 {id:'dunes',name:'Golden Dunes',subtitle:'Un oasis de desafíos',tag:'DESIERTO',difficulty:3,grass:'#aaa467',grass2:'#b6ac75',edge:'#ca8c51',rock:'#ab7246',sky:'#e9c99f',water:'#749c93',accent:'#ffdba2',tree:'#6e8760',fog:'#e9c99f',friction:.17,decor:'cactus'},
 {id:'ice',name:'Aurora Peaks',subtitle:'El arte de deslizarse',tag:'GLACIAR',difficulty:3,grass:'#a7c9d3',grass2:'#b8d9df',edge:'#748b9e',rock:'#667b8b',sky:'#b9ccdd',water:'#548ba6',accent:'#d9f5fa',tree:'#d3e0e5',fog:'#b9ccdd',friction:.035,decor:'pine'},
 {id:'candy',name:'Sugar Heights',subtitle:'Dulce, hasta el último rebote',tag:'FANTASÍA',difficulty:3,grass:'#b48fa6',grass2:'#bf9aae',edge:'#efd4b3',rock:'#b2819b',sky:'#ead2db',water:'#b99bca',accent:'#ffd1aa',tree:'#e9bccb',fog:'#ead2db',friction:.11,decor:'candy'},
 {id:'night',name:'Moonlight Club',subtitle:'La noche también tiene par',tag:'NOCTURNO',difficulty:4,grass:'#41646c',grass2:'#496d73',edge:'#596474',rock:'#3c4358',sky:'#273546',water:'#334c64',accent:'#c9e5c8',tree:'#527777',fog:'#273546',friction:.11,decor:'pine'},
 {id:'lava',name:'Ember Islands',subtitle:'Aquí se juega con fuego',tag:'VOLCÁN',difficulty:4,grass:'#7d8163',grass2:'#899071',edge:'#5d504b',rock:'#49413f',sky:'#c2a499',water:'#b35936',accent:'#ffb377',tree:'#80644e',fog:'#c2a499',friction:.14,decor:'rock'}
];
export const HOLE_NAMES=['Primer contacto','Cambio de rumbo','Entre guardianes','El atajo','Baila con el viento','Al otro lado','Rebote perfecto','Cuesta arriba','La última bandera'];
export const COLORS=['#f7f1df','#ea9378','#8ccbe3','#d7a7df','#e9c661','#9fce95','#a0a9ed','#ed9dad'];
export function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function makeCourse(worldIndex=0,hole=0){
 worldIndex=Math.max(0,Math.min(7,Math.trunc(worldIndex)));hole=Math.max(0,Math.min(8,Math.trunc(hole)));
 const rng=random(19413+worldIndex*899+hole*1031);const tiles=[{x:0,z:0}];let x=0,z=0;
 const length=5+Math.floor(hole/3)+Math.floor(worldIndex/3);
 for(let row=1;row<length;row++){
  z-=4;tiles.push({x,z});
  if(!(worldIndex===0&&hole===0)&&row<length-1&&rng()<.58){
   const direction=x>=8?-1:x<=-8?1:rng()>.5?1:-1;
   const steps=rng()<.24?2:1;
   for(let j=0;j<steps;j++){x+=4*direction;tiles.push({x,z});}
  }
 }
 // World signature gives each route its own finish and guarantees distinct layouts.
 const tail=worldIndex+1;for(let j=0;j<tail;j++){z-=4;tiles.push({x,z});}
 const cup={x:tiles.at(-1).x,z:tiles.at(-1).z-(worldIndex===0&&hole===0?0:.65)};const spawn={x:0,y:.235,z:1.15};
 const obstacles=[];
 for(let i=2;i<tiles.length-2;i++){
  if(worldIndex===0&&hole===0)continue;
  if(rng()>.62)continue;
  const t=tiles[i],types=['post','bumpers','spinner','ramp','gate','sand','boost'];
  let type=types[(hole+i+worldIndex)%types.length];
  if(type==='spinner'&&hole<2&&worldIndex<2)type='post';
  obstacles.push({type,x:t.x,z:t.z,phase:rng()*Math.PI*2,speed:.55+worldIndex*.1,axis:rng()>.5?'x':'z'});
 }
 const par=Math.min(8,2+Math.floor(tiles.length/4)+Math.floor(obstacles.length/4));
 return {worldIndex,hole,tiles,cup,spawn,obstacles,par,name:HOLE_NAMES[hole],theme:WORLDS[worldIndex]};
}
export function railsFor(course){
 const set=new Set(course.tiles.map(t=>`${t.x},${t.z}`));const rails=[];
 for(const t of course.tiles){
  if(!set.has(`${t.x-4},${t.z}`))rails.push({x:t.x-2,z:t.z,w:.16,d:4.15});
  if(!set.has(`${t.x+4},${t.z}`))rails.push({x:t.x+2,z:t.z,w:.16,d:4.15});
  if(!set.has(`${t.x},${t.z-4}`))rails.push({x:t.x,z:t.z-2,w:4,d:.16});
  if(!set.has(`${t.x},${t.z+4}`))rails.push({x:t.x,z:t.z+2,w:4,d:.16});
 }return rails;
}
export function rampVertices(x,z){return new Float32Array([x-1.2,0,z-1.5,x+1.2,0,z-1.5,x-1.2,.7,z,x+1.2,.7,z,x-1.2,0,z+1.5,x+1.2,0,z+1.5]);}
export const RAMP_INDICES=new Uint32Array([0,2,1,1,2,3,2,4,3,3,4,5]);
