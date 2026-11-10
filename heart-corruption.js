/* Story effects roll back with heart flags. Shadows and the silent forest outlast the cracks. */
(()=>{
'use strict';
let hearts=0,stage=0,clock=0,pulse=0,pulseStage=0,fade=0,images={},buffer=null;
const fadeDuration=3.6,ghosts=[
 {x:608,y:-2915,seed:1.2,dir:1,id:'miku-echo-west'},
 {x:956,y:-3270,seed:2.7,dir:2,id:'miku-echo-north'},
 {x:1080,y:-3070,seed:4.1,dir:3,id:'miku-echo-east'},
 {x:350,y:-3100,seed:5.3,dir:1,id:'miku-echo-far-west'},
 {x:540,y:-3250,seed:6.7,dir:2,id:'miku-echo-northwest'},
 {x:700,y:-3400,seed:7.8,dir:2,id:'miku-echo-upper-west'},
 {x:880,y:-3470,seed:8.4,dir:2,id:'miku-echo-upper-east'},
 {x:815,y:-3180,seed:9.9,dir:3,id:'miku-echo-center'},
 {x:1210,y:-3200,seed:11.1,dir:3,id:'miku-echo-far-east'},
 {x:950,y:-2870,seed:12.3,dir:3,id:'miku-echo-southeast'},
 {x:630,y:-2770,seed:13.7,dir:0,id:'miku-echo-southwest'},
 {x:835,y:-2685,seed:14.2,dir:0,id:'miku-echo-south'}
];
function init(textures){images=textures;for(let i=0;i<12;i++){const im=images['mesme_miku_1_'+i],c=document.createElement('canvas');c.width=im.width;c.height=im.height;const q=c.getContext('2d');q.drawImage(im,0,0);q.globalCompositeOperation='source-in';q.fillStyle='#090b12';q.fillRect(0,0,c.width,c.height);images['miku_shadow_'+i]=c;}reset(0);}
function reset(count=0){hearts=Math.max(0,Math.min(3,count));stage=Math.min(2,hearts);clock=0;pulse=0;pulseStage=0;fade=0;}
function pickup(count){const previous=hearts;hearts=Math.max(hearts,Math.min(3,count));stage=Math.min(2,hearts);if(count===3){if(previous<3)fade=fadeDuration;pulse=0;return;}pulseStage=Math.min(2,count);pulse=pulseStage===1?4.2:6;}
function update(dt,count){if(count>hearts){if(count===3&&hearts===2)fade=fadeDuration;hearts=Math.min(3,count);}stage=Math.min(2,hearts);clock+=dt;pulse=Math.max(0,pulse-dt);fade=Math.max(0,fade-dt);}
function fracture(){return hearts===2?1:hearts>=3?fade/fadeDuration:0;}
function activeGhosts(){return hearts>=2?ghosts:hearts===1?ghosts.slice(0,3):[];}
function ghostItems(hero,location,g,drawPerson){if(hearts<1||location!=='heart-crossroads')return [];return activeGhosts().map(p=>({key:p.id,group:'echoes',depth:p.y,bounds:{top:p.y-105,bottom:p.y+12},draw(){const offset=globalThis.MikuRupture?.laughOffset(p.seed)||{x:0,y:0},body={...p,x:p.x+offset.x,y:p.y+offset.y,moving:false,walk:0,rest:0};ActorMotion.facing(body,hero.x-body.x,hero.y-body.y);p.dir=body.dir;g.save();g.globalAlpha*=.88+.08*Math.sin(clock*1.5+p.seed)**2;drawPerson(body,'miku_shadow');g.restore();}}));}
function draw(g){const strength=fracture();if(!hearts||hearts>=3&&!strength)return;
 if(!buffer){buffer=document.createElement('canvas');buffer.width=1536;buffer.height=1024;}
 const b=buffer.getContext('2d');b.clearRect(0,0,1536,1024);b.drawImage(g.canvas,0,0);
 const burst=hearts>=3?strength*.35:pulse>0?Math.min(1,pulse/1.4):Math.sin(clock*.83)>.985?.35:0;
 if(burst>0){g.save();g.imageSmoothingEnabled=false;for(let i=0;i<(stage===1?7:13);i++){const y=Math.round((i*173+Math.floor(clock*16)*37)%1000/3)*3,h=3+(i%4)*3,dx=Math.round(Math.sin(clock*31+i*2.6)*(stage===1?12:25)*burst/3)*3;g.drawImage(buffer,0,y,1536,h,dx,y,1536,h);g.globalAlpha=.12*burst;g.fillStyle=i%2?'#d64d69':'#78e9e6';g.fillRect((i*139+clock*29)%1300,y,60+i%5*18,h);g.globalAlpha=1;}g.restore();}
 if(!strength)return;
 const parts=[[[0,0],[740,0],[730,230],[795,392],[744,556],[505,590],[312,800],[0,870]],[[740,0],[1536,0],[1536,270],[1320,340],[1050,300],[795,392],[730,230]],[[795,392],[1050,300],[1320,340],[1536,270],[1536,1024],[790,1024],[815,756],[744,556]]];
 for(let i=0;i<parts.length;i++){g.save();g.beginPath();parts[i].forEach(([x,y],j)=>j?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();const motion=(pulse>0?11:4)*strength;g.drawImage(buffer,Math.round(Math.sin(clock*8+i*2)*motion),Math.round(Math.cos(clock*6+i)*motion*.4));g.restore();}
 g.save();g.fillStyle='#080c24';g.globalAlpha=.22*strength;g.fillRect(0,0,1536,1024);
 const lines=[[[740,0],[730,230],[795,392],[744,556],[815,756],[790,1024]],[[795,392],[1050,300],[1320,340],[1536,270]],[[744,556],[505,590],[312,800],[0,870]],[[730,230],[430,195],[215,80]]];
 g.globalAlpha=strength*.62;g.strokeStyle='#cce2ee';g.lineWidth=3;for(const line of lines){g.beginPath();line.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
 g.globalAlpha=.10*strength;g.fillStyle='#2c193d';g.beginPath();parts[2].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.restore();
}
globalThis.HeartCorruption={init,reset,pickup,update,ghostItems,draw,get birdsOff(){return hearts>=1;},status(){return {hearts,stage,clock,pulse,pulseStage,fracture:fracture(),fade,fadeDuration,birdsOff:hearts>=1,ghosts:activeGhosts().map(p=>({x:p.x,y:p.y,id:p.id,dir:p.dir}))};}};
})();
