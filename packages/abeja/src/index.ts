/**
 * ABEJA alias 包公共入口。
 * 输入：ABEJA 官方模型名。
 * 输出：注册 ABEJA 模型别名，并复用已有 qwen family。
 */

import { registerModelAliases } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies } from "@cyberlangke/tokkit-qwen"

export * from "@cyberlangke/tokkit-core"

/**
 * ABEJA 当前纳入的 qwen2.5 模型别名。
 * 输入：无。
 * 输出：映射到现有 qwen2.5 family 的稳定模型名列表。
 */
const ABEJA_QWEN25_MODELS = [
  "abeja/ABEJA-Qwen2.5-32b-Japanese-v1.0",
  "abeja/ABEJA-Qwen2.5-7b-Japanese-v0.1",
  "abeja/ABEJA-QwQ32b-Reasoning-Japanese-v1.0",
] as const

/**
 * ABEJA 当前纳入的 qwen3 模型别名。
 * 输入：无。
 * 输出：映射到现有 qwen3 family 的稳定模型名列表。
 */
const ABEJA_QWEN3_MODELS = ["abeja/ABEJA-Qwen3-14B-Agentic-256k-v0.1"] as const

/**
 * 注册 ABEJA 模型别名。
 * 输入：无。
 * 输出：ABEJA 模型可通过现有 qwen2.5 / qwen3 family 访问。
 */
export function registerBuiltins(): void {
  registerBuiltinsForFamilies(["qwen2.5", "qwen3"])
  registerModelAliases("qwen2.5", [...ABEJA_QWEN25_MODELS])
  registerModelAliases("qwen3", [...ABEJA_QWEN3_MODELS])
}

registerBuiltins()
