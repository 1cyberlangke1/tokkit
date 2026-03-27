# tokkit

`tokkit` 是一个类似 `tiktoken` 的轻量 `BPE tokenizer` 库，面向 Hugging Face 开源模型。

- 只做 `BPE` 分词和反分词
- 按 tokenizer family 懒加载
- 同系列共享 tokenizer 时，支持直接用 family 名或模型名调用

## 支持的模型

- [`Qwen/Qwen3.5-0.8B`](https://huggingface.co/Qwen/Qwen3.5-0.8B) `qwen3.5`
- [`Qwen/Qwen3.5-27B`](https://huggingface.co/Qwen/Qwen3.5-27B) `qwen3.5`
- [`Qwen/Qwen3.5-397B-A17B`](https://huggingface.co/Qwen/Qwen3.5-397B-A17B) `qwen3.5`
- [`Qwen/Qwen3-Coder-Next`](https://huggingface.co/Qwen/Qwen3-Coder-Next) `qwen3-coder-next`
- [`deepseek-ai/DeepSeek-V3.1`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1) `deepseek-v3.1`
- [`deepseek-ai/DeepSeek-V3.2`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2) `deepseek-v3.2`
- [`zai-org/GLM-4.7`](https://huggingface.co/zai-org/GLM-4.7) `glm-4.7`
- [`zai-org/GLM-5`](https://huggingface.co/zai-org/GLM-5) `glm-5`
- [`stepfun-ai/Step-3.5-Flash`](https://huggingface.co/stepfun-ai/Step-3.5-Flash) `step-3.5-flash`

## 使用方法

```bash
npm install tokkit
```

```ts
import { getTokenizer } from "tokkit"

const tokenizer = await getTokenizer("qwen3.5")
const ids = tokenizer.encode("Hello, world!", {
  addSpecialTokens: false,
})
const text = tokenizer.decode(ids)
```

```ts
import { encode, decode } from "tokkit"

const ids = await encode("你好，世界！", "glm-5", {
  addSpecialTokens: false,
})

const text = await decode(ids, "glm-5")
```

```ts
import { getTokenizer } from "tokkit"

const family = await getTokenizer("qwen3.5")
const model = await getTokenizer("Qwen/Qwen3.5-27B")

console.log(family === model) // true
```
