// Placeholder exercise lists. Chest & Triceps is fully populated as a starting point;
// swap these in (or ask Claude to update them) with your real lists and starting weights.
const TRAINING_DAYS = {
  "chest-triceps": {
    label: "Chest & Triceps",
    exercises: [
      { name: "Barbell Bench Press", hasWarmup: true },
      { name: "Incline Dumbbell Press", hasWarmup: true },
      { name: "Cable Fly", hasWarmup: false },
      { name: "Tricep Pushdown", hasWarmup: false },
      { name: "Overhead Tricep Extension", hasWarmup: false },
      { name: "Dips", hasWarmup: false },
    ],
  },
  "back-biceps": {
    label: "Back & Biceps",
    exercises: [],
  },
  legs: {
    label: "Legs",
    exercises: [],
  },
  "shoulders-biceps": {
    label: "Shoulders & Biceps",
    exercises: [],
  },
};

const DAY_ORDER = ["chest-triceps", "back-biceps", "legs", "shoulders-biceps"];
