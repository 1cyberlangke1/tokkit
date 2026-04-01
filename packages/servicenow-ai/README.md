# @cyberlangke/tokkit-servicenow-ai

ServiceNow-AI 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `apriel-5b`
  - 覆盖 `ServiceNow-AI/Apriel-5B-Base`
  - 也聚合当前确认完全复用同一 tokenizer 的 `ServiceNow-AI/Apriel-5B-Instruct`

当前不纳入：

- `ServiceNow-AI/Apriel-Nemotron-15b-Thinker`
- `ServiceNow-AI/Apriel-H1-15b-Thinker-SFT`
- `ServiceNow-AI/AprielGuard`

说明：

- `ServiceNow-AI/Apriel-5B-Base` 与 `ServiceNow-AI/Apriel-5B-Instruct` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `apriel-5b` family。
- `ServiceNow-AI/Apriel-Nemotron-15b-Thinker` 虽然公开 `tokenizer.json`，但当前 hash 命中现有 `mistral-nemo`，同时它属于 Nemotron 派生线，不作为当前官方主线文本 LLM 包的一部分。
- `ServiceNow-AI/Apriel-H1-15b-Thinker-SFT` 是 SFT 模型，不纳入当前公开支持范围。
- `ServiceNow-AI/AprielGuard` 是 guard 模型，不属于当前主线文本 LLM 范围。

## 使用方法

```bash
npm install @cyberlangke/tokkit-servicenow-ai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-servicenow-ai"

const base = await getTokenizer("apriel-5b")
const instruct = await getTokenizer("ServiceNow-AI/Apriel-5B-Instruct")

console.log(base.encode("Hello, ServiceNow!"))
console.log(instruct.encode("Hello, ServiceNow!"))
```
