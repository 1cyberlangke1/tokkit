/**
 * H2OAI family 包公共入口。
 * 输入：H2OAI family 名称或其模型别名。
 * 输出：自动注册 H2OAI 内置 family，并复用 core 的公共 API。
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
    family: "danube",
    aliases: ["danube_1_8b"],
    models: ["h2oai/h2o-danube-1.8b-base", "h2oai/h2o-danube-1.8b-chat"],
    modulePath: "./generated/danube.js",
  },
  {
    family: "danube2",
    aliases: ["danube2_1_8b", "danube3_base"],
    models: [
      "h2oai/h2o-danube2-1.8b-base",
      "h2oai/h2o-danube2-1.8b-chat",
      "h2oai/h2o-danube3-500m-base",
      "h2oai/h2o-danube3-4b-base",
    ],
    modulePath: "./generated/danube2.js",
  },
  {
    family: "danube3-500m-chat",
    aliases: ["danube3_500m_chat"],
    models: ["h2oai/h2o-danube3-500m-chat"],
    modulePath: "./generated/danube3_500m_chat.js",
  },
  {
    family: "danube3-4b-chat",
    aliases: ["danube3_4b_chat"],
    models: ["h2oai/h2o-danube3-4b-chat"],
    modulePath: "./generated/danube3_4b_chat.js",
  },
  {
    family: "danube3.1-4b-chat",
    aliases: ["danube3_1_4b_chat"],
    models: ["h2oai/h2o-danube3.1-4b-chat"],
    modulePath: "./generated/danube3_1_4b_chat.js",
  },
] as const

/**
 * 注册 H2OAI 子包内置的 family，可按 family 名称过滤。
 * 输入：可选的 family 名称列表。
 * 输出：选中的 H2OAI family 被写入全局注册表。
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
 * 注册 H2OAI 子包内置的全部 family。
 * 输入：无。
 * 输出：H2OAI 相关 family 被写入全局注册表。
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
