/* Rounded circus seating, with posters mounted on raised wall faces rather than floor tiles. */
(()=>{
let floor;const snap=n=>Math.round(n/3)*3;
function poly(g,points,color){g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(snap(x),snap(y)):g.moveTo(snap(x),snap(y)));g.closePath();g.fill()}
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(snap(x),snap(y),snap(w),snap(h))}
function path(g,points){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath()}
function arc(g,b,rx,ry,dy,color,width){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.ellipse(b.cx,b.cy+dy,rx,ry,0,b.start,b.end);g.stroke()}
function bench(g,b){
 poly(g,b.points.map(([x,y])=>[x+3,y+20]),'#0b101b88');poly(g,b.points.map(([x,y])=>[x,y+11]),'#4e302d');
 // Two planks form the curved seat; the higher outer rail is its backrest.
 poly(g,b.points,'#a66e45');arc(g,b,b.rx,b.ry,0,'#5b3930',3);arc(g,b,b.rx-13,b.ry-8,-2,'#d5aa72',3);
 arc(g,b,b.rx+20,b.ry+13,-21,'#422c2b',15);arc(g,b,b.rx+20,b.ry+13,-26,'#bc8753',8);arc(g,b,b.rx+20,b.ry+13,-30,'#e0b97c',3);
 for(let i=0;i<7;i++){const a=b.start+(b.end-b.start)*i/6,x=b.cx+Math.cos(a)*(b.rx+20),y=b.cy+Math.sin(a)*(b.ry+13);rect(g,x-3,y-24,6,39,'#68432e');rect(g,x-3,y-25,3,28,'#c99660')}
}
function init(){
 floor=document.createElement('canvas');floor.width=512;floor.height=617;const g=floor.getContext('2d');g.scale(1/3,1/3);g.translate(0,3600);
 rect(g,0,-3600,1536,1851,'#111923');
 const a=InteriorData.arena;g.fillStyle='#35263c';g.beginPath();g.ellipse(a.center.x,a.center.y-10,a.rx+24,a.ry+24,0,0,Math.PI*2);g.fill();
 g.save();path(g,InteriorData.perimeter);g.clip();rect(g,150,-3540,1236,1780,'#35383f');
 for(let y=-3528;y<-1780;y+=48)for(let x=144;x<1392;x+=48){rect(g,x,y,48,48,(Math.floor(x/48)+Math.floor(y/48))%2?'#45414c':'#383e46');rect(g,x+3,y+3,42,3,'#67657333')}
 rect(g,636,-2780,264,980,'#6f344d');for(const x of [636,894])rect(g,x,-2780,6,980,'#c4a46b');
 for(let y=-2720;y<-1810;y+=72){poly(g,[[768,y-16],[792,y],[768,y+16],[744,y]],'#a96773');rect(g,765,y-3,6,6,'#e1c18b')}
 // The central ring is free floor. The audience follows the room's curved perimeter.
 for(let i=0;i<24;i++){const p1=i*Math.PI/12,p2=(i+1)*Math.PI/12;poly(g,[[768,-3105],[768+Math.cos(p1)*360,-3105+Math.sin(p1)*232],[768+Math.cos(p2)*360,-3105+Math.sin(p2)*232]],i%2?'#374e4b':'#3e5551')}
 for(let ring=0;ring<3;ring++){g.strokeStyle=['#cfb985','#794b63','#aaa58c'][ring];g.lineWidth=ring===0?9:4;g.beginPath();g.ellipse(768,-3105,376-ring*13,243-ring*9,0,0,Math.PI*2);g.stroke()}
 for(let i=0;i<16;i++){const t=i*Math.PI/8,x=768+Math.cos(t)*338,y=-3105+Math.sin(t)*214;poly(g,[[x,y-8],[x+8,y],[x,y+8],[x-8,y]],i%2?'#c29d73':'#ba758b')}
 const star=Array.from({length:16},(_,i)=>{const t=-Math.PI/2+i*Math.PI/8,r=i%2?26:68;return [768+Math.cos(t)*r,-3105+Math.sin(t)*r*.65]});poly(g,star,'#b99c68');
 g.restore();
 const edge={cx:a.center.x,cy:a.center.y,start:Math.PI-Math.acos(168/a.rx),end:Math.PI*2+Math.acos(168/a.rx)};
 // A continuous curved wall, leaving only the corridor opening at the foot.
 g.strokeStyle='#7d4d65';g.lineWidth=24;g.beginPath();g.ellipse(a.center.x,a.center.y,a.rx+4,a.ry+4,0,Math.acos(168/a.rx),-Math.PI-Math.acos(168/a.rx),true);g.stroke();
 g.strokeStyle='#c29c67';g.lineWidth=5;g.stroke();for(const b of InteriorData.benches)bench(g,b);CircusSpotlights.init(g=>{CurtainArt.draw(g,InteriorData.arena.curtain);for(const b of InteriorData.benches)bench(g,b)});
}
function poster(g,p){const x=p.x,y=p.y;
 rect(g,x+6,y+6,p.w,p.h,'#221b29');rect(g,x,y,p.w,p.h,'#926d4f');rect(g,x+3,y+3,p.w-6,p.h-6,p.seed%2?'#d2bc92':'#abc3b4');
 rect(g,x+p.w/2-3,y-3,6,9,'#d9b57a');
 if(p.seed%3===0){for(let i=0;i<14;i++){const a=i*.65,r=3+i*1.15;rect(g,x+p.w/2+Math.cos(a)*r,y+27+Math.sin(a)*r,3,3,'#725064')}}
 else if(p.seed%3===1){poly(g,[[x+11,y+29],[x+p.w/2,y+13],[x+p.w-12,y+29],[x+p.w/2,y+45]],'#59636a');rect(g,x+p.w/2-3,y+21,6,15,'#b77687')}
 else{const pts=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?8:19;return [x+p.w/2+Math.cos(a)*r,y+29+Math.sin(a)*r]});poly(g,pts,'#a36876')}
 for(let row=0;row<3;row++)for(let col=0;col<7;col++){const bits=((p.seed+col*17+row*31)*1729)>>>0;for(let yy=0;yy<3;yy++)for(let xx=0;xx<2;xx++)if((bits>>(yy*2+xx))&1)rect(g,x+8+col*8+xx*3,y+55+row*9+yy*3,3,3,'#504351')}
}

