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
