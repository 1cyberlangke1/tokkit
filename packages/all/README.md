# @cyberlangke/tokkit

`tokkit` 就是用来分词和计 token 数的库。

## 支持的模型

- [`01-ai/Yi-6B`](https://huggingface.co/01-ai/Yi-6B)
- [`01-ai/Yi-1.5-9B-Chat`](https://huggingface.co/01-ai/Yi-1.5-9B-Chat)
- [`01-ai/Yi-Coder-9B`](https://huggingface.co/01-ai/Yi-Coder-9B)
- [`01-ai/Yi-Coder-9B-Chat`](https://huggingface.co/01-ai/Yi-Coder-9B-Chat)
- [`EleutherAI/gpt-j-6b`](https://huggingface.co/EleutherAI/gpt-j-6b)
- [`EleutherAI/gpt-neox-20b`](https://huggingface.co/EleutherAI/gpt-neox-20b)
- [`h2oai/h2o-danube-1.8b-base`](https://huggingface.co/h2oai/h2o-danube-1.8b-base)
- [`h2oai/h2o-danube2-1.8b-chat`](https://huggingface.co/h2oai/h2o-danube2-1.8b-chat)
- [`h2oai/h2o-danube3-4b-base`](https://huggingface.co/h2oai/h2o-danube3-4b-base)
- [`h2oai/h2o-danube3.1-4b-chat`](https://huggingface.co/h2oai/h2o-danube3.1-4b-chat)
- [`upstage/SOLAR-10.7B-v1.0`](https://huggingface.co/upstage/SOLAR-10.7B-v1.0)
- [`upstage/TinySolar-248m-4k`](https://huggingface.co/upstage/TinySolar-248m-4k)
- [`upstage/solar-pro-preview-instruct`](https://huggingface.co/upstage/solar-pro-preview-instruct)
- [`openai/gpt-oss-20b`](https://huggingface.co/openai/gpt-oss-20b)
- [`openai/gpt-oss-120b`](https://huggingface.co/openai/gpt-oss-120b)
- [`GSAI-ML/LLaDA-8B-Instruct`](https://huggingface.co/GSAI-ML/LLaDA-8B-Instruct)
- [`GSAI-ML/LLaDA-1.5`](https://huggingface.co/GSAI-ML/LLaDA-1.5)
- [`GSAI-ML/LLaDA-8B-Base`](https://huggingface.co/GSAI-ML/LLaDA-8B-Base)
- [`GSAI-ML/ReFusion`](https://huggingface.co/GSAI-ML/ReFusion)
- [`Qwen/Qwen3.5-0.8B`](https://huggingface.co/Qwen/Qwen3.5-0.8B)
- [`Qwen/Qwen3.5-0.8B-Base`](https://huggingface.co/Qwen/Qwen3.5-0.8B-Base)
- [`Qwen/Qwen3-0.6B`](https://huggingface.co/Qwen/Qwen3-0.6B)
- [`Qwen/Qwen2.5-7B-Instruct`](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct)
- [`Qwen/Qwen2-7B-Instruct`](https://huggingface.co/Qwen/Qwen2-7B-Instruct)
- [`Qwen/Qwen3-Coder-Next`](https://huggingface.co/Qwen/Qwen3-Coder-Next)
- [`Qwen/QwQ-32B`](https://huggingface.co/Qwen/QwQ-32B)
- [`deepseek-ai/DeepSeek-V3-0324`](https://huggingface.co/deepseek-ai/DeepSeek-V3-0324)
- [`deepseek-ai/DeepSeek-R1`](https://huggingface.co/deepseek-ai/DeepSeek-R1)
- [`deepseek-ai/DeepSeek-V3.1`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1)
- [`deepseek-ai/DeepSeek-V3.2`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2)
- [`zai-org/GLM-4.5-Air`](https://huggingface.co/zai-org/GLM-4.5-Air)
- [`zai-org/GLM-4.7`](https://huggingface.co/zai-org/GLM-4.7)
- [`zai-org/GLM-4.7-Flash`](https://huggingface.co/zai-org/GLM-4.7-Flash)
- [`zai-org/GLM-5`](https://huggingface.co/zai-org/GLM-5)
- [`stepfun-ai/Step-3.5-Flash`](https://huggingface.co/stepfun-ai/Step-3.5-Flash)
- [`stepfun-ai/Step-3.5-Flash-Base-Midtrain`](https://huggingface.co/stepfun-ai/Step-3.5-Flash-Base-Midtrain)

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
