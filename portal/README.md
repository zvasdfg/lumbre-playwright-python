# Lumbre Portal

Local Next.js web application and API used as the system under test. Lumbre is
a Mexican outdoor-fire cooking community with recipes, products, events,
membership, cart, fire planning, and an ingredient experimentation laboratory.

Visible product copy is intentionally written in Spanish. Automation locators
therefore preserve Spanish accessible names and labels when they represent the
real user contract.

## Run the portal

Requirements: Node.js `>=22.13.0` and dependencies installed with `npm ci`.

```bash
cd portal
npm ci
npm run dev
```

The default URL is `http://localhost:3000`; the API discovery route is
`http://localhost:3000/api`.

The machine-readable OpenAPI 3.1 contract is published at
`http://localhost:3000/openapi/lumbre.openapi.json`. Its Schema Objects use
JSON Schema Draft 2020-12 and are exercised by the automation framework.

```bash
# Use a specific port
npm run dev -- --hostname localhost --port 3100
```

The root `scripts/test-local.sh` runner manages its own portal lifecycle, so a
separate portal terminal is unnecessary during isolated automated runs.

## Environments and access policy

Lumbre has an explicit product environment boundary:

| Environment | Default use | API access | Hypothesis source |
| --- | --- | --- | --- |
| `development` | Local product development | Public reads and business writes; test reset hidden | Editable local JSON registry |
| `test` | Automated local suite | Current read/write behavior plus the test reset hook | Temporary JSON copy created by the runner |
| `production` | Deployment-ready public demo | Only `GET`; mutation routes return `405` and test reset returns `404` | Bundled, immutable technical sheets |

`npm run dev` defaults to `development`. A production build defaults to
`production`. `scripts/test-local.sh` explicitly sets both `LUMBRE_ENV=test`
and `NEXT_PUBLIC_LUMBRE_ENV=test`, so the existing learning and persistence
tests keep their current behavior.

Use [`.env.example`](.env.example) only when an explicit local override is
useful. Keep its server and browser-facing values aligned; the public value is
embedded into the client bundle at build time.

In production, the membership form is replaced with a privacy notice, the
experiment creation control is disabled, API discovery advertises only `GET`
operations, and route handlers reject direct mutation attempts. The hypothesis
registry remains browsable from bundled seed data without filesystem access.
This makes the portal suitable for a future public demonstration while
preserving the richer mutable system under test locally.

## Product areas

- Lumbre identity and outdoor-fire community content.
- Recipe category filters, search, and recipe feedback.
- Product catalog, cart state, totals, removal, and demonstration checkout.
- Membership validation, keyboard navigation, API submission, and recovery.
- Fire planning with cooking-style and vegetable-reserve calculations.
- Ingredient catalog with research detail, family filters, and search.
- Two-to-six-component experiment bench and generated technical hypotheses.
- Registered technical sheets for crust, bark, chicken, and vegetables.
- Outdoor event selection and reservation feedback.

## API contract and coverage

| Method | Route | Purpose | Automated by |
| --- | --- | --- | --- |
| `GET` | `/api` | API discovery | Informational; not committed |
| `GET` | `/api/health` | Service health and seed version | `API-001` |
| `GET` | `/api/recipes` | Recipe collection and filters | `API-002`, `API-005` |
| `GET` | `/api/products` | Product collection | `API-017` |
| `POST` | `/api/products` | Product creation and validation | `API-004`, `API-018` |
| `GET` | `/api/events` | Event collection | `API-019` |
| `GET` | `/api/ingredientes` | Ingredient catalog, filters, and detail | `API-007`, `API-008`, `API-016` |
| `GET` | `/api/hipotesis` | Technical hypothesis registry | `API-011` |
| `GET` | `/api/hipotesis/:id` | One hypothesis and duplicate counter | `API-012`, `API-014` |
| `POST` | `/api/hipotesis` | Validate, create, deduplicate, and count | `API-009`, `API-010`, `API-012`, `API-013`, `API-015` |
| `POST` | `/api/members` | Membership registration and validation | `API-006`, `API-020`, `UI-004` |
| `POST` | `/api/test/reset` | Restore deterministic demo state | `API-003`, autouse fixture |

Recipes accept `category` and `q`. Ingredients accept `q`, `familia`, `estado`,
and `id`. Hypothesis creation requires an objective and two to six ingredient
IDs. Write operations return realistic status and error contracts in
`development` and `test`; production enforces the read-only policy described
above.

## Hypothesis persistence

Hypotheses are independent JSON resources under `data/hypotheses`. The API
validates each ingredient, canonicalizes ingredient order, reuses an existing
sheet instead of duplicating it, and increments a persisted repetition counter
for duplicate submissions.

Technical IDs use:

- `LHC`: beef crust;
- `LHB`: low-and-slow bark;
- `LHV`: ember-cooked vegetables;
- `LHP`: direct-fire chicken.

Automated runs set `LUMBRE_HYPOTHESIS_DIR` to a temporary copy of the registry,
allowing real persistence assertions without modifying source JSON.

Filesystem writes are intentionally limited to local `development` and `test`
runtimes. Production serves its bundled registry read-only. A future hosted
write capability would require authenticated endpoints and persistent storage
such as D1 or R2; neither is enabled by this change.

## Research data

Ingredient records include origin, compounds, thermal behavior, sensory and
compatibility scores, starting dosage, storage, sourcing, bibliography, and a
proposed experiment. They remain `documentado_sin_validar` until Lumbre runs the
corresponding kitchen trial. Recommended formulas likewise distinguish
researched adaptations from user-created drafts.

- [Ingredient evidence and taxonomy](app/api/ingredientes/METHODOLOGY.md)
- [Hypothesis registry behavior](data/hypotheses/README.md)

## Development commands

```bash
npm run dev
npm run dev:cloudflare
npm run lint
npm run build
npm run start
```

`npm run build` produces the current vinext/Cloudflare-compatible build. The
production result is a read-only public-demo candidate; no deployment is
performed or represented as complete by this repository.
