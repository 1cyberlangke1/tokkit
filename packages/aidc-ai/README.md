# @cyberlangke/tokkit-aidc-ai

AIDC-AI 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `marco-o1`
  - 覆盖 `AIDC-AI/Marco-o1`

当前复用的既有 family：

- `qwen2`
  - 覆盖 `AIDC-AI/Marco-LLM-ES`
- `qwen2.5`
  - 覆盖 `AIDC-AI/Marco-Nano-Instruct`
  - 覆盖 `AIDC-AI/Marco-Mini-Global-Base`
  - 覆盖 `AIDC-AI/Marco-Mini-Base`
  - 覆盖 `AIDC-AI/Marco-Nano-Base`
  - 覆盖 `AIDC-AI/Marco-LLM-SEA`
  - 覆盖 `AIDC-AI/Marco-LLM-AR-V4`
  - 覆盖 `AIDC-AI/Marco-LLM-AR-V2`

说明：

- 当前只纳入 `AIDC-AI` 官方组织下公开 `tokenizer.json`、非 gated、`license: apache-2.0` 且 `model.type = BPE` 的文本模型。
- `Marco-Nano-Instruct`、`Marco-Mini-Global-Base`、`Marco-Mini-Base`、`Marco-Nano-Base`、`Marco-LLM-SEA`、`Marco-LLM-AR-V4`、`Marco-LLM-AR-V2` 的 `tokenizer.json` SHA256 一致，因此复用 `qwen2.5`。
- `Marco-LLM-ES` 的 `tokenizer.json` SHA256 与 `qwen2` 一致，因此复用 `qwen2`。
- `Marco-o1` 的 `tokenizer.json` SHA256 未命中仓库现有快照，因此单独提供 `marco-o1` family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-aidc-ai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-aidc-ai"

const marcoO1 = await getTokenizer("AIDC-AI/Marco-o1")
const marcoEs = await getTokenizer("AIDC-AI/Marco-LLM-ES")

console.log(marcoO1 !== marcoEs)
```
