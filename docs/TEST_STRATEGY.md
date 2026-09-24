# Lumbre Test Strategy

> Perspective: Staff QA architecture
> Stack: Python, Pytest, Playwright Sync API, Page Object Model, Component
> Objects, APIRequestContext, OpenAPI 3.1, and JSON Schema 2020-12

## 1. Purpose

The strategy protects meaningful Lumbre behavior while keeping the automation
framework useful as a Playwright learning environment. Tests must:

- protect a named product risk;
- run independently and in any order;
- use the cheapest layer that can detect the risk precisely;
- wait for observable conditions rather than elapsed time;
- keep business expectations visible in the test;
- produce evidence that explains failures.

The product UI is written in Mexican Spanish. Automation code, metadata, steps,
comments, and technical documentation are written in English. Spanish remains
in locators and expected values when it is part of the product contract.

## 2. Validated baseline

| Signal | Current result |
| --- | ---: |
| API case IDs / executions | 61 / 83 |
| Browser case IDs / executions | 47 / 51 |
| Framework unit case IDs / executions | 3 / 8 |
| Unique committed risks | 108 |
| Total Pytest executions | 142 |
| Test files | 107 |
| Supported engines | Chromium, Firefox, WebKit |
| Latest validation | 142 passed in 95.52 seconds |

Parameterized executions do not inflate risk coverage. `UI-011`, for example,
runs two close mechanisms but protects one committed behavior. Framework unit
checks measure automation-product quality and are intentionally excluded from
the Lumbre functional-risk denominator.

### Coverage definition

```text
functional-risk coverage = automated committed risks / committed risks × 100
```

A risk counts as automated only when it has stable case metadata, asserts an
observable result, runs independently, uses deterministic setup, and appears in
the catalog below.

| Priority | Automated | Committed | Coverage |
| --- | ---: | ---: | ---: |
| P0 | 59 | 59 | 100% |
| P1 | 43 | 43 | 100% |
| P2 | 6 | 6 | 100% |
| **Total** | **108** | **108** | **100%** |

This is functional-risk coverage, not Python or TypeScript line coverage. The
secondary API route-operation signal is `34/34 = 100%`. Contract
parametrization adds execution depth without inflating the functional-risk
denominator.

### Framework quality catalog

| ID | Reusable behavior protected | Executions |
| --- | --- | ---: |
| FRAMEWORK-001 | Environment settings resolve typed defaults and overrides | 3 |
| FRAMEWORK-002 | OpenAPI violations preserve actionable JSON-path diagnostics | 4 |
| FRAMEWORK-003 | Test evidence records case context, values, and step outcomes | 1 |

These tests run without starting Lumbre. A reusable capability is incomplete
until it has a focused SUT-independent check here.

## 3. Strategy principles

### Automate risks, not pages

Before adding a test, identify the failure it detects, its user or business
impact, the cheapest suitable layer, and the evidence that proves the result.

Use API tests for data rules, filtering, persistence, status codes, and response
contracts. Use UI tests when rendering, accessibility, browser events, network
integration, or user feedback are part of the risk.

### Prefer user-facing locator contracts

Use accessible roles, labels, text, placeholders, alt text, and explicit test
IDs before CSS or XPath. Treat strictness violations as ambiguity diagnostics;
do not hide them with `.first` unless position is the actual business rule.

### Keep every execution isolated

UI tests receive a fresh browser context. The local runner creates, migrates,
and seeds a temporary D1 state directory for the complete run. Tests must not
depend on another test, the developer database, or execution order.

### Synchronize with state

Locator actions auto-wait for actionability and Playwright assertions retry.
Arbitrary sleeps and `wait_for_timeout()` are not functional synchronization.

### Separate intent from mechanics

Tests select the behavior and own the oracle. Page and Component Objects own
selectors and reusable interactions. Fixtures own lifecycle and deterministic
setup. API clients own repeated transport details.

See [Architecture](ARCHITECTURE.md) for dependency direction, component
ownership, execution flows, and persistence isolation. See
[Key Playwright Notes](KEY_PLAYWRIGHT_NOTES.md) for the Selenium-to-Playwright
mental model and implementation principles.

Project onboarding and the ownership rules for fixtures, clients, objects, and
tests are documented in [Adding a project](ADDING_A_PROJECT.md).
New browser behaviors should follow the checkpoint-based
[Guided UI test creation protocol](GUIDED_UI_TEST_PROTOCOL.md).

## 4. Layer model

