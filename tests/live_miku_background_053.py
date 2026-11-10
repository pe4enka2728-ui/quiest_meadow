from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';url='http://miku-live053.test/'
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1280,'height':800});errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(req):
  if req.request.url==url:req.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
  else:external.append(req.request.url);req.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);p.evaluate('''()=>{developerWarp('5.4');if(DialogueUI.isOpen)DialogueUI.close(false);HeartQuest.cancel();MikuRupture.cancel();HeartQuest.reachBattle();BattleUI.open({id:'miku',dialogue:[]});DeveloperState.setGod(true);}''');p.wait_for_function('spawnStatus().battle.clock>1.2',polling=50,timeout=10000)
 first=p.locator('.miku-warp-backdrop').evaluate('(c)=>c.toDataURL()');p.wait_for_timeout(350);assert p.locator('.miku-warp-backdrop').evaluate('(c)=>c.toDataURL()')!=first;p.keyboard.press('Escape');frozen=p.evaluate('spawnStatus().battle.clock');image=p.locator('.miku-warp-backdrop').evaluate('(c)=>c.toDataURL()');p.wait_for_timeout(250);assert p.evaluate('spawnStatus().battle.clock')==frozen;p.set_viewport_size({'width':1920,'height':1080});assert p.locator('.miku-warp-backdrop').evaluate('(c)=>c.toDataURL()')==image;p.keyboard.press('Escape');p.wait_for_function('spawnStatus().battle.clock>'+str(frozen+.1),polling=50,timeout=10000);p.screenshot(path=str(ART/'live-miku-background.png'));assert not errors,errors;assert not external,external
 report={'realAnimationLoop':True,'backgroundAnimated':True,'pause':True,'resizeWhilePaused':True,'resume':True,'errors':errors,'externalRequests':external};(ART/'live-miku-background-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS live',json.dumps(report,ensure_ascii=False));b.close()
