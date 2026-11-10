/* Shared battle view: world integration and standalone preview use the same phases. */
(()=>{
const root=document.createElement('section');root.id='battle';root.hidden=true;root.setAttribute('aria-label','Бой с незнакомым цветком');root.innerHTML='<div id="battle-stage">'+BattleMarkup+'</div>';document.querySelector('main').append(root);
root.querySelector('.enemy-bar').insertAdjacentHTML('afterend','<div id="gumi-charge" hidden><div class="charge-caption"><span>ПЕРЕГРЕВ НИТЕЙ</span><span id="gumi-charge-value"></span></div><div class="charge-track" role="meter" aria-label="Перегрев Гуми" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><small id="gumi-charge-help"></small></div>');
root.insertAdjacentHTML('beforeend','<div id="battle-whiteout" hidden aria-hidden="true"></div>');
const $=s=>root.querySelector(s),g=$('#battle-scene').getContext('2d'),stage=$('#battle-stage'),buttons=[...root.querySelectorAll('.battle-action')],keys=new Set(),props=[];
const rocks=BattleStory.rocks;
let storyIndex=0,storyAge=0,storyRevealed=0,storyFocusPending=false;
const inStory=()=>phase==='conversation'||phase==='conversation-out';
const isEnding=()=>['victory','defeat','returning','result'].includes(phase);
const isHeroTurn=()=>isMiku()?!!mikuTurns?.canAct||phase==='player':['intro','command','player'].includes(phase);
const godMode=()=>!!globalThis.DeveloperState?.god;
const protectedNow=()=>!isEnding()&&(isMiku()?lastDamageAt!==null&&clock-lastDamageAt<MikuCombatModel.invulnerability:BattleRules.protectedAt(lastDamageAt,clock));
let images={},options={},opened=false,ready=false,localPaused=false,selected=0,clock=0,phase='intro',phaseAge=0,begun=false,fadeAt=-1,panel=0,phrase='',phraseAge=0,turn=1,hp=100,mp=0,enemyHp=150,guard=false,pending='attack',lastDamageAt=null,damageEvents=0,damageSource=null,outcome=null,frozenEntities=[],lastFocus=null;
const player={u:.5,v:.75,dir:0,walk:0,jump:0};let attack=null,trainingInvulnerable=false,lastAttack=-1,roots=BattleRoots.create();
let enemyHitAt=-Infinity,encounter='flower',attackArt=FlowerAttackArt.renderer(g,project,polygon,line,rect);
let arena=null,finale=null,charge=null,lastDamageValue=5,floatingAt=-Infinity,neruBattle=null,neruRenderer=null;
let mikuTurns=null,mikuDialogue=[],mikuConfig={},mikuCombat=null,mikuPendingDamage=0,mikuActionNotice="";
const heroEffects=new BattleHeroEffects.Model();
let heroStats=ShopModel.stats(ShopModel.fresh()),abilitySession=null,skillMenu=false,skillMode="abilities",skillNotice="",continueQueued=false,skillChallenge=null,lastSkillPerformance=null;
const isNeru=()=>encounter==='neru',isMiku=()=>encounter==='miku',isGumi=()=>encounter==='gumi',attackModel=()=>isGumi()?GumiAttacksV2:FlowerAttacks,rootEntities=enabled=>isGumi()?[]:BattleRoots.entities(roots,enabled);
const snap=n=>Math.round(n/3)*3,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),ease=u=>{u=clamp(u,0,1);return u*u*(3-2*u)};
function resize(){const box=root.getBoundingClientRect(),scale=Math.min(box.width/1536,box.height/1024);stage.style.transform=`scale(${scale})`;stage.style.left=(box.width-1536*scale)/2+'px';stage.style.top=(box.height-1024*scale)/2+'px'}window.addEventListener('resize',()=>{if(opened)resize()});
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(snap(x),snap(y),snap(w),snap(h))}
function polygon(points,color){g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(snap(x),snap(y)):g.moveTo(snap(x),snap(y)));g.closePath();g.fill()}
function line(points,color,width=3){g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(snap(x),snap(y)):g.moveTo(snap(x),snap(y)));g.stroke()}
function project(u,v,z=0){if(isNeru()){const p=NeruBattleArt.project(u,v);return [p[0],p[1]-z];}if(isMiku()){const p=MikuBattleArt.project(u,v);return [p[0],p[1]-z];}const scale=isGumi()?.76:FlowerAttacks.arena.projectionScale;return [768+(u-.5)*(696+450*v)*scale,(isGumi()?451:407)+285*v*(isGumi()?1.02:scale)-z]}
function makeSprite(name,w,h,tint=0){const source=BackdropArt.defs[name],c=document.createElement('canvas');c.width=w;c.height=h;const cg=c.getContext('2d',{willReadFrequently:true});cg.imageSmoothingEnabled=false;cg.drawImage(images.sceneryAtlas,...source.rect,0,0,w,h);const im=cg.getImageData(0,0,w,h);for(let i=0;i<im.data.length;i+=4){im.data[i+3]=im.data[i+3]<160?0:255;if(tint){im.data[i]*=.42;im.data[i+1]*=.52;im.data[i+2]*=.63}}cg.putImageData(im,0,0);return c}
function sprite(im,x,y,scale=3,alpha=1){if(!im)return;g.save();g.globalAlpha=alpha;g.imageSmoothingEnabled=false;g.drawImage(im,snap(x-im.width*scale/2),snap(y-im.height*scale),im.width*scale,im.height*scale);g.restore()}
function pillar(x,y,side){const h=81;polygon([[x-27,y-12],[x,y-27],[x+27,y-12],[x,y+9]],'#49655d');polygon([[x-24,y-12-h],[x,y-27-h],[x+24,y-12-h],[x,y+6-h]],'#9fae98');polygon([[x-24,y-12-h],[x,y+6-h],[x,y+3],[x-24,y-15]],'#4d716b');polygon([[x,y+6-h],[x+24,y-12-h],[x+24,y-15],[x,y+3]],'#304f51');for(let i=0;i<4;i++)rect(x-15,y-h+9+i*13,6,6,side?'#b0d9be':'#e2a2b3')}
function portrait(canvas,image,pose={}){const cg=canvas.getContext('2d');cg.imageSmoothingEnabled=false;cg.fillStyle='#214b48';cg.fillRect(0,0,48,48);if(image)cg.drawImage(image,0,pose.offsetY||0,48,48)}
function drawPortraits(){if(isMiku()){BattleStory.drawFace($('#teto-face'),'teto',clock,false);const c=$('#miku-face').getContext('2d');c.fillStyle='#000';c.fillRect(0,0,48,48);return;}BattleStory.drawFace($('#teto-face'),'teto',clock,phase==='player'||phase==='victory');BattleStory.drawFace($('#miku-face'),'miku',clock+.7,false)}