| Layer | Use it for | Avoid using it for |
| --- | --- | --- |
| API | Contracts, validation, filtering, creation, persistence | Browser rendering or accessibility |
| OpenAPI contract | Description integrity, request and status-specific response schemas | Business outcomes already owned by focused API tests |
| UI component | Widget behavior, state transitions, keyboard and feedback | Server rules already proven by API |
| E2E | A small number of critical browser-to-server journeys | Exhaustive data combinations |
| Cross-browser | Focused compatibility contracts | Repeating the entire deep suite by default |
| Network-controlled UI | Recovery, request payloads, deterministic failures | Testing the server's own implementation |

## 5. Committed functional-risk catalog

Priority definitions:

- **P0:** breaks a core user or system objective.
- **P1:** degrades an important behavior and belongs in regular regression.
- **P2:** secondary behavior, edge case, or specialized compatibility signal.

| ID | Automated behavior / protected risk | Priority | Layer |
| --- | --- | --- | --- |
| API-001 | Service publishes a valid health status | P0 | API + smoke |
| API-002 | Recipe category filtering returns only requested data | P1 | API |
| API-003 | Demo data reset restores a known seed | P0 | API |
| API-004 | Product creation rejects a non-positive price | P1 | API negative |
| API-005 | Recipe filtering combines category and query | P1 | API |
| API-006 | Valid membership data creates a member with `201` | P0 | API |
| API-007 | Ingredient filtering combines family and query | P1 | API |
| API-008 | Ingredient detail contains research and experiment data | P1 | API contract |
| API-009 | Formula validation reports duplicate and unknown items by position | P0 | API negative |
| API-010 | Ingredient order does not create a duplicate hypothesis | P0 | API persistence |
| API-011 | Registry identities remain unique and recommendations retain sources | P1 | API integrity |
| API-012 | Classic SPG duplicate counter persists through its resource endpoint | P1 | API persistence |
| API-013 | A unique formula creates and persists a hypothesis with `201` | P0 | API persistence |
| API-014 | An unknown hypothesis returns a stable `404` contract | P1 | API negative |
| API-015 | Malformed hypothesis JSON is rejected without mutation | P0 | API negative |
| API-016 | An unknown ingredient returns a stable `404` contract | P1 | API negative |
| API-017 | Product collection count and item contract remain consistent | P2 | API contract |
| API-018 | Valid product creation returns `201` and its representation | P1 | API positive |
| API-019 | Event collection count and item contract remain consistent | P2 | API contract |
| API-020 | Invalid membership variants return a stable `422` contract | P0 | API negative |
| API-021 | Health reports a ready D1 database with the expected seed version | P0 | API + persistence smoke |
| API-022 | Anonymous session cookie protects and restores its D1 cart | P0 | API + session persistence |
| API-023 | Cart rejects client prices and derives totals from the server catalog | P0 | API negative + integrity |
| API-024 | Repeated adds, quantity replacement, and removal persist correctly | P1 | API lifecycle |
| API-025 | A single-use magic link creates an authenticated customer session | P0 | API authentication |
| API-026 | Logout invalidates the active session without deleting the account | P0 | API authentication |
| API-027 | An anonymous cart becomes the authenticated account cart on sign-in | P0 | API + persistence |
| API-028 | Administrative account data enforces anonymous, customer, and admin boundaries | P0 | API authorization |
| API-029 | Matching anonymous and account cart items merge without duplicate lines | P1 | API + persistence |
| API-030 | An expired authenticated session no longer resolves an account | P0 | API authentication |
| API-031 | Anonymous requests cannot create or list account-owned orders | P0 | API authorization |
| API-032 | Order snapshots use server prices and reject client totals | P0 | API integrity + contract |
| API-033 | Replaying an order key creates only one persisted order | P0 | API idempotency |
| API-034 | A rejected payment fails the order and preserves its cart | P0 | API state transition + contract |
| API-035 | An approved payment is idempotent, persists history, and clears the cart once | P0 | API state transition + persistence |
| API-036 | Hosted Checkout Session creation is authenticated and idempotent without exposing card data | P0 | API integration + security |
| API-037 | Missing, invalid, and stale provider signatures cannot mutate payment state | P0 | API security negative |
| API-038 | A valid paid provider event transitions its order and clears the cart | P0 | API integration + state transition |
| API-039 | Replayed provider events are acknowledged without repeating their transition | P0 | API idempotency + persistence |
| API-040 | Provider amount mismatch is rejected while preserving the pending order and cart | P0 | API integrity negative |
| API-041 | Anonymous accounts cannot create or read event reservations | P0 | API authorization |
| API-042 | A confirmed reservation persists and reduces public availability | P0 | API state transition + persistence |
| API-043 | One account cannot reserve the same event or consume its capacity twice | P0 | API uniqueness + integrity |
| API-044 | A sold-out event rejects another account without overselling capacity | P0 | API concurrency boundary |
| API-045 | Invalid party sizes and unknown events cannot create reservations | P1 | API negative + validation |
| API-046 | Anonymous requests cannot list, save, synchronize, or delete fire-planner presets | P0 | API authorization |
| API-047 | An authenticated account persists and lists its fire-planner preset | P0 | API persistence + contract |
| API-048 | A normalized duplicate preset name updates one existing record | P1 | API uniqueness + persistence |
| API-049 | One account cannot observe or delete another account's preset | P0 | API ownership + authorization |
| API-050 | Browser-local sync imports missing names while server conflicts win | P0 | API merge integrity |
| API-051 | Invalid fire-planner configurations cannot be persisted | P1 | API negative + validation |
| API-052 | Anonymous requests cannot read or update membership preferences | P0 | API authorization |
| API-053 | New accounts receive safe defaults without implied newsletter consent | P1 | API privacy default + contract |
| API-054 | Account cooking preferences persist with an explicit consent event | P0 | API persistence + audit |
| API-055 | Consent history records initial choice and changes without duplicate events | P0 | API audit integrity |
| API-056 | Membership preferences cannot cross account boundaries | P0 | API ownership |
| API-057 | Invalid membership preferences cannot be persisted | P1 | API negative + validation |
| CONTRACT-001 | Published OpenAPI 3.1 description is structurally valid | P0 | Contract + smoke |
| CONTRACT-002 | Every public read response satisfies its JSON Schema | P0 | Contract parameterized |
| CONTRACT-003 | Mutation requests and successful responses satisfy one operation contract | P0 | Contract parameterized |
| CONTRACT-004 | Contract failures identify the exact JSON path and expectation | P1 | Framework diagnostic |
| UI-001 | Home communicates Lumbre's purpose | P1 | UI + smoke |
| UI-002 | Category filter displays matching recipe cards only | P1 | UI |
| UI-003 | Empty recipe search explains that no matches exist | P1 | UI |
| UI-004 | Visitor can join the club | P0 | E2E + smoke |
| UI-005 | Adding a product updates feedback and cart count | P0 | UI |
| UI-006 | Positive search displays one matching recipe | P1 | UI |
| UI-007 | Membership prevents submission without a name | P0 | UI validation |
| UI-008 | Cart removes an added product and returns to empty | P1 | UI |
| UI-009 | Cart totals multiple products correctly | P1 | UI |
| UI-010 | An authenticated event reservation confirms its party and updates availability | P1 | E2E |
| UI-011 | Membership modal closes by button and backdrop | P2 | UI parameterized |
| UI-012 | Fire planner recommends fuel for direct cooking | P1 | UI component |
| UI-013 | Membership follows a logical keyboard focus order | P1 | Accessibility |
| UI-014 | Membership sends the expected API request | P0 | UI network |
| UI-015 | Ingredient catalog combines family and search filters | P1 | UI |
| UI-016 | Ingredient sheet exposes research and adds to the formula | P1 | UI component |
| UI-017 | Experiment bench enforces the six-component limit | P0 | UI boundary |
| UI-018 | Known formula reuses its existing technical sheet | P0 | E2E deduplication |
| UI-019 | Unique formula creates and displays a technical sheet | P0 | E2E persistence |
| UI-020 | Fewer than two ingredients cannot create a sheet | P0 | UI boundary |
| UI-021 | Removing an ingredient updates the experiment bench | P1 | UI state |
| UI-022 | Registry opens the selected complete technical sheet | P1 | UI component |
| UI-023 | Slow-cooking mode applies its distinct fuel rate | P1 | UI calculation |
| UI-024 | Vegetable reserve changes the fuel recommendation | P1 | UI calculation |
| UI-025 | Anonymous checkout guides the shopper to account authentication | P2 | UI authorization guidance |
| UI-026 | Recipe feedback identifies the selected recipe | P2 | UI |
| UI-027 | Email and terms constraints prevent invalid submission | P0 | UI validation |
| UI-028 | Critical content remains usable without mobile overflow | P1 | Responsive UI |
| UI-029 | Recipe feedback can be dismissed through its accessible close control | P2 | UI component |
| UI-030 | Laboratory blends lead the store catalog before tools and merchandise | P1 | UI merchandising |
| UI-031 | Every laboratory ingredient uses its own specimen photograph | P1 | UI visual contract |
| UI-032 | Every store product has a distinct catalog photograph | P1 | UI merchandising |
| UI-033 | A saved fire-planner preset can be restored after a page reload | P0 | UI persistence |
| UI-034 | Recipe catalog exposes 100 unique recipes with distinct descriptive images | P1 | UI visual contract |
| UI-035 | Anonymous cart is restored after reloading the same browser session | P0 | E2E persistence |
| UI-036 | Independent browser contexts cannot observe each other's carts | P0 | E2E isolation |
| UI-037 | A visitor completes the passwordless account experience in one browser context | P0 | E2E authentication |
| UI-038 | A prepared Playwright `storage_state` restores an authenticated customer | P1 | UI fixture + authentication |
| UI-039 | An authenticated customer pays and sees the persisted order in account history | P0 | E2E checkout |
| UI-040 | An authenticated shopper follows the provider-hosted URL returned by the checkout API | P0 | UI + API integration |
| UI-041 | A confirmed reservation survives reload and appears in account history | P0 | E2E reservation persistence |
| UI-042 | An authenticated fire preset is restored in a second browser context | P0 | E2E account synchronization |
| UI-043 | A failed account preset save preserves retry data and reports no false success | P1 | UI route control + recoverability |
| UI-044 | Authenticated membership preferences survive a complete page reload | P0 | E2E preference persistence |
| UI-045 | A failed preference save preserves edited values for retry | P1 | UI route control + recoverability |
| ERR-001 | Membership API failure keeps the form available for retry | P1 | UI route control |
| BROWSER-001 | Critical home contract passes in all supported engines | P1 | Cross-browser |

