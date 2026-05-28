import { useState, useCallback, useEffect, useRef } from 'react';
import { useDaily } from './hooks/useDaily';
import { useWeighIns, useLiftLog } from './hooks/useAppData';
import { useSettings } from './hooks/useSettings';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { Toast, ErrorBoundary, LandscapeHint, OfflineIndicator } from './components/UI';
import { LogTab } from './components/LogTab';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { GymTab } from './components/GymTab';
import { MoreTab } from './components/MoreTab';
import { OnboardingFlow } from './components/OnboardingFlow';

export default function App() {
  const TAB_ORDER = ['home', 'log', 'gym', 'more'];
  const [tab, setTab] = useState('home');
  const [notification, setNotification] = useState(null);
  const [tabKey, setTabKey] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const swipeStartX = useRef(null);
  const swipeStartY = useRef(null);

  // Apple Health URL params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const steps = params.get('steps');
    const activeCal = params.get('activeCal');
    if (steps || activeCal) {
      const data = {};
      if (steps) data.steps = parseInt(steps);
      if (activeCal) data.activeCal = parseInt(activeCal);
      localStorage.setItem('ft_apple-health-today', JSON.stringify({ ...data, date: new Date().toISOString().split('T')[0] }));
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  const changeTab = useCallback((t) => {
    setTab(t);
    setTabKey(k => k + 1);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (tab === 'log') return;
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  }, [tab]);

  const handleTouchEnd = useCallback((e) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY.current);
    swipeStartX.current = null;
    if (Math.abs(dx) < 60 || dy > 80) return;
    const idx = TAB_ORDER.indexOf(tab);
    if (dx < 0 && idx < TAB_ORDER.length - 1) changeTab(TAB_ORDER[idx + 1]);
    if (dx > 0 && idx > 0) changeTab(TAB_ORDER[idx - 1]);
  }, [tab, changeTab]);

  const { settings, updateSettings, resetSettings, loaded: settingsLoaded } = useSettings();
  const { templates, updateExercise, addExercise: addTemplateEx, removeExercise: removeTemplateEx, moveExercise, resetTemplates } = useWorkoutTemplates();
  const daily = useDaily();
  const { weighIns, addWeighIn, removeWeighIn, latest } = useWeighIns();
  const { log: liftLog, logLift, getLastLift } = useLiftLog();

  const notify = useCallback((msg) => setNotification(msg), []);
  const clearNotify = useCallback(() => setNotification(null), []);

  if (!daily.loaded || !settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50 text-lg">
        Loading...
      </div>
    );
  }

  if (window.__hideSplash) { window.__hideSplash(); window.__hideSplash = null; }

  const hasOnboarded = !!localStorage.getItem('ft_settings');
  if (!hasOnboarded) {
    return <OnboardingFlow onComplete={updateSettings} />;
  }

  const targets = {
    calories: settings.calories,
    protein: settings.protein,
    waterBottles: settings.waterBottles,
    sodiumMg: settings.sodiumMg,
  };

  const isLight = settings.theme === 'light';

  return (
    <div
      className={`min-h-screen max-w-lg mx-auto ${isLight ? 'light-mode' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <LandscapeHint />
      <OfflineIndicator />

      {updateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto
          bg-blue-500/95 text-white px-4 py-3 text-base font-semibold
          flex justify-between items-center">
          <span>Update available</span>
          <button onClick={() => window.location.reload()}
            className="bg-white/20 rounded-lg px-3 py-2 text-sm font-bold border-none cursor-pointer">
            Reload
          </button>
        </div>
      )}

      {notification && <Toast message={notification} onDone={clearNotify} />}

      {/* Log tab — full screen fixed panel */}
      {tab === 'log' && (
        <div
          className="fixed inset-x-0 max-w-lg mx-auto z-20 flex flex-col bg-[#0f1117]"
          style={{
            top: 0,
            bottom: `calc(64px + max(env(safe-area-inset-bottom), 8px))`,
          }}
        >
          <LogTab
            daily={{ ...daily.data, totalCal: daily.totalCal, totalProtein: daily.totalProtein }}
            targets={targets}
            addFood={daily.addFood}
            addExercise={daily.addExercise}
            logLift={logLift}
            getLastLift={getLastLift}
            notify={notify}
          />
        </div>
      )}

      {/* All other tabs */}
      {tab !== 'log' && (
        <div key={tabKey} className="pb-24 animate-tab-in">

          {tab === 'home' && (
            <ErrorBoundary>
              <DashboardTab
                daily={daily.data}
                totalCal={daily.totalCal}
                totalProtein={daily.totalProtein}
                setWater={daily.setWater}
                toggleMeditation={daily.toggleMeditation}
                addRun={daily.addRun}
                addFood={daily.addFood}
                removeFood={daily.removeFood}
                updateFood={daily.updateFood}
                weighIns={weighIns}
                addWeighIn={addWeighIn}
                removeWeighIn={removeWeighIn}
                latest={latest}
                startWeight={settings.startWeight}
                goalWeight={settings.goalWeight}
                targets={targets}
                name={settings.name}
                notify={notify}
                onNavigate={changeTab}
                onOpenLog={() => changeTab('log')}
                settings={settings}
                updateSettings={updateSettings}
              />
            </ErrorBoundary>
          )}

          {tab === 'gym' && (
            <ErrorBoundary>
              <GymTab
                daily={daily.data}
                addRun={daily.addRun}
                addRunEntry={daily.addRunEntry}
                addExercise={daily.addExercise}
                removeExercise={daily.removeExercise}
                setWorkoutCalories={daily.setWorkoutCalories}
                getLastLift={getLastLift}
                logLift={logLift}
                templates={templates}
                notify={notify}
                goal={settings.goal}
              />
            </ErrorBoundary>
          )}

          {tab === 'more' && (
            <ErrorBoundary>
              <MoreTab
                weighIns={weighIns}
                addWeighIn={addWeighIn}
                removeWeighIn={removeWeighIn}
                latest={latest}
                liftLog={liftLog}
                startWeight={settings.startWeight}
                goalWeight={settings.goalWeight}
                settings={settings}
                updateSettings={updateSettings}
                resetSettings={resetSettings}
                templates={templates}
                workoutOps={{ updateExercise, addExercise: addTemplateEx, removeExercise: removeTemplateEx, moveExercise, resetTemplates }}
                notify={notify}
                onNavigate={changeTab}
              />
            </ErrorBoundary>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <BottomNav active={tab} onChange={changeTab} />
    </div>
  );
}
