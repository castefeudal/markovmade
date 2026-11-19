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
    progress: 'trend', circumference: 'ruler', phase: 'progression', adherence: 'trend',
    review: 'calendar', friction: 'compass', minimum: 'check', ifthen: 'progression',
    strength: 'strength', progression: 'progression', session: 'strength', load: 'plates',
    volume: 'strength', plates: 'plates', cardio: 'recovery', body: 'body',
    recomposition: 'body', recovery: 'recovery', caffeine: 'caffeine', sleep: 'moon', fatigue: 'bolt'
  };
  const searchBar = document.createElement('div');
  searchBar.className = 'mm-lab-tool-search';
  const searchLabel = document.createElement('label');
  const search = document.createElement('input');
  search.id = 'mm-lab-tool-search';
  search.type = 'search';
  search.className = 'mm-lab-input';
  searchLabel.htmlFor = search.id;
  const results = document.createElement('p');
  results.setAttribute('role', 'status');
  results.className = 'mm-lab-search-status';
  searchBar.append(searchLabel, search, results);
  actions.before(searchBar);
  const tools = window.MarkovMadeToolkit.tools;
  function toolIcon(id) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', '#mm-icon-' + icons[id]);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.append(use);
    return svg;
  }
  for (const heading of root.querySelectorAll('.mm-lab-toolhead h3')) {
    const id = heading.closest('[data-mm-lab-panel]')?.dataset.mmLabPanel;
    if (icons[id]) heading.prepend(toolIcon(id));
  }
  let activeGroup = 'nutrition';
  let activeTool = 'nutrition';
  function render() {
    const language = document.documentElement.lang === 'en' ? 1 : 0;
    searchLabel.textContent = language ? 'Find a calculator' : 'Найти калькулятор';
    search.placeholder = language ? 'Search all 24 instruments' : 'Поиск по 24 инструментам';
    const query = search.value.trim().toLocaleLowerCase();
    const visible = query ? tools.filter(tool => [...(labels[tool.id] || []), ...tool.title, ...tool.subtitle].some(text => text.toLocaleLowerCase().includes(query))) : groups[activeGroup].map(id => tools.find(tool => tool.id === id));
    shortcuts.replaceChildren();
    results.textContent = query ? (language ? 'Tools found: ' : 'Найдено инструментов: ') + visible.length : '';
    for (const tool of visible) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mm-lab-secondary mm-lab-shortcut';
      if (tool.id === activeTool) button.setAttribute('aria-current', 'true');
      const mark = document.createElement('span');
      mark.className = 'mm-lab-shortcut-icon';
      mark.append(toolIcon(tool.id));
      const copy = document.createElement('span');
      const label = document.createElement('strong');
      const description = document.createElement('small');
      label.textContent = (labels[tool.id] || tool.title)[language];
      description.textContent = tool.subtitle[language];
      copy.append(label, description);
      button.append(mark, copy);
      button.addEventListener('click', () => window.MarkovMadeToolkit.open(tool));
      shortcuts.append(button);
    }
    actions.querySelector('[data-open-meal]').hidden = !!query || activeGroup !== 'nutrition';
  }
  search.addEventListener('input', render);
  function syncGroup(tool) {
    const group = Object.keys(groups).find(key => groups[key].includes(tool));
    if (!group) return;
    activeGroup = group;
    activeTool = tool;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.labGroup === group)));
    render();
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    search.value = '';
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
