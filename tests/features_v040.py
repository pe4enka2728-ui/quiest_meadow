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
 assert page.locator('#developer-scroll button:not(:disabled)').count()==4
 assert page.locator('#developer-scroll [data-slot="3"]').is_disabled()
 page.locator('#developer-scroll [data-slot="1"]').click()
 assert page.evaluate('spawnStatus().location')=='forest'
 assert page.evaluate('WorldOutcome.flowerDefeated')
 assert page.evaluate('ShopUI.captureState().inventory["golden-key"]')==1
 copies=page.evaluate('SaveUI.status().count');assert copies==1
 fight(page);assert page.evaluate('SaveUI.status().count')==copies+1
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-arena.png'))
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
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-phase-warning.png'))
 # An outer plate starts a visible fall; death occurs below the floor, despite protection.
 fight(page);bridge(page,{'enemyHp':150,'player':{'u':.1,'v':.5,'jump':0},'suppressLights':True})
 state=ticks(page,5.1);assert state['hp']==100 and state['phase']=='falling',state
 ticks(page,.7);assert page.evaluate('BattleUI.status().hp')==0
 ticks(page,3);page.evaluate('DeathReturn.update(1.2)');assert page.evaluate('spawnStatus().location')=='tent-hall'
 assert page.evaluate('DialogueUI.isOpen')
 # Permanent 15-cell layout, and the two-safe-cell attack followed directly by the next attack.
 fight(page);bridge(page,{'enemyHp':150,'suppressLights':True});ticks(page,5.1)
 bridge(page,{'attack':2,'suppressLights':True})
 page.evaluate('''()=>{const id=BattleUI.status().arena.safeCells[0],at=GumiArenaModel.cellCenter(id);BattleUI.testing({player:{...at,jump:0}})}''')
 state=ticks(page,2.05);assert len(state['arena']['temporary'])==13,state['arena']
 assert state['arena']['lightsSuppressed']
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-two-tiles.png'))
 turn=state['turn'];state=ticks(page,3.65);assert state['phase']=='enemy' and state['lastAttack']!=2 and state['turn']==turn,state
 assert len(state['arena']['permanent'])==10
 # Fire hoops: a single five-cell strip, jump through a live hoop with normal collision enabled.
 bridge(page,{'attack':3,'hp':100,'player':{'u':.5,'v':.75,'jump':0},'suppressLights':True})
 state=ticks(page,3.3);assert len(state['arena']['temporary'])==10,state['arena']
 page.keyboard.press('Space');state=ticks(page,.55);assert state['hp']==100,state
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-fire-hoops.png'))
 # Threshold 1 never gives ordinary victory. The actual E interaction starts the fuse.
 bridge(page,{'enemyHp':1,'player':{'u':.5,'v':.8,'jump':0}});state=ticks(page,1.25)
 assert state['phase']=='finale' and state['enemyHp']==1 and not state['outcome']
 assert not any(l['active'] for l in state['arena']['lights'])
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-cannon.png'))
 page.keyboard.press('e');assert page.evaluate('BattleUI.status().finale.phase')=='fuse'
 state=ticks(page,3.7);assert state['finale']['phase']=='fuse'
 state=ticks(page,.4);assert state['finale']['phase']=='shot'
 ticks(page,.7);state=ticks(page,1);assert state['finale']['phase']=='smoke'
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-smoke.png'))
 state=ticks(page,2.1);assert state['finale']['stringsReleased']
 ticks(page,4.8);page.evaluate('GumiEncounter.update(1)');assert page.evaluate('GumiEncounter.defeated')
 page.wait_for_timeout(50);page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-portrait.png'));dialogue_done(page);assert page.evaluate('GumiEncounter.status().phase')=='gift'
 page.evaluate('GumiEncounter.update(.4)');page.screenshot(path=str(ART/'Quiet-Meadow-0.40-wand-flight.png'));page.evaluate('GumiEncounter.update(2);GumiEncounter.update(.5)');assert page.evaluate('CurtainProgress.active')
 assert page.evaluate('ShopUI.captureState().inventory["gumi-wand"]')==1
 page.evaluate('CurtainProgress.update(1.6)');page.screenshot(path=str(ART/'Quiet-Meadow-0.40-curtain-half.png'));page.evaluate('CurtainProgress.update(1.7)');assert page.evaluate('CurtainProgress.passable')
 page.wait_for_timeout(60);page.screenshot(path=str(ART/'Quiet-Meadow-0.40-curtain-open.png'))
 assert page.evaluate('!SpawnWorld.blocked(768,-3360)')
 route=page.evaluate('SpawnWorld.route(spawnStatus().teto,{x:768,y:-3368}).length');assert route>0
 # Walk the actual route rather than teleporting directly to the exit trigger.
 page.locator('#map').click(position={'x':768,'y':232})
 page.wait_for_function('spawnStatus().location==="circus"&&!spawnStatus().rearPassage.active',timeout=12000)
 assert abs(page.evaluate('spawnStatus().teto.y')+1475)<25
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-behind-tent.png'))
 page.keyboard.press('e');page.wait_for_function('spawnStatus().location==="tent-arena"&&!spawnStatus().rearPassage.active')
 # Preset four is a separate save and directly opens the curtain, without replaying victory.
 count=page.evaluate('SaveUI.status().count');warp(page,4)
 assert page.evaluate('GumiEncounter.defeated&&CurtainProgress.passable')
 assert page.evaluate('SaveUI.status().count')==count+1
 # Counter preview -> successful flight -> one charge only. Shop's own interface is preserved.
 page.evaluate('SaveUI.open()');page.keyboard.press('m');assert page.evaluate('ShopUI.isOpen')
 page.keyboard.press('1');page.keyboard.press('1');assert page.evaluate('ShopUI.status().counterItem')=='ribbon'
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-shop-counter.png'))
 page.keyboard.press('4');page.keyboard.press('4');assert page.evaluate('ShopUI.status().gold')==80
 assert page.evaluate('ShopUI.status().inventory.ribbon')==1
 page.wait_for_timeout(250);assert page.evaluate('ShopUI.status().flight!==null')
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-shop-flight.png'))
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
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-card-fans.png'))
 fight(page);bridge(page,{'attack':4,'suppressLights':True});ticks(page,2)
 page.evaluate("""()=>{const e=BattleUI.status().attack.entities.find(e=>e.kind==='gumi-spinning-card'&&Math.abs(e.x)<5);BattleUI.testing({player:{u:e.x/12+.5,v:e.y/8,jump:.31}})}""")
 state=ticks(page,.025);assert state['hp']==100,state
 # Rainbow floor and placards agree. Correct color survives; a wrong color is fatal.
 fight(page);bridge(page,{'attack':5,'suppressLights':True});state=ticks(page,.7)
 assert len(set(state['arena']['cellColors'].values()))==7
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-rainbow-floor.png'))
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
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-charge.png'))
 pickup=page.evaluate("""()=>{const c=BattleUI.status().charge.crystals[0];BattleUI.testing({player:{u:c.u,v:c.v,jump:0}});const before=BattleUI.status().charge.energy;BattleUI.update(.025);return {before,after:BattleUI.status()}}""")
 state=pickup['after'];assert state['charge']['energy']<pickup['before']-5.8 and state['charge']['collected']>=1,state
 page.keyboard.press('F3');before=page.evaluate('BattleUI.status().charge');page.wait_for_timeout(170);assert page.evaluate('BattleUI.status().charge')==before;page.keyboard.press('F3')
 # A full bar cancels the volley, fires, whites out for two seconds and kills despite protection.
 bridge(page,{'chargeEnergy':99.99});state=ticks(page,.025);assert state['phase']=='overload' and state['charge']['phase']=='fireball',state
 assert state['attack'] is None and state['arena']['lightsSuppressed']
 state=ticks(page,.6);page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-overload.png'))
 ticks(page,.45);assert page.locator('#battle-whiteout').is_visible()
 state=ticks(page,1.2);assert state['hp']>0 and state['phase']=='overload',state
 state=ticks(page,.9);assert state['hp']==0 and state['phase']=='defeat',state
 # Winning threshold takes priority over a live charge and hides the bar/cleans crystals.
 fight(page);bridge(page,{'attack':4,'charge':True,'chargeEnergy':99,'suppressLights':True});bridge(page,{'enemyHp':1})
 state=ticks(page,.1);assert state['phase']=='finale' and not state['charge']['active'] and not state['charge']['crystals']
 assert not page.locator('#gumi-charge').is_visible() and not page.locator('#battle-whiteout').is_visible()
 warp(page,4);assert not page.evaluate('BattleUI.isOpen')

