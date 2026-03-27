/**
 * Hugging Face 风格的 normalizer 实现。
 * 输入：normalizer 配置与原始文本。
 * 输出：归一化后的文本。
 */

/** 统一的 normalizer 接口。 */
export interface Normalizer {
  normalize(text: string): string
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
