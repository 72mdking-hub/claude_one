// ---- App state ----
let state = { screen: "home" };
let currentSession = null;
let sessionPersisted = false;

// ---- Helpers ----
function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}
const escapeAttr = escapeHtml;

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const opts =
    d.getFullYear() === now.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
  return d.toLocaleDateString(undefined, opts);
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function createSessionExercises(dayKey) {
  return TRAINING_DAYS[dayKey].exercises.map((ex) => {
    // Only seed sets with the given starting numbers before the exercise has
    // any real history — once it's been logged, leave fields blank for entry.
    const hasHistory = !!Storage.getLastResultForExercise(ex.name);
    const seedWeight = !hasHistory && ex.startWeight != null ? String(ex.startWeight) : "";
    const seedReps = !hasHistory && ex.targetReps != null ? String(ex.targetReps) : "";
    return {
      name: ex.name,
      hasWarmup: ex.hasWarmup,
      target: Storage.getTarget(ex.name) || ex.defaultTarget || "",
      warmup: ex.hasWarmup ? { weight: "", reps: "" } : null,
      sets: [
        { weight: seedWeight, reps: seedReps },
        { weight: seedWeight, reps: seedReps },
        { weight: seedWeight, reps: seedReps },
      ],
    };
  });
}

// ---- Navigation ----
function navigate(newState) {
  state = newState;
  render();
  window.scrollTo(0, 0);
}

function render() {
  const app = document.getElementById("app");
  switch (state.screen) {
    case "home":
      renderHome(app);
      break;
    case "workout":
      renderWorkout(app);
      break;
    case "summary":
      renderSummary(app);
      break;
    case "history":
      renderHistory(app);
      break;
    case "sessions":
      renderSessions(app);
      break;
    case "export":
      renderExport(app);
      break;
    default:
      renderHome(app);
  }
}

// ---- Theme ----
function initTheme() {
  if (Storage.getTheme() === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  }
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  const next = cur === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  Storage.setTheme(next);
  render();
}

// ---- Session lifecycle ----
function startOrResumeWorkout(dayKey) {
  const existing = Storage.getSessions().find((s) => s.day === dayKey && !s.completedAt);
  if (existing) {
    currentSession = existing;
    sessionPersisted = true;
  } else {
    currentSession = {
      id: uid(),
      day: dayKey,
      dayLabel: TRAINING_DAYS[dayKey].label,
      startedAt: new Date().toISOString(),
      completedAt: null,
      notes: "",
      exercises: createSessionExercises(dayKey),
    };
    sessionPersisted = false;
  }
  navigate({ screen: "workout" });
}

function persistCurrentSession() {
  if (!currentSession) return;
  if (!sessionPersisted) {
    Storage.addSession(currentSession);
    sessionPersisted = true;
  } else {
    Storage.updateSession(currentSession.id, () => currentSession);
  }
}

function completeSession() {
  currentSession.completedAt = new Date().toISOString();
  persistCurrentSession();
  navigate({ screen: "summary", sessionId: currentSession.id });
}

