/* Each doorway owns a finite approach area; front and rear can never overlap. */
(()=>{
function frontNear(hero){const d=CircusData.tent.entrance;return Math.abs(hero.x-d.x)<70&&hero.y>d.thresholdY-28&&hero.y<d.y+105;}
function rearNear(hero){const d=CircusData.tent.rearDoor;return Math.abs(hero.x-d.x)<100&&hero.y>d.approach.y-95&&hero.y<d.triggerY+30;}
function rearCrossing(hero){const d=CircusData.tent.rearDoor;return Math.abs(hero.x-d.x)<d.halfWidth&&hero.y>=d.triggerY&&hero.y<d.triggerY+30;}
function rearVisible(hero){const d=CircusData.tent.rearDoor;return Math.abs(hero.x-d.x)<180&&hero.y>d.approach.y-135&&hero.y<d.triggerY+32;}
function appearance(hero){const p=CircusData.tent,top=p.y-p.originY,clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
 const fade=smooth((390-Math.abs(hero.x-p.x))/90)*smooth((-hero.y-1325)/70)*smooth((hero.y-(top-45))/90);
 return {alpha:1-.68*fade,rearDoor:rearVisible(hero)};}
globalThis.TentPortals={frontNear,rearNear,rearCrossing,rearVisible,appearance};
})();
