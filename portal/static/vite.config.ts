import { cpSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { recipes } from "../data/data.ts";

const root = dirname(fileURLToPath(import.meta.url));
const portal = resolve(root, "..");
const outDir = resolve(portal, "dist-static");

export default defineConfig({
  root,
  publicDir: false,
  appType: "mpa",
  plugins: [react(), {
    name: "recipe-card-index",
    resolveId(id) {
      if (id === "virtual:lumbre-recipe-index") return "\0virtual:lumbre-recipe-index";
    },
    load(id) {
      if (id !== "\0virtual:lumbre-recipe-index") return;
      // Derived at build time from canonical recipes: no duplicate editorial data.
      const cards = recipes.map(({ preparation: _preparation, ...card }) => card);
      return `export default ${JSON.stringify(cards)};`;
    },
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter(item => item.type === "chunk");
      const initial = new Set<string>();
      const visit = (name: string) => {
        if (initial.has(name)) return;
        initial.add(name);
        const chunk = bundle[name];
        if (chunk?.type === "chunk") chunk.imports.forEach(visit);
      };
      chunks.filter(chunk => chunk.isEntry).forEach(chunk => visit(chunk.fileName));
      const detailsModule = /\/recipe-preparations\.ts$/;
      for (const chunk of chunks) {
        if (initial.has(chunk.fileName) && Object.keys(chunk.modules).some(id => detailsModule.test(id))) {
          this.error("Full recipe preparations must remain outside initial JavaScript.");
        }
      }
      if (!chunks.some(chunk => !initial.has(chunk.fileName) && Object.keys(chunk.modules).some(id => detailsModule.test(id)))) {
        this.error("Missing deferred recipe preparations: recipe sheets must retain their content.");
      }
    },
  }, {
    name: "static-only-boundary",
    moduleParsed(info) {
      if (/\/server\/|\/app\/api\/.*\.(tsx?|jsx?)$|better-auth|drizzle|cloudflare|vinext|next\//.test(info.id)) {
        this.error(`Backend code is forbidden in the static artifact: ${info.id}`);
      }
    },
    closeBundle() {
      cpSync(resolve(root, "_headers"), resolve(outDir, "_headers"));
      // Explicit public asset allowlist: no OpenAPI documents or server artifacts.
      for (const directory of ["brand", "editorial"]) {
        cpSync(resolve(portal, "public", directory), resolve(outDir, directory), { recursive: true });
      }
    },
  }],
  build: { outDir, emptyOutDir: true, sourcemap: false },
  preview: { host: "127.0.0.1", port: 3001, strictPort: true },
});
