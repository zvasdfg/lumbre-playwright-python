# Public repository and release security

Review date: 2026-10-12. Scope: current worktree, reachable local Git text history,
public images/build boundaries and release/test configuration. This is a technical
audit, not a penetration test, a complete secret detector or legal/privacy advice.
No credentials, matched secret values or internal recipes belong in this report.

## Public versus private

Public: app/framework source, approved brand/editorial images, recipe proposals,
ingredient catalog and product ingredient declarations. Anything in browser JS
is inspectable, even when the UI does not display it. Production manufacturing
amounts, internal prototype weights and private provenance must not ship.

Private: credentials, tokens, cookies/auth state, customer/order/payment data,
internal formulations, raw provider exports, backups, machine paths and traces
from authenticated real accounts. Saved user blends remain in their own browser
session; fire plans remain local. Tiendanube owns orders, payments and shipping.
No remote account/database sync is implemented by this static portal.

## Findings and containment in this revision

- Internal formulation references were present in the laboratory's source and
  compiled JavaScript, despite not appearing in its printed sheets. The owner
  authorized removing them and using manual quantities temporarily. They and their
  recipe-reproduction tests are removed; numeric/radar/storage tests use synthetic
  user-entered amounts instead. Product identity/80% ingredient matching remains.
- Obsolete/repeated Markdown was retired after preserving an owner-local restricted
  archive outside this repository. Non-Markdown design/QA evidence is retained;
  private provenance in metadata is sanitized separately, not deleted in bulk.
  Current docs consolidate architecture, execution, risk and source authority.
- Ignore rules now cover private credentials, caches, reports, captures, auth
  state and archives. Ignore rules alone do not protect already tracked files.
- A current-tree guard reports only paths, rule IDs and line numbers, not values.
  It is a static-build CI prerequisite. Build guards allow only compiled JS/CSS,
  the entry HTML/headers and public images; they reject docs, reports, backups,
  source maps, private references, known token formats and active SVG content.
- Security headers remain unchanged: restrictive CSP, connect-src none, no forms,
  frame denial, nosniff and restricted browser permissions. No TLS/audit bypass.

## Verification evidence and limits

The initial redacted scan traversed 1,690 unique text objects reachable through
90 local commits. It found internal-reference provenance but no matches for its
private-key/provider-token/credential-URL patterns. This is **not** a guarantee
that every credential format, binary asset, remote branch or external artifact
was inspected. The current-tree guard adds hardcoded-provider checks.

Raw audit output, original documents and test artifacts stay outside the public
tree. Their locations are intentionally omitted from this public report.
The final current-tree scan has no findings under the configured rules. Five
historical canonical product-source objects were additionally checked: no
manufacturing-quantity fields were found there. Internal prototype-reference
history nevertheless remains accessible, as described below.

Final local verification for this worktree:

- 421 isolated + eight serial = **429 passed**, no failures/skips. First migration
  run had stale automatic-quantity expectations and capitalization-sensitive
  locators; those failures were retained before the successful full rerun.
- **78 passed** in focused Chromium/Firefox/WebKit compatibility.
- After the final build-guard changes, 12 focused laboratory/PDF cases passed
  again against the final generated assets. The full 429/78 runs preceded only
  those non-runtime guard/test additions; they were not repeated again afterward.
- **49 model/publication contracts + nine profile/workflow contracts passed**;
  obsolete private-recipe assertions were replaced by manual-state contracts,
  not relabelled as tests of confidential formulas.
- Typecheck, static build/public-output guards, changed numbered-test Ruff,
  whitespace, JSON/YAML parsing and 28 local Markdown links passed.
- Metadata of 239 public raster images had no GPS/owner/personal-pattern flags.
  This is not OCR or a visual inspection of every pixel. Public report/planner
  screenshots were sampled separately; no real customer/credential data was seen
  in those samples. Existing artwork/public data and headers are unchanged.
- 21 obsolete/redundant Markdown files removed, leaving 12 canonical documents.
  Their owner-local backup was retained; non-Markdown artifacts were not deleted
  in bulk. Two historical metadata records were narrowly sanitized.

