/**
 * 通用 BPE 模型实现。
 * 输入：归一化后的 BPE 配置与预分词结果。
 * 输出：token id 数组，或按 id 反查 token 字符串。
 */

import { encodeTextToBytes, formatByteFallbackToken } from "./bytes.js"
import type { NormalizedBpeModelConfig } from "../types.js"

/** BPE 合并时使用的链表节点。 */
interface BpeNode {
  token: string
  bias: number
  prev: BpeNode | null
  next: BpeNode | null
  deleted?: boolean
  score?: number
}

/** 轻量最小堆，用于按 rank 取出最优 merge。 */
class MinHeap<T extends { score?: number }> {
  private readonly items: T[] = []

  /** 输入：节点；输出：节点被插入堆。 */
  push(value: T): void {
    this.items.push(value)
    this.bubbleUp(this.items.length - 1)
  }

  /** 输入：无；输出：当前最小分值节点。 */
  pop(): T | undefined {
    if (this.items.length === 0) {
      return undefined
    }

    const top = this.items[0]
    const last = this.items.pop()
    if (this.items.length > 0 && last) {
      this.items[0] = last
      this.bubbleDown(0)
    }

    return top
  }

  /** 输入：无；输出：堆是否为空。 */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /** 输入：节点索引；输出：节点上浮到正确位置。 */
  private bubbleUp(index: number): void {
    let cursor = index

    while (cursor > 0) {
      const parent = Math.floor((cursor - 1) / 2)
      if ((this.items[parent].score ?? 0) <= (this.items[cursor].score ?? 0)) {
        break
      }

      ;[this.items[parent], this.items[cursor]] = [this.items[cursor], this.items[parent]]
      cursor = parent
    }
  }

  /** 输入：节点索引；输出：节点下沉到正确位置。 */
  private bubbleDown(index: number): void {
    let cursor = index

    while (true) {
      const left = cursor * 2 + 1
      const right = left + 1
      let smallest = cursor

      if (
        left < this.items.length &&
        (this.items[left].score ?? 0) < (this.items[smallest].score ?? 0)
      ) {
        smallest = left
      }

      if (
        right < this.items.length &&
        (this.items[right].score ?? 0) < (this.items[smallest].score ?? 0)
      ) {
        smallest = right
      }

      if (smallest === cursor) {
        break
      }

      ;[this.items[smallest], this.items[cursor]] = [this.items[cursor], this.items[smallest]]
      cursor = smallest
    }
  }
}

/**
 * BPE 模型。
 * 输入：归一化后的 BPE 配置。
 * 输出：可复用的 encode / id 查询能力。
 */
export class BpeModel {
  private readonly tokenToId = new Map<string, number>()
  private readonly idToToken: string[]
  private readonly mergeRanks = new Map<string, number>()
  private readonly unkToken: string | null
  private readonly unkTokenId: number | undefined
  private readonly endOfWordSuffix: string
  private readonly continuingSubwordSuffix: string | null
  private readonly byteFallback: boolean
  private readonly ignoreMerges: boolean
  private readonly cache = new Map<string, string[]>()
  private readonly maxCacheEntries = 10000

  /**
   * 构造模型。
   * 输入：归一化后的 BPE 配置。
   * 输出：内部查找表和 merge rank 被预编译。
   */
  constructor(config: NormalizedBpeModelConfig) {
    this.idToToken = config.vocabById
    this.unkToken = config.unkToken
    this.endOfWordSuffix = config.endOfWordSuffix
    this.continuingSubwordSuffix = config.continuingSubwordSuffix
    this.byteFallback = config.byteFallback
    this.ignoreMerges = config.ignoreMerges

    for (let index = 0; index < config.vocabById.length; index += 1) {
      const token = config.vocabById[index]
      if (token !== undefined && token !== "") {
        this.tokenToId.set(token, index)
      }
    }

    if ((config.mergeTokenIdPairs?.length ?? 0) > 0) {
      for (let index = 0; index < (config.mergeTokenIdPairs?.length ?? 0); index += 2) {
        const leftId = config.mergeTokenIdPairs![index]
        const rightId = config.mergeTokenIdPairs![index + 1]
        const left = config.vocabById[leftId]
        const right = config.vocabById[rightId]

        if (left === undefined || right === undefined) {
          throw new Error(`Invalid merge token id pair: [${leftId}, ${rightId}]`)
        }

        this.mergeRanks.set(this.toMergeKey(left, right), index / 2)
      }
    } else {
      for (let index = 0; index < config.merges.length; index += 1) {
        const [left, right] = config.merges[index]
        this.mergeRanks.set(this.toMergeKey(left, right), index)
      }
    }

    this.unkTokenId = this.unkToken ? this.tokenToId.get(this.unkToken) : undefined
  }

  /**
   * 编码预分词后的片段。
   * 输入：预分词结果数组。
   * 输出：扁平化的 token id 数组。
   */
  encodePieces(pieces: string[]): number[] {
    const ids: number[] = []
    this.appendEncodedPieces(pieces, ids)
    return ids
  }

  /**
   * 编码单个预分词片段。
   * 输入：单个预分词片段。
   * 输出：该片段对应的 token id 数组。
   */
  encodePiece(piece: string): number[] {
    const ids: number[] = []
    this.appendEncodedPiece(piece, ids)
    return ids
  }

  /**
   * 直接把多个预分词片段编码进目标数组。
   * 输入：预分词结果数组与目标 id 数组。
   * 输出：编码结果被直接追加到目标数组。
   */
  appendEncodedPieces(pieces: string[], target: number[]): void {
    for (const piece of pieces) {
      this.appendEncodedPiece(piece, target)
    }
  }

