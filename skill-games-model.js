/* Short, deterministic input challenges. No DOM, battle time or damage mutation. */
(()=>{
'use strict';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:0));
const directions=['up','right','down','left'];
const keys={KeyW:'up',ArrowUp:'up',KeyD:'right',ArrowRight:'right',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',Space:'confirm'};
const definitions=[
 ['pulse','Импульс','ring',2.9,'Поймай четыре волны: 1, 2, затем через 0,3 и 0,5 секунды.','Space — поймать импульс'],
 ['scarlet-accent','Алый акцент','slash',2,'Первая стрелка — замах. Вторая — удар на вспышке.','WASD / стрелки — два движения'],
 ['double-syllable','Двойной слог','double',2.2,'Ноты идут справа налево. Нажимай стрелку у неподвижного значка.','WASD / стрелки — поймать ноты'],
 ['thorn-note','Колючая нота','thorn',3.6,'Проведи ноту через шесть просветов.','W / S или ↑ / ↓ — высота'],
 ['wormwood','Полынный шёпот','mist',4.2,'Удерживай дымку в светлой полосе.','Space: держать — вверх, отпустить — вниз'],
 ['glass-high','Стеклянный верх','glass',4.05,'Удерживай кристалл над центральной отметкой.','A / D или ← / → — равновесие'],
 ['discord','Сбитый ритм','discord',2.2,'Поймай оборванный такт с рваным контуром.','Space — ударить по разрыву'],
 ['step','Тихий шаг','step',9.6,'Четыре участка: выбирай свободные следы.','← / ↑ / → или A / W / D — путь'],
 ['reverse-beat','Обратный такт','reverse',2.8,'Запомни три стрелки и повтори в обратном порядке.','WASD / стрелки — ответ'],
 ['dawn-chorus','Хор рассвета','chorus',3,'Лови ноты на линии. Парные стрелки нажимай вместе.','← / ↑ / → или A / W / D · максимум две'],
 ['gumi-wand','Волшебная палочка','wand',2.4,'Выбери три звезды. После середины времени точность снижается.','WASD / стрелки — собрать свет'],
 ['warm-note','Тёплая нота','heart',1.7,'Соедини половинки сердца одним нажатием.','Space — соединить сердце'],
 ['second-breath','Второе дыхание','breath',3,'Два вдоха: зажми на расширении, отпусти на сжатии.','Space — вдох / отпустить — выдох'],
 ['soft-guard','Мягкий барьер','shield',2.5,'Соедини четыре осколка на центральной отметке.','WASD / стрелки — собрать щит'],
 ['quiet-shell','Тихий купол','dome',2.6,'Останови обе дуги у верхней светлой отметки.','A / ← — левая дуга · D / → — правая'],
 ['perfect-accent','Точный акцент','focus',2.4,'Приведи искру в центр и удержи до заполнения.','WASD / стрелки — двигать искру'],
 ['quick-tempo','Быстрый темп','tempo',2,'Лови летящие справа стрелки у неподвижного значка.','A / D или ← / → — шаги']
].map(([id,name,kind,duration,instruction,hint])=>({id,name,kind,duration,instruction,hint}));
const grade=score=>score>=.9?'perfect':score>=.5?'good':'weak';
const gradeName=q=>({perfect:'Идеально',good:'Хорошо',weak:'Слабо'})[q];
const timing=(now,target,window=.30)=>clamp(1-Math.pow(Math.abs(now-target)/window,1.5));
const angleDistance=a=>Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));

