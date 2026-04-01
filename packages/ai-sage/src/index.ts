/**
 * AI-Sage family 包公共入口。
 * 输入：AI-Sage family 名称或其模型别名。
 * 输出：自动注册 AI-Sage 内置 family，并复用 core 的公共 API。
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
    family: "gigachat-20b-base",
    aliases: ["gigachat_20b_base"],
    models: ["ai-sage/GigaChat-20B-A3B-base"],
    modulePath: "./generated/gigachat_20b_base.js",
  },
  {
    family: "gigachat-20b-instruct",
    aliases: ["gigachat_20b_instruct"],
    models: ["ai-sage/GigaChat-20B-A3B-instruct", "ai-sage/GigaChat-20B-A3B-instruct-v1.5"],
    modulePath: "./generated/gigachat_20b_instruct.js",
  },
  {
    family: "gigachat3",
    aliases: [],
    models: [
      "ai-sage/GigaChat3-10B-A1.8B-base",
      "ai-sage/GigaChat3-10B-A1.8B",
      "ai-sage/GigaChat3-702B-A36B-preview",
    ],
    modulePath: "./generated/gigachat3.js",
  },
  {
    family: "gigachat3.1",
    aliases: ["gigachat3_1"],
    models: ["ai-sage/GigaChat3.1-10B-A1.8B", "ai-sage/GigaChat3.1-702B-A36B"],
    modulePath: "./generated/gigachat3_1.js",
  },
] as const

/**
 * 注册 AI-Sage 子包内置的 family。
 * 输入：无。
 * 输出：AI-Sage 相关 family 被写入全局注册表。
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
