/**
 * Hugging Face 风格的预分词器实现。
 * 输入：pre_tokenizer 配置和原始文本。
 * 输出：供 BPE 模型消费的预分词片段数组。
 */

import { encodeTextToByteLevel } from "../core/bytes.js"

/** Unicode 标点判定正则。 */
const UNICODE_PUNCTUATION_PATTERN = /^\p{P}$/u

/** 预分词调用时携带的上下文。 */
interface PretokenizerContext {
  sectionIndex?: number
}

/** 统一的预分词器接口。 */
export interface Pretokenizer {
  preTokenize(text: string, context?: PretokenizerContext): string[]
}

/** 不做任何处理的预分词器。 */
class IdentityPretokenizer implements Pretokenizer {
  /**
   * 输入：原始文本。
   * 输出：只返回单个原始片段。
   */
  preTokenize(text: string): string[] {
    return [text]
  }
}

/** Hugging Face Split 预分词器。 */
class SplitPretokenizer implements Pretokenizer {
  private readonly config: Record<string, unknown>
  private readonly pattern: RegExp | null

  /**
   * 构造 Split 预分词器。
   * 输入：Split 配置。
   * 输出：可复用的切分实例。
   */
  constructor(config: Record<string, unknown>) {
    this.config = config
    this.pattern = createPattern(
      (config.pattern as Record<string, unknown> | undefined) ?? null,
      Boolean(config.invert)
    )
  }

  /**
   * 输入：原始文本。
   * 输出：按照模式切分后的片段数组。
   */
  preTokenize(text: string): string[] {
    if (!this.pattern) {
      return []
    }

    if (this.config.invert) {
      return text.match(this.pattern) ?? []
    }

    if (String(this.config.behavior ?? "").toLowerCase() === "removed") {
      return text.split(this.pattern).filter(Boolean)
    }

    return regexSplit(text, this.pattern)
  }
}

/** Hugging Face ByteLevel 预分词器。 */
class ByteLevelPretokenizer implements Pretokenizer {
  private readonly addPrefixSpace: boolean
  private readonly useRegex: boolean
  private readonly pattern =
    /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu

  /**
   * 构造 ByteLevel 预分词器。
   * 输入：ByteLevel 配置。
   * 输出：可复用的 ByteLevel 实例。
   */
  constructor(config: Record<string, unknown>) {
    this.addPrefixSpace = Boolean(config.add_prefix_space)
    this.useRegex = config.use_regex === undefined ? true : Boolean(config.use_regex)
  }

  /**
   * 输入：原始文本。
   * 输出：映射成 ByteLevel 可见字符的片段数组。
   */
  preTokenize(text: string, context: PretokenizerContext = {}): string[] {
    let value = text
    const sectionIndex = context.sectionIndex
    const isFirstSection = sectionIndex === undefined || sectionIndex === 0

    if (this.addPrefixSpace && isFirstSection && !value.startsWith(" ")) {
      value = ` ${value}`
    }

    if (!this.useRegex) {
      return [encodeTextToByteLevel(value)]
    }

    const tokens = value.match(this.pattern)
    if (!tokens) {
      return []
    }

    for (let index = 0; index < tokens.length; index += 1) {
      tokens[index] = encodeTextToByteLevel(tokens[index])
    }

    return tokens
  }
}

/** Hugging Face Punctuation 预分词器。 */
class PunctuationPretokenizer implements Pretokenizer {
  private readonly behavior: string

  /**
   * 构造 Punctuation 预分词器。
   * 输入：Punctuation 配置。
   * 输出：可复用的标点切分实例。
   */
  constructor(config: Record<string, unknown>) {
    this.behavior = String(config.behavior ?? "Isolated")
  }

  /**
   * 输入：原始文本。
   * 输出：按标点边界切分后的片段数组。
   */
  preTokenize(text: string): string[] {
    return splitByCharPredicate(text, isPunctuationCharacter, this.behavior)
  }
}

/** Hugging Face Digits 预分词器。 */
class DigitsPretokenizer implements Pretokenizer {
  private readonly individualDigits: boolean

  /**
   * 构造 Digits 预分词器。
   * 输入：Digits 配置。
   * 输出：可复用的数字切分实例。
   */
  constructor(config: Record<string, unknown>) {
    this.individualDigits = Boolean(config.individual_digits)
  }

