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

```bash
# Use a specific port
npm run dev -- --hostname localhost --port 3100
```

The root `scripts/test-local.sh` runner manages its own portal lifecycle, so a
separate portal terminal is unnecessary during isolated automated runs.

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
IDs. Write operations return realistic status and error contracts.

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

Filesystem writes require the Node development runtime. The Cloudflare worker
runtime needs a persistent D1 or R2 implementation before write operations can
be enabled outside the local environment.

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
repository currently validates the portal locally; hosted persistence remains a
separate deployment concern.
