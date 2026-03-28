# @cyberlangke/tokkit-meituan-longcat

meituan-longcat 官方 tokenizer 的 tokkit 子包，当前包含 LongCat 文本模型的内置 family。

## 支持的模型

- [`meituan-longcat/LongCat-Flash-Lite`](https://huggingface.co/meituan-longcat/LongCat-Flash-Lite)
- [`meituan-longcat/LongCat-Flash-Thinking-2601`](https://huggingface.co/meituan-longcat/LongCat-Flash-Thinking-2601)

## 使用方法

```bash
npm install @cyberlangke/tokkit-meituan-longcat
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-meituan-longcat"

const lite = await getTokenizer("longcat-flash-lite")

const thinking = await getTokenizer("longcat-flash-thinking")

console.log(lite === thinking) // false
```
