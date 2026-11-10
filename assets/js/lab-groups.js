/* Four task-oriented entries; existing tool IDs and calculator handlers remain canonical. */
(function(){
  'use strict';
  const root=document.getElementById('calculators');if(!root)return;
  const groups={nutrition:['nutrition'],progress:['progress'],strength:['strength','progression','session','load','volume','plates'],extra:['body','recovery','overfeeding','caffeine']};
  const buttons=[...root.querySelectorAll('[data-lab-group]')],catalog=root.querySelector('.mm-lab-tool-catalog');
  const actions=root.querySelector('.mm-lab-group-actions'),shortcuts=document.createElement('div');shortcuts.className='mm-lab-group-shortcuts';actions.prepend(shortcuts);
  const labels={session:['Журнал тренировки','Workout log'],load:['Рабочие веса','Working loads'],volume:['Объём тренировки','Training volume'],nutrition:['Калории и БЖУ','Calories and macros'],progress:['Дневник и тренды','Journal and trends'],strength:['Силовой ориентир','Strength estimate'],progression:['Прогрессия нагрузки','Load progression'],plates:['Блины на штанге','Plate configuration'],body:['Замеры и состав тела','Measurements and body composition'],recovery:['Восстановление','Recovery'],overfeeding:['Изменение веса после переедания','Weight after overeating'],caffeine:['Кофеин','Caffeine']};
  let activeGroup='nutrition';
  function render(){shortcuts.replaceChildren();for(const id of groups[activeGroup]){const button=document.createElement('button');button.type='button';button.className='mm-lab-secondary';button.textContent=labels[id][document.documentElement.lang==='en'?1:0];button.addEventListener('click',()=>{const tab=root.querySelector(`[data-mm-lab-tab="${id}"]`);if(tab)tab.click();else{const tool=window.MarkovMadeToolkit?.tools.find(item=>item.id===id);if(tool)window.MarkovMadeToolkit.open(tool);}});shortcuts.append(button);}actions.querySelector('[data-open-meal]').hidden=activeGroup!=='nutrition';}
  function select(key){
    if(!groups[key])return;
    activeGroup=key;render();
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.labGroup===key)));
    const tab=root.querySelector(`[data-mm-lab-tab="${groups[key][0]}"]`);if(tab)tab.click();
    if(catalog)catalog.open=false;
  }
  buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.labGroup)));
  root.addEventListener('mm:lab-tab',event=>{const group=Object.keys(groups).find(key=>groups[key].includes(event.detail.key));buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.labGroup===group)));if(group){activeGroup=group;render();}});
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  if(!location.hash.startsWith('#lab-'))select('nutrition');
})();
