/* Pure minigame rules. No world state, storage, DOM or combat damage is changed here. */
(()=>{
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class Pulse {
 constructor(){this.kind='red';this.clock=0;this.phase='play';this.checkpoint=0;this.failures=0;this.recover=0;this.won=false;this.message='';this.platforms=[
  {x:0,w:300,y:720},{x:400,w:155,y:672,amp:10},{x:650,w:140,y:620,amp:14,spikes:true},
  {x:890,w:160,y:685,amp:12},{x:1160,w:240,y:720,checkpoint:true},
  {x:1510,w:145,y:650,amp:12},{x:1760,w:150,y:608,amp:14,spikes:true},
  {x:2000,w:145,y:675,amp:12},{x:2240,w:280,y:720}];this.reset();}
 top(i,t=this.clock){const p=this.platforms[i];return p.y+(p.amp||0)*Math.sin(t*1.45+i*.8);}
 spike(i){const p=this.platforms[i];if(!p.spikes)return 'off';const t=(this.clock+i*.53)%4.5;return t<.85?'active':t>3.8?'warning':'off';}
 reset(){const i=this.checkpoint,p=this.platforms[i];this.player={x:i?p.x+62:92,y:this.top(i),vx:0,vy:0,dir:1,ground:i,coyote:.12,jumpBuffer:0,walk:0};this.recover=0;}
 retry(){this.failures++;this.recover=.65;this.player.ground=-1;this.message='Пульс сбился. Возвращаемся к площадке.';}
 jump(){if(this.phase==='play')this.player.jumpBuffer=.12;}
 update(dt,input={}){if(this.won)return;this.clock+=dt;if(this.recover>0){this.recover-=dt;if(this.recover<=0)this.reset();return;}
  const p=this.player,oldY=p.y,oldGround=p.ground,axis=(input.right?1:0)-(input.left?1:0);p.vx=axis*(input.run?300:250);if(axis){p.dir=axis>0?1:3;p.walk+=dt;}
  if(oldGround>=0){p.y=this.top(oldGround);p.coyote=.12;}else p.coyote=Math.max(0,p.coyote-dt);
  p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);if(p.jumpBuffer>0&&p.coyote>0){p.vy=-540;p.ground=-1;p.coyote=0;p.jumpBuffer=0;}
  p.x=clamp(p.x+p.vx*dt,20,2500);if(p.ground>=0){const base=this.platforms[p.ground];if(p.x+13<base.x||p.x-13>base.x+base.w){p.ground=-1;p.vy=0;}}
  if(p.ground<0){p.vy+=1250*dt;p.y+=p.vy*dt;if(p.vy>=0)for(let i=0;i<this.platforms.length;i++){const a=this.platforms[i],top=this.top(i);if(p.x+13>a.x&&p.x-13<a.x+a.w&&oldY<=top+8&&p.y>=top){p.y=top;p.vy=0;p.ground=i;p.coyote=.12;break;}}}
  if(p.ground>=0){const a=this.platforms[p.ground];if(a.checkpoint){this.checkpoint=p.ground;this.message='Середина пути: здесь сохранён твой шаг.';}if(this.spike(p.ground)==='active'&&p.x>a.x+35&&p.x<a.x+a.w-24){this.retry();return;}}
  if(p.y>1000){this.retry();return;}if(p.x>2390&&p.ground===8){this.won=true;this.phase='won';}
 }
 status(){return {kind:this.kind,phase:this.phase,clock:this.clock,checkpoint:this.checkpoint,failures:this.failures,recover:this.recover,player:{...this.player},won:this.won};}
}
class Memory {
 constructor(seed=73591){this.kind='yellow';this.schema=2;this.seed=seed>>>0;this.clock=0;this.round=0;this.phase='demo';this.age=0;this.cursor=0;this.selected=0;this.errors=0;this.feedback=-1;this.won=false;this.signals=[];this.sequences=[];
  const random=()=>{this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed>>>16;};
  for(let r=0;r<3;r++){const events=[],redAt=random()%(r+4);for(let i=0;i<r+4;i++){let index=random()%4;if(index===events.at(-1)?.index)index=(index+1)%4;events.push({index,red:i===redAt});}this.signals.push(events);this.sequences.push(events.filter(e=>!e.red).map(e=>e.index));}
 }
 get sequence(){return this.sequences[this.round];}
 get signal(){if(this.phase==='input'&&this.feedback>=0&&this.age<.2)return {index:this.feedback,red:false};if(this.phase!=='demo')return null;const t=this.age-.65,i=Math.floor(t/.96),events=this.signals[this.round];return t>=0&&i<events.length&&t%.96<.72?events[i]:null;}
 get lit(){return this.signal?.index??-1;}
 get litColor(){return this.signal?(this.signal.red?'red':'yellow'):null;}
 get falseEye(){return -1;}
 choose(index){if(this.phase!=='input'||!Number.isInteger(index)||index<0||index>3)return false;this.selected=index;this.feedback=index;this.age=0;if(index!==this.sequence[this.cursor]){this.phase='error';this.errors++;return false;}this.cursor++;if(this.cursor===this.sequence.length){this.phase='round-won';this.age=0;}return true;}
 retry(){this.phase='demo';this.age=0;this.cursor=0;this.feedback=-1;this.won=false;}
 update(dt){if(this.won)return;this.clock+=dt;this.age+=dt;if(this.phase==='demo'&&this.age>=.65+this.signals[this.round].length*.96+.35){this.phase='input';this.age=0;this.cursor=0;this.feedback=-1;}else if(this.phase==='error'&&this.age>=.85)this.retry();else if(this.phase==='round-won'&&this.age>=1){if(this.round===2){this.phase='won';this.won=true;}else{this.round++;this.retry();}}}
 status(){return {kind:this.kind,schema:2,phase:this.phase,round:this.round,age:this.age,clock:this.clock,cursor:this.cursor,selected:this.selected,lit:this.lit,litColor:this.litColor,signalCount:this.signals[this.round].length,answerCount:this.sequence.length,errors:this.errors,won:this.won};}
}
const mirrorRooms=[
 {left:[[2,3],[3,3],[4,3]],right:[[2,3],[3,3],[4,3]],pads:[[5,1],[1,1]]},
 {left:[[2,2],[2,3],[4,4]],right:[[4,2],[4,3],[2,4]],pads:[[1,1],[2,1]]},
 {left:[[3,2],[3,3],[2,4]],right:[[2,2],[4,3],[4,4]],pads:[[5,1],[4,1]]}
];
class Mirror {
 constructor(){this.kind='blue';this.clock=0;this.room=0;this.won=false;this.phase='play';this.age=0;this.steps=0;this.reset();}
 reset(){this.real={x:3,y:5};this.reflection={x:3,y:5};this.frozen=0;this.cooldown=0;this.bump=0;this.phase='play';this.age=0;}
 get layout(){return mirrorRooms[this.room];}
 clear(x,y,side){return x>=1&&x<=5&&y>=1&&y<=5&&!this.layout[side].some(p=>p[0]===x&&p[1]===y);}
 freeze(){if(this.phase!=='play'||this.cooldown>0)return false;this.frozen=2;this.cooldown=3;return true;}
 move(dx,dy){if(this.phase!=='play'||Math.abs(dx)+Math.abs(dy)!==1)return;let moved=false;for(const [body,side,mx]of [[this.real,'left',dx],[this.reflection,'right',-dx]]){if(side==='right'&&this.frozen>0)continue;if(this.clear(body.x+mx,body.y+dy,side)){body.x+=mx;body.y+=dy;moved=true;}}
  if(!moved)this.bump=.25;this.steps++;const [a,b]=this.layout.pads;if(this.real.x===a[0]&&this.real.y===a[1]&&this.reflection.x===b[0]&&this.reflection.y===b[1]){this.phase='room-won';this.age=0;}
 }
 update(dt){if(this.won)return;this.clock+=dt;this.age+=dt;this.frozen=Math.max(0,this.frozen-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.bump=Math.max(0,this.bump-dt);if(this.phase==='room-won'&&this.age>=1.1){if(this.room===2){this.phase='won';this.won=true;}else{this.room++;this.reset();}}}
 status(){return {kind:this.kind,phase:this.phase,clock:this.clock,room:this.room,age:this.age,real:{...this.real},reflection:{...this.reflection},frozen:this.frozen,cooldown:this.cooldown,bump:this.bump,steps:this.steps,won:this.won};}
}
globalThis.HeartGamesModel={Pulse,Memory,Mirror,mirrorRooms,create(id){if(id==='red')return new Pulse();if(id==='yellow')return new Memory();if(id==='blue')return new Mirror();throw Error('Неизвестное сердце');}};
})();