// ---- Home screen ----
function renderHome(app) {
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  const allSessions = Storage.getSessions();

  const dayCards = DAY_ORDER.map((key) => {
    const day = TRAINING_DAYS[key];
    const completed = allSessions
      .filter((s) => s.day === key && s.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const inProgress = allSessions.some((s) => s.day === key && !s.completedAt);
    let meta;
    if (inProgress) meta = "In progress…";
    else if (completed.length) meta = `Last: ${formatDate(completed[0].completedAt)}`;
    else if (day.exercises.length) meta = "No sessions yet";
    else meta = "No exercises set";
    return `<button class="day-card" data-day="${key}">
      <div class="day-name">${escapeHtml(day.label)}</div>
      <div class="day-meta">${escapeHtml(meta)}</div>
    </button>`;
  }).join("");

  app.innerHTML = `
    <div class="topbar">
      <div class="topbar-title"><h1>🏋️ Gym Log</h1></div>
      <button class="icon-btn" id="themeToggle">${theme === "light" ? "🌙" : "☀️"}</button>
    </div>
    <h3>Today's Session</h3>
    <div class="grid-days">${dayCards}</div>
    <div class="nav-list">
      <div class="nav-row" id="navHistory"><span>📈 Exercise History</span><span class="chev">›</span></div>
      <div class="nav-row" id="navSessions"><span>🗒️ All Sessions</span><span class="chev">›</span></div>
      <div class="nav-row" id="navExport"><span>📋 Copy / Export Log</span><span class="chev">›</span></div>
    </div>
  `;

  app.querySelector("#themeToggle").addEventListener("click", toggleTheme);
  app.querySelectorAll(".day-card").forEach((btn) =>
    btn.addEventListener("click", () => startOrResumeWorkout(btn.dataset.day))
  );
  app.querySelector("#navHistory").addEventListener("click", () => navigate({ screen: "history" }));
  app.querySelector("#navSessions").addEventListener("click", () =>
    navigate({ screen: "sessions", filter: "all" })
  );
  app.querySelector("#navExport").addEventListener("click", () => navigate({ screen: "export", filter: "all" }));
}

// ---- Workout screen ----
function subTopbarHtml(title, backId) {
  return `<div class="topbar">
    <button class="back-btn" id="${backId}">‹ Back</button>
    <h2 style="margin:0;font-size:16px;">${escapeHtml(title)}</h2>
    <div style="width:44px;"></div>
  </div>`;
}

function stepperHtml(field, exIdx, setKey, value, delta, isInt, unit) {
  return `<div class="stepper">
    <button type="button" data-step="${-delta}">−</button>
    <input type="text" inputmode="${isInt ? "numeric" : "decimal"}" data-field="${field}" data-ex="${exIdx}" data-set="${setKey}" value="${escapeAttr(value)}" placeholder="${unit}" />
    <button type="button" data-step="${delta}">+</button>
  </div>`;
}

function formatLastResult(last) {
  const ex = last.exercise;
  const parts = [];
  if (ex.hasWarmup && ex.warmup && ex.warmup.weight !== "" && ex.warmup.reps !== "") {
    parts.push(`WU ${ex.warmup.weight}×${ex.warmup.reps}`);
  }
  ex.sets.forEach((s, i) => {
    if (s.weight !== "" && s.reps !== "") parts.push(`S${i + 1} ${s.weight}×${s.reps}`);
  });
  const dateStr = formatDate(last.session.completedAt || last.session.startedAt);
  return parts.length ? `${parts.join("  ")}  (${dateStr})` : `No sets recorded (${dateStr})`;
}

function exerciseCardHtml(ex, idx) {
  const last = Storage.getLastResultForExercise(ex.name, currentSession.id);
  const lastText = last ? formatLastResult(last) : "No previous data yet";

  const warmupHtml = ex.hasWarmup
    ? `<div class="set-row warmup">
        <div class="set-label warm">Warm-up</div>
        ${stepperHtml("weight", idx, "warmup", ex.warmup.weight, 2.5, false, "kg")}
        ${stepperHtml("reps", idx, "warmup", ex.warmup.reps, 1, true, "reps")}
      </div>`
    : "";

  const setsHtml = ex.sets
    .map(
      (s, si) => `<div class="set-row">
        <div class="set-label">Set ${si + 1}</div>
        ${stepperHtml("weight", idx, si, s.weight, 2.5, false, "kg")}
        ${stepperHtml("reps", idx, si, s.reps, 1, true, "reps")}
      </div>`
    )
    .join("");

  return `<div class="exercise-card">
    <div class="exercise-header"><div class="exercise-name">${escapeHtml(ex.name)}</div></div>
    <div class="exercise-last">Last: ${escapeHtml(lastText)}</div>
    <div class="target-row">
      <label>Target</label>
      <input type="text" data-field="target" data-ex="${idx}" value="${escapeAttr(ex.target)}" placeholder="e.g. 10,10,8 @ 62.5kg" />
    </div>
    ${warmupHtml}
    ${setsHtml}
  </div>`;
}

function renderWorkout(app) {
  const day = TRAINING_DAYS[currentSession.day];

  if (!day.exercises.length) {
    app.innerHTML = `
      ${subTopbarHtml(day.label, "backBtn")}
      <div class="empty-state">No exercises added yet for ${escapeHtml(day.label)}.<br/><br/>Share your exercise list for this day and it'll be added here.</div>
    `;
    app.querySelector("#backBtn").addEventListener("click", () => navigate({ screen: "home" }));
    return;
  }

  app.innerHTML = `
    ${subTopbarHtml(day.label, "backBtn")}
    <div class="session-meta">
      <div class="datetime">${formatDateTime(currentSession.startedAt)}</div>
      <textarea data-field="notes" placeholder="Session notes (e.g. knee felt fine, straps kept slipping)">${escapeHtml(currentSession.notes)}</textarea>
    </div>
    <div id="exercises">
      ${currentSession.exercises.map((ex, i) => exerciseCardHtml(ex, i)).join("")}
    </div>
    <button class="primary-btn" id="completeBtn">Mark Session Complete</button>
  `;

  app.querySelector("#backBtn").addEventListener("click", () => navigate({ screen: "home" }));

  const exercisesEl = app.querySelector("#exercises");
  exercisesEl.addEventListener("input", handleWorkoutInput);
  exercisesEl.addEventListener("click", handleWorkoutStepClick);

  app.querySelector('textarea[data-field="notes"]').addEventListener("input", (e) => {
    currentSession.notes = e.target.value;
    persistCurrentSession();
  });

  app.querySelector("#completeBtn").addEventListener("click", completeSession);
}

function handleWorkoutInput(e) {
  const t = e.target;
  const field = t.dataset.field;
  if (!field) return;
  const exIdx = parseInt(t.dataset.ex, 10);
  const ex = currentSession.exercises[exIdx];
  if (!ex) return;

  if (field === "target") {
    ex.target = t.value;
    Storage.setTarget(ex.name, t.value);
  } else {
    const setKey = t.dataset.set;
    const setObj = setKey === "warmup" ? ex.warmup : ex.sets[parseInt(setKey, 10)];
    if (setObj) setObj[field] = t.value;
  }
  persistCurrentSession();
}

function handleWorkoutStepClick(e) {
  const btn = e.target.closest("[data-step]");
  if (!btn) return;
  const wrap = btn.closest(".stepper");
  const input = wrap.querySelector("input");
  const delta = parseFloat(btn.dataset.step);
  const isInt = input.inputMode === "numeric";
  let v = parseFloat(input.value);
  if (isNaN(v)) v = 0;
  v = Math.round((v + delta) * 100) / 100;
  if (v < 0) v = 0;
  input.value = isInt ? String(Math.round(v)) : String(v);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// ---- Summary screen ----
function renderSummary(app) {
  const session = Storage.getSession(state.sessionId);
  if (!session) {
    navigate({ screen: "home" });
    return;
  }

  const rows = session.exercises
    .map((ex) => {
      const achieved =
        ex.sets
          .filter((s) => s.weight !== "" && s.reps !== "")
          .map((s) => `${s.weight}×${s.reps}`)
          .join(", ") || "—";
      const warm =
        ex.hasWarmup && ex.warmup && ex.warmup.weight !== "" ? `${ex.warmup.weight}×${ex.warmup.reps}` : "—";
      return `<tr><td>${escapeHtml(ex.name)}</td><td>${escapeHtml(ex.target || "—")}</td><td>${escapeHtml(
        warm
      )}</td><td>${escapeHtml(achieved)}</td></tr>`;
    })
    .join("");

  app.innerHTML = `
    ${subTopbarHtml("Session Summary", "backBtn")}
    <div class="session-meta">
      <div class="datetime">${escapeHtml(session.dayLabel)} · ${formatDateTime(session.completedAt || session.startedAt)}</div>
      ${session.notes ? `<p>${escapeHtml(session.notes)}</p>` : '<p style="color:var(--text-dim)">No notes</p>'}
    </div>
    <table class="summary-table">
      <thead><tr><th>Exercise</th><th>Target</th><th>Warm-up</th><th>Sets (achieved)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <button class="secondary-btn" id="copySessionBtn">Copy This Session</button>
    <button class="secondary-btn" id="homeBtn">Back to Home</button>
  `;

  app.querySelector("#backBtn").addEventListener("click", () => navigate({ screen: "sessions", filter: "all" }));
  app.querySelector("#copySessionBtn").addEventListener("click", () =>
    copyTextToClipboard(buildExportText([session]))
  );
  app.querySelector("#homeBtn").addEventListener("click", () => navigate({ screen: "home" }));
}

// ---- History screen ----
function renderHistory(app) {
  const allExerciseNames = [];
  DAY_ORDER.forEach((key) =>
    TRAINING_DAYS[key].exercises.forEach((ex) => {
      if (!allExerciseNames.includes(ex.name)) allExerciseNames.push(ex.name);
    })
  );
  Storage.getSessions().forEach((s) =>
    s.exercises.forEach((ex) => {
      if (!allExerciseNames.includes(ex.name)) allExerciseNames.push(ex.name);
    })
  );

  const selected = state.exercise || allExerciseNames[0] || null;
  const options = allExerciseNames
    .map((n) => `<option value="${escapeAttr(n)}" ${n === selected ? "selected" : ""}>${escapeHtml(n)}</option>`)
    .join("");

  app.innerHTML = `
    ${subTopbarHtml("Exercise History", "backBtn")}
    ${allExerciseNames.length ? `<select id="exSelect">${options}</select>` : '<div class="empty-state">No exercises yet.</div>'}
    <div class="chart-wrap"><canvas id="histChart"></canvas></div>
    <div id="histTable"></div>
  `;

  app.querySelector("#backBtn").addEventListener("click", () => navigate({ screen: "home" }));

  if (!selected) return;

  const sel = app.querySelector("#exSelect");
  if (sel) sel.addEventListener("change", () => navigate({ screen: "history", exercise: sel.value }));

  renderHistoryDetail(selected);
}

function renderHistoryDetail(exerciseName) {
  const sessions = Storage.getSessions()
    .filter((s) => s.completedAt)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  const records = [];
  sessions.forEach((s) => {
    const ex = s.exercises.find((e) => e.name === exerciseName);
    if (!ex) return;
    const weights = ex.sets
      .filter((x) => x.weight !== "")
      .map((x) => parseFloat(x.weight))
      .filter((n) => !isNaN(n));
    if (weights.length === 0) return;
    records.push({ date: s.completedAt, top: Math.max(...weights), ex });
  });

  const canvas = document.getElementById("histChart");
  drawLineChart(canvas, records.map((r) => ({ value: r.top, label: formatDate(r.date) })));

  const tableRows = records
    .slice()
    .reverse()
    .map((r) => {
      const sets = r.ex.sets.map((s) => (s.weight !== "" ? `${s.weight}×${s.reps}` : "—")).join(" / ");
      const warm =
        r.ex.hasWarmup && r.ex.warmup && r.ex.warmup.weight !== "" ? `${r.ex.warmup.weight}×${r.ex.warmup.reps}` : "—";
      return `<tr><td>${formatDate(r.date)}</td><td>${escapeHtml(warm)}</td><td>${escapeHtml(sets)}</td></tr>`;
    })
    .join("");

  document.getElementById("histTable").innerHTML = records.length
    ? `<table class="summary-table">
        <thead><tr><th>Date</th><th>Warm-up</th><th>Sets</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`
    : '<div class="empty-state">No completed sessions for this exercise yet.</div>';
}

// ---- Sessions list screen ----
function renderSessions(app) {
  const filter = state.filter || "all";
  const sessions = Storage.getSessions()
    .filter((s) => filter === "all" || s.day === filter)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  const chips = [{ key: "all", label: "All" }, ...DAY_ORDER.map((k) => ({ key: k, label: TRAINING_DAYS[k].label }))]
    .map((c) => `<div class="chip ${c.key === filter ? "active" : ""}" data-filter="${c.key}">${escapeHtml(c.label)}</div>`)
    .join("");

  const items = sessions
    .map((s) => {
      const notesPreview = s.notes ? escapeHtml(s.notes.slice(0, 60)) : "";
      return `<div class="session-item" data-id="${s.id}">
        <div class="row1"><span>${escapeHtml(s.dayLabel)}</span><span class="badge ${s.completedAt ? "done" : ""}">${
        s.completedAt ? "Complete" : "In progress"
      }</span></div>
        <div class="row2">${formatDateTime(s.startedAt)}${notesPreview ? " · " + notesPreview : ""}</div>
      </div>`;
    })
    .join("");

  app.innerHTML = `
    ${subTopbarHtml("All Sessions", "backBtn")}
    <div class="filter-row">${chips}</div>
    ${items || '<div class="empty-state">No sessions logged yet.</div>'}
  `;

  app.querySelector("#backBtn").addEventListener("click", () => navigate({ screen: "home" }));
  app.querySelectorAll(".chip").forEach((c) =>
    c.addEventListener("click", () => navigate({ screen: "sessions", filter: c.dataset.filter }))
  );
  app.querySelectorAll(".session-item").forEach((item) =>
    item.addEventListener("click", () => {
      const session = Storage.getSession(item.dataset.id);
      if (!session) return;
      if (session.completedAt) {
        navigate({ screen: "summary", sessionId: session.id });
      } else {
        currentSession = session;
        sessionPersisted = true;
        navigate({ screen: "workout" });
      }
    })
  );
}

// ---- Export ----
function formatSessionForExport(s) {
  const lines = [`== ${s.dayLabel} — ${formatDateTime(s.completedAt || s.startedAt)} ==`];
  if (s.notes) lines.push(`Notes: ${s.notes}`);

  s.exercises.forEach((ex) => {
    const hasData = (ex.warmup && (ex.warmup.weight !== "" || ex.warmup.reps !== "")) ||
      ex.sets.some((st) => st.weight !== "" || st.reps !== "");
    if (!hasData) return;

    lines.push(`${ex.name} — target: ${ex.target || "—"}`);
    if (ex.hasWarmup && ex.warmup && (ex.warmup.weight !== "" || ex.warmup.reps !== "")) {
      const w = ex.warmup.weight !== "" ? `${ex.warmup.weight}kg` : "bodyweight";
      lines.push(`  Warm-up: ${w} x ${ex.warmup.reps || "?"}`);
    }
    ex.sets.forEach((st, i) => {
      if (st.weight === "" && st.reps === "") return;
      const w = st.weight !== "" ? `${st.weight}kg` : "bodyweight";
      lines.push(`  Set ${i + 1}: ${w} x ${st.reps || "?"}`);
    });
  });

  return lines.join("\n");
}

function buildExportText(sessions) {
  if (!sessions.length) return "No completed sessions to export yet.";
  const header = `Gym Log Export — ${sessions.length} session${sessions.length === 1 ? "" : "s"}, generated ${formatDateTime(new Date().toISOString())}`;
  return `${header}\n\n${sessions.map(formatSessionForExport).join("\n\n")}`;
}

function showToast(msg) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

async function copyTextToClipboard(text, sourceTextareaEl) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
    return;
  } catch (e) {
    // Clipboard API needs a secure context; fall back to manual selection copy.
  }
  if (sourceTextareaEl) {
    sourceTextareaEl.focus();
    sourceTextareaEl.select();
    try {
      document.execCommand("copy");
      showToast("Copied to clipboard");
      return;
    } catch (e) {
      // fall through
    }
  }
  showToast("Couldn't auto-copy — select the text and copy manually");
}

