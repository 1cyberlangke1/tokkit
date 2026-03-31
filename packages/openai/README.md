# @cyberlangke/tokkit-openai

OpenAI 官方 `gpt-oss` tokenizer 的 tokkit 子包。

当前内置 family：

- `gpt-oss`
  - 覆盖 `openai/gpt-oss-20b`
  - 也聚合当前确认完全复用同一 tokenizer 的 `openai/gpt-oss-120b`

当前不纳入：

- `openai/gpt-oss-safeguard-20b`
- `openai/gpt-oss-safeguard-120b`
- `openai/circuit-sparsity`

说明：

- `gpt-oss-safeguard-*` 官方 model card 明确标注 `base_model_relation: finetune`，属于专项安全微调线，不作为当前公开维护目标。
- `openai/circuit-sparsity` 不是当前 `gpt-oss` 主线。

## 使用方法

```bash
npm install @cyberlangke/tokkit-openai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-openai"

const tokenizer = await getTokenizer("gpt-oss")
const larger = await getTokenizer("openai/gpt-oss-120b")

console.log(tokenizer.encode("Hello, OpenAI!"))
console.log(larger.encode("Hello, OpenAI!"))
```
