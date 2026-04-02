/**
 * tiktoken.model 转 Hugging Face 风格 tokenizer 资产。
 * 输入：tiktoken 文本表与 tokenizer_config 里的 special token 信息。
 * 输出：可被当前 normalize / runtime 直接消费的 BPE tokenizer 资产。
 */

import { BYTE_TO_UNICODE } from "../core/bytes.js"
import type {
  AddedTokenConfig,
  LongTextEncodingConfig,
  TokenizerAsset,
} from "../types.js"

/** Hugging Face 通用 TikTokenConverter 的默认 regex。 */
export const DEFAULT_TIKTOKEN_PATTERN =
  String.raw`(?i:'s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+`

/** tokenizer_config.json 里 added_tokens_decoder 的单项结构。 */
interface TikTokenAddedTokenConfig {
  content: string
  single_word?: boolean
  lstrip?: boolean
  rstrip?: boolean
  normalized?: boolean
  special?: boolean
}

/** 当前转换器需要读取的 tokenizer_config 子集。 */
export interface TikTokenTokenizerConfig {
  add_prefix_space?: boolean
  added_tokens_decoder?: Record<string, TikTokenAddedTokenConfig>
}

/** tiktoken 转换参数。 */
export interface ConvertTikTokenToTokenizerAssetOptions {
  modelText: string
  pattern?: string
  longTextEncoding?: LongTextEncodingConfig | null
  tokenizerConfig?: TikTokenTokenizerConfig
}

/** tiktoken model 的单个 token 条目。 */
interface TikTokenModelEntry {
  bytes: Buffer
  rank: number
}

/**
 * 按 Hugging Face 官方 TikTokenConverter 逻辑把 tiktoken 文本表还原成 tokenizer 资产。
 * 输入：tiktoken 文本表、regex pattern 与 tokenizer_config。
 * 输出：Hugging Face 风格的 BPE tokenizer 资产。
 */
export function convertTikTokenToTokenizerAsset({
  modelText,
  pattern = DEFAULT_TIKTOKEN_PATTERN,
  longTextEncoding = null,
  tokenizerConfig = {},
}: ConvertTikTokenToTokenizerAssetOptions): TokenizerAsset {
  const entries = parseTikTokenModel(modelText)
  const ranks = new Map(entries.map((entry) => [toBytesKey(entry.bytes), entry.rank]))
  const vocab: Record<string, number> = {}
  const mergesWithRanks: Array<[string, string, number]> = []

  for (const entry of entries) {
    const tokenKey = toBytesKey(entry.bytes)
    vocab[tokenBytesToString(entry.bytes)] = entry.rank

    if (entry.bytes.length <= 1) {
      continue
    }

    const localMerges: Array<[string, string, number]> = []

    for (let index = 1; index < entry.bytes.length; index += 1) {
      const left = entry.bytes.subarray(0, index)
      const right = entry.bytes.subarray(index)
      const leftKey = toBytesKey(left)
      const rightKey = toBytesKey(right)

      if (ranks.has(leftKey) && ranks.has(rightKey) && ranks.has(tokenKey)) {
        localMerges.push([leftKey, rightKey, entry.rank])
      }
    }

    localMerges.sort((leftMerge, rightMerge) => {
      const leftLeftRank = ranks.get(leftMerge[0]) ?? Number.POSITIVE_INFINITY
      const leftRightRank = ranks.get(leftMerge[1]) ?? Number.POSITIVE_INFINITY
      const rightLeftRank = ranks.get(rightMerge[0]) ?? Number.POSITIVE_INFINITY
      const rightRightRank = ranks.get(rightMerge[1]) ?? Number.POSITIVE_INFINITY

      return leftLeftRank - rightLeftRank || leftRightRank - rightRightRank
    })

    mergesWithRanks.push(...localMerges)
  }

  mergesWithRanks.sort((leftMerge, rightMerge) => leftMerge[2] - rightMerge[2])

  return {
    version: "1.0",
    normalizer: null,
    pre_tokenizer: {
      type: "Sequence",
      pretokenizers: [
        {
          type: "Split",
          pattern: {
            Regex: pattern,
          },
          behavior: "Isolated",
          invert: false,
        },
        {
          type: "ByteLevel",
          add_prefix_space: tokenizerConfig.add_prefix_space ?? false,
          trim_offsets: true,
          use_regex: false,
        },
      ],
    },
    post_processor: {
      type: "ByteLevel",
      add_prefix_space: true,
      trim_offsets: false,
      use_regex: true,
    },
    decoder: {
      type: "ByteLevel",
      add_prefix_space: true,
      trim_offsets: true,
      use_regex: true,
    },
    added_tokens: normalizeAddedTokens(tokenizerConfig.added_tokens_decoder),
    longTextEncoding,
    model: {
      type: "BPE",
      vocab,
      merges: mergesWithRanks.map(
        ([leftKey, rightKey]): [string, string] => [
          tokenBytesToString(fromBytesKey(leftKey)),
          tokenBytesToString(fromBytesKey(rightKey)),
        ]
      ),
      unk_token: null,
      byte_fallback: false,
      ignore_merges: true,
    },
  }
}

