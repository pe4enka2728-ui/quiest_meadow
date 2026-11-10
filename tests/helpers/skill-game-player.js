/* Input-only test player: observes public challenge state and returns physical actions. */
(()=>{
const keys={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',confirm:'Space'};
function actions(s){
 const hold=[],tap=[],t=s.time,d=s.data,k=s.kind;if(s.phase!=='play')return {hold,tap};
 if(['ring','heart','discord','slash','double','shield','tempo','chorus'].includes(k))for(const c of s.cues)if(c.score===null&&t>=c.time-.004&&t<=c.time+.04)tap.push(c.key);
 if(k==='thorn'){const gate=d.gates.find(g=>!g.passed);if(gate){if(d.y>gate.y+2)hold.push('up');if(d.y<gate.y-2)hold.push('down');}}
 if(k==='mist'){const target=.5+Math.sin(t*2.4+d.seed)*.16;if(d.level<target+.015)hold.push('confirm');}
 if(k==='glass'){if(d.tilt>.015)hold.push('left');if(d.tilt<-.015)hold.push('right');}
 if(k==='step'){const index=Math.min(3,Math.floor(t/(s.duration/4)));if(t>index*(s.duration/4)+.25&&d.answers[index]===undefined)tap.push(d.paths[index]);}
 if(k==='reverse'&&t>=.95&&d.answers.length<3)tap.push(d.sequence[2-d.answers.length]);
 if(k==='wand'){const key=['up','right','down','left'].find(v=>v!==d.fake&&!d.collected.includes(v));if(key)tap.push(key);}
 if(k==='breath'&&((t>=.25&&t<1)||(t>=1.6&&t<2.35)))hold.push('confirm');
 if(k==='dome')for(let i=0;i<2;i++){const a=d.angles[i]+t*(i? -2.8:2.8);if(d.stops[i]===null&&Math.abs(Math.atan2(Math.sin(a),Math.cos(a)))<.022)tap.push(i?'right':'left');}
 if(k==='focus'&&!d.locked){if(d.x>1.5)hold.push('left');if(d.x<-1.5)hold.push('right');if(d.y>1.5)hold.push('up');if(d.y<-1.5)hold.push('down');}
 return {hold,tap};
}
globalThis.SkillGameTestPlayer={actions,keys};if(typeof module!=='undefined')module.exports=globalThis.SkillGameTestPlayer;
})();
