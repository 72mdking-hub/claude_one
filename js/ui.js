// Sidebar, topbar, and hint-panel rendering. Map canvas drawing lives in game.js.

import { TASKS, SEASON_NAMES, SEASON_LENGTH, YEAR_LENGTH } from './colonists.js';
import { TILE_TYPES } from './map.js';

function el(id) { return document.getElementById(id); }

export function render(state, handlers) {
  renderCalendar(state);
  renderResources(state);
  renderColonists(state, handlers);
  renderLog(state);
  renderHint(state, handlers);
}

function renderCalendar(state) {
  const dayInYear = ((state.day - 1) % YEAR_LENGTH) + 1;
  const seasonIndex = Math.floor((dayInYear - 1) / SEASON_LENGTH);
  const dayInSeason = ((dayInYear - 1) % SEASON_LENGTH) + 1;
  const year = Math.floor((state.day - 1) / YEAR_LENGTH) + 1;
  el('season-label').textContent = SEASON_NAMES[seasonIndex];
  el('day-label').textContent = `Day ${dayInSeason} of ${SEASON_LENGTH}`;
  el('year-label').textContent = `Year ${year}`;
}

function renderResources(state) {
  const alive = state.colonists.filter((c) => !c.dead).length;
  const list = el('resource-list');
  list.innerHTML = '';
  const rows = [
    { label: 'Food', value: Math.round(state.resources.food), low: state.resources.food < alive * 10 },
    { label: 'Wood', value: Math.round(state.resources.wood), low: state.resources.wood < alive * 2 },
  ];
  for (const row of rows) {
    const li = document.createElement('li');
    if (row.low) li.className = 'low';
    li.innerHTML = `<span>${row.label}</span><span>${row.value}</span>`;
    list.appendChild(li);
  }
}

function renderColonists(state, handlers) {
  const list = el('colonist-list');
  list.innerHTML = '';
  for (const c of state.colonists) {
    const li = document.createElement('li');
    li.className = 'colonist-row' + (c.id === state.selectedColonistId ? ' selected' : '') + (c.dead ? ' dead' : '');

    const taskLabel = c.dead
      ? 'fallen'
      : c.task
        ? `${TASKS[c.task.type].label}${c.task.tile ? ' — ' + TILE_TYPES[state.map[c.task.tile.r][c.task.tile.c].type].label : ''}`
        : 'idle';

    li.innerHTML = `
      <div class="colonist-name"><span>${c.name}</span><span class="colonist-task">${c.role}</span></div>
      <div class="colonist-task">${taskLabel}</div>
      ${bar('hunger', c.hunger)}
      ${bar('health', c.health)}
      ${bar('energy', c.energy)}
    `;

    if (!c.dead) {
      li.addEventListener('click', (e) => {
        if (e.target.closest('.rest-btn')) return;
        handlers.onSelectColonist(c.id);
      });
      const restBtn = document.createElement('button');
      restBtn.className = 'rest-btn';
      restBtn.textContent = 'Rest';
      restBtn.addEventListener('click', () => handlers.onRest(c.id));
      li.appendChild(restBtn);
    }

    list.appendChild(li);
  }
}

function bar(kind, value) {
  return `<div class="bar-row"><span>${kind}</span><div class="bar-track"><div class="bar-fill ${kind}" style="width:${value}%"></div></div></div>`;
}

function renderLog(state) {
  const list = el('event-log');
  list.innerHTML = '';
  for (const entry of state.log.slice(0, 50)) {
    const li = document.createElement('li');
    if (entry.type) li.className = entry.type;
    li.textContent = entry.text;
    list.appendChild(li);
  }
}

function renderHint(state, handlers) {
  const hint = el('map-hint');
  hint.innerHTML = '';

  if (state.gameOver) {
    hint.textContent = state.gameOverText || 'The household is no more.';
    return;
  }

  if (state.pendingAssign) {
    const label = document.createElement('span');
    label.textContent = 'Set them to: ';
    hint.appendChild(label);
    for (const opt of state.pendingAssign.options) {
      const btn = document.createElement('span');
      btn.className = 'task-choice';
      btn.textContent = TASKS[opt].label;
      btn.addEventListener('click', () => handlers.onChooseTask(opt));
      hint.appendChild(btn);
    }
    return;
  }

  if (!state.selectedColonistId) {
    hint.textContent = 'Select a colonist below, then click a tile to assign their task.';
    return;
  }

  const colonist = state.colonists.find((c) => c.id === state.selectedColonistId);
  hint.textContent = colonist
    ? `${colonist.name} is ready — click a tile to put them to work, or press Rest.`
    : '';
}
