/* Four task-oriented entries; existing tool IDs and calculator handlers remain canonical. */
(function(){
  'use strict';
  const root=document.getElementById('calculators');if(!root)return;
  const groups={nutrition:['nutrition','protein'],progress:['progress','circumference','phase','adherence','review','friction','minimum','ifthen'],strength:['strength','progression','session','load','volume','plates','cardio'],extra:['body','recomposition','recovery','overfeeding','caffeine','sleep','fatigue']};
  const buttons=[...root.querySelectorAll('[data-lab-group]')],catalog=root.querySelector('.mm-lab-tool-catalog');
  const actions=root.querySelector('.mm-lab-group-actions'),shortcuts=document.createElement('div');shortcuts.className='mm-lab-group-shortcuts';actions.prepend(shortcuts);
  const labels={session:['Журнал тренировки','Workout log'],load:['Рабочие веса','Working loads'],volume:['Объём тренировки','Training volume'],nutrition:['Калории и БЖУ','Calories and macros'],progress:['Дневник и тренды','Journal and trends'],strength:['Силовой ориентир','Strength estimate'],progression:['Прогрессия нагрузки','Load progression'],plates:['Блины на штанге','Plate configuration'],body:['Замеры и состав тела','Measurements and body composition'],recovery:['Восстановление','Recovery'],overfeeding:['Изменение веса после переедания','Weight after overeating'],caffeine:['Кофеин','Caffeine']};
  const icons = {
    nutrition: 'calories', protein: 'calories', overfeeding: 'balance',
    progress: 'trend', circumference: 'body', phase: 'progression', adherence: 'trend',
    review: 'trend', friction: 'balance', minimum: 'balance', ifthen: 'progression',
    strength: 'strength', progression: 'progression', session: 'strength', load: 'plates',
    volume: 'strength', plates: 'plates', cardio: 'recovery', body: 'body',
    recomposition: 'body', recovery: 'recovery', caffeine: 'caffeine', sleep: 'recovery', fatigue: 'recovery'
  };
  let activeGroup = 'nutrition';
  let activeTool = 'nutrition';
  function render() {
    shortcuts.replaceChildren();
    const language = document.documentElement.lang === 'en' ? 1 : 0;
    for (const id of groups[activeGroup]) {
      const tool = window.MarkovMadeToolkit.tools.find(item => item.id === id);
      if (!tool) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mm-lab-secondary mm-lab-shortcut';
      if (id === activeTool) button.setAttribute('aria-current', 'true');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const use = document.createElementNS(svg.namespaceURI, 'use');
      use.setAttribute('href', '#mm-icon-' + icons[id]);
      svg.setAttribute('aria-hidden', 'true');
      svg.append(use);
      const label = document.createElement('span');
      label.textContent = (labels[id] || tool.title)[language];
      button.append(svg, label);
      button.addEventListener('click', () => window.MarkovMadeToolkit.open(tool));
      shortcuts.append(button);
    }
    actions.querySelector('[data-open-meal]').hidden = activeGroup !== 'nutrition';
  }
  function syncGroup(tool) {
    const group = Object.keys(groups).find(key => groups[key].includes(tool));
    if (!group) return;
    activeGroup = group;
    activeTool = tool;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.labGroup === group)));
    render();
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const [firstTool] = groups[button.dataset.labGroup];
    window.MarkovMadeLab.selectTab(firstTool);
    if (catalog) catalog.open = false;
  }));
  root.addEventListener('mm:lab-tab', event => syncGroup(event.detail.key));
  root.addEventListener('mm:toolkit-open', event => syncGroup(event.detail.id));
  new MutationObserver(render).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
  if (/^#(?:mm-)?lab-/.test(location.hash)) {
    syncGroup(root.querySelector('[data-mm-lab-tab][aria-selected="true"]')?.dataset.mmLabTab);
  } else {
    window.MarkovMadeLab.selectTab('nutrition');
  }
})();
