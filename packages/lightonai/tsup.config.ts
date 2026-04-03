import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/generated/*.ts"],
  format: ["esm", "cjs"],
  target: "node20",
  bundle: false,
  outDir: "dist",
  sourcemap: false,
  clean: true,
  dts: {
    entry: {
      index: "src/index.ts",
    },
  },
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
    }
  },
})
