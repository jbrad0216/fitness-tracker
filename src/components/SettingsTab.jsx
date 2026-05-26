import { useState, useEffect, useMemo } from 'react';
import { Card, CardTitle, Input, Button, Label, Toggle } from './UI';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import { exportAllData, importAllData, markExported, getLastExportDate, getBackupDates, restoreBackup } from '../data/storage';

function WorkoutEditor({ label, exercises, onUpdate, onRemove, onMove, onAdd }) {
  const [newEx, setNewEx] = useState({ name: '', sets: '3', reps: '12', defaultWeight: '' });
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleAdd = () => {
    if (!newEx.name) return;
    onAdd({ name: newEx.name, sets: parseInt(newEx.sets) || 3, reps: parseInt(newEx.reps) || 12, defaultWeight: parseFloat(newEx.defaultWeight) || 0 });
    setNewEx({ name: '', sets: '3', reps: '12', defaultWeight: '' });
  };

  const startEdit = (i) => { setEditIndex(i); setEditForm({ ...exercises[i] }); };
  const saveEdit = () => {
    onUpdate(editIndex, { name: editForm.name, sets: parseInt(editForm.sets) || 3, reps: parseInt(editForm.reps) || 12, defaultWeight: parseFloat(editForm.defaultWeight) || 0 });
    setEditIndex(null);
  };

  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-blue-400 mb-2">Workout {label}</h3>
      {exercises.map((ex, i) => (
        <div key={i} className="mb-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          {editIndex === i ? (
            <div className="flex flex-col gap-2">
              <Input type="text" inputMode="text" autoComplete="off" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Exercise name" />
              <div className="flex gap-1.5">
                <div className="flex-1"><Label>Wt (lbs)</Label><Input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done" value={editForm.defaultWeight} onChange={e => setEditForm(f => ({ ...f, defaultWeight: e.target.value }))} /></div>
                <div className="w-14"><Label>Sets</Label><Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" value={editForm.sets} onChange={e => setEditForm(f => ({ ...f, sets: e.target.value }))} /></div>
                <div className="w-14"><Label>Reps</Label><Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" value={editForm.reps} onChange={e => setEditForm(f => ({ ...f, reps: e.target.value }))} /></div>
              </div>
              <div className="flex gap-1.5">
                <Button onClick={saveEdit} className="flex-1 text-base py-3">Save</Button>
                <Button onClick={() => setEditIndex(null)} variant="ghost" className="text-base py-3">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-base truncate">{ex.name}</div>
                <div className="text-base text-white/40">{ex.defaultWeight}lbs · {ex.sets}×{ex.reps}</div>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button onClick={() => onMove(i, -1)} disabled={i === 0} className="w-12 h-12 rounded-lg bg-white/[0.05] text-white/50 border-none cursor-pointer text-base disabled:opacity-20">↑</button>
                <button onClick={() => onMove(i, 1)} disabled={i === exercises.length - 1} className="w-12 h-12 rounded-lg bg-white/[0.05] text-white/50 border-none cursor-pointer text-base disabled:opacity-20">↓</button>
                <button onClick={() => startEdit(i)} className="w-12 h-12 rounded-lg bg-blue-500/15 text-blue-400 border-none cursor-pointer text-base">✏️</button>
                <button onClick={() => onRemove(i)} className="w-12 h-12 rounded-lg bg-red-500/15 text-red-400 border-none cursor-pointer text-base">×</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
        <p className="text-base text-white/30 mb-2 uppercase tracking-wider">Add Exercise</p>
        <div className="flex flex-col gap-1.5">
          <Input type="text" inputMode="text" autoComplete="off" value={newEx.name} onChange={e => setNewEx(f => ({ ...f, name: e.target.value }))} placeholder="Exercise name" />
          <div className="flex gap-1.5">
            <Input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done" value={newEx.defaultWeight} onChange={e => setNewEx(f => ({ ...f, defaultWeight: e.target.value }))} placeholder="Wt" className="flex-1" />
            <Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" value={newEx.sets} onChange={e => setNewEx(f => ({ ...f, sets: e.target.value }))} placeholder="Sets" className="w-16" />
            <Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" value={newEx.reps} onChange={e => setNewEx(f => ({ ...f, reps: e.target.value }))} placeholder="Reps" className="w-16" />
          </div>
          <Button onClick={handleAdd} variant="ghost" className="w-full text-base py-3">+ Add</Button>
        </div>
      </div>
    </div>
  );
}

const SCHEDULED_MEALS_KEY = 'ft_scheduled-meals';
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ScheduledMealsEditor({ notify }) {
  const [meals, setMeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SCHEDULED_MEALS_KEY) || '[]'); } catch { return []; }
  });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', cal: '', protein: '', days: [], meal: 'breakfast' });

  const save = (next) => {
    setMeals(next);
    localStorage.setItem(SCHEDULED_MEALS_KEY, JSON.stringify(next));
  };

  const handleAdd = () => {
    if (!form.name || form.days.length === 0) return;
    save([...meals, { ...form, cal: parseInt(form.cal) || 0, protein: parseInt(form.protein) || 0, id: Date.now().toString() }]);
    setForm({ name: '', cal: '', protein: '', days: [], meal: 'breakfast' });
    setAdding(false);
    notify('Scheduled meal saved');
  };

  const toggleDay = (d) => setForm(f => ({
    ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d]
  }));

  return (
    <div>
      {meals.length === 0 && !adding && (
        <p className="text-base text-white/30 mb-3">No scheduled meals yet. Add a recurring meal below.</p>
      )}
      {meals.map(m => (
        <div key={m.id} className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 mb-2 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold truncate">{m.name}</div>
            <div className="text-base text-white/40">
              {m.cal} cal · {m.protein}g · {m.meal} · {m.days.map(d => DAYS_OF_WEEK[d].slice(0,3)).join(', ')}
            </div>
          </div>
          <button onClick={() => save(meals.filter(x => x.id !== m.id))}
            className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 border-none cursor-pointer text-base">×</button>
        </div>
      ))}
      {adding ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 mt-2">
          <Input type="text" inputMode="text" autoComplete="off" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Meal name (e.g. Overnight Oats)" className="mb-2" />
          <div className="flex gap-1.5 mb-2">
            <Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" value={form.cal} onChange={e => setForm(f => ({ ...f, cal: e.target.value }))} placeholder="Cal" className="flex-1" />
            <Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} placeholder="Protein g" className="flex-1" />
          </div>
          <select
            value={form.meal}
            onChange={e => setForm(f => ({ ...f, meal: e.target.value }))}
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-base text-white outline-none mb-2 h-12"
          >
            {['breakfast','lunch','snack','dinner'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="text-base text-white/40 mb-1">Which days?</div>
          <div className="flex gap-1 flex-wrap mb-2">
            {DAYS_OF_WEEK.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)}
                className={`px-3 h-12 rounded-lg text-base font-semibold border cursor-pointer
                  ${form.days.includes(i) ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/[0.05] border-white/[0.08] text-white/50'}`}>
                {d.slice(0,3)}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Button onClick={handleAdd} className="flex-1 text-base py-3">Save Meal</Button>
            <Button onClick={() => setAdding(false)} variant="ghost" className="text-base py-3">Cancel</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full border border-dashed border-white/[0.1] rounded-xl py-3.5 text-base
            text-white/40 cursor-pointer bg-transparent mt-1">
          + Add Scheduled Meal
        </button>
      )}
    </div>
  );
}

