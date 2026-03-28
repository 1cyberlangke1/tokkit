import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Vitest 测试配置。
 * 输入：根仓库下的 workspace 源码与测试文件。
 * 输出：在不构建 dist 的前提下，直接对 packages 下各包的 src 做源码测试。
 */
export default defineConfig({
  resolve: {
    alias: {
      "@cyberlangke/tokkit-core": fileURLToPath(
        new URL("./packages/core/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-qwen": fileURLToPath(
        new URL("./packages/qwen/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-deepseek": fileURLToPath(
        new URL("./packages/deepseek/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-glm": fileURLToPath(
        new URL("./packages/glm/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-step": fileURLToPath(
        new URL("./packages/step/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit": fileURLToPath(new URL("./packages/all/src/index.ts", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["node_modules", "dist", "tmp", "packages/*/dist"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
})
