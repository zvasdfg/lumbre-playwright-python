# Fire planner: current model and evidence

Implementation/documentation review: 2026-10-27. Canonical executable sources:
[fire-plan-model.ts](../portal/static/fire-plan-model.ts) and
[fire-plan-fuel.tsx](../portal/static/fire-plan-fuel.tsx), which owns budgeting logic.
Tests live under portal/scripts; execution is documented in the root README.
This engineering model is not an approved cooking recipe or empirical calibration.
This document supersedes the v1/v2 planning notes, not their historical results.

## Inputs and compatibility

Goals: roast/grill, smoke and bake. Methods: direct, indirect or combined.
Equipment/fuel constraints require the model's explicit confirmations. An open
grill is not an oven; pellet direct-fire capability is model-specific. Gas types
are not interchangeable. Aroma wood is separate from the primary fuel.

Suggested defaults: smoking 120 °C, baking 180 °C, direct grilling 220 °C and
other grilling methods 200 °C; Fahrenheit is converted explicitly. These are
starting points, not food-safety endpoints. Cooking hours are required for a
budget, and custom setup is optional. Up to 12 stages include cooking and pauses.

## Quantity and assumptions

The budget uses cooking hours + 30 minutes of budgeted warmup (editable, including
zero), a manual hourly-rate override when provided, and optional extra startup.
The purchasing amount uses the larger of maximum estimated consumption and the
applicable minimum purchase, plus a 25% planning reserve. Upper budget/reserve
are rounded upward separately to 0.1. Units stay distinct: kg for solids/LP and
m³ for natural gas. A manual rate is a point input, not an invented confidence band.

Automatic solid/gas/pellet estimates cover valid simple configurations, with
clearly labelled Lumbre equipment, area, temperature and utilization assumptions.
Only the named source values are attributed to Weber. Intermediate and unsupported
source bands are labelled interpolation/extrapolation, not manufacturer measurements.
No universal guests × hours rule or experimental error bound is claimed.

Kettle defaults to a labelled 57 cm reference; 47/67 cm are available. The Weber
branded briquette table preserves counts, not invented kilogram conversions:
direct initial 25/30/45; indirect first hour 20/30/40; additional hourly totals
8/8/12, both sides combined. That table does not establish universal smoking or
multi-stage consumption. A separate generalized budget labels its assumptions.

For stage plans, temperatures form an envelope across active stages; free-text
durations are not parsed/summed. General hours must cover fire-on time, including
any pause with the fire still running. The budget is fuel available, **not** a
safe firebox loading instruction or prescribed refill schedule. Follow the manual.

## Primary sources and their limits

- [Weber SmokeFire pellet consumption](https://contact-emea.weber.com/hc/en-us/articles/360048814014-Pellet-Consumption-SmokeFire): approximate 0.5–1 kg/h at 95–150 °C and 1.5–2 kg/h at 230–315 °C. Lumbre's interpolation is not a published intermediate band.
- [Weber briquettes](https://www.weber.com/GB/en/weber-briquettes/weber-49393.html): reference household kettle budget, not universal fuel consumption.
- [Weber kettle manual, page 8](https://www.weber.com/on/demandware.static/-/Sites-master-catalog/default/dwfb3a6638/documents/50b1bdb6-f0fe-409d-b9b3-50f312950392.pdf): starting/replenishment counts and explicitly named fuels. Original table review remains in Git history.
- [Weber Spirit consumption](https://contact-emea.weber.com/hc/pt/articles/32729720804381-Resumo-do-Consumo-das-Churrasqueiras-Weber-Spirit): 2–3 burner references; partial-power factors and assumed natural-gas energy density are Lumbre estimates.

No new external research or manufacturer measurement was performed for this
documentation consolidation. Values were checked against the existing model.
Yoder/Traeger historical sources are not current automatic profiles.

## Validation and limits

Pure contracts cover 8,640 discrete rule combinations, finite budgeting inputs,
unit equivalence, invalid values and source/override boundaries. Browser cases
cover 48 valid equipment/goal/fuel tuples, controls, persistence and printing.
This does not exhaust continuous temperatures/durations, loads, weather, stage
sequences or physical devices. Measured equipment calibration remains pending.

From repository root, after installation:

~~~bash
npm test --prefix portal
bash scripts/test-local.sh -m 'portal and planner'
~~~

The first command includes pure model/publication contracts, not browser tests.
The second builds/serves the portal and includes planner UI cases plus serialized
UI-080–084. UI-064 is the 48-case matrix; units, invalidation, saved-state and
stage contracts also live in the numbered planner directory. Counts describe
finite inputs, not every continuous temperature, duration or combination.
Older diagram/report HTML files in docs are archived design evidence, not the
active model contract. Manufacturer links were not re-researched in this review;
do not attribute Lumbre's interpolations, reserve or equipment scaling to Weber.
