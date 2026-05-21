import { useState } from 'react';
import { StatsTab } from './StatsTab';
import { JourneyTab } from './JourneyTab';
import { SettingsTab } from './SettingsTab';
import { ErrorBoundary } from './UI';

function BackButton({ onBack, label }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1 text-blue-400 px-5 pt-4 pb-2 bg-transparent border-none
        cursor-pointer text-base font-semibold active:opacity-60"
    >
      <span className="text-xl leading-none">‹</span>
      <span>{label || 'More'}</span>
    </button>
  );
}

export function MoreTab({
  weighIns, addWeighIn, latest, liftLog,
  startWeight, goalWeight,
  settings, updateSettings, resetSettings,
  templates, workoutOps,
  notify,
}) {
  const [subPage, setSubPage] = useState(null);

  if (subPage === 'stats') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} label="More" />
        <ErrorBoundary>
          <StatsTab
            weighIns={weighIns}
            addWeighIn={addWeighIn}
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

  if (subPage === 'journey') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} label="More" />
        <ErrorBoundary>
          <JourneyTab
            weighIns={weighIns}
            startWeight={startWeight}
            goalWeight={goalWeight}
          />
        </ErrorBoundary>
      </div>
    );
  }

  if (subPage === 'settings') {
    return (
      <div>
        <BackButton onBack={() => setSubPage(null)} label="More" />
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

  const items = [
    {
      id: 'stats',
      icon: '📈',
      label: 'Progress & Stats',
      desc: 'Weight chart, lift progress, weigh-in history',
    },
    {
      id: 'journey',
      icon: '🗺️',
      label: 'Journey',
      desc: 'Timeline, milestones, monthly calendar',
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings',
      desc: 'Profile, targets, data export & backup',
    },
  ];

  return (
    <div className="px-5 pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>
      <h2 className="text-2xl font-bold mb-5">More</h2>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setSubPage(item.id)}
          className="w-full flex items-center gap-4 bg-white/[0.05] border border-white/[0.08]
            rounded-2xl px-5 py-5 mb-3 cursor-pointer active:bg-white/[0.08] text-left"
        >
          <span className="text-4xl">{item.icon}</span>
          <div className="flex-1">
            <div className="text-[18px] font-semibold">{item.label}</div>
            <div className="text-sm text-white/50 mt-0.5">{item.desc}</div>
          </div>
          <span className="text-white/30 text-2xl font-light">›</span>
        </button>
      ))}
    </div>
  );
}
