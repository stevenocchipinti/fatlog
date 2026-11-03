## Agent skills

### Issue tracker

GitHub Issues in `stevenocchipinti/fatlog`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

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
- **Database rules** (`database.rules.json`): beta and prod share one Realtime Database, so only the `beta` CI workflow deploys rules; `main` never does. Beta is always ahead of prod, so beta's rules must keep working for the older prod code. A push to `main` that also deployed rules could replace beta's newer rules with older ones and cut beta off from new paths.
- Anyone with push access can update beta by merging into the `beta` branch — no Firebase CLI access needed.
