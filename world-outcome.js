/* Return to the field, the key conversation and a pause-aware pickup flight. */
(()=>{
const dialogue={start:'glint',nodes:{
 glint:{speaker:'Мику',face:'worried',text:'Он больше не двигается... Тето, посмотри: под его телом что-то блестит.',choices:[{label:'Осторожно отодвинуть стебель.',next:'key'}]},
 key:{speaker:'Тето',face:'neutral',text:'Ключ. Золотой... Почему он был под этим цветком?',choices:[{label:'Рассмотреть ключ.',next:'lock'}]},
 lock:{speaker:'Мику',face:'surprised',text:'На нём вырезана спираль. Может быть, он открывает какой-то замок? Здесь ведь должна быть дорога дальше.',choices:[{label:'Нужно его сохранить.',next:'take'}]},
 take:{speaker:'Тето',face:'neutral',text:'Заберу его с собой. Если найдём запертую дверь, проверим, подойдёт ли он.',choices:[{label:'Взять золотой ключ.',next:'together'}]},
 together:{speaker:'Мику',face:'happy',text:'Только давай больше не расходиться. Кто знает, что ждёт за этой дверью.',choices:[{label:'Хорошо. Идём вместе.'}]}
}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n)};
let api={},active=false,phase='idle',age=0,outcome=null,defeated=false,claimed=false,revealed=false,keyIcon=null;
function init(callbacks){api=callbacks;keyIcon=PixelUI.icon('key');restore(!!api.hasKey())}
function restore(hasKey){active=false;phase='idle';age=0;outcome=null;defeated=claimed=!!hasKey;revealed=false;document.querySelector('#world-inventory')?.classList.remove('reward-pulse');api.setLocked?.(false)}
function start(result){outcome=result.outcome;active=true;phase='return';age=0;revealed=false;if(outcome==='victory')defeated=true;api.setLocked(true);api.returnToWorld(outcome)}
function grant(){api.grantKey();claimed=true;defeated=true;api.notify('Золотой ключ добавлен в инвентарь.',4)}
function cancel(complete=false){const reward=active&&outcome==='victory'&&!claimed;active=false;phase='idle';if(complete&&reward)grant();revealed=false;document.querySelector('#world-inventory')?.classList.remove('reward-pulse');api.setLocked?.(false)}
function update(dt){
 if(!active)return;age+=dt;api.updateCamera?.(dt);
 if(phase==='return'&&age>=1.25){
  if(outcome==='defeat'){active=false;phase='idle';api.setLocked(false);api.notify('Мику помогла Тето вернуться на поляну.',4);return}
  phase='dialogue';age=0;DialogueUI.open(dialogue,{allowCancel:false,onLine(node){if(node===dialogue.nodes.key)revealed=true},onDone(){if(!active||phase!=='dialogue')return;phase='pickup';age=0;revealed=true}});
 }else if(phase==='pickup'&&age>=2.1){grant();phase='finish';age=0;document.querySelector('#world-inventory').classList.add('reward-pulse')}
 else if(phase==='finish'&&age>=.6){active=false;phase='idle';revealed=false;api.setLocked(false);document.querySelector('#world-inventory').classList.remove('reward-pulse')}
}
function draw(ctx,cameraY){
 if(!active)return;
 if(phase==='return'){ctx.save();ctx.globalAlpha=1-ease(age/.8);ctx.fillStyle='#030806';ctx.fillRect(0,0,1536,1024);ctx.restore()}
 if(!revealed||claimed||!['dialogue','pickup'].includes(phase))return;
 const enemy=api.enemy(),start={x:enemy.x+25,y:enemy.y-cameraY-9};let x=start.x,y=start.y,size=48,angle=0;
 if(phase==='dialogue')y+=Math.sin(age*3)*3;
 else if(age<.85){const t=ease(age/.85);x=start.x+(768-start.x)*t;y=start.y+(405-start.y)*t-Math.sin(t*Math.PI)*50;size=48+48*t;angle=Math.sin(t*Math.PI)*.3}
 else {const t=ease((age-.85)/1.25),target=api.inventoryTarget();x=768+(target.x-768)*t;y=405+(target.y-405)*t-Math.sin(t*Math.PI)*100;size=96-70*t;angle=t*Math.PI*.8}
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.imageSmoothingEnabled=false;
 for(let i=0;i<6;i++){const a=i*Math.PI/3+age*.9,r=size*.65;ctx.globalAlpha=.4+.4*Math.sin(age*4+i);ctx.fillStyle=i%2?'#ffe9a5':'#e8b84f';ctx.fillRect(Math.round(Math.cos(a)*r/3)*3,Math.round(Math.sin(a)*r/3)*3,3,3)}
 ctx.globalAlpha=1;ctx.drawImage(keyIcon,-size/2,-size/2,size,size);ctx.restore();
 if(phase==='pickup'&&age<.85){ctx.save();ctx.font='24px QuietMeadowPixel';ctx.fillStyle='#fff0b7';ctx.textAlign='center';ctx.fillText('Золотой ключ',768,490);ctx.restore()}
}
globalThis.WorldOutcome={init,start,restore,cancel,update,draw,dialogue,get isActive(){return active},get flowerDefeated(){return defeated},get keyRevealed(){return revealed},status(){return {active,phase,age,outcome,flowerDefeated:defeated,keyClaimed:claimed,keyRevealed:revealed}}};
})();
