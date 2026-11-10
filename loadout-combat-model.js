/* Per-turn random offers, paid casts, critical rolls, poison and local hit feedback. */
(()=>{
'use strict';
const clamp=n=>Math.max(0,Math.min(.999999999,Number.isFinite(n)?n:0));
class Session{
 constructor(wallet=ShopModel.fresh(),random=Math.random){this.wallet=ShopModel.restore(wallet);this.stats=ShopModel.stats(this.wallet);this.random=random;this.poisons=[];this.open=false;this.mode='abilities';this.log=[];this.buffs={reduction:0,dodge:0,resistance:0,speed:0,nextCrit:false};this.busy=0;this.hand=[];this.handRevision=0;this.effect=null;this.castSerial=0;this.deal();}
 equipped(){return this.wallet.loadout.abilities.map(id=>id?ShopModel.find(id):null).filter(Boolean);}
 deal(){
  const pool=this.equipped(),previous=this.hand.slice(),count=Math.min(pool.length,3+Math.floor(clamp(this.random())*3));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(clamp(this.random())*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  this.hand=pool.slice(0,count).map(i=>i.id);
  if(this.hand.length<pool.length&&this.hand.length===previous.length&&this.hand.every(id=>previous.includes(id)))this.hand[this.hand.length-1]=pool[this.hand.length].id;
  this.handRevision++;this.log=[];return this.hand.slice();
 }
 list(){return this.hand.map(id=>ShopModel.find(id));}
 manaCost(item){return Math.max(1,item.mana-(this.stats.manaDiscount||0));}
 begin(){this.open=true;return this;}
 canCast(id,mp,{hp=this.stats.maxHp}={}){
  const item=this.list().find(i=>i.id===id);
  if(!item)return {ok:false,mp,reason:'not-offered'};
  if(this.busy>0)return {ok:false,mp,reason:'busy'};
  const cost=this.manaCost(item);if(mp<cost)return {ok:false,mp,reason:'mana'};
  if(item.heal&&hp>=this.stats.maxHp)return {ok:false,mp,reason:'full-hp'};
  if(item.resistance&&this.buffs.resistance>=item.resistance||item.speed&&this.buffs.speed>=item.speed||item.nextCrit&&this.buffs.nextCrit)return {ok:false,mp,reason:'already-active'};
  return {ok:true,item,cost};
 }
 cast(id,mp,{hp=this.stats.maxHp,performance=null}={}){
  const check=this.canCast(id,mp,{hp});if(!check.ok)return check;
  const {item,cost}=check;
  const healed=item.heal?Math.max(0,Math.min(item.heal,this.stats.maxHp-hp)):0;
  if(item.resistance)this.buffs.resistance=Math.max(this.buffs.resistance,item.resistance);
  if(item.speed)this.buffs.speed=Math.max(this.buffs.speed,item.speed);
  const forcedCrit=item.hits>0&&this.buffs.nextCrit;if(item.hits>0)this.buffs.nextCrit=false;
  if(item.nextCrit)this.buffs.nextCrit=true;
  const score=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0)),rating=n=>n>=.9?'perfect':n>=.5?'good':'weak';
  const execution=performance?{score:score(performance.score),hits:Array.from({length:Math.max(1,item.hits)},(_,i)=>score(performance.hits?.[i]??performance.score))}:null;
  if(execution)execution.quality=rating(execution.score);
  let damage=0,hits=0,crits=0;
  for(let n=0;n<item.hits;n++){
   const q=execution?rating(execution.hits[n]):'good',multiplier=q==='perfect'?1.25:q==='weak'?.7:1;
   if(q==='perfect'||this.random()<item.chance){hits++;const critical=forcedCrit||this.random()<Math.min(.95,item.crit+this.stats.critBonus);crits+=critical?1:0;damage+=Math.round((item.power+this.stats.weaponDamage)*multiplier*(critical?item.critMultiplier:1));}
  }
  const executionRefund=item.target==='hero'&&execution?.quality==='perfect'?1:0;
  mp=Math.min(this.stats.maxMp,mp-cost+(crits&&item.refund?item.refund:0)+executionRefund);
  if(hits&&item.poison){this.poisons=this.poisons.filter(p=>p.id!==id);this.poisons.push({id,...item.poison});}
  if(hits){this.buffs.reduction=Math.max(this.buffs.reduction,item.reduction||0);this.buffs.dodge=Math.max(this.buffs.dodge,item.dodge||0);}
  const result={ok:true,id,name:item.name,mp,cost,damage,hits,crits,poison:hits&&!!item.poison,healed,hp:hp+healed,target:item.target||'enemy',resistance:item.resistance||0,speed:item.speed||0,nextCrit:!!item.nextCrit,...(execution?{performance:execution,restoredMp:executionRefund}: {})};this.log.push(result);if(this.log.length>12)this.log.shift();
  this.busy=.42;this.effect={id,serial:++this.castSerial,age:0,duration:.42,strength:hits?(crits?9:6):3,hits,crits,target:result.target};return result;
 }
 update(dt){this.busy=Math.max(0,this.busy-dt);if(this.effect)this.effect.age+=dt;}
 reaction(){const e=this.effect;if(!e||e.target==='hero'||e.age<0||e.age>=.34)return [0,0];const q=e.age/.34,envelope=(1-q)*(1-q);return [Math.round(Math.sin(e.age*89)*e.strength*envelope),Math.round(Math.sin(e.age*67+1)*e.strength*.28*envelope)];}
 finish(){this.open=false;}
 afterEnemy(){const damage=this.poisons.reduce((n,p)=>n+p.damage,0);this.poisons=this.poisons.map(p=>({...p,turns:p.turns-1})).filter(p=>p.turns>0);this.buffs={reduction:0,dodge:0,resistance:0,speed:0,nextCrit:this.buffs.nextCrit};this.deal();return damage;}
 movementScale(){return 1+this.buffs.speed;}
 mitigate(damage){if(damage<=0)return 0;if(this.buffs.dodge&&this.random()<this.buffs.dodge)return 0;return Math.max(1,Math.ceil((damage-this.buffs.reduction)*(1-this.buffs.resistance)));}
 status(){return {open:this.open,mode:this.mode,busy:this.busy,stats:{...this.stats},abilities:this.wallet.loadout.abilities.slice(),offered:this.hand.slice(),handRevision:this.handRevision,poisons:this.poisons.map(p=>({...p})),buffs:{...this.buffs},log:this.log.map(v=>({...v})),effect:this.effect?{...this.effect}:null,enemyOffset:this.reaction()};}
}
globalThis.LoadoutCombatModel={Session};
})();
