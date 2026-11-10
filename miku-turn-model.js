/* Miku's own turn lifecycle. Attack scripts decide when the enemy turn ends. */
(()=>{
'use strict';
const timings=Object.freeze({action:.6,appear:.9,disappear:1.1});
const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
class Turns{
 constructor({dialogue=false}={}){this.phase=dialogue?'conversation':'command';this.age=0;this.turn=0;this.restOpacity=1;this.fromOpacity=1;this.action=null;}
 get canAct(){return this.phase==='command';}
 get movable(){return this.phase==='enemy';}
 get platformOpacity(){if(this.phase==='platform-out')return 1-ease(this.age/timings.disappear);if(this.phase==='platform-in')return this.fromOpacity+(1-this.fromOpacity)*ease(this.age/timings.appear);return this.restOpacity;}
 command(action){if(!this.canAct||!['attack','magic','items','guard'].includes(action))return false;this.action=action;this.phase='player';this.age=0;return true;}
 finishDialogue(){if(this.phase!=='conversation')return false;this.phase='command';this.age=0;return true;}
 beginEnemy(player){if(!['command','player'].includes(this.phase))return false;this.fromOpacity=this.platformOpacity;this.restOpacity=1;this.phase='platform-in';this.age=0;this.turn++;Object.assign(player,{u:.5,v:.5,dir:0,walk:0,jump:0,z:0});return true;}
 finishEnemy(player){if(this.phase!=='enemy')return false;this.phase='platform-out';this.age=0;player.jump=0;player.walk=0;return true;}
 complete(outcome,player){if(!['victory','defeat'].includes(outcome))return false;this.restOpacity=this.platformOpacity;this.phase=outcome;this.age=0;player.jump=0;player.walk=0;return true;}
 update(dt,player){dt=Number.isFinite(dt)?Math.max(0,dt):0;this.age+=dt;
  if(this.phase==='player'&&this.age>=timings.action){this.beginEnemy(player);return 'enemy-prepare';}
  if(this.phase==='platform-in'&&this.age>=timings.appear){this.phase='enemy';this.age=0;this.restOpacity=1;return 'enemy-start';}
  if(this.phase==='platform-out'&&this.age>=timings.disappear){this.phase='command';this.age=0;this.restOpacity=0;return 'command';}
  return null;
 }
 status(){return {phase:this.phase,age:this.age,turn:this.turn,platformOpacity:this.platformOpacity,canAct:this.canAct,movable:this.movable,action:this.action};}
}
globalThis.MikuTurnModel={Turns,timings};
})();
