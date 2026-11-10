/* First enemy's eight painted idle poses. World time controls every animation. */
(()=>{
const frames=[],sequence=[0,1,2,1,3,4,5,4,7],durations=[.65,.2,.28,.2,.35,.2,.28,.2,.45],period=durations.reduce((a,b)=>a+b,0);
function sample(t){const blink=t%5.3;if(blink>4.86&&blink<5.02)return {frame:6,blink:true};let phase=t%period;for(let i=0;i<sequence.length;i++){if(phase<durations[i])return {frame:sequence[i],blink:false};phase-=durations[i]}return {frame:0,blink:false}}
function init(atlas){
 const cellW=atlas.width/4,cellH=atlas.height/2,regions=[];let maxHeight=0;
 for(let i=0;i<8;i++){const c=document.createElement('canvas');c.width=cellW;c.height=cellH;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(atlas,i%4*cellW,Math.floor(i/4)*cellH,cellW,cellH,0,0,cellW,cellH);const im=g.getImageData(0,0,c.width,c.height),data=im.data;let minX=c.width,minY=c.height,maxX=0,maxY=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const k=(y*c.width+x)*4;data[k+3]=data[k+3]<160?0:255;if(data[k+3]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}g.putImageData(im,0,0);maxHeight=Math.max(maxHeight,maxY-minY+1);
  let footLeft=c.width,footRight=0;for(let y=maxY-10;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(data[(y*c.width+x)*4+3]){footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x)}regions.push({c,minX,minY,maxX,maxY,anchorX:(footLeft+footRight)/2});
 }
 const ratio=64/maxHeight;
 for(const r of regions){const c=document.createElement('canvas');c.width=64;c.height=72;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const w=Math.round((r.maxX-r.minX+1)*ratio),h=Math.round((r.maxY-r.minY+1)*ratio),x=Math.round(32-(r.anchorX-r.minX)*ratio);g.drawImage(r.c,r.minX,r.minY,r.maxX-r.minX+1,r.maxY-r.minY+1,x,68-h,w,h);frames.push(c)}
}
function draw(ctx,enemy,t,actors=[]){const pose=sample(t),near=actors.some(a=>Math.hypot(a.body.x-enemy.x,a.body.y-enemy.y)<enemy.interactionRadius);ctx.save();ctx.fillStyle='#1b3d3b66';ctx.beginPath();ctx.ellipse(enemy.x,enemy.y+1,22,6,0,0,Math.PI*2);ctx.fill();ctx.imageSmoothingEnabled=false;ctx.drawImage(frames[pose.frame],Math.round(enemy.x-64),Math.round(enemy.y-136),128,144);
 if(near){ctx.globalAlpha=.6+.25*Math.sin(t*3);ctx.fillStyle='#f7e5bb';for(const dx of [-51,51]){ctx.fillRect(enemy.x+dx,enemy.y-81,2,6);ctx.fillRect(enemy.x+dx-2,enemy.y-79,6,2)}}ctx.restore()}
function drawCorpse(ctx,enemy,t,reveal=false){ctx.save();ctx.translate(enemy.x+(reveal?-12:0),enemy.y);ctx.fillStyle='#163a3288';ctx.beginPath();ctx.ellipse(0,3,43,12,0,0,Math.PI*2);ctx.fill();ctx.rotate(Math.PI*.43);ctx.scale(.65,.24);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.8;ctx.drawImage(frames[0],-64,-136,128,144);ctx.restore()}
globalThis.FlowerMob={init,draw,drawCorpse,sample,frames,period};
})();
