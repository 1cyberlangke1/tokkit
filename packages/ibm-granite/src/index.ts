/**
 * IBM Granite family 包公共入口。
 * 输入：Granite family 名称或其模型别名。
 * 输出：自动注册 Granite 内置 family，并复用 core 的公共 API。
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
    family: "granite-3-instruct",
    aliases: ["granite_3_instruct"],
    models: [
      "ibm-granite/granite-3.0-2b-instruct",
      "ibm-granite/granite-3.0-8b-instruct",
      "ibm-granite/granite-3.1-2b-instruct",
      "ibm-granite/granite-3.1-8b-instruct",
      "ibm-granite/granite-3.2-2b-instruct",
      "ibm-granite/granite-3.2-8b-instruct",
    ],
    modulePath: "./generated/granite_3_instruct.js",
  },
  {
    family: "granite-3.3-base",
    aliases: ["granite_3_3_base"],
    models: [
      "ibm-granite/granite-3.0-2b-base",
      "ibm-granite/granite-3.0-8b-base",
      "ibm-granite/granite-3.1-2b-base",
      "ibm-granite/granite-3.1-8b-base",
      "ibm-granite/granite-3.3-2b-base",
      "ibm-granite/granite-3.3-8b-base",
    ],
    modulePath: "./generated/granite_3_3_base.js",
  },
  {
    family: "granite-3.3-instruct",
    aliases: ["granite_3_3_instruct"],
    models: [
      "ibm-granite/granite-3.3-2b-instruct",
      "ibm-granite/granite-3.3-8b-instruct",
    ],
    modulePath: "./generated/granite_3_3_instruct.js",
  },
  {
    family: "granite-4",
    aliases: ["granite_4"],
    models: [
      "ibm-granite/granite-4.0-350m-base",
      "ibm-granite/granite-4.0-350m",
      "ibm-granite/granite-4.0-1b-base",
      "ibm-granite/granite-4.0-1b",
      "ibm-granite/granite-4.0-micro-base",
      "ibm-granite/granite-4.0-micro",
      "ibm-granite/granite-4.0-h-350m-base",
      "ibm-granite/granite-4.0-h-350m",
      "ibm-granite/granite-4.0-h-1b-base",
      "ibm-granite/granite-4.0-h-1b",
      "ibm-granite/granite-4.0-h-micro-base",
      "ibm-granite/granite-4.0-h-micro",
      "ibm-granite/granite-4.0-h-small-base",
      "ibm-granite/granite-4.0-h-small",
      "ibm-granite/granite-4.0-h-tiny-base",
      "ibm-granite/granite-4.0-h-tiny",
    ],
    modulePath: "./generated/granite_4.js",
  },
  {
    family: "granite-4-tiny-base-preview",
    aliases: ["granite_4_tiny_base_preview"],
    models: ["ibm-granite/granite-4.0-tiny-base-preview"],
    modulePath: "./generated/granite_4_tiny_base_preview.js",
  },
  {
    family: "granite-4-tiny-preview",
    aliases: ["granite_4_tiny_preview"],
    models: ["ibm-granite/granite-4.0-tiny-preview"],
    modulePath: "./generated/granite_4_tiny_preview.js",
  },
] as const

/**
 * 注册 IBM Granite 子包内置的 family。
 * 输入：无。
 * 输出：Granite 相关 family 被写入全局注册表。
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
