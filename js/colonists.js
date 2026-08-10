// Colonist model, tasks, and daily resolution for Chapter 1.

export const SEASON_NAMES = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const SEASON_LENGTH = 20;
export const YEAR_LENGTH = SEASON_LENGTH * 4;

export const TASKS = {
  forage:    { label: 'Forage',    resource: 'food', baseYield: 8,  energyCost: 15 },
  fish:      { label: 'Fish',      resource: 'food', baseYield: 10, energyCost: 15 },
  hunt:      { label: 'Hunt',      resource: 'food', baseYield: 18, energyCost: 20 },
  chop_wood: { label: 'Chop Wood', resource: 'wood', baseYield: 6,  energyCost: 18 },
  rest:      { label: 'Rest',      resource: null,   energyCost: -25 },
};

// Indexed by season: Spring, Summer, Autumn, Winter.
const SEASON_MOD = {
  forage:      [0.8, 1.3, 1.4, 0.4],
  fish:        [1.0, 1.1, 1.0, 0.5],
  huntSuccess: [0.7, 0.85, 0.9, 0.55],
  wood:        [1.0, 1.0, 1.0, 0.8],
};

const FOOD_PER_COLONIST = 10;
const WOOD_PER_COLONIST_WINTER = 2;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function isHungryGap(totalDay) {
  const dayInYear = ((totalDay - 1) % YEAR_LENGTH) + 1;
  return dayInYear >= (YEAR_LENGTH - 6) || dayInYear <= 7;
}

export function seasonIndexForDay(totalDay) {
  return Math.floor(((totalDay - 1) % YEAR_LENGTH) / SEASON_LENGTH);
}

export function createStartingColonists() {
  return [
    { id: 'cynan',    name: 'Cynan',    role: 'household head', hunger: 15, health: 100, energy: 85, task: null, dead: false },
    { id: 'nesta',    name: 'Nesta',    role: 'forager',        hunger: 15, health: 100, energy: 85, task: null, dead: false },
    { id: 'tudfwlch', name: 'Tudfwlch', role: 'young warrior',  hunger: 15, health: 100, energy: 90, task: null, dead: false },
    { id: 'eurwen',   name: 'Eurwen',   role: 'child',          hunger: 15, health: 100, energy: 80, task: null, dead: false },
    { id: 'madog',    name: 'Madog',    role: 'elder',          hunger: 15, health: 95,  energy: 70, task: null, dead: false },
  ];
}

// Resolves one colonist's work for the day. Mutates hunger/energy. Returns a
// result describing what was produced, for the caller to log and total up.
export function resolveColonistDay(colonist, seasonIndex, hungryGap, rand) {
  if (colonist.dead) return null;
  const taskType = colonist.task ? colonist.task.type : 'rest';
  const def = TASKS[taskType];
  const exhausted = colonist.energy <= 10;

  let amount = 0;
  let resource = null;
  let success = true;

  if (taskType === 'rest') {
    colonist.energy = clamp(colonist.energy + 25, 0, 100);
  } else {
    resource = def.resource;
    let mod = 1;
    if (taskType === 'forage') mod = SEASON_MOD.forage[seasonIndex];
    if (taskType === 'fish') mod = SEASON_MOD.fish[seasonIndex];
    if (taskType === 'chop_wood') mod = SEASON_MOD.wood[seasonIndex];
    if (hungryGap && taskType !== 'chop_wood') mod *= 0.5;

    if (taskType === 'hunt') {
      const chance = SEASON_MOD.huntSuccess[seasonIndex] * (hungryGap ? 0.7 : 1);
      success = rand() < chance;
      amount = success ? def.baseYield * mod * (0.85 + rand() * 0.3) : 0;
    } else {
      amount = def.baseYield * mod * (0.85 + rand() * 0.3);
    }

    if (exhausted) amount *= 0.5;
    amount = Math.round(amount);
    colonist.energy = clamp(colonist.energy - def.energyCost, 0, 100);
  }

  colonist.hunger = clamp(colonist.hunger + (taskType === 'rest' ? 8 : 12), 0, 100);

  return { colonist, task: taskType, resource, amount, success, exhausted };
}

// Feeds everyone from the shared food stock, proportionally if short.
export function applyFeeding(colonists, resources) {
  const alive = colonists.filter((c) => !c.dead);
  const needed = alive.length * FOOD_PER_COLONIST;
  const ratio = needed === 0 ? 1 : Math.min(1, resources.food / needed);
  resources.food = Math.max(0, resources.food - Math.min(resources.food, needed));
  for (const c of alive) c.hunger = clamp(c.hunger - 40 * ratio, 0, 100);
  return ratio;
}

// Applies starvation and cold-exposure consequences, returns log messages.
export function applyHealthConsequences(colonists, resources, seasonIndex) {
  const alive = colonists.filter((c) => !c.dead);
  const messages = [];
  const isWinter = seasonIndex === 3;
  let coldExposure = false;

  if (isWinter) {
    const woodNeeded = alive.length * WOOD_PER_COLONIST_WINTER;
    if (resources.wood >= woodNeeded) {
      resources.wood -= woodNeeded;
    } else {
      resources.wood = 0;
      coldExposure = true;
    }
  }

  for (const c of alive) {
    if (c.hunger >= 100) {
      c.health = clamp(c.health - 15, 0, 100);
      messages.push({ type: 'warn', text: `${c.name} is starving.` });
    } else if (c.hunger >= 80) {
      messages.push({ type: 'warn', text: `${c.name} grows gaunt with hunger.` });
    }
    if (coldExposure) c.health = clamp(c.health - 8, 0, 100);
    if (c.health <= 0 && !c.dead) {
      c.dead = true;
      messages.push({ type: 'warn', text: `${c.name} has died.` });
    }
  }

  if (coldExposure) {
    messages.push({ type: 'warn', text: 'There is not enough firewood — the household shivers through the cold.' });
  }

  return messages;
}
