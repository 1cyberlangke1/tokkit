/**
 * Zyphra family 包公共入口。
 * 输入：Zyphra family 名称或其模型别名。
 * 输出：自动注册 Zyphra 内置 family，并复用 core 的公共 API。
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
    family: "zamba-7b-v1",
    aliases: ["zamba_7b_v1"],
    models: ["Zyphra/Zamba-7B-v1"],
    modulePath: "./generated/zamba_7b_v1.js",
  },
  {
    family: "zamba2-1.2b",
    aliases: ["zamba2_1_2b"],
    models: ["Zyphra/Zamba2-1.2B"],
    modulePath: "./generated/zamba2_1_2b.js",
  },
  {
    family: "zamba2-2.7b",
    aliases: ["zamba2_2_7b"],
    models: ["Zyphra/Zamba2-2.7B"],
    modulePath: "./generated/zamba2_2_7b.js",
  },
  {
    family: "zamba2-instruct",
    aliases: ["zamba2_instruct"],
    models: [
      "Zyphra/Zamba2-1.2B-instruct",
      "Zyphra/Zamba2-2.7B-instruct",
      "Zyphra/Zamba2-7B-Instruct",
    ],
    modulePath: "./generated/zamba2_instruct.js",
  },
  {
    family: "zamba2-instruct-v2",
    aliases: ["zamba2_instruct_v2"],
    models: [
      "Zyphra/Zamba2-1.2B-Instruct-v2",
      "Zyphra/Zamba2-2.7B-Instruct-v2",
      "Zyphra/Zamba2-7B-Instruct-v2",
    ],
    modulePath: "./generated/zamba2_instruct_v2.js",
  },
  {
    family: "zr1-1.5b",
    aliases: ["zr1_1_5b"],
    models: ["Zyphra/ZR1-1.5B"],
    modulePath: "./generated/zr1_1_5b.js",
  },
  {
    family: "zaya1",
    aliases: ["zaya1_base", "zaya1_reasoning_base"],
    models: ["Zyphra/ZAYA1-base", "Zyphra/ZAYA1-reasoning-base"],
    modulePath: "./generated/zaya1.js",
  },
] as const

/**
 * 注册 Zyphra 子包内置的 family。
 * 输入：无。
 * 输出：Zyphra 相关 family 被写入全局注册表。
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
