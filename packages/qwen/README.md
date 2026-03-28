# @cyberlangke/tokkit-qwen

Qwen family 的 tokkit 子包，只包含 Qwen 相关 tokenizer。

## 支持的模型

- [`Qwen/Qwen3.5-0.8B`](https://huggingface.co/Qwen/Qwen3.5-0.8B)
- [`Qwen/Qwen3.5-27B`](https://huggingface.co/Qwen/Qwen3.5-27B)
- [`Qwen/Qwen3.5-397B-A17B`](https://huggingface.co/Qwen/Qwen3.5-397B-A17B)
- [`Qwen/Qwen3-Coder-Next`](https://huggingface.co/Qwen/Qwen3-Coder-Next)

## 使用方法

```bash
npm install @cyberlangke/tokkit-qwen
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-qwen"

// 只安装 qwen 子包时，也能直接获取 qwen tokenizer。
const tokenizer = await getTokenizer("qwen3.5")

// 同系列模型名会映射到同一个 tokenizer family。
const sameTokenizer = await getTokenizer("Qwen/Qwen3.5-27B")

console.log(tokenizer === sameTokenizer) // true
```
