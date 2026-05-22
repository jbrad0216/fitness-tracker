import { useState, useEffect, useRef } from 'react';
import { getTodaysWorkoutType, getDaySchedule } from '../data/constants';
import { getExerciseInfo, MUSCLE_COLORS } from '../data/exercises';

const EQUIPMENT_KEY = 'ft_equipment-setup';

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
    <div className="flex items-center gap-4 bg-white/[0.06] border border-white/[0.1] rounded-2xl px-4 py-3 mb-4">
      <div className="relative w-14 h-14 shrink-0">
        <svg width="56" height="56" className="-rotate-90">
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{seconds}s</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-base font-semibold">
          {seconds === 0 ? '✓ Rest done!' : running ? 'Rest timer' : 'Paused'}
        </div>
        <div className="text-xs text-white/40">90 second rest</div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)}
          className="w-10 h-10 rounded-xl bg-white/[0.06] text-base border-none cursor-pointer text-white/70">
          {running ? '⏸' : '▶'}
        </button>
        <button onClick={onDismiss}
          className="w-10 h-10 rounded-xl bg-white/[0.06] text-base border-none cursor-pointer text-white/40">
          ✕
        </button>
      </div>
    </div>
  );
}

function MuscleBadge({ muscleKey, group }) {
  const color = MUSCLE_COLORS[muscleKey] || '#6b7280';
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}25`, color }}>
      {group}
    </span>
  );
}

function ExerciseCard({ ex, isLogged, prev, onLog, showTimer }) {
  const [expanded, setExpanded] = useState(false);
  const [weight, setWeight] = useState(String(prev?.weight || ex.defaultWeight));
  const [sets, setSets] = useState(String(ex.sets || 3));
  const [reps, setReps] = useState(String(ex.reps || 12));

  const info = getExerciseInfo(ex.name);
  const isPR = prev && parseFloat(weight) > prev.weight;

  return (
    <div className={`bg-white/[0.05] border rounded-2xl mb-3 overflow-hidden transition-all
      ${isLogged ? 'border-green-500/30 opacity-80' : 'border-white/[0.08]'}`}>
      {/* Card header — always visible */}
      <button
        onClick={() => !isLogged && setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isLogged && <span className="text-green-400 text-sm">✓</span>}
            <span className="text-[18px] font-bold leading-tight">{ex.name}</span>
            {info && <MuscleBadge muscleKey={info.muscleKey} group={info.muscleGroup} />}
            {isPR && !isLogged && <span className="text-[11px] text-green-400 font-bold bg-green-500/15 rounded-full px-2 py-0.5">↑ New PR!</span>}
          </div>
          <div className="text-[15px] font-semibold text-white/70">
            {ex.sets}×{ex.reps} @ {prev ? prev.weight : ex.defaultWeight} lbs
          </div>
          {prev && (
            <div className="text-[12px] text-white/40 mt-0.5">
              Last: {prev.weight}lbs × {prev.sets}×{prev.reps}
            </div>
          )}
        </div>
        {!isLogged && (
          <span className="text-white/30 text-xl mt-1">{expanded ? '▾' : '›'}</span>
        )}
      </button>

      {/* Expanded detail panel */}
      {expanded && !isLogged && (
        <div className="border-t border-white/[0.06] px-4 pb-4">
          {/* Exercise info */}
          {info && (
            <div className="py-3 mb-3 border-b border-white/[0.06]">
              <p className="text-[14px] text-white/70 leading-relaxed mb-3">{info.description}</p>
              {info.tips && (
                <div className="mb-3 space-y-1">
                  {info.tips.slice(0, 2).map((tip, i) => (
                    <div key={i} className="flex gap-2 text-[13px] text-white/50">
                      <span className="text-green-400 shrink-0">▸</span>{tip}
                    </div>
                  ))}
                </div>
              )}
              {info.youtubeUrl && (
                <a href={info.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-red-500/15 border border-red-500/30
                    rounded-xl px-3 py-2.5 text-red-400 text-sm font-semibold no-underline">
                  <span>▶</span> Watch on YouTube
                </a>
              )}
            </div>
          )}

          {/* Log set form */}
          <div className="text-[13px] text-white/40 mb-2 uppercase tracking-wider">Log Set</div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <div className="text-[12px] text-white/40 mb-1">Weight (lbs)</div>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                step="2.5"
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3
                  text-[17px] font-bold text-white outline-none"
              />
            </div>
            <div className="w-20">
              <div className="text-[12px] text-white/40 mb-1">Sets</div>
<input
                type="number"
                value={sets}
                onChange={e => setSets(e.target.value)}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3
                  text-[17px] font-bold text-white outline-none"
              />
            </div>
            <div className="w-20">
              <div className="text-[12px] text-white/40 mb-1">Reps</div>
              <input
                type="number"
                value={reps}
                onChange={e => setReps(e.target.value)}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3
                  text-[17px] font-bold text-white outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => onLog(ex.name, parseFloat(weight) || 0, parseInt(sets) || 3, parseInt(reps) || 12)}
            className="w-full bg-blue-500 text-white rounded-2xl py-4 text-[17px] font-bold
              border-none cursor-pointer active:opacity-80"
          >
            ✓ Log {ex.name}
          </button>
        </div>
      )}
    </div>
  );
}

function EquipmentSetup({ onSave }) {
  const [access, setAccess] = useState(null);
  const [equipment, setEquipment] = useState({
    dumbbells: true,
    barbell: false,
    pullupBar: false,
    bench: true,
    cables: false,
    resistanceBands: false,
  });

  if (!access) {
    return (
      <div className="px-4 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>
        <h2 className="text-2xl font-bold mb-2">Gym Setup</h2>
        <p className="text-white/50 text-base mb-6">What equipment do you have access to?</p>
        {[
          { id: 'full', label: '🏋️ Full Gym', desc: 'Cables, machines, barbells, everything' },
          { id: 'home', label: '🏠 Home Setup', desc: 'Dumbbells, bench, pull-up bar' },
          { id: 'limited', label: '🎽 Minimal', desc: 'Select what you have below' },
        ].map(opt => (
          <button key={opt.id} onClick={() => {
            if (opt.id === 'full') {
              onSave({ access: 'full', equipment: { dumbbells: true, barbell: true, pullupBar: true, bench: true, cables: true } });
            } else if (opt.id === 'home') {
              onSave({ access: 'home', equipment: { dumbbells: true, pullupBar: true, bench: true } });
            } else {
              setAccess('limited');
            }
          }}
            className="w-full flex items-center gap-4 bg-white/[0.05] border border-white/[0.08]
              rounded-2xl px-5 py-5 mb-3 cursor-pointer active:bg-white/[0.08] text-left"
          >
            <span className="text-3xl">{opt.label.split(' ')[0]}</span>
            <div>
              <div className="text-[17px] font-semibold">{opt.label.replace(/^\S+\s/, '')}</div>
              <div className="text-sm text-white/50">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  const equipItems = [
    { id: 'dumbbells', label: 'Dumbbells' },
    { id: 'barbell', label: 'Barbell & Rack' },
    { id: 'pullupBar', label: 'Pull-up Bar' },
    { id: 'bench', label: 'Bench' },
    { id: 'cables', label: 'Cable Machine' },
    { id: 'resistanceBands', label: 'Resistance Bands' },
  ];

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>
      <h2 className="text-2xl font-bold mb-2">Your Equipment</h2>
      <p className="text-white/50 text-sm mb-5">Select what you have access to:</p>
      <div className="space-y-2 mb-6">
        {equipItems.map(item => (
          <button key={item.id}
            onClick={() => setEquipment(e => ({ ...e, [item.id]: !e[item.id] }))}
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-4 border cursor-pointer text-left
              ${equipment[item.id]
                ? 'bg-blue-500/20 border-blue-500/50 text-white'
                : 'bg-white/[0.04] border-white/[0.08] text-white/50'}`}
          >
            <span className="text-xl">{equipment[item.id] ? '✓' : '○'}</span>
            <span className="text-[16px] font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => onSave({ access: 'limited', equipment })}
        className="w-full bg-blue-500 text-white rounded-2xl py-4 text-[17px] font-bold
          border-none cursor-pointer"
      >
        Save & Continue
      </button>
    </div>
  );
}

