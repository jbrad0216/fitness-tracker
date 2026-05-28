import { useState, useRef, useCallback } from 'react';
import { load, save } from '../data/storage';
import { searchLocalFoods } from '../data/common-foods';

const RECENT_KEY = 'recent-foods';
const CUSTOM_FOODS_KEY = 'custom-foods';

function getMealFromHour() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snack';
  return 'dinner';
}

function getRecentFoods() {
  return load(RECENT_KEY, []);
}

function saveRecentFood(item) {
  const recent = getRecentFoods();
  const deduped = recent.filter(f => f.name.toLowerCase() !== item.name.toLowerCase());
  save(RECENT_KEY, [item, ...deduped].slice(0, 50));
}

async function searchAPI(query) {
  // Try Open Food Facts
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      const results = [];
      for (const item of (data.products || [])) {
        if (!item.nutriments || !item.product_name) continue;
        const n = item.nutriments;
        const calPer100 = n['energy-kcal_100g'] || n['energy-kcal'] || 0;
        if (calPer100 <= 0) continue;
        const servingQty = parseFloat(item.serving_quantity);
        const mult = servingQty > 0 && servingQty <= 2000 ? servingQty / 100 : 1;
        const servingLabel = servingQty > 0 && servingQty <= 2000
          ? (item.serving_size || `${Math.round(servingQty)}g`)
          : 'per 100g';
        results.push({
          name: item.product_name,
          brand: item.brands || '',
          cal: Math.round(calPer100 * mult),
          protein: Math.round((n.proteins_100g || n.proteins || 0) * mult),
          fat: Math.round((n.fat_100g || n.fat || 0) * mult),
          carbs: Math.round((n.carbohydrates_100g || n.carbohydrates || 0) * mult),
          fiber: Math.round((n.fiber_100g || n.fiber || 0) * mult),
          servingSize: servingLabel,
          source: 'Open Food Facts',
        });
        if (results.length >= 6) break;
      }
      if (results.length > 0) return results;
    }
  } catch { /* fall through */ }

  // Try USDA FDC
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=DEMO_KEY&pageSize=6&dataType=Survey%20(FNDDS),Branded,Foundation`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const results = [];
      for (const item of (data.foods || [])) {
        const nutrients = item.foodNutrients || [];
        const getN = (num) => {
          const n = nutrients.find(n => String(n.nutrientNumber) === String(num));
          return n ? (n.value || 0) : 0;
        };
        const calPer100 = getN(1008);
        if (calPer100 <= 0) continue;
        const servingGrams = item.servingSize && item.servingSizeUnit?.toLowerCase() === 'g' ? item.servingSize : null;
        const mult = servingGrams ? servingGrams / 100 : 1;
        results.push({
          name: item.description,
          cal: Math.round(calPer100 * mult),
          protein: Math.round(getN(203) * mult),
          fat: Math.round(getN(204) * mult),
          carbs: Math.round(getN(205) * mult),
          fiber: Math.round(getN(291) * mult),
          servingSize: servingGrams ? (item.householdServingFullText || `${Math.round(servingGrams)}g`) : 'per 100g',
          source: 'USDA',
        });
        if (results.length >= 6) break;
      }
      if (results.length > 0) return results;
    }
  } catch { /* both failed */ }

  return [];
}

// ─── Food Result Card ───
function FoodResultCard({ food, onAdd }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(food);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-2">
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold leading-tight">
          {food.name}
          {food.brand && <span className="text-white/40 font-normal"> · {food.brand}</span>}
        </div>
        <div className="text-base text-white/50 mt-0.5">
          {food.cal} cal · {food.protein}g protein
          {food.carbs ? ` · ${food.carbs}g carbs` : ''}
        </div>
        {food.servingSize && (
          <div className="text-base text-white/30 mt-0.5">{food.servingSize}</div>
        )}
      </div>
      <button
        onClick={handleAdd}
        className={`shrink-0 h-12 px-4 rounded-xl text-base font-bold border-none cursor-pointer active:opacity-70 transition-all
          ${added
            ? 'bg-green-500/20 text-green-400 border border-green-500/30 border-solid'
            : 'bg-green-500 text-white'}`}
      >
        {added ? '✓' : '+ Add'}
      </button>
    </div>
  );
}

// ─── Food Search Panel ───
function FoodSearchPanel({ addFood, notify }) {
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState([]);
  const [apiResults, setApiResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recentFoods] = useState(() => {
    const seen = new Set();
    return getRecentFoods().filter(f => {
      const k = f.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 20);
  });
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const handleSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setLocalResults([]);
      setApiResults([]);
      setSearching(false);
      return;
    }

    // Instant local search
    const recent = getRecentFoods().filter(f =>
      f.name.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 4);
    const local = searchLocalFoods(q).slice(0, 8);

    // Deduplicate with recent
    const recentNames = new Set(recent.map(f => f.name.toLowerCase()));
    const dedupedLocal = local.filter(f => !recentNames.has(f.name.toLowerCase()));

    setLocalResults([...recent, ...dedupedLocal]);

    // API search
    setSearching(true);
    const api = await searchAPI(q);
    setSearching(false);

    // Filter out dupes
    const allLocalNames = new Set([...recent, ...dedupedLocal].map(f => f.name.toLowerCase()));
    setApiResults(api.filter(f => !allLocalNames.has(f.name.toLowerCase())));
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 500);
  };

  const handleAddFood = (food) => {
    const meal = getMealFromHour();
    const item = { ...food, meal, id: `${Date.now()}-${Math.random()}` };
    addFood(item);
    saveRecentFood(food);
    notify(`Added: ${food.name} (${food.cal} cal)`);
  };

  const allResults = [...localResults, ...apiResults];

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-4 pt-3 pb-3 shrink-0">
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            placeholder="Search for a food..."
            value={query}
            onChange={handleChange}
            className="w-full bg-white/[0.08] border border-white/[0.1] rounded-2xl
              pl-5 pr-12 h-14 text-lg text-white outline-none placeholder:text-white/30
              focus:border-blue-500/60"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-base">
              …
            </div>
          )}
          {!searching && query && (
            <button
              onClick={() => { setQuery(''); setLocalResults([]); setApiResults([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xl
                bg-transparent border-none cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {query.trim().length >= 2 ? (
          <>
            {allResults.length === 0 && !searching && (
              <div className="text-center py-8 text-white/30">
                <div className="text-4xl mb-2">🔍</div>
                <div className="text-base">No results for "{query}"</div>
                <div className="text-base mt-1">Try a different spelling or use Custom Entry</div>
              </div>
            )}
            {allResults.map((food, i) => (
              <FoodResultCard key={i} food={food} onAdd={handleAddFood} />
            ))}
            {searching && allResults.length > 0 && (
              <div className="text-center py-2 text-white/30 text-base">Searching online…</div>
            )}
            {searching && allResults.length === 0 && (
              <div className="text-center py-8 text-white/30 text-base">Searching…</div>
            )}
          </>
        ) : (
          /* Recent Foods */
          <>
            {recentFoods.length > 0 && (
              <>
                <div className="text-base font-bold text-white/40 uppercase tracking-wider mb-2">
                  Recent Foods
                </div>
                {recentFoods.map((food, i) => (
                  <FoodResultCard key={i} food={food} onAdd={handleAddFood} />
                ))}
              </>
            )}
            {recentFoods.length === 0 && (
              <div className="text-center py-12 text-white/30">
                <div className="text-4xl mb-3">🍽️</div>
                <div className="text-base">Search for a food above</div>
                <div className="text-base mt-1">Your recent foods will appear here</div>
              </div>
            )}
          </>
        )}
      </div>
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
    saveRecentFood(food);
    if (savePreset) {
      const presets = load(CUSTOM_FOODS_KEY, []);
      const existing = presets.find(p => p.name.toLowerCase() === food.name.toLowerCase());
      if (!existing) {
        save(CUSTOM_FOODS_KEY, [...presets, { ...food, id: Date.now().toString() }]);
      }
    }
    notify(`Added: ${food.name} (${food.cal} cal)`);
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

  const inputClass = "w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-lg text-white outline-none placeholder:text-white/25 focus:border-blue-500/60";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {submitted && (
        <div className="bg-green-500/15 border border-green-500/30 rounded-2xl px-4 py-3 mb-4
          text-green-300 text-base font-semibold text-center">
          ✓ Food logged!
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="text-base text-white/50 mb-1.5">Food Name <span className="text-red-400">*</span></div>
          <input type="text" inputMode="text" autoComplete="off" {...f('name')}
            placeholder="e.g. Overnight Oats" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-base text-white/50 mb-1.5">Calories <span className="text-red-400">*</span></div>
            <input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next"
              {...f('cal')} placeholder="320" className={inputClass} />
          </div>
          <div>
            <div className="text-base text-white/50 mb-1.5">Protein (g)</div>
            <input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next"
              {...f('protein')} placeholder="30" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'fat', label: 'Fat (g)' },
            { k: 'carbs', label: 'Carbs (g)' },
            { k: 'fiber', label: 'Fiber (g)' },
          ].map(({ k, label }) => (
            <div key={k}>
              <div className="text-base text-white/50 mb-1.5">{label}</div>
              <input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="next"
                {...f(k)} placeholder="0"
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 h-14
                  text-base text-white outline-none placeholder:text-white/25 focus:border-blue-500/60" />
            </div>
          ))}
        </div>

        <div>
          <div className="text-base text-white/50 mb-1.5">Meal</div>
          <div className="flex gap-2">
            {MEALS.map(m => (
              <button key={m.key} onClick={() => setMeal(m.key)}
                className={`flex-1 rounded-xl h-12 text-xl border-none cursor-pointer active:scale-95 transition-all
                  ${meal === m.key ? 'bg-blue-500' : 'bg-white/[0.06]'}`}>
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
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center cursor-pointer shrink-0
              ${savePreset ? 'bg-blue-500 border-blue-500' : 'border-white/30'}`}>
            {savePreset && <span className="text-white text-base font-bold">✓</span>}
          </div>
          <span className="text-base text-white/70">Save as favorite for quick re-logging</span>
        </label>

        <button onClick={handleLog}
          className="w-full bg-green-500 text-white rounded-2xl h-14 text-lg font-bold
            border-none cursor-pointer active:opacity-80">
          ADD FOOD
        </button>
      </div>
    </div>
  );
}

