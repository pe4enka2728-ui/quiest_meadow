/* Smooth room scrolling is independent from actor/world coordinates. */
(()=>{
class RoomCamera{
 constructor(){this.snap(0)}
 snap(y,x=0){this.x=x;this.targetX=x;this.following=false;this.y=y;this.fromY=y;this.targetY=y;this.elapsed=0;this.duration=0;this.active=false}
 start(y,duration=1.65){if(duration<=0){this.snap(y);return}this.fromY=this.y;this.targetY=y;this.elapsed=0;this.duration=duration;this.active=true}
 follow(body,bounds,dt=0,instant=false){const tx=Math.max(0,Math.min(bounds.width-1536,body.x-768)),ty=Math.max(0,Math.min(bounds.height-1024,body.y-550));this.targetX=tx;this.targetY=ty;this.following=true;this.active=false;const f=instant?1:1-Math.exp(-Math.max(0,dt)*9);this.x+=(tx-this.x)*f;this.y+=(ty-this.y)*f;}
 update(dt){if(!this.active)return;const next=this.elapsed+dt;this.elapsed=next>=this.duration-1e-9?this.duration:next;const u=this.elapsed/this.duration,eased=u*u*(3-2*u);this.y=this.fromY+(this.targetY-this.fromY)*eased;if(this.elapsed>=this.duration){this.y=this.targetY;this.active=false}}
}
globalThis.RoomCamera=RoomCamera;
})();
