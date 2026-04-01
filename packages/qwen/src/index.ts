/**
 * qwen family 包公共入口。
 * 输入：qwen family 名称或其模型别名。
 * 输出：自动注册 qwen 内置 family，并复用 core 的公共 API。
 */

import { registerTokenizerFamily, unpackPackedAsset } from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"

export * from "@cyberlangke/tokkit-core"

/**
 * 当前子包内置 family 的声明表。
 * 输入：无。
 * 输出：供 registerBuiltins 批量注册的稳定 family 配置。
 */
const BUILTIN_FAMILIES = [
  {
    family: "qwen2",
    aliases: ["qwen2_0"],
    models: [
      "Qwen/Qwen2-0.5B",
      "Qwen/Qwen2-0.5B-Instruct",
      "Qwen/Qwen2-1.5B",
      "Qwen/Qwen2-1.5B-Instruct",
      "Qwen/Qwen2-7B",
      "Qwen/Qwen2-7B-Instruct",
    ],
    modulePath: "./generated/qwen2.js",
  },
  {
    family: "qwen2.5",
    aliases: ["qwen2_5", "qwen3-base", "qwq-32b-preview"],
    models: [
      "Qwen/Qwen2.5-0.5B",
      "Qwen/Qwen2.5-0.5B-Instruct",
      "Qwen/Qwen2.5-1.5B",
      "Qwen/Qwen2.5-1.5B-Instruct",
      "Qwen/Qwen2.5-7B",
      "Qwen/Qwen2.5-7B-Instruct",
      "Qwen/Qwen2.5-14B",
      "Qwen/Qwen2.5-14B-Instruct",
      "Qwen/Qwen2.5-32B",
      "Qwen/Qwen2.5-32B-Instruct",
      "Qwen/Qwen2.5-7B-Instruct-1M",
      "Qwen/Qwen2.5-14B-Instruct-1M",
      "Qwen/Qwen2.5-Coder-0.5B",
      "Qwen/Qwen2.5-Coder-0.5B-Instruct",
      "Qwen/Qwen2.5-Coder-1.5B",
      "Qwen/Qwen2.5-Coder-1.5B-Instruct",
      "Qwen/Qwen2.5-Coder-7B",
      "Qwen/Qwen2.5-Coder-7B-Instruct",
      "Qwen/Qwen2.5-Coder-14B",
      "Qwen/Qwen2.5-Coder-14B-Instruct",
      "Qwen/Qwen2.5-Coder-32B",
      "Qwen/Qwen2.5-Coder-32B-Instruct",
      "Qwen/Qwen2.5-Math-1.5B",
      "Qwen/Qwen2.5-Math-1.5B-Instruct",
      "Qwen/Qwen2.5-Math-7B",
      "Qwen/Qwen2.5-Math-7B-Instruct",
      "Qwen/QwQ-32B-Preview",
      "Qwen/Qwen3-0.6B-Base",
      "Qwen/Qwen3-1.7B-Base",
      "Qwen/Qwen3-4B-Base",
      "Qwen/Qwen3-8B-Base",
      "Qwen/Qwen3-14B-Base",
    ],
    modulePath: "./generated/qwen2_5.js",
  },
  {
    family: "qwen3",
    aliases: ["qwen_3"],
    models: [
      "Qwen/Qwen3-0.6B",
      "Qwen/Qwen3-1.7B",
      "Qwen/Qwen3-4B",
      "Qwen/Qwen3-8B",
      "Qwen/Qwen3-14B",
      "Qwen/Qwen3-30B-A3B",
      "Qwen/Qwen3-32B",
      "Qwen/Qwen3-235B-A22B",
      "Qwen/Qwen3-4B-Instruct-2507",
      "Qwen/Qwen3-30B-A3B-Instruct-2507",
      "Qwen/Qwen3-235B-A22B-Instruct-2507",
      "Qwen/Qwen3-4B-Thinking-2507",
      "Qwen/Qwen3-Next-80B-A3B-Instruct",
      "Qwen/Qwen3-Next-80B-A3B-Thinking",
    ],
    modulePath: "./generated/qwen3.js",
  },
  {
    family: "qwen3.5",
    aliases: ["qwen3_5"],
    models: [
      "Qwen/Qwen3.5-0.8B",
      "Qwen/Qwen3.5-2B",
      "Qwen/Qwen3.5-4B",
      "Qwen/Qwen3.5-9B",
      "Qwen/Qwen3.5-27B",
      "Qwen/Qwen3.5-35B-A3B",
      "Qwen/Qwen3.5-122B-A10B",
      "Qwen/Qwen3.5-397B-A17B",
    ],
    modulePath: "./generated/qwen3_5.js",
  },
  {
    family: "qwen3.5-base",
    aliases: ["qwen3_5_base"],
    models: [
      "Qwen/Qwen3.5-0.8B-Base",
      "Qwen/Qwen3.5-2B-Base",
      "Qwen/Qwen3.5-4B-Base",
      "Qwen/Qwen3.5-9B-Base",
      "Qwen/Qwen3.5-35B-A3B-Base",
    ],
    modulePath: "./generated/qwen3_5_base.js",
  },
  {
    family: "qwen3-coder-next",
    aliases: ["qwen3_coder_next", "qwen3-coder", "qwq-32b"],
    models: [
      "Qwen/Qwen3-Coder-Next",
      "Qwen/Qwen3-Coder-Next-Base",
      "Qwen/Qwen3-Coder-30B-A3B-Instruct",
      "Qwen/Qwen3-Coder-480B-A35B-Instruct",
      "Qwen/Qwen3-30B-A3B-Thinking-2507",
      "Qwen/Qwen3-235B-A22B-Thinking-2507",
      "Qwen/QwQ-32B",
    ],
    modulePath: "./generated/qwen3_coder_next.js",
  },
] as const

/**
 * 注册 qwen 子包内置的 family，可按 family 名称过滤。
 * 输入：可选的 family 名称列表。
 * 输出：选中的 qwen family 被写入全局注册表。
 */
export function registerBuiltinsForFamilies(families?: readonly string[]): void {
  const allowedFamilies = families ? new Set(families) : null

  for (const spec of BUILTIN_FAMILIES) {
    if (allowedFamilies && !allowedFamilies.has(spec.family)) {
      continue
    }

    registerTokenizerFamily({
      family: spec.family,
      aliases: [...spec.aliases],
      models: [...spec.models],
      load: () => loadFamilyAsset(spec.modulePath),
    })
  }
}

/**
 * 注册 qwen 子包内置的全部 family。
 * 输入：无。
 * 输出：qwen 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerBuiltinsForFamilies()
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
