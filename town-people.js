/* Three slow pedestrians. Their feet collide with scenery, each other and the party. */
(()=>{
'use strict';const p=(x,y)=>({x:x*2,y:y*2});
const definitions=[
 {id:'asya',name:'Ася',role:'Курьер',speed:33,seed:.4,text:'Не сейчас, пожалуйста. У меня срочное поручение. Не задерживай меня.',route:[[776,349],[775,414],[951,418],[1002,376],[1154,371],[1281,390],[1341,407],[1123,375],[1020,375],[982,398],[950,420],[775,432]]},
 {id:'lev',name:'Лев',role:'Рыбак',speed:27,seed:2.1,text:'Я на пристань тороплюсь. Поговорим как-нибудь потом, а сейчас не беспокой.',route:[[462,800],[637,801],[790,802],[1045,800],[1268,800],[1088,802],[795,803],[636,801]]},
 {id:'miron',name:'Мирон',role:'Горожанин',speed:25,seed:3.8,text:'Сегодня не до разговоров. Дай спокойно пройти, ладно?',route:[[86,499],[82,598],[82,692],[79,748],[88,708],[86,641],[83,552]]}
].map(d=>({...d,route:d.route.map(([x,y])=>p(x,y))}));
let people=[],clock=0;
function fresh(d){return {id:d.id,name:d.name,x:d.route[0].x,y:d.route[0].y,target:1,dir:2,walk:0,age:0,rest:0,moving:false,pause:d.seed*.12,seed:d.seed,height:96,path:[],stuck:0};}
function valid(raw){return !!raw&&raw.schema===1&&Array.isArray(raw.actors)&&raw.actors.length===3&&definitions.every(d=>raw.actors.some(a=>a.id===d.id&&Number.isFinite(a.x)&&a.x>=0&&a.x<=TownData.width&&Number.isFinite(a.y)&&a.y>=0&&a.y<=TownData.height&&Number.isInteger(a.target)&&a.target>=0&&a.target<d.route.length&&Number.isFinite(a.walk)&&a.walk>=0&&Number.isFinite(a.pause)&&a.pause>=0&&a.pause<30&&Number.isInteger(a.dir)&&a.dir>=0&&a.dir<4));}
function reset(raw=null,party=[]){clock=0;people=definitions.map(d=>{const a=fresh(d),saved=valid(raw)?raw.actors.find(a=>a.id===d.id):null;if(saved)Object.assign(a,{x:saved.x,y:saved.y,target:saved.target,walk:saved.walk,pause:saved.pause,dir:saved.dir});if(SpawnWorld.blocked(a.x,a.y,14,[],TownData.id)||party.some(p=>Math.hypot(p.x-a.x,p.y-a.y)<42)){const safe=d.route.find(q=>!SpawnWorld.blocked(q.x,q.y,14,[],TownData.id)&&party.every(p=>Math.hypot(p.x-q.x,p.y-q.y)>65));if(safe){a.x=safe.x;a.y=safe.y;a.target=(d.route.indexOf(safe)+1)%d.route.length;}}return a;});}
function colliders(exclude=null){return people.filter(a=>a.id!==exclude).map(a=>({id:'resident-'+a.id,type:'ellipse',x:a.x,y:a.y,rx:14,ry:14,label:'Прохожий: '+a.name}));}
function step(dt,party=[]){if(!Number.isFinite(dt)||dt<=0||SpawnWorld.zone!==TownData.id)return;dt=Math.min(.05,dt);clock+=dt;if(!people.length)reset(null,party);
 for(const a of people){const d=definitions.find(d=>d.id===a.id),old={x:a.x,y:a.y};if(party.some(p=>Math.hypot(p.x-a.x,p.y-a.y)<32)){a.pause=Math.max(a.pause,.12);ActorMotion.update(a,old,dt);continue;}if(a.pause>0){a.pause=Math.max(0,a.pause-dt);ActorMotion.update(a,old,dt);continue;}
  if(!a.path.length){const target=d.route[a.target];a.path=SpawnWorld.route(a,target,[]);if(!a.path.length){a.target=(a.target+1)%d.route.length;a.pause=.4;ActorMotion.update(a,old,dt);continue;}}
  const q=a.path[0],dx=q.x-a.x,dy=q.y-a.y,len=Math.hypot(dx,dy);if(len<2){a.path.shift();if(!a.path.length){a.target=(a.target+1)%d.route.length;a.pause=.35+(a.target%3)*.2;}ActorMotion.update(a,old,dt);continue;}
  const amount=Math.min(len,d.speed*dt),next={x:a.x+dx/len*amount,y:a.y+dy/len*amount};if(party.some(p=>Math.hypot(next.x-p.x,next.y-p.y)<30&&Math.hypot(next.x-p.x,next.y-p.y)<Math.hypot(a.x-p.x,a.y-p.y))){a.pause=.3;ActorMotion.update(a,old,dt);continue;}const dynamic=[...colliders(a.id),...party.map((p,i)=>({id:'party-'+i,type:'ellipse',x:p.x,y:p.y,rx:14,ry:14,label:'Путник'}))];if(!SpawnWorld.blocked(a.x,a.y,14,dynamic,TownData.id))SpawnWorld.move(a,dx/len*amount,dy/len*amount,null,dynamic,TownData.id);const moved=Math.hypot(a.x-old.x,a.y-old.y);a.stuck=moved<.01?a.stuck+dt:0;if(a.stuck>1){a.pause=.5;a.stuck=0;}ActorMotion.update(a,old,dt);
 }
}
function capture(){return {schema:1,actors:(people.length?people:definitions.map(fresh)).map(({id,x,y,target,walk,pause,dir})=>({id,x,y,target,walk,pause,dir}))};}
function nearby(hero){return people.filter(a=>ActorMotion.facesTarget(hero,a,106)).sort((a,b)=>Math.hypot(a.x-hero.x,a.y-hero.y)-Math.hypot(b.x-hero.x,b.y-hero.y))[0]||null;}
function dialogue(a){const d=definitions.find(d=>d.id===a.id);return {start:'busy',nodes:{busy:{speaker:d.name,residentId:d.id,text:d.text,choices:[{label:'Не буду мешать.'}]}}};}
globalThis.TownPeople={definitions,reset,valid,step,colliders,capture,nearby,dialogue,get actors(){return people;},status(){return {clock,actors:people.map(a=>({...a,path:a.path.map(p=>({...p}))}))};}};
})();
