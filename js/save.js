// Local persistence via localStorage. No backend — progress lives in this
// browser only. The tile map is deliberately not saved: it's regenerated
// from the same fixed seed, so it's identical without spending storage on it.

const SAVE_KEY = 'din-eidyns-shore-save-v1';

const SAVED_FIELDS = ['day', 'resources', 'colonists', 'selectedColonistId', 'pendingAssign', 'log', 'gameOver', 'gameOverText'];

export function saveState(state) {
  try {
    const record = {};
    for (const key of SAVED_FIELDS) record[key] = state[key];
    localStorage.setItem(SAVE_KEY, JSON.stringify(record));
  } catch (e) {
    // Storage can be unavailable (private browsing, quota) — saving is
    // best-effort, not required for the game to keep running.
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    // ignore
  }
}
