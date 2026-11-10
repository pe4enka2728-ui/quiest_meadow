/* Attack seven is an independent five-round pressure mechanic, never a main pattern. */
(()=>{
'use strict';
const settings=Object.freeze({chance:.30,cooldown:2,rounds:5,gainPerRound:35,crystalsPerRound:3,crystalReduction:6,pickupRadius:.52,fireballTime:1,whiteoutTime:2});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),index=(n,r)=>clamp(Math.floor(r()*n),0,n-1);
function create(){return {active:false,phase:'idle',energy:0,age:0,rounds:0,lastRound:0,nextEligibleRound:1,roundAdded:0,roundDuration:1,crystals:[],collected:0,serial:0,events:[]}}
function candidates(arena){const live=GumiArenaModel.livingCells(arena),safe=live.filter(id=>!arena.red.has(id));return safe.length?safe:live;}
function place(arena,player,random,used=new Set()){
 const live=candidates(arena),distance=id=>{const p=GumiArenaModel.cellCenter(id);return Math.hypot((p.u-player.u)*12,(p.v-player.v)*8)};
 const near=live.filter(id=>distance(id)<4.4&&distance(id)>.65&&!used.has(id));const pool=near.length?near:live.filter(id=>!used.has(id));const id=(pool.length?pool:live)[index((pool.length?pool:live).length,random)]??12;used.add(id);const at=GumiArenaModel.cellCenter(id);return {cell:id,u:clamp(at.u+(random()-.5)*.07,.04,.96),v:clamp(at.v+(random()-.5)*.07,.04,.96)};
}
function beginRound(s,round,options){
 if(s.lastRound===round||['fireball','whiteout','spent'].includes(s.phase))return false;
 s.lastRound=round;const random=options.random||Math.random;
 if(!s.active){if(round<s.nextEligibleRound||!options.force&&random()>=settings.chance)return false;s.active=true;s.phase='charging';s.energy=0;s.rounds=0;s.collected=0;s.crystals=[];}
 if(s.rounds>=settings.rounds)return false;
 s.rounds++;s.roundAdded=0;s.roundDuration=Math.max(.1,options.duration);const used=new Set(s.crystals.map(c=>c.cell));for(let i=0;i<3;i++)s.crystals.push({id:'gumi-crystal-'+(++s.serial),...place(options.arena,options.player,random,used),round});
 return true;
}
function cancel(s){s.active=false;s.phase='idle';s.energy=0;s.age=0;s.crystals=[];}
function finishRound(s,round){if(!s.active||s.phase!=='charging'||s.rounds<settings.rounds)return false;s.active=false;s.phase='idle';s.crystals=[];s.nextEligibleRound=round+settings.cooldown+1;return true;}
function step(s,dt,from,to=from,options={}){
 if(!s.active||options.paused||!Number.isFinite(dt)||dt<=0)return [];
 const events=[];
 if(s.phase==='charging'){
  const random=options.random||Math.random,valid=new Set(candidates(options.arena)),used=new Set();
  for(const c of s.crystals){if(!valid.has(c.cell))Object.assign(c,place(options.arena,to,random,used));used.add(c.cell);}
  const dx=(to.u-from.u)*12,dy=(to.v-from.v)*8;
  s.crystals=s.crystals.filter(c=>{const cx=(c.u-from.u)*12,cy=(c.v-from.v)*8,q=clamp((cx*dx+cy*dy)/(dx*dx+dy*dy||1),0,1);if(Math.hypot(cx-dx*q,cy-dy*q)>settings.pickupRadius)return true;s.energy=Math.max(0,s.energy-6);s.collected++;events.push({type:'crystal-collected',id:c.id,reduction:6});return false;});
  if(options.charging){const add=Math.min(35-s.roundAdded,dt/s.roundDuration*35);s.roundAdded+=add;s.energy=clamp(s.energy+add,0,100);}
  if(s.energy>=100-1e-9){s.energy=100;s.phase='fireball';s.age=0;s.crystals=[];events.push({type:'overload-start'});}
 }else{
  s.age+=dt;if(s.phase==='fireball'&&s.age>=settings.fireballTime){s.age-=settings.fireballTime;s.phase='whiteout';events.push({type:'whiteout'});}
  if(s.phase==='whiteout'&&s.age>=settings.whiteoutTime){s.phase='spent';s.active=false;events.push({type:'fatal-overload',bypassInvulnerability:true});}
 }
 return events;
}
function status(s){return {active:s.active,phase:s.phase,energy:s.energy,rounds:s.rounds,remaining:Math.max(0,5-s.rounds),roundAdded:s.roundAdded,lastRound:s.lastRound,nextEligibleRound:s.nextEligibleRound,age:s.age,collected:s.collected,crystals:s.crystals.map(c=>({...c})),whiteout:s.phase==='whiteout'?1:0,fireballProgress:s.phase==='fireball'?clamp(s.age/settings.fireballTime,0,1):0}}
globalThis.GumiChargeModel={settings,create,beginRound,finishRound,cancel,step,status,candidates};
})();
