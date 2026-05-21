import { useState } from 'react';
import { isWednesday, getToday } from '../data/constants';
import { ProgressRing, WaterBottles, Card, CardTitle, Input, Button, StatBox } from './UI';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function MotivationalLine({ totalCal, totalProtein, targets }) {
  const calPct = totalCal / targets.calories;
  const proteinPct = totalProtein / targets.protein;

  if (totalCal === 0 && totalProtein === 0) {
    return <span className="text-white/40">Start logging your meals for today</span>;
  }
  if (calPct >= 1 && proteinPct >= 1) {
    return <span className="text-green-400">Targets hit! Great work today</span>;
  }
  if (proteinPct >= 1) {
    return <span className="text-blue-400">Protein goal crushed · {targets.calories - totalCal} cal remaining</span>;
  }
  const calLeft = targets.calories - totalCal;
  const proLeft = targets.protein - totalProtein;
  return (
    <span className="text-white/50">
      {totalCal} of {targets.calories} cal · {proLeft}g protein left
    </span>
  );
}

export function DashboardTab({
  daily, totalCal, totalProtein, setWater, toggleMeditation, addRun,
  weighIns, addWeighIn, latest, startWeight, goalWeight, targets, name, notify,
}) {
  const [runInput, setRunInput] = useState('');
  const [showRunInput, setShowRunInput] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  const calPct = totalCal / targets.calories;
  const proteinPct = totalProtein / targets.protein;
  const waterPct = daily.water / targets.waterBottles;
  const calLeft = targets.calories - totalCal;
  const proteinLeft = Math.max(0, targets.protein - totalProtein);

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
      {/* Greeting */}
      <div className="mb-4">
        <p className="text-base font-semibold text-white/80">
          {getGreeting()}{name ? `, ${name}` : ''}
        </p>
        <p className="text-xs mt-0.5">
          <MotivationalLine totalCal={totalCal} totalProtein={totalProtein} targets={targets} />
        </p>
      </div>

      {/* Progress Rings — larger and more prominent */}
      <div className="flex justify-around mb-4 py-3">
        <div className="flex flex-col items-center gap-1.5">
          <ProgressRing pct={calPct} size={92} stroke={8} color={calPct > 1 ? '#ef4444' : '#f59e0b'}>
            <span className="text-[16px] font-bold leading-none">{totalCal}</span>
            <span className="text-[9px] text-white/40 mt-0.5">/ {targets.calories}</span>
          </ProgressRing>
          <span className="text-[11px] text-white/50">Calories</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <ProgressRing pct={proteinPct} size={92} stroke={8} color={proteinPct >= 1 ? '#22c55e' : '#3b82f6'}>
            <span className="text-[16px] font-bold leading-none">{totalProtein}g</span>
            <span className="text-[9px] text-white/40 mt-0.5">/ {targets.protein}g</span>
          </ProgressRing>
          <span className="text-[11px] text-white/50">Protein</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <ProgressRing pct={waterPct} size={92} stroke={8} color={waterPct >= 1 ? '#22c55e' : '#38bdf8'}>
            <span className="text-[16px] font-bold leading-none">{daily.water}</span>
            <span className="text-[9px] text-white/40 mt-0.5">/ {targets.waterBottles}</span>
          </ProgressRing>
          <span className="text-[11px] text-white/50">Water</span>
        </div>
      </div>

      {/* Remaining Stats */}
      <Card>
        <div className="flex justify-around text-center">
          <StatBox
            value={calLeft < 0 ? `-${Math.abs(calLeft)}` : calLeft}
            label={calLeft < 0 ? 'cal over' : 'cal left'}
            color={calLeft < 0 ? '#ef4444' : calLeft === 0 ? '#22c55e' : undefined}
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
        <CardTitle right={`${daily.water * 32}oz / ${targets.waterBottles * 32}oz`}>
          {daily.water >= targets.waterBottles ? '✓ ' : ''}Water
        </CardTitle>
        <WaterBottles count={daily.water} total={targets.waterBottles} onTap={setWater} />
      </Card>

      {/* Quick Toggles */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={toggleMeditation}
          className={`flex-1 rounded-xl py-3.5 text-sm font-semibold cursor-pointer
            transition-all active:scale-95 border
            ${daily.meditation
              ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
              : 'bg-white/[0.04] border-white/[0.08] text-white/50'
            }`}
        >
          {daily.meditation ? '✓ TM Done' : '○ TM Done'}
        </button>
        <button
          onClick={() => {
            if (daily.ranMiles > 0) return;
            setShowRunInput(true);
            setRunInput('2');
          }}
          className={`flex-1 rounded-xl py-3.5 text-sm font-semibold cursor-pointer
            transition-all active:scale-95 border
            ${daily.ranMiles > 0
              ? 'bg-green-500/20 border-green-500/50 text-green-300'
              : 'bg-white/[0.04] border-white/[0.08] text-white/50'
            }`}
        >
          {daily.ranMiles > 0 ? `✓ ${daily.ranMiles}mi` : '○ Log Run'}
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
        <CardTitle right={daily.food.length > 0 ? `${daily.food.length} items` : null}>
          Today's Food
        </CardTitle>
        {daily.food.length === 0 ? (
          <p className="text-sm text-white/40 py-2">Nothing logged yet — tap Food to add</p>
        ) : (
          daily.food.map(f => (
            <div key={f.id} className="flex justify-between items-center py-1.5 border-b border-white/[0.06] last:border-0">
              <span className="text-[13px]">{f.name}</span>
              <div className="text-right">
                <span className="text-xs text-white/40">{f.cal} cal · {f.protein}g</span>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Today's Lifts Summary */}
      {daily.exercises.length > 0 && (
        <Card>
          <CardTitle right={`${daily.exercises.length} exercises`}>Today's Lifts</CardTitle>
          {daily.exercises.map(e => (
            <div key={e.id} className="flex items-center py-1.5 border-b border-white/[0.06] last:border-0">
              <span className="text-green-400 mr-2 text-xs">✓</span>
              <span className="text-[13px]">{e.name}</span>
              <span className="ml-auto text-xs text-white/40">{e.weight}lbs × {e.sets}×{e.reps}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Wednesday Weigh-In */}
      {isWednesday() && !todayLogged && (
        <Card highlight>
          <CardTitle>
            <span className="text-amber-400">Wednesday Weigh-In</span>
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
