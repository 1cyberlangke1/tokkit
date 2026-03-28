# @cyberlangke/tokkit-openbmb

OpenBMB 官方 tokenizer 的 tokkit 子包，当前包含 MiniCPM 文本模型内置 family。

## 支持的模型

- [`openbmb/MiniCPM-SALA`](https://huggingface.co/openbmb/MiniCPM-SALA)

## 使用方法

```bash
npm install @cyberlangke/tokkit-openbmb
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-openbmb"

const tokenizer = await getTokenizer("minicpm-sala")

console.log(tokenizer.vocabSize)
```
