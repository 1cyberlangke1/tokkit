# @cyberlangke/tokkit-nanbeige

Nanbeige 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `nanbeige4`
  - 覆盖 `Nanbeige/Nanbeige4.1-3B`
  - 也聚合当前确认完全复用同一 tokenizer 的：
    - `Nanbeige/Nanbeige4-3B-Thinking-2510`
    - `Nanbeige/Nanbeige4-3B-Thinking-2511`
    - `Nanbeige/ToolMind-Web-3B`
- `nanbeige4-base`
  - 覆盖 `Nanbeige/Nanbeige4-3B-Base`

说明：

- `Nanbeige4.1-3B`、`Nanbeige4-3B-Thinking-2510`、`Nanbeige4-3B-Thinking-2511` 与 `ToolMind-Web-3B` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `nanbeige4` family。
- `Nanbeige4-3B-Base` 的 `tokenizer.json` SHA256 与上面一组不同，因此单独保留 `nanbeige4-base` family。
- 当前官方 `text-generation` 主线里可直接纳入的 BPE tokenizer 已在这个子包内收口。

## 使用方法

```bash
npm install @cyberlangke/tokkit-nanbeige
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-nanbeige"

const base = await getTokenizer("nanbeige4-base")
const chat = await getTokenizer("Nanbeige/ToolMind-Web-3B")

console.log(base.encode("Hello, Nanbeige!"))
console.log(chat.encode("Hello, Nanbeige!"))
```
