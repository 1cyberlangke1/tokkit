/**
 * 新架构测试。
 * 输入：自定义注册的 toy tokenizer family。
 * 输出：验证懒加载、别名解析、ByteLevel / Metaspace / ByteFallback 行为。
 */

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

  it("支持特殊 token 白名单", async () => {
    registerTokenizerFamily({
      family: "toy-byte",
      asset: createByteLevelToyAsset(),
    })

    const tokenizer = await getEncoding("toy-byte")
    const plain = tokenizer.encode("<|special|>Hi", {
      addSpecialTokens: false,
    })
    const allowed = tokenizer.encode("<|special|>Hi", {
      addSpecialTokens: true,
      allowedSpecial: "all",
    })

    expect(allowed[0]).toBe(tokenizer.tokenToIdValue("<|special|>"))
    expect(plain[0]).not.toBe(tokenizer.tokenToIdValue("<|special|>"))
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
      reference.decode(ids, { skip_special_tokens: false })
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
          "deepseek-v3.1",
          "deepseek-v3.2",
          "glm-4.7",
          "glm-5",
          "qwen3-coder-next",
          "qwen3.5",
          "step-3.5-flash",
        ].sort()
      )

      expect(listSupportedModels()).toEqual(
        expect.arrayContaining([
          "Qwen/Qwen3.5-0.8B",
          "Qwen/Qwen3.5-27B",
          "Qwen/Qwen3.5-397B-A17B",
          "Qwen/Qwen3-Coder-Next",
          "deepseek-ai/DeepSeek-V3.1",
          "deepseek-ai/DeepSeek-V3.2",
          "zai-org/GLM-4.7",
          "zai-org/GLM-5",
          "stepfun-ai/Step-3.5-Flash",
        ])
      )

      const qwen35 = await getEncoding("qwen3.5")
      expect(await getEncoding("Qwen/Qwen3.5-27B")).toBe(qwen35)
      expect(await getEncoding("Qwen/Qwen3.5-397B-A17B")).toBe(qwen35)

      const glm5 = await getEncoding("glm-5")
      expect(await getEncoding("zai-org/GLM-5")).toBe(glm5)

      const deepseek32 = await getEncoding("deepseek-v3.2")
      expect(await getEncoding("deepseek-ai/DeepSeek-V3.2")).toBe(deepseek32)
    },
    60000
  )

  it.each(BUILTIN_HF_CASES)(
    "内置 family $family 的编码行为和 Hugging Face 真值一致",
    async ({ family, samples }) => {
      for (const sample of samples) {
        const actualIds = await encode(sample.input, family, {
          addSpecialTokens: false,
        })

        expect(actualIds).toEqual(sample.ids)
        expect(await decode(actualIds, family)).toBe(sample.decoded)
      }
    },
    30000
  )
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
 * 真实 Hugging Face tokenizer 的期望样本。
 * 输入：无。
 * 输出：供内置 family 对拍的稳定样本集合。
 */
const BUILTIN_HF_CASES = [
  {
    family: "qwen3.5",
    samples: [
      {
        input: "Hello, world!",
        ids: [9419, 11, 1814, 0],
        decoded: "Hello, world!",
      },
      {
        input: "你好，世界！",
        ids: [109266, 3709, 96748, 6115],
        decoded: "你好，世界！",
      },
      {
        input: "line1\nline2",
        ids: [1021, 16, 198, 1021, 17],
        decoded: "line1\nline2",
      },
    ],
  },
  {
    family: "qwen3-coder-next",
    samples: [
      {
        input: "def add(a, b):\n    return a + b",
        ids: [750, 912, 2877, 11, 293, 982, 262, 470, 264, 488, 293],
        decoded: "def add(a, b):\n    return a + b",
      },
      {
        input: "console.log('hi')",
        ids: [5354, 1665, 492, 6023, 863],
        decoded: "console.log('hi')",
      },
      {
        input: "你好，世界！",
        ids: [108386, 3837, 99489, 6313],
        decoded: "你好，世界！",
      },
    ],
  },
  {
    family: "deepseek-v3.1",
    samples: [
      {
        input: "Hello, world!",
        ids: [19923, 14, 2058, 3],
        decoded: "Hello, world!",
      },
      {
        input: "你好，世界！",
        ids: [30594, 303, 3427, 1175],
        decoded: "你好，世界！",
      },
      {
        input: "12345678",
        ids: [6895, 18009, 2597],
        decoded: "12345678",
      },
    ],
  },
  {
    family: "deepseek-v3.2",
    samples: [
      {
        input: "Hello, world!",
        ids: [19923, 14, 2058, 3],
        decoded: "Hello, world!",
      },
      {
        input: "你好，世界！",
        ids: [30594, 303, 3427, 1175],
        decoded: "你好，世界！",
      },
      {
        input: "A+B=42",
        ids: [35, 59920, 31, 3180],
        decoded: "A+B=42",
      },
    ],
  },
  {
    family: "glm-4.7",
    samples: [
      {
        input: "Hello, world!",
        ids: [9703, 11, 1879, 0],
        decoded: "Hello, world!",
      },
      {
        input: "你好，世界！",
        ids: [109377, 3837, 99011, 6313],
        decoded: "你好，世界！",
      },
      {
        input: "line1\nline2",
        ids: [1056, 16, 198, 1056, 17],
        decoded: "line1\nline2",
      },
    ],
  },
  {
    family: "glm-5",
    samples: [
      {
        input: "Hello, world!",
        ids: [9703, 11, 1879, 0],
        decoded: "Hello, world!",
      },
      {
        input: "你好，世界！",
        ids: [109377, 3837, 99011, 6313],
        decoded: "你好，世界！",
      },
      {
        input: "A+B=42",
        ids: [32, 79085, 28, 101961],
        decoded: "A+B=42",
      },
    ],
  },
  {
    family: "step-3.5-flash",
    samples: [
      {
        input: "Hello, world!",
        ids: [19923, 14, 2058, 3],
        decoded: "Hello, world!",
      },
      {
        input: "你好，世界！",
        ids: [30594, 303, 3427, 1175],
        decoded: "你好，世界！",
      },
      {
        input: "A+B=42",
        ids: [35, 59920, 31, 3180],
        decoded: "A+B=42",
      },
    ],
  },
] as const
