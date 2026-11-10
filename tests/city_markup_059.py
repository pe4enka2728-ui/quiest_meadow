"""Player controls and actual pixels around the user-marked borders, benches and fences."""
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
from city_fixes_059 import step
import json,mimetypes,sys,base64
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
def place(p,x,y,dir=2):
 p.evaluate('''v=>{placeParty(TownData.id,{x:v.x,y:v.y,dir:v.dir},TownData.companion);TownPeople.actors.forEach(a=>a.pause=29);draw();}''',dict(x=x,y=y,dir=dir))
def run(p,mode):
 step(p,3.6);p.evaluate('''()=>{while(DialogueUI.isOpen){DialogueUI.finishText();DialogueUI.choose(0);}noticeTimer=0;document.querySelector('#notice').classList.remove('visible');}''');p.locator('#map').focus();assert p.evaluate('LevelData.version')=='0.59'
 north=[]
 for source_y in [20,120,240]:
  for key,back,sign in [('a','d',-1),('d','a',1)]:
   place(p,1536,source_y*2,1 if sign>0 else 3);p.keyboard.down(key);step(p,1.8);p.keyboard.up(key);at=p.evaluate('({x:teto.x,y:teto.y,blocked:W.blocked(teto.x,teto.y)})');assert not at['blocked'];assert at['x']>=1462 if sign<0 else at['x']<=1632,at
   p.keyboard.down(back);step(p,.3);p.keyboard.up(back);away=p.evaluate('({x:teto.x,y:teto.y,blocked:W.blocked(teto.x,teto.y)})');assert not away['blocked']and (away['x']-at['x'])*(-sign)>30,(at,away);north.append(dict(y=source_y,side=key,stopped=at['x'],released=away['x']))
 benches=[]
 for b in p.evaluate('TownData.benches'):
  for side,y in [('front',b['y']+b['h']+10),('back',b['y']+b['h']-34)]:
   place(p,(b['x']-10)*2,y*2,1);start=p.evaluate('teto.x');p.keyboard.down('d');step(p,1.2);p.keyboard.up('d');end=p.evaluate('teto.x');assert end-start>180,(b['id'],side,start,end);assert not p.evaluate('W.blocked(teto.x,teto.y)');benches.append(dict(id=b['id'],side=side,distance=end-start))
  place(p,(b['x']+b['w']/2)*2,(b['y']+b['h']-34)*2,2);before=p.evaluate('({x:teto.x,y:teto.y})');p.keyboard.down('s');step(p,.6);p.keyboard.up('s');contact=p.evaluate('({x:teto.x,y:teto.y})');assert contact['y']-before['y']<14,(b,contact,before);p.keyboard.down('w');step(p,.2);p.keyboard.up('w');assert p.evaluate('teto.y')<contact['y']-20
 # Both visual masks and actual sort results are inspected, including every rail chain.
 pixels=p.evaluate('''()=>{const c=document.createElement('canvas');c.width=TownData.width;c.height=TownData.height;const g=c.getContext('2d'),probe=(x,y)=>{TownArt.draw(g,8,{x:0,y:0,width:c.width,height:c.height,overview:true},[{body:{x,y},name:'teto_2'}],a=>{g.fillStyle='#ff00f1';g.fillRect(a.x-8,a.y-70,16,70);});const d=g.getImageData(x-8,y-70,16,70).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]===255&&d[i+1]===0&&d[i+2]===241)n++;return n;};const results=[];for(const p of TownArt.props.filter(p=>p.mask==='bench'||p.mask==='rail')){let x;if(p.mask==='bench')x=p.box[0]+p.box[2]*.42;else{let best=null,length=0;for(let i=1;i<p.groundLine.length;i++){const a=p.groundLine[i-1],b=p.groundLine[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>length){length=l;best=[a,b];}}x=(best[0][0]+best[1][0])/2;}const y=TownArt.depthAt(p,x);results.push({id:p.id,front:probe(Math.round(x*2),Math.round(y+20)),back:probe(Math.round(x*2),Math.round(y-10))});}return results;}''')
 assert all(x['front']==1120 and x['back']<1120 for x in pixels),pixels
 # Foreground stair masks contain no walkable centre tiles that could stick to Teto.
 stairs=p.evaluate('''()=>TownArt.props.filter(p=>p.id.startsWith('main-stair-')&&p.id.endsWith('-side')).map(p=>{const d=p.image.getContext('2d').getImageData(0,0,p.image.width,p.image.height).data;let wrong=0;for(let y=0;y<p.image.height;y++)for(let x=0;x<p.image.width;x++){const worldX=p.box[0]+x;if(worldX>=747&&worldX<=828&&d[(y*p.image.width+x)*4+3])wrong++;}return {id:p.id,wrong};})''');assert len(stairs)==2 and all(x['wrong']==0 for x in stairs),stairs
 # Removal is visible in the rendered terrain, and collision is removed at the same locations.
 edits=p.evaluate('''()=>{const g=TownArt.terrain.getContext('2d'),old=document.createElement('canvas');old.width=textures.townGround.width;old.height=textures.townGround.height;const q=old.getContext('2d');q.drawImage(textures.townGround,0,0);const brown=d=>{let n=0;for(let k=0;k<d.length;k+=4)if(d[k]>d[k+1]*1.3&&d[k]>80&&d[k+2]<d[k]*.7)n++;return n;},site=[104,742,25,46],tip=Array.from(g.getImageData(579,372,1,1).data);return {postBefore:brown(q.getImageData(...site).data),postAfter:brown(g.getImageData(...site).data),tip,postBlocked:W.blocked(232,1566,14,[],TownData.id),tipBlocked:W.blocked(1158,744,14,[],TownData.id),oldPostCollider:TownData.colliders.some(o=>o.id==='town-quay-loose-west'),oldPostLayer:TownData.foreground.some(o=>o.id==='quay-loose-west')};}''');assert edits['postBefore']>150 and edits['postAfter']<35 and edits['tip'][1]>edits['tip'][0]*1.2 and not edits['postBlocked']and not edits['tipBlocked']and not edits['oldPostCollider']and not edits['oldPostLayer'],edits
 # All stairs are walked with real input; the forward and return paths both work.
 stair_walks=[]
 for name,x,y,seconds in [('main',1580,1220,2.25),('east',2560,1150,2.8)]:
  place(p,x,y,2);p.keyboard.down('s');step(p,seconds);p.keyboard.up('s');low=p.evaluate('({x:teto.x,y:teto.y})');assert low['y']>y+300,(name,low);p.keyboard.down('w');step(p,seconds);p.keyboard.up('w');back=p.evaluate('({x:teto.x,y:teto.y})');assert abs(back['y']-y)<2,(name,back);assert not p.evaluate('W.blocked(teto.x,teto.y)');stair_walks.append(dict(name=name,lower=low,returned=back))
 # Render an actual overview with exact collision shapes for the next user review.
 data=p.evaluate('''()=>{const oldW=canvas.width,oldH=canvas.height;canvas.width=TownData.width;canvas.height=TownData.height;TownArt.draw(ctx,8,{x:0,y:0,width:TownData.width,height:TownData.height,overview:true},[{body:{...TownData.waypoints.fountain,dir:2},name:'teto_2'}],drawPerson,false);const clean=canvas.toDataURL().split(',')[1];TownArt.draw(ctx,8,{x:0,y:0,width:TownData.width,height:TownData.height,overview:true},[],drawPerson,true);const collisions=canvas.toDataURL().split(',')[1];canvas.width=oldW;canvas.height=oldH;draw();return {clean,collisions};}''')
 for k,v in data.items():(ART/f'{mode}-markup-{k}.png').write_bytes(base64.b64decode(v))
 return dict(northFences=north,benchWalks=benches,frontAndBackPixels=pixels,stairMasks=stairs,removedFragments=edits,stairWalks=stair_walks,artAndCollisionTogether=True)
