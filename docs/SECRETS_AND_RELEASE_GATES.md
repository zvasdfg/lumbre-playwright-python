# Secrets and Release Gates

> Scope: engineering controls for Lumbre deployments. This runbook records
> secret names, ownership requirements, and validation commands. It never
> records secret values.

## 1. Deployment profiles

Lumbre does not treat one successful build as authorization to enable every
implemented feature. `portal/config/deployment-readiness.json` defines four
explicit profiles:

| Profile | Production state | Secret contract |
| --- | --- | --- |
| `public-demo` | Allowed | No provider secrets; public catalogs and anonymous cart only |
| `accounts-preview` | Allowed | `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, and one secret `AUTH_ALLOWED_EMAIL`; no public registration |
| `accounts` | Blocked | Preview prerequisites plus a verified sending domain, deletion/retention, legal notice, and incident owners |
| `commerce` | Blocked | Account prerequisites plus Stripe API/webhook secrets and payment/refund governance |

The gate rejects both missing required secrets and unexpected secrets. An
unused provider credential is unnecessary authority and therefore violates
least privilege even when no route currently consumes it.

When a protected profile is authorized, its names must also be declared through
the matching Wrangler `secrets.required` configuration. Wrangler then rejects a
deployment when an expected secret binding is absent; the Lumbre gate also
checks that the declaration and selected product profile agree.

## 2. Validation commands

Run the structural check without contacting Cloudflare:

```bash
cd portal
npm run readiness:offline
```

Compare the account-preview contract with the names attached to the deployed
staging Worker:

```bash
cd portal
npm run readiness:staging
```

The command invokes `wrangler secret list --format json`. Wrangler returns
names and binding types, not values. The script reports names only and never
reads `.dev.vars`.

Once the production Worker exists, `readiness:production` validates the
account-preview contract. Use `readiness:public-demo` only when intentionally
rolling back to the anonymous public-demo profile:

```bash
cd portal
npm run readiness:production
npm run readiness:public-demo
```

A nonzero exit means the release is blocked. Do not bypass the gate by removing
a requirement from the manifest; resolve the missing dependency or make a
reviewed product-scope change.

## 3. Creating a secret

1. Confirm the target feature's non-secret blockers are complete.
2. Create the credential in its owning provider with minimum permissions and a
   named operator.
3. Enter it through Wrangler's interactive prompt. Never put its value in the
   shell command, repository, issue, report, or chat.
4. Run the relevant readiness profile and focused acceptance tests.
5. Record only the secret name, target environment, operator, UTC time, and
   validation result.

Staging example:

```bash
cd portal
npx wrangler secret put BETTER_AUTH_SECRET --env staging
npx wrangler secret put RESEND_API_KEY --env staging
npx wrangler secret put AUTH_ALLOWED_EMAIL --env staging
```

Production example:

```bash
cd portal
npx wrangler secret put BETTER_AUTH_SECRET --env production
npx wrangler secret put RESEND_API_KEY --env production
npx wrangler secret put AUTH_ALLOWED_EMAIL --env production
```

`wrangler secret put` creates and immediately deploys a new Worker version.
Treat it as a deployment, capture its version, and rerun the remote smoke gate.

## 4. Rotation

1. Open an owned change record without the old or new value.
2. Create the replacement at the provider when the provider owns the secret.
3. Put the replacement value under the same Worker binding name.
4. Capture the resulting Worker version and run health, security, and focused
   provider acceptance checks.
5. Revoke the old provider credential only after the new version is verified.
6. Run `npm run readiness:staging` or `readiness:production` and record the
   names-only result.

If a provider cannot overlap credentials, schedule a maintenance window and
keep the affected feature disabled until validation completes.

## 5. Revocation and incident use

For a suspected disclosure, revoke the credential at its provider first when
that stops unauthorized use. Disable the affected feature, then remove the
Worker binding:

```bash
cd portal
npx wrangler secret delete SECRET_NAME --env staging
# Use --env production only when intentionally targeting production.
```

Deletion also creates and deploys a new Worker version. Validate the expected
degraded/disabled behavior and execute the incident procedure in
`docs/DATA_GOVERNANCE_AND_INCIDENT_RESPONSE.md`.

## 6. Repository controls

- `.env`, `.dev.vars`, exports, and generated reports remain ignored.
- `.env.example` and `.dev.vars.example` contain names and placeholders only.
- `NEXT_PUBLIC_*` variables are public build configuration, never secrets.
- Production-safe environment variables are explicit in `wrangler.jsonc`.
- Real secret values never belong in automated-test parameters or evidence.
- `accounts-preview` is limited to the Resend account owner's email and is not
  authorization for public registration.
- The public account and commerce profiles remain blocked until their complete
  operational, privacy, provider, and ownership prerequisites are implemented.

## 7. GitHub Actions continuous deployment

`.github/workflows/deploy.yml` is the delivery pipeline for the default branch.
It validates pull requests without deploying. A push to `main`, or a manual
workflow dispatch, follows this ordered gate:

1. install the locked portal dependencies with `npm ci`;
2. run the readiness unit tests, TypeScript check, lint, production build, and
   staging deployment dry-run;
3. validate the staging binding and secret-name contract;
4. deploy staging and run the four-case Python/Playwright remote smoke gate;
5. only after staging passes, validate and deploy production;
6. run the production remote smoke gate and retain both HTML and JUnit evidence
   for 14 days.

Configure these GitHub Actions secrets either at repository level or in both
the `staging` and `production` environments:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Selects the Cloudflare account that owns both Workers |
| `CLOUDFLARE_API_TOKEN` | Authorizes noninteractive Worker validation and deployment |

Create a dedicated account-owned Cloudflare API token for CI. The current
minimum policy used by Lumbre is `Workers Editor` plus `Account Settings Read`,
scoped to the account that owns both Workers, with a one-year expiration. Do
not use the broader `Edit Cloudflare Workers` template, which also grants
unneeded Pages, KV, R2, container, tail, and route permissions. Never reuse the
local Wrangler OAuth credential or store either CI value in the repository.

The pipeline intentionally does **not** execute `db:migrate:*`, `db:seed:*`,
backup, restore, secret-creation, or secret-deletion commands. A D1 schema or
data change remains a separately reviewed operator action: capture the backup,
apply the committed migration to staging, verify it, then repeat for production
before pushing application code that requires the new schema.

Use GitHub Environment protection rules if a human approval should remain
between staging acceptance and production promotion. Without that optional
rule, a passing staging job promotes automatically.

Platform reference:

- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Workers with GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
