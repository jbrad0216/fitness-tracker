// Exercise library: form descriptions, YouTube tutorials, muscle groups, SVG illustrations

export const MUSCLE_COLORS = {
  legs: '#22c55e',
  quads: '#22c55e',
  hamstrings: '#16a34a',
  glutes: '#15803d',
  chest: '#3b82f6',
  back: '#8b5cf6',
  shoulders: '#f59e0b',
  core: '#ef4444',
  arms: '#ec4899',
};

// Simple SVG stick figure illustrations for each exercise
const SVG_SQUAT = `<svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="30" cy="8" r="6" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="30" y1="14" x2="30" y2="35" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="30" y1="20" x2="18" y2="30" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="30" y1="20" x2="42" y2="30" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="30" y1="35" x2="18" y2="55" stroke="#3b82f6" strokeWidth="2.5"/>
  <line x1="30" y1="35" x2="42" y2="55" stroke="#3b82f6" strokeWidth="2.5"/>
  <line x1="18" y1="55" x2="14" y2="70" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="42" y1="55" x2="46" y2="70" stroke="#3b82f6" strokeWidth="2"/>
  <text x="3" y="78" fill="#22c55e" fontSize="8">↓ squat</text>
</svg>`;

const SVG_BENCH = `<svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="35" width="70" height="8" rx="2" stroke="#3b82f6" strokeWidth="2"/>
  <circle cx="20" cy="18" r="6" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="20" y1="24" x2="20" y2="35" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="20" y1="28" x2="8" y2="22" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="20" y1="28" x2="32" y2="22" stroke="#3b82f6" strokeWidth="2"/>
  <line x1="8" y1="22" x2="2" y2="22" stroke="#22c55e" strokeWidth="3"/>
  <line x1="32" y1="22" x2="38" y2="22" stroke="#22c55e" strokeWidth="3"/>
  <circle cx="2" cy="22" r="3" stroke="#22c55e" strokeWidth="2"/>
  <circle cx="38" cy="22" r="3" stroke="#22c55e" strokeWidth="2"/>
  <text x="40" y="55" fill="#3b82f6" fontSize="8">→ press up</text>
</svg>`;

const SVG_PULLDOWN = `<svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="5" y1="5" x2="55" y2="5" stroke="#8b5cf6" strokeWidth="2"/>
  <circle cx="30" cy="18" r="6" stroke="#8b5cf6" strokeWidth="2"/>
  <line x1="30" y1="24" x2="30" y2="45" stroke="#8b5cf6" strokeWidth="2"/>
  <line x1="30" y1="28" x2="12" y2="10" stroke="#8b5cf6" strokeWidth="2"/>
  <line x1="30" y1="28" x2="48" y2="10" stroke="#8b5cf6" strokeWidth="2"/>
  <line x1="30" y1="45" x2="20" y2="70" stroke="#8b5cf6" strokeWidth="2.5"/>
  <line x1="30" y1="45" x2="40" y2="70" stroke="#8b5cf6" strokeWidth="2.5"/>
  <text x="2" y="78" fill="#8b5cf6" fontSize="8">↓ pull down</text>
</svg>`;

const SVG_ROW = `<svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="5" y1="50" width="70" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3,3"/>
  <circle cx="15" cy="20" r="6" stroke="#8b5cf6" strokeWidth="2" transform="rotate(90 15 20)"/>
  <line x1="15" y1="26" x2="15" y2="45" stroke="#8b5cf6" strokeWidth="2"/>
  <line x1="15" y1="32" x2="35" y2="26" stroke="#8b5cf6" strokeWidth="2"/>
  <line x1="15" y1="35" x2="35" y2="35" stroke="#8b5cf6" strokeWidth="2"/>
  <circle cx="38" cy="30" r="5" stroke="#22c55e" strokeWidth="2"/>
  <line x1="38" y1="30" x2="55" y2="30" stroke="#22c55e" strokeWidth="2.5"/>
  <text x="40" y="55" fill="#8b5cf6" fontSize="8">→ row</text>
</svg>`;

