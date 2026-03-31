# tokkit

`tokkit` 就是用来分词和计 token 数的库。

## 支持的包

- `@cyberlangke/tokkit`
  - 全量包，聚合当前所有 MIT / Apache-2.0 兼容的内置厂商 family
- `@cyberlangke/tokkit-minimax`
  - 独立特殊协议包，不包含在 `@cyberlangke/tokkit` 总包内
  - `minimax-m1`
  - `minimax-m2`
  - `minimax-text-01`
- `@cyberlangke/tokkit-01-ai`
  - `yi`
  - `yi-1.5-9b-chat`
  - `yi-coder`
  - `yi-coder-chat`
- `@cyberlangke/tokkit-tiiuae`
  - `falcon-rw-1b`
  - `falcon-7b`
- `@cyberlangke/tokkit-eleutherai`
  - `gpt-neo`
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
  - `devstral-small-2`
  - `mathstral-7b`
  - `mamba-codestral-7b`
  - `ministral-3`
  - `mistral-7b-v0.1`
  - `mistral-7b-v0.3`
  - `mistral-nemo`
  - `mistral-small-24b`
  - `mixtral-8x7b`
- `@cyberlangke/tokkit-huggingface-tb`
  - `smollm`
  - `smollm-1.7b`
  - `smollm2-16k`
  - `smollm3`
  - `smollm3-base`
- `@cyberlangke/tokkit-allenai`
  - `olmo`
  - `olmo-1`
  - `olmo-0424`
  - `olmo-2`
  - `olmo-3-instruct`
  - `olmo-hybrid`
  - `olmo-hybrid-think`
  - `olmoe`
  - `olmoe-instruct`
  - `olmoe-0125`
  - `olmoe-0125-instruct`
- `@cyberlangke/tokkit-ibm-granite`
  - `granite-3-instruct`
  - `granite-3.3-base`
  - `granite-3.3-instruct`
  - `granite-4`
  - `granite-4-tiny-base-preview`
  - `granite-4-tiny-preview`
- `@cyberlangke/tokkit-ibm-research`
  - `powerlm`
  - `molm`
- `@cyberlangke/tokkit-h2oai`
  - `danube`
  - `danube2`
  - `danube3-500m-chat`
  - `danube3-4b-chat`
  - `danube3.1-4b-chat`
- `@cyberlangke/tokkit-upstage`
  - `solar`
  - `solar-pro`
- `@cyberlangke/tokkit-openai`
  - `gpt-oss`
- `@cyberlangke/tokkit-gsai-ml`
  - `llada`
  - `llada-base`
  - `refusion`
- `@cyberlangke/tokkit-bytedance-seed`
  - `academic-ds`
  - `seed-oss`
  - `seed-coder`
  - `stable-diffcoder`
- `@cyberlangke/tokkit-openbmb`
  - `agentcpm-explore`
  - `minicpm-s-1b`
  - `minicpm-moe`
  - `minicpm-sala`
  - `minicpm3`
  - `minicpm4`
- `@cyberlangke/tokkit-qwen`
  - `qwen2`
  - `qwen2.5`
  - `qwen3`
  - `qwen3.5`
  - `qwen3.5-base`
  - `qwen3-coder-next`
- `@cyberlangke/tokkit-deepseek`
  - `deepseek-v3`
  - `deepseek-r1`
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

## 真实数据回归

仓库里的 `test/fineweb2_sample_10per.jsonl` 用于真实网页文本对拍。

- 数据来源：Hugging Face `HuggingFaceFW/fineweb-2`
- 数据集地址：`https://huggingface.co/datasets/HuggingFaceFW/fineweb-2`
- 许可证：`ODC-By`
- 当前脚本会拿 Hugging Face 官方 tokenizer 当 reference，对拍 `encode` / `decode` 是否一致
- reference 摘要缓存默认写到 `tmp/fineweb2-cache/`，后续重复回归会优先复用缓存，避免每次都重算官方结果

```bash
# 默认先跑小样本 encode 抽检
npm run test:fineweb2:smoke

# 需要看 decode 时，再跑更小一档的 decode smoke
npm run test:fineweb2:decode:smoke

# 需要定点某几个 family 时，在 smoke 基础上追加 families
npm run test:fineweb2:smoke -- --families qwen3.5,glm-5

# 需要对拍非总包子包时，显式指定 workspace 包目录
npm run test:fineweb2 -- --package minimax --families minimax-m1,minimax-m2,minimax-text-01 --limit 16 --maxChars 4096 --continueOnMismatch --jobs 3 --referenceBackend python

# 只有必要时才跑完整份 FineWeb2 样本
npm run test:fineweb2 -- --limit 0 --maxChars 0 --continueOnMismatch --jobs 8 --referenceBackend python
```
