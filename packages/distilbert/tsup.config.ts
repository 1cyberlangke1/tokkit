import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/generated/distilgpt2.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "node20",
  splitting: false,
})
