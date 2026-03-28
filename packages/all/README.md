# @cyberlangke/tokkit

`tokkit` 就是用来分词和计 token 数的库。

## 支持的模型

- [`Qwen/Qwen3.5-0.8B`](https://huggingface.co/Qwen/Qwen3.5-0.8B)
- [`Qwen/Qwen3.5-27B`](https://huggingface.co/Qwen/Qwen3.5-27B)
- [`Qwen/Qwen3.5-397B-A17B`](https://huggingface.co/Qwen/Qwen3.5-397B-A17B)
- [`Qwen/Qwen3-Coder-Next`](https://huggingface.co/Qwen/Qwen3-Coder-Next)
- [`deepseek-ai/DeepSeek-V3.1`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1)
- [`deepseek-ai/DeepSeek-V3.2`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2)
- [`zai-org/GLM-4.7`](https://huggingface.co/zai-org/GLM-4.7)
- [`zai-org/GLM-5`](https://huggingface.co/zai-org/GLM-5)
- [`stepfun-ai/Step-3.5-Flash`](https://huggingface.co/stepfun-ai/Step-3.5-Flash)

## 使用方法

```bash
npm install @cyberlangke/tokkit
```

```ts
import { countTokens, encode, decode } from "@cyberlangke/tokkit"

// 直接按 family 名编码文本。
const ids = await encode("Hello, world!", "qwen3.5", {
  addSpecialTokens: false,
})

// 再把 token ids 还原成文本。
const text = await decode(ids, "qwen3.5")

// 统计 token 数量。
const count = await countTokens("Hello, world!", "qwen3.5", {
  addSpecialTokens: false,
})

console.log(ids, text, count)
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit"

// 用 family 名获取 tokenizer。
const familyTokenizer = await getTokenizer("qwen3.5")

// 用具体模型名获取同一个 tokenizer family。
const modelTokenizer = await getTokenizer("Qwen/Qwen3.5-27B")

console.log(familyTokenizer === modelTokenizer) // true
```
