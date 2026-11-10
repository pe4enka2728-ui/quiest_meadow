/* Victory -> recovery -> portal -> five-second hypnosis -> cloud island. */
(()=>{
'use strict';let api={},images={},model=null,token=0,buffer=null;
const graph=lines=>({start:'n0',nodes:Object.fromEntries(lines.map((l,i)=>['n'+i,{speaker:l[0],face:l[2]||'worried',text:l[1],choices:[{label:i===lines.length-1?'Продолжить.':'…',...(i<lines.length-1?{next:'n'+(i+1)}:{})}]}]))});
const recovery=graph([['Тето','Мику?.. Ты меня слышишь?'],['Мику','Тето… Что со мной было? Я будто смотрела на всё издалека.'],['Тето','Ты больше не там. Посмотри на меня. Мы снова вместе.','happy'],['Мику','Я помню твой голос… Спасибо, что не ушла.','happy']]);
const portalTalk=graph([['Тето','Это ещё что?.. Откуда здесь портал?','surprised'],['Мику','Он появился только что. Мне не нравится, как он движется.'],['Тето','Не будем туда идти. Давай отойдём подальше.'],['Мику','Да. Только держись рядом.']]);
const arrival=graph([['Тето','Мы… стоим на облаке?','surprised'],['Мику','Смотри. Там, впереди… Неру.']]);
function cancel(){const was=!!model;token++;model=null;if(was&&DialogueUI.isOpen)DialogueUI.close(false);if(was)api.lock?.(false);}
function talk(which){const id=token;DialogueUI.open(which,{allowCancel:false,onDone(r){if(id!==token||!model||!r.completed)return;const before=model.phase,next=model.continue();if(before==='recovery')api.flag?.('mikuRecovered');enter(next);}});}
function enter(phase){if(!model)return;
 if(phase==='recovery')talk(recovery);
 if(phase==='portal-talk')talk(portalTalk);
 if(phase==='pan'){api.flag?.('cloudReached');api.cloud?.();}
 if(phase==='arrival')talk(arrival);
 if(phase==='done'){const actors=model.actors();api.land?.(actors);model=null;api.lock?.(false);api.save?.('Тихая высь · прибытие');api.notify?.('Тихая высь · E — поговорить с Неру',4);}
}
function begin(){if(model)return false;cancel();model=new MikuAftermathModel.Sequence();api.returnMap?.(MikuAftermathModel.start);api.lock?.(true);api.save?.('Мику · пробуждение');return true;}
function resume(){return begin();}
function resumeCloud(){cancel();model=new MikuAftermathModel.Sequence('pan');api.cloud?.();api.lock?.(true);return true;}
function update(dt){if(!model)return;if(!DialogueUI.isOpen&&['recovery','portal-talk','arrival'].includes(model.phase)){talk(model.phase==='recovery'?recovery:model.phase==='portal-talk'?portalTalk:arrival);return;}const events=model.update(dt);for(const phase of events){enter(phase);if(!model)break;}}
function actor(g,p){if(p.alpha<=.001)return;const name=p.name==='teto'?'teto_2':'mesme_miku_1',frame=p.frame??p.dir*3+1,im=ActorSpriteArt.clean(images[name+'_'+frame]);if(!im)return;g.save();g.globalAlpha*=p.alpha;
 if(p.shadow>.001){g.save();g.globalAlpha*=p.shadow*.3;g.fillStyle='#142632';g.beginPath();g.ellipse(p.x,p.y+2,18*p.scale,5*p.scale,0,0,Math.PI*2);g.fill();g.restore();}
 g.translate(p.x,p.y-48*p.scale);g.rotate(p.rotation);g.scale(p.scale,p.scale);g.imageSmoothingEnabled=false;g.drawImage(im,-36,-48,72,96);g.restore();}
function hypnosis(g,age,alpha=1){g.save();g.globalAlpha*=alpha*Math.min(1,age/.5);g.fillStyle='#050609';g.fillRect(0,0,1536,1024);g.translate(768,512);g.rotate(age*.43);g.strokeStyle='#e9edf3';g.lineWidth=41;g.globalAlpha*=Math.min(1,age/.55)*.52;for(let arm=0;arm<3;arm++){g.beginPath();for(let j=0;j<330;j++){const a=j*.058+arm*Math.PI*2/3,r=j*3.35,x=Math.cos(a)*r,y=Math.sin(a)*r;j?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}g.restore();}
function draw(g,cameraY,t){if(!model)return;const s=model.status();
 if(s.cloud){
  const p={...CloudWorldData.portal,alpha:['sky-open','fall','land'].includes(s.phase)?s.phase==='sky-open'?MikuAftermathModel.ease(s.age/1.3):s.phase==='land'?1-MikuAftermathModel.ease(s.age):1:0},visible=['fall','land','arrival'].includes(s.phase);
  CloudWorldArt.draw(g,t,[],()=>{},{offsetY:s.panOffset,showParty:false,scene:true,extraActors:visible?s.actors:[],paintActor:actor,beforeActors:()=>PortalArt.draw(g,p,s.clock)});PortalArt.draw(g,p,s.clock,{front:true});
  if(s.phase==='land'){g.save();g.fillStyle='#fff';for(const a of s.actors)for(let i=0;i<10;i++){const q=s.age,r=q*44+5,ang=i*Math.PI/5;g.globalAlpha=(1-q)*.65;g.fillRect(a.x+Math.cos(ang)*r,a.y+Math.sin(ang)*r*.35-3,5,3);}g.restore();}
  if(s.phase==='pan')hypnosis(g,5+s.age,Math.max(0,1-s.age/.9));return;
 }
 if(s.phase==='hypnosis'){hypnosis(g,s.age);return;}
 if(s.shake.x||s.shake.y){if(!buffer){buffer=document.createElement('canvas');buffer.width=1536;buffer.height=1024;}const b=buffer.getContext('2d');b.clearRect(0,0,1536,1024);b.drawImage(g.canvas,0,0);g.clearRect(0,0,1536,1024);g.drawImage(buffer,s.shake.x,s.shake.y);}
 g.save();g.translate(s.shake.x,s.shake.y-cameraY);const p={...s.portal};PortalArt.draw(g,p,s.clock);for(const a of s.actors)actor(g,a);PortalArt.draw(g,p,s.clock,{front:true});if(s.phase==='pull')PortalArt.particles(g,p,s.clock,Math.min(1,s.age/.6));g.restore();
 if(s.phase==='return'){g.save();g.fillStyle='#000';g.globalAlpha=1-MikuAftermathModel.ease(s.age/1.1);g.fillRect(0,0,1536,1024);g.restore();}
}
function neru(){return NeruEncounter.begin();}
globalThis.MikuAftermath={init(callbacks,textures){api=callbacks;images=textures;},begin,resume,resumeCloud,cancel,update,draw,neru,get isActive(){return !!model;},get isCloud(){return !!model?.cloud;},status(){return model?{active:true,...model.status()}:{active:false,phase:'idle'};}};
})();
