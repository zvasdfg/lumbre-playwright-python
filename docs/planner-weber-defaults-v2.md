# Weber defaults v2

Supersedes the reference selection and exposed-input UX of planner-fuel-v1, not historical test evidence.

- Manual rate, startup, preheat and kettle diameter controls moved into closed optional details. Existing saved custom values remain usable; no storage rewrite.
- Kettle defaults to visible-in-result 57 cm reference. Briquette table now uses Weber-branded column: direct 25/30/45; indirect first hour totals 20/30/40; additional hourly totals 8/8/12 for 47/57/67 cm. Source is linked from output, owner guide p. 8, inspected in v1.
- Removed Yoder from automatic profiles. SmokeFire published low/high bands unchanged. For intervening temperatures within 95–315 °C, an explicitly labeled broad budget uses the outer published rates (0.5–2 kg/h). This envelope is a planner assumption derived from Weber endpoints, NOT a Weber-published intermediate-temperature band or a guaranteed bound.
- Existing 25% reserve and 30-minute warmup allowance remain identified as planner assumptions, not Weber specifications.
- Unsupported combinations do not demand manual input. They show absence of a verified automatic Weber reference and can retain the simulation without fuel quantity. This does not claim automatic numeric coverage for every equipment/fuel combination.

Sources: [Weber SmokeFire](https://contact-emea.weber.com/hc/en-us/articles/360048814014-Pellet-Consumption-SmokeFire), [Weber kettle guide p. 8](https://www.weber.com/on/demandware.static/-/Sites-master-catalog/default/dwfb3a6638/documents/50b1bdb6-f0fe-409d-b9b3-50f312950392.pdf).

Verification: static build and typecheck; 20 model/arithmetic tests; kettle diameter and saved-value checks at 390/1440 px. Additional defaults UX test lives in test-planner-weber-defaults.py. No deploy or empirical consumption validation.
