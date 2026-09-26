# Lumbre Portal

Next.js web application and API used as the system under test. Lumbre runs on
the vinext/Cloudflare Workers runtime and uses Cloudflare D1 for mutable local
data. It is a Mexican outdoor-fire cooking community with recipes, products,
events, membership, cart, fire planning, and an ingredient experimentation
laboratory.

Visible product copy is intentionally written in Spanish. Automation locators
therefore preserve Spanish accessible names and labels when they represent the
real user contract.

## Run the portal

Requirements: Node.js `>=22.13.0` and dependencies installed with `npm ci`.

```bash
cd portal
npm ci
npm run db:migrate:local
npm run db:seed:local
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
| `development` | Local product development | Public reads, passwordless accounts, and business writes; test reset hidden | Local D1, initialized from versioned JSON seed data |
| `test` | Automated local suite | Current read/write and account behavior plus deterministic auth/reset hooks | Fresh temporary D1 created by the runner |
| `production` | Controlled account preview | Public reads, anonymous cart writes, and passwordless access for one allowlisted operator; commerce and public-data mutations remain unavailable; test reset returns `404` | Remote D1 sessions, account-owned data, cart, and technical-sheet registry |

`npm run dev` defaults to `development`. A production build defaults to
`production`. `scripts/test-local.sh` explicitly sets both `LUMBRE_ENV=test`
and `NEXT_PUBLIC_LUMBRE_ENV=test`, so the existing learning and persistence
tests keep their current behavior.

Use [`.env.example`](.env.example) only when an explicit local override is
useful. Keep its server and browser-facing values aligned; the public value is
embedded into the client bundle at build time.

In production, the membership form remains replaced with a privacy notice. The
anonymous cart remains available through an opaque protected cookie and D1,
while commerce, product, membership, and direct public-hypothesis mutations are
rejected. Account-owned blends, presets, preferences, and reservations become
available only after the allowlisted operator signs in.

Development and test use a deterministic D1 outbox for passwordless accounts.
The production account preview uses Resend and its test sender, which can
deliver only to the Resend account owner's allowlisted email until Lumbre has a
verified domain. Every other address receives the same generic HTTP success but
no email, preventing discovery of the allowlist.

## Product areas

- Lumbre identity and outdoor-fire community content.
- Paginated recipe catalog with six cards per page, category filters, search,
  and recipe feedback.
- Product catalog, server-priced persistent cart, authenticated checkout,
  deterministic local payments, provider-hosted checkout, and account-owned
  order history with server-owned inventory.
- Membership validation, keyboard navigation, API submission, account-owned
  cooking preferences, explicit consent history, and recovery.
- Fire planning with cooking-style and vegetable-reserve calculations,
  anonymous local presets, and synchronized account presets.
- Collapsible ingredient families with research detail, filters, and search.
- Two-to-six-component experiment bench with anonymous, session-only blends
  that never mutate the public hypothesis registry or an account.
- Account-owned private blends for crust, bark, chicken, and vegetables, with
  explicit submission and administrator approval before public publication.
- Public technical sheets with a branded A4 preview and isolated browser-print
  layout that omits portal controls and navigation.
- Outdoor event selection and reservation feedback.
- Authenticated group reservations with live capacity and account history.

## API contract and coverage

| Method | Route | Purpose | Automated by |
| --- | --- | --- | --- |
| `GET` | `/api` | API discovery | Informational; not committed |
| `GET` | `/api/health` | Service, D1 readiness, and seed version | `API-001`, `API-021` |
| `GET` | `/api/account` | Current authenticated account or anonymous null state | `API-025`, `API-026`, `CONTRACT-002` |
| `POST` | `/api/account/magic-link` | Request passwordless sign-in or explicit account creation | `API-025`–`API-029`, `API-077`–`API-079`, `UI-059`, `CONTRACT-003` |
| `POST` | `/api/account/logout` | Invalidate the current authenticated session | `API-026`, `API-029` |
| `GET` | `/api/account/preferences` | Read account cooking preferences and consent history | `API-052`–`API-056`, `UI-044` |
| `PUT` | `/api/account/preferences` | Create or update preferences and audit consent changes | `API-052`, `API-054`–`API-057`, `UI-044`, `UI-045` |
| `GET` | `/api/account/blends` | Read blends owned by the authenticated account | `API-075`, `API-076`, `UI-056` |
| `POST` | `/api/account/blends` | Save or reuse a private account-owned blend | `API-075`, `API-076`, `UI-056`, `CONTRACT-003` |
| `DELETE` | `/api/account/blends/:id` | Archive an owned blend that is not under review | `API-075` |
| `POST` | `/api/account/blends/:id/submit` | Submit an owned draft or rejected blend for review | `API-076`, `UI-057` |
| `GET` | `/api/admin/accounts` | Role-protected account summaries | `API-028` |
| `GET` | `/api/admin/blends` | Read the administrator moderation queue | `API-076`, `UI-057` |
| `PATCH` | `/api/admin/blends/:id` | Approve or reject one submitted blend | `API-076`, `UI-057` |
| `GET` | `/api/admin/products` | Complete product catalog with revisions | `API-058`, `API-059` |
| `POST` | `/api/admin/products` | Create a product under the administrator role | `API-004`, `API-018`, `API-058`, `CONTRACT-003` |
| `PATCH` | `/api/admin/products/:id` | Update an immutable product ID with optimistic concurrency | `API-059`, `API-060` |
| `GET` | `/api/admin/events` | Complete event catalog with revisions | `API-058`, `API-061` |
| `POST` | `/api/admin/events` | Create an event under the administrator role | `API-058`, `API-062` |
| `PATCH` | `/api/admin/events/:id` | Update event details without invalidating confirmed capacity | `API-061` |
| `GET` | `/api/admin/audit-events` | Read append-only catalog and fulfillment change evidence | `API-059`–`API-062`, `API-071` |
| `PATCH` | `/api/admin/orders/:id/fulfillment` | Advance a paid order through audited fulfillment states | `API-070`, `API-071` |
| `GET` | `/api/recipes` | Recipe collection and filters | `API-002`, `API-005` |
| `GET` | `/api/products` | Product collection | `API-017` |
| `GET` | `/api/cart` | Read the current cart without allocating anonymous state | `API-022`, `API-072`, `CONTRACT-002` |
| `POST` | `/api/cart/items` | Add or increment a server-priced line item | `API-022`, `API-023`, `API-024`, `CONTRACT-003` |
| `PATCH` | `/api/cart/items/:productId` | Replace a persisted item quantity | `API-024` |
| `DELETE` | `/api/cart/items/:productId` | Remove a persisted line item | `API-024`, `UI-008` |
| `GET` | `/api/orders` | Account-owned persisted order history | `API-033`, `API-035`, `UI-039` |
| `POST` | `/api/orders` | Create an idempotent server-priced order snapshot | `API-031`–`API-033` |
| `GET` | `/api/orders/:id` | Read one account-owned immutable order | OpenAPI contract |
| `POST` | `/api/orders/:id/cancel` | Cancel an owned unpaid order and release any reservation once | `API-067`–`API-069`, `UI-051` |
| `POST` | `/api/orders/:id/payment` | Run an idempotent local payment attempt and consume stock on approval | `API-034`, `API-035`, `API-063`–`API-065`, `UI-039` |
| `POST` | `/api/orders/:id/checkout-session` | Create or reuse a provider-hosted checkout session and reserve stock | `API-036`, `API-066`, `UI-040` |
| `POST` | `/api/payments/stripe/webhook` | Verify a signed provider event and finalize or release inventory | `API-037`–`API-040`, `API-066` |
| `GET` | `/api/events` | Event collection | `API-019` |
| `POST` | `/api/events/:id/reservations` | Confirm an account-owned group reservation | `API-041`–`API-045`, `UI-041` |
| `GET` | `/api/reservations` | Read the authenticated account's reservation history | `API-041`, `API-042`, `UI-041` |
| `GET` | `/api/fire-presets` | Read the authenticated account's fire-planner presets | `API-046`–`API-050`, `UI-042` |
| `POST` | `/api/fire-presets` | Create or update a preset by normalized name | `API-046`–`API-048`, `API-051`, `UI-042`, `UI-043` |
| `POST` | `/api/fire-presets/sync` | Import missing browser-local presets without overwriting server conflicts | `API-046`, `API-050` |
| `DELETE` | `/api/fire-presets/:id` | Delete an account-owned preset | `API-046`, `API-049` |
| `GET` | `/api/ingredientes` | Ingredient catalog, filters, and detail | `API-007`, `API-008`, `API-016` |
| `GET` | `/api/hipotesis` | Technical hypothesis registry | `API-011` |
| `GET` | `/api/hipotesis/:id` | One hypothesis and duplicate counter | `API-012`, `API-014` |
| `POST` | `/api/hipotesis` | Validate, create, deduplicate, and count | `API-009`, `API-010`, `API-012`, `API-013`, `API-015` |
| `POST` | `/api/members` | Membership registration and validation | `API-006`, `API-020`, `UI-004` |
| `POST` | `/api/test/reset` | Restore deterministic demo state | `API-003`, autouse fixture |

Recipes accept `category` and `q`. Ingredients accept `q`, `familia`, `estado`,
and `id`. Hypothesis creation requires an objective and two to six ingredient
IDs. Write operations return realistic status and error contracts in
`development` and `test`. Production permits only its anonymous-cart writes
and rejects the protected business mutations described above.

## Administrative catalog integrity

Products and events are seeded into D1 by migration and are no longer mutable
through public catalog routes. Administrative writes require the persisted
`admin` role; hiding a control in the browser is never treated as
authorization. Catalog identifiers are immutable after creation.

Every update supplies `expectedRevision`. A stale editor receives `409`
instead of silently replacing a newer value. Event capacity additionally
cannot be reduced below the sum of confirmed reservations. Successful creates
and updates append an audit record containing actor, resource, before state,
after state, and timestamp. Public reads expose only active entries and omit
administrative metadata.

Authenticated administrators can open **Administrar catálogo** from their
account. The workspace edits existing products and events, reports successful
deactivation, and refreshes the public store and event projection immediately. The
Agenda surface is temporarily hidden, but its API and administration module remain intact. A stale
revision preserves the edited form and asks the operator to reload instead of
discarding work. Customers receive no administrative control, while the API
role check remains the actual security boundary. Creation remains API-only
until product image assignment is part of the write model.

Product stock is edited through the same revision-protected workspace. The
public store exposes zero inventory as **Agotado** and disables the add action;
that presentation is guidance, while the server remains the enforcement
boundary when payment or hosted checkout attempts to claim stock.

## Fire-planner preset ownership and synchronization

Anonymous visitors keep fire-planner presets in browser `localStorage`. Once
an account session is active, D1 becomes the source of truth and the portal
imports only local preset names that are missing from that account. A
normalized name conflict preserves the server copy; explicitly saving the same
name updates its existing server record. Account operations never rewrite the
anonymous local library.

Every list, save, sync, and delete query is constrained by the authenticated
user ID. A foreign preset is concealed with `404`, and each account can store
at most 20 presets. `UI-042` proves restoration in an independent browser
context using Playwright `storage_state`; API cases protect the merge,
ownership, deduplication, and validation rules directly.

## Anonymous cart and session

`GET /api/cart` is allocation-free: a new visitor receives an empty cart
without a cookie or D1 write. The first cart mutation creates an opaque 30-day
anonymous session. Its cookie uses `HttpOnly`, `SameSite=Lax`, `Path=/`, and
`Secure` in production. The cookie contains only a random identifier; cart
content remains in D1.

The browser sends only `productId` and `quantity`. Product names, unit prices,
line totals, and cart totals are derived from the server catalog. Repeated adds
atomically increment one line item, while `PATCH` replaces its quantity and
`DELETE` removes it. Independent browser contexts therefore receive isolated
carts, and a cart survives reload within its own session.

## Worker security and operations baseline

Every response receives an opaque `X-Request-ID`. Production API requests and
maintenance tasks emit one-line structured JSON logs containing correlation,
route, status, and duration metadata without bodies, cookies, tokens, personal
data, or stack traces. Unexpected API failures return a generic `500` contract
with the same request ID.

Unsafe browser API methods reject cross-site requests before application state
is allocated. The Stripe webhook is excluded because it uses its own signed
provider contract. In production, independent Cloudflare rate-limit bindings
permit 30 public cart mutations and five magic-link requests per 60 seconds for
each caller key; rejected requests return `429` with
`Retry-After: 60`. Tests activate the same binding with a
run-unique `X-Lumbre-Test-Rate-Limit-Key` so the boundary is deterministic
without weakening production behavior.

The Worker cron runs daily at `04:00 UTC` and deletes expired anonymous
sessions. D1 cascades that deletion to their carts and items, and the expiry
index keeps the retention query bounded as the dataset grows.

Browser responses publish a restrictive CSP, framing denial, MIME-sniffing
protection, a strict referrer policy, and a limited permissions policy. The
production build also publishes HSTS. These controls are exercised by
`API-072` through `API-074`.

## Passwordless accounts and authorization

All enabled environments expose a passwordless magic-link flow. Better Auth owns
verification tokens, authenticated session records, opaque cookies, expiry,
and one-time token consumption. Lumbre adds a server-owned `customer` or
`admin` role and never accepts a role from the registration request.

The local adapter writes the complete delivery URL to a D1 outbox that is
readable only through `/api/local/auth/magic-link` outside production. This
makes browser and API automation deterministic without printing tokens in logs
or reports. Test reset seeds a known administrator identity; production does
not seed an administrator or expose the outbox.

Production dispatches through Resend's HTTPS API with an eight-second timeout.
`AUTH_ALLOWED_EMAIL` is a secret binding and `AUTH_EMAIL_FROM` is a non-secret
sender declaration. The test sender `onboarding@resend.dev` is deliberately a
single-recipient preview, not public registration. Provider errors are reduced
to the API's generic `500` contract; tokens, links, and recipient addresses are
never written to application logs.

On sign-in, an anonymous cart is promoted when no account cart exists. If both
exist, matching product quantities are summed into one line and the anonymous
cart is deleted. Account identity is independent of the membership form:
creating an account never grants marketing consent.

The project fixture `authenticated_storage_state` prepares a customer session
through `APIRequestContext` and exports Playwright storage state. UI tests that
need an authenticated precondition can consume `authenticated_home`; tests of
the sign-in experience continue to exercise the visible flow.

## Membership preferences and consent history

Authenticated accounts can configure a preferred fuel, equipment, cooking
style, usual party size, and newsletter choice. `GET
/api/account/preferences` returns safe unconfigured defaults for a new account;
the default newsletter choice is always `false` and does not create an implied
consent event.

`PUT /api/account/preferences` upserts one D1 record owned by the current user.
The initial newsletter choice and each later change append an immutable consent
event; changing only cooking preferences does not duplicate that history. The
browser projects the read model back to the five writable fields so response
metadata can never leak into the strict update contract. `UI-044` validates
reload persistence and `UI-045` validates recoverability through Playwright
network routing.

## Orders and deterministic payment

Checkout is available to authenticated customers in development and test. The
browser submits customer delivery details but never submits an authoritative
price. The order service reads the account cart, calculates totals from the
server catalog, and persists immutable product-name, category, unit-price,
quantity, and line-total snapshots.

Order creation and payment initiation require independent `Idempotency-Key`
headers. Replaying a key returns the original order or payment attempt instead
of duplicating it. The local payment port accepts explicit `success` and
`rejection` scenarios: approval marks the order paid and clears the cart;
rejection marks it failed and preserves the cart for retry. The account dialog
reads persisted order history rather than reconstructing it from client state.

Inventory follows the payment boundary. A successful local payment claims and
sells stock atomically. A hosted checkout reserves stock before redirecting to
the provider, then a verified success finalizes it without another decrement;
a verified failed or expired event releases the reservation. Each order stores
an inventory state and unique claim key so retries cannot sell or restore the
same units twice. A competing claim receives `409` instead of allowing stock to
become negative.

Pending and failed orders may be cancelled by their owning account. Lumbre
expires an open hosted provider session before releasing its reservation, and
an idempotency key plus the persisted cancelled state prevents a second
restock. Paid orders reject cancellation until a refund port is implemented.

Payment and fulfillment are separate. A paid order starts `unfulfilled`; only
an administrator can advance it to `processing` and then `fulfilled`. Skips and
reversals receive `409`, replaying the current target is harmless, and every
accepted transition is written to administrative audit history. Account order
history presents these states in Mexican Spanish and offers **Cancelar pedido**
only while the order remains eligible.

## Provider-hosted checkout

Phase 5 adds a `HostedCheckoutPort` behind the existing order model. Test mode
uses a deterministic Stripe-shaped adapter; setting `PAYMENT_PROVIDER=stripe`
uses Stripe Checkout with `STRIPE_SECRET_KEY`. The authenticated session route
creates one hosted session per order and idempotency key, and the browser
redirects to the returned provider URL. Lumbre does not render card fields or
receive card details.

`POST /api/payments/stripe/webhook` reads the raw request body and validates
`Stripe-Signature` with `STRIPE_WEBHOOK_SECRET`. It rejects stale or invalid
signatures, mismatched provider sessions, order IDs, MXN amounts, and currency.
Processed event IDs are persisted for replay safety, while only a SHA-256 hash
of the payload is stored. The cart is cleared only after a verified paid event.
When Stripe or its signing secret is not configured, the route returns `404`
before reading the request body so the dormant integration is not exposed.

Copy `.dev.vars.example` to `.dev.vars` to exercise a live test-mode provider.
Use only Stripe test credentials and forward sandbox webhooks to the local
route. The deterministic adapter remains the default for isolated automation,
so the suite never depends on the network or shared provider state.

## Event reservations and capacity

The public event catalog now reports original capacity, confirmed places, and
remaining places from D1. Authenticated customers may reserve one to four
places. Each account can hold only one reservation per event, and sold-out
events reject further writes with `409`.

The capacity check and insertion execute as one conditional SQLite statement;
the browser never calculates or submits remaining inventory. Reservations
snapshot the event title, city, and date and appear under “Tus reservaciones”
in the account dialog after reload. Test reset clears reservations before their
owning test accounts.

## Hypothesis persistence

The hypothesis registry starts empty. Development and test users create the
records that appear in D1; no editorial combinations are injected at startup.
The API validates each ingredient, canonicalizes ingredient order, reuses an
existing sheet instead of duplicating it, and increments the D1 repetition
counter for duplicate submissions.

Technical IDs use:

- `LHC`: beef crust;
- `LHB`: low-and-slow bark;
- `LHV`: ember-cooked vegetables;
- `LHP`: direct-fire chicken.

Authenticated users do not write directly to this public registry. Their
formula is first stored in `user_blends` with a private `BLD-...` protocol ID.
An owner may submit a draft for review; only an administrator can approve it
and create or reuse the corresponding public `LH...` sheet. Rejection keeps the
blend private with an editorial note, and every moderation decision is written
to the administrative audit log. A unique `(user_id, signature)` constraint
prevents duplicate private blends without merging data across accounts.

Automated runs set `LUMBRE_D1_STATE_DIR` to a new temporary Wrangler state
directory, apply every SQL migration, and seed the database before the portal
starts. Persistence assertions therefore exercise the production-shaped
repository without changing source JSON or the developer's local database.

Worker request handlers never write to the filesystem. Production still
exposes the hypothesis registry read-only to anonymous visitors. The
allowlisted account may save a private blend and submit it for review, but no
production administrator is seeded and anonymous publication remains
impossible.

## Research data

Ingredient records include origin, compounds, thermal behavior, sensory and
compatibility scores, starting dosage, storage, sourcing, bibliography, and a
proposed experiment. They remain `documentado_sin_validar` until Lumbre runs the
corresponding kitchen trial. Formula evidence can identify a documented flavor
structure, but every technical sheet in the registry is created by a user.

- [Ingredient evidence and taxonomy](app/api/ingredientes/METHODOLOGY.md)

## Development commands

```bash
npm run dev
npm run dev:cloudflare
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
npm run db:migrate:remote
npm run db:seed:remote
npm run db:migrate:staging
npm run db:seed:staging
npm run readiness:offline
npm run readiness:staging
npm run readiness:public-demo
npm run readiness:production
npm run readiness:accounts:staging
npm run test:readiness
npm run deploy:staging:check
npm run deploy:staging
npm run release:production:preflight
npm run deploy:production
npm run cf:typegen
npm run lint
npm run typecheck
npm run build
npm run start
```

For explicit local auth bindings, copy `.dev.vars.example` to `.dev.vars` and
replace its placeholder secret. Leave `AUTH_EMAIL_PROVIDER=outbox` for normal
local automation; choose `resend` only for an intentional provider test.
`.dev.vars` is ignored and must never be committed. The repository also
supplies a non-production-only fallback secret so the learning suite remains
zero-configuration; production has no fallback.

`npm run db:generate` creates version-controlled SQL from the Drizzle schema.
Rerun `npm run cf:typegen` whenever `wrangler.jsonc` bindings change.
`npm run build` produces the vinext/Cloudflare-compatible build. The production
result is a protected public-demo candidate with anonymous cart support.

## Deployment readiness and secret boundaries

`config/deployment-readiness.json` separates `public-demo`, the deployable
single-recipient `accounts-preview`, and the blocked public `accounts` and
`commerce` profiles. The
readiness CLI validates required Wrangler bindings and environment variables,
then compares the selected profile with remote secret **names only**. It fails
on missing requirements, unresolved activation blockers, and unexpected stale
provider secrets.

The account preview requires `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, and
`AUTH_ALLOWED_EMAIL`; Stripe remains absent. Run
`npm run readiness:accounts:staging` before staging promotion and
`npm run test:readiness` after changing the manifest or CLI. Creation,
rotation, revocation, evidence, and incident procedures are documented in
[`docs/SECRETS_AND_RELEASE_GATES.md`](../docs/SECRETS_AND_RELEASE_GATES.md).

