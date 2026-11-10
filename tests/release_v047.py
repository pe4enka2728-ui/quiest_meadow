"""0.47 regression: compact offers, zero starting MP, feedback, pixel hands and fixed shop frames."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';ART.mkdir(exist_ok=True)
def status(p):return p.evaluate('BattleUI.status()')
def steps(p,s):return p.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.02)BattleUI.update(Math.min(.02,s-t));BattleUI.draw();return BattleUI.status()}''',s)
def world(p,s):return p.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.02)tick(Math.min(.02,s-t));draw();return spawnStatus()}''',s)
def bridge(p,c):return p.evaluate('c=>BattleUI.testing(c)',c)
def story(p):p.evaluate('''()=>{for(let i=0;i<20&&BattleUI.status().phase==='conversation';i++)BattleUI.advanceStory();}''')
def complete_enemy(p):
 if status(p)['encounter']=='miku':p.evaluate('BattleUI.endMikuTurn()');steps(p,1.25)
 else:p.evaluate('''()=>{for(let i=0;i<2500&&BattleUI.status().phase!=='command';i++)BattleUI.update(.02);BattleUI.draw();}''');steps(p,.7)
 assert status(p)['phase']=='command'
def shop_frames(p):return p.evaluate('''()=>Object.fromEntries(['.shop-board','.shop-top','.shop-middle','.shop-bottom','.shop-catalog','.shop-vendor','#shop-portrait','.shop-list-header','#shop-list'].map(s=>{const r=document.querySelector('#shop '+s).getBoundingClientRect();return [s,{x:r.x,y:r.y,w:r.width,h:r.height}];}))''')
def equal_frames(a,b):
 for s in a:
  for dim in a[s]:assert abs(a[s][dim]-b[s][dim])<.15,(s,dim,a[s],b[s])
def shop(p,label):
 p.evaluate('developerWarp(1);ShopUI.addMoney(5000)');sizes=[]
 for width,height in [(1536,1024),(1200,800),(960,640),(640,420)]:
  p.set_viewport_size({'width':width,'height':height});p.evaluate('ShopUI.open();ShopUI.update(.1)');before=shop_frames(p)
  for category in range(3):
   p.locator('#shop-list .category-row').nth(category).click();equal_frames(before,shop_frames(p))
   p.locator('#shop-list .goods-row').first.click();equal_frames(before,shop_frames(p))
   p.locator('#shop-back').click();equal_frames(before,shop_frames(p))
  sizes.append([width,height]);p.evaluate('ShopUI.close()')
 p.set_viewport_size({'width':1536,'height':1024});p.evaluate('ShopUI.open();ShopUI.update(.1)');before=shop_frames(p)
 p.locator('#shop-list .category-row').nth(0).click();p.locator('#shop-list .goods-row').first.click();p.locator('#shop-replies [data-shortcut="4"]').click();p.evaluate('ShopUI.update(1.5)');equal_frames(before,shop_frames(p))
 assert p.evaluate('ShopUI.captureState().inventory.ribbon')==1
 assert p.locator('#shop-list .goods-row').last.get_attribute('data-item')=='ribbon'
 assert p.locator('#shop-list .goods-row').last.is_disabled();assert 'Приобретено' in p.locator('#shop-list .goods-row').last.inner_text()
 assert p.locator('.shop-catalog').evaluate('e=>getComputedStyle(e).backgroundColor')=='rgb(39, 63, 51)'
 p.screenshot(path=str(ART/f'{label}-shop.png'));p.locator('#shop-back').click();p.locator('#shop-list .category-row').nth(2).click()
 for _ in range(2):
  p.locator('#shop-list [data-item="herbal"]').click();p.locator('#shop-replies [data-shortcut="4"]').click();p.evaluate('ShopUI.update(1.5)')
 assert p.evaluate('ShopUI.captureState().inventory.herbal')==2;assert not p.locator('#shop-list [data-item="herbal"]').is_disabled();p.evaluate('ShopUI.close()')
 return {'fixedFrames':True,'testedViewports':sizes,'categoryItemPurchaseStable':'PASS'}
def inventory(p,label):
 p.evaluate('''()=>{const w=ShopUI.captureState();for(const i of ShopModel.goods)ShopModel.buy(w,i.id);ShopUI.restoreState(w);ShopUI.equip('weapon','rift-blade');ShopUI.equip('armor','chorus-vest');ShopUI.equip('amulet','charm');for(let i=0;i<10;i++)ShopUI.equip('abilities',null,i);ShopModel.attacks.forEach((a,i)=>ShopUI.equip('abilities',a.id,i));InventoryUI.open();InventoryUI.update(1);}''')
 assert p.locator('#world-inventory').is_hidden();assert p.evaluate('ShopModel.stats(ShopUI.captureState()).maxMp')==25
 p.wait_for_timeout(250);p.screenshot(path=str(ART/f'{label}-inventory.png'))
 p.locator('#inventory-abilities-tab').click();p.evaluate('InventoryUI.update(.1)');p.wait_for_timeout(700)
 image=p.locator('#inventory-hands');assert image.evaluate('e=>e.tagName')=='IMG';assert image.evaluate('e=>e.complete&&e.naturalWidth>1000')
 assert image.evaluate('e=>getComputedStyle(e).imageRendering')=='pixelated'
 assert p.locator('.ability-slot').count()==10
 p.locator('[data-ability-slot="0"]').click();assert p.locator('#inventory-list [data-item="thorn-note"]').is_disabled()
 color=p.locator('.inventory-board').evaluate('e=>getComputedStyle(e).backgroundColor');assert color!='rgb(21, 44, 38)'
 p.screenshot(path=str(ART/f'{label}-hands.png'))
 saved=p.evaluate('captureSnapshot()');assert p.evaluate('SaveModel.valid(captureSnapshot())');p.keyboard.press('Escape');p.evaluate('s=>restoreSnapshot(s)',saved)
 assert p.evaluate('ShopUI.captureState().loadout.abilities.filter(Boolean).length')==10
 return {'newPalette':True,'pixelHandsImage':True,'tenSlotsAndNoDuplicates':'PASS','savedGear':'PASS'}
def combat(p,label):
 result={}
 for encounter in ['flower','gumi','miku']:
  p.evaluate('id=>{BattleUI.close();BattleUI.open({id});DeveloperState.setGod(true)}',encounter)
  assert status(p)['mp']==0 and status(p)['heroStats']['maxMp']==25
  story(p);steps(p,1.3)
  if encounter=='miku':assert status(p)['phase']=='enemy';complete_enemy(p)
  else:
   p.evaluate('BattleUI.activate(0)');s=status(p);assert s['mp']==0 and s['skillMenu']
   assert p.locator('#battle-basic').count()==0
   assert p.locator('#battle-skill-grid .battle-skill.is-unaffordable').count()==len(s['abilities']['offered'])
   assert not p.locator('#battle-actions [data-action="attack"]').is_disabled()
   p.keyboard.press('1');assert status(p)['phase']=='enemy';complete_enemy(p)
  assert status(p)['mp']==5
  bridge(p,{'castRoll':.5});p.evaluate('BattleUI.restoreStat("mp");BattleUI.activate(0)');s=status(p)
  hand=s['abilities']['offered'];revision=s['abilities']['handRevision'];assert 3<=len(hand)<=5 and len(set(hand))==len(hand)
  assert p.locator('#battle-skill-grid .battle-skill').count()==len(hand)
  assert p.locator('#battle-skills-mana,#battle-skills-title,#battle-skill-eyebrow,#battle-basic').count()==0
  text=p.locator('#battle-skills').inner_text();assert not any(t in text for t in ['ТВОЙ ХОД','Приёмы Тето','Выбери несколько','Продолжить'])
  p.wait_for_timeout(250);bounds=p.locator('#battle-skills').bounding_box();assert bounds['width']<500 and bounds['height']<320 and bounds['y']>420,bounds
  p.keyboard.press('Escape');p.evaluate('BattleUI.activate(0)');assert status(p)['abilities']['offered']==hand and status(p)['abilities']['handRevision']==revision
  hidden=p.evaluate('BattleUI.status().abilities.abilities.find(id=>id&&!BattleUI.status().abilities.offered.includes(id))')
  assert not p.evaluate('id=>BattleUI.castSkill(id).ok',hidden)
  assert not p.evaluate('BattleUI.castSkill("basic").ok')
  id=hand[0];icon=p.locator('#battle-skill-grid [data-skill="'+id+'"] canvas');before=icon.evaluate('c=>c.toDataURL()');mp=status(p)['mp'];player=status(p)['player']
  cast=p.evaluate('id=>BattleUI.castSkill(id)',id);assert cast['ok'] and cast['cost']>=1 and status(p)['mp']==mp-cast['cost']
  steps(p,.08);s=status(p);assert any(s['abilities']['enemyOffset'])
  assert s['player']['u']==player['u'] and s['player']['v']==player['v'];assert icon.evaluate('c=>c.toDataURL()')!=before
  # Verify the real opponent renderer receives the local offset in all three encounters.
  translated=p.evaluate('''()=>{BattleUI.update(.015);const c=document.querySelector('#battle-scene').getContext('2d'),old=c.translate,calls=[],offset=BattleUI.status().abilities.enemyOffset;try{c.translate=function(x,y){calls.push([x,y]);return old.call(this,x,y);};BattleUI.draw();}finally{c.translate=old;}return {offset,calls};}''')
  assert translated['offset'] in translated['calls'],translated
  p.evaluate('BattleUI.localPause(true)');age=status(p)['abilities']['effect']['age'];paused=icon.evaluate('c=>c.toDataURL()');steps(p,.3);assert status(p)['abilities']['effect']['age']==age and icon.evaluate('c=>c.toDataURL()')==paused
  p.evaluate('BattleUI.localPause(false)');steps(p,.5);assert status(p)['abilities']['enemyOffset']==[0,0];assert icon.evaluate('c=>c.toDataURL()')==before
  second=p.evaluate('id=>BattleUI.castSkill(id)',id);assert second['ok'];p.keyboard.press('1');assert status(p)['continueQueued'];steps(p,.5)
  p.wait_for_timeout(220);p.screenshot(path=str(ART/f'{label}-combat-{encounter}.png'))
  steps(p,1.0)
  assert not status(p)['skillMenu']
  complete_enemy(p);after=status(p);assert after['abilities']['handRevision']==revision+1
  assert set(after['abilities']['offered'])!=set(hand) or len(after['abilities']['offered'])!=len(hand)
  assert 0<=after['mp']<=25
  p.evaluate('BattleUI.restoreStat("mp")');assert status(p)['mp']==25
  result[encounter]={'startsAt0':True,'maxMp':25,'offerCount':len(hand),'sameOnReopen':True,'changesNextTurn':True,'noFreeStrike':True,'enemyShake':True,'iconAnimationAndPause':True,'compactBounds':bounds}
  p.evaluate('BattleUI.close()')
 p.evaluate('DeveloperState.setGod(false)')
 return result

def finale(p):
 assert p.evaluate('MikuRupture.isActive&&HeartQuest.count===3');world(p,2)
 from features_v043 import dialogue_done
 assert p.locator('#dialogue-text').get_attribute('aria-label')=='Что происходит...';dialogue_done(p)
 for phase,seconds in [('vegetation',3.2),('decor',2.8),('echoes',2.2),('world',3)]:assert p.evaluate('MikuRupture.status().phase')==phase;world(p,seconds)
 world(p,8.1);assert status(p)['phase']=='conversation' and status(p)['mp']==0
 story(p);steps(p,1);p.evaluate('DeveloperState.setGod(true)');complete_enemy(p);assert status(p)['mp']==5
 copies=p.evaluate('SaveUI.status().count');bridge(p,{'enemyHp':1,'castRoll':.5});p.evaluate('BattleUI.restoreStat("mp");BattleUI.activate(0)');id=status(p)['abilities']['offered'][0];assert p.evaluate('id=>BattleUI.castSkill(id).ok',id)
 assert status(p)['phase']=='victory' and p.evaluate('HeartQuest.flags.mikuBossDefeated')
 assert p.evaluate('SaveUI.status().count')==copies+1
 won=p.evaluate('captureSnapshot()');assert p.evaluate('SaveModel.valid(captureSnapshot())');p.evaluate('s=>restoreSnapshot(s)',won);assert status(p)['mp']==0 and p.evaluate('HeartQuest.flags.mikuBossDefeated')
 p.evaluate('developerWarp(1);DeveloperState.setGod(false)');return {'cinematicDialogue':'PASS','zeroMpOnEntryAndReload':True,'paidVictorySave':'PASS','developerRewind':'PASS'}

def inventory_pause(p,label):
 for in_shop in [False,True]:
  p.evaluate('ShopUI.open()' if in_shop else 'ShopUI.close()');p.evaluate('InventoryUI.open()');p.evaluate('window.dispatchEvent(new Event("blur"))')
  assert p.evaluate('PauseUI.isOpen&&document.querySelector("#inventory").inert')
  assert p.evaluate('Number(getComputedStyle(document.querySelector("#pause")).zIndex)>Number(getComputedStyle(document.querySelector("#inventory")).zIndex)')
  assert p.evaluate('''()=>{const r=document.querySelector('#pause-resume').getBoundingClientRect();return !!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('#pause');}''')
  p.keyboard.press('F3');assert p.evaluate('DeveloperUI.isOpen');p.keyboard.press('F3');p.keyboard.press('Escape');assert p.evaluate('!PauseUI.isOpen&&!document.querySelector("#inventory").inert')
  p.locator('#inventory-abilities-tab').click();p.wait_for_timeout(450);p.locator('[data-ability-slot="0"]').click();p.locator('#inventory-list [data-item="pulse"]').click()
  assert p.evaluate('document.activeElement.dataset.item')=='pulse'
  p.evaluate('''()=>{for(let i=0;i<30;i++){ShopUI.equip('abilities',null,0);ShopUI.equip('abilities','pulse',0);InventoryUI.setView(i%2?'equipment':'abilities');InventoryUI.update(.04);}}''')
  p.keyboard.press('Escape');assert not p.evaluate('InventoryUI.isOpen')
 p.evaluate('ShopUI.close()');return {'pauseVisibleAfterBlur':True,'resumesAndAcceptsInput':True,'worldAndShop':'PASS','developerAbovePause':'PASS','repeatedEquipAndView':'PASS'}

def support_skills(p,label):
 saved=p.evaluate('ShopUI.captureState()');result={}
 for encounter in ['flower','gumi','miku']:
  checked=[]
  for id in ['warm-note','second-breath','soft-guard','quiet-shell','perfect-accent','quick-tempo']:
   p.evaluate('''id=>{BattleUI.close();const w=ShopUI.captureState();w.loadout.abilities.fill(null);['pulse','step',id].forEach((a,i)=>{w.inventory[a]=1;ShopModel.equip(w,'abilities',a,i)});ShopUI.restoreState(w);}''',id)
   p.evaluate('id=>{BattleUI.open({id});DeveloperState.setGod(true)}',encounter);story(p);steps(p,1.3)
   if encounter=='miku':complete_enemy(p)
   bridge(p,{'hp':20,'mp':25,'castRoll':.5});p.evaluate('BattleUI.activate(0)');row=p.locator('[data-skill="'+id+'"]');before=status(p)
   p.wait_for_timeout(220);row.click();assert row.get_attribute('aria-expanded')=='true';assert status(p)['mp']==25 and status(p)['hp']==20 and len(status(p)['abilities']['log'])==0
   desc=p.locator('#skill-description-'+id);assert desc.is_visible();assert p.evaluate('''id=>{const b=document.querySelector('[data-skill="'+id+'"]').getBoundingClientRect(),d=document.querySelector('#skill-description-'+id).getBoundingClientRect();return d.y>=b.y+b.height-1;}''',id)
   if id=='quiet-shell':
    p.wait_for_timeout(220);p.screenshot(path=str(ART/f'{label}-skills-{encounter}.png'))
    theme=p.locator('#battle-skills').evaluate('e=>({bg:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderTopColor})')
    if encounter=='miku':assert theme=={'bg':'rgb(0, 0, 0)','border':'rgb(255, 255, 255)'}
    else:assert theme=={'bg':'rgb(17, 38, 44)','border':'rgb(82, 107, 104)'}
   row.click();s=status(p);cast=s['abilities']['log'][-1];assert cast['id']==id and cast['target']=='hero' and cast['cost']>0 and s['mp']==25-cast['cost'];assert s['enemyHp']==before['enemyHp'];assert s['abilities']['enemyOffset']==[0,0]
   if id=='warm-note':assert s['hp']==45
   if id=='second-breath':assert s['hp']==70
   if id=='soft-guard':assert s['abilities']['buffs']['resistance']==.2
   if id=='quiet-shell':assert s['abilities']['buffs']['resistance']==.4
   if id=='perfect-accent':
    assert s['abilities']['buffs']['nextCrit'];steps(p,.5);attack=p.locator('[data-skill="pulse"]');attack.click();attack.click();assert status(p)['abilities']['log'][-1]['crits']==1 and not status(p)['abilities']['buffs']['nextCrit']
   if id=='quick-tempo':assert s['abilities']['buffs']['speed']==.1
   p.keyboard.press('1');assert status(p)['continueQueued'];steps(p,1.4);assert not status(p)['skillMenu']
   if id=='quick-tempo':
    bridge(p,{'player':{'u':.4,'v':.5}});start=status(p)['player']['u'];p.keyboard.down('d');steps(p,.1);p.keyboard.up('d');moved=status(p)['player']['u']-start;expected=(4.2/12 if encounter=='miku' else .35)*.1*1.1;assert abs(moved-expected)<.0001,(encounter,moved,expected)
   checked.append(id)
  result[encounter]=checked;p.evaluate('BattleUI.close()')
 p.evaluate('w=>ShopUI.restoreState(w)',saved);p.evaluate('DeveloperState.setGod(false)');return {'testedInAllEncounters':result,'previewBeforeCast':True,'descriptionBelowRow':True,'queuedContinue1':True,'realSpeedIncrease':'10%','supportDoesNotShakeEnemy':True}

def launch(mode,full=False):
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=browser.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0;');errors=[];external=[]
  p.on('pageerror',lambda e:errors.append(str(e)));url='http://release047.test/index.html' if mode=='source' else 'http://offline047.test/Quiet-Meadow-0.47.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.47.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='release047.test' and f.is_relative_to(ROOT) and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50)
  assert p.evaluate('LevelData.version')=='0.47'
  report={'shop':shop(p,mode),'inventory':inventory(p,mode),'inventoryPause':inventory_pause(p,mode),'combat':combat(p,mode),'supportSkills':support_skills(p,mode)}
  if full:
   import features_v043,trials_v043,finale_v043
   features_v043.ART=ART;trials_v043.ART=ART;finale_v043.ART=ART;finale_v043.run=finale
   report['heartTrialsAndCinematic']=trials_v043.run(p)
  assert not errors,errors;assert not external,external
  report.update(errors=errors,externalRequests=external);(ART/f'{mode}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False),flush=True);browser.close()
if __name__=='__main__':launch(sys.argv[1] if len(sys.argv)>1 else 'source','--full' in sys.argv)
