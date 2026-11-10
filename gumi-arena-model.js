/* Pure deterministic arena state: 5 plates × 5 cells. No rendering or wall-clock timers. */
(()=>{
'use strict';
const settings=Object.freeze({columns:5,rows:5,width:12,depth:8,maxHp:300,phaseTwoHp:150,phaseWarning:5,colorWarning:5,collapseWarning:2,floorRecovery:3,fallDuration:.65,jumpDuration:.9,jumpHeight:1.8,fallDepth:4,lightEvery:7,lightStartup:1.05,lightRadius:.72,lightSpeed:2.0});
const gravity=8*settings.jumpHeight/settings.jumpDuration**2;
function createBody(){return {z:0,velocity:0,jump:0,grounded:true,falling:false,fallAge:0,dead:false};}
function setJump(s,remaining){const t=settings.jumpDuration-clamp(remaining,0,settings.jumpDuration),q=t/settings.jumpDuration;s.body=createBody();if(remaining>0)Object.assign(s.body,{z:4*settings.jumpHeight*q*(1-q),velocity:4*settings.jumpHeight/settings.jumpDuration*(1-2*q),jump:settings.jumpDuration-t,grounded:false});}
function jump(s){if(s.finale||s.body.falling||!s.body.grounded)return false;setJump(s,settings.jumpDuration);return true;}
function stepBody(s,dt,player){
 const b=s.body,out=[];if(b.dead)return out;
 const ground=supported(s,player);
 if(b.grounded&&!ground){b.grounded=false;b.falling=true;out.push({type:'fall-start',cell:cellId(player)});}
 if(!b.grounded){
  b.z+=b.velocity*dt-gravity*dt*dt/2;b.velocity-=gravity*dt;b.jump=Math.max(0,b.jump-dt);
  if(b.z<=1e-8&&b.velocity<0&&!b.falling){if(ground)Object.assign(b,createBody());else{b.falling=true;b.jump=0;out.push({type:'fall-start',cell:cellId(player)});}}
  if(b.falling){b.fallAge+=dt;if(b.z<=-settings.fallDepth){b.dead=true;out.push({type:'fatal-fall',bypassInvulnerability:true,cell:cellId(player)});}}
 }
 return out;
}
const palette=['#ffd75c','#80e5cf','#ee8aba','#a7a4ff','#ff9e62','#a9df72'];
const rainbow=[{name:'КРАСНЫЙ',color:'#ef6572'},{name:'ОРАНЖЕВЫЙ',color:'#f29a48'},{name:'ЖЁЛТЫЙ',color:'#f0d45d'},{name:'ЗЕЛЁНЫЙ',color:'#76c87c'},{name:'ГОЛУБОЙ',color:'#74d9ef'},{name:'СИНИЙ',color:'#6887e8'},{name:'ФИОЛЕТОВЫЙ',color:'#b985e2'}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n)},mix=(a,b,q)=>a+(b-a)*q;
function randomIndex(n,random){return Math.min(n-1,Math.max(0,Math.floor(random()*n)))}
function cellAt(p){return {col:clamp(Math.floor(p.u*5),0,4),row:clamp(Math.floor(p.v*5),0,4)}}
function cellCenter(id){return {u:(id%5+.5)/5,v:(Math.floor(id/5)+.5)/5}}
function cellId(p){const c=cellAt(p);return c.row*5+c.col}
function create(random=Math.random){const colors=[...palette],lights=Array.from({length:3},(_,i)=>({id:i,color:colors.splice(randomIndex(colors.length,random),1)[0],active:false,age:0,moveAge:0,moveDuration:1,from:{u:.5,v:.5},to:{u:.5,v:.5},position:{u:.5,v:.5},exposure:0}));return {time:0,round:1,bossHp:300,phase:1,phaseAge:0,transitioned:false,body:createBody(),permanent:new Set(),temporary:new Set(),red:new Set(),temporaryAge:0,temporaryMode:null,safeCells:[],lights,lightsSuppressed:false,finale:false,events:[],lastFall:[],falls:[]}}
function permanentIds(s){return s.phase>=2?Array.from({length:25},(_,i)=>i).filter(i=>i%5===0||i%5===4):[]}
function exists(s,id){return id>=0&&id<25&&!s.permanent.has(id)&&!s.temporary.has(id)}
function livingCells(s){return Array.from({length:25},(_,i)=>i).filter(i=>exists(s,i))}
function supported(s,p){return p.u>=0&&p.u<=1&&p.v>=0&&p.v<=1&&exists(s,cellId(p))}
function rescue(s,player){const live=livingCells(s);if(!live.length)return null;const id=live.reduce((best,id)=>{const a=cellCenter(id),b=cellCenter(best),d=p=>Math.hypot((p.u-player.u)*12,(p.v-player.v)*8);return d(a)<d(b)?id:best},live[0]);s.body=createBody();return {type:'god-rescue',cell:id,...cellCenter(id)};}
function target(s,random){const ids=livingCells(s);const c=cellCenter(ids[randomIndex(ids.length,random)]??12);return {u:clamp(c.u+(random()-.5)*.1,.06,.94),v:clamp(c.v+(random()-.5)*.1,.08,.92)}}
function setRound(s,round){s.round=Math.max(1,Math.floor(round));}
function setBossHp(s,hp){if(!Number.isFinite(hp))throw new TypeError('Boss HP must be finite');if(s.finale)return null;const old=s.bossHp;s.bossHp=clamp(hp,1,300);if(s.bossHp<=1){s.finale=true;s.red.clear();s.temporary.clear();s.temporaryMode=null;s.lightsSuppressed=true;for(const light of s.lights)light.active=false;s.events.push({type:'finale'});return 'finale'}if(old>150&&s.bossHp<=150&&!s.transitioned){s.phase=2;s.phaseAge=0;s.transitioned=true;s.red=new Set(permanentIds(s));s.temporary.clear();s.temporaryMode=null;s.events.push({type:'phase-two',cut:['left-shoulder','right-shoulder']});return 'phase-two'}return null}
function startCollapse(s,player,random=Math.random){
 if(s.phase!==2||s.phaseAge<settings.phaseWarning||s.finale)return false;
 const live=livingCells(s),pairs=[];
 for(const id of live)for(const other of [id+1,id+5])if(live.includes(other)&&(Math.floor(id/5)===Math.floor(other/5)||other===id+5)){const a=cellCenter(id),b=cellCenter(other),d=Math.min(Math.hypot((a.u-player.u)*12,(a.v-player.v)*8),Math.hypot((b.u-player.u)*12,(b.v-player.v)*8));if(d<6)pairs.push([id,other])}
 s.safeCells=pairs[randomIndex(pairs.length,random)]??[12,17];s.temporaryMode='collapse';s.temporaryAge=0;s.red=new Set(live.filter(id=>!s.safeCells.includes(id)));s.lightsSuppressed=true;return true;
}
function startStrip(s){if(s.phase!==2||s.phaseAge<settings.phaseWarning||s.finale)return false;s.temporaryMode='strip';s.temporaryAge=0;s.red=new Set(livingCells(s).filter(id=>id%5!==2));return true}
function startRainbow(s,player,random=Math.random){
 if(s.finale||s.phase===2&&s.phaseAge<settings.phaseWarning)return false;
 const live=livingCells(s),shuffled=[...live];for(let i=shuffled.length-1;i>0;i--){const j=randomIndex(i+1,random);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 const offset=randomIndex(7,random);s.cellColors={};shuffled.forEach((id,i)=>s.cellColors[id]=(i+offset)%7);
 const near=live.filter(id=>{const p=cellCenter(id);return Math.hypot((p.u-player.u)*12,(p.v-player.v)*8)<4});
 s.safeColor=s.cellColors[near[randomIndex(near.length,random)]??live[0]];s.safeCells=live.filter(id=>s.cellColors[id]===s.safeColor);s.temporaryMode='rainbow';s.temporaryAge=0;s.red=new Set(live.filter(id=>!s.safeCells.includes(id)));return true;
}
function restoreTemporary(s){const restart=s.lightsSuppressed;s.temporary.clear();s.red.clear();s.temporaryMode=null;s.temporaryAge=0;s.safeCells=[];s.cellColors=null;s.safeColor=null;if(!s.finale){s.lightsSuppressed=false;if(restart)for(const light of s.lights)if(light.active){light.age=0;light.moveAge=0;light.position={u:.5,v:.5};light.from={u:.5,v:.5};}}}
function updateLights(s,dt,player,random,damageEnabled){
 if(s.finale||s.lightsSuppressed)return;
 const wanted=Math.min(3,1+Math.floor(s.round/settings.lightEvery));
 for(const light of s.lights){
  if(light.id>=wanted)continue;
  if(!light.active){light.active=true;light.age=0;light.moveAge=0;light.position={u:.5,v:.5};light.from={...light.position};light.to=target(s,random);light.moveDuration=2.4+random()*1.4;s.events.push({type:'light-start',id:light.id,color:light.color})}
  light.age+=dt;
  const activeDelta=Math.max(0,Math.min(dt,light.age-settings.lightStartup));
  if(activeDelta<=0)continue;
  light.moveAge+=activeDelta;
  while(light.moveAge>=light.moveDuration){light.moveAge-=light.moveDuration;light.from={...light.to};light.to=target(s,random);light.moveDuration=2.4+random()*1.4;}
  const q=ease(light.moveAge/light.moveDuration);light.position={u:mix(light.from.u,light.to.u,q),v:mix(light.from.v,light.to.v,q)};
  if(damageEnabled&&Math.hypot((player.u-light.position.u)*12,(player.v-light.position.v)*8)<settings.lightRadius+.20){light.exposure+=activeDelta;while(light.exposure>=1-1e-9){light.exposure=Math.max(0,light.exposure-1);s.events.push({type:'damage',damage:1,source:'spotlight-'+light.id,bypassInvulnerability:true,grantsInvulnerability:false})}}
 }
}
function step(s,dt,player,options={}){
 if(!Number.isFinite(dt)||dt<=0||options.paused)return [];
 s.events=[];const random=options.random||Math.random;let remaining=dt;
 while(remaining>1e-9){const delta=Math.min(remaining,1/120);remaining-=delta;const frozen=options.worldFrozen||s.body.falling;s.time+=delta;
  if(s.finale)continue;
  if(!frozen){
  if(s.phase===2){const old=s.phaseAge;s.phaseAge+=delta;if(old<settings.phaseWarning&&s.phaseAge>=settings.phaseWarning){s.permanent=new Set(permanentIds(s));s.red.clear();s.lastFall=[...s.permanent];s.falls.push({time:s.time,cells:[...s.permanent]});s.events.push({type:'plates-fall',permanent:true,cells:[...s.permanent]})}}
  if(s.temporaryMode){const old=s.temporaryAge;s.temporaryAge+=delta;const at=s.temporaryMode==='strip'?1.1:s.temporaryMode==='rainbow'?settings.colorWarning:settings.collapseWarning;if(old<at&&s.temporaryAge>=at){s.temporary=new Set([...s.red]);s.lastFall=[...s.temporary];s.falls.push({time:s.time,cells:[...s.temporary]});s.red.clear();s.events.push({type:'plates-fall',permanent:false,cells:[...s.temporary]})}if(['collapse','rainbow'].includes(s.temporaryMode)&&s.temporaryAge>=at+settings.fallDuration+settings.floorRecovery){const chainNext=s.temporaryMode==='collapse';restoreTemporary(s);s.events.push({type:'plates-restored',chainNext})}}
  }
  const q=clamp((dt-remaining)/dt,0,1),from=options.before||player,point={u:mix(from.u,player.u,q),v:mix(from.v,player.v,q)};
  const bodyEvents=stepBody(s,delta,point);if(options.godMode&&(s.body.falling||s.body.dead)){const event=rescue(s,point);if(event)s.events.push(event);break;}s.events.push(...bodyEvents);if(s.body.dead)break;
  if(!frozen&&!s.body.falling)updateLights(s,delta,point,random,options.damageEnabled!==false);
 }
 s.falls=s.falls.filter(f=>s.time-f.time<1);return s.events.map(e=>({...e}));
}
function lightState(light){const age=light.age;return {...light,position:{...light.position},intensity:!light.active?0:age<settings.lightStartup?([0,.16,0,.5,0,.25,0,.8,0,1][Math.min(9,Math.floor(age/settings.lightStartup*10))]):1,armed:light.active&&age>=settings.lightStartup}}
function status(s){return {time:s.time,round:s.round,bossHp:s.bossHp,phase:s.phase,phaseAge:s.phaseAge,body:{...s.body},shaking:!s.finale&&!s.body.falling&&(s.phase===2&&s.phaseAge<5||s.temporaryMode==='collapse'&&s.temporaryAge<2+settings.fallDuration),cutShoulderStrings:s.transitioned,permanent:[...s.permanent],temporary:[...s.temporary],red:[...s.red],temporaryMode:s.temporaryMode,temporaryAge:s.temporaryAge,safeCells:[...s.safeCells],cellColors:s.cellColors?{...s.cellColors}:null,safeColor:s.safeColor??null,falls:s.falls.map(f=>({time:f.time,cells:[...f.cells]})),lightsSuppressed:s.lightsSuppressed,lights:s.lights.map(lightState),finale:s.finale}}
globalThis.GumiArenaModel={settings,palette,rainbow,create,setRound,setBossHp,cellAt,cellId,cellCenter,exists,supported,livingCells,startCollapse,startStrip,startRainbow,restoreTemporary,jump,setJump,rescue,step,status};
})();
