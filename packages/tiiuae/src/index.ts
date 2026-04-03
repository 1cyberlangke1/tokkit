/**
 * tiiuae family 包公共入口。
 * 输入：tiiuae family 名称或其模型别名。
 * 输出：自动注册 tiiuae 内置 family，并复用 core 的公共 API。
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
    family: "falcon-rw-1b",
    aliases: ["falcon_rw_1b"],
    models: ["tiiuae/falcon-rw-1b"],
    modulePath: "./generated/falcon_rw_1b.js",
  },
  {
    family: "falcon-7b",
    aliases: ["falcon7b", "falcon_7b"],
    models: [
      "tiiuae/falcon-rw-7b",
      "tiiuae/falcon-7b",
      "tiiuae/falcon-7b-instruct",
      "tiiuae/falcon-40b",
      "tiiuae/falcon-40b-instruct",
    ],
    modulePath: "./generated/falcon_7b.js",
  },
] as const

/**
 * 注册 tiiuae 子包内置的 family，可按 family 名称过滤。
 * 输入：可选的 family 名称列表。
 * 输出：选中的 tiiuae family 被写入全局注册表。
 */
export function registerBuiltinsForFamilies(families?: readonly string[]): void {
  const allowedFamilies = families ? new Set(families) : null

  for (const spec of BUILTIN_FAMILIES) {
    if (allowedFamilies && !allowedFamilies.has(spec.family)) {
      continue
    }

    registerTokenizerFamily({
      family: spec.family,
      aliases: [...spec.aliases],
      models: [...spec.models],
      load: () => loadFamilyAsset(spec.modulePath),
    })
  }
}

/**
 * 注册 tiiuae 子包内置的全部 family。
 * 输入：无。
 * 输出：tiiuae 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerBuiltinsForFamilies()
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
