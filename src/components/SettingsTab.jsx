import { useState, useEffect } from 'react';
import { Card, CardTitle, Input, Button, Label } from './UI';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';

export function SettingsTab({ settings, updateSettings, resetSettings, notify }) {
  const [form, setForm] = useState({ ...settings });

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

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

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => setForm(prev => ({ ...prev, [field]: e.target.value })),
  });

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Data Warning */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 mb-3">
        <p className="text-xs text-amber-400/90 leading-relaxed">
          ⚠️ Your data is stored locally on this device only. Use Export in Stats to save a backup.
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

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        <Button onClick={handleSave} className="flex-1">Save Settings</Button>
        <Button onClick={handleReset} variant="danger" className="flex-1">Reset Defaults</Button>
      </div>
    </div>
  );
}
