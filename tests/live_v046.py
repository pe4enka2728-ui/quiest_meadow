"""Normal animation: random offers, icon feedback, zero-MP entry, PNG hands and stable shop."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
from release_v046 import shop_frames,equal_frames
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=browser.new_page(viewport={'width':1200,'height':800});p.add_init_script('window.__QM_TEST__=true');errors=[];external=[]
 p.on('pageerror',lambda e:errors.append(str(e)));url='http://live046.test/Quiet-Meadow-0.46.html'
 def route(req):
  if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.46.html'),content_type='text/html; charset=utf-8')
  else:external.append(req.request.url);req.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50)
 p.evaluate('developerWarp(1);ShopUI.addMoney(10000);ShopUI.open()');p.wait_for_timeout(100);frames=shop_frames(p)
 p.locator('#shop-list .category-row').nth(1).click();equal_frames(frames,shop_frames(p));p.locator('#shop-list .goods-row').nth(5).click();equal_frames(frames,shop_frames(p));p.wait_for_timeout(180)
 caption=p.locator('.shop-vendor-name').bounding_box();small=p.locator('#shop-mood').bounding_box();assert small['y']+small['height']<=caption['y']+caption['height']-1
 p.screenshot(path=str(ART/'release-shop.png'));p.evaluate('ShopUI.close()')
 p.evaluate('''()=>{const w=ShopUI.captureState();for(const i of ShopModel.goods)ShopModel.buy(w,i.id);ShopUI.restoreState(w);ShopUI.equip('weapon','rift-blade');ShopUI.equip('armor','chorus-vest');ShopUI.equip('amulet','charm');for(let i=0;i<10;i++)ShopUI.equip('abilities',null,i);ShopModel.attacks.forEach((a,i)=>ShopUI.equip('abilities',a.id,i));}''')
 p.keyboard.press('i');p.wait_for_timeout(200);p.screenshot(path=str(ART/'release-inventory.png'))
 p.locator('#inventory-abilities-tab').click();p.wait_for_timeout(700);image=p.locator('#inventory-hands');assert image.evaluate('e=>e.tagName')=='IMG' and image.evaluate('e=>e.complete&&e.naturalWidth===1774')
 transforms=set()
 for i in range(4):transforms.add(image.evaluate('e=>getComputedStyle(e).transform'));p.wait_for_timeout(200)
 assert len(transforms)>1
 p.screenshot(path=str(ART/'release-hands.png'));p.set_viewport_size({'width':480,'height':400});p.wait_for_timeout(80);box=p.locator('.inventory-board').bounding_box();assert box['x']>=-.1 and box['x']+box['width']<=480.1
 p.set_viewport_size({'width':1200,'height':800});p.keyboard.press('Escape');saved=p.evaluate('ShopUI.captureState().loadout');p.reload();p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50);assert p.evaluate('ShopUI.captureState().loadout')==saved
 p.evaluate('developerWarp(1);BattleUI.open({id:"miku",dialogue:[]});DeveloperState.setGod(true)');assert p.evaluate('BattleUI.status().mp')==0
 # Let the full first attack finish through the real animation loop.
 p.wait_for_function('BattleUI.status().phase==="command"',timeout=35000,polling=50);assert p.evaluate('BattleUI.status().mp')==5
 p.wait_for_timeout(650);p.evaluate('DeveloperState.setGod(false);BattleUI.restoreStat("mp");BattleUI.testing({castRoll:0})')
 p.locator('#battle-actions [data-action="attack"]').click();p.wait_for_timeout(250);hand=p.evaluate('BattleUI.status().abilities.offered');assert 3<=len(hand)<=5
 assert p.locator('#battle-basic,#battle-skills-mana,#battle-skills-title').count()==0
 icon=p.locator('#battle-skill-grid .battle-skill').first.locator('canvas');before=icon.evaluate('c=>c.toDataURL()')
 p.keyboard.press('1');p.wait_for_function('BattleUI.status().abilities.effect&&BattleUI.status().abilities.enemyOffset.some(n=>n!==0)',timeout=700,polling=10)
 assert icon.evaluate('c=>c.toDataURL()')!=before
 first=p.evaluate('BattleUI.status().abilities.log.at(-1)');assert first['cost']>0 and p.evaluate('BattleUI.status().mp')==25-first['cost']
 p.wait_for_timeout(500);assert p.evaluate('BattleUI.status().abilities.enemyOffset')==[0,0]
 p.keyboard.press('1');p.wait_for_timeout(500);second=p.evaluate('BattleUI.status().abilities.log.at(-1)');assert p.evaluate('BattleUI.status().mp')==25-first['cost']-second['cost']
 p.screenshot(path=str(ART/'release-combat.png'));p.keyboard.press('Escape');p.locator('#battle-actions [data-action="attack"]').click();assert p.evaluate('BattleUI.status().abilities.offered')==hand
 p.keyboard.press('Enter');p.wait_for_function('BattleUI.status().phase==="enemy"',polling=30);p.evaluate('DeveloperState.setGod(true)')
 x=p.evaluate('BattleUI.status().player.u');p.keyboard.down('d');p.wait_for_timeout(200);p.keyboard.up('d');assert p.evaluate('BattleUI.status().player.u')>x+.02
 p.keyboard.press('Space');p.wait_for_timeout(120);assert p.evaluate('BattleUI.status().player.z')>0
 p.keyboard.press('Escape');assert p.evaluate('PauseUI.isOpen');frozen=p.evaluate('BattleUI.status().clock');p.wait_for_timeout(250);assert p.evaluate('BattleUI.status().clock')==frozen;p.keyboard.press('Escape')
 assert not errors,errors;assert not external,external
 report={'shopStableLive':'PASS','captionFits':True,'pixelHandsPng':True,'handsRiseAndBob':'PASS','responsive480':'PASS','loadoutReload':'PASS','mpAtStart':0,'mpAfterFullEnemyAttack':5,'maxMp':25,'randomOffers':hand,'noFreeStrike':True,'sameHandOnReopen':True,'iconAnimation':'PASS','opponentShake':'PASS','twoPaidCasts':True,'movementJumpPause':'PASS','errors':errors,'externalRequests':external}
 (ART/'live-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS LIVE',json.dumps(report,ensure_ascii=False),flush=True);browser.close()
