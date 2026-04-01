import { defineConfig } from "tsup"

/**
 * EssentialAI 包构建配置。
 * 输入：EssentialAI 包入口与按 family 拆开的压缩数据模块。
 * 输出：保留动态 import 边界的 ESM / CJS 产物。
 */
export default defineConfig({
  entry: ["src/index.ts", "src/generated/*.ts"],
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
