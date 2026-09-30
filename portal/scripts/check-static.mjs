import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve("dist-static");
function files(directory) {
  return readdirSync(directory).flatMap(name => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
assert.ok(existsSync(resolve(root, "index.html")), "Static HTML must exist");
for (const name of ["api", "server", "openapi", "_worker.js", "wrangler.json", ".env"]) {
  assert.ok(!existsSync(resolve(root, name)), `${name} must not be published`);
}
for (const file of files(root)) {
  assert.ok(!file.endsWith(".map"), "Do not publish source maps");
  if (!/\.(js|html)$/.test(file)) continue;
  const content = readFileSync(file, "utf8");
  assert.doesNotMatch(content, /\/api\/(account|auth|cart|orders|members|fire-presets|ingredientes|hipotesis)/, `API dependency in ${file}`);
  assert.doesNotMatch(content, /better-auth|AUTH_ALLOWED_EMAIL|CLOUDFLARE_API_TOKEN/, `Backend dependency in ${file}`);
}
console.log("Static boundary passed: HTML/assets only, no application API references or server artifact.");
