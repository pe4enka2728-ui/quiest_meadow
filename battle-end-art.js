/* Ending animations use their own phase age while the rest of combat is frozen. */
(()=>{
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n)};
function hero(g,image,x,y,age){
 const fall=ease((age-.12)/.8),fade=1-ease((age-1.5)/.6);
 g.save();g.globalAlpha=fade;g.translate(x,y);g.rotate(-fall*Math.PI/2);g.imageSmoothingEnabled=false;
 g.drawImage(image,-image.width*1.5,-image.height*3,image.width*3,image.height*3);g.restore();
 g.save();g.globalAlpha=clamp((age-.7)*2,0,1)*fade;
 for(let i=0;i<15;i++){const a=i*2.4,spread=(age-.6)*18;g.fillStyle=i%2?'#e9b6c5':'#e6d18e';g.fillRect(Math.round((x+Math.cos(a)*spread)/3)*3,Math.round((y-12-i*3-spread*.4)/3)*3,3,3)}g.restore();
}
function flower(g,image,x,y,age){
 const wilt=ease(age/1.2),sway=Math.sin(age*24)*7*(1-wilt);
 g.save();g.translate(x,y);g.rotate((sway+wilt*65)*Math.PI/180);g.scale(1-wilt*.15,1-wilt*.65);g.globalAlpha=1-wilt*.25;g.imageSmoothingEnabled=false;g.drawImage(image,-image.width*1.5,-image.height*3,image.width*3,image.height*3);g.restore();
 g.save();g.globalAlpha=1-ease((age-1.2)/.6);for(let i=0;i<12;i++){const a=i*2.4,r=Math.max(0,age-.15)*35,xp=x+Math.cos(a)*r,yp=y-75+age*48+Math.sin(a)*r*.5;g.fillStyle=i%2?'#efb4c2':'#edd594';g.fillRect(Math.round(xp/3)*3,Math.round(yp/3)*3,6,3)}g.restore();
}
globalThis.BattleEndArt={hero,flower};
})();
