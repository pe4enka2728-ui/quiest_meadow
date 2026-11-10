"""Integrated 0.44 release QA: source assets and exact single-file offline build."""
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright
import json, mimetypes, sys

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'validation';ART.mkdir(exist_ok=True)
ACTIVE=[1,2,4,5,6,7,8,10,12,14,15,16,18,19,20]

def offline_document(page,external):
 # The managed browser forbids file:// navigation. Fulfil the exact delivered HTML in memory.
 url='http://offline-044.test/Quiet-Meadow-0.44.html'
 def route(req):
  if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.44.html'),content_type='text/html; charset=utf-8')
  else:external.append(req.request.url);req.abort()
 page.route('**/*',route);page.goto(url)

def steps(page,seconds):
 return page.evaluate('''seconds=>{for(let t=0;t<seconds-1e-8;t+=.025)BattleUI.update(Math.min(.025,seconds-t));BattleUI.draw();return BattleUI.status()}''',seconds)
def world(page,seconds):
 return page.evaluate('''seconds=>{for(let t=0;t<seconds-1e-8;t+=.025)tick(Math.min(.025,seconds-t));draw();return spawnStatus()}''',seconds)
def status(page):return page.evaluate('BattleUI.status()')
def bridge(page,config):return page.evaluate('c=>BattleUI.testing(c)',config)
def dialogue(page):
 page.evaluate('''()=>{for(let i=0;i<20&&BattleUI.status().phase==='conversation';i++)BattleUI.advanceStory();}''')

def finale(page):
 assert page.evaluate('MikuRupture.isActive&&HeartQuest.count===3')
 world(page,2.0);assert page.evaluate('DialogueUI.isOpen')
 assert page.locator('#dialogue-text').get_attribute('aria-label')=='Что происходит...'
 from features_v043 import dialogue_done
 dialogue_done(page)
 order=[]
 for name,seconds in [('vegetation',3.2),('decor',2.8),('echoes',2.2),('world',3.0)]:
  assert page.evaluate('MikuRupture.status().phase')==name
  world(page,seconds/2);opacity=page.evaluate('MikuRupture.status().opacity');assert .48<opacity[name]<.52
  world(page,seconds/2);order.append(name)
 assert page.evaluate('MikuRupture.status().phase')=='fall'
 world(page,3.4);assert 460<page.evaluate('MikuRupture.status().fall.y')<520
 page.screenshot(path=str(ART/'falling.png'))
 world(page,4.7)
 assert status(page)['encounter']=='miku' and status(page)['phase']=='conversation'
 assert status(page)['enemyHp'] is None
 dialogue(page);steps(page,1.0);assert status(page)['phase']=='enemy'
 checkpoint=page.evaluate('captureSnapshot()');assert checkpoint['activity']['type']=='miku-void'
 assert page.evaluate('SaveModel.valid(captureSnapshot())')
 page.evaluate('s=>restoreSnapshot(s)',checkpoint);assert status(page)['phase']=='conversation'
 dialogue(page);page.evaluate('DeveloperState.setGod(true)');steps(page,1.0)
 page.evaluate('BattleUI.endMikuTurn()');steps(page,1.2)
 copies=page.evaluate('SaveUI.status().count')
 bridge(page,{'enemyHp':14});page.evaluate('BattleUI.activate(0)');steps(page,.65)
 assert status(page)['phase']=='victory' and page.evaluate('HeartQuest.flags.mikuBossDefeated')
 assert page.evaluate('SaveUI.status().count')==copies+1
 won=page.evaluate('captureSnapshot()');assert page.evaluate('SaveModel.valid(captureSnapshot())')
 page.evaluate('s=>restoreSnapshot(s)',won)
 assert page.evaluate('HeartQuest.flags.mikuBossDefeated') and status(page)['phase']=='conversation'
 page.evaluate('DeveloperState.setGod(false)')
 # Developer rewind remains available from the actual battle and clears all cinematic state.
 page.evaluate('developerWarp(1)');assert not page.evaluate('BattleUI.isOpen||MikuRupture.isActive')
 assert page.evaluate('HeartQuest.count')==0
 return {'orderedFades':order,'fallAndDialogue':'PASS','arenaCheckpoint':'PASS','victorySaveAndChapter':'PASS','developerRewind':'PASS'}

