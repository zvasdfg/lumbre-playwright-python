# Static public portal

The public target is now a client-only static artifact. Commerce, login, registration,
membership, administration and account-backed storage are not part of this artifact.
The four seasonings remain an informational catalog, not a functioning shop.
Recipe buttons now open the shared printable dialog, not a toast placeholder.
All 100 recipes now have explicit quantities, servings, fire setup, timing,
four preparation steps, doneness criteria and source links. The canonical content
is `portal/app/lib/recipe-preparations.ts`; cards derive their time from it.
These are original culinary proposals, not kitchen-tested recipes or copied source
recipes. The disclosure stays visible in the dialog and printout. Sources support
technique/safety, not empirical validation of these exact quantities. See
[the recipe review](RECIPE_CONTENT_REVIEW.md) for scope and verification.
Print actions remain
visible in sticky toolbars for products, recipes and experimental formulas.
Each card opens a keyboard-accessible product dialog with declared ingredients,
editorial flavor expectations, suggested pairings and a five-taste contribution
radar chart. Profiles live in `portal/static/product-profiles.ts`. The ordinal axes are
editorial estimates from ingredient records, not measured intensity, percentages
or a weighted formulation. Ratios and sensory validation remain unknown. Do not
remove that disclosure without actual product evidence.

The public registry opens the exact same product component by product code.
Experimental records retain their hypothesis/method sheet. Both print from a
body-level portal: print CSS removes the rest of the app with display:none rather
than reserving the hidden page height. Product dialogs include an Imprimir ficha
action. Long experimental records may legitimately span multiple content pages.
`test-static.py` creates four product PDFs and one experimental PDF in `/tmp`;
`scripts/check-static-print.py` checks page counts, nonblank text and final-section
presence with pypdf. PDF rendering still requires visual review for clipping.

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
admin work. `npm run dev` starts the static development server; `npm start` serves
the static build. Use `npm run dev:backend` / `npm run start:backend` explicitly for
the legacy test application. `npm run build:backend` is for legacy compatibility checks only.
Static interactive components live in `static/`; they share public data, styles
and the almanac but contain no account/commerce network logic. Do not propagate
backend changes into these components.

GitHub Actions builds a static artifact without deploying. The scheduled legacy
monitor has been removed; manual invocation remains available. Legacy production/staging
deployment scripts fail closed. Explicit static publication uses `npm run deploy:static`
from `portal/`, with the separate `wrangler.static.jsonc` configuration: assets only,
no application entrypoint, no D1 bindings, no cron triggers and no SPA fallback for API paths.
Cloudflare serves `_headers` from the static build, including CSP and frame protection.

## Production static cutover — 2026-09-30

Following explicit user approval, the production `lumbre-portal` deployment was
replaced with the static artifact at https://lumbre-portal.lumbre-portal.workers.dev/.
Initial version: `841047b1-858b-40b9-99de-3f04f8e806b8`.
Storage hardening version: `97ab644e-54bc-4903-af41-20357cdf1b8c`.
Verified: homepage 200 with security headers; `/api/auth/get-session`, `/api/cart`
and `/admin` return 404; public navigation has no account/cart controls and the
almanac contains 24 notes. The legacy backend is no longer served on this production URL.
D1 data and previously stored secrets were not deleted. Their retention, backup
and eventual cleanup are separate actions. Staging was subsequently replaced by
an assets-only deployment with workers.dev and preview URLs disabled using
`wrangler.staging-retired.jsonc`, version `940b3fc6-3d31-42db-ad7f-e15fc5136265`.
A cache-busted GET to the staging session endpoint returned 404. Pushes to main
now validate and publish the static artifact through GitHub Actions (see below).
The manual legacy staging monitor is not applicable while that environment is retired.

## Verification

`build:static` checks the output boundary. `scripts/test-static.py` exercises the
served artifact with Playwright: no account/cart controls or API traffic, catalog,
recipe pagination, local presets, temporary blends, almanac and API-path 404s.
Run it using the automation framework's Python environment after starting the preview.
Legacy API/admin tests are not evidence for this static artifact.

