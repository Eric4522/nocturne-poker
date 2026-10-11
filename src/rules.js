export function validateName(value){
 if(typeof value!=='string')return {ok:false,message:'Escribe tu nombre para entrar al campo.'};
 const name=value.trim().replace(/\s+/g,' ');
 if(name.length<2||name.length>20)return {ok:false,message:'Tu nombre debe tener entre 2 y 20 caracteres.'};
 if(!/^[\p{L}\p{N} ._'’-]+$/u.test(name))return {ok:false,message:'Usa letras, números, espacios o guiones.'};
 return {ok:true,name};
}
export function powerFeedback(power){
 return power<.34?{label:'FLOJO',color:'#63df91',description:'Un toque suave'}:power<.67?{label:'NORMAL',color:'#ffb65c',description:'Un golpe equilibrado'}:{label:'FUERTE',color:'#ff6674',description:'Toda la potencia'};
}
export const MAX_STROKES=32;
export const HOLE_SECONDS=480;
