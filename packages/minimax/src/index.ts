/**
 * MiniMaxAI family 包公共入口。
 * 输入：MiniMaxAI family 名称或其模型别名。
 * 输出：自动注册 MiniMaxAI 内置 family，并复用 core 的公共 API。
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
    family: "minimax-m1",
    aliases: ["minimax_m1", "minimax-m1-40k", "minimax-m1-80k"],
    models: [
      "MiniMaxAI/MiniMax-M1-40k",
      "MiniMaxAI/MiniMax-M1-80k",
      "MiniMaxAI/MiniMax-M1-40k-hf",
      "MiniMaxAI/MiniMax-M1-80k-hf",
    ],
    modulePath: "./generated/minimax_m1.js",
  },
  {
    family: "minimax-m2",
    aliases: ["minimax_m2", "minimax-m2.1", "minimax-m2.5"],
    models: ["MiniMaxAI/MiniMax-M2", "MiniMaxAI/MiniMax-M2.1", "MiniMaxAI/MiniMax-M2.5"],
    modulePath: "./generated/minimax_m2.js",
  },
  {
    family: "minimax-text-01",
    aliases: ["minimax_text_01", "minimax-text-01-hf"],
    models: ["MiniMaxAI/MiniMax-Text-01", "MiniMaxAI/MiniMax-Text-01-hf"],
    modulePath: "./generated/minimax_text_01.js",
  },
] as const

/**
 * 注册 MiniMaxAI 子包内置的 family。
 * 输入：无。
 * 输出：MiniMaxAI 相关 family 被写入全局注册表。
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
