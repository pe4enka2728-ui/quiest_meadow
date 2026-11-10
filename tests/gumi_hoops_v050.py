"""Verify actual phase-two dispatch, active hoops, strip restoration and no repetition."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';ART.mkdir(exist_ok=True)
def status(p):return p.evaluate('BattleUI.status()')
def step(p,s):return p.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.02)BattleUI.update(Math.min(.02,s-t));BattleUI.draw();return BattleUI.status();}''',s)
def run(p,label):
 assert p.evaluate('LevelData.version')=='0.50';assert p.evaluate('GumiAttacksV2.selection.phaseTwoHoopsWeight')==4
 p.evaluate('''()=>{developerWarp(2);BattleUI.open({id:'gumi'});DeveloperState.setGod(true);window.__hoopChoices=[];window.__oldGumiChoose=GumiAttacksV2.choose;GumiAttacksV2.choose=(previous,random,phase)=>{const chosen=__oldGumiChoose(previous,()=>.51,phase);__hoopChoices.push({previous,phase,chosen});return chosen;};BattleUI.testing({enemyHp:150,cancelCharge:true});}''')
 assert status(p)['phase']=='phase-two';s=step(p,5.05);assert s['attack']['id']=='fire-hoops';assert s['arena']['temporaryMode']=='strip';assert s['arena']['permanent'] and len(s['arena']['permanent'])==10
 s=step(p,2.0);assert any(e['kind']=='gumi-fire-hoop' and e['active'] for e in s['attack']['entities']);p.screenshot(path=str(ART/f'{label}-gumi-hoops.png'))
 p.evaluate('''()=>{for(let i=0;i<1200&&BattleUI.status().phase!=='command';i++)BattleUI.update(.02);BattleUI.draw();}''');assert status(p)['phase']=='command';assert status(p)['arena']['temporaryMode'] is None
 step(p,.7);p.evaluate('BattleUI.continueSkills()');s=status(p);assert s['attack']['id']!='fire-hoops'
 p.evaluate('''()=>{for(let i=0;i<1200;i++){BattleUI.update(.02);const s=BattleUI.status();if(s.attack?.id==='fire-hoops'||s.phase==='command')break;}BattleUI.draw();}''');s=status(p)
 if s['phase']=='command':step(p,.7);p.evaluate('BattleUI.continueSkills()');s=status(p)
 assert s['attack']['id']=='fire-hoops';choices=p.evaluate('__hoopChoices');assert len(choices)>=3;assert all(a['chosen']!=b['chosen'] for a,b in zip(choices,choices[1:]));assert all(c['phase']==2 for c in choices)
 counts=p.evaluate('''()=>{const counts=Array(6).fill(0);for(let n=0;n<8000;n++)counts[__oldGumiChoose(0,()=>(n+.5)/8000,2)]++;return counts;}''');assert counts[3]==4000 and counts[0]==0
 p.evaluate('GumiAttacksV2.choose=__oldGumiChoose;BattleUI.close();developerWarp(6)');assert p.evaluate('spawnStatus().location')=='cloud-island';assert p.evaluate('SaveModel.valid(captureSnapshot())')
 return {'secondPhaseOdds':.5,'firstEligibleOddsWithoutPrevious':4/9,'nativeDispatch':choices,'activeHoops':True,'stripRestored':True,'noConsecutiveRepeat':True,'cloudAndSaveRetained':True,'sampleCounts':counts}
def launch(mode):
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://hoops050.test/index.html' if mode=='source' else 'http://hoops050.test/Quiet-Meadow-0.50.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.50.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='hoops050.test' and f.is_relative_to(ROOT) and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50);report=run(p,mode);assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-hoops-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False),flush=True);b.close()
if __name__=='__main__':launch(sys.argv[1] if len(sys.argv)>1 else 'source')
