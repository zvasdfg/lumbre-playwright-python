# Recipe blend review — revision 2

Reviewed 2026-09-30. Scope: application recipe IDs 1–100 against the four
production products in `portal/app/lib/production-products.ts`. These are portal
IDs, not editorial CONTENT_IDs. No content-engine catalog IDs, knowledge, original
images or source assets are changed. Input recipe revision 1 remains in Git
commit `f65acc8`; its review remains in `RECIPE_CONTENT_REVIEW.md`.

## Decision and limits

Review criterion: replace an existing seasoning group only when all of the
blend's declared ingredients are already serving that role. Do not replace fresh
garlic, whole vegetables/mushrooms, sauces, marinades, curing ingredients or salt
crusts with a dry blend merely because an ingredient name overlaps. Do not add
new flavor components implicitly. This conservative review found two matches;
the other 98 recipes remain revision 1, unchanged.

This is an ingredient-level substitution, not proof of equivalent proportions,
grind, dosage or sensory outcome. Salt concentration and product dose remain
UNKNOWN. The two adaptations explicitly use a light application, no separate
salt/pepper/garlic, adjustment only after cooking, and no gram-for-gram claim.
They remain untested culinary proposals, not approved or published formulas.

## Changed recipes and preserved revision-1 inputs

| Recipe | Blend | Removed individual seasoning lines | Retained |
| --- | --- | --- | --- |
| 2 | LMB-F-001 multiuso | 22 g salt; 15 g coarse black pepper; 5 g granulated garlic | 2.5 kg beef ribs; 150 ml water |
| 44 | LMB-F-001 multiuso | 18 g salt; 6 g pepper; 4 g granulated garlic | 2.2 kg short ribs; 10 g ground ancho; 200 ml unsalted broth |

Original first step, recipe 2: “Recorta grasa dura superficial sin separar los
huesos. Seca y cubre con sal, pimienta y ajo.”

Original first step, recipe 44: “Seca las costillas y mezcla sal, ancho, pimienta
y ajo. Cubre la carne sin dejar montones de chile.”

Only the seasoning ingredient lists, first steps, and linked blend notes change.
Cooking times, temperatures, other steps, safety notes and technical sources are
preserved. The two revised sheets identify revision 2; their previous content QA
does not establish sensory validation of these changes.

## Review disposition of all other IDs

IDs 1, 3–43 and 45–100: KEEP. Ingredient lists and preparation roles reviewed;
no complete, role-compatible declared dry-blend ingredient group found.

- Multiuso (001): many recipes contain salt and pepper but no dry garlic. Fresh
  garlic is retained where used in chimichurri (1), marinades (4, 12), sauces,
  butter, sautéing or as the main food (83). Pastrami (59) has pepper and dry
  garlic but uses commercially cured beef without added salt; no substitution.
- Res (002): no recipe contains its full salt/pepper/dried-shiitake seasoning
  group. Fresh portobello in 37/79 is a food component, not shiitake powder.
- Cerdo (003): partial matches in 5/40/47 omit some of garlic, pasilla, sugar or
  pepper. Ancho, paprika and piloncillo are not silently relabeled pasilla or
  mascabado. Adding this blend would be a new flavor variant, not this task's
  ingredient substitution.
- Pollo (004): no recipe has its complete salt/pepper/garlic/cumin/sumac group.
  Citrus juice is not interchangeable with dry sumac in a marinade.
- Preserve simple salt/pepper recipes such as 39, pink pepper in 31/94,
  structural salt crust in 73, and sweet preparations (6/68/69/81/96–100).

## Verification scope

Automated recipe checks validate all 100 records, the two canonical product
references, removed seasoning lines, retained ancho/broth and method references.
Browser regression covers all 100 sheets at desktop/mobile widths; linked blend
navigation is checked separately. Printed notes retain the product code and
dosing caveat, while the interactive button is hidden in print.

No kitchen test, product dose validation, editorial publication approval or
deployment is implied by software checks.

Verified locally on 2026-09-30: recipe validator, TypeScript, static build and
`git diff --check` passed. Deep comparison with the prior revision confirmed all
98 other recipes unchanged and retained cooking/safety fields in 2/44. Browser
checks passed for all 100 sheets at 1440px and 390px, including both blend links.
All 100 PDFs passed completeness/no-blank-page checks: 89 have two pages, 11 have
one. The mobile blend section was visually inspected. The PDF test now explicitly
selects print media for export and restores screen media for UI checks.
