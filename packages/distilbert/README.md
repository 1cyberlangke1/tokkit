# @cyberlangke/tokkit-distilbert

DistilBERT 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `distilgpt2`
  - 覆盖 `distilbert/distilgpt2`

说明：

- 当前 `distilbert` 官方 `text-generation` 主线只有 `distilgpt2`。
- 官方仓库直接公开 `tokenizer.json`、`tokenizer_config.json`、`vocab.json`、`merges.txt`。
- 当前该模型的 tokenizer 已作为一个独立 family 收口到这个子包。

## 使用方法

```bash
npm install @cyberlangke/tokkit-distilbert
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-distilbert"

const tokenizer = await getEncoding("distilbert/distilgpt2")

console.log(tokenizer.encode("Hello, distilgpt2!"))
```
