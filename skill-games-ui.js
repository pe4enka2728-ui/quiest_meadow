/* A compact keyboard/touch dialog. The battle owns and advances the challenge. */
(()=>{
'use strict';let root=null,current=null,lastFocus=null,shown=false;const physical=new Map();
function init(stage){
 root=document.createElement('section');root.id='battle-skill-game';root.hidden=true;root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','skill-game-name');
 root.innerHTML='<header><canvas id="skill-game-icon" width="32" height="32" aria-hidden="true"></canvas><strong id="skill-game-name"></strong><span id="skill-game-time"></span></header><p id="skill-game-instruction"></p><canvas id="skill-game-canvas" width="512" height="180" role="img" aria-label="Мини-игра выбранного приёма"></canvas><div class="skill-game-progress" aria-hidden="true"><i></i></div><div id="skill-game-controls" aria-label="Управление мини-игрой"></div><footer><span id="skill-game-hint"></span><small>Esc — пауза</small></footer><span id="skill-game-result" class="skill-game-sr" role="status" aria-live="polite"></span>';
 const controls=root.querySelector('#skill-game-controls');for(const [key,label]of [['left','← A'],['up','↑ W'],['down','↓ S'],['right','→ D'],['confirm','Space']]){
  const button=document.createElement('button');button.type='button';button.dataset.control=key;button.textContent=label;button.setAttribute('aria-label',key==='confirm'?'Пробел':label);button.onpointerdown=e=>{e.preventDefault();if(!current)return;button.setPointerCapture(e.pointerId);press('pointer-'+e.pointerId,key);};button.onpointerup=e=>{e.preventDefault();release('pointer-'+e.pointerId);};button.onpointercancel=e=>release('pointer-'+e.pointerId);button.onlostpointercapture=e=>release('pointer-'+e.pointerId);controls.append(button);
 }stage.append(root);
}
function press(token,key){if(!current||physical.has(token))return;const already=[...physical.values()].includes(key);physical.set(token,key);if(!already)current.down(key);}
function release(token){const key=physical.get(token);if(!key)return;physical.delete(token);if(![...physical.values()].includes(key))current?.up(key);}
function clearHeld(){physical.clear();current?.clearHeld();}
function hide(restoreFocus=true){if(!root)return;clearHeld();current=null;root.hidden=true;shown=false;if(restoreFocus&&lastFocus?.isConnected&&!lastFocus.closest('[hidden]')&&!lastFocus.closest('[inert]'))lastFocus.focus({preventScroll:true});lastFocus=null;}
function sync(run,paused=false){
 if(!root)return;if(!run){if(shown)hide();return;}const first=!shown||current!==run;current=run;shown=true;root.hidden=false;root.inert=paused;
 if(first){physical.clear();lastFocus=document.activeElement;root.querySelector('#skill-game-name').textContent=run.definition.name;const icon=root.querySelector('#skill-game-icon'),g=icon.getContext('2d');g.clearRect(0,0,32,32);g.imageSmoothingEnabled=false;g.drawImage(ShopItemArt.model(run.id),0,0);root.querySelector('#skill-game-instruction').textContent=run.definition.instruction;root.querySelector('#skill-game-hint').textContent=run.definition.hint;root.focus({preventScroll:true});}
 root.dataset.kind=run.kind;root.dataset.phase=run.phase;root.querySelector('#skill-game-time').textContent=run.result?run.result.label:Math.max(0,run.duration-run.time).toFixed(1)+' с';root.querySelector('.skill-game-progress i').style.width=(100*run.time/run.duration)+'%';
 root.querySelector('#skill-game-result').textContent=run.result?run.result.label+', '+Math.round(run.result.score*100)+' процентов точности':'';
 const relevant=run.kind==='thorn'?['up','down']:['mist','ring','heart','discord','breath'].includes(run.kind)?['confirm']:['glass','dome','tempo'].includes(run.kind)?['left','right']:['step','chorus'].includes(run.kind)?['left','up','right']:['up','right','down','left'];
 for(const b of root.querySelectorAll('[data-control]')){b.hidden=!relevant.includes(b.dataset.control);b.disabled=run.phase!=='play';b.classList.toggle('is-held',run.held.has(b.dataset.control));}
 SkillGamesArt.paint(root.querySelector('#skill-game-canvas').getContext('2d'),run,root.closest('#battle')?.dataset.encounter||'flower');
}
function handleKey(e){if(!current)return false;e.preventDefault();if(e.code==='Tab'){if(e.repeat)return true;const items=[...root.querySelectorAll('button:not([hidden]):not(:disabled)')];if(items.length){const i=items.indexOf(document.activeElement);items[(i+(e.shiftKey?-1:1)+items.length)%items.length].focus({preventScroll:true});}return true;}const key=SkillGamesModel.key(e.code);if(key&&!e.repeat)press(e.code,key);return true;}
function keyUp(e){if(!current)return false;release(e.code);return true;}
globalThis.SkillGamesUI={init,sync,hide,handleKey,keyUp,clearHeld};
})();
