"""Real minigame controls, navigation/save lifecycle, scenery/bird rendering; screenshots only."""
from pathlib import Path
from features_v038 import dialogue_done
ART=Path(__file__).resolve().parents[2]
def advance(page,seconds):
 return page.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.025)tick(Math.min(.025,s-t));draw();return spawnStatus()}''',seconds)
def preset(page,slot):
 if not page.evaluate('DeveloperUI.isOpen'):page.keyboard.press('F3')
 page.evaluate('slot=>developerWarp(slot)',slot)
 page.evaluate('DeveloperUI.close(false)')
def accept_heart(page):
 assert page.evaluate('HeartGamesUI.status().mode')=='won'
 page.keyboard.press('1');assert page.evaluate('HeartQuest.isActive')
 advance(page,2.4);dialogue_done(page)
 assert not page.evaluate('HeartQuest.isActive')
 assert page.evaluate('SaveModel.valid(captureSnapshot())')
def demo(page):
 return page.evaluate('''()=>{const out=[];let last=-1;for(let i=0;i<180&&HeartGamesUI.status().model.phase!=='input';i++){tick(.05);const n=HeartGamesUI.status().model.lit;if(n>=0&&n!==last)out.push(n);last=n;}draw();return out;}''')
def run(page):
 preset(page,5);origin=page.evaluate('captureSnapshot()');assert page.evaluate('HeartQuest.count')==0
 # Crystal uses the same saves/chapters/shop; the new chapter opens four unknown memories.
 page.keyboard.press('e');assert page.evaluate('SaveUI.isOpen');page.keyboard.press('c');assert page.evaluate('ChaptersUI.isOpen')
 assert not page.locator('[data-chapter="miku-hypnosis"]').is_disabled();page.locator('[data-chapter="miku-hypnosis"]').click()
 assert page.locator('#chapters-list button').count()==4
 assert page.locator('#chapters-list button:disabled').count()==4
 assert all('???' in text for text in page.locator('#chapters-list strong').all_text_contents())
 page.screenshot(path=str(ART/'Quiet-Meadow-0.38-miku-chapter-locked.png'))
 page.keyboard.press('Escape');assert page.evaluate('ChaptersUI.status().view')=='chapters';page.keyboard.press('Escape');assert page.evaluate('SaveUI.isOpen');page.keyboard.press('Escape')
 # Actual F3 hierarchy: named and all available, unlike the player's chapter book.
 page.keyboard.press('F3');page.locator('#developer-teleport').click();page.locator('[data-slot="5"]').click()
 assert page.evaluate('DeveloperUI.status().view')=='miku-points'
 assert page.locator('#developer-scroll button:not(:disabled)').count()==5
 assert all('???' not in text for text in page.locator('#developer-scroll strong').all_text_contents())
 page.screenshot(path=str(ART/'Quiet-Meadow-0.38-developer-miku.png'));page.locator('[data-slot="5.1"]').click()
 assert page.evaluate('HeartGamesUI.status().id')=='red'
 entry=page.evaluate('captureSnapshot()');assert entry['activity']['id']=='red'
 assert page.evaluate('SaveUI.status().copies[0].name').startswith('Тест')
 # No world movement while in a minigame. The pause freezes its clock and blocks saving.
 world_position=page.evaluate('spawnStatus().teto');page.keyboard.press('1');page.keyboard.press('Escape')
 before=page.evaluate('HeartGamesUI.status().clock');advance(page,.5);assert page.evaluate('HeartGamesUI.status().clock')==before
 assert page.locator('#pause').is_visible();page.keyboard.press('Escape')
 page.keyboard.down('d');advance(page,2.4);page.keyboard.up('d');assert page.evaluate('HeartGamesUI.status().model.failures')>=1
 page.keyboard.press('r');assert not page.evaluate('spawnStatus().intro.active')
 assert page.evaluate('spawnStatus().teto')==world_position
 # Autoplay sends real jump events through the game's input handler; no win/state injection.
 page.keyboard.down('d')
 state=page.evaluate('''()=>{const ends=[300,555,790,1050,1400,1655,1910,2145,2520];for(let i=0;i<600&&HeartGamesUI.status().mode==='play';i++){const p=HeartGamesUI.status().model.player;if(p.ground>=0&&p.x>ends[p.ground]-36)window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));tick(1/120);}draw();return HeartGamesUI.status();}''')
 page.screenshot(path=str(ART/'Quiet-Meadow-0.38-red-heart.png'))
 page.evaluate('''()=>{const ends=[300,555,790,1050,1400,1655,1910,2145,2520];for(let i=0;i<7000&&HeartGamesUI.status().mode==='play';i++){const p=HeartGamesUI.status().model.player;if(p.ground>=0&&p.x>ends[p.ground]-36)window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));tick(1/120);}draw();}''');page.keyboard.up('d')
 accept_heart(page);assert page.evaluate('HeartQuest.flags.heartRedWon')
 after_red=page.evaluate('captureSnapshot()');copies=page.evaluate('SaveUI.status().count')
 # Chapter travel preserves inventory/progress; checkpoints enter the activity after load.
 page.evaluate('s=>restoreSnapshot(s)',entry);assert page.evaluate('HeartGamesUI.isOpen');assert not page.evaluate('HeartQuest.flags.heartRedWon')
 page.keyboard.press('0');page.evaluate('s=>restoreSnapshot(s)',after_red);assert page.evaluate('HeartQuest.flags.heartRedWon')
 page.evaluate('ChaptersUI.open()');page.locator('[data-chapter="miku-hypnosis"]').click();assert not page.locator('[data-chapter="red"]').is_disabled();assert page.locator('[data-chapter="yellow"]').is_disabled()
 page.locator('[data-chapter="red"]').click();page.keyboard.press('0');assert page.evaluate('HeartQuest.flags.heartRedWon')
 # Enter yellow from the actual north branch, without using a developer preset.
 page.evaluate('''()=>{const s=captureSnapshot();s.teto={x:768,y:-3500,dir:0};s.trail=[{x:s.teto.x,y:s.teto.y}];restoreSnapshot(s);}''');page.keyboard.down('w');advance(page,.4);page.keyboard.up('w')
 assert page.evaluate('HeartGamesUI.status().id')=='yellow';page.keyboard.press('1')
 for round in range(3):
  sequence=demo(page);assert len(sequence)==round+4,sequence
  if round==1:
   page.keyboard.press(str((sequence[0]+1)%4+1));assert page.evaluate('HeartGamesUI.status().model.phase')=='error';advance(page,.9)
   sequence=demo(page);assert page.evaluate('HeartGamesUI.status().model.round')==1
  for n in sequence:page.keyboard.press(str(n+1))
  if round==1:page.screenshot(path=str(ART/'Quiet-Meadow-0.38-yellow-heart.png'))
  advance(page,1.1)
 accept_heart(page);assert page.evaluate('HeartQuest.count')==2
 # Blue branch -> three genuine mirrored puzzles, with deliberate freezing in the later rooms.
 page.evaluate('''()=>{const s=captureSnapshot();s.teto={x:1400,y:-3140,dir:1};s.trail=[{x:s.teto.x,y:s.teto.y}];restoreSnapshot(s);}''');page.keyboard.down('d');advance(page,.4);page.keyboard.up('d');assert page.evaluate('HeartGamesUI.status().id')=='blue';page.keyboard.press('1')
 paths=[[(0,-1,0),(1,0,0),(1,0,0),(0,-1,0),(0,-1,0),(0,-1,0)],[(0,-1,0),(-1,0,1),(-1,0,1),(0,-1,0),(0,-1,0),(1,0,0),(0,-1,0)],[(0,-1,0),(1,0,1),(0,-1,0),(0,-1,0),(-1,0,0),(0,-1,0),(1,0,1)]]
 for room,path in enumerate(paths):
  for dx,dy,freeze in path:
   advance(page,3.05)
   if freeze:page.keyboard.press('e');assert page.evaluate('HeartGamesUI.status().model.frozen')>0
   key={(0,-1):'w',(1,0):'d',(-1,0):'a',(0,1):'s'}[(dx,dy)];page.keyboard.down(key);advance(page,.05);page.keyboard.up(key)
  assert page.evaluate('HeartGamesUI.status().model.phase')=='room-won',page.evaluate('HeartGamesUI.status()')
  if room==1:page.screenshot(path=str(ART/'Quiet-Meadow-0.38-blue-heart.png'))
  advance(page,1.15)
 accept_heart(page);assert page.evaluate('HeartQuest.count')==3
 all_hearts=page.evaluate('captureSnapshot()');assert all(all_hearts['flags'][k] for k in ['heartRedWon','heartYellowWon','heartBlueWon'])
 page.evaluate('ChaptersUI.open()');page.locator('[data-chapter="miku-hypnosis"]').click();assert page.locator('#chapters-list button:not(:disabled)').count()==3;assert page.locator('[data-chapter="miku-boss"]').is_disabled()
 page.screenshot(path=str(ART/'Quiet-Meadow-0.38-miku-chapter.png'));page.evaluate('ChaptersUI.close(false)')
 page.reload();page.wait_for_function('typeof spawnStatus==="function"&&spawnStatus().ready');assert page.evaluate('HeartQuest.count')==3;assert page.evaluate('spawnStatus().location')=='heart-crossroads'
 preset(page,'5.4');assert page.evaluate('HeartQuest.count')==3;assert page.evaluate('DialogueUI.isOpen');assert not page.evaluate('BattleUI.isOpen');dialogue_done(page)
 # Rollback removes completed memories; a cancelled reward cannot reopen its dialogue.
 page.evaluate('s=>restoreSnapshot(s)',origin);assert page.evaluate('HeartQuest.count')==0;page.evaluate('HeartQuest.update(30)');assert not page.evaluate('HeartQuest.isActive||DialogueUI.isOpen')
 # Follow the actual camera transition until the old foot-only cull would drop the roof.
 preset(page,4)
 page.evaluate("""()=>{const s=captureSnapshot();s.location='circus';s.teto={x:768,y:-1475,dir:0};s.miku={x:824,y:-1430,dir:0};s.trail=[s.miku,s.teto];restoreSnapshot(s);}""")
 page.keyboard.down('w');advance(page,1.5);page.keyboard.up('w');advance(page,1)
 assert page.evaluate('spawnStatus().transition.active')
 assert page.evaluate('spawnStatus().camera.y')<-2350
 calls=page.evaluate("""()=>{const original=CircusArt.items;let calls=0;CircusArt.items=(...args)=>original(...args).map(item=>item.bounds?{...item,draw(){calls++;item.draw();}}:item);draw();CircusArt.items=original;return calls;}""")
 assert calls==1
 page.screenshot(path=str(ART/'Quiet-Meadow-0.38-tent-transition.png'))
 advance(page,2);assert page.evaluate('spawnStatus().location')=='long-road'
 assert page.evaluate('TentPortals.appearance(spawnStatus().teto)')=={'alpha':1,'rearDoor':False}
 page.evaluate('s=>restoreSnapshot(s)',origin)
 # Each perch touches real source alpha; all phases share one pause-aware clock.
 birds=page.evaluate('''()=>({count:WorldBirds.perches.length,objects:WorldBirds.perches.filter(p=>p.type==='object').length,aligned:WorldBirds.perches.every(p=>Math.hypot(p.contact.x-p.x,p.contact.y-p.y)<3),perchesClear:WorldBirds.perches.every(p=>WorldBirds.perchClear(p)),backgroundClear:HeartRoadArt.backgroundTrees.every(p=>!HeartRoadData.crownOnRoad(p.x,p.y,p.image.width*3,p.image.height*3))})''')
 assert birds['count']>=15 and birds['objects']>=1 and birds['aligned'] and birds['backgroundClear'] and birds['perchesClear'],birds
 page.evaluate('draw()');page.screenshot(path=str(ART/'Quiet-Meadow-0.38-crossroads.png'))
 bird_before=page.evaluate('spawnStatus().birds');page.keyboard.press('Escape');advance(page,.6);assert page.evaluate('spawnStatus().birds')==bird_before;page.keyboard.press('Escape')
 page.evaluate('startNewGame()');assert page.evaluate('HeartQuest.count')==0;assert not page.evaluate('MikuHearts.released');assert page.evaluate('SaveUI.status().count')==0
 return {'minigames':'3 complete through real controls','chapter5':'unknown -> named; dev open','save':'entry/reward/reload/rollback/reset','birds':birds,'boss':'pre-battle point only'}
