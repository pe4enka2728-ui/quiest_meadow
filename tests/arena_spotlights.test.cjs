const assert=require('node:assert/strict');
require('../level.js');require('../forest-data.js');require('../circus-data.js');require('../interior-data.js');require('../gate-model.js');require('../world.js');require('../curtain-art.js');require('../circus-spotlights.js');require('../shop-model.js');require('../save-model.js');
const a=InteriorData.arena,c=a.curtain,edge=CurtainArt.footprint(c),collider=InteriorData.colliders.find(c=>c.id==='closed-back-curtain');
assert.equal(collider.type,'poly');assert.deepEqual(collider.points.slice(3,-1),edge.slice().reverse(),'art and collision share the same bowed hem');
assert.ok(CurtainArt.bounds(c).top>=-3600,'upper supports stay in the viewport');
const W=SpawnWorld;W.setZone('interior');
for(const [x,y]of edge.slice(8,-8)){assert.ok(W.blocked(x,y-4),'stage edge is solid');if(!W.blocked(x,y+32))assert.ok(!W.blocked(x,y+42),'floor below hem is usable')}
for(const x of [610,690,850,920]){const p={x,y:-3240};assert.ok(!W.blocked(p.x,p.y));for(let i=0;i<90;i++)W.move(p,0,-3);assert.ok(!W.blocked(p.x,p.y),'no penetration when pushing on arc');const before=p.x;for(let i=0;i<12;i++)W.move(p,x<768?2:-2,0);assert.ok(Math.abs(p.x-before)>15,'slides along curved stage');assert.ok(!W.blocked(p.x,p.y))}
assert.equal(a.spotlights.length,3);const sectors=new Set();
for(const light of a.spotlights){for(let i=0;i<200;i++){const p=CircusSpotlights.target(light,i),r=a.ring;assert.ok(((p.x-r.cx)/r.rx)**2+((p.y-r.cy)/r.ry)**2<1);sectors.add((p.x>r.cx?'E':'W')+(p.y>r.cy?'S':'N'))}
 for(let t=0;t<60;t+=.1){const s=CircusSpotlights.state(light,t),n=CircusSpotlights.state(light,t+1/60);assert.deepEqual(s,CircusSpotlights.state(light,t),'deterministic drawing');assert.ok(Math.hypot(s.focus.x-n.focus.x,s.focus.y-n.focus.y)<3.2,'smooth motion without random frame jitter')}
}assert.equal(sectors.size,4,'random focuses cover every quadrant');
const wallet=ShopModel.fresh();ShopModel.grant(wallet,'golden-key');const old={version:1,gameVersion:'0.29',location:'tent-arena',playTime:30,animationTime:30,teto:{x:768,y:-3300,dir:0},miku:{x:840,y:-3260,dir:0},trail:[{x:840,y:-3260},{x:768,y:-3300}],wallet,flags:{introSeen:true,helpSeen:true,gateOpened:true,tentEntered:true}};
assert.ok(SaveModel.valid(old));const migrated=SaveModel.migrate(old);assert.ok(!W.blocked(migrated.teto.x,migrated.teto.y));assert.deepEqual(migrated.wallet,wallet);assert.equal(old.teto.y,-3300,'old checkpoint is not mutated');
console.log('PASS curved stage collision, sliding, viewport bounds, 3 independent smooth lights, full-circle targets and old arena-save migration');
