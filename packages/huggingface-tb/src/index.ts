/**
 * HuggingFaceTB family 包公共入口。
 * 输入：HuggingFaceTB family 名称或其模型别名。
 * 输出：自动注册 HuggingFaceTB 内置 family，并复用 core 的公共 API。
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
    family: "smollm",
    aliases: ["smollm2", "smollm_2"],
    models: [
      "HuggingFaceTB/SmolLM-135M",
      "HuggingFaceTB/SmolLM-135M-Instruct",
      "HuggingFaceTB/SmolLM-360M",
      "HuggingFaceTB/SmolLM-360M-Instruct",
      "HuggingFaceTB/SmolLM-1.7B-Instruct",
      "HuggingFaceTB/SmolLM2-135M",
      "HuggingFaceTB/SmolLM2-135M-Instruct",
      "HuggingFaceTB/SmolLM2-360M",
      "HuggingFaceTB/SmolLM2-360M-Instruct",
      "HuggingFaceTB/SmolLM2-1.7B",
      "HuggingFaceTB/SmolLM2-1.7B-Instruct",
    ],
    modulePath: "./generated/smollm.js",
  },
  {
    family: "smollm-1.7b",
    aliases: ["smollm_1_7b"],
    models: ["HuggingFaceTB/SmolLM-1.7B"],
    modulePath: "./generated/smollm_1_7b.js",
  },
  {
    family: "smollm2-16k",
    aliases: ["smollm2_16k"],
    models: ["HuggingFaceTB/SmolLM2-1.7B-Instruct-16k"],
    modulePath: "./generated/smollm2_16k.js",
  },
  {
    family: "smollm3",
    aliases: ["smollm3_3b"],
    models: ["HuggingFaceTB/SmolLM3-3B"],
    modulePath: "./generated/smollm3.js",
  },
  {
    family: "smollm3-base",
    aliases: ["smollm3_base", "smollm3_3b_base"],
    models: ["HuggingFaceTB/SmolLM3-3B-Base"],
    modulePath: "./generated/smollm3_base.js",
  },
] as const

/**
 * 注册 HuggingFaceTB 子包内置的 family。
 * 输入：无。
 * 输出：HuggingFaceTB 相关 family 被写入全局注册表。
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
