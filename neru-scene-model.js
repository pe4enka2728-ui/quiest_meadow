/* Celestial lighting and a cloud arena. Shared projection and original meeting dialogue. */
(()=>{
'use strict';
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const settings=Object.freeze({maxHp:600,enemyDuration:6,entryDuration:2.6,skyPeriod:12,jumpDuration:.72});
const field=Object.freeze({width:12,depth:8,bodyRadius:.19,centerX:768,centerY:580,rx:520,ry:163});
const columns=Object.freeze([{id:'neru-column-0',u:.26,v:.34},{id:'neru-column-1',u:.74,v:.34},{id:'neru-column-2',u:.36,v:.76},{id:'neru-column-3',u:.64,v:.76}].map(c=>Object.freeze({...c,radius:.44,height:5.4,scale:2.3})));
function project(u,v){return [768+(u-.5)*(800+470*v),425+295*v];}
function sky(age=0){const night=(1-Math.cos(Math.max(0,age)*Math.PI*2/settings.skyPeriod))/2;return {night,day:1-night,stars:ease((night-.35)/.65)};}
function constrain(u,v){let x=(u-.5)/.43,y=(v-.52)/.42,d=Math.hypot(x,y);if(d>1){x/=d;y/=d;}return {u:.5+x*.43,v:.52+y*.42};}
function blocked(p,radius=field.bodyRadius,solids=columns){return solids.some(c=>Math.hypot((p.u-c.u)*field.width,(p.v-c.v)*field.depth)<c.radius+radius-1e-7);}
function recover(p,solids=columns){for(let pass=0;pass<2;pass++){Object.assign(p,constrain(p.u,p.v));for(const c of solids){let x=(p.u-c.u)*field.width,y=(p.v-c.v)*field.depth,d=Math.hypot(x,y),r=c.radius+field.bodyRadius;if(d<r){if(d<1e-9){x=1;y=0;d=1;}p.u=c.u+x/d*r/field.width;p.v=c.v+y/d*r/field.depth;}}}return p;}
function move(player,dt,input={},solids=columns){const dx=input.dx||0,dy=input.dy||0,d=Math.hypot(dx,dy)||1,s=input.speedScale||1,du=dx/d*.35*s*dt,dv=dy/d*.58*s*dt,steps=Math.max(1,Math.ceil(Math.hypot(du*field.width,dv*field.depth)/.09));recover(player,solids);for(let i=0;i<steps;i++){player.u+=du/steps;player.v+=dv/steps;recover(player,solids);}if(dx||dy){player.walk+=dt*120;player.dir=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?2:0;}player.jump=Math.max(0,(player.jump||0)-dt);player.z=player.jump?Math.sin((1-player.jump/settings.jumpDuration)*Math.PI)*56:0;}
// Shared solid cylinders provide cover for future shots; no enemy attack is added here.
function coverBetween(from,to,radius=0,solids=columns){const dx=(to.u-from.u)*field.width,dy=(to.v-from.v)*field.depth,a=dx*dx+dy*dy;let hit=null,best=Infinity;if(a<1e-12)return null;for(const c of solids){const x=(from.u-c.u)*field.width,y=(from.v-c.v)*field.depth,r=c.radius+radius,b=2*(x*dx+y*dy),disc=b*b-4*a*(x*x+y*y-r*r);if(disc<0)continue;let enter=Math.max(0,(-b-Math.sqrt(disc))/(2*a)),exit=Math.min(1,(-b+Math.sqrt(disc))/(2*a));const z=from.z??1,dz=(to.z??1)-z;if(Math.abs(dz)<1e-10){if(z<0||z>c.height)continue;}else{const t0=-z/dz,t1=(c.height-z)/dz;enter=Math.max(enter,Math.min(t0,t1));exit=Math.min(exit,Math.max(t0,t1));}if(enter<=exit&&enter<best){hit=c;best=enter;}}return hit;}
const dialogue={start:'n0',nodes:Object.fromEntries([
 ['Неру','Ты всё-таки вернула её голос.','neutral'],
 ['Тето','Неру?.. Это ты держала Мику под гипнозом?','surprised'],
 ['Неру','Она уже почти перестала сопротивляться. А потом ты собрала сердца — и мой сигнал оборвался.','angry'],
 ['Мику','Я слышала тебя… Но не могла остановиться.'],
 ['Тето','Я просто хотела вернуть её. Больше ты её не тронешь.'],
 ['Неру','Просто хотела? Ты разрушила то, что должно было работать безупречно.','angry'],
 ['Тето','Послушай, вокруг меняется небо… Что ты делаешь?','surprised'],
 ['Неру','Здесь даже день и ночь идут по моей воле. Я хотела проверить, сколько ты выдержишь.'],
 ['Мику','Тето, не смотри ей в глаза. Я больше не позволю ей забрать меня.'],
 ['Тето','Тогда перестань прятаться за гипнозом. Отпусти нас.'],
 ['Неру','Нет. Раз ты сумела разорвать мой гипноз, я уничтожу тебя сама. Лицом к лицу.','angry'],
 ['Тето','Я не оставлю Мику. И тебе не сдамся.'],
 ['Неру','Тогда защищайся.','angry']
].map((l,i,a)=>['n'+i,{speaker:l[0],text:l[1],face:l[2]||'worried',choices:[{label:i===a.length-1?'Защитить Мику.':'…',...(i<a.length-1?{next:'n'+(i+1)}:{})}]}]))};
globalThis.NeruSceneModel={settings,field,columns,project,sky,constrain,blocked,recover,move,coverBetween,ease,dialogue};
})();
