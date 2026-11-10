"""Local pause overlay, independent double-hit results, and clearing pending input."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
from skill_games_055 import ROOT,ART,BOT,step,prepare,click_cast,auto
url='http://skills-lifecycle055.test/'
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  if r.request.url==url:r.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
  else:external.append(r.request.url);r.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);p.evaluate(BOT);step(p,3.6);p.evaluate('''()=>{while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}}''')
 prepare(p);click_cast(p,'pulse');step(p,.5);p.evaluate('BattleUI.localPause(true)');assert p.locator('#battle-skill-game').evaluate('(e)=>e.inert');z=p.evaluate('''()=>[getComputedStyle(document.querySelector('#battle-pause')).zIndex,getComputedStyle(document.querySelector('#battle-skill-game')).zIndex].map(Number)''');assert z[0]>z[1];frozen=p.evaluate('BattleUI.status().skillChallenge');p.keyboard.press('a');step(p,.5);assert p.evaluate('BattleUI.status().skillChallenge')==frozen;p.evaluate('BattleUI.localPause(false)');assert not p.locator('#battle-skill-game').evaluate('(e)=>e.inert');assert auto(p)['battle']['abilities']['log'][-1]['performance']['quality']=='perfect'
 prepare(p,'double-syllable');click_cast(p,'double-syllable');first=p.evaluate('BattleUI.status().skillChallenge.cues[0]');step(p,.4+first['time']);key={'up':'w','down':'s','left':'a','right':'d'}[first['key']];p.keyboard.press(key);step(p,2.4);s=p.evaluate('BattleUI.status()');r=s['abilities']['log'][-1];assert r['damage']==14 and s['mp']==19 and r['performance']['hits'][0]>=.9 and r['performance']['hits'][1]==0,r
 prepare(p,'soft-guard');click_cast(p,'soft-guard');auto(p);step(p,.5);mp=p.evaluate('BattleUI.status().mp');p.locator('[data-skill=soft-guard]').click();p.locator('[data-skill=soft-guard]').click();assert p.evaluate('BattleUI.status().skillChallenge') is None and p.evaluate('BattleUI.status().mp')==mp
 assert not errors,errors;assert not external,external;report=dict(localPauseAboveChallenge=True,localPauseBlocksInputAndTime=True,resumeWorks=True,doubleHitIndependentInBattle=True,activeBuffRejectsWithoutMana=True,errors=errors,externalRequests=external);(ART/'lifecycle-skills-report.json').write_text(json.dumps(report,indent=2));print('PASS lifecycle',json.dumps(report));b.close()
