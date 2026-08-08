// Legs and Shoulders & Biceps are still placeholders — send over those lists
// (with starting weights/targets) to get them populated the same way.
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
  "back-abs": {
    label: "Back & Abs",
    exercises: [
      { name: "Weighted Pull Up", hasWarmup: true, defaultTarget: "Max clean reps @ 14kg assist", startWeight: 14 },
      { name: "Barbell Row", hasWarmup: true, defaultTarget: "10,10,10 @ 57.5kg", startWeight: 57.5, targetReps: 10 },
      { name: "Lat Pulldown", hasWarmup: false, defaultTarget: "12,12,12 @ 80kg", startWeight: 80, targetReps: 12 },
      { name: "Technogym Low Row", hasWarmup: false, defaultTarget: "12,12,12 @ 52.5kg", startWeight: 52.5, targetReps: 12 },
      { name: "Cable Face Pulls", hasWarmup: false, defaultTarget: "15,15,15 @ 25kg", startWeight: 25, targetReps: 15 },
      { name: "Leg Raises", hasWarmup: false, defaultTarget: "15,15,15 (bodyweight)", targetReps: 15 },
      { name: "Bicycle Crunches", hasWarmup: false, defaultTarget: "20,20,20 (bodyweight)", targetReps: 20 },
      { name: "Crunches", hasWarmup: false, defaultTarget: "15,15,15 (bodyweight)", targetReps: 15 },
    ],
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

const DAY_ORDER = ["chest-triceps", "back-abs", "legs", "shoulders-biceps"];
