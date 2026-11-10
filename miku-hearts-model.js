/* Deterministic story timing and paths. No minigames are attached to these branches yet. */
(()=>{
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const timing={turn:.65,approach:1.4,silence:2.2,orbit:3.5,scatter:2.5};
function slowdown(location,hero){const q=location==='heart-crossroads'?1:location==='long-road'?clamp((-hero.y-1900)/650):0;return {progress:q,gap:86+q*144,speedScale:1-q*.52};}
function heart(index,phase,age,origin){const p=HeartRoadData.branches[index],total=timing.orbit,orbitAge=phase==='scatter'?total:age,a=orbitAge*(2.7+index*.7)+index*Math.PI*2/3,r=38+Math.sin(orbitAge*4.1+index*2)*15;
 const start={x:origin.x+Math.cos(a)*r,y:origin.y-75+Math.sin(a*1.23)*25-Math.min(1,orbitAge/.65)*25};
 if(phase!=='scatter')return {...start,color:p.color,scale:.8+.2*Math.min(1,age/.4),alpha:Math.min(1,age/.25),rotation:Math.sin(a)*.15};
 const t=clamp(age/timing.scatter),q=ease(t),lift=Math.sin(t*Math.PI)*72;
 return {x:start.x+(p.target.x-start.x)*q,y:start.y+(p.target.y-start.y)*q-lift,color:p.color,scale:1,alpha:1,rotation:Math.sin(t*Math.PI*4+index)*.13};
}
const concern={start:'notice',nodes:{
 notice:{speaker:'Тето',face:'worried',text:'Мику? Ты всё дальше отстаёшь. Подожди, я подойду.',choices:[{label:'Вернуться к Мику.'}]}
}};
const unwell={start:'unwell',nodes:{
 unwell:{speaker:'Мику',face:'worried',text:'Тето... Всё плывёт. Ноги будто не мои. Я хочу идти, но... не могу.',choices:[{label:'Держись. Я рядом.',next:'help'}]},
 help:{speaker:'Тето',face:'worried',text:'Сядем здесь. Посмотри на меня. Слышишь мой голос?',choices:[{label:'Подождать ответа.'}]}
}};
const aftermath={start:'call',nodes:{
 call:{speaker:'Тето',face:'worried',text:'Мику?.. Эти сердца... Они вырвались из тебя? Мику, ответь мне!',choices:[{label:'Осторожно коснуться её плеча.',next:'silent'}]},
 silent:{speaker:'Мику',face:'hypnotized',text:'...',choices:[{label:'Мику, пожалуйста...',next:'search'}]},
 search:{speaker:'Тето',face:'worried',text:'Красное — налево. Жёлтое — прямо. Голубое — направо... Я верну их. Только дождись меня здесь.',choices:[{label:'Начать искать три сердца.'}]}
}};
const waiting={start:'waiting',nodes:{waiting:{speaker:'Тето',face:'worried',text:'Мику всё ещё не отвечает. Нужно вернуть три сердца. Я помню, по каким тропам они улетели.',choices:[{label:'Я скоро вернусь.'}]}}};
globalThis.MikuHeartsModel={timing,slowdown,heart,concern,unwell,aftermath,waiting};
})();
