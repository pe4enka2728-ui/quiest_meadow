/* Shared world-space dirt surface: no room-edge patch or change of road width. */
(()=>{
const top=Math.floor((globalThis.HeartRoadData?.minY??-1800)/3)*3,bottom=540,scale=3,mainWidth=88;let surface;const pebbles=[];
function curve(points){const out=[];for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)],steps=Math.max(4,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/9));for(let j=0;j<steps;j++){const t=j/steps,t2=t*t,t3=t2*t;out.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)))}}out.push(points.at(-1));return out}
function init(){
 surface=document.createElement('canvas');surface.width=1536/scale;surface.height=(bottom-top)/scale;const g=surface.getContext('2d',{willReadFrequently:true});
 const descriptions=[...ForestData.paths.map((points,i)=>({points,width:ForestData.pathWidths[i]})),...CircusData.paths.map((points,i)=>({points,width:CircusData.pathWidths[i]})),...(globalThis.HeartRoadData?.rooms||[]).flatMap(r=>r.paths.map((points,i)=>({points,width:r.pathWidths[i]})))];
 descriptions.push({points:[[768,80],[768,250],[768,390],[768,540]],width:mainWidth});
 const routes=descriptions.map(p=>({...p,points:curve(p.points)})),mask=document.createElement('canvas');mask.width=surface.width;mask.height=surface.height;const m=mask.getContext('2d',{willReadFrequently:true});
 function trace(context,path,width){context.lineWidth=width/scale;context.lineJoin='round';context.lineCap='round';context.beginPath();path.forEach(([x,y],i)=>i?context.lineTo(x/scale,(y-top)/scale):context.moveTo(x/scale,(y-top)/scale));context.stroke()}
 for(const [extra,color]of [[8,'#a4a36c'],[3,'#c5b47a'],[0,'#f3d17e']]){g.strokeStyle=color;for(const p of routes)trace(g,p.points,p.width+extra)}
 m.strokeStyle='#fff';for(const p of routes)trace(m,p.points,p.width-9);const core=m.getImageData(0,0,mask.width,mask.height).data;
 // Texture is deterministic and generated once. Pixel-sized grains retain the source map's scale.
 let seed=73459;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<Math.round(14000*(bottom-top)/2340);i++){const x=Math.floor(random()*surface.width),y=Math.floor(random()*surface.height);if(core[(y*surface.width+x)*4+3]<250)continue;const n=random();g.fillStyle=n<.42?'#e2be7b':n<.8?'#f8dc9c':'#d7b67a';g.fillRect(x,y,1+(n>.8?1:0),1)}
 for(const p of routes){let accumulated=0,next=18;for(let i=1;i<p.points.length;i++){const a=p.points[i-1],b=p.points[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);accumulated+=length;if(accumulated<next||length<.01)continue;next=accumulated+32+random()*28;const offset=(random()-.5)*(p.width-20),x=Math.round((b[0]-dy/length*offset)/scale)*scale,y=Math.round((b[1]+dx/length*offset)/scale)*scale;
   // Threshold and post feet remain visually distinct from the small loose pebbles.
   if(y>232&&y<258)continue;
   const size=3+Math.floor(random()*3)*3;pebbles.push({x,y,w:size,h:Math.max(3,size-3)});
 }}
 for(const p of pebbles){const x=Math.round(p.x/scale),y=Math.round((p.y-top)/scale),w=p.w/scale,h=p.h/scale;g.fillStyle='#ae9b6c';g.fillRect(x,y+1,w,h);g.fillStyle='#8e9884';g.fillRect(x+1,y,w-1,h);g.fillStyle='#c5c8a9';g.fillRect(x+1,y,w-2,1);g.fillStyle='#d9d6b3';g.fillRect(x+1,y,1,1)}
 // Sparse grass intrudes at the margins rather than making a perfectly smooth ribbon.
 for(const p of routes)for(let i=2;i<p.points.length-2;i+=3){if(random()>.6)continue;const a=p.points[i-1],b=p.points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,side=random()<.5?-1:1,x=Math.round((p.points[i][0]-dy/d*(p.width/2+4)*side)/scale),y=Math.round((p.points[i][1]+dx/d*(p.width/2+4)*side-top)/scale);if(p.points[i][1]>90&&p.points[i][1]<270)continue;g.fillStyle='#4e9743';g.fillRect(x,y,1,3);g.fillRect(x+1,y+1,1,2);g.fillStyle='#91b456';g.fillRect(x-1,y+1,1,2)}
 // Cut alpha to whole pixels: no blurred stroke edges in the pixel map.
 const image=g.getImageData(0,0,surface.width,surface.height);for(let i=3;i<image.data.length;i+=4)image.data[i]=image.data[i]<128?0:255;g.putImageData(image,0,0);
}
function draw(ctx){ctx.save();ctx.beginPath();for(const outline of [LevelData.perimeter,ForestData.perimeter,CircusData.perimeter,...(globalThis.HeartRoadData?.rooms||[]).map(r=>r.perimeter)]){outline.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath()}ctx.clip();ctx.imageSmoothingEnabled=false;ctx.drawImage(surface,0,top,1536,bottom-top);ctx.restore();ArchArt.ground(ctx,false)}
globalThis.TrailArt={init,draw,curve,pebbles,mainWidth,pixelSize:scale};
})();
