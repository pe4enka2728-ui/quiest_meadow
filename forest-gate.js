/* Golden-key unlock, then two hinged iron leaves. All timing is pause-aware. */
(()=>{
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n)};
let opened=false,active=false,age=0,amount=0,api={},key=null,solids=GateModel.colliders(0);
function restore(value){opened=!!value;active=false;age=0;amount=opened?1:0;solids=GateModel.colliders(amount);try{localStorage.setItem('smile-gate-v1',opened?'1':'0')}catch{};api.lock?.(false)}
function init(callbacks){api=callbacks;key=PixelUI.icon('key');let stored=false;try{stored=localStorage.getItem('smile-gate-v1')==='1'}catch{};restore(stored&&api.hasKey())}
function near(p){return Math.abs(p.x-GateModel.data.x)<128&&Math.abs(p.y-GateModel.data.y)<115}
function interact(){if(active||opened)return false;if(!api.hasKey()){api.notify('На замке золотая скважина. Нужен ключ.',3);return true}active=true;age=0;api.lock(true);api.notify('Золотой ключ подходит к замку.',2.4);return true}
function update(dt){if(!active)return;age+=dt;amount=ease((age-GateModel.data.unlockDuration)/GateModel.data.openDuration);solids=GateModel.colliders(amount);if(age>=GateModel.data.unlockDuration+GateModel.data.openDuration){opened=true;active=false;amount=1;solids=GateModel.colliders(1);try{localStorage.setItem('smile-gate-v1','1')}catch{};api.lock(false);api.notify('Ворота открыты. За ними — цирковая поляна.',3)}}
function draw(ctx,t){
 const d=GateModel.data,snap=n=>Math.round(n/3)*3;
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(snap(x),snap(y),Math.max(3,snap(w)),Math.max(3,snap(h)))};
 const poly=(p,c)=>{ctx.fillStyle=c;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(snap(x),snap(y)):ctx.moveTo(snap(x),snap(y)));ctx.closePath();ctx.fill()};
 const line=(p,c,w=3)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(snap(x),snap(y)):ctx.moveTo(snap(x),snap(y)));ctx.stroke()};
 function fence(x1,x2){rect(x1,d.y-114,x2-x1,8,'#111b25');rect(x1,d.y-48,x2-x1,8,'#111b25');rect(x1,d.y-111,x2-x1,3,'#536166');for(let x=x1+10;x<x2;x+=24){rect(x,d.y-139,7,142,'#0a121a');rect(x+3,d.y-136,3,135,'#41505a');poly([[x-4,d.y-137],[x+3,d.y-154],[x+12,d.y-137]],'#101a23');line([[x+3,d.y-149],[x+7,d.y-140]],'#64727a')}}
 ctx.save();ctx.imageSmoothingEnabled=false;fence(0,634);fence(902,1536);
 for(const s of GateModel.segments(amount)){
  const mix=(f,z=0)=>[s.a.x+(s.b.x-s.a.x)*f,s.a.y+(s.b.y-s.a.y)*f-z],barColor='#0c1520';
  const shadow=[mix(0),mix(1),[mix(1)[0]+24,mix(1)[1]+20],[mix(0)[0]+24,mix(0)[1]+20]];poly(shadow,'#07241c55');
  for(const height of [12,58,130]){line([mix(0,height),mix(1,height)],'#070e17',9);line([mix(0,height-3),mix(1,height-3)],'#4a5c67',3)}
  for(let i=0;i<=7;i++){const f=i/7,height=164+24*Math.sin(f*Math.PI/2),a=mix(f),b=mix(f,height);line([a,b],barColor,7);line([[a[0]+2,a[1]],[b[0]+2,b[1]]],'#55616b',3);poly([[b[0]-6,b[1]+3],[b[0],b[1]-12],[b[0]+6,b[1]+3]],'#111b26')}
  line([mix(.12,40),mix(.88,110)],'#384755',5);line([mix(.12,110),mix(.88,40)],'#111b26',5);
  for(const f of [.26,.72]){const [x,y]=mix(f,93);poly([[x,y-12],[x+10,y],[x,y+12],[x-10,y]],'#33424e');rect(x-2,y-4,4,8,'#718188')}
  const [lx,ly]=mix(.98,72);rect(lx-7,ly-12,14,24,'#8f713c');rect(lx-4,ly-9,8,18,'#deb968');rect(lx-1,ly-4,3,9,'#161d26');
 }
 for(const x of [644,892]){rect(x-12,d.y-188,24,191,'#0b131d');rect(x-7,d.y-182,6,179,'#596472');rect(x-19,d.y-8,38,17,'#18252d');rect(x-19,d.y-188,38,12,'#263542');poly([[x-11,d.y-191],[x,d.y-211],[x+11,d.y-191]],'#111b23');rect(x-2,d.y-203,3,9,'#8b9895')}
 if(active&&age<d.unlockDuration){
  const p=api.hero(),q=ease(age/.55),x=p.x+(d.x-p.x)*q,y=p.y-64+(d.y-72-p.y+64)*q-Math.sin(q*Math.PI)*18;
  ctx.save();ctx.translate(snap(x),snap(y));ctx.rotate(ease((age-.55)/.35)*Math.PI*.75);ctx.drawImage(key,-24,-24,48,48);ctx.restore();
  if(age>.55){ctx.globalAlpha=Math.sin((age-.55)/.35*Math.PI)*.7;poly([[d.x,d.y-110],[d.x+26,d.y-72],[d.x,d.y-38],[d.x-26,d.y-72]],'#ffe4a4');ctx.globalAlpha=1}
 }
 ctx.restore();
}
globalThis.ForestGate={init,restore,interact,update,draw,near,colliders:()=>solids,get isOpen(){return opened},get isActive(){return active},status(){return {opened,active,age,amount,phase:active?(age<.9?'unlock':'opening'):opened?'open':'locked'}}};
})();
