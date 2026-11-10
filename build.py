from pathlib import Path
import base64,json,io,concurrent.futures
from PIL import Image
r=Path(__file__).parent
# Keep source PNGs untouched; embed smaller lossless WebP only when every RGBA byte matches.
def encode_asset(p):
 raw=p.read_bytes();encoded=raw;mime='image/png'
 if len(raw)>=50000:
  with Image.open(io.BytesIO(raw)) as im:
   rgba=im.convert('RGBA');out=io.BytesIO();im.save(out,format='WEBP',lossless=True,quality=100,method=4,exact=True);candidate=out.getvalue()
   with Image.open(io.BytesIO(candidate)) as check:assert check.convert('RGBA').tobytes()==rgba.tobytes(),p.name
   if len(candidate)<len(raw):encoded=candidate;mime='image/webp'
 return str(p.relative_to(r)),'data:'+mime+';base64,'+base64.b64encode(encoded).decode(),{'name':p.name,'sourceBytes':len(raw),'embeddedBytes':len(encoded),'mime':mime,'pixelsIdentical':True}
paths=[p for p in (r/'assets').glob('*.png') if p.name not in ['ground-05.png','crystal-clean.png','town-ground.png']]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:encoded=list(pool.map(encode_asset,paths))
assets={key:uri for key,uri,info in encoded}
(r/'build-assets.json').write_text(json.dumps([info for key,uri,info in encoded],indent=2))

css=((r/'style.css').read_text()+'\n'+(r/'battle.css').read_text()+'\n'+(r/'developer.css').read_text()+'\n'+(r/'inventory.css').read_text()+'\n'+(r/'shop-layout.css').read_text()+'\n'+(r/'battle-skills.css').read_text()+'\n'+(r/'skill-games.css').read_text()+'\n'+(r/'guild-board.css').read_text()+'\n'+(r/'battle-hero-effects.css').read_text()+'\n'+(r/'neru-battle.css').read_text()).replace('assets/quiet-meadow-pixel.woff2','data:font/woff2;base64,'+base64.b64encode((r/'assets/quiet-meadow-pixel.woff2').read_bytes()).decode())
html=(r/'index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>').replace('<link rel="stylesheet" href="battle.css">','').replace('<link rel="stylesheet" href="developer.css">','').replace('<link rel="stylesheet" href="inventory.css">','').replace('<link rel="stylesheet" href="shop-layout.css">','').replace('<link rel="stylesheet" href="battle-skills.css">','').replace('<link rel="stylesheet" href="skill-games.css">','').replace('<link rel="stylesheet" href="guild-board.css">','').replace('<link rel="stylesheet" href="battle-hero-effects.css">','').replace('<link rel="stylesheet" href="neru-battle.css">','')
html=html.replace('</head>','<script type="text/plain" id="font-license">'+(r/'assets/FONT_LICENSE.txt').read_text()+'</script></head>')
html=html.replace('<script src="cloud-world-data.js"></script>','<script>'+(r/'cloud-world-data.js').read_text()+'</script>')
html=html.replace('<script src="world.js"></script>','<script>'+(r/'world.js').read_text()+'</script>')
for module in ['town-data.js','home-data.js','town-effects.js','town-people.js','party-follower.js','town-people-art.js','home-art.js','town-terrain.js','town-art.js','level.js','forest-data.js','circus-data.js','tent-portals.js','heart-road-data.js','heart-quest-model.js','heart-games-model.js','heart-trials-data.js','heart-trials-model.js','interior-data.js','curtain-progress.js','gate-model.js','backdrop-data.js','camera.js','actors.js','arch-art.js','actor-sprite-art.js','miku-rig-data.js','prepared-miku-art.js','neru-rig-data.js','prepared-neru-art.js','neru-scene-model.js','scene.js','rock-art.js','forest-art.js','backdrop-art.js','gumi-sprite.js','gumi-puppet.js','gumi-portrait.js','circus-stars.js','curtain-geometry.js','stage-exit-art.js','curtain-art.js','circus-spotlights.js','interior-art.js','circus-art.js','heart-road-art.js','forest-gate.js','trail-art.js','flower-mob.js','shop-model.js','loadout-combat-model.js','skill-games-model.js','skill-games-art.js','skill-games-ui.js','pixel-ui.js','shop-item-art.js','inventory-art.js','inventory.js','shop.js','dialogue-model.js','miku-animation.js','dialogue.js','guild-orders-model.js','guild-board-art.js','guild-board.js','save-model.js','chapter-lock-art.js','saves.js','chapter-model.js','chapter-ui.js','settings.js','pause.js','battle-markup.js','battle-story.js','battle-attacks.js','gumi-attacks.js','battle-rules.js','gumi-arena-model.js','gumi-attacks-v2.js','gumi-finale-model.js','gumi-charge-model.js','combat-damage-v2.js','battle-roots.js','battle-attack-art.js','battle-end-art.js','gumi-battle-art.js','miku-animated-background.js','miku-backdrop-art.js','miku-attacks-model.js','miku-combat-model.js','miku-attacks-art.js','miku-turn-model.js','miku-battle-dialogue.js','miku-voice-art.js','miku-battle-art.js','battle-skills-ui.js','battle-hero-effects.js','neru-arena-model.js','neru-attack-geometry.js','neru-attacks-model.js','neru-combat-model.js','neru-battle-art.js','neru-attacks-art.js','battle.js','world-outcome.js','gumi-gift.js','gumi-encounter.js','respawn-model.js','death-return.js','tent-journey.js','miku-hearts-model.js','miku-hearts.js','developer-presets.js','developer-commands.js','developer-ui.js','heart-games-art.js','heart-games.js','heart-trials-art.js','heart-quest.js','birds.js','miku-rupture-model.js','miku-rupture.js','heart-corruption.js','miku-aftermath-model.js','portal-art.js','cloud-world-art.js','miku-aftermath.js','neru-encounter.js']:
 html=html.replace('<script src="'+module+'"></script>','<script>'+(r/module).read_text()+'</script>')
js=(r/'map.js').read_text().replace('im.src=src','im.src=embeddedAssets[src]||src')
html=html.replace('<script src="map.js"></script>','<script>const embeddedAssets='+json.dumps(assets)+';\n'+js+'</script>')
(r/'play.html').write_text(html)
print('Single-file build:',len(html),'characters')
