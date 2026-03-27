/**
 * Hugging Face 风格的预分词器实现。
 * 输入：pre_tokenizer 配置和原始文本。
 * 输出：供 BPE 模型消费的预分词片段数组。
 */

import { encodeTextToByteLevel } from "../core/bytes.js"

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
  preTokenize(text: string): string[] {
    let value = text
    if (this.addPrefixSpace && !value.startsWith(" ")) {
      value = ` ${value}`
    }

    const tokens = this.useRegex ? (value.match(this.pattern) ?? []) : [value]
    return tokens.map((token) => encodeTextToByteLevel(token))
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

    if (
      !normalized.startsWith(this.replacement) &&
      (this.prependScheme === "always" ||
        (this.prependScheme === "first" && sectionIndex === 0))
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
  preTokenize(text: string): string[] {
    let sections = [text]

    for (const pretokenizer of this.pretokenizers) {
      const nextSections: string[] = []
      sections.forEach((section, index) => {
        nextSections.push(...pretokenizer.preTokenize(section, { sectionIndex: index }))
      })
      sections = nextSections
    }

    return sections
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
      .replace(/\(\?i:/g, "(?:")

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
