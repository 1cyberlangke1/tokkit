# @cyberlangke/tokkit-minimax

MiniMaxAI 官方 tokenizer 的 tokkit 子包，当前包含 `MiniMax-M1`、`MiniMax-M2`、`MiniMax-Text-01` 三条文本主线。

这是一个独立特殊协议子包，不包含在 `@cyberlangke/tokkit` 总包里。

## 支持的模型

- [`MiniMaxAI/MiniMax-M2`](https://huggingface.co/MiniMaxAI/MiniMax-M2)
- [`MiniMaxAI/MiniMax-M2.1`](https://huggingface.co/MiniMaxAI/MiniMax-M2.1)
- [`MiniMaxAI/MiniMax-M2.5`](https://huggingface.co/MiniMaxAI/MiniMax-M2.5)
- [`MiniMaxAI/MiniMax-M1-40k`](https://huggingface.co/MiniMaxAI/MiniMax-M1-40k)
- [`MiniMaxAI/MiniMax-M1-80k`](https://huggingface.co/MiniMaxAI/MiniMax-M1-80k)
- [`MiniMaxAI/MiniMax-Text-01`](https://huggingface.co/MiniMaxAI/MiniMax-Text-01)
- [`MiniMaxAI/MiniMax-Text-01-hf`](https://huggingface.co/MiniMaxAI/MiniMax-Text-01-hf)

## 使用方法

```bash
npm install @cyberlangke/tokkit-minimax
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-minimax"

const tokenizer = await getTokenizer("minimax-m2")

const sameTokenizer = await getTokenizer("MiniMaxAI/MiniMax-M2.5")

console.log(tokenizer === sameTokenizer) // true
```
