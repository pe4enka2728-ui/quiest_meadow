/* Two continuous outdoor sectors beyond the tent, using the original grass and scenery. */
(()=>{
const road={id:'long-road',name:'Тропа затихших шагов',cameraY:-2700,
 perimeter:[[650,-2780],[886,-2780],[886,-2620],[1120,-2580],[1280,-2380],[1280,-2000],[1110,-1790],[886,-1760],[886,-1660],[650,-1660],[650,-1760],[420,-1800],[250,-2020],[250,-2370],[420,-2580],[650,-2620]],
 paths:[[[768,-1660],[768,-1840],[754,-2100],[778,-2350],[768,-2590],[768,-2760]]],pathWidths:[96],
 transition:{duration:1.8,northTriggerY:-1680,southTriggerY:-1770,northArrival:{x:768,y:-1870},southArrival:{x:768,y:-1540}}};
const crossroads={id:'heart-crossroads',name:'Перекрёсток трёх сердец',cameraY:-3600,
 perimeter:[[650,-3740],[886,-3740],[886,-3500],[1080,-3460],[1310,-3200],[1540,-3200],[1540,-3080],[1330,-3080],[1290,-2900],[1100,-2730],[886,-2680],[886,-2560],[650,-2560],[650,-2680],[420,-2730],[240,-2930],[220,-3080],[-4,-3080],[-4,-3200],[230,-3200],[450,-3460],[650,-3500]],
 paths:[[[768,-2570],[768,-2800],[768,-3000],[768,-3140],[768,-3490],[768,-3740]],[[-50,-3140],[240,-3140],[470,-3125],[768,-3140],[1080,-3125],[1320,-3140],[1580,-3140]]],pathWidths:[96,106],
 center:{x:768,y:-3140},triggerY:-3090,mikuRest:{x:768,y:-2985,dir:2},tetoRest:{x:685,y:-2980,dir:1},
 savePoint:{x:928,y:-2945,crystalY:-3056,base:{id:'heart-memory-base',type:'rect',x:901,y:-3007,w:54,h:33,label:'Пьедестал кристалла сердец'},arrival:{x:868,y:-2940,dir:3}},
 transition:{duration:1.8,northTriggerY:-2550,southTriggerY:-2640,northArrival:{x:768,y:-2795},southArrival:{x:768,y:-2420}}};
const rooms=[road,crossroads],minY=-3800,bushes=[],trees=[],flowers=[],stones=[];
const inside=(p,x,y)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
const inRoom=(x,y)=>rooms.some(r=>inside(r.perimeter,x,y)),inAny=(x,y)=>inRoom(x,y)||inside(CircusData.perimeter,x,y);
let seed=913719;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(const room of rooms)for(let n=0;n<room.perimeter.length;n++){
 const a=room.perimeter[n],b=room.perimeter[(n+1)%room.perimeter.length];
 if(a[1]===b[1]&&[-2780,-1660,-3740,-2560].includes(a[1])||a[0]===b[0]&&[-4,1540].includes(a[0]))continue;
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
 for(let row=0;row<2;row++)for(let i=0,count=Math.ceil(length/37);i<count;i++){
  const t=(i+row*.42)/count,x=Math.round(a[0]+dx*t+dy/length*(22+row*38)),y=Math.round(a[1]+dy*t-dx/length*(22+row*38));
  if(inAny(x,y))continue;bushes.push({id:`heart-road-bush-${room.id}-${n}-${row}-${i}`,type:'ellipse',x,y,rx:28+Math.floor(random()*8),ry:23+Math.floor(random()*5),seed:Math.floor(random()*10000),row,label:'Куст у дальней тропы'});
 }
}
for(const [x,y,kind]of [[423,-1890,'pine'],[1132,-1930,'birch'],[410,-2155,'oak'],[1130,-2200,'pine'],[485,-2440,'charred'],[1035,-2480,'oak'],[375,-2870,'birch'],[1130,-2850,'pine'],[470,-3390,'oak'],[1090,-3400,'charred'],[355,-2820,'oak'],[1190,-2860,'birch']])trees.push({id:'heart-road-tree-'+trees.length,x,y,kind,trunk:{id:'heart-road-trunk-'+trees.length,type:'rect',x:x-12,y:y-22,w:24,h:25,label:'Ствол у дальней тропы'}});
for(let i=0;i<48;i++){const side=i%2?-1:1;flowers.push({x:768+side*(83+random()*115),y:-1850-random()*720,tint:i%3});}
for(let i=0;i<78;i++){const left=i%2===0,x=left?400+random()*235:975+random()*225,y=i%4<2?-3410+random()*180:-2980+random()*200;flowers.push({x,y,tint:i%3});}
for(const [x,y]of [[600,-2030],[915,-2310],[550,-2830],[1000,-3300]])stones.push({id:'heart-road-stone-'+stones.length,type:'ellipse',x,y,rx:22,ry:13,label:'Камень у тропы'});
const branches=[{id:'red',name:'Красное сердце',color:'#ed3e46',direction:'left',target:{x:-140,y:-3140},edge:{x:70,y:-3140}},
 {id:'yellow',name:'Жёлтое сердце',color:'#f6d45d',direction:'north',target:{x:768,y:-3760},edge:{x:768,y:-3550}},
 {id:'blue',name:'Голубое сердце',color:'#62d9ed',direction:'right',target:{x:1676,y:-3140},edge:{x:1466,y:-3140}}];
const pond={x:1030,y:-2780,rx:74,ry:35},stump={x:522,y:-2875,rx:24,ry:14};
// Test the whole crown against each road, including the two paths leaving the screen.
function crownOnRoad(x,y,w,h){for(const room of rooms)for(let i=0;i<room.paths.length;i++){const path=room.paths[i],pad=room.pathWidths[i]/2+9;for(let j=1;j<path.length;j++){const a=path[j-1],b=path[j],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/12));for(let k=0;k<=n;k++){const px=a[0]+dx*k/n,py=a[1]+dy*k/n;if(px+pad>x-w/2&&px-pad<x+w/2&&py+pad>y-h&&py-pad<y+6)return true;}}}return false;}
const returnSeal={x:650,y:-1758,w:236,h:18};
function storyColliders(locked){return locked?[{id:'heart-return-seal',type:'rect',x:0,y:returnSeal.y,w:1536,h:returnSeal.h,label:'Путь к цирку закрыт до третьего сердца'}]:[];}
function branchArrival(id){return id==='red'?{x:170,y:-3140,dir:1}:id==='yellow'?{x:768,y:-3450,dir:2}:id==='blue'?{x:1366,y:-3140,dir:3}:{...crossroads.savePoint.arrival};}
globalThis.HeartRoadData={branchArrival,returnSeal,storyColliders,rooms,road,crossroads,minY,bushes,trees,flowers,stones,branches,pond,stump,inRoom,crownOnRoad,colliders:[...trees.map(t=>t.trunk),...stones,{id:'heart-pond',type:'ellipse',...pond,rx:62,ry:27,label:'Вода'}, {id:'heart-stump',type:'ellipse',...stump,label:'Пень'},crossroads.savePoint.base]};
})();
