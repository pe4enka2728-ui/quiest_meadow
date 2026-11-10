/* The first conversation is remembered; later interactions show just the decision. */
(()=>{
const options=[{label:'Да, войдём.',action:'enter'},{label:'Пока останемся снаружи.',action:'leave'}];
const full={start:'watching',nodes:{
 watching:{speaker:'Мику',face:'worried',text:'Тето... Этот глаз поворачивается за тобой. Мне кажется, нас уже заметили.',choices:[{label:'Ты тоже это видишь?',next:'inside'}]},
 inside:{speaker:'Тето',face:'neutral',text:'За полотном будто кто-то ходит. Но дорога ведёт сюда... Может, внутри есть выход?',choices:[{label:'Послушаем ещё немного.',next:'decide'}]},
 decide:{speaker:'Мику',face:'worried',text:'Если пойдёшь, я с тобой. Только держимся рядом. Входим?',choices:options}
}};
const repeat={start:'decide',nodes:{decide:{speaker:'Мику',face:'neutral',text:'Войдём в шатёр вместе?',choices:options}}};
let api={},active=false,phase='idle',age=0,discussed=false,entered=false,first=false,start=null,cooldown=0,armed=true,token=0;
const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
function persist(){try{localStorage.setItem('smile-tent-v1',JSON.stringify({discussed,entered}))}catch{}}
function restore(flags={}){token++;active=false;phase='idle';age=0;cooldown=0;armed=true;discussed=!!flags.discussed;entered=!!flags.entered;persist();api.lock?.(false)}
function init(callbacks){api=callbacks;let data={};try{data=JSON.parse(localStorage.getItem('smile-tent-v1')||'{}')}catch{};restore(data)}
function cancel(){token++;active=false;phase='idle';age=0;cooldown=0;armed=true;api.lock?.(false)}
function finish(){entered=true;persist();active=false;phase='idle';api.lock(false)}
function beginEntry(){if(active)return;active=true;phase='enter';age=0;first=!entered;start=api.positions();api.lock(true)}
function observe(dt,location,hero){if(cooldown>0)cooldown=Math.max(0,cooldown-dt);if(location==='circus'&&hero.y>CircusData.tent.entrance.thresholdY+28)armed=true;}
function tryAuto(hero,before){const d=CircusData.tent.entrance;if(entered&&!active&&cooldown<=0&&armed&&hero.y<before.y-.001&&hero.y<d.thresholdY&&hero.y>d.thresholdY-28&&Math.abs(hero.x-d.x)<d.halfWidth){armed=false;beginEntry();return true}return false}
function interact(){
 if(active)return;if(entered){beginEntry();return}const quick=discussed;
 const expected=token;DialogueUI.open(quick?repeat:full,{onDone(result){if(expected!==token||!result.completed)return;discussed=true;persist();if(result.choice?.action==='enter'){beginEntry()}}});
 if(quick)DialogueUI.finishText();
}
function exit(){if(active)return;active=true;phase='exit';age=0;api.lock(true)}
function entryPositions(positions,t){const d=CircusData.tent.doorInside;const sample=(body,lag)=>{const age=Math.max(0,t-lag),align=ease(age/.35),approach={x:d.x,y:Math.max(body.y,-1006)};if(age<.35)return {x:body.x+(approach.x-body.x)*align,y:body.y+(approach.y-body.y)*align};const q=ease((age-.35)/1.25);return {x:d.x,y:approach.y+(d.y-approach.y)*q};};return {teto:sample(positions.teto,0),miku:sample(positions.miku,.5)};}
function update(dt){
 if(!active)return;age+=dt;
 if(phase==='enter'){api.place(entryPositions(start,age),dt);if(age>=2.6){api.toHall();phase='hall';age=0;}}
 else if(phase==='hall'){
  if(first){api.autoWalk(dt);if(api.location()==='tent-arena'&&!api.transitioning()){phase='arena-arrival';age=0;}}
  else{api.autoShortWalk(dt);if(age>=1.1)finish();}
 }else if(phase==='arena-arrival'){api.autoShortWalk(dt);if(age>=.7)finish();}
 else if(phase==='exit'&&age>=.5){api.toOutside();phase='outside';age=0;armed=false;cooldown=1.2;}
 else if(phase==='outside'&&age>=.7){active=false;phase='idle';cooldown=1.2;api.lock(false);}
}
function drawEntry(ctx,drawPerson,actors){if(!active||phase!=='enter')return;const d=CircusData.tent.entrance,end=CircusData.tent.doorInside;for(const actor of actors){const body=actor.body;ctx.save();if(body.y<-1005){ctx.beginPath();ctx.rect(d.x-48,d.clipTop,96,240);ctx.clip();}ctx.globalAlpha=1-ease((d.planeY-body.y)/(d.planeY-end.y));drawPerson(body,actor.name);ctx.restore();}}
function drawFade(ctx){if(!active)return;let opacity=0;if(phase==='enter')opacity=ease((age-2.15)/.45);else if(phase==='hall')opacity=1-ease(age/.55);else if(phase==='exit')opacity=ease(age/.5);else if(phase==='outside')opacity=1-ease(age/.7);if(opacity>0){ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle='#0b0b13';ctx.fillRect(0,0,1536,1024);ctx.restore()}}
globalThis.TentJourney={init,restore,cancel,interact,observe,tryAuto,exit,update,drawEntry,drawFade,fullDialogue:full,repeatDialogue:repeat,entryPositions,get isActive(){return active},get isEntering(){return active&&phase==='enter'},status(){return {active,phase,age,discussed,entered,first,cooldown,armed}}};
})();
