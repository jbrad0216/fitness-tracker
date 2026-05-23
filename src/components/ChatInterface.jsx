import { useState, useRef, useEffect, useCallback } from 'react';
import { getToday } from '../data/constants';
import { load, save } from '../data/storage';

// ─── Recent foods helpers ───
const RECENT_KEY = 'recent-foods';
function getRecentFoods() { return load(RECENT_KEY, []); }
function saveRecentFood(item) {
  const recent = getRecentFoods();
  const deduped = recent.filter(f =>
    f.name.toLowerCase() !== item.name.toLowerCase()
  );
  save(RECENT_KEY, [item, ...deduped].slice(0, 50));
}
function findRecentFood(query) {
  const q = query.toLowerCase();
  return getRecentFoods().find(f =>
    f.name.toLowerCase().includes(q) || q.includes(f.name.toLowerCase().split(' ')[0])
  );
}

// ─── Meal helpers ───
const MEAL_OPTIONS = [
  { key: 'breakfast', icon: '🌅', label: 'Breakfast' },
  { key: 'lunch', icon: '☀️', label: 'Lunch' },
  { key: 'snack', icon: '🍿', label: 'Snack' },
  { key: 'dinner', icon: '🌙', label: 'Dinner' },
];

function getMealFromHour() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snack';
  return 'dinner';
}