def combat(page,label):
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate('BattleUI.open({id:"miku"})');s=status(page)
 assert s['phase']=='conversation' and s['enemyHp'] is None
 assert page.locator('#battle .enemy-bar').get_attribute('aria-hidden')=='true'
 assert s['story']['total']==6
 page.evaluate('BattleUI.advanceStory();BattleUI.advanceStory();BattleUI.advanceStory()')
 a=page.locator('#battle-story-text').inner_text();steps(page,.2);b=page.locator('#battle-story-text').inner_text();assert a!=b
 assert status(page)['enemyHp'] is None
 dialogue(page);s=status(page);assert s['enemyHp']==500 and s['phase']=='platform-in'
 assert [s['player']['u'],s['player']['v'],s['player']['jump']]==[.5,.5,0]
 page.evaluate('DeveloperState.setGod(true)')
 s=steps(page,1.0);assert s['phase']=='enemy'
 assert s['miku']['activeNumbers']==ACTIVE and s['miku']['passiveNumbers']==[3,17]
 assert page.locator('#battle .enemy-health').inner_text()=='HP 500 / 500'
 assert page.locator('#battle .miku-warp-backdrop').count()==1
 page.keyboard.down('d');s=steps(page,.25);page.keyboard.up('d');assert s['player']['u']>.55
 page.keyboard.press('Space');s=steps(page,.15);assert s['player']['z']>0 and s['player']['jump']>0
 frozen=status(page);page.evaluate('BattleUI.localPause(true)');steps(page,.6);paused=status(page)
 assert paused['clock']==frozen['clock'] and paused['attack']['time']==frozen['attack']['time']
 page.evaluate('BattleUI.localPause(false)')
 s=steps(page,s['attack']['duration']-s['attack']['time']+.1);assert s['phase']=='platform-out'
 s=steps(page,.45);assert .25<s['miku']['platformOpacity']<.75
 s=steps(page,.7);assert s['phase']=='command' and s['miku']['platformOpacity']==0
 assert not page.locator('#battle .battle-action').first.is_disabled()
 page.evaluate('BattleUI.activate(2)');assert status(page)['phase']=='command'
 bridge(page,{'mp':5});page.evaluate('BattleUI.activate(1)');assert status(page)['phase']=='command'
 page.evaluate('BattleUI.restoreStat("mp")');page.evaluate('BattleUI.activate(0)');s=steps(page,.65)
 assert s['enemyHp']==486 and s['phase']=='platform-in'
 assert s['player']['u']==s['player']['v']==.5 and s['player']['z']==0
 steps(page,1.0)
 # Full real host phases, including both passive effects. No laboratory controller is loaded.
 reports=[]
 for index,number in enumerate(ACTIVE):
  bridge(page,{'attack':index,'hp':100,'passives':{'double':'always','mines':'always'}})
  s=steps(page,3.3);assert s['attack']['number']==number
  assert all(s['attack']['passives'].values())
  if number in [1,7,18,19,20]:page.screenshot(path=str(ART/f'{label}-miku-{number:02}.png'))
  if number==7:
   assert page.evaluate('''()=>{const e=BattleUI.status().attack.entities.filter(e=>e.kind==='torus');const p=BattleUI.status().player;return e.length===3&&!MikuAttackArt.depthCommands(e,{x:(p.u-.5)*12,y:p.v*8,z:p.z}).some(c=>c.type==='edge'&&!Number.isFinite(c.depth));}''')
  s=steps(page,s['attack']['duration']-s['attack']['time']+1.25)
  assert s['phase']=='command' and s['hp']==100 and s['miku']['platformOpacity']==0,(number,s['phase'],s['hp'],s['miku']['platformOpacity'])
  reports.append(number)
 # Real collision damage, guard and developer healing flow through the host HP.
 rest=ACTIVE.index(12)
 page.evaluate('DeveloperState.setGod(false)')
 bridge(page,{'attack':rest,'hp':100,'player':{'u':.94,'v':.1},'passives':{'double':'never','mines':'never'}})
 s=steps(page,2.1);assert s['hp']==90,s
 assert s['damageEvents']>0 and s['invulnerableRemaining']>0
 page.evaluate('BattleUI.restoreStat("hp")');s=steps(page,.2);assert s['hp']==100
 page.evaluate('BattleUI.endMikuTurn()');steps(page,1.2);page.evaluate('BattleUI.activate(3)');steps(page,1.6)
 bridge(page,{'attack':rest,'hp':100,'player':{'u':.94,'v':.1},'passives':{'double':'never','mines':'never'}})
 s=steps(page,2.1);assert s['hp']==95,s
 # Win/lose conclude locally and never invoke the old flower reward or Gumi finale.
 bridge(page,{'attack':rest,'hp':1,'player':{'u':.94,'v':.1},'passives':{'double':'never','mines':'never'}})
 s=steps(page,2.1);assert s['phase']=='defeat' and s['hp']==0
 steps(page,1.5);assert status(page)['phase']=='result'
 page.locator('#battle-return').click();assert status(page)['encounter']=='miku' and status(page)['phase']=='conversation'
 page.evaluate('BattleUI.close();BattleUI.open({id:"miku",dialogue:[]});DeveloperState.setGod(true)')
 steps(page,1.0);page.evaluate('BattleUI.endMikuTurn()');steps(page,1.2)
 bridge(page,{'enemyHp':14});page.evaluate('BattleUI.activate(0)');s=steps(page,.65)
 assert s['enemyHp']==0 and s['phase']=='victory'
 steps(page,1.5);assert status(page)['phase']=='result'
 assert page.locator('#battle-result-title').inner_text()=='Мику затихла.'
 page.evaluate('BattleUI.close();DeveloperState.setGod(false)')
 # Previous encounters still use their original stats, rules and renderers.
 page.evaluate('BattleUI.open({id:"flower"})');dialogue(page);steps(page,1.3)
 assert status(page)['enemyHp']==150;page.evaluate('BattleUI.activate(0)');steps(page,1.0)
 assert status(page)['phase']=='enemy' and status(page)['attack'] is not None
 page.evaluate('BattleUI.close();BattleUI.open({id:"gumi"})');steps(page,1.3)
 assert status(page)['enemyHp']==300;page.evaluate('BattleUI.activate(0)');steps(page,1.0)
 assert status(page)['phase']=='enemy' and status(page)['attack'] is not None
 page.evaluate('BattleUI.close()')
 assert not errors,errors
 return {'active':reports,'passives':[3,17],'removed':[9,11,13],'new3D':[18,19,20],'movementJumpPause':'PASS','actionsDamageGuardHeal':'PASS','winLoseRetry':'PASS','legacyFlowerGumi':'PASS','errors':errors}

