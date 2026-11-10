/* First encounter: a linear conversation and larger, Haku-style character busts. */
(()=>{
const lines=[
 {speaker:'teto',text:'Мику... Это точно цветок? У него лицо. И ноги.'},
 {speaker:'miku',text:'Я тоже такого не видела. Даже лепестки похожи на волосы.'},
 {speaker:'teto',text:'Может, это кто-то в костюме? Почему он тогда растёт прямо между камнями?'},
 {speaker:'miku',text:'Посмотри на стебли. Он качается, но ветра совсем нет.'},
 {speaker:'teto',text:'И всё время улыбается... Мне от этой улыбки не по себе.'},
 {speaker:'miku',text:'Не подходи ближе. Кажется, он повторяет один и тот же ритм.'},
 {speaker:'teto',text:'Цветок?.. Ты нас слышишь?'},
 {speaker:'miku',text:'Тето, он нас заметил. Будь готова!'}
];
const rocks=[{x:408,y:381,w:33,h:21},{x:477,y:372,w:30,h:18},{x:549,y:387,w:36,h:24},{x:987,y:387,w:36,h:24},{x:1059,y:381,w:30,h:18},{x:1128,y:387,w:33,h:21},{x:345,y:468,w:36,h:21},{x:1191,y:468,w:36,h:21},{x:282,y:543,w:33,h:21},{x:1254,y:543,w:33,h:21},{x:228,y:612,w:33,h:21},{x:1308,y:612,w:33,h:21},{x:224,y:738,w:36,h:18},{x:1312,y:738,w:36,h:18}];
const portraits={teto:[],miku:[]},names={teto:'ТЕТО',miku:'МИКУ'},size={w:176,h:160},typeSpeed=36,fadeIn=.3,fadeOut=.38;
const facing={teto:'right',miku:'left'};
// Generation leaves uneven gutters; use measured rectangles rather than cutting hair at grid edges.
const sourceRects={teto:[[135,0,347,512],[586,0,426,512],[1045,0,347,512]],miku:[[60,512,488,512],[558,512,457,512],[1023,512,461,512]]};
const costumes={teto:'white/pale-blue striped shirt, black tie, red suspenders/trousers, yellow gloves, red hat with yellow smiley',miku:'blue pinstriped dress, white apron, white collar with pink trim, white gloves, striped visor and candy bow'};
const anchors={teto:[],miku:[]};
function init(atlas){
 for(const character of ['teto','miku']){const cells=[];let rowBottom=0,rowTop=Infinity;for(const rect of sourceRects[character]){const c=document.createElement('canvas');c.width=rect[2];c.height=rect[3];const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(atlas,...rect,0,0,c.width,c.height);const im=g.getImageData(0,0,c.width,c.height);let minY=c.height,maxY=0,minX=c.width,maxX=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;im.data[i+3]=im.data[i+3]<160?0:255;if(im.data[i+3]){minY=Math.min(minY,y);maxY=Math.max(maxY,y+1);minX=Math.min(minX,x);maxX=Math.max(maxX,x+1)}}
   // A shared face anchor keeps the neutral, speaking and blink heads at the same X.
   const skin=[];for(let y=Math.round(minY+(maxY-minY)*.25);y<Math.round(minY+(maxY-minY)*.57);y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,r=im.data[i],green=im.data[i+1],b=im.data[i+2];if(im.data[i+3]&&r>175&&green>110&&r>green+8&&green>b)skin.push(x)}skin.sort((a,b)=>a-b);const anchor=skin.length?skin[Math.floor(skin.length/2)]:(minX+maxX)/2;
   g.putImageData(im,0,0);rowBottom=Math.max(rowBottom,maxY);rowTop=Math.min(rowTop,minY);cells.push({c,anchor});anchors[character].push(anchor);
  }
  const ratio=140/(rowBottom-rowTop);for(const {c:cell,anchor}of cells){const c=document.createElement('canvas');c.width=size.w;c.height=size.h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(cell,0,0,cell.width,cell.height,Math.round(size.w/2-anchor*ratio),Math.round(156-rowBottom*ratio),Math.round(cell.width*ratio),Math.round(cell.height*ratio));portraits[character].push(c)}
 }
}

function draw(canvas,character,time,active,typing){const g=canvas.getContext('2d'),seed=character==='teto'?.6:1.7,p=(time+seed)%4.8,blink=!(active&&typing)&&p>4.35&&p<4.53,frame=blink?2:active&&typing?1:0,offset=Math.round(Math.sin(time*1.45+seed)*.65);g.imageSmoothingEnabled=false;g.clearRect(0,0,size.w,size.h);g.drawImage(portraits[character][frame],0,offset)}
function drawFace(canvas,character,time,reacting=false){const g=canvas.getContext('2d'),seed=character==='teto'?.6:1.7,p=(time+seed)%4.8,blink=p>4.35&&p<4.53,frame=blink?2:reacting?1:0;g.imageSmoothingEnabled=false;g.fillStyle='#214b48';g.fillRect(0,0,48,48);g.drawImage(portraits[character][frame],40,10,96,96,0,0,48,48)}
globalThis.BattleStory={lines,rocks,names,size,typeSpeed,fadeIn,fadeOut,init,draw,drawFace,portraits,facing,sourceRects,costumes,anchors};
})();
