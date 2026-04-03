/**
 * PrimeIntellect alias 包公共入口。
 * 输入：PrimeIntellect 官方模型名。
 * 输出：注册 PrimeIntellect 模型别名，并复用已有 bitnet-b1.58-2b-4t family。
 */

import { registerModelAliases } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies } from "@cyberlangke/tokkit-microsoft"

export * from "@cyberlangke/tokkit-core"

/**
 * PrimeIntellect 当前纳入的官方模型别名。
 * 输入：无。
 * 输出：映射到现有 bitnet-b1.58-2b-4t family 的稳定模型名列表。
 */
const PRIMEINTELLECT_MODELS = [
  "PrimeIntellect/INTELLECT-1",
  "PrimeIntellect/INTELLECT-1-Instruct",
] as const

/**
 * 注册 PrimeIntellect 模型别名。
 * 输入：无。
 * 输出：PrimeIntellect 模型可通过现有 bitnet-b1.58-2b-4t family 访问。
 */
export function registerBuiltins(): void {
  registerBuiltinsForFamilies(["bitnet-b1.58-2b-4t"])
  registerModelAliases("bitnet-b1.58-2b-4t", [...PRIMEINTELLECT_MODELS])
}

registerBuiltins()
