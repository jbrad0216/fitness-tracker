import { useState } from 'react';
import {
  getTodaysWorkoutType, getDaySchedule,
} from '../data/constants';
import { Card, CardTitle, Input, Button, Label } from './UI';

export function GymTab({ daily, addRun, addExercise, removeExercise, getLastLift, logLift, templates, notify }) {
  const [runInput, setRunInput] = useState('');
  const [exForm, setExForm] = useState({ name: '', weight: '', sets: '3', reps: '12' });
  const [activeLog, setActiveLog] = useState(null); // exercise name being logged

  const schedule = getDaySchedule();
  const workoutType = getTodaysWorkoutType();
  const exercises = workoutType === 'A' ? (templates?.A || []) : workoutType === 'B' ? (templates?.B || []) : [];

  const handleLogRun = () => {
    const miles = parseFloat(runInput);
    if (!miles || miles <= 0) return;
    addRun(miles);
    setRunInput('');
    notify(`${miles}mi logged`);
  };

  const handleLogExercise = (name, weight, sets, reps) => {
    addExercise({ name, weight: parseFloat(weight) || 0, sets: parseInt(sets) || 3, reps: parseInt(reps) || 12 });
    logLift(name, parseFloat(weight) || 0, parseInt(sets) || 3, parseInt(reps) || 12);
    setActiveLog(null);
    setExForm({ name: '', weight: '', sets: '3', reps: '12' });
    notify(`${name} logged`);
  };

  const handleCustomLog = () => {
    if (!exForm.name) return;
    handleLogExercise(exForm.name, exForm.weight, exForm.sets, exForm.reps);
  };

  const scheduleLabels = {
    strength: { text: `Strength Day · Workout ${workoutType}`, color: 'text-blue-400' },
    cardio: { text: 'Cardio + Mobility Day', color: 'text-amber-400' },
    longrun: { text: 'Long Run Day', color: 'text-green-400' },
    rest: { text: 'Rest Day', color: 'text-purple-400' },
  };

  const { text: schedLabel, color: schedColor } = scheduleLabels[schedule];

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Schedule Badge */}
      <div className={`text-center text-sm font-semibold mb-4 ${schedColor}`}>
        {schedLabel}
      </div>

      {/* Run Logger */}
      <Card>
        <CardTitle>Cardio</CardTitle>
        {daily.ranMiles > 0 ? (
          <div className="text-green-400 text-sm font-semibold py-1">
            ✓ {daily.ranMiles} miles today
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              type="number"
              value={runInput}
              onChange={e => setRunInput(e.target.value)}
              placeholder="Miles"
              step="0.1"
              className="flex-1"
            />
            <Button variant="success" onClick={handleLogRun}>Log Run</Button>
          </div>
        )}
      </Card>

      {/* Prescribed Workout */}
      {schedule === 'strength' && workoutType && (
        <Card>
          <CardTitle right="3×12, rest 60-90s">Workout {workoutType}</CardTitle>
          {exercises.map((ex, i) => {
            const prev = getLastLift(ex.name);
            const isLogged = daily.exercises.some(e => e.name === ex.name);
            const isActive = activeLog === ex.name;

            return (
              <div key={i} className={`py-3 border-b border-white/[0.06] last:border-0
                ${isLogged ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm">
                      {isLogged && '✓ '}{ex.name}
                    </div>
                    <div className="text-[11px] text-white/40">
                      {prev
                        ? `Last: ${prev.weight}lbs × ${prev.sets}×${prev.reps}`
                        : `Target: ${ex.defaultWeight}lbs × ${ex.sets}×${ex.reps}`
                      }
                    </div>
                  </div>
                  {!isLogged && (
                    <Button
                      onClick={() => {
                        if (isActive) {
                          setActiveLog(null);
                        } else {
                          setActiveLog(ex.name);
                          setExForm({
                            name: ex.name,
                            weight: prev ? String(prev.weight) : String(ex.defaultWeight),
                            sets: String(ex.sets),
                            reps: String(ex.reps),
                          });
                        }
                      }}
                      variant={isActive ? 'ghost' : 'primary'}
                      className="text-xs px-3 py-2"
                    >
                      {isActive ? 'Cancel' : 'Log'}
                    </Button>
                  )}
                </div>

                {/* Inline log form */}
                {isActive && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <Label>Weight</Label>
                        <Input
                          type="number"
                          value={exForm.weight}
                          onChange={e => setExForm({ ...exForm, weight: e.target.value })}
                          step="2.5"
                        />
                      </div>
                      <div className="w-16">
                        <Label>Sets</Label>
                        <Input
                          type="number"
                          value={exForm.sets}
                          onChange={e => setExForm({ ...exForm, sets: e.target.value })}
                        />
                      </div>
                      <div className="w-16">
                        <Label>Reps</Label>
                        <Input
                          type="number"
                          value={exForm.reps}
                          onChange={e => setExForm({ ...exForm, reps: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleLogExercise(ex.name, exForm.weight, exForm.sets, exForm.reps)}
                      className="w-full"
                    >
                      Save {ex.name}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* Non-strength day message */}
      {schedule !== 'strength' && (
        <Card>
          <div className="text-center py-4 text-sm text-white/50">
            {schedule === 'rest' && 'Rest day. Recover. Walk if you feel like it.'}
            {schedule === 'longrun' && 'Long run day. Push the distance. Stretch after.'}
            {schedule === 'cardio' && 'Cardio + stretch/mobility. 15 min stretch after your run.'}
          </div>
        </Card>
      )}

      {/* Manual Exercise Entry */}
      <Card>
        <CardTitle>Custom Exercise</CardTitle>
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            value={exForm.name}
            onChange={e => setExForm({ ...exForm, name: e.target.value })}
            placeholder="Exercise name"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                value={exForm.weight}
                onChange={e => setExForm({ ...exForm, weight: e.target.value })}
                placeholder="0"
                step="2.5"
              />
            </div>
            <div className="w-16">
              <Label>Sets</Label>
              <Input
                type="number"
                value={exForm.sets}
                onChange={e => setExForm({ ...exForm, sets: e.target.value })}
                placeholder="3"
              />
            </div>
            <div className="w-16">
              <Label>Reps</Label>
              <Input
                type="number"
                value={exForm.reps}
                onChange={e => setExForm({ ...exForm, reps: e.target.value })}
                placeholder="12"
              />
            </div>
          </div>
          <Button onClick={handleCustomLog} className="w-full">Log Exercise</Button>
        </div>
      </Card>

      {/* Logged Exercises */}
      {daily.exercises.length > 0 && (
        <Card>
          <CardTitle>Logged Today</CardTitle>
          {daily.exercises.map(e => (
            <div key={e.id} className="flex justify-between items-center py-2
              border-b border-white/[0.06] last:border-0">
              <div className="text-[13px]">
                <span className="font-semibold">{e.name}</span> — {e.weight}lbs × {e.sets}×{e.reps}
              </div>
              <button
                onClick={() => removeExercise(e.id)}
                className="w-7 h-7 rounded-md bg-red-500/15 text-red-400 border-none
                  cursor-pointer text-sm flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
