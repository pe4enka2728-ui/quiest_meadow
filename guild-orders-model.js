/* Persistent guild-board reading, accepted order and one-time reward. */
(()=>{
'use strict';
const order={id:'find-gumi',title:'Найти Гуми',name:'Гуми',number:'ЗАКАЗ № 01',client:'Гильдия авантюристов',place:'Цирк за северным лесом · главный шатёр',route:'Тихая поляна → северный лес → цирк → главный шатёр',objective:'Найти Гуми и освободить её от чужого сигнала.',description:'Певицу с зелёными волосами видели возле цирка. С тех пор её выступления изменились, а сама она перестала отвечать на письма. Гильдия просит выяснить, что произошло, и вернуть Гуми в чувство.',reward:150,warning:'Высокая опасность · магия и гипноз',requirement:'Для прохода через лесные ворота понадобится золотой ключ.',deadline:'Без срока',report:'Вернитесь к этой доске после освобождения Гуми.'};
const fresh=()=>({schema:1,seen:false,gumiAccepted:false,gumiRewarded:false});
function valid(s){return !!s&&s.schema===1&&['seen','gumiAccepted','gumiRewarded'].every(k=>typeof s[k]==='boolean')&&(!s.gumiAccepted||s.seen)&&(!s.gumiRewarded||s.gumiAccepted);}
function normalize(s){return valid(s)?{schema:1,seen:s.seen,gumiAccepted:s.gumiAccepted,gumiRewarded:s.gumiRewarded}:fresh();}
function read(s){return {...normalize(s),seen:true};}
function accept(s){s=normalize(s);if(s.gumiAccepted)return {ok:false,reason:'accepted',state:s};return {ok:true,state:{...s,seen:true,gumiAccepted:true}};}
function status(s,freed=false){s=normalize(s);return s.gumiRewarded?'rewarded':!s.gumiAccepted?'available':freed?'ready':'accepted';}
function claim(s,freed,gold){s=normalize(s);if(status(s,freed)!=='ready')return {ok:false,reason:s.gumiRewarded?'rewarded':'not-ready'};if(!Number.isSafeInteger(gold)||gold<0||gold+order.reward>100000)return {ok:false,reason:'gold-limit'};return {ok:true,state:{...s,gumiRewarded:true},amount:order.reward,gold:gold+order.reward};}
const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
function leafletFrame(age){const q=ease((age-.13)/.88);return {x:260+(270-260)*q,y:282+(140-282)*q-Math.sin(q*Math.PI)*64,w:310+250*q,h:414+334*q,angle:-9+8.3*q,lift:q,hands:ease((age-.04)/.62),details:ease((age-.55)/.55)};}
globalThis.GuildOrdersModel={order,fresh,valid,normalize,read,accept,status,claim,leafletFrame,ease};
})();
