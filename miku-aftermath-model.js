/* Continuous, time-based staging. Dialogues are explicit gates, never timers. */
(()=>{
'use strict';const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*x*(10+x*(-15+x*6));};
const order=['return','recovery','portal-in','portal-talk','retreat','pull','hypnosis','pan','sky-open','fall','land','arrival','done'];
const durations={'return':1.1,'portal-in':1.8,retreat:1.9,pull:5.8,hypnosis:5,pan:3.2,'sky-open':1.3,fall:2.8,land:1};
const portal={x:750,y:-3205,size:286};
const start={teto:{x:680,y:-2965,dir:1},miku:{x:798,y:-2976,dir:3}},retreated={teto:{x:660,y:-2880,dir:2},miku:{x:820,y:-2892,dir:2}};
class Sequence{
 constructor(stage='return'){this.phase=order.includes(stage)?stage:'return';this.age=0;this.clock=0;}
 advance(){this.phase=order[order.indexOf(this.phase)+1]||'done';this.age=0;return this.phase;}
 update(dt){if(this.phase==='done')return [];dt=Number.isFinite(dt)?Math.max(0,dt):0;this.clock+=dt;this.age+=dt;const events=[];while(durations[this.phase]!==undefined&&this.age>=durations[this.phase]-1e-9){const rest=Math.max(0,this.age-durations[this.phase]);events.push(this.advance());this.age=rest;}return events;}
 continue(){if(['recovery','portal-talk','arrival'].includes(this.phase))return this.advance();return null;}
 get cloud(){return order.indexOf(this.phase)>=order.indexOf('pan');}
 get portalOpacity(){if(this.phase==='portal-in')return ease(this.age/durations['portal-in']);if(['portal-talk','retreat','pull'].includes(this.phase))return 1;if(this.phase==='sky-open')return ease(this.age/durations['sky-open']);if(this.phase==='fall')return 1;if(this.phase==='land')return 1-ease(this.age);return 0;}
 actors(){
  return ['teto','miku'].map((name,i)=>{
   const p={...start[name],name,scale:1,alpha:1,rotation:0,shadow:1,frame:undefined};
   if(this.phase==='retreat'){const q=ease(this.age/durations.retreat);p.x+=(retreated[name].x-p.x)*q;p.y+=(retreated[name].y-p.y)*q;p.dir=2;p.frame=6+[1,0,1,2][Math.floor(this.age*7)%4];}
   if(this.phase==='pull'){
    const q=clamp((this.age-(i?.65:.15))/(i?4.9:4.7)),t=Math.pow(q,1.65),target={x:portal.x+(i?11:-11),y:portal.y+42};p.x=retreated[name].x+(target.x-retreated[name].x)*t+Math.sin(this.age*19+i*2)*(1-q)*2;p.y=retreated[name].y+(target.y-retreated[name].y)*t;p.scale=1-.97*ease((q-.17)/.83);p.alpha=1-ease((q-.85)/.15);p.rotation=Math.sin(this.age*9+i)*.085*(1-q);p.shadow=(1-ease(q/.65))*.8;p.dir=0;
   }
   if(['hypnosis','pan','sky-open'].includes(this.phase)){p.alpha=0;p.shadow=0;}
   if(['fall','land','arrival','done'].includes(this.phase)){
    const land=i?{x:816,y:768}:{x:700,y:740},q=this.phase==='fall'?clamp((this.age-i*.32)/2.25):1,t=q*q*(2-q);p.x=768+(land.x-768)*ease(q);p.y=152+(land.y-152)*t;p.scale=.42+.58*ease(q/.6);p.alpha=ease(q/.13);p.rotation=Math.sin(q*Math.PI*2+i*.6)*.12*(1-q);p.shadow=ease((q-.75)/.25);p.dir=2;
    if(this.phase==='land'){p.scale=1+Math.sin(this.age*8)*.026*Math.exp(-this.age*4);}
   }
   return p;
  });
 }
 status(){return {phase:this.phase,age:this.age,clock:this.clock,cloud:this.cloud,portal:{...portal,alpha:this.portalOpacity},actors:this.actors(),panOffset:this.phase==='pan'?870*(1-ease(this.age/durations.pan)):0,shake:this.phase==='pull'?{x:Math.sin(this.age*17)*1.5,y:Math.sin(this.age*13)*.75}:{x:0,y:0}};}
}
globalThis.MikuAftermathModel={Sequence,order,durations,ease,start,retreated,portal};
})();
