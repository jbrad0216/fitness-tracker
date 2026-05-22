# CLAUDE.md — Fitness Tracker Project Context

## Project Overview
Personal fitness tracking PWA for Jason. React + Vite + Tailwind CSS. Deployed on Vercel via GitHub (auto-deploys on push to main).

**Phase 5 (current)**: Workout intelligence, bug fixes, and science explanations — exercise swap UI, focus area workout generator, 12-week plan view, barcode scanner fix, scheduled meals, goal banner, USDA food accuracy fix, chat logging fixes, skip/reschedule workouts, About My Plan science section.

## Owner Profile
- Jason, 48, 6'1", goal: 222.6 lbs → 200 lbs
- High blood pressure — cardiovascular health is priority #1
- Daily targets: 2,400 cal, 160g protein, 100oz water, sodium under 2,000mg
- Wednesday morning weigh-ins only
- Runs 4-5x/week, strength Mon/Wed/Fri (A/B alternation), long run Saturday, rest Sunday
- App used at 5:30am in the gym — needs large touch targets and dark theme

## Tech Stack
- React 19 + Vite
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- vite-plugin-pwa for offline/service worker/manifest
- html5-qrcode for barcode scanning
- localStorage for all data (no backend)
- Deployed to Vercel (auto-deploys from main branch)

## Project Structure
```
src/
  main.jsx              # Entry point
  index.css             # Tailwind imports + CSS variables + light mode
  App.jsx               # Main app shell, 4-tab routing, swipe navigation, Apple Health URL params
  data/
    constants.js        # Targets, quick foods, workout templates, date helpers
    storage.js          # localStorage wrapper (auto-adds ft_ prefix) with export/import/backup
    exercises.js        # Exercise library: descriptions, YouTube URLs, muscle groups, SVGs
  components/
    UI.jsx              # Shared components (Toast, ProgressRing, WaterBottles, Toggle, OfflineIndicator, etc.)
    BottomNav.jsx       # Fixed bottom tab navigation — 4 tabs: Home, Log, Gym, More
    DashboardTab.jsx    # Home tab: overall score ring, quick stats, food log with swipe-to-delete, reminders
    ChatInterface.jsx   # Log tab: full-screen AI chat with food confirm cards, recent foods, barcode lookup
    GymTab.jsx          # Gym tab: equipment setup, exercise cards with swap/why, rest timer, skip/reschedule
    MoreTab.jsx         # More tab: sub-pages for Stats, Journey, Plan, Science, Settings
    WorkoutPlanTab.jsx  # 12-week plan view with phases and run progression
    ScienceTab.jsx      # About My Plan: science explanations with research links, editable targets
    StatsTab.jsx        # Weight chart, lift progress, weigh-in history
    JourneyTab.jsx      # Timeline, milestones, monthly calendar, streaks
    SettingsTab.jsx     # Profile, targets, simplified data backup, Apple Health, workout templates
    OnboardingFlow.jsx  # First-time setup (5 steps, no cloud wizard)
    BarcodeScanner.jsx  # html5-qrcode camera scanner for packaged foods
  hooks/
    useDaily.js         # Daily data state with validation (food, water, exercises, meditation, run)
    useAppData.js       # Weigh-ins, lift log, custom foods hooks with validation
    useSettings.js      # App settings (profile, targets, theme)
    useWorkoutTemplates.js  # A/B workout template management
public/
  icon-192.png          # PWA icon
  icon-512.png          # PWA icon
  favicon.svg           # Browser favicon
```

## Navigation Structure (Phase 5)
- **Home** (🏠) — DashboardTab: goal banner, goals checklist, progress ring, stats, meal-grouped food log, scheduled meals, reminders
- **Log** (➕) — ChatInterface embedded: AI-powered logging; auto-focuses input on tab open
- **Gym** (🏋️) — GymTab: weekly calendar, exercise cards with swap/why/3×12 reasoning, customize workout, skip/reschedule
- **More** (···) — MoreTab: Stats, Journey, Full Plan, About My Plan, Settings

Stats, Journey, Full Plan, About My Plan, and Settings are accessed via More menu.

