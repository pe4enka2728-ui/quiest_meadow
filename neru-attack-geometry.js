/* Closed, double-sided meshes shared by collision and drawing. */
(()=>{
'use strict';const TAU=Math.PI*2;
function rotate(p,a){let [x,y,z]=p;const [cx,sx,cy,sy,cz,sz]=[Math.cos(a[0]),Math.sin(a[0]),Math.cos(a[1]),Math.sin(a[1]),Math.cos(a[2]),Math.sin(a[2])];[y,z]=[y*cx-z*sx,y*sx+z*cx];[x,z]=[x*cy+z*sy,-x*sy+z*cy];return [x*cz-y*sz,x*sz+y*cz,z];}
function inverseRotate(p,a){let [x,y,z]=p,c=Math.cos(a[2]),s=Math.sin(a[2]);[x,y]=[x*c+y*s,-x*s+y*c];c=Math.cos(a[1]);s=Math.sin(a[1]);[x,z]=[x*c-z*s,x*s+z*c];c=Math.cos(a[0]);s=Math.sin(a[0]);return [x,y*c+z*s,-y*s+z*c];}
function cube(h=.62){return {vertices:[[-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],[-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]],faces:[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]};}
function octa(r=.78){return {vertices:[[r,0,0],[-r,0,0],[0,r,0],[0,-r,0],[0,0,r*1.5],[0,0,-r*1.5]],faces:[[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]]};}
function icosa(r=.9){const f=(1+Math.sqrt(5))/2,raw=[[-1,f,0],[1,f,0],[-1,-f,0],[1,-f,0],[0,-1,f],[0,1,f],[0,-1,-f],[0,1,-f],[f,0,-1],[f,0,1],[-f,0,-1],[-f,0,1]],n=Math.hypot(1,f);return {vertices:raw.map(p=>p.map(v=>v*r/n)),faces:[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]]};}
function torus(R=1.25,r=.17,n=32,m=8){const vertices=[],faces=[];for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i/n*TAU,b=j/m*TAU;vertices.push([(R+r*Math.cos(b))*Math.cos(a),(R+r*Math.cos(b))*Math.sin(a),r*Math.sin(b)]);}for(let i=0;i<n;i++)for(let j=0;j<m;j++)faces.push([i*m+j,((i+1)%n)*m+j,((i+1)%n)*m+(j+1)%m,i*m+(j+1)%m]);return {vertices,faces};}
function coin(){const n=20,vertices=[],faces=[];for(const d of [-.08,.08])for(let i=0;i<n;i++)vertices.push([Math.cos(i/n*TAU)*.58,d,Math.sin(i/n*TAU)*.58]);faces.push(Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>i+n));for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);return {vertices,faces};}
const torusBase=torus(),coinBase=coin(),shardBase={vertices:[[0,0,.35],[-.2,-.16,-.12],[.2,-.16,-.12],[0,.22,-.12]],faces:[[0,1,2],[0,2,3],[0,3,1],[1,3,2]]};
function mesh(e){let base=e.kind==='torus'?torusBase:e.kind==='coin'?coinBase:e.kind==='octa'?octa(e.radius||.78):e.kind==='sun'?icosa(.9):e.kind==='shard'?shardBase:cube(e.half||.62),scale=e.scale??1;return {vertices:base.vertices.map(v=>{const q=rotate(v.map(n=>n*scale),e.rotation||[0,0,0]);return [q[0]+e.x,q[1]+e.y,q[2]+(e.z||0)];}),faces:base.faces};}
function edges(m){const list=[],seen=new Set();for(const f of m.faces)for(let j=0;j<f.length;j++){const a=f[j],b=f[(j+1)%f.length],key=[Math.min(a,b),Math.max(a,b)].join(':');if(!seen.has(key)){seen.add(key);list.push([m.vertices[a],m.vertices[b]]);}}return list;}
function segmentDistance(p,a,b){const d=a.map((v,i)=>b[i]-v),n=d.reduce((s,v)=>s+v*v,0),t=Math.max(0,Math.min(1,p.reduce((s,v,i)=>s+(v-a[i])*d[i],0)/(n||1)));return Math.hypot(...p.map((v,i)=>v-a[i]-d[i]*t));}
function cubeHit(e,p){const q=inverseRotate([p.x-e.x,p.y-e.y,p.z+.36-e.z],e.rotation||[0,0,0]);return Math.hypot(...q.map(v=>Math.max(0,Math.abs(v)-(e.half||.62))))<.25;}
function torusHit(e,p){const q=inverseRotate([p.x-e.x,p.y-e.y,p.z+.42-e.z],e.rotation);return Math.hypot(Math.hypot(q[0],q[1])-1.25,q[2])<.17+.21;}
globalThis.NeruAttackGeometry={rotate,inverseRotate,cube,octa,icosa,torus,coin,mesh,edges,segmentDistance,cubeHit,torusHit};
})();
