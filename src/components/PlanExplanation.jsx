import { useState } from 'react';

function parseHeightToCm(heightStr) {
  if (!heightStr) return 185.4; // 6'1"
  const m = heightStr.match(/(\d+)'[\s]*(\d+)?/);
  if (m) return ((parseInt(m[1]) || 0) * 12 + (parseInt(m[2]) || 0)) * 2.54;
  const n = parseFloat(heightStr);
  return n > 0 ? (n < 10 ? n * 100 : n) : 185.4;
}

function calcMifflin(weightLbs, heightStr, age) {
  const kg = weightLbs * 0.453592;
  const cm = parseHeightToCm(heightStr);
  const bmr = (10 * kg) + (6.25 * cm) - (5 * age) - 5;
  return {
    kg: kg.toFixed(1),
    cm: cm.toFixed(1),
    bmr: Math.round(bmr),
    bmrSteps: `(10 × ${kg.toFixed(1)}) + (6.25 × ${cm.toFixed(1)}) − (5 × ${age}) − 5`,
    bmrParts: `${Math.round(10 * kg)} + ${Math.round(6.25 * cm)} − ${5 * age} − 5`,
  };
}

function goalDate(weeksFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + weeksFromNow * 7);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function SourceLink({ label, url }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="text-blue-400 text-base underline">
      {label} ↗
    </a>
  );
}