// ─── Food Confirmation Card ───
function FoodConfirmCard({ msg, onConfirm, onReject }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...msg.food });
  const [meal, setMeal] = useState(getMealFromHour);
  const food = msg.food;

  if (editing) {
    return (
      <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-4 w-full">
        <div className="text-sm font-semibold mb-3 text-white/80">Edit nutrition:</div>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-2.5
            text-[16px] text-white outline-none mb-2 placeholder:text-white/30"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Food name"
        />
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { k: 'cal', label: 'Calories' },
            { k: 'protein', label: 'Protein (g)' },
            { k: 'fat', label: 'Fat (g)' },
            { k: 'carbs', label: 'Carbs (g)' },
          ].map(({ k, label }) => (
            <div key={k}>
              <div className="text-sm text-white/40 mb-1">{label}</div>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-2
                  text-[16px] text-white outline-none placeholder:text-white/30"
                value={form[k] || ''}
                onChange={e => setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onConfirm({ ...form, meal }); }}
            className="flex-1 bg-green-500 text-white rounded-xl py-3 text-sm font-bold
              border-none cursor-pointer active:opacity-80"
          >
            ✅ Log it
          </button>
          <button
            onClick={() => setEditing(false)}
            className="w-20 bg-white/[0.08] text-white/60 rounded-xl py-3 text-sm
              border-none cursor-pointer active:opacity-80"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-4 w-full">
      <div className="text-[18px] font-bold mb-1 leading-snug">{food.name}</div>
      <div className="flex items-center gap-2 mb-2">
        {food.servingSize && (
          <span className="text-sm text-white/40">{food.servingSize}</span>
        )}
        {food.source && (
          <span className="text-sm text-white/25 bg-white/[0.04] rounded-full px-2 py-0.5">{food.source}</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Cal', value: food.cal, color: 'text-amber-400' },
          { label: 'Protein', value: `${food.protein}g`, color: 'text-blue-400' },
          { label: 'Fat', value: `${food.fat || 0}g`, color: 'text-white/60' },
          { label: 'Carbs', value: `${food.carbs || 0}g`, color: 'text-white/60' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center bg-white/[0.04] rounded-xl py-2 px-1">
            <div className={`text-[16px] font-bold ${color}`}>{value}</div>
            <div className="text-sm text-white/40 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      {/* Meal selector */}
      <div className="mb-3">
        <div className="text-sm text-white/40 mb-1.5">Logging as:</div>
        <div className="flex gap-1.5">
          {MEAL_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setMeal(opt.key)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold border-none cursor-pointer
                active:scale-95 transition-all
                ${meal === opt.key ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-white/50'}`}
            >
              {opt.icon}
            </button>
          ))}
        </div>
        <div className="text-sm text-white/40 text-center mt-1">
          {MEAL_OPTIONS.find(o => o.key === meal)?.label}
        </div>
      </div>
      <button
        onClick={() => onConfirm({ ...food, meal })}
        className="w-full bg-green-500 text-white rounded-xl py-3.5 text-[16px] font-bold
          border-none cursor-pointer active:opacity-80 mb-2"
      >
        ✅ Yes, log it
      </button>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="flex-1 bg-white/[0.08] text-white/70 rounded-xl py-3 text-sm font-semibold
            border-none cursor-pointer active:opacity-70"
        >
          ✏️ Edit
        </button>
        <button
          onClick={onReject}
          className="flex-1 bg-red-500/15 text-red-400 rounded-xl py-3 text-sm font-semibold
            border-none cursor-pointer active:opacity-70"
        >
          ❌ Not right
        </button>
      </div>
    </div>
  );
}

// ─── Recent food suggestion card ───
function RecentFoodCard({ food, onYes, onSearchAgain }) {
  return (
    <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-4 w-full">
      <div className="text-sm text-blue-300 mb-2">
        Last time you logged this as:
      </div>
      <div className="text-[17px] font-semibold mb-1">{food.name}</div>
      <div className="text-[15px] text-white/60 mb-3">
        {food.cal} cal · {food.protein}g protein
      </div>
      <div className="flex gap-2">
        <button
          onClick={onYes}
          className="flex-1 bg-blue-500 text-white rounded-xl py-3 text-sm font-bold
            border-none cursor-pointer active:opacity-80"
        >
          ✅ Use same
        </button>
        <button
          onClick={onSearchAgain}
          className="flex-1 bg-white/[0.08] text-white/70 rounded-xl py-3 text-sm
            border-none cursor-pointer active:opacity-70"
        >
          🔍 Search again
        </button>
      </div>
    </div>
  );
}

// ─── Natural language parser ───
function parseMessage(text, ctx) {
  const { daily, targets, addFood, setWater, toggleMeditation, addRun, addWeighIn, addExercise, logLift, getLastLift, removeFood } = ctx;
  const lower = text.toLowerCase().trim();

  const num = (str) => {
    const m = str.match(/[\d]+\.?[\d]*/);
    return m ? parseFloat(m[0]) : null;
  };

  // Delete / remove food — "delete the banana", "remove my last food", "undo last entry"
  if (/\b(delete|remove|undo)\b/.test(lower)) {
    const foods = daily.food || [];
    if (foods.length === 0) {
      return [{ type: 'error', text: 'No food logged yet today.' }];
    }
    // Try to find a specific food by name in the message
    const noisy = lower.replace(/\b(delete|remove|undo|my|the|a|an|last|entry|food|meal|item)\b/g, ' ').trim();
    const byName = noisy.length > 1
      ? foods.slice().reverse().find(f => f.name.toLowerCase().includes(noisy) || noisy.includes(f.name.toLowerCase().split(' ')[0]))
      : null;
    const target = byName || foods[foods.length - 1];
    removeFood(target.id);
    return [{ type: 'success', text: `Removed: ${target.name} (${target.cal} cal) ✓` }];
  }

  // Weigh-in
  if (/\b(weight|weigh|weighed)\b/.test(lower)) {
    const w = num(lower);
    if (w && w >= 100 && w <= 400) {
      addWeighIn(w);
      return [{ type: 'success', text: `Logged weigh-in: ${w} lbs ✓` }];
    }
  }

  // Run
  if (/\b(ran|run|running|walked|walk|jog|jogged|miles?)\b/.test(lower)) {
    const m = num(lower);
    if (m && m > 0 && m < 100) {
      addRun(m);
      return [{ type: 'success', text: `Logged ${m} mile run ✓` }];
    }
  }

  // Water — only match when water/bottle/hydrat keyword is present
  if (/\b(water|bottle|hydrat)\b/.test(lower)) {
    const b = num(lower);
    if (b !== null && b >= 0 && b <= 10) {
      setWater(Math.round(b));
      return [{ type: 'success', text: `Water updated to ${Math.round(b)} bottles ✓` }];
    }
    const next = Math.min((daily.water || 0) + 1, targets.waterBottles);
    setWater(next);
    return [{ type: 'success', text: `Water: ${next}/${targets.waterBottles} bottles ✓` }];
  }

  // Meditation
  if (/\b(meditat|tm|transcendental|mindful|mindfulness)\b/.test(lower)) {
    if (!daily.meditation) {
      toggleMeditation();
      return [{ type: 'success', text: 'Meditation checked ✓' }];
    }
    return [{ type: 'info', text: 'Meditation already logged for today ✓' }];
  }

  // Exercise
  const exercisePatterns = [
    /\b(bench|squat|deadlift|press|row|pulldown|lunge|curl|dip|pull.?up|push.?up|overhead|ohp|rdl)\b/,
  ];
  const exMatch = exercisePatterns.some(p => p.test(lower));
  if (exMatch) {
    const weightMatch = lower.match(/(\d+\.?\d*)\s*(lb|lbs|pound|kg)/);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : null;
    const setsRepsMatch = lower.match(/(\d+)\s*[x×]\s*(\d+)/) ||
      lower.match(/(\d+)\s*sets?\s*(?:of\s*)?(\d+)\s*reps?/);
    const sets = setsRepsMatch ? parseInt(setsRepsMatch[1]) : 3;
    const reps = setsRepsMatch ? parseInt(setsRepsMatch[2]) : 12;

    let exName = 'Exercise';
    if (/bench/.test(lower)) exName = 'DB Bench Press';
    else if (/squat/.test(lower)) exName = 'Goblet Squat';
    else if (/deadlift|rdl/.test(lower)) exName = 'DB Romanian Deadlift';
    else if (/overhead|ohp/.test(lower)) exName = 'Overhead Press';
    else if (/row/.test(lower)) exName = 'DB Row';
    else if (/pulldown|pull.?down/.test(lower)) exName = 'Lat Pulldown';
    else if (/lunge/.test(lower)) exName = 'DB Reverse Lunge';
    else if (/curl/.test(lower)) exName = 'DB Curl';
    else if (/press/.test(lower)) exName = 'DB Press';

    const useWeight = weight || (getLastLift(exName)?.weight) || 0;
    addExercise({ name: exName, weight: useWeight, sets, reps });
    logLift(exName, useWeight, sets, reps);
    return [{ type: 'success', text: `Logged: ${exName} — ${useWeight}lbs × ${sets}×${reps} ✓` }];
  }

  // Food logging — check BEFORE status queries so "had a protein shake" doesn't trigger status
  const foodKeywords = /\b(ate|eat|had|eaten|lunch|dinner|breakfast|snack|drink|drank|consumed|having|eating)\b/;
  if (foodKeywords.test(lower)) {
    // Extract food name: remove the log keyword and common prefixes/suffixes
    let foodName = lower
      .replace(/\b(i|just|already|also|for|today|this morning|tonight|at)\b/g, ' ')
      .replace(/\b(ate|eat|had|eaten|consumed|having|eating|drink|drank)\b/g, ' ')
      .replace(/\b(for\s+)?(lunch|dinner|breakfast|snack)\b/g, ' ')
      .replace(/\b(a|an|some|my|the|some)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!foodName || foodName.length < 2) foodName = lower;
    return [{ type: 'searching', text: `Searching for "${foodName}"...`, foodQuery: foodName }];
  }

  // Status query — requires "how" or "what" or explicit query words
  if (/\b(how|what)\b/.test(lower) || /\b(show|tell me|summarize).*(stats|today|progress)\b/.test(lower)) {
    const calLeft = targets.calories - (daily.totalCal || 0);
    const proLeft = Math.max(0, targets.protein - (daily.totalProtein || 0));
    return [{
      type: 'info',
      text: `Today: ${daily.totalCal || 0} cal (${calLeft > 0 ? calLeft + ' left' : Math.abs(calLeft) + ' over'}) · ${daily.totalProtein || 0}g protein (${proLeft}g left) · ${daily.water || 0}/${targets.waterBottles} water`,
    }];
  }

  // Treat unknown input as food search
  if (lower.length > 2 && !/^(hi|hey|hello|thanks|ok|yes|no|cancel)$/.test(lower)) {
    return [{ type: 'searching', text: `Searching for "${text}"...`, foodQuery: text }];
  }

  return [{
    type: 'error',
    text: "Try: 'ran 2 miles', 'drank 2 bottles', 'ate chicken and rice', 'bench pressed 35 lbs 3x12', or 'weight is 221'",
  }];
}

export function ChatInterface({
  daily, targets, addFood, setWater, toggleMeditation, addRun, addWeighIn,
  addExercise, logLift, getLastLift, removeFood, onClose, embedded,
  onOpenScanner, initialInput,
}) {
  const today = getToday();
  const storageKey = `chat-${today}`;

  const [messages, setMessages] = useState(() => load(storageKey, []));
  const [input, setInput] = useState(initialInput || '');
  const [isSearching, setIsSearching] = useState(false);
  // pendingFood: { msgIndex, food } — tracks which confirm card is active
  const [pendingFood, setPendingFood] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    save(storageKey, messages.filter(m => m.type !== 'food-confirm' && m.type !== 'recent-suggest').slice(-50));
  }, [messages, storageKey]);

  const addMsg = (role, text, type = 'normal', extra = {}) => {
    setMessages(prev => [...prev, {
      role, text, type, ...extra,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }]);
  };

  const confirmFood = useCallback((food, msgIndex) => {
    addFood(food);
    saveRecentFood(food);
    setMessages(prev => prev.map((m, i) =>
      i === msgIndex ? { ...m, confirmed: true } : m
    ));
    addMsg('assistant', `✓ Logged: ${food.name} — ${food.cal} cal, ${food.protein}g protein`, 'success');
    setPendingFood(null);
  }, [addFood]);

  const rejectFood = useCallback((msgIndex) => {
    setMessages(prev => prev.map((m, i) =>
      i === msgIndex ? { ...m, confirmed: false } : m
    ));
    addMsg('assistant', "Got it. What did you actually have?", 'info');
    setPendingFood(null);
  }, []);

  const searchAndConfirm = useCallback(async (foodQuery, skipRecent = false) => {
    // Check recent foods first
    if (!skipRecent) {
      const recent = findRecentFood(foodQuery);
      if (recent) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          type: 'recent-suggest',
          food: recent,
          query: foodQuery,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }]);
        return;
      }
    }

    setIsSearching(true);
    try {
      let food = null;

      // Try Open Food Facts first — no key required, good global coverage
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodQuery)}&search_simple=1&action=process&json=1&page_size=5`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (res.ok) {
          const data = await res.json();
          const item = (data.products || []).find(p =>
            p.nutriments && (p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal']) && p.product_name
          );
          if (item?.nutriments) {
            const n = item.nutriments;
            const calPer100 = n['energy-kcal_100g'] || n['energy-kcal'] || 0;
            if (calPer100 > 0) {
              // Use serving_quantity when available for per-serving values; otherwise per 100g
              const servingQty = parseFloat(item.serving_quantity);
              const mult = servingQty > 0 && servingQty <= 2000 ? servingQty / 100 : 1;
              const servingLabel = servingQty > 0 && servingQty <= 2000
                ? (item.serving_size || `${Math.round(servingQty)}g`)
                : 'per 100g';
              food = {
                name: item.product_name || foodQuery,
                brand: item.brands || '',
                cal: Math.round(calPer100 * mult),
                protein: Math.round((n.proteins_100g || n.proteins || 0) * mult),
                fat: Math.round((n.fat_100g || n.fat || 0) * mult),
                carbs: Math.round((n.carbohydrates_100g || n.carbohydrates || 0) * mult),
                fiber: Math.round((n.fiber_100g || n.fiber || 0) * mult),
                servingSize: servingLabel,
                source: 'Open Food Facts',
              };
            }
          }
        }
      } catch { /* fall through to USDA */ }

      // Fall back to USDA FDC
      if (!food) {
        try {
          const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodQuery)}&api_key=DEMO_KEY&pageSize=5&dataType=Survey%20(FNDDS),Branded,Foundation`;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            const data = await res.json();
            const items = data.foods || [];
            const item = items.find(f => f.dataType === 'Branded') || items[0];
            if (item) {
              const nutrients = item.foodNutrients || [];
              const getN = (num) => {
                const n = nutrients.find(n => n.nutrientNumber === String(num) || n.nutrientNumber === num);
                return n ? (n.value || 0) : 0;
              };
              // All USDA types return per-100g; apply serving size if available
              const calPer100 = getN(1008);
              if (calPer100 > 0) {
                const servingGrams = item.servingSize && item.servingSizeUnit?.toLowerCase() === 'g'
                  ? item.servingSize : null;
                const mult = servingGrams ? servingGrams / 100 : 1;
                const servingLabel = servingGrams
                  ? (item.householdServingFullText || `${Math.round(servingGrams)}g`)
                  : 'per 100g';
                food = {
                  name: item.description || foodQuery,
                  cal: Math.round(calPer100 * mult),
                  protein: Math.round(getN(203) * mult),
                  fat: Math.round(getN(204) * mult),
                  carbs: Math.round(getN(205) * mult),
                  fiber: Math.round(getN(291) * mult),
                  servingSize: servingLabel,
                  source: 'USDA',
                };
              }
            }
          }
        } catch { /* both APIs failed */ }
      }

      if (food) {
        setMessages(prev => {
          const newIdx = prev.length;
          setPendingFood({ msgIndex: newIdx, food });
          return [...prev, {
            role: 'assistant',
            type: 'food-confirm',
            food,
            query: foodQuery,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          }];
        });
      } else {
        addMsg('assistant', `Couldn't find "${foodQuery}". Try a simpler name, or type calories manually (e.g. "apple 95 cal 0g protein").`, 'error');
      }
    } catch {
      addMsg('assistant', 'Search unavailable. Log food manually.', 'error');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle barcode lookup
  const handleBarcodeLookup = useCallback(async (barcode) => {
    addMsg('user', `📸 Scanned barcode: ${barcode}`);
    setIsSearching(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const item = data.product;
          const n = item.nutriments || {};
          const cal = Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0);
          if (cal > 0) {
            const food = {
              name: `${item.brands ? item.brands + ' ' : ''}${item.product_name || 'Unknown'}`.trim(),
              cal,
              protein: Math.round(n.proteins_100g || n.proteins || 0),
              fat: Math.round(n.fat_100g || n.fat || 0),
              carbs: Math.round(n.carbohydrates_100g || n.carbohydrates || 0),
              fiber: Math.round(n.fiber_100g || n.fiber || 0),
              servingSize: item.serving_size || null,
            };
            setMessages(prev => {
              const newIdx = prev.length;
              setPendingFood({ msgIndex: newIdx, food });
              return [...prev, {
                role: 'assistant',
                type: 'food-confirm',
                food,
                query: barcode,
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              }];
            });
          } else {
            addMsg('assistant', 'Product found but no nutrition data. Enter manually?', 'error');
          }
        } else {
          addMsg('assistant', 'Barcode not found in database. Try searching by name.', 'error');
        }
      }
    } catch {
      addMsg('assistant', 'Barcode lookup failed. Try searching by name.', 'error');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Expose barcode handler to parent
  useEffect(() => {
    if (window.__chatHandleBarcode !== handleBarcodeLookup) {
      window.__chatHandleBarcode = handleBarcodeLookup;
    }
  }, [handleBarcodeLookup]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    addMsg('user', text);
    setInput('');

    const ctx = {
      daily,
      targets,
      addFood,
      setWater,
      toggleMeditation,
      addRun,
      addWeighIn,
      addExercise,
      logLift,
      getLastLift,
      removeFood,
    };

    const responses = parseMessage(text, ctx);
    responses.forEach(r => {
      if (r.type === 'searching' && r.foodQuery) {
        addMsg('assistant', r.text, 'info');
        searchAndConfirm(r.foodQuery);
      } else {
        addMsg('assistant', r.text, r.type);
      }
    });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const CHIPS = [
    { label: '🥗 Food', prefill: 'I ate ', large: true },
    { label: '🏃 Run', prefill: 'I ran ' },
    { label: '💧 Water', prefill: 'drank water' },
    { label: '⚖️ Weight', prefill: 'weight is ' },
    { label: '🧘 TM', prefill: 'did my meditation' },
    { label: '📸 Scan', action: 'scan' },
  ];

  // Auto-focus input when embedded Log tab opens
  useEffect(() => {
    if (embedded) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [embedded]);

  const containerClass = embedded
    ? 'flex flex-col h-full bg-[#0f1117]'
    : 'fixed inset-0 z-50 flex flex-col max-w-lg mx-auto bg-[#0f1117]';

  const containerStyle = embedded
    ? {}
    : { paddingTop: 'max(env(safe-area-inset-top), 8px)', paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' };

  return (
    <div className={containerClass} style={containerStyle}>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] shrink-0">
          <div>
            <h2 className="text-base font-bold">Quick Log</h2>
            <p className="text-[13px] text-white/40">Natural language logger</p>
          </div>
          <button onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/[0.06] text-white/60 border-none
              cursor-pointer text-lg flex items-center justify-center">
            ✕
          </button>
        </div>
      )}

      {embedded && (
        <div className="px-4 py-3 border-b border-white/[0.08] shrink-0"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
          <h2 className="text-[20px] font-bold">Log</h2>
          <p className="text-sm text-white/40">Type anything — food, run, water, weight</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-[17px] text-white/60 mb-1">Tell me what you did.</p>
            <p className="text-[15px] text-white/35 mb-5">I'll log it for you.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'I ran 2 miles',
                'ate chicken and rice',
                'drank 3 bottles of water',
                'bench pressed 35 lbs 3x12',
                'what are my calories today',
                'did my meditation',
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-left text-[15px] text-white/50 bg-white/[0.04] rounded-xl
                    px-3 py-3 border border-white/[0.06] cursor-pointer active:opacity-70 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.type === 'food-confirm') {
            if (msg.confirmed === true) {
              return (
                <div key={i} className="flex justify-start">
                  <div className="bg-green-500/15 border border-green-500/30 text-green-300
                    rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm max-w-[85%]">
                    ✓ Logged: {msg.food.name} — {msg.food.cal} cal, {msg.food.protein}g protein
                    <p className="text-sm opacity-50 mt-1">{msg.time}</p>
                  </div>
                </div>
              );
            }
            if (msg.confirmed === false) {
              return (
                <div key={i} className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/[0.08] text-white/40
                    rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm max-w-[85%]">
                    ✗ {msg.food.name} (not logged)
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex justify-start w-full">
                <FoodConfirmCard
                  msg={msg}
                  onConfirm={(food) => confirmFood(food, i)}
                  onReject={() => rejectFood(i)}
                />
              </div>
            );
          }

          if (msg.type === 'recent-suggest') {
            return (
              <div key={i} className="flex justify-start w-full">
                <RecentFoodCard
                  food={msg.food}
                  onYes={() => {
                    confirmFood(msg.food, i);
                    setMessages(prev => prev.map((m, idx) =>
                      idx === i ? { ...m, confirmed: true } : m
                    ));
                  }}
                  onSearchAgain={() => {
                    setMessages(prev => prev.map((m, idx) =>
                      idx === i ? { ...m, confirmed: false } : m
                    ));
                    searchAndConfirm(msg.query, true);
                  }}
                />
              </div>
            );
          }

          return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px]
                ${msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : msg.type === 'success'
                    ? 'bg-green-500/15 border border-green-500/30 text-green-300 rounded-bl-sm'
                    : msg.type === 'error'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm'
                      : 'bg-white/[0.06] text-white/80 rounded-bl-sm'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
                <p className="text-sm opacity-50 mt-1">{msg.time}</p>
              </div>
            </div>
          );
        })}

        {isSearching && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-white/30 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick-action chips */}
      <div className="px-4 pt-2 pb-1 flex gap-2 overflow-x-auto shrink-0">
        {CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => {
              if (chip.action === 'scan') {
                onOpenScanner?.();
              } else {
                setInput(chip.prefill);
                inputRef.current?.focus();
              }
            }}
            className={`shrink-0 border rounded-full cursor-pointer active:scale-95 whitespace-nowrap
              ${chip.large
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 px-4 py-2.5 text-[15px] font-semibold'
                : 'bg-white/[0.08] border-white/[0.1] text-white/70 px-3.5 py-2 text-sm'}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.08] shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            enterKeyHint="send"
            autoComplete="off"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="I ran 2 miles, ate a salad..."
            className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl
              px-4 text-[17px] text-white outline-none placeholder:text-white/25
              focus:border-blue-500/50"
            style={{ height: '52px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSearching}
            className="w-[52px] h-[52px] bg-blue-500 text-white rounded-2xl border-none cursor-pointer
              flex items-center justify-center text-xl active:opacity-80
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
