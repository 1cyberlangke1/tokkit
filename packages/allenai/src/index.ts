/**
 * AllenAI family 包公共入口。
 * 输入：AllenAI family 名称或其模型别名。
 * 输出：自动注册 AllenAI 内置 family，并复用 core 的公共 API。
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
    family: "olmo-1",
    aliases: ["olmo_1"],
    models: ["allenai/OLMo-1B-hf"],
    modulePath: "./generated/olmo_1.js",
  },
  {
    family: "olmo-2",
    aliases: ["olmo2", "olmo_2"],
    models: [
      "allenai/OLMo-2-0425-1B",
      "allenai/OLMo-2-0325-32B",
      "allenai/OLMo-2-1124-13B",
      "allenai/Olmo-3-1025-7B",
      "allenai/Olmo-3.1-32B-Think",
    ],
    modulePath: "./generated/olmo_2.js",
  },
  {
    family: "olmo-3-instruct",
    aliases: ["olmo_3_instruct"],
    models: ["allenai/Olmo-3-7B-Instruct", "allenai/Olmo-Hybrid-Instruct-SFT-7B"],
    modulePath: "./generated/olmo_3_instruct.js",
  },
  {
    family: "olmo-hybrid",
    aliases: ["olmo_hybrid"],
    models: ["allenai/Olmo-Hybrid-7B"],
    modulePath: "./generated/olmo_hybrid.js",
  },
  {
    family: "olmoe",
    aliases: ["olmoe_1b_7b"],
    models: ["allenai/OLMoE-1B-7B-0924"],
    modulePath: "./generated/olmoe.js",
  },
] as const

/**
 * 注册 AllenAI 子包内置的 family。
 * 输入：无。
 * 输出：AllenAI 相关 family 被写入全局注册表。
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
