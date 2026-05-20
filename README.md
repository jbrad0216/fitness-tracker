# Jason's Fitness Tracker

A Progressive Web App for tracking nutrition, workouts, water, weight, and meditation.

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

Open http://localhost:5173 on your computer to test.

## Deploy to Vercel (Free)

1. Push this project to a GitHub repository
2. Go to https://vercel.com and sign in with GitHub
3. Click "Add New Project" → import your repo
4. Click "Deploy" (Vercel auto-detects Vite)
5. Get your live URL in ~60 seconds

## Install on iPhone

1. Open your Vercel URL in **Safari**
2. Tap the **Share button** (square with arrow)
3. Tap **"Add to Home Screen"**
4. Name it "Tracker" → tap **Add**

## Features

- Food logging with quick-add presets and custom entries
- Workout tracking with A/B strength day rotation
- Progressive overload tracking (shows last weight for each exercise)
- Water intake tracking (3x 32oz bottles)
- Wednesday weigh-in system with trend chart
- TM meditation tracking
- Data export/import (JSON backup)
- Works offline (PWA with service worker)

## Daily Targets

- Calories: 2,400
- Protein: 160g
- Water: 100oz (3x 32oz bottles)
- Sodium: under 2,000mg

## Tech Stack

- React + Vite
- Tailwind CSS
- vite-plugin-pwa (service worker + manifest)
- localStorage for data persistence
