/**
 * Stability AI alias 包公共入口。
 * 输入：Stability AI 官方模型名。
 * 输出：注册 Stability AI 模型别名，并复用已有 canonical family。
 */

import { registerModelAliases } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies as registerGraniteBuiltinsForFamilies } from "@cyberlangke/tokkit-ibm-granite"
import { registerBuiltinsForFamilies as registerMistralBuiltinsForFamilies } from "@cyberlangke/tokkit-mistral"
import { registerBuiltinsForFamilies as registerStateSpacesBuiltinsForFamilies } from "@cyberlangke/tokkit-state-spaces"

export * from "@cyberlangke/tokkit-core"

/**
 * Stability AI 当前复用 `mamba-790m` family 的官方模型别名。
 * 输入：无。
 * 输出：映射到现有 `mamba-790m` 的稳定模型名列表。
 */
const MAMBA_790M_MODELS = [
  "stabilityai/japanese-stablelm-3b-4e1t-base",
  "stabilityai/japanese-stablelm-3b-4e1t-instruct",
] as const

/**
 * Stability AI 当前复用 `mistral-7b-v0.1` family 的官方模型别名。
 * 输入：无。
 * 输出：映射到现有 `mistral-7b-v0.1` 的稳定模型名列表。
 */
const MISTRAL_7B_V0_1_MODELS = [
  "stabilityai/japanese-stablelm-base-gamma-7b",
  "stabilityai/japanese-stablelm-instruct-gamma-7b",
] as const

/**
 * Stability AI 当前复用 `granite-code-base` family 的官方模型别名。
 * 输入：无。
 * 输出：映射到现有 `granite-code-base` 的稳定模型名列表。
 */
const GRANITE_CODE_BASE_MODELS = [
  "stabilityai/stablecode-completion-alpha-3b",
  "stabilityai/stablecode-completion-alpha-3b-4k",
] as const

/**
 * 注册 Stability AI 模型别名。
 * 输入：无。
 * 输出：Stability AI 模型可通过现有 canonical family 访问。
 */
export function registerBuiltins(): void {
  registerStateSpacesBuiltinsForFamilies(["mamba-790m"])
  registerMistralBuiltinsForFamilies(["mistral-7b-v0.1"])
  registerGraniteBuiltinsForFamilies(["granite-code-base"])

  registerModelAliases("mamba-790m", [...MAMBA_790M_MODELS])
  registerModelAliases("mistral-7b-v0.1", [...MISTRAL_7B_V0_1_MODELS])
  registerModelAliases("granite-code-base", [...GRANITE_CODE_BASE_MODELS])
}

registerBuiltins()
