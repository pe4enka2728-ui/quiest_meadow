"""Normal animation loop, keyboard casts, local persistence and responsive inventory layout."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1200,'height':800});page.add_init_script('window.__QM_TEST__=true');errors=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)));url='http://live045.test/Quiet-Meadow-0.45.html'
 def route(req):
  if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.45.html'),content_type='text/html; charset=utf-8')
  else:external.append(req.request.url);req.abort()
 page.route('**/*',route);page.goto(url);page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50)
 page.evaluate('''()=>{developerWarp(1);const w=ShopUI.captureState();w.gold=10000;for(const i of ShopModel.goods)ShopModel.buy(w,i.id);ShopUI.restoreState(w);ShopUI.equip('weapon','rift-blade');ShopUI.equip('armor','echo-cuirass');ShopUI.equip('amulet','charm');for(let i=0;i<10;i++)ShopUI.equip('abilities',null,i);ShopModel.attacks.forEach((a,i)=>ShopUI.equip('abilities',a.id,i));}''')
 page.keyboard.press('i');assert page.evaluate('InventoryUI.isOpen');before=page.locator('#inventory-teto').evaluate('c=>c.toDataURL()');clock=page.evaluate('InventoryUI.status().clock');page.wait_for_timeout(400)
 assert page.evaluate('InventoryUI.status().clock')>clock and page.locator('#inventory-teto').evaluate('c=>c.toDataURL()')!=before
 page.screenshot(path=str(ART/'release-inventory.png'))
 page.locator('#inventory-abilities-tab').click();page.wait_for_timeout(700);before=page.locator('#inventory-hands').evaluate('c=>c.toDataURL()');page.wait_for_timeout(300);assert page.locator('#inventory-hands').evaluate('c=>c.toDataURL()')!=before
 page.screenshot(path=str(ART/'release-abilities.png'))
 # At narrow viewports the fixed art board is fitted within the game canvas.
 page.set_viewport_size({'width':480,'height':400});page.wait_for_timeout(120)
 bounds=page.locator('.inventory-board').bounding_box();assert bounds['x']>=-.1 and bounds['x']+bounds['width']<=480.1
 page.set_viewport_size({'width':1200,'height':800});page.keyboard.press('Escape');saved=page.evaluate('ShopUI.captureState().loadout')
 page.reload();page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50);assert page.evaluate('ShopUI.captureState().loadout')==saved
 page.evaluate('developerWarp(1);BattleUI.open({id:"miku",dialogue:[]});DeveloperState.setGod(true)')
 page.wait_for_function('BattleUI.status().phase==="enemy"',polling=30);page.evaluate('BattleUI.endMikuTurn()');page.wait_for_function('BattleUI.status().phase==="command"',polling=30);page.wait_for_timeout(650)
 page.evaluate('DeveloperState.setGod(false);BattleUI.testing({castRoll:0})');page.locator('#battle-actions [data-action="attack"]').click();page.wait_for_timeout(300)
 page.keyboard.press('1');page.wait_for_timeout(450);assert page.evaluate('BattleUI.status().mp')==37 and page.evaluate('BattleUI.status().enemyHp')==465
 page.keyboard.press('2');page.wait_for_timeout(450);assert page.evaluate('BattleUI.status().mp')==32 and page.evaluate('BattleUI.status().enemyHp')==416
 assert page.evaluate('BattleUI.status().heroStats.maxHp')==165
 assert page.locator('#battle-actions [data-action="attack"] strong').inner_text()=='Продолжить'
 page.screenshot(path=str(ART/'release-battle.png'))
 page.keyboard.press('Enter');page.wait_for_function('BattleUI.status().phase==="enemy"',polling=30)
 page.evaluate('DeveloperState.setGod(true)');x=page.evaluate('BattleUI.status().player.u');page.keyboard.down('d');page.wait_for_timeout(220);page.keyboard.up('d');assert page.evaluate('BattleUI.status().player.u')>x+.02
 page.keyboard.press('Space');page.wait_for_timeout(120);assert page.evaluate('BattleUI.status().player.z')>0
 page.keyboard.press('Escape');assert page.evaluate('PauseUI.isOpen');frozen=page.evaluate('BattleUI.status().clock');page.wait_for_timeout(250);assert page.evaluate('BattleUI.status().clock')==frozen;page.keyboard.press('Escape')
 assert not errors,errors;assert not external,external
 report={'idleAnimation':'PASS','handsRiseAndMotion':'PASS','responsive480px':'PASS','reloadPersistence':'PASS','keyboardMultipleCasts':'PASS','criticalDamage':[35,49],'manaAfterTwoCasts':32,'armoredMaxHp':165,'manualContinue':'PASS','movementJumpPause':'PASS','errors':errors,'externalRequests':external}
 (ART/'live-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS LIVE',json.dumps(report,ensure_ascii=False),flush=True);b.close()
