import { useState } from 'react';
import { isWednesday, getToday, getTodaysWorkoutType, getDaySchedule, WORKOUT_A, WORKOUT_B } from '../data/constants';
import { load, save } from '../data/storage';

const FAVORITE_FOODS_KEY = 'favorite-foods';

// ─── Daily Quotes ───
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

function getDayStatus(dayData, targets) {
  if (!dayData) return 'empty';
  const hasFood = dayData.food.length > 0;
  const hasWater = dayData.water >= targets.waterBottles;
  if (!hasFood && dayData.water === 0 && dayData.exercises.length === 0 && dayData.ranMiles === 0) return 'empty';
  if (hasFood && hasWater) return 'complete';
  return 'partial';
}

// ─── Simple Progress Bar ───
function ProgressBar({ value, max, color }) {
  const pct = Math.min(Math.max(value / (max || 1), 0), 1);
  return (
    <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden mt-2">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

// ─── Goal Banner ───
function GoalBanner({ startWeight, goalWeight, weighIns, currentWeight, pace, onEdit }) {
  if (!startWeight || !goalWeight || startWeight <= goalWeight) return null;
  const curWt = currentWeight || startWeight;
  const totalToLose = startWeight - goalWeight;
  const lostSoFar = Math.max(0, startWeight - curWt);
  const pct = Math.min(Math.max(lostSoFar / totalToLose, 0), 1);
  const lbsLeft = Math.max(curWt - goalWeight, 0);

  // Always use pace setting so changing pace immediately updates the timeline
  const weeklyRate = pace === 'fast' ? 1.5 : pace === 'slow' ? 0.5 : 1.0;
  const weeksLeft = lbsLeft > 0 ? Math.ceil(lbsLeft / weeklyRate) : 0;

  let goalDate = null;
  if (weeksLeft > 0) {
    const d = new Date();
    d.setDate(d.getDate() + weeksLeft * 7);
    goalDate = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const paceColor = pct >= 0.5 ? '#22c55e' : '#3b82f6';

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-white/70">MY GOAL</span>
        <button onClick={onEdit}
          className="bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold
            rounded-xl px-4 h-12 text-base cursor-pointer active:opacity-70 border-solid">
          Edit Goal
        </button>
      </div>
      <div className="text-xl font-bold mb-3">
        Lose {totalToLose} lbs to reach {goalWeight} lbs
      </div>
      <div className="h-3 bg-white/[0.08] rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct * 100}%`, background: paceColor }} />
      </div>
      <div className="flex justify-between items-center text-base text-white/50">
        <span>{Math.round(pct * 100)}% · {lbsLeft.toFixed(1)} lbs to go</span>
        {weeksLeft > 0 && goalDate && <span>~{weeksLeft}w · {goalDate}</span>}
      </div>
    </div>
  );
}

// ─── Goal Editor — Full Screen ───
function GoalEditorPage({ settings, updateSettings, notify, onClose }) {
  const heightCmInit = parseHeightToCm(settings.height || "6'1\"");
  const totalInInit = Math.round(heightCmInit / 2.54);
  const [form, setForm] = useState({
    currentWeight: String(settings.startWeight || 221),
    goalWeight: String(settings.goalWeight || 200),
    heightFt: String(Math.floor(totalInInit / 12)),
    heightIn: String(totalInInit % 12),
    age: String(settings.age || 48),
    goalType: settings.goal === 'muscle' ? 'muscle' : 'lose',
    pace: settings.pace || 'moderate',
  });

  const currentWt = parseFloat(form.currentWeight) || 221;
  const goalWt = parseFloat(form.goalWeight) || 200;
  const heightCm = ((parseInt(form.heightFt) || 6) * 12 + (parseInt(form.heightIn) || 1)) * 2.54;
  const age = parseInt(form.age) || 48;
  const bmr = (10 * currentWt * 0.453592) + (6.25 * heightCm) - (5 * age) - 5;
  const tdee = Math.round(bmr * 1.55);

  const deficits = { fast: 750, moderate: 500, slow: 250 };
  const rates = { fast: 1.5, moderate: 1.0, slow: 0.5 };

  let calories, protein, water, weeksToGoal;
  if (form.goalType === 'lose') {
    calories = Math.max(1200, Math.round(tdee - deficits[form.pace]));
    protein = Math.round(currentWt * 0.73);
    const lbsToLose = Math.max(0, currentWt - goalWt);
    weeksToGoal = lbsToLose > 0 ? Math.ceil(lbsToLose / rates[form.pace]) : null;
  } else {
    calories = Math.round(Math.min(4000, tdee + 300));
    protein = Math.round(currentWt * 1.0);
    weeksToGoal = null;
  }
  water = Math.max(2, Math.min(8, Math.round(currentWt / 2 / 32)));

  let goalDate = null;
  if (weeksToGoal) {
    const d = new Date();
    d.setDate(d.getDate() + weeksToGoal * 7);
    goalDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const handleSave = () => {
    const heightStr = `${form.heightFt}'${form.heightIn}"`;
    updateSettings({
      startWeight: currentWt,
      goalWeight: goalWt,
      height: heightStr,
      age,
      calories,
      protein,
      waterBottles: water,
      goal: form.goalType === 'lose' ? 'fat-loss' : form.goalType,
      pace: form.pace,
    });
    notify('Plan updated!');
    onClose();
  };

  const PillRow = ({ label, value, options, onChange }) => (
    <div className="mb-5">
      <div className="text-base font-semibold text-white/60 mb-2">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`px-5 h-14 rounded-2xl text-base font-bold cursor-pointer active:scale-95 transition-all border-solid
              ${value === opt.value
                ? 'bg-blue-500 text-white border border-blue-400'
                : 'bg-white/[0.08] text-white/60 border border-white/[0.12]'}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const inputClass = "w-full bg-white/[0.08] border border-white/[0.12] rounded-2xl px-5 h-14 text-xl text-white outline-none focus:border-blue-500/60";

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
      <div className="flex items-center gap-3 px-4 mb-6">
        <button onClick={onClose}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-2xl border-none cursor-pointer flex items-center justify-center active:opacity-70">
          ‹
        </button>
        <h1 className="text-2xl font-bold">EDIT MY GOAL</h1>
      </div>

      <div className="px-4">
        <div className="mb-5">
          <div className="text-base font-semibold text-white/60 mb-2">Current Weight</div>
          <input type="text" inputMode="decimal" autoComplete="off"
            value={form.currentWeight}
            onChange={e => setForm(f => ({ ...f, currentWeight: e.target.value }))}
            className={inputClass} placeholder="221" />
          <div className="text-base text-white/40 mt-1">lbs</div>
        </div>

        <div className="mb-5">
          <div className="text-base font-semibold text-white/60 mb-2">Goal Weight</div>
          <input type="text" inputMode="decimal" autoComplete="off"
            value={form.goalWeight}
            onChange={e => setForm(f => ({ ...f, goalWeight: e.target.value }))}
            className={inputClass} placeholder="200" />
          <div className="text-base text-white/40 mt-1">lbs</div>
        </div>

        <div className="mb-5">
          <div className="text-base font-semibold text-white/60 mb-2">Height</div>
          <div className="flex gap-3">
            <div className="flex-1">
              <input type="text" inputMode="numeric" autoComplete="off"
                value={form.heightFt}
                onChange={e => setForm(f => ({ ...f, heightFt: e.target.value }))}
                className={inputClass} placeholder="6" />
              <div className="text-base text-white/40 mt-1">ft</div>
            </div>
            <div className="flex-1">
              <input type="text" inputMode="numeric" autoComplete="off"
                value={form.heightIn}
                onChange={e => setForm(f => ({ ...f, heightIn: e.target.value }))}
                className={inputClass} placeholder="1" />
              <div className="text-base text-white/40 mt-1">in</div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <div className="text-base font-semibold text-white/60 mb-2">Age</div>
          <input type="text" inputMode="numeric" autoComplete="off"
            value={form.age}
            onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
            className={inputClass} placeholder="48" />
        </div>

        <PillRow label="My Goal Is"
          value={form.goalType}
          options={[
            { value: 'lose', label: 'Lose Fat' },
            { value: 'muscle', label: 'Build Muscle' },
          ]}
          onChange={v => setForm(f => ({ ...f, goalType: v }))} />

        {form.goalType === 'lose' && (
          <PillRow label="My Pace"
            value={form.pace}
            options={[
              { value: 'fast', label: 'Fast (1.5 lb/wk)' },
              { value: 'moderate', label: 'Moderate (1 lb/wk)' },
              { value: 'slow', label: 'Slow (0.5 lb/wk)' },
            ]}
            onChange={v => setForm(f => ({ ...f, pace: v }))} />
        )}

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-5 mb-5">
          <div className="text-base font-bold text-white/50 mb-4 uppercase tracking-wide">Based on Your Numbers:</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg text-white/70">Daily Calories</span>
              <span className="text-2xl font-bold text-amber-400">{calories.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg text-white/70">Daily Protein</span>
              <span className="text-2xl font-bold text-blue-400">{protein}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg text-white/70">Daily Water</span>
              <span className="text-2xl font-bold text-cyan-400">{water * 32} oz</span>
            </div>
            {weeksToGoal && (
              <>
                <div className="flex justify-between items-center border-t border-white/[0.06] pt-3">
                  <span className="text-lg text-white/70">Weeks to Goal</span>
                  <span className="text-2xl font-bold text-green-400">{weeksToGoal} wk</span>
                </div>
                {goalDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-white/70">Goal Date</span>
                    <span className="text-lg font-semibold text-white/60">{goalDate}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-5 mb-6">
          <div className="text-base font-bold text-white/50 mb-3 uppercase tracking-wide">Why These Numbers:</div>
          <div className="space-y-3 text-base text-white/60 leading-relaxed">
            <p><span className="text-white/80 font-semibold">Calories:</span> Your body burns ~{tdee.toLocaleString()} cal/day.{form.goalType === 'lose' ? ` Minus ${deficits[form.pace]} = ${calories.toLocaleString()} for ~${rates[form.pace]} lb/week loss.` : ' Plus 300 cal surplus for muscle growth.'}</p>
            <p><span className="text-white/80 font-semibold">Protein:</span> At {Math.round(currentWt)} lbs, {form.goalType === 'lose' ? '0.73' : '1.0'}g per lb = {protein}g to {form.goalType === 'lose' ? 'preserve muscle while losing fat' : 'maximize muscle protein synthesis'}.</p>
            <p><span className="text-white/80 font-semibold">Water:</span> Half your body weight in oz = ~{Math.round(currentWt / 2)} oz, rounded to {water * 32} oz ({water} bottles).</p>
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full bg-green-500 text-white rounded-2xl h-14 text-xl font-bold border-none cursor-pointer active:opacity-80">
          SAVE CHANGES
        </button>
        <button onClick={onClose}
          className="w-full bg-transparent text-white/40 h-12 text-base border-none cursor-pointer mt-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Edit Food Modal ───
function EditFoodModal({ food, onSave, onClose, notify }) {
  const [form, setForm] = useState({
    name: food.name || '',
    cal: String(food.cal || 0),
    protein: String(food.protein || 0),
    fat: String(food.fat || 0),
    carbs: String(food.carbs || 0),
    fiber: String(food.fiber || 0),
    meal: food.meal || 'breakfast',
  });
  const [showNewNamePrompt, setShowNewNamePrompt] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');

  const MEALS = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'snack', label: 'Snack' },
  ];

  const inputClass = "w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-lg text-white outline-none focus:border-blue-500/60";

  const handleSaveChanges = () => {
    onSave(food.id, {
      name: form.name,
      cal: parseInt(form.cal) || 0,
      protein: parseInt(form.protein) || 0,
      fat: parseInt(form.fat) || 0,
      carbs: parseInt(form.carbs) || 0,
      fiber: parseInt(form.fiber) || 0,
      meal: form.meal,
    });
    notify('Food updated');
    onClose();
  };

  const handleSaveFavorite = () => {
    const favorites = load(FAVORITE_FOODS_KEY, []);
    const entry = {
      id: `fav-${Date.now()}`,
      name: form.name,
      cal: parseInt(form.cal) || 0,
      protein: parseInt(form.protein) || 0,
      fat: parseInt(form.fat) || 0,
      carbs: parseInt(form.carbs) || 0,
      fiber: parseInt(form.fiber) || 0,
    };
    const deduped = favorites.filter(f => f.name.toLowerCase() !== entry.name.toLowerCase());
    save(FAVORITE_FOODS_KEY, [entry, ...deduped]);
    notify(`Saved "${entry.name}" as favorite`);
    onClose();
  };

  const handleSaveAsNew = () => {
    if (!newFoodName.trim()) return;
    const favorites = load(FAVORITE_FOODS_KEY, []);
    const entry = {
      id: `fav-${Date.now()}`,
      name: newFoodName.trim(),
      cal: parseInt(form.cal) || 0,
      protein: parseInt(form.protein) || 0,
      fat: parseInt(form.fat) || 0,
      carbs: parseInt(form.carbs) || 0,
      fiber: parseInt(form.fiber) || 0,
    };
    save(FAVORITE_FOODS_KEY, [...favorites, entry]);
    notify(`Saved "${entry.name}" as new favorite`);
    setShowNewNamePrompt(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
      <div className="flex items-center gap-3 px-4 mb-6">
        <button onClick={onClose}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-2xl border-none cursor-pointer flex items-center justify-center active:opacity-70">
          ‹
        </button>
        <h1 className="text-2xl font-bold">EDIT FOOD</h1>
      </div>

      <div className="px-4 space-y-4">
        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Name</div>
          <input type="text" inputMode="text" autoComplete="off"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-base font-semibold text-white/60 mb-2">Calories</div>
            <input type="text" inputMode="numeric" autoComplete="off"
              value={form.cal} onChange={e => setForm(f => ({ ...f, cal: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <div className="text-base font-semibold text-white/60 mb-2">Protein (g)</div>
            <input type="text" inputMode="numeric" autoComplete="off"
              value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
              className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'fat', label: 'Fat (g)' },
            { k: 'carbs', label: 'Carbs (g)' },
            { k: 'fiber', label: 'Fiber (g)' },
          ].map(({ k, label }) => (
            <div key={k}>
              <div className="text-base text-white/50 mb-2">{label}</div>
              <input type="text" inputMode="numeric" autoComplete="off"
                value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 h-14 text-base text-white outline-none focus:border-blue-500/60" />
            </div>
          ))}
        </div>

        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Meal</div>
          <div className="flex gap-2">
            {MEALS.map(m => (
              <button key={m.key} onClick={() => setForm(f => ({ ...f, meal: m.key }))}
                className={`flex-1 h-12 rounded-xl text-base font-semibold border-none cursor-pointer active:scale-95 transition-all
                  ${form.meal === m.key ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-white/50'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <button onClick={handleSaveChanges}
            className="w-full bg-green-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80">
            Save Changes
          </button>
          <button onClick={handleSaveFavorite}
            className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80">
            Save as Favorite ☆
          </button>
          <button onClick={() => setShowNewNamePrompt(true)}
            className="w-full bg-white/[0.08] border border-white/[0.1] text-white/70 rounded-2xl h-14 text-lg font-semibold border-solid cursor-pointer active:opacity-70">
            Save as New Food
          </button>
          <button onClick={onClose}
            className="w-full bg-transparent text-white/40 h-12 text-base border-none cursor-pointer">
            Cancel
          </button>
        </div>

        {showNewNamePrompt && (
          <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl px-4 py-4">
            <div className="text-base font-semibold text-white/60 mb-2">New food name:</div>
            <input type="text" inputMode="text" autoComplete="off"
              value={newFoodName}
              onChange={e => setNewFoodName(e.target.value)}
              placeholder={`${form.name} — variation`}
              className={inputClass} />
            <div className="flex gap-2 mt-3">
              <button onClick={handleSaveAsNew}
                className="flex-1 bg-green-500 text-white rounded-xl h-12 text-base font-bold border-none cursor-pointer active:opacity-80">
                Save
              </button>
              <button onClick={() => setShowNewNamePrompt(false)}
                className="flex-1 bg-white/[0.08] text-white/50 rounded-xl h-12 text-base border-none cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Muscle Selector ───
const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Chest', group: 'UPPER BODY' },
  { id: 'shoulders', label: 'Shoulders', group: 'UPPER BODY' },
  { id: 'arms', label: 'Arms', group: 'UPPER BODY' },
  { id: 'back', label: 'Back', group: 'UPPER BODY' },
  { id: 'core', label: 'Core', group: 'UPPER BODY' },
  { id: 'quads', label: 'Quads', group: 'LOWER BODY' },
  { id: 'hamstrings', label: 'Hamstrings', group: 'LOWER BODY' },
  { id: 'glutes', label: 'Glutes', group: 'LOWER BODY' },
  { id: 'calves', label: 'Calves', group: 'LOWER BODY' },
];

const PRESET_WORKOUTS = [
  { id: 'total-body', label: 'Total Body', muscles: ['chest', 'back', 'quads', 'core'] },
  { id: 'quick-15', label: 'Quick 15-Min Full Body', muscles: ['chest', 'back', 'quads'] },
  { id: 'bodyweight', label: 'Bodyweight Only', muscles: ['chest', 'core', 'glutes'] },
  { id: 'apple-fitness', label: 'Apple Fitness+ Total Body', muscles: ['chest', 'back', 'quads', 'core', 'shoulders'] },
];

const MUSCLE_EXERCISE_MAP = {
  chest: [
    { name: 'DB Bench Press', sets: 3, reps: 12, defaultWeight: 30 },
    { name: 'Push-up', sets: 3, reps: 15, defaultWeight: 0 },
  ],
  back: [
    { name: 'Lat Pulldown', sets: 3, reps: 12, defaultWeight: 85 },
    { name: 'DB Row (each arm)', sets: 3, reps: 12, defaultWeight: 25 },
  ],
  shoulders: [
    { name: 'Overhead Press', sets: 3, reps: 12, defaultWeight: 27.5 },
    { name: 'Lateral Raise', sets: 3, reps: 15, defaultWeight: 12 },
  ],
  arms: [
    { name: 'DB Curl', sets: 3, reps: 12, defaultWeight: 20 },
    { name: 'Tricep Dip', sets: 3, reps: 12, defaultWeight: 0 },
  ],
  quads: [
    { name: 'Goblet Squat', sets: 3, reps: 12, defaultWeight: 30 },
    { name: 'Bulgarian Split Squat', sets: 3, reps: 10, defaultWeight: 20 },
  ],
  hamstrings: [
    { name: 'DB Romanian Deadlift', sets: 3, reps: 12, defaultWeight: 25 },
    { name: 'Leg Curl', sets: 3, reps: 12, defaultWeight: 60 },
  ],
  glutes: [
    { name: 'DB Reverse Lunge (each)', sets: 3, reps: 10, defaultWeight: 20 },
    { name: 'Hip Thrust', sets: 3, reps: 12, defaultWeight: 25 },
  ],
  calves: [
    { name: 'Calf Raise', sets: 3, reps: 20, defaultWeight: 0 },
  ],
  core: [
    { name: 'Plank', sets: 3, reps: 45, defaultWeight: 0 },
    { name: 'Dead Bug', sets: 3, reps: 10, defaultWeight: 0 },
  ],
};

function MuscleSelectorPage({ onClose, onApply }) {
  const [selected, setSelected] = useState([]);
  const [generated, setGenerated] = useState(null);

  const toggle = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );

  const applyPreset = (preset) => setSelected(preset.muscles.slice(0, 3));

  const generate = () => {
    const exercises = [];
    const usedNames = new Set();
    selected.forEach(area => {
      (MUSCLE_EXERCISE_MAP[area] || []).forEach(ex => {
        if (!usedNames.has(ex.name) && exercises.length < 5) {
          exercises.push(ex);
          usedNames.add(ex.name);
        }
      });
    });
    setGenerated(exercises);
  };

  if (generated) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0f1117] overflow-y-auto"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
        <div className="flex items-center gap-3 px-4 mb-5">
          <button onClick={() => setGenerated(null)}
            className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-2xl border-none cursor-pointer flex items-center justify-center active:opacity-70">
            ‹
          </button>
          <h1 className="text-2xl font-bold">YOUR WORKOUT</h1>
        </div>
        <div className="px-4">
          <div className="text-base text-white/50 mb-4">
            {selected.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')} · {generated.length} exercises
          </div>
          {generated.map((ex, i) => (
            <div key={i} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-3">
              <div className="text-xl font-bold">{ex.name}</div>
              <div className="text-base text-white/50">{ex.sets}×{ex.reps} @ {ex.defaultWeight} lbs</div>
            </div>
          ))}
          <button onClick={() => onApply(generated)}
            className="w-full bg-blue-500 text-white rounded-2xl h-14 text-xl font-bold border-none cursor-pointer active:opacity-80 mt-2">
            BUILD MY WORKOUT →
          </button>
        </div>
      </div>
    );
  }

  const groups = ['UPPER BODY', 'LOWER BODY'];

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
      <div className="flex items-center gap-3 px-4 mb-5">
        <button onClick={onClose}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-2xl border-none cursor-pointer flex items-center justify-center active:opacity-70">
          ‹
        </button>
        <h1 className="text-2xl font-bold">PICK YOUR WORKOUT</h1>
      </div>

      <div className="px-4">
        <div className="text-base text-white/60 mb-5 leading-relaxed">
          What do you want to work on today?<br />
          <span className="text-white/40">Select 1–3 muscle groups:</span>
        </div>

        {groups.map(grp => (
          <div key={grp} className="mb-5">
            <div className="text-base font-bold text-white/40 mb-3">{grp}</div>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.filter(m => m.group === grp).map(m => (
                <button key={m.id} onClick={() => toggle(m.id)}
                  className={`h-14 px-5 rounded-2xl text-base font-bold cursor-pointer active:scale-95 transition-all border-solid
                    ${selected.includes(m.id)
                      ? 'bg-blue-500 text-white border border-blue-400'
                      : 'bg-white/[0.06] text-white/70 border border-white/[0.1]'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="mb-5">
          <div className="text-base font-bold text-white/40 mb-3">PRESET WORKOUTS</div>
          <div className="space-y-2">
            {PRESET_WORKOUTS.map(preset => (
              <button key={preset.id} onClick={() => applyPreset(preset)}
                className="w-full bg-white/[0.06] border border-white/[0.1] text-white/70
                  rounded-2xl px-5 h-14 text-base font-semibold cursor-pointer active:opacity-70 text-left">
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="text-base text-blue-300 mb-4 font-semibold">
            Selected: {selected.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')} ✓
          </div>
        )}

        <button onClick={generate}
          disabled={selected.length === 0}
          className="w-full bg-blue-500 text-white rounded-2xl h-14 text-xl font-bold border-none cursor-pointer active:opacity-80 disabled:opacity-40">
          BUILD MY WORKOUT →
        </button>
      </div>
    </div>
  );
}

// ─── TODAY Card ───
function TodayCard({ totalCal, totalProtein, daily, targets, onOpenLog, setWater }) {
  const waterOz = (daily.water || 0) * 32;
  const targetOz = targets.waterBottles * 32;
  const waterDone = waterOz >= targetOz;

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-5 mb-4">
      <div className="text-lg font-bold text-white/60 mb-4">TODAY</div>

      {/* Calories */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-base text-white/50">Calories</span>
          <span className="text-base text-white/40">of {targets.calories.toLocaleString()}</span>
        </div>
        <div className="text-4xl font-bold text-amber-400 mb-1">{(totalCal || 0).toLocaleString()}</div>
        <ProgressBar value={totalCal || 0} max={targets.calories} color="#f59e0b" />
      </div>

      {/* Protein */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-base text-white/50">Protein</span>
          <span className="text-base text-white/40">of {targets.protein}g</span>
        </div>
        <div className="text-4xl font-bold text-blue-400 mb-1">{totalProtein || 0}g</div>
        <ProgressBar value={totalProtein || 0} max={targets.protein} color="#3b82f6" />
      </div>

      {/* Water — +/- buttons */}
      <div className="mb-5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-base text-white/50">Water</span>
          {waterDone && <span className="text-green-400 text-base font-bold">✓ Goal reached!</span>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-4xl font-bold text-cyan-400">
              {waterOz} <span className="text-2xl">/ {targetOz} oz</span>
              {waterDone && <span className="text-green-400 text-2xl"> ✓</span>}
            </div>
            <ProgressBar value={daily.water || 0} max={targets.waterBottles} color="#06b6d4" />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setWater?.((daily.water || 0) - 1)}
              disabled={(daily.water || 0) === 0}
              className="w-14 h-14 rounded-xl bg-white/[0.08] border border-white/[0.1] text-white/70
                text-2xl font-bold border-solid cursor-pointer active:bg-white/[0.15] disabled:opacity-30">
              −
            </button>
            <button
              onClick={() => setWater?.((daily.water || 0) + 1)}
              className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300
                text-2xl font-bold border-solid cursor-pointer active:bg-cyan-500/30">
              +
            </button>
          </div>
        </div>
        <div className="text-base text-white/30 mt-1">+/− 32 oz per tap</div>
      </div>

      {/* Log Food button */}
      <button onClick={() => onOpenLog?.()}
        className="w-full bg-amber-500/20 border border-amber-500/40 text-amber-300
          rounded-xl h-14 text-lg font-bold cursor-pointer active:opacity-70 border-solid">
        + Log Food
      </button>
    </div>
  );
}

// ─── Today's Food Log ───
function TodayFoodLog({ daily, removeFood, onEditFood, notify }) {
  const food = daily.food || [];
  if (food.length === 0) return null;

  const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];
  const MEAL_LABELS = { breakfast: '🌅 Breakfast', lunch: '☀️ Lunch', snack: '🍿 Snack', dinner: '🌙 Dinner' };

  const byMeal = MEAL_ORDER.reduce((acc, m) => {
    const items = food.filter(f => f.meal === m);
    if (items.length > 0) acc[m] = items;
    return acc;
  }, {});

  const uncategorized = food.filter(f => !MEAL_ORDER.includes(f.meal));

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    removeFood(id);
    notify(`Removed: ${name}`);
  };

  const renderFoodItem = (f) => (
    <div key={f.id}
      className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0 cursor-pointer active:bg-white/[0.03] rounded-lg"
      onClick={() => onEditFood?.(f)}>
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold truncate">{f.name}</div>
        <div className="text-base text-white/45">{f.cal} cal · {f.protein || 0}g protein</div>
      </div>
      <button
        onClick={(e) => handleDelete(e, f.id, f.name)}
        className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 text-xl
          border-none cursor-pointer flex items-center justify-center active:bg-red-500/25 shrink-0">
        ×
      </button>
    </div>
  );

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4">
      <div className="text-lg font-bold text-white/60 mb-1">TODAY'S FOOD</div>
      <div className="text-base text-white/30 mb-3">Tap any item to edit</div>
      {Object.entries(byMeal).map(([meal, items]) => (
        <div key={meal} className="mb-3">
          <div className="text-base font-semibold text-white/40 mb-1">{MEAL_LABELS[meal]}</div>
          {items.map(renderFoodItem)}
        </div>
      ))}
      {uncategorized.length > 0 && (
        <div className="mb-3">
          {uncategorized.map(renderFoodItem)}
        </div>
      )}
      <div className="text-base text-white/30 mt-1">
        {food.length} item{food.length !== 1 ? 's' : ''} · {food.reduce((s, f) => s + (f.cal || 0), 0).toLocaleString()} cal total
      </div>
    </div>
  );
}

// ─── Today's Workout Card ───
function TodayWorkoutCard({ daily, onNavigate, onChooseMuscles }) {
  const schedule = getDaySchedule();
  const workoutType = getTodaysWorkoutType();

  if (schedule === 'rest') {
    return (
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-5 mb-4">
        <div className="text-lg font-bold text-white/60 mb-2">TODAY'S WORKOUT</div>
        <div className="text-xl font-bold mb-1">🌿 Rest Day</div>
        <div className="text-base text-white/40">Recovery is part of the program. Hydrate, stretch, sleep well.</div>
      </div>
    );
  }

  if (schedule === 'cardio') {
    const logged = (daily.ranMiles || 0) > 0;
    return (
      <div className={`border rounded-2xl px-5 py-5 mb-4 ${logged ? 'bg-green-500/[0.04] border-green-500/25' : 'bg-white/[0.05] border-white/[0.08]'}`}>
        <div className="text-lg font-bold text-white/60 mb-2">TODAY'S WORKOUT</div>
        <div className="text-xl font-bold mb-1">{logged ? '✓ ' : ''}🏃 Cardio Day</div>
        <div className="text-base text-white/50 mb-4">{logged ? `${daily.ranMiles} miles logged!` : 'Easy run, 30–45 min. Focus on form.'}</div>
        <button onClick={() => onNavigate?.('gym')}
          className="w-full bg-green-500/20 border border-green-500/40 text-green-300
            rounded-xl h-14 text-base font-bold cursor-pointer active:opacity-70 border-solid">
          {logged ? 'Log More Miles' : 'Log Run →'}
        </button>
      </div>
    );
  }

  if (schedule === 'longrun') {
    const logged = (daily.ranMiles || 0) > 0;
    return (
      <div className={`border rounded-2xl px-5 py-5 mb-4 ${logged ? 'bg-green-500/[0.04] border-green-500/25' : 'bg-white/[0.05] border-white/[0.08]'}`}>
        <div className="text-lg font-bold text-white/60 mb-2">TODAY'S WORKOUT</div>
        <div className="text-xl font-bold mb-1">{logged ? '✓ ' : ''}🏅 Long Run Day</div>
        <div className="text-base text-white/50 mb-4">{logged ? `${daily.ranMiles} miles — great work!` : '5–8 miles at conversational pace. Fuel up first.'}</div>
        <button onClick={() => onNavigate?.('gym')}
          className="w-full bg-green-500/20 border border-green-500/40 text-green-300
            rounded-xl h-14 text-base font-bold cursor-pointer active:opacity-70 border-solid">
          {logged ? 'Log More Miles' : 'Log Long Run →'}
        </button>
      </div>
    );
  }

  // Strength day
  const workout = workoutType === 'A' ? WORKOUT_A : WORKOUT_B;
  const isWorkoutDone = (daily.exercises || []).length >= workout.length;
  const muscleDesc = workoutType === 'A' ? 'Chest, Back, Quads, Core' : 'Hamstrings, Shoulders, Back';
  const totalVolume = (daily.exercises || []).reduce((sum, e) => sum + (e.weight || 0) * (e.sets || 3) * (e.reps || 12), 0);

  return (
    <div className={`border rounded-2xl px-5 py-5 mb-4 ${isWorkoutDone ? 'bg-green-500/[0.04] border-green-500/25' : 'bg-white/[0.05] border-white/[0.08]'}`}>
      <div className="text-lg font-bold text-white/60 mb-2">TODAY'S WORKOUT</div>
      {isWorkoutDone ? (
        <>
          <div className="text-xl font-bold text-green-400 mb-1">✓ Workout {workoutType} Complete!</div>
          <div className="text-base text-white/50 mb-4">
            {daily.exercises.length} exercises · {totalVolume.toLocaleString()} lbs volume
          </div>
          <button onClick={() => onNavigate?.('gym')}
            className="w-full bg-green-500/20 border border-green-500/40 text-green-300
              rounded-xl h-14 text-base font-bold cursor-pointer active:opacity-70 border-solid">
            View Details
          </button>
        </>
      ) : (
        <>
          <div className="text-xl font-bold mb-1">Workout {workoutType} — {muscleDesc}</div>
          <div className="text-base text-white/50 mb-4">
            {workout.length} exercises · ~25 min
            {(daily.exercises || []).length > 0 && (
              <span className="text-amber-400"> · {daily.exercises.length}/{workout.length} done</span>
            )}
          </div>
          <button onClick={() => onNavigate?.('gym')}
            className="w-full bg-blue-500 text-white rounded-xl h-14 text-lg font-bold
              border-none cursor-pointer active:opacity-80 mb-3">
            {(daily.exercises || []).length > 0 ? 'Continue Workout →' : 'Start Workout →'}
          </button>
          <button onClick={onChooseMuscles}
            className="w-full bg-white/[0.08] border border-white/[0.1] text-white/70
              rounded-xl h-14 text-base font-semibold cursor-pointer active:opacity-70 border-solid">
            Choose Different Muscles
          </button>
        </>
      )}
    </div>
  );
}

// ─── This Week ───
function WeeklyStatusBar({ daily, targets }) {
  const weekDates = getCurrentWeekDates();
  const todayStr = getToday();
  const weekData = weekDates.map(({ dateStr, isToday }) => ({
    dateStr,
    data: isToday ? {
      food: daily.food || [],
      water: daily.water || 0,
      exercises: daily.exercises || [],
      ranMiles: daily.ranMiles || 0,
    } : loadDayData(dateStr),
  }));

  const loggedDays = weekData.filter(({ data, dateStr }) =>
    data && dateStr <= todayStr && (data.food.length > 0 || data.water > 0 || data.exercises.length > 0 || data.ranMiles > 0)
  ).length;

  return (
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-4">
      <div className="text-lg font-bold text-white/60 mb-3">THIS WEEK</div>
      <div className="flex justify-between mb-3 px-1">
        {weekDates.map(({ dateStr, dayName, isToday, isFuture }, i) => {
          const dayData = weekData[i].data;
          const status = isFuture ? 'future' : getDayStatus(dayData, targets);
          const dotBg = {
            complete: 'bg-green-500',
            partial: 'bg-amber-400',
            empty: 'bg-white/[0.1]',
            future: 'bg-white/[0.04]',
          }[status];
          return (
            <div key={dateStr} className="flex flex-col items-center gap-1">
              <span className={`text-base font-semibold ${isToday ? 'text-white' : 'text-white/40'}`}>{dayName}</span>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dotBg}
                ${isToday ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-[#0f1117]' : ''}
                ${isFuture ? 'opacity-25' : ''}`}>
                {status === 'complete' && <span className="text-white text-sm font-bold">✓</span>}
                {status === 'partial' && <span className="text-white/80 text-lg leading-none">·</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-base text-white/40 text-center">{loggedDays} of 7 days logged</div>
    </div>
  );
}

// ─── Main DashboardTab ───
export function DashboardTab({
  daily, totalCal, totalProtein,
  addFood, removeFood, updateFood, setWater, toggleMeditation, addRun,
  weighIns, addWeighIn, latest, startWeight, goalWeight, targets, name,
  notify, onNavigate, onOpenLog,
  settings, updateSettings,
}) {
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showMuscleSelector, setShowMuscleSelector] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const currentWeight = latest?.weight || startWeight;

  if (showGoalEditor && settings && updateSettings) {
    return (
      <GoalEditorPage
        settings={settings}
        updateSettings={updateSettings}
        notify={notify}
        onClose={() => setShowGoalEditor(false)}
      />
    );
  }

  if (editingFood) {
    return (
      <EditFoodModal
        food={editingFood}
        onSave={(id, updates) => updateFood?.(id, updates)}
        onClose={() => setEditingFood(null)}
        notify={notify}
      />
    );
  }

  if (showMuscleSelector) {
    return (
      <MuscleSelectorPage
        onClose={() => setShowMuscleSelector(false)}
        onApply={(workout) => {
          const today = getToday();
          localStorage.setItem(`ft_custom-workout-${today}`, JSON.stringify(workout));
          setShowMuscleSelector(false);
          onNavigate?.('gym');
          notify('Custom workout ready! Head to Gym tab.');
        }}
      />
    );
  }

  const handleWeighIn = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 100 || w > 400) return;
    addWeighIn(w);
    setWeightInput('');
    notify(`${w} lbs logged`);
  };

  const todayLogged = weighIns?.find(w => w.date === getToday());

  return (
    <div className="px-4 pb-28" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>

      {/* 1. Goal Banner */}
      <GoalBanner
        startWeight={startWeight}
        goalWeight={goalWeight || 200}
        weighIns={weighIns}
        currentWeight={currentWeight}
        pace={settings?.pace}
        onEdit={() => setShowGoalEditor(true)}
      />

      {/* 2. Daily Quote */}
      <p className="text-lg italic text-white/50 mb-4 px-1 leading-relaxed">"{getDailyQuote()}"</p>

      {/* 3. TODAY card */}
      <TodayCard
        totalCal={totalCal}
        totalProtein={totalProtein}
        daily={daily}
        targets={targets}
        onOpenLog={onOpenLog}
        setWater={setWater}
      />

      {/* 3b. Today's Food Log */}
      <TodayFoodLog
        daily={daily}
        removeFood={removeFood}
        onEditFood={setEditingFood}
        notify={notify}
      />

      {/* 4. Today's Workout */}
      <TodayWorkoutCard
        daily={daily}
        onNavigate={onNavigate}
        onChooseMuscles={() => setShowMuscleSelector(true)}
      />

      {/* 5. This Week */}
      <WeeklyStatusBar daily={daily} targets={targets} />

      {/* Wednesday weigh-in */}
      {isWednesday() && !todayLogged && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-5 mb-4">
          <div className="text-xl font-bold text-amber-400 mb-3">⚖️ Wednesday Weigh-In</div>
          <div className="flex gap-3">
            <input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done"
              value={weightInput} onChange={e => setWeightInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleWeighIn()}
              placeholder="Enter weight (lbs)"
              className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-xl text-white outline-none placeholder:text-white/30" />
            <button onClick={handleWeighIn}
              className="bg-amber-500 text-white font-bold rounded-xl px-6 h-14 border-none cursor-pointer active:scale-95 text-base">
              Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
