# Lumbre Test Coverage Growth Plan

> Baseline date: July 15, 2026  
> Target: at least 90% committed functional-risk coverage — achieved  
> Current baseline: 100% (50 automated risks out of 50 committed risks)

## 1. Purpose

This document defines what “90% test coverage” means for Lumbre and records the
completed expansion from the original 62% baseline to 100% of the committed
functional-risk catalog.

The primary metric is **functional-risk coverage**, not Python or TypeScript
line coverage. Line coverage of Page Objects, API wrappers, or React components
can be useful as a secondary engineering signal, but it does not prove that a
user journey, API rule, browser event, or persistence contract is protected.

## 2. Coverage definition

A committed risk is counted as covered only when:

- it has a unique case ID and one primary behavioral objective;
- an automated test asserts the observable result, not only that an action ran;
- the test is collected and passes independently;
- required setup and cleanup are deterministic;
- the test runs in the layer assigned by the risk catalog;
- the case is represented in the strategy inventory and produces diagnostic
  evidence through the existing reporting system.

The formula is:

```text
functional-risk coverage = automated committed risks / total committed risks × 100
```

Parameterized executions do not inflate coverage. `UI-011`, for example, runs
twice but protects one risk: the membership modal supports its documented close
mechanisms.

## 3. Current baseline

Pytest collection currently reports:

- 20 API case IDs (`API-001` through `API-020`);
- 28 standard UI case IDs (`UI-001` through `UI-028`);
- 1 UI error-path case (`ERR-001`);
- 1 cross-browser case (`BROWSER-001`);
- 50 unique automated risks;
- 56 executions because `API-020`, `UI-011`, `UI-027`, and `BROWSER-001`
  have parameterized variants.

All 50 committed risks are automated.

| View | Automated | Committed | Coverage |
| --- | ---: | ---: | ---: |
| API behavior | 20 | 20 | 100% |
| UI behavior, including recoverability | 29 | 29 | 100% |
| Cross-browser compatibility | 1 | 1 | 100% |
| **Overall functional-risk coverage** | **50** | **50** | **100%** |

Risk-priority coverage exposes a more important gap than the overall number:

| Priority | Automated | Committed | Coverage | Interpretation |
| --- | ---: | ---: | ---: | --- |
| P0 | 17 | 17 | 100% | Every critical committed risk is automated |
| P1 | 28 | 28 | 100% | Core regression protection is complete |
| P2 | 5 | 5 | 100% | The committed secondary behaviors are automated |
| **Total** | **50** | **50** | **100%** | The 90% objective is exceeded |

### Secondary route-operation signal

The portal publishes 12 HTTP route operations. Tests currently exercise 11 of
them, so route-operation coverage is `11/12 = 91.7%`.

The only uncovered route operation is `GET /api`, an informational discovery
document rather than a committed product behavior.

This is not the primary coverage number. An operation can be touched while
important positive, negative, boundary, or persistence behaviors remain
untested.

## 4. Current automated catalog (50 risks)

The automated denominator contribution is fixed by these unique IDs:

| Layer | Automated case IDs | Count |
| --- | --- | ---: |
| API | API-001 through API-020 | 20 |
| UI | UI-001 through UI-028 | 28 |
| UI recoverability | ERR-001 | 1 |
| Cross-browser | BROWSER-001 | 1 |
| **Total** |  | **50** |

The detailed behavior and technique for each existing case remains in
`docs/TEST_STRATEGY_AND_PLAYWRIGHT_GUIDE.md`.

## 5. Completed catalog expansion (19 risks)

These risks formed the original gap between 62% and 100%. They remain listed to
preserve the decision history and traceability of the coverage expansion.

| ID | Automated behavior / protected risk | Priority | Layer | Status |
| --- | --- | --- | --- | --- |
| API-013 | A new unique hypothesis is persisted and returns `201` | P0 | API persistence | Automated |
| API-014 | An unknown hypothesis ID returns a stable `404` contract | P1 | API negative | Automated |
| API-015 | Malformed or structurally invalid hypothesis input is rejected without mutation | P0 | API negative | Automated |
| API-016 | An unknown ingredient ID returns a stable `404` contract | P1 | API negative | Automated |
| API-017 | Product collection returns its count and product contract | P2 | API contract | Automated |
| API-018 | A valid product payload returns `201` and the created representation | P1 | API positive | Automated |
| API-019 | Event collection returns its count and event contract | P2 | API contract | Automated |
| API-020 | Invalid membership data returns `422` and creates no member | P0 | API negative | Automated |
| UI-019 | A unique ingredient formula creates and displays a new technical sheet | P0 | E2E | Automated |
| UI-020 | Fewer than two ingredients cannot create a technical sheet | P0 | UI boundary | Automated |
| UI-021 | A selected ingredient can be removed and the bench state is updated | P1 | UI state | Automated |
| UI-022 | The hypothesis registry opens the selected complete technical sheet | P1 | UI Component Object | Automated |
| UI-023 | Slow-cooking mode calculates its distinct fuel recommendation | P1 | UI boundary | Automated |
| UI-024 | Adding vegetables changes the planner fuel reserve | P1 | UI calculation | Automated |
| UI-025 | The demonstration checkout communicates its observable completion state | P2 | UI | Automated |
| UI-026 | The recipe call to action identifies the selected recipe in feedback | P2 | UI | Automated |
| UI-027 | Membership email and terms constraints prevent invalid submission | P0 | UI validation | Automated |
| UI-028 | Critical content and controls remain usable at the supported mobile viewport | P1 | Responsive UI | Automated |
| BROWSER-001 | The smoke set passes in Chromium, Firefox, and WebKit | P1 | Cross-browser | Automated |

