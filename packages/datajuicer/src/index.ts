/**
 * datajuicer family 包公共入口。
 * 输入：datajuicer family 名称或其模型别名。
 * 输出：自动注册 datajuicer 内置 family，并复用 core 的公共 API。
 */

import {
  registerTokenizerFamily,
  unpackPackedAsset,
} from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/**
 * 当前子包内置 family 的声明表。
 * 输入：无。
 * 输出：供 registerBuiltins 批量注册的稳定 family 配置。
 */
const BUILTIN_FAMILIES = [
  {
    family: "dj-refine-1b",
    aliases: ["dj_refine_1b"],
    models: [
      "datajuicer/LLaMA-1B-dj-refine-50B",
      "datajuicer/LLaMA-1B-dj-refine-100B",
      "datajuicer/LLaMA-1B-dj-refine-150B",
      "datajuicer/LLaMA-1B-dj-refine-150B-instruct-4.7B",
    ],
    modulePath: "./generated/dj_refine_1b.js",
  },
] as const

/**
 * 注册 datajuicer 子包内置的 family。
 * 输入：无。
 * 输出：datajuicer 相关 family 被写入全局注册表。
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
