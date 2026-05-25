import { useState, useCallback } from 'react';
import { ChatInterface } from './ChatInterface';
import { load, save } from '../data/storage';
import { getToday } from '../data/constants';

const RECENT_KEY = 'recent-foods';
const CUSTOM_FOODS_KEY = 'custom-foods';

function getMealFromHour() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snack';
  return 'dinner';
}

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', snack: '🍿', dinner: '🌙' };

// ─── My Foods Panel ───
function MyFoodsPanel({ addFood, notify }) {
  const [recent] = useState(() => load(RECENT_KEY, []));
  const [customFoods, setCustomFoods] = useState(() => load(CUSTOM_FOODS_KEY, []));
  const [logged, setLogged] = useState([]);

  // Frequent: deduplicate by name, sort by occurrence count
  const frequent = (() => {
    const counts = {};
    recent.forEach(f => {
      const k = f.name.toLowerCase();
      if (!counts[k]) counts[k] = { ...f, count: 0 };
      counts[k].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
  })();

  // Recent: last 20 unique
  const recentUnique = (() => {
    const seen = new Set();
    return recent.filter(f => {
      const k = f.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 20);
  })();

  const handleLog = (food) => {
    const meal = getMealFromHour();
    const item = { ...food, meal, id: `${Date.now()}-${Math.random()}` };
    addFood(item);
    setLogged(prev => [...prev, food.name]);
    notify(`✓ ${food.name} logged`);
  };

  const handleDeleteCustom = (id) => {
    const next = customFoods.filter(f => f.id !== id);
    setCustomFoods(next);
    save(CUSTOM_FOODS_KEY, next);
  };

  const FoodRow = ({ food, isSaved }) => {
    const wasLogged = logged.includes(food.name);
    return (
      <button
        onClick={() => handleLog(food)}
        className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl min-h-[56px]
          cursor-pointer active:opacity-70 transition-all text-left border
          ${wasLogged
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-white/[0.04] border-white/[0.07] active:bg-white/[0.08]'}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isSaved && <span className="text-amber-400 text-base">★</span>}
            <span className="text-base font-semibold truncate">{food.name}</span>
          </div>
          <div className="text-base text-white/45 mt-0.5">
            {food.cal} cal · {food.protein}g protein
            {food.fat ? ` · ${food.fat}g fat` : ''}
          </div>
        </div>
        {wasLogged
          ? <span className="text-green-400 text-lg shrink-0">✓</span>
          : <span className="text-white/30 text-xl shrink-0">+</span>
        }
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {customFoods.length > 0 && (
        <div className="mb-5">
          <div className="text-base font-bold text-amber-400 uppercase tracking-wider mb-2">
            ★ Saved Presets
          </div>
          <div className="space-y-2">
            {customFoods.map(f => (
              <div key={f.id} className="relative">
                <FoodRow food={f} isSaved />
                <button
                  onClick={() => handleDeleteCustom(f.id)}
                  className="absolute top-2 right-10 w-7 h-7 rounded-lg bg-red-500/15 text-red-400
                    border-none cursor-pointer text-base flex items-center justify-center"
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {frequent.length > 0 && (
        <div className="mb-5">
          <div className="text-base font-bold text-white/40 uppercase tracking-wider mb-2">
            Your Usuals
          </div>
          <div className="space-y-2">
            {frequent.map((f, i) => <FoodRow key={i} food={f} />)}
          </div>
        </div>
      )}

      {recentUnique.length > 0 && (
        <div className="mb-5">
          <div className="text-base font-bold text-white/40 uppercase tracking-wider mb-2">
            Recent
          </div>
          <div className="space-y-2">
            {recentUnique.map((f, i) => <FoodRow key={i} food={f} />)}
          </div>
        </div>
      )}

      {frequent.length === 0 && recentUnique.length === 0 && customFoods.length === 0 && (
        <div className="text-center py-12 text-white/30">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-base">No food history yet.</p>
          <p className="text-base mt-1">Log food via Search or Custom — it'll appear here.</p>
        </div>
      )}
    </div>
  );
}

// ─── Custom Food Form ───
function CustomFoodForm({ addFood, notify }) {
  const [form, setForm] = useState({
    name: '', cal: '', protein: '', fat: '', carbs: '', fiber: '',
  });
  const [meal, setMeal] = useState(getMealFromHour());
  const [savePreset, setSavePreset] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const f = (field) => ({
    value: form[field],
    onChange: (e) => setForm(prev => ({ ...prev, [field]: e.target.value })),
  });

  const handleLog = () => {
    if (!form.name.trim() || !form.cal) {
      notify('Name and calories are required');
      return;
    }
    const food = {
      id: `${Date.now()}-${Math.random()}`,
      name: form.name.trim(),
      cal: parseInt(form.cal) || 0,
      protein: parseInt(form.protein) || 0,
      fat: parseInt(form.fat) || 0,
      carbs: parseInt(form.carbs) || 0,
      fiber: parseInt(form.fiber) || 0,
      meal,
      source: 'Custom',
    };
    addFood(food);
    // Save to recent
    const recent = load('recent-foods', []);
    const deduped = recent.filter(r => r.name.toLowerCase() !== food.name.toLowerCase());
    save('recent-foods', [food, ...deduped].slice(0, 50));
    // Save as preset if checked
    if (savePreset) {
      const presets = load('custom-foods', []);
      const existing = presets.find(p => p.name.toLowerCase() === food.name.toLowerCase());
      if (!existing) {
        save('custom-foods', [...presets, { ...food, id: Date.now().toString() }]);
      }
    }
    notify(`✓ ${food.name} logged (${food.cal} cal)`);
    setSubmitted(true);
    setForm({ name: '', cal: '', protein: '', fat: '', carbs: '', fiber: '' });
    setSavePreset(false);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const MEALS = [
    { key: 'breakfast', icon: '🌅', label: 'Breakfast' },
    { key: 'lunch', icon: '☀️', label: 'Lunch' },
    { key: 'snack', icon: '🍿', label: 'Snack' },
    { key: 'dinner', icon: '🌙', label: 'Dinner' },
  ];

  const inputClass = "w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3 text-lg text-white outline-none placeholder:text-white/25 h-14";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {submitted && (
        <div className="bg-green-500/15 border border-green-500/30 rounded-2xl px-4 py-3 mb-4 text-green-300 text-[16px] font-semibold text-center">
          ✓ Food logged!
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="text-base text-white/40 mb-1.5">Food Name</div>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            {...f('name')}
            placeholder="e.g. Overnight Oats"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-base text-white/40 mb-1.5">Calories <span className="text-red-400">*</span></div>
            <input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next" {...f('cal')} placeholder="320" className={inputClass} />
          </div>
          <div>
            <div className="text-base text-white/40 mb-1.5">Protein (g)</div>
            <input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next" {...f('protein')} placeholder="30" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'fat', label: 'Fat (g)' },
            { k: 'carbs', label: 'Carbs (g)' },
            { k: 'fiber', label: 'Fiber (g)' },
          ].map(({ k, label }) => (
            <div key={k}>
              <div className="text-base text-white/40 mb-1.5">{label}</div>
              <input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next" {...f(k)} placeholder="0"
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3 text-base text-white outline-none placeholder:text-white/25 h-14" />
            </div>
          ))}
        </div>

        <div>
          <div className="text-base text-white/40 mb-1.5">Meal</div>
          <div className="flex gap-2">
            {MEALS.map(m => (
              <button
                key={m.key}
                onClick={() => setMeal(m.key)}
                className={`flex-1 rounded-xl h-12 text-base font-semibold border-none cursor-pointer
                  active:scale-95 transition-all
                  ${meal === m.key ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-white/50'}`}
              >
                {m.icon}
              </button>
            ))}
          </div>
          <div className="text-base text-white/40 text-center mt-1">
            {MEALS.find(m => m.key === meal)?.label}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer py-2">
          <div
            onClick={() => setSavePreset(s => !s)}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer
              ${savePreset ? 'bg-blue-500 border-blue-500' : 'border-white/30'}`}
          >
            {savePreset && <span className="text-white text-base font-bold">✓</span>}
          </div>
          <span className="text-[16px] text-white/70">Save as preset (appears in My Foods)</span>
        </label>

        <button
          onClick={handleLog}
          className="w-full bg-green-500 text-white rounded-2xl py-4 text-[17px] font-bold
            border-none cursor-pointer active:opacity-80 h-14"
        >
          ✅ Log Food
        </button>
      </div>
    </div>
  );
}

// ─── Main LogTab ───
export function LogTab({
  daily, targets, addFood, setWater, toggleMeditation, addRun, addWeighIn,
  addExercise, logLift, getLastLift, removeFood, onOpenScanner, initialInput, notify,
}) {
  const [activeTab, setActiveTab] = useState('search');

  const TABS = [
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'myfoods', icon: '⭐', label: 'My Foods' },
    { id: 'custom', icon: '✏️', label: 'Custom' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f1117]">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 border-b border-white/[0.08] shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <h2 className="text-2xl font-bold mb-3">Log</h2>
        {/* Tab bar */}
        <div className="flex gap-1 mb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-base font-semibold
                rounded-t-xl border-none cursor-pointer transition-all
                ${activeTab === tab.id
                  ? 'bg-white/[0.08] text-white border-b-2 border-blue-500'
                  : 'bg-transparent text-white/40 active:text-white/60'}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'search' && (
        <ChatInterface
          daily={daily}
          targets={targets}
          addFood={addFood}
          setWater={setWater}
          toggleMeditation={toggleMeditation}
          addRun={addRun}
          addWeighIn={addWeighIn}
          addExercise={addExercise}
          logLift={logLift}
          getLastLift={getLastLift}
          removeFood={removeFood}
          onOpenScanner={onOpenScanner}
          embedded
          initialInput={initialInput}
          hideHeader
        />
      )}
      {activeTab === 'myfoods' && (
        <MyFoodsPanel addFood={addFood} notify={notify} />
      )}
      {activeTab === 'custom' && (
        <CustomFoodForm addFood={addFood} notify={notify} />
      )}
    </div>
  );
}
