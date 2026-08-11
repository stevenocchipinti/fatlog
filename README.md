# Fatlog

A simple PWA for logging body weight, fat percentage and waist circumference
built with create-tsrouter-app.
See [generated README here](README-tanstack.md)

## Hosting

All hosting sites live in the Firebase project `fatlog-app` and share its Auth
users and Realtime Database (so existing users can sign in from any site, and
beta sees the same data as production).

| Site | URL | Purpose | Deployed from |
|------|-----|---------|---------------|
| `fatlog` | https://fatlog.web.app | Production | `main` branch (CI) |
| `fatlog-beta` | https://fatlog-beta.web.app | Beta | `beta` branch (CI) |
| `fatlog-app` | https://fatlog-app.web.app | Project default site — cannot be deleted | nothing (dormant) |

Notes:

- `fatlog-app` is the project's *default* hosting site, named after the
  immutable project ID. Firebase does not allow deleting it, so it is left
  dormant serving stale old content. It has no custom domains attached.

## Deploying

Builds are environment-aware via the `VITE_AUTH_DOMAIN` variable (see
`src/lib/firebase.tsx`):

- Production builds default to `authDomain: fatlog.web.app`
- Beta builds read `.env.beta`, which sets `VITE_AUTH_DOMAIN=fatlog-beta.web.app`

| Command | Effect |
|---------|--------|
| `npm run deploy` | Build + deploy to the production site `fatlog` |
| `npm run deploy:beta` | Build + deploy to the beta site `fatlog-beta` |

CI (GitHub Actions):

- Push to `main` deploys to production (`firebase-hosting-merge.yml`)
- Push to the `beta` branch deploys to beta (`firebase-hosting-beta.yml`)
- There is no PR preview workflow

To update beta without Firebase CLI access, just merge your branch into the
`beta` branch — CI handles the deploy.
