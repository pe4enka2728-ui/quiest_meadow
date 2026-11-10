/* Separate direct impact, ambient light damage and falling. Pure model, no DOM. */
(()=>{
'use strict';
const settings=Object.freeze({invulnerability:1.5,heroMaxHp:100,flowerMaxHp:150,gumiMaxHp:300});
function create(hp=100){return {hp,lastHit:null,lastDamage:0,damageEvents:0}}
function protectedAt(lastHit,time){return lastHit!==null&&Number.isFinite(lastHit)&&time>=lastHit&&time-lastHit<1.5-1e-9}
function apply(s,event,time){
 if(s.hp<=0)return {applied:false,damage:0,hp:0};
 if(event.type==='fatal-fall'||event.type==='fatal-overload'){const damage=s.hp;s.hp=0;s.lastDamage=damage;s.damageEvents++;return {applied:true,damage,hp:0,fatal:true}}
 const amount=event.damage??5,ambient=event.grantsInvulnerability===false;
 if(!Number.isFinite(amount)||amount<=0||(!event.bypassInvulnerability&&protectedAt(s.lastHit,time)))return {applied:false,damage:0,hp:s.hp};
 s.hp=Math.max(0,s.hp-amount);s.lastDamage=amount;s.damageEvents++;if(!ambient)s.lastHit=time;return {applied:true,damage:amount,hp:s.hp,ambient};
}
function opacity(s,time){return s.hp>0&&protectedAt(s.lastHit,time)&&Math.floor((time-s.lastHit)*10)%2?.3:1}
globalThis.CombatDamageV2={settings,create,protectedAt,apply,opacity};
})();
