(()=>{
'use strict';let run=null,paused=false,selected=null,lastTime=0;
const root=document.querySelector('#battle'),stage=document.querySelector('#battle-stage'),list=document.querySelector('#lab-list');
SkillGamesUI.init(stage);
for(const [index,d]of SkillGamesModel.definitions.entries()){
 const item=ShopModel.find(d.id),button=document.createElement('button');button.type='button';button.dataset.ability=d.id;button.setAttribute('aria-label',d.name);const c=document.createElement('canvas');c.width=c.height=32;c.getContext('2d').drawImage(ShopItemArt.model(d.id),0,0);const number=document.createElement('small');number.textContent=String(index+1).padStart(2,'0');const name=document.createElement('span');name.textContent=d.name;const cost=document.createElement('small');cost.textContent=item.mana+' MP';button.append(number,c,name,cost);button.onclick=()=>choose(d.id);list.append(button);
}
function choose(id){SkillGamesUI.hide(false);selected=id;paused=false;run=new SkillGamesModel.Run(id);document.querySelector('#lab-selected').textContent=run.definition.name;document.querySelector('#lab-description').textContent=ShopModel.find(id).description;document.querySelector('#lab-retry').disabled=false;for(const b of list.children)b.setAttribute('aria-pressed',String(b.dataset.ability===id));document.querySelector('#lab-summary').textContent='';sync();}
function pause(value=!paused){paused=value;SkillGamesUI.clearHeld();document.querySelector('#lab-pause').hidden=!paused;document.querySelector('#battle-skill-game').inert=paused;if(paused)document.querySelector('#lab-resume').focus({preventScroll:true});else document.querySelector('#battle-skill-game').focus({preventScroll:true});}
function sync(){SkillGamesUI.sync(run,paused);document.querySelector('#lab-pause').hidden=!paused;if(run?.result){const p=run.result;document.querySelector('#lab-summary').textContent=run.definition.name+' · '+p.label+' · '+Math.round(p.score*100)+'%'+(run.id==='double-syllable'?' · '+p.hits.map((s,i)=>(i+1)+': '+SkillGamesModel.gradeName(SkillGamesModel.grade(s))).join(' / '):'');}}
function step(dt){if(run&&!paused){run.step(dt);sync();}}
function frame(time){const dt=Math.min(.033,Math.max(0,(time-lastTime)/1000));lastTime=time;step(dt);requestAnimationFrame(frame);}
function resize(){const scale=Math.min(innerWidth/1536,innerHeight/1024);root.style.transform='translate('+Math.round((innerWidth-1536*scale)/2)+'px,'+Math.round((innerHeight-1024*scale)/2)+'px) scale('+scale+')';}
for(const b of document.querySelectorAll('[data-theme]'))b.onclick=()=>{root.dataset.encounter=b.dataset.theme;for(const q of document.querySelectorAll('[data-theme]'))q.setAttribute('aria-pressed',String(q===b));sync();};
document.querySelector('#lab-retry').onclick=()=>selected&&choose(selected);document.querySelector('#lab-pause-button').onclick=()=>pause();document.querySelector('#lab-resume').onclick=()=>pause(false);
window.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause();return;}if(run&&run.phase!=='done'&&!paused)SkillGamesUI.handleKey(e);});window.addEventListener('keyup',e=>{if(!paused)SkillGamesUI.keyUp(e);else SkillGamesUI.clearHeld();});window.addEventListener('blur',()=>{if(run&&run.phase!=='done')pause(true);});window.addEventListener('resize',resize);
window.SkillGamePreview={choose,pause,step,status:()=>({paused,selected,challenge:run?.status()||null})};resize();requestAnimationFrame(frame);
})();
