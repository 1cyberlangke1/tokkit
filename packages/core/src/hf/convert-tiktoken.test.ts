import { describe, expect, it } from "vitest"

import { convertTikTokenToTokenizerAsset as exportedConvertTikTokenToTokenizerAsset } from "../index.js"
import { Tokenizer } from "../core/tokenizer.js"
import { normalizeTokenizerAsset } from "./normalize-asset.js"
import { convertTikTokenToTokenizerAsset } from "./convert-tiktoken.js"

describe("convertTikTokenToTokenizerAsset", () => {
  it("按官方 TikTokenConverter 规则重建 vocab、merges 和 added tokens", () => {
    const asset = convertTikTokenToTokenizerAsset({
      modelText: ["YQ== 0", "Yg== 1", "Yw== 2", "YWI= 3", "YWJj 4"].join("\n"),
      pattern: String.raw`\p{L}+|\s+`,
      tokenizerConfig: {
        added_tokens_decoder: {
          "5": {
            content: "<|special|>",
            lstrip: false,
            normalized: false,
            rstrip: false,
            single_word: false,
            special: true,
          },
        },
      },
    })

    expect(asset.pre_tokenizer).toEqual({
      type: "Sequence",
      pretokenizers: [
        {
          type: "Split",
          pattern: {
            Regex: String.raw`\p{L}+|\s+`,
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
    })
    expect(asset.post_processor).toEqual({
      type: "ByteLevel",
      add_prefix_space: true,
      trim_offsets: false,
      use_regex: true,
    })
    expect(asset.decoder).toEqual({
      type: "ByteLevel",
      add_prefix_space: true,
      trim_offsets: true,
      use_regex: true,
    })
    expect(asset.model).toMatchObject({
      type: "BPE",
      ignore_merges: true,
      vocab: {
        a: 0,
        b: 1,
        c: 2,
        ab: 3,
        abc: 4,
      },
      merges: [
        ["a", "b"],
        ["ab", "c"],
      ],
    })
    expect(asset.added_tokens).toEqual([
      {
        id: 5,
        content: "<|special|>",
        lstrip: false,
        normalized: false,
        rstrip: false,
        single_word: false,
        special: true,
      },
    ])
  })

  it("转换结果可直接被现有 runtime 编码和解码", () => {
    const asset = convertTikTokenToTokenizerAsset({
      modelText: ["YQ== 0", "Yg== 1", "Yw== 2", "YWI= 3", "YWJj 4"].join("\n"),
      pattern: String.raw`\p{L}+|\s+`,
      tokenizerConfig: {
        added_tokens_decoder: {
          "5": {
            content: "<|special|>",
            lstrip: false,
            normalized: false,
            rstrip: false,
            single_word: false,
            special: true,
          },
        },
      },
    })

    const tokenizer = new Tokenizer(normalizeTokenizerAsset(asset))

    expect(tokenizer.encode("abc")).toEqual([4])
    expect(tokenizer.decode([4])).toBe("abc")
    expect(tokenizer.encode("<|special|>abc", { allowedSpecial: "all" })).toEqual([5, 4])
    expect(tokenizer.decode([5, 4])).toBe("<|special|>abc")
  })

  it("通过 core 入口导出转换器", () => {
    expect(exportedConvertTikTokenToTokenizerAsset).toBe(convertTikTokenToTokenizerAsset)
  })

  it("支持把长文本切分配置写进转换结果", () => {
    const asset = convertTikTokenToTokenizerAsset({
      modelText: ["cg== 0", "ZQ== 1", "cmU= 2"].join("\n"),
      longTextEncoding: {
        type: "split-whitespaces-or-nonwhitespaces",
        maxEncodeChars: 400000,
        maxConsecutiveSliceLen: 25000,
      },
    })

    expect(asset.longTextEncoding).toEqual({
      type: "split-whitespaces-or-nonwhitespaces",
      maxEncodeChars: 400000,
      maxConsecutiveSliceLen: 25000,
    })
  })
})
