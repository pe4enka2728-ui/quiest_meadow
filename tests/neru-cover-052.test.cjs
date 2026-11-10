const assert=require('node:assert/strict');
for(const m of ['level','forest-data','circus-data','heart-road-data','interior-data','curtain-progress','gate-model','heart-games-model','heart-trials-data','heart-trials-model','cloud-world-data','world','neru-scene-model','shop-model','heart-quest-model','save-model','developer-presets'])require('../'+m+'.js');
const M=NeruSceneModel;
// Every column stops direct approaches from all sides, including a jump and a large step.
for(const c of M.columns){
 assert(Math.hypot((c.u-.5)/.43,(c.v-.52)/.42)<.85);
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const p={u:c.u-dx*1.1/12,v:c.v-dy*1.1/8,walk:0,jump:.72,z:0};
  M.move(p,.8,{dx,dy});assert(!M.blocked(p));
  assert(dx?(p.u-c.u)*dx<0:(p.v-c.v)*dy<0,'tunnel through '+c.id);
 }
 const p={u:c.u-.09,v:c.v,walk:0,jump:0};
 for(let i=0;i<45;i++){M.move(p,.02,{dx:1,dy:1});assert(!M.blocked(p));}
 assert(p.u>c.u&&p.v>c.v,'must slide around '+c.id);
 const a={u:c.u,v:c.v-.15,z:1},b={u:c.u,v:c.v+.15,z:1};assert.equal(M.coverBetween(a,b)?.id,c.id);
 assert.equal(M.coverBetween({...a,z:7},{...b,z:7}),null);
 assert.equal(M.coverBetween({u:c.u+.09,v:a.v,z:1},{u:c.u+.09,v:b.v,z:1}),null);
}
assert.equal(M.coverBetween({u:.5,v:.05},{u:.5,v:.9}),null);
SpawnWorld.setZone('cloud-island');const cube=CloudWorldData.cube;
assert(SpawnWorld.blocked(cube.x,438));for(const y of [420,438,458])assert(SpawnWorld.blocked(cube.x,y));
for(const side of [-1,1]){const p={x:cube.x+side*120,y:438};assert(!SpawnWorld.clear(p,{x:cube.x,y:438}));SpawnWorld.move(p,-side*50,0);assert(!SpawnWorld.blocked(p.x,p.y));assert((p.x-cube.x)*side>65);assert(Math.abs(p.y-438)>5,'slide along cube edge');}
assert(!SpawnWorld.blocked(790,585));assert(!SpawnWorld.blocked(680,500));assert(!SpawnWorld.blocked(900,500));
const base={version:1,gameVersion:'0.51',playTime:2,animationTime:1,location:'meadow',teto:{x:766,y:810,dir:2},miku:{x:823,y:855,dir:2},trail:[{x:823,y:855},{x:766,y:810}],wallet:ShopModel.fresh(),flags:{introSeen:true,helpSeen:true}};
const old=DeveloperPresets.prepare(base,6);old.gameVersion='0.51';old.teto={x:750,y:450,dir:2};old.trail=[{x:750,y:450}];const migrated=SaveModel.migrate(old);assert(SaveModel.valid(migrated));assert.deepEqual(migrated.teto,CloudWorldData.spawn);
console.log('PASS 0.52: four solid columns, no tunneling/jumping through, sliding paths, cover rays, independent solid map cube and legacy relocation.');
