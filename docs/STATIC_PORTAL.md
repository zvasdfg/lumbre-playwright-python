# Static portal architecture

Current source: 2026-10-09. The app is Vite/React, with build-time canonical
data in `portal/data/` and browser UI in `portal/static/`. The almanac reader,
image adapter and CSS are native browser inputs, without framework aliases.

## Runtime boundaries

- Local/session storage keeps user-created blends and saved plans on the device.
- Recipes, ingredient JSON and production product metadata are build-time inputs.
- Recipe cards derive metadata from the canonical catalog; complete preparations
  load only when a sheet opens.
- Purchase links target the Tiendanube product; commerce remains in Tiendanube.
- Only brand/editorial assets and the static build are published. No server API,
  database, source map, environment file or deployment credential is published.
- `portal/static/_headers` remains canonical and is checked unchanged in output.

## Installations

`portal/package.json` and its lock now use the same minimal dependency graph as
`portal/profiles/static`. `prepare-static-workspace.mjs` creates a fresh release
directory, copies only browser/data/assets inputs and refuses to overwrite an
existing directory. `profiles/deploy` isolates Cloudflare tooling, including the
existing patched Sharp override, from app dependencies.

## Publication

Actions validates types, recipe integrity, model rules, static output and the
isolated deployment installation. Browser lanes reuse that one artifact. The
deploy job depends on general UI, all component matrices and Firefox/WebKit
compatibility. It then publishes assets and verifies HTML/JavaScript hashes.
The published portal is not tested again with a duplicate browser suite.
The independent Tiendanube workflow remains optional and read-only.

See [portal commands](../portal/README.md), [test lanes](STATIC_TEST_ARCHITECTURE.md)
and [retirement scope](STATIC_RETIREMENT_2026-10-09.md).
