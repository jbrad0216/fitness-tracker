import { useState, useCallback } from 'react';
import { PROFILE, getDaySchedule, getTodaysWorkoutType, isWednesday } from './data/constants';
import { useDaily } from './hooks/useDaily';
import { useWeighIns, useLiftLog, useCustomFoods } from './hooks/useAppData';
import { Toast } from './components/UI';
import { BottomNav } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { FoodTab } from './components/FoodTab';
import { GymTab } from './components/GymTab';
import { StatsTab } from './components/StatsTab';

export default function App() {
  const [tab, setTab] = useState('today');
  const [notification, setNotification] = useState(null);

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

  if (!daily.loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        Loading...
      </div>
    );
  }

  const schedule = getDaySchedule();
  const workoutType = getTodaysWorkoutType();
  const currentWeight = latest?.weight || PROFILE.startWeight;
  const weightLost = PROFILE.startWeight - currentWeight;
  const weightToGo = currentWeight - PROFILE.goalWeight;

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
    <div className="min-h-screen max-w-lg mx-auto pb-24">
      {/* Toast */}
      {notification && <Toast message={notification} onDone={clearNotify} />}

      {/* Header */}
      <header className="px-5 pt-5 pb-2 flex justify-between items-start">
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
          startWeight={PROFILE.startWeight}
          goalWeight={PROFILE.goalWeight}
          notify={notify}
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
          notify={notify}
        />
      )}
      {tab === 'stats' && (
        <StatsTab
          weighIns={weighIns}
          addWeighIn={addWeighIn}
          latest={latest}
          liftLog={liftLog}
          notify={notify}
        />
      )}

      {/* Navigation */}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
