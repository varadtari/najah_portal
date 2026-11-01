# najah_portal

Web portal for Najah gym management: React 19 + Vite + TypeScript, React Router, TanStack Query.
It talks to [essl_integration_service](https://github.com/varadtari/essl_integration_service).

## Local development

Run the backend first (see its README), then:

```sh
npm ci
npm run dev          # http://localhost:5173
```

The dev server proxies `/api/*` to the backend at `http://localhost:8001` (override with
`API_TARGET=...`), so the browser sees one origin and the HttpOnly session cookie works without
CORS. Production serves the built files and `/api` from the same host through the reverse proxy.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run typecheck` | `tsc -b` |
| `npm test` | Vitest unit tests |
| `npm run lint` | oxlint |
| `npm run build` | Typecheck and build to `dist/` |

## Structure

```
src/api/        fetch wrapper (ApiError with the server's displayMessage) and API types
src/auth/       session state: GET /v1/me decides whether the user is signed in
src/components/ app shell (sidebar / mobile tab bar), icons, logo
src/lib/        formatting (paise, dates, expiry wording, WhatsApp links) and small hooks
src/pages/      screens
src/test/       fake API and render helper for the app-level tests
src/styles/     design tokens and styles carried over from the prototype
```

Any 401 from the API clears the session and returns the user to the login screen.

## Tests

`npm test` runs unit tests for the API client and formatters, and `src/App.test.tsx`, which
renders the whole app in jsdom against an in-memory fake of the backend (`src/test/fakeApi.ts`)
and drives it like a user: sign in and out, add a member, renew an overdue one.

## Git workflow

Never commit to `main`. Branch from the latest `origin/main` as `feature/<name>`, push the
branch, and open a pull request.