Containment update, 2026-10-13: authenticated GitHub metadata confirms temporary
private visibility. A complete Git bundle was verified and current working files
were archived outside all public repositories with owner-only permissions.
The owner authorized coordinated history cleanup/force push and affected artifact
removal. Local history was rewritten over 91 commits, retiring seven affected
paths from earlier trees while preserving the exact current application tree.
Old intermediate commits are therefore not guaranteed to build unchanged.
A fresh scan of 1,680 reachable text blobs found no configured-rule matches.
Rewritten main was published with an explicit force-with-lease check. A new,
non-reusing local clone contains neither of the original affected test objects.
Nine compiled build artifacts were individually identified from their source SHA,
deleted and verified absent. Broad artifact/log deletion was rejected and not
performed. The 41 candidate diagnostic archives and nine affected-run log archives
were privately inspected: no private-reference marker matches. A separate scan of
2,013 diagnostic entries found no configured credential-pattern matches. These
checks are not OCR, exhaustive semantic scanning or proof against all secret types.

[CI run 38441242795](https://github.com/zvasdfg/lumbre-playwright-python/actions/runs/38441242795)
passed every build/browser/matrix/deploy job. The main and laboratory production
bundles match the exact CI artifact SHA-256; both known pre-cleanup asset URLs
return 404. The CI artifact, not an independently rebuilt local bundle, is the
release identity. The original commit/blob remain accessible through authenticated
GitHub API requests after force push. Keep the repository private pending provider
purge assessment; historical confidentiality is **unresolved**, not an overall PASS.

Both local npm advisory requests (static and deploy profiles) failed certificate
validation. No dependency was installed/changed and TLS was not disabled. The
same dependency lockfiles passed fresh clean installs and npm advisory gates in
the successful 2026-10-13 CI run linked above (static, deploy preflight and deploy).
That evidence is from CI, not a fresh local advisory response. Browser/Python supply-chain advisories were not
independently queried. New guards use built-in Node modules, no new dependency.

## Required follow-up: history and previously published data

**Removing current files does not erase their earlier Git blobs or old deployed
assets.** The retired objects are no longer reachable from rewritten main, but
remain addressable by SHA in GitHub's private storage. Temporary private visibility,
history cleanup/force push and affected artifact removal are owner-authorized.
No provider revocation or credential rotation was performed.

To contain historical disclosure, keep the repository temporarily private.
Preserve the verified private backup, agree affected branches/tags and clone migration, then
verify remotes and remove accessible artifacts where supported. Old clones,
forks/caches or downloaded assets cannot be recalled; do not claim guaranteed
erasure. Any exposed real credential must be revoked/rotated at its provider,
not merely deleted from Git. No actual credential value was identified by this scan.

After the rewritten main is published, other clones must be freshly cloned or
carefully migrated. Do not merge/push old branches back into the clean history.
The owner-only bundle is a recovery copy, not a public release source.
GitHub may retain unreachable objects and cached commit views after a force push;
check old object access separately and request provider cleanup where required.

The live site serves the verified manual-laboratory release described above.
The two known previous bundle URLs were checked directly, not only the new HTML.
This is not a complete inventory of every historical CDN URL or proof that
already downloaded files/clones can be recalled. A support request draft contains
repository/object metadata only, outside the public tree. The request was sent
and GitHub acknowledged an open ticket; provider cleanup has not been confirmed.

## Reproduce the gates

From repository root:

~~~bash
node scripts/audit-public-repo.mjs
npm test --prefix portal
npm run test:profile --prefix portal
npm run build:static --prefix portal
npm audit --prefix portal --package-lock-only --audit-level=high --registry=https://registry.npmjs.org
npm audit --prefix portal/profiles/deploy --package-lock-only --audit-level=high --registry=https://registry.npmjs.org
~~~

The scanner covers the current tracked/new non-ignored worktree, not history.
Build checks validate the actual generated output. Ignore rules prevent accidental
adds; neither tool can stop an explicitly bypassed gate or provide cryptographic
proof of absence of all proprietary information.

## CI and evidence handling

Only the protected production job receives GitHub Environment secrets
CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN. Wrangler is isolated from browser
dependencies. PR jobs never deploy. All local UI lanes gate the same build; after
deployment a SHA-256 check verifies the published entry bundle.

Reports/screenshots/traces are ignored locally; CI diagnostics use synthetic
unauthenticated contexts and seven-day retention. In a public GitHub repository,
assume artifacts/logs can be accessed by others: do not upload real customer data
or secret-bearing traces. Raw artifacts may contain information redaction misses.
The owner explicitly authorized removing affected historical artifacts; retain
redacted metadata in the private backup and verify removal independently.

Primary guidance checked for this review:

- [GitHub: remove sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository): history cleanup needs coordination; other clones/forks and cached references are separate.
- [GitHub: download workflow artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts): signed-in readers can download artifacts; diagnostics must not be treated as private just because they are not in the website build.
