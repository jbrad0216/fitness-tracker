import { useState, useEffect, useMemo } from 'react';
import { Card, CardTitle, Input, Button, Label } from './UI';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import { exportAllData, markExported, getLastExportDate, getBackupDates, restoreBackup } from '../data/storage';

function WorkoutEditor({ label, exercises, onUpdate, onRemove, onMove, onAdd }) {
  const [newEx, setNewEx] = useState({ name: '', sets: '3', reps: '12', defaultWeight: '' });
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleAdd = () => {
    if (!newEx.name) return;
    onAdd({
      name: newEx.name,
      sets: parseInt(newEx.sets) || 3,
      reps: parseInt(newEx.reps) || 12,
      defaultWeight: parseFloat(newEx.defaultWeight) || 0,
    });
    setNewEx({ name: '', sets: '3', reps: '12', defaultWeight: '' });
  };

  const startEdit = (i) => {
    setEditIndex(i);
    setEditForm({ ...exercises[i] });
  };

  const saveEdit = () => {
    onUpdate(editIndex, {
      name: editForm.name,
      sets: parseInt(editForm.sets) || 3,
      reps: parseInt(editForm.reps) || 12,
      defaultWeight: parseFloat(editForm.defaultWeight) || 0,
    });
    setEditIndex(null);
  };

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-blue-400 mb-2">Workout {label}</h3>

      {exercises.map((ex, i) => (
        <div key={i} className="mb-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          {editIndex === i ? (
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Exercise name"
              />
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <Label>Wt (lbs)</Label>
                  <Input type="number" value={editForm.defaultWeight}
                    onChange={e => setEditForm(f => ({ ...f, defaultWeight: e.target.value }))}
                    step="2.5" />
                </div>
                <div className="w-14">
                  <Label>Sets</Label>
                  <Input type="number" value={editForm.sets}
                    onChange={e => setEditForm(f => ({ ...f, sets: e.target.value }))} />
                </div>
                <div className="w-14">
                  <Label>Reps</Label>
                  <Input type="number" value={editForm.reps}
                    onChange={e => setEditForm(f => ({ ...f, reps: e.target.value }))} />
                </div>
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
                <div className="text-[11px] text-white/40">
                  {ex.defaultWeight}lbs · {ex.sets}×{ex.reps}
                </div>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <button onClick={() => onMove(i, -1)} disabled={i === 0}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] text-white/50 border-none cursor-pointer
                    text-xs disabled:opacity-20 active:bg-white/[0.1]">↑</button>
                <button onClick={() => onMove(i, 1)} disabled={i === exercises.length - 1}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] text-white/50 border-none cursor-pointer
                    text-xs disabled:opacity-20 active:bg-white/[0.1]">↓</button>
                <button onClick={() => startEdit(i)}
                  className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 border-none cursor-pointer text-xs">✏️</button>
                <button onClick={() => onRemove(i)}
                  className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 border-none cursor-pointer text-base">×</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
        <p className="text-[11px] text-white/30 mb-2 uppercase tracking-wider">Add Exercise</p>
        <div className="flex flex-col gap-1.5">
          <Input type="text" value={newEx.name}
            onChange={e => setNewEx(f => ({ ...f, name: e.target.value }))}
            placeholder="Exercise name" />
          <div className="flex gap-1.5">
            <Input type="number" value={newEx.defaultWeight}
              onChange={e => setNewEx(f => ({ ...f, defaultWeight: e.target.value }))}
              placeholder="Wt" step="2.5" className="flex-1" />
            <Input type="number" value={newEx.sets}
              onChange={e => setNewEx(f => ({ ...f, sets: e.target.value }))}
              placeholder="Sets" className="w-16" />
            <Input type="number" value={newEx.reps}
              onChange={e => setNewEx(f => ({ ...f, reps: e.target.value }))}
              placeholder="Reps" className="w-16" />
          </div>
          <Button onClick={handleAdd} variant="ghost" className="w-full text-xs py-2">+ Add</Button>
        </div>
      </div>
    </div>
  );
}

