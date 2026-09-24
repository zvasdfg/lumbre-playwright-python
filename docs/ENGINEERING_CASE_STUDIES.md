# Lumbre Engineering Case Studies

These case studies preserve the most useful design decisions and discoveries
from building the Lumbre Playwright framework. They focus on engineering
judgment rather than reproducing test implementation line by line.

## 1. Modeling the embedded fire planner as a Component Object

### Risk

The fire planner is a full portal section with several related controls,
calculated guidance, browser-local presets for visitors, and D1-backed presets
for accounts. Putting its selectors and actions directly in a test would make
the scenario difficult to read. Putting all of them in `HomePage` would make
the page object grow into a model of every widget in the portal.

### Decision

The implementation introduced `FirePlanner`, scoped to the embedded
`data-testid="fire-planner"` region. `HomePage` owns navigation to the section;
the component owns guest count, cooking style, duration, fuel, equipment,
weather, vegetable reserve, calculation, recommendation state, and presets.

```text
HomePage
  └── navigates ──> FirePlanner
                      ├── configures controls
                      ├── calculates
                      ├── saves, restores, and deletes presets
                      ├── exposes the active storage scope
                      └── exposes recommendation locator
```

The normalized test remains responsible for the oracle. It configures the
component and asserts the expected fuel rather than hiding the assertion inside
the component object.

### Playwright techniques

- region-scoped `get_by_role()` and `get_by_label()` locators;
- web-first visibility and text assertions;
- parametrization for equivalent direct-fire and slow-cooking contracts;
- before/after state comparison for the vegetable-reserve calculation.

### Outcome

`UI-012`, `UI-023`, `UI-024`, `UI-033`, `UI-042`, and `UI-043` protect
calculation, browser-local persistence, account synchronization, and retryable
save failures while sharing a reusable component boundary. `UI-042`
deliberately opens a second browser context with the same Playwright
`storage_state`; this distinguishes account persistence from same-tab React
state or one browser's `localStorage`. `UI-043` uses `page.route()` to prove a
remote failure does not render false success or erase retry data.

### Lesson

Component Objects are useful when DOM ownership is clear. They should reduce
selector duplication without absorbing the business expectation from a test.

## 2. Verifying keyboard focus through the DOM

### Risk

A membership form may look correct while presenting an illogical keyboard
sequence. Clicking inputs would not test the behavior used by keyboard-only
users.

### Decision

`UI-013` opens the modal, enters a name, presses `Tab`, and validates that focus
moves to the email field. Playwright provides the keyboard action and locator,
while a small DOM expression observes the browser's active element:

```javascript
element => element === document.activeElement
```

The expression receives the element resolved by the locator and returns whether
it is the same node currently exposed by `document.activeElement`.

### Playwright techniques

- keyboard-driven interaction instead of mouse substitution;
- `Locator.evaluate()` for a DOM property not represented by business text;
- `expect(locator).to_be_focused()` as the primary user-facing assertion;
- observed focus values in diagnostic logs.

### Outcome

The test protects a real accessibility behavior and explains why direct DOM
evaluation is occasionally appropriate. The Page Object exposes fields and
actions; the accessibility oracle remains visible in the test.

### Lesson

Use Playwright's semantic assertion when one exists. DOM evaluation is a narrow
tool for state that cannot be expressed through content or accessibility
semantics, not a replacement for locators.

## 3. Testing recoverability with network control

### Risk

A successful membership test cannot prove that the UI remains usable when its
API dependency fails. Reproducing intermittent server failures manually would
make the test slow and nondeterministic.

### Decision

`ERR-001` registers a route before the triggering action and fulfills the
membership request with HTTP 500. The scenario then proves that the form stays
open and communicates a recoverable error.

`UI-014` covers the complementary integration boundary: it observes the real
outgoing request with `page.expect_request()` and validates the submitted
payload.

### Playwright techniques

- `page.route()` and `route.fulfill()` for deterministic failure injection;
- route registration before the user action;
- `page.expect_request()` for browser-to-API contract observation;
- assertions on UI recovery rather than only transport status.

### Outcome

The framework validates both what the browser sends and how the product reacts
when the server cannot complete the operation. Network mechanics remain outside
the membership Component Object.

### Lesson

Mock at the network boundary when the protected risk is frontend recovery. Use
direct API tests when the protected risk is the server contract itself.

## 4. A slow-motion run exposed a toast race

### Risk

The portal reused one toast region for product and checkout feedback. Each
message scheduled an independent timer to clear the region.

### Discovery

