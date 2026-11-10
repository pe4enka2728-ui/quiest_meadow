/* Pause-aware item flight. Ownership is committed by the encounter after the flight. */
(()=>{
const duration=2.3,ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};let icon=null;
function frame(age,start,target){if(age<.8){const q=ease(age/.8);return {x:start.x+(768-start.x)*q,y:start.y+(405-start.y)*q-Math.sin(q*Math.PI)*45,size:48+48*q,angle:Math.sin(q*Math.PI)*.2};}const q=ease((age-.8)/1.5);return {x:768+(target.x-768)*q,y:405+(target.y-405)*q-Math.sin(q*Math.PI)*110,size:96-68*q,angle:q*Math.PI*2};}
function draw(g,age,start,target){if(!icon)icon=PixelUI.icon('wand');const p=frame(age,start,target);g.save();g.fillStyle='#03071144';g.fillRect(0,0,1536,1024);g.translate(Math.round(p.x/3)*3,Math.round(p.y/3)*3);g.rotate(p.angle);g.imageSmoothingEnabled=false;for(let i=0;i<8;i++){const a=age*2+i*Math.PI/4,r=p.size*.62;g.fillStyle=i%2?'#b5e28b':'#ffe5a1';g.fillRect(Math.round(Math.cos(a)*r/3)*3,Math.round(Math.sin(a)*r/3)*3,3,3);}g.drawImage(icon,-p.size/2,-p.size/2,p.size,p.size);g.restore();if(age<.8){g.save();g.font='24px QuietMeadowPixel';g.fillStyle='#f5edba';g.textAlign='center';g.fillText('Волшебная палочка',768,490);g.restore();}}
globalThis.GumiGift={duration,frame,draw};
})();
