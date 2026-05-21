import { useState, useEffect, useCallback } from 'react';
import { load, save } from '../data/storage';
import { getToday } from '../data/constants';

const EMPTY_DAY = {
  food: [],
  water: 0,
  exercises: [],
  meditation: false,
  ranMiles: 0,
  coreMin: 0,
};

function validateDayData(raw) {
  if (!raw || typeof raw !== 'object') return EMPTY_DAY;
  return {
    food: Array.isArray(raw.food) ? raw.food : [],
    water: typeof raw.water === 'number' ? raw.water : 0,
    exercises: Array.isArray(raw.exercises) ? raw.exercises : [],
    meditation: !!raw.meditation,
    ranMiles: typeof raw.ranMiles === 'number' ? raw.ranMiles : 0,
    coreMin: typeof raw.coreMin === 'number' ? raw.coreMin : 0,
  };
}

export function useDaily() {
  const today = getToday();
  const key = `daily-${today}`;
  const [data, setData] = useState(EMPTY_DAY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = load(key, EMPTY_DAY);
      setData(validateDayData(saved));
    } catch {
      setData(EMPTY_DAY);
    }
    setLoaded(true);
  }, [key]);

  const update = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      save(key, next);
      return next;
    });
  }, [key]);

  const addFood = useCallback((item) => {
    update(prev => ({
      ...prev,
      food: [...prev.food, {
        ...item,
        id: Date.now(),
        loggedAt: new Date().toISOString(),
      }],
    }));
  }, [update]);

  const removeFood = useCallback((id) => {
    update(prev => ({
      ...prev,
      food: prev.food.filter(f => f.id !== id),
    }));
  }, [update]);

  const setWater = useCallback((n) => {
    update(prev => ({ ...prev, water: Math.max(0, Math.min(n, 6)) }));
  }, [update]);

  const toggleMeditation = useCallback(() => {
    update(prev => ({ ...prev, meditation: !prev.meditation }));
  }, [update]);

  const addRun = useCallback((miles) => {
    update(prev => ({ ...prev, ranMiles: +(prev.ranMiles + miles).toFixed(1) }));
  }, [update]);

  const addExercise = useCallback((exercise) => {
    update(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...exercise, id: Date.now() }],
    }));
  }, [update]);

  const removeExercise = useCallback((id) => {
    update(prev => ({
      ...prev,
      exercises: prev.exercises.filter(e => e.id !== id),
    }));
  }, [update]);

  const copyYesterday = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const yesterday = load(`daily-${y}`, EMPTY_DAY);
    if (!yesterday.food || yesterday.food.length === 0) return 0;
    update(prev => ({
      ...prev,
      food: [
        ...prev.food,
        ...yesterday.food.map(f => ({
          ...f,
          id: Date.now() + Math.random(),
          loggedAt: new Date().toISOString(),
        })),
      ],
    }));
    return yesterday.food.length;
  }, [update]);

  const totalCal = data.food.reduce((s, f) => s + (f.cal || 0), 0);
  const totalProtein = data.food.reduce((s, f) => s + (f.protein || 0), 0);

  return {
    data, loaded, addFood, removeFood, setWater,
    toggleMeditation, addRun, addExercise, removeExercise,
    copyYesterday, totalCal, totalProtein,
  };
}
