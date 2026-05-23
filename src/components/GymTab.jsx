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
        <div className="text-[17px] font-semibold">
          {seconds === 0 ? '✓ Rest done!' : running ? 'Rest timer' : 'Paused'}
        </div>
        <div className="text-sm text-white/40">90 second rest</div>
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
    <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}25`, color }}>
      {group}
    </span>
  );
}

function ExerciseCard({ ex, isLogged, prev, onLog, onSwap }) {
  const [expanded, setExpanded] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [weight, setWeight] = useState(String(prev?.weight || ex.defaultWeight));
  const [sets, setSets] = useState(String(ex.sets || 3));
  const [reps, setReps] = useState(String(ex.reps || 12));

  const info = getExerciseInfo(ex.name);
  const isPR = prev && parseFloat(weight) > prev.weight;

  const handleSwapSelect = (altName) => {
    const altInfo = ALTERNATIVE_EXERCISES[altName];
    onSwap(ex.name, { name: altName, sets: altInfo?.sets || ex.sets, reps: altInfo?.reps || ex.reps, defaultWeight: altInfo?.defaultWeight || ex.defaultWeight });
    setShowSwap(false);
    setExpanded(false);
  };

  return (
    <div className={`bg-white/[0.05] border rounded-2xl mb-3 overflow-hidden transition-all
      ${isLogged ? 'border-green-500/30 opacity-80' : 'border-white/[0.08]'}`}>
      <button
        onClick={() => !isLogged && setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isLogged && <span className="text-green-400 text-sm">✓</span>}
            <span className="text-[18px] font-bold leading-tight">{ex.name}</span>
            {info && <MuscleBadge muscleKey={info.muscleKey} group={info.muscleGroup} />}
            {isPR && !isLogged && <span className="text-xs text-green-400 font-bold bg-green-500/15 rounded-full px-2 py-0.5">↑ New PR!</span>}
          </div>
          <div className="text-[15px] font-semibold text-white/70">
            {ex.sets}×{ex.reps} @ {prev ? prev.weight : ex.defaultWeight} lbs
          </div>
          {prev && (
            <div className="text-[13px] text-white/40 mt-0.5">
              Last: {prev.weight}lbs × {prev.sets}×{prev.reps}
            </div>
          )}
        </div>
        {!isLogged && (
          <span className="text-white/30 text-xl mt-1">{expanded ? '▾' : '›'}</span>
        )}
      </button>

      {expanded && !isLogged && (
        <div className="border-t border-white/[0.06] px-4 pb-4">
          {info && (
            <div className="py-3 mb-3 border-b border-white/[0.06]">
              <p className="text-[15px] text-white/70 leading-relaxed mb-3">{info.description}</p>
              {info.tips && (
                <div className="mb-3 space-y-1">
                  {info.tips.slice(0, 2).map((tip, i) => (
                    <div key={i} className="flex gap-2 text-sm text-white/50">
                      <span className="text-green-400 shrink-0">▸</span>{tip}
                    </div>
                  ))}
                </div>
              )}

              {/* Why this exercise */}
              {info.why && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowWhy(w => !w)}
                    className="flex items-center gap-1.5 text-sm text-amber-400 font-semibold
                      bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 w-full text-left cursor-pointer active:opacity-70"
                  >
                    <span>💡</span>
                    <span className="flex-1">Why this exercise?</span>
                    <span className="text-white/30">{showWhy ? '▾' : '›'}</span>
                  </button>
                  {showWhy && (
                    <div className="mt-2 px-3 py-3 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl">
                      <p className="text-[15px] text-white/70 leading-relaxed mb-2">{info.why}</p>
                      {info.benefit && (
                        <p className="text-sm text-amber-400/80"><span className="font-semibold">Benefit:</span> {info.benefit}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Why 3×12 tooltip */}
              <div className="mb-3 px-3 py-2.5 bg-blue-500/[0.07] border border-blue-500/15 rounded-xl">
                <p className="text-sm text-blue-300/80">
                  <span className="font-semibold">Why {ex.sets}×{ex.reps}?</span> This rep range builds muscular endurance and hypertrophy — ideal for the first 4-6 weeks to build form and volume before increasing weight.
                </p>
              </div>

              {info.youtubeUrl && (
                <a href={info.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-red-500/15 border border-red-500/30
                    rounded-xl px-3 py-2.5 text-red-400 text-sm font-semibold no-underline mb-3">
                  <span>▶</span> Watch on YouTube
                </a>
              )}

              {/* Swap exercise */}
              {info.alternatives && info.alternatives.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowSwap(s => !s)}
                    className="flex items-center gap-1.5 text-sm text-white/50 font-semibold
                      bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 w-full text-left cursor-pointer active:opacity-70"
                  >
                    <span>🔄</span>
                    <span className="flex-1">Swap for different exercise</span>
                    <span className="text-white/30">{showSwap ? '▾' : '›'}</span>
                  </button>
                  {showSwap && (
                    <div className="mt-2 space-y-1.5">
                      {info.alternatives.map(alt => (
                        <button
                          key={alt}
                          onClick={() => handleSwapSelect(alt)}
                          className="w-full text-left px-3 py-3.5 bg-white/[0.04] border border-white/[0.08]
                            rounded-xl text-[15px] text-white/70 cursor-pointer active:bg-white/[0.08] active:scale-[0.99] min-h-[52px]"
                        >
                          {alt}
                          {ALTERNATIVE_EXERCISES[alt] && (
                            <span className="text-sm text-white/30 ml-2">
                              {ALTERNATIVE_EXERCISES[alt].muscleGroup}
                            </span>
                          )}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowSwap(false)}
                        className="w-full text-center px-3 py-2 text-[13px] text-white/30
                          bg-transparent border-none cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="text-sm text-white/40 mb-2 uppercase tracking-wider">Log Set</div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <div className="text-sm text-white/40 mb-1">Weight (lbs)</div>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="done"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3
                  text-[17px] font-bold text-white outline-none min-h-[52px]"
              />
            </div>
            <div className="w-20">
              <div className="text-sm text-white/40 mb-1">Sets</div>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="done"
                value={sets}
                onChange={e => setSets(e.target.value)}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3
                  text-[17px] font-bold text-white outline-none min-h-[52px]"
              />
            </div>
            <div className="w-20">
              <div className="text-sm text-white/40 mb-1">Reps</div>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="done"
                value={reps}
                onChange={e => setReps(e.target.value)}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3
                  text-[17px] font-bold text-white outline-none min-h-[52px]"
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

// ─── Weekly Calendar ───
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
      schedType = weekNum % 2 === 0
        ? (idx % 2 === 0 ? 'A' : 'B')
        : (idx % 2 === 0 ? 'B' : 'A');
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

  // Load past day data for selected day
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
        <div className="text-[13px] text-white/40 mb-3">
          Week of {monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="flex justify-between">
          {weekDays.map((day, i) => {
            const { text, color } = schedDisplay(day.schedType);
            const isSelected = selectedIdx === i;
            return (
              <button
                key={i}
                onClick={() => onSelect(isSelected ? null : i)}
                className={`flex flex-col items-center gap-1 py-1 border-none bg-transparent cursor-pointer
                  active:opacity-70 ${day.isFuture ? 'opacity-35' : ''}`}
                style={{ minWidth: '40px' }}
              >
                <span className="text-xs text-white/40 font-medium">{DAY_LABELS[i]}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${day.isToday ? 'bg-blue-500/25 ring-2 ring-blue-400' : 'bg-white/[0.06]'}
                  ${isSelected && !day.isToday ? 'ring-1 ring-white/40' : ''}`}>
                  {!day.isFuture && day.isComplete && !day.isToday ? (
                    <span className="text-green-400 text-base font-bold">✓</span>
                  ) : (
                    <span className="font-bold text-sm" style={{ color }}>{text}</span>
                  )}
                </div>
                {day.isToday && <span className="text-xs text-blue-400 font-medium">today</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4 mb-4">
          <div className="text-[17px] font-semibold mb-1">
            {selectedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          {(selectedDay.schedType === 'A' || selectedDay.schedType === 'B') && (
            <>
              <div className="text-sm text-blue-400 mb-2">Workout {selectedDay.schedType} — Strength</div>
              {(selectedDay.schedType === 'A' ? templates?.A : templates?.B || []).map((ex, i) => (
                <div key={i} className="text-[15px] text-white/60 py-1.5 border-b border-white/[0.06] last:border-0">
                  {ex.name} — {ex.sets}×{ex.reps}
                </div>
              ))}
              {selectedDayData?.exercises?.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-white/40 mb-1 uppercase tracking-wider">Logged:</div>
                  {selectedDayData.exercises.map((e, i) => (
                    <div key={i} className="text-[15px] text-green-400 py-1">
                      ✓ {e.name} — {e.weight}lbs × {e.sets}×{e.reps}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {selectedDay.schedType === 'cardio' && (
            <div className="text-[15px] text-white/60">
              <div className="text-sm text-amber-400 mb-1">Cardio + Mobility Day</div>
              Run + 15 min stretching
              {selectedDayData?.ranMiles > 0 && (
                <div className="text-green-400 mt-2 text-[15px]">✓ {selectedDayData.ranMiles}mi logged</div>
              )}
            </div>
          )}
          {selectedDay.schedType === 'longrun' && (
            <div className="text-[15px] text-white/60">
              <div className="text-sm text-green-400 mb-1">Long Run Day</div>
              Push the distance. Stretch after.
              {selectedDayData?.ranMiles > 0 && (
                <div className="text-green-400 mt-2 text-[15px]">✓ {selectedDayData.ranMiles}mi logged</div>
              )}
            </div>
          )}
          {selectedDay.schedType === 'rest' && (
            <div className="text-[15px] text-white/60">
              <div className="text-sm text-purple-400 mb-1">Rest Day</div>
              Recover. Walk if you feel like it.
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Focus Area Workout Generator ───
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
    { name: 'DB Incline Press', sets: 3, reps: 12, defaultWeight: 25 },
  ],
  back: [
    { name: 'Lat Pulldown', sets: 3, reps: 12, defaultWeight: 85 },
    { name: 'DB Row (each arm)', sets: 3, reps: 12, defaultWeight: 25 },
    { name: 'Seated Cable Row', sets: 3, reps: 12, defaultWeight: 70 },
  ],
  shoulders: [
    { name: 'Overhead Press', sets: 3, reps: 12, defaultWeight: 27.5 },
    { name: 'Lateral Raise', sets: 3, reps: 15, defaultWeight: 12 },
    { name: 'Arnold Press', sets: 3, reps: 12, defaultWeight: 20 },
  ],
  arms: [
    { name: 'DB Curl', sets: 3, reps: 12, defaultWeight: 20 },
    { name: 'Tricep Dip', sets: 3, reps: 12, defaultWeight: 0 },
    { name: 'Hammer Curl', sets: 3, reps: 12, defaultWeight: 20 },
  ],
  quads: [
    { name: 'Goblet Squat', sets: 3, reps: 12, defaultWeight: 30 },
    { name: 'Leg Press', sets: 3, reps: 12, defaultWeight: 90 },
    { name: 'Bulgarian Split Squat', sets: 3, reps: 10, defaultWeight: 20 },
  ],
  hamstrings: [
    { name: 'DB Romanian Deadlift', sets: 3, reps: 12, defaultWeight: 25 },
    { name: 'Leg Curl', sets: 3, reps: 12, defaultWeight: 60 },
    { name: 'Good Morning', sets: 3, reps: 12, defaultWeight: 25 },
  ],
  glutes: [
    { name: 'DB Reverse Lunge (each)', sets: 3, reps: 10, defaultWeight: 20 },
    { name: 'Step-up', sets: 3, reps: 12, defaultWeight: 20 },
    { name: 'Hip Thrust', sets: 3, reps: 12, defaultWeight: 25 },
  ],
  core: [
    { name: 'Plank', sets: 3, reps: 45, defaultWeight: 0 },
    { name: 'Dead Bug', sets: 3, reps: 10, defaultWeight: 0 },
    { name: 'Cable Crunch', sets: 3, reps: 15, defaultWeight: 40 },
  ],
};

function CustomWorkoutModal({ onApply, onClose }) {
  const [selected, setSelected] = useState([]);
  const [generated, setGenerated] = useState(null);

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const generate = () => {
    const exercises = [];
    const usedNames = new Set();
    selected.forEach(area => {
      const pool = FOCUS_EXERCISE_MAP[area] || [];
      pool.slice(0, 2).forEach(ex => {
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
    <div className="fixed inset-0 z-50 bg-[#0f1117]/95 flex flex-col overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-[20px] font-bold">Customize Workout</h2>
        <button onClick={onClose}
          className="w-10 h-10 rounded-xl bg-white/[0.08] text-white/60 border-none cursor-pointer text-lg flex items-center justify-center">
          ✕
        </button>
      </div>

      {!generated ? (
        <div className="px-4">
          <p className="text-[14px] text-white/50 mb-4">Select 2-3 focus areas for today's workout:</p>
          {groups.map(grp => (
            <div key={grp} className="mb-4">
              <div className="text-[12px] text-white/40 uppercase tracking-wider mb-2">{grp}</div>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.filter(a => a.group === grp).map(area => (
                  <button
                    key={area.id}
                    onClick={() => toggle(area.id)}
                    className={`px-4 py-3 rounded-2xl text-[15px] font-semibold border cursor-pointer active:scale-95 transition-all
                      ${selected.includes(area.id)
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'bg-white/[0.06] border-white/[0.1] text-white/60'}`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={generate}
            disabled={selected.length < 2}
            className="w-full bg-blue-500 text-white rounded-2xl py-4 text-[17px] font-bold
              border-none cursor-pointer active:opacity-80 mt-2 disabled:opacity-40"
          >
            Generate Workout ({selected.length}/3 areas)
          </button>
        </div>
      ) : (
        <div className="px-4">
          <p className="text-[14px] text-white/50 mb-3">Custom workout for today:</p>
          {generated.map((ex, i) => (
            <div key={i} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-2">
              <div className="text-[16px] font-bold">{ex.name}</div>
              <div className="text-[13px] text-white/50">{ex.sets}×{ex.reps} @ {ex.defaultWeight} lbs</div>
            </div>
          ))}
          <button
            onClick={() => {
              const today = getToday();
              localStorage.setItem(`ft_custom-workout-${today}`, JSON.stringify(generated));
              onApply(generated);
            }}
            className="w-full bg-green-500 text-white rounded-2xl py-4 text-[17px] font-bold
              border-none cursor-pointer active:opacity-80 mt-2"
          >
            Apply This Workout Today
          </button>
          <button
            onClick={() => setGenerated(null)}
            className="w-full bg-white/[0.08] text-white/50 rounded-2xl py-3 text-[15px]
              border-none cursor-pointer mt-2"
          >
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

function saveOverrides(overrides) {
  localStorage.setItem(getWeekKey(), JSON.stringify(overrides));
}

export function GymTab({ daily, addRun, addExercise, removeExercise, getLastLift, logLift, templates, notify }) {
  const [showTimer, setShowTimer] = useState(false);
  const [runInput, setRunInput] = useState('');
  const [showRunInput, setShowRunInput] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showSkipMenu, setShowSkipMenu] = useState(false);
  const [overrides, setOverrides] = useState(loadOverrides);
  const [customWorkout, setCustomWorkout] = useState(() => {
    try {
      const today = getToday();
      const raw = localStorage.getItem(`ft_custom-workout-${today}`);
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
      // Reschedule: move to next available day (just mark today as rescheduled)
      next[todayKey] = 'rescheduled';
      // Find next non-rest day
      const today = new Date();
      let checkDay = new Date(today);
      checkDay.setDate(today.getDate() + 1);
      let found = false;
      for (let i = 0; i < 6 && !found; i++) {
        const d = checkDay.getDay();
        const dStr = `${checkDay.getFullYear()}-${String(checkDay.getMonth() + 1).padStart(2, '0')}-${String(checkDay.getDate()).padStart(2, '0')}`;
        if (d !== 0) { // not Sunday
          next[dStr] = `moved-${workoutType || 'A'}`;
          found = true;
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

  const getEffectiveExercise = (ex) => {
    if (swaps[ex.name]) return { ...ex, ...swaps[ex.name] };
    return ex;
  };

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

  const activeExercises = customWorkout || exercises;
  const allDone = (schedule === 'strength' || !!customWorkout) && activeExercises.length > 0 &&
    activeExercises.every(ex => daily.exercises.some(e => e.name === ex.name));

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
        <div className={`text-[18px] font-bold ${schedColor}`}>
          {customWorkout ? '🎯 Custom Workout' : schedLabel}
        </div>
        <div className="flex gap-2">
          {(schedule === 'strength' || customWorkout) && !todayOverride && !allDone && (
            <button
              onClick={() => setShowSkipMenu(s => !s)}
              className="text-sm text-white/40 font-semibold bg-white/[0.05] border border-white/[0.08]
                rounded-xl px-3 py-2 cursor-pointer active:opacity-70 min-h-[44px]"
            >
              Skip
            </button>
          )}
          <button
            onClick={() => setShowCustomize(true)}
            className="text-sm text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/20
              rounded-xl px-3 py-2 cursor-pointer active:opacity-70 min-h-[44px]"
          >
            Customize
          </button>
        </div>
      </div>
      <div className="text-sm text-white/40 mb-4 flex items-center gap-2">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        {customWorkout && (
          <button
            onClick={() => { localStorage.removeItem(`ft_custom-workout-${getToday()}`); setCustomWorkout(null); }}
            className="text-[12px] text-white/30 bg-transparent border-none cursor-pointer"
          >
            (reset to schedule)
          </button>
        )}
      </div>

      {/* Weekly calendar — Task 3 */}
      <WeekCalendar selectedIdx={selectedDayIdx} onSelect={setSelectedDayIdx} templates={templates} />

      {showTimer && <RestTimer onDismiss={() => setShowTimer(false)} />}

      {/* Cardio / run logging */}
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4 mb-4">
        <div className="text-[15px] font-semibold mb-3">🏃 Run</div>
        {daily.ranMiles > 0 ? (
          <div className="text-green-400 text-base font-semibold">✓ {daily.ranMiles} miles today</div>
        ) : showRunInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
              value={runInput}
              onChange={e => setRunInput(e.target.value)}
              placeholder="Miles"
              className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 py-3
                text-[17px] text-white outline-none min-h-[52px] placeholder:text-white/30"
            />
            <button onClick={handleLogRun}
              className="bg-green-500 text-white rounded-xl px-5 py-3 text-base font-bold border-none cursor-pointer active:scale-95">
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

      {/* Skip today menu */}
      {showSkipMenu && (
        <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl px-4 py-4 mb-4">
          <div className="text-[15px] font-semibold mb-3">Skip today's workout?</div>
          <div className="space-y-2">
            <button
              onClick={() => handleSkipToday('reschedule')}
              className="w-full bg-blue-500/15 border border-blue-500/30 text-blue-300 rounded-xl
                py-3.5 text-[15px] font-semibold cursor-pointer active:opacity-70 text-left px-4"
            >
              📅 Reschedule to tomorrow
            </button>
            <button
              onClick={() => handleSkipToday('skip')}
              className="w-full bg-white/[0.06] border border-white/[0.08] text-white/50 rounded-xl
                py-3.5 text-[15px] font-semibold cursor-pointer active:opacity-70 text-left px-4"
            >
              ⏭ Skip entirely — continue schedule
            </button>
            <button
              onClick={() => setShowSkipMenu(false)}
              className="w-full bg-transparent border-none text-white/30 py-2 cursor-pointer text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Skipped/rescheduled indicator */}
      {todayOverride === 'skipped' && (
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">—</span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-white/50">Workout skipped today</div>
            <div className="text-[12px] text-white/30">Schedule continues normally tomorrow.</div>
          </div>
          <button onClick={() => { const n = {...overrides}; delete n[todayKey]; setOverrides(n); saveOverrides(n); }}
            className="text-[12px] text-blue-400 bg-transparent border-none cursor-pointer">Undo</button>
        </div>
      )}
      {todayOverride === 'rescheduled' && (
        <div className="bg-blue-500/[0.08] border border-blue-500/20 rounded-2xl px-4 py-3 mb-4">
          <div className="text-[17px] font-semibold text-blue-300">Workout rescheduled to tomorrow</div>
          <div className="text-sm text-white/40 mt-0.5">Rest today. Tomorrow's workout is moved up.</div>
        </div>
      )}

      {/* Strength workout — regular or custom */}
      {(schedule === 'strength' || customWorkout) && activeExercises.length > 0 && !todayOverride && (
        <div>
          {/* Workout summary card */}
          {!allDone && !customWorkout && (
            <div className="bg-blue-500/[0.07] border border-blue-500/15 rounded-2xl px-4 py-4 mb-4">
              <div className="text-[18px] font-bold mb-1">
                {workoutType === 'A' ? 'Workout A — Push & Squat' : 'Workout B — Pull & Hinge'}
              </div>
              <div className="text-[15px] text-white/60 leading-relaxed">
                {workoutType === 'A'
                  ? 'Targets chest, shoulders, quads, and triceps. Compound pushing movements plus lower body for balanced strength.'
                  : 'Targets back, hamstrings, glutes, and biceps. Pulling movements and hip hinges to balance your pushing muscles.'}
              </div>
              <div className="text-sm text-blue-300/70 mt-2">
                💡 A/B split hits each muscle group 2–3× per week — optimal for strength gains while running.
              </div>
            </div>
          )}
          {allDone && (
            <div className="text-center py-4 text-green-400 text-lg font-bold mb-4">
              🎉 Workout Complete!
            </div>
          )}
          {activeExercises.map((ex, i) => {
            const effective = getEffectiveExercise(ex);
            const prev = getLastLift(effective.name);
            const isLogged = daily.exercises.some(e => e.name === effective.name);
            return (
              <ExerciseCard
                key={i}
                ex={effective}
                isLogged={isLogged}
                prev={prev}
                onLog={handleLog}
                onSwap={handleSwap}
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
          <div className="text-sm text-white/40 mb-2 uppercase tracking-wider">Logged today</div>
          {daily.exercises.map(e => (
            <div key={e.id} className="flex items-center py-3 border-b border-white/[0.06] last:border-0">
              <span className="text-green-400 mr-3 text-[17px]">✓</span>
              <span className="text-[17px] flex-1">{e.name}</span>
              <span className="text-sm text-white/40 mr-3">{e.weight}lbs × {e.sets}×{e.reps}</span>
              <button onClick={() => removeExercise(e.id)}
                className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 border-none cursor-pointer text-sm active:scale-95">
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