## Remote deployment preparation

The Cloudflare account has isolated `lumbre-db` and `lumbre-db-staging`
databases in WNAM. Their binding IDs are versioned in `wrangler.jsonc`;
database IDs identify resources and are not credentials. OAuth tokens remain
in Wrangler's user configuration outside the repository.

After an explicit production database change, apply only committed migrations
and then the idempotent metadata seed:

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

Both commands mutate the remote database and must never be used by the local or
parallel test runners. On 2026-09-24 the remote database was verified with all
13 migrations, 23 tables, seven catalog products, three events, the expected
seed version, and the anonymous-session expiry index.

Staging uses the same committed migrations and deterministic metadata seed but
has its own D1 binding and rate-limit namespace:

```bash
npm run db:migrate:staging
npm run db:seed:staging
npm run deploy:staging:check
npm run deploy:staging
```

On 2026-09-25 Worker version
`90cf9dbd-03b3-465e-8119-e9cbab5887a4` was deployed as
`lumbre-portal-staging` at
`https://lumbre-portal-staging.lumbre-portal.workers.dev`. The first remote
smoke gate passed all four checks after DNS propagation. No production Worker
was changed by this implementation. The existing production public demo remains
at `https://lumbre-portal.lumbre-portal.workers.dev`; the controlled account
preview has not been promoted yet.

