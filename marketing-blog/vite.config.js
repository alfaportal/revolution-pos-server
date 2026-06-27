import { defineConfig } from "vite";

const integrated = process.env.VITE_INTEGRATED === "true";

export default defineConfig({
  root: ".",
  publicDir: "public",
  appType: "spa",
  base: integrated ? "/" : "/",
  build: {
    outDir: integrated ? "../public/site" : "dist",
    emptyOutDir: true,
  },
});
