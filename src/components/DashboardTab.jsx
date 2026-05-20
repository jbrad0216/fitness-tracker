import { useState } from 'react';
import { TARGETS, isWednesday, getToday } from '../data/constants';
import { ProgressRing, WaterBottles, Card, CardTitle, Input, Button, StatBox } from './UI';

export function DashboardTab({
  daily, totalCal, totalProtein, setWater, toggleMeditation, addRun,
  weighIns, addWeighIn, latest, startWeight, goalWeight, notify,
}) {
  const [runInput, setRunInput] = useState('');
  const [showRunInput, setShowRunInput] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const calPct = totalCal / TARGETS.calories;
  const proteinPct = totalProtein / TARGETS.protein;
  const waterPct = daily.water / TARGETS.waterBottles;
  const calLeft = TARGETS.calories - totalCal;
  const proteinLeft = Math.max(0, TARGETS.protein - totalProtein);

  const handleLogRun = () => {
    const miles = parseFloat(runInput);
    if (!miles || miles <= 0) return;
    addRun(miles);
    setRunInput('');
    setShowRunInput(false);
    notify(`${miles}mi logged`);
  };

  const handleWeighIn = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 100 || w > 400) return;
    addWeighIn(w);
    setWeightInput('');
    notify(`${w} lbs logged`);
  };

  const todayLogged = weighIns.find(w => w.date === getToday());

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Progress Rings */}
      <div className="flex justify-around mb-5">
        <ProgressRing pct={calPct} color={calPct > 1 ? '#ef4444' : '#f59e0b'}>
          <span className="text-[15px] font-bold">{totalCal}</span>
          <span className="text-[9px] text-white/50">/ {TARGETS.calories}</span>
        </ProgressRing>
        <ProgressRing pct={proteinPct} color={proteinPct >= 1 ? '#22c55e' : '#3b82f6'}>
          <span className="text-[15px] font-bold">{totalProtein}g</span>
          <span className="text-[9px] text-white/50">/ {TARGETS.protein}g</span>
        </ProgressRing>
        <ProgressRing pct={waterPct} color="#38bdf8">
          <span className="text-[15px] font-bold">{daily.water}</span>
          <span className="text-[9px] text-white/50">/ 3 btl</span>
        </ProgressRing>
      </div>

      {/* Remaining Stats */}
      <Card>
        <div className="flex justify-around text-center">
          <StatBox
            value={calLeft}
            label="cal left"
            color={calLeft < 0 ? '#ef4444' : undefined}
          />
          <div className="w-px bg-white/[0.08]" />
          <StatBox
            value={`${proteinLeft}g`}
            label="protein left"
            color={proteinLeft === 0 ? '#22c55e' : undefined}
          />
          <div className="w-px bg-white/[0.08]" />
          <StatBox value={daily.ranMiles || 0} label="mi ran" />
        </div>
      </Card>

      {/* Water */}
      <Card>
        <CardTitle right={`${daily.water * 32}oz`}>Water (32oz bottles)</CardTitle>
        <WaterBottles count={daily.water} onTap={setWater} />
      </Card>

      {/* Quick Toggles */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={toggleMeditation}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold cursor-pointer
            transition-all active:scale-95 border
            ${daily.meditation
              ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
              : 'bg-white/[0.04] border-white/[0.08] text-white/50'
            }`}
        >
          {daily.meditation ? '✓ ' : ''}TM Done
        </button>
        <button
          onClick={() => {
            if (daily.ranMiles > 0) return;
            setShowRunInput(true);
            setRunInput('2');
          }}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold cursor-pointer
            transition-all active:scale-95 border
            ${daily.ranMiles > 0
              ? 'bg-green-500/20 border-green-500/50 text-green-400'
              : 'bg-white/[0.04] border-white/[0.08] text-white/50'
            }`}
        >
          {daily.ranMiles > 0 ? `✓ ${daily.ranMiles}mi` : 'Log Run'}
        </button>
      </div>

      {/* Run Input */}
      {showRunInput && daily.ranMiles === 0 && (
        <Card>
          <div className="flex gap-2">
            <Input
              type="number"
              value={runInput}
              onChange={e => setRunInput(e.target.value)}
              placeholder="Miles"
              step="0.1"
              className="flex-1"
            />
            <Button onClick={handleLogRun}>Log</Button>
            <Button variant="ghost" onClick={() => setShowRunInput(false)}>✕</Button>
          </div>
        </Card>
      )}

      {/* Today's Food Summary */}
      <Card>
        <CardTitle>Today's Food</CardTitle>
        {daily.food.length === 0 ? (
          <p className="text-sm text-white/40 py-2">Nothing logged yet</p>
        ) : (
          daily.food.map(f => (
            <div key={f.id} className="flex justify-between py-1.5 border-b border-white/[0.06] last:border-0">
              <span className="text-[13px]">{f.name}</span>
              <span className="text-xs text-white/40">{f.cal} · {f.protein}g</span>
            </div>
          ))
        )}
      </Card>

      {/* Today's Lifts Summary */}
      {daily.exercises.length > 0 && (
        <Card>
          <CardTitle>Today's Lifts</CardTitle>
          {daily.exercises.map(e => (
            <div key={e.id} className="text-[13px] py-1 border-b border-white/[0.06] last:border-0">
              {e.name} — {e.weight}lbs × {e.sets}×{e.reps}
            </div>
          ))}
        </Card>
      )}

      {/* Wednesday Weigh-In */}
      {isWednesday() && !todayLogged && (
        <Card highlight>
          <CardTitle>
            <span className="text-amber-500">Wednesday Weigh-In</span>
          </CardTitle>
          <div className="flex gap-2">
            <Input
              type="number"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder="Weight (lbs)"
              step="0.1"
              className="flex-1"
            />
            <Button variant="warning" onClick={handleWeighIn}>Log</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
