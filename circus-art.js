/* A grounded round big top: the wall hem and collider share the same elliptical footprint. */
(()=>{
let ground,tent,eyeCanvas;const trees=[];
const polygon=(g,p,c)=>{g.fillStyle=c;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()};
function init(images){
 const c=document.createElement('canvas');c.width=768;c.height=560;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.scale(.5,.5);
 for(let y=0;y<1120;y+=96)for(let x=0;x<1536;x+=96)g.drawImage(images.ground,960,0,96,96,x,y,96,96);g.fillStyle='#25483f20';g.fillRect(0,0,1536,1120);ground=c;
 SceneArt.registerBushes(CircusData.bushes);for(const p of CircusData.trees)trees.push({...p,image:BackdropArt.getSprite(p.kind,1,0)});
 tent=document.createElement('canvas');tent.width=312;tent.height=226;const q=tent.getContext('2d'),rect=(x,y,w,h,c)=>{q.fillStyle=c;q.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))},poly=(p,c)=>polygon(q,p.map(([x,y])=>[Math.round(x),Math.round(y)]),c),rim=(a,cy=167,rx=124,ry=45)=>[156+Math.cos(a)*rx,cy+Math.sin(a)*ry];
 // The dark contact rim is only a few pixels deep and touches the canvas hem.
 q.fillStyle='#18342b';q.beginPath();q.ellipse(156,168,126,46,0,0,Math.PI*2);q.fill();
 for(let i=0;i<24;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;poly([rim(a,120),rim(b,120),rim(b),rim(a)],i%2?'#d9bd88':'#923b59')}
 for(let i=0;i<12;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;poly([rim(a,120),rim(b,120),rim(b),rim(a)],i%2?'#f0d4a0':'#b54460');const p=rim(b);rect(p[0]-1,p[1]-44,2,43,i%2?'#bd9b70':'#77364c')}
 // A broad circular roof with a slightly offset peak; its lower rim follows the walls.
 const apex=[148,10];for(let i=12;i<36;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;poly([apex,rim(a,120,130,47),rim(b,120,130,47)],i%2?(i<24?'#c6ab81':'#f0d6a3'):(i<24?'#86364f':'#b94461'))}
 for(let i=0;i<12;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12,p=rim(a,120,130,47),p2=rim(b,120,130,47);poly([p,p2,[p2[0]-2,p2[1]+8],[(p[0]+p2[0])/2,(p[1]+p2[1])/2+11],[p[0]+2,p[1]+8]],i%2?'#d0b483':'#78344d')}
 // Ground hem, seam stitches, restrained fabric patches and the wooden threshold.
 for(let i=0;i<24;i++){const a=i*Math.PI/24,b=(i+1)*Math.PI/24;poly([rim(a),rim(b),rim(b,170),rim(a,170)],'#613c3b')}
 for(const [x,y]of [[77,168],[226,172]]){rect(x,y,10,8,'#86526a');for(let j=0;j<4;j++)rect(x+j*3,y+1,1,1,'#cba38b')}
 poly([[140,210],[140,185],[145,177],[164,177],[172,186],[172,210]],'#101d25');poly([[140,184],[150,179],[146,197],[149,210],[140,210]],'#7e2f4d');poly([[172,186],[163,180],[166,198],[163,210],[172,210]],'#943552');rect(141,188,2,21,'#cf6b7e');rect(168,189,2,20,'#c45d75');
 poly([[138,211],[174,211],[179,215],[133,215]],'#b89565');rect(134,215,44,3,'#64513c');
 // Pegged guy ropes attach to the earth on either side; no detached drop shadow.
 for(const side of [-1,1]){const x=side<0?43:269,tx=side<0?20:292;poly([[x,153],[tx,205],[tx+1,205],[x+1,153]],'#b9a575');rect(tx,201,2,9,'#4a4934');rect(tx-2,201,5,2,'#d2b47c')}
 rect(147,1,2,18,'#796248');rect(147,1,1,18,'#e5ce9b');
 eyeCanvas=document.createElement('canvas');eyeCanvas.width=30;eyeCanvas.height=30;
}
function gaze(hero){const e=CircusData.tent.eye,dx=hero.x-e.x,dy=hero.y-60-e.y,d=Math.hypot(dx,dy)||1;return {x:dx/d*14,y:dy/d*9}}
function eyeState(t,hero){const p=((t%7.7)+7.7)%7.7,smooth=n=>n*n*(3-2*n);let openness=1;if(p>=7.3&&p<7.45)openness=1-smooth((p-7.3)/.15);else if(p>=7.45&&p<7.52)openness=0;else if(p>=7.52)openness=smooth((p-7.52)/.18);return {openness:Math.max(0,Math.min(1,openness)),...gaze(hero)}}
function drawEye(ctx,t,hero){const g=eyeCanvas.getContext('2d'),s=eyeState(t,hero),e=CircusData.tent.eye;g.clearRect(0,0,30,30);g.imageSmoothingEnabled=false;
 g.fillStyle='#3e2b38';g.beginPath();g.ellipse(15,15,14,14,0,0,Math.PI*2);g.fill();g.fillStyle='#d2ad6d';g.beginPath();g.ellipse(15,15,12,12,0,0,Math.PI*2);g.fill();g.fillStyle='#81505b';g.beginPath();g.ellipse(15,15,10,10,0,0,Math.PI*2);g.fill();
 // All white and iris pixels are clipped by the moving eyelids; closed means no visible pupil.
 if(s.openness>.025){g.save();g.beginPath();g.ellipse(15,15,9,8*s.openness,0,0,Math.PI*2);g.clip();g.fillStyle='#f7e6bb';g.fillRect(4,4,22,22);const x=Math.round(15+s.x/3),y=Math.round(15+s.y/3);g.fillStyle='#7aa899';g.fillRect(x-4,y-6,8,12);g.fillStyle='#142a2c';g.fillRect(x-2,y-5,4,10);g.fillStyle='#fff2cf';g.fillRect(x-2,y-4,2,2);g.restore()}else{g.fillStyle='#412e3b';g.fillRect(7,15,16,1)}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(eyeCanvas,e.x-45,e.y-45,90,90);
}
function drawTent(ctx,t,hero={x:768,y:-960}){const p=CircusData.tent,view=TentPortals.appearance(hero);ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=view.alpha;ctx.drawImage(tent,p.x-p.originX,p.y-p.originY,p.width,p.height);ctx.globalAlpha=1;if(globalThis.GumiEncounter?.defeated&&view.rearDoor)StageExitArt.draw(ctx,p.rearDoor,true);drawEye(ctx,t,hero);const x=p.x-27,y=p.y-p.originY+3,wave=Math.round(Math.sin(t*2)*2)*3;ctx.fillStyle='#d6b376';polygon(ctx,[[x,y],[x+57,y+9+wave],[x,y+24]],'#b24460');ctx.restore()}
function base(ctx){ctx.save();ctx.beginPath();CircusData.perimeter.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.clip();ctx.imageSmoothingEnabled=false;ctx.drawImage(ground,0,CircusData.offsetY,1536,1120);const b=CircusData.tent.ground;ctx.fillStyle='#9d936854';ctx.beginPath();ctx.ellipse(b.x,b.y,b.rx+14,b.ry+9,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function items(actors,t,ctx){const list=CircusData.bushes.map(b=>({depth:b.y+b.ry,draw:()=>SceneArt.drawBush(b)}));for(const p of trees)list.push({depth:p.y,draw:()=>{const behind=actors.some(a=>a.body.y<p.y&&a.body.y>p.y-160&&Math.abs(a.body.x-p.x)<65);BackdropArt.drawSprite(ctx,p.image,p.x,p.y,behind?.7:1)}});const p=CircusData.tent;list.push({depth:p.depth,bounds:{top:p.y-p.originY-15,bottom:p.y-p.originY+p.height+15},draw:()=>drawTent(ctx,t,actors[0]?.body)});
 for(const p of CircusData.props)list.push({depth:p.y+p.h,draw:()=>{ctx.fillStyle='#543f31';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#c28e59';ctx.fillRect(p.x+3,p.y+3,p.w-6,p.h-6);ctx.fillStyle='#805538';ctx.fillRect(p.x+6,p.y+8,p.w-12,4);ctx.fillRect(p.x+6,p.y+p.h-11,p.w-12,4);ctx.fillStyle='#e2b679';ctx.fillRect(p.x+6,p.y+3,4,p.h-6);ctx.fillRect(p.x+p.w-10,p.y+3,4,p.h-6)}});return list;
}
globalThis.CircusArt={init,base,items,drawTent,gaze,eyeState};
})();
