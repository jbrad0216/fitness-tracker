import { useState, useEffect, useRef, useCallback } from 'react';
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

// ─── Main LogTab ───
export function LogTab({ daily, targets, addFood, notify }) {
  const [activeTab, setActiveTab] = useState('search');

  const TABS = [
    { id: 'search', label: 'Search Food' },
    { id: 'custom', label: 'Custom Entry' },
    { id: 'favorites', label: 'Favorites' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f1117]">
      {/* Header */}
      <div className="px-4 border-b border-white/[0.08] shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <h2 className="text-2xl font-bold mb-3">Log Food</h2>
        <div className="flex gap-1 mb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-base font-semibold rounded-t-xl border-none cursor-pointer transition-all
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
    </div>
  );
}
