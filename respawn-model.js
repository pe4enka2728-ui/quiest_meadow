/* Distances traverse real room portals rather than comparing unrelated indoor/outdoor Y. */
(()=>{
const checkpoints=[
 {id:'meadow-memory',location:'meadow',name:'Кристалл поляны',point:{x:1160,y:583},teto:{x:1130,y:610,dir:1},miku:{x:1200,y:650,dir:3}},
 {id:'forest-memory',location:'forest',name:'Лесной кристалл',point:{x:1134,y:-253},teto:{x:1134,y:-225,dir:1},miku:{x:1194,y:-170,dir:3}},
 {id:'hall-memory',location:'tent-hall',name:'Кристалл шатра',point:{x:948,y:-2175},teto:{x:948,y:-2175,dir:1},miku:{x:1008,y:-2125,dir:3}},
 {id:'heart-memory',location:'heart-crossroads',name:'Кристалл трёх сердец',point:{x:928,y:-2945},teto:{x:868,y:-2940,dir:3},miku:{x:768,y:-2985,dir:2}}
];
function nearest(location,hero,flags={}){
 const edges=[...(globalThis.HeartRoadData?[['circus',{x:768,y:-1680},'long-road',{x:768,y:-1770},90],['long-road',{x:768,y:-2550},'heart-crossroads',{x:768,y:-2640},90]]:[]),['meadow',{x:768,y:130},'forest',{x:768,y:90},40],...(flags.gateOpened?[['forest',{x:768,y:-750},'circus',{x:768,y:-820},70]]:[]),...((flags.tentEntered||location.startsWith('tent-'))?[['circus',{x:768,y:-1000},'tent-hall',{x:768,y:-1850},80]]:[]),['tent-hall',{x:768,y:-2630},'tent-arena',{x:768,y:-2780},150]];
 const eligible=checkpoints.filter(p=>(p.location!=='tent-hall'||flags.tentEntered||location.startsWith('tent-'))&&(p.location!=='heart-crossroads'||flags.mikuHeartsReleased)),nodes=[{location,point:{...hero}},...eligible.map(p=>({location:p.location,point:p.point,checkpoint:p}))],bridges=[];
 for(const [a,pa,b,pb,cost]of edges){const first=nodes.length;nodes.push({location:a,point:pa},{location:b,point:pb});bridges.push([first,first+1,cost]);}
 const distances=nodes.map(()=>Infinity),used=new Set();distances[0]=0;
 for(let k=0;k<nodes.length;k++){let index=-1;for(let i=0;i<nodes.length;i++)if(!used.has(i)&&(index<0||distances[i]<distances[index]))index=i;if(index<0||!Number.isFinite(distances[index]))break;used.add(index);const a=nodes[index];for(let i=0;i<nodes.length;i++){const b=nodes[i];if(a.location===b.location)distances[i]=Math.min(distances[i],distances[index]+Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y));}for(const [a,b,cost]of bridges){if(index===a)distances[b]=Math.min(distances[b],distances[index]+cost);if(index===b)distances[a]=Math.min(distances[a],distances[index]+cost);}}
 let best=1;for(let i=2;i<=eligible.length;i++)if(distances[i]<distances[best])best=i;const p=nodes[best]?.checkpoint||checkpoints[0];return {...p,point:{...p.point},teto:{...p.teto},miku:{...p.miku},distance:distances[best]};
}
const dialogue={start:'nightmare',nodes:{
 nightmare:{speaker:'Тето',face:'worried',text:'Мику... Мне только что показался какой-то кошмар. Всё было таким настоящим. А потом — темнота...',choices:[{label:'Посмотреть на Мику.',next:'here'}]},
 here:{speaker:'Мику',face:'worried',text:'Тето, это я. Мы у кристалла, мы вместе. Посмотри на меня и сделай вдох. Я рядом.',choices:[{label:'Ты не исчезла...',next:'calm'}]},
 calm:{speaker:'Мику',face:'happy',text:'И не собираюсь. Давай немного постоим. Этот кошмар закончился — а наша дорога ещё нет.',choices:[{label:'Мне уже спокойнее.',next:'continue'}]},
 continue:{speaker:'Тето',face:'happy',text:'Хорошо. Пойдём дальше. Только давай держаться рядом.',choices:[{label:'Продолжить путь.'}]}
}};
globalThis.RespawnModel={checkpoints,nearest,dialogue};
})();
