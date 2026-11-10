/* Six main patterns; attack seven is a concurrent charge in GumiChargeModel. */
(()=>{
'use strict';
const definitions=[
 {id:'rainbow-drops',name:'Цветной ливень',damage:15,phases:[1,2],model:'falling-circus-balls'},
 {id:'rolling-logs',name:'Брёвна поперёк манежа',damage:10,phases:[1,2],model:'rolling-wood-cylinders'},
 {id:'falling-floor',name:'Два последних места',damage:0,phases:[2],model:'red-falling-cells',chainNext:true},
 {id:'fire-hoops',name:'Огненная дорожка',damage:15,phases:[2],model:'upright-flaming-hoops'},
 {id:'spinning-card-fans',name:'Карточный веер',damage:10,phases:[1,2],model:'rotating-low-playing-cards'},
 {id:'rainbow-floor',name:'Цвет зрителей',damage:0,phases:[1,2],model:'seven-color-floor-and-placards'},
 {id:'crystal-overload',name:'Перегрев марионетки',phases:[1,2],concurrent:true,model:'yellow-charge-and-crystals'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),randomIndex=(n,r)=>clamp(Math.floor(r()*n),0,n-1),P=p=>({x:(p.u-.5)*12,y:p.v*8,z:Number.isFinite(p.z)?p.z:p.jump>0?4*GumiArenaModel.settings.jumpHeight*(p.jump/GumiArenaModel.settings.jumpDuration)*(1-p.jump/GumiArenaModel.settings.jumpDuration):0});
function available(phase=1){return definitions.map((d,i)=>d.concurrent||!d.phases.includes(phase)?-1:i).filter(i=>i>=0)}
const selection=Object.freeze({defaultWeight:1,phaseTwoHoopsWeight:4});
function choose(previous=-1,random=Math.random,phase=1){
 const candidates=available(phase).filter(i=>i!==previous);
 if(phase!==2)return candidates[randomIndex(candidates.length,random)];
 const weights=candidates.map(i=>definitions[i].id==='fire-hoops'?selection.phaseTwoHoopsWeight:selection.defaultWeight),total=weights.reduce((a,b)=>a+b,0);
 let roll=clamp(random(),0,1-Number.EPSILON)*total;
 for(let i=0;i<candidates.length;i++){roll-=weights[i];if(roll<0)return candidates[i];}
 return candidates.at(-1);
}
function duration(s){if(s.index===0)return (s.count-1)*.12+1.35;if(s.index===1)return .75+(s.count-1)*.2+((s.edge<2?12:8)+1.4)/4.1+.15;if([2,5].includes(s.index))return (s.index===5?GumiArenaModel.settings.colorWarning:GumiArenaModel.settings.collapseWarning)+GumiArenaModel.settings.fallDuration+GumiArenaModel.settings.floorRecovery;if(s.index===4)return 1.1+3.5+3.5;return s.fires.at(-1)+(8+1.4)/3.6+.2}
function create(index,round=1,options={}){
 const phase=options.phase??1,random=options.random||Math.random,definition=definitions[index];
 if(!definition||definition.concurrent||!definition.phases.includes(phase))throw new RangeError('Attack is not available in this phase: '+index);
 const s={index,definition,round:Math.max(1,Math.floor(round)),phase,time:0,entities:[],done:false,arena:options.arena||null,count:0,targets:[],fires:[],edge:0};
 if(index===0){s.count=10+5*Math.floor(s.round/5);const live=s.arena?GumiArenaModel.livingCells(s.arena):Array.from({length:25},(_,i)=>i);for(let i=0;i<s.count;i++){const tile=live[randomIndex(live.length,random)],center=GumiArenaModel.cellCenter(tile);s.targets.push({x:(center.u-.5)*12+(random()-.5)*1.0,y:center.v*8+(random()-.5)*.55,color:GumiArenaModel.palette[randomIndex(GumiArenaModel.palette.length,random)]})}}
 if(index===0){const at=options.player||{u:.5,v:.75};Object.assign(s.targets[0],{x:(at.u-.5)*12,y:at.v*8,targeted:true});}
 if(index===1){s.count=phase===2?5:10;s.edge=randomIndex(4,random);for(let i=0;i<s.count;i++){const live=s.arena?GumiArenaModel.livingCells(s.arena):Array.from({length:25},(_,i)=>i),tile=live[randomIndex(live.length,random)],at=GumiArenaModel.cellCenter(tile);s.targets.push({lane:s.edge<2?at.v*8:(at.u-.5)*12})}}
 if(index===2){if(!s.arena||!GumiArenaModel.startCollapse(s.arena,options.player||{u:.5,v:.75},random))throw new Error('Collapse requires a ready second-phase arena')}
 if(index===3){if(!s.arena||!GumiArenaModel.startStrip(s.arena))throw new Error('Hoops require a ready second-phase arena');let fire=1.8;for(let i=0;i<5;i++){s.fires.push(fire);fire+=1.2+random()*.8}}
 if(index===4){s.count=64;for(let wave=0;wave<8;wave++){s.fires.push(1.1+wave*.5);const side=wave%2?-1:1;for(let card=0;card<8;card++){const a=-.40+card/7*.8;s.targets.push({side,x:-side*8.2,y:4,vx:side*Math.cos(a)*5.5,vy:Math.sin(a)*5.5,suit:card%4});}}}
 if(index===5){if(!s.arena||!GumiArenaModel.startRainbow(s.arena,options.player||{u:.5,v:.75},random))throw new Error('Color floor requires a ready arena');}
 s.duration=duration(s);return s;
}
function sample(s){
 const out=[],t=s.time;
 if(s.index===0)for(let i=0;i<s.count;i++){
  const age=t-i*.12,at=s.targets[i];if(age<0||age>=1.28)continue;
  if(age<1)out.push({kind:'gumi-ball-warning',id:'gumi-drop-warning-'+i,x:at.x,y:at.y,r:.55,z0:0,z1:0,progress:age,active:false,targeted:!!at.targeted});
  out.push({kind:'gumi-ball',shape:'circle',id:'gumi-drop-'+i,x:at.x,y:at.y,r:.55,z0:age<1?(1-age)*7:0,z1:age<1?(1-age)*7+.5:5,active:age>=1&&age<1.2,age,color:at.color,damage:15,impact:clamp((age-1)/.28,0,1),targeted:!!at.targeted});
 }
 if(s.index===1)for(let i=0;i<s.count;i++){
  const fire=.75+i*.2,age=t-fire,span=s.edge<2?12:8;if(age<-.65||age>(span+1.4)/4.1)continue;
  const lane=s.targets[i].lane,travel=-.7+Math.max(0,age)*4.1,center=s.edge===0?{x:-6+travel,y:lane}:s.edge===1?{x:6-travel,y:lane}:s.edge===2?{x:lane,y:travel}:{x:lane,y:8-travel};
  const horizontal=s.edge>=2,half=horizontal?1.2:.8;
  out.push({kind:age<0?'gumi-log-warning':'gumi-log',shape:'segment',id:'gumi-log-'+i,x:center.x,y:center.y,x1:center.x-(horizontal?half:0),y1:center.y-(horizontal?0:half),x2:center.x+(horizontal?half:0),y2:center.y+(horizontal?0:half),r:.25,z0:Math.max(0,.18-age)*12,z1:Math.max(0,.18-age)*12+.72,active:age>=0,age,progress:clamp(1+age/.65,0,1),angle:travel/.25,edge:s.edge,damage:10});
 }
 if(s.index===3)for(let i=0;i<5;i++){
  const age=t-s.fires[i],y=-.7+age*3.6;if(age<-.6||y>8.7)continue;
  out.push({kind:age<0?'gumi-hoop-warning':'gumi-fire-hoop',shape:'segment',id:'gumi-hoop-'+i,x:0,y:Math.max(-.4,y),x1:-1.2,y1:y,x2:1.2,y2:y,r:.18,z0:0,z1:.65,active:age>=0,progress:clamp(1+age/.6,0,1),angle:t*3,damage:15});
 }
 if(s.index===4)for(let wave=0;wave<8;wave++){
  const age=t-s.fires[wave],side=wave%2?-1:1;
  if(age>=-.8&&age<0)out.push({kind:'gumi-card-fan-warning',id:'gumi-card-warning-'+wave,x:-side*6,y:4,r:.4,z0:0,z1:0,side,progress:clamp(1+age/.8,0,1),active:false});
  if(age<0||age>3.5)continue;
  for(let card=0;card<8;card++){const at=s.targets[wave*8+card],x=at.x+at.vx*age,y=at.y+at.vy*age;if(Math.abs(x)>8.3||y<-.8||y>8.8)continue;out.push({kind:'gumi-spinning-card',shape:'circle',id:'gumi-card-'+wave+'-'+card,x,y,r:.25,z0:.06,z1:.68,active:true,age,angle:age*9+card*.6,suit:at.suit,side,damage:10});}
 }
 return out;
}
function collides(e,p){if(!e.active||p.z>=e.z1||p.z+1.45<=e.z0)return false;if(e.shape==='circle')return Math.hypot(p.x-e.x,p.y-e.y)<e.r+.2;if(e.shape==='segment'){const dx=e.x2-e.x1,dy=e.y2-e.y1,q=clamp(((p.x-e.x1)*dx+(p.y-e.y1)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-e.x1-dx*q,p.y-e.y1-dy*q)<e.r+.2}return false}
function finish(s){s.done=true;s.entities=[];if([2,3,5].includes(s.index)&&s.arena)GumiArenaModel.restoreTemporary(s.arena)}
function step(s,dt,from,to=from){if(s.done||!Number.isFinite(dt)||dt<=0)return [];let left=dt,elapsed=0;const hits=new Map();while(left>1e-9&&!s.done){const delta=Math.min(left,1/120);left-=delta;elapsed+=delta;const q=clamp(elapsed/dt,0,1),p=P({u:from.u+(to.u-from.u)*q,v:from.v+(to.v-from.v)*q,jump:from.jump+(to.jump-from.jump)*q,z:Number.isFinite(from.z)&&Number.isFinite(to.z)?from.z+(to.z-from.z)*q:undefined});s.time+=delta;s.entities=sample(s);for(const e of s.entities)if(collides(e,p))hits.set(e.id,{id:e.id,type:'impact',damage:e.damage,grantsInvulnerability:true});if(s.time>=s.duration-1e-9)finish(s)}return [...hits.values()]}
function cancel(s){finish(s)}
function status(s){return s?{index:s.index,id:s.definition.id,name:s.definition.name,round:s.round,phase:s.phase,count:s.count,duration:s.duration,time:s.time,done:s.done,chainNext:!!s.definition.chainNext,entities:s.entities.map(e=>({...e}))}:null}
globalThis.GumiAttacksV2={definitions,selection,available,choose,create,sample,collides,step,cancel,status,playerPoint:P};globalThis.GumiAttacks=globalThis.GumiAttacksV2;
})();
