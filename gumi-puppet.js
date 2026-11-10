/* One-way hypnosis, descending puppet strings and suspension. Integrated Gumi character rig. */
(()=>{
const duration=12,loopDuration=3.6,frames={};
const clips={pose:{label:'Ожидание',duration:3.6,loop:true},hypnosis:{label:'Гипноз и нити',duration:12,loop:false},puppet:{label:'На нитях',duration:3.6,loop:true},rapid:{label:'Усиленный ритм',duration:1.55,loop:true},damage:{label:'Получение урона',duration:1.1,loop:false},shutdown:{label:'Отключение',duration:3.2,loop:false},soulless:{label:'Опустошение',duration:3,loop:true},death:{label:'Поражение',duration:3.2,loop:false},victory:{label:'Победа над игроком',duration:2.6,loop:true}};
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n)},fade=(t,a,b)=>ease((t-a)/(b-a));
function state(time,mode='pose'){
 if(mode==='freed'){const t=Math.max(0,time),w=t*Math.PI*2/3.8;return {...state(t,'pose'),mode,phase:'Освобождена',torso:Math.sin(w)*.5,head:Math.sin(w-.4)*.8,left:-23+Math.sin(w)*.6,right:104+Math.sin(w)*.6,lift:0,sway:0,threadDescent:0,grip:0,tension:0,suspension:0,signal:0,eyeBlend:0,eyes:'gold',leftTail:Math.sin(w)*.8,rightTail:-Math.sin(w)*.8};}
 if(['puppet','rapid','damage','shutdown','soulless','death','victory'].includes(mode))return battleState(time,mode);
 const t=Math.max(0,Number.isFinite(time)?time:0),hypnosis=mode==='hypnosis',p=t%loopDuration,w=t*Math.PI*2/loopDuration;
 const takeover=hypnosis?fade(t,2.35,5.8):0,eyeBlend=hypnosis?fade(t,2.8,4.8):0,signal=hypnosis?fade(t,1.3,1.8)*(1-fade(t,5.5,6.3)):0;
 const tremor=hypnosis?Math.sin(t*29)*.75*fade(t,1.5,2.2)*(1-fade(t,3.0,4.2)):0;
 const blink=hypnosis?(t>=1.86&&t<1.98)||(t>=2.4&&t<2.53):p>=2.82&&p<2.98;
 const threadDescent=hypnosis?fade(t,8,9.1):0,grip=hypnosis?fade(t,9.1,9.4):0,tension=hypnosis?fade(t,9.4,10.8):0;
 const suspension=hypnosis?fade(t,10.8,11.6):0,lift=tension*12+suspension*Math.sin((t-10.8)*1.5)*.65,sway=suspension*Math.sin((t-10.8)*1.2)*1.1;
 const phase=!hypnosis?'Новая поза':t<1.3?'Ожидание':t<2.8?'Слышит сигнал':t<4.8?'Глаза темнеют':t<8?'Под гипнозом':t<9.1?'Спускаются нити':t<9.4?'Нити схватывают':t<10.8?'Нити поднимают':'Марионетка';
 return {mode,time:t,phase,eyeBlend,eyes:eyeBlend>=1?'black':eyeBlend>0?'darkening':'gold',blink,signal,takeover,threadDescent,grip,tension,suspension,lift,sway,rootAngle:0,alpha:1,legLeft:0,legRight:0,completed:hypnosis&&t>=duration,
  torso:(-4+Math.sin(w)*1.4)*(1-takeover)+(2+Math.sin(t*.9)*2.2*(1-suspension*.65))*takeover+tremor*.3,
  head:(7+Math.sin(w+.55)*1.6)*(1-takeover)+(13+Math.sin(t*.9-.5)*3)*takeover+tremor,
  left:Math.sin(w+.4)*.8*(1-tension)+takeover*20+tension*25,right:Math.sin(w-.4)*1.2*(1-tension)+takeover*67-tension*37,
  leftTail:Math.sin(w+.5)*2.3*(1-takeover)+Math.sin(t*.9)*1.5*takeover,
  rightTail:Math.sin(w-.4)*2.3*(1-takeover)+Math.sin(t*.9-.3)*1.5*takeover};
}
function battleState(time,mode){const t=Math.max(0,Number.isFinite(time)?time:0),clip=clips[mode],age=clip.loop?t%clip.duration:Math.min(t,clip.duration),w=age*Math.PI*2/clip.duration;
 const s={...state(12,'hypnosis'),mode,time:t,phase:clip.label,duration:clip.duration,loop:clip.loop,completed:!clip.loop&&t>=clip.duration,
  torso:3+Math.sin(w)*2,head:14+Math.sin(w-.6)*4,left:45+Math.sin(w+.3)*2,right:30+Math.sin(w-.3)*3,
  lift:12+Math.cos(w)*.6,sway:Math.sin(w)*1.5,leftTail:Math.sin(w+.4)*2,rightTail:Math.sin(w-.4)*2,snap:0};
 if(mode==='rapid'){s.torso=3+Math.sin(w)*8;s.head=14+Math.sin(w-.8)*10;s.left=45+Math.sin(w+.3)*15;s.right=30-Math.sin(w-.3)*22;s.lift=12+Math.sin(w)*2.5;s.sway=Math.sin(w)*3;s.leftTail=Math.sin(w+.4)*8;s.rightTail=Math.sin(w-.4)*8;s.legLeft=Math.sin(w-.4)*4;s.legRight=-s.legLeft}
 if(mode==='damage'){const hit=age<.38?Math.sin(age/.38*Math.PI):0,recovery=1-fade(age,.16,1.1);s.torso-=hit*14+recovery*3;s.head+=hit*14;s.sway-=hit*5;s.lift+=hit*2;s.left+=hit*18;s.right-=hit*20;s.legLeft=hit*7;s.legRight=-hit*4;s.phase=age<.38?'Удар — рывок нитей':age<1.1?'Восстановление':'Восстановилась'}
 if(mode==='shutdown'){const k=fade(age,.2,2.9);s.torso=3+k*17;s.head=14+k*23;s.left=45-k*53;s.right=30+k*64;s.lift=12-k*10;s.sway=0;s.leftTail=0;s.rightTail=0;s.tension=1-k*.65;s.phase=k>=1?'Отключена':'Теряет силы'}
 if(mode==='soulless'){s.torso=14+Math.sin(w)*.7;s.head=28+Math.sin(w-.4);s.left=57+Math.sin(w)*1.2;s.right=82-Math.sin(w)*1.2;s.lift=8+Math.cos(w)*.4;s.sway=Math.sin(w)*1.3;s.tension=.6;s.leftTail=Math.sin(w)*.5;s.rightTail=-s.leftTail}
 if(mode==='victory'){s.torso=-6+Math.sin(w)*4;s.head=-4+Math.sin(w-.4)*6;s.left=98+Math.sin(w)*9;s.right=-5-Math.sin(w)*9;s.lift=12+Math.sin(w)*1.2;s.sway=Math.sin(w)*2;s.legLeft=-Math.sin(w)*6;s.legRight=-s.legLeft;s.leftTail=Math.sin(w+.5)*6;s.rightTail=Math.sin(w-.5)*6}
 if(mode==='death'){const release=fade(age,.2,.8),fall=fade(age,.5,1.9);s.snap=fade(age,.2,.3)*(1-fade(age,.45,.7));s.grip=1-release;s.tension=1-release;s.threadDescent=1-fade(age,.6,1.3);s.rootAngle=78*fall;s.lift=12*(1-fall)-34*fall;s.sway=-18*fall;s.torso=3*(1-fall);s.head=14+fall*6;s.left=45-fall*47;s.right=30+fall*80;s.leftTail=fall*5;s.rightTail=-fall*5;s.alpha=1-fade(age,2.25,3.2);s.phase=age<.5?'Нити рвутся':age<1.9?'Падение':age<3.2?'Поражение':'Побеждена'}
 return s;
}
function sourcePivot(part,x,y){const b=part.crop;return {x:(x-b.left)*part.width/b.width,y:(y-b.top)*part.height/b.height}}
const compiledParts={"head":{"x":0,"y":0,"w":41,"h":34},"black":{"x":42,"y":0,"w":41,"h":34},"body":{"x":84,"y":0,"w":44,"h":86},"left":{"x":129,"y":0,"w":32,"h":38},"right":{"x":162,"y":0,"w":33,"h":39},"blink":{"x":196,"y":0,"w":42,"h":34},"leftPivot":{"x":24.347826086956523,"y":7.146788990825688},"rightPivot":{"x":3.6666666666666665,"y":28.00772200772201},"leftWrist":{"x":13.91304347826087,"y":28.93577981651376},"rightWrist":{"x":23.680555555555557,"y":22.135135135135137}};
function init(atlas){for(const name of ['head','black','body','left','right','blink']){const p=compiledParts[name],c=document.createElement('canvas');c.width=p.w;c.height=p.h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(atlas,p.x,p.y,p.w,p.h,0,0,p.w,p.h);frames[name]=c}for(const k of ['leftPivot','rightPivot','leftWrist','rightWrist'])frames[k]={...compiledParts[k]}}
// Use the same shoulder/arm transforms for the strings and the actual sprites.
const rotate=(p,angle)=>{const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return {x:p.x*c-p.y*s,y:p.x*s+p.y*c}};
function attachments(s){const out=[];for(const [name,side]of [['left',-1],['right',1]]){
 const shoulder={x:side*11,y:-35},p=frames[name+'Pivot'],w=frames[name+'Wrist'],arm=rotate({x:w.x-p.x,y:w.y-p.y},s[name]);
 for(const [kind,offset]of [['shoulder',{x:0,y:0}],['wrist',arm]]){const a=rotate(rotate({x:shoulder.x+offset.x,y:shoulder.y+offset.y},s.torso),s.rootAngle);out.push({name:name+'-'+kind,x:100+s.sway+a.x,y:137-s.lift+a.y,side})}
 }return out}
