/**
 * 新架构测试。
 * 输入：自定义注册的 toy tokenizer family。
 * 输出：验证懒加载、别名解析、ByteLevel / Metaspace / ByteFallback 行为。
 */

import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { brotliDecompressSync } from "node:zlib"
import { describe, it, expect, beforeEach } from "vitest"
import { PreTrainedTokenizer } from "@huggingface/transformers"
import {
  clearCache,
  decode,
  encode,
  getEncoding,
  getEncodingSync,
  listSupportedFamilies,
  listSupportedModels,
  registerBuiltins,
  registerTokenizerFamily,
  resetRegistry,
} from "./index.js"
import type { TokenizerAsset } from "./index.js"

/** 当前测试文件所在目录。 */
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))

/** 仓库根目录。 */
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..")

/** 每个内置 family 的稳定对拍输入。 */
const BUILTIN_REFERENCE_SAMPLES = ["Hello, world!", "你好，世界！", "A+B=42"] as const

/** Arcee Trinity 里用于 510 长度保护的数字分块 regex。 */
const DIGIT_CHUNK_510_PATTERN =
  String.raw`\p{Nd}{1,510}(?=(?>\p{Nd}{510})*(?:\P{Nd}|$))|\G\p{Nd}{510}`

/** Arcee Trinity 里用于千分组前导余数的 regex。 */
const DIGIT_LEADING_GROUP_PATTERN = String.raw`\A\p{Nd}{1,2}(?=\p{Nd}{3}+\z)`

/** Arcee Trinity 里用于连续三位数字分组的 regex。 */
const DIGIT_TRIPLE_GROUP_PATTERN = String.raw`\A\p{Nd}{3}|\G\p{Nd}{3}`

