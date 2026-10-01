import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const base = new URL(process.argv[2]);
assert.equal(base.protocol, "https:");
const localHtml = readFileSync(new URL("../dist-static/index.html", import.meta.url), "utf8");
const asset = localHtml.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
assert.ok(asset, "No built JavaScript asset");
const local = readFileSync(new URL(`../dist-static${asset}`, import.meta.url));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    const url = new URL(base);
    url.searchParams.set("release", `${Date.now()}-${attempt}`);
    const html = await fetch(url, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(15000) });
    assert.ok(html.ok, `HTML status ${html.status}`);
    assert.ok((await html.text()).includes(asset), "HTML does not reference this release yet");
    const response = await fetch(new URL(asset, base), { signal: AbortSignal.timeout(15000) });
    assert.ok(response.ok, `Asset status ${response.status}`);
    assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(local), "Published bundle differs from build");
    console.log(`PASS: ${base.origin} serves ${asset}; SHA-256 matches the build.`);
    process.exit(0);
  } catch (error) {
    console.log(`Verification attempt ${attempt}: ${error.message}`);
    if (attempt === 12) throw error;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
