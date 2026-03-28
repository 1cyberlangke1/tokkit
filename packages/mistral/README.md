# @cyberlangke/tokkit-mistral

Mistral 官方 tokenizer 的 tokkit 子包，当前包含 Devstral 与 Mistral Small 内置 family。

## 支持的模型

- [`mistralai/Devstral-Small-2-24B-Instruct-2512`](https://huggingface.co/mistralai/Devstral-Small-2-24B-Instruct-2512)
- [`mistralai/Mistral-Small-3.1-24B-Instruct-2503`](https://huggingface.co/mistralai/Mistral-Small-3.1-24B-Instruct-2503)

## 使用方法

```bash
npm install @cyberlangke/tokkit-mistral
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-mistral"

const devstral = await getTokenizer("devstral-small-2")

const mistral = await getTokenizer("mistral-small-3.1")

console.log(devstral === mistral) // false
```
