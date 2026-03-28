/**
 * qwen family 包公共入口。
 * 输入：qwen family 名称或其模型别名。
 * 输出：自动注册 qwen 内置 family，并复用 core 的公共 API。
 */

import { registerTokenizerFamily, unpackPackedAsset } from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/**
 * 注册 qwen 子包内置的 family。
 * 输入：无。
 * 输出：qwen 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerTokenizerFamily({
    family: "qwen3.5",
    aliases: ["qwen3_5"],
    models: ["Qwen/Qwen3.5-0.8B", "Qwen/Qwen3.5-27B", "Qwen/Qwen3.5-397B-A17B"],
    load: () => loadFamilyAsset("./generated/qwen3_5.js"),
  })

  registerTokenizerFamily({
    family: "qwen3-coder-next",
    aliases: ["qwen3_coder_next"],
    models: ["Qwen/Qwen3-Coder-Next"],
    load: () => loadFamilyAsset("./generated/qwen3_coder_next.js"),
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
