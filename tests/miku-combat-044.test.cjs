const assert=require('node:assert/strict');
require('../miku-attacks-model.js');require('../miku-combat-model.js');require('../miku-turn-model.js');
const C=MikuCombatModel,M=MikuAttackLab;
const stats={hp:80,mp:30,enemyHp:500};
assert.deepEqual(C.action('attack',stats),{accepted:true,hp:80,mp:30,enemyHp:486,guarded:false,damage:14,message:'−14 HP'});
assert.equal(C.action('magic',stats).mp,24);assert.equal(C.action('magic',stats).enemyHp,482);
assert.equal(C.action('magic',{...stats,mp:5}).accepted,false);
assert.equal(C.action('items',stats).accepted,false);assert.equal(C.action('guard',stats).guarded,true);
assert.equal(C.action('attack',{...stats,enemyHp:4}).enemyHp,0);
// Every active pattern is reachable once per deck. No repeat at a deck boundary.
for(const random of [()=>0,()=>.99999,Math.random]){
 const encounter=new C.Encounter(random);let previous=-1;
 for(let round=0;round<3;round++){
  const seen=[];for(let i=0;i<15;i++){const n=encounter.next();assert.notEqual(n,previous);seen.push(n);previous=n;}
  assert.deepEqual(seen.sort((a,b)=>a-b),Array.from({length:15},(_,i)=>i));
 }
}
const rest=M.definitions.findIndex(d=>d.number===12),none={double:'never',mines:'never'};
for(const guarded of [false,true]){
 const e=new C.Encounter(()=>.4);e.begin(100,guarded,rest,none);
 e.setPlayer({u:.94,v:.1});let hp=100,hit;
 for(let t=0;t<3&&!hit;t+=1/120){const r=e.step(1/120,{}, {hp});hp=r.hp;hit=r.hit;}
 assert.ok(hit);assert.equal(hit.damage,guarded?5:10);assert.equal(hp,guarded?95:90);
 const before=hp;for(let i=0;i<60;i++)hp=e.step(1/120,{}, {hp}).hp;assert.equal(hp,before);
 // Developer healing and god mode use the same authoritative HP as the host battle.
 assert.equal(e.step(1/60,{}, {hp:100,god:true}).hp,100);
 e.clear();assert.equal(e.sim.attack.entities.length,0);assert.equal(e.sim.player.z,0);
 e.begin(100,false,rest,none);const p={};e.copyPlayer(p);assert.deepEqual([p.u,p.v,p.z,p.jump],[.5,.5,0,0]);
 assert.equal(e.jump(),true);e.step(.1,{}, {hp:100,god:true});e.copyPlayer(p);assert.ok(p.z>0);
}
for(const outcome of ['victory','defeat']){const t=new MikuTurnModel.Turns(),p={};t.complete(outcome,p);assert.equal(t.canAct,false);assert.equal(t.movable,false);assert.equal(t.phase,outcome);}
console.log('PASS integrated Miku: full deck, turn actions, MP, guarded damage, invulnerability, god/heal, clean centre respawn and terminal phases.');
