import { useState, useRef, useCallback, useEffect } from 'react';
import { isWednesday, getToday } from '../data/constants';
import { ProgressRing, WaterBottles } from './UI';
import { load, save } from '../data/storage';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const DISMISSED_KEY = () => `dismissed-reminders-${getToday()}`;

function getActiveReminder(daily, targets, weighIns, totalCal, totalProtein) {
  const hour = new Date().getHours();
  const today = getToday();
  const dismissed = load(DISMISSED_KEY(), []);

  const check = (id, condition, reminder) => {
    if (!condition || dismissed.includes(id)) return null;
    return { id, ...reminder };
  };

  return (
    check('weigh-in', new Date().getDay() === 3 && !weighIns.some(w => w.date === today) && hour >= 7,
      { icon: '⚖️', text: "Wednesday weigh-in! Log your weight.", color: 'amber', action: 'log', prefill: 'weight is ' }) ||
    check('breakfast', hour >= 8 && hour < 11 && daily.food.length === 0,
      { icon: '🥣', text: "Don't forget to log breakfast.", color: 'blue', action: 'log', prefill: 'I ate ' }) ||
    check('water-noon', hour >= 12 && daily.water === 0,
      { icon: '💧', text: "No water yet today! Stay hydrated.", color: 'blue', action: 'water' }) ||
    check('lunch', hour >= 12 && hour < 14 && daily.food.length <= 1,
      { icon: '🥗', text: "Time to log lunch.", color: 'green', action: 'log', prefill: 'I ate ' }) ||
    check('protein', hour >= 14 && hour < 17 && totalProtein < targets.protein * 0.5,
      { icon: '💪', text: `Protein snack time! Only ${totalProtein}g of ${targets.protein}g.`, color: 'amber', action: 'log', prefill: 'I ate ' }) ||
    check('dinner', hour >= 17 && totalCal < targets.calories * 0.7,
      { icon: '🍽️', text: "Log dinner when you eat.", color: 'blue', action: 'log', prefill: 'I ate ' }) ||
    check('workout', hour >= 18 && daily.exercises.length === 0 && [1, 3, 5].includes(new Date().getDay()),
      { icon: '🏋️', text: "Did you get your workout in today?", color: 'amber', action: 'gym' }) ||
    null
  );
}

