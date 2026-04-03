/**
 * Deci family 包公共入口。
 * 输入：Deci family 名称或其模型别名。
 * 输出：自动注册 Deci 内置 family，并复用 core 的公共 API。
 */

import {
  registerModelAliases,
  registerTokenizerFamily,
  unpackPackedAsset,
} from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies as registerMistralBuiltinsForFamilies } from "@cyberlangke/tokkit-mistral"

export * from "@cyberlangke/tokkit-core"

/**
 * 当前子包内置新 family 的声明表。
 * 输入：无。
 * 输出：供 registerBuiltins 批量注册的稳定 family 配置。
 */
const BUILTIN_FAMILIES = [
  {
    family: "decicoder-1b",
    aliases: ["decicoder_1b"],
    models: ["Deci/DeciCoder-1b"],
    modulePath: "./generated/decicoder_1b.js",
  },
] as const

/**
 * 当前复用 `mistral-7b-v0.1` family 的 Deci 官方模型别名。
 * 输入：无。
 * 输出：映射到现有 `mistral-7b-v0.1` 的稳定模型名列表。
 */
const MISTRAL_7B_V0_1_MODELS = ["Deci/DeciLM-7B", "Deci/DeciLM-7B-instruct"] as const

/**
 * 注册 Deci 子包内置的 family。
 * 输入：无。
 * 输出：Deci 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerMistralBuiltinsForFamilies(["mistral-7b-v0.1"])
  registerModelAliases("mistral-7b-v0.1", [...MISTRAL_7B_V0_1_MODELS])

  for (const spec of BUILTIN_FAMILIES) {
    registerTokenizerFamily({
      family: spec.family,
      aliases: [...spec.aliases],
      models: [...spec.models],
      load: () => loadFamilyAsset(spec.modulePath),
    })
  }
}

/**
 * 加载当前包内的压缩 tokenizer 资产。
 * 输入：当前包下的 family 模块路径。
 * 输出：解包后的 normalized tokenizer 资产。
 */
async function loadFamilyAsset(modulePath: string): Promise<NormalizedTokenizerAsset> {
  const module = (await import(modulePath)) as { default: string }
  return unpackPackedAsset(module.default)
}

registerBuiltins()
