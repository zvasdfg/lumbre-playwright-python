# Recipe/blend integration — revision 3

Date: 2026-09-30. Scope: application recipe IDs 1–100. These are not editorial
CONTENT_IDs. Inputs: existing recipe preparations, production catalog and the
owner's explicit correction that LMB-F-002 contains salt, pepper, garlic and
shiitake. The owner approved implementing the 33 integrated / 40 optional /
27 unchanged classification. This is implementation approval, not sensory-test
evidence, dosage validation or authorization to publish.

## Source and revision preservation

- Prior review remains in `RECIPE_BLEND_REVIEW.md` (revision 2). Its omission of
  garlic in 002 and its strict identical-ingredients criterion are superseded.
- `baseRecipePreparations` preserves the pre-change recipe records, including
  the two revision-2 adaptations. Explicit, per-ID changes live in
  `portal/app/lib/recipe-blends.ts`; no fuzzy ingredient matching at runtime.
- The production catalog and product sheet now include garlic in 002. The
  existing photo is preserved, with a visible note that its label omits garlic.
  Historical backend SQL migrations are not rewritten or executed.
- Original images, content-engine knowledge/catalog and `source/` are untouched.

## Approved mapping

| Blend | Integrated recipe IDs | Optional recipe IDs |
| --- | --- | --- |
| 001 | 3,12,17,34,42,51,78,80,86,89 | 11,16,18,19,21,28,32,35,36,41,43,46,52,56,57,58,62,63,65,71,82,84,85,88,90,92,93,95 |
| 002 | 1,2,7,8,13,14,27,37,38,44,53,54,55,66,76 | 9,10,29,39,79 |
| 003 | 5,40,47 | 45,61,72,87 |
| 004 | 4,30,48,74,77 | 22,23,49 |

Unchanged, no promotion: 6,15,20,24,25,26,31,33,50,59,60,64,67,68,69,70,73,
75,81,83,91,94,96,97,98,99,100.

## Editorial behavior

Integrated recipes replace explicitly listed seasoning lines and the relevant
preparation steps. All other ingredients, timings, temperatures, sources and
safety instructions remain. Fresh garlic stays where it belongs to a sauce,
butter or aromatic preparation. Ancho is not silently equated to pasilla, and
citrus juice is not equated to sumac. Mascabado is removed from the base rub in
5/47; the honey for coleslaw in 40 remains a separate component.

Optional recipes keep their original ingredient lists and methods. A visible,
printable note specifies exactly what to replace if the reader chooses that
variant, including partial-salt exceptions for skin/sauce preparations. All 73
notes link to the corresponding canonical product sheet. The remaining 27
recipes have no blend section.

Amounts and salt concentrations remain UNKNOWN; no gram-for-gram replacement
or validated taste outcome is claimed. Existing flavor-chart scores are not
recalculated from the garlic correction because ingredient presence alone does
not establish sensory intensity. Recommendations remain untested proposals.

## Verification

`check-recipes.mjs` checks the 100 IDs, 33/40/27 split, per-product counts,
canonical references, garlic in 002, absence of duplicate salt, removed ingredient
membership, step references, unchanged optional/base records and preservation of
safety/timing fields. Browser tests traverse all 100 recipes at desktop/mobile
widths and check all 73 product links, printable notes and hidden print buttons.
PDF checks test completeness, page counts and absence of blank pages.

No commit, push or deployment is included in this request.

Verified locally: recipe-data checks, TypeScript, static build and whitespace
checks passed. The full desktop recipe/link traversal passed. All 100 exported
PDFs passed completeness checks with no blank pages (93 two-page, 7 one-page).
Integrated and optional sections were visually inspected at 390px. The general
static portal regression passed at 1440px and 390px, including tools/catalog,
no API traffic, no accounts/cart, and API routes remaining 404.
The full 390px traversal also passed: all 100 recipe sheets and all 73 links,
with focus restoration, print controls and overflow checks.