function ReminderBanner({ daily, targets, weighIns, totalCal, totalProtein, onNavigate, onOpenLog }) {
  const [dismissed, setDismissed] = useState(() => load(DISMISSED_KEY(), []));

  const reminder = getActiveReminder(daily, targets, weighIns, totalCal, totalProtein);
  if (!reminder || dismissed.includes(reminder.id)) return null;

  const dismiss = () => {
    const next = [...dismissed, reminder.id];
    setDismissed(next);
    save(DISMISSED_KEY(), next);
  };

  const colorMap = {
    blue: { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-300', btn: 'bg-blue-500' },
    amber: { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-300', btn: 'bg-amber-500' },
    green: { bg: 'bg-green-500/10 border-green-500/25', text: 'text-green-300', btn: 'bg-green-500' },
  };
  const c = colorMap[reminder.color] || colorMap.blue;

  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 mb-3 border ${c.bg}`}>
      <span className="text-xl shrink-0">{reminder.icon}</span>
      <span className={`flex-1 text-[13px] font-medium ${c.text}`}>{reminder.text}</span>
      {reminder.action === 'log' && (
        <button
          onClick={() => { onOpenLog?.(reminder.prefill); dismiss(); }}
          className={`${c.btn} text-white text-xs font-bold rounded-xl px-3 py-2 border-none cursor-pointer shrink-0`}
        >
          Log
        </button>
      )}
      {reminder.action === 'water' && (
        <button
          onClick={() => { onNavigate?.('home'); dismiss(); }}
          className={`${c.btn} text-white text-xs font-bold rounded-xl px-3 py-2 border-none cursor-pointer shrink-0`}
        >
          +Water
        </button>
      )}
      {reminder.action === 'gym' && (
        <button
          onClick={() => { onNavigate?.('gym'); dismiss(); }}
          className={`${c.btn} text-white text-xs font-bold rounded-xl px-3 py-2 border-none cursor-pointer shrink-0`}
        >
          Open Gym
        </button>
      )}
      <button onClick={dismiss} className="bg-transparent border-none cursor-pointer text-white/30 text-lg shrink-0 pl-1">✕</button>
    </div>
  );
}

// ─── Meal helpers ───
const MEAL_CONFIG = [
  { key: 'breakfast', icon: '🌅', label: 'Breakfast' },
  { key: 'lunch', icon: '☀️', label: 'Lunch' },
  { key: 'snack', icon: '🍿', label: 'Snacks' },
  { key: 'dinner', icon: '🌙', label: 'Dinner' },
];

function getMealForFood(f) {
  if (f.meal) return f.meal;
  if (f.loggedAt) {
    const h = new Date(f.loggedAt).getHours();
    if (h < 10) return 'breakfast';
    if (h < 14) return 'lunch';
    if (h < 17) return 'snack';
    return 'dinner';
  }
  return 'snack';
}

// ─── Goals Checklist ───
function GoalChecklist({ daily, targets, totalProtein }) {
  const dow = new Date().getDay();
  const isRest = dow === 0;
  const isStrength = [1, 3, 5].includes(dow);

  const mealsLogged = new Set(daily.food.map(getMealForFood)).size;

  const goals = [
    {
      key: 'meals',
      label: 'Log all meals',
      done: mealsLogged >= 3,
      detail: `${mealsLogged} of 4 meals`,
    },
    {
      key: 'protein',
      label: 'Hit protein target',
      done: totalProtein >= targets.protein,
      detail: `${totalProtein}g / ${targets.protein}g`,
    },
    {
      key: 'water',
      label: 'Drink water',
      done: daily.water >= targets.waterBottles,
      detail: `${daily.water} / ${targets.waterBottles} bottles`,
    },
    {
      key: 'workout',
      label: 'Complete workout',
      done: isRest || (isStrength ? daily.exercises.length >= 1 : daily.ranMiles > 0),
      detail: isRest ? 'Rest day ✓'
        : isStrength
          ? (daily.exercises.length >= 1 ? `${daily.exercises.length} exercise${daily.exercises.length > 1 ? 's' : ''} done` : 'Not started')
          : (daily.ranMiles > 0 ? `${daily.ranMiles}mi logged` : 'Not logged'),
    },
  ];

  const allDone = goals.every(g => g.done);

  return (
    <div className={`rounded-2xl border mb-4 overflow-hidden transition-all
      ${allDone ? 'border-green-500/40 bg-green-500/[0.04]' : 'border-white/[0.08] bg-white/[0.05]'}`}>
      <div className="px-4 pt-3.5 pb-0.5">
        <div className="text-[15px] font-semibold">Today's Goals</div>
      </div>
      <div className="px-4 pb-3">
        {goals.map((goal, i) => (
          <div key={goal.key} className={`flex items-center gap-3 py-2.5
            ${i < goals.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
            <span className="text-[20px] shrink-0 leading-none">{goal.done ? '✅' : '⬜'}</span>
            <span className="flex-1 text-[15px] font-medium">{goal.label}</span>
            <span className="text-[13px] text-white/40 text-right shrink-0">{goal.detail}</span>
          </div>
        ))}
        {allDone && (
          <div className="text-center pt-2 pb-0.5 text-green-400 font-semibold text-sm">
            🎉 All goals hit!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Swipeable food item with always-visible X button ───
function SwipeFoodItem({ item, onDelete }) {
  const [offset, setOffset] = useState(0);
  const [showBtn, setShowBtn] = useState(false);
  const startX = useRef(null);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = Math.abs(e.touches[0].clientY - startY.current);
    if (dy > 20) { startX.current = null; return; }
    if (dx < 0) {
      e.preventDefault();
      setOffset(Math.max(dx, -72));
    } else if (showBtn) {
      setOffset(Math.min(dx - 72, 0));
    }
  };

  const onTouchEnd = () => {
    if (offset < -36) {
      setOffset(-72);
      setShowBtn(true);
    } else {
      setOffset(0);
      setShowBtn(false);
    }
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe-revealed delete button */}
      <div className="absolute right-0 top-0 bottom-0 w-[72px] flex items-center justify-center bg-red-500 rounded-r-xl">
        <button
          onClick={() => onDelete(item.id)}
          className="text-white text-sm font-bold bg-transparent border-none cursor-pointer w-full h-full"
        >
          Delete
        </button>
      </div>
      {/* Row with always-visible X button */}
      <div
        className="relative bg-[#0f1117] flex items-center gap-2 py-2.5 border-b border-white/[0.06] last:border-0"
        style={{ transform: `translateX(${offset}px)`, transition: offset === 0 || offset === -72 ? 'transform 0.2s ease' : 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <span className="text-[15px] truncate flex-1 min-w-0">{item.name}</span>
        <span className="text-sm text-white/40 shrink-0">
          {item.cal} cal{item.protein ? ` · ${item.protein}g` : ''}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="w-[32px] h-[32px] shrink-0 flex items-center justify-center rounded-full
            bg-red-500/15 text-red-400 border-none cursor-pointer text-xl leading-none
            active:bg-red-500/30 active:scale-95"
          aria-label={`Delete ${item.name}`}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function DashboardTab({
  daily, totalCal, totalProtein, setWater, toggleMeditation, addRun, addFood, removeFood,
  weighIns, addWeighIn, latest, startWeight, targets, name, notify,
  onNavigate, onOpenLog,
}) {
  const [weightInput, setWeightInput] = useState('');
  const [undoItem, setUndoItem] = useState(null);
  const undoTimer = useRef(null);

  const calPct = totalCal / targets.calories;
  const proteinPct = totalProtein / targets.protein;
  const waterPct = daily.water / targets.waterBottles;

  const scorePct = (
    Math.min(calPct, 1) * 0.25 +
    Math.min(proteinPct, 1) * 0.25 +
    Math.min(waterPct, 1) * 0.25 +
    ((daily.meditation || daily.ranMiles > 0 || daily.exercises.length > 0) ? 0.25 : 0)
  );

  const currentWeight = latest?.weight || startWeight;
  const weightLost = (startWeight || 0) - (currentWeight || 0);

  const handleDelete = useCallback((id) => {
    const item = daily.food.find(f => f.id === id);
    if (item) {
      removeFood(id);
      setUndoItem(item);
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndoItem(null), 5000);
    }
  }, [daily.food, removeFood]);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  const handleWeighIn = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 100 || w > 400) return;
    addWeighIn(w);
    setWeightInput('');
    notify(`${w} lbs logged`);
  };

  const todayLogged = weighIns?.find(w => w.date === getToday());

  // Group food by meal
  const foodByMeal = MEAL_CONFIG.reduce((acc, m) => {
    acc[m.key] = daily.food.filter(f => getMealForFood(f) === m.key);
    return acc;
  }, {});

  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
      {/* Reminders */}
      <ReminderBanner
        daily={daily}
        targets={targets}
        weighIns={weighIns || []}
        totalCal={totalCal}
        totalProtein={totalProtein}
        onNavigate={onNavigate}
        onOpenLog={onOpenLog}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[22px] font-bold leading-tight">
            {getGreeting()}, {name || 'Jason'}
          </div>
          <div className="text-[13px] text-white/40 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
        {currentWeight && (
          <div className="text-right">
            <div className="text-[22px] font-bold">{currentWeight}</div>
            <div className={`text-[12px] ${weightLost > 0 ? 'text-green-400' : 'text-white/40'}`}>
              {weightLost > 0 ? `↓${weightLost.toFixed(1)} lbs lost` : 'lbs'}
            </div>
          </div>
        )}
      </div>

      {/* Goals Checklist — Task 4 */}
      <GoalChecklist daily={daily} targets={targets} totalProtein={totalProtein} />

      {/* Big progress ring */}
      <div className="flex flex-col items-center mb-5">
        <ProgressRing pct={scorePct} size={120} stroke={10}
          color={scorePct >= 1 ? '#22c55e' : scorePct >= 0.75 ? '#3b82f6' : '#f59e0b'}>
          <span className="text-[28px] font-bold leading-none">{Math.round(scorePct * 100)}%</span>
          <span className="text-[13px] text-white/40 mt-1">daily score</span>
        </ProgressRing>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {
            label: 'Calories', value: `${totalCal}`, total: targets.calories,
            pct: calPct, color: calPct > 1.1 ? '#ef4444' : '#f59e0b',
          },
          {
            label: 'Protein', value: `${totalProtein}g`, total: `${targets.protein}g`,
            pct: proteinPct, color: proteinPct >= 1 ? '#22c55e' : '#3b82f6',
          },
          {
            label: 'Water', value: `${daily.water}`, total: `/ ${targets.waterBottles}`,
            pct: waterPct, color: waterPct >= 1 ? '#22c55e' : '#38bdf8',
          },
        ].map(stat => (
          <div key={stat.label}
            className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-3 py-3">
            <div className="text-[13px] text-white/40 mb-1">{stat.label}</div>
            <div className="text-[18px] font-bold leading-none mb-1">{stat.value}</div>
            <div className="text-[12px] text-white/30 mb-2">of {stat.total}</div>
            <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(stat.pct * 100, 100)}%`, background: stat.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Water tap row */}
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
        <div className="text-[13px] text-white/40 mb-2">
          Water · {daily.water * 32}oz / {targets.waterBottles * 32}oz
        </div>
        <WaterBottles count={daily.water} total={targets.waterBottles} onTap={setWater} />
      </div>

      {/* Quick toggles row */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={toggleMeditation}
          className={`flex-1 rounded-2xl py-4 text-[15px] font-semibold cursor-pointer
            border active:scale-95 transition-all
            ${daily.meditation
              ? 'bg-green-500/20 border-green-500/50 text-green-300'
              : 'bg-white/[0.05] border-white/[0.08] text-white/50'}`}
        >
          {daily.meditation ? '✓ TM Done' : '○ TM Done'}
        </button>
        <button
          onClick={() => onOpenLog?.('I ran ')}
          className={`flex-1 rounded-2xl py-4 text-[15px] font-semibold cursor-pointer
            border active:scale-95 transition-all
            ${daily.ranMiles > 0
              ? 'bg-green-500/20 border-green-500/50 text-green-300'
              : 'bg-white/[0.05] border-white/[0.08] text-white/50'}`}
        >
          {daily.ranMiles > 0 ? `✓ ${daily.ranMiles}mi` : '○ Log Run'}
        </button>
      </div>

      {/* Food log — grouped by meal (Tasks 1 & 2) */}
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl overflow-hidden mb-4">
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/[0.06]">
          <span className="text-[15px] font-semibold">Today's Food</span>
          {daily.food.length > 0 && (
            <span className="text-[12px] text-white/40">{daily.food.length} items · {totalCal} cal</span>
          )}
        </div>
        {daily.food.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-[14px] text-white/30">Nothing logged yet</p>
            <button
              onClick={() => onOpenLog?.('I ate ')}
              className="mt-3 text-blue-400 text-sm font-semibold bg-transparent border-none cursor-pointer active:opacity-70"
            >
              + Log food
            </button>
          </div>
        ) : (
          <div>
            {MEAL_CONFIG.map(meal => {
              const items = foodByMeal[meal.key];
              if (items.length === 0) return null;
              const mealCal = items.reduce((s, f) => s + (f.cal || 0), 0);
              const mealProtein = items.reduce((s, f) => s + (f.protein || 0), 0);
              return (
                <div key={meal.key} className="border-b border-white/[0.06] last:border-0">
                  <div className="flex justify-between items-center px-4 py-2 bg-white/[0.03]">
                    <span className="text-[13px] font-semibold text-white/60">
                      {meal.icon} {meal.label}
                    </span>
                    <span className="text-[12px] text-white/35">
                      {mealCal} cal · {mealProtein}g
                    </span>
                  </div>
                  <div className="px-4">
                    {items.map(f => (
                      <SwipeFoodItem key={f.id} item={f} onDelete={handleDelete} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exercises summary */}
      {daily.exercises.length > 0 && (
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
          <div className="text-[15px] font-semibold mb-2">Today's Lifts</div>
          {daily.exercises.map(e => (
            <div key={e.id} className="flex items-center py-2 border-b border-white/[0.06] last:border-0">
              <span className="text-green-400 mr-2 text-sm">✓</span>
              <span className="text-[14px] flex-1">{e.name}</span>
              <span className="text-[12px] text-white/40">{e.weight}lbs × {e.sets}×{e.reps}</span>
            </div>
          ))}
        </div>
      )}

      {/* Wednesday weigh-in */}
      {isWednesday() && !todayLogged && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-4 mb-4">
          <div className="text-[15px] font-semibold text-amber-400 mb-3">⚖️ Wednesday Weigh-In</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder="Weight (lbs)"
              step="0.1"
              className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 py-3
                text-[16px] text-white outline-none placeholder:text-white/30"
            />
            <button
              onClick={handleWeighIn}
              className="bg-amber-500 text-white font-bold rounded-xl px-5 py-3 border-none cursor-pointer active:scale-95"
            >
              Log
            </button>
          </div>
        </div>
      )}

      {/* Undo toast */}
      {undoItem && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50
          bg-[#1e2030] border border-white/[0.12] rounded-2xl px-4 py-3 flex items-center gap-3
          shadow-xl max-w-xs w-[90vw]">
          <span className="text-sm text-white/70 flex-1">Removed {undoItem.name}</span>
          <button
            onClick={() => {
              clearTimeout(undoTimer.current);
              if (undoItem) addFood(undoItem);
              setUndoItem(null);
            }}
            className="text-blue-400 text-sm font-bold bg-transparent border-none cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
