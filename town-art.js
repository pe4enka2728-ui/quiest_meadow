/* Game-scale world layers: live vendors, fountain, crystals, water, moored boat and birds. */
(()=>{
'use strict';
const D=TownData,TAU=Math.PI*2,S=D.scale,snap=n=>Math.round(n/2)*2;
let textures,background,boat,boatRect,renderPieces=[],props=[],treeProps=[],bushProps=[],birdPerches=[];
function polygon(g,ps,fill,stroke=null,width=2){g.beginPath();ps.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function oval(x,y,rx,ry,n=24){return Array.from({length:n},(_,i)=>[snap(x+Math.cos(i/n*TAU)*rx),snap(y+Math.sin(i/n*TAU)*ry)]);}
function cut(spec){const [x,y,w,h]=spec.box,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;g.drawImage(textures.townGround,x,y,w,h,0,0,w,h);
 const im=g.getImageData(0,0,w,h),data=im.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let first=0,last=0;
 // Flood from outside the outlined sprite: a warm wooden highlight is not sand inside an outline.
 const outside=i=>{const k=i*4,r=data[k],v=data[k+1],b=data[k+2];return data[k+3]<20||v>75&&v>r*1.15&&v>b*1.1||r>170&&v>135&&b<r*.83||spec.mask!=='building'&&b>r*1.3&&v>r*1.35;};
 const seed=i=>{if(!seen[i]&&outside(i)){seen[i]=1;queue[last++]=i;}};
 for(let xx=0;xx<w;xx++){seed(xx);seed((h-1)*w+xx);}for(let yy=1;yy<h-1;yy++){seed(yy*w);seed(yy*w+w-1);}
 while(first<last){const i=queue[first++],xx=i%w;if(xx>0)seed(i-1);if(xx<w-1)seed(i+1);if(i>=w)seed(i-w);if(i<w*(h-1))seed(i+w);}
 for(let i=0;i<seen.length;i++)if(seen[i])data[i*4+3]=0;
 if(spec.mask==='building'){
  // Keep the connected house, without isolated blades of grass or flowers.
  seen.fill(0);let biggest=[];for(let start=0;start<seen.length;start++){if(seen[start]||data[start*4+3]<20)continue;first=0;last=0;queue[last++]=start;seen[start]=1;while(first<last){const i=queue[first++],xx=i%w;for(const n of [xx>0?i-1:-1,xx<w-1?i+1:-1,i>=w?i-w:-1,i<w*(h-1)?i+w:-1])if(n>=0&&!seen[n]&&data[n*4+3]>=20){seen[n]=1;queue[last++]=n;}}if(last>biggest.length)biggest=Array.from(queue.subarray(0,last));}
  seen.fill(0);for(const i of biggest)seen[i]=1;for(let i=0;i<seen.length;i++)if(!seen[i])data[i*4+3]=0;
 }else if(spec.mask==='rail'||spec.mask==='bench'){
  // Terrace paving behind a fence stays transparent, including the gaps below its beam.
  seen.fill(0);for(let i=0;i<seen.length;i++){const k=i*4;if(data[k+3]&&data[k]>data[k+2]*1.3&&data[k]>data[k+1]*1.03&&data[k]>45)seen[i]=1;}
  const wood=seen.slice();for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const i=yy*w+xx,k=i*4;if(!data[k+3]||wood[i])continue;if(data[k]+data[k+1]+data[k+2]<280)for(let dy=-2;dy<=2&&!seen[i];dy++)for(let dx=-2;dx<=2;dx++){const nx=xx+dx,ny=yy+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h&&wood[ny*w+nx]){seen[i]=1;break;}}}for(let i=0;i<seen.length;i++)if(!seen[i])data[i*4+3]=0;
 }
 // A long fence crop can include a different bench or crate. Keep only the fence's own vertical band.
 if(spec.mask==='rail'&&spec.groundLine)for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const foot=depthAt(spec,x+xx)/S;if(y+yy<foot-50||y+yy>foot+5)data[(yy*w+xx)*4+3]=0;}
 g.putImageData(im,0,0);
 if(spec.visualPolygon){const m=document.createElement('canvas');m.width=w;m.height=h;polygon(m.getContext('2d'),spec.visualPolygon.map(([px,py])=>[px-x,py-y]),'#fff');g.globalCompositeOperation='destination-in';g.drawImage(m,0,0);g.globalCompositeOperation='source-over';}
 if(spec.mask==='post'){g.clearRect(0,0,2,h);g.clearRect(w-2,0,2,h);g.clearRect(0,h-6,w,6);}
 return {...spec,image:c};}

