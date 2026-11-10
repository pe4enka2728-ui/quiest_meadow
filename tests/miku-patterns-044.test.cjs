const assert=require('node:assert/strict');
require('../miku-attacks-model.js');require('../miku-attacks-art.js');
const M=MikuAttackLab,A=MikuAttackArt,none={double:'never',mines:'never'},both={double:'always',mines:'always'};
const index=n=>M.definitions.findIndex(d=>d.number===n);
const sim=(n,seed=13,opts=none)=>new M.Simulation(index(n),seed,opts);
function until(s,time,input=()=>({})){while(s.attack.time+1e-8<time&&!s.attack.done)s.step(Math.min(1/60,time-s.attack.time),input(s));return s;}
function at(n,t,seed=13,opts=none){const s=M.create(index(n),seed,opts);s.time=t;return {s,entities:M.sample(s,{x:0,y:4,z:0})};}
function finite(v){if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);}
assert.deepEqual(M.definitions.map(d=>d.number),[1,2,4,5,6,7,8,10,12,14,15,16,18,19,20]);
assert.deepEqual(M.passiveDefinitions.map(d=>d.number),[3,17]);assert.equal(M.definitions.filter(d=>d.threeD).length,6);
for(const d of M.definitions)assert.equal(d.duration,d.baseDuration*2);
assert.equal(M.definitions[index(7)].duration,21);assert.equal(M.definitions[index(10)].duration,21);assert.equal(M.definitions[index(12)].duration,20);
const coverage=[];
for(const d of M.definitions){const s=sim(d.number),kinds=new Set();let warning=Infinity,active=Infinity,lastActive=0;
 while(!s.attack.done){const t=s.attack.time;s.step(1/30,{dx:Math.sin(t*.8),dy:Math.cos(t*.7)});for(const e of s.attack.entities){finite(e);kinds.add(e.kind);if(e.cue&&!e.intro)warning=Math.min(warning,s.attack.time);if(e.active){active=Math.min(active,s.attack.time);lastActive=s.attack.time;}}}
 assert.ok(warning<active,d.name+' lacks warning');assert.ok(active>=1.15,d.name+' unsafe start');assert.ok(lastActive>d.duration/2,d.name+' empty second half');assert.deepEqual(s.attack.entities,[]);
 coverage.push({number:d.number,name:d.name,duration:d.duration,firstWarning:warning,firstActive:active,lastActive,kinds:[...kinds]});
}
console.log('PASS 15 active patterns, six 3D, removed phases, doubled once, active second halves and cleanup.');
// Real probability checks over independent seeds, not a hard-coded favourable run.
let double=0,mines=0,joint=0,tall=0,waves=0,canonTall=0,canonWaves=0;
for(let seed=0;seed<3000;seed++){const s=M.create(index(1),seed),c=M.create(index(14),seed);double+=s.passives.double;mines+=s.passives.mines;joint+=s.passives.double&&s.passives.mines;tall+=s.phraseWaves.filter(w=>w.tall).length;waves+=s.phraseWaves.length;canonTall+=c.canonWaves.filter(w=>w.tall).length;canonWaves+=c.canonWaves.length;}
for(const p of [double/3000,mines/3000])assert.ok(p>.175&&p<.225,p);assert.ok(joint/3000>.025&&joint/3000<.055);
for(const p of [tall/waves,canonTall/canonWaves])assert.ok(p>.68&&p<.72,p);
const rates={double:double/3000,mines:mines/3000,joint:joint/3000,phraseTall:tall/waves,canonTall:canonTall/canonWaves};
const schedule=M.create(index(1),13,none);for(const burst of new Set(schedule.phraseWaves.map(w=>w.burst))){const ws=schedule.phraseWaves.filter(w=>w.burst===burst);assert.ok(ws.length===2||ws.length===3);for(let i=1;i<ws.length;i++)assert.equal(ws[i].fire-ws[i-1].fire,1);}
const first=schedule.phraseWaves[0];schedule.time=first.fire+.2;const g1=M.sample(schedule,{x:0,y:4,z:0}).filter(e=>e.kind==='glyph');schedule.time+=.2;const g2=M.sample(schedule,{x:0,y:4,z:0}).filter(e=>e.kind==='glyph');assert.ok(g1.some(e=>g2.find(q=>q.id===e.id)?.glyph!==e.glyph));assert.ok(new Set(g1.map(e=>e.x)).size>=17);
for(const number of [1,14]){let high,low;for(let seed=0;seed<100&&(!high||!low);seed++){const s=M.create(index(number),seed,none),ws=number===1?s.phraseWaves:s.canonWaves;for(const w of ws){s.time=w.fire+.45;const es=M.sample(s,{x:0,y:4,z:0}).filter(e=>(number===1?e.kind==='glyph':e.kind==='note')&&e.tall===w.tall);if(w.tall&&es.some(e=>e.row===1))high=es.find(e=>e.row===1);if(!w.tall&&es.length)low=es.find(e=>!e.tall);}}
 assert.ok(high&&low);assert.ok(M.collides(high,{x:high.x,y:high.y,z:1.8}));assert.equal(M.collides(low,{x:low.x,y:low.y,z:1.8}),false);}
