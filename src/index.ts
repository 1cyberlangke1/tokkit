/**
 * tokkit 公共入口。
 * 输入：family / 模型别名与 tokenizer family 定义。
 * 输出：按需加载的 Tokenizer 实例与注册表 API。
 */

import { registerBuiltins } from "./data/index.js"
import {
  clearCache,
  getEncoding,
  getEncodingSync,
  listSupportedFamilies,
  listSupportedModels,
  registerModelAliases,
  registerTokenizerFamily,
  resetRegistry,
} from "./registry/store.js"
import { Tokenizer } from "./core/tokenizer.js"
import type { DecodeOptions, EncodeOptions, TokenizerFamilyDefinition } from "./types.js"

registerBuiltins()

export type {
  AddedTokenConfig,
  BpeModelConfig,
  DecodeOptions,
  EncodeOptions,
  TokenizerAsset,
  TokenizerFamilyDefinition,
} from "./types.js"

export { Tokenizer }

/**
 * 根据 family 或别名获取 Tokenizer。
 * 输入：family 名称或别名。
 * 输出：异步加载后的 Tokenizer 实例。
 */
export async function encodingForModel(nameOrAlias: string): Promise<Tokenizer> {
  return getEncoding(nameOrAlias)
}

/**
 * 异步获取 Tokenizer。
 * 输入：family 名称或别名。
 * 输出：异步加载后的 Tokenizer 实例。
 */
export async function getTokenizer(nameOrAlias: string): Promise<Tokenizer> {
  return getEncoding(nameOrAlias)
}

/**
 * 同步获取已缓存的 Tokenizer。
 * 输入：family 名称或别名。
 * 输出：已加载的 Tokenizer 实例。
 */
export function getTokenizerSync(nameOrAlias: string): Tokenizer {
  return getEncodingSync(nameOrAlias)
}

/**
 * 直接对文本做异步编码。
 * 输入：文本、family/别名与编码选项。
 * 输出：token id 数组。
 */
export async function encode(
  text: string,
  nameOrAlias: string,
  options?: EncodeOptions
): Promise<number[]> {
  const tokenizer = await getEncoding(nameOrAlias)
  return tokenizer.encode(text, options)
}

/**
 * 直接对 token 做异步解码。
 * 输入：token id 数组、family/别名与解码选项。
 * 输出：还原后的文本。
 */
export async function decode(
  ids: number[],
  nameOrAlias: string,
  options?: DecodeOptions
): Promise<string> {
  const tokenizer = await getEncoding(nameOrAlias)
  return tokenizer.decode(ids, options)
}

/**
 * 统计文本的 token 数量。
 * 输入：文本、family/别名与编码选项。
 * 输出：token 数量。
 */
export async function countTokens(
  text: string,
  nameOrAlias: string,
  options?: EncodeOptions
): Promise<number> {
  const ids = await encode(text, nameOrAlias, options)
  return ids.length
}

/**
 * 注册 tokenizer family。
 * 输入：family 定义。
 * 输出：注册表被更新。
 */
export function registerFamily(definition: TokenizerFamilyDefinition): void {
  registerTokenizerFamily(definition)
}

/**
 * 给 family 增加别名。
 * 输入：family 名称和别名数组。
 * 输出：别名表被更新。
 */
export function registerAliases(family: string, aliases: string[]): void {
  registerModelAliases(family, aliases)
}

export {
  clearCache,
  getEncoding,
  getEncodingSync,
  listSupportedFamilies,
  listSupportedModels,
  registerModelAliases,
  registerTokenizerFamily,
  resetRegistry,
}
