"""Solid angled cube, original moving tail, and four usable column obstacles."""
import neru_v052 as base
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'validation'
original_run=base.run
def run(p,label):
 report=original_run(p,label)
 p.evaluate('developerWarp(6);draw()');p.screenshot(path=str(ART/f'{label}-angled-cube.png'))
 assert p.evaluate('SpawnWorld.blocked(790,438)&&!SpawnWorld.clear({x:690,y:460},{x:850,y:460})')
 order=p.evaluate('''()=>{const c=document.createElement('canvas');c.width=1536;c.height=1024;const g=c.getContext('2d'),old=g.drawImage,items=[];g.drawImage=function(im,...a){if(im===textures.neruCubeWorld)items.push('cube');if(im===ActorSpriteArt.clean(textures.neruWorld))items.push('neru');return old.call(this,im,...a);};CloudWorldArt.draw(g,0,[],()=>{});return items;}''');assert order==['cube','neru'],order
 tail=p.evaluate('''()=>{const c=PreparedNeruArt.frame(0),a=c.getContext('2d').getImageData(0,0,256,256).data;let yellow=0;for(let y=126;y<240;y++)for(let x=20;x<110;x++){const i=(y*256+x)*4;if(a[i]>180&&a[i+1]>95&&a[i+2]<90&&a[i+3]>120)yellow++;}return {yellow,...PreparedNeruArt.status()};}''');assert tail['tail']=='side-tail' and tail['tailBones']==6 and tail['yellow']>20,tail
 p.evaluate('NeruEncounter.resume()');base.step(p,1.1)
 positions=p.evaluate('NeruSceneModel.columns.map(c=>({...c,p:NeruSceneModel.project(c.u,c.v)}))');assert all(400<c['p'][0]<1150 and 500<c['p'][1]<700 for c in positions)
 for i,c in enumerate(positions):
  p.evaluate('c=>BattleUI.testing({player:{u:c.u,v:c.v+.12,dir:0,walk:0,jump:0,z:0}})',c);p.keyboard.down('w');p.keyboard.press('Space');base.step(p,.4);p.keyboard.up('w');body=base.state(p)['battle']['player'];assert body['v']>c['v'] and not p.evaluate('p=>NeruSceneModel.blocked(p)',body)
  for side in [-1,1]:
   p.evaluate('o=>BattleUI.testing({player:{u:o.c.u,v:o.c.v+o.side*.1,dir:0,walk:0,jump:0,z:0}})',{'c':c,'side':side})
   layers=p.evaluate('''()=>{const g=document.querySelector('#battle-scene').getContext('2d'),old=g.drawImage,items=[];g.drawImage=function(im,...a){if(im.width===32&&im.height===83)items.push({kind:'column',x:a[0]+a[2]/2});if(im.width===24&&im.height===32)items.push({kind:'teto'});return old.call(this,im,...a);};try{BattleUI.draw();}finally{g.drawImage=old;}return items;}''')
   target=min((j for j,item in enumerate(layers)if item['kind']=='column'),key=lambda j:abs(layers[j]['x']-c['p'][0]));actor=next(j for j,item in enumerate(layers)if item['kind']=='teto');assert (target>actor)==(side<0),(c,side,layers)
   if i==2:p.screenshot(path=str(ART/(f'{label}-column-'+('behind' if side<0 else 'front')+'.png')))
 p.evaluate('BattleUI.testing({player:{u:.5,v:.56,dir:0,walk:0,jump:0,z:0}})');base.step(p,6.3);p.screenshot(path=str(ART/f'{label}-neru-enlarged-arena.png'));assert base.state(p)['battle']['phase']=='command';assert p.evaluate('SaveModel.valid(captureSnapshot())')
 report.update(angledCube=True,independentCubeCollision=True,tailYellowPixels=tail['yellow'],tailBones=tail['tailBones'],columnsOnCloud=True,columnsStopWalkAndJump=True,columnsOccludeByDepth=True,largerArena=True)
 return report
base.run=run
if __name__=='__main__':
 import sys
 base.launch(sys.argv[1]if len(sys.argv)>1 else 'source')
