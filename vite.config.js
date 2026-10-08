import fs from "node:fs";
import { defineConfig } from "vite";
import autoprefixer from "autoprefixer";

// js/ に置いたJavaScriptはすべてビルド対象にする(置いた時点でvite.config.jsの変更は不要)
const scripts = fs.existsSync("js")
  ? fs.readdirSync("js").filter((file) => file.endsWith(".js")).map((file) => `js/${file}`)
  : [];

export default defineConfig({
  build: {
    rollupOptions: {
      input: ["scss/style.scss", ...scripts],
      output: {
        assetFileNames: ({ name }) => name ?? "assets/[name][extname]",
        entryFileNames: "js/[name].js",
      },
    },
    outDir: "build",
    cssMinify: false,
  },
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [autoprefixer()],
    },
  },
});
