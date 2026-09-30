# Static public portal

The public target is now a client-only static artifact. Commerce, login, registration,
membership, administration and account-backed storage are not part of this artifact.
The four seasonings remain an informational catalog, not a functioning shop.

## Run locally

From `portal/`:

```sh
npm run build:static
npm run preview:static
```

Open `http://127.0.0.1:3001/`. This preview is deliberately separate from the legacy
backend on port 3000. `npm run build` also builds the static artifact.

## Boundaries

- Publish only `portal/dist-static/`, never the repository or `portal/dist/`.
- The build contains HTML, CSS, browser JavaScript and allowlisted public images.
- No Worker, D1 bindings, API routes, credentials or OpenAPI documents are emitted.
- Recipes, ingredient JSON and the four production declarations are build-time data.
- Planner presets use localStorage; experimental blends use sessionStorage.
  Neither is an authenticated session, uploaded record or shared public submission.
- The browser CSP disallows fetch/WebSocket connections and form submissions.
- Hosting must serve missing paths as 404 and configure security headers (including
  frame-ancestors, which cannot be enforced through a CSP meta tag).
- This removes the application backend attack surface from the new artifact; it
  does not make browser code immune to vulnerabilities or replace dependency updates.

## Preserved legacy application

`app/` and `server/` remain for the automation framework and to preserve pending
admin work. `npm run dev` still starts that legacy test application; it is not the
static preview. `npm run build:backend` is for legacy compatibility checks only.
Static interactive components live in `static/`; they share public data, styles
and the almanac but contain no account/commerce network logic. Do not propagate
backend changes into these components.

GitHub Actions now builds a static artifact without deploying. The scheduled legacy
monitor has been removed; manual invocation remains available. Production/staging
deployment scripts fail closed. No hosting provider has been selected for the
static artifact yet.

## Production retirement (not performed)

Local changes do not disable the existing production Worker or D1 database.
After explicit approval: export required data, validate a static deployment, switch
traffic, disable the legacy Worker/API, revoke unused secrets, and retire D1 only
after verifying the backup and retention decision. Do not delete cloud resources
merely because this build passes. No push or production change before local acceptance.

## Verification

`build:static` checks the output boundary. `scripts/test-static.py` exercises the
served artifact with Playwright: no account/cart controls or API traffic, catalog,
recipe pagination, local presets, temporary blends, almanac and API-path 404s.
Run it using the automation framework's Python environment after starting the preview.
Legacy API/admin tests are not evidence for this static artifact.
