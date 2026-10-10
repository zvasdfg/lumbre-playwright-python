# Método Lumbre — static portal

The app is a Vite/React static site. The portal contains home/method, recipes,
the ingredient laboratory, fire planner, almanac and product sheets. Buying
links to Tiendanube; orders, payments, stock and shipping belong to that store.

## Source ownership

```text
portal/
├── static/            Browser components, models, styles, reader and security headers
├── data/              Canonical recipe and product metadata; 60 ingredient JSON files
├── public/brand/      Approved runtime brand/product assets
├── public/editorial/  Approved almanac assets
├── scripts/           Build boundaries, model contracts, release preparation
└── profiles/
    ├── static/        Minimal, pinned release installation
    ├── deploy/        Isolated Cloudflare deployment tooling
    └── browser/       Pinned browser-test runtime
```

Shared data was moved intact from the old application directory. Recipe
preparations remain lazy-loaded; card metadata is derived at build time.
No application server, accounts, internal cart, payment handlers, database
migrations or reservation/admin implementation remains in the active source.
Ignored local backups and credentials were not traversed or deleted.

## Development and validation

```bash
npm ci
npm run dev -- --port 3001
npm run typecheck
npm run check:recipes
npm test
npm run test:profile
npm run build:static
npm run preview:static
```

Development and release manifests use the same static dependency graph. The
release and deployment installations stay isolated so deployment-only packages
cannot enter the browser build. Generated output is `dist-static/`.

The build requires deferred recipe preparations, rejects application API/server
dependencies, publishes only allowed asset directories and verifies `_headers`
without changing their security directives. It publishes no source maps.

## Testing and publication

The numbered browser suite lives in `test-framework/projects/lumbre/tests/ui/`.
From the repository root, `bash scripts/test-local.sh` builds a preview and runs
all local/framework tests. `--headed` is forwarded to specialized script browsers.
Optional Tiendanube checks use `bash scripts/test-store-ui.sh`; they are read-only.

Actions builds once, tests that artifact in general UI, component matrices and
compatibility lanes, then deploys only if every gate passes. A short SHA-256
check verifies that the published HTML/JavaScript match the tested artifact.
There is no second browser suite against the published portal.

See [test architecture](../docs/STATIC_TEST_ARCHITECTURE.md),
[ingredient methodology](data/ingredientes/METHODOLOGY.md) and
[cleanup record](../docs/STATIC_RETIREMENT_2026-10-09.md).
