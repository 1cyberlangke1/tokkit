# @cyberlangke/tokkit-01-ai

01.AI 官方 tokenizer 的 tokkit 子包，当前包含 `Yi`、`Yi-1.5`、`Yi-Coder` 主线文本模型内置 family。

## 支持的模型

- [`01-ai/Yi-6B`](https://huggingface.co/01-ai/Yi-6B)
- [`01-ai/Yi-1.5-9B-Chat`](https://huggingface.co/01-ai/Yi-1.5-9B-Chat)
- [`01-ai/Yi-Coder-9B`](https://huggingface.co/01-ai/Yi-Coder-9B)
- [`01-ai/Yi-Coder-9B-Chat`](https://huggingface.co/01-ai/Yi-Coder-9B-Chat)

## 使用方法

```bash
npm install @cyberlangke/tokkit-01-ai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-01-ai"

const tokenizer = await getTokenizer("yi")

const sameTokenizer = await getTokenizer("01-ai/Yi-1.5-34B")

console.log(tokenizer === sameTokenizer) // true
```
