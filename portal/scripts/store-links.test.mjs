import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { productStoreUrl, storeUrl } from "../static/store-links.ts";
import { productionProducts } from "../data/production-products.ts";

test("all four production rubs use the current owner-approved 109 MXN unit price", () => {
  assert.equal(productionProducts.length, 4);
  for (const product of productionProducts) {
    assert.equal(product.price, 109, product.details.productCode);
  }
});

test("production covers use the approved 200 g r011 packaging and keep the original assets", () => {
  for (const product of productionProducts) {
    const code = product.details.productCode.toLowerCase();
    assert.equal(product.details.image, `/editorial/products/r011/${code}.jpg`);
    assert.equal(product.details.netContent, "200 g");
    const cover = readFileSync(new URL(`../public${product.details.image}`, import.meta.url));
    assert.equal(cover.subarray(0, 2).toString("hex"), "ffd8");
    assert.ok(readFileSync(new URL(`../public/editorial/products/${code}.jpeg`, import.meta.url)).length > 0);
    assert.ok(readFileSync(new URL(`../public/editorial/products/r008/${code}.jpg`, import.meta.url)).length > 0);
  }
});

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
test("store is the first section and first destination in both navigation menus", () => {
  const portal = readFileSync(new URL("../static/portal.tsx", import.meta.url), "utf8");
  assert.match(portal, /<main id="inicio" data-app-ready="true">/);
  assert.match(portal.match(/<section\b[^>]*>/)?.[0] ?? "", /id="tienda"/);
  assert.equal((portal.match(/id="tienda"/g) ?? []).length, 1);
  for (const menu of [portal.match(/<nav\b[\s\S]*?<\/nav>/)?.[0], portal.match(/<details\b[\s\S]*?<\/details>/)?.[0]]) {
    assert.equal(menu?.match(/<a href="([^"]+)"/)?.[1], "#tienda");
  }
  assert.match(portal, /priority=\{index === 0\}/);
});
test("compact storefront has one page title, discoverable tools and explicit product actions", () => {
  const portal = readFileSync(new URL("../static/portal.tsx", import.meta.url), "utf8");
  assert.equal((portal.match(/<h1\b/g) ?? []).length, 1);
  assert.match(portal, /<h1 id="store-title">Sazonadores para cocinar al fuego\.<\/h1>/);
  assert.match(portal, /Cuatro mezclas\. Encuentra la tuya\./);
  assert.doesNotMatch(portal, /className="hero-photo"/);
  assert.match(portal, /className="product-purchase"/);
  assert.match(portal, /aria-label=\{`Comprar \$\{product.name\} en la tienda`\}/);
  assert.match(portal, /className="product-title"/);
  assert.match(portal, /product-image-open/);
  assert.match(portal, /aria-label="Herramientas de Lumbre"/);
  assert.doesNotMatch(portal, /className="product-(?:description|ingredients)"/);
  assert.ok(portal.indexOf("<FireAlmanac />") < portal.indexOf("</header>"));
});
