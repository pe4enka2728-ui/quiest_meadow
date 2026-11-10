/* Perches use opaque crown pixels. Bird time comes from the pause-aware world clock. */
(()=>{
'use strict';
const perches=[],hosts=[],obstructions=[],alphaCache=new WeakMap(),snap=n=>Math.round(n/3)*3;
function pixels(image){if(!alphaCache.has(image))alphaCache.set(image,image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,image.width,image.height).data);return alphaCache.get(image);}
function opaque(h,x,y){const ix=Math.floor((x-h.left)/h.scale),iy=Math.floor((y-h.top)/h.scale);return ix>=0&&iy>=0&&ix<h.image.width&&iy<h.image.height&&pixels(h.image)[(iy*h.image.width+ix)*4+3]>180;}
function add(image,x,y,scale=3,id='tree'){hosts.push({image,scale,left:snap(x-image.width*scale/2),top:snap(y-image.height*scale),x,y,id});}
function blocked(x,y,owner){return [...hosts,...obstructions].some(h=>h!==owner&&x+18>=h.left&&x-18<=h.left+h.image.width*h.scale&&y>=h.top&&y-27<=h.top+h.image.height*h.scale&&[-15,-6,3,12,18].some(dx=>[-23,-14,-5].some(dy=>opaque(h,x+dx,y+dy))));}
function init(){perches.length=hosts.length=obstructions.length=0;
 for(const p of BackdropArt.objects)if(p.tree)add(p.image,p.x,p.y,3,p.id||'background');
 for(const p of CircusData.trees)add(BackdropArt.getSprite(p.kind,1,1),p.x,p.y,3,'circus');
 for(const p of HeartRoadData.trees)add(BackdropArt.getSprite(p.kind,1,1),p.x,p.y,3,'heart-road');
 for(const p of HeartRoadArt.backgroundTrees)add(p.image,p.x,p.y,3,'heart-background');
 for(let i=0;i<SceneArt.trees.length;i++){const r=SceneArt.trees[i],im=ForestArt.treeSprites[i];hosts.push({image:im,scale:1,left:r.rect[0],top:r.rect[1],x:r.crown[0],y:r.depth,id:'meadow'});}
 for(const p of ForestData.trees){const r=SceneArt.trees[p.variant],im=ForestArt.treeSprites[p.variant];hosts.push({image:im,scale:1,left:p.x-(r.crown[0]-r.rect[0]),top:p.y-(r.depth-r.rect[1]),x:p.x,y:p.y,id:'forest'});}
 for(const [id,layer]of Object.entries(SceneArt.layers))if(!SceneArt.trees.some(t=>t.key===id)&&id!=='sign'){obstructions.push({id,image:layer.canvas,scale:1,left:layer.rect[0],top:layer.rect[1]});}
 for(const p of [...LevelData.bushes,...ForestData.bushes,...CircusData.bushes,...HeartRoadData.bushes]){const image=SceneArt.bushSprites.get(p.id);if(image)obstructions.push({id:p.id,image,scale:1,left:p.x-50,top:p.y-53});}
 for(const p of BackdropArt.objects)if(!p.tree)obstructions.push({image:p.image,scale:p.scale||3,left:snap(p.x-p.image.width*(p.scale||3)/2),top:snap(p.y-p.image.height*(p.scale||3))});
 for(const h of hosts){const w=h.image.width;let chosen=null;for(const fraction of [.5,.42,.58,.34,.66]){const ix=Math.round(w*fraction);let iy=-1;for(let j=0;j<Math.floor(h.image.height*.6);j++)if(pixels(h.image)[(j*w+ix)*4+3]>200){iy=j;break;}if(iy<0)continue;const x=snap(h.left+ix*h.scale),y=snap(h.top+iy*h.scale);if(!blocked(x,y,h)){chosen={x,y,host:h.id,contact:{x:h.left+ix*h.scale,y:h.top+iy*h.scale},type:'tree'};break;}}
  if(chosen&&chosen.x>35&&chosen.x<1500&&!perches.some(p=>Math.hypot(p.x-chosen.x,p.y-chosen.y)<150))perches.push({...chosen,owner:hosts.indexOf(h)});
 }
 const s=HeartRoadData.stump;for(const p of [{x:336,y:267,host:'shop-roof'},{x:s.x,y:s.y-40,host:'heart-stump'}])if(!blocked(p.x,p.y,null))perches.push({...p,type:'object',contact:{x:p.x,y:p.y}});
 perches.forEach((p,i)=>{p.id='bird-'+i;p.offset=(i*9.37)%30.5;p.direction=i%2?1:-1;p.color=i%3;});
}
function flight(p){const bounds=p.flightBounds||{minX:0,maxX:1536},entry={x:p.direction>0?bounds.minX-150:bounds.maxX+150,y:p.y-300},exit={x:p.direction>0?bounds.maxX+180:bounds.minX-180,y:p.y-390},landing=Math.max(2.5,Math.hypot(p.x-entry.x,p.y-entry.y)/360),leaving=Math.max(3,Math.hypot(exit.x-p.x,exit.y-p.y)/390);return {entry,exit,landing,perched:15,leaving,cycle:landing+15+leaving+6};}
function state(p,t){const f=flight(p),age=((t+p.offset)%f.cycle+f.cycle)%f.cycle;let phase,x=p.x,y=p.y,wing=0;if(age<f.landing){phase='landing';const u=age/f.landing,e=1-(1-u)**2;x=f.entry.x+(p.x-f.entry.x)*e;y=f.entry.y+(p.y-f.entry.y)*e-Math.sin(u*Math.PI)*28;wing=Math.floor(t*11)%4;}else if(age<f.landing+f.perched){phase='perched';}else if(age<f.landing+f.perched+f.leaving){phase='leaving';const u=(age-f.landing-f.perched)/f.leaving,e=u*u*(2-u);x=p.x+(f.exit.x-p.x)*e;y=p.y+(f.exit.y-p.y)*e-Math.sin(u*Math.PI)*16;wing=Math.floor(t*12)%4;}else {phase='away';x=f.exit.x;y=f.exit.y;}return {...p,x:snap(x),y:snap(y),age,phase,wing,perchedFor:phase==='perched'?age-f.landing:0,flight:f};}
function bird(g,b,t){g.save();g.translate(b.x,b.y);g.scale(b.direction,1);const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x*3,y*3,w*3,h*3);},palette=[['#657caa','#c5daf0'],['#986c52','#ead9aa'],['#75a99a','#d2edcd']][b.color];
 rect(-4,-5,7,4,'#172a36');rect(-3,-5,5,3,palette[0]);rect(-2,-3,5,2,palette[1]);rect(1,-7,4,4,'#172a36');rect(1,-6,3,2,palette[0]);rect(3,-6,1,1,'#fff0cc');rect(4,-5,2,1,'#e6bb62');rect(-6,-4,3,1,palette[0]);rect(-5,-3,2,1,palette[1]);
 if(b.phase==='perched'){rect(-2,-1,1,1,'#45332b');rect(1,-1,1,1,'#45332b');rect(-3,-5,3,2,palette[0]);if(Math.sin(t*1.2+b.offset)>.94)rect(3,-6,1,1,'#1b2a33');}
 else{const wing=[[-4,-8,5,3],[-4,-6,5,3],[-3,-4,5,3],[-3,-3,4,4]][b.wing];rect(...wing,palette[0]);rect(wing[0]+1,wing[1],2,1,palette[1]);}g.restore();}
