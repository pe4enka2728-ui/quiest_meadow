/* Approved image variants 1–3. Sources contain north/east/south/west × three poses. */
(()=>{
'use strict';const atlases=new Map(),FRAME=32;
function cell(image,dir,frame){
 const size=image.width/3,c=document.createElement('canvas');c.width=c.height=Math.round(size);
 const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,frame*size,dir*image.height/4,size,image.height/4,0,0,c.width,c.height);
 const im=g.getImageData(0,0,c.width,c.height),d=im.data;let left=c.width,top=c.height,right=0,bottom=0;
 // Drop only the export fringe; the palette and all poses come from the approved images.
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const k=(y*c.width+x)*4;if(d[k+3]<210)d[k+3]=0;else{d[k+3]=255;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 g.putImageData(im,0,0);return {image:c,left,top,w:right-left+1,h:bottom-top+1};
}
function init(images){atlases.clear();for(const id of ['asya','lev','miron']){
 const source=images['npc_'+id];if(!source)throw Error('Не загружены кадры жителя '+id);
 const cells=Array.from({length:12},(_,i)=>cell(source,Math.floor(i/3),i%3)),scale=29/Math.max(...cells.map(c=>c.h));
 atlases.set(id,cells.map(s=>{const c=document.createElement('canvas');c.width=c.height=FRAME;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const w=Math.round(s.w*scale),h=Math.round(s.h*scale);g.drawImage(s.image,s.left,s.top,s.w,s.h,Math.round((FRAME-w)/2),31-h,w,h);return c;}));
}}
function draw(g,a,t){const frames=atlases.get(a.id);if(!frames)return;const pose=ActorMotion.pose(a,t,false),im=frames[pose.frame],h=(a.height||96)*pose.scaleY;
 g.save();g.fillStyle='#10252b55';g.beginPath();g.ellipse(a.x,a.y+1,16,6,0,0,Math.PI*2);g.fill();g.imageSmoothingEnabled=false;g.drawImage(im,Math.round(a.x-h/2),Math.round(a.y-h+3),h,h);g.restore();}
function portrait(g,id,t,talking=false){const im=atlases.get(id)?.[7];g.fillStyle='#263f43';g.fillRect(0,0,48,48);if(im){g.imageSmoothingEnabled=false;g.drawImage(im,7,1,18,19,0,talking?Math.round(Math.sin(t*7)):-1,48,49);}return {character:'resident',id};}
globalThis.TownPeopleArt={init,draw,portrait,get atlases(){return atlases;}};
})();
