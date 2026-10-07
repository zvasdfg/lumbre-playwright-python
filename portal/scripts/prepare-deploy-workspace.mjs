import { cpSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const portal = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = process.argv[2];
if (!destination || !isAbsolute(destination)) throw new Error("Provide an absolute path to a NEW isolated workspace.");
const target = resolve(destination);
if (existsSync(target)) throw new Error("Destination already exists; refusing to overwrite it.");
const canonicalTarget = resolve(realpathSync(dirname(target)), target.split(sep).at(-1));
if (canonicalTarget === portal || canonicalTarget.startsWith(portal + sep)) {
  throw new Error("Workspace must be outside portal to prevent fallback to legacy node_modules.");
}
// Only deployment inputs. The validated artifact is downloaded separately by CI.
const files = {
  "profiles/deploy/package.json": "package.json",
  "profiles/deploy/package-lock.json": "package-lock.json",
  ".npmrc": ".npmrc",
  "wrangler.static.jsonc": "wrangler.static.jsonc",
  "scripts/verify-static-deployment.mjs": "scripts/verify-static-deployment.mjs",
};
for (const file of Object.keys(files)) {
  if (!existsSync(resolve(portal, file))) throw new Error(`Missing deployment input: ${file}`);
}
mkdirSync(target);
for (const [source, destination] of Object.entries(files)) {
  const output = resolve(target, destination);
  mkdirSync(dirname(output), { recursive: true });
  cpSync(resolve(portal, source), output);
}
console.log(`Prepared isolated deployment: ${target}`);
