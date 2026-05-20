export const TARGETS = {
  calories: 2400,
  protein: 160,
  waterBottles: 3, // 32oz each = ~100oz
  sodiumMg: 2000,
};

export const PROFILE = {
  name: 'Jason',
  startWeight: 221,
  goalWeight: 200,
  height: "6'1\"",
  age: 48,
};

export const QUICK_FOODS = [
  { id: 'oats', name: 'Overnight Oats + Protein', cal: 320, protein: 30, category: 'breakfast' },
  { id: 'chobani', name: 'Chobani Zero Sugar', cal: 120, protein: 20, category: 'snack' },
  { id: 'kirkland', name: 'Kirkland Protein Bar', cal: 190, protein: 21, category: 'snack' },
  { id: 'chicken-tofu', name: 'Chicken & Tofu Bowl', cal: 600, protein: 40, category: 'meal' },
  { id: 'fajitas', name: 'Chicken Fajita Tacos (3)', cal: 750, protein: 48, category: 'meal' },
  { id: 'rotisserie', name: 'Rotisserie Chicken + Rice', cal: 700, protein: 50, category: 'meal' },
  { id: 'eggs', name: 'Hard Boiled Eggs (3)', cal: 210, protein: 18, category: 'breakfast' },
  { id: 'turkey-wrap', name: 'Turkey Deli Wrap', cal: 500, protein: 38, category: 'meal' },
  { id: 'cheese-jerky', name: 'String Cheese + Jerky', cal: 200, protein: 22, category: 'snack' },
  { id: 'cottage', name: 'Cottage Cheese + Berries', cal: 180, protein: 22, category: 'snack' },
  { id: 'salmon', name: 'Salmon + Sweet Potato', cal: 650, protein: 45, category: 'meal' },
];

export const WORKOUT_A = [
  { name: 'Goblet Squat', sets: 3, reps: 12, defaultWeight: 30 },
  { name: 'DB Bench Press', sets: 3, reps: 12, defaultWeight: 30 },
  { name: 'Lat Pulldown', sets: 3, reps: 12, defaultWeight: 85 },
  { name: 'DB Row (each arm)', sets: 3, reps: 12, defaultWeight: 25 },
];

export const WORKOUT_B = [
  { name: 'DB Romanian Deadlift', sets: 3, reps: 12, defaultWeight: 25 },
  { name: 'Overhead Press', sets: 3, reps: 12, defaultWeight: 27.5 },
  { name: 'Lat Pulldown', sets: 3, reps: 12, defaultWeight: 85 },
  { name: 'DB Reverse Lunge (each)', sets: 3, reps: 10, defaultWeight: 20 },
];

// Returns 'A', 'B', or null
export function getTodaysWorkoutType() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const strengthDays = [1, 3, 5]; // Mon, Wed, Fri
  const idx = strengthDays.indexOf(day);
  if (idx === -1) return null;

  // Week number determines A/B/A or B/A/B pattern
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now - startOfYear) / 604800000);
  if (weekNum % 2 === 0) {
    return idx % 2 === 0 ? 'A' : 'B';
  }
  return idx % 2 === 0 ? 'B' : 'A';
}

export function getDaySchedule() {
  const day = new Date().getDay();
  if ([1, 3, 5].includes(day)) return 'strength'; // Mon, Wed, Fri
  if ([2, 4].includes(day)) return 'cardio';       // Tue, Thu
  if (day === 6) return 'longrun';                  // Sat
  return 'rest';                                     // Sun
}

export function isWednesday() {
  return new Date().getDay() === 3;
}

export function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}
