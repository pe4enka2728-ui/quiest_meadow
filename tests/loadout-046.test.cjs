const assert=require('node:assert/strict');require('../shop-model.js');require('../loadout-combat-model.js');const M=ShopModel,C=LoadoutCombatModel;
const w=M.fresh();w.gold=10000;for(const i of M.goods)M.buy(w,i.id);
assert.equal(M.equip(w,'weapon','pulse').ok,false);assert(M.equip(w,'weapon','rift-blade').ok);assert(M.equip(w,'armor','echo-cuirass').ok);assert(M.equip(w,'amulet','charm').ok);
assert.deepEqual(M.stats(w),{damage:27,weaponDamage:13,maxHp:165,maxMp:25,manaDiscount:1,critBonus:0,mpPerTurn:5});
assert(M.equip(w,'abilities','thorn-note',1).ok);assert.equal(M.equip(w,'abilities','thorn-note',2).reason,'duplicate');assert(M.equip(w,'abilities','wormwood',2).ok);
assert.deepEqual(M.restore(JSON.parse(JSON.stringify(w))),w);
const dirty={...w,loadout:{...w.loadout,weapon:'pulse',abilities:['pulse','pulse','missing',...Array(7).fill(null)]}};assert.deepEqual(M.restore(dirty).loadout.abilities,['pulse',...Array(9).fill(null)]);
const s=new C.Session(w,()=>0);assert.equal(s.list().length,3);const offered=s.hand.slice(),revision=s.handRevision;s.begin();s.finish();s.begin();assert.deepEqual(s.hand,offered);assert.equal(s.handRevision,revision);
assert.equal(s.cast('basic',25).reason,'not-offered');assert.equal(s.cast('pulse',0).reason,'mana');
let hit=s.cast('thorn-note',25);assert.equal(hit.cost,4);assert.equal(hit.damage,30);assert.equal(hit.mp,21);assert.equal(hit.crits,1);assert.equal(s.cast('wormwood',21).reason,'busy');
s.update(.06);assert.ok(s.reaction().some(n=>n!==0));const before=s.status();assert.deepEqual(s.status(),before);s.update(.4);assert.deepEqual(s.reaction(),[0,0]);
assert(s.cast('thorn-note',21).ok);assert.equal(s.poisons.length,1);s.update(.45);assert(s.cast('wormwood',17).ok);assert.equal(s.poisons.length,2);assert.equal(s.afterEnemy(),8);assert.equal(s.afterEnemy(),8);assert.equal(s.afterEnemy(),3);assert.equal(s.afterEnemy(),0);
M.equip(w,'amulet','tuning-fork');assert.equal(M.stats(w).critBonus,.12);assert.equal(M.stats(w).maxMp,25);M.equip(w,'amulet','moon-shard');assert.equal(M.stats(w).mpPerTurn,8);assert.equal(M.stats(w).maxMp,25);
for(let i=0;i<10;i++)M.equip(w,'abilities',null,i);
for(const ability of M.attacks){M.equip(w,'abilities',ability.id,0);const single=new C.Session(w,()=>0);assert.equal(single.list().length,1);assert(single.cast(ability.id,25).ok);assert(single.cast('basic',25).ok===false);M.equip(w,'abilities',null,0);}
for(let i=0;i<10;i++)assert(M.equip(w,'abilities',M.attacks[i].id,i).ok);
let seed=913;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const deck=new C.Session(w,random),counts=new Set(),seen=new Set();let previous=[];
for(let turn=0;turn<300;turn++){const hand=deck.hand.slice();assert.ok(hand.length>=3&&hand.length<=5);assert.equal(new Set(hand).size,hand.length);assert.ok(hand.every(id=>w.loadout.abilities.includes(id)));assert.ok(hand.length!==previous.length||!hand.every(id=>previous.includes(id)));counts.add(hand.length);hand.forEach(id=>seen.add(id));const hidden=w.loadout.abilities.find(id=>!hand.includes(id));assert.equal(deck.cast(hidden,25).reason,'not-offered');previous=hand;deck.afterEnemy();}
assert.deepEqual([...counts].sort(),[3,4,5]);assert.equal(seen.size,10);
const no=new C.Session(M.fresh(),()=>0);no.wallet.loadout.abilities.fill(null);no.deal();assert.equal(no.list().length,0);
console.log('PASS 0.46: 25 MP cap, paid-only offered casts, 3–5 owned unique choices per turn, no reroll on reopening, low-pool handling, damage/crit/poison, discounts and local hit feedback.');