### Controlled account-preview release

The production command enables one allowlisted passwordless account. Public
registration, membership writes, hosted checkout, and administration remain
unavailable. Create the three required bindings through Wrangler's interactive
prompt; never place their values in a shell command, file, issue, report, or
chat.

```bash
cd portal

# Generate a different high-entropy Better Auth secret for each environment.
openssl rand -base64 32

# Enter values interactively. Start in staging.
npx wrangler secret put BETTER_AUTH_SECRET --env staging
npx wrangler secret put RESEND_API_KEY --env staging
npx wrangler secret put AUTH_ALLOWED_EMAIL --env staging

# Confirm names only, then deploy staging and rerun its smoke gate.
npm run readiness:accounts:staging
npm run deploy:staging
cd ..
./scripts/test-staging.sh -q
cd portal

# Repeat with a different Better Auth secret and the production provider values.
openssl rand -base64 32
npx wrangler secret put BETTER_AUTH_SECRET --env production
npx wrangler secret put RESEND_API_KEY --env production
npx wrangler secret put AUTH_ALLOWED_EMAIL --env production

# Read-only checks, build, and Cloudflare package dry-run.
npm run release:production:preflight

# Capture a guarded export before changing the Worker that uses this D1.
D1_PRODUCTION_BACKUP_CONFIRM=lumbre-db npm run db:backup:production

# This is the only state-changing promotion command.
npm run deploy:production

# From the repository root, validate the deployed security boundary.
cd ..
./scripts/test-production.sh -q

# Back in portal/, compare remote secret names with the account-preview profile.
cd portal
npm run readiness:production
```

