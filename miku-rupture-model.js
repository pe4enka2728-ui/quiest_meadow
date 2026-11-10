/* Ordered scene dissolution and a C2-smooth falling trajectory. */
(()=>{
'use strict';
const order=['laugh','question','vegetation','decor','echoes','world','fall','done'],durations={laugh:1.8,vegetation:3.2,decor:2.8,echoes:2.2,world:3,fall:8};
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*n*(10+n*(-15+6*n));};
class Sequence{
 constructor(){this.phase='laugh';this.age=0;this.clock=0;}
 update(dt){if(this.phase==='done')return null;this.clock+=dt;this.age+=dt;let event=null;while(durations[this.phase]!==undefined&&this.age>=durations[this.phase]-1e-9){this.age=Math.max(0,this.age-durations[this.phase]);this.phase=order[order.indexOf(this.phase)+1];if(this.phase==='question'){this.age=0;return 'question';}if(this.phase==='done'){this.age=0;return 'arena';}}return event;}
 continue(){if(this.phase==='question'){this.phase='vegetation';this.age=0;}}
 opacity(group){const fade=order.indexOf(group),now=order.indexOf(this.phase);return now<fade?1:now===fade?1-ease(this.age/durations[group]):0;}
 get laughing(){return order.indexOf(this.phase)<=order.indexOf('echoes');}
 fall(){const u=clamp(this.age/durations.fall),split=.46,y=u<=split?-180+692*ease(u/split):512+788*ease((u-split)/(1-split));return {u,x:768,y,rotation:Math.PI*4*ease(u),wind:Math.min(1,u/.12,(1-u)/.12)};}
 status(){return {phase:this.phase,age:this.age,clock:this.clock,laughing:this.laughing,opacity:Object.fromEntries(['vegetation','decor','echoes','world'].map(g=>[g,this.opacity(g)])),fall:this.phase==='fall'?this.fall():null};}
}
globalThis.MikuRuptureModel={Sequence,durations,order,ease};
})();
