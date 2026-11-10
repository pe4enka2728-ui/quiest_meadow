/* Pause-aware meeting, prepared hypnosis sequence, battle and persistent liberation. */
(()=>{
const dialogue={start:'welcome',nodes:{
 welcome:{speaker:'Гуми',face:'neutral',text:'Вы всё-таки дошли... Я думала, сюда уже никто не придёт.',choices:[{label:'Мы ищем выход.',next:'curtain'}]},
 curtain:{speaker:'Тето',face:'neutral',text:'Ты знаешь, что за этим занавесом? И почему здесь всё движется само?',choices:[{label:'Подождать ответа.',next:'warning'}]},
 warning:{speaker:'Гуми',face:'worried',text:'Это Неру. Она видит нас через глаз над входом. Не смотрите на него слишком долго.',choices:[{label:'Ты можешь уйти с нами?',next:'signal'}]},
 signal:{speaker:'Гуми',face:'worried',text:'Я пыталась. Но стоит подойти к выходу — снова слышу сигнал. А потом руки двигаются без меня.',choices:[{label:'Мы поможем.',next:'miku'}]},
 miku:{speaker:'Мику',face:'worried',text:'Тето, посмотри: она дрожит. Гуми, не слушай сигнал. Смотри на нас.',choices:[{label:'Позвать Гуми.',next:'resist'}]},
 resist:{speaker:'Гуми',face:'worried',text:'Я слышу... вас... Если она заметит, что я рассказала, то снова... Не дайте ей...',choices:[{label:'Гуми, держись!',next:'teto'}]},
 teto:{speaker:'Тето',face:'worried',text:'Мику, отойди немного. Если появятся нити, попробуем их оборвать. Только бы не навредить Гуми.',choices:[{label:'Приготовиться.'}]}
}};
const aftermath={start:'awake',nodes:{
 awake:{speaker:'Гуми',face:'relieved',text:'Я... снова слышу свой голос. Нити больше не тянут. Спасибо вам обеим.',choices:[{label:'Теперь ты свободна.',next:'rest'}]},
 rest:{speaker:'Тето',face:'neutral',text:'Не спеши вставать. Ты можешь отдохнуть здесь — мы рядом.',choices:[{label:'Ты помнишь, откуда шёл сигнал?',next:'signal'}]},
 signal:{speaker:'Гуми',face:'worried',text:'Кажется, я поняла. Странное мигание шло из леса позади цирка. Всякий раз после вспышки сигнал становился сильнее. Возможно, там сейчас Неру.',choices:[{label:'Нужно позвать помощь.',next:'guild'}]},
 guild:{speaker:'Тето',face:'neutral',text:'Тогда вернёмся в город и расскажем гильдии. Одним нам может не справиться.',choices:[{label:'Послушать Гуми.',next:'hurry'}]},
 hurry:{speaker:'Гуми',face:'worried',text:'Нет, пожалуйста. Пока вы дойдёте до гильдии и вернётесь с помощью, Неру может сбежать. Она уже наверняка почувствовала, что нити оборвались.',choices:[{label:'Ты уверена насчёт леса?',next:'back-way'}]},
 'back-way':{speaker:'Гуми',face:'neutral',text:'За занавесом есть задний выход. Оттуда видны деревья и эти вспышки. Если хотите застать её, проверьте лес сейчас. Только держитесь вместе.',choices:[{label:'Хорошо. Пойдём осторожно.',next:'gift'}]},
 gift:{speaker:'Гуми',face:'happy',text:'Возьмите мою волшебную палочку. Она сохранила немного моего волшебства. Хочу, чтобы оно помогло вам.',choices:[{label:'Ты уверена? Она ведь твоя.',next:'promise'}]},
 promise:{speaker:'Гуми',face:'relieved',text:'Теперь она нужнее вам. Пусть напомнит: даже самые тугие нити можно оборвать.',choices:[{label:'Мы будем её беречь.',next:'miku'}]},
 miku:{speaker:'Мику',face:'happy',text:'Спасибо, Гуми. Отдохни здесь. Мы проверим лес и обязательно вернёмся.',choices:[{label:'Попрощаться.',next:'warning'}]},
 warning:{speaker:'Гуми',face:'worried',text:'И ещё... не верьте знакомым голосам из леса. Неру умеет повторять их. Идите за миганием, но не выпускайте друг друга из виду.',choices:[{label:'Спасибо. Мы запомним.'}]}
}};
let api={},phase='idle',age=0,defeated=false;
const active=()=>phase!=='idle',ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
function persist(){try{localStorage.setItem('smile-gumi-v1',JSON.stringify(defeated))}catch{}}
function grantGift(){if(!api.hasWand?.())api.grantWand?.();}
function restore(value=false){phase='idle';age=0;defeated=value===true;if(defeated)grantGift();globalThis.CurtainProgress?.restore(defeated);persist();document.querySelector('#world-inventory')?.classList.remove('reward-pulse');api.lock?.(false);}
function init(callbacks){api=callbacks;let saved=false;try{saved=JSON.parse(localStorage.getItem('smile-gumi-v1')||'false')}catch{};restore(saved);}
function finish(){phase='idle';age=0;if(defeated)globalThis.CurtainProgress?.open();document.querySelector('#world-inventory')?.classList.remove('reward-pulse');api.lock(false);}
function openDialogue(graph,next){phase='dialogue';age=0;api.lock(true);DialogueUI.open(graph,{allowCancel:false,onDone(result){if(phase!=='dialogue'||!result.completed)return;if(next==='finish')finish();else{phase=next;age=0;}}});}
function interact(){if(active())return;if(defeated){openDialogue({start:'rest',nodes:{rest:{speaker:'Гуми',face:'relieved',text:'Я отдохну здесь. Мигание шло из леса позади цирка — там может быть Неру. Не тратьте время на поиски помощи: она успеет уйти. Берегите друг друга.',choices:[{label:'Отдохни, Гуми.'}]}}},'finish');return;}openDialogue(dialogue,'hypnosis');}
function cancel(){const had=active();phase='idle';age=0;if(defeated)grantGift();if(had&&DialogueUI.isOpen)DialogueUI.close(false);document.querySelector('#world-inventory')?.classList.remove('reward-pulse');api.lock?.(false);}
function startBattle(){phase='battle';age=0;api.battle();}
function onBattleFinished(result){if(result.encounter!=='gumi'||result.outcome!=='victory')return false;defeated=true;persist();phase='recovery';age=0;api.returnToWorld('victory');api.lock(true);return true;}
function update(dt){if(!active()||phase==='battle'||phase==='dialogue')return;age+=dt;if(phase==='hypnosis'&&age>=12){phase='battle-in';age=0;}else if(phase==='battle-in'&&age>=.55)startBattle();else if(phase==='recovery'&&age>=.9)openDialogue(aftermath,'gift');else if(phase==='gift'&&age>=GumiGift.duration){grantGift();phase='gift-settle';age=0;document.querySelector('#world-inventory')?.classList.add('reward-pulse');api.notify('Волшебная палочка добавлена в «Способности».',4);}else if(phase==='gift-settle'&&age>=.45)finish();}
function draw(g,cameraY=0){if(['hypnosis','battle-in'].includes(phase)){g.save();g.fillStyle='#030711ad';g.fillRect(0,0,1536,1024);const t=phase==='hypnosis'?age:12;GumiPoseV2.drawAt(g,768,650,3,t,'hypnosis');g.textAlign='center';g.font='27px QuietMeadowPixel';g.fillStyle='#fff1cf';const line=t<2.8?'Гуми пытается заглушить сигнал.':t<4.8?'Её взгляд темнеет.':t<8?'Гуми больше не слышит вас.':t<9.4?'Сверху спускаются нити...':'Нити поднимают Гуми над манежем.';g.fillText(line,768,750);if(GameSettings.extraHints){g.font='18px QuietMeadowPixel';g.fillStyle='#acb6bf';g.fillText('Esc — пауза',768,810);}if(phase==='battle-in'){g.fillStyle=`rgba(3,7,17,${ease(age/.55)})`;g.fillRect(0,0,1536,1024);}g.restore();}else if(phase==='recovery'){g.save();g.fillStyle=`rgba(3,7,17,${1-ease(age/.8)})`;g.fillRect(0,0,1536,1024);g.restore();}else if(phase==='gift'){GumiGift.draw(g,age,{x:InteriorData.arena.gumi.x,y:InteriorData.arena.gumi.y-cameraY-65},api.inventoryTarget());}}
globalThis.GumiEncounter={init,restore,interact,cancel,update,draw,onBattleFinished,dialogue,aftermath,get isActive(){return active()},get hidesNPC(){return ['hypnosis','battle-in'].includes(phase)},get defeated(){return defeated},status(){return {active:active(),phase,age,defeated,wandClaimed:!!api.hasWand?.(),hypnosis:['hypnosis','battle-in'].includes(phase)?GumiPoseV2.state(phase==='hypnosis'?age:12,'hypnosis'):null};}};
})();
