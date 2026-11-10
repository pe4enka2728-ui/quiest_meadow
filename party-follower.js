/* Replan around a pedestrian occupying an old trail point, without displacing either actor. */
(()=>{
'use strict';let path=[],goal=null,retry=0,detours=0,stuck=0;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function reset(){path=[];goal=null;retry=0;detours=0;stuck=0;}
function anchor(trail,gap){let left=gap;for(let i=trail.length-1;i>0;i--){const b=trail[i],a=trail[i-1],d=distance(a,b);if(d>=left)return {x:b.x+(a.x-b.x)*left/d,y:b.y+(a.y-b.y)*left/d,index:i};left-=d;}return {...trail[0],index:0};}
function step(body,hero,trail,dt,gap=86,speedScale=1){
 const W=SpawnWorld;retry=Math.max(0,retry-dt);if(trail.length<2)return;
 const dynamic=TownPeople.colliders();let target=anchor(trail,gap);
 if(W.blocked(target.x,target.y,W.RADIUS,dynamic)){
  // Use another safe point on the hero's actual trail when its former anchor is occupied.
  let found=false,from={...target};for(let i=Math.max(1,target.index);i<trail.length&&!found;i++){const end=trail[i],steps=Math.max(1,Math.ceil(distance(from,end)/7));for(let j=1;j<=steps;j++){const p={x:from.x+(end.x-from.x)*j/steps,y:from.y+(end.y-from.y)*j/steps};if(distance(p,hero)<44)break;if(!W.blocked(p.x,p.y,W.RADIUS,dynamic)){target={...p,index:i};found=true;break;}}from=end;}
 }
 const d=distance(body,target);if(d<3){path=[];stuck=0;if(target.index>1)trail.splice(0,target.index,{x:body.x,y:body.y});return;}
 if(W.blocked(target.x,target.y,W.RADIUS,dynamic)){path=[];return;}
 if(W.clear(body,target,dynamic)){path=[{x:target.x,y:target.y}];goal={...target};}
 else if(retry===0&&(!path.length||!goal||distance(goal,target)>28||!W.clear(body,path[0],dynamic)||stuck>.15)){
  path=W.route(body,target,dynamic);goal={...target};retry=.45;if(path.length)detours++;
 }
 let budget=Math.min((d>125?275:200)*speedScale*dt,Math.max(0,d-1));const before={x:body.x,y:body.y};
 while(path.length&&budget>.001){const q=path[0],len=distance(body,q);if(len<1){path.shift();continue;}const amount=Math.min(len,budget),old={x:body.x,y:body.y};W.move(body,(q.x-body.x)/len*amount,(q.y-body.y)/len*amount,null,dynamic);const moved=distance(body,old);if(moved<.005)break;budget-=amount;if(distance(body,q)<1)path.shift();}
 stuck=distance(body,before)<.02?stuck+dt:0;
 if(distance(body,target)<3&&target.index>1)trail.splice(0,target.index,{x:body.x,y:body.y});else trail[0]={x:body.x,y:body.y};
}
globalThis.PartyFollower={step,reset,status(){return {path:path.map(p=>({...p})),goal:goal&&{...goal},retry,detours,stuck};}};
})();
