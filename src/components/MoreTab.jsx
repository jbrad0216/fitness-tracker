import { useState } from 'react';
import { StatsTab } from './StatsTab';
import { SettingsTab } from './SettingsTab';
import { PlanExplanation } from './PlanExplanation';
import { ErrorBoundary } from './UI';
import { load } from '../data/storage';

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
  notify,
}) {
  const [subPage, setSubPage] = useState(null);

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
    { id: 'plan', label: 'My Plan', desc: 'Calorie, protein, and water targets with the math explained' },
    { id: 'progress', label: 'Progress', desc: 'Weight chart, streak tracker, personal records' },
    { id: 'history', label: 'Workout History', desc: 'Past workouts with exercises and weights used' },
    { id: 'settings', label: 'Settings', desc: 'Profile, targets, equipment, data export & import' },
    { id: 'about', label: 'About', desc: 'Version info and data sources' },
  ];

  return (
    <div className="px-5 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>
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
