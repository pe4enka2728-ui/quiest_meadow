/* Pixel-sized challenge illustrations shared by combat and the practice gallery. */
(()=>{
'use strict';
const TAU=Math.PI*2,arrows={up:'↑',right:'→',down:'↓',left:'←',confirm:'ПРОБЕЛ'};
function paint(g,run,theme='flower'){
 const mono=theme==='miku',p={bg:mono?'#000':theme==='neru'?'#20263b':'#11262c',ink:mono?'#fff':'#f4e9d6',muted:mono?'#6f747e':'#536c70',accent:mono?'#f39bad':'#edcf91',good:mono?'#fff':'#a0d7bc',bad:'#dc7389',water:mono?'#b9becf':'#94cfda'};
 const w=512,h=180,t=run.time,d=run.data,kind=run.kind;
 g.clearRect(0,0,w,h);g.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const line=(pts,c=p.ink,width=2)=>{g.strokeStyle=c;g.lineWidth=width;g.lineJoin='miter';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.stroke();};
 const poly=(pts,c)=>{g.fillStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.closePath();g.fill();};
 const text=(s,x,y,size=15,c=p.ink,align='center')=>{g.font=size+'px QuietMeadowPixel, monospace';g.textAlign=align;g.fillStyle=c;g.fillText(s,Math.round(x),Math.round(y));};
 const circle=(x,y,r,c=p.ink,width=2)=>{g.strokeStyle=c;g.lineWidth=width;g.beginPath();g.arc(Math.round(x),Math.round(y),Math.max(1,Math.round(r)),0,TAU);g.stroke();};
 const arrow=(key,x,y,color=null,size=1)=>{const angle={up:0,right:Math.PI/2,down:Math.PI,left:-Math.PI/2}[key];if(angle===undefined){text('•',x,y+5,20,color||p.ink);return;}const palette={left:'#d879ed',down:'#62d7ef',up:'#72df82',right:'#f07b83'},fill=mono?(color===p.muted?'#626672':'#fff'):color&&color!==p.ink?color:palette[key];g.save();g.translate(Math.round(x),Math.round(y));g.rotate(angle);g.scale(size,size);const shape=[[-5,14],[5,14],[5,1],[13,1],[13,-5],[0,-18],[-13,-5],[-13,1],[-5,1]];g.strokeStyle=mono?'#272931':'#18222f';g.lineWidth=5;g.lineJoin='miter';g.beginPath();shape.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();g.stroke();poly([[-7,-3],[0,-11],[6,-5],[0,-5],[-1,8],[-3,8],[-3,-3]],mono?'#c9cdd5':'#ffffff88');g.restore();};
 const note=(x,y,color=p.water)=>{rect(x-8,y-2,13,8,color);rect(x+2,y-21,3,22,color);rect(x+5,y-21,8,4,color);};
 const star=(x,y,r=13,color=p.accent)=>{const pts=[];for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,k=i%2?r*.45:r;pts.push([x+Math.cos(a)*k,y+Math.sin(a)*k]);}poly(pts,color);};
 const heart=(x,y,s=2,color=p.accent)=>{g.save();g.translate(Math.round(x),Math.round(y));g.scale(s,s);poly([[-9,-4],[-9,-9],[-5,-12],[-1,-12],[0,-9],[1,-12],[5,-12],[9,-9],[9,-4],[6,0],[0,6],[-6,0]],color);g.restore();};
 const foot=(x,y,color=p.ink,side=1)=>{rect(x-5,y-12,9,14,color);rect(x-4+side*2,y+5,7,5,color);};
 const color=c=>c.score===null?p.ink:c.score>=.5?p.good:p.bad;
 const track=(cues=run.cues)=>{
  line([[28,111],[484,111]],p.muted);const x=28+t/run.duration*456;line([[x,50],[x,139]],p.accent,3);
  for(const c of cues){const cx=28+c.time/run.duration*456;circle(cx,90,19,color(c));arrow(c.key,cx,89,color(c),.8);if(c.score!==null)text(c.score>=.9?'!':c.score>=.5?'✓':'×',cx,150,18,color(c));}
 };
 rect(0,0,w,h,p.bg);
 for(let x=12;x<w;x+=24)rect(x,169,2,2,p.muted);
 if(kind==='ring'){
  circle(256,89,46,p.muted,5);circle(256,89,46,p.accent,2);
  for(const hit of run.cues){const radius=46+(hit.time-t)*73;if(hit.score===null&&radius>3&&radius<156){g.globalAlpha=radius>100?.4:1;circle(256,89,radius,p.ink,3);g.globalAlpha=1;}const age=hit.at===null?10:t-hit.at;if(hit.score>=.5&&age>=0&&age<.45){g.save();g.globalAlpha=1-age/.45;for(let i=0;i<14;i++){const a=i*TAU/14,r=8+age*115;rect(256+Math.cos(a)*r,89+Math.sin(a)*r,3,3,i%2?'#fff0a4':'#ffd347');}g.restore();}}
  note(256,99,p.ink);run.cues.forEach((c,i)=>{circle(211+i*30,155,7,c.score===null?p.muted:c.score>=.5?'#ffd347':p.bad,2);});
 }else if(kind==='slash'){
  const [a,b]=run.cues;line([[110,139],[393,41]],p.muted,7);line([[115,133],[388,44]],p.ink,2);
  arrow(a.key,110,55,color(a),1.5);text('ЗАМАХ',110,91,13,color(a));arrow(b.key,403,116,color(b),1.5);text('УДАР',403,155,13,color(b));
  const u=Math.max(0,Math.min(1,(t-1.1)/.8)),x=126+u*256,y=134-u*89;star(x,y,13,p.accent);circle(254,88,21,p.accent);
  if(b.score!==null)line([[165,33],[347,145]],color(b),6);
 }else if(kind==='double'||kind==='tempo'){
  const receptor=82,y=87,next=run.cues.find(c=>c.time>=t-.2&&c.score===null)||run.cues.at(-1);line([[25,123],[487,123]],p.muted);arrow(next.key,receptor,y,p.muted,1.35);for(const c of run.cues){const x=receptor+(c.time-t)*190;if(x<12||x>490)continue;g.save();g.globalAlpha=x<receptor?.25:1;arrow(c.key,x,y,null,1.25);g.restore();if(c.at!==null&&c.score>=.5&&t-c.at<.26){g.save();g.globalAlpha=1-(t-c.at)/.26;star(receptor,y,28,mono?'#fff':'#f5df95');g.restore();}}
 }else if(kind==='thorn'){
  line([[18,15],[494,15]],p.muted);line([[18,166],[494,166]],p.muted);
  for(const gate of d.gates){const c=gate.passed?(gate.clear?p.good:p.bad):p.muted;rect(gate.x-8,16,16,gate.y-gate.half-16,c);rect(gate.x-8,gate.y+gate.half,16,166-gate.y-gate.half,c);for(let y=22;y<163;y+=16)if(Math.abs(y-gate.y)>gate.half)poly([[gate.x-8,y-5],[gate.x-16,y],[gate.x-8,y+5]],c);line([[gate.x-5,gate.y-gate.half+4],[gate.x+5,gate.y-gate.half+4]],p.good);}
  const x=22+t/run.duration*468;note(x,d.y+4);for(let i=1;i<5;i++)rect(x-i*9,d.y+4,4,3,p.muted);
 }else if(kind==='mist'){
  const x=194,y=20,cw=124,ch=132,target=run.mistTarget(),low=y+(1-target-.16)*ch;
  line([[x,y],[x,y+ch],[x+cw,y+ch],[x+cw,y]],p.ink,3);rect(x+4,low,cw-8,ch*.32,p.muted);line([[x-13,low],[x-4,low],[x-4,low+ch*.32],[x-13,low+ch*.32]],p.accent);
  const sy=y+(1-d.level)*ch;for(let i=0;i<8;i++){const yy=sy+i*5;line([[x+7,yy],[x+28,yy+Math.sin(t*5+i)*4],[x+66,yy-3],[x+cw-7,yy+2]],p.water,3);}text(Math.round(100*run.inside/Math.max(.1,run.measured))+'%',351,92,21,p.accent);text('ТУМАН',256,173,12,p.muted);
 }else if(kind==='glass'){
  line([[160,147],[352,147]],p.muted);rect(246,142,20,8,p.accent);g.save();g.translate(256,132);g.rotate(d.tilt*.68);poly([[0,-113],[25,-78],[13,-8],[0,5],[-13,-8],[-25,-78]],p.water);poly([[0,-113],[0,5],[-13,-8],[-25,-78]],p.muted);line([[0,-113],[25,-78],[13,-8],[0,5],[-13,-8],[-25,-78],[0,-113]],p.ink);line([[0,-111],[0,-12]],p.ink);
  if(Math.abs(d.tilt)>.6)line([[-12,-75],[6,-60],[-4,-48],[9,-36]],p.bad,3);g.restore();arrow('left',132,90);arrow('right',380,90);
 }else if(kind==='discord'){
  const times=[.42,.84,1.26,1.68];line([[30,113],[482,113]],p.muted);
  for(let i=0;i<4;i++){const x=50+i*135;if(i===d.broken){line([[x-17,83],[x-9,66],[x-1,91],[x+7,73],[x+17,87]],p.accent,3);text('РАЗРЫВ',x,145,11,p.accent);}else note(x,91,p.muted);}
  const x=50+(t-.42)/.42*135;line([[x,31],[x,119]],p.ink,3);if(run.cues[0].score!==null)star(50+d.broken*135,83,25,color(run.cues[0]));
 }else if(kind==='step'){
  const active=Math.min(3,Math.floor(t/(run.duration/4))),lane=['left','up','right'],yy=77;for(let i=0;i<3;i++){const x=152+i*104,safe=lane[i]===d.paths[active],answer=d.answers[active],c=answer?(answer.key===lane[i]?(answer.score?p.good:p.bad):p.muted):safe?p.ink:p.bad;line([[x-31,yy-27],[x+31,yy-27],[x+31,yy+28],[x-31,yy+28],[x-31,yy-27]],c);if(safe)foot(x,yy+4,c,i%2?1:-1);else{line([[x-10,yy-8],[x+10,yy+12]],c);line([[x+10,yy-8],[x-10,yy+12]],c);}arrow(lane[i],x,yy+55,null,.65);}for(let i=0;i<4;i++){text(String(i+1),208+i*32,27,14,d.answers[i]?(d.answers[i].score?p.good:p.bad):i===active?p.accent:p.muted);}
 }else if(kind==='reverse'){
  const show=t<.85;for(let i=0;i<3;i++){const x=176+i*80;line([[x-29,52],[x+29,52],[x+29,116],[x-29,116],[x-29,52]],p.muted);if(show)arrow(d.sequence[i],x,84,p.ink,1.3);else if(d.answers[i])arrow(d.answers[i].key,x,84,d.answers[i].score?p.good:p.bad,1.3);else text('?',x,97,33,p.muted);}
  text(show?'ЗАПОМНИ':'ПОВТОРИ СПРАВА НАЛЕВО',256,155,16,p.accent);
 }else if(kind==='chorus'){
  const lane=['left','up','right'],xs=[160,256,352],target=137;
  lane.forEach((k,i)=>{line([[xs[i],10],[xs[i],160]],p.muted);arrow(k,xs[i],target,p.muted,.95);});line([[116,target],[396,target]],p.accent,3);
  for(const c of run.cues){const x=xs[lane.indexOf(c.key)],y=target+(t-c.time)*128;if(y>=8&&y<=162){if(c.score!==null){star(x,target,17,color(c));}else{arrow(c.key,x,y,null,1.1);if(run.cues.filter(q=>q.beat===c.beat).length===2)circle(x,y,21,p.accent);}}}
 }else if(kind==='wand'){
  star(256,88,30,p.accent);text(Math.round(run.wandAccuracy()*100)+'%',490,22,13,p.accent,'right');const pos={up:[256,27],right:[409,88],down:[256,149],left:[103,88]};for(const [key,[x,y]]of Object.entries(pos)){const taken=d.collected.includes(key),fake=key===d.fake,c=taken?p.good:d.wrong.includes(key)?p.bad:p.ink;line([[256,88],[x,y]],p.muted);if(fake){line([[x-10,y-7],[x-3,y+5],[x+4,y-6],[x+12,y+8]],c,3);}else star(x,y,15,c);arrow(key,x+(key==='right'?40:key==='left'?-40:40),y,c,.7);if(taken)circle(x,y,23,p.accent);}
 }else if(kind==='heart'){
  const target=run.cues[0].time,dist=Math.abs(t-target)*90,c=run.cues[0].score===null?p.accent:color(run.cues[0]);
  g.save();g.beginPath();g.rect(0,0,256-dist,180);g.clip();heart(256-dist,96,3,c);g.restore();g.save();g.beginPath();g.rect(256+dist,0,256,180);g.clip();heart(256+dist,96,3,c);g.restore();line([[256,32],[256,141]],p.muted);text('25 HP',256,166,17,p.ink);
 }else if(kind==='breath'){
  const a=t<1.5?.25:1.6,up=t<1.5?1:2.35,progress=t<a?0:t<up?(t-a)/(up-a):1-(t-up)/.5,radius=29+Math.max(0,Math.min(1,progress))*29;
  circle(256,85,58,p.muted,3);circle(256,85,radius,run.held.has('confirm')?p.accent:p.water,4);heart(256,91,1.5,p.ink);
  text(t<a?'ГОТОВЬСЯ':t<up?'ЗАЖМИ — ВДОХ':'ОТПУСТИ — ВЫДОХ',256,161,16,p.accent);run.cues.forEach((c,i)=>rect(192+i*33,16,23,5,color(c)));
 }else if(kind==='shield'){
  line([[256,31],[300,49],[293,111],[256,146],[219,111],[212,49],[256,31]],p.muted,3);
  const vectors={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};for(const c of run.cues){const [dx,dy]=vectors[c.key],distance=c.score!==null?27:27+Math.abs(c.time-t)*75,x=256+dx*distance,y=86+dy*distance;arrow(c.key,x,y,color(c),1.15);}
  circle(256,86,28,p.accent);text('СОЕДИНИ НА ОТМЕТКЕ',256,173,12,p.muted);
 }else if(kind==='dome'){
  const centers=[177,335];for(let i=0;i<2;i++){const x=centers[i],a=run.arcAngle(i),c=d.stops[i]===null?p.water:d.scores[i]>=.5?p.good:p.bad;circle(x,90,49,p.muted);rect(x-7,29,14,10,p.accent);g.strokeStyle=c;g.lineWidth=6;g.beginPath();g.arc(x,90,49,a-Math.PI/2,a+Math.PI*1.3-Math.PI/2);g.stroke();star(x+Math.sin(a)*49,90-Math.cos(a)*49,8,c);text(i===0?'A / ←':'D / →',x,167,17,p.ink);}
 }else if(kind==='focus'){
  for(const r of [12,30,52])circle(256,88,r,r===12?p.accent:p.muted);line([[185,88],[327,88]],p.muted);line([[256,18],[256,157]],p.muted);star(256+d.x,88+d.y,d.locked?17:9,d.locked?p.good:p.ink);rect(182,165,148,5,p.muted);rect(182,165,148*Math.min(1,run.best/.5),5,p.accent);
 }
 if(run.phase==='ready'){
  g.globalAlpha=.84;rect(0,0,512,180,p.bg);g.globalAlpha=1;text('ПРИГОТОВЬСЯ',256,91,25,p.ink);
 }else if(run.result){
  g.globalAlpha=.88;rect(0,0,512,180,p.bg);g.globalAlpha=1;const r=run.result,c=r.quality==='weak'?p.muted:r.quality==='perfect'?p.accent:p.ink;text(r.label.toUpperCase(),256,78,31,c);text(Math.round(r.score*100)+'% точности',256,110,17,p.ink);
  const item=ShopModel.find(run.id);text(item?.target==='hero'?(r.quality==='perfect'?'+1 MP за исполнение':'Основной эффект сохранён'):(r.quality==='perfect'?'125% урона · точное попадание':r.quality==='good'?'100% урона':'70% урона'),256,141,16,p.ink);
  if(run.id==='double-syllable')text(r.hits.map((s,i)=>(i+1)+': '+SkillGamesModel.gradeName(SkillGamesModel.grade(s))).join('   '),256,164,13,p.ink);
 }
 g.textAlign='left';return p;
}
globalThis.SkillGamesArt={paint,arrows};
})();
