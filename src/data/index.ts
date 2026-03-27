/**
 * 内置 tokenizer family 注册入口。
 * 输入：无。
 * 输出：当前版本内置的 recent family 被注册到全局注册表。
 *
 * 预期行为：
 * - 每个 family 都通过动态 import 懒加载，只有真正使用时才会进入运行时内存。
 * - 同一 tokenizer family 可映射多个模型别名，方便外部按常见模型名直接调用。
 */

import { registerTokenizerFamily } from "../registry/store.js"
import { unpackPackedAsset } from "./packed.js"
import type { NormalizedTokenizerAsset } from "../types.js"

/**
 * 注册当前版本的内置 family。
 * 输入：无。
 * 输出：最近 8 个月内已核实的 tokenizer family 被写入注册表。
 */
export function registerBuiltins(): void {
  registerTokenizerFamily({
    family: "qwen3.5",
    aliases: ["qwen3_5"],
    models: ["Qwen/Qwen3.5-0.8B", "Qwen/Qwen3.5-27B", "Qwen/Qwen3.5-397B-A17B"],
    load: () => loadFamilyAsset("./generated/qwen3_5.js"),
  })

  registerTokenizerFamily({
    family: "qwen3-coder-next",
    aliases: ["qwen3_coder_next"],
    models: ["Qwen/Qwen3-Coder-Next"],
    load: () => loadFamilyAsset("./generated/qwen3_coder_next.js"),
  })

  registerTokenizerFamily({
    family: "deepseek-v3.1",
    aliases: ["deepseek_v3_1"],
    models: ["deepseek-ai/DeepSeek-V3.1"],
    load: () => loadFamilyAsset("./generated/deepseek_v3_1.js"),
  })

  registerTokenizerFamily({
    family: "deepseek-v3.2",
    aliases: ["deepseek_v3_2"],
    models: ["deepseek-ai/DeepSeek-V3.2"],
    load: () => loadFamilyAsset("./generated/deepseek_v3_2.js"),
  })

  registerTokenizerFamily({
    family: "glm-4.7",
    aliases: ["glm4.7", "glm_4_7"],
    models: ["zai-org/GLM-4.7"],
    load: () => loadFamilyAsset("./generated/glm_4_7.js"),
  })

  registerTokenizerFamily({
    family: "glm-5",
    aliases: ["glm5", "glm_5"],
    models: ["zai-org/GLM-5"],
    load: () => loadFamilyAsset("./generated/glm_5.js"),
  })

  registerTokenizerFamily({
    family: "step-3.5-flash",
    aliases: ["step3.5-flash", "step_3_5_flash"],
    models: ["stepfun-ai/Step-3.5-Flash"],
    load: () => loadFamilyAsset("./generated/step_3_5_flash.js"),
  })
}

/**
 * 按模块路径懒加载单个 family 资产。
 * 输入：静态 family 模块路径。
 * 输出：该 family 的 TokenizerAsset。
 */
async function loadFamilyAsset(modulePath: string): Promise<NormalizedTokenizerAsset> {
  const module = (await import(modulePath)) as { default: string }
  return unpackPackedAsset(module.default)
}
