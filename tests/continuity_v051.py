"""Keep the actual Miku victory-to-cloud route and all three previous fights working."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
from post_miku_v049 import run as after_miku
from release_v047 import combat
import json,mimetypes
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(req):
  u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
  if u.hostname=='continuity051.test' and f.is_relative_to(ROOT) and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
  else:external.append(req.request.url);req.abort()
 p.route('**/*',route);p.goto('http://continuity051.test/index.html');p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50)
 result={'mikuToCloud':after_miku(p,'continuity051')}
 # The older combat suite expects the ten offensive skills equipped by its inventory setup.
 p.evaluate('''()=>{const w=ShopModel.fresh();w.gold=10000;const items=ShopModel.goods.filter(i=>i.kind==='ability'&&i.hits>0).slice(0,10);for(const i of items)ShopModel.buy(w,i.id);w.loadout.abilities=items.map(i=>i.id);ShopUI.restoreState(w);}''')
 result['previousFights']=combat(p,'continuity051');assert not errors,errors;assert not external,external;result.update(errors=errors,externalRequests=external);(ART/'continuity-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('PASS continuity',json.dumps(result,ensure_ascii=False));b.close()
