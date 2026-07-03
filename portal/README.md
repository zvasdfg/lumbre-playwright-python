# Lumbre Portal

Local web application and API used as the system under test for the Playwright
learning framework. Lumbre represents an outdoor fire-cooking community with
recipes, products, events, a shopping cart, and club membership.

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
npm run dev -- --host localhost --port 3100
```

The root-level test scripts start and stop the portal automatically, so a
separate portal terminal is not required when using `scripts/test-local.sh` or
`scripts/report-local.sh`.

## Product areas

- Hero and Lumbre identity.
- Recipe category filters and search.
- Product catalog and client-side cart.
- Club membership modal and validation.
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
| `POST` | `/api/members` | Membership registration | `API-006`, indirectly `UI-004` |
| `POST` | `/api/test/reset` | Restore deterministic demo state | `API-003`, autouse fixture |

Recipes accept the optional query parameters `category` and `q`. Write
operations validate their payloads and return realistic HTTP status codes, but
the demo does not store sensitive information or require a database.

## Development commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

`npm run build` produces the current vinext/Cloudflare-compatible build. The
project is presently exercised locally; hosted deployment is outside the
current test-learning scope.
