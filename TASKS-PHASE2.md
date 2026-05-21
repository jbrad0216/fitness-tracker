# TASKS-PHASE2.md — Overnight Improvement Run (Phase 2)

Work through these tasks IN ORDER. After completing each numbered task:
1. Run `npm run build` to verify no errors
2. If the build fails, FIX THE ERRORS before moving on. Do not leave the app broken.
3. Commit with a descriptive message
4. Push to GitHub: `git push origin main`
5. Print: ===== COMPLETED TASK [number]: [task name] =====
6. Move to the next task

If anything breaks, fix it immediately. Never leave the app in a non-building state.

---

## Task 1: Cloud Storage Setup Wizard

Add a cloud storage configuration to the onboarding flow and settings page.

**Implementation approach:** Since this is a client-side PWA with no backend, we cannot do direct OAuth to Google Drive/Box/OneDrive from the client. Instead, implement this:

1. During onboarding (and editable in Settings), show a "Where should your data be saved?" screen with options:
   - **Google Drive** — explain that data will be exported as a JSON file to Google Drive. Use the Google Drive Picker API or simply generate a downloadable JSON that the user saves to their Google Drive folder.
   - **iCloud** — explain the user can save exports to their iCloud Drive (Files app on iPhone)
   - **Box** — same export-to-file approach
   - **OneDrive** — same export-to-file approach  
   - **Device Only** — data stays in localStorage. Show a clear message: "Your data is stored only on this device in your browser's local storage. Clearing browser data will delete it."

2. Add an **auto-export reminder** — if the user picks a cloud option, remind them weekly to export and save to their chosen cloud service (show a banner at the top of the dashboard).

3. Add a one-tap **"Export to Cloud"** button on the dashboard that generates the JSON file and triggers a download/share. On iOS Safari, this opens the share sheet where the user can save to iCloud Drive, Google Drive app, Box app, etc.

4. Add an **"Import from file"** option that lets the user pick a JSON file to restore data.

5. Store the user's preference in `ft_settings` under a `cloudStorage` key.

---

## Task 2: Food Database Search with Nutrition Auto-fill

Replace the manual calorie/protein entry with a searchable food database.

**Implementation:**

1. Integrate the **USDA FoodData Central API** (free, no API key required for basic use):
   - Endpoint: `https://api.nal.usda.gov/fdc/v1/foods/search?query=FOOD_NAME&api_key=DEMO_KEY&pageSize=10`
   - The DEMO_KEY works for reasonable usage
   
2. When the user types a food name in the custom entry form:
   - After they stop typing for 500ms (debounce), search the USDA API
   - Show a dropdown of matching foods with their calories, protein, fat, carbs, and fiber per serving
   - When the user taps a result, auto-fill ALL nutrition fields
   - Show serving size options if available

3. Also try the **Open Food Facts API** as a fallback:
   - Endpoint: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=FOOD_NAME&json=1&page_size=10`
   - This has better coverage of branded/packaged foods

4. Keep the existing Quick Add presets — they should still work as one-tap options.

5. Add a **"Save to My Foods"** button when using the search, so the user can save frequently eaten foods to their personal preset list (stored in `ft_custom-foods`).

6. Show nutrition breakdown for each food entry: calories, protein, fat, carbs, fiber (not just cal + protein).

7. Update the daily totals on the dashboard and food tab to also show fat and carbs if available.

---

## Task 3: Mobile-Optimized UI Overhaul

The app is used on iPhone Safari. Make it feel native.

**Implementation:**

1. **Increase all font sizes** — body text should be minimum 16px (prevents iOS auto-zoom on input focus). Headers 20-24px. Sub-text 13-14px.

2. **Increase all touch targets** — every button and tappable element must be minimum 48px tall. The bottom nav icons should be larger.

3. **Input fields should be tall** — minimum 48px height, 16px font size. Add proper padding.

4. **Use iOS-native-feeling components:**
   - Toggle switches instead of checkboxes (for meditation, etc.)
   - Segmented controls for tab-like selections within pages
   - Bottom sheets / slide-up modals instead of inline forms where appropriate
   - Rounded corners (16px border-radius on cards, 12px on buttons)

5. **Fix the bottom nav:**
   - Make it taller (at least 60px content area + safe area)
   - Larger icons (24px)
   - Labels should be 12px
   - Active tab should have a clear visual indicator (filled icon or colored background pill)

6. **Add safe area handling:**
   - `padding-top: env(safe-area-inset-top)` for the header (notch/Dynamic Island)
   - `padding-bottom: env(safe-area-inset-bottom)` for the bottom nav
   - Ensure nothing is hidden behind the notch or home indicator

7. **Improve the food log cards** — make them wider, with more padding, easier to read and tap.

8. **Make the progress rings larger** on the dashboard — at least 90-100px diameter.

9. **Test at 375px width** (iPhone SE) and 430px width (iPhone 15 Pro Max). Nothing should overflow or require horizontal scrolling.

10. **Add viewport meta tag** if not present: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`