def launch(mode):
 with sync_playwright()as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1536,'height':1024});p.add_init_script('window.requestAnimationFrame=()=>0');errors=[];external=[];p.on('pageerror',lambda e:errors.append(str(e)));url='http://markup059.test/index.html'if mode=='source'else'http://markup059.test/play.html'
  def route(req):
   if mode=='offline':
    if req.request.url==url:req.fulfill(path=str(ROOT/'play.html'),content_type='text/html; charset=utf-8')
    else:external.append(req.request.url);req.abort()
   else:
    u=urlparse(req.request.url);f=(ROOT/unquote(u.path.lstrip('/'))).resolve()
    if u.hostname=='markup059.test'and f.is_relative_to(ROOT)and f.is_file():req.fulfill(path=str(f),content_type=mimetypes.guess_type(f.name)[0]or'application/octet-stream')
    else:external.append(req.request.url);req.abort()
  p.route('**/*',route);p.goto(url,timeout=60000);p.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready',polling=50,timeout=30000);report=run(p,mode);assert not errors,errors;assert not external,external;report.update(errors=errors,externalRequests=external);(ART/f'{mode}-markup-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',mode,json.dumps(report,ensure_ascii=False));b.close()
if __name__=='__main__':launch(sys.argv[1]if len(sys.argv)>1 else'source')
