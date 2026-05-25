import { useState, useMemo } from 'react';
import { formatDateShort, getToday } from '../data/constants';
import { exportAllData, importAllData, load } from '../data/storage';
import { Card, CardTitle, Input, Button, StatBox } from './UI';

function getStreak() {
  let streak = 0;
  const d = new Date();
  // Start from yesterday if today has no food yet, or from today
  for (let i = 0; i < 90; i++) {
    const date = new Date(d);
    date.setDate(d.getDate() - i);
    const key = `daily-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const day = load(key, null);
    if (!day || !day.food || day.food.length === 0) {
      if (i === 0) continue; // skip today if not logged yet
      break;
    }
    streak++;
  }
  return streak;
}

function getWeeklyAverages() {
  const totals = { cal: 0, protein: 0, days: 0 };
  const d = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(d);
    date.setDate(d.getDate() - i);
    const key = `daily-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const day = load(key, null);
    if (day && day.food && day.food.length > 0) {
      totals.cal += day.food.reduce((s, f) => s + (f.cal || 0), 0);
      totals.protein += day.food.reduce((s, f) => s + (f.protein || 0), 0);
      totals.days++;
    }
  }
  if (totals.days === 0) return null;
  return {
    cal: Math.round(totals.cal / totals.days),
    protein: Math.round(totals.protein / totals.days),
    days: totals.days,
  };
}

function getPersonalRecords(liftLog) {
  return Object.values(liftLog).sort((a, b) => (b.weight || 0) - (a.weight || 0));
}

function getWorkoutHistory(days = 45) {
  const history = [];
  const d = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(d);
    date.setDate(d.getDate() - i);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    try {
      const raw = localStorage.getItem(`ft_daily-${dateStr}`);
      if (raw) {
        const dayData = JSON.parse(raw);
        if (dayData.exercises && dayData.exercises.length > 0) {
          const volume = dayData.exercises.reduce((s, e) => s + (e.weight || 0) * (e.sets || 3) * (e.reps || 12), 0);
          history.push({
            dateStr,
            displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            exercises: dayData.exercises,
            volume,
          });
        }
      }
    } catch {}
  }
  return history;
}

function projectGoalDate(weighIns, goalWeight) {
  if (weighIns.length < 2) return null;
  // Use last 4 weigh-ins (or all if fewer) to calculate rate
  const recent = weighIns.slice(-4);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const daysBetween = (new Date(last.date) - new Date(first.date)) / 86400000;
  if (daysBetween <= 0) return null;
  const lbsPerDay = (first.weight - last.weight) / daysBetween;
  if (lbsPerDay <= 0) return null;
  const lbsToGo = last.weight - goalWeight;
  const daysToGoal = Math.round(lbsToGo / lbsPerDay);
  const target = new Date();
  target.setDate(target.getDate() + daysToGoal);
  const lbsPerWeek = (lbsPerDay * 7).toFixed(1);
  return {
    date: target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    daysToGoal,
    lbsPerWeek,
  };
}

