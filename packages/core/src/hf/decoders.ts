/**
 * Hugging Face 风格的解码器实现。
 * 输入：decoder 配置与 token 字符串数组。
 * 输出：最终还原的文本。
 */

import { decodeByteLevelToText } from "../core/bytes.js"

/** 复用 ByteFallback UTF-8 解码器，避免热路径重复创建对象。 */
const BYTE_FALLBACK_TEXT_DECODER = new TextDecoder("utf-8", {
  fatal: false,
  ignoreBOM: true,
})

/** 统一的解码器接口。 */
export interface Decoder {
  decode(tokens: string[]): string
  decodeChain(tokens: string[]): string[]
  setSpecialTokens?(tokens: string[]): void
}

/** 默认解码器基类。 */
abstract class BaseDecoder implements Decoder {
  /**
   * 输入：token 字符串数组。
   * 输出：解码后的分段字符串数组。
   */
  abstract decodeChain(tokens: string[]): string[]

  /**
   * 输入：token 字符串数组。
   * 输出：解码后的完整字符串。
   */
  decode(tokens: string[]): string {
    return this.decodeChain(tokens).join("")
  }
}

/** 直接把 token 串起来的 Fuse 解码器。 */
class FuseDecoder extends BaseDecoder {
  /**
   * 输入：token 字符串数组。
   * 输出：只包含一个拼接结果的数组。
   */
  decodeChain(tokens: string[]): string[] {
    return [tokens.join("")]
  }
}

/** 把 ByteLevel token 还原为 UTF-8 文本。 */
class ByteLevelDecoder extends BaseDecoder {
  private readonly specialTokens = new Set<string>()

  /**
   * 输入：特殊 token 字符串列表。
   * 输出：更新内部特殊 token 集合，解码时避免误做 byte 还原。
   */
  setSpecialTokens(tokens: string[]): void {
    this.specialTokens.clear()
    for (const token of tokens) {
      this.specialTokens.add(token)
    }
  }

  /**
   * 输入：token 字符串数组。
   * 输出：按普通 token / 特殊 token 分段后的解码结果。
   */
  decodeChain(tokens: string[]): string[] {
    const result: string[] = []
    let current = ""

    const flush = () => {
      if (current.length === 0) {
        return
      }
      result.push(decodeByteLevelToText(current))
      current = ""
    }

    for (const token of tokens) {
      if (this.specialTokens.has(token)) {
        flush()
        result.push(token)
        continue
      }
      current += token
    }

    flush()
    return result
  }
}

/** 把 `<0xXX>` 形式的 token 还原成 UTF-8 文本。 */
class ByteFallbackDecoder extends BaseDecoder {
  /**
   * 输入：token 字符串数组。
   * 输出：解码后的分段字符串数组。
   */
  decodeChain(tokens: string[]): string[] {
    const result: string[] = []
    let buffer: number[] = []

    const flush = () => {
      if (buffer.length === 0) {
        return
      }
      result.push(BYTE_FALLBACK_TEXT_DECODER.decode(new Uint8Array(buffer)))
      buffer = []
    }

    for (const token of tokens) {
      const match = token.match(/^<0x([0-9A-Fa-f]{2})>$/)
      if (!match) {
        flush()
        result.push(token)
        continue
      }

      buffer.push(parseInt(match[1], 16))
    }

    flush()
    return result
  }
}

/** 把 metaspace 替换字符还原为空格。 */
class MetaspaceDecoder extends BaseDecoder {
  private readonly replacement: string
  private readonly prependScheme: string

  /**
   * 构造 Metaspace 解码器。
   * 输入：decoder 配置。
   * 输出：可复用的 Metaspace 解码器。
   */
  constructor(config: Record<string, unknown>) {
    super()
    this.replacement = String(config.replacement ?? "▁")
    this.prependScheme = String(config.prepend_scheme ?? "always")
  }

  /**
   * 输入：token 字符串数组。
   * 输出：还原空格后的分段数组。
   */
  decodeChain(tokens: string[]): string[] {
    return tokens.map((token, index) => {
      let normalized = token.replaceAll(this.replacement, " ")
      if (
        index === 0 &&
        this.prependScheme !== "never" &&
        normalized.startsWith(" ")
      ) {
        normalized = normalized.slice(1)
      }
      return normalized
    })
  }
}

