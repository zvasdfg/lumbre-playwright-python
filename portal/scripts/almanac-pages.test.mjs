import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { createHash } from "node:crypto";

const pages = JSON.parse(readFileSync(new URL("../data/almanac-pages.json", import.meta.url)));
const release = JSON.parse(readFileSync(new URL("../data/almanac-release.json", import.meta.url)));

test("all105 web assets match the reviewed normalization release hashes", () => {
  assert.equal(release.revision, "r023");
  assert.equal(release.count, 105);
  assert.deepEqual(release.entries.map(e => e.document), pages.map(p => p.document));
  assert.deepEqual(release.correctionsFromPreviousReview, {revision: "r022", corrected: 23, reusedUnchanged: 82});
  assert.equal(release.reviewedMasterManifestSha256, "91df0b07e7104e992fe68b84fd1258e6194da30c8adc84af2ac1cfe6259c6682");
  const correctedDocuments = ["002", "011", "012", "013", "014", "016", "017", "018", "024", "025", "026", "027", "028", "038", "041", "050", "053", "058", "059", "060", "092", "093", "105"];
  assert.deepEqual(release.entries.filter(e => e.revision === "r023").map(e => e.document), correctedDocuments);
  assert.equal(release.entries.filter(e => e.revision === "r022").length, 82);
  for (const entry of release.entries) {
    const bytes = readFileSync(new URL(`../public${entry.image}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256, entry.document);
    assert.match(entry.masterSha256, /^[a-f0-9]{64}$/);
    assert.equal(bytes.length, entry.bytes, entry.document);
  }
});

function jpegDimensions(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, "JPEG signature");
  let offset = 2;
  while (offset < bytes.length) {
    assert.equal(bytes[offset], 0xff, "JPEG marker");
    const marker = bytes[offset + 1];
    const size = bytes.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)];
    }
    offset += 2 + size;
  }
  throw new Error("JPEG has no supported frame header");
}

test("normalized archive has exactly 001–105, excluding the duplicate brush", () => {
  assert.equal(pages.length, 105);
  const expected = Array.from({length: 105}, (_, i) => String(i + 1).padStart(3, "0"));
  assert.deepEqual(pages.map(p => p.document), expected);
  assert.equal(new Set(pages.map(p => p.image)).size, 105);
  const sharedNumber = pages.filter(p => p.document === "059");
  assert.match(sharedNumber[0].title, /sartén/);
  assert.equal(sharedNumber.length, 1);
  assert.ok(pages.every(p => !p.image.includes("cepillo")));
});

test("every page has a complete, correctly sized, bounded web asset and useful alternative text", () => {
  for (const page of pages) {
    assert.match(page.image, /^\/editorial\/almanac\/page-\d{3}\.jpeg$/);
    assert.deepEqual([page.width, page.height], [1254, 1254], "Uniform square web export");
    assert.ok(page.title.length > 3 && page.alt.length > 15, page.image);
    const bytes = readFileSync(new URL(`../public${page.image}`, import.meta.url));
    assert.deepEqual(jpegDimensions(bytes), [page.width, page.height], page.document);
    assert.ok(bytes.length < 1_500_000, `Oversized page ${page.image}`);
    assert.equal(bytes.subarray(-2).toString("hex"), "ffd9", "Complete JPEG");
  }
  const files = readdirSync(new URL("../public/editorial/almanac/", import.meta.url));
  assert.equal(files.filter(f => /^page-.*\.jpeg$/.test(f)).length, 105);
});

test("deferred trigger and reader share the catalog and explain the illustrative taste maps", () => {
  for (const file of ["deferred-almanac.tsx", "fire-almanac.tsx"]) {
    const code = readFileSync(new URL(`../static/${file}`, import.meta.url), "utf8");
    assert.match(code, /import almanacPages/);
    assert.ok(code.includes('"../data/almanac-pages.json"'));
    assert.match(code, /almanacPages\.length/);
    assert.doesNotMatch(code, /53 notas de campo/);
  }
  const reader = readFileSync(new URL("../static/fire-almanac.tsx", import.meta.url), "utf8");
  assert.match(reader, /key=\{page\.image\}/);
  assert.match(reader, /Mapa tradicional ilustrativo/);
  assert.match(reader, /no representan zonas anatómicas exclusivas/);
  assert.doesNotMatch(reader, /dos originales distintos|porcentajes de la lámina 036|page-059-cepillo/);
  for (const page of pages.filter(p => +p.document >= 31 && +p.document <= 36)) {
    assert.match(page.alt, /Mapa tradicional ilustrativo/);
  }
});
