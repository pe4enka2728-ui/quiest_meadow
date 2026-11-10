"""Real animation-loop check of celestial dialogue and the cloud encounter."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1200,'height':800});errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://live052.test/Quiet-Meadow-0.52.html'
 def route(req):
  if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.52.html'),content_type='text/html; charset=utf-8')
  else:external.append(req.request.url);req.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50)
 p.evaluate('developerWarp(6);Object.assign(teto,{x:790,y:585,dir:0});interact()');p.wait_for_function('NeruEncounter.status().clock>2',polling=50);assert p.evaluate('NeruEncounter.status().night')>.2;p.screenshot(path=str(ART/'live-neru-dialogue.png'))
 p.evaluate('for(let i=0;i<30&&DialogueUI.isOpen;i++){DialogueUI.finishText();DialogueUI.choose(0);}');p.wait_for_function('BattleUI.isOpen&&BattleUI.status().encounter==="neru"',polling=50,timeout=12000);p.wait_for_function('BattleUI.status().clock>1.4',polling=50,timeout=10000);p.screenshot(path=str(ART/'live-neru-enemy.png'))
 p.wait_for_function('BattleUI.status().phase==="command"',polling=50,timeout=15000);p.wait_for_function('!document.querySelector("[data-action=attack]").disabled',polling=50);assert p.evaluate('BattleUI.status().mp')==5;p.screenshot(path=str(ART/'live-neru-command.png'));p.keyboard.press('1');assert p.locator('#battle-skills').is_visible()
 p.keyboard.press('Escape');p.keyboard.press('Escape');assert p.evaluate('PauseUI.isOpen');clock=p.evaluate('BattleUI.status().clock');p.wait_for_timeout(350);assert p.evaluate('BattleUI.status().clock')==clock;p.locator('#pause-exit').click();assert p.evaluate('PauseUI.status().view')=='title';p.locator('#title-continue').click();p.wait_for_function('BattleUI.isOpen&&BattleUI.status().encounter==="neru"',polling=50);assert p.evaluate('SaveModel.valid(captureSnapshot())')
 assert not errors,errors;assert not external,external;report={'realAnimationLoop':True,'dialogueSkyMoves':True,'automaticBattleEntry':True,'sixSecondEmptyTurn':True,'sharedSkills':True,'pauseAndTitleResume':True,'responsiveViewport':[1200,800],'errors':errors,'externalRequests':external};(ART/'live-neru-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS live',json.dumps(report,ensure_ascii=False));b.close()
