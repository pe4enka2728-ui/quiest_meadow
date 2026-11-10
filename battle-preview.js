(()=>{
const images={},training=document.body.dataset.training==='true';let manual=false,last=0,practiceIndex=0;
function imageFile(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Не удалось загрузить '+src));im.src=src})}
async function init(){await document.fonts.load('24px QuietMeadowPixel');const files={battleStoryPortraits:'battle-story-portraits',sceneryAtlas:'scenery-atlas',flowerIdle:'flower-idle',mikuAnimated:'miku-animated',miku_happy:'mesme_face_miku_egao',tetoFace:'teto-face',tetoFaceBlink:'teto-face-blink',tetoFaceHappy:'teto-face-happy',tetoFaceWorried:'teto-face-worried'};for(let i=0;i<12;i++)files['teto_2_'+i]='teto_2_'+i;await Promise.all(Object.entries(files).map(async([key,file])=>images[key]=await imageFile('assets/'+file+'.png')));FlowerMob.init(images.flowerIdle);BattleUI.init(images,{training});BattleUI.open();
 if(training){
  const controls=document.querySelector('#training-attacks');
  FlowerAttacks.definitions.forEach((attack,index)=>{const button=document.createElement('button');button.type='button';button.textContent=(index+1)+' '+attack.name;button.addEventListener('click',()=>play(index));controls.append(button)});
  document.querySelector('#training-repeat').onclick=()=>play(practiceIndex);
  document.querySelector('#training-safe').onchange=()=>play(practiceIndex);
  play(0);
 }
requestAnimationFrame(frame)}
function frame(ts){const dt=Math.min((ts-last)/1000||0,.033);last=ts;if(!manual)BattleUI.update(dt);BattleUI.draw();requestAnimationFrame(frame)}
function play(index){practiceIndex=index;BattleUI.practice(index,document.querySelector('#training-safe').checked);document.querySelectorAll('#training-attacks button').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index))})}
window.addEventListener('keydown',e=>{if(training&&!BattleUI.status().localPaused){const digit=PixelUI.digit(e);if(digit>=1&&digit<=7){e.preventDefault();if(!e.repeat)play(digit-1);return}}BattleUI.handleKey(e)});window.addEventListener('keyup',e=>BattleUI.keyUp(e));window.addEventListener('blur',()=>{if(BattleUI.isOpen)BattleUI.localPause(true)});
window.battlePreview={get ready(){return BattleUI.status().ready},get state(){return BattleUI.status()},select:BattleUI.select,pause:BattleUI.localPause,draw:BattleUI.draw,freeze(){manual=true;BattleUI.draw()},step(dt){manual=true;BattleUI.update(dt);BattleUI.draw()}};init();
})();
