/* The sole damage contract. A rejected hit cannot start or extend blinking. */
(()=>{
const settings={heroMaxHp:100,heroMaxMp:30,mpPerTurn:5,enemyMaxHp:150,enemyDamage:5,invulnerability:1.5,heroDeath:2.2,enemyDeath:1.9,returnFade:.55};
function protectedAt(lastHit,now){return lastHit!==null&&Number.isFinite(lastHit)&&now-lastHit>=0&&now-lastHit<settings.invulnerability-1e-9}
function hit(hp,lastHit,now,enabled=true){if(!enabled||hp<=0||protectedAt(lastHit,now))return {applied:false,hp,lastHit};return {applied:true,hp:Math.max(0,hp-settings.enemyDamage),lastHit:now,damage:settings.enemyDamage}}
function opacity(lastHit,now,hp){return hp>0&&protectedAt(lastHit,now)&&Math.floor((now-lastHit)*8)%2===1?.30:1}
globalThis.BattleRules={settings,protectedAt,hit,opacity};
})();
