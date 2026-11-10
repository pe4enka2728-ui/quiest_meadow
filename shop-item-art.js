/* Individually shaded 32px inventory/counter art, drawn on an integer pixel grid. */
(()=>{
'use strict';const cache=new Map();
function model(id){if(cache.has(id))return cache.get(id);const item=ShopModel.find(id),c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const r=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);},p=(pts,color)=>{g.fillStyle=color;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const ink='#101f27',gold='#e6bc72',pale='#fff0c8',teal='#8bd4c5',red='#db5679';
 if(item?.kind==='weapon'){
  const tint=id==='rift-blade'?'#aa96cf':id==='crimson-sabre'?'#ec8095':'#d0e7df';
  p([[22,1],[29,1],[28,8],[12,24],[7,18]],ink);p([[23,3],[27,3],[25,9],[11,22],[9,18]],tint);p([[24,3],[26,3],[10,20],[10,17]],pale);
  p([[4,15],[7,14],[17,24],[15,27]],ink);p([[5,16],[7,16],[15,24],[14,25]],gold);p([[7,22],[10,25],[5,30],[2,27]],ink);p([[7,24],[8,25],[5,28],[4,27]],'#88586a');r(1,28,4,3,gold);r(12,24,3,5,red);r(15,27,4,3,red);
 }else if(item?.kind==='armor'){
  const shade=id==='echo-cuirass'?'#6e8a91':id==='chorus-vest'?'#995d77':'#d6c7a4';
  p([[9,4],[12,3],[20,3],[23,4],[30,12],[26,17],[23,15],[24,29],[8,29],[9,15],[6,17],[2,12]],ink);
  p([[10,5],[13,5],[16,9],[19,5],[22,5],[27,12],[25,14],[21,11],[22,27],[10,27],[11,11],[7,14],[5,12]],shade);
  r(15,10,2,17,'#4b4254');r(11,23,11,3,'#5e3f4c');r(14,23,5,3,gold);r(11,7,2,13,'#f4dfb0');r(18,7,3,3,red);
  if(id==='echo-cuirass'){r(11,12,10,3,'#a4bdba');r(11,17,10,3,'#809e9f');}
 }else if(item?.kind==='amulet'){
  p([[9,2],[23,2],[27,7],[24,14],[18,19],[14,19],[7,12],[5,7]],gold);p([[10,4],[22,4],[24,7],[21,13],[16,16],[10,11],[8,7]],'#102626');
  const tint=id==='moon-shard'?'#afa9ef':id==='tuning-fork'?gold:teal;
  p([[16,13],[25,21],[17,31],[7,22]],ink);p([[16,16],[22,21],[17,28],[10,22]],tint);p([[16,17],[16,23],[11,22]],pale);p([[16,23],[21,21],[17,27]],'#497c83');
  if(id==='tuning-fork'){r(13,16,2,7,pale);r(18,16,2,7,pale);r(14,21,5,2,pale);r(16,21,2,6,pale);}
 }else if(item?.kind==='ability'){
  const tint=item.heal?'#efb5bd':item.resistance?'#a4c9da':item.speed?teal:item.nextCrit?gold:item.poison?'#a6c477':['glass-high','gumi-wand'].includes(id)?'#bbace4':id==='step'?teal:red;
  p([[6,2],[25,2],[29,7],[29,26],[25,30],[6,30],[2,26],[2,7]],ink);p([[7,4],[24,4],[27,8],[27,25],[24,28],[7,28],[4,25],[4,8]],'#294347');r(7,5,17,1,'#5b7a73');r(5,7,1,17,'#5b7a73');
  g.strokeStyle=tint;g.lineWidth=2;
  if(item.heal){p([[7,12],[7,9],[12,7],[16,10],[20,7],[25,9],[25,15],[16,25]],tint);r(15,12,3,9,pale);r(12,15,9,3,pale);if(item.heal===50){r(6,23,3,3,gold);r(23,6,3,3,gold);}}
  else if(item.resistance){p([[7,8],[16,5],[25,8],[24,18],[20,24],[16,27],[12,24],[8,18]],tint);p([[10,10],[16,8],[22,10],[21,18],[16,23],[11,18]],'#3d5c70');r(15,10,2,12,pale);r(11,13,10,2,pale);if(item.resistance>.2){r(5,5,3,2,gold);r(24,5,3,2,gold);}}
  else if(item.nextCrit){p([[16,5],[19,12],[26,16],[19,19],[16,27],[13,19],[5,16],[13,12]],gold);r(15,12,3,8,pale);r(12,15,9,3,pale);}
  else if(item.speed){for(let k=0;k<2;k++){const x=7+k*10;p([[x,8],[x+8,16],[x,24],[x,19],[x+3,16],[x,13]],k?teal:pale);}r(5,26,18,1,tint);}
  else if(id==='pulse'||id==='dawn-chorus'){for(let k=0;k<3;k++){g.beginPath();g.arc(14,16,4+k*4,-1.1,1.1);g.stroke();}r(8,12,3,8,pale);}
  else if(item.poison){p([[16,7],[23,18],[21,24],[16,27],[10,23],[9,18]],tint);r(14,13,3,8,pale);r(18,20,3,3,'#57744f');if(id==='thorn-note'){r(7,9,2,7,tint);r(5,11,6,2,tint);}}
  else if(id==='glass-high'){p([[16,6],[23,15],[17,26],[9,17]],tint);p([[16,8],[16,22],[11,17]],pale);}
  else if(id==='step'){p([[10,9],[15,7],[17,13],[14,18],[10,17]],teal);p([[19,15],[23,15],[24,22],[20,26],[17,23]],pale);}
  else if(id==='reverse-beat'){g.beginPath();g.arc(16,16,8,.3,5.4);g.stroke();p([[20,6],[20,13],[26,10]],pale);r(10,15,7,2,tint);}
  else if(id==='gumi-wand'){for(let k=0;k<9;k++)r(8+k,23-k,2,2,gold);r(18,5,3,13,gold);r(13,10,13,3,gold);r(16,8,7,7,pale);r(18,10,3,3,'#7bb972');}
  else{for(let k=0;k<12;k++)r(9+k,22-k,3,3,tint);if(id==='double-syllable')for(let k=0;k<9;k++)r(15+k,25-k,2,2,pale);else{r(7,8,3,8,pale);r(5,10,7,3,pale);}}
 }else if(item?.kind==='key'){g.drawImage(PixelUI.icon('key'),0,0,32,32);}
 else{
  const mint=id==='mint',liquid=mint?'#81d9d0':'#b76c8b';r(12,2,9,5,ink);r(13,2,7,4,'#a97b4b');r(14,3,4,1,pale);r(12,7,9,6,ink);p([[10,11],[23,11],[27,18],[25,29],[7,29],[5,18]],ink);p([[11,12],[22,12],[25,19],[23,27],[9,27],[7,19]],'#a8c9bd');p([[9,18],[24,18],[22,26],[10,26]],liquid);r(10,13,3,10,'#edf2d5');r(14,22,8,3,mint?'#4c9c9b':'#8a496b');r(14,7,5,5,'#c7d3b9');
 }
 cache.set(id,c);return c;
}
globalThis.ShopItemArt={model};
})();
