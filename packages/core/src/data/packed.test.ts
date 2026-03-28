/**
 * packed tokenizer 资产测试。
 * 输入：手工构造的压缩 payload。
 * 输出：验证压缩资产可解包，且 merge id 对能被运行时正确消费。
 */

import { Buffer } from "node:buffer"
import { brotliCompressSync } from "node:zlib"
import { describe, expect, it } from "vitest"
import { Tokenizer } from "../core/tokenizer.js"
import { unpackPackedAsset } from "./packed.js"

describe("packed tokenizer assets", () => {
  it("能解包 brotli 压缩的 normalized asset", () => {
    const packed = createPackedFixture()
    const asset = unpackPackedAsset(packed)

    expect(asset.addedTokens).toEqual([])
    expect(asset.normalizer).toBeNull()
    expect(asset.preTokenizer).toBeNull()
    expect(asset.decoder).toBeNull()
    expect(asset.model.vocabById).toEqual(["a", "b", "ab"])
    expect(asset.model.mergeTokenIdPairs).toEqual([0, 1])
  })

  it("merge token id 对能驱动 BPE 合并", () => {
    const asset = unpackPackedAsset(createPackedFixture())
    const tokenizer = new Tokenizer(asset)

    expect(tokenizer.encode("ab", { addSpecialTokens: false })).toEqual([2])
    expect(tokenizer.decode([2])).toBe("ab")
  })
})

/**
 * 构造最小 packed asset 样例。
 * 输入：无。
 * 输出：可被运行时解包的 base64 + brotli 字符串。
 */
function createPackedFixture(): string {
  const payload = {
    a: [],
    n: null,
    p: null,
    d: null,
    v: ["a", "b", "ab"],
    mi: [0, 1],
    u: null,
    cp: "",
    cs: null,
    ew: "",
    bf: false,
    im: false,
  }

  const json = JSON.stringify(payload)
  const compressed = brotliCompressSync(Buffer.from(json, "utf8"))
  return Buffer.from(compressed).toString("base64")
}
