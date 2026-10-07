import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { labBases, styles, balance150, toggleLabSelection, weightedProfile, relativeProfile, validAmounts, formulaSignature } from "../static/lab-formula.ts";
import { ingredientSimilarity, productionMatches } from "../static/lab-product-matches.ts";
import { productionProducts } from "../app/lib/production-products.ts";
import { userBlendReferences, referenceFormula } from "../static/lab-user-references.ts";

test("user SPG and SP references preserve approved mass percentages and 150 g yields", () => {
  assert.deepEqual(userBlendReferences.slice(0, 2).map(reference => reference.ingredients.map(item => item.percent)), [[45, 40, 15], [50, 50]]);
  for (const reference of userBlendReferences) {
    assert.equal(reference.ingredients.reduce((sum, item) => sum + item.percent, 0), 100);
    assert.equal(reference.basis, "mass-percent");
  }
  assert.deepEqual(userBlendReferences.slice(0, 2).map(reference => reference.ingredients.map(item => item.percent * 1.5)), [[67.5, 60, 22.5], [75, 75]]);
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

const ingredient = id => JSON.parse(readFileSync(new URL(`../app/api/ingredientes/${id}.json`, import.meta.url)));

test("user references reproduce all supplied formulas by mass, not generic family weights", () => {
  const cases = [
    [["sal_mar_gruesa", "pimienta_negra"], [75, 75], "user-sp-v1"],
    [["sal_mar_gruesa", "pimienta_negra", "ajo_granulado"], [67.5, 60, 22.5], "user-spg-v1"],
    [["sal_mar_gruesa", "pimienta_negra", "ajo_granulado", "shiitake_seco"], [97.5, 30, 15, 7.5], "user-shiitake-v1"],
    [["sal_mar_gruesa", "pimienta_negra", "ajo_granulado", "cafe_molido"], [67.5, 52.5, 22.5, 7.5], "user-coffee-v1"],
    [["sal_mar_gruesa", "azucar_morena", "pimienta_negra", "ajo_granulado", "chile_ancho"], [67.5, 37.5, 22.5, 15, 7.5], "user-sweet-v1"],
    [["sal_mar_gruesa", "pimienta_negra", "ajo_granulado", "comino", "chile_pasilla", "sumac"], [57, 22.5, 22.5, 12, 24, 12], "user-spiced-v1"],
  ];
  for (const [ids, expected, referenceId] of cases) {
    const result = referenceFormula(ids.map(ingredient));
    assert.equal(result.reference.id, referenceId);
    assert.deepEqual(ids.map(id => result.amounts[id]), expected);
    assert.equal(result.adapted, referenceId === "user-sweet-v1");
    assert.deepEqual(referenceFormula([...ids].reverse().map(ingredient)).amounts, result.amounts);
  }
});

test("derived variants reserve salt, split alliums, label substitutions and reject unsupported bases", () => {
  const ids = ["sal_mar_gruesa", "pimienta_negra", "ajo_granulado"];
  for (const additions of [["romero"], ["romero", "cascara_limon"], ["cebolla_granulada"], ["sal_kosher"]]) {
    const result = referenceFormula([...ids, ...additions].map(ingredient));
    const salt = (result.amounts.sal_mar_gruesa ?? 0) + (result.amounts.sal_kosher ?? 0);
    assert.equal(salt, 67.5);
    assert.equal(Math.round(Object.values(result.amounts).reduce((a,b) => a+b, 0)*100), 15000);
    assert.equal(result.adapted, true);
  }
  const onions = referenceFormula([...ids, "cebolla_granulada"].map(ingredient));
  assert.equal(onions.amounts.ajo_granulado, 11.25);
  assert.equal(onions.amounts.cebolla_granulada, 11.25);
  assert.equal(referenceFormula([ingredient("clavo_olor"), ingredient("canela_cassia")]), null);
  assert.equal(referenceFormula([ingredient("sal_mar_gruesa")]), null);
});

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

test("every catalog ingredient recalculates amounts and radar on addition and removal in all styles", () => {
  const catalog = readdirSync(new URL("../app/api/ingredientes/", import.meta.url)).filter(file => file.endsWith(".json")).map(file => ingredient(file.slice(0, -5)));
  for (const style of styles.filter(style => style.id !== "manual")) {
    const base = { ids: [...style.ids], amounts: balance150(catalog.filter(item => style.ids.includes(item.id)), style.id) };
    for (const item of catalog) {
      const before = JSON.stringify(base);
      const next = toggleLabSelection(base, item.id, catalog, style.id);
      assert.equal(next.ids.includes(item.id), !base.ids.includes(item.id));
      const selected = catalog.filter(item => next.ids.includes(item.id));
      assert.deepEqual(next.amounts, balance150(selected, style.id));
      assert.deepEqual(weightedProfile(selected, next.amounts), weightedProfile(selected, balance150(selected, style.id)));
      assert.equal(JSON.stringify(base), before);
      assert.deepEqual(toggleLabSelection(next, item.id, catalog, style.id).amounts, base.amounts);
    }
    const edited = {...base, amounts: Object.fromEntries(base.ids.map(id => [id, 1]))};
    const id = catalog.find(item => !base.ids.includes(item.id)).id;
    const next = toggleLabSelection(edited, id, catalog, style.id);
    assert.deepEqual(next.amounts, balance150(catalog.filter(item => next.ids.includes(item.id)), style.id));
  }
});

test("all starting styles use catalog ingredients and valid gram quantities", () => {
  for (const style of styles.filter(style => style.id !== "manual")) {
    const base = labBases.find(base => base.id === style.id);
    assert.ok(validAmounts(style.ids, balance150(style.ids.map(ingredient), style.id), "g"));
    assert.ok(base.source.startsWith("https://"));
    for (const id of style.ids) {
      const file = new URL(`../app/api/ingredientes/${id}.json`, import.meta.url);
      assert.ok(existsSync(file));
      assert.equal(JSON.parse(readFileSync(file)).id, id);
    }
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

test("removing salt and adding a variation remains possible", () => {
  const amounts = {...labBases[1].amounts};
  delete amounts.sal_kosher;
  amounts.chile_ancho = 0.25;
  assert.ok(validAmounts(Object.keys(amounts), amounts));
});

test("styles constrain direct/indirect and every automatic batch is exactly 150 g", () => {
  assert.deepEqual(styles.filter(style => style.heats.includes("directo")).map(style => style.id), ["salt-pepper", "manual"]);
  assert.equal(styles.filter(style => style.heats.includes("indirecto")).length, 4);
  for (const style of styles.filter(style => style.id !== "manual")) {
    for (const extra of [[], ["clavo_olor"], ["chile_arbol"], ["romero", "cascara_limon"], ["shiitake_seco", "cacao_puro"]]) {
      const items = [...style.ids, ...extra].map(ingredient);
      const result = balance150(items, style.id);
      assert.ok(validAmounts(items.map(item => item.id), result, "g"));
      assert.equal(Math.round(Object.values(result).reduce((sum, value) => sum + value, 0) * 100), 15000);
      if (result.clavo_olor) assert.ok(result.clavo_olor <= 3);
      if (result.chile_arbol) assert.ok(result.chile_arbol <= 3);
    }
  }
  assert.deepEqual(balance150([ingredient("clavo_olor"), ingredient("canela_cassia")], "salt-pepper"), {});
  assert.equal(validAmounts(["a", "b"], {a: 100, b: 51}, "g"), false);
  assert.equal(validAmounts(["a", "b"], {a: 100, b: 50}, "g"), true);
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
