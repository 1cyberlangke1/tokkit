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
  LongTextEncodingConfig,
  NormalizedTokenizerAsset,
} from "../types.js"

/** encode 热路径复用的空 special token 集合。 */
const EMPTY_SPECIAL_SET = new Set<string>()

/** 单个字符是否为空白。 */
const WHITESPACE_CHARACTER_PATTERN = /^\s$/u

/** 解析后的 encode 选项。 */
interface ResolvedEncodeOptions {
  hasExplicitSpecialAllowlist: boolean
  allowedSpecialSet: Set<string>
  disallowedSpecialSet: Set<string>
}

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
  private readonly longTextEncoding: LongTextEncodingConfig | null

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
    this.longTextEncoding = asset.longTextEncoding ?? null

    this.decoder.setSpecialTokens?.(this.specialTokens)
  }

  /**
   * 编码文本。
   * 输入：原始文本和编码选项。
   * 输出：token id 数组。
   */
  encode(text: string, options: EncodeOptions = {}): number[] {
    const ids: number[] = []
    const resolvedOptions = this.resolveEncodeOptions(options)
    const chunks = splitTextForLongTextEncoding(text, this.longTextEncoding)

    for (const chunk of chunks) {
      this.appendEncodedText(chunk, ids, resolvedOptions)
    }

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
   * 把单段原始文本按当前 encode 选项编码进目标数组。
   * 输入：原始文本、目标数组和解析后的 encode 选项。
   * 输出：token id 被原地追加到目标数组。
   */
  private appendEncodedText(
    text: string,
    ids: number[],
    {
      hasExplicitSpecialAllowlist,
      allowedSpecialSet,
      disallowedSpecialSet,
    }: ResolvedEncodeOptions
  ): void {
    const normalizedText = this.normalizer.normalize(text)

    for (const token of disallowedSpecialSet) {
      if (text.includes(token) || normalizedText.includes(token)) {
        throw new Error(`Disallowed special token found: ${token}`)
      }
    }

    if (!this.nonNormalizedAddedTokenMatcher && !this.normalizedAddedTokenMatcher) {
      this.appendOrdinaryIds(text, ids, 0)
      return
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

      const sectionText = normalizedSectionStartPending
        ? this.normalizer.normalizeSectionStart(value)
        : value

      this.appendNormalizedOrdinaryIds(sectionText, ids, state.sectionIndex)
      state.sectionIndex += 1
      normalizedSectionStartPending = false
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
            normalizedSectionStartPending = true
            return
          }

          appendNormalizedOrdinaryIds(segment)
        },
      })
    }

    let normalizedSectionStartPending = false

    const processRawText = (value: string) => {
      if (value.length === 0) {
        return
      }

      processNormalizedText(this.normalizer.normalize(value))
    }

    if (!this.nonNormalizedAddedTokenMatcher) {
      processRawText(text)
      return
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

  /**
   * 解析 encode 选项里的 special token 允许/禁止集合。
   * 输入：原始 encode 选项。
   * 输出：热路径可复用的解析结果。
   */
  private resolveEncodeOptions(options: EncodeOptions): ResolvedEncodeOptions {
    return {
      hasExplicitSpecialAllowlist:
        options.allowedSpecial !== undefined && options.allowedSpecial !== "all",
      allowedSpecialSet: this.resolveSpecialSet(options.allowedSpecial),
      disallowedSpecialSet: this.resolveSpecialSet(options.disallowedSpecial),
    }
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

/**
 * 按上游包装器语义拆分超长文本。
 * 输入：原始文本与可选的长文本编码配置。
 * 输出：可逐段独立编码的文本切片列表。
 */
function splitTextForLongTextEncoding(
  text: string,
  config: LongTextEncodingConfig | null
): string[] {
  if (!config || text.length === 0) {
    return [text]
  }

  const windows = splitByCodePointLength(text, config.maxEncodeChars)
  const chunks: string[] = []

  for (const window of windows) {
    chunks.push(...splitWhitespacesOrNonwhitespaces(window, config.maxConsecutiveSliceLen))
  }

  return chunks.length > 0 ? chunks : [text]
}

/**
 * 按最多 code point 数量切分字符串。
 * 输入：原始文本和单段最大长度。
 * 输出：按上限顺序切出的字符串窗口。
 */
function splitByCodePointLength(text: string, maxLength: number): string[] {
  const chunks: string[] = []
  let start = 0
  let codePointCount = 0
  let index = 0

  for (const character of text) {
    if (codePointCount >= maxLength) {
      chunks.push(text.slice(start, index))
      start = index
      codePointCount = 0
    }

    index += character.length
    codePointCount += 1
  }

  chunks.push(text.slice(start))
  return chunks.filter((chunk) => chunk.length > 0)
}

/**
 * 按连续空白 / 非空白 run 上限切分字符串。
 * 输入：单个窗口文本和单类字符最大连续长度。
 * 输出：符合上游 `_split_whitespaces_or_nonwhitespaces` 语义的切片数组。
 */
function splitWhitespacesOrNonwhitespaces(text: string, maxConsecutiveSliceLen: number): string[] {
  if (text.length === 0) {
    return []
  }

  const result: string[] = []
  let currentSliceLen = 0
  let currentSliceIsSpace = false
  let sliceStart = 0
  let index = 0
  let firstCharacter = true

  for (const character of text) {
    const isNowSpace = WHITESPACE_CHARACTER_PATTERN.test(character)

    if (firstCharacter) {
      currentSliceLen = 1
      currentSliceIsSpace = isNowSpace
      firstCharacter = false
      index += character.length
      continue
    }

    if (currentSliceIsSpace !== isNowSpace) {
      currentSliceLen = 1
      currentSliceIsSpace = isNowSpace
    } else {
      currentSliceLen += 1
      if (currentSliceLen > maxConsecutiveSliceLen) {
        result.push(text.slice(sliceStart, index))
        sliceStart = index
        currentSliceLen = 1
      }
    }

    index += character.length
  }

  result.push(text.slice(sliceStart))
  return result
}