---

## Task 4: Exercise Library with Images and Videos

Each exercise in the workout should have visual guidance.

**Implementation:**

1. Create an exercise library data file (`src/data/exercises.js`) that maps exercise names to:
   - A **description** of proper form (2-3 sentences)
   - A **YouTube video URL** for a reputable tutorial (search for short-form exercise demos from channels like Jeff Nippard, AthleanX, or similar). Use well-known, stable URLs.
   - A **muscle group** tag (chest, back, legs, shoulders, core)
   - An **illustration** — use a simple SVG stick-figure or icon showing the movement pattern. Create these as inline SVGs.

2. On the Gym tab, each exercise should show:
   - The exercise name
   - The muscle group tag (small colored badge)
   - A **"How to" button** or info icon that expands to show:
     - The form description
     - A thumbnail/link that opens the YouTube video
     - The SVG illustration of the movement

3. For the default exercises, include these mappings:
   - Goblet Squat → legs/quads
   - DB Bench Press → chest
   - Lat Pulldown → back
   - DB Row → back
   - DB Romanian Deadlift → hamstrings/glutes
   - Overhead Press → shoulders
   - DB Reverse Lunge → legs/glutes

4. When users add custom exercises in Settings, let them optionally add a YouTube URL and select a muscle group.

5. Consider using the **ExRx.net** exercise directory links as references (e.g., `https://exrx.net/WeightExercises/Quadriceps/DBGobletSquat`).

---

## Task 5: AI Chat Interface for Natural Language Logging

Add a chat-style interface where the user can type natural language to log food and exercise.

**Implementation approach:** Since we cannot embed API keys in a client-side app, use **pattern matching and a rules engine** instead of a real AI API:

1. Add a **chat bubble icon** (floating action button) on the dashboard that opens a chat interface.

2. The chat interface should:
   - Have a text input at the bottom
   - Show a conversation thread above
   - Parse common patterns and extract data

3. **Build a natural language parser** that handles patterns like:
   - "I ran 2 miles today" → logs 2 miles on the run tracker
   - "ate a mcdonalds cheeseburger for lunch" → searches the food database (Task 2) for "mcdonalds cheeseburger" and logs the top result
   - "drank 2 bottles of water" → sets water to 2
   - "did my meditation" → toggles meditation on
   - "bench pressed 35 lbs 3x12" → logs exercise with weight/sets/reps
   - "weight is 220.5" → logs weigh-in
   - "what are my calories today" → responds with current totals
   - "how much protein do I have left" → responds with remaining protein

4. **Parser rules:**
   - Look for keywords: "ran", "run", "walked", "ate", "eat", "had", "drank", "water", "bench", "squat", "pressed", "weight", "weigh", "meditation", "meditated"
   - Extract numbers with regex: miles, lbs, sets×reps patterns
   - For food, extract the food name and search the USDA/OpenFoodFacts API
   - Respond with a confirmation: "Logged: 2 mile run ✓" or "Logged: McDonald's Cheeseburger (300 cal, 15g protein) ✓"

5. If the parser can't understand the input, respond with: "I didn't catch that. Try something like 'I ran 2 miles' or 'ate chicken and rice for lunch'"

6. Store chat history for the current day in `ft_chat-{date}`.

---

## Task 6: Progress Journey Visualization

Create a compelling visual progress tracker that shows the user's full journey.

**Implementation:**

1. Add a **"Journey" section** to the Stats tab (or make it its own tab) with:

