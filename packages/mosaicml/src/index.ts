/**
 * MosaicML alias 包公共入口。
 * 输入：MosaicML 官方模型名。
 * 输出：注册 MosaicML 模型别名，并复用已有 pythia family。
 */

import { registerModelAliases } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies } from "@cyberlangke/tokkit-eleutherai"

export * from "@cyberlangke/tokkit-core"

/**
 * MosaicML 当前纳入的官方模型别名。
 * 输入：无。
 * 输出：映射到现有 pythia family 的稳定模型名列表。
 */
const MOSAICML_MODELS = [
  "mosaicml/mpt-7b",
  "mosaicml/mpt-7b-8k",
  "mosaicml/mpt-7b-storywriter",
  "mosaicml/mpt-30b",
] as const

/**
 * 注册 MosaicML 模型别名。
 * 输入：无。
 * 输出：MosaicML 模型可通过现有 pythia family 访问。
 */
export function registerBuiltins(): void {
  registerBuiltinsForFamilies(["pythia"])
  registerModelAliases("pythia", [...MOSAICML_MODELS])
}

registerBuiltins()
