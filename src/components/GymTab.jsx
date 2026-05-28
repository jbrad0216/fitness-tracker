import { useState, useEffect, useRef } from 'react';
import { getTodaysWorkoutType, getDaySchedule, getToday } from '../data/constants';
import { getExerciseInfo, MUSCLE_COLORS, ALTERNATIVE_EXERCISES } from '../data/exercises';
import { load, save } from '../data/storage';

const MACHINES_KEY = 'machines';
const SWAPS_KEY = () => `ft_exercise-swaps-${getToday()}`;

function loadMachines() {
  return load(MACHINES_KEY, []);
}
function saveMachines(machines) {
  save(MACHINES_KEY, machines);
}

// ─── Rest Timer ───
function RestTimer({ onDismiss }) {
  const [seconds, setSeconds] = useState(90);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = seconds / 90;
  const color = seconds <= 10 ? '#ef4444' : seconds <= 30 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex items-center gap-4 bg-white/[0.06] border border-white/[0.1] rounded-2xl px-4 py-4 mb-4">
      <div className="relative w-14 h-14 shrink-0">
        <svg width="56" height="56" className="-rotate-90">
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold" style={{ color }}>{seconds}s</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-lg font-bold">
          {seconds === 0 ? '✓ Rest done!' : running ? 'Rest timer' : 'Paused'}
        </div>
        <div className="text-base text-white/40">90 second rest</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-xl border-none cursor-pointer text-white/70">
          {running ? '⏸' : '▶'}
        </button>
        <button onClick={onDismiss}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-xl border-none cursor-pointer text-white/40">
          ✕
        </button>
      </div>
    </div>
  );
}

const GOAL_CONTEXT = {
  'fat-loss': 'Compound movements burn more calories and preserve muscle during a deficit.',
  muscle: 'Progressive overload on compound lifts drives muscle growth.',
  'heart-health': 'Moderate resistance training improves cardiovascular function without excessive strain.',
  lifestyle: 'Functional movements that build practical, everyday strength.',
};

