import { useState, useEffect, useRef, useCallback } from 'react';
import { isWednesday, getToday, getTodaysWorkoutType, getDaySchedule, WORKOUT_A, WORKOUT_B } from '../data/constants';
import { load, save } from '../data/storage';
import { MUSCLE_COLORS } from '../data/exercises';

// ─── 32 Daily Quotes ───
const DAILY_QUOTES = [
  "The only bad workout is the one that didn't happen.",
  "You don't have to be extreme, just consistent.",
  "Small daily improvements lead to stunning results.",
  "Discipline is choosing what you want most over what you want now.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Fall in love with the process and the results will come.",
  "One workout at a time. One meal at a time. One day at a time.",
  "Progress, not perfection.",
  "Every rep, every mile, every meal — it all adds up.",
  "The only person you're competing with is who you were yesterday.",
  "It never gets easier. You just get stronger.",
  "Show up. Do the work. Trust the process.",
  "You are one workout away from a better mood.",
  "The pain you feel today is the strength you feel tomorrow.",
  "Your health is an investment, not an expense.",
  "The hardest lift is getting off the couch.",
  "Ninety percent of success is just showing up.",
  "Champions aren't made in the gym. They're revealed there.",
  "Be stronger than your excuses.",
  "Your future self is watching. Make him proud.",
  "Every healthy choice is a vote for who you want to become.",
  "No matter how slow you go, you're lapping everyone on the couch.",
  "Sore today, strong tomorrow.",
  "Results require repetition. Repetition requires discipline.",
  "Don't wish for it. Work for it.",
  "Motivation gets you started. Habit keeps you going.",
  "The body achieves what the mind believes.",
  "Push yourself — no one else is going to do it for you.",
  "Wake up determined. Go to bed satisfied.",
  "The only limit is the one you set yourself.",
  "Strive for progress, not perfection.",
  "One more rep. One more mile. One more day.",
];

function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function parseHeightToCm(heightStr) {
  if (!heightStr) return 185;
  const m = heightStr.match(/(\d+)'[\s]*(\d+)?/);
  if (m) return Math.round(((parseInt(m[1]) || 0) * 12 + (parseInt(m[2]) || 0)) * 2.54);
  const n = parseFloat(heightStr);
  return n > 0 ? (n < 10 ? n * 100 : n) : 185;
}

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

function getCurrentWeekDates() {
  const today = new Date();
  const todayStr = getToday();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const isToday = dateStr === todayStr;
    const isFuture = !isToday && d > today;
    return { dateStr, dayName: ['M','T','W','T','F','S','S'][i], isToday, isFuture };
  });
}

function getDayStatus(dayData, targets, dateStr) {
  if (!dayData) return 'empty';
  const hasFood = dayData.food.length > 0;
  const totalProt = dayData.food.reduce((s, f) => s + (f.protein || 0), 0);
  const hasProtein = totalProt >= targets.protein;
  const hasWater = dayData.water >= targets.waterBottles;
  const dow = new Date(dateStr + 'T12:00:00').getDay();
  const isStrength = [1, 3, 5].includes(dow);
  const isRest = dow === 0;
  const hasWorkout = isRest || (isStrength ? dayData.exercises.length > 0 : dayData.ranMiles > 0);
  if (!hasFood && dayData.water === 0 && dayData.exercises.length === 0 && dayData.ranMiles === 0) return 'empty';
  if (hasFood && hasProtein && hasWater && hasWorkout) return 'complete';
  return 'partial';
}

const DISMISSED_KEY = () => `dismissed-reminders-${getToday()}`;