class Run{
 constructor(id,random=Math.random){
  this.definition=definitions.find(d=>d.id===id);if(!this.definition)throw Error('Неизвестный приём: '+id);
  this.id=id;this.kind=this.definition.kind;this.duration=this.definition.duration;this.phase='ready';this.age=0;this.time=0;this.resultAge=0;this.result=null;this.held=new Set();this.cues=[];this.errors=0;this.flash=null;this.inside=0;this.measured=0;this.best=0;this.streak=0;
  const rand=()=>clamp(random(),0,.999999999),pick=arr=>arr[Math.floor(rand()*arr.length)],different=k=>pick(directions.filter(d=>d!==k));
  this.data={seed:rand()*Math.PI*2};
  const cue=(key,time,extra={})=>this.cues.push({key,time,score:null,at:null,...extra});
  if(this.kind==='ring')[.8,1.6,1.9,2.4].forEach(t=>cue('confirm',t));if(this.kind==='heart')cue('confirm',1.08);
  if(this.kind==='slash'){const a=pick(directions);cue(a,.55,{setup:true});cue(different(a),1.5);}
  if(this.kind==='double'){const a=pick(directions);cue(a,.72);cue(different(a),1.52);}
  if(this.kind==='thorn'){const side=rand()<.5?-1:1;this.data.y=86;this.data.gates=[90,162,234,306,378,450].map((x,i)=>({x,y:clamp(86+side*(i%2?-1:1)*(36+rand()*12),43,133),half:38,passed:false,clear:false}));}
  if(this.kind==='mist')this.data.level=.5;
  if(this.kind==='glass')this.data.tilt=.38*(rand()<.5?-1:1);
  if(this.kind==='discord'){this.data.broken=Math.floor(rand()*4);cue('confirm',[.42,.84,1.26,1.68][this.data.broken]);}
  if(this.kind==='step')this.data.paths=Array.from({length:4},()=>pick(['left','up','right'])),this.data.answers=[];
  if(this.kind==='reverse')this.data.sequence=Array.from({length:3},()=>pick(directions)),this.data.answers=[];
  if(this.kind==='chorus')for(let beat=0;beat<4;beat++){const lane=['left','up','right'],a=pick(lane),time=.65+beat*.6;cue(a,time,{beat});if(beat%2)cue(pick(lane.filter(v=>v!==a)),time,{beat});}
  if(this.kind==='wand')this.data.fake=pick(directions),this.data.collected=[],this.data.collectScores={},this.data.wrong=[];
  if(this.kind==='breath'){cue('confirm',.25,{edge:'down'});cue('confirm',1,{edge:'up'});cue('confirm',1.6,{edge:'down'});cue('confirm',2.35,{edge:'up'});}
  if(this.kind==='shield'){const offset=Math.floor(rand()*4);for(let i=0;i<4;i++)cue(directions[(i+offset)%4],.45+i*.5);}
  if(this.kind==='dome')this.data.angles=[rand()*Math.PI*2,rand()*Math.PI*2],this.data.stops=[null,null],this.data.scores=[0,0];
  if(this.kind==='focus')this.data.x=(rand()<.5?-1:1)*(30+rand()*25),this.data.y=(rand()-.5)*45,this.data.locked=false;
  if(this.kind==='tempo'){const a=rand()<.5?'left':'right';[.45,.90,1.28,1.60].forEach((t,i)=>cue(i%2?(a==='left'?'right':'left'):a,t));}
 }
 record(cue,score){cue.score=clamp(score);cue.at=this.time;this.flash={key:cue.key,score:cue.score,time:this.time};}
 pressCue(key){
  const candidates=this.cues.filter(c=>c.key===key&&c.score===null&&Math.abs(c.time-this.time)<.35).sort((a,b)=>Math.abs(a.time-this.time)-Math.abs(b.time-this.time));
  if(candidates.length)this.record(candidates[0],timing(this.time,candidates[0].time));else this.errors++;
 }
 down(key){
  if(this.phase!=='play'||!['confirm',...directions].includes(key)||this.held.has(key))return false;
  this.held.add(key);const t=this.time,k=this.kind,d=this.data;
  if(k==='ring'){if(key==='confirm')this.pressCue(key);}
  else if(['heart','discord'].includes(k)){if(key==='confirm'&&this.cues[0].score===null)this.record(this.cues[0],timing(t,this.cues[0].time,.34));}
  else if(k==='slash'){
   const c=this.cues.find(c=>c.score===null);if(c&&directions.includes(key)){if(key!==c.key)this.errors++;else if(c.setup){if(t<1.05)this.record(c,1);else this.record(c,0);}else this.record(c,timing(t,c.time));}
  }else if(['double','chorus','shield','tempo'].includes(k)){if(directions.includes(key))this.pressCue(key);}
  else if(k==='step'&&directions.includes(key)){
   const index=Math.min(3,Math.floor(t/(this.duration/4)));if(t>.10&&d.answers[index]===undefined){const ok=key===d.paths[index];d.answers[index]={key,score:ok?1:0};this.flash={key,score:ok?1:0,time:t};}
  }else if(k==='reverse'&&directions.includes(key)&&t>=.85&&d.answers.length<3){const i=d.answers.length,ok=key===d.sequence[2-i];d.answers.push({key,score:ok?1:0});this.flash={key,score:ok?1:0,time:t};}
  else if(k==='wand'&&directions.includes(key)){if(key===d.fake){if(!d.wrong.includes(key))d.wrong.push(key);}else if(!d.collected.includes(key)){d.collected.push(key);d.collectScores[key]=this.wandAccuracy();if(d.collected.length===3)this.finish();}}
  else if(k==='breath'&&key==='confirm'){const c=this.cues.find(c=>c.score===null);if(c?.edge==='down')this.record(c,timing(t,c.time,.32));}
  else if(k==='dome'&&['left','right'].includes(key)){const i=key==='left'?0:1;if(d.stops[i]===null){d.stops[i]=this.arcAngle(i);d.scores[i]=clamp(1-Math.pow(angleDistance(d.stops[i])/.9,1.5));this.flash={key,score:d.scores[i],time:t};}}
  return true;
 }
 up(key){const was=this.held.delete(key);if(!was||this.phase!=='play')return false;if(this.kind==='breath'&&key==='confirm'){const c=this.cues.find(c=>c.score===null);if(c?.edge==='up')this.record(c,timing(this.time,c.time,.32));}return true;}
 clearHeld(){this.held.clear();}
 arcAngle(i){return this.data.stops[i]??this.data.angles[i]+this.time*(i===0?2.8:-2.8);}
 wandAccuracy(){return clamp(2-2*this.time/this.duration);}
 mistTarget(){return .5+Math.sin(this.time*2.4+this.data.seed)*.16;}
 step(dt){
  if(!Number.isFinite(dt)||dt<=0||this.phase==='done')return;
  let remaining=Math.min(dt,.25);
  while(remaining>1e-8&&this.phase!=='done'){
   const h=Math.min(remaining,1/120);remaining-=h;this.age+=h;
   if(this.phase==='ready'){if(this.age>=.4-1e-8)this.phase='play';continue;}
   if(this.phase==='result'){this.resultAge+=h;if(this.resultAge>=.48-1e-8)this.phase='done';continue;}
   this.time=Math.min(this.duration,this.time+h);this.advance(h);if(this.time>=this.duration-1e-8)this.finish();
  }
 }
 advance(dt){
  const d=this.data,k=this.kind,t=this.time,input=(a,b)=>(this.held.has(a)?1:0)-(this.held.has(b)?1:0);
  if(['ring','double','chorus','shield','tempo','breath','slash'].includes(k))for(const c of this.cues)if(c.score===null&&t>c.time+(c.setup?.5:.35))this.record(c,0);
  if(k==='thorn'){
   d.y=clamp(d.y+input('down','up')*140*dt,19,165);const x=22+t/this.duration*468;
   for(const gate of d.gates)if(!gate.passed&&x>=gate.x){gate.passed=true;gate.clear=Math.abs(d.y-gate.y)<=gate.half-7;this.flash={score:gate.clear?1:0,time:t};}
  }else if(k==='mist'){
   d.level=clamp(d.level+(this.held.has('confirm')?.32:-.25)*dt);if(t>.15){this.measured+=dt;if(Math.abs(d.level-this.mistTarget())<=.16)this.inside+=dt;}
  }else if(k==='glass'){
   d.tilt=clamp(d.tilt+(input('right','left')*1.45+Math.sin(t*3.5+d.seed)*.65)*dt,-1.1,1.1);if(t>.15){this.measured+=dt;if(Math.abs(d.tilt)<=.24)this.inside+=dt;}
  }else if(k==='focus'&&!d.locked){
   let x=input('right','left'),y=input('down','up'),length=Math.hypot(x,y);if(length>1)x/=length,y/=length;
   d.x=clamp(d.x+(x*85+Math.sin(t*4+d.seed)*13)*dt,-190,190);d.y=clamp(d.y+(y*85+Math.cos(t*3+d.seed)*10)*dt,-65,65);
   this.streak=Math.hypot(d.x,d.y)<=12?this.streak+dt:0;this.best=Math.max(this.best,this.streak);if(this.best>=.5)d.locked=true;
  }
 }
 finish(){
  if(this.result)return;let scores=[],d=this.data,k=this.kind;
  if(k==='thorn')scores=d.gates.map(g=>g.clear?1:0);
  else if(k==='mist'||k==='glass')scores=[this.inside/Math.max(.001,this.measured)];
  else if(k==='step')scores=d.paths.map((_,i)=>d.answers[i]?.score||0);
  else if(k==='reverse')scores=d.sequence.map((_,i)=>d.answers[i]?.score||0);
  else if(k==='wand')scores=[clamp(Object.values(d.collectScores).reduce((a,b)=>a+b,0)/3-d.wrong.length*.3)];
  else if(k==='dome')scores=d.scores.slice();
  else if(k==='focus')scores=[clamp(this.best/.5)];
  else{
   scores=this.cues.map(c=>c.score||0);
   if(k==='chorus')for(const beat of [1,3]){const pair=this.cues.map((c,i)=>({...c,index:i})).filter(c=>c.beat===beat);if(pair.every(c=>c.at!==null)&&Math.abs(pair[0].at-pair[1].at)>.16)for(const c of pair)scores[c.index]=Math.min(.7,scores[c.index]);}
  }
  const penalty=Math.min(.7,this.errors*.12),score=clamp(scores.reduce((a,b)=>a+b,0)/Math.max(1,scores.length)-penalty);
  this.result={score,quality:grade(score),label:gradeName(grade(score)),hits:k==='double'?scores.map(s=>clamp(s-penalty)):[score],errors:this.errors};
  this.phase='result';this.resultAge=0;this.clearHeld();
 }
 status(){return {id:this.id,kind:this.kind,phase:this.phase,age:this.age,time:this.time,duration:this.duration,leadRemaining:this.phase==='ready'?Math.max(0,.4-this.age):0,held:[...this.held],cues:this.cues.map(c=>({...c})),data:JSON.parse(JSON.stringify(this.data)),inside:this.inside,measured:this.measured,best:this.best,errors:this.errors,result:this.result?{...this.result,hits:this.result.hits.slice()}:null};}
}
globalThis.SkillGamesModel={definitions,Run,grade,gradeName,timing,key:code=>keys[code]||null};
})();
