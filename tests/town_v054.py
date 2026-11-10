"""Walk into town, buy at all stalls, save, teleport, follow camera, and pause live art."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
def state(p):return p.evaluate('spawnStatus()')
def step(p,seconds):
 return p.evaluate('''seconds=>{for(let t=0;t<seconds-1e-8;t+=.02){const dt=Math.min(.02,seconds-t);tick(dt);if(!paused&&!PauseUI.isOpen&&!InventoryUI.isOpen){if(ShopUI.isOpen)ShopUI.update(dt);if(DialogueUI.isOpen)DialogueUI.update(dt);}}draw();return spawnStatus();}''',seconds)
def place(p,name):
 p.evaluate('''name=>{const q=TownData.waypoints[name];placeParty(TownData.id,{...q,dir:0},{x:q.x+54,y:q.y+66,dir:0});draw();}''',name)
 assert p.evaluate('SaveModel.valid(captureSnapshot())'),name

def region(p,x,y,w,h):
 return p.evaluate('''r=>{const c=document.querySelector('#map'),g=c.getContext('2d');return Array.from(g.getImageData(Math.round(r[0]-camera.x),Math.round(r[1]-camera.y),r[2],r[3]).data).reduce((hash,v)=>Math.imul(hash^v,16777619)>>>0,2166136261);}''',[x,y,w,h])

def run(p,label):
 assert p.evaluate('LevelData.version')=='0.54';step(p,3.6);p.evaluate('''()=>{while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}draw();}''');s=state(p);assert s['location']=='meadow'and s['teto']['x']==766 and s['teto']['y']==810;assert p.evaluate('SaveModel.valid(captureSnapshot())');old=p.evaluate('captureSnapshot()');p.screenshot(path=str(ART/f'{label}-meadow-spawn.png'))
 # Walk south and pause in the middle of the fade, before changing collision zones.
 p.locator('#map').focus();p.keyboard.down('s');step(p,1.2);p.keyboard.up('s');assert state(p)['townPassage']['active'];p.keyboard.press('Escape');frozen=state(p)['townPassage'];assert p.locator('#pause-save').is_disabled();step(p,.5);assert state(p)['townPassage']==frozen;p.keyboard.press('Escape');step(p,1.25);assert state(p)['location']=='starter-town'and not state(p)['townPassage']['active'];assert state(p)['town']['width']==3072 and state(p)['town']['height']==2048;assert len(state(p)['town']['stalls'])==3 and state(p)['town']['birdPerches']>=5;assert p.evaluate('SaveModel.valid(captureSnapshot())');p.screenshot(path=str(ART/f'{label}-town-entry.png'))
 # Camera follows both axes and cursor coordinates include its scrolling offset.
 place(p,'fountain');before=state(p);p.keyboard.down('d');step(p,1);p.keyboard.up('d');assert state(p)['camera']['x']>before['camera']['x']+80
 place(p,'fountain');before=state(p);p.keyboard.down('s');step(p,1.1);p.keyboard.up('s');assert state(p)['camera']['y']>before['camera']['y']+80
 place(p,'fountain');s=state(p);target={'x':s['teto']['x']+65,'y':s['teto']['y']+45};box=p.locator('#map').bounding_box();px=box['x']+(target['x']-round(s['camera']['x']))/1536*box['width'];py=box['y']+(target['y']-round(s['camera']['y']))/1024*box['height'];p.mouse.click(px,py);assert state(p)['destination']>0;step(p,1.1);assert abs(state(p)['teto']['x']-target['x'])<2 and abs(state(p)['teto']['y']-target['y'])<2
 # All named solid footprints block; walking to all important interactions really succeeds.
 navigation=p.evaluate('''()=>{const out=[];for(const [name,q]of Object.entries(TownData.waypoints)){const start={...TownData.spawn},begin=performance.now(),path=SpawnWorld.route(start,q);for(const leg of path)SpawnWorld.move(start,leg.x-start.x,leg.y-start.y);out.push({name,legs:path.length,ms:performance.now()-begin,distance:Math.hypot(start.x-q.x,start.y-q.y),blocked:SpawnWorld.blocked(start.x,start.y)});}return out;}''');assert all(x['legs']and x['distance']<1 and not x['blocked']for x in navigation),navigation
 # Haru stands behind the middle counter, animates using the current NPC sprite, and all categories sell goods.
 purchases=[]
 for name,item,category in [('equipment','ribbon','equipment'),('consumables','herbal','consumables'),('abilities','step','magic')]:
  place(p,name);pose=p.evaluate('ActorMotion.pose(TownData.vendor,time)');step(p,.4);assert p.evaluate('ActorMotion.pose(TownData.vendor,time)')!=pose;p.keyboard.press('e');assert state(p)['shop']['open']and state(p)['shop']['category']==category and state(p)['shop']['vendor']=='Хару';assert p.locator('#shop-title').inner_text()=='Лавка Хару'
  before=state(p)['shop']['gold'];p.locator(f'[data-item="{item}"]').click();p.locator('#shop-replies button').first.click();step(p,1.4);assert state(p)['shop']['inventory'].get(item,0)>=1;assert state(p)['shop']['gold']<before
  if category=='consumables':
   assert p.locator('[data-item=herbal]').is_enabled();p.locator('[data-item=herbal]').click();p.locator('#shop-replies button').first.click();step(p,1.4);assert state(p)['shop']['inventory']['herbal']==2
  else:
   assert p.locator(f'[data-item="{item}"]').is_disabled();assert 'Приобретено'in p.locator(f'[data-item="{item}"]').inner_text()
  purchases.append({'category':category,'item':item,'gold':state(p)['shop']['gold']});p.screenshot(path=str(ART/f'{label}-shop-{category}.png'));p.keyboard.press('Escape');step(p,1.0);assert not state(p)['shop']['open'];assert p.evaluate('SaveModel.valid(captureSnapshot())')
 assert state(p)['shop']['gold']==11
 place(p,'consumables');step(p,3.3);p.screenshot(path=str(ART/f'{label}-town-market.png'))
 # Foreground order is verified on both sides of a real tree and at Haru's counter.
 layer_cases=[]
 for x,y,behind in [(2024,1350,True),(1950,1460,False)]:
  order=p.evaluate('''v=>{placeParty(TownData.id,{x:v[0],y:v[1],dir:2},{x:1536,y:334,dir:2});const g=document.querySelector('#map').getContext('2d'),old=g.drawImage,tree=TownArt.props.find(p=>p.id==='round-lower').image,hero=Array.from({length:12},(_,i)=>ActorSpriteArt.clean(textures['teto_2_'+i])),calls=[];g.drawImage=function(im,...args){if(im===tree)calls.push('tree');if(hero.includes(im))calls.push('teto');return old.call(this,im,...args)};draw();g.drawImage=old;return calls;}''',[x,y]);assert 'tree'in order and 'teto'in order;assert (order.index('teto')<order.index('tree'))==behind,order;layer_cases.append(order)
 place(p,'consumables')
 counter_order=p.evaluate('''()=>{const g=document.querySelector('#map').getContext('2d'),old=g.drawImage,calls=[];g.drawImage=function(im,...args){if(im===SceneArt.layers.shop.canvas)calls.push('stall');if(im===textures.haku)calls.push('haru');if(im===SceneArt.layers.counter.canvas)calls.push('counter');return old.call(this,im,...args)};draw();g.drawImage=old;return calls;}''');assert counter_order==['stall','counter','stall','haru','counter','stall','counter'],counter_order
 # Rendered fountain, water, boat and crystals change with the game clock.
 place(p,'fountain');a=region(p,1472,786,264,318);step(p,.45);assert region(p,1472,786,264,318)!=a;p.screenshot(path=str(ART/f'{label}-town-fountain.png'))
 place(p,'pier');boat=state(p)['town']['boat'];a=region(p,2000,1950,200,80);step(p,.5);assert state(p)['town']['boat']!=boat and region(p,2000,1950,200,80)!=a;p.screenshot(path=str(ART/f'{label}-town-pier.png'))
 place(p,'portal');a=region(p,2694,910,64,118);step(p,.5);assert region(p,2694,910,64,118)!=a;p.screenshot(path=str(ART/f'{label}-town-portal.png'))
 birds=p.evaluate('''()=>{const p=TownArt.perches[0],t=1-p.offset;return [WorldBirds.state(p,t),WorldBirds.state(p,t+.3)];}''');assert birds[0]['phase']=='landing'and birds[0]['x']!=birds[1]['x']
 p.keyboard.press('Escape');frozen=state(p)['town'];frozen_cam=state(p)['camera'];step(p,.8);assert state(p)['town']==frozen and state(p)['camera']==frozen_cam;assert p.locator('#pause-save').is_enabled();p.keyboard.press('Escape')
 # A town checkpoint beyond the former width restores exact positions, wallet and camera.
 checkpoint=p.evaluate('captureSnapshot()');assert checkpoint['teto']['x']>1536;assert p.evaluate('SaveUI.saveNow("Город · проверка").ok');p.evaluate('placeParty("meadow",{x:766,y:810,dir:0},{x:823,y:855,dir:0})');p.evaluate('s=>restoreSnapshot(s)',checkpoint);assert state(p)['location']=='starter-town';assert state(p)['teto']['x']==checkpoint['teto']['x'];assert state(p)['camera']['x']>0 and state(p)['shop']['gold']==11;assert p.evaluate('SaveModel.valid(captureSnapshot())')
 # The live portal returns to the meadow with progress intact, with no intro reset.
 p.keyboard.press('e');assert p.evaluate('DialogueUI.isOpen');p.evaluate('DialogueUI.finishText()');p.keyboard.press('Enter');assert state(p)['townPassage']['active']and state(p)['townPassage']['kind']=='portal';step(p,1.15);s=state(p);assert s['location']=='meadow'and s['camera']['x']==0 and s['camera']['y']==0 and s['introSeen'];assert s['shop']['gold']==11 and s['shop']['inventory']['herbal']==2;assert p.evaluate('SaveModel.valid(captureSnapshot())')
 # Both walking directions remain available after using the portal.
 step(p,1.1);p.keyboard.down('s');step(p,1.6);p.keyboard.up('s');step(p,1.1);assert state(p)['location']=='starter-town';p.keyboard.down('w');step(p,2.7);p.keyboard.up('w');assert state(p)['location']=='meadow'and not state(p)['townPassage']['active']
 # Loading an earlier version still restores the original meadow correctly.
 old['gameVersion']='0.53';assert p.evaluate('s=>SaveModel.valid(s)',old);p.evaluate('s=>restoreSnapshot(s)',old);assert state(p)['location']=='meadow'and state(p)['teto']['x']==766 and state(p)['teto']['y']==810
 # Existing battle and background behavior is retained, without merging the Neru attack lab.
 p.evaluate('BattleUI.open({id:"neru"})');step(p,.25);assert state(p)['battle']['enemyHp']==600 and state(p)['battle']['attack']is None;p.evaluate('BattleUI.close();BattleUI.open({id:"miku",dialogue:[]})');step(p,2.8);assert p.locator('.miku-warp-backdrop').is_visible();assert p.evaluate('MikuAnimatedBackground.style.coreAlpha')==.6;assert p.evaluate('GumiAttacksV2.selection.phaseTwoHoopsWeight')==4;p.evaluate('BattleUI.close()')
 p.set_viewport_size({'width':1200,'height':800});place(p,'consumables');step(p,.2);p.screenshot(path=str(ART/f'{label}-town-responsive.png'));assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 return {'originalSpawn':True,'walkSouthIntoTown':True,'townScale':[3072,2048],'pauseDuringTransfer':True,'followCameraBothAxes':True,'clickWithScrolledCamera':True,'safeNavigation':navigation,'threeWorkingStalls':purchases,'animatedHaru':True,'treeDepthOrder':layer_cases,'haruCounterOrder':counter_order,'pixelFountain':True,'animatedWaterBoatCrystals':True,'existingBirds':True,'pauseFreezesTown':True,'townCheckpointRestore':True,'portalPreservesProgress':True,'walkBackNorth':True,'legacySave':True,'existingBattlesPreserved':True,'responsive':True}
def launch(mode):
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://town054.test/index.html'if mode=='source'else'http://town054.test/Quiet-Meadow-0.54.html'
  def route(r):
   if mode=='offline':
    if r.request.url==url:r.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
    else:external.append(r.request.url);r.abort()
   else:
    u=urlparse(r.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='town054.test'and f.is_relative_to(ROOT)and f.is_file():r.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
    else:external.append(r.request.url);r.abort()
  p.route('**/*',route);p.goto(url);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);report=run(p,mode);assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-town-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False));b.close()
if __name__=='__main__':launch(sys.argv[1]if len(sys.argv)>1 else'source')
