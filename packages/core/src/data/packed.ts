/**
 * packed tokenizer 资产解包工具。
 * 输入：brotli 压缩后再 base64 编码的 normalized tokenizer payload。
 * 输出：运行时可直接消费的 NormalizedTokenizerAsset。
 *
 * 预期行为：
 * - family 模块只保存紧凑字符串，不直接内联巨大的 vocab / merges 对象字面量。
 * - 首次加载某个 family 时再解压，未使用的 family 不占用解包后的内存。
 */

import { Buffer } from "node:buffer"
import { brotliDecompressSync } from "node:zlib"
import type { AddedTokenConfig, NormalizedTokenizerAsset } from "../types.js"

/** packed 后的 normalized asset payload。 */
interface PackedNormalizedTokenizerPayload {
  a?: AddedTokenConfig[]
  n?: Record<string, unknown> | null
  p?: Record<string, unknown> | null
  d?: Record<string, unknown> | null
  v: string[]
  mi?: number[]
  u?: string | null
  cp?: string
  cs?: string | null
  ew?: string
  bf?: boolean
  im?: boolean
}

/**
 * 解包 packed tokenizer 资产。
 * 输入：base64 编码的 brotli payload。
 * 输出：NormalizedTokenizerAsset。
 */
export function unpackPackedAsset(packed: string): NormalizedTokenizerAsset {
  const compressed = Buffer.from(packed, "base64")
  const json = brotliDecompressSync(compressed).toString("utf8")
  const payload = JSON.parse(json) as PackedNormalizedTokenizerPayload

  return {
    addedTokens: payload.a ?? [],
    normalizer: payload.n ?? null,
    preTokenizer: payload.p ?? null,
    decoder: payload.d ?? null,
    model: {
      type: "BPE",
      vocabById: payload.v,
      merges: [],
      mergeTokenIdPairs: payload.mi ?? [],
      unkToken: payload.u ?? null,
      continuingSubwordPrefix: payload.cp ?? "",
      continuingSubwordSuffix: payload.cs ?? null,
      endOfWordSuffix: payload.ew ?? "",
      byteFallback: payload.bf ?? false,
      ignoreMerges: payload.im ?? false,
    },
  }
}
