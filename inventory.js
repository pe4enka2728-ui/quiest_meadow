/* Equipment and ten unique ability slots, with an animated character and hands. */
(()=>{
'use strict';const root=document.querySelector('#inventory'),$=s=>root.querySelector(s);
let opened=false,lastFocus=null,onToggle=()=>{},view='equipment',picker=null,selected=null,clock=0,filter='all',paintAge=0;
const slotNames={weapon:'Оружие',armor:'Броня',amulet:'Амулет'};
root.innerHTML=`<div class="inventory-board"><header class="inventory-header"><div><small>СНАРЯЖЕНИЕ В ПУТИ</small><h1 id="inventory-title">Сумка Тето</h1></div><div class="inventory-wallet"><span>Монеты <b id="inventory-gold">0</b></span><span>Предметы <b id="inventory-count">0</b></span></div><nav class="inventory-tabs" aria-label="Разделы инвентаря"><button id="inventory-equipment-tab" type="button" aria-label="Экипировка" title="Экипировка"></button><button id="inventory-abilities-tab" type="button" aria-label="Способности" title="Способности"></button></nav><button id="inventory-close" type="button" aria-label="Закрыть инвентарь">×</button></header>
<div class="inventory-body"><section class="inventory-left"><div class="inventory-list-heading"><h2 id="inventory-list-title">Все предметы</h2><span id="inventory-slot-count"></span></div><div class="inventory-filters" aria-label="Фильтр предметов"></div><div id="inventory-list" role="group" aria-label="Предметы"></div><div id="inventory-empty" hidden><span>В этой ячейке пока тихо.</span><small>Подходящие вещи можно найти у Хаку.</small></div><section id="inventory-details"><span id="inventory-category">ТЕТО</span><h2 id="inventory-item-name">Выбери предмет</h2><p id="inventory-properties"></p><p id="inventory-description">Нажми на силуэт рядом с Тето, чтобы выбрать экипировку.</p><button id="inventory-unequip" type="button" hidden>Снять из ячейки</button></section></section>
<div class="inventory-pages"><section class="inventory-page inventory-equipment-page"><div class="inventory-character-caption"><small>ТЕТО</small><h2>Готова к пути</h2></div><canvas id="inventory-teto" width="480" height="560" aria-label="Тето в анимированной стойке"></canvas><div class="equipment-orbit" aria-label="Экипировка"></div><div id="inventory-stats"></div></section><section class="inventory-page inventory-abilities-page" inert><div class="inventory-character-caption"><small>ДЕСЯТЬ ПРИЁМОВ</small><h2>Голос в ладонях</h2></div><div class="inventory-hands-scene"><img id="inventory-hands" width="640" height="420" alt="Пиксельные ладони Тето" draggable="false"><div class="ability-orbit" aria-label="Десять ячеек способностей"></div></div><p class="inventory-hands-note">Выбери ячейку у пальца, затем приём слева.</p></section></div></div><footer class="inventory-footer"><span id="inventory-hint" role="status">Каждой вещи — своё место.</span><span>I / 8 · Esc</span></footer></div>`;
$('#inventory-equipment-tab').append(InventoryArt.icon('bag'));$('#inventory-abilities-tab').append(InventoryArt.icon('hand'));
const filters=[['all','bag','Все предметы'],['weapon','weapon','Мечи'],['armor','armor','Броня'],['amulet','amulet','Амулеты']];
for(const [id,art,label]of filters){const b=document.createElement('button');b.type='button';b.dataset.filter=id;b.setAttribute('aria-label',label);b.title=label;b.append(InventoryArt.icon(art));b.onclick=()=>{picker=null;filter=id;render();};$('.inventory-filters').append(b);}
for(const slot of ['weapon','armor','amulet']){const b=document.createElement('button');b.type='button';b.className='equipment-slot '+slot;b.dataset.slot=slot;b.setAttribute('aria-label',slotNames[slot]);b.title=slotNames[slot];b.onclick=()=>{picker={slot};filter=slot;render();hint('Выбери '+slotNames[slot].toLowerCase()+' слева.');};$('.equipment-orbit').append(b);}
// Left thumb, index, middle, ring, pinky; the right hand is mirrored.
const positions=[[8,46],[16,21],[26,12],[36,20],[43,35]];
for(let i=0;i<10;i++){const b=document.createElement('button');b.type='button';b.className='ability-slot';b.dataset.abilitySlot=i;b.setAttribute('aria-label','Ячейка способности '+(i+1));const p=positions[i%5];b.style.left=(i<5?p[0]:100-p[0])+'%';b.style.top=p[1]+'%';b.onclick=()=>{picker={slot:'abilities',index:i};render();hint('Выбери приём слева. Уже занятые другим пальцем приёмы серые.');};$('.ability-orbit').append(b);}
function wallet(){return ShopUI.captureState();}
function hint(text){$('#inventory-hint').textContent=text;}
function size(){const box=root.getBoundingClientRect(),scale=Math.min(box.width/1200,box.height/800);const board=$('.inventory-board');board.style.transform='scale('+scale+')';board.style.left=(box.width-1200*scale)/2+'px';board.style.top=(box.height-800*scale)/2+'px';}
function describe(item){
 selected=item.id;$('#inventory-category').textContent=ShopModel.inventoryCategories.find(c=>c.id===item.category)?.name||'';$('#inventory-item-name').textContent=item.name;$('#inventory-properties').textContent=item.properties.join(' · ');$('#inventory-description').textContent=item.description;
 for(const b of $('#inventory-list').children)b.classList.toggle('selected',b.dataset.item===selected);
}
function image(item){const c=document.createElement('canvas');c.width=c.height=32;c.setAttribute('aria-hidden','true');c.getContext('2d').drawImage(ShopItemArt.model(item.id),0,0);return c;}
function render(){
 const focusItem=root.contains(document.activeElement)?document.activeElement.dataset.item:null;
 const data=wallet(),gear=data.loadout,stats=ShopModel.stats(data);root.dataset.view=view;
 $('#inventory-gold').textContent=data.gold;$('#inventory-count').textContent=Object.values(data.inventory).reduce((a,b)=>a+b,0);
 $('#inventory-equipment-tab').setAttribute('aria-pressed',String(view==='equipment'));$('#inventory-abilities-tab').setAttribute('aria-pressed',String(view==='abilities'));
 $('.inventory-equipment-page').inert=view!=='equipment';$('.inventory-abilities-page').inert=view!=='abilities';
 $('.inventory-filters').hidden=view==='abilities';
 const list=$('#inventory-list');list.replaceChildren();
 const items=ShopModel.inventoryCatalog.filter(item=>data.inventory[item.id]>0&&(view==='abilities'?item.kind==='ability':picker?item.slot===picker.slot:filter==='all'||item.kind===filter));
 $('#inventory-list-title').textContent=view==='abilities'?'Твои способности':picker?slotNames[picker.slot]:{all:'Все предметы',weapon:'Мечи',armor:'Броня',amulet:'Амулеты'}[filter];
 $('#inventory-slot-count').textContent=view==='abilities'?gear.abilities.filter(Boolean).length+' / 10':'';
 $('#inventory-empty').hidden=!!items.length;
 for(const item of items){
  const b=document.createElement('button');b.type='button';b.className='inventory-item';b.dataset.item=item.id;b.setAttribute('aria-label',item.name);b.title=item.name;b.append(image(item));
  const count=document.createElement('span');count.className='inventory-quantity';count.textContent=data.inventory[item.id]>1?'×'+data.inventory[item.id]:'';b.append(count);
  const used=gear.abilities.indexOf(item.id),equipped=Object.values(gear).includes(item.id)||used>=0;b.classList.toggle('equipped',equipped);
  b.disabled=view==='abilities'&&picker&&used>=0&&used!==picker.index;b.classList.toggle('ability-already-used',b.disabled);
  b.onpointerenter=()=>describe(item);b.onfocus=()=>describe(item);
  b.onclick=()=>{describe(item);if(!picker)return;const result=ShopUI.equip(picker.slot,item.id,picker.index);hint(result.ok?item.name+' — выбрано.':result.reason==='duplicate'?'Этот приём уже занят.':'Вещь не подходит к этой ячейке.');};list.append(b);
 }
 for(const b of root.querySelectorAll('.equipment-slot')){const slot=b.dataset.slot,item=ShopModel.find(gear[slot]);b.replaceChildren(item?image(item):InventoryArt.icon(slot,true));b.classList.toggle('filled',!!item);b.classList.toggle('active',picker?.slot===slot);b.title=slotNames[slot]+(item?' · '+item.name:'');}
 for(const b of root.querySelectorAll('.ability-slot')){const i=Number(b.dataset.abilitySlot),item=ShopModel.find(gear.abilities[i]);b.replaceChildren(item?image(item):InventoryArt.icon('hand',true));b.classList.toggle('filled',!!item);b.classList.toggle('active',picker?.slot==='abilities'&&picker.index===i);b.title=item?.name||'Пустая ячейка';}
 $('#inventory-stats').innerHTML='<span><small>ОРУЖИЕ</small><strong>+'+stats.weaponDamage+'</strong></span><span><small>HP</small><strong>'+stats.maxHp+'</strong></span><span><small>MP</small><strong>'+stats.maxMp+'</strong></span>';
 for(const b of $('.inventory-filters').children)b.setAttribute('aria-pressed',String(filter===b.dataset.filter));
 const current=picker?(picker.slot==='abilities'?gear.abilities[picker.index]:gear[picker.slot]):null;$('#inventory-unequip').hidden=!current;
 if(items.length)describe(items.find(i=>i.id===selected)||ShopModel.find(current)||items[0]);else{$('#inventory-item-name').textContent='Пока пусто';$('#inventory-properties').textContent='';$('#inventory-description').textContent='Подходящие предметы появятся здесь после покупки.';}
 if(focusItem){const target=list.querySelector(`[data-item="${focusItem}"]`);if(target&&!target.disabled)target.focus({preventScroll:true});}
}
function setView(next){view=next;picker=next==='abilities'?{slot:'abilities',index:0}:null;filter='all';selected=null;render();update(0);hint(next==='abilities'?'По одному приёму на ячейку. Повторы недоступны.':'Нажми на силуэт рядом с Тето.');}
function open(){if(opened)return;lastFocus=document.activeElement;opened=true;view='equipment';picker=null;selected=null;filter='all';if(ShopUI.isOpen)document.querySelector('#shop').inert=true;root.hidden=false;render();size();onToggle(true);update(0);$('#inventory-equipment-tab').focus({preventScroll:true});}
function close(){if(!opened)return;opened=false;root.hidden=true;document.querySelector('#shop').inert=false;onToggle(false);if(lastFocus?.isConnected&&!lastFocus.inert)lastFocus.focus({preventScroll:true});}
function update(dt){if(!opened)return;dt=Math.max(0,dt);clock+=dt;paintAge+=dt;if(dt&&paintAge<1/30)return;paintAge=0;if(view==='equipment')InventoryArt.standing($('#inventory-teto'),clock);else InventoryArt.hands($('#inventory-hands'),clock);}
function handleKey(e){const d=PixelUI.digit(e);if(['Escape','KeyI'].includes(e.code)||d===8||d===9){e.preventDefault();if(!e.repeat)close();return;}if(e.code==='Tab')return;}
$('#inventory-close').onclick=close;$('#inventory-abilities-tab').onclick=()=>setView('abilities');$('#inventory-equipment-tab').onclick=()=>setView('equipment');
$('#inventory-unequip').onclick=()=>{if(picker){ShopUI.equip(picker.slot,null,picker.index);hint('Ячейка освобождена.');}};
root.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const list=[...root.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length&&!b.closest('[inert]'));const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
window.addEventListener('resize',()=>{if(opened)size();});
// Kept as a controller anchor for older world scripts; the map button itself is never rendered.
const anchor=document.querySelector('#world-inventory');anchor.hidden=true;anchor.tabIndex=-1;anchor.setAttribute('aria-hidden','true');
globalThis.InventoryUI={init(callback){onToggle=callback||(()=>{});},open,close,handleKey,update,refresh(){if(opened)render();},setView,get isOpen(){return opened;},status(){return {...ShopUI.status(),open:opened,view,selected,picker:picker?{...picker}:null,clock};}};
})();
