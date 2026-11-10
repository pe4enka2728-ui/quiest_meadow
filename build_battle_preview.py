from pathlib import Path
import base64,json
r=Path(__file__).resolve().parent
html=(r/'battle-preview.html').read_text()
css=((r/'battle-preview.css').read_text()+'\n'+(r/'battle.css').read_text()).replace('assets/quiet-meadow-pixel.woff2','data:font/woff2;base64,'+base64.b64encode((r/'assets/quiet-meadow-pixel.woff2').read_bytes()).decode())
html=html.replace('<link rel="stylesheet" href="battle-preview.css">','<style>'+css+'</style>').replace('<link rel="stylesheet" href="battle.css">','')
html=html.replace('</head>','<script type="text/plain" id="font-license">'+(r/'assets/FONT_LICENSE.txt').read_text()+'</script></head>')
files=['battle-story-portraits','miku-animated','scenery-atlas','flower-idle','mesme_face_miku_egao','teto-face','teto-face-blink','teto-face-happy','teto-face-worried']+['teto_2_'+str(i) for i in range(12)]
assets={'assets/'+name+'.png':'data:image/png;base64,'+base64.b64encode((r/'assets'/str(name+'.png')).read_bytes()).decode() for name in files}
for module in ['pixel-ui.js','settings.js','miku-animation.js','flower-mob.js','backdrop-art.js','battle-markup.js','battle-story.js','battle-attacks.js','battle-rules.js','battle-roots.js','battle-attack-art.js','battle-end-art.js','battle.js']:
 html=html.replace('<script src="'+module+'"></script>','<script>'+(r/module).read_text()+'</script>')
js=(r/'battle-preview.js').read_text().replace('im.src=src','im.src=battleEmbeddedAssets[src]||src')
html=html.replace('<script src="battle-preview.js"></script>','<script>const battleEmbeddedAssets='+json.dumps(assets)+';\n'+js+'</script>')
assert '<script src=' not in html
path=r.parent/'Quiet-Meadow-Battle-UI-0.37.html';path.write_text(html)
print(path,path.stat().st_size)

# Reuse the exact embedded modules/assets and add only the training toolbar and styles.
training_source=(r/'attack-training.html').read_text()
body_open=training_source[training_source.index('<body'):training_source.index('<main')]
training=html.replace('<body><main',body_open+'<main').replace('</head>','<style>'+(r/'attack-training.css').read_text()+'</style></head>').replace('Тихая поляна — тест боя','Тихая поляна — семь атак цветка')
training_path=r.parent/'Quiet-Meadow-0.37-attack-training.html'
training_path.write_text(training)
(r/'attack-training-play.html').write_text(training)
print(training_path,training_path.stat().st_size)
