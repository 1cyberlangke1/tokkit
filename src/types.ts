/**
 * tokkit 公共类型定义。
 * 输入：供注册表、Tokenizer 和 API 使用的配置对象。
 * 输出：统一的类型声明，约束 v1 只处理 BPE 相关资产。
 */

/** 表示可能同步也可能异步返回的值。 */
export type MaybePromise<T> = T | Promise<T>

/** Hugging Face 风格的 AddedToken 配置。 */
export interface AddedTokenConfig {
  id: number
  content: string
  single_word?: boolean
  lstrip?: boolean
  rstrip?: boolean
  normalized?: boolean
  special?: boolean
}

/** Hugging Face 风格的 BPE 模型配置。 */
export interface BpeModelConfig {
  type: "BPE"
  vocab: Record<string, number> | string[]
  merges?: string[] | Array<[string, string]>
  unk_token?: string | null
  continuing_subword_prefix?: string
  end_of_word_suffix?: string
  continuing_subword_suffix?: string | null
  byte_fallback?: boolean
  ignore_merges?: boolean
}

/** Hugging Face 风格的 tokenizer 资产。 */
export interface TokenizerAsset {
  version?: string
  normalizer?: Record<string, unknown> | null
  pre_tokenizer?: Record<string, unknown> | null
  post_processor?: Record<string, unknown> | null
  decoder?: Record<string, unknown> | null
  added_tokens?: AddedTokenConfig[]
  model: BpeModelConfig
}

/** 归一化后的 BPE 配置。 */
export interface NormalizedBpeModelConfig {
  type: "BPE"
  vocabById: string[]
  merges: Array<[string, string]>
  mergeTokenIdPairs?: number[]
  unkToken: string | null
  continuingSubwordPrefix: string
  continuingSubwordSuffix: string | null
  endOfWordSuffix: string
  byteFallback: boolean
  ignoreMerges: boolean
}

/** 归一化后的 tokenizer 资产。 */
export interface NormalizedTokenizerAsset {
  addedTokens: AddedTokenConfig[]
  normalizer: Record<string, unknown> | null
  preTokenizer: Record<string, unknown> | null
  decoder: Record<string, unknown> | null
  model: NormalizedBpeModelConfig
}

/** 运行时可直接消费的 tokenizer 资产来源。 */
export type TokenizerAssetSource = TokenizerAsset | NormalizedTokenizerAsset

/** Tokenizer 编码选项。 */
export interface EncodeOptions {
  addSpecialTokens?: boolean
  allowedSpecial?: string[] | "all"
  disallowedSpecial?: string[] | "all"
}

/** Tokenizer 解码选项。 */
export interface DecodeOptions {
  skipSpecialTokens?: boolean
}

/** 单个 tokenizer family 的注册定义。 */
export interface TokenizerFamilyDefinition {
  family: string
  aliases?: string[]
  models?: string[]
  asset?: TokenizerAssetSource
  load?: () => MaybePromise<TokenizerAssetSource>
}