CI also checks TypeScript, all recipe records, static acceptance/PDF structure,
storage recovery and npm advisories at high severity or above. Storage tests use
isolated contexts; malformed records are ignored without deleting browser data.
Presets are limited to 50 and blends to 20. Failed writes do not report success.
The project npm registry is explicitly public; workstation corporate settings are
not changed. Local advisory checks may still require a trusted certificate chain.
Known legacy tooling debt: drizzle-kit includes deprecated esbuild-kit packages
and esbuild 0.18.20 (GHSA-67mh-4wv8-2f99, development server only). These packages
are not part of the static browser artifact. Full backend dependency isolation
remains pending; do not force an incompatible transitive override to hide warnings.

## Recipe/blend release — 2026-09-30

Explicitly requested manual static deployment: version
`f669de1d-9ced-4284-a2ae-41dd69b9cf92`, including 33 integrated recipe blends,
40 optional variants, corrected garlic in LMB-F-002, simplified ingredient copy,
and contextual return from a product sheet to its originating recipe/scroll.
Built from the working tree; this release did not commit or push Git changes.
Cloudflare confirmed upload and deployment. Production HTML references
`index-PNFPp68F.js` and `index-C0tQbcDp.css`; the published JavaScript SHA-256
matches the locally tested artifact:
`f9b277afd9ce331f8b03d3816ec9168aa942207b109e68049ead72b6e391eb3d`.
Production headless-browser navigation was blocked by ERR_ADDRESS_UNREACHABLE;
HTTP verification succeeded. Interactive return behavior passed local desktop
and mobile tests, not a production browser test.

## GitHub-managed publication

The owner subsequently requested commits/push and publication from GitHub.
`deploy.yml` validates PRs without deployment. Pushes to `main` and manual runs
on `main` deploy only after `static-build` succeeds. The production job downloads
the exact artifact from that run, deploys assets using `wrangler.static.jsonc`,
then checks that production HTML and JavaScript SHA-256 match the artifact.
Existing repository Cloudflare secrets are used only in the production deploy
step. No backend, D1 migrations, staging deployment or cron is enabled.

The first Actions run was blocked by high-severity undici advisories in legacy
Cloudflare tooling. A temporary, read-only manual runner generated/audited the
updated lockfile (run 36797036541); it was then incorporated into Git and the
temporary workflow removed. Pins: vite-plugin 1.62.3, Wrangler 4.145.0,
transitive undici 7.29.1. TLS validation was not disabled to work around local
proxy certificate problems. Existing moderate legacy drizzle tooling debt remains.

## Isolated static release dependencies — 2026-10-05

The production workflow now installs `portal/profiles/static/package.json` and
its independent lockfile in a NEW directory outside `portal`. The preparation
script copies an explicit list of static source/asset/config inputs; it does not
copy credentials, backend routes, server configuration or `node_modules`.
The original `portal/package.json` and lockfile are preserved for legacy work.
Shared source data and the existing almanac component remain canonical in `app/`.
The ingredient JSON catalog under `app/api/ingredientes` is copied as data only
(no route files); the preparation test checks the transitive relative imports
of the static entry points so required source data cannot silently be omitted.

`tsconfig.static.json` checks the static entry points and their imported shared
modules, mapping `next/image` to the same browser-only adapter used by Vite.
Production still requires `npm ci`, type checking, 100 recipe checks, planner
model tests, the high-severity npm audit gate, a static-boundary build, browser
acceptance, PDF checks and storage recovery. Deployment installs the SAME profile
and downloads the validated artifact; it does not build a different artifact.

To reproduce from the repository root (choose a destination that does not exist):

```sh
node --test portal/scripts/static-profile.test.mjs
node portal/scripts/prepare-static-workspace.mjs /tmp/lumbre-release-check
cd /tmp/lumbre-release-check
npm ci
npm run typecheck
npm run check:recipes
npm test
npm audit --audit-level=high --registry=https://registry.npmjs.org
npm run build:static
npm run preview:static
```

Run the existing Python browser/PDF tests from the source repository against that
preview on port 3001. No backend package installation is needed in the clean
release workspace. Installing the full legacy toolchain in `portal` remains
possible; it is not evidence for the isolated release dependency audit.

This is dependency isolation, NOT a fix to third-party `braces` itself.
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
has no patched release at the time of this change. The legacy Next lint/vinext
chains still contain it, and drizzle-kit retains the previously documented
moderate esbuild advisory. `legacy-backend-checks.yml` retains full legacy type
checking and a failing high-severity audit gate, available manually and on PRs
touching its dependencies/backend. It has no deploy step and does not gate the
separate static release. Legacy backend reactivation requires resolving those
findings; no audit suppression or forced transitive downgrade was introduced.
