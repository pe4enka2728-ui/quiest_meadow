/* Remove only the baked translucent ground shadow; opaque shoes remain intact. */
(()=>{
'use strict';
const cache=new WeakMap();
function clean(im){if(!im)return im;if(cache.has(im))return cache.get(im);const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const p=g.getImageData(0,0,c.width,c.height);for(let y=Math.max(0,c.height-5);y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(p.data[i]===0&&p.data[i+1]===0&&p.data[i+2]===0&&p.data[i+3]>0&&p.data[i+3]<200)p.data[i+3]=0;}g.putImageData(p,0,0);cache.set(im,c);return c;}
function init(images){for(let i=0;i<12;i++)clean(images['teto_2_'+i]);}
globalThis.ActorSpriteArt={init,clean};
})();
