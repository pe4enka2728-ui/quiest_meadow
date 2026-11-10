"""Actual town board input, paper flight, acceptance, checkpoint and reward lifecycle."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
def step(p,seconds):
 return p.evaluate('''seconds=>{for(let t=0;t<seconds-1e-8;t+=.02){tick(Math.min(.02,seconds-t));if(!paused&&!PauseUI.isOpen){ShopUI.update(Math.min(.02,seconds-t));DialogueUI.update(Math.min(.02,seconds-t));}}draw();return spawnStatus();}''',seconds)
def clear_intro(p):
 step(p,3.6);p.evaluate('''()=>{while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}draw();}''')
def place(p):
 p.evaluate('''()=>{const q=TownData.guildBoard.approach;placeParty(TownData.id,{...q,dir:0},{x:q.x-65,y:q.y+10,dir:0});draw();}''');assert p.evaluate('SaveModel.valid(captureSnapshot())'),p.evaluate('''()=>({snapshot:captureSnapshot(),zone:W.zone,t:W.blocked(teto.x,teto.y),m:W.blocked(miku.x,miku.y),trail:trail.filter(p=>W.blocked(p.x,p.y))})''')
def inspect(p):
 p.locator('#guild-gumi-poster'if not p.evaluate('GuildBoardUI.capture().gumiAccepted')else'#guild-carried-order').click();step(p,1.2);assert p.evaluate('GuildBoardUI.status().phase')=='detail'
def run(p,mode):
 clear_intro(p);assert p.evaluate('LevelData.version')=='0.58';place(p);initial=p.evaluate('captureSnapshot()');assert p.evaluate('GuildBoardUI.markerVisible');p.screenshot(path=str(ART/f'{mode}-guild-marker.png'));marker=p.evaluate('''()=>{const a=document.createElement('canvas');a.width=80;a.height=100;const g=a.getContext('2d'),hash=t=>{g.clearRect(0,0,80,100);GuildBoardArt.marker(g,t,{x:40,markerY:50});return a.toDataURL();};return hash(.1)!==hash(.6);}''');assert marker
 p.locator('#map').focus();p.keyboard.press('e');step(p,.3);assert p.evaluate('GuildBoardUI.isOpen')and not p.evaluate('GuildBoardUI.markerVisible');assert p.evaluate('GuildBoardUI.capture().seen');assert p.locator('.guild-leaflet:visible').count()==5;assert p.locator('#guild-gumi-poster').is_visible();assert p.evaluate('JSON.parse(localStorage.getItem("smile-guild-orders-v1")).seen');p.screenshot(path=str(ART/f'{mode}-guild-board.png'))
 # Modal keyboard and pointer paths do not move the world or open other menus.
 before=p.evaluate('spawnStatus()');p.keyboard.down('w');step(p,.4);p.keyboard.up('w');p.keyboard.press('i');p.keyboard.press('r');after=p.evaluate('spawnStatus()');assert before['teto']['x']==after['teto']['x']and before['teto']['y']==after['teto']['y'];assert not p.evaluate('InventoryUI.isOpen')and not p.evaluate('ShopUI.isOpen')and not after['intro']['active']
 p.locator('#guild-gumi-poster').click();step(p,.3);s=p.evaluate('GuildBoardUI.status()');assert s['phase']=='plucking'and 310<s['frame']['w']<560;assert p.locator('#guild-accept-order').is_disabled();assert p.locator('.guild-leaflet:visible').count()==4;p.screenshot(path=str(ART/f'{mode}-guild-pluck.png'))
 # Blur uses the existing pause and freezes the complete animation state.
 p.evaluate('window.dispatchEvent(new Event("blur"))');frozen=p.evaluate('GuildBoardUI.status()');step(p,.5);assert p.evaluate('GuildBoardUI.status()')==frozen;assert p.locator('#guild-board').evaluate('(e)=>e.inert');p.keyboard.press('Escape');step(p,1);assert p.evaluate('GuildBoardUI.status().phase')=='detail';bounds=p.locator('#guild-order-detail').bounding_box();assert bounds['y']+bounds['height']<=1024,bounds;assert p.locator('#guild-order-place').inner_text()and p.locator('#guild-order-gold').inner_text()=='150';p.screenshot(path=str(ART/f'{mode}-guild-inspect.png'))
 # Cancel returns the sheet; only seen progress changes until acceptance.
 p.keyboard.press('Escape');step(p,.6);assert p.evaluate('GuildBoardUI.status().phase')=='board';assert p.locator('.guild-leaflet:visible').count()==5;assert not p.evaluate('GuildBoardUI.capture().gumiAccepted');inspect(p);gold=p.evaluate('ShopUI.captureState().gold');p.locator('#guild-accept-order').click();step(p,.35);assert p.evaluate('GuildBoardUI.capture().gumiAccepted');assert p.evaluate('ShopUI.captureState().gold')==gold;assert p.locator('#guild-accept-order').is_disabled();assert p.locator('#guild-accepted-stamp').is_visible();accepted=p.evaluate('captureSnapshot()');assert p.evaluate('s=>SaveModel.valid(s)',accepted);assert accepted['guildOrders']['gumiAccepted'];p.screenshot(path=str(ART/f'{mode}-guild-accepted.png'));assert not p.evaluate('GuildBoardUI.acceptOrClaim().ok')
 p.locator('#guild-inspect-back').click();step(p,.6);assert p.locator('.guild-leaflet:visible').count()==4 and p.locator('#guild-carried-order').is_visible();p.keyboard.press('Escape');assert not p.evaluate('GuildBoardUI.isOpen');assert not p.locator('#map').evaluate('(e)=>e.inert');assert not p.evaluate('GuildBoardUI.markerVisible')
 # Checkpoint and hard reload retain both marker consumption and carried paper.
 p.evaluate('s=>restoreSnapshot(s)',accepted);assert p.evaluate('GuildBoardUI.capture().gumiAccepted');p.reload();p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);clear_intro(p);place(p);assert p.evaluate('GuildBoardUI.capture().gumiAccepted')and not p.evaluate('GuildBoardUI.markerVisible');p.keyboard.press('e');step(p,.3);assert p.locator('.guild-leaflet:visible').count()==4;inspect(p);assert p.locator('#guild-accept-order').is_disabled()
 # Existing boss victory unlocks exactly one real wallet reward at this board.
 p.evaluate('GumiEncounter.restore(true)');step(p,.02);assert p.evaluate('GuildBoardUI.status().order')=='ready';before=p.evaluate('ShopUI.captureState().gold');p.locator('#guild-accept-order').click();step(p,.3);assert p.evaluate('ShopUI.captureState().gold')==before+150;assert p.evaluate('GuildBoardUI.capture().gumiRewarded');assert not p.evaluate('GuildBoardUI.acceptOrClaim().ok');assert p.evaluate('ShopUI.captureState().gold')==before+150;rewarded=p.evaluate('captureSnapshot()');assert p.evaluate('s=>SaveModel.valid(s)',rewarded);p.evaluate('s=>restoreSnapshot(s)',rewarded);assert p.evaluate('GuildBoardUI.status().order')=='rewarded'
 # Loading a real old save supplies default order state; developer rollback stays valid.
 legacy=dict(initial);legacy.pop('guildOrders');legacy['gameVersion']='0.55';p.evaluate('s=>restoreSnapshot(s)',legacy);assert p.evaluate('GuildBoardUI.markerVisible');p.evaluate('s=>restoreSnapshot(s)',rewarded);p.evaluate('developerWarp(2)');assert p.evaluate('SaveModel.valid(captureSnapshot())');assert not p.evaluate('GuildBoardUI.capture().gumiRewarded')and not p.evaluate('GuildBoardUI.isOpen');assert not p.locator('#map').evaluate('(e)=>e.inert')
 # New viewport: all inspection information and acceptance controls remain on screen.
 p.evaluate('s=>restoreSnapshot(s)',initial);p.set_viewport_size({'width':1024,'height':768});p.keyboard.press('e');step(p,.3);inspect(p);box=p.locator('#guild-order-detail').bounding_box();assert box['x']>=0 and box['x']+box['width']<=1024 and box['y']+box['height']<=768,box;p.screenshot(path=str(ART/f'{mode}-guild-responsive.png'));p.keyboard.press('Escape');step(p,.6);p.keyboard.press('Escape');assert not p.evaluate('GuildBoardUI.isOpen')
 return dict(animatedFirstMarker=marker,fiveOverlappingPapers=True,existingGumiPortrait=True,worldInputBlocked=True,paperPluckAndHands=True,pauseFreezesAnimation=True,inspectionContainsLocationRewardAndObjective=True,cancelReturnsPaper=True,acceptPersistsWithoutPayingEarly=True,acceptedPaperCarried=True,checkpointAndReloadPreserveState=True,oneTimeReward=150,legacySave=True,developerRollback=True,responsive=True)
def launch(mode):
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://guild058.test/index.html'if mode=='source'else'http://guild058.test/play.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='guild058.test'and f.is_relative_to(ROOT)and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url,timeout=60000);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);report=run(p,mode);assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-guild-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False));b.close()
if __name__=='__main__':launch(sys.argv[1]if len(sys.argv)>1 else'source')
