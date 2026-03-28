/**
 * Mistral family 包公共入口。
 * 输入：Mistral family 名称或其模型别名。
 * 输出：自动注册 Mistral 内置 family，并复用 core 的公共 API。
 */

import { registerTokenizerFamily, unpackPackedAsset } from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/**
 * 当前子包内置 family 的声明表。
 * 输入：无。
 * 输出：供 registerBuiltins 批量注册的稳定 family 配置。
 */
const BUILTIN_FAMILIES = [
  {
    family: "mistral-7b-v0.1",
    aliases: ["mistral_7b_v0_1"],
    models: [
      "mistralai/Mistral-7B-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.2",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
    ],
    modulePath: "./generated/mistral_7b_v0_1.js",
  },
  {
    family: "mistral-7b-v0.3",
    aliases: ["mistral_7b_v0_3"],
    models: ["mistralai/Mistral-7B-v0.3", "mistralai/Mistral-7B-Instruct-v0.3"],
    modulePath: "./generated/mistral_7b_v0_3.js",
  },
  {
    family: "mixtral-8x7b",
    aliases: ["mixtral_8x7b"],
    models: ["mistralai/Mixtral-8x7B-v0.1"],
    modulePath: "./generated/mixtral_8x7b.js",
  },
  {
    family: "ministral-8b",
    aliases: ["ministral_8b"],
    models: ["mistralai/Ministral-8B-Instruct-2410"],
    modulePath: "./generated/ministral_8b.js",
  },
  {
    family: "devstral-small-2",
    aliases: ["devstral_small_2"],
    models: ["mistralai/Devstral-Small-2-24B-Instruct-2512"],
    modulePath: "./generated/devstral_small_2.js",
  },
  {
    family: "mistral-small-3.1",
    aliases: ["mistral_small_3_1"],
    models: ["mistralai/Mistral-Small-3.1-24B-Instruct-2503"],
    modulePath: "./generated/mistral_small_3_1.js",
  },
] as const

/**
 * 注册 Mistral 子包内置的 family。
 * 输入：无。
 * 输出：Mistral 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
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
