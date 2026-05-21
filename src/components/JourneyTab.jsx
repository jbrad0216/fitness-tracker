import { useState, useMemo } from 'react';
import { Card, CardTitle } from './UI';
import { load } from '../data/storage';

// Get day data (food logged, workout, water, meditation)
function getDayData(dateStr) {
  try {
    return load(`daily-${dateStr}`, null);
  } catch { return null; }
}

// Calculate streak (days with food logged)
function calcStreak() {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const day = getDayData(dateStr);
    if (!day || !day.food || day.food.length === 0) {
      if (i === 0) continue;
      break;
    }
    streak++;
  }
  return streak;
}

// Get days of current month with status
function getMonthCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const day = getDayData(dateStr);
    const isFuture = d > today.getDate();
    const isToday = d === today.getDate();

    let status = 'none';
    if (!isFuture && day) {
      const hasFood = day.food?.length > 0;
      const hasWorkout = day.exercises?.length > 0;
      const hasWater = day.water >= 2;
      const hasMed = day.meditation;
      const score = [hasFood, hasWorkout, hasWater, hasMed].filter(Boolean).length;
      if (score === 4) status = 'full';
      else if (score >= 2) status = 'partial';
      else if (score >= 1) status = 'minimal';
    }

    days.push({ d, dateStr, status, isFuture, isToday });
  }
  return { days, year, month };
}

// Calculate weekly weight loss data
function getWeeklyProgress(weighIns, startWeight, goalWeight) {
  if (weighIns.length === 0) return null;
  const currentWeight = weighIns[weighIns.length - 1]?.weight || startWeight;
  const lostTotal = startWeight - currentWeight;
  const totalToLose = startWeight - goalWeight;

  // Week calculation based on date of first weigh-in or start
  const firstDate = weighIns[0]?.date ? new Date(weighIns[0].date) : new Date();
  const today = new Date();
  const daysElapsed = Math.max(0, Math.floor((today - firstDate) / 86400000));
  const weeksElapsed = Math.max(1, Math.ceil(daysElapsed / 7));
  const totalWeeks = Math.ceil(totalToLose / 1.1); // ~1.1 lbs/week target

  return {
    currentWeight,
    lostTotal,
    totalToLose,
    weeksElapsed,
    totalWeeks,
    pct: Math.min(1, lostTotal / totalToLose),
  };
}

const MILESTONES = (start, goal) => [
  { label: '5 lbs', weight: start - 5, icon: '🎯' },
  { label: '10 lbs', weight: start - 10, icon: '⭐' },
  { label: 'Halfway', weight: (start + goal) / 2, icon: '🏃' },
  { label: '15 lbs', weight: start - 15, icon: '🏆' },
  { label: 'Goal!', weight: goal, icon: '🎉' },
];

const MOTIVATIONAL = [
  'Consistency beats perfection.',
  'Every rep, every meal, every weigh-in adds up.',
  'The best workout is the one you actually do.',
  'Progress, not perfection.',
  'Small daily improvements lead to stunning results.',
  'You\'re building a habit that will last a lifetime.',
];

