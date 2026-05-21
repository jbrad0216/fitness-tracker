import { useState, useRef, useEffect, useCallback } from 'react';
import { getToday } from '../data/constants';
import { load, save } from '../data/storage';

// ─── Natural language parser ───
function parseMessage(text, { daily, targets, addFood, setWater, toggleMeditation, addRun, addWeighIn, addExercise, logLift, getLastLift }) {
  const lower = text.toLowerCase().trim();
  const responses = [];

  // Helper: extract first number
  const num = (str) => {
    const m = str.match(/[\d]+\.?[\d]*/);
    return m ? parseFloat(m[0]) : null;
  };

  // Weigh-in: "weight is 220.5" / "weigh 220" / "I weigh 221"
  if (/\b(weight|weigh|weighed)\b/.test(lower)) {
    const w = num(lower);
    if (w && w >= 100 && w <= 400) {
      addWeighIn(w);
      return [{ type: 'success', text: `Logged weigh-in: ${w} lbs ✓` }];
    }
  }

  // Run / walk: "ran 2 miles" / "walked 3.5 miles" / "2 mile run"
  if (/\b(ran|run|running|walked|walk|jog|jogged|miles?)\b/.test(lower)) {
    const m = num(lower);
    if (m && m > 0 && m < 100) {
      addRun(m);
      return [{ type: 'success', text: `Logged ${m} mile run ✓` }];
    }
  }

  // Water: "drank 2 bottles" / "2 waters" / "water 3"
  if (/\b(water|bottle|drank|drink|hydrat)\b/.test(lower)) {
    const b = num(lower);
    if (b !== null && b >= 0 && b <= 10) {
      setWater(Math.round(b));
      return [{ type: 'success', text: `Water updated to ${Math.round(b)} bottles ✓` }];
    }
    // Toggle +1
    const next = Math.min((daily.water || 0) + 1, targets.waterBottles);
    setWater(next);
    return [{ type: 'success', text: `Water: ${next}/${targets.waterBottles} bottles ✓` }];
  }

  // Meditation: "did my meditation" / "meditated" / "tm done"
  if (/\b(meditat|tm|transcendental|mindful)\b/.test(lower)) {
    toggleMeditation();
    const newState = !daily.meditation;
    return [{ type: 'success', text: `Meditation ${newState ? 'checked ✓' : 'unchecked'}` }];
  }

  // Exercise: "bench pressed 35 lbs 3x12" / "did squats 45lbs 3 sets 12 reps"
  const exercisePatterns = [
    /\b(bench|squat|deadlift|press|row|pulldown|lunge|curl|dip|pull.?up|push.?up)\b/,
  ];
  const exMatch = exercisePatterns.some(p => p.test(lower));
  if (exMatch) {
    // Extract weight
    const weightMatch = lower.match(/(\d+\.?\d*)\s*(lb|lbs|pound|kg)/);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : null;

    // Extract sets x reps: "3x12" or "3 sets 12 reps"
    const setsRepsMatch = lower.match(/(\d+)\s*[x×]\s*(\d+)/) ||
      lower.match(/(\d+)\s*sets?\s*(?:of\s*)?(\d+)\s*reps?/);
    const sets = setsRepsMatch ? parseInt(setsRepsMatch[1]) : 3;
    const reps = setsRepsMatch ? parseInt(setsRepsMatch[2]) : 12;

    // Extract exercise name — use keyword
    let exName = 'Exercise';
    if (/bench/.test(lower)) exName = 'DB Bench Press';
    else if (/squat/.test(lower)) exName = 'Goblet Squat';
    else if (/deadlift|rdl/.test(lower)) exName = 'DB Romanian Deadlift';
    else if (/overhead|ohp/.test(lower)) exName = 'Overhead Press';
    else if (/row/.test(lower)) exName = 'DB Row';
    else if (/pulldown|pull.?down/.test(lower)) exName = 'Lat Pulldown';
    else if (/lunge/.test(lower)) exName = 'DB Reverse Lunge';
    else if (/curl/.test(lower)) exName = 'DB Curl';
    else if (/press/.test(lower)) exName = 'DB Press';

    const useWeight = weight || (getLastLift(exName)?.weight) || 0;
    addExercise({ name: exName, weight: useWeight, sets, reps });
    logLift(exName, useWeight, sets, reps);
    return [{ type: 'success', text: `Logged: ${exName} — ${useWeight}lbs × ${sets}×${reps} ✓` }];
  }

  // Food logging: "ate a cheeseburger" / "had chicken rice" / "lunch was salad"
  const foodKeywords = /\b(ate|eat|had|eaten|lunch|dinner|breakfast|snack|drink|drank)\b/;
  if (foodKeywords.test(lower)) {
    // Extract food name: everything after the keyword
    const afterKeyword = lower.replace(/^.*(ate|eat|had|eaten|lunch|dinner|breakfast|snack|drink|drank)\s*(a\s+|some\s+|my\s+)?/i, '').trim();
    const foodName = afterKeyword || 'Food';

    // Search the food database asynchronously
    return [{
      type: 'searching',
      text: `Searching for "${foodName}"...`,
      foodQuery: foodName,
    }];
  }

  // Queries about current status
  if (/\b(how|what|total|calories|protein|left|remaining|progress|today)\b/.test(lower)) {
    const calLeft = targets.calories - (daily.totalCal || 0);
    const proLeft = Math.max(0, targets.protein - (daily.totalProtein || 0));
    return [{
      type: 'info',
      text: `Today: ${daily.totalCal || 0} cal (${calLeft > 0 ? calLeft + ' left' : Math.abs(calLeft) + ' over'}) · ${daily.totalProtein || 0}g protein (${proLeft}g left) · ${daily.water || 0}/${targets.waterBottles} water`,
    }];
  }

  // Fallback
  return [{
    type: 'error',
    text: "I didn't catch that. Try: 'I ran 2 miles', 'drank 2 bottles of water', 'ate chicken and rice', 'bench pressed 35 lbs 3x12', or 'weight is 221'",
  }];
}