`UI-025` passed at normal speed but failed with `--slowmo 1000`. The product-add
timer was still active when checkout created a newer message. The older timer
then cleared the checkout confirmation before the assertion and evidence step
could observe it.

This was not a locator problem or a reason to increase the assertion timeout.
The DOM correctly showed that the expected status message no longer existed.

### Correction

The portal now stores the active timeout reference, cancels it before scheduling
a newer toast, and clears the timeout during component cleanup.

```text
Old behavior: message A timer ───────────────> clears message B
New behavior: message B cancels timer A ─────> owns its full display window
```

### Outcome

The same test passed individually and in the complete 79-execution suite. The
test remained unchanged because its observable expectation was correct; the
product state management was fixed.

### Lesson

Headed mode and slow motion are learning and investigation tools, not stability
mechanisms. Timing changes can reveal product races, but synchronization should
still be based on observable state. A failing test should not be weakened until
the product behavior and evidence have been investigated.

## 5. Turning OpenAPI into an executable framework boundary

### Risk

Handwritten assertions can validate a few important fields while silently
accepting undocumented status codes, missing nested properties, invalid formats,
or response drift elsewhere in the payload. Reading a contract directly from
the repository would also prevent the framework from running unchanged against
a remote environment.

### Decision

The SUT publishes an OpenAPI 3.1 document, but the automation framework owns the
execution capability. `OpenApiContract` downloads the description through the
active `BASE_URL`, validates the document, resolves local references, and uses
JSON Schema Draft 2020-12 for request and response instances.

Response selection uses the complete operation identity:

```text
path + HTTP method + actual status -> JSON Schema -> payload validation
```

### Outcome

`CONTRACT-001` through `CONTRACT-004` add 16 executions covering description
integrity, all public reads, four mutation families, and diagnostic quality.
The informational API index and anonymous-cart contract are covered, bringing
route-operation coverage to `16/16`.

An intentional mismatch proves that failures identify the useful location:

```text
$.timestamp: 12345 is not of type 'string'
```

### Lesson

The OpenAPI file is not the portfolio feature by itself. The reusable adapter,
environment portability, status-aware validation, and actionable diagnostics
are the quality-engineering product. Schema tests complement focused business
assertions; they do not replace them.

## 6. Separating the automation product from the reference SUT

### Risk

The original package mixed generic reporting and contract utilities with
Lumbre selectors, API routes, fixtures, and tests. A second project would have
required copying the package or adding product conditionals to shared code.
Either choice would make the portfolio claim of a reusable framework difficult
to defend.

### Decision

The repository now enforces three explicit ownership zones:

```text
automation/             reusable core and Playwright adapters
projects/lumbre/        Lumbre client, objects, fixtures, and functional tests
tests/framework/        SUT-independent tests of the automation product
```

The root Pytest plugin registration is generic. Lumbre composes its own domain
fixtures in `projects/lumbre/conftest.py`, while `pyproject.toml` registers both
the framework and project test roots. Dependencies flow from a project into the
core, never from the core into a project.

### Outcome

The original 70 Lumbre executions remain intact, and eight focused executions
now protect settings resolution, OpenAPI diagnostics, and evidence logging.
Adding a new SUT has a documented path that does not require editing core
modules or copying reporting infrastructure.

### Lesson

Folders alone do not create a framework boundary. Reuse becomes credible when
dependency direction, fixture ownership, discovery, configuration, and
SUT-independent tests all express the same separation.

## 7. Preventing read-model metadata from leaking into writes

### Risk

The membership preference API deliberately returns operational metadata such
as `configured` and `updatedAt`, while its strict update contract accepts only
five editable fields. API tests passed because they submitted a purpose-built
request. The first UI persistence test failed because the React component
stored the complete read object and serialized it back into `PUT`, causing the
server to reject its own metadata with `422`.

### Decision

The UI now projects every API response through `editablePreferences()` before
placing it in editable state or serializing it:

```text
read model = editable fields + configured + updatedAt
                         |
                         v
write model = exactly five editable fields
```

The server keeps strict Zod validation. Weakening the API to ignore unknown
fields would have hidden the integration defect and allowed accidental client
state to cross the boundary.

### Outcome

`API-054` protects the request and response schemas directly. `UI-044` proves
that the actual browser form sends a valid request and restores the data after
reload. `UI-045` intercepts `PUT` with Playwright routing and proves that a
dependency failure retains every edited field for retry.

### Lesson

API and browser tests answer different questions. A valid API client fixture
does not prove that production UI state produces the same request. Keep strict
contracts and use an end-to-end test to expose read/write model leakage.
