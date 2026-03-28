# tokkit

`tokkit` 就是用来分词和计 token 数的库。

## 支持的模型

- `@cyberlangke/tokkit-qwen`
  - [`Qwen/Qwen3.5-0.8B`](https://huggingface.co/Qwen/Qwen3.5-0.8B)
  - [`Qwen/Qwen3.5-27B`](https://huggingface.co/Qwen/Qwen3.5-27B)
  - [`Qwen/Qwen3.5-397B-A17B`](https://huggingface.co/Qwen/Qwen3.5-397B-A17B)
  - [`Qwen/Qwen3-Coder-Next`](https://huggingface.co/Qwen/Qwen3-Coder-Next)
- `@cyberlangke/tokkit-deepseek`
  - [`deepseek-ai/DeepSeek-V3.1`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1)
  - [`deepseek-ai/DeepSeek-V3.2`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2)
- `@cyberlangke/tokkit-glm`
  - [`zai-org/GLM-4.7`](https://huggingface.co/zai-org/GLM-4.7)
  - [`zai-org/GLM-5`](https://huggingface.co/zai-org/GLM-5)
- `@cyberlangke/tokkit-step`
  - [`stepfun-ai/Step-3.5-Flash`](https://huggingface.co/stepfun-ai/Step-3.5-Flash)
- `@cyberlangke/tokkit`
  - 全量包，聚合以上全部 family

## 使用方法

```bash
# 安装全量包
npm install @cyberlangke/tokkit

# 或者只安装需要的 family 包
npm install @cyberlangke/tokkit-deepseek
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
import { getTokenizer } from "@cyberlangke/tokkit-deepseek"

// 只安装 DeepSeek 子包时，也可以直接获取对应 tokenizer。
const tokenizer = await getTokenizer("deepseek-v3.2")

// 同系列模型名会映射到同一个 tokenizer family。
const sameTokenizer = await getTokenizer("deepseek-ai/DeepSeek-V3.2")

console.log(tokenizer === sameTokenizer) // true
```
