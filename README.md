# tokkit

`tokkit` 就是用来分词和计 token 数的库。

## 支持的包

- `@cyberlangke/tokkit`
  - 全量包，聚合当前所有 MIT / Apache-2.0 兼容的内置厂商 family
- `@cyberlangke/tokkit-tiiuae`
  - `falcon-rw-1b`
  - `falcon-7b`
- `@cyberlangke/tokkit-eleutherai`
  - `pythia`
  - `polyglot-ko`
  - `polyglot-ko-12.8`
- `@cyberlangke/tokkit-meituan-longcat`
  - `longcat-flash-chat`
  - `longcat-flash-lite`
  - `longcat-flash-thinking`
- `@cyberlangke/tokkit-xiaomi-mimo`
  - `mimo`
  - `mimo-7b-rl-0530`
  - `mimo-v2-flash`
- `@cyberlangke/tokkit-microsoft`
  - `phi-1`
  - `phi-3-mini`
  - `phi-3-medium`
  - `phi-3.5`
  - `phi-4`
  - `phi-4-mini`
  - `phi-4-mini-flash`
  - `phi-4-mini-reasoning`
  - `phi-4-reasoning`
  - `phi-moe`
- `@cyberlangke/tokkit-mistral`
  - `mistral-7b-v0.1`
  - `mistral-7b-v0.3`
  - `mixtral-8x7b`
  - `ministral-8b`
  - `devstral-small-2`
  - `mistral-small-3.1`
- `@cyberlangke/tokkit-huggingface-tb`
  - `smollm`
  - `smollm-1.7b`
  - `smollm2-16k`
  - `smollm3`
  - `smollm3-base`
- `@cyberlangke/tokkit-allenai`
  - `olmo-1`
  - `olmo-2`
  - `olmo-3-instruct`
  - `olmo-hybrid`
  - `olmoe`
- `@cyberlangke/tokkit-ibm-granite`
  - `granite-3-instruct`
  - `granite-3.3-base`
  - `granite-3.3-instruct`
  - `granite-4`
  - `granite-4-tiny-base-preview`
  - `granite-4-tiny-preview`
- `@cyberlangke/tokkit-bytedance-seed`
  - `academic-ds`
  - `seed-oss`
  - `seed-coder`
  - `stable-diffcoder`
- `@cyberlangke/tokkit-openbmb`
  - `minicpm-s-1b`
  - `minicpm-sala`
  - `minicpm3`
  - `minicpm4`
- `@cyberlangke/tokkit-qwen`
  - `qwen3.5`
  - `qwen3-coder-next`
- `@cyberlangke/tokkit-deepseek`
  - `deepseek-v3.1`
  - `deepseek-v3.2`
- `@cyberlangke/tokkit-glm`
  - `glm-4.7`
  - `glm-5`
- `@cyberlangke/tokkit-step`
  - `step-3.5-flash`

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

## 开发命令

```bash
# 生成内置 tokenizer 模块
npm run generate:builtins

# 跑完整测试
npm run test:run

# 生成构建产物
npm run build

# 对比 tokkit 与 Hugging Face 官方 tokenizer 的 encode 吞吐
npm run benchmark:hf
```
