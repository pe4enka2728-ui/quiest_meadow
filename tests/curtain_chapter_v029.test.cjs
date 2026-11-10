const assert=require('node:assert/strict');
require('../level.js');require('../forest-data.js');require('../circus-data.js');require('../interior-data.js');require('../gate-model.js');require('../world.js');require('../chapter-model.js');require('../curtain-art.js');
const c=InteriorData.arena.curtain,box=CurtainArt.bounds(c);
const edge=CurtainArt.footprint(c);assert.equal(c.shape,'semicircle');assert.ok(edge[edge.length>>1][1]>edge[0][1]+160);assert.ok(edge.every(p=>p[0]>=box.left&&p[0]<=box.right));
const segmentDistance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy)};
for(const b of InteriorData.benches)assert.ok(Math.min(...b.points.flatMap(p=>edge.slice(1).map((q,i)=>segmentDistance(p,edge[i],q))))>20,'curved stage has clearance beside every bench');
SpawnWorld.setZone('interior');assert.ok(SpawnWorld.clear({x:768,y:-2915},{x:768,y:-3160}),'Gumi approach remains free');assert.ok(SpawnWorld.route({x:768,y:-3160},{x:768,y:-3260}).length,'can walk around the solid NPC');assert.equal(SpawnWorld.route({x:768,y:-2915},{x:768,y:-3450}).length,0,'closed stage remains solid');
assert.equal(ChapterModel.definitions.length,6);assert.deepEqual(ChapterModel.definitions.slice(3).map(c=>c.id),['gumi','miku-hypnosis','neru']);const mystery=ChapterModel.definitions[4];assert.equal(mystery.title,'Мику?');assert.equal(mystery.children,true);assert.equal(ChapterModel.completed(mystery.id,{flags:{introSeen:true,tentEntered:true}}),false);assert.equal(ChapterModel.destination(mystery.id,{}),null);
console.log('PASS sixth chapter order/mystery lock, three-dimensional stage bounds, bench clearance, free Gumi approach and closed curtain barrier');
