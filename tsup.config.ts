/**
 * tsup 构建配置。
 * 输入：源码入口与内置 family 模块入口。
 * 输出：同时产出 ESM / CJS，并保留 family 级别的懒加载模块文件。
 *
 * 预期行为：
 * - 不把所有 tokenizer 数据打成一个大包，保留按 family 单独加载的文件边界。
 * - `index` 作为公共入口，内置 family 模块作为独立编译单元输出到 dist。
 */

import { defineConfig } from "tsup"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/types.ts",
    "src/core/*.ts",
    "src/hf/*.ts",
    "src/registry/*.ts",
    // 只编译运行时代码，避免把测试文件带进 dist。
    "src/data/index.ts",
    "src/data/packed.ts",
    "src/data/generated/*.ts",
  ],
  format: ["esm", "cjs"],
  target: "node20",
  bundle: false,
  sourcemap: true,
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