function pixelLine(g,x0,y0,x1,y1){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;for(;;){g.fillRect(x0,y0,1,1);if(x0===x1&&y0===y1)break;const e=err*2;if(e>=dy){err+=dy;x0+=sx}if(e<=dx){err+=dx;y0+=sy}}}
function drawStrings(g,s,points){if(s.threadDescent<=0)return;g.save();g.fillStyle='#c9c9d5';
 for(const [i,p]of points.entries()){const top={x:p.x+p.side*(p.name.endsWith('wrist')?10:5),y:-16},end={x:p.x,y:top.y+(p.y-top.y)*s.threadDescent},slack=(1-s.tension)*s.threadDescent;
  let old=top;for(let j=1;j<=18;j++){const q=j/18,a={x:top.x+(end.x-top.x)*q+Math.sin(q*Math.PI)*(4+Math.sin(s.time*3+i)*2)*slack,y:top.y+(end.y-top.y)*q};pixelLine(g,old.x,old.y,a.x,a.y);old=a}
 }g.restore()}
function drawKnots(g,s,points){if(s.grip<=0)return;g.save();g.globalAlpha*=s.grip;for(const p of points){const x=Math.round(p.x),y=Math.round(p.y);g.fillStyle='#e5d8a1';g.fillRect(x-2,y-1,5,1);g.fillRect(x-2,y+1,5,1);g.fillRect(x-2,y,1,1);g.fillRect(x+2,y,1,1)}g.restore()}
function drawSnap(g,s,points){if(!s.snap)return;g.save();g.globalAlpha=s.snap;g.fillStyle='#f1cf9b';for(const p of points){const x=Math.round(p.x),y=Math.round(p.y-5);g.fillRect(x-5,y,2,1);g.fillRect(x+4,y,2,1);g.fillRect(x-2,y-4,1,2);g.fillRect(x+2,y-4,1,2)}g.restore()}
function drawSignal(g,s){if(s.signal<=0)return;g.save();g.globalAlpha=s.signal*.65;g.strokeStyle='#be9bd8';g.lineWidth=1;for(let i=0;i<3;i++){const q=((s.time*1.1+i/3)%1+1)%1,r=20+q*20;g.globalAlpha=s.signal*(1-q)*.62;g.beginPath();g.ellipse(100,76,r,r*.72,0,.2+q,Math.PI*1.85+q);g.stroke()}g.restore()}
function drawHead(g,s){const f=s.blink?frames.blink:frames.head;if(s.eyeBlend>=1){g.drawImage(frames.black,-frames.black.width/2,-frames.black.height+3);return}g.drawImage(f,-f.width/2,-f.height+3);if(s.eyeBlend>0&&!s.blink){g.save();g.globalAlpha*=s.eyeBlend;g.drawImage(frames.black,-frames.black.width/2,-frames.black.height+3);g.restore()}}
function draw(g,t,mode='pose',options={}){let s=state(t,mode);const hip={x:100,y:137},body=frames.body,w=body.width,split=43,lower=body.height-split,rad=n=>n*Math.PI/180;if(options.releaseAge!==undefined){const q=ease(options.releaseAge/1.1),rest=state(t,'freed');s={...rest,lift:12*(1-q),torso:3*(1-q)+Math.sin(q*Math.PI)*22+rest.torso*q,head:14*(1-q)+Math.sin(q*Math.PI)*14+rest.head*q,threadDescent:1-fade(options.releaseAge,0,.45),left:45*(1-q)+rest.left*q,right:30*(1-q)+rest.right*q,eyeBlend:1-fade(options.releaseAge,.15,1.1)};}const points=attachments(s),visiblePoints=options.cutShoulders?points.filter(p=>p.name.endsWith('wrist')):points;g.save();g.imageSmoothingEnabled=false;g.globalAlpha*=s.alpha;drawSignal(g,s);
 g.fillStyle='rgba(12,17,27,'+(.52-s.tension*.19)+')';g.beginPath();g.ellipse(100,184,20-s.tension*4,5-s.tension,0,0,Math.PI*2);g.fill();drawStrings(g,s,visiblePoints);drawSnap(g,s,visiblePoints);if(options.cutShoulders&&options.cutAge<.8)drawSnap(g,{...s,snap:1-options.cutAge/.8},points.filter(p=>p.name.endsWith('shoulder')));
 g.save();g.translate(100+s.sway,137-s.lift);g.rotate(rad(s.rootAngle));g.translate(-100,-137);
 for(const side of [-1,1]){g.save();g.translate(hip.x+side*(w/2-8),hip.y);g.rotate(rad(side<0?s.leftTail:s.rightTail));const sx=side<0?0:w-9;g.drawImage(body,sx,split,9,25,side<0?-9:0,0,9,25);g.restore()}
 // Once the strings pull tight, lift the entire puppet, including both boots.
 if(s.legLeft||s.legRight){for(const [side,angle]of [[-1,s.legLeft],[1,s.legRight]]){const sx=side<0?7:w/2,sw=w/2-7;g.save();g.translate(hip.x+side*sw/2,hip.y);g.rotate(rad(angle));g.drawImage(body,sx,split,sw,lower,-sw/2,0,sw,lower);g.restore()}}
 else{g.drawImage(body,9,split,w-18,22,hip.x-w/2+9,hip.y,w-18,22);g.drawImage(body,0,split+22,w,lower-22,hip.x-w/2,hip.y+22,w,lower-22)}
 g.translate(hip.x,hip.y);g.rotate(rad(s.torso));
 for(const [name,side,angle]of [['left',-1,s.left],['right',1,s.right]]){const arm=frames[name],p=frames[name+'Pivot'];g.save();g.translate(side*11,-35);g.rotate(rad(angle));g.drawImage(arm,-p.x,-p.y);g.restore()}
 g.drawImage(body,0,0,w,split+3,-w/2,-split,w,split+3);g.translate(0,-split+1);g.rotate(rad(s.head));drawHead(g,s);g.restore();drawKnots(g,s,visiblePoints);g.restore();return s;
}
function drawAt(g,x,y,scale,time,mode='puppet',options={}){g.save();g.translate(x-100*scale,y-184*scale);g.scale(scale,scale);const result=draw(g,time,mode,options);g.restore();return result}
function portrait(g,time=0,face='neutral'){const blink=face!=='hypnotized'&&time%5>4.7&&time%5<4.88,im=face==='hypnotized'?frames.black:blink?frames.blink:frames.head;g.fillStyle='#214b48';g.fillRect(0,0,48,48);g.imageSmoothingEnabled=false;g.drawImage(im,Math.round((48-im.width)/2),Math.round((48-im.height)/2))}
globalThis.GumiPoseV2={init,state,draw,drawAt,portrait,attachments,duration,loopDuration,frames,clips};
})();
