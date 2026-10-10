# Portal and store UI coverage

## Current organization — 2026-10-09

The active project follows `projects/lumbre/tests/ui/<feature>/test_ui_NNN`.
Local, matrix and optional Tiendanube selection uses strict Pytest markers under
this one tree. Obsolete backend cases have been removed after migration;
original sources are recoverable in Git at `aeaf9f4`, not deployment coverage.
See [active architecture](STATIC_TEST_ARCHITECTURE.md) and
[ID migration / current evidence](TEST_MIGRATION_2026-10-09.md).

## Coverage extension — 2026-10-09

UI-092…UI-104 add 177 executions in the original numbered feature tree.
Almanac now owns its reader component/POM, UI-055 and seven new reader behaviors;
all 53 documents are independently parametrized at two widths. Deferred chunk
failures, slow loading, failed illustration revisits, editorial notes, zoom and
keyboard are covered. Larger manual blends, multi-stage saved plans, accessible
DOM contracts and self-contained generated PDF checks are also implemented.
See the [case domains](../test-framework/projects/lumbre/README.md#coverage-extension--ui-092-through-ui-104)
and migration execution record for results and real defects. No application or
store configuration is changed by this extension. External checkout, physical
devices and approved screenshot baselines remain explicit gaps.

## Current retirement — 2026-10-09

The published-portal browser/HTTP duplicate checks and retired-route probes are
removed, along with their runners. Backend accounts/cart/payments/admin source
is retired. Build-output security-header validation and the post-deploy artifact
hash check remain. Optional external store checks cover only real Tiendanube
dependencies; they never alter stock or submit an order.

## Remaining gaps

- Resolve the exposed custom-dialog keyboard focus defects and investigate
  browser-specific failed-chunk recovery.
- Confirm recipe-to-blend scroll restoration in headed operation.
- Approved visual baselines, physical-phone testing and a complete WCAG audit.
- Authorized stocked checkout/payment/shipping/order/email sandbox testing.

The former implementation plans remain recoverable at checkpoint `5652edd`.
Current scope, counts and verification belong to [cleanup evidence](STATIC_RETIREMENT_2026-10-09.md).
