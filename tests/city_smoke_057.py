from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import mimetypes,json,base64
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  u=urlparse(r.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
  if u.hostname=='city057.test'and f.is_relative_to(ROOT)and f.is_file():r.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
  else:r.abort()
 p.route('**/*',route);p.goto('http://city057.test/index.html');p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);p.evaluate('''()=>{for(let t=0;t<3.6;t+=.02)tick(.02);while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}placeParty(TownData.id,TownData.spawn,TownData.companion);draw();}''');p.screenshot(path=str(ART/'smoke-city-entry.png'))
 for name in ['consumables','portal','quay','house1']:
  p.evaluate('''name=>{const q=TownData.waypoints[name];placeParty(TownData.id,{...q,dir:0},{x:q.x+45,y:q.y+65,dir:0});draw();}''',name);p.screenshot(path=str(ART/f'smoke-city-{name}.png'))
 p.evaluate('''()=>{placeParty(HomeData.id,HomeData.spawn,HomeData.companion);draw();}''');p.screenshot(path=str(ART/'smoke-home.png'));assert p.evaluate('SaveModel.valid(captureSnapshot())')
 data=p.evaluate('''()=>{const c=document.querySelector('#map');c.width=TownData.width;c.height=TownData.height;TownArt.draw(ctx,7,{x:0,y:0,width:TownData.width,height:TownData.height,overview:true},[{body:{...TownData.spawn},name:'teto_2'}],drawPerson,false);const out=document.createElement('canvas');out.width=1536;out.height=1024;out.getContext('2d').drawImage(c,0,0,1536,1024);return out.toDataURL().split(',')[1];}''');(ART/'smoke-city-overview.png').write_bytes(base64.b64decode(data))
 print(json.dumps(dict(errors=errors,home=p.evaluate('HomeArt.status()'),people=p.evaluate('TownPeople.status()'),trees=p.evaluate('TownData.trees.length'),perches=p.evaluate('TownArt.perches.length'),effects=p.evaluate('TownEffects.status(7)')),ensure_ascii=False));assert not errors,errors;b.close()