/**
 * 解析 tiktoken.model 文本表。
 * 输入：形如 `base64 rank` 的多行文本。
 * 输出：按 rank 排序的 token 条目数组。
 */
function parseTikTokenModel(modelText: string): TikTokenModelEntry[] {
  const entries: TikTokenModelEntry[] = []

  for (const rawLine of modelText.split(/\r?\n/u)) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    const [tokenBase64, rankText, ...rest] = line.split(/\s+/u)
    if (!tokenBase64 || !rankText || rest.length > 0) {
      throw new Error(`Invalid tiktoken.model line: ${rawLine}`)
    }

    const bytes = Buffer.from(tokenBase64, "base64")
    const rank = Number.parseInt(rankText, 10)

    if (!Number.isInteger(rank)) {
      throw new Error(`Invalid tiktoken rank: ${rankText}`)
    }

    entries.push({
      bytes,
      rank,
    })
  }

  entries.sort((left, right) => left.rank - right.rank)
  return entries
}

/**
 * 规范化 tokenizer_config 里的 added_tokens_decoder。
 * 输入：以 token id 为 key 的 added token 记录。
 * 输出：当前 runtime 需要的 added_tokens 数组。
 */
function normalizeAddedTokens(
  addedTokensDecoder: TikTokenTokenizerConfig["added_tokens_decoder"]
): AddedTokenConfig[] {
  if (!addedTokensDecoder) {
    return []
  }

  return Object.entries(addedTokensDecoder)
    .map(([idText, token]) => ({
      id: Number.parseInt(idText, 10),
      content: token.content,
      single_word: token.single_word ?? false,
      lstrip: token.lstrip ?? false,
      rstrip: token.rstrip ?? false,
      normalized: token.normalized ?? false,
      special: token.special ?? false,
    }))
    .sort((left, right) => left.id - right.id)
}

/**
 * 把原始字节序列转成当前项目内部可比较的稳定 key。
 * 输入：任意 token 原始字节序列。
 * 输出：latin-1 视图字符串。
 */
function toBytesKey(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("latin1")
}

/**
 * 把内部 bytes key 还原回原始字节序列。
 * 输入：latin-1 视图字符串。
 * 输出：原始 token 字节序列。
 */
function fromBytesKey(value: string): Buffer {
  return Buffer.from(value, "latin1")
}

/**
 * 把原始 token 字节序列映射成 ByteLevel 可见字符串。
 * 输入：原始 token 字节序列。
 * 输出：与 Hugging Face TikTokenConverter 对齐的 token 字符串。
 */
function tokenBytesToString(bytes: Uint8Array): string {
  let result = ""

  for (const byte of bytes) {
    result += BYTE_TO_UNICODE[byte]
  }

  return result
}
