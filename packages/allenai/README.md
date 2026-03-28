# @cyberlangke/tokkit-allenai

AllenAI 官方 tokenizer 的 tokkit 子包，当前包含 OLMo-2 内置 family。

## 支持的模型

- [`allenai/OLMo-2-1124-13B`](https://huggingface.co/allenai/OLMo-2-1124-13B)
- [`allenai/OLMo-2-1124-13B-Instruct`](https://huggingface.co/allenai/OLMo-2-1124-13B-Instruct)

## 使用方法

```bash
npm install @cyberlangke/tokkit-allenai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-allenai"

const tokenizer = await getTokenizer("olmo-2")

console.log(tokenizer.vocabSize)
```
