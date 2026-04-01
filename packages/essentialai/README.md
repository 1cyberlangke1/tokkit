# @cyberlangke/tokkit-essentialai

EssentialAI 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `rnj-1`
  - 覆盖 `EssentialAI/rnj-1`
  - 也聚合当前确认完全复用同一 tokenizer 的 `EssentialAI/rnj-1-instruct`

当前不纳入：

- `EssentialAI/eai-distill-0.5b`
- `EssentialAI/rnj-1-instruct-GGUF`

说明：

- `EssentialAI/rnj-1` 与 `EssentialAI/rnj-1-instruct` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `rnj-1` family。
- `EssentialAI/eai-distill-0.5b` 属于 distill 线，当前不作为公开支持目标。
- `GGUF` 当前只视为发布格式衍生物，不作为独立支持目标。

## 使用方法

```bash
npm install @cyberlangke/tokkit-essentialai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-essentialai"

const base = await getTokenizer("rnj-1")
const instruct = await getTokenizer("EssentialAI/rnj-1-instruct")

console.log(base === instruct)
```
