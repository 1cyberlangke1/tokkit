# @cyberlangke/tokkit-ibm-granite

IBM Granite 官方 tokenizer 的 tokkit 子包。

当前内置 family：

- `granite-3-instruct`
  - 覆盖 Granite 3.0 / 3.1 / 3.2 官方 instruct 主线
  - 例如：`ibm-granite/granite-3.0-2b-instruct`、`ibm-granite/granite-3.1-3b-a800m-instruct`、`ibm-granite/granite-3.2-8b-instruct-preview`
- `granite-3.3-base`
  - 覆盖 Granite 3.0 / 3.1 / 3.3 官方 base 主线
  - 也聚合当前确认完全复用同一 tokenizer 的 `granite-20b-code-*`、`granite-3b-code-instruct-*`、`granite-8b-code-instruct-*`
- `granite-3.3-instruct`
  - 覆盖 Granite 3.3 官方 instruct 主线
- `granite-7b-base`
  - 覆盖 `ibm-granite/granite-7b-base`
- `granite-7b-instruct`
  - 覆盖 `ibm-granite/granite-7b-instruct`
- `granite-code-base`
  - 覆盖 `granite-3b-code-base-*`、`granite-8b-code-base-*`、`granite-34b-code-base-8k`
  - 也聚合当前确认复用同一 tokenizer 的 `granite-34b-code-instruct-8k`
- `granite-4`
  - 覆盖 Granite 4.0 language 主线，包括 `350m`、`1b`、`micro` 以及 `h-*` 变体
- `granite-4-tiny-base-preview`
- `granite-4-tiny-preview`

当前不纳入：

- `GGUF` / `FP8` / `LoRA` / `aLoRA` / `granitelib-*`
- `guardian`、`functioncalling`、`math-prm`、`rag`、`uncertainty` 等专项模型
- 官方根目录缺少 `tokenizer.json` 的模型，例如 `ibm-granite/granite-3.0-3b-a800m-instruct`

## 使用方法

```bash
npm install @cyberlangke/tokkit-ibm-granite
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-ibm-granite"

const language = await getTokenizer("granite-3.3-base")
const code = await getTokenizer("granite-code-base")
const sevenB = await getTokenizer("ibm-granite/granite-7b-instruct")

console.log(language === code) // false
console.log(sevenB.encode("Hello, Granite!"))
```
