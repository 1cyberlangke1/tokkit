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
    family: "olmo",
    aliases: ["olmo_classic"],
    models: [
      "allenai/OLMo-1B",
      "allenai/OLMo-7B",
      "allenai/OLMo-7B-0424",
      "allenai/OLMo-7B-Instruct",
    ],
    modulePath: "./generated/olmo.js",
  },
  {
    family: "olmo-1",
    aliases: ["olmo-hf", "olmo_1", "olmo_hf"],
    models: [
      "allenai/OLMo-1B-hf",
      "allenai/OLMo-7B-hf",
      "allenai/OLMo-7B-Twin-2T-hf",
    ],
    modulePath: "./generated/olmo_1.js",
  },
  {
    family: "olmo-0424",
    aliases: ["olmo_0424"],
    models: ["allenai/OLMo-7B-0424-hf"],
    modulePath: "./generated/olmo_0424.js",
  },
  {
    family: "olmo-2",
    aliases: ["olmo2", "olmo_2"],
    models: [
      "allenai/OLMo-2-0425-1B",
      "allenai/OLMo-2-0425-1B-Instruct",
      "allenai/OLMo-2-0325-32B",
      "allenai/OLMo-2-0325-32B-Instruct",
      "allenai/OLMo-2-1124-7B",
      "allenai/OLMo-2-1124-7B-Instruct",
      "allenai/OLMo-2-1124-13B",
      "allenai/OLMo-2-1124-13B-Instruct",
      "allenai/Olmo-3-1025-7B",
      "allenai/Olmo-3-1125-32B",
      "allenai/Olmo-3-7B-Think",
      "allenai/Olmo-3-32B-Think",
      "allenai/Olmo-3.1-32B-Think",
    ],
    modulePath: "./generated/olmo_2.js",
  },
  {
    family: "olmo-3-instruct",
    aliases: ["olmo3-instruct", "olmo_3_instruct"],
    models: [
      "allenai/Olmo-3-7B-Instruct",
      "allenai/Olmo-3.1-32B-Instruct",
      "allenai/Olmo-Hybrid-Instruct-SFT-7B",
    ],
    modulePath: "./generated/olmo_3_instruct.js",
  },
  {
    family: "olmo-hybrid",
    aliases: ["olmo_hybrid"],
    models: ["allenai/Olmo-Hybrid-7B"],
    modulePath: "./generated/olmo_hybrid.js",
  },
  {
    family: "olmo-hybrid-think",
    aliases: ["olmo_hybrid_think"],
    models: ["allenai/Olmo-Hybrid-Think-SFT-7B"],
    modulePath: "./generated/olmo_hybrid_think.js",
  },
  {
    family: "olmoe",
    aliases: ["olmo-0724", "olmo_0724", "olmoe_1b_7b"],
    models: [
      "allenai/OLMo-1B-0724-hf",
      "allenai/OLMo-7B-0724-hf",
      "allenai/OLMo-7B-0724-Instruct-hf",
      "allenai/OLMo-7B-Instruct-hf",
      "allenai/OLMoE-1B-7B-0924",
    ],
    modulePath: "./generated/olmoe.js",
  },
  {
    family: "olmoe-instruct",
    aliases: ["olmoe_instruct"],
    models: ["allenai/OLMoE-1B-7B-0924-Instruct"],
    modulePath: "./generated/olmoe_instruct.js",
  },
  {
    family: "olmoe-0125",
    aliases: ["olmoe_0125"],
    models: ["allenai/OLMoE-1B-7B-0125"],
    modulePath: "./generated/olmoe_0125.js",
  },
  {
    family: "olmoe-0125-instruct",
    aliases: ["olmoe_0125_instruct"],
    models: ["allenai/OLMoE-1B-7B-0125-Instruct"],
    modulePath: "./generated/olmoe_0125_instruct.js",
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
