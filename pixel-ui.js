/* 16×16 raster icons. Every edge is drawn as an integer pixel. */
(()=>{
const palette={outline:'#26362d',silver:'#e6ebd7',shade:'#78a7a1',gold:'#e9bd66',brown:'#a46e43',pink:'#ec83a7',pale:'#fff0ce',cyan:'#8de4da'};
function icon(type){const c=document.createElement('canvas');c.width=16;c.height=16;c.className='shop-icon';c.setAttribute('aria-hidden','true');c.dataset.pixelGrid='16';const g=c.getContext('2d');g.imageSmoothingEnabled=false;const r=(x,y,w,h,color)=>{g.fillStyle=palette[color]||color;g.fillRect(x,y,w,h)};
 if(type==='sword'){for(let i=0;i<8;i++)r(10-i,1+i,5,5,'outline');for(let i=0;i<7;i++){r(11-i,2+i,3,3,'silver');r(12-i,3+i,1,2,'shade')}r(2,9,2,2,'gold');r(4,11,2,2,'gold');r(6,13,2,2,'gold');r(1,12,3,3,'brown');r(0,14,2,2,'gold')}
 else if(type==='shield'){const rows=['..xxxxxxxxxxxx..','..xxxxxxxxxxxx..','..xxggggggggxx..','..xxggggggggxx..','..xxggccccggxx..','..xxggccccggxx..','..xxggccccggxx..','..xxggccccggxx..','...xggccccggx...','...xxgccccgxx...','....xxccccxx....','.....xxccxx.....','......xxxx......','.......xx.......'];const colors={x:palette.outline,g:palette.gold,c:palette.cyan};rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(colors[ch])r(x,y,1,1,colors[ch])}))}
 else if(type==='potion'){r(5,0,6,3,'outline');r(6,0,4,2,'brown');r(5,3,6,4,'outline');r(3,6,10,8,'outline');r(4,5,8,10,'outline');r(6,3,4,4,'silver');r(4,7,8,7,'silver');r(5,9,6,4,'pink');r(5,7,2,4,'pale');r(10,9,1,3,'#b6537d')}
 else if(type==='key'){r(1,2,7,7,'outline');r(2,1,5,9,'outline');r(0,3,9,5,'outline');r(2,3,5,5,'gold');r(3,2,3,7,'gold');r(1,4,7,3,'gold');r(3,4,3,3,'outline');r(6,7,9,4,'outline');r(12,9,4,5,'outline');r(9,9,3,4,'outline');r(6,8,9,2,'gold');r(13,9,2,4,'gold');r(10,9,2,3,'gold');r(2,3,4,1,'pale');r(7,8,7,1,'pale');r(14,10,1,3,'brown')}
 else if(type==='wand'){for(let i=0;i<9;i++){r(1+i,13-i,3,3,'outline');r(2+i,14-i,1,1,'gold');}r(10,0,3,9,'outline');r(7,3,9,3,'outline');r(9,1,5,7,'gold');r(8,3,7,3,'gold');r(10,2,3,5,'pale');r(9,3,5,3,'pale');r(11,3,1,3,'#7cbf63');r(1,2,1,3,'cyan');r(0,3,3,1,'cyan');}
 else if(type==='bag'){r(5,0,6,2,'outline');r(4,2,2,3,'outline');r(10,2,2,3,'outline');r(2,4,12,11,'outline');r(3,5,10,9,'brown');r(3,5,10,3,'gold');r(4,9,8,4,'#c79452');r(7,6,2,5,'outline');r(7,7,2,2,'pale');r(1,7,2,5,'gold');r(13,7,2,5,'gold')}
 else{r(6,0,4,16,'outline');r(0,6,16,4,'outline');r(3,3,3,3,'outline');r(10,3,3,3,'outline');r(3,10,3,3,'outline');r(10,10,3,3,'outline');r(7,1,2,14,'cyan');r(1,7,14,2,'cyan');r(5,5,6,6,'cyan');r(7,5,2,6,'pale');r(5,7,6,2,'pale')}
 return c;}
function number(button,key){let badge=button.querySelector('.key-number');if(!badge){badge=document.createElement('span');badge.className='key-number';badge.setAttribute('aria-hidden','true');button.prepend(badge)}badge.textContent=key;button.dataset.shortcut=key;button.setAttribute('aria-keyshortcuts',String(key));return button}
function digit(event){const m=/^(?:Digit|Numpad)([0-9])$/.exec(event.code||'');return m?Number(m[1]):null}
globalThis.PixelUI={icon,number,digit};
})();