## Key Design Decisions
- Dark theme (#0f1117 background) — used at 5:30am in the gym; light mode available in Settings
- Mobile-first (375-430px iPhone viewport), safe area insets for notch/home indicator
- **4-tab bottom nav** (Home, Log, Gym, More) — replaces the old 6-tab nav
- Swipe left/right gesture to switch between the 4 main tabs
- All data in localStorage with `ft_` prefix (storage.js auto-adds this)
- AI chat (Log tab) is the PRIMARY way to log everything — food, run, water, weight, exercise
- Food confirmation cards (not text bubbles) for food searches; meal category selector on each card
- Recent foods memory (ft_recent-foods) — fuzzy match before API search
- Barcode scanner uses html5-qrcode + Open Food Facts API
- Workout A/B rotation based on week number (A/B/A → B/A/B)
- Home tab shows: 4-item daily goals checklist → progress ring → stats → food log grouped by meal
- Food items: swipe-left OR tap × button to delete; undo toast appears for 5 seconds
- Food has `meal` field (breakfast/lunch/snack/dinner) auto-assigned by time of day; editable in chat
- Time-based dismissible reminder banners on Home tab
- Apple Health integration via URL params (?steps=X&activeCal=Y)
- Equipment setup screen in GymTab (saved to ft_equipment-setup)
- Weekly workout calendar row at top of Gym tab (7 day circles, tap for detail)
- Exercise cards have "Why this exercise?" section, 3×12 reasoning, and swap UI (alternatives from exercises.js)
- Focus area workout customizer: select 2-3 body parts → generate 4-5 exercise custom workout
- Skip/reschedule workout: per-week ft_schedule-overrides-{year}-{weekNum} storage
- Goal banner on home tab: progress bar, pace indicator, weeks remaining (green/amber/red)
- Scheduled meals: ft_scheduled-meals, auto-appear on dashboard for 1-tap logging
- Log Again button on each food item in dashboard
- Food search: USDA nutrientNumber 1008 for kcal, prefer branded, fallback to Open Food Facts
- Chat: delete food by name, food keywords checked before status queries
- ErrorBoundary around each tab so one crash doesn't kill the app

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
- Minimum touch target: 48px. Minimum body text: 16px. Minimum caption/label: 12px.

## Data Storage Keys (localStorage, prefix: ft_)
NOTE: The `load(key, fallback)` and `save(key, val)` functions in storage.js auto-add the `ft_` prefix.
DO NOT include `ft_` in the key argument to load/save. Use direct localStorage for keys not managed by storage.js.

- `ft_daily-YYYY-MM-DD` — daily log (food, water, exercises, meditation, ranMiles)
- `ft_weigh-ins` — array of {date, weight} objects
- `ft_lift-log` — object keyed by exercise slug, stores last weight/sets/reps/date
- `ft_custom-foods` — user-created food presets
- `ft_settings` — app settings (profile, targets, theme)
- `ft_chat-YYYY-MM-DD` — daily chat messages (filtered, no pending food cards)
- `ft_recent-foods` — last 50 logged food items for quick re-logging
- `ft_last-export` — date of last manual data export
- `ft_backup-YYYY-MM-DD` — auto-backup snapshots (last 7 days kept)
- `ft_scheduled-meals` — array of recurring meal objects with day-of-week schedule
- `ft_custom-workout-YYYY-MM-DD` — one-off custom workout from focus area generator
- `ft_exercise-swaps-YYYY-MM-DD` — daily exercise swaps (original name → replacement)
- `ft_schedule-overrides-{year}-{weekNum}` — workout skip/reschedule overrides for the week
- `ft_dismissed-reminders-YYYY-MM-DD` — reminder IDs dismissed today
- `ft_equipment-setup` — gym equipment preferences (full/home/limited)
- `ft_apple-health-today` — Apple Health data from URL params (steps, activeCal, date)
- `ft_auto-backup` — 'on' or 'off' setting for auto-backup

## Common Change Patterns
- **Add a new exercise**: Edit WORKOUT_A or WORKOUT_B in `src/data/constants.js`
- **Change daily targets**: Edit TARGETS object in `src/data/constants.js`
- **Add reminder**: Edit `getActiveReminder()` in DashboardTab.jsx
- **Add chat command**: Edit `parseMessage()` in ChatInterface.jsx
- **Style changes**: Theme colors are CSS variables in `src/index.css`
- **Add Stats/Journey sub-feature**: Modify StatsTab.jsx or JourneyTab.jsx
- **Food meal auto-assign logic**: Edit `getMealFromTime()` in useDaily.js
- **Weekly calendar schedule logic**: Edit `getWeekDays()` in GymTab.jsx

## Important Constraints
- No backend — everything runs client-side with localStorage
- Must remain installable as PWA (manifest + service worker via vite-plugin-pwa)
- Must work offline after first load
- Large touch targets (min 48px) for gym use at 5:30am
- Keep the dark theme — the app is used pre-dawn and in gyms
- Wednesday weigh-ins only (don't change this logic)
- Workout A/B alternation pattern must stay consistent week over week
- No cloud storage wizard — just export/import buttons in Settings
- Food logging happens via AI chat (Log tab), not a separate food tab
