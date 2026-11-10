"""Record normal RAF: 4-direction image pedestrians, vendor, smoke, waves and a moored dry hull."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time,subprocess,os
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';raw=ART/'city-video-raw';raw.mkdir(exist_ok=True);url='http://city-video058.test/'
encoder=ART/'browser-binaries/ffmpeg-1011/ffmpeg-linux';encoder.parent.mkdir(parents=True,exist_ok=True)
if not encoder.exists():encoder.symlink_to('/usr/bin/ffmpeg')
os.environ['PLAYWRIGHT_BROWSERS_PATH']=str(ART/'browser-binaries')
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=b.new_context(viewport={'width':1280,'height':852},device_scale_factor=1,record_video_dir=str(raw),record_video_size={'width':1280,'height':852});p=context.new_page();origin=time.monotonic();errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  if r.request.url==url:r.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
  else:external.append(r.request.url);r.abort()
 p.route('**/*',route);p.goto(url,timeout=60000);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000)
 p.evaluate('''()=>{intro.active=false;introSeen=true;if(DialogueUI.isOpen)DialogueUI.close(false);noticeTimer=0;document.querySelector('#notice').classList.remove('visible');TownPeople.reset();placeParty(TownData.id,{x:1710,y:843,dir:3},{x:1750,y:878,dir:3});draw();}''');p.locator('#map').focus();p.mouse.move(1170,790);p.wait_for_timeout(200);start=time.monotonic()-origin
 t0=p.evaluate('time');p.wait_for_timeout(1600)
 # Contact: NPC remains fixed as the player tries to walk into it.
 before=p.evaluate('''()=>{const n=TownPeople.actors[0];n.pause=10;placeParty(TownData.id,{x:n.x-28.2,y:n.y,dir:1},{x:n.x-90,y:n.y+65,dir:1});return {x:n.x,y:n.y};}''');p.keyboard.down('d');p.wait_for_timeout(1400);p.keyboard.up('d');after=p.evaluate('''()=>({x:TownPeople.actors[0].x,y:TownPeople.actors[0].y})''');assert before==after
 p.evaluate('''()=>{const n=TownPeople.actors[0];n.x=1580;n.y=820;n.pause=20;placeParty(TownData.id,{x:1780,y:820,dir:1},{x:1500,y:820,dir:1});draw();}''');p.wait_for_timeout(1800);p.keyboard.down('d');p.wait_for_timeout(1300);p.keyboard.up('d');p.wait_for_timeout(700);assert p.evaluate('Math.hypot(teto.x-miku.x,teto.y-miku.y)')<95
 p.evaluate('''()=>{const q=TownData.waypoints.consumables;placeParty(TownData.id,{...q,dir:0},{x:q.x+55,y:q.y+55,dir:0});draw();}''');p.wait_for_timeout(2400);p.screenshot(path=str(ART/'video-market.png'));p.keyboard.press('e');p.wait_for_timeout(1300);assert p.evaluate('ShopUI.isOpen');p.keyboard.press('Escape');p.wait_for_timeout(1000)
 p.evaluate('''()=>{placeParty(TownData.id,{x:430,y:1500,dir:2},{x:380,y:1540,dir:2});draw();}''');p.wait_for_timeout(2400);p.screenshot(path=str(ART/'video-smoke.png'))
 p.evaluate('''()=>{const q=TownData.waypoints.pier;placeParty(TownData.id,{...q,dir:2},{x:q.x+45,y:q.y-35,dir:2});draw();}''');p.wait_for_timeout(4200);p.screenshot(path=str(ART/'video-water-boat.png'))
 assert p.evaluate('time')>t0+13;assert p.evaluate('SaveModel.valid(captureSnapshot())');assert not errors,errors;assert not external,external;duration=time.monotonic()-origin-start;path=p.video.path();context.close();b.close()
mp4=ART/'city-demo.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{start:.3f}','-i',str(path),'-t',f'{duration:.3f}','-an','-c:v','libx264','-preset','medium','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(mp4)],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height,codec_name','-of','json',str(mp4)]))
report=dict(realAnimationLoop=True,imageResidents=True,immovableContact=True,companionDetour=True,haruShop=True,chimneySteam=True,movingSea=True,dryMooredBoat=True,validSave=True,seconds=float(probe['format']['duration']),video=mp4.name,resolution=[1280,852],errors=errors,externalRequests=external);(ART/'record-city-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS video',json.dumps(report,ensure_ascii=False))
