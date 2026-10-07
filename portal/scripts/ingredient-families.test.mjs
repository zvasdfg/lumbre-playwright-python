import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { familyLabel, orderIngredientFamilies } from "../static/ingredient-family-presentation.ts";

test("laboratory families follow cooking order without dropping catalog families", () => {
  const catalog = new URL("../app/api/ingredientes/", import.meta.url);
  const families = [...new Set(readdirSync(catalog).filter(file => file.endsWith(".json"))
    .map(file => JSON.parse(readFileSync(new URL(file, catalog), "utf8")).familia))];
  const original = [...families];
  assert.deepEqual(orderIngredientFamilies(families), [
    "Sal", "Pimienta", "Allium", "Endulzante", "Chile", "Hierba",
    "Semilla_aromatica", "Citrico", "Especia_calida", "Umami", "Tostado",
  ]);
  assert.deepEqual(families, original);
  assert.deepEqual(orderIngredientFamilies(["Otra_familia", "Umami", "Sal"]), ["Sal", "Umami", "Otra_familia"]);
});

test("family labels explain less familiar ingredient groups", () => {
  assert.equal(familyLabel("Especia_calida"), "Canela, clavo y otras especias");
  assert.equal(familyLabel("Semilla_aromatica"), "Aromáticos");
  assert.equal(familyLabel("Tostado"), "Tostados: café y cacao");
  assert.equal(familyLabel("Otra_familia"), "Otra familia");
});
