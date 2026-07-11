import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "collecting/index": "src/collecting/index.ts",
    "core/index": "src/core/index.ts",
    "layouts/index": "src/layouts/index.ts",
    "market/index": "src/market/index.ts",
    "utils/index": "src/utils/index.ts"
  },
  clean: false,
  dts: false,
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  external: ["react", "react/jsx-runtime"],
  format: ["esm"],
  loader: {
    ".png": "dataurl"
  },
  outDir: "dist",
  sourcemap: true,
  splitting: true,
  target: "es2020",
  treeshake: false
});