Review the denominator whenever a route, interactive component, persistence
rule, supported engine, or viewport contract changes. Do not add risks only to
raise a percentage, and do not count retries or browser/data variants as new
risks unless they protect an independent contract.

## 6. Test conventions

### One behavior or equivalent contract family per file

Closely equivalent contracts may share a parameterized file when every dataset
retains its own case marker and Pytest ID. Unrelated behaviors remain isolated.

```text
test_<layer>_<first_id>_<behavior_or_contract_family>.py
```

### Express Arrange, Act, and Assert through observable steps

Use `test_log.step()` for meaningful actions and validations. Record relevant
inputs, actual values, and expected values before asserting. Never log secrets
or real personal information.

### Keep incomplete tests from passing

Scaffolds remain skipped until every TODO is implemented. `assert ...` is not a
safe placeholder because `Ellipsis` is truthy.

### Reject stability anti-patterns

Do not use arbitrary sleeps, unjustified `force=True`, brittle selectors,
shared mutable state, hidden assertions in action methods, or large generic
helpers such as `click_button(name)`.

## 7. Reporting and diagnosis

Every test declares `@pytest.mark.case(case_id, behavior)`. Reports include
case metadata, step logs, observed values, duration, and final URL. UI steps add
screenshots; UI failures also retain a full-page screenshot and Playwright
trace.

