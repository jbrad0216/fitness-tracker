import { useState } from 'react';
import { Input, Button, Label } from './UI';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import { exportAllData, markExported } from '../data/storage';

const STEPS = [
  { id: 'welcome', title: 'Welcome to Fitness Tracker', subtitle: "Let's set up your profile in a few quick steps." },
  { id: 'goal', title: "What's your main goal?", subtitle: 'Pick the one that describes you best.' },
  { id: 'pace', title: 'How fast do you want to go?', subtitle: 'You can change this anytime.' },
  { id: 'profile', title: "What's your name?", subtitle: "We'll personalize your experience." },
  { id: 'weight', title: 'Your weight goals', subtitle: 'Set your starting and target weight.' },
  { id: 'targets', title: 'Daily nutrition targets', subtitle: 'These can be changed anytime in Settings.' },
  { id: 'workout', title: 'Your workout schedule', subtitle: 'Strength Mon/Wed/Fri · Cardio Tue/Thu · Long run Sat · Rest Sun' },
  { id: 'data', title: 'Your data', subtitle: '' },
];

const GOALS = [
  {
    id: 'fat-loss',
    icon: '🔥',
    label: 'Fat Loss',
    desc: 'I want to lose weight and burn fat',
    detail: 'Calorie deficit · High protein · Cardio + strength mix',
  },
  {
    id: 'muscle',
    icon: '💪',
    label: 'Build Muscle',
    desc: 'I want to get stronger and build muscle',
    detail: 'High protein · Heavy compound lifts · Progressive overload',
  },
  {
    id: 'heart-health',
    icon: '❤️',
    label: 'Heart Health',
    desc: 'I have high blood pressure or heart concerns',
    detail: 'Cardio emphasis · Sodium tracking · Moderate resistance',
  },
  {
    id: 'lifestyle',
    icon: '🌱',
    label: 'Lifestyle Change',
    desc: 'I want a sustainable, long-term healthy routine',
    detail: 'Balanced approach · Habit building · Slower pace',
  },
  {
    id: 'custom',
    icon: '✏️',
    label: 'Custom',
    desc: 'I want to describe my goal in my own words',
    detail: 'Tell us what you want to achieve',
  },
];

const PACES = [
  {
    id: 'aggressive',
    icon: '⚡',
    label: 'Aggressive',
    range: '4–6 weeks',
    desc: 'Larger deficit, more cardio. Faster results but harder to sustain.',
  },
  {
    id: 'moderate',
    icon: '🎯',
    label: 'Moderate',
    range: '8–12 weeks',
    desc: 'Balanced approach. Recommended for most people.',
    recommended: true,
  },
  {
    id: 'gradual',
    icon: '🌿',
    label: 'Gradual',
    range: '16–20 weeks',
    desc: 'Lifestyle-change pace. Very sustainable, builds lasting habits.',
  },
];

