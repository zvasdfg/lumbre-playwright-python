# Lumbre ingredient knowledge base methodology

## Scope

These records support culinary experiments for grilling and live-fire cooking.
They are not nutritional, medical, or food-safety advice. Scientific sources
are used to identify origin, characteristic compounds, and heat or storage
behavior. Culinary ranges and compatibility scores are editorial starting
points that still require controlled kitchen validation.

## Scales

- `perfil_sensorial`: editorial intensity from `0` (not perceptible) to `5`
  (dominant).
- `compatibilidad`: editorial suitability from `0` (poor fit) to `5`
  (excellent fit).
- `aporte`: expected contribution from `0` (none) to `5` (strong).
- `dosificacion`: grams of dry ingredient per kilogram of food unless the
  record explicitly says it is a finishing application.

Scores are comparative within this catalog; they are not laboratory
measurements.

## Validation status

- `documentado_sin_validar`: literature research is complete, but Lumbre has
  not executed the proposed experiment.
- Every entry in `experimentos` is marked `propuesto`. It describes a test to
  run; it never represents observed evidence.
- `granularidades_probadas` uses `propuesta:` prefixes until a physical trial
  has been completed.

## Experimental baseline

Unless a record specifies otherwise, compare three dosages against an
unseasoned control using equal-size samples, the same fuel, grate position,
surface temperature, internal endpoint, resting time, and evaluator rubric.
Record aroma, bitterness, perceived salt, color, adhesion, and crust/bark.

## Formula-role evidence

Experiment protocols are evaluated against published seasoning structures,
not merely against catalog family names. Ingredient IDs are mapped to culinary
roles such as salinity, pepper, allium, toasted, smoke, sweetener, herb, umami,
and citrus. A formula is `referenced` only when all required roles and the
intended cooking objective match a published structure. A `close` result is
missing one required role; every other result remains `experimental`.

Published commercial ingredient lists demonstrate that a structure is used in
practice; they do not prove Lumbre's selected proportions, thermal behavior, or
sensory result. Those claims still require the controlled kitchen trial above.
Sweet spices such as cinnamon and cardamom are not counted as sweeteners.

## Family taxonomy

`familia` answers what an ingredient is in culinary terms; it does not describe
every flavor contribution or processing method. The normalized families are:

- `Sal`, `Allium`, `Pimienta`, and `Chile`;
- `Hierba`, `Semilla_aromatica`, and `Especia_calida`;
- `Citrico`, `Umami`, `Tostado`, and `Endulzante`.

Flavor roles are resolved separately by `app/lib/flavor-formulas.ts`. For
example, smoked paprika belongs to `Chile` but also supplies the `smoke` role;
black garlic belongs to `Allium` but also supplies `umami`; toasted onion is an
`Allium` that supplies `toasted` and `umami`. This prevents preparation methods
or provisional research status from becoming misleading catalog families.

The former `Base`, `Especia`, `Especia_dulce`, `Herbal`, `Terroso`, `Picante`,
`Ahumado`, and `Investigacion` labels are retired.

## Storage convention

Shelf-life values describe expected quality retention for a dry ingredient in
an airtight food-safe container, not a microbiological expiration date. Heat,
light, moisture, oxygen, grinding, and the supplier's original best-before
date can shorten quality life.

## Sourcing convention

Supplier entries identify practical sourcing channels in Mexico. They are
candidates to verify for lot, origin, processing, allergens, and freshness;
they are not endorsements.