def phase_motion(page):
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
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-jump-over-gap.png'))
 state=ticks(page,.47);page.keyboard.up('d');assert state['hp']==100 and state['player']['u']>.6 and state['arena']['body']['grounded'],state
 fight(page);bridge(page,{'attack':4,'holes':[12],'player':{'u':.39,'v':.5,'jump':0},'suppressLights':True})
 page.keyboard.down('d');state=ticks(page,.08);page.keyboard.up('d');assert state['phase']=='falling' and state['hp']==100,state
 state=ticks(page,.27);assert state['player']['z']<-.3 and state['hp']==100,state
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-falling-into-gap.png'))
 state=ticks(page,.6);assert state['hp']==0 and state['phase']=='defeat',state
 # A jump may end after the pattern; commands open only after safe landing.
 fight(page);bridge(page,{'attack':0,'player':{'u':.04,'v':.1,'jump':0},'suppressLights':True});ticks(page,2.15)
 page.keyboard.press('Space');state=ticks(page,.4);assert state['phase']=='enemy' and state['attack']['done'] and state['player']['z']>1,state
 state=ticks(page,.55);assert state['phase']=='command' and state['arena']['body']['grounded'],state
 warp(page,4)
 assert page.locator('#world-minimap').count()==0

def open_console(page):
 if not page.evaluate('DeveloperUI.isOpen'):page.keyboard.press('F3')
 if page.evaluate('DeveloperUI.status().view')!='console':
  if page.evaluate('DeveloperUI.status().view')!='home':page.keyboard.press('Escape')
  page.locator('#developer-console-open').click()
 page.locator('#developer-command').wait_for(state='visible')

