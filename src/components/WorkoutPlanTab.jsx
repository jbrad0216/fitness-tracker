import { useState } from 'react';

const PHASE_CONFIG = [
  { phase: 1, label: 'Phase 1: Foundation', weeks: '1-4', setsReps: '3×12', desc: 'Build form, start light, establish consistency.' },
  { phase: 2, label: 'Phase 2: Building', weeks: '5-8', setsReps: '3×10', desc: 'Increase weight 5-10%, raise intensity.' },
  { phase: 3, label: 'Phase 3: Push', weeks: '9-12', setsReps: '4×8', desc: 'Heavier loads, add exercises, peak effort.' },
];

function getLongRunMiles(weekNum) {
  if (weekNum <= 2) return 2.5;
  if (weekNum <= 4) return 3;
  if (weekNum <= 6) return 3.5;
  return 4;
}

function getPhase(weekNum) {
  if (weekNum <= 4) return 1;
  if (weekNum <= 8) return 2;
  return 3;
}

function getPhaseLabel(weekNum) {
  const p = getPhase(weekNum);
  return PHASE_CONFIG[p - 1];
}

function getWeekAB(weekOffset) {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const baseWeek = Math.floor((today - startOfYear) / 604800000);
  const wk = (baseWeek + weekOffset) % 2;
  // Mon/Wed/Fri pattern: even week = A/B/A, odd = B/A/B
  return wk === 0 ? ['A', 'B', 'A'] : ['B', 'A', 'B'];
}

function getWeekStartDate(weekOffset) {
  const today = new Date();
  const dow = today.getDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday + weekOffset * 7);
  return monday;
}

