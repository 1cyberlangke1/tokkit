/**
 * Salesforce family 包公共入口。
 * 输入：Salesforce family 名称或其模型别名。
 * 输出：自动注册 Salesforce 内置 family，并复用 core 的公共 API。
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
    family: "codegen",
    aliases: [],
    models: [
      "Salesforce/codegen-350M-mono",
      "Salesforce/codegen-350M-multi",
      "Salesforce/codegen-2B-mono",
      "Salesforce/codegen-2B-multi",
      "Salesforce/codegen-6B-mono",
      "Salesforce/codegen-6B-multi",
      "Salesforce/codegen-16B-mono",
      "Salesforce/codegen-16B-multi",
    ],
    modulePath: "./generated/codegen.js",
  },
  {
    family: "codegen-nl",
    aliases: ["codegen_nl"],
    models: [
      "Salesforce/codegen-350M-nl",
      "Salesforce/codegen-2B-nl",
      "Salesforce/codegen-6B-nl",
      "Salesforce/codegen-16B-nl",
    ],
    modulePath: "./generated/codegen_nl.js",
  },
  {
    family: "codegen2",
    aliases: [],
    models: [
      "Salesforce/codegen2-1B_P",
      "Salesforce/codegen2-3_7B_P",
      "Salesforce/codegen2-7B_P",
      "Salesforce/codegen2-16B_P",
    ],
    modulePath: "./generated/codegen2.js",
  },
] as const

/**
 * 注册 Salesforce 子包内置的 family。
 * 输入：无。
 * 输出：Salesforce 相关 family 被写入全局注册表。
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
