/**
 * tokkit 全量包公共入口。
 * 输入：全部内置 family 的 family 名称或模型别名。
 * 输出：自动注册所有内置 family，并暴露完整 tokenizer API。
 */

import { registerBuiltins as registerDeepseekBuiltins } from "@cyberlangke/tokkit-deepseek"
import { registerBuiltins as register01AIBuiltins } from "@cyberlangke/tokkit-01-ai"
import { registerBuiltins as registerTiiuaeBuiltins } from "@cyberlangke/tokkit-tiiuae"
import { registerBuiltins as registerEleutherAIBuiltins } from "@cyberlangke/tokkit-eleutherai"
import { registerBuiltins as registerLongCatBuiltins } from "@cyberlangke/tokkit-meituan-longcat"
import { registerBuiltins as registerMiMoBuiltins } from "@cyberlangke/tokkit-xiaomi-mimo"
import { registerBuiltins as registerMicrosoftBuiltins } from "@cyberlangke/tokkit-microsoft"
import { registerBuiltins as registerMistralBuiltins } from "@cyberlangke/tokkit-mistral"
import { registerBuiltins as registerHuggingFaceTBBuiltins } from "@cyberlangke/tokkit-huggingface-tb"
import { registerBuiltins as registerAllenAIBuiltins } from "@cyberlangke/tokkit-allenai"
import { registerBuiltins as registerGraniteBuiltins } from "@cyberlangke/tokkit-ibm-granite"
import { registerBuiltins as registerH2OAIBuiltins } from "@cyberlangke/tokkit-h2oai"
import { registerBuiltins as registerUpstageBuiltins } from "@cyberlangke/tokkit-upstage"
import { registerBuiltins as registerOpenAIBuiltins } from "@cyberlangke/tokkit-openai"
import { registerBuiltins as registerByteDanceSeedBuiltins } from "@cyberlangke/tokkit-bytedance-seed"
import { registerBuiltins as registerOpenBMBBuiltins } from "@cyberlangke/tokkit-openbmb"
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
  register01AIBuiltins()
  registerTiiuaeBuiltins()
  registerEleutherAIBuiltins()
  registerLongCatBuiltins()
  registerMiMoBuiltins()
  registerMicrosoftBuiltins()
  registerMistralBuiltins()
  registerHuggingFaceTBBuiltins()
  registerAllenAIBuiltins()
  registerGraniteBuiltins()
  registerH2OAIBuiltins()
  registerUpstageBuiltins()
  registerOpenAIBuiltins()
  registerByteDanceSeedBuiltins()
  registerOpenBMBBuiltins()
  registerQwenBuiltins()
  registerDeepseekBuiltins()
  registerGlmBuiltins()
  registerStepBuiltins()
}

registerBuiltins()
