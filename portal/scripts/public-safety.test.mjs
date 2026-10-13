import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { allowedPublicFile, contentFindings, forbiddenTrackedFile } from "./public-safety.mjs";

test("publication accepts only compiled web assets and public images", () => {
  for (const name of ["index.html", "_headers", "assets/index-abc_1.js", "assets/index-abc.css", "editorial/products/lmb-f-001.jpeg", "brand/logo.svg"]) assert.ok(allowedPublicFile(name), name);
  for (const name of [".env", "assets/main.js.map", "editorial/report.md", "brand/backup.json", "editorial/customer.pdf", "brand/.git/config", "editorial/../private.jpg", "docs/README.md"]) assert.equal(allowedPublicFile(name), false, name);
});
test("secret examples fail without echoing their values", () => {
  const samples = [
    ["gh" + "p_" + "a".repeat(36), "github-token"],
    ["AK" + "IA" + "A".repeat(16), "aws-access-id"],
    ["sk_" + "live_" + "a".repeat(24), "stripe-secret"],
    ["-----BEGIN " + "PRIVATE KEY-----", "private-key"],
    ["CLOUDFLARE_API_TOKEN = '" + "a".repeat(40) + "'", "hardcoded-provider-secret"],
    ["https://user:" + "a".repeat(12) + "@example.test", "credential-url"],
  ];
  for (const [value, rule] of samples) {
    const found = contentFindings("sample.txt", "header\n" + value);
    assert.ok(found.some(finding => finding.rule === rule && finding.line === 2));
    assert.ok(!JSON.stringify(found).includes(value));
  }
});
test("public declarations cannot acquire manufacturing quantities", () => {
  assert.deepEqual(contentFindings("portal/data/production-products.ts", "netContent: '150 g', components: []"), []);
  assert.equal(contentFindings("portal/data/production-products.ts", "components: [{grams: 1}]")[0].rule, "production-quantities");
  assert.deepEqual(contentFindings("example.ts", "const token = process.env.CLOUDFLARE_API_TOKEN"), []);
});
test("private evidence and credentials do not belong in the tracked tree", () => {
  for (const name of [".env", "portal/.dev.vars", "auth.json", "private/a.md", "test-framework/reports/a.html", "trace.zip", "key.pem", "backup.sqlite", ".mypy_cache/a.json"]) assert.ok(forbiddenTrackedFile(name), name);
  for (const name of ["test-framework/.env.example", "portal/package-lock.json", "docs/SECURITY.md", "portal/static/_headers"]) assert.equal(forbiddenTrackedFile(name), false, name);
});
test("private provenance and prototype identity are rejected without printing them", () => {
  const sample = "LMB-" + "C-003";
  assert.equal(contentFindings("sample.ts", sample)[0].rule, "private-formulation-reference");
  assert.equal(contentFindings("sample.ts", "/" + "Users/test-person/private")[0].rule, "personal-filesystem-path");
  assert.equal(contentFindings("sample.ts", "test" + "@hotmail.com")[0].rule, "personal-email");
});
test("retired formula metadata cannot return in public historical QA records", () => {
  assert.equal(contentFindings("docs/lab-audit.json", '{"family_starting_weights": {"sample": 1}}')[0].rule, "retired-formulation-metadata");
});
test("actual build gate rejects non-public files, secrets, active SVG and symlinks", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "lumbre-public-boundary-"));
  const script = new URL("./check-static.mjs", import.meta.url);
  const secret = "gh" + "p_" + "a".repeat(36);
  try {
    mkdirSync(resolve(directory, "static"));
    cpSync(new URL("../static/_headers", import.meta.url), resolve(directory, "static/_headers"));
    const cases = [
      [null, null, true],
      ["brand/private.md", "internal", false],
      ["assets/index-a.js.map", "{}", false],
      ["editorial/source.json", "{}", false],
      ["assets/index-a.js", secret, false],
      ["brand/logo.svg", '<svg><script>alert(1)</script></svg>', false],
      ["brand/link.png", "SYMLINK", false],
    ];
    for (const [name, value, valid] of cases) {
      rmSync(resolve(directory, "dist-static"), { force: true, recursive: true });
      mkdirSync(resolve(directory, "dist-static"));
      cpSync(resolve(directory, "static/_headers"), resolve(directory, "dist-static/_headers"));
      writeFileSync(resolve(directory, "dist-static/index.html"), "<html>public fixture</html>");
      if (name) {
        mkdirSync(resolve(directory, "dist-static", name, ".."), { recursive: true });
        if (value === "SYMLINK") symlinkSync(resolve(directory, "static/_headers"), resolve(directory, "dist-static", name));
        else writeFileSync(resolve(directory, "dist-static", name), value);
      }
      const result = spawnSync(process.execPath, [script.pathname], { cwd: directory, encoding: "utf8" });
      assert.equal(result.status === 0, valid, name ?? "safe fixture");
      assert.ok(!(result.stdout + result.stderr).includes(secret), "Gate must never echo secret contents");
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
