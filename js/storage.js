const STORAGE_KEYS = {
  sessions: "gymlog_sessions_v1",
  targets: "gymlog_targets_v1",
  theme: "gymlog_theme_v1",
};

const Storage = {
  getSessions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions) || "[]");
    } catch (e) {
      return [];
    }
  },

  saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
  },

  getSession(id) {
    return Storage.getSessions().find((s) => s.id === id) || null;
  },

  addSession(session) {
    const sessions = Storage.getSessions();
    sessions.push(session);
    Storage.saveSessions(sessions);
  },

  updateSession(id, updater) {
    const sessions = Storage.getSessions();
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx === -1) return;
    sessions[idx] = updater(sessions[idx]);
    Storage.saveSessions(sessions);
  },

  deleteSession(id) {
    const sessions = Storage.getSessions().filter((s) => s.id !== id);
    Storage.saveSessions(sessions);
  },

  // Most recent *completed* session that logged this exercise, before the given session id (optional).
  getLastResultForExercise(exerciseName, beforeSessionId) {
    const sessions = Storage.getSessions()
      .filter((s) => s.completedAt && s.id !== beforeSessionId)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    for (const s of sessions) {
      const ex = s.exercises.find((e) => e.name === exerciseName);
      if (ex && ex.sets.some((set) => set.weight !== "" && set.reps !== "")) {
        return { session: s, exercise: ex };
      }
    }
    return null;
  },

  getTargets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.targets) || "{}");
    } catch (e) {
      return {};
    }
  },

  getTarget(exerciseName) {
    return Storage.getTargets()[exerciseName] || "";
  },

  setTarget(exerciseName, target) {
    const targets = Storage.getTargets();
    targets[exerciseName] = target;
    localStorage.setItem(STORAGE_KEYS.targets, JSON.stringify(targets));
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.theme);
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
