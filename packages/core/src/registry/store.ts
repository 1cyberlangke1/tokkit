/**
 * Tokenizer family 注册表与缓存。
 * 输入：family 定义、别名和加载请求。
 * 输出：Tokenizer 实例、支持列表以及缓存管理能力。
 */

import { Tokenizer } from "../core/tokenizer.js"
import { normalizeTokenizerAsset } from "../hf/normalize-asset.js"
import type {
  NormalizedTokenizerAsset,
  TokenizerAssetSource,
  TokenizerFamilyDefinition,
} from "../types.js"

/** family 定义缓存。 */
const familyDefinitions = new Map<string, TokenizerFamilyDefinition>()

/** 别名到 family 的映射。 */
const aliasToFamily = new Map<string, string>()

/** 已完成加载的 Tokenizer 实例缓存。 */
const tokenizerCache = new Map<string, Tokenizer>()

/** 正在进行中的加载 Promise，用于并发去重。 */
const loadingCache = new Map<string, Promise<Tokenizer>>()

/**
 * 注册或覆盖一个 tokenizer family。
 * 输入：family 定义。
 * 输出：注册表与别名表被更新。
 */
export function registerTokenizerFamily(definition: TokenizerFamilyDefinition): void {
  const previousDefinition = familyDefinitions.get(definition.family)

  if (previousDefinition?.models?.length) {
    const mergedModels = new Set([...(previousDefinition.models ?? []), ...(definition.models ?? [])])
    definition.models = [...mergedModels]
  }

  familyDefinitions.set(definition.family, definition)
  aliasToFamily.set(definition.family, definition.family)

  for (const alias of definition.aliases ?? []) {
    aliasToFamily.set(alias, definition.family)
  }

  for (const model of definition.models ?? []) {
    aliasToFamily.set(model, definition.family)
  }

  clearCache(definition.family)
}

/**
 * 为现有 family 增加额外别名。
 * 输入：family 名称和别名数组。
 * 输出：别名表被更新。
 */
export function registerModelAliases(family: string, aliases: string[]): void {
  const targetFamily = resolveFamily(family)
  const definition = familyDefinitions.get(targetFamily)

  if (definition) {
    const mergedModels = new Set(definition.models ?? [])

    for (const alias of aliases) {
      mergedModels.add(alias)
    }

    definition.models = [...mergedModels]
  }

  for (const alias of aliases) {
    aliasToFamily.set(alias, targetFamily)
  }
}

/**
 * 异步获取 Tokenizer。
 * 输入：family 名称或别名。
 * 输出：对应的 Tokenizer 实例。
 */
export async function getEncoding(nameOrAlias: string): Promise<Tokenizer> {
  const family = resolveFamily(nameOrAlias)
  const cached = tokenizerCache.get(family)
  if (cached) {
    return cached
  }

  const loading = loadingCache.get(family)
  if (loading) {
    return loading
  }

  const definition = familyDefinitions.get(family)
  if (!definition) {
    throw new Error(`Unsupported tokenizer family or alias: ${nameOrAlias}`)
  }

  const promise = (async () => {
    const asset = definition.asset ?? (await definition.load?.())
    if (!asset) {
      throw new Error(`Tokenizer family "${family}" does not provide an asset loader.`)
    }

    const tokenizer = new Tokenizer(normalizeAssetSource(asset))
    tokenizerCache.set(family, tokenizer)
    loadingCache.delete(family)
    return tokenizer
  })()

  loadingCache.set(family, promise)
  return promise
}

/**
 * 同步获取已缓存的 Tokenizer。
 * 输入：family 名称或别名。
 * 输出：已加载的 Tokenizer 实例，未加载时抛错。
 */
export function getEncodingSync(nameOrAlias: string): Tokenizer {
  const family = resolveFamily(nameOrAlias)
  const tokenizer = tokenizerCache.get(family)
  if (!tokenizer) {
    throw new Error(
      `Tokenizer family "${family}" has not been loaded yet. Call getEncoding() first.`
    )
  }
  return tokenizer
}

/**
 * 列出支持的 family。
 * 输入：无。
 * 输出：已注册 family 名称数组。
 */
export function listSupportedFamilies(): string[] {
  return [...familyDefinitions.keys()]
}

/**
 * 列出支持的模型名。
 * 输入：无。
 * 输出：定义里显式声明的模型名数组。
 */
export function listSupportedModels(): string[] {
  return [...familyDefinitions.values()].flatMap((definition) => definition.models ?? [])
}

/**
 * 清理缓存。
 * 输入：可选的 family 名称或别名。
 * 输出：指定 family 或全部 family 的缓存被释放。
 */
export function clearCache(nameOrAlias?: string): void {
  if (!nameOrAlias) {
    tokenizerCache.clear()
    loadingCache.clear()
    return
  }

  const family = resolveFamily(nameOrAlias)
  tokenizerCache.delete(family)
  loadingCache.delete(family)
}

/**
 * 重置注册表。
 * 输入：无。
 * 输出：注册表与缓存全部清空。
 */
export function resetRegistry(): void {
  familyDefinitions.clear()
  aliasToFamily.clear()
  tokenizerCache.clear()
  loadingCache.clear()
}

/**
 * 把别名解析成 family 名称。
 * 输入：family 名称或别名。
 * 输出：标准化 family 名称。
 */
function resolveFamily(nameOrAlias: string): string {
  return aliasToFamily.get(nameOrAlias) ?? nameOrAlias
}

/**
 * 统一处理原始资产和已归一化资产。
 * 输入：TokenizerAsset 或 NormalizedTokenizerAsset。
 * 输出：运行时可直接消费的 NormalizedTokenizerAsset。
 */
function normalizeAssetSource(asset: TokenizerAssetSource): NormalizedTokenizerAsset {
  if (isNormalizedTokenizerAsset(asset)) {
    return asset
  }

  return normalizeTokenizerAsset(asset)
}

/**
 * 判断资产是否已经是归一化结构。
 * 输入：待判断的资产对象。
 * 输出：若包含 `addedTokens` / `preTokenizer` / `vocabById` 等字段，则视为已归一化。
 */
function isNormalizedTokenizerAsset(asset: TokenizerAssetSource): asset is NormalizedTokenizerAsset {
  return (
    "addedTokens" in asset &&
    "preTokenizer" in asset &&
    "decoder" in asset &&
    "model" in asset &&
    "vocabById" in asset.model
  )
}
