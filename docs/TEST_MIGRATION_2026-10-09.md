# Test migration — 2026-10-09

## Coverage extension UI-092–UI-104

This subsequent user-requested extension keeps the original numbered,
feature-owned architecture. It adds 13 behavior modules / 177 parameterized
executions, moves UI-055 to `ui/almanac/` without changing its ID, adds the
interaction-only `FireAlmanac` POM, and extends Lab/Planner POM actions for grams
and stage metadata. Active totals: 67 UI/API behavior modules, four project
architecture contracts, 457 collected executions (426 local/framework and 31
external). The detailed case/input map is in the project README.

The fourth `almanac_matrix` CI lane uses the same prebuilt static artifact as the
other component lanes. Existing release gates remain required. New strict
`accessibility` and `print_pdf` markers do not create a parallel test tree.
`pypdf` is a Lumbre optional dependency and imported only when the PDF case runs;
the general browser CI requirements already pin it. No app/runtime files changed.

### Execution evidence

| Execution | Result | Evidence |
| --- | --- | --- |
| Complete local/framework suite | 416 passed / 10 failed; 27 min 19 s; 31 external deselected | [HTML](../test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/report.html), [XML](../test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/results.xml) |
| Final focused UI-094/UI-096/UI-101 in Chromium/Firefox/WebKit | 28 passed / 20 failed; 48 executions | [HTML](../test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/cross-browser-final/report.html), [XML](../test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/cross-browser-final/results.xml) |
| Final UI-103 PDF contracts | 5 passed | [HTML](../test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/pdf-final/report.html), [XML](../test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/pdf-final/results.xml) |
| Model/fuel/formula/families/store links/profile contracts | 53 passed | [Node log](../test-framework/reports/runs/lumbre-local-2026-10-09_16-13-38-15565/model-contracts.log) |

The full invocation collected modules before four test-development corrections:
two UI-096 product cases selected an ambiguous alert shared with the Lab; two
UI-103 blend cases compared CSS-uppercased aliases case-sensitively. These four
failures are preserved in the full report. The final scoped-alert and casefolded
content checks passed in the focused reruns against the same static artifact.
Considering those explicit reruns, the current local source has 420 passing
executions and six unresolved failures; this is NOT a single all-green run.
No failures are skipped, xfailed or rewritten as successes.

### Real product defects revealed

1. UI-101: the Almanac allows Tab to escape to background controls. Ingredient
   and saved-blend custom sheets do not receive focus on keyboard opening.
   These three dialog types fail at both widths in all three engines (18 focused
   failures; six Chromium executions in the full local run). Recipe dialogs pass
   the same opening/cycle/Escape/return contract in all three engines; the existing
   product-dialog contract remains in the suite. Failed early assertions do not
   prove later dismissal/restoration behavior for the three custom sheets.
2. UI-096: WebKit retains a failed `product-sheet` module after normal reload,
   for both aborted and HTTP-503 requests. The failure traces show no fresh module
   download and the product dialog never opens; related Lab error also remains.
   Chromium and Firefox pass all six outage/retry combinations. The existing
   Lab-specific cache-busting retry does not cover this shared product chunk.
3. Manual PDF review: all 12 pages across five final PDFs were rendered and
   inspected; no clipping/overlap was observed. The four-page plan places only
   the field-record form on page four, leaving excessive white space. This is a
   pagination/usability finding, not a failure of the content/origin-bound contract.

PDF assertions cover content, loaded images, A4 size, non-empty pages and text
origins within bounds, not all glyph extents/overlap. DOM assertions are not a
complete WCAG audit or approved screenshot baselines. The 12-ingredient blend
uses synthetic equal weights for persistence/bounds, not a culinary prescription.
The 53-document traversal checks rendered assets and notes, not technical claims
inside infographics. Real stocked checkout, external storefront and physical
devices remain outside this local execution. No inventory, cart, payment, order,
account, application fix, commit, push or deployment was performed.

Ruff, diff whitespace, runner shell syntax, workflow YAML parsing, static
build/boundary and all 53 Node contracts passed.
GitHub Actions changes are local and have not run remotely. CI will correctly
block release on the newly revealed defects until they are fixed. Evidence is
retained under local ignored `reports/runs/`, not committed as source artifacts.


## Subsequent cleanup requested by the user

