/**
 * Family 子包行为测试。
 * 输入：packages 下各子包的 src/index.ts 模块。
 * 输出：验证各 family 包只注册自己的模型，全家桶包注册全部模型。
 */

import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"

/** 当前测试文件所在目录。 */
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))

/** 仓库根目录。 */
const REPO_ROOT = resolve(CURRENT_DIR, "..")

/** 各厂商包当前应覆盖的 family 与模型别名。 */
const VENDOR_PACKAGE_CASES = [
  {
    relativePath: "packages/minimax/src/index.ts",
    expectedFamilies: ["minimax-m1", "minimax-m2", "minimax-text-01"],
    expectedModels: [
      "MiniMaxAI/MiniMax-M2",
      "MiniMaxAI/MiniMax-M2.1",
      "MiniMaxAI/MiniMax-M2.5",
      "MiniMaxAI/MiniMax-M1-40k",
      "MiniMaxAI/MiniMax-M1-80k",
      "MiniMaxAI/MiniMax-M1-40k-hf",
      "MiniMaxAI/MiniMax-M1-80k-hf",
      "MiniMaxAI/MiniMax-Text-01",
      "MiniMaxAI/MiniMax-Text-01-hf",
    ],
  },
  {
    relativePath: "packages/01-ai/src/index.ts",
    expectedFamilies: ["yi", "yi-1.5-9b-chat", "yi-coder", "yi-coder-chat"],
    expectedModels: [
      "01-ai/Yi-6B",
      "01-ai/Yi-6B-Chat",
      "01-ai/Yi-9B",
      "01-ai/Yi-34B",
      "01-ai/Yi-34B-Chat",
      "01-ai/Yi-6B-200K",
      "01-ai/Yi-9B-200K",
      "01-ai/Yi-34B-200K",
      "01-ai/Yi-1.5-6B",
      "01-ai/Yi-1.5-6B-Chat",
      "01-ai/Yi-1.5-9B",
      "01-ai/Yi-1.5-9B-Chat",
      "01-ai/Yi-1.5-9B-Chat-16K",
      "01-ai/Yi-1.5-9B-32K",
      "01-ai/Yi-1.5-34B",
      "01-ai/Yi-1.5-34B-Chat",
      "01-ai/Yi-1.5-34B-32K",
      "01-ai/Yi-1.5-34B-Chat-16K",
      "01-ai/Yi-Coder-9B",
      "01-ai/Yi-Coder-9B-Chat",
      "01-ai/Yi-Coder-1.5B",
      "01-ai/Yi-Coder-1.5B-Chat",
    ],
  },
  {
    relativePath: "packages/tiiuae/src/index.ts",
    expectedFamilies: ["falcon-rw-1b", "falcon-7b"],
    expectedModels: [
      "tiiuae/falcon-rw-1b",
      "tiiuae/falcon-rw-7b",
      "tiiuae/falcon-7b",
      "tiiuae/falcon-7b-instruct",
      "tiiuae/falcon-40b",
      "tiiuae/falcon-40b-instruct",
    ],
  },
  {
    relativePath: "packages/eleutherai/src/index.ts",
    expectedFamilies: ["polyglot-ko", "polyglot-ko-12.8", "pythia"],
    expectedModels: [
      "EleutherAI/pythia-70m",
      "EleutherAI/pythia-1b",
      "EleutherAI/pythia-6.9b",
      "EleutherAI/pythia-12b",
      "EleutherAI/pythia-70m-deduped",
      "EleutherAI/pythia-12b-deduped",
      "EleutherAI/polyglot-ko-1.3b",
      "EleutherAI/polyglot-ko-3.8b",
      "EleutherAI/polyglot-ko-5.8b",
      "EleutherAI/polyglot-ko-12.8b",
    ],
  },
  {
    relativePath: "packages/meituan-longcat/src/index.ts",
    expectedFamilies: ["longcat-flash-chat", "longcat-flash-lite", "longcat-flash-thinking"],
    expectedModels: [
      "meituan-longcat/LongCat-Flash-Prover",
      "meituan-longcat/LongCat-Flash-Lite",
      "meituan-longcat/LongCat-Flash-Chat",
      "meituan-longcat/LongCat-Flash-Thinking",
      "meituan-longcat/LongCat-Flash-Thinking-2601",
      "meituan-longcat/LongCat-Flash-Thinking-ZigZag",
      "meituan-longcat/LongCat-HeavyMode-Summary",
    ],
  },
  {
    relativePath: "packages/xiaomi-mimo/src/index.ts",
    expectedFamilies: ["mimo", "mimo-7b-rl-0530", "mimo-v2-flash"],
    expectedModels: [
      "XiaomiMiMo/MiMo-7B-Base",
      "XiaomiMiMo/MiMo-7B-RL",
      "XiaomiMiMo/MiMo-7B-RL-0530",
      "XiaomiMiMo/MiMo-7B-RL-Zero",
      "XiaomiMiMo/MiMo-7B-SFT",
      "XiaomiMiMo/MiMo-V2-Flash",
      "XiaomiMiMo/MiMo-V2-Flash-Base",
    ],
  },
  {
    relativePath: "packages/microsoft/src/index.ts",
    expectedFamilies: [
      "phi-1",
      "phi-3-mini",
      "phi-3-medium",
      "phi-3.5",
      "phi-4",
      "phi-4-mini",
      "phi-4-mini-flash",
      "phi-4-mini-reasoning",
      "phi-4-reasoning",
      "phi-moe",
    ],
    expectedModels: [
      "microsoft/phi-1",
      "microsoft/phi-2",
      "microsoft/Phi-3-mini-4k-instruct",
      "microsoft/Phi-3-mini-128k-instruct",
      "microsoft/Phi-3-medium-4k-instruct",
      "microsoft/Phi-3.5-mini-instruct",
      "microsoft/Phi-3.5-MoE-instruct",
      "microsoft/Phi-mini-MoE-instruct",
      "microsoft/Phi-tiny-MoE-instruct",
      "microsoft/phi-4",
      "microsoft/Phi-4-reasoning",
      "microsoft/Phi-4-reasoning-plus",
      "microsoft/Phi-4-mini-instruct",
      "microsoft/Phi-4-mini-reasoning",
      "microsoft/Phi-4-mini-flash-reasoning",
    ],
  },
  {
    relativePath: "packages/mistral/src/index.ts",
    expectedFamilies: [
      "devstral-small-2",
      "ministral-8b",
      "mistral-7b-v0.1",
      "mistral-7b-v0.3",
      "mistral-small-3.1",
      "mixtral-8x7b",
    ],
    expectedModels: [
      "mistralai/Mistral-7B-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.2",
      "mistralai/Mistral-7B-v0.3",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "mistralai/Mixtral-8x7B-v0.1",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "mistralai/Ministral-8B-Instruct-2410",
      "mistralai/Devstral-Small-2-24B-Instruct-2512",
      "mistralai/Mistral-Small-3.1-24B-Instruct-2503",
    ],
  },
  {
    relativePath: "packages/huggingface-tb/src/index.ts",
    expectedFamilies: ["smollm", "smollm-1.7b", "smollm2-16k", "smollm3", "smollm3-base"],
    expectedModels: [
      "HuggingFaceTB/SmolLM-135M",
      "HuggingFaceTB/SmolLM-135M-Instruct",
      "HuggingFaceTB/SmolLM-360M",
      "HuggingFaceTB/SmolLM-360M-Instruct",
      "HuggingFaceTB/SmolLM-1.7B",
      "HuggingFaceTB/SmolLM-1.7B-Instruct",
      "HuggingFaceTB/SmolLM2-135M",
      "HuggingFaceTB/SmolLM2-135M-Instruct",
      "HuggingFaceTB/SmolLM2-360M",
      "HuggingFaceTB/SmolLM2-360M-Instruct",
      "HuggingFaceTB/SmolLM2-1.7B",
      "HuggingFaceTB/SmolLM2-1.7B-Instruct",
      "HuggingFaceTB/SmolLM2-1.7B-Instruct-16k",
      "HuggingFaceTB/SmolLM3-3B",
      "HuggingFaceTB/SmolLM3-3B-Base",
    ],
  },
  {
    relativePath: "packages/allenai/src/index.ts",
    expectedFamilies: ["olmo-1", "olmo-2", "olmo-3-instruct", "olmo-hybrid", "olmoe"],
    expectedModels: [
      "allenai/OLMo-1B-hf",
      "allenai/OLMoE-1B-7B-0924",
      "allenai/OLMo-2-0425-1B",
      "allenai/OLMo-2-0325-32B",
      "allenai/OLMo-2-1124-13B",
      "allenai/Olmo-3-1025-7B",
      "allenai/Olmo-3.1-32B-Think",
      "allenai/Olmo-3-7B-Instruct",
      "allenai/Olmo-Hybrid-7B",
      "allenai/Olmo-Hybrid-Instruct-SFT-7B",
    ],
  },
  {
    relativePath: "packages/ibm-granite/src/index.ts",
    expectedFamilies: [
      "granite-3-instruct",
      "granite-3.3-base",
      "granite-3.3-instruct",
      "granite-4",
      "granite-4-tiny-base-preview",
      "granite-4-tiny-preview",
    ],
    expectedModels: [
      "ibm-granite/granite-3.0-2b-base",
      "ibm-granite/granite-3.1-8b-base",
      "ibm-granite/granite-3.0-2b-instruct",
      "ibm-granite/granite-3.2-8b-instruct",
      "ibm-granite/granite-3.3-8b-base",
      "ibm-granite/granite-3.3-8b-instruct",
      "ibm-granite/granite-4.0-350m-base",
      "ibm-granite/granite-4.0-h-1b",
      "ibm-granite/granite-4.0-tiny-base-preview",
      "ibm-granite/granite-4.0-tiny-preview",
    ],
  },
  {
    relativePath: "packages/bytedance-seed/src/index.ts",
    expectedFamilies: ["academic-ds", "seed-oss", "seed-coder", "stable-diffcoder"],
    expectedModels: [
      "ByteDance-Seed/academic-ds-9B",
      "ByteDance-Seed/Seed-OSS-36B-Base",
      "ByteDance-Seed/Seed-OSS-36B-Instruct",
      "ByteDance-Seed/Seed-OSS-36B-Base-woSyn",
      "ByteDance-Seed/Seed-Coder-8B-Base",
      "ByteDance-Seed/Seed-Coder-8B-Instruct",
      "ByteDance-Seed/Seed-Coder-8B-Reasoning",
      "ByteDance-Seed/Stable-DiffCoder-8B-Base",
      "ByteDance-Seed/Stable-DiffCoder-8B-Instruct",
    ],
  },
  {
    relativePath: "packages/openbmb/src/index.ts",
    expectedFamilies: ["minicpm-s-1b", "minicpm-sala", "minicpm3", "minicpm4"],
    expectedModels: [
      "openbmb/MiniCPM-S-1B-sft",
      "openbmb/MiniCPM-SALA",
      "openbmb/MiniCPM3-4B",
      "openbmb/MiniCPM4-8B",
      "openbmb/MiniCPM4.1-8B",
      "openbmb/BitCPM4-0.5B",
      "openbmb/NOSA-8B",
    ],
  },
] as const