console.log('PASS 20% independent passives, 70% tall waves, 2–3 waves one second apart, changing glyphs, density and jump blocking.',rates);
const pulse=at(2,3).entities.filter(e=>e.kind==='ring');assert.equal(new Set(pulse.map(e=>e.source)).size,2);assert.ok(pulse.every(e=>!e.gapHalf));
const cube=at(5,3.5).entities,impacts=cube.filter(e=>e.impact);assert.ok(impacts.length);assert.ok(impacts.every(e=>e.damage===5));
let witness;for(const e of impacts)for(let n=0;n<64;n++){const a=n/64*Math.PI*2,p={x:e.x+Math.cos(a)*e.r,y:e.y+Math.sin(a)*e.r,z:0};if(p.x> -5.4&&p.x<5.4&&p.y>.9&&p.y<7.5&&M.collides(e,p)&&!cube.some(q=>(q.damage??10)>5&&M.collides(q,p)))witness=p;}
assert.ok(witness);const five=sim(5);until(five,3.49);Object.assign(five.player,witness,{jump:0});five.lastHit=-Infinity;five.hp=100;five.step(.02);assert.equal(five.lastDamage,5);assert.equal(five.hp,95);
for(const t of [2.25,4.95]){const es=at(6,t).entities;assert.equal(es.filter(e=>e.kind==='tetra').length,1);const rings=es.filter(e=>e.kind==='ring');assert.ok(rings.length>=1);assert.ok(rings.every(e=>e.source===0));}
const pair=at(6,8.1).entities;assert.equal(pair.filter(e=>e.kind==='tetra').length,2);assert.deepEqual(pair.filter(e=>e.kind==='ring').map(e=>e.source),[0,1]);
const torus=at(7,5).entities.filter(e=>e.kind==='torus');assert.equal(torus.length,3);assert.ok(torus.every(e=>e.fade===1));
for(let t=1.5;t<21;t+=.01){const a=at(7,t).entities.filter(e=>e.kind==='torus'),b=at(7,t+.01).entities.filter(e=>e.kind==='torus');for(const e of a){const q=b.find(q=>q.id===e.id);if(q)assert.ok(Math.abs(q.fade-e.fade)<.02);}}
assert.ok(at(7,20.7).entities.filter(e=>e.kind==='torus').every(e=>e.fade<.1&&!e.active));
assert.equal(at(10,2).entities.filter(e=>e.kind==='chaser').length,2);
const zone=at(12,2.4).entities.find(e=>e.kind==='safe-window');assert.ok(Math.abs(zone.x-2.6*Math.sin(.4*1.1))<1e-8);
const rest=sim(12),sides=new Set(),notes=new Set();until(rest,20,s=>{for(const e of s.attack.entities)if(e.aimed){notes.add(e.id);sides.add(e.side);assert.equal(e.damage,10);}return {};});assert.equal(notes.size,18);assert.equal(sides.size,4);
assert.ok(at(15,5).entities.filter(e=>e.kind==='note').length>90);
assert.equal(at(16,3.9).entities.filter(e=>e.kind==='echo-source').length,2);assert.equal(at(16,5).entities.filter(e=>e.kind==='echo-source').length,4);
console.log('PASS two pulse origins, 5 HP impact waves, prism 1→2 cycle, smooth three tori, two chasers, fast safe window plus notes, dense spiral and 2→4 shadows.');
// Split edges at the actual camera plane, independent of jump height.
for(const z of [0,.8,1.8]){const commands=A.depthCommands(torus,{x:0,y:4,z}),atPlayer=commands.findIndex(c=>c.type==='player');assert.ok(atPlayer>0);let back=0,front=0;commands.forEach((c,i)=>{if(c.type!=='edge')return;if(i<atPlayer){back++;assert.ok(Math.max(c.a[1],c.b[1])<=4+1e-8);}else{front++;assert.ok(Math.min(c.a[1],c.b[1])>=4-1e-8);}});assert.ok(back&&front);}
for(const [shape,n]of [['octa',18],['cylinder',19],['icosa',20]]){const e=at(n,n===20?3:4).entities.find(e=>e.shape===shape);assert.ok(e?.vertices.length&&e.faces.length);assert.ok(M.collides({...e,z:.5,vertices:undefined},{x:e.x,y:e.y,z:0}));assert.equal(M.collides({...e,z:8,vertices:undefined},{x:e.x,y:e.y,z:0}),false);}
console.log('PASS front/back torus clipping and actual volumes of octahedra, cylinders and icosahedron.');
for(const d of M.definitions){const values=[];for(const dt of [1/30,1/60,1/120]){const s=sim(d.number,72,both);for(let t=0;t<6-1e-8;t+=dt)s.step(dt,{dx:.7,dy:-.3});values.push(s);}
 for(const b of values.slice(1)){const a=values[0];assert.ok(Math.abs(a.player.x-b.player.x)<1e-9);assert.ok(Math.abs(a.player.y-b.player.y)<1e-9);assert.deepEqual(a.attack.locks,b.attack.locks);assert.equal(a.attack.entities.length,b.attack.entities.length);assert.deepEqual(a.attack.passives,b.attack.passives);}}
const forced=sim(4,1,both);until(forced,3,s=>({dx:-3.5-s.player.x,dy:2.5-s.player.y}));assert.ok(forced.attack.entities.some(e=>e.passive==='double'));assert.ok(forced.attack.entities.some(e=>e.passive==='mines'));forced.paused=true;const paused=forced.status();forced.step(.2,{dx:1});assert.deepEqual(forced.status(),paused);assert.equal(forced.jump(),false);forced.reset(index(7),2,none);assert.deepEqual(forced.attack.passives,{double:false,mines:false});assert.equal(forced.attack.entities.length,0);
console.log('PASS 30/60/120 Hz with both passives, pause and reset cleanup.');
require('node:fs').writeFileSync(require('node:path').join(__dirname,'miku-coverage-044.json'),JSON.stringify({coverage,rates},null,2));