export function GymTab({ daily, addRun, addExercise, removeExercise, getLastLift, logLift, templates, notify }) {
  const [showTimer, setShowTimer] = useState(false);
  const [runInput, setRunInput] = useState('');
  const [showRunInput, setShowRunInput] = useState(false);

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

  const handleLog = (name, weight, sets, reps) => {
    addExercise({ name, weight, sets, reps });
    logLift(name, weight, sets, reps);
    setShowTimer(true);
    notify(`${name} logged`);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleLogRun = () => {
    const miles = parseFloat(runInput);
    if (!miles || miles <= 0) return;
    addRun(miles);
    setRunInput('');
    setShowRunInput(false);
    notify(`${miles}mi logged`);
  };

  const scheduleLabels = {
    strength: { text: `Workout ${workoutType} — Strength`, color: 'text-blue-400' },
    cardio: { text: 'Cardio + Mobility Day', color: 'text-amber-400' },
    longrun: { text: 'Long Run Day', color: 'text-green-400' },
    rest: { text: 'Rest Day — Recover', color: 'text-purple-400' },
  };
  const { text: schedLabel, color: schedColor } = scheduleLabels[schedule] || scheduleLabels.rest;

  const allDone = schedule === 'strength' && exercises.length > 0 &&
    exercises.every(ex => daily.exercises.some(e => e.name === ex.name));

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      {/* Header */}
      <div className={`text-[17px] font-bold mb-1 ${schedColor}`}>{schedLabel}</div>
      <div className="text-[13px] text-white/40 mb-4">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>

      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}

      {/* Cardio / run logging */}
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4 mb-4">
        <div className="text-[15px] font-semibold mb-3">🏃 Run</div>
        {daily.ranMiles > 0 ? (
          <div className="text-green-400 text-base font-semibold">✓ {daily.ranMiles} miles today</div>
        ) : showRunInput ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={runInput}
              onChange={e => setRunInput(e.target.value)}
              placeholder="Miles"
              step="0.1"
              className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 py-3
                text-[17px] text-white outline-none"
            />
            <button onClick={handleLogRun}
              className="bg-green-500 text-white rounded-xl px-5 py-3 text-base font-bold border-none cursor-pointer">
              Log
            </button>
            <button onClick={() => setShowRunInput(false)}
              className="bg-white/[0.08] text-white/50 rounded-xl px-4 py-3 border-none cursor-pointer">
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowRunInput(true)}
            className="w-full bg-white/[0.08] text-white/60 rounded-xl py-4 text-base font-semibold
              border-none cursor-pointer active:opacity-70"
          >
            + Log Run
          </button>
        )}
      </div>

      {/* Strength workout */}
      {schedule === 'strength' && workoutType && (
        <div>
          {allDone && (
            <div className="text-center py-4 text-green-400 text-lg font-bold mb-4">
              🎉 Workout Complete!
            </div>
          )}
          {exercises.map((ex, i) => {
            const prev = getLastLift(ex.name);
            const isLogged = daily.exercises.some(e => e.name === ex.name);
            return (
              <ExerciseCard
                key={i}
                ex={ex}
                isLogged={isLogged}
                prev={prev}
                onLog={handleLog}
                showTimer={showTimer}
              />
            );
          })}
        </div>
      )}

      {/* Non-strength day messages */}
      {schedule !== 'strength' && (
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-5 text-center">
          {schedule === 'rest' && <p className="text-base text-white/50">Rest day. Recover. Walk if you feel like it.</p>}
          {schedule === 'longrun' && <p className="text-base text-white/50">Long run day. Push the distance. Stretch after.</p>}
          {schedule === 'cardio' && <p className="text-base text-white/50">Cardio + mobility day. Run + 15 min stretching.</p>}
        </div>
      )}

      {/* Logged exercises summary */}
      {daily.exercises.length > 0 && (
        <div className="mt-4">
          <div className="text-[13px] text-white/40 mb-2 uppercase tracking-wider">Logged today</div>
          {daily.exercises.map(e => (
            <div key={e.id} className="flex items-center py-2.5 border-b border-white/[0.06] last:border-0">
              <span className="text-green-400 mr-3 text-sm">✓</span>
              <span className="text-[15px] flex-1">{e.name}</span>
              <span className="text-[13px] text-white/40 mr-3">{e.weight}lbs × {e.sets}×{e.reps}</span>
              <button onClick={() => removeExercise(e.id)}
                className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 border-none cursor-pointer text-sm">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Equipment reset link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => { localStorage.removeItem(EQUIPMENT_KEY); window.location.reload(); }}
          className="text-[12px] text-white/25 bg-transparent border-none cursor-pointer"
        >
          Change equipment setup
        </button>
      </div>
    </div>
  );
}
