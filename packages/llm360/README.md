# @cyberlangke/tokkit-llm360

LLM360 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `snowflake-arctic-base`
  - 复用现有 canonical family
  - 覆盖 `LLM360/Amber`
  - 也聚合 `LLM360/AmberChat`
- `crystal`
  - 覆盖 `LLM360/Crystal`
  - 也聚合 `LLM360/CrystalChat`
- `k2`
  - 覆盖 `LLM360/K2`
- `k2-chat`
  - 覆盖 `LLM360/K2-Chat`
- `mimo-7b-rl-0530`
  - 复用现有 canonical family
  - 覆盖 `LLM360/K2-Think`
- `k2-think-v2`
  - 覆盖 `LLM360/K2-Think-V2`

当前不纳入：

- `LLM360/AmberSafe`

说明：

- 当前纳入范围只包含 `LLM360` 官方组织下公开可下载、`apache-2.0`、非 gated、且落在纯文本 BPE 范围内的文本主线。
- `Amber` / `AmberChat` 的 `tokenizer.json` SHA256 与 `Snowflake/snowflake-arctic-base` 一致，因此复用 `snowflake-arctic-base`。
- `K2-Think` 的 `tokenizer.json` SHA256 与 `XiaomiMiMo/MiMo-7B-RL-0530` 一致，因此复用 `mimo-7b-rl-0530`。
- `Crystal` / `CrystalChat`、`K2`、`K2-Chat`、`K2-Think-V2` 当前都需要独立 canonical family。
- `AmberSafe` 当前没有 `tokenizer.json`，因此不纳入这一批。

## 使用方法

```bash
npm install @cyberlangke/tokkit-llm360
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-llm360"

const amber = await getTokenizer("LLM360/Amber")
const crystal = await getTokenizer("LLM360/Crystal")
const k2Think = await getTokenizer("LLM360/K2-Think")

console.log(amber !== crystal)
console.log(k2Think)
```
