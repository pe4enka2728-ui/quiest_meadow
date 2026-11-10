/* Shared catalogue, owned items and persistent ten-slot loadout. Pure model. */
(()=>{
'use strict';
const categories=[{id:'equipment',name:'Экипировка',hint:'Мечи, броня и амулеты',icon:'sword'},{id:'magic',name:'Способности',hint:'Приёмы и голос Тето',icon:'hand'},{id:'consumables',name:'Расходники',hint:'Восстановить силы и ману',icon:'potion'}];
const weapons=[
 {id:'ribbon',name:'Клинок решимости',price:40,damage:4,description:'Короткий меч с алой лентой. Его вес помогает держать ровный ритм.'},
 {id:'crimson-sabre',name:'Сабля алого хора',price:85,damage:8,description:'Тонкое красноватое лезвие звенит в унисон с голосом Тето.'},
 {id:'rift-blade',name:'Клинок разлома',price:150,damage:13,description:'Тёмная сталь с бледной кромкой. Рассекает даже дрожащий сигнал.'}
].map(v=>({...v,category:'equipment',kind:'weapon',slot:'weapon',icon:'sword',limit:1,properties:['Урон оружия: +'+v.damage,'Усиливает обычный удар и способности']}));
const armors=[
 {id:'traveller-coat',name:'Куртка пути',price:50,hp:20,description:'Лёгкая куртка, в которой проще пережить долгую дорогу.'},
 {id:'chorus-vest',name:'Жилет охотницы',price:95,hp:40,description:'Плотная ткань смягчает удары и сохраняет тепло.'},
 {id:'echo-cuirass',name:'Панцирь отголоска',price:145,hp:65,description:'Тонкие пластины удерживают последние отголоски чужих ударов.'}
].map(v=>({...v,category:'equipment',kind:'armor',slot:'armor',icon:'armor',limit:1,properties:['Максимум HP: +'+v.hp]}));
const amulets=[
 {id:'charm',name:'Тихий талисман',price:45,manaDiscount:1,description:'Тихий свет экономит ману, не меняя её предела.',properties:['Стоимость приёмов: −1 MP','Минимальная стоимость: 1 MP']},
 {id:'tuning-fork',name:'Камертон удачи',price:90,critBonus:.12,description:'Золотой камертон ловит миг, когда любой звук становится острее.',properties:['Шанс критического удара: +12 п.п.']},
 {id:'moon-shard',name:'Лунный осколок',price:100,mpRegen:3,description:'После каждой вражеской фазы возвращает немного потраченного голоса.',properties:['Восстановление MP за ход: +3']}
].map(v=>({...v,category:'equipment',kind:'amulet',slot:'amulet',icon:'amulet',limit:1}));
const attacks=[
 ['pulse','Импульс',35,3,9,.96,.15,1.6,'pulse','Короткая звуковая волна с ровным ударом.'],
 ['scarlet-accent','Алый акцент',55,5,14,.92,.25,1.8,'slash','Резкий взмах с повышенным шансом критического удара.'],
 ['double-syllable','Двойной слог',70,6,7,.90,.16,1.6,'double','Два отдельных удара: у каждого свой бросок попадания и крита.'],
 ['thorn-note','Колючая нота',65,5,7,.94,.12,1.5,'thorn','Отравление: 3 урона после каждой из трёх вражеских фаз.'],
 ['wormwood','Полынный шёпот',85,7,10,.90,.18,1.6,'poison','Отравление: 5 урона после каждой из двух вражеских фаз.'],
 ['glass-high','Стеклянный верх',95,8,24,.84,.30,2,'crystal','Сильный, рискованный приём. Критический удар удваивает урон.'],
 ['discord','Сбитый ритм',75,6,13,.95,.18,1.7,'discord','При попадании следующий ход врага наносит на 2 урона меньше.'],
 ['step','Тихий шаг',45,4,6,1,.10,1.5,'step','Точный удар. При попадании даёт 15% уклонения на следующий ход врага.'],
 ['reverse-beat','Обратный такт',90,7,18,.93,.20,1.8,'reverse','Критический удар возвращает 3 MP.'],
 ['dawn-chorus','Хор рассвета',125,10,30,.98,.22,2,'chorus','Мощная светлая нота с высокой точностью.']
].map(v=>({id:v[0],name:v[1],price:v[2],mana:v[3],power:v[4],chance:v[5],crit:v[6],critMultiplier:v[7],glyph:v[8],description:v[9],category:'magic',kind:'ability',icon:'ability',limit:1,hits:v[0]==='double-syllable'?2:1,
 ...(v[0]==='thorn-note'?{poison:{damage:3,turns:3}}:v[0]==='wormwood'?{poison:{damage:5,turns:2}}:v[0]==='discord'?{reduction:2}:v[0]==='step'?{dodge:.15}:v[0]==='reverse-beat'?{refund:3}:{}),
 properties:['Сила: '+v[4]+(v[0]==='double-syllable'?' × 2':''),'MP: '+v[3],'Попадание: '+Math.round(v[5]*100)+'%','Крит: '+Math.round(v[6]*100)+'% · ×'+v[7]]}));
const supports=[
 {id:'warm-note',name:'Тёплая нота',price:60,mana:5,heal:25,glyph:'heal',description:'Мягкая нота восстанавливает Тето 25 HP, не превышая максимум.',properties:['Лечение: 25 HP','MP: 5','Срабатывает всегда']},
 {id:'second-breath',name:'Второе дыхание',price:105,mana:9,heal:50,glyph:'heal-large',description:'Возвращает Тето 50 HP, не превышая максимум. При полном здоровье мана не тратится.',properties:['Лечение: 50 HP','MP: 9','Срабатывает всегда']},
 {id:'soft-guard',name:'Мягкий барьер',price:70,mana:4,resistance:.20,glyph:'shield',description:'Уменьшает урон на 20% до конца следующей фазы врага. Падение в пропасть остаётся смертельным. С другим барьером действует самый сильный.',properties:['Сопротивление: 20%','MP: 4','Следующая фаза врага · без сложения']},
 {id:'quiet-shell',name:'Тихий купол',price:115,mana:7,resistance:.40,glyph:'shield-large',description:'Уменьшает урон на 40% до конца следующей фазы врага. Заменяет слабый барьер. Падение в пропасть остаётся смертельным.',properties:['Сопротивление: 40%','MP: 7','Следующая фаза врага · без сложения']},
 {id:'perfect-accent',name:'Точный акцент',price:100,mana:6,nextCrit:true,glyph:'critical',description:'Следующий атакующий приём гарантированно наносит критический урон при попадании. Работает на все его удары. Лечение и усиления не расходуют заряд.',properties:['Следующий атакующий приём: крит при попадании','MP: 6','Сохраняется до применения · без сложения']},
 {id:'quick-tempo',name:'Быстрый темп',price:80,mana:4,speed:.10,glyph:'speed',description:'Увеличивает скорость перемещения Тето на 10% до конца следующей фазы врага. Скорость атак и длительность прыжка не меняются.',properties:['Скорость: +10%','MP: 4','Следующая фаза врага · без сложения']}
].map(v=>({...v,category:'magic',kind:'ability',icon:'ability',limit:1,power:0,hits:0,chance:1,crit:0,critMultiplier:1,target:'hero'}));
const consumables=[
 {id:'herbal',category:'consumables',kind:'consumable',name:'Травяной настой',price:12,icon:'potion',restore:{hp:35},properties:['Восстановление HP: 35'],description:'Пахнет листьями. Восстанавливает 35 HP в бою.',limit:99},
 {id:'mint',category:'consumables',kind:'consumable',name:'Мятная капля',price:14,icon:'potion',restore:{mp:12},properties:['Восстановление MP: 12'],description:'Прохладная капля возвращает 12 MP в бою.',limit:99}
];
const goods=[...weapons,...armors,...amulets,...attacks,...supports,...consumables];
const questItems=[{id:'golden-key',category:'keyItems',kind:'key',name:'Золотой ключ',icon:'key',limit:1,properties:['Ключевой предмет'],description:'На бородке вырезана маленькая спираль. Открывает лесные ворота.'}];
const abilities=[{id:'gumi-wand',category:'magic',kind:'ability',name:'Волшебная палочка',icon:'wand',glyph:'wand',limit:1,mana:6,power:18,chance:.95,crit:.20,critMultiplier:1.8,hits:1,properties:['Дар Гуми','Сила: 18','MP: 6','Попадание: 95%','Крит: 20% · ×1.8'],description:'Дар освобождённой Гуми. Золотая звезда выпускает светлый сгусток.'}];
const inventoryCatalog=[...goods,...questItems,...abilities],inventoryCategories=[...categories,{id:'keyItems',name:'Ключевые предметы'}];
const find=id=>inventoryCatalog.find(i=>i.id===id);
const emptyLoadout=()=>({schema:1,weapon:null,armor:null,amulet:null,abilities:Array(10).fill(null)});
function normalizeLoadout(raw,inventory){
 const result=emptyLoadout();for(const slot of ['weapon','armor','amulet']){const item=find(raw?.[slot]);if(item?.slot===slot&&inventory[item.id]>0)result[slot]=item.id;}
 const seen=new Set(),source=Array.isArray(raw?.abilities)?raw.abilities:inventory.pulse?['pulse']:[];
 for(let i=0;i<10;i++){const item=find(source[i]);if(item?.kind==='ability'&&inventory[item.id]>0&&!seen.has(item.id)){result.abilities[i]=item.id;seen.add(item.id);}}
 return result;
}
function fresh(){return {version:1,gold:120,inventory:{pulse:1},loadout:{...emptyLoadout(),abilities:['pulse',...Array(9).fill(null)]}};}
function restore(raw){
 if(!raw||raw.version!==1||!Number.isInteger(raw.gold)||raw.gold<0||raw.gold>100000)return fresh();
 const result={version:1,gold:raw.gold,inventory:{}};
 for(const item of inventoryCatalog){const count=raw.inventory?.[item.id]??0;if(!Number.isInteger(count)||count<0||count>item.limit)return fresh();if(count)result.inventory[item.id]=count;}
 // The initial basic ability is also supplied when opening a pre-0.45 wallet.
 if(!raw.loadout&&!result.inventory.pulse)result.inventory.pulse=1;
 result.loadout=normalizeLoadout(raw.loadout,result.inventory);return result;
}
function equip(wallet,slot,id,index=0){
 if(!wallet.loadout)wallet.loadout=normalizeLoadout(null,wallet.inventory);
 if(!['weapon','armor','amulet','abilities'].includes(slot))return {ok:false,reason:'slot'};
 if(slot==='abilities'&&(!Number.isInteger(index)||index<0||index>=10))return {ok:false,reason:'slot'};
 const item=id===null?null:find(id);
 if(id!==null&&(!item||!(wallet.inventory[id]>0)||(slot==='abilities'?item.kind!=='ability':item.slot!==slot)))return {ok:false,reason:'type'};
 if(slot==='abilities'){
  if(id!==null&&wallet.loadout.abilities.some((v,i)=>v===id&&i!==index))return {ok:false,reason:'duplicate'};
  wallet.loadout.abilities[index]=id;
 }else wallet.loadout[slot]=id;
 return {ok:true};
}
function stats(wallet){const gear=normalizeLoadout(wallet?.loadout,wallet?.inventory||{}),w=find(gear.weapon),a=find(gear.armor),m=find(gear.amulet);return {damage:14+(w?.damage||0),weaponDamage:w?.damage||0,maxHp:100+(a?.hp||0),maxMp:25,manaDiscount:m?.manaDiscount||0,critBonus:m?.critBonus||0,mpPerTurn:5+(m?.mpRegen||0)};}
function grant(wallet,id){const item=[...questItems,...abilities].find(g=>g.id===id);if(!item||(wallet.inventory[id]||0)>=item.limit)return false;wallet.inventory[id]=1;return true;}
function buy(wallet,id){const item=goods.find(g=>g.id===id);if(!item)return {ok:false,reason:'unknown'};const owned=wallet.inventory[id]||0;if(owned>=item.limit)return {ok:false,reason:'owned'};if(wallet.gold<item.price)return {ok:false,reason:'funds'};wallet.gold-=item.price;wallet.inventory[id]=owned+1;return {ok:true,item};}
function consume(wallet,id){const item=find(id);if(item?.kind!=='consumable'||!(wallet.inventory[id]>0))return {ok:false};wallet.inventory[id]--;if(!wallet.inventory[id])delete wallet.inventory[id];return {ok:true,item};}
const isPurchased=(wallet,item)=>item.kind!=='consumable'&&(wallet.inventory[item.id]||0)>0;
function listGoods(wallet,category){return goods.filter(g=>g.category===category).sort((a,b)=>Number(isPurchased(wallet,a))-Number(isPurchased(wallet,b)));}
globalThis.ShopModel={categories,goods,questItems,abilities,attacks,supports,weapons,armors,amulets,inventoryCatalog,inventoryCategories,find,fresh,restore,buy,grant,equip,consume,stats,normalizeLoadout,emptyLoadout,isPurchased,listGoods};
})();
