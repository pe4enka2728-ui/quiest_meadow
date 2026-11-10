const {test}=require('node:test');const assert=require('node:assert/strict');require('../level.js');require('../forest-data.js');require('../world.js');const W=SpawnWorld;
test('all critical approaches and spawn are reachable',()=>{for(const p of [[766,810],[340,550],[1160,585],[766,120],[910,605],[440,420]])assert(!W.blocked(...p),String(p));for(const p of [[340,550],[1160,585],[766,120],[910,605]])assert(W.route({x:766,y:810},{x:p[0],y:p[1]}).length,String(p))});
test('every rendered bush has exactly one corresponding solid collider',()=>{assert(LevelData.bushes.length>200);for(const b of LevelData.bushes){const c=W.obstacles.find(o=>o.id===b.id);assert(c);assert.equal(c.x,b.x);assert.equal(c.rx,b.rx);assert(W.blocked(b.x,b.y),b.id)}});
test('both signs, help board and both pillars cannot be crossed from below',()=>{for(const o of [...Object.values(LevelData.signs),...LevelData.posts]){const p={x:o.x+o.w/2,y:o.y+o.h+80};assert(!W.blocked(p.x,p.y),o.id+' approach');W.move(p,0,-250);if(!o.id.startsWith('arch-'))assert(p.y>=o.y+o.h+W.RADIUS-.1,o.id);else assert(W.blocked(o.x+o.w/2,o.y+o.h/2),o.id);assert(!W.blocked(p.x,p.y),o.id+' penetration')}});
test('old shop sign location is free and new side sign is solid',()=>{assert(!W.blocked(340,502));assert(W.blocked(540,390));assert(W.blocked(540,435));assert(W.blocked(1160,540));assert(W.blocked(910,465))});
test('tree crowns are walkable, trunks are solid',()=>{for(const p of [[141,608],[366,750],[1159,744],[1394,638]])assert(!W.blocked(...p),String(p));for(const p of [[141,675],[366,819],[1159,816],[1394,708]])assert(W.blocked(...p),String(p))});
test('sliding along shop surface does not stick or enter obstacle',()=>{const p={x:340,y:550};W.move(p,0,-100);const x=p.x;W.move(p,120,-100);assert(p.x>x+80);assert(!W.blocked(p.x,p.y))});
test('right bench blocks the space under the seat and permits sliding around its ends',()=>{
 assert(W.blocked(1298,861),'gap below the seat must be closed');
 assert.equal(W.route({x:1298,y:750},{x:1298,y:861}).length,0);
 const p={x:1298,y:750};W.move(p,0,300);assert(p.y<780,'cannot walk through the backrest');
 const before=p.x;W.move(p,100,65);assert(p.x>before+85,'sliding along the bench must not stick');assert(!W.blocked(p.x,p.y));
 for(const [start,delta]of [[{x:1200,y:815},[250,0]],[{x:1400,y:815},[-250,0]]]){
  assert(!W.blocked(start.x,start.y));W.move(start,...delta);assert(!W.blocked(start.x,start.y));assert(start.x<1240||start.x>1359,'cannot enter from the side');
 }
});
test('random continuous movements never enter natural border or props',()=>{const p={x:766,y:810};let seed=12;for(let i=0;i<4000;i++){seed=(seed*1664525+1013904223)>>>0;const a=seed/4294967296*Math.PI*2;W.move(p,Math.cos(a)*14,Math.sin(a)*14);assert(!W.blocked(p.x,p.y),`step ${i}`)}});
test('the organic border encloses the meadow while the arch corridor stays open',()=>{for(const p of [[30,30],[1500,30],[20,1000],[1500,1000]])assert.equal(W.route({x:766,y:810},{x:p[0],y:p[1]}).length,0);assert(W.clear({x:766,y:300},{x:766,y:100}))});
test('new arch post capitals, shafts and bases are solid while the lintel stays walkable',()=>{
 for(const p of LevelData.posts)for(const y of [p.y+7,p.y+60,p.y+120]){const c=W.contacts(p.x+p.w/2,y).find(c=>c.label===p.label);assert(c&&c.d<0,p.id+' silhouette at '+y)}
 for(const x of [752,766,782])assert(W.clear({x,y:320},{x,y:100}),'clear lane '+x);
 for(const p of LevelData.posts){const actor={x:p.x+p.w/2,y:p.y+p.h+80};W.move(actor,0,-250,()=>assert(!W.blocked(actor.x,actor.y),p.id+' penetrated'));assert(actor.y>=p.y+p.h+W.RADIUS-.1||actor.x>=p.x+p.w+W.RADIUS-.1||actor.x<=p.x-W.RADIUS+.1,p.id+' must stop or slide around the base');}
});
test('the northern room is connected, its props are solid and its forest border is closed',()=>{
 for(const point of [ForestData.transition.northArrival,ForestData.savePoint,ForestData.arena,{x:420,y:-435},{x:1020,y:-595}]){assert(!W.blocked(point.x,point.y));const path=W.route({x:766,y:810},point);assert(path.length,'northern target unreachable');let from={x:766,y:810};for(const next of path){assert(W.clear(from,next));from=next}}
 for(const prop of ForestData.colliders)assert(W.blocked(prop.x+prop.w/2,prop.y+prop.h/2),prop.id);
 assert(!W.blocked(450,-750),'tree crown should be walkable');
 for(const point of [{x:20,y:-880},{x:1500,y:-880}])assert.equal(W.route(ForestData.transition.northArrival,point).length,0);
});
