# @cyberlangke/tokkit-microsoft

Microsoft 官方 tokenizer 的 tokkit 子包，只包含当前 MIT 兼容、且能用官方 tokenizer 资产直接验证的纯文本 tokenizer。

## 支持的 family

- `bitnet-b1.58-2b-4t`：覆盖 `bitnet-b1.58-2B-4T`
- `phi-1`：覆盖 `phi-1 / phi-1_5 / phi-2`
- `phi-3-mini`：覆盖 `Phi-3-mini-4k-instruct / Phi-3-mini-128k-instruct`
- `phi-3-medium`：覆盖 `Phi-3-medium-4k-instruct / Phi-3-medium-128k-instruct`
- `phi-3.5`：覆盖 `Phi-3.5-mini-instruct / Phi-3.5-MoE-instruct`
- `phi-moe`：覆盖 `Phi-mini-MoE-instruct / Phi-tiny-MoE-instruct`
- `phi-4`：覆盖 `phi-4`
- `phi-4-mini`：覆盖 `Phi-4-mini-instruct`
- `phi-4-mini-reasoning`：覆盖 `Phi-4-mini-reasoning`
- `phi-4-mini-flash`：覆盖 `Phi-4-mini-flash-reasoning`
- `phi-4-reasoning`：覆盖 `Phi-4-reasoning / Phi-4-reasoning-plus`

## 当前不纳入

- `Phi-3-small-8k-instruct`
- `Phi-3-small-128k-instruct`

这两条官方文本主线仓库当前仍然没有直接公开根目录 `tokenizer.json`，不满足当前“下载官方 tokenizer 快照并直接对拍”的接入门槛。

- `Phi-3-vision-128k-instruct`
- `Phi-3.5-vision-instruct`
- `Phi-4-multimodal-instruct`
- `Phi-4-reasoning-vision-15B`

这些模型属于 vision / multimodal 路线，不在当前纯文本 BPE 主线范围内。

- `NextCoder-*`
- `UserLM-8b`
- `FrogBoss-*`
- `FrogMini-*`

这些仓库当前都带 `base_model:finetune` 信号，属于官方微调 / 派生模型，不作为当前主线 tokenizer 的维护目标。

- `*-onnx`
- `*-gguf`
- `*-pytdml`

这些仓库属于导出格式或衍生分发，不作为当前官方主线 tokenizer 的维护目标。

## 使用方法

```bash
npm install @cyberlangke/tokkit-microsoft
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-microsoft"

const tokenizer = await getTokenizer("bitnet-b1.58-2b-4t")

console.log(tokenizer.vocabSize)
```
