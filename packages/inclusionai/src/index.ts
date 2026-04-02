/**
 * inclusionAI family 包公共入口。
 * 输入：inclusionAI family 名称或其模型别名。
 * 输出：自动注册 inclusionAI 内置 family，并复用 core 的公共 API。
 */

import {
  registerModelAliases,
  registerTokenizerFamily,
  unpackPackedAsset,
} from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies as registerQwenBuiltinsForFamilies } from "@cyberlangke/tokkit-qwen"

export * from "@cyberlangke/tokkit-core"

/**
 * 当前子包内置 family 的声明表。
 * 输入：无。
 * 输出：供 registerBuiltins 批量注册的稳定 family 配置。
 */
const BUILTIN_FAMILIES = [
  {
    family: "llada2",
    aliases: ["llada_2", "llada2_0", "llada2_1"],
    models: [
      "inclusionAI/LLaDA2.0-mini",
      "inclusionAI/LLaDA2.0-flash",
      "inclusionAI/LLaDA2.1-mini",
      "inclusionAI/LLaDA2.1-flash",
      "inclusionAI/LLaDA-MoE-7B-A1B-Base",
    ],
    modulePath: "./generated/llada2.js",
  },
  {
    family: "ring-2.5-1t",
    aliases: ["ring_2_5_1t", "ling-2.5-1t", "ling_2_5_1t"],
    models: ["inclusionAI/Ring-2.5-1T", "inclusionAI/Ling-2.5-1T"],
    modulePath: "./generated/ring_2_5_1t.js",
  },
  {
    family: "ling-2",
    aliases: ["ling_2", "ling-2.0", "ling_2_0", "ling-1t", "ling_1t"],
    models: [
      "inclusionAI/Ling-mini-2.0",
      "inclusionAI/Ling-flash-2.0",
      "inclusionAI/Ling-1T",
    ],
    modulePath: "./generated/ling_2.js",
  },
  {
    family: "ring-mini-2.0",
    aliases: ["ring_mini_2_0", "ling-flash-base-2.0", "ling_flash_base_2_0"],
    models: ["inclusionAI/Ring-mini-2.0", "inclusionAI/Ling-flash-base-2.0"],
    modulePath: "./generated/ring_mini_2_0.js",
  },
  {
    family: "ring-flash-2.0",
    aliases: ["ring_flash_2_0"],
    models: ["inclusionAI/Ring-flash-2.0"],
    modulePath: "./generated/ring_flash_2_0.js",
  },
  {
    family: "ring-1t",
    aliases: ["ring_1t"],
    models: ["inclusionAI/Ring-1T"],
    modulePath: "./generated/ring_1t.js",
  },
] as const

const QWEN25_MODELS = ["inclusionAI/GroveMoE-Base"] as const

const QWEN3_MODELS = [
  "inclusionAI/Qwen3-32B-AWorld",
  "inclusionAI/AReaL-SEA-235B-A22B",
  "inclusionAI/GroveMoE-Inst",
  "inclusionAI/AReaL-boba-2-14B-Open",
  "inclusionAI/AReaL-boba-2-8B-Open",
  "inclusionAI/AReaL-boba-2-32B",
  "inclusionAI/AReaL-boba-2-8B",
  "inclusionAI/AReaL-boba-2-14B",
] as const

/**
 * 注册 inclusionAI 子包内置的 family。
 * 输入：无。
 * 输出：inclusionAI 相关 family 与模型别名被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerQwenBuiltinsForFamilies(["qwen2.5", "qwen3"])
  registerModelAliases("qwen2.5", [...QWEN25_MODELS])
  registerModelAliases("qwen3", [...QWEN3_MODELS])

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
