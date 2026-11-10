/* Preferences are global; loading a checkpoint never changes them. */
(()=>{
const key='smile-settings-v1',media=new Set(),gains=new Set();let volume=100,extraHints=false;
try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(Number.isFinite(raw?.volume))volume=Math.max(0,Math.min(100,Math.round(raw.volume)));extraHints=raw?.extraHints===true}catch{}
function persist(){try{localStorage.setItem(key,JSON.stringify({version:1,volume,extraHints}));return true}catch{return false}}
function apply(){for(const player of new Set([...media,...document.querySelectorAll('audio,video')]))player.volume=volume/100;for(const gain of gains)gain.gain.value=volume/100}
globalThis.GameSettings={get extraHints(){return extraHints},setExtraHints(value){extraHints=!!value;return persist()}};
globalThis.GameAudio={get volume(){return volume},setVolume(value){if(!Number.isFinite(Number(value)))return false;volume=Math.max(0,Math.min(100,Math.round(Number(value))));apply();return persist()},register(player){media.add(player);player.volume=volume/100;return ()=>media.delete(player)},registerGain(node){gains.add(node);node.gain.value=volume/100;return ()=>gains.delete(node)}};
})();
