(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PokerProgression=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const catalog = [
    {id:'chips500',name:'Un nuevo impulso',type:'chips',amount:500,cost:50,icon:'◉',description:'500 fichas para tu reserva.'},
    {id:'chips1000',name:'Listo para otra mesa',type:'chips',amount:1000,cost:90,icon:'◉',description:'1.000 fichas para tu reserva.'},
    {id:'chips2000',name:'Una gran entrada',type:'chips',amount:2000,cost:160,icon:'◉',description:'2.000 fichas para tu reserva.'},
    {id:'ocean',name:'Azul profundo',type:'skin',cost:80,icon:'♠',description:'Dorso azul océano y brillo suave.'},
    {id:'violet',name:'Hora violeta',type:'skin',cost:140,icon:'♣',description:'Dorso violeta para tu colección.'},
    {id:'sunset',name:'Luz de cobre',type:'skin',cost:200,icon:'♦',description:'Dorso cobre para tus mejores manos.'}
  ];
  const missions=[
    {id:'hands3',metric:'hands',target:3,coins:30,title:'Coge el ritmo',description:'Completa 3 manos.'},
    {id:'wins5',metric:'wins',target:5,coins:60,title:'Cinco buenas manos',description:'Gana 5 manos.'},
    {id:'showdowns3',metric:'showdowns',target:3,coins:40,title:'Hasta la última carta',description:'Llega a 3 showdowns sin retirarte.'},
    {id:'games1',metric:'games',target:1,coins:50,title:'Una partida completa',description:'Termina un torneo, ganes o pierdas.'}
  ];
  const clean=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,100000000):0;
  const threshold=level=>50*(level-1)*level;
  function level(xp){let n=1;while(n<1000&&xp>=threshold(n+1))n++;return n;}
  function normalize(value={}){
    return {coins:value.coins===undefined?120:clean(value.coins),xp:clean(value.xp),reserve:clean(value.reserve),
      hands:clean(value.hands),wins:clean(value.wins),showdowns:clean(value.showdowns),games:clean(value.games),
      owned:['classic',...new Set((Array.isArray(value.owned)?value.owned:[]).filter(id=>catalog.some(i=>i.type==='skin'&&i.id===id)))],
      skin:value.skin==='classic'||catalog.some(i=>i.type==='skin'&&i.id===value.skin&&(Array.isArray(value.owned)&&value.owned.includes(i.id)))?value.skin:'classic',
      claimed:(Array.isArray(value.claimed)?value.claimed:[]).filter(id=>missions.some(m=>m.id===id)||id==='firstwin'),
      receipts:(Array.isArray(value.receipts)?value.receipts:[]).filter(id=>typeof id==='string').slice(-300),
      spent:(Array.isArray(value.spent)?value.spent:[]).filter(id=>typeof id==='string').slice(-300)};
  }
  function create(value,save=()=>{}){
    let data=normalize(value);
    function reward({id,won=false,showdown=false,finished=false,champion=false,eligible=true}){
      if(!eligible||typeof id!=='string'||data.receipts.includes(id))return null;
      const before=level(data.xp);let coins=6+(won?14:0)+(showdown?4:0),xp=20+(won?20:0);const unlocks=[];
      data.hands++;if(won)data.wins++;if(showdown)data.showdowns++;
      if(finished){data.games++;coins+=champion?100:20;xp+=champion?120:50;}
      if(won&&!data.claimed.includes('firstwin')){data.claimed.push('firstwin');coins+=25;unlocks.push('Primera victoria');}
      data.xp+=xp;const after=level(data.xp);
      if(after>before){coins+=25*(after-before);unlocks.push('Nivel '+after);}
      for(const m of missions)if(!data.claimed.includes(m.id)&&data[m.metric]>=m.target){data.claimed.push(m.id);coins+=m.coins;unlocks.push(m.title);}
      data.coins+=coins;data.receipts.push(id);data.receipts=data.receipts.slice(-300);save(data);
      return {coins,xp,level:after,leveled:after>before,unlocks,champion};
    }
    function buy(id){
      const item=catalog.find(i=>i.id===id);if(!item)throw new Error('Ese artículo no existe.');
      if(item.type==='skin'&&data.owned.includes(id))throw new Error('Este diseño ya está en tu colección.');
      if(data.coins<item.cost)throw new Error('Te faltan '+(item.cost-data.coins)+' monedas.');
      data.coins-=item.cost;if(item.type==='chips')data.reserve+=item.amount;else{data.owned.push(id);data.skin=id;}
      save(data);return item;
    }
    function equip(id){if(!data.owned.includes(id))throw new Error('Primero desbloquea ese diseño.');data.skin=id;save(data);}
    function consume(amount,receipt){if(receipt&&data.spent.includes(receipt))return 0;if(!Number.isSafeInteger(amount)||amount<=0||data.reserve<amount)throw new Error('No tienes esas fichas en la reserva.');data.reserve-=amount;if(receipt){data.spent.push(receipt);data.spent=data.spent.slice(-300);}save(data);return amount;}
    return Object.freeze({reward,buy,equip,consume,inspect:()=>JSON.parse(JSON.stringify({...data,level:level(data.xp),levelStart:threshold(level(data.xp)),levelNext:threshold(level(data.xp)+1)}))});
  }
  return {create,catalog,missions,level,threshold};
});
