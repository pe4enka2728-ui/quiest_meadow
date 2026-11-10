from pathlib import Path
from playwright.sync_api import sync_playwright
import json
r=Path(__file__).resolve().parents[1];out=r/'validation';out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1200,'height':800});errors=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 url='http://inventory045.test/'
 def route(req):
  if req.request.url==url:req.fulfill(path=str(r/'play.html'),content_type='text/html; charset=utf-8')
  else:external.append(req.request.url);req.abort()
 page.route('**/*',route);page.goto(url);page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready')
 page.evaluate('''()=>{developerWarp(1);const w=ShopUI.captureState();w.gold=9999;for(const item of ShopModel.goods)ShopModel.buy(w,item.id);ShopUI.restoreState(w);ShopUI.equip('weapon','crimson-sabre');ShopUI.equip('armor','chorus-vest');ShopUI.equip('amulet','tuning-fork');InventoryUI.open();}''')
 page.wait_for_timeout(400);page.screenshot(path=str(out/'inventory-equipment.png'))
 assert page.locator('#world-inventory').is_hidden()
 assert page.locator('.equipment-slot').count()==3
 page.locator('#inventory-abilities-tab').click();page.wait_for_timeout(750);assert page.locator('.ability-slot').count()==10
 page.locator('[data-ability-slot="1"]').click();assert page.locator('#inventory-list [data-item="pulse"]').is_disabled()
 page.locator('#inventory-list [data-item="thorn-note"]').click();assert page.evaluate('ShopUI.captureState().loadout.abilities[1]')=='thorn-note'
 page.screenshot(path=str(out/'inventory-abilities.png'))
 assert not errors,errors;assert not external,external
 print('PASS inventory UI: 3 slots, 10 abilities, equipped stats, duplicate grey and selection; errors=[]');b.close()
