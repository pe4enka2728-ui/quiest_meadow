/* Circus hazards use the same swept 3D collision contract as the first battle. */
(()=>{
const definitions=[
 {id:'puppet-strings',name:'Нити сверху',duration:6.4,damage:5,phrase:'Не двигайся... Это говорю не я.',model:'falling-needle'},
 {id:'stage-lights',name:'Жёлтый прожектор',duration:7,damage:5,phrase:'Свет нашёл тебя. Уходи из круга.',model:'pixel-spotlight'},
 {id:'circus-stars',name:'Звёздная карусель',duration:7.6,damage:5,phrase:'Нити ведут по кругу. Снова и снова.',model:'extruded-star'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function choose(previous=-1,random=Math.random){const excluded=previous>=0&&previous<definitions.length,n=definitions.length-(excluded?1:0),pick=Math.min(n-1,Math.max(0,Math.floor(random()*n)));return excluded&&pick>=previous?pick+1:pick}
function create(index,round=1){index=((index%definitions.length)+definitions.length)%definitions.length;return {index,definition:definitions[index],round,time:0,locks:{},entities:[],done:false}}
function sample(s,p){const out=[],t=s.time,id=s.definition.id;
 if(id==='puppet-strings')for(let wave=0;wave<5;wave++){const age=t-(1.1+wave*1.03),key='needle-'+wave;if(age>=-.85&&!s.locks[key])s.locks[key]={x:p.x,y:p.y};const at=s.locks[key];if(!at)continue;
  for(let lane=-1;lane<=1;lane++){const x=clamp(at.x+lane*2.4,-5.45,5.45),y=clamp(at.y+(lane?wave%2?.8:-.8:0),.9,7.45),eid=`gumi-needle-${wave}-${lane}`;
   if(age>=-.85&&age<0)out.push({kind:'gumi-warning',id:eid+'-warning',x,y,r:.50,progress:1+age/.85,active:false});
   if(age>=0&&age<.85){const z=Math.max(0,5-age*13);out.push({kind:'gumi-needle',shape:'circle',id:eid,x,y,r:.22,z0:z,z1:z+1.7,active:age<.42,age,fade:age<.6?1:(.85-age)/.25})}
  }
 }
 if(id==='stage-lights')for(let wave=0;wave<4;wave++){const age=t-(1.2+wave*1.45),key='light-'+wave;if(age>=-.9&&!s.locks[key])s.locks[key]={x:p.x,y:p.y};const at=s.locks[key];if(!at)continue;
  for(let lane=0;lane<2;lane++){const x=clamp(lane?-at.x+(wave%2?1.5:-1.5):at.x,-4.8,4.8),y=clamp(lane?8-at.y:at.y,1.2,6.8);if(age>=-.9&&age<.9)out.push({kind:'gumi-light',shape:'circle',id:`gumi-light-${wave}-${lane}`,x,y,r:1,z0:0,z1:3.5,active:age>=0,progress:clamp(1+age/.9,0,1),age})}
 }
 if(id==='circus-stars')for(let wave=0;wave<3;wave++){const age=t-(1.1+wave*1.7);for(let lane=0;lane<7;lane++){const angle=(lane-3)*.205+(wave%2?.09:-.04),dx=Math.sin(angle),dy=Math.cos(angle);
  if(age>=-.85&&age<0)out.push({kind:'gumi-ray',id:`gumi-star-warning-${wave}-${lane}`,x0:0,y0:0,x1:dx*10,y1:dy*10,progress:1+age/.85,active:false});
  if(age>=0&&age<2.6){const x=dx*age*3.8,y=-.25+dy*age*3.8;if(Math.abs(x)<6.4&&y<8.5)out.push({kind:'gumi-star',shape:'circle',id:`gumi-star-${wave}-${lane}`,x,y,r:.32,z0:.25,z1:1,active:true,angle:t*5+lane,variant:wave%2})}
 }}return out;
}
function step(s,dt,from,to=from){if(s.done||!Number.isFinite(dt)||dt<=0)return [];const count=Math.ceil(Math.min(dt,.1)*120),delta=Math.min(dt,.1)/count,hits=new Map();for(let i=1;i<=count;i++){const q=i/count,p=FlowerAttacks.playerPoint({u:from.u+(to.u-from.u)*q,v:from.v+(to.v-from.v)*q,jump:from.jump+(to.jump-from.jump)*q});s.time+=delta;s.entities=sample(s,p);for(const e of s.entities)if(FlowerAttacks.collides(e,p))hits.set(e.id,{id:e.id,damage:5})}if(s.time>=s.definition.duration){s.done=true;s.entities=[]}return [...hits.values()]}
function status(s){return s?{id:s.definition.id,name:s.definition.name,index:s.index,time:s.time,duration:s.definition.duration,done:s.done,hazards:s.entities.filter(e=>e.active).length,entities:s.entities.map(e=>({...e}))}:null}
globalThis.GumiAttacks={definitions,choose,create,step,sample,status};
})();
