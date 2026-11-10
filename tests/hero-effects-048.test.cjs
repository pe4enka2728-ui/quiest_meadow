const {test}=require('node:test');const assert=require('node:assert/strict');require('../battle-hero-effects.js');
const Model=BattleHeroEffects.Model;
test('receipts expire after two gameplay seconds without changing the received effect',()=>{
 const m=new Model(),result={ok:true,healed:25,hp:80};m.receive({name:'Тёплая нота'},result);assert.deepEqual(result,{ok:true,healed:25,hp:80});assert.equal(m.status()[0].value,25);m.update(1.99);assert.equal(m.status().length,1);const paused=m.status();assert.deepEqual(m.status(),paused);m.update(.01);assert.equal(m.status().length,0);
});
test('actual healing and buff amounts have separate readable receipts, failed casts have none',()=>{
 const m=new Model();m.receive({name:'Второе дыхание'},{ok:true,healed:8});assert.equal(m.status()[0].summary,'+8 HP');m.receive({name:'Барьер'},{ok:false,resistance:.4});assert.equal(m.status().length,1);m.receive({name:'Тихий купол'},{ok:true,resistance:.4});m.receive({name:'Быстрый темп'},{ok:true,speed:.1});m.receive({name:'Акцент'},{ok:true,nextCrit:true});assert.deepEqual(m.status().map(e=>[e.kind,e.value]),[['heal',8],['resistance',40],['speed',10],['critical',100]]);assert(m.status().every(e=>e.description&&e.source));
});
test('repeated healing refreshes its badge and lifetime without duplicating or dropping other buffs',()=>{
 const m=new Model();m.receive({name:'Барьер'},{ok:true,resistance:.2});m.receive({name:'Нота'},{ok:true,healed:25});m.update(1.5);m.receive({name:'Дыхание'},{ok:true,healed:50});assert.equal(m.status().length,2);assert.equal(m.status().find(e=>e.kind==='heal').value,50);m.update(.6);m.reconcile({resistance:0});assert.equal(m.status().length,1);assert.equal(m.status()[0].kind,'heal');m.clear();assert.equal(m.status().length,0);
});
test('attack buffs require a hit, consumables show actual restoration and guard has its own receipt',()=>{
 const m=new Model();m.receive({name:'Сбитый ритм',reduction:2},{ok:true,hits:0});assert.equal(m.status().length,0);m.receive({name:'Сбитый ритм',reduction:2},{ok:true,hits:1});m.receive({name:'Тихий шаг',dodge:.15},{ok:true,hits:1});m.receive({name:'Мята'},{ok:true,restoredMp:7});m.receive({name:'Защита'},{ok:true,guard:.5});assert.deepEqual(m.status().map(e=>[e.kind,e.value]),[['reduction',2],['dodge',15],['mana',7],['guard',50]]);
});

test('two-second animation ends while icons remain until real buffs expire or are consumed',()=>{
 const m=new Model();m.receive({name:'Купол'},{ok:true,resistance:.4});m.receive({name:'Акцент'},{ok:true,nextCrit:true});m.receive({name:'Темп'},{ok:true,speed:.1});m.update(2.1);m.reconcile({resistance:.4,nextCrit:true,speed:.1});assert.equal(m.animations().length,0);assert.equal(m.status().length,3);m.reconcile({resistance:.4,nextCrit:false,speed:.1});assert.deepEqual(m.status().map(e=>e.kind),['resistance','speed']);m.reconcile({resistance:0,speed:0});assert.equal(m.status().length,0);
});
