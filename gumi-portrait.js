/* Eight expressions on the same 32-pixel portrait grid used by the companions. */
(()=>{
const frames=[],colors=['#17131d','#342b36','#4c5431','#5c7b32','#83a83d','#acd252','#f3d5b5','#ffe8cc','#d49b81','#e9b292','#bd7829','#edaa39','#ffe19b','#a94220','#ed8121','#ffad3b','#752f40','#b6444c','#f8efd9'].map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
const expressions={neutral:0,worried:1,happy:2,surprised:3,blink:4,talk:5,relieved:6,hypnotized:7};
function init(atlas){frames.length=0;const sw=atlas.width/4,sh=atlas.height/2;
 for(let i=0;i<8;i++){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;g.drawImage(atlas,i%4*sw+4,Math.floor(i/4)*sh+4,sw-8,sh-12,0,0,32,32);const im=g.getImageData(0,0,32,32);for(let k=0;k<im.data.length;k+=4){if(im.data[k+3]<140){im.data[k+3]=0;continue}let best=colors[0],distance=Infinity;for(const color of colors){const d=(im.data[k]-color[0])**2+(im.data[k+1]-color[1])**2+(im.data[k+2]-color[2])**2;if(d<distance){distance=d;best=color;}}im.data[k]=best[0];im.data[k+1]=best[1];im.data[k+2]=best[2];im.data[k+3]=255;}g.putImageData(im,0,0);frames.push(c);}
}
function sample(face,time,speaking=false){let index=expressions[face]??0;if(face!=='hypnotized'&&time%5.2>4.85&&time%5.2<5.02)index=4;else if(index===0&&speaking&&Math.floor(time*6)%2)index=5;return index;}
function draw(g,time=0,face='neutral',speaking=false,size=48){g.imageSmoothingEnabled=false;g.fillStyle='#214b48';g.fillRect(0,0,size,size);const index=sample(face,time,speaking);if(frames[index])g.drawImage(frames[index],0,0,size,size);return {character:'gumi',expression:face,frame:index,pixelGrid:32};}
globalThis.GumiPortrait={init,draw,sample,frames,expressions,paletteSize:colors.length};
})();
