import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const portal = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(readFileSync(resolve(portal, file), "utf8"));

test("CI pins the verified npm version and preflights the real deploy installation", () => {
  const workflow = readFileSync(resolve(portal, "../.github/workflows/deploy.yml"), "utf8");
  assert.match(workflow, /NPM_VERSION: "11\.17\.0"/);
  assert.equal(workflow.match(/npm install --global "npm@\$NPM_VERSION"/g)?.length, 2);
  const build = workflow.split("  static-build:")[1].split("  browser-tests:")[0];
  assert.match(build, /prepare-deploy-workspace\.mjs/);
  assert.match(build, /cd "\$RUNNER_TEMP\/lumbre-deploy-preflight"\s+npm ci\s+npm ls sharp\s+npm audit/);
});

test("browser CI uses a matching prebuilt image and gates deployment on all browser checks", () => {
  const workflow = readFileSync(resolve(portal, "../.github/workflows/deploy.yml"), "utf8");
  const requirements = readFileSync(resolve(portal, "profiles/browser/requirements.txt"), "utf8");
  const version = /^playwright==([\d.]+)$/m.exec(requirements)?.[1];
  assert.ok(version);
  assert.ok(workflow.includes(`image: mcr.microsoft.com/playwright/python:v${version}-noble`));
  const deployJob = workflow.split("  deploy-production:")[1].split("  component-matrix:")[0];
  const gates = /needs: \[([^\]]+)\]/.exec(deployJob)?.[1].split(",").map(value => value.trim());
  for (const gate of ["static-build", "browser-tests", "component-matrix", "browser-compatibility"]) {
    assert.ok(gates?.includes(gate), `Missing release gate: ${gate}`);
    assert.ok(workflow.includes(`  ${gate}:`), `Missing job: ${gate}`);
  }
  const compatibilityJob = workflow.split("  browser-compatibility:")[1];
  assert.match(compatibilityJob, /browser: \[firefox, webkit\]/);
  assert.match(compatibilityJob, /portal and cross_browser/);
  assert.match(compatibilityJob, /- shell: bash\s+env:\s+(?:#[^\n]*\n\s*)*HOME: \/root\s+run:/,
    "Firefox in the root Actions container requires a root-owned HOME at launch");
  assert.doesNotMatch(workflow, /playwright install|apt-get/);
  const browserJob = workflow.split("  browser-tests:")[1].split("  deploy-production:")[0];
  assert.match(browserJob, /needs: static-build/);
  assert.match(browserJob, /actions\/download-artifact@/);
  assert.match(browserJob, /name: lumbre-static/);
  assert.match(browserJob, /python -m http.server 3001/);
  assert.match(browserJob, /if: always\(\)/);
  assert.match(browserJob, /python -m pytest/);
  assert.match(browserJob, /projects\/lumbre\/tests/);
  assert.match(browserJob, /not matrix/);
  const matrixJob = workflow.split("  component-matrix:")[1].split("  browser-compatibility:")[0];
  assert.match(matrixJob, /component: \[planner_matrix, ingredients_matrix, recipes_matrix, almanac_matrix\]/);
  assert.match(matrixJob, /name: lumbre-static/);
  assert.match(matrixJob, /portal and matrix and \$COMPONENT_FILTER/);
  const canonicalTests = resolve(portal, "../test-framework/projects/lumbre/tests/ui");
  const wrapper = readdirSync(canonicalTests).filter(domain => statSync(resolve(canonicalTests, domain)).isDirectory()).flatMap(domain =>
    readdirSync(resolve(canonicalTests, domain)).filter(name => name.endsWith(".py"))
      .map(name => readFileSync(resolve(canonicalTests, domain, name), "utf8"))).join("\n");
  for (const script of ["test-static", "check-static-print", "test-storage-recovery", "test-planner-goals", "test-planner-simple", "test-planner-fuel", "test-planner-kettle-fuel", "test-planner-weber-defaults", "test-recipe-blend-back"]) {
    assert.ok(wrapper.includes(`${script}.py`), script);
  }
});

test("development and release installations share the same static dependency graph", () => {
  const manifest = read("package.json");
  const lock = read("package-lock.json");
  const release = read("profiles/static/package.json");
  const releaseLock = read("profiles/static/package-lock.json");
  for (const key of ["name", "version", "dependencies", "devDependencies", "engines"]) {
    assert.deepEqual(lock.packages[""][key], manifest[key], key);
  }
  for (const key of ["dependencies", "devDependencies", "engines"]) {
    assert.deepEqual(manifest[key], release[key], key);
  }
  const dependencies = ({packages}) => Object.fromEntries(
    Object.entries(packages).filter(([path]) => path !== ""));
  assert.deepEqual(dependencies(lock), dependencies(releaseLock));
});

test("static lock matches its manifest and excludes legacy dependency chains", () => {
  const manifest = read("profiles/static/package.json");
  const lock = read("profiles/static/package-lock.json");
  assert.equal(lock.lockfileVersion, 3);
  for (const key of ["name", "version", "dependencies", "devDependencies", "engines"]) {
    assert.deepEqual(lock.packages[""][key], manifest[key], key);
  }
  for (const path of Object.keys(lock.packages)) {
    assert.doesNotMatch(path, /(?:^|\/)node_modules\/(?:wrangler|miniflare|sharp|workerd|braces|micromatch|fast-glob|vinext|next|eslint-config-next|drizzle-kit|drizzle-orm|better-auth|@esbuild-kit\/[^/]+)$/);
  }
  for (const [name, version] of Object.entries({...manifest.dependencies, ...manifest.devDependencies})) {
    assert.equal(lock.packages[`node_modules/${name}`].version, version, name);
  }
  assert.equal(lock.packages["node_modules/source-map-js"].version, "1.2.2");
});

