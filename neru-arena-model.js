/* Open cloud edge, seeded placements and elastic reflection on the oval arena. */
(()=>{
'use strict';
const TAU=Math.PI*2,RX=5.16,RY=3.36,CY=4.16;
const bossSolid=Object.freeze({id:'neru-platform',u:.5,v:-.065,radius:1.45,height:5.4});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function radius(p,margin=0){return Math.hypot(p.x/(RX-margin),(p.y-CY)/(RY-margin));}
function inside(p,margin=0){return radius(p,margin)<=1+1e-8;}
function inset(p,margin=.2){const d=radius(p,margin);return d<=1?{...p}:{...p,x:p.x/d,y:CY+(p.y-CY)/d};}
function randomPoint(random,margin=.6){const a=random()*TAU,r=Math.sqrt(random());return {x:Math.cos(a)*(RX-margin)*r,y:CY+Math.sin(a)*(RY-margin)*r};}
function columns(random,count,player={x:0,y:4.48}){const out=[];for(let i=0;i<count;i++){let p;for(let tries=0;tries<500;tries++){p=randomPoint(random,.9);if(p.y>1.5&&Math.hypot(p.x-player.x,p.y-player.y)>1.0&&out.every(c=>Math.hypot(c.x-p.x,c.y-p.y)>1.55))break;}out.push({id:'column-'+i,x:p.x,y:p.y,baseX:p.x,baseY:p.y,u:p.x/12+.5,v:p.y/8,radius:.44,height:5.4,scale:2.3,hp:3,maxHp:3,broken:false,brokenAt:-Infinity,flashAt:-Infinity});}return out;}
function separate(player,solids){solids=[bossSolid,...solids];for(let pass=0;pass<3;pass++)for(const c of solids){const x=(player.u-c.u)*12,y=(player.v-c.v)*8,r=c.radius+.19,d=Math.hypot(x,y);if(d<r){player.u=c.u+(d?x/d:1)*r/12;player.v=c.v+(d?y/d:0)*r/8;}}}
function move(player,dt,input,solids){const dx=input.dx||0,dy=input.dy||0,n=Math.hypot(dx,dy)||1,s=input.speedScale||1,du=dx/n*4.4*s*dt/12,dv=dy/n*4.4*s*dt/8,steps=Math.max(1,Math.ceil(Math.hypot(du*12,dv*8)/.08));separate(player,solids);for(let i=0;i<steps;i++){player.u+=du/steps;player.v+=dv/steps;separate(player,solids);}if(dx||dy){player.walk+=dt*120;player.dir=Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?2:0;}player.jump=Math.max(0,(player.jump||0)-dt);player.z=player.jump?Math.sin((1-player.jump/.72)*Math.PI)*56:0;}
function reflect(e,margin=.2){const rx=RX-margin,ry=RY-margin,ny=e.y-CY,d=Math.hypot(e.x/rx,ny/ry);if(d<=1)return false;e.x/=d;e.y=CY+ny/d;let nx=e.x/(rx*rx),normalY=(e.y-CY)/(ry*ry),length=Math.hypot(nx,normalY);nx/=length;normalY/=length;const dot=e.vx*nx+e.vy*normalY;if(dot>0){e.vx-=2*dot*nx;e.vy-=2*dot*normalY;}return true;}
globalThis.NeruArena={RX,RY,CY,bossSolid,radius,inside,inset,randomPoint,columns,separate,move,reflect,clamp};
})();
