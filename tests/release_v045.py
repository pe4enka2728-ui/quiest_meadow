"""0.45: inventory/store/loadout and shared player combat in source and embedded builds."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';ART.mkdir(exist_ok=True)
def steps(page,seconds):return page.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.025)BattleUI.update(Math.min(.025,s-t));BattleUI.draw();return BattleUI.status()}''',seconds)
def world(page,seconds):return page.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.025)tick(Math.min(.025,s-t));draw();return spawnStatus()}''',seconds)
def status(page):return page.evaluate('BattleUI.status()')
def bridge(page,c):return page.evaluate('c=>BattleUI.testing(c)',c)
def story(page):page.evaluate('''()=>{for(let i=0;i<20&&BattleUI.status().phase==='conversation';i++)BattleUI.advanceStory();}''')
def cast(page,id):
 result=page.evaluate('id=>BattleUI.castSkill(id)',id);assert result['ok'],result;steps(page,.45);return result

def inventory(page,label):
 page.evaluate('developerWarp(1);ShopUI.addMoney(5000);ShopUI.open()')
 assert 'Способности' in page.locator('#shop-list').inner_text()
 page.locator('#shop-list .category-row').nth(0).click();page.locator('#shop-list .goods-row').first.click()
 assert 'Клинок решимости' in page.locator('#shop-item-title').inner_text()
 page.locator('#shop-replies [data-shortcut="4"]').click();page.evaluate('ShopUI.update(1.5)')
 assert page.evaluate('ShopUI.captureState().inventory.ribbon')==1
 page.screenshot(path=str(ART/(label+'-shop.png')))
 page.evaluate('ShopUI.close();const w=ShopUI.captureState();for(const i of ShopModel.goods)ShopModel.buy(w,i.id);ShopUI.restoreState(w)')
 page.keyboard.press('i');assert page.evaluate('InventoryUI.isOpen')
 assert page.locator('#world-inventory').is_hidden()
 for slot,id in [('weapon','rift-blade'),('armor','chorus-vest'),('amulet','charm')]:
  page.locator('.equipment-slot[data-slot="'+slot+'"]').click();assert page.locator('#inventory-list [data-item="golden-key"]').count()==0
  page.locator('#inventory-list [data-item="'+id+'"]').click()
 assert page.evaluate('ShopModel.stats(ShopUI.captureState())')=={'damage':27,'weaponDamage':13,'maxHp':140,'maxMp':40,'critBonus':0,'mpPerTurn':5}
 page.evaluate('InventoryUI.update(1)');a=page.locator('#inventory-teto').evaluate('c=>c.toDataURL()');page.evaluate('InventoryUI.update(.5)');b=page.locator('#inventory-teto').evaluate('c=>c.toDataURL()');assert a!=b
 page.wait_for_timeout(100);page.screenshot(path=str(ART/(label+'-equipment.png')))
 assert page.locator('#inventory-abilities-tab').inner_text()==''
 page.locator('#inventory-abilities-tab').click()
 ids=page.evaluate('ShopModel.attacks.map(a=>a.id)')
 for i,id in enumerate(ids):
  page.locator('[data-ability-slot="'+str(i)+'"]').click();page.locator('#inventory-list [data-item="'+id+'"]').click()
 page.locator('[data-ability-slot="0"]').click();assert page.locator('#inventory-list [data-item="thorn-note"]').is_disabled()
 assert page.locator('#inventory-list [data-item="thorn-note"]').evaluate('b=>getComputedStyle(b).filter')=='grayscale(1)'
 assert page.locator('.ability-slot').count()==10
 assert page.locator('.equipment-slot').evaluate_all('buttons=>buttons.every(b=>b.innerText==="")')
 page.evaluate('InventoryUI.update(.7)');page.wait_for_timeout(650);page.screenshot(path=str(ART/(label+'-abilities.png')))
 before=page.evaluate('ShopUI.captureState()');snapshot=page.evaluate('captureSnapshot()');assert page.evaluate('SaveModel.valid(captureSnapshot())')
 assert page.evaluate('SaveUI.saveNow("Снаряжение Тето").ok')
 page.keyboard.press('Escape');assert not page.evaluate('InventoryUI.isOpen')
 page.evaluate('ShopUI.equip("weapon",null)');page.evaluate('s=>restoreSnapshot(s)',snapshot)
 assert page.evaluate('ShopUI.captureState()')==before
 page.keyboard.press('8');assert page.evaluate('InventoryUI.isOpen');page.keyboard.press('8');assert not page.evaluate('InventoryUI.isOpen')
 assert len(set(before['loadout']['abilities']))==10
 # Old 0.44 wallets retain purchased items and receive a valid initial ability/loadout.
 old={**snapshot,'gameVersion':'0.44','wallet':{'version':1,'gold':66,'inventory':{'ribbon':1,'herbal':2,'pulse':1}}}
 page.evaluate('s=>restoreSnapshot(s)',old)
 assert page.evaluate('ShopUI.captureState().inventory.herbal')==2
 assert page.evaluate('ShopUI.captureState().loadout.abilities[0]')=='pulse'
 page.evaluate('s=>restoreSnapshot(s)',snapshot)
 return {'slots':3,'abilitySlots':10,'catalogueAbilities':10,'equipment':[3,3,3],'twoPoisons':True,'duplicatesGrey':'PASS','saveRestore':'PASS','legacyWallet':'PASS','keyboardI8':'PASS'}

def start(page,encounter):
 page.evaluate('id=>{BattleUI.close();BattleUI.open({id});DeveloperState.setGod(true)}',encounter)
 assert status(page)['open'],('not opened',encounter,status(page));story(page);steps(page,1.25);assert status(page)['open'],('closed after story',encounter,status(page))
 if encounter=='miku':page.evaluate('BattleUI.endMikuTurn()');steps(page,1.2)
 bridge(page,{'castRoll':.5});assert status(page)['heroStats']['maxHp']==140 and status(page)['heroStats']['maxMp']==40
 assert status(page)['hp']==140 and status(page)['mp']==40
 page.evaluate('BattleUI.activate(0)');assert status(page)['skillMenu']
 assert page.locator('#battle-actions .battle-action').count()==3
 assert page.locator('#battle-actions [data-action="magic"]').count()==0
 assert page.locator('#battle-actions [data-action="attack"] strong').inner_text()=='Продолжить'

def combat(page,label):
 results={}
 for encounter in ['flower','gumi','miku']:
  start(page,encounter);initial=status(page)['enemyHp'];phase=status(page)['phase']
  first=cast(page,'pulse');second=cast(page,'thorn-note');third=cast(page,'wormwood');s=status(page)
  assert s['mp']==25 and s['enemyHp']==initial-first['damage']-second['damage']-third['damage']
  assert s['phase']==phase and len(s['abilities']['poisons'])==2
  old_mp=s['mp'];bridge(page,{'mp':2});page.evaluate('BattleUI.draw()');assert page.locator('#battle-skill-grid [data-skill="dawn-chorus"]').is_disabled()
  assert not page.evaluate('BattleUI.castSkill("dawn-chorus").ok');bridge(page,{'mp':old_mp})
  if encounter=='flower':
   page.evaluate('BattleUI.activate(1)');assert status(page)['skillMode']=='items'
   qty=page.evaluate('ShopUI.captureState().inventory.herbal');assert not page.evaluate('BattleUI.castSkill("herbal").ok');assert page.evaluate('ShopUI.captureState().inventory.herbal')==qty
   bridge(page,{'hp':100});cast(page,'herbal');assert status(page)['hp']==135
   cast(page,'mint');assert status(page)['mp']==37
   page.locator('#battle-skills-close').click();assert not status(page)['skillMenu']
   page.evaluate('BattleUI.activate(0)');basic=cast(page,'basic');assert basic['damage']==27
   assert not page.evaluate('BattleUI.castSkill("basic").ok')
  page.wait_for_timeout(320);page.screenshot(path=str(ART/(label+'-battle-'+encounter+'.png')))
  enemy_before=status(page)['enemyHp']
  page.locator('#battle-actions [data-action="attack"]').click();assert not status(page)['skillMenu']
  if encounter=='miku':
   s=steps(page,1.0);assert s['phase']=='enemy' and s['player']['u']==s['player']['v']==.5
   page.evaluate('BattleUI.endMikuTurn()');steps(page,1.2)
  else:
   page.evaluate('''()=>{for(let i=0;i<2000&&!['command','victory','finale','phase-two'].includes(BattleUI.status().phase);i++)BattleUI.update(.025);BattleUI.draw();}''')
  s=status(page);assert s['phase']=='command',s['phase'];assert s['enemyHp']==enemy_before-8
  assert s['abilities']['poisons'][0]['turns']==2 and s['abilities']['poisons'][1]['turns']==1
  assert not s['abilities']['basicUsed'];steps(page,.7)
  # Closing the menu preserves MP and spent casts; Escape then opens the actual pause menu.
  page.evaluate('BattleUI.activate(0)');remaining=status(page)['mp'];page.keyboard.press('Escape')
  assert not status(page)['skillMenu'] and status(page)['mp']==remaining
  page.keyboard.press('Escape');assert page.evaluate('PauseUI.isOpen');frozen=status(page)['clock'];world(page,.5);assert status(page)['clock']==frozen;page.keyboard.press('Escape')
  # Zero mana still offers exactly one ordinary strike per player turn.
  bridge(page,{'mp':0});page.evaluate('BattleUI.activate(0)');assert page.locator('#battle-basic').is_enabled();zero=cast(page,'basic');assert zero['ok']
  results[encounter]={'multipleCasts':True,'manualContinue':True,'poisonTick':8,'maxHp':140,'maxMp':40,'zeroManaStrike':True}
  page.evaluate('BattleUI.close()')
 # Every checked Miku pattern is still reachable through the real host.
 page.evaluate('BattleUI.open({id:"miku",dialogue:[]})');steps(page,1.0)
 numbers=[1,2,4,5,6,7,8,10,12,14,15,16,18,19,20]
 for i,n in enumerate(numbers):
  bridge(page,{'attack':i,'hp':140});s=steps(page,1.3);assert s['attack']['number']==n
  steps(page,s['attack']['duration']-s['attack']['time']+1.25);assert status(page)['phase']=='command'
 page.evaluate('BattleUI.close();DeveloperState.setGod(false)')
 return {'encounters':results,'mikuActiveNumbers':numbers,'passives':[3,17],'removed':[9,11,13]}

def finale(page):
 assert page.evaluate('MikuRupture.isActive&&HeartQuest.count===3');world(page,2.0)
 from features_v043 import dialogue_done
 assert page.locator('#dialogue-text').get_attribute('aria-label')=='Что происходит...';dialogue_done(page)
 for name,seconds in [('vegetation',3.2),('decor',2.8),('echoes',2.2),('world',3.0)]:
  assert page.evaluate('MikuRupture.status().phase')==name;world(page,seconds)
 assert page.evaluate('MikuRupture.status().phase')=='fall';world(page,8.1);assert status(page)['phase']=='conversation'
 assert status(page)['enemyHp'] is None;story(page);steps(page,1.0);page.evaluate('DeveloperState.setGod(true);BattleUI.endMikuTurn()');steps(page,1.2)
 checkpoint=page.evaluate('captureSnapshot()');assert page.evaluate('SaveModel.valid(captureSnapshot())')
 copies=page.evaluate('SaveUI.status().count');bridge(page,{'enemyHp':1,'castRoll':.5});page.evaluate('BattleUI.activate(0)');assert page.evaluate('BattleUI.castSkill("basic").ok');assert status(page)['phase']=='victory'
 assert page.evaluate('HeartQuest.flags.mikuBossDefeated') and page.evaluate('SaveUI.status().count')==copies+1
 won=page.evaluate('captureSnapshot()');page.evaluate('s=>restoreSnapshot(s)',won);assert page.evaluate('HeartQuest.flags.mikuBossDefeated') and status(page)['phase']=='conversation'
 page.evaluate('developerWarp(1);DeveloperState.setGod(false)');assert not page.evaluate('BattleUI.isOpen||MikuRupture.isActive')
 return {'orderedDissolveAndFall':'PASS','entryDialogue':'PASS','victoryCopyAndChapter':'PASS','developerRewind':'PASS'}

def launch(mode,full=False):
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1536,'height':1024});errors=[];external=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0;')
  url='http://release045.test/index.html' if mode=='source' else 'http://offline045.test/Quiet-Meadow-0.45.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.45.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    parsed=urlparse(req.request.url);file=(ROOT/unquote(parsed.path.lstrip('/'))).resolve()
    if parsed.hostname=='release045.test' and file.is_relative_to(ROOT) and file.is_file():req.fulfill(path=str(file),content_type=mimetypes.guess_type(file.name)[0] or 'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  page.route('**/*',route);page.goto(url)
  try:page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',timeout=10000,polling=50)
  except Exception:
   print('STARTUP',errors,page.locator('#loading').inner_text() if page.locator('#loading').count() else 'no loading',flush=True);raise
  assert page.evaluate('LevelData.version')=='0.45' 
  report={'inventory':inventory(page,mode),'combat':combat(page,mode)}
  if full:
   import features_v043,trials_v043,finale_v043
   features_v043.ART=ART;trials_v043.ART=ART;finale_v043.ART=ART;finale_v043.run=finale
   report['heartTrialsAndCinematic']=trials_v043.run(page)
  assert not errors,errors;assert not external,external
  report.update(errors=errors,externalRequests=external)
  (ART/(mode+'-report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False),flush=True);b.close()
if __name__=='__main__':launch(sys.argv[1] if len(sys.argv)>1 else 'source','--full' in sys.argv)
