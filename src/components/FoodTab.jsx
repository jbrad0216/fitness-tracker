import { useState, useRef, useEffect, useCallback } from 'react';
import { QUICK_FOODS } from '../data/constants';
import { Card, CardTitle, Input, Button, Label } from './UI';
import { useFoodSearch } from '../hooks/useFoodSearch';

const CATEGORIES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'meal', label: 'Meals' },
  { id: 'snack', label: 'Snacks' },
  { id: 'custom', label: 'Custom' },
];

function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function UndoBar({ item, onUndo, onDismiss }) {
  const [remaining, setRemaining] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(interval); onDismiss(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDismiss]);

  return (
    <div className="flex items-center justify-between bg-green-500/15 border border-green-500/30
      rounded-xl px-4 py-2.5 mb-3 animate-fade-in">
      <span className="text-sm text-green-300">Added {item.name}</span>
      <button
        onClick={onUndo}
        className="text-sm font-bold text-green-400 bg-transparent border-none cursor-pointer"
      >
        Undo ({remaining}s)
      </button>
    </div>
  );
}

function LongPressDeleteButton({ onDelete }) {
  const timerRef = useRef(null);
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  const startPress = useCallback(() => {
    setHolding(true);
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(intervalRef.current);
        onDelete();
        setHolding(false);
        setProgress(0);
      }
    }, 80);
  }, [onDelete]);

  const cancelPress = useCallback(() => {
    clearInterval(intervalRef.current);
    setHolding(false);
    setProgress(0);
  }, []);

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      title="Hold to delete"
      className="relative w-9 h-9 rounded-lg bg-red-500/15 text-red-400 border-none
        cursor-pointer text-base flex items-center justify-center overflow-hidden
        transition-colors active:bg-red-500/30"
      style={{ flexShrink: 0 }}
    >
      {holding && (
        <div
          className="absolute inset-0 bg-red-500/30 origin-left transition-none"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      )}
      <span className="relative z-10">×</span>
    </button>
  );
}