// ─── Saved Favorites Panel ───
function FavoritesPanel({ addFood, notify }) {
  const [customFoods, setCustomFoods] = useState(() => load(CUSTOM_FOODS_KEY, []));

  const handleLog = (food) => {
    const meal = getMealFromHour();
    const item = { ...food, meal, id: `${Date.now()}-${Math.random()}` };
    addFood(item);
    saveRecentFood(food);
    notify(`Added: ${food.name} (${food.cal} cal)`);
  };

  const handleDelete = (id) => {
    const next = customFoods.filter(f => f.id !== id);
    setCustomFoods(next);
    save(CUSTOM_FOODS_KEY, next);
  };

  if (customFoods.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="text-center text-white/30">
          <div className="text-4xl mb-3">⭐</div>
          <div className="text-base">No saved favorites yet.</div>
          <div className="text-base mt-1">Check "Save as favorite" when adding custom foods.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="text-base font-bold text-amber-400 uppercase tracking-wider mb-2">
        ★ Saved Favorites
      </div>
      {customFoods.map(food => (
        <div key={food.id} className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08]
          rounded-2xl px-4 py-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold truncate">{food.name}</div>
            <div className="text-base text-white/50">{food.cal} cal · {food.protein}g protein</div>
          </div>
          <button onClick={() => handleDelete(food.id)}
            className="w-12 h-12 rounded-xl bg-red-500/15 text-red-400 text-xl
              border-none cursor-pointer flex items-center justify-center active:bg-red-500/25 shrink-0">
            ×
          </button>
          <button onClick={() => handleLog(food)}
            className="h-12 px-4 rounded-xl bg-green-500 text-white text-base font-bold
              border-none cursor-pointer active:opacity-70 shrink-0">
            + Add
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Exercise Panel (Task 5) ───
const MACHINE_MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body'];

function ExercisePanel({ addExercise, getLastLift, logLift, notify }) {
  const [machines] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ft_machines') || '[]'); } catch { return []; }
  });
  const [activeMachine, setActiveMachine] = useState(null);
  const [setsCompleted, setSetsCompleted] = useState([]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('12');
  const [showCustom, setShowCustom] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', weight: '', sets: '3', reps: '12', muscle: 'Arms' });

  const handleSelectMachine = (m) => {
    setActiveMachine(m);
    setSetsCompleted([]);
    const last = getLastLift?.(m.name);
    setWeight(String(last?.weight || m.lastWeight || m.startingWeight || 0));
    setReps(String(last?.reps || 12));
  };

  const doSet = (idx) => {
    if (setsCompleted.includes(idx)) return;
    const newCompleted = [...setsCompleted, idx];
    setSetsCompleted(newCompleted);
    if (navigator.vibrate) navigator.vibrate(30);
    if (newCompleted.length >= 3) {
      const w = parseFloat(weight) || 0;
      const r = parseInt(reps) || 12;
      addExercise?.({ name: activeMachine.name, weight: w, sets: 3, reps: r });
      logLift?.(activeMachine.name, w, 3, r);
      notify?.(`${activeMachine.name} — ${w} lbs × 3×${r} logged!`);
      setActiveMachine(null);
      setSetsCompleted([]);
    }
  };

  const handleLogCustom = () => {
    if (!customForm.name.trim()) { notify?.('Exercise name required'); return; }
    const w = parseFloat(customForm.weight) || 0;
    const s = parseInt(customForm.sets) || 3;
    const r = parseInt(customForm.reps) || 12;
    addExercise?.({ name: customForm.name.trim(), weight: w, sets: s, reps: r });
    logLift?.(customForm.name.trim(), w, s, r);
    notify?.(`${customForm.name} logged!`);
    setCustomForm({ name: '', weight: '', sets: '3', reps: '12', muscle: 'Arms' });
    setShowCustom(false);
  };

  const inputCls = "w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-lg text-white outline-none focus:border-blue-500/60 placeholder:text-white/25";

  if (activeMachine) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <button onClick={() => setActiveMachine(null)}
          className="flex items-center gap-2 text-blue-400 mb-4 bg-transparent border-none cursor-pointer text-base font-semibold active:opacity-60">
          <span className="text-2xl leading-none">‹</span> Back
        </button>
        <div className="text-2xl font-bold mb-1">{activeMachine.name}</div>
        <div className="text-base text-white/40 mb-4">{activeMachine.muscleGroups?.join(', ')}</div>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <div className="text-base text-white/50 mb-1">Weight (lbs)</div>
            <input type="text" inputMode="decimal" autoComplete="off"
              value={weight} onChange={e => setWeight(e.target.value)}
              className={inputCls} />
          </div>
          <div className="w-24">
            <div className="text-base text-white/50 mb-1">Reps</div>
            <input type="text" inputMode="numeric" autoComplete="off"
              value={reps} onChange={e => setReps(e.target.value)}
              className={inputCls} />
          </div>
        </div>
        <div className="text-base font-semibold text-white/50 mb-2">{setsCompleted.length}/3 sets done</div>
        {[0, 1, 2].map(i => {
          const done = setsCompleted.includes(i);
          return (
            <button key={i} onClick={() => doSet(i)} disabled={done}
              className={`w-full h-14 rounded-xl text-lg font-bold border-none cursor-pointer mb-2 transition-all
                ${done ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.08] text-white/70 active:bg-blue-500/20 active:text-blue-300'}`}>
              {done ? `✓ SET ${i + 1} DONE — ${weight} lbs × ${reps}` : `DO SET ${i + 1}`}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {machines.length > 0 && (
        <>
          <div className="text-base font-bold text-white/40 uppercase tracking-wider mb-3">MY MACHINES</div>
          {machines.map(m => (
            <div key={m.id}
              className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-2">
              {m.photo && <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold truncate">{m.name}</div>
                <div className="text-base text-white/40">{m.muscleGroups?.join(', ')}</div>
                {m.lastWeight > 0 && <div className="text-base text-white/30">Last: {m.lastWeight} lbs</div>}
              </div>
              <button onClick={() => handleSelectMachine(m)}
                className="shrink-0 w-12 h-12 rounded-xl bg-blue-500 text-white text-2xl font-bold border-none cursor-pointer active:opacity-70 flex items-center justify-center">
                +
              </button>
            </div>
          ))}
        </>
      )}

      {machines.length === 0 && (
        <div className="text-center py-8 text-white/30 mb-4">
          <div className="text-4xl mb-2">🏋️</div>
          <div className="text-base">No machines set up yet.</div>
          <div className="text-base mt-1">Add machines in the Gym tab → Customize.</div>
        </div>
      )}

      <div className="mt-4">
        <div className="text-base font-bold text-white/40 uppercase tracking-wider mb-3">CUSTOM EXERCISE</div>
        {showCustom ? (
          <div className="space-y-3">
            <div>
              <div className="text-base text-white/50 mb-1">Exercise Name</div>
              <input type="text" inputMode="text" autoComplete="off"
                value={customForm.name} onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Bicep Curls" className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-base text-white/50 mb-1">Weight (lbs)</div>
                <input type="text" inputMode="decimal" autoComplete="off"
                  value={customForm.weight} onChange={e => setCustomForm(f => ({ ...f, weight: e.target.value }))}
                  placeholder="25" className={inputCls} />
              </div>
              <div>
                <div className="text-base text-white/50 mb-1">Sets</div>
                <input type="text" inputMode="numeric" autoComplete="off"
                  value={customForm.sets} onChange={e => setCustomForm(f => ({ ...f, sets: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <div className="text-base text-white/50 mb-1">Reps</div>
                <input type="text" inputMode="numeric" autoComplete="off"
                  value={customForm.reps} onChange={e => setCustomForm(f => ({ ...f, reps: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
            <div>
              <div className="text-base text-white/50 mb-1">Muscle Group</div>
              <div className="flex flex-wrap gap-2">
                {MACHINE_MUSCLE_GROUPS.map(mg => (
                  <button key={mg} onClick={() => setCustomForm(f => ({ ...f, muscle: mg }))}
                    className={`h-11 px-4 rounded-xl text-base font-semibold border-none cursor-pointer
                      ${customForm.muscle === mg ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-white/50'}`}>
                    {mg}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleLogCustom}
              className="w-full bg-green-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80">
              LOG EXERCISE
            </button>
            <button onClick={() => setShowCustom(false)}
              className="w-full bg-transparent text-white/40 h-12 text-base border-none cursor-pointer">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setShowCustom(true)}
            className="w-full bg-white/[0.08] border border-white/[0.1] text-white/60 rounded-2xl h-14 text-base font-semibold border-solid cursor-pointer active:opacity-70">
            + Add Custom Exercise
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Can I Eat This? Panel (Task 8) ───
function CanIEatThisPanel({ daily, targets, addFood, notify }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [logged, setLogged] = useState(false);

  const totalCal = daily?.totalCal || 0;
  const totalProtein = daily?.totalProtein || 0;
  const calTarget = targets?.calories || 2400;
  const proteinTarget = targets?.protein || 160;

  const handleSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults([]); return; }
    const local = searchLocalFoods(q).slice(0, 6);
    setResults(local);
    if (local.length < 3) {
      setSearching(true);
      const api = await searchAPI(q);
      setSearching(false);
      const localNames = new Set(local.map(f => f.name.toLowerCase()));
      setResults([...local, ...api.filter(f => !localNames.has(f.name.toLowerCase()))].slice(0, 8));
    }
  }, []);

  const debounceRef = useRef(null);
  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    setLogged(false);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 400);
  };

  const handleSelect = (food) => { setSelected(food); setResults([]); };

  const handleLog = () => {
    if (!selected) return;
    const meal = getMealFromHour();
    addFood({ ...selected, meal, id: `${Date.now()}-${Math.random()}` });
    saveRecentFood(selected);
    notify(`Added: ${selected.name} (${selected.cal} cal)`);
    setLogged(true);
    setSelected(null);
    setQuery('');
  };

  const renderVerdict = () => {
    if (!selected) return null;
    const newCal = totalCal + selected.cal;
    const newProtein = totalProtein + (selected.protein || 0);
    const calRemaining = calTarget - newCal;
    const proteinRemaining = proteinTarget - newProtein;
    const fits = calRemaining >= -50;
    const tight = calRemaining >= -200 && calRemaining < -50;

    // Chipotle-specific alternatives
    const alternatives = [];
    const nameLower = selected.name.toLowerCase();
    if (nameLower.includes('burrito') && nameLower.includes('chipotle')) {
      alternatives.push({ label: 'Get a bowl instead (−165 cal)', savedCal: 165 });
      alternatives.push({ label: 'Skip the cheese (−110 cal)', savedCal: 110 });
    } else if (selected.cal > 500) {
      alternatives.push({ label: 'Half portion (−' + Math.round(selected.cal / 2) + ' cal)', savedCal: Math.round(selected.cal / 2) });
      alternatives.push({ label: 'Skip the side (−200 cal)', savedCal: 200 });
    }

    return (
      <div className="mt-4">
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-4 mb-3">
          <div className="text-lg font-bold mb-3">{selected.name}</div>
          <div className="text-xl font-bold text-amber-400">{selected.cal} cal · {selected.protein || 0}g protein</div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 mb-3">
          <div className="text-base font-bold text-white/50 uppercase mb-3">YOUR BUDGET TODAY</div>
          <div className="space-y-2 text-base">
            <div className="flex justify-between">
              <span className="text-white/60">Already eaten</span>
              <span>{totalCal.toLocaleString()} cal / {totalProtein}g protein</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">This meal</span>
              <span className="text-amber-400">+{selected.cal} cal / +{selected.protein || 0}g protein</span>
            </div>
            <div className="border-t border-white/[0.08] pt-2 flex justify-between font-bold">
              <span>Total if you eat it</span>
              <span>{newCal.toLocaleString()} cal / {newProtein}g protein</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-white/50">Remaining</span>
              <span className={calRemaining >= 0 ? 'text-green-400' : 'text-red-400'}>
                {calRemaining >= 0 ? '' : ''}{calRemaining.toLocaleString()} cal / {proteinRemaining}g protein
              </span>
            </div>
          </div>
        </div>

        {fits ? (
          <div className="bg-green-500/[0.08] border border-green-500/30 rounded-2xl px-5 py-4 mb-3">
            <div className="text-xl font-bold text-green-400 mb-1">✅ YES — fits your budget!</div>
            <div className="text-base text-white/60">
              {calRemaining >= 0
                ? `You'll have ${calRemaining} cal left for other meals.`
                : 'Barely over — you can balance with a lighter dinner.'}
            </div>
          </div>
        ) : tight ? (
          <div className="bg-amber-500/[0.08] border border-amber-500/30 rounded-2xl px-5 py-4 mb-3">
            <div className="text-xl font-bold text-amber-400 mb-1">⚠️ TIGHT — {Math.abs(calRemaining)} cal over</div>
            {alternatives.length > 0 && (
              <div className="mt-2 space-y-1">
                {alternatives.map((alt, i) => {
                  const wouldFit = (totalCal + selected.cal - alt.savedCal) <= calTarget + 50;
                  return (
                    <div key={i} className="text-base text-white/60">
                      • {alt.label}: {wouldFit ? '✅ fits' : 'still tight'}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-500/[0.08] border border-red-500/30 rounded-2xl px-5 py-4 mb-3">
            <div className="text-xl font-bold text-red-400 mb-1">🚫 OVER BUDGET — {Math.abs(calRemaining)} cal over</div>
            {alternatives.length > 0 && (
              <div className="mt-2 space-y-1">
                {alternatives.map((alt, i) => {
                  const wouldFit = (totalCal + selected.cal - alt.savedCal) <= calTarget + 50;
                  return (
                    <div key={i} className="text-base text-white/60">
                      • {alt.label}: {wouldFit ? '✅ fits' : 'still over'}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button onClick={handleLog}
          className="w-full bg-green-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80 mb-2">
          LOG IT
        </button>
        <button onClick={() => { setSelected(null); setQuery(''); }}
          className="w-full bg-white/[0.06] text-white/50 rounded-2xl h-12 text-base border-none cursor-pointer">
          SKIP
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="text-base text-white/50 mb-3">
        Search for a meal to see if it fits your daily budget.
      </div>
      <div className="relative mb-3">
        <input
          type="search" autoComplete="off"
          placeholder='e.g. "Chipotle burrito"'
          value={query} onChange={handleChange}
          className="w-full bg-white/[0.08] border border-white/[0.1] rounded-2xl pl-5 pr-12 h-14 text-lg text-white outline-none placeholder:text-white/30 focus:border-blue-500/60"
        />
        {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">…</div>}
        {!searching && query && (
          <button onClick={() => { setQuery(''); setResults([]); setSelected(null); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xl bg-transparent border-none cursor-pointer">×</button>
        )}
      </div>

      {logged && (
        <div className="bg-green-500/15 border border-green-500/30 rounded-2xl px-4 py-3 mb-3 text-green-300 text-base font-semibold text-center">
          ✓ Food logged!
        </div>
      )}

      {results.length > 0 && !selected && (
        <div className="mb-3">
          {results.map((food, i) => (
            <button key={i} onClick={() => handleSelect(food)}
              className="w-full text-left flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 mb-2 cursor-pointer active:bg-white/[0.08]">
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold">{food.name}</div>
                <div className="text-base text-white/50">{food.cal} cal · {food.protein || 0}g protein</div>
              </div>
              <span className="text-white/30 text-xl">›</span>
            </button>
          ))}
        </div>
      )}

      {renderVerdict()}
    </div>
  );
}

// ─── Main LogTab ───
export function LogTab({ daily, targets, addFood, addExercise, getLastLift, logLift, notify }) {
  const [activeTab, setActiveTab] = useState('search');
  const [showCanIEat, setShowCanIEat] = useState(false);

  const TABS = [
    { id: 'search', label: 'Search Food' },
    { id: 'custom', label: 'Custom Entry' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'exercise', label: 'Exercise' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f1117]">
      {/* Can I Eat This — full screen overlay */}
      {showCanIEat && (
        <div className="fixed inset-0 z-50 bg-[#0f1117] flex flex-col"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
          <div className="flex items-center gap-3 px-4 mb-4 shrink-0">
            <button onClick={() => setShowCanIEat(false)}
              className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-2xl border-none cursor-pointer flex items-center justify-center active:opacity-70">
              ‹
            </button>
            <h1 className="text-2xl font-bold">CAN I EAT THIS?</h1>
          </div>
          <CanIEatThisPanel
            daily={daily}
            targets={targets}
            addFood={(food) => { addFood(food); setShowCanIEat(false); }}
            notify={notify}
          />
        </div>
      )}

      {/* Header */}
      <div className="px-4 border-b border-white/[0.08] shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">
            {activeTab === 'exercise' ? 'Log Exercise' : 'Log Food'}
          </h2>
          <button onClick={() => setShowCanIEat(true)}
            className="h-10 px-3 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-300 text-sm font-semibold border-solid cursor-pointer active:opacity-70">
            🤔 Can I eat this?
          </button>
        </div>
        <div className="flex gap-1 mb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-[13px] font-semibold rounded-t-xl border-none cursor-pointer transition-all
                ${activeTab === tab.id
                  ? 'bg-white/[0.08] text-white border-b-2 border-blue-500'
                  : 'bg-transparent text-white/40 active:text-white/60'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'search' && (
        <FoodSearchPanel addFood={addFood} notify={notify} />
      )}
      {activeTab === 'custom' && (
        <CustomFoodForm addFood={addFood} notify={notify} />
      )}
      {activeTab === 'favorites' && (
        <FavoritesPanel addFood={addFood} notify={notify} />
      )}
      {activeTab === 'exercise' && (
        <ExercisePanel addExercise={addExercise} getLastLift={getLastLift} logLift={logLift} notify={notify} />
      )}
    </div>
  );
}