function InteractiveChart({ weighIns, startWeight, goalWeight }) {
  const [selected, setSelected] = useState(null);

  if (weighIns.length === 0) {
    return (
      <p className="text-base text-white/40 py-3">
        No weigh-ins yet. Log your first on Wednesday.
      </p>
    );
  }

  const weights = weighIns.map(w => w.weight);
  const min = Math.min(...weights, goalWeight) - 2;
  const max = Math.max(...weights, startWeight) + 2;
  const range = max - min;
  const W = 100;
  const H = 140;

  const getY = (w) => H - ((w - min) / range) * 130 - 5;
  const getX = (i) => weighIns.length === 1 ? W / 2 : (i / (weighIns.length - 1)) * (W - 14) + 7;

  return (
    <>
      {selected !== null && (
        <div className="text-center mb-2">
          <span className="text-lg font-bold">{weighIns[selected].weight} lbs</span>
          <span className="text-base text-white/40 ml-2">{formatDateShort(weighIns[selected].date)}</span>
        </div>
      )}
      <div className="h-36 relative mb-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
          {/* Goal line */}
          <line x1="0" y1={getY(goalWeight)} x2={W} y2={getY(goalWeight)}
            stroke="#22c55e" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
          <text x={W - 1} y={getY(goalWeight) - 3}
            fill="#22c55e" fontSize="5.5" textAnchor="end" opacity="0.7">{goalWeight}</text>

          {/* Start line */}
          <line x1="0" y1={getY(startWeight)} x2={W} y2={getY(startWeight)}
            stroke="#f59e0b" strokeWidth="0.3" strokeDasharray="2,3" opacity="0.3" />

          {/* Data line */}
          {weighIns.map((wi, i) => {
            const x = getX(i);
            const y = getY(wi.weight);
            const prev = i > 0 ? weighIns[i - 1] : null;
            const px = prev ? getX(i - 1) : 0;
            const py = prev ? getY(prev.weight) : 0;
            const isSel = selected === i;

            return (
              <g key={i} onClick={() => setSelected(isSel ? null : i)} style={{ cursor: 'pointer' }}>
                {prev && (
                  <line x1={px} y1={py} x2={x} y2={y} stroke="#3b82f6" strokeWidth="1.5" />
                )}
                <circle cx={x} cy={y} r={isSel ? 4 : 2.5}
                  fill={isSel ? '#60a5fa' : '#3b82f6'}
                  stroke={isSel ? '#fff' : 'none'} strokeWidth="1" />
                {!isSel && (
                  <text x={x} y={y - 5} fill="#f0f0f0" fontSize="5" textAnchor="middle" fontWeight="600">
                    {wi.weight}
                  </text>
                )}
                <text x={x} y={y + 10} fill="rgba(255,255,255,0.35)" fontSize="4" textAnchor="middle">
                  {formatDateShort(wi.date)}
                </text>
                {/* Touch target */}
                <rect x={x - 8} y={y - 12} width="16" height="24" fill="transparent" />
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}

export function StatsTab({ weighIns, addWeighIn, latest, liftLog, startWeight, goalWeight, notify }) {
  const [weightInput, setWeightInput] = useState('');
  const [showDataSettings, setShowDataSettings] = useState(false);
  const [importText, setImportText] = useState('');

  const currentWeight = latest?.weight || startWeight;
  const weightLost = startWeight - currentWeight;
  const weightToGo = currentWeight - goalWeight;

  const streak = useMemo(() => getStreak(), []);
  const weeklyAvg = useMemo(() => getWeeklyAverages(), []);
  const projection = useMemo(() => projectGoalDate(weighIns, goalWeight), [weighIns, goalWeight]);
  const prs = useMemo(() => getPersonalRecords(liftLog), [liftLog]);
  const workoutHistory = useMemo(() => getWorkoutHistory(45), []);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);

  const handleWeighIn = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 100 || w > 400) return;
    addWeighIn(w);
    setWeightInput('');
    notify(`${w} lbs logged`);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Data exported');
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importAllData(importText);
    if (success) {
      notify('Data imported — refresh the page');
      setImportText('');
    } else {
      notify('Import failed — check format');
    }
  };

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Streak + Weekly Summary */}
      <Card>
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-amber-400">{streak}</div>
            <div className="text-base text-white/50">day streak 🔥</div>
          </div>
          <div className="w-px bg-white/[0.08]" />
          {weeklyAvg ? (
            <>
              <div>
                <div className="text-xl font-bold">{weeklyAvg.cal}</div>
                <div className="text-base text-white/50">avg cal/day</div>
              </div>
              <div className="w-px bg-white/[0.08]" />
              <div>
                <div className="text-xl font-bold">{weeklyAvg.protein}g</div>
                <div className="text-base text-white/50">avg protein/day</div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-base text-white/30">Log food to see averages</span>
            </div>
          )}
        </div>
        {weeklyAvg && (
          <p className="text-base text-white/25 text-center mt-2">
            Based on {weeklyAvg.days} day{weeklyAvg.days !== 1 ? 's' : ''} this week
          </p>
        )}
      </Card>

      {/* Weight Chart */}
      <Card>
        <CardTitle>Weight Trend</CardTitle>
        <InteractiveChart weighIns={weighIns} startWeight={startWeight} goalWeight={goalWeight} />

        {/* Weight stats */}
        {weighIns.length > 0 && (
          <div className="flex justify-around">
            <StatBox
              value={`${weightLost > 0 ? '-' : ''}${Math.abs(weightLost).toFixed(1)}`}
              label="lbs lost"
              color={weightLost > 0 ? '#22c55e' : undefined}
            />
            <StatBox value={weightToGo.toFixed(1)} label="lbs to go" />
            <StatBox value={currentWeight} label="current" />
          </div>
        )}
      </Card>

      {/* Projected Goal Date */}
      {projection && (
        <Card>
          <CardTitle>Goal Projection</CardTitle>
          <div className="text-center py-1">
            <div className="text-xl font-bold text-green-400">{projection.date}</div>
            <div className="text-base text-white/40 mt-1">
              at {projection.lbsPerWeek} lbs/week · {projection.daysToGoal} days away
            </div>
          </div>
        </Card>
      )}

      {/* Log Weigh-In */}
      <Card>
        <CardTitle>Log Weigh-In</CardTitle>
        <div className="flex gap-2">
          <Input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            placeholder="Weight (lbs)"
            className="flex-1"
          />
          <Button onClick={handleWeighIn}>Log</Button>
        </div>
        <p className="text-base text-white/40 mt-1.5">Best practice: Wednesday mornings only</p>
      </Card>

      {/* Personal Records */}
      {prs.length > 0 && (
        <Card>
          <CardTitle>Personal Records</CardTitle>
          {prs.map((pr, i) => (
            <div key={i} className="flex justify-between items-center py-2
              border-b border-white/[0.06] last:border-0">
              <div>
                <span className="text-base">{pr.name || pr.key}</span>
                <div className="text-base text-white/30">{formatDateShort(pr.date)}</div>
              </div>
              <div className="text-right">
                <span className="text-base text-blue-400 font-semibold">{pr.weight}lbs</span>
                <div className="text-base text-white/30">{pr.sets}×{pr.reps}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Weigh-In History */}
      {weighIns.length > 0 && (
        <Card>
          <CardTitle>Weigh-In History</CardTitle>
          {[...weighIns].reverse().map((wi, i) => {
            const origIdx = weighIns.length - 1 - i;
            const prev = origIdx > 0 ? weighIns[origIdx - 1] : null;
            const diff = prev ? wi.weight - prev.weight : 0;

            return (
              <div key={i}
                className="flex justify-between py-2 border-b border-white/[0.06] last:border-0">
                <span className="text-base text-white/50">{formatDateShort(wi.date)}</span>
                <span className="text-base">
                  {wi.weight} lbs
                  {diff !== 0 && (
                    <span className={`ml-2 text-base ${diff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      {/* Workout History (Task 7) */}
      {workoutHistory.length > 0 && (
        <Card>
          <CardTitle>Workout History</CardTitle>
          {(showAllWorkouts ? workoutHistory : workoutHistory.slice(0, 5)).map((workout, i) => {
            const prevWorkout = workoutHistory[i + 1];
            const volumeChange = prevWorkout && prevWorkout.volume > 0
              ? Math.round(((workout.volume - prevWorkout.volume) / prevWorkout.volume) * 100)
              : null;
            return (
              <div key={workout.dateStr} className="mb-4 pb-4 border-b border-white/[0.06] last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg font-bold">{workout.displayDate}</div>
                  <div className="text-right">
                    {workout.volume > 0 && (
                      <div className="text-base font-semibold text-white/60">
                        {workout.volume.toLocaleString()} lbs
                      </div>
                    )}
                    {volumeChange !== null && (
                      <div className={`text-base font-semibold ${volumeChange > 0 ? 'text-green-400' : volumeChange < 0 ? 'text-amber-400' : 'text-white/40'}`}>
                        {volumeChange > 0 ? `↑ ${volumeChange}%` : volumeChange < 0 ? `↓ ${Math.abs(volumeChange)}%` : '—'}
                      </div>
                    )}
                  </div>
                </div>
                {workout.exercises.map((ex, j) => (
                  <div key={j} className="flex justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-base text-white/70">{ex.name}</span>
                    <span className="text-base text-white/50">{ex.weight > 0 ? `${ex.weight} lbs × ` : ''}{ex.sets}×{ex.reps}</span>
                  </div>
                ))}
              </div>
            );
          })}
          {workoutHistory.length > 5 && (
            <button onClick={() => setShowAllWorkouts(v => !v)}
              className="w-full text-base text-blue-400 font-semibold bg-transparent border-none cursor-pointer py-2 mt-1">
              {showAllWorkouts ? 'Show less' : `Show all ${workoutHistory.length} workouts`}
            </button>
          )}
        </Card>
      )}

      {/* Data Export */}
      <Card>
        <CardTitle>Export Data</CardTitle>
        <Button onClick={handleExport} variant="ghost" className="w-full mb-2">
          📥 Export All Data (JSON)
        </Button>
        <p className="text-base text-white/30 text-center">
          Download a full backup of all your data
        </p>
      </Card>

      {/* Import */}
      <button
        onClick={() => setShowDataSettings(!showDataSettings)}
        className="w-full rounded-xl h-14 mb-3 text-base text-white/40
          bg-white/[0.03] border border-white/[0.06] cursor-pointer"
      >
        {showDataSettings ? 'Hide Import' : '📤 Import Data'}
      </button>

      {showDataSettings && (
        <Card>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="Paste exported JSON here..."
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl
              p-3 text-base text-white/80 outline-none h-24 resize-none
              placeholder:text-white/25"
          />
          <Button onClick={handleImport} variant="ghost" className="w-full mt-2">
            Import
          </Button>
        </Card>
      )}
    </div>
  );
}
