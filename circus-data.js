/* The third clearing shares the northern forest corridor and locked iron gate. */
(()=>{
const offsetY=-1800,toWorld=([x,y])=>[x,y+offsetY];
const perimeter=[[180,160],[425,95],[652,95],[652,-80],[884,-80],[884,95],[1185,105],[1380,220],[1435,600],[1310,865],[930,900],[884,940],[884,1120],[652,1120],[652,940],[600,900],[205,865],[90,600],[110,315]].map(toWorld);
function inside(poly,x,y){let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])result=!result}return result}
let seed=76151;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296},bushes=[];
for(let edge=0;edge<perimeter.length;edge++){
 const a=perimeter[edge],b=perimeter[(edge+1)%perimeter.length];if(a[1]===b[1]&&[-680,-1880].includes(a[1]))continue;
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
 for(let row=0;row<2;row++)for(let i=0,count=Math.ceil(length/(row?45:34));i<count;i++){
  const t=(i+(row?.4:0))/count,out=row?51:20,x=Math.round(a[0]+dx*t+dy/length*out),y=Math.round(a[1]+dy*t-dx/length*out);
  if(inside(ForestData.perimeter,x,y))continue;
  bushes.push({id:`circus-bush-${edge}-${row}-${i}`,type:'ellipse',x,y,rx:28+Math.floor(random()*8),ry:23+Math.floor(random()*6),seed:Math.floor(random()*10000),row,label:'Куст у цирковой поляны'});
 }
}
const trees=[[230,410,'pine'],[260,720,'oak'],[380,820,'birch'],[1250,735,'oak'],[1330,465,'pine'],[1170,240,'birch'],[360,230,'pine']].map(([x,y,kind],i)=>({id:'circus-tree-'+i,x,y:y+offsetY,kind,trunk:{id:'circus-trunk-'+i,type:'rect',x:x-13,y:y+offsetY-22,w:26,h:25,label:'Ствол у цирка'}}));
// Solid hedge banks join the tent walls to the perimeter; the rear road is visible, not reachable around the canvas.
for(const [bank,points] of [['west',[[100,-1300],[220,-1280],[350,-1260],[446,-1210]]],['east',[[1080,-1164],[1160,-1200],[1310,-1250],[1430,-1300]]]])for(let n=0;n<points.length-1;n++){
 const a=points[n],b=points[n+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let row=0;row<2;row++)for(let i=0,count=Math.ceil(length/27);i<=count;i++){
  const t=i/count;bushes.push({id:`tent-bank-${bank}-${n}-${row}-${i}`,type:'ellipse',x:Math.round(a[0]+(b[0]-a[0])*t),y:Math.round(a[1]+(b[1]-a[1])*t-row*31),rx:32,ry:27,seed:200+n*71+i*17+row*3,row,label:'Густой куст у шатра'});
 }
}
const tent={id:'big-top',x:768,y:-1044,width:936,height:678,originX:468,originY:636,depth:-1044,
 ground:{x:768,y:-1179,rx:384,ry:148},
 rect:{id:'tent-footprint',type:'ellipse',x:768,y:-1179,rx:372,ry:135,label:'Полотно циркового шатра'},
 entrance:{x:768,y:-1000,range:100,thresholdY:-1012,halfWidth:42,clipTop:-1128,planeY:-1032},doorInside:{x:768,y:-1048},rearDoor:{x:768,y:-1335,triggerY:-1384,halfWidth:28,approach:{x:768,y:-1430},arrival:{teto:{x:768,y:-1475,dir:0},miku:{x:824,y:-1430,dir:0}}},eye:{x:768,y:-1173},
 outsideArrival:{teto:{x:768,y:-960,dir:2},miku:{x:824,y:-1000,dir:2}}};

const rearDoorColliders=[{id:'rear-tent-frame-left',type:'rect',x:708,y:-1398,w:24,h:84,label:'Левый косяк заднего выхода'},{id:'rear-tent-frame-right',type:'rect',x:804,y:-1398,w:24,h:84,label:'Правый косяк заднего выхода'},{id:'rear-tent-door-back',type:'rect',x:732,y:-1351,w:72,h:39,label:'Задняя стенка шатра'}];
const props=[{id:'circus-crates-left',type:'rect',x:456,y:-1065,w:72,h:42,label:'Ящики цирка'},{id:'circus-crates-right',type:'rect',x:1030,y:-1060,w:68,h:40,label:'Ящики цирка'}];
const paths=[[[768,1120],[768,970],[768,820],[768,765]],[[768,815],[570,820],[440,740],[420,650]],[[768,815],[965,820],[1100,735],[1120,650]],[[768,55],[768,160],[768,300],[768,390]]].map(p=>p.map(toWorld));
globalThis.CircusData={id:'circus',name:'Цирковая поляна',offsetY,cameraY:offsetY,minY:offsetY,maxY:-680,perimeter,bushes,trees,tent,props,paths,pathWidths:[112,76,76,88],colliders:[...trees.map(t=>t.trunk),tent.rect,...props,...rearDoorColliders],transition:{duration:1.8,northTriggerY:-752,southTriggerY:-820,left:696,right:840,northArrival:{x:768,y:-960},southArrival:{x:768,y:-650}}};
})();
