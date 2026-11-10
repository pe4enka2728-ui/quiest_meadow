"""Exercise portal layering, celestial dialogue and the shared cloud battle, source/offline."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';ART.mkdir(exist_ok=True)
def state(p):return p.evaluate('spawnStatus()')
def step(p,s):return p.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.02)tick(Math.min(.02,s-t));draw();return spawnStatus();}''',s)
def dialogue(p):p.evaluate('''()=>{for(let i=0;i<30&&DialogueUI.isOpen;i++){DialogueUI.finishText();DialogueUI.choose(0);}}''')
def choose_damage(p):
 return p.evaluate('''()=>[...document.querySelectorAll('.battle-skill')].map(e=>e.dataset.skill).find(id=>ShopModel.find(id).hits>0)''')
def run(p,label):
 assert p.evaluate('LevelData.version')=='0.52';assert p.evaluate('GumiAttacksV2.selection.phaseTwoHoopsWeight')==4
 p.evaluate('developerWarp(6);MikuAftermath.resumeCloud()');step(p,4.51);assert state(p)['mikuAftermath']['phase']=='fall'
 layers=[]
 for dt in [.5,.4,.4,.4,.4]:
  step(p,dt)
  layer=p.evaluate('''()=>{const c=document.createElement('canvas');c.width=1536;c.height=1024;const g=c.getContext('2d'),old=g.drawImage,items=[];g.drawImage=function(im,...a){for(const [id,source]of [['neru',textures.neruWorld],['teto',textures.teto_2_7],['miku',textures.mesme_miku_1_7]])if(im===ActorSpriteArt.clean(source))items.push(id);return old.call(this,im,...a)};MikuAftermath.draw(g,camera.y,time);return items;}''')
  assert layer.count('miku')==1 and layer.count('teto')==1 and layer.index('neru')<layer.index('miku'),layer;layers.append(layer)
 p.screenshot(path=str(ART/f'{label}-neru-portal-fall.png'));step(p,1.8);assert state(p)['mikuAftermath']['phase']=='arrival';dialogue(p);assert not state(p)['mikuAftermath']['active'];assert p.evaluate('SaveModel.valid(captureSnapshot())')
 assert p.evaluate('CloudWorldData.columns.length')==4;assert p.evaluate('CloudWorldData.columns.every(c=>SpawnWorld.blocked(c.x,c.y))');p.screenshot(path=str(ART/f'{label}-neru-cloud.png'))
 assert p.evaluate('PreparedNeruArt.frame(0).toDataURL()!==PreparedNeruArt.frame(.9).toDataURL()')
 p.evaluate('Object.assign(teto,{x:790,y:585,dir:0});interact()');assert state(p)['neruEncounter']['phase']=='talk';assert p.locator('#dialogue-speaker').inner_text()=='Неру'
 day=state(p)['neruEncounter']['night'];step(p,6);night=state(p)['neruEncounter']['night'];assert day==0 and night>.999;p.evaluate('DialogueUI.finishText()');p.screenshot(path=str(ART/f'{label}-neru-night-dialogue.png'))
 p.keyboard.press('Escape');before=state(p)['neruEncounter'];step(p,1);assert state(p)['neruEncounter']==before;assert state(p)['pause']['open'];assert p.locator('#pause-save').is_disabled();p.keyboard.press('Escape')
 step(p,6);assert state(p)['neruEncounter']['night']<.001
 lines=[]
 for _ in range(20):
  if not p.evaluate('DialogueUI.isOpen'):break
  lines.append({'speaker':p.locator('#dialogue-speaker').inner_text(),'text':p.locator('#dialogue-text').get_attribute('aria-label')});p.evaluate('DialogueUI.finishText()');p.keyboard.press('Enter')
 assert len(lines)==13 and any('гипноз' in l['text'] for l in lines) and any('уничтожу' in l['text'] for l in lines);assert state(p)['neruEncounter']['phase']=='awakening'
 step(p,1.2);assert .2<state(p)['neruEncounter']['modelBlend']<1;p.screenshot(path=str(ART/f'{label}-neru-awakening.png'));step(p,1.5)
 s=state(p);assert s['battle']['open'] and s['battle']['encounter']=='neru' and s['battle']['phase']=='enemy';assert s['battle']['enemyHp']==600 and s['battle']['mp']==0;assert s['battle']['attack'] is None;assert not s['dialogue']['open']
 snapshot=p.evaluate('captureSnapshot()');assert snapshot['activity']=={'type':'neru-battle','id':'neru'};assert p.evaluate('SaveModel.valid(captureSnapshot())')
 p.keyboard.down('d');before=state(p)['battle']['player']['u'];step(p,.4);p.keyboard.up('d');assert state(p)['battle']['player']['u']>before+.1
 p.keyboard.press('Space');step(p,.2);assert state(p)['battle']['player']['z']>20;step(p,.8);assert state(p)['battle']['player']['z']==0;p.screenshot(path=str(ART/f'{label}-neru-battle-enemy.png'))
 p.keyboard.press('Escape');before=state(p)['battle']['clock'];step(p,.5);assert state(p)['battle']['clock']==before;p.keyboard.press('Escape');step(p,5.5)
 s=state(p);assert s['battle']['phase']=='command' and s['battle']['hp']==100 and s['battle']['mp']==5;assert p.locator('.battle-action[data-action=attack]').is_enabled();p.screenshot(path=str(ART/f'{label}-neru-battle-command.png'))
 p.evaluate('BattleUI.testing({mp:25,castRoll:.5});BattleUI.activate(0)');skill=choose_damage(p);assert skill;row=p.locator('[data-skill="'+skill+'"]');hp=state(p)['battle']['enemyHp'];row.click();assert state(p)['battle']['enemyHp']==hp;assert p.locator('.battle-skill-description').is_visible();row.click();assert state(p)['battle']['enemyHp']<hp;step(p,.08);assert state(p)['battle']['abilities']['effect'];p.screenshot(path=str(ART/f'{label}-neru-battle-skill.png'));p.keyboard.press('1');step(p,.7);assert state(p)['battle']['phase']=='enemy';assert state(p)['battle']['attack'] is None
 # Battle checkpoint returns to this boss, with no old dialogue or foreign attack controller.
 p.evaluate('s=>restoreSnapshot(s)',snapshot);assert state(p)['battle']['encounter']=='neru' and state(p)['battle']['phase']=='enemy';assert state(p)['neruEncounter']['phase']=='battle'
 p.keyboard.press('Escape');p.locator('#pause-exit').click();assert state(p)['pause']['view']=='title';p.locator('#title-continue').click();step(p,.1);assert state(p)['battle']['encounter']=='neru' and state(p)['battle']['open'];step(p,6.8)
 p.evaluate('BattleUI.testing({enemyHp:1,mp:25,castRoll:.5});BattleUI.activate(0)');skill=choose_damage(p);assert skill;p.evaluate('id=>BattleUI.castSkill(id)',skill);assert state(p)['battle']['phase']=='victory';step(p,2.2);assert not state(p)['battle']['open'] and state(p)['location']=='cloud-island';assert state(p)['heartQuest']['flags']['neruDefeated'];assert p.evaluate('SaveModel.valid(captureSnapshot())')
 p.evaluate('developerWarp(1)');assert state(p)['neruEncounter']['phase']=='idle' and not state(p)['heartQuest']['flags']['neruBattleReached'];p.evaluate('developerWarp(6);MikuAftermath.neru();developerWarp(1)');step(p,4);assert not state(p)['battle']['open'] and not state(p)['neruEncounter']['skyActive'];assert p.evaluate('SaveModel.valid(captureSnapshot())')
 return {'flightLayers':layers,'fourColumns':True,'originalRigAnimated':True,'skyDayNightDay':[day,night,0],'dialogueLines':len(lines),'stagedBattle':True,'cloudMovementAndJump':True,'noEnemyAttacks':True,'sharedSkillsAndKey1':True,'pauseFreezesSceneAndBattle':True,'battleSaveLoad':True,'normalReturnAndDeveloperReset':True,'gumiHoopsWeight':4}
def launch(mode):
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://neru052.test/index.html' if mode=='source' else 'http://neru052.test/Quiet-Meadow-0.52.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.52.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='neru052.test' and f.is_relative_to(ROOT) and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50);report=run(p,mode);assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-neru-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False),flush=True);b.close()
if __name__=='__main__':launch(sys.argv[1] if len(sys.argv)>1 else 'source')
