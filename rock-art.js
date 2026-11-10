/* Small irregular pixel stones. Transparent contours preserve the terrain beneath them. */
(()=>{
'use strict';
const cache=new Map(),palette=['#2b4039','#435b50','#657a65','#84947a','#adb697','#52784b','#729456'];
function sprite(w=42,h=27,seed=1){const width=Math.max(4,Math.round(w/3)),height=Math.max(3,Math.round(h/3));seed=(seed|0)>>>0;const key=width+':'+height+':'+seed;if(cache.has(key))return cache.get(key);
 const c=document.createElement('canvas');c.width=width;c.height=height;const g=c.getContext('2d');
 const edge=[[.13,.12],[.44,0],[.76,.07],[.94,.35],[1,.72],[.79,.96],[.28,1],[.03,.79],[0,.44]];
 const inside=(x,y)=>{let yes=false;for(let i=0,j=edge.length-1;i<edge.length;j=i++){const a=edge[i],b=edge[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const nx=(x+.5)/width,ny=(y+.5)/height;if(!inside(nx,ny))continue;const rim=![[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>inside((x+.5+dx)/width,(y+.5+dy)/height));let color=rim?0:ny<.3+nx*.13?4:nx>.62+ny*.12||ny>.79?1:ny<.52?3:2;const fleck=(x*37+y*61+seed*13)%41;if(!rim&&fleck<3)color=Math.max(1,color-1);if(!rim&&ny>.59&&nx<.37&&fleck<18)color=fleck<7?6:5;g.fillStyle=palette[color];g.fillRect(x,y,1,1);}
 // A forked fissure follows the shaded facet rather than boxing the rock in.
 if(width>11&&height>7){g.fillStyle=palette[1];const x=Math.floor(width*.56);g.fillRect(x,Math.floor(height*.35),1,2);g.fillRect(x-1,Math.floor(height*.35)+2,1,2);g.fillStyle=palette[3];g.fillRect(x+1,Math.floor(height*.35)+1,1,2);}
 cache.set(key,c);return c;
}
function draw(g,p){const im=sprite(p.w||42,p.h||27,p.seed??Math.round(p.x*3+p.y*7));g.save();g.imageSmoothingEnabled=false;g.drawImage(im,Math.round((p.x-im.width*1.5)/3)*3,Math.round((p.y-im.height*3)/3)*3,im.width*3,im.height*3);g.restore();}
globalThis.RockArt={sprite,draw,cache};
})();
