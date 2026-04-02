/**
 * InternLM family 包公共入口。
 * 输入：InternLM family 名称或其模型别名。
 * 输出：自动注册 InternLM 内置 family，并复用 core 的公共 API。
 */

import {
  registerModelAliases,
  registerTokenizerFamily,
  unpackPackedAsset,
} from "@cyberlangke/tokkit-core"
import type { NormalizedTokenizerAsset } from "@cyberlangke/tokkit-core"
import { registerBuiltinsForFamilies as registerH2OAIFamilies } from "@cyberlangke/tokkit-h2oai"

export * from "@cyberlangke/tokkit-core"

const BUILTIN_FAMILIES = [
  {
    family: "internlm2.5-1.8b",
    aliases: ["internlm2_5_1_8b"],
    models: ["internlm/internlm2_5-1_8b"],
    modulePath: "./generated/internlm2_5_1_8b.js",
  },
  {
    family: "internlm2.5-20b",
    aliases: ["internlm2_5_20b"],
    models: ["internlm/internlm2_5-20b"],
    modulePath: "./generated/internlm2_5_20b.js",
  },
  {
    family: "internlm3",
    aliases: ["internlm3_8b_instruct"],
    models: ["internlm/internlm3-8b-instruct"],
    modulePath: "./generated/internlm3.js",
  },
] as const

const DANUBE_MODEL_ALIASES = ["internlm/AlchemistCoder-L-7B"] as const

export function registerBuiltins(): void {
  for (const spec of BUILTIN_FAMILIES) {
    registerTokenizerFamily({
      family: spec.family,
      aliases: [...spec.aliases],
      models: [...spec.models],
      load: () => loadFamilyAsset(spec.modulePath),
    })
  }

  registerH2OAIFamilies(["danube"])
  registerModelAliases("danube", [...DANUBE_MODEL_ALIASES])
}

async function loadFamilyAsset(modulePath: string): Promise<NormalizedTokenizerAsset> {
  const module = (await import(modulePath)) as { default: string }
  return unpackPackedAsset(module.default)
}

registerBuiltins()
