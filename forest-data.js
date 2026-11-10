/* The forest is north of the meadow; existing meadow coordinates stay unchanged. */
(()=>{
const offsetY=-900,width=1536,height=1024,toWorld=p=>[p[0],p[1]+offsetY];
const outline=[[130,130],[380,82],[640,100],[652,40],[652,-120],[884,-120],[884,40],[1040,100],[1290,140],[1435,220],[1536,220],[1536,340],[1435,340],[1410,695],[1310,830],[910,850],[818,910],[818,1024],[718,1024],[718,910],[640,850],[205,850],[88,680],[100,340],[0,340],[0,220],[105,220]];
const perimeter=outline.map(toWorld),bushes=[];let seed=92461;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let edge=0;edge<perimeter.length;edge++){
 const a=perimeter[edge],b=perimeter[(edge+1)%perimeter.length];if((a[1]===124&&b[1]===124)||(a[1]===-1020&&b[1]===-1020)||(a[0]===0&&b[0]===0)||(a[0]===1536&&b[0]===1536))continue;const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=dy/length,ny=-dx/length;
 for(let row=0;row<2;row++){const count=Math.ceil(length/(row?45:34));for(let i=0;i<count;i++){const t=(i+(row?.4:0))/count,out=(row?51:19)+(random()-.5)*7;const bush={id:`forest-bush-${edge}-${row}-${i}`,type:'ellipse',x:Math.round(a[0]+dx*t+nx*out),y:Math.round(a[1]+dy*t+ny*out),rx:Math.round(28+random()*9),ry:Math.round(23+random()*6),seed:Math.round(random()*10000),row,label:'Лесной куст'};if(bush.y>-50&&bush.y<180){if(bush.x<768)bush.x=Math.min(bush.x,722-bush.rx);else bush.x=Math.max(bush.x,814+bush.rx)}bushes.push(bush)}}
}
const treeLayout=[[260,200,0],[450,245,2],[1080,255,1],[1270,340,3],[220,480,2],[365,570,0],[470,745,1],[1000,780,2],[1300,675,3],[1200,525,0],[650,420,1],[930,440,3],[255,755,0],[1280,205,2],[580,180,3],[1010,170,0]];
const trunkSizes=[[16,33,33,33],[18,35,38,35],[16,37,33,37],[16,35,34,35]];
const trees=treeLayout.map(([x,y,variant],i)=>{const [dx,dy,w,h]=trunkSizes[variant];return {id:`forest-tree-${i}`,x,y:y+offsetY,variant,trunk:{id:`forest-trunk-${i}`,type:'rect',x:x-dx,y:y+offsetY-dy,w,h,label:'Лесной ствол'}}});
const rocks=[[572,595,52,30],[1065,197,65,36],[250,365,46,28],[1245,705,58,32]].map(([x,y,w,h],i)=>({id:`forest-rock-${i}`,kind:'rock',type:'poly',x,y:y+offsetY,w,h,points:[[x+8,y],[x+w-9,y],[x+w,y+h-8],[x+w-7,y+h],[x+6,y+h],[x,y+h-8]].map(toWorld),label:'Замшелый камень'}));
const logs=[[292,620,110,24],[1110,365,105,24]].map(([x,y,w,h],i)=>({id:`forest-log-${i}`,kind:'log',type:'rect',x,y:y+offsetY,w,h,label:'Поваленный ствол'}));
const stones=[600,936].map((x,i)=>({id:`signal-stone-${i}`,kind:'obelisk',type:'rect',x:x-20,y:205+offsetY,w:40,h:34,visualHeight:91,label:'Камень сигнала'}));
const shrine={id:'forest-shrine',kind:'shrine',type:'rect',x:1098,y:570+offsetY,w:72,h:52,label:'Лесной кристалл памяти'};
const signs=[{id:'forest-return-sign',x:860,y:760+offsetY,w:146,h:65,boardHeight:39,text:'ПОЛЯНА ↓',label:'Указатель к поляне'}];
const colliders=[...trees.map(t=>t.trunk),...rocks,...logs,...stones,shrine,...signs.map(s=>({...s,type:'rect'}))];
const paths=[[[768,1024],[768,830],[768,690],[768,505],[768,335],[768,170],[768,-120]],[[768,745],[590,720],[490,640],[420,485],[450,405],[545,330],[768,290],[990,305],[1080,360],[1135,465],[1105,590],[1040,690],[890,730],[768,745]],[[1040,690],[1095,680],[1134,658],[1134,647]],[[0,280],[230,280],[520,280],[768,280],[1040,280],[1300,280],[1536,280]]].map(path=>path.map(toWorld));
const pathWidths=[88,78,64,88];
const enemies=[{id:'flower-1',kind:'flower',x:768,y:505+offsetY,height:128,atlas:'assets/flower-idle.png',grid:{columns:4,rows:2},state:'idle',interactionRadius:96}];
globalThis.ForestData={id:'forest',name:'Лес шёпота',width,height,offsetY,cameraY:offsetY,minY:offsetY,maxY:124,perimeter,bushes,trees,rocks,logs,stones,shrine,signs,colliders,paths,pathWidths,enemies,savePoint:{x:1134,y:647+offsetY,crystalY:533+offsetY},arena:{x:768,y:505+offsetY,radius:104},transition:{duration:1.65,northTriggerY:160,southTriggerY:96,gateLeft:728,gateRight:808,northArrival:{x:766,y:-80},southArrival:{x:766,y:305}}};
})();
