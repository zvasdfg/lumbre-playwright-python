import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { styles, toggleLabSelection, weightedProfile, relativeProfile, validAmounts, formulaSignature } from "../static/lab-formula.ts";
import { ingredientSimilarity, productionMatches } from "../static/lab-product-matches.ts";
import { productionProducts } from "../data/production-products.ts";

test('MATRIX-002 every ingredient pair: weighted tastes, order independence and normalization', () => {
  const catalog = readdirSync(new URL('../data/ingredientes/', import.meta.url))
    .filter(file=>file.endsWith('.json')).map(file=>ingredient(file.slice(0,-5)));
  let checked=0;
  for(let a=0;a<catalog.length;a++) for(let b=a+1;b<catalog.length;b++) {
    const items=[catalog[a],catalog[b]], amounts={[items[0].id]:50,[items[1].id]:100};
    const rows=weightedProfile(items,amounts);
    assert.deepEqual(rows,weightedProfile([...items].reverse(),amounts));
    for(const row of rows) {
      const values=items.map(item=>item.perfil_sensorial[row.axis]);
      if(values.every(v=>typeof v==='number')) {
        assert.ok(Math.abs(row.value-(values[0]+2*values[1])/3)<1e-10,`${items.map(i=>i.id)} ${row.axis}`);
      } else assert.equal(row.value,null);
    }
    const relative=relativeProfile(rows).filter(row=>row.value!==null).map(row=>row.value);
    assert.ok(relative.every(v=>v>=0&&v<=1));
    if(relative.some(v=>v>0)) assert.equal(Math.max(...relative),1);
    checked++;
  }
  assert.equal(checked,catalog.length*(catalog.length-1)/2);
  console.log(`MATRIX-002: ${catalog.length} ingredients; ${checked} pairs; five axes each`);
});

test("production recommendation includes exact 80 percent but excludes lower scores", () => {
  const ids = productionProducts[3].details.components.map(item => item.id);
  assert.equal(ingredientSimilarity(ids.slice(0, 4), ids).score, .8);
  assert.ok(productionMatches(ids.slice(0, 4)).some(match => match.product.id === 124));
  assert.ok(!productionMatches(ids.slice(0, 3)).some(match => match.product.id === 124));
  assert.equal(ingredientSimilarity(["a", "a"], ["a"]).score, 1);
  assert.equal(ingredientSimilarity([], []).score, 0);
  assert.equal(ingredientSimilarity(["a", "b", "c", "extra"], ["a", "b", "c"]).score, .75);
});

test("all canonical blends match themselves first, with no invented ingredient equivalences", () => {
  for (const product of productionProducts) {
    const ids = product.details.components.map(item => item.id);
    const matches = productionMatches(ids);
    assert.equal(matches[0].score, 1);
    assert.ok(matches.every(match => /^LMB-F-\d+$/.test(match.product.details.productCode) && match.score >= .8));
    assert.equal(matches[0].product.id, product.id);
    assert.equal(productionMatches([...ids].reverse())[0].product.id, product.id);
  }
  assert.deepEqual(productionMatches([]), []);
  assert.ok(!productionMatches(["sal_kosher", "pimienta_negra", "ajo_granulado"]).some(match => match.product.id === 121));
});

const ingredient = id => JSON.parse(readFileSync(new URL(`../data/ingredientes/${id}.json`, import.meta.url)));

