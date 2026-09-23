import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { sites } from "./build/sites-vite-plugin";

const localStatePath = process.env.LUMBRE_D1_STATE_DIR ?? ".wrangler/state";

export default defineConfig({
  plugins: [
    vinext(),
    sites(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      configPath: "./wrangler.jsonc",
      persistState: { path: localStatePath },
    }),
  ],
});
