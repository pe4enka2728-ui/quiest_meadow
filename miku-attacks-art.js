/* Canvas renderer of the same world geometry used for collision in attack-model.js. */
(()=>{
'use strict';
const W=1536,H=1024,TAU=Math.PI*2;
function project(x,y,z=0){const v=y/8;return [768+x/12*(670+380*v),440+240*v-z*32];}
function clipSegment(a,b){let lo=0,hi=1;const dx=b[0]-a[0],dy=b[1]-a[1];for(const [p,q]of [[-dx,a[0]+7],[dx,7-a[0]],[-dy,a[1]+1],[dy,9-a[1]]]){if(Math.abs(p)<1e-10){if(q<0)return null;}else{const r=q/p;if(p<0)lo=Math.max(lo,r);else hi=Math.min(hi,r);if(lo>hi)return null;}}return [[a[0]+dx*lo,a[1]+dy*lo],[a[0]+dx*hi,a[1]+dy*hi]];}
function polygon(g,points,fill,stroke=null,width=2){g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function worldCircle(x,y,r,z=0,count=48,start=0,end=TAU){return Array.from({length:count+1},(_,i)=>project(x+Math.cos(start+(end-start)*i/count)*r,y+Math.sin(start+(end-start)*i/count)*r,z));}
function stroke(g,points,color='#fff',width=2,dash=[]){g.strokeStyle=color;g.lineWidth=width;g.setLineDash(dash);g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke();g.setLineDash([]);}
function floorPath(g){const p=[project(-6,0),project(6,0),project(6,8),project(-6,8)];g.beginPath();p.forEach((v,i)=>i?g.lineTo(...v):g.moveTo(...v));g.closePath();}
function capsule(g,e,fill,strokeColor=null){const clipped=clipSegment(e.a,e.b);if(!clipped)return;const [a,b]=clipped,angle=Math.atan2(b[1]-a[1],b[0]-a[0]),points=[];for(let i=0;i<=12;i++){const t=angle-Math.PI/2+i*Math.PI/12;points.push(project(b[0]+Math.cos(t)*e.r,b[1]+Math.sin(t)*e.r));}for(let i=0;i<=12;i++){const t=angle+Math.PI/2+i*Math.PI/12;points.push(project(a[0]+Math.cos(t)*e.r,a[1]+Math.sin(t)*e.r));}polygon(g,points,fill,strokeColor,1.4);}
function arrow(g,a,b,alpha=.4){const clipped=clipSegment(a,b);if(!clipped)return;g.save();g.globalAlpha*=alpha;const p=project(...clipped[0]),q=project(...clipped[1]);stroke(g,[p,q],'#fff',2,[9,9]);const d=Math.atan2(q[1]-p[1],q[0]-p[0]);stroke(g,[[q[0]-Math.cos(d-.6)*13,q[1]-Math.sin(d-.6)*13],q,[q[0]-Math.cos(d+.6)*13,q[1]-Math.sin(d+.6)*13]],'#fff',2);g.restore();}
function ring(g,e){if(e.r<.01)return;const gap=e.gapHalf||0,start=(e.gapAngle||0)+gap,end=start+TAU-gap*2;const outer=worldCircle(e.x,e.y,e.r+e.thickness,0,96,start,end),inner=worldCircle(e.x,e.y,Math.max(0,e.r-e.thickness),0,96,end,start);polygon(g,[...outer,...inner],'rgba(255,255,255,.83)');}
/* The projection's true camera depth is world Y. Split at the sprite plane. */
function splitEdge(a,b,depth){
 if((a[1]-depth)*(b[1]-depth)< -1e-10){const u=(depth-a[1])/(b[1]-a[1]),q=a.map((n,i)=>n+(b[i]-n)*u);return [[a,q],[q,b]];}
 return [[a,b]];
}
function clipFace(points,depth,front){
 const result=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ina=front?a[1]>=depth:a[1]<=depth,inb=front?b[1]>=depth:b[1]<=depth;
  if(ina)result.push(a);if(ina!==inb){const u=(depth-a[1])/(b[1]-a[1]);result.push(a.map((n,j)=>n+(b[j]-n)*u));}
 }
 return result;
}
function depthCommands(entities,player){
 const commands=[],depth=player.y;
 function edge(a,b,color,width,fade,id){for(const pair of splitEdge(a,b,depth))commands.push({type:'edge',a:pair[0],b:pair[1],depth:(pair[0][1]+pair[1][1])/2,color,width,fade,id});}
 for(const e of entities){
  const fade=e.fade??1;
  if(e.shape==='torus'){
   const basis=[[1,0,0],[0,1,0],[0,0,1]].map(p=>MikuAttackLab.rotate(p,e.rotation)),point=(a,b)=>{const local=[(e.major+e.minor*Math.cos(b))*Math.cos(a),(e.major+e.minor*Math.cos(b))*Math.sin(a),e.minor*Math.sin(b)];return [0,1,2].map(i=>basis[0][i]*local[0]+basis[1][i]*local[1]+basis[2][i]*local[2]+[e.x,e.y,e.z][i]);};
   for(let n=0;n<20;n++){const a=n/20*TAU;let previous=point(a,0);for(let i=1;i<=12;i++){const q=point(a,i/12*TAU);edge(previous,q,'rgba(255,255,255,.4)',1.3,fade,e.id);previous=q;}}
   for(let n=0;n<6;n++){const b=n/6*TAU;let previous=point(0,b);for(let i=1;i<=64;i++){const q=point(i/64*TAU,b);edge(previous,q,n%3===0?'#fff':'rgba(255,255,255,.53)',1.8,fade,e.id);previous=q;}}
  }else if(['cube','tetra','octa','cylinder','icosa'].includes(e.shape)){
   const m=e.vertices?e:MikuAttackLab.polyMesh(e),vertices=m.vertices,faces=m.faces||(e.shape==='tetra'?MikuAttackLab.tetraFaces:[]),edges=new Map();
   for(const f of faces){const points=f.map(i=>vertices[i]);for(const front of [false,true]){const clipped=clipFace(points,depth,front);if(clipped.length>=3)commands.push({type:'face',points:clipped,depth:clipped.reduce((s,p)=>s+p[1],0)/clipped.length,fade,id:e.id});}
    for(let k=0;k<f.length;k++){const a=f[k],b=f[(k+1)%f.length],key=[Math.min(a,b),Math.max(a,b)].join(':');if(!edges.has(key))edges.set(key,[vertices[a],vertices[b]]);}
   }
   for(const [a,b]of edges.values())edge(a,b,'rgba(255,255,255,.86)',2.1,fade,e.id);
  }else if(['double','echo-source','glyph','note','chaser','mine'].includes(e.kind))commands.push({type:'sprite',e,depth:e.y});
 }
 commands.push({type:'player',depth});commands.sort((a,b)=>a.depth-b.depth||(a.type==='face'?-1:b.type==='face'?1:0));return commands;
}
function shadow(g,e){g.save();g.globalAlpha*=.16;polygon(g,worldCircle(e.x,e.y,e.kind==='torus'?e.major:e.kind==='cylinder'?e.half:e.radius||.85),null,'#fff',2);g.restore();}
class Renderer{
 constructor(canvas,images){this.canvas=canvas;this.g=canvas.getContext('2d');this.images=images;this.ghosts=new Map();this.echo=null;this.lowMotion=false;this.occlusion={};}
 silhouette(frame,color='#fff'){const key=frame+color;if(this.ghosts.has(key))return this.ghosts.get(key);const im=ActorSpriteArt.clean(this.images['teto_2_'+frame]),c=document.createElement('canvas');c.width=24;c.height=32;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,24,32);this.ghosts.set(key,c);return c;}
 echoImage(){if(this.echo)return this.echo;const c=document.createElement('canvas');c.width=160;c.height=300;const g=c.getContext('2d');PreparedMikuArt.draw(g,0,80,294,280);g.globalCompositeOperation='source-in';g.fillStyle='#0a0a0a';g.fillRect(0,0,160,300);g.globalCompositeOperation='source-over';g.fillStyle='#fff';g.fillRect(64,49,9,4);g.fillRect(83,49,9,4);this.echo=c;return c;}
 ground(e,t){const g=this.g;g.save();if(e.fade!==undefined)g.globalAlpha*=Math.max(0,e.fade);
  if(e.kind==='warning'){g.globalAlpha*=.22+.5*(e.progress||0);stroke(g,worldCircle(e.x,e.y,e.r),'#fff',2,[6,7]);if(!e.intro){stroke(g,[project(e.x-.15,e.y),project(e.x+.15,e.y)],'#fff',2);stroke(g,[project(e.x,e.y-.15),project(e.x,e.y+.15)],'#fff',2);}}
  else if(e.kind==='aim')arrow(g,e.a,e.b,.25+.5*Math.min(1,e.progress||0));
  else if(e.kind==='gate-warning'){
   const side=e.axis!=='y',r=e.axis==='rx',a=side?[r?5.7:-5.7,.5]:[-5.7,.3],b=side?[r?5.7:-5.7,7.7]:[5.7,.3];
   g.globalAlpha*=.45;stroke(g,[project(...a),project(...b)],'#fff',2,[7,8]);const from=side?[r?5.6:-5.6,e.gap]:[e.gap,.35],to=side?[r?3.6:-3.6,e.gap]:[e.gap,2.0];arrow(g,from,to,1);
  }
  else if(e.kind==='ring')ring(g,e);
  else if(['trail','cut','needle','echo-beam','staff-wave'].includes(e.kind))capsule(g,e,e.kind==='trail'?`rgba(255,255,255,${.17+.5*(e.fade||0)})`:'rgba(255,255,255,.86)');
  else if(e.kind==='staff'){g.globalAlpha*=.12;stroke(g,[project(...e.a),project(...e.b)],'#fff',1.3);}
  else if(e.kind==='safe-window'){
   const safe=Array.from({length:73},(_,i)=>project(e.x+Math.cos(i/72*TAU)*e.rx,e.y+Math.sin(i/72*TAU)*e.ry));
   if(e.active){g.beginPath();[project(-6,0),project(6,0),project(6,8),project(-6,8)].forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();safe.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fillStyle='rgba(255,255,255,.055)';g.fill('evenodd');
    for(let y=.5;y<8;y+=.65)for(let x=-5.8;x<6;x+=.8)if(Math.hypot((x-e.x)/e.rx,(y-e.y)/e.ry)>1.07){const p=project(x,y);g.fillStyle='rgba(255,255,255,.24)';g.fillRect(p[0],p[1],2,2);}
   }
   stroke(g,safe,e.active?'#fff':'rgba(255,255,255,.45)',e.active?3:2,e.active?[]:[8,8]);
  }
  else if(['cube','tetra','torus','octa','cylinder','icosa'].includes(e.kind))shadow(g,e);
  else if(e.kind==='mine'){
   const r=e.armed?.45+(e.progress||0)*.7:.45;g.globalAlpha*=e.armed?.8:.34;stroke(g,worldCircle(e.x,e.y,r),'#fff',1.7,e.armed?[]:[4,5]);
  }
  else if(e.kind==='gap-guide'){const r=2.2;g.globalAlpha*=.18;arrow(g,[e.x,e.y],[e.x+Math.cos(e.angle)*r,e.y+Math.sin(e.angle)*r],1);}
  g.restore();
 }
 solid(e,t){const g=this.g;g.save();
  if(e.kind==='double'){const p=project(e.x,e.y);g.globalAlpha*=.55;g.imageSmoothingEnabled=false;g.drawImage(this.silhouette(7),Math.round(p[0]-36),Math.round(p[1]-96),72,96);}
  else if(e.kind==='echo-source'){const p=project(e.x,e.y);g.globalAlpha*=(e.looking?.9:.32)*(e.fade??1);g.shadowColor='#fff';g.shadowBlur=e.looking?3:0;g.imageSmoothingEnabled=false;g.drawImage(this.echoImage(),p[0]-36,p[1]-135,72,135);}
  else if(['glyph','note','chaser','mine'].includes(e.kind)){
   const p=project(e.x,e.y,e.drawZ??.12);g.globalAlpha*=e.kind==='mine'?(e.armed?.9:.42):1;
   if(e.kind==='chaser'){polygon(g,worldCircle(e.x,e.y,e.r+.08),null,'rgba(255,255,255,.55)',1.6);g.font='36px QuietMeadowPixel,monospace';}
   else g.font=(e.frozen?'30':'28')+'px QuietMeadowPixel,monospace';
   g.fillStyle=e.frozen?'#a0a0a0':'#fff';g.textAlign='center';g.textBaseline='bottom';g.fillText(e.glyph||'♪',p[0],p[1]);
   if(e.returning||e.waiting){g.font='19px monospace';g.fillText('↑',p[0],p[1]-29);}
  }
  g.restore();
 }
 player(sim,alpha){const g=this.g,p=sim.player,[x,y]=project(p.x,p.y),jumped=project(p.x,p.y,p.z),offset=p.walk>0?[1,0,1,2][Math.floor(p.walk/12)%4]:1,frame=p.dir*3+offset;
  g.save();const inherited=g.globalAlpha;g.globalAlpha=inherited*alpha*.24;g.fillStyle='#fff';g.beginPath();g.ellipse(x,y+2,19,5,0,0,TAU);g.fill();g.globalAlpha=inherited*alpha*(sim.clock-sim.lastHit<1.1?(Math.sin(sim.clock*34)>0?.55:1):1);g.imageSmoothingEnabled=false;g.drawImage(ActorSpriteArt.clean(this.images['teto_2_'+frame]),Math.round(jumped[0]-36),Math.round(jumped[1]-96),72,96);
  if(sim.clock-sim.lastHit<.7){g.globalAlpha=inherited*alpha;g.fillStyle='#fff';g.font='25px QuietMeadowPixel,monospace';g.textAlign='center';g.fillText(sim.invulnerable?'КАСАНИЕ':'−'+sim.lastDamage,x,y-110-(sim.clock-sim.lastHit)*32);}g.restore();
 }
 hitboxes(sim){const g=this.g;g.save();g.globalAlpha=.5;g.setLineDash([3,5]);for(const e of sim.attack.entities){if(!e.active)continue;if(e.shape==='circle')stroke(g,worldCircle(e.x,e.y,e.r),'#d1b7e9',1.5,[3,5]);if(e.shape==='segment')capsule(g,e,null,'#d1b7e9');}const p=sim.player;stroke(g,worldCircle(p.x,p.y,MikuAttackLab.arena.radius,p.z),'#d1b7e9',2);g.restore();}
 draw(sim,clock,{alpha=1,hitboxes=false,hints=false,enemyOffset=[0,0]}={}){
  const g=this.g,key=[clock,sim.clock,alpha,hitboxes,...enemyOffset,sim.player.x,sim.player.y,sim.player.z,sim.attack.entities.length].join(':');if(this.lastSim===sim&&this.lastKey===key)return;this.lastSim=sim;this.lastKey=key;MikuBackdropArt.drawBehind(this.canvas,clock);g.clearRect(0,0,W,H);
  if(alpha>0){g.save();g.globalAlpha=alpha;floorPath(g);g.fillStyle='#000';g.fill();g.strokeStyle='#fff';g.lineWidth=2.5;g.stroke();g.save();floorPath(g);g.clip();for(const e of sim.attack.entities)this.ground(e,clock);g.restore();g.restore();}
  g.save();g.translate(...enemyOffset);PreparedMikuArt.draw(g,clock,768,414,286,'497');g.restore();
  if(alpha>0){
   g.save();g.globalAlpha=alpha;const commands=depthCommands(sim.attack.entities,sim.player),at=commands.findIndex(c=>c.type==='player');
   this.occlusion={playerDepth:sim.player.y,before:commands.slice(0,at).filter(c=>c.type==='edge').length,after:commands.slice(at+1).filter(c=>c.type==='edge').length,incorrect:commands.some((c,i)=>c.type==='edge'&&(i<at?Math.max(c.a[1],c.b[1])>sim.player.y+1e-8:Math.min(c.a[1],c.b[1])<sim.player.y-1e-8))};
   for(let i=0;i<commands.length;){const c=commands[i];
    if(c.type==='edge'){
     const batches=new Map();while(i<commands.length&&commands[i].type==='edge'){const q=commands[i++],key=[q.color,q.width,q.fade??1].join('|');if(!batches.has(key))batches.set(key,{color:q.color,width:q.width,fade:q.fade??1,edges:[]});batches.get(key).edges.push(q);}
     for(const batch of batches.values()){g.save();g.globalAlpha*=batch.fade;g.strokeStyle=batch.color;g.lineWidth=batch.width;g.beginPath();for(const q of batch.edges){g.moveTo(...project(...q.a));g.lineTo(...project(...q.b));}g.stroke();g.restore();}
    }else{if(c.type==='player')this.player(sim,1);else if(c.type==='sprite')this.solid(c.e,clock);else{g.save();g.globalAlpha*=c.fade??1;polygon(g,c.points.map(p=>project(...p)),'rgba(0,0,0,.94)');g.restore();}i++;}
   }
   if(hitboxes)this.hitboxes(sim);g.restore();
  }
  if(hints){g.save();g.fillStyle='rgba(255,255,255,.38)';g.font='19px QuietMeadowPixel,monospace';g.textAlign='center';g.fillText('WASD / СТРЕЛКИ — ДВИЖЕНИЕ     ПРОБЕЛ — ПРЫЖОК',768,968);g.restore();}
 }
}
globalThis.MikuAttackArt={Renderer,project,worldCircle,depthCommands,splitEdge,clipFace};
})();
