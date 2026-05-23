import { useState, useRef, useCallback, useEffect } from 'react';
import { isWednesday, getToday } from '../data/constants';
import { ProgressRing, WaterBottles } from './UI';
import { load, save } from '../data/storage';

// ─── Collapsible "Why?" section ───
function WhySection({ id, children }) {
  const storageKey = `ft_why-dismissed-${id}`;
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-sm text-white/35 bg-transparent border-none cursor-pointer active:opacity-60 py-1"
      >
        <span>💡</span>
        <span>{open ? 'Hide explanation' : 'Why this target?'}</span>
        <span className="text-white/20">{open ? '▾' : '›'}</span>
      </button>
      {open && (
        <div className="mt-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-3 text-sm text-white/50 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

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
      <span className={`flex-1 text-sm font-medium ${c.text}`}>{reminder.text}</span>
      {reminder.action === 'log' && (
        <button
          onClick={() => { onOpenLog?.(reminder.prefill); dismiss(); }}
          className={`${c.btn} text-white text-sm font-bold rounded-xl px-3 py-2.5 border-none cursor-pointer shrink-0 active:scale-95`}
        >
          Log
        </button>
      )}
      {reminder.action === 'water' && (
        <button
          onClick={() => { onNavigate?.('home'); dismiss(); }}
          className={`${c.btn} text-white text-sm font-bold rounded-xl px-3 py-2.5 border-none cursor-pointer shrink-0 active:scale-95`}
        >
          +Water
        </button>
      )}
      {reminder.action === 'gym' && (
        <button
          onClick={() => { onNavigate?.('gym'); dismiss(); }}
          className={`${c.btn} text-white text-sm font-bold rounded-xl px-3 py-2.5 border-none cursor-pointer shrink-0 active:scale-95`}
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
        <div className="text-[17px] font-semibold">Today's Goals</div>
      </div>
      <div className="px-4 pb-3">
        {goals.map((goal, i) => (
          <div key={goal.key} className={`flex items-center gap-3 py-3
            ${i < goals.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
            <span className="text-[22px] shrink-0 leading-none">{goal.done ? '✅' : '⬜'}</span>
            <span className="flex-1 text-[17px] font-medium">{goal.label}</span>
            <span className="text-sm text-white/40 text-right shrink-0">{goal.detail}</span>
          </div>
        ))}
        {allDone && (
          <div className="text-center pt-2 pb-0.5 text-green-400 font-semibold text-[15px]">
            🎉 All goals hit!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Goal Progress Banner ───
function GoalBanner({ startWeight, goalWeight, weighIns }) {
  if (!startWeight || !goalWeight || startWeight <= goalWeight) return null;

  const sorted = [...(weighIns || [])].sort((a, b) => a.date.localeCompare(b.date));
  const currentWeight = sorted.length > 0 ? sorted[sorted.length - 1].weight : startWeight;
  const totalToLose = startWeight - goalWeight;
  const lostSoFar = startWeight - currentWeight;
  const pct = Math.min(Math.max(lostSoFar / totalToLose, 0), 1);
  const lbsLeft = Math.max(currentWeight - goalWeight, 0);

  // Calculate weekly rate
  let weeklyRate = 0;
  let weeksLeft = null;
  let paceLabel = null;
  let paceColor = 'text-white/50';

  if (sorted.length >= 2) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const weeksElapsed = (new Date(last.date) - new Date(first.date)) / (7 * 86400000) || 1;
    weeklyRate = (first.weight - last.weight) / weeksElapsed;
    if (weeklyRate > 0 && lbsLeft > 0) {
      weeksLeft = Math.ceil(lbsLeft / weeklyRate);
    }
    const target = 1.1;
    const diff = weeklyRate - target;
    if (diff >= 0.15) { paceLabel = 'Ahead of pace! 🚀'; paceColor = 'text-green-400'; }
    else if (diff > -0.3) { paceLabel = 'On track ✓'; paceColor = 'text-green-400'; }
    else if (diff > -0.5) { paceLabel = 'Slightly behind'; paceColor = 'text-amber-400'; }
    else { paceLabel = 'Behind pace'; paceColor = 'text-red-400'; }
  } else if (lbsLeft > 0) {
    weeksLeft = Math.ceil(lbsLeft / 1.1);
    paceLabel = 'Tracking…';
  }

  const barColor = paceLabel?.includes('🚀') || paceLabel?.includes('On track')
    ? '#22c55e' : paceLabel?.includes('Slightly') ? '#f59e0b' : paceLabel?.includes('Behind') ? '#ef4444' : '#3b82f6';

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[15px] font-bold">🎯 Lose {totalToLose} lbs</span>
        <span className="text-sm text-white/40">{Math.round(pct * 100)}% there</span>
      </div>
      <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct * 100}%`, background: barColor }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/40">{startWeight} → {goalWeight} lbs</span>
        <div className="flex items-center gap-2">
          {paceLabel && <span className={`text-sm font-semibold ${paceColor}`}>{paceLabel}</span>}
          {weeksLeft && <span className="text-sm text-white/30">~{weeksLeft}w left</span>}
          {weeklyRate > 0 && <span className="text-sm text-white/25">({weeklyRate.toFixed(1)}/wk)</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Scheduled Meals Banner ───
function ScheduledMealsBanner({ daily, addFood, notify }) {
  const [dismissed, setDismissed] = useState([]);
  const today = new Date();
  const dow = today.getDay();

  const meals = (() => {
    try { return JSON.parse(localStorage.getItem('ft_scheduled-meals') || '[]'); } catch { return []; }
  })();

  const todayMeals = meals.filter(m =>
    m.days.includes(dow) &&
    !dismissed.includes(m.id) &&
    !daily.food.some(f => f.name.toLowerCase() === m.name.toLowerCase())
  );

  if (todayMeals.length === 0) return null;

  return (
    <div className="mb-4">
      {todayMeals.map(m => (
        <div key={m.id} className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3 mb-2 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold">{m.name}</div>
            <div className="text-sm text-white/40">{m.cal} cal · {m.protein}g protein · {m.meal}</div>
          </div>
          <button
            onClick={() => {
              addFood({ name: m.name, cal: m.cal, protein: m.protein || 0, fat: 0, carbs: 0, meal: m.meal });
              setDismissed(d => [...d, m.id]);
              notify(`${m.name} logged`);
            }}
            className="bg-blue-500 text-white text-sm font-bold rounded-xl px-3 py-2 border-none cursor-pointer shrink-0 active:opacity-80"
          >
            ✓ Log
          </button>
          <button
            onClick={() => setDismissed(d => [...d, m.id])}
            className="text-white/30 text-lg bg-transparent border-none cursor-pointer shrink-0"
          >✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Swipeable food item with always-visible X button ───
function SwipeFoodItem({ item, onDelete, onLogAgain }) {
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
        <span className="text-[17px] truncate flex-1 min-w-0">{item.name}</span>
        <span className="text-[15px] text-white/40 shrink-0 mr-1">
          {item.cal} cal{item.protein ? ` · ${item.protein}g` : ''}
        </span>
        {onLogAgain && (
          <button
            onClick={(e) => { e.stopPropagation(); onLogAgain(item); }}
            className="w-[44px] h-[44px] shrink-0 flex items-center justify-center rounded-full
              bg-blue-500/15 text-blue-400 border-none cursor-pointer text-base leading-none
              active:bg-blue-500/30 active:scale-95 mr-1"
            aria-label={`Log ${item.name} again`}
            title="Log again"
          >
            +
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="w-[44px] h-[44px] shrink-0 flex items-center justify-center rounded-full
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
  weighIns, addWeighIn, latest, startWeight, goalWeight, targets, name, notify,
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
      {/* Goal Banner */}
      <GoalBanner startWeight={startWeight} goalWeight={goalWeight || 200} weighIns={weighIns} />

      {/* Scheduled Meals */}
      <ScheduledMealsBanner daily={daily} addFood={addFood} notify={notify} />

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
          <div className="text-[24px] font-bold leading-tight">
            {getGreeting()}, {name || 'Jason'}
          </div>
          <div className="text-sm text-white/40 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
        {currentWeight && (
          <div className="text-right">
            <div className="text-[22px] font-bold">{currentWeight}</div>
            <div className={`text-sm ${weightLost > 0 ? 'text-green-400' : 'text-white/40'}`}>
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
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-3 py-3">
          <div className="text-sm text-white/40 mb-1">Calories</div>
          <div className="text-[20px] font-bold leading-none mb-1"
            style={{ color: calPct > 1.1 ? '#ef4444' : '#f59e0b' }}>{totalCal}</div>
          <div className="text-sm text-white/30 mb-2">of {targets.calories}</div>
          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(calPct * 100, 100)}%`, background: calPct > 1.1 ? '#ef4444' : '#f59e0b' }} />
          </div>
          <WhySection id="calories">
            Your target is {targets.calories} cal/day — a ~500 cal deficit from estimated maintenance, which creates roughly 1 lb/week of fat loss. Tap More → About My Plan for the full science.
          </WhySection>
        </div>
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-3 py-3">
          <div className="text-sm text-white/40 mb-1">Protein</div>
          <div className="text-[20px] font-bold leading-none mb-1"
            style={{ color: proteinPct >= 1 ? '#22c55e' : '#3b82f6' }}>{totalProtein}g</div>
          <div className="text-sm text-white/30 mb-2">of {targets.protein}g</div>
          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(proteinPct * 100, 100)}%`, background: proteinPct >= 1 ? '#22c55e' : '#3b82f6' }} />
          </div>
          <WhySection id="protein">
            {targets.protein}g protein preserves muscle while losing fat. Research shows 0.7–1.0g per lb of body weight during a cut is optimal. High protein also keeps you full longer.
          </WhySection>
        </div>
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-3 py-3">
          <div className="text-sm text-white/40 mb-1">Water</div>
          <div className="text-[20px] font-bold leading-none mb-1"
            style={{ color: waterPct >= 1 ? '#22c55e' : '#38bdf8' }}>{daily.water}</div>
          <div className="text-sm text-white/30 mb-2">/ {targets.waterBottles} bottles</div>
          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden" />
        </div>
      </div>

      {/* Water tap row */}
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[17px] font-semibold">Water Intake</div>
          <div className="text-[17px] font-bold text-blue-300">{daily.water} of {targets.waterBottles}</div>
        </div>
        <div className="text-sm text-white/40 mb-2">
          {daily.water * 32} oz / {targets.waterBottles * 32} oz today
        </div>
        <WaterBottles count={daily.water} total={targets.waterBottles} onTap={setWater} />
        <WhySection id="water">
          Why {targets.waterBottles * 32} oz? A common guideline is half your body weight in ounces (~{Math.round((currentWeight || 222) / 2)} oz for your weight). We round to {targets.waterBottles} × 32 oz bottles for simplicity. Staying hydrated also helps manage blood pressure and curbs false hunger signals.
        </WhySection>
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
          <span className="text-[17px] font-semibold">Today's Food</span>
          {daily.food.length > 0 && (
            <span className="text-sm text-white/40">{daily.food.length} items · {totalCal} cal</span>
          )}
        </div>
        {daily.food.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-[15px] text-white/30">Nothing logged yet</p>
            <button
              onClick={() => onOpenLog?.('I ate ')}
              className="mt-3 text-blue-400 text-[16px] font-semibold bg-transparent border-none cursor-pointer active:opacity-70"
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
                    <span className="text-sm font-semibold text-white/60">
                      {meal.icon} {meal.label}
                    </span>
                    <span className="text-sm text-white/35">
                      {mealCal} cal · {mealProtein}g
                    </span>
                  </div>
                  <div className="px-4">
                    {items.map(f => (
                      <SwipeFoodItem
                        key={f.id}
                        item={f}
                        onDelete={handleDelete}
                        onLogAgain={(food) => {
                          addFood({ ...food, id: Date.now().toString(), loggedAt: new Date().toISOString() });
                          notify(`Logged ${food.name} again`);
                        }}
                      />
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
          <div className="text-[17px] font-semibold mb-2">Today's Lifts</div>
          {daily.exercises.map(e => (
            <div key={e.id} className="flex items-center py-2.5 border-b border-white/[0.06] last:border-0">
              <span className="text-green-400 mr-2 text-[17px]">✓</span>
              <span className="text-[17px] flex-1">{e.name}</span>
              <span className="text-sm text-white/40">{e.weight}lbs × {e.sets}×{e.reps}</span>
            </div>
          ))}
        </div>
      )}

      {/* Wednesday weigh-in */}
      {isWednesday() && !todayLogged && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-4 mb-4">
          <div className="text-[17px] font-semibold text-amber-400 mb-3">⚖️ Wednesday Weigh-In</div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder="Weight (lbs)"
              className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 py-3
                text-[17px] text-white outline-none placeholder:text-white/30"
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
