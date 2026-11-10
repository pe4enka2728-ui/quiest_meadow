/* Portal art uses the same foot positions as its solid frame and trigger. */
(()=>{
const snap=n=>Math.round(n/3)*3;
function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(snap(x),snap(y),snap(w),snap(h));}
function poly(g,p,c){g.fillStyle=c;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(snap(x),snap(y)):g.moveTo(snap(x),snap(y)));g.closePath();g.fill();}
function draw(g,p,outside=false){const {x,y}=p;
 if(outside){poly(g,[[x-36,y-70],[x+36,y-70],[x+36,y],[x-36,y]],'#253b37');for(let k=0;k<4;k++)rect(g,x-34,y-61+k*15,68,3,'#8d8155');}
 else{rect(g,x-64,y-70,128,73,'#513e3b');rect(g,x-60,y-67,120,3,'#a58059');}
 poly(g,[[x-45,y],[x-45,y-60],[x-36,y-78],[x-21,y-90],[x+21,y-90],[x+36,y-78],[x+45,y-60],[x+45,y]],'#291e2c');
 poly(g,[[x-36,y],[x-36,y-57],[x-27,y-72],[x-15,y-81],[x+15,y-81],[x+27,y-72],[x+36,y-57],[x+36,y]],'#b58b57');
 poly(g,[[x-27,y],[x-27,y-54],[x-18,y-66],[x-9,y-72],[x+9,y-72],[x+18,y-66],[x+27,y-54],[x+27,y]],'#142627');
 for(const side of [-1,1]){rect(g,x+side*36-3,y-51,6,51,'#e0bd7c');rect(g,x+side*39-6,y-3,12,9,'#674b37');}
 rect(g,x-30,y,60,6,'#d5b47b');rect(g,x-33,y+6,66,6,'#5e4a37');
 poly(g,[[x,y-62],[x+9,y-50],[x+3,y-50],[x+3,y-39],[x-3,y-39],[x-3,y-50],[x-9,y-50]],'#d9e3be');
}
globalThis.StageExitArt={draw};
})();
