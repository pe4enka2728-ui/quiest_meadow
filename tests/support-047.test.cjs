const {test}=require('node:test');const assert=require('node:assert/strict');require('../shop-model.js');require('../loadout-combat-model.js');require('../miku-attacks-model.js');require('../miku-combat-model.js');
const M=ShopModel,C=LoadoutCombatModel;
function session(ids){const w=M.fresh();w.inventory={};w.loadout.abilities.fill(null);ids.forEach((id,i)=>{w.inventory[id]=1;M.equip(w,'abilities',id,i);});return new C.Session(w,()=>.5);}
test('six support skills are sold, equippable, unique and survive old-format saves',()=>{
 assert.equal(M.supports.length,6);assert.equal(M.goods.filter(i=>i.kind==='ability').length,16);
 const w=M.fresh();w.gold=10000;for(const a of M.supports){assert(M.buy(w,a.id).ok);assert(M.equip(w,'abilities',a.id,0).ok);assert.equal(M.equip(w,'abilities',a.id,1).reason,'duplicate');}
 assert.deepEqual(M.restore(JSON.parse(JSON.stringify(w))),w);assert.equal(M.restore({version:1,gold:10,inventory:{}}).inventory.pulse,1);
});
test('heals restore 25 or 50 HP, clamp to cap and never spend mana at full HP',()=>{
 for(const [id,heal,cost]of [['warm-note',25,5],['second-breath',50,9]]){const s=session([id]);let r=s.cast(id,25,{hp:10});assert(r.ok);assert.equal(r.hp,10+heal);assert.equal(r.healed,heal);assert.equal(r.mp,25-cost);assert.equal(r.damage,0);assert.equal(r.crits,0);assert.deepEqual(s.reaction(),[0,0]);s.update(.5);r=s.cast(id,25,{hp:90});assert.equal(r.hp,100);assert.equal(r.healed,10);s.update(.5);r=s.cast(id,25,{hp:100});assert.equal(r.reason,'full-hp');assert.equal(r.mp,25);assert.equal(s.busy,0);}
});
test('resistance reduces real damage, strongest wins without stacking and expires after enemy',()=>{
 const s=session(['soft-guard','quiet-shell']);assert(s.cast('soft-guard',25).ok);assert.equal(s.mitigate(20),16);s.update(.5);assert(s.cast('quiet-shell',25).ok);assert.equal(s.mitigate(20),12);assert.equal(s.mitigate(1),1);s.update(.5);assert.equal(s.cast('soft-guard',25).reason,'already-active');assert.equal(s.cast('quiet-shell',25).reason,'already-active');s.afterEnemy();assert.equal(s.mitigate(20),20);assert.equal(s.mitigate(0),0);
 // Encounter adapter must apply mitigation to actual simulation hits.
 const e=new MikuCombatModel.Encounter(()=>.5);e.begin(100,false,0,{double:false,echo:false});s.cast('quiet-shell',25);e.sim.step=function(){this.hits++;this.lastDamage=20;this.hitId='contact';this.hp-=20;};const r=e.step(.02,{}, {hp:100,mitigate:n=>s.mitigate(n)});assert.equal(r.hit.damage,12);assert.equal(r.hp,88);
});
test('next critical charge survives support and enemy phase, affects all hits, then clears',()=>{
 const s=session(['perfect-accent','warm-note','double-syllable']);assert(s.cast('perfect-accent',25).ok);s.update(.5);assert.equal(s.cast('perfect-accent',25).reason,'already-active');assert(s.cast('warm-note',25,{hp:1}).ok);assert(s.buffs.nextCrit);s.update(.5);s.afterEnemy();assert(s.buffs.nextCrit);let r=s.cast('double-syllable',25);assert.equal(r.hits,2);assert.equal(r.crits,2);assert.equal(r.damage,22);assert.equal(s.buffs.nextCrit,false);s.update(.5);r=s.cast('double-syllable',25);assert.equal(r.crits,0);assert.equal(r.damage,14);
});
test('speed buff is exactly +10% in simulation, does not speed time or jump and expires',()=>{
 const s=session(['quick-tempo']);assert(s.cast('quick-tempo',25).ok);assert.equal(s.movementScale(),1.1);s.update(.5);assert.equal(s.cast('quick-tempo',25).reason,'already-active');
 for(const input of [{dx:1,dy:0},{dx:0,dy:1},{dx:1,dy:1}]){const a=new MikuAttackLab.Simulation(0,17),b=new MikuAttackLab.Simulation(0,17);a.invulnerable=b.invulnerable=true;a.jump();b.jump();for(let i=0;i<30;i++){a.step(1/120,input);b.step(1/120,{...input,speedScale:s.movementScale()});}assert.ok(Math.abs(Math.hypot(b.player.x,b.player.y-4)/Math.hypot(a.player.x,a.player.y-4)-1.1)<1e-9);assert.equal(a.clock,b.clock);assert.equal(a.player.z,b.player.z);assert.equal(a.player.jump,b.player.jump);}
 s.afterEnemy();assert.equal(s.movementScale(),1);
});
test('shop sends acquired unique items to end, preserves unowned order and repeatable consumables',()=>{
 const w=M.fresh();w.gold=10000;M.buy(w,'ribbon');M.buy(w,'quiet-shell');M.buy(w,'herbal');M.buy(w,'mint');
 for(const cat of M.categories.map(c=>c.id)){const list=M.listGoods(w,cat),owned=list.filter(i=>M.isPurchased(w,i)),free=list.filter(i=>!M.isPurchased(w,i));assert.deepEqual(list,[...free,...owned]);assert.deepEqual(free,M.goods.filter(i=>i.category===cat&&!M.isPurchased(w,i)));}
 assert.equal(M.listGoods(w,'magic').at(-1).id,'quiet-shell');assert.equal(M.isPurchased(w,M.find('herbal')),false);assert(M.buy(w,'herbal').ok);assert.equal(w.inventory.herbal,2);
});
