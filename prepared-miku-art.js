/* Original prepared Miku SpriteSkin renderer, adapted from gumi-animation-preview/preview.js. */
(()=>{
'use strict';
let rig,images={};
const mm=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
function sample(clip,t){const f=(clip.duration?t%clip.duration:0)*clip.fps,a=Math.min(clip.samples.length-1,Math.floor(f)),b=Math.min(a+1,clip.samples.length-1),k=f-a;return clip.samples[a].map((v,i)=>v+(clip.samples[b][i]-v)*k)}
function sourceFace(clip,t){const b=clip.bindings.find(b=>b.type===114),f=Math.min(clip.samples.length-1,Math.floor((clip.duration?t%clip.duration:0)*clip.fps));if(!b)return 'head';const raw=new DataView(new ArrayBuffer(4));raw.setFloat32(0,clip.samples[f][b.offset],true);return rig.faceKeys[String(raw.getUint32(0,true))]||'head'}
function skeleton(model,clip,t){const poses=model.nodes.map(n=>({x:n.position.x,y:n.position.y,r:n.rotation,sx:n.scale.x,sy:n.scale.y})),map=new Map(model.nodes.map((n,i)=>[n.path,i])),values=sample(clip,t);
 for(const b of clip.bindings){const i=map.get(b.path);if(i===undefined||b.type!==4)continue;const p=poses[i];if(b.attribute===4)p.r=values[b.offset+2];else if(b.attribute===1){p.x=values[b.offset];p.y=values[b.offset+1]}else if(b.attribute===3){p.sx=values[b.offset];p.sy=values[b.offset+1]}}
 const matrices=[];poses.forEach((p,i)=>{const r=p.r*Math.PI/180,c=Math.cos(r),s=Math.sin(r),m=[c*p.sx,s*p.sx,-s*p.sy,c*p.sy,p.x,p.y];matrices.push(model.nodes[i].parent<0?m:mm(matrices[model.nodes[i].parent],m))});return matrices;
}
function triangle(g,img,src,dst){const [a,b,c]=src,[p,q,r]=dst,den=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);if(Math.abs(den)<1e-8)return;
 const m00=((q[0]-p[0])*(c[1]-a[1])-(r[0]-p[0])*(b[1]-a[1]))/den,m01=((r[0]-p[0])*(b[0]-a[0])-(q[0]-p[0])*(c[0]-a[0]))/den,m10=((q[1]-p[1])*(c[1]-a[1])-(r[1]-p[1])*(b[1]-a[1]))/den,m11=((r[1]-p[1])*(b[0]-a[0])-(q[1]-p[1])*(c[0]-a[0]))/den;
 g.save();const center=[(p[0]+q[0]+r[0])/3,(p[1]+q[1]+r[1])/3];g.beginPath();[p,q,r].forEach((v,i)=>{const dx=v[0]-center[0],dy=v[1]-center[1],d=Math.hypot(dx,dy)||1,x=v[0]+dx/d*.12,y=v[1]+dy/d*.12;i?g.lineTo(x,y):g.moveTo(x,y)});g.closePath();g.clip();g.transform(m00,m10,m01,m11,p[0]-m00*a[0]-m01*a[1],p[1]-m10*a[0]-m11*a[1]);g.drawImage(img,0,0);g.restore();
}
function drawMiku(g,t,clipId='497'){const model=clipId==='498'?rig.insane:rig.normal,clip=rig.clips[clipId],matrices=skeleton(model,clip,t),requested=sourceFace(clip,t),heads=model.parts.filter(p=>p.name.startsWith('head')),face=(heads.find(p=>p.name===requested)||heads.find(p=>p.active)||heads[0])?.name,parts=model.parts.filter(p=>p.name.startsWith('head')?p.name===face:p.active).sort((a,b)=>(a.name.startsWith('head')?100:a.order)-(b.name.startsWith('head')?100:b.order));
 g.imageSmoothingEnabled=false;for(const p of parts){const img=images[p.texture],vertices=p.vertices.map(v=>{let x=0,y=0;if(p.bones.length&&p.binds.length){for(let k=0;k<4;k++){const w=v.weights[k]||0;if(!w)continue;const bind=p.binds[v.indices[k]],m=matrices[p.bones[v.indices[k]]];const q=point(m,bind.e00*v.p[0]+bind.e01*v.p[1]+bind.e03,bind.e10*v.p[0]+bind.e11*v.p[1]+bind.e13);x+=q[0]*w;y+=q[1]*w}}else{[x,y]=point(matrices[p.node],v.p[0],v.p[1])}return [100+x*16,124-y*16]});
  for(let k=0;k<p.triangles.length;k+=3){const ids=p.triangles.slice(k,k+3);triangle(g,img,ids.map(i=>[p.vertices[i].uv[0]*img.width,(1-p.vertices[i].uv[1])*img.height]),ids.map(i=>vertices[i]))}
 }return {clip:clipId,model:clipId==='498'?'insane':'normal',face,headCount:parts.filter(p=>p.name.startsWith('head')).length};
}

const frames=new Map(),boxes=new Map();
function frame(t,clip='497'){const data=rig.clips[clip],key=clip+':'+Math.floor((data.duration?t%data.duration:0)*data.fps);if(frames.has(key))return frames.get(key);const c=document.createElement('canvas');c.width=200;c.height=212;const state=drawMiku(c.getContext('2d'),t,clip);frames.set(key,c);if(frames.size>12)frames.delete(frames.keys().next().value);return c;}
function box(clip){if(boxes.has(clip))return boxes.get(clip);const c=frame(0,clip),p=c.getContext('2d').getImageData(0,0,200,212).data;let l=200,r=0,top=212,b=0;for(let y=0;y<212;y++)for(let x=0;x<200;x++)if(p[(y*200+x)*4+3]>20){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);b=Math.max(b,y);}const result={x:Math.max(0,l-7),y:Math.max(0,top-7),w:Math.min(200,r+8)-Math.max(0,l-7),h:b+1-Math.max(0,top-7)};boxes.set(clip,result);return result;}
function draw(g,t,x,y,height=270,clip='497'){const b=box(clip),im=frame(t,clip),w=b.w/b.h*height;g.save();g.imageSmoothingEnabled=false;g.drawImage(im,b.x,b.y,b.w,b.h,Math.round(x-w/2),Math.round(y-height),w,height);g.restore();}
globalThis.PreparedMikuArt={init(textures){rig=MikuOriginalRigData;images={78:textures.mikuPreparedNormal,77:textures.mikuPreparedInsane};frames.clear();boxes.clear();box('497');},draw,sample,skeleton,sourceFace,status(t=0){const clip=rig.clips['497'];return {source:rig.source,clip:'mesme_miku_bones',duration:clip.duration,face:sourceFace(clip,t),parts:rig.normal.parts.length,box:box('497')};}};
})();
