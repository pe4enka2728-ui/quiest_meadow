/* Prepared original Miku, dim purple backdrop and a solid monochrome platform. */
(()=>{
'use strict';
const ease=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
function project(u,v){return [768+(u-.5)*(670+380*v),440+240*v];}
const renderers=new WeakMap();
function draw(g,images,player,t,state={platformOpacity:1}){
 let renderer=renderers.get(g.canvas);if(!renderer){renderer=new MikuAttackArt.Renderer(g.canvas,images);renderers.set(g.canvas,renderer);}
 const idle={player:{x:(player.u-.5)*12,y:player.v*8,z:player.z||0,jump:player.jump,dir:player.dir,walk:player.walk},attack:{entities:[]},clock:t,lastHit:-Infinity,lastDamage:0,invulnerable:false};
 renderer.draw(state.sim||idle,t,{alpha:state.platformOpacity??1,enemyOffset:state.enemyOffset||[0,0]});
}
function sync(root,state){
 const $=s=>root.querySelector(s),turns=state.miku,canAct=turns.canAct&&!state.localPaused;
 root.dataset.phase=state.phase;root.querySelector('#battle-stage').style.opacity=String(ease(state.clock/1.2));
 const lower=$('#battle-lower'),shown=turns.canAct||state.phase==='player';lower.style.transform=shown?'translateY(0)':'translateY(315px)';lower.style.opacity=shown?'1':'0';lower.inert=!canAct;for(const b of root.querySelectorAll('.battle-action'))b.disabled=!canAct;
 $('.location .eyebrow').textContent='ЗА ПРЕДЕЛАМИ ПОЛЯНЫ';$('.location-title').textContent='Пустота';$('.enemy-name h1').textContent='Мику';$('.enemy-note span:first-child').textContent='Противник???';$('.enemy-note span:last-child').textContent='…';
 const healthReady=Number.isFinite(state.enemyHp);root.dataset.mikuHp=healthReady?'visible':'hidden';$('.enemy-health').textContent=healthReady?'HP '+state.enemyHp+' / 500':'';
 const bar=$('.enemy-bar');bar.setAttribute('aria-label','Здоровье Мику');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','500');bar.setAttribute('aria-valuenow',String(state.enemyHp??0));if(healthReady)bar.removeAttribute('aria-hidden');else bar.setAttribute('aria-hidden','true');$('.enemy-bar i').style.width=(healthReady?Math.max(0,Math.min(100,state.enemyHp/500*100)):0)+'%';
 $('#turn-label').textContent=state.phase==='conversation'?'Встреча':state.phase==='enemy'||state.phase==='platform-in'?'Ход Мику':state.phase==='platform-out'?'Тишина':state.phase==='player'?'Действие':'Твой ход';$('.turn-panel .eyebrow').textContent='ХОД '+String(Math.max(1,turns.turn)).padStart(2,'0');
 $('.arena-caption').hidden=true;root.classList.toggle('god-mode',!!state.godMode);$('#battle-live-hp').textContent='ТЕТО  HP '+state.hp+' / 100'+(state.godMode?' · GOD':'');$('#battle-fade').style.opacity='0';$('#enemy-bubble').hidden=state.phase!=='enemy';if(state.phase==='enemy'){const voice=$('#enemy-phrase');voice.setAttribute('aria-label','Неразборчивая речь Мику');MikuVoiceArt.paint(voice,{text:'!'.repeat(24),symbols:true},state.clock,24,turns.turn);}$('#battle-result').hidden=state.phase!=='result';if(state.phase==='result'){$('#battle-result-title').textContent=state.outcome==='victory'?'Мику затихла.':'Тето потеряла силы.';$('#battle-result-text').textContent=state.outcome==='victory'?'Бой завершён.':'Можно попробовать ещё раз.';$('#battle-return').textContent='Повторить бой';}$('#gumi-charge').hidden=true;$('#battle-whiteout').hidden=true;$('#battle-cannon-action').hidden=true;
 const values=root.querySelectorAll('.meter-value');values[0].innerHTML=state.hp+' <em>/ 100</em>';values[1].innerHTML=state.mp+' <em>/ 30</em>';$('.meter-track.hp i').style.width=state.hp+'%';$('.meter-track.mp i').style.width=state.mp/30*100+'%';$('.miku-card p').textContent='…';$('.miku-card .eyebrow').textContent='МИКУ';$('.battle-controls span:nth-child(2)').textContent=turns.movable?'WASD / стрелки — движение':'WASD / стрелки — выбор';$('#action-description').textContent=state.notice||['Выбрать приёмы Тето.','Использовать предмет.','Уменьшить урон следующей фазы вдвое.'][state.selected];
 const face=$('#miku-face').getContext('2d');face.clearRect(0,0,48,48);face.fillStyle='#000';face.fillRect(0,0,48,48);const turn=$('#turn-symbol').getContext('2d');turn.clearRect(0,0,32,32);turn.strokeStyle='#fff';turn.lineWidth=1;turn.strokeRect(7.5,7.5,17,17);
}
globalThis.MikuBattleArt={project,draw,sync};
})();
