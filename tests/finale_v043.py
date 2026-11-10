"""Real final-heart continuation: laughter, ordered fades, falling and original Miku model."""
from pathlib import Path
from features_v043 import dialogue_done
ART=Path(__file__).resolve().parents[2]
def advance(page,s):return page.evaluate('''s=>{for(let t=0;t<s-1e-8;t+=.02)tick(Math.min(.02,s-t));draw();return MikuRupture.status()}''',s)
def until(page,phase):
 state=page.evaluate('''phase=>{for(let i=0;i<6000&&MikuRupture.status().phase!==phase;i++)tick(.01);draw();return MikuRupture.status();}''',phase)
 assert state['phase']==phase,state
 return state

def run(page):
 assert page.evaluate('MikuRupture.isActive');assert page.evaluate('HeartQuest.count')==3
 before=page.evaluate('captureSnapshot()')
 def ghosts():return page.evaluate('''()=>{const saved=drawPerson,seen=[];try{drawPerson=(p,n)=>{if(n==='miku_shadow')seen.push({x:p.x,y:p.y});saved(p,n);};draw();}finally{drawPerson=saved;}return seen;}''')
 a=ghosts();advance(page,.18);b=ghosts();assert len(a)==len(b)==12 and any(abs(x['y']-y['y'])>.2 for x,y in zip(a,b))
 page.keyboard.press('Escape');paused=page.evaluate('MikuRupture.status()');advance(page,.6);assert page.evaluate('MikuRupture.status()')==paused;page.keyboard.press('Escape')
 until(page,'question');assert page.locator('#dialogue-text').get_attribute('aria-label')=='Что происходит...'
 page.screenshot(path=str(ART/'Quiet-Meadow-0.43-laughter-question.png'));dialogue_done(page)
 shots=[]
 for group in ['vegetation','decor','echoes','world']:
  until(page,group);state=advance(page,{'vegetation':1.6,'decor':1.4,'echoes':1.1,'world':1.5}[group]);assert 0<state['opacity'][group]<1
  earlier=['vegetation','decor','echoes','world'][:['vegetation','decor','echoes','world'].index(group)]
  assert all(state['opacity'][x]==0 for x in earlier),state
  page.screenshot(path=str(ART/f'Quiet-Meadow-0.43-fade-{group}.png'));shots.append(group)
 until(page,'fall');top=page.evaluate('MikuRupture.status().fall');assert top['y']<0
 state=advance(page,3.4);assert 460<state['fall']['y']<520,state
 page.screenshot(path=str(ART/'Quiet-Meadow-0.43-falling.png'))
 state=advance(page,3.4);assert state['fall']['y']>1000,state
 until(page,'idle');assert page.evaluate('BattleUI.isOpen&&BattleUI.status().encounter==="miku"')
 advance(page,1.4)
 assert page.evaluate('PreparedMikuArt.status().source.includes("Mesmerizer")')
 assert page.evaluate('Object.keys(MikuOriginalRigData.clips).length')==7
 assert page.evaluate('''()=>{const a=document.querySelector('#miku-face').getContext('2d').getImageData(0,0,48,48).data;return [...a].every((v,i)=>i%4===3||v===0);}''')
 assert page.locator('#battle .hero-card').evaluate("e=>getComputedStyle(e).backgroundColor")=='rgb(0, 0, 0)'
 assert page.locator('#battle .hero-card').evaluate("e=>getComputedStyle(e).borderTopColor")=='rgb(255, 255, 255)'
 assert page.evaluate('''()=>{const p=document.querySelector('#battle-scene').getContext('2d').getImageData(20,450,1,1).data;return p[0]===0&&p[1]===0&&p[2]===0;}''')
 # Baked shadow is removed without deleting any opaque shoe pixels.
 clean=page.evaluate('''()=>{let removed=0,opaqueLost=0;for(let f=0;f<12;f++){const im=textures['teto_2_'+f],c=document.createElement('canvas');c.width=24;c.height=32;const q=c.getContext('2d');q.drawImage(im,0,0);const a=q.getImageData(0,0,24,32).data,b=ActorSpriteArt.clean(im).getContext('2d').getImageData(0,0,24,32).data;for(let i=0;i<a.length;i+=4){if(a[i+3]===255&&b[i+3]!==255)opaqueLost++;if(a[i+3]>0&&b[i+3]===0)removed++;}}return {removed,opaqueLost};}''');assert clean['removed']>100 and clean['opaqueLost']==0,clean
 u=page.evaluate('BattleUI.status().player.u');page.keyboard.down('a');advance(page,.2);page.keyboard.up('a');assert page.evaluate('BattleUI.status().player.u')<u-.03
 page.keyboard.press('Space');advance(page,.15);assert page.evaluate('BattleUI.status().player.jump')>0
 page.screenshot(path=str(ART/'Quiet-Meadow-0.43-miku-void-arena.png'))
 checkpoint=page.evaluate('captureSnapshot()');assert checkpoint['activity']['type']=='miku-void';assert page.evaluate('SaveModel.valid(captureSnapshot())');page.evaluate('s=>restoreSnapshot(s)',checkpoint);assert page.evaluate('BattleUI.status().encounter')=='miku'
 # Developer rewind still works from the arena and removes every cinematic effect.
 page.keyboard.press('F3');page.locator('#developer-teleport').click();page.locator('#developer-scroll [data-slot="1"]').click()
 assert page.evaluate('HeartQuest.count')==0 and not page.evaluate('MikuRupture.isActive||BattleUI.isOpen')
 assert page.evaluate('MikuRupture.status().opacity.vegetation')==1
 page.evaluate('s=>restoreSnapshot(s)',before)
 return {'order':shots,'fall':'smooth top-centre-bottom with rotation and white wind','miku':'original prepared SpriteSkin model; empty portrait; monochrome UI','shadow':clean,'arenaSave':'restored','developerRewind':'passed'}
