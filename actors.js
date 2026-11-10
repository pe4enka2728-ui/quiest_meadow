/* Animation clocks belong to each actor; diagonals retain a stable facing. */
(()=>{
function facing(body,dx,dy){const ax=Math.abs(dx),ay=Math.abs(dy);if(Math.hypot(dx,dy)<.025)return body.dir;const horizontal=dx>0?1:3,vertical=dy>0?2:0;if(ax>.001&&ay>.001&&ax/ay>.72&&ax/ay<1.38){if(body.dir!==horizontal&&body.dir!==vertical)body.dir=vertical;}else body.dir=ax>ay?horizontal:vertical;return body.dir}
function update(body,old,dt){const dx=body.x-old.x,dy=body.y-old.y,d=Math.hypot(dx,dy);body.moving=d>.025;body.age=(body.age||0)+dt;if(body.moving){facing(body,dx,dy);body.walk=(body.walk||0)+d/16;body.rest=0}else body.rest=(body.rest||0)+dt;}
const idleSettings={teto:{delay:12,duration:4.2,period:22},miku:{delay:10,duration:4.8,period:21}};
function longIdle(body){const settings=idleSettings[body.idleStyle],rest=body.rest||0;if(!settings||body.moving||rest<settings.delay)return null;const age=(rest-settings.delay)%settings.period;if(age>=settings.duration)return null;const progress=age/settings.duration,envelope=Math.sin(progress*Math.PI)**2;
 if(body.idleStyle==='teto'){const stretch=age<2.2?Math.sin(age/2.2*Math.PI)**2:0,look=age>2.2?Math.sin((age-2.2)/2*Math.PI*2)*Math.sin((age-2.2)/2*Math.PI)**2:0;return {name:'stretch',progress,stretch,lean:look*.018,headTilt:look*.09,armRaise:stretch*1.45};}
 const sway=Math.sin(progress*Math.PI*4)*envelope;return {name:'sway',progress,stretch:0,lean:sway*.027,headTilt:-sway*.08,armRaise:0};
}
function pose(body,t,allowLongIdle=true){const seed=body.seed||0;const walking=!!body.moving,frame=body.dir*3+(walking?[1,0,1,2][Math.floor(body.walk||0)%4]:1);const breath=walking?0:Math.sin(t*2.15+seed),blinkCycle=(t+seed*2.1)%5.4,idle=allowLongIdle?longIdle(body):null;return {frame,breath,blink:!walking&&body.dir===2&&blinkCycle>4.9&&blinkCycle<5.05,scaleY:1+breath*.013+(idle?.stretch||0)*.06,offsetX:walking?0:Math.sin(t*.7+seed)*.45,idle};}
function facesTarget(body,target,range=115){const dx=target.x-body.x,dy=target.y-body.y,d=Math.hypot(dx,dy);if(d<.01||d>range)return false;const [x,y]=[[0,-1],[1,0],[0,1],[-1,0]][body.dir]||[0,0];return (dx*x+dy*y)/d>=Math.SQRT1_2-1e-6;}
globalThis.ActorMotion={facing,update,pose,facesTarget,longIdle,idleSettings};
})();