export function SettingsTab({ settings, updateSettings, resetSettings, templates, workoutOps, notify }) {
  const [form, setForm] = useState({ ...settings });
  const [showBackups, setShowBackups] = useState(false);
  const [backupDates, setBackupDates] = useState([]);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const lastExport = useMemo(() => getLastExportDate(), []);
  const daysSinceExport = lastExport
    ? Math.floor((new Date() - new Date(lastExport)) / 86400000)
    : null;
  const exportWarning = daysSinceExport === null || daysSinceExport >= 7;

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    markExported();
    notify('Data exported');
  };

  const handleShowBackups = () => {
    setBackupDates(getBackupDates());
    setShowBackups(b => !b);
  };

  const handleRestore = (date) => {
    if (!window.confirm(`Restore data from ${date}? Current data will be overwritten.`)) return;
    const ok = restoreBackup(date);
    if (ok) {
      notify('Restored — refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      notify('Restore failed');
    }
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
    });
    notify('Settings saved');
  };

  const handleReset = () => {
    resetSettings();
    notify('Reset to defaults');
  };

  const handleResetTemplates = () => {
    workoutOps.resetTemplates();
    notify('Workout templates reset');
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => setForm(prev => ({ ...prev, [field]: e.target.value })),
  });

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Data Warning */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 mb-3">
        <p className="text-xs text-amber-400/90 leading-relaxed">
          ⚠️ Your data is stored locally on this device only. Use Export Data below to save a backup file.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardTitle>Profile</CardTitle>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Name</Label>
            <Input type="text" {...f('name')} placeholder="Your name" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Age</Label>
              <Input type="number" {...f('age')} placeholder="48" />
            </div>
            <div className="flex-1">
              <Label>Height</Label>
              <Input type="text" {...f('height')} placeholder="6'1&quot;" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Start Weight (lbs)</Label>
              <Input type="number" {...f('startWeight')} step="0.1" placeholder="221" />
            </div>
            <div className="flex-1">
              <Label>Goal Weight (lbs)</Label>
              <Input type="number" {...f('goalWeight')} step="0.1" placeholder="200" />
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Targets */}
      <Card>
        <CardTitle>Daily Targets</CardTitle>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Calories</Label>
              <Input type="number" {...f('calories')} placeholder="2400" />
            </div>
            <div className="flex-1">
              <Label>Protein (g)</Label>
              <Input type="number" {...f('protein')} placeholder="160" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Water (32oz bottles)</Label>
              <Input type="number" {...f('waterBottles')} min="1" max="6" placeholder="3" />
            </div>
            <div className="flex-1">
              <Label>Sodium Max (mg)</Label>
              <Input type="number" {...f('sodiumMg')} placeholder="2000" />
            </div>
          </div>
        </div>
      </Card>

      {/* Save / Reset settings */}
      <div className="flex gap-2 mb-4">
        <Button onClick={handleSave} className="flex-1">Save Settings</Button>
        <Button onClick={handleReset} variant="danger" className="flex-1">Reset Defaults</Button>
      </div>

      {/* Backup & Export */}
      <Card>
        <CardTitle>Data & Backup</CardTitle>

        {exportWarning && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mb-3">
            <p className="text-xs text-amber-400/80">
              {lastExport
                ? `⚠️ Last export was ${daysSinceExport} days ago. Export soon.`
                : '⚠️ You haven\'t exported your data yet.'}
            </p>
          </div>
        )}

        <Button onClick={handleExport} className="w-full mb-2">
          📥 Export All Data (JSON)
        </Button>

        <button
          onClick={handleShowBackups}
          className="w-full text-sm text-white/50 bg-transparent border border-white/[0.08]
            rounded-xl py-2.5 cursor-pointer mb-2"
        >
          {showBackups ? 'Hide' : '🕐 Restore from Backup'}
        </button>

        {showBackups && (
          <div className="mt-1">
            {backupDates.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-2">No backups yet</p>
            ) : (
              backupDates.map(date => (
                <div key={date} className="flex justify-between items-center py-2
                  border-b border-white/[0.06] last:border-0">
                  <span className="text-sm text-white/60">{date}</span>
                  <button
                    onClick={() => handleRestore(date)}
                    className="text-xs px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400
                      border-none cursor-pointer"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Workout Templates */}
      <Card>
        <CardTitle right={
          <button onClick={handleResetTemplates}
            className="text-[11px] text-red-400/70 bg-transparent border-none cursor-pointer">
            Reset Templates
          </button>
        }>
          Workout Templates
        </CardTitle>

        {templates && (
          <>
            <WorkoutEditor
              label="A"
              exercises={templates.A}
              onUpdate={(i, u) => workoutOps.updateExercise('A', i, u)}
              onRemove={(i) => workoutOps.removeExercise('A', i)}
              onMove={(i, d) => workoutOps.moveExercise('A', i, d)}
              onAdd={(ex) => workoutOps.addExercise('A', ex)}
            />
            <WorkoutEditor
              label="B"
              exercises={templates.B}
              onUpdate={(i, u) => workoutOps.updateExercise('B', i, u)}
              onRemove={(i) => workoutOps.removeExercise('B', i)}
              onMove={(i, d) => workoutOps.moveExercise('B', i, d)}
              onAdd={(ex) => workoutOps.addExercise('B', ex)}
            />
          </>
        )}
      </Card>
    </div>
  );
}
