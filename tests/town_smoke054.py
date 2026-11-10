from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.requestAnimationFrame=()=>0');errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  u=urlparse(r.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
  if u.hostname=='town054.test'and f.is_relative_to(ROOT)and f.is_file():r.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
  else:r.abort()
 p.route('**/*',route);p.goto('http://town054.test/index.html');p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);p.evaluate('''()=>{for(let t=0;t<3.5;t+=.02)tick(.02);while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}draw();}''');assert p.evaluate('spawnStatus().location')=='meadow'
 p.keyboard.down('s');p.evaluate('''()=>{for(let t=0;t<2.8;t+=.02)tick(.02);draw();}''');p.keyboard.up('s');print('after south',p.evaluate('({location:spawnStatus().location,hero:spawnStatus().teto,passage:spawnStatus().townPassage})'))
 p.evaluate('''()=>{for(let t=0;t<1.1;t+=.02)tick(.02);draw();}''');assert p.evaluate('spawnStatus().location')=='starter-town';p.screenshot(path=str(ART/'town-entry.png'))
 for name in ['consumables','fountain','portal','pier','guild']:
  p.evaluate('''name=>{const q=TownData.waypoints[name];placeParty(TownData.id,{...q,dir:0},{x:q.x+54,y:q.y+66,dir:0});draw();}''',name);p.screenshot(path=str(ART/f'town-{name}.png'))
 print('status',p.evaluate('JSON.stringify({camera:spawnStatus().camera,town:spawnStatus().town,valid:SaveModel.valid(captureSnapshot())})'));print('errors',errors);assert not errors,errors;b.close()