/** 执行简单 replace 的解码器。 */
class ReplaceDecoder extends BaseDecoder {
  private readonly source: string | RegExp
  private readonly replacement: string

  /**
   * 构造 Replace 解码器。
   * 输入：decoder 配置。
   * 输出：可复用的 Replace 解码器。
   */
  constructor(config: Record<string, unknown>) {
    super()
    const pattern = (config.pattern as Record<string, unknown> | undefined) ?? {}
    this.source =
      pattern.String !== undefined
        ? String(pattern.String)
        : new RegExp(String(pattern.Regex ?? ""), "gu")
    this.replacement = String(config.content ?? "")
  }

  /**
   * 输入：token 字符串数组。
   * 输出：替换后的分段数组。
   */
  decodeChain(tokens: string[]): string[] {
    return tokens.map((token) =>
      typeof this.source === "string"
        ? token.split(this.source).join(this.replacement)
        : token.replace(this.source, this.replacement)
    )
  }
}

/** 去掉指定数量前后缀字符的解码器。 */
class StripDecoder extends BaseDecoder {
  private readonly content: string
  private readonly start: number
  private readonly stop: number

  /**
   * 构造 Strip 解码器。
   * 输入：decoder 配置。
   * 输出：可复用的 Strip 解码器。
   */
  constructor(config: Record<string, unknown>) {
    super()
    this.content = String(config.content ?? " ")
    this.start = Number(config.start ?? 0)
    this.stop = Number(config.stop ?? 0)
  }

  /**
   * 输入：token 字符串数组。
   * 输出：按 start / stop 规则裁剪后的分段数组。
   */
  decodeChain(tokens: string[]): string[] {
    return tokens.map((token) => {
      let startCut = 0
      for (let index = 0; index < this.start; index += 1) {
        if (token[index] !== this.content) {
          break
        }
        startCut = index + 1
      }

      let stopCut = token.length
      for (let index = 0; index < this.stop; index += 1) {
        const reverseIndex = token.length - index - 1
        if (token[reverseIndex] !== this.content) {
          break
        }
        stopCut = reverseIndex
      }

      return token.slice(startCut, stopCut)
    })
  }
}

/** 依次组合多个解码器。 */
class SequenceDecoder extends BaseDecoder {
  private readonly decoders: Decoder[]

  /**
   * 构造 Sequence 解码器。
   * 输入：一组子解码器。
   * 输出：按顺序执行的组合实例。
   */
  constructor(decoders: Decoder[]) {
    super()
    this.decoders = decoders
  }

  /**
   * 输入：特殊 token 列表。
   * 输出：向下游子解码器透传特殊 token 集合。
   */
  setSpecialTokens(tokens: string[]): void {
    for (const decoder of this.decoders) {
      decoder.setSpecialTokens?.(tokens)
    }
  }

  /**
   * 输入：token 字符串数组。
   * 输出：按顺序执行各子解码器后的分段数组。
   */
  decodeChain(tokens: string[]): string[] {
    return this.decoders.reduce((current, decoder) => decoder.decodeChain(current), tokens)
  }
}

/**
 * 根据 HF decoder 配置创建解码器。
 * 输入：decoder 配置。
 * 输出：对应的 Decoder 实例。
 */
export function createDecoder(
  config: Record<string, unknown> | null | undefined
): Decoder {
  if (!config) {
    return new FuseDecoder()
  }

  switch (config.type) {
    case "ByteLevel":
      return new ByteLevelDecoder()
    case "ByteFallback":
      return new ByteFallbackDecoder()
    case "Metaspace":
      return new MetaspaceDecoder(config)
    case "Replace":
      return new ReplaceDecoder(config)
    case "Strip":
      return new StripDecoder(config)
    case "Fuse":
      return new FuseDecoder()
    case "Sequence":
      return new SequenceDecoder(
        ((config.decoders as Record<string, unknown>[] | undefined) ?? []).map((entry) =>
          createDecoder(entry)
        )
      )
    default:
      return new FuseDecoder()
  }
}
