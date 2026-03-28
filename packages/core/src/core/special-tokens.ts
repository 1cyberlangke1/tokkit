/**
 * added token 匹配器。
 * 输入：added token 列表与待切分文本。
 * 输出：按“普通文本 / added token”切分后的片段。
 */

import type { AddedTokenConfig } from "../types.js"

/** 切分后的文本片段。 */
export type TextSegment =
  | {
      type: "text"
      value: string
    }
  | {
      type: "added"
      value: string
      token: AddedTokenConfig
    }

/** 命中的 added token 结果。 */
interface AddedTokenMatch {
  token: AddedTokenConfig
  start: number
  end: number
}

/** added token 分段遍历时使用的回调。 */
interface SegmentVisitor {
  onText(value: string): void
  onAdded(value: string, token: AddedTokenConfig): void
}

/** 用于 added token 单词边界判断的正则。 */
const WORD_AT_START = /^[\p{L}\p{N}\p{M}_]/u
const WORD_AT_END = /[\p{L}\p{N}\p{M}_]$/u
const LEADING_SPACE = /^\s*/u
const TRAILING_SPACE = /\s*$/u

/** 用顺序扫描实现 leftmost-longest 的 added token 匹配。 */
export class SpecialTokenMatcher {
  private readonly tokens: AddedTokenConfig[]
  private readonly tokensByFirstChar = new Map<string, AddedTokenConfig[]>()

  /**
   * 构造匹配器。
   * 输入：added token 列表。
   * 输出：按长度降序准备好的匹配结构。
   */
  constructor(tokens: AddedTokenConfig[]) {
    this.tokens = [...tokens].sort((left, right) => {
      if (right.content.length !== left.content.length) {
        return right.content.length - left.content.length
      }

      return left.content.localeCompare(right.content)
    })

    for (const token of this.tokens) {
      const firstChar = token.content[0]
      if (firstChar === undefined) {
        continue
      }

      const bucket = this.tokensByFirstChar.get(firstChar)
      if (bucket) {
        bucket.push(token)
        continue
      }

      this.tokensByFirstChar.set(firstChar, [token])
    }
  }

  /**
   * 把文本切成普通片段和 added token 片段。
   * 输入：原始文本。
   * 输出：带类型标记的片段数组。
   */
  split(text: string): TextSegment[] {
    const segments: TextSegment[] = []
    this.visit(text, {
      onText(value) {
        segments.push({
          type: "text",
          value,
        })
      },
      onAdded(value, token) {
        segments.push({
          type: "added",
          value,
          token,
        })
      },
    })

    return segments.length > 0
      ? segments
      : [
          {
            type: "text",
            value: text,
          },
        ]
  }

  /**
   * 流式遍历文本片段，避免为 encode 热路径额外构建 segment 数组。
   * 输入：原始文本与访问回调。
   * 输出：按顺序回调普通文本和 added token 片段。
   */
  visit(text: string, visitor: SegmentVisitor): void {
    if (this.tokens.length === 0 || text.length === 0) {
      visitor.onText(text)
      return
    }

    let plainStart = 0

    while (plainStart < text.length) {
      const match = this.findNextMatch(text, plainStart)
      if (!match) {
        break
      }

      if (plainStart < match.start) {
        visitor.onText(text.slice(plainStart, match.start))
      }

      visitor.onAdded(text.slice(match.start, match.end), match.token)
      plainStart = match.end
    }

    if (plainStart < text.length) {
      visitor.onText(text.slice(plainStart))
    }
  }

  /**
   * 从给定偏移开始查找下一个 leftmost-longest added token。
   * 输入：全文和当前扫描起点。
   * 输出：命中的 added token，未命中则返回 null。
   */
  private findNextMatch(text: string, from: number): AddedTokenMatch | null {
    for (let start = from; start < text.length; start += 1) {
      const candidates = this.tokensByFirstChar.get(text[start])
      if (!candidates) {
        continue
      }

      const match = this.findMatchAt(text, start, from, candidates)
      if (match) {
        return match
      }
    }

    return null
  }

  /**
   * 在某个固定起点尝试命中最长 added token。
   * 输入：全文、候选起点和当前 plain 起点。
   * 输出：命中的 added token，未命中则返回 null。
   */
  private findMatchAt(
    text: string,
    start: number,
    floor: number,
    candidates: AddedTokenConfig[]
  ): AddedTokenMatch | null {
    for (const token of candidates) {
      if (!text.startsWith(token.content, start)) {
        continue
      }

      const rawEnd = start + token.content.length
      if (token.single_word && !isSingleWordMatch(text, start, rawEnd)) {
        continue
      }

      let matchStart = start
      let matchEnd = rawEnd

      if (token.lstrip) {
        matchStart = Math.max(findLeftWhitespaceStart(text, start), floor)
      }

      if (token.rstrip) {
        matchEnd = findRightWhitespaceEnd(text, rawEnd)
      }

      return {
        token,
        start: matchStart,
        end: matchEnd,
      }
    }

    return null
  }
}

/**
 * 判断 added token 是否满足 single_word 约束。
 * 输入：全文与原始命中区间。
 * 输出：是否属于完整单词边界。
 */
function isSingleWordMatch(text: string, start: number, end: number): boolean {
  const left = start === 0 ? "" : text.slice(0, start)
  const right = end >= text.length ? "" : text.slice(end)
  const leftBoundary = left.length === 0 || !WORD_AT_END.test(left)
  const rightBoundary = right.length === 0 || !WORD_AT_START.test(right)

  return leftBoundary && rightBoundary
}

/**
 * 向左扩展到连续空白的最左端。
 * 输入：全文与命中起点。
 * 输出：扩展后的起点。
 */
function findLeftWhitespaceStart(text: string, start: number): number {
  const left = text.slice(0, start)
  const match = left.match(TRAILING_SPACE)
  if (!match) {
    return start
  }

  return start - match[0].length
}

/**
 * 向右扩展到连续空白的最右端。
 * 输入：全文与命中终点。
 * 输出：扩展后的终点。
 */
function findRightWhitespaceEnd(text: string, end: number): number {
  const right = text.slice(end)
  const match = right.match(LEADING_SPACE)
  if (!match) {
    return end
  }

  return end + match[0].length
}