2. **Week-by-week timeline:**
   - Show which week number the user is on (e.g., "Week 3 of 19")
   - Show a horizontal progress bar from Week 1 to Week 19 (based on ~1.1 lbs/week pace)
   - Current week should be highlighted
   - Completed weeks get a checkmark

3. **Projected completion date:**
   - Calculate based on actual average weekly loss rate
   - Show: "At your current pace, you'll reach 200 lbs by [date]"
   - Update this weekly based on real data

4. **Milestone markers** on the progress bar:
   - 5 lbs lost (216 lbs)
   - 10 lbs lost (211 lbs)
   - Halfway (210.5 lbs)
   - 15 lbs lost (206 lbs)
   - Goal (200 lbs)

5. **Daily completion badges:**
   - Track if the user logged food, completed a workout, hit water target, and did meditation
   - Show a calendar-style grid of the current month with colored dots:
     - Green dot: fully logged day (all 4 items)
     - Yellow dot: partially logged
     - No dot: nothing logged
   - Show current streak: "7-day logging streak 🔥"

6. **Celebration moments:**
   - When a day is fully logged, show a brief celebration animation (confetti, checkmark burst, or similar)
   - When a milestone is hit, show a larger celebration
   - When a new personal record is set on a lift, highlight it
   - Weekly summary pop-up on Sundays: "This week: -1.2 lbs, 5/5 workouts, avg 2,350 cal"

7. **Positive reinforcement messages** that rotate:
   - "Consistency beats perfection"
   - "3 weeks in — this is becoming a habit"
   - "You've logged 15 out of the last 21 days"
   - Base these on actual data, not random

---

## Task 7: General Mobile UX Improvements

Make every interaction feel smooth and intentional.

1. **Swipe navigation** between tabs (optional but nice) — swipe left/right to switch tabs.

2. **Pull-to-refresh** on the dashboard — refreshes the date and recalculates totals.

3. **Smooth number animations** — when calorie/protein totals change, animate the number counting up/down.

4. **Better empty states** — when no food is logged, show a friendly illustration or message with a CTA button instead of just "Empty".

5. **Quick-log shortcuts on the dashboard:**
   - A row of 3-4 circular quick-action buttons: "Log Food", "Log Water", "Log Run", "Log Weight"
   - These jump directly to the relevant input

6. **Notification-style reminders** (in-app, not push notifications):
   - If it's 2pm and no afternoon snack is logged, show a banner: "Time for your protein snack?"
   - If it's Wednesday and no weigh-in, show a prompt
   - If water is at 0 bottles by noon, nudge

7. **Dark mode should be default** but add a light mode option in settings for outdoor/bright-light use.

8. **Haptic feedback** — call `navigator.vibrate(10)` on button taps where supported.

9. **Landscape mode** — ensure the app doesn't break in landscape but it's OK to show a "rotate to portrait for best experience" message.

---

## Task 8: Error Handling and Robustness

1. **Add React error boundaries** around each tab component so one tab crashing doesn't kill the whole app.

2. **Add try-catch** around all localStorage operations.

3. **Add data validation** — if localStorage data is corrupted, reset to defaults instead of crashing.

4. **Add a "Report Issue" link** in settings that opens a pre-filled GitHub issue (or just shows instructions to report bugs).

5. **Handle offline/online transitions gracefully** — show a small "You're offline" indicator when disconnected.

6. **Fix any console warnings or errors** that exist in the current build.

7. **Run npm run build and fix ALL warnings**, not just errors.

---

## General Guidelines for All Tasks

- Maintain the dark theme throughout (#0f1117 background)
- Mobile-first: this is used on iPhone Safari. Test at 375px and 430px widths.
- Use Tailwind utility classes, not custom CSS
- Keep the color palette: blue (#3b82f6), green (#22c55e), orange (#f59e0b), red (#ef4444), purple (#a855f7)
- All data uses localStorage with the `ft_` prefix
- Commit after EACH task
- If ANY task causes build errors, fix them before committing
- Keep code organized: components in components/, hooks in hooks/, data in data/
- Update CLAUDE.md after completing all tasks to reflect new features
- When done with everything, print: ===== ALL TASKS COMPLETE =====
