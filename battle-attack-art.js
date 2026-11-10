/* Faceted plant models. Geometry comes from FlowerAttacks; all heights use the same scale. */
(()=>{
const tau=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function renderer(g,project,polygon,line,rect){
 const P=(x,y,z=0)=>project(x/12+.5,y/8,z*30);
 const disk=(x,y,r,z,color,segments=16)=>polygon(Array.from({length:segments},(_,i)=>P(x+Math.cos(i/segments*tau)*r,y+Math.sin(i/segments*tau)*r,z)),color);
 const flatLine=(points,color,width=3)=>line(points.map(p=>P(...p)),color,width);
 function shadow(e){if(e.x===undefined||e.y===undefined)return;disk(e.x,e.y,e.r||.3,0,'#071e2580')}
 function ringStrip(e,color,z=0){
  const count=Math.max(30,Math.ceil(e.r*tau/.26));
  for(let i=0;i<count;i++){
   const a0=i/count*tau,a1=(i+1)/count*tau,mid=(a0+a1)/2;
   if(e.gapHalf&&Math.abs(Math.atan2(Math.sin(mid-e.gapCenter),Math.cos(mid-e.gapCenter)))<e.gapHalf)continue;
   polygon([[e.r-e.thickness,a0],[e.r+e.thickness,a0],[e.r+e.thickness,a1],[e.r-e.thickness,a1]].map(([r,a])=>P(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,z)),color);
  }
 }
 function dashed(x0,y0,x1,y1,color,width=3){
  for(let i=0;i<24;i+=2){const a=i/24,b=(i+1)/24;flatLine([[x0+(x1-x0)*a,y0+(y1-y0)*a,.02],[x0+(x1-x0)*b,y0+(y1-y0)*b,.02]],color,width)}
 }
 function ground(entities,time){
  g.save();g.beginPath();[project(0,0),project(1,0),project(1,1),project(0,1)].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();
  for(const e of entities){
   if(e.kind==='sentinel-root'){
    disk(e.x,e.y,.43,0,'#122f29');
    if(e.mode==='windup'||e.mode==='strike'){
     const points=Array.from({length:25},(_,i)=>P(e.x+Math.cos(i/24*tau)*e.r,e.y+Math.sin(i/24*tau)*e.r,.03));
     g.globalAlpha=e.active?.8:.35+.4*clamp(e.phaseAge/e.windup,0,1);disk(e.x,e.y,e.r,.02,e.active?'#df8da55c':'#e8ce8b44');line(points,e.active?'#f8b6c3':'#f5d6a0',3);
    }
   }else if(e.kind==='path'){
    g.globalAlpha=.30+.35*e.progress;dashed(e.x0,e.y0,e.x1,e.y1,e.locked?'#f3a5bd':'#f1df9a',e.locked?6:3);
    if(e.locked){const dx=e.x1-e.x0,dy=e.y1-e.y0,d=Math.hypot(dx,dy),x=e.x0+dx/d*1.4,y=e.y0+dy/d*1.4;flatLine([[x-dx/d*.25-dy/d*.15,y-dy/d*.25+dx/d*.15,.03],[x,y,.03],[x-dx/d*.25+dy/d*.15,y-dy/d*.25-dx/d*.15,.03]],'#ffe3b4',6)}
   }else if(e.kind==='root-warning'){
    g.globalAlpha=.5+.3*e.progress;for(let x=e.x1;x<e.x2;x+=.45)flatLine([[x,e.y-.12,.03],[x+.18,e.y+.12,.03],[Math.min(e.x2,x+.4),e.y-.1,.03]],'#ead89c',3);
   }else if(e.kind==='impact-warning'||e.kind==='ring-warning'){
    g.globalAlpha=.25+.4*e.progress;disk(e.x,e.y,e.r,0,'#ceaf704d');
    const points=Array.from({length:17},(_,i)=>P(e.x+Math.cos(i/16*tau)*e.r,e.y+Math.sin(i/16*tau)*e.r,.04));line(points,'#f1d58f',3);
    const inner=e.r*(1-e.progress);if(inner>.05)disk(e.x,e.y,inner,.02,'#f8d9a35c');
    if(e.kind==='impact-warning'){flatLine([[e.x-.18,e.y,.04],[e.x+.18,e.y,.04]],'#ffe7b3',3);flatLine([[e.x,e.y-.18,.04],[e.x,e.y+.18,.04]],'#ffe7b3',3)}
   }else if(e.kind==='bud'){
    g.globalAlpha=(e.fade??1)*(e.active?.7:.25+.45*e.progress);const rx=e.halfX,ry=e.halfY,corners=[P(e.x-rx,e.y-ry,.02),P(e.x+rx,e.y-ry,.02),P(e.x+rx,e.y+ry,.02),P(e.x-rx,e.y+ry,.02)];
    polygon(corners,e.active?'#b36c8f66':'#ccac6a55');line([...corners,corners[0]],e.active?'#f2b4c7':'#e9c888',3);
   }else if(e.kind==='ring'){
    ringStrip(e,e.wave===2?'#e9a5b6':'#dbc18b',.03);
   }else if(e.active&&e.kind!=='root')shadow(e);
   g.globalAlpha=1;
  }
  g.restore();
 }
 function petal(e,time){
  const r=e.r||.36,a=e.angle??time*6,z=e.z0+.30,points=[[-r,0],[0,-r*.6],[r,0],[0,r*.6]],transform=([x,y],height=z)=>P(e.x+x*Math.cos(a)-y*Math.sin(a),e.y+x*Math.sin(a)+y*Math.cos(a),height);
  const top=points.map(p=>transform(p)),bottom=points.map(p=>transform(p,z-.20));
  polygon([top[0],top[1],bottom[1],bottom[0]],'#7e5969');polygon([top[2],top[3],bottom[3],bottom[2]],e.variant?'#a68b55':'#a5577b');
  polygon(top,e.variant?'#f2d79c':'#eea8c2');polygon([top[0],top[1],top[2],transform([0,0])],e.variant?'#fff0bd':'#ffd0da');line([top[0],transform([0,0]),top[2]],'#fff2d8',3);
 }
 function root(e,time){
  for(let x=e.x1;x<e.x2;x+=.42){
   const end=Math.min(e.x2,x+.46),h=.53+.16*Math.sin(x*3+time*5),r=e.r;
   const a=P(x,e.y-r),b=P(end,e.y-r),c=P(end,e.y+r),d=P(x,e.y+r),aa=P(x,e.y-r,h),bb=P(end,e.y-r,h),cc=P(end,e.y+r,h),dd=P(x,e.y+r,h);
   polygon([d,c,cc,dd],'#294739');polygon([a,b,bb,aa],'#567746');polygon([aa,bb,cc,dd],'#8cab64');
   polygon([P(x+.08,e.y,h),P(x+.20,e.y,.88),P(Math.min(end,x+.32),e.y,h)],'#cee092');
   if(Math.floor((x+6)*2)%3===0)polygon([P(x,e.y,h*.5),P(x-.14,e.y+.28,h+.12),P(x+.22,e.y+.22,h*.7)],'#81b66f');
  }
 }
 function seed(e,time){
  const [x,y]=P(e.x,e.y,e.z0),s=.8+e.y*.035;
  // Low-poly parachute canopy, strings, striped seed pod.
  polygon([[x-24*s,y-19*s],[x-12*s,y-35*s],[x+9*s,y-38*s],[x+27*s,y-21*s],[x+12*s,y-23*s],[x,y-20*s],[x-12*s,y-23*s]],'#e9c998');
  polygon([[x-12*s,y-35*s],[x+1*s,y-37*s],[x+6*s,y-21*s],[x,y-20*s],[x-8*s,y-23*s]],'#f9e6bb');
  line([[x-20*s,y-21*s],[x-4*s,y-3*s],[x+3*s,y-1*s],[x+23*s,y-22*s]],'#b2ccb0',3);
  polygon([[x-9*s,y-3*s],[x-5*s,y-11*s],[x+6*s,y-11*s],[x+12*s,y-3*s],[x+5*s,y+9*s],[x-3*s,y+9*s]],'#df97ae');
  line([[x-3*s,y-8*s],[x+3*s,y+5*s]],'#ffdaac',3);
 }
 function cloud(e,time){
  g.globalAlpha=e.fade;disk(e.x,e.y,e.r,.02,'#c5a37088');
  for(let i=0;i<8;i++){const a=i/8*tau+time*.8,r=e.r*(.36+.35*(i%2)),x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r,z=.15+.32*(.5+.5*Math.sin(time*4+i));disk(x,y,.17,z,i%2?'#e9d2a8bb':'#d1cc83aa',6);const [px,py]=P(x,y,z);rect(px-3,py-3,6,6,'#fff0bc')}
  const [x,y]=P(e.x,e.y,.15);line([[x-9,y+3],[x,y-6],[x+9,y+3]],'#e7ab9f',3);g.globalAlpha=1;
 }
 function mask(e,time){
  const [x,y]=P(e.x,e.y,1.1),w=26+(e.y/8)*7,h=16,ang=e.active?Math.sin(e.age*15)*.1:Math.sin(time*2+e.variant)*.06+e.dx*.15,gaze=clamp(e.dx,-1,1)*w*.12;
  g.save();g.translate(Math.round(x/3)*3,Math.round(y/3)*3);g.rotate(ang);
  for(let i=0;i<6;i++){const a=i/6*tau,px=Math.cos(a)*w*.84,py=Math.sin(a)*h*.75;polygon([[px-w*.35,py],[px-w*.15,py-h*.55],[px+w*.25,py-h*.4],[px+w*.38,py+h*.15],[px,py+h*.58]],i%2?'#d793b2':'#af688b')}
  polygon([[-w*.78,-h*.25],[-w*.47,-h*.85],[w*.4,-h*.9],[w*.78,-h*.2],[w*.7,h*.5],[0,h*.9],[-w*.65,h*.5]],e.active?'#f7d77e':'#cfbc7e');
  line([[-w*.56+gaze,-h*.14],[-w*.35+gaze,-h*.38],[-w*.17+gaze,-h*.15]],'#403a35',3);line([[w*.15+gaze,-h*.15],[w*.35+gaze,-h*.38],[w*.56+gaze,-h*.14]],'#403a35',3);
  line([[-w*.4+gaze,h*.08],[-w*.25+gaze,h*.42],[w*.12+gaze,h*.55],[w*.42+gaze,h*.13]],'#6d4858',3);
  if(e.locked&&!e.active){rect(-3,-h-9,6,6,'#fff0b1');rect(-3,h+6,6,6,'#ef9eb8')}
  g.restore();
 }
 function bead(e,time){
  g.globalAlpha=e.fade??1;const [x,y]=P(e.x,e.y,.7),r=11+e.y*.45;
  polygon([[x-r,y-r*.5],[x-r*.5,y-r],[x+r*.5,y-r],[x+r,y-r*.4],[x+r,y+r*.45],[x+r*.4,y+r],[x-r*.45,y+r],[x-r,y+r*.4]],e.variant?'#d8bd7c':'#d38ba8');
  polygon([[x-r*.7,y-r*.3],[x-r*.1,y-r*.7],[x+r*.6,y-r*.3],[x+r*.6,y+r*.15],[x,y+r*.5],[x-r*.7,y+r*.05]],e.variant?'#f6e3ae':'#fac9d4');
  line([[x-r*.65,y],[x-r*.2,y-r*.3],[x+r*.25,y-r*.3],[x+r*.65,y]],'#50655c',3);rect(x-3+Math.sin(time+e.angle)*2,y-r*.17,6,6,'#4b4f5b');g.globalAlpha=1;
 }
 function bud(e,time){
  g.globalAlpha=e.fade??1;const opening=e.opening,r=e.r;
  disk(e.x,e.y,r,0,e.active?'#af8c8166':'#234b3c');
  if(opening>.2)for(const [dx,dy] of [[-1.15,-.88],[1.15,-.88],[-1.15,.88],[1.15,.88]]){
   const bx=e.x+dx,by=e.y+dy;flatLine([[e.x,e.y,.05],[bx,by,.05]],'#8cad6e',3);
   polygon([P(bx-.13,by,.03),P(bx,by,3.2*opening),P(bx+.13,by,.03)],'#ca8aa7');line([P(bx,by,.1),P(bx,by,3.2*opening-.1)],'#fad7bd',3);
  }
  for(let i=0;i<5;i++){
   const a=i/5*tau,dx=Math.cos(a),dy=Math.sin(a),base=.12+.46*opening;
   polygon([P(e.x,e.y,.1),P(e.x+dx*base-dy*.19,e.y+dy*base+dx*.19,.18),P(e.x+dx*r,e.y+dy*r,.2+.35*opening),P(e.x+dx*base+dy*.19,e.y+dy*base-dx*.19,.18)],i%2?'#739d61':'#4d7d54');
   if(opening>.2){const bx=e.x+dx*.49,by=e.y+dy*.49,h=3.2*opening;polygon([P(bx-dy*.15,by+dx*.15,.1),P(bx,by,h),P(bx+dy*.15,by-dx*.15,.1)],i%2?'#f2c1bb':'#ba779c');line([P(bx,by,.3),P(bx,by,h-.12)],'#f9d3bd',3)}
  }
  const [x,y]=P(e.x,e.y,.35+.3*opening),w=12+5*opening;
  polygon([[x-w,y-6],[x-w*.6,y-16],[x+w*.5,y-16],[x+w,y-6],[x+w*.5,y+7],[x-w*.6,y+7]],e.age<0?'#bf8fab':'#eac184');
  if(e.age<0){line([[x-8,y-4],[x-3,y-2]],'#4c4a50',3);line([[x+3,y-2],[x+8,y-4]],'#4c4a50',3)}else{rect(x-8,y-5,4,5,'#503e51');rect(x+4,y-5,4,5,'#503e51');line([[x-4,y+3],[x+4,y+3]],'#785865',3)}
  g.globalAlpha=1;
 }
 function ring(e,time){
  const count=Math.max(12,Math.ceil(e.r*tau/.41));
  for(let i=0;i<count;i++){
   const a=i/count*tau;if(e.gapHalf&&Math.abs(Math.atan2(Math.sin(a-e.gapCenter),Math.cos(a-e.gapCenter)))<e.gapHalf)continue;
   const x=e.x+Math.cos(a)*e.r,y=e.y+Math.sin(a)*e.r;
   if(Math.abs(x)>6||y<0||y>8)continue;
   petal({x,y,r:.18,z0:.1,angle:a+Math.PI/2,variant:e.wave%2},time);
  }
 }
 function solid(e,time){
  if(e.kind==='petal')petal(e,time);
  else if(e.kind==='root')root(e,time);
  else if(e.kind==='seed')seed(e,time);
  else if(e.kind==='cloud')cloud(e,time);
  else if(e.kind==='mask')mask(e,time);
  else if(e.kind==='bead')bead(e,time);
  else if(e.kind==='bud')bud(e,time);
  else if(e.kind==='sentinel-root')sentinel(e,time);
  else if(e.kind==='ring')ring(e,time);
  else if(e.kind==='spark'){
   g.globalAlpha=clamp(1-e.age/.3,0,1);for(let i=0;i<5;i++){const a=i/5*tau,r=e.age*3,[x,y]=P(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,e.age);rect(x,y,3,3,i%2?'#f4c9d0':'#edd79a')}g.globalAlpha=1;
  }
 }
 function sentinel(e,time){
  const dry=e.remainingTurns===1,growth=e.growth,warning=e.mode==='windup',striking=e.mode==='strike',lift=warning?clamp(e.phaseAge/e.windup,0,1):0,sweep=striking?Math.sin(clamp(e.phaseAge/.2,0,1)*Math.PI):0;
  const base=dry?'#627446':'#4f8057',light=dry?'#b5b17a':'#a2ce82',top=1.6*growth;
  for(let i=0;i<5;i++){
   const a=i/5*tau+.2,r=.38*growth;
   polygon([P(e.x,e.y,.15),P(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,0),P(e.x+Math.cos(a+.6)*r,e.y+Math.sin(a+.6)*r,.12)],base);
  }
  let previous=P(e.x,e.y,.1);
  for(let i=1;i<=7;i++){
   const z=i/7*top,a=i*.9+Math.sin(time*2)*.2,x=e.x+Math.sin(a)*.13,y=e.y+Math.cos(a)*.10,next=P(x,y,z);
   line([previous,next],base,12);line([previous,[next[0]-3,next[1]]],light,3);previous=next;
  }
  for(const side of [-1,1]){
   const reach=(.42+lift*.12+sweep*.54)*growth,z=(.6+lift*.7)*growth;
   const tip=P(e.x+side*reach,e.y+.1,z),stem=P(e.x,e.y,.72*growth);
   line([stem,tip],base,9);polygon([tip,P(e.x+side*(reach-.13),e.y+.28,z+.30),P(e.x+side*(reach+.13),e.y+.1,z+.08)],striking?'#f0c4ad':light);
   if(striking)flatLine([[e.x+side*.5,e.y+.15,.7],[e.x+side*.92,e.y+.22,.8],[e.x+side*1.1,e.y+.2,.5]],'#f1d3b0',3);
  }
  const [x,y]=P(e.x,e.y,top+.1);polygon([[x-8,y],[x-3,y-9],[x+5,y-6],[x+8,y+3],[x,y+9]],warning||striking?'#ecb0bc':light);
 }
 function items(entities){
  const out=[];
  for(const e of entities){
   if(e.kind!=='ring'){if(['petal','root','seed','cloud','mask','bead','bud','spark','sentinel-root'].includes(e.kind))out.push(e);continue}
   const count=Math.max(12,Math.ceil(e.r*tau/.41));
   for(let i=0;i<count;i++){
    const a=i/count*tau;if(e.gapHalf&&Math.abs(Math.atan2(Math.sin(a-e.gapCenter),Math.cos(a-e.gapCenter)))<e.gapHalf)continue;
    const x=e.x+Math.cos(a)*e.r,y=e.y+Math.sin(a)*e.r;if(Math.abs(x)>6||y<0||y>8)continue;
    out.push({kind:'petal',x,y,r:.18,z0:.1,angle:a+Math.PI/2,variant:e.wave%2});
   }
  }
  return out;
 }
 function caster(state,time,drawSprite,frame){
  const id=state?.definition.id,t=(state?.time||0)*FlowerAttacks.balance.tempo,preparing=state&&t<1.25;
  const sway=state?Math.sin(time*(id==='spiral'?4:2.5))*5:0,scale=preparing?1-.06*Math.sin(t/1.25*Math.PI):1;
  g.save();g.translate(768,391);g.rotate(sway*Math.PI/180);g.scale(1,scale);drawSprite(frame,0,0,3);g.restore();
  if(!state)return;
  const [cx,cy]=[768,275];
  if(id==='spiral'){
   for(let i=0;i<15;i++){const a=i*.6+t*1.6,r=2+i*1.1;rect(cx+Math.cos(a)*r,cy+Math.sin(a)*r,3,3,i%2?'#f2d49d':'#f3b5cd')}
  }else if(id==='rings'){
   // Leaves cover the face, then spring apart before each wave; no screen flash.
   const next=FlowerAttacks.balance.ringFires.find(f=>t<f),closed=next?clamp(1-(next-t)/.65,0,1):0,spread=(1-closed)*36;
   for(const side of [-1,1])polygon([[cx+side*spread,cy-28],[cx+side*(spread+27),cy-36],[cx+side*(spread+42),cy+3],[cx+side*(spread+10),cy+19]],side<0?'#7ea467':'#a4bc78');
  }else if(preparing){
   for(const side of [-1,1])line([[cx+side*60,cy-9],[cx+side*69,cy-18],[cx+side*72,cy-3]],'#f1d6a4',3);
  }
 }
 return {ground,solid,items,caster};
}
globalThis.FlowerAttackArt={renderer};
})();