After integration and a single full execution with 249 local/framework passes,
the user requested removal of suites that will no longer run. The temporary
`lumbre_legacy` archive (172 source/document files) was deleted, along with the
old backend parallel runner and backend-only Actions workflow. Seven historical
planner inspection/replay scripts using retired customization controls were also
removed; independent research fixtures and historical QA evidence remain. Backend reset/auth
fixtures and discovery exceptions are removed. Originals remain recoverable
from Git at `aeaf9f4`; the numbered current project remains the only test project.
`test-local.sh` now builds/serves the static artifact and executes the current
framework/portal suite, without D1 or backend setup. `report-local.sh` delegates
to that runner. Current store/production and specialized PDF/fuel regressions
remain: they still cover active behavior and are not obsolete duplicates.

Cleanup verification: the same 280 current executions collect. The updated
static local runner passed 22 framework/navigation-smoke executions; the final
18 framework/architecture checks and 53 JavaScript contracts passed. Shell syntax,
Ruff, snippet JSON and diff whitespace checks passed. The 249-case full local
execution preceded cleanup; it was not repeated after deleting retired cases.
No current functional test body was weakened or replaced. No commit or deployment
was performed as part of this cleanup.

The migration steps and initial archive validation below are historical evidence
of the integration, not a claim that the retired source is still on disk.

The current project is `test-framework/projects/lumbre`. UI cases live under
`tests/ui/<feature>/test_ui_NNN_<behavior>.py`; public HTTP contracts under
`tests/api/system/test_api_NNN_<behavior>.py`. Existing applicable UI IDs are
retained; new behavior starts at UI-063. UI-089 is unassigned, not a passing test.
Mobile/desktop/configuration variants keep the same behavior ID and appear as
separate parameterized executions in Pytest and reports.

The entire old project is preserved at `projects/lumbre_legacy`: original source,
IDs, API clients, component/page objects and backend-reset fixtures. No original
test is silently deleted or weakened. It is excluded from default discovery and
the static deployment pipeline. Its original local/parallel runners explicitly
select that project. Unsupported accounts, memberships, internal cart, orders,
events and admin mutations are NOT current product coverage and are not xfailed.
The active project has no automatic backend reset or authentication.

All 30 native behavior functions and the eight specialized parameter groups from
`lumbre_static` are relocated. Fixtures are centralized; test bodies and input
parameters are retained. The old `lumbre_static` test tree is removed, not left
as a duplicate suite. Pure JavaScript model tests remain next to portal models.

## Source-to-case map

Old paths below are relative to the former `projects/lumbre_static`.

