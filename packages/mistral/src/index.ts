/**
 * Mistral family 包公共入口。
 * 输入：Mistral family 名称或其模型别名。
 * 输出：自动注册 Mistral 内置 family，并复用 core 的公共 API。
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
    family: "devstral-small-2",
    aliases: ["devstral_small_2", "ministral-3-instruct", "ministral_3_instruct"],
    models: [
      "mistralai/Devstral-Small-2-24B-Instruct-2512",
      "mistralai/Ministral-3-3B-Instruct-2512",
      "mistralai/Ministral-3-8B-Instruct-2512",
      "mistralai/Ministral-3-14B-Instruct-2512",
    ],
    modulePath: "./generated/devstral_small_2.js",
  },
  {
    family: "devstral-small-2505",
    aliases: ["devstral_small_2505"],
    models: ["mistralai/Devstral-Small-2505"],
    modulePath: "./generated/devstral_small_2505.js",
  },
  {
    family: "leanstral-2603",
    aliases: ["leanstral_2603"],
    models: ["mistralai/Leanstral-2603"],
    modulePath: "./generated/leanstral_2603.js",
  },
  {
    family: "mathstral-7b",
    aliases: ["mathstral_7b"],
    models: ["mistralai/Mathstral-7B-v0.1"],
    modulePath: "./generated/mathstral_7b.js",
  },
  {
    family: "mamba-codestral-7b",
    aliases: ["mamba_codestral_7b"],
    models: ["mistralai/Mamba-Codestral-7B-v0.1"],
    modulePath: "./generated/mamba_codestral_7b.js",
  },
  {
    family: "magistral-small-2507",
    aliases: ["magistral_small_2507", "magistral-small-2509"],
    models: ["mistralai/Magistral-Small-2507", "mistralai/Magistral-Small-2509"],
    modulePath: "./generated/magistral_small_2507.js",
  },
  {
    family: "ministral-3",
    aliases: ["ministral_3"],
    models: [
      "mistralai/Ministral-3-3B-Base-2512",
      "mistralai/Ministral-3-3B-Reasoning-2512",
      "mistralai/Ministral-3-8B-Base-2512",
      "mistralai/Ministral-3-8B-Reasoning-2512",
      "mistralai/Ministral-3-14B-Base-2512",
      "mistralai/Ministral-3-14B-Reasoning-2512",
    ],
    modulePath: "./generated/ministral_3.js",
  },
  {
    family: "mistral-7b-v0.1",
    aliases: ["mistral_7b_v0_1"],
    models: [
      "mistralai/Mistral-7B-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.1",
      "mistralai/Mistral-7B-Instruct-v0.2",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "mistralai/Mixtral-8x22B-v0.1",
    ],
    modulePath: "./generated/mistral_7b_v0_1.js",
  },
  {
    family: "mistral-7b-v0.3",
    aliases: ["mistral_7b_v0_3"],
    models: [
      "mistralai/Mistral-7B-v0.3",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "mistralai/Mixtral-8x22B-Instruct-v0.1",
    ],
    modulePath: "./generated/mistral_7b_v0_3.js",
  },
  {
    family: "mistral-nemo",
    aliases: ["mistral_nemo"],
    models: ["mistralai/Mistral-Nemo-Base-2407", "mistralai/Mistral-Nemo-Instruct-2407"],
    modulePath: "./generated/mistral_nemo.js",
  },
  {
    family: "mistral-small-3.2",
    aliases: [
      "mistral_small_3_2",
      "mistral-small-3.2-24b",
      "mistral-small-3.2-24b-instruct",
      "devstral-small-2507",
      "magistral-small-2506",
    ],
    models: [
      "mistralai/Devstral-Small-2507",
      "mistralai/Magistral-Small-2506",
      "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
    ],
    modulePath: "./generated/mistral_small_3_2.js",
  },
  {
    family: "mistral-small-24b",
    aliases: ["mistral_small_24b", "mistral-small-3.1", "mistral_small_3_1"],
    models: ["mistralai/Mistral-Small-24B-Base-2501", "mistralai/Mistral-Small-24B-Instruct-2501"],
    modulePath: "./generated/mistral_small_24b.js",
  },
  {
    family: "mixtral-8x7b",
    aliases: ["mixtral_8x7b"],
    models: ["mistralai/Mixtral-8x7B-v0.1"],
    modulePath: "./generated/mixtral_8x7b.js",
  },
] as const

/**
 * 注册 Mistral 子包内置的 family。
 * 输入：无。
 * 输出：Mistral 相关 family 被写入全局注册表。
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
