/* Pixel-painted cloud terrain, layered sky and clouds moving around the island. */
(()=>{
'use strict';let images={},terrain=null,sky=null,nightSky=null,columnArt=null;const TAU=Math.PI*2;
function puff(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(Math.round(x),Math.round(y),rx,ry,0,0,TAU);g.fill();}
function makeTerrain(){const c=document.createElement('canvas');c.width=512;c.height=341;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const lobes=Array.from({length:25},(_,i)=>{const a=i/25*TAU;return {x:256+Math.cos(a)*178,y:218+Math.sin(a)*78,r:29+(i*17%24),a};});
 // A deep suspended underside, with separate scalloped shadow bands.
 for(const l of lobes)puff(g,l.x,l.y+23,l.r*.96,l.r*.67,'#8c97bc');puff(g,258,252,177,61,'#9eacca');
 for(const l of lobes)puff(g,l.x-1,l.y+15,l.r,l.r*.68,'#bdcce0');puff(g,256,235,186,80,'#c9d9e9');
 for(const l of lobes)puff(g,l.x,l.y,l.r,l.r*.73,'#e6edf6');puff(g,256,211,182,77,'#f5f8fb');
 for(const [x,y,rx,ry]of [[138,158,49,35],[210,141,56,29],[286,146,62,36],[357,171,58,37],[398,213,41,31],[112,217,45,33],[167,258,56,32],[251,274,66,26],[346,261,59,29]]){
  puff(g,x+3,y+7,rx,ry,'#d9e5f0');puff(g,x,y-1,rx*.98,ry*.92,'#eef4f8');puff(g,x-7,y-6,rx*.73,ry*.63,'#fffdf7');
 }
 // Broad, quiet surface across the playable area; wisps stay below the actors.
 puff(g,255,210,147,62,'#f5f8fb');puff(g,230,193,108,46,'#fafbf7');
 g.strokeStyle='#dce7ef';g.lineWidth=1;for(let i=0;i<18;i++){const x=120+i*17%286,y=169+i*23%100;g.beginPath();g.ellipse(x,y,8+i%4*3,2+i%3,0,.1,2.7);g.stroke();}
 for(let i=0;i<90;i++){const x=111+i*79%295,y=149+i*43%126;g.fillStyle=i%3?'#ffffffa0':'#d5e1ec60';g.fillRect(x,y,i%4?1:2,1);}
 return c;
}
function makeSky(colors){const c=document.createElement('canvas');c.width=512;c.height=342;const g=c.getContext('2d'),rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const at=t=>{let i=0;while(i+1<colors.length-1&&colors[i+1][0]<t)i++;const [a,ca]=colors[i],[b,cb]=colors[i+1],u=(t-a)/(b-a),ra=rgb(ca),rb=rgb(cb);return '#'+ra.map((v,k)=>Math.round((v+(rb[k]-v)*u)/3)*3).map(v=>v.toString(16).padStart(2,'0')).join('');};for(let band=0;band<24;band++){const y=Math.floor(band*342/24),next=Math.floor((band+1)*342/24);g.fillStyle=at(band/24);g.fillRect(0,y,512,next-y);if(band){g.fillStyle=at((band-1)/24);for(let yy=0;yy<3;yy++)for(let x=0;x<512;x+=4)if((x/4+yy)%3>yy)g.fillRect(x,y+yy,2,1);}}return c;}

function makeColumn(){const c=document.createElement('canvas');c.width=32;c.height=83;const g=c.getContext('2d');g.fillStyle='#a6b2c6';g.fillRect(4,78,26,4);g.fillStyle='#d2dae5';g.fillRect(2,74,28,5);g.fillStyle='#ffffff';g.fillRect(2,74,23,2);g.fillStyle='#b7c3d4';g.fillRect(7,13,19,61);g.fillStyle='#f0f3f6';g.fillRect(7,13,15,60);g.fillStyle='#fffefa';g.fillRect(8,14,3,58);for(let x=12;x<24;x+=4){g.fillStyle='#b4c0d0';g.fillRect(x,17,1,53);g.fillStyle='#fff';g.fillRect(x+1,17,1,52);}g.fillStyle='#d3dce7';g.fillRect(5,69,23,5);g.fillStyle='#fafbfa';g.fillRect(4,68,24,2);g.fillStyle='#c0ccdb';g.fillRect(4,10,24,5);g.fillStyle='#fbfcfc';g.fillRect(2,7,28,5);g.fillStyle='#fffefa';g.fillRect(1,4,29,3);g.fillStyle='#d5dfeb';g.fillRect(2,2,28,3);g.fillStyle='#fff';g.fillRect(3,1,25,2);g.fillStyle='#9faec4';g.fillRect(27,8,2,4);return c;}
function init(textures){images=textures;terrain=makeTerrain();columnArt=makeColumn();sky=makeSky([[0,'#6488bb'],[.45,'#a2c2dd'],[1,'#eff0ec']]);nightSky=makeSky([[0,'#090d24'],[.5,'#232347'],[1,'#626385']]);}
const cloudSprites=new Map();
function smallCloud(g,x,y,size,alpha=1,shade=false){const key=shade?'shade':'light';if(!cloudSprites.has(key)){const c=document.createElement('canvas');c.width=72;c.height=37;const q=c.getContext('2d');q.translate(36,18);puff(q,0,4,22,8,shade?'#b3c6df':'#dce7f2');puff(q,-12,0,11,7,'#e7eff7');puff(q,3,-3,15,10,'#f5f7f9');puff(q,17,1,11,6,'#edf3f8');puff(q,0,1,23,5,'#f6f9fb');cloudSprites.set(key,c);}g.save();g.globalAlpha*=alpha;g.imageSmoothingEnabled=false;g.drawImage(cloudSprites.get(key),Math.round(x/3)*3-108*size,Math.round(y/3)*3-54*size,216*size,111*size);g.restore();}

function backgroundRaw(g,t,offset=0,night=0){g.imageSmoothingEnabled=false;g.drawImage(sky,0,0,1536,1024);g.save();g.globalAlpha=night;g.drawImage(nightSky,0,0,1536,1024);g.globalAlpha=.12*(1-night);g.fillStyle='#fdf1da';g.beginPath();g.arc(240,154+offset*.04,185,0,TAU);g.fill();g.globalAlpha=.07*(1-night);for(let i=0;i<4;i++){g.beginPath();g.moveTo(50+i*55,0);g.lineTo(300+i*170,1024);g.lineTo(530+i*100,1024);g.lineTo(130+i*44,0);g.fill();}g.globalAlpha=night*.8;g.fillStyle='#dce4fc';for(let i=0;i<82;i++){const x=45+i*173%1440,y=55+i*107%570;g.globalAlpha=night*(.32+.4*Math.sin(t*.6+i)**2);g.fillRect(x,y,i%9?2:4,i%9?2:4);}g.globalAlpha=night*.8;g.beginPath();g.arc(1260,173,37,0,TAU);g.fill();g.globalAlpha=(1-night)*.5;g.fillStyle='#fff4cf';g.beginPath();g.arc(247,154,43,0,TAU);g.fill();g.restore();
 for(let i=0;i<14;i++){const x=((i*211+t*(3+i%3))%1880)-170,y=65+i*73%660+offset*.12;smallCloud(g,x,y,.7+i%3*.4,.16+i%3*.08);}
 for(let i=0;i<8;i++)smallCloud(g,((i*271-t*6)%1950+1950)%1950-160,920+Math.sin(t*.13+i)*20+offset*.06,2.8+i%2*.7,.44);
}
let skyFrame=null;
function background(g,t,offset=0,night=0){if(!skyFrame){skyFrame=document.createElement('canvas');skyFrame.width=512;skyFrame.height=342;}const q=skyFrame.getContext('2d');q.setTransform(1/3,0,0,1/3,0,0);backgroundRaw(q,t,offset,night);g.imageSmoothingEnabled=false;g.drawImage(skyFrame,0,0,1536,1026);}

function column(g,p,scale=2.5){g.save();g.fillStyle='#7286a329';g.beginPath();g.ellipse(p.x+7,p.y+2,38*scale/2.5,11,0,0,TAU);g.fill();g.imageSmoothingEnabled=false;g.drawImage(columnArt,Math.round(p.x-16*scale),Math.round(p.y-81*scale),32*scale,83*scale);g.restore();}
function drawNeru(g,t,state){const n=CloudWorldData.neru,blend=state.modelBlend||0;g.save();g.globalAlpha=.18;g.fillStyle='#7288a3';g.beginPath();g.ellipse(n.x,n.y+2,44,9,0,0,TAU);g.fill();g.restore();if(blend<1){g.save();g.globalAlpha=1-blend;g.drawImage(ActorSpriteArt.clean(images.neruWorld),Math.round(n.x-36),Math.round(n.y-96+Math.sin(t*1.9)*1.2),72,96);g.restore();}if(blend>0){g.save();g.globalAlpha=blend;PreparedNeruArt.draw(g,state.age||0,n.x,n.y,178,'477');g.restore();}}
function draw(g,t,party,drawPerson,{offsetY=0,showParty=true,scene=false,extraActors=[],paintActor=null,beforeActors=null}={}){const state=globalThis.NeruEncounter?.status()||{};background(g,t,offsetY,state.night||0);g.save();g.translate(0,Math.round(offsetY));
 const moving=Array.from({length:11},(_,i)=>{const a=i*.57+t*(.025+i%3*.003);return {x:768+Math.cos(a)*(675+i%3*48),y:618+Math.sin(a)*385,size:.75+i%4*.33,front:Math.sin(a)>.7};});
 for(const c of moving.filter(c=>!c.front))smallCloud(g,c.x,c.y,c.size,.8,true);
 g.drawImage(terrain,0,0,1536,1023);
 // The memory point is an airy crystal: a landmark without a physical arch or gate.
 const s=CloudWorldData.savePoint,cy=s.crystalY+Math.sin(t*1.8)*5;g.save();g.globalAlpha=.16;g.fillStyle='#c8a9d4';g.beginPath();g.ellipse(s.x,s.y,29,10,0,0,TAU);g.fill();g.restore();g.fillStyle='#b5cde2';g.beginPath();g.moveTo(s.x,cy-25);g.lineTo(s.x+16,cy);g.lineTo(s.x,cy+27);g.lineTo(s.x-15,cy);g.closePath();g.fill();g.fillStyle='#f5ffff';g.beginPath();g.moveTo(s.x,cy-25);g.lineTo(s.x+2,cy);g.lineTo(s.x-15,cy);g.closePath();g.fill();g.strokeStyle='#fefbe5';g.lineWidth=2;g.stroke();
 for(let i=0;i<5;i++){const a=t*.6+i*TAU/5,x=s.x+Math.cos(a)*31,y=cy+Math.sin(a)*22;g.fillStyle='#fffbe8';g.fillRect(Math.round(x),Math.round(y),3,3);}
 const actors=showParty?party.slice():[];actors.push({body:CloudWorldData.cube,name:'neru-cube'});actors.push({body:{...CloudWorldData.neru},name:'neru'});for(const c of CloudWorldData.columns)actors.push({body:c,name:'column'});actors.sort((a,b)=>a.body.y-b.body.y);
 beforeActors?.();for(const a of actors){if(a.name==='neru-cube'){const c=a.body;g.save();g.globalAlpha=1-(state.modelBlend||0);g.imageSmoothingEnabled=false;g.drawImage(images.neruCubeWorld,...c.sourceRect,c.x-c.w/2,c.y-c.h,c.w,c.h);g.restore();}else if(a.name==='neru')drawNeru(g,t,state);else if(a.name==='column')column(g,a.body);else drawPerson(a.body,a.name);}
 // Airborne actors are a foreground cinematic layer; their flight Y is not ground depth.
 for(const body of extraActors)paintActor?.(g,body);
 for(const c of moving.filter(c=>c.front))smallCloud(g,c.x,c.y,c.size,.94);
 for(let i=0;i<18;i++){const x=245+i*137%1060,y=330+i*89%570-Math.sin(t*.4+i)*9;g.globalAlpha=.12+.18*Math.sin(t+i)**2;g.fillStyle='#fff';g.fillRect(x,y,2,2);}g.globalAlpha=1;g.restore();
 if(!scene){g.save();g.font='27px QuietMeadowPixel';g.fillStyle='#f5f6f2';g.shadowColor='#42678d';g.shadowBlur=3;g.fillText('Тихая высь',34,52);g.restore();}
}
globalThis.CloudWorldArt={init,draw,background,column,smallCloud,makeTerrain};
})();