// ─── Reminder Banner ───
function getActiveReminder(daily, targets, weighIns, totalCal, totalProtein) {
  const hour = new Date().getHours();
  const today = getToday();
  const dismissed = load(DISMISSED_KEY(), []);
  const check = (id, cond, r) => (!cond || dismissed.includes(id)) ? null : { id, ...r };
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
  const dismiss = () => { const next = [...dismissed, reminder.id]; setDismissed(next); save(DISMISSED_KEY(), next); };
  const c = {
    blue: { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-300', btn: 'bg-blue-500' },
    amber: { bg: 'bg-amber-500/10 border-amber-500/25', text: 'text-amber-300', btn: 'bg-amber-500' },
    green: { bg: 'bg-green-500/10 border-green-500/25', text: 'text-green-300', btn: 'bg-green-500' },
  }[reminder.color] || { bg: 'bg-blue-500/10 border-blue-500/25', text: 'text-blue-300', btn: 'bg-blue-500' };
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 mb-3 border ${c.bg}`}>
      <span className="text-xl shrink-0">{reminder.icon}</span>
      <span className={`flex-1 text-sm font-medium ${c.text}`}>{reminder.text}</span>
      {reminder.action === 'log' && (
        <button onClick={() => { onOpenLog?.(reminder.prefill); dismiss(); }}
          className={`${c.btn} text-white text-sm font-bold rounded-xl px-3 py-2.5 border-none cursor-pointer shrink-0 active:scale-95`}>Log</button>
      )}
      {reminder.action === 'water' && (
        <button onClick={() => { onOpenLog?.('drank water'); dismiss(); }}
          className={`${c.btn} text-white text-sm font-bold rounded-xl px-3 py-2.5 border-none cursor-pointer shrink-0 active:scale-95`}>+Water</button>
      )}
      {reminder.action === 'gym' && (
        <button onClick={() => { onNavigate?.('gym'); dismiss(); }}
          className={`${c.btn} text-white text-sm font-bold rounded-xl px-3 py-2.5 border-none cursor-pointer shrink-0 active:scale-95`}>Open Gym</button>
      )}
      <button onClick={dismiss} className="bg-transparent border-none cursor-pointer text-white/30 text-lg shrink-0 pl-1">✕</button>
    </div>
  );
}

// ─── Scheduled Meals Banner ───
function ScheduledMealsBanner({ daily, addFood, notify }) {
  const [dismissed, setDismissed] = useState([]);
  const dow = new Date().getDay();
  const meals = (() => { try { return JSON.parse(localStorage.getItem('ft_scheduled-meals') || '[]'); } catch { return []; } })();
  const todayMeals = meals.filter(m =>
    m.days.includes(dow) && !dismissed.includes(m.id) &&
    !daily.food.some(f => f.name.toLowerCase() === m.name.toLowerCase())
  );
  if (todayMeals.length === 0) return null;
  return (
    <div className="mb-3">
      {todayMeals.map(m => (
        <div key={m.id} className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3 mb-2 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold">{m.name}</div>
            <div className="text-sm text-white/40">{m.cal} cal · {m.protein}g protein · {m.meal}</div>
          </div>
          <button onClick={() => { addFood({ name: m.name, cal: m.cal, protein: m.protein || 0, fat: 0, carbs: 0, meal: m.meal }); setDismissed(d => [...d, m.id]); notify(`${m.name} logged`); }}
            className="bg-blue-500 text-white text-sm font-bold rounded-xl px-3 py-2 border-none cursor-pointer shrink-0 active:opacity-80">✓ Log</button>
          <button onClick={() => setDismissed(d => [...d, m.id])}
            className="text-white/30 text-lg bg-transparent border-none cursor-pointer shrink-0">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Goal Banner ───
function GoalBanner({ startWeight, goalWeight, weighIns, onEdit }) {
  if (!startWeight || !goalWeight || startWeight <= goalWeight) return null;
  const sorted = [...(weighIns || [])].sort((a, b) => a.date.localeCompare(b.date));
  const currentWeight = sorted.length > 0 ? sorted[sorted.length - 1].weight : startWeight;
  const totalToLose = startWeight - goalWeight;
  const lostSoFar = startWeight - currentWeight;
  const pct = Math.min(Math.max(lostSoFar / totalToLose, 0), 1);
  const lbsLeft = Math.max(currentWeight - goalWeight, 0);

  let weeklyRate = 0, weeksLeft = null, paceLabel = null, paceColor = 'text-white/50';
  if (sorted.length >= 2) {
    const first = sorted[0], last = sorted[sorted.length - 1];
    const weeksElapsed = (new Date(last.date) - new Date(first.date)) / (7 * 86400000) || 1;
    weeklyRate = (first.weight - last.weight) / weeksElapsed;
    if (weeklyRate > 0 && lbsLeft > 0) weeksLeft = Math.ceil(lbsLeft / weeklyRate);
    const diff = weeklyRate - 1.1;
    if (diff >= 0.15) { paceLabel = '🚀 Ahead'; paceColor = 'text-green-400'; }
    else if (diff > -0.3) { paceLabel = '✓ On track'; paceColor = 'text-green-400'; }
    else if (diff > -0.5) { paceLabel = 'Slightly behind'; paceColor = 'text-amber-400'; }
    else { paceLabel = 'Behind pace'; paceColor = 'text-red-400'; }
  } else if (lbsLeft > 0) {
    weeksLeft = Math.ceil(lbsLeft / 1.1);
    paceLabel = 'Tracking…';
  }
  const barColor = paceLabel?.includes('🚀') || paceLabel?.includes('On track') ? '#22c55e'
    : paceLabel?.includes('Slightly') ? '#f59e0b' : paceLabel?.includes('Behind') ? '#ef4444' : '#3b82f6';

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[15px] font-bold">🎯 Lose {totalToLose} lbs</span>
        <div className="flex items-center gap-2">
          {paceLabel && <span className={`text-sm font-semibold ${paceColor}`}>{paceLabel}</span>}
          {weeksLeft && <span className="text-sm text-white/30">~{weeksLeft}w</span>}
          <button onClick={onEdit}
            className="text-blue-400 text-sm font-semibold bg-transparent border-none cursor-pointer active:opacity-60 px-1 py-1">
            Edit
          </button>
        </div>
      </div>
      <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden mb-1.5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, background: barColor }} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/40">{startWeight} → {goalWeight} lbs</span>
        <span className="text-sm text-white/40">{Math.round(pct * 100)}% there</span>
      </div>
    </div>
  );
}

// ─── Goal Editor Modal (Task 4) ───
function GoalEditorModal({ settings, updateSettings, notify, onClose }) {
  const [form, setForm] = useState({
    currentWeight: String(settings.startWeight || 221),
    goalWeight: String(settings.goalWeight || 200),
    goalType: 'lose',
    activityLevel: 'moderate',
    timeline: 'moderate',
  });

  const heightCm = parseHeightToCm(settings.height || "6'1\"");
  const age = settings.age || 48;
  const currentWt = parseFloat(form.currentWeight) || 221;
  const goalWt = parseFloat(form.goalWeight) || 200;
  const bmr = (10 * currentWt * 0.453592) + (6.25 * heightCm) - (5 * age) - 5;
  const activityMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725 }[form.activityLevel];
  const tdee = bmr * activityMult;

  let calories, protein, weeksToGoal;
  if (form.goalType === 'lose') {
    const deficit = { slow: 250, moderate: 500, aggressive: 750 }[form.timeline];
    calories = Math.round(Math.max(1200, tdee - deficit));
    protein = Math.round(currentWt * 0.8);
    const rate = { slow: 0.5, moderate: 1.0, aggressive: 1.5 }[form.timeline];
    const lbsToLose = Math.max(0, currentWt - goalWt);
    weeksToGoal = lbsToLose > 0 ? Math.ceil(lbsToLose / rate) : null;
  } else if (form.goalType === 'gain') {
    calories = Math.round(Math.min(4000, tdee + 300));
    protein = Math.round(currentWt * 1.0);
    weeksToGoal = null;
  } else {
    calories = Math.round(tdee);
    protein = Math.round(currentWt * 0.7);
    weeksToGoal = null;
  }
  const water = Math.max(2, Math.min(6, Math.round(currentWt / 2 / 32)));

  let goalDate = null;
  if (weeksToGoal) {
    const d = new Date();
    d.setDate(d.getDate() + weeksToGoal * 7);
    goalDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const handleSave = () => {
    updateSettings({ startWeight: currentWt, goalWeight: goalWt, calories, protein, waterBottles: water });
    notify('Goals updated! All targets recalculated. ✓');
    onClose();
  };

  const PillGroup = ({ label, value, options, onChange }) => (
    <div className="mb-4">
      <div className="text-sm text-white/50 mb-2">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer active:scale-95 transition-all
              ${value === opt.value ? 'bg-blue-500 text-white' : 'bg-white/[0.08] text-white/60'}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1a1d2e] border border-white/[0.1] rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <h2 className="text-[20px] font-bold">Edit Goal</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/[0.06] border-none cursor-pointer text-white/60 text-lg">✕</button>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-sm text-white/50 mb-2">Current weight (lbs)</div>
              <input type="text" inputMode="decimal" autoComplete="off" value={form.currentWeight}
                onChange={e => setForm(f => ({ ...f, currentWeight: e.target.value }))}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 py-3 text-[17px] text-white outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <div className="text-sm text-white/50 mb-2">Goal weight (lbs)</div>
              <input type="text" inputMode="decimal" autoComplete="off" value={form.goalWeight}
                onChange={e => setForm(f => ({ ...f, goalWeight: e.target.value }))}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 py-3 text-[17px] text-white outline-none focus:border-blue-500/50" />
            </div>
          </div>
          <PillGroup label="Goal" value={form.goalType}
            options={[{ value: 'lose', label: 'Lose weight' }, { value: 'maintain', label: 'Maintain' }, { value: 'gain', label: 'Gain muscle' }]}
            onChange={v => setForm(f => ({ ...f, goalType: v }))} />
          <PillGroup label="Activity level" value={form.activityLevel}
            options={[{ value: 'sedentary', label: 'Sedentary' }, { value: 'light', label: 'Light' }, { value: 'moderate', label: 'Moderate' }, { value: 'very_active', label: 'Very Active' }]}
            onChange={v => setForm(f => ({ ...f, activityLevel: v }))} />
          {form.goalType === 'lose' && (
            <PillGroup label="Pace" value={form.timeline}
              options={[{ value: 'slow', label: 'Slow (−0.5/wk)' }, { value: 'moderate', label: 'Moderate (−1/wk)' }, { value: 'aggressive', label: 'Aggressive (−1.5/wk)' }]}
              onChange={v => setForm(f => ({ ...f, timeline: v }))} />
          )}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-4 mb-4">
            <div className="text-sm font-semibold text-white/60 mb-3">Calculated targets:</div>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-[16px] text-white/70">Daily calories</span><span className="text-[16px] font-bold text-amber-400">{calories.toLocaleString()} cal</span></div>
              <div className="flex justify-between"><span className="text-[16px] text-white/70">Daily protein</span><span className="text-[16px] font-bold text-blue-400">{protein}g</span></div>
              <div className="flex justify-between"><span className="text-[16px] text-white/70">Water target</span><span className="text-[16px] font-bold text-cyan-400">{water} bottles ({water * 32} oz)</span></div>
              {weeksToGoal && <>
                <div className="flex justify-between pt-2 border-t border-white/[0.06]"><span className="text-[16px] text-white/70">Timeline</span><span className="text-[16px] font-bold text-green-400">~{weeksToGoal} weeks</span></div>
                {goalDate && <div className="flex justify-between"><span className="text-[16px] text-white/70">Goal date</span><span className="text-[16px] font-bold text-white/60">{goalDate}</span></div>}
              </>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave}
              className="flex-1 bg-green-500 text-white rounded-2xl py-4 text-[17px] font-bold border-none cursor-pointer active:opacity-80">
              Save Goals
            </button>
            <button onClick={onClose}
              className="w-24 bg-white/[0.08] text-white/60 rounded-2xl py-4 text-[17px] border-none cursor-pointer active:opacity-70">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Status Bar (Task 3) ───
function WeeklyStatusBar({ daily, targets }) {
  const weekDates = getCurrentWeekDates();
  const todayStr = getToday();
  const weekData = weekDates.map(({ dateStr, isToday }) => ({
    dateStr,
    data: isToday ? daily : loadDayData(dateStr),
  }));

  const loggedDays = weekData.filter(({ data, dateStr }) =>
    data && dateStr <= todayStr && (data.food.length > 0 || data.water > 0 || data.exercises.length > 0 || data.ranMiles > 0)
  ).length;

  const pastWithFood = weekData.filter(({ data, dateStr }) => data && data.food.length > 0 && dateStr <= todayStr);
  const avgCal = pastWithFood.length > 0
    ? Math.round(pastWithFood.reduce((s, { data }) => s + data.food.reduce((t, f) => t + (f.cal || 0), 0), 0) / pastWithFood.length)
    : 0;
  const avgProtein = pastWithFood.length > 0
    ? Math.round(pastWithFood.reduce((s, { data }) => s + data.food.reduce((t, f) => t + (f.protein || 0), 0), 0) / pastWithFood.length)
    : 0;

  // Weekly motivation summary: show on Monday morning if last week had data
  const now = new Date();
  const isMonday = now.getDay() === 1 && now.getHours() < 14;
  let weeklySummary = null;
  if (isMonday) {
    const lastWeekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 7 - now.getDay() + 1 + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const lastWeekData = lastWeekDates.map(loadDayData).filter(Boolean);
    if (lastWeekData.length > 0) {
      const lwLogged = lastWeekData.filter(d => d.food.length > 0 || d.water > 0).length;
      const lwAvgCal = lastWeekData.filter(d => d.food.length > 0).reduce((s, d) => s + d.food.reduce((t, f) => t + (f.cal || 0), 0), 0) / Math.max(1, lastWeekData.filter(d => d.food.length > 0).length);
      weeklySummary = { logged: lwLogged, avgCal: Math.round(lwAvgCal) };
    }
  }

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3.5 mb-4">
      <div className="text-[15px] font-semibold mb-3">This Week</div>
      <div className="flex justify-between mb-3 px-1">
        {weekDates.map(({ dateStr, dayName, isToday, isFuture }, i) => {
          const dayData = weekData[i].data;
          const status = isFuture ? 'future' : getDayStatus(dayData, targets, dateStr);
          const dotBg = { complete: 'bg-green-500', partial: 'bg-amber-400', empty: 'bg-white/[0.1]', future: 'bg-white/[0.04]' }[status];
          return (
            <div key={dateStr} className="flex flex-col items-center gap-1.5">
              <span className={`text-[12px] font-medium ${isToday ? 'text-white/80' : 'text-white/35'}`}>{dayName}</span>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${dotBg}
                ${isToday ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-[#0f1117]' : ''}
                ${isFuture ? 'opacity-25' : ''}`}>
                {status === 'complete' && <span className="text-white text-xs font-bold">✓</span>}
                {status === 'partial' && <span className="text-white/80 text-base leading-none">·</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-white/40">{loggedDays} of 7 days logged</span>
        {avgCal > 0 && <span className="text-white/40">Avg: {avgCal} cal · {avgProtein}g</span>}
      </div>
      {weeklySummary && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <p className="text-sm text-white/50">
            Last week: {weeklySummary.logged}/7 days · {weeklySummary.avgCal} cal avg
            {weeklySummary.logged >= 5
              ? ' — Great consistency! Keep it up. 💪'
              : weeklySummary.logged >= 3
                ? ' — Every day is a fresh start. Focus on today.'
                : ' — New week, new start. You got this.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Today's Workout Card (Task 6) ───
function TodayWorkoutCard({ daily, onNavigate, onOpenLog }) {
  const schedule = getDaySchedule();
  const workoutType = getTodaysWorkoutType();

  if (schedule === 'rest') {
    return (
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4 mb-4">
        <div className="text-[17px] font-semibold mb-1">🌿 Rest Day</div>
        <div className="text-sm text-white/40">Recovery is part of the program. Hydrate, stretch, sleep well.</div>
      </div>
    );
  }

  if (schedule === 'cardio') {
    return (
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4 mb-4">
        <div className="text-[17px] font-semibold mb-1">🏃 Cardio Day</div>
        <div className="text-sm text-white/40 mb-3">
          {daily.ranMiles > 0 ? `✓ ${daily.ranMiles} miles logged today` : 'Easy run, 30–45 min. Focus on form and breathing.'}
        </div>
        <button onClick={() => onOpenLog?.('I ran ')}
          className="w-full bg-blue-500/15 border border-blue-500/30 text-blue-300 rounded-xl py-3
            text-[15px] font-semibold cursor-pointer active:opacity-70">
          {daily.ranMiles > 0 ? '+ Log more miles' : 'Log Run →'}
        </button>
      </div>
    );
  }

  if (schedule === 'longrun') {
    return (
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4 mb-4">
        <div className="text-[17px] font-semibold mb-1">🏅 Long Run Day</div>
        <div className="text-sm text-white/40 mb-3">
          {daily.ranMiles > 0 ? `✓ ${daily.ranMiles} miles — great work!` : 'Target: 5–8 miles at conversational pace. Fuel up first.'}
        </div>
        <button onClick={() => onOpenLog?.('I ran ')}
          className="w-full bg-blue-500/15 border border-blue-500/30 text-blue-300 rounded-xl py-3
            text-[15px] font-semibold cursor-pointer active:opacity-70">
          {daily.ranMiles > 0 ? '+ Log more miles' : 'Log Long Run →'}
        </button>
      </div>
    );
  }

  // Strength day
  const workout = workoutType === 'A' ? WORKOUT_A : WORKOUT_B;
  const isWorkoutDone = daily.exercises.length >= workout.length;
  const muscleGroups = workoutType === 'A'
    ? [['chest', 'Chest'], ['quads', 'Quads'], ['back', 'Back'], ['core', 'Core']]
    : [['hamstrings', 'Hamstrings'], ['shoulders', 'Shoulders'], ['back', 'Back'], ['legs', 'Legs']];
  const description = workoutType === 'A'
    ? 'Compound push & squat movements for balanced upper/lower strength'
    : 'Hinge & pull movements for posterior chain and shoulder health';

  return (
    <div className={`border rounded-2xl px-4 py-4 mb-4 ${isWorkoutDone ? 'bg-green-500/[0.04] border-green-500/25' : 'bg-white/[0.05] border-white/[0.08]'}`}>
      <div className="text-[17px] font-semibold mb-2">
        {isWorkoutDone ? '✓ ' : ''}Workout {workoutType} — {workoutType === 'A' ? 'Push & Squat' : 'Pull & Hinge'}
        {daily.exercises.length > 0 && !isWorkoutDone && (
          <span className="text-sm text-amber-400 font-normal ml-2">({daily.exercises.length}/{workout.length} done)</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {muscleGroups.map(([key, label]) => (
          <span key={key} className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${MUSCLE_COLORS[key]}25`, color: MUSCLE_COLORS[key] }}>
            {label}
          </span>
        ))}
      </div>
      <div className="text-sm text-white/40 mb-3">{description}</div>
      <div className="flex gap-2">
        <button onClick={() => onNavigate?.('gym')}
          className={`flex-1 rounded-xl py-3 text-[15px] font-bold border-none cursor-pointer active:opacity-80
            ${isWorkoutDone ? 'bg-green-500/20 text-green-300' : 'bg-blue-500 text-white'}`}>
          {isWorkoutDone ? 'View Workout' : 'Start Workout →'}
        </button>
        <button onClick={() => onNavigate?.('gym')}
          className="flex-1 bg-white/[0.08] text-white/70 rounded-xl py-3 text-[15px] font-semibold
            border-none cursor-pointer active:opacity-70">
          Change Focus
        </button>
      </div>
    </div>
  );
}

// ─── Quick Log Row ───
function QuickLogRow({ totalCal, totalProtein, daily, targets, latest, onOpenLog }) {
  const items = [
    { icon: '🥗', label: 'Food', status: totalCal > 0 ? `${totalCal} cal` : '—', color: totalCal > targets.calories * 1.1 ? 'text-red-400' : totalCal > 0 ? 'text-amber-400' : 'text-white/30', action: () => onOpenLog?.('I ate ') },
    { icon: '💧', label: 'Water', status: `${daily.water}/${targets.waterBottles}`, color: daily.water >= targets.waterBottles ? 'text-green-400' : daily.water > 0 ? 'text-blue-400' : 'text-white/30', action: () => onOpenLog?.('drank water') },
    { icon: '🏃', label: 'Run', status: daily.ranMiles > 0 ? `${daily.ranMiles}mi` : '—', color: daily.ranMiles > 0 ? 'text-green-400' : 'text-white/30', action: () => onOpenLog?.('I ran ') },
    { icon: '⚖️', label: 'Weight', status: latest?.weight ? `${latest.weight}` : '—', color: latest?.weight ? 'text-white/60' : 'text-white/30', action: () => onOpenLog?.('weight is ') },
  ];
  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-3 mb-4">
      <div className="grid grid-cols-4 gap-2">
        {items.map(item => (
          <button key={item.label} onClick={item.action}
            className="flex flex-col items-center gap-1.5 py-3 bg-white/[0.04] rounded-xl
              border border-white/[0.05] cursor-pointer active:opacity-70 active:scale-95 transition-all">
            <span className="text-[24px] leading-none">{item.icon}</span>
            <span className="text-[13px] font-semibold text-white/80">{item.label}</span>
            <span className={`text-[12px] font-medium ${item.color}`}>{item.status}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main DashboardTab ───
export function DashboardTab({
  daily, totalCal, totalProtein,
  addFood, removeFood, setWater, toggleMeditation, addRun,
  weighIns, addWeighIn, latest, startWeight, goalWeight, targets, name,
  notify, onNavigate, onOpenLog,
  settings, updateSettings,
}) {
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const currentWeight = latest?.weight || startWeight;

  // Achievement: all goals met today (show once per day)
  useEffect(() => {
    const dow = new Date().getDay();
    const isRest = dow === 0;
    const isStrength = [1, 3, 5].includes(dow);
    const allGoalsMet = (
      daily.food.length > 0 &&
      totalProtein >= targets.protein &&
      daily.water >= targets.waterBottles &&
      (isRest || (isStrength ? daily.exercises.length >= 1 : daily.ranMiles > 0))
    );
    if (allGoalsMet) {
      const key = `achievement-all-goals-${getToday()}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        notify('Perfect day! All goals hit 🎉');
      }
    }
  }, [daily, totalProtein, targets, notify]);

  const handleWeighIn = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 100 || w > 400) return;
    addWeighIn(w);
    setWeightInput('');
    notify(`${w} lbs logged`);
  };

  const todayLogged = weighIns?.find(w => w.date === getToday());

  return (
    <div className="px-4 pb-8" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
      {/* Goal Banner */}
      <GoalBanner startWeight={startWeight} goalWeight={goalWeight || 200} weighIns={weighIns} onEdit={() => setShowGoalEditor(true)} />

      {/* Daily Quote */}
      <div className="mb-4 px-1">
        <p className="text-[16px] text-white/50 italic leading-relaxed">"{getDailyQuote()}"</p>
      </div>

      {/* Greeting + Weight */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[26px] font-bold leading-tight">{getGreeting()}, {name || 'Jason'}</div>
          <div className="text-sm text-white/40 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
        {currentWeight && (
          <div className="text-right">
            <div className="text-[26px] font-bold leading-none">{currentWeight}</div>
            <div className="text-sm text-white/40">lbs</div>
          </div>
        )}
      </div>

      {/* Scheduled Meals */}
      <ScheduledMealsBanner daily={daily} addFood={addFood} notify={notify} />

      {/* Reminder */}
      <ReminderBanner daily={daily} targets={targets} weighIns={weighIns || []} totalCal={totalCal} totalProtein={totalProtein} onNavigate={onNavigate} onOpenLog={onOpenLog} />

      {/* Weekly Status Bar */}
      <WeeklyStatusBar daily={daily} targets={targets} />

      {/* Today's Workout */}
      <TodayWorkoutCard daily={daily} onNavigate={onNavigate} onOpenLog={onOpenLog} />

      {/* Quick Log */}
      <QuickLogRow totalCal={totalCal} totalProtein={totalProtein} daily={daily} targets={targets} latest={latest} onOpenLog={onOpenLog} />

      {/* Wednesday weigh-in */}
      {isWednesday() && !todayLogged && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-4 mb-4">
          <div className="text-[17px] font-semibold text-amber-400 mb-3">⚖️ Wednesday Weigh-In</div>
          <div className="flex gap-2">
            <input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done"
              value={weightInput} onChange={e => setWeightInput(e.target.value)}
              placeholder="Weight (lbs)"
              className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 py-3 text-[17px] text-white outline-none placeholder:text-white/30" />
            <button onClick={handleWeighIn}
              className="bg-amber-500 text-white font-bold rounded-xl px-5 py-3 border-none cursor-pointer active:scale-95">Log</button>
          </div>
        </div>
      )}

      {/* Goal editor modal */}
      {showGoalEditor && settings && updateSettings && (
        <GoalEditorModal settings={settings} updateSettings={updateSettings} notify={notify} onClose={() => setShowGoalEditor(false)} />
      )}
    </div>
  );
}
