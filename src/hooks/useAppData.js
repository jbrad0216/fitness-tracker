import { useState, useEffect, useCallback } from 'react';
import { load, save } from '../data/storage';
import { getToday } from '../data/constants';

export function useWeighIns() {
  const [weighIns, setWeighIns] = useState([]);

  useEffect(() => {
    setWeighIns(load('weigh-ins', []));
  }, []);

  const addWeighIn = useCallback((weight) => {
    const today = getToday();
    setWeighIns(prev => {
      const filtered = prev.filter(w => w.date !== today);
      const next = [...filtered, { date: today, weight }].sort((a, b) => a.date.localeCompare(b.date));
      save('weigh-ins', next);
      return next;
    });
  }, []);

  const latest = weighIns.length ? weighIns[weighIns.length - 1] : null;

  return { weighIns, addWeighIn, latest };
}

export function useLiftLog() {
  const [log, setLog] = useState({});

  useEffect(() => {
    setLog(load('lift-log', {}));
  }, []);

  const logLift = useCallback((exerciseName, weight, sets, reps) => {
    const key = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setLog(prev => {
      const next = {
        ...prev,
        [key]: { name: exerciseName, weight, sets, reps, date: getToday() },
      };
      save('lift-log', next);
      return next;
    });
  }, []);

  const getLastLift = useCallback((exerciseName) => {
    const key = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return log[key] || null;
  }, [log]);

  return { log, logLift, getLastLift };
}

export function useCustomFoods() {
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    setFoods(load('custom-foods', []));
  }, []);

  const addCustomFood = useCallback((food) => {
    setFoods(prev => {
      const next = [...prev, { ...food, id: `custom-${Date.now()}` }];
      save('custom-foods', next);
      return next;
    });
  }, []);

  const removeCustomFood = useCallback((id) => {
    setFoods(prev => {
      const next = prev.filter(f => f.id !== id);
      save('custom-foods', next);
      return next;
    });
  }, []);

  return { foods, addCustomFood, removeCustomFood };
}
