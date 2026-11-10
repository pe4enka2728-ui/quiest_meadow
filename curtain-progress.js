/* Opening follows the aftermath dialogue; restored victories reopen the route immediately. */
(()=>{
let amount=0,active=false,age=0;
function invalidate(){globalThis.SpawnWorld?.invalidate?.('interior')}
function restore(defeated=false){amount=defeated?1:0;active=false;age=0;invalidate()}
function open(){if(amount>=1||active)return;active=true;age=amount*3.2}
function update(dt){if(!active)return;age+=dt;const q=Math.min(1,age/3.2);amount=q*q*(3-2*q);if(q>=1){amount=1;active=false;invalidate()}}
globalThis.CurtainProgress={restore,open,update,get amount(){return amount},get active(){return active},get passable(){return amount>=1},status(){return {amount,active,age,passable:amount>=1}}};
})();
