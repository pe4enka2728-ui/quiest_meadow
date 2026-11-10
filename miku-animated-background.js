/* Two smooth warped meshes with a visible purple core across display sizes. */
(()=>{
'use strict';
const W=1536,H=1024,PW=820,PH=530,PERIOD=12,CYCLE=6,TAU=Math.PI*2,SEED=0x59327;
const STYLE=Object.freeze({color:[158,98,213],coreAlpha:.60,glowAlpha:.16,lineWidth:1.8});
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return clamp(x*x*x*(x*(x*6-15)+10));};
function hash(n){n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);return ((n^(n>>>15))>>>0)/4294967296;}
function patch(t,n){
 const shifted=t+n*1.3,index=Math.floor(shifted/CYCLE),age=shifted-index*CYCLE,key=(SEED+Math.imul(index%2+1,104729)+n*328211)>>>0;
 const a=TAU*t/PERIOD+n*1.7,phase=hash(key+117)*TAU;
 return {n,index,age,phase,opacity:.12+.88*smooth(age/1.1)*(1-smooth((age-4.5)/1.15)),
  x:(n?985:420)+hash(key)*125+Math.sin(a)*17,
  y:330+hash(key+71)*275+Math.cos(a*2)*13,
  angle:a,tilt:(hash(key+31)-.5)*.22};
}
function projector(p){
 const a=p.angle,phase=p.phase,rx=.47+.23*Math.sin(a+phase),ry=(p.n?-.32:.32)+.24*Math.sin(a*2+phase),rz=p.tilt+.12*Math.sin(a+1.1);
 const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz),zoom=.91+.075*Math.sin(a+phase);
 const pressX=.26*Math.sin(a+phase),pressY=.18*Math.cos(a*2+phase),pressure=1.12+.22*Math.sin(a*2+phase);
 return (u,v)=>{
  const radius=Math.hypot(u,v),envelope=Math.max(0,1-radius*radius*.52);
  const dx=u-pressX,dy=v-pressY,bowl=-pressure*Math.exp(-(dx*dx*3.2+dy*dy*4.2));
  const traveling=.55*Math.sin(u*4.5+v*2.9-a*2+phase)+.19*Math.cos(v*5.5+a*2+phase);
  const z=(bowl+traveling)*envelope,x=u*1.48,y=v;
  const x1=x*cy+z*sy,z1=z*cy-x*sy,y2=y*cx-z1*sx,z2=y*sx+z1*cx;
  const x3=x1*cz-y2*sz,y3=x1*sz+y2*cz,d=4.9/(4.9-z2);
  const near=clamp((z2+1.9)/3.4),light=.59+.41*near;
  return {x:PW/2+x3*d*246*zoom,y:PH/2+y3*d*246*zoom,z:z2,light,radius};
 };
}
function createRenderer(canvas,{scale=1.25,yOffset=-80}={}){
 canvas.width=W;canvas.height=H;const g=canvas.getContext('2d',{alpha:false});
 const sheet=document.createElement('canvas');sheet.width=PW;sheet.height=PH;const s=sheet.getContext('2d');
 const mask=document.createElement('canvas');mask.width=PW;mask.height=PH;const m=mask.getContext('2d');m.translate(PW/2,PH/2);m.scale(PW/2,PH/2);
 const feather=m.createRadialGradient(0,0,0,0,0,1);feather.addColorStop(0,'#fff');feather.addColorStop(.24,'#fffffff5');feather.addColorStop(.53,'#ffffffa0');feather.addColorStop(.8,'#ffffff15');feather.addColorStop(.97,'#fff0');feather.addColorStop(1,'#fff0');m.fillStyle=feather;m.fillRect(-1,-1,2,2);
 function paint(p){
  s.clearRect(0,0,PW,PH);s.lineCap='round';s.lineJoin='round';const project=projector(p);
  function curve(fixed,vertical){
   const points=[];for(let i=0;i<=72;i++){const q=i/72*2-1;points.push(project(vertical?fixed:q,vertical?q:fixed));}
   const first=points[0],last=points[points.length-1],color=s.createLinearGradient(first.x,first.y,last.x,last.y);
   for(let i=0;i<=24;i++){
    const q=i/24*2-1,r=Math.hypot(q,fixed),fade=1-smooth((r-.12)/.88),point=project(vertical?fixed:q,vertical?q:fixed);
    color.addColorStop(i/24,`rgba(${STYLE.color.join(',')},${fade*point.light*STYLE.coreAlpha})`);
   }
   s.strokeStyle=color;s.lineWidth=STYLE.lineWidth;s.beginPath();points.forEach((q,i)=>i?s.lineTo(q.x,q.y):s.moveTo(q.x,q.y));s.save();s.globalAlpha=STYLE.glowAlpha;s.lineWidth=4.5;s.stroke();s.restore();s.stroke();
  }
  for(let row=1;row<22;row++)curve(row/22*2-1,false);
  for(let col=1;col<30;col++)curve(col/30*2-1,true);
  s.globalCompositeOperation='destination-in';s.drawImage(mask,0,0);s.globalCompositeOperation='source-over';
 }
 return {
  draw(t){g.fillStyle='#000';g.fillRect(0,0,W,H);const list=[patch(t,0),patch(t,1)];for(const p of list){if(p.opacity<.001)continue;paint(p);g.globalAlpha=p.opacity;g.imageSmoothingEnabled=true;g.drawImage(sheet,p.x-PW*scale/2,p.y+yOffset-PH*scale/2,PW*scale,PH*scale);g.globalAlpha=1;}return list;},
  canvas,projector,patch
 };
}
globalThis.MikuAnimatedBackground={createRenderer,patch,projector,style:STYLE,period:PERIOD};
})();