| Previous ID | Previous source / behavior | Canonical ID | Canonical file |
| --- | --- | --- | --- |
| `STATIC-UI-001` | `tests/test_journeys.py::test_first_navigation` | `UI-063` | `test_ui_063_first_navigation.py` |
| `STATIC-UI-002` | `tests/test_journeys.py::test_planner_defaults_and_saved_round_trip` | `UI-012` | `test_ui_012_fire_planner_cooking_styles.py` |
| `STATIC-UI-003` | `tests/test_journeys.py::test_recipe_pagination_and_modal_return` | `UI-053` | `test_ui_053_recipe_catalog_paginates_six_at_a_time.py` |
| `STATIC-UI-004` | `tests/test_journeys.py::test_lab_search_recalculation_and_alias` | `UI-015` | `test_ui_015_ingredient_catalog_combines_filters.py` |
| `STATIC-UI-005` | `tests/test_journeys.py::test_recipe_search_and_filters` | `UI-002` | `test_ui_002_recipe_filters_matching_cards.py` |
| `STATIC-UI-006` | `tests/test_journeys.py::test_almanac_boundaries` | `UI-055` | `test_ui_055_fire_almanac_reads_page_by_page.py` |
| `MATRIX-UI-001` | `tests/test_component_matrix.py::test_planner_matrix` | `UI-064` | `test_ui_064_equipment_fuel_matrix.py` |
| `MATRIX-UI-002` | `tests/test_component_matrix.py::test_each_ingredient` | `UI-016` | `test_ui_016_ingredient_sheet_adds_to_formula.py` |
| `EDITOR-001` | `tests/test_editor_components.py::test_stages` | `UI-065` | `test_ui_065_stage_supports_and_units.py` |
| `EDITOR-002` | `tests/test_editor_components.py::test_stage_limit` | `UI-066` | `test_ui_066_stage_limit_restores_capacity.py` |
| `LIBRARY-001` | `tests/test_plan_library.py::test_library_transitions` | `UI-033` | `test_ui_033_fire_planner_presets_persist.py` |
| `LAB-STATE-001` | `tests/test_lab_transitions.py::test_selection_capacity` | `UI-017` | `test_ui_017_ingredient_formula_enforces_twelve_component_limit.py` |
| `LAB-STATE-002` | `tests/test_lab_transitions.py::test_duplicate_and_variant` | `UI-018` | `test_ui_018_existing_formula_reuses_hypothesis.py` |
| `LAB-STATE-003` | `tests/test_lab_transitions.py::test_heat_transition` | `UI-067` | `test_ui_067_cooking_heat_preserves_saved_formulas.py` |
| `LAB-STATE-004` | `tests/test_lab_transitions.py::test_multiple_peppers` | `UI-068` | `test_ui_068_weighted_pepper_radar_recalculates.py` |
| `LAB-MATCH-001` | `tests/test_lab_transitions.py::test_production_threshold` | `UI-069` | `test_ui_069_production_recommendation_threshold.py` |
| `LAB-BOUNDS-001` | `tests/test_lab_boundaries.py::test_invalid_quantities` | `UI-070` | `test_ui_070_invalid_quantities_and_alias_recover.py` |
| `PLAN-STATE-001` | `tests/test_planner_transitions.py::test_stale_result` | `UI-071` | `test_ui_071_configuration_invalidates_printable_result.py` |
| `PLAN-STATE-002` | `tests/test_planner_transitions.py::test_save_decisions` | `UI-072` | `test_ui_072_replace_or_copy_saved_plan.py` |
| `PLAN-STATE-003` | `tests/test_planner_transitions.py::test_concurrent_storage` | `UI-073` | `test_ui_073_concurrent_plan_changes_are_protected.py` |
| `CATALOG-001` | `tests/test_recipe_inventory.py::test_all_recipe_sheets` | `UI-034` | `test_ui_034_recipe_catalog_is_complete_and_visual.py` |
| `BOUNDARY-001` | `tests/test_resilience_accessibility.py::test_duration_bounds_and_recovery` | `UI-074` | `test_ui_074_duration_bounds_and_recovery.py` |
| `QUICK-001` | `tests/test_resilience_accessibility.py::test_quick_plan_transitions` | `UI-075` | `test_ui_075_quick_plan_transitions.py` |
| `KEYBOARD-001` | `tests/test_resilience_accessibility.py::test_product_keyboard_modal` | `UI-076` | `test_ui_076_product_modal_keyboard_focus.py` |
| `NETWORK-001` | `tests/test_resilience_accessibility.py::test_lab_failed_chunk_retry` | `UI-077` | `test_ui_077_laboratory_chunk_failure_recovers.py` |
| `STORE-UI-001` | `store/test_store_contract.py::test_store_product_and_return` | `UI-086` | `test_ui_086_store_product_and_return.py` |
| `STORE-UI-002` | `store/test_store_contract.py::test_product_gallery` | `UI-087` | `test_ui_087_store_product_gallery.py` |
| `STATIC-REMOTE-003` | `remote_smoke/test_public_portal.py::test_catalog` | `UI-088` | `test_ui_088_published_catalog_and_purchase_links.py` |
| `STATIC-REMOTE-001` | `remote_smoke/test_public_portal.py::test_static_document` | `API-090` | `test_api_090_static_document_security_headers.py` |
| `STATIC-REMOTE-002` | `remote_smoke/test_public_portal.py::test_no_backend` | `API-091` | `test_api_091_retired_backend_routes_are_absent.py` |
| `STATIC-REG-001` | `tests/test_specialized_regressions.py::test-static.py, check-static-print.py` | `UI-078` | `test_ui_078_static_portal_and_print.py` |
| `STATIC-REG-001` | `tests/test_specialized_regressions.py::test-storage-recovery.py` | `UI-079` | `test_ui_079_storage_failure_recovery.py` |
| `STATIC-REG-001` | `tests/test_specialized_regressions.py::test-planner-goals.py` | `UI-080` | `test_ui_080_goal_constraints_and_print.py` |
| `STATIC-REG-001` | `tests/test_specialized_regressions.py::test-planner-simple.py` | `UI-081` | `test_ui_081_simplified_controls_and_units.py` |
| `STATIC-REG-001` | `tests/test_specialized_regressions.py::test-planner-fuel.py` | `UI-082` | `test_ui_082_fuel_estimation_regression.py` |
| `STATIC-REG-001` | `tests/test_specialized_regressions.py::test-planner-kettle-fuel.py` | `UI-083` | `test_ui_083_kettle_size_and_fuel_estimate.py` |
| `STATIC-REG-001` | `tests/test_specialized_regressions.py::test-planner-weber-defaults.py` | `UI-084` | `test_ui_084_weber_defaults_regression.py` |
| `STATIC-REG-001` | `tests/test_specialized_regressions.py::test-recipe-blend-back.py` | `UI-085` | `test_ui_085_recipe_blend_return_regression.py` |

