import { useState, useEffect, useCallback } from 'react';
import { load, save } from '../data/storage';
import { TARGETS, PROFILE } from '../data/constants';

export const DEFAULT_SETTINGS = {
  name: PROFILE.name,
  age: PROFILE.age,
  height: PROFILE.height,
  startWeight: PROFILE.startWeight,
  goalWeight: PROFILE.goalWeight,
  calories: TARGETS.calories,
  protein: TARGETS.protein,
  waterBottles: TARGETS.waterBottles,
  sodiumMg: TARGETS.sodiumMg,
  cloudStorage: 'device',
  theme: 'dark',
  goal: 'fat-loss',
  pace: 'moderate',
  goalCustomText: '',
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = load('settings', null);
    if (saved) {
      setSettings({ ...DEFAULT_SETTINGS, ...saved });
    }
    setLoaded(true);
  }, []);

  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      save('settings', next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    save('settings', DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSettings, resetSettings, loaded };
}