function formatWeekRange(weekOffset) {
  const mon = getWeekStartDate(weekOffset);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${mon.toLocaleDateString('en-US', opts)} – ${sun.toLocaleDateString('en-US', opts)}`;
}

function getDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDayData(date) {
  try {
    const raw = localStorage.getItem(`ft_daily-${getDateStr(date)}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function WeekRow({ weekNum, weekOffset, projectedGoalWeek }) {
  const [expanded, setExpanded] = useState(weekOffset === 0);
  const mon = getWeekStartDate(weekOffset);
  const abPattern = getWeekAB(weekOffset);
  const phaseInfo = getPhaseLabel(weekNum);
  const longRunMiles = getLongRunMiles(weekNum);
  const isCurrentWeek = weekOffset === 0;
  const isPast = weekOffset < 0;
  const isGoalWeek = weekNum === projectedGoalWeek;

  const days = [
    { label: 'Mon', offset: 0, type: 'strength', detail: `Workout ${abPattern[0]} (${phaseInfo.setsReps})` },
    { label: 'Tue', offset: 1, type: 'cardio', detail: 'Cardio + Mobility' },
    { label: 'Wed', offset: 2, type: 'strength', detail: `Workout ${abPattern[1]} (${phaseInfo.setsReps})` },
    { label: 'Thu', offset: 3, type: 'cardio', detail: 'Cardio' },
    { label: 'Fri', offset: 4, type: 'strength', detail: `Workout ${abPattern[2]} (${phaseInfo.setsReps})` },
    { label: 'Sat', offset: 5, type: 'longrun', detail: `Long Run (${longRunMiles} mi)` },
    { label: 'Sun', offset: 6, type: 'rest', detail: 'Rest' },
  ];

  const typeColor = (type) => {
    if (type === 'strength') return 'text-blue-400';
    if (type === 'cardio') return 'text-amber-400';
    if (type === 'longrun') return 'text-green-400';
    return 'text-purple-400';
  };

  const getDayComplete = (dayOffset) => {
    const date = new Date(mon);
    date.setDate(mon.getDate() + dayOffset);
    if (date > new Date()) return false;
    const data = getDayData(date);
    if (!data) return false;
    const t = days[dayOffset].type;
    if (t === 'rest') return true;
    if (t === 'cardio' || t === 'longrun') return (data.ranMiles || 0) > 0;
    return Array.isArray(data.exercises) && data.exercises.length > 0;
  };

  return (
    <div className={`border rounded-2xl mb-3 overflow-hidden
      ${isCurrentWeek ? 'border-blue-500/40 bg-blue-500/[0.04]' : isPast ? 'border-white/[0.06] opacity-60' : 'border-white/[0.08]'}
      ${isGoalWeek ? 'border-amber-500/40 bg-amber-500/[0.04]' : ''}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[16px] font-bold">
              Week {weekNum}
              {isCurrentWeek && <span className="ml-2 text-[12px] text-blue-400 font-semibold bg-blue-500/15 rounded-full px-2 py-0.5">Current</span>}
              {isGoalWeek && <span className="ml-2 text-[12px] text-amber-400 font-semibold">🎯 Projected Goal</span>}
            </span>
          </div>
          <div className="text-[12px] text-white/40 mt-0.5">{formatWeekRange(weekOffset)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[12px] text-white/50">{phaseInfo.label.split(':')[0]}</div>
          <div className="text-[11px] text-white/30">{phaseInfo.setsReps}</div>
        </div>
        <span className="text-white/30 text-lg ml-1">{expanded ? '▾' : '›'}</span>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="text-[12px] text-white/40 mb-2 italic">{phaseInfo.desc}</div>
          {days.map((day, i) => {
            const isDone = getDayComplete(i);
            const dayDate = new Date(mon);
            dayDate.setDate(mon.getDate() + i);
            const isToday = dayDate.toDateString() === new Date().toDateString();
            return (
              <div key={day.label} className={`flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0
                ${isToday ? 'bg-blue-500/[0.06] -mx-4 px-4 rounded' : ''}`}>
                <span className={`text-[13px] font-semibold w-8 shrink-0 ${isToday ? 'text-blue-400' : 'text-white/40'}`}>
                  {day.label}
                </span>
                <span className={`text-[13px] flex-1 ${typeColor(day.type)}`}>{day.detail}</span>
                {isDone && <span className="text-green-400 text-sm">✓</span>}
                {isToday && !isDone && <span className="text-blue-400 text-[11px] font-semibold">today</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WorkoutPlanTab({ weighIns, startWeight, goalWeight }) {
  const [planWeeks, setPlanWeeks] = useState(12);

  // Calculate projected goal week based on weight loss rate
  const sortedWeighIns = [...(weighIns || [])].sort((a, b) => a.date.localeCompare(b.date));
  let projectedGoalWeek = planWeeks;
  if (sortedWeighIns.length >= 2) {
    const first = sortedWeighIns[0];
    const last = sortedWeighIns[sortedWeighIns.length - 1];
    const weeksElapsed = (new Date(last.date) - new Date(first.date)) / (7 * 86400000) || 1;
    const lbsPerWeek = (first.weight - last.weight) / weeksElapsed;
    const lbsLeft = (last.weight || startWeight || 221) - (goalWeight || 200);
    if (lbsPerWeek > 0) {
      projectedGoalWeek = Math.ceil(lbsLeft / lbsPerWeek);
    }
  } else if (startWeight && goalWeight) {
    const lbsLeft = startWeight - goalWeight;
    projectedGoalWeek = Math.ceil(lbsLeft / 1.1);
  }
  projectedGoalWeek = Math.min(projectedGoalWeek, planWeeks);

  // Build plan starting from a reference "week 1" (this week = week 1)

  const weeks = Array.from({ length: planWeeks }, (_, i) => ({
    weekNum: i + 1,
    weekOffset: i,
  }));

  const lbsToGo = (sortedWeighIns.length > 0 ? sortedWeighIns[sortedWeighIns.length - 1].weight : startWeight || 221) - (goalWeight || 200);

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <h2 className="text-[22px] font-bold mb-1">Full Workout Plan</h2>
      <p className="text-[13px] text-white/40 mb-4">
        {lbsToGo > 0 ? `${lbsToGo.toFixed(1)} lbs to goal · ` : ''}
        ~{projectedGoalWeek} weeks projected
      </p>

      {/* Phase overview */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {PHASE_CONFIG.map(p => (
          <div key={p.phase} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-3 py-3 text-center">
            <div className="text-[11px] text-white/40 mb-1">Wks {p.weeks}</div>
            <div className="text-[13px] font-bold text-blue-400">{p.setsReps}</div>
            <div className="text-[11px] text-white/50 mt-1">Phase {p.phase}</div>
          </div>
        ))}
      </div>

      {/* Plan length selector */}
      <div className="flex gap-2 mb-4">
        {[6, 9, 12].map(w => (
          <button
            key={w}
            onClick={() => setPlanWeeks(w)}
            className={`flex-1 py-2.5 rounded-xl text-[14px] font-semibold border cursor-pointer
              ${planWeeks === w ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/[0.06] border-white/[0.1] text-white/60'}`}
          >
            {w} wks
          </button>
        ))}
      </div>

      {/* Saturday long run progression */}
      <div className="bg-green-500/[0.06] border border-green-500/20 rounded-2xl px-4 py-3 mb-4">
        <div className="text-[13px] font-semibold text-green-400 mb-2">Saturday Long Run Progression</div>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { label: 'Wk 1-2', miles: '2.5 mi' },
            { label: 'Wk 3-4', miles: '3 mi' },
            { label: 'Wk 5-6', miles: '3.5 mi' },
            { label: 'Wk 7+', miles: '4 mi' },
          ].map(r => (
            <div key={r.label} className="bg-green-500/10 rounded-xl py-2">
              <div className="text-[11px] text-white/40">{r.label}</div>
              <div className="text-[13px] font-bold text-green-300">{r.miles}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Week by week */}
      {weeks.map(({ weekNum, weekOffset }) => (
        <WeekRow
          key={weekNum}
          weekNum={weekNum}
          weekOffset={weekOffset}
          projectedGoalWeek={projectedGoalWeek}
        />
      ))}
    </div>
  );
}