def command(page,line,close=True):
 open_console(page);page.locator('#developer-command').fill(line);page.keyboard.press('Enter')
 result=page.evaluate('DeveloperUI.status().lastResult')
 if close and page.evaluate('DeveloperUI.isOpen'):page.keyboard.press('F3')
 return result

def smoke_coverage(page):
 return page.evaluate('''()=>{
  const mask=document.createElement('canvas'),cloud=document.createElement('canvas');for(const c of [mask,cloud]){c.width=1536;c.height=1024;}
  const mg=mask.getContext('2d'),cg=cloud.getContext('2d'),battle=BattleUI.status(),t=battle.clock;
  GumiPoseV2.drawAt(mg,768,421,1.7,t,'puppet',{cutShoulders:battle.arena.cutShoulderStrings,cutAge:battle.arena.phaseAge});
  const body=mg.getImageData(0,0,1536,1024).data,result=[];
  for(const age of [.01,1.5,2.99]){cg.clearRect(0,0,1536,1024);GumiBattleArt.smoke(cg,{phase:'smoke',age,smoke:1},t+age);const smoke=cg.getImageData(0,0,1536,1024).data;let total=0,uncovered=0;
   for(let y=180;y<470;y++)for(let x=600;x<935;x++){const i=(y*1536+x)*4+3;if(body[i]>200){total++;if(smoke[i]<254)uncovered++;}}
   result.push({age,total,uncovered});
  }return result;
 }''')