const SVG_RDL = `<svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="30" cy="8" r="6" stroke="#22c55e" strokeWidth="2"/>
  <line x1="30" y1="14" x2="30" y2="38" stroke="#22c55e" strokeWidth="2" transform="rotate(30 30 26)"/>
  <line x1="30" y1="20" x2="18" y2="28" stroke="#22c55e" strokeWidth="2"/>
  <line x1="30" y1="20" x2="42" y2="28" stroke="#22c55e" strokeWidth="2"/>
  <line x1="26" y1="42" x2="22" y2="68" stroke="#22c55e" strokeWidth="2.5"/>
  <line x1="34" y1="42" x2="38" y2="68" stroke="#22c55e" strokeWidth="2.5"/>
  <circle cx="18" cy="50" r="4" stroke="#22c55e" strokeWidth="1.5"/>
  <circle cx="42" cy="50" r="4" stroke="#22c55e" strokeWidth="1.5"/>
  <text x="2" y="78" fill="#22c55e" fontSize="8">↓ hinge</text>
</svg>`;

const SVG_OHP = `<svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="30" cy="22" r="6" stroke="#f59e0b" strokeWidth="2"/>
  <line x1="30" y1="28" x2="30" y2="50" stroke="#f59e0b" strokeWidth="2"/>
  <line x1="30" y1="32" x2="12" y2="14" stroke="#f59e0b" strokeWidth="2"/>
  <line x1="30" y1="32" x2="48" y2="14" stroke="#f59e0b" strokeWidth="2"/>
  <line x1="12" y1="14" x2="4" y2="14" stroke="#22c55e" strokeWidth="2.5"/>
  <line x1="48" y1="14" x2="56" y2="14" stroke="#22c55e" strokeWidth="2.5"/>
  <line x1="30" y1="50" x2="22" y2="72" stroke="#f59e0b" strokeWidth="2.5"/>
  <line x1="30" y1="50" x2="38" y2="72" stroke="#f59e0b" strokeWidth="2.5"/>
  <text x="2" y="80" fill="#f59e0b" fontSize="8">↑ press up</text>
</svg>`;

const SVG_LUNGE = `<svg viewBox="0 0 70 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="30" cy="8" r="6" stroke="#22c55e" strokeWidth="2"/>
  <line x1="30" y1="14" x2="30" y2="35" stroke="#22c55e" strokeWidth="2"/>
  <line x1="30" y1="20" x2="18" y2="30" stroke="#22c55e" strokeWidth="2"/>
  <line x1="30" y1="20" x2="42" y2="30" stroke="#22c55e" strokeWidth="2"/>
  <line x1="30" y1="35" x2="20" y2="58" stroke="#22c55e" strokeWidth="2.5"/>
  <line x1="30" y1="35" x2="50" y2="58" stroke="#22c55e" strokeWidth="2.5"/>
  <line x1="20" y1="58" x2="16" y2="72" stroke="#22c55e" strokeWidth="2"/>
  <line x1="50" y1="58" x2="60" y2="72" stroke="#22c55e" strokeWidth="2"/>
  <text x="2" y="80" fill="#22c55e" fontSize="8">step back</text>
</svg>`;

