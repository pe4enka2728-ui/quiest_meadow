const {test}=require('node:test'),assert=require('node:assert/strict');
for(const n of ['level','forest-data','circus-data','heart-road-data','heart-quest-model','heart-trials-data','heart-trials-model','interior-data','gate-model','cloud-world-data','town-data','home-data','world','actors','town-people','party-follower','town-art'])require('../'+n+'.js');
const W=SpawnWorld,D=TownData;
function init(){W.setZone(D.id);TownPeople.reset();W.setZoneDynamicProvider(D.id,()=>TownPeople.colliders());PartyFollower.reset();}
test('holding into a pedestrian from all four directions cannot push it',()=>{
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){init();const npc=TownPeople.actors[0],origin={x:npc.x,y:npc.y},hero={x:npc.x-dx*60,y:npc.y-dy*60};
 W.move(hero,dx*40,dy*40);for(let n=0;n<250;n++){W.move(hero,dx*3.3,dy*3.3);TownPeople.step(.02,[hero]);}
 assert(Math.hypot(npc.x-origin.x,npc.y-origin.y)<.01,JSON.stringify({dx,dy,npc,origin}));assert(Math.hypot(hero.x-npc.x,hero.y-npc.y)>=27.7);assert(!W.blocked(hero.x,hero.y));}
});
test('Miku detours around a resident crossing the recorded trail and resumes following',()=>{
 init();const npc=TownPeople.actors[0];npc.x=1580;npc.y=820;
 const hero={x:1780,y:820},miku={x:1500,y:820},trail=[{...miku},{...hero}];let last={...miku},maxStep=0,minDistance=Infinity;
 for(let n=0;n<450;n++){PartyFollower.step(miku,hero,trail,.02);maxStep=Math.max(maxStep,Math.hypot(miku.x-last.x,miku.y-last.y));last={...miku};minDistance=Math.min(minDistance,Math.hypot(miku.x-npc.x,miku.y-npc.y));assert(!W.blocked(miku.x,miku.y));}
 assert(PartyFollower.status().detours>0);assert(Math.hypot(hero.x-miku.x,hero.y-miku.y)<90);assert(maxStep<=5.51);assert(minDistance>=27.7);assert.deepEqual({x:npc.x,y:npc.y},{x:1580,y:820});
});
test('a newly occupied follow anchor does not freeze Miku on a two-point saved trail',()=>{
 init();const npc=TownPeople.actors[0];npc.x=1694;npc.y=820;const hero={x:1780,y:820},miku={x:1500,y:820},trail=[{...miku},{...hero}];for(let n=0;n<400;n++)PartyFollower.step(miku,hero,trail,.02);assert(miku.x>1660);assert(Math.hypot(hero.x-miku.x,hero.y-miku.y)<90);hero.x+=180;trail.push({...hero});for(let n=0;n<400;n++)PartyFollower.step(miku,hero,trail,.02);assert(miku.x>1860);assert(Math.hypot(hero.x-miku.x,hero.y-miku.y)<90);
});
test('fountain basin stops swept movement from every side, leaving a walkable ring',()=>{
 init();W.setZoneDynamicProvider(D.id,()=>[]);const f=D.fountain;
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const body={x:f.x-dx*190,y:f.y+11-dy*130};W.move(body,dx*400,dy*300,null,[]);assert(!W.blocked(body.x,body.y,14,[]));assert((body.x-f.x)*dx+(body.y-f.y-11)*dy<0);}
 assert(W.route({x:f.x-180,y:f.y+115},{x:f.x+180,y:f.y+115},[]).length);
});
test('sloping rail depth follows its local ground position and Haru alone opens the shop',()=>{
 const rail=D.foreground.find(p=>p.id==='quay-east');assert(TownArt.depthAt(rail,1360)<TownArt.depthAt(rail,900)-70);
 globalThis.TownPeople={nearby:()=>null};for(const stall of D.stalls){const near=TownArt.nearby({...stall.approach,dir:0});assert.equal(near?.type,stall.vendor?'vendor':undefined);}
 const s=D.stalls.find(s=>s.vendor);assert.equal(D.vendor.height,88*s.scale);assert.equal(D.vendor.x,s.x+(336-340)*s.scale);assert.equal(D.vendor.y,s.y+(425-467)*s.scale);
});
