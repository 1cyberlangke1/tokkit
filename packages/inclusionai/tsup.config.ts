import { defineConfig } from "tsup"

/**
 * inclusionAI 包构建配置。
 * 输入：inclusionAI 包入口与按 family 拆开的压缩数据模块。
 * 输出：供 npm 发布的 ESM/CJS 与类型声明产物。
 */
export default defineConfig({
  entry: ["src/index.ts", "src/generated/*.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "es2020",
  splitting: false,
  treeshake: true,
  external: ["@cyberlangke/tokkit-core", "@cyberlangke/tokkit-qwen"],
})