  /**
   * 输入：原始文本。
   * 输出：按数字块或单个数字切分后的片段数组。
   */
  preTokenize(text: string): string[] {
    return splitByCharPredicate(
      text,
      isDigitCharacter,
      this.individualDigits ? "Isolated" : "Contiguous"
    )
  }
}

/** Hugging Face Metaspace 预分词器。 */
class MetaspacePretokenizer implements Pretokenizer {
  private readonly replacement: string
  private readonly strRep: string
  private readonly prependScheme: string
  private readonly split: boolean

  /**
   * 构造 Metaspace 预分词器。
   * 输入：Metaspace 配置。
   * 输出：可复用的 Metaspace 实例。
   */
  constructor(config: Record<string, unknown>) {
    this.replacement = String(config.replacement ?? "▁")
    this.strRep = String(config.str_rep ?? this.replacement)
    this.prependScheme = String(config.prepend_scheme ?? "always")
    this.split = config.split === undefined ? true : Boolean(config.split)
  }

  /**
   * 输入：原始文本和 section 上下文。
   * 输出：替换空格并按 prepend 规则处理后的片段数组。
   */
  preTokenize(text: string, context: PretokenizerContext = {}): string[] {
    let normalized = text.replaceAll(" ", this.strRep)
    const sectionIndex = context.sectionIndex
    const isFirstSection = sectionIndex === undefined || sectionIndex === 0

    if (
      !normalized.startsWith(this.replacement) &&
      (this.prependScheme === "always" ||
        (this.prependScheme === "first" && isFirstSection))
    ) {
      normalized = this.strRep + normalized
    }

    if (!this.split) {
      return [normalized]
    }

    return splitMetaspace(normalized, this.replacement)
  }
}

/** 顺序组合多个预分词器。 */
class SequencePretokenizer implements Pretokenizer {
  private readonly pretokenizers: Pretokenizer[]

  /**
   * 构造 Sequence 预分词器。
   * 输入：一组子预分词器。
   * 输出：按顺序执行的组合实例。
   */
  constructor(pretokenizers: Pretokenizer[]) {
    this.pretokenizers = pretokenizers
  }

  /**
   * 输入：原始文本。
   * 输出：依次经过各子预分词器后的片段数组。
   */
  preTokenize(text: string, context: PretokenizerContext = {}): string[] {
    let sections = [
      {
        value: text,
        isFirstSection: context.sectionIndex === undefined || context.sectionIndex === 0,
      },
    ]

    for (const pretokenizer of this.pretokenizers) {
      const nextSections: Array<{ value: string; isFirstSection: boolean }> = []

      for (let index = 0; index < sections.length; index += 1) {
        const childSections = pretokenizer.preTokenize(sections[index].value, {
          sectionIndex: sections[index].isFirstSection ? 0 : 1,
        })

        for (let childIndex = 0; childIndex < childSections.length; childIndex += 1) {
          nextSections.push({
            value: childSections[childIndex],
            isFirstSection: sections[index].isFirstSection && childIndex === 0,
          })
        }
      }

      sections = nextSections
    }

    return sections.map((section) => section.value)
  }
}

/**
 * 根据 HF 配置创建预分词器。
 * 输入：pre_tokenizer 配置。
 * 输出：对应的 Pretokenizer 实例。
 */
export function createPretokenizer(
  config: Record<string, unknown> | null | undefined
): Pretokenizer {
  if (!config) {
    return new IdentityPretokenizer()
  }

  switch (config.type) {
    case "Split":
      return new SplitPretokenizer(config)
    case "Punctuation":
      return new PunctuationPretokenizer(config)
    case "Digits":
      return new DigitsPretokenizer(config)
    case "ByteLevel":
      return new ByteLevelPretokenizer(config)
    case "Metaspace":
      return new MetaspacePretokenizer(config)
    case "Sequence":
      return new SequencePretokenizer(
        ((config.pretokenizers as Record<string, unknown>[] | undefined) ?? []).map((entry) =>
          createPretokenizer(entry)
        )
      )
    default:
      return new IdentityPretokenizer()
  }
}

/**
 * 构建 JS 兼容的正则。
 * 输入：HF pattern 配置和 invert 标志。
 * 输出：可直接复用的 RegExp，无法解析时返回 null。
 */
