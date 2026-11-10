/* Hinged leaves share their world-space segments with drawing and collision. */
(()=>{
const data={id:'black-iron-gate',x:768,y:-681,left:654,right:882,height:182,thickness:10,unlockDuration:.9,openDuration:1.7,interactionRadius:110};
const staticColliders=[{id:'iron-fence-west',type:'rect',x:0,y:data.y-9,w:634,h:18,label:'Чёрный железный забор'},{id:'iron-fence-east',type:'rect',x:902,y:data.y-9,w:634,h:18,label:'Чёрный железный забор'},{id:'iron-post-west',type:'rect',x:625,y:data.y-13,w:38,h:26,label:'Левый столб ворот'},{id:'iron-post-east',type:'rect',x:873,y:data.y-13,w:38,h:26,label:'Правый столб ворот'}];
function segments(amount){const angle=Math.max(0,Math.min(1,amount))*Math.PI/2,length=(data.right-data.left)/2;return [
 {side:-1,a:{x:data.left,y:data.y},b:{x:data.left+length*Math.cos(angle),y:data.y-length*Math.sin(angle)}},
 {side:1,a:{x:data.right,y:data.y},b:{x:data.right-length*Math.cos(angle),y:data.y-length*Math.sin(angle)}}]}
function colliders(amount){return segments(amount).map((s,i)=>{const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,l=Math.hypot(dx,dy),nx=-dy/l*data.thickness/2,ny=dx/l*data.thickness/2,vertices=[[s.a.x+nx,s.a.y+ny],[s.b.x+nx,s.b.y+ny],[s.b.x-nx,s.b.y-ny],[s.a.x-nx,s.a.y-ny]];return {id:'gate-leaf-'+i,type:'poly',points:vertices,vertices,label:'Створка железных ворот',bounds:{minX:Math.min(...vertices.map(p=>p[0])),maxX:Math.max(...vertices.map(p=>p[0])),minY:Math.min(...vertices.map(p=>p[1])),maxY:Math.max(...vertices.map(p=>p[1]))}}})}
globalThis.GateModel={data,staticColliders,segments,colliders};
})();
