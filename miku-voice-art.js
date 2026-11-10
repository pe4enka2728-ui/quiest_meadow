/* Per-glyph shaking without moving the dialogue box or changing its layout. */
(()=>{
'use strict';
const alphabet='!@#$%^&*',cache=new WeakMap();
function symbols(length,t,seed=0){let out='',previous=-1;const beat=Math.floor(t*9);
 for(let i=0;i<length;i++){
  let n=((Math.imul(i+1,173)+Math.imul(beat+1,311)+Math.imul(seed+7,67))^(Math.imul(i+3,beat+17)*29))>>>0;
  n%=alphabet.length;if(n===previous)n=(n+3)%alphabet.length;out+=alphabet[n];previous=n;
 }
 return out;
}
function paint(el,line,t,revealed=line.text.length,seed=0){
 const text=line.symbols?symbols(Math.min(revealed,line.text.length),t,seed):line.text.slice(0,revealed);
 let state=cache.get(el);if(!state||state.length!==text.length||state.nodes[0]?.parentNode!==el){
  el.replaceChildren();const nodes=[];for(let i=0;i<text.length;i++){const span=document.createElement('span');span.className='miku-voice-glyph';span.setAttribute('aria-hidden','true');el.append(span);nodes.push(span);}state={length:text.length,nodes};cache.set(el,state);
 }
 for(let i=0;i<state.nodes.length;i++){
  const n=state.nodes[i];if(n.textContent!==text[i])n.textContent=text[i];
  const x=Math.sin(t*31+i*2.71+seed)*1.15,y=Math.sin(t*39+i*1.77+seed)*1.65;
  n.style.transform=`translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
 }
 el.classList.add('miku-voice');
}
globalThis.MikuVoiceArt={alphabet,symbols,paint};
})();
