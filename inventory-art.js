/* Teto uses her existing game sprite; hands are a small animated pixel illustration. */
(()=>{
'use strict';let images={};const icons=new Map();
function icon(type,silhouette=false){const key=type+silhouette;if(icons.has(key))return icons.get(key).cloneNode(true);const c=document.createElement('canvas');c.width=c.height=32;c.setAttribute('aria-hidden','true');const g=c.getContext('2d');
 if(['weapon','armor','amulet'].includes(type))g.drawImage(ShopItemArt.model({weapon:'ribbon',armor:'traveller-coat',amulet:'charm'}[type]),0,0);
 else if(type==='bag')g.drawImage(PixelUI.icon('bag'),0,0,32,32);
 else{g.fillStyle='#d1bfd9';const p=[[10,28],[5,22],[4,16],[7,14],[11,18],[10,8],[12,5],[14,7],[15,17],[16,3],[19,3],[20,17],[22,6],[25,7],[24,20],[27,13],[30,14],[28,24],[23,29]];g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.fillStyle='#e3c37d';g.fillRect(1,3,6,2);g.fillRect(3,1,2,6);}
 if(silhouette){g.globalCompositeOperation='source-in';g.fillStyle='#73647e';g.fillRect(0,0,32,32);}return c;
}
function standing(canvas,t){const g=canvas.getContext('2d'),im=images.teto_2_7;if(!im)return;g.clearRect(0,0,480,560);g.imageSmoothingEnabled=false;
 const halo=g.createRadialGradient(270,300,20,270,300,210);halo.addColorStop(0,'#483254');halo.addColorStop(1,'#291f3500');g.fillStyle=halo;g.fillRect(0,0,480,560);
 g.strokeStyle='#82708e';g.lineWidth=2;g.beginPath();g.ellipse(280,464,115,26,0,0,Math.PI*2);g.stroke();g.fillStyle='#100e1a88';g.beginPath();g.ellipse(280,460,76,13,0,0,Math.PI*2);g.fill();
 const breath=Math.sin(t*2.15),lean=Math.sin(t*.65)*.009;g.save();g.translate(280,457);g.rotate(lean);g.scale(1,1+breath*.012);g.drawImage(ActorSpriteArt.clean(im),-108,-288,216,288);g.restore();
 for(let i=0;i<9;i++){g.globalAlpha=.2+.2*Math.sin(t+i)**2;g.fillStyle=i%2?'#d3bddb':'#e1aebc';g.fillRect(120+(i*47)%320,95+(i*61)%320+Math.sin(t*.5+i)*6,2,2);}g.globalAlpha=1;
}
function hands(element,t){const source=images.inventoryHands;if(!source)return;if(element.dataset.loaded!=='true'){element.src=source.src;element.dataset.loaded='true';}element.style.transform='translateY('+Math.round(Math.sin(t*1.5)*3)+'px)';}
globalThis.InventoryArt={init(value){images=value;},icon,standing,hands};
})();
