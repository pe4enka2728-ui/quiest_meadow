/* Portable, deterministic scene data. Coordinates are pixels, origin upper-left. */
(()=>{
const perimeter=[[90,225],[600,225],[610,265],[695,265],[718,240],[718,65],[818,65],[818,240],[870,265],[890,225],[1310,225],[1310,165],[1445,165],[1445,440],[1390,440],[1390,515],[1475,515],[1475,890],[1000,890],[1000,935],[960,935],[960,1060],[650,1060],[650,935],[505,935],[505,890],[55,890],[55,510],[147,510],[147,420],[80,420],[80,225]];
let seed=3721;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const bushes=[];
for(let edge=0;edge<perimeter.length;edge++){
 const a=perimeter[edge],b=perimeter[(edge+1)%perimeter.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=dy/length,ny=-dx/length;
 for(let row=0;row<2;row++){const count=Math.ceil(length/(row?43:32));for(let i=0;i<count;i++){const t=(i+(row?.45:0))/count,out=(row?52:18)+(random()-.5)*7;
  bushes.push({id:`bush-${edge}-${row}-${i}`,type:'ellipse',x:Math.round(a[0]+dx*t+nx*out),y:Math.round(a[1]+dy*t+ny*out),rx:Math.round(28+random()*10),ry:Math.round(22+random()*7),seed:Math.round(random()*10000),row,label:'Куст'});
 }}
}
// Keep the gate approach clear of hedge lobes; visuals and colliders share these centers.
for(let i=bushes.length-1;i>=0;i--)if(bushes[i].id.startsWith('bush-5-'))bushes.splice(i,1);
for(const bush of bushes){if(bush.y<85||bush.y>275)continue;if(bush.x>650&&bush.x<768)bush.x=Math.min(bush.x,722-bush.rx);else if(bush.x>768&&bush.x<886)bush.x=Math.max(bush.x,814+bush.rx)}
const signs={shop:{id:'shop-sign',x:462,y:364,w:156,h:82,boardHeight:47,text:'МАГАЗИН',label:'Табличка магазина'},save:{id:'save-sign',x:1074,y:491,w:176,h:66,boardHeight:47,text:'СОХРАНИТЬ',label:'Табличка сохранения'},help:{id:'help-sign',x:875,y:430,w:70,h:61,boardHeight:34,text:'',label:'Загадочная табличка'}};
const postOutline=[[4,0],[32,0],[32,14],[28,14],[28,110],[36,110],[36,130],[0,130],[0,110],[8,110],[8,14],[4,14]];
const posts=[{id:'arch-left',x:690,label:'Левая опора арки'},{id:'arch-right',x:810,label:'Правая опора арки'}].map(p=>({...p,type:'poly',y:122,w:36,h:130,points:postOutline.map(([x,y])=>[p.x+x,122+y])}));
globalThis.LevelData={schemaVersion:1,version:'0.59',width:1536,height:1024,pixelsPerUnit:32,coordinateSystem:'x right, y down; coordinates in pixels; northern room uses negative y',perimeter,bushes,signs,posts,arch:{x:768,y:104,radius:32,speed:.62,beam:{springY:132,outerRadius:78,innerRadius:54},ground:{x:724,y:0,w:88,h:252},overhead:true},spawn:{teto:{x:766,y:810},miku:{x:823,y:855}},helpTrigger:{x:910,y:483,radius:103,resetRadius:145}};
})();
