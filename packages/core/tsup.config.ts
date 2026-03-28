import { defineConfig } from "tsup"

/**
 * core 包构建配置。
 * 输入：core 包运行时源码入口。
 * 输出：可供其他 family 包复用的 ESM / CJS 产物。
 */
export default defineConfig({
  entry: [
    "src/index.ts",
    "src/types.ts",
    "src/core/*.ts",
    "src/hf/*.ts",
    "src/registry/*.ts",
    "src/data/packed.ts",
  ],
  format: ["esm", "cjs"],
  target: "node20",
  bundle: false,
  sourcemap: false,
  clean: true,
  dts: {
    entry: {
      index: "src/index.ts",
    },
  },
  outDir: "dist",
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
    }
  },
})
