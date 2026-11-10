/* E ignites a four-second fuse; only this finale is permitted to end Gumi's battle. */
(()=>{
'use strict';
const settings=Object.freeze({drop:1.2,fuse:4,flight:.65,smokeBeforeRelease:3,fall:1.1,smokeFade:2.5});
function create(){return {phase:'inactive',age:0,time:0,started:false,complete:false,events:[],cannon:{u:.64,v:.82},fired:false,released:false}}
function start(s){if(s.started)return false;s.started=true;s.phase='drop';s.age=0;s.events=[{type:'stop-all-hazards'},{type:'restore-temporary-floor'}];return true}
function interact(s){if(s.phase!=='await-e')return false;s.phase='fuse';s.age=0;s.events=[{type:'fuse-start'}];return true}
function advance(s,phase,type){s.phase=phase;s.age=0;if(type)s.events.push({type});}
function step(s,dt,paused=false){if(!s.started||s.complete||paused||!Number.isFinite(dt)||dt<=0)return [];s.events=[];let left=dt;while(left>1e-9&&!s.complete){const delta=Math.min(left,1/120);left-=delta;s.age+=delta;s.time+=delta;
 if(s.phase==='drop'&&s.age>=settings.drop-1e-9)advance(s,'await-e','cannon-landed');
 else if(s.phase==='fuse'&&s.age>=4-1e-9){s.fired=true;advance(s,'shot','cannon-fired')}
 else if(s.phase==='shot'&&s.age>=settings.flight-1e-9)advance(s,'smoke','cannon-impact');
 else if(s.phase==='smoke'&&s.age>=3-1e-9){s.released=true;advance(s,'fall','strings-released')}
 else if(s.phase==='fall'&&s.age>=settings.fall-1e-9)advance(s,'clear');
 else if(s.phase==='clear'&&s.age>=settings.smokeFade-1e-9){s.complete=true;advance(s,'complete','victory')}
 }return s.events.map(e=>({...e}));}
function status(s){return {phase:s.phase,age:s.age,time:s.time,started:s.started,complete:s.complete,cannon:{...s.cannon},drop:!s.started?0:s.phase==='drop'?Math.min(1,s.age/1.2):1,fuseProgress:s.phase==='fuse'?Math.min(1,s.age/4):s.fired?1:0,shotProgress:s.phase==='shot'?Math.min(1,s.age/.65):s.fired?1:0,smoke:s.phase==='smoke'?1:s.phase==='fall'?1-.35*Math.min(1,s.age/settings.fall):s.phase==='clear'?.65*Math.max(0,1-s.age/settings.smokeFade):0,fallProgress:s.phase==='fall'?Math.min(1,s.age/1.1):s.released?1:0,stringsReleased:s.released,awaitingInteraction:s.phase==='await-e'}}
globalThis.GumiFinaleModel={settings,create,start,interact,step,status};
})();
