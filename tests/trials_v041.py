"""Real controls: falling discs, yellow/red memory, stolen voice and saved nightmare stages."""
from pathlib import Path
from features_v041 import dialogue_done
ART=Path(__file__).resolve().parents[2]
def advance(page,s):return page.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.025)tick(Math.min(.025,s-t));draw();return spawnStatus()}''',s)
def preset(page,slot):page.evaluate('s=>developerWarp(s)',slot);advance(page,.75)
def click(page,x,y):page.locator('#map').click(position={'x':x,'y':y})
def autoplay(page,checkpoint=False):
 return page.evaluate('''stopAtCheckpoint=>{let target=1,lastFailure=0,maxSupport=0;const trace=[],held=new Set(),bind={KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]};function key(c,on){if(on===held.has(c))return;window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:c,bubbles:true}));if(on)held.add(c);else held.delete(c);}function release(){for(const c of [...held])key(c,false);}for(let k=0;k<24000&&HeartGamesUI.status().mode==='play';k++){const s=HeartGamesUI.status().model,p=teto,temp=new HeartTrialsModel.PulseTrail();Object.assign(temp,{clock:s.clock,checkpoint:s.checkpoint});const support=temp.support(p);maxSupport=Math.max(maxSupport,support);if(s.failures>lastFailure){lastFailure=s.failures;trace.push({at:{x:p.x,y:p.y},clock:s.clock,target,phase:temp.state(target),maxSupport});}if(s.recover>0){release();tick(1/120);continue;}if(stopAtCheckpoint&&s.checkpoint===HeartTrialsModel.checkpointIndex&&s.jumpAge<0&&support===HeartTrialsModel.checkpointIndex){release();draw();return {...HeartGamesUI.status(),trace,maxSupport};}if(s.jumpAge<0&&support>=0){target=support+1;const f=new HeartTrialsModel.PulseTrail();f.clock=s.clock+.45;while(target<HeartTrialsModel.platforms.length-1&&f.state(target).phase==='fallen')target++;if(target>support+1&&Math.hypot(temp.center(target).x-p.x,temp.center(target).y-p.y)>100)target=support+1;}const a=HeartTrialsModel.platforms[target],at=a.goal?{x:768,y:-830}:a.checkpoint?{x:768,y:50}:temp.center(target),dx=at.x-p.x,dy=at.y-p.y,d=Math.hypot(dx,dy),f=new HeartTrialsModel.PulseTrail();f.clock=s.clock+.45;const late=new HeartTrialsModel.PulseTrail();late.clock=s.clock+.55;const can=f.state(target).phase!=='fallen'&&late.state(target).phase!=='fallen';if(s.jumpAge<0&&support>=0&&can&&d<103){window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));}const air=HeartGamesUI.status().model.jumpAge>=0,moving=air||can&&d>=103;key('KeyW',moving&&dy< -4);key('KeyS',moving&&dy>4);key('KeyA',moving&&dx< -4);key('KeyD',moving&&dx>4);tick(1/120);}release();draw();return {...HeartGamesUI.status(),trace,maxSupport};}''',checkpoint)
def return_heart(page):
 page.evaluate('''()=>{for(let i=0;i<800&&HeartGamesUI.isOpen;i++)tick(.025);draw();}''')
 assert not page.evaluate('HeartGamesUI.isOpen');advance(page,2.4);dialogue_done(page)
 assert not page.evaluate('HeartQuest.isActive');assert page.evaluate('SaveModel.valid(captureSnapshot())')
def demo(page):
 return page.evaluate('''()=>{const events=[];let last=null;for(let i=0;i<400&&HeartGamesUI.status().model.phase!=='input';i++){tick(.03);const s=HeartGamesUI.status().model,key=s.lit<0?null:s.lit+':'+s.litColor;if(key&&key!==last)events.push({index:s.lit,red:s.litColor==='red'});last=key;}draw();return events;}''')
def wait_voice(page):
 page.evaluate('''()=>{for(let i=0;i<1100;i++){const m=HeartGamesUI.status().model;if(m.phase==='play'&&Math.abs(m.age-m.beatAt)<.025)break;tick(.005);}draw();}''')
 assert page.evaluate('HeartGamesUI.status().model.phase')=='play'
def check_miku_sprite(page):
 assert page.evaluate('''()=>{let failures=0;const ref=document.createElement('canvas');ref.width=72;ref.height=96;const q=ref.getContext('2d');q.imageSmoothingEnabled=false;ctx.imageSmoothingEnabled=false;for(const frame of [1,4,7,10])for(const name of ['unwell','sway']){const im=textures['mesme_miku_1_'+frame];ctx.clearRect(0,0,100,120);drawActorSprite(im,0,0,72,96,{blink:false,frame,idle:{name,headTilt:.09,lean:0,armRaise:0}});q.clearRect(0,0,72,96);q.drawImage(im,0,0,72,96);const a=ctx.getImageData(0,0,72,96).data,b=q.getImageData(0,0,72,96).data;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){failures++;break;}}draw();return failures;}''')==0
def run(page):
 preset(page,5);check_miku_sprite(page);assert len(page.evaluate('WorldBirds.status(8,-3600)'))>0;before_hearts=page.evaluate('captureSnapshot()');assert page.evaluate('HeartCorruption.status().stage')==0
 # Complete both screens through real key events; no hero position or win is injected.
 preset(page,'5.1');assert page.evaluate('HeartGamesUI.room.maxY-HeartGamesUI.room.minY')==2048
 seam=autoplay(page,True);assert seam['model']['checkpoint']==page.evaluate('HeartTrialsModel.checkpointIndex') and seam['model']['jumpAge']<0,seam
 assert seam['viewY']< -300 and seam['viewY']> -1024
 seam_copy=page.evaluate('captureSnapshot()');assert page.evaluate('SaveUI.saveNow("Единственный флажок").ok')
 page.screenshot(path=str(ART/'Quiet-Meadow-0.41-canyon-checkpoint.png'))
 failures=seam['model']['failures'];page.keyboard.down('a');advance(page,1.2);page.keyboard.up('a');advance(page,1)
 assert page.evaluate('HeartGamesUI.status().model.failures')>failures
 assert abs(page.evaluate('spawnStatus().teto.y'))<5
 page.evaluate('s=>restoreSnapshot(s)',seam_copy);advance(page,.7)
 end=autoplay(page);assert end['mode']=='collect',end
 assert page.evaluate('spawnStatus().teto.y')< -815;assert end['viewY']< -975
 page.screenshot(path=str(ART/'Quiet-Meadow-0.41-canyon-north.png'))
 page.keyboard.press('e');assert page.evaluate('HeartCorruption.status().pulseStage')==1
 return_heart(page);assert page.evaluate('HeartQuest.count')==1
 first=page.evaluate('captureSnapshot()');advance(page,2)
 assert page.evaluate('HeartCorruption.birdsOff') and page.evaluate('spawnStatus().birds')==[]
 assert page.evaluate('HeartTrialsData.rooms.every(r=>HeartTrialsArt.birdStatus(r.id,8,r.minY).length===0)')
 # Miku and visible silhouettes must already render DURING the approach transition.
 page.evaluate('''s=>{s=structuredClone(s);s.location='long-road';s.teto={x:768,y:-2538,dir:0};s.trail=[{x:768,y:-2538}];restoreSnapshot(s);}''',first)
 page.keyboard.down('w');advance(page,.2);page.keyboard.up('w');advance(page,1.3)
 assert page.evaluate('spawnStatus().transition.active')
 rendered=page.evaluate('''()=>{const original=drawPerson,seen=[];try{drawPerson=(b,n)=>{seen.push(n);original(b,n);};draw();}finally{drawPerson=original;}return seen;}''')
 assert 'mesme_miku_1' in rendered and rendered.count('miku_shadow')==3,rendered
 page.screenshot(path=str(ART/'Quiet-Meadow-0.41-miku-during-entry.png'))
 page.evaluate('s=>restoreSnapshot(s)',first)

 assert len(page.evaluate('HeartCorruption.status().ghosts'))==3
 # The three silhouettes are source-sized, black, non-solid, and turn to watch Teto.
 dark=page.evaluate('''()=>{const c=document.createElement('canvas');c.width=24;c.height=32;const g=c.getContext('2d');g.drawImage(textures.miku_shadow_7,0,0);const a=g.getImageData(0,0,24,32).data;let n=0,bad=0;for(let i=0;i<a.length;i+=4)if(a[i+3]){n++;if(a[i]>20||a[i+1]>20||a[i+2]>20)bad++;}return {n,bad};}''');assert dark['n']>100 and dark['bad']==0
 page.screenshot(path=str(ART/'Quiet-Meadow-0.41-three-shadows.png'))
 page.evaluate('''()=>{const s=captureSnapshot();s.teto={x:608,y:-2940,dir:2};s.trail=[{x:s.teto.x,y:s.teto.y}];restoreSnapshot(s);draw();}''')
 page.keyboard.press('e');assert not page.evaluate('DialogueUI.isOpen')
 assert page.evaluate('HeartCorruption.status().ghosts[0].dir')==0
 page.evaluate('s=>restoreSnapshot(s)',first)
 # Reach the runes by the actual north branch.
 page.evaluate('''()=>{const s=captureSnapshot();s.teto={x:768,y:-3500,dir:0};s.trail=[{x:s.teto.x,y:s.teto.y}];restoreSnapshot(s);}''');page.keyboard.down('w');advance(page,.4);page.keyboard.up('w');advance(page,.7)
 assert page.evaluate('spawnStatus().location')=='trial-yellow'
 scenery=page.evaluate('''()=>{const r=HeartTrialsData.get('yellow'),p=HeartTrialsArt.perches.get(r.id);return {trees:r.trees.length,rocks:r.details.length,bushes:r.bushes.length,pond:!!r.pond,birds:p.length,safe:p.every(p=>p.clear&&Math.hypot(p.x-p.contact.x,p.y-p.contact.y)<3)};}''')
 assert scenery['trees']>=8 and scenery['rocks']>6 and scenery['bushes']>4 and scenery['pond'] and scenery['birds']>=5 and scenery['safe'],scenery
 # Pixel comparison: a yellow/red cue changes only the carved glyph, never the rock body.
 glyphs=page.evaluate('''()=>{const room=HeartTrialsData.get('yellow'),p=HeartTrialsData.stones[0],results=[];for(const red of [false,true]){const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=1536;a.height=b.height=1024;const m=HeartTrialsModel.create('yellow');m.signals[0]=[{index:0,red},{index:1,red:!red},{index:2,red:false},{index:3,red:false}];m.sequences[0]=m.signals[0].filter(e=>!e.red).map(e=>e.index);HeartTrialsArt.draw(a.getContext('2d'),room,{x:768,y:908},()=>{},0,m,'play',0);m.age=.75;HeartTrialsArt.draw(b.getContext('2d'),room,{x:768,y:908},()=>{},0,m,'play',0);const aa=a.getContext('2d').getImageData(p.x-84,p.y-174,168,186).data,bb=b.getContext('2d').getImageData(p.x-84,p.y-174,168,186).data;let changed=0,outside=0;for(let y=0;y<186;y++)for(let x=0;x<168;x++){const i=(y*168+x)*4;if(aa[i]!==bb[i]||aa[i+1]!==bb[i+1]||aa[i+2]!==bb[i+2]){changed++;const wx=p.x-84+x,wy=p.y-174+y;if(Math.abs(wx-p.x)>36||wy<p.y-100||wy>p.y-20)outside++;}}results.push({red,changed,outside});}return results;}''')
 assert all(g['changed']>20 and g['outside']==0 for g in glyphs),glyphs
 click(page,768,453);page.evaluate('''()=>{for(let i=0;i<700&&HeartGamesUI.status().mode!=='play';i++)tick(.025);}''')
 rocks=[(461,305),(1075,305),(461,610),(1075,610)]
 for r in range(3):
  events=demo(page);assert len(events)==r+4 and sum(e['red'] for e in events)==1,events
  answers=[e['index'] for e in events if not e['red']];assert len(answers)==r+3
  if r==1:
   click(page,*rocks[(answers[0]+1)%4]);assert page.evaluate('HeartGamesUI.status().model.phase')=='error';advance(page,.9);events=demo(page);answers=[e['index'] for e in events if not e['red']]
  for j,n in enumerate(answers):
   click(page,*rocks[n])
   if r==1 and j==0:
    copy=page.evaluate('captureSnapshot()');assert page.evaluate('SaveModel.valid(captureSnapshot())');page.evaluate('s=>restoreSnapshot(s)',copy);advance(page,.7);assert page.evaluate('HeartGamesUI.status().model.cursor')==1
  advance(page,1.1)
 assert page.evaluate('HeartGamesUI.status().mode')=='collect'
 page.screenshot(path=str(ART/'Quiet-Meadow-0.41-runes.png'))
 click(page,768,157);page.evaluate('''()=>{for(let i=0;i<700&&HeartGamesUI.status().mode!=='leaving';i++)tick(.025);draw();}''')
 assert page.evaluate('HeartCorruption.status().pulseStage')==2
 page.screenshot(path=str(ART/'Quiet-Meadow-0.41-fracture.png'))
 return_heart(page);advance(page,12);assert page.evaluate('HeartCorruption.status().fracture')==1;assert page.evaluate('HeartQuest.count')==2;second=page.evaluate('captureSnapshot()')
 # Darkness is persistent and rolls back exactly with the checkpoint's heart flags.
 page.evaluate('s=>restoreSnapshot(s)',second);page.evaluate('draw()');mean2=page.evaluate('''()=>{const a=ctx.getImageData(1080,370,80,60).data;let n=0;for(let i=0;i<a.length;i+=4)n+=a[i]+a[i+1]+a[i+2];return n/(a.length/4);}''')
 lighter={**second,'flags':{**second['flags'],'heartYellowWon':False}};page.evaluate('s=>restoreSnapshot(s)',lighter);page.evaluate('draw()');mean1=page.evaluate('''()=>{const a=ctx.getImageData(1080,370,80,60).data;let n=0;for(let i=0;i<a.length;i+=4)n+=a[i]+a[i+1]+a[i+2];return n/(a.length/4);}''');assert mean2<mean1*.86,(mean1,mean2)
 page.evaluate('s=>restoreSnapshot(s)',second)
 # Adjacent groups of 1/2/3 different arrows: keyboard/WASD/physical stone buttons, timing and stage saves.
 preset(page,'5.3');assert page.evaluate('spawnStatus().location')=='trial-blue';assert page.evaluate('HeartGamesUI.status().birds')==[]
 page.keyboard.press('e');assert page.evaluate('HeartGamesUI.status().model.phase')=='listen'
 sequences=page.evaluate('HeartGamesUI.status().model.sequences')
 for stage in range(3):
  if stage==1:
   page.evaluate('''()=>{for(let i=0;i<1100&&HeartGamesUI.status().model.phase!=='play';i++)tick(.005);}''')
   direction=page.evaluate('HeartGamesUI.status().model.direction');page.keyboard.press({'up':'ArrowUp','down':'ArrowDown','left':'ArrowLeft','right':'ArrowRight'}[direction])
   assert page.evaluate('HeartGamesUI.status().model.phase')=='miss';advance(page,.9);assert page.evaluate('HeartGamesUI.status().model.stage')==1
  for hit in range(3):
   wait_voice(page);chord=page.evaluate('HeartGamesUI.status().model.chord');assert len(chord)==stage+1 and len(set(chord))==len(chord);pos=page.evaluate('({x:teto.x,y:teto.y})')
   if hit<2:
    mapping={'up':'ArrowUp','down':'ArrowDown','left':'ArrowLeft','right':'ArrowRight'} if hit==0 else {'up':'w','down':'s','left':'a','right':'d'}
    for direction in chord:page.keyboard.down(mapping[direction])
    for direction in chord:page.keyboard.up(mapping[direction])
   else:
    for direction in chord:page.mouse.click({'up':480,'down':672,'left':864,'right':1056}[direction],726)
   assert page.evaluate('HeartGamesUI.status().model.hits')==hit+1,page.evaluate('HeartGamesUI.status()')
   assert page.evaluate('({x:teto.x,y:teto.y})')==pos
   if stage==1 and hit==0:
    copy=page.evaluate('captureSnapshot()');assert page.evaluate('SaveUI.saveNow("Второй голос — стрелки").ok');page.evaluate('s=>restoreSnapshot(s)',copy);advance(page,.7)
    assert page.evaluate('HeartGamesUI.status().model.stage')==1 and page.evaluate('HeartGamesUI.status().model.hits')==1
    assert page.evaluate('HeartGamesUI.status().model.sequences')==sequences
   if stage==1 and hit==1:page.screenshot(path=str(ART/'Quiet-Meadow-0.41-stolen-voice.png'))
  advance(page,1.1)
 assert page.evaluate('HeartGamesUI.status().mode')=='collect'
 click(page,768,125);page.evaluate('''()=>{for(let i=0;i<700&&HeartGamesUI.status().mode!=='leaving';i++)tick(.025);draw();}''')
 assert page.evaluate('HeartCorruption.status().fracture')>.98
 advance(page,1.2);strength=page.evaluate('HeartCorruption.status().fracture');assert 0<strength<.8,strength
 page.keyboard.press('Escape');paused=page.evaluate('HeartCorruption.status()');advance(page,.5);assert page.evaluate('HeartCorruption.status()')==paused;page.keyboard.press('Escape')
 return_heart(page);advance(page,4);assert page.evaluate('HeartQuest.count')==3
 assert page.evaluate('HeartCorruption.status().fracture')==0 and page.evaluate('HeartCorruption.birdsOff')
 third=page.evaluate('captureSnapshot()');page.evaluate('s=>restoreSnapshot(s)',third);assert page.evaluate('HeartCorruption.status().fracture')==0
 page.screenshot(path=str(ART/'Quiet-Meadow-0.41-after-third-heart.png'))
 # New saves, early rollback, paused corruption and a clean new game.
 page.keyboard.press('Escape');c=page.evaluate('HeartCorruption.status()');advance(page,.5);assert page.evaluate('HeartCorruption.status()')==c;page.keyboard.press('Escape')
 page.evaluate('s=>restoreSnapshot(s)',before_hearts);assert page.evaluate('HeartCorruption.status().stage')==0 and len(page.evaluate('HeartCorruption.status().ghosts'))==0;assert not page.evaluate('HeartCorruption.birdsOff');assert len(page.evaluate('WorldBirds.status(8,-3600)'))>0
 page.evaluate('startNewGame()');assert page.evaluate('HeartQuest.count')==0 and page.evaluate('HeartCorruption.status().stage')==0
 return {'canyon':'2 screens, broad mirrored S route, textured islands, one seam checkpoint, timed drops','memory':'yellow glyph only; red skipped; all rounds passed','voice':'3 stages, adjacent groups of 1/2/3 distinct arrows, increasing speed, all directions required; arrow keys/WASD/stone buttons; stage saved','nightmare':'Miku and 3 shadows rendered during entry; no birds after first heart; persistent cracks until third then smooth fade; rollback/pause','scenery':scenery,'glyphPixelChecks':glyphs}
