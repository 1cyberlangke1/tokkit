# @cyberlangke/tokkit-meituan-longcat

meituan-longcat 官方 tokenizer 的 tokkit 子包，当前包含 LongCat 纯文本主线模型的内置 family。

## 支持的模型

- [`meituan-longcat/LongCat-Flash-Chat`](https://huggingface.co/meituan-longcat/LongCat-Flash-Chat)
- [`meituan-longcat/LongCat-Flash-Thinking`](https://huggingface.co/meituan-longcat/LongCat-Flash-Thinking)
- [`meituan-longcat/LongCat-Flash-Lite`](https://huggingface.co/meituan-longcat/LongCat-Flash-Lite)
- [`meituan-longcat/LongCat-Flash-Prover`](https://huggingface.co/meituan-longcat/LongCat-Flash-Prover)
- [`meituan-longcat/LongCat-Flash-Thinking-2601`](https://huggingface.co/meituan-longcat/LongCat-Flash-Thinking-2601)
- [`meituan-longcat/LongCat-HeavyMode-Summary`](https://huggingface.co/meituan-longcat/LongCat-HeavyMode-Summary)
- [`meituan-longcat/LongCat-Flash-Thinking-ZigZag`](https://huggingface.co/meituan-longcat/LongCat-Flash-Thinking-ZigZag)

当前不纳入 `*-FP8` 导出对象和 `LongCat-Flash-Omni-FP8`。

## 使用方法

```bash
npm install @cyberlangke/tokkit-meituan-longcat
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-meituan-longcat"

const chat = await getTokenizer("longcat-flash-chat")
const sameTokenizer = await getTokenizer("meituan-longcat/LongCat-Flash-Thinking")
const thinking = await getTokenizer("longcat-flash-thinking")

console.log(chat === sameTokenizer) // true
console.log(chat === thinking) // false
```
