import { useState, useMemo } from 'react';
import { Card, CardTitle } from './UI';
import { load } from '../data/storage';

function getDayData(dateStr) {
  try { return load(`daily-${dateStr}`, null); } catch { return null; }
}

// Streak: consecutive days with any food logged
function calcStreakData() {
  let current = 0;
  let best = 0;
  let temp = 0;
  const today = new Date();
  const last14 = [];

  // Last 14 days status
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const day = getDayData(dateStr);
    const isFuture = i < 0;
    const hasFood = !isFuture && day?.food?.length > 0;
    const hasWorkout = !isFuture && (day?.exercises?.length > 0 || day?.ranMiles > 0);
    const hasWater = !isFuture && (day?.water || 0) >= 2;
    const score = [hasFood, hasWorkout, hasWater].filter(Boolean).length;
    const status = isFuture ? 'future' : !day ? 'empty' : score === 3 ? 'full' : score >= 1 ? 'partial' : 'empty';
    last14.push({ dateStr, status, dayNum: d.getDate() });
  }

  // Current streak (from today backwards)
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const day = getDayData(dateStr);
    if (!day || !day.food || day.food.length === 0) {
      if (i === 0) continue;
      break;
    }
    current++;
  }

  // Best streak
  let run = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const day = getDayData(dateStr);
    if (day?.food?.length > 0) { run++; best = Math.max(best, run); }
    else run = 0;
  }

  return { current, best, last14 };
}

// Weekly summaries — last 4 weeks
function getWeeklySummaries(weighIns) {
  const today = new Date();
  const summaries = [];

  for (let w = 0; w < 4; w++) {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - w * 7);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);

    let totalCal = 0;
    let totalProtein = 0;
    let daysLogged = 0;
    let workoutsCompleted = 0;

    for (let d = 0; d < 7; d++) {
      const dd = new Date(startDate);
      dd.setDate(startDate.getDate() + d);
      const dateStr = dd.toISOString().split('T')[0];
      const day = getDayData(dateStr);
      if (day?.food?.length > 0) {
        daysLogged++;
        totalCal += day.food.reduce((s, f) => s + (f.cal || 0), 0);
        totalProtein += day.food.reduce((s, f) => s + (f.protein || 0), 0);
      }
      if (day?.exercises?.length > 0) workoutsCompleted++;
    }

    // Weight change for this week
    const weekStart = startDate.toISOString().split('T')[0];
    const weekEnd = endDate.toISOString().split('T')[0];
    const startW = weighIns.find(w => w.date >= weekStart && w.date <= weekEnd);
    const endW = [...weighIns].reverse().find(w => w.date >= weekStart && w.date <= weekEnd);
    const weightChange = startW && endW && startW !== endW ? endW.weight - startW.weight : null;

    summaries.push({
      weekLabel: w === 0 ? 'This Week' : w === 1 ? 'Last Week' : `${w} Weeks Ago`,
      dateRange: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      avgCal: daysLogged > 0 ? Math.round(totalCal / daysLogged) : 0,
      avgProtein: daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0,
      daysLogged,
      workoutsCompleted,
      weightChange,
      isCurrent: w === 0,
    });
  }
  return summaries;
}

// Monthly calendar
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
      const hasWorkout = day.exercises?.length > 0 || day.ranMiles > 0;
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

