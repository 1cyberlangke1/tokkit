# @cyberlangke/tokkit-openbmb

OpenBMB 官方 tokenizer 的 tokkit 子包，当前包含 OpenBMB 官方纯文本主线里已确认复用的 tokenizer family。

## 支持的模型

- `minicpm-s-1b`
  - 历史兼容 family
  - [`openbmb/MiniCPM-S-1B-sft`](https://huggingface.co/openbmb/MiniCPM-S-1B-sft)
- `minicpm-sala`
  - [`openbmb/MiniCPM-SALA`](https://huggingface.co/openbmb/MiniCPM-SALA)
- `minicpm3`
  - [`openbmb/MiniCPM3-4B`](https://huggingface.co/openbmb/MiniCPM3-4B)
- `minicpm4`
  - [`openbmb/MiniCPM4-0.5B`](https://huggingface.co/openbmb/MiniCPM4-0.5B)
  - [`openbmb/MiniCPM4-8B`](https://huggingface.co/openbmb/MiniCPM4-8B)
  - [`openbmb/MiniCPM4.1-8B`](https://huggingface.co/openbmb/MiniCPM4.1-8B)
  - [`openbmb/BitCPM4-0.5B`](https://huggingface.co/openbmb/BitCPM4-0.5B)
  - [`openbmb/BitCPM4-1B`](https://huggingface.co/openbmb/BitCPM4-1B)
  - [`openbmb/NOSA-1B`](https://huggingface.co/openbmb/NOSA-1B)
  - [`openbmb/NOSA-3B`](https://huggingface.co/openbmb/NOSA-3B)
  - [`openbmb/NOSA-8B`](https://huggingface.co/openbmb/NOSA-8B)

## 说明

- `MiniCPM4` / `MiniCPM4.1` / `BitCPM4` / `NOSA` 当前官方 `tokenizer.json` hash 完全一致，因此统一复用 `minicpm4` family。
- `MiniCPM4-Survey`、`MiniCPM4-MCP`、`AgentCPM-*` 这类专用派生线不作为当前主线支持目标。

## 使用方法

```bash
npm install @cyberlangke/tokkit-openbmb
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-openbmb"

const tokenizer = await getTokenizer("bitcpm4")

console.log(tokenizer.vocabSize)
```
