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

test("the staging public-demo profile is deployable without provider secrets", () => {
  const result = evaluateReadiness({
    manifest,
    wrangler,
    environment: "staging",
    profileName: "public-demo",
    remoteSecretNames: [],
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.missingBindings, []);
  assert.deepEqual(result.missingVariables, []);
  assert.deepEqual(result.missingSecrets, []);
});

test("an unused provider secret blocks the least-privilege public demo", () => {
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

test("account activation remains blocked even when its secret exists", () => {
  const result = evaluateReadiness({
    manifest,
    wrangler,
    environment: "production",
    profileName: "accounts",
    remoteSecretNames: ["BETTER_AUTH_SECRET"],
  });

  assert.equal(result.ready, false);
  assert.ok(result.missingVariables.includes("BETTER_AUTH_URL"));
  assert.ok(result.undeclaredSecrets.includes("BETTER_AUTH_SECRET"));
  assert.ok(result.blockers.length > 0);
});
