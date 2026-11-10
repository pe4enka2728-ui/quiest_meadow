/* Five pixel-paper sheets, quiet wavy writing, Gumi's existing portrait and Teto's grips. */
(()=>{
'use strict';let sheets=[],board=null;
function poly(g,ps,c){g.fillStyle=c;g.beginPath();ps.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function wave(g,x,y,width,seed=0,alpha=.32){g.save();g.globalAlpha=alpha;g.strokeStyle='#67543b';g.lineWidth=1.5;g.beginPath();for(let i=0;i<=width;i+=3){const yy=y+Math.sin(i*.13+seed)*2.1+Math.sin(i*.39+seed)*1.2;i?g.lineTo(x+i,Math.round(yy)):g.moveTo(x,yy);}g.stroke();g.restore();}
function leaflet(index){const c=document.createElement('canvas');c.width=320;c.height=428;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 poly(g,[[2,1],[317,1],[317,415],[301,415],[294,423],[278,420],[265,425],[242,422],[224,427],[206,423],[188,426],[171,421],[149,425],[126,421],[110,426],[91,421],[75,424],[58,420],[40,424],[25,419],[3,420]],index?'#c5b38c':'#ecddb7');
 g.fillStyle=index?'#a6916e':'#cbb98b';g.fillRect(6,6,309,3);g.fillRect(6,7,3,406);g.fillStyle=index?'#d1c09c':'#f8edce';g.fillRect(10,11,302,2);
 for(let i=0;i<150;i++){g.globalAlpha=.09;g.fillStyle=i%2?'#fff4cb':'#705a37';g.fillRect(9+(i*71)%301,13+(i*37)%394,1+i%3,1);}g.globalAlpha=1;
 if(!index){
  g.strokeStyle='#927b51';g.lineWidth=2;g.strokeRect(17,18,285,375);g.textAlign='center';g.font='20px QuietMeadowPixel';g.fillStyle='#5d4b35';g.fillText('ПРОСЬБА О ПОМОЩИ',160,48);g.fillStyle='#877652';g.fillRect(78,68,164,168);g.fillStyle='#d7c69f';g.fillRect(82,72,156,160);if(GumiPortrait.frames[0])g.drawImage(GumiPortrait.frames[0],88,77,144,144);g.strokeStyle='#6f6043';g.strokeRect(82,72,156,160);g.font='34px QuietMeadowPixel';g.fillStyle='#493c2a';g.fillText('ГУМИ',160,277);
  for(let j=0;j<6;j++)wave(g,39,302+j*12,238-(j%3)*19,j,.45);g.font='13px QuietMeadowPixel';g.fillStyle='#8d7856';g.fillText('ГИЛЬДИЯ АВАНТЮРИСТОВ',160,383);
 }else{
  g.save();g.globalAlpha=.36;g.fillStyle='#68593e';g.fillRect(40,35,229-index*13,5);g.fillRect(63,48,171,3);g.restore();
  if(index===2){g.globalAlpha=.18;g.strokeStyle='#68593e';g.lineWidth=3;g.beginPath();g.arc(160,135,46,0,Math.PI*2);g.stroke();poly(g,[[121,152],[145,93],[164,143],[185,112],[208,157]],'#766544');g.globalAlpha=1;}
  for(let j=0;j<22;j++)wave(g,30+(j%2)*7,74+j*13,251-(j%4)*17,index+j*.8,.28);
  g.globalAlpha=.18;g.strokeStyle='#785d43';g.lineWidth=3;g.beginPath();g.arc(240,360,24,0,Math.PI*2);g.stroke();g.globalAlpha=1;
 }
 poly(g,[[294,398],[317,398],[294,421]],index?'#aa9672':'#cbbb92');return c;
}
function init(){sheets=Array.from({length:5},(_,i)=>leaflet(i));board=document.createElement('canvas');board.width=600;board.height=330;const g=board.getContext('2d');g.fillStyle='#745235';g.fillRect(0,0,600,330);for(let y=0;y<330;y+=55){g.fillStyle=y%110?'#6b492f':'#795738';g.fillRect(0,y,600,53);g.fillStyle='#4e3327';g.fillRect(0,y+53,600,2);}for(let i=0;i<250;i++){const x=i*89%600,y=i*71%330;g.fillStyle=i%2?'#402e2024':'#c3975c1b';g.fillRect(x,y,8+i%53,1);}for(const [x,y]of [[14,13],[584,13],[14,314],[584,314]]){g.fillStyle='#302c28';g.fillRect(x-3,y-3,6,6);g.fillStyle='#a69976';g.fillRect(x-2,y-2,3,2);}}
function copySheet(canvas,index=0){if(!sheets.length)init();canvas.width=320;canvas.height=428;canvas.getContext('2d').drawImage(sheets[index],0,0);}
function drawBoard(canvas){if(!board)init();canvas.width=1200;canvas.height=660;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(board,0,0,1200,660);}
function marker(g,t,p){const y=Math.round(p.markerY+Math.sin(t*2.7)*7);g.save();g.translate(Math.round(p.x),y);g.fillStyle='#28352a';g.fillRect(-8,-29,16,29);g.fillRect(-8,5,16,15);g.fillStyle='#d49a28';g.fillRect(-5,-26,10,23);g.fillRect(-5,8,10,9);g.fillStyle='#ffe56e';g.fillRect(-5,-27,7,23);g.fillRect(-5,7,7,8);for(let i=0;i<3;i++){const a=t*1.1+i*2.1;g.globalAlpha=.25+.4*Math.sin(a)**2;g.fillStyle='#ffe893';g.fillRect(Math.round(Math.cos(a)*23),Math.round(Math.sin(a)*18-5),3,3);}g.restore();}
function hands(canvas,frame,clock){const g=canvas.getContext('2d');g.clearRect(0,0,1536,1024);if(frame.hands<=0)return;const h=frame.hands;
 for(const side of [-1,1]){const x=frame.x+(side<0?43:frame.w-43),y=frame.y+frame.h-68+(1-h)*205+Math.sin(clock*1.3)*1.2;g.save();g.translate(Math.round(x/2)*2,Math.round(y/2)*2);g.rotate(side*-.11);g.imageSmoothingEnabled=false;
  g.fillStyle='#1b1525';g.fillRect(-32,18,64,185);g.fillStyle='#302d3d';g.fillRect(-26,22,52,176);g.fillStyle='#4f495a';g.fillRect(side<0?-23:14,27,9,170);g.fillStyle='#c72350';g.fillRect(-27,38,54,13);g.fillStyle='#f4e5d2';g.fillRect(-27,16,54,16);g.fillStyle='#62263c';g.fillRect(-22,-14,44,33);g.fillStyle='#f4c7b0';g.fillRect(-17,-17,34,35);g.fillRect(side<0?12:-25,-34,13,31);g.fillStyle='#ffe0c1';g.fillRect(-13,-17,25,9);g.fillRect(side<0?13:-23,-32,8,17);g.fillStyle='#d68d88';g.fillRect(-17,9,34,6);g.restore();}
}
globalThis.GuildBoardArt={init,copySheet,drawBoard,marker,hands,get sheets(){return sheets;}};
})();
