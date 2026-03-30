/**
 * step family 包公共入口。
 * 输入：step family 名称或其模型别名。
 * 输出：自动注册 step 内置 family，并复用 core 的公共 API。
 */

import { registerTokenizerFamily, unpackPackedAsset } from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/**
 * 注册 step 子包内置的 family。
 * 输入：无。
 * 输出：step 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerTokenizerFamily({
    family: "step-3.5-flash",
    aliases: ["step3.5-flash", "step_3_5_flash"],
    models: ["stepfun-ai/Step-3.5-Flash", "stepfun-ai/Step-3.5-Flash-Base-Midtrain"],
    load: () => loadFamilyAsset("./generated/step_3_5_flash.js"),
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