function createPattern(
  pattern: Record<string, unknown> | null,
  invert: boolean
): RegExp | null {
  if (!pattern) {
    return null
  }

  if (pattern.Regex !== undefined) {
    let regex = String(pattern.Regex)
      .replace(/\\([#&~])/g, "$1")
    regex = expandInlineCaseInsensitiveGroups(regex)
    regex = normalizeUnsupportedPossessiveQuantifiers(regex)

    regex = regex.replace(/\\p\{/g, "\\p{").replace(/\\P\{/g, "\\P{")
    return new RegExp(regex, "gu")
  }

  if (pattern.String !== undefined) {
    const literal = escapeRegExp(String(pattern.String))
    return new RegExp(invert ? literal : `(${literal})`, "gu")
  }

  return null
}

/**
 * 像 HF 一样 split 但保留分隔片段。
 * 输入：文本与切分正则。
 * 输出：保留分隔片段的切分结果。
 */
function regexSplit(text: string, regex: RegExp): string[] {
  const result: string[] = []
  let previous = 0

  for (const match of text.matchAll(regex)) {
    const fullMatch = match[0]
    const index = match.index ?? 0

    if (previous < index) {
      result.push(text.slice(previous, index))
    }

    if (fullMatch.length > 0) {
      result.push(fullMatch)
    }

    previous = index + fullMatch.length
  }

  if (previous < text.length) {
    result.push(text.slice(previous))
  }

  return result
}

/**
 * 按 Hugging Face Metaspace 规则切分 replacement 片段。
 * 输入：替换空格后的文本与 replacement 字符。
 * 输出：每个片段都把 replacement 合并到右侧 token。
 */
function splitMetaspace(text: string, replacement: string): string[] {
  if (text.length === 0) {
    return []
  }

  const parts: string[] = []
  let start = 0

  for (let index = replacement.length; index < text.length; index += 1) {
    if (text[index] !== replacement) {
      continue
    }

    parts.push(text.slice(start, index))
    start = index
  }

  parts.push(text.slice(start))
  return parts.filter((part) => part.length > 0)
}

/**
 * 转义字符串中的正则元字符。
 * 输入：普通字符串。
 * 输出：可安全放入 RegExp 的字符串。
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * 把 Rust regex 的 possessive quantifier 降级成 JS 可解析的 greedy quantifier。
 * 输入：原始 regex 字符串。
 * 输出：去掉 JS 不支持的 possessive `+` 修饰后的模式字符串。
 */
function normalizeUnsupportedPossessiveQuantifiers(pattern: string): string {
  let result = ""
  let index = 0
  let previousTokenWasQuantifier = false

  while (index < pattern.length) {
    const character = pattern[index]

    if (character === "\\") {
      if (
        (pattern[index + 1] === "p" || pattern[index + 1] === "P") &&
        pattern[index + 2] === "{"
      ) {
        const end = pattern.indexOf("}", index + 3)
        if (end !== -1) {
          result += pattern.slice(index, end + 1)
          index = end + 1
          previousTokenWasQuantifier = false
          continue
        }
      }

      const end = Math.min(index + 2, pattern.length)
      result += pattern.slice(index, end)
      index = end
      previousTokenWasQuantifier = false
      continue
    }

    if (character === "[") {
      const end = findCharacterClassEnd(pattern, index)
      result += pattern.slice(index, end + 1)
      index = end + 1
      previousTokenWasQuantifier = false
      continue
    }

    if (character === "{") {
      const end = pattern.indexOf("}", index + 1)
      if (end !== -1) {
        const body = pattern.slice(index + 1, end)
        if (/^\d+(,\d*)?$|^,\d+$/u.test(body)) {
          result += pattern.slice(index, end + 1)
          index = end + 1
          previousTokenWasQuantifier = true
          continue
        }
      }
    }

    if (character === "+" && previousTokenWasQuantifier) {
      index += 1
      continue
    }

    result += character
    previousTokenWasQuantifier = character === "?" || character === "*" || character === "+"
    index += 1
  }

  return result
}

/**
 * 判断字符是否属于 Unicode 标点。
 * 输入：单个字符。
 * 输出：标点返回 true，否则返回 false。
 */
function isPunctuationCharacter(character: string): boolean {
  return isAsciiPunctuation(character) || UNICODE_PUNCTUATION_PATTERN.test(character)
}

/**
 * 判断字符是否是数字。
 * 输入：单个字符。
 * 输出：ASCII digit 返回 true，否则返回 false。
 */
function isDigitCharacter(character: string): boolean {
  return /^[0-9]$/u.test(character)
}

/**
 * 判断字符是否属于 ASCII punctuation。
 * 输入：单个字符。
 * 输出：ASCII 标点返回 true，否则返回 false。
 */
function isAsciiPunctuation(character: string): boolean {
  if (character.length !== 1) {
    return false
  }

  const code = character.charCodeAt(0)
  return (
    (code >= 33 && code <= 47) ||
    (code >= 58 && code <= 64) ||
    (code >= 91 && code <= 96) ||
    (code >= 123 && code <= 126)
  )
}

/**
 * 找到字符类的结束位置。
 * 输入：regex 字符串与 `[` 的起始下标。
 * 输出：对应 `]` 的下标；若不存在则返回原始下标。
 */
function findCharacterClassEnd(pattern: string, start: number): number {
  for (let index = start + 1; index < pattern.length; index += 1) {
    if (pattern[index] === "\\") {
      index += 1
      continue
    }

    if (pattern[index] === "]") {
      return index
    }
  }

  return start
}

/**
 * 把 `(?i:...)` 这类局部大小写不敏感分组展开成 JS 可执行的等价模式。
 * 输入：原始 regex 字符串。
 * 输出：展开后的 regex 字符串。
 */
function expandInlineCaseInsensitiveGroups(pattern: string): string {
  return pattern.replace(/\(\?i:((?:\\.|[^()])*)\)/g, (_match, group: string) => {
    return `(?:${expandAsciiCaseInsensitiveLiterals(group)})`
  })
}

/**
 * 把 ASCII 字母展开成局部大小写不敏感字符类。
 * 输入：`(?i:...)` 内部的字面量模式。
 * 输出：只对 ASCII 字母扩展后的模式字符串。
 */
function expandAsciiCaseInsensitiveLiterals(pattern: string): string {
  let result = ""
  let inCharacterClass = false

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]

    if (character === "\\") {
      result += character
      if (index + 1 < pattern.length) {
        result += pattern[index + 1]
        index += 1
      }
      continue
    }

    if (character === "[") {
      inCharacterClass = true
      result += character
      continue
    }

    if (character === "]" && inCharacterClass) {
      inCharacterClass = false
      result += character
      continue
    }

    if (/^[A-Za-z]$/.test(character)) {
      const lower = character.toLowerCase()
      const upper = character.toUpperCase()
      if (lower === upper) {
        result += character
        continue
      }

      if (inCharacterClass) {
        const previous = pattern[index - 1]
        const next = pattern[index + 1]
        result += previous === "-" || next === "-" ? character : `${lower}${upper}`
        continue
      }

      result += `[${lower}${upper}]`
      continue
    }

    result += character
  }

  return result
}

/**
 * 按字符谓词与 HF split behavior 切分文本。
 * 输入：原始文本、字符匹配函数和行为配置。
 * 输出：与 Hugging Face Digits / Punctuation 兼容的片段数组。
 */
function splitByCharPredicate(
  text: string,
  predicate: (character: string) => boolean,
  behavior: string
): string[] {
  if (text.length === 0) {
    return []
  }

  const normalizedBehavior = behavior.toLowerCase()
  const result: string[] = []
  let current = ""
  let currentMatches = predicate(text[0] ?? "")

  for (const character of text) {
    const matches = predicate(character)
    if (current.length === 0) {
      current = character
      currentMatches = matches
      continue
    }

    if (
      matches === currentMatches &&
      (!matches || normalizedBehavior === "contiguous")
    ) {
      current += character
      continue
    }

    pushPredicateSplit(result, current, currentMatches, normalizedBehavior)
    current = character
    currentMatches = matches
  }

  pushPredicateSplit(result, current, currentMatches, normalizedBehavior)
  return result
}

/**
 * 把当前分段按 behavior 写入结果数组。
 * 输入：结果数组、当前分段、是否命中谓词和 behavior。
 * 输出：结果数组被原地更新。
 */
function pushPredicateSplit(
  target: string[],
  value: string,
  matches: boolean,
  behavior: string
): void {
  if (value.length === 0) {
    return
  }

  if (!matches || behavior === "contiguous") {
    target.push(value)
    return
  }

  if (behavior === "removed") {
    if (!matches) {
      target.push(value)
    }
    return
  }

  for (const character of value) {
    target.push(character)
  }
}
