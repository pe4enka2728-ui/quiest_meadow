/* Red sparks stay coloured while the locked chapter button becomes grey. */
(()=>{
'use strict';
const buttons=new Set();let clock=0;
function set(button,locked){if(!button)return;button.classList.toggle('chapter-story-locked',!!locked);let canvas=button.querySelector(':scope > .chapter-lock-particles');if(!locked){canvas?.remove();buttons.delete(button);return;}if(!canvas){canvas=document.createElement('canvas');canvas.className='chapter-lock-particles';canvas.setAttribute('aria-hidden','true');button.append(canvas);}buttons.add(button);}
function update(dt){clock+=dt;for(const b of buttons){if(!b.isConnected||!b.classList.contains('chapter-story-locked')){buttons.delete(b);continue;}if(!b.getClientRects().length)continue;const c=b.querySelector(':scope > .chapter-lock-particles'),w=Math.ceil(b.clientWidth+24),h=Math.ceil(b.clientHeight+24);if(!c)continue;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const g=c.getContext('2d');g.clearRect(0,0,w,h);for(let i=0;i<12;i++){const a=clock*(i%2?.7:-.52)+i*Math.PI*2/12,x=w/2+Math.cos(a)*(w/2-5),y=h/2+Math.sin(a)*(h/2-5);g.globalAlpha=.5+.5*Math.sin(clock*2+i)**2;g.fillStyle=i%3?'#ff485d':'#ff9b99';g.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,3,3);}g.globalAlpha=1;}}
globalThis.ChapterLockArt={set,update,status(){return {clock,visible:[...buttons].filter(b=>b.isConnected&&b.getClientRects().length).length};}};
})();
