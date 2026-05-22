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
      <h3 className="text-sm font-semibold text-blue-400 mb-2">Workout {label}</h3>
      {exercises.map((ex, i) => (
        <div key={i} className="mb-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          {editIndex === i ? (
            <div className="flex flex-col gap-2">
              <Input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Exercise name" />
              <div className="flex gap-1.5">
                <div className="flex-1"><Label>Wt (lbs)</Label><Input type="number" value={editForm.defaultWeight} onChange={e => setEditForm(f => ({ ...f, defaultWeight: e.target.value }))} step="2.5" /></div>
                <div className="w-14"><Label>Sets</Label><Input type="number" value={editForm.sets} onChange={e => setEditForm(f => ({ ...f, sets: e.target.value }))} /></div>
                <div className="w-14"><Label>Reps</Label><Input type="number" value={editForm.reps} onChange={e => setEditForm(f => ({ ...f, reps: e.target.value }))} /></div>
              </div>
              <div className="flex gap-1.5">
                <Button onClick={saveEdit} className="flex-1 text-xs py-2">Save</Button>
                <Button onClick={() => setEditIndex(null)} variant="ghost" className="text-xs py-2">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{ex.name}</div>
                <div className="text-[12px] text-white/40">{ex.defaultWeight}lbs · {ex.sets}×{ex.reps}</div>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button onClick={() => onMove(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg bg-white/[0.05] text-white/50 border-none cursor-pointer text-xs disabled:opacity-20">↑</button>
                <button onClick={() => onMove(i, 1)} disabled={i === exercises.length - 1} className="w-7 h-7 rounded-lg bg-white/[0.05] text-white/50 border-none cursor-pointer text-xs disabled:opacity-20">↓</button>
                <button onClick={() => startEdit(i)} className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 border-none cursor-pointer text-xs">✏️</button>
                <button onClick={() => onRemove(i)} className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 border-none cursor-pointer text-base">×</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
        <p className="text-[12px] text-white/30 mb-2 uppercase tracking-wider">Add Exercise</p>
        <div className="flex flex-col gap-1.5">
          <Input type="text" value={newEx.name} onChange={e => setNewEx(f => ({ ...f, name: e.target.value }))} placeholder="Exercise name" />
          <div className="flex gap-1.5">
            <Input type="number" value={newEx.defaultWeight} onChange={e => setNewEx(f => ({ ...f, defaultWeight: e.target.value }))} placeholder="Wt" step="2.5" className="flex-1" />
            <Input type="number" value={newEx.sets} onChange={e => setNewEx(f => ({ ...f, sets: e.target.value }))} placeholder="Sets" className="w-16" />
            <Input type="number" value={newEx.reps} onChange={e => setNewEx(f => ({ ...f, reps: e.target.value }))} placeholder="Reps" className="w-16" />
          </div>
          <Button onClick={handleAdd} variant="ghost" className="w-full text-xs py-2">+ Add</Button>
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
        <p className="text-[13px] text-white/30 mb-3">No scheduled meals yet. Add a recurring meal below.</p>
      )}
      {meals.map(m => (
        <div key={m.id} className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2.5 mb-2 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold truncate">{m.name}</div>
            <div className="text-[12px] text-white/40">
              {m.cal} cal · {m.protein}g · {m.meal} · {m.days.map(d => DAYS_OF_WEEK[d].slice(0,3)).join(', ')}
            </div>
          </div>
          <button onClick={() => save(meals.filter(x => x.id !== m.id))}
            className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 border-none cursor-pointer text-base">×</button>
        </div>
      ))}
      {adding ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 mt-2">
          <Input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Meal name (e.g. Overnight Oats)" className="mb-2" />
          <div className="flex gap-1.5 mb-2">
            <Input type="number" value={form.cal} onChange={e => setForm(f => ({ ...f, cal: e.target.value }))} placeholder="Cal" className="flex-1" />
            <Input type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} placeholder="Protein g" className="flex-1" />
          </div>
          <select
            value={form.meal}
            onChange={e => setForm(f => ({ ...f, meal: e.target.value }))}
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white outline-none mb-2"
          >
            {['breakfast','lunch','snack','dinner'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="text-[12px] text-white/40 mb-1">Which days?</div>
          <div className="flex gap-1 flex-wrap mb-2">
            {DAYS_OF_WEEK.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)}
                className={`px-2 py-1 rounded-lg text-[12px] font-semibold border cursor-pointer
                  ${form.days.includes(i) ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/[0.05] border-white/[0.08] text-white/50'}`}>
                {d.slice(0,3)}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Button onClick={handleAdd} className="flex-1 text-sm py-2">Save Meal</Button>
            <Button onClick={() => setAdding(false)} variant="ghost" className="text-sm py-2">Cancel</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full border border-dashed border-white/[0.1] rounded-xl py-3 text-[14px]
            text-white/40 cursor-pointer bg-transparent mt-1">
          + Add Scheduled Meal
        </button>
      )}
    </div>
  );
}

