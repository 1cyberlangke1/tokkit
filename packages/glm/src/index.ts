/**
 * glm family 包公共入口。
 * 输入：glm family 名称或其模型别名。
 * 输出：自动注册 glm 内置 family，并复用 core 的公共 API。
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
    family: "glm-4.7",
    aliases: [
      "glm4.7",
      "glm_4_7",
      "glm-4.5",
      "glm4.5",
      "glm_4_5",
      "glm-4.5-base",
      "glm4.5-base",
      "glm_4_5_base",
      "glm-4.5-air",
      "glm4.5-air",
      "glm_4_5_air",
      "glm-4.5-air-base",
      "glm4.5-air-base",
      "glm_4_5_air_base",
      "glm-4.6",
      "glm4.6",
      "glm_4_6",
    ],
    models: [
      "zai-org/GLM-4.5",
      "zai-org/GLM-4.5-Base",
      "zai-org/GLM-4.5-Air",
      "zai-org/GLM-4.5-Air-Base",
      "zai-org/GLM-4.6",
      "zai-org/GLM-4.7",
    ],
    modulePath: "./generated/glm_4_7.js",
  },
  {
    family: "glm-5",
    aliases: ["glm5", "glm_5", "glm-4.7-flash", "glm4.7-flash", "glm_4_7_flash"],
    models: ["zai-org/GLM-4.7-Flash", "zai-org/GLM-5"],
    modulePath: "./generated/glm_5.js",
  },
  {
    family: "glm-4-0414",
    aliases: ["glm4-0414", "glm_4_0414", "glm-z1", "glm_z1", "glm-z1-0414", "glm_z1_0414"],
    models: [
      "zai-org/GLM-4-9B-0414",
      "zai-org/GLM-4-32B-0414",
      "zai-org/GLM-4-32B-Base-0414",
      "zai-org/GLM-Z1-9B-0414",
      "zai-org/GLM-Z1-32B-0414",
      "zai-org/GLM-Z1-Rumination-32B-0414",
    ],
    modulePath: "./generated/glm_4_0414.js",
  },
] as const

/**
 * 注册 glm 子包内置的 family。
 * 输入：无。
 * 输出：glm 相关 family 被写入全局注册表。
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