def console_and_god(page):
 assert page.locator('#world-minimap').count()==0
 # Native text editing, command output, one Enter = one credit operation, help/history/completion.
 before=page.evaluate('ShopUI.captureState().gold');copies=page.evaluate('SaveUI.status().count')
 open_console(page);play=page.evaluate('spawnStatus().playTime');page.locator('#developer-command').fill('');page.keyboard.type('where');page.wait_for_timeout(100)
 assert page.locator('#developer-command').input_value()=='where' and page.evaluate('spawnStatus().playTime')==play
 page.keyboard.press('Control+a');page.keyboard.type('help');page.keyboard.press('Enter')
 assert all(name in page.locator('#developer-console-output').inner_text() for name in ['give_money','god','help','heal','refill_mp','give_key','tp','where','clear'])
 assert command(page,'give_money 500',False)['ok'];assert page.evaluate('ShopUI.captureState().gold')==before+500
 assert command(page,'GoD',False)['ok'];assert page.evaluate('DeveloperState.god')
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-console.png'))
 assert command(page,'god',False)['ok'];assert not page.evaluate('DeveloperState.god')
 for line in ['give_money -3','give_money 1.2','give_money 100001','give_money 3 4','tp 3','unknown <img src=x onerror=alert(1)>']:
  assert not command(page,line,False)['ok'],line
 assert page.evaluate('ShopUI.captureState().gold')==before+500
 assert page.evaluate('SaveUI.status().count')==copies
 page.locator('#developer-command').fill('draft');page.keyboard.press('ArrowUp');assert page.locator('#developer-command').input_value().startswith('unknown');page.keyboard.press('ArrowDown');assert page.locator('#developer-command').input_value()=='draft'
 page.locator('#developer-command').fill('ref');page.keyboard.press('Tab');assert page.locator('#developer-command').input_value()=='refill_mp '
 assert command(page,'help god',False)['ok'];assert not command(page,'heal',False)['ok']
 assert command(page,'clear',False)['clear'];assert page.locator('#developer-console-output pre').count()==0
 # Enter after tp must not leak into the resumed game and accidentally start a dialogue.
 assert command(page,'tp 2')['ok'];page.wait_for_timeout(50)
 assert not page.evaluate('DeveloperUI.isOpen||DialogueUI.isOpen||spawnStatus().paused')
 assert page.evaluate('spawnStatus().location')=='tent-arena' and page.evaluate('SaveUI.status().count')==copies+1
 # Editing money above the shop/inventory refreshes their visible state, preserving the selection.
 page.evaluate('SaveUI.open()');page.keyboard.press('m');assert page.evaluate('ShopUI.isOpen')
 page.keyboard.press('1');page.keyboard.press('1');item=page.evaluate('ShopUI.status().counterItem');gold=page.evaluate('ShopUI.status().gold')
 assert command(page,'give_money 17')['ok'];assert page.evaluate('ShopUI.status().gold')==gold+17 and page.evaluate('ShopUI.status().counterItem')==item
 page.keyboard.press('i');assert page.evaluate('InventoryUI.isOpen');assert command(page,'give_money 3')['ok'];assert int(page.locator('#inventory-gold').inner_text())==gold+20
 page.evaluate('InventoryUI.close();ShopUI.close();SaveUI.close()')
 # Healing and MP work on live combat state through the actual console.
 fight(page);bridge(page,{'hp':21,'mp':2});assert command(page,'heal 20')['ok'];assert page.evaluate('BattleUI.status().hp')==41
 assert command(page,'refill_mp 8')['ok'];assert page.evaluate('BattleUI.status().mp')==10
 assert command(page,'heal')['ok'] and command(page,'refill_mp')['ok'];assert page.evaluate('BattleUI.status().hp===100&&BattleUI.status().mp===30')
 # God on blocks a real 15-damage impact; toggling it off restores that same attack's damage.
 assert command(page,'GOD')['ok'];bridge(page,{'attack':0,'player':{'u':.5,'v':.75,'jump':0},'suppressLights':True,'cancelCharge':True})
 state=ticks(page,1.05);assert state['hp']==100 and state['godMode'] and state['damageEvents']==0,state
 assert command(page,'god')['ok'];bridge(page,{'attack':0,'player':{'u':.5,'v':.75,'jump':0},'suppressLights':True,'cancelCharge':True});state=ticks(page,1.05);assert state['hp']==85 and not state['godMode'],state
 # Three spotlight exposures, which ordinarily bypass hit protection, cannot harm God mode.
 assert command(page,'god on')['ok'];bridge(page,{'hp':100,'enemyHp':150,'turn':14,'player':{'u':.5,'v':.5,'jump':0},'suppressLights':False});ticks(page,.025);bridge(page,{'lightAtPlayer':True})
 state=ticks(page,2.05);assert state['hp']==100 and len([l for l in state['arena']['lights'] if l['active']])==3,state
 assert command(page,'god off')['ok'];state=ticks(page,1.05);assert state['hp']==97,state
 # God rescues a missed floor, including when enabled halfway through a fall.
 fight(page);assert command(page,'god on')['ok'];bridge(page,{'attack':4,'holes':[12],'player':{'u':.5,'v':.5,'jump':0},'suppressLights':True,'cancelCharge':True})
 state=ticks(page,.05);assert state['hp']==100 and state['phase']=='enemy' and state['arena']['body']['grounded'],state
 assert page.evaluate('!BattleUI.status().arena.permanent.includes(GumiArenaModel.cellId(BattleUI.status().player))')
 command(page,'god off');bridge(page,{'player':{'u':.5,'v':.5,'jump':0}});state=ticks(page,.05);assert state['phase']=='falling' and state['hp']==100,state
 command(page,'god on');state=ticks(page,.05);assert state['phase']=='enemy' and state['arena']['body']['grounded'] and state['hp']==100,state
 command(page,'god off');bridge(page,{'player':{'u':.5,'v':.5,'jump':0}});state=ticks(page,.8);assert state['hp']==0 and state['phase']=='defeat',state
 # God survives the full overload sequence, and the fight continues rather than hanging.
 fight(page);command(page,'god on');bridge(page,{'attack':4,'charge':True,'chargeEnergy':99.99,'suppressLights':True,'cancelCharge':False})
 state=ticks(page,.05);assert state['phase']=='overload',state
 state=ticks(page,3.3);assert state['hp']==100 and state['phase']=='command' and not state['charge']['active'],state
 # The larger cloud covers every opaque body pixel until the puppet strings release.
 bridge(page,{'enemyHp':1,'player':{'u':.5,'v':.8,'jump':0}});ticks(page,1.25);page.keyboard.press('e');state=ticks(page,4.7)
 assert state['finale']['phase']=='smoke' and state['finale']['smoke']==1 and not state['finale']['stringsReleased'],state
 coverage=smoke_coverage(page);assert all(s['total']>5000 and s['uncovered']==0 for s in coverage),coverage
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-smoke.png'))
 ticks(page,3);state=page.evaluate('BattleUI.status()');assert state['finale']['stringsReleased']
 assert state['finale']['smoke']>.6
 # The flag survives teleport, is visible on the menu, and resets only for a new game/reload.
 assert command(page,'tp 4')['ok'];assert page.evaluate('DeveloperState.god')
 # Shared God flag also protects the flower's original five-damage patterns.
 warp(page,1);page.evaluate("BattleUI.open({id:'flower'})")
 page.evaluate("""()=>{for(let i=0;i<20;i++)BattleUI.advanceStory();for(let i=0;i<25;i++)BattleUI.update(.025);BattleUI.testing({attack:0,player:{u:.5,v:.75,jump:0}})}""")
 state=ticks(page,5.5);assert state['hp']==100 and state['godMode'],state
 command(page,'god off');bridge(page,{'attack':0});state=ticks(page,5.5);assert state['hp']<100 and not state['godMode'],state
 command(page,'god on');warp(page,4)
 page.keyboard.press('Escape');assert page.evaluate('PauseUI.isOpen');assert command(page,'tp 2')['ok'];assert not page.evaluate('PauseUI.isOpen||DeveloperUI.isOpen||spawnStatus().paused||document.querySelector("#map").inert')
 page.evaluate('startNewGame()');assert not page.evaluate('DeveloperState.god')
 assert command(page,'give_key')['ok'];assert page.evaluate('ShopUI.captureState().inventory["golden-key"]')==1
 command(page,'give_key');assert page.evaluate('ShopUI.captureState().inventory["golden-key"]')==1
 assert page.locator('#world-minimap').count()==0

