"""Build only the reviewable effect preview. This does not package a game release."""
from pathlib import Path
import base64,json
r=Path(__file__).resolve().parent
modules=['actor-sprite-art.js','miku-rig-data.js','prepared-miku-art.js','pixel-ui.js',
 'rock-art.js','backdrop-art.js','battle-markup.js','battle-story.js','battle-attacks.js',
 'battle-rules.js','battle-roots.js','battle-attack-art.js','battle-end-art.js',
 'miku-animated-background.js','miku-backdrop-art.js','miku-attacks-model.js','miku-combat-model.js','miku-attacks-art.js','miku-turn-model.js','miku-battle-dialogue.js','miku-voice-art.js','miku-battle-art.js','battle.js']
files={'battleStoryPortraits':'battle-story-portraits.png','sceneryAtlas':'scenery-atlas.png',
 'mikuPreparedNormal':'miku-parts.png','mikuPreparedInsane':'miku-insane-parts.png'}
files.update({f'teto_2_{i}':f'teto_2_{i}.png' for i in range(12)})
assets={name:'data:image/png;base64,'+base64.b64encode((r/'assets'/file).read_bytes()).decode() for name,file in files.items()}
font='data:font/woff2;base64,'+base64.b64encode((r/'assets/quiet-meadow-pixel.woff2').read_bytes()).decode()
css=(r/'battle-preview.css').read_text().replace('assets/quiet-meadow-pixel.woff2',font)+'\n'+(r/'battle.css').read_text()
css+='''
html,body{background:#000}body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
#battle-preview-host{width:min(100vw,calc((100dvh - 68px)*1.5));height:min(calc(100dvh - 68px),66.666667vw);flex:none}
.preview-tools{height:40px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 12px;font:14px QuietMeadowPixel,monospace;color:#a9a1b4}
.preview-tools button{font:inherit;color:#ddd6e7;border:1px solid #44324e;background:#100b16;border-radius:3px;padding:8px 12px;cursor:pointer}
.preview-tools button:disabled{opacity:.3;cursor:default}.preview-tools button:focus-visible{outline:2px solid #a37aca;outline-offset:2px}
@media(max-width:700px){.preview-tools{gap:5px;font-size:11px;padding:0 5px}.preview-tools button{padding:8px}.preview-tools span{display:none}}
'''
html='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Мику · черновой просмотр фона</title><style>'''+css+'''</style></head><body><main id="battle-preview-host"></main><nav class="preview-tools" aria-label="Просмотр эффекта"><span>ЧЕРНОВИК</span><button id="preview-pause">Пауза</button><button id="preview-start">Начать ход Мику</button><button id="preview-end">Завершить ход</button><button id="preview-dialogue">Диалог</button><button id="preview-reset">Сначала</button></nav>'''
for name in modules:html+='<script>'+ (r/name).read_text()+'</script>'
html+='<script>const previewAssets='+json.dumps(assets)+';\n'+'''
(()=>{
 const images={};let manual=false,last=0,ready=false;
 async function init(){await document.fonts.load('24px QuietMeadowPixel');await Promise.all(Object.entries(previewAssets).map(async([k,src])=>{const im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=src});images[k]=im;}));PreparedMikuArt.init(images);BattleUI.init(images);BattleUI.open({id:'miku'});ready=true;requestAnimationFrame(frame);}
 function controls(){const s=BattleUI.status();document.querySelector('#preview-start').disabled=!s.miku.canAct||s.localPaused;document.querySelector('#preview-end').disabled=!s.miku.movable||s.localPaused;document.querySelector('#preview-pause').textContent=s.localPaused?'Продолжить':'Пауза';}
 function frame(ts){const dt=Math.min((ts-last)/1000||0,.04);last=ts;if(!manual)BattleUI.update(dt);BattleUI.draw();controls();requestAnimationFrame(frame);}
 document.querySelector('#preview-dialogue').onclick=()=>BattleUI.open({id:'miku'});
 document.querySelector('#preview-start').onclick=()=>BattleUI.beginMikuTurn();document.querySelector('#preview-end').onclick=()=>BattleUI.endMikuTurn();document.querySelector('#preview-pause').onclick=()=>BattleUI.localPause(!BattleUI.status().localPaused);document.querySelector('#preview-reset').onclick=()=>BattleUI.open({id:'miku'});
 window.addEventListener('keydown',e=>BattleUI.handleKey(e));window.addEventListener('keyup',e=>BattleUI.keyUp(e));window.addEventListener('blur',()=>BattleUI.clearKeys());
 window.mikuPreview={get ready(){return ready},freeze(){manual=true;},step(dt){manual=true;for(let t=0;t<dt-1e-8;t+=.025)BattleUI.update(Math.min(.025,dt-t));BattleUI.draw();controls();return BattleUI.status();},resume(){manual=false;},reset(){BattleUI.open({id:'miku'});}};init();
})();
'''+ '</script></body></html>'
dest=r.parent/'Miku-battle-start-preview.html';dest.write_text(html)
print(f'Effect preview only: {dest} ({dest.stat().st_size:,} bytes)')