  /**
   * 直接把单个预分词片段编码进目标数组。
   * 输入：单个预分词片段与目标 id 数组。
   * 输出：该片段对应的 token id 被直接追加到目标数组。
   */
  private appendEncodedPiece(piece: string, target: number[]): void {
    if (piece.length === 0) {
      return
    }

    const wholeTokenId = this.tokenToId.get(piece)
    if (this.ignoreMerges && wholeTokenId !== undefined) {
      target.push(wholeTokenId)
      return
    }

    const mergedTokens = this.mergePiece(piece)

    for (const token of mergedTokens) {
      const tokenId = this.tokenToId.get(token)
      if (tokenId !== undefined) {
        target.push(tokenId)
        continue
      }

      if (this.byteFallback) {
        if (this.appendByteFallbackIds(token, target)) {
          continue
        }
      }

      if (this.unkTokenId !== undefined) {
        target.push(this.unkTokenId)
      }
    }
  }

  /**
   * 通过 id 取回 token 字符串。
   * 输入：token id。
   * 输出：对应 token 字符串或 undefined。
   */
  getToken(id: number): string | undefined {
    return this.idToToken[id]
  }

  /**
   * 通过 token 字符串取回 id。
   * 输入：token 字符串。
   * 输出：对应 token id 或 undefined。
   */
  getTokenId(token: string): number | undefined {
    return this.tokenToId.get(token)
  }

  /**
   * 获取词汇表大小。
   * 输入：无。
   * 输出：当前模型词汇表大小。
   */
  get vocabSize(): number {
    return this.idToToken.length
  }

  /**
   * 清空 BPE merge 结果缓存。
   * 输入：无。
   * 输出：内部缓存被释放。
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 对单个片段执行 BPE merge。
   * 输入：预分词片段。
   * 输出：merge 后的 token 字符串数组。
   */
  private mergePiece(piece: string): string[] {
    const cached = this.cache.get(piece)
    if (cached) {
      return cached
    }

    const word = Array.from(piece)
    if (word.length === 0) {
      return []
    }

    if (this.endOfWordSuffix) {
      word[word.length - 1] += this.endOfWordSuffix
    }

    let result: string[] = []

    if (word.length > 1) {
      const queue = new MinHeap<BpeNode>()

      let startNode: BpeNode = {
        token: word[0],
        bias: 0,
        prev: null,
        next: null,
      }

      let previous = startNode
      for (let index = 1; index < word.length; index += 1) {
        const current: BpeNode = {
          token: word[index],
          bias: index / word.length,
          prev: previous,
          next: null,
        }

        previous.next = current
        this.addNode(queue, previous)
        previous = current
      }

      while (!queue.isEmpty()) {
        const node = queue.pop()
        if (!node || node.deleted || !node.next || node.next.deleted) {
          continue
        }

        node.deleted = true
        node.next.deleted = true

        if (node.prev) {
          const clonedPrev: BpeNode = { ...node.prev }
          node.prev.deleted = true
          node.prev = clonedPrev

          if (clonedPrev.prev) {
            clonedPrev.prev.next = clonedPrev
          } else {
            startNode = clonedPrev
          }
        }

        const merged: BpeNode = {
          token: node.token + node.next.token,
          bias: node.bias,
          prev: node.prev,
          next: node.next.next,
        }

        if (merged.prev) {
          merged.prev.next = merged
          this.addNode(queue, merged.prev)
        } else {
          startNode = merged
        }

        if (merged.next) {
          merged.next.prev = merged
          this.addNode(queue, merged)
        }
      }

      for (let current: BpeNode | null = startNode; current; current = current.next) {
        result.push(current.token)
      }
    } else {
      result = word
    }

    if (this.continuingSubwordSuffix) {
      for (let index = 0; index < result.length - 1; index += 1) {
        result[index] += this.continuingSubwordSuffix
      }
    }

    if (piece.length < 256) {
      if (this.cache.size >= this.maxCacheEntries) {
        const oldestKey = this.cache.keys().next().value as string | undefined
        if (oldestKey) {
          this.cache.delete(oldestKey)
        }
      }
      this.cache.set(piece, result)
    }

    return result
  }

  /**
   * 把未知 token 尝试降级成 ByteFallback token。
   * 输入：未知 token 字符串。
   * 输出：若词表完整则返回 fallback id 数组，否则返回 null。
   */
  private appendByteFallbackIds(token: string, target: number[]): boolean {
    const startIndex = target.length
    for (const byte of encodeTextToBytes(token)) {
      const fallbackToken = formatByteFallbackToken(byte)
      const fallbackId = this.tokenToId.get(fallbackToken)
      if (fallbackId === undefined) {
        target.length = startIndex
        return false
      }
      target.push(fallbackId)
    }

    return true
  }

  /**
   * 把相邻节点加入 merge 候选堆。
   * 输入：最小堆与左节点。
   * 输出：若该 pair 可 merge，则节点带 score 入堆。
   */
  private addNode(queue: MinHeap<BpeNode>, node: BpeNode): void {
    if (!node.next) {
      return
    }

    const rank = this.mergeRanks.get(this.toMergeKey(node.token, node.next.token))
    if (rank === undefined) {
      return
    }

    node.score = rank + node.bias
    queue.push(node)
  }

  /**
   * 生成 merge rank 查找 key。
   * 输入：merge 左右 token。
   * 输出：稳定且低开销的 pair key。
   */
  private toMergeKey(left: string, right: string): string {
    return `${left}\u0000${right}`
  }
}
