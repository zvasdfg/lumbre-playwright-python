# Test framework architecture

The reusable Python/Pytest/Playwright core is separate from product knowledge.
Lumbre uses the original numbered, feature-separated project design.

```text
test-framework/
├── automation/
│   ├── core/                 Configuration, logging, reports and generic HTTP contracts
│   └── adapters/playwright/  Browser/request fixtures, contexts and evidence
├── tests/framework/          Tests of reusable infrastructure
├── templates/                Generic page/component/UI/API scaffolds
└── projects/lumbre/
    ├── pages/                Page navigation/composition
    ├── components/           Reusable UI actions; no business assertions
    ├── data/                 Independent scenario inputs
    ├── support/              Serialized specialized-script transport
    ├── conftest.py           Fresh contexts, viewport fixtures and target guards
    └── tests/ui/<feature>/   Numbered cases with business assertions
```

## Dependency direction

Tests use data and page/component objects. Page/component objects use Playwright,
not tests or scenario data. The automation core never imports a project.
Architecture checks enforce those boundaries, unique numbered IDs and explicit
local/store selection. Generic HTTP/OpenAPI helpers remain reusable for other
projects; Lumbre has no current API cases or API application implementation.

## Discovery and selection

One behavior per `test_ui_NNN_<behavior>.py`; its case decorator has the same ID.
Parameter combinations retain that ID. Feature folders describe ownership,
while strict Pytest markers select local portal, matrices, compatibility and
optional store checks. The default is `framework_unit or portal`.

## Execution and evidence

The local runner builds once, owns a temporary static preview on port 3001,
runs the selected tests and records HTML/JUnit/screenshots/traces. It refuses
an occupied preview port. Specialized PDF scripts use shared paths, so the
complete runner is sequential; matrix-only lanes can run independently.
Headed/slowmo settings reach both fixture-owned and specialized browsers.

Actions browser lanes consume the same validated build. Publication waits for
all lanes; the final hash check verifies which artifact actually went live.
External Tiendanube checks do not alter inventory or submit a cart/payment/order.

See [exact lanes and limits](STATIC_TEST_ARCHITECTURE.md),
[project guide](../test-framework/projects/lumbre/README.md),
[adding a project](ADDING_A_PROJECT.md) and [historical migration](TEST_MIGRATION_2026-10-09.md).
