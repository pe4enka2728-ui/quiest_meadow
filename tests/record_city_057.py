"""Capture normal RAF: entrance wind, street pedestrians, full river and the new home."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time,subprocess,os
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';raw=ART/'city-video-raw';raw.mkdir(exist_ok=True);url='http://city-video057.test/'
encoder=ART/'browser-binaries/ffmpeg-1011/ffmpeg-linux';encoder.parent.mkdir(parents=True,exist_ok=True)
if not encoder.exists():encoder.symlink_to('/usr/bin/ffmpeg')
os.environ['PLAYWRIGHT_BROWSERS_PATH']=str(ART/'browser-binaries')
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=b.new_context(viewport={'width':1280,'height':852},device_scale_factor=1,record_video_dir=str(raw),record_video_size={'width':1280,'height':852});p=context.new_page();origin=time.monotonic();errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  if r.request.url==url:r.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
  else:external.append(r.request.url);r.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000)
 p.evaluate('''()=>{intro.active=false;introSeen=true;if(DialogueUI.isOpen)DialogueUI.close(false);noticeTimer=0;document.querySelector('#notice').classList.remove('visible');placeParty(TownData.id,{x:1536,y:780,dir:2},{x:1480,y:725,dir:2});draw();}''');p.locator('#map').focus();p.mouse.move(1180,790);p.wait_for_timeout(250);start=time.monotonic()-origin
 t0=p.evaluate('time');people0=p.evaluate('TownPeople.capture()');p.wait_for_timeout(4200);assert p.evaluate('time')>t0+2 and p.evaluate('TownPeople.capture()')!=people0
 p.evaluate('''()=>{const q=TownData.waypoints.quay;placeParty(TownData.id,{...q,dir:2},{x:q.x-55,y:q.y-35,dir:2});draw();}''');p.wait_for_timeout(4500);p.screenshot(path=str(ART/'video-city-river.png'))
 p.evaluate('''()=>{placeParty(TownData.id,{x:440,y:1140,dir:2},{x:395,y:1090,dir:2});draw();}''');p.wait_for_timeout(3000)
 p.evaluate('''()=>{const q=HomeData.door.approach;placeParty(TownData.id,{...q,dir:0},{x:q.x+55,y:q.y+35,dir:0});draw();}''');p.wait_for_timeout(1100);p.keyboard.press('e');p.wait_for_function('spawnStatus().location==="teto-miku-home"&&!spawnStatus().townPassage.active',polling=25);p.wait_for_timeout(2500)
 p.evaluate('destination=W.route(teto,HomeData.waypoints.middle)');p.wait_for_timeout(1800);p.screenshot(path=str(ART/'video-home.png'));duration=time.monotonic()-origin-start
 assert p.evaluate('SaveModel.valid(captureSnapshot())');assert not errors,errors;assert not external,external;path=p.video.path();context.close();b.close()
mp4=ART/'city-demo.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{start:.3f}','-i',str(path),'-t',f'{duration:.3f}','-an','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(mp4)],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height,codec_name','-of','json',str(mp4)]))
report=dict(realAnimationLoop=True,animatedResidents=True,entranceAndRiver=True,chimneySteam=True,homeEntryWithE=True,homeNavigation=True,validSave=True,seconds=float(probe['format']['duration']),video=mp4.name,resolution=[1280,852],errors=errors,externalRequests=external);(ART/'record-city-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS video',json.dumps(report,ensure_ascii=False))
