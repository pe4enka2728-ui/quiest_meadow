const {test}=require('node:test');const assert=require('node:assert/strict');require('../actors.js');const A=ActorMotion;
test('near-equal diagonal deltas keep facing despite rounding noise',()=>{const body={dir:1};for(let i=0;i<500;i++){const n=i%2?.00001:-.00001;A.facing(body,1+n,1-n);assert.equal(body.dir,1)}A.facing(body,-1,-1);assert.equal(body.dir,0);for(let i=0;i<100;i++){A.facing(body,-1+i/100000,-1);assert.equal(body.dir,0)}});
test('walking cycles progress by each actors travel, rest does not change facing',()=>{const b={x:1,y:1,dir:2};const old={x:0,y:0};A.update(b,old,.016);const walk=b.walk;A.update(b,{x:1,y:1},.5);assert.equal(b.walk,walk);assert.equal(b.moving,false);assert.equal(A.pose(b,1).frame,7);assert.notEqual(A.pose(b,0).scaleY,A.pose(b,1).scaleY)});
test('all idle actors breathe asynchronously and front-facing ones blink',()=>{for(const seed of [0,1.8,3.1]){const b={dir:2,seed,moving:false};assert.notEqual(A.pose(b,0).scaleY,A.pose(b,.5).scaleY);assert(Array.from({length:110},(_,i)=>A.pose(b,i*.05)).some(p=>p.blink));}assert.notEqual(A.pose({dir:2,seed:0},0).scaleY,A.pose({dir:2,seed:1.8},0).scaleY)});
test('Miku interaction requires facing her within the conversation range',()=>{for(const [dir,target]of [[0,{x:0,y:-80}],[1,{x:80,y:0}],[2,{x:0,y:80}],[3,{x:-80,y:0}]]){const p={x:0,y:0,dir};assert(A.facesTarget(p,target));assert(!A.facesTarget(p,{x:-target.x,y:-target.y}));}assert(A.facesTarget({x:0,y:0,dir:1},{x:60,y:60}));assert(!A.facesTarget({x:0,y:0,dir:1},{x:10,y:80}));assert(!A.facesTarget({x:0,y:0,dir:1},{x:120,y:0}))});
test('long idle waits, plays different gestures, rests between repeats and preserves facing',()=>{
 for(const [style,settings]of Object.entries(A.idleSettings)){
  const b={x:25,y:40,dir:2,idleStyle:style,rest:settings.delay-.01};assert.equal(A.longIdle(b),null);
  b.rest=settings.delay+.8;const first=A.longIdle(b);assert.equal(first.name,style==='teto'?'stretch':'sway');assert(first.progress>0&&first.progress<1);
  const pose=A.pose(b,4);assert(pose.idle);assert.equal(pose.frame,7);assert.equal(b.dir,2);assert.equal(b.x,25);assert.equal(b.y,40);
  b.rest=settings.delay+settings.duration+.01;assert.equal(A.longIdle(b),null);
  b.rest=settings.delay+settings.period+.8;assert(Math.abs(A.longIdle(b).progress-first.progress)<1e-12);
 }
 assert.equal(A.longIdle({dir:2,rest:100}),null);
});
test('movement and disabled world gestures cancel long idle immediately',()=>{
 const b={x:1,y:0,dir:2,idleStyle:'teto',rest:13};assert(A.pose(b,1).idle);assert.equal(A.pose(b,1,false).idle,null);
 A.update(b,{x:0,y:0},.02);assert.equal(b.rest,0);assert.equal(A.pose(b,1).idle,null);assert.equal(b.dir,1);
 A.update(b,{x:1,y:0},.02);assert.equal(A.pose(b,1).idle,null);
});
