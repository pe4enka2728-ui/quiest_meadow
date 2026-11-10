/* One proximity root per enemy action. Survives that action and the next one.
 * All timers stop during the player's choice and pause. No delayed callbacks. */
(()=>{
const settings={lifetimeTurns:2,spawnIncreaseEvery:3,spawnSafety:2,rootSeparation:2.3,growTime:.85,triggerRadius:1.35,strikeRadius:1.1,windup:.32,strikeTime:.20,cooldown:1,damage:5,height:1.3};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function create(){return {turn:0,serial:0,inEnemy:false,roots:[]}}
function spawnCount(turn){return 1+Math.floor(Math.max(0,turn)/settings.spawnIncreaseEvery)}
function beginTurn(state,player,random=Math.random){
 state.turn++;state.inEnemy=true;state.roots=state.roots.filter(r=>r.expiresAfter>=state.turn);
 const p=FlowerAttacks.playerPoint(player),created=[];
 for(let n=0;n<spawnCount(state.turn);n++){
  const candidates=[];
  for(let i=0;i<40;i++)candidates.push({x:-4.7+clamp(random(),0,1)*9.4,y:1.5+clamp(random(),0,1)*5.45});
  for(let x=-4.8;x<=4.81;x+=.8)for(let y=1.2;y<=7.01;y+=.8)candidates.push({x,y});
  const safe=candidates.filter(c=>Math.hypot(c.x-p.x,c.y-p.y)>=settings.spawnSafety);
  const separation=c=>state.roots.reduce((distance,r)=>Math.min(distance,Math.hypot(c.x-r.x,c.y-r.y)),99);
  // Prefer separated plants, then use the widest available gap on very long fights.
  // Crowd growth must never throw or stall the game when the arena fills up.
  const at=safe.find(c=>separation(c)>=settings.rootSeparation)||safe.sort((a,b)=>separation(b)-separation(a))[0];
  if(!at)continue;
  const r={id:'sentinel-'+(++state.serial),...at,bornTurn:state.turn,expiresAfter:state.turn+settings.lifetimeTurns-1,age:0,mode:'growing',phaseAge:0};
  state.roots.push(r);created.push(r);
 }
 state.spawnedThisTurn=created.length;return created;
}
function entity(r,turn,enabled=true){return {kind:'sentinel-root',shape:'circle',id:r.id,x:r.x,y:r.y,r:settings.strikeRadius,z0:0,z1:settings.height,active:enabled&&r.mode==='strike',mode:enabled?r.mode:r.mode==='growing'?'growing':'idle',age:r.age,phaseAge:r.phaseAge,growth:clamp(r.age/settings.growTime,0,1),remainingTurns:r.expiresAfter-turn+(enabled?1:0),windup:settings.windup}}
function entities(state,enabled=state.inEnemy){return state.roots.map(r=>entity(r,state.turn,enabled))}
function step(state,dt,from,to=from){
 if(!state.inEnemy||!Number.isFinite(dt)||dt<=0)return [];
 const count=Math.ceil(Math.min(dt,.1)*120),delta=Math.min(dt,.1)/count,hits=new Map();
 for(let i=1;i<=count;i++){
  const q=i/count,p=FlowerAttacks.playerPoint({u:from.u+(to.u-from.u)*q,v:from.v+(to.v-from.v)*q,jump:from.jump+(to.jump-from.jump)*q});
  for(const r of state.roots){
   r.age+=delta;r.phaseAge+=delta;
   if(r.mode==='growing'&&r.age>=settings.growTime){r.mode='idle';r.phaseAge=0}
   if(r.mode==='idle'&&Math.hypot(p.x-r.x,p.y-r.y)<settings.triggerRadius){r.mode='windup';r.phaseAge=0}
   else if(r.mode==='windup'&&r.phaseAge>=settings.windup){r.mode='strike';r.phaseAge=0}
   else if(r.mode==='strike'&&r.phaseAge>=settings.strikeTime){r.mode='rest';r.phaseAge=0}
   else if(r.mode==='rest'&&r.phaseAge>=settings.cooldown){r.mode='idle';r.phaseAge=0}
   if(FlowerAttacks.collides(entity(r,state.turn),p))hits.set(r.id,{id:r.id,damage:settings.damage});
  }
 }
 return [...hits.values()];
}
function endTurn(state){state.inEnemy=false;state.roots=state.roots.filter(r=>r.expiresAfter>state.turn);for(const r of state.roots){r.mode='idle';r.phaseAge=0}}
function status(state){return {turn:state.turn,inEnemy:state.inEnemy,spawnedThisTurn:state.spawnedThisTurn||0,roots:state.roots.map(r=>({...r,remainingTurns:r.expiresAfter-state.turn+(state.inEnemy?1:0)}))}}
globalThis.BattleRoots={settings,spawnCount,create,beginTurn,step,endTurn,entities,status};
})();
