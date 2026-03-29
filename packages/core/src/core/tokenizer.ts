/**
 * Tokenizer 入口实现。
 * 输入：规范化后的 tokenizer 资产。
 * 输出：提供 encode / decode / token 查询能力的实例。
 */

import { BpeModel } from "./bpe.js"
import { SpecialTokenMatcher } from "./special-tokens.js"
import { createDecoder } from "../hf/decoders.js"
import { createNormalizer } from "../hf/normalizers.js"
import { createPretokenizer } from "../hf/pretokenizers.js"
import type {
  DecodeOptions,
  EncodeOptions,
  NormalizedTokenizerAsset,
} from "../types.js"

/** encode 热路径复用的空 special token 集合。 */
const EMPTY_SPECIAL_SET = new Set<string>()

/**
 * 通用 Tokenizer。
 * 输入：规范化后的 tokenizer 资产。
 * 输出：可复用的 encode / decode API。
 */
export class Tokenizer {
  private readonly model: BpeModel
  private readonly normalizer
  private readonly pretokenizer
  private readonly decoder
  private readonly tokenToId = new Map<string, number>()
  private readonly idToToken = new Map<number, string>()
  private readonly specialTokens: string[]
  private readonly specialTokenSet: Set<string>
  private readonly nonNormalizedAddedTokenMatcher: SpecialTokenMatcher | null
  private readonly normalizedAddedTokenMatcher: SpecialTokenMatcher | null

  /**
   * 构造 Tokenizer。
   * 输入：规范化后的 tokenizer 资产。
   * 输出：内部模型、预分词器、解码器和特殊 token 匹配器被建立。
   */
  constructor(asset: NormalizedTokenizerAsset) {
    this.model = new BpeModel(asset.model)
    this.normalizer = createNormalizer(asset.normalizer)
    this.pretokenizer = createPretokenizer(asset.preTokenizer)
    this.decoder = createDecoder(asset.decoder)

    for (const token of asset.addedTokens) {
      this.tokenToId.set(token.content, token.id)
      this.idToToken.set(token.id, token.content)
    }

    this.specialTokens = asset.addedTokens
      .filter((token) => token.special)
      .map((token) => token.content)
    this.specialTokenSet = new Set(this.specialTokens)
    this.nonNormalizedAddedTokenMatcher = createAddedTokenMatcher(
      asset.addedTokens.filter((token) => !token.normalized)
    )
    this.normalizedAddedTokenMatcher = createAddedTokenMatcher(
      asset.addedTokens.filter((token) => token.normalized)
    )

    this.decoder.setSpecialTokens?.(this.specialTokens)
  }

  /**
   * 编码文本。
   * 输入：原始文本和编码选项。
   * 输出：token id 数组。
   */
  encode(text: string, options: EncodeOptions = {}): number[] {
    const hasExplicitSpecialAllowlist =
      options.allowedSpecial !== undefined && options.allowedSpecial !== "all"
    const allowedSpecialSet = this.resolveSpecialSet(options.allowedSpecial)
    const disallowedSpecialSet = this.resolveSpecialSet(options.disallowedSpecial)
    const normalizedText = this.normalizer.normalize(text)

    for (const token of disallowedSpecialSet) {
      if (text.includes(token) || normalizedText.includes(token)) {
        throw new Error(`Disallowed special token found: ${token}`)
      }
    }

    const ids: number[] = []

    if (!this.nonNormalizedAddedTokenMatcher && !this.normalizedAddedTokenMatcher) {
      this.appendOrdinaryIds(text, ids, 0)
      return ids
    }

    const state = { sectionIndex: 0 }
    const emitAddedToken = (value: string, tokenContent: string, tokenId: number, special: boolean) => {
      if (!special) {
        ids.push(tokenId)
        state.sectionIndex += 1
        return true
      }

      if (!hasExplicitSpecialAllowlist || allowedSpecialSet.has(tokenContent)) {
        ids.push(tokenId)
        state.sectionIndex += 1
        return true
      }

      return false
    }

    const appendNormalizedOrdinaryIds = (value: string) => {
      if (value.length === 0) {
        return
      }

      this.appendNormalizedOrdinaryIds(value, ids, state.sectionIndex)
      state.sectionIndex += 1
    }

    const processNormalizedText = (value: string) => {
      if (value.length === 0) {
        return
      }

      if (!this.normalizedAddedTokenMatcher) {
        appendNormalizedOrdinaryIds(value)
        return
      }

      this.normalizedAddedTokenMatcher.visit(value, {
        onText: (segment) => {
          appendNormalizedOrdinaryIds(segment)
        },
        onAdded: (segment, token) => {
          if (emitAddedToken(segment, token.content, token.id, Boolean(token.special))) {
            return
          }

          appendNormalizedOrdinaryIds(segment)
        },
      })
    }

    const processRawText = (value: string) => {
      if (value.length === 0) {
        return
      }

      processNormalizedText(this.normalizer.normalize(value))
    }

    if (!this.nonNormalizedAddedTokenMatcher) {
      processRawText(text)
      return ids
    }

    this.nonNormalizedAddedTokenMatcher.visit(text, {
      onText: (value) => {
        processRawText(value)
      },
      onAdded: (value, token) => {
        if (emitAddedToken(value, token.content, token.id, Boolean(token.special))) {
          return
        }

        processRawText(value)
      },
    })

    return ids
  }

