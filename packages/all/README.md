# @cyberlangke/tokkit

`tokkit` 就是用来分词和计 token 数的库。

## 支持的模型

- [`01-ai/Yi-6B`](https://huggingface.co/01-ai/Yi-6B)
- [`01-ai/Yi-1.5-9B-Chat`](https://huggingface.co/01-ai/Yi-1.5-9B-Chat)
- [`01-ai/Yi-Coder-9B`](https://huggingface.co/01-ai/Yi-Coder-9B)
- [`01-ai/Yi-Coder-9B-Chat`](https://huggingface.co/01-ai/Yi-Coder-9B-Chat)
- [`EleutherAI/gpt-j-6b`](https://huggingface.co/EleutherAI/gpt-j-6b)
- [`EleutherAI/gpt-neox-20b`](https://huggingface.co/EleutherAI/gpt-neox-20b)
- [`HuggingFaceTB/cosmo-1b`](https://huggingface.co/HuggingFaceTB/cosmo-1b)
- [`Qwen/Qwen3.5-0.8B`](https://huggingface.co/Qwen/Qwen3.5-0.8B)
- [`Qwen/Qwen3.5-27B`](https://huggingface.co/Qwen/Qwen3.5-27B)
- [`Qwen/Qwen3.5-397B-A17B`](https://huggingface.co/Qwen/Qwen3.5-397B-A17B)
- [`Qwen/Qwen3-Coder-Next`](https://huggingface.co/Qwen/Qwen3-Coder-Next)
- [`deepseek-ai/DeepSeek-V3.1`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1)
- [`deepseek-ai/DeepSeek-V3.2`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2)
- [`zai-org/GLM-4.7`](https://huggingface.co/zai-org/GLM-4.7)
- [`zai-org/GLM-5`](https://huggingface.co/zai-org/GLM-5)
- [`zai-org/GLM-Z1-32B-0414`](https://huggingface.co/zai-org/GLM-Z1-32B-0414)
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
