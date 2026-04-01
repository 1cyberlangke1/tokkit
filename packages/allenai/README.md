# @cyberlangke/tokkit-allenai

AllenAI OLMo family 的 tokkit 子包，只包含当前能用官方 `tokenizer.json` 直接验证的纯文本 tokenizer。

## 支持的 family

- `olmo`：覆盖 `OLMo-1B / OLMo-7B / OLMo-7B-0424 / OLMo-7B-Instruct`
- `olmo-1`：覆盖 `OLMo-1B-hf / OLMo-7B-hf / OLMo-7B-Twin-2T-hf`
- `olmo-0424`：覆盖 `OLMo-7B-0424-hf`
- `olmo-2`：覆盖 `OLMo-2-0425-1B / OLMo-2-0425-1B-Instruct / OLMo-2-1124-7B / OLMo-2-1124-7B-Instruct / OLMo-2-1124-13B / OLMo-2-1124-13B-Instruct / OLMo-2-0325-32B / OLMo-2-0325-32B-Instruct / Olmo-3-1025-7B / Olmo-3-1125-32B / Olmo-3-7B-Think / Olmo-3-32B-Think / Olmo-3.1-32B-Think`
- `olmo-3-instruct`：覆盖 `Olmo-3-7B-Instruct / Olmo-3.1-32B-Instruct / Olmo-Hybrid-Instruct-SFT-7B`
- `olmo-hybrid`：覆盖 `Olmo-Hybrid-7B`
- `olmo-hybrid-think`：覆盖 `Olmo-Hybrid-Think-SFT-7B`
- `olmoe`：覆盖 `OLMo-1B-0724-hf / OLMo-7B-0724-hf / OLMo-7B-0724-Instruct-hf / OLMo-7B-Instruct-hf / OLMoE-1B-7B-0924`
- `olmoe-instruct`：覆盖 `OLMoE-1B-7B-0924-Instruct`
- `olmoe-0125`：覆盖 `OLMoE-1B-7B-0125`
- `olmoe-0125-instruct`：覆盖 `OLMoE-1B-7B-0125-Instruct`

## 当前不纳入

- `olmOCR-*`
- `OlmoEarth-*`
- `OLMoASR`

这些仓库不是当前纯文本 LLM 主线。

- `*-GGUF`
- `*-preview`
- `*-DPO`
- `*-RLVR*`
- `*-RM*`
- `*-early-training`

这些仓库属于导出格式、训练中间态、评估 / 奖励模型或其他专项变体，不作为当前主线 tokenizer 的维护目标；如果后续确认需要支持，再单独复核。

额外说明：

- `Olmo-Hybrid-Instruct-SFT-7B`
- `Olmo-Hybrid-Think-SFT-7B`
- `OLMo-7B-Twin-2T-hf`
- `OLMo-7B-0724-Instruct-hf`

前两个 `SFT` 仓库已经显式纳入上面的 family 覆盖，因为它们当前属于 AllenAI 官方文本主线，且 tokenizer hash 与其他主线组存在独立分组。

后两个仓库虽然命名不同，但 tokenizer hash 已确认分别复用当前 `olmo-1` 与 `olmoe`，因此本轮按模型别名纳入，而不是新增 family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-allenai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-allenai"

const tokenizer = await getTokenizer("olmoe-0125-instruct")

console.log(tokenizer.vocabSize)
```
