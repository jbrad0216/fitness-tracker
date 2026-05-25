// Task 7: Motivation metrics — consistency, streaks, projections, weekly comparison, workout volume

function loadDayData(dateStr) {
  try {
    const raw = localStorage.getItem(`ft_daily-${dateStr}`);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return {
      food: Array.isArray(d.food) ? d.food : [],
      water: typeof d.water === 'number' ? d.water : 0,
      exercises: Array.isArray(d.exercises) ? d.exercises : [],
      ranMiles: typeof d.ranMiles === 'number' ? d.ranMiles : 0,
    };
  } catch { return null; }
}

function getDateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hasActivity(data) {
  return data && (data.food.length > 0 || data.water > 0 || data.exercises.length > 0 || data.ranMiles > 0);
}

function computeMetrics(weighIns, liftLog) {
  // Consistency score — last 30 days
  let logged30 = 0;
  for (let i = 0; i < 30; i++) {
    const data = loadDayData(getDateStr(i));
    if (hasActivity(data)) logged30++;
  }
  const consistency = Math.round((logged30 / 30) * 100);

  // Current streak
  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    if (hasActivity(loadDayData(getDateStr(i)))) currentStreak++;
    else break;
  }

  // Best streak (last 365 days)
  let bestStreak = 0, run = 0;
  for (let i = 364; i >= 0; i--) {
    if (hasActivity(loadDayData(getDateStr(i)))) {
      run++;
      if (run > bestStreak) bestStreak = run;
    } else {
      run = 0;
    }
  }

  // This week vs last week calories/protein
  const thisWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    const dow = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  });
  const lastWeekDays = thisWeekDays.map(s => {
    const d = new Date(s);
    d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const weekStats = (days) => {
    const withFood = days.map(loadDayData).filter(d => d && d.food.length > 0);
    const avgCal = withFood.length
      ? Math.round(withFood.reduce((s, d) => s + d.food.reduce((t, f) => t + (f.cal || 0), 0), 0) / withFood.length)
      : 0;
    const avgProt = withFood.length
      ? Math.round(withFood.reduce((s, d) => s + d.food.reduce((t, f) => t + (f.protein || 0), 0), 0) / withFood.length)
      : 0;
    const totalVol = days.reduce((s, dateStr) => {
      const d = loadDayData(dateStr);
      if (!d) return s;
      return s + d.exercises.reduce((ev, e) => ev + (e.weight || 0) * (e.sets || 0) * (e.reps || 0), 0);
    }, 0);
    return { avgCal, avgProt, totalVol };
  };

  const thisWeek = weekStats(thisWeekDays);
  const lastWeek = weekStats(lastWeekDays);

  // Body change projection (from recent weighins)
  const sorted = [...(weighIns || [])].sort((a, b) => a.date.localeCompare(b.date));
  let projection = null;
  if (sorted.length >= 2) {
    const recent = sorted.slice(-4); // last 4 weighins
    const first = recent[0], last = recent[recent.length - 1];
    const weeksElapsed = (new Date(last.date) - new Date(first.date)) / (7 * 86400000) || 1;
    const weeklyRate = (first.weight - last.weight) / weeksElapsed;
    if (weeklyRate > 0) {
      projection = { rate: weeklyRate, current: last.weight };
    }
  }

  return { consistency, currentStreak, bestStreak, thisWeek, lastWeek, projection };
}

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3.5">
      <div className="text-base text-white/40 mb-1">{label}</div>
      <div className={`text-[22px] font-bold leading-tight ${color}`}>{value}</div>
      {sub && <div className="text-base text-white/40 mt-0.5">{sub}</div>}
    </div>
  );
}

