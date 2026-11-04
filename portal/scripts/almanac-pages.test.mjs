import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const pages = JSON.parse(readFileSync(new URL("../data/almanac-pages.json", import.meta.url)));

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

test("archive has 001–105 plus the second original 059, in reading order", () => {
  assert.equal(pages.length, 106);
  const expected = Array.from({length: 105}, (_, i) => String(i + 1).padStart(3, "0"));
  expected.splice(59, 0, "059");
  assert.deepEqual(pages.map(p => p.document), expected);
  assert.equal(new Set(pages.map(p => p.image)).size, 106);
  const sharedNumber = pages.filter(p => p.document === "059");
  assert.match(sharedNumber[0].title, /sartén/);
  assert.match(sharedNumber[1].title, /cepillo/);
  assert.equal(sharedNumber[1].image, "/editorial/almanac/page-059-cepillo.jpeg");
});

test("every page has a complete, correctly sized, bounded web asset and useful alternative text", () => {
  for (const page of pages) {
    assert.match(page.image, /^\/editorial\/almanac\/page-\d{3}(?:-cepillo)?\.jpeg$/);
    assert.ok(page.title.length > 3 && page.alt.length > 15, page.image);
    const bytes = readFileSync(new URL(`../public${page.image}`, import.meta.url));
    assert.deepEqual(jpegDimensions(bytes), [page.width, page.height], page.document);
    assert.ok(bytes.length < 1_500_000, `Oversized page ${page.image}`);
    assert.equal(bytes.subarray(-2).toString("hex"), "ffd9", "Complete JPEG");
  }
  const files = readdirSync(new URL("../public/editorial/almanac/", import.meta.url));
  assert.equal(files.filter(f => /^page-.*\.jpeg$/.test(f)).length, 106);
});

test("deferred trigger and reader share the catalog and duplicate numbers have unique React keys", () => {
  for (const file of ["deferred-almanac.tsx", "fire-almanac.tsx"]) {
    const code = readFileSync(new URL(`../static/${file}`, import.meta.url), "utf8");
    assert.match(code, /import almanacPages/);
    assert.ok(code.includes('"../data/almanac-pages.json"'));
    assert.match(code, /almanacPages\.length/);
    assert.doesNotMatch(code, /53 notas de campo/);
  }
  const reader = readFileSync(new URL("../static/fire-almanac.tsx", import.meta.url), "utf8");
  assert.match(reader, /key=\{page\.image\}/);
  assert.match(reader, /dos originales distintos con el número 059/);
});
