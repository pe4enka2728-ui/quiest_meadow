/* Silent laughter, ordered disappearance, then a fall into the monochrome arena. */
(()=>{
'use strict';
let api={},model=null,token=0,images={};
function cancel(){if(!model)return;const owned=model.phase==='question';token++;model=null;if(owned&&DialogueUI.isOpen)DialogueUI.close(false);api.lock?.(false);}
function begin(){if(model||HeartQuest.count<3)return false;token++;model=new MikuRuptureModel.Sequence();api.lock?.(true);return true;}
function update(dt){if(!model)return;const event=model.update(dt);if(event==='question'){const expected=token;DialogueUI.open({start:'what',nodes:{what:{speaker:'Тето',face:'surprised',text:'Что происходит...',choices:[{label:'Оглядеться.'}]}}},{allowCancel:false,onDone(r){if(expected===token&&model&&r.completed)model.continue();}});}else if(event==='arena'){model=null;api.lock?.(false);api.battle?.();}}
function opacity(group){return model?model.opacity(group):1;}
function laughOffset(seed){if(!model?.laughing)return {x:0,y:0};const t=model.clock;return {x:Math.sin(t*27+seed)*1.2+Math.sin(t*39+seed*3)*.6,y:-Math.abs(Math.sin(t*20+seed))*2.6};}
function draw(g){if(!model)return;const s=model.status();if(s.phase==='world'){g.save();g.fillStyle='#000';g.globalAlpha=1-s.opacity.world;g.fillRect(0,0,1536,1024);g.restore();}if(s.phase!=='fall')return;const f=s.fall;g.save();g.fillStyle='#000';g.fillRect(0,0,1536,1024);g.imageSmoothingEnabled=false;
 for(let i=0;i<22;i++){let x=44+(i*137)%1450;if(x>670&&x<866)x+=205;const length=90+i%5*33,y=((i*179-model.age*(410+i%4*55))%(1264+length)+(1264+length))%(1264+length)-length;g.globalAlpha=(.22+i%4*.16)*f.wind;g.fillStyle='#fff';g.fillRect(x,y,2+i%2,length);}
 g.globalAlpha=1;g.translate(f.x,f.y);g.rotate(f.rotation);const im=ActorSpriteArt.clean(images.teto_2_7);g.drawImage(im,-42,-56,84,112);g.restore();}
globalThis.MikuRupture={init(callbacks,textures){api=callbacks;images=textures;},begin,cancel,update,draw,opacity,laughOffset,get isActive(){return !!model;},status(){return model?{active:true,...model.status()}:{active:false,phase:'idle',laughing:false,opacity:{vegetation:1,decor:1,echoes:1,world:1},fall:null};}};
})();
