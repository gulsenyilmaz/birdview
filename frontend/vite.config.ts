import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [
      react(),
      env.VITE_ANALYZE === "true" &&
        visualizer({
          filename: "dist/stats.html",
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),

    resolve: {
      alias: [
        {
          find: "child_process",
          replacement: path.resolve(__dirname, "src/shims/child-process.ts"),
        },
      ],
    },

    build: {
      chunkSizeWarningLimit: 7000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("@deck.gl")) return "deck";
            if (id.includes("@loaders.gl")) return "loaders";
            if (id.includes("maplibre-gl")) return "maplibre";
            if (id.includes("d3")) return "d3";
            if (id.includes("node_modules")) return "vendor";
          },
        },
      },
    },
  };
});