function parseHeightStr(h) {
  const m = String(h || '').match(/^(\d+)['\s"]*(\d+)/);
  if (m) return { feet: m[1], inches: m[2] };
  return { feet: '', inches: '' };
}
function buildHeightStr(feet, inches) {
  if (!feet && !inches) return '';
  return `${parseInt(feet) || 6}'${parseInt(inches) || 0}"`;
}

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
    goal: 'fat-loss',
    pace: 'moderate',
    goalCustomText: '',
  });

  const f = (field) => ({
    value: form[field],
    onChange: (e) => setForm(prev => ({ ...prev, [field]: e.target.value })),
  });

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
      goal: form.goal,
      pace: form.pace,
      goalCustomText: form.goalCustomText,
    });
  };

  const handleExportNow = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const file = new File([blob], `fitness-backup-${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: 'Fitness Tracker Backup' }).catch(() => {});
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    markExported();
    finish();
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const canAdvance = () => {
    if (current.id === 'goal' && form.goal === 'custom' && !form.goalCustomText.trim()) return false;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Progress */}
      <div className="w-full max-w-sm mb-8">
        <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`w-2 h-2 rounded-full transition-all duration-300
              ${i <= step ? 'bg-blue-500' : 'bg-white/[0.15]'}`} />
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">{current.title}</h1>
          {current.subtitle && <p className="text-[15px] text-white/50">{current.subtitle}</p>}
        </div>

        {current.id === 'welcome' && (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🏋️</div>
            <div className="bg-white/[0.04] rounded-2xl p-5 text-left space-y-3">
              {[
                { icon: '📊', title: 'Track nutrition daily', desc: 'Calories, protein, water' },
                { icon: '💪', title: 'Log your workouts', desc: 'Progressive overload tracking' },
                { icon: '📈', title: 'See your progress', desc: 'Weight trends and personal records' },
              ].map(item => (
                <div key={item.icon} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="text-[16px] font-semibold">{item.title}</div>
                    <div className="text-base text-white/40">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {current.id === 'goal' && (
          <div className="space-y-3">
            {GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => setForm(prev => ({ ...prev, goal: g.id }))}
                className={`w-full text-left rounded-2xl px-4 py-4 border-2 cursor-pointer
                  transition-all active:scale-[0.98]
                  ${form.goal === g.id
                    ? 'bg-blue-500/15 border-blue-500 text-white'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/80'}`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{g.icon}</span>
                  <span className="text-[17px] font-bold">{g.label}</span>
                  {form.goal === g.id && <span className="ml-auto text-blue-400 text-lg">✓</span>}
                </div>
                <div className="text-base text-white/60 pl-9">{g.desc}</div>
                {form.goal === g.id && (
                  <div className="mt-1.5 pl-9 text-base text-blue-400/80">{g.detail}</div>
                )}
              </button>
            ))}
            {form.goal === 'custom' && (
              <div className="mt-2">
                <Label>Describe your goal</Label>
                <textarea
                  value={form.goalCustomText}
                  onChange={e => setForm(prev => ({ ...prev, goalCustomText: e.target.value }))}
                  placeholder="e.g. I want to run a 5K and feel less tired at work..."
                  className="w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-3
                    text-[16px] text-white outline-none resize-none placeholder:text-white/30"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        {current.id === 'pace' && (
          <div className="space-y-3">
            {PACES.map(p => (
              <button
                key={p.id}
                onClick={() => setForm(prev => ({ ...prev, pace: p.id }))}
                className={`w-full text-left rounded-2xl px-4 py-4 border-2 cursor-pointer
                  transition-all active:scale-[0.98]
                  ${form.pace === p.id
                    ? 'bg-blue-500/15 border-blue-500 text-white'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/80'}`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <span className="text-[17px] font-bold">{p.label}</span>
                    <span className="ml-2 text-base text-white/40">{p.range}</span>
                    {p.recommended && (
                      <span className="ml-2 text-base bg-green-500/20 text-green-400
                        rounded-full px-2 py-0.5 font-semibold">Recommended</span>
                    )}
                  </div>
                  {form.pace === p.id && <span className="text-blue-400 text-lg">✓</span>}
                </div>
                <div className="text-base text-white/50 pl-9">{p.desc}</div>
              </button>
            ))}
          </div>
        )}

        {current.id === 'profile' && (
          <div className="space-y-4">
            <div><Label>Your name</Label><Input {...f('name')} type="text" inputMode="text" autoComplete="off" placeholder="e.g. Jason" className="text-lg py-3" /></div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Age</Label>
                <Input {...f('age')} type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" placeholder="48" />
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
          </div>
        )}

        {current.id === 'weight' && (
          <div className="space-y-4">
            <div>
              <Label>Current weight (lbs)</Label>
              <Input {...f('startWeight')} type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done" placeholder="e.g. 221" className="text-lg py-3" />
              <p className="text-base text-white/30 mt-1">This becomes your starting weight baseline</p>
            </div>
            <div>
              <Label>Goal weight (lbs)</Label>
              <Input {...f('goalWeight')} type="text" inputMode="decimal" autoComplete="off" enterKeyHint="done" placeholder="e.g. 200" />
              {form.startWeight && form.goalWeight && (
                <p className="text-base text-green-400/70 mt-1">
                  Goal: lose {(parseFloat(form.startWeight) - parseFloat(form.goalWeight)).toFixed(1)} lbs
                </p>
              )}
            </div>
          </div>
        )}

        {current.id === 'targets' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1"><Label>Daily calories</Label><Input {...f('calories')} type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" placeholder="2400" /></div>
              <div className="flex-1"><Label>Protein (g)</Label><Input {...f('protein')} type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" placeholder="160" /></div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Water bottles</Label>
                <Input {...f('waterBottles')} type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" placeholder="3" />
                <p className="text-base text-white/30 mt-0.5">32oz each</p>
              </div>
              <div className="flex-1"><Label>Sodium limit (mg)</Label><Input {...f('sodiumMg')} type="text" inputMode="numeric" autoComplete="off" enterKeyHint="done" placeholder="2000" /></div>
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
                <div key={day} className="flex justify-between text-base">
                  <span className="text-white/60">{day}</span>
                  <span className={`font-semibold ${color}`}>{type}</span>
                </div>
              ))}
            </div>
            <p className="text-base text-white/30 text-center">Workout A/B alternates weekly. Customize in Settings.</p>
          </div>
        )}

        {current.id === 'data' && (
          <div className="space-y-4">
            <div className="text-center text-5xl mb-2">📱</div>
            <div className="bg-white/[0.04] rounded-2xl p-5">
              <p className="text-base text-white/80 text-center leading-relaxed">
                Your fitness data is stored on this device.
              </p>
              <p className="text-base text-white/50 text-center mt-2">
                To keep a backup, export your data anytime from the Settings menu (More → Settings).
              </p>
            </div>
            <button
              onClick={handleExportNow}
              className="w-full bg-white/[0.08] border border-white/[0.1] text-white/70 rounded-2xl py-4 text-base
                cursor-pointer active:opacity-70"
            >
              📤 Export Now (optional)
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button onClick={() => setStep(s => s - 1)} variant="ghost" className="flex-1">Back</Button>
          )}
          {!isLast && (
            <Button
              onClick={() => canAdvance() && setStep(s => s + 1)}
              className={`${step === 0 ? 'w-full' : 'flex-1'} ${!canAdvance() ? 'opacity-40' : ''}`}
            >
              Next
            </Button>
          )}
          {isLast && (
            <Button onClick={finish} className="flex-1">
              {"Let's Go! 🚀"}
            </Button>
          )}
        </div>

        {step > 0 && (
          <button onClick={finish}
            className="w-full mt-3 text-base text-white/25 bg-transparent border-none cursor-pointer py-2">
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
