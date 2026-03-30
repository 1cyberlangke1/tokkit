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
          "bitnet-b1.58-2b-4t",
          "yi",
          "yi-1.5-9b-chat",
          "yi-coder",
          "yi-coder-chat",
          "devstral-small-2",
          "deepseek-r1",
          "deepseek-v3",
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
          "granite-7b-base",
          "granite-7b-instruct",
          "granite-code-base",
          "academic-ds",
          "cosmo-1b",
          "longcat-flash-chat",
          "longcat-flash-lite",
          "longcat-flash-thinking",
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
          "gpt-neo",
          "polyglot-ko",
          "polyglot-ko-12.8",
          "pythia",
          "qwen3-coder-next",
          "qwen3.5",
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
          "microsoft/bitnet-b1.58-2B-4T",
          "microsoft/phi-1",
          "microsoft/Phi-3-mini-4k-instruct",
          "microsoft/Phi-3-medium-4k-instruct",
          "microsoft/Phi-3.5-mini-instruct",
          "microsoft/Phi-mini-MoE-instruct",
          "microsoft/phi-4",
          "microsoft/Phi-4-reasoning",
          "microsoft/Phi-4-mini-instruct",
          "microsoft/Phi-4-mini-reasoning",
          "microsoft/Phi-4-mini-flash-reasoning",
          "mistralai/Mistral-7B-v0.1",
          "mistralai/Mixtral-8x7B-v0.1",
          "mistralai/Ministral-8B-Instruct-2410",
          "mistralai/Devstral-Small-2-24B-Instruct-2512",
          "mistralai/Mistral-Small-3.1-24B-Instruct-2503",
          "HuggingFaceTB/cosmo-1b",
          "HuggingFaceTB/SmolLM-135M",
          "HuggingFaceTB/SmolLM2-1.7B",
          "HuggingFaceTB/SmolLM2-1.7B-Instruct-16k",
          "HuggingFaceTB/SmolLM3-3B",
          "HuggingFaceTB/SmolLM3-3B-Base",
          "allenai/OLMo-1B-hf",
          "allenai/OLMo-2-0425-1B",
          "allenai/OLMo-2-1124-13B",
          "allenai/Olmo-3-7B-Instruct",
          "allenai/Olmo-Hybrid-7B",
          "ibm-granite/granite-3.0-1b-a400m-base",
          "ibm-granite/granite-3.0-2b-base",
          "ibm-granite/granite-3.0-1b-a400m-instruct",
          "ibm-granite/granite-3.0-2b-instruct",
          "ibm-granite/granite-3.3-8b-base",
          "ibm-granite/granite-3.3-8b-instruct",
          "ibm-granite/granite-20b-code-instruct-8k",
          "ibm-granite/granite-4.0-350m-base",
          "ibm-granite/granite-4.0-tiny-preview",
          "ibm-granite/granite-34b-code-instruct-8k",
          "ibm-granite/granite-7b-base",
          "ibm-granite/granite-7b-instruct",
          "ByteDance-Seed/academic-ds-9B",
          "ByteDance-Seed/Seed-OSS-36B-Base",
          "ByteDance-Seed/Seed-Coder-8B-Base",
          "ByteDance-Seed/Seed-Coder-8B-Reasoning",
          "ByteDance-Seed/Stable-DiffCoder-8B-Instruct",
          "openbmb/MiniCPM-S-1B-sft",
          "openbmb/MiniCPM-SALA",
          "openbmb/MiniCPM3-4B",
          "openbmb/MiniCPM4.1-8B",
          "Qwen/Qwen3.5-0.8B",
          "Qwen/Qwen3.5-27B",
          "Qwen/Qwen3.5-397B-A17B",
          "Qwen/Qwen3-Coder-Next",
          "deepseek-ai/DeepSeek-V3-0324",
          "deepseek-ai/DeepSeek-V3.1",
          "deepseek-ai/DeepSeek-V3.1-Base",
          "deepseek-ai/DeepSeek-R1",
          "deepseek-ai/DeepSeek-R1-0528",
          "deepseek-ai/DeepSeek-R1-Zero",
          "deepseek-ai/DeepSeek-V3.2",
          "deepseek-ai/DeepSeek-V3.2-Exp",
          "deepseek-ai/DeepSeek-V3.2-Exp-Base",
          "zai-org/GLM-4.7",
          "zai-org/GLM-5",
          "stepfun-ai/Step-3.5-Flash",
        ])
      )

      const yi = await getEncoding("yi")
      expect(await getEncoding("01-ai/Yi-6B")).toBe(yi)
      expect(await getEncoding("01-ai/Yi-1.5-34B")).toBe(yi)

      const yi15Chat = await getEncoding("yi-1.5-9b-chat")
      expect(await getEncoding("01-ai/Yi-1.5-9B-Chat")).toBe(yi15Chat)

      const yiCoder = await getEncoding("yi-coder")
      expect(await getEncoding("01-ai/Yi-34B")).toBe(yiCoder)
      expect(await getEncoding("01-ai/Yi-Coder-1.5B")).toBe(yiCoder)

      const yiCoderChat = await getEncoding("yi-coder-chat")
      expect(await getEncoding("01-ai/Yi-Coder-9B-Chat")).toBe(yiCoderChat)
      expect(await getEncoding("01-ai/Yi-Coder-1.5B-Chat")).toBe(yiCoderChat)

      const qwen35 = await getEncoding("qwen3.5")
      expect(await getEncoding("Qwen/Qwen3.5-27B")).toBe(qwen35)
      expect(await getEncoding("Qwen/Qwen3.5-397B-A17B")).toBe(qwen35)

      const falcon7b = await getEncoding("falcon-7b")
      expect(await getEncoding("tiiuae/falcon-7b-instruct")).toBe(falcon7b)
      expect(await getEncoding("tiiuae/falcon-40b")).toBe(falcon7b)

      const gptNeo = await getEncoding("gpt-neo")
      expect(await getEncoding("EleutherAI/gpt-j-6b")).toBe(gptNeo)
      expect(await getEncoding("EleutherAI/gpt-neo-2.7B")).toBe(gptNeo)
      expect(await getEncoding("gpt-j")).toBe(gptNeo)

      const pythia = await getEncoding("pythia")
      expect(await getEncoding("EleutherAI/gpt-neox-20b")).toBe(pythia)
      expect(await getEncoding("EleutherAI/pythia-14m")).toBe(pythia)
      expect(await getEncoding("EleutherAI/pythia-12b")).toBe(pythia)
      expect(await getEncoding("EleutherAI/pythia-12b-deduped")).toBe(pythia)
      expect(await getEncoding("gpt-neox")).toBe(pythia)

      const mimo = await getEncoding("mimo")
      expect(await getEncoding("XiaomiMiMo/MiMo-V2-Flash-Base")).toBe(mimo)

      const mistral7bV01 = await getEncoding("mistral-7b-v0.1")
      expect(await getEncoding("mistralai/Mixtral-8x7B-Instruct-v0.1")).toBe(mistral7bV01)

      const mixtral8x7b = await getEncoding("mixtral-8x7b")
      expect(await getEncoding("mistralai/Mixtral-8x7B-v0.1")).toBe(mixtral8x7b)

      const glm5 = await getEncoding("glm-5")
      expect(await getEncoding("zai-org/GLM-5")).toBe(glm5)

      const olmo2 = await getEncoding("olmo-2")
      expect(await getEncoding("allenai/OLMo-2-1124-13B")).toBe(olmo2)

      const deepseekR1 = await getEncoding("deepseek-r1")
      expect(await getEncoding("deepseek-ai/DeepSeek-R1-0528")).toBe(deepseekR1)

      const deepseekV3 = await getEncoding("deepseek-v3")
      expect(await getEncoding("deepseek-ai/DeepSeek-V3-0324")).toBe(deepseekV3)

      const deepseek31 = await getEncoding("deepseek-v3.1")
      expect(await getEncoding("deepseek-ai/DeepSeek-V3.2-Exp")).toBe(deepseek31)

      const deepseek32 = await getEncoding("deepseek-v3.2")
      expect(await getEncoding("deepseek-ai/DeepSeek-V3.2")).toBe(deepseek32)

      const smollm = await getEncoding("smollm")
      expect(await getEncoding("smollm2")).toBe(smollm)
      expect(await getEncoding("HuggingFaceTB/SmolLM2-1.7B")).toBe(smollm)

      const cosmo1b = await getEncoding("cosmo-1b")
      expect(await getEncoding("HuggingFaceTB/cosmo-1b")).toBe(cosmo1b)

      const academicDs = await getEncoding("academic-ds")
      expect(await getEncoding("ByteDance-Seed/academic-ds-9B")).toBe(academicDs)
    },
    60000
  )

  it("内置 family 的编码行为和 Hugging Face 真值一致", async () => {
    const cases = await listBuiltinReferenceCaseSpecs(listSupportedFamilies())

    for (const { family, source } of cases) {
      const reference = loadBuiltinReferenceTokenizer(source)
      for (const input of BUILTIN_REFERENCE_SAMPLES) {
        const actualIds = await encode(input, family, {
          addSpecialTokens: false,
        })
        const expectedIds = reference.encode(input, { add_special_tokens: false })

        expect(actualIds).toEqual(expectedIds)
        expect(await decode(actualIds, family)).toBe(decodeWithReference(reference, expectedIds))
      }
    }
  }, 120000)
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
 * 读取内置 family 对应的 HF 参考 tokenizer。
 * 输入：可选的 family 过滤列表。
 * 输出：从仓库内 `.json.br` 快照解压得到的参考 tokenizer 列表。
 */
async function listBuiltinReferenceCaseSpecs(familyFilter?: Iterable<string>) {
  // @ts-expect-error 这里直接导入构建脚本模块，测试只关心其运行时导出形状。
  const { FAMILY_SPECS } = await import("../../../scripts/generate-builtins.mjs")
  const allowedFamilies = familyFilter ? new Set(familyFilter) : null

  return FAMILY_SPECS.filter((spec: { family: string }) =>
    allowedFamilies ? allowedFamilies.has(spec.family) : true
  ).map((spec: { family: string; source: string }) => {
    return {
      family: spec.family,
      source: spec.source,
    }
  })
}

/**
 * 按需加载单个内置 family 的 HF 参考 tokenizer。
 * 输入：family 对应的压缩 tokenizer 快照路径。
 * 输出：只为当前断言创建的 Hugging Face 参考 tokenizer。
 */
function loadBuiltinReferenceTokenizer(source: string): PreTrainedTokenizer {
  const sourcePath = resolve(REPO_ROOT, source)
  const compressed = readFileSync(sourcePath)
  const rawJson = brotliDecompressSync(compressed).toString("utf8")
  const asset = JSON.parse(rawJson) as TokenizerAsset

  return new PreTrainedTokenizer(asset as any, {})
}