function draw(g,t,cameraY){if(globalThis.HeartCorruption?.birdsOff)return;for(const p of perches){const b=state(p,t);if(b.phase==='away'||b.x< -40||b.x>1576||b.y<cameraY-30||b.y>cameraY+1060)continue;bird(g,b,t);}}
function localPerches(trees,extras=[],objects=[],width=1536){const result=[],all=trees.map(p=>({...p,scale:p.scale||3,left:snap(p.x-p.image.width*(p.scale||3)/2),top:snap(p.y-p.image.height*(p.scale||3))}));
 const obstructs=(x,y,owner)=>[...all,...extras].some(h=>{if(h===owner)return false;if(h.rect)return x+16>h.rect.x&&x-16<h.rect.x+h.rect.w&&y>h.rect.y&&y-27<h.rect.y+h.rect.h;return x+18>=h.left&&x-18<=h.left+h.image.width*h.scale&&y>=h.top&&y-27<=h.top+h.image.height*h.scale&&[-12,0,12].some(dx=>[-22,-12,-3].some(dy=>opaque(h,x+dx,y+dy)));});
 for(const [i,h]of all.entries()){
  const a=pixels(h.image),topAt=x=>{if(x<0||x>=h.image.width)return -1;for(let y=0;y<h.image.height*.65;y++)if(a[(y*h.image.width+x)*4+3]>200)return y;return -1;},candidates=[];
  for(let x=Math.ceil(h.image.width*.25);x<h.image.width*.76;x++){const left=topAt(x-Math.ceil(6/h.scale)),right=topAt(x+Math.ceil(3/h.scale)),middle=topAt(x);if(left<0||right<0||middle<0||Math.abs(left-right)*h.scale>4||Math.abs(middle-Math.max(left,right))*h.scale>5)continue;const y=Math.max(left,right,middle),xx=snap(h.left+x*h.scale),yy=snap(h.top+y*h.scale);if(xx<35||xx>width-36||obstructs(xx,yy,h)||result.some(p=>Math.hypot(p.x-xx,p.y-yy)<165))continue;candidates.push({x:xx,y:yy,score:Math.abs(x-h.image.width/2)+y*.15,surface:[left,right]});}
  if(candidates.length){const q=candidates.sort((a,b)=>a.score-b.score)[0];result.push({x:q.x,y:q.y,id:'local-bird-'+i,host:h.id||'tree',offset:(i*9.37)%30.5,direction:i%2?1:-1,color:i%3,contact:{x:q.x,y:q.y},clear:true,surface:q.surface,flightBounds:{minX:0,maxX:width}});}
 }
 for(const [i,p]of objects.entries())if(!obstructs(p.x,p.y,null))result.push({...p,id:'local-object-bird-'+i,host:'flat-awning',offset:7+i*9,direction:i%2?1:-1,color:i%3,contact:{x:p.x,y:p.y},clear:true,flightBounds:{minX:0,maxX:width}});return result;}
function drawLocal(g,t,cameraY,list,cameraX=0){if(globalThis.HeartCorruption?.birdsOff)return;for(const p of list){const b=state(p,t);if(b.phase!=='away'&&b.x>cameraX-40&&b.x<cameraX+1576&&b.y>cameraY-30&&b.y<cameraY+1060)bird(g,b,t);}}
globalThis.WorldBirds={init,state,flight,draw,localPerches,drawLocal,perches,hosts,perchClear(p){return !blocked(p.x,p.y,hosts[p.owner]);},status(t,cameraY){if(globalThis.HeartCorruption?.birdsOff)return [];return perches.map(p=>state(p,t)).filter(b=>b.phase!=='away'&&b.y>=cameraY-30&&b.y<=cameraY+1060).map(({id,x,y,host,phase,age,perchedFor})=>({id,x,y,host,phase,age,perchedFor}));}};
})();
