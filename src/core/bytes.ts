/**
 * GPT-2 / ByteLevel 风格的字节映射工具。
 * 输入：原始文本或 ByteLevel Unicode 文本。
 * 输出：编码后的 ByteLevel 字符串或还原后的 UTF-8 文本。
 */

/** 预构建的 UTF-8 编码器，避免热路径重复创建对象。 */
const TEXT_ENCODER = new TextEncoder()

/** 预构建的 UTF-8 解码器，使用 replace 风格容错行为。 */
const TEXT_DECODER = new TextDecoder("utf-8", {
  fatal: false,
  ignoreBOM: true,
})

/** 按 GPT-2 规则构建 byte -> unicode 映射表。 */
function createByteToUnicode(): string[] {
  const table = new Array<string>(256)

  for (let value = 33; value <= 126; value += 1) {
    table[value] = String.fromCharCode(value)
  }
  for (let value = 161; value <= 172; value += 1) {
    table[value] = String.fromCharCode(value)
  }
  for (let value = 174; value <= 255; value += 1) {
    table[value] = String.fromCharCode(value)
  }

  let offset = 0
  for (let value = 0; value < 256; value += 1) {
    if (!table[value]) {
      table[value] = String.fromCharCode(256 + offset)
      offset += 1
    }
  }

  return table
}

/** 全局 byte -> unicode 表。 */
export const BYTE_TO_UNICODE = createByteToUnicode()

/** 全局 unicode -> byte 表。 */
export const UNICODE_TO_BYTE = new Map<string, number>(
  BYTE_TO_UNICODE.map((char, index) => [char, index])
)

/** ByteLevel 字符都处于 BMP 范围内，可直接按 UTF-16 code unit 建反查表。 */
const MAX_BYTELEVEL_CHAR_CODE = BYTE_TO_UNICODE.reduce((max, char) => {
  const code = char.charCodeAt(0)
  return code > max ? code : max
}, 0)

/** 基于 code unit 的 byte 反查表，避免热路径使用 Map 查找。 */
const UNICODE_CODE_UNIT_TO_BYTE = (() => {
  const table = new Int16Array(MAX_BYTELEVEL_CHAR_CODE + 1)
  table.fill(-1)

  for (let index = 0; index < BYTE_TO_UNICODE.length; index += 1) {
    table[BYTE_TO_UNICODE[index].charCodeAt(0)] = index
  }

  return table
})()

/** 预生成 256 个 ByteFallback token，避免热路径重复格式化字符串。 */
const BYTE_FALLBACK_TOKENS = Array.from({ length: 256 }, (_, byte) => {
  return `<0x${byte.toString(16).toUpperCase().padStart(2, "0")}>`
})

/**
 * 把普通文本映射成 ByteLevel 可见字符序列。
 * 输入：任意 UTF-8 文本。
 * 输出：ByteLevel BPE 可直接消费的字符串。
 */
export function encodeTextToByteLevel(text: string): string {
  let asciiOnly = true
  let asciiNeedsMapping = false

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    if (code > 0x7f) {
      asciiOnly = false
      break
    }

    if (code < 33 || code > 126) {
      asciiNeedsMapping = true
    }
  }

  if (asciiOnly) {
    if (!asciiNeedsMapping) {
      return text
    }

    let mapped = ""
    for (let index = 0; index < text.length; index += 1) {
      mapped += BYTE_TO_UNICODE[text.charCodeAt(index)]
    }
    return mapped
  }

  const bytes = TEXT_ENCODER.encode(text)
  let mapped = ""

  for (let index = 0; index < bytes.length; index += 1) {
    mapped += BYTE_TO_UNICODE[bytes[index]]
  }

  return mapped
}

/**
 * 把 ByteLevel 字符串还原成普通文本。
 * 输入：ByteLevel 可见字符序列。
 * 输出：UTF-8 解码后的文本。
 */
export function decodeByteLevelToText(text: string): string {
  const bytes = new Uint8Array(text.length)

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    const byte = code <= MAX_BYTELEVEL_CHAR_CODE ? UNICODE_CODE_UNIT_TO_BYTE[code] : -1
    bytes[index] = byte >= 0 ? byte : 0
  }

  return TEXT_DECODER.decode(bytes)
}

/**
 * 把任意文本转成 UTF-8 字节数组。
 * 输入：普通文本。
 * 输出：UTF-8 字节数组。
 */
export function encodeTextToBytes(text: string): Uint8Array {
  return TEXT_ENCODER.encode(text)
}

/**
 * 把单个字节格式化成 ByteFallback token。
 * 输入：0-255 的字节值。
 * 输出：`<0xXX>` 格式的 token 字符串。
 */
export function formatByteFallbackToken(byte: number): string {
  return BYTE_FALLBACK_TOKENS[byte]
}
