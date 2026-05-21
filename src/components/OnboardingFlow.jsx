import { useState } from 'react';
import { Input, Button, Label } from './UI';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Fitness Tracker',
    subtitle: "Let's set up your personal profile in a few quick steps.",
  },
  {
    id: 'profile',
    title: "What's your name?",
    subtitle: 'We\'ll personalize your experience.',
  },
  {
    id: 'weight',
    title: 'Your weight goals',
    subtitle: 'Set your starting and target weight.',
  },
  {
    id: 'targets',
    title: 'Daily nutrition targets',
    subtitle: 'These can be changed anytime in Settings.',
  },
  {
    id: 'workout',
    title: 'Workout schedule',
    subtitle: 'Strength Mon/Wed/Fri · Cardio Tue/Thu · Long run Sat · Rest Sun',
  },
  {
    id: 'storage',
    title: 'Where should your data be saved?',
    subtitle: 'All data stays on your device. Choose how to back it up.',
  },
];

const CLOUD_OPTIONS = [
  {
    id: 'device',
    icon: '📱',
    label: 'Device Only',
    desc: 'Data stays in your browser\'s local storage. Clearing browser data will delete it.',
  },
  {
    id: 'icloud',
    icon: '☁️',
    label: 'iCloud Drive',
    desc: 'Export weekly and save the file to your iCloud Drive via the Files app.',
  },
  {
    id: 'gdrive',
    icon: '🟢',
    label: 'Google Drive',
    desc: 'Export weekly and save the file to Google Drive via the app or Files.',
  },
  {
    id: 'onedrive',
    icon: '🔵',
    label: 'OneDrive',
    desc: 'Export weekly and save the file to your Microsoft OneDrive.',
  },
];

