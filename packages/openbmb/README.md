# @cyberlangke/tokkit-openbmb

OpenBMB 官方 tokenizer 的 tokkit 子包，当前覆盖 OpenBMB 组织下可直接用官方 `tokenizer.json` 验证的纯文本 BPE 主线 family。

## 支持的 family

- `agentcpm-explore`：覆盖 `AgentCPM-Explore`
- `minicpm-s-1b`：覆盖 `MiniCPM-S-1B-sft`
- `minicpm-sala`：覆盖 `MiniCPM-SALA`
- `minicpm3`：覆盖 `MiniCPM3-4B`
- `minicpm4`：覆盖 `MiniCPM4-0.5B / MiniCPM4-8B / MiniCPM4.1-8B / AgentCPM-Report / BitCPM4-0.5B / BitCPM4-1B / MiniCPM4-MCP / MiniCPM4-Survey / NOSA-1B / NOSA-3B / NOSA-8B`
- `minicpm-moe`：覆盖 `MiniCPM-MoE-8x2B`

## 当前不纳入

- `MiniCPM-V*`
- `MiniCPM-o*`
- `MiniCPM-Llama3-V-2_5`
- `OmniLMM-*`
- `VisCPM-*`
- `EVisRAG-*`
- `VoxCPM*`
- `RLAIF-V*`
- `RLHF-V*`
- `MiniCPM-Embedding*`
- `MiniCPM-Reranker*`

这些仓库属于多模态、语音、embedding 或 reranker 路线，不在当前纯文本 BPE 主线内。

- `*-GGUF`
- `*-AWQ`
- `*-GPTQ`
- `*-MLX`
- `*-int4`
- `*-llama-format`
- `*-LoRA`
- `*-history`
- `*-DPO`
- `*-KTO`
- `*-NCA`

这些仓库属于导出格式、量化格式或训练 / 评估专项变体，不作为当前主线 tokenizer 的维护目标。

- `cpm-ant-*`
- `cpm-bee-*`
- `UltraLM-*`
- `UltraRM-*`
- `Eurus-*`
- `RLPR-*`

这些仓库不是当前维护的 OpenBMB 文本主线；其中部分还是基于其他上游模型的专项派生线，不单独在这个子包里维护。

## 使用方法

```bash
npm install @cyberlangke/tokkit-openbmb
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-openbmb"

const tokenizer = await getTokenizer("minicpm-sala")

console.log(tokenizer.vocabSize)
```
