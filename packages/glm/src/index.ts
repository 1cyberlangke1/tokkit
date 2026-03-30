/**
 * glm family 包公共入口。
 * 输入：glm family 名称或其模型别名。
 * 输出：自动注册 glm 内置 family，并复用 core 的公共 API。
 */

import { registerTokenizerFamily, unpackPackedAsset } from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/**
 * 注册 glm 子包内置的 family。
 * 输入：无。
 * 输出：glm 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerTokenizerFamily({
    family: "glm-4.7",
    aliases: [
      "glm4.7",
      "glm_4_7",
      "glm-4.5",
      "glm4.5",
      "glm_4_5",
      "glm-4.5-base",
      "glm-4.5-air",
      "glm-4.5-air-base",
      "glm-4.6",
    ],
    models: [
      "zai-org/GLM-4.5",
      "zai-org/GLM-4.5-Base",
      "zai-org/GLM-4.5-Air",
      "zai-org/GLM-4.5-Air-Base",
      "zai-org/GLM-4.6",
      "zai-org/GLM-4.7",
    ],
    load: () => loadFamilyAsset("./generated/glm_4_7.js"),
  })

  registerTokenizerFamily({
    family: "glm-5",
    aliases: ["glm5", "glm_5", "glm-4.7-flash", "glm4.7-flash", "glm_4_7_flash"],
    models: ["zai-org/GLM-4.7-Flash", "zai-org/GLM-5"],
    load: () => loadFamilyAsset("./generated/glm_5.js"),
  })
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
