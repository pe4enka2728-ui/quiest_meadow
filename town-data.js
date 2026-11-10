/* City objects have a ground footprint and a separate upright visual silhouette. */
(()=>{
'use strict';const S=2,point=(x,y)=>({x:x*S,y:y*S}),points=ps=>ps.map(([x,y])=>[x*S,y*S]),colliders=[],foreground=[],trees=[],shrubs=[],stones=[];
function rect(id,x,y,w,h,label=id){const c={id:'town-'+id,type:'rect',x:x*S,y:y*S,w:w*S,h:h*S,label};colliders.push(c);return c;}
function ellipse(id,x,y,rx,ry,label=id){const c={id:'town-'+id,type:'ellipse',...point(x,y),rx:rx*S,ry:ry*S,label};colliders.push(c);return c;}
function poly(id,ps,label=id){const c={id:'town-'+id,type:'poly',points:points(ps),label};colliders.push(c);return c;}
function sprite(id,box,depth,mask=null,groundLine=null){foreground.push({id,box,depth:depth*S,mask,groundLine});}
const buildings=[
 {id:'guild',box:[266,140,339,207],foot:[284,279,308,58],depth:337,door:point(423,361),name:'Гильдия авантюристов'},
 {id:'north-house-1',box:[917,181,159,165],foot:[930,294,136,45],depth:339,door:point(1014,363),name:'Дом Тето и Мику'},
 {id:'north-house-2',box:[1044,174,156,173],foot:[1067,292,128,50],depth:342,door:point(1155,366),name:'Жилой дом'},
 {id:'north-house-3',box:[1180,199,168,147],foot:[1201,298,133,44],depth:342,door:point(1288,368),name:'Жилой дом'},
 {id:'west-house-1',box:[144,618,158,157],foot:[160,638,135,131],depth:769,door:point(227,796),name:'Жилой дом'},
 {id:'west-house-2',box:[283,630,156,147],foot:[296,646,137,125],depth:771,door:point(353,798),name:'Жилой дом'},
 {id:'boathouse',box:[1018,649,155,130],foot:[1037,728,126,45],footPoly:[[1037,723],[1127,723],[1154,735],[1154,752],[1127,773],[1037,773]],depth:773,door:point(1100,801),name:'Лодочный сарай'}
];
for(const b of buildings){if(b.footPoly)poly(b.id,b.footPoly,b.name);else rect(b.id,...b.foot,b.name);sprite(b.id,b.box,b.depth,'building',[[b.box[0],b.depth-19],[b.foot[0],b.depth],[b.foot[0]+b.foot[2]-8,b.depth],[b.box[0]+b.box[2],b.depth-18]]);}
const props=[
 ['guild-board',526,283,65,55,331,'Доска заказов'],['guild-barrel',242,307,40,31,334,'Бочка'],['north-crate',897,291,36,43,336,'Ящик'],['north-barrel-east',1312,305,35,35,342,'Бочка'],['west-barrel',130,716,37,44,759,'Бочка'],['west-crate',415,733,36,37,770,'Ящик'],['boathouse-rear-barrel',994,710,35,47,757,'Бочка'],['boathouse-crate',986,732,38,32,764,'Ящик'],['boathouse-barrel',1127,721,39,48,769,'Бочка'],['dock-crate-rear',784,902,31,31,933,'Ящик'],['dock-crate-front',800,914,31,31,945,'Ящик']
];
for(const [id,x,y,w,h,depth,name]of props){rect(id,x+2,y+h*.60,w-4,h*.35,name);sprite(id,[x-2,y-10,w+4,h+10],depth,null,[[x-2,depth-7],[x+5,depth],[x+w-7,depth],[x+w+2,depth-6]]);}
// Retaining walls use thin ground contours; stairs and lawn behind the walls stay open.
poly('guild-back-wall',[[598,276],[716,272],[719,293],[689,296],[672,316],[646,337],[611,349],[596,337]],'Каменная стенка за гильдией');
poly('terrace-guild',[[203,382],[268,384],[487,383],[539,373],[552,378],[550,394],[528,406],[492,414],[314,415],[292,407],[263,414],[238,424],[204,436],[181,450],[173,441],[188,420],[202,407]],'Стенка террасы');
poly('terrace-market',[[343,666],[516,668],[617,665],[666,654],[724,650],[724,721],[676,730],[617,737],[511,737],[342,703]],'Стенка террасы');
poly('terrace-east',[[858,655],[905,650],[956,648],[997,658],[997,699],[955,726],[911,733],[858,728]],'Стенка террасы');
poly('terrace-west-edge',[[169,476],[185,478],[170,510],[149,554],[139,582],[145,607],[165,619],[158,640],[130,622],[120,600],[124,576],[138,537],[155,494]],'Каменная стенка');
poly('portal-garden-rim',[[991,417],[1019,401],[1037,394],[1045,410],[1005,426],[987,447],[979,481],[991,507],[982,534],[965,522],[955,494],[957,467],[967,441],[977,428]],'Каменный край сада');
poly('portal-flower-bed',[[980,512],[1032,494],[1095,478],[1115,493],[1166,493],[1166,463],[1175,455],[1179,505],[1136,532],[1115,546],[1001,545],[980,535]],'Каменная клумба');
poly('portal-cliff-west',[[1087,557],[1164,540],[1177,568],[1140,592],[1080,610]],'Край террасы портала');
poly('portal-cliff-east',[[1351,612],[1412,600],[1416,642],[1350,671]],'Край террасы портала');

poly('guild-west-rear',[[202,262],[257,253],[267,266],[256,281],[202,284]],'Стенка за гильдией');
poly('guild-west-side',[[201,276],[218,278],[218,338],[205,351],[193,347]],'Боковая стенка террасы');
poly('north-rear-west',[[850,263],[904,271],[928,278],[935,296],[921,334],[905,334],[897,310],[888,300],[850,291]],'Край верхней террасы');
poly('north-rear-east',[[1334,265],[1386,274],[1402,292],[1404,342],[1383,350],[1384,297],[1334,288]],'Край верхней террасы');
poly('north-front-east',[[1344,344],[1384,339],[1400,341],[1399,362],[1376,378],[1348,387],[1324,387],[1324,374],[1344,371]],'Край верхней террасы');
poly('market-west-shoulder',[[294,638],[368,638],[414,646],[444,648],[493,666],[513,667],[513,697],[493,694],[444,674],[410,666],[368,661],[294,658]],'Склон под рынком');
poly('market-east-shoulder',[[994,628],[1030,617],[1067,603],[1092,600],[1104,613],[1081,632],[1039,670],[998,699]],'Склон под восточной террасой');
poly('portal-front-left-face',[[1169,558],[1191,577],[1232,583],[1232,638],[1196,636],[1162,608],[1147,593]],'Склон под порталом');
poly('portal-front-right-face',[[1345,586],[1391,578],[1421,555],[1436,548],[1442,571],[1432,608],[1407,635],[1370,651],[1345,650]],'Склон под порталом');
poly('portal-side-rim',[[1441,457],[1465,478],[1471,506],[1458,548],[1438,561],[1427,546],[1448,512],[1450,487],[1435,473]],'Боковой край портала');
// Stair sides prevent walking off the sloping steps onto a vertical cliff.
poly('west-stair-left-wall',[[125,348],[137,350],[124,380],[116,413],[115,448],[108,458],[94,457],[102,406]],'Левая стенка западной лестницы');
poly('west-stair-right-wall',[[203,356],[215,359],[198,400],[187,431],[181,457],[171,478],[158,479],[163,462],[172,434],[180,399]],'Правая стенка западной лестницы');
poly('main-stair-left-wall',[[716,642],[751,640],[754,650],[753,746],[748,766],[735,772],[711,765],[724,742],[728,666]],'Левая стенка лестницы');
poly('main-stair-right-wall',[[827,640],[855,641],[861,658],[863,763],[849,773],[826,770],[824,748],[825,658]],'Правая стенка лестницы');

poly('boathouse-slope-join',[[970,673],[1009,654],[1037,666],[1037,723],[1039,765],[1004,762],[983,745],[971,717]],'Основание у лодочного сарая');
// Rails are thin segments with individual posts, rather than their entire bounding rectangles.
function rail(id,a,b,depth,box){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*3,ny=dx/l*3;poly(id,[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],'Ограда');if(box)sprite(id,box,depth,'rail',[a,b]);}
function railChain(id,ps,depth,box){for(let i=1;i<ps.length;i++)rail(id+'-'+i,ps[i-1],ps[i]);if(box)sprite(id,box,depth,'rail',ps);}
railChain('quay-west-a',[[143,823],[177,848],[315,848]],850,[130,785,198,68]);rail('quay-west-b',[411,845],[694,846],849,[401,796,304,56]);railChain('quay-east',[[875,843],[1286,843],[1330,826],[1367,785]],846,[862,748,520,105]);
railChain('market-west',[[655,654],[707,654]],657,[642,614,79,44]);railChain('market-east',[[879,653],[941,653]],657,[866,614,90,44]);
railChain('portal-north',[[1162,455],[1229,426],[1358,426],[1424,455]],457,[1148,387,290,73]);
railChain('portal-entry-west',[[1082,611],[1169,559]],614,[1068,518,116,97]);rail('portal-front-west',[1198,595],[1239,595],598,[1184,555,69,45]);railChain('portal-front-east',[[1322,595],[1365,595],[1403,584],[1433,546]],598,[1308,506,139,96]);
poly('portal-stair-wall-left',[[1230,586],[1258,587],[1259,615],[1257,742],[1250,762],[1229,761]],'Боковая стенка лестницы');poly('portal-stair-wall-right',[[1307,590],[1340,590],[1345,620],[1344,760],[1324,760],[1310,750],[1308,615]],'Боковая стенка лестницы');
sprite('portal-stair-wall-left',[1228,566,26,190],754,'long-wall');sprite('portal-stair-wall-right',[1318,566,28,190],756,'long-wall');
for(const [id,x,y,rx,ry]of [['gate-left',724,286,14,10],['gate-right',834,286,14,10],['stair-main-top-left',729,653,10,8],['stair-main-top-right',855,653,10,8],['stair-main-lower-left',718,763,8,7],['stair-main-lower-right',853,763,8,7],['stair-east-bottom-left',1232,752,8,7],['stair-east-bottom-right',1333,752,8,7]])ellipse(id,x,y,rx,ry,'Основание опоры');
sprite('main-stair-left-side',[709,602,45,174],773,'long-wall');sprite('main-stair-right-side',[825,602,48,174],773,'long-wall');
const wallSilhouettes={
 'main-stair-left-side':[[716,602],[740,602],[745,617],[745,654],[740,706],[735,747],[736,776],[709,776],[711,746],[720,696],[726,658],[716,658]],
 'main-stair-right-side':[[842,602],[867,602],[868,656],[871,710],[873,750],[872,776],[842,776],[836,744],[831,700],[829,655],[842,655]],
 'portal-stair-wall-left':[[1230,566],[1252,566],[1256,600],[1254,754],[1228,754],[1230,600]],
 'portal-stair-wall-right':[[1318,566],[1346,566],[1346,756],[1320,756],[1316,600]]
};for(const[id,visualPolygon]of Object.entries(wallSilhouettes)){const prop=foreground.find(p=>p.id===id);if(prop)prop.visualPolygon=visualPolygon;}
for(const [id,x,y]of [['stair-west-upper-left',138,343],['stair-west-front-left',132,373],['stair-west-upper-right',208,350],['stair-west-front-right',202,383],['stair-west-bottom-right',176,479],['quay-loose-edge',28,785],['portal-loose-west',1110,523]]){ellipse(id,x,y,7,5,'Основание столба');sprite(id,[x-11,y-39,22,44],y+2);}
sprite('gate-left',[679,145,70,157],294);sprite('gate-right',[807,144,61,158],294);
for(const [i,x,y]of [[0,718,880],[1,718,930],[2,717,987],[3,820,880],[4,820,930],[5,845,987],[6,771,987]]){ellipse('dock-post-'+i,x,y,6,4,'Причальный столб');sprite('dock-post-'+i,[x-12,y-54,24,60],y+2,'post');}
// Complete upright tree sprites, including the forest edge. Only trunks block feet.
function tree(id,kind,x,y,size=1){const spec={id,kind,...point(x,y),size,scale:4,depth:y*S};trees.push(spec);ellipse('trunk-'+id,x,y-(id==='round-east'?10:0),kind==='oak'?10:8,kind==='oak'?7:6,'Ствол дерева');}
for(const spec of [['round-nw','oak',204,248,1.05],['round-guild','oak',646,326,1.0],['round-east','oak',1097,479,1.1],['round-lower','oak',1011,704,1.08],['round-north','oak',931,144,1.1],['round-ne','oak',1385,266,1.04],['pine-west','pine',44,558,1.05],['pine-west-lower','pine',47,712,1.0],['birch-ne','birch',1450,195,1.1],['pine-east','pine',1477,592,1.15]])tree(...spec);
for(let i=0;i<20;i++){const x=18+i*77;if(x>698&&x<850)continue;tree('north-edge-'+i,['pine','oak','birch','oak'][i%4],x,85+(i%3)*22,.97+(i%4)*.06);}
for(let i=0;i<8;i++){tree('west-edge-'+i,['oak','pine','birch'][i%3],22+(i%2)*8,190+i*75,.96+(i%3)*.07);tree('east-edge-'+i,['pine','oak','birch'][i%3],1507-(i%2)*8,250+i*69,.98+(i%3)*.05);}
for(const [id,x,y,size]of [['guild-flowers',245,330,.65],['west-garden',119,701,.65],['portal-garden',1049,535,.8],['lower-garden',935,685,.8],['east-garden',1423,711,.7]]){const p={id,...point(x,y),size};shrubs.push(p);ellipse('shrub-'+id,x,y,13*size,8*size,'Куст');}
for(const [id,x,y,w,h]of [['guild-rock',617,343,27,18],['north-rock',883,291,29,18],['east-rock',1384,731,29,18],['west-rock',134,812,26,16]]){stones.push({id,...point(x,y),w:w*S,h:h*S,seed:x+y});ellipse('rock-'+id,x,y,w*.36,h*.22,'Камень');}
const benches=[{id:'north-west',x:664,y:355,w:68,h:35},{id:'north-east',x:839,y:353,w:69,h:36},{id:'quay-west',x:590,y:744,w:73,h:43},{id:'quay-east',x:886,y:744,w:74,h:43}];
for(const b of benches){poly('bench-'+b.id,[[b.x+5,b.y+b.h-24],[b.x+b.w-7,b.y+b.h-24],[b.x+b.w-4,b.y+b.h-10],[b.x+b.w-6,b.y+b.h],[b.x+8,b.y+b.h],[b.x+4,b.y+b.h-10]],'Скамейка');sprite('bench-'+b.id,[b.x,b.y,b.w,b.h],b.y+b.h,'bench',[[b.x,b.y+b.h-5],[b.x+8,b.y+b.h],[b.x+b.w-8,b.y+b.h],[b.x+b.w,b.y+b.h-5]]);}
const stalls=[{id:'town-equipment',category:'equipment',name:'Снаряжение',...point(302,568)},{id:'town-consumables',category:'consumables',name:'Расходники',...point(454,568),vendor:true},{id:'town-abilities',category:'magic',name:'Способности',...point(606,568)}].map(s=>({...s,scale:1.25,approach:{x:s.x,y:s.y+97},range:128}));
for(const s of stalls)colliders.push({id:s.id,type:'poly',points:[[250,334],[426,334],[426,424],[418,424],[418,466],[261,466],[261,453],[251,453]].map(([x,y])=>[s.x+(x-340)*s.scale,s.y+(y-467)*s.scale]),label:'Прилавок и стойки'});
const fountain={...point(802,510),rx:116,ry:62,height:204};ellipse('fountain',802,515.5,62,32.5,'Чаша фонтана');
const portal={...point(1294,503),rx:134,ry:82,range:166},crystals=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return {id:'portal-crystal-'+i,x:portal.x+Math.cos(a)*134,y:portal.y+Math.sin(a)*79,seed:i};});for(const c of crystals)colliders.push({id:c.id,type:'ellipse',x:c.x,y:c.y+13,rx:11,ry:7,label:'Основание кристалла'});
const lamps=[point(706,462),point(924,462),point(703,593),point(902,595),point(683,765),point(902,766),point(1379,567)];lamps.forEach((p,i)=>colliders.push({id:'town-lamp-'+i,type:'ellipse',...p,rx:8,ry:6,label:'Фонарь'}));
const northWalls=[{id:'north-wall-west',box:[699,-19,27,297],foot:[705,0,19,277]},{id:'north-wall-east',box:[817,-19,27,297],foot:[823,0,18,277]}];for(const wall of northWalls)rect(wall.id,...wall.foot,'Каменная ограда северного прохода');
const perimeter=points([[64,135],[210,95],[666,75],[724,75],[724,0],[823,0],[823,75],[1384,93],[1465,215],[1494,464],[1495,715],[1467,779],[1383,812],[1357,836],[1286,845],[821,845],[821,916],[838,916],[838,957],[725,957],[725,845],[482,845],[396,845],[396,898],[324,898],[324,845],[286,837],[114,821],[24,818],[24,787],[30,766],[19,716],[50,701],[51,485],[72,332]]);
const vendor={x:stalls[1].x-5,y:stalls[1].y-52.5,dir:2,height:110,moving:false,seed:3.1,idleStyle:'haru'},guildBoard={x:1118,y:644,markerY:526,range:130,approach:point(544,360)};
const waypoints={entry:point(768,169),guild:buildings[0].door,equipment:stalls[0].approach,consumables:stalls[1].approach,abilities:stalls[2].approach,fountain:point(800,611),portal:point(1293,542),quay:point(792,800),pier:point(748,944),west:point(85,708),house1:buildings[1].door,house2:buildings[2].door,house3:buildings[3].door};
const chimneys=[{id:'west-house-1',...point(208,621),seed:1},{id:'north-house-2',...point(1108,170),seed:5}];
const windows=[[320,276,22,24],[550,284,21,16],[962,293,18,20],[1145,244,18,20],[1248,262,20,20],[251,681,19,18],[201,724,22,21],[385,730,20,20]].map(([x,y,w,h])=>({x:x*S,y:y*S,w:w*S,h:h*S}));
const banners=[{x:718*S,y:171*S,w:32*S,h:79*S,seed:1},{x:847*S,y:170*S,w:32*S,h:79*S,seed:3}];
globalThis.TownData={id:'starter-town',name:'Прибрежный город',scale:S,width:3072,height:2048,minY:0,maxY:2048,perimeter,colliders,foreground,northWalls,trees,shrubs,stones,buildings,benches,stalls,fountain,portal,crystals,lamps,vendor,guildBoard,waypoints,chimneys,windows,banners,spawn:{...point(768,167),dir:2},companion:{...point(768,124),dir:2},exit:{x:1536,halfWidth:72,triggerY:128},meadowExit:{x:768,halfWidth:98,triggerY:986},meadowArrival:{teto:{x:766,y:936,dir:0},miku:{x:820,y:987,dir:0}},boat:{...point(928,949),width:190,height:134,mooring:point(850,945)}};
})();
