/**
 * Baichuan alias 包公共入口。
 * 输入：Baichuan 官方模型名。
 * 输出：注册 Baichuan 模型别名，并复用已有 qwen3 family。
 */

import { registerModelAliases } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies } from "@cyberlangke/tokkit-qwen"

export * from "@cyberlangke/tokkit-core"

/**
 * Baichuan 当前纳入的官方模型别名。
 * 输入：无。
 * 输出：映射到现有 qwen3 family 的稳定模型名列表。
 */
const BAICHUAN_MODELS = [
  "baichuan-inc/Baichuan-M2-32B",
  "baichuan-inc/Baichuan-M3-235B",
] as const

/**
 * 注册 Baichuan 模型别名。
 * 输入：无。
 * 输出：Baichuan 模型可通过现有 qwen3 family 访问。
 */
export function registerBuiltins(): void {
  registerBuiltinsForFamilies(["qwen3"])
  registerModelAliases("qwen3", [...BAICHUAN_MODELS])
}

registerBuiltins()
