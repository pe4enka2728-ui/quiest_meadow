/* A chapter is selectable only after its current-playthrough milestone is complete. */
(()=>{
const definitions=[
 {id:'awakening',title:'Поляна памяти',subtitle:'Тето и Мику находят дорогу.',tile:0,requirement:'Заверши вступительный разговор.',location:'meadow',teto:{x:766,y:810,dir:0},miku:{x:823,y:855,dir:0}},
 {id:'flower',title:'Чужая улыбка',subtitle:'Цветок, который слышит сигнал.',tile:1,requirement:'Победи цветок и забери золотой ключ.',location:'forest',teto:{x:730,y:-310,dir:0},miku:{x:820,y:-310,dir:0}},
 {id:'big-top',title:'Под куполом',subtitle:'Золотой билет и следящий глаз.',tile:2,requirement:'Войди в шатёр и дойди до арены.',location:'circus',teto:{x:768,y:-960,dir:0},miku:{x:824,y:-1000,dir:0}},
 {id:'gumi',title:'Зелёный занавес',subtitle:'Тето и Мику обрывают кукольные нити.',tile:3,requirement:'Освободи Гуми от гипноза.',location:'tent-arena',teto:{x:768,y:-2915,dir:0},miku:{x:768,y:-2829,dir:0}},
 {id:'miku-hypnosis',title:'Мику?',subtitle:'Три сердца и чужой взгляд.',tile:5,children:true,requirement:'Дойди до перекрёстка и увидь, куда улетят сердца.',location:null},
 {id:'neru',title:'Последний взгляд',subtitle:'Нить ведёт к Неру.',tile:4,requirement:'Пройди через портал после освобождения Мику.',location:'cloud-island',teto:{x:700,y:740,dir:0},miku:{x:816,y:768,dir:0}}
];
function completed(id,s){const f=s?.flags||{};return id==='awakening'?f.introSeen===true:id==='flower'?f.flowerDefeated===true&&!!s?.wallet?.inventory?.['golden-key']:id==='big-top'?f.tentEntered===true&&f.gateOpened===true&&!!s?.wallet?.inventory?.['golden-key']:id==='gumi'?f.gumiDefeated===true:id==='miku-hypnosis'?f.mikuHeartsReleased===true:id==='neru'?f.cloudReached===true:false}
function list(s){return definitions.map(d=>({...d,completed:completed(d.id,s),locked:globalThis.HeartQuestModel?.travelLocked(s)||!completed(d.id,s),mystery:d.children&&!completed(d.id,s)}))}
function destination(id,s){if(globalThis.HeartQuestModel?.travelLocked(s))return null;const child=globalThis.HeartQuestModel?.definitions.find(d=>d.id===id);if(child)return s.flags?.mikuHeartsReleased&&s.flags[child.flag]?HeartQuestModel.entry(s,id):null;const d=definitions.find(d=>d.id===id);if(!d||!completed(id,s)||!d.location)return null;const apart=s.flags?.mikuHeartsReleased&&!s.flags?.mikuRecovered&&globalThis.HeartRoadData,m=apart?HeartRoadData.crossroads.mikuRest:d.miku;const result={...JSON.parse(JSON.stringify(s)),location:d.location,teto:{...d.teto},miku:{...m},trail:apart?[{x:d.teto.x,y:d.teto.y}]:[{x:m.x,y:m.y},{x:d.teto.x,y:d.teto.y}]};delete result.activity;return result;}
globalThis.ChapterModel={definitions,completed,list,destination,children:s=>HeartQuestModel.children(s).map(c=>({...c,locked:HeartQuestModel.travelLocked(s)||c.locked,requirement:HeartQuestModel.travelLocked(s)?HeartQuestModel.travelMessage:c.requirement}))};
})();
