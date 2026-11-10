/* One common return sequence for every player defeat: nearest crystal, then comfort. */
(()=>{
let api={},phase='idle',age=0,destination=null,token=0;const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
function cancel(){const owns=phase==='dialogue';phase='idle';age=0;token++;if(owns&&DialogueUI.isOpen)DialogueUI.close(false);api.lock?.(false);}
function start(origin){cancel();destination=RespawnModel.nearest(origin.location,origin.hero,origin.flags);api.place(destination);phase='recovery';age=0;api.lock(true);}
function update(dt){if(phase!=='recovery')return;age+=dt;if(age>=1){phase='dialogue';const expected=token;DialogueUI.open(RespawnModel.dialogue,{allowCancel:false,onDone(result){if(expected!==token||phase!=='dialogue'||!result.completed)return;phase='idle';age=0;api.lock(false);api.notify('Тето и Мику готовы идти дальше.',2);}});}}
function draw(g,cameraY){if(phase!=='recovery')return;g.save();g.fillStyle=`rgba(3,7,17,${1-ease(age/.75)})`;g.fillRect(0,0,1536,1024);for(const actor of api.positions()){for(let i=0;i<8;i++){const a=i*Math.PI/4+age,r=15+age*24;g.globalAlpha=Math.max(0,1-age);g.fillStyle=i%2?'#b1f6e0':'#f5e6b9';g.fillRect(Math.round((actor.x+Math.cos(a)*r)/3)*3,Math.round((actor.y-cameraY-30+Math.sin(a)*r-age*25)/3)*3,3,3);}}g.restore();}
globalThis.DeathReturn={init(options){api=options},start,cancel,update,draw,get isActive(){return phase!=='idle'},status(){return {active:phase!=='idle',phase,age,checkpoint:destination?{...destination,teto:{...destination.teto},miku:{...destination.miku}}:null};}};
})();
