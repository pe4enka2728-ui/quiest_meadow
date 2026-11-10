"""Actual browser integration, source and offline build. No gameplay video recording."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1];ART=ROOT.parent

def ticks(page,seconds):
 return page.evaluate('''seconds=>{for(let t=0;t<seconds-1e-8;t+=.025)BattleUI.update(Math.min(.025,seconds-t));return BattleUI.status()}''',seconds)
def warp(page,slot):
 if not page.evaluate('DeveloperUI.isOpen'):page.keyboard.press('F3')
 if page.evaluate('DeveloperUI.status().view')=='home':page.locator('#developer-teleport').click()
 page.locator(f'#developer-scroll [data-slot="{slot}"]').click();page.wait_for_timeout(30)
 assert not page.evaluate('DeveloperUI.isOpen')
def dialogue_done(page):
 page.evaluate('''()=>{for(let i=0;i<40&&DialogueUI.isOpen;i++){DialogueUI.finishText();DialogueUI.choose(0)}}''')
def fight(page):
 warp(page,2);page.keyboard.press('e');dialogue_done(page)
 page.evaluate('GumiEncounter.update(12.1);GumiEncounter.update(.6)');ticks(page,.8)
 assert page.evaluate('BattleUI.status().encounter')=='gumi'
 assert page.evaluate('BattleUI.status().enemyHp')==300
 assert not page.evaluate('BattleUI.status().trainingInvulnerable')
def bridge(page,config):return page.evaluate('config=>BattleUI.testing(config)',config)

def run(page):
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready')
 page.keyboard.press('F3');assert page.locator('#developer-home').is_visible()
 paused=page.evaluate('spawnStatus().playTime');page.wait_for_timeout(180);assert page.evaluate('spawnStatus().playTime')==paused
 page.locator('#developer-teleport').click();assert page.locator('#developer-scroll button').count()==8
 assert page.locator('#developer-scroll button:not(:disabled)').count()==3
 assert page.locator('#developer-scroll [data-slot="3"]').is_disabled()
 page.locator('#developer-scroll [data-slot="1"]').click()
 assert page.evaluate('spawnStatus().location')=='forest'
 assert page.evaluate('WorldOutcome.flowerDefeated')
 assert page.evaluate('ShopUI.captureState().inventory["golden-key"]')==1
 copies=page.evaluate('SaveUI.status().count');assert copies==1
 fight(page);assert page.evaluate('SaveUI.status().count')==copies+1
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-arena.png'))
 # Initial hero turn freezes movement, light exposure and the arena clock.
 before=page.evaluate('BattleUI.status()');state=ticks(page,1.05)
 assert state['hp']==before['hp'] and state['arena']==before['arena'],state
 old_v=state['player']['v'];page.keyboard.down('w');page.wait_for_timeout(160);page.keyboard.up('w');assert page.evaluate('BattleUI.status().player.v')==old_v
 # Real non-training damage: first ball is harmless for one second, then applies fifteen.
 bridge(page,{'attack':0,'hp':100,'player':{'u':.5,'v':.75,'jump':0},'suppressLights':True})
 page.evaluate('''()=>{BattleUI.update(.025);const e=BattleUI.status().attack.entities.find(e=>e.kind==='gumi-ball-warning');BattleUI.testing({player:{u:e.x/12+.5,v:e.y/8,jump:0}})}''')
 state=ticks(page,.9);assert state['hp']==100,state['hp']
 state=ticks(page,.18);assert state['hp']==85,state
 assert 1.2<state['invulnerableRemaining']<=1.5
 assert state['damageSource'].startswith('gumi-drop-')
 # Pause freezes damage, attack time, and exposure; F3 can interrupt a live battle.
 page.keyboard.press('F3');clock=page.evaluate('BattleUI.status().clock');page.wait_for_timeout(180);assert page.evaluate('BattleUI.status().clock')==clock;page.keyboard.press('F3')
 # Three independently colored lights can hit through ordinary protection, without refreshing it.
 bridge(page,{'hp':100,'enemyHp':150,'turn':14,'player':{'u':.5,'v':.5,'jump':0},'suppressLights':False})
 ticks(page,.025);bridge(page,{'lightAtPlayer':True})
 last=page.evaluate('BattleUI.status().lastDamageAt');state=ticks(page,1.05)
 assert state['hp']==97,state['hp'];assert state['lastDamageAt']==last
 assert len({l['color'] for l in state['arena']['lights']})==3
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-phase-warning.png'))
 # An outer plate starts a visible fall; death occurs below the floor, despite protection.
 fight(page);bridge(page,{'enemyHp':150,'player':{'u':.1,'v':.5,'jump':0},'suppressLights':True})
 state=ticks(page,5.1);assert state['hp']==100 and state['phase']=='falling',state
 ticks(page,.7);assert page.evaluate('BattleUI.status().hp')==0
 ticks(page,3);page.evaluate('GumiEncounter.update(1.2)');assert page.evaluate('spawnStatus().location')=='meadow'
 # Permanent 15-cell layout, and the two-safe-cell attack followed directly by the next attack.
 fight(page);bridge(page,{'enemyHp':150,'suppressLights':True});ticks(page,5.1)
 bridge(page,{'attack':2,'suppressLights':True})
 page.evaluate('''()=>{const id=BattleUI.status().arena.safeCells[0],at=GumiArenaModel.cellCenter(id);BattleUI.testing({player:{...at,jump:0}})}''')
 state=ticks(page,2.05);assert len(state['arena']['temporary'])==13,state['arena']
 assert state['arena']['lightsSuppressed']
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-two-tiles.png'))
 turn=state['turn'];state=ticks(page,3.65);assert state['phase']=='enemy' and state['lastAttack']!=2 and state['turn']==turn,state
 assert len(state['arena']['permanent'])==10
 # Fire hoops: a single five-cell strip, jump through a live hoop with normal collision enabled.
 bridge(page,{'attack':3,'hp':100,'player':{'u':.5,'v':.75,'jump':0},'suppressLights':True})
 state=ticks(page,3.3);assert len(state['arena']['temporary'])==10,state['arena']
 page.keyboard.press('Space');state=ticks(page,.55);assert state['hp']==100,state
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-fire-hoops.png'))
 # Threshold 1 never gives ordinary victory. The actual E interaction starts the fuse.
 bridge(page,{'enemyHp':1,'player':{'u':.5,'v':.8,'jump':0}});state=ticks(page,1.25)
 assert state['phase']=='finale' and state['enemyHp']==1 and not state['outcome']
 assert not any(l['active'] for l in state['arena']['lights'])
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-cannon.png'))
 page.keyboard.press('e');assert page.evaluate('BattleUI.status().finale.phase')=='fuse'
 state=ticks(page,3.7);assert state['finale']['phase']=='fuse'
 state=ticks(page,.4);assert state['finale']['phase']=='shot'
 ticks(page,.7);state=ticks(page,1);assert state['finale']['phase']=='smoke'
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-smoke.png'))
 state=ticks(page,2.1);assert state['finale']['stringsReleased']
 ticks(page,4.8);page.evaluate('GumiEncounter.update(1)');assert page.evaluate('GumiEncounter.defeated')
 dialogue_done(page);assert page.evaluate('CurtainProgress.active')
 page.evaluate('CurtainProgress.update(3.3)');assert page.evaluate('CurtainProgress.passable')
 page.wait_for_timeout(60);page.screenshot(path=str(ART/'Quiet-Meadow-0.34-curtain-open.png'))
 assert page.evaluate('!SpawnWorld.blocked(768,-3360)')
 route=page.evaluate('SpawnWorld.route(spawnStatus().teto,{x:768,y:-3395}).length');assert route>0
 # Walk the actual route rather than teleporting directly to the exit trigger.
 page.locator('#map').click(position={'x':768,'y':205})
 page.wait_for_function('spawnStatus().location==="circus"&&!spawnStatus().rearPassage.active',timeout=12000)
 assert page.evaluate('spawnStatus().teto.y')< -1550
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-behind-tent.png'))
 page.keyboard.press('e');page.wait_for_function('spawnStatus().location==="tent-arena"&&!spawnStatus().rearPassage.active')
 # Preset four is a separate save and directly opens the curtain, without replaying victory.
 count=page.evaluate('SaveUI.status().count');warp(page,4)
 assert page.evaluate('GumiEncounter.defeated&&CurtainProgress.passable')
 assert page.evaluate('SaveUI.status().count')==count+1
 # Counter preview -> successful flight -> one charge only. Shop's own interface is preserved.
 page.evaluate('SaveUI.open()');page.keyboard.press('m');assert page.evaluate('ShopUI.isOpen')
 page.keyboard.press('1');page.keyboard.press('1');assert page.evaluate('ShopUI.status().counterItem')=='ribbon'
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-shop-counter.png'))
 page.keyboard.press('4');page.keyboard.press('4');assert page.evaluate('ShopUI.status().gold')==80
 assert page.evaluate('ShopUI.status().inventory.ribbon')==1
 page.wait_for_timeout(250);assert page.evaluate('ShopUI.status().flight!==null')
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-shop-flight.png'))
 page.keyboard.press('F3');age=page.evaluate('ShopUI.status().flight.age');page.wait_for_timeout(150);assert page.evaluate('ShopUI.status().flight.age')==age;page.keyboard.press('F3')
 page.wait_for_timeout(1500);assert page.evaluate('ShopUI.status().flight===null')
 page.keyboard.press('1');page.keyboard.press('4');assert page.evaluate('ShopUI.status().gold')==80
 assert page.evaluate('ShopUI.status().flight===null')
 assert not page.evaluate('DialogueUI.isOpen')
 assert not errors,errors
 return {'errors':errors,'copies':page.evaluate('SaveUI.status().count'),'version':page.evaluate('LevelData.version')}

def lifecycle(page):
 # Teleporting during a live fuse must cancel every callback of the old fight.
 fight(page);bridge(page,{'enemyHp':150,'suppressLights':True});ticks(page,5.1);bridge(page,{'enemyHp':1,'player':{'u':.24,'v':.8,'jump':0}});ticks(page,1.25);page.keyboard.down('a');page.wait_for_timeout(220);page.keyboard.up('a');assert page.evaluate('BattleUI.status().player.u')>=.22;bridge(page,{'player':{'u':.55,'v':.8,'jump':0}});page.keyboard.press('e');ticks(page,3.5);assert page.evaluate('BattleUI.status().finale.phase')=='fuse'
 warp(page,2);page.evaluate('BattleUI.update(40);GumiEncounter.update(40)');assert not page.evaluate('BattleUI.isOpen||DialogueUI.isOpen||GumiEncounter.defeated||CurtainProgress.passable')
 # F3 above Pause restores interactive gameplay rather than leaving hidden inert UI.
 page.keyboard.press('Escape');assert page.evaluate('PauseUI.isOpen');warp(page,4)
 assert not page.evaluate('spawnStatus().paused||PauseUI.isOpen||document.querySelector("#map").inert')
 old=page.evaluate('spawnStatus().teto.y');page.keyboard.down('w');page.wait_for_timeout(220);page.keyboard.up('w');assert page.evaluate('spawnStatus().teto.y')<old-10
 # A checkpoint on the opened stage remains valid even when the current world is closed.
 ok=page.evaluate("""()=>{const s=SaveModel.clone(captureSnapshot());s.teto={x:768,y:-3330,dir:0};s.miku={x:820,y:-3290,dir:0};s.trail=[s.miku,s.teto];s.gameVersion='0.32';CurtainProgress.restore(false);const valid=SaveModel.valid(s);restoreSnapshot(s);return valid&&CurtainProgress.passable;}""");assert ok
 # The flower retains its seven original attacks and actual five-damage hits, with new immunity.
 page.evaluate("BattleUI.open({id:'flower'})")
 page.evaluate("""()=>{for(let i=0;i<20;i++)BattleUI.advanceStory();for(let i=0;i<25;i++)BattleUI.update(.025);BattleUI.testing({attack:0,player:{u:.5,v:.75,jump:0}})}""")
 state=ticks(page,5.5);assert state['damageEvents']>0 and state['hp']<100 and state['hp']%5==0,state
 assert not state['training'] and not state['trainingInvulnerable']
 assert page.evaluate('BattleRules.settings.invulnerability')==1.5
 # New game also closes the curtain and clears presets/copies without touching settings.
 page.evaluate('GameSettings.setExtraHints(true);startNewGame()')
 assert page.evaluate('!GumiEncounter.defeated&&!CurtainProgress.passable&&SaveUI.status().count===0&&GameSettings.extraHints')
 assert page.evaluate('ShopUI.captureState().gold')==120

def new_attacks(page):
 # Real fan volume: an ordinary hit is ten damage, a jump passes over the same cards.
 fight(page);bridge(page,{'attack':4,'suppressLights':True});ticks(page,2)
 page.evaluate("""()=>{const e=BattleUI.status().attack.entities.find(e=>e.kind==='gumi-spinning-card'&&Math.abs(e.x)<5);BattleUI.testing({player:{u:e.x/12+.5,v:e.y/8,jump:0}})}""")
 state=ticks(page,.025);assert state['hp']==90,state
 assert state['damageSource'].startswith('gumi-card-')
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-card-fans.png'))
 fight(page);bridge(page,{'attack':4,'suppressLights':True});ticks(page,2)
 page.evaluate("""()=>{const e=BattleUI.status().attack.entities.find(e=>e.kind==='gumi-spinning-card'&&Math.abs(e.x)<5);BattleUI.testing({player:{u:e.x/12+.5,v:e.y/8,jump:.31}})}""")
 state=ticks(page,.025);assert state['hp']==100,state
 # Rainbow floor and placards agree. Correct color survives; a wrong color is fatal.
 fight(page);bridge(page,{'attack':5,'suppressLights':True});state=ticks(page,.7)
 assert len(set(state['arena']['cellColors'].values()))==7
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-rainbow-floor.png'))
 page.evaluate("""()=>{const id=BattleUI.status().arena.safeCells[0];BattleUI.testing({player:{...GumiArenaModel.cellCenter(id),jump:0}})}""")
 state=ticks(page,4.4);assert state['hp']==100 and len(state['arena']['temporary'])>0,state
 state=ticks(page,3.6);assert state['phase']=='command' and len(state['arena']['temporary'])==0,state
 fight(page);bridge(page,{'attack':5,'suppressLights':True})
 page.evaluate("""()=>{const id=BattleUI.status().arena.red[0];BattleUI.testing({player:{...GumiArenaModel.cellCenter(id),jump:.31}})}""")
 state=ticks(page,5.1);assert state['hp']==100 and state['phase']=='falling',state
 state=ticks(page,.7);assert state['hp']==0 and state['phase']=='defeat',state
 # Attack seven is simultaneous with a normal volley, visible and collectible during enemy phases.
 fight(page);bridge(page,{'attack':4,'charge':True,'chargeEnergy':45,'suppressLights':True});state=ticks(page,.5)
 assert state['attack']['index']==4 and state['charge']['active'] and len(state['charge']['crystals'])==3
 assert page.locator('#gumi-charge').is_visible()
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-charge.png'))
 pickup=page.evaluate("""()=>{const c=BattleUI.status().charge.crystals[0];BattleUI.testing({player:{u:c.u,v:c.v,jump:0}});const before=BattleUI.status().charge.energy;BattleUI.update(.025);return {before,after:BattleUI.status()}}""")
 state=pickup['after'];assert state['charge']['energy']<pickup['before']-5.8 and state['charge']['collected']>=1,state
 page.keyboard.press('F3');before=page.evaluate('BattleUI.status().charge');page.wait_for_timeout(170);assert page.evaluate('BattleUI.status().charge')==before;page.keyboard.press('F3')
 # A full bar cancels the volley, fires, whites out for two seconds and kills despite protection.
 bridge(page,{'chargeEnergy':99.99});state=ticks(page,.025);assert state['phase']=='overload' and state['charge']['phase']=='fireball',state
 assert state['attack'] is None and state['arena']['lightsSuppressed']
 state=ticks(page,.6);page.screenshot(path=str(ART/'Quiet-Meadow-0.34-gumi-overload.png'))
 ticks(page,.45);assert page.locator('#battle-whiteout').is_visible()
 state=ticks(page,1.2);assert state['hp']>0 and state['phase']=='overload',state
 state=ticks(page,.9);assert state['hp']==0 and state['phase']=='defeat',state
 # Winning threshold takes priority over a live charge and hides the bar/cleans crystals.
 fight(page);bridge(page,{'attack':4,'charge':True,'chargeEnergy':99,'suppressLights':True});bridge(page,{'enemyHp':1})
 state=ticks(page,.1);assert state['phase']=='finale' and not state['charge']['active'] and not state['charge']['crystals']
 assert not page.locator('#gumi-charge').is_visible() and not page.locator('#battle-whiteout').is_visible()
 warp(page,4);assert not page.evaluate('BattleUI.isOpen')

def phase_motion_minimap(page):
 # A whole enemy turn restores MP once. Holding movement in commands/action moves nothing.
 fight(page);bridge(page,{'attack':4,'mp':10,'player':{'u':.5,'v':.95,'jump':0},'cancelCharge':True});ticks(page,.025);bridge(page,{'suppressLights':True})
 state=ticks(page,8.2);assert state['phase']=='command' and state['mp']==15,state
 bridge(page,{'lightAtPlayer':True,'suppressLights':False});before=page.evaluate('BattleUI.status()')
 page.keyboard.down('w');state=ticks(page,1.1);page.keyboard.up('w')
 assert state['player']==before['player'] and state['hp']==before['hp'] and state['arena']==before['arena'],state
 assert state['charge']==before['charge'] and state['mp']==15
 page.evaluate('BattleUI.activate(1)');before=page.evaluate('BattleUI.status()');assert before['phase']=='player' and before['mp']==9
 page.keyboard.down('d');state=ticks(page,.4);page.keyboard.up('d')
 assert state['player']==before['player'] and state['arena']==before['arena'] and state['hp']==before['hp'],state
 ticks(page,.5);bridge(page,{'attack':4,'suppressLights':True,'cancelCharge':True});state=ticks(page,8.2)
 assert state['phase']=='command' and state['mp']==14,state
 bridge(page,{'mp':29,'attack':4,'suppressLights':True,'cancelCharge':True});state=ticks(page,8.2);assert state['phase']=='command' and state['mp']==30,state
 # The first ball is guaranteed to aim at the hero's initial position, then stays dodgeable.
 fight(page);state=bridge(page,{'attack':0,'player':{'u':.3,'v':.8,'jump':0},'suppressLights':True});state=ticks(page,.025)
 aimed=[e for e in state['attack']['entities'] if e['kind']=='gumi-ball-warning' and e.get('targeted')]
 assert len(aimed)==1 and abs(aimed[0]['x']-(.3-.5)*12)<1e-8 and abs(aimed[0]['y']-.8*8)<1e-8,state
 bridge(page,{'player':{'u':.8,'v':.2,'jump':0}});state=ticks(page,.5)
 same=[e for e in state['attack']['entities'] if e['kind']=='gumi-ball-warning' and e.get('targeted')][0]
 assert same['x']==aimed[0]['x'] and same['y']==aimed[0]['y']
 # Five seconds to pick a color, then animated fall; the correct color remains supported.
 fight(page);bridge(page,{'attack':5,'suppressLights':True});state=ticks(page,4.65);assert not state['arena']['temporary'],state
 page.evaluate("""()=>{const id=BattleUI.status().arena.safeCells[0];BattleUI.testing({player:{...GumiArenaModel.cellCenter(id),jump:0}})}""")
 state=ticks(page,.45);assert state['arena']['temporary'] and state['hp']==100,state
 # Actual keyboard jump crosses a 2.4-unit hole; a normal step into it animates below the floor.
 fight(page);bridge(page,{'attack':4,'holes':[12],'player':{'u':.37,'v':.5,'jump':0},'suppressLights':True})
 page.keyboard.down('d');page.keyboard.press('Space');state=ticks(page,.45)
 assert state['hp']==100 and state['player']['z']>1.7 and not state['arena']['body']['falling'],state
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-jump-over-gap.png'))
 state=ticks(page,.47);page.keyboard.up('d');assert state['hp']==100 and state['player']['u']>.6 and state['arena']['body']['grounded'],state
 fight(page);bridge(page,{'attack':4,'holes':[12],'player':{'u':.39,'v':.5,'jump':0},'suppressLights':True})
 page.keyboard.down('d');state=ticks(page,.08);page.keyboard.up('d');assert state['phase']=='falling' and state['hp']==100,state
 state=ticks(page,.27);assert state['player']['z']<-.3 and state['hp']==100,state
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-falling-into-gap.png'))
 state=ticks(page,.6);assert state['hp']==0 and state['phase']=='defeat',state
 # A jump may end after the pattern; commands open only after safe landing.
 fight(page);bridge(page,{'attack':0,'player':{'u':.04,'v':.1,'jump':0},'suppressLights':True});ticks(page,2.15)
 page.keyboard.press('Space');state=ticks(page,.4);assert state['phase']=='enemy' and state['attack']['done'] and state['player']['z']>1,state
 state=ticks(page,.55);assert state['phase']=='command' and state['arena']['body']['grounded'],state
 # Minimap uses actor world positions and follows presets, room changes, progress and modals.
 warp(page,1);page.wait_for_function('MinimapUI.status().visible&&MinimapUI.status().location==="forest"')
 before=page.evaluate('MinimapUI.status().teto');page.keyboard.down('s');page.wait_for_timeout(200);page.keyboard.up('s');after=page.evaluate('MinimapUI.status().teto');assert after['y']>before['y'],(before,after)
 page.keyboard.press('m');assert page.evaluate('MinimapUI.status().folded');assert not page.locator('#minimap-content').is_visible()
 page.keyboard.press('m');page.locator('#minimap-enlarge').click();assert page.evaluate('MinimapUI.status().expanded')
 page.locator('#minimap-enlarge').click();assert not page.evaluate('MinimapUI.status().expanded')
 warp(page,2);page.wait_for_function('MinimapUI.status().visible&&MinimapUI.status().location==="tent-arena"')
 assert any(m['id']=='gumi' and m['kind']=='enemy' for m in page.evaluate('MinimapUI.status().markers'))
 warp(page,4);page.wait_for_timeout(40);assert any(m['id']=='rear' for m in page.evaluate('MinimapUI.status().markers'))
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-minimap-arena.png'))
 page.evaluate('SaveUI.open()');page.wait_for_timeout(30);assert not page.evaluate('MinimapUI.status().visible');page.keyboard.press('Escape')
 page.evaluate("""()=>{const s=captureSnapshot();s.location='meadow';s.teto={x:766,y:810,dir:0};s.miku={x:823,y:855,dir:0};s.trail=[s.miku,s.teto];restoreSnapshot(s);} """)
 page.wait_for_function('MinimapUI.status().visible&&MinimapUI.status().location==="meadow"')
 assert any(m['kind']=='shop' for m in page.evaluate('MinimapUI.status().markers'))
 page.screenshot(path=str(ART/'Quiet-Meadow-0.34-minimap-meadow.png'))
 fight(page);page.wait_for_timeout(40);assert not page.evaluate('MinimapUI.status().visible')
 warp(page,4)

if __name__=='__main__':
 import sys
 offline='--offline' in sys.argv
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1536,'height':1024});page.add_init_script('window.__QM_TEST__=true')
  external=[]
  if offline:
   html=(ROOT/'play.html').read_text()
   def route(req):
    if req.request.url=='http://offline.quiet-meadow.test/play.html':req.fulfill(status=200,content_type='text/html; charset=utf-8',body=html)
    else:external.append(req.request.url);req.abort()
   page.route('**/*',route);page.goto('http://offline.quiet-meadow.test/play.html')
  else:page.goto('http://127.0.0.1:8771/index.html')
  result=run(page);lifecycle(page);new_attacks(page);phase_motion_minimap(page);assert not external,external;assert not result['errors'],result['errors']
  print('PASS '+('OFFLINE' if offline else 'SOURCE'),json.dumps(result,ensure_ascii=False),'lifecycle/cancellation/legacy/flower/reset/cards/rainbow/charge/whiteout/frozen-turn/mp/aimed-ball/jump/fall/minimap OK');browser.close()
