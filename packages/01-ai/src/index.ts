/**
 * 01-ai family 包公共入口。
 * 输入：01-ai family 名称或其模型别名。
 * 输出：自动注册 01-ai 内置 family，并复用 core 的公共 API。
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
    family: "yi",
    aliases: ["yi_legacy"],
    models: [
      "01-ai/Yi-6B",
      "01-ai/Yi-6B-Chat",
      "01-ai/Yi-9B",
      "01-ai/Yi-34B-Chat",
      "01-ai/Yi-6B-200K",
      "01-ai/Yi-9B-200K",
      "01-ai/Yi-34B-200K",
      "01-ai/Yi-1.5-6B",
      "01-ai/Yi-1.5-6B-Chat",
      "01-ai/Yi-1.5-9B",
      "01-ai/Yi-1.5-9B-Chat-16K",
      "01-ai/Yi-1.5-9B-32K",
      "01-ai/Yi-1.5-34B",
      "01-ai/Yi-1.5-34B-Chat",
      "01-ai/Yi-1.5-34B-32K",
      "01-ai/Yi-1.5-34B-Chat-16K",
    ],
    modulePath: "./generated/yi.js",
  },
  {
    family: "yi-1.5-9b-chat",
    aliases: ["yi_1_5_9b_chat"],
    models: ["01-ai/Yi-1.5-9B-Chat"],
    modulePath: "./generated/yi_1_5_9b_chat.js",
  },
  {
    family: "yi-coder",
    aliases: ["yi_coder"],
    models: ["01-ai/Yi-34B", "01-ai/Yi-Coder-9B", "01-ai/Yi-Coder-1.5B"],
    modulePath: "./generated/yi_coder.js",
  },
  {
    family: "yi-coder-chat",
    aliases: ["yi_coder_chat"],
    models: ["01-ai/Yi-Coder-9B-Chat", "01-ai/Yi-Coder-1.5B-Chat"],
    modulePath: "./generated/yi_coder_chat.js",
  },
] as const

/**
 * 注册 01-ai 子包内置的 family。
 * 输入：无。
 * 输出：01-ai 相关 family 被写入全局注册表。
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
