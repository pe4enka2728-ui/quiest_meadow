/* Outdoor and interior collision layers. Swept circles, surface sliding and recovery. */
(()=>{
const WIDTH=1536,MIN_Y=Math.min(globalThis.InteriorData?.minY??0,globalThis.HeartRoadData?.minY??globalThis.CircusData?.minY??ForestData.minY),MAX_Y=1024,HEIGHT=MAX_Y-MIN_Y,RADIUS=14,SKIN=.025;
const outdoorMinY=globalThis.HeartRoadData?.minY??globalThis.CircusData?.minY??ForestData.minY;
const floor=[[0,outdoorMinY],[1536,outdoorMinY],[1536,MAX_Y],[0,MAX_Y]];
const obstacles=[
 ...LevelData.bushes,
 ...ForestData.bushes,
 ...ForestData.colliders,
 ...(globalThis.CircusData?.bushes||[]),
 ...(globalThis.CircusData?.colliders||[]),
 ...(globalThis.HeartRoadData?.bushes||[]),
 ...(globalThis.HeartRoadData?.colliders||[]),
 ...(globalThis.GateModel?.staticColliders||[]),
 ...Object.values(LevelData.signs).map(s=>({...s,type:'rect'})),
 ...LevelData.posts,
 {type:'poly',points:[[246,267],[432,267],[434,328],[423,338],[413,332],[404,340],[393,332],[382,340],[370,333],[358,340],[346,332],[334,340],[321,332],[309,340],[295,333],[282,340],[269,333],[254,339],[246,330]],label:'Навес магазина'},
 {type:'poly',points:[[250,334],[426,334],[426,424],[418,424],[418,466],[261,466],[261,453],[251,453]],label:'Прилавок и стенка'},
 {type:'rect',x:186,y:355,w:47,h:59,label:'Верхний ящик'},
 {type:'rect',x:198,y:398,w:47,h:53,label:'Нижний ящик'},
 {type:'rect',x:1100,y:384,w:120,h:105,label:'Постамент'},
 {type:'poly',points:[[173,793],[283,793],[288,833],[277,839],[277,857],[266,857],[266,841],[190,841],[190,857],[177,857],[177,837],[171,835]],label:'Левая скамейка'},
 {id:'bench-right',type:'poly',points:[[1243,793],[1354,793],[1359,833],[1348,857],[1248,857],[1240,835]],label:'Правая скамейка'},
 {type:'rect',x:125,y:658,w:33,h:33,label:'Левый ствол'},
 {type:'rect',x:348,y:801,w:38,h:35,label:'Нижний левый ствол'},
 {type:'rect',x:1143,y:797,w:33,h:37,label:'Правый ствол'},
 {type:'rect',x:1378,y:691,w:34,h:35,label:'Верхний правый ствол'},
];
function polygon(o){if(o.type==='poly')return o.points;if(o.type==='ellipse')return Array.from({length:24},(_,i)=>[o.x+Math.cos(i*Math.PI/12)*o.rx,o.y+Math.sin(i*Math.PI/12)*o.ry]);return [[o.x,o.y],[o.x+o.w,o.y],[o.x+o.w,o.y+o.h],[o.x,o.y+o.h]]}
function inside(poly,x,y){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
function signed(poly,x,y){let best=Infinity,qx=0,qy=0,nx=0,ny=1;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ex=b[0]-a[0],ey=b[1]-a[1],l2=ex*ex+ey*ey,t=Math.max(0,Math.min(1,((x-a[0])*ex+(y-a[1])*ey)/(l2||1))),px=a[0]+t*ex,py=a[1]+t*ey,d2=(x-px)**2+(y-py)**2;if(d2<best){best=d2;qx=px;qy=py;const l=Math.sqrt(l2)||1;nx=-ey/l;ny=ex/l}}const d=Math.sqrt(best),isIn=inside(poly,x,y),sign=isIn?-1:1;if(d>1e-8){nx=(x-qx)/d*sign;ny=(y-qy)/d*sign}else{nx=-nx;ny=-ny}return {d:d*sign,nx,ny}}
const interiorObstacles=globalThis.InteriorData?.colliders||[];
function compile(o){o.vertices=polygon(o);o.bounds={minX:Math.min(...o.vertices.map(p=>p[0])),maxX:Math.max(...o.vertices.map(p=>p[0])),minY:Math.min(...o.vertices.map(p=>p[1])),maxY:Math.max(...o.vertices.map(p=>p[1]))}}
for(const o of obstacles){o.scope='outdoor';compile(o)}for(const o of interiorObstacles){o.scope='interior';compile(o)}
const zones={outdoor:{floor,obstacles,minY:outdoorMinY,maxY:MAX_Y},interior:{floor:globalThis.InteriorData?.perimeter||[[0,MIN_Y],[1536,MIN_Y],[1536,-1750],[0,-1750]],obstacles:interiorObstacles,minY:globalThis.InteriorData?.minY??MIN_Y,maxY:-1750}};
for(const room of [...(globalThis.HeartTrialsData?.rooms||[]),...(globalThis.CloudWorldData?[CloudWorldData]:[]),...(globalThis.TownData?[TownData]:[]),...(globalThis.HomeData?[HomeData]:[])]){for(const o of room.colliders){o.scope=room.id;compile(o);}zones[room.id]={floor:room.perimeter,obstacles:room.colliders,minY:room.minY||0,maxY:room.maxY||1024,width:room.width||WIDTH};}
let activeZone='outdoor',dynamicProvider=()=>[];const zoneProviders={};
const townIndex=new Map(),bucketSize=160;if(globalThis.TownData)for(const [order,o]of zones[TownData.id].obstacles.entries()){o.order=order;const b=o.bounds;for(let y=Math.floor(b.minY/bucketSize);y<=Math.floor(b.maxY/bucketSize);y++)for(let x=Math.floor(b.minX/bucketSize);x<=Math.floor(b.maxX/bucketSize);x++){const key=x+','+y;if(!townIndex.has(key))townIndex.set(key,[]);townIndex.get(key).push(o);}}
function localObstacles(zone,x,y,r){if(zone!==globalThis.TownData?.id)return zones[zone].obstacles;const found=new Set();for(let gy=Math.floor((y-r-8)/bucketSize);gy<=Math.floor((y+r+8)/bucketSize);gy++)for(let gx=Math.floor((x-r-8)/bucketSize);gx<=Math.floor((x+r+8)/bucketSize);gx++)for(const o of townIndex.get(gx+','+gy)||[])found.add(o);return [...found].sort((a,b)=>a.order-b.order);}

function currentOverrides(overrides,zone=activeZone){return overrides!==undefined?overrides:zone==='outdoor'?dynamicProvider():zoneProviders[zone]?.()||[];}
function contacts(x,y,r=RADIUS,overrides,zone=activeZone,stageOpen=globalThis.CurtainProgress?.passable){const z=zones[zone],f=signed(z.floor,x,y);const out=[{d:-f.d-r,nx:-f.nx,ny:-f.ny,label:'Граница локации'}],dynamic=currentOverrides(overrides,zone);for(const o of [...localObstacles(zone,x,y,r),...dynamic]){if(zone==='interior'&&stageOpen&&o.id==='closed-back-curtain')continue;if(!o.vertices)compile(o);const b=o.bounds;if(x<b.minX-r-8||x>b.maxX+r+8||y<b.minY-r-8||y>b.maxY+r+8)continue;const c=signed(o.vertices,x,y);out.push({d:c.d-r,nx:c.nx,ny:c.ny,label:o.label})}return out}
function blocked(x,y,r=RADIUS,overrides,zone=activeZone,stageOpen=globalThis.CurtainProgress?.passable){return contacts(x,y,r,overrides,zone,stageOpen).some(c=>c.d<-.00001)}
function recover(body,overrides,zone=activeZone){overrides=currentOverrides(overrides,zone);const origin={x:body.x,y:body.y};for(let n=0;n<20;n++){const c=contacts(body.x,body.y,RADIUS,overrides,zone).sort((a,b)=>a.d-b.d)[0];if(c.d>=SKIN)return true;body.x+=c.nx*(SKIN-c.d);body.y+=c.ny*(SKIN-c.d);}if(!blocked(body.x,body.y,RADIUS,overrides,zone))return true;for(let r=6;r<=180;r+=6)for(let i=0;i<24;i++){const a=i*Math.PI/12,x=origin.x+Math.cos(a)*r,y=origin.y+Math.sin(a)*r;if(!blocked(x,y,RADIUS+SKIN,overrides,zone)){body.x=x;body.y=y;return true;}}return false;}
function slide(body,dx,dy,overrides,zone=activeZone){for(let iteration=0;iteration<4&&Math.hypot(dx,dy)>.00001;iteration++){
 if(!blocked(body.x+dx,body.y+dy,RADIUS,overrides,zone)){body.x+=dx;body.y+=dy;return}
 let lo=0,hi=1;for(let i=0;i<15;i++){const mid=(lo+hi)/2;if(blocked(body.x+dx*mid,body.y+dy*mid,RADIUS,overrides,zone))hi=mid;else lo=mid}
 body.x+=dx*lo;body.y+=dy*lo;dx*=1-lo;dy*=1-lo;
 const near=contacts(body.x,body.y,RADIUS,overrides,zone).filter(c=>c.d<.06);if(!near.length)return;
 for(const c of near){const into=dx*c.nx+dy*c.ny;if(into<0){dx-=c.nx*into;dy-=c.ny*into}}
 }}
function move(body,dx,dy,onStep,overrides,zone=activeZone){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;overrides=currentOverrides(overrides,zone);recover(body,overrides,zone);const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));for(let i=0;i<n;i++){slide(body,dx/n,dy/n,overrides,zone);if(onStep)onStep()}}
function clear(a,b,overrides){overrides=currentOverrides(overrides);const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/6);for(let i=0;i<=n;i++){const t=n?i/n:0;if(blocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,RADIUS,overrides))return false}return true}
// Grid BFS finds a safe route. Diagonals are checked as full segments to avoid corner cutting.
const cell=20;let cols=Math.ceil(WIDTH/cell),rows=0,gridMinY=0,grid;
function prepareGrid(){const z=zones[activeZone];cols=Math.ceil((z.width||WIDTH)/cell);gridMinY=z.minY;rows=Math.ceil((z.maxY-z.minY)/cell);if(!z.grid){z.grid=new Uint8Array(cols*rows);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)z.grid[y*cols+x]=blocked(x*cell+10,gridMinY+y*cell+10,RADIUS,[])?0:1}grid=z.grid}
prepareGrid();
function center(id){return {x:(id%cols)*cell+10,y:gridMinY+Math.floor(id/cols)*cell+10}}
function nearest(p,overrides){let best=-1,dist=Infinity;for(let id=0;id<grid.length;id++){if(!grid[id])continue;const q=center(id),d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<dist&&clear(p,q,overrides)){best=id;dist=d}}return best}
function route(start,end,overrides){prepareGrid();overrides=currentOverrides(overrides);if(blocked(end.x,end.y,RADIUS,overrides))return [];if(clear(start,end,overrides))return [{...end}];const a=nearest(start,overrides),b=nearest(end,overrides);if(a<0||b<0)return [];const prev=new Int32Array(grid.length).fill(-1),queue=[a];prev[a]=a;let head=0;while(head<queue.length){const id=queue[head++];if(id===b)break;const x=id%cols,y=Math.floor(id/cols);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy,n=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows||!grid[n]||prev[n]!==-1||!clear(center(id),center(n),overrides))continue;prev[n]=id;queue.push(n)}}if(prev[b]===-1)return [];const path=[{...end}];for(let n=b;n!==a;n=prev[n])path.push(center(n));path.push(center(a));path.reverse();const smooth=[];let from=start;for(let i=0;i<path.length;){let j=i;while(j+1<path.length&&clear(from,path[j+1],overrides))j++;smooth.push(path[j]);from=path[j];i=j+1}return smooth}
globalThis.SpawnWorld={invalidate(zone=activeZone){if(zones[zone])zones[zone].grid=null;if(zone===activeZone)prepareGrid()},setZone(zone){if(!zones[zone])throw Error('Unknown collision zone');activeZone=zone;prepareGrid()},get zone(){return activeZone},setDynamicProvider(provider){dynamicProvider=provider||(()=>[])},setZoneDynamicProvider(zone,provider){zoneProviders[zone]=provider;this.invalidate(zone);},WIDTH,HEIGHT,MIN_Y,MAX_Y,RADIUS,get floor(){return zones[activeZone].floor},get obstacles(){return zones[activeZone].obstacles},allObstacles:[...obstacles,...interiorObstacles,...(globalThis.HeartTrialsData?.rooms||[]).flatMap(r=>r.colliders),...(globalThis.CloudWorldData?.colliders||[]),...(globalThis.TownData?.colliders||[]),...(globalThis.HomeData?.colliders||[])],zones,contacts,recover,blocked,move,clear,route};
})();
