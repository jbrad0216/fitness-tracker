# CLAUDE.md — Fitness Tracker Project Context

## Project Overview
Personal fitness tracking PWA for Jason. React + Vite + Tailwind CSS. Deployed on Vercel via GitHub (auto-deploys on push to main).

## Owner Profile
- Jason, 48, 6'1", goal: 222.6 lbs → 200 lbs
- High blood pressure — cardiovascular health is priority #1
- Daily targets: 2,400 cal, 160g protein, 100oz water, sodium under 2,000mg
- Wednesday morning weigh-ins only
- Runs 4-5x/week, strength Mon/Wed/Fri (A/B alternation), long run Saturday, rest Sunday

## Tech Stack
- React 19 + Vite
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- vite-plugin-pwa for offline/service worker/manifest
- localStorage for all data (no backend)
- Deployed to Vercel (auto-deploys from main branch)

## Project Structure
```
src/
  main.jsx              # Entry point
  index.css             # Tailwind imports + CSS variables
  App.jsx               # Main app shell, routing, state composition
  data/
    constants.js        # Targets, quick foods, workout templates, date helpers
    storage.js          # localStorage wrapper with export/import
  components/
    UI.jsx              # Shared components (Toast, ProgressRing, WaterBottles, Card, Button, Input, etc.)
    BottomNav.jsx       # Fixed bottom tab navigation
    DashboardTab.jsx    # Today's overview (rings, water, toggles, food summary)
    FoodTab.jsx         # Food logging with quick-add presets and custom entry
    GymTab.jsx          # Workout logging with prescribed exercises and manual entry
    StatsTab.jsx        # Weight chart, lift progress, weigh-in history, data export
  hooks/
    useDaily.js         # Daily data state (food, water, exercises, meditation, run)
    useAppData.js       # Weigh-ins, lift log, custom foods hooks
public/
  icon-192.png          # PWA icon
  icon-512.png          # PWA icon
  favicon.svg           # Browser favicon
```

## Key Design Decisions
- Dark theme (#0f1117 background) — used at 5:30am in the gym
- Mobile-first (375-430px iPhone viewport)
- Bottom tab nav (Today, Food, Gym, Stats)
- All data in localStorage with `ft_` prefix
- Workout A/B rotation based on week number (A/B/A → B/A/B)
- Progress rings for daily calories, protein, water
- Toast notifications for feedback on actions

## Commands
```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
```

## Git Workflow
- Push to `main` branch triggers Vercel auto-deploy
- Commit messages should be descriptive of what changed
- Test locally with `npm run dev` before pushing

## Style Guide
- Use Tailwind utility classes (not custom CSS unless necessary)
- CSS variables defined in index.css for theme colors
- Component files export named functions (not default)
- Hooks in hooks/ directory, shared UI in components/UI.jsx
- Keep components focused — one tab per file

## Data Storage Keys (localStorage, prefix: ft_)
- `ft_daily-YYYY-MM-DD` — daily log (food, water, exercises, meditation, ranMiles)
- `ft_weigh-ins` — array of {date, weight} objects
- `ft_lift-log` — object keyed by exercise slug, stores last weight/sets/reps/date
- `ft_custom-foods` — user-created food presets

## Common Change Patterns
- **Add a new quick food preset**: Edit QUICK_FOODS array in `src/data/constants.js`
- **Add a new exercise**: Edit WORKOUT_A or WORKOUT_B in `src/data/constants.js`
- **Change daily targets**: Edit TARGETS object in `src/data/constants.js`
- **Add a new tab**: Create component in `src/components/`, add to App.jsx routing and BottomNav.jsx
- **Add a new tracked metric**: Add to daily data shape in `useDaily.js`, update DashboardTab
- **Style changes**: Theme colors are CSS variables in `src/index.css`

## Important Constraints
- No backend — everything runs client-side with localStorage
- Must remain installable as PWA (manifest + service worker via vite-plugin-pwa)
- Must work offline after first load
- Large touch targets (min 44px) for gym use
- Keep the dark theme — the app is used pre-dawn and in gyms
- Wednesday weigh-ins only (don't change this logic)
- Workout A/B alternation pattern must stay consistent week over week
