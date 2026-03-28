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
      "@cyberlangke/tokkit-01-ai": fileURLToPath(
        new URL("./packages/01-ai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-minimax": fileURLToPath(
        new URL("./packages/minimax/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-tiiuae": fileURLToPath(
        new URL("./packages/tiiuae/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-eleutherai": fileURLToPath(
        new URL("./packages/eleutherai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-meituan-longcat": fileURLToPath(
        new URL("./packages/meituan-longcat/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-xiaomi-mimo": fileURLToPath(
        new URL("./packages/xiaomi-mimo/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-microsoft": fileURLToPath(
        new URL("./packages/microsoft/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-mistral": fileURLToPath(
        new URL("./packages/mistral/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-huggingface-tb": fileURLToPath(
        new URL("./packages/huggingface-tb/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-allenai": fileURLToPath(
        new URL("./packages/allenai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-ibm-granite": fileURLToPath(
        new URL("./packages/ibm-granite/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-bytedance-seed": fileURLToPath(
        new URL("./packages/bytedance-seed/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-openbmb": fileURLToPath(
        new URL("./packages/openbmb/src/index.ts", import.meta.url)
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
