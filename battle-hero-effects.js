/* Two-second feedback animations and icons tied to actual buff lifetime. */
(()=>{
'use strict';
const duration=2;
class Model{
 constructor(){this.entries=[];this.bursts=[];this.serial=0;}
 receive(item,result){
  if(!result?.ok||!item)return;
  const add=(kind,value,icon,name,summary,description)=>{
   this.entries=this.entries.filter(e=>e.kind!==kind);
   const effect={kind,value,icon,name,summary,description,source:item.name,age:0,duration,persistent:!['heal','mana'].includes(kind),serial:++this.serial};this.entries.push(effect);this.bursts=this.bursts.filter(e=>e.kind!==kind);this.bursts.push({...effect});
  };
  if(result.healed>0)add('heal',result.healed,result.healed>=50?'second-breath':'warm-note','Лечение','+'+result.healed+' HP','Здоровье восстановлено мгновенно. Максимум HP не превышен.');
  if(result.restoredMp>0)add('mana',result.restoredMp,'mint','Восстановление маны','+'+result.restoredMp+' MP','Мана восстановлена мгновенно. Максимум — 25 MP.');
  if(result.resistance>0)add('resistance',Math.round(result.resistance*100),result.resistance>=.4?'quiet-shell':'soft-guard','Сопротивление','Урон −'+Math.round(result.resistance*100)+'%','Действует до конца следующей фазы врага. Барьеры не складываются; действует сильнейший. Не спасает от падения в пропасть.');
  if(result.nextCrit)add('critical',100,'perfect-accent','Критический заряд','Крит следующего приёма','Следующий атакующий приём наносит критический урон при попадании. Лечение и усиления не расходуют заряд.');
  if(result.speed>0)add('speed',Math.round(result.speed*100),'quick-tempo','Ускорение','Скорость +'+Math.round(result.speed*100)+'%','Скорость перемещения повышена до конца следующей фазы врага. Повторные усиления не складываются.');
  if(result.hits>0&&item.reduction>0)add('reduction',item.reduction,'soft-guard','Снижение урона','Урон −'+item.reduction,'Каждое попадание следующей фазы врага наносит меньше урона.');
  if(result.hits>0&&item.dodge>0)add('dodge',Math.round(item.dodge*100),'step','Уклонение','Шанс уклонения '+Math.round(item.dodge*100)+'%','До конца следующей фазы врага можно полностью избежать попадания с указанным шансом.');
  if(result.guard>0)add('guard',Math.round(result.guard*100),'quiet-shell','Защита','Урон −'+Math.round(result.guard*100)+'%','Следующая фаза врага наносит вдвое меньше урона. Не спасает от падения в пропасть.');
 }
 update(dt){if(!Number.isFinite(dt)||dt<=0)return;for(const e of this.entries)e.age+=dt;for(const e of this.bursts)e.age+=dt;this.entries=this.entries.filter(e=>e.persistent||e.age<e.duration-1e-9);this.bursts=this.bursts.filter(e=>e.age<e.duration-1e-9);}
 reconcile(buffs,guard=false){this.entries=this.entries.filter(e=>!e.persistent||(e.kind==='critical'?buffs.nextCrit:e.kind==='guard'?guard:buffs[e.kind]));}
 clear(){this.entries=[];this.bursts=[];}
 animations(){return this.bursts.map(e=>({...e}));}
 status(){return this.entries.map(e=>({...e}));}
}
let root=null,icons=null,tooltip=null,visuals=null,worldVisuals=null,hovered=null,focused=null,latest=[];
function init(card){card.closest('#battle-stage').append(card);root=document.createElement('div');root.id='battle-hero-effects';root.setAttribute('aria-label','Полученные эффекты Тето');root.hidden=true;icons=document.createElement('div');icons.className='hero-effect-icons';icons.setAttribute('role','group');icons.setAttribute('aria-label','Лечение и усиления');tooltip=document.createElement('div');tooltip.id='battle-hero-effect-tooltip';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;root.append(icons,tooltip);card.append(root);visuals=document.createElement('canvas');visuals.id='battle-hero-effect-visuals';visuals.width=visuals.height=128;visuals.setAttribute('aria-hidden','true');visuals.hidden=true;card.append(visuals);worldVisuals=document.createElement('canvas');worldVisuals.id='battle-hero-world-effects';worldVisuals.width=1536;worldVisuals.height=1024;worldVisuals.setAttribute('aria-hidden','true');worldVisuals.hidden=true;card.closest('#battle-stage').append(worldVisuals);}
function badge(e){return e.kind==='heal'||e.kind==='mana'?'+'+e.value:e.kind==='critical'?'К':e.kind==='reduction'?'−'+e.value:e.value+'%';}
function drawIcon(canvas,e){const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,32,32);g.drawImage(ShopItemArt.model(e.icon),0,0);}
function showTooltip(buffs,guard){
 const e=latest.find(e=>e.kind===(hovered||focused));tooltip.hidden=!e;if(!e)return;
 let description=e.description;
 if(e.kind==='critical'&&!buffs.nextCrit)description+=' Заряд уже использован.';
 if(['resistance','speed','reduction','dodge'].includes(e.kind)&&!buffs[e.kind])description+=' Усиление уже завершилось.';
 if(e.kind==='guard'&&!guard)description+=' Защита уже завершилась.';
 const name=document.createElement('strong');name.textContent=e.name;const value=document.createElement('span');value.textContent=e.summary;const text=document.createElement('p');text.textContent=description;const source=document.createElement('small');source.textContent=e.source;tooltip.replaceChildren(name,value,text,source);
}
let currentBuffs={},currentGuard=false;
function entry(e){const b=document.createElement('button');b.type='button';b.className='hero-effect';b.dataset.effect=e.kind;b.dataset.serial=e.serial;b.setAttribute('aria-describedby',tooltip.id);b.setAttribute('aria-label',e.name+': '+e.summary);const c=document.createElement('canvas');c.width=c.height=32;c.className='hero-effect-art';c.setAttribute('aria-hidden','true');drawIcon(c,e);const number=document.createElement('span');number.className='hero-effect-value';number.textContent=badge(e);number.setAttribute('aria-hidden','true');b.append(c,number);
 b.onpointerenter=()=>{hovered=e.kind;showTooltip(currentBuffs,currentGuard);};b.onpointerleave=()=>{hovered=null;showTooltip(currentBuffs,currentGuard);};b.onfocus=()=>{focused=e.kind;showTooltip(currentBuffs,currentGuard);};b.onblur=()=>{focused=null;showTooltip(currentBuffs,currentGuard);};b.onclick=()=>{hovered=e.kind;showTooltip(currentBuffs,currentGuard);};return b;}
function sync(entries,buffs={},guard=false,animations=[]){
 if(!root)return;visuals.hidden=!animations.length;const vg=visuals.getContext('2d');vg.clearRect(0,0,128,128);paint(vg,animations,64,112,1,root.closest('#battle').dataset.encounter==='miku');latest=entries;currentBuffs=buffs;currentGuard=guard;root.hidden=!entries.length;
 if(!entries.some(e=>e.kind===hovered))hovered=null;if(!entries.some(e=>e.kind===focused))focused=null;
 const keep=new Set(entries.map(e=>e.kind));for(const b of [...icons.children])if(!keep.has(b.dataset.effect))b.remove();
 for(const e of entries){let b=icons.querySelector('[data-effect="'+e.kind+'"]');if(b&&b.dataset.serial!==String(e.serial)){b.remove();b=null;}if(!b){b=entry(e);icons.append(b);}const appear=Math.min(1,e.age/.12),fade=e.persistent?1:Math.min(1,(e.duration-e.age)/.3);b.style.opacity=String(Math.max(0,Math.min(appear,fade)));b.style.transform='translateY('+Math.round((1-appear)*5-(e.age<duration?Math.sin(e.age*3)*1.5:0))+'px)';}
 showTooltip(buffs,guard);
}
function drawWorld(animations,x,y,alpha=1,monochrome=false){if(!worldVisuals)return;const g=worldVisuals.getContext('2d');g.clearRect(0,0,1536,1024);worldVisuals.hidden=!animations.length||alpha<=0;if(worldVisuals.hidden)return;g.save();g.globalAlpha=alpha;paint(g,animations,x,y,1,monochrome);g.restore();}
function paint(g,animations,x,y,scale=1,monochrome=false){
 if(!animations.length)return;g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);g.imageSmoothingEnabled=false;
 const colors={heal:'#f3b5c4',mana:'#95dfd6',resistance:'#9dd9ee',critical:'#ffe4a1',speed:'#f4d29b',reduction:'#afd2df',dodge:'#c8eed3',guard:'#ccdfef'};
 for(const e of animations){const q=Math.max(0,Math.min(1,e.age/duration)),fade=Math.min(1,q/.08,(1-q)/.18);g.save();g.globalAlpha*=Math.max(0,fade)*.8;g.fillStyle=g.strokeStyle=monochrome?'#fff':colors[e.kind];g.lineWidth=2;
  if(['resistance','guard','reduction'].includes(e.kind)){const radius=40+Math.sin(q*Math.PI)*7;g.globalAlpha*=.6;g.beginPath();g.ellipse(0,-48,radius*.92,radius*1.05,0,0,Math.PI*2);g.stroke();if(e.value>=40){g.beginPath();g.ellipse(0,-48,radius+4,radius*1.12,0,0,Math.PI*2);g.stroke();}}
  const count=e.kind==='heal'?4+Math.min(4,Math.ceil(e.value/25)):e.kind==='critical'?8:6;
  for(let i=0;i<count;i++){const t=(q+i/count)%1,side=i%2?1:-1,px=Math.round(side*(34+(i%3)*6)+Math.sin(q*5+i)*5),py=Math.round(-8-t*95);
   if(e.kind==='heal'||e.kind==='mana'){g.fillRect(px-1,py-4,2,8);g.fillRect(px-4,py-1,8,2);}
   else if(e.kind==='speed'||e.kind==='dodge'){g.beginPath();g.moveTo(px-4,py+4);g.lineTo(px,py);g.lineTo(px+4,py+4);g.stroke();}
   else{g.fillRect(px-1,py-4,2,8);g.fillRect(px-4,py-1,8,2);g.fillRect(px-1,py-1,3,3);}
  }g.restore();
 }g.restore();
}
globalThis.BattleHeroEffects={Model,duration,init,sync,paint,drawWorld};
})();
