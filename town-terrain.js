/* Local image edits keep every unrelated terrain pixel from the released map. */
(()=>{
'use strict';
const edits=[
 {key:'townGuildTip',box:[520,330,120,120],mask:[[535,355],[565,346],[610,346],[630,371],[632,417],[606,433],[550,435],[529,414],[530,385]]},
 {key:'townQuayPost',box:[75,705,110,110],mask:[[103,741],[126,741],[131,754],[130,782],[123,789],[104,787],[99,775],[100,752]]}
];
function path(g,points,ox=0,oy=0){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x-ox,y-oy):g.moveTo(x-ox,y-oy));g.closePath();}
function build(images){const c=document.createElement('canvas');c.width=images.townGround.width;c.height=images.townGround.height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(images.townGround,0,0);
 for(const edit of edits){const[x,y,w,h]=edit.box,p=document.createElement('canvas');p.width=w;p.height=h;const q=p.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(images[edit.key],0,0,w,h);
  const m=document.createElement('canvas');m.width=w;m.height=h;const a=m.getContext('2d');path(a,edit.mask,x,y);a.fillStyle='#fff';a.fill();a.lineJoin='round';a.strokeStyle='#ffffff80';a.lineWidth=2;a.stroke();q.globalCompositeOperation='destination-in';q.drawImage(m,0,0);g.drawImage(p,x,y);
 }return c;
}
function wall(image){if(image.width===27&&image.height===297){const ready=document.createElement('canvas');ready.width=27;ready.height=297;ready.getContext('2d').drawImage(image,0,0);return ready;}const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);const im=g.getImageData(0,0,c.width,c.height);let left=c.width,top=c.height,right=0,bottom=0;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(im.data[i+3]<210)im.data[i+3]=0;else{im.data[i+3]=255;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}g.putImageData(im,0,0);
 const out=document.createElement('canvas');out.width=27;out.height=297;const q=out.getContext('2d');q.imageSmoothingEnabled=false;q.drawImage(c,left,top,right-left+1,bottom-top+1,0,0,27,297);return out;
}
globalThis.TownTerrain={build,wall,edits};
})();
