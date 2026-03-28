/**
 * ByteDance-Seed family 包公共入口。
 * 输入：ByteDance-Seed family 名称或其模型别名。
 * 输出：自动注册 ByteDance-Seed 内置 family，并复用 core 的公共 API。
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
    family: "academic-ds",
    aliases: ["academic-ds-9b", "academic_ds"],
    models: ["ByteDance-Seed/academic-ds-9B"],
    modulePath: "./generated/academic_ds.js",
  },
  {
    family: "seed-oss",
    aliases: ["seed-oss-36b", "seed_oss"],
    models: [
      "ByteDance-Seed/Seed-OSS-36B-Base",
      "ByteDance-Seed/Seed-OSS-36B-Instruct",
      "ByteDance-Seed/Seed-OSS-36B-Base-woSyn",
    ],
    modulePath: "./generated/seed_oss.js",
  },
  {
    family: "seed-coder",
    aliases: ["seed-coder-8b", "seed_coder"],
    models: [
      "ByteDance-Seed/Seed-Coder-8B-Base",
      "ByteDance-Seed/Seed-Coder-8B-Instruct",
      "ByteDance-Seed/Seed-Coder-8B-Reasoning",
    ],
    modulePath: "./generated/seed_coder.js",
  },
  {
    family: "stable-diffcoder",
    aliases: ["stable-diffcoder-8b", "stable_diffcoder"],
    models: [
      "ByteDance-Seed/Stable-DiffCoder-8B-Base",
      "ByteDance-Seed/Stable-DiffCoder-8B-Instruct",
    ],
    modulePath: "./generated/stable_diffcoder.js",
  },
] as const

/**
 * 注册 ByteDance-Seed 子包内置的 family。
 * 输入：无。
 * 输出：ByteDance-Seed 相关 family 被写入全局注册表。
 */
export function registerBuiltins(): void {
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
