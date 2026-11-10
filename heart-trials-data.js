/* Distinct outdoor trials. The canyon spans two viewports; only its seam is a checkpoint. */
(()=>{
'use strict';
const outline=[[650,1024],[650,935],[375,900],[210,780],[150,555],[210,320],[355,175],[595,110],[965,110],[1195,175],[1330,340],[1390,570],[1325,785],[1150,900],[886,935],[886,1024]];
const canyonOutline=[[650,1024],[650,935],[420,920],[228,800],[172,500],[205,180],[175,-140],[210,-460],[170,-790],[350,-955],[650,-1000],[920,-1000],[1215,-925],[1370,-720],[1330,-400],[1380,-85],[1330,230],[1385,580],[1270,850],[1100,925],[886,935],[886,1024]];
const rooms=[
 {id:'trial-red',kind:'red',name:'Ущелье пульса',color:'#eb647b',cameraY:0,minY:-1024,maxY:1024,spawn:{x:768,y:935,dir:0},perimeter:canyonOutline,altar:{x:768,y:-865},start:{x:768,y:865},sign:{x:852,y:891},exit:{x:768,y:1000}},
 {id:'trial-yellow',kind:'yellow',name:'Скалы верной памяти',color:'#f3d479',cameraY:0,minY:0,maxY:1024,spawn:{x:768,y:908,dir:0},perimeter:outline,altar:{x:768,y:220},start:{x:768,y:500},sign:{x:935,y:840},exit:{x:768,y:1000}},
 {id:'trial-blue',kind:'blue',name:'Украденный голос',color:'#8ddfe6',cameraY:0,minY:0,maxY:1024,spawn:{x:768,y:918,dir:0},perimeter:outline,altar:{x:768,y:185},start:{x:768,y:842},sign:{x:974,y:820},exit:{x:768,y:1000}}
];
const stones=[{id:'arch',index:0,x:461,y:385},{id:'crystal',index:1,x:1075,y:385},{id:'key',index:2,x:461,y:690},{id:'wand',index:3,x:1075,y:690}].map(p=>({...p,approach:{x:p.x,y:p.y+78},collider:{id:'memory-rock-'+p.id,type:'ellipse',x:p.x,y:p.y-5,rx:67,ry:31,label:'Скала с символом'}}));
const totems=[{index:0,x:420,y:410},{index:1,x:768,y:345},{index:2,x:1116,y:410}];
const inside=(p,x,y)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
let seed=404019;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(const r of rooms){r.trees=[];r.details=[];r.bushes=[];r.flowers=[];r.background=[];r.patches=[];r.props=[];r.colliders=[];
 if(r.kind==='yellow')r.trees=[[250,390,'pine'],[1270,414,'birch'],[285,800,'oak'],[1250,824,'pine'],[340,230,'oak'],[1170,220,'pine'],[220,655,'birch'],[1320,700,'charred'],[915,395,'oak'],[620,650,'pine']].map(([x,y,kind])=>({x,y,kind}));
 if(r.kind==='blue')r.trees=[[260,390,'birch'],[1270,415,'oak'],[285,835,'pine'],[1250,850,'birch'],[460,190,'pine'],[1120,210,'charred']].map(([x,y,kind])=>({x,y,kind}));
 if(r.kind==='red')for(let i=0;i<17;i++)r.trees.push({x:i%2?1338:180,y:850-i*104,kind:['pine','birch','oak','charred'][i%4]});
 const positions=r.kind==='yellow'?[[598,170],[1010,260],[324,645],[1205,755],[1115,890],[450,840],[580,330]]:r.kind==='blue'?[[320,615],[1200,615],[530,870],[1095,175],[590,215]]:Array.from({length:14},(_,i)=>[i%2?1285:240,720-i*115]);
 for(const [i,[x,y]]of positions.entries())r.bushes.push({id:r.id+'-bush-'+i,x,y,rx:23+i%3*4,ry:17+i%2*4,scale:.72+i%4*.16,tint:i%3});
 for(let i=0;i<170;i++){const x=190+rand()*1150,y=r.minY+110+rand()*(r.maxY-r.minY-230);if(!inside(r.perimeter,x,y))continue;const onPath=r.kind!=='red'&&(Math.abs(x-768)<65||r.kind==='yellow'&&[463,768].some(v=>Math.abs(y-v)<53)&&x>385&&x<1150);if(onPath||r.kind==='blue'&&x>370&&x<1160&&y>520&&y<780)continue;r.patches.push({x,y,rx:15+rand()*33,ry:8+rand()*18,tint:i%4});if(i%3===0)r.flowers.push({x,y,tint:i%4});if(i%7===0&&!stones.some(s=>Math.hypot(x-s.x,y-s.y)<125)&&!r.trees.some(t=>Math.hypot(x-t.x,y-t.y)<60))r.details.push({x,y,w:9+Math.floor(rand()*7)*3,h:6+Math.floor(rand()*4)*3,solid:false});}
 if(r.kind==='yellow'){r.pond={x:300,y:552,rx:66,ry:35};r.props.push({type:'stump',x:1200,y:492},{type:'fallen-branch',x:625,y:293});r.details.push({x:1165,y:290,w:43,h:29,solid:true},{x:362,y:590,w:37,h:24,solid:true});r.colliders.push({id:'memory-pond',type:'ellipse',...r.pond,rx:55,ry:28,label:'Лесная лужа'});}
 for(let y=r.minY+95;y<1000;y+=128)for(let x=10;x<1536;x+=120){const xx=x+(rand()-.5)*60,yy=y+(rand()-.5)*55;if(inside(r.perimeter,xx,yy)||[[-70,-150],[70,-150],[-70,0],[70,0],[0,-80]].some(([dx,dy])=>inside(r.perimeter,xx+dx,yy+dy))||Math.abs(xx-768)<160&&yy>900)continue;r.background.push({x:xx,y:yy,kind:['pine','oak','birch'][Math.floor(rand()*3)],scale:.85+Math.floor(rand()*3)*.12,tint:Math.floor(rand()*3)});}
 r.colliders.push(...r.trees.map((t,i)=>({id:r.id+'-trunk-'+i,type:'rect',x:t.x-12,y:t.y-22,w:24,h:25,label:'Ствол'})),...r.bushes.map(p=>({id:p.id,type:'ellipse',x:p.x,y:p.y,rx:p.rx,ry:p.ry,label:'Куст'})),...r.details.filter(p=>p.solid).map((p,i)=>({id:r.id+'-stone-'+i,type:'ellipse',x:p.x,y:p.y,rx:p.w/2,ry:p.h/2,label:'Камень'})),...r.props.filter(p=>p.type==='stump').map(p=>({id:r.id+'-stump',type:'ellipse',x:p.x,y:p.y,rx:22,ry:13,label:'Пень'})),{id:r.id+'-heart-plinth',type:'ellipse',x:r.altar.x,y:r.altar.y,rx:38,ry:20,label:'Алтарь сердца'},{id:r.id+'-sign',type:'rect',x:r.sign.x-27,y:r.sign.y-7,w:54,h:18,label:'Табличка'});
}
rooms[1].colliders.push(...stones.map(s=>s.collider),{id:'memory-start-stone',type:'ellipse',x:768,y:500,rx:40,ry:25,label:'Обелиск воспоминаний'});
rooms[2].colliders.push(...totems.map(t=>({id:'voice-totem-'+t.index,type:'ellipse',x:t.x,y:t.y,rx:39,ry:25,label:'Тотем голоса'})),{id:'voice-start-stone',type:'ellipse',x:768,y:842,rx:32,ry:20,label:'Обелиск голоса'});
const get=id=>rooms.find(r=>r.id===id||r.kind===id);
function entrySnapshot(snapshot,kind){const d=get(kind),s=JSON.parse(JSON.stringify(snapshot));s.location=d.id;s.teto={...d.spawn};s.miku={...HeartRoadData.crossroads.mikuRest};s.trail=[{x:s.teto.x,y:s.teto.y}];s.activity={type:'heart-trial',id:d.kind,progress:null};return s;}
globalThis.HeartTrialsData={rooms,stones,totems,get,inside,entrySnapshot,blueWalls:()=>[]};
})();
