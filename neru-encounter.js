/* A cancellable dialogue and awakening gate; the battle owns its own clock. */
(()=>{
'use strict';let api={},phase='idle',age=0,clock=0,token=0;
function cancel(){const was=isActive();token++;phase='idle';age=clock=0;if(was&&DialogueUI.isOpen)DialogueUI.close(false);if(was)api.lock?.(false);}
function isActive(){return ['talk','awakening','resume-battle'].includes(phase);}
function startBattle(){phase='battle';age=0;api.lock?.(false);api.flag?.('neruMet');api.flag?.('neruBattleReached');api.battle?.({skyAge:clock});api.save?.('Неру · вход на арену');}
function talk(){const id=token;DialogueUI.open(NeruSceneModel.dialogue,{allowCancel:false,onDone(r){if(id!==token||phase!=='talk')return;if(r.completed){api.flag?.('neruMet');phase='awakening';age=0;}}});}
function begin(){if(isActive()||globalThis.BattleUI?.isOpen)return false;cancel();phase='talk';api.lock?.(true);talk();return true;}
function update(dt){if(!isActive())return;if(phase==='resume-battle'){startBattle();return;}if(phase==='talk'&&!DialogueUI.isOpen)talk();age+=dt;clock+=dt;if(phase==='awakening'&&age>=NeruSceneModel.settings.entryDuration)startBattle();}
function draw(g){if(phase!=='awakening')return;const q=NeruSceneModel.ease((age-1.75)/.85);if(q<=0)return;g.save();g.globalAlpha=q;g.fillStyle='#101426';g.fillRect(0,0,1536,1024);g.restore();}
function resume(){cancel();clock=3;startBattle();}
function suspend(){if(phase==='battle')phase='resume-battle';}
function finished(result){if(result.encounter!=='neru')return false;phase='idle';age=clock=0;if(result.outcome==='victory')api.flag?.('neruDefeated');api.returnToCloud?.();api.lock?.(false);api.save?.(result.outcome==='victory'?'Тихая высь · после поединка':'Тихая высь · возвращение');return true;}
globalThis.NeruEncounter={init(callbacks){api=callbacks;},begin,cancel,resume,suspend,update,draw,finished,get isActive(){return isActive();},status(){return {phase,age,clock,skyActive:phase!=='idle',night:phase==='idle'?0:NeruSceneModel.sky(clock).night,modelBlend:phase==='awakening'?NeruSceneModel.ease((age-.35)/1.2):0};}};
})();
