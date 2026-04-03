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
      "@cyberlangke/tokkit-abeja": fileURLToPath(
        new URL("./packages/abeja/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-minimax": fileURLToPath(
        new URL("./packages/minimax/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-moonshotai": fileURLToPath(
        new URL("./packages/moonshotai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-dream-org": fileURLToPath(
        new URL("./packages/dream-org/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-utter-project": fileURLToPath(
        new URL("./packages/utter-project/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-mosaicml": fileURLToPath(
        new URL("./packages/mosaicml/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-ai21labs": fileURLToPath(
        new URL("./packages/ai21labs/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-llm360": fileURLToPath(
        new URL("./packages/llm360/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-sarvamai": fileURLToPath(
        new URL("./packages/sarvamai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-stabilityai": fileURLToPath(
        new URL("./packages/stabilityai/src/index.ts", import.meta.url)
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
      "@cyberlangke/tokkit-ai-sage": fileURLToPath(
        new URL("./packages/ai-sage/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-essentialai": fileURLToPath(
        new URL("./packages/essentialai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-servicenow-ai": fileURLToPath(
        new URL("./packages/servicenow-ai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-salesforce": fileURLToPath(
        new URL("./packages/salesforce/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-cerebras": fileURLToPath(
        new URL("./packages/cerebras/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-inclusionai": fileURLToPath(
        new URL("./packages/inclusionai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-pleias": fileURLToPath(
        new URL("./packages/pleias/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-janhq": fileURLToPath(
        new URL("./packages/janhq/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-zyphra": fileURLToPath(
        new URL("./packages/zyphra/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-arcee-ai": fileURLToPath(
        new URL("./packages/arcee-ai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-state-spaces": fileURLToPath(
        new URL("./packages/state-spaces/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-snowflake": fileURLToPath(
        new URL("./packages/snowflake/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-swiss-ai": fileURLToPath(
        new URL("./packages/swiss-ai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-cyberagent": fileURLToPath(
        new URL("./packages/cyberagent/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-ibm-granite": fileURLToPath(
        new URL("./packages/ibm-granite/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-ibm-research": fileURLToPath(
        new URL("./packages/ibm-research/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-h2oai": fileURLToPath(
        new URL("./packages/h2oai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-internlm": fileURLToPath(
        new URL("./packages/internlm/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-baichuan-inc": fileURLToPath(
        new URL("./packages/baichuan-inc/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-nanbeige": fileURLToPath(
        new URL("./packages/nanbeige/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-skt": fileURLToPath(
        new URL("./packages/skt/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-tinyllama": fileURLToPath(
        new URL("./packages/tinyllama/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-upstage": fileURLToPath(
        new URL("./packages/upstage/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-openai": fileURLToPath(
        new URL("./packages/openai/src/index.ts", import.meta.url)
      ),
      "@cyberlangke/tokkit-gsai-ml": fileURLToPath(
        new URL("./packages/gsai-ml/src/index.ts", import.meta.url)
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
      "@cyberlangke/tokkit-distilbert": fileURLToPath(
        new URL("./packages/distilbert/src/index.ts", import.meta.url)
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
    // generated tokenizer modules are large; a single worker avoids duplicating
    // multiple full builtin graphs and keeps the test process within a stable heap.
    maxWorkers: 1,
    execArgv: ["--max-old-space-size=8192"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
})
