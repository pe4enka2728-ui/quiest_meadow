const assert=require('node:assert/strict');require('../battle-rules.js');require('../shop-model.js');
const R=BattleRules;let hp=100,last=null;
assert.equal(R.settings.enemyMaxHp,150);
assert.equal(R.opacity(null,0,100),1);
let hit=R.hit(hp,last,1);assert.ok(hit.applied);assert.equal(hit.hp,95);hp=hit.hp;last=hit.lastHit;
assert.equal(R.opacity(last,1.15,hp),.3);
for(const t of [1,1.01,2,2.499]){hit=R.hit(hp,last,t);assert.equal(hit.applied,false);assert.equal(hit.hp,95);assert.equal(hit.lastHit,1)}
hit=R.hit(hp,last,2.5);assert.equal(hit.applied,true);assert.equal(hit.hp,90);assert.equal(hit.lastHit,2.5);
assert.equal(R.opacity(last,2.5,95),1,'blinking expires exactly after 1.5 seconds');
assert.equal(R.hit(100,null,1,false).hp,100);assert.equal(R.hit(100,null,1,false).lastHit,null);
assert.equal(R.hit(5,null,1).hp,0);assert.equal(R.opacity(1,1.15,0),1);
const wallet=ShopModel.fresh();assert.equal(ShopModel.grant(wallet,'golden-key'),true);assert.equal(wallet.inventory['golden-key'],1);
assert.equal(ShopModel.grant(wallet,'golden-key'),false);assert.equal(wallet.inventory['golden-key'],1);
assert.equal(ShopModel.buy(wallet,'golden-key').ok,false);
assert.equal(ShopModel.restore(wallet).inventory['golden-key'],1);
console.log('PASS exact 5 HP, 1.5-second invulnerability, applied-hit blinking, 150 enemy HP and unique persistent quest key');