function rock(p){RockArt.draw(g,{...p,seed:p.x+p.y});}
const storyLines=()=>isMiku()?mikuDialogue:BattleStory.lines;
function storyLine(){storyAge=0;storyRevealed=0;const n=storyLines()[storyIndex];$('#battle-story-name').textContent=BattleStory.names[n.speaker]||n.speaker;$('#battle-story-text').textContent='';$('#battle-story-text').setAttribute('aria-label',n.symbols?'Неразборчивые символы':n.text);$('#battle-story').dataset.speaker=n.speaker}
function advanceStory(){if(phase!=='conversation'||localPaused)return;const n=storyLines()[storyIndex];if(storyRevealed<n.text.length){storyRevealed=n.text.length;storyAge=n.text.length/BattleStory.typeSpeed;syncStory();return}if(storyIndex+1<storyLines().length){storyIndex++;storyLine()}else{if(isMiku()){mikuTurns.finishDialogue();enemyHp=500;beginMikuTurn();}else setPhase('conversation-out')}syncStory()}
function syncStory(){const box=$('#battle-story');box.hidden=!inStory();if(!inStory())return;const n=storyLines()[storyIndex],typing=storyRevealed<n.text.length,opacity=phase==='conversation-out'?1-ease(phaseAge/BattleStory.fadeOut):ease(phaseAge/BattleStory.fadeIn);box.style.opacity=String(opacity);if(isMiku()&&n.shake)MikuVoiceArt.paint($('#battle-story-text'),n,clock,storyRevealed,storyIndex);else{$('#battle-story-text').classList.remove('miku-voice');$('#battle-story-text').textContent=n.text.slice(0,storyRevealed);}$('.story-next').style.opacity=typing?'.25':String(.65+.35*Math.sin(clock*3));for(const id of ['teto','miku']){const active=n.speaker===id;$('.story-'+id).hidden=isMiku();$('.story-'+id).classList.toggle('listening',!active);if(!isMiku())BattleStory.draw($('#story-'+id),id,clock,active,typing)}}
function sync(){if(isNeru()){NeruBattleArt.sync(root,{clock,hp,mp,enemyHp,selected,localPaused,phase,phaseAge,outcome,turn,panel:ease(panel),godMode:godMode(),targeting:neruBattle.targeting,combat:neruBattle.status(phase),guardName:neruBattle.guards.find(g=>g.id===neruBattle.currentGuard)?.name});syncLoadout();NeruBattleArt.targets(root,neruBattle,enemyHp,{select:id=>{neruBattle.target=id;sync();},confirm:confirmNeruTarget,cancel:cancelNeruTarget});return;}if(isMiku()){MikuBattleArt.sync(root,{clock,hp,mp,enemyHp,selected,localPaused,phase,outcome,godMode:godMode(),notice:mikuActionNotice,miku:mikuTurns.status()});syncLoadout();syncStory();return;}$('#battle-stage').style.opacity='1';$('.enemy-bar').removeAttribute('aria-hidden');root.dataset.phase=phase;root.classList.toggle('extra-hints',!!globalThis.GameSettings?.extraHints);const lower=$('#battle-lower');lower.style.transform=`translateY(${Math.round(ease(panel)*315)}px)`;lower.style.opacity=String(1-ease(panel));lower.inert=!['intro','command'].includes(phase)||panel>.04||localPaused;buttons.forEach(b=>b.disabled=lower.inert);
 const opacity=inStory()||phase==='finale'?0:!begun?1:1-ease((clock-fadeAt)/.65);$('.arena-caption').style.opacity=String(opacity);$('.arena-caption').hidden=opacity<=0;$('#battle-caption').textContent=isGumi()?'Нити натянуты. Гуми больше не управляет движениями.':'Цветок качается, будто слышит неслышную мелодию.';
 $('#turn-label').textContent=phase==='falling'?'Падение':phase==='overload'?'ПЕРЕГРЕВ':phase==='phase-two'?'Сбой сигнала':phase==='finale'?(finale?.phase==='await-e'?'Пушка':finale?.phase==='fuse'?'Фитиль':'Освобождение'):inStory()?'Встреча':phase==='enemy'?(isGumi()?'Ход Гуми':'Ход цветка'):phase==='player'?'Действие':phase==='victory'?'Победа':phase==='defeat'?'Поражение':'Твой ход';$('.turn-panel .eyebrow').textContent='ХОД '+String(turn).padStart(2,'0');
 const enemyMax=isGumi()?300:150;$('.enemy-health').innerHTML=enemyHp+' <span>/ '+enemyMax+'</span>';$('.enemy-bar i').style.width=enemyHp/enemyMax*100+'%';$('.enemy-bar').setAttribute('aria-valuemax',enemyMax);$('.enemy-bar').setAttribute('aria-valuenow',enemyHp);
 root.classList.toggle('god-mode',godMode());$('#battle-live-hp').textContent='ТЕТО  HP '+hp+' / 100'+(godMode()?' · GOD':'');$('#battle-live-hp').classList.toggle('hurt',lastDamageAt!==null&&clock-lastDamageAt<.3);
 $('#battle-fade').style.opacity=phase==='returning'?String(ease(phaseAge/BattleRules.settings.returnFade)):isGumi()&&clock<.4?String(1-ease(clock/.4)):'0';
 const values=root.querySelectorAll('.meter-value');values[0].innerHTML=hp+' <em>/ 100</em>';values[1].innerHTML=mp+' <em>/ 30</em>';$('.meter-track.hp i').style.width=hp+'%';$('.meter-track.mp i').style.width=mp/30*100+'%';
 $('#enemy-bubble').hidden=!['enemy','phase-two'].includes(phase)||!phrase;const revealed=phrase.slice(0,Math.floor(phraseAge*28)),out=$('#enemy-phrase');out.replaceChildren();const loud=isGumi()&&arena?.phase===2;root.classList.toggle('gumi-enraged',!!loud);if(loud){const words=revealed.split(/([А-ЯЁ]{3,}[!?.]*)/);for(const [i,word]of words.entries()){const span=document.createElement('span');span.textContent=word;if(i%2)span.className='voice-accent';out.append(span)}}else out.textContent=revealed;$('#battle-cannon-action').hidden=phase!=='finale'||finale?.phase!=='await-e';$('#battle-cannon-action').textContent=cannonNear()?'E — поджечь фитиль':'Подойди к пушке';
 const chargeVisible=isGumi()&&charge?.active&&!isEnding()&&phase!=='finale';$('#gumi-charge').hidden=!chargeVisible;root.classList.toggle('gumi-charging',!!chargeVisible);if(chargeVisible){const value=Math.ceil(charge.energy);$('#gumi-charge-value').textContent=value+'% · '+charge.rounds+'/5';$('#gumi-charge .charge-track').setAttribute('aria-valuenow',value);$('#gumi-charge .charge-track i').style.width=charge.energy+'%';$('#gumi-charge-help').textContent='Кристалл −6% · +35% за ход';}$('#battle-whiteout').hidden=charge?.phase!=='whiteout';
 $('#battle-result').hidden=phase!=='result';if(phase==='result'){$('#battle-result-title').textContent=outcome==='victory'?'Цветок затих.':'Тето потеряла силы.';$('#battle-result-text').textContent='Тренировка завершена. Можно повторить попытку.';$('#battle-return').textContent='Повторить'}

 syncLoadout();
}
function drawHeroEffects(){const [x,y]=project(player.u,player.v),height=isNeru()?(player.z||0):isMiku()?(player.z||0)*32:isGumi()?(player.z||0)*30:FlowerAttacks.playerPoint(player).z*30;BattleHeroEffects.drawWorld(heroEffects.animations(),x,y-height,isMiku()?mikuTurns.platformOpacity:1,isMiku());}
function drawOpponent(paint){const [x,y]=abilitySession?.reaction()||[0,0];g.save();g.translate(x,y);paint();g.restore();}
function draw(){if(!opened||!ready)return;sync();if(isNeru()){neruRenderer.draw(neruBattle.sim,clock,{battle:neruBattle.visual(phase,phaseAge,clock,enemyHp),transition:phase==='phase-change'?phaseAge:0});drawHeroEffects();drawPortraits();return;}if(isMiku()){MikuBattleArt.draw(g,images,player,clock,{...mikuTurns.status(),sim:mikuCombat?.sim,enemyOffset:abilitySession.reaction()});drawHeroEffects();drawPortraits();return;}g.clearRect(0,0,1536,1024);g.imageSmoothingEnabled=false;g.save();const av=isGumi()?GumiArenaModel.status(arena):null;if(av?.shaking)g.translate(snap(Math.sin(clock*67)*5),snap(Math.sin(clock*91)*4));if(isGumi()){GumiBattleArt.background(g,clock,images,av,project)}else{rect(0,0,1536,1024,'#11272b');for(let i=0;i<220;i++)rect((i*137)%1536,140+(i*79)%620,3+(i%3)*3,3,i%2?'#1c3634':'#18302f');
 // All scenery stays behind the arena, characters and interface; the head region is clear.
 for(const p of rocks)rock(p);for(const p of props)sprite(p.image,p.x,p.y,3,p.alpha);pillar(324,432,false);pillar(1212,432,true);}
 if(isGumi())GumiBattleArt.floor(g,project,av);else { const a=project(0,0),b=project(1,0),c=project(1,1),d=project(0,1);polygon([d,c,[c[0],c[1]+21],[d[0],d[1]+21]],'#112a2e');polygon([a,b,c,d],'#34544e');for(let row=0;row<5;row++)for(let col=0;col<9;col++)polygon([project(col/9,row/5),project((col+1)/9,row/5),project((col+1)/9,(row+1)/5),project(col/9,(row+1)/5)],(row+col)%2?'#36574e':'#3c5b51');for(let row=0;row<=5;row++)line([project(0,row/5),project(1,row/5)],'#587065',3);for(let col=0;col<=9;col++)line([project(col/9,0),project(col/9,1)],'#4c6c61',3);line([a,b,c,d,a],lastDamageAt!==null&&clock-lastDamageAt<.3?'#e898ac':'#9baf94',3);line([[d[0],d[1]+9],[c[0],c[1]+9]],'#53766b',3);for(const [u,v]of [[0,0],[1,0],[0,1],[1,1]]){const [x,y]=project(u,v);rect(x-9,y-6,18,12,'#bad0ac');rect(x-3,y-3,6,6,'#e7e9c6')}}

 if(isGumi()){drawOpponent(()=>GumiBattleArt.enemy(g,clock,phase,phaseAge,outcome,clock-enemyHitAt,av,finale?GumiFinaleModel.status(finale):null,charge?GumiChargeModel.status(charge):null))}else{polygon([[654,374],[882,374],[918,402],[618,402]],'#758b73');polygon([[618,402],[918,402],[918,417],[618,417]],'#324e48');line([[633,399],[903,399]],'#b3b998',3);g.strokeStyle='#bd87a1';g.lineWidth=3;g.beginPath();g.ellipse(768,370,78,17,0,0,Math.PI*2);g.stroke();drawOpponent(()=>{if(isEnding()&&outcome==='victory')BattleEndArt.flower(g,FlowerMob.frames[FlowerMob.sample(clock).frame],768,391,phase==='victory'?phaseAge:BattleRules.settings.enemyDeath);else attackArt.caster(phase==='enemy'?attack:null,clock,sprite,FlowerMob.frames[FlowerMob.sample(clock).frame]);});}
 const entities=isEnding()?frozenEntities:[...(phase==='enemy'&&attack?attack.entities:[]),...rootEntities(phase==='enemy'),...(isGumi()&&charge?.active?charge.crystals.map((c,i)=>({...c,kind:'gumi-crystal',x:(c.u-.5)*12,y:c.v*8,serial:i})):[])];attackArt.ground(entities,clock,av);if(isGumi())GumiBattleArt.lights(g,project,av);
 const objects=attackArt.items(entities);objects.push({kind:'player',y:player.v*8});objects.sort((a,b)=>a.y-b.y);
 for(const item of objects){if(item.kind!=='player'){attackArt.solid(item,clock);continue}
 const falling=!!av?.body.falling,fell=isEnding()&&damageSource==='fatal-fall',jumpHeight=isGumi()?player.z*30:FlowerAttacks.playerPoint(player).z*30,[tx,ty]=project(player.u,player.v);if(!falling&&!fell&&(!isGumi()||GumiArenaModel.supported(arena,player))){g.fillStyle='#0c272b88';g.beginPath();g.ellipse(tx,ty+2,24,8,0,0,Math.PI*2);g.fill();}const walkFrame=(phase==='enemy'||phase==='phase-two'||phase==='finale'&&finale?.phase==='await-e')&&keys.size?Math.floor(player.walk/12)%4:0,offset=[1,0,1,2][walkFrame];const frame=player.dir*3+offset;g.save();if(falling){const p=GumiBattleArt.cellPoints(project,GumiArenaModel.cellId(player),0);g.beginPath();g.moveTo(p[0][0],p[0][1]-180);g.lineTo(p[1][0],p[1][1]-180);g.lineTo(...p[2]);g.lineTo(...p[3]);g.closePath();g.clip();}if(!fell){if(isEnding()&&outcome==='defeat')BattleEndArt.hero(g,images['teto_2_7'],tx,ty,phase==='defeat'?phaseAge:BattleRules.settings.heroDeath);else sprite(globalThis.ActorSpriteArt?.clean(images['teto_2_'+frame])||images['teto_2_'+frame],tx,ty-jumpHeight,3,isEnding()||godMode()?1:BattleRules.opacity(lastDamageAt,clock,hp));}g.restore();
 if(clock-floatingAt<.75&&!isEnding()){g.fillStyle='#fff0d1';g.font='24px QuietMeadowPixel';g.fillText('−'+lastDamageValue,tx-12,ty-100-(clock-floatingAt)*32)}if(!falling&&!fell&&(!isGumi()||GumiArenaModel.supported(arena,player)))line([[tx-24,ty+11],[tx-12,ty+17],[tx+12,ty+17],[tx+24,ty+11]],guard?'#a8efdf':'#d4e4bd',3);
 }
 if(isGumi()){GumiBattleArt.cannon(g,finale?GumiFinaleModel.status(finale):null,project,clock);GumiBattleArt.overload(g,charge?GumiChargeModel.status(charge):null,player,project,clock);}g.restore();
 if(!isGumi())for(let i=0;i<18;i++){g.globalAlpha=.25+.45*(.5+.5*Math.sin(clock*1.2+i));rect(180+(i*137)%1190+Math.sin(clock*.3+i)*8,190+(i*61)%420,3,3,i%3?'#c2d3a1':'#e5b8bd')}g.globalAlpha=1;
 const s=$('#turn-symbol').getContext('2d');s.clearRect(0,0,32,32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const dx=x-15.5,dy=y-15.5,r=Math.hypot(dx,dy);if(r>14)continue;s.fillStyle=r>12?'#adc9b8':Math.sin(Math.atan2(dy,dx)+r*.7-clock*.3)>0?'#a8d7c1':'#42665e';s.fillRect(x,y,1,1)}drawHeroEffects();drawPortraits();syncStory();
}
function select(index,focus=false){if(isMiku()?!mikuTurns?.canAct:!['intro','command'].includes(phase))return;selected=(index+buttons.length)%buttons.length;buttons.forEach((b,i)=>{b.classList.toggle('chosen',i===selected);b.setAttribute('aria-pressed',String(i===selected))});if(focus)buttons[selected].focus({preventScroll:true})}
function cannonNear(){return !!finale&&Math.hypot((player.u-finale.cannon.u)*12,(player.v-finale.cannon.v)*8)<1.8}
function damage(event){
 if(trainingInvulnerable||godMode()||isEnding())return;
 const fatal=event.type==='fatal-fall'||event.type==='fatal-overload';
 let amount=event.damage??5;
 if(!fatal){amount=abilitySession.mitigate(guard?Math.max(1,Math.ceil(amount/2)):amount);if(amount===0)return;}
 const state={hp,lastHit:lastDamageAt,lastDamage:0,damageEvents:0},result=CombatDamageV2.apply(state,{...event,damage:amount},clock);
 if(result.applied){hp=state.hp;lastDamageAt=state.lastHit;damageEvents++;damageSource=event.id||event.source||event.type;lastDamageValue=result.damage;floatingAt=clock;if(hp<=0)setPhase('defeat');}
}
function setPhase(next,attackIndex){
 if(isNeru()){setNeruPhase(next);return;}
 if(next==='command'&&abilitySession){const dot=abilitySession.afterEnemy();enemyHp=Math.max(isGumi()?1:0,enemyHp-dot);if(dot)enemyHitAt=clock;if(enemyHp<=0)next='victory';else if(isGumi()){const event=GumiArenaModel.setBossHp(arena,enemyHp);if(event)next=event==='finale'?'finale':'phase-two';}}
 if(['victory','defeat'].includes(next)){skillMenu=false;abilitySession?.finish();}
 if(next==='victory'||next==='defeat'){if(charge)GumiChargeModel.cancel(charge);outcome=next;frozenEntities=[...(attack?.entities||[]),...rootEntities(phase==='enemy')].map(e=>({...e}));lastDamageAt=null;}
 if(phase==='enemy'&&next!=='enemy'&&!isGumi())BattleRoots.endTurn(roots);
 if(isGumi()&&attack&&!attack.done&&!['defeat','victory','falling'].includes(next))GumiAttacksV2.cancel(attack);
 phase=next;phaseAge=0;if(!isGumi()||['intro','command','player','victory','defeat','returning','finale','falling'].includes(next))keys.clear();
 if(next==='enemy'){
  if(!begun){begun=true;fadeAt=clock;}
  if(attackIndex===undefined)attackIndex=isGumi()?GumiAttacksV2.choose(lastAttack,options.random||Math.random,arena.phase):FlowerAttacks.choose(lastAttack,options.random||Math.random);
  lastAttack=attackIndex;
  attack=isGumi()?GumiAttacksV2.create(attackIndex,turn,{phase:arena.phase,arena,player,random:options.random||Math.random}):FlowerAttacks.create(attackIndex,turn);
  if(!isGumi())BattleRoots.beginTurn(roots,player,options.random||Math.random);else {GumiArenaModel.setRound(arena,turn);GumiChargeModel.beginRound(charge,turn,{duration:attack.duration,arena,player,random:options.random||Math.random});}
  phrase=isGumi()?(arena.phase===2?['Не прячься. СМОТРИ СЮДА!','ПРОЧЬ! Тебе здесь не место.','Эти места НЕ ДЛЯ ТЕБЯ!','ПРЫГАЙ. Пока ещё можешь.','ПОЛУЧАЙ! Карты с обеих сторон!','ВЫБЕРИ ЦВЕТ. Ошибёшься — упадёшь.'][attackIndex]:['Смотри вверх... Я не могу их остановить.','Слышишь, как катится дерево?..','','','Зрители... они бросают карты! Прыгай!','Цвет на табличках... только он удержится.'][attackIndex]):attack.definition.phrase;phraseAge=0;
 }else if(next!=='falling'){attack=null;if(next!=='player')player.jump=0;if(next==='victory'||next==='defeat')roots=BattleRoots.create();}
 if(next==='phase-two'){arena.red=new Set(Array.from({length:25},(_,i)=>i).filter(i=>i%5===0||i%5===4));phrase='НЕ ТРОГАЙ НИТИ! Прочь с краёв!';phraseAge=0;}
 if(next==='falling'){frozenEntities=(attack?.entities||[]).map(e=>({...e}));phrase='';panel=1;}
 if(next==='overload'){arena.lightsSuppressed=true;phrase='';panel=1;keys.clear();player.jump=0;}
 if(next==='finale'){GumiChargeModel.cancel(charge);finale=GumiFinaleModel.create();GumiFinaleModel.start(finale);panel=1;phrase='';}
 if(next==='command'){mp=Math.min(heroStats.maxMp,mp+heroStats.mpPerTurn);guard=false;turn++;phrase='';select(selected);}
 sync();
}
function canChoose(){return !skillChallenge&&!(isNeru()&&neruBattle?.targeting)&&!localPaused&&!isEnding()&&(isMiku()?mikuTurns?.canAct:['intro','command'].includes(phase)&&panel<=.04);}
function openSkills(mode='abilities'){if(!canChoose())return;skillMenu=true;continueQueued=false;skillMode=mode;skillNotice='';abilitySession.mode=mode;abilitySession.begin();sync();}
function closeSkills(){if(skillChallenge)return;continueQueued=false;skillMenu=false;abilitySession?.finish();sync();buttons[selected]?.focus({preventScroll:true});}
function continueSkills(){
 if(!canChoose())return false;
 if(abilitySession.busy>0){continueQueued=true;return true;}
 continueQueued=false;
 if(skillMode==='items'){closeSkills();return true;}
 skillMenu=false;abilitySession.finish();guard=false;keys.clear();
 if(!begun){begun=true;fadeAt=clock;}
 if(isMiku())return beginMikuTurn();
 const event=isGumi()?GumiArenaModel.setBossHp(arena,enemyHp):null;setPhase(event==='finale'?'finale':event==='phase-two'?'phase-two':'enemy');return true;
}
function castSkill(id){
 if(!skillMenu||!canChoose())return {ok:false};
 if(skillMode==='items'){
  const item=ShopModel.find(id);if(item?.kind!=='consumable'||abilitySession.busy>0)return {ok:false};
  const amount=item.restore.hp?Math.min(item.restore.hp,heroStats.maxHp-hp):Math.min(item.restore.mp,heroStats.maxMp-mp);
  if(amount<=0){skillNotice='Запас уже полон.';sync();return {ok:false};}
  const result=ShopUI.consumeItem(id);if(!result.ok)return result;
  if(item.restore.hp)hp+=amount;else mp+=amount;heroEffects.receive(item,{ok:true,healed:item.restore.hp?amount:0,restoredMp:item.restore.mp?amount:0});abilitySession.busy=.4;skillNotice=item.name+' · +'+amount+(item.restore.hp?' HP':' MP');sync();return {ok:true};
 }
 const check=abilitySession.canCast(id,mp,{hp});
 if(check.ok&&isNeru()&&ShopModel.find(id).target!=='hero'){neruBattle.pendingSkill=id;neruBattle.targeting=true;if(!neruBattle.targets(enemyHp).some(t=>t.id===neruBattle.target))neruBattle.target='neru';keys.clear();sync();return {ok:true,targeting:true};}
 if(check.ok){skillChallenge=new SkillGamesModel.Run(id,options.random||Math.random);lastSkillPerformance=null;continueQueued=false;keys.clear();skillNotice='';sync();return {ok:true,pending:true,id};}
 return applySkill(id,null);
}
function applySkill(id,performance){
 const result=abilitySession.cast(id,mp,{hp,performance});if(!result.ok){skillNotice={mana:"Не хватает маны.","full-hp":"Здоровье уже полное.","already-active":"Это усиление уже действует."}[result.reason]||"";sync();return result;}
 heroEffects.receive(ShopModel.find(id),result);lastSkillPerformance=result.performance?{id,...result.performance}:null;skillNotice="";hp=result.hp;mp=result.mp;if(isNeru()){const target=result.target==='hero'?'hero':neruBattle.castTarget;neruBattle.castTarget='neru';if(target!=='hero'){enemyHp=neruBattle.damageTarget(target,result.damage,enemyHp,clock,{critical:result.crits>0});if(result.poison)neruBattle.poison(target,ShopModel.find(id));}abilitySession.poisons=[];}else enemyHp=Math.max(isGumi()?1:0,enemyHp-result.damage);if(result.damage)enemyHitAt=clock;
 if(enemyHp<=0){skillMenu=false;abilitySession.finish();if(isMiku())finishMiku('victory');else setPhase('victory');}
 sync();return result;
}
function syncLoadout(){
 if(!abilitySession)return;
 heroEffects.reconcile(abilitySession.buffs,guard);BattleHeroEffects.sync(heroEffects.status(),abilitySession.buffs,guard,heroEffects.animations());
 const values=root.querySelectorAll('.meter-value');values[0].innerHTML=Math.round(hp)+' <em>/ '+heroStats.maxHp+'</em>';values[1].innerHTML=mp+' <em>/ '+heroStats.maxMp+'</em>';
 $('.meter-track.hp i').style.width=hp/heroStats.maxHp*100+'%';$('.meter-track.mp i').style.width=mp/heroStats.maxMp*100+'%';
 $('#battle-live-hp').textContent='ТЕТО  HP '+Math.round(hp)+' / '+heroStats.maxHp+(godMode()?' · GOD':'');
 const primary=buttons[0];primary.querySelector('strong').textContent=skillMenu&&skillMode==='abilities'?'Продолжить':'Атака';primary.querySelector('small').textContent=skillMenu&&skillMode==='abilities'?'Передать ход':'Выбрать приёмы';
 if(abilitySession.poisons.length)$('.enemy-note span:last-child').textContent='Отравление · '+abilitySession.poisons.reduce((n,p)=>n+p.damage,0);
 const wallet=ShopUI.captureState(),items=ShopModel.inventoryCatalog.filter(i=>i.kind==='consumable'&&wallet.inventory[i.id]>0);
 BattleSkillsUI.sync({open:skillMenu&&!skillChallenge&&!(isNeru()&&neruBattle.targeting),mode:skillMode,abilities:abilitySession.list(),items,itemCounts:items.map(i=>wallet.inventory[i.id]),mp,maxMp:heroStats.maxMp,busy:abilitySession.busy,costs:Object.fromEntries(abilitySession.list().map(i=>[i.id,abilitySession.manaCost(i)])),effect:abilitySession.effect,log:skillMode==='abilities'?abilitySession.log:[],notice:skillNotice});
 SkillGamesUI.sync(skillChallenge,localPaused);
 if(skillChallenge){$('#battle-lower').inert=true;buttons.forEach(b=>b.disabled=true);}
}
function activate(index=selected){
 if(!canChoose())return;select(index);
 if(index===0){if(skillMenu&&skillMode==='abilities')continueSkills();else openSkills();return;}
 if(index===1){openSkills('items');return;}
 if(index===2){heroEffects.receive({name:'Защита'},{ok:true,guard:.5});continueQueued=false;skillMenu=false;abilitySession.finish();guard=true;pending='guard';keys.clear();if(!begun){begun=true;fadeAt=clock;}if(isMiku()){mikuPendingDamage=0;mikuTurns.command('guard');syncMikuPhase();}else setPhase('player');sync();}
}
function syncMikuPhase(){phase=mikuTurns.phase;phaseAge=mikuTurns.age;turn=Math.max(1,mikuTurns.turn);panel=mikuTurns.canAct?0:1;}
function prepareMikuRound(index,passives){mikuCombat.begin(hp,guard,index,passives);lastAttack=mikuCombat.last;mikuCombat.copyPlayer(player);}
function beginMikuTurn(){if(!opened||!isMiku()||localPaused||!mikuTurns.beginEnemy(player))return false;keys.clear();prepareMikuRound();syncMikuPhase();sync();return true;}
function endMikuTurn(){if(!opened||!isMiku()||localPaused||!mikuTurns.movable)return false;const dot=abilitySession.afterEnemy();enemyHp=Math.max(0,enemyHp-dot);if(enemyHp<=0){finishMiku('victory');return true;}mikuTurns.finishEnemy(player);keys.clear();mikuCombat.clear();mikuCombat.copyPlayer(player);syncMikuPhase();mikuConfig.onEnemyEnd?.({turn});sync();return true;}
function finishMiku(result){skillMenu=false;abilitySession?.finish();outcome=result;keys.clear();mikuCombat.clear();mikuCombat.copyPlayer(player);mikuTurns.complete(result,player);syncMikuPhase();sync();options.onMikuFinish?.({outcome:result,hp,enemyHp,encounter:'miku'});}
function updateMiku(dt){
 clock+=dt;heroEffects.update(dt);abilitySession.update(dt);if(continueQueued&&abilitySession.busy<=0)continueSkills();
 if(isEnding()){
  mikuTurns.age+=dt;
  if(outcome==='victory'&&mikuTurns.age>=1.4&&options.onFinish){const result={outcome,enemyHp,hp,encounter:'miku'};close();options.onFinish(result);return;}
  if(phase!=='result'&&mikuTurns.age>=1.4){mikuTurns.phase='result';mikuTurns.age=0;}
  syncMikuPhase();sync();return;
 }
 if(mikuTurns.phase==='player'&&mikuTurns.age+dt>=MikuTurnModel.timings.action){
  enemyHp=Math.max(0,enemyHp-mikuPendingDamage);if(mikuPendingDamage)enemyHitAt=clock;mikuPendingDamage=0;
  if(enemyHp<=0){finishMiku('victory');return;}
 }
 const event=mikuTurns.update(dt,player);syncMikuPhase();
 if(event){
  keys.clear();
  if(event==='enemy-prepare')prepareMikuRound();
  if(event==='enemy-start')mikuConfig.onEnemyStart?.({turn,finish:endMikuTurn});
  if(event==='command'){mp=Math.min(heroStats.maxMp,mp+heroStats.mpPerTurn);guard=false;mikuActionNotice='';select(selected);}
 }
 if(phase==='conversation'){storyAge+=dt;storyRevealed=Math.min(storyLines()[storyIndex].text.length,Math.max(storyRevealed,Math.floor(storyAge*BattleStory.typeSpeed)));}
 if(mikuTurns.movable){
  const input={dx:(keys.has('right')?1:0)-(keys.has('left')?1:0),dy:(keys.has('down')?1:0)-(keys.has('up')?1:0),speedScale:abilitySession.movementScale()};
  const result=mikuCombat.step(dt,input,{hp,god:godMode(),mitigate:n=>abilitySession.mitigate(n)});hp=result.hp;mikuCombat.copyPlayer(player);
  if(result.hit&&result.hit.damage>0){lastDamageAt=clock;damageEvents++;damageSource=result.hit.id;lastDamageValue=result.hit.damage;floatingAt=clock;}
  if(hp<=0){finishMiku('defeat');return;}
  if(result.done)endMikuTurn();
 }
 sync();
}
function confirmNeruTarget(){if(!isNeru()||!neruBattle.targeting||!neruBattle.pendingSkill)return false;const id=neruBattle.pendingSkill;if(!abilitySession.canCast(id,mp,{hp}).ok)return false;neruBattle.castTarget=neruBattle.target;neruBattle.pendingSkill=null;neruBattle.targeting=false;skillChallenge=new SkillGamesModel.Run(id,options.random||Math.random);lastSkillPerformance=null;continueQueued=false;keys.clear();sync();return true;}
function cancelNeruTarget(){if(!neruBattle?.targeting)return false;neruBattle.targeting=false;neruBattle.pendingSkill=null;sync();return true;}
function setNeruPhase(next,index=null){
 if(next==='command'){enemyHp=neruBattle.tickPoison(enemyHp,clock);abilitySession.poisons=[];abilitySession.afterEnemy();if(enemyHp<=0)next='victory';else{mp=Math.min(heroStats.maxMp,mp+heroStats.mpPerTurn);guard=false;turn++;}}
 if(next==='enemy'&&enemyHp<=300&&!neruBattle.phaseTwoShown&&index===null){neruBattle.phaseTwoShown=true;neruBattle.phase=2;next='phase-change';}
 phase=next;phaseAge=0;keys.clear();attack=null;roots=BattleRoots.create();
 if(next==='enemy'){const sim=neruBattle.begin(hp,enemyHp,abilitySession,{guard,invulnerable:godMode()||trainingInvulnerable,index});Object.assign(player,sim.player);begun=true;fadeAt=clock;}
 if(['victory','defeat'].includes(next)){outcome=next;skillMenu=false;neruBattle.targeting=false;abilitySession.finish();lastDamageAt=null;player.jump=player.z=0;neruBattle.sim.neutral=true;}
 if(next==='command'){neruBattle.sim.neutral=true;select(selected);}sync();
}
function updateNeru(dt){
 clock+=dt;phaseAge+=dt;heroEffects.update(dt);abilitySession.update(dt);if(continueQueued&&abilitySession.busy<=0)continueSkills();
 if(isEnding()){panel=Math.min(1,panel+dt/.58);if(['victory','defeat'].includes(phase)&&phaseAge>=1.4)setNeruPhase('returning');else if(phase==='returning'&&phaseAge>=.6){if(options.onFinish){const result={outcome,enemyHp,hp,encounter:'neru'};close();options.onFinish(result);return;}else setNeruPhase('result');}sync();return;}
 panel=['enemy','player','guard','summon','phase-change'].includes(phase)?Math.min(1,panel+dt/.58):Math.max(0,panel-dt/.58);
 if(phase==='summon'&&phaseAge>=1.9){phase='intro';phaseAge=0;keys.clear();}
 if(phase==='phase-change'&&phaseAge>=3)setNeruPhase('enemy');
 if(phase==='player'&&phaseAge>=.6)setNeruPhase('enemy');
 if(phase==='enemy'){
  const sim=neruBattle.sim,before=sim.hits;sim.invulnerable=godMode()||trainingInvulnerable;sim.hp=hp;sim.step(dt,{dx:(keys.has('right')?1:0)-(keys.has('left')?1:0),dy:(keys.has('down')?1:0)-(keys.has('up')?1:0)});hp=sim.hp;Object.assign(player,sim.player);
  if(sim.hits>before){lastDamageAt=clock;damageEvents++;damageSource=sim.lastSource;lastDamageValue=sim.lastDamage;}
  if(hp<=0&&!sim.fall)setNeruPhase('defeat');else if(sim.attack.done&&!sim.fall){sim.neutral=true;if(neruBattle.queueGuards())setNeruPhase('guard');else setNeruPhase('command');}
 }
 if(phase==='guard'){
  const mob=neruBattle.guards.find(g=>g.id===neruBattle.currentGuard);if(mob?.hp>0&&!neruBattle.healed&&phaseAge>=.6){neruBattle.healed=true;const before=enemyHp;enemyHp=Math.min(600,enemyHp+50);neruBattle.healAt=clock;neruBattle.healLog.push({turn:neruBattle.enemyTurn,guard:mob.id,healed:enemyHp-before});}
  if(phaseAge>=1.65){if(neruBattle.nextGuard())setNeruPhase('guard');else setNeruPhase('command');}
 }
 sync();
}

