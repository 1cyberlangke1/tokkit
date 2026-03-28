/**
 * tokkit 全量包公共入口。
 * 输入：全部内置 family 的 family 名称或模型别名。
 * 输出：自动注册所有内置 family，并暴露完整 tokenizer API。
 */

import { registerBuiltins as registerDeepseekBuiltins } from "@cyberlangke/tokkit-deepseek"
import { registerBuiltins as registerGlmBuiltins } from "@cyberlangke/tokkit-glm"
import { registerBuiltins as registerQwenBuiltins } from "@cyberlangke/tokkit-qwen"
import { registerBuiltins as registerStepBuiltins } from "@cyberlangke/tokkit-step"

export * from "@cyberlangke/tokkit-core"

/**
 * 注册全部内置 family。
 * 输入：无。
 * 输出：所有内置 family 都被写入全局注册表。
 */
export function registerBuiltins(): void {
  registerQwenBuiltins()
  registerDeepseekBuiltins()
  registerGlmBuiltins()
  registerStepBuiltins()
}

registerBuiltins()
