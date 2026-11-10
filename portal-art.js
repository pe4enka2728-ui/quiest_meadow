/* One portal texture, with a front mask so entering sprites cannot cover its rim. */
(()=>{
'use strict';let image=null;
function init(im){image=im;}
function draw(g,p,t,{front=false}={}){if(!image||p.alpha<=0)return;const size=p.size||286,frame=Math.floor(t*10)%16,w=image.width/4,h=image.height/4;g.save();g.globalAlpha*=p.alpha??1;g.translate(p.x,p.y);g.imageSmoothingEnabled=false;
 if(front){g.beginPath();g.rect(-size/2,-size/2,size,size);g.ellipse(0,0,size*.185,size*.262,0,0,Math.PI*2,true);g.clip('evenodd');}
 g.drawImage(image,frame%4*w,Math.floor(frame/4)*h,w,h,-size/2,-size/2,size,size);g.restore();}
function particles(g,p,t,intensity=1){if(intensity<=0)return;g.save();g.fillStyle='#fff';for(let i=0;i<68;i++){const q=((t*(.28+i%5*.018)+i*.173)%1+1)%1,a=i*2.399+t*.12,r=(1-q)**1.35*(150+i%9*26)+12,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r*.7;g.globalAlpha=intensity*Math.sin(q*Math.PI)*(.25+i%4*.17);const s=i%3===0?3:2;g.fillRect(Math.round(x),Math.round(y),s,s);if(i%5===0)g.fillRect(Math.round(x+Math.cos(a)*7),Math.round(y+Math.sin(a)*5),2,2);}g.restore();}
globalThis.PortalArt={init,draw,particles};
})();
