/* Whole atlas sprites share the actors' 3-world-pixel grid; only terrain is masked. */
(()=>{
const pixelSize=3,defs={
 oak:{rect:[16,93,413,485],w:48,h:56},pine:{rect:[438,88,320,487],w:38,h:58},
 birch:{rect:[780,67,356,512],w:42,h:60},charred:{rect:[1222,101,297,478],w:36,h:58},
 waterfall:{rect:[16,628,389,350],w:54,h:48},fence:{rect:[430,684,370,263],w:40,h:29},
 flowers:{rect:[845,706,289,261],w:16,h:15},bush:{rect:[1213,715,301,253],w:28,h:24}
};
const sprites=new Map(),falls=[],objects=[];let terrain,atlas;
const snap=n=>Math.round(n/pixelSize)*pixelSize;
function sprite(key,size=1,tint=0){const id=`${key}-${size}-${tint}`;if(sprites.has(id))return sprites.get(id);const d=defs[key],c=document.createElement('canvas');c.width=Math.max(2,Math.round(d.w*size));c.height=Math.max(2,Math.round(d.h*size));const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;g.drawImage(atlas,...d.rect,0,0,c.width,c.height);const im=g.getImageData(0,0,c.width,c.height);for(let i=0;i<im.data.length;i+=4){im.data[i+3]=im.data[i+3]<160?0:255;if(tint){im.data[i]=Math.round(im.data[i]*(1-tint*.07));im.data[i+1]=Math.round(im.data[i+1]*(1-tint*.05));im.data[i+2]=Math.round(im.data[i+2]*(1-tint*.03))}}g.putImageData(im,0,0);sprites.set(id,c);return c}
function drawSprite(ctx,image,x,y,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,snap(x-image.width*pixelSize/2),snap(y-image.height*pixelSize),image.width*pixelSize,image.height*pixelSize);ctx.restore()}
function makeFall(p){const base=sprite('waterfall'),mask=document.createElement('canvas');mask.width=base.width;mask.height=base.height;const mg=mask.getContext('2d'),im=base.getContext('2d').getImageData(0,0,base.width,base.height);for(let y=0;y<base.height;y++)for(let x=0;x<base.width;x++){const i=(y*base.width+x)*4,[r,g,b,a]=im.data.slice(i,i+4);im.data[i+3]=a&&g-r>20&&b-r>20&&g>90&&b>85?255:0}mg.putImageData(im,0,0);const frames=[];
 for(let f=0;f<16;f++){const c=document.createElement('canvas');c.width=base.width;c.height=base.height;const g=c.getContext('2d');g.drawImage(base,0,0);const water=document.createElement('canvas');water.width=c.width;water.height=c.height;const wg=water.getContext('2d');
  for(let i=0;i<5;i++){wg.fillStyle=i%2?'#c6f4e3':'#74dbdd';wg.fillRect(23+i*2,5+(f*2+i*13)%31,1,4+i%3)}
  for(let i=0;i<4;i++){const y=37+i*2,span=8+(f+i*3)%9;wg.fillStyle=i%2?'#dcfff0':'#89dddd';wg.fillRect(28-span,y,4,1);wg.fillRect(28+span-4,y,4,1)}
  wg.globalCompositeOperation='destination-in';wg.drawImage(mask,0,0);g.drawImage(water,0,0);frames.push(c)
 }return {...p,frames,waterMask:mask}
}
function init(image){atlas=image;terrain=document.createElement('canvas');terrain.width=512;terrain.height=(BackdropData.bottom-BackdropData.top)/pixelSize;const g=terrain.getContext('2d');g.fillStyle='#204c37';g.fillRect(0,0,terrain.width,terrain.height);let seed=64182;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<5000;i++){const x=Math.floor(random()*512),y=Math.floor(random()*terrain.height);g.fillStyle=['#254f36','#2c5639','#355e3a','#1c4533'][i%4];g.fillRect(x,y,1+(i%3),1)}
 for(const p of BackdropData.trees){const key=p.kind==='round'?'oak':p.kind,size=p.scale<.9?.85:p.scale>1.08?1.12:1;objects.push({...p,image:sprite(key,size,p.tint),tree:true})}
 for(const p of BackdropData.charredTrees)objects.push({...p,image:sprite('charred',p.scale<1?1:1.12),tree:true});
 for(const p of BackdropData.shrubs)objects.push({...p,image:sprite('bush',p.rx<27?.7:.85,1),vegetation:true});
 for(const p of BackdropData.stones)objects.push({...p,image:RockArt.sprite(p.w,p.h,Math.round(p.x+p.y))});
 for(const p of BackdropData.flowers)for(let i=0;i<5;i++){const a=random()*Math.PI*2,r=Math.sqrt(random());objects.push({x:p.x+Math.cos(a)*r*p.rx,y:p.y+Math.sin(a)*r*p.ry,image:sprite('flowers',i%2?.75:1)})}
 for(const p of BackdropData.fences)for(let x=p.x1;x<p.x2;x+=120)objects.push({x:x+60,y:p.y,image:sprite('fence')});
 for(const p of BackdropData.waterfalls)falls.push(makeFall(p));
}
function base(ctx){ctx.imageSmoothingEnabled=false;ctx.drawImage(terrain,0,BackdropData.top,1536,BackdropData.bottom-BackdropData.top)}
function items(actors,t,ctx){const list=objects.map(p=>({group:p.tree||p.vegetation?'vegetation':'decor',depth:p.y,draw(){const behind=p.tree&&actors.some(a=>a.body.y<p.y&&a.body.y>p.y-p.image.height*pixelSize&&Math.abs(a.body.x-p.x)<p.image.width*1.35);drawSprite(ctx,p.image,p.x,p.y,behind?.6:1)}}));for(const p of falls)list.push({depth:p.poolY,draw:()=>drawSprite(ctx,p.frames[Math.floor(t*10)%16],p.x,p.poolY)});return list}
function draw(ctx,t){base(ctx);for(const item of items([],t,ctx).sort((a,b)=>a.depth-b.depth))item.draw()}
globalThis.BackdropArt={getSprite:sprite,drawSprite,init,base,items,draw,defs,sprites,falls,objects,pixelSize};
})();
