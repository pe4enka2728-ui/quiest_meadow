"""Victory, masked suction, hypnosis, continuous camera and a playable cloud world."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';ART.mkdir(exist_ok=True)
def state(p):return p.evaluate('spawnStatus()')
def step(p,s):return p.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.02)tick(Math.min(.02,s-t));draw();return spawnStatus();}''',s)
def dialogue(p):
 p.evaluate('''()=>{for(let i=0;i<24&&DialogueUI.isOpen;i++){DialogueUI.finishText();DialogueUI.choose(0);}}''')
def run(p,label):
 p.evaluate('''()=>{developerWarp('5.4');if(DialogueUI.isOpen)DialogueUI.close(false);HeartQuest.cancel();MikuRupture.cancel();HeartQuest.reachBattle();BattleUI.open({id:'miku',dialogue:[]});DeveloperState.setGod(true);}''');step(p,1.05);p.evaluate('BattleUI.endMikuTurn()');step(p,1.2)
 assert state(p)['battle']['phase']=='command';p.evaluate('BattleUI.testing({enemyHp:1,castRoll:.5});BattleUI.restoreStat("mp");BattleUI.activate(0);BattleUI.castSkill("pulse")');assert state(p)['battle']['phase']=='victory';step(p,1.45)
 s=state(p);assert not s['battle']['open'] and s['location']=='heart-crossroads' and s['mikuAftermath']['active'];assert s['corruption']['hearts']==0
 checkpoint=p.evaluate('captureSnapshot()');assert p.evaluate('SaveModel.valid(captureSnapshot())');copies=s['saves']['count'];step(p,1.15);assert state(p)['mikuAftermath']['phase']=='recovery';assert p.locator('#dialogue-speaker').inner_text()=='Тето'
 p.screenshot(path=str(ART/f'{label}-miku-recovery.png'));dialogue(p);assert state(p)['heartQuest']['flags']['mikuRecovered'];step(p,1.81);assert state(p)['mikuAftermath']['phase']=='portal-talk';p.screenshot(path=str(ART/f'{label}-portal-appears.png'));dialogue(p)
 s=step(p,.9);assert s['mikuAftermath']['phase']=='retreat';assert s['mikuAftermath']['actors'][0]['y']>-2965;step(p,1.05);assert state(p)['mikuAftermath']['phase']=='pull'
 pull=[]
 for t in [.7,1.1,1.5,1.7,.6]:
  s=step(p,t);pull.append(s['mikuAftermath']);p.screenshot(path=str(ART/f'{label}-pull-{len(pull)}.png'))
  assert all(0<=a['scale']<=1.01 and 0<=a['alpha']<=1 for a in s['mikuAftermath']['actors'])
  if len(pull)==2:
   order=p.evaluate('''()=>{const c=document.createElement('canvas');c.width=1536;c.height=1024;const g=c.getContext('2d'),old=g.drawImage,calls=[],clip=g.clip,clips=[];g.drawImage=function(im,...a){if(im.width===1256)calls.push('portal');else if(im.width===24&&im.height===32)calls.push('actor');return old.call(this,im,...a)};g.clip=function(rule){clips.push(rule);return clip.call(this,rule)};MikuAftermath.draw(g,camera.y,time);return {calls,clips};}''')
   assert order['calls'].count('actor')==2 and order['calls'][-1]=='portal' and 'evenodd' in order['clips'],order
   p.keyboard.press('Escape');frozen=state(p)['mikuAftermath'];step(p,1);assert state(p)['mikuAftermath']==frozen;p.keyboard.press('Escape')
 assert pull[-1]['actors'][0]['alpha']==0 and pull[-1]['actors'][1]['alpha']<.02
 age=state(p)['mikuAftermath']['age'];step(p,5.8-age+.001);assert state(p)['mikuAftermath']['phase']=='hypnosis';step(p,4.97);assert state(p)['mikuAftermath']['phase']=='hypnosis';p.screenshot(path=str(ART/f'{label}-hypnosis.png'));step(p,.04);assert state(p)['mikuAftermath']['phase']=='pan';assert state(p)['location']=='cloud-island'
 offsets=[state(p)['mikuAftermath']['panOffset']]
 for _ in range(5):s=step(p,.5);offsets.append(s['mikuAftermath']['panOffset'])
 assert all(a>=b for a,b in zip(offsets,offsets[1:]));p.screenshot(path=str(ART/f'{label}-camera-pan.png'));step(p,.72);assert state(p)['mikuAftermath']['phase']=='sky-open';step(p,1.31);assert state(p)['mikuAftermath']['phase']=='fall'
 falls=[]
 for dt in [.4,.65,.7,.8]:s=step(p,dt);falls.append(s['mikuAftermath']);p.screenshot(path=str(ART/f'{label}-sky-fall-{len(falls)}.png'))
 assert all(falls[i]['actors'][0]['y']<=falls[i+1]['actors'][0]['y'] for i in range(len(falls)-1));step(p,1.3);assert state(p)['mikuAftermath']['phase']=='arrival';dialogue(p);s=state(p);assert not s['mikuAftermath']['active'] and s['location']=='cloud-island' and s['zone']=='cloud-island';assert s['heartQuest']['flags']['cloudReached'];assert s['saves']['count']>=copies+1
 assert p.evaluate('SaveModel.valid(captureSnapshot())');saved=p.evaluate('captureSnapshot()');p.evaluate('s=>restoreSnapshot(s)',saved);assert state(p)['location']=='cloud-island' and not state(p)['mikuAftermath']['active']
 p.screenshot(path=str(ART/f'{label}-cloud-island.png'));before=state(p);p.keyboard.down('d');step(p,.8);p.keyboard.up('d');s=state(p);assert s['teto']['x']>before['teto']['x']+50;assert s['miku']['x']!=before['miku']['x'] or s['miku']['y']!=before['miku']['y'];assert p.evaluate('!SpawnWorld.blocked(teto.x,teto.y)&&!SpawnWorld.blocked(miku.x,miku.y)')
 p.evaluate('''()=>{Object.assign(teto,{x:790,y:585,dir:0});trail=[{x:miku.x,y:miku.y},{x:teto.x,y:teto.y}];interact();}''');assert p.locator('#dialogue-speaker').inner_text()=='Неру';assert state(p)['dialogue']['portrait']['character']=='neru';dialogue(p);assert state(p)['heartQuest']['flags']['neruMet'];assert p.evaluate('SaveModel.valid(captureSnapshot())')
 p.evaluate('developerWarp(1)');assert not state(p)['heartQuest']['flags']['cloudReached'] and not state(p)['mikuAftermath']['active']
 p.evaluate('s=>restoreSnapshot(s)',checkpoint);assert state(p)['mikuAftermath']['active'];p.evaluate('developerWarp(6)');assert state(p)['location']=='cloud-island' and not state(p)['mikuAftermath']['active'];assert p.evaluate('SaveModel.valid(captureSnapshot())')
 p.evaluate('developerWarp(1)');return {'actualVictoryStartsScene':True,'recoveryDialogue':True,'retreatBeforePull':True,'bothSwallowed':True,'frontMaskAndDrawOrder':True,'hypnosisSeconds':5,'smoothCamera':True,'bothFallAndLand':True,'cloudPlayable':True,'mikuFollows':True,'originalNeruAndPortrait':True,'saveLoadCloud':True,'resumePostVictory':True,'developerRewind':True,'pauseFreezesScene':True}
def launch(mode):
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://post049.test/index.html' if mode=='source' else 'http://post049.test/Quiet-Meadow-0.49.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.49.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='post049.test' and f.is_relative_to(ROOT) and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50);assert p.evaluate('LevelData.version')=='0.49';report=run(p,mode);assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-post-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False),flush=True);b.close()
if __name__=='__main__':launch(sys.argv[1] if len(sys.argv)>1 else 'source')
