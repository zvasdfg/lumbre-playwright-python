import assert from "node:assert/strict";
import { readdirSync, readFileSync, lstatSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { allowedPublicFile, contentFindings } from "./public-safety.mjs";

const root = resolve("dist-static");
function files(directory) {
  return readdirSync(directory).flatMap(name => {
    const path = resolve(directory, name);
    const stat = lstatSync(path);
    assert.ok(!stat.isSymbolicLink(), "Do not publish filesystem links");
    return stat.isDirectory() ? files(path) : [path];
  });
}
assert.ok(existsSync(resolve(root, "index.html")), "Static HTML must exist");
const headers = readFileSync(resolve(root, "_headers"), "utf8");
assert.equal(headers, readFileSync(resolve("static/_headers"), "utf8"), "Security headers must be copied unchanged");
for (const required of ["Content-Security-Policy:", "connect-src 'none'", "X-Content-Type-Options: nosniff", "X-Frame-Options: DENY", "Referrer-Policy:", "Permissions-Policy:"]) {
  assert.ok(headers.includes(required), `Missing security header: ${required}`);
}
for (const name of ["api", "server", "openapi", "_worker.js", "wrangler.json", ".env"]) {
  assert.ok(!existsSync(resolve(root, name)), `${name} must not be published`);
}
for (const file of files(root)) {
  const name = relative(root, file).replaceAll("\\", "/");
  assert.ok(allowedPublicFile(name), `Non-public file in build: ${name}`);
  if (!/\.(js|html|css|svg)$/.test(file)) continue;
  const content = readFileSync(file, "utf8");
  assert.deepEqual(contentFindings(name, content), [], `Publication policy failed in ${name}`);
  if (name.endsWith(".svg")) {
    assert.doesNotMatch(content, /<(?:script|foreignObject|iframe|embed|object)|\bon\w+\s*=|@import|url\(\s*["']?\s*https?:|(?:href|xlink:href)=["']\s*(?:javascript:|https?:)/i, `Active SVG content: ${name}`);
  }
  assert.doesNotMatch(content, /\/api\//, `API dependency in ${file}`);
  assert.doesNotMatch(content, /better-auth|AUTH_ALLOWED_EMAIL|CLOUDFLARE_API_TOKEN/, `Backend dependency in ${file}`);
}
console.log("Static boundary passed: HTML/assets only, no application API references or server artifact.");
