# @cyberlangke/tokkit-bytedance-seed

ByteDance-Seed 官方 tokenizer 的 tokkit 子包，当前包含 `academic-ds`、`Seed-OSS`、`Seed-Coder`、`Stable-DiffCoder` 主线文本模型内置 family。

## 支持的模型

- [`ByteDance-Seed/academic-ds-9B`](https://huggingface.co/ByteDance-Seed/academic-ds-9B)
- [`ByteDance-Seed/Seed-OSS-36B-Base`](https://huggingface.co/ByteDance-Seed/Seed-OSS-36B-Base)
- [`ByteDance-Seed/Seed-Coder-8B-Base`](https://huggingface.co/ByteDance-Seed/Seed-Coder-8B-Base)
- [`ByteDance-Seed/Stable-DiffCoder-8B-Base`](https://huggingface.co/ByteDance-Seed/Stable-DiffCoder-8B-Base)

## 使用方法

```bash
npm install @cyberlangke/tokkit-bytedance-seed
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-bytedance-seed"

const tokenizer = await getTokenizer("seed-coder")

const sameTokenizer = await getTokenizer("ByteDance-Seed/Seed-Coder-8B-Reasoning")

console.log(tokenizer === sameTokenizer) // true
```
