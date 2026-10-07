import { cpSync, existsSync, mkdirSync, readdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const portal = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = process.argv[2];
if (!destination || !isAbsolute(destination)) throw new Error("Provide an absolute path to a NEW isolated workspace.");
const target = resolve(destination);
if (existsSync(target)) throw new Error("Destination already exists; refusing to overwrite it.");
const parent = realpathSync(dirname(target));
const canonicalTarget = resolve(parent, target.split(sep).at(-1));
if (canonicalTarget === portal || canonicalTarget.startsWith(portal + sep)) {
  throw new Error("Workspace must be outside portal to prevent fallback to legacy node_modules.");
}
const files = [
  "static", "app/globals.css", "app/lib", "app/components/fire-almanac.tsx",
  "public/brand", "public/editorial", "postcss.config.mjs", "tsconfig.static.json",
  ".npmrc",
  "scripts/check-static.mjs", "scripts/check-recipes.mjs",
  "scripts/fire-plan-model.test.mjs", "scripts/fire-plan-fuel.test.mjs", "scripts/verify-static-deployment.mjs",
  "scripts/ingredient-families.test.mjs",
  "scripts/lab-formula.test.mjs",
];
// Canonical ingredient DATA lives under app/api, but no route/server code is copied.
for (const entry of readdirSync(resolve(portal, "app/api/ingredientes"), {withFileTypes: true})) {
  if (entry.isFile() && entry.name.endsWith(".json")) files.push(`app/api/ingredientes/${entry.name}`);
}
for (const file of [...files, "profiles/static/package.json", "profiles/static/package-lock.json"]) {
  if (!existsSync(resolve(portal, file))) throw new Error(`Missing static release input: ${file}`);
}
mkdirSync(target);
for (const file of files) {
  const output = resolve(target, file);
  mkdirSync(dirname(output), { recursive: true });
  cpSync(resolve(portal, file), output, { recursive: true });
}
for (const file of ["package.json", "package-lock.json"]) {
  cpSync(resolve(portal, "profiles/static", file), resolve(target, file));
}
console.log(`Prepared isolated static release: ${target}`);
