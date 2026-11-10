/* Explicit game commands only. Session flags never enter a checkpoint. */
(()=>{
'use strict';
let god=false;
globalThis.DeveloperState={get god(){return god},setGod(value){god=!!value;return god},reset(){god=false}};
const definitions=[
 {name:'give_money',usage:'give_money <число>',description:'Добавить монеты. Баланс не выше 100000.'},
 {name:'god',usage:'god [on|off]',description:'Переключить бессмертие; повторный god выключает его.'},
 {name:'help',usage:'help [команда]',description:'Показать команды или справку по одной из них.'},
 {name:'heal',usage:'heal [число]',description:'Восстановить HP в текущем бою; без числа — полностью.'},
 {name:'refill_mp',usage:'refill_mp [число]',description:'Восстановить MP в текущем бою; без числа — полностью.'},
 {name:'give_key',usage:'give_key',description:'Выдать золотой ключ в сумку, без дубликатов.'},
 {name:'tp',usage:'tp <1|2|4|5|5.1|5.2|5.3|5.4>',description:'1 — после цветка, 2 — перед Гуми, 4 — после Гуми, 5 — три сердца. 5.1 — Пульс, 5.2 — память, 5.3 — украденный голос, 5.4 — перед боем с Мику.'},
 {name:'where',usage:'where',description:'Показать локацию, координаты, монеты и состояние боя.'},
 {name:'clear',usage:'clear',description:'Очистить вывод консоли.'}
];
function number(raw,max){if(typeof raw!=='string'||!/^\d+$/.test(raw))throw Error('Нужно целое положительное число.');const n=Number(raw);if(!Number.isSafeInteger(n)||n<1||n>max)throw Error('Допустимое число: от 1 до '+max+'.');return n;}
function arity(args,min,max=min){if(args.length<min||args.length>max)throw Error('Неверное число аргументов.');}
function complete(prefix){const text=String(prefix).toLowerCase();return definitions.map(d=>d.name).filter(name=>name.startsWith(text));}
function execute(raw,api={}){
 const line=String(raw??'').trim();if(!line)return {ok:true,noop:true,lines:[]};if(line.length>256)return {ok:false,lines:['Команда слишком длинная.']};
 const [command,...args]=line.split(/\s+/u),name=command.toLowerCase(),def=definitions.find(d=>d.name===name);
 if(!def)return {ok:false,lines:['Неизвестная команда: '+command+'. Введи help.']};
 try{
  let message;
  if(name==='help'){arity(args,0,1);const requested=args[0]?.toLowerCase(),list=requested?definitions.filter(d=>d.name===requested):definitions;if(!list.length)throw Error('Такой команды нет.');return {ok:true,lines:list.map(d=>d.usage+' — '+d.description)};}
  if(name==='give_money'){arity(args,1);const amount=number(args[0],100000),result=api.addMoney(amount);message='Выдано '+amount+' монет. Баланс: '+result.gold+'.';}
  else if(name==='god'){arity(args,0,1);const option=args[0]?.toLowerCase();if(option&&!['on','off'].includes(option))throw Error('После god можно указать только on или off.');DeveloperState.setGod(option?option==='on':!DeveloperState.god);message='GOD '+(DeveloperState.god?'ВКЛЮЧЁН. Тето не получает урон и защищена от падений.':'ВЫКЛЮЧЕН. Обычные правила урона восстановлены.');}
  else if(name==='heal'||name==='refill_mp'){arity(args,0,1);const max=name==='heal'?100:30,amount=args.length?number(args[0],max):null,result=api.restoreStat(name==='heal'?'hp':'mp',amount);message=(name==='heal'?'HP':'MP')+': '+result.value+' / '+max+'.';}
  else if(name==='give_key'){arity(args,0);message=api.giveKey()?'Золотой ключ добавлен в сумку.':'Золотой ключ уже в сумке.';}
  else if(name==='tp'){arity(args,1);if(!/^(1|2|4|5(?:\.[1-4])?)$/.test(args[0]))throw Error('Доступны точки 1, 2, 4, 5 и подглавы 5.1–5.4.');const slot=args[0].includes('.')?args[0]:Number(args[0]);if(api.teleport(slot)===false)throw Error('Переход сейчас недоступен.');message='Открыта контрольная точка '+slot+'. Создана отдельная копия.';}
  else if(name==='where'){arity(args,0);message=api.describe();}
  else if(name==='clear'){arity(args,0);return {ok:true,clear:true,lines:[]};}
  return {ok:true,lines:[message]};
 }catch(error){return {ok:false,lines:[(error.message||'Не удалось выполнить команду.')+' Синтаксис: '+def.usage]};}
}
globalThis.DeveloperCommands={definitions,execute,complete};
})();
