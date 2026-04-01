/**
 * JanHQ alias 包公共入口。
 * 输入：Jan 官方模型名。
 * 输出：注册 Jan 模型别名，并复用已有 qwen3 family。
 */

import { registerModelAliases } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies } from "@cyberlangke/tokkit-qwen"

export * from "@cyberlangke/tokkit-core"

/**
 * Jan 当前纳入的官方模型别名。
 * 输入：无。
 * 输出：映射到现有 qwen3 family 的稳定模型名列表。
 */
const JANHQ_MODELS = [
  "janhq/Jan-v1-4B",
  "janhq/Jan-v1-edge",
  "janhq/Jan-v1-2509",
  "janhq/Jan-v3-4B-base-instruct",
  "janhq/Jan-v3.5-4B",
  "janhq/Jan-code-4b",
] as const

/**
 * 注册 Jan 模型别名。
 * 输入：无。
 * 输出：Jan 模型可通过现有 qwen3 family 访问。
 */
export function registerBuiltins(): void {
  registerBuiltinsForFamilies(["qwen3"])
  registerModelAliases("qwen3", [...JANHQ_MODELS])
}

registerBuiltins()
