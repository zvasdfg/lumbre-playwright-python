import { cpSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = dirname(fileURLToPath(import.meta.url));
const portal = resolve(root, "..");
const outDir = resolve(portal, "dist-static");

export default defineConfig({
  root,
  publicDir: false,
  appType: "mpa",
  resolve: { alias: { "next/image": resolve(root, "image.tsx") } },
  plugins: [react(), {
    name: "static-only-boundary",
    moduleParsed(info) {
      if (/\/server\/|\/app\/api\/.*\.(tsx?|jsx?)$|better-auth|drizzle|cloudflare|vinext|next\//.test(info.id)) {
        this.error(`Backend code is forbidden in the static artifact: ${info.id}`);
      }
    },
    closeBundle() {
      // Explicit public asset allowlist: no OpenAPI documents or server artifacts.
      for (const directory of ["brand", "editorial"]) {
        cpSync(resolve(portal, "public", directory), resolve(outDir, directory), { recursive: true });
      }
    },
  }],
  build: { outDir, emptyOutDir: true, sourcemap: false },
  preview: { host: "127.0.0.1", port: 3001, strictPort: true },
});