def launch(mode,full=False):
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1536,'height':1024})
  page.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0;')
  errors=[];external=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if mode=='source':
   def route(req):
    url=urlparse(req.request.url)
    path=(ROOT/unquote(url.path.lstrip('/') or 'index.html')).resolve()
    if url.hostname=='release-044.test' and path.is_relative_to(ROOT) and path.is_file():req.fulfill(path=str(path),content_type=mimetypes.guess_type(path.name)[0] or 'application/octet-stream')
    else:external.append(req.request.url);req.abort()
   page.route('**/*',route);page.goto('http://release-044.test/index.html')
  else:
   offline_document(page,external)
  page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready')
  assert page.evaluate('LevelData.version')=='0.44'
  report=combat(page,mode)
  if full:
   import features_v043, trials_v043, finale_v043
   features_v043.ART=ART;trials_v043.ART=ART;finale_v043.ART=ART;finale_v043.run=finale
   report['heartTrialsAndCinematic']=trials_v043.run(page)
  assert not external,external
  assert not errors,errors
  report['externalRequests']=external
  (ART/f'{mode}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
  print('PASS',mode,json.dumps(report,ensure_ascii=False),flush=True)
  if mode=='offline':
   # A normal animation loop, keyboard movement and actual Esc menu as a separate smoke check.
   live=browser.new_page(viewport={'width':1200,'height':800});live_errors=[]
   live.on('pageerror',lambda e:live_errors.append(str(e)))
   offline_document(live,external)
   live.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready')
   live.evaluate('BattleUI.open({id:"miku",dialogue:[]});DeveloperState.setGod(true)')
   live.wait_for_function('BattleUI.status().phase==="enemy"')
   initial=live.evaluate('BattleUI.status().player.u')
   live.keyboard.down('d');live.wait_for_timeout(250);live.keyboard.up('d')
   assert live.evaluate('BattleUI.status().player.u')>initial+.02
   live.keyboard.press('Space');live.wait_for_timeout(120);assert live.evaluate('BattleUI.status().player.z')>0
   live.keyboard.press('Escape');live.wait_for_timeout(50);frozen=live.evaluate('BattleUI.status().clock')
   live.wait_for_timeout(250);assert live.evaluate('BattleUI.status().clock')==frozen
   assert live.evaluate('PauseUI.isOpen');live.keyboard.press('Escape')
   live.evaluate('BattleUI.endMikuTurn()');live.wait_for_function('BattleUI.status().phase==="command"')
   live.wait_for_timeout(650);live.screenshot(path=str(ART/'release-ui.png'))
   assert not live_errors,live_errors
   assert not external,external
   report['liveAnimationMovementAndEsc']='PASS'
   (ART/f'{mode}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
   print('PASS live offline animation, keyboard jump/movement and actual pause menu; errors=[]',flush=True)
  browser.close()

if __name__=='__main__':launch(sys.argv[1] if len(sys.argv)>1 else 'source','--full' in sys.argv)
