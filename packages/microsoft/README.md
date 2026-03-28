# @cyberlangke/tokkit-microsoft

Microsoft 官方 tokenizer 的 tokkit 子包，当前包含 Phi 主线内置 family。

## 支持的模型

- [`microsoft/Phi-4-mini-instruct`](https://huggingface.co/microsoft/Phi-4-mini-instruct)

## 使用方法

```bash
npm install @cyberlangke/tokkit-microsoft
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-microsoft"

const tokenizer = await getTokenizer("phi-4-mini")

console.log(tokenizer.vocabSize)
```