/** 常见模型别名分组。 */
const BUILTIN_ALIAS_CASE_GROUPS = [
  {
    name: "qwen 生态",
    cases: [
      {
        canonical: "yi",
        aliases: ["01-ai/Yi-6B", "01-ai/Yi-1.5-34B"],
      },
      {
        canonical: "yi-1.5-9b-chat",
        aliases: ["01-ai/Yi-1.5-9B-Chat"],
      },
      {
        canonical: "yi-coder",
        aliases: ["01-ai/Yi-34B", "01-ai/Yi-Coder-1.5B"],
      },
      {
        canonical: "yi-coder-chat",
        aliases: ["01-ai/Yi-Coder-9B-Chat", "01-ai/Yi-Coder-1.5B-Chat"],
      },
      {
        canonical: "qwen2",
        aliases: ["Qwen/Qwen2-7B", "Qwen/Qwen2-7B-Instruct", "AIDC-AI/Marco-LLM-ES"],
      },
      {
        canonical: "qwen2.5",
        aliases: [
          "Qwen/Qwen2.5-Coder-32B-Instruct",
          "Qwen/Qwen2.5-Math-7B-Instruct",
          "Qwen/QwQ-32B-Preview",
          "Qwen/Qwen3-14B-Base",
          "qwen3-base",
          "abeja/ABEJA-Qwen2.5-32b-Japanese-v1.0",
          "abeja/ABEJA-Qwen2.5-7b-Japanese-v0.1",
          "abeja/ABEJA-QwQ32b-Reasoning-Japanese-v1.0",
          "inclusionAI/GroveMoE-Base",
          "AIDC-AI/Marco-Nano-Instruct",
          "AIDC-AI/Marco-Mini-Global-Base",
          "AIDC-AI/Marco-Mini-Base",
          "AIDC-AI/Marco-Nano-Base",
          "AIDC-AI/Marco-LLM-SEA",
          "AIDC-AI/Marco-LLM-AR-V4",
          "AIDC-AI/Marco-LLM-AR-V2",
        ],
      },
      {
        canonical: "qwen3",
        aliases: [
          "Qwen/Qwen3-30B-A3B-Instruct-2507",
          "Qwen/Qwen3-Next-80B-A3B-Instruct",
          "Qwen/Qwen3-Next-80B-A3B-Thinking",
          "Qwen/Qwen3-235B-A22B-Instruct-2507",
          "abeja/ABEJA-Qwen3-14B-Agentic-256k-v0.1",
          "janhq/Jan-v1-4B",
          "janhq/Jan-v1-edge",
          "janhq/Jan-v1-2509",
          "janhq/Jan-v3-4B-base-instruct",
          "janhq/Jan-v3.5-4B",
          "janhq/Jan-code-4b",
          "inclusionAI/Qwen3-32B-AWorld",
          "inclusionAI/AReaL-SEA-235B-A22B",
          "inclusionAI/GroveMoE-Inst",
          "inclusionAI/AReaL-boba-2-14B-Open",
          "inclusionAI/AReaL-boba-2-8B-Open",
          "inclusionAI/AReaL-boba-2-32B",
          "inclusionAI/AReaL-boba-2-8B",
          "inclusionAI/AReaL-boba-2-14B",
        ],
      },
      {
        canonical: "qwen3.5",
        aliases: ["Qwen/Qwen3.5-27B", "Qwen/Qwen3.5-122B-A10B", "Qwen/Qwen3.5-397B-A17B"],
      },
      {
        canonical: "qwen3.5-base",
        aliases: ["Qwen/Qwen3.5-35B-A3B-Base", "Qwen/Qwen3.5-0.8B-Base"],
      },
      {
        canonical: "qwen3-coder-next",
        aliases: [
          "Qwen/Qwen3-Coder-30B-A3B-Instruct",
          "Qwen/Qwen3-Coder-480B-A35B-Instruct",
          "Qwen/Qwen3-Coder-Next-Base",
          "Qwen/Qwen3-30B-A3B-Thinking-2507",
          "Qwen/Qwen3-235B-A22B-Thinking-2507",
          "Qwen/QwQ-32B",
          "qwen3-coder",
        ],
      },
    ],
  },
  {
    name: "新接入厂商",
    cases: [
      {
        canonical: "rnj-1",
        aliases: ["EssentialAI/rnj-1", "EssentialAI/rnj-1-instruct"],
      },
      {
        canonical: "apriel-5b",
        aliases: ["ServiceNow-AI/Apriel-5B-Base", "ServiceNow-AI/Apriel-5B-Instruct"],
      },
      {
        canonical: "jamba2",
        aliases: [
          "ai21labs/AI21-Jamba2-Mini",
          "ai21labs/AI21-Jamba2-3B",
          "ai21labs/AI21-Jamba-Reasoning-3B",
        ],
      },
      {
        canonical: "jamba-v0.1",
        aliases: ["jamba_v0_1", "ai21labs/Jamba-v0.1"],
      },
      {
        canonical: "mamba-790m",
        aliases: [
          "stabilityai/japanese-stablelm-3b-4e1t-base",
          "stabilityai/japanese-stablelm-3b-4e1t-instruct",
        ],
      },
      {
        canonical: "mistral-7b-v0.1",
        aliases: [
          "stabilityai/japanese-stablelm-base-gamma-7b",
          "stabilityai/japanese-stablelm-instruct-gamma-7b",
          "Deci/DeciLM-7B",
          "Deci/DeciLM-7B-instruct",
        ],
      },
      {
        canonical: "granite-code-base",
        aliases: [
          "stabilityai/stablecode-completion-alpha-3b",
          "stabilityai/stablecode-completion-alpha-3b-4k",
        ],
      },
      {
        canonical: "sarvam-30b",
        aliases: ["sarvamai/sarvam-30b", "sarvamai/sarvam-105b"],
      },
      {
        canonical: "sarvam-m",
        aliases: ["sarvamai/sarvam-m"],
      },
      {
        canonical: "snowflake-arctic-base",
        aliases: ["LLM360/Amber", "LLM360/AmberChat"],
      },
      {
        canonical: "crystal",
        aliases: ["LLM360/Crystal", "LLM360/CrystalChat"],
      },
      {
        canonical: "k2",
        aliases: ["LLM360/K2"],
      },
      {
        canonical: "k2-chat",
        aliases: ["LLM360/K2-Chat"],
      },
      {
        canonical: "mimo-7b-rl-0530",
        aliases: ["LLM360/K2-Think"],
      },
      {
        canonical: "k2-think-v2",
        aliases: ["LLM360/K2-Think-V2"],
      },
      {
        canonical: "bitnet-b1.58-2b-4t",
        aliases: ["PrimeIntellect/INTELLECT-1", "PrimeIntellect/INTELLECT-1-Instruct"],
      },
      {
        canonical: "falcon-7b",
        aliases: ["lightonai/alfred-40b-0723"],
      },
      {
        canonical: "pagnol",
        aliases: ["lightonai/pagnol-small", "lightonai/pagnol-medium", "lightonai/pagnol-large"],
      },
      {
        canonical: "pagnol-xl",
        aliases: ["lightonai/pagnol-xl"],
      },
      {
        canonical: "alfred-40b-1023",
        aliases: ["lightonai/alfred-40b-1023"],
      },
      {
        canonical: "decicoder-1b",
        aliases: ["Deci/DeciCoder-1b"],
      },
      {
        canonical: "salamandra",
        aliases: [
          "BSC-LT/salamandra-2b",
          "BSC-LT/salamandra-7b",
          "BSC-LT/ALIA-40b",
          "BSC-LT/ALIA-40b-instruct-2601",
        ],
      },
      {
        canonical: "salamandra-instruct",
        aliases: ["BSC-LT/salamandra-2b-instruct", "BSC-LT/salamandra-7b-instruct"],
      },
      {
        canonical: "marco-o1",
        aliases: ["marco_o1", "AIDC-AI/Marco-o1"],
      },
      {
        canonical: "dj-refine-1b",
        aliases: [
          "dj_refine_1b",
          "datajuicer/LLaMA-1B-dj-refine-50B",
          "datajuicer/LLaMA-1B-dj-refine-100B",
          "datajuicer/LLaMA-1B-dj-refine-150B",
          "datajuicer/LLaMA-1B-dj-refine-150B-instruct-4.7B",
        ],
      },
      {
        canonical: "codegen",
        aliases: [
          "Salesforce/codegen-350M-mono",
          "Salesforce/codegen-350M-multi",
          "Salesforce/codegen-2B-mono",
          "Salesforce/codegen-2B-multi",
          "Salesforce/codegen-6B-mono",
          "Salesforce/codegen-6B-multi",
          "Salesforce/codegen-16B-mono",
          "Salesforce/codegen-16B-multi",
        ],
      },
      {
        canonical: "codegen-nl",
        aliases: [
          "Salesforce/codegen-350M-nl",
          "Salesforce/codegen-2B-nl",
          "Salesforce/codegen-6B-nl",
          "Salesforce/codegen-16B-nl",
        ],
      },
      {
        canonical: "codegen2",
        aliases: [
          "Salesforce/codegen2-1B_P",
          "Salesforce/codegen2-3_7B_P",
          "Salesforce/codegen2-7B_P",
          "Salesforce/codegen2-16B_P",
        ],
      },
      {
        canonical: "cerebras-gpt",
        aliases: [
          "cerebras/Cerebras-GPT-111M",
          "cerebras/Cerebras-GPT-256M",
          "cerebras/Cerebras-GPT-590M",
          "cerebras/Cerebras-GPT-1.3B",
          "cerebras/Cerebras-GPT-2.7B",
          "cerebras/Cerebras-GPT-6.7B",
          "cerebras/Cerebras-GPT-13B",
          "btlm-3b-8k",
          "cerebras/btlm-3b-8k-base",
        ],
      },
      {
        canonical: "btlm-3b-8k-chat",
        aliases: ["cerebras/btlm-3b-8k-chat"],
      },
      {
        canonical: "llada2",
        aliases: [
          "inclusionAI/LLaDA2.0-mini",
          "inclusionAI/LLaDA2.0-flash",
          "inclusionAI/LLaDA2.1-mini",
          "inclusionAI/LLaDA2.1-flash",
          "inclusionAI/LLaDA-MoE-7B-A1B-Base",
        ],
      },
      {
        canonical: "ring-2.5-1t",
        aliases: ["inclusionAI/Ring-2.5-1T", "inclusionAI/Ling-2.5-1T"],
      },
      {
        canonical: "ling-2",
        aliases: [
          "inclusionAI/Ling-mini-2.0",
          "inclusionAI/Ling-flash-2.0",
          "inclusionAI/Ling-1T",
        ],
      },
      {
        canonical: "ring-mini-2.0",
        aliases: ["inclusionAI/Ring-mini-2.0", "inclusionAI/Ling-flash-base-2.0"],
      },
      {
        canonical: "ring-flash-2.0",
        aliases: ["inclusionAI/Ring-flash-2.0"],
      },
      {
        canonical: "ring-1t",
        aliases: ["inclusionAI/Ring-1T"],
      },
      {
        canonical: "pleias-350m",
        aliases: ["PleIAs/Pleias-350m-Preview"],
      },
      {
        canonical: "pleias-1.2b",
        aliases: ["PleIAs/Pleias-1.2b-Preview"],
      },
      {
        canonical: "pleias-3b",
        aliases: ["PleIAs/Pleias-3b-Preview"],
      },
      {
        canonical: "pleias-pico",
        aliases: ["PleIAs/Pleias-Pico"],
      },
      {
        canonical: "baguettotron",
        aliases: ["PleIAs/Baguettotron"],
      },
      {
        canonical: "monad",
        aliases: ["PleIAs/Monad"],
      },
      {
        canonical: "trinity-large-truebase",
        aliases: ["arcee-ai/Trinity-Large-TrueBase"],
      },
      {
        canonical: "trinity-large",
        aliases: ["arcee-ai/Trinity-Large-Base", "arcee-ai/Trinity-Large-Preview"],
      },
      {
        canonical: "trinity-large-thinking",
        aliases: ["arcee-ai/Trinity-Large-Thinking"],
      },
      {
        canonical: "mamba-130m",
        aliases: ["state-spaces/mamba-130m-hf", "state-spaces/mamba-370m-hf"],
      },
      {
        canonical: "mamba-790m",
        aliases: [
          "state-spaces/mamba-790m-hf",
          "state-spaces/mamba-1.4b-hf",
          "state-spaces/mamba-2.8b-hf",
        ],
      },
      {
        canonical: "snowflake-arctic-base",
        aliases: ["Snowflake/snowflake-arctic-base"],
      },
      {
        canonical: "snowflake-arctic-instruct",
        aliases: ["Snowflake/snowflake-arctic-instruct"],
      },
      {
        canonical: "apertus",
        aliases: ["swiss-ai/Apertus-8B-2509", "swiss-ai/Apertus-70B-2509"],
      },
      {
        canonical: "apertus-instruct",
        aliases: ["swiss-ai/Apertus-8B-Instruct-2509", "swiss-ai/Apertus-70B-Instruct-2509"],
      },
      {
        canonical: "dream-v0",
        aliases: [
          "dream_v0",
          "dream-coder-v0",
          "Dream-org/Dream-v0-Base-7B",
          "Dream-org/Dream-v0-Instruct-7B",
          "Dream-org/Dream-Coder-v0-Base-7B",
          "Dream-org/Dream-Coder-v0-Instruct-7B",
        ],
      },
      {
        canonical: "dreamon-v0",
        aliases: ["dreamon_v0", "Dream-org/DreamOn-v0-7B"],
      },
      {
        canonical: "eurollm-1.7b",
        aliases: ["utter-project/EuroLLM-1.7B"],
      },
      {
        canonical: "eurollm-1.7b-instruct",
        aliases: ["utter-project/EuroLLM-1.7B-Instruct"],
      },
      {
        canonical: "eurollm-2512",
        aliases: [
          "utter-project/EuroLLM-9B-2512",
          "utter-project/EuroLLM-22B-2512",
          "utter-project/EuroMoE-2.6B-A0.6B-2512",
        ],
      },
      {
        canonical: "eurollm-2512-instruct",
        aliases: [
          "utter-project/EuroLLM-9B-Instruct-2512",
          "utter-project/EuroLLM-22B-Instruct-2512",
          "utter-project/EuroMoE-2.6B-A0.6B-Instruct-2512",
        ],
      },
    ],
  },
  {
    name: "经典 GPT 家族",
    cases: [
      {
        canonical: "falcon-7b",
        aliases: ["tiiuae/falcon-7b-instruct", "tiiuae/falcon-40b"],
      },
      {
        canonical: "gpt-neo",
        aliases: ["EleutherAI/gpt-j-6b", "EleutherAI/gpt-neo-2.7B", "gpt-j"],
      },
      {
        canonical: "pythia",
        aliases: [
          "EleutherAI/gpt-neox-20b",
          "EleutherAI/pythia-14m",
          "EleutherAI/pythia-12b",
          "EleutherAI/pythia-12b-deduped",
          "mosaicml/mpt-7b",
          "mosaicml/mpt-7b-8k",
          "mosaicml/mpt-7b-storywriter",
          "mosaicml/mpt-30b",
          "gpt-neox",
        ],
      },
      {
        canonical: "mimo",
        aliases: ["XiaomiMiMo/MiMo-V2-Flash-Base"],
      },
      {
        canonical: "smollm",
        aliases: ["smollm2", "HuggingFaceTB/SmolLM2-1.7B"],
      },
      {
        canonical: "academic-ds",
        aliases: ["ByteDance-Seed/academic-ds-9B"],
      },
      {
        canonical: "step-3.5-flash",
        aliases: ["stepfun-ai/Step-3.5-Flash-Base-Midtrain"],
      },
    ],
  },
  {
    name: "mistral 与推理模型",
    cases: [
      {
        canonical: "mistral-7b-v0.1",
        aliases: ["mistralai/Mixtral-8x7B-Instruct-v0.1"],
      },
      {
        canonical: "devstral-small-2505",
        aliases: ["mistralai/Devstral-Small-2505"],
      },
      {
        canonical: "mistral-small-3.2",
        aliases: [
          "mistralai/Devstral-Small-2507",
          "mistralai/Magistral-Small-2506",
          "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
          "devstral-small-2507",
        ],
      },
      {
        canonical: "magistral-small-2507",
        aliases: ["mistralai/Magistral-Small-2509"],
      },
      {
        canonical: "leanstral-2603",
        aliases: ["mistralai/Leanstral-2603"],
      },
      {
        canonical: "mixtral-8x7b",
        aliases: ["mistralai/Mixtral-8x7B-v0.1"],
      },
      {
        canonical: "glm-5",
        aliases: ["zai-org/GLM-5", "zai-org/GLM-4.7-Flash", "glm-4.7-flash"],
      },
      {
        canonical: "glm-4.7",
        aliases: ["zai-org/GLM-4.5", "zai-org/GLM-4.5-Air-Base", "zai-org/GLM-4.6", "glm-4.5-air"],
      },
      {
        canonical: "olmo-2",
        aliases: ["allenai/OLMo-2-1124-13B"],
      },
      {
        canonical: "olmo-1",
        aliases: ["allenai/OLMo-7B-Twin-2T-hf"],
      },
      {
        canonical: "olmoe",
        aliases: ["allenai/OLMo-7B-0724-Instruct-hf"],
      },
      {
        canonical: "deepseek-v3",
        aliases: ["deepseek-ai/DeepSeek-V3-0324", "deepseek-v3-base"],
      },
      {
        canonical: "deepseek-r1",
        aliases: ["deepseek-ai/DeepSeek-R1-0528", "deepseek-r1-zero"],
      },
      {
        canonical: "deepseek-v3.1",
        aliases: ["deepseek-ai/DeepSeek-V3.2-Exp", "deepseek-v3.2-exp-base"],
      },
      {
        canonical: "deepseek-v3.2",
        aliases: ["deepseek-ai/DeepSeek-V3.2", "deepseek-v3.2-speciale"],
      },
    ],
  },
] as const