export function ChatInterface({
  daily, targets, addFood, setWater, toggleMeditation, addRun, addWeighIn,
  addExercise, logLift, getLastLift, onClose,
}) {
  const today = getToday();
  const storageKey = `chat-${today}`;

  const [messages, setMessages] = useState(() => load(storageKey, []));
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    save(storageKey, messages.slice(-50)); // keep last 50
  }, [messages, storageKey]);

  const addMsg = (role, text, type = 'normal') => {
    setMessages(prev => [...prev, { role, text, type, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }]);
  };

  const searchAndLog = useCallback(async (foodQuery) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodQuery)}&api_key=DEMO_KEY&pageSize=1`
      );
      if (res.ok) {
        const data = await res.json();
        const food = data.foods?.[0];
        if (food) {
          const nutrients = food.foodNutrients || [];
          const get = (name) => {
            const n = nutrients.find(n => n.nutrientName?.toLowerCase().includes(name));
            return n ? Math.round(n.value || 0) : 0;
          };
          const item = {
            name: food.description,
            cal: get('energy') || get('Energy'),
            protein: get('protein') || get('Protein'),
            fat: get('lipid') || get('fat'),
            carbs: get('carbohydrate') || get('Carbohydrate'),
          };
          addFood(item);
          addMsg('assistant', `Logged: ${item.name} — ${item.cal} cal, ${item.protein}g protein ✓`, 'success');
        } else {
          addMsg('assistant', `Couldn't find "${foodQuery}" in the database. Use the Food tab to add it manually.`, 'error');
        }
      } else {
        addMsg('assistant', `Search unavailable. Use the Food tab to add "${foodQuery}" manually.`, 'error');
      }
    } catch {
      addMsg('assistant', `Search unavailable. Use the Food tab to add "${foodQuery}" manually.`, 'error');
    } finally {
      setIsSearching(false);
    }
  }, [addFood]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    addMsg('user', text);
    setInput('');

    const ctx = {
      daily,
      targets,
      addFood,
      setWater,
      toggleMeditation,
      addRun,
      addWeighIn,
      addExercise,
      logLift,
      getLastLift,
    };

    const responses = parseMessage(text, ctx);
    responses.forEach(r => {
      if (r.type === 'searching' && r.foodQuery) {
        addMsg('assistant', r.text, 'info');
        searchAndLog(r.foodQuery);
      } else {
        addMsg('assistant', r.text, r.type);
      }
    });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const SUGGESTIONS = [
    'I ran 2 miles',
    'drank 3 bottles of water',
    'ate chicken and rice',
    'bench pressed 35 lbs 3x12',
    'what are my calories today',
    'did my meditation',
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col max-w-lg mx-auto bg-[#0f1117]"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)', paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <div>
          <h2 className="text-base font-bold">Quick Log</h2>
          <p className="text-[11px] text-white/40">Natural language food & activity logger</p>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/[0.06] text-white/60 border-none
            cursor-pointer text-lg flex items-center justify-center">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm text-white/50 mb-4">Tell me what you did. I'll log it for you.</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="text-left text-xs text-white/50 bg-white/[0.04] rounded-xl
                    px-3 py-2.5 border border-white/[0.06] cursor-pointer active:opacity-70"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm
              ${msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-sm'
                : msg.type === 'success'
                  ? 'bg-green-500/15 border border-green-500/30 text-green-300 rounded-bl-sm'
                  : msg.type === 'error'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-sm'
                    : 'bg-white/[0.06] text-white/80 rounded-bl-sm'
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <p className="text-[10px] opacity-50 mt-1">{msg.time}</p>
            </div>
          </div>
        ))}

        {isSearching && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-white/30 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.08]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="I ran 2 miles, ate a salad..."
            className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-2xl
              px-4 py-3 text-sm text-white outline-none placeholder:text-white/25
              focus:border-blue-500/50 min-h-[48px]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSearching}
            className="w-12 h-12 bg-blue-500 text-white rounded-2xl border-none cursor-pointer
              flex items-center justify-center text-lg active:opacity-80
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
