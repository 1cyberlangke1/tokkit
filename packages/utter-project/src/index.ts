/**
 * utter-project family 包公共入口。
 * 输入：utter-project family 名称或其模型别名。
 * 输出：自动注册 utter-project 内置 family，并复用 core 的公共 API。
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
    family: "eurollm-1.7b",
    aliases: ["eurollm_1_7b"],
    models: ["utter-project/EuroLLM-1.7B"],
    modulePath: "./generated/eurollm_1_7b.js",
  },
  {
    family: "eurollm-1.7b-instruct",
    aliases: ["eurollm_1_7b_instruct"],
    models: ["utter-project/EuroLLM-1.7B-Instruct"],
    modulePath: "./generated/eurollm_1_7b_instruct.js",
  },
  {
    family: "eurollm-2512",
    aliases: ["eurollm_2512", "euromoe_2512"],
    models: [
      "utter-project/EuroLLM-9B-2512",
      "utter-project/EuroLLM-22B-2512",
      "utter-project/EuroMoE-2.6B-A0.6B-2512",
    ],
    modulePath: "./generated/eurollm_2512.js",
  },
  {
    family: "eurollm-2512-instruct",
    aliases: ["eurollm_2512_instruct", "euromoe_2512_instruct"],
    models: [
      "utter-project/EuroLLM-9B-Instruct-2512",
      "utter-project/EuroLLM-22B-Instruct-2512",
      "utter-project/EuroMoE-2.6B-A0.6B-Instruct-2512",
    ],
    modulePath: "./generated/eurollm_2512_instruct.js",
  },
] as const

/**
 * 注册 utter-project 子包内置的 family。
 * 输入：无。
 * 输出：utter-project 相关 family 被写入全局注册表。
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
