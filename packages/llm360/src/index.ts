/**
 * LLM360 family 包公共入口。
 * 输入：LLM360 family 名称或其模型别名。
 * 输出：自动注册 LLM360 内置 family，并复用 core 的公共 API。
 */

import {
  registerModelAliases,
  registerTokenizerFamily,
  unpackPackedAsset,
} from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies as registerSnowflakeBuiltinsForFamilies } from "@cyberlangke/tokkit-snowflake"
import { registerBuiltinsForFamilies as registerMiMoBuiltinsForFamilies } from "@cyberlangke/tokkit-xiaomi-mimo"

export * from "@cyberlangke/tokkit-core"

/**
 * 当前子包内置新 family 的声明表。
 * 输入：无。
 * 输出：供 registerBuiltins 批量注册的稳定 family 配置。
 */
const BUILTIN_FAMILIES = [
  {
    family: "crystal",
    aliases: ["crystal_family"],
    models: ["LLM360/Crystal", "LLM360/CrystalChat"],
    modulePath: "./generated/crystal.js",
  },
  {
    family: "k2",
    aliases: ["k2_base"],
    models: ["LLM360/K2"],
    modulePath: "./generated/k2.js",
  },
  {
    family: "k2-chat",
    aliases: ["k2_chat"],
    models: ["LLM360/K2-Chat"],
    modulePath: "./generated/k2_chat.js",
  },
  {
    family: "k2-think-v2",
    aliases: ["k2_think_v2"],
    models: ["LLM360/K2-Think-V2"],
    modulePath: "./generated/k2_think_v2.js",
  },
] as const

/**
 * 当前复用 `snowflake-arctic-base` family 的 LLM360 官方模型别名。
 * 输入：无。
 * 输出：映射到现有 `snowflake-arctic-base` 的稳定模型名列表。
 */
const SNOWFLAKE_ARCTIC_BASE_MODELS = ["LLM360/Amber", "LLM360/AmberChat"] as const

/**
 * 当前复用 `mimo-7b-rl-0530` family 的 LLM360 官方模型别名。
 * 输入：无。
 * 输出：映射到现有 `mimo-7b-rl-0530` 的稳定模型名列表。
 */
const MIMO_7B_RL_0530_MODELS = ["LLM360/K2-Think"] as const

/**
 * 注册 LLM360 子包内置的 family。
 * 输入：无。
 * 输出：LLM360 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerSnowflakeBuiltinsForFamilies(["snowflake-arctic-base"])
  registerMiMoBuiltinsForFamilies(["mimo-7b-rl-0530"])

  registerModelAliases("snowflake-arctic-base", [...SNOWFLAKE_ARCTIC_BASE_MODELS])
  registerModelAliases("mimo-7b-rl-0530", [...MIMO_7B_RL_0530_MODELS])

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
