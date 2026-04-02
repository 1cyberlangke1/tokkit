# @cyberlangke/tokkit-swiss-ai

swiss-ai 官方 Apertus 文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `apertus`
  - 覆盖 `swiss-ai/Apertus-8B-2509`
  - 也聚合当前确认完全复用同一 tokenizer 的 `swiss-ai/Apertus-70B-2509`
- `apertus-instruct`
  - 覆盖 `swiss-ai/Apertus-8B-Instruct-2509`
  - 也聚合当前确认完全复用同一 tokenizer 的 `swiss-ai/Apertus-70B-Instruct-2509`

说明：

- 当前纳入范围只包含 `swiss-ai` 官方组织下公开可下载 `tokenizer.json` 的 Apertus 文本主线。
- `Apertus-8B-2509` 与 `Apertus-70B-2509` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `apertus` family。
- `Apertus-8B-Instruct-2509` 与 `Apertus-70B-Instruct-2509` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `apertus-instruct` family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-swiss-ai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-swiss-ai"

const base = await getTokenizer("swiss-ai/Apertus-70B-2509")
const instruct = await getTokenizer("apertus-instruct")

console.log(base === instruct)
```