// Depth follows the foot line, including diagonal fences. Tall stair walls are split along their length.
function depthAt(p,x,y=null){if(p.mask==='long-wall'&&y!==null)return Math.min(p.depth,(y+33)*S);const line=p.groundLine;if(!line?.length)return p.depth;
 let best=line[0][1],delta=Infinity;for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],lo=Math.min(a[0],b[0]),hi=Math.max(a[0],b[0]);const xx=Math.max(lo,Math.min(hi,x)),d=Math.abs(x-xx);if(d<delta){delta=d;const u=Math.abs(b[0]-a[0])<.01?.5:(xx-a[0])/(b[0]-a[0]);best=a[1]+(b[1]-a[1])*u;}}return best*S;}
function splitDepth(p){const [x,y,w,h]=p.box,result=[],step=p.groundLine?6:w,row=p.mask==='long-wall'?12:h;
 for(let yy=0;yy<h;yy+=row)for(let xx=0;xx<w;xx+=step){const ww=Math.min(step,w-xx),hh=Math.min(row,h-yy);result.push({id:p.id,image:p.image,crop:[xx,yy,ww,hh],box:[x+xx,y+yy,ww,hh],depth:depthAt(p,x+xx+ww/2,y+yy+hh/2)});}return result;}

function init(images){textures={...images,townGround:TownTerrain.build(images)};background=document.createElement('canvas');background.width=D.width;background.height=D.height;const g=background.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(textures.townGround,0,0,D.width,D.height);props=D.foreground.map(cut);const northWallImage=TownTerrain.wall(images.townNorthWall);for(const wall of D.northWalls)props.push({...wall,image:northWallImage,depth:(wall.box[1]+wall.box[3])*S,mask:'long-wall'});renderPieces=props.flatMap(splitDepth);
 // Use the generated transparent hull; strip low-alpha matte pixels and find its actual bounds.
 const c=document.createElement('canvas');c.width=images.townBoat.width;c.height=images.townBoat.height;const q=c.getContext('2d',{willReadFrequently:true});q.drawImage(images.townBoat,0,0);const im=q.getImageData(0,0,c.width,c.height);let minX=c.width,minY=c.height,maxX=0,maxY=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(im.data[i+3]<230)im.data[i+3]=0;else{im.data[i+3]=255;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}q.putImageData(im,0,0);boat=c;boatRect=[minX,minY,maxX-minX+1,maxY-minY+1];
 TownEffects.init(textures.townGround);treeProps=D.trees.map(p=>({...p,image:BackdropArt.getSprite(p.kind,p.size,0)}));bushProps=D.shrubs.map(p=>({...p,image:BackdropArt.getSprite('bush',p.size,0)}));
 const treeImages=treeProps.map(p=>({id:p.id,image:p.image,x:p.x,y:p.y,scale:p.scale})),extras=D.buildings.map(b=>({rect:{x:b.box[0]*S,y:b.box[1]*S,w:b.box[2]*S,h:b.box[3]*S}}));
 birdPerches=WorldBirds.localPerches(treeImages,extras,D.stalls.map(s=>({x:s.x,y:s.y-249})),D.width);
}
function boatPose(t){const b=D.boat;return {x:b.x+Math.sin(t*.53)*.8,y:b.y+Math.sin(t*1.37)*1.3,angle:Math.sin(t*.81)*.007};}
function boatCollider(t){const p=boatPose(t);return {id:'town-moving-boat',type:'ellipse',x:p.x,y:p.y-26,rx:84,ry:24,label:'Лодка'};}
function drawBoat(g,t){const p=boatPose(t),b=D.boat;
 // The hull meets the sea at its bottom. Short contact waves attach to it, not to a ground shadow.
 g.strokeStyle='#715639';g.lineWidth=3;g.beginPath();g.moveTo(b.mooring.x,b.mooring.y);g.quadraticCurveTo((b.mooring.x+p.x-85)/2,p.y+3,p.x-82,p.y-13);g.stroke();
 g.save();g.translate(snap(p.x),p.y+3);g.rotate(p.angle);g.imageSmoothingEnabled=false;g.drawImage(boat,...boatRect,-b.width/2,-b.height,b.width,b.height);g.restore();
 for(let i=0;i<4;i++){const phase=(t*.45+i/4)%1;g.globalAlpha=Math.sin(phase*Math.PI)*.65;g.strokeStyle=i%2?'#b3f4e7':'#56ccca';g.lineWidth=2;g.beginPath();g.ellipse(p.x-5,p.y+2,49+phase*46,3+phase*8,0,.08,Math.PI*.96);g.stroke();}g.globalAlpha=1;
}
function fountainRaw(g,t){const f=D.fountain,x=f.x,y=f.y;polygon(g,oval(x,y+11,122,63), '#3f5752','#182f32',4);polygon(g,oval(x,y,119,62),'#a9bcb2','#4f6a61',3);polygon(g,oval(x,y-12,100,48),'#328fa9','#c6d4bd',8);polygon(g,oval(x,y-12,91,41),'#36b9cf');
 for(let i=0;i<6;i++){const phase=(t*.7+i/6)%1;g.save();g.globalAlpha=(1-phase)*.65;polygon(g,oval(x+Math.sin(i*4)*24,y-11+Math.cos(i)*7,12+phase*76,4+phase*24),null,i%2?'#9af5f1':'#d1ffff',2);g.restore();}
 // A single stone pedestal supports a small bowl, with continuous falling curtains.
 polygon(g,[[x-19,y-20],[x-19,y-118],[x+19,y-118],[x+19,y-20]],'#b0c7bf','#5e7d76',3);g.fillStyle='#d5e3d4';g.fillRect(x-13,y-112,8,84);polygon(g,oval(x,y-116,45,18),'#accac1','#526f68',4);polygon(g,oval(x,y-120,36,12),'#61deed');
 for(let i=0;i<7;i++){const startX=x+(i-3)*11,startY=y-119,endX=x+(i-3)*24,endY=y-15;g.strokeStyle=i%2?'#a9ffff':'#35c9e9';g.lineWidth=i%2?3:4;g.beginPath();g.moveTo(startX,startY);g.quadraticCurveTo(startX+(i-3)*9,startY+46,endX,endY);g.stroke();for(let k=0;k<3;k++){const u=(t*(.9+i*.04)+k/3+i*.13)%1,xx=startX+(endX-startX)*u,yy=startY+(endY-startY)*u;g.fillStyle='#e8ffff';g.fillRect(snap(xx),snap(yy),3,7);}}
 // Three vertical streams and ballistic droplets share a continuous phase.
 for(let j=-1;j<=1;j++){g.strokeStyle=j?'#5addeb':'#e3ffff';g.lineWidth=j?4:5;g.beginPath();g.moveTo(x+j*9,y-125);g.quadraticCurveTo(x+j*18+Math.sin(t*2)*2,y-215+Math.abs(j)*24,x+j*24,y-123);g.stroke();}
 for(let i=0;i<26;i++){const u=(t*.85+i*.137)%1,a=i*2.4,xx=x+Math.cos(a)*(10+u*50),yy=y-128-60*Math.sin(u*Math.PI)+u*18;g.fillStyle=i%2?'#d4ffff':'#83effa';g.fillRect(snap(xx),snap(yy),3,4);}
 polygon(g,Array.from({length:17},(_,i)=>{const a=i/16*Math.PI;return [snap(x+Math.cos(a)*119),snap(y+Math.sin(a)*62)];}).concat(Array.from({length:17},(_,i)=>{const a=Math.PI-i/16*Math.PI;return [snap(x+Math.cos(a)*103),snap(y-1+Math.sin(a)*49)];})),'#bbccbf','#526a61',2);
}
let fountainBuffer=null,fountainTime=-1;
function fountain(g,t){const f=D.fountain,step=3,left=f.x-132,top=f.y-234,w=264,h=318;if(!fountainBuffer){fountainBuffer=document.createElement('canvas');fountainBuffer.width=w/step;fountainBuffer.height=h/step;}const frame=Math.floor(t*30)/30;if(fountainTime!==frame){fountainTime=frame;const q=fountainBuffer.getContext('2d');q.setTransform(1,0,0,1,0,0);q.clearRect(0,0,q.canvas.width,q.canvas.height);q.scale(1/step,1/step);q.translate(-left,-top);fountainRaw(q,frame);}g.imageSmoothingEnabled=false;g.drawImage(fountainBuffer,left,top,w,h);}
function portalGround(g,t){const p=D.portal;g.save();const pulse=.5+.5*Math.sin(t*2.1);g.globalAlpha=.55+.2*pulse;polygon(g,oval(p.x,p.y,126,76),null,'#44d5ee',4);polygon(g,oval(p.x,p.y,105,59),null,'#a8fbff',2);const ps=Array.from({length:4},(_,i)=>{const a=i*Math.PI/2+t*.13;return [p.x+Math.cos(a)*70,p.y+Math.sin(a)*39];});polygon(g,ps,null,'#84eef6',3);for(let i=0;i<12;i++){const a=i*TAU/12,q=[p.x+Math.cos(a)*116,p.y+Math.sin(a)*68];g.save();g.translate(...q);g.rotate(a);g.fillStyle='#adffff';g.fillRect(-3,-6,6,12);g.fillRect(-7,-2,14,3);g.restore();}g.restore();}
function crystal(g,c,t){const a=t*.85+c.seed*.8,y=c.y-47+Math.sin(t*1.8+c.seed)*5,ring=Array.from({length:4},(_,i)=>{const angle=a+i*Math.PI/2;return {x:Math.cos(angle)*13,y:Math.sin(angle)*4,z:Math.sin(angle)*13};}),top={x:0,y:-31,z:0},bottom={x:0,y:31,z:0},faces=[];for(let i=0;i<4;i++)for(const end of [top,bottom])faces.push({ps:[end,ring[i],ring[(i+1)%4]],z:(ring[i].z+ring[(i+1)%4].z)/3});g.fillStyle='#5d898a';g.fillRect(c.x-13,c.y+6,26,12);g.fillStyle='#aec6b6';g.fillRect(c.x-10,c.y+4,20,5);g.save();g.shadowColor='#71faff';g.shadowBlur=9;for(const f of faces.sort((a,b)=>a.z-b.z)){g.fillStyle=f.z>0?'#b4ffff':f.z>-5?'#62dfe9':'#2ea6c0';polygon(g,f.ps.map(p=>[c.x+p.x,y+p.y]),g.fillStyle,'#d4ffff',1.5);}g.restore();for(let i=0;i<2;i++){const f=(t*.55+c.seed*.137+i*.5)%1;g.globalAlpha=Math.sin(f*Math.PI)*.7;g.fillStyle='#d5ffff';g.fillRect(c.x+Math.sin(f*8+c.seed)*24,y+17-f*54,3,3);g.globalAlpha=1;}}
function drawLayer(g,key,s){const l=SceneArt.layers[key];g.save();g.translate(s.x-340*s.scale,s.y-467*s.scale);g.scale(s.scale,s.scale);g.drawImage(l.canvas,...l.rect.slice(0,2));g.restore();}
function stall(g,s,t,drawPerson){drawLayer(g,'shop',s);if(s.vendor)drawPerson(D.vendor,'haku');drawLayer(g,'counter',s);
 if(s.category!=='consumables'){g.save();g.translate(s.x-340*s.scale,s.y-467*s.scale);g.scale(s.scale,s.scale);g.fillStyle='#795339';g.fillRect(266,394,148,40);g.fillStyle='#a57549';g.fillRect(266,430,148,4);const ids=s.category==='equipment'?['ribbon','traveller-coat','charm']:['pulse','thorn-note','glass-high'];ids.forEach((id,i)=>g.drawImage(ShopItemArt.model(id),274+i*44,398,31,31));g.restore();}
 if(s.vendor){g.fillStyle='#e1b477';g.fillRect(s.x-34,s.y-176,68,22);g.fillStyle='#493225';g.font='17px QuietMeadowPixel';g.textAlign='center';g.fillText('Хару',s.x,s.y-159);}}

