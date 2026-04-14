# Workout & Protein Tracker

A Progressive Web App for tracking daily workouts and protein intake with multi-user support and real-time sync across devices.

**[Launch App](https://dwonng.github.io/workout-tracker/month-workout-protein-tracker.html)**

## Features

- **Daily/Weekly/Monthly views** — calendar-based navigation with workout and protein stats
- **Workout tracking** — configurable plan with lifts and cardio, checkboxes per day, weight/reps logging
- **Protein logging** — manual entry or search via USDA FoodData Central API, daily goal tracking
- **Multi-user PIN lock** — PBKDF2-hashed PINs with invite code system for new accounts
- **Firebase Realtime Database** — live sync across devices with offline localStorage fallback
- **PWA** — installable on mobile with home screen icon

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no build step)
- Firebase Realtime Database (client SDK)
- Web Crypto API (PBKDF2, SHA-256)
- Playwright for end-to-end testing
- GitHub Actions CI

## Project Structure

```
app/
  state.js        # Global state, constants, utilities
  storage.js      # localStorage read/write, data migration
  firebase.js     # Firebase init, sync, push/pull
  food-data.js    # Local food database, USDA API search
  tracking.js     # Workout checkboxes, weekly stats
  plan.js         # Workout plan editor
  food-modal.js   # Food search modal UI
  renderers.js    # Day/week/month view rendering
  pin.js          # PIN lock screen, auth, account management
  main.js         # App init, event wiring, boot
tests/
  helpers.ts      # Shared test utilities and constants
  pin-lock.spec.ts
  layout.spec.ts
  views-nav.spec.ts
  daily-tracking.spec.ts
  food-log.spec.ts
  plan-menu-monthly.spec.ts
```

## Getting Started

1. Open `month-workout-protein-tracker.html` in a browser, or serve locally:
   ```bash
   npx serve .
   ```
2. Create an account with a 4-digit PIN and the invite code
3. Start logging workouts and food

## Running Tests

```bash
npm install
npx playwright install chromium
npx playwright test
```

## License

MIT