Investigate failures in this order:

1. failed case and named step;
2. observed values and oracle;
3. Playwright call log and exception;
4. step and failure screenshots;
5. trace timeline, DOM, console, and network;
6. test data, product readiness, and locator semantics.

Execution and report commands live in the root [README](../README.md). Detailed
framework configuration lives in the [framework README](../test-framework/README.md).

## 8. Review checklist

A new test is ready when:

- its ID exists in the risk catalog;
- its name describes behavior and result;
- it protects one primary risk;
- it passes independently and in the complete suite;
- reusable actions live in the correct framework layer;
- UI expectations use web-first assertions;
- API assertions validate status and relevant body fields;
- logs include useful actual and expected values;
- no secret, sleep, unjustified force, brittle selector, or false-positive TODO
  remains;
- failure artifacts explain what happened.

## References

- [Architecture](ARCHITECTURE.md)
- [Adding a project](ADDING_A_PROJECT.md)
- [Guided UI test creation protocol](GUIDED_UI_TEST_PROTOCOL.md)
- [Engineering case studies](ENGINEERING_CASE_STUDIES.md)
- [Key Playwright notes](KEY_PLAYWRIGHT_NOTES.md)
- [Playwright Python snippets](PLAYWRIGHT_PYTHON_SNIPPETS.md)
- [Playwright locators](https://playwright.dev/python/docs/locators)
- [Actionability](https://playwright.dev/python/docs/actionability)
- [Assertions](https://playwright.dev/python/docs/test-assertions)
- [Isolation](https://playwright.dev/python/docs/browser-contexts)
- [Page Object Model](https://playwright.dev/python/docs/pom)
- [API testing](https://playwright.dev/python/docs/api-testing)
- [Trace Viewer](https://playwright.dev/python/docs/trace-viewer-intro)
