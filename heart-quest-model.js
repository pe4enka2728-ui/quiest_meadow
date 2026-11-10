/* Chapter five is a milestone; its four memories keep independent completion flags. */
(()=>{
'use strict';
const definitions=[
 {id:'red',title:'Пульс',subtitle:'Красное сердце · ущелье пульса',color:'#ee5366',flag:'heartRedWon'},
 {id:'yellow',title:'Верная память',subtitle:'Жёлтое сердце · скалы воспоминаний',color:'#f1d16a',flag:'heartYellowWon'},
 {id:'blue',title:'Украденный голос',subtitle:'Голубое сердце · стрелки в такт',color:'#73d9ed',flag:'heartBlueWon'},
 {id:'miku-boss',title:'Босс Мику',subtitle:'Три сердца собраны. Бой в пустоте.',color:'#86eee5',flag:'mikuBossDefeated'}
];
const flags=['heartRedWon','heartYellowWon','heartBlueWon','mikuBossDefeated','heartRedUnlocked','heartYellowUnlocked','heartBlueUnlocked','mikuBattleReached','mikuRecovered','cloudReached','neruMet','neruBattleReached','neruDefeated'];
function read(source={}){const f=source.flags||source;const result=Object.fromEntries(flags.map(k=>[k,f[k]===true]));for(let i=0;i<3;i++){const k=['heartRedUnlocked','heartYellowUnlocked','heartBlueUnlocked'][i];result[k]=result[k]||result[definitions[i].flag];}return result;}
function count(source){const f=read(source);return definitions.slice(0,3).filter(d=>f[d.flag]).length;}
const unlockedFlags=['heartRedUnlocked','heartYellowUnlocked','heartBlueUnlocked'];
const travelMessage='Сначала верни все три сердца. Телепорт временно недоступен.';
function travelLocked(source){const n=typeof source==='number'?source:count(source);return n>0&&n<3;}
function children(s,developer=false){const f=read(s);return definitions.map(d=>({...d,completed:f[d.flag],locked:!developer&&!f[d.flag],mystery:!developer&&!f[d.flag]}));}
function entry(snapshot,id){if(!definitions.some(d=>d.id===id))return null;if(id!=='miku-boss'&&globalThis.HeartTrialsData)return HeartTrialsData.entrySnapshot(snapshot,id);const s=JSON.parse(JSON.stringify(snapshot)),d=HeartRoadData.crossroads;s.location=d.id;s.teto={...d.savePoint.arrival};s.miku={...d.mikuRest};s.trail=[{x:s.teto.x,y:s.teto.y}];if(id==='miku-boss'){s.flags={...s.flags,mikuBossDefeated:false,mikuRecovered:false,cloudReached:false,neruMet:false,neruBattleReached:false,neruDefeated:false};}s.activity={type:id==='miku-boss'?(s.flags?.mikuBattleReached?'miku-void':'miku-before-battle'):'heart-minigame',id};return s;}
globalThis.HeartQuestModel={definitions,flags,unlockedFlags,read,count,travelLocked,travelMessage,children,entry};
})();
