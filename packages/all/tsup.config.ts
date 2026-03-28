import { defineConfig } from "tsup"

/**
 * all 包构建配置。
 * 输入：聚合入口。
 * 输出：依赖 family 子包的聚合发布产物。
 */
export default defineConfig({
  entry: ["src/index.ts"],
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
