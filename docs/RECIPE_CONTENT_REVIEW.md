# Recipe preparation revision 1

Culinary record: 2026-09-30. Operational/documentation review: 2026-10-27.
This preserves the dated research and QA below; it does not claim a new kitchen
trial, current legal/medical guidance or editorial approval. Active commands and
coverage are updated separately from historical results.

Scope: existing portal recipe IDs 1–100, all categories. Input: titles,
descriptions and illustrations in `portal/data/data.ts`. No product formulas,
brand knowledge, editorial catalog IDs or original images are changed. Recipe IDs
belong to the application catalog; they are not Instagram CONTENT_IDs or protocols.

## Authorship and evidence

The user requested research/generation of the missing preparations. Ingredients,
quantities, servings, seasoning combinations and schedules are original proposals
for those titles, not recovered Lumbre test results. All entries explicitly say
they have not been kitchen-tested. Revision 1 is not editorial approval or a
READY_FOR_PUBLICATION claim. Existing images are illustrative and are not evidence
of a cooked result. Prior descriptive records remain in Git history.

Canonical source registry and recipe-to-source assignments are in
`portal/data/recipe-preparations.ts`, reviewed 2026-09-30. Primary references:

- FoodSafety.gov: minimum internal temperatures, including rabbit/venison,
  poultry, seafood, ground meat and reheating.
- USDA FSIS: smoking environment, handling, refrigeration and leftovers.
- CDC: charcoal must not be used indoors.
- Weber: direct/indirect heat, vegetables, cooking chicken under weight and
  food-grade cedar planks.
- Rick Bayless: corn tamale steaming and pozole technique; not copied recipes.

Links and their limited evidentiary scope appear in every sheet. Broad technique
references do not establish that the exact recipe has been tested. Culinary
timings and tenderness targets are estimates. No nutrition or shelf-life claims.

## Specific corrections

- All card times derive from the detailed schedule; lighting the grill and thawing
  are explicitly excluded unless specified. Marinades and rests are identified.
- Tuna (20) no longer advertises a raw center; venison (29) uses 71 °C and poultry
  including duck uses 74 °C. Lamb descriptions do not promise a pink center.
- Pulpo zarandeado (16), lengua (32), marlín (33), beans (64/66), rice (76) identify
  their pre-cooked input; pozole (65) uses pre-cooked corn.
- Pastrami (59) uses commercial cured beef; no nitrite dosing or home-curing
  process. Cecina (60) uses commercial refrigerated meat and is not jerky.
- Rolled/stacked meats use a conservative 74 °C criterion. Very long cooks require
  tenderness checks in addition to the minimum safety endpoint.
- Cabrito/caja (42), barbacoa (43), lechón (56) and pastor (58) specify equipment
  or domestic adaptations; no improvised enclosed fire or unattended pit cooking.
- Salt crust (73) is discarded. Cedar must be culinary-grade. Garlic in oil is
  not a room-temperature preserve. Dairy is pasteurized.

## Verification commands

From repository root, after installation:

~~~bash
npm run check:recipes --prefix portal
npm run typecheck --prefix portal
bash scripts/test-local.sh -m 'portal and recipes'
bash scripts/test-local.sh -m 'portal and print_pdf'
~~~

UI-034 traverses all 100 recipes at 1440/390px, checking content, sources, focus,
overflow and print access. UI-085 covers product-link return through the retained
serial adapter. UI-103 generates eight representative PDFs across features,
including one recipe; CI does not export 100 recipe PDFs on every deployment.

Optional deep PDF audit, with a separately started static preview in 3001 and
no concurrent PDF-writing suite:

~~~bash
test-framework/.venv/bin/python portal/scripts/test-recipe-sheets.py
test-framework/.venv/bin/python portal/scripts/check-recipe-print.py
~~~

That standalone audit writes 100 PDFs under /tmp/lumbre-recipe-qa, outside Git;
it is not an additional default suite. Rendered sample inspection complements,
not replaces, editorial review. Structural assertions cannot prove culinary success.

## Local verification — 2026-09-30

- Content integrity, TypeScript, targeted ESLint and `git diff --check`: passed.
- Static build and no-backend boundary: passed. Vite reports a non-blocking
  large-chunk warning (approximately 539 kB raw / 142 kB gzip for the main JS).
- All 100 recipe dialogs passed at both 1440px and 390px.
- All 100 PDF exports contain ingredients, instructions, doneness, safety and
  sources, without blank pages: 11 one-page and 89 two-page sheets.
- Rendered both pages of recipes 1, 59 and 67; inspected mobile sample 100.
  Numbered steps, readable lists, intact source section and visible print toolbar.
- Existing static acceptance checks passed at both viewport widths; four product
  PDFs and the experimental formula PDF also passed their text/page checks.
- Production was not modified; no commit, push or deployment performed.

Those results and the old main-chunk warning belong only to September 30. They
are not current bundle measurements or evidence that today's UI suite passed.
Current runtime publication is tracked in [CHANGELOG](CHANGELOG.md).

## Pending

Kitchen trials (yield, flavor, texture and time) and user editorial approval.
Technical deployment does not provide nutritional/allergen certification or
editorial approval. Check ingredient labels and substitutions individually for
allergens. Source registries remain canonical; this documentation update did
not independently revalidate every external culinary link.
