/**
 * EleutherAI family 包公共入口。
 * 输入：EleutherAI family 名称或其模型别名。
 * 输出：自动注册 EleutherAI 内置 family，并复用 core 的公共 API。
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
    family: "gpt-neo",
    aliases: ["gpt_neo", "gpt-j", "gpt_j"],
    models: [
      "EleutherAI/gpt-neo-125m",
      "EleutherAI/gpt-neo-1.3B",
      "EleutherAI/gpt-neo-2.7B",
      "EleutherAI/gpt-j-6b",
    ],
    modulePath: "./generated/gpt_neo.js",
  },
  {
    family: "pythia",
    aliases: ["pythia_6_9b", "gpt-neox", "gpt_neox"],
    models: [
      "EleutherAI/gpt-neox-20b",
      "EleutherAI/pythia-14m",
      "EleutherAI/pythia-14m-deduped",
      "EleutherAI/pythia-31m-deduped",
      "EleutherAI/pythia-70m",
      "EleutherAI/pythia-160m",
      "EleutherAI/pythia-410m",
      "EleutherAI/pythia-1b",
      "EleutherAI/pythia-1.4b",
      "EleutherAI/pythia-2.8b",
      "EleutherAI/pythia-6.9b",
      "EleutherAI/pythia-12b",
      "EleutherAI/pythia-70m-deduped",
      "EleutherAI/pythia-160m-deduped",
      "EleutherAI/pythia-410m-deduped",
      "EleutherAI/pythia-1b-deduped",
      "EleutherAI/pythia-1.4b-deduped",
      "EleutherAI/pythia-2.8b-deduped",
      "EleutherAI/pythia-6.9b-deduped",
      "EleutherAI/pythia-12b-deduped",
    ],
    modulePath: "./generated/pythia.js",
  },
  {
    family: "polyglot-ko",
    aliases: ["polyglot_ko"],
    models: [
      "EleutherAI/polyglot-ko-1.3b",
      "EleutherAI/polyglot-ko-3.8b",
      "EleutherAI/polyglot-ko-5.8b",
    ],
    modulePath: "./generated/polyglot_ko.js",
  },
  {
    family: "polyglot-ko-12.8",
    aliases: ["polyglot_ko_12_8"],
    models: ["EleutherAI/polyglot-ko-12.8b"],
    modulePath: "./generated/polyglot_ko_12_8.js",
  },
] as const

/**
 * 注册 EleutherAI 子包内置的 family，可按 family 名称过滤。
 * 输入：可选的 family 名称列表。
 * 输出：选中的 EleutherAI family 被写入全局注册表。
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
 * 注册 EleutherAI 子包内置的全部 family。
 * 输入：无。
 * 输出：EleutherAI 相关 family 被写入全局注册表。
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
