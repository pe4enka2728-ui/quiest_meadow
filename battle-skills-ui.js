/* Compact encounter-themed offers; preview an ability before confirming its cast. */
(()=>{
'use strict';let root=null,api={},selected=0,signature='',lastEffect=null,expanded=null,lastState=null;
function init(stage,callbacks){api=callbacks;root=document.createElement('section');root.id='battle-skills';root.hidden=true;root.setAttribute('aria-label','Доступные приёмы');root.innerHTML='<button id="battle-skills-close" type="button" aria-label="Закрыть список">×</button><div id="battle-skill-grid" role="group" aria-label="Список приёмов"></div><div id="battle-skill-empty" hidden>Нет выбранных приёмов.</div><div id="battle-skill-log" role="status" hidden></div>';stage.append(root);root.querySelector('#battle-skills-close').onclick=()=>api.close();}
function paintIcon(canvas,item,effect=null){const g=canvas.getContext('2d');g.clearRect(0,0,64,64);g.imageSmoothingEnabled=false;
 const active=effect&&effect.id===item.id&&effect.age<effect.duration,p=active?Math.max(0,effect.age/effect.duration):0,pulse=active?Math.sin(p*Math.PI):0;
 g.save();g.translate(32,32-3*pulse);g.rotate(pulse*Math.sin(p*Math.PI*2)*.27);g.scale(1+pulse*.16,1+pulse*.16);g.drawImage(ShopItemArt.model(item.id),-24,-24,48,48);g.restore();
 if(active){g.globalAlpha=(1-p)*.9;g.fillStyle=item.poison?'#c4d69b':'#f1e5cf';for(let i=0;i<4;i++){const a=i*Math.PI/2+p*.6,r=20+p*12;g.fillRect(Math.round(32+Math.cos(a)*r)-1,Math.round(32+Math.sin(a)*r)-1,3,3);}g.globalAlpha=1;}
}
function activate(item){if(lastState.mode==='items')return api.cast(item.id);if(expanded!==item.id){expanded=item.id;sync(lastState);const grid=root.querySelector('#battle-skill-grid'),b=root.querySelector(`[data-skill="${item.id}"]`),bounds=grid.getBoundingClientRect(),rect=b.getBoundingClientRect(),scale=bounds.height/Math.max(1,grid.clientHeight);if(rect.top<bounds.top)grid.scrollTop+=(rect.top-bounds.top)/scale;else if(rect.bottom>bounds.bottom)grid.scrollTop+=(rect.bottom-bounds.bottom)/scale;return;}api.cast(item.id);}
function row(item,index){const entry=document.createElement('div');entry.className='battle-skill-entry';const b=document.createElement('button');b.type='button';b.className='battle-skill';b.dataset.skill=item.id;b.dataset.index=index;
 const key=document.createElement('span');key.className='battle-skill-key';
 const c=document.createElement('canvas');c.width=c.height=64;c.className='skill-icon';c.setAttribute('aria-hidden','true');paintIcon(c,item);
 const name=document.createElement('strong');name.textContent=item.name;const cost=document.createElement('small');cost.className='battle-skill-cost';b.append(key,c,name,cost);b.title=item.name;b.setAttribute('aria-label',item.name);
 const description=document.createElement('div');description.className='battle-skill-description';description.id='skill-description-'+item.id;description.hidden=true;
 const text=document.createElement('p');text.textContent=item.description;const stats=document.createElement('small');stats.textContent=item.properties.join(' · ');const hint=document.createElement('span');hint.className='battle-skill-confirm';hint.textContent='Нажми ещё раз, чтобы применить';description.append(text,stats);const task=SkillGamesModel.definitions.find(d=>d.id===item.id);if(task){const help=document.createElement('p');help.className='battle-skill-task';help.textContent='Исполнение: '+task.instruction+' '+task.hint;description.append(help);}description.append(hint);b.setAttribute('aria-controls',description.id);
 b.onpointerenter=()=>{selected=index;};b.onfocus=()=>{selected=index;};b.onclick=()=>activate(item);entry.append(b,description);return entry;}
function resultText(log){if(!log)return '';const label=log.performance?SkillGamesModel.gradeName(log.performance.quality)+' · ':'';return label+castResultText(log)+(log.restoredMp?' · +1 MP':'');}
function castResultText(log){if(!log)return '';if(log.target==='hero')return log.healed?'+'+log.healed+' HP':log.resistance?'Защита '+Math.round(log.resistance*100)+'%':log.nextCrit?'Следующий приём · крит':log.speed?'Скорость +'+Math.round(log.speed*100)+'%':'';return !log.hits?'Промах':(log.crits?'КРИТ · ':'')+'−'+log.damage+(log.poison?' · отравление':'');}
function sync(state){if(!root)return;lastState=state;root.hidden=!state.open;if(!state.open){signature='';lastEffect=null;expanded=null;return;}
 const items=state.mode==='items'?state.items:state.abilities,key=state.mode+':'+items.map(i=>i.id).join(','),grid=root.querySelector('#battle-skill-grid');root.dataset.mode=state.mode;root.setAttribute('aria-label',state.mode==='items'?'Расходники':'Доступные приёмы');
 if(signature!==key){signature=key;expanded=null;selected=Math.min(selected,Math.max(0,items.length-1));grid.replaceChildren(...items.map(row));}
 const effect=state.effect,active=effect&&effect.age<effect.duration;
 for(let i=0;i<items.length;i++){
  const item=items[i],entry=grid.children[i],b=entry.querySelector('button'),cost=state.mode==='items'?0:state.costs[item.id],unaffordable=state.mode!=='items'&&state.mp<cost;
  b.disabled=state.busy>0;b.classList.toggle('is-unaffordable',unaffordable);b.classList.toggle('is-expanded',expanded===item.id);b.setAttribute('aria-expanded',String(expanded===item.id));entry.querySelector('.battle-skill-description').hidden=expanded!==item.id||state.mode==='items';
  b.querySelector('.battle-skill-key').textContent=i+(state.mode==='items'?1:2);
  b.querySelector('.battle-skill-cost').textContent=state.mode==='items'?'×'+api.count(item.id):cost;
  b.querySelector('.battle-skill-cost').title=state.mode==='items'?'В сумке':'Стоимость: '+cost+' MP';b.setAttribute('aria-label',item.name+(state.mode==='items'?'':', '+cost+' MP'+(unaffordable?', не хватает маны':'')));
  entry.querySelector('.battle-skill-confirm').textContent=unaffordable?'Не хватает маны':'Нажми ещё раз, чтобы применить';
  b.classList.toggle('is-casting',!!active&&effect.id===item.id);
  if(active&&effect.id===item.id||lastEffect===item.id)paintIcon(b.querySelector('canvas'),item,active?effect:null);
 }
 lastEffect=active?effect.id:null;root.querySelector('#battle-skill-empty').hidden=items.length>0;root.querySelector('#battle-skill-empty').textContent=state.mode==='items'?'В сумке нет расходников.':'Нет выбранных приёмов.';
 const out=root.querySelector('#battle-skill-log'),message=state.notice||resultText(state.log.at(-1));out.textContent=message;out.hidden=!message;
}
function handleKey(e){if(!root||root.hidden)return false;if(e.code==='Escape'){e.preventDefault();if(!e.repeat)api.close();return true;}
 const n=PixelUI.digit(e);if(n!==null){e.preventDefault();if(!e.repeat){if(n===1&&lastState.mode==='abilities')api.finish();else{const index=n-(lastState.mode==='items'?1:2);if(index>=0&&index<5)root.querySelectorAll('.battle-skill')[index]?.click();}}return true;}
 if(e.code==='Enter'){e.preventDefault();if(!e.repeat)api.finish();return true;}
 if(['ArrowLeft','KeyA','ArrowRight','KeyD','ArrowUp','KeyW','ArrowDown','KeyS','Space'].includes(e.code)){
  e.preventDefault();if(e.repeat)return true;const buttons=[...root.querySelectorAll('.battle-skill')];if(!buttons.length)return true;
  if(e.code==='Space')buttons[selected]?.click();else{const up=['ArrowLeft','KeyA','ArrowUp','KeyW'].includes(e.code);selected=(selected+(up?-1:1)+buttons.length)%buttons.length;buttons[selected]?.focus();}return true;
 }
 return true;
}
globalThis.BattleSkillsUI={init,sync,handleKey,paintIcon};
})();
