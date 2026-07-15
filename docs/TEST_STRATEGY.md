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
| API case IDs / executions | 24 / 36 |
| Browser case IDs / executions | 30 / 34 |
| Unique committed risks | 54 |
| Total Pytest executions | 70 |
| Test files | 50 |
| Supported engines | Chromium, Firefox, WebKit |
| Latest validation | 70 passed |

Parameterized executions do not inflate risk coverage. `UI-011`, for example,
runs two close mechanisms but protects one committed behavior.

### Coverage definition

```text
functional-risk coverage = automated committed risks / committed risks × 100
```

A risk counts as automated only when it has stable case metadata, asserts an
observable result, runs independently, uses deterministic setup, and appears in
the catalog below.

| Priority | Automated | Committed | Coverage |
| --- | ---: | ---: | ---: |
| P0 | 20 | 20 | 100% |
| P1 | 29 | 29 | 100% |
| P2 | 5 | 5 | 100% |
| **Total** | **54** | **54** | **100%** |

This is functional-risk coverage, not Python or TypeScript line coverage. The
secondary API route-operation signal is `12/12 = 100%`. Contract
parametrization adds execution depth without inflating the functional-risk
denominator.

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

UI tests receive a fresh browser context. The local runner copies mutable
hypothesis JSON to a temporary directory. Tests must not depend on another test
or on execution order.

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
| UI-010 | Event reservation confirms the selected event | P1 | E2E |
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
| UI-025 | Demonstration checkout communicates completion | P2 | UI |
| UI-026 | Recipe feedback identifies the selected recipe | P2 | UI |
| UI-027 | Email and terms constraints prevent invalid submission | P0 | UI validation |
| UI-028 | Critical content remains usable without mobile overflow | P1 | Responsive UI |
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
