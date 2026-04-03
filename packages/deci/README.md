# @cyberlangke/tokkit-deci

Deci 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `decicoder-1b`
  - 覆盖 `Deci/DeciCoder-1b`
- `mistral-7b-v0.1`
  - 额外接受 `Deci/DeciLM-7B`
  - 额外接受 `Deci/DeciLM-7B-instruct`

说明：

- 当前只纳入 `Deci` 官方组织下公开 `tokenizer.json`、非 gated 且 `license: apache-2.0` 的文本主线。
- `DeciLM-6b`、`DeciLM-6b-instruct` 当前是 `license: llama2`，不纳入。
- `DeciCoder-6B` 当前缺少 `tokenizer.json`，不纳入。
- `DeciLM-7B`、`DeciLM-7B-instruct` 的 `tokenizer.json` SHA256 与现有 `mistral-7b-v0.1` 一致，因此作为模型别名复用。
- `DeciCoder-1b` 的 `tokenizer.json` SHA256 未命中当前仓库已有快照，因此单独保留为 `decicoder-1b` family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-deci
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-deci"

const coder = await getTokenizer("Deci/DeciCoder-1b")
const lm = await getTokenizer("Deci/DeciLM-7B-instruct")

console.log(coder !== lm)
```
