import { generateMap, drawMap, drawColonistMarkers, taskOptionsForTile, TILE_SIZE, MAP_COLS, MAP_ROWS } from './map.js';
import {
  createStartingColonists, resolveColonistDay, applyFeeding, applyHealthConsequences,
  isHungryGap, seasonIndexForDay, SEASON_NAMES,
} from './colonists.js';
import { render } from './ui.js';

const state = {
  day: 1,
  map: generateMap(42),
  resources: { food: 140, wood: 50 },
  colonists: createStartingColonists(),
  selectedColonistId: null,
  pendingAssign: null,
  hoverTile: null,
  log: [],
  gameOver: false,
  gameOverText: '',
};

const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');

function log(text, type = 'normal') {
  state.log.unshift({ text, type });
  if (state.log.length > 80) state.log.length = 80;
}

log('Cynan\'s household settles the shore of the loch, in the shadow of Din Eidyn.', 'season');

function redrawMap() {
  drawMap(ctx, state.map, state.hoverTile);
  drawColonistMarkers(ctx, state.colonists);
}

function renderAll() {
  render(state, handlers);
  redrawMap();
}

function assignTask(colonistId, taskType, tile) {
  const c = state.colonists.find((x) => x.id === colonistId);
  if (!c || c.dead) return;
  c.task = { type: taskType, tile };
}

const handlers = {
  onSelectColonist(id) {
    state.selectedColonistId = state.selectedColonistId === id ? null : id;
    state.pendingAssign = null;
    renderAll();
  },
  onRest(id) {
    const c = state.colonists.find((x) => x.id === id);
    if (!c || c.dead) return;
    c.task = { type: 'rest', tile: null };
    renderAll();
  },
  onChooseTask(taskType) {
    if (!state.pendingAssign || !state.selectedColonistId) return;
    assignTask(state.selectedColonistId, taskType, { r: state.pendingAssign.r, c: state.pendingAssign.c });
    state.pendingAssign = null;
    renderAll();
  },
  onAdvanceDay() {
    advanceDay();
    renderAll();
  },
};

function handleTileClick(r, c) {
  if (state.gameOver) return;
  if (!state.selectedColonistId) return;
  const colonist = state.colonists.find((x) => x.id === state.selectedColonistId);
  if (!colonist || colonist.dead) return;

  const tile = state.map[r][c];
  const options = taskOptionsForTile(tile);
  if (options.length === 0) return;

  if (options.length === 1) {
    assignTask(state.selectedColonistId, options[0], { r, c });
    state.pendingAssign = null;
  } else {
    state.pendingAssign = { r, c, options };
  }
  renderAll();
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const c = Math.floor(x / TILE_SIZE);
  const r = Math.floor(y / TILE_SIZE);
  if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) handleTileClick(r, c);
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const c = Math.floor(x / TILE_SIZE);
  const r = Math.floor(y / TILE_SIZE);
  if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
    if (!state.hoverTile || state.hoverTile.r !== r || state.hoverTile.c !== c) {
      state.hoverTile = { r, c };
      redrawMap();
    }
  }
});

const SEASON_BEGIN_FLAVOR = [
  'Spring returns to the loch, the ground still cold underfoot.',
  'Summer settles over the water and the high woodland.',
  'Autumn winds strip the woodland; the geese are moving south.',
  'Winter grips the loch. The reeds are rimed with frost.',
];

function advanceDay() {
  if (state.gameOver) return;

  const seasonIndex = seasonIndexForDay(state.day);
  const hungryGapBefore = isHungryGap(state.day);
  let foodGained = 0;
  let woodGained = 0;

  for (const c of state.colonists) {
    const result = resolveColonistDay(c, seasonIndex, hungryGapBefore, Math.random);
    if (!result) continue;
    if (result.resource === 'food') {
      foodGained += result.amount;
      if (result.task === 'hunt' && !result.success) {
        log(`${c.name}'s hunt in the ${hungryGapBefore ? 'lean' : 'wild'} came back empty-handed.`);
      }
    }
    if (result.resource === 'wood') woodGained += result.amount;
    if (result.exhausted && result.task !== 'rest') {
      log(`${c.name} is worn thin and works slower for it.`, 'warn');
    }
  }

  state.resources.food += foodGained;
  state.resources.wood += woodGained;
  if (foodGained > 0 || woodGained > 0) {
    log(`The day's work: ${foodGained} food, ${woodGained} wood brought in.`);
  }

  const feedRatio = applyFeeding(state.colonists, state.resources);
  if (state.colonists.some((c) => !c.dead)) {
    if (feedRatio <= 0) log('There is nothing left in the stores to eat.', 'warn');
    else if (feedRatio < 1) log('There is not enough food to go around tonight.', 'warn');
  }

  const healthMessages = applyHealthConsequences(state.colonists, state.resources, seasonIndex);
  for (const m of healthMessages) log(m.text, m.type);

  for (const c of state.colonists) {
    if (c.dead && c.task) c.task = null;
  }

  state.day += 1;
  const newSeasonIndex = seasonIndexForDay(state.day);
  const hungryGapAfter = isHungryGap(state.day);

  if (newSeasonIndex !== seasonIndex) {
    log(SEASON_BEGIN_FLAVOR[newSeasonIndex], 'season');
  }
  if (hungryGapAfter && !hungryGapBefore) {
    log('The stores are thin and nothing new has grown — the hungry gap has come.', 'season');
  } else if (!hungryGapAfter && hungryGapBefore) {
    log('The land begins to give again. The hungry gap has passed.', 'season');
  }

  if (state.colonists.every((c) => c.dead)) {
    state.gameOver = true;
    state.gameOverText = 'The household is no more. The loch shore falls silent.';
    log(state.gameOverText, 'warn');
  }
}

document.getElementById('advance-day-btn').addEventListener('click', () => handlers.onAdvanceDay());

renderAll();