test("deploy profile is separate, patched and portable to the public CI registry", () => {
  for (const profile of ["static", "deploy"]) {
    const manifest = read(`profiles/${profile}/package.json`);
    const lock = read(`profiles/${profile}/package-lock.json`);
    for (const key of ["name", "version", "dependencies", "devDependencies", "engines"]) {
      assert.deepEqual(lock.packages[""][key], manifest[key], `${profile}: ${key}`);
    }
    for (const entry of Object.values(lock.packages)) {
      if (entry.resolved) assert.equal(new URL(entry.resolved).origin, "https://registry.npmjs.org");
    }
  }
  const deploy = read("profiles/deploy/package.json");
  const lock = read("profiles/deploy/package-lock.json");
  assert.deepEqual(Object.keys(deploy.devDependencies), ["wrangler"]);
  assert.equal(lock.packages["node_modules/wrangler"].version, deploy.devDependencies.wrangler);
  assert.equal(lock.packages["node_modules/sharp"].version, "0.35.5");
  assert.equal(deploy.overrides.miniflare.sharp, "0.35.5");
  for (const name of ["react", "react-dom", "vite", "tailwindcss", "next", "better-auth", "drizzle-orm"]) {
    assert.equal(lock.packages[`node_modules/${name}`], undefined, name);
  }
});

test("deployment workspace contains tooling config only, not app sources or secrets", () => {
  const parent = mkdtempSync(resolve(tmpdir(), "lumbre-deploy-test-"));
  const target = resolve(parent, "deploy");
  const prepare = (destination) => spawnSync(process.execPath, [resolve(portal, "scripts/prepare-deploy-workspace.mjs"), destination], {encoding: "utf8"});
  try {
    const result = prepare(target);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(readdirSync(target).sort(), [".npmrc", "package-lock.json", "package.json", "scripts", "wrangler.static.jsonc"]);
    assert.deepEqual(readdirSync(resolve(target, "scripts")), ["verify-static-deployment.mjs"]);
    assert.equal(readFileSync(resolve(target, "package.json"), "utf8"), readFileSync(resolve(portal, "profiles/deploy/package.json"), "utf8"));
    assert.notEqual(prepare(target).status, 0);
    assert.notEqual(prepare(resolve(portal, "disallowed-deploy-workspace")).status, 0);
  } finally {
    rmSync(parent, {recursive: true, force: true});
  }
});

test("release workspace contains static inputs, never inherits backend installation, and refuses overwrite", () => {
  const parent = mkdtempSync(resolve(tmpdir(), "lumbre-profile-test-"));
  const target = resolve(parent, "release");
  const prepare = (destination) => spawnSync(process.execPath, [resolve(portal, "scripts/prepare-static-workspace.mjs"), destination], {encoding: "utf8"});
  try {
    const result = prepare(target);
    assert.equal(result.status, 0, result.stderr);
    for (const path of ["static/main.tsx", "static/fire-almanac.tsx", "public/editorial", "scripts/check-recipes.mjs", "package-lock.json"]) {
      assert.ok(existsSync(resolve(target, path)), path);
    }
    for (const path of ["node_modules", "app", "server", "next-env.d.ts", "wrangler.jsonc", ".env", ".dev.vars"]) {
      assert.equal(existsSync(resolve(target, path)), false, path);
    }
    const ingredients = readdirSync(resolve(target, "data/ingredientes"));
    assert.equal(ingredients.filter(name => name.endsWith(".json")).length, 60);
    assert.ok(ingredients.every(name => name.endsWith(".json") || name === "METHODOLOGY.md"));
    assert.equal(existsSync(resolve(target, "app")), false);
    const visited = new Set();
    function checkRelativeImports(file) {
      if (visited.has(file)) return;
      visited.add(file);
      if (!/\.(?:tsx?|m?js)$/.test(file)) return;
      const source = readFileSync(file, "utf8");
      for (const [, specifier] of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
        const base = resolve(dirname(file), specifier);
        const found = [base, ...[".ts", ".tsx", ".js", ".mjs", ".json", "/index.ts", "/index.tsx"].map(ext => base + ext)]
          .find(candidate => existsSync(candidate) && statSync(candidate).isFile());
        assert.ok(found, `Missing release input ${specifier} imported by ${file}`);
        checkRelativeImports(found);
      }
    }
    for (const entry of ["static/main.tsx", "static/vite.config.ts", "scripts/check-recipes.mjs", "scripts/fire-plan-model.test.mjs", "scripts/store-links.test.mjs"]) {
      checkRelativeImports(resolve(target, entry));
    }
    assert.equal(readFileSync(resolve(target, "package.json"), "utf8"), readFileSync(resolve(portal, "profiles/static/package.json"), "utf8"));
    assert.notEqual(prepare(target).status, 0);
    assert.notEqual(prepare(resolve(portal, "disallowed-release-workspace")).status, 0);
  } finally {
    rmSync(parent, {recursive: true, force: true});
  }
});
