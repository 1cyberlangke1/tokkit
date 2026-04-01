/**
 * TinyLlama alias 包公共入口。
 * 输入：TinyLlama 官方模型名。
 * 输出：注册 TinyLlama 模型别名，并复用已有 danube family。
 */

import { registerModelAliases } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies } from "@cyberlangke/tokkit-h2oai"

export * from "@cyberlangke/tokkit-core"

/**
 * TinyLlama 当前纳入的官方模型别名。
 * 输入：无。
 * 输出：映射到现有 danube family 的稳定模型名列表。
 */
const TINYLLAMA_MODELS = [
  "TinyLlama/TinyLlama_v1.1",
  "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
] as const

/**
 * 注册 TinyLlama 模型别名。
 * 输入：无。
 * 输出：TinyLlama 模型可通过现有 danube family 访问。
 */
export function registerBuiltins(): void {
  registerBuiltinsForFamilies(["danube"])
  registerModelAliases("danube", [...TINYLLAMA_MODELS])
}

registerBuiltins()
