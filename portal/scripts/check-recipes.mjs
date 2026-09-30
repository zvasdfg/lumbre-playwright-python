import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { recipePreparations, recipeSources } from "../app/lib/recipe-preparations.ts";

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
  assert.ok(item.ingredients.length >= 4, `ingredients ${id}`);
  assert.ok(item.ingredients.every((line) => /\d/.test(line)), `Unquantified ingredient ${id}`);
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
console.log("PASS: 100 matching IDs, quantified ingredients, 100 distinct methods, sources and critical safety cases.");
