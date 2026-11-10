const assert=require('node:assert/strict');
require('../miku-turn-model.js');require('../miku-backdrop-art.js');
for(const dt of [1/30,1/60,1/120]){
 const m=new MikuTurnModel.Turns({dialogue:true}),p={u:.9,v:.2,jump:.8,walk:30,dir:1};
 assert.equal(m.command('guard'),false);assert.equal(m.beginEnemy(p),false);m.finishDialogue();
 for(let turn=1;turn<=3;turn++){
  assert.equal(m.command('guard'),true);assert.equal(m.command('attack'),false);
  for(let t=0;t<2&&m.phase==='player';t+=dt)m.update(dt,p);
  assert.equal(m.phase,'platform-in');assert.equal(m.turn,turn);assert.deepEqual([p.u,p.v,p.walk,p.jump],[.5,.5,0,0]);
  let last=m.platformOpacity;
  for(let t=0;t<2&&m.phase==='platform-in';t+=dt){m.update(dt,p);assert.ok(m.platformOpacity>=last-1e-10);last=m.platformOpacity;}
  assert.equal(m.phase,'enemy');assert.equal(m.movable,true);m.update(40,p);assert.equal(m.phase,'enemy');
  p.u=.1;p.v=.9;p.walk=80;p.jump=.4;assert.equal(m.finishEnemy(p),true);assert.equal(m.movable,false);assert.equal(p.jump,0);assert.equal(m.finishEnemy(p),false);
  m.update(MikuTurnModel.timings.disappear/2,p);assert.ok(Math.abs(m.platformOpacity-.5)<1e-10);
  for(let t=0;t<2&&m.phase==='platform-out';t+=dt)m.update(dt,p);
  assert.equal(m.phase,'command');assert.equal(m.platformOpacity,0);assert.equal(m.canAct,true);
 }
}
require('../miku-animated-background.js');
const B=MikuAnimatedBackground;
for(let n=0;n<2;n++)for(let t=0;t<48;t+=.05){
 const p=B.patch(t,n);assert.ok(p.opacity>=0&&p.opacity<=1);
 const project=B.projector(p);for(const [u,v]of [[0,0],[.8,.8],[-.8,-.8]]){const q=project(u,v);assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.y));}
}
assert.equal(MikuBackdropArt.scale,1.25);
assert.ok(MikuBackdropArt.patches(2.2).every(p=>p.opacity>.9));
console.log('PASS Miku turn lifecycle; two enlarged 3D patches; finite projections and soft fades.');
