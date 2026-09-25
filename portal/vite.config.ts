import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";
import { sites } from "./build/sites-vite-plugin.ts";

const localStatePath = process.env.LUMBRE_D1_STATE_DIR ?? ".wrangler/state";
const cacheDir = process.env.LUMBRE_VITE_CACHE_DIR ?? "node_modules/.vite";

export default defineConfig({
  cacheDir,
  plugins: [
    vinext({ images: { optimizer: imagesOptimizer() } }),
    sites(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      configPath: "./wrangler.jsonc",
      persistState: { path: localStatePath },
    }),
  ],
});
