# TASKS.md — Overnight Improvement Run

Work through these tasks IN ORDER. After completing each numbered task:
1. Run `npm run build` to verify no errors
2. Test that the app still loads with `npm run dev`
3. Commit with a descriptive message
4. Push to GitHub: `git push origin main`
5. Move to the next task

If a task causes build errors, fix them before moving on. Never leave the app in a broken state.

---

## Task 1: Add a Settings/Profile Page

Create a new "Settings" tab (gear icon ⚙️) that replaces nothing — add it as a 5th tab or put it behind a gear icon on the Stats page.

The settings page should let the user edit:
- **Name** (currently hardcoded as "Jason")
- **Age** (currently 48)
- **Height** (currently 6'1")
- **Starting weight** (currently 221)
- **Goal weight** (currently 200)
- **Daily calorie target** (currently 2400)
- **Daily protein target** (currently 160g)
- **Water bottle target** (currently 3 bottles)
- **Sodium target** (currently 2000mg)

Save all settings to localStorage with key `ft_settings`. Load settings from localStorage throughout the app instead of hardcoded constants. If no settings exist, use the current hardcoded values as defaults.

Add a "Reset to Defaults" button.

---

## Task 2: Editable Workout Templates

On the Settings page (or a sub-section), let the user:
- **View Workout A and Workout B exercises**
- **Edit exercise name, default weight, sets, reps** for each exercise
- **Add new exercises** to either workout
- **Remove exercises** from either workout
- **Reorder exercises** (move up/move down buttons)

Save custom workout templates to localStorage key `ft_workout-templates`.
Fall back to the default WORKOUT_A and WORKOUT_B from constants.js if no custom templates exist.

The Gym tab should read from the saved templates instead of hardcoded arrays.

---

## Task 3: Improve the Dashboard Layout and Visual Hierarchy

The dashboard (Today tab) should feel like opening a fitness app, not a data dump:
- Make the progress rings larger and more prominent
- Add a greeting based on time of day ("Good morning", "Good afternoon", "Good evening")
- Show a daily motivational summary like "You've logged 1,800 of 2,400 calories"
- Add visual distinction between completed items (green checkmarks) and pending items
- Make the water bottles larger and easier to tap on mobile
- Add a subtle animation when values change (ring fills, numbers update)

---

## Task 4: Improve Food Logging UX

- Add a **search/filter** to the Quick Add list so the user can type to filter meals
- Group Quick Add items by category (Breakfast, Meals, Snacks) with section headers
- After adding a food item, show a brief **undo** option (5 seconds) in case of accidental tap
- Make the delete button on food entries require a **swipe or long-press** to prevent accidental deletes
- Show the **time** each food was logged (e.g., "8:30 AM")
- Add a **"Copy yesterday's meals"** button that loads the previous day's food log

---

## Task 5: Improve Gym Tab UX

- Show a **timer** between sets (60-90 second countdown, user can start/stop)
- When logging an exercise, **pre-fill the weight from last session** and highlight if the user is increasing weight (progressive overload indicator)
- Add a **"Complete Workout"** button that marks all remaining exercises as done with their target weights
- Show a **workout duration** timer that starts when the first exercise is logged
- Add visual feedback: green highlight when weight increases vs last session, yellow when same, red if decreased
- For non-strength days, suggest specific stretches or mobility exercises

---

## Task 6: Improve Stats Tab

- Make the weight chart **interactive** — tap a point to see the exact weight and date
- Add a **projected goal date** based on current rate of loss
- Add a **weekly average** calories and protein summary
- Add a **streak counter** — consecutive days with food logged
- Add a **personal records** section showing heaviest lift for each exercise
- Make the lift progress section show a **mini chart** or trend arrow for each exercise

---

## Task 7: Add an Onboarding Flow

When the app is opened for the first time (no settings in localStorage):
- Show a welcome screen: "Welcome to Fitness Tracker"
- Walk through 3-4 screens:
  1. Enter your name, age, height
  2. Enter your starting weight and goal weight
  3. Enter daily calorie and protein targets
  4. Brief explanation of workout A/B and how to customize
- Save all inputs to settings
- Then show the normal dashboard

If settings already exist, skip onboarding entirely.

---

## Task 8: Improve Data Persistence and Safety

- Add an **auto-backup** — every time data changes, save a copy to `ft_backup-YYYY-MM-DD`
- Keep the last 7 days of backups, auto-delete older ones
- Add a **"Restore from backup"** option in settings showing available backup dates
- Add a clear warning on the Settings page: "Your data is stored locally on this device. Use Export to save a backup."
- Make the Export button more prominent — move it to settings and add a reminder if the user hasn't exported in 7+ days

---

## Task 9: Polish and Micro-interactions

- Add **haptic feedback** on button taps (navigator.vibrate if supported)
- Add smooth **page transitions** between tabs (subtle slide or fade)
- Add a **pull-to-refresh** gesture on the dashboard
- Make all cards have a subtle **press animation** (scale down slightly on tap)
- Add **loading skeletons** instead of blank screens while data loads
- Ensure all touch targets are minimum 44px
- Test and fix any overflow or scroll issues on small screens (iPhone SE)
- Add proper **error boundaries** so the app doesn't white-screen on errors

---

## Task 10: Performance and PWA Polish

- Ensure the **service worker** caches everything properly for offline use
- Add an **"Update available"** toast when a new version is deployed
- Optimize re-renders — make sure the rings don't re-render when typing in forms
- Add `<meta>` tags for proper iOS status bar styling
- Ensure the app works in **landscape orientation** without breaking
- Test the **Add to Home Screen** flow works correctly
- Add a proper **app loading screen** (splash screen) instead of "Loading..."

---

## General Guidelines for All Tasks

- Maintain the dark theme throughout (#0f1117 background)
- Keep mobile-first design — this is used on an iPhone at 5:30am in the gym
- Use Tailwind utility classes, not custom CSS
- Keep the same color palette: blue (#3b82f6), green (#22c55e), orange (#f59e0b), red (#ef4444), purple (#a855f7)
- All new data should use localStorage with the `ft_` prefix
- Commit after EACH task, not in bulk
- If any task breaks the build, fix it before committing
- Keep the code organized — new components in components/, new hooks in hooks/
- Update CLAUDE.md after each major feature addition to keep it current