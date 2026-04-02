/**
 * moonshotai family 包公共入口。
 * 输入：moonshotai family 名称或其模型别名。
 * 输出：自动注册 moonshotai 内置 family，并复用 core 的公共 API。
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
    family: "kimi-k2",
    aliases: [
      "kimi_k2",
      "kimi-k2-base",
      "kimi-k2-instruct",
      "kimi-linear",
      "kimi-linear-48b-a3b",
    ],
    models: [
      "moonshotai/Kimi-K2-Base",
      "moonshotai/Kimi-K2-Instruct",
      "moonshotai/Kimi-K2-Instruct-0905",
      "moonshotai/Kimi-Linear-48B-A3B-Base",
      "moonshotai/Kimi-Linear-48B-A3B-Instruct",
    ],
    modulePath: "./generated/kimi_k2.js",
  },
  {
    family: "kimi-k2-thinking",
    aliases: ["kimi_k2_thinking"],
    models: ["moonshotai/Kimi-K2-Thinking"],
    modulePath: "./generated/kimi_k2_thinking.js",
  },
  {
    family: "moonlight",
    aliases: ["moonlight_16b_a3b", "moonlight-16b-a3b"],
    models: ["moonshotai/Moonlight-16B-A3B", "moonshotai/Moonlight-16B-A3B-Instruct"],
    modulePath: "./generated/moonlight.js",
  },
  {
    family: "kimi-dev",
    aliases: ["kimi_dev", "kimi-dev-72b"],
    models: ["moonshotai/Kimi-Dev-72B"],
    modulePath: "./generated/kimi_dev.js",
  },
] as const

/**
 * 注册 moonshotai 子包内置的 family。
 * 输入：无。
 * 输出：moonshotai 相关 family 被写入全局注册表。
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