## Selection and safety

Default Pytest selection is `framework_unit or portal`, not store/production.
Local general CI: `framework_unit or (portal and not matrix)`.
Matrix CI: `portal and matrix and planner_matrix` (or ingredients/recipes matrix).
Compatibility: `portal and cross_browser` in Chromium, Firefox and WebKit.
Published acceptance: `production and smoke`. External store: `store`.
Local and remote targets are validated before navigation. No production reset,
cart writes, purchase submission, inventory mutation or payment is authorized.

The serialized specialized adapters retain their scripts because they still own
shared PDF paths and multiple browser contexts. Each now has its own numbered
test file. They are not interchangeable with xdist parallel cases.

## Verification

Baseline before relocation: 244 collected executions including framework,
current local UI, public acceptance and public store (Chromium). Collection is
not execution. Final collection: 280 executions, of which default selection
chooses 249 local/framework executions and deselects 31 external executions.
The active project has 54 numbered modules (52 UI and two HTTP/API), plus four
architecture contracts. These are behavior counts, not a claim of exhaustive
combinatorial coverage.

Validated locally against a freshly built static artifact:

| Execution | Result | Evidence |
| --- | --- | --- |
| Initial general suite | 128 passed, four failed | `/tmp/lumbre-migration-core.xml` |
| Corrected and additional original cases | 12 passed | `/tmp/lumbre-migration-originals-final.xml` |
| Extended equipment/ingredients/recipe traversal | 109 passed | `/tmp/lumbre-migration-matrix.xml` |
| Focused Chromium/Firefox/WebKit compatibility | 24 passed | `/tmp/lumbre-migration-cross.xml` |
| Final generic framework and project architecture | 18 passed | `/tmp/lumbre-migration-architecture-final.xml` |
| Node model/profile/store-link contracts | 53 passed | `/tmp/lumbre-migration-model.log` |

The 249 default executions passed across the general, supplemental and matrix
runs, not in one uninterrupted all-green run. The 18 framework contracts are
included in 249; compatibility repeats eight focused cases in three engines.
Initial UI-032 failures required waiting for lazy images after scrolling;
UI-052 required selecting the actual nested footer instead of an absent implicit
landmark. A supplemental UI-019 setup failure was corrected by providing explicit
synthetic quantities for a salt/cumin pair without an automatic reference. No
application behavior was changed to make these tests pass. Failed evidence is
retained alongside the successful reruns.

External acceptance/store execution could not be validated: public navigation
returned ENETUNREACH/ERR_ADDRESS_UNREACHABLE, and IPv4 checks to both public hosts
timed out. Seven published-portal and 24 store executions collect successfully,
but are pending an environment with connectivity. They are not skipped or marked
as passing; `/tmp/lumbre-migration-external.log` records the interrupted attempt.

Source-parity verification confirms all 30 native migrated behavior bodies and
input decorators, and 171 original project files preserved in the archive.
Static build, Ruff, workflow YAML parsing, shell syntax and diff whitespace
checks passed. Deployment gates remain unchanged. GitHub Actions was updated
locally but has not run these changes; no commit, push or deployment was performed.
Evidence paths above are local temporary artifacts, not durable CI artifacts.

## Original cases updated in place

