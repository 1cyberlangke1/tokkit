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
    expectedFamilies: ["gpt-neo", "polyglot-ko", "polyglot-ko-12.8", "pythia"],
    expectedModels: [
      "EleutherAI/gpt-neo-125m",
      "EleutherAI/gpt-neo-1.3B",
      "EleutherAI/gpt-neo-2.7B",
      "EleutherAI/gpt-j-6b",
      "EleutherAI/gpt-neox-20b",
      "EleutherAI/pythia-14m",
      "EleutherAI/pythia-14m-deduped",
      "EleutherAI/pythia-31m-deduped",
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
      "bitnet-b1.58-2b-4t",
      "nextcoder",
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
      "microsoft/bitnet-b1.58-2B-4T",
      "microsoft/NextCoder-7B",
      "microsoft/NextCoder-14B",
      "microsoft/NextCoder-32B",
      "microsoft/phi-1",
      "microsoft/phi-2",
      "microsoft/Phi-3-mini-4k-instruct",
      "microsoft/Phi-3-mini-128k-instruct",
      "microsoft/MediPhi",
      "microsoft/MediPhi-Instruct",
      "microsoft/Phi-3-medium-4k-instruct",
      "microsoft/Phi-3-medium-128k-instruct",
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
      "devstral-small-2505",
      "leanstral-2603",
      "mathstral-7b",
      "mamba-codestral-7b",
      "magistral-small-2507",
      "ministral-3",
      "mistral-7b-v0.1",
      "mistral-7b-v0.3",
      "mistral-nemo",
      "mistral-small-3.2",
      "mistral-small-24b",
      "mixtral-8x7b",
    ],
    expectedModels: [
      "mistralai/Devstral-Small-2-24B-Instruct-2512",
      "mistralai/Devstral-Small-2505",
      "mistralai/Devstral-Small-2507",
      "mistralai/Leanstral-2603",
      "mistralai/Magistral-Small-2506",
      "mistralai/Magistral-Small-2507",
      "mistralai/Magistral-Small-2509",
      "mistralai/Mathstral-7B-v0.1",
      "mistralai/Mamba-Codestral-7B-v0.1",
      "mistralai/Ministral-3-3B-Base-2512",
      "mistralai/Ministral-3-3B-Instruct-2512",
      "mistralai/Ministral-3-3B-Reasoning-2512",
      "mistralai/Ministral-3-8B-Base-2512",
      "mistralai/Ministral-3-8B-Instruct-2512",
      "mistralai/Ministral-3-8B-Reasoning-2512",
      "mistralai/Ministral-3-14B-Base-2512",
      "mistralai/Ministral-3-14B-Instruct-2512",
      "mistralai/Ministral-3-14B-Reasoning-2512",
      "mistralai/Mistral-7B-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.2",
      "mistralai/Mistral-7B-v0.3",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "mistralai/Mistral-Nemo-Base-2407",
      "mistralai/Mistral-Nemo-Instruct-2407",
      "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
      "mistralai/Mistral-Small-24B-Base-2501",
      "mistralai/Mistral-Small-24B-Instruct-2501",
      "mistralai/Mixtral-8x22B-v0.1",
      "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "mistralai/Mixtral-8x7B-v0.1",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
    ],
  },
  {
    relativePath: "packages/huggingface-tb/src/index.ts",
    expectedFamilies: ["cosmo-1b", "smollm", "smollm-1.7b", "smollm2-16k", "smollm3", "smollm3-base"],
    expectedModels: [
      "HuggingFaceTB/cosmo-1b",
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
    expectedFamilies: [
      "olmo",
      "olmo-1",
      "olmo-0424",
      "olmo-2",
      "olmo-3-instruct",
      "olmo-hybrid",
      "olmo-hybrid-think",
      "olmoe",
      "olmoe-instruct",
      "olmoe-0125",
      "olmoe-0125-instruct",
    ],
    expectedModels: [
      "allenai/OLMo-1B",
      "allenai/OLMo-1B-hf",
      "allenai/OLMo-1B-0724-hf",
      "allenai/OLMo-7B",
      "allenai/OLMo-7B-0424",
      "allenai/OLMo-7B-Instruct",
      "allenai/OLMo-7B-hf",
      "allenai/OLMo-7B-0424-hf",
      "allenai/OLMo-7B-0724-hf",
      "allenai/OLMo-7B-0724-Instruct-hf",
      "allenai/OLMo-7B-Instruct-hf",
      "allenai/OLMo-7B-Twin-2T-hf",
      "allenai/OLMoE-1B-7B-0924",
      "allenai/OLMoE-1B-7B-0924-Instruct",
      "allenai/OLMoE-1B-7B-0125",
      "allenai/OLMoE-1B-7B-0125-Instruct",
      "allenai/OLMo-2-0425-1B",
      "allenai/OLMo-2-0425-1B-Instruct",
      "allenai/OLMo-2-0325-32B",
      "allenai/OLMo-2-1124-13B",
      "allenai/OLMo-2-1124-7B",
      "allenai/OLMo-2-1124-7B-Instruct",
      "allenai/OLMo-2-0325-32B-Instruct",
      "allenai/Olmo-3-1025-7B",
      "allenai/Olmo-3-1125-32B",
      "allenai/Olmo-3-7B-Think",
      "allenai/Olmo-3-32B-Think",
      "allenai/Olmo-3.1-32B-Think",
      "allenai/Olmo-3-7B-Instruct",
      "allenai/Olmo-3.1-32B-Instruct",
      "allenai/Olmo-Hybrid-7B",
      "allenai/Olmo-Hybrid-Instruct-SFT-7B",
      "allenai/Olmo-Hybrid-Think-SFT-7B",
    ],
  },
  {
    relativePath: "packages/ibm-granite/src/index.ts",
    expectedFamilies: [
      "granite-3-instruct",
      "granite-3.3-base",
      "granite-3.3-instruct",
      "granite-7b-base",
      "granite-7b-instruct",
      "granite-code-base",
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
      "ibm-granite/granite-7b-base",
      "ibm-granite/granite-7b-instruct",
      "ibm-granite/granite-3b-code-base-2k",
      "ibm-granite/granite-4.0-350m-base",
      "ibm-granite/granite-4.0-h-1b",
      "ibm-granite/granite-4.0-tiny-base-preview",
      "ibm-granite/granite-4.0-tiny-preview",
    ],
  },
  {
    relativePath: "packages/ibm-research/src/index.ts",
    expectedFamilies: ["molm", "powerlm"],
    expectedModels: [
      "ibm-research/MoLM-350M-4B",
      "ibm-research/MoLM-700M-4B",
      "ibm-research/MoLM-700M-8B",
      "ibm-research/PowerLM-3b",
      "ibm-research/PowerMoE-3b",
    ],
  },
  {
    relativePath: "packages/h2oai/src/index.ts",
    expectedFamilies: [
      "danube",
      "danube2",
      "danube3-500m-chat",
      "danube3-4b-chat",
      "danube3.1-4b-chat",
    ],
    expectedModels: [
      "h2oai/h2o-danube-1.8b-base",
      "h2oai/h2o-danube-1.8b-chat",
      "h2oai/h2o-danube2-1.8b-base",
      "h2oai/h2o-danube2-1.8b-chat",
      "h2oai/h2o-danube3-500m-base",
      "h2oai/h2o-danube3-500m-chat",
      "h2oai/h2o-danube3-4b-base",
      "h2oai/h2o-danube3-4b-chat",
      "h2oai/h2o-danube3.1-4b-chat",
    ],
  },
  {
    relativePath: "packages/nanbeige/src/index.ts",
    expectedFamilies: ["nanbeige4", "nanbeige4-base"],
    expectedModels: [
      "Nanbeige/Nanbeige4-3B-Base",
      "Nanbeige/Nanbeige4.1-3B",
      "Nanbeige/Nanbeige4-3B-Thinking-2510",
      "Nanbeige/Nanbeige4-3B-Thinking-2511",
      "Nanbeige/ToolMind-Web-3B",
    ],
  },
  {
    relativePath: "packages/skt/src/index.ts",
    expectedFamilies: ["ax-3.1", "ax-light", "ax-k1"],
    expectedModels: [
      "skt/A.X-3.1",
      "skt/A.X-3.1-Light",
      "skt/A.X-4.0-Light",
      "skt/A.X-K1",
    ],
  },
  {
    relativePath: "packages/tinyllama/src/index.ts",
    expectedFamilies: ["danube"],
    expectedModels: [
      "h2oai/h2o-danube-1.8b-base",
      "h2oai/h2o-danube-1.8b-chat",
      "TinyLlama/TinyLlama_v1.1",
      "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    ],
  },
  {
    relativePath: "packages/upstage/src/index.ts",
    expectedFamilies: ["solar", "solar-pro"],
    expectedModels: [
      "upstage/SOLAR-10.7B-v1.0",
      "upstage/TinySolar-248m-4k",
      "upstage/solar-pro-preview-instruct",
    ],
  },
  {
    relativePath: "packages/openai/src/index.ts",
    expectedFamilies: ["gpt-oss"],
    expectedModels: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
  },
  {
    relativePath: "packages/gsai-ml/src/index.ts",
    expectedFamilies: ["llada", "llada-base", "refusion"],
    expectedModels: [
      "GSAI-ML/LLaDA-8B-Instruct",
      "GSAI-ML/LLaDA-1.5",
      "GSAI-ML/LLaDA-8B-Base",
      "GSAI-ML/ReFusion",
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
    expectedFamilies: [
      "agentcpm-explore",
      "minicpm-s-1b",
      "minicpm-sala",
      "minicpm3",
      "minicpm4",
      "minicpm-moe",
    ],
    expectedModels: [
      "openbmb/AgentCPM-Explore",
      "openbmb/AgentCPM-Report",
      "openbmb/MiniCPM-S-1B-sft",
      "openbmb/MiniCPM-SALA",
      "openbmb/MiniCPM3-4B",
      "openbmb/MiniCPM4-0.5B",
      "openbmb/MiniCPM4-8B",
      "openbmb/MiniCPM4.1-8B",
      "openbmb/BitCPM4-0.5B",
      "openbmb/BitCPM4-1B",
      "openbmb/MiniCPM4-MCP",
      "openbmb/MiniCPM4-Survey",
      "openbmb/NOSA-1B",
      "openbmb/NOSA-3B",
      "openbmb/NOSA-8B",
      "openbmb/MiniCPM-MoE-8x2B",
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
  "devstral-small-2505",
  "deepseek-r1",
  "deepseek-v3",
  "deepseek-v3.1",
  "deepseek-v3.2",
  "falcon-rw-1b",
  "falcon-7b",
  "bitnet-b1.58-2b-4t",
  "gpt-neo",
  "cosmo-1b",
  "danube",
  "danube2",
  "danube3-500m-chat",
  "danube3-4b-chat",
  "danube3.1-4b-chat",
  "nanbeige4",
  "nanbeige4-base",
  "ax-3.1",
  "ax-light",
  "ax-k1",
  "solar",
  "solar-pro",
  "gpt-oss",
  "llada",
  "llada-base",
  "refusion",
  "glm-4.7",
  "glm-5",
  "granite-3-instruct",
  "granite-3.3-base",
  "granite-3.3-instruct",
  "granite-7b-base",
  "granite-7b-instruct",
  "granite-code-base",
  "granite-4",
  "granite-4-tiny-base-preview",
  "granite-4-tiny-preview",
  "leanstral-2603",
  "molm",
  "powerlm",
  "longcat-flash-chat",
  "longcat-flash-lite",
  "longcat-flash-thinking",
  "academic-ds",
  "agentcpm-explore",
  "minicpm-s-1b",
  "minicpm-sala",
  "minicpm3",
  "minicpm4",
  "minicpm-moe",
  "mimo",
  "mimo-7b-rl-0530",
  "mimo-v2-flash",
  "mathstral-7b",
  "mamba-codestral-7b",
  "magistral-small-2507",
  "ministral-3",
  "mistral-7b-v0.1",
  "mistral-7b-v0.3",
  "mistral-nemo",
  "mistral-small-3.2",
  "mistral-small-24b",
  "mixtral-8x7b",
  "nextcoder",
  "seed-coder",
  "seed-oss",
  "smollm",
  "smollm-1.7b",
  "smollm2-16k",
  "smollm3",
  "smollm3-base",
  "stable-diffcoder",
  "olmo",
  "olmo-1",
  "olmo-0424",
  "olmo-2",
  "olmo-3-instruct",
  "olmo-hybrid",
  "olmo-hybrid-think",
  "olmoe",
  "olmoe-instruct",
  "olmoe-0125",
  "olmoe-0125-instruct",
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
  "qwen2",
  "qwen2.5",
  "qwen3",
  "qwen3-coder-next",
  "qwen3.5",
  "qwen3.5-base",
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

    expect(core.listSupportedFamilies().sort()).toEqual(
      ["qwen2", "qwen2.5", "qwen3", "qwen3.5", "qwen3.5-base", "qwen3-coder-next"].sort()
    )
    expect(core.listSupportedModels()).toEqual(
      expect.arrayContaining([
        "Qwen/Qwen2-7B-Instruct",
        "Qwen/Qwen2.5-7B-Instruct",
        "Qwen/Qwen3-14B-Base",
        "Qwen/Qwen3-0.6B",
        "Qwen/Qwen3-Next-80B-A3B-Thinking",
        "Qwen/Qwen3-235B-A22B-Instruct-2507",
        "Qwen/Qwen3-235B-A22B-Thinking-2507",
        "Qwen/Qwen3.5-0.8B",
        "Qwen/Qwen3.5-27B",
        "Qwen/Qwen3.5-0.8B-Base",
        "Qwen/Qwen3.5-397B-A17B",
        "Qwen/Qwen3-Coder-Next",
        "Qwen/Qwen3-Coder-480B-A35B-Instruct",
        "Qwen/Qwen3-Coder-Next-Base",
        "Qwen/QwQ-32B",
      ])
    )
  })

  it("deepseek 包只注册 deepseek 系列 family", async () => {
    const core = await importModule("packages/core/src/index.ts")
    const deepseek = await importModule("packages/deepseek/src/index.ts")

    core.resetRegistry()
    deepseek.registerBuiltins()

    expect(core.listSupportedFamilies().sort()).toEqual(
      ["deepseek-v3", "deepseek-r1", "deepseek-v3.1", "deepseek-v3.2"].sort()
    )
    expect(core.listSupportedModels()).toEqual(
      expect.arrayContaining([
        "deepseek-ai/DeepSeek-V3",
        "deepseek-ai/DeepSeek-V3-0324",
        "deepseek-ai/DeepSeek-R1",
        "deepseek-ai/DeepSeek-R1-0528",
        "deepseek-ai/DeepSeek-V3.1",
        "deepseek-ai/DeepSeek-V3.2-Exp",
        "deepseek-ai/DeepSeek-V3.2",
      ])
    )
  })

  it("step 包只注册 step 系列 family", async () => {
    const core = await importModule("packages/core/src/index.ts")
    const step = await importModule("packages/step/src/index.ts")

    core.resetRegistry()
    step.registerBuiltins()

    expect(core.listSupportedFamilies().sort()).toEqual(["step-3.5-flash"].sort())
    expect(core.listSupportedModels()).toEqual(
      expect.arrayContaining([
        "stepfun-ai/Step-3.5-Flash",
        "stepfun-ai/Step-3.5-Flash-Base-Midtrain",
      ])
    )
  })

  it("glm 包只注册 glm 系列 family", async () => {
    const core = await importModule("packages/core/src/index.ts")
    const glm = await importModule("packages/glm/src/index.ts")

    core.resetRegistry()
    glm.registerBuiltins()

    expect(core.listSupportedFamilies().sort()).toEqual(["glm-4.7", "glm-5"].sort())
    expect(core.listSupportedModels()).toEqual(
      expect.arrayContaining([
        "zai-org/GLM-4.5",
        "zai-org/GLM-4.5-Base",
        "zai-org/GLM-4.5-Air",
        "zai-org/GLM-4.5-Air-Base",
        "zai-org/GLM-4.6",
        "zai-org/GLM-4.7",
        "zai-org/GLM-4.7-Flash",
        "zai-org/GLM-5",
      ])
    )
  })

  it("全家桶包注册全部内置 family", async () => {
    const all = await importModule("packages/all/src/index.ts")

    all.resetRegistry()
    all.registerBuiltins()

    expect(all.listSupportedFamilies().sort()).toEqual([...EXPECTED_ALL_FAMILIES].sort())
  })
})
