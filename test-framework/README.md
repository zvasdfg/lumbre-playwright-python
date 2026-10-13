# Playwright/Pytest · reusable automation core

This directory owns reusable tooling; it is not another Lumbre test suite.
Use the repository [README](../README.md) for installation, feature coverage,
commands, ports, report locations and exact GitHub Actions execution lanes.

~~~text
automation/core/                 Settings, reporting and generic HTTP/OpenAPI contracts
automation/adapters/playwright/  Browser/request fixtures, isolation and evidence
tests/framework/                Numbered tests of reusable infrastructure
templates/                      Page/component/UI/API scaffolds
projects/lumbre/                Current portal/store adapters, cases and inputs
pyproject.toml                  Dependencies, strict markers and default discovery
~~~

## Ownership contracts

Tests own business assertions. Pages compose navigation; components own semantic
widget actions. They never import cases or hide assertions. The generic core does
not import any project. Framework and project architecture tests enforce these
rules, unique IDs and one matching behavior per numbered module.

Each UI test receives a fresh BrowserContext. Lumbre has no API reset fixture or
backend. Generic request/OpenAPI utilities remain available for other projects;
their presence is not evidence of a Lumbre API or account/cart implementation.

Equivalent input variants keep the same case ID. Tests of independent business
risks receive different IDs. Retired IDs are not recycled for unrelated behavior.
The canonical [Lumbre guide](projects/lumbre/README.md) enumerates active domains.

## Test-writing conventions

- Use semantic locators scoped to the owning component; strictness is diagnostic.
- Use web-first expect assertions for dynamic UI, plain assert for materialized data.
- Wait on observable state, not sleeps. Headed/slowmo is observation, not stability.
- Keep expected contracts independent of the function being tested.
- Use synthetic data. Do not save auth state, live customer data or provider tokens.
- Screenshots and traces are evidence, not automatically approved visual baselines.
- Generic UI/API scaffolds are intentionally incomplete; TODOs cannot pass as tests.
- Do not silently reuse another server or parallelize scripts sharing file paths.

See [adding a project](../docs/ADDING_A_PROJECT.md),
[guided test creation](../docs/GUIDED_UI_TEST_PROTOCOL.md) and
[Playwright snippets](../docs/PLAYWRIGHT_PYTHON_SNIPPETS.md).
