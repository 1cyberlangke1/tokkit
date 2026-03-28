/**
 * BPE 模型长片段缓存测试。
 * 输入：手工构造的最小 tokenizer 资产与超长单片段文本。
 * 输出：验证重复编码时会建立并清理受控的长片段编码缓存。
 */

import { describe, expect, it } from "vitest"
import { Tokenizer } from "./tokenizer.js"
import type { NormalizedTokenizerAsset } from "../types.js"

describe("BpeModel large piece cache", () => {
  it("会缓存重复超长片段的编码结果", () => {
    const tokenizer = new Tokenizer(createLongPieceAsset())
    const piece = "ab".repeat(200)
    const model = getModelInternals(tokenizer)

    expect(tokenizer.encode(piece, { addSpecialTokens: false })).toHaveLength(200)
    expect(model.largePieceIdCache?.has(piece)).toBe(true)

    expect(tokenizer.encode(piece, { addSpecialTokens: false })).toHaveLength(200)
    expect(model.largePieceIdCache?.size).toBe(1)
  })

  it("clearCache 会清空超长片段缓存", () => {
    const tokenizer = new Tokenizer(createLongPieceAsset())
    const piece = "ab".repeat(200)
    const model = getModelInternals(tokenizer)

    tokenizer.encode(piece, { addSpecialTokens: false })
    expect(model.largePieceIdCache?.size).toBe(1)

    tokenizer.clearCache()
    expect(model.largePieceIdCache?.size).toBe(0)
  })
})

/**
 * 构造一个只覆盖 `ab` 合并的最小 BPE 资产。
 * 输入：无。
 * 输出：可驱动长片段编码的 normalized asset。
 */
function createLongPieceAsset(): NormalizedTokenizerAsset {
  return {
    addedTokens: [],
    normalizer: null,
    preTokenizer: null,
    decoder: null,
    model: {
      type: "BPE",
      vocabById: ["a", "b", "ab"],
      merges: [["a", "b"]],
      unkToken: null,
      continuingSubwordPrefix: "",
      continuingSubwordSuffix: null,
      endOfWordSuffix: "",
      byteFallback: false,
      ignoreMerges: false,
    },
  }
}

/**
 * 读取测试需要的 BPE 内部缓存。
 * 输入：Tokenizer 实例。
 * 输出：带长片段缓存视图的模型内部对象。
 */
function getModelInternals(tokenizer: Tokenizer): {
  largePieceIdCache?: Map<string, number[]>
} {
  return (tokenizer as unknown as { model: { largePieceIdCache?: Map<string, number[]> } }).model
}
