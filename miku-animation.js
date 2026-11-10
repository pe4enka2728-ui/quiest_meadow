/* Emotion columns, animation rows; this sampler does not depend on DOM or movement. */
(()=>{
const columns={neutral:0,worried:1,happy:2,surprised:3};
function sample(expression,speaking,time,lineAge=10){const column=columns[expression]??0,phase=time%4.3;let row=speaking&&Math.floor(time*7)%2?3:0;
 if(phase>=3.5&&phase<3.74)row=phase<3.56||phase>=3.68?1:2;
 const blink=row===1||row===2,reaction=Math.max(0,1-lineAge/.38),lift=(expression==='happy'?2:expression==='surprised'?1:0)*Math.sin(Math.max(0,Math.min(1,lineAge/.38))*Math.PI);
 return {column,row,blink,talking:row===3,offsetX:Math.round(Math.sin(time*.8)*.7),offsetY:Math.round(Math.sin(time*2.1)*.65-lift),scaleY:1+Math.sin(time*1.8)*.014,reaction};}
globalThis.MikuAnimation={sample,columns};
})();
