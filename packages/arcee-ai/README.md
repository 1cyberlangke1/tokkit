# @cyberlangke/tokkit-arcee-ai

Arcee AI 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `trinity-large-truebase`
  - 覆盖 `arcee-ai/Trinity-Large-TrueBase`
- `trinity-large`
  - 覆盖 `arcee-ai/Trinity-Large-Base`
  - 也聚合当前确认完全复用同一 tokenizer 的 `arcee-ai/Trinity-Large-Preview`
- `trinity-large-thinking`
  - 覆盖 `arcee-ai/Trinity-Large-Thinking`

当前不纳入：

- `arcee-ai/Arcee-Nova`
- `arcee-ai/Arcee-Spark`
- `arcee-ai/Arcee-Agent`

说明：

- `Trinity-Large-Base` 与 `Trinity-Large-Preview` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `trinity-large` family。
- `Trinity-Large-TrueBase` 与 `Trinity-Large-Thinking` 都各自保持独立 family。
- `Arcee-Nova` 当前许可证信号不是 MIT / Apache-2.0 兼容边界。
- `Arcee-Spark`、`Arcee-Agent` 当前视为专项模型线，不作为这一轮公开支持目标。

## 使用方法

```bash
npm install @cyberlangke/tokkit-arcee-ai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-arcee-ai"

const base = await getTokenizer("trinity-large")
const preview = await getTokenizer("arcee-ai/Trinity-Large-Preview")

console.log(base === preview)
```
