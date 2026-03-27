/**
 * tokenizer 资产归一化工具。
 * 输入：Hugging Face 风格或压缩后的 BPE 资产。
 * 输出：运行时可直接消费的规范化结构。
 */

import type {
  AddedTokenConfig,
  NormalizedTokenizerAsset,
  TokenizerAsset,
} from "../types.js"

/**
 * 把 tokenizer 资产归一化。
 * 输入：原始 tokenizer 资产。
 * 输出：规范化后的运行时结构。
 */
export function normalizeTokenizerAsset(asset: TokenizerAsset): NormalizedTokenizerAsset {
  if (asset.model.type !== "BPE") {
    throw new Error(`Unsupported tokenizer model type: ${asset.model.type}`)
  }

  return {
    addedTokens: (asset.added_tokens ?? []).map(normalizeAddedToken),
    normalizer: (asset.normalizer as Record<string, unknown> | null) ?? null,
    preTokenizer: (asset.pre_tokenizer as Record<string, unknown> | null) ?? null,
    decoder: (asset.decoder as Record<string, unknown> | null) ?? null,
    model: {
      type: "BPE",
      vocabById: normalizeVocab(asset.model.vocab),
      merges: normalizeMerges(asset.model.merges ?? []),
      unkToken: asset.model.unk_token ?? null,
      continuingSubwordPrefix: asset.model.continuing_subword_prefix ?? "",
      continuingSubwordSuffix: asset.model.continuing_subword_suffix ?? null,
      endOfWordSuffix: asset.model.end_of_word_suffix ?? "",
      byteFallback: asset.model.byte_fallback ?? false,
      ignoreMerges: asset.model.ignore_merges ?? false,
    },
  }
}

/**
 * 归一化 added token 配置。
 * 输入：单个 AddedToken 配置。
 * 输出：填好默认值的 AddedToken。
 */
function normalizeAddedToken(token: AddedTokenConfig): AddedTokenConfig {
  return {
    id: token.id,
    content: token.content,
    single_word: token.single_word ?? false,
    lstrip: token.lstrip ?? false,
    rstrip: token.rstrip ?? false,
    normalized: token.normalized ?? false,
    special: token.special ?? false,
  }
}

/**
 * 归一化词表。
 * 输入：token -> id 或 id -> token 数组。
 * 输出：按 id 索引的 token 数组。
 */
function normalizeVocab(vocab: Record<string, number> | string[]): string[] {
  if (Array.isArray(vocab)) {
    return [...vocab]
  }

  const entries = Object.entries(vocab)
  const maxId = entries.reduce((current, [, id]) => Math.max(current, id), 0)
  const vocabById = new Array<string>(maxId + 1).fill("")

  for (const [token, id] of entries) {
    vocabById[id] = token
  }

  return vocabById
}

/**
 * 归一化 merge 列表。
 * 输入：旧字符串格式或新 tuple 格式的 merges。
 * 输出：统一的 `[left, right]` tuple 数组。
 */
function normalizeMerges(merges: string[] | Array<[string, string]>): Array<[string, string]> {
  if (merges.length === 0) {
    return []
  }

  if (Array.isArray(merges[0])) {
    return merges as Array<[string, string]>
  }

  return (merges as string[])
    .filter((merge) => merge && !merge.startsWith("#"))
    .map((merge) => {
      const [left, right] = merge.split(" ", 2)
      return [left, right] as [string, string]
    })
}
