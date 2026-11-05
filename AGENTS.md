## Agent skills

### Issue tracker

GitHub Issues in `stevenocchipinti/fatlog`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Local development & testing

- `npm run emulators` starts the Firebase emulators (auth `:9099`, database `:9000`, emulator UI `:4000`, hosting `:3001`). `npm run dev` serves the app at `http://localhost:3000`, which connects to those emulators automatically.
- **Signing in:** click "Login with Google", then in the auth emulator widget pick an existing account, or "Add new account" → "Auto-generate user information". Emulator data is wiped when the emulators restart, so a stale session shows a logged-out avatar (⨯). Sign in again.
- **Inspecting data:** `curl -H "Authorization: Bearer owner" "http://localhost:9000/.json?ns=fatlog-app"`. The namespace is `fatlog-app`, from the legacy `fatlog-app.firebaseio.com` `databaseURL`.
- **Stale dependencies:** Vite only re-bundles dependencies on startup, so after `npm install` or `npm update`, restart `npm run dev` before testing in the browser.
- **Checks:** `npx tsc`, `npm run lint`, `npm test`. CI doesn't run these yet; it only builds and deploys.

## Hosting & deployment

- **Project**: `fatlog-app`. Auth users, the Realtime Database, and all hosting sites are project-level and shared.
- **Sites**:
  - `fatlog` (`fatlog.web.app`) — production.
  - `fatlog-beta` (`fatlog-beta.web.app`) — beta.
  - `fatlog-app` (`fatlog-app.web.app`) — the project's default site, named after the immutable project ID. Cannot be deleted; leave dormant (serves stale content, no custom domains).
- **Deploy targets** (`.firebaserc`): `prod` → `fatlog`, `beta` → `fatlog-beta`. `firebase.json` defines a `hosting` array with one entry per target (both `public: dist` with an SPA rewrite to `/index.html`).
- **Firebase config** (`src/lib/firebase.tsx`): `authDomain` comes from `VITE_AUTH_DOMAIN`, defaulting to `fatlog.web.app`. `npm run build:beta` runs `vite build --mode beta`, which loads `.env.beta` (`VITE_AUTH_DOMAIN=fatlog-beta.web.app`).
- **Beta branding**: beta is installed on phones alongside prod as a separate PWA, so the beta build (`--mode beta`) uses `public-beta/` instead of `public/` (`vite.config.js`). It has its own manifest named "Fatlog Beta" and orange icons (SVG sources: `public-beta/favicon.svg`, `public-beta/icon-mask.svg`). `index.html` gets its title from `%APP_NAME%`, and the avatar ring in `src/routes/_auth.tsx` is striped in beta. If you change a file in `public/`, make the matching change in `public-beta/`.
- **Deploy commands**: `npm run deploy` (prod), `npm run deploy:beta`.
- **CI**: push to `main` → prod (`firebase-hosting-merge.yml`, target `prod`); push to the `beta` branch → beta (`firebase-hosting-beta.yml`, target `beta`). No PR preview workflow.
- **Database rules** (`database.rules.json`): beta and prod share one Realtime Database, so only the `beta` CI workflow deploys rules; `main` never does. Beta is always ahead of prod, so beta's rules must keep working for the older prod code. A push to `main` that also deployed rules could replace beta's newer rules with older ones and cut beta off from new paths.
- Anyone with push access can update beta by merging into the `beta` branch — no Firebase CLI access needed.
