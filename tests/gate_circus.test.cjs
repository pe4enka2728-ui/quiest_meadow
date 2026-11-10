const assert=require('node:assert/strict');
require('../level.js');require('../forest-data.js');require('../circus-data.js');require('../gate-model.js');require('../world.js');require('../shop-model.js');require('../save-model.js');
const W=SpawnWorld;
assert.equal(ForestData.stones.length,2);assert.ok(!ForestData.stones.some(s=>s.x<768&&s.x+s.w>768));
W.setDynamicProvider(()=>GateModel.colliders(0));
assert.equal(W.route({x:768,y:-620},CircusData.transition.northArrival).length,0,'the closed gate cannot be bypassed');
const actor={x:768,y:-620};W.move(actor,0,-400);assert.ok(actor.y>=GateModel.data.y+19-.1);
for(const openness of [0,.2,.5,.8,1]){
 W.setDynamicProvider(()=>GateModel.colliders(openness));
 for(const s of GateModel.segments(openness))assert.ok(W.blocked((s.a.x+s.b.x)/2,(s.a.y+s.b.y)/2),'each visible leaf is solid');
}
W.setDynamicProvider(()=>GateModel.colliders(1));
assert.ok(W.clear({x:768,y:-620},CircusData.transition.northArrival));
for(const x of [60,1476])assert.ok(W.clear({x:768,y:-620},{x,y:-620}),'the side branch is clear');
for(const p of [CircusData.transition.northArrival,CircusData.tent.entrance]){assert.ok(!W.blocked(p.x,p.y));assert.ok(W.route({x:768,y:-620},p).length)}
assert.equal(W.route(CircusData.tent.entrance,{x:768,y:-1600}).length,0,'bushes seal both sides of the tent');
assert.ok(W.blocked(768,-1210),'the tent wall is solid');
const wallet=ShopModel.fresh();ShopModel.grant(wallet,'golden-key');
const snapshot={version:1,gameVersion:'0.26',location:'circus',playTime:100,animationTime:40,teto:{x:768,y:-1040,dir:0},miku:{x:768,y:-954,dir:0},trail:[{x:768,y:-954},{x:768,y:-1040}],wallet,flags:{introSeen:true,helpSeen:true,gateOpened:true}};
W.setDynamicProvider(()=>GateModel.colliders(0));assert.ok(SaveModel.valid(snapshot),'a saved open gate is validated independently from the live closed gate');
snapshot.location='forest';snapshot.teto.y=GateModel.data.y;snapshot.miku.y=GateModel.data.y+86;snapshot.trail=[{x:768,y:snapshot.miku.y},{x:768,y:snapshot.teto.y}];assert.ok(SaveModel.valid(snapshot),'a snapshot on the open threshold stays loadable');
snapshot.flags.gateOpened=false;assert.ok(!SaveModel.valid(snapshot));
const old={...snapshot,gameVersion:'0.25',teto:{x:710,y:-681,dir:0},miku:{x:710,y:-600,dir:0},trail:[{x:710,y:-600},{x:710,y:-681}],flags:{introSeen:true,helpSeen:true}};
assert.ok(SaveModel.valid(old));assert.equal(SaveModel.migrate(old).teto.y,-600);assert.equal(old.teto.y,-681);
console.log('PASS three clear branches, removed central rune, impassable locked gate, hinged collision, third-room/tent access, state-aware saves and legacy migration');