/** 全家桶包当前应聚合的 family。 */
const EXPECTED_ALL_FAMILIES = [
  "yi",
  "yi-1.5-9b-chat",
  "yi-coder",
  "yi-coder-chat",
  "devstral-small-2",
  "deepseek-v3.1",
  "deepseek-v3.2",
  "falcon-rw-1b",
  "falcon-7b",
  "glm-4.7",
  "glm-5",
  "granite-3-instruct",
  "granite-3.3-base",
  "granite-3.3-instruct",
  "granite-4",
  "granite-4-tiny-base-preview",
  "granite-4-tiny-preview",
  "longcat-flash-chat",
  "longcat-flash-lite",
  "longcat-flash-thinking",
  "academic-ds",
  "minicpm-s-1b",
  "minicpm-sala",
  "minicpm3",
  "minicpm4",
  "mimo",
  "mimo-7b-rl-0530",
  "mimo-v2-flash",
  "ministral-8b",
  "mistral-7b-v0.1",
  "mistral-7b-v0.3",
  "mistral-small-3.1",
  "mixtral-8x7b",
  "seed-coder",
  "seed-oss",
  "smollm",
  "smollm-1.7b",
  "smollm2-16k",
  "smollm3",
  "smollm3-base",
  "stable-diffcoder",
  "olmo-1",
  "olmo-2",
  "olmo-3-instruct",
  "olmo-hybrid",
  "olmoe",
  "phi-1",
  "phi-3-mini",
  "phi-3-medium",
  "phi-3.5",
  "phi-4",
  "phi-4-mini",
  "phi-4-mini-flash",
  "phi-4-mini-reasoning",
  "phi-4-reasoning",
  "phi-moe",
  "polyglot-ko",
  "polyglot-ko-12.8",
  "pythia",
  "qwen3-coder-next",
  "qwen3.5",
  "step-3.5-flash",
] as const

