"""Record the real UI, with normal RAF, from its first opening to accepted order."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time,subprocess,os
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation';video_dir=ART/'video-raw';video_dir.mkdir(exist_ok=True);url='http://guild-video056.test/'
# Reuse the installed encoder in a writable Playwright binary directory.
encoder=ART/'browser-binaries/ffmpeg-1011/ffmpeg-linux';encoder.parent.mkdir(parents=True,exist_ok=True)
if not encoder.exists():encoder.symlink_to('/usr/bin/ffmpeg')
os.environ['PLAYWRIGHT_BROWSERS_PATH']=str(ART/'browser-binaries')
with sync_playwright()as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=b.new_context(viewport={'width':1280,'height':852},device_scale_factor=1,record_video_dir=str(video_dir),record_video_size={'width':1280,'height':852});p=context.new_page();origin=time.monotonic();errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  if r.request.url==url:r.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
  else:external.append(r.request.url);r.abort()
 p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);p.evaluate('''()=>{intro.active=false;introSeen=true;if(DialogueUI.isOpen)DialogueUI.close(false);const q=TownData.guildBoard.approach;placeParty(TownData.id,{...q,dir:0},{x:q.x-65,y:q.y+10,dir:0});GuildBoardUI.reset();notify(TownData.name,1.2);draw();}''');assert p.evaluate('SaveModel.valid(captureSnapshot())');p.locator('#map').focus();p.mouse.move(1160,760);p.wait_for_timeout(250);start=time.monotonic()-origin
 p.wait_for_timeout(1800);p.keyboard.press('e');p.wait_for_function('GuildBoardUI.isOpen');p.wait_for_timeout(2300);p.screenshot(path=str(ART/'video-guild-board.png'))
 poster=p.locator('#guild-gumi-poster').bounding_box();p.mouse.move(poster['x']+poster['width']*.53,poster['y']+poster['height']*.42,steps=24);p.wait_for_timeout(450);p.mouse.click(poster['x']+poster['width']*.53,poster['y']+poster['height']*.42);p.wait_for_function('GuildBoardUI.status().phase==="detail"',polling=25);p.wait_for_timeout(4800);p.screenshot(path=str(ART/'video-guild-inspect.png'))
 accept=p.locator('#guild-accept-order').bounding_box();p.mouse.move(accept['x']+accept['width']*.5,accept['y']+accept['height']*.5,steps=26);p.wait_for_timeout(450);p.mouse.click(accept['x']+accept['width']*.5,accept['y']+accept['height']*.5);p.wait_for_function('GuildBoardUI.capture().gumiAccepted');assert p.evaluate('ShopUI.captureState().gold')==120;p.wait_for_timeout(2200);p.screenshot(path=str(ART/'video-guild-accepted.png'));duration=time.monotonic()-origin-start
 assert p.evaluate('SaveModel.valid(captureSnapshot())');assert p.evaluate('JSON.parse(localStorage.getItem("smile-guild-orders-v1")).gumiAccepted');assert not errors,errors;assert not external,external;path=p.video.path();context.close();b.close()
mp4=ART/'guild-order-demo.mp4';webm=ART/'guild-order-demo.webm'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{start:.3f}','-i',str(path),'-t',f'{duration:.3f}','-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(mp4)],check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{start:.3f}','-i',str(path),'-t',f'{duration:.3f}','-an','-c:v','libvpx-vp9','-b:v','0','-crf','28',str(webm)],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height,codec_name','-of','json',str(mp4)]))
report=dict(realAnimationLoop=True,realKeyboardAndMouse=True,openingAndFivePapers=True,pluckAndInspect=True,acceptOrder=True,statePersisted=True,noEarlyReward=True,seconds=float(probe['format']['duration']),video=mp4.name,resolution=[1280,852],errors=errors,externalRequests=external);(ART/'record-guild-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS video',json.dumps(report,ensure_ascii=False))
