import { useState, useRef } from 'react';
import { StatsTab } from './StatsTab';
import { SettingsTab } from './SettingsTab';
import { PlanExplanation } from './PlanExplanation';
import { ErrorBoundary } from './UI';
import { load, save } from '../data/storage';

// ─── Machine Management for More → My Equipment ───
const MACHINE_MUSCLES = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body'];

function compressPhoto(file, callback) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(200 / img.width, 200 / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function MachineForm({ existing, onSave, onClose }) {
  const [name, setName] = useState(existing?.name || '');
  const [muscles, setMuscles] = useState(existing?.muscleGroups || []);
  const [startWeight, setStartWeight] = useState(String(existing?.startingWeight || ''));
  const [photo, setPhoto] = useState(existing?.photo || null);
  const fileRef = useRef(null);

  const toggleMuscle = (m) =>
    setMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressPhoto(file, setPhoto);
  };

  const inputCls = "w-full bg-white/[0.08] border border-white/[0.1] rounded-xl px-4 h-14 text-lg text-white outline-none focus:border-blue-500/60 placeholder:text-white/25";

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] overflow-y-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
      <div className="flex items-center gap-3 px-4 mb-6">
        <button onClick={onClose}
          className="w-12 h-12 rounded-xl bg-white/[0.08] text-white text-2xl border-none cursor-pointer flex items-center justify-center">
          ‹
        </button>
        <h1 className="text-2xl font-bold">{existing ? 'EDIT MACHINE' : 'ADD MACHINE'}</h1>
      </div>
      <div className="px-4 space-y-4">
        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Machine Name</div>
          <input type="text" inputMode="text" autoComplete="off"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Chest Press Machine" className={inputCls} />
        </div>
        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Muscle Group(s)</div>
          <div className="flex flex-wrap gap-2">
            {MACHINE_MUSCLES.map(m => (
              <button key={m} onClick={() => toggleMuscle(m)}
                className={`h-12 px-4 rounded-xl text-base font-semibold border-none cursor-pointer
                  ${muscles.includes(m) ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-white/50'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Starting Weight (lbs)</div>
          <input type="text" inputMode="numeric" autoComplete="off"
            value={startWeight} onChange={e => setStartWeight(e.target.value)}
            placeholder="e.g. 90" className={inputCls} />
        </div>
        <div>
          <div className="text-base font-semibold text-white/60 mb-2">Machine Photo (optional)</div>
          {photo ? (
            <div className="relative inline-block">
              <img src={photo} alt="Machine" className="w-24 h-24 rounded-xl object-cover" />
              <button onClick={() => setPhoto(null)}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white text-sm border-none cursor-pointer">×</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full bg-white/[0.06] border border-white/[0.1] border-solid text-white/60 rounded-xl h-14 text-base font-semibold cursor-pointer active:opacity-70">
              📸 Take Photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        </div>
        <button onClick={() => {
          if (!name.trim()) return;
          onSave({
            id: existing?.id || `machine-${Date.now()}`,
            name: name.trim(),
            muscleGroups: muscles.length > 0 ? muscles : ['Full Body'],
            startingWeight: parseFloat(startWeight) || 0,
            photo,
            lastWeight: existing?.lastWeight || (parseFloat(startWeight) || 0),
          });
        }} disabled={!name.trim()}
          className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80 disabled:opacity-40">
          {existing ? 'SAVE CHANGES' : 'ADD MACHINE'}
        </button>
        <button onClick={onClose}
          className="w-full bg-transparent text-white/40 h-12 text-base border-none cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EquipmentPage() {
  const [machines, setMachines] = useState(() => load('machines', []));
  const [editingMachine, setEditingMachine] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const saveMachines = (next) => {
    save('machines', next);
    setMachines(next);
  };

  const handleSave = (machine) => {
    const idx = machines.findIndex(m => m.id === machine.id);
    const next = idx >= 0
      ? machines.map(m => m.id === machine.id ? machine : m)
      : [...machines, machine];
    saveMachines(next);
    setShowAddForm(false);
    setEditingMachine(null);
  };

  const handleDelete = (id) => saveMachines(machines.filter(m => m.id !== id));

  if (showAddForm || editingMachine) {
    return <MachineForm existing={editingMachine} onSave={handleSave} onClose={() => { setShowAddForm(false); setEditingMachine(null); }} />;
  }

  return (
    <div className="px-5 py-3 pb-28">
      <button onClick={() => setShowAddForm(true)}
        className="w-full bg-blue-500 text-white rounded-2xl h-14 text-lg font-bold border-none cursor-pointer active:opacity-80 mb-4">
        + Add Machine
      </button>
      {machines.length === 0 ? (
        <div className="text-center py-10 text-white/30">
          <div className="text-4xl mb-3">🏋️</div>
          <div className="text-lg">No machines yet.</div>
          <div className="text-base mt-1">Add weight machines you have access to.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {machines.map(m => (
            <div key={m.id} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 flex items-center gap-3">
              {m.photo && <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold truncate">{m.name}</div>
                <div className="text-base text-white/40">{m.muscleGroups?.join(', ')}</div>
                {m.lastWeight > 0 && <div className="text-base text-white/30">Last: {m.lastWeight} lbs</div>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditingMachine(m)}
                  className="w-10 h-10 rounded-lg bg-white/[0.06] text-white/50 text-base border-none cursor-pointer">✎</button>
                <button onClick={() => handleDelete(m.id)}
                  className="w-10 h-10 rounded-lg bg-red-500/15 text-red-400 text-base border-none cursor-pointer">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BackButton({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-blue-400 px-5 pt-4 pb-2 bg-transparent border-none
        cursor-pointer text-base font-semibold active:opacity-60"
    >
      <span className="text-2xl leading-none">‹</span>
      <span>More</span>
    </button>
  );
}

// ─── Workout History Page ───
function WorkoutHistoryPage() {
  function getWorkoutHistory(days = 60) {
    const history = [];
    const d = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() - i);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      try {
        const raw = localStorage.getItem(`ft_daily-${dateStr}`);
        if (raw) {
          const dayData = JSON.parse(raw);
          if (dayData.exercises && dayData.exercises.length > 0) {
            const volume = dayData.exercises.reduce((s, e) => s + (e.weight || 0) * (e.sets || 3) * (e.reps || 12), 0);
            history.push({
              dateStr,
              displayDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
              exercises: dayData.exercises,
              volume,
            });
          } else if (dayData.ranMiles && dayData.ranMiles > 0) {
            history.push({
              dateStr,
              displayDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
              exercises: [],
              ranMiles: dayData.ranMiles,
              volume: 0,
            });
          }
        }
      } catch {}
    }
    return history;
  }

  const history = getWorkoutHistory();

  if (history.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-white/30">
        <div className="text-4xl mb-3">🏋️</div>
        <div className="text-lg">No workouts logged yet.</div>
        <div className="text-base mt-1">Start a workout in the Gym tab.</div>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 pb-8">
      <div className="text-base text-white/40 mb-4">{history.length} workout days in the last 60 days</div>
      {history.map((day) => (
        <div key={day.dateStr}
          className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-4 mb-3">
          <div className="flex justify-between items-start mb-2">
            <div className="text-base font-bold">{day.displayDate}</div>
            {day.volume > 0 && (
              <div className="text-base text-white/40">{day.volume.toLocaleString()} lbs vol</div>
            )}
          </div>
          {day.ranMiles > 0 && !day.exercises?.length && (
            <div className="text-base text-green-300">🏃 {day.ranMiles} miles</div>
          )}
          {day.exercises?.map((ex, i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <span className="text-base text-white/70">{ex.name}</span>
              <span className="text-base text-white/50">
                {ex.weight ? `${ex.weight} lbs × ` : ''}{ex.sets || 3}×{ex.reps || 12}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── About Page ───
function AboutPage() {
  const version = '10.0';
  return (
    <div className="px-5 py-6">
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-6 py-6 mb-4">
        <div className="text-2xl font-bold mb-1">FitTrack</div>
        <div className="text-base text-white/50 mb-4">Version {version}</div>
        <div className="text-base text-white/70 leading-relaxed space-y-3">
          <p>A personal fitness tracking app built for Jason — a 48-year-old runner and lifter working toward 200 lbs.</p>
          <p>No cloud, no subscriptions, no AI chat. Just simple, direct tracking that works every time.</p>
          <p>Built with React, Vite, and Tailwind CSS. Data stays on your device in localStorage.</p>
        </div>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-6 py-4">
        <div className="text-base font-bold text-white/50 mb-3 uppercase tracking-wide">Data Sources</div>
        <div className="space-y-2 text-base text-white/60">
          <div>• USDA FoodData Central — food nutrition data</div>
          <div>• Open Food Facts — packaged food database</div>
          <div>• Mifflin-St Jeor equation — calorie calculations</div>
          <div>• PubMed research — all recommendations cited</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main MoreTab ───
export function MoreTab({
  weighIns, addWeighIn, removeWeighIn, latest, liftLog,
  startWeight, goalWeight,
  settings, updateSettings, resetSettings,
  templates, workoutOps,
  notify, onNavigate,
}) {
  const [subPage, setSubPage] = useState(null);

  if (subPage === 'progress') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} />
        <h2 className="text-2xl font-bold px-5 mb-2">Progress</h2>
        <ErrorBoundary>
          <StatsTab
            weighIns={weighIns}
            addWeighIn={addWeighIn}
            removeWeighIn={removeWeighIn}
            latest={latest}
            liftLog={liftLog}
            startWeight={startWeight}
            goalWeight={goalWeight}
            notify={notify}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (subPage === 'plan') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} />
        <h2 className="text-2xl font-bold px-5 mb-4">My Plan</h2>
        <ErrorBoundary>
          <PlanExplanation
            settings={settings}
            updateSettings={updateSettings}
            notify={notify}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (subPage === 'history') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} />
        <h2 className="text-2xl font-bold px-5 mb-2">Workout History</h2>
        <ErrorBoundary>
          <WorkoutHistoryPage />
        </ErrorBoundary>
      </div>
    );
  }

  if (subPage === 'equipment') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} />
        <h2 className="text-2xl font-bold px-5 mb-4">My Equipment</h2>
        <ErrorBoundary>
          <EquipmentPage />
        </ErrorBoundary>
      </div>
    );
  }

  if (subPage === 'settings') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} />
        <ErrorBoundary>
          <SettingsTab
            settings={settings}
            updateSettings={updateSettings}
            resetSettings={resetSettings}
            templates={templates}
            workoutOps={workoutOps}
            notify={notify}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (subPage === 'about') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} />
        <h2 className="text-2xl font-bold px-5 mb-4">About</h2>
        <AboutPage />
      </div>
    );
  }

  const items = [
    { id: 'progress', label: 'Progress', desc: 'Weight chart, streak tracker, week comparison' },
    { id: 'plan', label: 'My Plan', desc: 'Calorie, protein, and water targets with the math explained' },
    { id: 'history', label: 'Workout History', desc: 'Past workouts with exercises and weights used' },
    { id: 'equipment', label: 'My Equipment', desc: 'Manage your weight machines and gym gear' },
    { id: 'settings', label: 'Settings', desc: 'Profile, targets, data export & import' },
    { id: 'about', label: 'About', desc: 'Version info and data sources' },
  ];

  return (
    <div className="px-5 pb-28" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>
      <h2 className="text-2xl font-bold mb-5">More</h2>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setSubPage(item.id)}
          className="w-full flex items-center gap-4 bg-white/[0.05] border border-white/[0.08]
            rounded-2xl px-5 mb-3 cursor-pointer active:bg-white/[0.08] text-left h-20"
        >
          <div className="flex-1">
            <div className="text-lg font-bold">{item.label}</div>
            <div className="text-base text-white/50 mt-0.5">{item.desc}</div>
          </div>
          <span className="text-white/30 text-2xl font-light shrink-0">›</span>
        </button>
      ))}
    </div>
  );
}
