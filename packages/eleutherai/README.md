# @cyberlangke/tokkit-eleutherai

EleutherAI 官方 tokenizer 的 tokkit 子包，当前包含 Pythia 系列内置 family。

## 支持的模型

- [`EleutherAI/pythia-6.9b`](https://huggingface.co/EleutherAI/pythia-6.9b)
- [`EleutherAI/pythia-12b`](https://huggingface.co/EleutherAI/pythia-12b)

## 使用方法

```bash
npm install @cyberlangke/tokkit-eleutherai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-eleutherai"

const tokenizer = await getTokenizer("pythia")

const sameTokenizer = await getTokenizer("EleutherAI/pythia-12b")

console.log(tokenizer === sameTokenizer) // true
```
