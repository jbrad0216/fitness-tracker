import { useState } from 'react';
import { PROFILE, formatDateShort } from '../data/constants';
import { exportAllData, importAllData } from '../data/storage';
import { Card, CardTitle, Input, Button, StatBox } from './UI';

export function StatsTab({ weighIns, addWeighIn, latest, liftLog, notify }) {
  const [weightInput, setWeightInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [importText, setImportText] = useState('');

  const currentWeight = latest?.weight || PROFILE.startWeight;
  const weightLost = PROFILE.startWeight - currentWeight;
  const weightToGo = currentWeight - PROFILE.goalWeight;

  const handleWeighIn = () => {
    const w = parseFloat(weightInput);
    if (!w || w < 100 || w > 400) return;
    addWeighIn(w);
    setWeightInput('');
    notify(`${w} lbs logged`);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Data exported');
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importAllData(importText);
    if (success) {
      notify('Data imported — refresh the page');
      setImportText('');
    } else {
      notify('Import failed — check format');
    }
  };

  return (
    <div className="px-5 pt-2 pb-4">
      {/* Weight Chart */}
      <Card>
        <CardTitle>Weight Trend</CardTitle>
        {weighIns.length === 0 ? (
          <p className="text-sm text-white/40 py-3">
            No weigh-ins yet. Log your first one on Wednesday.
          </p>
        ) : (
          <>
            <div className="h-36 relative mb-3">
              <svg viewBox="0 0 100 140" className="w-full h-full">
                {(() => {
                  const weights = weighIns.map(w => w.weight);
                  const min = Math.min(...weights, PROFILE.goalWeight) - 2;
                  const max = Math.max(...weights, PROFILE.startWeight) + 2;
                  const range = max - min;
                  const W = 100;

                  return (
                    <>
                      {/* Goal line */}
                      <line
                        x1="0"
                        y1={140 - ((PROFILE.goalWeight - min) / range) * 130 - 5}
                        x2={W}
                        y2={140 - ((PROFILE.goalWeight - min) / range) * 130 - 5}
                        stroke="#22c55e" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5"
                      />
                      <text
                        x={W - 1}
                        y={140 - ((PROFILE.goalWeight - min) / range) * 130 - 8}
                        fill="#22c55e" fontSize="5.5" textAnchor="end" opacity="0.7"
                      >
                        {PROFILE.goalWeight}
                      </text>

                      {/* Start line */}
                      <line
                        x1="0"
                        y1={140 - ((PROFILE.startWeight - min) / range) * 130 - 5}
                        x2={W}
                        y2={140 - ((PROFILE.startWeight - min) / range) * 130 - 5}
                        stroke="#f59e0b" strokeWidth="0.3" strokeDasharray="2,3" opacity="0.3"
                      />

                      {/* Data line + points */}
                      {weighIns.map((wi, i) => {
                        const x = weighIns.length === 1 ? W / 2 : (i / (weighIns.length - 1)) * (W - 14) + 7;
                        const y = 140 - ((wi.weight - min) / range) * 130 - 5;
                        const prev = i > 0 ? weighIns[i - 1] : null;
                        const px = prev ? ((i - 1) / (weighIns.length - 1)) * (W - 14) + 7 : 0;
                        const py = prev ? 140 - ((prev.weight - min) / range) * 130 - 5 : 0;

                        return (
                          <g key={i}>
                            {prev && (
                              <line x1={px} y1={py} x2={x} y2={y}
                                stroke="#3b82f6" strokeWidth="1.5" />
                            )}
                            <circle cx={x} cy={y} r="2.5" fill="#3b82f6" />
                            <text x={x} y={y - 6} fill="#f0f0f0"
                              fontSize="5.5" textAnchor="middle" fontWeight="600">
                              {wi.weight}
                            </text>
                            <text x={x} y={y + 10} fill="rgba(255,255,255,0.4)"
                              fontSize="4" textAnchor="middle">
                              {formatDateShort(wi.date)}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Weight stats */}
            <div className="flex justify-around">
              <StatBox
                value={`${weightLost > 0 ? '-' : ''}${Math.abs(weightLost).toFixed(1)}`}
                label="lbs lost"
                color={weightLost > 0 ? '#22c55e' : undefined}
              />
              <StatBox value={weightToGo.toFixed(1)} label="lbs to go" />
              <StatBox value={currentWeight} label="current" />
            </div>
          </>
        )}
      </Card>

      {/* Log Weigh-In */}
      <Card>
        <CardTitle>Log Weigh-In</CardTitle>
        <div className="flex gap-2">
          <Input
            type="number"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            placeholder="Weight (lbs)"
            step="0.1"
            className="flex-1"
          />
          <Button onClick={handleWeighIn}>Log</Button>
        </div>
        <p className="text-[11px] text-white/40 mt-1.5">Best practice: Wednesday mornings only</p>
      </Card>

      {/* Lift Progress */}
      <Card>
        <CardTitle>Lift Progress</CardTitle>
        {Object.keys(liftLog).length === 0 ? (
          <p className="text-sm text-white/40">No lifts logged yet</p>
        ) : (
          Object.entries(liftLog).map(([key, val]) => (
            <div key={key}
              className="flex justify-between items-center py-2 border-b border-white/[0.06] last:border-0">
              <div>
                <span className="text-[13px] capitalize">{val.name || key.replace(/-/g, ' ')}</span>
                <div className="text-[11px] text-white/30">{formatDateShort(val.date)}</div>
              </div>
              <span className="text-[13px] text-blue-400 font-semibold">
                {val.weight}lbs × {val.sets}×{val.reps}
              </span>
            </div>
          ))
        )}
      </Card>

      {/* Weigh-In History */}
      {weighIns.length > 0 && (
        <Card>
          <CardTitle>Weigh-In History</CardTitle>
          {[...weighIns].reverse().map((wi, i) => {
            const origIdx = weighIns.length - 1 - i;
            const prev = origIdx > 0 ? weighIns[origIdx - 1] : null;
            const diff = prev ? wi.weight - prev.weight : 0;

            return (
              <div key={i}
                className="flex justify-between py-2 border-b border-white/[0.06] last:border-0">
                <span className="text-[13px] text-white/50">{formatDateShort(wi.date)}</span>
                <span className="text-[13px]">
                  {wi.weight} lbs
                  {diff !== 0 && (
                    <span className={`ml-2 text-[11px] ${diff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      {/* Settings / Data */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full rounded-xl py-3 mb-3 text-sm text-white/40
          bg-white/[0.03] border border-white/[0.06] cursor-pointer"
      >
        {showSettings ? 'Hide' : '⚙️ Data & Settings'}
      </button>

      {showSettings && (
        <Card>
          <div className="flex flex-col gap-3">
            <Button onClick={handleExport} variant="ghost" className="w-full">
              📥 Export All Data (JSON)
            </Button>
            <div>
              <Label>Import Data</Label>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste exported JSON here..."
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl
                  p-3 text-sm text-white/80 outline-none h-24 resize-none
                  placeholder:text-white/25"
              />
              <Button onClick={handleImport} variant="ghost" className="w-full mt-2">
                📤 Import Data
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
