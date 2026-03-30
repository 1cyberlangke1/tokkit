/**
 * deepseek family 包公共入口。
 * 输入：deepseek family 名称或其模型别名。
 * 输出：自动注册 deepseek 内置 family，并复用 core 的公共 API。
 */

import { registerTokenizerFamily, unpackPackedAsset } from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/** 当前子包内置 family 的声明表。 */
const BUILTIN_FAMILIES = [
  {
    family: "deepseek-v3",
    aliases: ["deepseek_v3", "deepseek-v3-0324", "deepseek_v3_0324"],
    models: ["deepseek-ai/DeepSeek-V3", "deepseek-ai/DeepSeek-V3-0324"],
    modulePath: "./generated/deepseek_v3.js",
  },
  {
    family: "deepseek-v3.1",
    aliases: [
      "deepseek_v3_1",
      "deepseek-v3.1-base",
      "deepseek_v3_1_base",
      "deepseek-v3.2-exp",
      "deepseek_v3_2_exp",
      "deepseek-v3.2-exp-base",
      "deepseek_v3_2_exp_base",
    ],
    models: [
      "deepseek-ai/DeepSeek-V3.1",
      "deepseek-ai/DeepSeek-V3.1-Base",
      "deepseek-ai/DeepSeek-V3.2-Exp",
      "deepseek-ai/DeepSeek-V3.2-Exp-Base",
    ],
    modulePath: "./generated/deepseek_v3_1.js",
  },
  {
    family: "deepseek-r1",
    aliases: [
      "deepseek_r1",
      "deepseek-r1-0528",
      "deepseek_r1_0528",
      "deepseek-r1-zero",
      "deepseek_r1_zero",
    ],
    models: [
      "deepseek-ai/DeepSeek-R1",
      "deepseek-ai/DeepSeek-R1-0528",
      "deepseek-ai/DeepSeek-R1-Zero",
    ],
    modulePath: "./generated/deepseek_r1.js",
  },
  {
    family: "deepseek-v3.2",
    aliases: ["deepseek_v3_2"],
    models: ["deepseek-ai/DeepSeek-V3.2"],
    modulePath: "./generated/deepseek_v3_2.js",
  },
] as const

/**
 * 注册 deepseek 子包内置的 family。
 * 输入：无。
 * 输出：deepseek 相关 family 被写入全局注册表。
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
