/* Generated source art is rasterized onto the same 24×32 grid as the overworld actors. */
(()=>{
const frames=[],palette=['#142528','#315147','#5a742f','#86a938','#b6d353','#efd9bc','#fff0d4','#d4ae8d','#523f32','#de8b24','#ab4e20','#f5bd50','#7e3346','#482e3e','#282636','#684958','#d8d9d1','#22252a','#171319'].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
function init(atlas){
 const sw=atlas.width/3,regions=[];let top=atlas.height,bottom=0;
 for(let i=0;i<3;i++){
  const c=document.createElement('canvas');c.width=Math.round(sw);c.height=atlas.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(atlas,i*sw,0,sw,atlas.height,0,0,c.width,c.height);
  const im=g.getImageData(0,0,c.width,c.height);let left=c.width,right=0,low=0,high=c.height;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const k=(y*c.width+x)*4;im.data[k+3]=im.data[k+3]<160?0:255;if(im.data[k+3]){left=Math.min(left,x);right=Math.max(right,x);low=Math.max(low,y);high=Math.min(high,y)}}
  g.putImageData(im,0,0);regions.push({c,center:(left+right)/2});top=Math.min(top,high);bottom=Math.max(bottom,low);
 }
 const ratio=30/(bottom-top+1);
 for(const r of regions){
  const raw=document.createElement('canvas');raw.width=24;raw.height=32;const rg=raw.getContext('2d');rg.imageSmoothingEnabled=false;rg.drawImage(r.c,Math.round(12-r.center*ratio),Math.round(31-bottom*ratio),Math.round(r.c.width*ratio),Math.round(r.c.height*ratio));
  const shape=document.createElement('canvas');shape.width=24;shape.height=32;const sg=shape.getContext('2d');sg.imageSmoothingEnabled=false;
  // Match the companions' large head and short, readable body rather than a slender portrait silhouette.
  sg.drawImage(raw,0,0,24,15,-2,1,28,16);sg.drawImage(raw,0,15,24,17,-4,17,32,14);
  const c=document.createElement('canvas');c.width=24;c.height=32;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;
  const silhouette=sg.getImageData(0,0,24,32);g.fillStyle='#171319';for(let y=0;y<32;y++)for(let x=0;x<24;x++)if(silhouette.data[(y*24+x)*4+3]>=160){for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])g.fillRect(x+dx,y+dy,1,1)}
  g.drawImage(shape,0,0);const im=g.getImageData(0,0,24,32);
  for(let k=0;k<im.data.length;k+=4){if(im.data[k+3]<160){im.data[k+3]=0;continue}let best=palette[0],distance=Infinity;for(const p of palette){const d=(p[0]-im.data[k])**2+(p[1]-im.data[k+1])**2+(p[2]-im.data[k+2])**2;if(d<distance){distance=d;best=p}}im.data[k]=best[0];im.data[k+1]=best[1];im.data[k+2]=best[2];im.data[k+3]=255}g.putImageData(im,0,0);frames.push(c);
 }
}
function draw(ctx,t){const p=InteriorData.arena.gumi,phase=t%5.2,frame=phase>4.8&&phase<4.98?1:Math.sin(t*1.6)>.7?2:0;ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#07191a70';ctx.beginPath();ctx.ellipse(p.x,p.y+3,21,7,0,0,Math.PI*2);ctx.fill();ctx.drawImage(frames[frame],p.x-36,p.y-93+Math.round(Math.sin(t*1.4)),72,96);ctx.restore()}
globalThis.GumiSprite={init,draw,frames,paletteSize:palette.length};
})();
