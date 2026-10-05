import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const portal = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(readFileSync(resolve(portal, file), "utf8"));

test("static lock matches its manifest and excludes legacy dependency chains", () => {
  const manifest = read("profiles/static/package.json");
  const lock = read("profiles/static/package-lock.json");
  assert.equal(lock.lockfileVersion, 3);
  for (const key of ["name", "version", "dependencies", "devDependencies", "engines"]) {
    assert.deepEqual(lock.packages[""][key], manifest[key], key);
  }
  for (const path of Object.keys(lock.packages)) {
    assert.doesNotMatch(path, /(?:^|\/)node_modules\/(?:braces|micromatch|fast-glob|vinext|next|eslint-config-next|drizzle-kit|drizzle-orm|better-auth|@esbuild-kit\/[^/]+)$/);
  }
  for (const [name, version] of Object.entries({...manifest.dependencies, ...manifest.devDependencies})) {
    assert.equal(lock.packages[`node_modules/${name}`].version, version, name);
  }
});

test("release workspace contains static inputs, never inherits backend installation, and refuses overwrite", () => {
  const parent = mkdtempSync(resolve(tmpdir(), "lumbre-profile-test-"));
  const target = resolve(parent, "release");
  const prepare = (destination) => spawnSync(process.execPath, [resolve(portal, "scripts/prepare-static-workspace.mjs"), destination], {encoding: "utf8"});
  try {
    const result = prepare(target);
    assert.equal(result.status, 0, result.stderr);
    for (const path of ["static/main.tsx", "app/components/fire-almanac.tsx", "public/editorial", "scripts/check-recipes.mjs", "package-lock.json"]) {
      assert.ok(existsSync(resolve(target, path)), path);
    }
    for (const path of ["node_modules", "server", "app/api", "next-env.d.ts", "wrangler.jsonc", ".env", ".dev.vars"]) {
      assert.equal(existsSync(resolve(target, path)), false, path);
    }
    assert.equal(readFileSync(resolve(target, "package.json"), "utf8"), readFileSync(resolve(portal, "profiles/static/package.json"), "utf8"));
    assert.notEqual(prepare(target).status, 0);
    assert.notEqual(prepare(resolve(portal, "disallowed-release-workspace")).status, 0);
  } finally {
    rmSync(parent, {recursive: true, force: true});
  }
});
