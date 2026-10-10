# Current test architecture

Revision 2026-10-09. Canonical active project: `test-framework/projects/lumbre`.

## Ownership

| Layer | Location | Responsibility |
| --- | --- | --- |
| Generic automation | `test-framework/automation/` | Configuration, browser adapters, reports; never product imports |
| Framework checks | `test-framework/tests/framework/` | Validate generic tools without starting the portal |
| Page objects | `projects/lumbre/pages/` | Page navigation and composition; no business assertions |
| Components | `projects/lumbre/components/` | Planner/laboratory/almanac actions; no business assertions or scenario dependencies |
| Inputs | `projects/lumbre/data/` | Independent configuration and ingredient catalog inputs |
| UI cases | `projects/lumbre/tests/ui/<feature>/` | One numbered `test_ui_NNN` behavior per file, assertions in the test |
| Technical support | `projects/lumbre/support/` | Subprocess transport for serialized specialized scripts |
| Pure model contracts | `portal/scripts/*.test.mjs` | Finite arithmetic/rule matrices without browsers |

Directories represent features, not execution categories. `matrix`,
`store`, `smoke`, `regression` and `cross_browser` are strict Pytest markers.
See [actual tree and commands](../test-framework/projects/lumbre/README.md).

## Execution lanes

All current lanes select the same canonical test tree, with no duplicate suite:

1. Build and model contracts.
2. Local general browser/print: `framework_unit or (portal and not matrix)`.
3. Parallel component lanes: `portal and matrix and planner_matrix`,
   `ingredients_matrix`, `recipes_matrix`, or `almanac_matrix`, against the same downloaded artifact.
4. Firefox/WebKit focused compatibility: `portal and cross_browser`.
5. Deploy only after every pre-release lane passes.
6. Verify published HTML/JavaScript hashes against the validated artifact.
7. Optional external Tiendanube: `store`, separate manual read-only workflow.

Default discovery includes framework plus current project; default marker selection
is `framework_unit or portal`. It does not run store checks by accident.
The active target guard rejects public URLs for local regressions. Public tests
require explicitly selected HTTPS. The retired backend suite and reset fixtures
are removed; the main local runner builds and serves only the static artifact.

## Numbering and retirement

Applicable original IDs remain UI-001…UI-062; unsupported original IDs are not
reused for unrelated features. New behaviors use UI-063 onward, and parameters
retain their behavior ID. API has its own sequence. Architecture checks enforce
unique active IDs, matching file names, one case per module and no legacy imports.
Unsupported backend cases, their parallel runner and backend-only workflow
were removed. Originals remain recoverable in Git at `aeaf9f4`.
The source-to-ID and original-case map is in [migration record](TEST_MIGRATION_2026-10-09.md).

The eight retained specialized groups now each own a numbered canonical file.
Their old scripts still own shared PDF paths and browser contexts, so they run
serially, never via xdist. Removing those scripts requires a separate verified
assertion/context migration; relocation alone is not evidence of that work.

## Coverage boundaries

Model assertions include 8,640 finite planner configurations and 1,770 ingredient
pairs. Browser matrices cover 48 equipment/fuel/goal tuples, all 60 ingredients,
all 100 recipe sheets, and all 53 almanac documents at mobile/desktop widths. These do not exhaust every duration, stage sequence,
ingredient subset, grams distribution, browser, viewport or device.
Focused compatibility is not the entire suite in all three engines. Screenshots
and traces are evidence, not approved visual-baseline assertions. Mobile emulation
is not physical-device testing. Store tests do not submit checkout, payment or
inventory writes. Those remain sandbox-dependent gaps.

Additional numbered contracts UI-092…UI-104 and their exact parameter domains
are listed in the [active project guide](../test-framework/projects/lumbre/README.md).
They include long blends, saved multi-stage plans, interrupted/slow reader assets,
keyboard containment and independent PDF generation/checks. UI-055 was relocated
from `home/` to `almanac/` without replacing its original behavior.

## Evidence

Current migration collection/run evidence: TEST_MIGRATION_2026-10-09.md.
Earlier executed revisions remain preserved in TEST_EXECUTION_HISTORY.md; their
old IDs, failures and counts must not be presented as the current result.
