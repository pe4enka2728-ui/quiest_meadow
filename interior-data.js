/* One rounded arena and a straight corridor, with geometry shared by art and collisions. */
(()=>{
const hall={id:'tent-hall',name:'Коридор шатра',cameraY:-2700,perimeter:[[450,-2790],[1086,-2790],[1086,-1780],[450,-1780]],spawn:{x:768,y:-1920},savePoint:{x:948,y:-2175,crystalY:-2310},transition:{duration:1.7,northTriggerY:-2550,southTriggerY:-2740,northArrival:{x:768,y:-2800},southArrival:{x:768,y:-2450}},exitY:-1830};
const center={x:768,y:-3105},rx=620,ry=420,doorAngle=Math.acos(168/rx),arc=Array.from({length:49},(_,i)=>{const a=doorAngle-i*(Math.PI+2*doorAngle)/48;return [center.x+Math.cos(a)*rx,center.y+Math.sin(a)*ry]}),joinY=arc[0][1];
const curtain={shape:'semicircle',cx:768,cy:-3480,rx:258,ry:165,height:93,lip:12,thickness:9,samples:64,roof:{style:'striped-canopy',panels:12},columns:{style:'faceted',width:30}};
const curtainFront=Array.from({length:curtain.samples+1},(_,i)=>{const a=i*Math.PI/curtain.samples;return [curtain.cx-Math.cos(a)*(curtain.rx+curtain.lip),curtain.cy+Math.sin(a)*(curtain.ry+curtain.lip)+curtain.thickness]});
const rearExit={x:768,y:-3360,width:96,height:84,triggerY:-3340,halfWidth:28,arrival:{teto:{x:768,y:-3260,dir:2},miku:{x:824,y:-3306,dir:2}}};
const arena={id:'tent-arena',name:'Арена Гуми',cameraY:-3600,center,rx,ry,perimeter:[...arc,[600,-2580],[936,-2580]],gumi:{x:768,y:-3210,height:96},curtain,rearExit,ring:{cx:768,cy:-3105,rx:348,ry:224},spotlights:[{id:'spotlight-1',x:390,y:-3462,color:[255,224,40],radius:78,shape:'pixel-circle',seed:17,phase:0},{id:'spotlight-2',x:768,y:-3525,color:[255,224,40],radius:78,shape:'pixel-circle',seed:53,phase:2.6},{id:'spotlight-3',x:1146,y:-3462,color:[255,224,40],radius:78,shape:'pixel-circle',seed:89,phase:5.1}],wings:[-1,1].map(side=>({x:curtain.cx+side*curtain.rx-9,y:curtain.cy-3,w:18,h:21}))};
const perimeter=[...arc,[450,joinY],[450,-1780],[1086,-1780],[1086,joinY]];
function band(cx,cy,rx,ry,start,end,width){const edge=(r,n)=>Array.from({length:23},(_,i)=>{const a=start+(end-start)*i/22;return [cx+Math.cos(a)*(rx+r),cy+Math.sin(a)*(ry+r*.65)+n]});return [...edge(width/2,0),...edge(-width/2,0).reverse()]}
const benches=[];for(const side of [-1,1])for(let row=0;row<2;row++){
 const start=side<0?2.10:-1.04,end=side<0?4.18:1.04,bx=480+row*73,by=294+row*49;
 benches.push({id:`circus-bench-${side}-${row}`,side,row,cx:center.x,cy:center.y,rx:bx,ry:by,start,end,width:38,points:band(center.x,center.y,bx,by,start,end,38)});
}
const spectators=[];for(const b of benches)for(let i=0;i<3;i++){const a=b.side<0?2.48+i*.66:-.66+i*.66;spectators.push({index:spectators.length,bench:b.id,x:b.cx+Math.cos(a)*b.rx,y:b.cy+Math.sin(a)*b.ry-7})}
const colliders=[
 {id:'hall-crystal-base',type:'rect',x:hall.savePoint.x-38,y:-2260,w:76,h:50,label:'Постамент памяти в шатре'},
 {id:'closed-back-curtain',type:'poly',points:[[0,-3800],[1536,-3800],[1536,curtain.cy+curtain.thickness],...curtainFront.slice().reverse(),[0,curtain.cy+curtain.thickness]],label:'Полукруглая сцена и закрытый занавес'},
 {id:'stage-back-wall-left',type:'rect',x:0,y:-3800,w:720,h:440,label:'Задняя стенка сцены слева'},
 {id:'stage-back-wall-right',type:'rect',x:816,y:-3800,w:720,h:440,label:'Задняя стенка сцены справа'},
 {id:'stage-door-back',type:'rect',x:720,y:-3800,w:96,h:410,label:'Стена за выходом'},
 {id:'stage-door-post-left',type:'rect',x:720,y:-3381,w:18,h:33,label:'Левый косяк выхода'},
 {id:'stage-door-post-right',type:'rect',x:798,y:-3381,w:18,h:33,label:'Правый косяк выхода'},
 {id:'gumi-feet',type:'ellipse',x:768,y:-3210,rx:18,ry:12,label:'Гуми'},
 ...arena.wings.map((p,i)=>({id:'wing-'+i,type:'rect',...p,label:'Театральная кулиса'})),
 ...benches.map(b=>({id:b.id,type:'poly',points:b.points,label:'Закруглённая скамейка цирка'}))
];
const inscriptions=[
 ['НЕ ЗАБЫВАЙ МОРГАТЬ','«Не забывай моргать. Если глаз над входом закрылся — не пытайся заглянуть под веко».'],
 ['ТОЛЬКО ВМЕСТЕ','«Входите по двое. Если пришли одни, пересчитайте свои тени».'],
 ['СВОБОДНЫЕ МЕСТА','«Первый ряд занят с прошлого представления. Зрителей просят не вставать со скамеек».'],
 ['ЗЕЛЁНЫЙ СВЕТ','«Когда зажжётся зелёный свет, смотрите в центр круга. На занавес смотреть запрещено».'],
 ['ПАМЯТЬ РЯДОМ','«Кристалл помнит дорогу. Не отдавайте ему воспоминания, которые хотите забыть».'],
 ['БЕЗ БИЛЕТА','«Золотой ключ — ваш билет. Сохраните его до конца пути».'],
 ['НЕ АПЛОДИРОВАТЬ','«Не аплодируйте, если картонные зрители начали двигаться раньше вас».'],
 ['ЗАКРЫТЫЙ ЗАНАВЕС','«За занавесом никого нет. Если вам ответят — повторите это ещё раз».'],
 ['ТИШЕ','«Слышите шаги под полом? Это репетиция. Даже если она повторяет ваши шаги».'],
 ['ВЫХОД ЕСТЬ','«Обратная дорога остаётся открытой. Пока вы помните, с кем вошли».']
];
const posters=[];for(const side of [-1,1])for(let i=0;i<5;i++){const n=i+(side<0?0:5),y=-1990-i*139;posters.push({id:'hall-poster-'+n,x:side<0?354:1110,y,side,seed:n+3,w:72,h:90,title:inscriptions[n][0],text:inscriptions[n][1],approach:{x:side<0?483:1053,y:y+65},range:80})}
globalThis.InteriorData={minY:-3600,maxY:-1750,perimeter,hall,arena,benches,spectators,posters,colliders};
})();