function update(dt){
 if(!opened||localPaused)return;dt=Math.max(0,Math.min(dt,.05));
 if(skillChallenge){const run=skillChallenge;run.step(dt);if(run.phase==='done'){skillChallenge=null;applySkill(run.id,run.result);}sync();return;}
 if(isMiku()){updateMiku(dt);return;}if(isNeru()){updateNeru(dt);return;}heroEffects.update(dt);abilitySession?.update(dt);if(continueQueued&&abilitySession.busy<=0)continueSkills();if(!isEnding())clock+=dt;phaseAge+=dt;
 if(isEnding()){
  panel=Math.min(1,panel+dt/.58);const deathTime=damageSource==='fatal-fall'?.65:BattleRules.settings.heroDeath;
  if((phase==='defeat'&&phaseAge>=deathTime)||(phase==='victory'&&phaseAge>=(isGumi()?.35:BattleRules.settings.enemyDeath)))setPhase('returning');
  else if(phase==='returning'&&phaseAge>=BattleRules.settings.returnFade){if(options.onFinish){const result={outcome,enemyHp,hp,encounter};close();options.onFinish(result);}else setPhase('result');}sync();return;
 }
 if(inStory()||['enemy','phase-two','finale','overload','falling'].includes(phase))panel=Math.min(1,panel+dt/.58);else if(phase!=='player')panel=Math.max(0,panel-dt/.58);
 if(phase==='conversation'){storyAge+=dt;storyRevealed=Math.min(BattleStory.lines[storyIndex].text.length,Math.max(storyRevealed,Math.floor(storyAge*BattleStory.typeSpeed)));}
 else if(phase==='conversation-out'&&phaseAge>=BattleStory.fadeOut){begun=true;fadeAt=clock-1;setPhase('intro');storyFocusPending=true;}
 else if(phase==='player'&&phaseAge>=.8){
  // Damage is resolved when each selected ability is cast.
  if(isGumi()){const event=GumiArenaModel.setBossHp(arena,enemyHp);setPhase(event==='finale'?'finale':event==='phase-two'?'phase-two':'enemy');}
  else setPhase(enemyHp<=0?'victory':'enemy');
 }
 const moving=phase==='enemy'||phase==='phase-two'||phase==='finale'&&finale.phase==='await-e',before={...player};
 if(moving){
  const dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0),d=Math.hypot(dx,dy)||1,bounds=FlowerAttacks.arena;
  const finaleEdge=isGumi()&&phase==='finale'&&arena.permanent.size>0;
  player.u=clamp(player.u+dx/d*dt*.35*abilitySession.movementScale(),finaleEdge?.22:bounds.minU,finaleEdge?.78:bounds.maxU);player.v=clamp(player.v+dy/d*dt*.6*abilitySession.movementScale(),bounds.minV,bounds.maxV);
  if(dx||dy){player.walk+=dt*120;if(!dx||!dy)player.dir=dx?dx>0?1:3:dy>0?2:0;}
  if(!isGumi())player.jump=Math.max(0,player.jump-dt);
 }
 if(['enemy','phase-two'].includes(phase))phraseAge+=dt;
 if(isGumi()&&!isEnding()){
  const events=phase==='overload'?[]:GumiArenaModel.step(arena,dt,player,{paused:isHeroTurn(),worldFrozen:phase==='falling',before,godMode:godMode(),damageEnabled:['enemy','phase-two'].includes(phase),random:options.random||Math.random});
  Object.assign(player,{z:arena.body.z,jump:arena.body.jump,falling:arena.body.falling});
  for(const e of events){if(e.type==='god-rescue'){Object.assign(player,{u:e.u,v:e.v,z:0,jump:0,falling:false});keys.clear();if(phase==='falling'){phase=attack?'enemy':'phase-two';phaseAge=0;phrase='';}}if(e.type==='fall-start')setPhase('falling');if(e.type==='damage'||e.type==='fatal-fall')damage(e);if(isEnding())break;}
 }
 if(phase==='enemy'&&attack){const hits=[...attackModel().step(attack,dt,before,player),...(isGumi()?[]:BattleRoots.step(roots,dt,before,player))];for(const hit of hits){damage(hit);if(isEnding())break;}}
 if(isGumi()&&!isEnding()){
  if(!isHeroTurn()&&!['finale','falling'].includes(phase))for(const e of GumiChargeModel.step(charge,dt,before,player,{arena,charging:phase==='enemy',random:options.random||Math.random})){if(e.type==='overload-start')setPhase('overload');if(e.type==='fatal-overload'){if(godMode()){GumiChargeModel.cancel(charge);arena.lightsSuppressed=false;setPhase('command');}else damage(e);}if(isEnding())break;}
  if(!isEnding()&&phase==='phase-two'&&arena.phaseAge>=5)setPhase('enemy');
  if(!isEnding()&&phase==='finale'){GumiFinaleModel.step(finale,dt);if(finale.complete)setPhase('victory');}
 }
 // Complete an airborne crossing before showing commands; a missed landing keeps falling.
 if(phase==='enemy'&&attack?.done&&(!isGumi()||arena.body.grounded)){
  const chain=isGumi()&&attack.definition.chainNext;if(isGumi()&&!chain)GumiChargeModel.finishRound(charge,turn);setPhase(chain?'enemy':'command');
 }
 if(storyFocusPending&&panel<=.001&&['intro','command'].includes(phase)){storyFocusPending=false;select(0,true);}sync();
}
function open(config={}){if(!ready)return;skillChallenge=null;lastSkillPerformance=null;SkillGamesUI.hide(false);heroEffects.clear();encounter=config?.id==='neru'?'neru':config?.id==='miku'?'miku':config?.id==='gumi'?'gumi':'flower';neruBattle=isNeru()?new NeruCombatModel.Encounter(options.random||Math.random,config.skyAge||0):null;mikuConfig=isMiku()?config:{};mikuDialogue=isMiku()?(config.dialogue||globalThis.MikuBattleDialogue?.lines||[]).filter(n=>n&&typeof n.speaker==='string'&&typeof n.text==='string'&&n.text.trim()).map(n=>({...n})):[];mikuTurns=isMiku()?new MikuTurnModel.Turns({dialogue:mikuDialogue.length>0}):null;mikuCombat=isMiku()?new MikuCombatModel.Encounter(options.random||Math.random):null;mikuPendingDamage=0;mikuActionNotice='';abilitySession=new LoadoutCombatModel.Session(ShopUI.captureState(),options.random||Math.random);heroStats=abilitySession.stats;skillMenu=false;skillMode='abilities';skillNotice='';continueQueued=false;$('.enemy-note span:first-child').textContent='ПРОТИВНИК';$('.enemy-bar').setAttribute('aria-label','Здоровье противника');arena=isGumi()?GumiArenaModel.create(options.random||Math.random):null;if(isGumi()){player.z=0;player.falling=false;}else{delete player.z;delete player.falling;}charge=isGumi()?GumiChargeModel.create():null;finale=null;floatingAt=-Infinity;lastDamageValue=5;enemyHitAt=-Infinity;attackArt=isGumi()?GumiBattleArt.renderer(g,project,polygon,line,rect):FlowerAttackArt.renderer(g,project,polygon,line,rect);root.dataset.encounter=encounter;root.setAttribute('aria-label',isGumi()?'Бой с Гуми':'Бой с незнакомым цветком');$('#battle-scene').setAttribute('aria-label',isGumi()?'Арена цирка. Тето против Гуми на кукольных нитях.':'Каменная арена в лесу. Тето напротив незнакомого цветка.');$('.location .eyebrow').textContent=isGumi()?'ЦИРКОВОЙ ШАТЁР':'ЛЕС ШЁПОТА';$('.location-title').textContent=isGumi()?'Арена нитей':'Каменный круг';$('.enemy-name h1').textContent=isGumi()?'Гуми':'Незнакомый цветок';$('.enemy-note span:last-child').textContent=isGumi()?'Движется против воли':'Наблюдает за тобой';lastFocus=document.activeElement;opened=true;root.hidden=false;clock=0;phase=isMiku()?mikuTurns.phase:isGumi()?'intro':'conversation';phaseAge=0;begun=false;fadeAt=-1;panel=1;storyIndex=0;storyAge=0;storyRevealed=0;storyFocusPending=false;phrase='';phraseAge=0;turn=1;hp=heroStats.maxHp;mp=0;enemyHp=isNeru()?NeruSceneModel.settings.maxHp:isMiku()?null:isGumi()?300:150;guard=false;attack=null;trainingInvulnerable=false;lastDamageAt=null;damageEvents=0;damageSource=null;outcome=null;frozenEntities=[];lastAttack=-1;roots=BattleRoots.create();Object.assign(player,{u:.5,v:isMiku()?.5:.75,dir:0,walk:0,jump:0});keys.clear();localPaused=false;$('#battle-pause').hidden=true;$('.miku-card p').innerHTML='Не спеши, Тето.<br>Сначала посмотри,<br>как он двигается.';options.onOpen?.();resize();select(0);if(!isGumi()&&!isMiku()&&!isNeru())storyLine();else storyFocusPending=true;if(isMiku()){panel=mikuTurns.canAct?0:1;begun=true;storyFocusPending=false;if(mikuDialogue.length)storyLine();else{enemyHp=500;beginMikuTurn();}root.setAttribute('aria-label','Тето и Мику на чёрном поле с белой окантовкой');$('#battle-scene').setAttribute('aria-label','Пустая чёрно-белая арена. Модель Мику из подготовленного оригинального набора.');}$('.battle-controls span:nth-child(2)').textContent='WASD / стрелки — выбор';if(isGumi())$('.miku-card p').textContent='Оборвём нити. Смотри на красные метки и уходи из света.';draw();if(isNeru()){root.setAttribute('aria-label','Бой с Неру на облаке');$('#battle-scene').setAttribute('aria-label','Белое облачное поле, четыре мраморные колонны и исходная анимированная Неру на кубе.');begun=true;storyFocusPending=false;setNeruPhase('summon');Object.assign(player,neruBattle.sim.player);draw();}if(inStory())$('#battle-story-box').focus({preventScroll:true})}
function close(){if(!opened)return;skillChallenge=null;lastSkillPerformance=null;SkillGamesUI.hide(false);neruBattle=null;heroEffects.clear();BattleHeroEffects.sync([]);BattleHeroEffects.drawWorld([],0,0);opened=false;for(const id of ['neru-targets','neru-eclipse'])if($('#'+id))$('#'+id).hidden=true;continueQueued=false;skillMenu=false;abilitySession?.finish();if(root.querySelector('#battle-skills'))root.querySelector('#battle-skills').hidden=true;mikuTurns=null;mikuDialogue=[];mikuConfig={};mikuCombat=null;mikuPendingDamage=0;mikuActionNotice='';root.hidden=true;keys.clear();if(isGumi()&&attack)GumiAttacksV2.cancel(attack);attack=null;arena=null;finale=null;if(charge)GumiChargeModel.cancel(charge);charge=null;roots=BattleRoots.create();lastAttack=-1;player.jump=0;trainingInvulnerable=false;options.onClose?.();if(lastFocus?.isConnected&&!lastFocus.closest('[hidden]'))lastFocus.focus({preventScroll:true})}
function localPause(value){if(value){keys.clear();SkillGamesUI.clearHeld();}localPaused=value;$('#battle-pause').hidden=!value;sync();if(value)$('#battle-resume').focus();else if(skillChallenge)$('#battle-skill-game').focus({preventScroll:true});else if(['intro','command'].includes(phase))buttons[selected].focus()}
const binding=e=>({KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'})[e.code];
function handleKey(e){if(!opened)return;
 if(skillChallenge){if(e.code==='Escape'){e.preventDefault();if(!e.repeat){keys.clear();SkillGamesUI.clearHeld();if(options.onPause)options.onPause();else localPause(!localPaused);}}else if(!localPaused)SkillGamesUI.handleKey(e);return;}
 if(isNeru()&&neruBattle?.targeting&&!localPaused){e.preventDefault();if(!e.repeat){const key=binding(e);if(key==='left'||key==='right')neruBattle.cycle(key==='left'?-1:1,enemyHp);else if(e.code==='Enter')confirmNeruTarget();else if(e.code==='Escape')cancelNeruTarget();sync();}return;}
 if(skillMenu&&!localPaused){BattleSkillsUI.handleKey(e);return;}if(e.code==='Escape'){e.preventDefault();if(!e.repeat){keys.clear();if(options.onPause)options.onPause();else localPause(!localPaused)}return}if(localPaused)return;if(isMiku()){const k=binding(e),n=PixelUI.digit(e);if(k||n!==null||['Enter','KeyE','Space'].includes(e.code))e.preventDefault();if(inStory()){if(!e.repeat&&['Enter','KeyE','Space'].includes(e.code))advanceStory();return;}if(isEnding()){if(phase==='result'&&!e.repeat&&['Enter','Space','KeyE'].includes(e.code))open(mikuConfig);return;}if(mikuTurns.movable){if(k)keys.add(k);if(e.code==='Space'&&!e.repeat&&mikuCombat.jump())mikuCombat.copyPlayer(player);return;}if(e.repeat||!mikuTurns.canAct)return;if(n>=1&&n<=3)activate(n-1);else if(e.code==='Enter'||e.code==='Space')activate();else{const delta={left:-1,right:1,up:-2,down:2}[k];if(delta)select(selected+delta,true);}return;}if(inStory()){if(binding(e)||PixelUI.digit(e)!==null||['Enter','Space','KeyE'].includes(e.code))e.preventDefault();if(!e.repeat&&['Enter','Space','KeyE'].includes(e.code))advanceStory();return}const k=binding(e),digit=PixelUI.digit(e);if(k||digit!==null||['Enter','Space','KeyE','KeyI'].includes(e.code))e.preventDefault();if(phase==='enemy'||phase==='phase-two'||phase==='finale'){if(k&&(phase!=='finale'||finale?.phase==='await-e'))keys.add(k);if(phase==='finale'&&e.code==='KeyE'&&!e.repeat&&cannonNear()){GumiFinaleModel.interact(finale);keys.clear();player.jump=0;return;}if(e.code==='Space'&&!e.repeat&&player.jump<=0&&phase!=='finale'){if(isGumi()){GumiArenaModel.jump(arena);player.jump=arena.body.jump;player.z=arena.body.z;}else if(isNeru()){neruBattle.sim.jump();Object.assign(player,neruBattle.sim.player);}else player.jump=FlowerAttacks.arena.jumpDuration;}return}if(e.repeat)return;if(isEnding())return;if(!['intro','command'].includes(phase))return;if(digit>=1&&digit<=3){activate(digit-1);return}const delta={left:-1,right:1,up:-2,down:2}[k];if(delta)select(selected+delta,true);else if(e.code==='Enter'||e.code==='Space')activate()}
function keyUp(e){if(skillChallenge){if(localPaused||globalThis.PauseUI?.isOpen||globalThis.DeveloperUI?.isOpen)SkillGamesUI.clearHeld();else SkillGamesUI.keyUp(e);}const k=binding(e);if(k)keys.delete(k)}
buttons.forEach((b,i)=>{b.addEventListener('pointerenter',()=>select(i));b.addEventListener('focus',()=>select(i));b.addEventListener('click',()=>activate(i))});$('#battle-story-box').onclick=advanceStory;$('#battle-return').onclick=()=>isNeru()?open({id:'neru',skyAge:neruBattle?.skyAge}):isMiku()?open(mikuConfig):options.training?practice(Math.max(0,lastAttack),trainingInvulnerable):open();$('#battle-resume').onclick=()=>localPause(false);$('#battle-cannon-action').onclick=()=>{if(phase==='finale'&&cannonNear())GumiFinaleModel.interact(finale);};
root.addEventListener('keydown',e=>{if(e.code==='Tab'&&!['intro','command'].includes(phase)){e.preventDefault();const list=[...root.querySelectorAll('.hero-effect')];if(list.length){const i=list.indexOf(document.activeElement),next=(i+(e.shiftKey?-1:1)+list.length)%list.length;list[next].focus({preventScroll:true});}}});
function init(textures,callbacks={}){images=textures;options=callbacks;neruRenderer=images.lightning_0&&images.neruGuard?new NeruAttackArt.Renderer(g.canvas,images):null;BattleStory.init(images.battleStoryPortraits);for(let i=0;i<12;i++){const name=i%3===0?'oak':'pine';props.push({x:40+i*132,y:296+(i%3)*30,image:makeSprite(name,i%3===0?48:38,58,true),alpha:.9})}for(const side of [-1,1])for(let i=0;i<4;i++)props.push({x:side<0?54+i%2*76:1480-i%2*76,y:410+i*96,image:makeSprite(i%2?'oak':'pine',42,58,i<2),alpha:1});props.sort((a,b)=>a.y-b.y);root.querySelectorAll('[data-icon]').forEach(el=>el.append(PixelUI.icon(el.dataset.icon)));const icon=document.createElement('canvas');icon.width=24;icon.height=32;icon.className='teto-command-icon';icon.getContext('2d').drawImage(ActorSpriteArt.clean(images.teto_2_7),0,0);buttons[0].querySelector('.action-icon').replaceChildren(icon);BattleHeroEffects.init($('.hero-card'));SkillGamesUI.init(stage);BattleSkillsUI.init(stage,{cast:castSkill,close:closeSkills,finish:continueSkills,count:id=>ShopUI.captureState().inventory[id]||0});ready=true}
function practice(index,invulnerable=true){
 if(!options.training||!Number.isInteger(index)||index<0||index>=FlowerAttacks.definitions.length)return false;
 if(!opened)open();roots=BattleRoots.create();lastAttack=-1;localPaused=false;$('#battle-pause').hidden=true;trainingInvulnerable=!!invulnerable;hp=heroStats.maxHp;mp=0;enemyHp=150;guard=false;turn=index+1;begun=true;fadeAt=clock-1;panel=1;storyFocusPending=false;lastDamageAt=null;damageEvents=0;damageSource=null;outcome=null;frozenEntities=[];Object.assign(player,{u:.5,v:.75,dir:0,walk:0,jump:0});setPhase('enemy',index);draw();return true;
}
function storyStatus(){const lines=storyLines();if(isGumi()||!lines.length)return {index:-1,speaker:null,revealed:0,length:0,age:0,total:0};const n=lines[storyIndex];return {index:storyIndex,speaker:n.speaker,revealed:storyRevealed,length:n.text.length,age:storyAge,total:lines.length};}
function status(){return {open:opened,ready,encounter,heroStats:{...heroStats},skillMenu,skillMode,continueQueued,skillChallenge:skillChallenge?.status()||null,lastSkillPerformance:lastSkillPerformance?{...lastSkillPerformance}:null,heroEffects:heroEffects.status(),heroEffectAnimations:heroEffects.animations(),abilities:abilitySession?.status()||null,neru:neruBattle?.status(phase)||null,attack:isNeru()?(neruBattle?.sim.neutral?null:neruBattle?.sim.status()||null):isMiku()&&mikuCombat?.sim?{...mikuCombat.status(),entities:mikuCombat.sim.attack.entities.map(e=>({...e}))}:attackModel().status(attack),roots:BattleRoots.status(roots),lastAttack,arenaScale:isGumi()?.76:FlowerAttacks.arena.projectionScale,arena:arena?GumiArenaModel.status(arena):null,finale:finale?GumiFinaleModel.status(finale):null,charge:charge?GumiChargeModel.status(charge):null,training:!!options.training,trainingInvulnerable,phase,phaseAge,outcome,damageEvents,damageSource,lastDamageAt,invulnerableRemaining:protectedNow()?Math.max(0,(isMiku()?MikuCombatModel.invulnerability:BattleRules.settings.invulnerability)-clock+lastDamageAt):0,tetoOpacity:isEnding()||godMode()?1:BattleRules.opacity(lastDamageAt,clock,hp),miku:mikuTurns?{...mikuTurns.status(),round:mikuCombat.status(),activeNumbers:MikuAttackLab.definitions.map(d=>d.number),passiveNumbers:MikuAttackLab.passiveDefinitions.map(d=>d.number)}:null,story:storyStatus(),selected,clock,begun,captionOpacity:inStory()?0:!begun?1:1-ease((clock-fadeAt)/.65),panelOffset:Math.round(ease(panel)*315),panelOpacity:1-ease(panel),phrase,phraseRevealed:Math.floor(phraseAge*28),turn,hp,mp,enemyHp,player:{...player},extraHints:!!globalThis.GameSettings?.extraHints,localPaused,heroTurn:isHeroTurn(),godMode:godMode()}}
globalThis.BattleUI={restoreStat(stat,amount=null){if(!opened||isEnding())throw Error('Восстановление доступно в активном бою.');if(!['hp','mp'].includes(stat))throw Error('Неизвестная характеристика.');const max=stat==='hp'?heroStats.maxHp:heroStats.maxMp;if(amount!==null&&(!Number.isInteger(amount)||amount<1||amount>max))throw Error('Неверное количество.');if(stat==='hp')hp=amount===null?heroStats.maxHp:Math.min(heroStats.maxHp,hp+amount);else mp=amount===null?heroStats.maxMp:Math.min(heroStats.maxMp,mp+amount);sync();return {value:stat==='hp'?hp:mp};},testing(config){if(!globalThis.__QM_TEST__)throw Error('Test bridge disabled');if(!opened)throw Error('No battle');if(config.castRoll!==undefined)abilitySession.random=()=>config.castRoll;if(config.player){Object.assign(player,config.player);if(arena&&config.player.jump!==undefined){GumiArenaModel.setJump(arena,config.player.jump);player.z=arena.body.z;player.falling=false;}}if(config.mp!==undefined)mp=clamp(config.mp,0,heroStats.maxMp);if(config.holes&&arena){arena.permanent=new Set(config.holes);arena.temporary.clear();arena.temporaryMode=null;arena.red.clear();}if(config.hp!==undefined)hp=config.hp;if(config.turn!==undefined){turn=config.turn;if(arena)GumiArenaModel.setRound(arena,turn);}if(config.enemyHp!==undefined){if(isGumi()){if(attack)GumiAttacksV2.cancel(attack);attack=null;enemyHp=Math.max(1,config.enemyHp);const event=GumiArenaModel.setBossHp(arena,enemyHp);if(event)setPhase(event==='finale'?'finale':'phase-two');}else enemyHp=config.enemyHp;}if(config.attack!==undefined){if(isMiku()){mikuTurns.phase='enemy';mikuTurns.age=0;mikuTurns.restOpacity=1;mikuTurns.turn=config.turn||Math.max(1,mikuTurns.turn);prepareMikuRound(config.attack,config.passives);syncMikuPhase();}else if(isNeru())setNeruPhase('enemy',config.attack);else setPhase('enemy',config.attack);}if(isNeru()&&config.player){Object.assign(neruBattle.sim.player,config.player);Object.assign(player,neruBattle.sim.player);}if(isNeru()&&config.neruGuards)for(const mob of neruBattle.guards){const value=config.neruGuards[mob.id];if(value!==undefined){mob.hp=Math.max(0,value);if(!mob.hp)mob.deadAt=clock;}}if(isNeru()&&config.neruEndAttack){neruBattle.sim.attack.done=true;neruBattle.sim.fall=null;}if(isMiku()&&config.player){mikuCombat.setPlayer(config.player);mikuCombat.copyPlayer(player);}if(config.charge&&arena){charge=GumiChargeModel.create();GumiChargeModel.beginRound(charge,turn,{force:true,duration:attack?.duration||5,arena,player,random:options.random||Math.random});}if(config.cancelCharge&&charge)GumiChargeModel.cancel(charge);if(config.chargeEnergy!==undefined&&charge)charge.energy=clamp(config.chargeEnergy,0,100);if(config.suppressLights!==undefined&&arena)arena.lightsSuppressed=config.suppressLights;if(config.lightAtPlayer&&arena)for(const light of arena.lights)if(light.active)Object.assign(light,{age:2,position:{u:player.u,v:player.v},from:{u:player.u,v:player.v},to:{u:player.u,v:player.v},moveDuration:1e6,moveAge:0,exposure:0});return status();},init,open,close,update,draw,project,select,activate,castSkill,continueSkills,openSkills,closeSkills,handleKey,keyUp,beginMikuTurn,endMikuTurn,clearKeys(){keys.clear();SkillGamesUI.clearHeld()},get isOpen(){return opened},status,localPause,advanceStory,practice,scenery:{rocks,treeBounds:()=>props.map(p=>({x:p.x-p.image.width*1.5,y:p.y-p.image.height*3,w:p.image.width*3,h:p.image.height*3}))}};
})();