Each `secret put` creates a Worker version, so the staging remote-smoke gate
must be rerun after secret configuration. The same email used to own the Resend
account must be entered as
`AUTH_ALLOWED_EMAIL` while the test sender is in use.

The expected initial URL is
`https://lumbre-portal.lumbre-portal.workers.dev`. Override
`PRODUCTION_BASE_URL` when a custom domain is introduced. Do not run the
production smoke before deployment: a missing target is correctly treated as a
failed release.

## D1 backup and recovery runbook

D1 Time Travel is the primary short-window recovery mechanism. On the Workers
Free plan it retains seven days of history and resolves a recovery point to a
specific minute. Portable SQL exports provide an independent, locally
verifiable copy. Lumbre currently targets an RPO of one minute while a Time
Travel point remains available, a 24-hour RPO once scheduled exports exist,
and an operator RTO of 30 minutes including validation. These are project
objectives, not Cloudflare service guarantees.

Create a portable staging backup without changing remote data:

```bash
npm run db:backup:staging
```

The command writes a timestamped SQL export, database metadata, recovery
bookmark, and SHA-256 checksum under `.d1-backups/`. That directory is ignored
by Git because a real backup can contain account, session, order, or other
personal data. Backup files must be kept access-controlled and must not be
attached to public test reports.

