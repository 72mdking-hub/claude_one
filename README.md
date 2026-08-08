# Gym Log

A simple, mobile-friendly personal gym training log. Runs entirely client-side —
no build step, no backend. All data is stored in your browser's `localStorage`.

## Running locally

Open `index.html` directly in a browser, or serve the folder so paths resolve cleanly:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000` (on your phone, use your computer's LAN IP).

## What's here

- Four training days: Chest & Triceps, Back & Abs, Legs, Shoulders & Biceps.
  **Chest & Triceps** and **Back & Abs** have exercise lists populated with
  targets and starting weights (edit `js/data.js`, or hand Claude an updated
  list). Legs and Shoulders & Biceps are still scaffolded but empty.
- Per exercise: optional warm-up set, 3 working sets (weight in kg + reps),
  your last logged result shown as reference, and an editable "next target".
- Auto date/time stamp per session, free-text notes, and a completion summary.
- History view per exercise with a line chart of top-set weight over time.
- Full session log, filterable by day.
- Dark mode by default, with a light mode toggle.

## Structure

```
index.html        entry point
css/style.css      styling (mobile-first, dark/light themes)
js/data.js         training day + exercise definitions
js/storage.js      localStorage persistence helpers
js/chart.js        minimal canvas line chart
js/app.js          UI rendering + app logic
```
