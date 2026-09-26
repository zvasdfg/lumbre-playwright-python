import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { evaluateReadiness } from "./deployment-readiness.mjs";

const portalDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const manifest = readJson(join(portalDirectory, "config", "deployment-readiness.json"));
const wrangler = readJson(join(portalDirectory, "wrangler.jsonc"));

test("the controlled staging account profile is ready with declared provider secrets", () => {
  const result = evaluateReadiness({
    manifest,
    wrangler,
    environment: "staging",
    profileName: "accounts-preview",
    remoteSecretNames: ["BETTER_AUTH_SECRET", "RESEND_API_KEY", "AUTH_ALLOWED_EMAIL"],
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.missingBindings, []);
  assert.deepEqual(result.missingVariables, []);
  assert.deepEqual(result.missingSecrets, []);
});

test("the former public-demo profile rejects account-provider declarations", () => {
  const result = evaluateReadiness({
    manifest,
    wrangler,
    environment: "staging",
    profileName: "public-demo",
    remoteSecretNames: ["STRIPE_SECRET_KEY"],
  });

  assert.equal(result.ready, false);
  assert.deepEqual(result.unexpectedSecrets, ["STRIPE_SECRET_KEY"]);
});

test("public account activation remains blocked after controlled access is configured", () => {
  const result = evaluateReadiness({
    manifest,
    wrangler,
    environment: "production",
    profileName: "accounts",
    remoteSecretNames: ["BETTER_AUTH_SECRET", "RESEND_API_KEY", "AUTH_ALLOWED_EMAIL"],
  });

  assert.equal(result.ready, false);
  assert.deepEqual(result.missingVariables, []);
  assert.ok(result.unexpectedDeclarations.includes("AUTH_ALLOWED_EMAIL"));
  assert.ok(result.blockers.length > 0);
});
