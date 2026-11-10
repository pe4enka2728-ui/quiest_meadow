/* A cutaway two-room home, with pixel furniture and collision-aligned feet. */
(()=>{
'use strict';let base=null;const cache=new Map(),D=HomeData;
function polygon(g,ps,c){g.fillStyle=c;g.beginPath();ps.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function furniture(p){if(cache.has(p.id))return cache.get(p.id);const c=document.createElement('canvas');c.width=Math.ceil(p.w/3);c.height=Math.ceil(p.h/3);const g=c.getContext('2d');g.scale(1/3,1/3);const w=p.w,h=p.h,ink='#302b35',wood='#895c44',light='#c69a66',shade='#624233';
 const r=(x,y,ww,hh,color)=>rect(g,x,y,ww,hh,color);
 if(p.kind.startsWith('bed')){const red=p.kind==='bed-red',cloth=red?'#b64a62':'#408b95',bright=red?'#db7b86':'#7bc4c4';r(8,10,w-16,h-16,ink);r(13,7,w-26,38,wood);r(18,9,w-36,11,light);r(17,31,w-34,h-44,'#e3d3b7');r(22,34,w-44,43,'#f0e4cd');r(29,39,w-58,29,'#c5b8a7');r(34,40,w-68,23,'#fff0d1');r(18,80,w-36,h-94,cloth);r(22,82,13,h-98,bright);r(39,81,w-64,7,bright);r(25,h-43,w-50,8,bright);r(18,h-28,w-36,12,wood);r(22,h-23,w-44,4,light);r(11,h-20,14,20,shade);r(w-25,h-20,14,20,shade);for(let i=0;i<5;i++){r(50+i*20,113,5,5,'#f1dab5');r(55+i*20,132,5,5,'#e7d1ad');}}
 else if(p.kind.includes('desk')){r(9,18,w-18,h-18,ink);r(15,32,15,h-32,shade);r(w-30,32,15,h-32,shade);r(3,5,w-6,43,wood);r(7,5,w-14,8,light);r(7,42,w-14,7,shade);r(21,17,48,32,'#eee0bc');r(25,21,38,3,'#81716b');r(25,28,29,2,'#81716b');r(75,14,43,25,'#dfcaa3');r(79,18,32,3,'#6e6662');r(79,24,29,2,'#6e6662');r(w-31,20,17,16,'#48737d');r(w-28,17,11,4,'#96b6b3');if(p.kind==='music-desk'){r(112,2,20,34,'#44394a');r(120,0,5,25,'#d3b275');r(111,31,24,5,'#ad8c59');}else{r(78,54,47,25,wood);r(82,55,39,5,light);r(90,61,17,4,'#ccb16e');}}
 else if(p.kind==='wardrobe'){r(3,2,w-6,h-5,ink);r(8,4,w-16,h-14,wood);r(12,10,w-24,12,light);r(12,29,w-24,h-54,'#9c704c');r(w/2-3,27,6,h-44,shade);r(w/2-13,h*.58,5,8,'#edce85');r(w/2+8,h*.58,5,8,'#edce85');r(9,h-18,w-18,9,shade);r(10,h-9,12,9,wood);r(w-22,h-9,12,9,wood);}
 else if(p.kind==='bookshelf'){r(2,0,w-4,h-4,ink);r(7,3,w-14,h-12,wood);for(let row=0;row<4;row++){const y=14+row*40;r(11,y,w-22,31,'#4b3c39');for(let i=0;i<6;i++){r(13+i*10,y+5+(i%2)*5,8,25-(i%2)*5,['#8f5061','#638c82','#b0925f','#766b92'][i%4]);r(15+i*10,y+10+(i%2)*5,4,2,'#e0c69d');}r(9,y+32,w-18,7,light);}r(9,h-12,w-18,9,shade);}
 else if(p.kind.startsWith('nightstand')){r(7,19,w-14,h-19,ink);r(11,22,w-22,h-26,wood);r(3,15,w-6,16,light);r(11,42,w-22,4,shade);r(w/2-4,47,8,5,'#e0c17d');r(w/2-3,0,6,16,'#58484e');r(w/2-15,0,30,8,p.kind==='nightstand-red'?'#dda1a0':'#a7cfbf');r(w/2-20,8,40,5,'#efe0ad');}
 else if(p.kind==='tea-table'){r(15,25,13,h-25,shade);r(w-28,25,13,h-25,shade);r(5,6,w-10,55,ink);r(9,7,w-18,47,wood);r(13,10,w-26,6,light);r(20,23,w-40,24,'#d6c59e');r(29,26,16,15,'#ecdfbc');r(45,29,6,9,'#efe3c4');r(w-48,26,16,15,'#ecdfbc');r(w-32,29,6,9,'#efe3c4');r(w/2-9,16,18,25,'#5d8a88');r(w/2-6,12,12,6,'#d1d4b3');}
 else if(p.kind==='chest'){r(5,6,w-10,h-12,ink);r(10,8,w-20,h-20,wood);r(10,25,w-20,6,shade);r(13,10,w-26,5,light);r(25,10,8,h-24,'#5d4650');r(w-33,10,8,h-24,'#5d4650');r(w/2-8,30,16,18,'#c5a05b');r(w/2-3,35,6,9,ink);r(7,h-16,14,13,shade);r(w-21,h-16,14,13,shade);}
 else{r(8,8,w-16,h-10,ink);r(11,10,w-22,h-22,'#697f83');r(15,13,w-30,9,'#9fbbb6');r(12,h-15,w-24,9,'#4f545c');}
 cache.set(p.id,c);return c;
}
function init(){base=document.createElement('canvas');base.width=768;base.height=512;const g=base.getContext('2d');g.scale(.5,.5);rect(g,0,0,1536,1024,'#14242b');rect(g,154,142,1228,768,'#3b2b2d');
 g.save();g.beginPath();g.rect(182,186,1172,699);g.clip();for(let y=186;y<885;y+=28)for(let x=182-(Math.floor((y-186)/28)%2)*45;x<1354;x+=90){const side=x<752,palette=side?['#b89367','#b18a61','#bb956c']:['#b59975','#ab9170','#bc9f7d'];rect(g,x,y,88,26,palette[(Math.floor((x+100)/90)+Math.floor(y/28))%3]);rect(g,x+5,y+5,38+(Math.floor(x)%3)*8,1,'#d0af83');rect(g,x+2,y+25,86,2,'#927352');}g.restore();
 // Walkable rugs: the weave never creates a physical obstacle.
 for(const [x,y,w,h,red]of [[353,487,282,150,true],[916,452,269,155,false]]){rect(g,x,y,w,h,red?'#8b495e':'#4d7f84');rect(g,x+7,y+7,w-14,h-14,red?'#b66f7b':'#76a7a3');rect(g,x+14,y+14,w-28,h-28,red?'#995263':'#5a8c8e');for(let i=0;i<13;i++)rect(g,x+22+i*19,y+24,3,h-48,red?'#bf8188':'#8ab2aa');for(let i=0;i<14;i++){rect(g,x+i*20,y-4,5,7,'#c9ac85');rect(g,x+i*20,y+h-3,5,7,'#c9ac85');}}
 // North walls and both bedroom windows.
 rect(g,154,82,1228,105,'#d6cab0');rect(g,154,174,1228,13,'#806955');rect(g,154,85,1228,9,'#a99475');rect(g,154,130,1228,4,'#b4a68c');
 for(const [x,color]of [[405,'#ac5a70'],[1092,'#4f9295']]){rect(g,x-83,99,166,78,'#5d5147');rect(g,x-75,104,150,64,'#9dc8c6');rect(g,x-70,109,65,25,'#b7d9d0');rect(g,x+5,109,65,25,'#b7d9d0');rect(g,x-3,103,6,67,'#ddcaa0');rect(g,x-76,134,152,5,'#ddcaa0');rect(g,x-89,96,27,87,color);rect(g,x+62,96,27,87,color);rect(g,x-83,98,6,82,'#d4a5a0');rect(g,x+67,98,6,82,'#b5d0bd');rect(g,x-87,179,174,9,'#a38a64');}
 rect(g,154,142,27,762,'#c1b29b');rect(g,156,144,7,755,'#ebe0c5');rect(g,1354,142,28,762,'#81776e');rect(g,1354,144,7,755,'#b5aa94');
 // Tall partition, with a full-height gap between its two pieces.
 for(const [y,h]of [[176,375],[672,230]]){rect(g,748,y-31,36,h+31,'#867361');rect(g,748,y-31,8,h+26,'#ddd0b4');rect(g,775,y-31,9,h+31,'#62534c');rect(g,752,y+h-6,28,8,'#5b4a43');}
 // Bedroom name plaques and little wall decorations.
 for(const [x,name,c]of [[247,'ТЕТО','#ad566f'],[1250,'МИКУ','#528e91']]){rect(g,x-40,116,80,31,'#81654e');rect(g,x-36,120,72,23,'#e5d2a7');g.fillStyle=c;g.font='18px QuietMeadowPixel';g.textAlign='center';g.fillText(name,x,138);}
 rect(g,651,105,58,59,'#81654e');rect(g,657,111,46,47,'#c6b08b');rect(g,670,122,20,24,'#9c7a5d');rect(g,674,126,12,16,'#d5c69d');
 // Clear south doorway and short entrance mat.
 rect(g,319,908,136,116,'#5d4c44');rect(g,331,910,112,114,'#9c7f5b');rect(g,334,883,100,53,'#795b59');rect(g,339,888,90,41,'#b18b7c');
 for(const [x,y]of [[210,837],[1307,838]]){rect(g,x-15,y-8,30,20,'#705344');rect(g,x-19,y-12,38,8,'#b2865d');for(let i=0;i<5;i++){const xx=x+(i-2)*9,yy=y-22-Math.abs(i-2)*5;rect(g,xx-4,yy,8,24,'#3e7358');rect(g,xx-9,yy+4,18,8,'#6ba474');}}
}
function draw(g,t,actors,drawPerson,debug=false){if(!base)init();g.clearRect(0,0,1536,1024);g.imageSmoothingEnabled=false;g.drawImage(base,0,0,1536,1024);const list=D.items.map(p=>({depth:p.depth,draw:()=>g.drawImage(furniture(p),p.x,p.y,p.w,p.h)}));for(const a of actors)list.push({depth:a.body.y,draw:()=>drawPerson(a.body,a.name)});list.sort((a,b)=>a.depth-b.depth);for(const p of list)p.draw();
 // The front wall is cut away, with the actual doorway left open.
 for(const [x,w]of [[156,176],[440,940]]){rect(g,x,884,w,29,'#ae9c82');rect(g,x,880,w,7,'#e1cfab');rect(g,x,907,w,8,'#695a4d');}
 g.fillStyle='#132a30d9';g.fillRect(21,19,265,36);g.fillStyle='#eadabd';g.font='18px QuietMeadowPixel';g.textAlign='left';g.fillText(D.name,33,44);
 const hero=actors.find(a=>a.name==='teto_2')?.body,near=hero&&nearby(hero);if(near){g.fillStyle='#14262ddd';g.fillRect(431,961,674,40);g.fillStyle='#f0dfba';g.font='18px QuietMeadowPixel';g.textAlign='center';g.fillText(near.type==='exit'?'E — выйти в город':'E — '+near.item.name,768,987);}
 if(debug){g.strokeStyle='#ed5478';g.lineWidth=2;for(const c of D.colliders){g.beginPath();if(c.type==='rect')g.rect(c.x,c.y,c.w,c.h);else g.ellipse(c.x,c.y,c.rx,c.ry,0,0,Math.PI*2);g.stroke();}}
}
function nearby(p){if(Math.hypot(p.x-385,p.y-908)<84)return {type:'exit'};const item=D.items.filter(o=>Math.hypot(p.x-o.approach.x,p.y-o.approach.y)<86).sort((a,b)=>Math.hypot(p.x-a.approach.x,p.y-a.approach.y)-Math.hypot(p.x-b.approach.x,p.y-b.approach.y))[0];return item?{type:item.id==='teto-desk'?'save':'item',item}:null;}
globalThis.HomeArt={init,draw,nearby,furniture,status(){return {id:D.id,rooms:2,bedrooms:['Тето','Мику'],beds:D.items.filter(i=>i.kind.startsWith('bed')).length,furniture:D.items.length,colliders:D.colliders.length};}};
})();
