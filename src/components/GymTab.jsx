import { useState, useEffect, useRef, useCallback } from 'react';
import { getTodaysWorkoutType, getDaySchedule } from '../data/constants';
import { Card, CardTitle, Input, Button, Label } from './UI';
import { getExerciseInfo, MUSCLE_COLORS } from '../data/exercises';

const STRETCH_SUGGESTIONS = [
  'Hip flexor stretch — 60s each side',
  'Hamstring stretch — 45s each side',
  'Pigeon pose — 60s each side',
  'Thoracic rotation — 10 reps each side',
  'Calf stretch — 45s each side',
  'Doorway chest opener — 60s',
  'Cat-cow — 10 slow reps',
  'Ankle circles — 10 each direction',
];

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

  const reset = () => { setSeconds(90); setRunning(true); };
  const toggle = () => setRunning(r => !r);

  const pct = seconds / 90;
  const color = seconds <= 10 ? '#ef4444' : seconds <= 30 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-3 mb-3 border border-white/[0.08]">
      <div className="relative w-12 h-12 shrink-0">
        <svg width="48" height="48" className="-rotate-90">
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-bold" style={{ color }}>{seconds}s</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">
          {seconds === 0 ? '✓ Rest complete!' : running ? 'Rest timer' : 'Paused'}
        </div>
        <div className="text-[11px] text-white/40">90 second rest</div>
      </div>
      <div className="flex gap-1.5">
        <button onClick={toggle}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-sm border-none cursor-pointer text-white/70">
          {running ? '⏸' : '▶'}
        </button>
        <button onClick={reset}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-sm border-none cursor-pointer text-white/70">
          ↺
        </button>
        <button onClick={onDismiss}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-sm border-none cursor-pointer text-white/40">
          ✕
        </button>
      </div>
    </div>
  );
}

function WorkoutDuration({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;
  const mins = Math.floor(elapsed / 60);
  return (
    <div className="text-center text-[11px] text-white/30 mb-2">
      Workout in progress · {mins} min
    </div>
  );
}

function OverloadBadge({ current, previous }) {
  if (!previous || !current) return null;
  const curr = parseFloat(current);
  const prev = parseFloat(previous);
  if (isNaN(curr) || isNaN(prev)) return null;
  if (curr > prev) return <span className="text-[10px] text-green-400 font-bold ml-1">▲ PR</span>;
  if (curr < prev) return <span className="text-[10px] text-red-400 ml-1">▼</span>;
  return <span className="text-[10px] text-amber-400 ml-1">= same</span>;
}

function MuscleBadge({ group, muscleKey }) {
  const color = MUSCLE_COLORS[muscleKey] || '#6b7280';
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: `${color}25`, color }}
    >
      {group}
    </span>
  );
}

function ExerciseInfoPanel({ name, onClose }) {
  const info = getExerciseInfo(name);
  if (!info) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.06] animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <MuscleBadge group={info.muscleGroup} muscleKey={info.muscleKey} />
        <button onClick={onClose}
          className="text-white/30 bg-transparent border-none cursor-pointer text-sm">✕</button>
      </div>

      {/* SVG Illustration */}
      <div className="flex justify-center mb-3">
        <div
          className="w-20 h-20 opacity-80"
          dangerouslySetInnerHTML={{ __html: info.svgIllustration }}
        />
      </div>

      <p className="text-[13px] text-white/70 leading-relaxed mb-3">{info.description}</p>

      {info.tips && (
        <ul className="mb-3">
          {info.tips.map((tip, i) => (
            <li key={i} className="flex items-center gap-2 text-[12px] text-white/50 py-0.5">
              <span className="text-green-400 text-[10px]">▸</span>{tip}
            </li>
          ))}
        </ul>
      )}

      {info.youtubeUrl && (
        <a
          href={info.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-red-500/15 border border-red-500/30
            rounded-xl px-3 py-2.5 text-red-400 text-sm font-semibold no-underline
            active:opacity-70"
        >
          <span className="text-base">▶</span>
          Watch tutorial on YouTube
        </a>
      )}
    </div>
  );
}

