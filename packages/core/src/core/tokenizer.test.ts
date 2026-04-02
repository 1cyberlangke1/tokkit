/**
 * Tokenizer 长文本切分测试。
 * 输入：带长文本切分配置的最小 tokenizer 资产。
 * 输出：验证 encode 会按配置分块，行为对齐上游包装器。
 */

import { describe, expect, it } from "vitest"
import { Tokenizer } from "./tokenizer.js"
import type { NormalizedTokenizerAsset } from "../types.js"

describe("Tokenizer long text encoding", () => {
  it("会按最大编码窗口切分长文本后分别编码", () => {
    const tokenizer = new Tokenizer(
      createLongTextSplitAsset({
        maxEncodeChars: 1,
        maxConsecutiveSliceLen: 32,
      })
    )

    expect(tokenizer.encode("re", { addSpecialTokens: false })).toEqual([0, 1])
  })

  it("会按连续非空白字符上限继续切分", () => {
    const tokenizer = new Tokenizer(
      createLongTextSplitAsset({
        maxEncodeChars: 32,
        maxConsecutiveSliceLen: 1,
      })
    )

    expect(tokenizer.encode("re", { addSpecialTokens: false })).toEqual([0, 1])
  })
})

/**
 * 构造带长文本切分配置的最小 normalized asset。
 * 输入：切分窗口配置。
 * 输出：能区分整段编码与分块编码结果的 tokenizer 资产。
 */
function createLongTextSplitAsset({
  maxEncodeChars,
  maxConsecutiveSliceLen,
}: {
  maxEncodeChars: number
  maxConsecutiveSliceLen: number
}): NormalizedTokenizerAsset {
  return {
    addedTokens: [],
    normalizer: null,
    preTokenizer: null,
    decoder: null,
    longTextEncoding: {
      type: "split-whitespaces-or-nonwhitespaces",
      maxEncodeChars,
      maxConsecutiveSliceLen,
    },
    model: {
      type: "BPE",
      vocabById: ["r", "e", "re"],
      merges: [["r", "e"]],
      unkToken: null,
      continuingSubwordPrefix: "",
      continuingSubwordSuffix: null,
      endOfWordSuffix: "",
      byteFallback: false,
      ignoreMerges: false,
    },
  }
}
