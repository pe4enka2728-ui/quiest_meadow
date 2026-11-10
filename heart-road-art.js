/* Original grass, whole tree sprites, pebble roads and small pixel details. */
(()=>{
let ground;const trees=[],background=[];const snap=n=>Math.round(n/3)*3;
function init(images){const data=HeartRoadData,top=data.minY,bottom=-1640;ground=document.createElement('canvas');ground.width=768;ground.height=(bottom-top)/2;const g=ground.getContext('2d');g.imageSmoothingEnabled=false;g.scale(.5,.5);
 for(let y=0;y<bottom-top;y+=96)for(let x=0;x<1536;x+=96)g.drawImage(images.ground,960,0,96,96,x,y,96,96);
 g.fillStyle='#173c3d29';g.fillRect(0,0,1536,bottom-top);SceneArt.registerBushes(data.bushes);
 for(const tree of data.trees)trees.push({...tree,image:BackdropArt.getSprite(tree.kind,1,1)});
 for(let y=-3750;y<-1790;y+=165)for(const x of [65,1460]){const p={x:x+(Math.floor(-y/165)%2)*43,y,image:BackdropArt.getSprite(Math.floor(-y/165)%3===0?'birch':'pine',1,2)};if(!data.crownOnRoad(p.x,p.y,p.image.width*3,p.image.height*3))background.push(p);}
}
function base(g){g.save();g.beginPath();for(const r of HeartRoadData.rooms){r.perimeter.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}g.clip();g.imageSmoothingEnabled=false;g.drawImage(ground,0,HeartRoadData.minY,1536,-1640-HeartRoadData.minY);g.restore();}
function flower(g,p){const c=['#dfbade','#f6dc9d','#afe6de'][p.tint];for(const [x,y]of [[-3,0],[3,0],[0,-3],[0,3]]){g.fillStyle=c;g.fillRect(snap(p.x+x),snap(p.y+y),3,3);}g.fillStyle='#f4d66b';g.fillRect(snap(p.x),snap(p.y),3,3);}
function stone(g,p){RockArt.draw(g,{x:p.x,y:p.y+12,w:45,h:33});}
function pond(g,t){const p=HeartRoadData.pond;g.save();g.translate(snap(p.x),snap(p.y));g.scale(3,3);for(let y=-13;y<=13;y++){const w=Math.floor(Math.sqrt(Math.max(0,1-(y/13)**2))*27);g.fillStyle=y>8?'#41613a':'#a1ac68';g.fillRect(-w,y,w*2,1);}for(let y=-10;y<=10;y++){const w=Math.floor(Math.sqrt(Math.max(0,1-(y/10)**2))*23);g.fillStyle=y%4<2?'#427f81':'#397078';g.fillRect(-w,y,w*2,1);}for(let i=0;i<5;i++){const u=(t*.18+i*.231)%1,x=-17+i*8,y=-5+(i%3)*4;g.fillStyle='#98c9b580';g.fillRect(x-u*4,y,5+u*7,1);}for(const [x,y]of [[-19,-5],[16,6]]){g.fillStyle='#5c9a62';g.fillRect(x,y,7,3);g.fillRect(x+2,y-1,6,4);g.fillStyle='#c4d2a0';g.fillRect(x+2,y,2,1);}for(const [x,y]of [[-26,3],[22,-5],[17,11]]){g.fillStyle='#4e773c';g.fillRect(x,y-9,1,12);g.fillRect(x+3,y-6,1,9);g.fillStyle='#8a744b';g.fillRect(x,y-10,1,3);}g.restore();}
function stump(g){const p=HeartRoadData.stump;g.save();g.translate(snap(p.x),snap(p.y));g.scale(3,3);g.fillStyle='#263c2c';g.fillRect(-9,-6,18,9);g.fillStyle='#684a35';g.fillRect(-7,-12,14,13);g.fillRect(-9,-4,18,3);g.fillStyle='#9b7047';g.fillRect(-6,-12,4,11);g.fillRect(3,-12,3,10);g.fillStyle='#d7b879';g.fillRect(-6,-14,12,4);g.fillRect(-8,-13,16,3);g.fillStyle='#9d7a4d';g.fillRect(-4,-13,8,1);g.fillRect(-5,-12,1,1);g.fillRect(4,-12,1,1);g.fillStyle='#5b9a4f';g.fillRect(-10,-2,5,2);g.fillRect(5,-3,5,3);g.restore();}
function memoryBase(g){const b=HeartRoadData.crossroads.savePoint.base;g.fillStyle='#294c46';g.fillRect(b.x-6,b.y+10,b.w+12,b.h-5);g.fillStyle='#78998a';g.fillRect(b.x,b.y,b.w,b.h);g.fillStyle='#b4c7aa';g.fillRect(b.x+3,b.y,b.w-6,9);g.fillStyle='#638675';g.fillRect(b.x+6,b.y+18,b.w-12,9);g.fillStyle='#c7eadd';g.fillRect(b.x+21,b.y+14,12,5);}
function returnSeal(g,t,count){const p=HeartRoadData.returnSeal,x=p.x,y=p.y,w=p.w;
 g.save();g.imageSmoothingEnabled=false;for(const xx of [x-9,x+w+9]){RockArt.draw(g,{x:xx,y:y+18,w:39,h:66,seed:xx});g.fillStyle='#c48180';g.fillRect(xx-3,y-36,6,18);g.fillStyle='#f0cdb1';g.fillRect(xx-3,y-36,6,3);}
 g.fillStyle='#201b3380';g.fillRect(x+9,y-27,w-18,30);g.strokeStyle='#a14c66';g.lineWidth=3;for(const dy of [-21,-3]){g.beginPath();g.moveTo(x,y+dy);for(let i=1;i<=12;i++)g.lineTo(x+w*i/12,y+dy+Math.sin(i*.9+t*1.8)*3);g.stroke();}
 for(let i=0;i<3;i++){const xx=x+w/2+(i-1)*42;g.fillStyle='#283f40';g.fillRect(xx-9,y-21,18,18);g.fillStyle=i<count?['#dd7792','#e6c877','#9ad8d7'][i]:'#5d6c67';g.fillRect(xx-6,y-18,12,12);g.fillStyle=i<count?'#f3e3b1':'#839581';g.fillRect(xx-3,y-18,6,3);}
 g.restore();}
function items(actors,t,g){const d=HeartRoadData,list=[];
 for(const b of d.bushes)list.push({group:'vegetation',depth:b.y+b.ry,draw:()=>SceneArt.drawBush(b)});
 for(const p of [...background,...trees])list.push({group:'vegetation',depth:p.y,draw:()=>{const behind=actors.some(a=>a.body.y<p.y&&a.body.y>p.y-155&&Math.abs(a.body.x-p.x)<65);BackdropArt.drawSprite(g,p.image,p.x,p.y,behind?.7:1);}});
 for(const p of d.flowers)list.push({depth:p.y,draw:()=>flower(g,p)});for(const p of d.stones)list.push({depth:p.y+13,draw:()=>stone(g,p)});
 list.push({depth:d.pond.y,draw:()=>pond(g,t)},{depth:d.stump.y,draw:()=>stump(g)},{depth:d.crossroads.savePoint.base.y+d.crossroads.savePoint.base.h,draw:()=>memoryBase(g)});
 const count=Math.max(globalThis.HeartQuest?.count||0,globalThis.HeartCorruption?.status().hearts||0);if(globalThis.HeartQuestModel?.travelLocked(count))list.push({depth:d.returnSeal.y+18,draw:()=>returnSeal(g,t,count)});
 return list;
}
function ambient(g,t,cameraY){if(cameraY> -1850)return;g.save();for(let i=0;i<38;i++){const x=310+(i*151)%930+Math.sin(t*.45+i)*18,y=cameraY+80+(i*79+t*7)%850;g.fillStyle=['#d4c389','#a0caa2','#c8e5d8'][i%3];g.globalAlpha=(.18+.2*Math.sin(t+i)**2)*(globalThis.MikuRupture?.opacity('decor')??1);g.fillRect(snap(x),snap(y),3,3);}g.restore();}
function branches(g,t){if(!globalThis.MikuHearts?.released)return;g.save();for(const b of HeartRoadData.branches){const p=b.edge;g.globalAlpha=(.3+.2*Math.sin(t*2+b.target.x)**2)*(globalThis.MikuRupture?.opacity('decor')??1);for(let i=0;i<8;i++){g.fillStyle=b.color;g.fillRect(snap(p.x+Math.sin(i*3.7+t)*27),snap(p.y-18-i*6+Math.cos(t+i)*9),3,3);}}g.restore();}
globalThis.HeartRoadArt={init,base,items,ambient,branches,backgroundTrees:background};
})();
