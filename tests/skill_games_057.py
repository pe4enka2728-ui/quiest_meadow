"""Exercise all challenges through real combat buttons and DOM keyboard events."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
BOT=(ROOT/'tests/helpers/skill-game-player.js').read_text()
def step(p,seconds):
 return p.evaluate('''seconds=>{for(let t=0;t<seconds-1e-8;t+=.01)tick(Math.min(.01,seconds-t));draw();return BattleUI.status();}''',seconds)
def prepare(p,id='pulse',encounter='miku',mp=25,hp=10):
 p.evaluate('''({id,encounter})=>{if(BattleUI.isOpen)BattleUI.close();const w=ShopModel.fresh();w.inventory={[id]:1};w.loadout.abilities=[id,...Array(9).fill(null)];ShopUI.restoreState(w);BattleUI.open({id:encounter,dialogue:[]});}''',dict(id=id,encounter=encounter))
 if encounter=='miku':step(p,.93);assert p.evaluate('BattleUI.endMikuTurn()');step(p,1.15)
 elif encounter=='neru':step(p,6.7)
 elif encounter=='gumi':step(p,.8)
 else:
  p.evaluate('''()=>{while(BattleUI.status().phase==='conversation')BattleUI.advanceStory();}''');step(p,1.5)
 assert p.evaluate('BattleUI.status().phase') in ['command','intro'],p.evaluate('BattleUI.status().phase')
 p.evaluate('''({mp,hp})=>{BattleUI.testing({mp,hp,enemyHp:BattleUI.status().encounter==='flower'?150:BattleUI.status().encounter==='gumi'?300:BattleUI.status().encounter==='neru'?600:500,castRoll:.5});BattleUI.openSkills();BattleUI.draw();}''',dict(mp=mp,hp=hp))
 assert p.locator('#battle-skills').is_visible()
def click_cast(p,id):
 b=p.locator(f'[data-skill="{id}"]');b.click();assert p.locator(f'#skill-description-{id}').is_visible();assert p.evaluate('BattleUI.status().skillChallenge') is None;b.click()
 if p.evaluate('BattleUI.status().neru?.targeting||false'):p.keyboard.press('Enter')
def auto(p):
 return p.evaluate('''()=>{const physical=new Set();const send=(code,type)=>window.dispatchEvent(new KeyboardEvent(type,{code,key:code==='Space'?' ':code.startsWith('Key')?code.slice(3).toLowerCase():code,bubbles:true,cancelable:true}));
 let seenResult=false;for(let i=0;i<1600&&BattleUI.status().skillChallenge;i++){
  const s=BattleUI.status().skillChallenge,a=SkillGameTestPlayer.actions(s);if(s.result)seenResult=true;
  const wanted=new Set(a.hold.map(k=>SkillGameTestPlayer.keys[k]));for(const code of physical)if(!wanted.has(code)){send(code,'keyup');physical.delete(code);}for(const code of wanted)if(!physical.has(code)){send(code,'keydown');physical.add(code);}for(const key of a.tap){const code=SkillGameTestPlayer.keys[key];send(code,'keydown');send(code,'keyup');}tick(.01);
 }for(const code of physical)send(code,'keyup');draw();return {battle:BattleUI.status(),seenResult};}''')
def run(p,mode):
 p.evaluate(BOT);step(p,3.6);p.evaluate('''()=>{while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}draw();}''');assert p.evaluate('LevelData.version')=='0.57';results=[]
 for id in p.evaluate('SkillGamesModel.definitions.map(d=>d.id)'):
  prepare(p,id);before=p.evaluate('BattleUI.status()');click_cast(p,id);s=p.evaluate('BattleUI.status()');assert s['skillChallenge']and s['mp']==25 and s['enemyHp']==500;assert p.locator('#battle-lower').evaluate('(e)=>e.inert');assert not p.locator('#battle-skills').is_visible();assert p.locator('[data-action=attack]').is_disabled()
  if id=='pulse':
   step(p,.12);p.keyboard.press('1');assert not p.evaluate('BattleUI.status().continueQueued');p.keyboard.press('Enter');assert p.evaluate('BattleUI.status().skillChallenge') is not None;p.keyboard.press('Escape');frozen=p.evaluate('BattleUI.status().skillChallenge');step(p,1);assert p.evaluate('BattleUI.status().skillChallenge')==frozen;p.keyboard.press('Escape');assert not p.evaluate('PauseUI.isOpen')
  out=auto(p);s=out['battle'];assert out['seenResult'];assert s['skillChallenge'] is None and s['phase']=='command';assert s['clock']==before['clock'];r=s['abilities']['log'][-1];assert r['performance']['quality']=='perfect',(id,r);item=p.evaluate('id=>ShopModel.find(id)',id);expected=25-item['mana']+(1 if item.get('target')=='hero'else 0);assert s['mp']==expected,(id,s['mp'],expected);assert len(s['abilities']['log'])==1;assert p.locator('#battle-skills').is_visible();assert 'Идеально' in p.locator('#battle-skill-log').inner_text()
  if item.get('target')=='hero':
   assert s['enemyHp']==500
   if item.get('heal'):assert s['hp']==10+item['heal']
   step(p,2.2)
   if item.get('heal'):assert not any(e['kind']=='heal'for e in p.evaluate('BattleUI.status().heroEffects'))
   else:assert any(e['persistent']for e in p.evaluate('BattleUI.status().heroEffects'))
  else:
   assert s['enemyHp']<500;step(p,.06);assert any(p.evaluate('BattleUI.status().abilities.enemyOffset'))
  results.append(dict(id=id,quality=r['performance']['quality'],mp=s['mp'],damage=r['damage']))
  if id=='pulse':p.keyboard.press('1');assert p.evaluate('BattleUI.status().continueQueued');step(p,.5);assert not p.evaluate('BattleUI.status().skillMenu');assert p.evaluate('BattleUI.status().phase')=='platform-in'
 # A weak execution affects real damage; ideal input bypasses the original random miss.
 prepare(p);click_cast(p,'pulse');step(p,3.9);s=p.evaluate('BattleUI.status()');assert s['abilities']['log'][-1]['performance']['quality']=='weak'and s['enemyHp']==494 and s['mp']==22
 prepare(p);p.evaluate('BattleUI.testing({castRoll:.999})');click_cast(p,'pulse');auto(p);assert p.evaluate('BattleUI.status().enemyHp')==489
 # Insufficient mana / full HP reject before starting a game and spend nothing.
 prepare(p,'pulse',mp=0);click_cast(p,'pulse');assert p.evaluate('BattleUI.status().skillChallenge') is None and p.evaluate('BattleUI.status().mp')==0
 prepare(p,'warm-note',hp=100);click_cast(p,'warm-note');assert p.evaluate('BattleUI.status().skillChallenge') is None and p.evaluate('BattleUI.status().mp')==25
 # Closing and restarting a battle discards the uncommitted challenge.
 prepare(p);click_cast(p,'pulse');p.evaluate('BattleUI.close()');step(p,1);assert not p.locator('#battle-skill-game').is_visible();prepare(p);assert p.evaluate('BattleUI.status().skillChallenge') is None
 # Each encounter uses the same game, matches its panel palette, and accepts the result.
 themes=[]
 for encounter in ['flower','gumi','neru','miku']:
  prepare(p,encounter=encounter);click_cast(p,'pulse');step(p,.9);p.wait_for_timeout(180);p.screenshot(path=str(ART/f'{mode}-skill-{encounter}.png'));info=p.locator('#battle-skill-game').evaluate('(e)=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}})');assert info['rect']['x']>=0 and info['rect']['x']+info['rect']['w']<=1536 and info['rect']['y']+info['rect']['h']<797,info;themes.append(dict(encounter=encounter,**info));auto(p);assert p.evaluate('BattleUI.status().abilities.log.at(-1).performance.quality')=='perfect'
 # Touch controls and compact layout still function in a smaller viewport.
 p.set_viewport_size({'width':1024,'height':768});prepare(p);click_cast(p,'pulse');step(p,1.2);button=p.locator('#skill-game-controls [data-control=confirm]');button.click();auto(p);assert p.evaluate('BattleUI.status().abilities.log.at(-1).performance.quality')=='perfect';p.screenshot(path=str(ART/f'{mode}-skills-responsive.png'))
 return dict(abilities=results,pauseFreezesChallenge=True,battleClockFrozen=True,modalBlocksContinueAndOtherActions=True,ratingsChangeActualDamage=True,perfectGuaranteesHit=True,invalidCastSpendsNothing=True,closeCancelsPendingCast=True,healFeedbackExpiresBuffIconPersists=True,themes=themes,touchControls=True,responsive=True)
def launch(mode):
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://skills057.test/index.html'if mode=='source'else'http://skills057.test/play.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='skills057.test'and f.is_relative_to(ROOT)and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);report=run(p,mode);assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-skill-games-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False));b.close()
if __name__=='__main__':launch(sys.argv[1]if len(sys.argv)>1 else'source')
