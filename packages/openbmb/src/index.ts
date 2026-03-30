/**
 * OpenBMB family 包公共入口。
 * 输入：OpenBMB family 名称或其模型别名。
 * 输出：自动注册 OpenBMB 内置 family，并复用 core 的公共 API。
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
    family: "agentcpm-explore",
    aliases: ["agentcpm_explore"],
    models: ["openbmb/AgentCPM-Explore"],
    modulePath: "./generated/agentcpm_explore.js",
  },
  {
    family: "minicpm-s-1b",
    aliases: ["minicpm_s_1b"],
    models: ["openbmb/MiniCPM-S-1B-sft"],
    modulePath: "./generated/minicpm_s_1b.js",
  },
  {
    family: "minicpm-sala",
    aliases: ["minicpm_sala"],
    models: ["openbmb/MiniCPM-SALA"],
    modulePath: "./generated/minicpm_sala.js",
  },
  {
    family: "minicpm3",
    aliases: ["minicpm_3"],
    models: ["openbmb/MiniCPM3-4B"],
    modulePath: "./generated/minicpm3.js",
  },
  {
    family: "minicpm4",
    aliases: ["minicpm_4"],
    models: [
      "openbmb/MiniCPM4-0.5B",
      "openbmb/MiniCPM4-8B",
      "openbmb/MiniCPM4.1-8B",
      "openbmb/AgentCPM-Report",
      "openbmb/BitCPM4-0.5B",
      "openbmb/BitCPM4-1B",
      "openbmb/MiniCPM4-MCP",
      "openbmb/MiniCPM4-Survey",
      "openbmb/NOSA-1B",
      "openbmb/NOSA-3B",
      "openbmb/NOSA-8B",
    ],
    modulePath: "./generated/minicpm4.js",
  },
  {
    family: "minicpm-moe",
    aliases: ["minicpm_moe"],
    models: ["openbmb/MiniCPM-MoE-8x2B"],
    modulePath: "./generated/minicpm_moe.js",
  },
] as const

/**
 * 注册 OpenBMB 子包内置的 family。
 * 输入：无。
 * 输出：OpenBMB 相关 family 被写入全局注册表。
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