UI-001 purpose and entry points; UI-002 recipe filters; UI-003 empty query;
UI-006 title search; UI-012 cooking goals/defaults; UI-015 laboratory search;
UI-016 every ingredient sheet/add/remove; UI-017 current twelve-ingredient cap;
UI-018 duplicate and variant preservation; UI-019 named local session;
UI-020 minimum two ingredients; UI-021 ingredient removal/recalculation;
UI-022 saved document/alias/grams/radar;
UI-026 actual recipe dialog instead of a retired toast; UI-028 narrow mobile UI;
UI-029 dialog dismissal/focus instead of a retired toast; UI-030 production catalog;
UI-031 unique ingredient photos; UI-032 loaded distinct product photos;
UI-033 browser-local saved plans; UI-034 complete recipe inventory;
UI-052 current local-storage/Tiendanube privacy disclosure instead of the retired
backend privacy page; UI-053 pagination and modal return; UI-054 expandable cumin
family; UI-055 almanac page boundaries; UI-060 A4 preview/browser printing.
These are 26 original IDs updated for the current portal. Remaining unsupported original IDs stay
only in the legacy project; they have not been reassigned to unrelated behavior.

## Disposition of every original UI case

| ID | Original file under legacy UI | Disposition at migration |
| --- | --- | --- |
| `BROWSER-001` | `home/test_browser_001_smoke_engines.py` | Retired after migration; recoverable in Git |
| `ERR-001` | `membership/test_err_001_membership_server_error.py` | Retired after migration; recoverable in Git |
| `UI-001` | `home/test_ui_001_home_communicates_club_purpose.py` | Updated current behavior |
| `UI-002` | `recipes/test_ui_002_recipe_filters_matching_cards.py` | Updated current behavior |
| `UI-003` | `recipes/test_ui_003_recipe_search_empty_state.py` | Updated current behavior |
| `UI-004` | `membership/test_ui_004_member_joins_club.py` | Retired after migration; recoverable in Git |
| `UI-005` | `commerce/test_ui_005_product_added_to_cart.py` | Retired after migration; recoverable in Git |
| `UI-006` | `recipes/test_ui_006_recipe_search_finds_recipe.py` | Updated current behavior |
| `UI-007` | `membership/test_ui_007_membership_constraint_validations.py` | Retired after migration; recoverable in Git |
| `UI-008` | `commerce/test_ui_008_cart_removes_product.py` | Retired after migration; recoverable in Git |
| `UI-009` | `commerce/test_ui_009_cart_total_multiple_products.py` | Retired after migration; recoverable in Git |
| `UI-011` | `membership/test_ui_011_membership_modal_closes.py` | Retired after migration; recoverable in Git |
| `UI-012` | `fire_planner/test_ui_012_fire_planner_cooking_styles.py` | Updated current behavior |
| `UI-013` | `membership/test_ui_013_membership_keyboard_focus_order.py` | Retired after migration; recoverable in Git |
| `UI-014` | `membership/test_ui_014_membership_submits_expected_request.py` | Retired after migration; recoverable in Git |
| `UI-015` | `ingredient_lab/test_ui_015_ingredient_catalog_combines_filters.py` | Updated current behavior |
| `UI-016` | `ingredient_lab/test_ui_016_ingredient_sheet_adds_to_formula.py` | Updated current behavior |
| `UI-017` | `ingredient_lab/test_ui_017_ingredient_formula_enforces_six_component_limit.py` | Updated current behavior |
| `UI-018` | `ingredient_lab/test_ui_018_existing_formula_reuses_hypothesis.py` | Updated current behavior |
| `UI-019` | `ingredient_lab/test_ui_019_unique_formula_creates_hypothesis.py` | Updated current behavior |
| `UI-020` | `ingredient_lab/test_ui_020_formula_requires_two_ingredients.py` | Updated current behavior |
| `UI-021` | `ingredient_lab/test_ui_021_selected_ingredient_can_be_removed.py` | Updated current behavior |
| `UI-022` | `ingredient_lab/test_ui_022_registry_opens_complete_hypothesis.py` | Updated current behavior |
| `UI-023` | `fire_planner/test_ui_012_fire_planner_cooking_styles.py` | Retired after migration; recoverable in Git |
| `UI-024` | `fire_planner/test_ui_024_vegetable_reserve_changes_fuel.py` | Retired after migration; recoverable in Git |
| `UI-025` | `commerce/test_ui_025_checkout_communicates_completion.py` | Retired after migration; recoverable in Git |
| `UI-026` | `recipes/test_ui_026_recipe_action_identifies_selection.py` | Updated current behavior |
| `UI-027` | `membership/test_ui_007_membership_constraint_validations.py` | Retired after migration; recoverable in Git |
| `UI-028` | `home/test_ui_028_mobile_viewport_keeps_critical_content_usable.py` | Updated current behavior |
| `UI-029` | `recipes/test_ui_029_recipe_feedback_can_be_dismissed.py` | Updated current behavior |
| `UI-030` | `commerce/test_ui_030_blends_lead_store_catalog.py` | Updated current behavior |
| `UI-031` | `ingredient_lab/test_ui_031_ingredients_have_unique_specimen_images.py` | Updated current behavior |
| `UI-032` | `commerce/test_ui_032_store_products_have_unique_images.py` | Updated current behavior |
| `UI-033` | `fire_planner/test_ui_033_fire_planner_presets_persist.py` | Updated current behavior |
| `UI-034` | `recipes/test_ui_034_recipe_catalog_is_complete_and_visual.py` | Updated current behavior |
| `UI-035` | `commerce/test_ui_035_cart_survives_reload.py` | Retired after migration; recoverable in Git |
| `UI-036` | `commerce/test_ui_036_cart_isolated_between_contexts.py` | Retired after migration; recoverable in Git |
| `UI-037` | `account/test_ui_037_passwordless_account_sign_in.py` | Retired after migration; recoverable in Git |
| `UI-038` | `account/test_ui_038_authenticated_storage_state.py` | Retired after migration; recoverable in Git |
| `UI-039` | `commerce/test_ui_039_authenticated_checkout_persists_order.py` | Retired after migration; recoverable in Git |
| `UI-040` | `commerce/test_ui_040_hosted_checkout_redirects.py` | Retired after migration; recoverable in Git |
| `UI-041` | `events/test_ui_041_reservation_persists_in_account.py` | Retired after migration; recoverable in Git |
| `UI-042` | `fire_planner/test_ui_042_account_fire_preset_syncs_across_contexts.py` | Retired after migration; recoverable in Git |
| `UI-043` | `fire_planner/test_ui_043_account_preset_save_failure_is_recoverable.py` | Retired after migration; recoverable in Git |
| `UI-044` | `account/test_ui_044_membership_preferences_persist.py` | Retired after migration; recoverable in Git |
| `UI-045` | `account/test_ui_045_preference_save_failure_is_recoverable.py` | Retired after migration; recoverable in Git |
| `UI-046` | `admin_catalog/test_ui_046_admin_catalog_control_is_role_specific.py` | Retired after migration; recoverable in Git |
| `UI-047` | `admin_catalog/test_ui_047_product_update_reaches_public_catalog.py` | Retired after migration; recoverable in Git |
| `UI-048` | `admin_catalog/test_ui_048_stale_product_update_is_recoverable.py` | Retired after migration; recoverable in Git |
| `UI-049` | `admin_catalog/test_ui_049_deactivated_event_leaves_public_agenda.py` | Retired after migration; recoverable in Git |
| `UI-050` | `admin_catalog/test_ui_050_sold_out_product_is_not_actionable.py` | Retired after migration; recoverable in Git |
| `UI-051` | `commerce/test_ui_051_customer_cancels_pending_order.py` | Retired after migration; recoverable in Git |
| `UI-052` | `home/test_ui_052_privacy_scope_is_accessible.py` | Updated current behavior |
| `UI-053` | `recipes/test_ui_053_recipe_catalog_paginates_six_at_a_time.py` | Updated current behavior |
| `UI-054` | `ingredient_lab/test_ui_054_lab_families_collapse_and_expose_cumin.py` | Updated current behavior |
| `UI-055` | `home/test_ui_055_fire_almanac_reads_page_by_page.py` | Updated current behavior |
| `UI-056` | `ingredient_lab/test_ui_056_account_saves_private_blend.py` | Retired after migration; recoverable in Git |
| `UI-057` | `admin_catalog/test_ui_057_admin_publishes_submitted_blend.py` | Retired after migration; recoverable in Git |
| `UI-058` | `home/test_ui_058_sections_follow_responsive_viewport_rhythm.py` | Retired after migration; recoverable in Git |
| `UI-059` | `account/test_ui_059_sign_in_and_sign_up_are_distinct.py` | Retired after migration; recoverable in Git |
| `UI-060` | `ingredient_lab/test_ui_060_hypothesis_sheet_prints_from_preview.py` | Updated current behavior |
| `UI-061` | `ingredient_lab/test_ui_061_production_products_are_publicly_archived.py` | Retired after migration; recoverable in Git |
| `UI-062` | `admin_catalog/test_ui_062_admin_authors_product.py` | Retired after migration; recoverable in Git |
