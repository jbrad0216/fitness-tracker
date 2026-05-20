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

export function useDaily() {
  const today = getToday();
  const key = `daily-${today}`;
  const [data, setData] = useState(EMPTY_DAY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = load(key, EMPTY_DAY);
    setData(saved);
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
      food: [...prev.food, { ...item, id: Date.now() }],
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

  const totalCal = data.food.reduce((s, f) => s + (f.cal || 0), 0);
  const totalProtein = data.food.reduce((s, f) => s + (f.protein || 0), 0);

  return {
    data, loaded, addFood, removeFood, setWater,
    toggleMeditation, addRun, addExercise, removeExercise,
    totalCal, totalProtein,
  };
}
