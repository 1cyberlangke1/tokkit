# @cyberlangke/tokkit-tiiuae

tiiuae 官方 tokenizer 的 tokkit 子包，当前包含 Falcon 系列内置 family。

## 支持的模型

- [`tiiuae/falcon-7b`](https://huggingface.co/tiiuae/falcon-7b)
- [`tiiuae/falcon-7b-instruct`](https://huggingface.co/tiiuae/falcon-7b-instruct)

## 使用方法

```bash
npm install @cyberlangke/tokkit-tiiuae
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-tiiuae"

const tokenizer = await getTokenizer("falcon-7b")

const sameTokenizer = await getTokenizer("tiiuae/falcon-7b-instruct")

console.log(tokenizer === sameTokenizer) // true
```
