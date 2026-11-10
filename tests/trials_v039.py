"""Three actual world locations: physical click targets, jumps, puzzle state and coherent Miku art."""
from pathlib import Path
from features_v039 import dialogue_done
ART=Path(__file__).resolve().parents[2]
def advance(page,seconds):
 return page.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.025)tick(Math.min(.025,s-t));draw();return spawnStatus()}''',seconds)
def preset(page,slot):
 page.evaluate('slot=>developerWarp(slot)',slot)
 advance(page,.75)
def click(page,x,y):page.locator('#map').click(position={'x':x,'y':y})
def demo(page):
 return page.evaluate('''()=>{const out=[];let last=-1;for(let i=0;i<250&&HeartGamesUI.status().model.phase!=='input';i++){tick(.04);const n=HeartGamesUI.status().model.lit;if(n>=0&&n!==last)out.push(n);last=n;}draw();return out;}''')
def back_with_heart(page):
 page.evaluate('''()=>{for(let i=0;i<600&&HeartGamesUI.isOpen;i++)tick(.025);draw();}''')
 assert not page.evaluate('HeartGamesUI.isOpen')
 assert page.evaluate('HeartQuest.isActive')
 advance(page,2.4);dialogue_done(page)
 assert not page.evaluate('HeartQuest.isActive')
 assert page.evaluate('SaveModel.valid(captureSnapshot())')
def run(page):
 preset(page,5)
 # Independent pixel oracle: sick/sway poses retain the original joined head+torso silhouette.
 result=page.evaluate('''()=>{let failures=0;const ref=document.createElement('canvas');ref.width=72;ref.height=96;const q=ref.getContext('2d');q.imageSmoothingEnabled=false;ctx.imageSmoothingEnabled=false;for(const frame of [1,4,7,10])for(const name of ['unwell','sway']){const im=textures['mesme_miku_1_'+frame];ctx.clearRect(0,0,100,120);drawActorSprite(im,0,0,72,96,{blink:false,frame,idle:{name,headTilt:.09,lean:0,armRaise:0}});q.clearRect(0,0,72,96);q.drawImage(im,0,0,72,96);const a=ctx.getImageData(0,0,72,96).data,b=q.getImageData(0,0,72,96).data;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){failures++;break;}}draw();return failures;}''')
 assert result==0,result
 page.screenshot(path=str(ART/'Quiet-Meadow-0.39-miku-fixed.png'),clip={'x':718,'y':495,'width':110,'height':142})
 assert page.locator('#heart-game-panel').count()==0
 # Check chapter entry and three independently named collision rooms.
 preset(page,'5.2');assert page.evaluate('spawnStatus().location')=='trial-yellow';assert page.evaluate('SpawnWorld.zone')=='trial-yellow'
 assert page.evaluate('document.querySelector("#world-inventory").hidden') is False
 assert page.evaluate('SaveModel.valid(captureSnapshot())')
 initial_y=page.evaluate('spawnStatus().teto.y');page.keyboard.down('w');advance(page,.35);page.keyboard.up('w');assert page.evaluate('spawnStatus().teto.y')<initial_y-45
 page.keyboard.press('i');assert page.evaluate('InventoryUI.isOpen');before=page.evaluate('spawnStatus().teto');advance(page,.4);assert page.evaluate('spawnStatus().teto')==before;page.keyboard.press('i')
 # Click a physical rock before the puzzle: Teto walks up, its solid base stops her feet.
 click(page,461,305);advance(page,4);assert abs(page.evaluate('spawnStatus().teto.x')-461)<5
 old_y=page.evaluate('spawnStatus().teto.y');page.keyboard.down('w');advance(page,1);page.keyboard.up('w');assert page.evaluate('spawnStatus().teto.y')>old_y-90
 assert not page.evaluate('SpawnWorld.blocked(spawnStatus().teto.x,spawnStatus().teto.y)')
 # The real wooden sign opens the shared dialogue and it closes normally.
 click(page,935,795);advance(page,5);assert page.evaluate('DialogueUI.isOpen');assert 'скалы' in page.locator('#dialogue-text').get_attribute('aria-label');dialogue_done(page)
 # Actual obelisk click -> walk to its safe approach -> memory starts in this same room.
 click(page,768,453)
 page.evaluate('''()=>{for(let i=0;i<700&&HeartGamesUI.status().mode!=='play';i++)tick(.025);draw();}''')
 assert page.evaluate('HeartGamesUI.status().mode')=='play'
 rocks=[(461,305),(1075,305),(461,610),(1075,610)]
 for r in range(3):
  sequence=demo(page);assert len(sequence)==r+4,sequence
  if r==1:
   click(page,*rocks[(sequence[0]+1)%4]);assert page.evaluate('HeartGamesUI.status().model.phase')=='error';advance(page,.9);sequence=demo(page);assert page.evaluate('HeartGamesUI.status().model.round')==1
  for j,n in enumerate(sequence):
   if r==0 and j==0:
    click(page,rocks[n][0],rocks[n][1]+158);advance(page,4.5);page.keyboard.press('e')
   else:click(page,*rocks[n])
   if r==1 and j==0:
    snap=page.evaluate('captureSnapshot()');assert snap['location']=='trial-yellow' and snap['activity']['progress']['cursor']==1
    assert page.evaluate('SaveUI.saveNow("Скалы · второй круг").ok')
    page.evaluate('s=>restoreSnapshot(s)',snap);advance(page,.7);assert page.evaluate('HeartGamesUI.status().model.cursor')==1
  if r==1:page.screenshot(path=str(ART/'Quiet-Meadow-0.39-memory-rocks.png'))
  advance(page,1.1)
 assert page.evaluate('HeartGamesUI.status().mode')=='collect'
 assert not page.evaluate('HeartQuest.flags.heartYellowWon')
 # Heart is a world object; it is picked up at its altar, not in a fullscreen reward menu.
 click(page,768,157);back_with_heart(page);assert page.evaluate('HeartQuest.flags.heartYellowWon')
 won_memory=page.evaluate('captureSnapshot()')
 # Re-enter through chapter five, then physically leave through the southern road.
 page.evaluate('ChaptersUI.open()');page.locator('[data-chapter="miku-hypnosis"]').click();page.locator('[data-chapter="yellow"]').click();advance(page,.7)
 assert page.evaluate('spawnStatus().location')=='trial-yellow'
 page.keyboard.down('s');advance(page,.8);page.keyboard.up('s');advance(page,1);assert page.evaluate('spawnStatus().location')=='heart-crossroads'
 # Top-down jumps use the actual world hero and real collision, without injecting a win.
 preset(page,'5.1');assert page.evaluate('spawnStatus().location')=='trial-red';page.keyboard.down('w')
 page.evaluate('''()=>{for(let i=0;i<15000&&HeartGamesUI.status().mode==='play';i++){const s=HeartGamesUI.status().model,p=teto,platforms=HeartTrialsModel.platforms;const n=platforms.findIndex((a,j)=>{const x=a.x+(a.amplitude||0)*Math.sin(s.clock*1.6+j*.8);return p.x>=x+5&&p.x<=x+a.w-5&&p.y>=a.y+5&&p.y<=a.y+a.h-5;});if(n>=0&&p.y<platforms[n].y+38&&s.jumpAge<0&&s.recover<=0)window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));tick(1/120);}draw();}''');page.keyboard.up('w')
 assert page.evaluate('HeartGamesUI.status().mode')=='collect'
 assert page.evaluate('HeartGamesUI.status().model.checkpoint')==3
 assert page.evaluate('spawnStatus().teto.y')<216
 page.screenshot(path=str(ART/'Quiet-Meadow-0.39-pulse-canyon.png'))
 click(page,768,112);back_with_heart(page);assert page.evaluate('HeartQuest.flags.heartRedWon')
 # The lake contains physical glass walls; reflection steps occupy the right terrace.
 preset(page,'5.3');assert page.evaluate('spawnStatus().location')=='trial-blue'
 page.keyboard.press('e');assert page.evaluate('HeartGamesUI.status().mode')=='play';assert page.evaluate('spawnStatus().teto.x')<710
 paths=[[(0,-1,0),(1,0,0),(1,0,0),(0,-1,0),(0,-1,0),(0,-1,0)],[(0,-1,0),(-1,0,1),(-1,0,1),(0,-1,0),(0,-1,0),(1,0,0),(0,-1,0)],[(0,-1,0),(1,0,1),(0,-1,0),(0,-1,0),(-1,0,0),(0,-1,0),(1,0,1)]]
 for r,path in enumerate(paths):
  if r==1:
   snap=page.evaluate('captureSnapshot()');assert page.evaluate('SaveModel.valid(captureSnapshot())');page.evaluate('s=>restoreSnapshot(s)',snap);advance(page,.7);assert page.evaluate('HeartGamesUI.status().model.room')==1
  for dx,dy,freeze in path:
   advance(page,3.1)
   if freeze:page.keyboard.press('e');assert page.evaluate('HeartGamesUI.status().model.frozen')>0
   key={(0,-1):'w',(1,0):'d',(-1,0):'a',(0,1):'s'}[(dx,dy)];page.keyboard.down(key);advance(page,.05);page.keyboard.up(key);advance(page,.2)
  assert page.evaluate('HeartGamesUI.status().model.phase')=='room-won',page.evaluate('HeartGamesUI.status()')
  if r==1:page.screenshot(path=str(ART/'Quiet-Meadow-0.39-mirror-lake.png'))
  advance(page,1.2)
 assert page.evaluate('HeartGamesUI.status().mode')=='collect'
 click(page,768,125);back_with_heart(page);assert page.evaluate('HeartQuest.count')==3
 # Old 0.38 activity copies migrate into a room, not the removed modal screens.
 page.evaluate('''s=>{s.gameVersion='0.38';s.activity={type:'heart-minigame',id:'yellow'};restoreSnapshot(s);}''',won_memory);advance(page,.7)
 assert page.evaluate('spawnStatus().location')=='trial-yellow' and page.evaluate('HeartGamesUI.status().mode')=='explore'
 # Title menu freezes a real location and Continue resumes it without losing its controller.
 page.keyboard.press('Escape');page.locator('#pause-exit').click();assert page.evaluate('PauseUI.status().view')=='title';assert page.evaluate('HeartGamesUI.isOpen');before=page.evaluate('HeartGamesUI.status()');advance(page,.5);assert page.evaluate('HeartGamesUI.status()')==before;page.locator('#title-continue').click();assert page.evaluate('spawnStatus().location')=='trial-yellow';advance(page,.1)
 # Room saving through normal pause, with the actual location label.
 page.keyboard.press('Escape');assert page.locator('#pause-save').is_enabled();page.locator('#pause-save').click();page.keyboard.press('Escape')
 page.keyboard.press('0');advance(page,1);assert page.evaluate('spawnStatus().location')=='heart-crossroads'
 preset(page,5)
 page.evaluate('''()=>{const s=captureSnapshot();s.teto={x:1400,y:-3140,dir:1};s.trail=[{x:s.teto.x,y:s.teto.y}];restoreSnapshot(s);}''');page.keyboard.down('d');advance(page,.4);page.keyboard.up('d');advance(page,.7);assert page.evaluate('spawnStatus().location')=='trial-blue'
 page.keyboard.press('Escape');state=page.evaluate('HeartGamesUI.status()');advance(page,.5);assert page.evaluate('HeartGamesUI.status()')==state;page.keyboard.press('Escape')
 page.evaluate('startNewGame()');assert not page.evaluate('HeartGamesUI.isOpen||MikuHearts.released');assert page.evaluate('HeartQuest.count')==0
 return {'locations':['trial-red','trial-yellow','trial-blue'],'memory':'physical rocks + mouse/E + collision + round save','pulse':'world jumps/checkpoint/heart','mirrors':'3 world puzzles + room save','miku':'8 full-sprite pixel comparisons PASS','legacy038':'migrated','errors':0}
