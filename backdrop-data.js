/* Scenery beyond both hedges. These objects never change the walkable floor. */
(()=>{
const top=globalThis.HeartRoadData?.minY??-1900,bottom=1160;
function inside(poly,x,y){let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])result=!result}return result}
const inRoom=(x,y)=>inside(LevelData.perimeter,x,y)||inside(ForestData.perimeter,x,y)||inside(CircusData.perimeter,x,y)||(globalThis.HeartRoadData?.inRoom(x,y)||false);
const waterfalls=[{id:'western-waterfall',x:288,poolY:141,size:1,pixelHeight:144}];
const fences=[{id:'silver-west',x1:450,x2:690,y:174,height:87},{id:'silver-east',x1:846,x2:1086,y:174,height:87}];
const flowers=[{x:535,y:84,rx:84,ry:35,palette:'violet'},{x:940,y:65,rx:75,ry:33,palette:'pink'},{x:1335,y:88,rx:65,ry:29,palette:'white'},{x:76,y:935,rx:75,ry:35,palette:'yellow'},{x:1380,y:966,rx:95,ry:35,palette:'violet'},{x:332,y:-855,rx:120,ry:29,palette:'white'},{x:1240,y:-835,rx:110,ry:32,palette:'pink'},{x:45,y:-410,rx:60,ry:100,palette:'violet'},{x:1468,y:-265,rx:64,ry:95,palette:'yellow'}];
const charredTrees=[{id:'charred-east',x:1126,y:98,scale:1.14},{id:'charred-forest',x:1484,y:-517,scale:.9}];
const stones=[{x:100,y:88,w:50,h:28},{x:608,y:38,w:48,h:25},{x:1015,y:112,w:64,h:33},{x:1324,y:9,w:56,h:31},{x:1380,y:947,w:55,h:32},{x:80,y:-720,w:50,h:30},{x:1465,y:-690,w:60,h:35},{x:478,y:-865,w:52,h:25}];
let seed=290118;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const trees=[],shrubs=[];
function reserved(x,y){return (x>90&&x<465&&y>-110&&y<210)||(x>665&&x<870&&y>-30&&y<300)||flowers.some(f=>Math.hypot((x-f.x)/f.rx,(y-f.y)/f.ry)<1.1)||charredTrees.some(t=>Math.hypot(x-t.x,y-t.y)<85)}
for(let y=top+185;y<1170;y+=91)for(let x=-35;x<1580;x+=88){const xx=Math.round(x+(random()-.5)*52),yy=Math.round(y+(random()-.5)*35),type=random();if(inRoom(xx,yy)||reserved(xx,yy)||random()<.13)continue;trees.push({id:`back-tree-${trees.length}`,x:xx,y:yy,kind:type<.44?'round':type<.8?'pine':'birch',variant:Math.floor(random()*4),scale:.75+random()*.45,tint:Math.floor(random()*3)})}
for(let i=0;i<240;i++){const x=Math.round(random()*1610-37),y=Math.round(top+random()*(bottom-top));if(inRoom(x,y)||reserved(x,y))continue;shrubs.push({id:`back-shrub-${i}`,x,y,rx:19+Math.floor(random()*18),ry:13+Math.floor(random()*12),seed:Math.floor(random()*10000),row:1,label:'Фоновый куст'})}
function nearestEdge(x,y){let best={distance:Infinity,x:0,y:0};for(const outline of [LevelData.perimeter,ForestData.perimeter,CircusData.perimeter,...(globalThis.HeartRoadData?.rooms||[]).map(r=>r.perimeter)])for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy))),qx=a[0]+u*dx,qy=a[1]+u*dy,distance=Math.hypot(x-qx,y-qy);if(distance<best.distance)best={distance,x:qx,y:qy}}return best}
// Move complete crowns away from the playable lawn instead of cutting them with a mask.
for(let i=trees.length-1;i>=0;i--){const p=trees[i],size=p.scale<.9?.85:p.scale>1.08?1.12:1,w=(p.kind==='round'?48:p.kind==='pine'?38:42)*size*3,h=(p.kind==='round'?56:p.kind==='pine'?58:60)*size*3,edge=nearestEdge(p.x,p.y),dx=(p.x-edge.x)/(edge.distance||1),dy=(p.y-edge.y)/(edge.distance||1);
 const intrudes=()=>{for(let yy=p.y-h;yy<p.y-12;yy+=18)for(let xx=p.x-w/2;xx<p.x+w/2;xx+=18)if(inRoom(xx,yy)&&nearestEdge(xx,yy).distance>23)return true;return false};
 for(let n=0;n<12&&intrudes()&&!inRoom(p.x,p.y);n++){p.x+=dx*18;p.y+=dy*18}
 const hidesFence=p.y>155&&p.y<280&&fences.some(f=>p.x+w/2>f.x1&&p.x-w/2<f.x2);
 if(inRoom(p.x,p.y)||intrudes()||hidesFence||reserved(p.x,p.y)||globalThis.HeartRoadData?.crownOnRoad(p.x,p.y,w,h))trees.splice(i,1);
}
globalThis.BackdropData={top,bottom,pixelSize:3,atlas:'assets/scenery-atlas.png',fences,waterfalls,flowers,charredTrees,stones,trees,shrubs,gateOpening:{left:690,right:846},decorative:true,inRoom};
})();
