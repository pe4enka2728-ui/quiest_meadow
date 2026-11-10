"""Inspect actual mini-game pixels: FNF palette, passed-note opacity and yellow pulse sparks."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,base64
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';url='http://skill-art057.test/'
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  if r.request.url==url:r.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
  else:external.append(r.request.url);r.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000)
 result=p.evaluate('''()=>{const c=document.createElement('canvas');c.width=512;c.height=180;const g=c.getContext('2d'),at=(id,time)=>{const r=new SkillGamesModel.Run(id,()=>.1);while(r.time<time-1e-8)r.step(Math.min(.005,time-r.time));return r;},colored=()=>{const a=g.getImageData(0,0,512,180).data;let n=0;for(let k=0;k<a.length;k+=4)if(Math.max(a[k],a[k+1],a[k+2])-Math.min(a[k],a[k+1],a[k+2])>45)n++;return n;};const double=at('double-syllable',.05);SkillGamesArt.paint(g,double,'flower');const normalColor=colored(),normal=c.toDataURL().split(',')[1];SkillGamesArt.paint(g,double,'miku');const monoColor=colored(),mono=c.toDataURL().split(',')[1];const passed=at('double-syllable',.84);SkillGamesArt.paint(g,passed,'flower');const passedStem=Array.from(g.getImageData(59,98,1,1).data);const pulse=at('pulse',.8);pulse.down('confirm');pulse.up('confirm');pulse.step(.05);SkillGamesArt.paint(g,pulse,'miku');const a=g.getImageData(0,0,512,180).data;let yellow=0;for(let k=0;k<a.length;k+=4)if(a[k]>180&&a[k+1]>140&&a[k+2]<130)yellow++;const sparks=c.toDataURL().split(',')[1];const tempo=at('quick-tempo',.05);SkillGamesArt.paint(g,tempo,'flower');const tempoData=c.toDataURL().split(',')[1];return {normalColor,monoColor,passedStem,yellow,images:{'fnf-double-color':normal,'fnf-double-miku':mono,'pulse-yellow-sparks':sparks,'fnf-tempo':tempoData}};}''')
 assert result['normalColor']>100 and result['monoColor']==0,result;assert 60<result['passedStem'][1]<110,result;assert result['yellow']>25,result
 for name,data in result.pop('images').items():(ART/f'{name}.png').write_bytes(base64.b64decode(data))
 assert not errors,errors;assert not external,external;result.update(errors=errors,externalRequests=external);(ART/'skill-art-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('PASS',result);b.close()
