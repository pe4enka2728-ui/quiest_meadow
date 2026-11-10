/* Pause-aware crossroads scene; Miku remains here after the hearts leave. */
(()=>{
let api={},phase='idle',age=0,released=false,token=0,start=null;
const active=()=>phase!=='idle',ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
function persist(){try{localStorage.setItem('smile-miku-hearts-v1',JSON.stringify(released));}catch{}}
function cancel(){const owns=phase==='dialogue';phase='idle';age=0;token++;if(owns&&DialogueUI.isOpen)DialogueUI.close(false);api.lock?.(false);}
function restore(value=false){cancel();released=value===true;persist();}
function next(value){phase=value;age=0;}
function dialogue(graph,after){next('dialogue');const expected=token;DialogueUI.open(graph,{allowCancel:false,onDone(result){if(expected!==token||phase!=='dialogue'||!result.completed)return;after();}});}
function begin(){if(active()||released)return;token++;start=api.positions();next('turn');api.lock(true);api.faceTeto(2);}
function observe(location,hero){if(location==='heart-crossroads'&&!released&&!active()&&hero.y<=HeartRoadData.crossroads.triggerY&&Math.abs(hero.x-768)<180)begin();}
function update(dt){if(!active()||phase==='dialogue')return;age+=dt;const d=HeartRoadData.crossroads,t=MikuHeartsModel.timing;
 if(phase==='turn'&&age>=t.turn)dialogue(MikuHeartsModel.concern,()=>{start=api.positions();next('approach');});
 else if(phase==='approach'){const q=ease(age/t.approach),p=who=>({x:start[who].x+(d[who==='teto'?'tetoRest':'mikuRest'].x-start[who].x)*q,y:start[who].y+(d[who==='teto'?'tetoRest':'mikuRest'].y-start[who].y)*q});api.place({teto:p('teto'),miku:p('miku')},dt);if(age>=t.approach){api.rest();dialogue(MikuHeartsModel.unwell,()=>next('silence'));}}
 else if(phase==='silence'&&age>=t.silence)next('orbit');
 else if(phase==='orbit'&&age>=t.orbit)next('scatter');
 else if(phase==='scatter'&&age>=t.scatter){released=true;persist();api.pinMiku();dialogue(MikuHeartsModel.aftermath,()=>{next('idle');api.lock(false);api.notify('Найти три сердца Мику: ← красное · ↑ жёлтое · → голубое',7);});}
}
function heartSprite(g,x,y,color,scale=1,alpha=1){const rows=['01100110','11111111','11111111','01111110','00111100','00011000'],s=3*scale;g.save();g.globalAlpha*=alpha;g.translate(Math.round(x/3)*3,Math.round(y/3)*3);g.fillStyle='#252232';for(let y=0;y<rows.length;y++)for(let x=0;x<8;x++)if(rows[y][x]==='1')g.fillRect((x-4)*s-s/2,(y-3)*s-s/2,s*2,s*2);g.fillStyle=color;for(let y=0;y<rows.length;y++)for(let x=0;x<8;x++)if(rows[y][x]==='1')g.fillRect((x-4)*s,(y-3)*s,s,s);g.fillStyle='#fff1d2';g.fillRect(-2*s,-2*s,s,s);g.restore();}
function draw(g,cameraY){if(!['silence','orbit','scatter'].includes(phase))return;g.save();g.translate(0,-cameraY);const origin=HeartRoadData.crossroads.mikuRest;
 if(phase==='silence'){g.globalAlpha=.18+.12*Math.sin(age*6);g.fillStyle='#ab759f';for(let i=0;i<3;i++)g.fillRect(origin.x-24+i*21,origin.y-100+Math.sin(age*7+i)*8,3,3);}
 else for(let i=0;i<3;i++){const h=MikuHeartsModel.heart(i,phase,age,origin);for(let j=5;j>0;j--){const old=MikuHeartsModel.heart(i,phase,Math.max(0,age-j*.025),origin);g.fillStyle=h.color;g.globalAlpha=(1-j/6)*.25;g.fillRect(Math.round(old.x/3)*3,Math.round(old.y/3)*3,6,6);}g.globalAlpha=1;heartSprite(g,h.x,h.y,h.color,h.scale,h.alpha);}
 g.restore();}
function interact(){if(!released)return false;DialogueUI.open(MikuHeartsModel.waiting);return true;}
globalThis.MikuHearts={init(callbacks){api=callbacks;let saved=false;try{saved=JSON.parse(localStorage.getItem('smile-miku-hearts-v1')||'false');}catch{}restore(saved);},restore,cancel,observe,update,draw,interact,heartSprite,get isActive(){return active();},get released(){return released;},get sceneMiku(){return active()||released;},companion(location,proposed){return released&&!globalThis.HeartQuest?.flags.mikuRecovered?{...HeartRoadData.crossroads.mikuRest}:proposed;},status(){return {active:active(),phase,age,released,mikuAnchor:{...HeartRoadData.crossroads.mikuRest}};}};
})();
