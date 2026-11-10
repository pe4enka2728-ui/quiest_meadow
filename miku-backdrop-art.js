/* Latest approved enlarged background, on its own smooth layer behind opaque geometry. */
(()=>{
'use strict';
const layers=new WeakMap();
function drawBehind(canvas,t){
 let layer=layers.get(canvas);
 if(!layer){
  const background=document.createElement('canvas');background.className='miku-warp-backdrop';background.setAttribute('aria-hidden','true');canvas.before(background);
  layer={renderer:MikuAnimatedBackground.createRenderer(background,{scale:1.25,yOffset:-80}),time:null,patches:[]};layers.set(canvas,layer);
  // Moving between displays may recreate the canvas backing store even while paused.
  const repaint=()=>{if(layer.time!==null)layer.patches=layer.renderer.draw(layer.time);};
  window.addEventListener('resize',repaint);
  background.addEventListener('contextlost',event=>event.preventDefault());
  background.addEventListener('contextrestored',repaint);
 }
 // Rendering at 30 Hz leaves movement smooth and avoids repainting a paused background.
 const time=Math.floor(Math.max(0,t)*30)/30;
 if(layer.time!==time){layer.time=time;layer.patches=layer.renderer.draw(time);}
 return layer.patches;
}
globalThis.MikuBackdropArt={drawBehind,scale:1.25,patches:t=>[MikuAnimatedBackground.patch(t,0),MikuAnimatedBackground.patch(t,1)]};
})();
