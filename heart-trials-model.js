/* World trials: short jumps, deterministic falling discs, filtered memory and stolen voice. */
(()=>{
'use strict';
// Equal arc-length samples keep the wide bends within one short jump.
const platforms=[{id:'start',type:'rect',x:626,y:870,w:284,h:154}];
function windingRoute(){
 const dense=[];let length=0;
 for(let i=0;i<=1200;i++){const t=i/1200,x=768-340*Math.sin(t*Math.PI*3),y=794-652*t;if(i)length+=Math.hypot(x-dense[i-1].x,y-dense[i-1].y);dense.push({x,y,length});}
 const count=Math.ceil(length/90),out=[];let j=1;
 for(let i=0;i<=count;i++){const at=length*i/count;while(j<dense.length-1&&dense[j].length<at)j++;const a=dense[j-1],b=dense[j],u=(at-a.length)/(b.length-a.length||1);out.push({id:'disc-south-'+i,type:'circle',x:Math.round((a.x+(b.x-a.x)*u)/3)*3,y:Math.round((a.y+(b.y-a.y)*u)/3)*3,r:30});}
 // Open the tight bends as well, so larger discs have a visible gap there.
 for(let pass=0;pass<10;pass++)for(let i=1;i<out.length;i++){const a=out[i-1],b=out[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<84){const push=(84-d)/2;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;}}
 for(const p of out){p.x=Math.round(p.x/3)*3;p.y=Math.round(p.y/3)*3;}
 return out;
}
const south=windingRoute();platforms.push(...south);
const checkpointIndex=platforms.length;platforms.push({id:'seam-checkpoint',type:'rect',x:630,y:-70,w:276,h:140,checkpoint:true});
platforms.push(...south.map((p,i)=>({...p,id:'disc-north-'+i,x:1536-p.x,y:Math.round((-147-(south[0].y-p.y)/(south[0].y-south.at(-1).y)*591)/3)*3})));
platforms.push({id:'finish',type:'rect',x:630,y:-970,w:276,h:159,goal:true});
const jumpDuration=.5,jumpSpeed=170;
function selection(wave){let seed=(93173+wave*2654435761)>>>0;const a=platforms.map((p,i)=>p.type==='circle'?i:-1).filter(i=>i>=0);for(let i=a.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=(seed>>>8)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,7);}
class PulseTrail {
 constructor(){this.kind='red';this.schema=4;this.clock=0;this.phase='play';this.checkpoint=0;this.failures=0;this.won=false;this.jumpAge=-1;this.recover=0;this.coyote=.08;}
 state(i){if(platforms[i]?.type!=='circle'||this.clock<7)return {phase:'stable',age:0};const wave=Math.floor(this.clock/7)-1,age=this.clock%7;if(!selection(wave).includes(i))return {phase:'stable',age:0};return {phase:age<2?'warning':'fallen',age,fallAge:Math.max(0,age-2),restoreIn:7-age};}
 platform(i){return {...platforms[i],...this.state(i)};}
 center(i){const p=platforms[i];return p.type==='circle'?{x:p.x,y:p.y}:{x:p.x+p.w/2,y:p.y+p.h/2};}
 support(p){for(let i=0;i<platforms.length;i++){const b=platforms[i];if(this.state(i).phase==='fallen')continue;if(b.type==='circle'?Math.hypot(p.x-b.x,p.y-b.y)<=b.r-5:p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h)return i;}return -1;}
 get elevation(){return this.jumpAge>=0?Math.sin(Math.min(1,this.jumpAge/jumpDuration)*Math.PI)*57:0;}
 jump(p){if(this.recover>0||this.jumpAge>=0)return false;if(this.support(p)>=0||this.coyote>0){this.jumpAge=0;this.coyote=0;return true;}return false;}
 retry(){if(this.recover>0)return;this.failures++;this.recover=.72;this.jumpAge=-1;}
 reset(){this.recover=0;this.jumpAge=-1;this.coyote=.08;return this.checkpoint?{x:768,y:0}:{x:768,y:935};}
 update(dt,p){this.clock+=dt;if(this.recover>0){this.recover=Math.max(0,this.recover-dt);if(!this.recover)return {reset:this.reset()};return null;}const support=this.support(p);
  if(this.jumpAge>=0){this.jumpAge+=dt;if(this.jumpAge>=jumpDuration){this.jumpAge=-1;if(support<0){this.retry();return null;}}}else{this.coyote=support>=0?.08:Math.max(0,this.coyote-dt);if(support<0&&this.coyote<=0){this.retry();return null;}}
  if(this.jumpAge<0&&support>=0){if(platforms[support].checkpoint)this.checkpoint=checkpointIndex;if(platforms[support].goal){this.won=true;this.phase='won';}}return null;
 }
 status(){return {kind:this.kind,schema:4,phase:this.phase,clock:this.clock,checkpoint:this.checkpoint,failures:this.failures,jumpAge:this.jumpAge,recover:this.recover,elevation:this.elevation,won:this.won,jumpDuration,jumpSpeed,platforms:platforms.map((p,i)=>({id:p.id,index:i,...this.state(i)}))};}
}
const directions=['up','down','left','right'],arrowsForStage=stage=>Math.min(2,stage+1),voiceArrowSpacing=24;
class Rhythm {
 constructor(seed=Math.floor(Math.random()*4294967296)){
  this.kind='blue';this.schema=4;this.seed=seed>>>0;let random=this.seed;
  this.sequences=Array.from({length:3},(_,stage)=>Array.from({length:3},()=>{const a=[...directions];for(let i=3;i>0;i--){random=(Math.imul(random,1664525)+1013904223)>>>0;const j=(random>>>16)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,arrowsForStage(stage));}));
  this.clock=0;this.age=0;this.stage=0;this.hits=0;this.failures=0;this.phase='listen';this.lastInputAt=-1;this.pressed=[];this.won=false;
 }
 get sequence(){return this.sequences[this.stage];}
 get arrowsPerGroup(){return arrowsForStage(this.stage);}
 get chord(){return this.sequence[Math.min(2,this.hits)];}
 get direction(){return this.chord[0]||null;}
 get speed(){return [62,82,108][this.stage];}
 get period(){return [1,.85,.7][this.stage];}
 get tolerance(){return [.18,.16,.14][this.stage];}
 get beatAt(){return (this.hits+1)*this.period;}
 get position(){return this.phase==='play'?Math.min(1,this.age/(this.period*4)):this.phase==='stage-won'||this.phase==='won'?1:0;}
 get demoIndex(){return this.phase==='listen'&&this.age<this.period*3?Math.floor(this.age/this.period):-1;}
 get pulse(){return this.phase==='listen'?this.demoIndex>=0&&this.age%this.period<.2:this.phase==='play'&&Math.abs(this.age-this.beatAt)<=this.tolerance;}
 input(direction){
  if(this.phase!=='play'||!directions.includes(direction))return false;
  const good=this.chord.includes(direction)&&Math.abs(this.age-this.beatAt)<=this.tolerance;
  if(!good){this.miss();return false;}
  if(this.pressed.includes(direction))return true;this.pressed.push(direction);this.lastInputAt=this.age;if(this.pressed.length<this.chord.length)return true;this.pressed=[];this.hits++;
  if(this.hits===3){this.phase='stage-won';this.age=0;}
  return true;
 }
 miss(){this.failures++;this.hits=0;this.phase='miss';this.age=0;this.lastInputAt=-1;this.pressed=[];}
 interrupt(){if(this.phase==='stage-won'){if(this.stage===2){this.phase='won';this.won=true;this.age=0;return;}this.stage++;}this.retry();this.phase='stopped';}
 retry(){this.phase='listen';this.age=0;this.hits=0;this.lastInputAt=-1;this.pressed=[];this.won=false;}
 update(dt){if(this.won||this.phase==='stopped')return;this.clock+=dt;this.age+=dt;
  if(this.phase==='listen'&&this.age>=this.period*4){this.phase='play';this.age=0;}
  else if(this.phase==='play'&&this.age>this.beatAt+this.tolerance)this.miss();
  else if(this.phase==='miss'&&this.age>=.85)this.retry();
  else if(this.phase==='stage-won'&&this.age>=1){if(this.stage===2){this.phase='won';this.won=true;}else{this.stage++;this.retry();}}
 }
 status(){return {kind:this.kind,schema:4,seed:this.seed,sequences:this.sequences.map(a=>a.map(c=>[...c])),sequence:this.sequence.map(c=>[...c]),chord:[...this.chord],pressed:[...this.pressed],arrowsPerGroup:this.arrowsPerGroup,speed:this.speed,clock:this.clock,age:this.age,stage:this.stage,hits:this.hits,failures:this.failures,phase:this.phase,direction:this.direction,period:this.period,beatAt:this.beatAt,position:this.position,tolerance:this.tolerance,pulse:this.pulse,demoIndex:this.demoIndex,lastInputAt:this.lastInputAt,won:this.won};}
}
const finite=n=>Number.isFinite(n)&&n>=0&&n<=1e9;
function normalize(kind,p){if(p==null)return p;const n=JSON.parse(JSON.stringify(p));if(kind==='blue'&&n.schema===3&&Array.isArray(n.sequences)&&n.sequences.length===3&&n.sequences.every((groups,stage)=>Array.isArray(groups)&&groups.length===3&&groups.every(c=>Array.isArray(c)&&c.length===stage+1&&new Set(c).size===c.length&&c.every(d=>directions.includes(d))))){
 n.schema=4;n.sequences=n.sequences.map((groups,stage)=>groups.map(c=>c.slice(0,arrowsForStage(stage))));
 if(Array.isArray(n.pressed)&&Number.isInteger(n.stage)&&Number.isInteger(n.hits)){const chord=n.sequences[n.stage]?.[Math.min(2,n.hits)];if(chord){n.pressed=n.pressed.filter(d=>chord.includes(d));if(n.phase==='play'&&n.pressed.length===chord.length){n.hits++;n.pressed=[];if(n.hits===3){n.phase='stage-won';n.age=0;}}}}
 }if(kind==='yellow'&&!n.signals&&Array.isArray(n.sequences)){n.schema=2;n.signals=n.sequences.map((a,r)=>{const events=a.map(index=>({index,red:false}));events.splice(Math.min(r+1,events.length),0,{index:(a[0]+2)%4,red:true});return events;});}return n;}
function capture(model){if(model.kind==='red')return {kind:'red',schema:4,clock:model.clock,checkpoint:model.checkpoint,failures:model.failures,won:model.won};if(model.kind==='yellow')return {kind:'yellow',schema:2,clock:model.clock,round:model.round,phase:model.phase,age:model.age,cursor:model.cursor,selected:model.selected,errors:model.errors,feedback:model.feedback,sequences:model.sequences.map(a=>[...a]),signals:model.signals.map(a=>a.map(e=>({...e}))),won:model.won};return {kind:'blue',schema:4,seed:model.seed,sequences:model.sequences.map(a=>a.map(c=>[...c])),pressed:[...model.pressed],clock:model.clock,age:model.age,stage:model.stage,hits:model.hits,failures:model.failures,phase:model.phase,lastInputAt:model.lastInputAt,won:model.won};}
function valid(kind,raw){if(raw==null)return true;let p;try{p=normalize(kind,raw);}catch{return false;}if(!p||p.kind!==kind||!finite(p.clock)||typeof p.won!=='boolean')return false;
 if(kind==='red')return p.schema===4&&[0,checkpointIndex].includes(p.checkpoint)&&Number.isInteger(p.failures)&&p.failures>=0;
 if(!finite(p.age))return false;
 if(kind==='yellow'){if(!Number.isInteger(p.round)||p.round<0||p.round>2||!['demo','input','error','round-won','won'].includes(p.phase)||!Number.isInteger(p.cursor)||!Number.isInteger(p.selected)||p.selected<0||p.selected>3||!Number.isInteger(p.errors)||p.errors<0||!Number.isInteger(p.feedback)||p.feedback< -1||p.feedback>3||!Array.isArray(p.sequences)||p.sequences.length!==3||!Array.isArray(p.signals)||p.signals.length!==3)return false;for(let r=0;r<3;r++){const events=p.signals[r],seq=p.sequences[r];if(!Array.isArray(seq)||seq.length<3||seq.length>6||!seq.every(n=>Number.isInteger(n)&&n>=0&&n<4)||!Array.isArray(events)||events.length<4||events.length>8||!events.every(e=>e&&Number.isInteger(e.index)&&e.index>=0&&e.index<4&&typeof e.red==='boolean')||!events.some(e=>e.red)||JSON.stringify(events.filter(e=>!e.red).map(e=>e.index))!==JSON.stringify(seq))return false;}return p.cursor>=0&&p.cursor<=p.sequences[p.round].length&&(!p.won||p.round===2&&p.phase==='won');}
 if(kind==='blue')return p.schema===4&&Number.isInteger(p.seed)&&p.seed>=0&&p.seed<=4294967295&&Array.isArray(p.sequences)&&p.sequences.length===3&&p.sequences.every((a,stage)=>Array.isArray(a)&&a.length===3&&a.every(c=>Array.isArray(c)&&c.length===arrowsForStage(stage)&&new Set(c).size===c.length&&c.every(d=>directions.includes(d))))&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<=2&&Number.isInteger(p.hits)&&p.hits>=0&&p.hits<=3&&Number.isInteger(p.failures)&&p.failures>=0&&['listen','play','miss','stage-won','won','stopped'].includes(p.phase)&&Number.isFinite(p.lastInputAt)&&p.lastInputAt>=-1&&p.lastInputAt<=p.clock&&(['stage-won','won'].includes(p.phase)?p.hits===3:p.hits<3)&&Array.isArray(p.pressed)&&new Set(p.pressed).size===p.pressed.length&&p.pressed.every(d=>p.sequences[p.stage][Math.min(2,p.hits)].includes(d))&&p.pressed.length<arrowsForStage(p.stage)&&(p.phase==='play'||p.pressed.length===0)&&(!p.won||p.phase==='won'&&p.stage===2&&p.hits===3);
 return false;
}
function create(kind,raw=null){const p=normalize(kind,raw);if(!valid(kind,p))throw Error('Некорректное воспоминание испытания');const m=kind==='red'?new PulseTrail():kind==='blue'?new Rhythm():HeartGamesModel.create(kind);if(p)Object.assign(m,p);return m;}
function completed(kind){const m=create(kind);m.won=true;m.phase='won';if(kind==='yellow'){m.round=2;m.cursor=m.sequence.length;}if(kind==='blue'){m.stage=2;m.hits=3;m.pressed=[];}return m;}
globalThis.HeartTrialsModel={PulseTrail,Rhythm,directions,arrowsForStage,voiceArrowSpacing,platforms,checkpointIndex,jumpDuration,jumpSpeed,selection,capture,normalize,valid,create,completed};
})();
