/**
 * Vite build for the Vue 3 + @vue/compat migration (docs/PLAN.md P9.1).
 * Shims what the Vue CLI codebase expects so existing files keep working unchanged:
 * process.env.BASE_URL / VUE_APP_*, the "@" alias, "~" CSS imports, extension-less .vue imports,
 * the global SCSS prepend from vue.config.js and the /api dev proxy.
 */
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "VUE_APP_"]);
  const apiProxy = env.VITE_DEV_API_PROXY || "http://localhost:7001";
  return {
    base: "/",
    envPrefix: ["VITE_", "VUE_APP_"],
    plugins: [
      vue({
        template: {
          compilerOptions: { compatConfig: { MODE: 2 } },
          // Vue CLI kept bare URLs like "media/logos/x.png" as-is (served from public/); keep that behaviour.
          transformAssetUrls: { includeAbsolute: false, tags: { video: ["src", "poster"], source: ["src"], img: [], image: [], use: [] } }
        }
      })
    ],
    define: {
      "process.env.BASE_URL": JSON.stringify("/"),
      "process.env.VUE_APP_API_URL": JSON.stringify(env.VUE_APP_API_URL || ""),
      "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development")
    },
    resolve: {
      alias: [
        { find: /^vue$/, replacement: "@vue/compat" },
        { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
        { find: /^~(.+)/, replacement: "$1" }
      ],
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
          additionalData: `@import "@/assets/sass/vendors/vue/vuetify/variables.scss";`,
          silenceDeprecations: ["import", "global-builtin", "color-functions", "slash-div", "mixed-decls", "legacy-js-api"],
          quietDeps: true
        }
      }
    },
    server: {
      port: 8080,
      strictPort: true,
      proxy: {
        "/api": { target: apiProxy, changeOrigin: true },
        "/socket.io": { target: apiProxy, ws: true, changeOrigin: true }
      }
    },
    preview: { port: 8080 },
    build: { outDir: "dist", sourcemap: false, chunkSizeWarningLimit: 4000 }
  };
});