function renderExport(app) {
  const filter = state.filter || "all";
  const sessions = Storage.getSessions()
    .filter((s) => s.completedAt)
    .filter((s) => filter === "all" || s.day === filter)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  const chips = [{ key: "all", label: "All" }, ...DAY_ORDER.map((k) => ({ key: k, label: TRAINING_DAYS[k].label }))]
    .map((c) => `<div class="chip ${c.key === filter ? "active" : ""}" data-filter="${c.key}">${escapeHtml(c.label)}</div>`)
    .join("");

  const text = buildExportText(sessions);

  app.innerHTML = `
    ${subTopbarHtml("Copy / Export Log", "backBtn")}
    <div class="filter-row">${chips}</div>
    <p style="color:var(--text-dim);font-size:12.5px;">${sessions.length} completed session${sessions.length === 1 ? "" : "s"} · copy this and paste it into your programme chat.</p>
    <textarea id="exportText" readonly style="min-height:320px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:1.5;">${escapeHtml(text)}</textarea>
    <button class="primary-btn" id="copyBtn">Copy to Clipboard</button>
  `;

  app.querySelector("#backBtn").addEventListener("click", () => navigate({ screen: "home" }));
  app.querySelectorAll(".chip").forEach((c) =>
    c.addEventListener("click", () => navigate({ screen: "export", filter: c.dataset.filter }))
  );
  const exportTextEl = app.querySelector("#exportText");
  exportTextEl.addEventListener("focus", () => exportTextEl.select());
  app.querySelector("#copyBtn").addEventListener("click", () => copyTextToClipboard(text, exportTextEl));
}

// ---- Init ----
initTheme();
render();