function FoodSearchDropdown({ onSelect }) {
  const { query, setQuery, results, loading, error, clear } = useFoodSearch();
  const [open, setOpen] = useState(false);

  const handleSelect = (item) => {
    onSelect(item);
    clear();
    setOpen(false);
  };

  return (
    <div className="relative mb-2">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search food database (USDA)..."
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
            Searching...
          </span>
        )}
        {query && !loading && (
          <button
            onClick={() => { clear(); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 bg-transparent border-none cursor-pointer text-sm"
          >✕</button>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-amber-400/70 mt-1">{error}</p>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-30 w-full mt-1 rounded-xl bg-[#1a1d27] border border-white/[0.1]
          shadow-2xl max-h-72 overflow-y-auto">
          {results.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="flex justify-between w-full py-3 px-4 border-b border-white/[0.06]
                last:border-0 bg-transparent text-left cursor-pointer active:bg-white/[0.05]"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-sm text-white/90 truncate">{item.name}</div>
                {item.brand && <div className="text-[11px] text-white/35 truncate">{item.brand}</div>}
                <div className="text-[11px] text-white/40 mt-0.5">
                  {item.fat}g fat · {item.carbs}g carbs · {item.fiber}g fiber
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-white/70 font-semibold">{item.cal} cal</div>
                <div className="text-[11px] text-blue-400">{item.protein}g pro</div>
                <div className="text-[10px] text-white/25">{item.serving}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FoodTab({
  daily, totalCal, totalProtein, addFood, removeFood,
  customFoods, addCustomFood, copyYesterday, targets, notify,
}) {
  const [showQuick, setShowQuick] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', cal: '', protein: '', fat: '', carbs: '', fiber: '' });
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [undoItem, setUndoItem] = useState(null);

  const calLeft = targets.calories - totalCal;
  const proteinLeft = Math.max(0, targets.protein - totalProtein);

  const handleSelectFromSearch = (item) => {
    setForm({
      name: item.brand ? `${item.name} (${item.brand})` : item.name,
      cal: String(item.cal),
      protein: String(item.protein),
      fat: String(item.fat || ''),
      carbs: String(item.carbs || ''),
      fiber: String(item.fiber || ''),
    });
  };

  const handleAdd = () => {
    if (!form.name || !form.cal) return;
    const item = {
      name: form.name,
      cal: parseInt(form.cal) || 0,
      protein: parseInt(form.protein) || 0,
      fat: parseInt(form.fat) || 0,
      carbs: parseInt(form.carbs) || 0,
      fiber: parseInt(form.fiber) || 0,
    };
    addFood(item);
    if (saveAsPreset) {
      addCustomFood(item);
    }
    notify(`+${item.cal} cal, +${item.protein}g protein`);
    setForm({ name: '', cal: '', protein: '', fat: '', carbs: '', fiber: '' });
    setSaveAsPreset(false);
  };

  const handleQuickAdd = (food) => {
    const item = { name: food.name, cal: food.cal, protein: food.protein };
    addFood(item);
    setUndoItem({ ...item, id: null }); // will be set by last added
    setShowQuick(false);
    notify(`+${food.cal} cal, +${food.protein}g protein`);
  };

  const handleUndo = () => {
    // Remove the last added food item
    const lastFood = daily.food[daily.food.length - 1];
    if (lastFood) {
      removeFood(lastFood.id);
      notify('Removed');
    }
    setUndoItem(null);
  };

  const handleCopyYesterday = () => {
    if (!copyYesterday) return;
    const count = copyYesterday();
    if (count > 0) {
      notify(`Copied ${count} items from yesterday`);
    } else {
      notify('No food logged yesterday');
    }
  };

  const allPresets = [
    ...QUICK_FOODS,
    ...customFoods.map(f => ({ ...f, category: 'custom' })),
  ];

  const filteredPresets = search
    ? allPresets.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : allPresets;

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: filteredPresets.filter(f => f.category === cat.id),
  })).filter(g => g.items.length > 0);

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Running Totals */}
      <Card>
        <div className="flex justify-around text-center">
          <div>
            <span className="text-lg font-bold">{totalCal}</span>
            <span className="text-xs text-white/50">/{targets.calories} cal</span>
          </div>
          <div>
            <span className="text-lg font-bold">{totalProtein}g</span>
            <span className="text-xs text-white/50">/{targets.protein}g pro</span>
          </div>
          {daily.food.some(f => f.fat) && (
            <div>
              <span className="text-lg font-bold">{daily.food.reduce((s, f) => s + (f.fat || 0), 0)}g</span>
              <span className="text-xs text-white/50"> fat</span>
            </div>
          )}
          {daily.food.some(f => f.carbs) && (
            <div>
              <span className="text-lg font-bold">{daily.food.reduce((s, f) => s + (f.carbs || 0), 0)}g</span>
              <span className="text-xs text-white/50"> carbs</span>
            </div>
          )}
        </div>
        <div className="flex justify-around text-center mt-2 pt-2 border-t border-white/[0.06]">
          <div className="text-xs">
            <span className={calLeft < 0 ? 'text-red-400 font-bold' : 'text-white/60'}>
              {calLeft < 0 ? `${Math.abs(calLeft)} over` : `${calLeft} cal left`}
            </span>
          </div>
          <div className="text-xs">
            <span className={proteinLeft === 0 ? 'text-green-400 font-bold' : 'text-white/60'}>
              {proteinLeft === 0 ? '✓ Protein goal hit' : `${proteinLeft}g protein left`}
            </span>
          </div>
        </div>
      </Card>

      {/* Undo bar */}
      {undoItem && (
        <UndoBar
          item={undoItem}
          onUndo={handleUndo}
          onDismiss={() => setUndoItem(null)}
        />
      )}

      {/* Quick Add Toggle + Copy Yesterday */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setShowQuick(!showQuick)}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold cursor-pointer
            transition-all active:scale-[0.98] border
            ${showQuick
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'bg-white/[0.04] border-white/[0.08] text-white/70'
            }`}
        >
          {showQuick ? 'Hide Quick Add' : '⚡ Quick Add'}
        </button>
        <button
          onClick={handleCopyYesterday}
          className="rounded-xl py-3 px-3 text-sm font-semibold cursor-pointer
            transition-all active:scale-[0.98] border
            bg-white/[0.04] border-white/[0.08] text-white/70"
          title="Copy yesterday's meals"
        >
          📋
        </button>
      </div>

      {/* Quick Add List */}
      {showQuick && (
        <Card className="p-0 overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-white/[0.06]">
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search foods..."
              className="w-full"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {grouped.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">No matches</p>
            ) : (
              grouped.map(group => (
                <div key={group.id}>
                  <div className="px-4 py-1.5 bg-white/[0.02]">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
                      {group.label}
                    </span>
                  </div>
                  {group.items.map((f, i) => (
                    <button
                      key={f.id || i}
                      onClick={() => handleQuickAdd(f)}
                      className="flex justify-between w-full py-3 px-4 border-b border-white/[0.06]
                        last:border-0 bg-transparent text-left cursor-pointer
                        active:bg-white/[0.05] transition-colors"
                    >
                      <span className="text-sm text-white/90">{f.name}</span>
                      <span className="text-xs text-white/40 whitespace-nowrap ml-2">
                        {f.cal}cal · {f.protein}g
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Food Database Search + Custom Entry */}
      <Card>
        <CardTitle>Add Food</CardTitle>
        <div className="flex flex-col gap-2">
          <FoodSearchDropdown onSelect={handleSelectFromSearch} />
          <Input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Food name"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Calories</Label>
              <Input
                type="number"
                value={form.cal}
                onChange={e => setForm({ ...form, cal: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label>Protein (g)</Label>
              <Input
                type="number"
                value={form.protein}
                onChange={e => setForm({ ...form, protein: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Fat (g)</Label>
              <Input
                type="number"
                value={form.fat}
                onChange={e => setForm({ ...form, fat: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label>Carbs (g)</Label>
              <Input
                type="number"
                value={form.carbs}
                onChange={e => setForm({ ...form, carbs: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <Label>Fiber (g)</Label>
              <Input
                type="number"
                value={form.fiber}
                onChange={e => setForm({ ...form, fiber: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsPreset}
              onChange={e => setSaveAsPreset(e.target.checked)}
              className="rounded"
            />
            Save as preset for Quick Add
          </label>
          <Button onClick={handleAdd} className="w-full">Add Food</Button>
        </div>
      </Card>

      {/* Today's Log */}
      <Card>
        <CardTitle right={daily.food.length > 0 ? `${daily.food.length} items` : null}>
          Today's Log
        </CardTitle>
        {daily.food.length === 0 ? (
          <p className="text-sm text-white/40">Empty — add meals above</p>
        ) : (
          daily.food.map(f => (
            <div key={f.id} className="flex justify-between items-center py-2.5
              border-b border-white/[0.06] last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{f.name}</div>
                <div className="flex items-center gap-2 text-xs text-white/40 flex-wrap">
                  <span>{f.cal} cal · {f.protein}g pro</span>
                  {(f.fat || f.carbs) && (
                    <span className="text-white/25">
                      {f.fat ? `${f.fat}g fat` : ''}
                      {f.fat && f.carbs ? ' · ' : ''}
                      {f.carbs ? `${f.carbs}g carbs` : ''}
                    </span>
                  )}
                  {f.loggedAt && (
                    <span className="text-white/20">· {formatTime(f.loggedAt)}</span>
                  )}
                </div>
              </div>
              <LongPressDeleteButton onDelete={() => removeFood(f.id)} />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
