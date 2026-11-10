"""Display contrast, resizing/restored canvas, and real Miku battle integration."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
def step(p,t):return p.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.02)tick(Math.min(.02,s-t));draw();return spawnStatus();}''',t)
def run(p,mode):
 assert p.evaluate('LevelData.version')=='0.53'
 p.evaluate('''()=>{developerWarp('5.4');if(DialogueUI.isOpen)DialogueUI.close(false);HeartQuest.cancel();MikuRupture.cancel();HeartQuest.reachBattle();BattleUI.open({id:'miku',dialogue:[]});DeveloperState.setGod(true);}''');step(p,2.8)
 assert p.locator('.miku-warp-backdrop').count()==1;assert p.locator('.miku-warp-backdrop').is_visible();assert p.evaluate('getComputedStyle(document.querySelector(".miku-warp-backdrop")).imageRendering')=='auto'
 old=(ROOT.parent/'smile-js-052/miku-animated-background.js').read_text().replace('globalThis.MikuAnimatedBackground=', 'globalThis.MikuAnimatedBackgroundBefore=')
 p.add_script_tag(content=old)
 contrast=p.evaluate('''()=>{
  const metrics=canvas=>{const data=canvas.getContext('2d').getImageData(0,0,1536,1024).data;let peak=0,visible=0,sum=0;for(let i=0;i<data.length;i+=4){const l=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];peak=Math.max(peak,l);sum+=l;if(l>=12)visible++;}return {peak,visible,sum};};
  const a=document.createElement('canvas'),b=document.createElement('canvas'),old=MikuAnimatedBackgroundBefore.createRenderer(a),now=MikuAnimatedBackground.createRenderer(b);old.draw(2.8);now.draw(2.8);const before=metrics(a),after=metrics(b),motion=[];for(const t of [0,.5,1.7,3,5.9,6,8.4,11.9]){const patches=now.draw(t);motion.push({time:t,opacity:patches.map(p=>p.opacity)});}return {before,after,motion};}''')
 assert contrast['after']['peak']>contrast['before']['peak']*2.2,contrast
 assert contrast['after']['visible']>contrast['before']['visible']*2,contrast
 assert all(min(item['opacity'])>=.119 for item in contrast['motion'])
 # Background content returns after a backing-store loss, even while the game clock is paused.
 p.keyboard.press('Escape');frozen=p.evaluate('spawnStatus().battle.clock');step(p,1);assert p.evaluate('spawnStatus().battle.clock')==frozen
 recovery=p.evaluate('''()=>{const c=document.querySelector('.miku-warp-backdrop'),g=c.getContext('2d'),sum=()=>g.getImageData(0,0,c.width,c.height).data.reduce((n,v,i)=>n+(i%4===3?0:v),0);const before=sum();g.clearRect(0,0,c.width,c.height);const lost=sum();window.dispatchEvent(new Event('resize'));const resized=sum();g.clearRect(0,0,c.width,c.height);c.dispatchEvent(new Event('contextrestored'));return {before,lost,resized,restored:sum()};}''')
 assert recovery['before']>10000 and recovery['lost']==0 and recovery['resized']==recovery['before'] and recovery['restored']==recovery['before'],recovery
 p.keyboard.press('Escape');p.evaluate('BattleUI.endMikuTurn()');step(p,1.2);assert p.evaluate('spawnStatus().battle.phase')=='command'
 sizes=[];cdp=p.context.new_cdp_session(p)
 for width,height,dpr in [(1920,1080,1),(1280,720,1.25),(2560,1440,2),(1024,768,1)]:
  cdp.send('Emulation.setDeviceMetricsOverride',{'width':width,'height':height,'deviceScaleFactor':dpr,'mobile':False});p.evaluate('window.dispatchEvent(new Event("resize"))');info=p.evaluate('''()=>{const c=document.querySelector('.miku-warp-backdrop'),r=c.getBoundingClientRect(),f=document.querySelector('#battle-scene').getBoundingClientRect(),g=c.getContext('2d'),data=g.getImageData(0,0,c.width,c.height).data;let peak=0;for(let i=0;i<data.length;i+=4)peak=Math.max(peak,data[i+2]);return {width:r.width,height:r.height,sceneWidth:f.width,sceneHeight:f.height,dpr:devicePixelRatio,peak};}''');assert info['width']>500 and abs(info['width']-info['sceneWidth'])<.1 and abs(info['height']-info['sceneHeight'])<.1 and info['peak']>50,info;sizes.append(info)
  if width in [1920,1280]:p.screenshot(path=str(ART/f'{mode}-miku-background-{width}.png'))
 cdp.send('Emulation.clearDeviceMetricsOverride');p.set_viewport_size({'width':1536,'height':1024});step(p,.25);assert p.evaluate('spawnStatus().battle.open');assert p.evaluate('GumiAttacksV2.selection.phaseTwoHoopsWeight')==4
 p.evaluate('BattleUI.open({id:"gumi"})');step(p,.1);assert not p.locator('.miku-warp-backdrop').is_visible();p.evaluate('BattleUI.open({id:"neru"})');step(p,.1);assert p.evaluate('spawnStatus().battle.enemyHp')==600 and p.evaluate('spawnStatus().battle.attack') is None;assert not p.locator('.miku-warp-backdrop').is_visible();p.evaluate('BattleUI.open({id:"miku",dialogue:[]})');step(p,2.8);assert p.locator('.miku-warp-backdrop').count()==1 and p.locator('.miku-warp-backdrop').is_visible()
 return {'contrast':contrast,'pausedContextAndResizeRecovery':recovery,'displaySizes':sizes,'smoothLayer':True,'oneBackgroundLayer':True,'mikuBattlePlayable':True,'gumiAndNeruUnaffected':True}
def launch(mode):
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://miku053.test/index.html'if mode=='source'else'http://miku053.test/Quiet-Meadow-0.53.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='miku053.test'and f.is_relative_to(ROOT)and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);r=run(p,mode);assert not errors,errors;assert not external,external;r.update(errors=errors,externalRequests=external);(ART/f'{mode}-miku-background-report.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(r,ensure_ascii=False));b.close()
if __name__=='__main__':launch(sys.argv[1]if len(sys.argv)>1 else'source')
