from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';url='http://capture-town054.test/'
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.requestAnimationFrame=()=>0');errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.route('**/*',lambda r:r.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')if r.request.url==url else r.abort());p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000)
 p.evaluate('''()=>{for(let t=0;t<3.6;t+=.02)tick(.02);while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}placeParty(TownData.id,TownData.spawn,TownData.companion);for(let t=0;t<4;t+=.02)tick(.02);draw();}''')
 for debug,name in [(False,'town-overview'),(True,'town-collider-overview')]:
  data=p.evaluate('''debug=>{const c=document.querySelector('#map'),old={w:c.width,h:c.height},actors=[{body:teto,name:'teto_2'},{body:miku,name:'mesme_miku_1'}];c.width=TownData.width;c.height=TownData.height;TownArt.draw(ctx,time,{x:0,y:0},actors,drawPerson,debug);for(const [x,y]of [[1536,0],[0,1024],[1536,1024]]){ctx.save();WorldBirds.drawLocal(ctx,time,y,TownArt.perches,x);ctx.restore();}const out=document.createElement('canvas');out.width=1536;out.height=1024;const g=out.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,1536,1024);const result=out.toDataURL();c.width=old.w;c.height=old.h;draw();return result;}''',debug)
  (ART/f'{name}.png').write_bytes(base64.b64decode(data.split(',')[1]))
 assert not errors,errors;report={'overviewFromGameRenderer':True,'colliderCount':p.evaluate('TownData.colliders.length'),'pixelScale':2,'sourceArtSize':[1536,1024],'worldSize':[3072,2048],'errors':errors};(ART/'town-art-report.json').write_text(json.dumps(report,indent=2));print('PASS capture',report);b.close()
