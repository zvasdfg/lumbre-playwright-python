# Secrets and static release gates

Current source: 2026-10-09. No secret values belong in source, reports, screenshots
or chat. The static portal has no runtime secret or customer-account provider.

## Deployment authority

Actions exposes `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` only to the
protected deployment job. The token is not a browser environment variable.
Deployment tooling lives in its isolated profile, not app dependencies.
The static artifact includes only browser assets, allowed public content and
security headers. Source maps, environment files and server inputs are rejected.

## Release gates

1. Manifest/lock agreement and isolated static/deployment installation checks.
2. Types, recipe integrity, model contracts and static-output boundaries.
3. General browser/PDF tests, four component matrices and focused compatibility.
4. Deployment of the already validated artifact, only after all gates pass.
5. HTML/JavaScript SHA-256 verification against that artifact.

No obsolete backend readiness command or database migration is a release gate.
Optional external store tests are read-only and independent of publication.

## Credential lifecycle

Deleting source does not revoke provider credentials or delete remote data.
Ignored local secrets/backups were preserved. Any remote credential revocation,
permission reduction or database deletion requires a separate reviewed action;
none was performed by this cleanup. Use provider controls and record only names,
owners, dates and sanitized evidence, never values. Rotate an exposed credential
instead of merely deleting it from Git.
