import { useState } from 'react';

const EXPLANATIONS = [
  {
    id: 'calories',
    title: 'Why 2,400 calories?',
    settingKey: 'calories',
    settingLabel: 'Daily Calories',
    settingType: 'number',
    body: 'Your maintenance calories are estimated at ~2,900/day based on your height (6\'1"), weight (~222 lbs), age (48), and activity level (runs 4-5x/week + strength training 3x/week). Using the Mifflin-St Jeor equation: BMR ≈ 2,100, multiplied by an activity factor of 1.375 = ~2,900. A 500 calorie deficit targets ~1 lb of fat loss per week.',
    links: [
      { label: 'Calorie Calculator', url: 'https://www.calculator.net/calorie-calculator.html' },
      { label: 'Mifflin-St Jeor Study (PubMed)', url: 'https://pubmed.ncbi.nlm.nih.gov/15534426/' },
    ],
  },
  {
    id: 'protein',
    title: 'Why 160g protein?',
    settingKey: 'protein',
    settingLabel: 'Daily Protein (g)',
    settingType: 'number',
    body: 'Research recommends 0.7–1.0g of protein per pound of body weight during fat loss to preserve muscle mass. At ~222 lbs, 160g (~0.72g/lb) is the minimum effective dose. Higher protein intake also increases satiety and the thermic effect of food, helping the deficit feel less harsh.',
    links: [
      { label: 'Protein During Caloric Restriction (PubMed)', url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/' },
      { label: 'Examine.com Protein Guide', url: 'https://examine.com/guides/protein-intake/' },
    ],
  },
  {
    id: 'reps',
    title: 'Why 3×12 reps?',
    settingKey: null,
    body: '3 sets of 12 reps at moderate weight builds muscular endurance and hypertrophy simultaneously. This rep range (8–15) maximizes muscle growth stimulus (the "hypertrophy zone") while being joint-friendly. It\'s ideal for the first 4–6 weeks of a program as it allows focus on form while accumulating training volume.',
    links: [
      { label: 'Rep Ranges Meta-Analysis (PubMed)', url: 'https://pubmed.ncbi.nlm.nih.gov/28834797/' },
    ],
  },
  {
    id: 'overload',
    title: 'Why add weight each week?',
    settingKey: null,
    body: 'Progressive overload — increasing weight by 2.5–5 lbs when you can complete all sets with good form — is the foundational principle of strength training. Without it, the body adapts and stops improving. This small, consistent increase ensures continued strength and muscle gains without overwhelming recovery.',
    links: [
      { label: 'Progressive Overload (NSCA)', url: 'https://www.nsca.com/education/articles/kinetic-select/progressive-overload/' },
    ],
  },
  {
    id: 'water',
    title: 'Why 100oz water?',
    settingKey: 'waterBottles',
    settingLabel: 'Water (32oz bottles)',
    settingType: 'number',
    body: 'General guideline is roughly half your body weight in ounces. At 222 lbs, that\'s ~111 oz. We set 100 oz (about 3 liters, or 3 large 32oz bottles) as the daily target for simplicity. Adequate hydration is especially important for blood pressure management — even mild dehydration can raise blood pressure.',
    links: [
      { label: 'Water & Health (Mayo Clinic)', url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256' },
    ],
  },
  {
    id: 'split',
    title: 'Why A/B full-body 3x/week?',
    settingKey: null,
    body: 'A full-body A/B split 3 days per week hits each muscle group 2–3 times per week, which research shows is optimal for hypertrophy. Each muscle group needs 48 hours to recover, making Mon/Wed/Fri ideal. Full-body workouts also burn more calories per session than split routines since more muscle mass is involved.',
    links: [
      { label: 'Training Frequency Meta-Analysis (PubMed)', url: 'https://pubmed.ncbi.nlm.nih.gov/27102172/' },
    ],
  },
  {
    id: 'sodium',
    title: 'Why <2,000mg sodium?',
    settingKey: 'sodiumMg',
    settingLabel: 'Sodium Max (mg)',
    settingType: 'number',
    body: 'Reducing sodium intake is one of the most evidence-backed lifestyle interventions for high blood pressure. The AHA recommends <2,300mg for most adults and <1,500mg for those with hypertension. At 2,000mg, you\'re in the therapeutic range. Each 1g reduction in sodium typically lowers systolic BP by ~2–4 mmHg.',
    links: [
      { label: 'Sodium & Blood Pressure (AHA)', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/sodium/how-much-sodium-should-i-eat-per-day' },
    ],
  },
];

function ExplanationCard({ item, settings, updateSettings, notify }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');

  const currentVal = item.settingKey ? settings?.[item.settingKey] : null;

  const handleSave = () => {
    if (!item.settingKey) return;
    const val = item.settingType === 'number' ? parseFloat(editVal) : editVal;
    if (!val || isNaN(val)) return;
    updateSettings({ [item.settingKey]: val });
    setEditing(false);
    notify('Target updated');
  };

  return (
    <div className="border border-white/[0.08] rounded-2xl mb-3 overflow-hidden">
      <button
        onClick={() => { setOpen(o => !o); setEditing(false); }}
        className="w-full flex items-center gap-3 px-4 py-4 bg-transparent border-none cursor-pointer text-left"
      >
        <div className="flex-1">
          <div className="text-lg font-bold">{item.title}</div>
          {currentVal !== null && (
            <div className="text-base text-white/40 mt-0.5">Current: {currentVal}{item.settingKey === 'waterBottles' ? ' bottles' : item.settingKey === 'sodiumMg' ? 'mg' : item.settingKey === 'protein' ? 'g' : ' cal'}</div>
          )}
        </div>
        <span className="text-white/30 text-lg">{open ? '▾' : '›'}</span>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] px-4 py-4">
          <p className="text-base text-white/70 leading-relaxed mb-4">{item.body}</p>

          {item.links.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-base text-blue-400 mb-2 no-underline
                bg-blue-500/[0.07] border border-blue-500/20 rounded-xl px-3 py-2.5"
            >
              <span>🔗</span>
              <span className="flex-1">{link.label}</span>
              <span className="text-white/20">›</span>
            </a>
          ))}

          {item.settingKey && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type={item.settingType}
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    className="flex-1 bg-white/[0.08] border border-white/[0.1] rounded-xl px-3 py-2.5
                      text-[16px] text-white outline-none"
                    placeholder={`New ${item.settingLabel}`}
                    autoFocus
                  />
                  <button onClick={handleSave}
                    className="bg-blue-500 text-white rounded-xl px-4 py-2.5 text-base font-bold border-none cursor-pointer">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="bg-white/[0.08] text-white/50 rounded-xl px-3 py-2.5 border-none cursor-pointer text-base">
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditVal(String(currentVal || '')); setEditing(true); }}
                  className="flex items-center gap-2 text-base text-white/50 bg-white/[0.04]
                    border border-white/[0.08] rounded-xl px-3 py-3 cursor-pointer w-full"
                >
                  <span>✏️</span>
                  <span>Edit {item.settingLabel}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ScienceTab({ settings, updateSettings, notify }) {
  return (
    <div className="px-4 pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <h2 className="text-2xl font-bold mb-1">About My Plan</h2>
      <p className="text-base text-white/40 mb-4">
        The science behind your daily targets and workout structure.
      </p>

      <div className="bg-blue-500/[0.07] border border-blue-500/20 rounded-2xl px-4 py-3 mb-4">
        <p className="text-base text-blue-300">
          All targets are personalized for Jason: 48yo, 6'1", ~222 lbs → 200 lbs goal, high blood pressure. Tap any item to see the research behind it.
        </p>
      </div>

      {EXPLANATIONS.map(item => (
        <ExplanationCard
          key={item.id}
          item={item}
          settings={settings}
          updateSettings={updateSettings}
          notify={notify}
        />
      ))}
    </div>
  );
}