test("relative radar puts dominant tastes at the edge and preserves ratios, ties, zero and unknown", () => {
  const rows = values => values.map((value, i) => ({axis: String(i), value, coverage: value === null ? 0 : 1}));
  const profile = rows([2, 1, .5, 0, 2]);
  assert.deepEqual(relativeProfile(profile).map(row => row.value), [1, .5, .25, 0, 1]);
  assert.deepEqual(profile.map(row => row.value), [2, 1, .5, 0, 2]);
  assert.deepEqual(relativeProfile(rows([0, 0, 0])).map(row => row.value), [0, 0, 0]);
  assert.deepEqual(relativeProfile(rows([null, .2, .1])).map(row => row.value), [null, 1, .5]);
  assert.deepEqual(relativeProfile(rows([null, null])).map(row => row.value), [null, null]);
  const items = [ingredient("sal_kosher"), ingredient("azucar_morena")];
  for (const amounts of [{sal_kosher: 120, azucar_morena: 30}, {sal_kosher: 30, azucar_morena: 120}]) {
    assert.equal(Math.max(...relativeProfile(weightedProfile(items, amounts)).map(row => row.value ?? 0)), 1);
  }
});

test("quantities reject corrupt, empty, negative, nonfinite and incomplete storage", () => {
  const ids = ["sal_kosher", "pimienta_negra"];
  for (const bad of [null, [], {}, {sal_kosher: 2}, {sal_kosher: 2, pimienta_negra: 0},
    {sal_kosher: -1, pimienta_negra: 2}, {sal_kosher: NaN, pimienta_negra: 2},
    {sal_kosher: Infinity, pimienta_negra: 2}, {sal_kosher: "2", pimienta_negra: 2},
    {sal_kosher: 101, pimienta_negra: 2}]) assert.equal(validAmounts(ids, bad), false);
  assert.equal(validAmounts(ids, {sal_kosher: 0.25, pimienta_negra: 1.5}), true);
  assert.equal(validAmounts(["sal_kosher", "sal_kosher"], {sal_kosher: 1}), false);
});

test("variant identity includes quantities, purpose and source, independent of ingredient order", () => {
  const draft = {baseId: "salt-pepper", amounts: {sal_kosher: 2, pimienta_negra: 1.5}};
  const signature = formulaSignature("res", draft);
  assert.equal(signature, formulaSignature("res", {...draft, amounts: {pimienta_negra: 1.5, sal_kosher: 2}}));
  assert.notEqual(signature, formulaSignature("res", {...draft, amounts: {...draft.amounts, sal_kosher: 1}}));
  assert.notEqual(signature, formulaSignature("pollo", draft));
  assert.notEqual(signature, formulaSignature("res", {...draft, baseId: "sweet-bbq"}));
  assert.equal(signature, formulaSignature("res", JSON.parse(JSON.stringify(draft))));
});

test("radar responds to weight and preserves missing data instead of treating it as zero", () => {
  const items = [ingredient("sal_kosher"), ingredient("azucar_morena")];
  const salty = weightedProfile(items, {sal_kosher: 120, azucar_morena: 30});
  const sweet = weightedProfile(items, {sal_kosher: 30, azucar_morena: 120});
  assert.ok(salty[0].value > sweet[0].value);
  assert.ok(salty[1].value < sweet[1].value);
  assert.deepEqual(salty, weightedProfile(items, {sal_kosher: 60, azucar_morena: 15}));
  const unknown = {...items[1], perfil_sensorial: {...items[1].perfil_sensorial, dulce: null}};
  assert.equal(weightedProfile([items[0], unknown], {sal_kosher: 120, azucar_morena: 30})[1].value, null);
  assert.ok(weightedProfile(items, {}).every(row => row.value === null));
});

test("plain salts do not add umami and aromas never leak into the five taste axes", () => {
  for (const id of ["sal_mar_gruesa", "sal_kosher", "flor_sal", "sal_colima"]) {
    assert.equal(weightedProfile([ingredient(id)], {[id]: 75}).find(row => row.axis === "umami").value, 0);
  }
  const original = ingredient("cascara_limon");
  const modified = {...original, perfil_sensorial: {...original.perfil_sensorial, citrico: 5, herbal: 5, ahumado: 5, terroso: 5, picante: 5}};
  assert.deepEqual(weightedProfile([original], {[original.id]: 10}), weightedProfile([modified], {[original.id]: 10}));
  assert.deepEqual(weightedProfile([original], {[original.id]: 10}).map(row => row.axis), ["salado", "dulce", "acido", "amargo", "umami"]);
});

