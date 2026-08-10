// Old Welsh dual-labeling.
//
// The Gododdin's own language, Cumbric, is barely attested — a handful of
// place-names and personal names, no real corpus of text. Old Welsh is the
// closest well-documented relative: at c. 600 AD the two had not meaningfully
// diverged, and Y Gododdin itself survives to us in Old/Middle Welsh. So
// these terms are Old Welsh used as the best available stand-in, normalized
// toward familiar spellings for readability — not a claim of attested
// Cumbric. A few compounds (marked below) are constructed by analogy with
// standard Welsh word-formation rather than directly attested anywhere.

export const OLD_WELSH = {
  tileLabel: {
    water: 'Llyn',           // lake/loch — cf. Linlithgow's own name
    marsh: 'Cors',           // marsh/bog
    woodland: 'Coed',        // wood/forest — cf. Coed Celyddon, the "Caledonian Forest"
    moor: 'Rhos',            // moor, rough heath
    grass: 'Maes',           // open field, cleared ground
    settlement: 'Din',       // fort/stronghold — cf. Din Eidyn itself
  },
  taskLabel: {
    forage: 'Casglu',        // to gather
    fish: 'Pysgota',         // to fish
    hunt: 'Hela',            // to hunt
    chop_wood: 'Torri Coed', // to cut wood
    rest: 'Gorffwys',        // rest
  },
  resourceLabel: {
    food: 'Bwyd',
    wood: 'Coed',
  },
  seasonLabel: {
    Spring: 'Gwanwyn',
    Summer: 'Haf',
    Autumn: 'Hydref',
    Winter: 'Gaeaf',
  },
  roleLabel: {
    'household head': 'Pen Teulu',  // "head of the household/warband" — an attested early title
    forager: 'Casglwr',             // "gatherer" — constructed agent-noun (casglu + -wr)
    'young warrior': 'Milwr Ifanc', // "young soldier/warrior"
    child: 'Plentyn',
    elder: 'Hynaf',                 // "eldest"
  },
  calendarLabel: {
    day: 'Dydd',
    year: 'Blwyddyn',
  },
};

export function gloss(category, key) {
  const table = OLD_WELSH[category];
  const term = table && table[key];
  return term ? ` (${term})` : '';
}
