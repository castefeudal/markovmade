/* Local user tasks. Suggested actions keep their independent legacy history. */
(function () {
  'use strict';
  const key = 'markovmade-os-tasks-v1';
  const empty = () => ({ schema: 1, tasks: [] });
  const valid = value => value?.schema === 1 && Array.isArray(value.tasks) &&
    value.tasks.length <= 200 && new Set(value.tasks.map(task => task?.id)).size === value.tasks.length &&
    value.tasks.every(task => typeof task?.id === 'string' && /^[a-z0-9-]{1,80}$/.test(task.id) &&
      typeof task.title === 'string' && task.title.trim().length > 0 && task.title.length <= 120 &&
      typeof task.done === 'boolean');

  function read() {
    const raw = localStorage.getItem(key);
    const value = raw === null ? empty() : JSON.parse(raw);
    if (!valid(value)) throw new Error('Invalid task data');
    return value;
  }

  function mount() {
    const root = document.getElementById('mm-os-custom-tasks');
    if (!root || root.querySelector('form')) return;
    const en = () => document.documentElement.lang === 'en';
    const t = (ru, eng) => en() ? eng : ru;
    function node(tag, text = '') {
      const element = document.createElement(tag);
      element.textContent = text;
      return element;
    }
    function button() {
      const element = node('button');
      element.type = 'button';
      element.className = 'mm-lab-secondary';
      return element;
    }
    const heading = document.getElementById('mm-os-tasks-title');
    const form = node('form');
    const label = node('label');
    const input = node('input');
    input.maxLength = 120;
    input.required = true;
    label.htmlFor = input.id = 'mm-os-task-title';
    const save = button();
    save.type = 'submit';
    const cancel = button();
    const status = node('p');
    status.setAttribute('role', 'status');
    const list = node('ul');
    const emptyNote = node('p');
    form.append(label, input, save, cancel);
    root.append(form, status, emptyNote, list);
    let editing = null;

    function copy() {
      heading.textContent = t('Мои задачи', 'My tasks');
      label.textContent = t('Название задачи', 'Task name');
      save.textContent = editing ? t('Сохранить', 'Save changes') : t('Добавить задачу', 'Add task');
      cancel.textContent = t('Отмена', 'Cancel');
      cancel.hidden = !editing;
    }
    function render() {
      copy();
      list.replaceChildren();
      let data;
      try { data = read(); }
      catch {
        emptyNote.textContent = t('Не удалось прочитать задачи.', 'Could not read tasks.');
        return;
      }
      emptyNote.textContent = data.tasks.length ? '' : t('Задач пока нет.', 'No tasks yet.');
      for (const task of data.tasks) {
        const row = node('li');
        const title = node('label');
        const check = node('input');
        check.type = 'checkbox';
        check.checked = task.done;
        title.append(check, node('span', task.title));
        const edit = button();
        edit.textContent = t('Изменить', 'Edit');
        edit.setAttribute('aria-label', edit.textContent + ': ' + task.title);
        const remove = button();
        remove.textContent = t('Удалить', 'Delete');
        remove.setAttribute('aria-label', remove.textContent + ': ' + task.title);
        check.addEventListener('change', () => {
          if (!write(tasks => tasks.map(item => item.id === task.id ? { ...item, done: check.checked } : item))) {
            check.checked = task.done;
            return;
          }
          status.textContent = check.checked ? t('Задача выполнена.', 'Task completed.') : t('Задача снова открыта.', 'Task reopened.');
        });
        edit.addEventListener('click', () => {
          editing = task.id;
          input.value = task.title;
          copy();
          input.focus();
          input.select();
        });
        remove.addEventListener('click', () => {
          if (!confirm(t('Удалить задачу «' + task.title + '»?', 'Delete task “' + task.title + '”?'))) return;
          if (!write(tasks => tasks.filter(item => item.id !== task.id))) return;
          if (editing === task.id) reset();
          render();
          input.focus();
          status.textContent = t('Задача удалена.', 'Task deleted.');
        });
        row.append(title, edit, remove);
        list.append(row);
      }
    }
    function write(update) {
      try {
        const next = { schema: 1, tasks: update(read().tasks) };
        if (!valid(next)) throw new Error('Invalid task change');
        localStorage.setItem(key, JSON.stringify(next));
        return true;
      } catch {
        status.textContent = t('Не удалось сохранить задачи. Максимум — 200 задач.', 'Could not save tasks. The limit is 200 tasks.');
        return false;
      }
    }
    function reset() {
      editing = null;
      form.reset();
      copy();
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const title = input.value.trim();
      if (!title) { input.focus(); return; }
      if (!write(tasks => {
        if (!editing) return [...tasks, { id: crypto.randomUUID(), title, done: false }];
        if (!tasks.some(task => task.id === editing)) throw new Error('Task deleted');
        return tasks.map(task => task.id === editing ? { ...task, title } : task);
      })) return;
      status.textContent = editing ? t('Задача сохранена.', 'Task updated.') : t('Задача добавлена.', 'Task added.');
      reset();
      render();
      input.focus();
    });
    cancel.addEventListener('click', () => { reset(); input.focus(); });
    addEventListener('storage', event => { if (event.key === key || event.key === null) render(); });
    document.addEventListener('mm:lab-cleared', () => { reset(); render(); });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render();
  }

  window.MarkovMadeTasks ||= { key, read, valid, mount };
})();