function lamp(g,p,t){g.fillStyle='#26392f';g.fillRect(p.x-10,p.y-3,20,7);g.fillRect(p.x-5,p.y-89,10,90);g.fillStyle='#8e7952';g.fillRect(p.x-2,p.y-85,3,83);polygon(g,[[p.x-18,p.y-114],[p.x-10,p.y-124],[p.x+10,p.y-124],[p.x+18,p.y-114]],'#304338','#162e29',2);g.fillStyle='#28392f';g.fillRect(p.x-15,p.y-114,30,33);g.fillStyle='#cfab58';g.fillRect(p.x-11,p.y-110,22,24);g.fillStyle='#ffe7a0';g.fillRect(p.x-7,p.y-107,14,18);g.fillStyle='#5b613a';g.fillRect(p.x-1,p.y-111,3,25);g.fillRect(p.x-12,p.y-87,24,3);g.fillStyle='#8b8253';g.fillRect(p.x-4,p.y-127,8,4);g.save();g.globalAlpha=.08+.04*Math.sin(t*2+p.x);polygon(g,oval(p.x,p.y-96,35,29),'#ffe6a1');g.restore();}
function visibleProp(p,view){const [x,y,w,h]=p.box;return x*S<view.x+(view.width||1536)&&x*S+w*S>view.x&&y*S<view.y+(view.height||1024)&&y*S+h*S>view.y;}
function draw(g,t,view,actors,drawPerson,debug=false){g.clearRect(0,0,1536,1024);g.save();g.translate(-Math.round(view.x),-Math.round(view.y));g.imageSmoothingEnabled=false;g.drawImage(background,0,0);TownEffects.water(g,t);drawBoat(g,t);portalGround(g,t);
 const list=renderPieces.filter(p=>visibleProp(p,view)).map(p=>({id:p.id,depth:p.depth,draw:()=>g.drawImage(p.image,...p.crop,p.box[0]*S,p.box[1]*S,p.box[2]*S,p.box[3]*S)}));
 for(const p of treeProps){const w=p.image.width*p.scale,h=p.image.height*p.scale;if(p.x+w/2<view.x||p.x-w/2>view.x+(view.width||1536)||p.y<view.y||p.y-h>view.y+(view.height||1024))continue;list.push({id:p.id,depth:p.y,draw(){const behind=actors.some(a=>a.body.y<p.y-7&&a.body.y>p.y-h&&Math.abs(a.body.x-p.x)<w*.44);g.save();g.globalAlpha=behind?.68:1;g.drawImage(p.image,Math.round(p.x-w/2),Math.round(p.y-h),w,h);g.restore();}});}
 for(const p of bushProps)list.push({id:p.id,depth:p.y,draw:()=>g.drawImage(p.image,p.x-p.image.width*2,p.y-p.image.height*4,p.image.width*4,p.image.height*4)});
 for(const p of D.stones)list.push({id:p.id,depth:p.y,draw:()=>RockArt.draw(g,p)});
 for(const a of actors)list.push({id:a.name,depth:a.body.y,draw:()=>drawPerson(a.body,a.name)});
 for(const npc of TownPeople.actors)list.push({id:'resident-'+npc.id,depth:npc.y,draw:()=>TownPeopleArt.draw(g,npc,t)});
 for(const s of D.stalls)list.push({id:s.id,depth:s.y,draw:()=>stall(g,s,t,drawPerson)});list.push({id:'fountain',depth:D.fountain.y+76,draw:()=>fountain(g,t)});for(const c of D.crystals)list.push({id:c.id,depth:c.y+15,draw:()=>crystal(g,c,t)});for(const [i,p]of D.lamps.entries())list.push({id:'town-lamp-'+i,depth:p.y,draw:()=>lamp(g,p,t)});list.push({id:'banners',depth:592,draw:()=>TownEffects.banners(g,t)});

 list.sort((a,b)=>a.depth-b.depth);for(const item of list)item.draw();TownEffects.windows(g,t);TownEffects.steam(g,t);TownEffects.insects(g,t);if(globalThis.GuildBoardUI?.markerVisible)GuildBoardArt.marker(g,t,D.guildBoard);WorldBirds.drawLocal(g,t,view.y,birdPerches,view.x);
 if(debug){g.strokeStyle='#ff4567';g.fillStyle='#ff456722';g.lineWidth=2;for(const o of D.colliders){const ps=o.vertices||[];if(ps.length){polygon(g,ps,'#ff456722','#ff4567',2);}}for(const a of actors){g.beginPath();g.arc(a.body.x,a.body.y,SpawnWorld.RADIUS,0,TAU);g.stroke();}}
 g.restore();if(view.overview)return;g.font='18px QuietMeadowPixel';g.textAlign='left';g.fillStyle='#113a31bb';g.fillRect(20,18,230,36);g.fillStyle='#fff0c4';g.fillText(D.name,31,43);
 const hero=actors.find(a=>a.name==='teto_2')?.body,near=hero&&nearby(hero);if(near){g.textAlign='center';g.fillStyle='#113a31db';g.fillRect(455,960,626,42);g.fillStyle='#fff0c4';g.fillText(near.type==='vendor'?'E — поговорить с Хару':near.type==='portal'?'E — портал на Тихую поляну':near.type==='home'?'E — дом Тето и Мику':near.type==='resident'?'E — поговорить':'E — доска гильдии',768,987);}
}
function nearby(p){if(globalThis.HomeData&&Math.hypot(p.x-HomeData.door.approach.x,p.y-HomeData.door.approach.y)<HomeData.door.range)return {type:'home'};const resident=globalThis.TownPeople?.nearby(p);if(resident)return {type:'resident',target:resident};const stall=D.stalls.find(s=>s.vendor);if(Math.abs(p.x-D.vendor.x)<76&&p.y>stall.y+14&&p.y<stall.y+142&&ActorMotion.facesTarget(p,D.vendor,218))return {type:'vendor',target:D.vendor};if(Math.hypot(p.x-D.portal.x,p.y-D.portal.y)<D.portal.range)return {type:'portal',target:D.portal};if(Math.hypot(p.x-D.guildBoard.approach.x,p.y-D.guildBoard.approach.y)<D.guildBoard.range||Math.hypot(p.x-D.waypoints.guild.x,p.y-D.waypoints.guild.y)<118)return {type:'guild'};return null;}
function status(t,view){return {clock:t,width:D.width,height:D.height,scale:S,stalls:D.stalls.map(s=>({id:s.id,category:s.category,haru:!!s.vendor})),vendor:{...D.vendor},boat:boatPose(t),fountainPhase:(t*.85)%1,portalPhase:t*.85,birds:birdPerches.map(p=>WorldBirds.state(p,t)).filter(b=>b.phase!=='away'&&b.x>=view.x-40&&b.x<=view.x+1576&&b.y>=view.y-30&&b.y<=view.y+1060).map(b=>({id:b.id,x:b.x,y:b.y,phase:b.phase,host:b.host})),birdPerches:birdPerches.length,foreground:props.length+treeProps.length+bushProps.length,treeCount:treeProps.length,people:TownPeople.status(),effects:TownEffects.status(t)};}
globalThis.TownArt={init,draw,nearby,boatPose,boatCollider,status,depthAt,splitDepth,get renderPieces(){return renderPieces;},get boatBounds(){return boatRect;},get terrain(){return textures.townGround;},get perches(){return birdPerches;},get props(){return [...props,...treeProps.map(p=>({...p,box:[(p.x-p.image.width*p.scale/2)/S,(p.y-p.image.height*p.scale)/S,p.image.width*p.scale/S,p.image.height*p.scale/S]}))];}};
})();