export function GymTab({ daily, addRun, addExercise, removeExercise, getLastLift, logLift, templates, notify }) {
  const [runInput, setRunInput] = useState('');
  const [exForm, setExForm] = useState({ name: '', weight: '', sets: '3', reps: '12' });
  const [activeLog, setActiveLog] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [workoutStart, setWorkoutStart] = useState(null);
  const [infoPanel, setInfoPanel] = useState(null); // exercise name

  const schedule = getDaySchedule();
  const workoutType = getTodaysWorkoutType();
  const exercises = workoutType === 'A' ? (templates?.A || []) : workoutType === 'B' ? (templates?.B || []) : [];

  // Start workout clock on first exercise log
  useEffect(() => {
    if (daily.exercises.length > 0 && !workoutStart) {
      setWorkoutStart(Date.now());
    }
  }, [daily.exercises.length, workoutStart]);

  const handleLogRun = () => {
    const miles = parseFloat(runInput);
    if (!miles || miles <= 0) return;
    addRun(miles);
    setRunInput('');
    notify(`${miles}mi logged`);
  };

  const handleLogExercise = (name, weight, sets, reps) => {
    addExercise({ name, weight: parseFloat(weight) || 0, sets: parseInt(sets) || 3, reps: parseInt(reps) || 12 });
    logLift(name, parseFloat(weight) || 0, parseInt(sets) || 3, parseInt(reps) || 12);
    setActiveLog(null);
    setExForm({ name: '', weight: '', sets: '3', reps: '12' });
    setShowTimer(true);
    notify(`${name} logged`);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleCustomLog = () => {
    if (!exForm.name) return;
    handleLogExercise(exForm.name, exForm.weight, exForm.sets, exForm.reps);
  };

  const handleCompleteWorkout = () => {
    const remaining = exercises.filter(ex => !daily.exercises.some(e => e.name === ex.name));
    remaining.forEach(ex => {
      const prev = getLastLift(ex.name);
      const weight = prev ? prev.weight : ex.defaultWeight;
      addExercise({ name: ex.name, weight, sets: ex.sets, reps: ex.reps });
      logLift(ex.name, weight, ex.sets, ex.reps);
    });
    if (remaining.length > 0) {
      notify(`Completed ${remaining.length} remaining exercises`);
    } else {
      notify('All exercises already logged');
    }
  };

  const scheduleLabels = {
    strength: { text: `Strength Day · Workout ${workoutType}`, color: 'text-blue-400' },
    cardio: { text: 'Cardio + Mobility Day', color: 'text-amber-400' },
    longrun: { text: 'Long Run Day', color: 'text-green-400' },
    rest: { text: 'Rest Day', color: 'text-purple-400' },
  };

  const { text: schedLabel, color: schedColor } = scheduleLabels[schedule];
  const allDone = schedule === 'strength' && exercises.length > 0 &&
    exercises.every(ex => daily.exercises.some(e => e.name === ex.name));

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Schedule Badge */}
      <div className={`text-center text-sm font-semibold mb-2 ${schedColor}`}>
        {schedLabel}
      </div>

      {/* Workout Duration */}
      <WorkoutDuration startTime={workoutStart} />

      {/* Rest Timer */}
      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}

      {/* Run Logger */}
      <Card>
        <CardTitle>Cardio</CardTitle>
        {daily.ranMiles > 0 ? (
          <div className="text-green-400 text-sm font-semibold py-1">
            ✓ {daily.ranMiles} miles today
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              type="number"
              value={runInput}
              onChange={e => setRunInput(e.target.value)}
              placeholder="Miles"
              step="0.1"
              className="flex-1"
            />
            <Button variant="success" onClick={handleLogRun}>Log Run</Button>
          </div>
        )}
      </Card>

      {/* Prescribed Workout */}
      {schedule === 'strength' && workoutType && (
        <Card>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-semibold">Workout {workoutType}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">3×12, rest 90s</span>
              {!allDone && (
                <button
                  onClick={handleCompleteWorkout}
                  className="text-xs px-2 py-1 rounded-lg bg-green-500/15 text-green-400
                    border-none cursor-pointer active:bg-green-500/25"
                >
                  Complete All
                </button>
              )}
            </div>
          </div>
          {allDone && (
            <div className="text-center py-2 text-green-400 text-sm font-semibold">
              ✓ Workout complete!
            </div>
          )}
          {exercises.map((ex, i) => {
            const prev = getLastLift(ex.name);
            const isLogged = daily.exercises.some(e => e.name === ex.name);
            const isActive = activeLog === ex.name;

            return (
              <div key={i} className={`py-3 border-b border-white/[0.06] last:border-0
                ${isLogged ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isLogged && <span className="text-green-400 text-xs">✓</span>}
                      <span className="text-sm font-medium">{ex.name}</span>
                      {getExerciseInfo(ex.name) && (
                        <MuscleBadge
                          group={getExerciseInfo(ex.name).muscleGroup}
                          muscleKey={getExerciseInfo(ex.name).muscleKey}
                        />
                      )}
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      {prev
                        ? <>Last: {prev.weight}lbs × {prev.sets}×{prev.reps}</>
                        : `Target: ${ex.defaultWeight}lbs × ${ex.sets}×${ex.reps}`
                      }
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {getExerciseInfo(ex.name) && (
                      <button
                        onClick={() => setInfoPanel(infoPanel === ex.name ? null : ex.name)}
                        className="text-[11px] px-2 py-1.5 rounded-lg bg-white/[0.05]
                          text-white/40 border-none cursor-pointer active:opacity-70"
                        title="How to"
                      >
                        ℹ
                      </button>
                    )}
                    {!isLogged && (
                      <Button
                        onClick={() => {
                          if (isActive) {
                            setActiveLog(null);
                          } else {
                            setActiveLog(ex.name);
                            setExForm({
                              name: ex.name,
                              weight: prev ? String(prev.weight) : String(ex.defaultWeight),
                              sets: String(ex.sets),
                              reps: String(ex.reps),
                            });
                          }
                        }}
                        variant={isActive ? 'ghost' : 'primary'}
                        className="text-xs px-3 py-2"
                      >
                        {isActive ? 'Cancel' : 'Log'}
                      </Button>
                    )}
                  </div>
                </div>
                {/* Info Panel */}
                {infoPanel === ex.name && (
                  <ExerciseInfoPanel name={ex.name} onClose={() => setInfoPanel(null)} />
                )}

                {/* Inline log form */}
                {isActive && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Label>Weight</Label>
                          <OverloadBadge current={exForm.weight} previous={prev?.weight} />
                        </div>
                        <Input
                          type="number"
                          value={exForm.weight}
                          onChange={e => setExForm({ ...exForm, weight: e.target.value })}
                          step="2.5"
                        />
                      </div>
                      <div className="w-16">
                        <Label>Sets</Label>
                        <Input
                          type="number"
                          value={exForm.sets}
                          onChange={e => setExForm({ ...exForm, sets: e.target.value })}
                        />
                      </div>
                      <div className="w-16">
                        <Label>Reps</Label>
                        <Input
                          type="number"
                          value={exForm.reps}
                          onChange={e => setExForm({ ...exForm, reps: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleLogExercise(ex.name, exForm.weight, exForm.sets, exForm.reps)}
                      className="w-full"
                    >
                      Save {ex.name}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* Non-strength day suggestions */}
      {schedule !== 'strength' && (
        <Card>
          {schedule === 'rest' && (
            <div className="text-center py-3 text-sm text-white/50">
              Rest day. Recover. Walk if you feel like it.
            </div>
          )}
          {schedule === 'longrun' && (
            <div className="text-center py-3 text-sm text-white/50">
              Long run day. Push the distance. Stretch after.
            </div>
          )}
          {schedule === 'cardio' && (
            <>
              <CardTitle>Stretch & Mobility</CardTitle>
              <p className="text-xs text-white/40 mb-3">15 min after your run:</p>
              {STRETCH_SUGGESTIONS.map((s, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.06] last:border-0">
                  <span className="text-white/20 text-xs">{i + 1}.</span>
                  <span className="text-sm text-white/70">{s}</span>
                </div>
              ))}
            </>
          )}
        </Card>
      )}

      {/* Manual Exercise Entry */}
      <Card>
        <CardTitle>Custom Exercise</CardTitle>
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            value={exForm.name}
            onChange={e => setExForm({ ...exForm, name: e.target.value })}
            placeholder="Exercise name"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                value={exForm.weight}
                onChange={e => setExForm({ ...exForm, weight: e.target.value })}
                placeholder="0"
                step="2.5"
              />
            </div>
            <div className="w-16">
              <Label>Sets</Label>
              <Input
                type="number"
                value={exForm.sets}
                onChange={e => setExForm({ ...exForm, sets: e.target.value })}
                placeholder="3"
              />
            </div>
            <div className="w-16">
              <Label>Reps</Label>
              <Input
                type="number"
                value={exForm.reps}
                onChange={e => setExForm({ ...exForm, reps: e.target.value })}
                placeholder="12"
              />
            </div>
          </div>
          <Button onClick={handleCustomLog} className="w-full">Log Exercise</Button>
        </div>
      </Card>

      {/* Logged Exercises */}
      {daily.exercises.length > 0 && (
        <Card>
          <CardTitle>Logged Today</CardTitle>
          {daily.exercises.map(e => (
            <div key={e.id} className="flex justify-between items-center py-2
              border-b border-white/[0.06] last:border-0">
              <div className="text-[13px]">
                <span className="font-semibold">{e.name}</span>
                <span className="text-white/50"> — {e.weight}lbs × {e.sets}×{e.reps}</span>
              </div>
              <button
                onClick={() => removeExercise(e.id)}
                className="w-7 h-7 rounded-md bg-red-500/15 text-red-400 border-none
                  cursor-pointer text-sm flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
