/* Ivory cloud field, original seated Neru and the shared three-action interface. */
(()=>{
'use strict';const TAU=Math.PI*2;
const project=(u,v)=>NeruSceneModel.project(u,v);
function puff(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();}
let floorImage=null;
function cloudFloor(g){if(!floorImage){floorImage=document.createElement('canvas');floorImage.width=512;floorImage.height=342;const q=floorImage.getContext('2d');q.scale(1/3,1/3);((g)=>{
 // A suspended cloud silhouette; the playable ellipse is inset from its soft rim.
 for(let i=0;i<18;i++){const a=i*TAU/18,x=768+Math.cos(a)*520,y=580+Math.sin(a)*146;puff(g,x+5,y+37,65,34,'#818fae');puff(g,x,y+20,72,38,'#b9c8de');puff(g,x-2,y,70,38,'#e8eff7');}
 puff(g,768,590,520,163,'#eaf0f7');puff(g,755,570,505,148,'#fafbf9');
 g.strokeStyle='#dae3ed';g.lineWidth=3;for(let i=0;i<14;i++){const x=365+i*83%800,y=482+i*41%180;g.beginPath();g.ellipse(x,y,20+i%3*7,5,0,.15,2.9);g.stroke();}
})(q);}g.imageSmoothingEnabled=false;g.drawImage(floorImage,0,0,1536,1026);}

function draw(g,images,player,t,state){const light=NeruSceneModel.sky(t+(state.skyAge||0));CloudWorldArt.background(g,t,0,light.night);state.paintSky?.(g);state.paintBehindGround?.(g);
 CloudWorldArt.smallCloud(g,150+Math.sin(t*.08)*60,277,1.8,.5);CloudWorldArt.smallCloud(g,1340-Math.sin(t*.1)*70,350,2,.5);
 cloudFloor(g);
 state.paintGround?.(g);
 CloudWorldArt.smallCloud(g,768,403,1.8,1);const hit=t-state.enemyHitAt<.32;g.save();g.translate(...(state.enemyOffset||[0,0]));g.globalAlpha=state.enemyAlpha??1;PreparedNeruArt.draw(g,t,768,405,274,hit?'478':state.phase==='enemy'?'477':'476',state.enemyGreen?'#70ff92':null);g.restore();state.paintBoss?.(g);
 if(state.paintActors)state.paintActors(g);else {
 const columns=NeruSceneModel.columns.map(c=>({...c,p:project(c.u,c.v)})),behind=columns.filter(c=>c.v<player.v),front=columns.filter(c=>c.v>=player.v);for(const c of behind)CloudWorldArt.column(g,{x:c.p[0],y:c.p[1]},c.scale);
 const [x,y]=project(player.u,player.v),frame=player.dir*3+[1,0,1,2][Math.floor(player.walk/12)%4],im=ActorSpriteArt.clean(images['teto_2_'+frame]);g.fillStyle='#64768a3d';g.beginPath();g.ellipse(x,y+1,23,7,0,0,TAU);g.fill();g.imageSmoothingEnabled=false;g.drawImage(im,Math.round(x-36),Math.round(y-96-(player.z||0)),72,96);
 if(state.guard){g.strokeStyle='#a2a9d1';g.lineWidth=3;g.beginPath();g.ellipse(x,y-42-(player.z||0),42,58,0,.2,Math.PI*1.9);g.stroke();}
 for(const c of front)CloudWorldArt.column(g,{x:c.p[0],y:c.p[1]},c.scale);
 }
}
function sync(root,s){const $=q=>root.querySelector(q),canAct=['intro','command'].includes(s.phase)&&!s.localPaused&&!s.targeting&&s.panel<.04,ending=['victory','defeat','returning','result'].includes(s.phase);root.dataset.phase=s.phase;$('#battle-stage').style.opacity=String(NeruSceneModel.ease(s.clock/.8));root.classList.toggle('god-mode',s.godMode);
 const lower=$('#battle-lower');lower.style.transform=`translateY(${Math.round(s.panel*315)}px)`;lower.style.opacity=String(1-s.panel);lower.inert=!canAct;root.querySelectorAll('.battle-action').forEach(b=>b.disabled=!canAct);
 $('.location .eyebrow').textContent='НАД ОБЛАКАМИ';$('.location-title').textContent='Небесный поединок';$('.enemy-name h1').textContent='Неру';$('.enemy-note span:first-child').textContent='ПРОТИВНИК';$('.enemy-note span:last-child').textContent='Фаза '+(s.combat?.phase===2?'II':'I')+(s.phase==='enemy'?' · '+NeruAttackLab.definitions.find(d=>d.number===s.combat?.simulation.number)?.name:'');$('.enemy-health').textContent=Math.round(s.enemyHp)+' / '+NeruSceneModel.settings.maxHp;
 const bar=$('.enemy-bar');bar.removeAttribute('aria-hidden');bar.setAttribute('aria-label','Здоровье Неру');bar.setAttribute('aria-valuemax',NeruSceneModel.settings.maxHp);bar.setAttribute('aria-valuenow',s.enemyHp);$('.enemy-bar i').style.width=s.enemyHp/NeruSceneModel.settings.maxHp*100+'%';
 $('#turn-label').textContent=s.phase==='summon'?'Призыв стражей':s.phase==='phase-change'?'Фаза II':s.phase==='guard'?'Ход '+(s.guardName||'приспешника'):s.targeting?'Выбор цели':s.phase==='enemy'?'Ход Неру':s.phase==='player'?'Защита':ending?s.outcome==='victory'?'Победа':'Поражение':'Твой ход';$('.turn-panel .eyebrow').textContent='ХОД '+String(s.turn).padStart(2,'0');$('.arena-caption').hidden=true;$('#enemy-bubble').hidden=true;$('#gumi-charge').hidden=true;$('#battle-whiteout').hidden=true;$('#battle-cannon-action').hidden=true;$('#battle-story').hidden=true;
 $('#battle-fade').style.opacity=s.phase==='returning'?String(NeruSceneModel.ease(s.phaseAge/.6)):'0';$('.miku-card .eyebrow').textContent='МИКУ';$('.miku-card p').textContent='Я рядом, Тето. Теперь её голос надо мной не властен.';$('.battle-controls span:nth-child(2)').textContent=s.phase==='enemy'?'WASD / стрелки — движение · Space — прыжок':'WASD / стрелки — выбор';$('#action-description').textContent=['Выбрать приёмы Тето.','Использовать предмет.','Уменьшить урон следующей фазы вдвое.'][s.selected];$('#battle-live-hp').textContent='ТЕТО HP '+Math.round(s.hp);
 $('#battle-result').hidden=s.phase!=='result';if(s.phase==='result'){$('#battle-result-title').textContent=s.outcome==='victory'?'Неру отступила.':'Тето потеряла силы.';$('#battle-result-text').textContent='';$('#battle-return').textContent='Повторить бой';}
 const c=$('#turn-symbol').getContext('2d');c.clearRect(0,0,32,32);c.strokeStyle='#ede7d5';c.lineWidth=2;c.beginPath();c.arc(16,16,10,0,TAU);c.stroke();c.beginPath();c.arc(19,13,8,-1,2);c.stroke();
}
function targets(root,combat,bossHp,callbacks){let ui=root.querySelector('#neru-targets');if(!ui){ui=document.createElement('section');ui.id='neru-targets';ui.setAttribute('role','dialog');ui.setAttribute('aria-label','Выбор цели');ui.innerHTML='<strong>Выбери цель</strong><div></div><button id="neru-target-confirm">Ударить</button><button id="neru-target-cancel">Назад</button>';root.querySelector('#battle-stage').append(ui);}ui.hidden=!combat.targeting;if(combat.targeting){const signature=combat.targets(bossHp).map(t=>t.id+':'+t.hp).join('|')+'|'+combat.target;if(ui.dataset.signature!==signature){ui.dataset.signature=signature;const list=ui.querySelector('div');list.replaceChildren(...combat.targets(bossHp).map(t=>{const b=document.createElement('button');b.dataset.target=t.id;b.textContent=t.name+' · '+Math.round(t.hp)+' HP';b.setAttribute('aria-pressed',String(t.id===combat.target));b.onclick=()=>callbacks.select(t.id);return b;}));}ui.querySelector('#neru-target-confirm').onclick=callbacks.confirm;ui.querySelector('#neru-target-cancel').onclick=callbacks.cancel;}
 let icon=root.querySelector('#neru-eclipse');if(!icon){icon=document.createElement('span');icon.id='neru-eclipse';icon.tabIndex=0;root.querySelector('.hero-card').append(icon);}const e=combat.eclipse.status(combat.enemyTurn,root.dataset.phase==='enemy');icon.hidden=!e.remaining&&!e.cooldown;icon.textContent='◐ '+(e.remaining||e.cooldown);icon.title=e.remaining?'Затмение: атаки Неру быстрее на 10%. Осталось ходов: '+e.remaining:'Затмение: перезарядка '+e.cooldown+' ходов.';icon.setAttribute('aria-label',icon.title);icon.classList.toggle('cooldown',!e.remaining);
}

globalThis.NeruBattleArt={draw,sync,project,targets};
})();
