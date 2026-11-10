/* Two bedrooms connected by a wide doorway; the south threshold returns to the city. */
(()=>{
'use strict';const colliders=[],items=[];
const rect=(id,x,y,w,h,label)=>{const c={id:'home-'+id,type:'rect',x,y,w,h,label};colliders.push(c);return c;};
const item=(id,kind,x,y,w,h,name,text)=>{const p={id,kind,x,y,w,h,name,text,depth:y+h,approach:{x:x+w/2,y:y+h+31}};items.push(p);const top=kind.startsWith('bed')?28:Math.max(8,h*.34);rect(id,x+4,y+top,w-8,h-top,name);return p;};
rect('north-wall',156,142,1224,44,'Северная стена');rect('west-wall',154,166,28,738,'Западная стена');rect('east-wall',1354,166,28,738,'Восточная стена');rect('south-west',156,885,176,24,'Южная стена');rect('south-long',440,885,940,24,'Южная стена');rect('partition-north',752,176,32,375,'Перегородка');rect('partition-south',752,672,32,230,'Перегородка');
item('teto-bed','bed-red',230,241,198,205,'Кровать Тето','Моя кровать. Красное одеяло и знакомая подушка. Здесь можно перевести дух.');
item('miku-bed','bed-teal',1104,241,198,205,'Кровать Мику','Мику аккуратно заправила постель. На тумбочке лежит закладка в форме ноты.');
item('teto-desk','desk',526,257,160,95,'Письменный стол','На столе — письма и чистый лист. Здесь можно сохранить воспоминание.');
item('miku-desk','music-desk',862,257,164,95,'Стол Мику','Несколько нотных листов и маленький метроном. Мику наверняка вернётся к этой мелодии.');
item('teto-night','nightstand-red',448,278,64,72,'Тумбочка Тето','Маленькая лампа и пара старых открыток. Стекло чуть тёплое.');
item('miku-night','nightstand-teal',1038,278,57,72,'Тумбочка Мику','Рядом с лампой — резинка для волос и книга с загнутым уголком.');
item('teto-wardrobe','wardrobe',199,594,101,164,'Шкаф Тето','Шарфы, запасная куртка и коробка с алыми лентами. Всё на своих местах.');
item('miku-books','bookshelf',1247,563,92,188,'Книжный шкаф','Песенники, старые истории и тетради Мику. Между книгами спрятан засушенный цветок.');
item('tea-table','tea-table',1003,651,134,92,'Чайный столик','Две чашки рядом. Чай уже остыл, но дом всё равно кажется тёплым.');
item('teto-chest','chest',545,710,121,79,'Сундук','Старые вещи и дорожный плед. Внизу — общий альбом Тето и Мику.');
item('miku-stool','stool',886,590,65,63,'Пуфик','Мягкий пуфик у ковра. Кажется, Мику любит читать именно здесь.');
for(const [id,x,y]of [['plant-west',210,837],['plant-east',1307,838]])colliders.push({id:'home-'+id,type:'ellipse',x,y,rx:21,ry:14,label:'Цветочный горшок'});
const perimeter=[[154,142],[1382,142],[1382,909],[456,909],[456,1024],[318,1024],[318,909],[154,909]];
const outside={teto:{x:2028,y:738,dir:2},miku:{x:2093,y:750,dir:2}};
globalThis.HomeData={id:'teto-miku-home',name:'Дом Тето и Мику',width:1536,height:1024,minY:0,maxY:1024,perimeter,colliders,items,spawn:{x:384,y:846,dir:0},companion:{x:444,y:844,dir:0},exit:{x:385,halfWidth:48,triggerY:946},outside,door:{x:2028,y:710,approach:{x:2028,y:730},halfWidth:31,triggerY:718,range:104},roomDoor:{x:768,y:611},waypoints:{entry:{x:384,y:846},tetoBed:{x:447,y:443},tetoDesk:{x:606,y:394},middle:{x:768,y:610},mikuBed:{x:1080,y:443},mikuDesk:{x:941,y:393},tea:{x:1070,y:781},exit:{x:385,y:954}}};
})();