def world_changes(page):
 # Dialogue portrait is actually rendered on the 32x32 grid with a matching small palette.
 warp(page,2);page.keyboard.press('e');page.evaluate('DialogueUI.finishText()');page.wait_for_timeout(60)
 portrait=page.evaluate("""()=>{const c=document.querySelector('#dialogue-portrait'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data,colors=new Set();for(let i=0;i<data.length;i+=4)colors.add(Array.from(data.slice(i,i+4)).join(','));return {w:c.width,h:c.height,colors:colors.size,pose:DialogueUI.status().portrait,frames:GumiPortrait.frames.map(f=>[f.width,f.height])}}""")
 assert portrait['w']==portrait['h']==32 and portrait['colors']<=20 and portrait['pose']['character']=='gumi',portrait
 assert portrait['pose']['pixelGrid']==32 and len(portrait['frames'])==8,portrait
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-portrait-in-dialogue.png'))
 # Full victory awards the wand once, then starts curved opening; ordinary pauses freeze the flight.
 fight(page);bridge(page,{'enemyHp':1,'player':{'u':.5,'v':.8,'jump':0}});ticks(page,1.25);page.keyboard.press('e');ticks(page,4.7);ticks(page,3.1);ticks(page,1.2)
 relaxed=page.evaluate("""()=>{const c=document.createElement('canvas');c.width=1536;c.height=1024;return GumiPoseV2.drawAt(c.getContext('2d'),768,421,1.7,3,'puppet',{releaseAge:3})}""")
 assert relaxed['left']< -20 and relaxed['right']>100 and relaxed['threadDescent']==0 and relaxed['eyeBlend']==0,relaxed
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-gumi-released.png'))
 ticks(page,4);page.evaluate('GumiEncounter.update(1)');assert page.evaluate('DialogueUI.isOpen')
 assert not page.evaluate('ShopUI.captureState().inventory["gumi-wand"]')
 dialogue_done(page);assert page.evaluate('GumiEncounter.status().phase')=='gift'
 page.evaluate('GumiEncounter.update(.6)');page.keyboard.press('F3');age=page.evaluate('GumiEncounter.status().age');page.wait_for_timeout(140);assert page.evaluate('GumiEncounter.status().age')==age;page.keyboard.press('F3')
 page.evaluate('GumiEncounter.update(1.8);GumiEncounter.update(.5)')
 assert page.evaluate('ShopUI.captureState().inventory["gumi-wand"]')==1
 assert page.evaluate('ShopModel.abilities.find(i=>i.id==="gumi-wand").category')=='magic'
 assert page.evaluate('CurtainProgress.active')
 page.evaluate('CurtainProgress.update(1.6)');page.screenshot(path=str(ART/'Quiet-Meadow-0.40-stage-opening.png'))
 page.evaluate('CurtainProgress.update(1.7)');assert page.evaluate('CurtainProgress.passable')
 page.keyboard.press('i');page.locator('#inventory-list [data-item="gumi-wand"]').click();assert page.locator('#inventory-category').inner_text()=='Магия'
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-wand-inventory.png'));page.keyboard.press('i')
 page.keyboard.press('e');dialogue_done(page);assert page.evaluate('ShopUI.captureState().inventory["gumi-wand"]')==1
 # Real walking reaches the interior trigger before the solid back wall; reentry works automatically.
 assert page.evaluate('SpawnWorld.blocked(768,-3420)')
 page.locator('#map').click(position={'x':768,'y':232})
 page.wait_for_function('spawnStatus().location==="circus"&&!spawnStatus().rearPassage.active',timeout=12000)
 assert page.evaluate('SpawnWorld.blocked(768,-1335)')
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-rear-door-outside.png'))
 page.keyboard.down('s');page.wait_for_function('spawnStatus().location==="tent-arena"&&!spawnStatus().rearPassage.active',timeout=6000);page.keyboard.up('s')
 assert not page.evaluate('SpawnWorld.blocked(spawnStatus().teto.x,spawnStatus().teto.y)')
 # First entrance follows the doorway, not the eye, with only the scripted pair rendered.
 page.evaluate("""()=>{const s=captureSnapshot();s.location='circus';s.flags.gumiDefeated=false;s.flags.gumiWandClaimed=false;s.flags.tentDiscussed=false;s.flags.tentEntered=false;delete s.wallet.inventory['gumi-wand'];s.teto={x:768,y:-960,dir:0};s.miku={x:824,y:-1000,dir:0};s.trail=[s.miku,s.teto];restoreSnapshot(s)}""")
 page.keyboard.press('e');dialogue_done(page);assert page.evaluate('TentJourney.status().phase')=='enter'
 page.evaluate('TentJourney.update(1.3)');assert page.evaluate('spawnStatus().teto.y')>=-1048
 assert page.evaluate('spawnStatus().teto.y')>page.evaluate('CircusData.tent.eye.y')+110
 page.screenshot(path=str(ART/'Quiet-Meadow-0.40-tent-entry.png'))
 page.evaluate('''()=>{for(let i=0;i<1000&&TentJourney.isActive;i++)TentJourney.update(.025)}''')
 assert page.evaluate('TentJourney.status().entered') and page.evaluate('spawnStatus().location')=='tent-arena'
 page.evaluate("""()=>{const s=captureSnapshot();s.location='circus';s.teto={x:768,y:-960,dir:0};s.miku={x:824,y:-1000,dir:0};s.trail=[s.miku,s.teto];restoreSnapshot(s)}""")
 page.keyboard.down('w');page.wait_for_function('TentJourney.status().phase==="enter"',timeout=2500);page.keyboard.up('w')
 assert not page.evaluate('TentJourney.status().first')
 page.evaluate('''()=>{for(let i=0;i<400&&TentJourney.isActive;i++)TentJourney.update(.025)}''');assert page.evaluate('spawnStatus().location')=='tent-hall'
 # All player deaths converge on the nearest memory and the same reassuring conversation.
 fight(page);command(page,'god off');wallet=page.evaluate('ShopUI.captureState()')
 bridge(page,{'hp':5,'attack':0,'player':{'u':.5,'v':.75,'jump':0},'suppressLights':True,'cancelCharge':True});ticks(page,1.1);ticks(page,3)
 assert page.evaluate('spawnStatus().location')=='tent-hall'
 assert page.evaluate('DeathReturn.status().checkpoint.id')=='hall-memory'
 assert page.evaluate('ShopUI.captureState()')==wallet
 page.evaluate('DeathReturn.update(1.1)');assert page.evaluate('DialogueUI.isOpen')
 assert 'кошмар' in page.locator('#dialogue-text').get_attribute('aria-label')
 page.evaluate('DialogueUI.finishText()');page.wait_for_timeout(40);page.screenshot(path=str(ART/'Quiet-Meadow-0.40-crystal-recovery.png'))
 dialogue_done(page);assert not page.evaluate('DeathReturn.isActive')
 old=page.evaluate('spawnStatus().teto.y');page.keyboard.down('s');page.wait_for_timeout(160);page.keyboard.up('s');assert page.evaluate('spawnStatus().teto.y')>old+10
 warp(page,1);page.evaluate("ShopUI.grantItem('gumi-wand');BattleUI.open({id:'flower'})")
 page.evaluate("""()=>{for(let i=0;i<20;i++)BattleUI.advanceStory();for(let i=0;i<25;i++)BattleUI.update(.025);BattleUI.testing({hp:5,attack:0,player:{u:.5,v:.75,jump:0}})}""")
 ticks(page,5.5);ticks(page,3);assert page.evaluate('spawnStatus().location')=='forest'
 assert page.evaluate('DeathReturn.status().checkpoint.id')=='forest-memory'
 assert page.evaluate('ShopUI.captureState().inventory["gumi-wand"]')==1
 page.evaluate('DeathReturn.update(1.1)');dialogue_done(page);assert not page.evaluate('DeathReturn.isActive')
 # Warp/new-game cancellation cannot reopen the old nightmare dialogue later.
 fight(page);bridge(page,{'hp':5,'attack':0,'suppressLights':True,'cancelCharge':True});ticks(page,1.1);ticks(page,3)
 warp(page,4);page.evaluate('DeathReturn.update(20)');assert not page.evaluate('DeathReturn.isActive||DialogueUI.isOpen')

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
  else:page.goto('http://127.0.0.1:8884/index.html')
  from story_v040 import run as story_run
  result=run(page);lifecycle(page);new_attacks(page);phase_motion(page);console_and_god(page);world_changes(page);story_run(page);from trials_v040 import run as hearts_run;result["trials040"]=hearts_run(page);assert not external,external;assert not result['errors'],result['errors']
  print('PASS '+('OFFLINE' if offline else 'SOURCE'),json.dumps(result,ensure_ascii=False),'lifecycle/cancellation/legacy/flower/reset/cards/rainbow/charge/whiteout/frozen-turn/mp/aimed-ball/jump/fall/console/god/smoke/portrait/curved-curtain/doors/wand/respawn/front-exit/rollback/long-road/three-hearts/anchored-miku OK');browser.close()
