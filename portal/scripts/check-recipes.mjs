import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { recipePreparations, baseRecipePreparations, recipeSources, recipeBlendRecommendations, recipeBlendIngredient } from "../app/lib/recipe-preparations.ts";
import { productionProducts } from "../app/lib/production-products.ts";

const catalog = readFileSync(new URL("../app/lib/data.ts", import.meta.url), "utf8");
const ids = [...catalog.slice(0, catalog.indexOf("const categoryLabels")).matchAll(/\bid: (\d+)/g)].map((match) => Number(match[1]));
assert.equal(ids.length, 100);
assert.equal(new Set(ids).size, 100);
assert.deepEqual(Object.keys(recipePreparations).map(Number), [...ids].sort((a, b) => a - b));
const methods = new Set();
for (const id of ids) {
  const item = recipePreparations[id];
  assert.ok(Number.isInteger(item.servings) && item.servings > 0, `servings ${id}`);
  assert.match(item.total, /\d.*(?:h|min)/, `total ${id}`);
  for (const key of ["timing", "fire", "doneness"]) assert.ok(item[key].length >= 5, `${key} ${id}`);
  const blend = recipeBlendRecommendations[id];
  assert.ok(item.ingredients.length >= (blend ? 3 : 4), `ingredients ${id}`);
  assert.ok(item.ingredients.every((line) => /\d/.test(line.replace(/LMB-F-\d+/g, "")) || (blend?.mode === "integrated" && line === recipeBlendIngredient(blend.productCode))), `Unquantified ingredient ${id}`);
  if (blend) {
    assert.ok(productionProducts.some(product => product.details.productCode === blend.productCode), `Missing blend ${id}`);
    if (blend.mode === "integrated") {
      assert.equal(item.ingredients.filter(line => line === recipeBlendIngredient(blend.productCode)).length, 1);
      assert.ok(blend.replaces.length > 0 && blend.replaces.every(line => baseRecipePreparations[id].ingredients.includes(line) && !item.ingredients.includes(line)), `Duplicate/missing seasoning ${id}`);
      assert.ok(item.steps.join(" ").includes(blend.productCode), `Missing method substitution ${id}`);
      assert.ok(!item.ingredients.some(line => /^\d.* de sal$/.test(line)), `Separate salt ${id}`);
    }
  }
  if (blend?.mode !== "integrated") assert.deepEqual(item, baseRecipePreparations[id], `Unexpected base change ${id}`);
  for (const key of ["servings", "total", "timing", "fire", "doneness", "sources"]) assert.deepEqual(item[key], baseRecipePreparations[id][key], `Preserved ${key} ${id}`);
  assert.equal(item.steps.length, 4, `Steps ${id}`);
  assert.ok(item.steps.every((step) => step.trim().length > 10), `Empty step ${id}`);
  assert.equal(new Set(item.ingredients).size, item.ingredients.length, `Duplicate ingredient ${id}`);
  assert.ok(item.sources.length >= 3 && item.sources.every((key) => recipeSources[key]), `Sources ${id}`);
  assert.ok(!/\b(?:TBD|pendiente|Lorem ipsum)\b|\bTODO\b/.test(JSON.stringify(item)), `Placeholder ${id}`);
  methods.add(item.steps.join(" "));
}
assert.equal(methods.size, 100, "Repeated preparation");
for (const id of [4, 21, 22, 23, 31, 48, 49, 50]) assert.match(recipePreparations[id].doneness, /74 °C/, `Poultry ${id}`);
for (const id of [29, 36]) assert.match(recipePreparations[id].doneness, /71 °C/, `Game ${id}`);
assert.match(recipePreparations[59].steps.join(" "), /No prepares sales de curado/);
assert.match(recipePreparations[60].steps.join(" "), /no se incluye elaboración ni secado casero/);
assert.match(recipePreparations[20].doneness, /63 °C/);
assert.equal(Object.keys(recipeBlendRecommendations).length, 73);
for (const [code, integrated, optional] of [["001",10,28],["002",15,5],["003",3,4],["004",5,3]]) {
  const records = Object.values(recipeBlendRecommendations).filter(r => r.productCode === `LMB-F-${code}`);
  assert.equal(records.filter(r => r.mode === "integrated").length, integrated);
  assert.equal(records.filter(r => r.mode === "optional").length, optional);
}
assert.ok(productionProducts.find(p => p.details.productCode === "LMB-F-002").details.components.some(c => c.id === "ajo_granulado"));
assert.ok(recipePreparations[44].ingredients.includes("10 g de chile ancho molido"));
assert.ok(recipePreparations[44].ingredients.includes("200 ml de caldo sin sal"));
console.log("PASS: 100 recipes; 33 integrated, 40 optional, 27 unchanged; canonical blends, preserved safety and methods.");
