# Lumbre Portal

Local web application and API used as the system under test for the Playwright
learning framework. Lumbre represents an outdoor fire-cooking community with
recipes, products, events, a shopping cart, club membership, and an ingredient
experimentation laboratory.

The visible product copy is intentionally in Spanish. Test locators therefore
use Spanish accessible names and labels when they reference the real UI.

## Requirements

- Node.js `>=22.13.0`
- Dependencies installed with `npm ci`

## Run the portal

```bash
cd portal
npm ci
npm run dev
```

The default development URL is `http://localhost:3000`. The API index is
available at `http://localhost:3000/api`.

For a specific local port:

```bash
npm run dev -- --hostname localhost --port 3100
```

The root-level test scripts start and stop the portal automatically, so a
separate portal terminal is not required when using `scripts/test-local.sh` or
`scripts/report-local.sh`.

## Product areas

- Hero and Lumbre identity.
- Recipe category filters and search.
- Product catalog and client-side cart.
- Club membership modal, validation, autofocus, and keyboard navigation.
- Fire planner modal with fuel calculation and recoverable form state.
- Ingredient laboratory with 60 components, search, family filtering, detail
  sheets, family-grouped browsing, a 2-to-6 ingredient experiment bench, and
  generated protocols.
- Outdoor event selection and reservation confirmation.
- Status messages for observable user feedback.

## API contract

| Method | Route | Purpose | Tested by |
| --- | --- | --- | --- |
| `GET` | `/api` | API route index | Manual reference |
| `GET` | `/api/health` | Service health and seed version | `API-001` |
| `GET` | `/api/recipes` | List, search, and filter recipes | `API-002`, `API-005` |
| `GET` | `/api/products` | Product catalog | Available to future tests |
| `POST` | `/api/products` | Product payload validation | `API-004` |
| `GET` | `/api/events` | Outdoor event catalog | Available to future tests |
| `GET` | `/api/ingredientes` | Ingredient catalog, search, filters, and detail | Available to future tests |
| `GET` | `/api/ingredientes?hipotesis=true` | Registered technical hypothesis sheets | Available to future tests |
| `POST` | `/api/ingredientes` | Validate a formula and create an experiment protocol | Available to future tests |
| `POST` | `/api/members` | Membership registration | `API-006`, indirectly `UI-004` |
| `POST` | `/api/test/reset` | Restore deterministic demo state | `API-003`, autouse fixture |

Recipes accept the optional query parameters `category` and `q`. Ingredients
accept `q`, `familia`, `estado`, and `id`. Creating a protocol requires an
`objective` and between two and six unique `ingredient_ids`. Write operations
validate their payloads and return realistic HTTP status codes, but the demo
does not require a database.

Ingredient protocols are persisted locally as JSON files in
`data/hypotheses`. The API validates every requested ingredient before it
writes, canonicalizes the ingredient order, and returns the existing sheet
instead of creating a duplicate. Technical IDs use `LHC` for beef crust,
`LHB` for low-and-slow bark, `LHV` for vegetables, and `LHP` for direct-fire
chicken. The portal lists these records under **Registered technical sheets**
at the bottom of the flavor laboratory and opens the complete hypothesis,
validated components, and proposed method in a detail dialog. This filesystem
behavior requires the default Node-based `npm run
dev`. Use `npm run dev:cloudflare` only to exercise the Worker runtime, where a
persistent D1 or R2 implementation is required before hypothesis writes can be
enabled.

The local registry is initialized with 24 researched recommendations: six
beef-crust formulas, six low-and-slow bark formulas, six direct-fire chicken
formulas, and six ember-cooked vegetable formulas. Each record is
stored as a normal technical-sheet JSON and includes:

- a stable recommendation identifier and a protocol-specific `LH*` sheet ID;
- a non-generic, testable hypothesis;
- relative volumetric parts for an initial batch;
- the published culinary basis and a direct source link;
- an explicit Lumbre adaptation note whenever ingredients were substituted or
  omitted to respect the six-component limit.

These records use `recomendado_sin_validar`: their structures are based on
published Weber or McCormick formulas, but Lumbre has not executed the proposed
kitchen trials. User-created combinations remain `borrador`. Loading
`GET /api/ingredientes?hipotesis=true` safely seeds missing recommendations and
refreshes only existing researched recommendations; it never overwrites a
user hypothesis.

The second research set expands the laboratory with sweet paprika, ground
ginger, turmeric, annatto, dried basil, coffee, cocoa, pasilla/ancho chile,
sumac, warm spices, and aromatic seeds. It includes documented Weber formulas
for coffee-chile tri-tip, coffee-rubbed ribs, Moroccan and tandoori chicken,
spatchcock chicken, kofta, grilled basil vegetables, paneer tikka, and a short
mole rub used on grilled vegetables. Adapted records state every substitution
or omitted component instead of presenting the Lumbre version as an exact copy.

All 60 ingredient records contain researched origin, compounds, thermal
behavior, editorial sensory and compatibility scores, starting dosage ranges,
storage guidance, sourcing channels, bibliography, and a proposed experiment.
They are marked `documentado_sin_validar`: literature curation is complete,
but the proposed Lumbre kitchen trials have not been executed. The scales and
evidence rules are documented in `app/api/ingredientes/METHODOLOGY.md`.

The catalog uses culinary families instead of mixing taxonomy with sensory
roles or research maturity. Its 11 current families are `Sal`, `Allium`,
`Pimienta`, `Chile`, `Hierba`, `Semilla_aromatica`, `Especia_calida`,
`Citrico`, `Umami`, `Tostado`, and `Endulzante`. The 12 pantry additions are
sweet paprika, ground ginger, turmeric, nutmeg, clove, annatto, dried basil,
dried parsley, dried dill, dried sage, pasilla chile, and morita chile.

Hypotheses use researched formula-role templates rather than concatenating
ingredient names. The current references cover classic salt-pepper-allium,
salt with a peppercorn medley, pepper with a toasted component, sweet-smoky
rubs, and herbal-allium blends. A result is classified as `referenced`,
`close`, or `experimental`; the technical sheet records covered roles, missing
roles, additional flavor contributions, expected sensory intensity, and source
links. Sweet aromatic spices are deliberately separate from the `sweetener`
role, which is represented by brown sugar.

## Development commands

```bash
npm run dev
npm run dev:cloudflare
npm run lint
npm run build
npm run start
```

`npm run build` produces the current vinext/Cloudflare-compatible build. The
project is presently exercised locally; hosted deployment is outside the
current test-learning scope.