// ─── Per-Set Exercise Card ───
function ExerciseCard({ ex, isLogged, loggedData, prev, onLog, onSwap, onUnlog, goal }) {
  const numSets = ex.sets || 3;
  const recommended = prev
    ? (prev.reps >= (ex.reps || 12) ? prev.weight + 2.5 : prev.weight)
    : ex.defaultWeight;

  const [weight, setWeight] = useState(String(recommended));
  const [reps, setReps] = useState(String(ex.reps || 12));
  const [setsCompleted, setSetsCompleted] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [showSwap, setShowSwap] = useState(false);

  const info = getExerciseInfo(ex.name);
  const completedCount = setsCompleted.length;

  const weightDiff = prev ? (parseFloat(weight) - prev.weight) : 0;
  const progressText = prev
    ? (weightDiff > 0 ? `↑ +${weightDiff.toFixed(1)} lbs — getting stronger!`
      : weightDiff < 0 ? `↓ ${Math.abs(weightDiff).toFixed(1)} lbs lighter today — that's OK`
        : 'Same weight as last time')
    : null;
  const progressColor = prev
    ? (weightDiff > 0 ? 'text-green-400' : weightDiff < 0 ? 'text-amber-400' : 'text-white/40')
    : '';

  const doSet = (idx) => {
    if (setsCompleted.includes(idx)) return;
    const newCompleted = [...setsCompleted, idx];
    setSetsCompleted(newCompleted);
    if (navigator.vibrate) navigator.vibrate(30);
    if (newCompleted.length >= numSets) {
      onLog(ex.name, parseFloat(weight) || 0, numSets, parseInt(reps) || 12);
    }
  };

  const handleSwapSelect = (altName) => {
    const altInfo = ALTERNATIVE_EXERCISES[altName];
    onSwap(ex.name, {
      name: altName,
      sets: altInfo?.sets || ex.sets,
      reps: altInfo?.reps || ex.reps,
      defaultWeight: altInfo?.defaultWeight || ex.defaultWeight,
    });
    setShowSwap(false);
  };

  if (isLogged) {
    return (
      <div className="bg-green-500/[0.06] border border-green-500/25 rounded-2xl px-5 py-4 mb-3 flex items-center gap-3">
        <span className="text-green-400 text-2xl">✓</span>
        <div className="flex-1">
          <div className="text-lg font-bold">{ex.name}</div>
          <div className="text-base text-green-400/80">
            {loggedData ? `${loggedData.weight} lbs × ${loggedData.sets}×${loggedData.reps}` : 'Completed'}
          </div>
        </div>
        {onUnlog && loggedData?.id && (
          <button
            onClick={() => onUnlog(loggedData.id)}
            className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 text-xl
              border-none cursor-pointer flex items-center justify-center active:bg-red-500/25 shrink-0">
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl mb-4 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-2xl font-bold leading-tight mb-1">{ex.name}</div>
            {info && (
              <span className="text-base font-semibold px-3 py-1 rounded-full inline-block"
                style={{ background: `${MUSCLE_COLORS[info.muscleKey] || '#6b7280'}25`, color: MUSCLE_COLORS[info.muscleKey] || '#6b7280' }}>
                {info.muscleGroup}
              </span>
            )}
          </div>
          <div className="text-right ml-3">
            <div className="text-base text-white/40">{completedCount}/{numSets} sets</div>
          </div>
        </div>
        <div className="text-lg font-bold text-white/80 mt-2">
          Recommended: {recommended} lbs × {numSets} sets of {ex.reps || 12}
        </div>
        {prev && (
          <div className="text-base text-white/40 mt-0.5">
            Last time: {prev.weight} lbs × {prev.sets}×{prev.reps}
          </div>
        )}
        {progressText && (
          <div className={`text-base font-semibold mt-1 ${progressColor}`}>{progressText}</div>
        )}
      </div>

      <div className="px-5 pb-3">
        <button onClick={() => setShowInfo(v => !v)}
          className="flex items-center gap-2 text-base text-amber-400 font-semibold
            bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 h-12 w-full text-left cursor-pointer active:opacity-70">
          <span>▶</span>
          <span className="flex-1">How To Do This</span>
          <span className="text-white/30">{showInfo ? '▾' : '›'}</span>
        </button>
        {showInfo && info && (
          <div className="mt-3 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-4">
            <p className="text-base text-white/70 leading-relaxed mb-3">{info.description}</p>
            {info.tips?.slice(0, 2).map((tip, i) => (
              <div key={i} className="flex gap-2 text-base text-white/50 mb-1">
                <span className="text-green-400 shrink-0">▸</span>{tip}
              </div>
            ))}
            {info.why && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-base text-white/60"><span className="font-semibold text-white/80">Why:</span> {info.why}</p>
              </div>
            )}
            {goal && GOAL_CONTEXT[goal] && (
              <p className="text-base text-blue-300/80 mt-2">{GOAL_CONTEXT[goal]}</p>
            )}
            {info.youtubeUrl && (
              <a href={info.youtubeUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-red-500/15 border border-red-500/30
                  rounded-xl px-4 h-12 text-red-400 text-base font-semibold no-underline mt-3">
                <span>▶</span> Watch on YouTube
              </a>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-3">
        <div className="text-base font-semibold text-white/50 mb-2">Log your set:</div>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="text-base text-white/40 mb-1">Weight (lbs)</div>
            <input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done"
              value={weight} onChange={e => setWeight(e.target.value)}
              className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-xl font-bold text-white outline-none focus:border-blue-500/50" />
          </div>
          <div className="w-24">
            <div className="text-base text-white/40 mb-1">Reps</div>
            <input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done"
              value={reps} onChange={e => setReps(e.target.value)}
              className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-xl font-bold text-white outline-none focus:border-blue-500/50" />
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 space-y-2">
        {Array.from({ length: numSets }, (_, i) => {
          const done = setsCompleted.includes(i);
          return (
            <button key={i} onClick={() => doSet(i)} disabled={done}
              className={`w-full h-14 rounded-xl text-lg font-bold border-none cursor-pointer transition-all
                ${done
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/[0.08] text-white/70 border border-white/[0.1] active:bg-blue-500/20 active:text-blue-300'}`}
              style={{ borderStyle: 'solid' }}>
              {done
                ? `✓ SET ${i + 1} DONE — ${weight} lbs × ${reps} reps`
                : `DO SET ${i + 1}`}
            </button>
          );
        })}
      </div>

      {info?.alternatives?.length > 0 && (
        <div className="px-5 pb-4">
          <button onClick={() => setShowSwap(v => !v)}
            className="flex items-center gap-2 text-base text-white/40 font-semibold
              bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 h-12 w-full text-left cursor-pointer active:opacity-70">
            <span>🔄</span>
            <span className="flex-1">Swap for different exercise</span>
            <span className="text-white/30">{showSwap ? '▾' : '›'}</span>
          </button>
          {showSwap && (
            <div className="mt-2 space-y-2">
              {info.alternatives.map(alt => (
                <button key={alt} onClick={() => handleSwapSelect(alt)}
                  className="w-full text-left px-4 h-14 bg-white/[0.04] border border-white/[0.08]
                    rounded-xl text-base text-white/70 cursor-pointer active:bg-white/[0.08]">
                  {alt}
                  {ALTERNATIVE_EXERCISES[alt]?.muscleGroup && (
                    <span className="text-base text-white/30 ml-2">— {ALTERNATIVE_EXERCISES[alt].muscleGroup}</span>
                  )}
                </button>
              ))}
              <button onClick={() => setShowSwap(false)}
                className="w-full text-center h-12 text-base text-white/30 bg-transparent border-none cursor-pointer">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Machine Management ───
const MACHINE_MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body'];

function compressPhoto(file, callback) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(200 / img.width, 200 / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function AddMachineForm({ onAdd, onClose, editMachine }) {
  const [name, setName] = useState(editMachine?.name || '');
  const [muscles, setMuscles] = useState(editMachine?.muscleGroups || []);
  const [startWeight, setStartWeight] = useState(String(editMachine?.startingWeight || ''));
  const [photo, setPhoto] = useState(editMachine?.photo || null);
  const fileRef = useRef(null);

  const toggleMuscle = (m) =>
    setMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressPhoto(file, setPhoto);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: editMachine?.id || `machine-${Date.now()}`,
      name: name.trim(),
      muscleGroups: muscles.length > 0 ? muscles : ['Full Body'],
      startingWeight: parseFloat(startWeight) || 0,
      photo,
      lastWeight: editMachine?.lastWeight || (parseFloat(startWeight) || 0),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
      <div className="flex items-center gap-3 px-4 mb-6">
        <button onClick={onClose}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-2xl border-none cursor-pointer flex items-center justify-center">
          ‹
        </button>
        <h1 className="text-2xl font-bold">{editMachine ? 'EDIT MACHINE' : 'ADD MACHINE'}</h1>
      </div>

      <div className="px-4 space-y-4">
        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Machine Name</div>
          <input type="text" inputMode="text" autoComplete="off"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Chest Press Machine"
            className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-lg text-white outline-none focus:border-blue-500/60 placeholder:text-white/25" />
        </div>

        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Muscle Group(s)</div>
          <div className="flex flex-wrap gap-2">
            {MACHINE_MUSCLE_GROUPS.map(m => (
              <button key={m} onClick={() => toggleMuscle(m)}
                className={`h-12 px-4 rounded-xl text-base font-semibold border-none cursor-pointer active:scale-95 transition-all
                  ${muscles.includes(m) ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-white/50'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Starting Weight (lbs)</div>
          <input type="text" inputMode="numeric" autoComplete="off"
            value={startWeight} onChange={e => setStartWeight(e.target.value)}
            placeholder="e.g. 90"
            className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-lg text-white outline-none focus:border-blue-500/60 placeholder:text-white/25" />
        </div>

        {/* Photo capture */}
        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Machine Photo (optional)</div>
          {photo ? (
            <div className="relative inline-block">
              <img src={photo} alt="Machine" className="w-24 h-24 rounded-xl object-cover" />
              <button onClick={() => setPhoto(null)}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white text-sm border-none cursor-pointer">
                ×
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full bg-white/[0.06] border border-white/[0.1] border-solid text-white/60
                rounded-xl h-14 text-base font-semibold cursor-pointer active:opacity-70">
              📸 Take Photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            onChange={handlePhoto} className="hidden" />
        </div>

        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80 disabled:opacity-40">
          {editMachine ? 'SAVE CHANGES' : 'ADD MACHINE'}
        </button>
        <button onClick={onClose}
          className="w-full bg-transparent text-white/40 h-12 text-base border-none cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Machine Workout Modal (Task 3) ───
const FOCUS_AREAS_LIST = [
  { id: 'Chest', label: 'Chest' },
  { id: 'Back', label: 'Back' },
  { id: 'Shoulders', label: 'Shoulders' },
  { id: 'Arms', label: 'Arms' },
  { id: 'Legs', label: 'Legs' },
  { id: 'Core', label: 'Core' },
  { id: 'Full Body', label: 'Full Body' },
];

const FOCUS_EXERCISE_MAP = {
  Chest: [
    { name: 'Chest Press Machine', sets: 3, reps: 12, defaultWeight: 90 },
    { name: 'DB Bench Press', sets: 3, reps: 12, defaultWeight: 30 },
    { name: 'Pec Fly', sets: 3, reps: 12, defaultWeight: 50 },
    { name: 'Push-up', sets: 3, reps: 15, defaultWeight: 0 },
  ],
  Back: [
    { name: 'Lat Pulldown', sets: 3, reps: 12, defaultWeight: 85 },
    { name: 'Seated Row', sets: 3, reps: 12, defaultWeight: 80 },
    { name: 'DB Row (each arm)', sets: 3, reps: 12, defaultWeight: 25 },
    { name: 'Cable Row', sets: 3, reps: 12, defaultWeight: 70 },
  ],
  Shoulders: [
    { name: 'Shoulder Press Machine', sets: 3, reps: 12, defaultWeight: 60 },
    { name: 'Overhead Press', sets: 3, reps: 12, defaultWeight: 27.5 },
    { name: 'Lateral Raise', sets: 3, reps: 15, defaultWeight: 12 },
  ],
  Arms: [
    { name: 'DB Curl', sets: 3, reps: 12, defaultWeight: 20 },
    { name: 'Tricep Pushdown', sets: 3, reps: 12, defaultWeight: 40 },
    { name: 'Hammer Curl', sets: 3, reps: 12, defaultWeight: 20 },
  ],
  Legs: [
    { name: 'Leg Press', sets: 3, reps: 12, defaultWeight: 180 },
    { name: 'Leg Curl', sets: 3, reps: 12, defaultWeight: 60 },
    { name: 'Leg Extension', sets: 3, reps: 12, defaultWeight: 60 },
    { name: 'Goblet Squat', sets: 3, reps: 12, defaultWeight: 30 },
  ],
  Core: [
    { name: 'Plank', sets: 3, reps: 45, defaultWeight: 0 },
    { name: 'Dead Bug', sets: 3, reps: 10, defaultWeight: 0 },
    { name: 'Cable Crunch', sets: 3, reps: 15, defaultWeight: 40 },
  ],
  'Full Body': [
    { name: 'DB Romanian Deadlift', sets: 3, reps: 12, defaultWeight: 25 },
    { name: 'Goblet Squat', sets: 3, reps: 12, defaultWeight: 30 },
    { name: 'Push-up', sets: 3, reps: 15, defaultWeight: 0 },
  ],
};

function MachineWorkoutModal({ machines, onApply, onClose, onMachinesChanged }) {
  const [view, setView] = useState(machines.length === 0 ? 'machines' : 'build');
  const [selected, setSelected] = useState([]);
  const [generated, setGenerated] = useState(null);
  const [editMachine, setEditMachine] = useState(null);
  const [showAddMachine, setShowAddMachine] = useState(false);

  const toggleFocus = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );

  const handleAddMachine = (machine) => {
    const current = loadMachines();
    const idx = current.findIndex(m => m.id === machine.id);
    let next;
    if (idx >= 0) {
      next = current.map(m => m.id === machine.id ? machine : m);
    } else {
      next = [...current, machine];
    }
    saveMachines(next);
    onMachinesChanged(next);
    setShowAddMachine(false);
    setEditMachine(null);
  };

  const handleDeleteMachine = (id) => {
    const next = machines.filter(m => m.id !== id);
    saveMachines(next);
    onMachinesChanged(next);
  };

  const generateWorkout = () => {
    const exercises = [];
    const usedNames = new Set();

    // First, use actual machines matching the selected focus areas
    const matchingMachines = machines.filter(m =>
      m.muscleGroups.some(mg => selected.includes(mg))
    );

    matchingMachines.forEach(machine => {
      if (exercises.length >= 5) return;
      const exName = machine.name;
      if (!usedNames.has(exName)) {
        exercises.push({
          name: exName,
          sets: 3,
          reps: 12,
          defaultWeight: machine.lastWeight || machine.startingWeight || 0,
        });
        usedNames.add(exName);
      }
    });

    // Fill remainder with generic exercises
    selected.forEach(area => {
      (FOCUS_EXERCISE_MAP[area] || []).forEach(ex => {
        if (exercises.length >= 5) return;
        if (!usedNames.has(ex.name)) {
          exercises.push(ex);
          usedNames.add(ex.name);
        }
      });
    });

    setGenerated(exercises.slice(0, 5));
  };

  if (showAddMachine || editMachine) {
    return (
      <AddMachineForm
        editMachine={editMachine || undefined}
        onAdd={handleAddMachine}
        onClose={() => { setShowAddMachine(false); setEditMachine(null); }}
      />
    );
  }

  if (generated) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0f1117] overflow-y-auto"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
        <div className="flex items-center gap-3 px-4 mb-5">
          <button onClick={() => setGenerated(null)}
            className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-2xl border-none cursor-pointer flex items-center justify-center">
            ‹
          </button>
          <h1 className="text-2xl font-bold">TODAY'S WORKOUT</h1>
        </div>
        <div className="px-4">
          <div className="text-base text-white/50 mb-4">
            {selected.join(', ')} · {generated.length} exercises
          </div>
          {generated.map((ex, i) => (
            <div key={i} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-3">
              <div className="text-xl font-bold">{ex.name}</div>
              <div className="text-base text-white/50">{ex.sets}×{ex.reps}{ex.defaultWeight ? ` @ ${ex.defaultWeight} lbs` : ''}</div>
            </div>
          ))}
          <button onClick={() => onApply(generated)}
            className="w-full bg-green-500 text-white rounded-2xl h-14 text-xl font-bold border-none cursor-pointer active:opacity-80 mt-2">
            BUILD MY WORKOUT →
          </button>
          <button onClick={() => setGenerated(null)}
            className="w-full bg-white/[0.06] text-white/50 rounded-2xl h-12 text-base border-none cursor-pointer mt-2">
            Try Different Areas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-2xl font-bold">Customize Workout</h2>
        <button onClick={onClose}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-white/60 border-none cursor-pointer text-xl flex items-center justify-center">
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-5">
        {[
          { id: 'build', label: 'Build Workout' },
          { id: 'machines', label: 'My Machines' },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`flex-1 h-12 rounded-xl text-base font-semibold border-none cursor-pointer transition-all
              ${view === t.id ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-white/50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {view === 'build' && (
        <div className="px-4">
          <p className="text-base text-white/50 mb-4">Select 1–3 focus areas:</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {FOCUS_AREAS_LIST.map(area => (
              <button key={area.id} onClick={() => toggleFocus(area.id)}
                className={`h-14 px-5 rounded-2xl text-base font-bold border cursor-pointer active:scale-95 transition-all
                  ${selected.includes(area.id)
                    ? 'bg-blue-500 border-blue-400 text-white'
                    : 'bg-white/[0.06] border-white/[0.1] text-white/60'}`}
                style={{ borderStyle: 'solid' }}>
                {area.label}
              </button>
            ))}
          </div>

          {selected.length > 0 && machines.length > 0 && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
              <div className="text-base font-semibold text-white/50 mb-2">Your machines for these areas:</div>
              {machines
                .filter(m => m.muscleGroups.some(mg => selected.includes(mg)))
                .map(m => (
                  <div key={m.id} className="flex items-center gap-2 py-1">
                    <span className="text-green-400 text-base">✓</span>
                    <span className="text-base text-white/70">{m.name}</span>
                    <span className="text-base text-white/30">— {m.muscleGroups.join(', ')}</span>
                  </div>
                ))}
            </div>
          )}

          <button onClick={generateWorkout} disabled={selected.length === 0}
            className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold
              border-none cursor-pointer active:opacity-80 mt-2 disabled:opacity-40">
            GENERATE WORKOUT ({selected.length}/3 areas)
          </button>
        </div>
      )}

      {view === 'machines' && (
        <div className="px-4">
          <button onClick={() => setShowAddMachine(true)}
            className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80 mb-4">
            + Add Machine
          </button>

          {machines.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              <div className="text-4xl mb-3">🏋️</div>
              <div className="text-lg">No machines added yet</div>
              <div className="text-base mt-1">Tap "+ Add Machine" to get started</div>
            </div>
          ) : (
            <div className="space-y-3">
              {machines.map(m => (
                <div key={m.id}
                  className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-3">
                  {m.photo && (
                    <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold truncate">{m.name}</div>
                    <div className="text-base text-white/40">{m.muscleGroups.join(', ')}</div>
                    {m.lastWeight > 0 && (
                      <div className="text-base text-white/30">Last: {m.lastWeight} lbs</div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditMachine(m)}
                      className="w-10 h-10 rounded-lg bg-white/[0.06] text-white/50 text-base border-none cursor-pointer">
                      ✎
                    </button>
                    <button onClick={() => handleDeleteMachine(m.id)}
                      className="w-10 h-10 rounded-lg bg-red-500/15 text-red-400 text-base border-none cursor-pointer">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Week Calendar ───
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const weekNum = Math.floor((today - startOfYear) / 604800000);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const d = date.getDay();
    let schedType;
    if ([1, 3, 5].includes(d)) {
      const idx = [1, 3, 5].indexOf(d);
      schedType = weekNum % 2 === 0 ? (idx % 2 === 0 ? 'A' : 'B') : (idx % 2 === 0 ? 'B' : 'A');
    } else if ([2, 4].includes(d)) {
      schedType = 'cardio';
    } else if (d === 6) {
      schedType = 'longrun';
    } else {
      schedType = 'rest';
    }
    const isToday = date.toDateString() === today.toDateString();
    const isFuture = date > today && !isToday;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    let isComplete = false;
    if (!isFuture) {
      try {
        const raw = localStorage.getItem(`ft_daily-${dateStr}`);
        if (raw) {
          const dayData = JSON.parse(raw);
          if (schedType === 'rest') isComplete = true;
          else if (schedType === 'cardio' || schedType === 'longrun') isComplete = (dayData.ranMiles || 0) > 0;
          else isComplete = Array.isArray(dayData.exercises) && dayData.exercises.length > 0;
        }
      } catch {}
    }
    return { date, dateStr, schedType, isToday, isFuture, isComplete };
  });
}

function schedDisplay(type) {
  if (type === 'A') return { text: 'A', color: '#3b82f6' };
  if (type === 'B') return { text: 'B', color: '#3b82f6' };
  if (type === 'cardio' || type === 'longrun') return { text: '🏃', color: '#22c55e' };
  return { text: '😴', color: '#a855f7' };
}

function WeekCalendar({ selectedIdx, onSelect, templates }) {
  const weekDays = getWeekDays();
  const monday = weekDays[0].date;
  const selectedDay = selectedIdx !== null ? weekDays[selectedIdx] : null;
  let selectedDayData = null;
  if (selectedDay && !selectedDay.isFuture) {
    try {
      const raw = localStorage.getItem(`ft_daily-${selectedDay.dateStr}`);
      if (raw) selectedDayData = JSON.parse(raw);
    } catch {}
  }

  return (
    <>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 pt-3 pb-4 mb-4">
        <div className="text-base text-white/40 mb-3">
          Week of {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="flex justify-between">
          {weekDays.map((day, i) => {
            const { text, color } = schedDisplay(day.schedType);
            const isSelected = selectedIdx === i;
            return (
              <button key={i} onClick={() => onSelect(isSelected ? null : i)}
                className={`flex flex-col items-center gap-1 py-1 border-none bg-transparent cursor-pointer
                  active:opacity-70 ${day.isFuture ? 'opacity-35' : ''}`}
                style={{ minWidth: '40px' }}>
                <span className="text-base text-white/40 font-medium">{DAY_LABELS[i]}</span>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center
                  ${day.isToday ? 'bg-blue-500/25 ring-2 ring-blue-400' : 'bg-white/[0.06]'}
                  ${isSelected && !day.isToday ? 'ring-1 ring-white/40' : ''}`}>
                  {!day.isFuture && day.isComplete && !day.isToday
                    ? <span className="text-green-400 text-base font-bold">✓</span>
                    : <span className="font-bold text-base" style={{ color }}>{text}</span>}
                </div>
                {day.isToday && <span className="text-base text-blue-400 font-medium">today</span>}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4">
          <div className="text-lg font-semibold mb-1">
            {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          {(selectedDay.schedType === 'A' || selectedDay.schedType === 'B') && (
            <>
              <div className="text-base text-blue-400 mb-2">Workout {selectedDay.schedType}</div>
              {selectedDayData?.exercises?.length > 0 && selectedDayData.exercises.map((e, i) => (
                <div key={i} className="text-base text-green-400 py-1.5 border-b border-white/[0.06] last:border-0">
                  ✓ {e.name} — {e.weight}lbs × {e.sets}×{e.reps}
                </div>
              ))}
              {(!selectedDayData?.exercises || selectedDayData.exercises.length === 0) &&
                (selectedDay.schedType === 'A' ? templates?.A : templates?.B || []).map((ex, i) => (
                  <div key={i} className="text-base text-white/50 py-1.5 border-b border-white/[0.06] last:border-0">
                    {ex.name} — {ex.sets}×{ex.reps}
                  </div>
                ))}
            </>
          )}
          {selectedDay.schedType === 'cardio' && (
            <div className="text-base text-white/60">
              <div className="text-base text-amber-400 mb-1">Cardio Day</div>
              {selectedDayData?.ranMiles > 0
                ? <div className="text-green-400">✓ {selectedDayData.ranMiles}mi logged</div>
                : 'Run + 15 min stretching'}
            </div>
          )}
          {selectedDay.schedType === 'longrun' && (
            <div className="text-base text-white/60">
              <div className="text-base text-green-400 mb-1">Long Run Day</div>
              {selectedDayData?.ranMiles > 0
                ? <div className="text-green-400">✓ {selectedDayData.ranMiles}mi logged</div>
                : 'Push the distance. Stretch after.'}
            </div>
          )}
          {selectedDay.schedType === 'rest' && (
            <div className="text-base text-white/60">
              <div className="text-base text-purple-400 mb-1">Rest Day</div>
              Recover. Walk if you feel like it.
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Workout Completion Summary with Calories ───
function WorkoutCompletionSummary({ exercises, workoutType, startTime, workoutCalories, onSaveCalories }) {
  const totalVolume = exercises.reduce((sum, e) => sum + (e.weight || 0) * (e.sets || 3) * (e.reps || 12), 0);
  const minutes = startTime ? Math.round((Date.now() - startTime) / 60000) : null;
  const estimatedCal = minutes ? Math.round(minutes * 6) : 150;
  const [calInput, setCalInput] = useState(String(workoutCalories ?? estimatedCal));
  const [saved, setSaved] = useState(!!workoutCalories);

  const handleSave = () => {
    onSaveCalories(parseInt(calInput) || estimatedCal);
    setSaved(true);
  };

  return (
    <div className="bg-green-500/[0.08] border border-green-500/30 rounded-2xl px-5 py-5 mb-4 text-center">
      <div className="text-4xl mb-2">🎉</div>
      <div className="text-2xl font-bold text-green-400 mb-2">WORKOUT COMPLETE!</div>
      <div className="text-lg text-white/70 mb-1">
        {exercises.length} exercises · {exercises.reduce((s, e) => s + (e.sets || 3), 0)} total sets
        {minutes ? ` · ~${minutes} min` : ''}
      </div>
      {totalVolume > 0 && (
        <div className="text-xl font-bold text-white/60 mt-2">
          Total volume: {totalVolume.toLocaleString()} lbs lifted
        </div>
      )}
      <div className="mt-4 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3">
        <div className="text-base text-white/50 mb-2">
          Calories burned: ~{estimatedCal} cal estimated
          {minutes ? ` (${minutes} min × 6 cal/min)` : ''}
        </div>
        <div className="flex gap-2 items-center">
          <input type="text" inputMode="numeric" autoComplete="off"
            value={calInput} onChange={e => setCalInput(e.target.value)}
            className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-12 text-lg text-white outline-none focus:border-blue-500/50" />
          <span className="text-base text-white/40">cal</span>
          <button onClick={handleSave}
            className={`h-12 px-4 rounded-xl text-base font-bold border-none cursor-pointer active:opacity-70
              ${saved ? 'bg-green-500/20 text-green-400' : 'bg-blue-500 text-white'}`}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Enhanced Run Logging ───
function RunLogPanel({ daily, addRunEntry, notify }) {
  const [miles, setMiles] = useState('');
  const [time, setTime] = useState('');
  const [calories, setCalories] = useState('');
  const [show, setShow] = useState(false);

  const milesNum = parseFloat(miles) || 0;
  const estimatedCal = milesNum > 0 ? Math.round(milesNum * 100) : 0;

  const handleLog = () => {
    if (!milesNum || milesNum <= 0) return;
    const calNum = parseInt(calories) || 0;
    const timeNum = parseInt(time) || 0;
    addRunEntry(milesNum, timeNum || null, calNum || null);
    notify(`${milesNum}mi logged${timeNum ? ` · ${timeNum} min` : ''}${calNum ? ` · ${calNum} cal` : ` · ~${estimatedCal} cal`}`);
    setMiles(''); setTime(''); setCalories('');
    setShow(false);
  };

  const runLog = daily.runLog || [];
  const totalCal = runLog.reduce((s, r) => s + (r.calories || 0), 0);

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4">
      <div className="text-lg font-semibold mb-2">🏃 Run</div>

      {runLog.length > 0 && (
        <div className="mb-3 space-y-1">
          {runLog.map((r, i) => (
            <div key={i} className="flex justify-between text-base">
              <span className="text-green-400">✓ {r.miles}mi</span>
              <span className="text-white/40">
                {r.minutes ? `${r.minutes} min · ` : ''}~{r.calories} cal
              </span>
            </div>
          ))}
          <div className="text-base text-white/30 pt-1 border-t border-white/[0.06]">
            Total: {daily.ranMiles}mi · ~{totalCal} cal burned
          </div>
        </div>
      )}

      {show ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-base text-white/50 mb-1">Miles</div>
              <input type="text" inputMode="decimal" autoComplete="off"
                value={miles} onChange={e => setMiles(e.target.value)}
                placeholder="2.0"
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 h-14 text-lg text-white outline-none focus:border-blue-500/50 placeholder:text-white/25" />
            </div>
            <div>
              <div className="text-base text-white/50 mb-1">Time (min)</div>
              <input type="text" inputMode="numeric" autoComplete="off"
                value={time} onChange={e => setTime(e.target.value)}
                placeholder="22"
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 h-14 text-lg text-white outline-none focus:border-blue-500/50 placeholder:text-white/25" />
            </div>
            <div>
              <div className="text-base text-white/50 mb-1">Cal (opt.)</div>
              <input type="text" inputMode="numeric" autoComplete="off"
                value={calories} onChange={e => setCalories(e.target.value)}
                placeholder={estimatedCal > 0 ? String(estimatedCal) : '~auto'}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 h-14 text-lg text-white outline-none focus:border-blue-500/50 placeholder:text-white/25" />
            </div>
          </div>
          {milesNum > 0 && !calories && (
            <div className="text-base text-white/40">
              Estimated: ~{estimatedCal} cal burned (100 cal/mile)
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleLog}
              className="flex-1 bg-green-500 text-white rounded-xl h-14 text-base font-bold border-none cursor-pointer active:scale-95">
              LOG RUN
            </button>
            <button onClick={() => setShow(false)}
              className="w-14 h-14 bg-white/[0.08] text-white/50 rounded-xl border-none cursor-pointer text-base">
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShow(true)}
          className="w-full bg-white/[0.08] text-white/60 rounded-xl h-14 text-base font-semibold border-none cursor-pointer active:opacity-70">
          {runLog.length > 0 ? '+ Log Another Run' : '+ Log Run'}
        </button>
      )}
    </div>
  );
}

function getWeekKey() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const weekNum = Math.floor((today - startOfYear) / 604800000);
  return `ft_schedule-overrides-${today.getFullYear()}-${weekNum}`;
}

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(getWeekKey()) || '{}'); } catch { return {}; }
}
function saveOverrides(overrides) { localStorage.setItem(getWeekKey(), JSON.stringify(overrides)); }

// ─── Main GymTab ───
export function GymTab({ daily, addRun, addRunEntry, addExercise, removeExercise, getLastLift, logLift, setWorkoutCalories, templates, notify, goal }) {
  const [showTimer, setShowTimer] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showSkipMenu, setShowSkipMenu] = useState(false);
  const [overrides, setOverrides] = useState(loadOverrides);
  const [machines, setMachines] = useState(loadMachines);
  const [workoutStartTime] = useState(() => Date.now());
  const [customWorkout, setCustomWorkout] = useState(() => {
    try {
      const raw = localStorage.getItem(`ft_custom-workout-${getToday()}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [swaps, setSwaps] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SWAPS_KEY()) || '{}'); } catch { return {}; }
  });

  const schedule = getDaySchedule();
  const workoutType = getTodaysWorkoutType();
  const exercises = workoutType === 'A' ? (templates?.A || []) : workoutType === 'B' ? (templates?.B || []) : [];

  const todayKey = getToday();
  const todayOverride = overrides[todayKey];

  const handleSkipToday = (action) => {
    const next = { ...overrides };
    if (action === 'skip') {
      next[todayKey] = 'skipped';
    } else {
      next[todayKey] = 'rescheduled';
      let checkDay = new Date();
      checkDay.setDate(checkDay.getDate() + 1);
      for (let i = 0; i < 6; i++) {
        if (checkDay.getDay() !== 0) {
          const dStr = `${checkDay.getFullYear()}-${String(checkDay.getMonth() + 1).padStart(2, '0')}-${String(checkDay.getDate()).padStart(2, '0')}`;
          next[dStr] = `moved-${workoutType || 'A'}`;
          break;
        }
        checkDay.setDate(checkDay.getDate() + 1);
      }
    }
    setOverrides(next);
    saveOverrides(next);
    setShowSkipMenu(false);
    notify(action === 'skip' ? 'Workout skipped' : 'Workout rescheduled to tomorrow');
  };

  const handleSwap = (originalName, newEx) => {
    const next = { ...swaps, [originalName]: newEx };
    setSwaps(next);
    localStorage.setItem(SWAPS_KEY(), JSON.stringify(next));
    notify(`Swapped to ${newEx.name}`);
  };

  const getEffectiveExercise = (ex) => swaps[ex.name] ? { ...ex, ...swaps[ex.name] } : ex;

  const handleLog = (name, weight, sets, reps) => {
    addExercise({ name, weight, sets, reps });
    logLift(name, weight, sets, reps);
    setShowTimer(true);
    notify(`${name} — ${weight} lbs × ${sets}×${reps} logged`);
  };

  const activeExercises = customWorkout || exercises;
  const allDone = (schedule === 'strength' || !!customWorkout) && activeExercises.length > 0 &&
    activeExercises.every(ex => daily.exercises.some(e => e.name === getEffectiveExercise(ex).name));

  const scheduleLabels = {
    strength: { text: `Workout ${workoutType} — Strength`, color: 'text-blue-400' },
    cardio: { text: 'Cardio + Mobility Day', color: 'text-amber-400' },
    longrun: { text: 'Long Run Day', color: 'text-green-400' },
    rest: { text: 'Rest Day — Recover', color: 'text-purple-400' },
  };
  const { text: schedLabel, color: schedColor } = scheduleLabels[schedule] || scheduleLabels.rest;

  return (
    <div className="px-4 pb-28" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      {showCustomize && (
        <MachineWorkoutModal
          machines={machines}
          onApply={(workout) => {
            localStorage.setItem(`ft_custom-workout-${getToday()}`, JSON.stringify(workout));
            setCustomWorkout(workout);
            setShowCustomize(false);
          }}
          onClose={() => setShowCustomize(false)}
          onMachinesChanged={setMachines}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className={`text-xl font-bold ${schedColor}`}>
          {customWorkout ? '🎯 Custom Workout' : schedLabel}
        </div>
        <div className="flex gap-2">
          {(schedule === 'strength' || customWorkout) && !todayOverride && !allDone && (
            <button onClick={() => setShowSkipMenu(s => !s)}
              className="text-base text-white/40 font-semibold bg-white/[0.05] border border-white/[0.08]
                rounded-xl px-4 h-12 cursor-pointer active:opacity-70">
              Skip
            </button>
          )}
          <button onClick={() => setShowCustomize(true)}
            className="text-base text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20
              rounded-xl px-4 h-12 cursor-pointer active:opacity-70">
            Customize
          </button>
        </div>
      </div>
      <div className="text-base text-white/40 mb-4 flex items-center gap-2">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        {customWorkout && (
          <button
            onClick={() => { localStorage.removeItem(`ft_custom-workout-${getToday()}`); setCustomWorkout(null); }}
            className="text-base text-white/30 bg-transparent border-none cursor-pointer">
            (reset to schedule)
          </button>
        )}
      </div>

      <WeekCalendar selectedIdx={selectedDayIdx} onSelect={setSelectedDayIdx} templates={templates} />

      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}

      {/* Run logging */}
      <RunLogPanel daily={daily} addRunEntry={addRunEntry || addRun} notify={notify} />

      {/* Skip menu */}
      {showSkipMenu && (
        <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl px-5 py-4 mb-4">
          <div className="text-lg font-semibold mb-3">Skip today's workout?</div>
          <div className="space-y-2">
            <button onClick={() => handleSkipToday('reschedule')}
              className="w-full bg-blue-500/15 border border-blue-500/30 text-blue-300 rounded-xl
                h-14 text-base font-semibold cursor-pointer active:opacity-70 text-left px-5">
              📅 Reschedule to tomorrow
            </button>
            <button onClick={() => handleSkipToday('skip')}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white/50 rounded-xl
                h-14 text-base font-semibold cursor-pointer active:opacity-70 text-left px-5">
              ⏭ Skip — continue schedule
            </button>
            <button onClick={() => setShowSkipMenu(false)}
              className="w-full bg-transparent border-none text-white/30 h-12 cursor-pointer text-base">
              Cancel
            </button>
          </div>
        </div>
      )}

      {todayOverride === 'skipped' && (
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-lg font-semibold text-white/50">Workout skipped today</div>
            <div className="text-base text-white/30">Schedule continues normally tomorrow.</div>
          </div>
          <button onClick={() => { const n = { ...overrides }; delete n[todayKey]; setOverrides(n); saveOverrides(n); }}
            className="text-base text-blue-400 bg-transparent border-none cursor-pointer font-semibold">Undo</button>
        </div>
      )}
      {todayOverride === 'rescheduled' && (
        <div className="bg-blue-500/[0.08] border border-blue-500/20 rounded-2xl px-5 py-4 mb-4">
          <div className="text-lg font-semibold text-blue-300">Workout rescheduled to tomorrow</div>
          <div className="text-base text-white/40 mt-1">Rest today. Tomorrow's workout is moved up.</div>
        </div>
      )}

      {/* Strength workout */}
      {(schedule === 'strength' || customWorkout) && activeExercises.length > 0 && !todayOverride && (
        <div>
          {!allDone && !customWorkout && (
            <div className="bg-blue-500/[0.07] border border-blue-500/15 rounded-2xl px-5 py-4 mb-4">
              <div className="text-xl font-bold mb-1">
                {workoutType === 'A' ? 'Workout A — Push & Squat' : 'Workout B — Pull & Hinge'}
              </div>
              <div className="text-base text-white/60 leading-relaxed">
                {workoutType === 'A'
                  ? 'Targets chest, shoulders, quads, and triceps. Compound pushing movements plus lower body.'
                  : 'Targets back, hamstrings, glutes, and biceps. Pulling movements and hip hinges.'}
              </div>
            </div>
          )}

          {allDone && (
            <WorkoutCompletionSummary
              exercises={daily.exercises}
              workoutType={workoutType}
              startTime={workoutStartTime}
              workoutCalories={daily.workoutCalories}
              onSaveCalories={setWorkoutCalories || (() => {})}
            />
          )}

          {activeExercises.map((ex, i) => {
            const effective = getEffectiveExercise(ex);
            const prev = getLastLift(effective.name);
            const isLogged = daily.exercises.some(e => e.name === effective.name);
            const loggedData = daily.exercises.find(e => e.name === effective.name);
            return (
              <ExerciseCard
                key={`${effective.name}-${i}`}
                ex={effective}
                isLogged={isLogged}
                loggedData={loggedData}
                prev={prev}
                onLog={handleLog}
                onSwap={handleSwap}
                onUnlog={(id) => { removeExercise(id); notify(`${effective.name} removed`); }}
                goal={goal}
              />
            );
          })}
        </div>
      )}

      {/* Non-strength day */}
      {schedule !== 'strength' && !customWorkout && (
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-5 text-center">
          {schedule === 'rest' && <p className="text-base text-white/50">Rest day. Recover. Walk if you feel like it.</p>}
          {schedule === 'longrun' && <p className="text-base text-white/50">Long run day. Push the distance. Stretch after.</p>}
          {schedule === 'cardio' && <p className="text-base text-white/50">Cardio + mobility day. Run + 15 min stretching.</p>}
        </div>
      )}

      {/* My Machines quick access */}
      {machines.length > 0 && (
        <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-3">
          <div className="text-base text-white/40 font-semibold mb-2">MY MACHINES ({machines.length})</div>
          <div className="flex flex-wrap gap-2">
            {machines.slice(0, 4).map(m => (
              <span key={m.id} className="text-base text-white/50 bg-white/[0.05] px-3 py-1 rounded-lg">
                {m.name}
              </span>
            ))}
            {machines.length > 4 && (
              <span className="text-base text-white/30 px-3 py-1">+{machines.length - 4} more</span>
            )}
          </div>
          <button onClick={() => setShowCustomize(true)}
            className="text-base text-blue-400 bg-transparent border-none cursor-pointer mt-2 font-semibold">
            Manage machines →
          </button>
        </div>
      )}
    </div>
  );
}
