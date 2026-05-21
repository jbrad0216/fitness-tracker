import { useState, useCallback, useEffect } from 'react';
import { getDaySchedule, getTodaysWorkoutType } from './data/constants';
import { useDaily } from './hooks/useDaily';
import { useWeighIns, useLiftLog, useCustomFoods } from './hooks/useAppData';
import { useSettings } from './hooks/useSettings';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { Toast, ErrorBoundary, PullToRefresh, LandscapeHint } from './components/UI';
import { ChatInterface } from './components/ChatInterface';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { FoodTab } from './components/FoodTab';
import { GymTab } from './components/GymTab';
import { StatsTab } from './components/StatsTab';
import { SettingsTab } from './components/SettingsTab';
import { OnboardingFlow } from './components/OnboardingFlow';

export default function App() {
  const [tab, setTab] = useState('today');
  const [notification, setNotification] = useState(null);
  const [tabKey, setTabKey] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  const { settings, updateSettings, resetSettings, loaded: settingsLoaded } = useSettings();
  const { templates, updateExercise, addExercise: addTemplateEx, removeExercise: removeTemplateEx, moveExercise, resetTemplates } = useWorkoutTemplates();
  const daily = useDaily();
  const { weighIns, addWeighIn, latest } = useWeighIns();
  const { log: liftLog, logLift, getLastLift } = useLiftLog();
  const { foods: customFoods, addCustomFood } = useCustomFoods();

  const notify = useCallback((msg) => {
    setNotification(msg);
  }, []);

  const clearNotify = useCallback(() => {
    setNotification(null);
  }, []);

  if (!daily.loaded || !settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        Loading...
      </div>
    );
  }

  // Hide splash screen now that app is ready
  if (window.__hideSplash) { window.__hideSplash(); window.__hideSplash = null; }

  // Show onboarding if no settings have been saved yet
  const hasOnboarded = !!localStorage.getItem('ft_settings');
  if (!hasOnboarded) {
    return (
      <OnboardingFlow
        onComplete={(newSettings) => {
          updateSettings(newSettings);
        }}
      />
    );
  }

  const targets = {
    calories: settings.calories,
    protein: settings.protein,
    waterBottles: settings.waterBottles,
    sodiumMg: settings.sodiumMg,
  };

  const schedule = getDaySchedule();
  const workoutType = getTodaysWorkoutType();
  const currentWeight = latest?.weight || settings.startWeight;
  const weightLost = settings.startWeight - currentWeight;
  const weightToGo = currentWeight - settings.goalWeight;

  const scheduleColors = {
    strength: 'text-blue-400',
    cardio: 'text-amber-400',
    longrun: 'text-green-400',
    rest: 'text-purple-400',
  };

  const scheduleLabels = {
    strength: `Workout ${workoutType}`,
    cardio: 'Cardio Only',
    longrun: 'Long Run',
    rest: 'Rest Day',
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-28">
      <LandscapeHint />
      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto
          bg-blue-500/95 text-white px-4 py-3 text-sm font-semibold
          flex justify-between items-center">
          <span>Update available</span>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/20 rounded-lg px-3 py-1 text-xs font-bold border-none cursor-pointer"
          >
            Reload
          </button>
        </div>
      )}

      {/* Toast */}
      {notification && <Toast message={notification} onDone={clearNotify} />}

      {/* Header */}
      <header className="px-5 pb-2 flex justify-between items-start"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </h1>
          <p className="text-[13px] text-white/50">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            <span className={`ml-1.5 ${scheduleColors[schedule]}`}>
              · {scheduleLabels[schedule]}
            </span>
          </p>
          <p className="text-[11px] text-white/30 mt-0.5">{settings.name}'s Tracker</p>
        </div>
        {latest && (
          <div className="text-right">
            <div className="text-lg font-bold">{currentWeight}</div>
            <div className={`text-[11px] ${weightLost > 0 ? 'text-green-400' : 'text-white/50'}`}>
              {weightLost > 0 ? `↓${weightLost.toFixed(1)} lbs` : 'Start'}
              {' · '}{weightToGo.toFixed(1)} to go
            </div>
          </div>
        )}
      </header>

      {/* Tab Content */}
      <div key={tabKey} className="animate-tab-in">
      {tab === 'today' && (
        <DashboardTab
          daily={daily.data}
          totalCal={daily.totalCal}
          totalProtein={daily.totalProtein}
          setWater={daily.setWater}
          toggleMeditation={daily.toggleMeditation}
          addRun={daily.addRun}
          weighIns={weighIns}
          addWeighIn={addWeighIn}
          latest={latest}
          startWeight={settings.startWeight}
          goalWeight={settings.goalWeight}
          targets={targets}
          name={settings.name}
          notify={notify}
          settings={settings}
        />
      )}
      {tab === 'food' && (
        <FoodTab
          daily={daily.data}
          totalCal={daily.totalCal}
          totalProtein={daily.totalProtein}
          addFood={daily.addFood}
          removeFood={daily.removeFood}
          customFoods={customFoods}
          addCustomFood={addCustomFood}
          copyYesterday={daily.copyYesterday}
          targets={targets}
          notify={notify}
        />
      )}
      {tab === 'gym' && (
        <GymTab
          daily={daily.data}
          addRun={daily.addRun}
          addExercise={daily.addExercise}
          removeExercise={daily.removeExercise}
          getLastLift={getLastLift}
          logLift={logLift}
          templates={templates}
          notify={notify}
        />
      )}
      {tab === 'stats' && (
        <StatsTab
          weighIns={weighIns}
          addWeighIn={addWeighIn}
          latest={latest}
          liftLog={liftLog}
          startWeight={settings.startWeight}
          goalWeight={settings.goalWeight}
          notify={notify}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab
          settings={settings}
          updateSettings={updateSettings}
          resetSettings={resetSettings}
          templates={templates}
          workoutOps={{ updateExercise, addExercise: addTemplateEx, removeExercise: removeTemplateEx, moveExercise, resetTemplates }}
          notify={notify}
        />
      )}

      </div>

      {/* Navigation */}
      <BottomNav active={tab} onChange={(t) => { setTab(t); setTabKey(k => k + 1); }} />

      {/* Chat FAB */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed z-40 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/40
            flex items-center justify-center text-2xl border-none cursor-pointer
            active:scale-95 transition-transform w-14 h-14"
          style={{
            right: '20px',
            bottom: 'calc(max(env(safe-area-inset-bottom), 8px) + 72px)',
          }}
          title="Quick Log"
        >
          💬
        </button>
      )}

      {/* Chat Interface */}
      {showChat && (
        <ChatInterface
          daily={{ ...daily.data, totalCal: daily.totalCal, totalProtein: daily.totalProtein }}
          targets={targets}
          addFood={daily.addFood}
          setWater={daily.setWater}
          toggleMeditation={daily.toggleMeditation}
          addRun={daily.addRun}
          addWeighIn={addWeighIn}
          addExercise={daily.addExercise}
          logLift={logLift}
          getLastLift={getLastLift}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
