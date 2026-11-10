/* Native 512px artwork uses the same three-pixel grid and Teto sheets as the world. */
(()=>{
'use strict';
let images={};const colors={red:'#ef536c',yellow:'#f1d16a',blue:'#73d9ed'};
function text(g,s,x,y,size=10,color='#f3eee2',align='left'){g.fillStyle=color;g.font=size+'px QuietMeadowPixel,monospace';g.textAlign=align;g.fillText(s,x,y);}
function heart(g,x,y,color,s=2){const rows=['01100110','11111111','11111111','01111110','00111100','00011000'];g.fillStyle='#111521';for(let j=0;j<6;j++)for(let i=0;i<8;i++)if(rows[j][i]==='1')g.fillRect(x+(i-4)*s-1,y+(j-3)*s-1,s+2,s+2);g.fillStyle=color;for(let j=0;j<6;j++)for(let i=0;i<8;i++)if(rows[j][i]==='1')g.fillRect(x+(i-4)*s,y+(j-3)*s,s,s);g.fillStyle='#ffeacd';g.fillRect(x-2*s,y-2*s,s,s);}
function actor(g,x,y,dir=1,moving=false,t=0,reflection=false){const frames=[10,11,9,11],frame=moving?Math.floor(t*8)%3+dir*3:dir*3+1,im=images['teto_2_'+frame];if(!im)return;g.save();g.globalAlpha=reflection?.72:1;g.drawImage(im,Math.round(x)-9,Math.round(y)-24,18,24);if(reflection){g.globalCompositeOperation='source-atop';g.fillStyle='#69dcef55';g.fillRect(Math.round(x)-9,Math.round(y)-24,18,24);}g.restore();}
function symbol(g,index,x,y,active=false,tone=null){g.save();g.translate(x,y);g.fillStyle=tone||(active?'#fff0b5':'#bbaa87');g.strokeStyle=g.fillStyle;g.lineWidth=2;
 if(index===0){g.fillRect(-12,-10,4,25);g.fillRect(8,-10,4,25);g.fillRect(-8,-15,16,4);g.fillRect(-10,-12,20,4);g.fillStyle='#56766c';g.fillRect(-7,-10,14,7);}
 else if(index===1){g.beginPath();g.moveTo(0,-18);g.lineTo(11,0);g.lineTo(0,17);g.lineTo(-10,0);g.closePath();g.fill();g.fillStyle=active?'#fffce8':'#708d87';g.fillRect(-1,-12,3,22);}
 else if(index===2){g.fillRect(-3,-3,20,5);g.fillRect(11,1,4,8);g.fillRect(4,1,4,6);g.strokeRect(-17,-10,15,15);}
 else{g.save();g.rotate(-.65);g.fillRect(-2,-2,4,23);g.fillRect(-8,-13,16,8);g.fillRect(-4,-17,8,16);g.restore();}
 g.restore();}
function card(canvas,id,mystery=false){if(['red','yellow','blue'].includes(id)&&globalThis.HeartTrialsArt?.card){HeartTrialsArt.card(canvas,id,mystery);return;}const g=canvas.getContext('2d'),s=128;g.imageSmoothingEnabled=false;g.fillStyle='#15222c';g.fillRect(0,0,s,s);g.fillStyle='#27363a';for(let y=0;y<128;y+=16)for(let x=0;x<128;x+=16)if((x+y)%32===0)g.fillRect(x,y,16,16);
 if(id==='red'){g.fillStyle='#bf8b65';for(const [x,y]of [[3,93],[47,73],[91,54]]){g.fillRect(x,y,33,6);g.fillStyle='#8b7276';g.fillRect(x+4,13,1,y-13);g.fillStyle='#bf8b65';}heart(g,100,35,colors.red,3);}
 else if(id==='yellow'){for(let i=0;i<4;i++){const x=32+i%2*65,y=33+Math.floor(i/2)*64;g.fillStyle='#866f4a';g.fillRect(x-24,y-24,48,48);g.fillStyle='#37453d';g.fillRect(x-20,y-20,40,40);g.save();g.translate(x,y);g.scale(.7,.7);symbol(g,i,0,0,i===2);g.restore();}}
 else if(id==='blue'){g.fillStyle='#4d8aa0';g.fillRect(11,83,106,5);g.fillRect(61,14,3,100);actor(g,35,80,1,false,0);actor(g,91,80,3,false,0,true);heart(g,64,32,colors.blue,2);}
 else{const im=images.miku_neutral;if(im)g.drawImage(im,24,16,80,80);else{g.fillStyle='#82cbd5';g.fillRect(38,28,52,58);}for(let i=0;i<3;i++)heart(g,32+i*32,110,[colors.red,colors.yellow,colors.blue][i],1.5);}
 if(mystery){g.fillStyle='#0e1426e5';g.fillRect(0,0,128,128);text(g,'???',64,73,31,'#d9e8e2','center');}
}
globalThis.HeartGamesArt={init(textures){images=textures;},card,heart,symbol};
})();
