/**
 * cyberagent family 包公共入口。
 * 输入：cyberagent family 名称或其模型别名。
 * 输出：自动注册 cyberagent 内置 family，并复用 core 的公共 API。
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
    family: "open-calm",
    aliases: [
      "open_calm",
      "open-calm-1b",
      "open-calm-small",
      "open-calm-medium",
      "open-calm-3b",
      "open-calm-large",
      "open-calm-7b",
    ],
    models: [
      "cyberagent/open-calm-1b",
      "cyberagent/open-calm-small",
      "cyberagent/open-calm-medium",
      "cyberagent/open-calm-3b",
      "cyberagent/open-calm-large",
      "cyberagent/open-calm-7b",
    ],
    modulePath: "./generated/open_calm.js",
  },
  {
    family: "calm2",
    aliases: ["calm_2", "calm2-7b", "calm2-7b-chat"],
    models: ["cyberagent/calm2-7b", "cyberagent/calm2-7b-chat"],
    modulePath: "./generated/calm2.js",
  },
  {
    family: "calm3",
    aliases: ["calm_3", "calm3-22b-chat"],
    models: ["cyberagent/calm3-22b-chat"],
    modulePath: "./generated/calm3.js",
  },
] as const

/**
 * 注册 cyberagent 子包内置的 family。
 * 输入：无。
 * 输出：cyberagent 相关 family 被写入全局注册表。
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
