"""Check all 17 standalone practice games using only keyboard events."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';BOT=(ROOT/'tests/helpers/skill-game-player.js').read_text()
def launch(live=False):
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://skill-practice055.test/'
  if not live:p.add_init_script('window.requestAnimationFrame=()=>0')
  def route(r):
   if r.request.url==url:r.fulfill(path=str(ROOT/'skill-games-preview.html'),content_type='text/html; charset=utf-8')
   else:external.append(r.request.url);r.abort()
  p.route('**/*',route);p.goto(url);p.evaluate('document.fonts.ready');p.evaluate(BOT);assert p.locator('[data-ability]').count()==17
  if live:
   p.locator('[data-ability=pulse]').click();p.wait_for_function('SkillGamePreview.status().challenge.phase==="play"');p.keyboard.press('Escape');frozen=p.evaluate('SkillGamePreview.status().challenge');p.wait_for_timeout(350);assert p.evaluate('SkillGamePreview.status().challenge')==frozen;p.keyboard.press('Escape');p.wait_for_function('SkillGamePreview.status().challenge.time>.99',polling=5);p.keyboard.press('Space');p.wait_for_function('SkillGamePreview.status().challenge.phase==="done"');r=p.evaluate('SkillGamePreview.status()');assert r['challenge']['result']['quality']in ['good','perfect'];assert not errors,errors;assert not external,external;report=dict(realAnimationLoop=True,realKeyboard=True,pauseFreezesChallenge=True,result=r['challenge']['result'],errors=errors,externalRequests=external);(ART/'live-preview-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS live',json.dumps(report,ensure_ascii=False));b.close();return
  ids=p.locator('[data-ability]').evaluate_all('(items)=>items.map(b=>b.dataset.ability)');results=[]
  for id in ids:
   p.locator(f'[data-ability="{id}"]').click();p.evaluate('''()=>{for(let i=0;i<110;i++)SkillGamePreview.step(.01);}''');p.wait_for_timeout(180);p.screenshot(path=str(ART/f'preview-{id}.png'));p.locator('#lab-retry').click()
   result=p.evaluate('''()=>{const held=new Set(),send=(code,type)=>window.dispatchEvent(new KeyboardEvent(type,{code,bubbles:true,cancelable:true}));for(let i=0;i<600&&SkillGamePreview.status().challenge.phase!=='done';i++){const s=SkillGamePreview.status().challenge,a=SkillGameTestPlayer.actions(s),wanted=new Set(a.hold.map(k=>SkillGameTestPlayer.keys[k]));for(const code of held)if(!wanted.has(code)){send(code,'keyup');held.delete(code);}for(const code of wanted)if(!held.has(code)){send(code,'keydown');held.add(code);}for(const key of a.tap){const code=SkillGameTestPlayer.keys[key];send(code,'keydown');send(code,'keyup');}SkillGamePreview.step(.01);}for(const code of held)send(code,'keyup');return SkillGamePreview.status().challenge.result;}''');assert result['quality']=='perfect',(id,result);results.append(dict(id=id,**result));assert 'Идеально' in p.locator('#lab-summary').inner_text()
  # Repeated same-direction memory input, themes, pause, retry, and viewport containment.
  p.locator('[data-ability=dawn-chorus]').click();p.evaluate('''()=>{for(let i=0;i<100;i++)SkillGamePreview.step(.01);}''');p.keyboard.press('Escape');frozen=p.evaluate('SkillGamePreview.status().challenge');p.evaluate('SkillGamePreview.step(.2)');assert p.evaluate('SkillGamePreview.status().challenge')==frozen;p.keyboard.press('Escape')
  for theme in ['gumi','neru','miku']:
   p.locator(f'[data-theme={theme}]').click();assert p.locator('#battle').get_attribute('data-encounter')==theme;p.screenshot(path=str(ART/f'preview-theme-{theme}.png'))
  p.set_viewport_size({'width':1024,'height':768});p.locator('[data-ability=pulse]').click();p.evaluate('''()=>{for(let i=0;i<80;i++)SkillGamePreview.step(.01);}''');box=p.locator('#battle-skill-game').bounding_box();assert box['x']>=0 and box['x']+box['width']<=1024 and box['y']+box['height']<=768;p.screenshot(path=str(ART/'preview-responsive.png'));assert not errors,errors;assert not external,external;report=dict(abilities=results,themeSwitching=True,pauseAndRetry=True,responsive=True,errors=errors,externalRequests=external);(ART/'preview-skills-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS preview',len(results),'games');b.close()
if __name__=='__main__':launch(len(sys.argv)>1 and sys.argv[1]=='live')
