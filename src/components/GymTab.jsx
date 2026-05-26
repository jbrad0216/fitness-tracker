import { useState, useEffect, useRef } from 'react';
import { getTodaysWorkoutType, getDaySchedule, getToday } from '../data/constants';
import { getExerciseInfo, MUSCLE_COLORS, ALTERNATIVE_EXERCISES } from '../data/exercises';

const EQUIPMENT_KEY = 'ft_equipment-setup';
const SWAPS_KEY = () => `ft_exercise-swaps-${getToday()}`;

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

// ─── Per-Set Exercise Card (Task 4) ───
function ExerciseCard({ ex, isLogged, loggedData, prev, onLog, onSwap, onUnlog, goal }) {
  const numSets = ex.sets || 3;

  // Pre-fill weight: last session + 2.5 if they completed all reps, else last weight, else default
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
  const allDone = completedCount >= numSets;

  const weightDiff = prev ? (parseFloat(weight) - prev.weight) : 0;
  const progressText = prev
    ? (weightDiff > 0
      ? `↑ +${weightDiff.toFixed(1)} lbs — getting stronger!`
      : weightDiff < 0
        ? `↓ ${Math.abs(weightDiff).toFixed(1)} lbs lighter today — that's OK`
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

  // Collapsed state after logging
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
      {/* Header */}
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
            <div className="text-base text-white/40">
              {completedCount}/{numSets} sets
            </div>
          </div>
        </div>

        {/* Recommended weight */}
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

      {/* "How To" expandable */}
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

      {/* Weight / Reps inputs */}
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

      {/* Per-set DONE buttons */}
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

      {/* Swap exercise */}
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

const EQUIPMENT_GROUPS = [
  {
    group: 'FREE WEIGHTS',
    items: [
      { id: 'dumbbells', label: 'Dumbbells' },
      { id: 'barbell', label: 'Barbell' },
      { id: 'kettlebells', label: 'Kettlebells' },
      { id: 'medicineBalls', label: 'Medicine Balls' },
    ],
  },
  {
    group: 'MACHINES',
    items: [
      { id: 'latPulldown', label: 'Lat Pulldown' },
      { id: 'legPress', label: 'Leg Press' },
      { id: 'cableMachine', label: 'Cable Machine' },
      { id: 'smithMachine', label: 'Smith Machine' },
      { id: 'chestPress', label: 'Chest Press' },
      { id: 'shoulderPress', label: 'Shoulder Press' },
      { id: 'legCurl', label: 'Leg Curl' },
      { id: 'legExtension', label: 'Leg Extension' },
      { id: 'seatedRow', label: 'Seated Row' },
      { id: 'hipAbductor', label: 'Hip Abductor' },
      { id: 'pecFly', label: 'Pec Fly' },
      { id: 'calfRaise', label: 'Calf Raise Machine' },
    ],
  },
  {
    group: 'CARDIO',
    items: [
      { id: 'treadmill', label: 'Treadmill' },
      { id: 'rowingMachine', label: 'Rowing Machine' },
      { id: 'elliptical', label: 'Elliptical' },
      { id: 'stationaryBike', label: 'Stationary Bike' },
    ],
  },
  {
    group: 'OTHER',
    items: [
      { id: 'pullupBar', label: 'Pull-up Bar' },
      { id: 'bench', label: 'Bench' },
      { id: 'resistanceBands', label: 'Resistance Bands' },
      { id: 'trx', label: 'TRX / Suspension' },
    ],
  },
];

const FULL_GYM_DEFAULTS = {
  dumbbells: true, barbell: true, kettlebells: true, medicineBalls: false,
  latPulldown: true, legPress: true, cableMachine: true, smithMachine: true,
  chestPress: true, shoulderPress: true, legCurl: true, legExtension: true,
  seatedRow: true, hipAbductor: false, pecFly: true, calfRaise: false,
  treadmill: true, rowingMachine: true, elliptical: false, stationaryBike: false,
  pullupBar: true, bench: true, resistanceBands: false, trx: false,
};

const HOME_GYM_DEFAULTS = {
  dumbbells: true, barbell: false, kettlebells: false, medicineBalls: false,
  latPulldown: false, legPress: false, cableMachine: false, smithMachine: false,
  chestPress: false, shoulderPress: false, legCurl: false, legExtension: false,
  seatedRow: false, hipAbductor: false, pecFly: false, calfRaise: false,
  treadmill: false, rowingMachine: false, elliptical: false, stationaryBike: false,
  pullupBar: true, bench: true, resistanceBands: true, trx: false,
};

const EMPTY_EQUIPMENT = Object.fromEntries(
  EQUIPMENT_GROUPS.flatMap(g => g.items.map(i => [i.id, false]))
);

function AddCustomMachineForm({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('Chest');
  const [weight, setWeight] = useState('');

  const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Calves'];

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117]/95 flex flex-col justify-end"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
      <div className="bg-[#1a1d27] rounded-t-3xl px-5 pt-5 pb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">Add Custom Machine</h3>
          <button onClick={onClose}
            className="w-12 h-12 rounded-xl bg-white/[0.08] text-white/60 border-none cursor-pointer text-xl">
            ×
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-base text-white/50 mb-1.5">Machine Name</div>
            <input type="text" inputMode="text" autoComplete="off"
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Hammer Strength Incline"
              className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-lg text-white
                outline-none placeholder:text-white/25 focus:border-blue-500/60" />
          </div>
          <div>
            <div className="text-base text-white/50 mb-1.5">Muscle Group</div>
            <div className="flex flex-wrap gap-2">
              {MUSCLES.map(m => (
                <button key={m} onClick={() => setMuscle(m)}
                  className={`h-12 px-4 rounded-xl text-base font-semibold border-none cursor-pointer
                    ${muscle === m ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-white/50'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-base text-white/50 mb-1.5">Current Weight (lbs)</div>
            <input type="text" inputMode="numeric" autoComplete="off"
              value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 90"
              className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-lg text-white
                outline-none placeholder:text-white/25 focus:border-blue-500/60" />
          </div>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onAdd({ id: `custom-${Date.now()}`, label: name.trim(), muscle, weight: parseFloat(weight) || 0, isCustom: true });
              onClose();
            }}
            className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80">
            ADD MACHINE
          </button>
        </div>
      </div>
    </div>
  );
}

function EquipmentSetup({ onSave }) {
  const [step, setStep] = useState('quick'); // 'quick' | 'full'
  const [equipment, setEquipment] = useState(EMPTY_EQUIPMENT);
  const [customMachines, setCustomMachines] = useState([]);
  const [showAddMachine, setShowAddMachine] = useState(false);

  const toggle = (id) => setEquipment(e => ({ ...e, [id]: !e[id] }));

  const applyPreset = (preset) => {
    setEquipment(preset);
    setStep('full');
  };

  if (step === 'quick') {
    return (
      <div className="px-4 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>
        <h2 className="text-2xl font-bold mb-2">Gym Setup</h2>
        <p className="text-base text-white/50 mb-6">What equipment do you have access to?</p>
        {[
          { id: 'full', label: '🏋️ Full Gym', desc: 'Machines, cables, barbells, everything' },
          { id: 'home', label: '🏠 Home Setup', desc: 'Dumbbells, bench, pull-up bar, bands' },
          { id: 'custom', label: '⚙️ Choose My Own', desc: 'Select exactly what you have' },
        ].map(opt => (
          <button key={opt.id} onClick={() => {
            if (opt.id === 'full') applyPreset(FULL_GYM_DEFAULTS);
            else if (opt.id === 'home') applyPreset(HOME_GYM_DEFAULTS);
            else setStep('full');
          }}
            className="w-full flex items-center gap-4 bg-white/[0.05] border border-white/[0.08]
              rounded-2xl px-5 py-5 mb-3 cursor-pointer active:bg-white/[0.08] text-left min-h-[80px]">
            <span className="text-3xl">{opt.label.split(' ')[0]}</span>
            <div>
              <div className="text-lg font-semibold">{opt.label.replace(/^\S+\s/, '')}</div>
              <div className="text-base text-white/50">{opt.desc}</div>
            </div>
            <span className="text-white/30 text-2xl ml-auto">›</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 overflow-y-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      {showAddMachine && (
        <AddCustomMachineForm
          onAdd={(machine) => setCustomMachines(prev => [...prev, machine])}
          onClose={() => setShowAddMachine(false)}
        />
      )}

      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setStep('quick')}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-xl border-none cursor-pointer
            flex items-center justify-center">
          ‹
        </button>
        <h2 className="text-2xl font-bold">My Equipment</h2>
      </div>
      <p className="text-base text-white/50 mb-5">Select everything available to you:</p>

      {EQUIPMENT_GROUPS.map(grp => (
        <div key={grp.group} className="mb-5">
          <div className="text-base font-bold text-white/40 uppercase tracking-wider mb-2">{grp.group}</div>
          <div className="grid grid-cols-2 gap-2">
            {grp.items.map(item => (
              <button key={item.id} onClick={() => toggle(item.id)}
                className={`flex items-center gap-2 rounded-xl px-4 h-14 border-solid border cursor-pointer text-left
                  ${equipment[item.id]
                    ? 'bg-blue-500/20 border-blue-500/50 text-white'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/50'}`}>
                <span className="text-lg">{equipment[item.id] ? '✓' : '○'}</span>
                <span className="text-base font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Custom machines */}
      {customMachines.length > 0 && (
        <div className="mb-5">
          <div className="text-base font-bold text-white/40 uppercase tracking-wider mb-2">CUSTOM MACHINES</div>
          {customMachines.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30
              rounded-xl px-4 h-14 mb-2">
              <span className="text-lg text-blue-400">✓</span>
              <div className="flex-1">
                <div className="text-base font-semibold">{m.label}</div>
                <div className="text-base text-white/40">{m.muscle}{m.weight ? ` · ${m.weight} lbs` : ''}</div>
              </div>
              <button onClick={() => setCustomMachines(prev => prev.filter(x => x.id !== m.id))}
                className="w-12 h-12 rounded-lg bg-red-500/15 text-red-400 text-base border-none cursor-pointer
                  flex items-center justify-center">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowAddMachine(true)}
        className="w-full bg-white/[0.06] border border-white/[0.1] border-solid text-white/70
          rounded-2xl h-14 text-base font-semibold cursor-pointer active:opacity-70 mb-5">
        + Add Custom Machine
      </button>

      <button onClick={() => onSave({ access: 'custom', equipment, customMachines })}
        className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80">
        SAVE EQUIPMENT
      </button>
    </div>
  );
}

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

// ─── Custom Workout Modal ───
const FOCUS_AREAS = [
  { id: 'chest', label: 'Chest', group: 'Upper' },
  { id: 'back', label: 'Back', group: 'Upper' },
  { id: 'shoulders', label: 'Shoulders', group: 'Upper' },
  { id: 'arms', label: 'Arms', group: 'Upper' },
  { id: 'quads', label: 'Quads', group: 'Lower' },
  { id: 'hamstrings', label: 'Hamstrings', group: 'Lower' },
  { id: 'glutes', label: 'Glutes', group: 'Lower' },
  { id: 'core', label: 'Core', group: 'Core' },
];

const FOCUS_EXERCISE_MAP = {
  chest: [
    { name: 'DB Bench Press', sets: 3, reps: 12, defaultWeight: 30 },
    { name: 'Push-up', sets: 3, reps: 15, defaultWeight: 0 },
  ],
  back: [
    { name: 'Lat Pulldown', sets: 3, reps: 12, defaultWeight: 85 },
    { name: 'DB Row (each arm)', sets: 3, reps: 12, defaultWeight: 25 },
  ],
  shoulders: [
    { name: 'Overhead Press', sets: 3, reps: 12, defaultWeight: 27.5 },
    { name: 'Lateral Raise', sets: 3, reps: 15, defaultWeight: 12 },
  ],
  arms: [
    { name: 'DB Curl', sets: 3, reps: 12, defaultWeight: 20 },
    { name: 'Tricep Dip', sets: 3, reps: 12, defaultWeight: 0 },
  ],
  quads: [
    { name: 'Goblet Squat', sets: 3, reps: 12, defaultWeight: 30 },
    { name: 'Bulgarian Split Squat', sets: 3, reps: 10, defaultWeight: 20 },
  ],
  hamstrings: [
    { name: 'DB Romanian Deadlift', sets: 3, reps: 12, defaultWeight: 25 },
    { name: 'Leg Curl', sets: 3, reps: 12, defaultWeight: 60 },
  ],
  glutes: [
    { name: 'DB Reverse Lunge (each)', sets: 3, reps: 10, defaultWeight: 20 },
    { name: 'Hip Thrust', sets: 3, reps: 12, defaultWeight: 25 },
  ],
  core: [
    { name: 'Plank', sets: 3, reps: 45, defaultWeight: 0 },
    { name: 'Dead Bug', sets: 3, reps: 10, defaultWeight: 0 },
  ],
};

function CustomWorkoutModal({ onApply, onClose }) {
  const [selected, setSelected] = useState([]);
  const [generated, setGenerated] = useState(null);

  const toggle = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );

  const generate = () => {
    const exercises = [];
    const usedNames = new Set();
    selected.forEach(area => {
      (FOCUS_EXERCISE_MAP[area] || []).slice(0, 2).forEach(ex => {
        if (!usedNames.has(ex.name)) {
          exercises.push(ex);
          usedNames.add(ex.name);
        }
      });
    });
    setGenerated(exercises.slice(0, 5));
  };

  const groups = ['Upper', 'Lower', 'Core'];

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117]/98 flex flex-col overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-2xl font-bold">Customize Workout</h2>
        <button onClick={onClose}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-white/60 border-none cursor-pointer text-xl flex items-center justify-center">
          ✕
        </button>
      </div>

      {!generated ? (
        <div className="px-4">
          <p className="text-base text-white/50 mb-5">Select 2–3 focus areas:</p>
          {groups.map(grp => (
            <div key={grp} className="mb-5">
              <div className="text-base text-white/40 font-bold uppercase mb-3">{grp}</div>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.filter(a => a.group === grp).map(area => (
                  <button key={area.id} onClick={() => toggle(area.id)}
                    className={`h-14 px-5 rounded-2xl text-base font-bold border cursor-pointer active:scale-95 transition-all
                      ${selected.includes(area.id)
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'bg-white/[0.06] border-white/[0.1] text-white/60'}`}
                    style={{ borderStyle: 'solid' }}>
                    {area.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={generate} disabled={selected.length < 2}
            className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold
              border-none cursor-pointer active:opacity-80 mt-2 disabled:opacity-40">
            Generate Workout ({selected.length}/3 areas)
          </button>
        </div>
      ) : (
        <div className="px-4">
          <p className="text-base text-white/50 mb-3">Custom workout for today:</p>
          {generated.map((ex, i) => (
            <div key={i} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-3">
              <div className="text-xl font-bold">{ex.name}</div>
              <div className="text-base text-white/50">{ex.sets}×{ex.reps} @ {ex.defaultWeight} lbs</div>
            </div>
          ))}
          <button onClick={() => { localStorage.setItem(`ft_custom-workout-${getToday()}`, JSON.stringify(generated)); onApply(generated); }}
            className="w-full bg-green-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80 mt-2">
            Apply This Workout Today
          </button>
          <button onClick={() => setGenerated(null)}
            className="w-full bg-white/[0.08] text-white/50 rounded-2xl h-12 text-base border-none cursor-pointer mt-2">
            Try Different Areas
          </button>
        </div>
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

// ─── Workout Completion Summary ───
function WorkoutCompletionSummary({ exercises, workoutType, startTime }) {
  const totalVolume = exercises.reduce((sum, e) => sum + (e.weight || 0) * (e.sets || 3) * (e.reps || 12), 0);
  const minutes = startTime ? Math.round((Date.now() - startTime) / 60000) : null;

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
    </div>
  );
}

export function GymTab({ daily, addRun, addExercise, removeExercise, getLastLift, logLift, templates, notify, goal }) {
  const [showTimer, setShowTimer] = useState(false);
  const [runInput, setRunInput] = useState('');
  const [showRunInput, setShowRunInput] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showSkipMenu, setShowSkipMenu] = useState(false);
  const [overrides, setOverrides] = useState(loadOverrides);
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

  const equipmentSetup = (() => {
    try { return JSON.parse(localStorage.getItem(EQUIPMENT_KEY) || ''); } catch { return null; }
  })();

  const schedule = getDaySchedule();
  const workoutType = getTodaysWorkoutType();
  const exercises = workoutType === 'A' ? (templates?.A || []) : workoutType === 'B' ? (templates?.B || []) : [];

  if (!equipmentSetup) {
    return (
      <EquipmentSetup onSave={(setup) => {
        localStorage.setItem(EQUIPMENT_KEY, JSON.stringify(setup));
        window.location.reload();
      }} />
    );
  }

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

  const handleLogRun = () => {
    const miles = parseFloat(runInput);
    if (!miles || miles <= 0) return;
    addRun(miles);
    setRunInput('');
    setShowRunInput(false);
    notify(`${miles}mi logged`);
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
    <div className="px-4 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      {showCustomize && (
        <CustomWorkoutModal
          onApply={(workout) => { setCustomWorkout(workout); setShowCustomize(false); }}
          onClose={() => setShowCustomize(false)}
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
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4">
        <div className="text-lg font-semibold mb-3">🏃 Run</div>
        {daily.ranMiles > 0 ? (
          <div className="text-green-400 text-lg font-semibold">✓ {daily.ranMiles} miles today</div>
        ) : showRunInput ? (
          <div className="flex gap-2">
            <input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done"
              value={runInput} onChange={e => setRunInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogRun()}
              placeholder="Miles"
              className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-xl text-white outline-none placeholder:text-white/30" />
            <button onClick={handleLogRun}
              className="bg-green-500 text-white rounded-xl px-6 h-14 text-base font-bold border-none cursor-pointer active:scale-95">
              Log
            </button>
            <button onClick={() => setShowRunInput(false)}
              className="bg-white/[0.08] text-white/50 rounded-xl px-4 h-14 border-none cursor-pointer text-base">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => setShowRunInput(true)}
            className="w-full bg-white/[0.08] text-white/60 rounded-xl h-14 text-base font-semibold border-none cursor-pointer active:opacity-70">
            + Log Run
          </button>
        )}
      </div>

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

      {/* Equipment reset */}
      <div className="mt-6 text-center">
        <button onClick={() => { localStorage.removeItem(EQUIPMENT_KEY); window.location.reload(); }}
          className="text-base text-white/25 bg-transparent border-none cursor-pointer">
          Change equipment setup
        </button>
      </div>
    </div>
  );
}
