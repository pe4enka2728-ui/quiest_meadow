const assert=require('node:assert/strict');require('../gumi-arena-model.js');require('../gumi-attacks-v2.js');const H=GumiAttacksV2,A=GumiArenaModel;
assert.equal(H.selection.phaseTwoHoopsWeight,4);assert.equal(H.selection.defaultWeight,1);assert.deepEqual(H.available(1),[0,1,4,5]);assert.deepEqual(H.available(2),[0,1,2,3,4,5]);
// Exhaust a uniform quantile grid so the odds check is deterministic.
const count=90000,distributions=[];
for(const previous of [-1,0,1,2,3,4,5]){
 const frequencies=Array(6).fill(0);for(let i=0;i<count;i++){const index=H.choose(previous,()=>(i+.5)/count,2);assert(index>=0&&index<6);assert.notEqual(index,previous);frequencies[index]++;}
 const expected=previous===3?0:previous===-1?4/9:1/2;assert(Math.abs(frequencies[3]/count-expected)<.0001);for(let i=0;i<6;i++)if(i!==previous&&i!==3)assert(frequencies[i]>0);
 distributions.push({previous,hoops:frequencies[3]/count,frequencies});
}
// Phase one retains its exact old partition.
for(const previous of [-1,0,1,4,5]){const candidates=[0,1,4,5].filter(i=>i!==previous);for(let n=0;n<1001;n++){const roll=n/1000,expected=candidates[Math.min(candidates.length-1,Math.floor(roll*candidates.length))];assert.equal(H.choose(previous,()=>roll,1),expected);}}
for(const previous of [-1,0,1,2,3,4,5])for(const roll of [0,1,-.1,1.1])assert(H.available(2).filter(i=>i!==previous).includes(H.choose(previous,()=>roll,2)));
// A randomly selected hoop attack actually starts after the phase transition.
for(const previous of [0,1,2,4,5]){const index=H.choose(previous,()=>.51,2);assert.equal(index,3);const arena=A.create(()=>.5);A.setBossHp(arena,150);A.step(arena,5.01,{u:.5,v:.7},{damageEnabled:false});const s=H.create(index,7,{phase:2,arena,player:{u:.5,v:.7},random:()=>.5});assert.equal(arena.temporaryMode,'strip');assert.equal(s.fires.length,5);s.time=s.fires[0]+.1;assert(H.sample(s).some(e=>e.kind==='gumi-fire-hoop'&&e.active&&e.damage===15));H.cancel(s);assert.equal(arena.temporaryMode,null);}
console.log('PASS phase-two hoop odds and original phase-one distribution:',JSON.stringify(distributions));
