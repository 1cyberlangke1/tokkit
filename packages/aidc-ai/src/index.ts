/**
 * AIDC-AI family 包公共入口。
 * 输入：AIDC-AI family 名称或其模型别名。
 * 输出：自动注册 AIDC-AI 内置 family，并复用 core 的公共 API。
 */

import {
  registerModelAliases,
  registerTokenizerFamily,
  unpackPackedAsset,
} from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies as registerQwenBuiltinsForFamilies } from "@cyberlangke/tokkit-qwen"

export * from "@cyberlangke/tokkit-core"

/**
 * 当前子包内置新 family 的声明表。
 * 输入：无。
 * 输出：供 registerBuiltins 批量注册的稳定 family 配置。
 */
const BUILTIN_FAMILIES = [
  {
    family: "marco-o1",
    aliases: ["marco_o1"],
    models: ["AIDC-AI/Marco-o1"],
    modulePath: "./generated/marco_o1.js",
  },
] as const

/**
 * 当前复用 `qwen2` family 的 AIDC-AI 官方模型别名。
 * 输入：无。
 * 输出：映射到现有 `qwen2` 的稳定模型名列表。
 */
const QWEN2_MODELS = ["AIDC-AI/Marco-LLM-ES"] as const

/**
 * 当前复用 `qwen2.5` family 的 AIDC-AI 官方模型别名。
 * 输入：无。
 * 输出：映射到现有 `qwen2.5` 的稳定模型名列表。
 */
const QWEN25_MODELS = [
  "AIDC-AI/Marco-Nano-Instruct",
  "AIDC-AI/Marco-Mini-Global-Base",
  "AIDC-AI/Marco-Mini-Base",
  "AIDC-AI/Marco-Nano-Base",
  "AIDC-AI/Marco-LLM-SEA",
  "AIDC-AI/Marco-LLM-AR-V4",
  "AIDC-AI/Marco-LLM-AR-V2",
] as const

/**
 * 注册 AIDC-AI 子包内置的 family。
 * 输入：无。
 * 输出：AIDC-AI 相关 family 与模型别名被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerQwenBuiltinsForFamilies(["qwen2", "qwen2.5"])

  registerModelAliases("qwen2", [...QWEN2_MODELS])
  registerModelAliases("qwen2.5", [...QWEN25_MODELS])

  for (const spec of BUILTIN_FAMILIES) {
    registerTokenizerFamily({
      family: spec.family,
      aliases: [...spec.aliases],
      models: [...spec.models],
      load: () => loadFamilyAsset(spec.modulePath),
    })
  }
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