export const EXERCISE_LIBRARY = {
  'Goblet Squat': {
    muscleGroup: 'Legs / Quads',
    muscleKey: 'legs',
    description: 'Hold a dumbbell vertically at chest height. Feet shoulder-width, toes out 30°. Squat until thighs are parallel to floor, keeping chest tall and knees tracking over toes.',
    youtubeUrl: 'https://www.youtube.com/watch?v=MxsFDhcyFyE',
    exrxUrl: 'https://exrx.net/WeightExercises/Quadriceps/DBGobletSquat',
    svgIllustration: SVG_SQUAT,
    tips: ['Keep chest tall', 'Drive knees out over toes', 'Heels stay flat'],
    why: 'Goblet squats build quad and core strength while being safer for your knees than barbell squats. The dumbbell counterbalance naturally keeps your torso upright and is ideal for building squat mechanics.',
    benefit: 'Quad strength, knee stability, core bracing. Pairs with upper-body pressing for a balanced full-body session.',
    alternatives: ['Leg Press', 'Bodyweight Squat', 'Bulgarian Split Squat', 'Hack Squat'],
  },
  'DB Bench Press': {
    muscleGroup: 'Chest',
    muscleKey: 'chest',
    description: 'Lie flat on bench, dumbbells at chest level, elbows at 45°. Press upward until arms are nearly straight, then lower with control. Keep shoulder blades retracted throughout.',
    youtubeUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94',
    exrxUrl: 'https://exrx.net/WeightExercises/PectoralSternal/DBBenchPress',
    svgIllustration: SVG_BENCH,
    tips: ['Elbows 45° from torso', 'Full range of motion', 'Squeeze at top'],
    why: 'Dumbbell bench press trains the chest through a larger range of motion than barbells and forces each side to work independently, reducing strength imbalances.',
    benefit: 'Chest hypertrophy, shoulder stability, and upper-body pressing strength. Balances the pulling movements in this workout.',
    alternatives: ['Push-up', 'Cable Chest Fly', 'DB Incline Press', 'Machine Chest Press'],
  },
  'Lat Pulldown': {
    muscleGroup: 'Back / Lats',
    muscleKey: 'back',
    description: 'Grab bar wider than shoulder-width, lean back 15°. Pull bar to upper chest by driving elbows toward your hips. Squeeze lats at bottom, control the eccentric.',
    youtubeUrl: 'https://www.youtube.com/watch?v=SAiVhKvYrVA',
    exrxUrl: 'https://exrx.net/WeightExercises/LatissimusDorsi/CBFrontPulldown',
    svgIllustration: SVG_PULLDOWN,
    tips: ['Pull elbows to hips', 'Slight lean back', 'No momentum'],
    why: 'Lat pulldowns build back width and are a great pull-up progression. They train the lats through a full range of motion and support posture by strengthening the muscles that counteract desk-sitting.',
    benefit: 'Back width, posture improvement, and upper-body pulling strength. Critical counterbalance to pressing exercises.',
    alternatives: ['Assisted Pull-up', 'DB Pullover', 'Seated Cable Row', 'Band Pulldown'],
  },
  'DB Row': {
    muscleGroup: 'Back / Lats',
    muscleKey: 'back',
    description: 'Plant one hand and knee on a bench. Row dumbbell to hip, keeping elbow close to body. Retract scapula at top. Control descent over 2-3 seconds.',
    youtubeUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    exrxUrl: 'https://exrx.net/WeightExercises/LatissimusDorsi/DBBentOverRow',
    svgIllustration: SVG_ROW,
    tips: ['Elbow tracks hip', 'Flat back', 'Squeeze at top'],
    why: 'Single-arm rows let you use heavier loads than barbell rows, train each side independently, and strongly engage the mid-back. The supported position protects the lower back.',
    benefit: 'Mid-back thickness, lat strength, and scapular stability. Paired with pulldowns for complete back development.',
    alternatives: ['Seated Cable Row', 'Chest-Supported Row', 'Barbell Row', 'T-Bar Row'],
  },
  'DB Row (each arm)': {
    muscleGroup: 'Back / Lats',
    muscleKey: 'back',
    description: 'Plant one hand and knee on a bench. Row dumbbell to hip, keeping elbow close to body. Retract scapula at top. Control descent over 2-3 seconds.',
    youtubeUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    exrxUrl: 'https://exrx.net/WeightExercises/LatissimusDorsi/DBBentOverRow',
    svgIllustration: SVG_ROW,
    tips: ['Elbow tracks hip', 'Flat back', 'Squeeze at top'],
    why: 'Single-arm rows let you use heavier loads than barbell rows, train each side independently, and strongly engage the mid-back. The supported position protects the lower back.',
    benefit: 'Mid-back thickness, lat strength, and scapular stability.',
    alternatives: ['Seated Cable Row', 'Chest-Supported Row', 'Barbell Row', 'T-Bar Row'],
  },
  'DB Romanian Deadlift': {
    muscleGroup: 'Hamstrings / Glutes',
    muscleKey: 'hamstrings',
    description: 'Hold dumbbells in front of thighs, soft knee bend. Hinge at hips, pushing them back as the weights lower along your legs. Drive hips forward to return. Feel hamstring stretch at bottom.',
    youtubeUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
    exrxUrl: 'https://exrx.net/WeightExercises/Hamstrings/DBRomanianDeadlift',
    svgIllustration: SVG_RDL,
    tips: ['Hip hinge, not squat', 'Keep bar close to legs', 'Feel the hamstring stretch'],
    why: 'The Romanian deadlift is the best exercise for hamstring hypertrophy. It loads the hamstrings in a stretched position which research shows produces the greatest muscle growth stimulus.',
    benefit: 'Hamstring and glute strength, hip hinge mechanics, and lower back resilience. Pairs with overhead pressing for a balanced push/pull/hinge session.',
    alternatives: ['Good Morning', 'Nordic Curl', 'Leg Curl', 'Single-Leg RDL'],
  },
  'Overhead Press': {
    muscleGroup: 'Shoulders',
    muscleKey: 'shoulders',
    description: 'Stand with dumbbells at shoulder height, palms forward. Press overhead until arms are fully extended. Control the eccentric on the way down to shoulder level.',
    youtubeUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    exrxUrl: 'https://exrx.net/WeightExercises/DeltoidAnterior/DBMilitaryPress',
    svgIllustration: SVG_OHP,
    tips: ['Core braced', 'Don\'t flare ribs', 'Full lockout at top'],
    why: 'The overhead press is the king of shoulder exercises, training all three deltoid heads plus the triceps and upper traps. It also builds core stability as you resist arching your lower back.',
    benefit: 'Shoulder strength and size, overhead stability, and core anti-extension. Counterbalances the horizontal pulling movements.',
    alternatives: ['Arnold Press', 'Lateral Raise + Front Raise', 'Machine Shoulder Press', 'DB Upright Row'],
  },
  'DB Reverse Lunge': {
    muscleGroup: 'Legs / Glutes',
    muscleKey: 'glutes',
    description: 'Hold dumbbells at sides, step one foot straight back and lower your knee toward the floor. Keep front shin vertical. Drive through front heel to return.',
    youtubeUrl: 'https://www.youtube.com/watch?v=xrPteyQLGAo',
    exrxUrl: 'https://exrx.net/WeightExercises/GluteusMaximus/DBReverseLunge',
    svgIllustration: SVG_LUNGE,
    tips: ['Front shin vertical', 'Don\'t let knee cave', 'Controlled descent'],
    why: 'Reverse lunges are easier on the knees than forward lunges and strongly target the glutes and quads unilaterally. Single-leg training fixes left-right imbalances and improves running mechanics.',
    benefit: 'Glute and quad strength, single-leg stability, and hip mobility. Complements the RDL for complete lower-body development.',
    alternatives: ['Walking Lunge', 'Bulgarian Split Squat', 'Step-up', 'Lateral Lunge'],
  },
};

