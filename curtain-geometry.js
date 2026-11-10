/* Cloth retreats along the elliptical rail instead of translating out of the stage. */
(()=>{
const clamp=n=>Math.max(0,Math.min(1,n));
function point(p,theta){return [p.cx-Math.cos(theta)*p.rx,p.cy+Math.sin(theta)*p.ry];}
function panels(p,opening=0){const q=clamp(opening),compression=1-q*.78,out=[],count=96;
 for(let i=0;i<count;i++){const a=i*Math.PI/count,b=(i+1)*Math.PI/count,side=i<count/2?-1:1,map=t=>side<0?t*compression:Math.PI-(Math.PI-t)*compression,first=point(p,map(a)),last=point(p,map(b));out.push({index:i,side,a:map(a),b:map(b),depth:(first[1]+last[1])/2,points:[first,last,[last[0],last[1]-p.height],[first[0],first[1]-p.height]],light:.5+.5*Math.cos(i*.65),compression});}
 return out.sort((a,b)=>a.depth-b.depth||a.index-b.index);
}
globalThis.CurtainGeometry={point,panels};
})();
