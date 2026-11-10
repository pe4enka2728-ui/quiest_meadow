/* Pixel gate. Only the two post silhouettes collide; the lintel is overhead. */
(()=>{
const palette={outline:'#18392f',shadow:'#4e6d60',stone:'#b7bea1',light:'#eff0ca',cream:'#e7d5a5',pink:'#de7fa0',mint:'#80c9b0'};
function block(g,x,y,w,h,color){g.fillStyle=palette[color]||color;g.fillRect(x,y,w,h)}
function postShape(g,p){
 const x=p.x,y=p.y;
 block(g,x+4,y,28,14,'outline');block(g,x+7,y+3,22,8,'cream');block(g,x+8,y+3,18,3,'light');
 block(g,x+8,y+14,20,96,'outline');block(g,x+11,y+14,14,96,'stone');block(g,x+11,y+14,4,96,'light');block(g,x+23,y+14,2,96,'shadow');
 block(g,x+16,y+17,5,87,p.id==='arch-left'?'pink':'mint');
 block(g,x,y+110,36,20,'outline');block(g,x+3,y+113,30,14,'stone');block(g,x+3,y+113,30,4,'light');block(g,x+3,y+124,30,3,'shadow');
 block(g,x+7,y+119,22,2,'cream');
}
function makePost(p){const canvas=document.createElement('canvas');canvas.width=p.w;canvas.height=p.h;const g=canvas.getContext('2d');g.translate(-p.x,-p.y);postShape(g,p);return {canvas,rect:[p.x,p.y,p.w,p.h]}}
function postLights(g,p,t){const phase=p.id==='arch-left'?0:Math.PI;g.save();g.globalAlpha=.45+.45*(.5+.5*Math.sin(t*1.5+phase));for(let i=0;i<3;i++){const y=p.y+22+Math.floor((t*10+i*29)%78/2)*2;block(g,p.x+17,y,3,6,'#ecffe9')}g.restore()}
function ground(g,fill=true){const a=LevelData.arch.ground;
 if(fill)block(g,a.x,a.y,a.w,a.h,'#f3d17e');
 for(let row=0;row<8;row++){
  const y=a.y+row*32+8,x=a.x+12+(row%2)*27;
  block(g,x+2,y,26,2,'#d3c9a4');block(g,x,y+2,30,6,'#b7b99a');block(g,x+2,y+8,26,2,'#a6ab8e');block(g,x+4,y+2,22,2,'#e3d8b2');
  block(g,a.x+(row%2?2:a.w-6),y+12,4,4,'#e6bf6d');
 }
 block(g,a.x,242,a.w,8,'#b9b69a');block(g,a.x+2,242,a.w-4,2,'#e4d8b1');
 for(let i=1;i<4;i++)block(g,a.x+i*22,244,2,6,'#8b9a83');
 g.save();g.globalAlpha=.17;block(g,a.x+9,222,a.w-18,9,'outline');g.restore();
}
function overhead(g,t){const a=LevelData.arch,b=a.beam,cx=a.x,cy=b.springY;
 // Rasterized ring keeps every edge on the same 4-pixel grid.
 for(let y=cy-b.outerRadius;y<=cy+8;y+=4)for(let x=cx-b.outerRadius;x<cx+b.outerRadius;x+=4){
  const dx=x+2-cx,dy=y+2-cy,r=Math.hypot(dx,dy);if(r>b.outerRadius||r<b.innerRadius)continue;
  let color='cream';if(r>b.outerRadius-4||r<b.innerRadius+4)color='outline';else if(r>b.outerRadius-8)color='light';else if(r<b.innerRadius+8)color='shadow';else{const sector=Math.floor((Math.atan2(dy,dx)+Math.PI)*8/Math.PI);color=sector%3===0?'mint':sector%3===1?'pink':'cream'}block(g,x,y,4,4,color);
 }
 for(let i=0;i<9;i++){const angle=-Math.PI+i*Math.PI/8,x=Math.round((cx+Math.cos(angle)*66)/2)*2,y=Math.round((cy+Math.sin(angle)*66)/2)*2;block(g,x-4,y-4,8,8,'outline');const lit=Math.sin(t*1.4-i*.6)>.1;block(g,x-2,y-2,4,4,lit?'#fff0bd':i%2?'#b36989':'#619d89')}
 const my=a.y,r=a.radius;
 // A solid medallion masks actors consistently; just its spiral pattern moves.
 for(let y=my-r-6;y<my+r+6;y+=2)for(let x=cx-r-6;x<cx+r+6;x+=2){
  const dx=x+1-cx,dy=y+1-my,d=Math.hypot(dx,dy);if(d>r+5)continue;
  const color=d>r+2?'outline':d>r-1?'cream':d>r-3?'outline':Math.sin(Math.atan2(dy,dx)+d*.17-t*a.speed)>0?'#e580a9':'#8bd8c0';block(g,x,y,2,2,color);
 }
 block(g,cx-2,my-2,4,4,'light');block(g,cx-1,my-1,2,2,'outline');
 // Two small suspended crystals sway, without ever becoming a floor barrier.
 for(const side of [-1,1]){const x=cx+side*49+Math.round(Math.sin(t*.9+side)*2),y=146;block(g,x,130,2,14,'shadow');g.fillStyle=side<0?palette.pink:palette.mint;g.beginPath();g.moveTo(x+1,y);g.lineTo(x+6,y+7);g.lineTo(x+1,y+15);g.lineTo(x-4,y+7);g.closePath();g.fill();block(g,x,y+4,2,5,'light')}
}
globalThis.ArchArt={makePost,postLights,ground,overhead};
})();