export function JourneyTab({ weighIns, startWeight, goalWeight }) {
  const [expandedMilestone, setExpandedMilestone] = useState(null);

  const progress = useMemo(() => getWeeklyProgress(weighIns, startWeight, goalWeight), [weighIns, startWeight, goalWeight]);
  const streak = useMemo(() => calcStreak(), []);
  const { days, year, month } = useMemo(() => getMonthCalendar(), []);
  const milestones = useMemo(() => MILESTONES(startWeight, goalWeight), [startWeight, goalWeight]);
  const motivational = useMemo(() => {
    const idx = new Date().getDate() % MOTIVATIONAL.length;
    return MOTIVATIONAL[idx];
  }, []);

  const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date().getDate();

  const dayOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Motivational Quote */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10
        border border-blue-500/20 px-4 py-3 mb-4">
        <p className="text-sm text-white/70 italic text-center">"{motivational}"</p>
      </div>

      {/* Streak + Summary */}
      <Card>
        <div className="flex justify-around text-center">
          <div>
            <div className="text-3xl font-bold text-amber-400">{streak}</div>
            <div className="text-[11px] text-white/50">day streak 🔥</div>
          </div>
          {progress && (
            <>
              <div className="w-px bg-white/[0.08]" />
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {progress.lostTotal > 0 ? `-${progress.lostTotal.toFixed(1)}` : '0'}
                </div>
                <div className="text-[11px] text-white/50">lbs lost</div>
              </div>
              <div className="w-px bg-white/[0.08]" />
              <div>
                <div className="text-2xl font-bold">{progress.toGo?.toFixed(1) ?? progress.totalToLose?.toFixed(1)}</div>
                <div className="text-[11px] text-white/50">lbs to go</div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Week Timeline */}
      {progress && (
        <Card>
          <CardTitle>Week Progress</CardTitle>
          <div className="flex justify-between text-[11px] text-white/40 mb-1">
            <span>Week {progress.weeksElapsed}</span>
            <span>of ~{progress.totalWeeks} weeks</span>
          </div>

          {/* Progress bar */}
          <div className="relative h-6 bg-white/[0.06] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700"
              style={{ width: `${progress.pct * 100}%` }}
            />
            {/* Milestone markers */}
            {milestones.map((m, i) => {
              const markerPct = (startWeight - m.weight) / (startWeight - goalWeight);
              const reached = progress.currentWeight <= m.weight;
              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 flex items-center justify-center"
                  style={{ left: `${markerPct * 100}%`, transform: 'translateX(-50%)' }}
                >
                  <div className={`w-1 h-full rounded-full ${reached ? 'bg-white' : 'bg-white/20'}`} />
                </div>
              );
            })}
          </div>

          {/* Milestones */}
          <div className="flex flex-col gap-1.5">
            {milestones.map((m, i) => {
              const reached = progress.currentWeight <= m.weight;
              return (
                <div key={i} className={`flex items-center justify-between py-1.5 px-3
                  rounded-xl transition-colors
                  ${reached ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/[0.02]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.icon}</span>
                    <div>
                      <span className={`text-sm font-semibold ${reached ? 'text-green-400' : 'text-white/60'}`}>
                        {m.label}
                      </span>
                      <span className="text-[11px] text-white/30 ml-2">{m.weight} lbs</span>
                    </div>
                  </div>
                  {reached && <span className="text-green-400 text-xs font-bold">✓ Reached!</span>}
                  {!reached && (
                    <span className="text-[11px] text-white/30">
                      {(progress.currentWeight - m.weight).toFixed(1)} lbs away
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Monthly Calendar */}
      <Card>
        <CardTitle>{monthName}</CardTitle>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayOfWeek.map(d => (
            <div key={d} className="text-center text-[10px] text-white/30 font-semibold py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;

            const colors = {
              full: 'bg-green-500 text-white',
              partial: 'bg-amber-500/80 text-white',
              minimal: 'bg-blue-500/50 text-white',
              none: day.isFuture ? 'text-white/15' : 'text-white/30',
            };

            return (
              <div
                key={day.d}
                className={`flex items-center justify-center rounded-lg text-xs font-medium
                  aspect-square
                  ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-[#0f1117]' : ''}
                  ${colors[day.status]}`}
              >
                {day.d}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-3">
          {[
            { color: 'bg-green-500', label: 'All 4' },
            { color: 'bg-amber-500/80', label: '2-3' },
            { color: 'bg-blue-500/50', label: '1' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${l.color}`} />
              <span className="text-[10px] text-white/40">{l.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/25 text-center mt-1">
          Food · Workout · Water · Meditation
        </p>
      </Card>

      {/* Projected completion */}
      {progress && progress.lostTotal > 0 && (
        <Card>
          <CardTitle>Goal Projection</CardTitle>
          <div className="text-center py-1">
            {(() => {
              const recent = weighIns.slice(-4);
              if (recent.length < 2) return <p className="text-xs text-white/40">Need more weigh-ins for projection</p>;
              const first = recent[0];
              const last = recent[recent.length - 1];
              const daysBetween = (new Date(last.date) - new Date(first.date)) / 86400000;
              if (daysBetween <= 0) return null;
              const lbsPerDay = (first.weight - last.weight) / daysBetween;
              if (lbsPerDay <= 0) return <p className="text-xs text-amber-400">No loss trend in recent weigh-ins</p>;
              const lbsToGo = last.weight - goalWeight;
              const daysToGoal = Math.round(lbsToGo / lbsPerDay);
              const target = new Date();
              target.setDate(target.getDate() + daysToGoal);
              const dateStr = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <>
                  <div className="text-xl font-bold text-green-400 mb-1">{dateStr}</div>
                  <div className="text-xs text-white/40">
                    at {(lbsPerDay * 7).toFixed(1)} lbs/week · {daysToGoal} days away
                  </div>
                  <div className="mt-3 text-sm text-white/60">
                    At your current pace, you'll reach {goalWeight} lbs by {dateStr}
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      )}

      {/* No weigh-in data yet */}
      {weighIns.length === 0 && (
        <div className="text-center py-8 text-white/30">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm">Log your first weigh-in on Wednesday to see your journey</p>
        </div>
      )}
    </div>
  );
}
