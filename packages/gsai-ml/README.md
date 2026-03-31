# @cyberlangke/tokkit-gsai-ml

GSAI-ML 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `llada`
  - 覆盖 `GSAI-ML/LLaDA-8B-Instruct`
  - 也聚合当前确认完全复用同一 tokenizer 的 `GSAI-ML/LLaDA-1.5`
- `llada-base`
  - 覆盖 `GSAI-ML/LLaDA-8B-Base`
- `refusion`
  - 覆盖 `GSAI-ML/ReFusion`

说明：

- `LLaDA-8B-Instruct` 与 `LLaDA-1.5` 的导出 `tokenizer.json` SHA256 一致，因此收口到同一个 `llada` family。
- `LLaDA-8B-Base` 的 `tokenizer.json` SHA256 与 `llada` 不同，因此保留独立的 `llada-base` family。
- `ReFusion` 官方仓库不直接公开 `tokenizer.json`，当前快照来自官方 `AutoTokenizer.from_pretrained(...).save_pretrained()` 基于仓库内 `vocab.json` / `merges.txt` / `added_tokens.json` 导出的标准 `tokenizer.json`。

## 使用方法

```bash
npm install @cyberlangke/tokkit-gsai-ml
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-gsai-ml"

const llada = await getTokenizer("llada")
const refusion = await getTokenizer("GSAI-ML/ReFusion")

console.log(llada.encode("Hello, GSAI!"))
console.log(refusion.encode("Hello, GSAI!"))
```
