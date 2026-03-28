# @cyberlangke/tokkit-huggingface-tb

HuggingFaceTB 官方 tokenizer 的 tokkit 子包，当前包含 `SmolLM`、`SmolLM2`、`SmolLM3` 主线文本模型内置 family。

## 支持的模型

- [`HuggingFaceTB/SmolLM-135M`](https://huggingface.co/HuggingFaceTB/SmolLM-135M)
- [`HuggingFaceTB/SmolLM2-1.7B`](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B)
- [`HuggingFaceTB/SmolLM2-1.7B-Instruct-16k`](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-16k)
- [`HuggingFaceTB/SmolLM3-3B`](https://huggingface.co/HuggingFaceTB/SmolLM3-3B)
- [`HuggingFaceTB/SmolLM3-3B-Base`](https://huggingface.co/HuggingFaceTB/SmolLM3-3B-Base)

## 使用方法

```bash
npm install @cyberlangke/tokkit-huggingface-tb
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-huggingface-tb"

const tokenizer = await getTokenizer("smollm")

const sameTokenizer = await getTokenizer("HuggingFaceTB/SmolLM2-1.7B")

console.log(tokenizer === sameTokenizer) // true
```
