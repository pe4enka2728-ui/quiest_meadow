"""Normal animation loop: actual victory through portal and arrival."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1200,'height':800});p.add_init_script('window.__QM_TEST__=true');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://livepost049.test/Quiet-Meadow-0.49.html'
 def route(req):
  if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.49.html'),content_type='text/html; charset=utf-8')
  else:external.append(req.request.url);req.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50)
 p.evaluate('''()=>{developerWarp('5.4');if(DialogueUI.isOpen)DialogueUI.close(false);HeartQuest.cancel();MikuRupture.cancel();HeartQuest.reachBattle();BattleUI.open({id:'miku',dialogue:[]});DeveloperState.setGod(true);}''')
 p.wait_for_function('BattleUI.status().phase==="enemy"',polling=30);p.evaluate('BattleUI.endMikuTurn()');p.wait_for_function('BattleUI.status().phase==="command"',polling=30);p.evaluate('BattleUI.testing({enemyHp:1,castRoll:.5});BattleUI.restoreStat("mp");BattleUI.activate(0);BattleUI.castSkill("pulse")')
 def phase(name,timeout=16000):p.wait_for_function('s=>MikuAftermath.status().phase===s',arg=name,timeout=timeout,polling=30)
 def done():p.evaluate('''()=>{for(let i=0;i<24&&DialogueUI.isOpen;i++){DialogueUI.finishText();DialogueUI.choose(0)}}''')
 phase('recovery');p.keyboard.press('Escape');p.locator('#pause-exit').click();assert p.evaluate('PauseUI.status().view')=='title';frozen=p.evaluate('MikuAftermath.status().clock');p.wait_for_timeout(200);assert p.evaluate('MikuAftermath.status().clock')==frozen;p.locator('#title-continue').click();p.wait_for_function('DialogueUI.isOpen',polling=50);done();phase('portal-talk');done();phase('pull')
 p.wait_for_function('MikuAftermath.status().age>.5',polling=30);p.screenshot(path=str(ART/'live-portal.png'));p.keyboard.press('Escape');frozen=p.evaluate('MikuAftermath.status()');p.wait_for_timeout(250);assert p.evaluate('MikuAftermath.status()')==frozen;p.keyboard.press('Escape');phase('hypnosis');phase('pan',timeout=12000);phase('sky-open');phase('fall');p.wait_for_function('MikuAftermath.status().age>.6',polling=30);p.screenshot(path=str(ART/'live-cloud-fall.png'));phase('arrival');done();assert p.evaluate('spawnStatus().location')=='cloud-island';p.wait_for_timeout(200);p.screenshot(path=str(ART/'live-cloud-island.png'))
 s=p.evaluate('captureSnapshot()');assert p.evaluate('SaveModel.valid(captureSnapshot())');p.keyboard.down('d');p.wait_for_timeout(650);p.keyboard.up('d');moved=p.evaluate('spawnStatus()');assert moved['teto']['x']>s['teto']['x']+30;assert p.evaluate('!SpawnWorld.blocked(teto.x,teto.y)&&!SpawnWorld.blocked(miku.x,miku.y)')
 p.evaluate('s=>restoreSnapshot(s)',s);assert p.evaluate('spawnStatus().location')=='cloud-island';assert not errors,errors;assert not external,external
 report={'normalAnimation':'PASS','victoryToCloud':'PASS','titleExitResume':'PASS','pausePreservesScene':True,'bothFall':True,'cloudMovementAndFollowing':True,'saveLoad':True,'errors':errors,'externalRequests':external};(ART/'live-post-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS LIVE',json.dumps(report,ensure_ascii=False),flush=True);b.close()
