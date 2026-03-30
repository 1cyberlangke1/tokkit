/**
 * Microsoft family 包公共入口。
 * 输入：Microsoft family 名称或其模型别名。
 * 输出：自动注册 Microsoft 内置 family，并复用 core 的公共 API。
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
    family: "bitnet-b1.58-2b-4t",
    aliases: ["bitnet_b1_58_2b_4t"],
    models: ["microsoft/bitnet-b1.58-2B-4T"],
    modulePath: "./generated/bitnet_b1_58_2b_4t.js",
  },
  {
    family: "phi-1",
    aliases: ["phi1", "phi_1"],
    models: ["microsoft/phi-1", "microsoft/phi-1_5", "microsoft/phi-2"],
    modulePath: "./generated/phi_1.js",
  },
  {
    family: "phi-3-mini",
    aliases: ["phi3-mini", "phi_3_mini"],
    models: ["microsoft/Phi-3-mini-4k-instruct", "microsoft/Phi-3-mini-128k-instruct"],
    modulePath: "./generated/phi_3_mini.js",
  },
  {
    family: "phi-3-medium",
    aliases: ["phi3-medium", "phi_3_medium"],
    models: [
      "microsoft/Phi-3-medium-4k-instruct",
      "microsoft/Phi-3-medium-128k-instruct",
    ],
    modulePath: "./generated/phi_3_medium.js",
  },
  {
    family: "phi-3.5",
    aliases: ["phi3.5", "phi_3_5"],
    models: ["microsoft/Phi-3.5-mini-instruct", "microsoft/Phi-3.5-MoE-instruct"],
    modulePath: "./generated/phi_3_5.js",
  },
  {
    family: "phi-4",
    aliases: ["phi4", "phi_4"],
    models: ["microsoft/phi-4"],
    modulePath: "./generated/phi_4.js",
  },
  {
    family: "phi-4-mini",
    aliases: ["phi4-mini", "phi_4_mini"],
    models: ["microsoft/Phi-4-mini-instruct"],
    modulePath: "./generated/phi_4_mini.js",
  },
  {
    family: "phi-4-mini-flash",
    aliases: ["phi4-mini-flash", "phi_4_mini_flash"],
    models: ["microsoft/Phi-4-mini-flash-reasoning"],
    modulePath: "./generated/phi_4_mini_flash.js",
  },
  {
    family: "phi-4-mini-reasoning",
    aliases: ["phi4-mini-reasoning", "phi_4_mini_reasoning"],
    models: ["microsoft/Phi-4-mini-reasoning"],
    modulePath: "./generated/phi_4_mini_reasoning.js",
  },
  {
    family: "phi-4-reasoning",
    aliases: ["phi4-reasoning", "phi_4_reasoning"],
    models: ["microsoft/Phi-4-reasoning", "microsoft/Phi-4-reasoning-plus"],
    modulePath: "./generated/phi_4_reasoning.js",
  },
  {
    family: "phi-moe",
    aliases: ["phi_moe"],
    models: ["microsoft/Phi-mini-MoE-instruct", "microsoft/Phi-tiny-MoE-instruct"],
    modulePath: "./generated/phi_moe.js",
  },
] as const

/**
 * 注册 Microsoft 子包内置的 family。
 * 输入：无。
 * 输出：Microsoft 相关 family 被写入全局注册表。
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
