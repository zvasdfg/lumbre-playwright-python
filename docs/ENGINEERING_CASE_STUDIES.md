# Lumbre Engineering Case Studies

These case studies preserve the most useful design decisions and discoveries
from building the Lumbre Playwright framework. They focus on engineering
judgment rather than reproducing test implementation line by line.

## 1. Modeling the fire planner as a Component Object

### Risk

The fire planner is a modal with several related controls and a calculated
result. Putting its selectors and actions directly in a test would make the
scenario difficult to read. Putting all of them in `HomePage` would make the
page object grow into a model of every widget in the portal.

### Decision

The implementation introduced `FirePlannerModal`, scoped to its dialog root.
`HomePage` owns the action that opens the planner because the trigger belongs to
the page. The component owns guest count, cooking style, duration, vegetable
reserve, calculation, and recommendation state.

```text
HomePage
  └── opens ──> FirePlannerModal
                  ├── configures controls
                  ├── calculates
                  └── exposes recommendation locator
```

The normalized test remains responsible for the oracle. It configures the
component and asserts the expected fuel rather than hiding the assertion inside
the modal object.

### Playwright techniques

- dialog-scoped `get_by_role()` and `get_by_label()` locators;
- web-first visibility and text assertions;
- parametrization for equivalent direct-fire and slow-cooking contracts;
- before/after state comparison for the vegetable-reserve calculation.

### Outcome

`UI-012`, `UI-023`, and `UI-024` protect distinct calculation risks while
sharing a reusable component boundary. Adding a new cooking-style dataset does
not require duplicating selectors or creating a generic page-level helper.

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

The same test passed individually and in the complete 70-execution suite. The
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

`CONTRACT-001` through `CONTRACT-004` add 14 executions covering description
integrity, all public reads, three mutation families, and diagnostic quality.
The informational `GET /api` gap is now covered, bringing route-operation
coverage to `12/12`.

An intentional mismatch proves that failures identify the useful location:

```text
$.timestamp: 12345 is not of type 'string'
```

### Lesson

The OpenAPI file is not the portfolio feature by itself. The reusable adapter,
environment portability, status-aware validation, and actionable diagnostics
are the quality-engineering product. Schema tests complement focused business
assertions; they do not replace them.