export function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    age: '',
    height: '',
    startWeight: '',
    goalWeight: '',
    calories: String(DEFAULT_SETTINGS.calories),
    protein: String(DEFAULT_SETTINGS.protein),
    waterBottles: String(DEFAULT_SETTINGS.waterBottles),
    sodiumMg: String(DEFAULT_SETTINGS.sodiumMg),
    cloudStorage: 'device',
  });

  const f = (field) => ({
    value: form[field],
    onChange: (e) => setForm(prev => ({ ...prev, [field]: e.target.value })),
  });

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    onComplete({
      name: form.name || DEFAULT_SETTINGS.name,
      age: parseInt(form.age) || DEFAULT_SETTINGS.age,
      height: form.height || DEFAULT_SETTINGS.height,
      startWeight: parseFloat(form.startWeight) || DEFAULT_SETTINGS.startWeight,
      goalWeight: parseFloat(form.goalWeight) || DEFAULT_SETTINGS.goalWeight,
      calories: parseInt(form.calories) || DEFAULT_SETTINGS.calories,
      protein: parseInt(form.protein) || DEFAULT_SETTINGS.protein,
      waterBottles: parseInt(form.waterBottles) || DEFAULT_SETTINGS.waterBottles,
      sodiumMg: parseInt(form.sodiumMg) || DEFAULT_SETTINGS.sodiumMg,
      cloudStorage: form.cloudStorage || 'device',
    });
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Progress bar */}
      <div className="w-full max-w-sm mb-8">
        <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full transition-all duration-300
                ${i <= step ? 'bg-blue-500' : 'bg-white/[0.15]'}`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">{current.title}</h1>
          <p className="text-sm text-white/50">{current.subtitle}</p>
        </div>

        {/* Step content */}
        {current.id === 'welcome' && (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🏋️</div>
            <div className="bg-white/[0.04] rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">📊</span>
                <div>
                  <div className="text-sm font-semibold">Track nutrition daily</div>
                  <div className="text-xs text-white/40">Calories, protein, water</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">💪</span>
                <div>
                  <div className="text-sm font-semibold">Log your workouts</div>
                  <div className="text-xs text-white/40">Progressive overload tracking</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">📈</span>
                <div>
                  <div className="text-sm font-semibold">See your progress</div>
                  <div className="text-xs text-white/40">Weight trends and personal records</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {current.id === 'profile' && (
          <div className="space-y-4">
            <div>
              <Label>Your name</Label>
              <Input {...f('name')} type="text" placeholder="e.g. Jason" className="text-lg py-3" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Age</Label>
                <Input {...f('age')} type="number" placeholder="48" />
              </div>
              <div className="flex-1">
                <Label>Height</Label>
                <Input {...f('height')} type="text" placeholder="6'1&quot;" />
              </div>
            </div>
          </div>
        )}

        {current.id === 'weight' && (
          <div className="space-y-4">
            <div>
              <Label>Current weight (lbs)</Label>
              <Input {...f('startWeight')} type="number" step="0.1" placeholder="e.g. 221" className="text-lg py-3" />
              <p className="text-xs text-white/30 mt-1">This becomes your starting weight baseline</p>
            </div>
            <div>
              <Label>Goal weight (lbs)</Label>
              <Input {...f('goalWeight')} type="number" step="0.1" placeholder="e.g. 200" />
              {form.startWeight && form.goalWeight && (
                <p className="text-xs text-green-400/70 mt-1">
                  Goal: lose {(parseFloat(form.startWeight) - parseFloat(form.goalWeight)).toFixed(1)} lbs
                </p>
              )}
            </div>
          </div>
        )}

        {current.id === 'targets' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Daily calories</Label>
                <Input {...f('calories')} type="number" placeholder="2400" />
              </div>
              <div className="flex-1">
                <Label>Protein (g)</Label>
                <Input {...f('protein')} type="number" placeholder="160" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Water bottles</Label>
                <Input {...f('waterBottles')} type="number" min="1" max="6" placeholder="3" />
                <p className="text-[10px] text-white/30 mt-0.5">32oz each</p>
              </div>
              <div className="flex-1">
                <Label>Sodium limit (mg)</Label>
                <Input {...f('sodiumMg')} type="number" placeholder="2000" />
              </div>
            </div>
          </div>
        )}

        {current.id === 'workout' && (
          <div className="space-y-3">
            <div className="bg-white/[0.04] rounded-2xl p-4 space-y-2">
              {[
                { day: 'Monday', type: 'Strength A', color: 'text-blue-400' },
                { day: 'Tuesday', type: 'Cardio', color: 'text-amber-400' },
                { day: 'Wednesday', type: 'Strength B', color: 'text-blue-400' },
                { day: 'Thursday', type: 'Cardio', color: 'text-amber-400' },
                { day: 'Friday', type: 'Strength A', color: 'text-blue-400' },
                { day: 'Saturday', type: 'Long Run', color: 'text-green-400' },
                { day: 'Sunday', type: 'Rest', color: 'text-purple-400' },
              ].map(({ day, type, color }) => (
                <div key={day} className="flex justify-between text-sm">
                  <span className="text-white/60">{day}</span>
                  <span className={`font-semibold ${color}`}>{type}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 text-center">
              Workout A/B alternates weekly. Customize exercises in Settings.
            </p>
          </div>
        )}

        {current.id === 'storage' && (
          <div className="space-y-3">
            {CLOUD_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setForm(prev => ({ ...prev, cloudStorage: opt.id }))}
                className={`w-full text-left rounded-2xl p-4 border cursor-pointer transition-all
                  ${form.cloudStorage === opt.id
                    ? 'bg-blue-500/20 border-blue-500/60'
                    : 'bg-white/[0.04] border-white/[0.08]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{opt.desc}</div>
                  </div>
                  {form.cloudStorage === opt.id && (
                    <span className="text-blue-400 text-lg">✓</span>
                  )}
                </div>
              </button>
            ))}
            {form.cloudStorage !== 'device' && (
              <p className="text-xs text-blue-400/70 text-center px-2 pt-1">
                We'll remind you weekly to export and save to {CLOUD_OPTIONS.find(o => o.id === form.cloudStorage)?.label}.
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button
              onClick={() => setStep(s => s - 1)}
              variant="ghost"
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            onClick={next}
            className={step === 0 ? 'w-full' : 'flex-1'}
          >
            {isLast ? "Let's Go!" : 'Next'}
          </Button>
        </div>

        {step > 0 && (
          <button
            onClick={finish}
            className="w-full mt-3 text-xs text-white/25 bg-transparent border-none cursor-pointer py-2"
          >
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