export function MotivationTab({ weighIns, liftLog }) {
  const m = computeMetrics(weighIns, liftLog);

  const calDiff = m.thisWeek.avgCal - m.lastWeek.avgCal;
  const volDiff = m.thisWeek.totalVol - m.lastWeek.totalVol;
  const streakColor = m.currentStreak >= 7 ? 'text-green-400' : m.currentStreak >= 3 ? 'text-amber-400' : 'text-white';

  return (
    <div className="px-4 pb-8" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
      <div className="text-[22px] font-bold mb-1">Progress & Motivation</div>
      <div className="text-base text-white/40 mb-5">Your habits are building results.</div>

      {/* Consistency */}
      <div className="mb-4">
        <div className="text-base font-semibold text-white/60 mb-2 uppercase tracking-wide">Consistency</div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Last 30 days"
            value={`${m.consistency}%`}
            sub="days with any log"
            color={m.consistency >= 80 ? 'text-green-400' : m.consistency >= 60 ? 'text-amber-400' : 'text-red-400'}
          />
          <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3.5">
            <div className="text-base text-white/40 mb-1">Streak</div>
            <div className={`text-2xl font-bold leading-tight ${streakColor}`}>{m.currentStreak} days</div>
            <div className="text-base text-white/40 mt-0.5">Best: {m.bestStreak} days</div>
          </div>
        </div>
      </div>

      {/* Weekly comparison */}
      <div className="mb-4">
        <div className="text-base font-semibold text-white/60 mb-2 uppercase tracking-wide">This Week vs Last Week</div>
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4">
          {m.thisWeek.avgCal > 0 || m.lastWeek.avgCal > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg text-white/70">Avg calories</span>
                <div className="text-right">
                  <span className="text-lg font-bold">{m.thisWeek.avgCal || '—'}</span>
                  {m.lastWeek.avgCal > 0 && m.thisWeek.avgCal > 0 && (
                    <span className={`text-base ml-2 ${calDiff < 0 ? 'text-green-400' : calDiff > 100 ? 'text-amber-400' : 'text-white/40'}`}>
                      ({calDiff > 0 ? '+' : ''}{calDiff} vs last wk)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg text-white/70">Avg protein</span>
                <div className="text-right">
                  <span className="text-lg font-bold">{m.thisWeek.avgProt > 0 ? `${m.thisWeek.avgProt}g` : '—'}</span>
                  {m.lastWeek.avgProt > 0 && m.thisWeek.avgProt > 0 && (
                    <span className={`text-base ml-2 ${m.thisWeek.avgProt >= m.lastWeek.avgProt ? 'text-green-400' : 'text-white/40'}`}>
                      ({m.thisWeek.avgProt - m.lastWeek.avgProt > 0 ? '+' : ''}{m.thisWeek.avgProt - m.lastWeek.avgProt}g)
                    </span>
                  )}
                </div>
              </div>
              {(m.thisWeek.totalVol > 0 || m.lastWeek.totalVol > 0) && (
                <div className="flex justify-between items-center">
                  <span className="text-lg text-white/70">Workout volume</span>
                  <div className="text-right">
                    <span className="text-lg font-bold">{m.thisWeek.totalVol > 0 ? `${m.thisWeek.totalVol.toLocaleString()} lbs` : '—'}</span>
                    {m.lastWeek.totalVol > 0 && m.thisWeek.totalVol > 0 && (
                      <span className={`text-base ml-2 ${volDiff >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                        ({volDiff >= 0 ? '+' : ''}{volDiff.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-base text-white/30 text-center py-2">Log food this week to see trends.</p>
          )}
        </div>
      </div>

      {/* Body change projection */}
      {m.projection && (
        <div className="mb-4">
          <div className="text-base font-semibold text-white/60 mb-2 uppercase tracking-wide">Projection</div>
          <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4">
            <div className="text-lg font-semibold mb-1">
              Losing {m.projection.rate.toFixed(1)} lbs/week
            </div>
            <div className="text-base text-white/50 mb-3">Based on your recent weigh-ins</div>
            {[
              { label: '1 month', weeks: 4 },
              { label: '3 months', weeks: 13 },
            ].map(({ label, weeks }) => {
              const projected = Math.round((m.projection.current - m.projection.rate * weeks) * 10) / 10;
              return (
                <div key={label} className="flex justify-between items-center py-2 border-b border-white/[0.06] last:border-0">
                  <span className="text-[15px] text-white/60">In {label}</span>
                  <span className="text-[15px] font-bold text-green-400">{projected} lbs</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-2xl px-4 py-4">
        <div className="text-lg font-semibold text-blue-300 mb-2">Keep the momentum</div>
        <div className="space-y-1.5 text-base text-white/50">
          {m.consistency < 70 && <p>• Log even on hard days — imperfect logging beats no logging.</p>}
          {m.currentStreak < 3 && <p>• Try to log something every day this week to build your streak.</p>}
          {m.thisWeek.avgProt > 0 && m.thisWeek.avgProt < 120 && <p>• Protein is low this week — try adding a high-protein snack.</p>}
          <p>• Consistency matters more than perfection. You're doing great.</p>
        </div>
      </div>
    </div>
  );
}
