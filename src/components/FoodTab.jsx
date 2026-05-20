import { useState } from 'react';
import { TARGETS, QUICK_FOODS } from '../data/constants';
import { Card, CardTitle, Input, Button, Label } from './UI';

export function FoodTab({ daily, totalCal, totalProtein, addFood, removeFood, customFoods, addCustomFood, notify }) {
  const [showQuick, setShowQuick] = useState(false);
  const [form, setForm] = useState({ name: '', cal: '', protein: '' });
  const [saveAsPreset, setSaveAsPreset] = useState(false);

  const calLeft = TARGETS.calories - totalCal;
  const proteinLeft = Math.max(0, TARGETS.protein - totalProtein);

  const handleAdd = () => {
    if (!form.name || !form.cal) return;
    const item = {
      name: form.name,
      cal: parseInt(form.cal) || 0,
      protein: parseInt(form.protein) || 0,
    };
    addFood(item);
    if (saveAsPreset) {
      addCustomFood(item);
      notify(`Added "${item.name}" to presets`);
    } else {
      notify(`+${item.cal} cal, +${item.protein}g protein`);
    }
    setForm({ name: '', cal: '', protein: '' });
    setSaveAsPreset(false);
  };

  const handleQuickAdd = (food) => {
    addFood({ name: food.name, cal: food.cal, protein: food.protein });
    setShowQuick(false);
    notify(`+${food.cal} cal, +${food.protein}g protein`);
  };

  const allPresets = [...QUICK_FOODS, ...customFoods];

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Running Totals */}
      <Card>
        <div className="flex justify-around text-center">
          <div>
            <span className="text-lg font-bold">{totalCal}</span>
            <span className="text-xs text-white/50">/{TARGETS.calories} cal</span>
          </div>
          <div>
            <span className="text-lg font-bold">{totalProtein}g</span>
            <span className="text-xs text-white/50">/{TARGETS.protein}g pro</span>
          </div>
        </div>
        <div className="flex justify-around text-center mt-2 pt-2 border-t border-white/[0.06]">
          <div className="text-xs">
            <span className={calLeft < 0 ? 'text-red-400 font-bold' : 'text-white/60'}>
              {calLeft} cal left
            </span>
          </div>
          <div className="text-xs">
            <span className={proteinLeft === 0 ? 'text-green-400 font-bold' : 'text-white/60'}>
              {proteinLeft}g protein left
            </span>
          </div>
        </div>
      </Card>

      {/* Quick Add Toggle */}
      <button
        onClick={() => setShowQuick(!showQuick)}
        className={`w-full rounded-xl py-3 mb-3 text-sm font-semibold cursor-pointer
          transition-all active:scale-[0.98] border
          ${showQuick
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'bg-white/[0.04] border-white/[0.08] text-white/70'
          }`}
      >
        {showQuick ? 'Hide Quick Add' : '⚡ Quick Add Meal'}
      </button>

      {/* Quick Add List */}
      {showQuick && (
        <Card className="max-h-72 overflow-y-auto">
          {allPresets.map((f, i) => (
            <button
              key={f.id || i}
              onClick={() => handleQuickAdd(f)}
              className="flex justify-between w-full py-3 border-b border-white/[0.06]
                last:border-0 bg-transparent text-left cursor-pointer
                active:bg-white/[0.05] transition-colors"
            >
              <span className="text-sm text-white/90">{f.name}</span>
              <span className="text-xs text-white/40 whitespace-nowrap ml-2">
                {f.cal}cal · {f.protein}g
              </span>
            </button>
          ))}
        </Card>
      )}

      {/* Custom Entry */}
      <Card>
        <CardTitle>Custom Entry</CardTitle>
        <div className="flex flex-col gap-2">
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
        <CardTitle right={`${daily.food.length} items`}>Today's Log</CardTitle>
        {daily.food.length === 0 ? (
          <p className="text-sm text-white/40">Empty</p>
        ) : (
          daily.food.map(f => (
            <div key={f.id} className="flex justify-between items-center py-2
              border-b border-white/[0.06] last:border-0">
              <div>
                <div className="text-sm">{f.name}</div>
                <div className="text-xs text-white/40">{f.cal} cal · {f.protein}g protein</div>
              </div>
              <button
                onClick={() => removeFood(f.id)}
                className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 border-none
                  cursor-pointer text-base flex items-center justify-center
                  active:bg-red-500/30 transition-colors"
              >
                ×
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
