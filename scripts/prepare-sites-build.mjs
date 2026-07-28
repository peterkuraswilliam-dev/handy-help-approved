import { copyFileSync, cpSync, existsSync, rmSync } from "node:fs";

if (!existsSync(".output/server/index.mjs")) {
  throw new Error("Run the production build before preparing the Sites output.");
}

rmSync("dist", { recursive: true, force: true });
cpSync(".output", "dist", { recursive: true });
cpSync(".output/public", "dist", { recursive: true });
copyFileSync("dist/server/index.mjs", "dist/server/index.js");
