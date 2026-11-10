/* Flower attacks in arena coordinates: X [-6,6], Y [0,8], height in world units.
 * No DOM, rendering or wall-clock timers. The renderer uses these exact volumes. */
(()=>{
const balance={tempo:1.25,petalWaves:3,petalsPerWave:7,rootWaves:4,seeds:9,masks:5,spiralBeads:24,gardenWaves:4,ringFires:[1.25,2.45,3.55,4.65]};
const definitions=[
 {id:'petals',name:'Веер лепестков',baseDuration:7.8,damage:5,phrase:'Улыбнись. Вот твои лепестки.',hint:'Проходи между лепестками или перепрыгивай их.',model:'spinning-petal'},
 {id:'roots',name:'Живые корни',baseDuration:8.1,damage:5,phrase:'Останься. Сад тебя удержит.',hint:'Ищи разрыв в корнях или прыгай через низкую волну.',model:'segmented-root'},
 {id:'pollen',name:'Пыльца сверху',baseDuration:7.5,damage:5,phrase:'Загадай желание. И замри.',hint:'Тени показывают падение. Не стой в облачках пыльцы.',model:'parachute-seed'},
 {id:'masks',name:'Прилипчивая улыбка',baseDuration:7.4,damage:5,phrase:'Эта улыбка только для тебя.',hint:'После фиксации стрелки отойди в сторону.',model:'smiling-flower-mask'},
 {id:'spiral',name:'Гипнотическая спираль',baseDuration:7.5,damage:5,phrase:'Смотри в середину. Всё повторяется.',hint:'Двигайся вместе с проходом между витками.',model:'eye-seed-beads'},
 {id:'garden',name:'Сад под ногами',baseDuration:7.9,damage:5,phrase:'Здесь вырастет ещё одна улыбка.',hint:'Выбирай свободные участки. Высокие шипы не перепрыгнуть.',model:'blinking-thorn-bud'},
 {id:'rings',name:'Не моргай',baseDuration:8.9,damage:5,phrase:'Раз... ещё раз... не моргай.',hint:'Прыгай через волны. В последнем кольце есть разрыв.',model:'linked-petal-ring'}
];
for(const def of definitions)def.duration=def.baseDuration/balance.tempo;
const arena={projectionScale:.9,width:12,depth:8,minU:.04,maxU:.96,minV:.1,maxV:.96,playerRadius:.20,bodyHeight:1.45,jumpDuration:.9,jumpHeight:1.8};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),tau=Math.PI*2;
const playerPoint=p=>({x:(p.u-.5)*12,y:p.v*8,z:p.jump>0?4*arena.jumpHeight*clamp(p.jump/arena.jumpDuration,0,1)*(1-clamp(p.jump/arena.jumpDuration,0,1)):0});
const angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
function choose(previous=-1,random=Math.random){const count=definitions.length,exclude=Number.isInteger(previous)&&previous>=0&&previous<count;const pick=Math.min((exclude?count-1:count)-1,Math.max(0,Math.floor(random()*(exclude?count-1:count))));return exclude&&pick>=previous?pick+1:pick}
function create(index,round=1){const def=definitions[((index%7)+7)%7];return {index:definitions.indexOf(def),definition:def,round,time:0,locks:{},entities:[],done:false}}
function addCircle(out,entity){out.push({shape:'circle',r:.35,z0:0,z1:1,active:false,...entity})}
function sample(state,p){
 const out=[],t=state.time*balance.tempo,id=state.definition.id;
 if(id==='petals'){
  for(let wave=0;wave<balance.petalWaves;wave++){
   const fire=1.15+wave*1.6,age=t-fire;
   for(let lane=0;lane<balance.petalsPerWave;lane++){
    const angle=(lane-3)*.22+(wave?.11:-.03),dx=Math.sin(angle),dy=Math.cos(angle);
    if(t>=fire-.9&&age<0)out.push({kind:'path',id:`fan-warning-${wave}-${lane}`,x0:0,y0:0,x1:dx*12,y1:dy*12,width:.12,progress:1+age/.9,active:false});
    if(age>=0&&age<2.85){const x=dx*age*4.1,y=-.35+dy*age*4.1;if(y<8.6&&Math.abs(x)<6.7)addCircle(out,{kind:'petal',id:`petal-${wave}-${lane}`,x,y,r:.36,z0:.28,z1:.92,active:true,angle:t*7+lane,variant:lane%2})}
    if(age>=2.75&&age<3.05)out.push({kind:'spark',id:`petal-dust-${wave}-${lane}`,x:clamp(dx*2.75*4.1,-5.8,5.8),y:clamp(-.35+dy*2.75*4.1,.1,8),age:age-2.75,active:false});
   }
  }
 }
 if(id==='roots'){
  const gaps=[-2.7,2.7,-.4,2.0];
  for(let wave=0;wave<balance.rootWaves;wave++){
   const fire=1.2+wave*1.15,age=t-fire,y=age*3.0;
   for(const [side,x1,x2] of [['l',-6,gaps[wave]-.95],['r',gaps[wave]+.95,6]]){
    if(age>=-.95&&age<0)out.push({kind:'root-warning',id:`root-warn-${wave}-${side}`,x1,x2,y:.2,r:.18,progress:1+age/.95,active:false});
    if(age>=0&&y<8.5)out.push({kind:'root',shape:'capsule',id:`root-${wave}-${side}`,x1,x2,y,r:.18,z0:0,z1:.88,active:true,age});
   }
  }
 }
 if(id==='pollen'){
  for(let i=0;i<balance.seeds;i++){
   const lockAt=.35+i*.52,age=t-lockAt;
   if(age>=0&&!state.locks[i])state.locks[i]={x:clamp(p.x+(i%2?-.5:.5),-5.05,5.05),y:clamp(p.y,.95,7.05)};
   const target=state.locks[i];if(!target||age<0)continue;
   const flight=1.32,after=age-flight;
   if(age<flight){const q=age/flight;
    out.push({kind:'impact-warning',id:`seed-shadow-${i}`,...target,r:.78,progress:q,active:false});
    addCircle(out,{kind:'seed',id:`seed-${i}`,x:target.x*q,y:-.4+(target.y+.4)*q,z0:Math.sin(q*Math.PI)*5.1+(1-q)*2.2,z1:0,r:.25,active:false,age,q});
   }else if(after<1.05){addCircle(out,{kind:'cloud',id:`pollen-${i}`,...target,r:.78,z0:0,z1:.65,active:after<.85,age:after,fade:after<.85?1:(1.05-after)/.2})}
  }
 }
 if(id==='masks'){
  for(let i=0;i<balance.masks;i++){
   const home={x:(i-2)*2.3,y:.8},lockAt=1.25+i*.65,fire=lockAt+.50,age=t-fire;
   if(t>=lockAt&&!state.locks[i]){const dx=p.x-home.x,dy=p.y-home.y,d=Math.hypot(dx,dy)||1;state.locks[i]={dx:dx/d,dy:dy/d}}
   const aim=state.locks[i]||(()=>{const dx=p.x-home.x,dy=p.y-home.y,d=Math.hypot(dx,dy)||1;return {dx:dx/d,dy:dy/d}})();
   if(age<0||age<2.6){const x=home.x+aim.dx*Math.max(0,age)*5.1,y=home.y+aim.dy*Math.max(0,age)*5.1;
    if(y<8.7&&y>-.6&&Math.abs(x)<6.7)addCircle(out,{kind:'mask',id:`mask-${i}`,x,y,r:.43,z0:.65,z1:1.7,active:age>=0,age,locked:!!state.locks[i],dx:aim.dx,dy:aim.dy,variant:i});
   }
   if(t>=lockAt&&age<0)out.push({kind:'path',id:`mask-aim-${i}`,x0:home.x,y0:home.y,x1:home.x+aim.dx*14,y1:home.y+aim.dy*14,width:.13,progress:1+age/.5,active:false,locked:true});
  }
 }
 if(id==='spiral'){
  const grow=clamp((t-.5)/.8,0,1),fade=clamp((7.2-t)/.45,0,1),active=t>=1.35&&t<6.75;
  for(let i=0;i<balance.spiralBeads;i++){
   if(i===8||i===9||i===18)continue;
   const r=(.65+i*.18)*grow,a=(t-1.35)*.80+r*1.24-1.5;
   const x=Math.cos(a)*r,y=4+Math.sin(a)*r;
   if(y<.05||y>7.95||!grow||fade<=0)continue;
   if(!active&&t<1.35)out.push({kind:'impact-warning',id:`spiral-warn-${i}`,x,y,r:.27,progress:clamp(t/1.35,0,1),active:false});
   addCircle(out,{kind:'bead',id:`bead-${i}`,x,y,r:.21,z0:.24,z1:1.12,active,angle:a,variant:i%2,fade,age:t});
  }
 }
 if(id==='garden'){
  for(let wave=0;wave<balance.gardenWaves;wave++){
   const fire=1.5+wave*1.55,age=t-fire,safe=[2,1,2,1][wave];
   if(age< -1.2||age>=1.2)continue;
   for(let col=0;col<4;col++)for(let row=0;row<3;row++){
    if(col===safe)continue;
    const x=-4.5+col*3,y=1.5+row*2.45,opening=age<0?.12:age<.15?.12+.88*age/.15:age<.8?1:clamp((1.2-age)/.4,0,1);
    addCircle(out,{kind:'bud',shape:'box',id:`bud-${wave}-${col}-${row}`,x,y,r:.83,halfX:1.4,halfY:1.12,z0:0,z1:3.2,active:age>=.15&&age<.8,age,opening,progress:clamp(1+age/1.2,0,1),fade:age<.8?1:clamp((1.2-age)/.4,0,1)});
   }
  }
 }
 if(id==='rings'){
  for(let wave=0;wave<balance.ringFires.length;wave++){
   const fire=balance.ringFires[wave],age=t-fire;
   if(age>=-.65&&age<0)out.push({kind:'ring-warning',id:`ring-warn-${wave}`,x:0,y:-.65,r:.6,progress:1+age/.65,wave,active:false});
   if(age>=0&&age<3.9)out.push({kind:'ring',shape:'ring',id:`ring-${wave}`,x:0,y:-.65,r:age*3.35,thickness:.18,z0:0,z1:.48,active:true,gapCenter:Math.PI/2,gapHalf:wave===balance.ringFires.length-1?.37:0,wave,age});
  }
 }
 return out;
}
function collides(e,p){
 if(!e.active)return false;
 const pr=arena.playerRadius;
 if(p.z>=e.z1||p.z+arena.bodyHeight<=e.z0)return false;
 if(e.shape==='circle')return Math.hypot(p.x-e.x,p.y-e.y)<e.r+pr;
 if(e.shape==='box'){const x=clamp(p.x,e.x-e.halfX,e.x+e.halfX),y=clamp(p.y,e.y-e.halfY,e.y+e.halfY);return Math.hypot(p.x-x,p.y-y)<pr}
 if(e.shape==='capsule'){const x=clamp(p.x,e.x1,e.x2);return Math.hypot(p.x-x,p.y-e.y)<e.r+pr}
 if(e.shape==='ring'){
  const dx=p.x-e.x,dy=p.y-e.y,a=Math.atan2(dy,dx),r=Math.hypot(dx,dy),edge=e.thickness+pr;
  if(e.gapHalf&&angularDistance(a,e.gapCenter)<e.gapHalf){
   return [-1,1].some(side=>{const end=e.gapCenter+side*e.gapHalf;return Math.hypot(dx-Math.cos(end)*e.r,dy-Math.sin(end)*e.r)<edge});
  }
  return Math.abs(r-e.r)<edge;
 }
 return false;
}
function step(state,dt,from,to=from){
 if(state.done||!Number.isFinite(dt)||dt<=0)return [];
 const count=Math.ceil(Math.min(dt,.1)*120),step=Math.min(dt,.1)/count,hits=new Map();
 for(let i=1;i<=count;i++){
  const q=i/count,p=playerPoint({u:from.u+(to.u-from.u)*q,v:from.v+(to.v-from.v)*q,jump:from.jump+(to.jump-from.jump)*q});
  state.time+=step;state.entities=sample(state,p);
  for(const e of state.entities)if(collides(e,p))hits.set(e.id,{id:e.id,damage:state.definition.damage});
 }
 if(state.time>=state.definition.duration){state.done=true;state.entities=[]}
 return [...hits.values()];
}
function status(state){return state?{id:state.definition.id,name:state.definition.name,index:state.index,time:state.time,duration:state.definition.duration,done:state.done,hazards:state.entities.filter(e=>e.active).length,entities:state.entities.map(e=>({...e}))}:null}
globalThis.FlowerAttacks={definitions,balance,choose,arena,create,step,collides,playerPoint,status};
})();
