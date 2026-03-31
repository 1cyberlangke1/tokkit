/**
 * Hugging Face 风格的 normalizer 实现。
 * 输入：normalizer 配置与原始文本。
 * 输出：归一化后的文本。
 */

/** 统一的 normalizer 接口。 */
export interface Normalizer {
  normalize(text: string): string
  normalizeSectionStart(text: string): string
}

/** 不做任何处理的 normalizer。 */
class IdentityNormalizer implements Normalizer {
  /**
   * 输入：原始文本。
   * 输出：原样返回。
   */
  normalize(text: string): string {
    return text
  }

  normalizeSectionStart(text: string): string {
    return text
  }
}

/** 在文本头部添加固定前缀的 normalizer。 */
class PrependNormalizer implements Normalizer {
  private readonly prepend: string

  /**
   * 构造 Prepend normalizer。
   * 输入：Prepend 配置。
   * 输出：可复用的前缀注入器。
   */
  constructor(config: Record<string, unknown>) {
    this.prepend = String(config.prepend ?? "")
  }

  /**
   * 输入：原始文本。
   * 输出：非空文本会被加上固定前缀。
   */
  normalize(text: string): string {
    if (text.length === 0 || this.prepend.length === 0) {
      return text
    }

    return this.prepend + text
  }

  /**
   * 输入：已完成其他常规归一化、但处于新 section 起点的文本。
   * 输出：像 Hugging Face 一样在 added token 边界后重新补前缀。
   */
  normalizeSectionStart(text: string): string {
    return this.normalize(text)
  }
}

/** 执行字面量或正则替换的 normalizer。 */
class ReplaceNormalizer implements Normalizer {
  private readonly pattern: string | RegExp
  private readonly content: string

  /**
   * 构造 Replace normalizer。
   * 输入：Replace 配置。
   * 输出：可复用的替换器。
   */
  constructor(config: Record<string, unknown>) {
    const pattern = (config.pattern as Record<string, unknown> | undefined) ?? {}
    this.pattern =
      pattern.String !== undefined
        ? String(pattern.String)
        : new RegExp(String(pattern.Regex ?? ""), "gu")
    this.content = String(config.content ?? "")
  }

  /**
   * 输入：原始文本。
   * 输出：替换后的文本。
   */
  normalize(text: string): string {
    return typeof this.pattern === "string"
      ? text.split(this.pattern).join(this.content)
      : text.replace(this.pattern, this.content)
  }

  normalizeSectionStart(text: string): string {
    return text
  }
}

/** 基于 Unicode 规范化表单的 normalizer。 */
class UnicodeNormalizer implements Normalizer {
  private readonly form: "NFC" | "NFD" | "NFKC" | "NFKD"

  /**
   * 构造 Unicode normalizer。
   * 输入：Unicode normalization form。
   * 输出：可复用的 normalizer。
   */
  constructor(form: "NFC" | "NFD" | "NFKC" | "NFKD") {
    this.form = form
  }

  /**
   * 输入：原始文本。
   * 输出：按指定表单归一化后的文本。
   */
  normalize(text: string): string {
    return text.normalize(this.form)
  }

  normalizeSectionStart(text: string): string {
    return text
  }
}

/** 顺序组合多个 normalizer。 */
class SequenceNormalizer implements Normalizer {
  private readonly normalizers: Normalizer[]

  /**
   * 构造 Sequence normalizer。
   * 输入：子 normalizer 列表。
   * 输出：依次执行的组合实例。
   */
  constructor(normalizers: Normalizer[]) {
    this.normalizers = normalizers
  }

  /**
   * 输入：原始文本。
   * 输出：依次经过各子 normalizer 后的文本。
   */
  normalize(text: string): string {
    let current = text
    for (const normalizer of this.normalizers) {
      current = normalizer.normalize(current)
    }
    return current
  }

  /**
   * 输入：已完成常规归一化、但位于新 section 起点的文本。
   * 输出：只重放带 section 起点语义的归一化步骤。
   */
  normalizeSectionStart(text: string): string {
    let current = text
    for (const normalizer of this.normalizers) {
      current = normalizer.normalizeSectionStart(current)
    }
    return current
  }
}

/**
 * 根据 HF 配置创建 normalizer。
 * 输入：normalizer 配置。
 * 输出：对应的 Normalizer 实例。
 */
export function createNormalizer(
  config: Record<string, unknown> | null | undefined
): Normalizer {
  if (!config) {
    return new IdentityNormalizer()
  }

  switch (config.type) {
    case "Prepend":
      return new PrependNormalizer(config)
    case "Replace":
      return new ReplaceNormalizer(config)
    case "NFC":
    case "NFD":
    case "NFKC":
    case "NFKD":
      return new UnicodeNormalizer(config.type)
    case "Sequence":
      return new SequenceNormalizer(
        ((config.normalizers as Record<string, unknown>[] | undefined) ?? []).map((entry) =>
          createNormalizer(entry)
        )
      )
    default:
      return new IdentityNormalizer()
  }
}
