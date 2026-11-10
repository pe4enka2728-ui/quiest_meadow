const assert=require('node:assert/strict');
require('../battle-attacks.js');
const A=FlowerAttacks,standing={u:.5,v:.75,jump:0};
const at=(index,time,p=standing)=>{const s=A.create(index);while(s.time+1e-6<time)A.step(s,Math.min(.05,time-s.time),p);return s};
assert.equal(A.definitions.length,7);
assert.equal(new Set(A.definitions.map(d=>d.id)).size,7);
for(let index=0;index<7;index++){
 const state=A.create(index),seen=new Set();let firstHazard=Infinity,firstWarning=Infinity,hits=0;
 while(!state.done){
  hits+=A.step(state,.025,standing).length;
  for(const e of state.entities){
   seen.add(e.kind);if(e.active)firstHazard=Math.min(firstHazard,state.time);
   if(e.kind.includes('warning')||e.kind==='path'||e.kind==='bud'&&!e.active)firstWarning=Math.min(firstWarning,state.time);
   assert.ok(!Object.values(e).some(v=>typeof v==='number'&&!Number.isFinite(v)));
   if(!e.active)assert.equal(A.collides(e,{x:e.x||0,y:e.y||0,z:0}),false);
  }
 }
 assert.ok(firstHazard<Infinity,`${index}: no damaging objects`);
 assert.ok(firstWarning+.3<firstHazard,`${index}: insufficient telegraph`);
 assert.ok(hits>0,`${index}: standing in the starting position never gets hit`);
 assert.deepEqual(state.entities,[]);
 assert.ok(state.time>=state.definition.duration);
 console.log(`PASS ${state.definition.name}: visible warning, active model, contact and cleanup (${[...seen]})`);
}
// Low volumes can be cleared, high thorn patches cannot. Edges include the player's foot radius.
for(const e of [
 {active:true,shape:'circle',x:0,y:4,r:.36,z0:.28,z1:.92},
 {active:true,shape:'capsule',x1:-2,x2:2,y:4,r:.18,z0:0,z1:.88},
 {active:true,shape:'ring',x:0,y:0,r:4,thickness:.18,z0:0,z1:.48}
]){assert.ok(A.collides(e,{x:0,y:4,z:0}));assert.equal(A.collides(e,{x:0,y:4,z:1.8}),false)}
const tall={active:true,shape:'box',x:0,y:4,halfX:1.4,halfY:1.12,z0:0,z1:3.2};
assert.ok(A.collides(tall,{x:0,y:4,z:1.8}));assert.equal(A.collides(tall,{x:1.61,y:4,z:0}),false);
const ring={active:true,shape:'ring',x:0,y:0,r:4,thickness:.18,z0:0,z1:.48,gapHalf:.37,gapCenter:Math.PI/2};
assert.equal(A.collides(ring,{x:0,y:4,z:0}),false);assert.ok(A.collides(ring,{x:4,y:0,z:0}));
// Masks lock once, then retain their direction even when the target moves behind them.
const masks=at(3,1.1);const lock={...masks.locks[0]};
A.step(masks,.1,{u:.95,v:.1,jump:0});assert.deepEqual(masks.locks[0],lock);
assert.equal(masks.entities.find(e=>e.id==='mask-0').active,false);
while(masks.time<1.45)A.step(masks,.025,standing);
assert.equal(masks.entities.find(e=>e.id==='mask-0').active,true);
// Seeds mark and keep their landing coordinates instead of following the player in flight.
const seeds=at(2,.5),landing={...seeds.locks[0]};
A.step(seeds,.1,{u:.04,v:.1,jump:0});assert.deepEqual(seeds.locks[0],landing);
// Fine substeps catch a collision even if a fast-moving mask crosses between rendered frames.
const mask=at(3,2.4),e=mask.entities.find(e=>e.id==='mask-0');
const p={u:e.x/12+.5,v:e.y/8,jump:0};assert.ok(A.step(mask,.05,p).length);
// Frame-rate independence with a fixed target.
for(let index=0;index<7;index++){
 const a=A.create(index),b=A.create(index);
 for(let i=0;i<90;i++)A.step(a,.05,standing);
 for(let i=0;i<270;i++)A.step(b,1/60,standing);
 assert.deepEqual(a.locks,b.locks);
 assert.equal(a.entities.length,b.entities.length);
 for(let i=0;i<a.entities.length;i++)for(const key of ['x','y','r'])if(typeof a.entities[i][key]==='number')assert.ok(Math.abs(a.entities[i][key]-b.entities[i][key])<1e-6);
}
console.log('PASS jump clearance, thorn height, ring gap, locked targets, swept contact and 20/60fps parity');
for(let previous=-1;previous<7;previous++){
 const seen=new Set();for(let i=0;i<100;i++){const pick=A.choose(previous,()=>i/100);assert.ok(pick>=0&&pick<7);assert.notEqual(pick,previous);seen.add(pick)}
 assert.equal(seen.size,previous===-1?7:6);
}
assert.equal(A.balance.tempo,1.25);assert.equal(A.arena.projectionScale,.9);
assert.equal(A.balance.petalsPerWave*A.balance.petalWaves,21);
assert.equal(A.balance.seeds,9);assert.equal(A.balance.masks,5);assert.equal(A.balance.ringFires.length,4);
console.log('PASS random selection covers every allowed attack without consecutive repeats, increased tempo and density');
// These routes use exactly the game's movement speed, boundaries and jump timer.
// Replay at display rates as well as the planner's coarse steps to rule out narrow tunnelling escapes.
const routes=require('./flower-dodge-routes.json'),dirs=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
for(const substeps of [1,2,6])for(let index=0;index<7;index++){
 const s=A.create(index);let p={...standing};
 for(const action of routes[index].actions){
  const [dx,dy]=dirs[action%9],length=Math.hypot(dx,dy)||1;
  if(action>=9){assert.equal(p.jump,0);p.jump=.62}
  for(let j=0;j<substeps;j++){
   const dt=.1/substeps,next={u:clamp(p.u+dx/length*dt*.35,.04,.96),v:clamp(p.v+dy/length*dt*.6,.1,.96),jump:Math.max(0,p.jump-dt)};
   assert.equal(A.step(s,dt,p,next).length,0,`${s.definition.name}: route hit at ${s.time}`);p=next;
  }
 }
 assert.ok(s.done);
}
console.log('PASS safe routes for all seven attacks at 10, 20 and 60fps');
