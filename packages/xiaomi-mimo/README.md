# @cyberlangke/tokkit-xiaomi-mimo

XiaomiMiMo 官方 tokenizer 的 tokkit 子包，当前包含 MiMo 文本模型内置 family。

## 支持的模型

- [`XiaomiMiMo/MiMo-7B-SFT`](https://huggingface.co/XiaomiMiMo/MiMo-7B-SFT)
- [`XiaomiMiMo/MiMo-V2-Flash-Base`](https://huggingface.co/XiaomiMiMo/MiMo-V2-Flash-Base)

## 使用方法

```bash
npm install @cyberlangke/tokkit-xiaomi-mimo
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-xiaomi-mimo"

const tokenizer = await getTokenizer("mimo")

const sameTokenizer = await getTokenizer("XiaomiMiMo/MiMo-V2-Flash-Base")

console.log(tokenizer === sameTokenizer) // true
```
