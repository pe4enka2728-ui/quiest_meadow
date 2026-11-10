/* A separate collision layer: coordinates share the viewport, never the meadow. */
(()=>{
'use strict';
const perimeter=Array.from({length:40},(_,i)=>{const a=i/40*Math.PI*2,r=1+.026*Math.sin(a*5)+.015*Math.cos(a*7);return [Math.round(768+Math.cos(a)*498*r),Math.round(655+Math.sin(a)*231*r)];});
const neru={x:790,y:487,dir:2},savePoint={x:1070,y:682,crystalY:606,arrival:{x:1030,y:700,dir:1}};
const cube={x:790,y:476,w:174,h:170,sourceRect:[146,69,962,1135],footprint:[[790,400],[874,438],[790,476],[706,438]]};
const columns=[{x:455,y:580},{x:1105,y:580},{x:415,y:785},{x:1165,y:805}];
globalThis.CloudWorldData={id:'cloud-island',name:'Тихая высь',minY:0,maxY:1024,cameraY:0,perimeter,neru,savePoint,cube,columns,spawn:{x:700,y:740,dir:0},companion:{x:816,y:768,dir:0},portal:{x:768,y:142,size:248},colliders:[{id:'neru-cloud-platform',type:'ellipse',x:790,y:491,rx:59,ry:24,label:'Облачная опора Неру'},{id:'neru-cloud-cube',type:'poly',points:cube.footprint,label:'Куб Неру'},{id:'neru-cloud-npc',type:'ellipse',x:neru.x,y:neru.y,rx:16,ry:12,label:'Неру'},{id:'cloud-memory',type:'ellipse',x:savePoint.x,y:savePoint.y,rx:17,ry:10,label:'Искра памяти'},...columns.map((c,i)=>({id:'cloud-column-'+i,type:'ellipse',...c,rx:27,ry:17,label:'Мраморная колонна'}))]};
})();