describe("tokkit vNext architecture", () => {
  beforeEach(() => {
    resetRegistry()
  })

  it("懒加载 family 并复用缓存", async () => {
    let loadCount = 0

    registerTokenizerFamily({
      family: "toy-byte",
      aliases: ["toy-byte-alias"],
      models: ["toy/model"],
      load: async () => {
        loadCount += 1
        return createByteLevelToyAsset()
      },
    })

    expect(listSupportedFamilies()).toEqual(["toy-byte"])
    expect(listSupportedModels()).toEqual(["toy/model"])
    expect(() => getEncodingSync("toy-byte")).toThrow(/has not been loaded yet/)

    const first = await getEncoding("toy-byte")
    const second = await getEncoding("toy-byte-alias")

    expect(first).toBe(second)
    expect(loadCount).toBe(1)
  })

  it("ByteLevel BPE 行为和官方实现一致", async () => {
    const asset = createByteLevelToyAsset()
    registerTokenizerFamily({
      family: "toy-byte",
      aliases: ["toy-byte-alias"],
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const samples = ["Hello", "Hello 世界", "Hello\nworld"]

    for (const sample of samples) {
      const actual = await encode(sample, "toy-byte")
      const expected = reference.encode(sample, { add_special_tokens: false })
      expect(actual).toEqual(expected)

      const decoded = await decode(actual, "toy-byte")
      expect(decoded).toBe(sample)
    }
  })

  it("NFC normalizer 行为和官方实现一致", async () => {
    const asset = createNfcToyAsset()
    registerTokenizerFamily({
      family: "toy-nfc",
      asset,
    })

    const sample = "e\u0301"

    expect(
      await encode(sample, "toy-nfc", {
        addSpecialTokens: false,
      })
    ).toEqual([1])
  })

  it("Digits pre-tokenizer 能按官方规则拆分数字片段", async () => {
    const asset = createDigitsToyAsset()
    registerTokenizerFamily({
      family: "toy-digits",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "abc123456def"

    expect(
      await encode(sample, "toy-digits", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("Digits pre-tokenizer 的 individual_digits=true 行为和官方实现一致", async () => {
    const asset = createIndividualDigitsToyAsset()
    registerTokenizerFamily({
      family: "toy-digits-individual",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "abc123def"

    expect(
      await encode(sample, "toy-digits-individual", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("Digits pre-tokenizer 不会把上标数字当成普通 digit 拆开", async () => {
    const asset = createNonAsciiDigitsToyAsset()
    registerTokenizerFamily({
      family: "toy-digits-non-ascii",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = " \u00b2"

    expect(
      await encode(sample, "toy-digits-non-ascii", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("Punctuation pre-tokenizer 的 contiguous 行为和官方实现一致", async () => {
    const asset = createPunctuationToyAsset()
    registerTokenizerFamily({
      family: "toy-punctuation",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "Hi,world!!"

    expect(
      await encode(sample, "toy-punctuation", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("Punctuation pre-tokenizer 会把 ASCII 标点符号连续段视为同一片段", async () => {
    const asset = createAsciiPunctuationToyAsset()
    registerTokenizerFamily({
      family: "toy-punctuation-ascii",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "a.|b"

    expect(
      await encode(sample, "toy-punctuation-ascii", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("Split pre-tokenizer 会保留局部大小写不敏感的 contraction 片段", async () => {
    const asset = createInlineCaseInsensitiveSplitToyAsset()
    registerTokenizerFamily({
      family: "toy-inline-ci",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = " AYA'DA"

    expect(
      await encode(sample, "toy-inline-ci", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("Split pre-tokenizer 会兼容 HF/Rust 的 possessive quantifier regex", async () => {
    const asset = createPossessiveQuantifierSplitToyAsset()
    registerTokenizerFamily({
      family: "toy-possessive-split",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = " Hello!!"

    const actual = await encode(sample, "toy-possessive-split", {
      addSpecialTokens: false,
    })
    const expected = reference.encode(sample, { add_special_tokens: false })

    expect(actual).toEqual(expected)
    expect(await decode(actual, "toy-possessive-split")).toBe(sample)
  })

  it("Split pre-tokenizer 会兼容 TikToken 风格的脚本属性与字符类交集", async () => {
    const asset = createCharacterClassIntersectionSplitToyAsset()
    registerTokenizerFamily({
      family: "toy-class-intersection-split",
      asset,
    })

    const sample = "汉字 Hello's"

    const actual = await encode(sample, "toy-class-intersection-split", {
      addSpecialTokens: false,
    })

    expect(actual).toEqual([1, 2])
    expect(await decode(actual, "toy-class-intersection-split")).toBe(sample)
  })

  it("BPE string merges 会保留以 # 开头的真实 merge 规则", async () => {
    const asset = createHashMergeToyAsset()
    registerTokenizerFamily({
      family: "toy-hash-merge",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "###\n"

    expect(
      await encode(sample, "toy-hash-merge", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("Prepend + Replace normalizer 行为和官方实现一致", async () => {
    const asset = createPrependReplaceToyAsset()
    registerTokenizerFamily({
      family: "toy-prepend-replace",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "Hello world"

    const actual = await encode(sample, "toy-prepend-replace", {
      addSpecialTokens: false,
    })
    const expected = reference.encode(sample, { add_special_tokens: false })

    expect(actual).toEqual(expected)
    expect(await decode(actual, "toy-prepend-replace")).toBe(
      decodeWithReference(reference, expected)
    )
  })

  it("special added token 会像 Hugging Face 一样从原始输入中直接抽取", async () => {
    const asset = createSpecialAddedTokenToyAsset()
    registerTokenizerFamily({
      family: "toy-special-added",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "<s>du"

    expect(
      await encode(sample, "toy-special-added", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("special added token 切段后仍会按片段重新应用 Prepend normalizer", async () => {
    const asset = createPrependSpecialAddedTokenToyAsset()
    registerTokenizerFamily({
      family: "toy-special-prepend",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "<s>du"

    expect(
      await encode(sample, "toy-special-prepend", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("normalized special added token 在中间切段后仍会按片段重新应用 Prepend normalizer", async () => {
    const asset = createNormalizedPrependSpecialAddedTokenToyAsset()
    registerTokenizerFamily({
      family: "toy-special-prepend-normalized",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "sa <s>du"

    expect(
      await encode(sample, "toy-special-prepend-normalized", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("special added token 后续片段不会错误触发 Metaspace prepend_scheme=first", async () => {
    const asset = createMetaspaceFirstSpecialAddedTokenToyAsset()
    registerTokenizerFamily({
      family: "toy-special-metaspace-first",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "<s>du"

    expect(
      await encode(sample, "toy-special-metaspace-first", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("disallowedSpecial 会阻止输入中的 special added token 被编码", async () => {
    registerTokenizerFamily({
      family: "toy-byte",
      asset: createByteLevelToyAsset(),
    })

    const tokenizer = await getEncoding("toy-byte")

    expect(
      tokenizer.encode("<|special|>Hi", {
        addSpecialTokens: false,
      })[0]
    ).toBe(tokenizer.tokenToIdValue("<|special|>"))

    expect(() =>
      tokenizer.encode("<|special|>Hi", {
        addSpecialTokens: false,
        disallowedSpecial: "all",
      })
    ).toThrow(/Disallowed special token found/)
  })

  it("Metaspace 行为和官方实现一致", async () => {
    const asset = createMetaspaceToyAsset()
    registerTokenizerFamily({
      family: "toy-meta",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const samples = ["Hello world!", "Hello"]

    for (const sample of samples) {
      const actual = await encode(sample, "toy-meta")
      const expected = reference.encode(sample, { add_special_tokens: false })
      expect(actual).toEqual(expected)

      const decoded = await decode(actual, "toy-meta")
      expect(decoded).toBe(sample)
    }
  })

  it("Metaspace split 行为和官方实现一致", async () => {
    const asset = createMetaspaceSplitToyAsset()
    registerTokenizerFamily({
      family: "toy-meta-split",
      asset,
    })

    const sample = "Hey friend!"

    const actual = await encode(sample, "toy-meta-split", {
      addSpecialTokens: false,
    })

    expect(actual).toEqual([1, 2])
    expect(await decode(actual, "toy-meta-split")).toBe(sample)
  })

  it("Metaspace pre-tokenizer 的 prepend_scheme=first 在顶层调用时和官方实现一致", async () => {
    const asset = createMetaspaceFirstPretokenizerToyAsset()
    registerTokenizerFamily({
      family: "toy-meta-first",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "Hello"

    expect(
      await encode(sample, "toy-meta-first", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("Metaspace decoder 的 prepend_scheme=never 行为和官方实现一致", async () => {
    const asset = createMetaspaceNeverDecodeToyAsset()
    registerTokenizerFamily({
      family: "toy-meta-never",
      asset,
    })

    const ids = [0, 1]

    expect(await decode(ids, "toy-meta-never")).toBe(" Hey friend!")
  })

  it("ByteFallback decoder 能把字节 token 还原为文本", async () => {
    registerTokenizerFamily({
      family: "toy-fallback",
      asset: createByteFallbackToyAsset(),
    })

    const tokenizer = await getEncoding("toy-fallback")
    const ids = [1, 2, 3, 4]

    expect(tokenizer.decode(ids)).toBe("你!")
  })

  it("ByteFallback 遇到非法 UTF-8 时和官方实现一致", async () => {
    const asset = createByteFallbackInvalidToyAsset()
    registerTokenizerFamily({
      family: "toy-fallback-invalid",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const ids = [1, 2]

    expect(await decode(ids, "toy-fallback-invalid")).toBe(
      decodeWithReference(reference, ids)
    )
  })

  it("non-special added token 的抽取行为和官方实现一致", async () => {
    const asset = createAddedTokenToyAsset()
    registerTokenizerFamily({
      family: "toy-added",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = " my "

    expect(
      await encode(sample, "toy-added", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("overlapping added token 在同一起点遵守 leftmost-longest", async () => {
    const asset = createOverlappingAddedTokenToyAsset()
    registerTokenizerFamily({
      family: "toy-added-overlap",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "zabcx"

    expect(
      await encode(sample, "toy-added-overlap", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("overlapping added token 优先命中更早的位置而不是更晚的更长片段", async () => {
    const asset = createSingleWordAddedTokenToyAsset()
    registerTokenizerFamily({
      family: "toy-added-leftmost",
      asset,
    })

    const reference = new PreTrainedTokenizer(asset as any, {})
    const sample = "ab zabc"

    expect(
      await encode(sample, "toy-added-leftmost", {
        addSpecialTokens: false,
      })
    ).toEqual(reference.encode(sample, { add_special_tokens: false }))
  })

  it("clearCache 后同步获取会再次失效", async () => {
    registerTokenizerFamily({
      family: "toy-byte",
      asset: createByteLevelToyAsset(),
    })

    await getEncoding("toy-byte")
    expect(getEncodingSync("toy-byte").vocabSize).toBeGreaterThan(0)

    clearCache("toy-byte")
    expect(() => getEncodingSync("toy-byte")).toThrow(/has not been loaded yet/)
  })
})

describe("builtin tokenizer families", () => {
  beforeEach(() => {
    resetRegistry()
    registerBuiltins()
  })

  it(
    "注册当前内置 family 与常见模型别名",
    async () => {
      expect(listSupportedFamilies().sort()).toEqual(
        [
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
          "distilgpt2",
          "dj-refine-1b",
          "dream-v0",
          "dreamon-v0",
          "eurollm-1.7b",
          "eurollm-1.7b-instruct",
          "eurollm-2512",
          "eurollm-2512-instruct",
          "falcon-rw-1b",
          "falcon-7b",
          "gigachat-20b-base",
          "gigachat-20b-instruct",
          "gigachat3",
          "gigachat3.1",
          "rnj-1",
          "zamba-7b-v1",
          "zamba2-1.2b",
          "zamba2-2.7b",
          "zamba2-instruct",
          "zamba2-instruct-v2",
          "zr1-1.5b",
          "zaya1",
          "internlm2.5-1.8b",
          "internlm2.5-20b",
          "internlm3",
          "jamba-v0.1",
          "jamba2",
          "crystal",
          "k2",
          "k2-chat",
          "k2-think-v2",
          "sarvam-30b",
          "sarvam-m",
          "bitnet-b1.58-2b-4t",
          "pagnol",
          "pagnol-xl",
          "alfred-40b-1023",
          "nextcoder",
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
          "cosmo-1b",
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
          "academic-ds",
          "agentcpm-explore",
          "apriel-5b",
          "codegen",
          "codegen-nl",
          "codegen2",
          "cerebras-gpt",
          "btlm-3b-8k-chat",
          "llada2",
          "ring-2.5-1t",
          "ling-2",
          "ring-mini-2.0",
          "ring-flash-2.0",
          "ring-1t",
          "pleias-350m",
          "pleias-1.2b",
          "pleias-3b",
          "pleias-pico",
          "baguettotron",
          "monad",
          "trinity-large-truebase",
          "trinity-large",
          "trinity-large-thinking",
          "mamba-130m",
          "mamba-790m",
          "snowflake-arctic-base",
          "snowflake-arctic-instruct",
          "apertus",
          "apertus-instruct",
          "longcat-flash-chat",
          "longcat-flash-lite",
          "longcat-flash-thinking",
          "minicpm-s-1b",
          "minicpm-sala",
          "minicpm3",
          "minicpm4",
          "minicpm-moe",
          "mimo",
          "mimo-7b-rl-0530",
          "mimo-v2-flash",
          "salamandra",
          "salamandra-instruct",
          "marco-o1",
          "mathstral-7b",
          "mamba-codestral-7b",
          "decicoder-1b",
          "magistral-small-2507",
          "ministral-3",
          "mistral-7b-v0.1",
          "mistral-7b-v0.3",
          "mistral-nemo",
          "mistral-small-3.2",
          "mistral-small-24b",
          "mixtral-8x7b",
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
          "gpt-neo",
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
        ].sort()
      )

      expect(listSupportedModels()).toEqual(
        expect.arrayContaining([
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
          "tiiuae/falcon-rw-1b",
          "tiiuae/falcon-rw-7b",
          "tiiuae/falcon-7b",
          "tiiuae/falcon-7b-instruct",
          "tiiuae/falcon-40b",
          "tiiuae/falcon-40b-instruct",
          "EleutherAI/gpt-neo-125m",
          "EleutherAI/gpt-neo-2.7B",
          "EleutherAI/gpt-j-6b",
          "EleutherAI/gpt-neox-20b",
          "EleutherAI/pythia-14m",
          "EleutherAI/pythia-70m",
          "EleutherAI/pythia-6.9b",
          "EleutherAI/pythia-12b",
          "EleutherAI/pythia-12b-deduped",
          "EleutherAI/polyglot-ko-1.3b",
          "EleutherAI/polyglot-ko-12.8b",
          "meituan-longcat/LongCat-Flash-Prover",
          "meituan-longcat/LongCat-Flash-Lite",
          "meituan-longcat/LongCat-Flash-Chat",
          "meituan-longcat/LongCat-Flash-Thinking",
          "meituan-longcat/LongCat-Flash-Thinking-2601",
          "meituan-longcat/LongCat-HeavyMode-Summary",
          "XiaomiMiMo/MiMo-7B-Base",
          "XiaomiMiMo/MiMo-7B-RL-0530",
          "XiaomiMiMo/MiMo-7B-SFT",
          "XiaomiMiMo/MiMo-V2-Flash",
          "XiaomiMiMo/MiMo-V2-Flash-Base",
          "ai21labs/AI21-Jamba2-Mini",
          "ai21labs/AI21-Jamba2-3B",
          "ai21labs/AI21-Jamba-Reasoning-3B",
          "ai21labs/Jamba-v0.1",
          "sarvamai/sarvam-30b",
          "sarvamai/sarvam-105b",
          "sarvamai/sarvam-m",
          "LLM360/Amber",
          "LLM360/AmberChat",
          "LLM360/Crystal",
          "LLM360/CrystalChat",
          "LLM360/K2",
          "LLM360/K2-Chat",
          "LLM360/K2-Think",
          "LLM360/K2-Think-V2",
          "stabilityai/japanese-stablelm-3b-4e1t-base",
          "stabilityai/japanese-stablelm-3b-4e1t-instruct",
          "stabilityai/japanese-stablelm-base-gamma-7b",
          "stabilityai/japanese-stablelm-instruct-gamma-7b",
          "stabilityai/stablecode-completion-alpha-3b",
          "stabilityai/stablecode-completion-alpha-3b-4k",
          "microsoft/bitnet-b1.58-2B-4T",
          "PrimeIntellect/INTELLECT-1",
          "PrimeIntellect/INTELLECT-1-Instruct",
          "lightonai/alfred-40b-0723",
          "lightonai/alfred-40b-1023",
          "lightonai/pagnol-small",
          "lightonai/pagnol-medium",
          "lightonai/pagnol-large",
          "lightonai/pagnol-xl",
          "Deci/DeciCoder-1b",
          "Deci/DeciLM-7B",
          "Deci/DeciLM-7B-instruct",
          "BSC-LT/salamandra-2b",
          "BSC-LT/salamandra-2b-instruct",
          "BSC-LT/salamandra-7b",
          "BSC-LT/salamandra-7b-instruct",
          "BSC-LT/ALIA-40b",
          "BSC-LT/ALIA-40b-instruct-2601",
          "AIDC-AI/Marco-Nano-Instruct",
          "AIDC-AI/Marco-Mini-Global-Base",
          "AIDC-AI/Marco-Mini-Base",
          "AIDC-AI/Marco-Nano-Base",
          "AIDC-AI/Marco-LLM-SEA",
          "AIDC-AI/Marco-LLM-AR-V4",
          "AIDC-AI/Marco-LLM-AR-V2",
          "AIDC-AI/Marco-LLM-ES",
          "AIDC-AI/Marco-o1",
          "microsoft/NextCoder-7B",
          "microsoft/NextCoder-14B",
          "microsoft/NextCoder-32B",
          "microsoft/phi-1",
          "microsoft/Phi-3-mini-4k-instruct",
          "microsoft/MediPhi",
          "microsoft/MediPhi-Instruct",
          "microsoft/Phi-3-medium-4k-instruct",
          "microsoft/Phi-3-medium-128k-instruct",
          "microsoft/Phi-3.5-mini-instruct",
          "microsoft/Phi-mini-MoE-instruct",
          "microsoft/phi-4",
          "microsoft/Phi-4-reasoning",
          "microsoft/Phi-4-mini-instruct",
          "microsoft/Phi-4-mini-reasoning",
          "microsoft/Phi-4-mini-flash-reasoning",
          "mistralai/Devstral-Small-2-24B-Instruct-2512",
          "mistralai/Mathstral-7B-v0.1",
          "mistralai/Mamba-Codestral-7B-v0.1",
          "mistralai/Ministral-3-8B-Instruct-2512",
          "mistralai/Ministral-3-14B-Reasoning-2512",
          "mistralai/Mistral-7B-v0.1",
          "mistralai/Mistral-Nemo-Instruct-2407",
          "mistralai/Mistral-Small-24B-Instruct-2501",
          "mistralai/Mixtral-8x7B-v0.1",
          "mistralai/Mixtral-8x22B-Instruct-v0.1",
          "HuggingFaceTB/cosmo-1b",
          "HuggingFaceTB/SmolLM-135M",
          "HuggingFaceTB/SmolLM2-1.7B",
          "HuggingFaceTB/SmolLM2-1.7B-Instruct-16k",
          "HuggingFaceTB/SmolLM3-3B",
          "HuggingFaceTB/SmolLM3-3B-Base",
          "allenai/OLMo-1B",
          "allenai/OLMo-1B-hf",
          "allenai/OLMo-7B-hf",
          "allenai/OLMo-7B-0424-hf",
          "allenai/OLMo-7B-0724-hf",
          "allenai/OLMo-7B-0724-Instruct-hf",
          "allenai/OLMo-2-0425-1B",
          "allenai/OLMo-2-1124-7B",
          "allenai/OLMo-2-1124-13B",
          "allenai/OLMo-2-0325-32B",
          "allenai/Olmo-3-7B-Instruct",
          "allenai/Olmo-3.1-32B-Instruct",
          "allenai/Olmo-Hybrid-7B",
          "allenai/Olmo-Hybrid-Think-SFT-7B",
          "allenai/OLMoE-1B-7B-0924-Instruct",
          "allenai/OLMoE-1B-7B-0125",
          "allenai/OLMoE-1B-7B-0125-Instruct",
          "allenai/OLMo-7B-Twin-2T-hf",
          "ibm-granite/granite-3.0-2b-base",
          "ibm-granite/granite-3.0-2b-instruct",
          "ibm-granite/granite-3.3-8b-base",
          "ibm-granite/granite-3.3-8b-instruct",
          "ibm-granite/granite-7b-base",
          "ibm-granite/granite-7b-instruct",
          "ibm-granite/granite-3b-code-base-2k",
          "ibm-granite/granite-4.0-350m-base",
          "ibm-granite/granite-4.0-tiny-preview",
          "ibm-research/MoLM-350M-4B",
          "ibm-research/MoLM-700M-4B",
          "ibm-research/MoLM-700M-8B",
          "ibm-research/PowerLM-3b",
          "ibm-research/PowerMoE-3b",
          "h2oai/h2o-danube-1.8b-base",
          "h2oai/h2o-danube-1.8b-chat",
          "h2oai/h2o-danube2-1.8b-base",
          "h2oai/h2o-danube2-1.8b-chat",
          "h2oai/h2o-danube3-500m-base",
          "h2oai/h2o-danube3-500m-chat",
          "h2oai/h2o-danube3-4b-base",
          "h2oai/h2o-danube3-4b-chat",
          "h2oai/h2o-danube3.1-4b-chat",
          "Nanbeige/Nanbeige4-3B-Base",
          "Nanbeige/Nanbeige4.1-3B",
          "Nanbeige/Nanbeige4-3B-Thinking-2510",
          "Nanbeige/Nanbeige4-3B-Thinking-2511",
          "Nanbeige/ToolMind-Web-3B",
          "skt/A.X-3.1",
          "skt/A.X-3.1-Light",
          "skt/A.X-4.0-Light",
          "skt/A.X-K1",
          "abeja/ABEJA-Qwen2.5-32b-Japanese-v1.0",
          "abeja/ABEJA-Qwen2.5-7b-Japanese-v0.1",
          "abeja/ABEJA-QwQ32b-Reasoning-Japanese-v1.0",
          "abeja/ABEJA-Qwen3-14B-Agentic-256k-v0.1",
          "ai-sage/GigaChat-20B-A3B-base",
          "ai-sage/GigaChat-20B-A3B-instruct",
          "ai-sage/GigaChat-20B-A3B-instruct-v1.5",
          "ai-sage/GigaChat3-10B-A1.8B-base",
          "ai-sage/GigaChat3-10B-A1.8B",
          "ai-sage/GigaChat3-702B-A36B-preview",
          "ai-sage/GigaChat3.1-10B-A1.8B",
          "ai-sage/GigaChat3.1-702B-A36B",
          "EssentialAI/rnj-1",
          "EssentialAI/rnj-1-instruct",
          "ServiceNow-AI/Apriel-5B-Base",
          "ServiceNow-AI/Apriel-5B-Instruct",
          "Salesforce/codegen-350M-mono",
          "Salesforce/codegen-350M-multi",
          "Salesforce/codegen-350M-nl",
          "Salesforce/codegen-2B-mono",
          "Salesforce/codegen-2B-multi",
          "Salesforce/codegen-2B-nl",
          "Salesforce/codegen-6B-mono",
          "Salesforce/codegen-6B-multi",
          "Salesforce/codegen-6B-nl",
          "Salesforce/codegen-16B-mono",
          "Salesforce/codegen-16B-multi",
          "Salesforce/codegen-16B-nl",
          "Salesforce/codegen2-1B_P",
          "Salesforce/codegen2-3_7B_P",
          "Salesforce/codegen2-7B_P",
          "Salesforce/codegen2-16B_P",
          "cerebras/Cerebras-GPT-111M",
          "cerebras/Cerebras-GPT-256M",
          "cerebras/Cerebras-GPT-590M",
          "cerebras/Cerebras-GPT-1.3B",
          "cerebras/Cerebras-GPT-2.7B",
          "cerebras/Cerebras-GPT-6.7B",
          "cerebras/Cerebras-GPT-13B",
          "cerebras/btlm-3b-8k-base",
          "cerebras/btlm-3b-8k-chat",
          "inclusionAI/LLaDA2.0-mini",
          "inclusionAI/LLaDA2.0-flash",
          "inclusionAI/LLaDA2.1-mini",
          "inclusionAI/LLaDA2.1-flash",
          "inclusionAI/LLaDA-MoE-7B-A1B-Base",
          "inclusionAI/Ring-2.5-1T",
          "inclusionAI/Ling-2.5-1T",
          "inclusionAI/Ling-mini-2.0",
          "inclusionAI/Ling-flash-2.0",
          "inclusionAI/Ling-1T",
          "inclusionAI/Ring-mini-2.0",
          "inclusionAI/Ling-flash-base-2.0",
          "inclusionAI/Ring-flash-2.0",
          "inclusionAI/Ring-1T",
          "inclusionAI/GroveMoE-Base",
          "inclusionAI/Qwen3-32B-AWorld",
          "inclusionAI/AReaL-SEA-235B-A22B",
          "inclusionAI/GroveMoE-Inst",
          "inclusionAI/AReaL-boba-2-14B-Open",
          "inclusionAI/AReaL-boba-2-8B-Open",
          "inclusionAI/AReaL-boba-2-32B",
          "inclusionAI/AReaL-boba-2-8B",
          "inclusionAI/AReaL-boba-2-14B",
          "PleIAs/Pleias-350m-Preview",
          "PleIAs/Pleias-1.2b-Preview",
          "PleIAs/Pleias-3b-Preview",
          "PleIAs/Pleias-Pico",
          "PleIAs/Baguettotron",
          "PleIAs/Monad",
          "janhq/Jan-v1-4B",
          "janhq/Jan-v1-edge",
          "janhq/Jan-v1-2509",
          "janhq/Jan-v3-4B-base-instruct",
          "janhq/Jan-v3.5-4B",
          "janhq/Jan-code-4b",
          "Zyphra/Zamba-7B-v1",
          "Zyphra/Zamba2-1.2B",
          "Zyphra/Zamba2-1.2B-instruct",
          "Zyphra/Zamba2-2.7B",
          "Zyphra/Zamba2-2.7B-instruct",
          "Zyphra/Zamba2-7B-Instruct",
          "Zyphra/Zamba2-1.2B-Instruct-v2",
          "Zyphra/Zamba2-2.7B-Instruct-v2",
          "Zyphra/Zamba2-7B-Instruct-v2",
          "Zyphra/ZR1-1.5B",
          "Zyphra/ZAYA1-base",
          "Zyphra/ZAYA1-reasoning-base",
          "arcee-ai/Trinity-Large-TrueBase",
          "arcee-ai/Trinity-Large-Base",
          "arcee-ai/Trinity-Large-Preview",
          "arcee-ai/Trinity-Large-Thinking",
          "Snowflake/snowflake-arctic-base",
          "Snowflake/snowflake-arctic-instruct",
          "Dream-org/Dream-v0-Base-7B",
          "Dream-org/Dream-v0-Instruct-7B",
          "Dream-org/Dream-Coder-v0-Base-7B",
          "Dream-org/Dream-Coder-v0-Instruct-7B",
          "Dream-org/DreamOn-v0-7B",
          "utter-project/EuroLLM-1.7B",
          "utter-project/EuroLLM-1.7B-Instruct",
          "utter-project/EuroLLM-9B-2512",
          "utter-project/EuroLLM-9B-Instruct-2512",
          "utter-project/EuroLLM-22B-2512",
          "utter-project/EuroLLM-22B-Instruct-2512",
          "utter-project/EuroMoE-2.6B-A0.6B-2512",
          "utter-project/EuroMoE-2.6B-A0.6B-Instruct-2512",
          "swiss-ai/Apertus-8B-2509",
          "swiss-ai/Apertus-70B-2509",
          "swiss-ai/Apertus-8B-Instruct-2509",
          "swiss-ai/Apertus-70B-Instruct-2509",
          "TinyLlama/TinyLlama_v1.1",
          "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
          "baichuan-inc/Baichuan-M2-32B",
          "baichuan-inc/Baichuan-M3-235B",
          "upstage/SOLAR-10.7B-v1.0",
          "upstage/TinySolar-248m-4k",
          "upstage/solar-pro-preview-instruct",
          "openai/gpt-oss-20b",
          "openai/gpt-oss-120b",
          "GSAI-ML/LLaDA-8B-Instruct",
          "GSAI-ML/LLaDA-1.5",
          "GSAI-ML/LLaDA-8B-Base",
          "GSAI-ML/ReFusion",
          "ByteDance-Seed/academic-ds-9B",
          "ByteDance-Seed/Seed-OSS-36B-Base",
          "ByteDance-Seed/Seed-Coder-8B-Base",
          "ByteDance-Seed/Seed-Coder-8B-Reasoning",
          "ByteDance-Seed/Stable-DiffCoder-8B-Instruct",
          "openbmb/AgentCPM-Explore",
          "openbmb/AgentCPM-Report",
          "openbmb/MiniCPM-S-1B-sft",
          "openbmb/MiniCPM-SALA",
          "openbmb/MiniCPM3-4B",
          "openbmb/MiniCPM-MoE-8x2B",
          "openbmb/MiniCPM4.1-8B",
          "Qwen/Qwen2-0.5B",
          "Qwen/Qwen2-7B-Instruct",
          "Qwen/Qwen2.5-0.5B",
          "Qwen/Qwen2.5-7B-Instruct",
          "Qwen/Qwen2.5-Coder-32B-Instruct",
          "Qwen/Qwen2.5-Math-7B-Instruct",
          "Qwen/Qwen3-14B-Base",
          "Qwen/Qwen3-0.6B",
          "Qwen/Qwen3-4B-Instruct-2507",
          "Qwen/Qwen3-Next-80B-A3B-Instruct",
          "Qwen/Qwen3-Next-80B-A3B-Thinking",
          "Qwen/Qwen3-235B-A22B-Instruct-2507",
          "Qwen/Qwen3-235B-A22B-Thinking-2507",
          "Qwen/Qwen3.5-0.8B-Base",
          "Qwen/Qwen3.5-0.8B",
          "Qwen/Qwen3.5-27B",
          "Qwen/Qwen3.5-122B-A10B",
          "Qwen/Qwen3.5-397B-A17B",
          "Qwen/Qwen3-Coder-Next",
          "Qwen/Qwen3-Coder-480B-A35B-Instruct",
          "Qwen/Qwen3-Coder-Next-Base",
          "Qwen/QwQ-32B",
          "Qwen/QwQ-32B-Preview",
          "deepseek-ai/DeepSeek-V3",
          "deepseek-ai/DeepSeek-V3-0324",
          "deepseek-ai/DeepSeek-R1",
          "deepseek-ai/DeepSeek-R1-Zero",
          "deepseek-ai/DeepSeek-R1-0528",
          "deepseek-ai/DeepSeek-V3.1-Base",
          "deepseek-ai/DeepSeek-V3.1",
          "deepseek-ai/DeepSeek-V3.1-Terminus",
          "deepseek-ai/DeepSeek-V3.2-Exp-Base",
          "deepseek-ai/DeepSeek-V3.2-Exp",
          "deepseek-ai/DeepSeek-V3.2",
          "deepseek-ai/DeepSeek-V3.2-Speciale",
          "distilbert/distilgpt2",
          "internlm/internlm2_5-1_8b",
          "internlm/internlm2_5-20b",
          "internlm/internlm3-8b-instruct",
          "internlm/AlchemistCoder-L-7B",
          "zai-org/GLM-4.5",
          "zai-org/GLM-4.5-Base",
          "zai-org/GLM-4.5-Air",
          "zai-org/GLM-4.5-Air-Base",
          "zai-org/GLM-4.6",
          "zai-org/GLM-4.7",
          "zai-org/GLM-4.7-Flash",
          "zai-org/GLM-5",
          "stepfun-ai/Step-3.5-Flash",
          "stepfun-ai/Step-3.5-Flash-Base-Midtrain",
        ])
      )

    },
    60000
  )

  for (const group of BUILTIN_ALIAS_CASE_GROUPS) {
    it(`常见模型别名会映射到内置 family: ${group.name}`, async () => {
      await assertBuiltinAliasCases(group.cases)
    }, 120000)
  }

  it("内置 family 的编码行为和 Hugging Face 真值一致", async () => {
    for (const family of listSupportedFamilies()) {
      const reference = await loadBuiltinReferenceCase(family)

      for (const input of BUILTIN_REFERENCE_SAMPLES) {
        const actualIds = await encode(input, family, {
          addSpecialTokens: false,
        })
        const expectedIds = reference.encode(input, { add_special_tokens: false })

        expect(actualIds).toEqual(expectedIds)
        expect(await decode(actualIds, family)).toBe(decodeWithReference(reference, expectedIds))
      }

      clearCache(family)
    }
  }, 240000)
})

/**
 * 生成 ByteLevel toy tokenizer。
 * 输入：无。
 * 输出：可与官方实现对拍的最小 ByteLevel tokenizer 资产。
 */
function createByteLevelToyAsset(): TokenizerAsset {
  const vocab: Record<string, number> = {
    "<unk>": 0,
  }

  let nextId = 1
  for (const char of createByteToUnicodeFixture()) {
    if (vocab[char] === undefined) {
      vocab[char] = nextId
      nextId += 1
    }
  }

  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [
      {
        id: nextId,
        content: "<|special|>",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: false,
        special: true,
      },
    ],
    pre_tokenizer: {
      type: "ByteLevel",
      add_prefix_space: false,
      trim_offsets: false,
      use_regex: false,
    },
    decoder: {
      type: "ByteLevel",
      add_prefix_space: false,
      trim_offsets: false,
      use_regex: false,
    },
    model: {
      type: "BPE",
      vocab,
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成 Metaspace toy tokenizer。
 * 输入：无。
 * 输出：可与官方实现对拍的最小 Metaspace tokenizer 资产。
 */
function createMetaspaceToyAsset(): TokenizerAsset {
  const vocab = createCharVocab(["<unk>", "▁", "H", "e", "l", "o", "w", "r", "d", "!"])

  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Metaspace",
      replacement: "▁",
      prepend_scheme: "always",
    },
    decoder: {
      type: "Metaspace",
      replacement: "▁",
    },
    model: {
      type: "BPE",
      vocab,
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成用于验证 NFC normalizer 的 toy tokenizer。
 * 输入：无。
 * 输出：只有经过 NFC 归一化后才能命中的最小资产。
 */
function createNfcToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: {
      type: "NFC",
    },
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: null,
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "é": 1,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成用于验证 Digits pre-tokenizer 的 toy tokenizer。
 * 输入：无。
 * 输出：按数字块切分后才能命中的最小资产。
 */
function createDigitsToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Sequence",
      pretokenizers: [
        {
          type: "Digits",
          individual_digits: false,
        },
        {
          type: "Split",
          pattern: {
            Regex: "[0-9][0-9][0-9]",
          },
          behavior: "Isolated",
          invert: false,
        },
      ],
    },
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "abc": 1,
        "123": 2,
        "456": 3,
        "def": 4,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成用于验证 individual_digits=true 的 toy tokenizer。
 * 输入：无。
 * 输出：必须把连续数字拆成单个字符的最小资产。
 */
function createIndividualDigitsToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Digits",
      individual_digits: true,
    },
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "abc": 1,
        "1": 2,
        "2": 3,
        "3": 4,
        "def": 5,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成用于验证非 ASCII 数字不会命中 Digits 预分词的 toy tokenizer。
 * 输入：无。
 * 输出：只有把 `²` 留给 ByteLevel 整体处理时才会命中的最小资产。
 */
function createNonAsciiDigitsToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Sequence",
      pretokenizers: [
        {
          type: "Digits",
          individual_digits: true,
        },
        {
          type: "ByteLevel",
          add_prefix_space: false,
          trim_offsets: true,
          use_regex: true,
        },
      ],
    },
    decoder: {
      type: "ByteLevel",
      add_prefix_space: true,
      trim_offsets: true,
      use_regex: true,
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "ĠÂ": 1,
        "²": 2,
        "Ġ": 3,
        "Â": 4,
        "Â²": 5,
      },
      merges: ["Ġ Â"],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 Punctuation pre-tokenizer 的 toy tokenizer。
 * 输入：无。
 * 输出：依赖 contiguous 标点切分的最小资产。
 */
function createPunctuationToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Punctuation",
      behavior: "Contiguous",
    },
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "Hi": 1,
        ",": 2,
        "world": 3,
        "!!": 4,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成用于验证 ASCII 标点连续段的 toy tokenizer。
 * 输入：无。
 * 输出：依赖 `. |` 同段切分的最小资产。
 */
function createAsciiPunctuationToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Punctuation",
      behavior: "Contiguous",
    },
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "a": 1,
        ".|": 2,
        "b": 3,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成用于验证 `(?i:...)` 局部大小写不敏感片段的 toy tokenizer。
 * 输入：无。
 * 输出：依赖 `Split + ByteLevel(use_regex=false)` 的最小资产。
 */
function createInlineCaseInsensitiveSplitToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Sequence",
      pretokenizers: [
        {
          type: "Split",
          pattern: {
            Regex:
              "(?i:'s|'t|'re|'ve|'m|'ll|'d)|[^\\r\\n\\p{L}\\p{N}]?[\\p{L}\\p{M}]+|\\p{N}| ?[^\\s\\p{L}\\p{M}\\p{N}]+[\\r\\n]*|\\s*[\\r\\n]+|\\s+(?!\\S)|\\s+",
          },
          behavior: "Isolated",
          invert: false,
        },
        {
          type: "ByteLevel",
          add_prefix_space: false,
          trim_offsets: true,
          use_regex: false,
        },
      ],
    },
    decoder: {
      type: "ByteLevel",
      add_prefix_space: true,
      trim_offsets: true,
      use_regex: true,
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "ĠAYA": 1,
        "'D": 2,
        "A": 3,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 批量校验常见模型别名。
 * 输入：canonical family 与其应命中的别名集合。
 * 输出：每个别名都解析到对应 canonical tokenizer。
 */
async function assertBuiltinAliasCases(
  cases: ReadonlyArray<{
    canonical: string
    aliases: readonly string[]
  }>
): Promise<void> {
  for (const { canonical, aliases } of cases) {
    const tokenizer = await getEncoding(canonical)

    for (const alias of aliases) {
      expect(await getEncoding(alias)).toBe(tokenizer)
    }
  }
}

/**
 * 生成用于验证 Rust possessive quantifier 兼容性的 toy tokenizer。
 * 输入：无。
 * 输出：依赖 `?+` / `++` 语义的最小 Split + ByteLevel 资产。
 */
function createPossessiveQuantifierSplitToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Sequence",
      pretokenizers: [
        {
          type: "Split",
          pattern: {
            Regex:
              "'(?i:[sdmt]|ll|ve|re)|[^\\r\\n\\p{L}\\p{N}]?+\\p{L}+|\\p{N}| ?[^\\s\\p{L}\\p{N}]++[\\r\\n]*|\\s*[\\r\\n]|\\s+(?!\\S)|\\s+",
          },
          behavior: "Isolated",
          invert: false,
        },
        {
          type: "ByteLevel",
          add_prefix_space: false,
          trim_offsets: true,
          use_regex: false,
        },
      ],
    },
    decoder: {
      type: "ByteLevel",
      add_prefix_space: true,
      trim_offsets: true,
      use_regex: true,
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "ĠHello": 1,
        "!!": 2,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成用于验证 TikToken/Kimi 字符类交集兼容性的 toy tokenizer。
 * 输入：无。
 * 输出：依赖 `\p{Han}` 与 `[...&&[^...]]` 语义的最小 Split 资产。
 */
function createCharacterClassIntersectionSplitToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Split",
      pattern: {
        Regex:
          "\\p{Han}+|[^\\r\\n\\p{L}\\p{N}]?[\\p{Lu}\\p{Lt}\\p{Lm}\\p{Lo}\\p{M}&&[^\\p{Han}]]*[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}&&[^\\p{Han}]]+(?i:'s|'t|'re|'ve|'m|'ll|'d)?|[^\\r\\n\\p{L}\\p{N}]?[\\p{Lu}\\p{Lt}\\p{Lm}\\p{Lo}\\p{M}&&[^\\p{Han}]]+[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}&&[^\\p{Han}]]*(?i:'s|'t|'re|'ve|'m|'ll|'d)?|\\p{N}{1,3}| ?[^\\s\\p{L}\\p{N}]+[\\r\\n]*|\\s*[\\r\\n]+|\\s+(?!\\S)|\\s+",
      },
      behavior: "Isolated",
      invert: false,
    },
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "汉字": 1,
        " Hello's": 2,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成用于验证 `#` 开头 merge 规则的 toy tokenizer。
 * 输入：无。
 * 输出：依赖字符串格式 merges 的最小资产。
 */
function createHashMergeToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: null,
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "#": 1,
        "##": 2,
        "###": 3,
        "\n": 4,
        "###\n": 5,
      },
      merges: ["#version: 0.2", "# #", "## #", "### \n"],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 Prepend + Replace normalizer 的 toy tokenizer。
 * 输入：无。
 * 输出：依赖序列 normalizer 和解码链的最小资产。
 */
function createPrependReplaceToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: {
      type: "Sequence",
      normalizers: [
        {
          type: "Prepend",
          prepend: "▁",
        },
        {
          type: "Replace",
          pattern: {
            String: " ",
          },
          content: "▁",
        },
      ],
    },
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: null,
    decoder: {
      type: "Sequence",
      decoders: [
        {
          type: "Replace",
          pattern: {
            String: "▁",
          },
          content: " ",
        },
        {
          type: "Fuse",
        },
        {
          type: "Strip",
          content: " ",
          start: 1,
          stop: 0,
        },
      ],
    },
    model: {
      type: "BPE",
      vocab: createCharVocab([
        "<unk>",
        "▁",
        "H",
        "e",
        "l",
        "o",
        "w",
        "r",
        "d",
      ]),
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成能暴露 Metaspace split 语义的 toy tokenizer。
 * 输入：无。
 * 输出：只有正确按 replacement 切段时才能命中的最小资产。
 */
function createMetaspaceSplitToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Metaspace",
      replacement: "▁",
      prepend_scheme: "always",
      split: true,
    },
    decoder: {
      type: "Metaspace",
      replacement: "▁",
      prepend_scheme: "always",
      split: true,
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "▁Hey": 1,
        "▁friend!": 2,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成专门验证 Metaspace `prepend_scheme=first` 顶层行为的 toy tokenizer。
 * 输入：无。
 * 输出：只有首段自动补 replacement 时才能命中的最小资产。
 */
function createMetaspaceFirstPretokenizerToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: {
      type: "Metaspace",
      replacement: "▁",
      prepend_scheme: "first",
      split: false,
    },
    decoder: {
      type: "Sequence",
      decoders: [
        {
          type: "Replace",
          pattern: {
            String: "▁",
          },
          content: " ",
        },
        {
          type: "Fuse",
        },
        {
          type: "Strip",
          content: " ",
          start: 1,
          stop: 0,
        },
      ],
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "▁Hello": 1,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 生成专门验证 Metaspace decoder prepend_scheme 的 toy tokenizer。
 * 输入：无。
 * 输出：用于验证 `prepend_scheme=never` 的最小资产。
 */
function createMetaspaceNeverDecodeToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: null,
    decoder: {
      type: "Metaspace",
      replacement: "▁",
      prepend_scheme: "never",
      split: true,
    },
    model: {
      type: "BPE",
      vocab: {
        "▁Hey": 0,
        "▁friend!": 1,
      },
      merges: [],
      unk_token: null,
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成 ByteFallback decoder toy tokenizer。
 * 输入：无。
 * 输出：用于验证 ByteFallback decode 的最小资产。
 */
function createByteFallbackToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: null,
    decoder: {
      type: "Sequence",
      decoders: [{ type: "ByteFallback" }, { type: "Fuse" }],
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "<0xE4>": 1,
        "<0xBD>": 2,
        "<0xA0>": 3,
        "!": 4,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: true,
      ignore_merges: false,
    },
  }
}

/**
 * 生成会触发非法 UTF-8 ByteFallback 的 toy tokenizer。
 * 输入：无。
 * 输出：用于验证替换字符数量的最小资产。
 */
function createByteFallbackInvalidToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [],
    pre_tokenizer: null,
    decoder: {
      type: "Sequence",
      decoders: [{ type: "ByteFallback" }, { type: "Fuse" }],
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "<0xE5>": 1,
        "<0x8F>": 2,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: true,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 added token 抽取的 toy tokenizer。
 * 输入：无。
 * 输出：包含非 special added token 的最小资产。
 */
function createAddedTokenToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [
      {
        id: 4,
        content: "my",
        single_word: false,
        lstrip: true,
        rstrip: true,
        normalized: true,
        special: false,
      },
    ],
    pre_tokenizer: null,
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        " ": 1,
        "m": 2,
        "y": 3,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 special added token 抽取行为的 toy tokenizer。
 * 输入：无。
 * 输出：包含 `<s>` special added token 的最小资产。
 */
function createSpecialAddedTokenToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [
      {
        id: 4,
        content: "<s>",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: false,
        special: true,
      },
    ],
    pre_tokenizer: null,
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "<": 1,
        "s": 2,
        ">": 3,
        "du": 5,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 added token 边界下 Prepend normalizer 行为的 toy tokenizer。
 * 输入：无。
 * 输出：切段后仍需给普通片段补前缀的最小资产。
 */
function createPrependSpecialAddedTokenToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: {
      type: "Sequence",
      normalizers: [
        {
          type: "Prepend",
          prepend: "▁",
        },
        {
          type: "Replace",
          pattern: {
            String: " ",
          },
          content: "▁",
        },
      ],
    },
    post_processor: null,
    added_tokens: [
      {
        id: 1,
        content: "<s>",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: false,
        special: true,
      },
    ],
    pre_tokenizer: null,
    decoder: {
      type: "Sequence",
      decoders: [
        {
          type: "Replace",
          pattern: {
            String: "▁",
          },
          content: " ",
        },
        {
          type: "Fuse",
        },
        {
          type: "Strip",
          content: " ",
          start: 1,
          stop: 0,
        },
      ],
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "<s>": 1,
        "▁du": 2,
        "▁": 3,
        "du": 4,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 normalized special added token 边界下 Prepend normalizer 行为的 toy tokenizer。
 * 输入：无。
 * 输出：special token 在中间切段时，前后普通片段都要按独立 section 重新 normalizer。
 */
function createNormalizedPrependSpecialAddedTokenToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: {
      type: "Sequence",
      normalizers: [
        {
          type: "Prepend",
          prepend: "▁",
        },
        {
          type: "Replace",
          pattern: {
            String: " ",
          },
          content: "▁",
        },
      ],
    },
    post_processor: null,
    added_tokens: [
      {
        id: 1,
        content: "<s>",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: true,
        special: true,
      },
    ],
    pre_tokenizer: null,
    decoder: {
      type: "Sequence",
      decoders: [
        {
          type: "Replace",
          pattern: {
            String: "▁",
          },
          content: " ",
        },
        {
          type: "Fuse",
        },
        {
          type: "Strip",
          content: " ",
          start: 1,
          stop: 0,
        },
      ],
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "<s>": 1,
        "▁sa": 2,
        "▁": 3,
        "▁du": 4,
        "du": 5,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 added token 边界下 Metaspace first 语义的 toy tokenizer。
 * 输入：无。
 * 输出：后续普通片段不应再被当作首段处理的最小资产。
 */
function createMetaspaceFirstSpecialAddedTokenToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [
      {
        id: 1,
        content: "<s>",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: false,
        special: true,
      },
    ],
    pre_tokenizer: {
      type: "Metaspace",
      replacement: "▁",
      prepend_scheme: "first",
      split: false,
    },
    decoder: {
      type: "Sequence",
      decoders: [
        {
          type: "Replace",
          pattern: {
            String: "▁",
          },
          content: " ",
        },
        {
          type: "Fuse",
        },
        {
          type: "Strip",
          content: " ",
          start: 1,
          stop: 0,
        },
      ],
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "<s>": 1,
        "du": 2,
        "▁du": 3,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 overlapping added token 的 toy tokenizer。
 * 输入：无。
 * 输出：包含相同起点不同长度 added token 的最小资产。
 */
function createOverlappingAddedTokenToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [
      {
        id: 5,
        content: "ab",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: true,
        special: false,
      },
      {
        id: 6,
        content: "abc",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: true,
        special: false,
      },
    ],
    pre_tokenizer: null,
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "z": 1,
        "a": 2,
        "b": 3,
        "c": 4,
        "x": 7,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成用于验证 leftmost 优先级的 toy tokenizer。
 * 输入：无。
 * 输出：包含不同位置重叠片段的最小资产。
 */
function createSingleWordAddedTokenToyAsset(): TokenizerAsset {
  return {
    version: "1.0",
    normalizer: null,
    post_processor: null,
    added_tokens: [
      {
        id: 9,
        content: "ab",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: true,
        special: false,
      },
      {
        id: 10,
        content: "abc",
        single_word: false,
        lstrip: false,
        rstrip: false,
        normalized: true,
        special: false,
      },
    ],
    pre_tokenizer: null,
    decoder: {
      type: "Fuse",
    },
    model: {
      type: "BPE",
      vocab: {
        "<unk>": 0,
        "z": 1,
        "a": 2,
        "b": 3,
        "c": 4,
        " ": 5,
      },
      merges: [],
      unk_token: "<unk>",
      continuing_subword_prefix: "",
      end_of_word_suffix: "",
      byte_fallback: false,
      ignore_merges: false,
    },
  }
}

/**
 * 生成测试用 byte -> unicode 映射表。
 * 输入：无。
 * 输出：完整的 256 项 GPT-2 风格字节映射。
 */
function createByteToUnicodeFixture(): string[] {
  const table = new Array<string>(256)

  for (let value = 33; value <= 126; value += 1) {
    table[value] = String.fromCharCode(value)
  }
  for (let value = 161; value <= 172; value += 1) {
    table[value] = String.fromCharCode(value)
  }
  for (let value = 174; value <= 255; value += 1) {
    table[value] = String.fromCharCode(value)
  }

  let offset = 0
  for (let value = 0; value < 256; value += 1) {
    if (!table[value]) {
      table[value] = String.fromCharCode(256 + offset)
      offset += 1
    }
  }

  return table
}

/**
 * 为字符列表生成简单词表。
 * 输入：按顺序排列的 token 字符串数组。
 * 输出：token -> id 的映射对象。
 */
function createCharVocab(tokens: string[]): Record<string, number> {
  return tokens.reduce<Record<string, number>>((vocab, token, index) => {
    vocab[token] = index
    return vocab
  }, {})
}

/**
 * 调用 Hugging Face 参考 tokenizer 的原始 decode。
 * 输入：参考 tokenizer 和 token ids。
 * 输出：关闭空格清理后的 decode 文本。
 */
function decodeWithReference(reference: PreTrainedTokenizer, ids: number[]): string {
  return reference.decode(ids, {
    skip_special_tokens: false,
    clean_up_tokenization_spaces: false,
  })
}

/**
 * 读取单个内置 family 对应的 HF 参考 tokenizer。
 * 输入：family 名称。
 * 输出：从仓库内 `.json.br` 快照解压得到的参考 tokenizer。
 */
async function loadBuiltinReferenceCase(family: string): Promise<PreTrainedTokenizer> {
  // @ts-expect-error 这里直接导入构建脚本模块，测试只关心其运行时导出形状。
  const { FAMILY_SPECS } = await import("../../../scripts/generate-builtins.mjs")
  const spec = FAMILY_SPECS.find((item: { family: string }) => item.family === family)

  if (!spec) {
    throw new Error(`Missing builtin reference spec for family: ${family}`)
  }

  const sourcePath = resolve(REPO_ROOT, spec.source)
  const compressed = readFileSync(sourcePath)
  const rawJson = brotliDecompressSync(compressed).toString("utf8")
  const asset = normalizeReferenceAssetForJavaScript(JSON.parse(rawJson) as TokenizerAsset)

  return new PreTrainedTokenizer(
    {
      ...asset,
      normalizer: asset.normalizer ?? null,
      pre_tokenizer: asset.pre_tokenizer ?? null,
      post_processor: asset.post_processor ?? null,
      decoder: asset.decoder ?? null,
    } as any,
    {}
  )
}

/**
 * 把参考 tokenizer 里的 Rust regex 方言降级成 JS 可解析的等价形式。
 * 输入：仓库里的原始 tokenizer 资产。
 * 输出：可交给 `@huggingface/transformers` JS 参考实现装载的兼容资产。
 */
function normalizeReferenceAssetForJavaScript(asset: TokenizerAsset): TokenizerAsset {
  return normalizeReferenceValue(asset) as TokenizerAsset
}

/**
 * 递归归一化参考资产里的 regex 方言。
 * 输入：任意 JSON 值。
 * 输出：替换了特殊 regex 的等价新值。
 */
function normalizeReferenceValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeReferenceValue(entry))
  }

  if (!value || typeof value !== "object") {
    return value
  }

  const record = value as Record<string, unknown>
  const normalizedEntries = Object.entries(record).map(([key, entry]) => {
    if (key === "Regex" && typeof entry === "string") {
      return [key, normalizeReferenceRegex(entry)]
    }

    return [key, normalizeReferenceValue(entry)]
  })

  return Object.fromEntries(normalizedEntries)
}

/**
 * 把 JS 不支持的 Rust regex 改写成当前参考测试可接受的等价形式。
 * 输入：原始 regex 字符串。
 * 输出：JS 可解析的 regex 字符串。
 */
function normalizeReferenceRegex(pattern: string): string {
  if (pattern === DIGIT_CHUNK_510_PATTERN) {
    return "$^"
  }

  if (pattern === DIGIT_LEADING_GROUP_PATTERN) {
    return String.raw`^\p{Nd}{1,2}(?=(?:\p{Nd}{3})+$)`
  }

  if (pattern === DIGIT_TRIPLE_GROUP_PATTERN) {
    return String.raw`\p{Nd}{3}`
  }

  return pattern.replace(/\(\?>/g, "(?:").replace(/\\A/g, "^").replace(/\\z/g, "$")
}