// Alternative exercises available for swapping
export const ALTERNATIVE_EXERCISES = {
  'Leg Press': { muscleGroup: 'Legs / Quads', muscleKey: 'legs', sets: 3, reps: 12, defaultWeight: 90 },
  'Bodyweight Squat': { muscleGroup: 'Legs / Quads', muscleKey: 'legs', sets: 3, reps: 20, defaultWeight: 0 },
  'Bulgarian Split Squat': { muscleGroup: 'Legs / Glutes', muscleKey: 'glutes', sets: 3, reps: 10, defaultWeight: 20 },
  'Hack Squat': { muscleGroup: 'Legs / Quads', muscleKey: 'legs', sets: 3, reps: 12, defaultWeight: 90 },
  'Push-up': { muscleGroup: 'Chest', muscleKey: 'chest', sets: 3, reps: 15, defaultWeight: 0 },
  'Cable Chest Fly': { muscleGroup: 'Chest', muscleKey: 'chest', sets: 3, reps: 15, defaultWeight: 30 },
  'DB Incline Press': { muscleGroup: 'Chest / Shoulders', muscleKey: 'chest', sets: 3, reps: 12, defaultWeight: 25 },
  'Machine Chest Press': { muscleGroup: 'Chest', muscleKey: 'chest', sets: 3, reps: 12, defaultWeight: 70 },
  'Assisted Pull-up': { muscleGroup: 'Back / Lats', muscleKey: 'back', sets: 3, reps: 10, defaultWeight: 0 },
  'DB Pullover': { muscleGroup: 'Back / Lats', muscleKey: 'back', sets: 3, reps: 12, defaultWeight: 25 },
  'Seated Cable Row': { muscleGroup: 'Back / Mid', muscleKey: 'back', sets: 3, reps: 12, defaultWeight: 70 },
  'Band Pulldown': { muscleGroup: 'Back / Lats', muscleKey: 'back', sets: 3, reps: 15, defaultWeight: 0 },
  'Chest-Supported Row': { muscleGroup: 'Back / Mid', muscleKey: 'back', sets: 3, reps: 12, defaultWeight: 25 },
  'Barbell Row': { muscleGroup: 'Back / Lats', muscleKey: 'back', sets: 3, reps: 8, defaultWeight: 65 },
  'T-Bar Row': { muscleGroup: 'Back / Mid', muscleKey: 'back', sets: 3, reps: 10, defaultWeight: 45 },
  'Good Morning': { muscleGroup: 'Hamstrings', muscleKey: 'hamstrings', sets: 3, reps: 12, defaultWeight: 25 },
  'Nordic Curl': { muscleGroup: 'Hamstrings', muscleKey: 'hamstrings', sets: 3, reps: 6, defaultWeight: 0 },
  'Leg Curl': { muscleGroup: 'Hamstrings', muscleKey: 'hamstrings', sets: 3, reps: 12, defaultWeight: 60 },
  'Single-Leg RDL': { muscleGroup: 'Hamstrings / Glutes', muscleKey: 'hamstrings', sets: 3, reps: 10, defaultWeight: 20 },
  'Arnold Press': { muscleGroup: 'Shoulders', muscleKey: 'shoulders', sets: 3, reps: 12, defaultWeight: 20 },
  'Lateral Raise': { muscleGroup: 'Shoulders', muscleKey: 'shoulders', sets: 3, reps: 15, defaultWeight: 12 },
  'Machine Shoulder Press': { muscleGroup: 'Shoulders', muscleKey: 'shoulders', sets: 3, reps: 12, defaultWeight: 60 },
  'Walking Lunge': { muscleGroup: 'Legs / Glutes', muscleKey: 'glutes', sets: 3, reps: 12, defaultWeight: 20 },
  'Step-up': { muscleGroup: 'Legs / Glutes', muscleKey: 'glutes', sets: 3, reps: 12, defaultWeight: 20 },
  'Lateral Lunge': { muscleGroup: 'Legs / Glutes', muscleKey: 'glutes', sets: 3, reps: 10, defaultWeight: 15 },
};

export function getExerciseInfo(name) {
  // Exact match first
  if (EXERCISE_LIBRARY[name]) return EXERCISE_LIBRARY[name];
  // Partial match
  const key = Object.keys(EXERCISE_LIBRARY).find(k =>
    k.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? EXERCISE_LIBRARY[key] : null;
}
