# Playwright/Pytest · reusable automation core

Reviewed against the implementation on 2026-10-27. This directory owns reusable
tooling, not a second Lumbre suite. The repository [README](../README.md) owns
installation, commands, ports, CI lanes and current release evidence. The
[Lumbre catalog](projects/lumbre/README.md) owns the numbered feature cases.

~~~text
automation/core/                 Settings, reporting, generic HTTP/OpenAPI contracts
automation/adapters/playwright/  Browser/request fixtures and evidence integration
tests/framework/                Numbered, product-independent infrastructure tests
templates/                      Intentionally incomplete UI/API/page/component scaffolds
projects/lumbre/                Current portal/store POMs, inputs, fixtures and tests
pyproject.toml                  Dependencies, strict markers and default discovery
~~~

## Responsibility boundaries

Tests own business assertions and independent expected values. Pages compose
navigation; components expose semantic widget actions. Neither imports tests or
hides business assertions. The generic core never imports a project. Five core
case IDs and four Lumbre architecture contracts enforce settings, evidence,
OpenAPI validation, numbering, ownership and safe selection. They produce 18
executions without a running portal. Parameterization is not a new behavior ID.

Each UI test receives a fresh BrowserContext. Lumbre has no API reset fixture,
backend, account or internal cart. The reusable APIRequestContext and local
OpenAPI/JSON Schema helpers support other systems and synthetic unit contracts;
they do not imply a deployed Lumbre API. Do not restore retired backend tests.

## Configuration actually consumed

| Setting / option | Current behavior |
| --- | --- |
| BASE_URL | Normalized by Settings; generic fallback is http://127.0.0.1:3000. Lumbre runners/example configuration use 3001. |
| AUTOMATION_WORKER_BASE_URLS | Optional comma-separated, already-started isolated targets; app_url maps gw0, gw1, etc. Missing worker targets fail explicitly. |
| LOCALE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT | Context defaults; project fixtures may override the viewport for a case. |
| PLAYWRIGHT_PROXY | Optional context/request proxy; do not add credentials to tracked configuration or reports. |
| AUTOMATION_PROJECT | Report identity, not test selection. |
| --headed, --slowmo, --browser | pytest-playwright launch/observation options. |
| HEADLESS, DEFAULT_TIMEOUT_MS | Parsed by Settings, but the current adapter does not apply them to browser launch or Page timeouts. Do not rely on them for execution control. |

The adapter provides app_url, browser_context_args, api_request_context and
test_log; pytest-playwright supplies page/browser/context. Project fixtures add
their own SUT contracts. Installation uses the browser constraints file to align
Playwright with the CI image; pyproject alone permits a broader version range.

## Selection, execution and evidence

Default discovery includes tests/framework and projects/lumbre/tests. The default
marker expression is framework_unit or portal, so store is opt-in. Markers select
execution purpose; directories express ownership. New project paths alone do not
override that marker expression. See [adding a project](../docs/ADDING_A_PROJECT.md).

The managed local runner builds/owns the server and runs serially. Isolated CI
cases can use xdist; eight specialized groups sharing PDF paths run in a separate
serial lane. Do not pass -n to the complete local runner or share output files
between concurrent processes. Cross-browser repetitions overlap feature coverage.

test_log requires @pytest.mark.case(ID, behavior). Steps record timing, actual
and expected values and screenshots after completed UI steps. Pytest hooks add
the final result to HTML. Runner flags preserve failure traces/screenshots/videos
in their printed artifact paths. Screenshots/traces are not approved baselines
and may contain private data; use unauthenticated contexts and synthetic inputs.

## Writing conventions

- Use semantic locators scoped to their component; ambiguous selectors are defects.
- Use web-first expect for changing UI; assert for materialized Python data.
- Wait on observable state, not sleep or forced clicks. Headed/slowmo is not a fix.
- Keep expected contracts independent of the function under test.
- Preserve stable case IDs. Retired IDs are not recycled for unrelated behavior.
- Generic scaffolds contain TODO/skip placeholders: they are not active coverage.
- Never store auth state, real customer data, provider tokens or confidential recipes.

For examples, use [guided creation](../docs/GUIDED_UI_TEST_PROTOCOL.md) and
[current Playwright snippets](../docs/PLAYWRIGHT_PYTHON_SNIPPETS.md).
