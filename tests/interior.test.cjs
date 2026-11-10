const assert=require('node:assert/strict');
require('../level.js');require('../forest-data.js');require('../circus-data.js');require('../interior-data.js');require('../gate-model.js');require('../world.js');require('../shop-model.js');require('../save-model.js');
const W=SpawnWorld;
W.setDynamicProvider(()=>GateModel.colliders(1));
assert.equal(W.route(CircusData.tent.entrance,{x:768,y:-1600}).length,0,'hedges seal both routes behind the tent');
assert.ok(W.blocked(768,-1900),'outdoor boundaries remain closed above the tent room');
W.setZone('interior');
for(const p of [InteriorData.hall.spawn,InteriorData.hall.savePoint,{x:768,y:-2915},{x:768,y:-3260},{x:768,y:-1830}]){
 assert.ok(!W.blocked(p.x,p.y),JSON.stringify(p));
 assert.ok(W.route(InteriorData.hall.spawn,p).length,'corridor, crystal and arena connected');
}
for(const p of [{x:432,y:-2240},{x:1100,y:-2400},{x:948,y:-2230},{x:768,y:-3210},{x:768,y:-3320},{x:260,y:-3000},{x:1280,y:-3000}])assert.ok(W.blocked(p.x,p.y),'solid interior prop '+JSON.stringify(p));
assert.equal(W.route({x:768,y:-2915},{x:768,y:-3450}).length,0,'the curtain cannot be bypassed through the wings');
const a={x:768,y:-2915};for(let i=0;i<600;i++){W.move(a,Math.cos(i*1.71)*13,Math.sin(i*.37)*13);assert.ok(!W.blocked(a.x,a.y),'interior sweep '+i)}
const wallet=ShopModel.fresh();ShopModel.grant(wallet,'golden-key');
const interior={version:1,gameVersion:'0.27',location:'tent-hall',playTime:90,animationTime:90,teto:{x:998,y:-2175,dir:0},miku:{x:910,y:-2150,dir:0},trail:[{x:910,y:-2150},{x:998,y:-2175}],wallet,flags:{introSeen:true,helpSeen:true,gateOpened:true,tentDiscussed:true,tentEntered:true}};
W.setZone('outdoor');assert.ok(SaveModel.valid(interior),'interior saves validate in the outdoor layer');
const exterior={...interior,location:'circus',teto:{x:726,y:-1040,dir:0},miku:{x:810,y:-1000,dir:0},trail:[{x:810,y:-1000},{x:726,y:-1040}]};
W.setZone('interior');assert.ok(SaveModel.valid(exterior),'outdoor saves validate in the interior layer');
const old={...exterior,gameVersion:'0.26',flags:{introSeen:true,helpSeen:true,gateOpened:true},teto:{x:300,y:-1450,dir:0}};
assert.ok(SaveModel.valid(old));assert.equal(SaveModel.migrate(old).teto.y,CircusData.tent.outsideArrival.teto.y);assert.equal(old.teto.y,-1450);
assert.equal(SaveModel.valid({...old,trail:{invalid:true}}),false,'malformed legacy data is rejected without throwing');
console.log('PASS sealed tent, distinct collision layers, reachable corridor/crystal/arena, solid Gumi/curtain/wings, continuous movement and cross-layer checkpoint validation');
