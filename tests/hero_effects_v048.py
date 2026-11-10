"""Real tooltip, two-second feedback and actual buff-lifetime regressions."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
from release_v047 import status,steps,story,complete_enemy,bridge,shop,inventory,combat
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';ART.mkdir(exist_ok=True)
def setup(p,encounter,ids):
 p.evaluate('''ids=>{BattleUI.close();ShopUI.close();const w=ShopModel.fresh();w.gold=10000;for(const i of ShopModel.goods)ShopModel.buy(w,i.id);w.loadout.abilities.fill(null);ids.forEach((id,i)=>ShopModel.equip(w,'abilities',id,i));ShopUI.restoreState(w);DeveloperState.setGod(true);}''',ids)
 p.evaluate('id=>BattleUI.open({id,dialogue:[]})',encounter);story(p);steps(p,1.3)
 if encounter=='miku':complete_enemy(p)
 bridge(p,{'hp':20,'mp':25,'castRoll':.5});p.evaluate('BattleUI.activate(0)');p.wait_for_timeout(220)
def cast(p,id):
 row=p.locator('[data-skill="'+id+'"]');row.click();assert not status(p)['heroEffects'];row.click();steps(p,.16)
def icon(p,kind):return p.locator('.hero-effect[data-effect="'+kind+'"]')
def check(p,kind,value):
 b=icon(p,kind);assert b.is_visible();assert value in b.inner_text();b.hover();tip=p.locator('#battle-hero-effect-tooltip');assert tip.is_visible()
 assert p.evaluate('''()=>{const a=document.querySelector('.hero-effect').getBoundingClientRect(),b=document.querySelector('.hero-portrait').getBoundingClientRect();return a.y+a.height<b.y&&Math.abs(a.x-b.x)<2;}''')
 assert value in tip.inner_text();return tip.inner_text()
def effects(p,label):
 report={}
 for enc in ['flower','gumi','miku']:
  checked=[]
  for id,kind,value in [('warm-note','heal','+25'),('second-breath','heal','+50'),('soft-guard','resistance','20%'),('quiet-shell','resistance','40%'),('perfect-accent','critical','К'),('quick-tempo','speed','10%'),('discord','reduction','−2'),('step','dodge','15%')]:
   setup(p,enc,[id,'pulse']);cast(p,id);text=check(p,kind,value)
   image=p.locator('#battle-hero-effect-visuals');assert image.is_visible();before=image.evaluate('c=>c.toDataURL()');steps(p,.2);assert image.evaluate('c=>c.toDataURL()')!=before
   p.evaluate('BattleUI.localPause(true)');paused=status(p);pixels=image.evaluate('c=>c.toDataURL()');steps(p,.4);assert status(p)['heroEffectAnimations']==paused['heroEffectAnimations'] and image.evaluate('c=>c.toDataURL()')==pixels;p.evaluate('BattleUI.localPause(false)')
   steps(p,1.63);assert len(status(p)['heroEffectAnimations'])==1;steps(p,.02);assert not status(p)['heroEffectAnimations'];assert image.is_hidden()
   if kind=='heal':assert icon(p,kind).count()==0
   elif kind=='critical':
    assert icon(p,kind).is_visible();assert p.evaluate('BattleUI.castSkill("pulse").ok');assert icon(p,kind).count()==0
   else:
    assert icon(p,kind).is_visible();p.keyboard.press('1');steps(p,1.1);assert status(p)['phase']=='enemy';assert p.locator('.hero-card').is_visible();assert icon(p,kind).is_visible();icon(p,kind).hover();assert p.locator('#battle-hero-effect-tooltip').is_visible();complete_enemy(p);assert icon(p,kind).count()==0
   checked.append({'skill':id,'kind':kind,'tooltip':text,'animationEndsAt2s':True,'iconUsesBuffLifetime':True})
  # Actual capped healing, unsuccessful healing, consumable restoration and explicit guard.
  setup(p,enc,['second-breath','pulse']);bridge(p,{'hp':92});cast(p,'second-breath');assert status(p)['hp']==100;assert '+8' in icon(p,'heal').inner_text();steps(p,2.1);assert not p.evaluate('BattleUI.castSkill("second-breath").ok');assert not status(p)['heroEffects']
  p.evaluate('BattleUI.closeSkills();BattleUI.activate(1)');bridge(p,{'hp':90,'mp':20});assert p.evaluate('BattleUI.castSkill("herbal").ok');steps(p,.16);assert '+10' in icon(p,'heal').inner_text();steps(p,.3);assert p.evaluate('BattleUI.castSkill("mint").ok');steps(p,.16);assert '+5' in icon(p,'mana').inner_text()
  p.evaluate('BattleUI.closeSkills()');steps(p,2.1);p.evaluate('BattleUI.activate(2)');steps(p,.16);assert '50%' in icon(p,'guard').inner_text();steps(p,2.0);assert not status(p)['heroEffectAnimations'] and icon(p,'guard').is_visible();complete_enemy(p);assert icon(p,'guard').count()==0
  # A representative multi-buff panel, including a tooltip and a persistent portrait.
  setup(p,enc,['quiet-shell','quick-tempo','warm-note']);p.evaluate('BattleUI.castSkill("quiet-shell")');steps(p,.45);p.evaluate('BattleUI.castSkill("quick-tempo")');steps(p,.45);p.evaluate('BattleUI.castSkill("warm-note")');steps(p,.2);assert p.locator('.hero-effect').count()==3;icon(p,'resistance').hover();p.screenshot(path=str(ART/f'{label}-effects-{enc}.png'))
  p.evaluate('BattleUI.close()');assert p.locator('#battle-hero-effects').is_hidden();assert p.locator('#battle-hero-world-effects').is_hidden()
  report[enc]={'skills':checked,'cappedHealing':True,'failedHealNoEffect':True,'consumableActualValues':True,'guardLifetime':True,'multipleIcons':True,'portraitDuringEnemy':True,'pauseFreezesAnimation':True,'clearOnBattleClose':True}
 return report

def launch(mode):
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://effects048.test/index.html' if mode=='source' else 'http://effects048.test/Quiet-Meadow-0.48.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT.parent/'Quiet-Meadow-0.48.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='effects048.test' and f.is_relative_to(ROOT) and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50);assert p.evaluate('LevelData.version')=='0.48';p.evaluate('developerWarp(1)')
  report={'effects':effects(p,mode)}
  if mode=='source':p.evaluate('ShopUI.restoreState(ShopModel.fresh())');report.update(shop=shop(p,mode),inventory=inventory(p,mode),combat=combat(p,mode))
  assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False),flush=True);b.close()
if __name__=='__main__':launch(sys.argv[1] if len(sys.argv)>1 else 'source')