The first 14 cases reached the original milestone:

```text
(31 current + 14 new) / 50 committed = 45 / 50 = 90%
```

The remaining five cases were also completed:

```text
50 / 50 committed risks = 100%
```

## 6. Completed delivery plan

### Phase 1 — Close data-integrity and validation gaps — completed

Target after phase: `37/50 = 74%`.

1. API-013 — new hypothesis persistence and `201`.
2. API-015 — invalid hypothesis payload without filesystem mutation.
3. API-020 — invalid membership contract.
4. UI-019 — new hypothesis creation through the browser.
5. UI-020 — minimum ingredient boundary.
6. UI-027 — email and terms browser validation.

Learning focus:

- API status and error contracts;
- filesystem-state before/after assertions;
- `expect_response()` for a `201` browser-to-API integration;
- boundary-value analysis;
- browser-native constraint validation.

### Phase 2 — Complete resource and component behavior — completed

Target after phase: `43/50 = 86%`.

1. API-014 — unknown hypothesis.
2. API-016 — unknown ingredient.
3. API-018 — valid product creation.
4. UI-021 — remove an ingredient from the experiment bench.
5. UI-022 — open the selected registry sheet.
6. UI-023 — slow-cooking planner calculation.

Learning focus:

- stable negative-resource contracts;
- Component Object growth without leaking locators into tests;
- collection scoping and identity assertions;
- table-driven calculation oracles.

### Phase 3 — Reach and defend 90% — completed

Target after phase: `45/50 = 90%`.

1. UI-028 — supported mobile viewport.
2. BROWSER-001 — smoke coverage in all three Playwright engines.

Learning focus:

- project-level viewport configuration;
- browser projects and marker selection;
- distinguishing product defects from engine-specific behavior;
- keeping the smoke suite small and high signal.

### Phase 4 — Close the deferred catalog — completed

Final coverage: `50/50 = 100%`.

1. API-017 — product collection contract.
2. API-019 — event collection contract.
3. UI-024 — vegetable fuel reserve.
4. UI-025 — demonstration checkout feedback.
5. UI-026 — recipe-specific action feedback.

## 7. Quality gates

Coverage does not increase when a new test is skipped, flaky, order-dependent,
or unable to explain its failure. A case enters the numerator only when all of
these gates pass:

1. The case passes alone three consecutive times.
2. The case passes in its layer suite.
3. The complete suite remains green.
4. No arbitrary sleep or unjustified `force=True` is introduced.
5. Logs expose relevant inputs, observed values, and expected values.
6. UI steps produce useful screenshots; failures retain a trace.
7. Mutable hypothesis data uses the temporary registry supplied by the local
   runner.
8. The risk matrix and this plan are updated in the same change.

Recommended local checks:

```bash
# Verify the execution and unique-case baseline
cd test-framework
.venv/bin/pytest --collect-only -q

# Run by layer
cd ..
./scripts/test-local.sh -q -m api
./scripts/test-local.sh -q -m ui

# Run the full regression and generate evidence
./scripts/test-local.sh -q
./scripts/report-local.sh

# Static framework quality
cd test-framework
.venv/bin/ruff format --check framework tests
.venv/bin/ruff check framework tests
.venv/bin/mypy framework tests
```

## 8. Metric maintenance

Review this catalog whenever a route, interactive component, persistence rule,
or supported browser/viewport is added or changed.

- Add the product risk to the denominator before or with implementation.
- Do not add a case solely to improve the percentage; it must protect a named
  risk.
- Do not count retries, browsers, data variants, or parametrized executions as
  separate risks unless they represent independent product contracts.
- Track P0 and P1 coverage separately; overall 90% is not acceptable if a P0
  risk remains unintentionally uncovered.
- Recalculate from case IDs and committed risks, not from the number of files or
  raw Pytest executions.

## 9. Exit criteria for the 90% milestone

The milestone was completed with:

- all 50 committed risks automated and green;
- all 17 P0 risks are automated;
- the complete suite passes from a clean local checkout;
- the smoke set passes in Chromium, Firefox, and WebKit;
- the HTML report contains evidence for every executed case;
- there are no undocumented skips, expected failures, or quarantined P0/P1
  cases;
- the coverage calculation and inventory are updated in documentation.

Validated execution baseline: **56 passed in 30.70 seconds**.
