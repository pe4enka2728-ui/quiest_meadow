/* Miku encounter adapter. The checked prototype owns movement, collisions and patterns. */
(()=>{
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class Encounter{
 constructor(random=Math.random){this.random=random;this.bag=[];this.last=-1;this.sim=null;this.guarded=false;}
 next(){
  if(!this.bag.length){
   this.bag=MikuAttackLab.definitions.map((_,i)=>i);
   for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(clamp(this.random(),0,.999999999)*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}
   if(this.bag.length>1&&this.bag.at(-1)===this.last)[this.bag[0],this.bag[this.bag.length-1]]=[this.bag.at(-1),this.bag[0]];
  }
  this.last=this.bag.pop();return this.last;
 }
 begin(hp=100,guarded=false,index=this.next(),passives={}){
  this.last=index;this.guarded=guarded;
  const seed=Math.floor(clamp(this.random(),0,.999999999)*4294967296)>>>0;
  this.sim=new MikuAttackLab.Simulation(index,seed,passives);this.sim.hp=hp;return this.sim;
 }
 step(dt,input,{hp=this.sim?.hp??100,god=false,mitigate=n=>n}={}){
  if(!this.sim)return {hp,hit:null,done:false};
  const sim=this.sim,hits=sim.hits;sim.hp=hp;sim.invulnerable=god;sim.step(dt,input);
  let hit=null;
  if(sim.hits>hits&&!god){
   const damage=mitigate(this.guarded?Math.max(1,Math.ceil(sim.lastDamage/2)):sim.lastDamage);
   sim.hp=Math.max(0,hp-damage);sim.lastDamage=damage;hit={id:sim.hitId,damage};
  }
  if(god)sim.lastHit=-Infinity;
  return {hp:sim.hp,hit,done:sim.attack.done};
 }
 jump(){return this.sim?.jump()||false;}
 clear(){if(this.sim){this.sim.attack.entities=[];this.sim.attack.done=true;this.sim.player.jump=0;this.sim.player.z=0;this.sim.player.walk=0;}}
 copyPlayer(player){if(!this.sim)return;const p=this.sim.player;Object.assign(player,{u:p.x/12+.5,v:p.y/8,z:p.z,jump:p.jump,dir:p.dir,walk:p.walk});}
 setPlayer(player){if(!this.sim)return;const p=this.sim.player;if(player.u!==undefined)p.x=(player.u-.5)*12;if(player.v!==undefined)p.y=player.v*8;for(const k of ['z','jump','dir','walk'])if(player[k]!==undefined)p[k]=player[k];}
 status(){return this.sim?this.sim.status():null;}
}
function action(kind,{hp,mp,enemyHp}){
 if(kind==='items')return {accepted:false,hp,mp,enemyHp,message:'В сумке пока нет предметов для этого боя.'};
 if(!['attack','magic','guard'].includes(kind))return {accepted:false,hp,mp,enemyHp,message:''};
 if(kind==='magic'&&mp<6)return {accepted:false,hp,mp,enemyHp,message:'Нужно 6 MP. Выбери атаку или защиту.'};
 const damage=kind==='attack'?14:kind==='magic'?18:0;
 return {accepted:true,hp,mp:mp-(kind==='magic'?6:0),enemyHp:Math.max(0,enemyHp-damage),guarded:kind==='guard',damage,message:kind==='guard'?'Следующий урон уменьшен вдвое.':damage?'−'+damage+' HP':''};
}
globalThis.MikuCombatModel={Encounter,action,invulnerability:1.1};
})();
