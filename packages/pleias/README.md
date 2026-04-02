# @cyberlangke/tokkit-pleias

PleIAs 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- `PleIAs/Pleias-350m-Preview`
- `PleIAs/Pleias-1.2b-Preview`
- `PleIAs/Pleias-3b-Preview`
- `PleIAs/Pleias-Pico`
- `PleIAs/Baguettotron`
- `PleIAs/Monad`

当前不纳入：

- `PleIAs/Pleias-RAG-350M`
- `PleIAs/Pleias-RAG-1B`
- `PleIAs/OCRonos`

说明：

- 当前纳入的 `6` 个官方主线模型都公开 `tokenizer.json`，且都属于标准 `BPE + Split + ByteLevel` 路线。
- `Pleias-RAG-*` 当前模型页明确带有 `base_model:finetune:*` 标记，不纳入。
- `OCRonos` 是 OCR / 文档专项线，不纳入当前主线。

## 使用方法

```bash
npm install @cyberlangke/tokkit-pleias
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-pleias"

const pleias = await getEncoding("PleIAs/Pleias-350m-Preview")
const monad = await getEncoding("PleIAs/Monad")

console.log(pleias.encode("Hello, PleIAs"))
console.log(monad.encode("Hello, Monad"))
```
