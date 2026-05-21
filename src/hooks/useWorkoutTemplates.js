import { useState, useEffect, useCallback } from 'react';
import { load, save } from '../data/storage';
import { WORKOUT_A, WORKOUT_B } from '../data/constants';

export const DEFAULT_TEMPLATES = {
  A: WORKOUT_A,
  B: WORKOUT_B,
};

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState({ A: [...WORKOUT_A], B: [...WORKOUT_B] });

  useEffect(() => {
    const saved = load('workout-templates', null);
    if (saved) {
      setTemplates(saved);
    }
  }, []);

  const updateExercise = useCallback((workout, index, updates) => {
    setTemplates(prev => {
      const next = {
        ...prev,
        [workout]: prev[workout].map((ex, i) => i === index ? { ...ex, ...updates } : ex),
      };
      save('workout-templates', next);
      return next;
    });
  }, []);

  const addExercise = useCallback((workout, exercise) => {
    setTemplates(prev => {
      const next = {
        ...prev,
        [workout]: [...prev[workout], exercise],
      };
      save('workout-templates', next);
      return next;
    });
  }, []);

  const removeExercise = useCallback((workout, index) => {
    setTemplates(prev => {
      const next = {
        ...prev,
        [workout]: prev[workout].filter((_, i) => i !== index),
      };
      save('workout-templates', next);
      return next;
    });
  }, []);

  const moveExercise = useCallback((workout, index, direction) => {
    setTemplates(prev => {
      const arr = [...prev[workout]];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      const next = { ...prev, [workout]: arr };
      save('workout-templates', next);
      return next;
    });
  }, []);

  const resetTemplates = useCallback(() => {
    const defaults = { A: [...WORKOUT_A], B: [...WORKOUT_B] };
    save('workout-templates', defaults);
    setTemplates(defaults);
  }, []);

  return { templates, updateExercise, addExercise, removeExercise, moveExercise, resetTemplates };
}
