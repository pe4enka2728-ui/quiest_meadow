const assert=require('node:assert/strict');
for(const m of ['level','forest-data','circus-data','heart-road-data','interior-data','curtain-progress','gate-model','heart-games-model','heart-trials-data','heart-trials-model','cloud-world-data','world','shop-model','heart-quest-model','save-model','developer-presets','neru-scene-model','neru-rig-data'])require('../'+m+'.js');
const N=NeruSceneModel;
assert.equal(N.sky(0).night,0);assert.equal(N.sky(6).night,1);assert.equal(N.sky(12).night,0);
let previous=N.sky(0).night;for(let t=.01;t<=24;t+=.01){const q=N.sky(t).night;assert(q>=0&&q<=1);assert(Math.abs(q-previous)<.003);previous=q;}
const player={u:.5,v:.52,walk:0,jump:N.settings.jumpDuration,dir:0};let highest=0;
for(let i=0;i<1000;i++){N.move(player,.02,{dx:1,dy:-1});highest=Math.max(highest,player.z);assert(Math.hypot((player.u-.5)/.43,(player.v-.52)/.42)<=1+1e-10);}
assert(highest>55);assert.equal(player.z,0);
assert.equal(CloudWorldData.columns.length,4);SpawnWorld.setZone('cloud-island');for(const c of CloudWorldData.columns)assert(SpawnWorld.blocked(c.x,c.y));for(const p of [CloudWorldData.spawn,CloudWorldData.companion,{x:790,y:585}])assert(!SpawnWorld.blocked(p.x,p.y));
const base={version:1,gameVersion:'0.51',playTime:3,animationTime:2,location:'meadow',teto:{x:766,y:810,dir:2},miku:{x:823,y:855,dir:2},trail:[{x:823,y:855},{x:766,y:810}],wallet:ShopModel.fresh(),flags:{introSeen:true,helpSeen:true}};
const cloud=DeveloperPresets.prepare(base,6);assert(SaveModel.valid(cloud));const battle=structuredClone(cloud);Object.assign(battle.flags,{neruMet:true,neruBattleReached:true});battle.activity={type:'neru-battle',id:'neru'};assert(SaveModel.valid(battle));
for(const key of ['neruMet','neruBattleReached']){const bad=structuredClone(battle);bad.flags[key]=false;assert(!SaveModel.valid(bad));}
const reset=DeveloperPresets.prepare(battle,1);assert(!reset.activity&&!reset.flags.neruBattleReached&&!reset.flags.neruDefeated);assert(SaveModel.valid(reset));
const legacy=structuredClone(cloud);legacy.gameVersion='0.50';Object.assign(legacy.teto,CloudWorldData.columns[0]);legacy.trail=[{x:legacy.teto.x,y:legacy.teto.y}];const migrated=SaveModel.migrate(legacy);assert(SaveModel.valid(migrated));assert.deepEqual(migrated.teto,CloudWorldData.spawn);assert.equal(legacy.gameVersion,'0.50');
// Original meshes, a single selected face, and all source curve paths resolved.
const rig=NeruOriginalRigData;assert.equal(rig.normal.parts.length,24);assert(rig.normal.parts.some(p=>p.name==='box'&&p.active));
for(const clip of Object.values(rig.clips)){assert(clip.bindings.every(b=>rig.normal.nodes.some(n=>n.path===b.path)));assert(clip.samples.flat().every(Number.isFinite));const b=clip.bindings.find(b=>b.type===114);if(b)for(const sample of clip.samples){const raw=new DataView(new ArrayBuffer(4));raw.setFloat32(0,sample[b.offset],true);assert(rig.faceKeys[String(raw.getUint32(0,true))]);}}
assert.notDeepEqual(rig.clips['476'].samples[0],rig.clips['476'].samples[30]);
let callback=null,begun=0,flags=[];globalThis.DialogueUI={isOpen:false,open(g,o){this.isOpen=true;callback=o.onDone;},close(){this.isOpen=false;}};globalThis.BattleUI={isOpen:false};require('../neru-encounter.js');NeruEncounter.init({lock(){},flag:k=>flags.push(k),battle(){begun++;}});
NeruEncounter.begin();const stale=callback;NeruEncounter.cancel();stale({completed:true});NeruEncounter.update(10);assert.equal(begun,0);assert.deepEqual(flags,[]);
NeruEncounter.begin();callback({completed:true});NeruEncounter.update(N.settings.entryDuration-.001);assert.equal(begun,0);NeruEncounter.update(.002);assert.equal(begun,1);assert(!NeruEncounter.isActive);assert.equal(NeruEncounter.status().phase,'battle');assert(flags.includes('neruBattleReached'));
console.log('PASS 0.51: smooth day/night, cloud boundary and jump, four solid columns, original Neru meshes/curves/faces, save migration/rollback, cancelled dialogue, staged battle gate.');
