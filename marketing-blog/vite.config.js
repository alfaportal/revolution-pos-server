import { defineConfig } from "vite";

const integrated = process.env.VITE_INTEGRATED === "true";

export default defineConfig({
  root: ".",
  publicDir: "public",
  appType: "spa",
  base: integrated ? "/blog/" : "/",
  build: {
    outDir: integrated ? "../public/blog" : "dist",
    emptyOutDir: true,
  },
});
