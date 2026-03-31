# @cyberlangke/tokkit-h2oai

H2O.ai 官方 Danube tokenizer 的 tokkit 子包。

当前内置 family：

- `danube`
  - 覆盖 `h2oai/h2o-danube-1.8b-base`
  - 也聚合当前确认完全复用同一 tokenizer 的 `h2oai/h2o-danube-1.8b-chat`
- `danube2`
  - 覆盖 `h2oai/h2o-danube2-1.8b-base`
  - 也聚合当前确认完全复用同一 tokenizer 的：
    - `h2oai/h2o-danube2-1.8b-chat`
    - `h2oai/h2o-danube3-500m-base`
    - `h2oai/h2o-danube3-4b-base`
- `danube3-500m-chat`
  - 覆盖 `h2oai/h2o-danube3-500m-chat`
- `danube3-4b-chat`
  - 覆盖 `h2oai/h2o-danube3-4b-chat`
- `danube3.1-4b-chat`
  - 覆盖 `h2oai/h2o-danube3.1-4b-chat`

当前不纳入：

- `h2oai/h2o-danube-1.8b-sft`
- `h2oai/h2o-danube2-1.8b-sft`
- `GGUF` / `AWQ` / `ONNX` 等导出对象
- `danube2-singlish-finetuned`
- `h2ogpt-*`、`h2ovl-*` 与其他旧微调 / 多模态路线

## 使用方法

```bash
npm install @cyberlangke/tokkit-h2oai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-h2oai"

const base = await getTokenizer("danube2")
const chat = await getTokenizer("h2oai/h2o-danube3-4b-chat")

console.log(base.encode("Hello, Danube!"))
console.log(chat.encode("Hello, Danube!"))
```
