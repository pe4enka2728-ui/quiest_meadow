/* Persistent guards, separate enemy targets and per-turn Eclipse timing. */
(()=>{
'use strict';
class Eclipse{
 constructor(random=Math.random){this.random=random;this.from=0;this.to=-1;this.nextEligible=0;this.procs=0;}
 tryProc(turn){if(turn<this.nextEligible||turn<=this.to||this.random()>=.3)return false;this.from=turn+1;this.to=turn+2;this.nextEligible=turn+5;this.procs++;return true;}
 speed(turn){return turn>=this.from&&turn<=this.to?1.1:1;}
 status(turn,enemy=false){const next=turn+(enemy?0:1);return {active:this.speed(next)>1,remaining:Math.max(0,this.to-Math.max(next,this.from)+1),cooldown:Math.max(0,this.nextEligible-turn),procs:this.procs};}
}
class Encounter{
 constructor(random=Math.random,skyAge=0){this.random=random;this.skyAge=skyAge;this.enemyTurn=0;this.phase=1;this.phaseTwoShown=false;this.phaseIndices={1:0,2:0};this.guards=[{id:'guard-left',name:'Страж I',hp:75,maxHp:75,x:-3.35,y:1.5,deadAt:null},{id:'guard-right',name:'Страж II',hp:75,maxHp:75,x:3.35,y:1.5,deadAt:null}];this.eclipse=new Eclipse(random);this.target='neru';this.targeting=false;this.pendingSkill=null;this.castTarget='neru';this.reactions={};this.poisons={};this.guardQueue=[];this.currentGuard=null;this.healed=false;this.healAt=-Infinity;this.healLog=[];this.history=[];this.sim=new NeruAttackLab.Simulation(0,1);this.sim.neutral=true;}
 targets(bossHp){return [{id:'neru',name:'Неру',hp:bossHp,maxHp:600},...this.guards.filter(g=>g.hp>0)];}
 cycle(delta,bossHp){const list=this.targets(bossHp),i=list.findIndex(t=>t.id===this.target);this.target=list[(Math.max(0,i)+delta+list.length)%list.length].id;}
 damageTarget(id,damage,bossHp,clock,extra={}){this.reactions[id]={at:clock,damage,...extra};if(id==='neru')return Math.max(0,bossHp-damage);const g=this.guards.find(g=>g.id===id);if(g&&g.hp>0){g.hp=Math.max(0,g.hp-damage);if(!g.hp)g.deadAt=clock;}return bossHp;}
 poison(id,item){if(!item.poison)return;this.poisons[id]=(this.poisons[id]||[]).filter(p=>p.id!==item.id);this.poisons[id].push({id:item.id,...item.poison});}
 tickPoison(bossHp,clock){for(const [id,list]of Object.entries(this.poisons)){if(id==='neru'||this.guards.some(g=>g.id===id&&g.hp>0))bossHp=this.damageTarget(id,list.reduce((n,p)=>n+p.damage,0),bossHp,clock,{poison:true});this.poisons[id]=list.map(p=>({...p,turns:p.turns-1})).filter(p=>p.turns>0);}return bossHp;}
 begin(hp,bossHp,session,{guard=false,invulnerable=false,index=null}={}){this.phase=Math.max(this.phase,bossHp<=300?2:1);const list=NeruAttackLab.definitions.filter(d=>d.phase===this.phase),d=index===null?list[this.phaseIndices[this.phase]++%list.length]:NeruAttackLab.definitions[index];this.enemyTurn++;const speed=this.eclipse.speed(this.enemyTurn);this.sim=new NeruAttackLab.Simulation(NeruAttackLab.definitions.indexOf(d),Math.floor(this.random()*4294967296),{hp,attackSpeed:speed,movementScale:session.movementScale(),onHit:()=>{if(!this.sim.invulnerable)this.eclipse.tryProc(this.enemyTurn);},mitigate:n=>n<1?Math.max(0,(n-session.buffs.reduction)*(1-session.buffs.resistance)*(guard?.5:1)):session.mitigate(guard?n/2:n)});this.sim.invulnerable=invulnerable;this.history.push({turn:this.enemyTurn,number:d.number,speed});this.targeting=false;return this.sim;}
 queueGuards(){this.guardQueue=this.guards.filter(g=>g.hp>0).map(g=>g.id);return this.nextGuard();}
 nextGuard(){this.currentGuard=this.guardQueue.shift()||null;this.healed=false;return this.currentGuard;}
 visual(stage,stageAge,clock,bossHp){return {stage,stageAge,clock,bossHp,target:this.targeting?this.target:null,guards:this.guards.map(g=>({...g})),currentGuard:this.currentGuard,healing:stage==='guard',healAge:clock-this.healAt,reactions:this.reactions};}
 status(stage){return {phase:this.phase,enemyTurn:this.enemyTurn,targeting:this.targeting,target:this.target,pendingSkill:this.pendingSkill,guards:this.guards.map(g=>({...g})),eclipse:this.eclipse.status(this.enemyTurn,stage==='enemy'),history:this.history.slice(),healLog:this.healLog.slice(),simulation:this.sim.status()};}
}
globalThis.NeruCombatModel={Encounter,Eclipse};
})();
