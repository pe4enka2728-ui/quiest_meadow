"""Real doorway/rollback controller and new story integration. Screenshots only, no video."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from features_v040 import warp, dialogue_done, ticks, bridge
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT.parent

def world(page,seconds):
 return page.evaluate('''seconds=>{for(let t=0;t<seconds-1e-8;t+=.025)tick(Math.min(.025,seconds-t));draw();return spawnStatus()}''',seconds)
def restore(page,location,teto,miku,flags=None):
 page.evaluate('''p=>{const s=captureSnapshot();s.location=p.location;s.teto=p.teto;s.miku=p.miku;s.trail=[p.miku,p.teto];if(p.flags)Object.assign(s.flags,p.flags);restoreSnapshot(s);}''',{'location':location,'teto':teto,'miku':miku,'flags':flags})
def move(page,key,seconds):
 page.keyboard.down(key);state=world(page,seconds);page.keyboard.up(key);return state

def run(page):
 # Actual central exit after a won fight: no instant rear teleport, no extra roof doorway.
 warp(page,4)
 restore(page,'tent-hall',{'x':768,'y':-1840,'dir':2},{'x':768,'y':-1914,'dir':2})
 move(page,'s',.35);world(page,2)
 assert page.evaluate('spawnStatus().location')=='circus'
 world(page,4)
 assert page.evaluate('spawnStatus().location')=='circus' and not page.evaluate('spawnStatus().rearPassage.active')
 assert page.evaluate('spawnStatus().tentAppearance')=={'alpha':1,'rearDoor':False}
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-front-exit.png'))
 move(page,'w',.6);assert page.evaluate('TentJourney.status().phase')=='enter'
 world(page,5);assert page.evaluate('spawnStatus().location')=='tent-hall'
 # Roll back all the way before the flower, win again, obtain the real key and open the real gate.
 rollback=page.evaluate('''()=>{const s=DeveloperPresets.prepare(captureSnapshot(),1);s.wallet=ShopModel.fresh();Object.assign(s.flags,{flowerDefeated:false,flowerKeyClaimed:false});s.teto={x:730,y:-310,dir:0};s.miku={x:820,y:-310,dir:0};s.trail=[s.miku,s.teto];restoreSnapshot(s);return s;}''')
 assert not page.evaluate('TentJourney.status().entered||GumiEncounter.defeated||MikuHearts.released')
 page.keyboard.press('e');assert page.evaluate('BattleUI.isOpen')
 page.evaluate('''()=>{for(let i=0;i<20;i++)BattleUI.advanceStory();}''');ticks(page,1.2);bridge(page,{'enemyHp':1});page.evaluate('BattleUI.activate(0)');ticks(page,8)
 assert not page.evaluate('BattleUI.isOpen')
 world(page,1.4);dialogue_done(page);world(page,3)
 assert page.evaluate('ShopUI.captureState().inventory["golden-key"]')==1
 page.locator('#map').click(position={'x':768,'y':260});world(page,3)
 page.keyboard.press('e');assert page.evaluate('ForestGate.isActive');world(page,4)
 assert page.evaluate('ForestGate.isOpen')
 move(page,'w',4);world(page,3);assert page.evaluate('spawnStatus().location')=='circus'
 page.keyboard.press('e');assert page.evaluate('DialogueUI.isOpen');dialogue_done(page);world(page,18)
 assert page.evaluate('TentJourney.status().entered') and page.evaluate('spawnStatus().location')=='tent-arena'
 # Rear exit remains an independent entrance; holding toward it during cooldown works.
 warp(page,4);page.locator('#map').click(position={'x':768,'y':232});world(page,5)
 assert page.evaluate('spawnStatus().location')=='circus'
 move(page,'s',3.2);world(page,2)
 assert page.evaluate('spawnStatus().location')=='tent-arena'
 # Continue from a valid 0.36 back-side checkpoint. Distance restores the roof to full opacity.
 restore(page,'circus',{'x':768,'y':-1475,'dir':0},{'x':824,'y':-1430,'dir':0})
 assert page.evaluate('spawnStatus().tentAppearance.alpha')<.5
 move(page,'w',4);world(page,3)
 assert page.evaluate('spawnStatus().location')=='long-road'
 assert page.evaluate('spawnStatus().tentAppearance.alpha')==1
 move(page,'w',3.3)
 lag=page.evaluate('spawnStatus().miku.y-spawnStatus().teto.y');assert lag>140,lag
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-long-road.png'))
 move(page,'w',3.5);world(page,3);assert page.evaluate('spawnStatus().location')=='heart-crossroads'
 move(page,'w',2.5);world(page,.7)
 assert page.evaluate('MikuHearts.isActive&&DialogueUI.isOpen')
 assert page.evaluate('spawnStatus().teto.dir')==2
 dialogue_done(page);world(page,1.5);assert page.evaluate('DialogueUI.isOpen')
 assert 'не могу' in page.locator('#dialogue-text').get_attribute('aria-label')
 dialogue_done(page);world(page,1.8);assert page.evaluate('MikuHearts.status().phase')=='silence'
 world(page,1.8);assert page.evaluate('MikuHearts.status().phase')=='orbit'
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-three-hearts.png'))
 # Pause freezes both script position and orbit animation.
 page.keyboard.press('Escape');age=page.evaluate('MikuHearts.status().age');world(page,1);assert page.evaluate('MikuHearts.status().age')==age;page.keyboard.press('Escape')
 age=page.evaluate('MikuHearts.status().age');world(page,3.51-age);assert page.evaluate('MikuHearts.status().phase')=='scatter'
 world(page,.8);page.screenshot(path=str(ART/'Quiet-Meadow-0.40-hearts-scatter.png'))
 world(page,3);assert page.evaluate('MikuHearts.released&&DialogueUI.isOpen')
 old=page.evaluate('spawnStatus().teto.y');move(page,'w',.4);assert page.evaluate('spawnStatus().teto.y')==old
 dialogue_done(page);assert not page.evaluate('MikuHearts.isActive')
 assert page.evaluate('SaveModel.valid(captureSnapshot())')
 after=page.evaluate('captureSnapshot()');anchor=page.evaluate('spawnStatus().miku')
 move(page,'a',.9)
 assert page.evaluate('spawnStatus().miku.x')==anchor['x'] and page.evaluate('spawnStatus().miku.y')==anchor['y']
 assert not page.evaluate('MikuHearts.isActive')
 # Backtracking does not pull Miku off the crossroads or deadlock transitions waiting for her.
 page.locator('#map').click(position={'x':768,'y':970});world(page,7)
 assert page.evaluate('spawnStatus().location')=='long-road'
 assert page.evaluate('spawnStatus().miku.y')==anchor['y']
 assert page.evaluate('SaveModel.valid(captureSnapshot())')
 page.evaluate('s=>restoreSnapshot(s)',after);page.keyboard.press('e');assert page.evaluate('DialogueUI.isOpen')
 assert 'не отвечает' in page.locator('#dialogue-text').get_attribute('aria-label')
 dialogue_done(page);assert page.evaluate('SaveUI.saveNow("Три сердца Мику").ok')
 page.reload();page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready')
 assert page.evaluate('MikuHearts.released&&!MikuHearts.isActive&&!spawnStatus().intro.active')
 assert page.evaluate('spawnStatus().location')=='heart-crossroads'
 assert page.evaluate('spawnStatus().miku.y')==anchor['y']
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-crossroads.png'))
 page.evaluate('s=>restoreSnapshot(s)',rollback);assert not page.evaluate('MikuHearts.released||TentJourney.status().entered||GumiEncounter.defeated')
 # Warping during a live story conversation cancels its delayed transitions.
 warp(page,4);restore(page,'heart-crossroads',{'x':768,'y':-3095,'dir':0},{'x':768,'y':-2810,'dir':0});world(page,1)
 assert page.evaluate('MikuHearts.isActive&&DialogueUI.isOpen')
 warp(page,1);page.evaluate('MikuHearts.update(30)');world(page,1)
 assert not page.evaluate('MikuHearts.isActive||MikuHearts.released||DialogueUI.isOpen')
 page.evaluate('s=>restoreSnapshot(s)',after);page.evaluate('startNewGame()');assert not page.evaluate('MikuHearts.released||GumiEncounter.defeated||TentJourney.status().entered');assert not page.evaluate('ShopUI.captureState().inventory["gumi-wand"]')
 return {'frontExit':'stable','rollback':'flower-to-tent PASS','roof':'distance restores opacity','story':'three hearts PASS','saveReload':'waiting Miku preserved','minigames':'tested in trials_v040'}

if __name__=='__main__':
 import sys,json
 offline='--offline' in sys.argv
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1536,'height':1024});page.add_init_script('window.__QM_TEST__=true');errors=[];external=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if offline:
   html=(ROOT/'play.html').read_text()
   def route(req):
    if req.request.url=='http://offline.quiet-meadow.test/play.html':req.fulfill(status=200,content_type='text/html; charset=utf-8',body=html)
    else:external.append(req.request.url);req.abort()
   page.route('**/*',route);page.goto('http://offline.quiet-meadow.test/play.html')
  else:page.goto('http://127.0.0.1:8884/index.html')
  page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready');result=run(page);assert not errors,errors;assert not external,external;print('PASS STORY '+('OFFLINE' if offline else 'SOURCE'),json.dumps(result,ensure_ascii=False));b.close()
