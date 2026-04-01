# @cyberlangke/tokkit-cerebras

Cerebras 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `cerebras-gpt`
  - 覆盖 `cerebras/Cerebras-GPT-111M`
  - 也聚合当前确认完全复用同一 tokenizer 的 `cerebras/Cerebras-GPT-256M`
  - 也聚合当前确认完全复用同一 tokenizer 的 `cerebras/Cerebras-GPT-590M`
  - 也聚合当前确认完全复用同一 tokenizer 的 `cerebras/Cerebras-GPT-1.3B`
  - 也聚合当前确认完全复用同一 tokenizer 的 `cerebras/Cerebras-GPT-2.7B`
  - 也聚合当前确认完全复用同一 tokenizer 的 `cerebras/Cerebras-GPT-6.7B`
  - 也聚合当前确认完全复用同一 tokenizer 的 `cerebras/Cerebras-GPT-13B`
  - 也聚合当前确认完全复用同一 tokenizer 的 `cerebras/btlm-3b-8k-base`
- `btlm-3b-8k-chat`
  - 覆盖 `cerebras/btlm-3b-8k-chat`

当前不纳入：

- `cerebras/REAP-*`
- `cerebras/Cerebras-LLaVA-*`
- `cerebras/DocChat*`
- `cerebras/Llama-*CBHybrid*`
- `cerebras/Cerebras-GPT-Intermediate`

说明：

- `cerebras/Cerebras-GPT-*` 与 `cerebras/btlm-3b-8k-base` 的 `tokenizer.json` SHA256 一致，因此统一收口到 `cerebras-gpt`。
- `cerebras/btlm-3b-8k-chat` 使用另一组 tokenizer，因此单独保留 `btlm-3b-8k-chat` family。
- 为了兼容按模型线调用，`btlm-3b-8k` 作为 `cerebras-gpt` 的 family alias 保留。

## 使用方法

```bash
npm install @cyberlangke/tokkit-cerebras
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-cerebras"

const gpt = await getTokenizer("cerebras/Cerebras-GPT-13B")
const btlmBase = await getTokenizer("btlm-3b-8k")
const btlmChat = await getTokenizer("cerebras/btlm-3b-8k-chat")

console.log(gpt === btlmBase)
console.log(btlmChat.encode("Hello from Cerebras"))
```
