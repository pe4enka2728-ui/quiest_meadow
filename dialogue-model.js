/* Shared branching conversation data, reusable without the renderer. */
(()=>{
class Conversation{
 constructor(graph){this.graph=graph;this.id=graph.start||'start';this.selected=0;this.done=false;}
 get node(){return this.graph.nodes[this.id]}
 move(delta){const n=this.node.choices.length;this.selected=(this.selected+delta+n)%n;return this.selected}
 choose(index=this.selected){const choice=this.node.choices[index];if(!choice)return false;if(!choice.next){this.done=true;return true}if(!this.graph.nodes[choice.next])throw Error('Unknown dialogue node');this.id=choice.next;this.selected=0;return true}
}
const intro={start:'start',nodes:{
 start:{speaker:'Мику',face:'worried',text:'Тето, подожди… Ты тоже слышишь этот странный сигнал? Здесь красиво, но мне почему-то не по себе.',choices:[{label:'Слышу. Держись рядом.',next:'signal'},{label:'Сначала осмотримся.',next:'look'},{label:'Ты в порядке?',next:'feeling'}]},
 signal:{speaker:'Мику',face:'worried',text:'Он то исчезает, то возвращается. Давай не будем расходиться. Если что-нибудь заметишь — скажи мне.',choices:[{label:'Хорошо. Я рядом.',next:'together'}]},
 look:{speaker:'Мику',face:'surprised',text:'Да… У прилавка кто-то есть. Может быть, нам подскажут дорогу. Я пойду следом за тобой.',choices:[{label:'Пойдём вместе.',next:'together'}]},
 feeling:{speaker:'Мику',face:'worried',text:'Кажется, да. Просто всё вокруг слишком… правильное. Не уходи далеко, ладно?',choices:[{label:'Не оставлю тебя.',next:'together'}]},
 together:{speaker:'Мику',face:'happy',text:'Спасибо, Тето. Тогда вперёд. Вдвоём мы обязательно найдём выход.',choices:[{label:'Вперёд.'}]}
}};
const miku={nodes:{start:{speaker:'Мику',face:'neutral',text:'Я здесь, Тето. Куда отправимся дальше?',choices:[{label:'Как ты себя чувствуешь?',next:'feeling'},{label:'Держись рядом.',next:'near'},{label:'Пойдём.'}]},feeling:{speaker:'Мику',face:'worried',text:'Пока всё хорошо. Только этот сигнал… Он всё ещё где-то рядом.',choices:[{label:'Я буду внимательнее.',next:'near'}]},near:{speaker:'Мику',face:'happy',text:'Конечно. Я пойду за тобой.',choices:[{label:'Тогда идём.'}]}}};
const hakuPlace={nodes:{start:{speaker:'Хаку',face:'think',text:'Здесь сигнал почти не слышен. Можно отдохнуть и выбрать что-нибудь в дорогу. Я побуду рядом.',choices:[{label:'Давно ты здесь?',next:'long'},{label:'Спасибо, Хаку.'}]},long:{speaker:'Хаку',face:'talk',text:'Достаточно, чтобы научиться ценить тишину. Если станет тревожно, возвращайтесь ко мне.',choices:[{label:'Будем иметь в виду.'}]}}};
const hakuFeeling={nodes:{start:{speaker:'Хаку',face:'think',text:'С тобой и Мику здесь немного спокойнее. Спасибо, что спросила, Тето.',choices:[{label:'Мы ещё заглянем.',next:'happy'},{label:'Береги себя.'}]},happy:{speaker:'Хаку',face:'happy',text:'Буду рада. И берегите друг друга.',choices:[{label:'Обязательно.'}]}}};
globalThis.DialogueModel={Conversation};globalThis.DialogueData={intro,miku,haku:{place:hakuPlace,feeling:hakuFeeling}};
})();
