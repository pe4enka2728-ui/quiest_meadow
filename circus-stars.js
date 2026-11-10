/* Original reference: ParallaxCameraFlowLayer::OnUpdate, camera position × _parallaxEffect.
 * The room camera is fixed here, so actor-relative drift supplies the horizontal camera cue. */
(()=>{
const anchors=[{x:480,y:-1040,r:32,f:.16},{x:1050,y:-1015,r:35,f:.23},{x:610,y:-1170,r:20,f:.10},{x:925,y:-1170,r:22,f:.12}];
function sample(t,hero,cameraY){return anchors.map((a,i)=>({...a,x:a.x-(hero.x-768)*a.f+Math.sin(t*.8+i)*9,y:a.y-95-(hero.y+1080)*a.f*.32+(cameraY+1800)*a.f+Math.sin(t*1.4+i*1.7)*11,angle:Math.sin(t*.7+i)*.18,width:.65+.35*Math.abs(Math.cos(t*.55+i))}))}
function draw(ctx,t,hero,cameraY){ctx.save();ctx.imageSmoothingEnabled=false;for(const p of sample(t,hero,cameraY)){
 if(p.y+p.r<cameraY||p.y-p.r>cameraY+1024)continue;
 ctx.save();ctx.translate(Math.round(p.x/3)*3,Math.round(p.y/3)*3);ctx.rotate(p.angle);ctx.scale(p.width,1);
 const points=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?p.r*.42:p.r;return [Math.round(Math.cos(a)*r/3)*3,Math.round(Math.sin(a)*r/3)*3]});
 ctx.fillStyle='#a97539';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
 for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#ffe7a0':'#e6bd5d';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(points[i][0]*.9,points[i][1]*.9);ctx.lineTo(points[(i+1)%10][0]*.9,points[(i+1)%10][1]*.9);ctx.closePath();ctx.fill()}ctx.fillStyle='#fff2c2';ctx.fillRect(-3,-p.r*.45,6,p.r*.65);ctx.restore();
 }ctx.restore()}
globalThis.CircusStars={anchors,sample,draw};
})();
