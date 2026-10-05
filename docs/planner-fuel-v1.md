# Planner fuel budget — implementation v1

Scope: static portal calculator, not an editorial/catalog publication. Existing uncommitted diagram and planner changes retained. No deployment.

## Inputs and arithmetic

Cooking hours are required. Warm-up allowance defaults to 30 minutes (editable, including zero). Optional extra startup quantity defaults to zero. Units: kg for solids/LP; m³ for natural gas. No conversion of LPG litres, cylinder volume, burner BTU or natural-gas volume into kg.

Budget = hourly consumption × (cooking hours + warm-up minutes / 60) + extra startup.
Reserve = 25% of upper unrounded budget. Round upper budget and reserve separately upward to 0.1, then sum. The 25% margin and warm-up allowance are product budgeting choices, NOT experimentally validated error bounds. A single supplied rate produces a point calculation, not a fabricated confidence range.

Never equate purchase quantity to a safe initial firebox load or prescribe timed refilling. Startup is additional only when the hourly warm-up budget excludes it. No smoke-wood quantity inferred.

## Reference boundaries

- [Weber SmokeFire consumption](https://contact-emea.weber.com/hc/en-us/articles/360048814014-Pellet-Consumption-SmokeFire): published approximate bands 0.5–1 kg/h at 95–150 °C; 1.5–2 kg/h at 230–315 °C. Named reference, not calibration for every pellet model.
- [Yoder YS480 manual, printed p. 8](https://community.yodersmokers.com/download/Manuals/Pellet%20Manuals/YS%20480%20Manual%207-3-2014.pdf): grilling band 350–450 °F, variability 1.5–4 lb/h. Uses broad stated variability, not a fabricated precision band. Exact conversion 0.45359237 kg/lb.
- [Traeger fuel input rating](https://support.traeger.com/hc/en-us/articles/31148524529435-Fuel-Input-Rating): maximum-temperature laboratory rating is not typical real-world consumption; not used as an average.
- [Weber briquettes](https://www.weber.com/GB/en/weber-briquettes/weber-49393.html): approximately 2 kg for a 57 cm kettle and up to three hours are not sufficient evidence for a universal kg/hour model. Not extrapolated to other fuels/equipment.

No interpolation across uncovered temperatures. Fahrenheit inputs converted before matching. Multi-stage plans need a user-supplied representative rate: free-text stage duration is not parsed, and overall hours must include any fire-on pauses.

## Deliberate unresolved scope

### Kettle reference added after user clarification

User uses a lidded kettle with briquettes/lump charcoal, sometimes wood. Diameter is NOT known: selector starts at an explicitly labeled 57 cm reference; 47/67 cm available.
[Weber manual, page 8](https://www.weber.com/on/demandware.static/-/Sites-master-catalog/default/dwfb3a6638/documents/50b1bdb6-f0fe-409d-b9b3-50f312950392.pdf) was downloaded, text-extracted and its table visually inspected. Generic briquettes: initial 30/40/60 for diameters 47/57/67; indirect replenishment totals 14/14/16 per additional hour, both sides combined. Fractional additional hours rounded up for preparation; 25% extra reserve is our planning margin. No kg conversion without individual briquette mass.

Direct beechwood initial kg: .56/.98/2.24; indirect first-hour totals .6/.6/.84. Explicitly labeled beechwood, NOT generic Mexican lump-charcoal consumption. No quantified full-session charcoal budget: subsequent handfuls have unknown mass. No automatic table use for smoking or multistage plans. Wood for aroma remains separate from main fuel. The direct table does not substantiate hourly replenishment.

Automatic validated kg/hour profiles for lump charcoal, briquettes, firewood, LP and natural gas remain UNKNOWN. These combinations calculate only with manual/measured hourly input. This is NOT completion of the requested low-input automatic estimator across all equipment. Resolving it requires model-specific consumption data or measured calibration sessions with fuel, load, temperature, time, equipment dimensions and weather recorded. Do not reinstate the former guests × hours heuristic.

Manual rate/startup reset when equipment, fuel, goal, method, temperature or stages change. Values persist in saved/exported plans; legacy schema adds empty rates and 30-minute allowance without rewriting original storage until explicit save.

## Verification

Seven new arithmetic/reference tests and thirteen existing model tests. Browser script: six fuels at 390/1440 widths, save/reload/print, missing rate, negative rate and rate invalidation. Generated PDFs inspected separately. No claim of empirical fuel-consumption validation.
