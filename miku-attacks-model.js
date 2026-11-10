/* Checked Miku patterns v2, integrated into release 0.44. Pure world geometry; no DOM. */
(()=>{
'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const arena=Object.freeze({minX:-5.52,maxX:5.52,minY:.8,maxY:7.68,radius:.2,bodyHeight:1.45,jumpDuration:.9,jumpHeight:1.8,speedX:4.2,speedY:4.8});
const definitions=[
 [1,'phrase','Сломанная фаза',8,'Пачки по 2–3 быстрые волны. Высокие ряды обходи через просвет; низкие можно перепрыгнуть.'],
 [2,'pulse','Неслышный пульс',8.8,'Волны идут из двух точек. Разрывов нет: следи за обоими источниками и прыгай.'],
 [4,'cut','Срез кадра',9,'Прежние диагональные полосы. Сценарий повторяется, фаза длится вдвое дольше.'],
 [5,'cubes','Кубы нулевой памяти',10.8,'Каждый отскок выпускает волну на 5 HP. Тени заранее показывают приземление.'],
 [6,'prisms','Призмы разлома',10.5,'Одна призма бьёт дважды, затем вторая присоединяется и волны идут синхронно.'],
 [7,'orbit','Перекошенная орбита',10.5,'Три тора плавно появляются и исчезают. Держись в просветах; учитывай высоту колец.'],
 [8,'metronome','Сбитый метроном',9,'Ускоренная стрелка. Предупреждение сохраняется перед каждым разворотом.'],
 [10,'refrain','Прилипчивый припев',10.5,'Две ноты преследуют Тето и по очереди делают заранее отмеченные рывки.'],
 [12,'rest','Пустой такт',10,'Окно движется вдвое быстрее. Каждую секунду с новой стороны прилетает нота на 10 HP.'],
 [14,'canon','Обратный канон',9,'Очереди быстрее. 70% волн высокие: их нужно обходить через просвет, а не прыгать.'],
 [15,'spiral','Слепая спираль',10,'Пять густых потоков. Иди вместе с разрывом или перепрыгивай ближайшую цепочку.'],
 [16,'shadows','Немые тени',9,'После двух первых залпов появляются ещё две Мику. Уходи с зафиксированных линий.'],
 [18,'octahedra','Гранёный резонанс',9,'Два вращающихся октаэдра пересекают поле. Смотри на тени и обходи низкие пролёты.'],
 [19,'cylinders','Валы сигнала',10,'Объёмные цилиндры катятся с разных сторон. Низкий вал можно перепрыгнуть.'],
 [20,'icosahedron','Сердце пустоты',11,'Икосаэдр пульсирует и опускается к метке. Уйди из-под фигуры, затем прыгай через волну.']
].map(v=>Object.freeze({number:v[0],id:v[1],name:v[2],baseDuration:v[3],duration:v[3]*2,hint:v[4],threeD:[5,6,7,18,19,20].includes(v[0])}));
const passiveDefinitions=Object.freeze([{number:3,id:'double',name:'Запоздалый двойник',chance:.2},{number:17,id:'mines',name:'Недопетые ноты',chance:.2}]);
const alphabet='!@#$%^&*';
function rotate(p,a=[0,0,0]){let [x,y,z]=p;let c=Math.cos(a[0]),s=Math.sin(a[0]);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(a[1]);s=Math.sin(a[1]);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(a[2]);s=Math.sin(a[2]);return [x*c-y*s,x*s+y*c,z];}
function inverse(p,a=[0,0,0]){let [x,y,z]=p,c=Math.cos(a[2]),s=Math.sin(a[2]);[x,y]=[x*c+y*s,-x*s+y*c];c=Math.cos(a[1]);s=Math.sin(a[1]);[x,z]=[x*c-z*s,x*s+z*c];c=Math.cos(a[0]);s=Math.sin(a[0]);return [x,y*c+z*s,-y*s+z*c];}
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a),angleDist=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],q=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-a[0]-q*dx,y-a[1]-q*dy);}
function triangleDistance(p,a,b,c){
 const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);if(d1<=0&&d2<=0)return norm(ap);
 const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return norm(bp);
 const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0)return norm(sub(p,add(a,ab.map(v=>v*d1/(d1-d3)))));
 const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return norm(cp);
 const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0)return norm(sub(p,add(a,ac.map(v=>v*d2/(d2-d6)))));
 const va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0)return norm(sub(p,add(b,sub(c,b).map(v=>v*(d4-d3)/(d4-d3+d5-d6)))));
 const n=cross(ab,ac);return Math.abs(dot(ap,n))/(norm(n)||1);
}
const tetraLocal=[[0,0,-1.1],[-.8,-.55,.7],[.8,-.55,.7],[0,.85,.7]],tetraFaces=[[0,2,1],[0,1,3],[0,3,2],[1,2,3]];
function tetraVertices(e){return tetraLocal.map(p=>add(rotate(p,e.rotation),[e.x,e.y,e.z]));}
function inTetra(p,vs){const center=vs.reduce((a,v)=>a.map((n,i)=>n+v[i]/4),[0,0,0]);return tetraFaces.every(f=>{const a=vs[f[0]],n=cross(sub(vs[f[1]],a),sub(vs[f[2]],a));return dot(sub(p,a),n)*dot(sub(center,a),n)>=-1e-9;});}
const cubeFaces=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]];
const octaLocal=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],octaFaces=[[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]];
const phi=(1+Math.sqrt(5))/2,icoLocal=[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].map(p=>p.map(n=>n/Math.hypot(1,phi)));
const icoFaces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
function polyMesh(e){
 let local,faces;if(e.shape==='cube'){const h=e.half;local=[[-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],[-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]];faces=cubeFaces;}
 else if(e.shape==='tetra'){local=tetraLocal;faces=tetraFaces;}
 else if(e.shape==='octa'){local=octaLocal.map(p=>p.map(n=>n*e.radius));faces=octaFaces;}
 else if(e.shape==='icosa'){local=icoLocal.map(p=>p.map(n=>n*e.radius));faces=icoFaces;}
 else if(e.shape==='cylinder'){local=[];faces=[];const count=24;for(let end=0;end<2;end++)for(let i=0;i<count;i++)local.push([(end?1:-1)*e.half,Math.cos(i/count*TAU)*e.radius,Math.sin(i/count*TAU)*e.radius]);for(let i=0;i<count;i++)faces.push([i,(i+1)%count,(i+1)%count+count,i+count]);faces.push(Array.from({length:count},(_,i)=>count-1-i),Array.from({length:count},(_,i)=>i+count));}
 else return {vertices:[],faces:[]};
 return {vertices:local.map(p=>add(rotate(p,e.rotation),[e.x,e.y,e.z])),faces};
}
function insidePoly(p,vs,faces){const center=vs.reduce((a,v)=>a.map((n,i)=>n+v[i]/vs.length),[0,0,0]);return faces.every(f=>{const a=vs[f[0]],n=cross(sub(vs[f[1]],a),sub(vs[f[2]],a));return dot(sub(p,a),n)*dot(sub(center,a),n)>=-1e-9;});}
function volumeHit(e,p){
 for(let i=0;i<=10;i++){
  const point=[p.x,p.y,p.z+arena.bodyHeight*i/10],q=inverse(sub(point,[e.x,e.y,e.z]),e.rotation);
  if(e.shape==='cube'){if(Math.hypot(...q.map(v=>Math.max(0,Math.abs(v)-e.half)))<=arena.radius)return true;}
  if(e.shape==='torus'){if(Math.hypot(Math.hypot(q[0],q[1])-e.major,q[2])<=e.minor+arena.radius)return true;}
  if(e.shape==='cylinder'){if(Math.hypot(Math.max(0,Math.abs(q[0])-e.half),Math.max(0,Math.hypot(q[1],q[2])-e.radius))<=arena.radius)return true;}
  if(['tetra','octa','icosa'].includes(e.shape)){
   const m=e.vertices?e:polyMesh(e),vs=m.vertices,faces=m.faces||(e.shape==='tetra'?tetraFaces:[]);if(insidePoly(point,vs,faces))return true;
   if(faces.some(f=>{for(let k=1;k<f.length-1;k++)if(triangleDistance(point,vs[f[0]],vs[f[k]],vs[f[k+1]])<=arena.radius)return true;return false;}))return true;
  }
 }
 return false;
}
function collides(e,p){
 if(!e.active)return false;if(['cube','tetra','torus','octa','cylinder','icosa'].includes(e.shape)){
 const bound=e.shape==='cube'?e.half*Math.sqrt(3):e.shape==='tetra'?1.3:e.shape==='torus'?e.major+e.minor:e.shape==='cylinder'?Math.hypot(e.half,e.radius):e.radius;
 if(Math.hypot(p.x-e.x,p.y-e.y)>bound+arena.radius||p.z>e.z+bound+arena.radius||p.z+arena.bodyHeight<e.z-bound-arena.radius)return false;
 return volumeHit(e,p);
 }
 if(p.z>(e.z1??.8)||p.z+arena.bodyHeight<(e.z0??0))return false;
 const r=arena.radius;
 if(e.shape==='circle')return Math.hypot(p.x-e.x,p.y-e.y)<=r+e.r;
 if(e.shape==='segment')return segmentDistance(p.x,p.y,e.a,e.b)<=r+e.r;
 if(e.shape==='ring'){if(e.gapHalf&&angleDist(Math.atan2(p.y-e.y,p.x-e.x),e.gapAngle)<e.gapHalf)return false;return Math.abs(Math.hypot(p.x-e.x,p.y-e.y)-e.r)<=e.thickness+r;}
 if(e.shape==='outside')return Math.hypot((p.x-e.x)/(e.rx-r),(p.y-e.y)/(e.ry-r))>1;
 return false;
}
const disk=(kind,id,x,y,r,active=true,extra={})=>({kind,id,shape:'circle',x,y,r,z0:0,z1:.8,damage:10,active,...extra});
const line=(kind,id,a,b,r=.12,active=true,extra={})=>({kind,id,shape:'segment',a,b,r,z0:0,z1:.65,damage:10,active,...extra});
const warning=(id,x,y,r,progress=0,extra={})=>disk('warning',id,x,y,r,false,{cue:true,progress,...extra});
const wave=(id,x,y,r,extra={})=>({kind:'ring',id,shape:'ring',x,y,r,thickness:.13,z0:0,z1:.55,damage:10,active:true,...extra});
const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
function random(seed,label,n=0){let h=(seed^Math.imul(n+1,0x9e3779b1))>>>0;for(let i=0;i<label.length;i++)h=Math.imul(h^label.charCodeAt(i),16777619);h=Math.imul(h^(h>>>16),0x21f0aaad);h=Math.imul(h^(h>>>15),0x735a2d97);return ((h^(h>>>15))>>>0)/4294967296;}
function passiveChoice(seed,id,mode='random'){return mode==='always'||mode!=='never'&&random(seed,'passive-'+id)<.2;}
function create(index,seed=1,options={}){
 index=((index%definitions.length)+definitions.length)%definitions.length;seed=seed>>>0;
 const s={index,definition:definitions[index],seed,time:0,entities:[],locks:{},history:[],mineFires:{},orbs:[{x:-4.5,y:1.5},{x:4.5,y:6.8}],done:false,
  passiveModes:{double:options.double||'random',mines:options.mines||'random'}};
 s.passives={double:passiveChoice(seed,'double',s.passiveModes.double),mines:passiveChoice(seed,'mines',s.passiveModes.mines)};
 s.phraseWaves=[];
 for(let burst=0,base=1.35;base<s.definition.duration-2.7;burst++,base+=3.6){
  const count=2+Math.floor(random(seed,'phrase-count',burst)*2),axis=burst%2?'x':'y',baseGap=axis==='x'?2.1+random(seed,'phrase-gap',burst)*3.6:-3.1+random(seed,'phrase-gap',burst)*6.2;
  for(let n=0;n<count;n++){const fire=base+n,travel=axis==='x'?12.8/7.5:8.8/6.0;if(fire+travel>s.definition.duration-.08)continue;s.phraseWaves.push({burst,n,count,fire,axis,gap:baseGap+(n-1)*.28,tall:random(seed,'phrase-tall',burst*3+n)<.7,travel});}
 }
 s.canonWaves=[];for(let cycle=0;cycle<2;cycle++)for(let n=0;n<4;n++)s.canonWaves.push({fire:[1.3,2.7,4.6,6.0][n]+cycle*9,reverse:n>=2,gap:n%2?2.2:5.7,tall:random(seed,'canon-tall',cycle*4+n)<.7,id:cycle*4+n});
 s.prismEvents=[2.2,4.9];for(let t=8;t<s.definition.duration-.8;t+=3.3)s.prismEvents.push(t);
 return s;
}
function historic(s,time){if(time<=0)return {x:0,y:4};for(let i=s.history.length-1;i>=0;i--)if(s.history[i].t<=time)return s.history[i];return {x:0,y:4};}
function aimLock(s,id,from,p){if(!s.locks[id]){const dx=p.x-from.x,dy=p.y-from.y,n=Math.hypot(dx,dy)||1;s.locks[id]={x:from.x,y:from.y,dx:dx/n,dy:dy/n};}return s.locks[id];}
function passives(s,p,out){
 const t=s.time;
 if(s.passives.double){
  if(t<1.2)out.push(warning('passive-double-w',p.x,p.y,.42,t/1.2,{passive:'double'}));
  else {const ghost=historic(s,t-1.2);out.push(disk('double','passive-double',ghost.x,ghost.y,.24,true,{z1:1.15,passive:'double'}));let last=null;
   for(const q of s.history){if(q.t<t-2||q.t>t-1.2)continue;if(last)out.push(line('trail','passive-trail-'+q.t,[last.x,last.y],[q.x,q.y],.11,true,{passive:'double',fade:clamp((q.t-(t-2))/.8,0,1)}));last=q;}
  }
 }
 if(s.passives.mines)for(let n=0;n<3;n++){
  const [x,y]=[[-3.5,2.5],[2.5,2.2],[1.8,6.4]][n];
  if(t>=1.2&&s.mineFires[n]===undefined&&Math.hypot(p.x-x,p.y-y)<1.5)s.mineFires[n]=t+.75;
  const fire=s.mineFires[n],age=fire===undefined?-Infinity:t-fire;
  if(age<0)out.push(disk('mine','passive-mine-'+n,x,y,.24,false,{armed:fire!==undefined,progress:fire===undefined?0:1+age/.75,cue:true,glyph:'♪',passive:'mines'}));
  if(age>=0&&age<1.0)out.push(wave('passive-mine-wave-'+n,x,y,age*3.2,{fade:1-age,passive:'mines'}));
 }
}
function glyphWave(out,s,w,kind='phrase'){
 const t=s.time,age=t-w.fire,side=w.axis==='x'||w.reverse!==undefined;
 if(age>=-.95&&age<0)out.push({kind:'gate-warning',id:kind+'-w-'+w.fire,cue:true,active:false,axis:w.reverse?'rx':side?'x':'y',gap:w.gap,tall:w.tall,progress:1+age/.95});
 const speed=kind==='canon'?7:(side?7.5:6),travel=side?12.8/speed:8.8/speed;
 if(age<0||age>=travel)return;
 const count=kind==='phrase'?(side?15:23):10,spacing=kind==='phrase'?(side?7.2/14:11.4/22):.77;
 for(let k=0;k<count;k++){
  const q=side?.55+k*spacing:-5.7+k*spacing;if(Math.abs(q-w.gap)<(kind==='phrase'?1.02:.92))continue;
  const x=side?(w.reverse?6.4-age*speed:-6.4+age*speed):q,y=side?q:-.4+age*speed;
  for(let row=0;row<(w.tall?2:1);row++){
   const glyph=kind==='phrase'?alphabet[Math.floor(random(s.seed,'symbol-'+w.fire+'-'+k+'-'+row,Math.floor(t*11))*alphabet.length)]:'♪';
   out.push(disk(kind==='phrase'?'glyph':'note',kind+'-'+w.fire+'-'+k+'-'+row,x,y,kind==='phrase'?.21:.22,true,{glyph,drawZ:row?1.4:.12,z0:row?1.1:0,z1:row?2.8:w.tall?1.2:.8,tall:w.tall,row,burst:w.burst}));
  }
 }
}
function sample(s,p){
 const out=[],t=s.time,id=s.definition.id,duration=s.definition.duration;
 if(t<1.1)out.push(warning('start',0,4,.5,t/1.1,{intro:true}));
 if(id==='phrase')for(const w of s.phraseWaves)glyphWave(out,s,w);
 if(id==='pulse')for(let source=0;source<2;source++)for(let n=0;n<6;n++){
  const fire=1.35+source*.9+n*2.8,age=t-fire;if(fire>duration-2.7)continue;
  const [x,y]=source? [2.5,5.5]:[-2.5,2.6];
  if(age>=-.95&&age<0)out.push(warning('pulse-w-'+source+'-'+n,x,y,.45,1+age/.95,{source}));
  if(age>=0&&age<3.15)out.push(wave('pulse-'+source+'-'+n,x,y,age*3.25,{source}));
 }
 if(id==='cut')for(let cycle=0;cycle<2;cycle++)for(let n=0;n<4;n++){
  const fire=1.5+n*1.75+cycle*9,age=t-fire,angle=n%2?.95:-.75,normal=[Math.cos(angle),Math.sin(angle)],tangent=[-normal[1],normal[0]],offset=-7+Math.max(0,age)*7;
  const center=[normal[0]*offset,4+normal[1]*offset],a=add(center,tangent.map(v=>v*12)),b=sub(center,tangent.map(v=>v*12));
  if(age>=-.9&&age<0)out.push(line('aim','cut-w'+fire,add([0,4],tangent.map(v=>v*10)),sub([0,4],tangent.map(v=>v*10)),.04,false,{cue:true,progress:1+age/.9}));
  if(age>=0&&age<2)out.push(line('cut','cut-'+fire,a,b,.2,true,{z1:.75}));
 }
 if(id==='cubes')for(let cycle=0;cycle<2;cycle++)for(let n=0;n<3;n++){
  const fire=1.4+n*1.5+cycle*10.8,age=t-fire,flight=5.4,u=clamp(age/flight,0,1),from=n%2?[4.7,1.3]:[-4.7,1.1],to=n%2?[-4.5,7.1]:[4.7,6.8];
  if(age>=-.95&&age<0)out.push(line('aim','cube-w'+fire,from,to,.04,false,{cue:true,progress:1+age/.95}));
  if(age>=0&&age<flight){const x=from[0]+(to[0]-from[0])*u,y=from[1]+(to[1]-from[1])*u,z=.58+Math.abs(Math.sin(u*Math.PI*3))*2.7;
   out.push({kind:'cube',shape:'cube',id:'cube-'+fire,x,y,z,half:.47,rotation:[t*.9+n,t*.7,t*1.2],damage:10,active:true});
  }
  for(let bounce=1;bounce<=3;bounce++){
   const at=flight*bounce/3,left=at-age,x=from[0]+(to[0]-from[0])*bounce/3,y=from[1]+(to[1]-from[1])*bounce/3;
   if(left>0&&left<.85)out.push(warning('cube-land-'+fire+'-'+bounce,x,y,.95,1-left/.85));
   if(left<=0&&left> -2.45)out.push(wave('cube-impact-'+fire+'-'+bounce,x,y,-left*3.4,{damage:5,impact:true}));
  }
 }
 if(id==='prisms')for(let n=0;n<2;n++){
  const [x,y]=n?[2.8,4.7]:[-2.8,3.1],spawn=n?6.9:.4,events=n?s.prismEvents.slice(2):s.prismEvents;
  if(t<spawn)continue;
  if(t<spawn+.9)out.push(warning('prism-spawn-'+n,x,y,.95,(t-spawn)/.9));
  const next=events.find(fire=>fire>=t),opacity=smooth((t-spawn)/.8)*(1-smooth((t-duration+.8)/.8));let z=1.1;
  if(next!==undefined&&t>=next-.95){const a=t-(next-.95);z=a<.35?1.1+3.8*smooth(a/.35):4.9-3.8*smooth((a-.35)/.6);}
  const e={kind:'tetra',shape:'tetra',id:'prism-'+n,x,y,z,rotation:[0,0,t*1.9+n],damage:10,active:opacity>.95&&t>1.2,fade:opacity};e.vertices=tetraVertices(e);out.push(e);
  for(const fire of events){const age=t-fire;if(age>=-.95&&age<0)out.push(warning('prism-w'+n+'-'+fire,x,y,.95,1+age/.95));if(age>=0&&age<2.9)out.push(wave('prism-wave-'+n+'-'+fire,x,y,age*3.7,{source:n,synchronized:fire>=8}));}
 }
 if(id==='orbit')for(let n=0;n<3;n++){
  const spawn=1.5+n*.3,age=t-spawn;if(age< -1.1)continue;
  const [hx,hy]=[[-3.1,2.9],[3.1,2.9],[0,5.8]][n];
  if(age<0){out.push(warning('orbit-w'+n,hx,hy,1.8,1+age/1.1));continue;}
  const fade=smooth(age/1.2)*(1-smooth((t-(duration-2))/1.8)),rotation=[.34+.27*Math.sin(age*.65+n),.32*Math.cos(age*.6+n),.3*Math.sin(age*.5+n)],major=2.05,minor=.22;
  const mx=rotate([1,0,0],rotation),my=rotate([0,1,0],rotation),z=major*Math.hypot(mx[2],my[2])+minor+.03;
  out.push({kind:'torus',shape:'torus',id:'orbit-'+n,x:hx+.45*Math.sin(age*.62+n),y:hy+.35*Math.sin(age*.8+n),z,major,minor,rotation,fade,damage:10,active:fade>.9});
 }
 if(id==='metronome'){
  const age=Math.max(0,t-1.3),part=Math.floor(age/2.0),local=age%2,angle=.4+(part%2?1.65-Math.min(local,1.65):Math.min(local,1.65))*1.65;
  out.push(line(t<1.3||local>1.65?'aim':'needle','needle',[0,4],[Math.cos(angle)*7,4+Math.sin(angle)*7],.10,t>=1.3&&local<=1.65,{cue:t<1.3||local>1.65,z1:.6,progress:t/1.3}));
 }
 if(id==='refrain')for(let n=0;n<2;n++){
  const orb=s.orbs[n];if(t<1.3)out.push(warning('refrain-w'+n,orb.x,orb.y,.55,t/1.3));
  if(t>=1.3){out.push(disk('chaser','refrain-'+n,orb.x,orb.y,.35,true,{z1:1.05,glyph:'♪',source:n}));
   for(let fire=2.9+n*.6;fire<duration;fire+=2.8)if(t>=fire-.8&&t<fire){const a=aimLock(s,'dash-'+n+'-'+fire,orb,p);out.push(line('aim','dash-w'+n+'-'+fire,[a.x,a.y],[a.x+a.dx*7,a.y+a.dy*7],.055,false,{cue:true,progress:(t-fire+.8)/.8}));}
  }
 }
 if(id==='rest'){
  const age=Math.max(0,t-2),x=2.6*Math.sin(age*1.1),y=4+.75*Math.sin(age*1.72);
  out.push({kind:'safe-window',shape:'outside',id:'rest',x,y,rx:2.4,ry:1.8,z0:0,z1:.55,damage:10,active:t>=2,cue:t<2,progress:t/2});
  for(let fire=2,n=0;fire<duration-.2;fire++,n++){
   const since=t-fire,side=Math.floor(random(s.seed,'rest-side',n)*4),q=random(s.seed,'rest-origin',n),from=side===0?{x:-6.6,y:.8+q*6.8}:side===1?{x:6.6,y:.8+q*6.8}:side===2?{x:-5.3+q*10.6,y:-.5}:{x:-5.3+q*10.6,y:8.5};
   if(t>=fire-.55&&since<2.8){const a=aimLock(s,'rest-note-'+n,from,p);if(since<0)out.push(line('aim','rest-w'+n,[a.x,a.y],[a.x+a.dx*14,a.y+a.dy*14],.03,false,{cue:true,progress:1+since/.55}));else out.push(disk('note','rest-note-'+n,a.x+a.dx*since*5.2,a.y+a.dy*since*5.2,.22,true,{glyph:'♪',side,aimed:true,damage:10}));}
  }
 }
 if(id==='canon')for(const w of s.canonWaves)glyphWave(out,s,{...w,axis:'x'},'canon');
 if(id==='spiral'){
  const gapAngle=1.3+t*.38;if(t<1.4)out.push(warning('spiral-w',0,3.6,.75,t/1.4));
  for(let n=0,fire=1.4;fire<duration-1;fire+=.14,n++){
   const age=t-fire;if(age<0||age>4)continue;
   for(let arm=0;arm<5;arm++){const angle=.35+n*.3+arm*TAU/5;if(angleDist(angle,1.3+fire*.38)<.63)continue;const r=.75+age*2.35;out.push(disk('note','spiral-'+n+'-'+arm,Math.cos(angle)*r,3.6+Math.sin(angle)*r,.21,true,{glyph:'♪'}));}
  }
  out.push({kind:'gap-guide',id:'spiral-gap',x:0,y:3.6,angle:gapAngle,active:false});
 }
 if(id==='shadows'){
  const sources=[[-6.5,.3],[6.5,.3],[-6.5,7.7],[6.5,7.7]],count=t<4.05?2:4;
  for(let n=0;n<count;n++){const [x,y]=sources[n],fade=n<2?1:smooth((t-4.05)/.65);let looking=false;
   for(let shot=0,fire=1.8;fire<duration-.2;shot++,fire+=1.7){const caster=shot<2?shot:2+(shot-2)%4,which=caster%4;if(which!==n)continue;const age=t-fire;
    if(age>=-.9&&age<.45){looking=true;const a=aimLock(s,'echo-aim-'+shot,{x,y},p);out.push(line(age<0?'aim':'echo-beam','echo-beam-'+shot,[x,y],[a.x+a.dx*17,a.y+a.dy*17],age<0?.04:.12,age>=0,{cue:age<0,progress:1+age/.9,z1:1.05}));}
   }
   out.push({kind:'echo-source',id:'echo-'+n,x,y,active:false,looking,fade});
  }
 }
 if(id==='octahedra')for(let n=0;n<2;n++){
  const age=t-1.5,phase=age*.55+n*Math.PI,fade=smooth(age/.9)*(1-smooth((t-duration+1.5)/1.2));
  if(age<0){if(age>=-1.0)out.push(line('aim','octa-w'+n,[-4,n?6.4:1.7],[4,n?1.7:6.4],.05,false,{cue:true,progress:1+age}));continue;}
  const e={kind:'octa',shape:'octa',id:'octa-'+n,x:4*Math.sin(phase),y:4+2.1*Math.sin(phase*1.3+n),z:1.3+1.1*Math.abs(Math.sin(age*.9+n)),radius:.83,rotation:[age*.8+n,age*1.05,age*.6],fade,damage:10,active:fade>.9};Object.assign(e,polyMesh(e));out.push(e);
 }
 if(id==='cylinders')for(let n=0,fire=1.6;fire<duration-2.2;fire+=2.4,n++){
  const age=t-fire,side=n%2,travel=side?3.7:3.8,from=side?[-6.6,3.1+(n%3)*.9]:[-2.5+(n%3)*2.5,-.6],to=side?[6.6,from[1]]:[from[0],8.6];
  if(age>=-1&&age<0)out.push(line('aim','cylinder-w'+n,from,to,.06,false,{cue:true,progress:1+age}));
  if(age>=0&&age<travel){const u=age/travel,e={kind:'cylinder',shape:'cylinder',id:'cylinder-'+n,x:from[0]+(to[0]-from[0])*u,y:from[1]+(to[1]-from[1])*u,z:.55,radius:.49,half:1.5,rotation:[age*4,0,side?Math.PI/2:.1*Math.sin(age)],damage:10,active:true,fade:smooth(age/.4)*(1-smooth((age-travel+.5)/.5))};e.active=e.fade>.9;Object.assign(e,polyMesh(e));out.push(e);}
 }
 if(id==='icosahedron'){
  const fires=[3,7.5,12,16.5,20.5];let nearest=fires.reduce((a,b)=>Math.abs(t-a)<Math.abs(t-b)?a:b),age=t-nearest;
  const nx=1.2*Math.sin(t*.4),ny=4+.7*Math.cos(t*.5),locked=t>=nearest-1.2?aimLock(s,'heart-lock-'+nearest,{x:nx,y:ny},p):null,blend=locked?smooth((1.2-Math.abs(age))/.5):0;
  const x=nx+((locked?.x??nx)-nx)*blend,y=ny+((locked?.y??ny)-ny)*blend,pulse=Math.exp(-Math.pow(age/.8,2)),radius=.95+.75*pulse,z=4.5-(4.5-radius-.12)*pulse,fade=smooth((t-.4)/.8)*(1-smooth((t-duration+1.5)/1.2));
  if(t>=.4&&t<1.5)out.push(warning('heart-spawn',x,y,1.2,(t-.4)/1.1));
  if(age>=-1.2&&age<0)out.push(warning('heart-w'+nearest,x,y,1.9,1+age/1.2));
  const e={kind:'icosa',shape:'icosa',id:'heart',x,y,z,radius,rotation:[t*.4,t*.6,t*.28],fade,damage:10,active:fade>.9&&t>=1.3};Object.assign(e,polyMesh(e));out.push(e);
  for(const fire of fires){const a=t-fire;if(a>=0&&a<2.6){const lock=s.locks['heart-lock-'+fire];if(lock)out.push(wave('heart-wave-'+fire,lock.x,lock.y,a*3.5));}}
 }
 passives(s,p,out);return out;
}
function updateOrbs(s,p,dt){
 const t=s.time;if(t<1.3)return;
 for(let n=0;n<2;n++){
  const orb=s.orbs[n];let handled=false;
  for(let fire=2.9+n*.6;fire<s.definition.duration;fire+=2.8){
   const id='dash-'+n+'-'+fire;
   if(t>=fire-.8&&t<fire){aimLock(s,id,orb,p);handled=true;break;}
   if(t>=fire&&t<fire+.52){const a=s.locks[id]||aimLock(s,id,orb,p);orb.x=clamp(orb.x+a.dx*8*dt,-5.7,5.7);orb.y=clamp(orb.y+a.dy*8*dt,.4,7.8);handled=true;break;}
  }
  if(!handled){const dx=p.x-orb.x,dy=p.y-orb.y,norm=Math.hypot(dx,dy)||1;orb.x+=dx/norm*1.35*dt;orb.y+=dy/norm*1.35*dt;}
 }
}
class Simulation{
 constructor(index=0,seed=1,options={}){this.reset(index,seed,options);}
 reset(index=this.attack.index,seed=1,options={}){this.attack=create(index,seed,options);this.player={x:0,y:4,z:0,dir:0,walk:0,jump:0};this.hp=100;this.hits=0;this.lastHit=-Infinity;this.lastDamage=0;this.hitId=null;this.paused=false;this.invulnerable=false;this.accumulator=0;this.clock=0;this.contacts=new Set();return this;}
 jump(){if(this.paused||this.attack.done||this.player.jump>1e-8)return false;this.player.jump=arena.jumpDuration;return true;}
 step(dt,input={}){if(this.paused||this.attack.done)return;this.accumulator+=clamp(Number.isFinite(dt)?dt:0,0,.25);const h=1/120;while(this.accumulator+1e-10>=h&&!this.attack.done){this.accumulator-=h;this._tick(h,input);}}
 _tick(dt,input){
  const s=this.attack,p=this.player,dx=clamp(input.dx||0,-1,1),dy=clamp(input.dy||0,-1,1),n=Math.hypot(dx,dy)||1,speedScale=clamp(Number.isFinite(input.speedScale)?input.speedScale:1,1,1.1);
  p.x=clamp(p.x+dx/n*arena.speedX*dt*speedScale,arena.minX,arena.maxX);p.y=clamp(p.y+dy/n*arena.speedY*dt*speedScale,arena.minY,arena.maxY);
  if(dx||dy){p.walk+=dt*120;if(Math.abs(dx)>=Math.abs(dy))p.dir=dx>0?1:3;else p.dir=dy>0?2:0;}else p.walk=0;
  p.jump=Math.max(0,p.jump-dt);const q=clamp(p.jump/arena.jumpDuration,0,1);p.z=4*arena.jumpHeight*q*(1-q);s.time+=dt;this.clock+=dt;
  if(s.history.length===0||s.time-s.history[s.history.length-1].t>=.045)s.history.push({t:s.time,x:p.x,y:p.y});while(s.history.length&&s.history[0].t<s.time-3.2)s.history.shift();
  if(s.definition.id==='refrain')updateOrbs(s,p,dt);s.entities=sample(s,p);
  let strongest=null;for(const e of s.entities)if(collides(e,p)){this.contacts.add(e.id);if(!strongest||(e.damage??10)>(strongest.damage??10))strongest=e;}
  if(strongest&&this.clock-this.lastHit>=1.1){this.lastHit=this.clock;this.hits++;this.hitId=strongest.id;this.lastDamage=strongest.damage??10;if(!this.invulnerable)this.hp=Math.max(0,this.hp-this.lastDamage);}
  if(s.time+1e-8>=s.definition.duration){s.time=s.definition.duration;s.done=true;s.entities=[];}
 }
 status(){return {index:this.attack.index,number:this.attack.definition.number,name:this.attack.definition.name,time:this.attack.time,duration:this.attack.definition.duration,seed:this.attack.seed,passives:{...this.attack.passives},passiveModes:{...this.attack.passiveModes},done:this.attack.done,hp:this.hp,hits:this.hits,lastDamage:this.lastDamage,paused:this.paused,invulnerable:this.invulnerable,player:{...this.player},entities:this.attack.entities.length,contacts:[...this.contacts]};}
}
globalThis.MikuAttackLab={definitions,passiveDefinitions,removedNumbers:[9,11,13],arena,Simulation,create,sample,collides,rotate,inverse,tetraVertices,tetraFaces,polyMesh,segmentDistance,triangleDistance,angleDist,random,passiveChoice};
})();