// SVG weight graph
function WeightGraph({ weighIns, goalWeight, startWeight }) {
  if (weighIns.length < 2) {
    return (
      <div className="text-center py-6 text-white/30 text-base">
        Log at least 2 weigh-ins to see your graph
      </div>
    );
  }

  const pts = [...weighIns].slice(-12); // last 12 weigh-ins
  const weights = pts.map(p => p.weight);
  const allWeights = [...weights, goalWeight, startWeight];
  const minW = Math.min(...allWeights) - 2;
  const maxW = Math.max(...allWeights) + 2;
  const range = maxW - minW;

  const W = 320;
  const H = 160;
  const PAD = { l: 40, r: 16, t: 12, b: 24 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const x = (i) => PAD.l + (i / (pts.length - 1)) * chartW;
  const y = (w) => PAD.t + ((maxW - w) / range) * chartH;

  const goalY = y(goalWeight);
  const startY = y(startWeight);

  // Projected path: linear regression from last 4 points
  let projPath = '';
  if (pts.length >= 3) {
    const last4 = pts.slice(-4);
    const n = last4.length;
    const sumX = last4.reduce((s, _, i) => s + i, 0);
    const sumY = last4.reduce((s, p) => s + p.weight, 0);
    const sumXY = last4.reduce((s, p, i) => s + i * p.weight, 0);
    const sumX2 = last4.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // Project from last point to goal
    if (slope < 0) {
      const lastIdx = pts.length - 1;
      const lastW = pts[lastIdx].weight;
      const weeksToGoal = (lastW - goalWeight) / Math.abs(slope * 7);
      const projPts = [{ xi: lastIdx, wi: lastW }];
      for (let i = 1; i <= Math.min(weeksToGoal + 2, 10); i++) {
        const wi = intercept + slope * (n - 1 + i);
        if (wi <= goalWeight) { projPts.push({ xi: lastIdx + i, wi: goalWeight }); break; }
        projPts.push({ xi: lastIdx + i, wi });
      }
      if (projPts.length >= 2) {
        const totalPoints = pts.length + projPts.length - 1;
        const xProj = (i) => PAD.l + (i / Math.max(totalPoints - 1, pts.length - 1)) * chartW;
        projPath = projPts.map((p, i) =>
          `${i === 0 ? 'M' : 'L'} ${xProj(p.xi)} ${y(p.wi)}`
        ).join(' ');
      }
    }
  }

  const linePath = pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.weight)}`
  ).join(' ');

  const isTrendingDown = pts.length >= 2 && pts[pts.length - 1].weight < pts[0].weight;

  // Date labels: first and last
  const firstDate = new Date(pts[0].date + 'T12:00:00');
  const lastDate = new Date(pts[pts.length - 1].date + 'T12:00:00');
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="overflow-x-hidden">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Goal line */}
        <line x1={PAD.l} y1={goalY} x2={W - PAD.r} y2={goalY}
          stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
        <text x={PAD.l - 4} y={goalY + 4} textAnchor="end" fontSize="9" fill="#22c55e" opacity="0.7">
          {goalWeight}
        </text>

        {/* Start line */}
        {startWeight > goalWeight + 3 && (
          <>
            <line x1={PAD.l} y1={startY} x2={W - PAD.r} y2={startY}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <text x={PAD.l - 4} y={startY + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">
              {startWeight}
            </text>
          </>
        )}

        {/* Projected path */}
        {projPath && (
          <path d={projPath} fill="none" stroke="#3b82f6" strokeWidth="1.5"
            strokeDasharray="4 3" opacity="0.4" />
        )}

        {/* Actual path */}
        <path d={linePath} fill="none"
          stroke={isTrendingDown ? '#22c55e' : '#f59e0b'}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.weight)} r="4"
            fill={isTrendingDown ? '#22c55e' : '#f59e0b'}
            stroke="#0f1117" strokeWidth="2" />
        ))}

        {/* Current weight label */}
        {pts.length > 0 && (
          <text x={x(pts.length - 1)} y={y(pts[pts.length - 1].weight) - 8}
            textAnchor="middle" fontSize="11" fontWeight="bold"
            fill={isTrendingDown ? '#22c55e' : '#f59e0b'}>
            {pts[pts.length - 1].weight}
          </text>
        )}

        {/* Date labels */}
        <text x={PAD.l} y={H - 4} textAnchor="start" fontSize="9" fill="rgba(255,255,255,0.3)">
          {fmt(firstDate)}
        </text>
        {pts.length > 1 && (
          <text x={W - PAD.r} y={H - 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">
            {fmt(lastDate)}
          </text>
        )}
      </svg>

      <div className="flex justify-center gap-4 mt-1">
        <div className="flex items-center gap-1.5 text-base text-white/40">
          <div className="w-4 h-0.5 bg-green-500" />
          <span>Actual</span>
        </div>
        <div className="flex items-center gap-1.5 text-base text-white/40">
          <div className="w-4 h-0.5 bg-blue-500 opacity-50" style={{ borderTop: '2px dashed' }} />
          <span>Projected</span>
        </div>
        <div className="flex items-center gap-1.5 text-base text-white/40">
          <div className="w-4 h-0.5 bg-green-500 opacity-60" style={{ borderTop: '2px dashed' }} />
          <span>Goal</span>
        </div>
      </div>
    </div>
  );
}

const MILESTONES = (start, goal) => [
  { label: '5 lbs', weight: start - 5, icon: '🎯' },
  { label: '10 lbs', weight: start - 10, icon: '⭐' },
  { label: 'Halfway', weight: Math.round((start + goal) / 2 * 10) / 10, icon: '🏃' },
  { label: '15 lbs', weight: start - 15, icon: '🏆' },
  { label: 'Goal!', weight: goal, icon: '🎉' },
];

export function JourneyTab({ weighIns, startWeight, goalWeight }) {
  const { current: streak, best: bestStreak, last14 } = useMemo(() => calcStreakData(), []);
  const weeklySummaries = useMemo(() => getWeeklySummaries(weighIns), [weighIns]);
  const { days, year, month } = useMemo(() => getMonthCalendar(), []);
  const milestones = useMemo(() => MILESTONES(startWeight, goalWeight), [startWeight, goalWeight]);

  const currentWeight = weighIns.length > 0 ? weighIns[weighIns.length - 1].weight : startWeight;
  const lostTotal = startWeight - currentWeight;
  const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const dayOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Weight Graph */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Weight Progress</CardTitle>
          {lostTotal > 0 && (
            <span className="text-green-400 text-base font-bold">-{lostTotal.toFixed(1)} lbs</span>
          )}
        </div>
        <WeightGraph weighIns={weighIns} goalWeight={goalWeight} startWeight={startWeight} />
      </Card>

      {/* Streak + Stats */}
      <Card>
        <div className="flex justify-around text-center mb-4">
          <div>
            <div className="text-3xl font-bold text-amber-400">{streak}</div>
            <div className="text-base text-white/50">day streak 🔥</div>
          </div>
          <div className="w-px bg-white/[0.08]" />
          <div>
            <div className="text-2xl font-bold text-white/60">{bestStreak}</div>
            <div className="text-base text-white/50">best streak</div>
          </div>
          {lostTotal > 0 && (
            <>
              <div className="w-px bg-white/[0.08]" />
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {lostTotal > 0 ? `-${lostTotal.toFixed(1)}` : '0'}
                </div>
                <div className="text-base text-white/50">lbs lost</div>
              </div>
            </>
          )}
        </div>

        {/* 14-day streak visual */}
        <div className="text-base text-white/40 mb-2 font-semibold">Last 14 days</div>
        <div className="flex gap-1.5 flex-wrap">
          {last14.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                className={`w-6 h-6 rounded-full
                  ${d.status === 'full' ? 'bg-green-500' :
                    d.status === 'partial' ? 'bg-amber-500/80' :
                    d.status === 'minimal' ? 'bg-blue-500/50' :
                    'bg-white/[0.08]'}`}
                title={d.dateStr}
              />
              <div className="text-[9px] text-white/25">{d.dayNum}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          {[
            { color: 'bg-green-500', label: 'All goals' },
            { color: 'bg-amber-500/80', label: 'Partial' },
            { color: 'bg-white/[0.08]', label: 'None' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-[11px] text-white/35">{l.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Summaries */}
      <Card>
        <CardTitle>Weekly Summaries</CardTitle>
        <div className="space-y-3">
          {weeklySummaries.map((week, i) => (
            <div
              key={i}
              className={`rounded-xl p-3 border
                ${week.isCurrent
                  ? 'bg-blue-500/[0.08] border-blue-500/20'
                  : 'bg-white/[0.03] border-white/[0.06]'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className={`text-base font-bold ${week.isCurrent ? 'text-blue-300' : 'text-white/80'}`}>
                    {week.weekLabel}
                  </span>
                  {week.isCurrent && (
                    <span className="ml-2 text-base bg-blue-500/20 text-blue-400 rounded-full px-1.5 py-0.5">current</span>
                  )}
                </div>
                {week.weightChange !== null && (
                  <span className={`text-base font-bold ${week.weightChange < 0 ? 'text-green-400' : 'text-amber-400'}`}>
                    {week.weightChange > 0 ? '+' : ''}{week.weightChange.toFixed(1)} lbs
                  </span>
                )}
              </div>
              <div className="text-base text-white/40 mb-2">{week.dateRange}</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Avg Cal', value: week.avgCal > 0 ? `${week.avgCal}` : '—' },
                  { label: 'Avg Pro', value: week.avgProtein > 0 ? `${week.avgProtein}g` : '—' },
                  { label: 'Days', value: `${week.daysLogged}/7` },
                  { label: 'Workouts', value: `${week.workoutsCompleted}` },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="text-base font-bold text-white/90">{stat.value}</div>
                    <div className="text-base text-white/35">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Milestone Tracker */}
      <Card>
        <CardTitle>Milestones</CardTitle>
        <div className="space-y-2">
          {milestones.map((m, i) => {
            const reached = currentWeight <= m.weight;
            const pctOfGoal = Math.min(1, (startWeight - currentWeight) / (startWeight - m.weight));
            return (
              <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-xl
                ${reached ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{m.icon}</span>
                  <div>
                    <span className={`text-base font-semibold ${reached ? 'text-green-400' : 'text-white/60'}`}>
                      {m.label}
                    </span>
                    <span className="text-base text-white/30 ml-2">{m.weight} lbs</span>
                  </div>
                </div>
                {reached
                  ? <span className="text-green-400 text-base font-bold">✓ Done!</span>
                  : <span className="text-base text-white/30">{(currentWeight - m.weight).toFixed(1)} to go</span>
                }
              </div>
            );
          })}
        </div>
      </Card>

      {/* Monthly Calendar */}
      <Card>
        <CardTitle>{monthName}</CardTitle>
        <div className="grid grid-cols-7 mb-1">
          {dayOfWeek.map(d => (
            <div key={d} className="text-center text-xs text-white/30 font-semibold py-1">{d}</div>
          ))}
        </div>
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
                className={`flex items-center justify-center rounded-lg text-xs font-medium aspect-square
                  ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-[#0f1117]' : ''}
                  ${colors[day.status]}`}
              >
                {day.d}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 justify-center mt-3">
          {[
            { color: 'bg-green-500', label: 'All goals' },
            { color: 'bg-amber-500/80', label: '2–3 goals' },
            { color: 'bg-blue-500/50', label: '1 goal' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${l.color}`} />
              <span className="text-xs text-white/40">{l.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Projection */}
      {weighIns.length >= 2 && (
        <Card>
          <CardTitle>Goal Projection</CardTitle>
          {(() => {
            const recent = weighIns.slice(-4);
            if (recent.length < 2) return <p className="text-base text-white/40">Need more weigh-ins</p>;
            const first = recent[0];
            const last = recent[recent.length - 1];
            const daysBetween = (new Date(last.date) - new Date(first.date)) / 86400000;
            if (daysBetween <= 0) return null;
            const lbsPerDay = (first.weight - last.weight) / daysBetween;
            if (lbsPerDay <= 0) return <p className="text-base text-amber-400">No loss trend in recent weigh-ins</p>;
            const lbsToGo = last.weight - goalWeight;
            const daysToGoal = Math.round(lbsToGo / lbsPerDay);
            const target = new Date();
            target.setDate(target.getDate() + daysToGoal);
            const dateStr = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <div className="text-center py-1">
                <div className="text-xl font-bold text-green-400 mb-1">{dateStr}</div>
                <div className="text-base text-white/40">
                  at {(lbsPerDay * 7).toFixed(1)} lbs/week · {daysToGoal} days away
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {weighIns.length === 0 && (
        <div className="text-center py-8 text-white/30">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-base">Log your first weigh-in (Wednesday) to see your progress graph</p>
        </div>
      )}
    </div>
  );
}
