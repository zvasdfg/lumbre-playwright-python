import assert from "node:assert/strict";
import test from "node:test";
import { productStoreUrl, storeUrl } from "../static/store-links.ts";

test("each production rub links to its matching Tiendanube product", () => {
  const urls = ["001", "002", "003", "004"].map(code => {
    const url = new URL(productStoreUrl(`LMB-F-${code}`));
    assert.equal(url.origin, "https://lumbre16.mitiendanube.com");
    assert.ok(url.pathname.startsWith(`/productos/lmb-f-${code}-`));
    return url.href;
  });
  assert.equal(new Set(urls).size, 4);
});
test("unknown product falls back to the catalog, never a broken product", () => {
  assert.equal(productStoreUrl("UNKNOWN"), storeUrl);
});
