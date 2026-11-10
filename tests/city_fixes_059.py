"""Actual controls: immovable image NPCs, companion detours, Haru-only shop and city render contacts."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
import json,mimetypes,sys,base64
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
def step(p,seconds):
 return p.evaluate('''seconds=>{for(let t=0;t<seconds-1e-8;t+=.02){const dt=Math.min(.02,seconds-t);tick(dt);if(!paused&&!PauseUI.isOpen&&!InventoryUI.isOpen){ShopUI.update(dt);DialogueUI.update(dt);}}draw();return spawnStatus();}''',seconds)
def run(p,mode):
 step(p,3.6);p.evaluate('''()=>{while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}noticeTimer=0;document.querySelector('#notice').classList.remove('visible');}''');p.locator('#map').focus()
 contact=[]
 for who in range(3):
  for key,dx,dy in [('d',1,0),('a',-1,0),('s',0,1),('w',0,-1)]:
   origin=p.evaluate('''v=>{TownPeople.reset();const a=TownPeople.actors[v.who];const t={x:a.x-v.dx*28.2,y:a.y-v.dy*28.2,dir:2};placeParty(TownData.id,t,TownData.companion);draw();return {x:a.x,y:a.y};}''',dict(who=who,dx=dx,dy=dy))
   p.keyboard.down(key);step(p,1.2);p.keyboard.up(key)
   result=p.evaluate('''v=>{const a=TownPeople.actors[v.who];return {drift:Math.hypot(a.x-v.origin.x,a.y-v.origin.y),separation:Math.hypot(a.x-teto.x,a.y-teto.y),blocked:W.blocked(teto.x,teto.y)};}''',dict(who=who,origin=origin))
   assert result['drift']<.02 and result['separation']>27.7 and not result['blocked'],(who,key,result);contact.append(dict(resident=who,side=key,**result))
 # Natural movement after contact resumes when the player leaves, rather than making NPCs static forever.
 p.evaluate('placeParty(TownData.id,TownData.spawn,TownData.companion)');before=p.evaluate('TownPeople.capture()');step(p,2);assert p.evaluate('TownPeople.capture()')!=before
 # Miku traverses an old breadcrumb occupied by an NPC, then follows real WASD movement again.
 p.evaluate('''()=>{TownPeople.reset();const a=TownPeople.actors[0];a.x=1580;a.y=820;a.pause=20;placeParty(TownData.id,{x:1780,y:820,dir:1},{x:1500,y:820,dir:1});draw();}''')
 step(p,2);assert p.evaluate('PartyFollower.status().detours')>0;p.keyboard.down('d');step(p,1.8);p.keyboard.up('d');step(p,2)
 follow=p.evaluate('''()=>({gap:Math.hypot(teto.x-miku.x,teto.y-miku.y),detours:PartyFollower.status().detours,miku:{x:miku.x,y:miku.y},blocked:W.blocked(miku.x,miku.y),valid:SaveModel.valid(captureSnapshot())})''');assert follow['gap']<92 and follow['detours']>0 and not follow['blocked']and follow['valid'],follow;p.screenshot(path=str(ART/f'{mode}-companion-detour.png'))
 # Only the vendor and a front-facing interaction open a category overview.
 vendors=[]
 for name,expected in [('equipment',False),('abilities',False),('consumables',True)]:
  p.evaluate('''name=>{const q=TownData.waypoints[name];placeParty(TownData.id,{...q,dir:0},TownData.companion);draw();}''',name);p.keyboard.press('e');assert p.evaluate('ShopUI.isOpen')==expected,name;vendors.append(dict(stall=name,opens=expected))
  if expected:
   assert p.evaluate('ShopUI.status().category') is None;p.keyboard.press('Escape');step(p,1)
  if p.evaluate('DialogueUI.isOpen'):p.evaluate('DialogueUI.close(false)')
 p.evaluate('''()=>{const q=TownData.waypoints.consumables;placeParty(TownData.id,{...q,dir:2},TownData.companion);draw();}''');p.keyboard.press('e');assert not p.evaluate('ShopUI.isOpen');p.evaluate('teto.dir=0');p.keyboard.press('e');assert p.evaluate('ShopUI.isOpen');p.screenshot(path=str(ART/f'{mode}-haru-shop.png'));p.keyboard.press('Escape');step(p,1)
 # All four directions use images, with an independently distinct pair of walking poses.
 sprites=p.evaluate('''()=>[...TownPeopleArt.atlases].map(([id,frames])=>({id,frames:frames.length,directions:Array.from({length:4},(_,d)=>new Set(frames.slice(d*3,d*3+3).map(im=>im.toDataURL())).size),width:frames[0].width,height:frames[0].height}))''');assert all(s['frames']==12 and s['directions']==[3,3,3,3]for s in sprites),sprites
 # A fast sweep cannot pass through the complete fountain bowl.
 fountain=p.evaluate('''()=>{placeParty(TownData.id,TownData.waypoints.fountain,TownData.companion);const f=TownData.fountain,results=[];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const b={x:f.x-dx*190,y:f.y+11-dy*130};W.move(b,dx*400,dy*300,null,[]);results.push({blocked:W.blocked(b.x,b.y,14,[]),side:(b.x-f.x)*dx+(b.y-f.y-11)*dy});}return results;}''');assert all(not s['blocked']and s['side']<0 for s in fountain),fountain
 # Color probes cover the actual slanted fences, house corner and crates, rather than relying on sort keys.
 layers=p.evaluate('''()=>{const c=document.createElement('canvas');c.width=TownData.width;c.height=TownData.height;const g=c.getContext('2d'),probe=(x,y)=>{TownArt.draw(g,4,{x:0,y:0,width:c.width,height:c.height,overview:true},[{body:{x,y},name:'teto_2'}],b=>{g.fillStyle='#ff00f1';g.fillRect(b.x-10,b.y-66,20,66);});const a=g.getImageData(x-10,y-66,20,66).data;let n=0;for(let k=0;k<a.length;k+=4)if(a[k]===255&&a[k+1]===0&&a[k+2]===241)n++;return n;};return {quayBack:probe(2710,1570),quayFront:probe(2710,1642),portalBack:probe(2830,1100),portalFront:probe(2830,1185),crateBack:probe(1825,640),crateFront:probe(1825,700)};}''');assert layers['quayFront']==1320 and layers['quayBack']<1320,layers;assert layers['crateFront']==1320 and layers['crateBack']<1320,layers
 # Steam has a connected stem right above each real chimney mouth. No smoke below the source.
 smoke=p.evaluate('''()=>{const c=document.createElement('canvas');c.width=3072;c.height=2048;const g=c.getContext('2d');TownEffects.steam(g,4);return TownData.chimneys.map(ch=>{const a=g.getImageData(ch.x-4,ch.y-16,8,15).data;let n=0;for(let k=3;k<a.length;k+=4)if(a[k])n++;const below=g.getImageData(ch.x-10,ch.y+4,20,20).data;return {id:ch.id,x:ch.x,y:ch.y,stemPixels:n,below:below.some((v,i)=>i%4===3&&v>0)};});}''');assert all(s['stemPixels']>0 and not s['below']for s in smoke),smoke
 # Inspect the loaded dry hull: no teal pixels inside it; matte outside the hull is discarded.
 boat=p.evaluate('''()=>{const im=textures.townBoat,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const a=g.getImageData(440,505,650,270).data;let teal=0,solid=0;for(let k=0;k<a.length;k+=4)if(a[k+3]>230){solid++;if(a[k+1]>75&&a[k+1]>a[k]*1.15&&a[k+2]>a[k]*1.1)teal++;}const poses=Array.from({length:90},(_,i)=>TownArt.boatPose(i/5));return {teal,solid,bob:Math.max(...poses.map(p=>p.y))-Math.min(...poses.map(p=>p.y)),tilt:Math.max(...poses.map(p=>Math.abs(p.angle)))};}''');assert boat['solid']>80000 and boat['teal']==0 and boat['bob']<2.7 and boat['tilt']<.008,boat
 # Actual river frame differences are visible across the inlet, west shore and open sea.
 sea=p.evaluate('''()=>{const c=document.createElement('canvas');c.width=3072;c.height=2048;const g=c.getContext('2d'),points=[[10,1900],[2960,1760],[2100,1950]],data=t=>{g.clearRect(0,0,c.width,c.height);TownEffects.water(g,t);return points.map(([x,y])=>g.getImageData(x,y,80,60).data);};const a=data(3),b=data(3.5);return a.map((r,i)=>{let changed=0,total=0;for(let k=0;k<r.length;k+=4)if(r[k+3]&&b[i][k+3]){total++;if(Math.abs(r[k]-b[i][k])+Math.abs(r[k+1]-b[i][k+1])+Math.abs(r[k+2]-b[i][k+2])>12)changed++;}return {changed,total,ratio:changed/total};});}''');assert all(s['ratio']>.15 for s in sea),sea
 p.evaluate('''()=>{placeParty(TownData.id,TownData.waypoints.pier,{x:1490,y:1800,dir:2});draw();}''');p.screenshot(path=str(ART/f'{mode}-water-and-dry-boat.png'))
 return dict(immovableContacts=contact,imageSprites=sprites,companion=follow,haruOnly=vendors,fountain=fountain,depthProbes=layers,chimneys=smoke,dryBoat=boat,movingSea=sea)
def launch(mode):
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.__QM_TEST__=true;window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://fixes059.test/index.html'if mode=='source'else'http://fixes059.test/play.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='fixes059.test'and f.is_relative_to(ROOT)and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url,timeout=60000);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);report=run(p,mode);assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-fixes-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False));b.close()
if __name__=='__main__':launch(sys.argv[1]if len(sys.argv)>1 else'source')