function parseHeightStr(h) {
  const m = String(h || '').match(/^(\d+)['\s"]*(\d+)/);
  if (m) return { feet: m[1], inches: m[2] };
  return { feet: '6', inches: '1' };
}
function buildHeightStr(feet, inches) {
  return `${parseInt(feet) || 6}'${parseInt(inches) || 0}"`;
}

function computeChangeSummary(prev, next) {
  const changes = [];

  const toNum = (v, fallback) => parseFloat(v) || fallback;

  const prevCal = toNum(prev.calories, 2400);
  const nextCal = toNum(next.calories, 2400);
  if (Math.abs(prevCal - nextCal) >= 50) {
    const delta = nextCal - prevCal;
    const reason = delta < 0
      ? 'larger deficit targets faster fat loss'
      : 'smaller deficit is more sustainable';
    changes.push({ label: 'Calories', from: `${prevCal.toLocaleString()} cal`, to: `${nextCal.toLocaleString()} cal`, reason });
  }

  const prevPro = toNum(prev.protein, 160);
  const nextPro = toNum(next.protein, 160);
  if (Math.abs(prevPro - nextPro) >= 5) {
    const reason = nextPro > prevPro
      ? 'higher protein preserves muscle during fat loss'
      : 'protein target reduced';
    changes.push({ label: 'Protein', from: `${prevPro}g`, to: `${nextPro}g`, reason });
  }

  const prevGoal = toNum(prev.goalWeight, 200);
  const nextGoal = toNum(next.goalWeight, 200);
  if (Math.abs(prevGoal - nextGoal) >= 0.5) {
    const reason = nextGoal < prevGoal ? 'more ambitious target' : 'more conservative target';
    changes.push({ label: 'Goal weight', from: `${prevGoal} lbs`, to: `${nextGoal} lbs`, reason });
  }

  const prevStart = toNum(prev.startWeight, 221);
  const nextStart = toNum(next.startWeight, 221);
  if (Math.abs(prevStart - nextStart) >= 0.5) {
    changes.push({ label: 'Current weight', from: `${prevStart} lbs`, to: `${nextStart} lbs`, reason: 'updates base calculations' });
  }

  const prevWater = toNum(prev.waterBottles, 3);
  const nextWater = toNum(next.waterBottles, 3);
  if (prevWater !== nextWater) {
    changes.push({ label: 'Water target', from: `${prevWater * 32}oz`, to: `${nextWater * 32}oz`, reason: 'hydration target adjusted' });
  }

  const prevSodium = toNum(prev.sodiumMg, 2000);
  const nextSodium = toNum(next.sodiumMg, 2000);
  if (Math.abs(prevSodium - nextSodium) >= 100) {
    changes.push({ label: 'Sodium limit', from: `${prevSodium}mg`, to: `${nextSodium}mg`, reason: nextSodium < prevSodium ? 'stricter sodium limit for blood pressure' : 'sodium limit relaxed' });
  }

  // Timeline impact: if calories or goal weight changed
  const prevWeeks = prevGoal > 0 && prevCal > 0
    ? Math.max(0, Math.ceil(((prevStart - prevGoal) / ((2900 - prevCal) * 7 / 3500))))
    : null;
  const nextWeeks = nextGoal > 0 && nextCal > 0
    ? Math.max(0, Math.ceil(((nextStart - nextGoal) / ((2900 - nextCal) * 7 / 3500))))
    : null;
  if (prevWeeks && nextWeeks && Math.abs(prevWeeks - nextWeeks) >= 1) {
    const reason = nextWeeks < prevWeeks ? 'faster pace' : 'slower, more sustainable pace';
    changes.push({ label: 'Est. timeline', from: `~${prevWeeks} weeks`, to: `~${nextWeeks} weeks`, reason });
  }

  return changes;
}

export function SettingsTab({ settings, updateSettings, resetSettings, templates, workoutOps, notify }) {
  const [form, setForm] = useState({ ...settings });
  const [showBackups, setShowBackups] = useState(false);
  const [backupDates, setBackupDates] = useState([]);
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem('ft_auto-backup') !== 'off');
  const [pendingChanges, setPendingChanges] = useState(null);

  useEffect(() => { setForm({ ...settings }); }, [settings]);

  const lastExport = useMemo(() => getLastExportDate(), []);
  const daysSinceExport = lastExport ? Math.floor((new Date() - new Date(lastExport)) / 86400000) : null;

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const file = new File([blob], `fitness-backup-${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: 'Fitness Tracker Backup' }).catch(() => downloadFallback(blob));
    } else {
      downloadFallback(blob);
    }
    markExported();
    notify('Data exported');
  };

  const downloadFallback = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importAllData(ev.target.result);
      if (ok) { notify('Imported — reloading...'); setTimeout(() => window.location.reload(), 1000); }
      else notify('Import failed — bad format');
    };
    reader.readAsText(file);
  };

  const handleRestore = (date) => {
    if (!window.confirm(`Restore data from ${date}? Current data will be overwritten.`)) return;
    const ok = restoreBackup(date);
    if (ok) { notify('Restored — refreshing...'); setTimeout(() => window.location.reload(), 1000); }
    else notify('Restore failed');
  };

  const buildNextSettings = () => ({
    name: form.name || DEFAULT_SETTINGS.name,
    age: parseInt(form.age) || DEFAULT_SETTINGS.age,
    height: form.height || DEFAULT_SETTINGS.height,
    startWeight: parseFloat(form.startWeight) || DEFAULT_SETTINGS.startWeight,
    goalWeight: parseFloat(form.goalWeight) || DEFAULT_SETTINGS.goalWeight,
    calories: parseInt(form.calories) || DEFAULT_SETTINGS.calories,
    protein: parseInt(form.protein) || DEFAULT_SETTINGS.protein,
    waterBottles: Math.max(1, Math.min(6, parseInt(form.waterBottles) || DEFAULT_SETTINGS.waterBottles)),
    sodiumMg: parseInt(form.sodiumMg) || DEFAULT_SETTINGS.sodiumMg,
    theme: form.theme || 'dark',
    goal: form.goal || DEFAULT_SETTINGS.goal,
    pace: form.pace || DEFAULT_SETTINGS.pace,
  });

  const handleSave = () => {
    const next = buildNextSettings();
    const changes = computeChangeSummary(settings, next);
    if (changes.length > 0) {
      setPendingChanges({ next, changes });
    } else {
      updateSettings(next);
      notify('Settings saved');
    }
  };

  const confirmSave = () => {
    if (!pendingChanges) return;
    updateSettings(pendingChanges.next);
    setPendingChanges(null);
    notify('Settings saved ✓');
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => setForm(prev => ({ ...prev, [field]: e.target.value })),
  });

  // Get Apple Health data
  const healthData = (() => {
    try { return JSON.parse(localStorage.getItem('ft_apple-health-today') || 'null'); } catch { return null; }
  })();

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Profile */}
      <Card>
        <CardTitle>Profile</CardTitle>
        <div className="flex flex-col gap-3">
          <div><Label>Name</Label><Input type="text" inputMode="text" autoComplete="off" {...f('name')} placeholder="Your name" /></div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Age</Label>
              <Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" {...f('age')} placeholder="48" />
            </div>
            <div className="flex-1">
              <Label>Height</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    enterKeyHint="next"
                    value={parseHeightStr(form.height).feet}
                    onChange={e => setForm(prev => ({ ...prev, height: buildHeightStr(e.target.value, parseHeightStr(prev.height).inches) }))}
                    placeholder="6"
                    className="text-center"
                  />
                  <div className="text-base text-white/40 text-center mt-1">ft</div>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    enterKeyHint="done"
                    value={parseHeightStr(form.height).inches}
                    onChange={e => setForm(prev => ({ ...prev, height: buildHeightStr(parseHeightStr(prev.height).feet, e.target.value) }))}
                    placeholder="1"
                    className="text-center"
                  />
                  <div className="text-base text-white/40 text-center mt-1">in</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><Label>Start Weight (lbs)</Label><Input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done" {...f('startWeight')} placeholder="222" /></div>
            <div className="flex-1"><Label>Goal Weight (lbs)</Label><Input type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done" {...f('goalWeight')} placeholder="200" /></div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Daily Targets</CardTitle>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1"><Label>Calories</Label><Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" {...f('calories')} placeholder="2400" /></div>
            <div className="flex-1"><Label>Protein (g)</Label><Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" {...f('protein')} placeholder="160" /></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><Label>Water (32oz bottles)</Label><Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" {...f('waterBottles')} placeholder="3" /></div>
            <div className="flex-1"><Label>Sodium Max (mg)</Label><Input type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" {...f('sodiumMg')} placeholder="2000" /></div>
          </div>
        </div>
      </Card>

      {/* Change comparison panel */}
      {pendingChanges && (
        <div className="bg-blue-500/[0.07] border border-blue-500/20 rounded-2xl p-4 mb-4">
          <div className="text-base font-bold mb-3 text-blue-300">Changes to your plan:</div>
          <div className="space-y-2 mb-4">
            {pendingChanges.changes.map((c, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-white/60 w-28 shrink-0">{c.label}:</span>
                  <span className="text-base text-white/40 line-through">{c.from}</span>
                  <span className="text-white/40">→</span>
                  <span className="text-base font-bold text-white">{c.to}</span>
                </div>
                <div className="text-base text-white/40 pl-28">({c.reason})</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmSave}
              className="flex-1 bg-blue-500 text-white rounded-xl h-14 text-base font-bold
                border-none cursor-pointer active:opacity-80"
            >
              Save changes
            </button>
            <button
              onClick={() => setPendingChanges(null)}
              className="flex-1 bg-white/[0.08] text-white/60 rounded-xl h-14 text-base font-semibold
                border-none cursor-pointer active:opacity-70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Card>
        <CardTitle>Goal & Pace</CardTitle>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Primary Goal</Label>
            <select
              value={form.goal || 'fat-loss'}
              onChange={e => setForm(prev => ({ ...prev, goal: e.target.value }))}
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-3
                text-base text-white outline-none h-14"
            >
              <option value="fat-loss">🔥 Fat Loss — lose weight and burn fat</option>
              <option value="muscle">💪 Build Muscle — get stronger and bigger</option>
              <option value="heart-health">❤️ Heart Health — blood pressure &amp; cardio</option>
              <option value="lifestyle">🌱 Lifestyle Change — sustainable long-term</option>
              <option value="custom">✏️ Custom</option>
            </select>
          </div>
          <div>
            <Label>Pace</Label>
            <select
              value={form.pace || 'moderate'}
              onChange={e => setForm(prev => ({ ...prev, pace: e.target.value }))}
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-3
                text-base text-white outline-none h-14"
            >
              <option value="aggressive">⚡ Aggressive (4–6 weeks, larger deficit)</option>
              <option value="moderate">🎯 Moderate (8–12 weeks, recommended)</option>
              <option value="gradual">🌿 Gradual (16–20 weeks, most sustainable)</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 mb-4">
        <Button onClick={handleSave} className="flex-1">Save Settings</Button>
        <Button onClick={() => { resetSettings(); notify('Reset to defaults'); }} variant="danger" className="flex-1">Reset</Button>
      </div>

      <Card>
        <CardTitle>Scheduled Meals</CardTitle>
        <p className="text-base text-white/40 mb-3">Meals that auto-appear on selected days for quick logging.</p>
        <ScheduledMealsEditor notify={notify} />
      </Card>

      {/* Data & Backup — simplified (Task 6) */}
      <Card>
        <CardTitle>Data & Backup</CardTitle>

        {(daysSinceExport === null || daysSinceExport >= 30) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mb-3">
            <p className="text-base text-amber-400/80">
              {lastExport ? `⚠️ Last backup was ${daysSinceExport} days ago.` : '⚠️ No backup yet. Export soon!'}
            </p>
          </div>
        )}

        <Button onClick={handleExport} className="w-full mb-2">
          📤 Export Data (share / save file)
        </Button>

        <label className="w-full flex items-center justify-center rounded-xl h-14 text-base
          text-white/60 bg-transparent border border-white/[0.08] cursor-pointer mb-2">
          📥 Import from File
          <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </label>

        <div className="flex items-center justify-between py-2 mb-2">
          <div>
            <div className="text-base font-semibold">Auto-Backup</div>
            <div className="text-base text-white/40">
              {lastExport ? `Last backup: ${lastExport}` : 'Saves daily snapshot'}
            </div>
          </div>
          <Toggle
            checked={autoBackup}
            onChange={() => {
              const next = !autoBackup;
              setAutoBackup(next);
              localStorage.setItem('ft_auto-backup', next ? 'on' : 'off');
            }}
            label=""
          />
        </div>

        <button onClick={() => { setBackupDates(getBackupDates()); setShowBackups(b => !b); }}
          className="w-full text-base text-white/50 bg-transparent border border-white/[0.08]
            rounded-xl py-3 cursor-pointer mb-2">
          {showBackups ? 'Hide' : '🕐 Restore from Backup'}
        </button>

        {showBackups && (
          <div className="mt-1">
            {backupDates.length === 0
              ? <p className="text-base text-white/30 text-center py-2">No backups yet</p>
              : backupDates.map(date => (
                <div key={date} className="flex justify-between items-center py-2 border-b border-white/[0.06] last:border-0">
                  <span className="text-base text-white/60">{date}</span>
                  <button onClick={() => handleRestore(date)}
                    className="text-base px-4 py-2 rounded-lg bg-blue-500/15 text-blue-400 border-none cursor-pointer">
                    Restore
                  </button>
                </div>
              ))
            }
          </div>
        )}
      </Card>

      {/* Apple Health — Task 7 */}
      <Card>
        <CardTitle>Apple Health</CardTitle>
        <p className="text-base text-white/50 mb-3">
          PWAs can't access Health directly. Use Apple Shortcuts to sync data to this app.
        </p>

        {healthData && healthData.date === new Date().toISOString().split('T')[0] ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-3 mb-3">
            <div className="text-base font-semibold text-green-400 mb-1">✓ Today's Health Data</div>
            {healthData.steps && <div className="text-base text-white/70">Steps: {healthData.steps.toLocaleString()}</div>}
            {healthData.activeCal && <div className="text-base text-white/70">Active Cal: {healthData.activeCal}</div>}
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-3 mb-3">
            <p className="text-base text-white/40">No Health data today</p>
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3">
          <p className="text-base text-blue-300 font-semibold mb-2">Setup via Apple Shortcuts:</p>
          <ol className="text-base text-white/60 space-y-1 list-decimal list-inside">
            <li>Open the Shortcuts app on iPhone</li>
            <li>Create a new Shortcut</li>
            <li>Add "Get Health Samples" (Steps, Active Energy)</li>
            <li>Add "Open URLs" with: <span className="text-blue-400 break-all">https://your-app.vercel.app/?steps=[steps]&activeCal=[calories]</span></li>
            <li>Run the shortcut daily after your workout</li>
          </ol>
        </div>

        <p className="text-base text-white/30">
          The app reads the URL parameters and saves your Health data when you open it via the Shortcut.
        </p>
      </Card>

      {/* Appearance */}
      <Card>
        <CardTitle>Appearance</CardTitle>
        <Toggle
          checked={form.theme === 'light'}
          onChange={() => setForm(f => ({ ...f, theme: f.theme === 'light' ? 'dark' : 'light' }))}
          label={form.theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        />
        <p className="text-base text-white/30 mt-1">Dark mode recommended for gym use</p>
      </Card>

      {/* Bug report */}
      <Card>
        <CardTitle>Help</CardTitle>
        <a href="https://github.com/jbrad0216/fitness-tracker/issues/new?title=Bug+Report"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-base text-white/60 no-underline py-3 active:opacity-60">
          <span>🐛</span> Report a Bug on GitHub
        </a>
      </Card>

      {/* Workout Templates */}
      <Card>
        <CardTitle right={
          <button onClick={() => { workoutOps.resetTemplates(); notify('Templates reset'); }}
            className="text-base text-red-400/70 bg-transparent border-none cursor-pointer">
            Reset
          </button>
        }>
          Workout Templates
        </CardTitle>
        {templates && (
          <>
            <WorkoutEditor label="A" exercises={templates.A}
              onUpdate={(i, u) => workoutOps.updateExercise('A', i, u)}
              onRemove={(i) => workoutOps.removeExercise('A', i)}
              onMove={(i, d) => workoutOps.moveExercise('A', i, d)}
              onAdd={(ex) => workoutOps.addExercise('A', ex)} />
            <WorkoutEditor label="B" exercises={templates.B}
              onUpdate={(i, u) => workoutOps.updateExercise('B', i, u)}
              onRemove={(i) => workoutOps.removeExercise('B', i)}
              onMove={(i, d) => workoutOps.moveExercise('B', i, d)}
              onAdd={(ex) => workoutOps.addExercise('B', ex)} />
          </>
        )}
      </Card>
    </div>
  );
}
