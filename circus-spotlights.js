/* Three moving lights. A cached alpha mask keeps every ray on the ring. */
(()=>{
let mask,layer,spots=[];const scale=3,width=512,height=617,top=-3600;
const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
const random=(seed,n)=>{let v=Math.imul(seed^Math.imul(n+31,374761393),668265263);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296};
function target(light,step){const r=InteriorData.arena.ring,p=InteriorData.arena.curtain;for(let attempt=0;attempt<20;attempt++){const n=step*47+attempt*137,a=random(light.seed,n*2)*Math.PI*2,d=Math.sqrt(random(light.seed,n*2+1))*.94,x=r.cx+Math.cos(a)*r.rx*d,y=r.cy+Math.sin(a)*r.ry*d;if(y>p.cy+p.ry+p.lip+p.thickness+15||((x-p.cx)/(p.rx+p.lip+9))**2+((y-p.cy-p.thickness)/(p.ry+p.lip+9))**2>1)return {x,y}}return {x:r.cx,y:r.cy}}
function state(light,time){const t=Math.max(0,Number.isFinite(time)?time:0)+light.phase,period=5.8,step=Math.floor(t/period),u=smooth(t%period/period),a=target(light,step),b=target(light,step+1),focus={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};return {id:light.id,source:{x:light.x,y:light.y},focus,angle:Math.atan2(focus.y-light.y,focus.x-light.x),intensity:.30+Math.sin(t*.65+light.seed)*.012}}
function polygon(g,points){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()}
function circleTexture(light){const radius=Math.round(light.radius/scale),c=document.createElement('canvas');c.width=c.height=radius*2;const g=c.getContext('2d');
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const d=Math.hypot(x+.5-radius,y+.5-radius)/radius;if(d>1)continue;const alpha=d<.67?.56:d<.86?.42:d<.96?.25:((x+y)%2?.12:.18);g.fillStyle=`rgba(${light.color.join(',')},${alpha})`;g.fillRect(x,y,1,1)}return c;
}
function init(drawExclusions){
 mask=document.createElement('canvas');layer=document.createElement('canvas');const excluded=document.createElement('canvas');for(const c of [mask,layer,excluded]){c.width=width;c.height=height}
 const g=mask.getContext('2d'),a=InteriorData.arena,r=a.ring;g.save();g.scale(1/scale,1/scale);g.translate(0,-top);g.fillStyle='#fff';g.beginPath();g.ellipse(r.cx,r.cy,r.rx,r.ry,0,0,Math.PI*2);g.fill();g.restore();
 const e=excluded.getContext('2d');e.scale(1/scale,1/scale);e.translate(0,-top);if(drawExclusions)drawExclusions(e);else{CurtainArt.draw(e,a.curtain);for(const b of InteriorData.benches)polygon(e,b.points)}
 // Subtract the exact rendered textures, including hem shadows and antialiased edges.
 // A one-logical-pixel guard prevents a moving ray from touching their silhouettes.
 const pixels=g.getImageData(0,0,width,height),blocked=e.getImageData(0,0,width,height).data;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(blocked[(y*width+x)*4+3])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<width&&yy<height)pixels.data[(yy*width+xx)*4+3]=0}
 g.putImageData(pixels,0,0);spots=a.spotlights.map(circleTexture);
}
function drawFloor(ctx,time){if(!mask)return;const g=layer.getContext('2d');g.clearRect(0,0,width,height);g.save();g.imageSmoothingEnabled=false;
 // Each sprite pixel maps exactly to one three-pixel floor cell: no soft cones.
 for(const [i,light]of InteriorData.arena.spotlights.entries()){const s=state(light,time),spot=spots[i];g.globalAlpha=s.intensity/.312;g.drawImage(spot,Math.round(s.focus.x/scale)-spot.width/2,Math.round((s.focus.y-top)/scale)-spot.height/2)}
 g.restore();g.globalCompositeOperation='destination-in';g.drawImage(mask,0,0);g.globalCompositeOperation='source-over';ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(layer,0,top,width*scale,height*scale);ctx.restore()}
function fixture(ctx,light,time,enabled=true){const s=state(light,time),snap=n=>Math.round(n/3)*3;ctx.save();ctx.translate(snap(light.x),snap(light.y));ctx.fillStyle='#1b202b';ctx.fillRect(-18,-27,36,12);ctx.fillStyle='#b39a69';ctx.fillRect(-15,-27,30,3);ctx.fillStyle='#68636b';ctx.fillRect(-3,-15,6,12);ctx.rotate(s.angle-Math.PI/2);ctx.fillStyle='#171d29';ctx.fillRect(-18,-6,36,27);ctx.fillStyle='#50515f';ctx.fillRect(-15,-3,30,18);ctx.fillStyle='#817d82';ctx.fillRect(-12,0,24,6);ctx.fillStyle='#252535';ctx.fillRect(-21,15,42,9);ctx.fillStyle=enabled?`rgb(${light.color.join(',')})`:'#5c554e';ctx.fillRect(-15,18,30,6);ctx.fillStyle=enabled?'#fff1c7':'#7c7360';ctx.fillRect(-9,18,18,3);ctx.restore()}
function drawFixtures(ctx,time,enabled=true){for(const light of InteriorData.arena.spotlights)fixture(ctx,light,time,enabled)}
globalThis.CircusSpotlights={init,state,target,drawFloor,drawFixtures,get mask(){return mask},get layer(){return layer},get spots(){return spots}};
})();
