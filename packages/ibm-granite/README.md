# @cyberlangke/tokkit-ibm-granite

IBM Granite 官方 tokenizer 的 tokkit 子包，当前包含 Granite 3.3 base / instruct 内置 family。

## 支持的模型

- [`ibm-granite/granite-3.3-8b-base`](https://huggingface.co/ibm-granite/granite-3.3-8b-base)
- [`ibm-granite/granite-3.3-8b-instruct`](https://huggingface.co/ibm-granite/granite-3.3-8b-instruct)

## 使用方法

```bash
npm install @cyberlangke/tokkit-ibm-granite
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-ibm-granite"

const base = await getTokenizer("granite-3.3-base")

const instruct = await getTokenizer("granite-3.3-instruct")

console.log(base === instruct) // false
```
