import { useState } from 'react';
import { Card, CardTitle } from './UI';

// Mifflin-St Jeor BMR for males, returns kcal/day
function calcBMR(weightLbs, heightStr, age) {
  const kg = weightLbs / 2.2046;
  let cm = 185; // default 6'1"
  if (heightStr) {
    const m = heightStr.match(/(\d+)'[\s]*(\d+)?/);
    if (m) cm = Math.round(((parseInt(m[1]) || 0) * 12 + (parseInt(m[2]) || 0)) * 2.54);
  }
  return Math.round(10 * kg + 6.25 * cm - 5 * (age || 48) + 5);
}

// Activity multiplier based on goal
function activityFactor(goal) {
  if (goal === 'muscle') return 1.55;
  if (goal === 'lifestyle') return 1.375;
  return 1.55; // moderate active default
}

// Deficit per day based on pace
function dailyDeficit(pace) {
  if (pace === 'aggressive') return 750;
  if (pace === 'gradual') return 250;
  return 500;
}

// Surplus for muscle building
function dailySurplus(pace) {
  if (pace === 'aggressive') return 300;
  if (pace === 'gradual') return 100;
  return 200;
}

function calcRecommendedCalories(settings) {
  const bmr = calcBMR(settings.startWeight || 221, settings.height, settings.age || 48);
  const tdee = Math.round(bmr * activityFactor(settings.goal));
  if (settings.goal === 'muscle') {
    return tdee + dailySurplus(settings.pace);
  }
  return tdee - dailyDeficit(settings.pace);
}

function calcRecommendedProtein(settings) {
  const w = settings.startWeight || 221;
  if (settings.goal === 'muscle') return Math.round(w * 0.9);
  if (settings.goal === 'heart-health') return Math.round(w * 0.7);
  if (settings.goal === 'lifestyle') return Math.round(w * 0.65);
  return Math.round(w * 0.72); // fat-loss default
}

function weeksToGoal(settings) {
  const diff = Math.max(0, (settings.startWeight || 221) - (settings.goalWeight || 200));
  const deficit = dailyDeficit(settings.pace);
  const lbsPerWeek = (deficit * 7) / 3500;
  if (lbsPerWeek <= 0) return 0;
  return Math.ceil(diff / lbsPerWeek);
}

function goalDate(weeks) {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const GOAL_LABELS = {
  'fat-loss': 'Lose fat, maintain muscle',
  'muscle': 'Build muscle and strength',
  'heart-health': 'Improve heart health',
  'lifestyle': 'Sustainable lifestyle change',
  'custom': 'Custom goal',
};

const PACE_LABELS = {
  aggressive: 'Aggressive (4–6 weeks focus)',
  moderate: 'Moderate (8–12 weeks)',
  gradual: 'Gradual (16–20 weeks)',
};

function Section({ title, icon, children, editLabel, onEdit }) {
  return (
    <div className="border-b border-white/[0.06] pb-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-[18px] font-bold">{title}</h3>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20
              rounded-xl px-3 py-2.5 cursor-pointer active:opacity-70 min-h-[44px]"
          >
            {editLabel || 'Adjust ✏️'}
          </button>
        )}
      </div>
      <div className="text-[16px] text-white/75 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

function SourceLink({ label, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-400 text-sm underline"
    >
      {label} ↗
    </a>
  );
}

function InlineEdit({ label, value, onSave, type = 'number' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  if (!editing) return null;
  return (
    <div className="mt-3 flex gap-2 items-center">
      <input
        type="text"
        inputMode={type === 'number' ? 'numeric' : 'text'}
        autoComplete="off"
        value={val}
        onChange={e => setVal(e.target.value)}
        className="flex-1 bg-white/[0.08] border border-white/[0.15] rounded-xl px-3 py-2.5
          text-[16px] text-white outline-none"
      />
      <button
        onClick={() => { onSave(val); setEditing(false); }}
        className="bg-blue-500 text-white rounded-xl px-4 py-2.5 font-bold border-none cursor-pointer"
      >Save</button>
      <button
        onClick={() => setEditing(false)}
        className="bg-white/[0.08] text-white/60 rounded-xl px-3 py-2.5 border-none cursor-pointer"
      >✕</button>
    </div>
  );
}

export function PlanExplanation({ settings, updateSettings, notify }) {
  const [editingSection, setEditingSection] = useState(null);

  const s = settings;
  const bmr = calcBMR(s.startWeight || 221, s.height, s.age || 48);
  const tdee = Math.round(bmr * activityFactor(s.goal));
  const recCal = calcRecommendedCalories(s);
  const recProtein = calcRecommendedProtein(s);
  const weeks = weeksToGoal(s);
  const estDate = goalDate(weeks);
  const deficit = s.goal === 'muscle' ? dailySurplus(s.pace) : dailyDeficit(s.pace);
  const lbsPerWeek = ((dailyDeficit(s.pace) * 7) / 3500).toFixed(1);
  const isMuscleBuild = s.goal === 'muscle';
  const totalLbs = Math.max(0, (s.startWeight || 221) - (s.goalWeight || 200));

  const saveCalories = (val) => {
    const n = parseInt(val);
    if (n > 0) { updateSettings({ calories: n }); notify('Calories updated'); }
    setEditingSection(null);
  };
  const saveProtein = (val) => {
    const n = parseInt(val);
    if (n > 0) { updateSettings({ protein: n }); notify('Protein updated'); }
    setEditingSection(null);
  };
  const saveWater = (val) => {
    const n = parseInt(val);
    if (n > 0 && n <= 6) { updateSettings({ waterBottles: n }); notify('Water target updated'); }
    setEditingSection(null);
  };

  return (
    <div className="px-5 pt-2 pb-8">
      {/* Profile summary */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20
        rounded-2xl px-4 py-4 mb-6">
        <div className="text-[13px] text-blue-300/80 font-semibold uppercase tracking-wider mb-2">Your Profile</div>
        <div className="grid grid-cols-2 gap-y-1 text-[15px] text-white/70">
          <span>Age: <strong className="text-white">{s.age || 48}</strong></span>
          <span>Height: <strong className="text-white">{s.height || "6'1\""}</strong></span>
          <span>Current: <strong className="text-white">{s.startWeight || 221} lbs</strong></span>
          <span>Goal: <strong className="text-white">{s.goalWeight || 200} lbs</strong></span>
          <span>Goal type: <strong className="text-white">{GOAL_LABELS[s.goal] || s.goal}</strong></span>
          <span>Pace: <strong className="text-white">{PACE_LABELS[s.pace] || s.pace}</strong></span>
        </div>
      </div>

      <div className="text-[12px] font-bold text-white/30 uppercase tracking-widest mb-4">
        How we get you there
      </div>

      {/* Calories */}
      <Section
        icon="📊"
        title={`Daily Calories: ${s.calories} cal`}
        onEdit={() => setEditingSection(editingSection === 'cal' ? null : 'cal')}
      >
        <p>
          Your estimated maintenance (TDEE) is ~{tdee.toLocaleString()} cal/day, calculated using
          the Mifflin-St Jeor equation based on your height, weight, age, and activity level.
          BMR = {bmr.toLocaleString()} cal × activity factor {activityFactor(s.goal)} = {tdee.toLocaleString()} cal.
        </p>
        {isMuscleBuild ? (
          <p>
            For muscle building, we add {deficit} cal/day above maintenance to provide energy for
            muscle growth without excessive fat gain.
          </p>
        ) : (
          <p>
            We subtract {deficit} cal/day to create a deficit targeting ~{lbsPerWeek} lb of fat
            loss per week. A pound of fat ≈ 3,500 calories, so {deficit} cal/day × 7 = {(deficit * 7).toLocaleString()} cal/week ≈ {lbsPerWeek} lb/week.
          </p>
        )}
        <p className="text-sm text-white/50">
          Recommended based on your profile: <strong className="text-white">{recCal.toLocaleString()} cal</strong>.
          Your current setting: <strong className="text-white">{s.calories.toLocaleString()} cal</strong>.
        </p>
        {editingSection === 'cal' && (
          <InlineEdit label="Daily Calories" value={s.calories} onSave={saveCalories} />
        )}
        <div className="flex flex-wrap gap-3 mt-1">
          <SourceLink label="Mifflin-St Jeor Equation (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/15534426/" />
          <SourceLink label="CDC Weight Loss Guidelines" url="https://www.cdc.gov/healthyweight/losing_weight/index.html" />
        </div>
      </Section>

      {/* Protein */}
      <Section
        icon="🥩"
        title={`Daily Protein: ${s.protein}g`}
        onEdit={() => setEditingSection(editingSection === 'protein' ? null : 'protein')}
      >
        <p>
          {isMuscleBuild
            ? `Building muscle requires 0.8–1.0g of protein per pound of body weight. At ${s.startWeight || 221} lbs, that's ${Math.round((s.startWeight || 221) * 0.8)}–${Math.round((s.startWeight || 221) * 1.0)}g. High protein intake provides amino acids for muscle protein synthesis.`
            : `During fat loss, higher protein intake (0.7–1.0g per pound of body weight) preserves muscle mass while you lose fat. At ${s.startWeight || 221} lbs, ${recProtein}g (~${(recProtein / (s.startWeight || 221)).toFixed(2)}g/lb) is the minimum effective dose.`
          }
        </p>
        <p>
          Higher protein also increases satiety and the thermic effect of food — your body burns
          more calories just digesting it.
        </p>
        <p className="text-sm text-white/50">
          Recommended: <strong className="text-white">{recProtein}g</strong>. Current: <strong className="text-white">{s.protein}g</strong>.
        </p>
        {editingSection === 'protein' && (
          <InlineEdit label="Daily Protein (g)" value={s.protein} onSave={saveProtein} />
        )}
        <div className="flex flex-wrap gap-3 mt-1">
          <SourceLink label="Protein During Caloric Restriction (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/28698222/" />
          <SourceLink label="Examine.com Protein Guide" url="https://examine.com/guides/protein-intake/" />
        </div>
      </Section>

      {/* Water */}
      <Section
        icon="💧"
        title={`Daily Water: ${s.waterBottles * 32}oz (${s.waterBottles} × 32oz bottles)`}
        onEdit={() => setEditingSection(editingSection === 'water' ? null : 'water')}
      >
        <p>
          General guideline is roughly half your body weight in ounces. At {s.startWeight || 221} lbs,
          that's ~{Math.round((s.startWeight || 221) / 2)} oz. We use {s.waterBottles * 32} oz
          ({s.waterBottles} × 32oz bottles) as the daily target for simplicity.
        </p>
        {(s.goal === 'heart-health') && (
          <p>
            For blood pressure management, proper hydration is especially important — even mild
            dehydration can raise blood pressure. Aim to spread your intake throughout the day.
          </p>
        )}
        <p>
          Proper hydration improves workout performance, reduces false hunger signals, and helps
          regulate blood pressure.
        </p>
        {editingSection === 'water' && (
          <InlineEdit label="Water bottles (32oz)" value={s.waterBottles} onSave={saveWater} />
        )}
        <div className="flex flex-wrap gap-3 mt-1">
          <SourceLink label="Mayo Clinic: Hydration" url="https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256" />
          <SourceLink label="Hydration and Blood Pressure (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/19344527/" />
        </div>
      </Section>

      {/* Running */}
      <Section icon="🏃" title="Running: 4–5 days/week">
        <p>
          {s.goal === 'heart-health'
            ? 'As someone focused on heart health, cardiovascular exercise is your #1 priority. Running 4–5 times per week at moderate intensity directly reduces blood pressure and improves heart function.'
            : s.goal === 'muscle'
            ? 'Running 2–3 days/week maintains cardiovascular fitness without excessively interfering with muscle recovery. Too much cardio can eat into the calorie surplus needed for muscle growth.'
            : 'Running 4–5 days/week burns additional calories, improves cardiovascular health, and helps maintain the deficit needed for fat loss.'
          }
        </p>
        <p>
          Saturday long runs build aerobic base progressively:
          <br /><span className="text-white/50 text-sm">Weeks 1–2: 2.5 mi → Weeks 3–4: 3 mi → Weeks 5–6: 3.5 mi → Weeks 7+: 4 mi</span>
        </p>
        <div className="flex flex-wrap gap-3 mt-1">
          <SourceLink label="Exercise and Hypertension (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/15076798/" />
          <SourceLink label="AHA Exercise Recommendations" url="https://www.heart.org/en/healthy-living/fitness/fitness-basics/aha-recs-for-physical-activity-in-adults" />
        </div>
      </Section>

      {/* Strength training */}
      <Section icon="🏋️" title="Strength Training: 3 days/week, Full Body A/B Split">
        <p>
          Full-body A/B alternating split because each muscle gets trained 2–3× per week (optimal
          for strength gains according to research). A/B alternation covers all movement patterns:
          push, pull, squat, and hinge.
        </p>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 space-y-1.5">
          <div className="text-[14px] font-bold text-blue-400 mb-1">Workout A — Push & Squat</div>
          {[
            'Goblet Squat — quads, glutes, core. Joint-friendly squat pattern.',
            'DB Bench Press — chest, front delts, triceps. Foundational push.',
            'Lat Pulldown — back, biceps. Balances pushing movements.',
            'DB Row — back, rear delts. Unilateral work corrects imbalances.',
          ].map((t, i) => <div key={i} className="text-[14px] text-white/60">▸ {t}</div>)}
        </div>
        <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 space-y-1.5">
          <div className="text-[14px] font-bold text-purple-400 mb-1">Workout B — Hinge & Press</div>
          {[
            'DB Romanian Deadlift — hamstrings, glutes, lower back. Essential hinge.',
            'Overhead Press — shoulders, triceps, core. Functional pressing strength.',
            'Lat Pulldown — back volume. The back benefits from higher frequency.',
            'DB Reverse Lunge — quads, glutes. Builds single-leg stability.',
          ].map((t, i) => <div key={i} className="text-[14px] text-white/60">▸ {t}</div>)}
        </div>
        <p>
          {isMuscleBuild
            ? 'Why 4×6–8? Lower rep ranges with heavier weight maximize mechanical tension — the primary driver of strength and muscle growth. Progressive overload: increase weight by 2.5–5 lbs when you hit the top of the rep range.'
            : 'Why 3×12? The 8–15 rep range builds both strength and muscle. 12 reps at moderate weight is ideal for beginners — allows focus on form while building work capacity and muscle.'
          }
        </p>
        <div className="flex flex-wrap gap-3 mt-1">
          <SourceLink label="Training Frequency Meta-Analysis (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/27102172/" />
          <SourceLink label="Rep Range and Hypertrophy (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/28834797/" />
        </div>
      </Section>

      {/* Timeline */}
      {totalLbs > 0 && (
        <Section icon="📅" title="Your Timeline">
          <p>
            At {lbsPerWeek} lbs/week ({deficit} cal/day deficit):
          </p>
          <div className="bg-white/[0.04] rounded-xl p-3 space-y-2">
            {[0.25, 0.5, 0.75, 1.0].map(pct => {
              const lbs = Math.round(totalLbs * pct);
              const w = Math.ceil(lbs / parseFloat(lbsPerWeek));
              const d = new Date();
              d.setDate(d.getDate() + w * 7);
              const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div key={pct} className="flex justify-between text-[15px]">
                  <span className="text-white/60">Week {w}: -{lbs} lbs → {(s.startWeight || 221) - lbs} lbs</span>
                  <span className="text-white/40 text-sm">{label}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-[16px] font-bold border-t border-white/[0.08] pt-2 mt-1">
              <span className="text-green-400">GOAL: {s.goalWeight || 200} lbs</span>
              <span className="text-green-400">{estDate}</span>
            </div>
          </div>
          <p className="text-sm text-white/50">
            Want faster results? <span className="text-white">Aggressive pace</span> (750 cal deficit) reaches the goal in ~{Math.ceil(totalLbs / ((750 * 7) / 3500))} weeks.
            <br />
            Prefer slower? <span className="text-white">Gradual pace</span> (250 cal deficit) in ~{Math.ceil(totalLbs / ((250 * 7) / 3500))} weeks.
          </p>
        </Section>
      )}

      <p className="text-[12px] text-white/25 text-center mt-2 leading-relaxed">
        These calculations are estimates based on population averages. Individual results vary.
        Track your actual progress and adjust targets in Settings if needed.
      </p>
    </div>
  );
}