function Step({ num, title, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-base font-bold
          flex items-center justify-center shrink-0">
          {num}
        </div>
        <div className="text-lg font-bold">{title}</div>
      </div>
      <div className="ml-11 text-base text-white/70 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

function CalcBox({ children }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 font-mono text-base leading-relaxed">
      {children}
    </div>
  );
}

export function PlanExplanation({ settings, updateSettings, notify }) {
  const s = settings || {};
  const wt = s.startWeight || 221;
  const goalWt = s.goalWeight || 200;
  const age = s.age || 48;
  const goal = s.goal || 'fat-loss';
  const pace = s.pace || 'moderate';
  const waterBottles = s.waterBottles || 3;
  const heightStr = s.height || "6'1\"";

  const { kg, cm, bmr, bmrSteps, bmrParts } = calcMifflin(wt, heightStr, age);
  const activityMult = 1.55;
  const tdee = Math.round(bmr * activityMult);

  const deficits = { fast: 750, moderate: 500, slow: 250 };
  const rates = { fast: 1.5, moderate: 1.0, slow: 0.5 };
  const deficit = deficits[pace] || 500;
  const lbsPerWeek = rates[pace] || 1.0;

  const isMuscleBuild = goal === 'muscle';

  let calTarget, calExplanation;
  if (isMuscleBuild) {
    calTarget = Math.round(tdee + 300);
    calExplanation = `${tdee} + 300 surplus = ${calTarget.toLocaleString()} cal/day`;
  } else {
    calTarget = Math.max(1200, Math.round(tdee - deficit));
    calExplanation = `${tdee} − ${deficit} = ${calTarget.toLocaleString()}, rounded to ${s.calories || calTarget} cal/day`;
  }

  const proteinRatio = isMuscleBuild ? 1.0 : 0.73;
  const protein = Math.round(wt * proteinRatio);

  const halfBodyWeightOz = Math.round(wt / 2);
  const waterOz = waterBottles * 32;

  const lbsToLose = Math.max(0, wt - goalWt);
  const weeksToGoal = lbsToLose > 0 && !isMuscleBuild ? Math.ceil(lbsToLose / lbsPerWeek) : null;
  const estDate = weeksToGoal ? goalDate(weeksToGoal) : null;

  return (
    <div className="px-5 pt-2 pb-10">
      {/* Profile card */}
      <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl px-4 py-4 mb-6">
        <div className="text-base font-bold text-blue-300 uppercase tracking-wider mb-2">YOUR PLAN ANALYSIS</div>
        <div className="text-base text-white/70">
          Based on: Male, {age} years old, {heightStr}, {wt} lbs<br />
          Goal: {isMuscleBuild ? 'Build muscle' : `Lose fat — target ${goalWt} lbs`}
          {!isMuscleBuild && `, ${pace} pace`}
        </div>
      </div>

      {/* Step 1: Maintenance Calories */}
      <Step num="1" title="Your Maintenance Calories">
        <p>Using the <strong className="text-white">Mifflin-St Jeor equation</strong> (the gold standard for estimating metabolic rate):</p>
        <CalcBox>
          <div className="text-white/50 text-base mb-1">BMR = (10 × kg) + (6.25 × cm) − (5 × age) − 5</div>
          <div className="text-white/80">BMR = {bmrSteps}</div>
          <div className="text-white/60 text-base">    = {bmrParts}</div>
          <div className="text-white font-bold mt-1">BMR = {bmr.toLocaleString()} cal/day</div>
          <div className="border-t border-white/[0.08] mt-2 pt-2">
            <div className="text-white/60 text-base">Activity multiplier: {activityMult} (moderate — exercise 4-5×/week)</div>
            <div className="text-white font-bold">TDEE = {bmr.toLocaleString()} × {activityMult} = {tdee.toLocaleString()} cal/day</div>
          </div>
        </CalcBox>
        <p>You burn approximately <strong className="text-white">{tdee.toLocaleString()} calories per day</strong>.</p>
        <SourceLink label="Mifflin et al., 1990 (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/2305711/" />
      </Step>

      {/* Step 2: Calorie Target */}
      <Step num="2" title="Your Calorie Target">
        {isMuscleBuild ? (
          <>
            <p>For muscle growth, a modest <strong className="text-white">300 cal/day surplus</strong> provides energy for muscle protein synthesis without excessive fat gain.</p>
            <CalcBox>
              <div>{tdee.toLocaleString()} + 300 surplus = <strong className="text-white">{calTarget.toLocaleString()} cal/day</strong></div>
            </CalcBox>
          </>
        ) : (
          <>
            <p>A <strong className="text-white">{deficit} cal/day deficit</strong> produces ~{lbsPerWeek} lb fat loss per week.</p>
            <CalcBox>
              <div>{tdee.toLocaleString()} − {deficit} = {calTarget.toLocaleString()}, rounded to <strong className="text-white">{(s.calories || calTarget).toLocaleString()} cal/day</strong></div>
            </CalcBox>
            <p>3,500 calories ≈ 1 pound of fat. At {deficit} cal/day × 7 = {(deficit * 7).toLocaleString()} cal/week ÷ 3,500 = ~{lbsPerWeek} lb/week.</p>
            <SourceLink label="Hall et al., 2011 (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/21872751/" />
          </>
        )}
      </Step>

      {/* Step 3: Protein */}
      <Step num="3" title="Your Protein Target">
        {isMuscleBuild ? (
          <p>Building muscle requires <strong className="text-white">1.0g protein per pound</strong> of body weight to maximize muscle protein synthesis.</p>
        ) : (
          <p>During a calorie deficit, <strong className="text-white">0.7–1.0g protein per pound</strong> of body weight preserves muscle mass.</p>
        )}
        <CalcBox>
          <div>{wt} lbs × {proteinRatio}g/lb = <strong className="text-white">{protein}g/day</strong></div>
        </CalcBox>
        <p>Your current protein target: <strong className="text-white">{s.protein || protein}g/day</strong>.</p>
        <SourceLink label="Morton et al., 2018 (PubMed)" url="https://pubmed.ncbi.nlm.nih.gov/28698222/" />
      </Step>

      {/* Step 4: Water */}
      <Step num="4" title="Your Water Target">
        <p>General guideline: half your body weight in ounces.</p>
        <CalcBox>
          <div>{wt} ÷ 2 = {halfBodyWeightOz} oz → rounded to <strong className="text-white">{waterOz} oz ({waterBottles} × 32oz bottles)</strong></div>
        </CalcBox>
        <p>Adequate hydration supports blood pressure regulation, reduces false hunger signals, and improves workout performance.</p>
        <SourceLink label="Mayo Clinic — Hydration Guidelines" url="https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256" />
      </Step>

      {/* Step 5: Timeline */}
      {!isMuscleBuild && weeksToGoal && (
        <Step num="5" title="Your Timeline">
          <CalcBox>
            <div className="text-white/70">Weight to lose: {lbsToLose} lbs</div>
            <div className="text-white/70">Rate: ~{lbsPerWeek} lb/week ({pace} pace)</div>
            <div className="text-white/70">Estimated: {Math.floor(weeksToGoal / 4)}–{Math.ceil(weeksToGoal / 4) + 1} months</div>
            <div className="text-white font-bold mt-1">Target date: approximately {estDate}</div>
          </CalcBox>
        </Step>
      )}

      {/* Verify box */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-4 mt-2">
        <div className="text-base font-semibold text-white/50 mb-2">Verify these numbers independently:</div>
        <div className="space-y-1">
          <SourceLink label="Calorie calculator (calculator.net)" url="https://www.calculator.net/calorie-calculator.html" />
          <div></div>
          <SourceLink label="Protein intake guide (examine.com)" url="https://examine.com/guides/protein-intake/" />
        </div>
        <p className="text-base text-white/30 mt-3 leading-relaxed">
          These numbers are calculated using standard clinical formulas and are estimates
          based on population averages. Adjust in Settings if your results differ.
        </p>
      </div>
    </div>
  );
}
