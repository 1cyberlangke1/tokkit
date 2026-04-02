import { defineConfig } from "tsup"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/generated/internlm2_5_1_8b.ts",
    "src/generated/internlm2_5_20b.ts",
    "src/generated/internlm3.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "node20",
  splitting: false,
})
