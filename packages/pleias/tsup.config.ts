import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/generated/*.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "es2020",
})