export function SettingsTab({ settings, updateSettings, resetSettings, templates, workoutOps, notify }) {
  const [form, setForm] = useState({ ...settings });
  const [showBackups, setShowBackups] = useState(false);
  const [backupDates, setBackupDates] = useState([]);
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem('ft_auto-backup') !== 'off');

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

  const handleSave = () => {
    updateSettings({
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
    });
    notify('Settings saved');
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
          <div><Label>Name</Label><Input type="text" {...f('name')} placeholder="Your name" /></div>
          <div className="flex gap-2">
            <div className="flex-1"><Label>Age</Label><Input type="number" {...f('age')} placeholder="48" /></div>
            <div className="flex-1"><Label>Height</Label><Input type="text" {...f('height')} placeholder="6'1&quot;" /></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><Label>Start Weight (lbs)</Label><Input type="number" {...f('startWeight')} step="0.1" /></div>
            <div className="flex-1"><Label>Goal Weight (lbs)</Label><Input type="number" {...f('goalWeight')} step="0.1" /></div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Daily Targets</CardTitle>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1"><Label>Calories</Label><Input type="number" {...f('calories')} placeholder="2400" /></div>
            <div className="flex-1"><Label>Protein (g)</Label><Input type="number" {...f('protein')} placeholder="160" /></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><Label>Water (32oz bottles)</Label><Input type="number" {...f('waterBottles')} min="1" max="6" /></div>
            <div className="flex-1"><Label>Sodium Max (mg)</Label><Input type="number" {...f('sodiumMg')} /></div>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 mb-4">
        <Button onClick={handleSave} className="flex-1">Save Settings</Button>
        <Button onClick={() => { resetSettings(); notify('Reset to defaults'); }} variant="danger" className="flex-1">Reset</Button>
      </div>

      <Card>
        <CardTitle>Scheduled Meals</CardTitle>
        <p className="text-[12px] text-white/40 mb-3">Meals that auto-appear on selected days for quick logging.</p>
        <ScheduledMealsEditor notify={notify} />
      </Card>

      {/* Data & Backup — simplified (Task 6) */}
      <Card>
        <CardTitle>Data & Backup</CardTitle>

        {(daysSinceExport === null || daysSinceExport >= 30) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mb-3">
            <p className="text-xs text-amber-400/80">
              {lastExport ? `⚠️ Last backup was ${daysSinceExport} days ago.` : '⚠️ No backup yet. Export soon!'}
            </p>
          </div>
        )}

        <Button onClick={handleExport} className="w-full mb-2">
          📤 Export Data (share / save file)
        </Button>

        <label className="w-full flex items-center justify-center rounded-xl py-3 text-sm
          text-white/60 bg-transparent border border-white/[0.08] cursor-pointer mb-2">
          📥 Import from File
          <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
        </label>

        <div className="flex items-center justify-between py-2 mb-2">
          <div>
            <div className="text-sm font-semibold">Auto-Backup</div>
            <div className="text-[12px] text-white/40">
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
          className="w-full text-sm text-white/50 bg-transparent border border-white/[0.08]
            rounded-xl py-2.5 cursor-pointer mb-2">
          {showBackups ? 'Hide' : '🕐 Restore from Backup'}
        </button>

        {showBackups && (
          <div className="mt-1">
            {backupDates.length === 0
              ? <p className="text-xs text-white/30 text-center py-2">No backups yet</p>
              : backupDates.map(date => (
                <div key={date} className="flex justify-between items-center py-2 border-b border-white/[0.06] last:border-0">
                  <span className="text-sm text-white/60">{date}</span>
                  <button onClick={() => handleRestore(date)}
                    className="text-xs px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400 border-none cursor-pointer">
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
        <p className="text-[13px] text-white/50 mb-3">
          PWAs can't access Health directly. Use Apple Shortcuts to sync data to this app.
        </p>

        {healthData && healthData.date === new Date().toISOString().split('T')[0] ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-3 mb-3">
            <div className="text-sm font-semibold text-green-400 mb-1">✓ Today's Health Data</div>
            {healthData.steps && <div className="text-sm text-white/70">Steps: {healthData.steps.toLocaleString()}</div>}
            {healthData.activeCal && <div className="text-sm text-white/70">Active Cal: {healthData.activeCal}</div>}
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-3 mb-3">
            <p className="text-[13px] text-white/40">No Health data today</p>
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3">
          <p className="text-[13px] text-blue-300 font-semibold mb-2">Setup via Apple Shortcuts:</p>
          <ol className="text-[12px] text-white/60 space-y-1 list-decimal list-inside">
            <li>Open the Shortcuts app on iPhone</li>
            <li>Create a new Shortcut</li>
            <li>Add "Get Health Samples" (Steps, Active Energy)</li>
            <li>Add "Open URLs" with: <span className="text-blue-400 break-all">https://your-app.vercel.app/?steps=[steps]&activeCal=[calories]</span></li>
            <li>Run the shortcut daily after your workout</li>
          </ol>
        </div>

        <p className="text-[12px] text-white/30">
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
        <p className="text-[12px] text-white/30 mt-1">Dark mode recommended for gym use</p>
      </Card>

      {/* Bug report */}
      <Card>
        <CardTitle>Help</CardTitle>
        <a href="https://github.com/jbrad0216/fitness-tracker/issues/new?title=Bug+Report"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-white/60 no-underline py-2 active:opacity-60">
          <span>🐛</span> Report a Bug on GitHub
        </a>
      </Card>

      {/* Workout Templates */}
      <Card>
        <CardTitle right={
          <button onClick={() => { workoutOps.resetTemplates(); notify('Templates reset'); }}
            className="text-[13px] text-red-400/70 bg-transparent border-none cursor-pointer">
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
