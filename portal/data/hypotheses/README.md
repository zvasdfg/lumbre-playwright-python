# Hypothesis seed catalog

This directory contains the reviewed, version-controlled technical sheets used
to initialize the hypothesis registry. Files use the technical sequence `LHC`,
`LHB`, `LHV`, or `LHP`.

Development and test import these records into Cloudflare D1 and persist new
hypotheses and duplicate counters there. Production currently reads the bundled
catalog without allowing mutations. Request handlers never modify these files.