  /**
   * 解码 token id。
   * 输入：token id 数组和解码选项。
   * 输出：还原后的文本。
   */
  decode(ids: number[], options: DecodeOptions = {}): string {
    const skipSpecialTokens = options.skipSpecialTokens ?? false
    const tokens: string[] = []

    for (const id of ids) {
      const specialToken = this.idToToken.get(id)
      if (specialToken !== undefined) {
        if (!skipSpecialTokens) {
          tokens.push(specialToken)
        }
        continue
      }

      const token = this.model.getToken(id)
      if (token !== undefined) {
        tokens.push(token)
      }
    }

    return this.decoder.decode(tokens)
  }

  /**
   * 通过 id 查 token。
   * 输入：token id。
   * 输出：token 字符串或 undefined。
   */
  idToTokenValue(id: number): string | undefined {
    return this.idToToken.get(id) ?? this.model.getToken(id)
  }

  /**
   * 通过 token 查 id。
   * 输入：token 字符串。
   * 输出：token id 或 undefined。
   */
  tokenToIdValue(token: string): number | undefined {
    return this.tokenToId.get(token) ?? this.model.getTokenId(token)
  }

  /**
   * 获取词汇表大小。
   * 输入：无。
   * 输出：模型词汇表大小。
   */
  get vocabSize(): number {
    return this.model.vocabSize
  }

  /**
   * 获取特殊 token 列表。
   * 输入：无。
   * 输出：特殊 token 字符串数组。
   */
  get specialTokenList(): string[] {
    return [...this.specialTokens]
  }

  /**
   * 清空内部 BPE cache。
   * 输入：无。
   * 输出：当前 Tokenizer 的内部热缓存被清空。
   */
  clearCache(): void {
    this.model.clearCache()
  }

  /**
   * 编码不含特殊 token 的普通文本。
   * 输入：普通文本。
   * 输出：token id 数组。
   */
  private appendOrdinaryIds(text: string, target: number[], sectionIndex: number): void {
    if (text.length === 0) {
      return
    }

    this.appendNormalizedOrdinaryIds(this.normalizer.normalize(text), target, sectionIndex)
  }

  /**
   * 编码已经完成 normalizer 处理的普通文本。
   * 输入：规范化文本、目标数组和所在 section 索引。
   * 输出：对应 token id 数组被直接追加到目标数组。
   */
  private appendNormalizedOrdinaryIds(
    text: string,
    target: number[],
    sectionIndex: number
  ): void {
    if (text.length === 0) {
      return
    }

    const pieces = this.pretokenizer.preTokenize(text, {
      sectionIndex,
    })
    this.model.appendEncodedPieces(pieces, target)
  }

  /**
   * 解析特殊 token 允许/禁止列表。
   * 输入：字符串数组或 `"all"`。
   * 输出：统一的 Set 结构。
   */
  private resolveSpecialSet(value: string[] | "all" | undefined): Set<string> {
    if (value === "all") {
      return this.specialTokenSet
    }

    if (!value || value.length === 0) {
      return EMPTY_SPECIAL_SET
    }

    return new Set(value)
  }
}

/**
 * 为给定 added token 列表创建匹配器。
 * 输入：added token 列表。
 * 输出：非空时返回匹配器，否则返回 null。
 */
function createAddedTokenMatcher(tokens: NormalizedTokenizerAsset["addedTokens"]): SpecialTokenMatcher | null {
  return tokens.length > 0 ? new SpecialTokenMatcher(tokens) : null
}
