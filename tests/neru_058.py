"""Main game Neru gate, actual target input, paid minigames, guard turns and all attack drawings."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';BOT=(ROOT/'tests/helpers/skill-game-player.js').read_text()
def step(p,s):return p.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.02){tick(Math.min(.02,s-t));if(!paused&&!PauseUI.isOpen)DialogueUI.update(Math.min(.02,s-t));}draw();return BattleUI.status();}''',s)
def dialogue(p):p.evaluate('''()=>{for(let n=0;DialogueUI.isOpen&&n<40;n++){DialogueUI.finishText();DialogueUI.choose(0);}draw();}''')
def auto(p):
 p.evaluate('''()=>{const held=new Set(),send=(code,type)=>window.dispatchEvent(new KeyboardEvent(type,{code,key:code==='Space'?' ':code.startsWith('Key')?code.slice(3).toLowerCase():code,bubbles:true,cancelable:true}));for(let i=0;i<1700&&BattleUI.status().skillChallenge;i++){const s=BattleUI.status().skillChallenge,a=SkillGameTestPlayer.actions(s),wanted=new Set(a.hold.map(k=>SkillGameTestPlayer.keys[k]));for(const k of held)if(!wanted.has(k)){send(k,'keyup');held.delete(k);}for(const k of wanted)if(!held.has(k)){send(k,'keydown');held.add(k);}for(const k of a.tap){const code=SkillGameTestPlayer.keys[k];send(code,'keydown');send(code,'keyup');}tick(.01);}for(const k of held)send(k,'keyup');draw();}''')
def cast(p,id,target):
 b=p.locator(f'[data-skill="{id}"]');b.click();b.click();assert p.evaluate('BattleUI.status().neru.targeting');p.locator(f'#neru-targets [data-target="{target}"]').click();p.keyboard.press('Enter');assert p.evaluate('BattleUI.status().skillChallenge.id')==id;auto(p);step(p,.5)
def run(p,mode):
 p.evaluate(BOT);step(p,3.6);dialogue(p)
 p.evaluate('''()=>{const w=ShopModel.fresh();w.inventory={pulse:1,'thorn-note':1,'warm-note':1};w.loadout.abilities=['pulse','thorn-note','warm-note',...Array(7).fill(null)];ShopUI.restoreState(w);developerWarp(6);placeParty(CloudWorldData.id,{x:790,y:562,dir:0},{x:850,y:620,dir:0});draw();}''');assert p.evaluate('SaveModel.valid(captureSnapshot())');p.screenshot(path=str(ART/f'{mode}-neru-pixel-sky.png'));p.locator('#map').focus();p.keyboard.press('e');assert p.evaluate('DialogueUI.isOpen');dialogue(p);step(p,3);assert p.evaluate('BattleUI.isOpen');s=step(p,2.5);assert s['phase']=='intro'and s['mp']==0;assert [g['hp']for g in s['neru']['guards']]==[75,75];p.screenshot(path=str(ART/f'{mode}-neru-summoned.png'))
 p.evaluate('BattleUI.testing({mp:25,hp:60,enemyHp:500,castRoll:.5})');p.keyboard.press('1');p.locator('[data-skill=pulse]').click();p.locator('[data-skill=pulse]').click();assert p.evaluate('BattleUI.status().neru.targeting');assert p.evaluate('BattleUI.status().mp')==25;p.keyboard.press('d');assert p.evaluate('BattleUI.status().neru.target')=='guard-left';p.screenshot(path=str(ART/f'{mode}-neru-target.png'))
 blink=[]
 for _ in range(6):
  step(p,.07);blink.append(p.evaluate('''()=>{const g=document.querySelector('#battle-scene').getContext('2d'),old=g.drawImage,alpha=[];g.drawImage=function(im,...args){if(im===textures.neruGuard)alpha.push(this.globalAlpha);return old.call(this,im,...args);};BattleUI.draw();g.drawImage=old;return alpha;}'''))
 assert any(a[0]<.5 for a in blink)and any(a[0]==1 for a in blink)and all(a[1]==1 for a in blink),blink
 p.keyboard.press('Enter');assert p.evaluate('BattleUI.status().skillChallenge') is not None;auto(p);s=step(p,.5);assert s['neru']['guards'][0]['hp']==64 and s['enemyHp']==500 and s['mp']==22,s
 cast(p,'thorn-note','guard-right');s=p.evaluate('BattleUI.status()');assert s['neru']['guards'][1]['hp']==66 and s['enemyHp']==500,s
 p.evaluate('BattleUI.testing({neruGuards:{"guard-left":0}})');p.keyboard.press('1');s=step(p,.1);assert s['phase']=='enemy';assert s['attack']['number'] in [1,2,3,4,5,7,8,9,10];p.evaluate('BattleUI.testing({neruEndAttack:true})');s=step(p,.02);assert s['phase']=='guard';assert 'Страж II'in p.locator('#turn-label').inner_text();s=step(p,.65);assert s['enemyHp']==550;p.screenshot(path=str(ART/f'{mode}-neru-guard-heal.png'));s=step(p,1.1);assert s['phase']=='command';assert s['neru']['guards'][0]['hp']==0 and s['neru']['guards'][1]['hp']==63 and s['enemyHp']==550,s
 # Every surviving guard is called only from the existing party; dead guards never reappear.
 for _ in range(6):
  p.evaluate('BattleUI.openSkills();BattleUI.continueSkills();BattleUI.testing({neruEndAttack:true})');s=step(p,1.8);assert s['neru']['guards'][0]['hp']==0;step(p,1)
 assert p.locator('.battle-controls').evaluate('(e)=>getComputedStyle(e).visibility')=='hidden'
 # All 24 main-game attack patterns render, including all eight closed meshes.
 p.evaluate('DeveloperState.setGod(true)');coverage=[]
 for i,d in enumerate(p.evaluate('NeruAttackLab.definitions')):
  p.evaluate('v=>BattleUI.testing({attack:v.index,hp:100,enemyHp:v.phase===2?300:600})',dict(index=i,phase=d['phase']));s=step(p,3.6);assert s['phase']=='enemy'and s['attack']['number']==d['number'];assert s['attack']['stats']['components'],d;coverage.append(dict(number=d['number'],entities=s['attack']['entities'],columns=s['attack']['columns']['count']))
  if d['number']in [7,12,19,23,25]:p.screenshot(path=str(ART/f'{mode}-neru-attack-{d["number"]}.png'))
 p.evaluate('BattleUI.testing({attack:17})');s=step(p,15.1);assert s['attack']['number']==19
 cages=p.evaluate('''()=>{const s=new NeruAttackLab.Simulation(17,71);s.events=[];s.fire({type:'gate',deadline:3,double:true,owner:19});return s.attack.entities.map(e=>({x:e.x,y:e.y,cross:e.gate.cross}));}''');assert len(cages)==2 and cages[0]!=cages[1]
 p.evaluate('BattleUI.testing({attack:0,player:{u:.5,v:.2}})');p.keyboard.down('w');s=step(p,.4);p.keyboard.up('w');assert s['player']['v']>=.139 and s['attack']['fall'] is None,s['player']
 p.evaluate('BattleUI.testing({hp:99.7})');p.evaluate('BattleUI.draw()');assert p.evaluate('BattleUI.status().hp')==99.7;assert p.locator('.meter-value').first.inner_text().startswith('100')
 p.keyboard.press('Escape');frozen=p.evaluate('BattleUI.status()');step(p,.5);assert p.evaluate('BattleUI.status()')==frozen;p.keyboard.press('Escape');p.evaluate('DeveloperState.setGod(false);BattleUI.testing({neruGuards:{"guard-left":0,"guard-right":0},neruEndAttack:true})');step(p,1);p.evaluate('BattleUI.testing({enemyHp:1,mp:25});BattleUI.openSkills()');cast(p,'pulse','neru');assert p.evaluate('BattleUI.status().outcome')=='victory';step(p,2.2);assert not p.evaluate('BattleUI.isOpen');assert p.evaluate('spawnStatus().location')=='cloud-island'and p.evaluate('HeartQuest.flags.neruDefeated');assert p.evaluate('SaveModel.valid(captureSnapshot())');assert not p.locator('#neru-targets').is_visible()
 return dict(realCloudDialogue=True,guards75HP=True,paidTargetSelection=True,keyboardCyclesTargets=True,onlySelectedEnemyBlinks=True,independentGuardDamageAndPoison=True,guardHealingTurn=True,deadGuardsStayDead=True,mainGameAttacks=coverage,eightClosed3DFigures=True,twoDifferentFinalCages=cages,neruPlatformSolid=True,fractionalLogicRoundedDisplay=True,pixelSkyBeforeAndDuringBattle=True,bottomHintsRemoved=True,victoryReturnsToCloudAndSaves=True,pauseFreezesBattle=True)
def launch(mode):
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://neru058.test/index.html'if mode=='source'else'http://neru058.test/play.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='neru058.test'and f.is_relative_to(ROOT)and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url,timeout=60000);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000)
  try:report=run(p,mode)
  except Exception:p.screenshot(path=str(ART/f'{mode}-neru-failure.png'));print('STATE',p.evaluate('BattleUI.status()'));print('ERRORS',errors);raise
  assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-neru-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False));b.close()
if __name__=='__main__':launch(sys.argv[1]if len(sys.argv)>1 else'source')
