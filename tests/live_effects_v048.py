"""Verify independent animation / icon lifetime through normal requestAnimationFrame."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1200,'height':800});p.add_init_script('window.__QM_TEST__=true');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://live048.test/Quiet-Meadow-0.48.html'
 def route(req):
  if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.48.html'),content_type='text/html; charset=utf-8')
  else:external.append(req.request.url);req.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50);p.evaluate('developerWarp(1)')
 def setup(ids):
  p.evaluate('''ids=>{BattleUI.close();const w=ShopModel.fresh();w.gold=10000;for(const id of ids)ShopModel.buy(w,id);w.loadout.abilities.fill(null);ids.forEach((id,i)=>ShopModel.equip(w,'abilities',id,i));ShopUI.restoreState(w);BattleUI.open({id:'gumi'});DeveloperState.setGod(true);}''',ids);p.wait_for_timeout(1400);p.evaluate('BattleUI.testing({mp:25,hp:20,castRoll:.5});BattleUI.activate(0)');p.wait_for_timeout(250)
 setup(['soft-guard','pulse']);row=p.locator('[data-skill="soft-guard"]');row.click();row.click();p.wait_for_function('BattleUI.status().heroEffects.some(e=>e.age>.15)',polling=30);icon=p.locator('.hero-effect[data-effect="resistance"]');icon.hover();assert '20%' in p.locator('#battle-hero-effect-tooltip').inner_text()
 p.wait_for_function('BattleUI.status().heroEffectAnimations.length===0',timeout=7000,polling=40);assert icon.is_visible();assert p.locator('#battle-hero-effect-visuals').is_hidden();p.screenshot(path=str(ART/'live-persistent-icon.png'))
 p.keyboard.press('1');p.wait_for_function('BattleUI.status().phase==="enemy"',polling=30);assert p.locator('.hero-card').is_visible();icon.hover();assert p.locator('#battle-hero-effect-tooltip').is_visible()
 p.keyboard.press('Escape');assert p.evaluate('PauseUI.isOpen');frozen=p.evaluate('BattleUI.status().heroEffects');p.wait_for_timeout(250);assert p.evaluate('BattleUI.status().heroEffects')==frozen;p.keyboard.press('Escape')
 p.wait_for_function('BattleUI.status().phase==="command"',timeout=35000,polling=50);assert icon.count()==0
 setup(['perfect-accent','pulse']);r=p.locator('[data-skill="perfect-accent"]');r.click();r.click();p.wait_for_function('BattleUI.status().heroEffects.some(e=>e.age>2.1)',timeout=7000,polling=40);assert p.locator('.hero-effect[data-effect="critical"]').is_visible();r=p.locator('[data-skill="pulse"]');r.click();r.click();assert p.locator('.hero-effect[data-effect="critical"]').count()==0
 p.evaluate('BattleUI.close()');assert p.locator('#battle-hero-effects').is_hidden();assert not errors,errors;assert not external,external
 report={'animationSeconds':2,'buffIconRemainsAfterAnimation':True,'hoverDescription':True,'portraitDuringEnemy':True,'iconRemovedAfterEnemyPhase':True,'criticalRemovedOnUse':True,'pausePreservesIconState':True,'errors':errors,'externalRequests':external};(ART/'live-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS LIVE',json.dumps(report,ensure_ascii=False),flush=True);b.close()
