// Tile map for the Din Eidyn's Shore loch-side settlement (Chapter 1, c. 600 AD).

export const TILE_SIZE = 32;
export const MAP_COLS = 24;
export const MAP_ROWS = 16;

export const TILE_TYPES = {
  water:      { label: 'Loch',        color: '#2b3f4a', tasks: ['fish'] },
  marsh:      { label: 'Reed Marsh',  color: '#3d4a34', tasks: ['fish', 'forage'] },
  woodland:   { label: 'Woodland',    color: '#2f3a26', tasks: ['forage', 'hunt', 'chop_wood'] },
  moor:       { label: 'Moor',        color: '#4a4530', tasks: ['forage', 'hunt'] },
  grass:      { label: 'Cleared Ground', color: '#565229', tasks: ['forage'] },
  settlement: { label: 'Settlement',  color: '#5c4a32', tasks: [] },
};

// Simple seeded RNG so the map is stable across reloads during development.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function taskOptionsForTile(tile) {
  return TILE_TYPES[tile.type].tasks;
}

export function generateMap(seed = 1) {
  const rand = mulberry32(seed);
  const grid = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const row = [];
    for (let c = 0; c < MAP_COLS; c++) {
      row.push({ type: 'moor', shade: rand() * 0.12 - 0.06 });
    }
    grid.push(row);
  }

  // Loch: an irregular blob around a fixed center.
  const lochCol = 8, lochRow = 8;
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const dx = c - lochCol, dy = (r - lochRow) * 1.3;
      const dist = Math.sqrt(dx * dx + dy * dy) + (rand() - 0.5) * 1.6;
      if (dist < 4.2) grid[r][c].type = 'water';
      else if (dist < 5.6) grid[r][c].type = 'marsh';
    }
  }

  // Settlement mound: fixed cluster on the eastern shore.
  const settlementTiles = [[9, 14], [9, 15], [8, 15], [10, 14]];
  for (const [r, c] of settlementTiles) {
    if (grid[r] && grid[r][c]) grid[r][c].type = 'settlement';
  }

  // Woodland clusters scattered across remaining moor.
  const clusterSeeds = 9;
  for (let i = 0; i < clusterSeeds; i++) {
    let c = Math.floor(rand() * MAP_COLS);
    let r = Math.floor(rand() * MAP_ROWS);
    const clusterSize = 8 + Math.floor(rand() * 14);
    for (let step = 0; step < clusterSize; step++) {
      if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
        const t = grid[r][c].type;
        if (t === 'moor') grid[r][c].type = 'woodland';
      }
      const dir = Math.floor(rand() * 4);
      if (dir === 0) c++; else if (dir === 1) c--; else if (dir === 2) r++; else r--;
    }
  }

  // A strip of cleared ground near the settlement (future farmland).
  for (let r = 7; r <= 11; r++) {
    for (let c = 17; c <= 21; c++) {
      if (grid[r] && grid[r][c] && grid[r][c].type === 'moor' && rand() > 0.35) {
        grid[r][c].type = 'grass';
      }
    }
  }

  return grid;
}

export function drawMap(ctx, mapData, hoverTile) {
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const tile = mapData[r][c];
      const base = TILE_TYPES[tile.type].color;
      ctx.fillStyle = shadeColor(base, tile.shade);
      ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
  // subtle grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= MAP_COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * TILE_SIZE, 0);
    ctx.lineTo(c * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    ctx.stroke();
  }
  for (let r = 0; r <= MAP_ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * TILE_SIZE);
    ctx.lineTo(MAP_COLS * TILE_SIZE, r * TILE_SIZE);
    ctx.stroke();
  }

  if (hoverTile) {
    ctx.strokeStyle = '#c99a52';
    ctx.lineWidth = 2;
    ctx.strokeRect(hoverTile.c * TILE_SIZE + 1, hoverTile.r * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  }
}

export function drawColonistMarkers(ctx, colonists) {
  ctx.font = 'bold 11px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const col of colonists) {
    if (col.dead || !col.task || !col.task.tile) continue;
    const { c, r } = col.task.tile;
    const x = c * TILE_SIZE + TILE_SIZE / 2;
    const y = r * TILE_SIZE + TILE_SIZE / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8dcc0';
    ctx.fillText(col.name[0], x, y + 1);
  }
}

function shadeColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + Math.round(255 * amount);
  let g = ((num >> 8) & 0xff) + Math.round(255 * amount);
  let b = (num & 0xff) + Math.round(255 * amount);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}
