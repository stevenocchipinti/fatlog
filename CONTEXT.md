# Fatlog

Fatlog tracks body and diet observations over time so changes can be reviewed against dates.

## Language

**Waist measurement**:
The circumference of the user's waist, recorded in centimeters as part of a body metrics check-in.
_Avoid_: Waste measurement

**Food group**:
A broad category of food used to describe diet patterns over time, rather than an individual food, meal, calorie count, or macro.
_Avoid_: Meal, specific food, macro

**Diet rule**:
A possibly open-ended date range during which a food group is intended to be part of the user's regular diet.
_Avoid_: Meal plan, diet entry, diet plan period

**Diet exception**:
A dated observation that the user ate from a food group in a way that is notable against the regular diet, whether or not that food group has an active diet rule.
_Avoid_: Cheat meal, food log

## Hosting & deployment

- **Project**: `fatlog-app`. Auth users, the Realtime Database, and all hosting sites are project-level and shared.
- **Sites**:
  - `fatlog` (`fatlog.web.app`) — production.
  - `fatlog-beta` (`fatlog-beta.web.app`) — beta.
  - `fatlog-app` (`fatlog-app.web.app`) — the project's default site, named after the immutable project ID. Cannot be deleted; leave dormant (serves stale content, no custom domains).
- **Deploy targets** (`.firebaserc`): `prod` → `fatlog`, `beta` → `fatlog-beta`. `firebase.json` defines a `hosting` array with one entry per target (both `public: dist` with an SPA rewrite to `/index.html`).
- **Firebase config** (`src/lib/firebase.tsx`): `authDomain` comes from `VITE_AUTH_DOMAIN`, defaulting to `fatlog.web.app`. `npm run build:beta` runs `vite build --mode beta`, which loads `.env.beta` (`VITE_AUTH_DOMAIN=fatlog-beta.web.app`).
- **Deploy commands**: `npm run deploy` (prod), `npm run deploy:beta`.
- **CI**: push to `main` → prod (`firebase-hosting-merge.yml`, target `prod`); push to the `beta` branch → beta (`firebase-hosting-beta.yml`, target `beta`). No PR preview workflow.
- Anyone with push access can update beta by merging into the `beta` branch — no Firebase CLI access needed.
