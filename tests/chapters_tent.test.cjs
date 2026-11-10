const assert=require('node:assert/strict');
require('../level.js');require('../forest-data.js');require('../circus-data.js');require('../interior-data.js');require('../gate-model.js');require('../world.js');require('../shop-model.js');require('../save-model.js');require('../chapter-model.js');require('../circus-art.js');
const W=SpawnWorld;W.setDynamicProvider(()=>GateModel.colliders(1));
const footprint=CircusData.tent.rect;
for(let i=0;i<24;i++){const a=i*Math.PI/12;assert.ok(W.blocked(footprint.x+Math.cos(a)*footprint.rx*.8,footprint.y+Math.sin(a)*footprint.ry*.8),'solid tent sector '+i)}
for(const start of [{x:700,y:-975},{x:768,y:-975},{x:830,y:-975}]){const a={...start};assert.ok(!W.blocked(a.x,a.y));W.move(a,0,-550,()=>assert.ok(!W.blocked(a.x,a.y),'tent sweep cannot tunnel'));assert.ok(a.y> -1120)}
assert.equal(W.route(CircusData.transition.northArrival,{x:768,y:-1600}).length,0);
const hero={x:768,y:-960};for(const [t,wanted]of [[7.3,1],[7.45,0],[7.49,0],[7.7,1]])assert.ok(Math.abs(CircusArt.eyeState(t,hero).openness-wanted)<1e-7,'eye openness at '+t);
assert.ok(CircusArt.eyeState(7.38,hero).openness>0&&CircusArt.eyeState(7.38,hero).openness<1);assert.ok(CircusArt.eyeState(7.6,hero).openness>0&&CircusArt.eyeState(7.6,hero).openness<1);
assert.ok(CircusArt.gaze({x:600,y:-960}).x<CircusArt.gaze({x:930,y:-960}).x);
W.setZone('interior');
assert.equal(InteriorData.benches.length,4);assert.equal(InteriorData.spectators.length,12);
for(const b of InteriorData.benches){const a=(b.start+b.end)/2;assert.ok(W.blocked(b.cx+Math.cos(a)*b.rx,b.cy+Math.sin(a)*b.ry),'bench has matching solid geometry')}
for(const p of InteriorData.posters){assert.ok(p.side<0?p.x+p.w<=450:p.x>=1086,'poster is completely on wall');assert.ok(!W.blocked(p.approach.x,p.approach.y),'poster is readable from safe floor');assert.ok(W.route(InteriorData.hall.spawn,p.approach).length,'each inscription is reachable');assert.ok(p.text.length>50)}
const s={version:1,gameVersion:'0.28',location:'meadow',playTime:12,animationTime:12,teto:{x:766,y:810,dir:0},miku:{x:823,y:855,dir:0},trail:[{x:823,y:855},{x:766,y:810}],wallet:ShopModel.fresh(),flags:{introSeen:false,helpSeen:false}};
assert.deepEqual(ChapterModel.list(s).map(c=>c.completed),[false,false,false,false,false,false]);assert.equal(ChapterModel.destination('awakening',s),null);
s.flags.introSeen=true;assert.ok(ChapterModel.destination('awakening',s));assert.equal(ChapterModel.destination('flower',s),null);
ShopModel.grant(s.wallet,'golden-key');Object.assign(s.flags,{flowerDefeated:true,gateOpened:true,tentDiscussed:true,tentEntered:true});
const before=JSON.stringify(s);for(const id of ['awakening','flower','big-top']){const next=ChapterModel.destination(id,s);assert.ok(SaveModel.valid(next),id);assert.deepEqual(next.wallet,s.wallet);assert.deepEqual(next.flags,s.flags);assert.equal(next.playTime,12)}assert.equal(JSON.stringify(s),before,'chapter travel leaves the original checkpoint immutable');
assert.equal(ChapterModel.destination('gumi',s),null);assert.equal(ChapterModel.destination('neru',s),null);assert.equal(ChapterModel.destination('miku-hypnosis',s),null);assert.equal(ChapterModel.definitions[4].title,'Мику?');assert.equal(ChapterModel.definitions[5].id,'neru');
console.log('PASS solid tent/radial sweeps, continuous blink and gaze, curved bench collision, wall poster approaches, completed-only chapters and immutable progress-preserving destinations');