function cardboard(g,p,t,textures){const {x,y,index}=p,jump=Math.max(0,Math.sin(t*2.4+index*1.7))*23;
 g.save();g.translate(snap(x),snap(y-jump));g.rotate(Math.sin(t*1.7+index)*.045);rect(g,-30,-85,60,81,'#8a6f52');rect(g,-27,-82,54,75,'#dbc5a0');g.imageSmoothingEnabled=false;g.drawImage(textures[index%2?'mesme_miku_1_7':'teto_2_7'],-24,-80,48,64);rect(g,-3,-10,6,16,'#795c43');g.restore()}
function draw(ctx,actors,drawPerson,t,cameraY,textures,options={}){ctx.save();ctx.translate(0,-Math.round(cameraY));ctx.imageSmoothingEnabled=false;ctx.drawImage(floor,0,-3600,1536,1851);CurtainArt.draw(ctx,InteriorData.arena.curtain,globalThis.CurtainProgress?.amount||0);if(!globalThis.GumiEncounter?.defeated)CircusSpotlights.drawFloor(ctx,t);CircusSpotlights.drawFixtures(ctx,t,!globalThis.GumiEncounter?.defeated);
 for(const x of [330,1086]){rect(ctx,x,-2700,120,950,'#442e43');rect(ctx,x+3,-2700,114,950,'#59394f');for(let y=-2678;y<-1790;y+=139){rect(ctx,x+6,y,108,117,'#6d4558');rect(ctx,x+9,y+3,102,3,'#9e6c73');rect(ctx,x+6,y+120,108,5,'#352637')}rect(ctx,x+(x===330?114:0),-2700,6,950,'#d0aa73');rect(ctx,x+(x===330?108:6),-2700,6,950,'#2b202e')}
 for(const p of InteriorData.posters)poster(ctx,p);
 const c=InteriorData.hall.savePoint;rect(ctx,c.x-38,-2260,76,50,'#344c50');rect(ctx,c.x-32,-2254,64,8,'#b6c5ad');rect(ctx,c.x-20,-2230,40,9,'#6c8e85');
 const a=InteriorData.arena;
 const items=actors.map(actor=>({depth:actor.body.y,draw:()=>drawPerson(actor.body,actor.name)}));if(options.showGumi!==false)items.push({depth:a.gumi.y,draw:()=>GumiSprite.draw(ctx,t)});for(const p of InteriorData.spectators)items.push({depth:p.y,draw:()=>cardboard(ctx,p,t,textures)});
 for(const item of items.sort((a,b)=>a.depth-b.depth))if(item.depth>cameraY-100&&item.depth<cameraY+1120)item.draw();
 rect(ctx,666,-1818,204,12,'#b99a67');rect(ctx,672,-1806,192,9,'#2b1b2a');ctx.restore();}
globalThis.InteriorArt={init,draw,bench,cardboard};
})();
