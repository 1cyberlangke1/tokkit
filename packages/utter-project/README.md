# @cyberlangke/tokkit-utter-project

utter-project 官方 EuroLLM / EuroMoE 文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `eurollm-1.7b`
  - 覆盖 `utter-project/EuroLLM-1.7B`
- `eurollm-1.7b-instruct`
  - 覆盖 `utter-project/EuroLLM-1.7B-Instruct`
- `eurollm-2512`
  - 覆盖 `utter-project/EuroLLM-9B-2512`
  - 也聚合当前确认完全复用同一 tokenizer 的 `utter-project/EuroLLM-22B-2512`
  - 也聚合当前确认完全复用同一 tokenizer 的 `utter-project/EuroMoE-2.6B-A0.6B-2512`
- `eurollm-2512-instruct`
  - 覆盖 `utter-project/EuroLLM-9B-Instruct-2512`
  - 也聚合当前在仓库行为边界内可复用同一 tokenizer 的 `utter-project/EuroLLM-22B-Instruct-2512`
  - 也聚合当前在仓库行为边界内可复用同一 tokenizer 的 `utter-project/EuroMoE-2.6B-A0.6B-Instruct-2512`

说明：

- 当前纳入范围只包含 `utter-project` 官方组织下公开可下载 `tokenizer.json` 且非 gated 的 EuroLLM / EuroMoE 文本主线。
- `EuroLLM-9B`、`EuroLLM-9B-Instruct` 当前仍是 gated，暂不纳入。
- `*-Preview` 当前按被 `2512` 线覆盖的历史预览版本处理，暂不纳入。
- `EuroLLM-9B-2512`、`EuroLLM-22B-2512`、`EuroMoE-2.6B-A0.6B-2512` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `eurollm-2512` family。
- `EuroLLM-9B-Instruct-2512`、`EuroLLM-22B-Instruct-2512` 与 `EuroMoE-2.6B-A0.6B-Instruct-2512` 在当前仓库行为边界内可复用同一 family，因此收口到 `eurollm-2512-instruct`。

## 使用方法

```bash
npm install @cyberlangke/tokkit-utter-project
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-utter-project"

const base = await getTokenizer("utter-project/EuroLLM-22B-2512")
const instruct = await getTokenizer("eurollm-2512-instruct")

console.log(base === instruct)
```
