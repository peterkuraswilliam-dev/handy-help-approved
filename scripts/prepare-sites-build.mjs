import { copyFileSync, cpSync, existsSync, rmSync } from "node:fs";

if (!existsSync(".output/server/index.mjs")) {
  throw new Error("Run the production build before preparing the Sites output.");
}

rmSync("dist", { recursive: true, force: true });
cpSync(".output", "dist", { recursive: true });
// Sites exposes static files from dist/client through its ASSETS binding.
cpSync(".output/public", "dist/client", { recursive: true });
copyFileSync("dist/server/index.mjs", "dist/server/index.js");
cpSync(".openai", "dist/.openai", { recursive: true });