test("all four peppers contribute additively by mass without artificial taste conversion", () => {
  const amounts = {sal_mar_gruesa:75, pimienta_negra:20, pimienta_blanca:20, pimienta_rosa:20, pimienta_verde:15};
  const items = Object.keys(amounts).map(ingredient);
  const profile = weightedProfile(items, amounts);
  for (const row of profile) {
    const expected = items.reduce((sum, item) => sum + item.perfil_sensorial[row.axis] * amounts[item.id], 0) / 150;
    assert.ok(Math.abs(row.value - expected) < 1e-10);
  }
  assert.ok(Math.abs(relativeProfile(profile).find(row => row.axis === "umami").value - 55 / 375) < 1e-10);
  const removed = {...amounts, pimienta_negra: 0};
  assert.notDeepEqual(weightedProfile(items, removed), profile);
});

test("grams and legacy teaspoons are never confused in saved identity", () => {
  const draft = {baseId: "salt-pepper", amounts: {sal_kosher: 2, pimienta_negra: 1}};
  assert.notEqual(formulaSignature("res", draft), formulaSignature("res", {...draft, unit: "g", heat: "directo"}));
  assert.notEqual(formulaSignature("res", {...draft, unit: "g", heat: "directo"}), formulaSignature("res", {...draft, unit: "g", heat: "indirecto"}));
});

test("manual explorer never invents grams or changes salt when adding/removing another ingredient", () => {
  const catalog = [ingredient("sal_mar_gruesa"), ingredient("pimienta_negra"), ingredient("ajo_granulado")];
  const saved = {ids: ["sal_mar_gruesa", "pimienta_negra"], amounts: {sal_mar_gruesa: 60, pimienta_negra: 40}};
  const added = toggleLabSelection(saved, "ajo_granulado", catalog, "manual");
  assert.equal(added.amounts.sal_mar_gruesa, 60);
  assert.equal(added.amounts.pimienta_negra, 40);
  assert.ok(Number.isNaN(added.amounts.ajo_granulado));
  assert.equal(validAmounts(added.ids, added.amounts, "g"), false);
  assert.deepEqual(toggleLabSelection(added, "ajo_granulado", catalog, "manual"), saved);
});

test("all ingredients stay blank on selection and preserve unrelated manual amounts", () => {
  const catalog = readdirSync(new URL("../data/ingredientes/", import.meta.url))
    .filter(file => file.endsWith(".json")).map(file => ingredient(file.slice(0, -5)));
  for (const style of styles) {
    for (const item of catalog) {
      const base = { ids: [], amounts: {} };
      const selected = toggleLabSelection(base, item.id, catalog, style.id);
      assert.ok(Number.isNaN(selected.amounts[item.id]));
      assert.deepEqual(toggleLabSelection(selected, item.id, catalog, style.id), base);
    }
  }
  const filled = { ids: ["sal_kosher", "comino"], amounts: { sal_kosher: 17, comino: 23 } };
  assert.equal(validAmounts(filled.ids, filled.amounts, "g"), true);
  assert.deepEqual(toggleLabSelection(filled, "not-in-catalog", catalog, "manual"), filled);
});
test("legacy style identifiers retain validation without any automatic recipe allocation", () => {
  assert.deepEqual(styles.filter(style => style.heats.includes("directo")).map(style => style.id), ["salt-pepper", "manual"]);
  assert.equal(styles.filter(style => style.heats.includes("indirecto")).length, 4);
  assert.equal(validAmounts(["a", "b"], { a: 100, b: 51 }, "g"), false);
  assert.equal(validAmounts(["a", "b"], { a: 100, b: 50 }, "g"), true);
  assert.notEqual(formulaSignature("res", { baseId: "manual", amounts: { a: 1, b: 2 }, referencePolicy: "manual-v1" }),
    formulaSignature("res", { baseId: "manual", amounts: { a: 1, b: 2 }, referencePolicy: "user-v1" }));
});
