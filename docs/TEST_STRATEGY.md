# Current test strategy

Lumbre's current product is the static portal plus purchase destinations in
Tiendanube. Tests cover current user behaviors, not absence of retired features.
The numbered cases remain in the original framework under feature ownership.

## Layers

1. Pure model tests validate arithmetic, data integrity and finite rule matrices.
2. Local browser tests validate user interactions against the actual built artifact.
3. Browser matrices traverse equipment/fuel choices, ingredients, recipes and
   almanac documents with explicit independent inputs.
4. Focused Firefox/WebKit checks validate keyboard, recovery and transitions.
5. Optional store checks validate the external purchase destination and gallery.

The portal is not retested on a public host after publication. A small artifact
hash check verifies publication. Security headers are preserved and validated
in build output, not removed with the obsolete backend probes.

## Risk priorities

High-value contracts include first-click navigation, gram/radar recalculation,
saved state and corrupted storage, fuel estimates and constraints, ingredient
counts, recipe/preparation completeness, reader boundaries and chunk failures,
accessible dialog behavior and printable A4 contents. Failure evidence is kept;
assertions are not weakened to hide actual defects.

## Coverage limits

Finite matrices are not every possible combination. Emulated mobile is not a
physical phone, DOM checks are not full WCAG compliance, and PDF text/bounds
checks are not a pixel-level layout audit. A read-only store suite cannot prove
checkout, shipping totals, payment, order confirmation or emails. Those need an
authorized sandbox or an explicitly approved manual run.

The current collection is 450 executions: 426 local/framework and 24 optional
store checks. Collection is not a passing execution. The cleanup validation
had 420 passed / 6 failed on Chromium/framework; custom-dialog focus defects
remain. The prior headed run had 419 passed / 7 failed and remains historical.
See [execution history](TEST_EXECUTION_HISTORY.md)
and [cleanup evidence](STATIC_RETIREMENT_2026-10-09.md).

See [test architecture](STATIC_TEST_ARCHITECTURE.md) for lane definitions and
[numbered project guide](../test-framework/projects/lumbre/README.md) for scope.
