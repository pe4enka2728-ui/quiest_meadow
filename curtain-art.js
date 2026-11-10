/* A curved velvet curtain and matching semicircular stage on the world pixel grid. */
(()=>{
const snap=n=>Math.round(n/3)*3;
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(snap(x),snap(y),snap(w),snap(h))}
function path(g,points){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(snap(x),snap(y)):g.moveTo(snap(x),snap(y)));g.closePath()}
function poly(g,p,c){g.fillStyle=c;path(g,p);g.fill()}
const mix=(a,b,t)=>'#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');
function arc(p,extra=0,dy=0){return Array.from({length:p.samples+1},(_,i)=>{const a=i*Math.PI/p.samples;return [p.cx-Math.cos(a)*(p.rx+extra),p.cy+Math.sin(a)*(p.ry+extra)+dy]})}
function footprint(p){return arc(p,p.lip,p.thickness)}
function rail(g,points,color,width){g.strokeStyle=color;g.lineWidth=width;g.lineJoin='round';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(snap(x),snap(y)):g.moveTo(snap(x),snap(y)));g.stroke()}
function roof(g,p){const {cx,cy,rx,ry,height:h}=p,apex=[cx,cy-h-18],edge=arc(p,0,-h-12);
 // A solid canopy closes the former dark opening and rests on both end capitals.
 poly(g,[apex,...edge],'#4a263e');
 for(let i=0;i<12;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12,fan=[apex];for(let k=0;k<=8;k++){const t=a+(b-a)*k/8;fan.push([cx-Math.cos(t)*rx,cy+Math.sin(t)*ry-h-12])}const central=1-Math.abs(i-5.5)/6,color=i%2?mix([138,105,66],[198,163,107],central):mix([83,37,61],[151,64,96],central);poly(g,fan,color)}
 for(let i=1;i<12;i++){const a=i*Math.PI/12;rail(g,[apex,[cx-Math.cos(a)*rx,cy+Math.sin(a)*ry-h-12]],'#d6b476',3)}
 rail(g,[[cx-rx,cy-h-12],apex,[cx+rx,cy-h-12]],'#e1bf81',3);
 rail(g,edge,'#402b34',12);rail(g,arc(p,0,-h-14),'#b58e59',6);rail(g,arc(p,0,-h-18),'#e3be7c',3);
}
function column(g,p,side){const x=p.cx+side*p.rx,y=p.cy,h=p.height;
 // Faceted round shafts and broad capitals replace the thin exposed sticks.
 poly(g,[[x-12,y-h-9],[x+12,y-h-9],[x+12,y+6],[x-12,y+6]],'#452a3d');
 rect(g,x-9,y-h-6,6,h+9,'#91536a');rect(g,x-3,y-h-6,9,h+9,'#b57a80');rect(g,x+6,y-h-6,3,h+9,'#654057');rect(g,x-12,y-h-3,3,h+3,'#d6b276');
 rect(g,x-15,y-h-15,30,9,'#6f503c');rect(g,x-15,y-h-15,30,3,'#e6c58b');rect(g,x-12,y-h-6,24,6,'#b3915f');
 rect(g,x-12,y-6,24,6,'#d1ab70');poly(g,[[x-12,y],[x+12,y],[x+15,y+9],[x-15,y+9]],'#a57f50');rect(g,x-15,y+9,30,6,'#4c3435');rect(g,x-15,y+6,30,3,'#e0b97b');
 const yy=y-h*.48;poly(g,[[x,yy-6],[x+6,yy],[x,yy+6],[x-6,yy]],'#e3c084');
}
function draw(g,p,opening=0){const {cx,cy,rx,ry,height:h,lip,thickness}=p,inner=arc(p),outer=arc(p,lip);
 poly(g,[...outer,...arc(p,lip,thickness+3).reverse()],'#131922');
 poly(g,[...outer,...arc(p,lip,thickness).reverse()],'#493732');
 poly(g,[...inner,...outer.slice().reverse()],'#9d7c51');
 // The semicircular wooden floor remains after the cloth parts.
 poly(g,[[cx-rx,cy],[cx+rx,cy],...inner.slice().reverse()],'#9c744d');g.save();path(g,[[cx-rx,cy],[cx+rx,cy],...inner.slice().reverse()]);g.clip();for(let y=cy;y<=cy+ry;y+=15){rect(g,cx-rx,y,rx*2,3,'#614737');for(let x=cx-rx+(Math.round(y)%2)*21;x<cx+rx;x+=75)rect(g,x,y+3,3,12,'#c29b65');}g.restore();
 StageExitArt.draw(g,InteriorData.arena.rearExit);
 rail(g,outer,'#c7a76b',3);rail(g,arc(p,lip,thickness),'#302732',3);
 // Each material strip follows the rail in angle/depth; cloth never escapes the canopy.
 for(const panel of CurtainGeometry.panels(p,opening)){
  const [a,b]=panel.points,depth=Math.sin((panel.a+panel.b)/2),light=.18+.64*panel.light;
  for(let band=0;band<6;band++){const low=band/6,high=(band+1)/6,points=[[a[0],a[1]-h+h*low],[b[0],b[1]-h+h*low],[b[0],b[1]-h+h*high+1],[a[0],a[1]-h+h*high+1]];poly(g,points,mix([43,23,40],[172,76,110],Math.min(1,light*(.75+.25*depth)+band*.018)));}
  if(panel.index%8===0)rail(g,[[a[0],a[1]-h+8],[b[0],b[1]-h+8]],'#bf9666',3);
 }
 rail(g,arc(p,0,-h-6),'#392b32',12);rail(g,arc(p,0,-h-12),'#9e7c51',9);rail(g,arc(p,0,-h-15),'#e0bd7b',3);
 rail(g,inner,'#321e32',6);rail(g,arc(p,0,3),'#bd835f',3);
 const front=cy+ry;if(opening<.05){rect(g,cx-3,front-h+3,6,h-6,'#251626');rect(g,cx-9,front-h+15,3,h-21,'#b55d7b');rect(g,cx+6,front-h+15,3,h-21,'#51253e');}
 roof(g,p);for(const side of [-1,1])column(g,p,side);
 poly(g,[[cx,front-h-26],[cx+9,front-h-17],[cx,front-h-8],[cx-9,front-h-17]],'#e5c582');
}
function bounds(p){return {left:p.cx-p.rx-15,right:p.cx+p.rx+15,top:p.cy-p.height-24,bottom:p.cy+p.ry+p.lip+p.thickness+3}}
globalThis.CurtainArt={draw,bounds,arc,footprint,roof,column};
})();
