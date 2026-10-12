# Browser and CI corrections — 2026-10-12

Base: `914579b`. Owner authorized fixing dialog keyboard behavior and CI
execution while preserving tests and release gates. No store/inventory, Meta,
backend, content, formula or security-header mutation belongs to this change.

## Reproduction

Actions run `38013723249` passed its isolated install, type/model/build checks
and all four component matrices. Firefox/WebKit checks failed; the combined
browser/print job exceeded 20 minutes, so production was skipped.
Local reproduction: UI-101 had 18 failures across three engines; UI-096 had
two WebKit product-chunk recovery failures. These are independent of the
already corrected missing Zod dependency.

## Corrections

- Shared native dialog backdrop for almanac, ingredient and saved-blend sheets:
  initial focus, keyboard modality, Escape, trigger return and body-scroll release.
  Existing artwork, layouts and print presentation remain intact.
- Close on click, not mousedown: otherwise the rest of the pointer sequence
  can overwrite focus restoration. UI-095 exposed this in the first complete run.
- Reuse the laboratory's same-origin modulepreload-based recovery for deferred
  product, recipe and almanac modules, only after explicit reload. No fetch API,
  external origin, guessed asset hash or relaxed CSP was introduced.
- Lazy product import inside the laboratory: a rejected product module must not
  prevent the whole laboratory from loading. Repeated abort/503 outages and
  subsequent recovery retain local/session storage.
- Printable sheets disable scroll anchoring because return positioning is
  explicitly managed. Headed mobile UI-085 captured 1703 px at click but returned
  at 1688 px before the fix. The original less-than-3-pixel assertion remains;
  its script additionally requires the manual-restoration CSS contract.

## CI partition

Actual collected sets: 203 general + 8 serial + 215 matrix = 426 local/framework
executions. Their union equals the full local selection and their pairwise
intersections are empty. General cases use two isolated xdist workers; the
eight shared-file/PDF groups run in a separate serial job without xdist.
All five pre-release jobs still gate deployment. No case IDs, assertions or
unsupported-backend tests were removed or repurposed.

UI-101 now checks reopening, both close methods, backdrop return on desktop
and body-overflow restoration. UI-096 keeps recovery available during a repeated
outage. UI-095 is also selected in Firefox/WebKit. Workflow contracts require
the serial gate and reject parallel execution of its shared-file scripts.

## Local evidence and limits

Evidence: `/tmp/lumbre-ci-fixes-20261012/`, preserving baseline, intermediate
and final reports instead of overwriting earlier failures.

- Full native-dialog/recovery candidate: 418 isolated + 8 serial = **426 passed**;
  no errors/skips. Separate three-engine compatibility: **78 passed**.
- Additional headed check initially reproduced UI-085's historical mobile scroll
  defect. After the final CSS-only anchoring correction: **6 headed passed**.
  This final CSS correction is not misrepresented as another complete local run;
  Actions must validate the final immutable artifact before publishing it.
- Typecheck, static boundary/build, all 100 recipe integrity checks, 47 model/store
  contracts and nine profile/workflow contracts passed.
- YAML plus 21 shell steps parsed; changed Python tests passed Ruff.
- The experimental sheet's two pages were rendered with Poppler and visually
  checked for readable quantities/radar/footer and absence of clipping or overlap.
  Other printed documents have automated assertions, not a claimed full visual audit.
- Canonical data, brand/editorial assets and `_headers` have no Git diff.
- Local tools used the existing installation. Clean installation was confirmed
  by the prior Actions static-build job; the new run remains required for this revision.

Compatibility executions overlap Chromium cases in the full set; counts do not
mean 504 unique behaviors or exhaustive ingredient combinations. Optional store
checks and physical-device checkout were not run or mutated. Publication is
pending a successful new pipeline and artifact-hash verification.

## Follow-up: product identifier in PDF text

Actions run `38285993821`, revision `b96012a`, passed static build/install/audits,
the four component matrices, Firefox/WebKit compatibility and serial PDF/browser
groups. Its general lane finished **202 passed, 1 failed**; release stayed gated.
The owner supplied the failed step's output because downloading GitHub's log
timed out on this machine.

UI-103 found all expected product copy except the exact identifier: the PDF text
contained `L MB-F-001` instead of `LMB-F-001`. The code was present, not omitted.
The print header inherited `.section-index` tracking (`2.16px` at print size).
Local macOS extraction did not insert that space with its available fonts;
therefore it is not claimed as a reproduction of the identical Linux font result.
A regression assertion for normal print tracking failed on the original build.

Correction: normal letter spacing for `.product-sheet .section-index` under print
media only, preserving screen tracking and existing document content. UI-103
keeps its exact PDF code/content assertions and now covers all four production
products; it does not compact all PDF whitespace, skip the identifier, retry a
failed assertion or change the deployment gates. Counts become 206 general +
8 serial + 215 matrix = **429 local/framework executions**. Verification of this
follow-up is recorded below; CI Linux validation remains required.

Final follow-up evidence: `/tmp/lumbre-pdf-spacing-20261012/`.

- Original-build print-tracking guard: **1 failed**, expected `normal`, actual
  `2.16px`. This is not the Linux PDF extraction reproduction described above.
- Corrected build: **421 isolated + 8 serial = 429 passed**, no failures or skips;
  reports/XML live in `final/general/` and `final/serial/` respectively.
- UI-103's eight PDF scenarios passed, including exact identifiers for all four
  rubs. All four one-page product PDFs were rendered with Poppler and visually
  checked for intact codes, readable layout and no clipping/overlap.
- Typecheck, static boundary/build, 47 model contracts, nine profile/workflow
  contracts, Ruff for the changed test and `git diff --check` passed.
- Actual collection audit: 206 general + 8 serial + 215 matrix = 429; disjoint
  lanes cover the full local/framework selection. Optional store checks were not run.
- Screen styles, product copy/data, artwork, security headers and dependencies
  are unchanged. Firefox/WebKit compatibility was not rerun for this print-only
  change; both lanes passed revision `b96012a` in the recorded Actions run.
- Publication remains pending the new immutable artifact's complete CI checks
  and deployment/hash verification. Local success is not evidence of deployment.