Before a production migration, create a manual export with an explicit guard:

```bash
D1_PRODUCTION_BACKUP_CONFIRM=lumbre-db \
  bash ./scripts/d1-backup.sh production
```

Rehearse both recovery paths only against staging:

```bash
D1_RESTORE_REHEARSAL_CONFIRM=lumbre-db-staging \
  npm run db:restore:rehearse
```

The rehearsal verifies the checksum, imports the full export into a fresh local
D1 database, compares schema and critical table counts, writes a uniquely named
remote probe, restores staging to the captured bookmark, and proves the probe
was removed without changing the baseline. It deliberately refuses any target
other than `lumbre-db-staging`. Follow it with the external acceptance gate:

```bash
../scripts/test-staging.sh -q
```

For an actual production incident:

1. stop deployments and business writes;
2. capture the current bookmark and SQL export so the recovery can be undone;
3. resolve the desired bookmark with `wrangler d1 time-travel info` using the
   incident timestamp;
4. have a second operator verify the database, timestamp, and incident record;
5. restore with `wrangler d1 time-travel restore`;
6. validate `/api/health`, catalog invariants, and the remote smoke gate before
   reopening writes;
7. retain the incident timeline, chosen bookmarks, checksum, and validation
   evidence without publishing the SQL data.

Do not use the rehearsal script as a production restore command. Time Travel is
an in-place, destructive operation; the returned previous bookmark is the
immediate rollback point if the selected recovery point was wrong.

## Data governance and public disclosure

The public footer links to `/privacidad`, which explains the deliberately
limited deployed data boundary in Mexican Spanish. The engineering inventory,
retention decisions, incident severities, evidence rules, and production
blockers live in
[`docs/DATA_GOVERNANCE_AND_INCIDENT_RESPONSE.md`](../docs/DATA_GOVERNANCE_AND_INCIDENT_RESPONSE.md).

The public page does not pretend to be a legally complete privacy notice.
Production identity, address, request channel, and legal/communications
ownership must be supplied before accounts, orders, reservations, payments, or
membership collection can be enabled.