/**
 * 动态导入本地 TypeScript 模块。
 * 输入：相对仓库根目录的模块路径。
 * 输出：对应模块的导出对象。
 */
async function importModule(relativePath: string) {
  const fullPath = resolve(REPO_ROOT, relativePath)
  expect(existsSync(fullPath)).toBe(true)
  return import(pathToFileURL(fullPath).href)
}

describe("family packages", () => {
  it.each(VENDOR_PACKAGE_CASES)(
    "$relativePath 只注册自己的厂商 family",
    async ({ relativePath, expectedFamilies, expectedModels }) => {
      const core = await importModule("packages/core/src/index.ts")
      const vendorPackage = await importModule(relativePath)

      core.resetRegistry()
      vendorPackage.registerBuiltins()

      expect(core.listSupportedFamilies().sort()).toEqual([...expectedFamilies].sort())
      expect(core.listSupportedModels()).toEqual(expect.arrayContaining([...expectedModels]))
    }
  )

  it("qwen 包只注册 qwen 系列 family", async () => {
    const core = await importModule("packages/core/src/index.ts")
    const qwen = await importModule("packages/qwen/src/index.ts")

    core.resetRegistry()
    qwen.registerBuiltins()

    expect(core.listSupportedFamilies().sort()).toEqual(["qwen3-coder-next", "qwen3.5"].sort())
    expect(core.listSupportedModels()).toEqual(
      expect.arrayContaining([
        "Qwen/Qwen3.5-0.8B",
        "Qwen/Qwen3.5-27B",
        "Qwen/Qwen3.5-397B-A17B",
        "Qwen/Qwen3-Coder-Next",
      ])
    )
  })

  it("deepseek 包只注册 deepseek 系列 family", async () => {
    const core = await importModule("packages/core/src/index.ts")
    const deepseek = await importModule("packages/deepseek/src/index.ts")

    core.resetRegistry()
    deepseek.registerBuiltins()

    expect(core.listSupportedFamilies().sort()).toEqual(["deepseek-v3.1", "deepseek-v3.2"].sort())
    expect(core.listSupportedModels()).toEqual(
      expect.arrayContaining(["deepseek-ai/DeepSeek-V3.1", "deepseek-ai/DeepSeek-V3.2"])
    )
  })

  it("全家桶包注册全部内置 family", async () => {
    const all = await importModule("packages/all/src/index.ts")

    all.resetRegistry()
    all.registerBuiltins()

    expect(all.listSupportedFamilies().sort()).toEqual([...EXPECTED_ALL_FAMILIES].sort())
  })
})
