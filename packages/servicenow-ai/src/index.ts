/**
 * ServiceNow-AI family 包公共入口。
 * 输入：ServiceNow-AI family 名称或其模型别名。
 * 输出：自动注册 ServiceNow-AI 内置 family，并复用 core 的公共 API。
 */

import { registerTokenizerFamily, unpackPackedAsset } from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/**
 * 注册 ServiceNow-AI 子包内置的 family。
 * 输入：无。
 * 输出：ServiceNow-AI 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerTokenizerFamily({
    family: "apriel-5b",
    aliases: ["apriel_5b"],
    models: ["ServiceNow-AI/Apriel-5B-Base", "ServiceNow-AI/Apriel-5B-Instruct"],
    load: () => loadFamilyAsset("./generated/apriel_5b.js"),
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
