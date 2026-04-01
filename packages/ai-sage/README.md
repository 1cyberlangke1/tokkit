# @cyberlangke/tokkit-ai-sage

AI-Sage 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `gigachat-20b-base`
  - 覆盖 `ai-sage/GigaChat-20B-A3B-base`
- `gigachat-20b-instruct`
  - 覆盖 `ai-sage/GigaChat-20B-A3B-instruct`
  - 也聚合当前确认完全复用同一 tokenizer 的 `ai-sage/GigaChat-20B-A3B-instruct-v1.5`
- `gigachat3`
  - 覆盖 `ai-sage/GigaChat3-10B-A1.8B-base`
  - 也聚合当前确认完全复用同一 tokenizer 的 `ai-sage/GigaChat3-10B-A1.8B`
  - 也聚合当前确认完全复用同一 tokenizer 的 `ai-sage/GigaChat3-702B-A36B-preview`
- `gigachat3.1`
  - 覆盖 `ai-sage/GigaChat3.1-10B-A1.8B`
  - 也聚合当前确认完全复用同一 tokenizer 的 `ai-sage/GigaChat3.1-702B-A36B`

当前不纳入：

- `ai-sage/*-GGUF`
- `ai-sage/*-bf16`
- `ai-sage/*-int8`

说明：

- `GigaChat-20B-A3B-instruct` 与 `GigaChat-20B-A3B-instruct-v1.5` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `gigachat-20b-instruct` family。
- `GigaChat3-10B-A1.8B-base`、`GigaChat3-10B-A1.8B` 与 `GigaChat3-702B-A36B-preview` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `gigachat3` family。
- `GigaChat3.1-10B-A1.8B` 与 `GigaChat3.1-702B-A36B` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `gigachat3.1` family。
- `GGUF`、`bf16`、`int8` 当前只视为发布格式衍生物，不作为独立支持目标。

## 使用方法

```bash
npm install @cyberlangke/tokkit-ai-sage
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-ai-sage"

const base = await getTokenizer("gigachat-20b-base")
const latest = await getTokenizer("ai-sage/GigaChat3.1-702B-A36B")

console.log(base.encode("Hello, AI-Sage!"))
console.log(latest.encode("Hello, AI-Sage!"))
```
