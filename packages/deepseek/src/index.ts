/**
 * deepseek family 包公共入口。
 * 输入：deepseek family 名称或其模型别名。
 * 输出：自动注册 deepseek 内置 family，并复用 core 的公共 API。
 */

import { registerTokenizerFamily, unpackPackedAsset } from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/**
 * 注册 deepseek 子包内置的 family。
 * 输入：无。
 * 输出：deepseek 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerTokenizerFamily({
    family: "deepseek-v3.1",
    aliases: ["deepseek_v3_1"],
    models: ["deepseek-ai/DeepSeek-V3.1"],
    load: () => loadFamilyAsset("./generated/deepseek_v3_1.js"),
  })

  registerTokenizerFamily({
    family: "deepseek-v3.2",
    aliases: ["deepseek_v3_2"],
    models: ["deepseek-ai/DeepSeek-V3.2"],
    load: () => loadFamilyAsset("./generated/deepseek_v3_2.js"),
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
